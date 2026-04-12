import { useEffect, useState } from "react";
import { Activity, Cpu, Database, FileSearch, FileText, FlaskConical, Loader2, MessageSquare, Shield } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import BarrierAssessment from "@/components/techtrace/BarrierAssessment";
import ComparePanel from "@/components/techtrace/ComparePanel";
import InputForm from "@/components/techtrace/InputForm";
import InterviewPack from "@/components/techtrace/InterviewPack";
import LifecycleTeamPanel from "@/components/techtrace/LifecycleTeamPanel";
import PatentTimeline from "@/components/techtrace/PatentTimeline";
import ReportPreview from "@/components/techtrace/ReportPreview";
import TechEvolution from "@/components/techtrace/TechEvolution";
import { analyzeCompany, checkApiHealth } from "@/lib/api";
import { getEffectiveProductLifecycle } from "@/lib/lifecycle";
import { DEMO_SCENARIOS } from "@/mock/demoAnalyses";
import type { AnalysisRequestInput, AnalysisResult } from "@/types/analysis";

type AppState = "input" | "loading" | "result";

type LoadingStep = {
  label: string;
  icon: typeof Database;
  duration: number;
};

const strengthLabelMap = {
  strong: "强",
  moderate: "中",
  weak: "弱",
} as const;

const HISTORY_STORAGE_KEY = "techtrace-analysis-history-v1";
const COMPARE_STORAGE_KEY = "techtrace-compare-selection-v1";

