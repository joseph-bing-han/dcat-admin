---
doc_type: task-list
task: fix-login-compat-layout
goal: 修复升级后的自定义登录页图标、标签和品牌布局
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-03
updated: 2026-10-03
archived: 2026-10-03
related_docs:
  - codestable/issues/004-o-ff-修复自定义登录页布局兼容.md
  - codestable/spec/view-layer/index.md
---

# 修复升级后的自定义登录页图标、标签和品牌布局

## 1. 任务目标

修复升级后的自定义登录页图标、标签和品牌布局

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 补齐登录兼容样式与回归用例
- [x] 构建发布资源并验证登录布局

## 4. CodeStable 文档索引

- `codestable/issues/004-o-ff-修复自定义登录页布局兼容.md`
- `codestable/spec/view-layer/index.md`

## 5. 执行步骤

### 1. 补齐登录兼容样式与回归用例

- 状态：done

### 2. 构建发布资源并验证登录布局

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-03：Task 已创建。

2026-10-03：已补齐登录页样式和 facade 浏览器回归用例；实际页面预览发现窄屏嵌套 content 内边距叠加，已限定 full-page 登录容器修复。生产构建成功；继续验证 320/375/桌面及输入状态。

2026-10-03：Chrome 官方扩展执行 fixture 六组 1280/375/320 像素空值与填写状态几何检查全部通过，三组错误反馈排版通过；真实 PayTaxNZ 页面 375/320px 无按钮换行或横向溢出。仅临时预览样式，未发布到业务应用。artifact 与 bootstrap-absence 通过；继续完成 native 系统页面聚焦测试。

2026-10-03：生产构建、artifact、bootstrap-absence、system.test.tsx 3项测试、JS语法和diff检查通过。Chrome扩展实际执行9组布局检查通过，未使用独立浏览器启动器；未运行整套历史facade交互。无可用subagent，未声明独立审查。归档后将004-o-ff改为004-x-ff并写回View spec登录兼容范围；无独立Talk/Note/Tool增量。本轮不提交、不推送、不发布业务系统，README既有改动保留。

2026-10-03：Task 已标记 completed，等待归档。

2026-10-03：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：e1e14b752141a1dbd35865adb879909ddf62aad439cea688e65d166be53283ff
