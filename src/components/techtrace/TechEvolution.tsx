import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, ExternalLink, TrendingUp } from "lucide-react";

import SectionHeader from "@/components/industry/SectionHeader";
import type { Citation, EvolutionMetric, EvolutionStage, Paper } from "@/types/analysis";

interface TechEvolutionProps {
  evolutionMetrics: EvolutionMetric[];
  citations: Citation[];
  papers: Paper[];
  evolutionStage: EvolutionStage;
}

const TechEvolution = ({ evolutionMetrics, citations, papers, evolutionStage }: TechEvolutionProps) => {
  return (
    <section>
      <SectionHeader number="2" title="技术演进挖掘" subtitle="基于论文线索与技术引用关系自动分析" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card-base p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">专利申请密度变化</h3>
            <span className="inline-flex items-center gap-1 text-[10px] bg-accent text-muted-foreground px-2 py-0.5 rounded">
              <TrendingUp className="w-3 h-3" />
              趋势: {evolutionStage.trend}
            </span>
          </div>
          {evolutionMetrics.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-center">
              <p className="text-xs text-muted-foreground">当前没有足够的公开专利线索来生成演进曲线。</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={evolutionMetrics} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ payload, label }) => {
                      if (!payload?.length) return null;
                      return (
                        <div className="card-base p-2 text-xs shadow-lg">
                          <div className="font-medium">{label}年</div>
                          <div className="text-muted-foreground">新增: {payload[0].value}件</div>
                          <div className="text-muted-foreground">累计: {payload[1]?.value}件</div>
                        </div>
                      );
                    }}
                  />
                  <Line type="monotone" dataKey="patentCount" stroke="#1f2937" strokeWidth={2} dot={{ r: 3, fill: "#1f2937" }} />
                  <Line type="monotone" dataKey="cumulativePatents" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-muted-foreground mt-2">{evolutionStage.trendNote}</p>
            </>
          )}
        </div>

        <div className="card-base p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">演进阶段判断</h3>
          <div className="flex items-center gap-2 mb-3">
            {["基础研究突破", "工程应用优化", "商业化量产"].map((step, index) => (
              <div key={step} className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium ${
                    step === evolutionStage.stage ? "bg-foreground text-background" : "bg-accent text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                <span className={`text-[10px] ${step === evolutionStage.stage ? "text-foreground font-medium" : "text-muted-foreground"}`}>{step}</span>
                {index < 2 && <ArrowRight className="w-3 h-3 text-muted-foreground mx-1" />}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{evolutionStage.description}</p>

          <div className="mt-4 pt-3 border-t border-border">
            <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">技术方向演进</h4>
            {evolutionStage.timeline.length === 0 ? (
              <p className="text-[10px] text-muted-foreground">暂无足够的阶段节点。</p>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[10px] flex-wrap">
                  {evolutionStage.timeline.map((item, index) => (
                    <div key={`${item.year}-${item.tech}`} className="flex items-center gap-1.5">
                      <div className="text-center">
                        <div className="font-medium text-foreground">{item.tech}</div>
                        <div className="text-muted-foreground">{item.year}</div>
                      </div>
                      {index < evolutionStage.timeline.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">建议继续核验最近两次路线迭代是否对应真实产品、客户或工程验证节点。</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card-base p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">技术引用溯源</h3>
        {citations.length === 0 ? (
          <p className="text-xs text-muted-foreground">当前没有足够的引用关系可展示。</p>
        ) : (
          <>
            <div className="space-y-2">
              {citations.map((citation, index) => (
                <div key={`${citation.fromId}-${citation.toId}-${index}`} className="flex items-start gap-3 py-2 px-3 rounded hover:bg-accent/30 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-2 h-2 rounded-full ${citation.nature === "core" ? "bg-foreground" : "bg-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{citation.fromTitle}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">{citation.toTitle}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${citation.nature === "core" ? "bg-foreground text-background" : "bg-accent text-muted-foreground"}`}>
                        {citation.nature === "core" ? "核心技术来源" : "背景知识"}
                      </span>
                      <span className="text-[9px] bg-accent text-muted-foreground px-1.5 py-0.5 rounded">
                        {citation.type === "patent" ? "专利引用" : "论文引用"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-foreground" /> 核心技术来源</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground" /> 背景知识引用</span>
            </div>
          </>
        )}
      </div>

      <div className="card-base p-4 mt-4">
        <h3 className="text-sm font-medium text-foreground mb-3">关键学术文献</h3>
        {papers.length === 0 ? (
          <p className="text-xs text-muted-foreground">当前没有获取到论文线索，建议开启 arXiv 数据源后重新分析。</p>
        ) : (
          <div className="space-y-2">
            {papers.map((paper) => (
              <div key={paper.id} className="flex items-start justify-between py-2 px-3 rounded hover:bg-accent/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{paper.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{paper.authors} · {paper.journal} · {paper.year}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{paper.relevance}</p>
                </div>
                <a
                  href={paper.url || (paper.arxivId ? `https://arxiv.org/abs/${paper.arxivId}` : "#")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 ml-3 inline-flex items-center gap-1 text-[10px] text-foreground hover:underline"
                >
                  {paper.arxivId ? "arXiv" : "DOI"}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TechEvolution;
