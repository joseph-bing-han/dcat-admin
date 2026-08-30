<?php

namespace Dcat\Admin\Grid\Displayers;

class ProgressBar extends AbstractDisplayer
{
    public function display($style = 'primary', $size = 'sm', $max = 100)
    {
        $style = collect((array) $style)->map(function ($style) {
            return 'progress-bar-'.$style;
        })->implode(' ');

        return <<<EOT
<div class="shadow-100 progress $style">
  <div class="progress-bar" role="progressbar" aria-label="Progress: {$this->value}%" aria-valuenow="{$this->value}" aria-valuemin="0" aria-valuemax="{$max}" style="width:{$this->value}%"></div>
</div>
EOT;
    }

    public function modernPayload(...$arguments)
    {
        if (! is_numeric($this->value)) {
            return null;
        }

        $style = $arguments[0] ?? 'primary';
        $max = $arguments[2] ?? 100;
        $classes = collect((array) $style)->map(function ($value) {
            return 'progress-bar-'.$value;
        })->implode(' ');

        return [
            'kind' => 'progress',
            'value' => (float) $this->value,
            'max' => is_numeric($max) ? (float) $max : 100,
            'className' => trim('shadow-100 progress '.$classes),
        ];
    }
}
