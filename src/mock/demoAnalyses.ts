import type {
  AnalysisResult,
  Barrier,
  Citation,
  DangerSignal,
  EvolutionMetric,
  ExpertProfile,
  InterviewQuestion,
  Inventor,
  Paper,
  Patent,
  PatentSource,
  RoleKey,
  SourceCoverage,
  StageKey,
  SupplementalMaterial,
  TechBranch,
  TechClaim,
} from "@/types/analysis";

type BarrierSeed = Omit<Barrier, "score" | "rationale" | "gaps"> & {
  score?: number;
  rationale?: string[];
  gaps?: string[];
};

type TechClaimSeed = Omit<TechClaim, "evidenceStrength" | "supportingEvidence" | "gapEvidence" | "nextChecks"> & {
  evidenceStrength?: "strong" | "medium" | "weak";
  supportingEvidence?: string[];
  gapEvidence?: string[];
  nextChecks?: string[];
};

type PatentSeed = {
  title: string;
  patentNo: string;
  applicant: string;
  inventors: string[];
  filingDate: string;
  abstract: string;
  source: PatentSource;
  sourceUrl: string;
  citedBy: number;
  techBranch: string;
  isCorePatent?: boolean;
  isLeapNode?: boolean;
};

type PaperSeed = {
  title: string;
  authors: string;
  journal: string;
  year: number;
  relevance: string;
  summary: string;
  url?: string;
  arxivId?: string;
};

type DemoCaseConfig = {
  id: string;
  generatedAt: string;
  companyName: string;
  englishName: string;
  marketLabel: string;
  sectorLabel: string;
  launcherSummary: string;
  launcherHighlights: string[];
  founded: string;
  headquarters: string;
  stage: string;
  employees: string;
  industry: string;
  keywords: string[];
  role: RoleKey;
  stageKey: StageKey;
  analysisMode: "rules" | "ai_enhanced";
  analysisNote: string;
  model?: string | null;
  patents: PatentSeed[];
  papers: PaperSeed[];
  branchDescriptions: Record<string, string>;
  evolutionStage: AnalysisResult["evolutionStage"];
  productLifecycle?: AnalysisResult["productLifecycle"];
  teamAssessment?: AnalysisResult["teamAssessment"];
  barriers: BarrierSeed[];
  techClaims: TechClaimSeed[];
  defensibilityConclusion: string;
  expertProfiles: ExpertProfile[];
  interviewQuestions: InterviewQuestion[];
  dangerSignals: DangerSignal[];
  supplementalMaterial?: SupplementalMaterial | null;
};

export interface DemoScenario {
  id: string;
  companyName: string;
  marketLabel: string;
  sectorLabel: string;
  summary: string;
  highlights: string[];
  analysis: AnalysisResult;
};

const ROLE_LABELS: Record<RoleKey, string> = {
  tech_expert: "技术专家",
  ex_executive: "前高管",
  industry_analyst: "行业分析师",
  ip_lawyer: "知识产权律师",
};

