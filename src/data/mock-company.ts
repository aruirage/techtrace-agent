// 光速感知科技 — 虚构激光雷达公司 Mock 数据

export interface Patent {
  id: string;
  title: string;
  patentNo: string;
  applicant: string;
  inventors: string[];
  filingDate: string;
  abstract: string;
  source: "CNIPA" | "Google Patents" | "Lens.org";
  sourceUrl: string;
  citedBy: number;
  isCorePatent: boolean;
  techBranch: string;
  isLeapNode?: boolean; // 技术跃迁点
}

export interface Inventor {
  name: string;
  patentCount: number;
  role: string;
  riskNote?: string;
}

export interface TechBranch {
  name: string;
  description: string;
  patentIds: string[];
  isMainline: boolean; // 主线技术 vs 延伸方向
}

export interface Citation {
  fromId: string;
  toId: string;
  fromTitle: string;
  toTitle: string;
  type: "patent" | "paper";
  nature: "background" | "core"; // 背景知识 vs 核心技术来源
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
}

export interface EvolutionMetric {
  year: number;
  patentCount: number;
  cumulativePatents: number;
}

export interface TechClaim {
  id: string;
  claim: string;
  source: string;
  status: "verified" | "questionable" | "unverifiable";
  evidence: string;
  relatedPatents: string[];
}

export interface Barrier {
  type: "patent" | "algorithm" | "data" | "engineering";
  label: string;
  strength: "strong" | "moderate" | "weak";
  evidence: string;
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
  targetRole: "tech_expert" | "ex_executive" | "industry_analyst" | "ip_lawyer";
  stage: "screening" | "deep_dd";
}

export interface ExpertProfile {
  role: string;
  background: string;
  channels: string[];
  reason: string;
}

export interface DangerSignal {
  phrase: string;
  interpretation: string;
  severity: "high" | "medium";
}

// ========== 公司基本信息 ==========
export const companyInfo = {
  name: "光速感知科技有限公司",
  englishName: "LightSpeed Sensing Technology Co., Ltd.",
  founded: "2018",
  headquarters: "深圳市南山区",
  stage: "B轮",
  employees: "~280人",
  techKeywords: ["固态激光雷达", "MEMS振镜", "FMCW", "点云处理"],
  industry: "智能驾驶 · 激光雷达",
  totalPatents: 47,
  inventionPatents: 31,
  utilityModels: 16,
};

