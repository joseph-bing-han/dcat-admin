---
kind: issue
title: 规格升版 UI/UE 2.0.0 与兼容契约 5.0.0
type: refactor
status: open
created: 2026-09-30
---

# 规格升版 UI/UE 2.0.0 与兼容契约 5.0.0

> **读者：** 跨会话接手的人——「要做成什么、别碰什么、现状与方案是否还成立、怎么验、关了要回写哪里」。

---

## 做成以后是什么样

`ui-ux-spec` 与 `compatibility-contract` 不再是“禁止 Tailwind、Untitled UI 仅作参考”的旧口径，而是**明确以 Untitled UI React OSS + Tailwind v4 为组件与样式来源**的新口径；两份规格的版本、指纹与门禁脚本一致，`modern:verify` 不因版本变化失败。

**范围：** 包含两份规格的条款改写、版本号、契约指纹同步与受影响的校验脚本调整；不包含组件实现本身（由 S2-S6 承担），也不包含五视口新基线（S7）。

**归属：** 属于 Epic `002-o-untitled-ui-react-adoption`，为其 S0 切片。

## 为什么现在做 / 当前坏在哪

`ui-ux-spec.md` 1.1.0 第 17 行写“Untitled UI 提供组件参考，不取代本项目的兼容契约和设计令牌”；`compatibility-contract.md` 4.0.0 的 C3 明文禁止“Tailwind preflight、Bootstrap reset、元素级全局 reset 或通用 utility 泄漏到 root 外 DOM”。

这两条与 2026-09-30 已确认的迁移决策直接冲突：完整迁移必须引入 Tailwind，且用户已接受 preflight 全局生效。若先动代码不改规格，实现会持续违反冻结契约，`modern:verify` 的契约指纹检查也会失败。

规格自身规定：“令牌、稳定布局或跨组件交互规则的修改属于共享契约变化：必须建立独立 Issue，说明动机、受影响组件、迁移方式、视觉证据和回退”。本 Issue 即该要求的落点。

## 方案与实现安排

`ui-ux-spec` → `2.0.0`：

- 组件来源改为 Untitled UI React OSS（vendor 源码）；删除“仅作参考”表述。
- 字阶改为上游体系：`text-xs 12`、`text-sm 14`、`text-md 16`、`text-lg 18`、`text-xl 20`、`display-xs 24`、`display-sm 30`、`display-md 36`；页面标题由 20px 改为 `display-xs` 24px。
- 品牌色保留 Dcat `#586CB1`，要求给出完整 11 档阶梯并满足 WCAG 2.2 AA。
- 明确 Tailwind preflight 全局生效，compat island 冲突在集中位置补偿。
- 重写“AI 与实现门禁”中依赖自研组件、自研令牌的条款；保留“不得使用未核验 PRO 资产”“截图更新须对应规范条款”等仍然成立的约束。

`compatibility-contract` → `5.0.0`：

- C3“构建与 CSS”改写：允许并规定 Tailwind v4 的接入方式（`@source` 扫描范围限定 `resources/modern/**`、令牌唯一来源为 `@theme`、preflight 策略、compat island 隔离规则）。
- 新增“组件来源与 provenance”条款：vendor 目录必须可追溯到 `PROVENANCE.json` 固定的上游 commit 与许可证明细；禁止 PRO 源码。
- 保持不变的条款必须显式保留：`data-dcat-*` 标记、PHP/Blade 锚点、PJAX、payload/bridge/manifest、Grid/Form 协议、动作顺序、Bootstrap/AdminLTE/jQuery 缺席门禁。

指纹同步：

- `implementation-capability-matrix.json` 的 `contracts.uiUx`、`contracts.compatibility` 版本与 SHA-256。
- `m0/*.json` 中引用两份规格版本或指纹的字段。
- `scripts/view-modernization-baseline.js`、`scripts/view-modernization-coverage.js`、`scripts/view-modernization-php-static.js` 中硬编码的版本或路径。

**不碰的边界：** 不改运行时、组件实现、PHP/HTTP 契约；不调整已确认的 S1-S7 切片顺序。

## 验证

- `npm run modernization:baseline`、`npm run modern:coverage`、`npm run modern:php-static` 通过。
- `npm run modern:verify` 全链通过（当前组件层不变，规格升版不应改变产物）。
- 交叉核对：新规格中不再出现“仅作参考”或“禁止 Tailwind”的残留表述；`data-dcat-*`、PJAX、Grid/Form 协议的冻结条款仍逐条存在。
- 与 Epic `002` 的“完成定义”逐条对齐，确认规格能支撑 S1-S7 的验收。

## 执行记录

2026-09-30：完成。`ui-ux-spec` 1.1.0 → **2.0.0**，`compatibility-contract` 4.0.0 → **5.0.0**，均为 `status: frozen`。

`ui-ux-spec` 2.0.0 的实际改动：

