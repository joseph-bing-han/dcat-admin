---
doc_type: task-list
task: view-layer-bootstrap-free-refactor-implementation
goal: 完成 View 现代化 Epic B0-B12 Bootstrap-free 重构计划，在保留旧版服务与升级契约的同时，提供浏览器、无障碍、支持矩阵、依赖缺席和发布证据
status: archived
workflow: implementation
owner_skill: cs
created: 2026-09-04
updated: 2026-09-26
archived: 2026-09-26
related_docs:
  - codestable/epics/001-o-view-layer-modernization/spec.md
  - codestable/epics/001-o-view-layer-modernization/compatibility-contract.md
  - codestable/epics/001-o-view-layer-modernization/ui-ux-spec.md
  - codestable/epics/001-o-view-layer-modernization/implementation-capability-matrix.json
---

# 完成 View 现代化 Epic B0-B12 Bootstrap-free 重构计划，在保留旧版服务与升级契约的同时，提供浏览器、无障碍、支持矩阵、依赖缺席和发布证据

## 1. 任务目标

完成 View 现代化 Epic B0-B12 Bootstrap-free 重构计划，在保留旧版服务与升级契约的同时，提供浏览器、无障碍、支持矩阵、依赖缺席和发布证据

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] B0 冻结完整 View 与兼容性盘点，并协调契约漂移
- [x] B1 统一 Dcat UI 令牌和不依赖 Bootstrap 的基础组件
- [x] B2 建立 payload-first 服务端 ViewModel 契约
- [x] B3 交付 Bootstrap-free 外壳、布局和导航
- [x] B4-B5 完成原生 Grid 读取与交互路径
- [x] B6-B7 完成原生 Form 基础与高级路径
- [x] B8 将 Show、Tree、Widgets、Dashboard、Login 和 System 视图改为原生实现
- [x] B9 将 jQuery 与原生 Dcat runtime 隔离
- [ ] B10 交付旧版 Bootstrap 界面兼容 facade 和升级夹具
- [x] B11 移除 Bootstrap/AdminLTE 核心资源，并将 classic safety net 外置
- [ ] B12 执行支持矩阵、完整浏览器、无障碍、泄漏、bundle、CSP、回滚和依赖缺席门禁
- [ ] 同步能力矩阵、Epic 证据、迁移文档和发布就绪情况

## 4. CodeStable 文档索引

- `codestable/epics/001-o-view-layer-modernization/spec.md`
- `codestable/epics/001-o-view-layer-modernization/compatibility-contract.md`
- `codestable/epics/001-o-view-layer-modernization/ui-ux-spec.md`
- `codestable/epics/001-o-view-layer-modernization/implementation-capability-matrix.json`

## 5. 执行步骤

### 1. B0 冻结完整 View 与兼容性盘点，并协调契约漂移

- 状态：done

### 2. B1 统一 Dcat UI 令牌和不依赖 Bootstrap 的基础组件

- 状态：done

### 3. B2 建立 payload-first 服务端 ViewModel 契约

- 状态：done

### 4. B3 交付 Bootstrap-free 外壳、布局和导航

- 状态：done

### 5. B4-B5 完成原生 Grid 读取与交互路径

- 状态：done
- 断点：B4-B5 done

### 6. B6-B7 完成原生 Form 基础与高级路径

- 状态：done
- 断点：B6-B7 done

### 7. B8 将 Show、Tree、Widgets、Dashboard、Login 和 System 视图改为原生实现

- 状态：done

### 8. B9 将 jQuery 与原生 Dcat runtime 隔离

- 状态：done

### 9. B10 交付旧版 Bootstrap 界面兼容 facade 和升级夹具

- 状态：in-progress
- 断点：B10 current

### 10. B11 移除 Bootstrap/AdminLTE 核心资源，并将 classic safety net 外置

- 状态：done
- 断点：classic 包、旧渲染门禁、core 内 Bootstrap/AdminLTE 源码与编译产物均已删除，旧固定路径改由 Dcat facade 接管，`modern:bootstrap-absence` 静态门禁已接入 modern:verify；真实 consumer 浏览器复测归入 B12

### 11. B12 执行支持矩阵、完整浏览器、无障碍、泄漏、bundle、CSP、回滚和依赖缺席门禁

- 状态：pending

### 12. 同步能力矩阵、Epic 证据、迁移文档和发布就绪情况

- 状态：pending

## 6. 中断恢复提示

2026-09-26 用户决策：彻底去除旧版 UI，取消 classic 回退，全面使用新版渲染器。B11 目标改为删除 classic 包与旧渲染门禁（enabled/family/capability/route allowlist、__dcat_legacy、bootstrap_free_fallback），并物理移除 core 内 Bootstrap/AdminLTE 源码与产物；新版 compat 成为唯一降级路径。历史断点：renderer 切换守卫、classic package 与 core `vendor:publish` 聚焦门禁已覆盖；8302 的跨 renderer 行为 smoke 现已通过，但该 Laravel 10 skeleton + 仓库 Laravel 9 vendor 的混合 consumer 不能代替支持矩阵证据。旧 public manifest 曾指向 dcat-modern-BPckmAfa.js 并造成 404；按包契约执行 `vendor:publish --tag=dcat-admin-assets --force` 后，modern/modern-compat public manifest 与当前本地 dist 的 manifest 和 JS SHA-256 一致。可见 Chrome page 5 验证 classic PJAX 发起跨 renderer document GET，Back 恢复 renderer=2 的 classic 文档，Forward 返回 renderer=1 的 native 文档且 history length 不变；page 5 已还原原始 classic URL。当前 package modern renderer 由 M11 授权设为默认且 `bootstrap_free_fallback` 仍关闭；这不等于 GA。用户决策已执行：classic 包、旧渲染门禁与 core 内 Bootstrap/AdminLTE 源码/产物均已物理退场，旧固定路径由 Dcat facade 接管，静态零依赖门禁已接入 modern:verify。剩余：B10 的正式发布/真实 consumer 门禁（升级浏览器脚本已按无 classic 契约重写但尚未在真实 consumer 运行）、B12 的 Laravel 8/9/10 支持矩阵（Laravel 8/10 advisory 仍阻断）、200% 缩放与全量无障碍人工复核。

## 7. 完成与归档记录

2026-09-04：Task 已创建。

2026-09-04：B0 完成：生成包含 302 个条目的覆盖率 registry，涵盖 139 个 Blade、68 个 Form 字段、28 个 Grid displayer、36 个 Grid filter 和 31 个 Widget；冻结 992 个依赖信号文件；在基线门禁中协调 compatibility-v3 漂移；修正 Grid 响应式契约和令牌漂移。证据：npm run modernization:baseline、modern:coverage、modern:tokens、modern:typecheck、modern:test 全部通过（43 项测试）。

2026-09-04：B1 本地完成：引入单一生成式 Dcat 令牌源，落实冻结的品牌、字体、圆角和阴影契约；新增不依赖 Bootstrap 的 Textarea、Panel、Card、Error，以及可复用的 Modal/Drawer/Toast 界面；恢复保留表格结构的 Grid 响应式行为，并在浏览器门禁中覆盖计划内的五种视口。证据：modern:tokens、modern:typecheck、modern:test（44 项测试）、modern:build 和 modern:artifact 均通过。完整浏览器和无障碍晋升证据仍由 B12 专项门禁负责。

2026-09-04：B2 完成：引入一方 ViewModel schema/payload 1.1，包含 renderer、fallback 范围、资源、compatRequirements、已知类型和显式 slot；Manager 在保持扩展 1.x envelope 兼容性的同时规范化所有一方 payload。Layout、Grid、Form、Show、Tree、Widget、Login/System 和整页界面现均会输出可审计的服务端 payload；Grid 列/行以及 Form 字段的 native/compat 分类由服务端驱动。证据：PHP 语法检查、modernization:baseline、modern:typecheck 和 modern:test（44 项测试）均通过。

2026-09-05：恢复实施。当前工作树变化后，依赖盘点从 992 个更新为 997 个信号文件。基线门禁 npm run modern:verify 通过，涵盖 coverage/tokens/baseline/php-static/typecheck、44 项 Vitest 测试、native+compat 生产构建、artifact 预算和 Chrome harness 自检。
2026-09-05：B3 完成：Bootstrap/AdminLTE-free 原生外壳现可保留纵向、横向和整页锚点及 PJAX 语义；侧栏展开宽度为 260px，折叠态按旧版 14px 根字号维持冻结的 5.4rem 规格；支持原生桌面/移动端侧栏切换、浮动/隐藏 navbar 配置，并执行外壳级禁止网络请求检查。修复了 `Layout\Content::applyClasses()` 中历史遗留的双重映射问题，该问题会清空已映射的 navbar class。新增聚焦的 `--shell-only` 浏览器契约路径，并让旧版 PJAX 断言等待实际根节点替换，避免导航 load-state 竞态。证据：`npm run modern:verify` 通过（44 项 Vitest 测试及 build/artifact/self-test）；符合 CI 的 consumer 命令 `node scripts/view-modernization-browser.mjs --shell-only` 通过 PJAX、稳定锚点和 7 种 shell 配置检查。完整浏览器套件现已通过 B3，首次失败发生在 B4 Grid 无障碍检查中的无名称纯图标控件。
2026-09-05：B4 完成：Grid 读取路径现已对普通单元格、可排序表头、分页、空状态、复杂表头、安全的内置只读 displayer（Button/Label/Badge/Link/Image/Progress/Download）、安全的原生 Expand 和固定列采用 payload-first 方式。暂不支持的/自定义 displayer 保留为显式的单元格级 compat island；现代固定列使用带测量 sticky offset 的单一 React table，取代旧版 jQuery 三表克隆。新增专用夹具，覆盖长/宽单元格、空数据、多页分页、排序、展开、复杂表头、固定列和全部五种冻结视口。证据：`npm run modern:verify` 通过（44 项 Vitest 测试、PHP/Blade 静态检查、typecheck、native+compat 构建、artifact 和浏览器自检）；`npm run modern:browser` 通过 25 组配置/视口截图和 6 类现代页面；`--grid-read-only` 通过 payload 分类、排序/分页、展开、复杂/固定/空/多页数据和五视口溢出检查。当前目标转为 B5 Grid 交互、筛选和操作。

2026-09-05：B5 筛选 registry/浏览器批次完成：修复聚合筛选夹具，添加 SelectTable/MultipleSelectTable 覆盖样例，将全部 36 个 Grid filter class 纳入 grid-filter-matrix 浏览器覆盖，并在 Chrome 中验证 28 个 label、29 个具名控件、原生 drawer 焦点约束、Scope URL 和 X-PJAX GET 提交。

