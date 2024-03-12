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
        $this->key = null;
        return $this;
    }


    protected function prepareInputValue($value)
    {
        if (empty($value)) {
            return null;
        }
        try {
            $time = Carbon::createFromFormat($this->format, $value);
        } catch (\Exception $e) {
            $time = Carbon::parse($value);
        }

        if ($this->key == 'app.year_format') {
            return $time->format('Y');
        } elseif ($this->key == 'app.date_format') {
            return $time->format('Y-m-d');
        } elseif ($this->key == 'app.time_format') {
            return $time->format('H:i:s');
        }

        return $time->format('Y-m-d H:i:s');
    }

    protected function getValueFromData($data, $column = null, $default = null)
    {
        $value = parent::getValueFromData($data, $column, $default);

        if (is_null($value)) {
            return $value;
        }

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
