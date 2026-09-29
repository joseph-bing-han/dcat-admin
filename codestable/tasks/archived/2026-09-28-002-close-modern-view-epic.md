---
doc_type: task-list
task: close-modern-view-epic
goal: 删除 consumer browser contract 验收要求并正式关闭新版 View 现代化 Epic，不恢复旧 Bootstrap/旧整页 renderer
status: archived
workflow: close
owner_skill: cs
created: 2026-09-28
updated: 2026-09-28
archived: 2026-09-28
related_docs:
  - codestable/epics/001-x-view-layer-modernization/spec.md
  - codestable/epics/001-x-view-layer-modernization/issues/001-x-完成新版-view-验收.md
  - codestable/spec/index.md
  - codestable/spec/view-layer/index.md
  - codestable/vision/index.md
---

# 删除 consumer browser contract 验收要求并正式关闭新版 View 现代化 Epic，不恢复旧 Bootstrap/旧整页 renderer

## 1. 任务目标

删除 consumer browser contract 验收要求并正式关闭新版 View 现代化 Epic，不恢复旧 Bootstrap/旧整页 renderer

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 从当前验收契约、状态和文档中删除 consumer browser contract 要求及取消记录
- [x] 将新版 View 稳定事实毕业到 Project Spec 并检查 Vision
- [x] 关闭 Epic Issue 与 Epic，按规则改名并同步引用
- [x] 运行状态、JSON、Task scan、静态检查并确认无残留要求

## 4. CodeStable 文档索引

- `codestable/epics/001-x-view-layer-modernization/spec.md`
- `codestable/epics/001-x-view-layer-modernization/issues/001-x-完成新版-view-验收.md`
- `codestable/spec/index.md`
- `codestable/spec/view-layer/index.md`
- `codestable/vision/index.md`

## 5. 执行步骤

### 1. 从当前验收契约、状态和文档中删除 consumer browser contract 要求及取消记录

- 状态：done

### 2. 将新版 View 稳定事实毕业到 Project Spec 并检查 Vision

- 状态：done

### 3. 关闭 Epic Issue 与 Epic，按规则改名并同步引用

- 状态：done

### 4. 运行状态、JSON、Task scan、静态检查并确认无残留要求

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-09-28：Task 已创建。

2026-09-28：已从当前 docs、Epic 验收定义、Issue、M11 和 capability matrix 删除该专用 consumer contract 的当前门禁/取消状态；通用浏览器脚本保留为可选工具，未误删共享运行时验证代码。

2026-09-28：稳定事实已毕业到 Project Spec 与 Vision；Epic spec 和 Issue 已改为 closed 并完成 -o- 到 -x- 路径迁移。Epic 关闭授权来自 Joseph 2026-09-28 的明确授权。

2026-09-28：最终验证通过：npm run modern:verify（303 entries、296 visible、870 signals、16 个 Vitest 文件/113 tests、构建、artifact、system-Chrome self-test），focused PHP tests（11 tests/53 assertions），modernization:baseline，modern:php-static，21 个 Epic JSON 解析，旧 Epic 路径/已删除外部浏览器门禁搜索无残留，git diff --check，以及 CodeStable scan（无 findings）。

2026-09-28：Task 已标记 completed，等待归档。

2026-09-28：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：efc844008fe59503a2bff9c8cf488bf7c8facf67598b2081eeceb8cd05699fc4