const STAGE_LABELS: Record<StageKey, string> = {
  screening: "初筛（5-8条快速判断）",
  deep_dd: "深度尽调（12-15条全面验证）",
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  createScenario({
    id: "demo-wolfspeed-sic",
    generatedAt: "2026-04-11T08:30:00.000Z",
    companyName: "Wolfspeed, Inc.",
    englishName: "Wolfspeed, Inc.",
    marketLabel: "海外公司",
    sectorLabel: "半导体",
    launcherSummary:
      "围绕 8 英寸 SiC 衬底、沟槽 MOSFET 与车规功率模块构建的海外半导体案例，适合演示专利时间轴、技术跃迁点、发明人集中度和量产壁垒判断。",
    launcherHighlights: ["8 英寸 SiC 衬底放量", "沟槽 MOSFET 可靠性", "车规级功率模块热管理"],
    founded: "1987",
    headquarters: "美国北卡罗来纳州 Durham",
    stage: "规模化交付阶段",
    employees: "约 5,000 人",
    industry: "第三代半导体 / 功率器件",
    keywords: ["SiC MOSFET", "8英寸SiC衬底", "功率模块"],
    role: "tech_expert",
    stageKey: "deep_dd",
    analysisMode: "ai_enhanced",
    analysisNote: "演示案例：模拟海外 SiC 龙头的公开专利、论文和白皮书数据，用于展示全链路尽调能力。",
    model: "gpt-5",
    patents: [
      {
        title: "8-inch silicon carbide substrate defect suppression during boule scaling",
        patentNo: "US20210198431A1",
        applicant: "Wolfspeed, Inc.",
        inventors: ["John Palmour", "Anant Agarwal"],
        filingDate: "2021-03-18",
        abstract:
          "公开了在 200mm 碳化硅晶锭拉制阶段对位错密度进行动态监测和补偿的方法，用于在扩晶放量时控制微管缺陷和外延良率波动。",
        source: "Google Patents",
        sourceUrl: "https://patents.google.com/patent/US20210198431A1/en",
        citedBy: 42,
        techBranch: "8英寸SiC衬底",
        isCorePatent: true,
        isLeapNode: true,
      },
      {
        title: "Gate oxide reliability control structure for trench SiC MOSFET cells",
        patentNo: "US20220277144A1",
        applicant: "Wolfspeed, Inc.",
        inventors: ["Philip Neudeck", "Anant Agarwal"],
        filingDate: "2022-07-11",
        abstract:
          "针对沟槽型 SiC MOSFET 在高温高压工况下的栅氧可靠性问题，提出场板、电场分布与界面处理的联合优化结构。",
        source: "Google Patents",
        sourceUrl: "https://patents.google.com/patent/US20220277144A1/en",
        citedBy: 35,
        techBranch: "SiC MOSFET",
        isCorePatent: true,
      },
      {
        title: "Low-inductance automotive traction inverter package using double-sided interconnect",
        patentNo: "WO2023201987A1",
        applicant: "Wolfspeed, Inc.",
        inventors: ["Gregg Lowe", "Anita Joshi"],
        filingDate: "2023-02-06",
        abstract:
          "通过双面互连和低寄生电感走线，降低高压逆变器在高开关频率下的电压尖峰，为车规功率模块平台化提供封装基础。",
        source: "Lens.org",
        sourceUrl: "https://www.lens.org/lens/patent/WO2023201987A1",
        citedBy: 18,
        techBranch: "功率模块",
        isCorePatent: true,
      },
      {
        title: "Silver sinter thermal management stack for high-current SiC power modules",
        patentNo: "EP4321987A1",
        applicant: "Wolfspeed, Inc.",
        inventors: ["Anita Joshi", "Kevin Speer"],
        filingDate: "2024-04-19",
        abstract:
          "披露了面向大电流牵引逆变应用的银烧结热界面层与铜基板叠层设计，用于提升循环可靠性和热扩散效率。",
        source: "Lens.org",
        sourceUrl: "https://www.lens.org/lens/patent/EP4321987A1",
        citedBy: 11,
        techBranch: "功率模块",
        isCorePatent: false,
      },
      {
        title: "Uniformity compensation system for 200 mm SiC epitaxy reactors",
        patentNo: "US20250062177A1",
        applicant: "Wolfspeed, Inc.",
        inventors: ["John Palmour", "Maria Chen"],
        filingDate: "2025-01-22",
        abstract:
          "针对 8 英寸 SiC 外延片的厚度与掺杂均匀性，建立温场、流场和补偿控制联动的反应器控制系统。",
        source: "Google Patents",
        sourceUrl: "https://patents.google.com/patent/US20250062177A1/en",
        citedBy: 6,
        techBranch: "8英寸SiC衬底",
        isCorePatent: false,
      },
      {
        title: "High-yield crystal growth control for large-diameter silicon carbide boule production",
        patentNo: "US20250300718A1",
        applicant: "Wolfspeed, Inc.",
        inventors: ["Maria Chen", "Anant Agarwal"],
        filingDate: "2025-09-03",
        abstract:
          "通过多区域加热曲线和晶体旋转参数联控，降低 8 英寸晶锭扩径过程中的裂纹和翘曲风险，提升大尺寸产能良率。",
        source: "Google Patents",
        sourceUrl: "https://patents.google.com/patent/US20250300718A1/en",
        citedBy: 2,
        techBranch: "8英寸SiC衬底",
        isCorePatent: false,
      },
    ],
    papers: [
      {
        title: "Thermo-mechanical trade-offs in 200 mm SiC boule scaling",
        authors: "Evan Brooks, Maria Chen, N. Patel",
        journal: "arXiv",
        year: 2024,
        relevance: "用于验证 8 英寸 SiC 晶体扩径中的缺陷控制与产线放量逻辑。",
        summary: "讨论大尺寸 SiC 晶锭在温度梯度、应力场和缺陷密度之间的权衡，适合作为产能良率追问的技术背景。",
        url: "https://arxiv.org/",
      },
      {
        title: "Gate oxide degradation modelling for trench SiC MOSFET under EV load cycles",
        authors: "A. Joshi, Y. Nakamura",
        journal: "arXiv",
        year: 2023,
        relevance: "可用于核对沟槽 MOSFET 的寿命建模是否与车规负载曲线相匹配。",
        summary: "针对电动车高频工况下的阈值漂移、界面态累积与栅氧退化建立退化模型。",
        url: "https://arxiv.org/",
      },
      {
        title: "Double-sided sinter packaging for high-voltage SiC traction modules",
        authors: "K. Speer, J. Rivera",
        journal: "arXiv",
        year: 2025,
        relevance: "支撑对功率模块热阻、寄生电感和循环寿命的工程化判断。",
        summary: "研究双面烧结封装在高压牵引模块中的热阻优化与循环应力表现。",
        url: "https://arxiv.org/",
      },
      {
        title: "Inline optical inspection for SiC epi-wafer defect mapping",
        authors: "M. Chen, D. Hall",
        journal: "arXiv",
        year: 2025,
        relevance: "可映射外延良率监测能力是否已进入量产级闭环。",
        summary: "讨论外延片缺陷在线检测的图像建模方法和生产闭环监控流程。",
        url: "https://arxiv.org/",
      },
      {
        title: "Reliability screening flows for automotive SiC module qualification",
        authors: "P. Neudeck, G. Lowe",
        journal: "arXiv",
        year: 2024,
        relevance: "帮助核查车规验证流程是否形成标准化平台能力。",
        summary: "覆盖功率循环、温循、湿热与高压应力测试在车规 SiC 模块导入中的筛选流程。",
        url: "https://arxiv.org/",
      },
    ],
    branchDescriptions: {
      "SiC MOSFET": "聚焦沟槽单元、栅氧可靠性和器件开关损耗控制。",
      "8英寸SiC衬底": "聚焦大尺寸碳化硅晶体生长、缺陷抑制与外延均匀性。",
      "功率模块": "聚焦牵引逆变器场景下的封装、热管理和低电感设计。",
    },
    evolutionStage: {
      stage: "商业化量产",
      trend: "加速",
      trendNote: "最近两年的专利集中在 8 英寸扩产和车规模块平台化，说明从器件能力走向产能与交付能力的信号较强。",
      description:
        "公开线索表明该公司已从单点器件创新迈入商业化量产阶段，专利布局从材料与器件逐步延伸到封装、工艺和质量控制，技术壁垒正转化为制造壁垒。",
      timeline: [
        { year: "2021", tech: "8英寸SiC衬底" },
        { year: "2022", tech: "SiC MOSFET" },
        { year: "2023", tech: "功率模块" },
        { year: "2025", tech: "量产工艺闭环" },
      ],
    },
    barriers: [
      {
        type: "patent",
        label: "专利壁垒",
        strength: "strong",
        evidence: "专利覆盖晶体生长、器件结构、封装和量产控制，呈现明显的连续路线与平台化布局。",
        patents: ["P001", "P002", "P003"],
      },
      {
        type: "algorithm",
        label: "算法壁垒",
        strength: "moderate",
        evidence: "外延均匀性补偿与在线缺陷检测说明其在生产控制算法上具备工程积累，但核心壁垒仍偏材料与制造。",
        patents: ["P005", "P006"],
      },
      {
        type: "data",
        label: "数据壁垒",
        strength: "moderate",
        evidence: "若公司已建立大尺寸 SiC 生长与车规可靠性数据库，将对良率提升和资格验证形成长期优势。",
        patents: ["P001", "P004"],
      },
      {
        type: "engineering",
        label: "工程壁垒",
        strength: "strong",
        evidence: "从衬底到模块再到车规验证的闭环表明其工程壁垒高，特别体现在产能爬坡与模块可靠性控制。",
        patents: ["P003", "P004", "P005"],
      },
    ],
    techClaims: [
      {
        id: "CLAIM-001",
        claim: "Wolfspeed 已在 8 英寸 SiC 衬底与外延环节建立先发制造能力。",
        source: "Google Patents / 演示白皮书",
        status: "verified",
        evidence: "专利覆盖大尺寸晶体生长、缺陷抑制、外延均匀性与在线监测，说明壁垒已从实验室扩展到制造环节。",
        relatedPatents: ["P001", "P005", "P006"],
      },
      {
        id: "CLAIM-002",
        claim: "沟槽 SiC MOSFET 的可靠性优化是其器件护城河核心之一。",
        source: "Google Patents / arXiv",
        status: "verified",
        evidence: "器件结构与栅氧可靠性模型共同指向寿命控制是公司器件平台化能力的重点。",
        relatedPatents: ["P002"],
      },
      {
        id: "CLAIM-003",
        claim: "车规功率模块的量产导入速度仍需通过客户 SOP 节点进一步交叉验证。",
        source: "Lens.org / 模拟访谈纪要",
        status: "questionable",
        evidence: "模块专利与热管理路线较清晰，但公开材料尚未直接给出规模化车型导入节奏与产线稼动率。",
        relatedPatents: ["P003", "P004"],
      },
    ],
    defensibilityConclusion:
      "Wolfspeed 的护城河并不只来自器件专利数量，而是来自 8 英寸 SiC 衬底放量、沟槽器件可靠性和车规功率模块平台化三者之间的协同。对投资判断最关键的变量，是其制造良率与车规客户导入是否同步兑现。",
    expertProfiles: buildExpertProfiles("Wolfspeed, Inc.", "SiC MOSFET", "功率模块"),
    interviewQuestions: buildInterviewQuestions("Wolfspeed, Inc.", "SiC MOSFET", "8英寸SiC衬底"),
    dangerSignals: [
      {
        phrase: "8英寸扩产正在按计划推进",
        interpretation: "需要追问具体良率、外延均匀性和客户端认证节奏，否则扩产表述可能只是产能口径。",
        severity: "high",
      },
      {
        phrase: "车规模块验证反馈积极",
        interpretation: "要追问是否已进入 SOP 采购与批量车型定点，不应只停留在试样阶段。",
        severity: "high",
      },
      {
        phrase: "器件性能已经行业领先",
        interpretation: "应要求给出在高温、高压与可靠性维度上的量化指标，而不是只比较导通损耗。",
        severity: "medium",
      },
      {
        phrase: "制造能力会随着资本开支自然释放",
        interpretation: "资本开支并不自动等于良率爬坡，需核查人才、工艺和设备联调能力。",
        severity: "medium",
      },
    ],
    supplementalMaterial: {
      filename: "demo-wolfspeed-sic-whitepaper.pdf",
      contentType: "application/pdf",
      sizeBytes: 2_850_000,
      pageCount: 22,
      extractionStatus: "success",
      extractionNote: "演示模式：已模拟提取 22 页白皮书与产线说明。",
    },
  }),
  createScenario({
    id: "demo-first-solar-cdte",
    generatedAt: "2026-04-10T09:20:00.000Z",
    companyName: "First Solar, Inc.",
    englishName: "First Solar, Inc.",
    marketLabel: "海外公司",
    sectorLabel: "新能源",
    launcherSummary:
      "聚焦 CdTe 薄膜组件、封装与回收体系的海外新能源案例，适合演示学术路线、工程壁垒、ESG 回收闭环和报告导出内容。",
    launcherHighlights: ["CdTe 薄膜电池路线", "组件封装与可靠性", "回收闭环与制造良率"],
    founded: "1999",
    headquarters: "美国亚利桑那州 Tempe",
    stage: "成熟量产阶段",
    employees: "约 7,000 人",
    industry: "光伏 / 薄膜组件",
    keywords: ["CdTe薄膜", "组件封装", "制造良率"],
    role: "industry_analyst",
    stageKey: "deep_dd",
    analysisMode: "ai_enhanced",
    analysisNote: "演示案例：模拟海外薄膜光伏龙头的专利路线、学术线索和回收闭环材料。",
    model: "gpt-5",
    patents: [
      {
        title: "Cadmium telluride absorber deposition control with inline composition tuning",
        patentNo: "US20200094321A1",
        applicant: "First Solar, Inc.",
        inventors: ["Raffi Garabedian", "Megan Fields"],
        filingDate: "2020-02-28",
        abstract:
          "面向 CdTe 吸收层沉积过程的在线成分控制方法，用于改善薄膜均匀性、组件效率与批间稳定性。",
        source: "Google Patents",
        sourceUrl: "https://patents.google.com/patent/US20200094321A1/en",
        citedBy: 26,
        techBranch: "CdTe薄膜",
        isCorePatent: true,
        isLeapNode: true,
      },
      {
        title: "Back contact stack architecture for high-yield CdTe solar modules",
        patentNo: "US20210130888A1",
        applicant: "First Solar, Inc.",
        inventors: ["Mark Widmar", "Megan Fields"],
        filingDate: "2021-05-14",
        abstract:
          "针对背接触堆栈的金属层、缓冲层和界面控制，提升大尺寸薄膜组件的导电性与制程良率。",
        source: "Google Patents",
        sourceUrl: "https://patents.google.com/patent/US20210130888A1/en",
        citedBy: 21,
        techBranch: "CdTe薄膜",
        isCorePatent: true,
      },
      {
        title: "Edge seal package with moisture diffusion suppression for utility-scale modules",
        patentNo: "WO2023021189A1",
        applicant: "First Solar, Inc.",
        inventors: ["Sean Gallagher", "Lydia Owens"],
        filingDate: "2022-09-20",
        abstract:
          "针对大型地面电站场景提出低水汽渗透的边封装结构，提升组件在高温高湿环境中的长期稳定性。",
        source: "Lens.org",
        sourceUrl: "https://www.lens.org/lens/patent/WO2023021189A1",
        citedBy: 14,
        techBranch: "组件封装",
        isCorePatent: true,
      },
      {
        title: "Closed-loop tellurium recovery process for thin-film module manufacturing",
        patentNo: "EP4215092A1",
        applicant: "First Solar, Inc.",
        inventors: ["Lydia Owens", "David Perry"],
        filingDate: "2023-06-12",
        abstract:
          "通过回收工艺将退役组件与制造边角料中的碲资源回收再利用，强化材料闭环和成本弹性。",
        source: "Lens.org",
        sourceUrl: "https://www.lens.org/lens/patent/EP4215092A1",
        citedBy: 9,
        techBranch: "制造良率",
        isCorePatent: false,
        isLeapNode: true,
      },
      {
        title: "Inline defect classification for large-area thin film solar panel production",
        patentNo: "US20240211277A1",
        applicant: "First Solar, Inc.",
        inventors: ["Megan Fields", "David Perry"],
        filingDate: "2024-04-30",
        abstract:
          "构建面向大面积薄膜组件的在线缺陷分类方法，将视觉检测与工艺参数联动，用于良率闭环。",
        source: "Google Patents",
        sourceUrl: "https://patents.google.com/patent/US20240211277A1/en",
        citedBy: 5,
        techBranch: "制造良率",
        isCorePatent: false,
      },
      {
        title: "High-durability laminate stack for desert-deployed CdTe modules",
        patentNo: "US20250088209A1",
        applicant: "First Solar, Inc.",
        inventors: ["Sean Gallagher", "Rachel Fox"],
        filingDate: "2025-08-07",
        abstract:
          "针对高辐照、沙尘和温差循环场景设计高耐久层压结构，提升组件在荒漠环境下的寿命表现。",
        source: "Google Patents",
        sourceUrl: "https://patents.google.com/patent/US20250088209A1/en",
        citedBy: 1,
        techBranch: "组件封装",
        isCorePatent: false,
      },
    ],
    papers: [
      {
        title: "Manufacturing yield drivers in large-area CdTe photovoltaic lines",
        authors: "L. Owens, D. Perry",
        journal: "arXiv",
        year: 2024,
        relevance: "可用于判断薄膜组件制造良率提升是工艺改善还是设备升级驱动。",
        summary: "围绕大面积 CdTe 产线中的颗粒缺陷、界面波动和在线缺陷识别进行建模分析。",
        url: "https://arxiv.org/",
      },
      {
        title: "Long-duration field reliability of edge-sealed thin-film modules",
        authors: "S. Gallagher, R. Fox",
        journal: "arXiv",
        year: 2023,
        relevance: "用于验证组件封装路线在地面电站长周期场景中的可靠性。",
        summary: "系统讨论高湿、热循环与紫外老化对封装边界的影响。",
        url: "https://arxiv.org/",
      },
      {
        title: "Material circularity in tellurium-constrained solar manufacturing",
        authors: "D. Perry, M. Fields",
        journal: "arXiv",
        year: 2025,
        relevance: "支持对材料闭环、ESG 叙事和资源保障能力的交叉验证。",
        summary: "从碲供应链和回收工艺角度讨论薄膜光伏的成本与资源韧性。",
        url: "https://arxiv.org/",
      },
      {
        title: "Back contact optimisation strategies for next-gen CdTe module efficiency",
        authors: "R. Garabedian, M. Fields",
        journal: "arXiv",
        year: 2022,
        relevance: "帮助拆解效率提升究竟来自材料体系还是背接触设计优化。",
        summary: "围绕背接触架构的电学损耗与工艺窗口展开研究。",
        url: "https://arxiv.org/",
      },
    ],
    branchDescriptions: {
      "CdTe薄膜": "围绕吸收层沉积、背接触设计和材料均匀性控制展开。",
      "组件封装": "围绕边封装、层压结构和长期可靠性设计展开。",
      "制造良率": "围绕在线缺陷识别、回收闭环和大面积产线稳定性展开。",
    },
    evolutionStage: {
      stage: "商业化量产",
      trend: "平稳",
      trendNote: "新增专利更多集中在可靠性、回收和制造良率，说明其技术路线已进入以成本与长期寿命优化为主的成熟阶段。",
      description:
        "First Solar 的公开技术路线显示其已从效率突破转向大规模制造、封装可靠性与资源回收闭环，壁垒更多体现在材料体系和工业化经验积累。",
      timeline: [
        { year: "2020", tech: "CdTe薄膜" },
        { year: "2022", tech: "组件封装" },
        { year: "2023", tech: "回收闭环" },
        { year: "2025", tech: "寿命优化" },
      ],
    },
    barriers: [
      {
        type: "patent",
        label: "专利壁垒",
        strength: "strong",
        evidence: "围绕吸收层、背接触、封装和回收建立了完整路线，专利脉络具有明显代际连续性。",
        patents: ["P001", "P002", "P003"],
      },
      {
        type: "algorithm",
        label: "算法壁垒",
        strength: "moderate",
        evidence: "在线缺陷分类和良率闭环算法可提升产线弹性，但仍服务于其制造工艺壁垒。",
        patents: ["P005"],
      },
      {
        type: "data",
        label: "数据壁垒",
        strength: "strong",
        evidence: "长期场站运行数据与回收体系数据会不断强化其封装可靠性和材料闭环认知。",
        patents: ["P003", "P004"],
      },
      {
        type: "engineering",
        label: "工程壁垒",
        strength: "strong",
        evidence: "大面积薄膜量产、边封装可靠性和材料回收三者形成了高度工程化的复合壁垒。",
        patents: ["P003", "P004", "P006"],
      },
    ],
    techClaims: [
      {
        id: "CLAIM-001",
        claim: "First Solar 的壁垒核心在于 CdTe 路线与大规模制造经验的结合。",
        source: "Google Patents / 演示报告",
        status: "verified",
        evidence: "公开专利不仅覆盖电池本体，还覆盖封装、回收和制造闭环，显示其壁垒已扩展到工业体系。",
        relatedPatents: ["P001", "P002", "P005"],
      },
      {
        id: "CLAIM-002",
        claim: "封装与场站可靠性是其在海外地面电站市场的关键差异化能力。",
        source: "Lens.org / 模拟场站数据",
        status: "verified",
        evidence: "边封装和耐久层压结构的专利与论文路线一致，说明其重心已放在长期寿命和 O&M 成本。",
        relatedPatents: ["P003", "P006"],
      },
      {
        id: "CLAIM-003",
        claim: "回收闭环是否已显著改善毛利率弹性仍需财务与运营数据进一步验证。",
        source: "演示访谈纪要",
        status: "questionable",
        evidence: "回收路线存在清晰专利，但对利润结构的贡献仍需结合真实材料成本和回收占比拆解。",
        relatedPatents: ["P004"],
      },
    ],
    defensibilityConclusion:
      "First Solar 的技术护城河更像一条工业化护城河，而非单一电池效率护城河。若要继续提高投资判断精度，应重点验证其回收闭环对成本结构的真实贡献，以及新产线复制过程中的良率曲线。",
    expertProfiles: buildExpertProfiles("First Solar, Inc.", "CdTe薄膜", "组件封装"),
    interviewQuestions: buildInterviewQuestions("First Solar, Inc.", "CdTe薄膜", "组件封装"),
    dangerSignals: [
      {
        phrase: "薄膜路线的竞争压力主要来自价格战",
        interpretation: "需要追问其制造成本、寿命和回收体系是否足以构成非价格维度的优势。",
        severity: "medium",
      },
      {
        phrase: "封装寿命已经通过长期验证",
        interpretation: "应要求看到实际场站运行年限、失效率与保修条款支撑。",
        severity: "high",
      },
      {
        phrase: "回收会自然带来 ESG 溢价",
        interpretation: "ESG 叙事不一定等于利润改善，需要核查回收率和单位成本变化。",
        severity: "medium",
      },
      {
        phrase: "新产线复制没有明显难度",
        interpretation: "要继续追问关键设备、工艺人员和良率爬坡周期，否则复制难度可能被低估。",
        severity: "high",
      },
    ],
    supplementalMaterial: {
      filename: "demo-firstsolar-module-reliability.pdf",
      contentType: "application/pdf",
      sizeBytes: 3_120_000,
      pageCount: 18,
      extractionStatus: "success",
      extractionNote: "演示模式：已模拟提取 18 页组件可靠性与回收工艺说明。",
    },
  }),
  createScenario({
    id: "demo-catl-sodium",
    generatedAt: "2026-04-09T10:10:00.000Z",
    companyName: "宁德时代新能源科技股份有限公司",
    englishName: "Contemporary Amperex Technology Co., Limited",
    marketLabel: "国内公司",
    sectorLabel: "新能源",
    launcherSummary:
      "围绕钠离子电池、超充体系和热失控抑制的国内新能源案例，适合演示多技术分支、专家访谈包和对比模式。",
    launcherHighlights: ["钠离子体系", "神行超充路线", "热失控抑制与 pack 安全"],
    founded: "2011",
    headquarters: "中国福建省宁德市",
    stage: "平台化扩张阶段",
    employees: "约 11 万人",
    industry: "动力电池 / 储能系统",
    keywords: ["钠离子电池", "超充体系", "热失控抑制"],
    role: "industry_analyst",
    stageKey: "deep_dd",
    analysisMode: "rules",
    analysisNote: "演示案例：模拟国内动力电池龙头在钠离子、超充和安全体系上的公开路线。",
    model: null,
    patents: [
      {
        title: "一种高倍率钠离子电池负极预钠化方法",
        patentNo: "CN114908321A",
        applicant: "宁德时代新能源科技股份有限公司",
        inventors: ["吴凯", "高焕"],
        filingDate: "2022-01-12",
        abstract:
          "通过负极预钠化与电解液协同设计，改善钠离子电池首效与低温性能，为规模化储能应用提供基础。",
        source: "Google Patents",
        sourceUrl: "https://patents.google.com/patent/CN114908321A/zh",
        citedBy: 28,
        techBranch: "钠离子电池",
        isCorePatent: true,
        isLeapNode: true,
      },
      {
        title: "一种快充锂电池正极颗粒级浓度梯度控制方法",
        patentNo: "CN115622847A",
        applicant: "宁德时代新能源科技股份有限公司",
        inventors: ["曾毓群", "刘畅"],
        filingDate: "2023-02-17",
        abstract:
          "针对高倍率快充场景，通过正极颗粒浓度梯度与导电网络设计，提升 4C 以上充电倍率下的循环寿命。",
        source: "Google Patents",
        sourceUrl: "https://patents.google.com/patent/CN115622847A/zh",
        citedBy: 24,
        techBranch: "超充体系",
        isCorePatent: true,
      },
      {
        title: "一种电芯-模组级热失控扩散阻断结构",
        patentNo: "WO2024019208A1",
        applicant: "宁德时代新能源科技股份有限公司",
        inventors: ["刘畅", "赵跃"],
        filingDate: "2023-10-23",
        abstract:
          "从电芯、模组到 pack 层级构建热扩散阻断路径，降低局部热失控向系统级扩散的概率。",
        source: "Lens.org",
        sourceUrl: "https://www.lens.org/lens/patent/WO2024019208A1",
        citedBy: 16,
        techBranch: "热失控抑制",
        isCorePatent: true,
      },
      {
        title: "一种适用于高倍率补锂场景的电解液体系",
        patentNo: "CN117009833A",
        applicant: "宁德时代新能源科技股份有限公司",
        inventors: ["高焕", "陈澈"],
        filingDate: "2024-05-08",
        abstract:
          "面向超充场景优化锂盐与添加剂体系，平衡界面膜稳定性、导电性与高温安全性。",
        source: "Google Patents",
        sourceUrl: "https://patents.google.com/patent/CN117009833A/zh",
        citedBy: 10,
        techBranch: "超充体系",
        isCorePatent: false,
      },
      {
        title: "一种面向储能系统的钠离子电芯一致性分选方法",
        patentNo: "EP4371820A1",
        applicant: "宁德时代新能源科技股份有限公司",
        inventors: ["吴凯", "赵跃"],
        filingDate: "2025-02-14",
        abstract:
          "通过大规模一致性分选与成组策略，优化钠离子电芯在储能场景下的寿命分布和运维效率。",
        source: "Lens.org",
        sourceUrl: "https://www.lens.org/lens/patent/EP4371820A1",
        citedBy: 4,
        techBranch: "钠离子电池",
        isCorePatent: false,
      },
      {
        title: "一种液冷板与隔热层协同的电池包安全结构",
        patentNo: "CN118912771A",
        applicant: "宁德时代新能源科技股份有限公司",
        inventors: ["陈澈", "赵跃"],
        filingDate: "2025-09-05",
        abstract:
          "结合液冷路径、隔热层与泄压设计，在高倍率和热冲击场景下提升电池包系统级安全边界。",
        source: "Google Patents",
        sourceUrl: "https://patents.google.com/patent/CN118912771A/zh",
        citedBy: 1,
        techBranch: "热失控抑制",
        isCorePatent: false,
      },
    ],
    papers: [
      {
        title: "Pre-sodiation design space for high-rate sodium-ion cells",
        authors: "Huan Gao, Kai Wu",
        journal: "arXiv",
        year: 2024,
        relevance: "用于验证钠离子路线在倍率与低温性能上的核心参数。",
        summary: "比较不同预钠化策略对倍率性能、首效和低温放电的影响。",
        url: "https://arxiv.org/",
      },
      {
        title: "Fast-charging degradation pathways in layered cathode systems",
        authors: "Chang Liu, C. Shen",
        journal: "arXiv",
        year: 2025,
        relevance: "帮助判断超充路线的寿命损耗是否得到材料体系支持。",
        summary: "梳理高倍率快充条件下正极颗粒裂纹、锂沉积与界面退化的耦合路径。",
        url: "https://arxiv.org/",
      },
      {
        title: "Propagation barriers for cell-to-pack thermal runaway mitigation",
        authors: "Yue Zhao, Che Chen",
        journal: "arXiv",
        year: 2024,
        relevance: "直接支撑对 pack 安全架构与热扩散控制能力的验证。",
        summary: "分析热失控扩散在模组级和 pack 级别的阻断策略。",
        url: "https://arxiv.org/",
      },
      {
        title: "Consistency sorting strategy for sodium-ion energy storage racks",
        authors: "Kai Wu, D. Huang",
        journal: "arXiv",
        year: 2025,
        relevance: "用于校验钠离子储能体系的成组与运维能力。",
        summary: "研究储能系统中电芯一致性分布对寿命和维护成本的影响。",
        url: "https://arxiv.org/",
      },
      {
        title: "Cooling path co-design for ultra-fast charge battery packs",
        authors: "Che Chen, Yue Zhao",
        journal: "arXiv",
        year: 2025,
        relevance: "帮助拆解超充与安全体系是否真正形成 pack 级耦合能力。",
        summary: "围绕液冷路径、隔热材料和热扩散边界的协同设计展开。",
        url: "https://arxiv.org/",
      },
    ],
    branchDescriptions: {
      "钠离子电池": "围绕预钠化、低温性能和储能一致性控制展开。",
      "超充体系": "围绕高倍率材料设计、电解液体系和循环寿命展开。",
      "热失控抑制": "围绕电芯到 pack 级的热扩散阻断与冷却路径展开。",
    },
    evolutionStage: {
      stage: "工程应用优化",
      trend: "加速",
      trendNote: "公开路线已从单一电芯创新扩展到储能成组和 pack 安全，说明公司在加速把材料路线转化为系统级方案。",
      description:
        "钠离子与超充路线并行推进，说明公司在不同终端场景下构建多平台电池技术栈；热失控抑制相关布局则体现其系统级工程化能力。",
      timeline: [
        { year: "2022", tech: "钠离子电池" },
        { year: "2023", tech: "超充体系" },
        { year: "2024", tech: "热失控抑制" },
        { year: "2025", tech: "储能一致性" },
      ],
    },
    barriers: [
      {
        type: "patent",
        label: "专利壁垒",
        strength: "moderate",
        evidence: "围绕钠离子、超充和安全形成多分支布局，但不同路线的商业化成熟度仍有差异。",
        patents: ["P001", "P002", "P003"],
      },
      {
        type: "algorithm",
        label: "算法壁垒",
        strength: "moderate",
        evidence: "电芯一致性分选、热管理控制和倍率策略需要依赖大规模运行数据与模型迭代。",
        patents: ["P005", "P006"],
      },
      {
        type: "data",
        label: "数据壁垒",
        strength: "strong",
        evidence: "海量车辆与储能运行数据可反向强化热管理、寿命预测和系统级 BMS 策略。",
        patents: ["P003", "P006"],
      },
      {
        type: "engineering",
        label: "工程壁垒",
        strength: "strong",
        evidence: "多路线电池平台要真正形成壁垒，关键在于供应链、制造和 pack 集成能力，公开线索显示其在该方向布局较深。",
        patents: ["P002", "P003", "P006"],
      },
    ],
    techClaims: [
      {
        id: "CLAIM-001",
        claim: "宁德时代已将钠离子路线从材料验证推进到储能工程化。",
        source: "Google Patents / 模拟储能白皮书",
        status: "verified",
        evidence: "专利从预钠化逐步延伸到一致性分选与系统集成，说明其关注点已从单电芯扩展到工程化部署。",
        relatedPatents: ["P001", "P005"],
      },
      {
        id: "CLAIM-002",
        claim: "超充体系的真实竞争力取决于材料与 pack 安全协同，而非单一充电倍率口径。",
        source: "Google Patents / arXiv",
        status: "verified",
        evidence: "超充材料设计与热失控阻断路线在公开数据中同步出现，说明其在系统层面考虑了高倍率约束。",
        relatedPatents: ["P002", "P004", "P006"],
      },
      {
        id: "CLAIM-003",
        claim: "钠离子路线的规模化经济性仍需通过真实 BOM 和客户导入结构继续验证。",
        source: "演示访谈纪要",
        status: "questionable",
        evidence: "公开专利说明路线积极推进，但钠离子在不同应用场景的成本优势和装机节奏仍需拆解。",
        relatedPatents: ["P001", "P005"],
      },
    ],
    defensibilityConclusion:
      "宁德时代的壁垒不是单点材料路线，而是多平台电池体系叠加系统工程能力。对投前判断而言，最值得深挖的是钠离子路线的经济性兑现节奏，以及超充体系在客户导入中的真实边界条件。",
    expertProfiles: buildExpertProfiles("宁德时代新能源科技股份有限公司", "钠离子电池", "超充体系"),
    interviewQuestions: buildInterviewQuestions("宁德时代新能源科技股份有限公司", "钠离子电池", "超充体系"),
    dangerSignals: [
      {
        phrase: "钠离子很快会全面替代部分磷酸铁锂场景",
        interpretation: "需要追问真实成本、能量密度、循环寿命和下游接受度，不应只看技术路线故事。",
        severity: "high",
      },
      {
        phrase: "超充能力主要靠材料升级就够了",
        interpretation: "高倍率充电必须联动 pack 安全、热管理和站端条件，单点材料改进不足以支撑系统级体验。",
        severity: "high",
      },
      {
        phrase: "热失控已经完全可以避免",
        interpretation: "更准确的说法应是降低扩散概率与损失边界，需核查触发条件和系统级容错设计。",
        severity: "medium",
      },
      {
        phrase: "平台化路线不会增加制造复杂度",
        interpretation: "多平台并行通常会抬高制造、采购和验证复杂度，建议继续追问工厂和供应链切换效率。",
        severity: "medium",
      },
    ],
    supplementalMaterial: {
      filename: "demo-catl-sodium-fastcharge-pack.pdf",
      contentType: "application/pdf",
      sizeBytes: 4_260_000,
      pageCount: 26,
      extractionStatus: "success",
      extractionNote: "演示模式：已模拟提取 26 页电池体系、快充和安全结构说明。",
    },
  }),
  createScenario({
    id: "demo-bydsemi-igbt",
    generatedAt: "2026-04-08T11:15:00.000Z",
    companyName: "比亚迪半导体股份有限公司",
    englishName: "BYD Semiconductor Co., Ltd.",
    marketLabel: "国内公司",
    sectorLabel: "半导体",
    launcherSummary:
      "围绕 IGBT、SiC 模块和车规功率器件的国内半导体案例，适合演示国产替代、供应链绑定、对比台与访谈问题包。",
    launcherHighlights: ["IGBT 芯片设计", "SiC 模块封装", "车规功率器件国产替代"],
    founded: "2004",
    headquarters: "中国广东省深圳市",
    stage: "车规导入加速阶段",
    employees: "约 1.2 万人",
    industry: "功率半导体 / 车规电子",
    keywords: ["IGBT", "SiC模块", "车规功率器件"],
    role: "ip_lawyer",
    stageKey: "deep_dd",
    analysisMode: "rules",
    analysisNote: "演示案例：模拟国内车规功率半导体厂商的 IGBT 与 SiC 路线布局。",
    model: null,
    patents: [
      {
        title: "一种低损耗车规级 IGBT 单元结构",
        patentNo: "CN113682188A",
        applicant: "比亚迪半导体股份有限公司",
        inventors: ["陈刚", "刘伟"],
        filingDate: "2021-11-09",
        abstract:
          "通过优化沟槽结构与载流通道，提高 IGBT 在车规驱动场景下的导通性能与开关效率。",
        source: "Google Patents",
        sourceUrl: "https://patents.google.com/patent/CN113682188A/zh",
        citedBy: 19,
        techBranch: "IGBT",
        isCorePatent: true,
        isLeapNode: true,
      },
      {
        title: "一种面向电驱逆变器的功率芯片键合可靠性增强方法",
        patentNo: "CN114902731A",
        applicant: "比亚迪半导体股份有限公司",
        inventors: ["刘伟", "胡凯"],
        filingDate: "2022-08-15",
        abstract:
          "优化键合线布局与焊点结构，降低逆变器高热循环工况下的失效风险。",
        source: "Google Patents",
        sourceUrl: "https://patents.google.com/patent/CN114902731A/zh",
        citedBy: 13,
        techBranch: "车规功率器件",
        isCorePatent: true,
      },
      {
        title: "一种 SiC 功率模块低电感封装结构",
        patentNo: "WO2024022281A1",
        applicant: "比亚迪半导体股份有限公司",
        inventors: ["张涛", "胡凯"],
        filingDate: "2023-04-18",
        abstract:
          "通过母排、引脚和散热层的协同设计，降低 SiC 模块寄生电感并提升高频工作稳定性。",
        source: "Lens.org",
        sourceUrl: "https://www.lens.org/lens/patent/WO2024022281A1",
        citedBy: 12,
        techBranch: "SiC模块",
        isCorePatent: true,
      },
      {
        title: "一种适用于车规场景的 SiC 芯片栅氧可靠性筛选方法",
        patentNo: "CN116731928A",
        applicant: "比亚迪半导体股份有限公司",
        inventors: ["陈刚", "张涛"],
        filingDate: "2024-03-11",
        abstract:
          "通过高温高压应力测试与参数回归模型筛选 SiC 芯片，降低车规导入中的早期失效率。",
        source: "Google Patents",
        sourceUrl: "https://patents.google.com/patent/CN116731928A/zh",
        citedBy: 8,
        techBranch: "SiC模块",
        isCorePatent: false,
      },
      {
        title: "一种面向主驱平台的 IGBT 与 SiC 混合拓扑驱动方案",
        patentNo: "EP4380917A1",
        applicant: "比亚迪半导体股份有限公司",
        inventors: ["刘伟", "陈刚"],
        filingDate: "2025-01-21",
        abstract:
          "在不同车型功率平台下，通过 IGBT 与 SiC 混合拓扑匹配效率、成本与热管理需求。",
        source: "Lens.org",
        sourceUrl: "https://www.lens.org/lens/patent/EP4380917A1",
        citedBy: 3,
        techBranch: "车规功率器件",
        isCorePatent: false,
      },
      {
        title: "一种车规功率器件模块级失效数据库构建方法",
        patentNo: "CN118772553A",
        applicant: "比亚迪半导体股份有限公司",
        inventors: ["胡凯", "张涛"],
        filingDate: "2025-07-29",
        abstract:
          "基于失效机理、热循环和工况数据建立功率器件模块级失效数据库，用于车规质量闭环与追溯。",
        source: "Google Patents",
        sourceUrl: "https://patents.google.com/patent/CN118772553A/zh",
        citedBy: 1,
        techBranch: "车规功率器件",
        isCorePatent: false,
      },
    ],
    papers: [
      {
        title: "Failure mechanisms of automotive IGBT bond wire under traction cycles",
        authors: "Wei Liu, G. Chen",
        journal: "arXiv",
        year: 2023,
        relevance: "可用于验证 IGBT 可靠性优化是否真正针对车规场景。",
        summary: "研究功率循环下 IGBT 键合线疲劳和焊层开裂的主要失效路径。",
        url: "https://arxiv.org/",
      },
      {
        title: "Low-inductance packaging options for high-frequency SiC inverter modules",
        authors: "Tao Zhang, K. Hu",
        journal: "arXiv",
        year: 2024,
        relevance: "帮助判断 SiC 模块封装是否构成系统级性能差异化。",
        summary: "对比不同封装路径对寄生参数、热阻和 EMI 的影响。",
        url: "https://arxiv.org/",
      },
      {
        title: "Reliability screening methodology for automotive SiC gate oxide",
        authors: "G. Chen, T. Zhang",
        journal: "arXiv",
        year: 2025,
        relevance: "支撑对 SiC 芯片车规导入门槛的验证。",
        summary: "围绕高温偏压与长期应力下的栅氧退化建立筛选流程。",
        url: "https://arxiv.org/",
      },
      {
        title: "Mixed topology design between IGBT and SiC for multi-tier EV platforms",
        authors: "K. Hu, W. Liu",
        journal: "arXiv",
        year: 2025,
        relevance: "用于判断公司是否正在形成可覆盖多车型平台的产品矩阵。",
        summary: "探讨 IGBT 与 SiC 在不同功率平台上的成本性能平衡方案。",
        url: "https://arxiv.org/",
      },
    ],
    branchDescriptions: {
      IGBT: "围绕车规驱动场景下的器件结构、损耗控制和可靠性展开。",
      "SiC模块": "围绕 SiC 芯片筛选、模块封装和高频工作稳定性展开。",
      "车规功率器件": "围绕失效数据库、混合拓扑和整车平台适配展开。",
    },
    evolutionStage: {
      stage: "工程应用优化",
      trend: "加速",
      trendNote: "公开路线显示其从 IGBT 单点器件逐步延伸到 SiC 模块和整车平台适配，国产替代属性较强。",
      description:
        "比亚迪半导体的技术演进并非单纯追求单点器件效率，而是在围绕整车主驱场景构建器件、模块和平台的协同方案，这更接近工程化导入型护城河。",
      timeline: [
        { year: "2021", tech: "IGBT" },
        { year: "2023", tech: "SiC模块" },
        { year: "2024", tech: "车规筛选" },
        { year: "2025", tech: "平台化适配" },
      ],
    },
    barriers: [
      {
        type: "patent",
        label: "专利壁垒",
        strength: "moderate",
        evidence: "器件、封装和平台化路线都有布局，但在海外高端市场中的专利覆盖仍需继续观察。",
        patents: ["P001", "P003", "P005"],
      },
      {
        type: "algorithm",
        label: "算法壁垒",
        strength: "weak",
        evidence: "当前更核心的壁垒仍是器件、模块与失效数据库，算法主要服务于筛选与失效建模。",
        patents: ["P004", "P006"],
      },
      {
        type: "data",
        label: "数据壁垒",
        strength: "moderate",
        evidence: "若能沉淀整车主驱工况与失效数据库，将形成车规导入的重要软性壁垒。",
        patents: ["P006"],
      },
      {
        type: "engineering",
        label: "工程壁垒",
        strength: "strong",
        evidence: "整车场景验证、主驱平台适配和模块封装工艺共同构成其较强的工程导入壁垒。",
        patents: ["P002", "P003", "P005"],
      },
    ],
    techClaims: [
      {
        id: "CLAIM-001",
        claim: "比亚迪半导体的核心优势在于车规场景下的器件-模块一体化导入能力。",
        source: "Google Patents / 演示行业访谈",
        status: "verified",
        evidence: "专利从 IGBT 单元结构、模块封装到失效数据库连续出现，显示其关注点高度贴近主驱场景。",
        relatedPatents: ["P001", "P002", "P003"],
      },
      {
        id: "CLAIM-002",
        claim: "SiC 模块业务能否放量取决于栅氧可靠性与低电感封装协同是否成熟。",
        source: "Lens.org / arXiv",
        status: "verified",
        evidence: "SiC 路线的公开数据集中在封装与筛选，这与车规导入的关键挑战一致。",
        relatedPatents: ["P003", "P004"],
      },
      {
        id: "CLAIM-003",
        claim: "外部客户市场的份额突破仍需与内部整车体系剥离验证。",
        source: "演示投研备注",
        status: "questionable",
        evidence: "如果销量主要依赖内部生态，则其独立市场化竞争力还需要更多外部客户证据支撑。",
        relatedPatents: ["P005", "P006"],
      },
    ],
    defensibilityConclusion:
      "比亚迪半导体更像一家整车场景深度绑定型的功率器件公司。真正的护城河可能不是单颗芯片性能，而是整车工况验证、模块工艺迭代和质量数据库所形成的导入闭环。下一步建议重点验证其外部客户拓展与独立品牌能力。",
    expertProfiles: buildExpertProfiles("比亚迪半导体股份有限公司", "IGBT", "SiC模块"),
    interviewQuestions: buildInterviewQuestions("比亚迪半导体股份有限公司", "IGBT", "SiC模块"),
    dangerSignals: [
      {
        phrase: "我们主要优势就是配套能力强",
        interpretation: "需要拆分是内部生态优势，还是独立市场竞争力；两者对应的估值逻辑并不相同。",
        severity: "high",
      },
      {
        phrase: "SiC 模块已经准备全面放量",
        interpretation: "应继续追问哪一代车型、哪一平台、哪一功率段已验证完成，以及失效率数据。",
        severity: "high",
      },
      {
        phrase: "IGBT 经验自然可以迁移到 SiC",
        interpretation: "SiC 在栅氧、封装与筛选上的要求不同，迁移难度不能低估。",
        severity: "medium",
      },
      {
        phrase: "外部客户拓展只差商务推进",
        interpretation: "若缺乏外部平台验证和质量口碑，商务推进并不能替代真正的导入门槛。",
        severity: "medium",
      },
    ],
    supplementalMaterial: {
      filename: "demo-bydsemi-power-device-roadmap.pdf",
      contentType: "application/pdf",
      sizeBytes: 2_430_000,
      pageCount: 16,
      extractionStatus: "success",
      extractionNote: "演示模式：已模拟提取 16 页器件平台路线图与封装材料。",
    },
  }),
];

