---
kind: issue
title: vendor Untitled UI React 组件层并建立 provenance 门禁
type: chore
status: open
created: 2026-09-30
---

# vendor Untitled UI React 组件层并建立 provenance 门禁

> **读者：** 跨会话接手的人——「要做成什么、别碰什么、现状与方案是否还成立、怎么验、关了要回写哪里」。

---

## 做成以后是什么样

仓库里存在按上游路径镜像的 Untitled UI React 开源组件源码，可被 `@/...` 引用并通过类型检查；每个文件都能追溯到固定上游 commit 的 sha256；裁剪范围与排除原因有据可查；新增的运行时依赖进入第三方声明。

**范围：** 包含 vendor 工具、组件源码落盘、`@/*` 别名、provenance 与 notices 门禁、依赖登记；不包含 shell/Grid/Form 的实际替换（S3–S6）。

**归属：** 属于 Epic `002-o-untitled-ui-react-adoption`，为其 S2 切片。

## 为什么现在做 / 当前坏在哪

Epic 002 的目标是让页面由上游组件渲染，而此前仓库只有一个 provenance 文件与两份上游文件的「参考」记录（`resources/modern/vendor/untitled-ui/PROVENANCE.json` 的 `selectedSources` 只含 button.tsx 与 toggle.tsx，`adaptation` 明确写了不 vendor 源码）。组件层不存在，S3–S6 无从落地。

同时 `compatibility-contract` 5.0.0 新增了「组件来源与 provenance」条款，要求每个 vendor 文件可追溯、本地改动可识别、禁止 PRO 源码、依赖逐项登记——需要对应的门禁才能守住。

## 方案与实现安排

1. 新增维护工具 `scripts/view-modernization-vendor-untitled-ui.mjs`：按 `PROVENANCE.json` 里固定的 revision 拉取上游文件树，按 allow 目录/文件清单与排除清单选出集合，写入 `resources/modern/ui/`（镜像上游路径），并刷新 provenance 的逐文件 sha256、字节数与排除原因。
2. 拉取是维护动作，产物提交进仓库；构建不需要网络。
3. 通过 `tsconfig.json` 的 `paths` 与 `vite.config.mts` 的 `resolve.alias` 提供 `@/*` → `resources/modern/ui/*`，使组件文件**保持上游原样**（含 `@/utils/cx` 这类导入），便于按 commit diff 升级。
4. `resources/modern/ui/PATCHES.md` 登记本地改动与后续切片已知的适配点。
5. 门禁：`modern:vendor`（离线：provenance ↔ 本地文件哈希一致，且不存在未记录的源码文件）；`--check-upstream` 额外比对上游文件树（需网络，不进 verify 链）。
6. `view-modernization-notices.js` 的依赖图根加入 vendor 组件实际引用的运行时包，通知文件改为按族汇总而不是罗列上百行路径。

**不碰的边界：** 不改任何现有页面渲染、不改 `components.tsx`、不改运行时；本切片结束后应用行为与外观不变。

## 验证

- `modern:vendor`、`modern:typecheck`、`modern:verify` 全绿。
- `node scripts/view-modernization-vendor-untitled-ui.mjs --check-upstream` 与上游文件树一致。
- provenance 中每条排除项都有原因；`PROVENANCE.json` 不含 PRO 相关路径。
- 体积：本轮 CSS 因 `@source` 扫描 vendor 源码而增长，记录实测值；原大小预算已于 2026-10-02 取消。

## 执行记录

2026-09-30：完成。上游 revision `c981a73bcd6b6c68d2a54070f20f020191212828`，vendor **69 个文件 / 403842 字节**，落在 `resources/modern/ui/`。

- 纳入：`components/base/{avatar,badges,button-group,checkbox,dropdown,file-upload-trigger,form,input,progress-indicators,radio-buttons,select,tags,textarea,toggle,tooltip}`、`components/base/buttons/{button,button-utility,close-button}`、`components/application/{date-picker,loading-indicator,modals,pagination,slideout-menus,table,tabs}`、`components/foundations/{dot-icon,featured-icon}`、`hooks/{use-breakpoint,use-resize-observer}`、`utils/{cx,is-react-component}`、`styles/theme.css`。
- 排除（每条附原因）：carousel（embla）、charts（recharts）、empty-state（`@untitledui/file-icons`，S4 再定）、file-upload（motion + file-icons，后台上传走 compat island）、app-navigation（S3 处理，`sidebar-simple` 依赖上游品牌 logo 需先设计替换）、buttons 的 app-store/social 家族（营销资产）、dropdown 的应用级变体（只留基础 `dropdown.tsx`）、`form/hook-form.tsx`（react-hook-form）、`input/pin-input.tsx`（input-otp）、`input/input-payment.tsx`（payment-icons 品牌资产）、slider、`.demo.*`/`.story.*`。
- 新增依赖：`@untitledui/icons`、`tailwind-merge`、`@internationalized/date`、`@react-stately/utils`、`@react-aria/utils`（均已登记，通知文件从 16 个包增至 20 个）。
- 适配点：`tsconfig.json` 去掉 `baseUrl`（TypeScript 7 已移除该项），改用 `paths` 相对解析；`vite.config.mts` 增加 `resolve.alias`。
- 体积实测：CSS 19326 → **31865 gzip**（+12539），JS 不变 98131；总产物 129996 / 143360，**余量从 25891 降到 13364**。原因是 Tailwind 的 `@source` 是**文件级**内容探测，不跟随 Vite 的 import 图：已 vendor 但尚未被引用的组件，其 utility 也会先生成。这等于把 S3–S6 的 CSS 成本提前预付，代价是余量变薄，S3–S6 每批都必须复测，S7 需要按最终实测重新冻结预算。
- 门禁接线：`modern:vendor` 已加入 `modern:verify`（离线可跑）；`modern:preflight` 亦在上一步接入。`modern:verify` 退出码 0，113 个 Vitest 用例通过，preflight 门禁 30 探针 0 差异。

**遗留：** `@untitledui/file-icons` 与 `motion` 是否引入留给 S4/S6 决策；app-navigation 家族留给 S3；vendor 组件的实际渲染正确性（utility 是否真的生效）要到 S3 才会被浏览器证据覆盖。

## 关闭时

- Task 归档后回写：实际结果、Task archive 与最终推进状态。
- 毕业候选：Epic 内 Issue → 本 Epic Spec。
- 沉淀检查：
- 关闭判断与验证摘要：
- 遗留：
