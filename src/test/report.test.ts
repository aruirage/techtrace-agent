import { describe, expect, it } from "vitest";

import { buildReportFilename, buildReportSections, isMockAnalysis } from "@/lib/report";
import type { AnalysisResult } from "@/types/analysis";

const baseResult: AnalysisResult = {
  analysisId: "demo-report",
  generatedAt: "2026-04-11T12:00:00.000Z",
  request: {
    company: "Test Tech",
    keywords: "MEMS lidar",
    sources: ["google"],
    publicUrls: [],
    timeRange: "10",
    role: "tech_expert",
    stage: "deep_dd",
    supplementalType: "other",
    supplementalTypes: [],
    roleLabel: "技术专家",
    stageLabel: "深度尽调",
  },
  analysisMeta: {
    mode: "rules",
    note: "test",
    model: null,
    origin: "live",
  },
  companyInfo: {
    name: "Test Tech",
    englishName: "Test Tech",
    founded: "2020",
    headquarters: "Shanghai",
    stage: "产品验证",
    employees: "100",
    techKeywords: ["MEMS lidar"],
    industry: "硬科技",
    totalPatents: 3,
    inventionPatents: 3,
    utilityModels: 0,
  },
  patents: [],
  inventors: [],
  techBranches: [],
  citations: [],
  papers: [],
  evolutionMetrics: [],
  productLifecycle: {
    stage: "产品验证",
    confidence: "medium",
    summary: "summary",
    rationale: "rationale",
    evidence: ["e1"],
    nextMilestones: ["m1"],
    keyRisks: ["r1"],
  },
  lifecycleOverride: null,
  techClaims: [],
  barriers: [],
  defensibilityConclusion: "conclusion",
  evolutionStage: {
    stage: "公开线索较少",
    trend: "平稳",
    trendNote: "note",
    description: "description",
    timeline: [],
  },
  teamAssessment: {
    summary: "team",
    overallStrength: "moderate",
    benchRisk: "medium",
    keyRisks: ["risk"],
    members: [],
  },
  expertProfiles: [],
  interviewQuestions: [],
  dangerSignals: [],
  sourceCoverage: [],
  publicWebSources: [],
  supplementalMaterial: null,
  supplementalMaterials: [],
};

describe("report helpers", () => {
  it("builds formal report filenames for live analysis", () => {
    expect(buildReportFilename(baseResult, "doc")).toContain("技术尽调报告");
    expect(isMockAnalysis(baseResult)).toBe(false);
  });

  it("builds mock report filenames for mock analysis", () => {
    const mockResult = {
      ...baseResult,
      analysisMeta: {
        ...baseResult.analysisMeta,
        origin: "mock" as const,
      },
    };

    expect(buildReportFilename(mockResult, "doc")).toContain("Mock演示报告");
    expect(isMockAnalysis(mockResult)).toBe(true);
  });

  it("generates editable sections for report preview", () => {
    const sections = buildReportSections(baseResult);
    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0]?.title).toBeTruthy();
    expect(sections[0]?.content).toBeTruthy();
  });
});
