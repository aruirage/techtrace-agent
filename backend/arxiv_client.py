from __future__ import annotations

import xml.etree.ElementTree as ET
from typing import Any

from .http_client import request_with_fallbacks
from .settings import get_env, get_int_env

ARXIV_API_URL = get_env("TECHTRACE_ARXIV_API_URL", "https://export.arxiv.org/api/query")
ARXIV_FALLBACK_API_URL = get_env("TECHTRACE_ARXIV_FALLBACK_API_URL", "http://export.arxiv.org/api/query")
ARXIV_TIMEOUT_SEC = get_int_env("TECHTRACE_ARXIV_TIMEOUT_SEC", 20)
ARXIV_NS = {"atom": "http://www.w3.org/2005/Atom"}


def fetch_arxiv_xml(query: str, max_results: int = 6, timeout: int | None = None) -> str:
    cleaned_query = query.strip()
    if not cleaned_query:
        return ""

    request_timeout = timeout if timeout is not None else ARXIV_TIMEOUT_SEC

    response = request_with_fallbacks(
        method="GET",
        urls=[ARXIV_API_URL, ARXIV_FALLBACK_API_URL],
        params={
            "search_query": f"all:{cleaned_query}",
            "max_results": max_results,
            "sortBy": "relevance",
        },
        timeout=request_timeout,
    )
    return response.text


def parse_arxiv_xml(xml_text: str) -> list[dict[str, Any]]:
    if not xml_text.strip():
        return []

    root = ET.fromstring(xml_text)
    papers: list[dict[str, Any]] = []

    for index, entry in enumerate(root.findall("atom:entry", ARXIV_NS), start=1):
        title = _read_text(entry.find("atom:title", ARXIV_NS))
        summary = _read_text(entry.find("atom:summary", ARXIV_NS))
        published = _read_text(entry.find("atom:published", ARXIV_NS))
        link = _read_text(entry.find("atom:id", ARXIV_NS))
        authors = [
            _read_text(author.find("atom:name", ARXIV_NS))
            for author in entry.findall("atom:author", ARXIV_NS)
            if _read_text(author.find("atom:name", ARXIV_NS))
        ]

        papers.append(
            {
                "id": f"ARXIV-{index:03d}",
                "title": title,
                "summary": summary,
                "published": published,
                "authors": authors,
                "link": link,
                "arxiv_id": link.rsplit("/", 1)[-1] if link else "",
            }
        )

    return papers


def fetch_and_parse_arxiv(query: str, max_results: int = 6, timeout: int | None = None) -> list[dict[str, Any]]:
    return parse_arxiv_xml(fetch_arxiv_xml(query=query, max_results=max_results, timeout=timeout))


def _read_text(node: ET.Element | None) -> str:
    if node is None or node.text is None:
        return ""
    return node.text.strip()
