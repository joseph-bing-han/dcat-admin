# Dcat Admin Modern

`joseph-bing-han/laravel-admin` 是基于 Dcat Admin 2.x 持续演进的 Laravel 后台构建工具。当前版本以 **Modern Renderer** 为默认视图层：在保留 Dcat Admin 原有 PHP Builder、Blade、jQuery、PJAX、扩展与 HTTP 行为契约的前提下，引入 React 驱动的现代化 Layout、Grid、Form、Show、Tree、Widget 与系统页面渲染能力。

项目的目标不是推翻原有 Dcat Admin API，而是在兼容既有业务代码和扩展生态的基础上升级视图层。对于不能安全迁移的自定义 DOM、第三方编辑器、上传器、Select2、HasMany、扩展 Blade 等内容，Modern Renderer 会保留原节点并作为 compatibility island（Dcat 自有兼容层）使用。旧版 Bootstrap/AdminLTE 渲染器已移除，不存在切回旧界面的开关。

## 当前技术基线

- PHP `>= 8.0`
- Laravel `8.x / 9.x / 10.x`
- Modern Renderer 是唯一渲染器
- React + TypeScript + Vite 构建的单 IIFE 运行时
- Blade / jQuery / PJAX / Dcat 扩展兼容层
- 生产包内置预编译前端资源，业务项目 **不需要 Node.js**
- 无 Bootstrap / AdminLTE 运行时依赖；旧固定资源路径由 Dcat 兼容 facade 接管

## Modern Renderer

Modern Renderer 覆盖所有 Admin 路由：内建视图走 React 原生实现，无法原生渲染的结构留在 Dcat compat island 中。

主要能力包括：

- **Layout**：菜单、Header、Navbar、Footer、Full Page 等系统布局；需要保持 DOM 身份的根节点采用原位增强。
- **Grid**：表格结构、分页、筛选、搜索、选择、操作、导出和树形能力；既有 HTTP/action 节点保持原契约。
- **Form**：基础表单布局、校验状态与 Tab；实际提交控件仍是原始表单节点。
- **Advanced Form compatibility**：Upload、Editor、Select2、HasMany、嵌套字段等继续运行原插件实例，不克隆活跃 DOM。
- **Show / Tree / Widgets**：标准结构由 modern layer 接管，自定义 formatter、Panel、Nestable 和任意扩展内容按兼容边界保留。
- **System pages**：Login、异常页、权限反馈等支持 modern 生命周期增强，同时保持服务端认证与错误处理协议不变。
- **PJAX lifecycle**：PJAX 替换前自动卸载，加载后重新挂载；compatibility island 会恢复同一个原始节点。
- **兼容降级**：Manifest 缺失时自动使用 Dcat compat 外壳；无法原生渲染的结构进入 compat island，而不是回到旧版 UI。

Modern 浏览器桥接 API 暴露在 `window.DcatReact`，扩展可以注册 `extension.*` 命名空间的 React island，同时必须提供一个可用的 compat fallback。详细说明见 [Modern View Layer](docs/modern-view-layer.md) 和 [Modern View Extension API](docs/modern-view-extensions.md)。

## 默认配置

发布后的 `config/admin.php` 只保留渲染器自身的配置项：

```php
'modern' => [
    'manifest' => null,
    'csp_nonce' => null,
    'telemetry' => true,
    'diagnostics' => null,
],
```

- `manifest` 指向已发布的 modern manifest；为 `null` 时使用包内默认路径。
- `csp_nonce` 为字符串或闭包，用于给注入的 script/link 添加 CSP nonce。
- `telemetry` 控制 `dcat:modern:telemetry` 事件。
- `diagnostics` 控制 compat 迁移诊断告警；`null` 时跟随 `app.debug`。

这里没有启用/禁用开关、路由或能力白名单，也没有强制回退查询参数：新版渲染器是唯一渲染器，无法原生渲染的内容由 compat island 承担。

## 安装

推荐以 Laravel 10 创建新项目：

```bash
composer create-project laravel/laravel:^10.0 my-admin
cd my-admin
```

配置 `.env` 中的数据库连接，然后安装本包：

```bash
composer require joseph-bing-han/laravel-admin
php artisan admin:publish
php artisan admin:install
```

配置 Web Server 的 document root 指向 Laravel 的 `public` 目录。开发环境可以直接启动：

```bash
php artisan serve
```

默认后台地址为：

