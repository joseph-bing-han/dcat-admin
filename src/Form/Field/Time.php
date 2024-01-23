<?php

namespace Dcat\Admin\Form\Field;

class Time extends Date
{
    protected $format = 'H:i:s';

    protected $key = 'app.time_format';

    public function render()
    {
        $this->prepend('<i class="fa fa-clock-o fa-fw"></i>')
            ->defaultAttribute('style', 'width: 200px;flex:none');

        return parent::render();
    }
}
