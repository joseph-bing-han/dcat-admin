---
doc_type: epic
title: View 层现代化
status: closed
created: 2026-08-29
updated: 2026-09-28
owners:
  - View layer
related_specs:
  - codestable/spec/view-layer/index.md
  - codestable/epics/001-x-view-layer-modernization/ui-ux-spec.md
  - codestable/epics/001-x-view-layer-modernization/compatibility-contract.md
---

# View 层现代化

## 目标结果

在不改变 Dcat Admin 既有页面信息架构、操作习惯、PHP Controller/API、HTTP 与表单协议的前提下，**完整采用新版 View 层并从运行时移除旧版整页 View renderer、Bootstrap 与 AdminLTE**。内建页面使用 React、React Aria、Dcat UI 设计令牌、Vite 和 TypeScript 渲染。新版 native View 是唯一页面 renderer；新版 compat islands 仅承载暂不能 native 化的 Controller 输出、自定义 Blade/Renderable 内容和扩展节点，不提供旧版整页 UI 回退。

“完成现代化”现在有一个更严格的含义：**页面看起来是新版不算完成；只要默认页面仍加载 Bootstrap/AdminLTE，或新版组件仍必须解析 Bootstrap DOM、依赖 Bootstrap JS 行为才能工作，该能力就仍处于过渡态。**

本 Epic 是变化中的权威规格。当前已经成立的事实仍以 [`../../spec/view-layer/index.md`](../../spec/view-layer/index.md) 为准；具体视觉约束以 [`ui-ux-spec.md`](ui-ux-spec.md) 为准；兼容边界以 [`compatibility-contract.md`](compatibility-contract.md) 为准。

2026-09-26 用户进一步明确：全面采用新版 View，不要求兼容旧版整页 View；官方 Demo 的原有 Controller 与页面覆盖必须完整保留，作为新版 View 的集成测试面。旧版 Blade 模板可以作为新版 compat island 的内容输入，但不得选择或回退到旧版整页 renderer。后续实现以完整 Demo 页面 crawl 和 native/compat 运行证据为准。

2026-09-26 用户收窄验证范围：只验证当前实际使用的 PHP/Laravel 版本，不需要其它版本组合。当前验收消费者为官方 Demo 的 PHP 8.1.34 / Laravel 10.50.3；旧多版本矩阵保留为历史参考，不再阻断本 Task 或发布就绪判断，也不得据此宣称其它组合通过。Composer 声明的支持范围与最低语法约束保持不变。

同日用户要求删除 `.github`，不需要 GitHub Actions/stale 自动化。项目使用本地验证脚本；旧 CI 安装门禁及 `codestable/ci` 的 workflow 草案已取消，不自动恢复这些配置。

## 不可变原则

1. 保持布局心智模型：顶部导航、侧栏、标题与面包屑、主内容和页脚的区域、层级、方向与主要动作顺序不变。
2. 保持服务端契约：现有 PHP 构建 API、Blade 覆盖、路由、请求参数、表单载荷和响应语义不得因新版渲染器而改变。
3. 单一新版 View：所有页面都由新版 renderer 接管；native 不适用时只进入新版 compat island。不得保留旧版整页 renderer、旧 UI 选择开关或 classic 回退。
4. 渐进迁移：采用 Laravel/Blade 服务端契约、版本化 ViewModel/payload 与 React islands，不实施一次性 SPA 重写，不要求应用升级 PHP 或 Laravel。
5. Bootstrap-free 核心：native 页面不得加载 Bootstrap CSS/JS、AdminLTE CSS/JS 或依赖 Bootstrap 插件语义；兼容能力必须由 Dcat 自己的 CSS/API shim 或隔离的兼容模块承担。
6. 兼容名称不等于兼容实现：旧资源 alias、稳定 DOM anchor、常用 class 和 `window.Dcat` API 可以保留名称，但其底层实现允许替换为新的 Dcat 兼容实现，前提是有浏览器契约证据。
7. 证据驱动：每个可见 View 能力都必须有与风险相称的自动化证据；已有浏览器 fixture、语义/键盘检查和历史 Demo 见证继续作为证据来源。
8. 小批闭环：一次 Goal 只执行一个可独立验证的批次；完成后更新 Task、能力矩阵和 Epic。除非用户明确授权，不因批次完成自动 commit、push 或部署。

## 目标架构

```text
Laravel route/controller
        |
        v
Existing PHP builders / Blade overrides / extension contracts
        |
        +--------------------+----------------------+
        |                    |                      |
        v                    v                      v
 Native ViewModel       Compat descriptor      Raw custom slot
        |                    |                      |
        +---------- versioned payload -------------+
                             |
                             v
                   Dcat View Runtime / PJAX
                    |                  |
                    v                  v
              Dcat UI React       Compat islands
                    |                  |
                    +---------+--------+
                              v
                  Vite core + compat assets

Bootstrap/AdminLTE are not dependencies of the native core path.
```

- Blade 继续拥有文档骨架、稳定插槽、服务端错误兜底和任意自定义内容的边界，但内建页面语义由明确 ViewModel/payload 产生，而不是让 React 反向解析 Bootstrap HTML。
- native 页面只挂载到专用根节点，不清空或接管整个 `#app`；现有稳定 anchor、Section 和 override 优先级继续有效。
- 每个内建 View family 提供显式、版本化、可测试的 payload adapter。**DOM parsing / `LegacyNodesIsland` 只允许作为迁移桥，不是最终架构。**
- `window.DcatReact` 继续承载 native 注册、挂载、卸载和能力查询；`window.Dcat` 的稳定生命周期 API 由新的 Dcat runtime 兼容实现保持。
- native runtime 使用原生浏览器 API/React 管理 PJAX 导航、动作、焦点、浮层和清理。jQuery 只允许在声明了 compat 依赖的 island 中按需加载，不能再成为默认 shell 前置依赖。
- Vite 构建至少区分 `core` 与 `compat` 入口。core 产物不能依赖 Bootstrap/AdminLTE/jQuery；compat 入口按页面能力按需加载，不能自动污染全局页面。
- 旧资源 alias 和已发布固定路径在迁移窗口内继续存在，但可以指向 Dcat 自己的兼容 facade。最终核心包中不得残留 Bootstrap/AdminLTE 源码或编译产物。

## 渲染选择与失败策略

2026-09-26 用户决策：全面使用新版 View，不保留旧版整页 UI、renderer 切换开关或 classic fallback。新版的 native 与 compat 是同一新版 renderer 的两种内容呈现路径，不是新旧 View 并行。

1. **native**：内建 ViewModel + Dcat UI；不加载 Bootstrap/AdminLTE/jQuery，是唯一默认模式。
2. **compat**：仍由新版 shell/runtime 接管页面；把原 Controller 返回的自定义 Blade/Renderable/扩展节点放入隔离 island，并按需加载 Dcat 自有 CSS/API 与必要插件。compat 不是旧版整页 View，也不保证任意旧模板的 Bootstrap/AdminLTE 外观。

决策顺序：native capability 通过 → native；否则 → compat island。`admin.modern.enabled`、family/capability/route allowlist、`__dcat_legacy` 与 `bootstrap_free_fallback` 均不再提供 renderer 选择。未知能力不得静默进入 native。manifest 缺失或 native mount 失败时由新版 compat/runtime 显示可恢复状态；禁止导航、重载或回退到旧版整页 UI，也不得重放写请求。

## 范围

### 包含

- 应用外壳、导航、内容框架和全部现有布局配置。
- Grid、Form、Show、Tree、Widgets、Dashboard、Login 和系统状态页面。
- Untitled UI 开源 React 组件的受控引入和项目级设计令牌。
- 资源构建与解析、ViewModel/payload、React bridge、native PJAX 生命周期和新版 compat island。
- 自定义 Blade、Renderable、Section、资源注入、扩展和第三方插件的兼容处理。
- 视觉、行为、无障碍、性能、浏览器和发布验证体系。
- Bootstrap/AdminLTE class、JS plugin API、固定资源路径和 Dcat 历史前端 API 的兼容 census、替代实现与迁移诊断。

### 不包含

- 将 Laravel 管理端改造成客户端路由 SPA。
- 改变 PHP 构建 API、业务路由、权限模型、数据库结构或关键数据。
- 强迫业务扩展立即迁移到 React；旧扩展允许通过 compat island 继续工作。
- 未核验许可证的 Untitled UI PRO 资产、组件或源代码。
- 与 View 迁移无关的后端重构和产品功能改版。
- 承诺兼容任意项目私下依赖的旧版 View、Bootstrap/AdminLTE 内部细节或未登记私有选择器；这类内容须由应用迁移或显式放入新版 compat island，不能要求包继续提供旧版整页 renderer。

## 当前实现进度（2026-09-28）

B0-B9 的新版 UI、payload/runtime 和浏览器实现已完成；B11 已从 core 移除旧 renderer、Bootstrap/AdminLTE 源码与产物、旧 renderer gates。Review 修复后的新版 Manager 是唯一页面 renderer，native 与 compat 仅表示页面内容路径。

