---
doc_type: task-list
task: repair-modern-view-review-findings
goal: 修复新版 View Review 发现的失败恢复、安全契约和验收同步问题，不恢复旧 Bootstrap/旧整页 renderer
status: archived
workflow: implementation
owner_skill: cs
created: 2026-09-27
updated: 2026-09-28
archived: 2026-09-28
related_docs:
  - codestable/epics/001-o-view-layer-modernization/issues/001-o-完成新版-view-验收.md
  - codestable/epics/001-o-view-layer-modernization/spec.md
  - codestable/epics/001-o-view-layer-modernization/m11-release-status.json
  - codestable/epics/001-o-view-layer-modernization/implementation-capability-matrix.json
---

# 修复新版 View Review 发现的失败恢复、安全契约和验收同步问题，不恢复旧 Bootstrap/旧整页 renderer

## 1. 任务目标

修复新版 View Review 发现的失败恢复、安全契约和验收同步问题，不恢复旧 Bootstrap/旧整页 renderer

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 修复 PJAX 与 React island 失败恢复并补针对性回归测试
- [x] 修复 CSP nonce、diagnostics 默认值与 telemetry 脱敏并补针对性测试
- [x] 更新扩展迁移文档及 coverage/契约指纹/发布状态事实
- [x] 运行当前 PHP 8.1.34 / Laravel 10.50.3 环境的受影响门禁并记录结果

## 4. CodeStable 文档索引

- `codestable/epics/001-o-view-layer-modernization/issues/001-o-完成新版-view-验收.md`
- `codestable/epics/001-o-view-layer-modernization/spec.md`
- `codestable/epics/001-o-view-layer-modernization/m11-release-status.json`
- `codestable/epics/001-o-view-layer-modernization/implementation-capability-matrix.json`

## 5. 执行步骤

### 1. 修复 PJAX 与 React island 失败恢复并补针对性回归测试

- 状态：done

### 2. 修复 CSP nonce、diagnostics 默认值与 telemetry 脱敏并补针对性测试

- 状态：done

### 3. 更新扩展迁移文档及 coverage/契约指纹/发布状态事实

- 状态：done

### 4. 运行当前 PHP 8.1.34 / Laravel 10.50.3 环境的受影响门禁并记录结果

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-09-27：Task 已创建。

2026-09-27：完成第一批新版 runtime 修复：PJAX 目的脚本失败后恢复原节点与标题；React island 后续渲染失败恢复原 compat 节点；核心 telemetry 移除原始错误消息。新增针对性 navigation/bridge 回归，CSP/diagnostics 测试正在补齐。

2026-09-27：第二批新版契约修复完成：CSP nonce 已传播到 Manager、Asset 和页面 bootstrap；diagnostics=null 正确跟随 app.debug；telemetry 不再传递原始 payload/异常消息；扩展文档删除旧 allowlist/全局 renderer 回退描述。ModernRendererTest/AssetModernizationTest 20 tests/117 assertions 通过。coverage、baseline、artifact、bootstrap absence 也已恢复通过；完整 current-environment browser/modern verify 仍待重跑。

2026-09-27：第三批状态同步完成：coverage/dependency census 已更新，M0 contract fingerprint 已修正，M11 暂保持 not-release-candidate，能力矩阵保持 experimental，明确历史 verified commit 不覆盖当前修复。扩展文档已明确新版 compat island 与 package rollback 边界，不再描述旧 renderer 开关。

2026-09-27：Task 状态从 active 变更为 blocked。原因：代码、前端单测、PHP focused tests、静态门禁与 npm run modern:verify 已通过；真实 consumer 浏览器合同仍无法执行，因为默认 http://127.0.0.1:8300 没有运行中的 Laravel Demo 服务。恢复动作：启动当前 PHP 8.1.34 / Laravel 10.50.3 consumer，按 modern:browser 与 Demo browser 合同重跑，再更新当前证据与 release 状态。

2026-09-28：Task 状态从 blocked 变更为 active。原因：用户明确取消当前 consumer 浏览器合同作为本轮阻塞门禁/任务；继续以已通过的 modern:verify、PHP focused tests、静态检查和新版运行时回归完成本轮，不恢复旧 renderer。

2026-09-28：2026-09-28 用户明确取消当前 consumer browser contract 作为阻塞测试要求/任务。已以 npm run modern:verify、PHP focused tests、静态检查、构建与 artifact 门禁完成本轮验证；未运行的 consumer browser contract 不记为通过。

2026-09-28：2026-09-28 最终本地验证完成：npm run modern:verify 通过（303 inventory、296 visible mappings、16 个 Vitest 文件/113 tests、build、artifact、browser self-test）；ModernRendererTest + AssetModernizationTest 20 tests/117 assertions 通过；JSON、git diff --check、CodeStable 状态同步通过。按用户决定，current consumer browser contract 不再作为本轮门禁。

2026-09-28：Task 已标记 completed，等待归档。

2026-09-28：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：7de18a7290f55a7988b920706a51806337629e7163b50636e9ae960aba313140
