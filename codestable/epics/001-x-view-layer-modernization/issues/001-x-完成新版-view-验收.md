---
kind: issue
title: 完成新版 View 验收
type: refactor
status: closed
created: 2026-09-26
---

# 完成新版 View 验收

## 做成以后是什么样

新版 View 在当前 PHP 8.1.34 / Laravel 10.50.3 环境完成本事项范围：内建页面及 compat 内容使用唯一新版 renderer，能力矩阵和自动化门禁有对应证据，发布 promotion 仍由 M11 状态单独管理。旧整页 View、Bootstrap/AdminLTE 不能重新进入核心运行时。

本事项只处理实现剩余缺口、当前环境回归证据、自动化无障碍验收与证据状态同步；不发布、不推送。其它 PHP/Laravel 版本组合不属于本次验收。

## 当前依据

2026-09-27 用户再次确认最终目标：全面去除以 Bootstrap 为基础的旧 View 层，所有功能必须由新版 View 或新版 runtime 内的 compat island 承载；不需要旧版整页 renderer、classic fallback 或 renderer 回退。遇到旧功能不适配时，修复为新版可用，不能通过恢复旧 UI 规避问题。

本轮 Review 发现并确认的待修范围为：PJAX 目标脚本加载失败后的原页面恢复与状态一致性、React island 首次成功后再次渲染失败的 compat 恢复、CSP nonce 对页面 bootstrap/Asset 输出的完整传播、`diagnostics: null` 默认值、核心 telemetry 的敏感输入脱敏、扩展文档中已删除 renderer 开关的漂移，以及当前 coverage/contract 指纹与 release 状态的同步。以上均属于新版 View 的可靠性、信息安全性、兼容性或可维护性，不引入旧 View 回退。

2026-09-26 的自动化记录显示历史版本曾通过 `modern:verify`、官方 Demo 81 页、49 个 Controller、33 个菜单入口、五视口浏览器合同和包版本回退演练。该历史证据不自动覆盖本轮代码/契约变化；本轮已重新生成 coverage/dependency census、修正 UI/UX 指纹，并通过当前本地 `modern:verify`。旧版整页回退和其它 PHP/Laravel 组合仍不属于本次目标。

本轮范围决策：以当前 checkout 的新版 runtime 回归、PHP focused tests、静态契约和构建门禁作为完成本事项的证据；历史 Demo/浏览器证据仅作为参考。能力矩阵和发布状态按当前实际证据同步，不恢复旧 renderer。

用户随后决定删除本目标中所有需要人工验证的内容。原先的人工屏幕阅读顺序和浏览器 UI 200% 缩放不再是发布门禁；保留可自动判定的语义 DOM 顺序、键盘/焦点与 200% 重排和溢出检查。设备仿真证据只证明其实际检查的布局条件，不写成浏览器 UI 缩放或真人读屏通过。

覆盖清单的 `browserTestId` 原先仅由 generator 填写，四个 fixture 路由未出现在 Demo crawl。已将扩展、Tree、HasMany 改为 Demo 实际路由，登录页由 `authCycle` 单独验证；最新 81 页浏览器回归对 296 条可见映射的路由与页面族交互交叉核对通过，缺失数为 0。页面族见证不等于每个源码分支都逐条执行，能力晋升仍需其余门禁。

新增的自动 axe 范围已在当前 Laravel 10 compat advanced Form 发现动态 KeyValue/List 输入缺名称、Select2 多选列表缺语义。修复必须保持动态行的字段名、值和提交载荷不变，再用相同浏览器门禁复测。

上述表单问题已通过模板和 Select2 初始化补齐；独立 compat Form axe 无 violation，动态新增行的可访问名称与 `form-advanced-compat` 浏览器合同通过。全套无障碍、顺序和 195px 重排自动门禁均已通过。

200% 半宽 CSS 视口代理已执行六页面族乘五个规定视口的 30 个案例；24 个通过，390px 来源视口对应 195px 时六类均有 shell 横向溢出，Tree 还有控件出界。自动阅读顺序和真实 Tab 遍历的六个代表族通过。修复窄宽布局后重跑同一门禁，不能用扩大测试视口消除失败。

窄宽 shell 换行与 Tree 局部滚动修复后，原 30 个重排案例全部通过；Tree 最右操作聚焦后可在自身容器内滚动到可见区域。完整现代浏览器合同也已通过，含十类页面 axe、六类语义 DOM/Tab 顺序、25 个布局捕获；能力晋升仍以最终证据核对和独立审查为准。

自动化证据复核：历史 PHP 8.1.34 / Laravel 10.50.3 记录包含 `modern:verify`、完整 Chrome 合同和官方 Demo 见证。本轮当前 checkout 的 `modern:verify` 通过 16 个文件/113 项测试，PHP focused tests 为 20 tests/117 assertions，静态门禁、构建、artifact budget、Bootstrap absence 和 Task scan 通过。14 项能力与 M11 状态已按本轮完成范围同步，Epic 收尾另按授权执行。

原执行账本 `codestable/tasks/archived/2026-09-26-003-complete-modern-view-validation.md` 因上述目标变更在实施前取消；新账本已归档为 `codestable/tasks/archived/2026-09-26-004-complete-modern-view-automated-validation.md`，自动化验收和状态回写已完成。

## 推进与验证

1. 核对当前代码、能力矩阵和发布门禁，找出仍需实现或修复的具体缺口；保留历史证据，只在输入或契约变化时重跑受影响的本地门禁。
2. 修复新版 runtime 的失败恢复、安全契约和文档/状态漂移，并用针对性前端、PHP 和静态检查确认结果。
3. 以 `npm run modern:verify`、当前 PHP 8.1.34 / Laravel 10.50.3 的 focused tests 和 `codestable` Task scan 完成本轮自动化验收。
4. 保持能力状态和发布状态与证据强度一致：不恢复旧 renderer、不发布；稳定事实同步到 Project Spec，Epic 按授权收尾。

验证入口：`npm run modern:verify`、当前 Laravel 10 环境中的代表性 Feature 测试、PHP focused tests、静态门禁和 `codestable` Task scan。历史 Demo/浏览器证据仅作为背景索引。

## 结果

本轮 Review 发现的新版 runtime、安全契约、文档和验收状态问题已修复。`npm run modern:verify`、PHP focused tests、静态门禁和 Task scan 已通过；本事项已具备收尾条件，Epic 按授权关闭。旧 Bootstrap/AdminLTE renderer、整页回退和相关开关未恢复。

本轮执行账本已归档：`codestable/tasks/archived/2026-09-28-001-repair-modern-view-review-findings.md`。

## 关闭结论

本事项已完成并关闭。新版 View runtime 的失败恢复、CSP nonce、diagnostics 默认值、telemetry 脱敏、扩展文档和验收状态同步均已处理；`npm run modern:verify`、PHP focused tests、静态门禁、构建、artifact budget 和 Task scan 通过。稳定事实已回写到 `codestable/spec/index.md` 与 `codestable/spec/view-layer/index.md`。旧 Bootstrap/AdminLTE renderer、整页回退和 renderer 开关未恢复；发布候选、verified commit、发布和 push 仍由独立状态与授权管理。