// ========== 专利数据 ==========
export const patents: Patent[] = [
  {
    id: "P001",
    title: "一种基于MEMS振镜的固态激光雷达扫描系统",
    patentNo: "CN202010345678.2",
    applicant: "光速感知科技有限公司",
    inventors: ["张明远", "李晓峰"],
    filingDate: "2020-04-15",
    abstract: "本发明公开了一种基于MEMS微机电系统振镜的固态激光雷达扫描系统，采用双轴MEMS振镜实现二维扫描，通过自适应频率调节算法优化扫描覆盖率，有效解决了传统机械旋转式激光雷达的可靠性和成本问题。",
    source: "CNIPA",
    sourceUrl: "#",
    citedBy: 12,
    isCorePatent: true,
    techBranch: "MEMS扫描",
    isLeapNode: true,
  },
  {
    id: "P002",
    title: "MEMS振镜驱动控制方法及装置",
    patentNo: "CN202010567890.5",
    applicant: "光速感知科技有限公司",
    inventors: ["张明远", "王强"],
    filingDate: "2020-07-22",
    abstract: "一种MEMS振镜的驱动控制方法，通过闭环反馈机制实时监测振镜偏转角度，结合PID控制算法实现高精度角度控制，振镜定位精度达到0.01°。",
    source: "CNIPA",
    sourceUrl: "#",
    citedBy: 8,
    isCorePatent: true,
    techBranch: "MEMS扫描",
  },
  {
    id: "P003",
    title: "激光雷达点云实时降噪处理方法",
    patentNo: "CN202110123456.8",
    applicant: "光速感知科技有限公司",
    inventors: ["李晓峰", "陈思雨"],
    filingDate: "2021-01-18",
    abstract: "提出一种基于深度学习的激光雷达点云实时降噪方法，利用轻量级神经网络在边缘端完成点云去噪，处理延迟低于5ms，保持95%以上的有效点保留率。",
    source: "CNIPA",
    sourceUrl: "#",
    citedBy: 15,
    isCorePatent: true,
    techBranch: "点云处理",
    isLeapNode: true,
  },
  {
    id: "P004",
    title: "多回波激光雷达信号处理系统",
    patentNo: "CN202110234567.1",
    applicant: "光速感知科技有限公司",
    inventors: ["张明远", "李晓峰", "赵海洋"],
    filingDate: "2021-03-05",
    abstract: "一种多回波激光雷达信号处理系统，能够同时捕获和处理多个回波信号，在雨雾等恶劣天气条件下保持较高的探测可靠性。",
    source: "CNIPA",
    sourceUrl: "#",
    citedBy: 6,
    isCorePatent: false,
    techBranch: "信号处理",
  },
  {
    id: "P005",
    title: "Vehicle-mounted solid-state LiDAR system with adaptive FOV",
    patentNo: "US11,234,567 B2",
    applicant: "LightSpeed Sensing Technology",
    inventors: ["Mingyuan Zhang", "Xiaofeng Li"],
    filingDate: "2021-06-10",
    abstract: "A vehicle-mounted solid-state LiDAR system featuring adaptive field-of-view adjustment based on driving scenarios, dynamically allocating scanning density to regions of interest.",
    source: "Google Patents",
    sourceUrl: "#",
    citedBy: 4,
    isCorePatent: true,
    techBranch: "系统集成",
  },
  {
    id: "P006",
    title: "一种用于自动驾驶的多传感器融合方法",
    patentNo: "CN202110456789.3",
    applicant: "光速感知科技有限公司",
    inventors: ["陈思雨", "赵海洋"],
    filingDate: "2021-08-20",
    abstract: "提出一种激光雷达与摄像头、毫米波雷达的多传感器时空同步融合方法，采用自注意力机制实现异构传感器数据的特征级融合。",
    source: "CNIPA",
    sourceUrl: "#",
    citedBy: 9,
    isCorePatent: false,
    techBranch: "传感器融合",
  },
  {
    id: "P007",
    title: "高重复频率激光发射器驱动电路",
    patentNo: "CN202110567890.7",
    applicant: "光速感知科技有限公司",
    inventors: ["王强"],
    filingDate: "2021-10-12",
    abstract: "一种激光发射器驱动电路设计，支持200kHz以上重复频率的脉冲激光发射，峰值功率达到75W，同时实现低功耗待机模式。",
    source: "CNIPA",
    sourceUrl: "#",
    citedBy: 3,
    isCorePatent: false,
    techBranch: "光源技术",
  },
  {
    id: "P008",
    title: "基于FMCW的相干激光雷达测距方法",
    patentNo: "CN202210123456.0",
    applicant: "光速感知科技有限公司",
    inventors: ["张明远", "刘芳"],
    filingDate: "2022-02-08",
    abstract: "一种基于调频连续波（FMCW）技术的相干激光雷达测距方法，通过线性调频实现同时测距测速，测距精度达到厘米级，抗干扰能力显著优于ToF方案。",
    source: "CNIPA",
    sourceUrl: "#",
    citedBy: 18,
    isCorePatent: true,
    techBranch: "FMCW",
    isLeapNode: true,
  },
  {
    id: "P009",
    title: "FMCW激光雷达的光源频率校准装置",
    patentNo: "CN202210234567.4",
    applicant: "光速感知科技有限公司",
    inventors: ["张明远", "刘芳"],
    filingDate: "2022-05-15",
    abstract: "针对FMCW激光雷达对光源线性度的严苛要求，提出一种基于Mach-Zehnder干涉仪的实时频率校准装置，线性度误差小于0.1%。",
    source: "CNIPA",
    sourceUrl: "#",
    citedBy: 7,
    isCorePatent: true,
    techBranch: "FMCW",
  },
  {
    id: "P010",
    title: "Coherent LiDAR signal processing method using digital beamforming",
    patentNo: "US11,567,890 B2",
    applicant: "LightSpeed Sensing Technology",
    inventors: ["Mingyuan Zhang", "Fang Liu"],
    filingDate: "2022-08-20",
    abstract: "A coherent LiDAR signal processing method employing digital beamforming techniques to enhance detection range and angular resolution in FMCW-based LiDAR systems.",
    source: "Google Patents",
    sourceUrl: "#",
    citedBy: 5,
    isCorePatent: true,
    techBranch: "FMCW",
  },
  {
    id: "P011",
    title: "面向自动驾驶的激光雷达实时目标检测算法",
    patentNo: "CN202210567890.2",
    applicant: "光速感知科技有限公司",
    inventors: ["李晓峰", "陈思雨"],
    filingDate: "2022-09-30",
    abstract: "提出一种针对稀疏点云的实时3D目标检测算法，在Waymo Open Dataset上mAP达到72.3%，推理速度满足L4级自动驾驶实时性要求。",
    source: "CNIPA",
    sourceUrl: "#",
    citedBy: 11,
    isCorePatent: true,
    techBranch: "点云处理",
  },
  {
    id: "P012",
    title: "一种硅光芯片集成激光雷达收发模块",
    patentNo: "CN202310123456.6",
    applicant: "光速感知科技有限公司",
    inventors: ["张明远", "刘芳", "王强"],
    filingDate: "2023-02-14",
    abstract: "基于硅光集成技术的激光雷达收发一体模块，将激光光源、调制器、探测器集成在单一硅光芯片上，模块体积缩小80%，成本降低60%。",
    source: "CNIPA",
    sourceUrl: "#",
    citedBy: 3,
    isCorePatent: true,
    techBranch: "硅光集成",
    isLeapNode: true,
  },
  {
    id: "P013",
    title: "激光雷达三维高精地图构建方法",
    patentNo: "CN202310234567.9",
    applicant: "光速感知科技有限公司",
    inventors: ["陈思雨"],
    filingDate: "2023-04-20",
    abstract: "一种基于SLAM技术的激光雷达三维高精地图实时构建方法，融合IMU和GPS数据，定位精度达到厘米级。",
    source: "CNIPA",
    sourceUrl: "#",
    citedBy: 2,
    isCorePatent: false,
    techBranch: "点云处理",
  },
  {
    id: "P014",
    title: "Silicon photonic integrated circuit for FMCW LiDAR",
    patentNo: "US11,890,123 B2",
    applicant: "LightSpeed Sensing Technology",
    inventors: ["Mingyuan Zhang", "Fang Liu", "Qiang Wang"],
    filingDate: "2023-06-01",
    abstract: "A silicon photonic integrated circuit design for FMCW LiDAR applications, achieving single-chip integration of laser source, modulator, and coherent detector with <5dB insertion loss.",
    source: "Google Patents",
    sourceUrl: "#",
    citedBy: 1,
    isCorePatent: true,
    techBranch: "硅光集成",
  },
  {
    id: "P015",
    title: "FMCW激光雷达的多目标同时测速方法",
    patentNo: "CN202310456789.1",
    applicant: "光速感知科技有限公司",
    inventors: ["刘芳"],
    filingDate: "2023-09-10",
    abstract: "一种在FMCW体制下同时检测多个运动目标速度的方法，通过改进的CFAR检测算法和多普勒频移分析，实现单帧内百个目标的独立测速。",
    source: "CNIPA",
    sourceUrl: "#",
    citedBy: 0,
    isCorePatent: false,
    techBranch: "FMCW",
  },
  {
    id: "P016",
    title: "基于光学相控阵的全固态激光雷达",
    patentNo: "CN202410012345.8",
    applicant: "光速感知科技有限公司",
    inventors: ["张明远", "刘芳"],
    filingDate: "2024-01-15",
    abstract: "采用光学相控阵（OPA）技术替代MEMS振镜实现非机械扫描，通过调节波导阵列相位分布控制光束指向，实现真正的全固态激光雷达。",
    source: "CNIPA",
    sourceUrl: "#",
    citedBy: 0,
    isCorePatent: true,
    techBranch: "OPA",
    isLeapNode: true,
  },
];

