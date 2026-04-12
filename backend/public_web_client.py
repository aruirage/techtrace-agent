from __future__ import annotations

from html.parser import HTMLParser
from ipaddress import ip_address
import re
from typing import Any
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

from .http_client import build_session
from .settings import get_int_env

PUBLIC_WEB_TIMEOUT_SEC = get_int_env("TECHTRACE_PUBLIC_WEB_TIMEOUT_SEC", 20)
PUBLIC_WEB_MAX_URLS = get_int_env("TECHTRACE_PUBLIC_WEB_MAX_URLS", 5)
PUBLIC_WEB_MAX_CHARS = get_int_env("TECHTRACE_PUBLIC_WEB_MAX_CHARS", 12000)
DEFAULT_USER_AGENT = "TechTrace-Agent/0.1 (public-data-only)"


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._title_parts: list[str] = []
        self._body_parts: list[str] = []
        self._skip_depth = 0
        self._in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style", "noscript"}:
            self._skip_depth += 1
        elif tag == "title":
            self._in_title = True

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "noscript"} and self._skip_depth > 0:
            self._skip_depth -= 1
        elif tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._skip_depth:
            return
        normalized = _normalize_text(data)
        if not normalized:
            return
        if self._in_title:
            self._title_parts.append(normalized)
        else:
            self._body_parts.append(normalized)

    @property
    def title(self) -> str:
        return " ".join(self._title_parts).strip()

    @property
    def text(self) -> str:
        return " ".join(self._body_parts).strip()


def fetch_public_pages(urls: list[str]) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    normalized_urls: list[str] = []
    for raw_url in urls:
        normalized = normalize_public_url(raw_url)
        if normalized and normalized not in normalized_urls:
            normalized_urls.append(normalized)

    for url in normalized_urls[:PUBLIC_WEB_MAX_URLS]:
        try:
            _validate_public_url(url)
            if not _is_robot_allowed(url):
                results.append(
                    {
                        "url": url,
                        "title": "",
                        "text": "",
                        "excerpt": "",
                        "status": "skipped",
                        "note": "该页面的 robots.txt 不允许自动抓取，已跳过。",
                    }
                )
                continue

            session = build_session(headers={"User-Agent": DEFAULT_USER_AGENT, "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"})
            response = session.get(url, timeout=PUBLIC_WEB_TIMEOUT_SEC)
            response.raise_for_status()
            content_type = (response.headers.get("Content-Type") or "").lower()
            raw_text = response.text if "text" in content_type or "html" in content_type else ""
            title, text = _extract_page_text(raw_text)
            truncated_text = text[:PUBLIC_WEB_MAX_CHARS]
            results.append(
                {
                    "url": url,
                    "title": title or _fallback_title(url),
                    "text": truncated_text,
                    "excerpt": truncated_text[:240],
                    "status": "live",
                    "note": f"仅抓取用户提供的公开页面，已截取前 {min(len(text), PUBLIC_WEB_MAX_CHARS)} 个字符用于分析。",
                }
            )
        except Exception as exc:
            results.append(
                {
                    "url": url,
                    "title": _fallback_title(url),
                    "text": "",
                    "excerpt": "",
                    "status": "error",
                    "note": f"抓取失败: {exc}",
                }
            )

    return results


def normalize_public_url(raw_url: str) -> str:
    candidate = raw_url.strip()
    if not candidate:
        return ""
    if not re.match(r"^https?://", candidate, flags=re.IGNORECASE):
        candidate = f"https://{candidate}"
    return candidate


def _validate_public_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("仅支持 http(s) 公开网页。")
    if not parsed.netloc:
        raise ValueError("URL 缺少域名。")

    hostname = (parsed.hostname or "").lower()
    if hostname in {"localhost"} or hostname.endswith(".local"):
        raise ValueError("不允许抓取本地或内网地址。")

    try:
        host_ip = ip_address(hostname)
    except ValueError:
        host_ip = None

    if host_ip and (host_ip.is_private or host_ip.is_loopback or host_ip.is_link_local or host_ip.is_reserved):
        raise ValueError("不允许抓取私有网络地址。")


def _is_robot_allowed(url: str) -> bool:
    parsed = urlparse(url)
    robots_url = urljoin(f"{parsed.scheme}://{parsed.netloc}", "/robots.txt")
    parser = RobotFileParser()
    try:
        parser.set_url(robots_url)
        parser.read()
        return parser.can_fetch(DEFAULT_USER_AGENT, url)
    except Exception:
        return True


def _extract_page_text(html: str) -> tuple[str, str]:
    extractor = _TextExtractor()
    extractor.feed(html)
    return extractor.title, extractor.text


def _normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _fallback_title(url: str) -> str:
    parsed = urlparse(url)
    return parsed.netloc or url
