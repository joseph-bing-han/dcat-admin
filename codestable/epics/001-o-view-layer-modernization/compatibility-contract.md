---
doc_type: compatibility-contract
title: View 层现代化兼容契约
status: frozen
version: 4.0.0
created: 2026-08-29
updated: 2026-09-26
scope: native View, Dcat compat islands, PHP Controller and HTTP contracts; excludes the removed legacy page renderer
---

# View 层现代化兼容契约

## 契约目标

本契约从 `4.0.0` 起定义单一新版 View 的公开使用面。新版 native 与新版 compat islands 共用一个 renderer；不再保证旧版整页 Blade/View、Bootstrap/AdminLTE 外观或 classic fallback。每个批次必须记录所使用的契约版本或内容哈希。

兼容是保持既有 PHP Controller/API、HTTP/表单协议、关键布局和明确登记的稳定选择器；新版 native 暂不能承载的 Controller 输出可进入 Dcat-owned compat island。**不承诺旧版整页 View 的布局、DOM、Bootstrap/AdminLTE 样式或 private selector 等价，也不存在 classic safety net。**

兼容等级从服务端与网络协议延伸到新版 native/compat island 边界，依次为 C0-C5。任一相关等级未通过时，该能力不能标为 verified；页面仍由新版 runtime 接管。

## C0 PHP、Blade、支持环境与安装契约

- 支持项目声明的 PHP `>=8.0` 和 Laravel 8-10。PHP 运行时代码不得使用高于 PHP 8.0 最低版本的语法，除非另行提高最低版本。
- 安装或升级包不能要求生产服务器具备 Node.js。Node.js 只用于包开发与资源构建。
- 既有 Composer 服务注册、配置发布、视图 namespace、资源发布命令和缓存流程保持有效。
- 新资源路径、manifest 和配置键必须独立命名。迁移窗口内旧 alias 和固定发布路径必须继续可解析；它们允许映射到 Dcat 自己的 compat facade，但不能静默指回 Bootstrap/AdminLTE 作为终态实现。
- 新版 View 是唯一 renderer；不得新增 renderer 开关、路由 allowlist 或指向旧版 UI 的 query marker。能力可在新版 native 或新版 compat island 间选择。
- 不通过数据库直改保存 feature flag、兼容声明或关键设置；若未来需要持久化结构，必须使用迁移文件并另行授权。
- 核心包、构建图和默认页面 network 请求都不得包含 Bootstrap/AdminLTE runtime dependency。

验证：按用户 2026-09-26 的决定，只在当前实际使用的 PHP/Laravel 环境执行安装、配置缓存、资源解析、无 Node 生产启动、新版 native/compat 冒烟和共享契约测试，不安装或验证其它版本组合。C0、构建链或共享 PHP/Blade 契约变化时扩大当前环境内的相关测试；旧版本矩阵仅为历史参考。报告必须注明实际环境，不能将当前结果扩大为其它组合已验证。

### PHP 与 Blade API

以下现有调用方式、返回语义、扩展点和顺序属于稳定面：

- `Content` 的标题、描述、面包屑、行列布局、full-page、自定义 view 与内容追加顺序。
- `Grid` 的列、筛选、搜索、选择、分页、导出、快捷创建、树表、行/批量动作、自定义 displayer 和事件。
- `Form` 的字段注册、验证、布局、Tab、嵌套关系、上传、编辑器、异步提交、自定义 view 和回调。
- `Show`、`Tree`、Widgets、Renderable、Extension、Blade view 覆盖和视图数据。
- `Admin::css()`、`Admin::js()`、`Admin::headerJs()`、`Admin::script()`、`Admin::style()`、`Admin::html()`、`Admin::requireAssets()` 和 `Admin::view()` 的接受值、调用顺序与效果。
- `Admin::baseCss()`、`Admin::baseJs()`、`Admin::fonts()`、`Admin::asset()`、`Admin::pjax()`、`Admin::disablePjax()`、`Admin::resolveHtml()` 和 `Admin::jsVariables()` 的配置、返回语义与生命周期效果。
- Section 插入点、Navbar/Menu 自定义内容、语言、主题和多应用配置。

约束：

