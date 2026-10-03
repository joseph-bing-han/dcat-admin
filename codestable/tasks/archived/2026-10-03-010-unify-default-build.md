---
doc_type: task-list
task: unify-default-build
goal: 默认命令统一使用新版构建并移除旧构建链
status: archived
workflow: fast
owner_skill: cs
created: 2026-10-03
updated: 2026-10-03
archived: 2026-10-03
related_docs:
  - codestable/issues/002-o-ff-统一新版默认构建命令.md
  - codestable/spec/view-layer/index.md
---

# 默认命令统一使用新版构建并移除旧构建链

## 1. 任务目标

默认命令统一使用新版构建并移除旧构建链

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 统一命令、资源构建与文档
- [x] 验证构建、监听与新版测试门禁

## 4. CodeStable 文档索引

- `codestable/issues/002-o-ff-统一新版默认构建命令.md`
- `codestable/spec/view-layer/index.md`

## 5. 执行步骤

### 1. 统一命令、资源构建与文档

- 状态：done

### 2. 验证构建、监听与新版测试门禁

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-03：Task 已创建。

2026-10-03：默认命令已迁入 Vite；保留新版仍需的插件及 facade；同步当前文档。子代理工具不可用，由主代理验证。

2026-10-03：dev/prod 构建通过；watch 与 watch-poll 均通过初始构建和源码触发重建。2 项构建测试及 21 文件/167 项 Vitest、typecheck、artifact、Bootstrap absence、PHP/Blade static 通过。verify 因既有 Blade inventory 140/142 漂移停止；已恢复其失败前重写的历史盘点文件。锁文件移除旧构建依赖，保留依赖版本无变化；继续 clean install 验证。

2026-10-03：clean npm ci 通过；补充此前由 Mix 间接提供的 @types/node 26.4.0，并显式启用 node types。清洁依赖下 prod、typecheck、2 项构建测试和 167 项 Vitest 均通过；最终 artifact、Bootstrap absence、diff check 通过。旧 extra sourcemap 已清除。主代理复核未发现本次阻断缺陷；原有 coverage/baseline 的 140/142 Blade 漂移未扩展修复，verify 未全通过，Sass import 弃用警告仍在。当前 PHP 8.1.34 / 根包 Laravel 9.52.22，仅运行 PHP 静态检查，无 PHP 运行时行为改动。归档后同步 View spec 默认命令事实并将 issues/002-o-ff-统一新版默认构建命令.md 改为 002-x-ff-统一新版默认构建命令.md；历史记录不改写，未授权提交。

2026-10-03：Task 已标记 completed，等待归档。

2026-10-03：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：5b4453d9b7f281233ed1f2e51f64968d7aa84fbe73ef93a29de4a6b321f12c93