const Index = () => {
  const [state, setState] = useState<AppState>("input");
  const [loadingStep, setLoadingStep] = useState(0);
  const [activeRequest, setActiveRequest] = useState<AnalysisRequestInput | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [healthMessage, setHealthMessage] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<"idle" | "ok" | "error">("idle");
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [history, setHistory] = useState<AnalysisResult[]>(() => readStoredAnalyses());
  const [compareIds, setCompareIds] = useState<string[]>(() => readStoredCompareIds());
  const [showCompare, setShowCompare] = useState(false);

  const loadingSteps = buildLoadingSteps(activeRequest?.sources ?? [], countSupplementalUploads(activeRequest) > 0);

  const mutation = useMutation({
    mutationFn: analyzeCompany,
    onSuccess: (nextResult) => {
      setResult(nextResult);
      setHistory((current) => mergeAnalysisHistory(current, nextResult));
      setCompareIds((current) => mergeCompareIds(current, nextResult.analysisId));
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : "分析失败，请稍后重试。");
      setState("input");
      setLoadingStep(0);
    },
  });

  useEffect(() => {
    writeStoredAnalyses(history);
  }, [history]);

  useEffect(() => {
    writeStoredCompareIds(compareIds);
  }, [compareIds]);

  useEffect(() => {
    if (state !== "loading") return;

    const steps = buildLoadingSteps(activeRequest?.sources ?? [], countSupplementalUploads(activeRequest) > 0);
    if (mutation.isSuccess) {
      if (loadingStep >= steps.length) {
        setState("result");
        return;
      }

      const timer = window.setTimeout(() => {
        setLoadingStep((current) => Math.min(current + 1, steps.length));
      }, 140);

      return () => window.clearTimeout(timer);
    }

    if (loadingStep >= steps.length - 1) {
      return;
    }

    const timer = window.setTimeout(() => {
      setLoadingStep((current) => Math.min(current + 1, steps.length - 1));
    }, steps[Math.min(loadingStep, steps.length - 1)].duration);

    return () => window.clearTimeout(timer);
  }, [state, loadingStep, mutation.isSuccess, activeRequest]);

  const handleSubmit = (request: AnalysisRequestInput) => {
    mutation.reset();
    setErrorMessage(null);
    setActiveRequest(request);
    setLoadingStep(0);
    setState("loading");
    setShowCompare(false);
    mutation.mutate(request);
  };

  const handleReset = () => {
    mutation.reset();
    setErrorMessage(null);
    setActiveRequest(null);
    setLoadingStep(0);
    setState("input");
  };

  const handleLoadMockFlow = () => {
    const demoAnalyses = DEMO_SCENARIOS.map((scenario) => scenario.analysis);
    const [primaryAnalysis] = demoAnalyses;
    if (!primaryAnalysis) return;

    mutation.reset();
    setErrorMessage(null);
    setActiveRequest(null);
    setLoadingStep(0);
    setResult(primaryAnalysis);
    setHistory((current) => mergeBatchHistory(current, demoAnalyses));
    setCompareIds(demoAnalyses.slice(0, 3).map((analysis) => analysis.analysisId));
    setShowCompare(true);
    setState("result");
  };

  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    setHealthMessage(null);
    setHealthStatus("idle");

    try {
      const status = await checkApiHealth();
      setHealthStatus(status.ok ? "ok" : "error");
      setHealthMessage(status.detail);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleOpenAnalysis = (analysisId: string) => {
    const nextResult = history.find((analysis) => analysis.analysisId === analysisId);
    if (!nextResult) return;

    setResult(nextResult);
    setErrorMessage(null);
    setState("result");
    setShowCompare(true);
  };

  const handleRemoveAnalysis = (analysisId: string) => {
    const nextHistory = history.filter((analysis) => analysis.analysisId !== analysisId);
    const nextCompareIds = compareIds.filter((id) => id !== analysisId);

    setHistory(nextHistory);
    setCompareIds(nextCompareIds);

    if (result?.analysisId === analysisId) {
      if (nextHistory[0]) {
        setResult(nextHistory[0]);
      } else {
        setResult(null);
        setState("input");
      }
    }
  };

  const handleToggleCompare = (analysisId: string) => {
    setCompareIds((current) => {
      if (current.includes(analysisId)) {
        return current.filter((id) => id !== analysisId);
      }
      return [analysisId, ...current].slice(0, 3);
    });
  };

  const handleSaveLifecycleOverride = (next: { stage: string; note: string }) => {
    if (!result) return;
    const updatedAnalysis: AnalysisResult = {
      ...result,
      lifecycleOverride: {
        stage: next.stage,
        note: next.note,
        updatedAt: new Date().toISOString(),
        source: "manual",
      },
    };
    setResult(updatedAnalysis);
    setHistory((current) => mergeAnalysisHistory(current, updatedAnalysis));
  };

  const handleClearLifecycleOverride = () => {
    if (!result) return;
    const updatedAnalysis: AnalysisResult = {
      ...result,
      lifecycleOverride: null,
    };
    setResult(updatedAnalysis);
    setHistory((current) => mergeAnalysisHistory(current, updatedAnalysis));
  };

  const activeResult = result ?? history[0] ?? null;
  const activeLifecycle = activeResult ? getEffectiveProductLifecycle(activeResult.productLifecycle, activeResult.lifecycleOverride) : null;
  const liveHistory = history.filter((analysis) => getAnalysisOrigin(analysis) === "live");
  const mockHistory = history.filter((analysis) => getAnalysisOrigin(analysis) === "mock");
  const compareScopeOrigin = activeResult ? getAnalysisOrigin(activeResult) : "live";
  const compareScopeAnalyses = history.filter((analysis) => getAnalysisOrigin(analysis) === compareScopeOrigin);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
            <h1 className="text-sm font-semibold text-foreground tracking-tight">TechTrace Agent</h1>
            <span className="text-xs text-muted-foreground">公开数据技术尽调与技术溯源</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {activeResult && state === "result" && (
              <>
                <span className="font-medium text-foreground">{activeResult.companyInfo.name}</span>
                <span>·</span>
                <span>{activeResult.request.keywords}</span>
              </>
            )}
            {state === "result" && (
              <button onClick={handleReset} className="text-xs underline hover:text-foreground">
                继续检索另一家公司
              </button>
            )}
          </div>
        </div>
      </header>

      {state === "input" && (
        <main className="max-w-6xl mx-auto px-4 py-12 space-y-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">公开数据技术尽调</h2>
            <p className="text-sm text-muted-foreground">围绕专利、论文、公开网页与上传材料，聚焦技术溯源、路线演进、生命周期、壁垒验证与横向对比，不涉及内部信息。</p>
          </div>

          <div className="mx-auto max-w-2xl">
            <InputForm onSubmit={handleSubmit} isSubmitting={mutation.isPending} />
            {errorMessage && (
              <div className="mt-4 rounded-lg border border-destructive/20 bg-red-50 px-4 py-3 text-xs text-red-700">
                {errorMessage}
              </div>
            )}
            <div className="mt-4 rounded-xl border border-border bg-card px-4 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-sm font-medium text-foreground">真实链路自检</h3>
                  <p className="mt-1 text-[11px] leading-6 text-muted-foreground">
                    用于面试前快速确认前后端 API 通路正常。它不会调用真实分析，也不校验每个外部数据源配额。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCheckHealth}
                  disabled={isCheckingHealth}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-foreground transition-colors hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCheckingHealth ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                  {isCheckingHealth ? "正在自检..." : "检查真实链路"}
                </button>
              </div>
              {healthMessage && (
                <div
                  className={`mt-3 rounded-lg px-3 py-2 text-[11px] leading-6 ${
                    healthStatus === "ok"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {healthMessage}
                </div>
              )}
            </div>
          </div>

          <section className="mx-auto max-w-2xl rounded-xl border border-border bg-accent/20 px-5 py-4">
            <h3 className="text-sm font-medium text-foreground">分析范围</h3>
            <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
              系统只处理公开数据与用户上传材料，重点服务技术真假判断、技术路线溯源、产品阶段判断、壁垒验证和技术向对比分析。
            </p>
          </section>

          <section className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-[10px] font-medium text-muted-foreground">
                  <FlaskConical className="h-3.5 w-3.5" />
                  Mock 全流程测试
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">一键载入 2 个海外 + 2 个国内样例，直接验证产品全流程</h3>
                <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
                  点击后不会请求真实 API，而是注入完整结构化结果、历史分析和对比台数据，用来演示技术溯源、生命周期判断、壁垒验证、团队公开线索、访谈问题和报告导出。
                </p>
              </div>
              <button
                onClick={handleLoadMockFlow}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                <FlaskConical className="h-4 w-4" />
                一键验证 Mock 全流程
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {DEMO_SCENARIOS.map((scenario) => (
                <article key={scenario.id} className="rounded-xl border border-border bg-accent/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-xs font-semibold text-foreground">{scenario.companyName}</h4>
                    <span className="rounded-full bg-background px-2 py-0.5 text-[9px] text-muted-foreground">
                      {scenario.marketLabel} · {scenario.sectorLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{scenario.summary}</p>
                  <p className="mt-3 text-[10px] text-foreground">覆盖重点: {scenario.highlights.join(" / ")}</p>
                </article>
              ))}
            </div>
          </section>

          {history.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-foreground">检索档案</h3>
                  <p className="text-xs text-muted-foreground mt-1">每次分析都会自动入档。你可以继续检索其他公司，再从档案里勾选 2-3 家做横向对比；真实分析和 Mock 演示仍然分开保存、分开对比。</p>
                </div>
                <button
                  onClick={() => setShowCompare((current) => !current)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent/50"
                >
                  {showCompare ? "收起档案与对比台" : "打开档案与对比台"}
                </button>
              </div>

              {showCompare && liveHistory.length > 0 && (
                <div className="space-y-2">
                  <div>
                    <h4 className="text-xs font-medium text-foreground">真实分析</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">用于实际 API 检索结果之间的横向对比。</p>
                  </div>
                  <ComparePanel
                    analyses={liveHistory}
                    selectedIds={compareIds}
                    onToggleSelected={handleToggleCompare}
                    onOpenAnalysis={handleOpenAnalysis}
                    onRemoveAnalysis={handleRemoveAnalysis}
                    onClose={() => setShowCompare(false)}
                  />
                </div>
              )}

              {showCompare && mockHistory.length > 0 && (
                <div className="space-y-2">
                  <div>
                    <h4 className="text-xs font-medium text-foreground">Mock 演示</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">仅用于演示流程，不与真实检索结果混合对比。</p>
                  </div>
                  <ComparePanel
                    analyses={mockHistory}
                    selectedIds={compareIds}
                    onToggleSelected={handleToggleCompare}
                    onOpenAnalysis={handleOpenAnalysis}
                    onRemoveAnalysis={handleRemoveAnalysis}
                    onClose={() => setShowCompare(false)}
                  />
                </div>
              )}
            </section>
          )}
        </main>
      )}

      {state === "loading" && (
        <main className="max-w-lg mx-auto px-4 py-24">
          <div className="text-center mb-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-foreground" />
            <h2 className="text-sm font-semibold text-foreground mb-1">正在分析 {activeRequest?.company}</h2>
            <p className="text-xs text-muted-foreground">系统正在拉取公开线索并生成结构化报告，请稍候</p>
          </div>
          <div className="space-y-2">
            {loadingSteps.map((step, index) => {
              const Icon = step.icon;
              const isDone = index < loadingStep;
              const isCurrent = index === loadingStep && loadingStep < loadingSteps.length;
              return (
                <div
                  key={step.label}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 ${
                    isDone ? "bg-accent/50" : isCurrent ? "bg-card border border-border" : "opacity-30"
                  }`}
                >
                  {isDone ? (
                    <span className="w-4 h-4 text-foreground text-xs">✓</span>
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 animate-spin text-foreground" />
                  ) : (
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={`text-xs ${isDone || isCurrent ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {state === "result" && activeResult && (
        <main className="max-w-6xl mx-auto px-4 py-6 space-y-10">
          <div className="card-base p-4 space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">{activeResult.companyInfo.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeResult.companyInfo.englishName} · {activeResult.companyInfo.industry} · {activeLifecycle?.stage ?? activeResult.companyInfo.stage} · {activeResult.companyInfo.headquarters}
                </p>
                {getAnalysisOrigin(activeResult) === "mock" && (
                  <span className="mt-2 inline-flex rounded-full bg-accent px-2 py-1 text-[10px] text-muted-foreground">
                    Mock 演示数据
                  </span>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeResult.companyInfo.techKeywords.map((keyword) => (
                    <span key={keyword} className="text-[10px] bg-accent text-muted-foreground px-2 py-0.5 rounded">{keyword}</span>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  分析引擎: {activeResult.analysisMeta.mode === "ai_enhanced" ? "OpenAI 增强" : "规则模板"} · {activeResult.analysisMeta.note}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground md:grid-cols-4">
                <span>专利总数: <strong className="text-foreground">{activeResult.companyInfo.totalPatents}</strong></span>
                <span>论文线索: <strong className="text-foreground">{activeResult.papers.length}</strong></span>
                <span>生命周期: <strong className="text-foreground">{activeLifecycle?.stage ?? activeResult.productLifecycle.stage}</strong></span>
                <span>团队线索: <strong className="text-foreground">{strengthLabelMap[activeResult.teamAssessment.overallStrength]}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              {activeResult.sourceCoverage.map((coverage) => (
                <div key={coverage.label} className="rounded-lg border border-border bg-accent/20 px-3 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">{coverage.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${coverage.status === "live" ? "bg-foreground text-background" : coverage.status === "derived" ? "bg-accent text-foreground" : coverage.status === "error" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"}`}>
                      {coverage.status === "live" ? "实时" : coverage.status === "derived" ? "已建模" : coverage.status === "error" ? "失败" : "未选"}
                    </span>
                  </div>
                  <p className="mt-2 text-xl font-semibold text-foreground">{coverage.count}</p>
                  <p className="mt-1 text-[10px] leading-5 text-muted-foreground">{coverage.note}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-accent/20 px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xs font-medium text-foreground">多标的横向对比</h3>
                <p className="text-[10px] text-muted-foreground mt-1">当前结果会自动进入检索档案。你可以继续检索另一家公司，再从档案里把两家公司加入对比台，并排比较生命周期、证据强度、专利连续性和工程壁垒。</p>
              </div>
              <button
                onClick={() => setShowCompare(true)}
                className="inline-flex items-center gap-1.5 text-xs bg-foreground text-background hover:bg-foreground/90 px-3 py-1.5 rounded-md transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                打开检索档案
              </button>
            </div>
          </div>

          {showCompare && history.length > 0 && (
            <ComparePanel
              analyses={compareScopeAnalyses}
              selectedIds={compareIds}
              onToggleSelected={handleToggleCompare}
              onOpenAnalysis={handleOpenAnalysis}
              onRemoveAnalysis={handleRemoveAnalysis}
              onClose={() => setShowCompare(false)}
            />
          )}

          <PatentTimeline
            companyName={activeResult.companyInfo.name}
            patents={activeResult.patents}
            inventors={activeResult.inventors}
            techBranches={activeResult.techBranches}
          />
          <TechEvolution
            evolutionMetrics={activeResult.evolutionMetrics}
            citations={activeResult.citations}
            papers={activeResult.papers}
            evolutionStage={activeResult.evolutionStage}
          />

          <LifecycleTeamPanel
            productLifecycle={activeResult.productLifecycle}
            lifecycleOverride={activeResult.lifecycleOverride}
            teamAssessment={activeResult.teamAssessment}
            onSaveLifecycleOverride={handleSaveLifecycleOverride}
            onClearLifecycleOverride={handleClearLifecycleOverride}
          />
          <BarrierAssessment
            barriers={activeResult.barriers}
            techClaims={activeResult.techClaims}
            defensibilityConclusion={activeResult.defensibilityConclusion}
          />

          <InterviewPack
            interviewQuestions={activeResult.interviewQuestions}
            initialRole={activeResult.request.role}
            initialStage={activeResult.request.stage}
          />

          <ReportPreview result={activeResult} />

          <footer className="text-center text-xs text-muted-foreground py-8 border-t border-border">
            分析结论仅基于公开数据，不涉及公司内部信息 · 所有来源可追溯 · TechTrace Agent
          </footer>
        </main>
      )}
    </div>
  );
};

function buildLoadingSteps(sources: string[], hasSupplemental: boolean): LoadingStep[] {
  const steps: LoadingStep[] = [];
  if (sources.includes("google")) steps.push({ label: "正在整理 Google Patents 公开信息…", icon: Database, duration: 650 });
  if (sources.includes("lens")) steps.push({ label: "正在关联 Lens.org 引用关系…", icon: FileSearch, duration: 620 });
  if (sources.includes("arxiv")) steps.push({ label: "正在检索 arXiv 学术论文…", icon: FileSearch, duration: 780 });
  if (hasSupplemental) steps.push({ label: "正在解析上传 PDF 补充材料…", icon: FileText, duration: 620 });
  steps.push({ label: "AI 正在分析专利脉络…", icon: Cpu, duration: 900 });
  steps.push({ label: "AI 正在挖掘技术演进…", icon: Cpu, duration: 900 });
  steps.push({ label: "AI 正在判定技术壁垒…", icon: Shield, duration: 900 });
  steps.push({ label: "AI 正在生成技术访谈问题…", icon: MessageSquare, duration: 820 });
  steps.push({ label: "正在生成结构化报告…", icon: FileText, duration: 720 });
  return steps;
}

function mergeAnalysisHistory(current: AnalysisResult[], nextResult: AnalysisResult) {
  const filtered = current.filter((analysis) => analysis.analysisId !== nextResult.analysisId);
  return [nextResult, ...filtered].slice(0, 6);
}

function mergeBatchHistory(current: AnalysisResult[], incoming: AnalysisResult[]) {
  const incomingIds = new Set(incoming.map((analysis) => analysis.analysisId));
  const preserved = current.filter((analysis) => !incomingIds.has(analysis.analysisId));
  return [...incoming, ...preserved].slice(0, 6);
}

function mergeCompareIds(current: string[], nextId: string) {
  return [nextId, ...current.filter((id) => id !== nextId)].slice(0, 3);
}

function readStoredAnalyses() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeStoredAnalysis).filter(Boolean) as AnalysisResult[];
  } catch {
    return [];
  }
}

