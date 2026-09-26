---
doc_type: task-list
task: restore-metric-subtitle-border
goal: 恢复日期说明圆角边框并保持内边距
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-09-26
updated: 2026-09-26
archived: 2026-09-26
related_docs:
  - codestable/epics/001-o-view-layer-modernization/issues/003-o-ff-恢复日期说明边框.md
---

# 恢复日期说明圆角边框并保持内边距

## 1. 任务目标

恢复日期说明圆角边框并保持内边距

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 调整日期说明样式并构建验证

## 4. CodeStable 文档索引

- `codestable/epics/001-o-view-layer-modernization/issues/003-o-ff-恢复日期说明边框.md`

## 5. 执行步骤

### 1. 调整日期说明样式并构建验证

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-09-26：Task 已创建。

2026-09-26：已恢复主题边框、8px 圆角和控件背景；保留 12px 横向留白并固定为至少 32px 紧凑高度，避免随多行标题拉伸。

2026-09-26：构建、artifact 和 diff-check 通过。本地 Demo 浏览器确认 1px 实线边框、8px 圆角、4px/12px 留白、32px 高度，无箭头或交互语义；资源已更新。归档后 003-o-ff-恢复日期说明边框.md 改名 003-x-ff-恢复日期说明边框.md，并修正 Epic/UI 当前外观约定。纯样式改动不重跑行为测试，无新 Talk/Note/Tool。

2026-09-26：Task 已标记 completed，等待归档。

2026-09-26：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：31ce83ce168b993e3623eab82db3010596dce212f3d9c46be56164bbaa7eed86