// ========== 核心发明人 ==========
export const inventors: Inventor[] = [
  { name: "张明远", patentCount: 10, role: "CTO / 首席科学家", riskNote: "核心技术高度集中于此人，离职风险极高" },
  { name: "李晓峰", patentCount: 5, role: "算法总监" },
  { name: "刘芳", patentCount: 5, role: "光学系统负责人" },
  { name: "陈思雨", patentCount: 4, role: "感知算法工程师" },
  { name: "王强", patentCount: 3, role: "硬件工程总监" },
  { name: "赵海洋", patentCount: 2, role: "系统架构师" },
];

// ========== 技术分支 ==========
export const techBranches: TechBranch[] = [
  { name: "MEMS扫描", description: "基于MEMS微振镜的准固态扫描方案，2020-2021年主力方向", patentIds: ["P001", "P002"], isMainline: true },
  { name: "FMCW", description: "调频连续波相干检测技术，2022年起成为新主线", patentIds: ["P008", "P009", "P010", "P015"], isMainline: true },
  { name: "点云处理", description: "AI驱动的点云降噪、目标检测与地图构建", patentIds: ["P003", "P011", "P013"], isMainline: true },
  { name: "硅光集成", description: "2023年起探索硅光芯片集成路线", patentIds: ["P012", "P014"], isMainline: true },
  { name: "信号处理", description: "多回波信号处理与抗干扰", patentIds: ["P004"], isMainline: false },
  { name: "传感器融合", description: "多传感器数据融合算法", patentIds: ["P006"], isMainline: false },
  { name: "光源技术", description: "高功率激光发射器驱动", patentIds: ["P007"], isMainline: false },
  { name: "OPA", description: "光学相控阵全固态方案，最新探索方向", patentIds: ["P016"], isMainline: false },
];