B10 的当前实现保留官方 Demo 的原始 Controller 页面集合，并恢复被改动的 Dcat API 行为；历史证据覆盖 81 个页面、33 个菜单入口。B12 的当前本地安装/资源发布、自动化无障碍、重排、PHP focused tests 和 modern:verify 证据已记录；其它 PHP/Laravel 组合按用户决定排除。

本轮已处理用户反馈的三个界面阻断项：`Menu::add()` 的结构化节点进入新版菜单且二/三级菜单可展开；Dashboard Metrics 内容恢复一致内边距；下拉浮层保留内容宽度、横向留白与正确对齐。相应回归断言和交互证据已保留，不能只以页面 HTTP 200 或静态 DOM 存在判断通过。

2026-09-26 后续 UI 修复已完成：共享下拉增加折线箭头与展开方向、Metrics/分页选中高亮及对勾、局部深色配色；Metrics 横向留白修正，固定日期副标题保持静态说明语义，并按后续用户要求保留圆角边框及内边距；分页浮层遵守右对齐向上展开并避开滚动条。32 项相关测试和五视口实测通过，资源已更新本地 Demo。详见 [下拉修复记录](issues/002-x-ff-修复下拉箭头与留白.md)；不扩大此前 PHP/Laravel 验证范围，不改变 Epic 发布状态。

2026-09-28 Review 修复后的 `npm run modern:verify`、PHP focused tests、静态检查、构建和 artifact budget 已通过。发布候选、verified commit 和 package 发布仍由 M11 状态及单独授权管理，不属于 Epic 关闭动作本身。

### 已有实现与历史验证记录

以下条目是各批次完成时的历史记录，用于保留证据来源和当时的状态；当前实现、验证范围和关闭结论以本节前文及文末关闭结论为准。

B0-B9 的早期实现、视觉调整和过去的 classic/upgrade 探索留作历史记录，不再定义当前 renderer 选择或 B10 验收条件。

本轮视觉验收依据：改动前 modern 页面已保持稳定区域关系，但 shell 与原生控件的视觉效果未达到 `ui-ux-spec.md` 1.0.0 的现代样式目标。真实 Demo 曾测得顶部导航约 116px、Logo 图像约 225px、页面标题 28px，均偏离冻结尺寸；应修正 shell 的视觉尺度和基础 Form 的原生字段、状态与动作，保持侧栏宽度、标签列宽、字段顺序、动作位置与提交协议；随后检查 Grid、Show、Tree 等页面族的同类表面。每个切片须用五个规定视口的截图及关键几何/交互证据验证，不能仅以布局回归通过宣称视觉达标。Untitled UI 仍只作为组件参考，令牌和稳定布局契约不变。

2026-09-24 阶段结果：Modern shell、基础 Form 与 Grid 的视觉切片已落地；顶栏约 53–54px、Logo 图像 35px、标题 20/28、侧栏仍为 260px，Grid 移动端主要动作及展开按钮达到 44px 触控高度。五视口的布局/交互 Chrome 门禁、74 项前端测试及 `modern:verify` 通过，core JS gzip 102363/102400 bytes。视觉验收仍未全部关闭：Show/Tree/Widgets 等页面族尚未完成同等视觉复核；自定义 Label 背景使用 CSS 变量时的前景对比、少数临界中灰的 4.5:1 对比度仍需解决。B10 的 PHP alias/HEAD 与混合控件兼容通过，但硬编码旧静态 URL 仍返回旧 bundle；须在 B11 建立独立 classic 回退后物理发布 Dcat facade，不能将 B10-B12 标为已完成。

2026-09-24 补充：Show、Tree、Widget/Dashboard 已完成本地视觉复核。Show 原生值不再保留旧式框，Tree 操作层级和分隔式行收敛，Dashboard 标题改为 20px 并使用常规 surface；Tree 在 390px 的全部可用操作目标实测不小于 44px。`modern:verify` 通过 74 项 Vitest 及构建/预算门禁（JS 102321/102400、CSS 11295 gzip），Show/Tree/B8 专项与完整 Chrome 浏览器门禁通过（25 组布局/视口、6 页面族）。仍需补齐这些页面族的五视口定点视觉断言；Grid 自定义 Label 对比度及 B10-B12 的发布条件仍未关闭。

2026-09-24 视觉批次最终复核：Show/Tree/Widget 五视口截图及溢出、触控尺寸、Dashboard 20px 标题与旧背景缺席已进入完整浏览器门禁；768px Tree 改为分行操作布局。独立审查指出的 Tree 刷新查询串、Dashboard 外壳、Widget 自定义属性/零内边距/列宽、DataCard 状态色、Dropdown 首项 `map()` 富文本兼容已修复并由专项浏览器门禁验证；Card `col-md-6` 实测宽度比 0.492。`modern:verify` 74 项 Vitest 与构建预算通过（JS 102348/102400、CSS 11349 gzip），完整 Chrome 浏览器门禁通过（25 组布局/视口、6 页面族）。B10-B12 尚未完成；Grid 自定义 Label 对比度及 Gen2 默认准入仍需独立收束。

2026-09-26 视觉补齐：旧 Widget Form 和自定义 Blade 的 Select2、上传、输入组现已共享 modern 外观，后载主题不会覆盖导航的 8px 圆角；标签对比度更新保留显式前景配置。`modern:verify` 74 项测试与原预算通过（JS 102397、CSS 12064 gzip）；完整 Chrome 聚合 25 组布局/视口、6 页面族通过。真实 Demo 81 页面、30 组响应式检查、18 交互通过，含旧表单两页及焦点/输入组/供应商控件断言。证据在 `artifacts/bootstrap-free/ui-20260926/` 和 `artifacts/dcat-admin-demo/ui-20260926/`。当前会话无独立子代理工具，本批未取得新的独立 Review；B10-B12 继续推进。

本轮最终补验：复选/单选不再重复显示旧主题装饰，modern 标签可点击并保持键盘操作；双列表动作不再空白。冻结最新产物后 Demo 81 页面、30 响应式、19 交互全部通过（4 项非阻塞外部告警），证据 `artifacts/dcat-admin-demo/ui-20260926-final/demo-browser-report.json`。最终 74 Vitest、PHP/Blade/typecheck、10 PHP 测试/57 assertions、完整 Chrome 与受影响 Grid 五视口复测均通过；JS 102381/102400、CSS 12236 gzip bytes。该条目记录的是当时尚未执行收尾的状态，后续 Review 修复、状态同步和 Epic 关闭见本文件的当前结论。

## 质量目标

| 质量维度 | 硬性目标 |
|---|---|
| 功能适合性 | 迁移能力矩阵中所有既有操作、状态、错误和边界均有等价证据 |
| 兼容性 | 支持 PHP `>=8.0`、Laravel 8-10；保持 Dcat Controller/API、HTTP 与表单协议，不承诺旧版整页 View |
| 可靠性 | native/compat 失败不产生空白页、重复写入或不可恢复状态；运维可回滚 package version，无页面级旧 renderer 回退 |
| 易用性 | 区域位置、导航方向、动作顺序和常用流程不变；新版不得增加核心任务步骤 |
| 可访问性 | WCAG 2.2 AA；键盘、焦点、语义、对比度、缩放和 reduced motion 通过门禁 |
| 性能效率 | 每批建立并守住体积和运行时预算；无重复挂载、监听器泄漏或 PJAX 后持续增长 |
| 可维护性 | TypeScript 严格模式、版本化 payload、统一令牌、组件目录和契约测试 |
| 信息安全性 | 不扩大 HTML/脚本注入面；保持 CSRF、转义、上传及权限边界 |
| 可移植性 | 新构建产物可由包发布流程分发，消费者运行时无需 Node.js |

任何具体数值预算必须在 M0 以测量基线为依据确定并写入对应 Issue；不得为得到好看的数字而省略必要兼容能力。

## 第一代过渡里程碑 M0-M11

M0-M11 记录 2026-08-29 起已经建立的第一代 Modern bridge。它们的价值是冻结兼容面、建立 Vite/React/bridge/fallback 和验证基础，并证明新旧能力可以并行运行；**它们不再等价于本 Epic 的最终完成定义**。第二代 Bootstrap-free 计划见 B0-B12。

### M0 基线、许可证与兼容矩阵

建立页面/组件/扩展能力矩阵，冻结关键 DOM 与网络契约，记录五个视口的布局几何和截图，补齐浏览器与无障碍基线；核验 Untitled UI 来源、版本、许可证和可分发范围；定义前端浏览器支持矩阵、性能预算和 payload 版本策略；冻结 Laravel 8、9、10 与其允许 PHP 8.x 版本的 CI 组合矩阵，每个 Laravel 主版本至少执行安装、资源解析、legacy 冒烟和共享契约测试。

关闭条件：矩阵覆盖全部 View 家族及公开扩展面；基线可重复生成；未覆盖能力明确标记为 legacy，而不是隐含遗漏。

### M1 构建链与 CSS 隔离穿刺

