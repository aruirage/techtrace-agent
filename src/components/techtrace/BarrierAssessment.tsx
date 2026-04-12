import { useState } from "react";
import { AlertTriangle, CheckCircle, ChevronDown, ChevronRight, HelpCircle, Shield } from "lucide-react";

import SectionHeader from "@/components/industry/SectionHeader";
import type { Barrier, TechClaim } from "@/types/analysis";

const strengthMap = {
  strong: { label: "强", color: "bg-foreground text-background" },
  moderate: { label: "中", color: "bg-muted-foreground text-background" },
  weak: { label: "弱", color: "bg-accent text-muted-foreground" },
};

const statusMap = {
  verified: { label: "已验证", icon: CheckCircle, color: "text-green-600" },
  partially_verified: { label: "部分验证", icon: AlertTriangle, color: "text-sky-600" },
  questionable: { label: "存疑", icon: AlertTriangle, color: "text-amber-600" },
  unverifiable: { label: "无公开依据", icon: HelpCircle, color: "text-muted-foreground" },
} as const;

const evidenceStrengthMap = {
  strong: "强证据",
  medium: "中证据",
  weak: "弱证据",
};

interface BarrierAssessmentProps {
  barriers: Barrier[];
  techClaims: TechClaim[];
  defensibilityConclusion: string;
}

const BarrierAssessment = ({ barriers, techClaims, defensibilityConclusion }: BarrierAssessmentProps) => {
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);

  return (
    <section>
      <SectionHeader number="4" title="技术壁垒判定" subtitle="把公开证据拆成支撑、缺口和下一步核查点，而不是只看摘要" />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4 mb-4">
        {barriers.map((barrier) => {
          const strength = strengthMap[barrier.strength];
          return (
            <div key={barrier.type} className="card-base p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-foreground" />
                  <span className="text-xs font-medium text-foreground">{barrier.label}</span>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${strength.color}`}>{strength.label}</span>
              </div>

              <div className="mb-2 flex items-end gap-1">
                <span className="text-lg font-semibold text-foreground">{barrier.score}</span>
                <span className="pb-0.5 text-[10px] text-muted-foreground">/100</span>
              </div>

              <p className="text-[10px] text-muted-foreground leading-relaxed">{barrier.evidence}</p>

              <div className="mt-3">
                <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">支撑依据</p>
                <div className="mt-1 space-y-1">
                  {barrier.rationale.map((item, index) => (
                    <p key={`${barrier.type}-rationale-${index}`} className="text-[10px] text-foreground leading-relaxed">
                      {item}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">证据缺口</p>
                <div className="mt-1 space-y-1">
                  {barrier.gaps.map((item, index) => (
                    <p key={`${barrier.type}-gap-${index}`} className="text-[10px] text-muted-foreground leading-relaxed">
                      {item}
                    </p>
                  ))}
                </div>
              </div>

              {barrier.patents.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {barrier.patents.map((patentId) => (
                    <span key={patentId} className="text-[9px] bg-accent text-muted-foreground px-1.5 py-0.5 rounded">
                      {patentId}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card-base p-4 mb-4">
        <h3 className="text-sm font-medium text-foreground mb-3">技术声明交叉验证</h3>
        <div className="space-y-1">
          {techClaims.map((claim) => {
            const status = statusMap[claim.status];
            const StatusIcon = status.icon;
            const isExpanded = expandedClaim === claim.id;

            return (
              <div key={claim.id}>
                <button
                  onClick={() => setExpandedClaim(isExpanded ? null : claim.id)}
                  className="w-full flex items-start gap-3 py-2.5 px-3 rounded hover:bg-accent/30 transition-colors text-left"
                >
                  <StatusIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${status.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{claim.claim}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded ${
                          claim.status === "verified"
                            ? "bg-green-100 text-green-700"
                            : claim.status === "partially_verified"
                              ? "bg-sky-100 text-sky-700"
                              : claim.status === "questionable"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-accent text-muted-foreground"
                        }`}
                      >
                        {status.label}
                      </span>
                      <span className="text-[9px] rounded bg-accent px-1.5 py-0.5 text-muted-foreground">
                        {evidenceStrengthMap[claim.evidenceStrength]}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">来源: {claim.source}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                  )}
                </button>

                {isExpanded && (
                  <div className="ml-7 mb-2 p-3 bg-accent/30 rounded-md">
                    <p className="text-xs text-muted-foreground leading-relaxed">{claim.evidence}</p>

                    {claim.supportingEvidence.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-medium text-foreground">支撑证据</p>
                        <div className="mt-1 space-y-1">
                          {claim.supportingEvidence.map((item, index) => (
                            <p key={`${claim.id}-support-${index}`} className="text-[10px] text-muted-foreground leading-relaxed">
                              {item}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {claim.gapEvidence.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-medium text-foreground">证据缺口</p>
                        <div className="mt-1 space-y-1">
                          {claim.gapEvidence.map((item, index) => (
                            <p key={`${claim.id}-gap-${index}`} className="text-[10px] text-muted-foreground leading-relaxed">
                              {item}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {claim.nextChecks.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-medium text-foreground">下一步核查</p>
                        <div className="mt-1 space-y-1">
                          {claim.nextChecks.map((item, index) => (
                            <p key={`${claim.id}-check-${index}`} className="text-[10px] text-muted-foreground leading-relaxed">
                              {item}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {claim.relatedPatents.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[9px] text-muted-foreground">相关专利:</span>
                        {claim.relatedPatents.map((patentId) => (
                          <span key={patentId} className="text-[9px] bg-accent text-muted-foreground px-1.5 py-0.5 rounded">
                            {patentId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-border text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-600" />
            已验证: {techClaims.filter((claim) => claim.status === "verified").length}
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-sky-600" />
            部分验证: {techClaims.filter((claim) => claim.status === "partially_verified").length}
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            存疑: {techClaims.filter((claim) => claim.status === "questionable").length}
          </span>
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            无公开依据: {techClaims.filter((claim) => claim.status === "unverifiable").length}
          </span>
        </div>
      </div>

      <div className="card-base p-4 border-l-4 border-foreground">
        <h3 className="text-sm font-medium text-foreground mb-2">综合可防御性结论</h3>
        <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{defensibilityConclusion}</div>
      </div>
    </section>
  );
};

export default BarrierAssessment;
