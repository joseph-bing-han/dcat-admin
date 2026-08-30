<?php

namespace Tests\Controllers;

use Dcat\Admin\Admin;
use Dcat\Admin\Layout\Content;

class ViewUpgradeController
{
    public function show(Content $content, $fixture)
    {
        abort_unless(in_array($fixture, ['standard', 'blade', 'extension'], true), 404);
        config(['admin.modern.diagnostics' => true]);
        if (request()->boolean('compat_fallback')) {
            // 新版 compat 是唯一降级路径：manifest 缺失时才使用 Dcat 自有兼容层。
            config(['admin.modern.manifest' => __DIR__.'/missing-modern-manifest.json']);
        }
        view()->addNamespace('upgrade', dirname(__DIR__).'/Fixtures/upgrade/views');
        $legacyApplication = require dirname(__DIR__).'/Fixtures/upgrade/'.$fixture.'.php';

        return $legacyApplication($content);
    }

    public function extensionScript()
    {
        return response('window.upgradeOrder = ["extension"]; Dcat.ready(function () { window.upgradePluginReady = typeof jQuery.fn.modal === "function"; });', 200, ['Content-Type' => 'application/javascript']);
    }

    public function descriptors(Content $content)
    {
        config(['admin.modern.diagnostics' => true]);

        $explicitSurface = Admin::modern()->compat(
            '<div class="carousel private-extension"><button data-toggle="carousel">Legacy carousel</button></div>',
            ['id' => 'upgrade-private-surface', 'mode' => 'compat-jquery']
        );
        $defaultSurface = '<div><button class="btn-unmapped-upgrade" data-toggle="unmapped-upgrade-widget">Legacy control</button>'
            .'<input value="private-upgrade-field-sentinel"><span>private-upgrade-html-sentinel</span></div>';

        return $content->header('Compatibility descriptors')->body(
            $explicitSurface.Admin::modern()->compat($defaultSurface).Admin::modern()->compat($defaultSurface)
        );
    }
}
