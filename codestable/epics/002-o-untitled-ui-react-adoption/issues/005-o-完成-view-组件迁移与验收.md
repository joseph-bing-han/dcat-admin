---
kind: issue
title: 完成 View 组件迁移与验收
type: refactor
status: open
created: 2026-10-02
---

# 完成 View 组件迁移与验收

## 2026-10-03 线框按钮首屏颜色闪烁（已完成）

用户反馈多个页面刷新时线框按钮先显示满颜色，以 `/admin/auth/extensions` 为例。Chrome 官方扩展无脚本刷新复现：Refresh、Marketplace、Install From Local 从服务器输出就具有 `btn-primary btn-outline`，但透明背景规则限定于 React 挂载后才出现的 `.dcat-modern-grid-view`；首屏显示紫色背景和白字，挂载后才切换线框。

已把组合类 `btn-outline.btn-primary` 的常态、悬停/激活规则从 `styles.css` 移到公共 `compat-facade.css`，沿用当前最终配色，不依赖组件挂载。既有单类 `btn-outline-*` 与实色按钮语义保持；按钮交互与表格结构未调整。

- Chrome 官方扩展验证扩展页三按钮：无脚本首次绘制与正常挂载后均为透明背景、`rgb(88,108,177)` 文字和边框。完整刷新 7 帧录像中，从按钮首次出现到最终状态均为线框。
- Scaffold 页 Add field、Sync translation and comment 首屏及挂载后保持透明线框，Submit 保持紫底白字；未操作提交、安装或启停扩展。脚本执行已恢复、录屏停止，视口未变，两个页面 warn/error 为空。
- `modern:build`、`modern:artifact`、`git diff --check` 通过，native/compat 与旧资源入口均已重建；JS 196892 + CSS 33991 = **230883 gzip 字节**，仅观测。纯 CSS 作用域修复未新增复述样式的单元测试，未重复未受影响的 PHP/TS 或全量浏览器套件；当前会话自查未发现新增缺陷，无独立 Review 工具。

证据：[修复前首屏](../../../../artifacts/button-first-paint/before-no-script.jpg)、[修复后首屏](../../../../artifacts/button-first-paint/after-no-script.jpg)、[刷新首帧按钮](../../../../artifacts/button-first-paint/refresh-44.jpg)、[最终页面](../../../../artifacts/button-first-paint/after.jpg)、[验证记录](../../../../artifacts/button-first-paint/verification.json)。[Task 已归档](../../../tasks/archived/2026-10-03-008-fix-outline-button-first-paint.md)，结果回写 Epic S6，Issue/Epic 保持 open；公共规则注释及本 Issue 承载结论，无新增 Talk/Note/Tool。

## 2026-10-03 Dashboard 刷新品牌图像位移（已完成）

用户确认发生在 Dashboard 首页。Chrome 官方扩展逐帧录制复现：侧栏 Logo 保持左上角；欢迎卡片先绘制旧版 fallback（70px 图像、白色标题、缺少卡片背景），再替换为居中的现代卡片（48px 图像、24px 内边距）。前两轮仅修复外壳样式状态，未覆盖此独立图像的首屏切换。

已在 `resources/views/dashboard/title.blade.php` 的现代 fallback 输出与 `WidgetView` 一致的卡片、图像、标题和链接结构，复用已有 Card/CSS，并设置图像固有尺寸 48×48；保留组件边界、载荷、无脚本可读内容与 compat 路径。侧栏布局和全局加载显隐未调整。

- PHP 8.1.34 / Laravel 10.50.3 消费者的 `ModernRendererTest` **14 项、104 断言通过**；新增用例实际渲染 Blade，对照载荷验证 Logo、标题、四链接、固有尺寸及无 manifest 路径。`modern:php-static`、PHP 语法、`git diff --check` 通过。
- Chrome 官方扩展录制正常刷新 **44 帧**，首帧、组件接管及图表完成关键帧保持品牌卡片布局。桌面无脚本首屏与 React 挂载后，卡片 Logo 均为 `(661.25,234,48,48)`，卡片高 168px，四链接几何一致；侧栏 Logo 保持 `(16,8,35,35)`。
- 375×812 无脚本首屏与挂载后，卡片 Logo 均为 `(156,214,48,48)`，卡片高 196px，链接两行且几何一致，`scrollWidth = clientWidth = 360`。已恢复脚本执行与 1912×906 视口、停止录屏，warn/error 为空。