// ========== 引用关系 ==========
export const citations: Citation[] = [
  { fromId: "P001", toId: "velodyne-2019", fromTitle: "MEMS振镜固态激光雷达", toTitle: "Velodyne US10,234,567 MEMS扫描专利", type: "patent", nature: "core" },
  { fromId: "P001", toId: "texas-mems", fromTitle: "MEMS振镜固态激光雷达", toTitle: "Texas Instruments MEMS振镜技术白皮书", type: "paper", nature: "core" },
  { fromId: "P003", toId: "pointnet-2017", fromTitle: "点云实时降噪", toTitle: "PointNet: Deep Learning on Point Sets (CVPR 2017)", type: "paper", nature: "core" },
  { fromId: "P008", toId: "aeva-fmcw", fromTitle: "FMCW相干测距", toTitle: "Aeva US10,901,234 FMCW LiDAR专利", type: "patent", nature: "background" },
  { fromId: "P008", toId: "mit-fmcw-2019", fromTitle: "FMCW相干测距", toTitle: "MIT Photonics FMCW LiDAR论文 (Nature Photonics 2019)", type: "paper", nature: "core" },
  { fromId: "P011", toId: "centerpoint-2021", fromTitle: "实时目标检测", toTitle: "CenterPoint: 3D Object Detection (CVPR 2021)", type: "paper", nature: "core" },
  { fromId: "P012", toId: "intel-siphotonics", fromTitle: "硅光芯片集成", toTitle: "Intel Silicon Photonics技术路线图", type: "paper", nature: "background" },
  { fromId: "P016", toId: "mit-opa-2022", fromTitle: "光学相控阵", toTitle: "MIT OPA Beam Steering论文 (Science 2022)", type: "paper", nature: "core" },
];

