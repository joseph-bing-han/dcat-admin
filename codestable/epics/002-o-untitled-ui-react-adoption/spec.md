---
doc_type: epic
title: View 层迁移到 Untitled UI React
status: open
created: 2026-09-30
updated: 2026-09-30
owners:
  - View layer
related_specs:
  - codestable/spec/view-layer/index.md
  - codestable/epics/001-x-view-layer-modernization/spec.md
  - codestable/epics/001-x-view-layer-modernization/ui-ux-spec.md
  - codestable/epics/001-x-view-layer-modernization/compatibility-contract.md
---

# View 层迁移到 Untitled UI React

## 目标结果

把 Dcat Admin 的 Modern View 组件层、样式层和构建层**真正迁移到 [Untitled UI React](https://github.com/untitleduico/react)（MIT 开源部分）＋ Tailwind CSS v4**，替换目前自研的 Dcat UI 组件与 43 令牌体系。

“迁移”在本 Epic 中有明确含义，不允许再用“参考”“视觉相似”表述：

- 仓库中存在按上游路径 vendor 的 Untitled UI React 组件源码，并通过 `PROVENANCE.json` 固定上游 commit、许可证与裁剪清单。
- 页面由 Untitled UI 组件渲染，Tailwind 工具类与上游语义令牌负责样式；自研 `components.tsx` 的 DOM 组件退役。
- 品牌色仍为 Dcat `#586CB1`（通过覆盖上游 `--color-brand-*` 实现），字号采用上游体系。

已关闭的 [`001-x`](../001-x-view-layer-modernization/spec.md) 交付的是“仿 Untitled UI 的 Dcat UI”，不是上游代码迁移。本 Epic 承接原 `2026-08-29-002` 计划目标中**未被实现**的那部分，不回退 001 已经成立的运行时、payload、bridge、PJAX、compat island 与门禁成果。

## 已确认决策（Joseph，2026-09-30）

1. **完整迁移**（选项 A）：引入 Tailwind v4，vendor Untitled UI React OSS 源码；shell 用 `app-navigation`、Grid 用 `table`、表单用 base 控件、Modal/Tabs/Pagination/DatePicker 用 application 组件；Dcat UI 自研组件退役。
2. **保留品牌色**：`#586CB1` 作为 `brand` 覆盖；字号采用上游体系，页面标题由 20px 调整为上游 `display-xs`（24px）。
3. **接受全局 preflight**：Tailwind preflight 全局生效，compat island 的旧插件样式冲突逐个修复，不做层裁剪或前缀规避。
4. 规格变更已获授权：`ui-ux-spec` 升 `2.0.0`、`compatibility-contract` 升 `5.0.0`，五视口视觉基线整批重做。

## 现状与差距（2026-09-30 核对）

### 上游事实（已核实，非推断）

| 项目 | 事实 |
|---|---|
| 许可证 | OSS 组件 MIT 可商用；PRO 组件另属独立协议，不在范围内 |
| 获取方式 | copy-paste 源码库，`package.json` 为 `private`，**不作为 npm 依赖安装** |
| 技术前提 | Tailwind CSS v4.3、`react-aria-components`、React 19.3、TypeScript |
| 覆盖范围 | `components/application` 提供 `app-navigation`、`table`、`tabs`、`modals`、`pagination`、`date-picker`、`empty-state`、`loading-indicator`、`file-upload`、`slideout-menus`、`charts`、`carousel` —— 管理后台所需的 shell 与数据表也在 OSS 内 |
| 组件内部依赖 | 组件引用 `@/utils/cx`（clsx + tailwind-merge）、`@/utils/is-react-component` 与 `@theme` 语义令牌层（`bg-brand-solid`、`text-secondary`、`ring-primary` 等） |
| 图标 | `@untitledui/icons` 为独立 MIT npm 包（0.0.23，`sideEffects:false`，可 tree-shake） |

### 迁移前实现（2026-09-30，历史）

- `resources/modern/components.tsx` 导出 30+ 个自研组件，样式类命名空间 `dcat-modern-*`；`resources/modern` 内共有 **238 个** `dcat-modern-*` 类名。
- 样式实现为 43 个 Dcat 令牌（`tokens.json` → `tokens.css`/`tokens.ts` 生成）＋`styles.css` 2285 行＋`compat-facade.css` 979 行＋`compat-utilities.css` 224 行。
- 构建为 Vite 单入口 IIFE（`vite.config.mts`），无 Tailwind、无 PostCSS 管线；core JS gzip 98131 字节，总产物 111250 字节，预算 143360 字节。
- `resources/modern/vendor/untitled-ui/` 只有 `LICENSE` 与 `PROVENANCE.json`，`selectedSources` 仅 `components/base/buttons/button.tsx` 与 `components/base/toggle/toggle.tsx`，`adaptation` 明确写明不 vendor 上游代码、不用 Tailwind class。
- `ui-ux-spec.md` 1.1.0 第 17 行写明“Untitled UI 提供组件参考，不取代本项目的兼容契约和设计令牌”；`compatibility-contract.md` 4.0.0 的 C3 明文禁止 Tailwind preflight 与通用 utility 泄漏。

### 差距结论

原计划目标是“迁移到 Untitled UI React”，实现结果是“仿 Untitled UI 的 Dcat UI”，两者不是同一件事；收窄发生在 B1 允许“Dcat 独立实现”之后，并在 1.1.0/4.0.0 规格里被固化。本 Epic 修正该漂移。

## 迁移边界：可替换面 vs 冻结面

这是本 Epic 最重要的设计判断。核对结果显示边界是**干净**的：

**必须保持（冻结面，与组件库无关）**

- `data-dcat-*` 标记属性族，如 `data-dcat-modern-field`、`data-dcat-modern-fallback`、`data-dcat-react-component`、`data-dcat-modern-family`、`data-dcat-modern-capability`、`data-dcat-grid-row-selector`。
- PHP/Blade 侧引用的 12 个 `resources/views` 与 11 个 `src` 中的 `dcat-modern-*` 类名（页面锚点、renderer 标记、scope）。
- PJAX container id、`window.Dcat` / `window.DcatReact` 生命周期、payload/manifest/bridge 版本化契约、`Admin::resolveHtml()` 资源提取协议。
- Grid 查询参数、Form name/id 与载荷、动作顺序、字段顺序、权限与错误语义。
- compat island 边界与 Dcat compat facade 的公开覆盖范围。

**可以替换（迁移面）**

- `components.tsx` 的自研 DOM 组件及其 `dcat-modern-*` 样式类（238 个中的绝大多数）。
- `tokens.json`/`tokens.css`/`tokens.ts` 令牌生成链，改为 Tailwind `@theme` 作为唯一令牌来源。
- `styles.css` 中与自研组件耦合的规则（保留布局/定位/工具类）。
- `resources/modern/views/*.tsx` 的渲染结构（改由 Untitled UI 组件承担）。

**结论**：本 Epic 不改运行时架构。`runtime.ts`、`bridge.tsx`、`navigation.ts`、`adapters.tsx`、`store.ts`、`dom.tsx`、`compat-*.js` 与全部门禁脚本框架继续有效，只做组件/样式/构建层的替换与相应门禁适配。

## 目标架构

```text
Laravel route/controller → PHP builders → ViewModel / payload
                                   |
                            bridge / runtime / PJAX        （不变）
                                   |
                    +──────────────+──────────────+
                    v                             v
        Untitled UI React 组件            compat island
        （vendor 源码 + Tailwind）     （原节点 + Dcat facade CSS）
                    |                             |
                    +──────────────+──────────────+
                                   v
              Tailwind v4（@theme 语义令牌 + preflight 全局）
                    ↑
        Dcat brand 覆盖（--color-brand-* = #586CB1 阶梯）

vendor 目录：resources/modern/ui/（镜像上游路径，PROVENANCE 固定 commit）
```

设计要点：

- `resources/modern/ui/` 镜像上游路径（如 `ui/components/base/buttons/button.tsx`），保留上游文件形状以便未来按 commit diff 升级；改动以 patch 注释标注。
- Tailwind 入口使用 `@source` 显式限定扫描范围（`resources/modern/**`），避免扫描 Blade/Demo/vendor 造成 CSS 膨胀；动态拼接的 class 必须改为静态映射，必要时少量 safelist。
- `--color-brand-*` 11 档阶梯需按 `#586CB1` 推导并保证 WCAG 2.2 AA 对比度，是 S1 的交付物。
- 现有 43 个 Dcat 语义令牌需要一张到 Tailwind 语义变量的映射表（如 `primary` → `bg-brand-solid`、`text` → `text-primary`），作为 `styles.css` 与 `compat-facade.css` 的改写依据。
- 全局 preflight 生效后，compat island 的补偿规则集中维护，不得散落到业务页面。

## 切片计划

### S0 规格与契约升版

- `ui-ux-spec` → `2.0.0`：组件来源改为 Untitled UI React OSS；字阶改为上游体系（页面标题 `display-xs` 24px）；品牌色保留 Dcat 阶梯；允许 Tailwind preflight；重写“AI 与实现门禁”中与自研组件绑定的条款。
- `compatibility-contract` → `5.0.0`：改写 C3“构建与 CSS”中禁止 Tailwind 的条款，新增层导入、`@source` 范围、preflight 策略与 compat island 隔离规则；新增“组件来源与 provenance”条款。
- 同步契约指纹到 `implementation-capability-matrix.json`、`m0/*.json` 与相关门禁脚本。

出口：两份规格可被后续门禁引用，`modern:verify` 契约检查不因版本变化失败。

### S1 Tailwind v4 构建接入与穿刺

- 引入 `tailwindcss` 与 `@tailwindcss/vite`；新增 Tailwind 入口 CSS（`@import "tailwindcss"` + `@source` 限定 + Untitled 语义令牌层 + Dcat brand 覆盖）。
- 交付 `#586CB1` 完整 11 档梯阶与 Dcat→Tailwind 语义令牌映射表。
- 量测：单入口 IIFE 拓扑是否保持、preflight 对 compat island 的实际破坏面、CSS/JS gzip 体积增量。

出口：一份 preflight 影响清单（逐类 compat island 控件）、新体积数字、是否需要 island 级补偿的结论。**未通过前不进入 S2。**

#### S1 穿刺结论（2026-09-30，已通过）

| 项目 | 结果 |
|---|---|
| 构建拓扑 | 保持单入口 IIFE + 单 CSS 文件：`manifest.json` 解析为 1 个 hashed JS 入口与 1 个 CSS 文件 |
| CSS 体积 | 100773 → 134697 字节 raw；13119 → **19338 字节 gzip**（+6219） |
| JS 体积 | 98131 字节 gzip，未变化 |
| 总产物 | 117469 字节 gzip / 预算 143360，**余量 25891 字节** |
| 扫描范围 | `source(none)` + `@source "./**/*.{ts,tsx}"`（排除 `*.test.*`），未扫描 Blade / Demo / vendor |
| 品牌色 | `--color-brand-600` 解析为 `#586cb1`；上游紫色 `#7F56D9` 未残留 |
| 门禁 | `npm run modern:verify` 退出码 0（113 Vitest、artifact、browser self-test 全绿） |

preflight 破坏面（实测，真实插件 CSS + 真实 Select2 DOM，30 个探针）：

- 首次测量 15 个探针出现差异，集中在**元素级默认值**：`h4` 的 margin 与 font-weight、`p` 的 margin、`ul/ol/li` 的 margin 与项目符号、`img` 的 `display:inline`/`vertical-align`、`hr` 的 color、以及 preflight 的 `border:0 solid` 让所有元素 `border-style` 由 `none` 变 `solid`。
- 交互控件本体（`.btn`、`.form-control`、`.input-group-addon`、duallistbox、webuploader pick、editormd 工具栏、Select2 选中项）**没有被重置**——因为 compat facade 与插件 CSS 都显式声明了背景、边框、内边距。
- `border:0 solid` 是**潜在**地雷：只声明 `border-width` 的规则会突然显形。当前仓库中此类规则（webuploader 三角、datetimepicker `today` 角标、compat facade 的 chevron）都在同一条规则里成对声明了 `border-style: solid`，因此**未观测到实际回归**；仍加入 0 特异性保险。

处置：新增 `resources/modern/compat-preflight-restore.css`，在 `.dcat-modern-active` 作用域内以最低特异性（`:where()`）恢复 UA 默认值。规则放在**无 layer 的普通作者样式**中，因此优先级高于 preflight 所在的 `@layer base`，同时任何显式声明仍可覆盖它。

验证：`node scripts/view-modernization-preflight-impact.mjs --build-baseline --strict` → **30 探针 0 差异**。脚本自动完成“临时关闭 Tailwind 入口构建基线 → 比对 → 恢复并重建”，可重复执行，成为 S6 的 preflight 门禁雏形。

新增/修改的构建文件：`resources/modern/tailwind.css`、`resources/modern/compat-preflight-restore.css`、`resources/modern/ui/styles/theme.css`（上游文件）、`scripts/view-modernization-preflight-impact.mjs`、`vite.config.mts`、`resources/modern/index.tsx`。

### S2 vendor 组件层建立

- 按上游路径 vendor：`utils/cx`、`utils/is-react-component`、`components/foundations`、`components/base/{buttons,input,select,checkbox,radio-buttons,toggle,badges,avatar,dropdown,progress-indicators,form,file-upload-trigger}`、`components/application/{app-navigation,table,tabs,modals,pagination,date-picker,empty-state,loading-indicator,slideout-menus}`。
- `PROVENANCE.json` 更新为完整清单（commit、许可证、上游路径、本地裁剪与 patch）；`THIRD_PARTY_NOTICES` 同步；`@untitledui/icons` 与 `tailwind-merge` 等新增依赖逐项记录。
- 明确**不引入**的依赖（`recharts`、`motion`、`embla-carousel`、`input-otp`、`qr-code-styling`、`react-hook-form`、`zod`、`next`、`next-themes`），除非某个已 vendor 组件强依赖且无法局部裁剪。
- `components.tsx` 拆分：保留布局/定位工具（如 `computeFloatingPosition`），DOM 组件删除。

出口：vendor 目录可编译，`modern:typecheck` 通过，provenance 门禁覆盖新文件。

#### S2 结果（2026-09-30，已完成）

vendor **69 个文件 / 403842 字节**，上游 revision `c981a73bcd6b6c68d2a54070f20f020191212828`，落在 `resources/modern/ui/`；工具 `scripts/view-modernization-vendor-untitled-ui.mjs`，离线门禁 `modern:vendor` 已接入 `modern:verify`，上游对照用 `--check-upstream`。

与计划的两处偏差：

1. **app-navigation 与 empty-state 延后**：app-navigation 的 `sidebar-simple` 依赖上游品牌 logo、`nav-account-card` 依赖 `@/hooks/use-breakpoint` 与 `@react-types/overlays`，需要在 S3 先设计品牌插槽；empty-state 依赖 `@untitledui/file-icons`，S4 再定。两者都不影响 S2 出口。
2. **`components.tsx` 未拆分**：其自研组件仍在被 `views/*.tsx` 使用，删除要等 S3–S6 替换完成，否则会打断构建。拆分动作移入 S3–S6，S2 只保证组件层可编译。

新增依赖（5 个，均已进通知文件）：`@untitledui/icons`、`tailwind-merge`、`@internationalized/date`、`@react-stately/utils`、`@react-aria/utils`。`@/*` 别名使 vendor 文件保持上游原样。

**体积结论（重要）**：CSS 19326 → **31865 gzip**，JS 不变 98131，总产物 **129996 / 143360**，余量由 25891 降到 **13364**。原因是 Tailwind 的 `@source` 属于**文件级内容探测**，不跟随 Vite 的 import 图——已 vendor 但暂未被引用的组件其 utility 也会先生成。这意味着 S3–S6 的 CSS 成本已被提前预付，余量变薄；当时要求 S3 起逐批复测并在 S7 重新冻结；此大小限制已由 2026-10-02 决定取消。

### S3 shell 迁移（app-navigation）

- `views/layout.tsx` 与 `runtime.ts` 的 shell 部分（sidebar、navbar、menu、footer、breadcrumb、page header）改用 Untitled `app-navigation` 结构与 Tailwind 类。
- 保持 260px 展开侧栏、折叠/水平/full-page profile、sticky/floating/hidden 顶栏、菜单分组与顺序、`data-dcat-react-component="layout.*"` 标记。

#### S3 批次 1 结果（2026-09-30，进行中）

**已完成**：垂直侧栏菜单改由上游 `NavItemBase` 渲染（分组用原生 `<details>/<summary>`），页头/面包屑 React 视图与 sidebar/navbar/footer/breadcrumb 的 Blade 工具类改 Tailwind，`resources/modern/shell/` 承载 Dcat 侧适配；`adapters.tsx` 方向键导航纳入 `summary`；`vitest.config.mts` 增加 `@/*` 别名。

**门禁**：`npm run modern:verify` 退出码 0（artifact JS 110709 + CSS 32401 = 143110 gzip）。子预算经用户授权重冻结：JS 102400 → 110848、CSS 40960 → 32512，总量 143360 与 ratio 0.56 不变（新增 `subBudgetRevision` 记录）；`m0/legacy-contracts.json` 的 sidebar 源字面量随 Tailwind 类更新并附 note。

#### S3 批次 2 结果（2026-09-30，已完成验证）

在真实消费者上补齐了批次 1 缺失的外壳证据，并修掉批次 1 自己引入的回归：

- **环境**：PHP 8.1.34 + Laravel 10.50.3 消费者、隔离 MySQL 库、`serve-fixtures.php` 夹具路由（M0 兼容夹具必须在无 manifest 下走 compat）。完整配方与两个坑（install-dep 会覆盖 `.env` 并把包复制成快照；不要与 `modern:verify` 并发）写在 [S3 Issue](issues/004-o-迁移-shell-到-app-navigation.md) 的环境配方节。
- **证据**：`--shell-only` 退出码 0（9 profiles）、全量浏览器契约退出码 0（25 captures / 6 families / axe / 200% reflow / rollback）、`modern:verify` 退出码 0（artifact JS 110709 + CSS 32374 = 143083 gzip）。
- **回归与门禁**：批次 1 给 `logo-mini` 加的 Tailwind `hidden` 会让**折叠态品牌整体消失**（几何与全量套件都测不出）。已恢复原始结构，并在 `verifyBootstrapFreeShell` 增加「折叠态必须显示 mini 品牌、隐藏全量品牌与菜单标签；展开态相反」的断言；负向注入同一缺陷可让门禁失败，证明断言有效。
- **facade 收口判定**：本批**不**删除外壳段规则。这些规则同时服务 React 菜单与服务端 fallback 两条路径（fallback 用同一套 `.main-sidebar/.navbar-header/.nav-link` 标记），几何/装饰的删除又缺少像素基线（本环境无 Pillow/ImageMagick/pixelmatch）；归属 S6（facade 按新语义令牌重写）与 S7（五视口视觉基线整批重做）。当前状态是「Tailwind 类与 facade 同值并存」，已显式记录为 S6 的输入。

**未完成**（详见 Issue 的「遗留」）：水平菜单仍用 Dcat dropdown（上游无水平变体）；facade 外壳段收口待 S6；`demo:browser` 的选择器已同步但**未执行**（需要独立 demo 应用 `dcat-admin-demo` 与 30 分钟内的 modern 证据文件，本工作区没有该应用）。

**体积提醒（更新 R2）**：CSS 32374、JS 110709，总 143083 / 143360，余量仅 **277 字节**；该限制现已取消，后续只记录实际体积。

### S4 Grid 迁移（application/table）

2026-10-02：**本轮完成并验证**。简单表格使用上游 Table，复杂表头/跨行列/展开/快速新增以原生结构保留冻结协议并由 TableCard 包裹；分页、空态、徽标、进度和展开操作使用上游组件。复杂 Grid/固定列/原节点恢复回归通过。

- `views/grid.tsx` 的表格、表头/排序指示、分页、空态、加载态、行选择改用 Untitled `table`/`pagination`/`empty-state`。
- 保持 `.dcat-modern-grid-view`、固定列、展开行、`data-dcat-grid-row-selector`、查询参数、displayer 与 filter 的 compat 结论。
- 反自动 card 化：仍不得把数据表在窄屏改成卡片，除非另有批准。

### S5 Form 迁移（base 控件 + form）

2026-10-02：**本轮完成并验证**。InputBase/TextAreaBase/NativeSelect/Choice/Tabs 与双列表 Button 接入；多选/optgroup/颜色/范围保持原生协议；插件、提交工具与自定义节点保留原节点岛。锚点、required/error、FormData、非活动 panel、单选/reset 回归通过。

- `views/form.tsx` 基本字段改用 Untitled `input`/`select`/`checkbox`/`radio-buttons`/`toggle`/`textarea`/`form`。
- 保持 `data-dcat-modern-field`、`name/id`、CSRF、旧值恢复、错误定位与焦点顺序、compat field island。

### S6 其余页面族与浮层

2026-10-02：**本轮完成并验证**。容器与操作消费上游 TableCard/Button，Modal/Drawer/Dropdown/Popover/Tooltip/EmptyState/LoadingIndicator 接入；Alert/Toast 无OSS独立组件，使用主题语义容器与上游Button。components.tsx 自研DOM组件退役。43旧变量仅为Tailwind主题别名；compat/preflight补偿限于原节点岛，旧Dcat.confirm协议保持。

- Show、Tree、Widget、Dashboard、Login、System 及 Modal/Drawer/Toast/Tooltip/Popover 改用 Untitled 对应组件。
- compat island 补偿 CSS 收口：`compat-facade.css` 与 `compat-utilities.css` 按新语义令牌重写，处理 preflight 带来的重置影响（Select2、webuploader、TinyMCE、duallistbox、datetimepicker 等）。

### S7 门禁、体积观测与五视口重基线

2026-10-02：**本轮完成并验证**。modern:verify改为先构建再刷新coverage/census；tokens检查单一主题来源。16代表页/80五视口截图与axe通过，30重排代理通过，preflight30探针0差异。最终227418gzip字节，仅观测。证据和边界详见Issue005。

- `tokens` 脚本改为校验 Tailwind `@theme` 单一来源；`baseline`、`artifact`、`php-static`、`bootstrap-absence`、`coverage` 脚本适配。
- Vitest 与浏览器契约更新到新组件 DOM（保持 marker 断言不变）。
- 五视口几何与截图基线整批重做；axe、语义 DOM、键盘焦点、200% 重排复跑；报告 raw/gzip 实测，不设置文件大小门禁。

## 门禁与验证

2026-10-02 用户最终决定：彻底取消文件大小限制，替代此前“按最终实测重定预算”。本文较早批次中的预算与余量均为历史记录，不再是验收条件。

每批沿用 001 已建立的门禁框架，并新增/调整：

- `modern:verify` 全链通过（coverage、grid/form capabilities、tokens、baseline、php-static、bootstrap-absence、typecheck、vitest、build、artifact、browser self-test）。
- **新增 provenance 门禁**：vendor 目录每个文件可追溯到 `PROVENANCE.json` 记录的上游 commit 与许可证；禁止引入 PRO 源码。
- **新增 preflight 影响门禁**：compat island 代表控件（Select2、上传、编辑器、双列表、日期时间选择器）在 preflight 生效后视觉与交互可用。
- 保持既有冻结断言：`data-dcat-*` 标记、PHP/Blade 侧 `dcat-modern-*` 锚点、PJAX 生命周期、Grid 查询参数、Form 载荷、动作顺序。
- 体积：按用户 2026-10-02 最终决定，取消绝对、相对、分资源与增量 chunk 的文件大小限制；只报告 raw/gzip 实测，不冻结或重定预算。
- 视觉：页面标题 20→24 属于已批准的口径变化，五视口几何必须在同一批内整体重做，不允许新旧基线混用。

## 风险与通断计划

| 编号 | 风险 | 通断判据 |
|---|---|---|
| R1 | 全局 preflight 重置 compat island 的旧插件（Select2/上传/编辑器/双列表） | **S1 已量化并补偿**：30 探针 0 差异；S6 仍需按最终组件重跑同一门禁 |
| R2 | 产物体积增长 | **仅观测**：用户 2026-10-02 已取消全部文件大小限制；保留 raw/gzip 统计与重复样式收口，不因大小阻断迁移或发布 |
| R3 | 上游要求 `react-aria-components` 1.21 + React 19.3，当前 1.20 / 19.2.8 | S1 未升级依赖（Tailwind 与 react-aria 版本无关）；S2 vendor 组件时一并升级并保持 `modern:test` 全绿 |
| R4 | 上游无版本化发布，只能 pin commit | provenance + 裁剪清单可用于未来 diff 升级；无法升级时显式记录 |
| R5 | react-aria `Table` pattern 与 Grid 的表头/固定列/展开行/行选择语义冲突 | S4 前先做局部穿刺，保留查询参数与兼容语义 |
| R6 | 238 个自研样式类与 979 行 compat facade 需要重新映射 | 映射表在 S1 交付，S2-S6 逐族消费 |
| R7 | 五视口基线整批重做会与 001 的历史几何证据不一致 | 明确标记 001 几何证据为历史；本 Epic 建立新基线 |

## 不包含

- 不引入 Untitled UI PRO 的任何组件、页面示例或源码。
- 不改 PHP/HTTP/表单/PJAX 契约，不新增 renderer 开关或回退路径。
- 不把 compat island 全部原生化；compat 边界按 001 结论继续有效。
- 不引入 `recharts`/`motion` 等重依赖带来的图表或动画能力扩展（除非某已 vendor 组件强依赖）。
- 不做与 View 组件无关的后端重构、功能改版或依赖大版本升级。

## 完成定义

1. `resources/modern/ui/` 存在按上游路径 vendor 的组件源码，provenance 完整，无 PRO 内容。
2. 内建页面由 Untitled UI 组件渲染；`components.tsx` 自研 DOM 组件退役，Dcat UI 不再是组件来源。
3. Tailwind v4 为唯一样式实现与令牌来源，品牌色为 Dcat `#586CB1` 阶梯。
4. `data-dcat-*`、PHP/Blade 锚点、PJAX、payload/bridge、Grid/Form 协议与动作顺序全部保持，证据与 001 同级。
5. `ui-ux-spec` 2.0.0、`compatibility-contract` 5.0.0 已生效，契约指纹与门禁同步。
6. compat island 在 preflight 下可用，有逐控件验证证据。
7. 五视口几何与视觉基线、axe、语义 DOM、键盘、200% 重排全部在新组件层上重新通过，并报告产物 raw/gzip 实测。

## 推进记录

2026-09-30：Epic 创建。确认原计划目标未实现（Dcat UI 自研实现替代了上游迁移），完成现状与差距核对、上游事实核实、迁移边界量测（238 个内部样式类 vs 12+11 个 PHP/Blade 冻结锚点）与 S0-S7 切片设计。用户确认完整迁移、保留品牌色、接受全局 preflight。

2026-09-30：S1（Tailwind v4 接入与 preflight 穿刺）完成并通过。Tailwind 4.3.3 与 `@tailwindcss/vite` 接入构建，上游 `styles/theme.css` 已 vendor 到 `resources/modern/ui/styles/`；品牌阶梯按 `#586CB1` 重锚、中性色钉到 Dcat 灰阶。构建拓扑保持单入口 IIFE + 单 CSS；增量 +6219 gzip，余量 25891。preflight 破坏面已量化（15/30 探针差异集中在元素级默认值），并用 `compat-preflight-restore.css` 补偿到 30 探针 0 差异；测量脚本可自动构建基线，成为后续门禁。令牌映射表见 [token-mapping.md](token-mapping.md)，其中 error/success/warning 色阶与 overlay/modal 阴影标注为 S2/S6 待决。

2026-09-30：S0（规格升版）完成。`ui-ux-spec` → **2.0.0**（组件来源改为 Untitled UI React OSS、采用上游字号体系、preflight 合规条款、组件与样式来源节、兼容与 preflight 节），`compatibility-contract` → **5.0.0**（C3 改为规定 Tailwind v4 接入方式，新增「组件来源与 provenance」条款与相应破坏性判定）。契约指纹同步到 `implementation-capability-matrix.json` 的 `targetContracts` 与 `view-modernization-baseline.js` 的期望版本。两份规格的维护归属与「Epic 002 关闭时毕业到 Project Spec」已写入文档头。

2026-09-30：状态色口径落定。用户选择「跟随上游」，但实测上游 600 档的 success `#00A63E`（3.22:1）与 warning `#D08700`（2.94:1）达不到规范自身的 4.5:1。最终实现为**保留上游语义变量名与结构、值取 AA 达标档**（error 6.57 / success 5.41 / warning 5.43）；`info` 为 Dcat 扩展。详见 [token-mapping.md](token-mapping.md)。

2026-09-30：S2（vendor 组件层）完成。69 个文件 / 403842 字节 vendor 到 `resources/modern/ui/`，逐文件 sha256 记录在 provenance 并附排除原因；`@/*` 别名让上游文件保持原样；新增 5 个运行时依赖进入第三方声明；离线门禁 `modern:vendor` 接入 `modern:verify`。体积由 117469 升至 **129996 gzip**（余量 13364），原因是 `@source` 的文件级探测会为尚未引用的 vendor 组件生成 utility——等于预付 S3–S6 的 CSS 成本，S3 起每批复测。详见 [vendor Issue](issues/003-o-vendor-untitled-ui-组件层.md)。

门禁现状：`npm run modern:verify` 全链（coverage → grid/form capabilities → tokens → baseline → **vendor** → php-static → bootstrap-absence → typecheck → vitest → build → artifact → browser self-test → **preflight**）退出码 0；规格契约检查在 2.0.0/5.0.0 下通过。

### S1 发现的既有门禁缺陷（非本 Epic 引入，S7 处理）

`npm run modern:verify` 的执行顺序是 `modern:coverage --check` → … → `modern:build`，即**先用旧产物校验 census，再重新构建**。任何改变产物内容哈希的源码改动（Tailwind 让 CSS 哈希变动变得频繁）都会让 census 在构建后立即过期，必须额外手动跑一次 `node scripts/view-modernization-coverage.js` 才能再次通过。S1 期间已遇到两次。S7 需要把 `modern:build` 提到 census 校验之前，或让 census 校验基于构建后的产物。

2026-09-30：S0/S1/S2 以单主题提交落盘。提交 `e363d118`「迁移 View 组件层到 Untitled UI React 与 Tailwind v4」（107 文件，含 69 个 vendor 源文件），提交前 `modern:verify` 退出码 0。同批修复了 preflight 门禁自身的两个缺陷：基线构建改为输出到临时目录（原先会清空发布目录并删除 THIRD_PARTY_NOTICES.txt），以及新增陈旧标记守卫与 SIGINT/SIGTERM 恢复（原先被强杀会把 `index.tsx` 留在「关闭 Tailwind」的中间态并静默产出错误产物）。

2026-09-30：S3 批次 1 完成（未整体完成）。垂直侧栏菜单改由 vendor 的 `NavItemBase` 渲染（`details/summary` 披露结构），页头/面包屑 React 视图与 sidebar/navbar/footer/breadcrumb 的 Blade 工具类改 Tailwind，新增 `resources/modern/shell/` 适配层；vendor 增至 **72 文件 / 411560 字节**。用户授权重冻结子预算（JS 102400 → 110848、CSS 40960 → 32512，总量与 ratio 不变，`performance-budget.json` 新增 `subBudgetRevision`），原因是上游组件经 `@/utils/cx` 引入 `tailwind-merge`（约 9k gzip）。`npm run modern:verify` 退出码 0（artifact 143110 / 143360）。剩余：水平菜单归属、facade 外壳段收口、demo/浏览器契约与新 DOM 同步、真实浏览器 `--shell-only` 证据。

2026-10-02：S4–S7 本轮执行完成，结果见 [Issue005](issues/005-o-完成-view-组件迁移与验收.md) 和 [归档Task](../../tasks/archived/2026-10-02-001-complete-untitled-view-migration.md)。保留复杂表格、原生多选/分组/颜色控件和原节点岛的协议适配；水平菜单仍为Dcat结构（上游无水平变体），不是未迁移的垂直行组件。完整本地门禁、当前环境PHP20/117与扩展新DOM证据通过；最终core JS/CSS共227418gzip字节，不设限制。独立Review工具不可用，额外上游树核验HTTP403；原生UI缩放/人工读屏/独立Demo全站crawl未执行。Epic保持open，不自动毕业、提交或发布。
