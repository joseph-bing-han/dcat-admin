---
doc_type: task-list
task: modern-view-single-renderer-demo-coverage
goal: 保留官方 Demo 原版 Controller 页面，全面使用新版 View 并完成剩余验证
status: archived
workflow: implementation
owner_skill: cs
created: 2026-09-26
updated: 2026-09-26
archived: 2026-09-26
related_docs:
  - codestable/epics/001-o-view-layer-modernization/spec.md
  - codestable/epics/001-o-view-layer-modernization/compatibility-contract.md
  - codestable/epics/001-o-view-layer-modernization/implementation-capability-matrix.json
  - codestable/epics/001-o-view-layer-modernization/m11-demo-laravel10-validation.json
  - codestable/spec/view-layer/index.md
  - docs/modern-view-layer.md
  - docs/modern-view-migration.md
  - codestable/tasks/archived/2026-09-26-001-view-layer-bootstrap-free-refactor-implementation.md
---

# 保留官方 Demo 原版 Controller 页面，全面使用新版 View 并完成剩余验证

## 1. 任务目标

保留官方 Demo 原版 Controller 页面，全面使用新版 View 并完成剩余验证

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 恢复 Demo 原始 Controller 行为和新版 renderer 配置，冻结 Controller 覆盖基线
- [x] 用新版 View 完整验证 Demo 页面、菜单与组件交互并修复阻断问题
- [x] 运行 modern、PHP/Laravel 支持矩阵及相关浏览器和无障碍门禁
- [x] 同步能力矩阵、Epic 证据、迁移文档与发布就绪状态

## 4. CodeStable 文档索引

- `codestable/epics/001-o-view-layer-modernization/spec.md`
- `codestable/epics/001-o-view-layer-modernization/compatibility-contract.md`
- `codestable/epics/001-o-view-layer-modernization/implementation-capability-matrix.json`
- `codestable/epics/001-o-view-layer-modernization/m11-demo-laravel10-validation.json`
- `codestable/spec/view-layer/index.md`
- `docs/modern-view-layer.md`
- `docs/modern-view-migration.md`
- `codestable/tasks/archived/2026-09-26-001-view-layer-bootstrap-free-refactor-implementation.md`

## 5. 执行步骤

### 1. 恢复 Demo 原始 Controller 行为和新版 renderer 配置，冻结 Controller 覆盖基线

- 状态：done

### 2. 用新版 View 完整验证 Demo 页面、菜单与组件交互并修复阻断问题

- 状态：done

### 3. 运行 modern、PHP/Laravel 支持矩阵及相关浏览器和无障碍门禁

- 状态：done

### 4. 同步能力矩阵、Epic 证据、迁移文档与发布就绪状态

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-09-26：Task 已创建。

2026-09-26：2026-09-26：恢复 Demo LayerController 的 withoutTextButton() 调用并在 Dropdown 恢复 fluent API；Modern 模板为 icon-only 控件生成可访问名称和菜单关系。清除 Demo 无效的旧 renderer flags。固定官方 demoControllerBaseline：49 个 Controller 目录 PHP 文件、81 个最低页面路由和 33 个最低菜单入口，浏览器 harness 将其列入报告并在缩减时失败。聚焦 ModernRendererTest 9/9（48 assertions）、PHP lint、Node syntax、JSON parse、Controller inventory 49/49 与 diff-check 通过。

2026-09-26：2026-09-26：官方 Demo 新版 View 浏览器回归完成：81 页面、30 个响应式检查、20 项交互检查，页面/响应式/交互失败均为 0；证据见 artifacts/dcat-admin-demo/2026-09-26-single-renderer/demo-browser-report.json。modern:verify 尚待修复兼容契约 v4.0.0 升级后的 M0 baseline 版本及哈希门禁。

2026-09-26：2026-09-26：npm run modern:verify 全通过：coverage 303/296、Grid/Form registry、43 tokens、M0 baseline（140 Blade/821 assets）、PHP/Blade static、Bootstrap-absence、typecheck、Vitest 16 files/105 tests、core+compat production build、artifact（JS 97,893 gzip bytes / CSS 12,236）与 Chrome harness self-test。兼容契约 v4.0.0 的目标版本/hash 与 registry generator 已同步；M0 历史 baseline 保持不变。

