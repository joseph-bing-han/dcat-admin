<?php

use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Route;

Route::group([
    'prefix' => config('admin.route.prefix'),
    'namespace' => 'Tests\Controllers',
    'middleware' => config('admin.route.middleware'),
], function (Router $router) {
    $router->get('tests/view-baseline/modern-widget', 'ViewBaselineController@modernWidget');
    $router->get('tests/view-baseline/modern-system', 'ViewBaselineController@modernSystem');
    $router->get('tests/view-baseline/modern-system-exception', 'ViewBaselineController@modernSystemException');
});

Route::group([
    'prefix' => config('admin.route.prefix'),
    'namespace' => 'Tests\Controllers',
    'middleware' => ['web'],
], function (Router $router) {
    $router->get('tests/view-baseline/modern-login', 'ViewBaselineController@modernLogin');
});