function createScenario(config: DemoCaseConfig): DemoScenario {
  const patents = buildPatents(config.patents);
  const papers = buildPapers(config.papers);
  const inventors = buildInventors(patents);
  const techBranches = buildTechBranches(config.keywords, config.branchDescriptions, patents);
  const citations = buildCitations(patents, papers);
  const evolutionMetrics = buildEvolutionMetrics(patents);
  const sourceCoverage = buildSourceCoverage(patents, papers, config.supplementalMaterial ?? null);
  const productLifecycle = config.productLifecycle ?? buildScenarioLifecycle(config);
  const teamAssessment = config.teamAssessment ?? buildScenarioTeamAssessment(config, inventors);
  const barriers = buildScenarioBarriers(config.barriers);
  const techClaims = buildScenarioClaims(config.techClaims, productLifecycle, teamAssessment);

  return {
    id: config.id,
    companyName: config.companyName,
    marketLabel: config.marketLabel,
    sectorLabel: config.sectorLabel,
    summary: config.launcherSummary,
    highlights: config.launcherHighlights,
    analysis: {
      analysisId: config.id,
      generatedAt: config.generatedAt,
      request: {
        company: config.companyName,
        keywords: config.keywords.join(", "),
        sources: ["google", "lens", "arxiv"],
        publicUrls: [],
        timeRange: "10",
        role: config.role,
        stage: config.stageKey,
        supplementalType: config.supplementalMaterial ? "cnipa_patent" : "other",
        roleLabel: ROLE_LABELS[config.role],
        stageLabel: STAGE_LABELS[config.stageKey],
      },
      analysisMeta: {
        mode: config.analysisMode,
        note: config.analysisNote,
        model: config.model ?? null,
        origin: "mock",
      },
      companyInfo: {
        name: config.companyName,
        englishName: config.englishName,
        founded: config.founded,
        headquarters: config.headquarters,
        stage: config.stage,
        employees: config.employees,
        techKeywords: config.keywords,
        industry: config.industry,
        totalPatents: patents.length,
        inventionPatents: patents.length,
        utilityModels: 0,
      },
      patents,
      inventors,
      techBranches,
      citations,
      papers,
      evolutionMetrics,
      productLifecycle,
      techClaims,
      barriers,
      defensibilityConclusion: config.defensibilityConclusion,
      evolutionStage: config.evolutionStage,
      teamAssessment,
      expertProfiles: config.expertProfiles,
      interviewQuestions: config.interviewQuestions,
      dangerSignals: config.dangerSignals,
      sourceCoverage,
      publicWebSources: [],
      supplementalMaterial: config.supplementalMaterial ?? null,
      supplementalMaterials: config.supplementalMaterial ? [config.supplementalMaterial] : [],
    },
  };
}

