import { useEffect, useState } from "react";
import { AlertTriangle, Flag, Layers3, PencilLine, RotateCcw, Save, UserRound } from "lucide-react";

import SectionHeader from "@/components/industry/SectionHeader";
import { getEffectiveProductLifecycle, hasLifecycleOverride, LIFECYCLE_STAGE_OPTIONS } from "@/lib/lifecycle";
import type { LifecycleOverride, ProductLifecycle, TeamAssessment } from "@/types/analysis";

interface LifecycleTeamPanelProps {
  productLifecycle: ProductLifecycle;
  lifecycleOverride?: LifecycleOverride | null;
  teamAssessment: TeamAssessment;
  onSaveLifecycleOverride: (next: { stage: string; note: string }) => void;
  onClearLifecycleOverride: () => void;
}

const confidenceLabelMap = {
  high: "高置信",
  medium: "中置信",
  low: "低置信",
};

const strengthLabelMap = {
  strong: "强",
  moderate: "中",
  weak: "弱",
};

const riskLabelMap = {
  high: "高",
  medium: "中",
  low: "低",
};

const lifecycleDefinitionMap = [
  {
    stage: "概念验证",
    description: "已证明技术原理可行，但产品形态、工程路径和外部验证仍有限。",
  },
  {
    stage: "产品验证",
    description: "已进入原型或产品化验证阶段，重点看性能、稳定性和可复制工程路径。",
  },
  {
    stage: "商业验证",
    description: "已出现客户、试点或导入验证，重点看需求匹配、验证深度和转化节奏。",
  },
  {
    stage: "规模化交付",
    description: "已具备持续交付能力，重点看良率、成本、交付稳定性和规模复制能力。",
  },
];