2026-09-05：B5 完成：Grid 交互归属、原生查询/导航路径、显式 compat island 和能力覆盖均已闭合。全部 28 个 displayer、36 个 filter 和 22 个 action/tool class 均已登记状态并提供浏览器证据。新增具名 Grid 选择元数据、含显式 CSRF 的 QuickCreate compat section island、原生 PerPage payload、多 Grid 相邻 payload 绑定、动态 popover 兼容、Dcat 自有 layer/DialogForm 兼容，以及 query fallback key 规范化。证据：5 个 Grid 聚焦 Chrome 套件通过；含 45 项 Vitest 测试的 npm run modern:verify 通过；包含新增筛选/兼容/操作矩阵的完整 npm run modern:browser 通过。

2026-09-05：B5 重试后重新验证：完整 Grid 浏览器矩阵通过，覆盖 28 个 displayer、36 个 filter 和 22 个 action/tool。包含 45 项 Vitest 测试及 PHP 8.0 静态检查/typecheck/build/artifact/self-test 的 npm run modern:verify 通过；npm run modern:browser 通过 25 组配置/视口截图和 6 类现代页面。修正静态 readonly 语法门禁，避免将 HTML 属性字符串 readonly 误判为语法问题。

2026-09-05：B6 基础纵向切片通过：基础夹具字段 17/17 均由服务端 payload 驱动并采用原生实现（text/textarea/number/email/url/password/tel/hidden/display/static select/radio/checkbox/switch/date/time/disabled/read-only），且没有 select2/switchery/bootstrap-datetimepicker/bootstrap-number-input/bootstrap-validator 网络请求。Modern Form 现从 payload 渲染控件，不再移动旧版节点；保留基础设施隐藏字段和 X-CSRF-TOKEN header 语义，使用原生约束验证，展示并聚焦 422 字段错误，阻止重复提交，保留编辑 POST+_method=PUT、键盘顺序及 683px 缩放代理下的内容边界。专用 `--form-basic-only` Chrome 门禁通过。

2026-09-05：B6 布局纵向切片通过：FormViewModel 现会输出显式的 stack/rows/columns/row/block/tabs 树及唯一字段 slot 引用；React 渲染 Dcat 自有的 12 列/Grid 布局，不再推断或移动旧版 block/tab DOM。Row/column/block/tab 夹具通过 4 种配置 x 5 种冻结视口检查，页面/content/form 均无溢出。BlockForm 不再把整个布局放入 compat island。原生 tabs 保留 hash 导航；遇到 422 时保留已输入的值、切换到错误所在 tab、显示服务端错误并聚焦无效字段。

2026-09-05：B6 重试后完成：Form 基础和布局路径均已闭合。基础夹具现覆盖 18 个 payload-first 原生字段，包括 Id；Modern Form 不再暴露 Bootstrap-validator 生命周期标记，保留原生约束验证/422 处理，Reset 可恢复初始值，Save & View 保留 after-save=3，提交加载状态使用 aria-busy 和 Dcat 自有 loading facade，阻止重复写入，并保留 CSRF header、编辑 POST+_method=PUT 及 Back 的浏览器历史语义。新增完整 Form 能力 registry，覆盖全部 68 个 Form 字段文件：16 个 B6 原生字段有浏览器证据，另有 52 个明确标记为 B7 compat-pending。证据：`--form-basic-only` 和 `--form-layout-only` 通过；含 46 项 Vitest 测试及 PHP 8.0 静态检查/typecheck/build/artifact/self-test 的 `npm run modern:verify` 通过；完整 Chrome 命令 `node scripts/view-modernization-browser.mjs` 在纳入 B6 门禁后通过 25 组配置/视口截图和 6 类现代页面。断点推进到 B7 高级字段。

2026-09-05：B7 原生批次 1 完成：16 个高级 Form 字段（Currency/Decimal/Ip/Mobile/Rate/Datetime/Month/Year/Color/MultipleSelect/Listbox/Timezone/Range/DateRange/DatetimeRange/TimeRange）现使用 payload-first 原生控件，并保留协议要求的名称/值。原生实现不再加载 Inputmask、Select2、bootstrap-datetimepicker、bootstrap-duallistbox 和 colorpicker 脚本；新增 Dcat 自有的 color/dual-list/range/affix 控件。修复 Month 的 PHP 格式语义和顶层 Content row 的 Bootstrap-free 全宽契约。专用 `--form-advanced-native-only` Chrome 门禁通过 create/edit/422/submit、禁止网络请求数为 0、3 轮 PJAX 清理后无重复 ID/插件节点，以及 390px 下无溢出。Form registry 现为 16 个 B6 原生 + 16 个 B7 原生 + 36 个 B7 待处理项。

2026-09-05：B7 vendor adapter 批次完成：Autocomplete、TinyMCE Editor、File/Image/MultipleFile/MultipleImage WebUploader、IconPicker、editor.md Markdown、ionRangeSlider Slider、Select2 Tags 和 jsTree Tree 均作为字段级 vendor island 运行于 Modern Form。新增可冒泡的 Form 字段清理生命周期及幂等插件销毁探针、显式 WebUploader timer/uploader teardown、Autocomplete 委托事件释放、Slider 延迟初始化移除、TinyMCE 异步初始化/全局 sink 清理、editor.md teardown、IconPicker 限时等待资源就绪后初始化/清理，以及 provider 专属 Map 清理钩子。修复 PJAX destroy 后 WebUploader 成功统计的竞态。专用 `--form-advanced-vendor-only` Chrome 门禁通过：覆盖 11 个 compat 字段、真实 vendor 交互、使用 _file_/upload_column/_token/_id 协议的模拟上传失败后重试成功、页面错误数为 0，以及 3 轮 PJAX 后没有残留的 Autocomplete/Select2/IconPicker/TinyMCE body 节点。

2026-09-05：B7 重试后完成：68 字段 Form registry 已完整冻结，待处理项为 0：16 个 B6 原生字段，另有 B7 的 16 个原生字段、11 个 vendor adapter、15 个 compat island 和 10 个 host/helper 条目，每项均有具体浏览器夹具/证据。复杂 Dcat 字段通过 callback/cascade/load-fields/fieldset/key-value/list/nested/SelectTable 的创建、编辑、验证和清理流程；可选 Map/Captcha 使用隔离的 provider/依赖测试 stub，通过交互、422、编辑和三轮 PJAX 销毁检查，且未向核心添加可选依赖。修复异步 SelectTable 夹具自动加载，并用 Modern 自有 compat plugin facade 替换不匹配的旧版 Loading jQuery 界面。聚合无障碍检查发现并修复窄屏 Form/Show/Tree 图标控件无名称问题及 Tree 目标尺寸语义。最终证据：4 个高级 Form Chrome 门禁全部通过；含 46 项 Vitest 测试及 PHP 8.0/static/typecheck/build/artifact/self-test 的 `npm run modern:verify` 通过；完整 Chrome 聚合以退出码 0 结束，覆盖 25 组配置/视口截图和 6 类 Modern 页面。断点推进到 B8 Show/Tree/Widgets/Dashboard/Login/System 原生归属。

2026-09-06：恢复实现：scan 无冲突，唯一 active Task 从 B8 继续。保留工作区既有 B0-B8 改动；当前原生 Tasks 工具不可用，以 Task 同步区为运行正本。按用户本次完成整份任务的授权逐批推进 B8-B12，每批记录证据，不自动 commit/push/部署或关闭 Epic。当前 modern:typecheck 与 modern:test（55 tests）通过，先收束 B8 浏览器证据。

2026-09-06：B8 验证批次：Show 与 Tree 专项 Chrome 用例通过；Widget/System/Login 原用例通过，覆盖登录成功/失败/remember/logout、异常展开、禁用 core JS 后服务端登录与异常 fallback。可见 chrome-devtools 独立检查发现兼容 Modal 焦点未进入，已补齐焦点约束、Esc、焦点返回、取消事件与 dispose 清理，并追加浏览器断言；正在复测及检查 Demo 实际入口。

2026-09-06：B8 修复批次完成：Modal 焦点/Tab/Esc/返回焦点通过；为隐藏 Select2 补最大尺寸和滚动容器定位，修复实际 Demo 横向溢出；Grid 菜单固定定位且保留滚动，补独立图标资源和 Columns 标签；ApexCharts 经显式 compat 生命周期创建/销毁，PJAX 不再保留旧实例。Demo 81/81 页面、25/25 响应式检查及 18/18 交互分别通过（artifacts/dcat-admin-demo/b8-20260906-fixed、b8-chart-cleanup）。移除 Show/Tree/Form 的 Gen1 推断式 DOM parser，缺 payload 的自定义内容整体保留，原生路径仍使用 payload；相应测试改为真实协议/节点身份/原生 Tab 行为。50 项 Vitest、TypeScript、构建和原体积门禁通过：core JS gzip 101552 bytes，CSS 7847 bytes。正在运行完整聚合门禁和传递影响的浏览器回归后推进 B9。

2026-09-06：本次 Goal 恢复：scan 无 finding；从 B8 断点继续。上次静态聚合门禁通过，浏览器聚合停在 Widget Gen1 原地增强断言，与 B8 已实现的 payload 原生结构冲突，需更新为原生与兼容节点身份分别验证。随后继续 B9-B12。原生 Tasks 工具当前不可用，保持 Task 同步区为唯一运行镜像；工作区既有实现与用户修改全部保留。

2026-09-06：B8/B9 传递修复：更新 Widget/System 聚合断言为 payload React 边界；Grid 兼容回归定位到重复 compat 载入替换 jQuery 导致 QRCode 插件丢失，改为复用实例后专项通过。B9 已接入唯一原生导航模块，增加并发取消、响应提交前清理、历史恢复、顺序资源加载与事件桥；保留失败导航输入、修复 Dcat.init 动态根节点匹配和 observer/timer 清理、恢复 Admin::headerJs。19 项导航/runtime/bridge 聚焦测试通过，生产构建通过；继续真实浏览器压力与完整回归。

2026-09-06：B9 原生 runtime 浏览器穿刺通过：纯 Form 首屏仅 core JS，window.jQuery 为 undefined；20 次 PJAX 后节点 466→466、roots 1→1、overlay 1、observer/timer/pending request 均为 0。并发旧响应不提交，失败导航保持输入与节点 identity，Back/Forward 保持 runtime，native→compat 按需加载一次 jQuery，历史 pjax 事件严格按 start/send/beforeReplace/success/complete/loaded/end 顺序触发。Form 提交/422/after-save 已移至 native module，23 项聚焦单测通过；补齐 B6 的 busy 标记契约后继续传递回归。

