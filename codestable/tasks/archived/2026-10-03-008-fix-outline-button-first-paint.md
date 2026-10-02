---
doc_type: task-list
task: fix-outline-button-first-paint
goal: 让线框按钮从首次绘制就显示透明背景和线框
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

# 让线框按钮从首次绘制就显示透明背景和线框

## 1. 任务目标

让线框按钮从首次绘制就显示透明背景和线框

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 将线框规则移至公共样式并重建资源
- [x] 验证扩展页及其他页面的首屏按钮并准备回写

## 4. CodeStable 文档索引

- `codestable/epics/002-o-untitled-ui-react-adoption/issues/005-o-完成-view-组件迁移与验收.md`
- `codestable/epics/002-o-untitled-ui-react-adoption/spec.md`

## 5. 执行步骤

### 1. 将线框规则移至公共样式并重建资源

- 状态：done

### 2. 验证扩展页及其他页面的首屏按钮并准备回写

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-03：Task 已创建。

2026-10-03：已将styles.css中依赖dcat-modern-grid-view的btn-outline.btn-primary两组规则移至公共compat-facade.css，保持当前普通/hover/active颜色；仅去除挂载后容器限定，不改变点击行为。modern:build完成并同步native/compat和旧资源入口，modern:artifact及diff-check通过。Chrome扩展无脚本首屏与正常reload的Refresh/Marketplace/Install From Local背景均透明，文字及边框均rgb(88,108,177)。继续跨页实色/线框与刷新录像验收。

2026-10-03：Chrome官方扩展验证扩展页三按钮：无脚本首次绘制与挂载后背景均transparent、文字/边框均rgb(88,108,177)，正常完整刷新7帧录像中按钮首次出现到最终状态一直为线框。Scaffold页面两处线框按钮首屏/挂载后均透明，Submit实色按钮保持紫底白字，未点击提交或安装等操作。证据artifacts/button-first-paint/{before.json,before-no-script.jpg,after-no-script.jpg,after.jpg,verification.json,refresh-44.jpg}。native/compat资源重建及artifact通过：JS196892+CSS33991=230883gzip字节，仅观测；diff-check通过。纯CSS规则作用域修复，不新增复述样式的单元测试，不重跑未受影响PHP/TS或全量浏览器套件。脚本执行已恢复、录屏已停止，未调整视口，extensions/scaffold warn/error为空。当前会话自查无新增缺陷，无子代理工具不声称独立Review。归档后回写Issue005线框首屏节及Epic S6，Issue/Epic保持open，不毕业Project Spec，无新增Talk/Note/Tool。

2026-10-03：Task 已标记 completed，等待归档。

2026-10-03：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：a5032c453601452f87b133c54c30f4d983b66197ad458f0ed4f1cc9a5cf19e33
