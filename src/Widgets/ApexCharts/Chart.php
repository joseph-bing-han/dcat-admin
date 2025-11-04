<?php

namespace Dcat\Admin\Widgets\ApexCharts;

use Dcat\Admin\Support\Helper;
use Dcat\Admin\Support\JavaScript;
use Dcat\Admin\Traits\InteractsWithApi;
use Dcat\Admin\Widgets\Widget;
use Illuminate\Support\Str;

/**
 * Class Chart.
 *
 *
 * @see https://apexcharts.com/
 */
class Chart extends Widget
{
    use InteractsWithApi;

    public static $js = [
        '@apex-charts',
    ];

    protected $containerSelector;

    protected $built = false;
    
    protected $scriptAdded = false;
    
    protected static $globalScriptAdded = [];

    public function __construct($selector = null, $options = [])
    {
        if ($selector && ! is_string($selector)) {
            $options = $selector;
            $selector = null;
        }

        $this->selector($selector);

        $this->options($options);
    }

    /**
     * 设置或获取图表容器选择器.
     *
     * @param  string|null  $selector
     * @return $this|string|null
     */
    public function selector(?string $selector = null)
    {
        if ($selector === null) {
            return $this->containerSelector;
        }

        $this->containerSelector = $selector;

        if ($selector && ! $this->built) {
            $this->autoRender();
        }

        return $this;
    }

    /**
     * @param  string|array  $title
     * @return $this
     */
    public function title($title)
    {
        if (is_string($title)) {
            $options = ['text' => $title];
        } else {
            $options = Helper::array($title);
        }

        $this->options['title'] = $options;

        return $this;
    }

    /**
     * @param  array  $series
     * @return $this
     */
    public function series($series)
    {
        $this->options['series'] = Helper::array($series);

        return $this;
    }

    /**
     * @param  array  $value
     * @return $this
     */
    public function labels($value)
    {
        $this->options['labels'] = Helper::array($value);

        return $this;
    }

    /**
     * @param  string|array  $colors
     * @return $this
     */
    public function colors($colors)
    {
        $this->options['colors'] = Helper::array($colors);

        return $this;
    }

    /**
     * @param  array  $value
     * @return $this
     */
    public function stroke($value)
    {
        $this->options['stroke'] = Helper::array($value);

        return $this;
    }

    /**
     * @param  array  $value
     * @return $this
     */
    public function xaxis($value)
    {
        $this->options['xaxis'] = Helper::array($value);

        return $this;
    }

    /**
     * @param  array  $value
     * @return $this
     */
    public function tooltip($value)
    {
        $this->options['tooltip'] = Helper::array($value);

        return $this;
    }

    /**
     * @param  array  $value
     * @return $this
     */
    public function yaxis($value)
    {
        $this->options['yaxis'] = Helper::array($value);

        return $this;
    }

    /**
     * @param  array  $value
     * @return $this
     */
    public function fill($value)
    {
        $this->options['fill'] = Helper::array($value);

        return $this;
    }

    /**
     * @param  array  $value
     * @return $this
     */
    public function chart($value)
    {
        $this->options['chart'] = Helper::array($value);

        return $this;
    }

    /**
     * @param  array|bool  $value
     * @return $this
     */
    public function dataLabels($value)
    {
        if (is_bool($value)) {
            $value = ['enabled' => $value];
        }

        $this->options['dataLabels'] = Helper::array($value);

        return $this;
    }

    /**
     * @return string
     */
    protected function buildDefaultScript()
    {
        $options = JavaScript::format($this->options);

        return <<<JS
(function () {
    var container = $("{$this->containerSelector}")[0];
    
    // 防止重复渲染：如果容器中已经有图表，直接返回
    if (container && container.querySelector('.apexcharts-canvas')) {
        return;
    }
    
    var options = {$options};
    var chart = new ApexCharts(container, options);
    chart.render();
})();
JS;
    }

    /**
     * @return string
     */
    public function addScript()
    {
        // 使用容器ID作为唯一标识，防止同一个图表的脚本被重复添加
        $chartId = $this->containerSelector ?: 'default';
        
        if ($this->scriptAdded || isset(static::$globalScriptAdded[$chartId])) {
            return $this->script;
        }
        
        $this->scriptAdded = true;
        static::$globalScriptAdded[$chartId] = true;
        
        if (! $this->allowBuildRequest()) {
            return $this->script = $this->buildDefaultScript();
        }

        $this->fetched(
            <<<JS
if (! response.status) {
    return Dcat.error(response.message || 'Server internal error.');
}

var chartBox = $(response.selector || '{$this->containerSelector}');

if (chartBox.length) {
    chartBox.html('');

    if (typeof response.options === 'string') {
        eval(response.options);
    }
    
    setTimeout(function () {
        new ApexCharts(chartBox[0], response.options).render();
    }, 50);
}
JS
        );

        return $this->script = $this->buildRequestScript();
    }

    /**
     * @return string
     */
    public function render()
    {
        if ($this->built) {
            return;
        }
        $this->built = true;
        
        // 如果脚本已经通过 Card::addScript() 添加过，不再重复输出
        if ($this->scriptAdded) {
            $originalRunScript = $this->runScript;
            $this->runScript = false;
            $result = parent::render();
            $this->runScript = $originalRunScript;
            return $result;
        }

        return parent::render();
    }

    public function html()
    {
        $hasSelector = $this->containerSelector ? true : false;

        if (! $hasSelector) {
            // 没有指定ID，需要自动生成
            $id = $this->generateId();

            $this->selector('#'.$id);
        }

        // 只在脚本未添加时才添加（防止 Card 已经添加过）
        if (! $this->scriptAdded) {
            $this->addScript();
        }

        if ($hasSelector) {
            return;
        }

        // 没有指定容器选择器，则需自动生成
        $this->setHtmlAttribute([
            'id' => $id,
        ]);

        return <<<HTML
<div {$this->formatHtmlAttributes()}></div>
HTML;
    }

    /**
     * 返回API请求结果.
     *
     * @return array
     */
    public function valueResult()
    {
        return [
            'status'   => 1,
            'selector' => $this->containerSelector,
            'options'  => $this->formatScriptOptions(),
        ];
    }

    /**
     * 配置选项转化为JS可执行代码.
     *
     * @return string
     */
    protected function formatScriptOptions()
    {
        $code = JavaScript::format($this->options);

        return "response.options = {$code}";
    }

    /**
     * 生成唯一ID.
     *
     * @return string
     */
    protected function generateId()
    {
        return 'apex-chart-'.Str::random(8);
    }
}
