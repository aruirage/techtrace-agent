from __future__ import annotations

import logging
from typing import Annotated, Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .analysis_engine import build_analysis
from .pdf_utils import extract_pdf_text
from .settings import get_list_env

app = FastAPI(title="TechTrace Agent API", version="0.1.0")
logger = logging.getLogger(__name__)

cors_origins = get_list_env(
    "TECHTRACE_CORS_ORIGINS",
    ["http://localhost:8080", "http://127.0.0.1:8080"],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(
    company: Annotated[str, Form(...)],
    keywords: Annotated[str, Form(...)],
    sources: Annotated[list[str], Form(...)],
    time_range: Annotated[int, Form(..., ge=1, le=20)],
    role: Annotated[str, Form(...)],
    stage: Annotated[str, Form(...)],
    supplemental_type: Annotated[str | None, Form()] = None,
    supplemental_material_types: Annotated[list[str] | None, Form()] = None,
    public_urls: Annotated[list[str] | None, Form()] = None,
    supplemental: Annotated[list[UploadFile] | None, File()] = None,
) -> dict[str, Any]:
    if not company.strip():
        raise HTTPException(status_code=400, detail="公司名称不能为空。")
    if not keywords.strip():
        raise HTTPException(status_code=400, detail="技术关键词不能为空。")
    if not sources:
        raise HTTPException(status_code=400, detail="至少选择一个数据源。")

    supplemental_materials: list[dict[str, Any]] = []
    if supplemental:
        normalized_material_types = list(supplemental_material_types or [])
        if normalized_material_types and len(normalized_material_types) != len(supplemental):
            raise HTTPException(status_code=400, detail="补充材料类型数量与上传文件数量不一致。")
        if not normalized_material_types:
            fallback_type = supplemental_type or "other"
            normalized_material_types = [fallback_type for _ in supplemental]

        for uploaded_file, material_type in zip(supplemental, normalized_material_types, strict=True):
            filename = uploaded_file.filename or "supplemental.pdf"
            content_type = uploaded_file.content_type or "application/octet-stream"
            if content_type != "application/pdf" and not filename.lower().endswith(".pdf"):
                raise HTTPException(status_code=400, detail="当前仅支持上传 PDF 文件。")

            file_bytes = await uploaded_file.read()
            extracted_text, extraction_meta = extract_pdf_text(file_bytes)
            supplemental_materials.append(
                {
                    "filename": filename,
                    "contentType": content_type,
                    "sizeBytes": len(file_bytes),
                    "materialType": material_type or "other",
                    "pageCount": extraction_meta.get("pageCount"),
                    "extractionStatus": extraction_meta.get("status"),
                    "extractionNote": extraction_meta.get("note"),
                    "extractedText": extracted_text,
                    "watermarkCleaned": extraction_meta.get("watermarkCleaned"),
                    "suspectedScan": extraction_meta.get("suspectedScan"),
                }
            )

    try:
        return build_analysis(
            company=company,
            keywords=keywords,
            sources=sources,
            public_urls=public_urls or [],
            time_range=time_range,
            role=role,
            stage=stage,
            supplemental_materials=supplemental_materials,
        )
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - runtime safety
        logger.exception("Analysis request failed")
        raise HTTPException(status_code=500, detail=f"分析服务内部错误: {exc}") from exc