// ========== 相关论文 ==========
export const papers: Paper[] = [
  { id: "pointnet-2017", title: "PointNet: Deep Learning on Point Sets for 3D Classification and Segmentation", authors: "Charles R. Qi et al.", journal: "CVPR 2017", year: 2017, doi: "10.1109/CVPR.2017.16", arxivId: "1612.00593", relevance: "该公司点云处理专利P003核心引用此论文的网络架构" },
  { id: "mit-fmcw-2019", title: "Chip-scale FMCW LiDAR with sub-millimeter resolution", authors: "Christopher V. Poulton et al.", journal: "Nature Photonics 2019", year: 2019, doi: "10.1038/s41566-019-0456-7", relevance: "该公司FMCW技术路线的学术基础" },
  { id: "centerpoint-2021", title: "Center-based 3D Object Detection and Tracking", authors: "Tianwei Yin et al.", journal: "CVPR 2021", year: 2021, doi: "10.1109/CVPR46437.2021.01161", arxivId: "2006.11275", relevance: "该公司P011目标检测算法的理论基础" },
  { id: "mit-opa-2022", title: "Large-scale optical phased array for solid-state beam steering", authors: "MIT Photonics Group", journal: "Science 2022", year: 2022, doi: "10.1126/science.abc1234", relevance: "该公司最新OPA专利P016引用的核心技术来源" },
];

// ========== 演进指标 ==========
export const evolutionMetrics: EvolutionMetric[] = [
  { year: 2019, patentCount: 0, cumulativePatents: 0 },
  { year: 2020, patentCount: 2, cumulativePatents: 2 },
  { year: 2021, patentCount: 5, cumulativePatents: 7 },
  { year: 2022, patentCount: 4, cumulativePatents: 11 },
  { year: 2023, patentCount: 4, cumulativePatents: 15 },
  { year: 2024, patentCount: 1, cumulativePatents: 16 },
];

// ========== 技术声明验证 ==========
export const techClaims: TechClaim[] = [
  {
    id: "C001",
    claim: "自研MEMS振镜扫描技术，核心光学器件完全自主可控",
    source: "公司Pitch Deck (2023年B轮融资)",
    status: "questionable",
    evidence: "专利P001核心引用了Velodyne 2019年MEMS扫描专利（US10,234,567）和Texas Instruments技术白皮书。公司方案的光学架构与Velodyne方案相似度高，「完全自主可控」的说法存疑。MEMS振镜芯片本身从台湾供应商采购。",
    relatedPatents: ["P001", "P002"],
  },
  {
    id: "C002",
    claim: "点云处理算法行业领先，延迟低于5ms",
    source: "公司技术白皮书",
    status: "verified",
    evidence: "专利P003和P011展示了完整的点云处理技术栈，P003明确记载了5ms延迟指标。P011在Waymo Open Dataset上的benchmark数据与声明一致。该指标在行业中确实处于领先水平。",
    relatedPatents: ["P003", "P011"],
  },
  {
    id: "C003",
    claim: "FMCW技术路线完全自研，测距精度达到厘米级",
    source: "CTO公开演讲 (2023 CES)",
    status: "questionable",
    evidence: "专利P008引用了MIT Nature Photonics 2019论文作为核心技术来源。公司FMCW方案建立在公开学术研究基础上，「完全自研」的说法不准确。但在工程实现层面确实有自主创新，厘米级精度的声明可信。",
    relatedPatents: ["P008", "P009", "P010"],
  },
  {
    id: "C004",
    claim: "已实现硅光芯片量产",
    source: "媒体采访 (2024年)",
    status: "unverifiable",
    evidence: "专利P012和P014仅展示了设计方案，未见量产相关的工艺专利或产线信息。公开数据无法验证量产状态，需在访谈中重点追问。",
    relatedPatents: ["P012", "P014"],
  },
  {
    id: "C005",
    claim: "拥有自主知识产权的OPA全固态方案",
    source: "公司官网",
    status: "questionable",
    evidence: "P016申请于2024年1月，且核心引用了MIT 2022年Science论文。该方向仅有1件专利，技术积累不足，是否构成独立的IP体系存疑。",
    relatedPatents: ["P016"],
  },
];

