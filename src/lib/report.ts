import type { AnalysisResult, Barrier, InterviewQuestion, TeamAssessment, TechClaim } from "@/types/analysis";
import { getEffectiveProductLifecycle, hasLifecycleOverride } from "@/lib/lifecycle";

export interface ReportSection {
  title: string;
  content: string;
}

export function isMockAnalysis(result: AnalysisResult) {
  return result.analysisMeta.origin === "mock";
}

export function buildReportSections(result: AnalysisResult): ReportSection[] {
  const {
    companyInfo,
    patents,
    barriers,
    techClaims,
    evolutionStage,
    productLifecycle,
    teamAssessment,
    interviewQuestions,
    sourceCoverage,
    supplementalMaterial,
    supplementalMaterials,
    analysisMeta,
  } = result;
  const sourceLabels = sourceCoverage
    .filter((item) => item.count > 0)
    .map((item) => `${item.label}(${item.count})`)
    .join("、");

  const supplementalLabel =
    supplementalMaterials && supplementalMaterials.length > 0
      ? supplementalMaterials.map((item) => item.filename).join("、")
      : supplementalMaterial?.filename ?? "未上传";

  return [
    {
      title: "一、公司基本信息",
      content: `${companyInfo.name}（${companyInfo.englishName}）\n成立时间: ${companyInfo.founded} | 总部: ${companyInfo.headquarters} | 当前状态: ${companyInfo.stage}\n技术方向: ${companyInfo.techKeywords.join("、")}\n专利总数: ${companyInfo.totalPatents}件（发明${companyInfo.inventionPatents}件，其他${companyInfo.utilityModels}件）`,
    },
    {
      title: "二、专利脉络摘要",
      content: buildPatentSummary(result),
    },
    {
      title: "三、技术演进结论",
      content: `演进阶段: ${evolutionStage.stage}\n趋势: ${evolutionStage.trend}\n\n${evolutionStage.description}\n\n${evolutionStage.trendNote}`,
    },
    {
      title: "四、产品生命周期判断",
      content: buildLifecycleSummary(result),
    },
    {
      title: "五、核心团队公开线索与匹配度",
      content: buildTeamSummary(teamAssessment),
    },
    {
      title: "六、技术壁垒判定",
      content: buildBarrierSummary(barriers, result.defensibilityConclusion),
    },
    {
      title: "七、技术声明验证",
      content: buildClaimSummary(techClaims),
    },
    {
      title: "八、技术访谈问题",
      content: buildInterviewSummary(interviewQuestions),
    },
    {
      title: "九、数据来源与补充材料",
      content: `来源覆盖: ${sourceLabels || "未获取有效数据"}\n补充材料: ${supplementalLabel}\n分析模式: ${analysisMeta.mode === "ai_enhanced" ? `OpenAI 增强（${analysisMeta.model ?? "已配置模型"}）` : "规则模板"}\n备注: ${analysisMeta.note}`,
    },
  ];
}

export function buildFullReportTextFromSections(sections: ReportSection[]) {
  return sections
    .map((section) => `${section.title}\n${"=".repeat(30)}\n${section.content}`)
    .join("\n\n\n");
}

export function buildFullReportText(result: AnalysisResult) {
  return buildFullReportTextFromSections(buildReportSections(result));
}

export function exportReportToWord(result: AnalysisResult, sections?: ReportSection[]) {
  const title = buildReportFilename(result, "doc");
  const html = buildReportHtml(result, sections, false);
  const blob = new Blob(["\ufeff", html], {
    type: "application/msword;charset=utf-8",
  });

  downloadBlob(blob, title);
}

export function exportReportToPdf(result: AnalysisResult, sections?: ReportSection[]) {
  const printWindow = window.open("", "_blank", "width=1100,height=800");
  if (!printWindow) {
    throw new Error("浏览器阻止了新窗口，请允许当前站点打开弹窗后重试。");
  }

  printWindow.document.open();
  printWindow.document.write(buildReportHtml(result, sections, true));
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
  };
}

