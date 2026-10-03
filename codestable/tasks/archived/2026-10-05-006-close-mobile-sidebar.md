---
doc_type: task-list
task: close-mobile-sidebar
goal: 恢复手机侧栏自动收起
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-05
updated: 2026-10-05
archived: 2026-10-05
related_docs:
  - codestable/issues/026-o-ff-修复手机侧栏自动收起.md
---

# 恢复手机侧栏自动收起

## 1. 任务目标

恢复手机侧栏自动收起

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 统一关闭逻辑并补充回归测试
- [x] 构建和手机浏览器验证

## 4. CodeStable 文档索引

- `codestable/issues/026-o-ff-修复手机侧栏自动收起.md`

## 5. 执行步骤

### 1. 统一关闭逻辑并补充回归测试

- 状态：done

### 2. 构建和手机浏览器验证

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-05：Task 已创建。

2026-10-05：统一dismissSidebar关闭手机展开与桌面预览，菜单叶子、外部点击、Escape、PJAX阶段复用；84项runtime/layout/navigation回归及typecheck通过。

2026-10-05：84项runtime/layout/navigation回归、typecheck、production build及artifact通过；JS dcat-modern-DAgRUltU.js，CSS保留DGlHPdNE。Chrome extension最终JS隔离预览375px：分组保持展开、选择支出菜单后立即关闭且PJAX导航完成保持关闭、外部点击关闭；320px Escape关闭，aria-expanded同步false，无warn/error。已恢复viewport/cache/Fetch并关闭临时页、停止资源服务器。未部署或修改业务数据。

2026-10-05：Task 已标记 completed，等待归档。

2026-10-05：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：3c08956ed1f777927759c86e051568746b7094ff593609ed28d5ee8d424dcbec
