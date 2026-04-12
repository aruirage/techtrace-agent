from __future__ import annotations

import html
import re
from datetime import date
from typing import Any
from urllib.parse import urlencode

from .http_client import request_with_fallbacks
from .settings import get_env, get_int_env

GOOGLE_PATENTS_BASE_URL = get_env("TECHTRACE_GOOGLE_PATENTS_BASE_URL", "https://patents.google.com")
GOOGLE_PATENTS_XHR_URL = get_env("TECHTRACE_GOOGLE_PATENTS_XHR_URL", "https://patents.google.com/xhr/query")
SERPAPI_SEARCH_URL = get_env("TECHTRACE_SERPAPI_SEARCH_URL", "https://serpapi.com/search.json")
GOOGLE_PATENTS_TIMEOUT_SEC = get_int_env("TECHTRACE_GOOGLE_PATENTS_TIMEOUT_SEC", 20)

REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

PATENT_URL_RE = re.compile(r"/patent/[^\"'\\s]+", re.I)


def search_google_patents(
    *,
    company: str,
    keywords: list[str],
    max_results: int = 6,
    time_range: int = 10,
) -> list[dict[str, Any]]:
    serpapi_key = get_env("TECHTRACE_GOOGLE_PATENTS_API_KEY").strip()
    if serpapi_key:
        return _search_google_patents_serpapi(
            company=company,
            keywords=keywords,
            api_key=serpapi_key,
            max_results=max_results,
            time_range=time_range,
        )

    query_plans = [
        {"company": company, "keywords": keywords},
        {"company": "", "keywords": keywords},
    ]

    seen_patents: set[str] = set()
    collected: list[dict[str, Any]] = []
    last_error: Exception | None = None

    for plan in query_plans:
        try:
            results = _search_google_patents_xhr(
                company=plan["company"],
                keywords=plan["keywords"],
                max_results=max_results,
                time_range=time_range,
            )
        except Exception as exc:
            last_error = exc
            continue

        for patent in results:
            if patent["patentNo"] in seen_patents:
                continue
            seen_patents.add(patent["patentNo"])
            collected.append(patent)
            if len(collected) >= max_results:
                return collected[:max_results]

    if collected:
        return collected[:max_results]

    try:
        return _search_google_patents_page_fallback(
            company="",
            keywords=keywords,
            max_results=max_results,
            time_range=time_range,
        )
    except Exception:
        if last_error is not None:
            raise last_error
        raise


def _search_google_patents_serpapi(
    *,
    company: str,
    keywords: list[str],
    api_key: str,
    max_results: int,
    time_range: int,
) -> list[dict[str, Any]]:
    query_plans = [
        {"company": company, "keywords": keywords},
        {"company": "", "keywords": keywords},
    ]

    seen_patent_numbers: set[str] = set()
    patents: list[dict[str, Any]] = []
    last_error: Exception | None = None

    for plan in query_plans:
        try:
            organic_results = _fetch_serpapi_results(
                company=plan["company"],
                keywords=plan["keywords"],
                api_key=api_key,
                max_results=max_results,
                time_range=time_range,
            )
        except Exception as exc:
            last_error = exc
            continue

        for item in organic_results:
            patent = _normalize_serpapi_item(item)
            if not patent:
                continue
            if patent["patentNo"] in seen_patent_numbers:
                continue
            if not _matches_relevance(patent, plan["company"], plan["keywords"]):
                continue
            if not _is_recent_enough(patent["filingDate"], time_range):
                continue

            seen_patent_numbers.add(patent["patentNo"])
            patents.append(patent)
            if len(patents) >= max_results:
                return patents[:max_results]

    if patents:
        return patents[:max_results]

    if last_error is not None:
        raise last_error
    return []


def _fetch_serpapi_results(
    *,
    company: str,
    keywords: list[str],
    api_key: str,
    max_results: int,
    time_range: int,
) -> list[dict[str, Any]]:
    query = _build_query(company="", keywords=keywords)
    threshold_year = date.today().year - max(1, time_range) + 1
    after = f"filing:{threshold_year}0101"
    params: dict[str, Any] = {
        "engine": "google_patents",
        "api_key": api_key,
        "q": query,
        "num": max(10, min(100, max_results * 10)),
        "page": 1,
        "sort": "new",
        "dups": "language",
        "patents": "true",
        "scholar": "false",
        "after": after,
        "no_cache": "true",
        "output": "json",
    }
    if company.strip():
        params["assignee"] = company.strip()

    response = request_with_fallbacks(
        method="GET",
        urls=[SERPAPI_SEARCH_URL],
        timeout=GOOGLE_PATENTS_TIMEOUT_SEC,
        headers=REQUEST_HEADERS,
        params=params,
    )
    payload = response.json()

    error_message = payload.get("error")
    if isinstance(error_message, str) and error_message.strip():
        raise RuntimeError(f"SerpApi Google Patents 返回错误：{error_message.strip()}")

    organic_results = payload.get("organic_results", [])
    if not isinstance(organic_results, list):
        return []
    return [item for item in organic_results if isinstance(item, dict) and not item.get("is_scholar")]


