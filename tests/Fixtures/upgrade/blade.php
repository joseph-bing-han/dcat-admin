<?php

use Dcat\Admin\Layout\Content;
use Dcat\Admin\Widgets\Card;

return function (Content $content) {
    view()->prependNamespace('admin', __DIR__.'/overrides');

    return $content->header('Legacy Blade override')
        ->body(Card::make('Overridden card', view('upgrade::controls')));
};
