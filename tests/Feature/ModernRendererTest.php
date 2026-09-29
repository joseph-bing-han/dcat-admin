<?php

namespace Tests\Feature;

use Dcat\Admin\Layout\Asset;
use Dcat\Admin\Grid;
use Dcat\Admin\Modern\GridViewModel;
use Dcat\Admin\Modern\Manager;
use Dcat\Admin\Modern\Manifest;
use Dcat\Admin\Support\Context;
use Dcat\Admin\Widgets\Dropdown;
use Illuminate\Config\Repository;
use Illuminate\Container\Container;
use Illuminate\Contracts\Routing\UrlGenerator as UrlGeneratorContract;
use Illuminate\Events\Dispatcher;
use Illuminate\Http\Request;
use Illuminate\Routing\RouteCollection;
use Illuminate\Routing\UrlGenerator;
use Illuminate\Support\Facades\Facade;
use Illuminate\Translation\ArrayLoader;
use Illuminate\Translation\Translator;
use PHPUnit\Framework\TestCase;

class ModernRendererTest extends TestCase
{
    protected $previousContainer;

    protected $container;

    protected $previousFacadeApplication;

    protected $manifest;

    protected $manager;

    protected function setUp(): void
    {
        parent::setUp();
        $this->previousContainer = Container::getInstance();
        $this->previousFacadeApplication = Facade::getFacadeApplication();
        $this->container = new Container();
        Container::setInstance($this->container);
        Facade::clearResolvedInstances();
        Facade::setFacadeApplication($this->container);
        $this->container->instance('events', new Dispatcher($this->container));
        $request = Request::create('http://localhost/admin');
        $this->container->instance('request', $request);
        $this->container->instance('url', new UrlGenerator(new RouteCollection(), $request));
        $this->container->alias('url', UrlGeneratorContract::class);
        $this->container->instance('config', new Repository(['admin' => ['modern' => []]]));
        $this->container->instance('admin.context', new Context());
        $this->container->instance('translator', new Translator(new ArrayLoader(), 'en'));
        $this->container->instance('admin.translator', new class
        {
            public function transField($field, $locale = null)
            {
                return $field;
            }
        });
        $this->manifest = new class extends Manifest
        {
            public $valid = true;

            public function exists()
            {
                return $this->valid;
            }

            public function assets($name = self::ENTRY)
            {
                return $this->valid
                    ? ['js' => 'assets/dcat-modern.js', 'css' => ['assets/dcat-modern.css']]
                    : ['js' => null, 'css' => []];
            }
        };
        $this->manager = new Manager($this->manifest);
        $this->container->instance('admin.modern', $this->manager);
        $this->container->instance('admin.asset', new Asset());
    }

    protected function tearDown(): void
    {
        Facade::clearResolvedInstances();
        Facade::setFacadeApplication($this->previousFacadeApplication);
        Container::setInstance($this->previousContainer);
        parent::tearDown();
    }

    public function testModernRendererIsTheOnlyRendererWhenTheManifestExists()
    {
        $this->assertTrue($this->manager->enabled());
        $this->assertTrue($this->manager->available('form'));
        $this->assertTrue($this->manager->runtimeAvailable());
        $this->assertTrue($this->manager->usesBootstrapFreeAssets());
        $this->assertFalse($this->manager->usesCompatRenderer());
        $this->assertStringContainsString('"enabled":true', $this->manager->headHtml());
        $this->assertStringContainsString('"compat":false', $this->manager->headHtml());
    }

    public function testConfiguredCspNonceCoversModernScriptsAndStyles()
    {
        $nonceCalls = 0;
        config(['admin.modern.csp_nonce' => function () use (&$nonceCalls) {
            $nonceCalls++;

            return 'nonce-dcat-modern';
        }]);

        $head = $this->manager->headHtml();
        $pageConfig = $this->manager->pageConfigHtml();
        $payload = $this->manager->payload('extension.fixture', ['ready' => true], 'extension');

        $this->assertSame(3, substr_count($head, 'nonce="nonce-dcat-modern"'));
        $this->assertStringContainsString('<link rel="stylesheet"', $head);
        $this->assertStringContainsString('dcat-modern.css" nonce="nonce-dcat-modern"', $head);
        foreach ([$pageConfig, $payload] as $html) {
            $this->assertStringContainsString('nonce="nonce-dcat-modern"', $html);
        }
        $this->assertSame(3, $nonceCalls);
    }

    public function testNullDiagnosticsFollowsApplicationDebugMode()
    {
        config(['app.debug' => true, 'admin.modern.diagnostics' => null]);

        $config = json_decode(strip_tags($this->manager->pageConfigHtml()), true);

        $this->assertTrue($config['diagnostics']);
    }

    public function testMissingManifestUsesBootstrapFreeCompatWithoutAnyClassicFallback()
    {
        $this->manifest->valid = false;

        $this->assertFalse($this->manager->enabled());
        $this->assertFalse($this->manager->available());
        $this->assertTrue($this->manager->runtimeAvailable(), 'compat is still a modern runtime');
        $this->assertTrue($this->manager->usesCompatRenderer());
        $head = $this->manager->headHtml();
        $this->assertStringContainsString('/modern-compat/assets/dcat-fallback.js', $head);
        $this->assertStringContainsString('/modern-compat/assets/dcat-fallback.css', $head);
        $this->assertStringContainsString('"enabled":false', $head);
        $this->assertStringContainsString('"compat":true', $head);
        $this->assertStringNotContainsString('adminlte', $head);
        $this->assertSame('', $this->manager->payload('extension.fixture', [], 'extension'));
    }

