<?php

use Dcat\Admin\Admin;
use Dcat\Admin\Layout\Content;
use Dcat\Admin\Widgets\Card;

return function (Content $content) {
    Admin::asset()->alias('@upgrade-extension', ['js' => admin_url('tests/view-upgrade/extension.js')]);
    Admin::requireAssets('@upgrade-extension');
    admin_inject_section(Admin::SECTION['HEAD'], '<script>window.upgradeHeadCompatReady = typeof jQuery === "function" && typeof jQuery.fn.modal === "function";</script>');
    Admin::script('window.upgradeOrder.push("inline"); $("#upgrade-injected").text("Extension ready");');
    Admin::navbar()->right('<span id="upgrade-injected">Extension pending</span>');
    Admin::html('<div id="upgrade-extra">Extension extra HTML</div>');

    return $content->header('Legacy extension application')
        ->body(Card::make('Extension controls', view('upgrade::controls')));
};
