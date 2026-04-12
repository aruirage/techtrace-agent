from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date, datetime
import re
from typing import Any
from urllib.parse import quote_plus
from uuid import uuid4

from .arxiv_client import fetch_and_parse_arxiv
from .google_patents_client import search_google_patents
from .lens_client import search_lens_patents
from .openai_client import summarize_analysis_with_openai
from .public_web_client import fetch_public_pages
from .pdf_utils import extract_patent_records_from_text
from .settings import get_env

SOURCE_LABELS = {
    "google": "Google Patents",
    "lens": "Lens.org",
    "arxiv": "arXiv",
    "public_web": "公开网页",
}

PATENT_SOURCE_IDS = ("google", "lens")

ROLE_OPTIONS = {
    "tech_expert": "技术专家",
    "ex_executive": "前高管",
    "industry_analyst": "行业分析师",
    "ip_lawyer": "知识产权律师",
}

STAGE_OPTIONS = {
    "screening": "初筛（5-8条快速判断）",
    "deep_dd": "深度尽调（12-15条全面验证）",
}

SUPPLEMENTAL_TYPE_OPTIONS = {
    "cnipa_patent": "CNIPA 专利导出",
    "whitepaper": "技术白皮书",
    "test_report": "测试/验证报告",
    "other": "其他材料",
}

INVENTOR_POOL = [
    ("张明远", "CTO"),
    ("李晓峰", "算法负责人"),
    ("陈思雨", "系统架构师"),
    ("赵海洋", "硬件研发负责人"),
    ("刘芳", "光学负责人"),
    ("王强", "平台工程负责人"),
]

DANGER_SIGNALS = [
    {
        "phrase": "我们参考了公开论文",
        "interpretation": "可能意味着核心技术建立在公开研究基础上，自研成分需要继续追问。",
        "severity": "medium",
    },
    {
        "phrase": "关键指标还在持续优化",
        "interpretation": "技术指标可能尚未收敛，工程化成熟度仍需验证。",
        "severity": "medium",
    },
    {
        "phrase": "量产正在推进中",
        "interpretation": "需要补充具体良率、交付节奏与客户验证证据，否则量产表述可信度有限。",
        "severity": "high",
    },
    {
        "phrase": "我们的优势主要是团队",
        "interpretation": "可能暗示技术或数据护城河仍弱，优势更依赖个人能力。",
        "severity": "high",
    },
]

SUPPLEMENTAL_MARKERS = {
    "prototype": ["样机", "原型", "prototype", "demo", "pilot line", "试产", "中试"],
    "qualification": ["验证", "认证", "车规", "qualification", "aec-q", "reliability", "可靠性"],
    "customer": ["客户", "订单", "定点", "导入", "客户验证", "design win", "purchase order"],
    "production": ["量产", "交付", "产线", "爬坡", "良率", "production", "yield", "shipment"],
    "data": ["测试", "数据", "benchmark", "dataset", "实验", "测试报告", "sample size"],
}