function buildPatents(seeds: PatentSeed[]): Patent[] {
  return [...seeds]
    .sort((left, right) => left.filingDate.localeCompare(right.filingDate))
    .map((seed, index) => ({
      id: `P${String(index + 1).padStart(3, "0")}`,
      title: seed.title,
      patentNo: seed.patentNo,
      applicant: seed.applicant,
      inventors: seed.inventors,
      filingDate: seed.filingDate,
      abstract: seed.abstract,
      source: seed.source,
      sourceUrl: seed.sourceUrl,
      citedBy: seed.citedBy,
      techBranch: seed.techBranch,
      isCorePatent: seed.isCorePatent ?? false,
      isLeapNode: seed.isLeapNode ?? false,
    }));
}

function buildPapers(seeds: PaperSeed[]): Paper[] {
  return seeds.map((seed, index) => ({
    id: `PAPER-${String(index + 1).padStart(3, "0")}`,
    title: seed.title,
    authors: seed.authors,
    journal: seed.journal,
    year: seed.year,
    doi: "",
    arxivId: seed.arxivId,
    relevance: seed.relevance,
    url: seed.url,
    summary: seed.summary,
  }));
}

function buildInventors(patents: Patent[]): Inventor[] {
  const counts = new Map<string, number>();
  for (const patent of patents) {
    for (const inventor of patent.inventors) {
      counts.set(inventor, (counts.get(inventor) ?? 0) + 1);
    }
  }

  const total = Math.max(patents.length, 1);
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([name, patentCount]) => ({
      name,
      patentCount,
      role: patentCount >= 3 ? "核心平台负责人" : patentCount >= 2 ? "关键研发骨干" : "项目发明人",
      riskNote: patentCount / total >= 0.4 ? "核心发明人集中度偏高" : null,
    }));
}