本地证据：[修复前首屏](../../../../artifacts/logo-position/before-no-script.jpg)、[修复后首帧](../../../../artifacts/logo-position/verified-after-39.jpg)、[最终页面](../../../../artifacts/logo-position/after.jpg)、[窄屏](../../../../artifacts/logo-position/mobile.jpg)、[验证记录](../../../../artifacts/logo-position/verification.json)。[Task 已归档](../../../tasks/archived/2026-10-03-007-fix-dashboard-logo-position.md)，结果回写 Epic S6；Issue/Epic 保持 open。本轮仅修改 Blade 并复用已有 CSS，无需构建前端，未重复 TS/全量测试或其他浏览器验收。宿主无独立 Review 工具，当前会话自查未发现新增缺陷；源码注释、回归测试和本 Issue 承载结论，无新增 Talk/Note/Tool。

## 2026-10-03 Dashboard 品牌卡片内边距（已完成）

用户反馈 Dashboard 的 Dcat Admin 品牌卡片内容贴边。Chrome 官方扩展实测四边 padding、Logo 顶部及链接底部留白均为 0，卡片高度 120px。根因是 Dashboard 将内容直接放入不提供默认内边距的通用 TableCard，专用样式仅定义了内部间距。已在 `resources/modern/styles.css` 的 `.dcat-modern-dashboard` 专用规则增加 `padding: 24px`，沿用原有居中与链接换行；共享 Card、数据和交互未修改。

`modern:build`、`modern:artifact` 与 `git diff --check` 通过，发布资源已重建，总计 **230894 gzip 字节**，仅观测。Chrome 官方扩展验证桌面、375×812 及恢复桌面：四边 padding、顶部和底部留白均为 24px，原 12px 内部间距不变；桌面卡片高度由 120px 增至 168px，窄屏为 196px，四个链接自然换成两行且内容/href 不变。页面无横向溢出，移动端五图完成重绘后仍位于卡片内，warn/error 为空；视口已恢复 1912×906。

本地证据：[修复前](../../../../artifacts/dashboard-padding/before.jpg)、[修复后](../../../../artifacts/dashboard-padding/after.jpg)、[窄屏](../../../../artifacts/dashboard-padding/mobile.jpg)、[验证记录](../../../../artifacts/dashboard-padding/verification.json)。[Task 已归档](../../../tasks/archived/2026-10-03-004-fix-dashboard-card-padding.md)，稳定行为已回写 Epic S6，Issue/Epic 保持 open。纯 CSS 外观修正未新增复述样式的单元测试，未重复 PHP/TS、全量门禁或其他浏览器验证；独立 Review 工具不可用，当前会话自查未发现新增缺陷。简单专用样式已由源码与本 Issue 承载，无新增 Talk/Note/Tool。

## 2026-10-03 订单图例样式修正（已完成）

用户指出 Product Orders 的 Finished/Pending/Rejected 图例仍需调整。实测旧间距工具类和颜色样式未生效，圆点与文字间距为 0，前两项退化为普通文字颜色，数值沿用普通字重与比例数字。已在 `compat-facade.css` 的 `.metric-content .chart-info` 范围内补齐样式：用 8px CSS 实心圆替代字体图标、与文字间隔 8px，复用主题 primary/warning/danger 语义色，统一 32px 行高；数字采用 600 字重、等宽数字并明确右对齐。原数值外框右边界已一致，本轮改善数字样式，保持原有数值和格式；图表配色及前一轮宽度修复保持原样。

验收结果：

- `npm run modern:build`、`npm run modern:artifact` 与 `git diff --check` 通过，发布资源已更新。JS 196878 + CSS 34015 = **230893 gzip 字节**，仅观测；构建有 Vite `__dirname` 未来兼容提示，非阻断。
- Chrome 官方扩展验证桌面、Product Orders 切换 Last 28 Days、375×812 视口及恢复桌面。三行圆点、间距、行高、字重和数字样式符合上述目标，右边界一致；移动端文字和数字无重叠。
- 筛选、移动及恢复状态的六图均为单个有效 SVG、宽高非零、路径无 NaN/Infinity 且不超出卡片；375px 的 `scrollWidth = clientWidth = 360`，恢复桌面后二者均为 1897，无横向溢出。临时视口已恢复为 1912×906，浏览器 warn/error 日志为空。

