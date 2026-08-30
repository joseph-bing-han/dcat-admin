<?php

namespace Dcat\Admin\Modern;

use Dcat\Admin\Grid;
use Dcat\Admin\Grid\Column;
use Dcat\Admin\Grid\Column\Sorter;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\UrlWindow;
use Illuminate\Support\Arr;

class GridViewModel
{
    public static function make(Grid $grid, string $tableId): array
    {
        $visibleColumns = $grid->getVisibleColumns()->values();
        $columns = [];
        $slots = [
            ['id' => 'grid-toolbar', 'kind' => 'compat', 'role' => 'toolbar'],
            ['id' => 'grid-filter', 'kind' => 'compat', 'role' => 'filter'],
            ['id' => 'grid-header-extra', 'kind' => 'compat', 'role' => 'header'],
            ['id' => 'grid-footer', 'kind' => 'compat', 'role' => 'footer'],
        ];
        if ($grid->hasQuickCreate()) {
            $slots[] = ['id' => 'grid-quick-create', 'kind' => 'compat', 'role' => 'table-section'];
        }

        foreach ($visibleColumns as $columnIndex => $column) {
            $header = static::columnHeader($column);
            if ($header['mode'] === 'compat') {
                $slots[] = [
                    'id' => 'grid-header-'.$columnIndex,
                    'kind' => 'compat',
                    'role' => 'column-header',
                    'column' => $column->getName(),
                ];
            }

            $columns[] = [
                'name' => (string) $column->getName(),
                'label' => static::text($column->getLabel()),
                'serverType' => get_class($column),
                'attributes' => static::attributes($column->getAttributes()),
                'header' => $header,
            ];
        }

        $rows = [];
        foreach ($grid->rows()->values() as $rowIndex => $row) {
            $cells = [];
            foreach ($visibleColumns as $columnIndex => $column) {
                $payload = $column->getModernCellPayload($rowIndex);
                if (! $payload && ! $column->hasDisplayCallbacks()) {
                    $payload = static::plainCell($row->model(), $column->getName());
                }

                if (! $payload) {
                    $slotId = 'grid-cell-'.$rowIndex.'-'.$columnIndex;
                    $slots[] = [
                        'id' => $slotId,
                        'kind' => 'compat',
                        'role' => 'cell',
                        'column' => $column->getName(),
                    ];
                    $payload = [
                        'kind' => 'compat',
                        'slotId' => $slotId,
                    ];
                }

                $payload['attributes'] = static::attributes($column->getAttributes());
                $cells[] = $payload;
            }

            $rows[] = [
                'key' => (string) $row->getKey(),
                'index' => $rowIndex,
                'attributes' => static::attributes($row->getAttributes()),
                'cells' => $cells,
            ];
        }

        [$complexHeaders, $complexHeaderCompat] = static::complexHeaders($grid);
        if ($complexHeaderCompat) {
            $slots[] = [
                'id' => 'grid-complex-header',
                'kind' => 'compat',
                'role' => 'complex-header',
            ];
        }

        return ViewModel::make('grid', 'grid.read', [
            'tableId' => $tableId,
            'name' => (string) $grid->getName(),
            'tableClassName' => $grid->formatTableClass(),
            'tableContainerClassName' => $grid->formatTableParentClass(),
            'columns' => $columns,
            'complexHeaders' => $complexHeaders,
            'complexHeaderCompat' => $complexHeaderCompat,
            'rows' => $rows,
            'empty' => count($rows) === 0,
            'emptyLabel' => (string) trans('admin.no_data'),
            'hasQuickCreate' => $grid->hasQuickCreate(),
            'pagination' => static::pagination($grid),
            'fixedColumns' => static::fixedColumns($grid),
        ], [
            'componentId' => $tableId,
            'knownTypes' => array_values(array_unique(array_column($columns, 'serverType'))),
            'slots' => $slots,
            'compatRequirements' => [
                'customSlots' => ! empty($slots),
            ],
        ]);
    }

    protected static function columnHeader(Column $column): array
    {
        if ($column->getName() === Column::SELECT_COLUMN_NAME) {
            return [
                'mode' => 'compat',
                'sort' => null,
                'attributes' => static::attributes($column->getHeaderAttributes()),
            ];
        }

        $headers = $column->getHeaders();
        $sorter = null;
        foreach ($headers as $header) {
            if ($header instanceof Sorter) {
                $sorter = $header->modernPayload();
                continue;
            }

            return [
                'mode' => 'compat',
                'sort' => null,
                'attributes' => static::attributes($column->getHeaderAttributes()),
            ];
        }

        return [
            'mode' => 'native',
            'sort' => $sorter,
            'attributes' => static::attributes($column->getHeaderAttributes()),
        ];
    }

    protected static function plainCell($row, string $name): ?array
    {
        $value = data_get($row, $name);
        if ($value === null) {
            return ['kind' => 'text', 'text' => ''];
        }
        if (! is_scalar($value) && ! (is_object($value) && method_exists($value, '__toString'))) {
            return null;
        }

        $value = (string) $value;
        if (strip_tags($value) !== $value) {
            return null;
        }

        return [
            'kind' => 'text',
            'text' => html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8'),
        ];
    }

