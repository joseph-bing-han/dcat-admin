---
doc_type: task-list
task: fix-dashboard-logo-position
goal: 消除Dashboard整页刷新时品牌图像的位置闪烁
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-03
updated: 2026-10-03
archived: 2026-10-03
related_docs:
  - codestable/epics/002-o-untitled-ui-react-adoption/issues/005-o-完成-view-组件迁移与验收.md
  - codestable/epics/002-o-untitled-ui-react-adoption/issues/004-o-迁移-shell-到-app-navigation.md
  - codestable/epics/002-o-untitled-ui-react-adoption/spec.md
---

# 消除Dashboard整页刷新时品牌图像的位置闪烁

## 1. 任务目标

消除Dashboard整页刷新时品牌图像的位置闪烁

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 对齐Dashboard首屏模板与最终卡片并补充渲染回归
- [x] 验证刷新过程和窄屏布局并准备结果回写

## 4. CodeStable 文档索引

- `codestable/epics/002-o-untitled-ui-react-adoption/issues/005-o-完成-view-组件迁移与验收.md`
- `codestable/epics/002-o-untitled-ui-react-adoption/issues/004-o-迁移-shell-到-app-navigation.md`
- `codestable/epics/002-o-untitled-ui-react-adoption/spec.md`

## 5. 执行步骤

### 1. 对齐Dashboard首屏模板与最终卡片并补充渲染回归

- 状态：done

### 2. 验证刷新过程和窄屏布局并准备结果回写

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-03：Task 已创建。

2026-10-03：用户确认Dashboard。逐帧录制定位欢迎卡片旧fallback70px图像与现代48px卡片切换；侧栏Logo固定。已仅修改dashboard/title.blade.php现代fallback，复用现有Card/CSS并保留compat。新增实际Blade渲染回归覆盖与载荷一致的Logo/标题/四链接、48px固有尺寸及无manifest路径；PHP8.1.34/Laravel10.50.3消费者14项104断言通过，modern:php-static和PHP语法通过。Chrome无脚本首屏与恢复脚本reload结果Logo均(661.25,234,48,48)，卡片(300,210,770.5,168)，链接几何完全一致。继续逐帧正常刷新与窄屏验证。

2026-10-03：Chrome官方扩展验收完成：Dashboard刷新录像44帧，首帧/挂载阶段/图表完成关键帧均保持品牌卡片布局；桌面无脚本与挂载后Logo(661.25,234,48,48)，卡片高168px，四链接几何一致；375x812无脚本与挂载后Logo(156,214,48,48)，卡片高196px，链接自然两行且几何一致，scrollWidth=clientWidth=360。侧栏35px Logo保持(16,8)。脚本禁用已恢复，录屏已停止，视口恢复1912x906，warn/error为空。证据artifacts/logo-position/{before.json,verification.json,before-no-script.jpg,after-no-script.jpg,mobile.jpg,after.jpg,verified-after-39.jpg}。PHP14项104断言、modern:php-static、PHP语法及diff-check通过；本轮只改Blade并复用已有CSS，无需构建，未重复TS/全量测试/其他浏览器。当前会话自查未发现新增缺陷；无子代理工具，不声称独立Review。旧录屏会话停止产帧，改用同一Chrome扩展新建本任务标签成功录制，未使用其他浏览器技术。归档后回写Issue005顶部完成结果和Epic S6；Issue004补充链接改到已完成锚点，前两轮尺寸修复记录原样保留。Issue/Epic保持open，不毕业Project Spec，无新增Talk/Note/Tool。

2026-10-03：Task 已标记 completed，等待归档。

2026-10-03：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：47f272cf25918dc32b53aeadf47f62807121f0dd56f3e7e2246349a5ca2a7f60
