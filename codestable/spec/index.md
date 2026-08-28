# Project Spec

> **当前真相。** Dcat Admin 是面向 Laravel 应用的后台管理开发包，使用 PHP 构建 API 生成页面，并允许应用和扩展注入 Blade、HTML、CSS 与 JavaScript。

## 现在能做什么

使用者通过既有路由进入后台，在固定的顶部导航、侧边导航、内容标题、面包屑、内容区和页脚布局中完成登录、列表查询、筛选、增删改查、详情查看、树形管理、文件上传和扩展管理。页面由服务端 PHP/Blade 生成，浏览器端由 AdminLTE、Bootstrap、jQuery、PJAX 和按需插件共同增强。

当前 View 层的结构、运行时与扩展契约见 [`view-layer/index.md`](view-layer/index.md)。它回答现有页面怎样生成、哪些兼容面不能破坏，以及修改 View 层前必须先读什么。

## 当前边界

- PHP 兼容范围为 `>=7.1`，Laravel 兼容范围为 `5.5` 至 `10`；View 层演进不能迫使使用者升级后端运行环境。
- 现有 PHP 构建 API、路由、请求参数、表单载荷、响应语义、Blade 覆盖和扩展注入能力属于稳定使用面。
- 当前前端构建仍使用 Laravel Mix 4 与 Webpack；React、Vite、TypeScript 尚未成为当前事实。
- View 层现代化是目标变化，不提前写入当前真相。目标、规范与迁移计划见 [现代化 Epic](../epics/001-o-view-layer-modernization/spec.md)。

## 阅读路径

- 第一次理解现有页面系统：读 [当前 View 层](view-layer/index.md)。
- 准备现代化 View 层：先读现代化 Epic，再按当前批次读取 UI/UE 与兼容契约。
- 排查历史取舍或执行证据：读对应 Epic Issue；已关闭 Issue 不是当前能力说明的替代品。