2026-09-06：B9 传递回归修复完成：Raphael 覆盖 window.Element 导致按容器卸载失效，改用保留的 DOM 构造器并加入 scoped-unmount 回归。基础 Form 18 字段、422/after-save/重复提交/CSRF/Back 专项通过；高级 vendor 11 字段及三轮 PJAX 零残留通过。移除 Grid 最后 Gen1 推断 parser，自定义无 payload 内容保留原节点；RowSelector/QuickSearch/ColumnSelector/Filter/Batch 的已原生化初始化不再加载 jQuery。Button/Switch 使用同一 React Aria 的底层 hooks 并验证 pending/disabled/change 语义，core gzip 101383 bytes，原 102400 上限通过。普通工具 helper 留在 core，异步旧字段 helper 与 Slider 归入显式 compat。正在执行完整浏览器与静态聚合。

2026-09-06：B8、B9 完成：npm run modern:verify 通过（62 项测试、PHP/Blade/typecheck、production core+compat build、原体积门禁、Chrome self-test）；完整 Chrome 聚合通过 25 组 profile/viewport 与 6 页面族，并包含全部 Grid/Form/B8/runtime/a11y/rollback 专项。纯 Form 与 Grid 均不加载 jQuery，20 次 PJAX 无结构/observer/timer 增长。证据 artifacts/bootstrap-free/b9-verify.log、b9-full-browser.log、b9-browser.log；进入 B10 compatibility facade/upgrade fixtures。能力晋升保留到 B12 完整支持矩阵与发布验证。

2026-09-06：本次 Goal 恢复：scan 无 finding，唯一 active Task 从 B10 继续。B8/B9 现有聚合证据有效，保留全部工作区改动；原生 Tasks 工具未提供，继续维护本 Task 同步区。后续完成兼容 facade/upgrade fixtures、核心依赖移除与外置 classic、完整支持矩阵和发布门禁，不自动 commit/push/部署或关闭 Epic。

2026-09-06：B10 facade/upgrade 批次通过：Dcat 自有 modal/dropdown/tab/collapse/popover/tooltip/button 统一生命周期，补齐取消事件、键盘、焦点、边缘定位和 PJAX dispose；324 CSS 类契约及兼容 descriptor/开发期脱敏诊断已建立。三类冻结业务用例（标准 Card、Blade override、扩展 alias/inline/Navbar/extra HTML）通过 15 组视口和原生 PJAX 清理。发现并修复旧 Blade 内联脚本先于 jQuery 的真实升级回归：按实际脚本声明提前装载 compat，不改变原脚本执行时机。6 项聚焦单测、typecheck、B8 Widget/System/Login、Grid compat 全专项和原体积预算通过；固定路径 facade/字段插件适配与 classic 外置进入下一批。

2026-09-06：本次 Goal 恢复：scan 无冲突，从 B10 固定路径 facade/字段插件适配继续，随后完成 B11/B12。保留既有改动与有效验证证据；原生 Tasks 工具不可用，以本 Task 同步区为运行镜像。

2026-09-24：2026-09-24：用户反馈现有布局保持正确，但 modern 原生 UI 尚未达到 ui-ux-spec.md 1.0.0 的现代视觉目标。Epic 已补充视觉验收：先修基础 Form 的原生字段/状态/动作，保持标签列宽、字段顺序、动作位置和协议；五视口截图、几何与交互验证后，再扩展同类页面族，并继续 B10-B12。令牌与稳定布局契约不变。

2026-09-24：2026-09-24：真实 Demo http://127.0.0.1:8301/admin/form 可见核对发现 shell 视觉尺度偏差：顶部 116px、Logo 225px、标题 28px。将 Modern shell 尺度修正纳入本轮视觉批次；保持原区域关系、动作顺序与 260px 侧栏。

2026-09-24：2026-09-24：Modern shell 视觉批次完成：仅兼容 facade 的 modern 作用域收紧 Logo/顶栏、20/28 页面标题、副标题、横向面包屑和侧栏菜单密度/焦点。npm run modern:build 通过。真实 Demo /admin/auth/users/create 五视口复核：顶栏 53-54px、Logo 图像 35px、侧栏 260px、菜单桌面 34px/移动 44px、标题 20/28，所有视口无页面横向溢出；1440/390 截图已目视。原区域与动作顺序未改变。Form 初始错误/必填配置仍在审查回修，B10 路径 facade 仍在测试。

2026-09-24：2026-09-24：Modern Form 原生视觉/错误批次完成并经独立 Review 回修：标签/输入/focus/disabled/error 使用既有 Dcat token，required(false) 不误显星号，多错误逐项保留，首屏错误在无既有焦点时聚焦首个控件，组控件名称关联。保持字段布局及提交协议。npm run modern:build、modern:typecheck、modern:test（73/73）、modern:artifact（JS 101803、CSS 10045 gzip bytes）、modern:php-static、Chrome --shell-only（7 profiles）与 --form-basic-only（18 native fields、422/键盘/重复提交）通过。独立 Review 的 checkbox 组 required 既有语义缺口留待后续协议切片。B10 固定 URL 仍有 HTTP 静态文件与 HEAD script 先执行阻断点，不能标记完成。

2026-09-24：2026-09-24：B10 资源批次首次独立 Review：PHP helper 旧路径映射与 3 upgrade fixtures/15 视口通过，但硬编码 HTTP 静态 URL 仍返回旧 bundle，HEAD 内联脚本顺序和纯 JS alias 注入需回修，B10 保持 in-progress。裁决：旧 URL 静态发布 Dcat facade，classic 走独立可选 namespace；同 URL 不做按请求双模式。HEAD 顺序和 alias 正在修复。共享 CSS 后全量 Chrome 首次复测在 B9 runtime 的纯 Grid jQuery absence 失败，专项 --runtime-only 复现；真实 Grid 页面只加载 modern+modern-compat，疑似 body fallback 的 data-toggle 被 Asset::prepareHtml 过宽识别，正在回修后复测。--accessibility-only 4 families 通过。

2026-09-24：2026-09-24：B10 PHP helper/HEAD/混合控件兼容批次经二次独立 Review 收束：逐一标记已由 native 接管的第一方 data-toggle，未标记旧扩展仍加载 compat；纯 Form/Grid 无 jQuery。PHPUnit 5/31、--runtime-only（20 PJAX）、--upgrade-only（3 fixtures/15 viewports）、modern:php-static 和完整 Chrome browser（25 profile/viewport、6 页面族）均通过。硬编码 HTTP 静态旧路径仍返回旧 bundle，需 B11 在 classic 可选包接管后物理发布 facade；B10 保持 in-progress。Grid 视觉批次初验的 read/interactions 通过，但独立 Review 发现 selected 色、未定义 token、badge 对比和分页空按钮，正在回修。

2026-09-24：2026-09-24：UI 视觉批次阶段验收：shell 顶栏/Logo/标题/面包屑/侧栏、原生 Form 字段与首屏错误、原生 Grid 工具栏/表格/标签/分页/触控尺寸已按 ui-ux-spec.md 1.0.0 收敛且未改变稳定区域、列/字段/动作顺序。Grid 独立 Review 的 selected 背景、分页空箭头、历史语义色、移动 44px、工具栏分组已修复；390px Expand 实测 56x44。npm run modern:verify 完整通过：74 Vitest、PHP/Blade、typecheck、build、artifact（JS 102363/102400 gzip，CSS 10730）、Chrome self-test；完整 Chrome browser 25 profile/viewport 与 6 页面族、B10 upgrade 3 fixtures/15 视口、Grid read/interactions、runtime-only 已通过。剩余视觉风险：Label 自定义背景使用 CSS var() 时 Canvas 无法解析，#7f7f7f 等临界灰在当前 heading/on-primary 两个令牌中最高不足 WCAG 4.5:1；保留前景原配置，不能宣称所有自定义标签 AA。B10/B11/B12 持续 active，静态旧 URL 物理 facade、classic 外置和支持矩阵未完成。

2026-09-24：2026-09-24：Show/Tree/Widget/Dashboard 视觉批次完成本地验证：Show 原生值移除旧式框，Tree 行分隔及动作层级收敛，Dashboard 标题 20px、surface 与链接样式收敛，Widget 工具按钮桌面 34px/触控 44px。Tree 390px 浏览器断言从 24px 加强到 44px，发现工具栏被通用 btn-sm 优先级覆盖后修复。npm run modern:verify 通过（74 Vitest、PHP/Blade、typecheck、build/artifact/self-test），JS 102321/102400、CSS 11295 gzip；Show/Tree/B8 专项与完整 Chrome browser（25 组布局/视口、6 页面族）通过。B10-B12 未完成；Grid 自定义 Label 对比度、Gen2 默认准入及独立 classic 分发仍待收束。

2026-09-24：2026-09-24：Show/Tree/Widget/Dashboard 视觉批次独立 Review 后回修并闭合本地门禁。Dashboard Modern 外壳去旧 bg-primary；Tree refresh 保留当前 URL 查询串，768px 改为分行布局且五视口操作目标达 44px/34px；Widget 保留自定义 id/class/style 与 noPadding，col-md-6 浏览器实测宽度比 0.492，DataCard warning 色可见；Dropdown click()->map() 富文本首项与选择一致。Show/Tree/Widget 五视口截图、横向溢出、操作尺寸和 Dashboard 标题计算样式加入完整门禁。npm run modern:verify 通过（74 Vitest，PHP/Blade、typecheck、build、artifact、自检），JS 102348/102400、CSS 11349 gzip；Show/Tree/B8 专项及完整 Chrome browser 25 组布局/视口、6 页面族通过；cs runtime scan 无 finding。B10-B12、Grid 自定义 Label 对比度、Gen2 准入及 classic 分发仍待完成。

2026-09-25：2026-09-25：从指定线程对应的唯一 active Task 恢复，scan 无 finding。延续 B10-B12 和现存视觉验收约束，保留工作区改动及 9-24 可靠验证证据；先核对旧静态 URL facade/classic 外置，再补齐支持矩阵、依赖缺席和发布验证。原生 Tasks 未提供，以本 Task 同步区为运行镜像；不自动 commit/push/部署或关闭 Epic。

2026-09-25：恢复当前 Task：用户再次要求改善 Untitled UI 视觉，Epic/UI 规范已先更新到 1.1.0。真实 Demo 确认 native Form 仍为 34px/4px，上传和 Select2 风格不一致；本批统一共享控件与表面令牌、导航、表单和兼容字段，五视口可见 Chrome 验证与聚焦回归后继续 B10-B12。当前无子代理/原生 Tasks 工具，不能声称独立 Review。启动本地 Demo 8301，保持既有数据和改动。

2026-09-25：视觉实现批次：新增共享控件高度/控件与表面圆角/轻阴影令牌；统一 native 和 facade 控件，表单/表格白色表面、上传和 Select2 状态，修复兼容 Grid 双勾号和无样式标签、Widget 浮层未定义 shadow token。Demo 可见检查已发现并修复上传插件高优先级白字覆盖；modern:build/artifact 通过（JS 102353/102400、CSS 11917 gzip）。正补五视口与动态状态回归；本批未晋升 capability，也未完成 B10-B12。

