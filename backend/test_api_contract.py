from __future__ import annotations

from io import BytesIO
import unittest

from fastapi.testclient import TestClient
from pypdf import PdfWriter

import backend.analysis_engine as analysis_engine
from backend.app import app


class AnalyzeApiContractTest(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)
        self._original_google = analysis_engine.search_google_patents
        self._original_lens = analysis_engine.search_lens_patents
        self._original_arxiv = analysis_engine.fetch_and_parse_arxiv

        patents = [
            {
                "title": "MEMS lidar scan stabilization",
                "patentNo": "US20240123456A1",
                "applicant": "Test Tech",
                "inventors": ["A", "B"],
                "filingDate": "2023-03-01",
                "abstract": "stabilization",
                "source": "Google Patents",
                "sourceUrl": "https://example.com/p1",
                "citedBy": 7,
            },
            {
                "title": "MEMS lidar thermal calibration",
                "patentNo": "US20230123456A1",
                "applicant": "Test Tech",
                "inventors": ["A", "C"],
                "filingDate": "2022-05-01",
                "abstract": "calibration",
                "source": "Lens.org",
                "sourceUrl": "https://example.com/p2",
                "citedBy": 2,
            },
            {
                "title": "MEMS lidar optical packaging",
                "patentNo": "US20220123456A1",
                "applicant": "Test Tech",
                "inventors": ["D"],
                "filingDate": "2021-07-01",
                "abstract": "packaging",
                "source": "Google Patents",
                "sourceUrl": "https://example.com/p3",
                "citedBy": 1,
            },
        ]

        analysis_engine.search_google_patents = lambda **kwargs: patents[:2]
        analysis_engine.search_lens_patents = lambda **kwargs: patents[1:3]
        analysis_engine.fetch_and_parse_arxiv = lambda **kwargs: [
            {
                "title": "Lidar paper",
                "summary": "summary",
                "published": "2024-01-01",
                "authors": ["X", "Y"],
                "link": "https://arxiv.org/abs/1234.5678",
                "arxiv_id": "1234.5678",
            }
        ]

    def tearDown(self) -> None:
        analysis_engine.search_google_patents = self._original_google
        analysis_engine.search_lens_patents = self._original_lens
        analysis_engine.fetch_and_parse_arxiv = self._original_arxiv

    def test_live_analyze_response_has_ui_required_fields(self) -> None:
        pdf_bytes = _build_blank_pdf()
        files = [
            ("company", (None, "Test Tech")),
            ("keywords", (None, "MEMS lidar, scan")),
            ("sources", (None, "google")),
            ("sources", (None, "lens")),
            ("sources", (None, "arxiv")),
            ("time_range", (None, "10")),
            ("role", (None, "tech_expert")),
            ("stage", (None, "deep_dd")),
            ("supplemental_material_types", (None, "whitepaper")),
            ("supplemental", ("whitepaper.pdf", pdf_bytes, "application/pdf")),
        ]

        response = self.client.post("/api/analyze", files=files)
        self.assertEqual(response.status_code, 200)
        payload = response.json()

        required_top_level_keys = {
            "analysisId",
            "generatedAt",
            "request",
            "analysisMeta",
            "companyInfo",
            "patents",
            "inventors",
            "techBranches",
            "citations",
            "papers",
            "evolutionMetrics",
            "productLifecycle",
            "techClaims",
            "barriers",
            "defensibilityConclusion",
            "evolutionStage",
            "teamAssessment",
            "expertProfiles",
            "interviewQuestions",
            "dangerSignals",
            "sourceCoverage",
            "publicWebSources",
            "supplementalMaterials",
        }
        self.assertTrue(required_top_level_keys.issubset(payload.keys()))

        request_keys = {
            "company",
            "keywords",
            "sources",
            "publicUrls",
            "timeRange",
            "role",
            "stage",
            "supplementalType",
            "supplementalTypes",
            "roleLabel",
            "stageLabel",
        }
        self.assertTrue(request_keys.issubset(payload["request"].keys()))

        self.assertEqual(payload["analysisMeta"]["origin"], "live")
        self.assertIsInstance(payload["productLifecycle"]["stage"], str)
        self.assertIsInstance(payload["teamAssessment"]["members"], list)
        self.assertIsInstance(payload["techClaims"], list)
        self.assertIsInstance(payload["barriers"], list)
        self.assertIsInstance(payload["sourceCoverage"], list)
        self.assertIsInstance(payload["supplementalMaterials"], list)

    def test_health_routes_are_available(self) -> None:
        for path in ("/health", "/api/health"):
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200, path)
            self.assertEqual(response.json(), {"status": "ok"})


def _build_blank_pdf() -> bytes:
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    buffer = BytesIO()
    writer.write(buffer)
    return buffer.getvalue()


if __name__ == "__main__":
    unittest.main()
