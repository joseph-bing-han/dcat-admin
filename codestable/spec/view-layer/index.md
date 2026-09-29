# 当前 View 层

> **图示状态：当前。** 本文只记录已经成立的 View 层真相，不包含现代化目标。

> **当前事实（2026-09-28）：** Admin 页面由新版 View runtime 接管。manifest 有效时使用 native React View；native 不适用或 manifest 缺失时使用 Dcat-owned compat shell/island。旧版 Bootstrap/AdminLTE 整页 renderer、renderer 开关和 classic 回退已从当前实现中移除。兼容契约保留 PHP Controller/API、HTTP/表单协议和登记的稳定锚点，不承诺旧版整页 View、任意 Bootstrap class 或私有 DOM 等价。View 现代化 Epic 已关闭；发布候选与 Git 提交仍按独立授权和状态记录管理。

验证范围按用户 2026-09-26 的决定限定为当前实际使用的 PHP/Laravel 版本，本轮是官方 Demo 的 PHP 8.1.34 / Laravel 10.50.3。不要求验证其它版本组合；旧多版本矩阵仅作历史参考，不能将单环境证据写成其它版本已通过。

项目已按用户要求移除 `.github` 与 workflow 草案；View 验收通过本地脚本执行，不依赖 GitHub Actions。

## 页面怎样产生

Dcat Admin 不是独立 SPA。应用控制器使用 `Content`、`Grid`、`Form`、`Show`、`Tree` 和 Widgets 等 PHP API 组织页面；新版 ViewModel/payload adapter 将内建语义交给 Modern runtime。自定义 Blade、Renderable 和扩展内容通过明确的 compat island 显示在新版页面中。

```text
Laravel route/controller
        |
        v
PHP page builders -> ViewModel / payload adapters
        |
        v
Modern View runtime / PJAX
        |
        +------> Native React View
        |
        v
 Dcat-owned compat islands
        |
        +------> custom Blade / Renderable / plugin nodes
        |
        v
Browser-visible modern admin page
```

新版 runtime 始终拥有页面 renderer；PJAX 请求只返回内容片段及本页增量资源。`Admin::resolveHtml()` 从 Controller/Renderable 输出中提取 `link`、`style`、`script` 和 `template`，交给统一资源和初始化生命周期。compat island 是新版页面中的内容边界，不是完整旧 View。

## 稳定布局

桌面端使用左侧导航、顶部导航、内容标题与面包屑、主内容、页脚的固定信息架构。默认展开侧栏宽度为 260px；折叠侧栏、水平菜单、顶部导航 sticky/floating/hidden、浅色/深色/主色侧栏和 full-page 均是现有配置形态。

```text
+----------------------+-----------------------------------------------+
| Logo / brand         | Top navigation and user actions               |
+----------------------+-----------------------------------------------+
|                      | Page title / description      Breadcrumbs     |
| Sidebar navigation   +-----------------------------------------------+
|                      | Alerts / exceptions                            |
|                      |                                               |
|                      | Main content: Grid / Form / Show / custom     |
|                      |                                               |
+----------------------+-----------------------------------------------+
|                      | Footer                                        |
+----------------------+-----------------------------------------------+
```

稳定关系是区域位置、层级、导航方向和动作顺序，不代表 Bootstrap 的每个偶然像素都成为永久设计目标。

## 兼容面

### 服务端使用面

- `Content` 的标题、描述、面包屑、行、列、full-page 与自定义 view。
- `Grid` 的列、筛选、搜索、选择、分页、导出、行/批量动作、快捷创建、树表和自定义 displayer。
- `Form` 的字段、验证、布局、Tab、嵌套关系、上传、编辑器、异步提交和自定义 view。
- `Show`、`Tree`、Widgets、Renderable、Blade view 覆盖与扩展注册。
- `Admin::css/js/headerJs/script/style/html/requireAssets/view` 及资源别名。
- Section 插入点、Navbar/Menu 自定义内容、主题色、翻译和多应用配置。

### 浏览器使用面

- `.wrapper`、sidebar、navbar、`.content-wrapper#pjax-container`、`#app` 等页面锚点。
- `Dcat.boot()`、`Dcat.ready/init/wait`、PJAX 事件和 jQuery 插件生命周期。
- `data-action`、`pjax-container`、表单 `name/id`、Grid 查询参数及现有 Dusk/扩展使用的关键选择器。
- Dcat-owned resource alias/facade、`@pjax`、`@select2` 等登记入口和发布路径；不得加载旧版整页 renderer 或 Bootstrap/AdminLTE runtime。

任意扩展可能依赖未文档化的内部 DOM。此类内容可以留在新版 compat island；未知内部选择器和旧版整页布局不属于稳定契约，也不提供旧 renderer 回退。

## 当前规模与验证证据

- B11 当前源码盘点为 140 个 Blade、821 个受盘点资源文件；旧 AdminLTE 与 Bootstrap 源码/编译目录已从 core 移除，包仍发布 modern 和 modern-compat 产物及 Dcat facade。
- 官方 Demo 基线记录了 81 个可达页面、33 个活动菜单入口；完整新版 View crawl 已在 [已归档执行记录](../../tasks/archived/2026-09-26-002-modern-view-single-renderer-demo-coverage.md) 中完成并按维护者决定收尾。
- 历史 PHP 8.1.34 / Laravel 10.50.3 证据包含资源发布、`modern:verify`、五视口浏览器合同、Demo 全路由 crawl、10 类 axe 页面、6 类语义 DOM/Tab 顺序和 30 个半宽 CSS 视口重排案例；代表性旧功能回归在隔离 SQLite 下通过 6 tests/30 assertions。Demo 覆盖 81 页、49 个 Controller、33 个活动菜单、30 组响应式和 27 项交互，296 条可见 registry 映射均有见证。2026-09-27 Review 修复后，当前 checkout 的 `modern:verify` 通过 16 个文件/113 项 Vitest 测试，PHP focused tests、PHP/Blade 静态检查、Bootstrap absence、构建和 artifact budget 通过。14 项能力的实现与状态记录已同步，Epic 已关闭；发布候选与 verified commit 仍按 M11 状态管理。其它 PHP/Laravel 组合已排除在验收范围外。历史证据见 [当前环境验证记录](../../epics/001-x-view-layer-modernization/m11-demo-laravel10-validation.json)、`artifacts/view-modernization-browser/2026-09-26-automated/` 与 `artifacts/dcat-admin-demo/2026-09-26-demo-witness-freshness-final/`。

历史 classic 基线仅作为对照证据；后续验证不要求部署旧 View，而以新版 native/compat 行为、稳定后端契约和 Demo 页面覆盖为准。

## 证据索引

- `src/AdminServiceProvider.php`：View namespace、服务注册与资源发布。
- `src/Layout/Content.php`：页面内容构建与布局配置。
- `src/Layout/Asset.php`、`src/Traits/HasAssets.php`、`src/Traits/HasHtml.php`：资源、内联代码与 HTML 解析协议。
- `resources/views/layouts/`、`resources/views/partials/`：页面骨架和稳定插入点。
- `resources/modern/`：新版 View、bridge、native/compat runtime 与样式。
- `scripts/view-modernization-bootstrap-absence.js`、`package.json`：旧 UI 依赖门禁与构建/验证入口。
- `tests/Browser/`：已有浏览器行为证据及选择器依赖。