引入 Vite、React、TypeScript 的最小独立入口，完成 manifest 解析、开发/生产构建、发布文件映射、缓存策略和 CSP/nonce 适配；证明 modern 样式不会改变 legacy 页面。

关闭条件：Laravel 8、9、10 在各自允许的 PHP 8.x 组合中均能装载生产资源；构建入口采用单一、已冻结且无歧义的 IIFE 或 ESM 拓扑；没有 Node.js 的消费者可运行发布包；CSS 泄漏测试通过；删除 modern 入口即可完整回退。

### M2 Bridge、生命周期与双渲染

定义版本化 payload、`window.DcatReact`、组件注册协议、PJAX mount/unmount、错误边界、遥测错误码、页面级 feature flag 和 legacy fallback。

关闭条件：完整导航和连续 PJAX 导航无重复根、重复监听或内存持续增长；未知能力和人为破坏资源时均回到 legacy；写请求不被重放。

### M3 基础组件、反馈与浮层

交付按钮、图标按钮、链接、输入、选择、复选/单选、开关、徽标、头像、表格基元、分页、Tab、下拉菜单、Popover、Tooltip、Modal、Drawer、Toast、Alert、空态、加载态和错误态。

关闭条件：所有状态使用统一令牌；浮层具备焦点管理、边界碰撞、Esc/外部点击规则和 PJAX 清理；组件不得依赖业务页面私有 CSS。

### M4 应用外壳与布局配置

基于 M3 的受控组件迁移顶部导航、侧栏、菜单、标题、描述、面包屑、消息、主内容框架和页脚；覆盖 sidebar 展开/折叠、水平菜单、sticky/floating/hidden 顶栏、主题侧栏及 full-page。

关闭条件：稳定区域、顺序、尺寸基线和键盘导航符合规范；五个视口无重叠、溢出和内容遮挡；所有布局 profile 和配置可单独回退；不得在外壳中创建 M3 之外的临时私有组件。

### M5 Grid 只读路径

迁移标题、列、格式化内容、排序指示、分页、空态、加载态、详情展开及响应式容器，保留自定义 displayer 的 legacy 路径。

关闭条件：同一查询产生等价数据和链接；列宽、扫描顺序与批量选择位置不变；未知 displayer 自动回退。

### M6 Grid 交互、筛选与动作

迁移搜索、筛选、列选择、导出、行选择、批量动作、行/表格动作、快捷创建、树表和确认流程。

关闭条件：查询参数、HTTP 方法、确认语义、权限失败、成功/错误反馈与 legacy 等价；批量操作在刷新和 PJAX 后不残留状态。

### M7 Form 基础字段与验证

迁移表单布局、文本/数字/日期/选择等基础字段、帮助文本、必填与禁用状态、服务端验证错误、Tab 及提交反馈。

关闭条件：字段 `name/id`、载荷、CSRF、旧值恢复、错误定位和键盘顺序不变；重复提交受到保护；未知字段回退。

### M8 Form 高级能力

迁移上传、富文本/代码编辑器、级联选择、嵌套关系、数组字段、异步字段和第三方字段桥接。

关闭条件：文件协议、进度、取消、失败恢复、嵌套键名和编辑器清理通过契约测试；无法隔离的插件在 legacy island 中运行。

### M9 其余页面族

迁移 Show、Tree、Widgets、Dashboard、Login、异常页、权限页和系统状态页。

关闭条件：每个页面族拥有功能矩阵、五视口证据和 legacy 回退；登录与异常路径在 modern 资源不可用时仍可访问。

### M10 扩展与自定义内容兼容

建立扩展能力声明、React 组件注册、legacy HTML island、自定义 Blade/Renderable、Section、Navbar/Menu 插槽及资源依赖的兼容方案和作者文档。

关闭条件：代表性官方/第三方扩展通过矩阵；未声明扩展仍按 legacy 工作；旧资源别名和 Dcat 生命周期没有语义变化。

### M11 默认候选与发布加固

完成完整矩阵、升级路径、灰度、可观测性、回退手册、发布包、变更说明和长期支持策略。modern 只有在门禁全部满足后才能成为候选默认值。

关闭条件：两种渲染器可在支持矩阵中持续测试；回退演练无需重新构建或数据库变更；默认值变更需单独 Issue、发布决策和明确证据，不由本 Epic 自动授权。

## 第二代 Bootstrap-free 全量重构计划 B0-B12

> **计划沿革：** 下方第一代 M0-M11 仅作为历史设计背景；其中双 renderer、classic fallback、旧模板等价和按 route/family 开关的承诺均由本节 B0-B12 及 `compatibility-contract.md` v4.0.0 取代，不再作为当前验收条件。

### B0 重新冻结全 View / Bootstrap 兼容 census

目标：把“所有内容”变成机器可检查的覆盖集合，而不是靠 Demo 页面数量推断。

交付：

- 建立 View coverage registry，至少枚举 139 个 Blade 模板、68 个 Form field、28 个 Grid displayer、36 个 Grid filter、31 个 Widget 类，以及 Layout/Show/Tree/System/Extension 页面族。
- 对每项记录：服务端入口、legacy HTML/JS 依赖、Bootstrap class、Bootstrap JS plugin、jQuery plugin、稳定选择器、资源 alias、native 状态、compat 状态、fixture route、浏览器测试 id。
- 扫描 `resources/assets`、`src`、`resources/views` 和发布产物，冻结 Bootstrap/AdminLTE/jQuery 依赖图；区分 Dcat 自己使用、第三方插件使用、项目自定义可能使用三类。
- 建立旧项目 upgrade fixtures：标准 2.2.x 项目、Blade override 项目、自定义 Grid/Form displayer 项目、Navbar/Section 注入项目、代表性 Extension 项目。
- 纠正规格漂移：UI token、Grid 响应式规则、modern default/fallback 状态必须与权威规范一致后，后续截图才可作为新基线。

浏览器门禁：coverage registry 中每个 `visible` 能力必须有至少一个真实 Chrome fixture；无 fixture 的能力只能保持 `unsupported/experimental`。

### B1 Dcat UI 基础层与设计令牌收口

目标：建立不依赖 Bootstrap class 的真正 UI framework 基础层。

交付：

- 将颜色、字号、间距、圆角、边框、shadow、z-index、motion、focus ring 收敛为唯一 token source，生成 CSS variables 与 TypeScript token 类型。
- 按 UI 规范 1.1.0 保持品牌色 `#586CB1`、hover `#485A98`，控件圆角 8px、独立内容表面 12px；静态块不以 shadow 作为主要层级手段。
- 完成 Button、IconButton、Link、Input、Textarea、Select、Checkbox、Radio、Switch、Badge、Avatar、Card/Panel、Table primitives、Tabs、Menu、Tooltip、Popover、Modal、Drawer、Alert、Toast、Empty/Loading/Error 等原生组件。
- Untitled UI 只使用已核验 MIT 来源；若组件为 Dcat 独立实现，就在文档中明确称为 Dcat UI，不把视觉相似误写成上游代码来源。
- 组件 CSS 只使用 `dcat-ui-*`/token，不要求 `.btn/.card/.form-control/.row/.col-*` 等 Bootstrap class 才能工作。

浏览器门禁：组件状态矩阵、键盘、focus-visible、Esc/outside click、portal、reduced motion、200% zoom、axe serious/critical=0；五个规定 viewport 均执行。

### B2 Server ViewModel / payload-first 协议

目标：结束“React 解析 legacy DOM 推断语义”的核心路径。

交付：

- 为 Layout、Grid、Form、Show、Tree、Widget、System 建立显式 ViewModel builder 与版本化 payload schema。
- 内建 PHP builders 同时能够产生现有 HTML 结果和新 ViewModel；不修改用户已有 PHP 调用签名。
- payload 明确携带 component type、字段/列/action id、状态、权限可见性、资源需求、compat requirement、slot descriptor。
- 自定义 Blade/Renderable 不尝试任意 HTML-to-React 转换，只以明确 slot/compat descriptor 进入 island。
- `LegacyNodesIsland` 保留为迁移工具，但每迁移一个内建能力，都必须把该能力从 DOM parser 转为 payload-first，并在矩阵记录剩余 parser consumer。

浏览器门禁：同一 fixture 在 classic/compat/native 下比较 HTTP、URL、表单载荷、Grid 查询参数、动作结果和关键可见内容；payload major 不兼容必须安全降级。

### B3 Bootstrap-free Shell、Layout 与导航

目标：最先让每个页面的应用外壳不再加载 AdminLTE/Bootstrap。

交付：

- 用 CSS Grid/Flex 与 Dcat UI 重写 vertical、collapsed、horizontal、full-page、sticky/floating/hidden navbar 等布局 profile。
- 保持 260px 展开侧栏、稳定 anchor、Section、Navbar/Menu 插槽、PJAX container id 和动作顺序。
- sidebar/menu/navbar/footer 的行为改由 native runtime 管理，不依赖 AdminLTE JS。
- 旧 `.main-sidebar/.header-navbar/.content-wrapper/.content-body#app/.main-footer` 等 frozen stable anchor 名称继续存在，但视觉/布局由 Dcat CSS 实现。
- 建立 shell 级 `bootstrap-free` network gate：native shell 首屏不得请求 `adminlte.*`、Bootstrap CSS/JS、旧 `vendors.min.*` 中的 Bootstrap runtime。

