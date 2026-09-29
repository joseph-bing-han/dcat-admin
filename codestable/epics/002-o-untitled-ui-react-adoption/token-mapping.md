---
doc_type: note
title: Dcat 令牌 → Tailwind / Untitled UI 语义变量映射
epic: 002-o-untitled-ui-react-adoption
created: 2026-09-30
updated: 2026-09-30
---

# Dcat 令牌 → Tailwind / Untitled UI 语义变量映射

> 由 Epic 002 / S1 产出。S2–S6 改写 `styles.css` 与 `compat-facade.css` 时按本表替换；
> 未列入本表的自研令牌不得在新组件里使用。

## 背景

上游 `styles/theme.css` 的结构分两层：

- **基础色阶**：`--color-brand-*` 在上游文件里显式定义；`--color-neutral-*`、`--color-red-*`、`--color-green-*`、`--color-yellow-*` 等**并不定义**，直接使用 Tailwind 默认调色板。
- **语义层**：`--color-text-*`、`--color-bg-*`、`--color-border-*`、`--color-fg-*` 引用上面的基础色阶。

因此“接入 Tailwind 默认调色板”会顺带改变语义层解析出的颜色。S1 的处置：

- **brand**：覆盖为 Dcat 阶梯（50/100/600/700/800 保持 1.1.0 冻结值，其余按上游明度曲线推导）。
- **neutral**：钉到 Dcat 现有灰阶（等于 Tailwind `gray`），使 `text-primary/secondary/tertiary` 与 `border-*`、`bg-*` 解析值与现网一致。
- **error / success / warning**：保留上游语义变量名，值钉在 AA 达标档（见下「状态色的已决口径」）。

## 颜色

| Dcat 令牌 | 现值 | Tailwind / Untitled 目标 | 处置 |
|---|---|---|---|
| `primary` | `#586CB1` | `--color-brand-600` / `bg-brand-solid` | 采用（S1 已覆盖） |
| `primary-hover` | `#485A98` | `--color-brand-700` / `bg-brand-solid_hover` | 采用 |
| `primary-active` | `#3B4B80` | `--color-brand-800` | 采用 |
| `primary-subtle` | `#E9ECF6` | `--color-brand-100` / `bg-brand-secondary` | 采用 |
| `primary-soft` | `#F5F6FB` | `--color-brand-50` / `bg-brand-primary` | 采用 |
| `on-primary` | `#FFFFFF` | `--color-text-primary_on-brand` | 采用 |
| `text` | `#374151` | `--color-text-secondary`（`neutral-700`） | 采用（neutral 已钉住，值不变） |
| `heading` | `#111827` | `--color-text-primary`（`neutral-900`） | 采用 |
| `muted` | `#4B5563` | `--color-text-tertiary`（`neutral-600`） | 采用 |
| `placeholder` | `#6B7280` | `--color-text-placeholder`（`neutral-500`） | 采用 |
| `disabled` | `#9CA3AF` | `--color-fg-quaternary`（`neutral-400`） | 采用 |
| `border` | `#D1D5DB` | `--color-border-primary`（`neutral-300`） | 采用 |
| `border-subtle` | `#E5E7EB` | `--color-border-secondary`（`neutral-200`） | 采用 |
| `surface` | `#FFFFFF` | `--color-bg-primary` | 采用 |
| `surface-muted` | `#F9FAFB` | `--color-bg-secondary`（`neutral-50`） | 采用 |
| `surface-hover` | `#F3F4F6` | `--color-bg-tertiary` / `--color-bg-secondary_hover`（`neutral-100`） | 采用 |
| `overlay-scrim` | `rgba(17,24,39,.45)` | `--color-bg-overlay`（`neutral-800`） | 采用；透明度差异在 S6 浮层迁移时核对 |
| `danger` | `#B42318` | 上游 `--color-text-error-primary` / `--color-bg-error-solid` | 采用上游语义名，值 = AA 达标档（见下） |
| `danger-surface` | `#FEF3F2` | 上游 `--color-bg-error-primary` | 采用 |
| `success` | `#027A48` | 上游 `--color-text-success-primary` / `--color-bg-success-solid` | 采用上游语义名，值 = AA 达标档 |
| `success-surface` | `#ECFDF3` | 上游 `--color-bg-success-primary` | 采用 |
| `warning` | `#B54708` | 上游 `--color-text-warning-primary` / `--color-bg-warning-solid` | 采用上游语义名，值 = AA 达标档 |
| `warning-surface` | `#FFFAEB` | 上游 `--color-bg-warning-primary` | 采用 |
| `info` | `#175CD3` | 上游无对应语义 | **Dcat 扩展** |
| `info-surface` | `#EFF8FF` | 上游无对应语义 | **Dcat 扩展** |