def build_analysis(
    *,
    company: str,
    keywords: str,
    sources: list[str],
    public_urls: list[str],
    time_range: int,
    role: str,
    stage: str,
    supplemental_materials: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    company_name = company.strip()
    keyword_list = _normalize_keywords(keywords)
    selected_sources = _normalize_sources(sources)
    selected_patent_sources = [source for source in PATENT_SOURCE_IDS if source in selected_sources]
    selected_role = role if role in ROLE_OPTIONS else "tech_expert"
    selected_stage = stage if stage in STAGE_OPTIONS else "deep_dd"
    normalized_supplemental_materials = _normalize_supplemental_materials(supplemental_materials or [])
    supplemental_text = _build_supplemental_text(normalized_supplemental_materials)
    selected_supplemental_types = _collect_supplemental_types(normalized_supplemental_materials)
    selected_supplemental_type = selected_supplemental_types[0] if len(selected_supplemental_types) == 1 else "other"
    public_web_sources = _build_public_web_sources(public_urls)
    public_web_text = "\n".join(source["text"] for source in public_web_sources if source["status"] == "live" and source["text"])
    analysis_context_text = "\n".join(chunk for chunk in [supplemental_text, public_web_text] if chunk.strip())
    supplemental_patents = _extract_supplemental_patents(normalized_supplemental_materials, company_name)

    patents, patent_source_details = _build_patents(
        company=company_name,
        keywords=keyword_list,
        selected_patent_sources=selected_patent_sources,
        time_range=time_range,
        supplemental_patents=supplemental_patents,
    )
    papers, paper_error = _build_papers(keyword_list, selected_sources)
    inventors = _build_inventors(patents)
    tech_branches = _build_tech_branches(patents, keyword_list)
    citations = _build_citations(patents, papers)
    evolution_metrics = _build_evolution_metrics(patents)
    evolution_stage = _build_evolution_stage(keyword_list, patents, papers, evolution_metrics, analysis_context_text)
    product_lifecycle = _build_product_lifecycle(
        company=company_name,
        keywords=keyword_list,
        patents=patents,
        papers=papers,
        supplemental_text=analysis_context_text,
    )
    team_assessment = _build_team_assessment(
        company=company_name,
        keywords=keyword_list,
        patents=patents,
        inventors=inventors,
        supplemental_text=analysis_context_text,
    )
    tech_claims = _build_tech_claims(
        company_name,
        keyword_list,
        patents,
        papers,
        normalized_supplemental_materials,
        analysis_context_text,
        product_lifecycle,
        team_assessment,
    )
    barriers = _build_barriers(patents, papers, normalized_supplemental_materials, analysis_context_text, product_lifecycle, team_assessment)
    defensibility_conclusion = _build_defensibility_conclusion(company_name, barriers, evolution_stage, product_lifecycle, team_assessment)
    expert_profiles = _build_expert_profiles(company_name, keyword_list)
    interview_questions = _build_interview_questions(company_name, keyword_list, patents, analysis_context_text)

    analysis_meta = {
        "mode": "rules",
        "note": "未配置 OpenAI API，当前使用规则模板生成结构化结论。仅基于公开 API、用户提供的公开网页和上传材料，不涉及内部信息。",
        "model": None,
        "origin": "live",
    }

    openai_api_key = get_env("TECHTRACE_OPENAI_API_KEY").strip()
    if openai_api_key:
        try:
            ai_summary = summarize_analysis_with_openai(
                company=company_name,
                keywords=keyword_list,
                patents=patents,
                papers=papers,
                supplemental_text=analysis_context_text,
                evolution_description=evolution_stage["description"],
                trend_note=evolution_stage["trendNote"],
                defensibility_conclusion=defensibility_conclusion,
            )
        except Exception as exc:  # pragma: no cover - network variability
                analysis_meta = {
                    "mode": "rules",
                    "note": f"OpenAI 增强未启用，已回退为规则模板：{exc}",
                    "model": get_env("TECHTRACE_OPENAI_MODEL", "gpt-5"),
                    "origin": "live",
                }
        else:
            if ai_summary:
                evolution_stage["description"] = ai_summary["evolutionDescription"]
                evolution_stage["trendNote"] = ai_summary["trendNote"]
                defensibility_conclusion = ai_summary["defensibilityConclusion"]
                for claim in tech_claims:
                    if claim["id"] == "CLAIM-003":
                        claim["evidence"] = ai_summary["supplementalInsight"]
                        break
                analysis_meta = {
                    "mode": "ai_enhanced",
                    "note": "已启用 OpenAI，对技术演进、壁垒判断和 PDF 追问点进行了增强总结。",
                    "model": get_env("TECHTRACE_OPENAI_MODEL", "gpt-5"),
                    "origin": "live",
                }

    source_coverage = _build_source_coverage(
        selected_sources=selected_sources,
        patent_source_details=patent_source_details,
        papers=papers,
        paper_error=paper_error,
        public_web_sources=public_web_sources,
        supplemental_materials=normalized_supplemental_materials,
        supplemental_patent_count=len(supplemental_patents),
    )

    company_info = {
        "name": company_name,
        "englishName": company_name,
        "founded": "公开信息待补",
        "headquarters": "公开信息待补",
        "stage": product_lifecycle["stage"],
        "employees": "公开信息待补",
        "techKeywords": keyword_list,
        "industry": "硬科技技术溯源",
        "totalPatents": len(patents),
        "inventionPatents": len(patents),
        "utilityModels": 0,
    }

    return {
        "analysisId": str(uuid4()),
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "request": {
            "company": company_name,
            "keywords": ", ".join(keyword_list),
            "sources": selected_sources,
            "publicUrls": [source["url"] for source in public_web_sources],
            "timeRange": str(time_range),
            "role": selected_role,
            "stage": selected_stage,
            "supplementalType": selected_supplemental_type,
            "supplementalTypes": selected_supplemental_types,
            "roleLabel": ROLE_OPTIONS[selected_role],
            "stageLabel": STAGE_OPTIONS[selected_stage],
        },
        "analysisMeta": analysis_meta,
        "companyInfo": company_info,
        "patents": patents,
        "inventors": inventors,
        "techBranches": tech_branches,
        "citations": citations,
        "papers": papers,
        "evolutionMetrics": evolution_metrics,
        "productLifecycle": product_lifecycle,
        "techClaims": tech_claims,
        "barriers": barriers,
        "defensibilityConclusion": defensibility_conclusion,
        "evolutionStage": evolution_stage,
        "teamAssessment": team_assessment,
        "expertProfiles": expert_profiles,
        "interviewQuestions": interview_questions,
        "dangerSignals": DANGER_SIGNALS,
        "sourceCoverage": source_coverage,
        "publicWebSources": [
            {
                "url": source["url"],
                "title": source["title"],
                "excerpt": source["excerpt"],
                "status": source["status"],
                "note": source["note"],
            }
            for source in public_web_sources
        ],
        "supplementalMaterial": normalized_supplemental_materials[0] if normalized_supplemental_materials else None,
        "supplementalMaterials": normalized_supplemental_materials,
    }


def _normalize_keywords(raw_keywords: str) -> list[str]:
    normalized = raw_keywords
    for separator in ("，", ";", "；", "|", "\n"):
        normalized = normalized.replace(separator, ",")

    candidates = [chunk.strip() for chunk in normalized.split(",")]
    keywords = [candidate for candidate in candidates if candidate]
    if not keywords:
        return ["核心技术"]

    deduped: list[str] = []
    for keyword in keywords:
        if keyword not in deduped:
            deduped.append(keyword)
    return deduped[:4]


def _normalize_sources(sources: list[str]) -> list[str]:
    normalized: list[str] = []
    for source in sources:
        if source in SOURCE_LABELS and source not in normalized:
            normalized.append(source)
    if normalized:
        return normalized
    return ["arxiv"]


def _build_public_web_sources(public_urls: list[str]) -> list[dict[str, Any]]:
    if not public_urls:
        return []
    return fetch_public_pages(public_urls)


def _normalize_supplemental_materials(supplemental_materials: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []

    for material in supplemental_materials:
        material_type = material.get("materialType", "other")
        if material_type not in SUPPLEMENTAL_TYPE_OPTIONS:
            material_type = "other"

        normalized.append(
            {
                **material,
                "materialType": material_type,
                "materialTypeLabel": SUPPLEMENTAL_TYPE_OPTIONS[material_type],
                "parsedPatentCount": 0,
            }
        )

    return normalized


def _collect_supplemental_types(supplemental_materials: list[dict[str, Any]]) -> list[str]:
    ordered_types: list[str] = []
    for material in supplemental_materials:
        material_type = material.get("materialType", "other")
        if material_type in SUPPLEMENTAL_TYPE_OPTIONS and material_type not in ordered_types:
            ordered_types.append(material_type)
    return ordered_types


def _build_supplemental_text(supplemental_materials: list[dict[str, Any]]) -> str:
    text_chunks = [
        str(material.get("extractedText", "")).strip()
        for material in supplemental_materials
        if str(material.get("extractedText", "")).strip()
    ]
    return "\n\n".join(text_chunks)


def _extract_supplemental_patents(
    supplemental_materials: list[dict[str, Any]],
    company_name: str,
) -> list[dict[str, Any]]:
    patents: list[dict[str, Any]] = []

    for material in supplemental_materials:
        material_text = str(material.get("extractedText", "")).strip()
        if material.get("materialType") != "cnipa_patent" or not material_text:
            continue

        parsed_records = extract_patent_records_from_text(material_text, company_name=company_name)
        material["parsedPatentCount"] = len(parsed_records)
        patents.extend(parsed_records)

    return patents


def _build_patents(
    *,
    company: str,
    keywords: list[str],
    selected_patent_sources: list[str],
    time_range: int,
    supplemental_patents: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    patents: list[dict[str, Any]] = []
    source_details: dict[str, dict[str, Any]] = {}

    for source_id in PATENT_SOURCE_IDS:
        if source_id not in selected_patent_sources:
            source_details[source_id] = {
                "status": "skipped",
                "count": 0,
                "note": "本次未选择该数据源。",
            }
            continue

        try:
            if source_id == "google":
                fetched = search_google_patents(
                    company=company,
                    keywords=keywords,
                    max_results=6,
                    time_range=time_range,
                )
                note = (
                    "已通过 SerpApi 实时拉取 Google Patents 结果。"
                    if get_env("TECHTRACE_GOOGLE_PATENTS_API_KEY").strip()
                    else "已通过 Google Patents 公开网页实时检索。"
                )
            else:
                fetched = search_lens_patents(
                    company=company,
                    keywords=keywords,
                    max_results=6,
                    time_range=time_range,
                )
                note = "已通过 Lens.org API 实时检索。"
        except Exception as exc:  # pragma: no cover - network variability
            source_details[source_id] = {
                "status": "error",
                "count": 0,
                "note": _format_source_error(source_id, str(exc)),
            }
            continue

        patents.extend(fetched)
        source_details[source_id] = {
            "status": "live",
            "count": len(fetched),
            "note": note if fetched else "检索完成，但当前未找到匹配结果。",
        }

    patents.extend(supplemental_patents)
    deduped = _dedupe_patents(patents)
    return _finalize_patents(deduped, keywords), source_details


def _dedupe_patents(patents: list[dict[str, Any]]) -> list[dict[str, Any]]:
    deduped: dict[str, dict[str, Any]] = {}

    for patent in sorted(patents, key=lambda item: item.get("filingDate", "")):
        patent_no = str(patent.get("patentNo", "")).replace(" ", "").upper()
        source_url = str(patent.get("sourceUrl", "")).strip()
        dedupe_key = patent_no or source_url or f"{patent.get('source', '')}|{patent.get('title', '')}"
        existing = deduped.get(dedupe_key)
        if existing is None or _patent_record_score(patent) > _patent_record_score(existing):
            deduped[dedupe_key] = patent
    return list(deduped.values())


def _finalize_patents(patents: list[dict[str, Any]], keywords: list[str]) -> list[dict[str, Any]]:
    finalized: list[dict[str, Any]] = []
    branch_seen: set[str] = set()
    core_cutoff = max(1, min(3, len(patents) // 2 + len(patents) % 2))

    for index, patent in enumerate(sorted(patents, key=lambda item: item.get("filingDate", "")), start=1):
        title = patent.get("title", "").strip() or f"{keywords[0]} 专利线索"
        abstract = patent.get("abstract", "").strip() or "公开页面未提供摘要。"
        filing_date = _normalize_date(patent.get("filingDate", ""))
        tech_branch = _pick_tech_branch(title=title, abstract=abstract, keywords=keywords)
        cited_by = _safe_int(patent.get("citedBy"))
        is_core = index <= core_cutoff or cited_by >= 5
        is_leap_node = is_core and tech_branch not in branch_seen
        branch_seen.add(tech_branch)

        finalized.append(
            {
                "id": f"P{index:03d}",
                "title": title,
                "patentNo": patent.get("patentNo", f"PAT-{index:03d}"),
                "applicant": patent.get("applicant", "公开信息待补"),
                "inventors": _normalize_names(patent.get("inventors", [])),
                "filingDate": filing_date,
                "abstract": abstract,
                "source": patent.get("source", "Google Patents"),
                "sourceUrl": patent.get("sourceUrl") or _build_patent_source_url(patent.get("source", "Google Patents"), patent.get("patentNo", title)),
                "citedBy": cited_by,
                "isCorePatent": is_core,
                "techBranch": tech_branch,
                "isLeapNode": is_leap_node,
            }
            | _estimate_patent_term(
                patent_no=patent.get("patentNo", f"PAT-{index:03d}"),
                filing_date=filing_date,
            )
        )

    return finalized


def _normalize_date(raw_date: str) -> str:
    if raw_date[:4].isdigit():
        if len(raw_date) >= 10 and raw_date[4] == "-":
            return raw_date[:10]
        return f"{raw_date[:4]}-01-01"
    return f"{date.today().year}-01-01"


def _pick_tech_branch(*, title: str, abstract: str, keywords: list[str]) -> str:
    haystack = f"{title} {abstract}".lower()
    for keyword in keywords:
        if keyword.lower() in haystack:
            return keyword
    return keywords[0]


def _normalize_names(raw_names: Any) -> list[str]:
    names: list[str] = []
    if isinstance(raw_names, list):
        for value in raw_names:
            if isinstance(value, str) and value.strip() and value.strip() not in names:
                names.append(value.strip())
    elif isinstance(raw_names, str) and raw_names.strip():
        names.append(raw_names.strip())

    if names:
        return names[:6]
    return ["公开信息待补"]


def _safe_int(value: Any) -> int:
    if isinstance(value, bool):
        return 0
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        normalized = value.replace(",", "").strip()
        if normalized.isdigit():
            return int(normalized)
    return 0


def _build_papers(keyword_list: list[str], selected_sources: list[str]) -> tuple[list[dict[str, Any]], str | None]:
    if "arxiv" not in selected_sources:
        return [], None

    query = " ".join(keyword_list[:3])
    try:
        raw_papers = fetch_and_parse_arxiv(query=query, max_results=6)
    except Exception as exc:  # pragma: no cover - network variability
        return [], str(exc)

    papers: list[dict[str, Any]] = []
    for index, paper in enumerate(raw_papers, start=1):
        title = paper.get("title", "")
        summary = paper.get("summary", "")
        published = paper.get("published", "")
        authors = paper.get("authors", [])
        link = paper.get("link", "")
        arxiv_id = paper.get("arxiv_id", "")
        relevance = _build_paper_relevance(keyword_list, title, summary)
        year = int(published[:4]) if published[:4].isdigit() else date.today().year

        papers.append(
            {
                "id": f"PAPER-{index:03d}",
                "title": title,
                "authors": ", ".join(authors[:4]) + (" 等" if len(authors) > 4 else ""),
                "journal": "arXiv",
                "year": year,
                "doi": "",
                "arxivId": arxiv_id,
                "relevance": relevance,
                "url": link,
                "summary": summary,
            }
        )

    return papers, None


def _build_paper_relevance(keyword_list: list[str], title: str, summary: str) -> str:
    haystack = f"{title} {summary}".lower()
    matches = [keyword for keyword in keyword_list if keyword.lower() in haystack]
    if matches:
        return f"与关键词 {', '.join(matches)} 高相关，可用于验证技术路线与学术前沿的贴合度。"
    return f"可作为 {keyword_list[0]} 方向的外围参考文献，辅助判断技术成熟度与研究热度。"


def _build_patent_source_url(source_label: str, query: str) -> str:
    encoded_query = quote_plus(query)
    if source_label == "CNIPA":
        return f"https://pss-system.cponline.cnipa.gov.cn/conventionalSearch?searchType=1&query={encoded_query}"
    if source_label == "Google Patents":
        return f"https://patents.google.com/?q={encoded_query}"
    return f"https://www.lens.org/lens/search/patent/list?q={encoded_query}"


def _patent_record_score(patent: dict[str, Any]) -> int:
    source = patent.get("source", "")
    source_priority = {
        "CNIPA": 4,
        "Lens.org": 3,
        "Google Patents": 2,
    }.get(source, 1)
    score = source_priority * 10
    if patent.get("abstract"):
        score += 3
    if patent.get("inventors"):
        score += 2
    if patent.get("applicant"):
        score += 2
    if patent.get("filingDate"):
        score += 2
    if patent.get("citedBy"):
        score += 1
    return score


def _estimate_patent_term(*, patent_no: str, filing_date: str) -> dict[str, Any]:
    jurisdiction, patent_kind = _parse_patent_identity(patent_no)
    filing_dt = _parse_iso_date(filing_date)
    if filing_dt is None:
        return {
            "estimatedExpireDate": None,
            "remainingTermYears": None,
            "termStatus": "unknown",
            "termConfidence": "low",
            "termNote": "缺少可靠申请日，无法估算保护期。",
        }

    today = date.today()
    confidence = "medium"

    if jurisdiction == "WO":
        return {
            "estimatedExpireDate": None,
            "remainingTermYears": None,
            "termStatus": "unknown",
            "termConfidence": "low",
            "termNote": "WO/PCT 公开号需结合进入国家阶段信息判断实际有效期。",
        }

    term_years = 20
    if jurisdiction == "CN" and patent_kind in {"U", "Y"}:
        term_years = 10
    elif jurisdiction == "US" and patent_kind in {"S", "D"}:
        term_years = 15
        confidence = "low"

    try:
        expire_date = date(filing_dt.year + term_years, filing_dt.month, filing_dt.day)
    except ValueError:
        expire_date = date(filing_dt.year + term_years, filing_dt.month, 28)

    remaining_days = (expire_date - today).days
    remaining_years = round(remaining_days / 365.25, 1)

    if remaining_days < 0:
        status = "expired_estimated"
    elif remaining_days <= 3 * 365:
        status = "near_expiry_estimated"
    else:
        status = "active_estimated"

    note = (
        f"基于 {jurisdiction} 专利常规保护期按申请日起 {term_years} 年估算，未校验授权状态、年费维持或无效记录。"
        if jurisdiction
        else "基于申请日做低置信度保护期估算，未校验法律状态。"
    )

    return {
        "estimatedExpireDate": expire_date.isoformat(),
        "remainingTermYears": remaining_years,
        "termStatus": status,
        "termConfidence": confidence,
        "termNote": note,
    }


def _parse_patent_identity(patent_no: str) -> tuple[str, str]:
    normalized = str(patent_no or "").replace(" ", "").upper()
    match = re.match(r"^([A-Z]{2})(\d+)([A-Z]\d?)?$", normalized)
    if not match:
        return "", ""
    jurisdiction = match.group(1)
    suffix = match.group(3) or ""
    patent_kind = suffix[:1] if suffix else ""
    return jurisdiction, patent_kind


def _parse_iso_date(raw_date: str) -> date | None:
    try:
        return datetime.strptime(raw_date[:10], "%Y-%m-%d").date()
    except Exception:
        return None


def _build_inventors(patents: list[dict[str, Any]]) -> list[dict[str, Any]]:
    patent_total = max(1, len(patents))
    counts = Counter(name for patent in patents for name in patent["inventors"])
    roles = dict(INVENTOR_POOL)

    inventors = []
    for name, count in counts.most_common():
        ratio = count / patent_total
        risk_note = "核心发明人集中度偏高" if ratio >= 0.4 else None
        inventors.append(
            {
                "name": name,
                "patentCount": count,
                "role": roles.get(name, "核心研发人员"),
                "riskNote": risk_note,
            }
        )
    return inventors


def _build_tech_branches(patents: list[dict[str, Any]], keywords: list[str]) -> list[dict[str, Any]]:
    grouped: dict[str, list[str]] = defaultdict(list)
    for patent in patents:
        grouped[patent["techBranch"]].append(patent["id"])

    branches = []
    for index, keyword in enumerate(keywords):
        branches.append(
            {
                "name": keyword,
                "description": f"围绕 {keyword} 的关键技术与工程化能力布局。",
                "patentIds": grouped.get(keyword, []),
                "isMainline": index < 2,
            }
        )
    return branches


def _build_citations(patents: list[dict[str, Any]], papers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    citations: list[dict[str, Any]] = []
    core_patents = [patent for patent in patents if patent["isCorePatent"]]

    for index, patent in enumerate(core_patents[: min(len(core_patents), len(papers))]):
        paper = papers[index]
        citations.append(
            {
                "fromId": patent["id"],
                "toId": paper["id"],
                "fromTitle": patent["title"],
                "toTitle": paper["title"],
                "type": "paper",
                "nature": "core" if index < 2 else "background",
            }
        )

    for index in range(1, len(patents)):
        citations.append(
            {
                "fromId": patents[index]["id"],
                "toId": patents[index - 1]["id"],
                "fromTitle": patents[index]["title"],
                "toTitle": patents[index - 1]["title"],
                "type": "patent",
                "nature": "background" if index % 2 else "core",
            }
        )

    return citations[:8]


def _build_evolution_metrics(patents: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not patents:
        return []

    counts: dict[int, int] = Counter(int(patent["filingDate"][:4]) for patent in patents if patent["filingDate"][:4].isdigit())
    cumulative = 0
    metrics = []
    for year in sorted(counts):
        cumulative += counts[year]
        metrics.append(
            {
                "year": year,
                "patentCount": counts[year],
                "cumulativePatents": cumulative,
            }
        )
    return metrics


def _build_evolution_stage(
    keywords: list[str],
    patents: list[dict[str, Any]],
    papers: list[dict[str, Any]],
    evolution_metrics: list[dict[str, Any]],
    supplemental_text: str,
) -> dict[str, Any]:
    patent_total = len(patents)
    paper_total = len(papers)
    latest_year = evolution_metrics[-1]["year"] if evolution_metrics else date.today().year

    if patent_total >= 7:
        stage = "工程应用优化"
    elif patent_total >= 3 or supplemental_text:
        stage = "样机验证 / 工程化推进"
    else:
        stage = "公开线索较少"

    if len(evolution_metrics) >= 2 and evolution_metrics[-1]["patentCount"] > evolution_metrics[0]["patentCount"]:
        trend = "加速"
    elif len(evolution_metrics) >= 2 and evolution_metrics[-1]["patentCount"] < evolution_metrics[0]["patentCount"]:
        trend = "放缓"
    elif patent_total:
        trend = "平稳"
    else:
        trend = "待验证"

    if patent_total:
        description = (
            f"当前公开线索显示，{keywords[0]} 为主线方向，最近一次专利节点出现在 {latest_year} 年，"
            f"共检索到 {patent_total} 件公开专利与 {paper_total} 篇论文线索，可初步用于判断路线连续性。"
        )
    elif supplemental_text:
        description = (
            f"公开专利线索较少，但上传材料对 {keywords[0]} 路线提供了补充信息，"
            "建议结合 PDF 中披露的样机、测试和客户验证证据继续交叉核验。"
        )
    else:
        description = (
            f"目前围绕 {keywords[0]} 的公开专利与论文线索有限，"
            "更适合先通过补充材料与专家访谈验证技术路线真实性。"
        )

    trend_note = (
        "建议优先核查最近 12-18 个月是否出现新的专利申请、引用增长或量产验证证据。"
        if patent_total
        else "建议优先补充白皮书、测试报告、客户导入材料或核心专利号，再进行深度尽调。"
    )
    timeline = [
        {
            "year": str(metric["year"]),
            "tech": patents[index]["techBranch"] if index < len(patents) else keywords[0],
        }
        for index, metric in enumerate(evolution_metrics[:4])
    ]

    return {
        "stage": stage,
        "trend": trend,
        "trendNote": trend_note,
        "description": description,
        "timeline": timeline,
    }


def _build_product_lifecycle(
    *,
    company: str,
    keywords: list[str],
    patents: list[dict[str, Any]],
    papers: list[dict[str, Any]],
    supplemental_text: str,
) -> dict[str, Any]:
    patent_stats = _collect_patent_stats(patents)
    markers = _collect_supplemental_markers(supplemental_text)
    evidence: list[str] = []

    if patents:
        evidence.append(
            f"公开专利 {patent_stats['patent_total']} 件，覆盖 {patent_stats['branch_count']} 个技术分支，最近 3 年新增 {patent_stats['recent_patent_count']} 件。"
        )
    if patent_stats["high_citation_count"]:
        evidence.append(
            f"高被引核心专利 {patent_stats['high_citation_count']} 件，说明关键技术节点已被外部持续关注。"
        )
    if papers:
        evidence.append(f"检索到 {len(papers)} 篇相关论文线索，可辅助判断路线仍在前沿演进还是进入工程化收敛。")
    evidence.extend(_build_signal_evidence(markers))

    lifecycle_score = 0
    lifecycle_score += min(40, patent_stats["patent_total"] * 5)
    lifecycle_score += min(18, patent_stats["recent_patent_count"] * 6)
    lifecycle_score += min(12, patent_stats["branch_count"] * 4)
    lifecycle_score += min(16, patent_stats["high_citation_count"] * 4)
    lifecycle_score += markers["prototype"] * 6
    lifecycle_score += markers["qualification"] * 6
    lifecycle_score += markers["customer"] * 7
    lifecycle_score += markers["production"] * 9

    if markers["production"] >= 2 or (
        patent_stats["patent_total"] >= 6
        and patent_stats["recent_patent_count"] >= 2
        and (markers["prototype"] + markers["qualification"]) >= 2
    ):
        stage = "规模化交付"
    elif markers["prototype"] >= 1 or markers["qualification"] >= 1 or patent_stats["patent_total"] >= 3:
        stage = "商业验证"
    elif patents or papers:
        stage = "产品验证"
    else:
        stage = "概念验证"

    confidence = _confidence_from_count(len(evidence))
    rationale = (
        f"{company} 当前更接近“{stage}”而非单纯概念阶段。"
        if patents or supplemental_text
        else f"{company} 当前公开技术线索有限，更适合归入“{stage}”。"
    )

    next_milestones = _build_lifecycle_milestones(stage, keywords[0], markers)
    key_risks = _build_lifecycle_risks(stage, patent_stats, markers)

    return {
        "stage": stage,
        "confidence": confidence,
        "summary": (
            f"生命周期判断基于公开专利连续性、近期工程化信号与补充材料中的验证节点。当前综合评分 {min(lifecycle_score, 100)}/100。"
        ),
        "rationale": rationale,
        "evidence": evidence[:5] or ["当前缺少足够公开信号，生命周期判断可信度较低。"],
        "nextMilestones": next_milestones,
        "keyRisks": key_risks,
    }


def _build_team_assessment(
    *,
    company: str,
    keywords: list[str],
    patents: list[dict[str, Any]],
    inventors: list[dict[str, Any]],
    supplemental_text: str,
) -> dict[str, Any]:
    patent_total = max(1, len(patents))
    members: list[dict[str, Any]] = []
    inventor_map: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for patent in patents:
        for inventor in patent["inventors"]:
            inventor_map[inventor].append(patent)

    for inventor in inventors[:4]:
        name = inventor["name"]
        owned_patents = inventor_map.get(name, [])
        covered_branches = sorted({patent["techBranch"] for patent in owned_patents})
        recent_patents = sum(1 for patent in owned_patents if _year_from_date(patent["filingDate"]) >= date.today().year - 2)
        explicit_profile = _extract_person_context(supplemental_text, name)
        domain_fit = "strong" if len(covered_branches) >= 2 or recent_patents >= 2 else "moderate" if owned_patents else "weak"
        dependency_risk = "high" if inventor["patentCount"] / patent_total >= 0.4 else "medium" if inventor["patentCount"] / patent_total >= 0.22 else "low"
        prior_experience = [explicit_profile] if explicit_profile else [
            f"公开专利持续覆盖 {', '.join(covered_branches[:2]) or keywords[0]} 方向。",
            "当前公开材料中缺少更完整的成员背景线索，建议后续访谈补证。",
        ]
        evidence = [
            f"署名出现在 {inventor['patentCount']} 件公开专利中。",
            f"负责或参与的技术分支: {', '.join(covered_branches) or keywords[0]}。",
        ]
        if inventor.get("riskNote"):
            evidence.append(inventor["riskNote"])

        members.append(
            {
                "name": name,
                "role": inventor["role"],
                "background": (
                    explicit_profile
                    if explicit_profile
                    else f"公开发明人线索显示其长期参与 {company} 的 {', '.join(covered_branches[:2]) or keywords[0]} 研发。"
                ),
                "priorExperience": prior_experience[:3],
                "contribution": f"当前主要贡献集中在 {', '.join(covered_branches[:2]) or keywords[0]} 路线推进与专利沉淀。",
                "domainFit": domain_fit,
                "dependencyRisk": dependency_risk,
                "evidence": evidence,
            }
        )

    if not members:
        members.append(
            {
                "name": "公开团队线索待补",
                "role": "核心团队",
                "background": "当前未检索到足够发明人或补充材料，无法建立核心团队公开线索画像。",
                "priorExperience": ["建议补充官网团队介绍、公开采访、白皮书或用户上传材料。"],
                "contribution": "暂无公开证据。",
                "domainFit": "weak",
                "dependencyRisk": "high",
                "evidence": ["当前仅有有限公开技术数据。"],
            }
        )

    strong_members = sum(1 for member in members if member["domainFit"] == "strong")
    overall_strength = "strong" if strong_members >= 2 and len(patents) >= 5 else "moderate" if patents else "weak"
    bench_risk = "high" if any(member["dependencyRisk"] == "high" for member in members) else "medium" if len(members) <= 2 else "low"
    key_risks = []
    if bench_risk == "high":
        key_risks.append("核心发明人集中度偏高，需确认是否存在关键人依赖。")
    if not supplemental_text.strip():
        key_risks.append("当前缺少成员背景、职责分工和公开团队介绍等线索。")
    if len(members) < 3:
        key_risks.append("公开团队覆盖面有限，尚不足以验证从研发到量产的完整组织能力。")

    return {
        "summary": (
            f"团队判断主要基于公开发明人分布、用户提供的公开网页与补充材料中的人物线索。已识别 {len(members)} 位关键成员，"
            f"整体匹配度为 {overall_strength}，板凳风险为 {bench_risk}。"
        ),
        "overallStrength": overall_strength,
        "benchRisk": bench_risk,
        "keyRisks": key_risks[:3] or ["公开团队证据有限，建议优先补充管理层与核心研发公开线索。"],
        "members": members,
    }


def _collect_patent_stats(patents: list[dict[str, Any]]) -> dict[str, Any]:
    years = [_year_from_date(patent["filingDate"]) for patent in patents]
    year_counts = Counter(years)
    recent_cutoff = date.today().year - 2
    recent_patent_count = sum(1 for year in years if year >= recent_cutoff)
    branch_count = len({patent["techBranch"] for patent in patents})
    citation_values = [patent["citedBy"] for patent in patents]
    high_citation_count = sum(1 for cited_by in citation_values if cited_by >= 10)
    max_inventor_count = max((len(inventor_patents) for inventor_patents in _group_patents_by_inventor(patents).values()), default=0)

    return {
        "patent_total": len(patents),
        "branch_count": branch_count,
        "recent_patent_count": recent_patent_count,
        "high_citation_count": high_citation_count,
        "avg_citation": round(sum(citation_values) / len(citation_values), 1) if citation_values else 0,
        "year_span": len(year_counts),
        "max_inventor_ratio": round(max_inventor_count / max(1, len(patents)), 2),
    }


def _group_patents_by_inventor(patents: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    inventor_map: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for patent in patents:
        for inventor in patent["inventors"]:
            inventor_map[inventor].append(patent)
    return inventor_map


def _collect_supplemental_markers(text: str) -> dict[str, int]:
    lowered = text.lower()
    return {
        key: sum(1 for marker in markers if marker in lowered)
        for key, markers in SUPPLEMENTAL_MARKERS.items()
    }


def _build_signal_evidence(markers: dict[str, int]) -> list[str]:
    evidence = []
    if markers["prototype"]:
        evidence.append("补充材料中出现样机、原型或中试相关描述，说明技术已进入工程验证阶段。")
    if markers["qualification"]:
        evidence.append("补充材料中存在验证、认证或可靠性相关措辞，可用于核查是否跨入客户导入门槛。")
    if markers["customer"]:
        evidence.append("补充材料中出现客户、导入或订单信号，说明商业化验证可能已经启动。")
    if markers["production"]:
        evidence.append("补充材料中出现量产、交付或良率相关表述，可继续核查其是否已形成稳定产能。")
    if markers["data"]:
        evidence.append("补充材料中存在测试或 benchmark 表述，适合继续追问样本规模、边界条件与可复现性。")
    return evidence


def _build_lifecycle_milestones(stage: str, keyword: str, markers: dict[str, int]) -> list[str]:
    if stage == "规模化交付":
        return [
            f"验证 {keyword} 方向最近两次客户导入或量产交付是否对应真实产线与产品 SKU。",
            "确认关键性能指标是否已固化进认证、可靠性或客户验收流程。",
            "核查产能扩张是否伴随良率、成本和交付节奏的同步改善。",
        ]
    if stage == "商业验证":
        return [
            f"确认 {keyword} 样机是否完成外部测试或中试验证。",
            "获取测试边界条件、样本规模和失效模式数据。",
            "验证是否已有明确的客户试点、联合开发或认证排期。",
        ]
    if stage == "产品验证":
        return [
            f"确认 {keyword} 原型的关键性能指标与竞品差异。",
            "补充首个样机、外部测试或中试计划的时间表。",
            "验证核心器件、工艺或软件栈是否具备可复制工程路径。",
        ]
    return [
        f"确认 {keyword} 方向是否已从概念进入可测试原型。",
        "补充最小可行产品、实验数据和核心专利号。",
        "核查团队是否具备将方案推进至样机阶段的关键人才与资源。",
    ]


def _build_lifecycle_risks(stage: str, patent_stats: dict[str, Any], markers: dict[str, int]) -> list[str]:
    risks = []
    if patent_stats["recent_patent_count"] == 0:
        risks.append("最近 3 年缺少新增专利，路线连续性偏弱。")
    if patent_stats["branch_count"] <= 1:
        risks.append("公开专利分支较窄，可能仍停留在单点创新。")
    if stage != "规模化交付" and markers["customer"] == 0:
        risks.append("尚未看到明确客户导入信号，商业化验证仍有不确定性。")
    if markers["production"] == 0 and stage in {"商业验证", "规模化交付"}:
        risks.append("量产与良率数据不足，工程成熟度仍需补证。")
    return risks[:3] or ["当前生命周期判断仍依赖公开数据，建议补充测试、认证和客户材料。"]


def _confidence_from_count(signal_count: int) -> str:
    if signal_count >= 4:
        return "high"
    if signal_count >= 2:
        return "medium"
    return "low"


def _extract_person_context(text: str, name: str) -> str | None:
    if not text.strip() or not name.strip():
        return None

    normalized_name = name.lower()
    for segment in re.split(r"[\n。；;]", text):
        snippet = segment.strip()
        if len(snippet) < 8:
            continue
        if normalized_name in snippet.lower():
            return snippet[:120]
    return None


def _year_from_date(raw_date: str) -> int:
    return int(raw_date[:4]) if raw_date[:4].isdigit() else date.today().year


def _build_tech_claims(
    company: str,
    keywords: list[str],
    patents: list[dict[str, Any]],
    papers: list[dict[str, Any]],
    supplemental_materials: list[dict[str, Any]],
    supplemental_text: str,
    product_lifecycle: dict[str, Any],
    team_assessment: dict[str, Any],
) -> list[dict[str, Any]]:
    patent_stats = _collect_patent_stats(patents)
    markers = _collect_supplemental_markers(supplemental_text)
    supporting_patents = [patent["id"] for patent in patents[:4]]
    pdf_evidence = _build_pdf_evidence(supplemental_text)

    claims = [
        _assemble_claim(
            claim_id="CLAIM-001",
            claim=f"{company} 在 {keywords[0]} 方向存在连续的公开技术路线，而非一次性专利包装。",
            source="Google Patents / Lens.org",
            supporting_evidence=[
                f"公开专利 {patent_stats['patent_total']} 件，覆盖 {patent_stats['branch_count']} 个技术分支。",
                f"最近 3 年新增 {patent_stats['recent_patent_count']} 件专利，高被引核心节点 {patent_stats['high_citation_count']} 件。",
            ] if patents else [],
            gap_evidence=[
                "当前专利数量不足以支撑路线连续性判断。"
            ] if patent_stats["patent_total"] < 2 else (
                ["最近 3 年没有新增专利，需确认研发是否放缓。"] if patent_stats["recent_patent_count"] == 0 else []
            ),
            next_checks=[
                "核查最近两件专利是否真正对应产品迭代或工艺跃迁。",
                "比对核心发明人是否跨阶段持续出现。",
            ],
            related_patents=supporting_patents[:3],
        ),
        _assemble_claim(
            claim_id="CLAIM-002",
            claim=f"{company} 的技术成熟度已达到“{product_lifecycle['stage']}”对应的工程水平。",
            source=_build_supplemental_source_label(supplemental_materials),
            supporting_evidence=product_lifecycle["evidence"][:3],
            gap_evidence=product_lifecycle["keyRisks"][:2],
            next_checks=product_lifecycle["nextMilestones"][:2],
            related_patents=supporting_patents[1:],
        ),
        _assemble_claim(
            claim_id="CLAIM-003",
            claim=f"{company} 的公开学术与技术路线在 {keywords[0]} 方向保持一定同步。",
            source="arXiv 学术论文",
            supporting_evidence=[
                f"匹配到 {len(papers)} 篇相关论文，说明该方向仍有公开学术增量。"
            ] if papers else [],
            gap_evidence=[
                "当前未获取到相关论文线索，无法判断其是否处于学术前沿或工程跟随。"
            ] if not papers else [],
            next_checks=[
                "核查公司关键术语是否与最新论文中的核心问题一致。",
                "比对论文关注点与公司专利/白皮书中的工程瓶颈是否一致。",
            ],
            related_patents=supporting_patents[:2],
        ),
        _assemble_claim(
            claim_id="CLAIM-004",
            claim="核心团队公开线索是否与当前路线匹配，且不依赖单一关键人。",
            source="公开发明人线索 / 补充材料",
            supporting_evidence=[
                team_assessment["summary"],
                *(member["evidence"][0] for member in team_assessment["members"][:2] if member.get("evidence")),
            ],
            gap_evidence=team_assessment["keyRisks"][:2],
            next_checks=[
                "补充 CTO/核心研发负责人的公开背景、职责分工和代表项目。",
                "验证技术、工艺、制造/交付是否由不同核心成员分别负责。",
            ],
            related_patents=supporting_patents[:2],
        ),
    ]

    if supplemental_text:
        claims[1]["supportingEvidence"].append(pdf_evidence)
        claims[1]["evidence"] = _combine_claim_evidence(claims[1]["supportingEvidence"], claims[1]["gapEvidence"])
    elif markers["production"] == 0 and claims[1]["status"] == "verified":
        claims[1]["status"] = "partially_verified"

    return claims


def _build_pdf_evidence(supplemental_text: str) -> str:
    text = supplemental_text.strip()
    if not text:
        return "未从补充公开材料中提取到可读文本。"

    excerpt = text[:220].replace("\n", " ")
    return f"已从补充公开材料中提取文本，可优先围绕以下片段追问：{excerpt}"


def _assemble_claim(
    *,
    claim_id: str,
    claim: str,
    source: str,
    supporting_evidence: list[str],
    gap_evidence: list[str],
    next_checks: list[str],
    related_patents: list[str],
) -> dict[str, Any]:
    support_count = len([item for item in supporting_evidence if item])
    gap_count = len([item for item in gap_evidence if item])

    if support_count >= 2 and gap_count == 0:
        status = "verified"
        evidence_strength = "strong"
    elif support_count >= 2:
        status = "partially_verified"
        evidence_strength = "medium"
    elif support_count == 1:
        status = "questionable"
        evidence_strength = "weak"
    else:
        status = "unverifiable"
        evidence_strength = "weak"

    clean_support = [item for item in supporting_evidence if item][:4]
    clean_gaps = [item for item in gap_evidence if item][:3]
    clean_checks = [item for item in next_checks if item][:3]

    return {
        "id": claim_id,
        "claim": claim,
        "source": source,
        "status": status,
        "evidenceStrength": evidence_strength,
        "evidence": _combine_claim_evidence(clean_support, clean_gaps),
        "supportingEvidence": clean_support,
        "gapEvidence": clean_gaps,
        "nextChecks": clean_checks,
        "relatedPatents": related_patents,
    }


def _combine_claim_evidence(supporting_evidence: list[str], gap_evidence: list[str]) -> str:
    support_text = "；".join(supporting_evidence[:2]) if supporting_evidence else "暂无直接支撑证据"
    gap_text = "；".join(gap_evidence[:2]) if gap_evidence else "当前未见明显证据缺口"
    return f"支撑: {support_text}。缺口: {gap_text}。"


def _build_supplemental_source_label(supplemental_materials: list[dict[str, Any]]) -> str:
    if not supplemental_materials:
        return "补充材料 / 公开工程线索"
    filenames = [material.get("filename", "补充材料") for material in supplemental_materials[:3]]
    suffix = " 等" if len(supplemental_materials) > 3 else ""
    return " / ".join(filenames) + suffix


def _assemble_barrier(
    *,
    barrier_type: str,
    label: str,
    score: int,
    rationale: list[str],
    gaps: list[str],
    patents: list[str],
) -> dict[str, Any]:
    return {
        "type": barrier_type,
        "label": label,
        "strength": _strength_from_score(score),
        "score": score,
        "evidence": f"核心依据: {'；'.join(rationale[:2])}。主要缺口: {gaps[0] if gaps else '暂无明显缺口。'}",
        "rationale": rationale[:4],
        "gaps": gaps[:3],
        "patents": patents,
    }


def _collect_barrier_gaps(flag1: bool, flag2: bool, flag3: bool, messages: list[str]) -> list[str]:
    flags = [flag1, flag2, flag3]
    gaps = [message for flag, message in zip(flags, messages) if flag and message]
    return gaps or ["暂无明显公开缺口，但仍需通过访谈与原始材料复核。"]


def _strength_from_score(score: int) -> str:
    if score >= 75:
        return "strong"
    if score >= 45:
        return "moderate"
    return "weak"


def _build_barriers(
    patents: list[dict[str, Any]],
    papers: list[dict[str, Any]],
    supplemental_materials: list[dict[str, Any]],
    supplemental_text: str,
    product_lifecycle: dict[str, Any],
    team_assessment: dict[str, Any],
) -> list[dict[str, Any]]:
    patent_stats = _collect_patent_stats(patents)
    markers = _collect_supplemental_markers(supplemental_text)
    key_person_penalty = 10 if team_assessment["benchRisk"] == "high" else 0

    patent_score = max(
        0,
        min(
            100,
            patent_stats["patent_total"] * 8
            + patent_stats["branch_count"] * 8
            + patent_stats["recent_patent_count"] * 6
            + patent_stats["high_citation_count"] * 6
            - key_person_penalty,
        ),
    )
    algorithm_score = max(
        0,
        min(
            100,
            len(papers) * 14
            + patent_stats["branch_count"] * 5
            + patent_stats["recent_patent_count"] * 3,
        ),
    )
    data_score = max(
        0,
        min(
            100,
            markers["data"] * 14 + markers["customer"] * 8 + markers["qualification"] * 6,
        ),
    )
    engineering_score = max(
        0,
        min(
            100,
            markers["prototype"] * 10
            + markers["qualification"] * 12
            + markers["production"] * 14
            + patent_stats["recent_patent_count"] * 5
            + (10 if product_lifecycle["stage"] == "规模化交付" else 0),
        ),
    )

    return [
        _assemble_barrier(
            barrier_type="patent",
            label="专利壁垒",
            score=patent_score,
            rationale=[
                f"专利总量 {patent_stats['patent_total']} 件，覆盖 {patent_stats['branch_count']} 个技术分支。",
                f"最近 3 年新增 {patent_stats['recent_patent_count']} 件，高被引节点 {patent_stats['high_citation_count']} 件。",
                f"核心发明人最高集中度 {int(patent_stats['max_inventor_ratio'] * 100)}%。",
            ],
            gaps=_collect_barrier_gaps(
                patent_stats["patent_total"] < 3,
                patent_stats["recent_patent_count"] == 0,
                patent_stats["max_inventor_ratio"] >= 0.45,
                [
                    "公开专利数量偏少，尚不足以证明系统性布局。",
                    "近期缺少新申请，需确认路线是否停滞。",
                    "关键专利过度集中于少数发明人，存在组织脆弱性。",
                ],
            ),
            patents=[patent["id"] for patent in patents[:3]],
        ),
        _assemble_barrier(
            barrier_type="algorithm",
            label="算法 / 工艺壁垒",
            score=algorithm_score,
            rationale=[
                f"论文线索 {len(papers)} 篇，可用于核查方法论是否仍处于演进前沿。",
                f"技术分支覆盖 {patent_stats['branch_count']} 个方向，说明并非单一算法点状堆叠。",
            ],
            gaps=_collect_barrier_gaps(
                len(papers) == 0,
                patent_stats["branch_count"] <= 1,
                False,
                [
                    "缺少论文或公开方法论支撑，难以确认其是否具备方法层优势。",
                    "技术分支仍偏窄，工艺/算法壁垒可能不够厚。",
                    "",
                ],
            ),
            patents=[patent["id"] for patent in patents[1:4]],
        ),
        _assemble_barrier(
            barrier_type="data",
            label="数据 / 验证壁垒",
            score=data_score,
            rationale=[
                "重点观察测试、benchmark、客户验证和样本规模是否形成可复用数据资产。",
                f"当前补充材料中数据与验证信号命中 {markers['data'] + markers['customer']} 次。",
            ],
            gaps=_collect_barrier_gaps(
                markers["data"] == 0,
                markers["customer"] == 0,
                False,
                [
                    "尚未看到明确测试数据或 benchmark 描述。",
                    "缺少客户导入或外部验证证据，数据资产闭环不清晰。",
                    "",
                ],
            ),
            patents=[],
        ),
        _assemble_barrier(
            barrier_type="engineering",
            label="工程壁垒",
            score=engineering_score,
            rationale=[
                f"生命周期当前处于 {product_lifecycle['stage']}，可作为工程成熟度的总判断。",
                f"样机/验证/量产相关信号分别命中 {markers['prototype']}/{markers['qualification']}/{markers['production']} 次。",
                "是否形成从样机、认证到稳定交付的闭环，是工程壁垒成立的关键。",
            ],
            gaps=_collect_barrier_gaps(
                markers["prototype"] == 0,
                markers["qualification"] == 0,
                markers["production"] == 0 and product_lifecycle["stage"] != "概念验证",
                [
                    "缺少样机或原型验证线索。",
                    "缺少认证、可靠性或客户测试记录。",
                    "尚未看到量产与良率证据，工程壁垒未完全闭环。",
                ],
            ),
            patents=[patent["id"] for patent in patents[-3:]],
        ),
    ]


def _score_supplemental_signal(text: str) -> int:
    lowered = text.lower()
    markers = [
        "测试",
        "验证",
        "样机",
        "量产",
        "客户",
        "良率",
        "benchmark",
        "pilot",
        "production",
    ]
    return sum(1 for marker in markers if marker in lowered)


def _build_defensibility_conclusion(
    company: str,
    barriers: list[dict[str, Any]],
    evolution_stage: dict[str, Any],
    product_lifecycle: dict[str, Any],
    team_assessment: dict[str, Any],
) -> str:
    sorted_barriers = sorted(barriers, key=lambda barrier: barrier["score"], reverse=True)
    strongest = sorted_barriers[0]
    weakest = sorted_barriers[-1]
    return (
        f"{company} 当前最有支撑的壁垒维度是“{strongest['label']}”（{strongest['score']}/100，{strongest['strength']}），"
        f"与演进阶段“{evolution_stage['stage']}”和产品生命周期“{product_lifecycle['stage']}”基本一致。"
        f"但“{weakest['label']}”仍是主要短板，尤其需要补齐 {weakest['gaps'][0] if weakest['gaps'] else '公开证据'}。"
        f"团队侧整体匹配度为 {team_assessment['overallStrength']}，板凳风险为 {team_assessment['benchRisk']}，"
        "因此投资判断不应只看专利数量，更要核查工程验证、客户导入和关键人依赖是否同步成立。"
    )


def _build_expert_profiles(company: str, keywords: list[str]) -> list[dict[str, Any]]:
    lead_keyword = keywords[0]
    return [
        {
            "role": f"{lead_keyword} 技术专家",
            "background": f"熟悉 {lead_keyword} 技术路线与公开论文脉络，可快速判断公司是否只是工程跟随。",
            "channels": ["产业专家库", "高校实验室", "离职技术负责人"],
            "reason": f"验证 {company} 在 {lead_keyword} 方向的真实技术深度。",
        },
        {
            "role": "前高管 / 前研发负责人",
            "background": "了解团队历史路线切换、组织协作与研发推进节奏。",
            "channels": ["前同事网络", "猎头渠道", "产业社群"],
            "reason": "验证技术路线切换背后的真实原因，以及团队稳定性。",
        },
        {
            "role": "行业分析师",
            "background": "可将目标公司与同赛道公司的技术演进速度和产品成熟度做横向比较。",
            "channels": ["券商研究", "行业媒体", "FA 网络"],
            "reason": "回答其技术天花板、演进速度与竞品位置。",
        },
        {
            "role": "知识产权律师",
            "background": "擅长判断专利稳定性、无效风险和侵权暴露点。",
            "channels": ["律所专家库", "知识产权顾问", "专利代理机构"],
            "reason": "验证专利护城河是否稳固，以及是否存在潜在诉讼风险。",
        },
    ]


def _build_interview_questions(
    company: str,
    keywords: list[str],
    patents: list[dict[str, Any]],
    supplemental_text: str,
) -> list[dict[str, Any]]:
    related_patents = [patent["id"] for patent in patents[:3]]
    primary_keyword = keywords[0]
    secondary_keyword = keywords[1] if len(keywords) > 1 else keywords[0]
    pdf_prompt = (
        "上传材料里最值得核查的性能指标、测试边界条件和客户验证证据分别是什么？"
        if supplemental_text
        else "如果公司提供了白皮书或测试报告，最值得优先核查的关键指标会是什么？"
    )

    templates = [
        (
            "tech_expert",
            "screening",
            "claim_verification",
            "技术声明验证",
            f"{company} 在 {primary_keyword} 方向的核心创新，相比公开论文与竞品方案的本质差异是什么？",
            "优先判断是否存在独立技术判断，而不是在公开研究上做轻量工程实现。",
            "basic",
        ),
        (
            "tech_expert",
            "deep_dd",
            "claim_verification",
            "技术声明验证",
            f"{primary_keyword} 到 {secondary_keyword} 的路线演进中，哪一个节点真正构成了技术跃迁？请给出性能、成本和实现难点的量化证据。",
            "要求受访人给出路线切换的触发条件、量化指标与具体工程约束。",
            "deep",
        ),
        (
            "ex_executive",
            "screening",
            "team_stability",
            "团队稳定性",
            "最近 12 个月内，核心研发团队是否有关键成员流失？这些变化是否影响当前路线推进？",
            "验证技术执行是否过度依赖少数关键人，以及组织是否存在不稳定信号。",
            "basic",
        ),
        (
            "ex_executive",
            "deep_dd",
            "barrier_defensibility",
            "壁垒可防御性",
            f"如果竞品也沿着 {primary_keyword} 路线推进，{company} 还能凭什么维持领先？",
            "要求受访人说出具体的组织能力、工艺积累或客户验证，而不是泛泛而谈团队优秀。",
            "deep",
        ),
        (
            "industry_analyst",
            "screening",
            "barrier_defensibility",
            "壁垒可防御性",
            f"从赛道视角看，{company} 在 {primary_keyword} 方向处于什么位置？其技术天花板与头部玩家相比差距在哪里？",
            "用第三方视角校验公司自我定位，避免只接受公司叙事。",
            "basic",
        ),
        (
            "industry_analyst",
            "deep_dd",
            "barrier_defensibility",
            "壁垒可防御性",
            f"同赛道公司里，谁与 {company} 在 {primary_keyword} 与 {secondary_keyword} 的路线最相近？如果并排比较，谁的演进速度更快？",
            "直接服务于多标的横向对比，判断路线一致性与速度差异。",
            "deep",
        ),
        (
            "ip_lawyer",
            "screening",
            "claim_verification",
            "技术声明验证",
            "目前公开专利中，哪些核心专利最值得重点核查其稳定性和无效风险？",
            "优先筛出对投资判断影响最大的核心权利要求。",
            "basic",
        ),
        (
            "ip_lawyer",
            "deep_dd",
            "team_stability",
            "团队稳定性",
            pdf_prompt,
            "将上传材料与公开专利、量产节奏和知识产权归属一起交叉验证。",
            "deep",
        ),
    ]

    questions = []
    for index, (role, stage, category, label, question, logic, difficulty) in enumerate(templates, start=1):
        questions.append(
            {
                "id": f"Q{index:03d}",
                "category": category,
                "categoryLabel": label,
                "question": question,
                "verificationLogic": logic,
                "relatedPatents": related_patents,
                "difficulty": difficulty,
                "targetRole": role,
                "stage": stage,
            }
        )
    return questions


def _build_source_coverage(
    *,
    selected_sources: list[str],
    patent_source_details: dict[str, dict[str, Any]],
    papers: list[dict[str, Any]],
    paper_error: str | None,
    public_web_sources: list[dict[str, Any]],
    supplemental_materials: list[dict[str, Any]],
    supplemental_patent_count: int,
) -> list[dict[str, Any]]:
    coverage = []

    for source_id, label in SOURCE_LABELS.items():
        if source_id == "public_web":
            live_count = sum(1 for source in public_web_sources if source["status"] == "live")
            error_count = sum(1 for source in public_web_sources if source["status"] == "error")
            if not public_web_sources:
                coverage.append({"label": label, "count": 0, "status": "skipped", "note": "本次未提供公开网页 URL。"})
            elif live_count:
                coverage.append(
                    {
                        "label": label,
                        "count": live_count,
                        "status": "live",
                        "note": "仅抓取用户提供的公开网页，用于补强团队线索、产品进展和生命周期判断。",
                    }
                )
            else:
                coverage.append(
                    {
                        "label": label,
                        "count": error_count,
                        "status": "error",
                        "note": public_web_sources[0]["note"],
                    }
                )
            continue

        if source_id == "arxiv":
            if source_id not in selected_sources:
                coverage.append({"label": label, "count": 0, "status": "skipped", "note": "本次未选择该数据源。"})
            elif paper_error:
                coverage.append({"label": label, "count": 0, "status": "error", "note": _format_source_error(source_id, paper_error)})
            else:
                coverage.append({"label": label, "count": len(papers), "status": "live", "note": "已实时拉取公开论文数据。"})
            continue

        source_detail = patent_source_details.get(source_id, {"status": "skipped", "count": 0, "note": "本次未选择该数据源。"})
        coverage.append(
            {
                "label": label,
                "count": source_detail["count"],
                "status": source_detail["status"],
                "note": source_detail["note"],
            }
        )

    coverage.append(
        {
            "label": "CNIPA（上传解析）",
            "count": supplemental_patent_count,
            "status": "derived" if supplemental_patent_count else ("live" if _has_uploaded_cnipa_material(supplemental_materials) else "skipped"),
            "note": (
                f"已从上传 PDF 中解析 {supplemental_patent_count} 条国内专利线索，并并入专利脉络。"
                if supplemental_patent_count
                else "当前上传材料未包含 CNIPA 专利导出文件。"
                if supplemental_materials and not _has_uploaded_cnipa_material(supplemental_materials)
                else "本次未从上传的 CNIPA PDF 中识别到可结构化的国内专利条目，可能受扫描件、图片型 PDF 或文本质量影响。"
                if supplemental_materials
                else "本次未上传用于补充国内专利的 PDF 材料。"
            ),
        }
    )

    coverage.append(
        {
            "label": "补充材料",
            "count": len(supplemental_materials),
            "status": "live" if supplemental_materials else "skipped",
            "note": _build_supplemental_note(supplemental_materials),
        }
    )
    return coverage


def _build_supplemental_note(supplemental_materials: list[dict[str, Any]]) -> str:
    if not supplemental_materials:
        return "本次未上传补充材料。"

    parsed_patent_count = sum(int(material.get("parsedPatentCount") or 0) for material in supplemental_materials)
    type_counts = Counter(material.get("materialTypeLabel", "补充材料") for material in supplemental_materials)
    type_note = " / ".join(f"{label}{count}份" for label, count in type_counts.items())
    scan_count = sum(1 for material in supplemental_materials if material.get("suspectedScan"))
    watermark_count = sum(1 for material in supplemental_materials if material.get("watermarkCleaned"))
    extraction_notes = [
        str(material.get("extractionNote", "")).strip()
        for material in supplemental_materials
        if str(material.get("extractionNote", "")).strip()
    ]

    note_parts = [f"{len(supplemental_materials)} 份材料", type_note]
    if parsed_patent_count:
        note_parts.append(f"已解析 {parsed_patent_count} 条专利")
    if watermark_count:
        note_parts.append(f"{watermark_count} 份已做水印/页眉页脚清洗")
    if scan_count:
        note_parts.append(f"{scan_count} 份疑似扫描件，建议补 OCR 版")
    if extraction_notes:
        note_parts.append(extraction_notes[0])

    return " · ".join(part for part in note_parts if part)


def _has_uploaded_cnipa_material(supplemental_materials: list[dict[str, Any]]) -> bool:
    return any(material.get("materialType") == "cnipa_patent" for material in supplemental_materials)


def _format_source_error(source_id: str, message: str) -> str:
    normalized = message.lower()

    if source_id == "lens":
        if any(token in normalized for token in ("401", "403", "unauthorized", "forbidden")):
            return (
                "Lens API 鉴权失败。请确认 `.env` 中 `TECHTRACE_LENS_API_KEY` 填写的是有效的 Lens Access Token，"
                "并且当前账户已经开通 Patent API 权限。"
            )
        if "failed to resolve" in normalized or "nameresolutionerror" in normalized:
            return "当前运行环境无法解析 Lens API 域名，请检查本机网络、代理或防火墙设置。"

    if source_id == "google":
        if "serpapi" in normalized and any(token in normalized for token in ("invalid", "unauthorized", "api key", "auth")):
            return "SerpApi 鉴权失败。请确认 `.env` 中 `TECHTRACE_GOOGLE_PATENTS_API_KEY` 是有效的第三方 API Key。"
        if "503" in normalized or "responseerror" in normalized or "max retries exceeded" in normalized:
            return "Google Patents 暂时拒绝了检索请求，可能触发了限流或代理异常，请稍后重试。"
        if "failed to resolve" in normalized or "nameresolutionerror" in normalized:
            return "当前运行环境无法访问 Google Patents，请检查本机网络、代理或防火墙设置。"

    if source_id == "arxiv":
        if "failed to resolve" in normalized or "nameresolutionerror" in normalized:
            return "当前运行环境无法访问 arXiv，请检查本机网络、代理或防火墙设置。"

    return f"检索失败：{message}"
