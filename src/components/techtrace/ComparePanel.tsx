import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { BarChart3, CheckCircle2, Clock3, Eye, GripHorizontal, PanelTopClose, Trash2 } from "lucide-react";

import { getEffectiveProductLifecycle, hasLifecycleOverride } from "@/lib/lifecycle";
import type { AnalysisResult } from "@/types/analysis";

interface ComparePanelProps {
  analyses: AnalysisResult[];
  selectedIds: string[];
  onToggleSelected: (id: string) => void;
  onOpenAnalysis: (id: string) => void;
  onRemoveAnalysis: (id: string) => void;
  onClose?: () => void;
}

const strengthMap = {
  strong: "强",
  moderate: "中",
  weak: "弱",
};

const riskMap = {
  high: "高",
  medium: "中",
  low: "低",
};

const confidenceMap = {
  high: "高",
  medium: "中",
  low: "低",
};

const ComparePanel = ({
  analyses,
  selectedIds,
  onToggleSelected,
  onOpenAnalysis,
  onRemoveAnalysis,
  onClose,
}: ComparePanelProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<{ pointerId: number; startX: number; startScrollLeft: number } | null>(null);

  if (analyses.length === 0) {
    return null;
  }

  const selectedAnalyses = analyses.filter((analysis) => selectedIds.includes(analysis.analysisId));

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    scrollRef.current.setPointerCapture(event.pointerId);
    setDragState({
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: scrollRef.current.scrollLeft,
    });
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!scrollRef.current || !dragState || dragState.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - dragState.startX;
    scrollRef.current.scrollLeft = dragState.startScrollLeft - deltaX;
  };

  const clearDragState = () => {
    setDragState(null);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" />
            横向对比分析台
          </div>
          <h2 className="mt-3 text-lg font-semibold tracking-tight text-foreground">检索档案与多标的对比</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">左侧管理已归档结果，右侧做对比。可直接在表格区域横向拖动，不必费力去拉底部滚动条。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs text-muted-foreground">
            <GripHorizontal className="h-3.5 w-3.5" />
            已选 {selectedAnalyses.length}/3
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent/50"
            >
              <PanelTopClose className="h-3.5 w-3.5" />
              收起对比界面
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="card-base space-y-3 p-4">
          <div className="border-b border-border pb-3">
            <h3 className="text-sm font-semibold text-foreground">检索档案</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">把想比较的公司加入右侧对比台。至少选择 2 家，最多 3 家。</p>
          </div>

          {analyses.map((analysis) => {
            const selected = selectedIds.includes(analysis.analysisId);
            const verifiedCount = analysis.techClaims.filter((claim) => claim.status === "verified").length;
            const effectiveLifecycle = getEffectiveProductLifecycle(analysis.productLifecycle, analysis.lifecycleOverride);
            return (
              <div
                key={analysis.analysisId}
                className={`rounded-xl border px-4 py-4 transition-colors ${
                  selected ? "border-foreground bg-accent/50" : "border-border bg-background"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{analysis.companyInfo.name}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{analysis.companyInfo.techKeywords.join("、")}</p>
                    <p className="mt-2 text-xs font-medium text-foreground">
                      生命周期: {effectiveLifecycle.stage} {hasLifecycleOverride(analysis.lifecycleOverride) ? "· 人工修正" : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">已验证声明 {verifiedCount} 条</p>
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      {new Date(analysis.generatedAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  {selected && <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 text-foreground" />}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => onToggleSelected(analysis.analysisId)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      selected ? "bg-foreground text-background" : "bg-accent text-foreground hover:bg-accent/70"
                    }`}
                  >
                    {selected ? "取消对比" : "加入对比台"}
                  </button>
                  <button
                    onClick={() => onOpenAnalysis(analysis.analysisId)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent/50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    打开结果
                  </button>
                  <button
                    onClick={() => onRemoveAnalysis(analysis.analysisId)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card-base overflow-hidden">
          <div className="border-b border-border bg-accent/20 px-4 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">对比台</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">表格字号已放大。按住表格区域左右拖动，或使用触控板横向滑动。</p>
              </div>
              <span className="rounded-full bg-background px-3 py-1 text-[11px] text-muted-foreground">横向拖动更顺手</span>
            </div>
          </div>

          {selectedAnalyses.length < 2 ? (
            <div className="flex min-h-[320px] items-center justify-center px-6 text-center">
              <div>
                <BarChart3 className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">至少选择 2 个标的，才能开始横向比较</p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">从左侧检索档案里点“加入对比台”，就会出现在这里。</p>
              </div>
            </div>
          ) : (
            <div
              ref={scrollRef}
              className={`compare-scrollbar overflow-x-auto overflow-y-hidden px-0 pb-3 scroll-smooth ${dragState ? "cursor-grabbing" : "cursor-grab"}`}
              style={{ WebkitOverflowScrolling: "touch" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={clearDragState}
              onPointerCancel={clearDragState}
              onPointerLeave={clearDragState}
            >
              <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 w-[128px] border-b border-r border-border bg-card px-3 py-3 text-sm font-semibold text-foreground shadow-[1px_0_0_0_theme(colors.border)]">
                      对比指标
                    </th>
                    {selectedAnalyses.map((analysis) => (
                      <th key={analysis.analysisId} className="min-w-[220px] border-b border-border bg-card px-3 py-3 text-sm font-semibold text-foreground">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{analysis.companyInfo.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{analysis.companyInfo.techKeywords.join("、")}</p>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <CompareRow
                    label="标的公司"
                    values={selectedAnalyses.map((analysis) => analysis.companyInfo.name)}
                    variant="hero"
                  />
                  <CompareRow label="技术关键词" values={selectedAnalyses.map((analysis) => analysis.companyInfo.techKeywords.join("、"))} />
                  <CompareRow label="产品生命周期" values={selectedAnalyses.map((analysis) => getEffectiveProductLifecycle(analysis.productLifecycle, analysis.lifecycleOverride).stage)} />
                  <CompareRow label="生命周期置信度" values={selectedAnalyses.map((analysis) => confidenceMap[analysis.productLifecycle.confidence])} />
                  <CompareRow label="人工修正" values={selectedAnalyses.map((analysis) => (hasLifecycleOverride(analysis.lifecycleOverride) ? "是" : "否"))} />
                  <CompareRow label="修正说明" values={selectedAnalyses.map((analysis) => analysis.lifecycleOverride?.note || "暂无")} long />
                  <CompareRow label="生命周期依据" values={selectedAnalyses.map((analysis) => analysis.productLifecycle.evidence.slice(0, 2).join(" "))} long />
                  <CompareRow label="专利总数" values={selectedAnalyses.map((analysis) => String(analysis.companyInfo.totalPatents))} />
                  <CompareRow label="核心专利" values={selectedAnalyses.map((analysis) => String(analysis.patents.filter((patent) => patent.isCorePatent).length))} />
                  <CompareRow label="已验证声明" values={selectedAnalyses.map((analysis) => String(analysis.techClaims.filter((claim) => claim.status === "verified").length))} />
                  <CompareRow label="部分验证声明" values={selectedAnalyses.map((analysis) => String(analysis.techClaims.filter((claim) => claim.status === "partially_verified").length))} />
                  <CompareRow label="综合壁垒均分" values={selectedAnalyses.map((analysis) => String(averageBarrierScore(analysis)))} />
                  <CompareRow label="专利壁垒" values={selectedAnalyses.map((analysis) => formatBarrier(analysis, "patent"))} />
                  <CompareRow label="工程壁垒" values={selectedAnalyses.map((analysis) => formatBarrier(analysis, "engineering"))} />
                  <CompareRow label="团队匹配度" values={selectedAnalyses.map((analysis) => strengthMap[analysis.teamAssessment.overallStrength])} />
                  <CompareRow label="关键人依赖" values={selectedAnalyses.map((analysis) => riskMap[analysis.teamAssessment.benchRisk])} />
                  <CompareRow
                    label="来源覆盖"
                    values={selectedAnalyses.map((analysis) =>
                      analysis.sourceCoverage
                        .filter((item) => item.count > 0)
                        .map((item) => `${item.label}:${item.count}`)
                        .join(" / "),
                    )}
                  />
                  <CompareRow label="主要未解风险" values={selectedAnalyses.map((analysis) => firstRisk(analysis))} long />
                  <CompareRow label="综合结论" values={selectedAnalyses.map((analysis) => analysis.defensibilityConclusion)} long />
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

interface CompareRowProps {
  label: string;
  values: string[];
  long?: boolean;
  variant?: "default" | "hero";
}

const CompareRow = ({ label, values, long, variant = "default" }: CompareRowProps) => (
  <tr className={variant === "hero" ? "bg-foreground" : "even:bg-accent/10"}>
    <td
      className={`sticky left-0 z-10 w-[128px] border-b border-r border-border px-3 py-3 align-top text-[13px] font-semibold shadow-[1px_0_0_0_theme(colors.border)] ${
        variant === "hero" ? "bg-foreground text-background" : "bg-card text-foreground"
      }`}
    >
      {label}
    </td>
    {values.map((value, index) => (
      <td
        key={`${label}-${index}`}
        className={`border-b border-border px-3 py-3 align-top ${
          variant === "hero"
            ? "bg-foreground text-base font-semibold tracking-tight text-background"
            : long
              ? "text-[12px] leading-6 text-muted-foreground"
              : "text-[13px] font-medium leading-6 text-foreground"
        }`}
      >
        {value || "暂无"}
      </td>
    ))}
  </tr>
);

function averageBarrierScore(analysis: AnalysisResult) {
  if (analysis.barriers.length === 0) {
    return 0;
  }
  return Math.round(analysis.barriers.reduce((sum, barrier) => sum + barrier.score, 0) / analysis.barriers.length);
}

function formatBarrier(analysis: AnalysisResult, type: "patent" | "engineering") {
  const barrier = analysis.barriers.find((item) => item.type === type);
  if (!barrier) {
    return "暂无";
  }
  return `${barrier.score}/100 · ${strengthMap[barrier.strength]}`;
}

function firstRisk(analysis: AnalysisResult) {
  return analysis.productLifecycle.keyRisks[0] || analysis.teamAssessment.keyRisks[0] || analysis.barriers[0]?.gaps[0] || "暂无";
}

export default ComparePanel;
