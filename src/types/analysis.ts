export type PatentSource = "CNIPA" | "Google Patents" | "Lens.org";
export type RoleKey = "tech_expert" | "ex_executive" | "industry_analyst" | "ip_lawyer";
export type StageKey = "screening" | "deep_dd";
export type SupplementalTypeKey = "cnipa_patent" | "whitepaper" | "test_report" | "other";

export interface CompanyInfo {
  name: string;
  englishName: string;
  founded: string;
  headquarters: string;
  stage: string;
  employees: string;
  techKeywords: string[];
  industry: string;
  totalPatents: number;
  inventionPatents: number;
  utilityModels: number;
}

export interface Patent {
  id: string;
  title: string;
  patentNo: string;
  applicant: string;
  inventors: string[];
  filingDate: string;
  abstract: string;
  source: PatentSource;
  sourceUrl: string;
  citedBy: number;
  isCorePatent: boolean;
  techBranch: string;
  isLeapNode?: boolean;
  estimatedExpireDate?: string;
  remainingTermYears?: number | null;
  termStatus?: "active_estimated" | "near_expiry_estimated" | "expired_estimated" | "unknown";
  termConfidence?: "low" | "medium";
  termNote?: string;
}

export interface Inventor {
  name: string;
  patentCount: number;
  role: string;
  riskNote?: string | null;
}

export interface TechBranch {
  name: string;
  description: string;
  patentIds: string[];
  isMainline: boolean;
}

export interface Citation {
  fromId: string;
  toId: string;
  fromTitle: string;
  toTitle: string;
  type: "patent" | "paper";
  nature: "background" | "core";
}

export interface Paper {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi: string;
  arxivId?: string;
  relevance: string;
  url?: string;
  summary?: string;
}

export interface EvolutionMetric {
  year: number;
  patentCount: number;
  cumulativePatents: number;
}

export interface EvolutionStage {
  stage: string;
  trend: string;
  trendNote: string;
  description: string;
  timeline: Array<{
    year: string;
    tech: string;
  }>;
}

export interface ProductLifecycle {
  stage: string;
  confidence: "high" | "medium" | "low";
  summary: string;
  rationale: string;
  evidence: string[];
  nextMilestones: string[];
  keyRisks: string[];
}

export interface LifecycleOverride {
  stage: string;
  note: string;
  updatedAt: string;
  source: "manual";
}

export interface TechClaim {
  id: string;
  claim: string;
  source: string;
  status: "verified" | "partially_verified" | "questionable" | "unverifiable";
  evidenceStrength: "strong" | "medium" | "weak";
  evidence: string;
  supportingEvidence: string[];
  gapEvidence: string[];
  nextChecks: string[];
  relatedPatents: string[];
}

export interface Barrier {
  type: "patent" | "algorithm" | "data" | "engineering";
  label: string;
  strength: "strong" | "moderate" | "weak";
  score: number;
  evidence: string;
  rationale: string[];
  gaps: string[];
  patents: string[];
}

export interface InterviewQuestion {
  id: string;
  category: "claim_verification" | "barrier_defensibility" | "team_stability";
  categoryLabel: string;
  question: string;
  verificationLogic: string;
  relatedPatents: string[];
  difficulty: "basic" | "deep";
  targetRole: RoleKey;
  stage: StageKey;
}

export interface ExpertProfile {
  role: string;
  background: string;
  channels: string[];
  reason: string;
}

export interface TeamMemberProfile {
  name: string;
  role: string;
  background: string;
  priorExperience: string[];
  contribution: string;
  domainFit: "strong" | "moderate" | "weak";
  dependencyRisk: "high" | "medium" | "low";
  evidence: string[];
}

export interface TeamAssessment {
  summary: string;
  overallStrength: "strong" | "moderate" | "weak";
  benchRisk: "high" | "medium" | "low";
  keyRisks: string[];
  members: TeamMemberProfile[];
}

export interface DangerSignal {
  phrase: string;
  interpretation: string;
  severity: "high" | "medium";
}

