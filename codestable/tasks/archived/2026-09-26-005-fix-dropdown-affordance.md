---
doc_type: task-list
task: fix-dropdown-affordance
goal: 修复 Dashboard 与 Grid 下拉留白和箭头并验证主题及交互
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-09-26
updated: 2026-09-26
archived: 2026-09-26
related_docs:
  - codestable/epics/001-o-view-layer-modernization/issues/002-o-ff-修复下拉箭头与留白.md
  - codestable/epics/001-o-view-layer-modernization/ui-ux-spec.md
---

# 修复 Dashboard 与 Grid 下拉留白和箭头并验证主题及交互

## 1. 任务目标

修复 Dashboard 与 Grid 下拉留白和箭头并验证主题及交互

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 修复共享下拉样式与模板并构建资源
- [x] 验证真实页面下拉交互和明暗配色
- [x] 复核改动并准备规格回写与归档

## 4. CodeStable 文档索引

- `codestable/epics/001-o-view-layer-modernization/issues/002-o-ff-修复下拉箭头与留白.md`
- `codestable/epics/001-o-view-layer-modernization/ui-ux-spec.md`

## 5. 执行步骤

### 1. 修复共享下拉样式与模板并构建资源

- 状态：done

### 2. 验证真实页面下拉交互和明暗配色

- 状态：done

### 3. 复核改动并准备规格回写与归档

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-09-26：Task 已创建。

2026-09-26：已移除 Metrics 的 p-0，统一 CSS 折线箭头与展开态，补齐选中标记和 dark-mode 下拉局部令牌；原生 Widget 复用同一箭头。当前宿主无子代理/原生 Tasks 工具，由主会话直接验证。

2026-09-26：用户确认 New Devices / Last 30 days 为固定说明，移除按钮外观并补 4px/12px 留白。首轮 27 项聚焦测试与 artifact/php-static 通过；浏览器发现分页浮层未遵守 dropup 且按 innerWidth 计算会侵入滚动条，已修复定位并补三种边界测试。截图工具不允许写本地指定路径，使用内联截图检查。

2026-09-26：已构建并发布本地 Demo 资源；32 项聚焦单测、TypeScript、PHP/Blade 静态检查及资源检查通过。Dashboard 390/768/1024/1366/1440 下真实展开、关闭、焦点、选中及留白通过；Grid 同五视口通过（390 沿用隐藏每页选择器），其余视口均右对齐向上展开；20 切换 50 的 PJAX 查询与选中状态通过。深色类下按钮/浮层背景与选中对勾配色已实测。

2026-09-26：已复核本次 diff，无已知阻断缺陷；无独立子代理工具，不将主会话复核冒充独立 Review。最终 CSS artifact/140 Blade 静态检查及 diff-check 通过，PHP 8.1.34 / Laravel 10.50.3；不重跑无关全量 Demo/Dusk。归档后将同一 ff 从 002-o-ff-修复下拉箭头与留白.md 改为 002-x-ff-修复下拉箭头与留白.md，回写所属 Epic spec 与 ui-ux-spec 的下拉规则。无 Talk/Note/Tool 新增需求。未 commit/push。

2026-09-26：Task 已标记 completed，等待归档。

2026-09-26：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：81084ad7363a7741b57b09448c14b22b93172a708238fa8d69ee869c0e919584
