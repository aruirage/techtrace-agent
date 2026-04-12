from __future__ import annotations

import json
from typing import Any

import requests

from .settings import get_env, get_int_env

OPENAI_API_URL = get_env("TECHTRACE_OPENAI_API_URL", "https://api.openai.com/v1/responses")
OPENAI_MODEL = get_env("TECHTRACE_OPENAI_MODEL", "gpt-5")
OPENAI_TIMEOUT_SEC = get_int_env("TECHTRACE_OPENAI_TIMEOUT_SEC", 30)


def summarize_analysis_with_openai(
    *,
    company: str,
    keywords: list[str],
    patents: list[dict[str, Any]],
    papers: list[dict[str, Any]],
    supplemental_text: str,
    evolution_description: str,
    trend_note: str,
    defensibility_conclusion: str,
) -> dict[str, str] | None:
    api_key = get_env("TECHTRACE_OPENAI_API_KEY").strip()
    if not api_key:
        return None

    prompt = _build_prompt(
        company=company,
        keywords=keywords,
        patents=patents,
        papers=papers,
        supplemental_text=supplemental_text,
        evolution_description=evolution_description,
        trend_note=trend_note,
        defensibility_conclusion=defensibility_conclusion,
    )

    response = requests.post(
        OPENAI_API_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": OPENAI_MODEL,
            "input": prompt,
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "techtrace_summary",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "evolutionDescription": {"type": "string"},
                            "trendNote": {"type": "string"},
                            "defensibilityConclusion": {"type": "string"},
                            "supplementalInsight": {"type": "string"},
                        },
                        "required": [
                            "evolutionDescription",
                            "trendNote",
                            "defensibilityConclusion",
                            "supplementalInsight",
                        ],
                    },
                }
            },
        },
        timeout=OPENAI_TIMEOUT_SEC,
    )
    response.raise_for_status()

    output_text = _extract_output_text(response.json())
    parsed = json.loads(output_text)
    return {
        "evolutionDescription": parsed["evolutionDescription"].strip(),
        "trendNote": parsed["trendNote"].strip(),
        "defensibilityConclusion": parsed["defensibilityConclusion"].strip(),
        "supplementalInsight": parsed["supplementalInsight"].strip(),
    }


def _build_prompt(
    *,
    company: str,
    keywords: list[str],
    patents: list[dict[str, Any]],
    papers: list[dict[str, Any]],
    supplemental_text: str,
    evolution_description: str,
    trend_note: str,
    defensibility_conclusion: str,
) -> str:
    patent_lines = [
        f"- {patent['filingDate']} | {patent['patentNo']} | {patent['title']} | {patent['source']}"
        for patent in patents[:6]
    ]
    paper_lines = [
        f"- {paper['year']} | {paper['title']} | {paper['journal']}"
        for paper in papers[:4]
    ]

    return (
        "你是硬科技投前技术尽调助手。请严格只根据提供的公开信息，"
        "输出更凝练、可执行的中文判断，不要虚构内部信息，不要引入未提供的事实。\n\n"
        f"公司: {company}\n"
        f"技术关键词: {', '.join(keywords)}\n\n"
        "当前技术演进描述:\n"
        f"{evolution_description}\n\n"
        "当前趋势提示:\n"
        f"{trend_note}\n\n"
        "当前壁垒结论:\n"
        f"{defensibility_conclusion}\n\n"
        "公开专利线索:\n"
        f"{chr(10).join(patent_lines) or '- 暂无'}\n\n"
        "公开论文线索:\n"
        f"{chr(10).join(paper_lines) or '- 暂无'}\n\n"
        "上传 PDF 提取片段:\n"
        f"{(supplemental_text or '未上传 PDF').strip()[:5000]}\n\n"
        "请返回 JSON，并完成四件事：\n"
        "1. evolutionDescription: 改写技术演进判断，控制在 90-140 字。\n"
        "2. trendNote: 给出下一步最值得验证的公开证据，控制在 50-90 字。\n"
        "3. defensibilityConclusion: 输出投研口径的综合壁垒判断，控制在 90-140 字。\n"
        "4. supplementalInsight: 如果上传 PDF 有信息价值，就提炼最值得追问的工程或商业化问题；否则明确说明公开补充材料不足。"
    )


def _extract_output_text(payload: dict[str, Any]) -> str:
    direct_text = payload.get("output_text")
    if isinstance(direct_text, str) and direct_text.strip():
        return direct_text

    for item in payload.get("output", []):
        if not isinstance(item, dict):
            continue
        for content in item.get("content", []):
            if not isinstance(content, dict):
                continue
            text = content.get("text")
            if isinstance(text, str) and text.strip():
                return text

    raise RuntimeError("OpenAI 响应中未找到可解析的文本输出。")