2026-09-26：2026-09-26 用户更正归档理解：前序 view-layer-bootstrap-free-refactor-implementation 的 status=archived 源自 active→cancelled，原因是旧版 UI 兼容目标被单一新版 View 决策替代，不代表其所有 B0-B12 验收通过。归档中 B10、B12 与文档同步仍未完成；旧 B10 旧 UI 兼容范围不再执行，保留适用的 Demo、支持矩阵、浏览器/无障碍与文档门禁由本 active Task 继续，全部完成前保持 active。

2026-09-26：2026-09-26：自动化 Lighthouse 抽查发现 dashboard/Grid/Form/Layer 有包内共享语义问题。已补 PJAX main landmark、默认 sidebar logo alt、dashboard fallback alt、现代 widget/metric 标题层级、Grid progressbar 名称、footer 链接下划线；同步 Demo 的 Sessions 指标说明文本语义。待在当前产物和 Demo consumer 重跑验证；compat Form/tab/list/table 的剩余告警另行核对。

2026-09-26：2026-09-26 用户反馈新增 3 个阻断项：Dashboard card 缺少内边距、下拉列表框缺左右内边距、Menu 二级菜单不能点击展开。虽然此前 Demo crawl 通过，本反馈表明可见行为未完整验收；Step 2 重新进入 in-progress，修复后补交互与可视验证。

2026-09-26：2026-09-26：复核新增 UI 阻断根因：Demo 的 Menu::add() 向 LEFT_SIDEBAR_MENU_BOTTOM 注入结构化节点 HTML，supportsModern() 因检测到该 section 而拒绝生成 layout.menu payload；Dashboard metric-content 缺少现代 padding 规则。下拉菜单 CSS 源已定义容器/条目 padding，但需以真实 Demo 展开态确认最终命中规则后再调整。

2026-09-26：恢复当前 Task：继续修复 Menu::add 结构化节点未进入新版菜单、Dashboard Metrics 内边距与下拉浮层宽度/对齐；随后完成聚焦测试、Demo 全页面、当前环境发布/缓存、浏览器和无障碍验证。用户最新明确要求：不需要验证其它 PHP/Laravel 组合，只验证当前版本；当前主验收消费者为 PHP 8.1.34 / Laravel 10.50.3。已同步 AGENTS.md、Epic、兼容契约和 Project Spec，其它组合不再作为阻断；Step 3 原标题保留，支持矩阵范围收窄为当前环境。当前宿主无原生 Todo 工具，以本 Task 同步区为唯一执行账本。原协调代理连续两次 stream disconnected，已用最小上下文重派，Task/共享文档保持主代理单写者。

2026-09-26：完成一批实现：Menu::add 原始节点按 section 优先级进入 modern payload，独立建树避免重复 ID 串组，保留任意自定义内容边界；React 菜单使用唯一列表 key 并支持 Space 展开；compat 浮层清除 right/bottom 约束后测量并对齐；Metrics 外层内容 16px、dropdown 8px/12px 留白。已添加菜单 PHP/React 与浮层定位回归测试。当前环境 PHPUnit 首测暴露测试容器缺 Laravel 10 UrlGenerator contract alias，已补齐后待复测；PHP lint、Node syntax、diff-check 已通过。验证策略的 machine-readable currentEnvironment、prepared CI、baseline 与迁移说明已改为 current-only。多个协调/探索调用连接或 API reasoning 错误，无独立实施产出，主代理继续；交付前仍需尝试独立 code_reviewer。

2026-09-26：当前构建已验证：modern:verify 全通过（16 files/105 tests，JS 97939 / CSS 12308 gzip bytes），当前 Demo PHP8.1.34/Laravel10.50.3 的19 PHP tests/312 assertions通过；新facade生成、vendor:publish与view:clear完成。Demo crawl为81页、30响应式、22交互，0阻断；包含二三级菜单键盘/点击与Metrics padding和dropdown对齐断言，证据 artifacts/dcat-admin-demo/2026-09-26-completion/demo-browser-report.json。可见Chrome Dashboard/Grid Lighthouse accessibility=100；Form=88，残留混合链接Tabs角色和range输入label；Layer=96，Code预览语法高亮对比不足。将按B12既有无障碍范围修复并复测。当前环境的8317 fixture server已启动；完整core浏览器首测在PJAX探针请求[object Object] URL时失败，待定位契约适配。独立code_reviewer连续两次连接失败，已改派可用只读代理。

2026-09-26：已完成 B12 无障碍与 PJAX 修复批次：DateRange/TimeRange/DatetimeRange 提供可翻译的起止标签且尊重应用自定义 ARIA；纯内容 Tab 使用完整 tablist/tab/tabpanel 语义，混合页面链接保留导航语义；预览代码语法高亮复用现代高对比色；$.pjax 同时接受 options 对象与 URL，reload 保留 container/options。已有真实 Form/Layer Lighthouse 和 core PJAX 失败作为回归前证据，待重新构建并复测。

