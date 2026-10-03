---
doc_type: task-list
task: improve-show-attachments
goal: 优化详情附件列表及文件名下载
status: archived
workflow: fast
owner_skill: cs
created: 2026-10-08
updated: 2026-10-08
archived: 2026-10-08
related_docs:
  - codestable/issues/032-o-ff-优化详情附件列表.md
---

# 优化详情附件列表及文件名下载

## 1. 任务目标

优化详情附件列表及文件名下载

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 修正附件渲染与样式并补充回归测试
- [x] 验证构建与附件布局下载行为

## 4. CodeStable 文档索引

- `codestable/issues/032-o-ff-优化详情附件列表.md`

## 5. 执行步骤

### 1. 修正附件渲染与样式并补充回归测试

- 状态：done

### 2. 验证构建与附件布局下载行为

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-08：Task 已创建。

2026-10-08：已修正附件渲染与兼容样式，添加链接安全转义回归；生产构建完成，继续聚焦验证与布局预览。

2026-10-08：PHPUnit 1项15断言、语法、构建、artifact、diff通过。独立Chrome extension临时预览无圆点/回形针、图标与名称同排，download链接存在；已刷新清除预览。未验证真实下载，跨域需服务端下载响应头。截图artifacts/show-attachments/desktop.png。准备032-o-ff改为032-x-ff并同步View规格，无Talk/Note/Tool增量。未部署，无子代理接口。

2026-10-08：Task 已标记 completed，等待归档。

2026-10-08：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：bafb863983e68f15158fb41c3872b2a7ff0e94dbef940d3a5a5289d1baad813c