export function buildReportFilename(result: AnalysisResult, extension: "doc" | "txt") {
  const suffix = isMockAnalysis(result) ? "Mock演示报告" : "技术尽调报告";
  return `${sanitizeFilename(result.companyInfo.name)}_${suffix}_${result.generatedAt.slice(0, 10)}.${extension}`;
}

function buildPatentSummary(result: AnalysisResult) {
  const corePatents = result.patents.filter((patent) => patent.isCorePatent).length;
  const leapNodes = result.patents.filter((patent) => patent.isLeapNode).length;
  const nearExpiryPatents = result.patents.filter((patent) => patent.termStatus === "near_expiry_estimated" || patent.termStatus === "expired_estimated").length;
  const firstPatent = result.patents[0];
  const lastPatent = result.patents[result.patents.length - 1];

  return `本次共梳理 ${result.patents.length} 件专利线索，其中核心专利 ${corePatents} 件，技术跃迁节点 ${leapNodes} 个，保护期临近或估算已到期 ${nearExpiryPatents} 件。\n\n专利覆盖时间: ${firstPatent?.filingDate ?? "暂无"} → ${lastPatent?.filingDate ?? "暂无"}\n重点技术分支: ${result.techBranches.map((branch) => branch.name).join("、") || "暂无"}\n主要来源: ${result.sourceCoverage.filter((item) => item.count > 0).map((item) => item.label).join("、") || "暂无"}`;
}

function buildBarrierSummary(barriers: Barrier[], conclusion: string) {
  return `${barriers
    .map((barrier) => `${barrier.label}: ${strengthLabel(barrier.strength)} (${barrier.score}/100)\n${barrier.evidence}\n支撑依据: ${barrier.rationale.join("；")}\n证据缺口: ${barrier.gaps.join("；")}`)
    .join("\n\n")}\n\n--- 综合结论 ---\n${conclusion}`;
}

function buildClaimSummary(techClaims: TechClaim[]) {
  return techClaims
    .map(
      (claim) =>
        `[${claimStatusLabel(claim.status)} / ${claim.evidenceStrength}] ${claim.claim}\n来源: ${claim.source}\n${claim.evidence}\n支撑证据: ${claim.supportingEvidence.join("；") || "暂无"}\n证据缺口: ${claim.gapEvidence.join("；") || "暂无"}\n下一步核查: ${claim.nextChecks.join("；") || "暂无"}\n相关专利: ${claim.relatedPatents.join(", ") || "暂无"}`,
    )
    .join("\n\n");
}

function buildInterviewSummary(interviewQuestions: InterviewQuestion[]) {
  return interviewQuestions
    .map((question, index) => `${index + 1}. ${question.question}\n   验证逻辑: ${question.verificationLogic}\n   相关专利: ${question.relatedPatents.join(", ") || "暂无"}`)
    .join("\n\n");
}

function buildLifecycleSummary(result: AnalysisResult) {
  const effectiveLifecycle = getEffectiveProductLifecycle(result.productLifecycle, result.lifecycleOverride);
  const overrideSummary = hasLifecycleOverride(result.lifecycleOverride)
    ? `人工修正: 是\n人工修正阶段: ${result.lifecycleOverride?.stage}\n人工修正说明: ${result.lifecycleOverride?.note || "未填写"}\n修正时间: ${result.lifecycleOverride?.updatedAt ? new Date(result.lifecycleOverride.updatedAt).toLocaleString("zh-CN") : "未知"}\n系统原判断: ${result.productLifecycle.stage}\n\n`
    : "人工修正: 否\n\n";

  return `阶段: ${effectiveLifecycle.stage}\n置信度: ${result.productLifecycle.confidence}\n\n${overrideSummary}${result.productLifecycle.summary}\n${result.productLifecycle.rationale}\n\n判断依据:\n${result.productLifecycle.evidence.map((item) => `- ${item}`).join("\n")}\n\n下一步里程碑:\n${result.productLifecycle.nextMilestones.map((item) => `- ${item}`).join("\n")}\n\n主要风险:\n${result.productLifecycle.keyRisks.map((item) => `- ${item}`).join("\n")}`;
}