function buildTechBranches(
  keywords: string[],
  branchDescriptions: Record<string, string>,
  patents: Patent[],
): TechBranch[] {
  return keywords.map((keyword, index) => ({
    name: keyword,
    description: branchDescriptions[keyword] ?? `围绕 ${keyword} 的关键技术路线。`,
    patentIds: patents.filter((patent) => patent.techBranch === keyword).map((patent) => patent.id),
    isMainline: index < 2,
  }));
}

function buildCitations(patents: Patent[], papers: Paper[]): Citation[] {
  const citations: Citation[] = [];

  for (let index = 0; index < Math.min(3, patents.length, papers.length); index += 1) {
    citations.push({
      fromId: patents[index].id,
      toId: papers[index].id,
      fromTitle: patents[index].title,
      toTitle: papers[index].title,
      type: "paper",
      nature: index < 2 ? "core" : "background",
    });
  }

  for (let index = 1; index < patents.length; index += 1) {
    citations.push({
      fromId: patents[index].id,
      toId: patents[index - 1].id,
      fromTitle: patents[index].title,
      toTitle: patents[index - 1].title,
      type: "patent",
      nature: index % 2 === 0 ? "core" : "background",
    });
  }

  return citations.slice(0, 8);
}

function buildEvolutionMetrics(patents: Patent[]): EvolutionMetric[] {
  const counts = new Map<number, number>();
  for (const patent of patents) {
    const year = Number(patent.filingDate.slice(0, 4));
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }

  let cumulative = 0;
  return [...counts.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([year, patentCount]) => {
      cumulative += patentCount;
      return {
        year,
        patentCount,
        cumulativePatents: cumulative,
      };
    });
}

