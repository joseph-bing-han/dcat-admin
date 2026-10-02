---
kind: issue
title: 完成 View 组件迁移与验收
type: refactor
status: open
created: 2026-10-02
---

# 完成 View 组件迁移与验收

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
