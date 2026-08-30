<?php

namespace Dcat\Admin\Grid\Displayers;

use Dcat\Admin\Admin;
use Dcat\Admin\Grid;
use Dcat\Admin\Grid\Column;
use Illuminate\Support\Fluent;

abstract class AbstractDisplayer
{
    /**
     * @var array
     */
    protected static $css = [];

    /**
     * @var array
     */
    protected static $js = [];

    /**
     * @var Grid
     */
    protected $grid;

    /**
     * @var Column
     */
    protected $column;

    /**
     * @var \Illuminate\Database\Eloquent\Model
     */
    public $row;

    /**
     * @var mixed
     */
    protected $value;

    /**
     * Create a new displayer instance.
     *
     * @param  mixed  $value
     * @param  Grid  $grid
     * @param  Column  $column
     * @param  \stdClass  $row
     */
    public function __construct($value, Grid $grid, Column $column, $row)
    {
        $this->value = $value;
        $this->grid = $grid;
        $this->column = $column;

        $this->setRow($row);
        $this->requireAssets();
    }

    protected function requireAssets()
    {
        if (static::$js) {
            Admin::js(static::$js);
        }

        if (static::$css) {
            Admin::css(static::$css);
        }
    }

    protected function setRow($row)
    {
        if (is_array($row)) {
            $row = new Fluent($row);
        }

        $this->row = $row;
    }

    /**
     * @return string
     */
    public function getElementName()
    {
        $name = explode('.', $this->column->getName());

        if (count($name) == 1) {
            return $name[0];
        }

        $html = array_shift($name);
        foreach ($name as $piece) {
            $html .= "[$piece]";
        }

        return $html;
    }

    /**
     * Get key of current row.
     *
     * @return mixed
     */
    public function getKey()
    {
        return $this->row->{$this->grid->getKeyName()};
    }

    /**
     * Get url path of current resource.
     *
     * @return string
     */
    public function resource()
    {
        return $this->grid->resource();
    }

    /**
     * Get translation.
     *
     * @param  string  $text
     * @return string|\Symfony\Component\Translation\TranslatorInterface
     */
    protected function trans($text)
    {
        return trans("admin.$text");
    }

    /**
     * Optional structured payload for the Bootstrap-free Grid renderer.
     * Returning null keeps this displayer inside a cell-level compat island.
     *
     * @return array|null
     */
    public function modernPayload(...$arguments)
    {
        return null;
    }

    /**
     * Convert legacy entity-encoded scalar content into React-safe text.
     * Raw HTML remains a compat-island concern so custom markup semantics are preserved.
     *
     * @param mixed $value
     * @return string|null
     */
    protected function modernText($value)
    {
        if ($value === null) {
            return '';
        }
        if (! is_scalar($value)) {
            return null;
        }

        $value = (string) $value;
        if (strip_tags($value) !== $value) {
            return null;
        }

        return html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /**
     * Display method.
     *
     * @return mixed
     */
    abstract public function display();
}
