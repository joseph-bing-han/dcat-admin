<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Dcat\Admin\Modern\Manager;
use Dcat\Admin\Modern\Manifest;

// 在真实消费者上加载契约路由，不改应用源码或数据库配置。
$consumer = realpath(getenv('DCAT_CONSUMER_PATH') ?: __DIR__.'/../../laravel-tests');
if (! $consumer || ! is_file($consumer.'/vendor/autoload.php')) {
    http_response_code(500);
    exit('DCAT_CONSUMER_PATH must point to an installed Laravel application.');
}

$uri = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
if ($uri !== '/' && is_file($consumer.'/public'.$uri)) {
    return false;
}

$loader = require $consumer.'/vendor/autoload.php';
$loader->addPsr4('Tests\\', dirname(__DIR__).'/', true);
$app = require $consumer.'/bootstrap/app.php';
$request = Request::capture();
$app->instance('request', $request);
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

// 默认继承消费者的新版 renderer，缺失 manifest 的恢复路径由专门的故障夹具声明。
require dirname(__DIR__).'/routes.php';

// M0 的原始 HTML/API 基线专门验证新版 compat；modern-* 夹具仍使用 native。
$fixturePrefix = rtrim(admin_base_path('tests/view-baseline'), '/').'/';
$compatFixtures = ['vertical', 'horizontal', 'full-page', 'pjax-disabled', 'custom-pjax', 'grid', 'form'];
if (strpos($uri, $fixturePrefix) === 0 && in_array(substr($uri, strlen($fixturePrefix)), $compatFixtures, true)) {
    config(['admin.modern.manifest' => dirname(__DIR__).'/Fixtures/missing-modern-manifest.json']);
    $app->instance('admin.modern', new Manager(new Manifest()));
}

$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);
