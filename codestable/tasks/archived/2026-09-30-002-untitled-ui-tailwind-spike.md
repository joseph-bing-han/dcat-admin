---
doc_type: task-list
task: untitled-ui-tailwind-spike
goal: 接入 Tailwind v4 与 Untitled UI 语义令牌层，实测 IIFE 拓扑、体积增量与 preflight 对 compat island 的影响
status: archived
workflow: design
owner_skill: cs
created: 2026-09-30
updated: 2026-09-30
archived: 2026-09-30
related_docs:
  - codestable/epics/002-o-untitled-ui-react-adoption/spec.md
  - codestable/epics/002-o-untitled-ui-react-adoption/issues/002-o-tailwind-v4-接入与-preflight-影响穿刺.md
---

# 接入 Tailwind v4 与 Untitled UI 语义令牌层，实测 IIFE 拓扑、体积增量与 preflight 对 compat island 的影响

## 1. 任务目标

接入 Tailwind v4 与 Untitled UI 语义令牌层，实测 IIFE 拓扑、体积增量与 preflight 对 compat island 的影响

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 接入 tailwindcss 与 @tailwindcss/vite，建立 @source 限定的令牌入口与 Dcat 品牌阶梯，交付令牌映射表
- [x] 实测构建拓扑与 CSS/JS gzip 体积增量，给出新预算建议
- [x] 量化全局 preflight 对 compat island 代表控件的影响并记录可复现证据
- [x] 回写 Epic Spec 与 S1 Issue 的执行记录、结论与风险表更新

## 4. CodeStable 文档索引

- `codestable/epics/002-o-untitled-ui-react-adoption/spec.md`
- `codestable/epics/002-o-untitled-ui-react-adoption/issues/002-o-tailwind-v4-接入与-preflight-影响穿刺.md`

## 5. 执行步骤

### 1. 接入 tailwindcss 与 @tailwindcss/vite，建立 @source 限定的令牌入口与 Dcat 品牌阶梯，交付令牌映射表

- 状态：done

### 2. 实测构建拓扑与 CSS/JS gzip 体积增量，给出新预算建议

- 状态：done

### 3. 量化全局 preflight 对 compat island 代表控件的影响并记录可复现证据

- 状态：done

### 4. 回写 Epic Spec 与 S1 Issue 的执行记录、结论与风险表更新

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-09-30：Task 已创建。

2026-09-30：Tailwind v4.3.3 与 `@tailwindcss/vite` 已接入 `vite.config.mts`；新增 `resources/modern/tailwind.css`（`@import "tailwindcss" source(none)` + `@source` 仅扫 `resources/modern/**` + 上游 `ui/styles/theme.css` 语义层 + Dcat brand/neutral 覆盖）与 `resources/modern/compat-preflight-restore.css`。品牌阶梯按 OKLCH 重锚，冻结档位 50/100/600/700/800 保持 1.1.0 原值，`#586CB1` 对白对比度 5.01:1；neutral 钉到 Tailwind `gray`，使语义层解析值与现网一致。令牌映射表落在 `codestable/epics/002-o-untitled-ui-react-adoption/token-mapping.md`。

2026-09-30：拓扑与体积实测。manifest 仍为 1 个 hashed IIFE 入口 + 1 个 CSS 文件；CSS 100773 → 134697 字节 raw、13119 → 19338 字节 gzip（+6219）；JS 98131 gzip 不变；总产物 117469 / 预算 143360，余量 25891。建议暂不调整预算，按 slice 复测。

2026-09-30：preflight 影响量化完成。新增可复现门禁 `scripts/view-modernization-preflight-impact.mjs`：用系统 Chrome 加载同一夹具（真实 Select2/datetimepicker/duallistbox/webuploader/editormd CSS + 真实 Select2 DOM）两次，自动构建“关闭 Tailwind 入口”的基线产物并比对 30 个探针的计算样式。首测 15 个探针有差异（集中在元素级默认值），补偿层写入后复测 **30 探针 0 差异**，`--strict` 退出码 0；脚本在 finally 中恢复 `index.tsx` 并重建，不把基线产物留在工作区。

2026-09-30：`npm run modern:verify` 退出码 0 全绿；`dependency-census.json` 因产物哈希变化重新生成后 census 校验通过。回写已完成：Epic Spec 增加 S1 穿刺结论、更新 R1-R3 状态并记录 `modern:verify` 顺序缺陷；S1 Issue 写入执行记录。

2026-09-30：Task 已标记 completed，等待归档。

2026-09-30：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：120368e44ba63a01729e4d16e502106f554db87b32e27f8d3efa520f48c28220
