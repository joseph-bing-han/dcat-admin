<?php

namespace Tests\Feature;

use Dcat\Admin\Support\Translator as AdminTranslator;
use Illuminate\Container\Container;
use Illuminate\Foundation\Application;
use Illuminate\Routing\Route;
use Illuminate\Translation\ArrayLoader;
use Illuminate\Translation\Translator;
use PHPUnit\Framework\TestCase;

class OptionTranslationTest extends TestCase
{
    protected $previousContainer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->previousContainer = Container::getInstance();
        $app = new Application();
        Container::setInstance($app);
        $loader = new ArrayLoader();
        $loader->addMessages('en', 'invoice', [
            'options' => ['sent' => [0 => 'Unsent', 1 => 'Sent'], 'named' => ['draft' => 'Draft']],
        ]);
        $app->instance('translator', new Translator($loader, 'en'));
        $app->instance('admin.translator', new AdminTranslator());
        $app->instance('router', new class
        {
            public function current()
            {
                return new Route('GET', 'invoices/{id}', [
                    'uses' => 'InvoiceController@show',
                    'controller' => 'InvoiceController@show',
                ]);
            }
        });
    }

    protected function tearDown(): void
    {
        Container::setInstance($this->previousContainer);
        parent::tearDown();
    }

    /** @dataProvider statusValues */
    public function testBooleanAndNumericStatusKeys($value, string $expected)
    {
        $this->assertSame($expected, admin_trans_option('sent', $value));
    }

    public static function statusValues(): array
    {
        return [[false, 'Unsent'], [true, 'Sent'], [0, 'Unsent'], [1, 'Sent'], ['0', 'Unsent'], ['1', 'Sent']];
    }

    public function testNullStillReturnsTheEntireOptionMap()
    {
        $this->assertSame([0 => 'Unsent', 1 => 'Sent'], admin_trans_option('sent'));
    }

    public function testNamedOptionKeysArePreserved()
    {
        $this->assertSame('Draft', admin_trans_option('named', 'draft'));
    }
}
