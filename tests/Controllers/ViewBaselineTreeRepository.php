<?php

namespace Tests\Controllers;

use Dcat\Admin\Contracts\TreeRepository;
use Illuminate\Support\Fluent;

class ViewBaselineTreeRepository implements TreeRepository
{
    public static $lastOrder = [];

    public function getPrimaryKeyColumn()
    {
        return 'id';
    }

    public function getParentColumn()
    {
        return 'parent_id';
    }

    public function getTitleColumn()
    {
        return 'title';
    }

    public function getOrderColumn()
    {
        return 'order';
    }

    public function getKeyName()
    {
        return 'id';
    }

    public function saveOrder($tree = [], $parentId = 0)
    {
        static::$lastOrder = $tree;
    }

    public function withQuery($queryCallback)
    {
        return $this;
    }

    public function toTree()
    {
        return [
            new Fluent([
                'id' => 1,
                'parent_id' => 0,
                'title' => 'Alpha',
                'order' => 1,
                'children' => [
                    new Fluent([
                        'id' => 3,
                        'parent_id' => 1,
                        'title' => 'Alpha child',
                        'order' => 1,
                        'children' => [],
                    ]),
                ],
            ]),
            new Fluent([
                'id' => 2,
                'parent_id' => 0,
                'title' => 'Beta',
                'order' => 2,
                'children' => [],
            ]),
        ];
    }
}