def _search_google_patents_xhr(
    *,
    company: str,
    keywords: list[str],
    max_results: int,
    time_range: int,
) -> list[dict[str, Any]]:
    query = _build_query(company=company, keywords=keywords)
    inner_url = urlencode({"q": query, "num": max(30, max_results * 10)})
    payload = request_with_fallbacks(
        method="GET",
        urls=[GOOGLE_PATENTS_XHR_URL],
        timeout=GOOGLE_PATENTS_TIMEOUT_SEC,
        headers=REQUEST_HEADERS,
        params={"url": inner_url},
    ).json()

    items = _extract_xhr_items(payload)
    patents: list[dict[str, Any]] = []
    seen_patent_numbers: set[str] = set()

    for item in items:
        patent = _normalize_xhr_item(item)
        if not patent:
            continue
        if patent["patentNo"] in seen_patent_numbers:
            continue
        if not _matches_relevance(patent, company, keywords):
            continue
        if not _is_recent_enough(patent["filingDate"], time_range):
            continue

        seen_patent_numbers.add(patent["patentNo"])
        patents.append(patent)
        if len(patents) >= max_results:
            break

    return patents


def _search_google_patents_page_fallback(
    *,
    company: str,
    keywords: list[str],
    max_results: int,
    time_range: int,
) -> list[dict[str, Any]]:
    query = " ".join([company.strip(), *keywords[:3]]).strip() or "patent"
    response = request_with_fallbacks(
        method="GET",
        urls=[GOOGLE_PATENTS_BASE_URL],
        timeout=GOOGLE_PATENTS_TIMEOUT_SEC,
        headers=REQUEST_HEADERS,
        params={"q": query, "oq": query},
    )

    patent_paths = []
    for match in PATENT_URL_RE.finditer(response.text):
        value = html.unescape(match.group(0)).strip()
        if value not in patent_paths:
            patent_paths.append(value)

    patents: list[dict[str, Any]] = []
    for path in patent_paths[:max_results]:
        patent_url = f"{GOOGLE_PATENTS_BASE_URL.rstrip('/')}{path}"
        patent_no = path.split("/patent/", 1)[-1].split("/", 1)[0]
        patents.append(
            {
                "title": patent_no,
                "patentNo": patent_no,
                "applicant": "公开信息待补",
                "inventors": ["公开信息待补"],
                "filingDate": f"{date.today().year}-01-01",
                "abstract": "Google Patents 结果页已命中该专利，建议点击来源页继续查看摘要与权利要求。",
                "source": "Google Patents",
                "sourceUrl": patent_url,
                "citedBy": 0,
            }
        )

    return [patent for patent in patents if _is_recent_enough(patent["filingDate"], time_range)][:max_results]


def _build_query(*, company: str, keywords: list[str]) -> str:
    parts: list[str] = []
    if company.strip():
        parts.append(f"({company.strip()})")

    keyword_parts: list[str] = []
    for keyword in keywords[:4]:
        cleaned = keyword.strip()
        if not cleaned:
            continue
        keyword_parts.extend(_expand_keyword(cleaned))

    if keyword_parts:
        parts.append("(" + " OR ".join(dict.fromkeys(keyword_parts)) + ")")

    return " ".join(parts) or "(patent)"


def _expand_keyword(keyword: str) -> list[str]:
    expansions = [keyword]
    normalized = keyword.lower()
    glossary = {
        "固态激光雷达": ["solid state lidar", "lidar"],
        "激光雷达": ["lidar", "laser radar"],
        "mems振镜": ["MEMS mirror", "MEMS scanner", "MEMS"],
        "fmcw": ["FMCW", "frequency modulated continuous wave"],
        "光芯片": ["photonic chip", "optical chip"],
        "碳化硅": ["silicon carbide", "SiC"],
    }

    for source, aliases in glossary.items():
        if source.lower() in normalized:
            expansions.extend(aliases)

    return expansions


def _extract_xhr_items(payload: dict[str, Any]) -> list[dict[str, Any]]:
    results = payload.get("results", {})
    if not isinstance(results, dict):
        return []

    clusters = results.get("cluster", [])
    items: list[dict[str, Any]] = []
    for cluster in clusters if isinstance(clusters, list) else []:
        if not isinstance(cluster, dict):
            continue
        for result in cluster.get("result", []):
            if isinstance(result, dict):
                items.append(result)
    return items


