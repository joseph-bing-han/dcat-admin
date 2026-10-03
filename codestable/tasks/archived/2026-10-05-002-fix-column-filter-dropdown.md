---
doc_type: task-list
task: fix-column-filter-dropdown
goal: 修复列筛选弹窗按钮布局及嵌套菜单关闭
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-05
updated: 2026-10-05
archived: 2026-10-05
related_docs:
  - codestable/issues/022-o-ff-修复列筛选弹窗排版与关闭.md
  - resources/modern/runtime.ts
  - resources/modern/compat-facade.css
---

# 修复列筛选弹窗按钮布局及嵌套菜单关闭

## 1. 任务目标

修复列筛选弹窗按钮布局及嵌套菜单关闭

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 修复嵌套菜单关闭与筛选操作布局并回归测试
- [x] 构建并验证实际页面再回写结果

## 4. CodeStable 文档索引

- `codestable/issues/022-o-ff-修复列筛选弹窗排版与关闭.md`
- `resources/modern/runtime.ts`
- `resources/modern/compat-facade.css`

## 5. 执行步骤

### 1. 修复嵌套菜单关闭与筛选操作布局并回归测试

- 状态：done

### 2. 构建并验证实际页面再回写结果

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-05：Task 已创建。

2026-10-05：七个嵌套菜单关闭用例修复前均失败。补齐嵌套查找后回归揭示原捕获点击关闭输入区，已补输入/标签保留菜单条件；53项runtime/compat-overlays测试、typecheck、生产构建、artifact与diff-check通过。继续实际页面本地构建JS/CSS临时预览；不部署消费目录。

2026-10-05：实际最终JS/CSS经官方Chrome扩展独立标签页请求拦截重定向至临时本地静态服务器，未更改消费应用磁盘资源。发现React Aria补发TH点击关闭菜单后，已隔离菜单触发器pointerdown。54项runtime/compat-overlays测试、typecheck、build、artifact、diff-check通过。实际桌面菜单198x147、两按钮均39x32且同排；375px菜单left154/right352在视口内且按钮同排。输入点击保持展开，重复图标点击、外部点击、Escape、金额/GST切换均关闭正常，菜单样式恢复，warn/error为空。未提交筛选或业务动作。视口已恢复、请求拦截已清理、缓存禁用已恢复、验证标签已关闭；停止临时服务器。归档后回写022-x-ff及当前View兼容面，归档路径2026-10-05-002-fix-column-filter-dropdown.md。无Talk/Note/Tool增量；无子代理接口，自查不等于独立review。

2026-10-05：Task 已标记 completed，等待归档。

2026-10-05：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：15231d6261129932052ca1def39f15595c7f1a04e9e73d18e72c433e3f1821a2