```text
http://127.0.0.1:8000/admin
```

首次安装的默认管理员账号仍遵循 Dcat Admin 的安装约定。

### 升级已有项目

升级后建议重新发布包资源，并清理 Laravel 缓存：

```bash
php artisan admin:publish --force
php artisan optimize:clear
```

Modern 前端产物已经包含在 Composer 包中；业务项目部署时不需要执行 `npm install` 或 Vite build。

更完整的升级和运维说明见 [Modern View Migration and Operations](docs/modern-view-migration.md)。

## 升级与恢复

旧版 Bootstrap/AdminLTE 渲染器已从 core 包移除，因此不存在按页面、按路由或按请求切回旧界面的能力。升级或发布后的恢复方式：

- 升级后重新发布包资源：`php artisan vendor:publish --tag=dcat-admin-assets --force`
- 清理缓存：`php artisan optimize:clear`
- 如果新版本出现问题，将依赖切换到 Packagist 的 `dcat/laravel-admin:2.2.3-beta`（支持 Laravel 10），并再次重新发布资源

核心包不再包含 Bootstrap/AdminLTE 源码或编译产物；旧固定资源 URL（`adminlte/*`、`dcat/css/dcat-app*`、`dcat/js/dcat-app.js`、`dcat/plugins/vendors*`）仍会解析到 Dcat 自有的兼容 facade，避免硬编码路径直接 404。

这些操作都不需要数据库迁移，也不需要重新编译前端资源。

## 保留的 Dcat Admin 能力

当前版本继续支持 Dcat Admin 的核心开发体验，包括：

- 用户、角色、权限和菜单管理
- Grid / Tree / Show / Form Builder
- 搜索、筛选、分页、排序、批量操作与数据导出
- 异步表单与文件上传
- PJAX 按需资源加载
- 自定义页面与 Full Page
- Section、Renderable、Blade override 和扩展机制
- 多主题与布局配置
- Scaffold 等后台开发工具

原有业务代码不需要为了 Modern Renderer 改写成 React。

## 本分支已有增强

除 Modern Renderer 外，本项目继续保留此前针对实际后台开发体验增加的功能：

- Form 的 `continue_editing` / `continue_creating` 交互改为更明确的“保存并编辑 / 保存并查看”按钮。
- Form Footer 增加“后退”操作。
- Form Footer 支持自定义图标的 IconButton。
- Date / Datetime / Time 字段支持 PHP 本地时间格式，可直接使用 `app.date_format`、`app.datetime_format`、`app.time_format` 等配置。
- Footer 不再展示旧版版本信息。

## 开发与验证

生产使用者不需要 Node.js；只有参与本仓库 Modern Renderer 开发时才需要前端工具链。

```bash
npm ci
npm run modern:verify
```

`modern:verify` 会执行：

- PHP / Blade 静态兼容契约
- TypeScript strict typecheck
- Vitest
- Vite production build
- IIFE / Manifest / CSS scope / bundle budget 校验
- system Chrome browser harness self-test

当前 Modern Renderer 的消费者、浏览器、布局、恢复和可访问性验证设计记录在 `codestable/epics/001-o-view-layer-modernization/`。按维护者决定，仅验证当前 PHP/Laravel 环境，使用本地脚本，不配置 GitHub Actions。

## 兼容性原则

本项目的 Modern Renderer 遵循 compatibility-first 原则：

1. PHP Builder、请求参数、表单字段名、上传协议和既有 HTTP action 是行为权威。
2. 已初始化的第三方插件节点不会被复制成第二个活跃实例。
3. 需要 legacy 节点时移动并恢复同一个 DOM node，而不是复制 HTML。
4. 不支持或无法证明安全的结构进入新版 compat island，不切换到旧版整页 renderer。
5. Modern 运行失败时保留可恢复错误状态；运维可回退到 Packagist `dcat/laravel-admin:2.2.3-beta` 并重发资源，不重放表单写请求。

因此所有页面都由新版 renderer 处理，既有 Blade/jQuery/PJAX 输出和 Dcat 扩展无需一次性重写。

## 项目来源

本项目基于 [jqhph/dcat-admin](https://github.com/jqhph/dcat-admin) 演进，并继续遵循原项目的 MIT License 与生态兼容原则。

感谢 Dcat Admin、Laravel Admin、Laravel、React、AdminLTE、Bootstrap、jQuery 以及原项目所有贡献者。

## License

[MIT License](LICENSE)