- 现有 PHP 调用不因 modern 启用而需要增加参数、实现接口或返回 JSON。
- payload 由适配层从已知对象显式生成，不改变对象的公开渲染结果。
- 自定义 Blade/Renderable 无能力声明时按 compat 处理；不得丢弃、转义两次或尝试不安全地转成 React。
- Controller 调用与 `Admin::view()` 输入保持可用；自定义 Blade/Renderable 输出可作为新版 compat island 内容。包内旧模板的输出 DOM、Bootstrap class 和任意 private override 视觉等价不属于稳定契约。
- 旧异常类型、验证错误和权限拒绝仍从相同服务端边界产生，不由客户端伪造业务结论。

验证：公共 API fixture、代表性扩展、Demo 原始 Controller、Blade/Renderable island、资源注入顺序和 native/compat 服务端输出契约测试。

## C1 HTTP、URL 与数据契约

以下网络使用面不得改变：

- 路由名称、URL、HTTP 方法、重定向目标、状态码和权限/认证语义。
- Grid 查询参数，包括分页、排序、筛选、搜索、导出、选择和动作参数。
- Form 字段 `name`、嵌套键、CSRF、method spoofing、文件 multipart 协议、验证载荷和旧值恢复。
- PJAX 请求标识、片段响应、浏览器历史、前进后退、标题更新和本页增量资源语义。
- JSON/API 响应已有字段、类型、错误含义和客户端可见消息。
- 下载、上传、导出、批量动作和异步字段请求的权限边界与幂等约束。

约束：

- React 状态只是 UI 状态，不得成为服务端业务状态的唯一副本。
- modern 不得新增隐式预取或重试写请求。网络错误后的重试必须由用户明确触发并具备重复提交保护。
- payload schema 使用独立版本号；未知 major 版本拒绝 native mount 并交给新版 compat/error surface 处理，minor 新字段必须向后可忽略。
- 服务端输出 JSON 必须使用结构化序列化和安全嵌入方式，禁止字符串拼接脚本；`</script>`、Unicode 分隔符和 HTML 特殊字符必须测试。

验证：请求快照、URL/历史测试、相同输入的新旧网络对照、失败/超时/重复点击和恶意字符串 fixture。

## C2 DOM、选择器与插槽契约

### 按布局 profile 保持的页面锚点

锚点不是所有页面的并集。M0 必须为以下 profile 分别冻结 DOM；modern 只保持当前 profile 原本存在的锚点，不能为追求统一而补造其他 profile 的区域。

| 布局 profile | 必须保持的锚点与关系 |
|---|---|
| 标准垂直导航 | `.main-menu-content`、`.main-sidebar`、`.header-navbar`、`.app-content.content`、`.content-wrapper` 及其配置生成的 PJAX id、`.content-body#app`、`.main-footer`、`.extra-html` |
| 水平导航 | `.main-menu-content`、`.main-horizontal-sidebar`、`.header-navbar.navbar-horizontal`、`.app-content.content`、`.content-wrapper` 及其配置生成的 PJAX id、`.content-body#app`、`.main-footer`、`.extra-html` |
| full-page | `.app-content.content`、`.wrapper` 及其配置生成的容器 id、该页面实际 yield 的 `app` 内容；不要求 sidebar、navbar 或 footer |
| PJAX 禁用 | 保持所选布局 profile 的完整页面锚点，但不得假定存在 PJAX 事件或固定 id `#pjax-container` |

上述锚点在适用 profile 内的存在、唯一性、嵌套用途和替换边界不得改变。`$pjaxContainerId` 是可配置契约，测试不得硬编码默认值。modern root 必须位于明确的子容器中，禁止清空或替换整个 `#app` 或 full-page 的 app 内容根。

### 事实兼容选择器

- `data-action`、`pjax-container`、表单 `name/id`、Grid 查询控件、选择框、分页和测试依赖的关键选择器先进入 M0 清单。
- 清单内选择器按 stable、bridge-only、legacy-internal 分类。stable 在新版 native 与新版 compat 间保持；bridge-only 通过 compat proxy 维持；未登记的 legacy-internal 不构成对旧版 View 的承诺。
- 不允许假定所有 Bootstrap/AdminLTE class 都是公共契约，也不允许在没有清单和扩展证据时批量删除。