    protected static function complexHeaders(Grid $grid): array
    {
        $headers = $grid->getVisibleComplexHeaders();
        if (! $headers || $headers->isEmpty()) {
            return [[], false];
        }

        foreach ($headers as $header) {
            if ($header->hasCustomHtml()) {
                return [[], true];
            }
        }

        return [$headers->map(function ($header) {
            return [
                'label' => static::text($header->getLabel()),
                'columns' => $header->getColumnNames()->values()->all(),
                'attributes' => static::attributes($header->getHtmlAttributes()),
            ];
        })->values()->all(), false];
    }

    protected static function fixedColumns(Grid $grid): array
    {
        if (! $grid->hasFixColumns()) {
            return [];
        }

        return [
            'left' => $grid->leftVisibleColumns()->map(function ($column) {
                return (string) $column->getName();
            })->values()->all(),
            'right' => $grid->rightVisibleColumns()->map(function ($column) {
                return (string) $column->getName();
            })->values()->all(),
        ];
    }

    protected static function pagination(Grid $grid): array
    {
        if (! $grid->allowPagination()) {
            return [];
        }

        $paginator = $grid->paginator()->paginator;
        if (! $paginator) {
            return [];
        }

        $items = [[
            'label' => '',
            'href' => $paginator->onFirstPage() ? null : $paginator->previousPageUrl(),
            'rel' => 'prev',
            'ariaLabel' => (string) trans('pagination.previous'),
            'active' => false,
            'disabled' => $paginator->onFirstPage(),
            'className' => 'page-item previous'.($paginator->onFirstPage() ? ' disabled' : ''),
        ]];

        if ($paginator instanceof LengthAwarePaginator) {
            $window = UrlWindow::make($paginator);
            $elements = array_filter([
                $window['first'],
                is_array($window['slider']) ? '...' : null,
                $window['slider'],
                is_array($window['last']) ? '...' : null,
                $window['last'],
            ]);

            foreach ($elements as $element) {
                if (is_string($element)) {
                    $items[] = [
                        'label' => $element,
                        'href' => null,
                        'active' => false,
                        'disabled' => true,
                        'className' => 'page-item disabled',
                    ];
                    continue;
                }
                foreach ($element as $page => $url) {
                    $active = (int) $page === $paginator->currentPage();
                    $items[] = [
                        'label' => (string) $page,
                        'href' => $active ? null : $url,
                        'active' => $active,
                        'disabled' => false,
                        'className' => 'page-item'.($active ? ' active' : ''),
                    ];
                }
            }
        }

        $hasMorePages = $paginator->hasMorePages();
        $items[] = [
            'label' => '',
            'href' => $hasMorePages ? $paginator->nextPageUrl() : null,
            'rel' => 'next',
            'ariaLabel' => (string) trans('pagination.next'),
            'active' => false,
            'disabled' => ! $hasMorePages,
            'className' => 'page-item next'.($hasMorePages ? '' : ' disabled'),
        ];

        $perPage = null;
        if ($grid->getPerPages()) {
            $name = $grid->model()->getPerPageName();
            $current = (int) request()->input($name, $grid->getPerPage());
            $options = collect($grid->getPerPages())
                ->push($grid->getPerPage())
                ->push($current)
                ->unique()
                ->sort()
                ->values()
                ->map(function ($option) use ($name, $current) {
                    $value = (int) $option;

                    return [
                        'label' => (string) $value,
                        'href' => request()->fullUrlWithQuery([$name => $value]),
                        'active' => $value === $current,
                    ];
                })
                ->all();

            $perPage = [
                'current' => $current,
                'name' => $name,
                'options' => $options,
            ];
        }

        return [
            'className' => 'pagination pagination-sm no-margin pull-right shadow-100',
            'items' => $items,
            'range' => [
                'first' => $paginator->firstItem(),
                'last' => $paginator->lastItem(),
                'total' => method_exists($paginator, 'total') ? $paginator->total() : null,
                'label' => static::text(trans('admin.pagination.range', [
                    'first' => $paginator->firstItem(),
                    'last' => $paginator->lastItem(),
                    'total' => method_exists($paginator, 'total') ? $paginator->total() : '...',
                ])),
            ],
            'perPage' => $perPage,
        ];
    }

    protected static function text($value): string
    {
        return trim(html_entity_decode(strip_tags((string) $value), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }

    protected static function attributes(array $attributes): array
    {
        $safe = [];
        foreach ($attributes as $name => $value) {
            $name = strtolower((string) $name);
            if (! preg_match('/^(class|style|id|role|dir|lang|tabindex|width|height|colspan|rowspan|scope|title|data-[a-z0-9_:-]+|aria-[a-z0-9_:-]+)$/', $name)) {
                continue;
            }
            if ($value === null || is_scalar($value)) {
                $safe[$name] = $value;
            }
        }

        return $safe;
    }
}
