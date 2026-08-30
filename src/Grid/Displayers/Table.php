<?php

namespace Dcat\Admin\Grid\Displayers;

use Illuminate\Support\Arr;

class Table extends AbstractDisplayer
{
    public function display($titles = [])
    {
        if (empty($this->value)) {
            return '';
        }

        if (empty($titles)) {
            $titles = array_keys($this->value[0]);
        }

        if (Arr::isAssoc($titles)) {
            $columns = array_keys($titles);
        } else {
            $titles = array_combine($titles, $titles);
            $columns = $titles;
        }

        $data = array_map(function ($item) use ($columns) {
            $sorted = [];

            $arr = Arr::only($item, $columns);

            foreach ($columns as $column) {
                if (array_key_exists($column, $arr)) {
                    $sorted[$column] = $arr[$column];
                }
            }

            return $sorted;
        }, $this->value);

        $variables = [
            'titles' => $titles,
            'data'   => $data,
        ];

        return view('admin::grid.displayer.table', $variables)->render();
    }

    public function modernPayload(...$arguments)
    {
        if (empty($this->value) || ! is_array($this->value)) {
            return empty($this->value) ? ['kind' => 'table', 'headers' => [], 'rows' => []] : null;
        }

        $titles = $arguments[0] ?? [];
        if (empty($titles)) {
            $first = reset($this->value);
            if (! is_array($first)) {
                return null;
            }
            $titles = array_keys($first);
        }

        if (Arr::isAssoc($titles)) {
            $columns = array_keys($titles);
            $headers = array_values($titles);
        } else {
            $columns = array_values($titles);
            $headers = array_values($titles);
        }

        $rows = [];
        foreach ($this->value as $item) {
            if (! is_array($item)) {
                return null;
            }
            $row = [];
            foreach ($columns as $column) {
                $text = $this->modernText($item[$column] ?? '');
                if ($text === null) {
                    return null;
                }
                $row[] = $text;
            }
            $rows[] = $row;
        }

        return [
            'kind' => 'table',
            'headers' => array_map('strval', $headers),
            'rows' => $rows,
        ];
    }
}
