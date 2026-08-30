<?php

use Dcat\Admin\Admin;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Route;

Admin::routes();

Route::group([
    'prefix'     => config('admin.route.prefix'),
    'namespace'  => config('admin.route.namespace'),
    'middleware' => config('admin.route.middleware'),
], function (Router $router) {
    $router->get('/', 'HomeController@index');
});

Route::group([
    'prefix'     => config('admin.route.prefix'),
    'namespace'  => 'Tests\Controllers',
    'middleware' => ['web', 'admin'],
], function (Router $router) {
    $router->get('tests/view-upgrade/extension.js', 'ViewUpgradeController@extensionScript');
    $router->get('tests/view-upgrade/descriptors', 'ViewUpgradeController@descriptors');
    $router->get('tests/view-upgrade/{fixture}', 'ViewUpgradeController@show');
    $router->get('tests/view-baseline/vertical', 'ViewBaselineController@vertical');
    $router->get('tests/view-baseline/horizontal', 'ViewBaselineController@horizontal');
    $router->get('tests/view-baseline/full-page', 'ViewBaselineController@fullPage');
    $router->get('tests/view-baseline/pjax-disabled', 'ViewBaselineController@pjaxDisabled');
    $router->get('tests/view-baseline/custom-pjax', 'ViewBaselineController@customPjax');
    $router->get('tests/view-baseline/modern-vertical', 'ViewBaselineController@modernVertical');
    $router->get('tests/view-baseline/modern-horizontal', 'ViewBaselineController@modernHorizontal');
    $router->get('tests/view-baseline/modern-collapsed', 'ViewBaselineController@modernCollapsed');
    $router->get('tests/view-baseline/modern-floating-navbar', 'ViewBaselineController@modernFloatingNavbar');
    $router->get('tests/view-baseline/modern-hidden-navbar', 'ViewBaselineController@modernHiddenNavbar');
    $router->get('tests/view-baseline/modern-full-page', 'ViewBaselineController@modernFullPage');
    $router->get('tests/view-baseline/grid', 'ViewBaselineController@grid');
    $router->get('tests/view-baseline/form', 'ViewBaselineController@form');
    $router->get('tests/view-baseline/modern-grid', 'ViewBaselineController@modernGrid');
    $router->get('tests/view-baseline/modern-grid-interactions', 'ViewBaselineController@modernGridInteractions');
    $router->get('tests/view-baseline/modern-grid-filter-matrix', 'ViewBaselineController@modernGridFilterMatrix');
    $router->get('tests/view-baseline/modern-grid-compat-displayers', 'ViewBaselineController@modernGridCompatDisplayers');
    $router->get('tests/view-baseline/modern-runtime-shell', 'ViewBaselineController@modernRuntimeShell');
    $router->get('tests/view-baseline/modern-runtime-form', 'ViewBaselineController@modernRuntimeForm');
    $router->get('tests/view-baseline/modern-runtime-grid', 'ViewBaselineController@modernRuntimeGrid');
    $router->get('tests/view-baseline/modern-grid-action-matrix', 'ViewBaselineController@modernGridActionMatrix');
    $router->get('tests/view-baseline/modern-grid-displayers', 'ViewBaselineController@modernGridDisplayers');
    $router->get('tests/view-baseline/modern-form-basic', 'ViewBaselineController@modernFormBasic');
    $router->get('tests/view-baseline/modern-form-layout', 'ViewBaselineController@modernFormLayout');
    $router->get('tests/view-baseline/modern-form-advanced-native', 'ViewBaselineController@modernFormAdvancedNative');
    $router->get('tests/view-baseline/modern-form-advanced-vendor', 'ViewBaselineController@modernFormAdvancedVendor');
    $router->get('tests/view-baseline/modern-form-advanced-compat', 'ViewBaselineController@modernFormAdvancedCompat');
    $router->get('tests/view-baseline/modern-form-advanced-optional', 'ViewBaselineController@modernFormAdvancedOptional');
    $router->get('tests/view-baseline/modern-form-load-options', 'ViewBaselineController@modernFormLoadOptions');
    $router->match(['post', 'put'], 'tests/view-baseline/modern-form-probe', 'ViewBaselineController@modernFormProbe');
    $router->get('tests/view-baseline/modern-form', 'ViewBaselineController@modernForm');
    $router->get('tests/view-baseline/modern-show', 'ViewBaselineController@modernShow');
    $router->get('tests/view-baseline/modern-show-native', 'ViewBaselineController@modernShowNative');
    $router->get('tests/view-baseline/modern-show-resource', 'ViewBaselineController@modernShowResource');
    $router->get('tests/view-baseline/modern-show-resource/{id}/edit', 'ViewBaselineController@modernShowEdit');
    $router->delete('tests/view-baseline/modern-show-resource/{id}', 'ViewBaselineController@modernShowDelete');
    $router->get('tests/view-baseline/modern-tree', 'ViewBaselineController@modernTree');
    $router->get('tests/view-baseline/modern-tree-native', 'ViewBaselineController@modernTreeNative');
    $router->post('tests/view-baseline/modern-tree-native', 'ViewBaselineController@modernTreeNativeSave');
    $router->get('tests/view-baseline/modern-widget', 'ViewBaselineController@modernWidget');
    $router->get('tests/view-baseline/modern-system', 'ViewBaselineController@modernSystem');
    $router->get('tests/view-baseline/modern-system-exception', 'ViewBaselineController@modernSystemException');
    $router->get('tests/view-baseline/rollback-global', 'ViewBaselineController@rollbackGlobal');
    $router->get('tests/view-baseline/rollback-family', 'ViewBaselineController@rollbackFamily');
    $router->get('tests/view-baseline/rollback-capability', 'ViewBaselineController@rollbackCapability');
    $router->get('tests/view-baseline/rollback-route', 'ViewBaselineController@rollbackRoute');

    $router->resource('tests/users', UserController::class);
    $router->resource('tests/report', ReportController::class);
    $router->resource('tests/painters', PainterController::class);
});

Route::group([
    'prefix'     => config('admin.route.prefix'),
    'namespace'  => 'Tests\Controllers',
    'middleware' => ['web'],
], function (Router $router) {
    $router->get('tests/view-baseline/modern-login', 'ViewBaselineController@modernLogin');
});
