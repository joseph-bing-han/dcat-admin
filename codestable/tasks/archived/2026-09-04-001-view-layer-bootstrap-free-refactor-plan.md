---
doc_type: task-list
task: view-layer-bootstrap-free-refactor-plan
goal: 分析当前 View 现代化进度，并制定完整的 Bootstrap-free View 重构计划，在保留旧版 Dcat Admin 布局、行为和无痛升级兼容性的同时，建立经浏览器测试的证据门槛
status: archived
workflow: design
owner_skill: cs
created: 2026-09-04
updated: 2026-09-04
archived: 2026-09-04
related_docs:
  - codestable/epics/001-o-view-layer-modernization/spec.md
  - codestable/epics/001-o-view-layer-modernization/compatibility-contract.md
  - codestable/epics/001-o-view-layer-modernization/ui-ux-spec.md
  - resources/modern
  - resources/views
  - scripts/dcat-admin-demo-browser.mjs
---

# 分析当前 View 现代化进度并制定完整的 Bootstrap-free View 重构计划

## 1. 任务目标

分析当前 View 现代化进度，并制定完整的 Bootstrap-free View 重构计划，在保留旧版 Dcat Admin 布局、行为和无痛升级兼容性的同时，建立经浏览器测试的证据门槛

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 规范旧版 CodeStable 任务记录并恢复权威的现代化进度
- [x] 审查当前 View 架构、Bootstrap/AdminLTE/jQuery 耦合、Modern renderer 覆盖情况和浏览器测试证据
- [x] 定义目标 Bootstrap-free 架构、旧版兼容边界、迁移不变量和验证模型
- [x] 更新 View 现代化 Epic 规划文档，补充分阶段实施方案和浏览器回归计划
- [x] 根据当前代码、兼容风险和验收门槛交叉核对修订后的计划

## 4. CodeStable 文档索引

- `codestable/epics/001-o-view-layer-modernization/spec.md`
- `codestable/epics/001-o-view-layer-modernization/compatibility-contract.md`
- `codestable/epics/001-o-view-layer-modernization/ui-ux-spec.md`
- `resources/modern`
- `resources/views`
- `scripts/dcat-admin-demo-browser.mjs`

## 5. 执行步骤

### 1. 规范旧版 CodeStable 任务记录并恢复权威的现代化进度

- 状态：done

### 2. 审查当前 View 架构、Bootstrap/AdminLTE/jQuery 耦合、Modern renderer 覆盖情况和浏览器测试证据

- 状态：done

### 3. 定义目标 Bootstrap-free 架构、旧版兼容边界、迁移不变量和验证模型

- 状态：done

### 4. 更新 View 现代化 Epic 规划文档，补充分阶段实施方案和浏览器回归计划

- 状态：done

### 5. 根据当前代码、兼容风险和验收门槛交叉核对修订后的计划

- 状态：done

## 6. 中断恢复提示

从第一个未完成步骤继续，并先以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

## 7. 完成与归档记录

2026-09-04：Task 已创建。

2026-09-04：已将两份旧版带日期的 active Task 文档规范为符合当前结构的 active Task，并恢复其现代化历史。Task 扫描结果为零项问题；旧计划、M0 记录、M1-M10 实施完成情况、PHP 8.1 矩阵证据和 Laravel 10 Demo 浏览器证据均作为权威历史保留。

2026-09-04：已完成现状审查。当前 Modern renderer 通过了最新 Laravel 10 Demo 全量检查（81 个页面、15 项响应式检查、18 项交互，无阻断性失败），但仍属于过渡性的 DOM adapter 架构：只有 Layout Header/Menu 以及 Grid/Form/Show/Tree 采用结构化 React 视图，许多能力仍是渐进式 class 增强或通过 LegacyNodesIsland 重新挂载节点。Bootstrap/AdminLTE/jQuery 仍是核心运行时依赖，涉及 47 个 Blade 文件、46 个 src 文件和 266 个资源文件；基础资源仍会加载 AdminLTE、vendors、jquery-pjax、bootstrap-validator 等旧插件。14 项实现能力仍处于实验阶段，尚未验证。发现规格漂移：当前紫色、圆角和阴影令牌与冻结的 UI 规格不符，近期 Grid 自动卡片化导致的溢出行为也违反冻结的表格保留契约。

2026-09-04：已定义 Bootstrap-free Gen2 目标：采用 payload-first 服务端 ViewModel、Dcat UI 原生 renderer；核心运行时不依赖 Bootstrap/AdminLTE，并最终移除核心 jQuery 依赖；兼容岛按能力隔离；为冻结的旧版界面提供 Dcat 自有 CSS/API facade；并以临时且独立管控的 classic safety net 兜底。浏览器验证按能力晋升门槛执行，要求提供五种视口、升级夹具、无网络依赖、无障碍、生命周期和支持矩阵证据。

2026-09-04：已按新目标更新进行中的现代化 Epic，加入当前进度证据、native/compat/classic 目标架构、Bootstrap-free 终态定义，以及覆盖所有可见能力的 B0-B12 分阶段计划和浏览器门槛。兼容性契约升级到 3.0.0，纳入 Dcat 自有 CSS/API facade、可选 jQuery 兼容层、classic safety net 隔离，以及核心不依赖 Bootstrap/AdminLTE 的要求。Gen1 实现能力矩阵已标记为需要按 contract-v3 重新验证，避免旧证据在新契约下错误晋升能力。

2026-09-04：交叉核对完成。当前源码仍明确会在 /admin/auth/users 加载 AdminLTE CSS/JS、bootstrap-validator 和 jquery-pjax；源码中仍存在紫色/12px 圆角令牌漂移及 Grid 自动堆叠实现，因此计划没有虚称这些问题已经解决。Gen1 bridge 的最新浏览器证据仍通过（81 个页面 / 15 项响应式检查 / 18 项交互），但 contract 3.0.0 的变化使旧版 v2 能力指纹不能再用于晋升。implementation-capability-matrix.json 已明确标记为需重新验证，且 impactGraphUsable=false。git diff --check 和 JSON 解析通过；CodeStable Task 扫描未发现问题。

2026-09-04：任务已标记为 completed，等待归档。

2026-09-04：任务已原子移动到 archived，active 正本已移除。源快照 SHA-256：8265f3ecde27095522857e3314606ebe177fea9ca18213220a0382f1766611e2