const LifecycleTeamPanel = ({
  productLifecycle,
  lifecycleOverride,
  teamAssessment,
  onSaveLifecycleOverride,
  onClearLifecycleOverride,
}: LifecycleTeamPanelProps) => {
  const effectiveLifecycle = getEffectiveProductLifecycle(productLifecycle, lifecycleOverride);
  const [isEditingLifecycle, setIsEditingLifecycle] = useState(false);
  const [manualStage, setManualStage] = useState(effectiveLifecycle.stage);
  const [manualNote, setManualNote] = useState(lifecycleOverride?.note ?? "");

  useEffect(() => {
    setManualStage(effectiveLifecycle.stage);
  }, [effectiveLifecycle.stage]);

  useEffect(() => {
    setManualNote(lifecycleOverride?.note ?? "");
  }, [lifecycleOverride?.note]);

  const handleSave = () => {
    onSaveLifecycleOverride({
      stage: manualStage,
      note: manualNote.trim(),
    });
    setIsEditingLifecycle(false);
  };

  const handleCancel = () => {
    setManualStage(effectiveLifecycle.stage);
    setManualNote(lifecycleOverride?.note ?? "");
    setIsEditingLifecycle(false);
  };

  return (
    <section>
      <SectionHeader number="3" title="产品阶段与团队线索" subtitle="根据技术演进、工程信号和公开成员线索判断当前阶段与关键人依赖" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="card-base p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-foreground">产品生命周期阶段</h3>
            <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] text-background">{effectiveLifecycle.stage}</span>
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">{confidenceLabelMap[productLifecycle.confidence]}</span>
            {hasLifecycleOverride(lifecycleOverride) && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">人工修正</span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {!isEditingLifecycle && (
              <button
                type="button"
                onClick={() => setIsEditingLifecycle(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[10px] text-foreground transition-colors hover:bg-accent/50"
              >
                <PencilLine className="h-3.5 w-3.5" />
                人工修正阶段
              </button>
            )}
            {hasLifecycleOverride(lifecycleOverride) && !isEditingLifecycle && (
              <button
                type="button"
                onClick={onClearLifecycleOverride}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[10px] text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                恢复系统判断
              </button>
            )}
          </div>

          {isEditingLifecycle && (
            <div className="mt-3 rounded-lg border border-border bg-accent/20 p-3">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">人工修正阶段</label>
                  <select
                    value={manualStage}
                    onChange={(event) => setManualStage(event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {LIFECYCLE_STAGE_OPTIONS.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">修正说明</label>
                  <textarea
                    value={manualNote}
                    onChange={(event) => setManualNote(event.target.value)}
                    rows={3}
                    placeholder="填写人工修正依据，例如内部测试资料、管理层补充材料或现场访谈结论。"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[10px] text-background transition-colors hover:bg-foreground/90"
                >
                  <Save className="h-3.5 w-3.5" />
                  保存人工修正
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-md border border-border px-3 py-1.5 text-[10px] text-foreground transition-colors hover:bg-accent/50"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {hasLifecycleOverride(lifecycleOverride) && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-amber-800">人工修正说明</p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                当前阶段以人工修正为准；系统原判断仍保留用于追溯。修正时间：{new Date(lifecycleOverride!.updatedAt).toLocaleString("zh-CN")}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-800">{lifecycleOverride?.note || "未填写修正说明。"}</p>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">系统原判断：{productLifecycle.stage}</p>
            </div>
          )}

          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{productLifecycle.summary}</p>
          <p className="mt-2 text-xs leading-relaxed text-foreground">{productLifecycle.rationale}</p>

          <div className="mt-4 rounded-lg border border-border bg-accent/20 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">通用阶段定义</p>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              {lifecycleDefinitionMap.map((item) => (
                <div
                  key={item.stage}
                  className={`rounded-lg border px-3 py-2 ${
                    effectiveLifecycle.stage === item.stage ? "border-foreground bg-background" : "border-border bg-background/60"
                  }`}
                >
                  <p className="text-[11px] font-semibold text-foreground">{item.stage}</p>
                  <p className="mt-1 text-[10px] leading-5 text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-accent/20 p-3">
              <div className="mb-2 flex items-center gap-1.5">
                <Layers3 className="h-3.5 w-3.5 text-foreground" />
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">判断依据</p>
              </div>
              <div className="space-y-1.5">
                {productLifecycle.evidence.map((item, index) => (
                  <p key={`lifecycle-evidence-${index}`} className="text-[11px] leading-relaxed text-foreground">
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-accent/20 p-3">
              <div className="mb-2 flex items-center gap-1.5">
                <Flag className="h-3.5 w-3.5 text-foreground" />
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">下一步里程碑</p>
              </div>
              <div className="space-y-1.5">
                {productLifecycle.nextMilestones.map((item, index) => (
                  <p key={`lifecycle-milestone-${index}`} className="text-[11px] leading-relaxed text-foreground">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-border bg-red-50/60 p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              <p className="text-[10px] font-medium uppercase tracking-wider text-red-700">主要风险</p>
            </div>
            <div className="space-y-1.5">
              {productLifecycle.keyRisks.map((item, index) => (
                <p key={`lifecycle-risk-${index}`} className="text-[11px] leading-relaxed text-red-700">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="card-base p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-foreground">核心团队公开线索</h3>
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">
              整体强度 {strengthLabelMap[teamAssessment.overallStrength]}
            </span>
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">
              板凳风险 {riskLabelMap[teamAssessment.benchRisk]}
            </span>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{teamAssessment.summary}</p>

          <div className="mt-4 space-y-3">
            {teamAssessment.members.map((member) => (
              <div key={`${member.name}-${member.role}`} className="rounded-lg border border-border bg-accent/20 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <UserRound className="h-3.5 w-3.5 text-foreground" />
                    <p className="text-xs font-medium text-foreground">{member.name}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{member.role}</span>
                  <span className="rounded-full bg-background px-2 py-0.5 text-[9px] text-muted-foreground">
                    匹配度 {strengthLabelMap[member.domainFit]}
                  </span>
                  <span className="rounded-full bg-background px-2 py-0.5 text-[9px] text-muted-foreground">
                    依赖风险 {riskLabelMap[member.dependencyRisk]}
                  </span>
                </div>

                <p className="mt-2 text-[11px] leading-relaxed text-foreground">{member.background}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{member.contribution}</p>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">公开线索</p>
                    <div className="mt-1 space-y-1">
                      {member.priorExperience.map((item, index) => (
                        <p key={`${member.name}-prior-${index}`} className="text-[10px] leading-relaxed text-muted-foreground">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">公开证据</p>
                    <div className="mt-1 space-y-1">
                      {member.evidence.map((item, index) => (
                        <p key={`${member.name}-evidence-${index}`} className="text-[10px] leading-relaxed text-muted-foreground">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-border bg-accent/20 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">团队待核查点</p>
            <div className="mt-1.5 space-y-1.5">
              {teamAssessment.keyRisks.map((item, index) => (
                <p key={`team-risk-${index}`} className="text-[11px] leading-relaxed text-foreground">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LifecycleTeamPanel;