2026-09-26：恢复唯一 active Task，scan 无 finding。Epic 已先更新本轮范围，按用户要求继续 B10-B12 并优先收束 Untitled UI 1.1.0。9-25 ui-only 的 15 组截图和 modern:verify 通过证据可复用；完整浏览器回归在动态 CSS 变量标签前景更新处超时，先修复并补齐真实 Demo 状态检查。当前工具未提供子代理/原生 Tasks，不能派发 orchestrator 或宣称独立 Review；本 Task 继续作为唯一运行账本。使用新建隔离可见 Chrome context，保留全部既有工作区改动。

2026-09-26：视觉范围补齐：真实 Demo Widget Form 未进入 .dcat-modern-form，菜单又被后载旧主题覆盖到 1.4px。共享 facade 已补连续输入组、500 字重标签/只读状态和 8px 导航圆角；Select2/WebUploader 样式扩展到所有 modern 兼容内容。原动态标签问题在当前构建已通过 Grid read 五视口；另修 observer 覆盖显式 CSS 变量前景的缺陷，4 项 Grid 单测通过，补动态更新/卸载回归。增加 Demo 五视口兼容控件验收。首次重建暴露 core JS 102457/102400 bytes 超预算，保留原门禁，继续优化并复测。

2026-09-26：UI 静态批次通过：modern:verify 含 74 Vitest、PHP/Blade、TypeScript、构建、自检，core JS 102397/102400、CSS 12064 gzip bytes；UI 15 组截图/焦点/Select2 展开通过。Demo /form?_t=2 可见检查 40px/8px，390px 控件 44px，无页面溢出。新增五视口的 Widget Form 输入组、菜单和供应商控件断言；完整 Chrome 聚合正在执行。Epic 先补 B11 实施方向：独立可选经典资产包、固定旧路径 facade、未安装经典包时的 Bootstrap-free compat 回退，待本轮视觉回归结束后继续实现。

2026-09-26：UI 1.1.0 本地验收闭合：完整 Chrome 聚合 25 profile/viewports + 6 页面族通过，Demo 81 页面、30 响应式检查、18 交互通过。证据 ui-20260926/{verify,full-browser}.log 和 artifacts/dcat-admin-demo/ui-20260926/demo-browser-report.json；3rd-party 外部警告 24 项沿用 Demo 边界。B10/B11 开始资源隔离：13 个旧核心 bundle 已逐字节备份到可选 packages/classic，Composer 与 PHP 语法检查通过；新增固定路径生成器和无经典包/缺 manifest 回退测试。经典源码尚未从 core 移走，旧 URL 尚未替换；继续实现后再做晋升判断。

2026-09-26：B10/B11 可选分发准备通过本地穿刺：packages/classic 保存 13 个旧 bundle/许可证/资源，独立 provider 在真实 Laravel 10 消费者可注册并解析到 vendor/dcat-admin-classic，core 无 require。本地生成器在 artifacts/bootstrap-free/legacy-facades 生成并核对 3 JS/10 CSS 固定路径候选。新增默认关闭的 bootstrap_free_fallback（独立 runtime/CSS、不加载 React）通过 standard/Blade override/extension 三种真实浏览器交互及零 Bootstrap/AdminLTE 请求；9 项 PHP/52 assertions 和 modern:verify 74 Vitest 通过。明确限制：候选跨页面完整文档导航尚未满足 PJAX 冻结契约，旧 core 静态文件保留，B10/B11 不晋升；完整支持矩阵和独立 Review 工具缺失，不能称为 GA。完整 Chrome 正在最终复核，旧默认回退保持不变。

2026-09-26：全页目视追加修复：compat checkbox/radio 隐藏旧双重装饰并保留原输入，modern 使用可点击 label；双列表动作显示原 title 文本，细分隔线与表面一致。Grid auto-contrast 标记随 React 更新移除，显式颜色不会被祖先 observer 改写。74 Vitest、PHP/Blade、typecheck、原预算通过，最新 JS 102381/102400、CSS 12236 gzip；Grid read 五视口专项通过。候选回退错误提示补可访问通知并在 upgrade 三 fixture 验证，PHP 10 tests/57 assertions 通过。完整 Chrome 25 profile/viewports+6 页面族通过；Demo 首次尾部响应式遇构建过程切换产物（截图为经典回退），保持同样断言在冻结产物下重跑，19 交互已通过，等待最新完整结果。Project Spec 仅补旧基线适用范围漂移提示，Epic 未关闭，不提前毕业。

2026-09-26：最终证据：冻结产物下 Demo 81/81 页面、30/30 响应式、19/19 交互通过，4 非阻塞外部告警；final-browser.log 为完整 Chrome 25 profile/viewports+6 页面族通过。final-static.log 74 Vitest/PHP static/typecheck/artifact 通过，php-renderer.log+php-assets.log 合计 10 tests/57 assertions；Grid read 最新产物五视口通过。当前批次 whitespace 检查通过，仓库全 diff 原有 Upload/Status.js 和 Icon.php 空白问题未动。Epic/UI 规范、目标指纹及 Project Spec 漂移提示已回读；无独立 Review 工具，无 capability 晋升、commit/push/部署。B10/B11 仍 in-progress、B12 pending，总体 Task 不虚假 completed/归档；后续断点明确记录候选 PJAX 等价性、旧资源物理退场和支持矩阵。

2026-09-26：恢复后复核：Task runtime scan 无 finding，工作区干净；当前宿主可用协作子代理和 Chrome DevTools，但没有原生 Tasks/Todo。B10 PJAX 修复裁决：复用已有 NativeNavigation；fallback.ts 只需停止 dispose 导航并清空容器 selector，保留请求头、事件桥、历史及回退语义。下一批为候选 fallback 加跨页 PJAX/Back 与生命周期顺序浏览器断言，同时继续验证无 React、无 Bootstrap/AdminLTE 请求。未授权发布、删除 core 旧资源、commit/push 或关闭 Epic。

2026-09-26：PJAX 契约复核修正上一批范围：只恢复 NativeNavigation 不足以处理 renderer 路由切换。PJAX fragment 已带 data-dcat-modern-page-config；同 renderer（native/compat/classic）继续片段导航，renderer 变化或配置缺失时在 before-replace 前完整 GET，以重新选择 head runtime。候选测试覆盖 compat 同类跨页、Back/Forward、生命周期顺序，以及 compat↔native 双向完整加载；PJAX-disabled 仍依配置 selector 走完整导航。此选择保持冻结 C1/C2/C3，不改变 candidate 默认关闭、core 资源待外置或支持矩阵准入。

2026-09-26：PJAX renderer gate 首轮实现：fallback 不再关闭 NativeNavigation；导航在替换前读取当前/目标 data-dcat-modern-page-config，同 renderer 片段导航，变化或缺标记时先发 abort 再完整 GET。增加 native/compat/classic 分类 fail-closed；upgrade Chrome 夹具已补 compat 内跨页、标题、Back/Forward、PJAX header/lifecycle 顺序及 compat↔native 双向加载断言。导航单测 5/5、TypeScript、PHP/Blade static、Baseline 和 74 Vitest 通过；modern:verify 在 artifact 失败，core JS gzip 102538/102400。保留预算，做等价压缩后复测。当前 8300/8301 无 consumer 响应且 laravel-tests 不存在，继续查可用消费者入口。

2026-09-26：预算回修与服务端 renderer 标记：页面 config 输出 native/compat/classic 枚举 data 属性，Navigation 只读取枚举并在未知/变化时 fail-closed 完整 GET，避免 JSON 解析开销；PHP 覆盖三种 renderer。modern:coverage:update 刷新 1004 项 dependency census，check 通过。Navigation 单测 5/5、ModernRenderer PHP 6/6（29 assertions）、TypeScript 与 PHP lint 通过；jsdom 绝对链接提示已清理。完整 verify 曾在旧 census 停止，重跑待完成。初轮产物预算 102538/102400 后用枚举优化，预算保持冻结；当前浏览器消费者仍未找到。

2026-09-26：B10 ModernNavigation renderer 判断改为精确比较当前与目标 data-dcat-r（native=1/compat=0/classic=2），任一缺失/非法或不一致时执行完整文档加载；聚焦单测 18/18、TypeScript 通过。开始同步 classic PJAX min 发布产物并补经典首屏切换覆盖，尚未完成 artifact 与浏览器集成门禁。

2026-09-26：B10 classic PJAX guard 已同步到 source 与 dist 的非 min/min 发布文件，PJAX min 保留既有 SeaJS 前缀并用锁定环境 UglifyJS 压缩模块。四个入口 node --check、source/dist 字节一致、diff --check 通过；min 15,527 bytes（增加 1,779）。仍待真实经典首屏浏览器验证及 modern artifact 预算验证。

2026-09-26：B10 升级 Chrome gate 增加 compat→classic、classic→classic PJAX、classic→native/compat 完整 GET 与 runtime 断言；Node 语法检查通过，尚未对真实 Laravel consumer 执行。刷新 303 项/1004 文件 dependency census；PJAX 更新后的 M0 性能快照通过（legacy base gzip 353,452 bytes，较旧快照减少 519）；ModernRenderer PHP 6/6（29 assertions）及 diff --check 通过。开始重跑完整 modern:verify。

2026-09-26：M0/coverage/能力与 token registry、PHP/Blade static、TypeScript、87 Vitest 均通过；modern:verify 在 artifact 阶段失败，JS gzip 102426/102400（超 26 bytes），CSS 12360，继续优化导航 marker 校验。隔离 Chrome 使用实际 dist min 插件：classic→classic 保持同一 document 并更新 URL/title，classic→native 与 classic→compat 执行完整 document 导航并加载目标 marker；该静态 fixture 不替代缺失的 Laravel consumer/完整 upgrade gate。

2026-09-26：升级脚本 classic PJAX 已补 history push/back/forward 检查：renderer=2、probe URL 与同一 document token 在恢复时保持，Node 语法检查通过。决策记录明确 B11 退场前，无 classic 包必须选择 compat（即使开关 false），有可用独立包才走 classic；需同时验证已安装但资源未发布/缺 manifest。现代 artifact 仍超 19 bytes，代码精简与最终真实 consumer gate 继续待办。

