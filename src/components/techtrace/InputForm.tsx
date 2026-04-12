import { useRef, useState } from "react";
import { Eye, Search, Upload, X } from "lucide-react";

import {
  DATA_SOURCE_OPTIONS,
  SUPPLEMENTAL_TYPE_OPTIONS,
  type AnalysisRequestInput,
  type SupplementalTypeKey,
  type SupplementalUploadInput,
} from "@/types/analysis";

interface InputFormProps {
  onSubmit: (data: AnalysisRequestInput) => void;
  isSubmitting?: boolean;
}

const InputForm = ({ onSubmit, isSubmitting = false }: InputFormProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [company, setCompany] = useState("Wolfspeed, Inc.");
  const [keywords, setKeywords] = useState("SiC MOSFET, 8-inch SiC substrate, power module");
  const [sources, setSources] = useState<string[]>(["google", "lens", "arxiv"]);
  const [publicUrlsText, setPublicUrlsText] = useState("");
  const [timeRange, setTimeRange] = useState("10");
  const [selectedUploadCategory, setSelectedUploadCategory] = useState<SupplementalTypeKey>("whitepaper");
  const [supplementalUploads, setSupplementalUploads] = useState<SupplementalUploadInput[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const toggleSource = (id: string) => {
    setSources((current) => (current.includes(id) ? current.filter((source) => source !== id) : [...current, id]));
  };

  const handleAppendFiles = (files: FileList | null) => {
    const incomingFiles = Array.from(files ?? []);
    if (incomingFiles.length === 0) return;

    const validFiles = incomingFiles.filter((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
    if (validFiles.length !== incomingFiles.length) {
      setUploadError("当前仅支持 PDF 文件。");
    } else {
      setUploadError(null);
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSupplementalUploads((current) => [
      ...current,
      ...validFiles.map((file, index) => ({
        id: `${selectedUploadCategory}-${file.name}-${file.size}-${Date.now()}-${index}`,
        type: selectedUploadCategory,
        file,
      })),
    ]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePreviewFile = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    const previewWindow = window.open(previewUrl, "_blank", "noopener,noreferrer");
    if (!previewWindow) {
      URL.revokeObjectURL(previewUrl);
      return;
    }

    previewWindow.addEventListener(
      "beforeunload",
      () => {
        URL.revokeObjectURL(previewUrl);
      },
      { once: true },
    );
  };

  const handleRemoveUpload = (uploadId: string) => {
    setSupplementalUploads((current) => current.filter((item) => item.id !== uploadId));
  };

  const handleSubmit = () => {
    onSubmit({
      company,
      keywords,
      sources,
      publicUrls: publicUrlsText
        .split(/\n|,|，|;|；/)
        .map((item) => item.trim())
        .filter(Boolean),
      timeRange,
      role: "tech_expert",
      stage: "deep_dd",
      supplementalType: supplementalUploads[0]?.type ?? selectedUploadCategory,
      supplementalUploads,
    });
  };

  const isDisabled = !company.trim() || !keywords.trim() || sources.length === 0 || isSubmitting;
  const groupedUploads = SUPPLEMENTAL_TYPE_OPTIONS.map((option) => ({
    ...option,
    files: supplementalUploads.filter((item) => item.type === option.key),
  })).filter((option) => option.files.length > 0);

  return (
    <div className="card-base space-y-6 p-6">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">标的公司名称</label>
          <input
            type="text"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="输入公司名称..."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">技术关键词</label>
          <input
            type="text"
            value={keywords}
            onChange={(event) => setKeywords(event.target.value)}
            placeholder="多个关键词用逗号分隔..."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">示例：固态激光雷达, MEMS振镜, FMCW</p>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-foreground">数据源选择</label>
        <div className="grid grid-cols-2 gap-2">
          {DATA_SOURCE_OPTIONS.map((source) => (
            <label
              key={source.id}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition-colors ${
                sources.includes(source.id) ? "border-foreground bg-accent/50" : "border-border hover:bg-accent/30"
              }`}
            >
              <input
                type="checkbox"
                checked={sources.includes(source.id)}
                onChange={() => toggleSource(source.id)}
                className="sr-only"
              />
              <div
                className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                  sources.includes(source.id) ? "border-foreground bg-foreground" : "border-muted-foreground"
                }`}
              >
                {sources.includes(source.id) && <span className="text-[9px] text-background">✓</span>}
              </div>
              <div>
                <span className="text-xs font-medium text-foreground">{source.label}</span>
                <span className="ml-1.5 text-[10px] text-muted-foreground">{source.desc}</span>
              </div>
            </label>
          ))}
        </div>
        {sources.length === 0 && <p className="mt-2 text-[10px] text-destructive">至少选择一个数据源后才能开始分析。</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground">分析时间范围</label>
        <select
          value={timeRange}
          onChange={(event) => setTimeRange(event.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="5">近 5 年</option>
          <option value="10">近 10 年</option>
          <option value="15">近 15 年</option>
          <option value="20">近 20 年</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground">公开网页来源（可选）</label>
        <textarea
          value={publicUrlsText}
          onChange={(event) => setPublicUrlsText(event.target.value)}
          placeholder={"可粘贴官网新闻页、产品页、团队页、白皮书落地页等公开 URL\n每行一个，或用逗号分隔"}
          rows={4}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground">补充材料（可选）</label>
        <div className="rounded-xl border border-border bg-accent/20 p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <select
              value={selectedUploadCategory}
              onChange={(event) => setSelectedUploadCategory(event.target.value as SupplementalTypeKey)}
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {SUPPLEMENTAL_TYPE_OPTIONS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(event) => handleAppendFiles(event.target.files)}
            />
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 block w-full rounded-md border border-dashed border-border bg-background/80 px-4 py-4 text-center transition-colors hover:bg-accent/30"
          >
            <Upload className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">点击这里上传到当前类别；可重复切换类别继续追加 PDF。</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              文件中的水印、页眉页脚会先做清洗；若是扫描件或图片型 PDF，会标记为需 OCR，避免直接误判。
            </p>
          </button>

          {uploadError && <p className="mt-2 text-[10px] text-destructive">{uploadError}</p>}

          {groupedUploads.length > 0 && (
            <div className="mt-3 space-y-3">
              {groupedUploads.map((group) => (
                <div key={group.key} className="rounded-lg border border-border bg-background px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-foreground">{group.label}</p>
                      <p className="text-[10px] text-muted-foreground">{group.desc}</p>
                    </div>
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">{group.files.length} 份</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {group.files.map((upload) => (
                      <div key={upload.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-accent/20 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handlePreviewFile(upload.file)}
                            className="truncate text-left text-xs font-medium text-foreground hover:underline"
                          >
                            {upload.file.name}
                          </button>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">{formatFileSize(upload.file.size)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePreviewFile(upload.file)}
                            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="h-3 w-3" />
                            预览
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveUpload(upload.id)}
                            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                            取消
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isDisabled}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Search className="h-4 w-4" />
        {isSubmitting ? "正在提交分析..." : "开始分析"}
      </button>
    </div>
  );
};

function formatFileSize(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

export default InputForm;