本地证据：[调整前](../../../../artifacts/metric-legend/before.jpg)、[调整后](../../../../artifacts/metric-legend/after.jpg)、[移动视口](../../../../artifacts/metric-legend/mobile.jpg)、[验证记录](../../../../artifacts/metric-legend/verification.json)；`artifacts/` 为忽略目录。[Task 已归档](../../../tasks/archived/2026-10-03-003-fix-metric-legend-layout.md)，稳定行为已回写 Epic S6，Issue/Epic 保持 open。本轮为纯 CSS 视觉调整，不新增复述 CSS 的单元测试，未重复 PHP/TS、全量门禁或其他浏览器验证。宿主无独立子代理工具，当前会话自查未发现本次变更缺陷，未进行独立 Review；无新增 Talk/Note/Tool。

## 2026-10-03 统计卡片图表修复（已完成）

用户反馈 `/admin/components/metric-cards` 图表显示不完整。Chrome 官方扩展复现：六个图表中 New Users、New Devices 正常，Avg Sessions、Product Orders、Tickets、Goal Overview 的图表容器宽高均为 0，控制台无错误；Total Users 是纯数字卡片，本来没有图表。

根因位于四类卡片共用的 `Metrics/RadialBar::renderContent()`：图表放在没有宽度的空 flex 子项内，初始内容宽度为 0；compat 的 `mountChart` 必须等容器有宽度才渲染，双方互相等待。现已给外层图表容器复用 `w-100` 并设置 `min-width: 0`，使其先获得所在列的可用宽度并允许收缩，保留延迟渲染与 PJAX 清理逻辑。修复同时覆盖 Bar、Round、RadialBar、SingleRound，图表数据、依赖及数据库未改变。

验收结果：

- Chrome 官方扩展验证首次加载、Avg Sessions/Product Orders/Tickets 三次日期筛选、PJAX 返回、375×812 视口及恢复桌面，共 7 个状态；每态六图均有单个有效 SVG、宽高非零、路径无 NaN/Infinity 且不超出卡片。筛选确实替换图表容器，PJAX 离开后图表注册数为 0、返回后为 6，`performance.timeOrigin` 保持不变。
- 375px 视口的 `scrollWidth = clientWidth = 360`，无横向溢出；临时视口已恢复为 1912×906，浏览器 warn/error 日志为空。
- 当前 Demo 的 PHP 8.1.34 / Laravel 10.50.3 / PHPUnit 10.5.64 下，`dcat-admin-demo/vendor/bin/phpunit --no-configuration --bootstrap dcat-admin-demo/vendor/autoload.php tests/Feature/ModernRendererTest.php` 通过 **12 tests / 56 assertions**。PHP 语法、`node --check scripts/dcat-admin-demo-browser.mjs` 和 `git diff --check` 通过。验收使用 Demo 的 autoload，避免仓库既有 vendor 与实际消费者版本不同。
- `scripts/dcat-admin-demo-browser.mjs` 新增六图绘制、日期筛选、PJAX 清理/返回与移动视口的回归断言；本轮通过官方扩展执行对应场景，未运行该脚本的全站 CLI 流程、全量 Dusk/modern:verify 或其他浏览器。前端源码与资源未变化，无需重新构建。

本地证据：[修复前](../../../../artifacts/metric-charts/before.jpg)、[修复后](../../../../artifacts/metric-charts/after.jpg)、[移动视口](../../../../artifacts/metric-charts/mobile.jpg)、[验证记录](../../../../artifacts/metric-charts/verification.json)；`artifacts/` 为忽略目录。[Task 已归档](../../../tasks/archived/2026-10-03-002-fix-metric-chart-rendering.md)，稳定行为已回写 Epic S6，Issue/Epic 保持 open。宿主无子代理工具，本轮为当前会话自查，未进行独立 Review；本 Issue 与共享布局注释已承载结论，无新增 Talk/Note/Tool。

## 2026-10-03 Grid 首屏布局一致性（已完成）

用户要求所有 List/Grid 刷新从首屏即为正确布局。公共 Blade 仍输出旧版 dcat-box/table，React 接管后才生成现代工具栏、TableCard、表格与分页；扩展页实测工具栏首屏 `(301,211)`、接管后 `(317,227)`，表格纵坐标从255移到283，行高也变化。修复在公共渲染层统一现代首屏外壳、表格密度、原生内容、空态与分页，复用同一 GridViewModel 数据和 CSS；保留上游 Table/TableCard、compat 原节点、表格 id、排序/选择/快速新增与固定列协议。不通过隐藏整页或等待脚本遮掩跳变。

