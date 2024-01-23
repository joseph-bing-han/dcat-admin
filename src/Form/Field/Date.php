<?php

namespace Dcat\Admin\Form\Field;

use Carbon\Carbon;

class Date extends Text
{
    public static $js = [
        '@moment',
        '@bootstrap-datetimepicker',
    ];
    public static $css = [
        '@bootstrap-datetimepicker',
    ];

    protected $format = 'Y-m-d';

    protected $key = 'app.date_format';


    public function __construct($column, $arguments = [])
    {
        parent::__construct($column, $arguments);
        $this->format(config($this->key));
    }

    public function format($format)
    {
        $this->format = $format;

        return $this;
    }


    protected function prepareInputValue($value)
    {
        if ($value === '') {
            $value = null;
        }
        try {
            $time = Carbon::createFromFormat($this->format, $value);
        } catch (\Exception $e) {
            $time = Carbon::parse($value);
        }
        return $time->format('Y-m-d H:i:s');
    }

    protected function getValueFromData($data, $column = null, $default = null)
    {
        $value = parent::getValueFromData($data, $column, $default);

        try {
            $time = Carbon::parse($value);
        } catch (\Exception $e) {
            $time = Carbon::createFromFormat($this->format, $value);
        }

        return $time->format($this->format);
    }


    public function render()
    {
        $this->options['format'] = datetime_format_2_js($this->format);
        $this->options['locale'] = config('app.locale');
        $this->options['allowInputToggle'] = true;

        $options = admin_javascript_json($this->options);

        $this->script = <<<JS
Dcat.init('{$this->getElementClassSelector()}', function (self) {
    self.datetimepicker({$options});
});
JS;

        $this->prepend('<i class="fa fa-calendar fa-fw"></i>')
             ->defaultAttribute('style', 'width: 200px;flex:none');

        return parent::render();
    }
}
