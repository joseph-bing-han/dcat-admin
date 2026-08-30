<?php

namespace Dcat\Admin\Grid\Displayers;

use Dcat\Admin\Admin;
use Dcat\Admin\Support\Helper;

class Label extends AbstractDisplayer
{
    protected $baseClass = 'label';

    public function display($style = 'primary', $max = null)
    {
        if (! $value = $this->value($max)) {
            return;
        }

        $original = $this->column->getOriginal();
        $defaultStyle = is_array($style) ? ($style['default'] ?? 'default') : 'default';

        $background = $this->formatStyle(
            is_array($style) ?
                (is_scalar($original) ? ($style[$original] ?? $defaultStyle) : current($style))
                : $style
        );

        return collect($value)->map(function ($name) use ($background) {
            return "<span class='{$this->baseClass}' {$background}>$name</span>";
        })->implode(' ');
    }

    protected function formatStyle($style)
    {
        $background = 'style="background:#d2d6de;color: #555"';

        if ($style !== 'default') {
            $style = Admin::color()->get($style, $style);

            $background = "style='background:{$style}'";
        }

        return $background;
    }

    public function modernPayload(...$arguments)
    {
        $style = $arguments[0] ?? 'primary';
        $max = $arguments[1] ?? null;
        $values = $this->value($max);
        if (! $values) {
            return [
                'kind' => 'labels',
                'items' => [],
                'className' => $this->baseClass,
            ];
        }

        $items = [];
        foreach ($values as $value) {
            $text = $this->modernText($value);
            if ($text === null) {
                return null;
            }
            $items[] = $text;
        }

        $original = $this->column->getOriginal();
        $defaultStyle = is_array($style) ? ($style['default'] ?? 'default') : 'default';
        $resolvedStyle = is_array($style)
            ? (is_scalar($original) ? ($style[$original] ?? $defaultStyle) : current($style))
            : $style;

        if ($resolvedStyle === 'default') {
            $css = ['backgroundColor' => '#d2d6de', 'color' => '#555'];
        } else {
            $css = ['backgroundColor' => Admin::color()->get($resolvedStyle, $resolvedStyle)];
        }

        return [
            'kind' => 'labels',
            'items' => $items,
            'className' => $this->baseClass,
            'style' => $css,
        ];
    }

    protected function value($max)
    {
        $values = Helper::array($this->value);

        if ($max && count($values) > $max) {
            $values = array_slice($values, 0, $max);
            $values[] = '...';
        }

        return $values;
    }
}