2026-09-26：B10 隔离 Laravel 9.52.22 consumer 的 Chrome DevTools 复核通过：classic→classic PJAX 保持当前 document 并可 Back/Forward，classic→native、classic→compat、compat→native、native→classic 均触发完整文档加载且目标 renderer/runtime 正确；compat 页面标记 0、使用 fallback JS/CSS，未请求 AdminLTE/vendors。实际 min PJAX dist SHA-256 与仓库发布文件一致。当前 target-only ModernNavigation 精确 renderer 检查通过 TypeScript、聚焦 Vitest 18/18 和 modern:build；modern:artifact 仍因 JS gzip 102413/102400 超 13 bytes 失败，冻结预算不放宽。Laravel 10 consumer 安装被 Composer security advisory 阻止，未绕过。

2026-09-26：Laravel 10.10 隔离 consumer 的 Composer 2.10.3 复核：`composer update --no-install --no-scripts --no-interaction -vvv` exit 2，在 lock 写入前被默认 security audit 拦截，未创建 composer.lock、未配置 ignore、未关闭审计。候选版本 v10.10.0–v10.50.3 全排除，报告 PKSA-m5cs-t1y6-qpcs、PKSA-3r5d-mb8f-1qw9、PKSA-mdq4-51ck-6kdq、PKSA-8qx3-n5y5-vvnd、PKSA-w7xr-vk7n-rstm。Packagist advisory API 确认 PKSA-mdq4-51ck-6kdq / CVE-2026-48019 影响 `>=9.0,<10.0`、`>=10.0,<11.0`、`>=11.0,<12.0`、`>=12.0,<12.60` 及 `>=13.0,<13.10`，Laravel 10 无安全 10.x 修复版，B12 Laravel 10 主版本格保持 blocked/未验证。

2026-09-26：B10 upgrade harness query 修正并在现有 8302 consumer 重跑：首轮 standard/blade/extension URL 显式加入 ?compat_fallback=1，Node 语法检查通过；Chrome upgrade-only 已越过 compat runtime 等待，standard compat fixture 的交互与五视口断言通过。随后在既有 verifyUpgradeCompatibility 第 80 行 compat→modern 等待 [data-dcat-modern-form-renderer] 超时；浏览器日志显示目标 /tests/view-baseline/modern-runtime-form 后又导航到 ?__dcat_legacy=1，未进入 descriptors、PJAX anchor/XHR/history gate。8302 是 Laravel 9.52.22 vendor + Laravel 10 skeleton 的混合本地 consumer，不能作为 Laravel 9/10 支持矩阵通过证据；Laravel 10 CVE-2026-48019 advisory 不绕过，B12 Laravel 10 保持 blocked/未验证。

2026-09-26：B10 upgrade gate 补 compat query 与真实 compat→native anchor 路径后，在 8302 执行 `DCAT_BROWSER_BASE_URL=http://127.0.0.1:8302 node scripts/view-modernization-browser.mjs --upgrade-only`：standard compat fixture 交互/五视口断言通过；anchor 先发原始 `/tests/view-baseline/modern-runtime-form` 的 X-PJAX=true fetch，200 且 X-PJAX-URL 未改写，随后同 URL 完整 document GET 200、无 X-PJAX、响应 marker=1。等待 Native runtime 时 gate 在 upgrade 脚本第 99 行超时；只读 Playwright trace 确认 `http://127.0.0.1:8302/vendor/dcat-admin/modern/assets/dcat-modern-BIaUPjX5.js` 返回 404，随后 Manager fallback 请求同路径 `?__dcat_legacy=1`，最终 renderer=2，console 有 CreateDcat 未定义及 ready/boot 错误。8302 的 Laravel 9.52.22 vendor + Laravel 10 skeleton 是混合本地 consumer，public manifest仍指向旧 `dcat-modern-BPckmAfa.js` 且当前chunk缺失；consumer未安装 dcat-admin Composer package，`dcat-admin-assets` provider不可用，未手工写 public assets、未安装/改依赖/绕过audit。浏览器 gate 为环境阻塞，不算版本矩阵通过；B12 Laravel 10 保持 blocked。

2026-09-26：恢复 B10/B11 并复核稳定 diff。index.tsx 导出收窄后体积回归消失，modern:verify 全绿：coverage/grid+form registry/tokens/baseline、PHP/Blade static、typecheck、15 files/89 Vitest、production core+compat build、artifact、Chrome self-test；core JS gzip 98086、CSS 12236，预算 102400 恢复余量。独立复核 index.tsx：仅移除未文档化的 window.DcatModernBundle 组件导出，contracts/bridge-v1.json 与 docs 中 window.DcatReact 的 15 项 API 不变，index 显式保持 window.DcatReact = bridge；此收窄是有意变更并保留残留风险。独立复核 classic PJAX guard：resources/assets 与 resources/dist 的 jquery.pjax.js 与 jquery.pjax.min.js 逐字节一致，守卫位于成功响应 body 解析之后、history/DOM 替换之前，renderer 缺失或不一致时 locationReplace 完整加载，同 renderer 继续片段导航。B11 补齐经典包可用性判定：packages/classic provider 现在输出 published（public 目录存在与否），Manager::classicAssets() 在 manifest 为空或资源未发布时返回 null，避免把旧资源 URL 改写到 404 位置。新增 tests/Feature/ClassicAssetsProviderTest.php（2 tests/5 assertions）和 ModernRendererTest 两个回退用例；ModernRendererTest 8/8（37 assertions）、AssetModernizationTest 5/5（31 assertions）、modern:php-static 均通过。默认 renderer 未切换，候选保持默认关闭。

2026-09-26：B11 判定补充文档与最终门禁：packages/classic/README 明确安装后必须先 vendor:publish，Dcat core 会检查包内 manifest 与 public 目录，未发布或 manifest 缺失时继续使用 core 旧资源。modern:php-static（8 个 Modern PHP + 140 Blade）与 modernization:baseline（140 Blade、1077 asset 文件、353452 legacy base gzip）通过。B10 的自动化 consumer upgrade harness 仍缺环境：本地 MySQL 未运行、8300/8301 无 consumer、8302 为 Laravel 10 skeleton + Laravel 9 vendor 混合体；按现有约束不擅自启动系统服务，保留 Chrome DevTools 与静态 fixture 证据并等待用户决定验证路径。

2026-09-26：B10 browser gate review 回修：classic→native 完整文档切换后的 Back 仍要求一步返回 URL 含 `classic_probe=1` 且恢复 classic marker/runtime=2，并验证 Forward 回 native marker/runtime=1；移除该跨 document 的 document-token/BFCache 假设。classic→classic PJAX Back/Forward 的同 document token 断言保留。`node --check scripts/view-modernization-upgrade-browser.mjs` 与定向 `git diff --check` 通过；临时 consumer 静态资源刷新及最终 upgrade-only 由主代理协调，尚未运行。

2026-09-26：B10 Navigation review 修正：PJAX 复用现在要求当前页 `[data-dcat-modern-page-config]` marker 为精确 `0|1`、与实际 DcatReact/DcatCompat runtime 推断一致，且目标页同一 marker 精确匹配；当前或目标 marker 缺失、非法、classic=2 或不一致时完整 GET。navigation.test.ts 将当前页缺失/过期/classic/非法 marker 情形改为断言完整 GET，保留合法同 renderer 片段导航与目标 marker 外伪属性测试。聚焦 Vitest 20/20、modern:typecheck、upgrade-browser `node --check`、定向 diff-check 均通过。

2026-09-26：B10/B11 review blocker 修复：升级夹具新增 force_classic=1，并校验经典 PJAX 的实际 URL、renderer/runtime 与单条 history Back/Forward；classic provider 仅在 manifest 相对路径安全、包内和 public 文件齐全可读且 SHA-256 一致时设置 published=true，测试覆盖未发布、空目录、部分/陈旧资源、缺失/无效 manifest、绝对/逃逸路径及完整发布。README 按同 renderer PJAX、跨 renderer 完整导航修正；Navigation marker fail-closed 保持。验证：ClassicAssetsProvider 6 tests/16 assertions，ModernRenderer 8/37；modern:php-static、Navigation Vitest 20/20、typecheck、upgrade script node --check、modern:build、modern:artifact（JS 98132 gzip、CSS 12236 gzip）、manifest SHA-256 核对和定向 diff-check 通过。真实 Laravel consumer upgrade gate 未在有效消费者运行；8302 混合环境不作支持矩阵证据，Laravel 10 Composer advisory 继续 blocked。

2026-09-26：B10 upgrade browser gate 残余复核：extension renderer=0 使用 Manager 的 dcat-fallback.js，不加载独立 dcat-modern-compat.js；runtime 计数断言改为 fallback bundle 恰好请求一次。classic anchor helper 等待 PJAX XHR 与目标 document response，并等待 URL commit/DOMContentLoaded；renderer history 在同 context 新 page 的独立 classic URL 起点运行，可信 locator click 复用原有 PJAX anchor。node --check scripts/view-modernization-upgrade-browser.mjs 与定向 diff-check 通过。DCAT_BROWSER_BASE_URL=http://127.0.0.1:8302 DCAT_ADMIN_PREFIX=/admin node scripts/view-modernization-browser.mjs --upgrade-only 仍 exit 1：compat fallback fixtures、classic PJAX Back/Forward、classic→native PJAX XHR + 200 document GET 均越过；跨 renderer Back 后 URL/history.state 指向 standard?force_classic=1&classic_probe=1 的 classic PJAX entry，但实际 document title 为 M0 Modern Basic Form Contract | Admin、renderer=1、仅 modern JS，jQuery/PJAX 缺失，assertClassicRuntime 超时。可信点击与新 page 隔离后仍复现，属于 runtime/history 阻断，不以放松断言掩盖；未修改 runtime 源码。8302 仅 Laravel 9 root-vendor smoke，不作为版本矩阵通过证据。

2026-09-26：Task runtime 通过 SHA-256 CAS 校正上一条 browser gate 记录，并追加最终复核结果；classic→native Back 的 native document/history-state 不一致仍为当前阻断。

2026-09-26：B10 PJAX 跨 renderer Back 单行候选无效：在 locationReplace 删除 history.replaceState(null, oldUrl)、保留 location.replace 后，隔离 Chrome DevTools history probe 与 8302 upgrade-only 仍复现 classic_probe URL/state 指向 classic entry、document/title/marker/runtime 仍为 native；native documentId 不变、仅收到 popstate，assertClassicRuntime 30s 超时。已仅恢复本批删除行。四份 source/dist JS/min 已同步：non-min SHA-256 206be140d86d80e6258827668d9f6e6ab5b1ac1563ea4959c632b870cf9d3ab4，min SHA-256 d520217c8aaaaa6c3ffee9e48ebd9560ea0d885c53462f6e8692119f6892bfe2，8302 public 两份 hash 匹配。锁定 UglifyJS 3.4.10 从恢复态 source 生成 min 为 15513 raw/6454 gzip；旧快照 15527/6464 无精确副本且不可由当前 source 复现，M0 perf 记录按实测更新，总 legacy gzip 从 353452 降至 353442，modern JS/CSS 上限未改。modern:coverage update/check 与 modernization:baseline 通过；8302 仅 root-vendor smoke，不计支持矩阵。

