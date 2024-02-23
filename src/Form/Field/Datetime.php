<?php

namespace Dcat\Admin\Form\Field;

use Carbon\Carbon;

class Datetime extends Date
{
    protected $format = 'Y-m-d H:i:s';

    protected $key = 'app.datetime_format';

    public function render()
    {
        if ($this->value()) {
            try {
                $time = Carbon::createFromFormat($this->format, $this->value());
            } catch (\Exception $e) {
                $time = Carbon::parse($this->value());
            }
            $this->value = $time->format($this->format);
        } else {
            $this->value = null;
        }

        $this->defaultAttribute('style', 'width: 200px;flex:none');

        return parent::render();
    }
}