### 插槽与任意内容

- 标题、描述、面包屑、消息、Section、Navbar/Menu、页脚和 `.extra-html` 的相对顺序及输出位置保持。
- 任意 HTML/Blade 插槽默认在 compat 管辖范围渲染。若嵌入 native 页面，应放在隔离的 compat island 中并保持声明的资源生命周期；compat island 不因历史 class 名自动获得完整 Bootstrap runtime。
- React key、内部组件 class 和自动生成 id 不是扩展 API；扩展只能依赖正式注册的 bridge、slot 和稳定选择器。

验证：DOM 契约快照、唯一性/嵌套断言、官方 Demo Controller 页面、代表扩展选择器、Dusk 既有路径和 modern root 边界测试。

## C3 资源、JavaScript 与生命周期契约

### 资源入口、全局运行时与 Bootstrap-free 约束

- 已登记的资源 alias 和历史固定发布路径可由 Dcat-owned facade/adapter 接管；此契约不保证旧页面资源原样运行，alias 不得加载 Bootstrap/AdminLTE renderer。
- `window.Dcat`、`Dcat.boot()`、`Dcat.ready()`、`Dcat.init()`、`Dcat.wait()` 及既有稳定事件语义必须保持。B9 后 native/core 的实现不得以 jQuery 为前置条件。
- jQuery 允许作为 compat 依赖按需加载，用于尚未重写的旧扩展/插件；它不能是 native shell、Grid/Form 核心路径的强制依赖。
- 对历史实际使用的 Bootstrap JS 表面（例如 modal/dropdown/tab/collapse/popover/tooltip/button）应由 Dcat compatibility API facade 提供行为等价层；facade 不加载或复制 Bootstrap JS。
- 对历史实际使用的 Bootstrap/AdminLTE CSS class，由 B0 census 冻结一个 Dcat compatibility CSS 子集；实现可以保留 class 名，但样式来自 Dcat token/layout，而不是 Bootstrap 源码。
- `Admin::headerJs` 位于其既有阶段；CSS、JS、HTML 和 template 的提取/注入顺序保持。compat 资源按能力延迟加载时，必须保证旧脚本依赖在执行前已经 ready。
- core package 不得包含 `resources/assets/adminlte`、Bootstrap source tree 或编译 Bootstrap/AdminLTE bundle；本契约不提供 classic 分发物。

### modern bridge

- 使用独立命名空间 `window.DcatReact`，其公开 API 必须版本化并具有 TypeScript 定义。
- bridge 至少负责 `register`、`canMount`、`mount`、`unmount`、错误隔离和能力查询；具体签名由 M2 契约测试冻结。
- 一个 root 同一时刻最多一个实例。重复 mount 必须幂等或先安全卸载，不能叠加事件和 DOM。
- PJAX 开始替换前卸载；新 DOM、manifest 资源和 legacy 初始化完成后的规定阶段再挂载。
- unmount 必须释放 document/window 监听器、observer、timer、AbortController、portal、focus trap 和第三方实例。
- native 组件不得破坏 `window.Dcat` 稳定方法或劫持全局 PJAX handler。compat facade 可以注册经过版本化的 jQuery plugin shim，但不得修改无关 jQuery prototype 行为。

### 构建与 CSS

- Vite 输出使用内容哈希、独立 manifest 和可预测入口。manifest 缺失、条目缺失或完整性失败时选择新版 compat shell/error surface，不得选择 legacy renderer。
- M1 必须在两种互斥拓扑中冻结一种：单入口 IIFE 时禁止 dynamic import/code splitting；ESM 入口时使用 `type="module"` 和 manifest 依赖图。非支持浏览器显示明确的不支持状态，不提供旧版 View 回退。
- 选择 ESM 时，dynamic import 的 chunk 基址、资源发布子目录、CDN/asset URL、模块加载失败和缓存失效必须有集成测试；选择 IIFE 时必须验证单包体积预算和按页面装载策略。
- native CSS 使用 Dcat token/root scope；禁止 Tailwind preflight、Bootstrap reset、元素级全局 reset 或通用 utility 泄漏到 root 外 DOM。
- core build 必须有静态 dependency gate 和发布产物 gate，拒绝 Bootstrap/AdminLTE 源码、bundle、import 和网络引用。B9 后增加 native/core jQuery dependency gate。
- z-index 使用统一层级表，并与现有 navbar/sidebar/PJAX 插件浮层对照，禁止组件自行写任意高值。

