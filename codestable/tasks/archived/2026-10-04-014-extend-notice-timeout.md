---
doc_type: task-list
task: extend-notice-timeout
goal: 将右上角通知默认显示时长延长至10秒
status: archived
workflow: fast
owner_skill: cs
created: 2026-10-04
updated: 2026-10-04
archived: 2026-10-04
related_docs:
  - codestable/issues/018-o-ff-延长通知默认显示时长.md
  - codestable/spec/view-layer/index.md
---

# 将右上角通知默认显示时长延长至10秒

## 1. 任务目标

将右上角通知默认显示时长延长至10秒

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 统一通知默认时长并验证定时关闭契约
- [x] 构建发布资源并检查产物

## 4. CodeStable 文档索引

- `codestable/issues/018-o-ff-延长通知默认显示时长.md`
- `codestable/spec/view-layer/index.md`

## 5. 执行步骤

### 1. 统一通知默认时长并验证定时关闭契约

- 状态：done

### 2. 构建发布资源并检查产物

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-04：Task 已创建。

2026-10-04：overlayStore默认4500ms改10000ms，bridge移除重复默认参数，复用同一默认值。新增假定时器回归确认成功/失败4500及9999ms仍显示、10000ms关闭，500ms显式时长与0常驻、手动关闭保持。store/bridge两文件26项测试、typecheck、生产build、artifact、diff check通过。纯时长变更以可控定时器验证，不新增浏览器/业务操作；无可调用子代理接口，当前会话自查。消费应用未部署。归档后018-o-ff改018-x-ff并回写View spec；无Talk/Note/Tool增量，默认值与现有正本表达规则，保留既有暗色开关工作区改动。

2026-10-04：Task 已标记 completed，等待归档。

2026-10-04：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：f8631b3c23743e5ad0e5af176030b39637ebebdb4554a808a0b0e40f1a27bd35
