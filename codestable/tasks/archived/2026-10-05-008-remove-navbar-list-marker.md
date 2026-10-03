---
doc_type: task-list
task: remove-navbar-list-marker
goal: 去除顶栏扩展导航项的列表圆点
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-05
updated: 2026-10-05
archived: 2026-10-05
related_docs:
  - codestable/issues/028-o-ff-去除顶栏导航列表圆点.md
---

# 去除顶栏扩展导航项的列表圆点

## 1. 任务目标

去除顶栏扩展导航项的列表圆点

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 修复导航列表样式并验证

## 4. CodeStable 文档索引

- `codestable/issues/028-o-ff-去除顶栏导航列表圆点.md`

## 5. 执行步骤

### 1. 修复导航列表样式并验证

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-05：Task 已创建。

2026-10-05：公共header-navbar .nav-item明确list-style:none。build/artifact/diff通过；Chrome extension最终5ifP0liZ CSS在1912/375px下6个导航项均none，通知铃铛保留，语言菜单展开正常，无warn/error；前轮暗色20px和无箭头保持。临时视口、页面和资源服务器已清理，未部署或写业务数据。

2026-10-05：Task 已标记 completed，等待归档。

2026-10-05：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：9493e502a5b147a6c5d296f068d6145615753607294e6887b28912b327eb6e03
