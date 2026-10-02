---
doc_type: task-list
task: fix-grid-first-paint
goal: 统一所有内建 Grid 的服务端首屏与现代接管布局
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-03
updated: 2026-10-03
archived: 2026-10-03
related_docs:
  - codestable/epics/002-o-untitled-ui-react-adoption/issues/005-o-完成-view-组件迁移与验收.md
  - codestable/epics/002-o-untitled-ui-react-adoption/spec.md
---

# 统一所有内建 Grid 的服务端首屏与现代接管布局

## 1. 任务目标

统一所有内建 Grid 的服务端首屏与现代接管布局

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 统一公共 Grid 首屏结构与布局契约
- [x] 补充回归并构建验证现代资源
- [x] 验证真实刷新与响应式布局并准备结果回写

## 4. CodeStable 文档索引

- `codestable/epics/002-o-untitled-ui-react-adoption/issues/005-o-完成-view-组件迁移与验收.md`
- `codestable/epics/002-o-untitled-ui-react-adoption/spec.md`

## 5. 执行步骤

### 1. 统一公共 Grid 首屏结构与布局契约

- 状态：done

### 2. 补充回归并构建验证现代资源

- 状态：done

### 3. 验证真实刷新与响应式布局并准备结果回写

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-03：Task 已创建。

2026-10-03：公共Grid已输出现代首屏容器、同数据单元格与分页；共享表格密度作用于服务端/collection/structural两阶段，标签tone由PHP载荷给出。进入构建与实测差异修正。已读取async模板：其为异步数据兼容视图，没有grid.read接管切换，本轮保留异步协议。无宿主子代理工具，后续由当前会话自查。

2026-10-03：服务端补齐Grid与compat岛样式标记；quick-create首屏改为与React相同tbody；空工具栏不占空间。PHP17项131断言、Grid Vitest7项通过，类型检查与资源构建通过。Chrome扩展普通、quick-create、空态首屏/挂载后几何一致；随机报表和固定列使用同文档延迟执行页面原脚本验证，表格内部相对位置、列宽、总高一致。报表/默认demo上方异步指标卡片仍会因数据返回增加高度，属于独立指标占位问题，记录其对整页位置的影响，未修改异步数据协议。继续窄屏、正常刷新及交互验证。

2026-10-03：375px空列表和扩展页首屏/挂载后表格、外壳、分页几何一致，无整页横向溢出；正常刷新7帧录像确认Grid首现即为最终布局。全选及快速新增展开/取消通过。补充发现collection表头的禁用press会吞掉原生排序anchor，已使用上游Link与Grid局部RouterProvider桥接现有navigation，保留PJAX/history；补充排序与单元格链接点击回归，正在复测。

2026-10-03：最终PHP8.1.34/Laravel10.50.3消费者17tests/131assertions，Grid+navigation Vitest35项，typecheck、php-static、build、artifact及diff-check通过。产物JS196843+CSS34192=231035gzip字节，仅观测。Chrome真实排序URL已切至asc且timeOrigin不变，单表保留；最后正常刷新/导航无新增warn/error。桌面最终首屏/挂载Grid根239px、表96px、分页56px一致，最大列宽舍入差0.0625px；375px首屏/挂载几何一致无整页溢出，已恢复1912x906、脚本执行，停止录屏，无残留观测器。证据artifacts/grid-first-paint/verification.json、after.jpg、refresh-906.jpg等。回放原脚本用于同随机数据比较曾有Select2时序错误，未扩大为正常刷新错误；真实quick-create Select2可打开且取消正常。报表/默认demo异步统计卡片仍有独立数据加载位移，当前范围仅消除Grid接管跳变，不宣称整页所有异步内容零位移。当前会话自查，无独立子代理工具。归档后回写Issue005本节与Epic S4，保持open；无Project Spec毕业、无新增Talk/Note/Tool；未提交、推送、部署或修改数据库。

2026-10-03：Task 已标记 completed，等待归档。

2026-10-03：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：e0f420135054f590d1ce18dafdd0645767cd2857bb75c9a506b6232cef7924a7
