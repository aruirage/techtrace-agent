import type { AnalysisRequestInput, AnalysisResult } from "@/types/analysis";

const CONFIGURED_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export interface ApiHealthStatus {
  ok: boolean;
  detail: string;
}

export async function analyzeCompany(input: AnalysisRequestInput): Promise<AnalysisResult> {
  const formData = new FormData();
  const supplementalUploads = input.supplementalUploads ?? [];
  formData.set("company", input.company.trim());
  formData.set("keywords", input.keywords.trim());
  formData.set("time_range", input.timeRange);
  formData.set("role", input.role);
  formData.set("stage", input.stage);

  input.sources.forEach((source) => {
    formData.append("sources", source);
  });

  input.publicUrls.forEach((url) => {
    formData.append("public_urls", url);
  });

  if (supplementalUploads.length > 0) {
    supplementalUploads.forEach((upload) => {
      formData.append("supplemental_material_types", upload.type);
      formData.append("supplemental", upload.file);
    });
  } else {
    const fallbackType = input.supplementalType ?? "other";
    (input.supplementalFiles ?? []).forEach((file) => {
      formData.append("supplemental_material_types", fallbackType);
      formData.append("supplemental", file);
    });
  }

  let lastNetworkError: unknown = null;
  for (const baseUrl of buildApiBaseCandidates()) {
    try {
      const response = await fetch(`${baseUrl}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const detail = await readErrorDetail(response);
        throw new Error(detail);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error && !isLikelyNetworkError(error)) {
        throw error;
      }
      lastNetworkError = error;
    }
  }

  throw new Error(buildNetworkErrorMessage(lastNetworkError));
}

export async function checkApiHealth(): Promise<ApiHealthStatus> {
  let lastNetworkError: unknown = null;

  for (const baseUrl of buildApiBaseCandidates()) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (!response.ok) {
        return {
          ok: false,
          detail: `分析 API 健康检查失败（${response.status}）。`,
        };
      }

      return {
        ok: true,
        detail: "前后端 API 通路正常，可继续做真实检索。外部数据源是否可用仍取决于当前网络和 API Key。",
      };
    } catch (error) {
      lastNetworkError = error;
    }
  }

  return {
    ok: false,
    detail: buildNetworkErrorMessage(lastNetworkError),
  };
}

async function readErrorDetail(response: Response) {
  try {
    const payload = await response.json();
    if (typeof payload.detail === "string") {
      return payload.detail;
    }
  } catch {
    return `分析请求失败（${response.status}）`;
  }

  return `分析请求失败（${response.status}）`;
}

function buildApiBaseCandidates() {
  const candidates = import.meta.env.DEV ? ["", CONFIGURED_API_BASE_URL] : [CONFIGURED_API_BASE_URL || ""];
  return [...new Set(candidates.filter((item) => item !== undefined))];
}

function isLikelyNetworkError(error: Error) {
  return /fetch|network|load failed/i.test(error.message);
}

function buildNetworkErrorMessage(error: unknown) {
  const detail = error instanceof Error ? ` 原始错误: ${error.message}` : "";
  return (
    "无法连接分析 API。请确认后端 `uvicorn backend.app:app --reload --port 8000` 已启动，" +
    "并优先在本地开发时将 `VITE_API_BASE_URL` 留空以使用 Vite 代理。" +
    detail
  );
}
