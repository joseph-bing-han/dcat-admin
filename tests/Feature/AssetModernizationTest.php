<?php

namespace Tests\Feature;

use Dcat\Admin\Layout\Asset;
use Illuminate\Config\Repository;
use Illuminate\Container\Container;
use Illuminate\Http\Request;
use Illuminate\Routing\RouteCollection;
use Illuminate\Routing\UrlGenerator;
use PHPUnit\Framework\TestCase;

class AssetModernizationTest extends TestCase
{
    protected $previousContainer;

    protected $container;

    protected function setUp(): void
    {
        parent::setUp();

        $this->previousContainer = Container::getInstance();
        $this->container = new Container();
        Container::setInstance($this->container);

        $request = Request::create('http://localhost/admin');
        $this->container->instance('request', $request);
        $this->container->instance('url', new UrlGenerator(new RouteCollection(), $request));
        $this->container->instance('config', new Repository([
            'admin' => [
                'assets_server' => null,
                'https' => false,
                'secure' => false,
                'modern' => ['csp_nonce' => null],
            ],
        ]));
        $this->container->instance('admin.color', new class
        {
            public function getName()
            {
                return 'default';
            }
        });

        $this->setModernRuntime(true);
    }

    protected function tearDown(): void
    {
        Container::setInstance($this->previousContainer);

        parent::tearDown();
    }

    public function testModernRequestsMapFrozenCoreBundlePathsToDcatFacades()
    {
        $asset = new Asset();
        $css = 'vendor/dcat-admin/modern/assets/dcat-modern.css';
        $js = 'vendor/dcat-admin/modern-compat/assets/dcat-modern-compat.js';

        foreach ([
            '@admin/adminlte/adminlte.css',
            '/vendor/dcat-admin/adminlte/adminlte-blue-light.css',
            'vendor/dcat-admin/dcat/plugins/vendors-rtl.min.css',
            '@admin/dcat/css/dcat-app.css',
            '/vendor/dcat-admin/dcat/css/dcat-app-blue.css',
            'vendor/dcat-admin/dcat/css/dcat-app-blue-light.css',
            '@admin/dcat/css/dcat-app-green.css',
        ] as $path) {
            $this->assertSame($css, $asset->getRealPath($path));
        }

        foreach ([
            '@admin/adminlte/adminlte.js',
            'vendor/dcat-admin/dcat/plugins/vendors.min.js',
            '@admin/adminlte/adminlte.js?legacy-version=old',
            '@admin/dcat/js/dcat-app.js',
            'vendor/dcat-admin/dcat/js/dcat-app.js?legacy-version=old',
        ] as $path) {
            $this->assertSame($js, $asset->getRealPath($path));
        }

        $this->assertSame(
            'vendor/dcat-admin/dcat/plugins/select/select2.full.min.js',
            $asset->getRealPath('@admin/dcat/plugins/select/select2.full.min.js')
        );
        $this->assertSame(
            'vendor/dcat-admin/dcat/plugins/bootstrap-datetimepicker/bootstrap-datetimepicker.min.js',
            $asset->getRealPath('@admin/dcat/plugins/bootstrap-datetimepicker/bootstrap-datetimepicker.min.js')
        );
    }

    public function testModernAliasesRenderTheCompatRuntimeOnlyOnceAndReuseHeadCss()
    {
        $asset = new Asset();
        $asset->require(['@adminlte', '@vendors']);
        $asset->script('$jQuery("body").modal("hide")');

        $scripts = $asset->jsToHtml();
        $styles = $asset->cssToHtml();

        $this->assertSame(1, substr_count($scripts, 'dcat-modern-compat.js'));
        $this->assertStringNotContainsString('adminlte.js', $scripts);
        $this->assertStringNotContainsString('vendors.min.js', $scripts);
        $this->assertStringNotContainsString('dcat-modern.css', $styles);
        $this->assertStringNotContainsString('adminlte.css', $styles);
        $this->assertStringNotContainsString('vendors.min.css', $styles);
    }

    public function testModernCssRendersWhenGlobalFontsAreDisabled()
    {
        $asset = new Asset();
        $asset->fonts = false;

        $styles = $asset->cssToHtml();

        $this->assertStringContainsString('feather/iconfont.css', $styles);
        $this->assertStringContainsString('font-awesome/css/font-awesome.css', $styles);
    }

    public function testBootstrapFreeCompatSuppressesLegacyDcatAppAliases()
    {
        $this->setModernRuntime(true, true);
        $asset = new Asset();

        foreach ([
            '@admin/dcat/js/dcat-app.js',
            '@admin/dcat/css/dcat-app.css',
            '@admin/dcat/css/dcat-app-blue.css',
            '@admin/dcat/css/dcat-app-blue-light.css',
            '@admin/dcat/css/dcat-app-green.css',
        ] as $path) {
            $this->assertNull($asset->getRealPath($path), $path.' should use the Bootstrap-free compat runtime');
        }
    }

    public function testGeneratedAssetTagsCarryTheConfiguredCspNonce()
    {
        config(['admin.modern.csp_nonce' => 'asset-nonce']);
        $asset = new Asset();
        $asset->require('@toastr');
        $asset->script('window.test = true');
        $asset->style('body { color: red; }');

        $this->assertStringContainsString('nonce="asset-nonce"', $asset->cssToHtml());
        $this->assertStringContainsString('nonce="asset-nonce"', $asset->jsToHtml());
        $this->assertStringContainsString('nonce="asset-nonce"', $asset->scriptToHtml());
        $this->assertStringContainsString('nonce="asset-nonce"', $asset->styleToHtml());
    }

