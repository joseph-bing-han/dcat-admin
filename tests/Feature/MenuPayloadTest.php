<?php

namespace Tests\Feature;

use Dcat\Admin\Admin;
use Dcat\Admin\Layout\Menu;
use Dcat\Admin\Layout\SectionManager;
use Illuminate\Config\Repository;
use Illuminate\Container\Container;
use Illuminate\Contracts\Auth\Factory;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Routing\UrlGenerator as UrlGeneratorContract;
use Illuminate\Http\Request;
use Illuminate\Routing\RouteCollection;
use Illuminate\Routing\UrlGenerator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Facade;
use Illuminate\Translation\ArrayLoader;
use Illuminate\Translation\Translator;
use PHPUnit\Framework\TestCase;

class MenuPayloadTest extends TestCase
{
    protected $previousContainer;

    protected $previousFacadeApplication;

    protected function setUp(): void
    {
        parent::setUp();
        $this->previousContainer = Container::getInstance();
        $this->previousFacadeApplication = Facade::getFacadeApplication();
        $container = new Container();
        Container::setInstance($container);
        Facade::clearResolvedInstances();
        Facade::setFacadeApplication($container);
        $request = Request::create('http://localhost/admin/reports');
        $container->instance('request', $request);
        $container->instance('url', new UrlGenerator(new RouteCollection(), $request));
        $container->alias('url', UrlGeneratorContract::class);
        $container->instance('config', new Repository(['admin' => [
            'database' => ['menu_model' => MenuPayloadModel::class],
            'route' => ['prefix' => 'admin'],
        ]]));
        $container->instance('admin.sections', new SectionManager());
        $container->instance('translator', new Translator(new ArrayLoader(), 'en'));
        $guard = $this->createMock(Guard::class);
        $guard->method('user')->willReturn(null);
        $auth = $this->createMock(Factory::class);
        $auth->method('guard')->willReturn($guard);
        $container->instance('auth', $auth);
    }

    protected function tearDown(): void
    {
        Facade::clearResolvedInstances();
        Facade::setFacadeApplication($this->previousFacadeApplication);
        Container::setInstance($this->previousContainer);
        parent::tearDown();
    }

    public function testAddedMenusKeepPriorityAndIndependentTreesWithDuplicateIds()
    {
        $menu = new Menu();
        $menu->add([
            ['id' => 1, 'parent_id' => 0, 'title' => 'Reports', 'uri' => ''],
            ['id' => 2, 'parent_id' => 1, 'title' => 'Monthly', 'uri' => 'reports'],
            ['id' => 3, 'parent_id' => 1, 'title' => 'Hidden', 'uri' => 'hidden', 'show' => false],
        ]);
        $menu->add([
            ['id' => 1, 'parent_id' => 0, 'title' => 'Helpers', 'uri' => ''],
            ['id' => 2, 'parent_id' => 1, 'title' => 'Tools', 'uri' => 'tools'],
        ], 20);

        $this->assertTrue($menu->supportsModern());
        $items = $menu->modernPayload()['items'];
        $this->assertSame(['Home', 'Helpers', 'Reports'], array_column($items, 'title'));
        $this->assertSame([], $items[0]['children']);
        $this->assertSame(['Tools'], array_column($items[1]['children'], 'title'));
        $this->assertSame(['Monthly'], array_column($items[2]['children'], 'title'));
        $this->assertSame('http://localhost/admin/reports', $items[2]['children'][0]['url']);
        $this->assertTrue($items[2]['active']);

        // section 清空后，不可将旧注册的节点重新注入本次菜单。
        Admin::section()->flushSections();
        $this->assertSame(['Home'], array_column($menu->modernPayload()['items'], 'title'));
    }

    public function testCustomSectionsAndRichTitlesRemainOutsideTheStructuredPayload()
    {
        $menu = new Menu();
        $menu->add([['id' => 1, 'parent_id' => 0, 'title' => '<b>Custom</b>', 'uri' => 'custom']]);
        $this->assertNull($menu->modernPayload());
        Admin::section()->flushSections();
        admin_inject_section(Admin::SECTION['LEFT_SIDEBAR_MENU_BOTTOM'], '<li>Custom content</li>');
        $this->assertFalse($menu->supportsModern());
        $this->assertNull($menu->modernPayload());
        $this->assertSame('<li>Custom content</li>', admin_section(Admin::SECTION['LEFT_SIDEBAR_MENU_BOTTOM']));
    }
}

class MenuPayloadModel
{
    public function allNodes()
    {
        return new Collection([['id' => 1, 'parent_id' => 0, 'title' => 'Home', 'uri' => '/']]);
    }
}