// ========== 技术壁垒判定 ==========
export const barriers: Barrier[] = [
  {
    type: "patent",
    label: "专利壁垒",
    strength: "moderate",
    evidence: "公司拥有47件专利（发明31件），在MEMS扫描和FMCW两个方向有相对集中的布局。但核心专利引用了Velodyne和MIT的公开技术，独创性有限。专利壁垒在防御层面有一定作用，但不足以阻止有实力的竞争者绕过。",
    patents: ["P001", "P008", "P012"],
  },
  {
    type: "algorithm",
    label: "算法壁垒",
    strength: "strong",
    evidence: "点云处理算法是公司最强的技术壁垒。P003和P011展示了从降噪到目标检测的完整算法栈，在公开benchmark上有可验证的领先性能。该壁垒的可防御性较强，因为需要大量标注数据和工程调优经验。",
    patents: ["P003", "P011", "P013"],
  },
  {
    type: "engineering",
    label: "工程壁垒",
    strength: "moderate",
    evidence: "从MEMS到FMCW再到硅光集成，公司展示了较强的系统集成能力。但工程壁垒的可复制性较高，主要取决于团队稳定性。核心发明人高度集中于CTO张明远（10件专利），人员依赖风险显著。",
    patents: ["P005", "P006", "P007"],
  },
  {
    type: "data",
    label: "数据壁垒",
    strength: "weak",
    evidence: "公司在点云算法训练中可能积累了一定的私有数据集，但专利中未见数据壁垒相关的技术保护。公开数据集（Waymo, nuScenes）是行业通用资源，公司的数据壁垒不明显。",
    patents: [],
  },
];

// ========== 综合结论 ==========
export const defensibilityConclusion = `光速感知科技的技术壁垒呈现「算法强、专利中、工程中、数据弱」的格局。

**最强壁垒：** 点云处理算法栈（P003, P011）具有可验证的性能优势和工程调优积累，是公司最核心的竞争力。

**主要风险：**
1. 核心发明人集中度过高：CTO张明远参与了10/16件样本专利（62.5%），人员依赖风险极高
2. 技术路线频繁切换：从MEMS(2020) → FMCW(2022) → 硅光(2023) → OPA(2024)，四年换了四条路线，可能反映技术方向不坚定
3. 部分技术声明可信度不足：「完全自研」的说法与专利引用关系不符

**综合判断：** 技术壁垒整体可防御性中等。建议访谈重点追问团队稳定性、技术路线选择逻辑、以及硅光量产的真实进展。`;

// ========== 演进阶段判断 ==========
export const evolutionStage = {
  stage: "工程应用优化",
  description: "公司已度过基础研究阶段，当前处于工程应用优化期。MEMS和FMCW方向已有成熟的专利布局，正在向硅光集成和OPA方向探索。但频繁的技术路线切换值得关注——可能反映了对主攻方向的犹豫。",
  trend: "加速" as const,
  trendNote: "近3年专利申请密度高于创业初期，但2024年申请量下降（截至Q1仅1件），需观察后续走势。",
};

// ========== 访谈专家画像 ==========
export const expertProfiles: ExpertProfile[] = [
  {
    role: "MEMS/光学系统专家",
    background: "有MEMS传感器量产经验的前工程师，熟悉振镜设计与供应链",
    channels: ["凯盛专家网络", "LinkedIn（搜索MEMS LiDAR）"],
    reason: "验证公司MEMS振镜「完全自主可控」的技术声明",
  },
  {
    role: "FMCW激光雷达研究员",
    background: "有FMCW LiDAR论文发表或产业化经验的研究人员",
    channels: ["GLG专家网络", "学术社交网络（ResearchGate）"],
    reason: "评估公司FMCW方案相对于Aeva、Insight等竞品的技术差异化",
  },
  {
    role: "硅光集成行业专家",
    background: "有硅光芯片Fab经验或供应链背景的从业者",
    channels: ["凯盛", "LinkedIn"],
    reason: "验证硅光芯片量产声明的可信度，了解代工产线的实际情况",
  },
];

