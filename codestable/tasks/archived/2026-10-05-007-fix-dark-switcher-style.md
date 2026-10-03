---
doc_type: task-list
task: fix-dark-switcher-style
goal: 恢复暗色开关图标尺寸并移除错误箭头
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-05
updated: 2026-10-05
archived: 2026-10-05
related_docs:
  - codestable/issues/027-o-ff-修复暗色开关尺寸与箭头.md
---

# 恢复暗色开关图标尺寸并移除错误箭头

## 1. 任务目标

恢复暗色开关图标尺寸并移除错误箭头

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 补齐兼容样式并构建
- [x] 验证实际主题开关并回写

## 4. CodeStable 文档索引

- `codestable/issues/027-o-ff-修复暗色开关尺寸与箭头.md`

## 5. 执行步骤

### 1. 补齐兼容样式并构建

- 状态：done

### 2. 验证实际主题开关并回写

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-05：Task 已创建。

2026-10-05：主题开关图标固定20px，限定nav-link:has(.dark-mode-switcher)隐藏after；生产构建/artifact/diff通过。最终CSS CemDCDjH，JS未变DAgRUltU。桌面最终CSS实测20px、箭头none，其余真实下拉箭头block。

2026-10-05：Chrome extension最终CSS临时预览1912/375px，浅色moon与深色sun均20px，主题after display/content为none，其他真实dropdown after仍block；鼠标切深色与Enter恢复浅色通过，无warn/error。视口恢复、临时页关闭、资源服务器停止；未部署消费应用。仅CSS改动，不重复运行无关PHP/TS行为测试。

2026-10-05：Task 已标记 completed，等待归档。

2026-10-05：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：d85795a8825407fc059737524820a2f7e0395964cc8a64decdf7b3c329daa4e6