浏览器门禁：所有 layout profile × 5 viewports；菜单展开/折叠、键盘导航、PJAX、back/forward、full-page、长菜单、长 breadcrumb、200% zoom、RTL 如项目仍支持。

### B4 Grid native read path

目标：Grid 的结构、列与只读表现完全由 ViewModel + Dcat UI 生成。

交付：

- column header、cell、sorting indicator、pagination、empty/loading、expand row、labels/images/badges/link 等内建 displayer 原生化。
- 保持 column order、stable selectors、链接、排序参数和分页协议。
- 响应式默认仍保持数据表语义。desktop/tablet 的错误容器 sizing 必须修正，而不是靠内部滚动条或自动 card 化掩盖；窄屏若需要列优先级/替代视图，必须是 capability 明确声明并有 UI/兼容规格批准。
- 自定义 displayer 在未 native 化前进入 cell-level compat island，而不是整页加载 Bootstrap。

浏览器门禁：每个内建 displayer fixture；长文本、宽列、空数据、多页、排序、expand、固定列/复杂 header；5 viewport 无非预期页面/容器 scrollbar，action/dropdown 不被裁剪。

### B5 Grid native interactions、filters 与 actions

目标：去掉 Grid 对 jQuery/Bootstrap 行为插件的核心依赖。

交付：

- quick search、filters、column selector、row selector、batch action、row action、export、quick create、inline edit、tree grid 原生化。
- 2026-09-26 列选择器 UI 修复已验证：每个复选项独占一行，All 下方分隔，长列表纵向滚动；155px 菜单在窄屏无横向溢出，勾选与全选查询行为保持。见 [修复记录](issues/004-x-ff-列选择器纵向排列.md)。
- Modal/Popover/Dropdown/confirm 使用 Dcat UI overlay，不调用 Bootstrap `.modal/.popover/.dropdown/.collapse`。
- 原有 `data-action`、HTTP method、query string、selection 参数和权限失败语义保持。
- 28 displayer、36 filter 与 Grid actions 全部在 registry 取得 native 或 compat 结论，不留“页面通过但某个未展示功能未测试”的空档。

浏览器门禁：每种 action/filter/displayer 至少一条真实交互；批量选择跨 PJAX/刷新清理；删除/导出/权限失败/网络失败/重复点击都验证不会重复写入。

### B6 Form native basic fields、layout 与 validation

目标：基础 Form 不再需要 Bootstrap form markup 或 bootstrap-validator。

交付：

- text/textarea/number/email/url/password/hidden/display、select/radio/checkbox/switch、date/time 基础字段原生化。
- Form row/column/block/tab/layout 由 Dcat layout primitives 生成；保留 `name/id`、label/help/error、required/disabled/read-only、CSRF、method spoofing。
- 用 native validation presentation 替换 bootstrap-validator，服务端验证仍是最终事实来源。
- 提交、保存后动作、Back/Reset、loading、重复提交保护保持历史语义。

浏览器门禁：68 Form field registry 中所有 basic 类；create/edit/error/old input/required/disabled/tab error focus；键盘顺序和 200% zoom。

### B7 Form advanced fields 与第三方插件替代

目标：逐项清除 Bootstrap 命名插件和必须依赖全局 jQuery 的高级字段。

交付：

- upload/webuploader、Select2/cascade、tree、hasMany/hasManyTable/hasManyTab、keyValue/list、markdown/TinyMCE/editor、color/date-range/number-input 等逐项决定：native rewrite、vendor adapter 或 compat island。
- `bootstrap-datetimepicker`、`bootstrap-duallistbox`、`bootstrap-colorpicker`、`bootstrap-number-input` 等不得继续作为 Bootstrap 运行时依赖；保留旧 alias 时改为新 adapter/facade 并冻结等价 API。
- 第三方插件若必须 jQuery，可只在对应 compat island 加载 jQuery；离开页面/PJAX 前销毁实例。
- 上传与编辑器必须保留同一请求协议、文件进度/取消/错误恢复和字段 name。

浏览器门禁：每个 advanced field 至少一条 create/edit/validation/cleanup 路径；连续 PJAX 进入离开检查 instance/listener/DOM 泄漏。

### B8 Show、Tree、Widgets、Dashboard、Login 与 System 原生化

目标：完成其余内建 View family，消除“只加 class 的 Modern enhancement”。

交付：

- Show panels/fields/actions、Tree reorder/save/tools、Widget/Card/Box/DataCard、Dashboard blocks、Login、Alert/Exception/System page 全部用 Dcat UI 原生组件。
- Login 与异常页在 core JS 失败时仍有最小可用服务端 fallback；但 fallback CSS 不依赖 Bootstrap。
- Tree/nestable、dialog widgets 等 jQuery 行为逐项原生化或限定 compat。

浏览器门禁：页面族 fixture + Demo 实际入口；登录成功/失败/remember/logout，异常 trace 展开，Tree 保存失败/成功，Widget dropdown/modal 等全部真实操作。

### B9 Native Dcat runtime 与 jQuery 隔离

目标：让 core 页面不仅 Bootstrap-free，也不再把 jQuery 当成默认生命周期引擎。

交付：

- 重写 `Dcat.ready/init/wait/boot` 的稳定表面、PJAX/导航、Ajax、DataActions、Loading、Menu、Footer 等核心生命周期为 native implementation。
- `window.Dcat` 名称和稳定方法继续存在；内部不要求 `$`。
- jQuery 移入 `compat` chunk，只在 capability/alias 明确要求时加载；native 页面断言 `window.jQuery` 不属于必需前置条件。
- 对历史脚本依赖的 `pjax:*` / `dcat:*` 事件提供事件桥；顺序和幂等性有浏览器契约。

浏览器门禁：完整 PJAX navigation stress、back/forward、并发、abort、重复 mount、listener/observer/timer leak、无 jQuery core 页验证。

### B10 官方 Demo Controller 与新版 View 全量覆盖

目标：保留官方 Demo 原始 Controller 和页面集，以新版 View 验证既有 PHP 输出、Renderable、自定义 Blade、插件/API 与各页面族，不再测试旧版整页 View 回退。

任务迁移：此前实现 Task [`2026-09-26-001-view-layer-bootstrap-free-refactor-implementation`](../../tasks/archived/2026-09-26-001-view-layer-bootstrap-free-refactor-implementation.md) 因用户取消旧版整页兼容目标而归档为 cancelled。后续执行账本 [`2026-09-26-002-modern-view-single-renderer-demo-coverage`](../../tasks/archived/2026-09-26-002-modern-view-single-renderer-demo-coverage.md) 已于 2026-09-26 按维护者决定完成并归档。

收尾边界：维护者接受该 Task 按当时证据归档，不代表剩余门禁已经通过。2026-09-26 用户随后删除所有人工验收要求；当前环境代表性 legacy regression 与自动化语义 DOM 顺序、键盘焦点和 200% 重排已经通过。该阶段曾记录验证提交 `8cf28129003b876a87497b55c078cdcb8f56f5f6`，但当前 capability matrix 和 M11 已按最终证据边界保持 `experimental` / `not-release-candidate`；该条目记录的是当时 Epic 尚未收尾的状态。

交付：

- 以官方 Demo 的 Controller 文件清单、活动菜单和 GET 页面为冻结覆盖基线；缺失 Controller 或页面路由数缩减时浏览器门禁失败。
- 每个可达 Demo 页面都必须由新版 Modern runtime 接管；覆盖标准布局、full-page、Grid、Form、Show、Tree、Dashboard、Widgets、扩展、预览和自定义内容。
- 恢复 Demo 原有 Controller 行为所需的 Dcat PHP API（包括 icon-only Dropdown 按钮），允许为当前 Laravel 版本保留必要的仓库适配，但不删减测试页面能力。
- 未 native 化的原 Controller 自定义 HTML/Blade/Renderable 只通过新版 compat island 承载；兼容面不得扩展为旧版整页 UI、Bootstrap/AdminLTE renderer 或回退入口。
- Dcat 自有 CSS/API facade 和已登记资源别名只服务新版页面内的 island/扩展契约，不承担选择旧 View 或 classic fallback 的责任。

浏览器门禁：完整 crawl 至少覆盖基线中的 81 个 Demo 页面与全部活动菜单路由；每页 Modern renderer 均 active、无本地请求/脚本错误。Layer Dropdown、Blade/Renderable 插槽和扩展内容有明确交互断言。Controller inventory 与页面数缩减为阻断 finding。

