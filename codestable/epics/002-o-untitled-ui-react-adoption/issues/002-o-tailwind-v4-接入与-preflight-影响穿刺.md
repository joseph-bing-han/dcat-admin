---
kind: issue
title: Tailwind v4 接入与 preflight 影响穿刺
type: refactor
status: open
created: 2026-09-30
---

# Tailwind v4 接入与 preflight 影响穿刺

> **读者：** 跨会话接手的人——「要做成什么、别碰什么、现状与方案是否还成立、怎么验、关了要回写哪里」。

---

## 做成以后是什么样

Tailwind CSS v4 已接入构建，Untitled UI 的语义令牌层可用，Dcat 品牌色 `#586CB1` 以 11 档覆盖生效；同时**用实测数字回答三个问题**，使后续 S2-S6 的组件迁移建立在证据上而不是估计上：

1. 单入口 IIFE 拓扑是否仍然成立？
2. 全局 preflight 对 compat island 的破坏面具体是什么？
3. CSS/JS gzip 体积增量是多少，新预算该冻结在什么水平？

**范围：** 包含 Tailwind 与 Vite 插件接入、令牌层与品牌覆盖、preflight 影响清单与体积实测；不包含任何 Dcat UI 组件的替换（S2+）。

**归属：** 属于 Epic `002-o-untitled-ui-react-adoption`，为其 S1 切片。

## 为什么先穿刺

这是整个 Epic 风险最高的一步。三件事都会改变后续方案的形状：

- **preflight 全局生效**：`resources/modern/compat-facade.css` 与 `compat-utilities.css` 目前用 Dcat 令牌为旧插件（Select2、webuploader、TinyMCE、duallistbox、datetimepicker）手写了外观。Tailwind preflight 会重置 `button`、`img`、`table`、`h1-h6`、`ul/ol`、`hr`、`input` 等元素，破坏面必须先量化，否则 S6 会变成盲改。
- **体积**：core JS gzip 98131、CSS 13119、总计 111250，预算 143360。只剩约 32KB 余量，而 Tailwind 工具类会显著增加 CSS。
- **拓扑**：`vite.config.mts` 使用 `lib` + `formats: ['iife']`，由 PHP 侧按 manifest 单文件加载；Tailwind 的 Vite 插件与 `cssCodeSplit:false` 的组合必须验证仍产出单 CSS 文件。

**未通过前不进入 S2。** 若穿刺结论与 Epic 的假设冲突（例如 preflight 破坏面过大），先更新 Epic Spec 再继续。

## 方案与实现安排

1. 安装 `tailwindcss` 与 `@tailwindcss/vite`，接入 `vite.config.mts`。
2. 新增 Tailwind 入口（`resources/modern/tailwind.css`）：
   - `@import "tailwindcss"`（preflight 按要求全局保留）。
   - `@source` 限定扫描范围到 `resources/modern/**`，避免扫描 Blade、Demo、vendor。
   - vendor 上游 `styles/theme.css` 的语义令牌层（按需要的子集，必须保留 `bg-brand-solid`、`text-secondary`、`ring-primary`、`bg-primary` 等组件实际引用的变量）。
   - Dcat 品牌覆盖：按 `#586CB1` 推导 11 档 `--color-brand-*`，附对比度核对结果。
3. 交付 Dcat 43 令牌 → Tailwind 语义变量的映射表，作为 S2-S6 与 compat facade 改写的依据。
4. 实测并记录：
   - 构建产物文件数、单 CSS 文件是否成立、IIFE 是否保持。
   - CSS/JS gzip 增量与建议的新预算。
   - preflight 影响清单：逐个 compat island 代表控件（Select2 输入/下拉、webuploader 上传按钮与列表、TinyMCE 工具栏、duallistbox、datetimepicker、checkbox/radio 装饰）在 preflight 下被重置的属性与是否可用。

**不碰的边界：** 不替换任何自研组件、不改 `views/*.tsx`、不改 PHP/Blade、不动运行时；`modern:verify` 中与旧组件绑定的断言在此期间保持通过。

## 验证

- `npm run modern:build` 与 `npm run modern:artifact`：产物结构与体积可测。
- `npm run modern:verify`：现有门禁在接入 Tailwind 后仍全绿（除因体积预算必须重冻结的部分，需显式记录）。
- preflight 影响清单有可复现的观测方式（浏览器 computed style 或等价的自动检查），不接受“目测正常”。
- 品牌阶梯的对比度有计算依据（正文 4.5:1、非文本边界 3:1）。

## 执行记录

2026-09-30：穿刺完成，三个问题都有实测答案。

**1. 拓扑保持。** `vite.config.mts` 加入 `@tailwindcss/vite` 后仍产出单入口 IIFE + 单 CSS：`resources/dist/modern/manifest.json` 解析为 1 个 hashed JS 入口与 1 个独立 CSS 条目。`cssCodeSplit: false` 与 lib/IIFE 组合未被破坏。

