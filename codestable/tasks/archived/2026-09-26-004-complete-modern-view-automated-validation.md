---
doc_type: task-list
task: complete-modern-view-automated-validation
goal: 完成当前 PHP/Laravel 环境的新版 View 自动化验收并收束剩余实现缺口
status: archived
workflow: implementation
owner_skill: cs
created: 2026-09-26
updated: 2026-09-26
archived: 2026-09-26
related_docs:
  - codestable/epics/001-o-view-layer-modernization/issues/001-o-完成新版-view-验收.md
  - codestable/epics/001-o-view-layer-modernization/spec.md
  - codestable/epics/001-o-view-layer-modernization/m11-release-status.json
  - codestable/epics/001-o-view-layer-modernization/implementation-capability-matrix.json
  - codestable/tasks/archived/2026-09-26-003-complete-modern-view-validation.md
---

# 完成当前 PHP/Laravel 环境的新版 View 自动化验收并收束剩余实现缺口

## 1. 任务目标

完成当前 PHP/Laravel 环境的新版 View 自动化验收并收束剩余实现缺口

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 核对当前实现与自动化证据，更新 View 验收契约以删除人工门禁
- [x] 修复并通过当前 Laravel 10 消费者的代表性旧功能回归
- [x] 补齐并运行自动化 accessibility tree、键盘焦点与 200% 重排门禁
- [x] 复核完整证据并同步能力矩阵、发布状态和 Epic 结果

## 4. CodeStable 文档索引

- `codestable/epics/001-o-view-layer-modernization/issues/001-o-完成新版-view-验收.md`
- `codestable/epics/001-o-view-layer-modernization/spec.md`
- `codestable/epics/001-o-view-layer-modernization/m11-release-status.json`
- `codestable/epics/001-o-view-layer-modernization/implementation-capability-matrix.json`
- `codestable/tasks/archived/2026-09-26-003-complete-modern-view-validation.md`

## 5. 执行步骤

### 1. 核对当前实现与自动化证据，更新 View 验收契约以删除人工门禁

- 状态：done

### 2. 修复并通过当前 Laravel 10 消费者的代表性旧功能回归

- 状态：done

### 3. 补齐并运行自动化 accessibility tree、键盘焦点与 200% 重排门禁

- 状态：done

### 4. 复核完整证据并同步能力矩阵、发布状态和 Epic 结果

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-09-26：Task 已创建。

2026-09-26：已核对当前证据：旧人工读屏与原生 UI 200% 缩放门禁按用户最新决定取消；现有 axe 仅统一覆盖 Grid/Form/Show/Tree，200% 仅有局部 proxy；Laravel 10 legacy suite 因 SQLite teardown/MySQL 1045 未通过。将分别补自动浏览器门禁和隔离测试生命周期，主代理单写业务契约。

2026-09-26：已同步当前有效 Epic/UI/兼容/Project Spec、发布清单、迁移说明与 M11 机器状态：人工门禁取消，自动 accessibility tree/200% 重排与 legacy regression 保留为 pending。历史浏览器 UI 缩放尝试只作历史记录。当前 JSON 可解析，M0 baseline 通过；能力尚未晋升。

2026-09-26：已修正 coverage registry 中扩展、Tree、HasMany 的 Demo fixture 路由，并在 demo:browser 将 296 个 visible 映射与实际页面和页面族交互结果交叉核对。Laravel10 Demo 全量重跑通过：81 页面、49 Controller、33 菜单、30 响应式、22 交互，registry findings=0；24 外部告警非阻断。legacy SQLite suite 首次 6 tests/30 assertions 通过，正收窄测试清理的隔离库保护。

2026-09-26：Laravel10 代表性旧功能回归已在隔离 SQLite 内存和临时文件两种模式通过，均为 6 tests/30 assertions、退出码 0。tests/CreatesApplication.php 仅在 testing+SQLite 使用 migrate:fresh 清理；文件型 SQLite 未显式 DCAT_TEST_ISOLATED_SQLITE=true 时 boot fail closed，预期退出码 2；生产 migration 和数据库未修改。

