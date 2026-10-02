---
doc_type: task-list
task: fix-metric-chart-rendering
goal: 修复统计卡片图表空白，保证首次加载、筛选和导航后正常显示
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-03
updated: 2026-10-03
archived: 2026-10-03
related_docs:
  - codestable/epics/002-o-untitled-ui-react-adoption/issues/005-o-完成-view-组件迁移与验收.md
  - codestable/epics/002-o-untitled-ui-react-adoption/spec.md
  - src/Widgets/Metrics/RadialBar.php
  - scripts/dcat-admin-demo-browser.mjs
---

# 修复统计卡片图表空白，保证首次加载、筛选和导航后正常显示

## 1. 任务目标

修复统计卡片图表空白，保证首次加载、筛选和导航后正常显示

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 修复统计卡片图表容器宽度并补充浏览器回归
- [x] 验证首次加载、筛选与导航后的图表显示并准备规格回写

## 4. CodeStable 文档索引

- `codestable/epics/002-o-untitled-ui-react-adoption/issues/005-o-完成-view-组件迁移与验收.md`
- `codestable/epics/002-o-untitled-ui-react-adoption/spec.md`
- `src/Widgets/Metrics/RadialBar.php`
- `scripts/dcat-admin-demo-browser.mjs`

## 5. 执行步骤

### 1. 修复统计卡片图表容器宽度并补充浏览器回归

- 状态：done

### 2. 验证首次加载、筛选与导航后的图表显示并准备规格回写

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-03：Task 已创建。

2026-10-03：初始工作区干净；Chrome extension真实页面确认六图中四图宽度0而非数据或资源报错。RadialBar共用图表外层已复用w-100并设置min-width:0，消除空flex子项与mountChart宽度守卫相互等待；保持隐藏图表延迟初始化及PJAX清理。Demo的Composer包链接指向本仓库，刷新已实测六图均为单个SVG、宽高非零、路径有效且位于卡片内部。新增Demo浏览器回归覆盖首次加载、三种卡片日期筛选、PJAX清理/返回与375px视口。PHP语法、node --check、git diff --check通过；当前vendor入口ModernRendererTest为12tests/56assertions通过。本次仅PHP布局与回归脚本，无前端源码或资源修改，不重新构建未变化的资源。宿主未暴露原生Task或子代理工具，本Task为唯一账本，当前会话自查不冒充独立Review；下一批完成扩展交互与响应式证据。

2026-10-03：最终验收完成：Chrome官方extension的首次加载、Avg Sessions/Product Orders/Tickets三次日期筛选、PJAX返回、375×812移动视口及恢复1912×906桌面共7个状态，每态六图均只有一个有效SVG、宽高非零、路径无NaN/Infinity且不超出卡片；日期更新确实替换图表容器。PJAX离开后注册图表数为0，返回后为6，performance.timeOrigin保持一致，证明没有整页重载。375px视口scrollWidth=clientWidth=360，控制台warn/error为空，临时视口已reset。artifacts/metric-charts/{before.jpg,after.jpg,mobile.jpg,verification.json}保存截图及几何，已逐项校验记录。PHP环境核对发现仓库既有vendor为Laravel9.52.22，首次12/56结果不作为当前Demo验收；已改用dcat-admin-demo/vendor/autoload.php与其PHPUnit10.5.64，在实际PHP8.1.34/Laravel10.50.3下重新通过12tests/56assertions。PHP语法、浏览器脚本node --check、diff --check通过；现有Demo脚本新增行为断言，本轮通过扩展执行对应场景，未运行其全站CLI流程或全量Dusk/modern:verify，也不重新构建未变化的前端资源。自查未发现本次范围内遗留缺陷；宿主无独立Reviewer能力。回写准备：归档后更新Issue005本轮统计图表修复节为已完成，写入根因、共用容器修复、实际PHP验证命令、浏览器证据与runtime返回的归档路径；Epic002 spec.md的S6记录ApexCharts兼容边界下图表容器在初始化前获取可用宽度并可随列宽收缩的稳定规则。Issue/Epic保持open，不毕业到Project Spec。既有Issue与源码注释已承载本次结论，无额外Talk/Note/Tool增量；不提交或推送。

2026-10-03：Task 已标记 completed，等待归档。

2026-10-03：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：698ab7df0b93b90218ede87914fc895437fbee3f0d21c6e13245edf4e7cf65e0