export interface SourceCoverage {
  label: string;
  count: number;
  status: "live" | "derived" | "skipped" | "error";
  note: string;
}

export interface PublicWebSource {
  url: string;
  title: string;
  excerpt: string;
  status: "live" | "skipped" | "error";
  note: string;
}

export interface SupplementalMaterial {
  filename: string;
  contentType: string;
  sizeBytes: number;
  materialType?: SupplementalTypeKey;
  materialTypeLabel?: string;
  pageCount?: number;
  extractionStatus?: string;
  extractionNote?: string;
  parsedPatentCount?: number;
}

export interface AnalysisMeta {
  mode: "rules" | "ai_enhanced";
  note: string;
  model?: string | null;
  origin?: "live" | "mock";
}

export interface AnalysisRequestSummary {
  company: string;
  keywords: string;
  sources: string[];
  publicUrls: string[];
  timeRange: string;
  role: RoleKey;
  stage: StageKey;
  supplementalType: SupplementalTypeKey;
  supplementalTypes?: SupplementalTypeKey[];
  roleLabel: string;
  stageLabel: string;
}

export interface SupplementalUploadInput {
  id: string;
  type: SupplementalTypeKey;
  file: File;
}

export interface AnalysisRequestInput {
  company: string;
  keywords: string;
  sources: string[];
  publicUrls: string[];
  timeRange: string;
  role: RoleKey;
  stage: StageKey;
  supplementalType?: SupplementalTypeKey;
  supplementalFiles?: File[];
  supplementalUploads: SupplementalUploadInput[];
}

export interface AnalysisResult {
  analysisId: string;
  generatedAt: string;
  request: AnalysisRequestSummary;
  analysisMeta: AnalysisMeta;
  companyInfo: CompanyInfo;
  patents: Patent[];
  inventors: Inventor[];
  techBranches: TechBranch[];
  citations: Citation[];
  papers: Paper[];
  evolutionMetrics: EvolutionMetric[];
  productLifecycle: ProductLifecycle;
  lifecycleOverride?: LifecycleOverride | null;
  techClaims: TechClaim[];
  barriers: Barrier[];
  defensibilityConclusion: string;
  evolutionStage: EvolutionStage;
  teamAssessment: TeamAssessment;
  expertProfiles: ExpertProfile[];
  interviewQuestions: InterviewQuestion[];
  dangerSignals: DangerSignal[];
  sourceCoverage: SourceCoverage[];
  publicWebSources?: PublicWebSource[];
  supplementalMaterial?: SupplementalMaterial | null;
  supplementalMaterials?: SupplementalMaterial[];
}

export const ROLE_OPTIONS: Array<{ key: RoleKey; label: string }> = [
  { key: "tech_expert", label: "技术专家" },
  { key: "ex_executive", label: "前高管" },
  { key: "industry_analyst", label: "行业分析师" },
  { key: "ip_lawyer", label: "知识产权律师" },
];

export const STAGE_OPTIONS: Array<{ key: StageKey; label: string; desc: string }> = [
  { key: "screening", label: "初筛", desc: "5-8 条，快速判断" },
  { key: "deep_dd", label: "深度尽调", desc: "12-15 条，全面验证" },
];

export const SUPPLEMENTAL_TYPE_OPTIONS: Array<{ key: SupplementalTypeKey; label: string; desc: string }> = [
  { key: "cnipa_patent", label: "CNIPA 专利导出", desc: "尝试抽取专利号并并入专利脉络" },
  { key: "whitepaper", label: "技术白皮书", desc: "用于技术判断与生命周期分析" },
  { key: "test_report", label: "测试/验证报告", desc: "用于工程验证与壁垒判断" },
  { key: "other", label: "其他材料", desc: "仅作为补充上下文参与分析" },
];

export const DATA_SOURCE_OPTIONS = [
  { id: "google", label: "Google Patents", desc: "公开网页实时检索" },
  { id: "lens", label: "Lens.org", desc: "正式 API / 引用关系" },
  { id: "arxiv", label: "arXiv", desc: "学术论文" },
] as const;
