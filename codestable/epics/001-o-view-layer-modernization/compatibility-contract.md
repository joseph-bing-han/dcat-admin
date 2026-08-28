---
doc_type: compatibility-contract
title: View 层现代化兼容契约
status: frozen
version: 1.0.0
created: 2026-08-29
updated: 2026-08-29
scope: legacy and modern renderers
---

# View 层现代化兼容契约

## 契约目标

本契约从 `1.0.0` 起定义 View 层现代化期间不可破坏的公开和事实使用面。每个批次必须记录所使用的契约版本或内容哈希。兼容不是要求 modern DOM 逐节点复制 legacy，而是要求既有应用行为不变，并为无法证明等价的页面提供完整 legacy 回退。

兼容等级从服务端到回退依次为 C0-C5。任一相关等级未通过时，该页面或能力不能启用 modern。

## C0 PHP、Blade、支持环境与安装契约

- 继续支持项目声明的 PHP `>=7.1` 和 Laravel 5.5-10；不得在 PHP 运行时代码中使用更高版本语法。
- 安装或升级包不能要求生产服务器具备 Node.js。Node.js 只用于包开发与资源构建。
- 既有 Composer 服务注册、配置发布、视图 namespace、资源发布命令和缓存流程保持有效。
- 新资源路径、manifest 和配置键必须独立命名；不能覆盖旧 `resources/dist` 文件含义或旧 alias 的目标。
- modern 默认关闭。升级包本身不能改变生产页面渲染器，除非管理员明确启用 allowlist。
- 不通过数据库直改保存 feature flag、兼容声明或关键设置；若未来需要持久化结构，必须使用迁移文件并另行授权。

验证：Laravel 5.5、5.6、5.7、5.8、6、7、8、9、10 均在冻结矩阵的允许 PHP 组合中执行安装、配置缓存、资源解析、无 Node 生产启动、legacy 冒烟和共享契约测试。C0、构建链或共享 PHP/Blade 契约变化时必须运行完整主版本矩阵，不能只抽测最低/最高端点。

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
- 自定义 Blade/Renderable 无能力声明时按 legacy 处理；不得丢弃、转义两次或尝试不安全地转成 React。
- Blade override 的解析优先级不变。modern 若无法尊重 override，则整个相关组件或页面回退。
- 旧异常类型、验证错误和权限拒绝仍从相同服务端边界产生，不由客户端伪造业务结论。

验证：公共 API fixture、代表性扩展、Blade override、资源注入顺序和 legacy/modern 服务端输出契约测试。

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
- payload schema 使用独立版本号；未知 major 版本拒绝挂载并回退，minor 新字段必须向后可忽略。
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
- 清单内选择器按 stable、bridge-only、legacy-internal 分类。stable 必须在新旧渲染保持；bridge-only 通过兼容代理维持；legacy-internal 只承诺在 legacy 路径存在。
- 不允许假定所有 Bootstrap/AdminLTE class 都是公共契约，也不允许在没有清单和扩展证据时批量删除。

### 插槽与任意内容

- 标题、描述、面包屑、消息、Section、Navbar/Menu、页脚和 `.extra-html` 的相对顺序及输出位置保持。
- 任意 HTML/Blade 插槽默认在 legacy 管辖范围渲染。若嵌入 modern 页面，应放在隔离的 legacy island 中并保持原资源生命周期。
- React key、内部组件 class 和自动生成 id 不是扩展 API；扩展只能依赖正式注册的 bridge、slot 和稳定选择器。

验证：DOM 契约快照、唯一性/嵌套断言、代表扩展选择器、Dusk 既有路径和 modern root 边界测试。

## C3 资源、JavaScript 与生命周期契约

### 旧资源和全局运行时

- `@adminlte`、`@vendors`、`@dcat`、`@pjax`、`@select2` 等现有 alias、加载顺序和发布路径保持有效。
- `window.Dcat`、jQuery、PJAX 和现有插件在 legacy 页面保持可用。
- `Dcat.boot()`、`Dcat.ready()`、`Dcat.init()`、`Dcat.wait()` 及既有事件的调用时机和重复调用语义不得被 modern 改写。
- `Admin::headerJs` 位于其既有阶段；CSS、JS、HTML 和 template 的提取/注入顺序保持。

