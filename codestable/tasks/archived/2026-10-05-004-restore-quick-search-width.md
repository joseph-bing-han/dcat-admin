---
doc_type: task-list
task: restore-quick-search-width
goal: 恢复快速搜索配置宽度并限制窄屏溢出
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-05
updated: 2026-10-05
archived: 2026-10-05
related_docs:
  - codestable/issues/024-o-ff-恢复快速搜索配置宽度.md
  - resources/modern/compat-facade.css
---

# 恢复快速搜索配置宽度并限制窄屏溢出

## 1. 任务目标

恢复快速搜索配置宽度并限制窄屏溢出

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 修复快速搜索容器宽度并构建
- [x] 验证不同配置和窄屏并回写结果

## 4. CodeStable 文档索引

- `codestable/issues/024-o-ff-恢复快速搜索配置宽度.md`
- `resources/modern/compat-facade.css`

## 5. 执行步骤

### 1. 修复快速搜索容器宽度并构建

- 状态：done

### 2. 验证不同配置和窄屏并回写结果

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-05：Task 已创建。

2026-10-05：仅CSS：quick-search-form设min-width0/max-width100%，内部label设block/max-width100%/margin-bottom0。build/artifact/diff-check通过，编译规则与Chrome预览一致。实际发票24rem和支出18rem修复前均201px，预览后分别384px/288px（根字号16px）。768px发票缩到363px且位于视口内，临时96rem配置同样363px；已恢复24rem。375px发票、320px支出保留原display:none，不声称移动端搜索可见。warn/error为空；视口和临时样式恢复，独立标签已关闭。纯CSS不新增镜像单元测试、不重复PHP/TS验证。无子代理接口，当前会话自查；未部署消费资源。归档后回写024-x-ff与当前View兼容规格，无Talk/Note/Tool增量。

2026-10-05：Task 已标记 completed，等待归档。

2026-10-05：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：4564f475af74c8e8401e5b58d4a3b6904fdae9240a6f9cde498f15cd3858ac98