2026-09-26 B10 compat diagnostics 定位：`compat-diagnostics.js` 现按 island 报告并去重未知 class/API；Manager 默认 `custom-slot`、重复/缺失/非法 descriptor ID 获得唯一稳定的 `compat-region#N`，inline script 使用不可由安全 ID 占用的 `inline-script#source`。重复 inspect 在当前 PJAX 页面内去重；`before-replace` 清理页面状态，兼容 runtime 直接订阅 jQuery namespaced `pjax:end`，覆盖缓存恢复时不触发 `loaded` 的路径。字段值、HTML 和完整脚本 source 不进入诊断事件、console 或结果；非枚举 dispose 可幂等解绑监听器并清理状态。Focused Vitest 10/10、`modern:typecheck`、`modern:compat:build`（compat JS 126.48 KB raw / 44.20 KB gzip）与 `git diff --check` 通过；独立 review 无阻断。此 slice 不改变 B10/B11/B12 整体状态。

2026-09-26 B10 diagnostics browser gate review correction：升级浏览器测试现在按 DOM 中目标 `custom-slot` island 与控件数量识别 live 夹具；仅旧路由的 0/0 进入隔离当前 dist，部分夹具或已部署夹具的 runtime 漏报均失败。首次诊断要求每个区域的未知 class/API 各有恰好一条 event 与 console warning，重复扫描增量为 0。独立 Chromium 加载当前 dist 通过两个区域定位、首次事件/警告、重复扫描和隐私断言；聚焦 Vitest 10/10、compat/fallback 构建、PHP lint、Node syntax、`git diff --check` 通过。8302 `--upgrade-only` 退出 1：live DOM 检出 2 个目标 island 和 2 个目标控件，但 consumer runtime 返回的 class diagnostics location 为 `undefined`，未产生两个独立区域位置；测试现会保留 live 路径并正确失败，不再用隔离结果掩盖。该 consumer mismatch 仍未修复，真实发布与支持矩阵门禁不成立，B10/B11/B12 状态不变。

### B11 移除旧 renderer 与 AdminLTE/Bootstrap 资产

目标：核心包真正达到零 Bootstrap/AdminLTE 源码与运行时依赖。

当前目标（2026-09-26）：移除旧版整页 renderer、renderer 选择开关和 Bootstrap/AdminLTE 源码/产物。新版 compat islands 与 Dcat-owned facade 只服务新版页面的自定义内容，不构成旧 View 回退。静态和浏览器门禁确保 core 不再含 Bootstrap/AdminLTE 实现或旧 renderer 路径。

准入边界（已作废，见下方 2026-09-26 物理退场记录）：`bootstrap_free_fallback` 默认关闭，当前经典回退保持有效。独立候选入口先验证无 React/缺 manifest 的 Blade 运行；其跨页面完整文档导航尚不等价于冻结 PJAX 契约，不能据此替换默认回退。固定路径 facade 先生成到 `artifacts/bootstrap-free/legacy-facades`，原 core 静态文件保留到候选兼容和发布矩阵全部验证后再移除；不能把备份和生成器视为 B10/B11 完成。

2026-09-26 准备结果：独立包的 13 个 bundle 与原字节 SHA-256 一致，真实 Laravel 10 容器验证 provider 的独立资源解析及发布注册；3 JS/10 CSS facade 候选生成与重复核对通过。候选 Blade 回退在三种 upgrade fixture 下验证弹窗/焦点、Tabs、输入值和可关闭错误反馈，Bootstrap/AdminLTE 网络请求为 0。新增 PHP 回退测试含默认关闭、缺 manifest、可选包隔离和查询串保持，与现有 Asset 测试合计 10 项/57 assertions 通过。候选不进入默认运行时，B10/B11 继续 in-progress。

2026-09-26 增补：classic 包加入 `@pjax` 所需的 `jquery.pjax.js` 与 `jquery.pjax.min.js`，两者逐字节对应恢复态 core dist 并纳入 package manifest SHA-256 校验；source 保留第三方 MIT 声明。`ClassicAssetsProviderTest` 通过真实 `vendor:publish --tag=dcat-admin-classic-assets` 命令发布完整 manifest，并核对每个 public 文件的 SHA-256 与 `@pjax` classic namespace 解析；此测试运行于当前 Laravel 9.52.22 runtime，不作为支持矩阵证据。当时跨 renderer Back 门禁在 8302 未通过；该判定已由同日复核推翻（见下条），B10/B11 仍维持 in-progress，core 旧资源保留。

2026-09-26 门禁复核：当前工作树 `npm run modern:verify` 全通过（coverage 303/296、15 个 Vitest 文件/94 tests、构建、artifact 与 Chrome harness self-test；JS gzip 98258/102400、CSS 12236）。构建后 legacy facade 检查发现 `dcat-app.js` 候选已过期；重新生成后 3 个 JS/10 个 CSS 固定路径候选通过 `--check`。Visible Chrome 对隔离 8302 consumer 的追踪确认 classic PJAX 先写入 source state、push target，再在 renderer mismatch 时以完整文档 replace 导航；该 consumer 的 native bundle 404 后回退为 `__dcat_legacy=1`、renderer=2，故无法观察真实 native document 的 Back/popstate。8302 是 Laravel 9 vendor 与 Laravel 10 skeleton 混合环境，只能作为故障定位 smoke，不构成发布或支持矩阵证据；B10/B11/B12 状态不变。

2026-09-26 后续发布复核：按消费者包契约在隔离 8302 本地 consumer 执行 `php artisan vendor:publish --tag=dcat-admin-assets --force` 后，public modern 与 modern-compat manifest/JS 哈希均与当前 `resources/dist` 一致。可见 Chrome page 5 重新加载 classic fixture 并实际点击 native 目标：PJAX 请求后执行完整 document GET，目标 marker/runtime=1；Back 恢复 renderer=2 的 classic 文档，Forward 返回 renderer=1/native，history length 保持 16；page 5 已恢复原始 classic URL。先前 bundle 404 属于旧 public 发布产物，不是当前 renderer history 缺陷。8302 仍是混合 Laravel 环境，只作 B10 smoke，不构成支持矩阵或发布矩阵证据。

同批修复 `Asset` 的固定路径 facade 映射遗漏：registry 的 3 个 JS 与 10 个 CSS 路径现在全部映射到预期 modern facade；AssetModernizationTest 覆盖 registry 驱动路径、modern 映射、legacy 原路径保留，以及 bootstrap-free compat 下 5 个 dcat-app 路径被抑制。独立 Reviewer 确认 modern、compat、legacy 分流符合当前 Manager/Asset 契约，无新 finding。验证：AssetModernizationTest 7/7（58 assertions）、ModernRendererTest 9/49、ClassicAssetsProviderTest 10/98、`modern:php-static`、legacy facade `--check`、PHP lint 与 `git diff --check` 通过。正式 core facade 构建接入与旧资源物理退场仍待既有发布顺序决策；B10/B11/B12 不据此整体关闭。

2026-09-26 门禁复核修正：上述 Back 失败与该 consumer 的 native bundle 404 均来自发布资源陈旧——`public/vendor/dcat-admin` 的 manifest 指向 `dcat-modern-BPckmAfa.js`，而当前构建产物为 `dcat-modern-R9rneIci.js`，native 目标 JS 404 后 Manager 回退 `__dcat_legacy=1`。按包契约在该 consumer 执行 `php artisan vendor:publish --tag=dcat-admin-assets --force` 刷新发布资源后，`DCAT_BROWSER_BASE_URL=http://127.0.0.1:8302 DCAT_ADMIN_PREFIX=/admin node scripts/view-modernization-browser.mjs --upgrade-only` 退出码 0（3 fixtures、15 viewports）；`artifacts/bootstrap-free/upgrade-browser.json` 记录 `classicToNativeBack` 恢复 `standard?force_classic=1&classic_probe=1` 且 renderer=2、jQuery/PJAX/pjaxHandlerActive 为真，`classicToNativeForward` 回到 renderer=1，classic 同 renderer 与 classic→compat 的 Back 保持同 document 与 history 长度。另以隔离静态夹具（真实 dist jQuery 与 jquery.pjax.min，classic→native 完整文档导航，history 8→9）独立确认同一结论。8302 仍是 Laravel 10 skeleton 与仓库 Laravel 9 vendor 的混合 consumer，仍不构成发布或支持矩阵证据；B10 行为门禁通过，B11 物理退场与 B12 版本矩阵仍待完成。

2026-09-26 键盘与无障碍抽查：隔离 native basic Form fixture 的 accessibility tree 为所有字段提供标签，Username 同时暴露必填说明。Tab 从 Biography 继续可到达 Number、Email、URL、Password、Telephone、Select、已选 Yes radio、两个 checkbox、Switch、原生 Date/Time、只读字段、Save & View、Save & Edit、Back、Reset 和页脚链接；常规字段及动作按钮显示 `:focus-visible`，Date/Time 内部原生停靠点有部分状态未显示该伪类，未触发任何动作。200% 浏览器缩放仍未验证：DevTools 页面级 Control++ 没有改变 1432x896 viewport、DPR 1 或 zoom 1；当前工具不能控制 Chrome 浏览器级缩放，也未以缩窄 viewport 代替。Page 5 已恢复原 classic fixture URL。此记录是局部检查，不代表 B12 的五视口或人工缩放验收完成。