    public function testLegacyAssetPathsAlwaysResolveToModernFacades()
    {
        $asset = app('admin.asset');

        $this->assertSame(
            'vendor/dcat-admin/modern/assets/dcat-modern.css',
            $asset->getRealPath('@admin/adminlte/adminlte.css')
        );
        $this->assertSame(
            'vendor/dcat-admin/modern-compat/assets/dcat-modern-compat.js',
            $asset->getRealPath('@admin/adminlte/adminlte.js')
        );
        $this->assertSame(
            'vendor/dcat-admin/modern-compat/assets/dcat-modern-compat.js',
            $asset->getRealPath('@admin/dcat/js/dcat-app.js')
        );
    }

    public function testGridPayloadPreservesTheRowSelectorHeaderAsCompatContent()
    {
        $grid = new Grid(null, function (Grid $grid) {
            $grid->column('id', 'ID');
            $grid->disableActions();
        });
        $grid->model()->setData([]);
        $grid->showRowSelector();
        $grid->build();

        $payload = GridViewModel::make($grid, 'grid-table');
        $selector = $payload['data']['columns'][0];
        $slot = collect($payload['slots'])->firstWhere('id', 'grid-header-0');

        $this->assertSame('__row_selector__', $selector['name']);
        $this->assertSame('compat', $selector['header']['mode']);
        $this->assertSame([
            'id' => 'grid-header-0',
            'kind' => 'compat',
            'role' => 'column-header',
            'column' => '__row_selector__',
        ], $slot);
    }

    public function testRemovedLegacyRendererGatesNoLongerSelectTheOldUi()
    {
        config([
            'admin.modern.enabled' => false,
            'admin.modern.routes' => [],
            'admin.modern.families' => ['grid' => false],
            'admin.modern.capabilities' => ['grid.read' => false],
            'admin.modern.bootstrap_free_fallback' => false,
        ]);
        $this->container->instance('request', Request::create('http://localhost/admin?__dcat_legacy=1'));

        $this->assertTrue($this->manager->enabled(), 'enabled must ignore removed config gates');
        $this->assertTrue($this->manager->available('grid'), 'family gates must not disable the modern renderer');
        $this->assertTrue($this->manager->runtimeAvailable(), 'forced legacy query must not disable the modern renderer');
        $this->assertFalse($this->manager->usesCompatRenderer());
        $this->assertStringContainsString('data-dcat-r="1"', $this->manager->pageConfigHtml(), 'Renderer 1 is native');
        $this->assertStringContainsString('"compat":false', $this->manager->headHtml());
    }

    public function testCapabilityGateIsNotDrivenByConfiguration()
    {
        config([
            'admin.modern.capabilities' => ['grid.read' => false, 'widget.surface' => false],
            'admin.modern.families' => ['widget' => false],
        ]);
        $this->manifest->valid = false;

        // 能力级门禁已取消：已实现能力始终启用，也不再读取配置，
        // 因此 dashboard/title.blade.php 等模板不会因为该调用而崩溃。
        $this->assertTrue($this->manager->capabilityEnabled('grid.read'));
        $this->assertTrue($this->manager->capabilityEnabled('widget.surface'));
        $this->assertTrue($this->manager->capabilityEnabled('unknown.capability'));
    }

    public function testDropdownWithoutTextButtonPreservesTheIconOnlyButtonIntent()
    {
        $dropdown = Dropdown::make(['alpha' => 'Alpha']);

        $this->assertSame($dropdown, $dropdown->withoutTextButton());

        $button = (new \ReflectionClass($dropdown))->getProperty('button')->getValue($dropdown);

        $this->assertSame('', $button['text']);
    }

    public function testEveryModernManagerMethodUsedByViewsAndSourceExists()
    {
        $files = array_merge(
            $this->phpFilesIn(dirname(__DIR__, 2).'/src'),
            glob(dirname(__DIR__, 2).'/resources/views/**/*.blade.php') ?: [],
            glob(dirname(__DIR__, 2).'/resources/views/*.blade.php') ?: []
        );
        $used = [];

        foreach ($files as $file) {
            $contents = file_get_contents($file);
            if (! preg_match_all('/modern\(\)\s*->\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/', $contents, $matches)) {
                continue;
            }
            foreach ($matches[1] as $method) {
                $used[$method] = true;
            }
        }

        $this->assertNotEmpty($used, 'The scan must find Admin::modern() call sites.');
        ksort($used);

        foreach (array_keys($used) as $method) {
            $this->assertTrue(
                method_exists($this->manager, $method),
                "Dcat\\Admin\\Modern\\Manager::{$method}() is called by src/ or resources/views/ but no longer exists."
            );
        }
    }

    protected function phpFilesIn($dir)
    {
        $files = [];
        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS));

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $files[] = $file->getPathname();
            }
        }

        return $files;
    }

    public function testCompatRendererIsSelectedOnlyWhenTheManifestIsMissing()
    {
        $this->manifest->valid = false;

        $this->assertStringContainsString('data-dcat-r="0"', $this->manager->pageConfigHtml(), 'Renderer 0 is compat');
        $this->assertStringNotContainsString('data-dcat-r="2"', $this->manager->pageConfigHtml(), 'Renderer 2 no longer exists');
    }
}