2026-09-26：新增浏览器 axe 范围在 Laravel10 compat advanced Form 首次发现 3 个动态 key/value/list 输入无 accessible name，Select2 multiple ul 缺列表语义；已将 Blade 与 select 初始化修复纳入同一 Task，待受影响浏览器门禁复测。自动 browser harness 的 Tab 与 200% 等效覆盖断言仍在收敛，不据当前失败晋升能力。

2026-09-26：自动 accessibility order 门禁已在 6 个代表页面族通过，涵盖真实 Tab 遍历。200% 半宽 CSS viewport proxy 30 案例全部执行，24 通过、390→195px 的 6 案例失败：shell 横向溢出 18px，Tree 局部操作出界。CSS 响应式修复已列入本 Task，门禁保持失败直至复测。完整 axe 仍被 compat Form 的 label/list 违规阻断，待模板修复。

2026-09-26：Compat Form 的 KeyValue/ListField 静态与动态输入已补可访问名称，Select2 multiple rendered ul 已补 list role；Laravel10 view:cache、form-advanced-compat、独立 axe（0 violations）与动态新增行检查通过。完整 --accessibility-only 已通过 axe 与顺序阶段，随后仍在 195px 重排 6 案例失败；下一批只修并复测该布局。

2026-09-26：CSS 修复与资源发布完成：240px 以下 shell navbar 换行/收缩文字、Tree body 局部水平滚动；modern:build、vendor:publish 通过。完整现代浏览器合同通过：25 profile/viewport captures、10 个 axe 页面族、6 个语义 DOM/Tab 顺序族、30 个 200% 半宽重排案例。Demo interactions-only 仍在运行，随后复核。

2026-09-26：覆盖 registry 已再生成（303 inventory、296 visible、870 signals）。Tree 滚动门禁已收紧，发现 Widget 195px 内部溢出后修复窄宽 header；重新构建并 publish 到隔离 fixture，30/30 半宽 CSS 视口重排案例通过。完整浏览器合同与 Demo 行为见证正在复测。

2026-09-26：npm run modern:verify 通过（16 文件/107 Vitest、JS 98059/CSS 12514 gzip bytes）；完整现代浏览器合同通过 25 布局捕获、10 类 axe、6 类顺序/Tab、30/30 半宽 CSS 视口重排。Demo 全量 81 页、49 Controller、33 菜单、30 响应式、27 交互及 296 visible coverage mappings 均通过，0 findings。独立复审要求给现代异常报告加 freshness 门禁，Demo 正按此收尾；能力矩阵继续保持 experimental，发布状态等待 verified commit。

2026-09-26：异常页见证已增加 modern 报告 capturedAt、30 分钟窗口、脚本与 manifest mtime、环境和 pageErrors 检查；最终 Demo 全量报告 artifacts/dcat-admin-demo/2026-09-26-demo-witness-freshness-final/demo-browser-report.json 为 81 页、30 响应式、27 交互、296 visible mappings、0 findings。独立复审无阻断；modernization baseline、PHP static、coverage、JS/PHP 语法、git diff --check 与 Task scan 通过。自动门禁已闭合，verified commit 与能力晋升仍待提交授权。

2026-09-26：Task 状态从 active 变更为 blocked。原因：自动化验收与独立复审已通过；发布清单要求 verified commit 才能晋升能力和 release-candidate。cs 技能禁止未获明确授权自动提交，待用户确认是否创建本地验证提交；Epic 关闭另需授权。

2026-09-26：Task 状态从 blocked 变更为 active。原因：用户已明确授权创建两个本地提交以固定已验证实现、记录验证提交并晋升能力与 M11 状态；继续 Task 第 4 步，不推送、不发布、不关闭 Epic。

2026-09-26：2026-09-26：用户已授权两个本地提交；首个已验证实现提交为 8cf28129003b876a87497b55c078cdcb8f56f5f6，提交后工作树干净。实施矩阵 14 项逐项记录该提交与浏览器证据并晋升 verified，M11 已设 release-candidate；modernization:baseline、modern:php-static、提交对象类型、证据一致性和 git diff --check 通过。接着完成 Task 归档、业务正本最终回写与第二个本地状态提交。

2026-09-26：Task 已标记 completed，等待归档。

2026-09-26：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：729669327153c1fb79fe6e60cd93d2c3f757ce1f6b63a28bad8f4be2cceecc97