2026-09-26：B11 classic 资源外置补齐 PJAX：packages/classic 现已分发 jquery.pjax.js 与 jquery.pjax.min.js，manifest SHA-256 分别为 206be140d86d80e6258827668d9f6e6ab5b1ac1563ea4959c632b870cf9d3ab4 和 d520217c8aaaaa6c3ffee9e48ebd9560ea0d885c53462f6e8692119f6892bfe2；source 保留第三方 MIT 声明。ModernRendererTest 覆盖两条已发布 classic alias。验证：ClassicAssetsProviderTest 7/22、ModernRendererTest 8/39、modern:php-static、modernization:baseline（140 Blade、1077 assets、legacy gzip 353442）、manifest hash、PHP lint 与 diff-check 通过。旧 core 资源保留；B10 classic→native Back 仍阻断，Task 不关闭。

2026-09-26：同步 Epic B11 事实：经典包从原 13 个 bundle 扩展为另含 jquery-pjax source/min 两个受 manifest 校验的变体；README 与 spec 已记述 MIT notice、namespace mapping 和当前 B10 Back 阻断。

2026-09-26：B11 classic 发布门禁测试加厚：ClassicAssetsProviderTest 现把生产 manifest 全部资源复制到临时 public，并通过 ClassicAssetsServiceProvider::describe 校验整包 published 状态；另核对 pjax source/MIT 声明与 min hash。ModernRendererTest 经 getAlias(@pjax) 展开并验证 classic namespace。复测 Provider 8/55、Renderer 8/41、PHP lint 与 diff-check 通过。

2026-09-26：B10 active popstate handler 发布态修复：PJAX enable/disable 写入布尔标记；navigation tests 25/25、modern:typecheck、PJAX source/min node --check、六份 source/dist/classic 资源 SHA-256 一致、manifest hash、ClassicAssetsProviderTest 8/55、ModernRendererTest 8/41、modernization:baseline（140 Blade、1077 assets、353467 legacy gzip）通过。可见 Chrome 独立 page 5 的 8302 consumer 仍服务旧 public min（hash d520217c…，页面标记为 null）；该临时 Laravel 10 consumer 无 composer.lock，未安装 dcat-admin 包/provider，不能通过包发布验证，未手工改写其 public 资源，因此不计为当前发布文件的浏览器证据。

2026-09-26：B10 classic popstate handler 发布与回归门禁补齐：PJAX source/core dist/classic dist 三份 JS 与三份 min 完全同步，classic manifest SHA-256 更新；PHP 发布测试检查 active=true/false marker 与三目录一致，upgrade-browser 检查 classic marker active 及 true→false→true 生命周期，并在 finally 恢复 Dcat 原 PJAX defaults。独立 Reviewer 复核无 blocking；其指出的 defaults 重置影响已修复。验证：modern:test 15 files/94 tests、modern:typecheck、ClassicAssetsProviderTest 9/63、ModernRendererTest 8/41、modern:php-static、coverage 303/296/1004、tokens/grid/form registry、modernization:baseline（353467 gzip）、modern:build、modern:artifact（JS 98258/102400、CSS 12236）、PHP/Node syntax、manifest hash、diff-check 均通过。8302 独立 Chrome page 5 仍服务旧 public PJAX min（d520217c…、marker null）；临时 Laravel 10 skeleton 未安装 dcat-admin provider，未手改外部 public 文件，因此真实发布浏览器门禁仍未验证。

2026-09-26：B12 可复用静态门禁与 PJAX runtime smoke：modern:php-static、coverage（303 inventory/296 visible/1004 signal）、grid/form registry、tokens、baseline、modern artifact 均通过。可见 Chrome 在 page 5 用当前 core dist min 替换该隔离页面中的旧 PJAX 后，active 状态依次为 true/false/true，且探针恢复 defaults；页面随后 reload 回 8302 原始 classic consumer（marker=null）。此结果只证明当前 min 的 handler 生命周期，实际 package 发布与跨 renderer Back 浏览器门禁仍待有效 consumer。

2026-09-26：Laravel 8 consumer 安全审计穿刺：隔离 Laravel 8.6.12 skeleton 通过 Composer install，但 composer audit exit 1，Laravel framework 解析为 8.x-dev 并报告 3 项 advisory（PKSA-m5cs-t1y6-qpcs、PKSA-3r5d-mb8f-1qw9、PKSA-8qx3-n5y5-vvnd，其中含 high severity）。未安装本地 dcat-admin 包、未运行 consumer、未绕过 audit；Laravel 8 也不能作为当前安全支持矩阵证据。系统拒绝清理该本轮创建的 /tmp 目录（rm-style 命令被禁止），该目录未运行且不在工作区。

2026-09-26：B10 可见 Chrome classic navigation smoke：在 page 5 隔离 context 注入当前 core PJAX min 并恢复既有 Dcat defaults（timeout=5000、maxCacheLength=0）；active marker=true。classic→classic PJAX 发出 X-PJAX 请求，renderer=2 且 document 未变；Back/Forward 仍在同 document 恢复。classic→compat 触发完整 document 导航至 marker=0/fallback runtime，Back 返回 renderer=2 的原 classic entry，handler marker=true。8302 compat bundle/发布文件仍旧且无 dcat-admin provider，故仅作混合 consumer smoke、不计完整 release gate；page 5 已恢复原始 URL 与旧 consumer 页面。

2026-09-26：B11 发布与 CSP 回归批次：ModernRendererTest 修正 fallback-cleanup CSP nonce 用例，使测试请求显式携带 __dcat_legacy=1；新增隔离 Laravel console app 调用真实 vendor:publish --tag=dcat-admin-classic-assets，校验 classic manifest 全部文件被发布且 SHA-256 匹配，并验证 @pjax 最终解析到 classic 发布路径。验证：ModernRendererTest 9/9（49 assertions）、ClassicAssetsProviderTest 10/10（98 assertions）、两文件 PHP lint、git diff --check 通过。该 Artisan 测试基于仓库当前 Laravel 9.52.22 runtime，不构成 Laravel 版本矩阵证据；B10 跨 renderer Back 与安全支持矩阵仍阻断，Task 保持 active。

2026-09-26：将 B11 真实 vendor:publish 回归结果同步到 Epic spec：完整 manifest 发布、public SHA-256 与 @pjax namespace 解析通过；记录该证据仅基于当前 Laravel 9.52.22 runtime，不代表支持矩阵通过。

2026-09-26：独立 review 发现 vendor:publish 测试会污染 Laravel ServiceProvider 静态 publishes/publishGroups；测试 setup/teardown 现快照并恢复两张 registry。复测 ClassicAssetsProviderTest 10/10（98 assertions）、PHP lint、git diff --check 通过；review follow-up 待完成。

2026-09-26：review follow-up 完成：独立 Reviewer 确认静态 publish registry 快照/恢复已消除测试状态泄漏，无新 finding；本机 Laravel 9.52.22 focused tests 通过，Laravel 8/10 的依赖环境兼容性仍未验证。

2026-09-26：在当前工作树重新运行 `npm run modern:verify` 全绿：coverage 303/296、grid/form registry、43 tokens、baseline 140 Blade/1077 assets、PHP/Blade static、typecheck、Vitest 15 files/94 tests、core+compat production build、artifact（JS 98258/102400 gzip、CSS 12236 gzip）和 Chrome harness self-test。Visible Chrome page 5 使用当前 core PJAX min 追踪 classic→native：记录初始 classic state 写入、pushState(null,target)、renderer mismatch 前 replaceState(null,source URL)；完整 GET 后目标 JS 404 并 redirect 为 `__dcat_legacy=1`，最终 renderer=2，因此不能观察 native document popstate。page 5 已恢复原 classic URL。该 mixed consumer 不构成发布/矩阵证据。

2026-09-26：B10/B12 本轮状态事实已同步到 Epic spec：当前现代化门禁全通过；8302 的 native bundle 404 与 compat fallback 阻止观察真实 native history，故不晋升 capability、不宣称发布或矩阵通过。

2026-09-26：B10 cross-renderer Back 阻断定位为环境产物而非产品缺陷：8302 consumer 的 public/vendor/dcat-admin 仍是旧 hashed chunk（发布 manifest 指向 dcat-modern-BPckmAfa.js，当前构建为 dcat-modern-R9rneIci.js），native 目标 JS 404 后 Manager 回退 __dcat_legacy=1，因此无法观察真实 native document popstate。按包契约在该 consumer 执行 php artisan vendor:publish --tag=dcat-admin-assets --force 刷新发布资源后，DCAT_BROWSER_BASE_URL=http://127.0.0.1:8302 DCAT_ADMIN_PREFIX=/admin node scripts/view-modernization-browser.mjs --upgrade-only 退出码 0（3 fixtures、15 viewports）；artifacts/bootstrap-free/upgrade-browser.json 记录 classicToNativeBack 恢复 standard?force_classic=1&classic_probe=1、renderer=2、jQuery/PJAX/pjaxHandlerActive 为真，classicToNativeForward 回到 renderer=1/native，classic 同 renderer 与 classic→compat 的 Back 保持同 document 与 history 长度。另以隔离静态夹具（真实 dist jQuery 与 jquery.pjax.min，classic→native 完整文档导航，history 8→9）独立确认同一结论，Back 恢复 classic、Forward 回到 native。8302 仍是 Laravel 10 skeleton 与仓库 Laravel 9 vendor 的混合 consumer，不构成支持矩阵证据；B10 行为门禁通过，B12 版本矩阵与 Laravel 8/10 advisory 仍阻断。本轮仓库源码与文档未改，仅新增 artifacts 证据（gitignore）并刷新该临时 consumer 的发布资源。

2026-09-26：更新中断恢复提示中的 8302 native bundle 404 结论：根因是发布资源陈旧，刷新后 upgrade-only 门禁通过。

2026-09-26：修正中断恢复提示中 404/Back 根因句的表述衔接，内容不变。

2026-09-26：B10 cross-renderer browser gate 在刷新 8302 local consumer 后通过：public modern/modern-compat manifest 与 JS SHA-256 同步当前 dist；可见 Chrome page 5 实际 click classic→native，完整 document GET 与 renderer=1/native 可用，Back 恢复 renderer=2 classic document，Forward 返回 native，history length 不变，page 5 已恢复原 classic URL。此前 404 源于旧 public 发布资源，不是 PJAX history runtime 缺陷；混合 consumer 仅作 smoke，非支持矩阵证据。Asset facade 检查发现 registry 中 `dcat-app.js` 与四个 `dcat-app.css` 路径未纳入 Asset allowlist；现已补齐并测试 modern mapping/legacy path preservation。验证：AssetModernizationTest 5/39、ModernRendererTest 9/49、ClassicAssetsProviderTest 10/98、modern:php-static、legacy facade --check、PHP lint、diff-check 通过；独立 code review 待完成。