function buildSourceCoverage(
  patents: Patent[],
  papers: Paper[],
  supplementalMaterial: SupplementalMaterial | null,
): SourceCoverage[] {
  const googleCount = patents.filter((patent) => patent.source === "Google Patents").length;
  const lensCount = patents.filter((patent) => patent.source === "Lens.org").length;

  return [
    {
      label: "Google Patents",
      count: googleCount,
      status: "derived",
      note: `演示数据：已模拟 SerpApi 拉取 ${googleCount} 条 Google Patents 专利结果。`,
    },
    {
      label: "Lens.org",
      count: lensCount,
      status: "derived",
      note: `演示数据：已模拟 ${lensCount} 条 Lens 专利与引文网络。`,
    },
    {
      label: "arXiv",
      count: papers.length,
      status: "derived",
      note: `演示数据：已模拟 ${papers.length} 篇关键论文与研究摘要。`,
    },
    {
      label: "补充材料",
      count: supplementalMaterial ? 1 : 0,
      status: supplementalMaterial ? "derived" : "skipped",
      note: supplementalMaterial?.extractionNote ?? "本演示案例未附带补充材料。",
    },
  ];
}

function buildScenarioLifecycle(config: DemoCaseConfig): AnalysisResult["productLifecycle"] {
  const lifecycleMap: Record<string, AnalysisResult["productLifecycle"]> = {
    "demo-wolfspeed-sic": {
      stage: "规模化交付",
      confidence: "high",
      summary: "判断依据集中在 8 英寸 SiC 衬底扩产、器件可靠性和车规模块封装三条线同时推进，说明壁垒已从器件创新转向制造与交付能力。",
      rationale: "技术路线不再停留于单点器件改良，而是同步延伸到外延、封装、热管理和车规验证，因此更符合规模化交付阶段。",
      evidence: [
        "专利覆盖衬底、MOSFET、功率模块和量产控制，路线连续性强。",
        "近两年的线索重心从器件结构转向外延均匀性、热管理和 qualification，体现制造与交付导向。",
        "关键论文与公开工程主题围绕良率、可靠性和车规筛选流程展开。",
      ],
      nextMilestones: [
        "核查 8 英寸 SiC 产能爬坡是否伴随良率改善而非单纯扩产口径。",
        "确认车规模块平台是否已进入稳定客户 SOP 节奏。",
        "追踪封装和热管理改进是否转化为系统级成本优势。",
      ],
      keyRisks: [
        "若良率与交付节奏未同步改善，制造壁垒可能被高估。",
        "车规验证周期长，模块平台商业兑现速度可能慢于专利披露节奏。",
      ],
    },
    "demo-first-solar-cdte": {
      stage: "规模化交付",
      confidence: "high",
      summary: "生命周期判断偏向规模化交付，核心原因是技术优化点已从实验室效率提升转向大面积组件、制造良率和项目交付。",
      rationale: "当薄膜光伏的公开线索持续落在组件效率、封装稳定性和制造节拍时，通常意味着路线已经进入成熟产线竞争阶段。",
      evidence: [
        "公开技术线索集中于 CdTe 吸收层沉积、组件封装和产线良率优化。",
        "技术主题与公用事业级光伏项目的成本、寿命和规模交付高度相关。",
        "研发叙事从单点效率提升转向制造窗口、模块寿命和系统 LCOE。",
      ],
      nextMilestones: [
        "确认最新组件平台的量产效率和衰减曲线是否与公开叙事一致。",
        "核查制造节拍优化是否已体现在单位瓦成本和项目毛利。",
        "关注下一代钝化和封装路线是否形成新一轮平台切换。",
      ],
      keyRisks: [
        "若效率提升主要来自工艺窗口微调而非平台跃迁，长期壁垒厚度有限。",
        "公用事业项目交付节奏和原材料价格波动会影响生命周期判断。",
      ],
    },
    "demo-catl-solid-state": {
      stage: "商业验证",
      confidence: "medium",
      summary: "判断更接近商业验证，原因是路线重心同时落在材料体系、热失控控制和电池包工程化，而量产证据仍弱于工程验证证据。",
      rationale: "专利与白皮书式信号说明技术已跨过概念论证，但是否真正进入规模量产，仍取决于一致性、成本和客户验证。",
      evidence: [
        "公开路线同时覆盖正负极材料、电芯设计、热管理和 pack 级安全。",
        "线索中反复出现快充、安全和集成效率，说明已进入可验证产品定义阶段。",
        "更多证据支持工程导入而非稳定量产。",
      ],
      nextMilestones: [
        "确认样机循环寿命、安全边界和快充性能是否通过外部验证。",
        "核查材料体系切换对成本、一致性和供应链的影响。",
        "验证 pack 级热管理方案是否已进入客户项目导入。",
      ],
      keyRisks: [
        "从样机到量产之间仍可能卡在良率、一致性和材料成本。",
        "若客户验证停留在示范项目，商业化进度会低于技术叙事。",
      ],
    },
    "demo-byd-semi": {
      stage: "商业验证",
      confidence: "medium",
      summary: "当前更接近商业验证，公开线索已能证明器件与封装路线具备工程推进，但对大规模外部客户验证的证据仍不够厚。",
      rationale: "当技术路线从器件结构延伸至模块封装和车规可靠性，但外部客户扩散证据有限时，更适合定义为中试导入而非完全放量。",
      evidence: [
        "公开专利聚焦功率器件结构、封装散热与车规可靠性。",
        "路线既有器件层改良，也有系统集成与热管理信号。",
        "对外部客户规模渗透和独立市场放量的证据仍偏有限。",
      ],
      nextMilestones: [
        "核查关键器件是否已形成稳定车规认证和批量交付。",
        "确认内部整车导入之外，外部客户拓展是否形成真实增量。",
        "验证模块与系统集成能力是否可跨平台复制。",
      ],
      keyRisks: [
        "若主要验证场景集中于集团内部，外部市场竞争力仍需补证。",
        "器件和封装路线若过度依赖少数平台项目，生命周期判断可能偏乐观。",
      ],
    },
  };

  return lifecycleMap[config.id] ?? {
    stage: config.stage,
    confidence: "medium",
    summary: "演示生命周期判断来自 mock 技术路线和工程信号。",
    rationale: "建议结合更多测试、客户和产线信息做二次验证。",
    evidence: [config.launcherSummary],
    nextMilestones: ["补充更细的测试和客户验证节点。"],
    keyRisks: ["当前仅为演示数据。"],
  };
}

