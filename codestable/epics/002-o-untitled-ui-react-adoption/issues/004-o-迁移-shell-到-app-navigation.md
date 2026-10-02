---
kind: issue
title: 迁移 shell 到 Untitled UI app-navigation
type: refactor
status: open
created: 2026-09-30
---

# 迁移 shell 到 Untitled UI app-navigation

2026-10-03 补充：用户确认剩余位置闪烁在 Dashboard 首页。逐帧录制显示侧栏 Logo 固定，位移来自欢迎卡片的旧版 fallback 与现代卡片切换；已通过对齐首屏模板修复，详见 [Issue005 的 Dashboard 首屏修正](005-o-完成-view-组件迁移与验收.md#2026-10-03-dashboard-刷新品牌图像位移已完成)。本轮独立验证刷新期间位置，前两轮尺寸修复记录保持原范围。

## 2026-10-03 整页刷新 Logo 闪现（已完成）

用户补充：上一轮 PJAX 修复后，刷新当前页面仍会闪现。正常模板的 body 未输出 `dcat-modern-active`，native/compat 均等 DOMContentLoaded 才启用样式；Chrome 官方扩展暂停脚本并刷新统计卡片页面，稳定复现 mini Logo 为 225×225，证明首次服务器渲染也缺少样式状态。

已在 `Content::applyClasses()` 共用布局类生成处，为现代运行时输出且不重复 `dcat-modern-active`，让普通/全页布局及 native/compat 在脚本启动前就拥有样式；不提前标记 React 已挂载或 request-enabled。用户 body 类、暗色、折叠和水平菜单设置保持，上一轮局部卸载修复继续有效。

- 当前 Demo **PHP 8.1.34 / Laravel 10.50.3** 下，`ModernRendererTest` 为 **13 项 / 84 断言通过**。新增用例在修复前失败，覆盖有无 manifest、字符串/数组自定义类和既有布局设置；PHP 语法、`modern:php-static`、`git diff --check` 通过。
- Chrome 官方扩展暂停脚本并整页刷新：首屏 `active=true`、`request-enabled=false`，可见 Logo 为 35×35，mini 隐藏。恢复脚本后同 URL 连续 3 次正常刷新均显示正常，`performance.timeOrigin` 各异，证明重新加载了文档；六图绘制正常且位于卡片内。
- 刷新后统计卡片→Modal→后退，两次 PJAX 的 8 个生命周期采样仍保持样式与 Logo。warn/error 为空，脚本执行开关已恢复，临时观测器已移除，视口保持 1912×906。CDP 不支持新文档注入，因此证据为无脚本首屏和真实刷新，未声称刷新过程逐帧采样。

本地证据：[修复前无脚本首屏](../../../../artifacts/logo-refresh/before-no-script.jpg)、[修复后无脚本首屏](../../../../artifacts/logo-refresh/after-no-script.jpg)、[正常刷新](../../../../artifacts/logo-refresh/after.jpg)、[验证记录](../../../../artifacts/logo-refresh/verification.json)。[Task 已归档](../../../tasks/archived/2026-10-03-006-fix-refresh-logo-flash.md)，首屏行为已回写 Epic S3，Issue/Epic 保持 open。本次仅修改 PHP，前端资源无需重建；未重复 TS、全量门禁或其他浏览器验证，独立 Review 工具不可用。首屏/跳转两个阶段的边界由源码、测试和本 Issue 承载，无新增 Talk/Note/Tool。

## 2026-10-03 页面跳转 Logo 闪现（已完成）

用户反馈每次跳转左上角紫色 Logo 短暂放大。Chrome 官方扩展实测 Dashboard→Operation Log：`before-replace` 阶段 body 的 `dcat-modern-active` 与 `dcat-modern-request-enabled` 被移除，原本隐藏的 mini Logo 以 225×225 原始尺寸出现，`loaded` 后才恢复隐藏；正常 full Logo 为 35×35，整个过程未整页重载。

根因是 `bridge.unmount(root)` 在仅卸载 PJAX 容器时也无条件清除全局样式状态。现已只在卸载整个 document/body/html 时清除全局标记；局部卸载保留样式，仍清理离开页面的组件、恢复 fallback 并重置浮层。修改位于 `resources/modern/bridge.tsx`，未改 Logo 图片或尺寸规则。

- 新增 6 个回归用例覆盖容器/文档派发的 PJAX 生命周期、局部最后组件卸载、document/body/html 完整卸载。修复前 3 个局部卸载用例失败，修复后 bridge/navigation/runtime **3 文件 70 项通过**；`modern:typecheck`、`modern:build`、`modern:artifact`、`git diff --check` 通过。发布资源为 JS 196892 + CSS 34016 = **230908 gzip 字节**，仅观测。
- Chrome 官方扩展验证 Operation Log→Dashboard→Modal→统计卡片、折叠态统计卡片→Dashboard、后退至统计卡片，共 **5 次导航 / 20 个生命周期采样**。start/before-replace/loaded/end 全部保留两项全局标记，可见 Logo 均为 35×35，另一 Logo 保持隐藏；`performance.timeOrigin` 不变，warn/error 为空。
- 已恢复原展开侧栏，视口保持 1912×906，临时 CDP 观测器已移除。未重复 PHP、全量 modern:verify 或其他浏览器验证；独立子代理工具不可用，当前会话自查未发现新增缺陷。

本地证据：[修复前采样](../../../../artifacts/logo-navigation/before.json)、[修复后采样](../../../../artifacts/logo-navigation/verification.json)、[展开截图](../../../../artifacts/logo-navigation/after.jpg)、[折叠截图](../../../../artifacts/logo-navigation/collapsed.jpg)。[Task 已归档](../../../tasks/archived/2026-10-03-005-fix-navigation-logo-flash.md)，结果已回写 Epic S3，Issue/Epic 保持 open。局部与全局卸载边界由代码注释、回归测试和本 Issue 承载，无新增 Talk/Note/Tool。

2026-10-02：复核旧账本并补齐归档元数据，S3 浏览器验证的唯一 Task 正本为 `codestable/tasks/archived/2026-09-30-006-shell-browser-verification-and-facade-scope.md`。原验证记录保持；剩余迁移与最终验收由 Issue 005 承接。

## 2026-10-03 折叠侧栏交互修复（已完成）

用户确认：桌面折叠态悬停时，侧栏在主内容上方临时展开；点击分组保留浮层以选择子菜单，点击具体菜单项或移出侧栏后收缩。主内容、顶栏和页脚的位置与宽度保持折叠布局，总开关继续独立控制常驻状态。

```text
折叠：[图标栏] | 主内容固定
悬停：[    菜单浮层    ] 覆盖主内容左侧，底层布局固定
选择菜单项 / 移出 → 返回图标栏；分组点击 → 留在浮层
```

根因之一是 `shell/menu.tsx` 的分组点击主动触发 `pushmenu`，移除 `sidebar-collapse`；`runtime.ts` 缺少独立悬停态，CSS 只区分常驻展开/折叠。现已移除分组对总开关的调用，并增加独立 `sidebar-hover` 临时状态；侧栏浮层宽 260px，保留 5.4rem 网格占位。鼠标移出、叶子菜单选择、焦点离开、Escape 和 PJAX 生命周期清理浮层；桌面折叠样式限定在宽度不小于 768px 时生效，移动抽屉继续完整显示菜单。

另一根因是上游 `AriaLink` 默认阻止点击冒泡，绕过原 document 级 PJAX 与收缩处理，完整重载后恢复服务端默认展开。现已通过官方 `RouterProvider` 把垂直菜单接回既有 `navigation.navigate`，并在菜单选择入口收起临时浮层；vendor 和持久化偏好保持原样。

本轮验收：

- `npm run modern:test -- resources/modern/runtime.test.ts resources/modern/views/layout.test.tsx resources/modern/navigation.test.ts`：3 文件、57 项通过。新增鼠标/键盘菜单路由用例单独复跑 2 项通过且无警告；导航套件原生整页跳转用例的 jsdom 提示不影响通过。
- `modern:typecheck`、`modern:build`、`modern:artifact`、`node --check scripts/view-modernization-browser.mjs` 和 `git diff --check` 通过。发布资源已同步；JS 196878 + CSS 33842 = **230720 gzip 字节**，仅观测。
- Chrome 官方扩展在 1912×906 桌面实测：悬停宽 260px，浮层 z-index 1051 高于顶栏 1050；主内容、顶栏、页脚的 x/y/width/height 保持不变，左边界始终为 86.390625px。分组点击保留浮层；真实鼠标 Modal→Users 与键盘 Enter Users→Modal 均走 PJAX，选择后保留折叠并关闭浮层；移出与再次进入正常。
- 375×812 移动抽屉实测 x=0、宽 260px，标签完整、无横向溢出，Escape 关闭。临时视口已恢复，浏览器 warn/error 日志为空。

本地证据：[折叠态](../../../../artifacts/sidebar-hover/collapsed.jpg)、[悬停浮层](../../../../artifacts/sidebar-hover/preview.jpg)、[移动抽屉](../../../../artifacts/sidebar-hover/mobile.jpg)、[几何记录](../../../../artifacts/sidebar-hover/verification.json)；`artifacts/` 为忽略目录。当前 Demo 运行 PHP 8.1.34 / Laravel 10.50.3，本轮无 PHP 改动，未重跑 PHP/Dusk、`modern:verify` 全链或其他浏览器。宿主无子代理工具，本轮为当前会话自查，未进行独立 Review。

本轮 [Task 已归档](../../../tasks/archived/2026-10-03-001-fix-collapsed-sidebar-hover.md)，稳定行为已回写 [Epic S3](../spec.md#s3-shell-迁移app-navigation)。复用本 Issue 记录，Issue/Epic 保持 open，不毕业到 Project Spec。

> **读者：** 跨会话接手的人——「要做成什么、别碰什么、现状与方案是否还成立、怎么验、关了要回写哪里」。

---

## 做成以后是什么样

后台外壳（侧栏品牌头 + 菜单、顶栏、页头/面包屑、页脚）不再由 AdminLTE/Bootstrap 类 + `compat-facade.css` 的「Dcat facade」绘制，而是：

- 菜单由**上游 `app-navigation` 的 `NavItemBase`** 渲染，Tailwind 语义令牌负责视觉；
- 侧栏/顶栏/页脚/面包屑的 DOM 结构与 Tailwind 工具类对齐 Untitled `app-navigation` 风格，AdminLTE 结构类仅保留为冻结锚点；
- 260px 展开侧栏、折叠图标态、水平菜单、`sticky/floating/hidden` 顶栏、full-page profile、菜单分组与顺序全部保持；
- `data-dcat-react-component="layout.*"`、`capabilityEnabled(...)` 门禁、`data-dcat-modern-fallback`、`.menu-toggle` / `[data-widget="pushmenu"]`、`data-id`、`aria-expanded`、`.nav-treeview` 全部保持。

**范围：** 包含 app-navigation 组件 vendor、品牌 logo 插槽、菜单 React 渲染重写、sidebar/navbar/footer/breadcrumb 的 Tailwind 化、shell 相关 `@source` 与 facade CSS 收口、受影响测试与门禁期望；不包含 Grid（S4）、Form（S5）、其余页面族与浮层（S6）、五视口基线重做与体积观测（S7）。

**归属：** 属于 Epic `002-o-untitled-ui-react-adoption`，为其 S3 切片。

## 为什么现在做 / 当前坏在哪

S2 已把上游组件 vendor 进 `resources/modern/ui/`，但它们还没有被任何页面使用；shell 仍然完全是 AdminLTE 结构（`main-sidebar` / `header-navbar` / `wrapper` / `nav-sidebar`），视觉由 `compat-facade.css` 的 500-900 行 facade 规则模拟。Epic 完成定义第 2 条要求「内建页面由 Untitled UI 组件渲染」，shell 是现在唯一还没接入上游组件的页面族，也是后续 S4-S6 的容器。

同时 S2 留下的两条已知约束（`app-navigation` 未 vendor、品牌 logo 未定）必须由本切片解决，否则 Grid/Form 的迁移都要在没有外壳的情况下做。

## 现状（2026-09-30 核对）

- 外壳 Blade：`layouts/page.blade.php`（HEAD/资源装配）、`layouts/container.blade.php`（`wrapper` + 侧栏 + 顶栏 + `content-wrapper#app` + `main-footer`）、`layouts/full-page.blade.php`、`partials/sidebar.blade.php`（品牌头 + React 菜单边界 + legacy fallback）、`partials/navbar.blade.php`（`nav.header-navbar` + `navbar-left/right` + 用户区）、`partials/breadcrumb.blade.php`、`partials/menu.blade.php`（legacy 菜单模板）。
- React 外壳视图：`views/layout.tsx` 的 `LayoutMenuView`（`ul.nav.nav-pills.nav-sidebar` + 递归 `<li>`）与 `LayoutHeaderView`（`content-header` + `ol.breadcrumb`）。
- 造型现状：`compat-facade.css` 520-830 行用 CSS Grid 实现 260px 侧栏 / 5.4rem 折叠 / 52px 顶栏，并重排 `header-navbar`、`content-header h1`（20px）、`breadcrumb`、用户区；`styles.css` 另有一层 `.dcat-modern-*` 微调。
- 冻结锚点（门禁与浏览器契约引用）：`.wrapper`、`.main-menu`、`.main-sidebar`、`.main-menu-content`、`.navbar-header`、`.navbar-brand`、`.logo-mini`、`.logo-lg`、`nav.header-navbar`、`.app-content.content`、`.content-wrapper#app`、`.content-body#app`、`.main-footer`、`data-dcat-react-component="layout.*"`、`data-dcat-modern-fallback`。
- 现有行为依赖：`body.dcat-modern-active` / `.sidebar-collapse` / `.sidebar-open` / `.horizontal-menu`、`runtime.ts::bindNativeShell` 的 toggle 与 `syncSidebarToggleState` 的 `aria-expanded`。

## 方案与实现安排

1. **vendor app-navigation 最小必要面**：`components/application/app-navigation/config.ts`、`base-components/nav-item.tsx`、`base-components/nav-list.tsx`。其余上游文件逐条写明排除原因（`sidebar-simple`/`sidebar-slim`/`sidebar-dual-tier`/`mobile-header` 依赖上游品牌 logo 或 `motion/react`；`nav-account-card` 依赖未 vendor 的 `dropdown-account-button` 与 `@react-types/overlays`；`header-navigation` 与应用级导航模式不属于本后台外壳）。
2. **本地适配层放 `resources/modern/shell/`，不放 `ui/`**：`ui/` 必须等于上游（provenance 逐文件 sha256），Dcat 侧适配（图标映射、品牌 logo、递归菜单、payload→NavItem 映射）放在 `resources/modern/shell/`。
3. **品牌 logo 插槽**：不引入上游 `foundations/logo/*`；侧栏品牌头继续渲染 `config('admin.logo')` / `config('admin.logo-mini')` 的 HTML，用 Tailwind 定位到 Untitled 侧栏的品牌位，`logo-mini`/`logo-lg` 折叠切换行为保持。
4. **菜单重写**：`LayoutMenuView` 内部改为基于上游 `NavItemBase` 的递归列表，`LayoutMenuItem` 保持现有 payload 形状；保留 `data-id`、`aria-expanded`、`.nav-treeview`、`.menu-open`、外链 `target/rel`、`aria-current` 与键盘（Enter/Space 展开、不触发导航）。
5. **Tailwind 扫描面**：为 shell 的 Blade 模板新增受限 `@source`（只加 `layouts/{container,full-page}.blade.php`、`partials/{sidebar,navbar,breadcrumb,menu}.blade.php`）。这是对 S1「只扫 `resources/modern/**`」的有意偏差：外壳的 Tailwind 类写在 Blade 里，不扫描就不会生成；范围限定在少数外壳模板，并复测体积。
6. **类替换**：Bootstrap 工具类 → Tailwind（`d-flex`→`flex`、`float-left`/`pull-right`→`float-left`/`float-right`、`text-capitalize`→`capitalize`、`col-12`→`w-full`、`d-none d-sm-flex`→`hidden md:flex`、`mr-auto`→`mr-auto`）；AdminLTE 结构类保留为锚点。
7. **facade 收口**：`compat-facade.css` 的 shell 段删除已被 Tailwind 取代的规则；compat island（Select2/上传/编辑器/双列表/日期时间）相关规则不动。

## 不碰的边界

- `view-modernization-php-static.js` 冻结的 capability 门禁、React 边界标记与 fallback 结构。
- `layout.navigation` / `layout.navbar` / `layout.footer` / `layout.full-page` 的 **in-place** 适配器契约：不得改成 React 结构性 renderer（php-static 显式禁止）。
- 数据契约：菜单 payload、PJAX 生命周期、`window.Dcat` / `window.DcatReact`、`Admin::resolveHtml()`。
- 移动端交互模型：继续用 Dcat 现有 `sidebar-open` 抽屉与 toggle，不引入上游 `MobileNavigationHeader`（其依赖 `motion/react` 与品牌 logo）。
- compat island 边界与五视口基线（S7 整批重做）。

## 验证

- `npm run modern:verify` 退出码 0；报告 CSS/总产物实测大小；原大小预算已于 2026-10-02 取消。
- 菜单行为：`vitest` 更新后的 `views/layout.test.tsx`（嵌套分组独立展开、不触发导航、无 console error）。
- 真实外壳：起 demo（`tests/bin/install-dep.sh` + `install-admin.sh` + `tests/bin/start.sh`）后跑 `node scripts/view-modernization-browser.mjs --shell-only`，核对 260px / 折叠 / 三档 navbar / 水平菜单 / 锚点与 axe。
- provenance：`modern:vendor` 覆盖新增 vendor 文件，`--check-upstream` 与上游一致。
- 视觉：本轮页头字号仍为 20px（24px 属 S7 与新基线同批），若过程中改变需在 S7 一并重做基线。

## 执行记录

2026-09-30：Issue 创建，切片开始。

2026-09-30：**批次 1 完成**（侧栏菜单 + 页头/面包屑 + 外壳 Blade 的工具类替换），`modern:verify` 全链退出码 0。S3 尚未整体完成，剩余项见文末「遗留」。

### 已实现

1. **vendor app-navigation 最小面**：新增 `components/application/app-navigation/{config.ts,base-components/nav-item.tsx,base-components/nav-list.tsx}`。vendor 由 69 文件 / 403842 字节变为 **72 文件 / 411560 字节**；排除项逐条写明原因（`sidebar-simple`/`slim`/`dual-tier`/`sections` 依赖上游品牌 logo、`motion` 或未 vendor 的 `dropdown-account-button`，且自带 280px 与自有折叠模型；`mobile-header` 依赖 `UntitledLogo` + react-aria Dialog；`header-navigation` 是应用级顶栏，而 Dcat 顶栏是冻结的 in-place 锚点；`nav-account-card` 依赖 `motion`/`@react-types/overlays`/`dropdown-account-button`）。`--check-upstream` 一致性由工具保留。
2. **本地适配层 `resources/modern/shell/`**（不放 `ui/`，保证 provenance 逐文件等于上游）：`menu.tsx` 把菜单 payload 映射成上游 `NavItemBase` 行组件；Dcat 的图标字体类名包装成图标组件；分组行用原生 `<details>/<summary>` 披露语义（与上游 `NavList` 一致），受控 `open` + `onToggle` 兜底，key 带兄弟位置以容忍 Dcat 复用数据库 id。
3. **`views/layout.tsx`**：`LayoutMenuView` 的垂直分支改走 `ShellMenu`；水平分支保留 Dcat dropdown 结构（上游没有水平变体，且 `horizontal_menu` 依赖 AdminLTE 的 `.navbar-horizontal`/dropdown 定位）。`LayoutHeaderView` 改为 Tailwind：页头 `text-xl/leading-7/font-semibold/text-primary`（20px，保持 S1 冻结口径）、说明 `text-sm text-tertiary`、面包屑 `flex flex-nowrap overflow-x-auto` + `not-first:before:content-['/']`。
4. **`adapters.tsx`**：`layout.navigation` 的方向键导航把 `summary` 纳入可聚焦行（分组行不再是 `<a>`）。
5. **Blade 外壳工具类 Tailwind 化**（保留全部冻结锚点与门禁）：`partials/sidebar.blade.php`（品牌头、折叠态 logo 切换用 `[.sidebar-collapse_&]:` 变体）、`partials/navbar.blade.php`、`partials/navbar-user-panel.blade.php`、`layouts/container.blade.php`（页脚）、`layouts/content.blade.php`（页头 fallback）、`partials/breadcrumb.blade.php`。`data-dcat-react-component="layout.*"`、`capabilityEnabled(...)`、`data-dcat-modern-fallback`、`.menu-toggle`/`[data-widget="pushmenu"]`、`.main-sidebar`/`.header-navbar`/`.content-wrapper`/`.content-body#app`/`.main-footer`、`.main-horizontal-sidebar` 全部保留。
6. **Tailwind 扫描面**：为外壳 6+2 个 Blade 模板新增受限 `@source`（有意偏离 S1「只扫 `resources/modern/**`」；外壳 Tailwind 类写在 Blade 里，不扫描不会生成；业务页面与 compat island 仍不扫描）。
7. **`styles.css`**：删除已无消费者的 `.nav-sidebar` 菜单规则与 `layout.menu` 内边距规则，改为 `.dcat-shell-menu` 的作用域规则——8px 行圆角（ui-ux 冻结值，上游 `NavItemBase` 自身是 6px）、品牌态（当前项与展开分组的 `--color-bg-brand-primary`/`--color-text-brand-secondary`）、折叠态（隐藏标签/箭头/子树、居中图标）、焦点环。
8. **测试与契约**：`vitest.config.mts` 增加 `@/*` 别名（vendor 组件保留上游导入写法）；`layout.test.tsx` 改为断言 details/summary 结构、`data-dcat-menu-group`/`data-dcat-menu-leaf` 标记、嵌套分组独立展开与不触发导航（113 个 Vitest 全绿）。
9. **预算**：用户授权后重冻结子预算（`performance-budget.json` 新增 `subBudgetRevision`）：JS `102400 → 110848`、CSS `40960 → 32512`，总量 `143360` 与 ratio `0.56` 不变。原因是上游组件经 `@/utils/cx` 引入 `tailwind-merge`（默认配置约 9k gzip），属「由上游组件渲染」的固有成本。
10. **冻结契约同步**：`m0/legacy-contracts.json` 中 sidebar 源字面量 `main-sidebar shadow` → `main-sidebar flex h-full min-h-0 flex-col border-r border-secondary bg-primary`（附 note）；`coverage-registry.json`/`dependency-census.json` 由 `modern:coverage:update` 重生成。

### 验证

- `npm run modern:verify` 退出码 0，14 道门禁全过：coverage 303/296/870、grid 28/36/22、form 68、tokens 43、baseline（260757 legacy base gzip、18 selector contracts）、vendor 72、php-static、bootstrap-absence、typecheck、Vitest 113、build、**artifact JS 110709 + CSS 32401 = 143110 gzip ≤ 143360**、Chrome self-test 154.0.8037.92、preflight 30 探针 0 差异。
- 构建拓扑保持单入口 IIFE + 单 CSS；`manifest.json` 仍解析为 1 JS + 1 CSS。

### 与计划的偏差

- **水平菜单未迁移**：上游 app-navigation 无水平变体，`Menu.blade`/AdminLTE 的 dropdown 定位仍被 `horizontal_menu` 依赖；保留原结构，留待后续（需先决定用哪套水平导航）。
- **`compat-facade.css` 只做了最低限度调整**：外壳几何（260px/5.4rem/52px 的 grid、sticky/floating/hidden 顶栏）与部分装饰仍在 facade 中，因为它们承载 body-class 状态机与浏览器几何契约，删除需要真实浏览器逐视口验证；本轮只移除了被 Tailwind 取代的菜单行规则。CSS 因此可能存在「Tailwind 与 facade 双写但取值一致」的重复，已在结论中记录。
- **演示/浏览器契约未同步**：`scripts/dcat-admin-demo-browser.mjs` 的 `sidebarNestedMenus` 与 appearance 选择器仍指向旧的 `a[data-id]`/`.nav-link.active` DOM，需要用新结构（`li[data-id] > details > summary`、`a[aria-current="page"]`）更新后才能跑 `npm run demo:browser`。
- **真实浏览器外壳契约未跑**：`node scripts/view-modernization-browser.mjs --shell-only` 需要 demo 环境（`tests/bin/install-dep.sh` → `install-admin.sh` → `start.sh`），本轮未起环境。
- **Barrel/侧栏变体未纳入 vendor**：`sidebar-navigation-base.tsx` 因重新导出被排除的模块而未纳入；`empty-state`、`file-upload`、`charts`、`carousel` 仍按 S2 的排除理由保留。

### 遗留（本切片继续推进时先做这些）

1. 更新 `scripts/dcat-admin-demo-browser.mjs` 的菜单选择器（含 appearance 的当前项选择器）并跑通 `npm run demo:browser`。
2. 起 demo 后跑 `--shell-only`，核对 260px / 5.4rem 折叠 / 水平 / floating / hidden / full-page 几何与锚点唯一性、axe。
3. `compat-facade.css` 外壳段收口（把几何与装饰迁到 Tailwind 或明确保留为「外壳 token 层」并删除重复），每步复测体积。
4. 水平菜单的归属决定（保留 Dcat dropdown 还是设计 Untitled 风格水平导航）。
5. 侧栏品牌头/顶栏/页脚的视觉细节（logo 尺寸、用户区 hover、页脚滚动按钮）需在真实浏览器确认。

---

2026-09-30：**批次 2 完成**（真实消费者环境验证 + 折叠态回归修正 + facade 收口范围判定）。`--shell-only`、全量浏览器契约与 `modern:verify` 全部退出码 0。

### 环境配方（下次直接复用）

按 AGENTS.md「只验证当前实际使用的版本」，消费者用 PHP 8.1.34 + Laravel 10.50.3：

1. 隔离数据库：新建 `dcat_dusk` 库与同名账号（不动既有 root/其他库）。
2. `composer install`（消费者 `laravel-tests/composer.json` 需要把 `laravel/framework` 提到 `^10.0`、`nunomaduro/collision` 到 `^7.0`、`spatie/laravel-ignition` 到 `^2.0`；Composer 2.10 的 advisory 阻断需在消费者本地配置里关闭，与 m11 记录的既有授权一致——以上仅改消费者副本，不进仓库）。
3. `bash tests/bin/install-dep.sh` → 打 `.env` 的 DB 配置 → `DCAT_INSTALL_DUSK=0 bash tests/bin/install-admin.sh`。
4. 夹具列：给 `admin_users` 加 `email` 与 `profile`(json)、补 26 行数据（M0 的 grid/form 夹具会查这些列）。
5. 起服务：`php -S 127.0.0.1:8300 -t laravel-tests/public tests/bin/serve-fixtures.php`。**必须用夹具路由**：M0 的 `vertical/horizontal/full-page/pjax-disabled/custom-pjax/grid/form` 夹具要在「无 modern manifest」下走 compat，`artisan serve` 不会做这件事（首跑因此报 jQuery/PJAX 缺失而失败）。

两个坑（已写入 Task 的中断恢复提示）：

- `install-dep.sh` 把包**复制**到 `laravel-tests/dcat-admin`，`vendor/…/laravel-admin` 是指向该副本的符号链接；改完仓库代码必须 `rm -rf laravel-tests/dcat-admin` 重跑 install-dep + install-admin，否则浏览器证据测的是旧快照。**本批差点因此把「副本未同步」当成通过**。
- 不要在浏览器契约运行期间跑 `modern:verify`：它会重建 dist（换哈希）并临时改写 Tailwind 入口，并发会互相污染。

### 真实浏览器证据

| 门禁 | 结果 |
|---|---|
| `node scripts/view-modernization-browser.mjs --shell-only` | 退出码 0，**9 个 profile**（含本批新增的品牌/菜单标签断言） |
| `node scripts/view-modernization-browser.mjs`（全量） | 退出码 0：25 个 profile/viewport captures、6 个 modern 页面族、axe、200% reflow、rollback profiles |
| `npm run modern:verify` | 退出码 0（artifact JS 110709 + CSS 32374 = 143083 gzip） |

这补上了批次 1 缺少的「真实外壳证据」：260px / 5.4rem 折叠 / floating / hidden / horizontal / full-page 几何、锚点唯一性、Bootstrap/AdminLTE 零网络请求，全部在真实消费者上通过。

### 发现并修正的回归（批次 1 引入）

批次 1 给 `logo-mini` 加了 Tailwind `hidden`、给 `logo-lg` 加了 `inline-flex`。折叠态下这套类与 compat facade 的 `.logo-*` 规则打架，**折叠后品牌整体消失**（`mini: none` + `lg: none`）：

- 现有的几何检查（260px / 5.4rem）与全量套件都不会发现它——没有任何断言看品牌可见性；
- 用探针确认后，把两个 span 恢复为原始结构（折叠切换继续由 facade 负责），并在 Blade 注释里写明「`[.sidebar-collapse_&]:` 这类 arbitrary variant 在 Tailwind v4 下没有生成规则，所以现阶段不写这类形同虚设的类」。

**门禁补强**：`verifyBootstrapFreeShell` 增加两条断言——折叠态必须 `logo-lg: none` + `logo-mini` 可见 + 菜单标签 `none`；恢复展开态必须反过来。负向验证（把 `hidden` 注回副本的 `logo-mini`）会让门禁以 `collapsed: brand or menu-label state is wrong: {"mini":"none","full":"none","menuLabel":"none"}` 失败并退出码 1，证明这条门禁真的能拦住该回归。

### `demo:browser` 同步

`checks.sidebarNestedMenus` 与外观采样已改到新 DOM（`li[data-id] > details > summary`、`details.open`、`a[aria-current="page"]`）。**未执行**：`scripts/dcat-admin-demo-browser.mjs` 需要另一个独立 demo 应用（`dcat-admin-demo`，默认 `127.0.0.1:8301`）以及 30 分钟内的 modern 浏览器证据文件，本工作区没有该应用，因此本批只完成选择器同步，未产生运行证据。

### facade 收口范围判定（结论：本批不删，归属 S6/S7）

核对了 `compat-facade.css` 的外壳段后判定「本批删除」不成立，理由：

1. **不是死代码**：垂直侧栏的 `.nav-sidebar .nav-link` 规则虽然不再匹配 React 菜单（React 行是 `a.group/item` / `summary`），但仍服务**服务端 fallback** 路径——降级时同一套 `.main-sidebar/.navbar-header/.nav-link` 标记要能看；`emptyState`/异常页的 no-JS 契约也依赖 fallback 可用（`verifyModernB8ServerFallbacks` 覆盖 login/exception）。
2. **几何不能先删**：260px / 5.4rem / 52px 的 grid、sticky/floating/hidden 顶栏、移动抽屉都由 body class 状态机驱动，Tailwind 化需要同批重写选择器，风险与工作量都属于 S6 的「facade 按新语义令牌重写」。
3. **没有视觉基线兜底**：本环境能跑几何与 axe，但没有像素比较（无 Pillow/ImageMagick/pixelmatch），删除「值相同但来源不同」的装饰规则无法证明零视觉差异；Epic 已把五视口视觉基线重做排给 S7。

因此本批只保留「Tailwind 类与 facade 同值并存」的状态，并把该重复显式记录为 S6 的输入，而不是留下一个悬空的「已收口」说法。

## 关闭时

- Task 归档后回写：实际结果、Task archive 与最终推进状态。
- 毕业候选：Epic 内 Issue → 本 Epic Spec。
- 沉淀检查：
- 关闭判断与验证摘要：
- 遗留：
