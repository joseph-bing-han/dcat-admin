---
doc_type: task-list
task: fix-metric-legend-layout
goal: 调整订单图例的圆点、间距与数字排版
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-03
updated: 2026-10-03
archived: 2026-10-03
related_docs:
  - codestable/epics/002-o-untitled-ui-react-adoption/issues/005-o-完成-view-组件迁移与验收.md
  - codestable/epics/002-o-untitled-ui-react-adoption/spec.md
  - resources/modern/compat-facade.css
---

# 调整订单图例的圆点、间距与数字排版

## 1. 任务目标

调整订单图例的圆点、间距与数字排版

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 调整指标图例样式并构建发布资源
- [x] 验证桌面和移动端图例并准备规格回写

## 4. CodeStable 文档索引

- `codestable/epics/002-o-untitled-ui-react-adoption/issues/005-o-完成-view-组件迁移与验收.md`
- `codestable/epics/002-o-untitled-ui-react-adoption/spec.md`
- `resources/modern/compat-facade.css`

## 5. 执行步骤

### 1. 调整指标图例样式并构建发布资源

- 状态：done

### 2. 验证桌面和移动端图例并准备规格回写

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-03：Task 已创建。

2026-10-03：已在metric-content内的chart-info范围补齐图例样式：8px实心状态点、8px文字间距、32px行高、数值600字重/等宽数字/右对齐，颜色复用主题primary/warning/danger；字体图标伪元素清除，避免与文字相连。实测原数值外框右边界已一致，本轮明确文字对齐并改善数字字重，不改变数值格式。Chrome桌面刷新后3行均满足样式目标。modern:build、modern:artifact与diff-check通过，产物JS196878+CSS34015=230893gzip字节。保留前轮未提交PHP、浏览器脚本及归档记录；本轮未修改其行为。宿主无原生Tasks/独立子代理，仍以当前Task为账本并进行当前会话自查。继续检查筛选后的图例与375px布局。

2026-10-03：2026-10-03：Chrome官方扩展完成桌面、Product Orders切换Last 28 Days、375×812移动视口和恢复1912×906验证。三行圆点宽8px、与文字间距8px、行高32px，数值600字重/等宽数字/右对齐且右边界一致；移动端文字数值无重叠，六图在筛选/移动/恢复状态均为单个有效SVG、路径有效且位于卡片内，页面无横向溢出。移动clientWidth/scrollWidth均360，桌面均1897；warn/error为空。截图与几何已保存artifacts/metric-legend/{before.jpg,after.jpg,mobile.jpg,verification.json}；临时视口已恢复。构建/artifact先前已通过，本轮diff-check通过，纯CSS不重复PHP/TS或全量测试；没有独立子代理工具，当前会话自查未发现本次变更缺陷，其他浏览器未验证。归档后立即回写Issue005顶部图例修正节和Epic S6：记录范围、根因、状态点/数字稳定样式、筛选和窄屏验收、截图/JSON与归档Task链接；预期归档2026-10-03-003-fix-metric-legend-layout.md，以runtime返回为准。Issue/Epic保持open，不毕业Project Spec；无路径迁移、不新增Talk/Note/Tool，不修改既有冻结Task。

2026-10-03：Task 已标记 completed，等待归档。

2026-10-03：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：2a895b1c15b38ff475fedcaa8c413c27847b8feec9994fde51883f697e728413