验证：资源顺序和 alias 测试、manifest 失败注入、连续 PJAX 导航、监听器/内存测量、CSP 场景、CSS 泄漏和 native/compat 混合内容测试。

## C4 布局、交互与用户经验契约

- 顶部导航、侧栏、页面标题/描述、面包屑、消息、主内容和页脚的位置、层级、方向不变。
- 展开侧栏保持 260px；折叠、水平菜单、sticky/floating/hidden 顶栏、浅色/深色/主色侧栏及 full-page 均保留。
- 菜单分组、项目顺序、当前项提示和入口不因视觉升级改变。
- Grid 列顺序、筛选入口、选择列、行/批量动作及分页的任务顺序保持；未经矩阵与 UI 规范批准不能将数据表自动改成卡片。为解决错误容器宽度/滚动条而进行的自动 card 化视为临时实现，不能作为稳定兼容结论。
- Form 字段、Tab、主要提交/返回动作、错误定位和焦点顺序保持。
- 同一用户任务的步骤数不得增加；危险动作确认强度不得降低。
- 所有 modern 页面遵守 [`ui-ux-spec.md`](ui-ux-spec.md)，包括五视口、WCAG 2.2 AA、键盘、焦点、对比度、200% 缩放和 reduced motion。

像素差异允许发生在字体抗锯齿、令牌化边距、边框、色彩和明确批准的组件细节；区域几何、内容可见性、动作位置和操作结果属于不可随意变化的语义布局。

验证：官方 Demo 的新版页面 crawl、几何断言、视觉差异、键盘流程、移动触控和用户关键路径测试；不要求保留旧 View 并排 renderer。

## C5 新版 native / compat island 与可观测性契约

页面始终由新版 View/runtime 接管；native 和 compat 只决定内容如何呈现，不代表 renderer 切换：

- renderer 不允许按全局、页面族、能力、路由或 request marker 切回旧版 UI；未知 native capability 不能静默挂载。
- 无法 native 化的字段、Controller 输出和扩展内容优先放入新版 compat island；未知/不安全内容显示新版可恢复错误，不加载旧版 renderer。
- 客户端错误边界只能隔离渲染故障；可恢复 compat island 时保留同一页面和已输入状态，不能重放已完成的写请求。
- manifest、chunk 或 bridge 失败时不得发起强制 legacy reload、写入 renderer query marker 或返回旧版整页 Blade。用户可以通过部署系统回滚 package version；这属于运维版本回滚，不是页面 renderer fallback。
- Login、权限拒绝和异常页也必须使用新版 runtime 可理解的页面结构；失败时显示可恢复状态，不依赖 Bootstrap 才能提供旧版页面。
- 日志记录 renderer、route/page family、payload version、bridge version、稳定错误码和 fallback 原因；禁止记录表单值、令牌或敏感 HTML。
- native/compat 使用、挂载失败、资源失败和 PJAX 生命周期异常应可聚合；遥测不可成为页面正常运行前置条件。
- compat 诊断记录稳定错误码和能力位置，不记录表单值、令牌、敏感 HTML 或 arbitrary script source。

验证：无 renderer 开关/旧 query marker、unknown native capability、compat island 命中、损坏 manifest、chunk 失败、React render error、PJAX 中断、离线和日志脱敏；所有失败路径不得加载 Bootstrap/AdminLTE 或旧版整页 View。

## 兼容能力声明

每个可 modern 渲染的页面 payload 必须携带或可推导：

- `schemaVersion`
- 页面族和组件类型
- 所需 bridge 能力
- 已知字段/displayer/widget 标识
- renderer candidate（native/compat island）与 component/page content scope；页面 renderer 始终为新版
- 所需 core/compat chunks、旧资源 alias 或 compat facade
- `compatRequirements`：css class surface、jQuery、plugin adapter、custom slot/override 等声明
- 自定义 Blade/Renderable/Section 存在性
- renderer 决策和可审计 fallback 原因

