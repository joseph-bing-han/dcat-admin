---
doc_type: task-list
task: fix-grid-header-sort
goal: 恢复Grid兼容表头排序导航
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-06
updated: 2026-10-06
archived: 2026-10-06
related_docs:
  - codestable/issues/029-o-ff-修复兼容表头排序点击.md
---

# 恢复Grid兼容表头排序导航

## 1. 任务目标

恢复Grid兼容表头排序导航

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 修复排序点击并补回归
- [x] 验证构建及真实排序周期

## 4. CodeStable 文档索引

- `codestable/issues/029-o-ff-修复兼容表头排序点击.md`

## 5. 执行步骤

### 1. 修复排序点击并补回归

- 状态：done

### 2. 验证构建及真实排序周期

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-06：Task 已创建。

2026-10-06：捕获阶段接管grid-sort有效同站普通点击，隔离表头press且保留修饰键/新窗口默认行为；90项runtime/grid/navigation回归、typecheck、build及artifact通过，最终JS DpE8Gu8W。继续真实排序周期验证。

2026-10-06：90项聚焦回归、typecheck、build/artifact通过。Chrome extension最终DpE8Gu8W JS隔离预览：金额_sort desc为27040/27040/23920/17111/6179，Enter切asc为0.95/1/1/1/1.22（显示保留支出负号），第三次取消恢复154.10/41/25.29/82.55/25；参数与下一点击链接正确。375px日期desc导航完成，首日期10/09/2026、08/09、04/09、02/09，下一链接asc，无warn/error。已清空拦截、恢复缓存和视口、关闭页、停止服务器；未部署或写业务数据。

2026-10-06：Task 已标记 completed，等待归档。

2026-10-06：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：3818945046ecb929fa1c8b02e50764c2c09ca467d0e28ea70454b84f196752e8