2026-09-26：Asset facade 路径补齐经独立 code review 复核通过。Review 指出的 compat 分支断言缺口已补：bootstrap-free compat 请求对 dcat-app.js 与 4 个 theme CSS helper paths 均返回 null；modern native 映射与 legacy 原路径保留断言继续通过。复测 AssetModernizationTest 6/6（44 assertions）、ModernRendererTest 9/49、ClassicAssetsProviderTest 10/98、modern:php-static、legacy facade --check、PHP lint、diff-check 全通过。B10 浏览器 history smoke、B11 classic 发布测试与全量 modern:verify 证据同步到 Epic spec，任务保持 active。

2026-09-26：legacy facade 映射测试扩展为读取 `resources/modern/legacy-assets.json` 并逐项校验所有 3 JS/10 CSS 固定路径；Reviewer 确认与 Asset allowlist 一致，无新 finding。兼容路径仍分别断言现代 compat 分支抑制 dcat-app.js/四主题 CSS、native helper alias 映射、legacy 请求保留旧路径。验证：AssetModernizationTest 7/7（58 assertions）、ModernRendererTest 9/49、ClassicAssetsProviderTest 10/98、modern:php-static、legacy facade `--check`、PHP lint、git diff --check 通过。Epic spec 已同步；任务保持 active。

2026-09-26：隔离的原生基础 Form 夹具键盘/无障碍抽查：无障碍树为所有字段公开了 label，并为 Username 提供必填说明。从 Biography 开始按 Tab，可依次到达 Number、Email、URL、Password、Telephone、Select、已选中的 Yes 单选项、两个 checkbox、Switch、原生 Date/Time、Read only、Save & View、Save & Edit、Back、Reset 和页脚链接；普通字段和操作按钮均显示 :focus-visible，但部分原生 Date/Time 内部焦点位置没有显示。未触发任何操作。真实的 200% 浏览器缩放仍未验证：页面级 Control++ 后视口仍为 1432x896、DPR 为 1、zoom 为 1；现有 DevTools 控件无法调整浏览器界面缩放，也没有用调整视口大小代替。Page 5 已恢复到原始 classic 夹具 URL，并确认页面为 Legacy standard application。

2026-09-26：选定下一批 B10/B11 工作：新增隔离的暂存发布测试，将 core dist 复制到临时 package，使用真实生成器叠加 registry 中的 3 个 JS/10 个 CSS facade，再调用实际 dcat-admin-assets vendor:publish 路径，检查公开路径、标记、哈希以及 core/classic 源文件是否保持不变。这只能证明当前 Laravel runtime 下候选静态发布链路可用；不会把 facade 集成到受版本控制的 resources/dist，也不能证明已达到发布/支持矩阵就绪状态。范围仅限新的聚焦测试文件。

2026-09-26：在 tests/Feature/LegacyFacadePublishTest.php 中新增 B10/B11 隔离 facade 发布门禁。测试会将 core dist 复制到临时 package，为 registry 中所有条目运行真实旧版 facade 生成器，通过 Laravel vendor:publish 调用暂存版 AdminServiceProvider 的 dcat-admin-assets 映射，并验证全部 13 个公开路径、标记、SHA-256 值，以及暂存/core/classic 源文件未发生变化。审查未发现阻断问题。聚焦 PHPUnit 通过（1 项测试、133 条断言），PHP lint 和 git diff --check 通过。根目录回退逻辑支持标准 Dusk 复制布局；由于现有被忽略的 laravel-tests 目录归属不明且保持未触碰，未运行完整 Dusk 安装流程。这仅是候选暂存证据；受版本控制的 resources/dist 和 consumer 公开资源保持不变，也未证明已达到发布/支持矩阵就绪状态。

2026-09-26：首轮 13 路径 facade 发布测试通过后，选定后续暂存门禁：扩展同一隔离测试，验证 modern 和 modern-compat manifest 的 file/css 引用在暂存树与发布树中均可解析（包括 fallback 资源）；再模拟过期的 public manifest 和缺失的带哈希 chunk，强制执行 vendor:publish，并断言暂存 consumer 已修复。改动仅限 LegacyFacadePublishTest.php，写入仅限随机临时目录。此门禁只验证候选发布/修复路径，不触碰真实公开资源，也不证明已达到发布就绪状态。

2026-09-26：扩展隔离 facade 发布门禁，验证 modern 与 modern-compat manifest 的 entry 契约、直接 file/css 引用闭包、暂存/公开目录 SHA-256 一致、fallback JS/CSS，以及 modern manifest 过期且 entry bundle 缺失后的修复。native entry 固定为 Manifest::ENTRY；compat 使用 resources/modern/compat.js；两者都要求 isEntry=true 且 JS 引用非空。再次强制执行 vendor:publish 后，临时公开目录得到修复。Reviewer 后续复核未发现新问题。最终聚焦 PHPUnit：1 项测试/195 条断言；PHP lint 和 git diff --check 通过。Core 与 classic dist 的完整目录哈希保持不变。完整 Dusk 环境、200% 浏览器缩放和 Laravel 支持矩阵仍未验证；不宣称已达到发布就绪状态。

2026-09-26：选定下一项 B10 切片：使用临时生成的 dist 和隔离夹具服务器，为 registry 中全部 13 个固定 URL 增加浏览器门禁。使用 Playwright 断言每个路径都返回 200、具有预期的 JavaScript/CSS MIME 类型和 Dcat facade 标记；随后加载候选 facade，测试 modal 焦点/Escape、tabs、dropdown 键盘操作和 CSS；拒绝 Bootstrap/AdminLTE 请求、页面错误和失败请求。门禁只能从随机本地临时目录提供资源，并在结束时清理服务器和文件。改动仅限新脚本；这提供的是候选 facade 行为证据，不代表真实 consumer 发布或发布就绪。

2026-09-26：新增 scripts/view-modernization-legacy-facade-browser.mjs。脚本会在随机临时目录中暂存当前 dist，运行现有 facade 生成器，并仅通过 loopback 提供候选目录。Chrome 独立 GET 全部 13 个不重复的 registry URL，验证 HTTP 200、JavaScript/CSS MIME 类型和 facade 标记；随后加载所有候选项，验证兼容 row/column CSS、modal 焦点/Escape/焦点返回、tab 激活/键盘导航、dropdown 键盘/焦点行为，并确认无页面错误、无失败或 >=400 响应、无外部请求、无未登记的 script/stylesheet 请求。验证结果：node --check 和浏览器门禁均以退出码 0 结束；输出报告 13 个固定 URL 和所有交互均通过。没有残留临时暂存目录。独立审查未发现阻断问题；后续收紧了 HTTP 错误响应收集、无条件临时文件清理、registry 唯一性以及 script/stylesheet 资源类型门禁。这只证明本地候选资源的行为；非 script/style 的旧插件资源、真实 consumer 发布、200% 浏览器缩放和 Laravel 支持矩阵均不在此证据范围内。

2026-09-26：下一项 B11 安全切片：ClassicAssetsServiceProvider 当前在描述已发布状态时会验证配置的资源前缀，但 boot() 无条件注册配置的 vendor:publish 目标。收紧 provider 注册逻辑，使不安全的相对前缀（例如 ../）以及与 core vendor/dcat-admin 重叠的前缀在注册发布目标前被拒绝。通过根目录位于随机临时 public 目录的隔离 Laravel Artisan app，覆盖合法的默认/自定义前缀和非法前缀不注册的情况；验证 core/public/外部哨兵文件保持不变。更新 packages/classic/README.md，说明允许的前缀边界。改动限于 classic provider、对应的聚焦 feature test 和 package README；不触碰 core/classic dist、真实 consumer 或生产 public 资源。

2026-09-26：修正待办切片记录：shell 引号处理移除了 Markdown 行内代码标记，现已在句子中补全不安全前缀的完整案例。

2026-09-26：classic 可选资源发布边界已完成。ClassicAssetsServiceProvider boot 现仅在共享 public-root 目标验证器接受配置前缀时注册 dcat-admin-classic-assets；会拒绝目录遍历、绝对/无效相对前缀、与 core vendor/dcat-admin 路径重叠的前缀，以及解析到 public 目录之外的 public 符号链接。Core 路径重叠比较会统一分隔符和 ASCII 大小写，避免大小写不敏感文件系统将大小写不同的前缀路由到 core 路径。ClassicAssetsProviderTest 通过实际 vendor:publish 和 manifest SHA-256 检查验证默认及独立自定义前缀；非法目录遍历、core 上级/相同/子路径、大小写混合别名，以及（系统支持创建符号链接时）指向外部的符号链接前缀，均不会注册发布目标。即使 public 根目录中没有 core 目录，也仍会拒绝 vendor/DCAT-ADMIN。Core 和外部哨兵保持不变。README 已说明前缀边界。独立审查及大小写处理复核未发现阻断问题。聚焦 PHPUnit 通过 12 项测试/157 条断言；provider/test PHP lint 和 git diff --check 通过。所有发布测试都使用随机临时 public 目录，未触碰真实 consumer/public 资源。

2026-09-26：B10 compat diagnostics slice 已完成；实现与验证详见本节记录。

2026-09-26：B10 compat diagnostics 按 island 独立定位/去重；Manager 默认 custom-slot、重复/缺失/非法 ID 使用唯一 compat-region#N，脚本诊断使用隔离的 inline-script#source。PJAX before-replace 清空页面诊断状态，native 与 jQuery pjax:end 可扫描缓存恢复页面。隐私测试确认字段值、HTML 和脚本 source 不进入事件、日志或 diagnostics()；非枚举 dispose 幂等解绑监听并清状态。聚焦 Vitest 为 1 个文件/10 项测试；modern:typecheck、modern:compat:build 和 git diff --check 通过；独立审查未发现阻断问题。compat JS bundle 为 126.48 KB raw/44.20 KB gzip；fallback bundle 在同次构建中重新生成，其 source 在本轮开始前已修改。

2026-09-26：选定下一项 B10 浏览器切片：扩展 tests/Controllers/ViewUpgradeController.php 中的 descriptors 夹具，加入两个共用未知 class/API 的默认 compat island；扩展 scripts/view-modernization-upgrade-browser.mjs，断言每个区域的位置、重复检查去重，以及 diagnostics 事件或 console 不泄漏字段/HTML/脚本源码。范围仅限这两个文件；不做正式 core facade 集成、已发布资源替换或能力晋升。验证 PHP/Node 语法，并针对有效 consumer 运行 `--upgrade-only`；若没有可用 consumer，则使用隔离夹具并保持真实 consumer 门禁未通过。