function buildScenarioTeamAssessment(config: DemoCaseConfig, inventors: Inventor[]): AnalysisResult["teamAssessment"] {
  const teamMap: Record<string, AnalysisResult["teamAssessment"]> = {
    "demo-wolfspeed-sic": {
      summary: "团队能力覆盖材料、器件、封装和量产工艺，说明这不是单个发明人驱动的点状创新，而是平台化研发组织。",
      overallStrength: "strong",
      benchRisk: "medium",
      keyRisks: [
        "仍需核查材料和器件平台是否依赖少数资深技术权威。",
        "制造放量阶段对工厂运营与良率工程团队的要求高于实验室研发阶段。",
      ],
      members: [
        {
          name: "John Palmour",
          role: "衬底与外延路线负责人",
          background: "公开技术线索示意其长期深耕 SiC 材料平台，覆盖晶体生长、缺陷控制和大尺寸扩径。",
          priorExperience: ["履历线索偏向材料平台与工艺放量连续经验。", "更像从底层材料走到制造平台的长期型负责人。"] ,
          contribution: "决定 8 英寸衬底放量、外延良率和材料平台迭代节奏。",
          domainFit: "strong",
          dependencyRisk: "medium",
          evidence: ["连续出现在衬底和外延相关核心专利。", "与量产工艺优化线索形成呼应。"],
        },
        {
          name: "Anant Agarwal",
          role: "器件平台负责人",
          background: "公开线索示意其覆盖 SiC 器件结构、栅氧可靠性和器件平台迭代。",
          priorExperience: ["履历重心偏器件研发与平台架构。", "具备从器件性能到可靠性工程的连续视角。"] ,
          contribution: "推动沟槽 MOSFET 结构与可靠性路线的连续优化。",
          domainFit: "strong",
          dependencyRisk: "medium",
          evidence: ["在多件核心器件专利中反复出现。", "路线与车规寿命建模文献相呼应。"],
        },
        {
          name: "Anita Joshi",
          role: "模块与封装负责人",
          background: "公开线索显示其更偏封装、热管理和模块系统化落地。",
          priorExperience: ["履历线索偏向系统封装、热设计和 traction application。"],
          contribution: "把器件优势转化为模块级低电感和散热能力。",
          domainFit: "strong",
          dependencyRisk: "low",
          evidence: ["覆盖功率模块与热管理相关专利。", "对应工程壁垒形成的关键过桥角色。"],
        },
      ],
    },
    "demo-first-solar-cdte": {
      summary: "团队匹配度强，说明公司不是只靠单点材料科学突破，而是具备从薄膜沉积到组件制造的完整组织能力。",
      overallStrength: "strong",
      benchRisk: "medium",
      keyRisks: [
        "仍需确认下一代工艺平台是否有足够接班梯队。",
        "组件寿命和封装可靠性能力是否沉淀为组织经验而非单项目经验。",
      ],
      members: [
        {
          name: "Elena Varga",
          role: "吸收层与沉积工艺负责人",
          background: "公开履历线索偏向薄膜沉积、工艺窗口和产线一致性优化。",
          priorExperience: ["长期覆盖材料体系与产线工艺耦合问题。"],
          contribution: "决定 CdTe 主路线的效率天花板与制造窗口。",
          domainFit: "strong",
          dependencyRisk: "medium",
          evidence: ["核心专利集中在吸收层与沉积控制。", "与效率与良率叙事一致。"],
        },
        {
          name: "Mira Sato",
          role: "组件封装与可靠性负责人",
          background: "公开线索显示其长期覆盖封装、寿命和环境可靠性。",
          priorExperience: ["履历更偏组件寿命与 field reliability。"],
          contribution: "把实验室效率转化为项目级长期稳定输出。",
          domainFit: "strong",
          dependencyRisk: "low",
          evidence: ["封装与衰减控制专利连续出现。", "对应公用事业级交付场景。"],
        },
      ],
    },
    "demo-catl-solid-state": {
      summary: "团队结构更像材料体系、系统安全和 pack 工程并行推进，适合样机验证和中试导入阶段，但制造侧板凳仍需继续核查。",
      overallStrength: "moderate",
      benchRisk: "medium",
      keyRisks: [
        "材料体系与量产工艺之间的衔接团队是否完整仍需验证。",
        "若样机验证主要依赖少数平台项目，组织复制能力仍待观察。",
      ],
      members: [
        {
          name: "张磊",
          role: "材料体系负责人",
          background: "公开线索示意其覆盖正负极体系和快充相关材料设计。",
          priorExperience: ["履历线索更偏电化学体系与材料验证。"],
          contribution: "决定能量密度、快充和安全边界的底层材料约束。",
          domainFit: "strong",
          dependencyRisk: "medium",
          evidence: ["多件材料和快充相关专利交叉出现。", "是生命周期从概念走向样机的核心角色。"],
        },
        {
          name: "李欣",
          role: "热管理与系统安全负责人",
          background: "更偏 pack 级热失控防护、BMS 协同和系统安全架构。",
          priorExperience: ["履历信号偏向系统安全和 pack 工程。"],
          contribution: "把材料优势转化为可验证的系统安全方案。",
          domainFit: "strong",
          dependencyRisk: "low",
          evidence: ["热传播和包级安全专利持续出现。", "与样机导入逻辑高度相关。"],
        },
        {
          name: "王涛",
          role: "制造导入负责人",
          background: "公开履历线索有限，但角色上更接近中试和制造导入接口。",
          priorExperience: ["建议补充其产线导入、良率改善和供应链协同经历。"],
          contribution: "负责把实验室与样机指标转成中试可复制流程。",
          domainFit: "moderate",
          dependencyRisk: "medium",
          evidence: ["公开证据弱于材料与系统角色。"],
        },
      ],
    },
    "demo-byd-semi": {
      summary: "团队能力集中于器件设计、封装与整车应用协同，路线匹配度中上，但外部客户拓展能力还需要更多公开履历支撑。",
      overallStrength: "moderate",
      benchRisk: "medium",
      keyRisks: [
        "若市场验证主要依赖内部车型平台，外部化经验仍需补证。",
        "制造和客户支持团队的公开线索少于器件研发团队。",
      ],
      members: [
        {
          name: "周航",
          role: "功率器件负责人",
          background: "公开线索示意其长期参与 IGBT/SiC 器件结构与性能优化。",
          priorExperience: ["履历重心偏器件结构、可靠性和开关损耗控制。"],
          contribution: "定义器件主路线与关键性能指标。",
          domainFit: "strong",
          dependencyRisk: "medium",
          evidence: ["器件结构相关专利集中出现。", "覆盖多个迭代节点。"],
        },
        {
          name: "陈睿",
          role: "封装与热管理负责人",
          background: "公开线索更偏模块封装、散热和系统集成。",
          priorExperience: ["履历信号偏封装与车规系统集成。"],
          contribution: "把芯片级能力转化为车规模块级交付能力。",
          domainFit: "strong",
          dependencyRisk: "low",
          evidence: ["封装与热管理专利连续出现。", "与工程壁垒直接相关。"],
        },
      ],
    },
  };

  return teamMap[config.id] ?? {
    summary: "演示团队画像来自 mock 发明人与角色映射。",
    overallStrength: inventors.length >= 3 ? "moderate" : "weak",
    benchRisk: inventors.some((inventor) => inventor.riskNote) ? "high" : "medium",
    keyRisks: ["当前仅为演示团队画像。"],
    members: inventors.slice(0, 2).map((inventor) => ({
      name: inventor.name,
      role: inventor.role,
      background: "演示用团队背景。",
      priorExperience: ["当前仅为演示数据。"],
      contribution: "当前仅为演示数据。",
      domainFit: "moderate",
      dependencyRisk: inventor.riskNote ? "high" : "medium",
      evidence: [`出现在 ${inventor.patentCount} 件专利中。`],
    })),
  };
}

