from __future__ import annotations

from datetime import date
from typing import Any

from .http_client import request_with_fallbacks
from .settings import get_env, get_int_env

LENS_API_URL = get_env("TECHTRACE_LENS_API_URL", "https://api.lens.org/patent/search")
LENS_TIMEOUT_SEC = get_int_env("TECHTRACE_LENS_TIMEOUT_SEC", 25)


def search_lens_patents(
    *,
    company: str,
    keywords: list[str],
    max_results: int = 6,
    time_range: int = 10,
) -> list[dict[str, Any]]:
    api_key = get_env("TECHTRACE_LENS_API_KEY").strip()
    if not api_key:
        raise RuntimeError("未配置 TECHTRACE_LENS_API_KEY。")

    response = request_with_fallbacks(
        method="POST",
        urls=[LENS_API_URL],
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        json=_build_query(company=company, keywords=keywords, max_results=max_results),
        timeout=LENS_TIMEOUT_SEC,
        raise_for_status=False,
    )

    if response.status_code in (401, 403):
        raise RuntimeError(
            "Lens API 返回 401/403。当前 token 未被授权、已失效，或账户尚未开通 Patent API 访问权限。"
        )

    response.raise_for_status()
    payload = response.json()
    records = _extract_records(payload)

    patents: list[dict[str, Any]] = []
    for record in records:
        patent = _normalize_record(record)
        if not patent:
            continue
        if not _is_recent_enough(patent["filingDate"], time_range):
            continue
        if not _matches_relevance(patent, company, keywords):
            continue
        patents.append(patent)

    return patents[:max_results]


def _build_query(*, company: str, keywords: list[str], max_results: int) -> dict[str, Any]:
    should_clauses: list[dict[str, Any]] = []
    if company.strip():
        should_clauses.append(
            {
                "query_string": {
                    "query": f'"{company.strip()}"',
                    "fields": ["applicant.name", "owner_all.name"],
                    "default_operator": "AND",
                }
            }
        )

    cleaned_keywords = [keyword.strip() for keyword in keywords if keyword.strip()]
    if cleaned_keywords:
        keyword_query = " OR ".join(f'"{keyword}"' for keyword in cleaned_keywords[:4])
        should_clauses.append(
            {
                "query_string": {
                    "query": keyword_query,
                    "fields": ["title", "abstract", "claims", "description"],
                    "default_operator": "OR",
                }
            }
        )

    if not should_clauses:
        should_clauses.append({"match_all": {}})

    return {
        "query": {
            "bool": {
                "should": should_clauses,
                "minimum_should_match": 1,
            }
        },
        "size": max_results,
    }


def _extract_records(payload: dict[str, Any]) -> list[dict[str, Any]]:
    for key in ("data", "results", "publications"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
    return []


def _normalize_record(record: dict[str, Any]) -> dict[str, Any] | None:
    lens_id = _extract_string(record.get("lens_id"), record.get("lensId"))
    title = _extract_string(
        _dig(record, "biblio", "invention_title"),
        _dig(record, "title"),
    )
    abstract = _extract_string(
        _dig(record, "abstract"),
        _dig(record, "biblio", "abstract"),
    )
    applicants = _extract_names(_dig(record, "biblio", "parties", "applicants"))
    inventors = _extract_names(_dig(record, "biblio", "parties", "inventors"))
    jurisdiction = _extract_string(record.get("jurisdiction"))
    doc_number = _extract_string(record.get("doc_number"), _dig(record, "doc_key", "doc_number"))
    kind = _extract_string(record.get("kind"), _dig(record, "doc_key", "kind"))
    filing_date = _parse_date(
        _extract_string(
            record.get("date_published"),
            record.get("publication_date"),
            _dig(record, "biblio", "publication_reference", "date"),
        )
    )

    if not any([lens_id, doc_number, title]):
        return None

    patent_no = "".join(part for part in [jurisdiction, doc_number, kind] if part) or lens_id or "LensPatent"
    cited_by = _extract_int(
        _dig(record, "citations", "patent_count"),
        _dig(record, "references_cited", "patent_count"),
        _dig(record, "cited_by_patent_count"),
    )

    if lens_id:
        source_url = f"https://www.lens.org/lens/patent/{lens_id}"
    else:
        source_url = f"https://www.lens.org/lens/search/patent/list?q={patent_no}"

    return {
        "title": title or patent_no,
        "patentNo": patent_no,
        "applicant": applicants[0] if applicants else "公开信息待补",
        "inventors": inventors or ["公开信息待补"],
        "filingDate": filing_date,
        "abstract": abstract or "Lens.org 返回了专利元数据，但未附带摘要文本。",
        "source": "Lens.org",
        "sourceUrl": source_url,
        "citedBy": cited_by,
    }


def _dig(data: Any, *path: str) -> Any:
    current = data
    for key in path:
        if not isinstance(current, dict) or key not in current:
            return None
        current = current[key]
    return current


def _extract_string(*values: Any) -> str:
    for value in values:
        if value is None:
            continue
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, list):
            for item in value:
                extracted = _extract_string(item)
                if extracted:
                    return extracted
        if isinstance(value, dict):
            for key in ("text", "value", "name", "full_name", "extracted_name"):
                extracted = _extract_string(value.get(key))
                if extracted:
                    return extracted
    return ""


def _extract_names(value: Any) -> list[str]:
    names: list[str] = []
    _collect_names(value, names)
    unique: list[str] = []
    for name in names:
        if name not in unique:
            unique.append(name)
    return unique[:6]


def _collect_names(value: Any, bucket: list[str]) -> None:
    if isinstance(value, str):
        cleaned = value.strip()
        if cleaned:
            bucket.append(cleaned)
        return

    if isinstance(value, list):
        for item in value:
            _collect_names(item, bucket)
        return

    if isinstance(value, dict):
        for key in ("extracted_name", "name", "full_name", "text", "value"):
            if key in value:
                _collect_names(value[key], bucket)
        return


def _extract_int(*values: Any) -> int:
    for value in values:
        if isinstance(value, bool):
            continue
        if isinstance(value, int):
            return value
        if isinstance(value, str) and value.isdigit():
            return int(value)
        if isinstance(value, list):
            return len(value)
    return 0


def _parse_date(raw_value: str) -> str:
    if raw_value[:4].isdigit():
        if len(raw_value) >= 10 and raw_value[4] == "-":
            return raw_value[:10]
        return f"{raw_value[:4]}-01-01"
    return f"{date.today().year}-01-01"


def _matches_relevance(patent: dict[str, Any], company: str, keywords: list[str]) -> bool:
    haystack = " ".join(
        [
            patent.get("title", ""),
            patent.get("abstract", ""),
            patent.get("applicant", ""),
            " ".join(patent.get("inventors", [])),
        ]
    ).lower()
    company_match = company.strip() and company.strip().lower() in haystack
    keyword_match = any(keyword.lower() in haystack for keyword in keywords if keyword.strip())
    return bool(company_match or keyword_match)


def _is_recent_enough(filing_date: str, time_range: int) -> bool:
    if not filing_date[:4].isdigit():
        return True
    year = int(filing_date[:4])
    threshold = date.today().year - max(1, time_range) + 1
    return year >= threshold
