from __future__ import annotations

from collections import Counter
from io import BytesIO
import re
from typing import Any
import unicodedata

from .settings import get_int_env

try:  # pragma: no cover - optional dependency
    from pypdf import PdfReader
except ImportError:  # pragma: no cover - optional dependency
    PdfReader = None

PDF_MAX_PAGES = get_int_env("TECHTRACE_PDF_MAX_PAGES", 20)
PDF_MAX_CHARS = get_int_env("TECHTRACE_PDF_MAX_CHARS", 12000)
CN_PATENT_RE = re.compile(r"(CN\s?\d{8,12}[A-Z0-9]{0,2})", re.IGNORECASE)
DATE_RE = re.compile(r"(20\d{2})[.\-/年](\d{1,2})(?:[.\-/月](\d{1,2}))?")
TITLE_SKIP_WORDS = (
    "申请人",
    "专利权人",
    "发明人",
    "设计人",
    "申请号",
    "公开号",
    "公开日",
    "申请日",
    "摘要",
    "权利要求",
    "ipc",
    "int.cl",
)
WATERMARK_HINTS = (
    "confidential",
    "internal use only",
    "watermark",
    "机密",
    "保密",
    "仅供参考",
    "仅供内部使用",
    "样张",
    "demo",
)


def extract_pdf_text(
    file_bytes: bytes,
    *,
    max_pages: int | None = None,
    max_chars: int | None = None,
) -> tuple[str, dict[str, Any]]:
    page_limit = max_pages or PDF_MAX_PAGES
    char_limit = max_chars or PDF_MAX_CHARS

    if not file_bytes:
        return "", {"status": "empty", "pageCount": 0, "note": "PDF 文件为空。"}

    if PdfReader is None:
        return "", {
            "status": "unavailable",
            "pageCount": 0,
            "note": "未安装 pypdf，当前无法提取 PDF 文本。",
        }

    try:
        reader = PdfReader(BytesIO(file_bytes))
        raw_page_texts: list[str] = []
        extracted_pages = 0
        image_only_pages = 0

        for page in reader.pages[:page_limit]:
            extracted_pages += 1
            page_text = _normalize_text(page.extract_text() or "")
            if not page_text and _page_contains_image(page):
                image_only_pages += 1
            raw_page_texts.append(page_text)

        cleaned_page_texts, watermark_cleaned = _remove_repeated_noise(raw_page_texts)
        normalized_text = _normalize_text("\n\n".join(cleaned_page_texts))[:char_limit]
        suspected_scan = not normalized_text and image_only_pages > 0

        note_parts = [f"已检查 {extracted_pages} 页。"]
        if watermark_cleaned:
            note_parts.append("已尽量清洗重复水印、页眉页脚和分页噪音。")
        if len(reader.pages) > page_limit:
            note_parts.append(f"为控制时延，仅分析前 {page_limit} 页。")
        if suspected_scan:
            note_parts.append("检测到疑似扫描件/图片型 PDF，当前环境未启用 OCR，建议补充可搜索版或 OCR 版 PDF。")
        elif image_only_pages > 0:
            note_parts.append(f"其中 {image_only_pages} 页疑似图片型页面，文本提取可能不完整。")

        if normalized_text:
            status = "ok" if image_only_pages == 0 else "partial"
            return normalized_text, {
                "status": status,
                "pageCount": len(reader.pages),
                "extractedPages": extracted_pages,
                "imageOnlyPages": image_only_pages,
                "watermarkCleaned": watermark_cleaned,
                "suspectedScan": suspected_scan,
                "note": " ".join(note_parts),
            }

        return "", {
            "status": "ocr_required" if suspected_scan else "empty",
            "pageCount": len(reader.pages),
            "extractedPages": extracted_pages,
            "imageOnlyPages": image_only_pages,
            "watermarkCleaned": watermark_cleaned,
            "suspectedScan": suspected_scan,
            "note": " ".join(note_parts) if suspected_scan else "PDF 可读取，但未提取到有效文本。",
        }
    except Exception as exc:  # pragma: no cover - parser variability
        return "", {
            "status": "error",
            "pageCount": 0,
            "watermarkCleaned": False,
            "suspectedScan": False,
            "note": f"PDF 解析失败：{exc}",
        }


