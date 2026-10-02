---
doc_type: task-list
task: fix-collapsed-sidebar-hover
goal: 修复折叠侧栏悬停浮层与自动收缩，保持主内容布局不变
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-03
updated: 2026-10-03
archived: 2026-10-03
related_docs:
  - codestable/epics/002-o-untitled-ui-react-adoption/issues/004-o-迁移-shell-到-app-navigation.md
  - codestable/epics/002-o-untitled-ui-react-adoption/spec.md
  - resources/modern/runtime.ts
  - resources/modern/shell/menu.tsx
---

# 修复折叠侧栏悬停浮层与自动收缩，保持主内容布局不变

## 1. 任务目标

修复折叠侧栏悬停浮层与自动收缩，保持主内容布局不变

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 修复侧栏临时展开状态与菜单点击行为并补充回归测试
- [x] 完成聚焦验证、构建与浏览器几何检查并准备规格回写

## 4. CodeStable 文档索引

- `codestable/epics/002-o-untitled-ui-react-adoption/issues/004-o-迁移-shell-到-app-navigation.md`
- `codestable/epics/002-o-untitled-ui-react-adoption/spec.md`
- `resources/modern/runtime.ts`
- `resources/modern/shell/menu.tsx`

## 5. 执行步骤

### 1. 修复侧栏临时展开状态与菜单点击行为并补充回归测试

- 状态：done

### 2. 完成聚焦验证、构建与浏览器几何检查并准备规格回写

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-03：Task 已创建。

2026-10-03：已增加独立 sidebar-hover 状态，移除分组触发总开关，限制桌面折叠样式并补充事件与菜单回归。用户确认分组点击保留浮层，菜单项选择后收起；实际浏览器复现内容左边界86.39→260px。宿主未暴露子代理工具，无法委派独立专家；本次在当前会话完成实现与聚焦自查，不冒称独立Review。原生Tasks不可用，以本文件为准；按用户文档约束复用Issue004，不另建ff。准备运行聚焦验证。

2026-10-03：2026-10-03 恢复：已复核 Issue004、本轮源码与生成资源差异；目标与原授权一致。Chrome extension 连接可用，将新建任务隔离标签验证。宿主仍无原生 Tasks/子代理工具，保留单写者与自查边界；运行现有聚焦测试、类型检查、构建及扩展浏览器几何验收。

2026-10-03：聚焦Vitest28项、TypeScript、现代构建与artifact已通过。Chrome实测悬停260px、占位/内容/顶栏/页脚仍86.390625px起点，浮层z1051高于顶栏1050；分组点击保持折叠状态。实际选择Users触发整页重载，确认AriaLink默认阻止冒泡导致既有PJAX未执行；已按Issue004更新计划，将菜单接入RouterProvider与既有navigation，并补充鼠标/键盘菜单选择回归，继续验证。

2026-10-03：实现批次完成：RouterProvider复用既有navigation，菜单onClick调用统一浮层关闭方法，vendor未修改。当前三文件57项Vitest及TypeScript通过；新增鼠标/键盘菜单路由测试单独2项复跑无警告，导航套件原生整页跳转用例的jsdom提示不影响通过。现代构建完成。Chrome extension真实菜单Modal→Users及键盘Users→Modal均走PJAX，点击后保持sidebar-collapse且清除sidebar-hover；内容、顶栏和页脚x=86.390625及宽度不变。移出与再次进入正常，正在完成移动抽屉位置、截图和最终自查。

2026-10-03：最终验证完成：三个受影响文件（runtime.test.ts、views/layout.test.tsx、navigation.test.ts）共57项Vitest、modern:typecheck、modern:build、modern:artifact、浏览器脚本node --check与git diff --check通过；本批最后只补证据与文档，不重复运行未受影响的全量验证。产物JS196878 + CSS33842 = 230720 gzip字节，仅观测。Chrome官方extension实测桌面1912×906下浮层宽260px、z-index1051高于顶栏1050，侧栏占位与主内容/顶栏/页脚x=86.390625及几何不变；分组点击保留浮层，真实鼠标Modal→Users与键盘Enter Users→Modal均走既有PJAX，选择后保留sidebar-collapse并清除sidebar-hover，移出及再次进入正常。375×812移动抽屉x=0、宽260px、标签完整且无横向溢出，Escape关闭；临时视口已恢复，浏览器warn/error为空。最终截图和几何已保存于artifacts/sidebar-hover/{collapsed.jpg,preview.jpg,mobile.jpg,verification.json}。本地Demo为PHP8.1.34/Laravel10.50.3，本轮未重跑PHP/Dusk、modern:verify全链或其他浏览器；无独立Review工具，沿用当前会话自查边界。回写准备：Task归档后，将Issue004顶部本轮修复节由待验证改为完成，写入两处根因、实现、聚焦验证、浏览器证据与runtime实际返回的归档路径；在Epic002 spec.md的S3章节记录悬停浮层、分组/叶子菜单选择与PJAX稳定契约并链接同一归档。Issue/Epic保持open，不毕业到Project Spec；本轮无新增Talk/Note/Tool/ff需要迁移。保留现有中断恢复记录，归档Task冻结后仅回写业务正本。

2026-10-03：Task 已标记 completed，等待归档。

2026-10-03：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：89cd64026807aba52e65997dd5ded289d13d0ea24ae26f724be9b4e44493e8a8
