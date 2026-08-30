<?php

namespace Dcat\Admin\Grid\Column;

use Dcat\Admin\Grid;
use Illuminate\Contracts\Support\Renderable;

class Sorter implements Renderable
{
    /**
     * @var Grid
     */
    protected $grid;

    /**
     * Sort arguments.
     *
     * @var array
     */
    protected $sort;

    /**
     * Cast Name.
     *
     * @var array
     */
    protected $cast;

    /**
     * @var string
     */
    protected $columnName;

    /**
     * Sorter constructor.
     *
     * @param  Grid  $grid
     * @param  string  $columnName
     * @param  string  $cast
     */
    public function __construct(Grid $grid, $columnName, $cast)
    {
        $this->grid = $grid;
        $this->columnName = $columnName;
        $this->cast = $cast;
    }

    /**
     * Determine if this column is currently sorted.
     *
     * @return bool
     */
    protected function isSorted()
    {
        $this->sort = app('request')->get($this->getSortName());

        if (empty($this->sort)) {
            return false;
        }

        return isset($this->sort['column']) && $this->sort['column'] == $this->columnName;
    }

    protected function getSortName()
    {
        return $this->grid->model()->getSortName();
    }

    public function modernPayload()
    {
        $type = 'desc';
        $icon = 'down';
        $active = '';
        $currentType = null;

        if ($this->isSorted()) {
            $currentType = $this->sort['type'] ?? null;
            $type = $currentType == 'desc' ? 'asc' : 'desc';
            $active = 'active';

            if ($currentType === 'asc') {
                $icon = 'up';
            }
        }

        $sort = ['column' => $this->columnName, 'type' => $type];
        if ($this->cast) {
            $sort['cast'] = $this->cast;
        }

        if (! $this->isSorted() || ($this->sort['type'] ?? null) != 'asc') {
            $url = request()->fullUrlWithQuery([
                $this->getSortName() => $sort,
            ]);
        } else {
            $url = request()->fullUrlWithQuery([
                $this->getSortName() => [],
            ]);
        }

        $label = trans('admin.order').' '.$this->columnName;

        return [
            'href' => $url,
            'icon' => $icon,
            'active' => $active === 'active',
            'currentType' => $currentType,
            'nextType' => $type,
            'className' => trim('grid-sort feather icon-arrow-'.$icon.' '.$active),
            'label' => (string) $label,
        ];
    }

    /**
     * @return string
     */
    public function render()
    {
        $payload = $this->modernPayload();
        $label = e($payload['label']);

        return "&nbsp;<a href='{$payload['href']}' class='{$payload['className']}' aria-label='{$label}' title='{$label}'></a>";
    }}
