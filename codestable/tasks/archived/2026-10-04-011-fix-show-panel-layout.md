---
doc_type: task-list
task: fix-show-panel-layout
goal: 修复详情面板标题动作、字段对齐与紧凑值框布局
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-04
updated: 2026-10-04
archived: 2026-10-04
related_docs:
  - codestable/issues/015-o-ff-修复详情面板布局.md
  - codestable/spec/view-layer/index.md
---

# 修复详情面板标题动作、字段对齐与紧凑值框布局

## 1. 任务目标

修复详情面板标题动作、字段对齐与紧凑值框布局

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 修复Show兼容样式并保留字段与动作协议
- [x] 构建并完成聚焦检查和实际页面响应式验证

## 4. CodeStable 文档索引

- `codestable/issues/015-o-ff-修复详情面板布局.md`
- `codestable/spec/view-layer/index.md`

## 5. 执行步骤

### 1. 修复Show兼容样式并保留字段与动作协议

- 状态：done

### 2. 构建并完成聚焦检查和实际页面响应式验证

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-04：Task 已创建。

2026-10-04：已定位standardPanel=false的兼容面板，标题浮动挤窄首行、box-show继承16px padding/margin。新增限定Show的标题flex、动作换行及默认动作顺序，值框紧凑间距；未改字段列宽、业务数据或节点。无可调用子代理/原生Tasks接口，本账本推进并自查。

2026-10-04：最终生产构建、artifact、typecheck、Show四项测试与diff check通过。Chrome extension隔离真实发票页预览最终CSS，1912/768/375/320px的标题动作包含、标签和值起点、紧凑padding/margin、面板无溢出及关系Grid宽度约束全部通过；768px内容按既有字段宽度自然换行，不强制固定行高。补Show关系slot min-width:0解决Grid内容撑宽。320px页面仍有既有navbar用户区溢出到367px，详情面板与关系Grid无溢出；不扩大到导航栏。证据artifacts/show-panel-layout/含四视口截图与verification.json。未部署、未业务写入，无独立review接口。归档后015-o-ff改015-x-ff并回写View spec；无Talk/Note/Tool增量，CSS与现有正本已表达结论。

2026-10-04：Task 已标记 completed，等待归档。

2026-10-04：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：1312a304f480a618fbfb3fbcb8eb399f3929a98bea6ae4eff1d0633b67404c4b
