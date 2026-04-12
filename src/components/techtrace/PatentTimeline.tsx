import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";

import SectionHeader from "@/components/industry/SectionHeader";
import type { Inventor, Patent, TechBranch } from "@/types/analysis";

const yearColorMap: Record<number, string> = {
  2020: "bg-muted-foreground/40 border-muted-foreground/40",
  2021: "bg-muted-foreground/60 border-muted-foreground/60",
  2022: "bg-muted-foreground/80 border-muted-foreground/80",
  2023: "bg-foreground/80 border-foreground/80",
  2024: "bg-foreground border-foreground",
  2025: "bg-foreground border-foreground",
  2026: "bg-foreground border-foreground",
};

const termStatusMap = {
  active_estimated: { label: "保护期充足", className: "bg-green-100 text-green-700" },
  near_expiry_estimated: { label: "临近到期", className: "bg-amber-100 text-amber-700" },
  expired_estimated: { label: "估算已到期", className: "bg-red-100 text-red-700" },
  unknown: { label: "期限待核", className: "bg-accent text-muted-foreground" },
} as const;

interface PatentTimelineProps {
  companyName: string;
  patents: Patent[];
  inventors: Inventor[];
  techBranches: TechBranch[];
}

const PatentTimeline = ({ companyName, patents, inventors, techBranches }: PatentTimelineProps) => {
  const [expandedPatent, setExpandedPatent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "inventors" | "branches">("timeline");

  const sorted = [...patents].sort((left, right) => new Date(left.filingDate).getTime() - new Date(right.filingDate).getTime());
  const mainBranches = techBranches.filter((branch) => branch.isMainline);
  const extensionBranches = techBranches.filter((branch) => !branch.isMainline);
  const patentTotal = Math.max(1, patents.length);
  const sourceSummary = [...new Set(patents.map((patent) => patent.source))].join(" + ") || "公开技术线索";

  return (
    <section>
      <SectionHeader number="1" title="专利脉络梳理" subtitle={`基于 ${sourceSummary} 自动生成`} />

      <div className="flex gap-1 mb-4">
        {([
          { key: "timeline", label: "专利时间轴" },
          { key: "inventors", label: "核心发明人" },
          { key: "branches", label: "技术分支" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              activeTab === tab.key ? "bg-foreground text-background" : "bg-accent/50 text-muted-foreground hover:bg-accent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "timeline" && (
        <div className="card-base p-4">
          {sorted.length === 0 ? (
            <EmptyState text="当前未生成专利脉络。请选择至少一个专利数据源后重新分析。" />
          ) : (
            <>
              <div className="relative">
                <div className="absolute left-[7px] top-0 bottom-0 w-px bg-border" />
                <div className="space-y-1">
                  {sorted.map((patent) => {
                    const isExpanded = expandedPatent === patent.id;
                    return (
                      <div key={patent.id}>
                        <button
                          onClick={() => setExpandedPatent(isExpanded ? null : patent.id)}
                          className="w-full flex items-start gap-3 py-2 pl-0 pr-2 rounded hover:bg-accent/30 transition-colors text-left"
                        >
                          <div className="relative flex-shrink-0 mt-1">
                            <div className={`w-[15px] h-[15px] rounded-full border-2 ${getNodeColor(patent)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground font-mono">{patent.filingDate}</span>
                              {patent.isLeapNode && <span className="text-[9px] bg-foreground text-background px-1.5 py-0.5 rounded font-medium">技术跃迁</span>}
                              <span className="text-[10px] bg-accent text-muted-foreground px-1.5 py-0.5 rounded">{patent.techBranch}</span>
                            </div>
                            <p className="text-xs font-medium text-foreground mt-0.5 truncate">{patent.title}</p>
                            <p className="text-[10px] text-muted-foreground">{patent.patentNo} · 被引{patent.citedBy}次 · {patent.source}</p>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground mt-1 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mt-1 flex-shrink-0" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="ml-7 mb-3 p-3 bg-accent/30 rounded-md space-y-2">
                            <p className="text-xs text-muted-foreground leading-relaxed">{patent.abstract}</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                              <div><span className="font-medium text-foreground">专利号:</span> {patent.patentNo}</div>
                              <div><span className="font-medium text-foreground">申请日期:</span> {patent.filingDate}</div>
                              <div><span className="font-medium text-foreground">发明人:</span> {patent.inventors.join(", ")}</div>
                              <div><span className="font-medium text-foreground">申请人:</span> {patent.applicant}</div>
                              <div><span className="font-medium text-foreground">被引次数:</span> {patent.citedBy}</div>
                              <div><span className="font-medium text-foreground">技术分支:</span> {patent.techBranch}</div>
                              <div>
                                <span className="font-medium text-foreground">保护期估算:</span>{" "}
                                {patent.estimatedExpireDate ? `${patent.estimatedExpireDate}` : "待核"}
                              </div>
                              <div>
                                <span className="font-medium text-foreground">剩余年限:</span>{" "}
                                {typeof patent.remainingTermYears === "number" ? `${patent.remainingTermYears} 年` : "待核"}
                              </div>
                            </div>
                            {patent.termStatus && (
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] ${termStatusMap[patent.termStatus].className}`}>
                                  {termStatusMap[patent.termStatus].label}
                                </span>
                                {patent.termNote && <span className="text-[10px] text-muted-foreground">{patent.termNote}</span>}
                              </div>
                            )}
                            <div className="flex items-center gap-3 pt-1">
                              <a
                                href={patent.sourceUrl || buildFallbackSourceUrl(patent)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-foreground hover:underline font-medium"
                              >
                                查看来源
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-border text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-foreground ring-2 ring-foreground/30" /> 技术跃迁点</span>
                <span className="font-medium text-foreground ml-2">年份:</span>
                {Object.entries(yearColorMap).map(([year, className]) => (
                  <span key={year} className="flex items-center gap-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${className.split(" ")[0]}`} /> {year}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "inventors" && (
        <div className="card-base overflow-hidden">
          {inventors.length === 0 ? (
            <div className="p-4">
              <EmptyState text="当前没有可计算的发明人分布。" compact />
            </div>
          ) : (
            <>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-accent/50">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">发明人</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">职位</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">专利数</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">占比</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">风险</th>
                  </tr>
                </thead>
                <tbody>
                  {inventors.map((inventor) => (
                    <tr key={inventor.name} className="border-b border-border last:border-0">
                      <td className="px-3 py-2.5 font-medium text-foreground">{inventor.name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{inventor.role}</td>
                      <td className="px-3 py-2.5 text-right font-medium">{inventor.patentCount}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-16 h-1.5 bg-accent rounded-full overflow-hidden">
                            <div className="h-full bg-foreground rounded-full" style={{ width: `${(inventor.patentCount / patentTotal) * 100}%` }} />
                          </div>
                          <span>{Math.round((inventor.patentCount / patentTotal) * 100)}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {inventor.riskNote && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-destructive">
                            <AlertTriangle className="w-3 h-3" />
                            {inventor.riskNote}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-3 py-2 bg-accent/30 text-[10px] text-muted-foreground">
                <AlertTriangle className="w-3 h-3 inline mr-1 text-destructive" />
                当前发明人统计用于识别核心成员集中度与组织依赖风险。
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "branches" && (
        <div className="card-base p-4 overflow-x-auto">
          {techBranches.length === 0 ? (
            <EmptyState text="当前没有可展示的技术分支。" compact />
          ) : (
            <div className="flex flex-col items-start min-w-[600px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-sm bg-foreground" />
                <span className="text-xs font-semibold text-foreground">{companyName} · 技术架构</span>
              </div>

              <div className="ml-[5px] border-l-2 border-foreground pl-6 space-y-0">
                <BranchSection title="主线技术" branches={mainBranches} patents={patents} lineClassName="border-foreground" dashed={false} />
                <BranchSection title="延伸方向" branches={extensionBranches} patents={patents} lineClassName="border-muted-foreground" dashed />
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-border text-[10px] text-muted-foreground w-full">
                <span className="font-medium text-foreground">年份:</span>
                {Object.entries(yearColorMap).map(([year, className]) => (
                  <span key={year} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${className.split(" ")[0]}`} /> {year}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

interface BranchSectionProps {
  title: string;
  branches: TechBranch[];
  patents: Patent[];
  lineClassName: string;
  dashed: boolean;
}

const BranchSection = ({ title, branches, patents, lineClassName, dashed }: BranchSectionProps) => (
  <div className="relative pb-2">
    <div className={`absolute -left-[25px] top-3 w-[25px] border-t-2 ${dashed ? "border-dashed" : ""} ${lineClassName}`} />
    <div className="flex items-center gap-2 pt-1 mb-1">
      <span className={`w-2.5 h-2.5 rounded-full ${dashed ? `border-2 ${lineClassName}` : "bg-foreground"}`} />
      <span className={`text-[11px] font-semibold ${dashed ? "text-muted-foreground" : "text-foreground"}`}>{title}</span>
    </div>
    <div className={`ml-[5px] border-l pl-5 space-y-0 ${dashed ? "border-dashed border-muted-foreground/50" : "border-foreground/50"}`}>
      {branches.map((branch) => (
        <div key={branch.name} className="relative pb-3">
          <div className={`absolute -left-[21px] top-2.5 w-[21px] border-t ${dashed ? "border-dashed border-muted-foreground/50" : "border-foreground/50"}`} />
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${dashed ? "border border-muted-foreground" : "bg-foreground/80"}`} />
            <span className="text-xs font-medium text-foreground">{branch.name}</span>
            <span className="text-[10px] text-muted-foreground">— {branch.description}</span>
          </div>
          <div className={`ml-[4px] border-l pl-4 space-y-0.5 ${dashed ? "border-dashed border-border" : "border-border"}`}>
            {branch.patentIds.map((patentId) => {
              const patent = patents.find((item) => item.id === patentId);
              const year = patent ? new Date(patent.filingDate).getFullYear() : 2020;
              const dotColor = yearColorMap[year]?.split(" ")[0] || "bg-muted-foreground";
              return (
                <div key={patentId} className="relative flex items-center gap-2 py-0.5">
                  <div className={`absolute -left-[17px] top-1/2 w-[17px] border-t ${dashed ? "border-dashed border-border" : "border-border"}`} />
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                  <span className="text-[10px] font-mono text-muted-foreground">{patentId}</span>
                  {patent && <span className="text-[10px] text-muted-foreground truncate max-w-[300px]">{patent.title}</span>}
                  {patent && <span className="text-[9px] text-muted-foreground/60 flex-shrink-0">{patent.filingDate}</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const EmptyState = ({ text, compact = false }: { text: string; compact?: boolean }) => (
  <div className={`text-center ${compact ? "py-6" : "py-10"}`}>
    <p className="text-xs text-muted-foreground">{text}</p>
  </div>
);

const getNodeColor = (patent: Patent) => {
  if (patent.isLeapNode) return "bg-foreground border-foreground ring-2 ring-foreground/30";
  const year = new Date(patent.filingDate).getFullYear();
  return yearColorMap[year] || "bg-muted-foreground border-muted-foreground";
};

const buildFallbackSourceUrl = (patent: Patent) => {
  if (patent.source === "CNIPA") return `https://pss-system.cponline.cnipa.gov.cn/conventionalSearch?searchType=1&query=${encodeURIComponent(patent.patentNo)}`;
  if (patent.source === "Google Patents") return `https://patents.google.com/?q=${encodeURIComponent(patent.patentNo)}`;
  return `https://www.lens.org/lens/search/patent/list?q=${encodeURIComponent(patent.patentNo)}`;
};

export default PatentTimeline;