**2. 体积增量已测。** CSS 100773 → 134697 字节 raw，13119 → **19338 字节 gzip（+6219）**；JS 98131 字节 gzip 未变。总产物 117469 / 上限 143360，余量 25891。建议：**暂不调整预算**（余量足够覆盖 utilities 增量），但要预留 S2-S6 每批复测；若 S3-S6 累计超过 143360，再凭实测重新冻结，而不是先放宽。

**3. preflight 影响已量化并补偿到零差异。**

- 首次测量：30 个探针中 15 个出现差异，全部集中在**元素级默认值**（`h4` margin/font-weight、`p` margin、`ul/ol/li` margin 与项目符号、`img` display/vertical-align、`hr` color），以及 preflight `border: 0 solid` 造成的 `border-style: none → solid`。
- 交互控件本体未被重置：`.btn`、`.form-control`、`.input-group-addon`、duallistbox、webuploader pick、editormd 工具栏、Select2 选中项的背景/边框/内边距都由 compat facade 或插件 CSS 显式声明。
- `border: 0 solid` 属潜在风险而非实际回归：仓库内只声明 `border-width` 的规则（webuploader 三角、datetimepicker `today` 角标、compat facade chevron）都在同一规则里成对声明了 `border-style: solid`。已加入 0 特异性保险。
- 补偿实现：`resources/modern/compat-preflight-restore.css`，`.dcat-modern-active` 作用域内用 `:where()` 恢复 UA 默认值。放在**无 layer** 的作者样式里，优先级高于 preflight 的 `@layer base`，且任何显式声明仍可覆盖。
- 复测：`node scripts/view-modernization-preflight-impact.mjs --build-baseline --strict` → **30 探针 0 差异**，退出码 0。

**4. 令牌映射表已交付。** 见 [token-mapping.md](../token-mapping.md)。S1 已落地 brand 阶梯（`#586CB1` 锚定，对比度 5.01:1）与 neutral 钉定（等于 Tailwind `gray`，使语义层解析值与现网一致）；`error/success/warning` 色阶与 `overlay/modal` 阴影标注为 S2/S6 待决。

**改成/新增的文件：** `resources/modern/tailwind.css`、`resources/modern/compat-preflight-restore.css`、`resources/modern/ui/styles/theme.css`（上游）、`scripts/view-modernization-preflight-impact.mjs`、`vite.config.mts`、`resources/modern/index.tsx`、`package.json`（新增 devDependency）。`dependency-census.json` 因产物哈希变化而重新生成。

**未做（留给后续切片）：** 未升级 `react-aria-components`/React（Tailwind 与此无关，S2 一并处理）；未 vendor 任何组件；未改 `styles.css`/`compat-facade.css` 的令牌用法；未调整 `vite.compat.config.mts` 与 `vite.fallback.config.mts`（fallback 产物目前仍不含 Tailwind，S2-S6 决定是否需要并测量其体积）。

**顺手发现：** `modern:verify` 的执行顺序是 `modern:coverage --check` 在 `modern:build` 之前，产物哈希一变 census 就立即过期（S1 期间遇到两次）。已记入 Epic Spec 的 S7 待办。

**验证汇总：** `npm run modern:verify` 退出码 0（coverage 303/296/870、grid 28/36/22、form 68、tokens 43、baseline 140/821、php-static、bootstrap-absence、typecheck、Vitest 16 文件/113 用例、build、artifact JS 98131 + CSS 19338 = 117469 gzip、Chrome self-test）；preflight 门禁 `--strict` 退出码 0。

## 关闭时

- Task 归档后回写：实际结果、Task archive 与最终推进状态。
- 毕业候选：Epic 内 Issue → 本 Epic Spec（体积与 preflight 结论要写进 S1 出口与风险表）。
- 沉淀检查：
- 关闭判断与验证摘要：
- 遗留：

2026-09-30（提交前复测时发现并修复的两个脚本缺陷）：

1. **基线构建会改坏发布目录。** `buildWithoutTailwind()` 原先直接 `vite build`，而 `vite.config.mts` 的 `emptyOutDir: true` 会清空 `resources/dist/modern/`，连带删除该目录里非 Vite 产物 `THIRD_PARTY_NOTICES.txt`。修复：基线构建改为输出到临时目录（`--outDir <tmp> --emptyOutDir`），并在 `finally` 中删除临时目录，不再触碰发布目录。
2. **SIGKILL 会留下「Tailwind 被关闭」的中间态。** 脚本靠 `finally` 恢复 `resources/modern/index.tsx`，但强杀不会执行 `finally`；残留状态会让后续 `modern:verify` 静默构建出不含 Tailwind 的 CSS（实测产物退回 111250 gzip），而 census 也会记录错误哈希。修复：入口增加陈旧标记守卫（发现 `// preflight-impact:` 标记即拒绝运行并提示恢复），并注册 `SIGINT`/`SIGTERM` 处理器恢复入口；只有 SIGKILL 无法拦截，由守卫兜底。

两条都属于「脚本自身会把工作区改坏」的类型，已随本批提交。