- 新增「组件与样式来源」节：组件来源为 Untitled UI React OSS vendor 源码（`resources/modern/ui/`，provenance 固定 commit），样式实现为 Tailwind v4、令牌唯一来源是 `@theme`；删除“仅作参考”口径；明示禁止 PRO。
- 新增「维护归属」：两份规格当前由 Epic 002 变更周期维护，Epic 002 关闭时毕业到 Project Spec。
- 字号表整体替换为上游体系（`text-xs` 12/18 … `display-sm` 30/38），并给出与 1.1.0 的逐项差异列；禁止 `display-md` 及以上用于后台页面。
- 色彩节新增「实现方式」（只用 Tailwind 语义工具类）与「状态色的 AA 结论」（上游 600 档 success 3.22:1 / warning 2.94:1 不达标，改用 AA 达标档）。
- 「AI 与实现门禁」第 1/4/6/8 条重写并新增第 9 条（动态 class 必须静态化或 safelist）。
- 新增「兼容与 preflight」节：preflight 位于 `@layer base`、补偿集中在 `compat-preflight-restore.css`、`modern:preflight` 零差异门禁、新增 compat 控件必须加入探针集合。

`compatibility-contract` 5.0.0 的实际改动：

- C3「构建与 CSS」把“禁止 Tailwind preflight / 通用 utility 泄漏”改为“规定 Tailwind v4 接入方式”：`source(none)` + 作用域 `@source`、preflight 允许全局生效并由集中补偿层兜底、动态 class 静态化；仍然禁止 Bootstrap/AdminLTE reset、源码与网络引用。
- 新增「组件来源与 provenance」节：vendor 路径可追溯、只允许 MIT、本地改动可识别、业务代码不得绕过 vendor 层、依赖逐项登记与体积门禁。
- 「变更控制」新增组件来源/commit/许可证条目；「破坏性升级判定」新增“未记录 provenance 或引入 PRO 源码”。

指纹与门禁同步：`implementation-capability-matrix.json` 的 `targetContracts` = `uiUx 2.0.0` / `compatibility 5.0.0` 与对应 sha256；`scripts/view-modernization-baseline.js` 的期望版本同步更新。

验证：`npm run modernization:baseline`（M0 契约指纹检查）通过；随后 `npm run modern:verify` 退出码 0，规格升版未改变产物语义。


2026-09-30：完成。`ui-ux-spec` 1.1.0 → **2.0.0**，`compatibility-contract` 4.0.0 → **5.0.0**，均为 `status: frozen`。

`ui-ux-spec` 2.0.0 的实际改动：

- 新增「组件与样式来源」节：组件来源为 Untitled UI React OSS vendor 源码（`resources/modern/ui/`，provenance 固定 commit），样式实现为 Tailwind v4、令牌唯一来源是 `@theme`；删除“仅作参考”口径；明示禁止 PRO。
- 新增「维护归属」：两份规格当前由 Epic 002 变更周期维护，Epic 002 关闭时毕业到 Project Spec。
- 字号表整体替换为上游体系（`text-xs` 12/18 … `display-sm` 30/38），并给出与 1.1.0 的逐项差异列；禁止 `display-md` 及以上用于后台页面。
- 色彩节新增「实现方式」（只用 Tailwind 语义工具类）与「状态色的 AA 结论」（上游 600 档 success 3.22:1 / warning 2.94:1 不达标，改用 AA 达标档）。
- 「AI 与实现门禁」第 1/4/6/8 条重写并新增第 9 条（动态 class 必须静态化或 safelist）。
- 新增「兼容与 preflight」节：preflight 位于 `@layer base`、补偿集中在 `compat-preflight-restore.css`、`modern:preflight` 零差异门禁、新增 compat 控件必须加入探针集合。

`compatibility-contract` 5.0.0 的实际改动：

- C3「构建与 CSS」把“禁止 Tailwind preflight / 通用 utility 泄漏”改为“规定 Tailwind v4 接入方式”：`source(none)` + 作用域 `@source`、preflight 允许全局生效并由集中补偿层兜底、动态 class 静态化；仍然禁止 Bootstrap/AdminLTE reset、源码与网络引用。
- 新增「组件来源与 provenance」节：vendor 路径可追溯、只允许 MIT、本地改动可识别、业务代码不得绕过 vendor 层、依赖逐项登记与体积门禁。
- 「变更控制」新增组件来源/commit/许可证条目；「破坏性升级判定」新增“未记录 provenance 或引入 PRO 源码”。

指纹与门禁同步：`implementation-capability-matrix.json` 的 `targetContracts` = `uiUx 2.0.0` / `compatibility 5.0.0` 与对应 sha256；`scripts/view-modernization-baseline.js` 的期望版本同步更新。

验证：`npm run modernization:baseline`（M0 契约指纹检查）通过；随后 `npm run modern:verify` 退出码 0，规格升版未改变产物语义。

## 关闭时

- Task 归档后回写：实际结果、Task archive 与最终推进状态。
- 毕业候选：Epic 内 Issue → 本 Epic Spec；Epic 关闭后再合并进 Project Spec。
- 沉淀检查：
- 关闭判断与验证摘要：
- 遗留：