### 状态色的已决口径（2026-09-30）

用户选择「跟随上游」，但实测表明上游 600 档达不到规范自身的 AA 门槛：

| 语义 | 上游 600 档 | 对白对比度 | 结论 |
|---|---|---|---|
| error | `#E7000B` | 4.77:1 | 达标 |
| success | `#00A63E` | 3.22:1 | **不达标**（普通文字需 4.5:1） |
| warning | `#D08700` | 2.94:1 | **不达标** |

Dcat 现值（等于 Untitled 的 700 档）分别为 error 6.57:1、success 5.41:1、warning 5.43:1。

最终处置：**保留上游语义变量名与结构**（`--color-text-*-primary`、`--color-bg-*-solid`、`--color-fg-*-primary` 与 `--color-bg-*-primary` 均在 `tailwind.css` 的 `@theme` 中显式赋值），值取 AA 达标档。上游基础色阶（`--color-red-*` 等）不动，因此徽标、图表等 utility 用法仍跟随上游调色板。

若要严格使用 600 档，需先接受 success/warning 的文本与实心按钮对比度回归并修改 `ui-ux-spec` 的对比度条款。

## 字体与字号

| Dcat 令牌 | Tailwind 目标 | 处置 |
|---|---|---|
| `font-sans` | `--font-body` / `--font-display` | 覆盖为 Dcat 栈（含 CJK 回退），不请求外部字体 |
| `font-mono` | `--font-mono` | 覆盖为 Dcat 栈 |

字号按用户 2026-09-30 决策采用上游体系，替换 1.1.0 的字号表：

| 用途 | 1.1.0（旧） | 2.0.0（上游） |
|---|---:|---:|
| 辅助元数据 | 12/16 | `text-xs` 12/18 |
| 紧凑控件/表格次要信息 | 13/18 | `text-sm` 14/20 |
| 默认正文 | 14/20 | `text-md` 16/24 |
| 面板/Modal 标题 | 16/24 | `text-lg` 18/28 |
| 区块标题 | 18/26 | `text-xl` 20/28 |
| 页面标题 | 20/28 | `display-xs` 24/32 |

## 圆角 / 尺寸 / 阴影 / 层级

| Dcat 令牌 | Tailwind 目标 | 处置 |
|---|---|---|
| `radius-none` | `rounded-none` | 采用 |
| `radius-sm` 4px | `rounded-sm` | 采用 |
| `radius-md` 6px | `rounded-md` | 采用 |
| `radius-lg` 8px | `rounded-lg` | 采用 |
| `radius-control` 8px | `rounded-lg` | 采用 |
| `radius-panel` 12px | `rounded-xl` | 采用 |
| `control-height` 40px | `h-10` | 采用 |
| `control-height-compact` 32px | `h-8` | 采用 |
| `control-height-touch` 44px | `h-11` | 采用 |
| `shadow-control` | 上游 `--shadow-xs` | 值一致，采用 |
| `shadow-overlay` `0 4px 12px rgba(17,24,39,.12)` | 上游 `--shadow-lg` | 值不同，**待决**：S6 浮层迁移时二选一 |
| `shadow-modal` `0 12px 32px rgba(17,24,39,.18)` | 上游 `--shadow-2xl` | 值不同，**待决** |
| `focus`（2px ring） | `outline-*` / `ring-*` 工具类 + `--color-border-brand_alt` | 采用；焦点可见性由 axe 与键盘门禁守护 |
| `z-sticky` / `z-overlay` / `z-toast` | Tailwind `z-*` 阶梯 | **Dcat 扩展**：统一层级表继续由本项目维护，不改为上游数值 |
