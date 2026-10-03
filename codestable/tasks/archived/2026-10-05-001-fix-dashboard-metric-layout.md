---
doc_type: task-list
task: fix-dashboard-metric-layout
goal: 修复 PayTax 仪表盘指标分布、字号及窄屏排版
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-05
updated: 2026-10-05
archived: 2026-10-05
related_docs:
  - codestable/issues/021-o-ff-修复仪表盘指标排版.md
  - resources/modern/compat-facade.css
---

# 修复 PayTax 仪表盘指标分布、字号及窄屏排版

## 1. 任务目标

修复 PayTax 仪表盘指标分布、字号及窄屏排版

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 补齐指标兼容样式并构建发布资源
- [x] 验证实际页面桌面窄屏及筛选并回写结果

## 4. CodeStable 文档索引

- `codestable/issues/021-o-ff-修复仪表盘指标排版.md`
- `resources/modern/compat-facade.css`

## 5. 执行步骤

### 1. 补齐指标兼容样式并构建发布资源

- 状态：done

### 2. 验证实际页面桌面窄屏及筛选并回写结果

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-05：Task 已创建。

2026-10-05：生产构建、artifact、diff-check通过；仅修改compat-facade指标规则和发布CSS。独立Chrome标签页预览规则验证桌面金额分散且字号恢复；继续窄屏和年度筛选验证。

2026-10-05：Chrome官方扩展实际页面临时CSS预览验证桌面、375px和320px：标签18px、金额24px/600字重，space-around、16px间距及整组换行；六金额所在指标组均在容器内且两两无重叠。收入筛选至2025-2026更新金额后布局仍正常，warn/error为空。视口和年度已恢复、临时样式和独立标签已清理。编译CSS规则与预览逐项一致，build/artifact/diff-check通过。纯CSS未新增复述实现的单元测试，未运行不受影响PHP/TS测试；无子代理接口，未冒充独立review。归档后回写021事项（改名x-ff）及当前View兼容规格；无Talk/Note/Tool增量。消费应用未部署，网站仍需更新发布资源。

2026-10-05：Task 已标记 completed，等待归档。

2026-10-05：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：b9c401a0c510bd5912a667cfa70ddb061f58e503ee801ac124bb84c16b2ba7c5
