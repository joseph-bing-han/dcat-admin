---
doc_type: task-list
task: fix-navigation-logo-flash
goal: 修复页面跳转期间侧栏 Logo 放大闪现
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-03
updated: 2026-10-03
archived: 2026-10-03
related_docs:
  - codestable/epics/002-o-untitled-ui-react-adoption/issues/004-o-迁移-shell-到-app-navigation.md
  - codestable/epics/002-o-untitled-ui-react-adoption/spec.md
  - resources/modern/bridge.tsx
---

# 修复页面跳转期间侧栏 Logo 放大闪现

## 1. 任务目标

修复页面跳转期间侧栏 Logo 放大闪现

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 修正局部卸载范围并补充生命周期回归
- [x] 构建并验证跳转各阶段的Logo尺寸与准备规格回写

## 4. CodeStable 文档索引

- `codestable/epics/002-o-untitled-ui-react-adoption/issues/004-o-迁移-shell-到-app-navigation.md`
- `codestable/epics/002-o-untitled-ui-react-adoption/spec.md`
- `resources/modern/bridge.tsx`

## 5. 执行步骤

### 1. 修正局部卸载范围并补充生命周期回归

- 状态：done

### 2. 构建并验证跳转各阶段的Logo尺寸与准备规格回写

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-03：Task 已创建。

2026-10-03：2026-10-03：Chrome扩展捕获before-replace阶段全局标记丢失，mini Logo由隐藏变225×225，loaded恢复；证据artifacts/logo-navigation/before.json。已将bridge全局标记清理限定于document/body/html整页卸载，局部组件及浮层清理保持。新增6例覆盖两种PJAX派发目标、局部最后组件、三种整页卸载；修复前3个局部用例失败，修复后bridge/navigation/runtime三文件70项和typecheck通过。宿主无子代理工具，当前会话自查，不声称独立Review；保留所有既有未提交变更。继续构建与真实导航验证。

2026-10-03：2026-10-03：构建、artifact、diff-check通过，JS196892+CSS34016=230908gzip字节，仅观测。Chrome官方扩展完成Operation Log→Dashboard→Modal→统计卡片、折叠态统计卡片→Dashboard、后退至统计卡片共5次导航20个生命周期采样，start/before-replace/loaded/end均保留active/request样式标记；每态只有一个35×35品牌Logo，另一个隐藏，timeOrigin不变，无warn/error。artifacts/logo-navigation/保存before.json、verification.json、after.jpg、collapsed.jpg；侧栏已恢复原展开状态，未改视口（1912×906），临时CDP观测器已移除。当前会话自查未发现新增缺陷，未运行PHP/全量modern:verify/其他浏览器或独立Review。归档后回写Issue004顶部Logo闪现节及Epic S3：局部unmount保留全局样式、document/body/html完整卸载清理、根因与测试/浏览器证据，预期归档2026-10-03-005-fix-navigation-logo-flash.md以runtime返回为准。Issue/Epic保持open，不毕业Project Spec、不修改既有归档；局部与全局卸载边界由代码注释、回归测试和Issue承载，无新增Talk/Note/Tool。

2026-10-03：Task 已标记 completed，等待归档。

2026-10-03：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：5b30d68119f4f0ee11c8eacfd0f4ea8bd3e49d65cd90707aa887487901c2d9c7
