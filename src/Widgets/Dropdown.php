<?php

namespace Dcat\Admin\Widgets;

use Dcat\Admin\Admin;
use Dcat\Admin\Support\Helper;
use Illuminate\Support\Str;

class Dropdown extends Widget
{
    const DIVIDER = '_divider';

    /**
     * @var string
     */
    protected static $dividerHtml = '<li class="dropdown-divider"></li>';

    protected $view = 'admin::widgets.dropdown';

    /**
     * @var array
     */
    protected $button = [
        'text'  => null,
        'class' => 'btn btn-sm btn-white waves-effect',
        'style' => null,
    ];

    /**
     * @var string
     */
    protected $buttonId;

    /**
     * @var \Closure
     */
    protected $builder;

    /**
     * @var bool
     */
    protected $divider;

    /**
     * @var bool
     */
    protected $click = false;

    protected $modernOwnedToggle = false;

    protected $firstRenderedLabel;

    /**
     * @var string
     */
    protected $direction = 'down';

    public function __construct(array $options = [])
    {
        $this->options($options);
    }

    /**
     * Set the options of dropdown menus.
     *
     * @param  array  $options
     * @param  string|null  $title
     * @return $this
     */
    public function options($options = [], ?string $title = null)
    {
        if (! $options) {
            return $this;
        }

        $this->options[] = [$title, Helper::array($options)];

        return $this;
    }

    /**
     * Set the button text.
     *
     * @param  string|null  $text
     * @return $this
     */
    public function button(?string $text)
    {
        $this->button['text'] = $text;

        return $this;
    }

    public function withoutTextButton()
    {
        return $this->button('');
    }

    /**
     * Set the button class.
     *
     * @param  string  $class
     * @return $this
     */
    public function buttonClass(?string $class)
    {
        $this->button['class'] = $class;

        return $this;
    }

    /**
     * Set the button style.
     *
     * @param  string  $class
     * @return $this
     */
    public function buttonStyle(?string $style)
    {
        $this->button['style'] = $style;

        return $this;
    }

    public function direction(string $direction = 'down')
    {
        $this->direction = $direction;

        return $this;
    }

    public function up()
    {
        return $this->direction('up');
    }

    public function down()
    {
        return $this->direction('down');
    }

    public function modernOwnedToggle(bool $owned = true)
    {
        $this->modernOwnedToggle = $owned;

        return $this;
    }

    /**
     * Show divider.
     *
     * @param  string  $class
     * @return $this
     */
    public function divider()
    {
        $this->divider = true;

        return $this;
    }

    /**
     * Applies the callback to the elements of the options.
     *
     * @param  string  $class
     * @return $this
     */
    public function map(\Closure $builder)
    {
        $this->builder = $builder;

        return $this;
    }

    /**
     * Add click event listener.
     *
     * @param  string|null  $defaultLabel
     * @return $this
     */
    public function click(?string $defaultLabel = null)
    {
        $this->click = true;

        $this->buttonId = 'dropd-'.Str::random(8);

        if ($defaultLabel !== null) {
            $this->button($defaultLabel);
        }

        return $this;
    }

    /**
     * @return string
     */
    public function getButtonId()
    {
        return $this->buttonId;
    }

    /**
     * @return string
     */
    protected function renderOptions()
    {
        $html = '';
        $this->firstRenderedLabel = null;

        foreach ($this->options as &$items) {
            [$title, $options] = $items;

            if ($title) {
                $html .= "<li class='dropdown-header'>$title</li>";
            }

            foreach ($options as $key => $val) {
                $html .= $this->renderOption($key, $val);
            }
        }

        return $html;
    }

    /**
     * @param  mixed  $k
     * @param  mixed  $v
     * @return mixed|string
     */
    protected function renderOption($k, $v)
    {
        if ($v === static::DIVIDER) {
            return static::$dividerHtml;
        }

        if ($builder = $this->builder) {
            $v = $builder->call($this, $v, $k);
        }

        $v = mb_strpos($v, '</a>') ? $v : "<a href='javascript:void(0)'>$v</a>";
        if ($this->firstRenderedLabel === null) {
            $this->firstRenderedLabel = $this->renderedOptionLabel($v);
        }
        $v = "<li class='dropdown-item'>$v</li>";

        if ($this->divider) {
            $v .= static::$dividerHtml;
            $this->divider = null;
        }

        return $v;
    }

    protected function renderedOptionLabel(string $option): string
    {
        if (! class_exists(\DOMDocument::class)) {
            return e(trim(strip_tags($option)));
        }

        $document = new \DOMDocument('1.0', 'UTF-8');
        if (! @$document->loadHTML('<?xml encoding="UTF-8"?><div>'.$option.'</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD)) {
            return e(trim(strip_tags($option)));
        }

        $anchor = $document->getElementsByTagName('a')->item(0);
        if (! $anchor) {
            return e(trim(strip_tags($option)));
        }

        $label = '';
        foreach ($anchor->childNodes as $child) {
            $label .= $document->saveHTML($child);
        }

        return $label;
    }

    /**
     * @return string
     */
    public function render()
    {
        $modern = Admin::modern()->available('widget') && Admin::modern()->capabilityEnabled('widget.surface');
        $hasButton = $this->button['text'] !== null || $this->click;
        if ($hasButton && ! $this->buttonId) {
            $this->buttonId = 'dropd-'.Str::random(8);
        }
        $options = $this->renderOptions();
        $defaultLabel = $this->button['text'] ?: ($modern && $this->click ? $this->firstRenderedLabel : null);
        $buttonLabel = trim(strip_tags((string) ($this->button['text'] ?: $defaultLabel)));
        if ($buttonLabel === '') {
            $buttonLabel = trans('admin.more');
        }
        $buttonTitle = trim(strip_tags((string) $defaultLabel)) === '' ? $buttonLabel : null;

        $this->addVariables([
            'options'   => $options,
            'button'    => $this->button,
            'defaultLabel' => $defaultLabel,
            'hasButton' => $hasButton,
            'buttonLabel' => $buttonLabel,
            'buttonTitle' => $buttonTitle,
            'buttonId'  => $this->buttonId,
            'click'     => $this->click,
            'direction' => $this->direction,
            'modern'    => $modern,
            'modernOwnedToggle' => $this->modernOwnedToggle,
            'menuId'    => $this->buttonId ? $this->buttonId.'-menu' : null,
        ]);

        return parent::render();
    }
}
