<?php

namespace Dcat\Admin\Form\Field;

use Dcat\Admin\Form\Field;
use Illuminate\Support\Str;

class Button extends Field
{
    protected $class = 'btn-primary';

    protected $icon = null;

    public function __construct($label)
    {
        parent::__construct(Str::random(), [$label]);

        $this->addVariables(['buttonClass' => $this->class]);
    }

    public function class(string $class)
    {
        return $this->addVariables(['buttonClass' => $class, 'icon' => $this->icon]);
    }

    public function setIcon($icon)
    {
        $this->icon = $icon;
        return $this;
    }

    public static function make(...$params)
    {
        return new static(...$params);
    }

    public function on($event, $callback)
    {
        $this->script = <<<JS
$('{$this->getElementClassSelector()}').on('$event', function() {
    $callback
});
JS;

        return $this;
    }
}
