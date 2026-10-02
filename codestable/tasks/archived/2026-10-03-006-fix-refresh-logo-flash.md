---
doc_type: task-list
task: fix-refresh-logo-flash
goal: 修复整页刷新首次渲染的Logo放大闪现
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-03
updated: 2026-10-03
archived: 2026-10-03
related_docs:
  - codestable/epics/002-o-untitled-ui-react-adoption/issues/004-o-迁移-shell-到-app-navigation.md
  - codestable/epics/002-o-untitled-ui-react-adoption/spec.md
  - src/Layout/Content.php
---

# 修复整页刷新首次渲染的Logo放大闪现

## 1. 任务目标

修复整页刷新首次渲染的Logo放大闪现

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 在服务端启用首屏样式并添加布局回归
- [x] 验证无脚本及正常刷新并准备规格回写

## 4. CodeStable 文档索引

- `codestable/epics/002-o-untitled-ui-react-adoption/issues/004-o-迁移-shell-到-app-navigation.md`
- `codestable/epics/002-o-untitled-ui-react-adoption/spec.md`
- `src/Layout/Content.php`

## 5. 执行步骤

### 1. 在服务端启用首屏样式并添加布局回归

- 状态：done

### 2. 验证无脚本及正常刷新并准备规格回写

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-03：Task 已创建。

2026-10-03：2026-10-03：Content::applyClasses在runtimeAvailable时加入且不重复dcat-modern-active，普通/全页布局共享，保留请求/React挂载标记时机。回归覆盖有无manifest、字符串/数组自定义类、dark-mode、水平/折叠设置；修复前失败，修复后PHP8.1.34/Laravel10.50.3消费者ModernRendererTest为13项84断言通过，PHP语法与modern:php-static、diff-check通过。Chrome暂停脚本并真实reload：修复前mini225px，修复后mini隐藏、full35px且request-enabled仍未启用；已恢复脚本并正常刷新成功。CDP新文档注入不受支持，改用无脚本首屏+真实刷新验证，不声称逐帧采样。继续正常刷新和现有图表/跳转检查；保留既有变更，宿主无独立Review工具。

2026-10-03：2026-10-03：Chrome官方扩展实测暂停脚本后整页刷新，服务器首屏active=true、request-enabled=false，full Logo35×35、mini隐藏；恢复脚本后3次同URL正常reload均request-enabled=true且Logo正常，timeOrigin各异证明确实重新加载文档。刷新后6图单个有效SVG/尺寸非零/路径正常/卡片内；再验证统计卡片→Modal→后退，两次PJAX8阶段active持续有效、Logo35px、timeOrigin不变。warn/error为空，脚本开关已恢复，临时导航观测器已移除，未修改视口或用户设置。证据artifacts/logo-refresh/{before-no-script.jpg,after-no-script.jpg,after.jpg,verification.json}；本次PHP修改无需重建前端，未重跑未受影响TS/全量门禁或其他浏览器。当前会话自查无新增缺陷，无子代理工具不声称独立Review。归档后回写Issue004顶部整页刷新节及Epic S3，写入首屏由服务端输出样式标记、native/compat和现有配置保持、13项84断言与无脚本/三次真实刷新验证；预期2026-10-03-006-fix-refresh-logo-flash.md以runtime实际返回为准。保留上一轮归档原有范围，Issue/Epic保持open，不毕业Project Spec；根因和边界由源码/测试/Issue承载，无新增Talk/Note/Tool。

2026-10-03：Task 已标记 completed，等待归档。

2026-10-03：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：e9f8ab78d1b66518d2318f0a7f264fa011dd4ce58ce3736e979d81e5d0781c08
