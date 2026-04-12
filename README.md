# TechTrace Agent

TechTrace Agent 是一个单仓库的公开数据技术尽调与技术溯源工具。

- 前端：Vite + React，位于仓库根目录 `src/`
- 后端：FastAPI，位于 `backend/`
- 当前聚焦：专利、论文、公开网页、用户上传 PDF 的技术溯源与技术尽调
- 已打通：分析表单、后端 API、结构化结果页、生命周期判断、技术壁垒、访谈问题、报告导出、历史分析、多标的横向对比
- 内置 `Mock 全流程测试` 按钮，可一键载入 2 个海外 + 2 个国内演示案例，不依赖真实 API

## 项目结构

```text
.
├── backend/              # FastAPI 后端
├── public/               # 静态资源
├── src/                  # Vite + React 前端
├── .env.example          # 环境变量模板
├── package.json          # 前端依赖与脚本
└── requirements.txt      # 后端依赖
```

## 本地运行

先在仓库根目录准备环境文件：

```bash
cp .env.example .env
```

然后把你自己的 API Key 填进根目录 `.env`。这个文件已经被 git 忽略，适合本地开发和后续开源。

环境变量说明：

- `Lens.org` 需要 `TECHTRACE_LENS_API_KEY`
- `Google Patents` 现在优先走 `SerpApi` 第三方接口，建议配置 `TECHTRACE_GOOGLE_PATENTS_API_KEY`
- `OpenAI` 不是必填；只有当你希望系统用模型增强技术总结时，才需要 `TECHTRACE_OPENAI_API_KEY`
- `CNIPA` 不再走实时接口，改为通过上传 PDF 作为补充材料

后端：

```bash
pip install -r requirements.txt
uvicorn backend.app:app --reload --port 8000
```

前端：

```bash
npm install
npm run dev
```

打开 `http://localhost:8080`。

如果你修改了根目录 `.env` 里的 API Key，建议重启后端；如果改了 `VITE_*` 变量，也需要重启前端开发服务器。

## API

健康检查：

```bash
GET /api/health
```

分析接口：

```bash
POST /api/analyze
```

表单字段：

- `company`
- `keywords`
- `sources`，可重复提交多个值
- `time_range`
- `role`
- `stage`
- `supplemental`，可选 PDF 文件

## 当前范围

- `arXiv` 已接入真实检索
- `Google Patents` 已接入 `SerpApi` 第三方检索，未配置 key 时才回退到公开网页兜底
- `Lens.org` 已接入正式 API
- 上传 PDF 会尝试抽取文本，并参与技术声明验证、生命周期判断和访谈问题生成
- 公开网页只分析用户主动提供的公开 URL，不主动抓取非公开内容
- `OpenAI` 为可选增强：未配置时使用规则模板，配置后会增强技术演进与壁垒总结
- 专利脉络、技术演进、产品生命周期、核心团队公开线索、壁垒判定、访谈问题包、结构化报告已改为后端动态生成
- PDF 导出通过浏览器打印流实现，Word 导出为前端生成的 `.doc`
- 历史分析与多标的对比保存在浏览器本地

## Mock 演示

首页提供 `一键验证 Mock 全流程` 按钮。

- 不调用外部 API
- 自动载入 4 个完整案例：2 个海外公司、2 个国内公司
- 自动填充历史分析与对比台，方便直接演示横向对比
- 可验证结果页、对比分析、报告导出等完整链路

## 开源注意事项

- 不要提交 `.env`
- 仓库已经忽略 `node_modules/`、`dist/`、Python 缓存和日志文件
- 如需公开演示，优先使用首页 Mock 按钮，避免暴露真实 API 配额和敏感数据