验证采用实际 Blade 输出和 React 原节点回归、聚焦类型检查与构建，以及 Chrome 扩展的禁用脚本首屏/挂载后几何对照和真实刷新录像。覆盖普通表、快速新增/复杂表头、空态、固定列、分页及窄屏；核对 async 路径，按实际支持边界记录结果。不修改数据库、依赖或 vendor 组件，不提交和部署。

已在 `grid/table.blade.php` 输出最终 Grid/工具栏/TableCard 外壳，并在首屏标记 compat 岛，使字体、段落、表单等补偿样式立即生效。原生单元格与分页改为消费同一 GridViewModel；标签语义色由载荷提供。共享 CSS 统一 collection/structural 表格几何、进度条、空态和展开按钮；快速新增使用与 React 相同的 tbody，空工具栏不再留白。自查额外发现上游表头禁用 press 会拦截普通排序 anchor，现使用上游 Link 与局部 RouterProvider 对接既有 PJAX，保留历史与查询参数。

验证结果：

- PHP 8.1.34 / Laravel 10.50.3 消费者 **17 tests / 131 assertions**，Grid + navigation **35 项 Vitest**、typecheck、php-static、build/artifact、diff-check 通过。最终 JS 196843 + CSS 34192 = **231035 gzip 字节**，仅观测。
- Chrome 扩展验证扩展页、用户页、空态的无脚本首屏与挂载后：外壳、工具栏、表格和分页位置/高度一致；375px 扩展页和空态几何一致，`scrollWidth = clientWidth = 360`。普通列表最终最大列宽差 0.0625px，为亚像素舍入。
- 复杂表头、固定列、默认 Grid 的随机演示数据在同一文档延迟执行页面原脚本前后，表格内部相对位置、列宽和总高度一致。扩展页正常刷新7帧录像确认 Grid 首次出现即为最终布局。全选/取消、快速新增展开/取消通过；真实排序切至 asc，`performance.timeOrigin` 不变，保留 PJAX。

边界：报表/默认 Grid 上方异步统计卡片在数据返回后仍会改变外层页面高度，属于尚未处理的指标占位问题，不宣称整页所有异步内容零位移。async-table/async-fixed-table 本身不经过 grid.read 接管，本轮保留其异步数据协议。用于比较同一份随机数据的脚本回放曾出现 Select2 加载时序错误；正常刷新与最终导航无新增 warn/error，快速新增表单及其控件可见，未提交数据。未运行全量 Dusk/modern:verify 或其它浏览器；无子代理工具，当前会话自查而非独立 Review。

证据：[首屏](../../../../artifacts/grid-first-paint/refresh-906.jpg)、[最终页面](../../../../artifacts/grid-first-paint/after.jpg)、[窄屏](../../../../artifacts/grid-first-paint/extensions-mobile-mounted.jpg)、[验证记录](../../../../artifacts/grid-first-paint/verification.json)。[Task 已归档](../../../tasks/archived/2026-10-03-009-fix-grid-first-paint.md)，扫描无冲突，结果回写 Epic S4；Issue/Epic 保持 open。视口已恢复1912×906、脚本执行已恢复、录屏已停止；未提交、部署或修改数据库，无新增 Talk/Note/Tool。

## 目标与范围

承接 S3 已有工作，完成 Epic 002 的 S4–S7：内建 Grid、Form、其余页面族与浮层消费上游 OSS 组件，退役自研 DOM 组件，Tailwind 语义令牌成为唯一值来源，完成当前消费者的浏览器验收。保留工作区已有改动、PHP/HTTP/PJAX/表单协议和 compat island 边界。不提交、不推送、不部署、不关闭 Epic，不修改数据库结构或关键数据。

## 方案与质量承诺

