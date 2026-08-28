# 当前 View 层

> **图示状态：当前。** 本文只记录已经成立的 View 层真相，不包含现代化目标。

## 页面怎样产生

Dcat Admin 不是独立 SPA。应用控制器使用 `Content`、`Grid`、`Form`、`Show`、`Tree` 和 Widgets 等 PHP API 组织页面，包内 Blade 把对象渲染成 HTML，浏览器端再由全局 Dcat 运行时和按需插件增强行为。

```text
Laravel route/controller
        |
        v
PHP page builders and extension renderables
        |
        v
Blade layout + component templates
        |
        +------> Section / custom Blade / raw HTML injection
        |
        v
Admin asset resolver + Dcat runtime
        |
        +------> AdminLTE / Bootstrap / jQuery / PJAX / plugins
        |
        v
Browser-visible admin page
```

完整页面由布局模板输出；PJAX 请求只返回内容片段及本页增量资源。`Admin::resolveHtml()` 还会从渲染结果中提取 `link`、`style`、`script` 和 `template`，合并到统一资源与初始化生命周期中。

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
- `@adminlte`、`@vendors`、`@dcat`、`@pjax`、`@select2` 等资源别名和发布路径。

任意扩展可能依赖未文档化的内部 DOM。现代渲染器无法证明任意内部选择器都等价，因此完整兼容必须由可选择的旧渲染回退保障，不能只靠新 DOM 模拟。

## 当前规模与验证缺口

- 包内有 139 个 Blade 模板、1077 个资源文件，至少 117 个 PHP/Blade 文件直接注入脚本、样式或运行时资源。
- 现有 Dusk 覆盖登录、首页、菜单、部分 Grid、Form 和上传路径，但明显依赖旧 class 与 jQuery。
- 当前没有布局几何基线、视觉回归、移动端矩阵、React/PJAX 挂载生命周期或新旧渲染等价测试。

这些缺口意味着迁移的第一批必须建立基线和兼容清单，不能直接替换模板。

## 证据索引

- `src/AdminServiceProvider.php`：View namespace、服务注册与资源发布。
- `src/Layout/Content.php`：页面内容构建与布局配置。
- `src/Layout/Asset.php`、`src/Traits/HasAssets.php`、`src/Traits/HasHtml.php`：资源、内联代码与 HTML 解析协议。
- `resources/views/layouts/`、`resources/views/partials/`：页面骨架和稳定插入点。
- `resources/assets/dcat/js/`：Dcat 与 PJAX 生命周期。
- `webpack.mix.js`、`package.json`：当前构建链。
- `tests/Browser/`：已有浏览器行为证据及选择器依赖。