2026-09-26：当前消费者 composer install 与 package discovery 已通过，无依赖版本变化；历史 Demo 扩展的 App PSR-4 扫描告警保留为非阻断。构建复测发现 B11 facade 固定URL已随新bundle生成，却仍与旧facade字节数精确比较；现将其标明为冻结比较参考，保留全部体积阈值与原基线数字，未替代的第三方文件仍逐字节检查，当前产物继续受modern:artifact约束；modern:build接入固定URL facade生成，避免发布陈旧资源。已增加Demo range label和混合页签角色回归断言。

2026-09-26：用户新增决定已执行：删除 .github/workflows/dusk.yml 与 .github/stale.yml 并删除空目录；同时移除无用途的 codestable/ci workflow 草案和 baseline 的 CI 文件依赖。本地构建/测试脚本保留；已同步 AGENTS、Epic、Project Spec 与迁移/发布文档，GitHub Actions/stale/workflow安装不再是验收或发布门禁。

2026-09-26：补记最新验证证据：核心浏览器回归在 Grid Action Matrix 的 QuickEdit 弹窗等待超时，正以可见 Chrome 复现，尚未判为通过；Dashboard/Form/Layer Lighthouse 已为100且无自动a11y失败，Grid虽100仍有td-has-header critical finding，需补表头语义并复测。8项200%等效设备度量仿真见 artifacts/dcat-admin-demo/2026-09-26-completion/zoom-review.json，无页面横向溢出；actualBrowserUiZoomVerified=false，不冒充原生浏览器菜单缩放人工证据。独立审查此前连接失败，已恢复只读协调代理，尚无本轮review通过结论。

2026-09-26：恢复后重新确认：QuickEdit 500 根因为 DialogForm::prepare 调用 Admin::fonts(false)，现代 Asset::mergeBaseCss 直接 array_merge(false, …)；待以字体关闭回归固定。Grid Lighthouse td-has-header 精确落在官方 Demo components/grid 的 table#grid-table 第一列 1/2/3 单元格，待确认列头关联结构并修复。8317 可见 Chrome 已登录并打开 Grid Action Matrix；仍需修复后复测完整 QuickEdit、Grid axe、200% 原生浏览器缩放和独立 Review。当前运行时 PHP 8.1.34 / Laravel 10.50.3。

2026-09-26：独立代码审查发现：仅修 React compat island 标签仍未修复真实 Grid，因为 GridViewModel 将 RowSelector::renderHeader() HTML label 标为 native 并 strip_tags 清空；真实 payload 回归及服务端列头保留正在修复，相关 React 单测暂不作为通过证据。assets 上轮 browser Lighthouse category 虽显示 100，但 td-has-header 子审计仍失败。modern:verify 首次被 dependency-census stale 阻断；coverage generator 已将当前发布 CSS 哈希顺序对齐，尚未重跑全门禁。

2026-09-26：代码 Review 首轮发现真实选择列 header payload 被 strip_tags 清空；修复后独立 Reviewer 复审通过。AssetModernization 8/8（60 assertions），ModernRenderer 10/10（51），Grid Vitest 5/5；`npm run modern:verify` 全通过：coverage 303/296/870、Grid/Form registries、43 tokens、baseline 140 Blade/821 assets、PHP static、Bootstrap absence、typecheck、Vitest 16 files/107 tests、生产产物 JS 98,059 gzip / CSS 12,360、Chrome harness self-test。PHP 8.1.34 / Laravel 10.50.3 Demo 本地发布资源和 view cache 已更新。可见 Chrome真实操作：`__row_selector__` 暴露 Select all，点击选中行；QuickEdit form 请求 200，弹窗字段可见。Lighthouse Dashboard/Form/Grid/Layer accessibility 均100，`td-has-header` score=1 且 details=[]；报告在 artifacts/dcat-admin-demo/2026-09-26-single-renderer-current/accessibility/。`demo:browser` 81页/49 Controller/33菜单全覆盖，30响应式、22交互、页面和交互失败0、布局阻断0（24外链告警非阻断）；核心 modern browser合同25个profile/viewport capture、6个页面族通过。Step2 done。仍无法由当前 Chrome DevTools MCP设置原生浏览器缩放：Ctrl+plus被派发为页面键事件，`innerWidth=1928,dpr=1,visualScale=1` 未变化；`chrome://settings` 导航被工具拒绝。已有200%设备度量仿真不得冒充原生缩放，Step3保留未完成，Step4随后同步当前证据及仅当前环境结论。