    public function testEveryGeneratedLegacyFacadePathMapsInModernRequests()
    {
        $registry = json_decode((string) file_get_contents(dirname(__DIR__, 2).'/resources/modern/legacy-assets.json'), true);
        $this->assertIsArray($registry);
        $asset = new Asset();

        foreach ($registry['javascript'] as $path) {
            $this->assertSame(
                'vendor/dcat-admin/modern-compat/assets/dcat-modern-compat.js',
                $asset->getRealPath('vendor/dcat-admin/'.$path),
                $path
            );
        }

        foreach ($registry['stylesheets'] as $path) {
            $this->assertSame(
                'vendor/dcat-admin/modern/assets/dcat-modern.css',
                $asset->getRealPath('vendor/dcat-admin/'.$path),
                $path
            );
        }
    }

    public function testRemovedLegacyRuntimeNoLongerKeepsFrozenCoreBundlePaths()
    {
        // 旧版渲染器已删除：即使运行时被模拟为不可用，旧固定路径仍解析到新版
        // facade，不再返回 Bootstrap/AdminLTE 原始 bundle。
        $this->setModernRuntime(false);

        $asset = new Asset();

        $this->assertSame(
            'vendor/dcat-admin/modern/assets/dcat-modern.css',
            $asset->getRealPath('@admin/adminlte/adminlte.css')
        );
        $this->assertSame(
            'vendor/dcat-admin/modern-compat/assets/dcat-modern-compat.js',
            $asset->getRealPath('@admin/dcat/plugins/vendors.min.js')
        );
        $this->assertSame(
            'vendor/dcat-admin/modern/assets/dcat-modern.css',
            $asset->getRealPath('@admin/dcat/css/dcat-app-blue.css')
        );
        $this->assertSame(
            'vendor/dcat-admin/modern-compat/assets/dcat-modern-compat.js',
            $asset->getRealPath('@admin/dcat/js/dcat-app.js')
        );
    }

    public function testNativePluginAliasesDoNotLoadTheCompatRuntimeAfterExpansion()
    {
        $assets = [
            '@moment' => 'moment/moment-with-locales.min.js',
            '@moment-timezone' => 'moment-timezone/moment-timezone-with-data.min.js',
            '@sortable' => 'sortable/Sortable.min.js',
            '@apex-charts' => 'charts/apexcharts.min.js',
            '@tinymce' => 'tinymce/tinymce.min.js',
        ];

        foreach ($assets as $alias => $path) {
            $asset = new Asset();
            $asset->require($alias);
            $scripts = $asset->jsToHtml();

            $this->assertStringContainsString($path, $scripts, $alias.' should keep its own asset');
            $this->assertStringNotContainsString('dcat-modern-compat.js', $scripts, $alias.' should not force the compat runtime');
        }
    }

    public function testOnlyNativeOwnedComponentTogglesSkipCompat()
    {
        $native = new Asset();
        $native->prepareHtml('<div data-dcat-react-component="grid.read"><span class="column-selector"><button data-toggle="dropdown" data-dcat-modern-owned-toggle="1"></button></span></div>');
        $this->assertStringNotContainsString('dcat-modern-compat.js', $native->headerJsToHtml());

        $mixedWithoutDescriptor = new Asset();
        $mixedWithoutDescriptor->prepareHtml('<div data-dcat-react-component="grid.read"><span class="column-selector"><button data-toggle="dropdown" data-dcat-modern-owned-toggle="1"></button></span><div class="custom-cell"><button data-toggle="dropdown"></button></div></div>');
        $this->assertStringContainsString('dcat-modern-compat.js', $mixedWithoutDescriptor->headerJsToHtml());

        $mixedWithDescriptor = new Asset();
        $mixedWithDescriptor->prepareHtml('<div data-dcat-react-component="grid.read"><button data-toggle="dropdown" data-dcat-modern-owned-toggle="1"></button><div data-dcat-compat="compat-jquery"><button data-toggle="modal"></button></div></div>');
        $this->assertStringContainsString('dcat-modern-compat.js', $mixedWithDescriptor->headerJsToHtml());

        $legacy = new Asset();
        $legacy->prepareHtml('<button data-toggle="dropdown"></button>');
        $this->assertStringContainsString('dcat-modern-compat.js', $legacy->headerJsToHtml());

        $legacyWithMarker = new Asset();
        $legacyWithMarker->prepareHtml('<button data-toggle="dropdown" data-dcat-modern-owned-toggle="1"></button>');
        $this->assertStringContainsString('dcat-modern-compat.js', $legacyWithMarker->headerJsToHtml());
    }

    protected function setModernRuntime(bool $enabled, bool $compat = false)
    {
        $manifest = new class
        {
            public function assets()
            {
                return [
                    'js' => 'assets/dcat-modern.js',
                    'css' => ['assets/dcat-modern.css'],
                ];
            }
        };

        $modern = new class($enabled, $manifest, $compat)
        {
            protected $enabled;

            protected $manifest;

            protected $compat;

            public function __construct(bool $enabled, $manifest, bool $compat)
            {
                $this->enabled = $enabled;
                $this->manifest = $manifest;
                $this->compat = $compat;
            }

            public function runtimeAvailable()
            {
                return $this->enabled;
            }

            public function manifest()
            {
                return $this->manifest;
            }

            public function usesCompatRenderer()
            {
                return $this->compat;
            }
        };

        $this->container->instance('admin.modern', $modern);
    }
}