2026-09-26 B10/B11 staging 发布门禁：新增 `tests/Feature/LegacyFacadePublishTest.php`，把 core `resources/dist` 复制到临时 package，以真实 legacy facade generator 生成 registry 的 3 JS/10 CSS 路径，再由隔离 Laravel App 调用 core `dcat-admin-assets` `vendor:publish` 注册并发布。13 条固定 public path 均存在、带 Dcat facade marker 且 SHA-256 与 staging 候选一致；modern `Manifest::ENTRY` 与 compat `resources/modern/compat.js` 均要求 `isEntry=true` 和有效 JS，两个 manifest 的直接 file/css 引用闭包及 fallback JS/CSS 在 staging/public 均通过哈希核对。临时 public 中注入过期 manifest 并删除 native hashed entry JS 后，第二次 `vendor:publish --force` 恢复 manifest 与缺失文件。staging、core dist 与 classic package 全目录 hash 保持不变。Focused PHPUnit 1 test/195 assertions、PHP lint、`git diff --check` 通过，独立 review 及 assertion follow-up 无 finding。Dusk 副本通过 parent checkout root fallback 可定位 generator；完整 Dusk install flow 未运行，本地 ignored `laravel-tests/` 所有权无法确认且未触碰。此结果仅验证当前 Laravel runtime 的候选 staging 发布/修复链，不表示正式 core 产物集成、consumer 浏览器发布或 Laravel 支持矩阵已完成；B10/B11/B12 继续进行中。

2026-09-26 B10 facade 浏览器门禁：新增 `scripts/view-modernization-legacy-facade-browser.mjs`，从随机临时 dist 生成候选 facade，经 loopback server 按 registry 的 13 个唯一旧固定 URL 提供资源。Chrome 对每条 URL 检查 HTTP 200、JS/CSS MIME 与 Dcat marker；实际载入后检查 row/column compatibility CSS、Modal 焦点/Escape/焦点返回、Tab 切换与键盘导航、Dropdown 键盘行为，并拒绝 page error、失败请求、HTTP 4xx/5xx、外部请求或未登记 script/stylesheet。`node --check` 与脚本门禁均通过，报告 13 URL 与所有交互通过；随机 staging 清理完成。独立 review 及针对响应状态、资源白名单和清理逻辑的 follow-up 无阻断发现。此结果仅验证生成候选在本地 Chromium 中的加载与行为，不覆盖非 script/stylesheet 旧插件资源、正式 core 接入、真实 consumer 发布或支持矩阵；B10/B11/B12 继续进行中。

2026-09-26 B11 classic 发布目标边界：ClassicAssetsServiceProvider 的 package 资源描述与 boot 发布注册共用 public-root prefix 校验；非法相对路径、与 core vendor/dcat-admin 相同/父/子路径重叠、大小写别名及 public 外部 symlink 不注册发布组。路径 overlap 比较规范化分隔符并折叠大小写，避免 core 目标目录尚不存在时大小写不敏感平台仍发生覆盖。新增测试以真实临时 Artisan app 验证默认与自定义独立 prefix 的发布及每个 manifest 文件 SHA-256，并验证 traversal/core overlap/外部 symlink 负例、core/outside sentinel 不变及“core 目录不存在时 vendor/DCAT-ADMIN 仍拒绝”。README 补充 assets_path 规则。Focused PHPUnit 12 tests/157 assertions、PHP lint、diff-check 通过；独立 review 和大小写修复 follow-up 无阻断发现。所有发布目的地均在随机临时 public，未操作真实 consumer。此证据不改变 core/classic 正式发布状态或 Laravel 支持矩阵；B10/B11/B12 继续进行中。

2026-09-26 B11 Composer core archive hygiene：实际 Composer archive 检查发现 `.gitattributes` 未排除本地 ignored/generated 目录，首轮临时 ZIP 为 291 MB，并含本机 `.env` 文件路径；未读取文件内容、未外传且已删除。新增 `export-ignore` 覆盖本地依赖、Demo/测试/artifacts、IDE/cache、root lock 与 Mix 的实际开发输出 `resources/pre-dist`，保留运行时 `resources/dist`。复打包 18 MB，`packages/classic`、根 vendor、node_modules、Demo、artifacts、laravel-tests、env 文件与 pre-dist 均为 0，`resources/dist` 832 个文件仍在；独立 review 确认规则正确。当前 archive 仍含 89 个 AdminLTE source 文件和 146 个 Bootstrap 相关路径，B11 物理退场尚未完成。

交付：

- 从 core build 删除 AdminLTE SCSS/JS、Bootstrap SCSS/JS 和其编译产物；删除 Laravel Mix legacy build 或缩减为不含 Bootstrap 的兼容构建后最终统一到 Vite。
- core package 静态扫描禁止 `resources/assets/adminlte`、Bootstrap source tree、编译 Bootstrap/AdminLTE bundle；发布产物扫描同样禁止。
- `@adminlte` 等历史 alias 在兼容周期内映射到 Dcat facade，并标记 deprecated；不得重新引入 Bootstrap 代码。
- 对 B0 无法覆盖的第三方私有 Bootstrap 依赖，不再提供 classic 包：未覆盖用法进入新版 compat island，并由迁移诊断指出需要改写的私有接口。
- 记录并删除 core 内全部 classic 回退入口（配置开关、强制回退查询参数、classic 资产包与 namespace 映射），确保不存在回到旧版 UI 的运行时路径。

浏览器门禁：每个 native/compat fixture 的 Network 断言 Bootstrap/AdminLTE 请求为 0；core JS/CSS dependency graph 为 0；hardcoded legacy path 返回 facade 且功能通过。

2026-09-26 B11 无 classic 物理退场完成（代码与产物范围）：删除 `packages/classic`（594 个文件）与 `classicAssets()`/旧资源 namespace 映射，取消 `admin.modern.enabled`、family/capability/route allowlist、`__dcat_legacy` 与 `bootstrap_free_fallback`；`Manager` 现在只有 native(manifest 可用) 与 compat(manifest 缺失) 两种渲染器，`pageConfigHtml()` 不再产出 renderer=2。删除 `resources/assets/adminlte`（AdminLTE JS/SCSS）与 `resources/assets/sass`（Bootstrap SCSS 树）、`dcat-app` 入口、20 个无用 legacy JS 与旧主题 SCSS，只保留 `compat.js` 引用的 4 个 extension 模块和 `dcat/extra` 所需的 SCSS 变量闭包（改写为 Dcat 自有变量，编译输出与旧 `upload.css` 逐值一致）；`webpack.mix.js` 缩减为不含 Bootstrap 的复制/extra 构建；删除只服务旧主题编译的 `admin:minify`（`MinifyCommand`，含 `resources/assets/dcat/sass/theme/_primary.scss` 与 Mix 主题变量改写）与 `classic:assets:*`/`scripts/classic-assets.js`。旧固定路径的 3 JS/10 CSS 继续由 `scripts/view-modernization-legacy-assets.js` 生成 Dcat facade（随 modern/compat bundle 重新生成，`--check` 通过）。新增 `scripts/view-modernization-bootstrap-absence.js` 静态门禁：14 条已删路径不存在、4 个源码根无已删标识符、13 条固定 URL 带 facade 标记、`resources/dist` 无 Bootstrap/AdminLTE banner，并接入 `modern:verify`。契约与阈值同步：`bridge-v1.json`/`m2-runtime-contract.json` 去掉 `defaultQueryKey`/`queryKeyConfig`（fallback 语义改为「缺 manifest 使用 compat 外壳，运行时不导航到另一渲染器」），`compat-contract.json` 的 `modes` 收敛为 native/compat-css/compat-jquery 并把 `classic-required` 移入 `deprecatedModes`（诊断为 `CLASSIC_REQUIRED`，未知 mode 报 `UNSUPPORTED_COMPAT_MODE`），`baseline.json` assets 1077→821，`performance-budget.json` legacy base 1,401,272/353,467 → 1,008,896/260,757 gzip 且 `relativeToLegacyBaseGzipMax` 由 0.406 调整为 0.56，`dependency-census.json` 信号 1004→870，`legacy-contracts.json` 的 Dcat 生命周期来源指向 `resources/modern/runtime.ts`。文档同步：`README.md`、`docs/modern-view-layer.md`、`docs/modern-view-migration.md`、`docs/modern-view-release-checklist.md` 改为「单一渲染器 + 包版本回退 + 重发资源」并删除 `ADMIN_MODERN_ENABLED`/`__dcat_legacy`/allowlist 说明。夹具与脚本对齐：`ViewUpgradeController` 用缺失 manifest 表达 compat，`ViewBaselineController` 的 4 个历史 rollback 路由保留已删除的配置键作为「不再生效」探针，升级浏览器门的 classic 段整体重写为 native↔compat 完整文档与 Back/Forward 断言，`view-modernization-browser.mjs` 的 `verifyRollback` 改为 `verifyRendererLockdown`。验证：`npm run modern:verify` 全通过（coverage 303/296/870、Grid/Form registry、43 tokens、baseline 140 Blade/821 assets、PHP/Blade static、bootstrap-absence、typecheck、Vitest 16 files/104 tests、core+compat production build、artifact JS 97,893 gzip / CSS 12,236 gzip、Chrome harness self-test）；PHPUnit `ModernRendererTest` 6/34、`AssetModernizationTest` 7/58、`LegacyFacadePublishTest` 1/194 通过；legacy facade `--check`、PHP lint、`node --check` 与 `git diff --check` 通过；`npm run dev`（Mix）实际重编译 `dcat/extra` 证明 Bootstrap-free SCSS 闭包可构建。未验证：升级浏览器门禁与 facade 浏览器门禁尚未在真实 consumer 重新运行（重写后的脚本未执行），真实发布、Laravel 8/9/10 支持矩阵、200% 缩放与人工无障碍复核仍未完成，因此 B10/B12 与 GA 条件不变。