### modern bridge

- 使用独立命名空间 `window.DcatReact`，其公开 API 必须版本化并具有 TypeScript 定义。
- bridge 至少负责 `register`、`canMount`、`mount`、`unmount`、错误隔离和能力查询；具体签名由 M2 契约测试冻结。
- 一个 root 同一时刻最多一个实例。重复 mount 必须幂等或先安全卸载，不能叠加事件和 DOM。
- PJAX 开始替换前卸载；新 DOM、manifest 资源和 legacy 初始化完成后的规定阶段再挂载。
- unmount 必须释放 document/window 监听器、observer、timer、AbortController、portal、focus trap 和第三方实例。
- modern 组件不得覆盖 `window.Dcat` 方法、修改 jQuery prototype 或劫持全局 PJAX handler。

### 构建与 CSS

- Vite 输出使用内容哈希、独立 manifest 和可预测入口。manifest 缺失、条目缺失或完整性失败时选择 legacy。
- M1 必须在两种互斥拓扑中冻结一种：单入口 IIFE 时禁止 dynamic import/code splitting；ESM 入口时使用 `type="module"`、manifest 依赖图和明确的非支持浏览器 legacy 回退。不得生成表面是传统脚本、运行时却依赖 ESM chunk 的混合入口。
- 选择 ESM 时，dynamic import 的 chunk 基址、资源发布子目录、CDN/asset URL、模块加载失败和缓存失效必须有集成测试；选择 IIFE 时必须验证单包体积预算和按页面装载策略。
- modern CSS 使用根作用域或等效隔离；禁止 Tailwind preflight、元素选择器和通用 utility 影响 root 外 DOM。
- z-index 使用统一层级表，并与现有 navbar/sidebar/PJAX 插件浮层对照，禁止组件自行写任意高值。

验证：资源顺序和 alias 测试、manifest 失败注入、连续 PJAX 导航、监听器/内存测量、CSP 场景、CSS 泄漏和混合页面测试。

## C4 布局、交互与用户经验契约

- 顶部导航、侧栏、页面标题/描述、面包屑、消息、主内容和页脚的位置、层级、方向不变。
- 展开侧栏保持 260px；折叠、水平菜单、sticky/floating/hidden 顶栏、浅色/深色/主色侧栏及 full-page 均保留。
- 菜单分组、项目顺序、当前项提示和入口不因视觉升级改变。
- Grid 列顺序、筛选入口、选择列、行/批量动作及分页的任务顺序保持；未经矩阵批准不能将数据表默认改成卡片。
- Form 字段、Tab、主要提交/返回动作、错误定位和焦点顺序保持。
- 同一用户任务的步骤数不得增加；危险动作确认强度不得降低。
- 所有 modern 页面遵守 [`ui-ux-spec.md`](ui-ux-spec.md)，包括五视口、WCAG 2.2 AA、键盘、焦点、对比度、200% 缩放和 reduced motion。

像素差异允许发生在字体抗锯齿、令牌化边距、边框、色彩和明确批准的组件细节；区域几何、内容可见性、动作位置和操作结果属于不可随意变化的语义布局。

验证：legacy/modern 并排任务脚本、几何断言、视觉差异、键盘流程、移动触控和用户关键路径测试。

## C5 回退、灰度与可观测性契约

回退是横跨所有等级的强制门禁：

