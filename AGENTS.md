# Repository Guidelines

本指南适用于 `dcat-admin` 代码库的功能开发、测试和评审。请先确认改动范围，再遵循现有 Laravel 组件和目录约定。

## 项目结构与模块组织

- `src/` 是主 PHP 包，使用 `Dcat\\Admin\\` PSR-4 命名空间；按 `Form`、`Grid`、`Models`、`Http` 等领域组织类。
- `resources/assets/` 存放待编译资源，`resources/views/` 存放 Blade 模板，`resources/dist/` 存放构建后的发布资源。
- `config/` 保存包配置；数据库结构变更必须新增 `database/migrations/` 迁移文件。
- `tests/` 包含 `Feature`、`Browser` 测试、测试模型与资源；`tests/bin/` 保存 Dusk 环境脚本。

## 构建、测试与本地开发

先运行 `composer install` 安装 PHP 依赖。常用命令如下：

- `composer test` 在 `composer.json` 中定义为运行 `vendor/bin/phpunit`，但仓库根目录没有 `phpunit.xml` 或 `phpunit.xml.dist`，因此不能作为有效的默认测试入口；实际测试按下方 `laravel-tests`/Dusk 流程执行。
- `composer phpstan` 执行 `vendor/bin/phpstan analyse`。
- `npm install` 安装前端依赖；`npm run dev` 构建开发资源，`npm run watch` 持续监听，`npm run prod` 构建生产资源。
- Dusk 需按 `.github/workflows/dusk.yml` 准备对应 Laravel 版本的 `laravel-tests` 和 MySQL，再依次运行 `sh tests/bin/install-dep.sh`、`sh tests/bin/install-admin.sh`、`sh tests/bin/start.sh`，最后在 `laravel-tests` 中执行 `php artisan dusk`。

## 编码风格与命名约定

PHP 遵循 Laravel/PSR-4 风格，使用 4 个空格缩进；类名使用 `StudlyCase`，方法和变量使用 `camelCase`。YAML 使用 2 个空格缩进，JavaScript 延续现有 `webpack.mix.js` 风格。`.styleci.yml` 使用 Laravel preset。新增类、配置键和视图文件应采用所在模块已有命名模式。

## 测试指南

测试框架为 PHPUnit，浏览器测试使用 Laravel Dusk。测试文件以 `Test.php` 结尾，测试方法使用 `test...` 前缀。行为变更应补充对应的 `Feature` 或 `Browser` 测试；提交前至少运行受影响的测试，并在环境允许时运行完整套件。仓库未规定固定覆盖率门槛。

## 提交与拉取请求

提交历史未采用 Conventional Commits；请使用简短、明确、祈使式的描述，例如 `修复时间格式`。PR 应说明改动范围、所解决的问题、验证命令及结果；涉及界面或资源时附 UI 截图。不要提交 `vendor/`、`node_modules/`、`laravel-tests/`、构建缓存或任何密钥、令牌和本地环境文件。