2026-09-26：Step 4 文档已同步并回读：m11-demo validation currentRun 记录当前 PHP/Laravel、安装/publish/cache、2项 Demo PHPUnit、modern:verify、Demo 81页/30响应式/22交互、25核心浏览器捕获和4份 Lighthouse。support matrix 标记当前环境已验证；implementation matrix 保留实验态并记录自动发布证据；Epic/Project Spec 和迁移文档明确原生 UI 缩放/屏幕阅读与回滚演练仍未闭合。用户已排除其它 PHP/Laravel 组合和旧 Dusk 门禁。真实 UI 200% zoom 与人工 screen-reader reading order 为当前 release gate，Step 3 blocked，详见阻塞记录。

2026-09-26：Task 状态从 active 变更为 blocked。原因：剩余的发布级人工验收需要实际 Chrome 浏览器 UI 200% 缩放和屏幕阅读顺序证据。配置的 visible Chrome DevTools MCP 不提供浏览器工具栏缩放控制：Ctrl+Plus 被送入页面且未改变缩放，chrome://settings 导航被拒绝。现有 device-metrics emulation 仅作仿真，不能替代原生 UI zoom；需可操作浏览器工具栏的会话完成代表页面复核后恢复 Task。

2026-09-26：2026-09-26：在隔离的当前环境消费者中完成包回退与资源重发演练：Composer 从 joseph-bing-han/laravel-admin dev-next ac323a0 切换至仓库历史源码 tag 2.2.2-xebni（沙箱 path repository 映射 Composer 版本 2.2.2-beta），Laravel 保持 10.50.3；vendor:publish --tag=dcat-admin-assets --force 与 config/view/route cache 清理通过，Admin 路由 81 条，登录页及 AdminLTE CSS/JS HTTP 200。临时消费者 SQLite 文件 SHA-256 与原 Demo 一致，未运行迁移或前端构建。代表性 legacy InstallTest + SectionTest 在 SQLite 内存下达 30 assertions 后 teardown 因 Laravel 10 SQLite 多列回滚限制失败；项目 .env.testing 指向本机 MySQL laravel，当前连接报 SQLSTATE 1045，未改用其他数据库，故该套件仍未验证。真实 Chrome UI 200% 缩放与屏幕阅读顺序仍受当前可见 Chrome 工具能力限制；Step 3 与 Task 保持 blocked。

2026-09-26：2026-09-26：在隔离 Chrome 页面只读查看 Layer 页 accessibility tree：landmark 顺序为 complementary/sidebar、navigation、main、contentinfo，main 先显示页面 H1 与面包屑再显示交互和代码内容。该 AX tree 只能作为人工读屏复核的辅助结构证据，不代表真实屏幕阅读器朗读；MCP 拒绝将原始快照写入工作区路径，未生成快照文件，屏幕阅读器门禁继续未完成。

2026-09-26：2026-09-26：复核本机验收通道：PATH 中无 Orca、speech-dispatcher、spd-say、espeak 或 X11 窗口控制命令；MCP 工具清单无数据库工具。当前 Chrome DevTools MCP 仅提供页面级操作，无法控制浏览器工具栏；没有可用 AT 或 DB 通道解除剩余门禁。Task 保持 blocked。

2026-09-26：2026-09-26：核实可部署旧包来源：仓库 tag 2.2.2-xebni 及 Composer 标准化约束 2.2.2.0-xebni 均被 Composer 拒绝为无效版本；Packagist 的 2.2.2-beta 不满足 Laravel 10 约束。此前沙箱通过 Composer path repository 强制 alias 才能演练，故仅证明本地源码回退机制，未证明可部署旧制品。该发行物门禁保持未完成。

2026-09-26：2026-09-26：用户要求修正 Laravel 10 回退制品。已核实 Packagist dcat/laravel-admin 2.2.3-beta 的 Laravel 约束包含 ~10.0，而 2.2.2-beta 不包含。计划在隔离 PHP 8.1.34 / Laravel 10.50.3 消费者移除本地路径源，以真实 Packagist 包安装并验证资源重发、缓存清理和 HTTP smoke；成功后同步 M11、README 与迁移说明。浏览器原生 200% 缩放、人工屏幕阅读和代表性 legacy 数据库测试仍作为独立门禁。

