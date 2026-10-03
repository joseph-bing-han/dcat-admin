---
doc_type: task-list
task: preserve-notices-on-pjax
goal: 保存成功后的PJAX刷新保留通知及原计时
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-04
updated: 2026-10-04
archived: 2026-10-04
related_docs:
  - codestable/issues/019-o-ff-保留换页后的保存通知.md
  - codestable/spec/view-layer/index.md
---

# 保存成功后的PJAX刷新保留通知及原计时

## 1. 任务目标

保存成功后的PJAX刷新保留通知及原计时

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 修复局部卸载通知清理并补充回归
- [x] 构建并验证设置页刷新提示

## 4. CodeStable 文档索引

- `codestable/issues/019-o-ff-保留换页后的保存通知.md`
- `codestable/spec/view-layer/index.md`

## 5. 执行步骤

### 1. 修复局部卸载通知清理并补充回归

- 状态：done

### 2. 构建并验证设置页刷新提示

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-04：Task 已创建。

2026-10-04：PJAX store/bridge28项测试与typecheck通过。实际设置页复测发现消费AuthController显式Admin::pjax(false)、容器selector为空，实际为整页刷新而非PJAX；前述PJAX根因是相邻通用问题。新增同站整页跳转的sessionStorage一次性通知恢复，60秒有效并核对目标路径，普通PJAX保留原计时。补runtime恢复一次/跨站不持久化/过期损坏数据测试，继续完整聚焦验证。未提交账号数据，仅合成成功响应GET刷新。

2026-10-04：最终store/bridge/runtime三文件59项测试、typecheck、build、artifact和diff check通过。真实设置页Admin::pjax(false)明确无PJAX，原修复前整页刷新丢失提示。隔离页仅替换最终ZX7UKk6B JS响应，调用合成成功响应触发同站GET整页刷新，新文档5500.7ms提示仍可见、暂存记录已消费，超过10秒后不可见。截图artifacts/pjax-save-notice/after-refresh.jpg与verification.json。未发起设置POST或修改账号，未部署消费磁盘资源，拦截已清空、临时页关闭。已有$未定义初始化错误保持为既有环境限制，不宣称消除所有控制台错误。无子代理接口，仅自查。准备019-o-ff改019-x-ff并回写View spec的整页一次性通知恢复、PJAX计时保持和dialog/drawer清理；无Talk/Note/Tool增量，现有代码与正本充分表达结论。

2026-10-04：Task 已标记 completed，等待归档。

2026-10-04：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：6d5b311e71d9daecf69dd6fc446ef36742b0e8a8940bae3baa61c8bd2180f218