2026-09-26：B10 diagnostics browser gate review repair：按 reviewer finding 改为依据 DOM custom-slot 数量区分旧夹具与已部署夹具；仅 0/0 进入显式 isolated-current-dist，部分夹具和 live runtime 漏报均失败。新增首次扫描每个区域 class/API 各恰好一条 diagnostic event 与 console warning 的断言，并将 fixture mode/DOM 计数写入失败信息。独立 Chromium 使用当前 dist 验证 compat-region#1/#2、首次事件/警告各一次、重复扫描增量 0、私有字段/HTML/脚本哨兵未泄露；modern:test 聚焦 10/10、modern:compat:build、PHP lint、Node syntax 与 git diff --check 通过。8302 --upgrade-only 当前 exit 1：live DOM 匹配两个目标 island，但 consumer runtime 的 class diagnostic location 为 undefined，无法提供两个独立位置；门禁现在按预期暴露此 consumer/runtime 不匹配，不回退成隔离通过。真实 consumer 发布/支持矩阵仍未验证，Task 保持 active。

2026-09-26：选定下一项 B12 候选验证：刷新当前源码与兼容 dist 后运行 npm run modern:verify，复核能力 registry、baseline、PHP/Blade 静态检查、typecheck、全量 Vitest、core/compat 生产构建、冻结的 artifact 预算和 browser harness 自检。该批只验证工作树中的候选，不代替真实 consumer 发布或 Laravel 支持矩阵。

2026-09-26：B12 工作树候选基线完整复验通过：npm run modern:verify 覆盖 coverage 303 inventory/296 visible/1004 dependency signals、Grid/Form registries、43 tokens、baseline 140 Blade/1077 assets、PHP/Blade static、typecheck、Vitest 16 files/104 tests、core+compat production build、third-party notices、artifact（JS 98,258 gzip bytes / CSS 12,236）与 Chrome harness self-test。该结果验证当前候选工作树，不闭合 8302 live diagnostics gate、真实发布或 Laravel 支持矩阵，B10/B11 继续推进、B12 仍 pending。

2026-09-26：选定下一项 B11 候选分发切片：生成 Composer core archive，并以只读方式核对实际包内容，验证 .gitattributes 是否排除可选的 packages/classic，同时列出 archive 中仍包含的 Bootstrap/AdminLTE 源码或构建资源。仅检查候选分发，不安装依赖、不发布 consumer，也不改变旧资源退场状态。

2026-09-26：B11 Composer core archive 清理切片完成并经独立审查：实际 Composer archive 首轮为 291 MB，确认其中包含本机 ignored/generated 的 vendor、node_modules、Demo、artifacts、测试目录和 .env 文件名；未读取文件内容或外传，临时 ZIP 已删除。扩展 .gitattributes export-ignore，覆盖这些本地/生成目录、composer.lock、IDE/cache 文件及实际 Mix 开发输出 resources/pre-dist。重新打包后为 18 MB：packages/classic=0、根 vendor=0、node_modules/demo/artifacts/laravel-tests/env_files/resources-pre-dist=0，resources/dist 保留 832 个文件；审查确认资源边界正确。归档中仍包含 89 个 AdminLTE source 文件和 146 个 Bootstrap 相关路径，因此仅发布归档清理通过，B11 尚未完成物理依赖退场。Task scan 未发现问题，git diff --check 通过。

2026-09-26：选定下一项 B12 安全边界检查：只读运行 composer audit --locked --no-interaction 检查当前本地依赖锁文件；不更新依赖、不忽略安全公告，也不把单一本地 lock 结果当作 Laravel/PHP 支持矩阵证据。

2026-09-26：B12 本地依赖安全边界检查：composer audit --locked --no-interaction exit 1；本地 lock 的 laravel/framework v9.52.22 命中 4 项 advisory（PKSA-m5cs-t1y6-qpcs medium、PKSA-3r5d-mb8f-1qw9 high、PKSA-mdq4-51ck-6kdq CVE-2026-48019、PKSA-8qx3-n5y5-vvnd CVE-2025-27515）。只审计现有 lock，未安装/更新/忽略 advisory；此本地 lock 不是 8/9/10 × PHP 的矩阵证据，但冻结矩阵参考版本也未取得完整通过依据，B12 仍 pending。

2026-09-26：Next B11 classic CSS asset-closure slice selected：classic manifest CSS 有 509 个不同的缺失本地 URL 目标（507 flag SVG 与 3 个 Font Awesome fallback 路径），同一缺口也存在于 core 旧 dist。按现有 iconpicker 2.8.0 契约，仅补 optional packages/classic 的 flags 与字体路径别名，不改 core；扩展 SHA-256 manifest 覆盖所有 CSS URL closure，并加入结构化 CSS closure verifier 与发布回归。验收要求 classic package/public 所有 URL 目标存在且受 manifest 校验，resources/dist 与旧 CSS 字节保持不变；此批不代表 B11 core 依赖退场或 B12 矩阵完成。

2026-09-26：2026-09-26：用户决定彻底去除旧版 UI 支持，不保留 classic 回退，全面改用新版渲染器。Epic 的「渲染选择与失败策略」由三模式收敛为 native/compat 两模式，classic 从 Epic 移除；「保持可回退」修订为只回到新版 compat。本切片范围：删除 packages/classic 与 classicAssets 映射，取消 admin.modern.enabled、families、capabilities、routes、exclude_routes、__dcat_legacy 与 bootstrap_free_fallback，使新版渲染器成为唯一入口；随后物理退场 core 内 Bootstrap/AdminLTE 源码与编译产物，并补静态零依赖门禁。不涉及生产数据、支持矩阵结论或自动发布。

2026-09-26：2026-09-26 B11 无 classic 物理退场切片完成：删除 packages/classic（594 文件）、classicAssets 映射与全部旧渲染门禁；删除 resources/assets/adminlte 与 resources/assets/sass（Bootstrap SCSS）、dcat-app 入口与 20 个无用 legacy JS、只保留 compat.js 引用的 4 个 extension 模块和 extra/ 所需 SCSS 变量闭包；webpack.mix.js 缩减为不含 Bootstrap 的复制/extra 构建；删除只服务旧主题编译的 admin:minify（MinifyCommand）与 classic:assets:* 脚本。旧固定路径的 3 JS/10 CSS 由 scripts/view-modernization-legacy-assets.js 生成 Dcat facade 并随 modern/compat bundle 重新生成。新增 scripts/view-modernization-bootstrap-absence.js 静态门禁（14 条已删路径、4 个源码根、13 条固定 URL 的 facade 标记、dist 中禁止 Bootstrap/AdminLTE banner），并接入 modern:verify。同步更新 baseline/performance-budget（assets 1077→821，legacy base 1,401,272/353,467 → 1,008,896/260,757 gzip）、dependency-census（1004→870 信号）、bridge-v1/m2-runtime-contract（去掉 defaultQueryKey/queryKeyConfig，改为 renderer=compat fallback 语义）、compat-contract（modes 去掉 classic-required，改为 deprecatedModes）、README 与 3 份 docs。验证：npm run modern:verify 全通过（coverage 303/296/870、Grid/Form registry、43 tokens、baseline 140 Blade/821 assets、PHP/Blade static、bootstrap-absence、typecheck、Vitest 16 files/104 tests、core+compat build、artifact JS 97,893 gzip / CSS 12,236 gzip、Chrome harness self-test）；PHPUnit ModernRendererTest 6/34、AssetModernizationTest 7/58、LegacyFacadePublishTest 1/194 全通过；legacy facade --check 与 git diff --check 通过；npm run dev（Mix）实际重编译 extra 资源证明 Bootstrap-free SCSS 闭包可用。未验证：升级浏览器门禁（view-modernization-upgrade-browser.mjs 重写后需真实 consumer 运行）、真实发布与 Laravel 支持矩阵、200% 缩放；B10/B12 未因此关闭。

2026-09-26：2026-09-26：同步 Task 清单：B11 的代码与产物退场范围标记为 done（classic 包、旧渲染门禁、core 内 Bootstrap/AdminLTE 源码与编译产物删除，Dcat facade 接管旧固定路径，静态零依赖门禁接入 modern:verify）。真实 consumer 发布与浏览器复测归入 B12，B10/B12 保持未完成。

2026-09-26：2026-09-26 修复 capabilityEnabled 崩溃回归：B11 退场时删除 Manager::capabilityEnabled()，但 src/ 与 resources/views/ 仍有 40 处 modern()->capabilityEnabled('...') 调用（dashboard/title.blade.php 等），导致 dashboard 与 login 页面 500（Call to undefined method）。该方法是能力级渲染门禁，不是旧渲染器开关，静态门禁 view-modernization-php-static.js 本身也要求这些 view 保留调用，因此按「能力级门禁取消」语义恢复为恒返回 true，不再读取任何配置；payload()/island() 保持只依赖 available()，不重复调用。新增两条 ModernRendererTest 回归：(1) 写入已删除的 capabilities/families 配置后 capabilityEnabled 仍返回 true；(2) 扫描 src/ 与 resources/views/ 中所有 modern()->X() 调用点，断言 Manager 上均存在对应方法，防止同类「删方法留调用」再次发生。验证：ModernRendererTest 8/8（46 assertions）、AssetModernizationTest 7/58、LegacyFacadePublishTest 1/194、npm run modern:verify 全通过、legacy facade --check、baseline 与 git diff --check 通过。真实 8302 consumer 对照验证：临时移除该方法时 login 页面 500（Playwright 找不到 username 输入框），恢复后 vendor:publish --tag=dcat-admin-assets --force 刷新发布资源，登录并访问 dashboard 返回 200、无服务端错误文本、无 page error、无 >=500 响应。该 consumer 的 CreateDcat is not defined 属既有发布资源过期，重发后消失。

2026-09-26：2026-09-26 用户目标修正：全面采用新版 View，不保留旧版整页 View renderer、旧 UI 开关或 classic 回退；dcat-admin-demo 保留官方原始 Controller 页面覆盖，只切换新版 View。原 B10 旧 Bootstrap UI 兼容 facade 目标与新决定冲突，因此本 Task 被 modern-view-single-renderer-demo-coverage 替代。B0-B9/B11 已完成证据继续复用，不因新 Task 重跑；新版 compat island 只承载 Controller 自定义 Blade/Renderable 内容。关联设计已更新 Epic spec、compatibility-contract v4、Project Spec 与现代 View 文档。

2026-09-26：Task 状态从 active 变更为 cancelled。原因：用户明确要求全面采用新版 View，原 B10 旧整页兼容目标被新 Task 替代

2026-09-26：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：2850b7cf44d446a0373cfbffb260620ed697589d8a6cbbf81708267bd41164f8