function buildScenarioBarriers(barriers: BarrierSeed[]): Barrier[] {
  return barriers.map((barrier) => ({
    ...barrier,
    score:
      barrier.score ??
      (barrier.strength === "strong" ? 84 : barrier.strength === "moderate" ? 63 : 38),
    rationale:
      barrier.rationale ??
      [
        barrier.evidence,
        barrier.patents.length > 0 ? `对应专利节点: ${barrier.patents.join("、")}` : "当前更多依赖工程和验证信号而非单个专利。",
      ],
    gaps:
      barrier.gaps ??
      [
        barrier.strength === "strong" ? "需继续确认壁垒是否已稳定转化为规模交付优势。" : "公开证据仍不足以支撑更高强度判断。",
      ],
  }));
}

function buildScenarioClaims(
  claims: TechClaimSeed[],
  productLifecycle: AnalysisResult["productLifecycle"],
  teamAssessment: AnalysisResult["teamAssessment"],
): TechClaim[] {
  return claims.map((claim, index) => ({
    ...claim,
    evidenceStrength:
      claim.evidenceStrength ??
      (claim.status === "verified" ? "strong" : claim.status === "partially_verified" ? "medium" : "weak"),
    supportingEvidence:
      claim.supportingEvidence ??
      [claim.evidence, productLifecycle.evidence[index % productLifecycle.evidence.length] ?? productLifecycle.summary],
    gapEvidence:
      claim.gapEvidence ??
      (claim.status === "verified" ? [] : [productLifecycle.keyRisks[0] ?? teamAssessment.keyRisks[0] ?? "仍需补充更多外部证据。"]),
    nextChecks:
      claim.nextChecks ??
      [
        productLifecycle.nextMilestones[index % productLifecycle.nextMilestones.length] ?? "继续补充里程碑证据。",
        teamAssessment.keyRisks[0] ?? "继续核查团队与交付能力。",
      ],
  }));
}

function buildExpertProfiles(company: string, primaryKeyword: string, secondaryKeyword: string): ExpertProfile[] {
  return [
    {
      role: `${primaryKeyword} 技术专家`,
      background: `长期跟踪 ${primaryKeyword} 技术路线、核心材料和量产验证逻辑，适合判断 ${company} 的技术深度。`,
      channels: ["产业专家库", "离职研发负责人", "上游设备/材料渠道"],
      reason: `核验 ${company} 在 ${primaryKeyword} 方向到底是平台能力还是单点优化。`,
    },
    {
      role: "前高管 / 前研发负责人",
      background: "熟悉组织协同、产线导入、资源分配和技术路线切换背后的真实原因。",
      channels: ["猎头网络", "前同事推荐", "产业圈层访谈"],
      reason: "验证技术路线切换是否伴随组织瓶颈、良率压力或客户交付约束。",
    },
    {
      role: `${secondaryKeyword} 行业分析师`,
      background: `可将 ${company} 与同赛道玩家在 ${secondaryKeyword} 方向的速度、成本和客户位置并排比较。`,
      channels: ["券商研究", "行业数据库", "第三方咨询网络"],
      reason: "输出可用于投资委的横向竞争定位结论。",
    },
    {
      role: "知识产权律师",
      background: "擅长判断专利稳定性、FTO 风险和核心权利要求可执行性。",
      channels: ["律所专家库", "专利代理机构", "IP 顾问网络"],
      reason: "验证公开专利是否足以支撑壁垒叙事，是否存在规避或无效化风险。",
    },
  ];
}

function buildInterviewQuestions(company: string, primaryKeyword: string, secondaryKeyword: string): InterviewQuestion[] {
  return [
    {
      id: "Q001",
      category: "claim_verification",
      categoryLabel: "技术声明验证",
      question: `${company} 在 ${primaryKeyword} 上最难被复制的技术环节是什么？`,
      verificationLogic: "要求受访人明确指出无法被轻易复制的工艺、材料、设备或验证流程，而不是只给宏观评价。",
      relatedPatents: ["P001", "P002", "P003"],
      difficulty: "basic",
      targetRole: "tech_expert",
      stage: "screening",
    },
    {
      id: "Q002",
      category: "claim_verification",
      categoryLabel: "技术声明验证",
      question: `如果把 ${primaryKeyword} 和 ${secondaryKeyword} 拆开看，哪一段才是 ${company} 真实的技术跃迁点？请给出性能或良率证据。`,
      verificationLogic: "强制受访人给出量化指标、时间节点和失败代价，用于识别真正的技术跳变而非普通迭代。",
      relatedPatents: ["P001", "P003", "P005"],
      difficulty: "deep",
      targetRole: "tech_expert",
      stage: "deep_dd",
    },
    {
      id: "Q003",
      category: "team_stability",
      categoryLabel: "团队稳定性",
      question: `最近两年 ${company} 的核心研发团队是否围绕 ${primaryKeyword} 或 ${secondaryKeyword} 做过组织重构？`,
      verificationLogic: "如果发生重构，需要继续追问原因是技术突破、客户压力还是良率/交付问题。",
      relatedPatents: ["P002", "P004"],
      difficulty: "basic",
      targetRole: "ex_executive",
      stage: "screening",
    },
    {
      id: "Q004",
      category: "barrier_defensibility",
      categoryLabel: "壁垒可防御性",
      question: `竞品如果沿着相同路线追赶，${company} 在未来 24 个月内最有把握守住的优势是什么？`,
      verificationLogic: "重点验证优势是否来自可持续的工艺与组织能力，而非短期产能或客户资源。",
      relatedPatents: ["P001", "P003", "P006"],
      difficulty: "deep",
      targetRole: "ex_executive",
      stage: "deep_dd",
    },
    {
      id: "Q005",
      category: "barrier_defensibility",
      categoryLabel: "壁垒可防御性",
      question: `从赛道视角看，${company} 在 ${primaryKeyword} 方向更像“技术领先者”还是“工程放大者”？`,
      verificationLogic: "通过第三方视角区分公司究竟以原创技术见长，还是以制造和交付能力见长。",
      relatedPatents: ["P001", "P002", "P003"],
      difficulty: "basic",
      targetRole: "industry_analyst",
      stage: "screening",
    },
    {
      id: "Q006",
      category: "barrier_defensibility",
      categoryLabel: "壁垒可防御性",
      question: `如果把 ${company} 与 2-3 家最接近的竞品放在一起比较，谁在 ${secondaryKeyword} 上的兑现速度更快？`,
      verificationLogic: "直接服务于横向对比台，要求受访人从产线、产品和客户导入三个维度比较。",
      relatedPatents: ["P003", "P004", "P005"],
      difficulty: "deep",
      targetRole: "industry_analyst",
      stage: "deep_dd",
    },
    {
      id: "Q007",
      category: "claim_verification",
      categoryLabel: "技术声明验证",
      question: `哪几件核心专利最值得优先检查是否存在无效、绕开或交叉许可风险？`,
      verificationLogic: "优先筛出对投资结论影响最大的专利，而不是机械式列出全部权利要求。",
      relatedPatents: ["P001", "P002", "P003"],
      difficulty: "basic",
      targetRole: "ip_lawyer",
      stage: "screening",
    },
    {
      id: "Q008",
      category: "team_stability",
      categoryLabel: "团队稳定性",
      question: `如果只给你一份 ${company} 的技术白皮书或测试报告，你最先会核查哪些指标来验证 ${primaryKeyword} 的真实性？`,
      verificationLogic: "把访谈问题和补充材料验证动作绑定起来，便于形成实操型尽调清单。",
      relatedPatents: ["P002", "P004", "P006"],
      difficulty: "deep",
      targetRole: "ip_lawyer",
      stage: "deep_dd",
    },
  ];
}
