<?php

namespace Tests\Feature;

use Dcat\Admin\Grid\Column\Filter\Between;
use Dcat\Admin\Grid\Model;
use Dcat\Admin\Layout\Asset;
use DOMDocument;
use DOMXPath;
use Illuminate\Container\Container;
use Illuminate\Http\Request;
use PHPUnit\Framework\TestCase;

class ColumnBetweenFilterTest extends TestCase
{
    protected $previousContainer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->previousContainer = Container::getInstance();
        $container = new Container();
        Container::setInstance($container);
        $container->instance('admin.asset', $this->createMock(Asset::class));
    }

    protected function tearDown(): void
    {
        Container::setInstance($this->previousContainer);
        parent::tearDown();
    }

    /** @dataProvider renderQueries */
    public function testPartialQueryRendersBothInputs(string $query, string $start, string $end, bool $active)
    {
        app()->instance('request', Request::create('/expenses'.$query));
        $filter = $this->getMockBuilder(Between::class)
            ->onlyMethods(['getQueryName', 'formAction', 'renderFormButtons', 'trans'])
            ->getMock();
        $filter->method('getQueryName')->willReturn('filter-total');
        $filter->method('formAction')->willReturn('/expenses');
        $filter->method('renderFormButtons')->willReturn('');
        $filter->method('trans')->willReturn('');

        $html = $filter->render();
        $document = new DOMDocument();
        $document->loadHTML($html);
        $xpath = new DOMXPath($document);
        $this->assertSame($start, $xpath->query('//input[@name="filter-total[start]"]')->item(0)->getAttribute('value'));
        $this->assertSame($end, $xpath->query('//input[@name="filter-total[end]"]')->item(0)->getAttribute('value'));
        $this->assertSame($active ? 'active' : '', $xpath->query('//a')->item(0)->getAttribute('class'));
    }

    public static function renderQueries(): array
    {
        return [
            'production URL' => ['?filter-total%5Bstart%5D=41&_sort%5Bcolumn%5D=total&_sort%5Btype%5D=desc', '41', '', true],
            'end only' => ['?filter-total[end]=80', '', '80', true],
            'both' => ['?filter-total[start]=41&filter-total[end]=80', '41', '80', true],
            'absent' => ['', '', '', false],
            'empty start' => ['?filter-total[start]=', '', '', false],
            'empty end' => ['?filter-total[end]=', '', '', false],
        ];
    }

    /** @dataProvider queryBounds */
    public function testQueryBindingKeepsExistingRangeSemantics(array $value, string $query, array $params)
    {
        $model = $this->getMockBuilder(Model::class)->disableOriginalConstructor()->getMock();
        $filter = $this->getMockBuilder(Between::class)->onlyMethods(['withQuery'])->getMock();
        $filter->expects($this->once())->method('withQuery')->with($model, $query, $params);
        $filter->addBinding($value, $model);
    }

    public static function queryBounds(): array
    {
        return [
            'start only' => [['start' => '41'], 'where', ['>=', '41']],
            'end only' => [['end' => '80'], 'where', ['<=', '80']],
            'both' => [['start' => '41', 'end' => '80'], 'whereBetween', [['41', '80']]],
        ];
    }
}
