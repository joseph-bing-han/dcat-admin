<?php

namespace Tests\Controllers;

use Dcat\Admin\Grid;
use Dcat\Admin\Http\Repositories\Administrator;

class ViewBaselineLazyGrid extends Grid\LazyRenderable
{
    public function grid(): Grid
    {
        return Grid::make(Administrator::with(['roles']), function (Grid $grid) {
            $grid->column('id', 'ID');
            $grid->column('username');
            $grid->disableCreateButton();
            $grid->disableFilter();
            $grid->disableBatchActions();
            $grid->disableRefreshButton();
        });
    }
}