def _normalize_text(text: str) -> str:
    cleaned = unicodedata.normalize("NFKC", text.replace("\x00", " "))
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"[ ]*\n[ ]*", "\n", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def _page_contains_image(page: Any) -> bool:
    try:
        images = getattr(page, "images", None)
        if images:
            return True
    except Exception:
        pass

    try:
        resources = page.get("/Resources")
        if not resources:
            return False
        xobject = resources.get("/XObject")
        if not xobject:
            return False
        for obj in xobject.values():
            resolved = obj.get_object()
            if resolved.get("/Subtype") == "/Image":
                return True
    except Exception:
        return False

    return False


def _remove_repeated_noise(page_texts: list[str]) -> tuple[list[str], bool]:
    per_page_lines = [_split_lines(text) for text in page_texts]
    repeated_counter: Counter[str] = Counter()

    for lines in per_page_lines:
        unique_lines = {_line_fingerprint(line) for line in lines if _is_noise_candidate(line)}
        repeated_counter.update(unique_lines)

    threshold = max(2, len(per_page_lines) // 2 + len(per_page_lines) % 2)
    repeated_noise = {
        line
        for line, count in repeated_counter.items()
        if count >= threshold
    }

    cleaned_pages: list[str] = []
    watermark_cleaned = False

    for lines in per_page_lines:
        cleaned_lines: list[str] = []
        for line in lines:
            fingerprint = _line_fingerprint(line)
            if fingerprint in repeated_noise or _looks_like_page_artifact(line):
                watermark_cleaned = True
                continue
            cleaned_lines.append(line)
        cleaned_pages.append("\n".join(cleaned_lines))

    return cleaned_pages, watermark_cleaned


def _split_lines(text: str) -> list[str]:
    return [line.strip() for line in text.splitlines() if line.strip()]


def _line_fingerprint(line: str) -> str:
    compact = unicodedata.normalize("NFKC", line).lower().strip()
    compact = re.sub(r"\s+", " ", compact)
    compact = re.sub(r"[^\w\u4e00-\u9fff./:%-]", "", compact)
    return compact


def _is_noise_candidate(line: str) -> bool:
    compact = _line_fingerprint(line)
    if not compact or len(compact) > 48:
        return False
    if any(hint in compact for hint in WATERMARK_HINTS):
        return True
    if len(compact) <= 18 and not re.search(r"[。；;，,]", compact):
        return True
    return bool(re.fullmatch(r"(page)?\s*\d+(\s*/\s*\d+)?", compact)) or compact.isdigit()


def _looks_like_page_artifact(line: str) -> bool:
    lowered = _line_fingerprint(line)
    if not lowered:
        return True
    if any(hint in lowered for hint in WATERMARK_HINTS):
        return True
    if re.fullmatch(r"(page)?\d+(/\d+)?", lowered):
        return True
    return False


def extract_patent_records_from_text(
    text: str,
    *,
    company_name: str = "",
    max_records: int = 12,
) -> list[dict[str, Any]]:
    normalized_text = _normalize_text(text)
    if not normalized_text:
        return []

    records: dict[str, dict[str, Any]] = {}
    blocks = [block.strip() for block in re.split(r"\n\s*\n", normalized_text) if block.strip()]

    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        for index, line in enumerate(lines):
            compact_line = line.replace(" ", "")
            matches = CN_PATENT_RE.findall(compact_line)
            if not matches:
                continue

            context_lines = lines[max(0, index - 3): min(len(lines), index + 3)]
            context_text = "\n".join(context_lines)
            filing_date = _extract_patent_date(context_text)
            applicant = _extract_labeled_value(context_text, ("申请人", "专利权人")) or company_name or "公开信息待补"
            inventors = _extract_name_list(context_text, ("发明人", "设计人"))

            for raw_patent_no in matches:
                patent_no = raw_patent_no.replace(" ", "").upper()
                title = _extract_patent_title(lines, index, patent_no)
                abstract = _extract_patent_abstract(context_text, title, patent_no)
                candidate = {
                    "title": title or f"{patent_no} 相关专利",
                    "patentNo": patent_no,
                    "applicant": applicant,
                    "inventors": inventors or ["公开信息待补"],
                    "filingDate": filing_date,
                    "abstract": abstract,
                    "source": "CNIPA",
                }
                existing = records.get(patent_no)
                if existing is None or _score_patent_record(candidate) > _score_patent_record(existing):
                    records[patent_no] = candidate

            if len(records) >= max_records:
                return list(records.values())[:max_records]

    return list(records.values())[:max_records]


def _extract_patent_title(lines: list[str], index: int, patent_no: str) -> str:
    inline = _clean_title_candidate(lines[index], patent_no)
    if inline:
        return inline

    for offset in (1, -1, 2, -2):
        candidate_index = index + offset
        if 0 <= candidate_index < len(lines):
            candidate = _clean_title_candidate(lines[candidate_index], patent_no)
            if candidate:
                return candidate
    return ""


def _clean_title_candidate(line: str, patent_no: str) -> str:
    candidate = line.replace(patent_no, " ")
    candidate = re.sub(CN_PATENT_RE, " ", candidate)
    candidate = re.sub(r"^[\s:：;；,.、，\-]+", "", candidate)
    candidate = re.sub(r"[\s:：;；,.、，\-]+$", "", candidate)
    candidate = re.sub(r"\s{2,}", " ", candidate).strip()

    lowered = candidate.lower()
    if not candidate:
        return ""
    if any(marker in lowered for marker in TITLE_SKIP_WORDS):
        return ""
    if DATE_RE.search(candidate):
        return ""
    if len(candidate) < 4 or len(candidate) > 80:
        return ""
    return candidate


def _extract_patent_date(text: str) -> str:
    labeled_date = _extract_labeled_value(text, ("申请日", "申请日期", "申请时间"))
    for candidate in (labeled_date, text):
        if not candidate:
            continue
        match = DATE_RE.search(candidate)
        if match:
            year, month, day = match.group(1), match.group(2), match.group(3) or "1"
            return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
    return ""


def _extract_labeled_value(text: str, labels: tuple[str, ...]) -> str:
    for label in labels:
        match = re.search(rf"{label}\s*[:：]?\s*([^\n]+)", text, re.IGNORECASE)
        if not match:
            continue
        candidate = match.group(1).strip()
        candidate = re.split(r"[；;\n]", candidate)[0].strip()
        if candidate:
            return candidate[:120]
    return ""


def _extract_name_list(text: str, labels: tuple[str, ...]) -> list[str]:
    raw = ""
    for label in labels:
        match = re.search(rf"{label}\s*[:：]?\s*([^\n]+)", text, re.IGNORECASE)
        if match:
            raw = match.group(1).strip()
            break
    if not raw:
        return []

    names: list[str] = []
    for chunk in re.split(r"[、,，;；/\s]+", raw):
        candidate = chunk.strip()
        if len(candidate) < 2 or len(candidate) > 30:
            continue
        if candidate not in names:
            names.append(candidate)
    return names[:6]


def _extract_patent_abstract(context_text: str, title: str, patent_no: str) -> str:
    abstract = _extract_labeled_value(context_text, ("摘要",))
    if abstract:
        return abstract

    compact = context_text.replace("\n", " ")
    compact = compact.replace(patent_no, " ").replace(title, " ")
    compact = re.sub(r"\s{2,}", " ", compact).strip()
    if len(compact) > 160:
        compact = compact[:160].rstrip("，,;； ") + "。"
    return compact or "上传 PDF 中识别到该专利号，但未抽取到更完整摘要。"


def _score_patent_record(record: dict[str, Any]) -> int:
    score = 0
    if record.get("title") and "相关专利" not in record["title"]:
        score += 4
    if record.get("filingDate"):
        score += 3
    if record.get("applicant") and record["applicant"] != "公开信息待补":
        score += 2
    inventors = record.get("inventors") or []
    if inventors and inventors != ["公开信息待补"]:
        score += 2
    if record.get("abstract") and "未抽取" not in record["abstract"]:
        score += 1
    return score
