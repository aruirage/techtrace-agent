import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, FileEdit, FileText, RotateCcw } from "lucide-react";

import SectionHeader from "@/components/industry/SectionHeader";
import {
  buildFullReportTextFromSections,
  buildReportSections,
  exportReportToPdf,
  exportReportToWord,
  isMockAnalysis,
  type ReportSection,
} from "@/lib/report";
import type { AnalysisResult } from "@/types/analysis";

interface ReportPreviewProps {
  result: AnalysisResult;
}

const ReportPreview = ({ result }: ReportPreviewProps) => {
  const [copied, setCopied] = useState(false);
  const [draftSections, setDraftSections] = useState<ReportSection[]>(() => buildReportSections(result));
  const mockMode = isMockAnalysis(result);

  useEffect(() => {
    setDraftSections(buildReportSections(result));
  }, [result]);

  const fullReport = useMemo(() => buildFullReportTextFromSections(draftSections), [draftSections]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullReport);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handlePdfExport = () => {
    exportReportToPdf(result, draftSections);
  };

  const handleWordExport = () => {
    exportReportToWord(result, draftSections);
  };

  const handleReset = () => {
    setDraftSections(buildReportSections(result));
  };

  const updateSection = (index: number, next: Partial<ReportSection>) => {
    setDraftSections((current) =>
      current.map((section, sectionIndex) => (sectionIndex === index ? { ...section, ...next } : section)),
    );
  };

  return (
    <section>
      <SectionHeader
        number="6"
        title={mockMode ? "Mock 演示报告" : "正式结构化报告"}
        subtitle={mockMode ? "仅用于流程演示，不与正式尽调报告混用；如需正式报告，请使用真实检索结果。" : "支持在线编辑、复制与导出；复制和导出都以当前编辑内容为准"}
      />

      <div className={`card-base p-4 ${mockMode ? "border-amber-200 bg-amber-50/40" : ""}`}>
        {mockMode && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
            当前为 Mock 演示结果。该报告与真实检索报告分开展示、分开导出，不应作为正式尽调结论使用。
          </div>
        )}

        <div className="flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{result.companyInfo.name}_{mockMode ? "Mock演示报告" : "技术尽调报告"}_{result.generatedAt.slice(0, 10)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent/50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              重置内容
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent/50"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "已复制" : "复制全文"}
            </button>
            <button
              onClick={handlePdfExport}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background transition-colors hover:bg-foreground/90"
            >
              <Download className="h-3.5 w-3.5" />
              导出 PDF
            </button>
            <button
              onClick={handleWordExport}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent/50"
            >
              <Download className="h-3.5 w-3.5" />
              导出 Word
            </button>
          </div>
        </div>

        <div className="space-y-6 pt-4">
          {draftSections.map((section, index) => (
            <div key={`${section.title}-${index}`} className="rounded-xl border border-border bg-background p-4">
              <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <FileEdit className="h-3.5 w-3.5" />
                可编辑章节
              </div>
              <input
                value={section.title}
                onChange={(event) => updateSection(index, { title: event.target.value })}
                className="w-full border-0 bg-transparent px-0 text-sm font-semibold text-foreground focus:outline-none"
              />
              <textarea
                value={section.content}
                onChange={(event) => updateSection(index, { content: event.target.value })}
                rows={Math.max(8, section.content.split("\n").length + 1)}
                className="mt-3 w-full resize-y rounded-lg border border-border bg-card px-3 py-3 font-sans text-[12px] leading-6 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-border pt-3 text-center text-[10px] text-muted-foreground">
          报告生成时间: {new Date(result.generatedAt).toLocaleString("zh-CN")} · 数据来源: {result.sourceCoverage.filter((item) => item.count > 0).map((item) => item.label).join("、") || "暂无"} · 分析模式: {result.analysisMeta.mode === "ai_enhanced" ? "OpenAI 增强" : "规则模板"} · {mockMode ? "当前为 Mock 演示报告" : "当前为正式结构化报告"}
        </div>
      </div>
    </section>
  );
};

export default ReportPreview;