2026-09-26 B11 退场回归修复：删除 `Manager::capabilityEnabled()` 时遗漏了 40 处调用点（`src/` 与 `resources/views/` 中的 `modern()->capabilityEnabled('...')`，含 `resources/views/dashboard/title.blade.php`），导致 dashboard 与 login 页面抛 `Call to undefined method Dcat\Admin\Modern\Manager::capabilityEnabled()`。该方法属能力级渲染门禁而非旧渲染器开关，且 `scripts/view-modernization-php-static.js` 的 `structuralReactBoundaries`/`inPlaceReactBoundaries` 门禁本就要求这些 view 保留调用，因此按「能力级门禁取消」语义恢复为恒返回 `true`、不再读取任何配置；`payload()`/`island()` 保持只依赖 `available()`。新增两条回归断言：写入已删除的 capabilities/families 配置后 `capabilityEnabled()` 仍为 true；以及扫描 `src/` 与 `resources/views/` 中全部 `modern()->X()` 调用点并要求 `Manager` 上存在对应方法，用于拦截「删方法留调用」这类回归。验证：`ModernRendererTest` 8/8（46 assertions）、`AssetModernizationTest` 7/58、`LegacyFacadePublishTest` 1/194、`npm run modern:verify` 全通过、legacy facade `--check`、baseline 与 `git diff --check` 通过。真实 8302 consumer 对照：临时移除该方法时 login 页面 500（Playwright 定位不到 username 输入框），恢复并执行 `vendor:publish --tag=dcat-admin-assets --force` 后登录并访问 dashboard 返回 200、无服务端错误文本、无 page error、无 >=500 响应；此前观测到的 `CreateDcat is not defined` 属发布资源过期，重发后消失。本次修复不改变 B10/B12 与 GA 结论。

### B12 支持矩阵、Demo 全量浏览器回归与发布就绪

目标：为唯一新版 View 提供完整跨环境证据后再宣告发布就绪；页面不再有 renderer 默认值切换。

交付：

- 仅当前 PHP/Laravel 消费者的真实安装、publish、config/view/route cache、无 Node production boot；其它版本组合不属于本轮验收。
- official Demo 全 route crawl 与 Controller inventory；coverage registry 全 fixture browser suite；代表扩展 suite。
- 五个规定 viewports：390×844、768×1024、1024×768、1366×768、1440×900；不得只测当前 3 个 viewport。
- axe、语义 DOM 顺序、键盘、focus、reduced motion 与 200% 重排全部由浏览器门禁自动判定并记录仿真方法。
- screenshot/geometry 基线只在稳定 fixture 上比较；设计变更必须关联 UI 规范条款，不能用“批量更新截图”消除差异。
- 运行 bootstrap-absence gate、jQuery-core-absence gate、memory/listener leak、bundle budget、CSP/nonce、asset cache、rollback rehearsal。
- 所有 capability 由 `experimental` 晋升到 `verified`；只有所有已知消费者覆盖后才可 `default-candidate`。

2026-09-26 候选工作树完整复验：`npm run modern:verify` 通过 coverage（303 inventory/296 visible/1004 dependency signals）、Grid/Form registries、43 tokens、baseline（140 Blade/1077 assets）、PHP/Blade static、typecheck、Vitest（16 files/104 tests）、core+compat production build、third-party notices、artifact（JS 98,258 gzip bytes / CSS 12,236）与 Chrome harness self-test。此证据只覆盖当前候选工作树；8302 live diagnostics consumer gate 仍因位置缺失失败，且不代表真实发布、支持矩阵或 B12 GA 条件完成。

2026-09-26 本地 Composer 安全审计：`composer audit --locked --no-interaction` exit 1；本地 lock 的 Laravel Framework v9.52.22 命中 4 项 advisory：PKSA-m5cs-t1y6-qpcs（medium）、PKSA-3r5d-mb8f-1qw9（high）、PKSA-mdq4-51ck-6kdq/CVE-2026-48019、PKSA-8qx3-n5y5-vvnd/CVE-2025-27515。未修改 lock 或忽略公告；该本地 lock 不等于冻结 Laravel/PHP 矩阵安装证据，B12 仍未通过。

2026-09-26 当前环境续验：仅验证 PHP 8.1.34 / Laravel 10.50.3。`npm run modern:verify` 通过（303 inventory/296 visible/870 dependency signals、16 个 Vitest 文件/107 tests、产物 JS 98,059 gzip bytes / CSS 12,360）；Demo 资源 publish、package discovery、config/view/route cache、`composer check-platform-reqs --no-dev` 与 Demo PHPUnit 2/2 通过。官方 Demo crawl 为 81 页、49/49 Controller、33/33 活动菜单、30 响应式检查和 22 交互检查全通过；Modern browser contract 为 25 个五视口/页面配置捕获、6 个页面族通过。Dashboard/Form/Grid/Layer Lighthouse accessibility 均 100，Grid `td-has-header` 子审计通过且无违规节点。另在隔离消费者中以历史源码 tag `2.2.2-xebni` 演练 Composer 包回退、资源重发与缓存清理；81 条 Admin 路由、登录页和 AdminLTE CSS/JS 均返回 200，未运行数据库迁移或前端构建，临时 SQLite 文件与原 Demo 字节一致。该演练使用本地 path version alias，不证明存在可部署的 Laravel 10 兼容回退制品。代表性 Install/Section 6 项测试因 SQLite teardown 不兼容失败；项目 MySQL `.env.testing` 连接返回 SQLSTATE 1045，故当前环境 suite 未验证。环境无本地屏幕阅读器或浏览器窗口控制命令，Chrome DevTools MCP 仅支持页面操作，原生 UI 200% 缩放及人工屏幕阅读顺序仍未验证。其它 PHP/Laravel 组合和旧 Dusk 版本仅保留历史参考，不属于当前验收阻断。保持 capabilities 为 `experimental` 且 release status 为 `not-release-candidate`。

2026-09-26 Packagist 回退制品复验：将隔离的 Laravel 10.50.3 Demo 从 `joseph-bing-han/laravel-admin` `dev-next` 切换至公开的 `dcat/laravel-admin:2.2.3-beta`，Composer 锁定 source ref `f8ef27cc4d6a79dc346f89d0efb925d4e28ee763`；平台检查、package discovery、资源发布和 config/view/route cache 清理通过。旧包注册 121 条 Admin 路由，登录页与 AdminLTE CSS/JS 均 HTTP 200；没有运行迁移、数据库命令或前端构建，隔离 SQLite 文件与 Demo 源文件 SHA-256 均为 `3d0e5f0460fdee9faf7d0588062a55b91fecab6f777cd06a67581a0176198ca7`。因此回退制品门禁已通过，精确版本为 `2.2.3-beta`；`2.2.2-beta` 不支持 Laravel 10。无锁 Laravel 10.50.3 consumer 在根配置 `policy.advisories.block=false` 后通过 Composer 安装；该设置必须存在于 consumer 自身，因为 package 的 composer.json config 不会传递。`composer audit --locked` 仍以 exit 1 报告三项影响 Laravel Framework v10.50.3 的 advisory（PKSA-m5cs-t1y6-qpcs medium、PKSA-3r5d-mb8f-1qw9 high、PKSA-mdq4-51ck-6kdq/CVE-2026-48019）；按用户明确决定禁用 resolver blocking，但保留审计输出。原生浏览器 UI 200% 缩放、人工读屏与代表性 legacy 测试仍未闭合，capabilities 保持 `experimental`，release status 保持 `not-release-candidate`。

2026-09-26 本轮自动化验收：仅在 PHP 8.1.34 / Laravel 10.50.3 环境复验。`npm run modern:verify` 通过 16 个 Vitest 文件/107 项测试与构建产物门禁；隔离 SQLite 的代表性旧功能回归通过 6 tests/30 assertions。Modern Chrome 合同通过 25 个布局捕获、10 类页面 axe、6 类语义 DOM 顺序和真实 Tab 遍历，以及 6 页面族 × 5 来源视口的 30 个半宽 CSS 视口重排案例；该代理不等同原生浏览器 UI 缩放。官方 Demo 最终通过 81 页、49/49 Controller、33/33 活动菜单、30 组响应式和 27 项交互；296 条可见覆盖映射均有页面族见证，0 findings。Tree 局部滚动与 Widget 极窄宽修复、compat 表单可访问名称和 Select2 列表语义已纳入同一证据。人工验收不是当前门禁；该条目记录的是当时 Epic 尚未执行收尾的状态，当前状态见文末关闭结论。