能力声明必须基于 allowlist。仅因对象可以 JSON 序列化，不代表它可以安全 modern 渲染。

## 兼容矩阵格式

M0 建立机器可读矩阵，每项至少包含：

| 字段 | 含义 |
|---|---|
| Capability ID | 稳定、不可复用的能力编号 |
| Page family | Layout/Grid/Form/Show/Tree/Widget/System/Extension |
| Legacy evidence | 当前实现与测试证据 |
| Stable contracts | 涉及的 C0-C5 条款 |
| Native status | unsupported/experimental/verified/default-candidate |
| Compat status | unsupported/experimental/verified |
| Renderer / content scope | native/compat 与 component/content island；不得选择旧 renderer |
| Verification | 自动测试、视口、人工验收和证据位置 |
| Browser fixtures | 覆盖该 capability 的真实浏览器 test id / route |
| Bootstrap dependency | none/Dcat compat facade；官方内建能力不得要求 Bootstrap/AdminLTE |
| Contract versions | token、payload、bridge、manifest 版本 |
| Contract fingerprints | UI/UE、兼容、payload、bridge 和 manifest 的内容哈希 |
| Depends on | 直接依赖的 Capability ID 与共享契约边 |
| Consumers | 使用该能力的页面、组件、扩展和测试集合 |
| Last impacted by | 最近改变该能力的 Issue/commit |
| Verified commit | 最近一次完整通过声明矩阵的提交 SHA |

`dependsOn` 与 `consumers` 共同形成机器可计算的有向影响图；共享契约指纹变化时，验证范围为变化节点的全部传递消费者。无法解析、存在环但未声明原因或缺少指纹的矩阵不能用于缩小验证范围，必须扩大到相关页面族或全量共享契约测试。`verified` 只表示在当前记录的 PHP/Laravel 环境内有证据；没有 Browser fixture 的能力不得晋级。其它版本组合未经验证，但按用户决定不构成本轮验收阻断；不能因 Demo 某一页面“看起来正常”而晋级。

## 变更控制

以下变化视为兼容契约变化，必须独立 Issue、版本评估和扩大回归：

- PHP/Blade 公共 API 或 override 优先级。
- URL、查询参数、表单载荷、响应或错误语义。
- 稳定 DOM 锚点、插槽或扩展选择器分类。
- 资源 alias、manifest、bridge API、payload schema 或 PJAX 时序。
- 设计令牌、稳定布局、动作顺序或响应式规则。
- renderer 选择行为、compat island 覆盖范围或遥测字段。
- Bootstrap/AdminLTE/jQuery core dependency 或 Dcat compat facade 的公开覆盖范围。

不能通过保留一段无人验证的兼容代码宣称兼容。每条 PHP/API/HTTP/island 承诺都必须有消费者证据与测试；不提供 legacy renderer 作为隐式证明。

## 破坏性升级判定

出现以下任一情况即视为破坏性升级，本 Epic 不得接受：

- 既有 PHP/Blade 调用必须修改才能继续工作。
- 默认升级后页面自动进入尚未验证的 native 路径。
- 已承诺的 Dcat Controller/API/HTTP 契约失效；旧版整页模板、未登记 Bootstrap class 或 private selector 不在承诺范围内。
- 路由、请求参数、载荷、关键选择器或操作顺序发生未授权变化。
- native/compat 失败产生空白页、重复写入、数据丢失或只能回滚整个包版本。
- 为使用新版前端而提高 PHP/Laravel 下限，或要求生产环境安装 Node.js。
- 隐式引入未授权的 PRO 组件、外部字体、遥测或网络依赖。

## 契约验收

一个能力从 experimental 提升为 verified，必须同时通过适用的 C0-C5 证据、native/compat island 对照、真实 Chrome browser fixture、失败状态演练和独立审查。一个页面族成为 default-candidate，还必须证明所有登记 Controller/扩展输出都有 native 支持或 verified compat island，并通过 Bootstrap/AdminLTE network absence gate。新版 View 默认值不再有旧 renderer 可切换。