// ========== 访谈问题包 ==========
export const interviewQuestions: InterviewQuestion[] = [
  // 技术声明验证
  {
    id: "Q001",
    category: "claim_verification",
    categoryLabel: "技术声明验证",
    question: "你们的MEMS振镜设计与Velodyne 2019年专利（US10,234,567）的技术路径有何本质区别？核心光学器件的供应商是谁？",
    verificationLogic: "专利P001核心引用了Velodyne方案。若受访人无法说明差异化，或承认振镜从外部采购，则「完全自主可控」的声明不成立。",
    relatedPatents: ["P001", "P002"],
    difficulty: "deep",
    targetRole: "tech_expert",
    stage: "deep_dd",
  },
  {
    id: "Q002",
    category: "claim_verification",
    categoryLabel: "技术声明验证",
    question: "FMCW方案中，光源线性调频的技术实现与MIT Poulton团队2019年Nature Photonics论文的方案有哪些本质差异？",
    verificationLogic: "专利P008引用了MIT论文作为核心来源。需判断公司在MIT方案基础上做了多少独立创新，还是仅做了工程实现。",
    relatedPatents: ["P008", "P009"],
    difficulty: "deep",
    targetRole: "tech_expert",
    stage: "deep_dd",
  },
  {
    id: "Q003",
    category: "claim_verification",
    categoryLabel: "技术声明验证",
    question: "硅光芯片的代工合作方是哪家Fab？目前的良率水平和月产能分别是多少？",
    verificationLogic: "专利P012/P014仅展示设计方案，无量产证据。此问题可直接验证「已实现量产」的声明。若无法给出具体Fab和良率数据，量产声明不可信。",
    relatedPatents: ["P012", "P014"],
    difficulty: "deep",
    targetRole: "tech_expert",
    stage: "deep_dd",
  },
  {
    id: "Q004",
    category: "claim_verification",
    categoryLabel: "技术声明验证",
    question: "点云处理算法在Waymo Open Dataset上的mAP 72.3%是在哪个版本的数据集上测试的？测试条件和推理硬件是什么？",
    verificationLogic: "P011声称的benchmark数据需要验证测试条件的公平性。不同版本数据集的难度差异显著。",
    relatedPatents: ["P011"],
    difficulty: "basic",
    targetRole: "tech_expert",
    stage: "screening",
  },
  // 壁垒可防御性
  {
    id: "Q005",
    category: "barrier_defensibility",
    categoryLabel: "壁垒可防御性",
    question: "如果华为或大疆用类似的MEMS+FMCW技术路线进入市场，你们的技术护城河体现在哪些方面？",
    verificationLogic: "考察受访人对自身技术壁垒的认知深度。若仅提到专利数量而非具体技术差异化，说明壁垒认知薄弱。",
    relatedPatents: ["P001", "P008"],
    difficulty: "deep",
    targetRole: "industry_analyst",
    stage: "deep_dd",
  },
  {
    id: "Q006",
    category: "barrier_defensibility",
    categoryLabel: "壁垒可防御性",
    question: "从MEMS到FMCW再到硅光集成，四年内切换了三条技术路线。这背后的战略逻辑是什么？是否意味着之前的路线判断失误？",
    verificationLogic: "频繁切换技术路线可能反映方向不坚定。若受访人将其解释为「技术演进的自然迭代」，需追问每次切换的具体触发原因。",
    relatedPatents: ["P001", "P008", "P012", "P016"],
    difficulty: "deep",
    targetRole: "ex_executive",
    stage: "deep_dd",
  },
  {
    id: "Q007",
    category: "barrier_defensibility",
    categoryLabel: "壁垒可防御性",
    question: "点云处理算法的训练数据来源是什么？是否有私有数据集构成的壁垒？",
    verificationLogic: "数据壁垒目前评估为弱。若公司确有大规模私有标注数据且积累成本高，可上调壁垒评级。",
    relatedPatents: ["P003", "P011"],
    difficulty: "basic",
    targetRole: "tech_expert",
    stage: "screening",
  },
  // 团队稳定性
  {
    id: "Q008",
    category: "team_stability",
    categoryLabel: "团队稳定性",
    question: "CTO张明远参与了公司超过60%的核心专利。如果张明远离职，技术团队是否有能力独立推进当前的研发方向？",
    verificationLogic: "发明人集中度数据显示核心技术高度依赖个人。需评估技术团队的深度——是否有第二梯队能接棒。",
    relatedPatents: ["P001", "P008", "P012", "P016"],
    difficulty: "deep",
    targetRole: "ex_executive",
    stage: "deep_dd",
  },
  {
    id: "Q009",
    category: "team_stability",
    categoryLabel: "团队稳定性",
    question: "过去12个月内，核心技术团队（发明人级别）是否有人员变动？光学系统负责人刘芳目前是否仍在职？",
    verificationLogic: "刘芳是FMCW和硅光方向的核心发明人（5件专利）。如已离职，公司在这两个方向的持续研发能力存疑。",
    relatedPatents: ["P008", "P009", "P012"],
    difficulty: "basic",
    targetRole: "ex_executive",
    stage: "screening",
  },
  {
    id: "Q010",
    category: "team_stability",
    categoryLabel: "团队稳定性",
    question: "研发团队中有多少人拥有光学或微电子领域的博士学位？核心发明人的竞业限制情况如何？",
    verificationLogic: "硬科技公司的人才壁垒取决于高学历研发人员的密度和竞业保护力度。",
    relatedPatents: [],
    difficulty: "basic",
    targetRole: "ip_lawyer",
    stage: "screening",
  },
  // 额外的初筛问题（给不同角色）
  {
    id: "Q011",
    category: "claim_verification",
    categoryLabel: "技术声明验证",
    question: "公司现有专利组合中，有哪些专利被第三方引用次数最多？这些高被引专利的技术方向是否与公司当前战略一致？",
    verificationLogic: "高被引专利反映行业认可度。若高被引专利集中在旧技术路线而非当前主攻方向，可能暗示技术转型风险。",
    relatedPatents: ["P003", "P008"],
    difficulty: "basic",
    targetRole: "ip_lawyer",
    stage: "screening",
  },
  {
    id: "Q012",
    category: "barrier_defensibility",
    categoryLabel: "壁垒可防御性",
    question: "从行业格局来看，光速感知在激光雷达赛道中属于什么段位？与禾赛、速腾、Luminar等头部厂商的核心差异是什么？",
    verificationLogic: "第三方视角验证公司的行业定位和竞争力，避免公司自我认知偏差。",
    relatedPatents: [],
    difficulty: "basic",
    targetRole: "industry_analyst",
    stage: "screening",
  },
  {
    id: "Q013",
    category: "claim_verification",
    categoryLabel: "技术声明验证",
    question: "公司的核心专利是否存在被无效宣告的风险？是否有正在进行的专利纠纷或侵权诉讼？",
    verificationLogic: "专利壁垒的有效性取决于专利质量和法律稳定性。存在无效风险的专利不能计入壁垒。",
    relatedPatents: ["P001", "P008"],
    difficulty: "deep",
    targetRole: "ip_lawyer",
    stage: "deep_dd",
  },
  {
    id: "Q014",
    category: "team_stability",
    categoryLabel: "团队稳定性",
    question: "公司管理层在战略决策上是否存在分歧？技术路线的频繁切换是CTO主导还是CEO/董事会驱动？",
    verificationLogic: "管理层战略分歧是技术公司的重大风险信号。需判断技术路线切换的决策机制。",
    relatedPatents: [],
    difficulty: "deep",
    targetRole: "ex_executive",
    stage: "deep_dd",
  },
];

// ========== 危险信号词 ==========
export const dangerSignals: DangerSignal[] = [
  { phrase: "我们参考了公开论文", interpretation: "可能意味着核心技术建立在公开研究基础上，自研成分需追问", severity: "medium" },
  { phrase: "核心算法在迭代中", interpretation: "技术方向可能尚未收敛，壁垒尚未形成", severity: "medium" },
  { phrase: "量产正在推进/即将量产", interpretation: "「即将」可能意味着还远未实现，需追问具体时间线和良率", severity: "high" },
  { phrase: "我们的优势是团队", interpretation: "可能暗示技术本身的差异化不足，壁垒依赖人而非技术", severity: "high" },
  { phrase: "这个方向我们布局最早", interpretation: "先发优势不等于技术壁垒，需验证专利质量而非时间", severity: "medium" },
  { phrase: "竞品还没有做这个", interpretation: "可能是因为市场验证不足，而非技术壁垒", severity: "medium" },
];
