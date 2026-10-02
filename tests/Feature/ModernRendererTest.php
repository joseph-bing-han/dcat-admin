<?php

namespace Tests\Feature;

use Dcat\Admin\Layout\Asset;
use Dcat\Admin\Layout\Content;
use Dcat\Admin\Grid;
use Dcat\Admin\Modern\GridViewModel;
use Dcat\Admin\Modern\Manager;
use Dcat\Admin\Modern\Manifest;
use Dcat\Admin\Support\Context;
use Dcat\Admin\Color;
use Dcat\Admin\Widgets\Dropdown;
use Illuminate\Config\Repository;
use Illuminate\Container\Container;
use Illuminate\Contracts\Routing\UrlGenerator as UrlGeneratorContract;
use Illuminate\Contracts\View\Factory as ViewFactoryContract;
use Illuminate\Events\Dispatcher;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Routing\RouteCollection;
use Illuminate\Routing\UrlGenerator;
use Illuminate\Support\Facades\Facade;
use Illuminate\Translation\ArrayLoader;
use Illuminate\Translation\Translator;
use Illuminate\View\Compilers\BladeCompiler;
use Illuminate\View\Engines\CompilerEngine;
use Illuminate\View\Engines\EngineResolver;
use Illuminate\View\Factory;
use Illuminate\View\FileViewFinder;
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

    public function testServerRenderedLayoutEnablesStylesBeforeNativeOrCompatScriptsStart()
    {
        $content = new class extends Content
        {
            public function layoutClasses()
            {
                return $this->applyClasses();
            }
        };

        foreach ([true, false] as $manifestAvailable) {
            $this->manifest->valid = $manifestAvailable;

            foreach (['custom-page dark-mode', ['custom-page', 'dark-mode', 'dcat-modern-active']] as $bodyClass) {
                config(['admin.layout' => [
                    'body_class' => $bodyClass,
                    'sidebar_collapsed' => true,
                    'horizontal_menu' => true,
                ]]);

                $layout = $content->layoutClasses();
                $classes = explode(' ', $layout['body_class']);

                $this->assertSame(1, count(array_keys($classes, 'dcat-modern-active', true)));
                $this->assertContains('custom-page', $classes);
                $this->assertContains('dark-mode', $classes);
                $this->assertContains('horizontal-menu', $classes);
                $this->assertNotContains('dcat-modern-request-enabled', $classes);
                $this->assertSame('sidebar-collapse', $layout['sidebar_class']);
                $this->assertSame('sidebar-dark-white', $layout['sidebar_style']);
            }
        }
    }

    public function testDashboardFirstPaintContainsTheSameBrandContentAsTheMountedCard()
    {
        $files = new Filesystem();
        $cachePath = sys_get_temp_dir().'/dcat-dashboard-'.uniqid('', true);
        $files->makeDirectory($cachePath);
        $engines = new EngineResolver();
        $engines->register('blade', function () use ($files, $cachePath) {
            return new CompilerEngine(new BladeCompiler($files, $cachePath));
        });
        $views = new Factory($engines, new FileViewFinder($files, [dirname(__DIR__, 2).'/resources/views']), $this->container['events']);
        $views->setContainer($this->container);
        $this->container->instance('view', $views);

        try {
            $html = $views->make('dashboard.title')->render();
            $document = new \DOMDocument();
            @$document->loadHTML($html);
            $xpath = new \DOMXPath($document);
            $payload = json_decode($xpath->query('//script[@type="application/json"]')->item(0)->textContent, true)['payload'];
            $fallback = '//div[@data-dcat-modern-fallback]';
            $logo = $xpath->query($fallback.'//img')->item(0);

            $this->assertSame('dashboard', $payload['data']['variant']);
            $this->assertSame(1, $xpath->query($fallback.'//div[contains(@class, "dcat-modern-dashboard")]')->length);
            $this->assertSame(1, $xpath->query($fallback.'//img')->length);
            $this->assertSame('dcat-modern-dashboard__logo', $logo->getAttribute('class'));
            $this->assertSame($payload['data']['logoUrl'], $logo->getAttribute('src'));
            $this->assertSame('48', $logo->getAttribute('width'));
            $this->assertSame('48', $logo->getAttribute('height'));
            $this->assertSame($payload['data']['title'], $xpath->query($fallback.'//h2')->item(0)->textContent);
            $this->assertSame(0, $xpath->query($fallback.'//*[contains(@class, "text-white")]')->length);
            $links = $xpath->query($fallback.'//nav[@aria-label="Dashboard resources"]/a');
            $this->assertSame(count($payload['data']['links']), $links->length);
            foreach ($links as $index => $link) {
                $this->assertSame($payload['data']['links'][$index]['label'], $link->textContent);
                $this->assertSame($payload['data']['links'][$index]['url'], $link->getAttribute('href'));
            }

            // 缺少现代产物时仍保留原有兼容模板，不生成不可挂载的组件边界。
            $this->manifest->valid = false;
            $compat = $views->make('dashboard.title')->render();
            $this->assertStringContainsString('class="avatar img-circle shadow mt-1"', $compat);
            $this->assertStringNotContainsString('data-dcat-react-component', $compat);
        } finally {
            $files->deleteDirectory($cachePath);
        }
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

    public function testGridPayloadIncludesSingleColumnsAroundCombinedHeaders()
    {
        $grid = new Grid(null, function (Grid $grid) {
            $grid->column('id', 'ID');
            $grid->column('month', 'Month');
            $grid->column('year', 'Year');
            $grid->column('date', 'Date');
            $grid->combine('totals', ['month', 'year'], 'Totals');
            $grid->disableActions();
            $grid->disableRowSelector();
        });
        $grid->model()->setData([['id' => 7, 'month' => 12, 'year' => 144, 'date' => '2026-10-02']]);
        $grid->build();

        $payload = GridViewModel::make($grid, 'grid-table')['data'];

        $this->assertSame(['month', 'year'], array_column($payload['columns'], 'name'));
        $this->assertSame(['id', 'month', 'year', 'date'], $payload['columnNames']);
        $this->assertSame(['7', '12', '144', '2026-10-02'], array_column($payload['rows'][0]['cells'], 'text'));
    }

    protected function withGridViews(callable $test)
    {
        $files = new Filesystem();
        $cachePath = sys_get_temp_dir().'/dcat-grid-'.uniqid('', true);
        $files->makeDirectory($cachePath);
        $engines = new EngineResolver();
        $engines->register('blade', function () use ($files, $cachePath) {
            return new CompilerEngine(new BladeCompiler($files, $cachePath));
        });
        $views = new Factory($engines, new FileViewFinder($files, []), $this->container['events']);
        $views->addNamespace('admin', dirname(__DIR__, 2).'/resources/views');
        $views->setContainer($this->container);
        $this->container->instance('view', $views);
        $this->container->alias('view', ViewFactoryContract::class);
        $this->container->instance('admin.color', new Color());

        try {
            $test($views);
        } finally {
            $files->deleteDirectory($cachePath);
        }
    }

    public function testGridFirstPaintUsesPayloadContentAndPreservesCompatSlotsAndPagination()
    {
        $this->withGridViews(function ($views) {
            $grid = new Grid(null, function (Grid $grid) {
                $grid->column('id', 'ID')->sortable();
                $grid->column('name', 'Name');
                $grid->column('status', 'Status')->label('warning');
                $grid->column('progress', 'Progress')->progressBar();
                $grid->column('custom', 'Custom')->display(function () {
                    return '<code data-custom="1">Custom content</code>';
                });
                $grid->disableActions();
                $grid->disableToolbar();
                $grid->disableFilter();
                $grid->header('<p data-header="1">Header</p>');
                $grid->footer('<p data-footer="1">Footer</p>');
            });
            $grid->model()->setData([['id' => 7, 'name' => 'Alice & Bob', 'status' => 'Pending', 'progress' => 35, 'custom' => 'Custom']]);
            $grid->showRowSelector();
            $grid->build();
            $grid->paginator()->paginator = new LengthAwarePaginator([], 60, 20, 2, ['path' => 'http://localhost/admin/records']);
            $html = $views->make('admin::grid.table', ['grid' => $grid, 'tableId' => 'records'])->render();
            $document = new \DOMDocument();
            @$document->loadHTML($html);
            $xpath = new \DOMXPath($document);
            $payload = json_decode($xpath->query('//script[@type="application/json"]')->item(0)->textContent, true)['payload']['data'];
            $fallback = '//div[@data-dcat-modern-fallback]';
            $this->assertSame(1, $xpath->query($fallback.'//div[@class="dcat-modern-grid-view"]')->length);
            $this->assertSame(1, $xpath->query($fallback.'//div[@class="dcat-modern-grid-toolbar"]//p[@data-header]')->length);
            $this->assertSame(1, $xpath->query($fallback.'//div[@class="dcat-modern-grid-table-card"]//table[@id="records"]')->length);
            $this->assertSame(1, $xpath->query($fallback.'//th[@data-dcat-modern-slot="grid-header-0"][@data-dcat-modern-legacy-island]//input')->length);
            $this->assertSame(1, $xpath->query($fallback.'//td[@data-dcat-modern-legacy-island]//code[@data-custom]')->length);
            $this->assertSame('Alice & Bob', trim($xpath->query('//table[@id="records"]/tbody/tr/td')->item(2)->textContent));
            $this->assertSame('warning', $payload['rows'][0]['cells'][3]['tone']);
            $this->assertSame('Pending', $xpath->query('//span[contains(@class,"dcat-modern-grid-label--warning")]')->item(0)->textContent);
            $this->assertSame('35', $xpath->query('//*[@role="progressbar"]')->item(0)->getAttribute('aria-valuenow'));
            $this->assertSame($payload['columns'][1]['header']['sort']['href'], $xpath->query('//a[contains(@class,"grid-sort")]')->item(0)->getAttribute('href'));
            $items = $xpath->query('//nav/ul/li');
            $this->assertSame(count($payload['pagination']['items']), $items->length);
            foreach ($payload['pagination']['items'] as $index => $item) {
                if (! empty($item['href'])) {
                    $this->assertSame($item['href'], $items->item($index)->getElementsByTagName('a')->item(0)->getAttribute('href'));
                }
            }
            $this->assertSame('2', $xpath->query('//nav//*[@aria-current="page"]')->item(0)->textContent);
            $this->assertSame(1, $xpath->query($fallback.'//div[@data-dcat-modern-slot="grid-footer"]//p[@data-footer]')->length);
        });
    }

    public function testEmptyGridFirstPaintDoesNotInsertAnEmptyToolbarAndKeepsCompatFallback()
    {
        $this->withGridViews(function ($views) {
            $grid = new Grid(null, function (Grid $grid) {
                $grid->column('id', 'ID');
                $grid->disableToolbar();
                $grid->disableFilter();
                $grid->disableActions();
                $grid->disableRowSelector();
                $grid->disablePagination();
            });
            $grid->model()->setData([]);
            $grid->build();
            $html = $views->make('admin::grid.table', ['grid' => $grid, 'tableId' => 'empty'])->render();
            $this->assertStringNotContainsString('class="dcat-modern-grid-toolbar"', $html);
            $this->assertStringContainsString('class="dcat-modern-grid-empty" role="status"', $html);
            $this->assertStringNotContainsString('icon-alert-circle', $html);
            $this->manifest->valid = false;
            $compat = $views->make('admin::grid.table', ['grid' => $grid, 'tableId' => 'empty'])->render();
            $this->assertStringContainsString('class="dcat-box"', $compat);
            $this->assertStringContainsString('icon-alert-circle', $compat);
            $this->assertStringNotContainsString('data-dcat-react-component', $compat);
        });
    }

    public function testQuickCreateFirstPaintUsesTheSameTableSectionAsReact()
    {
        $this->withGridViews(function ($views) {
            $this->container->instance('session', new class
            {
                public function token()
                {
                    return 'test-token';
                }
            });
            $data = ['elementClass' => 'quick-row', 'columnCount' => 2, 'fields' => [], 'uniqueName' => 'records', 'url' => '/records', 'method' => 'POST'];
            $html = $views->make('admin::grid.quick-create.form', $data)->render();
            $this->assertStringContainsString('<tbody data-dcat-modern-slot="grid-quick-create"', $html);
            $this->assertStringContainsString('data-dcat-modern-legacy-island="grid-quick-create"', $html);
            $this->assertStringContainsString('colspan="2"', $html);
            $this->manifest->valid = false;
            $compat = $views->make('admin::grid.quick-create.form', $data)->render();
            $this->assertStringContainsString('<thead data-dcat-modern-slot="grid-quick-create"', $compat);
        });
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
