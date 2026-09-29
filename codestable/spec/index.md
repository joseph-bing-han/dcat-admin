# Project Spec

> **当前真相。** Dcat Admin 是面向 Laravel 应用的后台管理开发包，使用 PHP 构建 API 生成页面，并允许应用和扩展注入 Blade、HTML、CSS 与 JavaScript。

## 现在能做什么

使用者通过既有路由进入后台，在固定的顶部导航、侧边导航、内容标题、面包屑、内容区和页脚布局中完成登录、列表查询、筛选、增删改查、详情查看、树形管理、文件上传和扩展管理。页面由服务端 PHP/Blade 生成，浏览器端由唯一的 Modern View runtime 增强：可 native React 化的内容使用 Dcat UI，暂不能 native 化的内容进入 Dcat-owned compat island。

当前 View 层的结构、运行时与扩展契约见 [`view-layer/index.md`](view-layer/index.md)。它回答现有页面怎样生成、哪些兼容面不能破坏，以及修改 View 层前必须先读什么。

## 当前边界

- PHP 最低版本为 `>=8.0`，Laravel 支持范围为 `8` 至 `10`；后端兼容与 CI 仅围绕该支持面维护。
- 现有 PHP 构建 API、路由、请求参数、表单载荷、响应语义、Blade 覆盖和扩展注入能力属于稳定使用面。
- 当前核心 View 产物使用 Vite/React/TypeScript 构建并以预构建资源发布；消费者运行时不需要 Node.js。Bootstrap/AdminLTE 旧整页 renderer、切换开关和 classic fallback 不属于当前实现。
- View 层现代化 Epic 已完成并关闭；稳定运行时事实、兼容边界和验证入口见 [当前 View 层](view-layer/index.md)，设计历史见已关闭 Epic。

## 阅读路径

- 第一次理解现有页面系统：读 [当前 View 层](view-layer/index.md)。
- 理解 View 现代化的设计历史和取舍：读已关闭的 [View 层现代化 Epic](../epics/001-x-view-layer-modernization/spec.md)，再按需读取 UI/UE 与兼容契约。
- 排查历史取舍或执行证据：读对应 Epic Issue；已关闭 Issue 不是当前能力说明的替代品。