function writeStoredAnalyses(history: AnalysisResult[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

function readStoredCompareIds() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function writeStoredCompareIds(compareIds: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareIds));
}

function normalizeStoredAnalysis(value: unknown): AnalysisResult | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as AnalysisResult;
  const fallbackLifecycle = {
    stage: candidate.companyInfo?.stage ?? "公开线索待补",
    confidence: "low" as const,
    summary: "历史结果来自旧版本，暂无结构化生命周期判断。",
    rationale: "建议重新运行分析，以生成基于技术证据的生命周期阶段。",
    evidence: ["旧版本结果未保存生命周期依据。"],
    nextMilestones: ["重新运行分析以生成结构化生命周期里程碑。"],
    keyRisks: ["旧版本结果未保存生命周期风险。"],
  };
  const fallbackTeamAssessment = {
    summary: "历史结果来自旧版本，暂无结构化核心团队公开线索。",
    overallStrength: "weak" as const,
    benchRisk: "high" as const,
    keyRisks: ["旧版本结果未保存核心团队公开线索与关键人风险。"],
    members: [],
  };

  return {
    ...candidate,
    request: {
      ...candidate.request,
      publicUrls: candidate.request?.publicUrls ?? [],
      supplementalType: candidate.request?.supplementalType ?? "other",
      supplementalTypes: candidate.request?.supplementalTypes ?? (candidate.request?.supplementalType ? [candidate.request.supplementalType] : []),
    },
    analysisMeta: candidate.analysisMeta ?? {
      mode: "rules",
      note: "历史结果来自旧版本，默认按规则模板展示。",
      model: null,
      origin: candidate.analysisId?.startsWith("demo-") ? "mock" : "live",
    },
    techClaims: (candidate.techClaims ?? []).map((claim) => ({
      ...claim,
      evidenceStrength: claim.evidenceStrength ?? (claim.status === "verified" ? "strong" : "weak"),
      supportingEvidence: claim.supportingEvidence ?? [claim.evidence ?? "历史结果未保存支撑证据。"],
      gapEvidence: claim.gapEvidence ?? [],
      nextChecks: claim.nextChecks ?? ["建议重新运行分析，生成结构化核查点。"],
    })),
    barriers: (candidate.barriers ?? []).map((barrier) => ({
      ...barrier,
      score: barrier.score ?? (barrier.strength === "strong" ? 80 : barrier.strength === "moderate" ? 60 : 35),
      rationale: barrier.rationale ?? [barrier.evidence ?? "历史结果未保存支撑依据。"],
      gaps: barrier.gaps ?? ["建议重新运行分析，生成结构化证据缺口。"],
    })),
    productLifecycle: candidate.productLifecycle ?? fallbackLifecycle,
    lifecycleOverride: candidate.lifecycleOverride ?? null,
    teamAssessment: candidate.teamAssessment ?? fallbackTeamAssessment,
    publicWebSources: candidate.publicWebSources ?? [],
    supplementalMaterials: candidate.supplementalMaterials ?? (candidate.supplementalMaterial ? [candidate.supplementalMaterial] : []),
  };
}

function getAnalysisOrigin(analysis: AnalysisResult) {
  return analysis.analysisMeta.origin ?? (analysis.analysisId.startsWith("demo-") ? "mock" : "live");
}

export default Index;

function countSupplementalUploads(request: AnalysisRequestInput | null) {
  if (!request) return 0;
  if (Array.isArray(request.supplementalUploads)) {
    return request.supplementalUploads.length;
  }
  return request.supplementalFiles?.length ?? 0;
}
