<?php

namespace Dcat\Admin\Grid\Displayers;

class Button extends AbstractDisplayer
{
    public function display($style = 'primary')
    {
        $style = collect((array) $style)->map(function ($style) {
            return 'btn-'.$style;
        })->implode(' ');

        return "<span class='btn btn-sm $style'>{$this->value}</span>";
    }

    public function modernPayload(...$arguments)
    {
        $text = $this->modernText($this->value);
        if ($text === null) {
            return null;
        }

        $style = $arguments[0] ?? 'primary';
        $classes = collect((array) $style)->map(function ($value) {
            return 'btn-'.$value;
        })->implode(' ');

        return [
            'kind' => 'button',
            'text' => $text,
            'className' => trim('btn btn-sm '.$classes),
        ];
    }
}