- 先修复旧 Task 的缺失字段与归档残留；原执行证据和未完成项保留，不伪造历史完成。
- 组件接入扎在页面与桥接的现有责任边界；仅为保持服务器载荷、锚点与复杂表格能力建立 Dcat 适配，不修改 vendor 的溯源规则。
- Grid 先穿刺 React Aria collection 对复杂表头、展开行与原节点岛的支持；不能保持协议的场景明确保留 compat，不能静默丢失列或表单控件。
- 兼容性：name/id、旧值、禁用/必填、CSRF、选择器与查询 href 通过现有行为测试和浏览器契约证明。
- 交互能力：键盘、焦点恢复、浮层边界、axe 与五视口重排在最终组件层验证。
- 性能效率：每批报告 gzip，收口重复样式与未使用组件扫描成本；按用户最新要求不设文件大小硬门禁。
- 可维护性：令牌值仅在 Tailwind 主题定义；旧变量仅作为兼容别名，门禁验证单一来源。修复构建后 census 过期的验证顺序。

## 验证与回写

2026-10-02 用户最终确认：保留完整上游迁移，彻底去除文件大小限制，替代先前按实测重定预算的决定。Grid 首次接入上游 collection 的实测约为 JS 172KB + CSS 33KB gzip，旧总预算 143KB 不足；后续仍先收口重复样式，并报告最终各项实测，不再设上限。

使用 `modern:typecheck`、受影响 Vitest、vendor/provenance、build/artifact 与完整 `modern:verify`；真实浏览器优先 Chrome extension 连接，不可用时回退 Browser。只验证实际 PHP/Laravel 版本，复用已有消费者与数据库，不执行安装脚本覆盖其环境。五视口、preflight、shell 与页面族验收保留可复查证据。Task 归档后回写本 Issue 和 Epic，Project Spec 仅标明已证实漂移，不提前毕业未关闭 Epic。

## 实施结果（2026-10-02）

本轮执行已完成，Task 已[归档](../../../tasks/archived/2026-10-02-001-complete-untitled-view-migration.md)；本 Issue 与 Epic 保持 open，关闭与提交仍由维护者另行决定。

- Grid 简单表格接入上游 React Aria Table/TableCard，分页、空态、徽标、进度与展开按钮消费上游组件。复杂表头、colspan/rowspan、展开行及 quick-create 原节点使用原生 table，由 TableCard 包裹，保持固定列与原节点恢复协议。
- Form 接入 InputBase/TextAreaBase/NativeSelect/Choice/Tabs，双列表按钮使用上游 Button；多选、optgroup、颜色及范围字段保留原生语义。Select 锚点/禁用选项、隐藏 Tab 载荷、单选分组/reset 与 required/error 通过回归测试。提交工具、插件和自定义节点仍为原节点岛。
- Show/Tree/Widget/System 的容器与操作消费上游组件；Modal/Drawer/Tooltip/Popover/Dropdown 已迁移。OSS 无独立 Alert/Toast，使用主题语义容器与上游 Button。旧 Dcat.confirm 的返回 dialog 协议保持兼容，DcatReact.confirm 使用上游 Modal。
- components.tsx 仅保留浮层几何纯函数；43 个旧令牌改为 Tailwind @theme 的兼容别名，tokens.json/tokens.ts 退役。旧 primitives CSS 已退役，compat/preflight 补偿限定于兼容边界；根字号16、页标题24px。
- 所有文件大小限制取消，保留 raw/gzip 量测。最终 core JS 668302 raw / 195832 gzip，CSS 229453 raw / 31586 gzip，共 897755 raw / 227418 gzip 字节。

验证：完整 modern:verify 通过（17 文件/117 Vitest、typecheck、build、vendor 73、静态与许可证/拓扑/完整性）；最后按钮下划线 CSS 修正另通过 build/artifact/coverage/preflight。PHP 8.1.34/Laravel 10.50.3 focused tests 20 tests/117 assertions。Chrome 官方 extension 的16代表页/80五视口截图无整页溢出、axe无违规；30组半宽CSS视口重排代理无溢出；Modal焦点与Drawer点击面/Escape、真实Select2下拉及编辑器/上传器加载通过，双列表移动选项仅操作本地未提交表单。证据在 artifacts/view-migration-2026-10-02/summary.json 与同目录逐页 JSON/截图；preflight 为30探针0差异。

限制：本轮没有独立子代理审查、原生浏览器UI缩放或人工读屏；额外在线上游文件树核验返回HTTP403，本地固定revision与73文件哈希门禁通过。本轮未重跑旧DOM的完整浏览器合同脚本或独立Demo全站crawl，采用扩展会话新DOM证据，不把历史证据记作本轮执行。未提交、推送、发布或修改数据库结构/关键数据。
