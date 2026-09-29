---
kind: issue
title: 提交 View 现代化收尾改动
type: ff
status: closed
created: 2026-09-30
---

# 提交 View 现代化收尾改动

> **读者：** 以后搜到这条时——「改了啥、怎么信、动没动制度记忆」。
> **自检（四答）：** 做了什么 · 改了哪些文件 · 怎么验证 · 对 `codestable/` 有无影响。

---

把已经完成、并且已在当前工作树通过 `npm run modern:verify` 的 View 现代化收尾（Review 修复、Epic 关闭与目录改名、资源重发）作为单主题提交落盘，让 HEAD 等于被验证的那份代码；本次不改运行时实现。

- 做了什么：核对并冻结了 58 个已跟踪改动（28 修改 / 18 重命名 / 10 重命名并修改 / 1 删除）和 4 个未跟踪文件（2 份已完成的 Task 正本、新构建的 `dcat-modern-BEp4lTJ1.js`、本 `ff`），做敏感内容扫描后按单个主题提交。
- 改了哪些：`src/Modern/Manager.php`、`src/Layout/Asset.php`、`resources/views/layouts/{container,full-page}.blade.php`、`resources/modern/{bridge,navigation}.ts(x)` 与其测试、`scripts/view-modernization-*.js|mjs`、`docs/modern-view-*.md`、`tests/Feature/*`、`codestable/epics/001-x-view-layer-modernization/**`（含 `001-o-` → `001-x-` 重命名）、`resources/dist/**` 与两份 Task 正本。
- 怎么验证：提交前在同一文件树跑 `npm run modern:verify` 退出码 0（coverage 303/296/870、grid 28/36/22、form 68、tokens 43、baseline 140 Blade/821 assets、php-static、bootstrap-absence、typecheck、Vitest 16 files/113 tests、build、artifact 111250 gzip ≤ 143360、Chrome self-test）；提交后用 `git status --short` 与 `git show --stat HEAD` 核对范围。本 `ff` 的结果回写发生在提交之后，因此文件内不记录提交哈希，提交内容以收尾汇报为准。
- codestable：已把 Epic 目录重命名和两份 Task 正本落盘，没有新增稳定事实（Project Spec 已描述唯一 renderer 与 compat 兼容面，本次不改行为）。已知漂移：`m11-release-status.json` 与 `implementation-capability-matrix.json` 的 `verifiedCommit` 仍指向未被任何 ref 包含的 `8cf2812`；缺的证据是一次绑定真实提交的 re-verify，复查触发＝下次处理发布候选或能力晋升。
- 沉淀检查：Talk 无（没有未落定议题）/ Note 无（没有新的跨事项坑点）/ Tool 无（没有新的稳定重复流程）/ 无新增。

关联：Task `codestable/tasks/archived/2026-09-30-001-commit-view-modernization-closeout.md`；本文件原名 `codestable/issues/001-o-ff-提交-view-现代化收尾改动.md`。