2026-09-26：2026-09-26：完成 Packagist 回退制品实演：在隔离 Demo 副本中移除 joseph-bing-han/laravel-admin dev-next 与本地仓库覆盖，直接安装 dcat/laravel-admin 2.2.3-beta，Composer 锁定 source ref f8ef27cc4d6a79dc346f89d0efb925d4e28ee763，Laravel 保持 10.50.3。平台检查、package discovery、vendor:publish 与 config/view/route cache 清理通过；121 条 Admin 路由，登录页及 AdminLTE CSS/JS 为 HTTP 200。SQLite SHA-256 与原 Demo 一致，未运行迁移、数据库命令或前端构建。故回退制品门禁已通过，2.2.2-beta 不再作为 Laravel 10 回退版本。composer audit --locked 仍报告影响 Laravel 10.50.3 的三项 advisory：PKSA-m5cs-t1y6-qpcs（medium）、PKSA-3r5d-mb8f-1qw9（high）、PKSA-mdq4-51ck-6kdq/CVE-2026-48019；原生浏览器 UI 缩放、人工读屏及代表性 legacy regression 仍未完成，Task/Step 3 继续 blocked。

2026-09-26：2026-09-26：补充 Composer 干净解析边界：默认稳定性、无 lock 的 Laravel 10.50.3 最小消费者被 Composer 2.10.3 安全公告策略阻止，原因是 Laravel Framework advisories；未绕过策略。已存在 Laravel 10.50.3 lock 的隔离 Demo 可将 fork 依赖切至公开 2.2.3-beta 并完成回退 smoke。M11 将此区分记录；用户已要求禁用 Composer resolver advisory blocking，Composer audit 仍显示三项公告；200% UI 缩放、人工读屏和 legacy regression 继续阻止 Task 完成。

2026-09-26：2026-09-26：用户明确要求按示例设置 Composer `config.policy.advisories.block=false` 并允许指定插件。将把配置加入仓库根 composer.json，再用相同策略验证无 lock 的 Laravel 10.50.3 消费者可解析 2.2.3-beta；Composer audit 输出仍保留为可见安全信息，不据此伪报审计通过。

2026-09-26：2026-09-26：按用户要求在根 composer.json 加入 config.policy.advisories.block=false 及指定 allow-plugins。composer validate 通过；默认 stability 的无 lock Laravel 10.50.3 consumer 在自身根配置相同 block=false 后从 Packagist 成功解析并安装 dcat/laravel-admin 2.2.3-beta。composer audit 仍 exit 1 并报告三项影响 Laravel Framework v10.50.3 的 advisory；按用户决定仅关闭 Composer resolver 的阻断，审计记录仍保留。包级 config 不会传递到下游 consumer。Task 继续 blocked：原生 UI 缩放、人工读屏及代表性 legacy regression 尚未完成。

2026-09-26：2026-09-26：最终核对通过：根 composer.json 完整保存用户提供的 optimize/preferred/sort、policy.advisories.block=false 和两项 allow-plugins；composer validate 与 no-lock consumer 安装通过，audit 仍显示三项 advisory。M11 当前/历史门禁已分离；JSON、git diff --check 与 CodeStable scan 无 findings。活动 Task 仍因真实 200% UI 缩放、人工读屏和代表性 legacy regression 未完成而保持 blocked。

2026-09-26：Task 状态从 blocked 变更为 active。原因：维护者已明确决定本 Task 按当前记录视为完成并要求归档；遗留发布门禁不记为通过，仍在 M11 保持开放。

2026-09-26：维护者明确决定将 Step 3 与本 Task 按当前记录视为完成并归档。该决定仅表示接受本 Task 的剩余范围，不表示未执行的发布门禁通过：真实浏览器 UI 200% 缩放、人工屏幕阅读顺序和当前环境代表性 legacy regression 仍是 M11 外部门禁；actualBrowserUiZoomVerified=false，legacy suite 仍 blocked-by-environment。M11 releaseStatus 继续为 not-release-candidate，能力状态保持 experimental。归档路径映射：codestable/tasks/active/modern-view-single-renderer-demo-coverage.md -> codestable/tasks/archived/2026-09-26-002-modern-view-single-renderer-demo-coverage.md；归档后将更新 Epic Spec 的 Task 引用及验收边界。

2026-09-26：Task 已标记 completed，等待归档。

2026-09-26：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：14f4390fa60d358838a05d97900082e7652aff4b33ea59931b20f39ac0f06d60
