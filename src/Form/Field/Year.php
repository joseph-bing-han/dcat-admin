<?php

namespace Dcat\Admin\Form\Field;

use function config;

class Year extends Date
{
    protected $key = 'app.year_format';

    public function __construct($column, $arguments = [])
    {
        parent::__construct($column, $arguments);
        $this->format(config($this->key, 'Y'));
    }

}
