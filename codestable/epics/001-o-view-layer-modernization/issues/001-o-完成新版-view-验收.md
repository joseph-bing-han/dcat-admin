---
kind: issue
title: 完成新版 View 验收
type: refactor
status: open
created: 2026-09-26
---

# 完成新版 View 验收

## 做成以后是什么样

新版 View 在当前 PHP 8.1.34 / Laravel 10.50.3 环境达到 Epic 的完成定义：内建页面及 compat 内容使用唯一新版 renderer，官方能力有足够证据晋升为 `verified`，自动化发布门禁无未验证项。旧整页 View、Bootstrap/AdminLTE 不能重新进入核心运行时。

本事项只处理实现剩余缺口、当前环境回归证据、自动化无障碍验收与证据状态同步；不发布、不推送，也不自行关闭 Epic。其它 PHP/Laravel 版本组合不属于本次验收。

## 当前依据

2026-09-26 的自动化记录显示 `modern:verify`、官方 Demo 81 页、49 个 Controller、33 个菜单入口、五视口浏览器合同和包版本回退演练通过。能力矩阵已在验证提交 `8cf28129003b876a87497b55c078cdcb8f56f5f6` 上将 14 项能力晋升为 `verified`，M11 已进入 `release-candidate`；Epic 仍保持 open，未执行发布或关闭。代表性旧功能回归在 SQLite 下完成 30 个断言后因 Laravel 10 回滚失败；已配置的 MySQL 测试连接返回 SQLSTATE 1045。

用户随后决定删除本目标中所有需要人工验证的内容。原先的人工屏幕阅读顺序和浏览器 UI 200% 缩放不再是发布门禁；保留可自动判定的语义 DOM 顺序、键盘/焦点与 200% 重排和溢出检查。设备仿真证据只证明其实际检查的布局条件，不写成浏览器 UI 缩放或真人读屏通过。

覆盖清单的 `browserTestId` 原先仅由 generator 填写，四个 fixture 路由未出现在 Demo crawl。已将扩展、Tree、HasMany 改为 Demo 实际路由，登录页由 `authCycle` 单独验证；最新 81 页浏览器回归对 296 条可见映射的路由与页面族交互交叉核对通过，缺失数为 0。页面族见证不等于每个源码分支都逐条执行，能力晋升仍需其余门禁。

新增的自动 axe 范围已在当前 Laravel 10 compat advanced Form 发现动态 KeyValue/List 输入缺名称、Select2 多选列表缺语义。修复必须保持动态行的字段名、值和提交载荷不变，再用相同浏览器门禁复测。

上述表单问题已通过模板和 Select2 初始化补齐；独立 compat Form axe 无 violation，动态新增行的可访问名称与 `form-advanced-compat` 浏览器合同通过。全套无障碍、顺序和 195px 重排自动门禁均已通过。

200% 半宽 CSS 视口代理已执行六页面族乘五个规定视口的 30 个案例；24 个通过，390px 来源视口对应 195px 时六类均有 shell 横向溢出，Tree 还有控件出界。自动阅读顺序和真实 Tab 遍历的六个代表族通过。修复窄宽布局后重跑同一门禁，不能用扩大测试视口消除失败。

窄宽 shell 换行与 Tree 局部滚动修复后，原 30 个重排案例全部通过；Tree 最右操作聚焦后可在自身容器内滚动到可见区域。完整现代浏览器合同也已通过，含十类页面 axe、六类语义 DOM/Tab 顺序、25 个布局捕获；能力晋升仍以最终证据核对和独立审查为准。

自动化证据复核：当前 PHP 8.1.34 / Laravel 10.50.3 下，`modern:verify` 通过 16 个文件/107 项测试，隔离 SQLite 的 Install/Section 回归通过 6 tests/30 assertions。完整 Chrome 合同通过 10 类 axe、6 类语义顺序/真实 Tab、30/30 半宽 CSS 视口重排案例；官方 Demo 通过 81 页、30 组响应式、27 项交互与 296 条可见映射，registry findings=0。异常页见证绑定现代报告并校验时间、环境与产物新鲜度。独立复审未发现阻断。当前仅剩发布清单要求的 verified commit；在取得提交授权和提交证据前，14 项能力保持 `experimental`，M11 保持 `not-release-candidate`，Epic 保持 open。

原执行账本 `codestable/tasks/archived/2026-09-26-003-complete-modern-view-validation.md` 因上述目标变更在实施前取消；新账本已归档为 `codestable/tasks/archived/2026-09-26-004-complete-modern-view-automated-validation.md`，自动化验收和状态回写已完成。

## 推进与验证

1. 核对当前代码、能力矩阵和发布门禁，找出仍需实现或修复的具体缺口；保留已有可靠自动化证据，只在输入或契约变化时重跑受影响门禁。
2. 在隔离的当前版本消费者中运行代表性旧功能回归，修复属于本项目测试生命周期或 View 契约的问题，并通过完整测试退出状态确认结果。
3. 让语义 DOM 顺序、键盘/焦点及 200% 重排和溢出由自动浏览器门禁判定，记录所用仿真条件与结果；删除当前有效规格和发布清单中的人工验收要求。
4. 审核证据与完成条件，只有所有门禁真实通过才晋升能力状态及发布就绪状态；否则保持未通过状态并记录准确阻塞与恢复动作。完成的稳定事实同步到 Epic，Epic 的关闭另按授权处理。

验证入口：`npm run modern:verify`、当前 Laravel 10 消费者中的代表性 Feature 测试、官方 Demo 与自动化浏览器合同报告，以及 `codestable` Task scan。任何测试失败都不能以已执行的断言数代替通过。

## 结果

本事项的自动化实现和当前环境验收已完成。14 项能力由 `experimental` 晋升为 `verified`，对应验证提交为 `8cf28129003b876a87497b55c078cdcb8f56f5f6`；M11 为 `release-candidate`。本事项、Epic 关闭和发布动作仍分别遵守授权边界，当前未关闭 Epic、未发布、未推送。