function buildTeamSummary(teamAssessment: TeamAssessment) {
  return `${teamAssessment.summary}\n整体强度: ${teamAssessment.overallStrength}\n板凳风险: ${teamAssessment.benchRisk}\n\n关键成员:\n${teamAssessment.members
    .map(
      (member) =>
        `- ${member.name} / ${member.role}\n  背景: ${member.background}\n  公开线索: ${member.priorExperience.join("；")}\n  当前贡献: ${member.contribution}\n  公开证据: ${member.evidence.join("；")}\n  匹配度: ${member.domainFit} | 依赖风险: ${member.dependencyRisk}`,
    )
    .join("\n\n")}\n\n组织风险:\n${teamAssessment.keyRisks.map((item) => `- ${item}`).join("\n")}`;
}

function buildReportHtml(result: AnalysisResult, sections?: ReportSection[], printable = false) {
  const resolvedSections = sections ?? buildReportSections(result);
  const reportLabel = isMockAnalysis(result) ? "Mock 演示报告" : "技术尽调报告";
  const metadata = [
    `生成时间: ${new Date(result.generatedAt).toLocaleString("zh-CN")}`,
    `数据源: ${result.sourceCoverage.filter((item) => item.count > 0).map((item) => item.label).join("、") || "暂无"}`,
    `分析模式: ${result.analysisMeta.mode === "ai_enhanced" ? "OpenAI 增强" : "规则模板"}`,
    `分析对象: ${result.companyInfo.name}`,
    isMockAnalysis(result) ? "报告类型: Mock 演示" : "报告类型: 正式分析",
  ].join(" · ");

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>${result.companyInfo.name} ${reportLabel}</title>
    <style>
      body {
        font-family: "PingFang SC", "Helvetica Neue", Arial, sans-serif;
        color: #1f2937;
        margin: 0;
        padding: 32px;
        background: #f7f7f7;
      }
      main {
        max-width: 880px;
        margin: 0 auto;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        padding: 36px;
        box-sizing: border-box;
      }
      h1 {
        font-size: 28px;
        margin: 0 0 8px;
      }
      h2 {
        font-size: 16px;
        margin: 28px 0 10px;
      }
      p, pre {
        font-size: 13px;
        line-height: 1.75;
        margin: 0;
        white-space: pre-wrap;
      }
      .meta {
        color: #6b7280;
        font-size: 12px;
        margin-bottom: 24px;
      }
      ${printable ? "@media print { body { background: white; padding: 0; } main { border: 0; border-radius: 0; } }" : ""}
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(result.companyInfo.name)} ${escapeHtml(reportLabel)}</h1>
      <div class="meta">${escapeHtml(metadata)}</div>
      ${resolvedSections
        .map(
          (section) => `
            <section>
              <h2>${escapeHtml(section.title)}</h2>
              <pre>${escapeHtml(section.content)}</pre>
            </section>
          `,
        )
        .join("")}
    </main>
  </body>
</html>`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function sanitizeFilename(input: string) {
  return input.replace(/[\\/:*?"<>|]/g, "_");
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function strengthLabel(strength: Barrier["strength"]) {
  if (strength === "strong") return "强";
  if (strength === "moderate") return "中";
  return "弱";
}

function claimStatusLabel(status: TechClaim["status"]) {
  if (status === "verified") return "✓ 已验证";
  if (status === "partially_verified") return "~ 部分验证";
  if (status === "questionable") return "⚠ 存疑";
  return "? 无公开依据";
}
