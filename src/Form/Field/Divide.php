<?php

namespace Dcat\Admin\Form\Field;

use Dcat\Admin\Form\Field;

class Divide extends Field
{
    protected $textClass = 'text-center';

    public function __construct($label = null)
    {
        $this->label = $label;
    }

    public function textLeft()
    {
        $this->textClass = 'pl-4 text-left';
        return $this;
    }

    public function textCenter()
    {
        $this->textClass = 'text-center';
        return $this;
    }

    public function textRight()
    {
        $this->textClass = 'pr-4 text-right';
        return $this;
    }

    public function render()
    {
        if (!$this->label) {
            return '<hr/>';
        }

        return <<<HTML
<div class="mt-2 mb-2 form-divider {$this->textClass}">
  <span>{$this->label}</span>
</div>
HTML;
    }
}