发布就绪关闭条件：官方内建 View 与新版 compat path 在当前 PHP/Laravel 环境中 0 blocking failure；core 页面与 core package 均无 Bootstrap/AdminLTE 依赖；官方 Demo 的 Controller inventory、菜单入口和完整页面 crawl 全通过；package 版本回滚不需要数据库回滚或重放写请求。该阶段状态不自动授权发布，其它版本组合不构成阻断；当前 Epic 已按单独授权完成收尾。

## 每批执行模板

每个里程碑可以拆成若干可独立关闭的 Issue，但一次 Goal 只读取和执行当前批次：

1. 从 Epic 摘取一个具有单一兼容边界的 Issue，并明确输入、输出、非目标和回退点。
2. 只加载 Epic 的相关章节、当前 Issue、直接依赖契约和仍有效的上批摘要；不加载全部历史执行记录。
3. 先补契约或失败测试，再实现；涉及高风险集成时先做可删除的纵向穿刺。
4. 运行本批静态、单元、集成、**真实 Chrome 浏览器**、视觉和无障碍验证；任何可见 View 能力没有 browser fixture 就不能声明完成。共享契约变化时扩大到所有传递消费者。
5. 由独立 Reviewer 检查真实缺陷、回归、安全风险和测试缺口，修复后重跑受影响门禁。
6. 更新能力矩阵和 Epic 状态，按当前 Goal 的授权关闭对应 Issue并归档 Task。commit/push/deploy 只在用户明确授权时执行。

## 上下文过滤与证据复用

- 已关闭 Issue 的详细日志、截图和命令输出留在其正本或构建产物中；后续默认只读取结论、契约版本、提交和未消除风险。
- 已验证的稳定能力进入机器可读矩阵。后续只验证当前批次及其传递影响集，不按惯性重跑所有人工验收。
- 以下共享边界发生变化时，必须扩大回归范围：设计令牌、bridge API、payload schema、manifest 解析、PJAX 生命周期、compat descriptor、稳定 DOM 锚点、HTTP/表单协议和失败状态。
- 纯页面组件变化只回归该组件、使用它的页面族和相邻布局；不得把无关已关闭批次重新加入上下文。
- 每批摘要限制为：变更的契约、契约指纹、验证提交、验证证据位置、剩余风险、回退方式和下一批前置条件；不复制实现全文。
- 发现基线已失效时更新原矩阵和权威规格，不追加相互冲突的补丁文档。

## 验证门禁

每批至少包含与风险匹配的以下证据：

- PHP/Blade 契约测试：相同输入下的路由、请求、payload、关键 HTML 插槽和资源声明。
- TypeScript 静态检查、格式检查、组件单元测试和 bridge 生命周期测试。
- 当前 PHP/Laravel 环境的集成测试以及 production build/manifest 安装测试；C0、构建链或共享 PHP/Blade 契约变化扩大当前环境内的相关测试，不增加其它版本组合。
- 浏览器行为测试：完整加载、PJAX、前进后退、并发请求、错误、权限拒绝、重复导航、真实点击/输入/拖拽/上传/提交；只检查 HTTP 200 或 DOM 存在不算功能通过。
- 五个规定视口的几何断言与视觉差异；动态内容使用稳定 fixture 和明确容差。
- 自动无障碍扫描、语义 DOM 顺序、键盘、焦点与 200% 重排检查。
- native/compat island 对照、manifest/chunk 失败和可恢复状态演练；不得切回旧 renderer。
- 对共享运行时批次执行内存、监听器、网络请求和资源体积测量。
- Bootstrap-free 批次额外执行静态 dependency scan 与真实浏览器 Network gate：native/core 页面不得加载 Bootstrap/AdminLTE；B9 后 native/core 页面不得依赖 jQuery。
- coverage registry 门禁：本批迁移的每个 Blade/field/displayer/filter/widget/capability 必须映射到 browser test id；未映射项使该能力保持 experimental。

测试失败不得通过放宽全局阈值、删除 legacy 断言或批量更新截图掩盖。视觉基线变化必须在 Issue 中说明对应的规范条款。

## 提交、发布与回退

- 当前规划阶段只交付文档，不创建提交。后续每个批次也不因 Task/Issue 完成自动 commit；只有用户明确授权 Git 动作时才创建对应单主题提交。
- 不把 `node_modules/`、测试缓存、临时截图、密钥或本地环境文件纳入版本控制。
- 新资源采用内容哈希；迁移窗口内旧资源路径和 alias 保持可解析，但目标可以变为 Dcat compat facade。发布包必须包含运行所需的 production 产物和 manifest。
- renderer 不提供 feature flag、页面族/能力/路由 allowlist 或 request marker；Dcat compat 只选择 island 内容形态，不选择旧 renderer。
- 发布顺序（2026-09-26 用户决策）：新版 View 是唯一 renderer；旧版整页 renderer、切换开关与 Bootstrap/AdminLTE 实现不再属于发布产物。运维恢复通过 package 版本回滚，不在页面内降级。
- 始终不自动 push、不部署。具体 Goal 只能在用户授权范围内执行 Git 和发布动作。

## 开放决策

以下事项必须由对应里程碑用证据收束，不能由实现者临场发挥：

- B0（已决策）：新版 View 是唯一 renderer；能力在 native View 与新版 compat island 间分流，没有旧 renderer rollout policy。
- B1：Dcat UI 与 Untitled UI 的命名和来源边界；只能对真实采用的 MIT 源码/交互模型做准确 provenance 声明。
- B4：Grid 窄屏策略必须在“保持表格语义、列优先级、显式替代视图”中形成可验证契约；当前自动 card 化不能直接毕业为稳定事实。
- B7：每个高级字段是 native rewrite、vendor adapter 还是 compat island，按协议风险和维护成本逐项决定，不整类拍板。
- B10：官方 Demo 的原 Controller 输出如何分配到 native View 或新版 compat island，以完整页面 crawl 和 capability registry 的证据确定。
- B11（2026-09-26 已决策）：不提供 classic safety net；核心 Bootstrap-free 目标直接以删除旧 UI 入口、旧源码与旧产物完成，兼容责任由新版 compat island 承担。
- B12：native 成为默认值必须单独有 release evidence；Epic 本身不自动授权发布、push 或部署。

## Epic 完成定义

只有以下条件全部成立，本 Epic 才可请求关闭：

1. M0-M11 的第一代 bridge 历史已被 B0-B12 的最终事实完整吸收，不再存在相互矛盾的 token、响应式或旧 renderer fallback 契约。
2. B0-B12 的实现与本地自动化门禁完成，coverage registry 无未解释的内建 View 缺口；capability matrix 为每项能力记录 native/compat 归属、验证证据和当前 promotion 状态，不因 Epic 关闭自动把能力晋升为 `verified` 或发布候选。
3. Dcat core package 和 native/core browser network 均为 **Bootstrap/AdminLTE dependency = 0**；native core 不再以 jQuery 为前置条件。
4. 官方 Demo 的完整 Controller inventory、活动路由和既有页面覆盖证据已保留；代表扩展、PHP/Blade 契约、当前本地运行时和自动化无障碍/几何证据无 blocking console/page/network/a11y/geometry/function failure。其它版本组合不属于验收要求。
5. 旧版整页 renderer、classic safety net 与 Bootstrap/AdminLTE 资产均不在 core；新版 compat island 只承载被明确允许的 Controller/扩展内容，不承诺兼容任意旧 View。
6. UI/UE、兼容、payload、bridge、asset alias 和 migration 文档均有自动门禁与回退演练。
7. 已经成立的最终事实毕业到 Project Spec。

Epic 关闭属于单独授权动作；本 Epic 已于 2026-09-28 获授权关闭。

## 关闭结论（2026-09-28）

本 Epic 已按维护者授权关闭。稳定结论已毕业到 [`codestable/spec/index.md`](../../spec/index.md) 和 [`codestable/spec/view-layer/index.md`](../../spec/view-layer/index.md)：新版 View runtime 是唯一页面 renderer；native 与 Dcat-owned compat island 属于同一新版运行时；旧 Bootstrap/AdminLTE 整页 renderer、切换开关和 classic fallback 不再存在；PHP Controller/API、HTTP、表单、资源 alias 和扩展边界保持有效。

本次收尾删除了专用外部浏览器验收项及其状态记录；它不再属于 Epic、M11 或发布前置门禁。通用浏览器工具和既有历史证据仍可用于后续调查，但不构成当前 Epic 的必需任务。

当前本地实现证据包括 `npm run modern:verify`、113 项 Vitest、PHP focused tests、PHP/Blade 静态门禁、Bootstrap/AdminLTE absence、production build、artifact budget 和 CodeStable Task scan。M11 的 package release candidate、verified commit、发布和 push 不因 Epic 关闭自动授权。
