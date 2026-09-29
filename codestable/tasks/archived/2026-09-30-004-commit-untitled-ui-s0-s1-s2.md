---
doc_type: task-list
task: commit-untitled-ui-s0-s1-s2
goal: 提交 Epic 002 的 S0/S1/S2 成果，并修复 preflight 门禁自身会改坏工作区的两个缺陷
status: archived
workflow: design
owner_skill: cs
created: 2026-09-30
updated: 2026-09-30
archived: 2026-09-30
related_docs:
  - codestable/epics/002-o-untitled-ui-react-adoption/spec.md
  - codestable/epics/002-o-untitled-ui-react-adoption/issues/002-o-tailwind-v4-接入与-preflight-影响穿刺.md
---

# 提交 Epic 002 的 S0/S1/S2 成果，并修复 preflight 门禁自身会改坏工作区的两个缺陷

## 1. 任务目标

提交 Epic 002 的 S0/S1/S2 成果，并修复 preflight 门禁自身会改坏工作区的两个缺陷

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 修复 preflight 基线构建写入发布目录的问题，改为临时输出目录
- [x] 为 preflight 增加陈旧标记守卫与 SIGINT/SIGTERM 恢复
- [x] 单次跑通 modern:verify 全链并确认产物与 census 一致
- [x] 按单主题提交并把结果回写 Epic Spec 与 S1 Issue

## 4. CodeStable 文档索引

- `codestable/epics/002-o-untitled-ui-react-adoption/spec.md`
- `codestable/epics/002-o-untitled-ui-react-adoption/issues/002-o-tailwind-v4-接入与-preflight-影响穿刺.md`

## 5. 执行步骤

### 1. 修复 preflight 基线构建写入发布目录的问题，改为临时输出目录

- 状态：done

### 2. 为 preflight 增加陈旧标记守卫与 SIGINT/SIGTERM 恢复

- 状态：done

### 3. 单次跑通 modern:verify 全链并确认产物与 census 一致

- 状态：done

### 4. 按单主题提交并把结果回写 Epic Spec 与 S1 Issue

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-09-30：Task 已创建。

2026-09-30：完成。提交 `e363d118`「迁移 View 组件层到 Untitled UI React 与 Tailwind v4」，107 文件（含 69 个 vendor 源文件与 5 个 codestable 正本），13609 insertions / 75 deletions；提交后 `git status --short` 为空。

本批同时修复了 preflight 门禁自身的两个缺陷（详见 S1 Issue 执行记录）：

1. **基线构建会改坏发布目录**：`buildWithoutTailwind()` 原先直接 `vite build`，而 `vite.config.mts` 的 `emptyOutDir: true` 会清空 `resources/dist/modern/`，删除非 Vite 产物 `THIRD_PARTY_NOTICES.txt`。已改为输出到临时目录并在 `finally` 清理。
2. **SIGKILL 留下中间态**：恢复依赖 `finally`，被强杀时会把 `resources/modern/index.tsx` 留在「Tailwind 入口被注释」的状态，导致后续 `modern:verify` 静默构建出不含 Tailwind 的 CSS（实测退回 111250 gzip），census 也会记录错误哈希。已增加入口陈旧标记守卫与 `SIGINT`/`SIGTERM` 恢复处理器。

过程教训（已计入本 Task 记录）：我在排障时并发启动了多个 `modern:verify`，又与一个仍在运行的 preflight 相互覆盖，造成 census 与产物短暂不一致；期间还两次用 `pkill -f` 误杀自身 shell。最终以「清理全部相关进程 → 恢复入口 → 单次 build → 单次 verify」的顺序收敛。

验证：`npm run modern:verify` 退出码 0，13 道门禁全过（coverage 303/296/870、grid 28/36/22、form 68、tokens 43、baseline、vendor 69、php-static、bootstrap-absence、typecheck、Vitest 113、build、artifact JS 98131 + CSS 31865 = 129996 gzip、Chrome self-test、preflight 30 探针 0 差异）。

2026-09-30：Task 已标记 completed，等待归档。

2026-09-30：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：a8de2cfdf84d78af68956b1665c91890edbf5d8846c5c5c93768a878ff9b92de
