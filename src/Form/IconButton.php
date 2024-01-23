<?php

namespace Dcat\Admin\Form;

class IconButton extends \Dcat\Admin\Form\Field\Button
{
    protected $icon = null;

    public function setIcon($icon)
    {
        $this->icon = $icon;
        return $this;
    }

    public function render()
    {
        $this->addVariables([
            'icon' => $this->icon,
        ]);

        return parent::render();
    }

    public static function make(...$params)
    {
        return new static(...$params);
    }
}