def _normalize_serpapi_item(item: dict[str, Any]) -> dict[str, Any] | None:
    patent_no = _extract_string(item.get("publication_number")) or _extract_patent_no_from_path(
        _extract_string(item.get("patent_id"))
    )
    patent_url = _extract_string(item.get("patent_link"))
    filing_date = _parse_date(
        _extract_string(
            item.get("filing_date"),
            item.get("priority_date"),
            item.get("publication_date"),
        )
    )
    title = _extract_string(item.get("title"))
    applicant = _extract_string(item.get("assignee"))
    inventors = _normalize_names(item.get("inventor"))
    abstract = _extract_string(item.get("snippet"))

    if not any([patent_no, patent_url, title]):
        return None

    return {
        "title": title or patent_no or "Google Patents 条目",
        "patentNo": patent_no or patent_url or "GooglePatents",
        "applicant": applicant or "公开信息待补",
        "inventors": inventors or ["公开信息待补"],
        "filingDate": filing_date,
        "abstract": abstract or "SerpApi 已返回专利条目，但当前结果未附带摘要。",
        "source": "Google Patents",
        "sourceUrl": patent_url or _build_patent_url(_extract_string(item.get("patent_id"))),
        "citedBy": _extract_int(item.get("cited_by_count"), item.get("extracted_cited_by")),
    }


def _normalize_xhr_item(item: dict[str, Any]) -> dict[str, Any] | None:
    patent = item.get("patent", {}) if isinstance(item.get("patent"), dict) else {}
    patent_path = _extract_string(item.get("id"), item.get("patent_id"))
    patent_url = _build_patent_url(patent_path)
    patent_no = (
        _extract_string(patent.get("publication_number"), patent.get("patent_number"))
        or _extract_patent_no_from_path(patent_path)
    )
    title = _extract_string(patent.get("title"), item.get("title"))
    abstract = _extract_string(patent.get("snippet"), patent.get("abstract"), item.get("snippet"))
    applicant = _extract_string(patent.get("assignee"), patent.get("applicant"))
    inventors = _normalize_names(patent.get("inventor"), patent.get("inventors"))
    filing_date = _parse_date(
        _extract_string(
            patent.get("filing_date"),
            patent.get("priority_date"),
            patent.get("publication_date"),
        )
    )
    cited_by = _extract_int(item.get("cited_by_count"), patent.get("cited_by_count"))

    if not any([patent_no, title, patent_path]):
        return None

    return {
        "title": title or patent_no or "Google Patents 条目",
        "patentNo": patent_no or patent_path or "GooglePatents",
        "applicant": applicant or "公开信息待补",
        "inventors": inventors or ["公开信息待补"],
        "filingDate": filing_date,
        "abstract": abstract or "Google Patents XHR 结果未附带摘要，建议打开来源页查看完整公开文本。",
        "source": "Google Patents",
        "sourceUrl": patent_url,
        "citedBy": cited_by,
    }


def _extract_string(*values: Any) -> str:
    for value in values:
        if value is None:
            continue
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, dict):
            for key in ("text", "value", "name", "title"):
                extracted = _extract_string(value.get(key))
                if extracted:
                    return extracted
        if isinstance(value, list):
            for item in value:
                extracted = _extract_string(item)
                if extracted:
                    return extracted
    return ""


def _normalize_names(*values: Any) -> list[str]:
    names: list[str] = []
    for value in values:
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
        for key in ("name", "text", "value", "inventor_name"):
            if key in value:
                _collect_names(value[key], bucket)


def _build_patent_url(patent_path: str) -> str:
    if patent_path.startswith("http"):
        return patent_path
    if patent_path.startswith("/"):
        return f"{GOOGLE_PATENTS_BASE_URL.rstrip('/')}{patent_path}"
    if patent_path.startswith("patent/"):
        return f"{GOOGLE_PATENTS_BASE_URL.rstrip('/')}/{patent_path}"
    if patent_path:
        return f"{GOOGLE_PATENTS_BASE_URL.rstrip('/')}/patent/{patent_path}"
    return GOOGLE_PATENTS_BASE_URL


def _extract_patent_no_from_path(path: str) -> str:
    if not path:
        return ""
    if "/patent/" in path:
        path = path.split("/patent/", 1)[-1]
    return path.split("/", 1)[0]


def _parse_date(raw_text: str) -> str:
    if raw_text[:4].isdigit():
        if len(raw_text) >= 10 and raw_text[4] == "-":
            return raw_text[:10]
        return f"{raw_text[:4]}-01-01"
    return f"{date.today().year}-01-01"


def _extract_int(*values: Any) -> int:
    for value in values:
        if isinstance(value, bool):
            continue
        if isinstance(value, int):
            return value
        if isinstance(value, str):
            normalized = value.replace(",", "").strip()
            if normalized.isdigit():
                return int(normalized)
    return 0


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
