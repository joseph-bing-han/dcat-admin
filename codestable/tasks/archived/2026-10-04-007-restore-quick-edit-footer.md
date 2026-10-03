---
doc_type: task-list
task: restore-quick-edit-footer
goal: 恢复快速编辑弹窗底部保存和重置按钮，保留内容滚动及回调行为
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-04
updated: 2026-10-04
archived: 2026-10-04
related_docs:
  - codestable/issues/011-o-ff-恢复快速编辑弹窗底部按钮.md
  - codestable/spec/view-layer/index.md
---

# 恢复快速编辑弹窗底部保存和重置按钮，保留内容滚动及回调行为

## 1. 任务目标

恢复快速编辑弹窗底部保存和重置按钮，保留内容滚动及回调行为

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 修复公共Layer高度分配并补充聚焦回归测试
- [x] 编译资源并验证实际快速编辑弹窗和相邻布局场景
- [x] 补齐标题栏拖动并验证视口边界和事件清理

## 4. CodeStable 文档索引

- `codestable/issues/011-o-ff-恢复快速编辑弹窗底部按钮.md`
- `codestable/spec/view-layer/index.md`

## 5. 执行步骤

### 1. 修复公共Layer高度分配并补充聚焦回归测试

- 状态：done

### 2. 编译资源并验证实际快速编辑弹窗和相邻布局场景

- 状态：done

### 3. 补齐标题栏拖动并验证视口边界和事件清理

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-04：Task 已创建。

2026-10-04：根因为Layer content height:100%挤出外部footer，非FormView遗漏。改为纵向flex，标题/footer不收缩，content min-height:0与overflow:auto，restore恢复flex。新增原节点、保存/重置回调、取消隐藏再恢复测试，17项测试通过；typecheck发现新测试无参mock元组访问错误，已改为调用断言待复核。前线程及工作区已核对；无原生Tasks或可调用子代理接口，以本账本推进。

2026-10-04：用户追加同类弹窗标题栏拖动，范围仍限定公共Layer。追加拖动、边界与清理步骤；按钮布局修复生产构建、artifact、typecheck和聚焦测试已通过。待统一预览最终编译资源。

2026-10-04：从用户指定线程恢复；拖动代码与19项Layer/overlay测试、typecheck通过证据已找到，生产资源尚未包含拖动改动。Chrome extension已重新验证连接，并新建隔离页进行最终资源预览；继续实际弹窗布局、拖动、视口与回调验收，沿用无部署和无业务写入边界。

2026-10-04：2026-10-04：最终生产构建、artifact、typecheck、Layer/overlays两文件19项测试和git diff --check通过。Chrome extension隔离页面加载最终兼容资源，并将新Layer方法复制至已初始化DialogForm所持有的旧对象，仅为临时预览。真实快速编辑在1912×906、375×667和320×480下按钮完整可见，重置原值、关闭、标题鼠标拖动、16px边界、缩小视口重新约束及内容滚动通过。独立无业务写入弹窗验证保存/重置各一次、取消隐藏再restore为flex、自动高度/无标题/无按钮四种布局全部保持视口边距并内容滚动；move:false与关闭后的事件清理由聚焦测试验证。真实表单未保存，未部署消费应用；消费应用旧资源与已有动态初始化行为不作为发布后验证。截图artifacts/quick-edit-footer/375px.png，临时页已关闭、视口已复原、资源预览服务已停止。无可调用子代理，未冒称独立review。准备归档后将011-o-ff改为011-x-ff并写四节结果，View spec补公共Layer当前布局、拖动和证据边界；无新增Talk/Note/Tool，既有代码足以表达此修复，无额外知识增量。

2026-10-04：Task 已标记 completed，等待归档。

2026-10-04：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：d71ace8b3b9a9edc8d0aed73cde341818f158af0262f747f552d3fbb8eefe829
