<?php

use Dcat\Admin\Layout\Content;
use Dcat\Admin\Widgets\Card;

// 只使用 2.2.x 已有 API；升级验证比较本文件摘要，禁止为新版改业务代码。
return function (Content $content) {
    return $content->header('Legacy standard application')
        ->body(Card::make('Legacy controls', view('upgrade::controls')));
};
