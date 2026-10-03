---
doc_type: task-list
task: set-notice-timeout-six-seconds
goal: 将通知默认时长调整为6秒
status: archived
workflow: fast
owner_skill: cs
created: 2026-10-04
updated: 2026-10-04
archived: 2026-10-04
related_docs:
  - codestable/issues/020-o-ff-调整通知默认时长为6秒.md
  - codestable/spec/view-layer/index.md
---

# 将通知默认时长调整为6秒

## 1. 任务目标

将通知默认时长调整为6秒

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 调整默认值和回归测试并构建验证

## 4. CodeStable 文档索引

- `codestable/issues/020-o-ff-调整通知默认时长为6秒.md`
- `codestable/spec/view-layer/index.md`

## 5. 执行步骤

### 1. 调整默认值和回归测试并构建验证

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-04：Task 已创建。

2026-10-04：默认timeout改6000ms，store/bridge默认计时测试同步，59项store/bridge/runtime聚焦测试、typecheck、生产build、artifact及diff check通过。保留既有整页恢复/PJAX计时、显式时长和手动关闭。未部署消费应用；无子代理接口，当前会话自查。归档后020-o-ff改020-x-ff，View当前默认值改6秒，历史10秒实测证据仍标历史；无Talk/Note/Tool增量。

2026-10-04：Task 已标记 completed，等待归档。

2026-10-04：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：6dfd064f012f974ba01961ab5bc2282e1db3b841aa256a3b6bf9e63521cf4355