- modern 开关至少支持全局、页面族和路由 allowlist；默认关闭，未知值视为关闭。
- 能力检测发生在输出不可恢复的 modern 页面之前。无法支持的字段/扩展应服务端选择 legacy，不依赖浏览器报错后拼接旧页面。
- 客户端错误边界只能处理渲染故障；存在完整 legacy 响应时可安全导航回退，不能重复执行已完成写请求。
- M2 必须冻结一次性全页回退协议：同一 navigation key 最多触发一次 reload；浏览器设置无敏感信息、管理端路径范围、短时且一次性消费的 legacy 标记，服务端下一次 GET 输出 legacy 后立即清除；客户端同时记录本次 navigation 已回退。legacy 页面或已消费标记的请求再次失败时只显示可恢复错误，不得循环 reload。
- 回退不需要数据库变更、重新构建、清缓存以外的破坏性动作或重新部署旧版本。
- 登录、权限拒绝、异常页和回退控制本身不能依赖唯一的 modern bundle。
- 日志记录 renderer、route/page family、payload version、bridge version、稳定错误码和 fallback 原因；禁止记录表单值、令牌或敏感 HTML。
- modern 成功率、挂载失败、资源失败、回退次数和 PJAX 生命周期异常应可聚合；遥测不可成为页面正常运行前置条件。
- 熔断阈值和自动回退策略在 M2/M11 单独定义；自动动作只能关闭 modern，不能自动重试写请求或修改关键数据。

验证：关闭开关、未知能力、损坏 manifest、chunk 失败、React render error、一次性标记消费与 reload 防循环、PJAX 中断、离线和日志脱敏演练。

## 兼容能力声明

每个可 modern 渲染的页面 payload 必须携带或可推导：

- `schemaVersion`
- 页面族和组件类型
- 所需 bridge 能力
- 已知字段/displayer/widget 标识
- 所需资源 alias 或 modern chunks
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
| Modern status | unsupported/experimental/verified/default-candidate |
| Fallback scope | component/page/route/global |
| Verification | 自动测试、视口、人工验收和证据位置 |
| Contract versions | token、payload、bridge、manifest 版本 |
| Contract fingerprints | UI/UE、兼容、payload、bridge 和 manifest 的内容哈希 |
| Depends on | 直接依赖的 Capability ID 与共享契约边 |
| Consumers | 使用该能力的页面、组件、扩展和测试集合 |
| Last impacted by | 最近改变该能力的 Issue/commit |
| Verified commit | 最近一次完整通过声明矩阵的提交 SHA |

`dependsOn` 与 `consumers` 共同形成机器可计算的有向影响图；共享契约指纹变化时，验证范围为变化节点的全部传递消费者。无法解析、存在环但未声明原因或缺少指纹的矩阵不能用于缩小验证范围，必须扩大到相关页面族或全量共享契约测试。`verified` 只表示在声明的支持矩阵内有证据；没有记录的组合视为 unsupported 并回退。

## 变更控制

以下变化视为兼容契约变化，必须独立 Issue、版本评估和扩大回归：

- PHP/Blade 公共 API 或 override 优先级。
- URL、查询参数、表单载荷、响应或错误语义。
- 稳定 DOM 锚点、插槽或扩展选择器分类。
- 资源 alias、manifest、bridge API、payload schema 或 PJAX 时序。
- 设计令牌、稳定布局、动作顺序或响应式规则。
- feature flag 默认值、回退范围或遥测字段。

不能通过保留一段无人验证的兼容代码宣称兼容。每条兼容承诺都必须有消费者证据、测试或明确的 legacy 回退。

## 破坏性升级判定

出现以下任一情况即视为破坏性升级，本 Epic 不得接受：

- 既有 PHP/Blade 调用必须修改才能继续工作。
- 默认升级后页面自动进入尚未验证的 modern 路径。
- 旧插件、扩展或自定义视图在没有完整回退时失效。
- 路由、请求参数、载荷、关键选择器或操作顺序发生未授权变化。
- modern 失败产生空白页、重复写入、数据丢失或只能回滚整个包版本。
- 为使用新版前端而提高 PHP/Laravel 下限，或要求生产环境安装 Node.js。
- 隐式引入未授权的 PRO 组件、外部字体、遥测或网络依赖。

## 契约验收

一个能力从 experimental 提升为 verified，必须同时通过适用的 C0-C5 证据、legacy/modern 对照、强制回退演练和独立审查。一个页面族成为 default-candidate，还必须证明所有已知扩展点都有 modern 支持或完整 legacy 路径。默认值改变不属于本契约自动授权范围。
