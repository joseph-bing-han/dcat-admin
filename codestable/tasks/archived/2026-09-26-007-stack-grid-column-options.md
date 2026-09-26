---
doc_type: task-list
task: stack-grid-column-options
goal: 列选择器逐行显示选项并保持选择行为
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-09-26
updated: 2026-09-26
archived: 2026-09-26
related_docs:
  - codestable/epics/001-o-view-layer-modernization/issues/004-o-ff-列选择器纵向排列.md
---

# 列选择器逐行显示选项并保持选择行为

## 1. 任务目标

列选择器逐行显示选项并保持选择行为

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 修复列选择器排版并完成聚焦验证

## 4. CodeStable 文档索引

- `codestable/epics/001-o-view-layer-modernization/issues/004-o-ff-列选择器纵向排列.md`

## 5. 执行步骤

### 1. 修复列选择器排版并完成聚焦验证

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-09-26：Task 已创建。

2026-09-26：已将列选择器 selectors 改为纵向 flex，清除默认列表缩进及复选框行内右边距；添加 All 分隔线与长标签换行。保持运行时逻辑不变。

2026-09-26：构建、artifact、diff-check 通过；本地 Demo 在 390×844、1440×400、1440×900 下均为 155px 单列菜单，无横向溢出且位于视口内。实际取消 permissions 列及 All 恢复经 PJAX 验证通过；临时 DOM 增加 40 项验证纵向滚动并立即清除。截图已核对。归档后 004-o-ff-列选择器纵向排列.md 改名 004-x-ff-列选择器纵向排列.md，回写 Epic/UI 规则。纯 CSS 无行为修改，不新增单测或重跑无关全量测试；无新 Talk/Note/Tool。

2026-09-26：Task 已标记 completed，等待归档。

2026-09-26：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：6f1dbc30d452efdeec3837bb8c358dc1d0aa4c8b750c8bcb0ed7b7e74a544c0b
