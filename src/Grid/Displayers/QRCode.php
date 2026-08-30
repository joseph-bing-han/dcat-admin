<?php

namespace Dcat\Admin\Grid\Displayers;

use Dcat\Admin\Admin;

/**
 * Class QRCode.
 */
class QRCode extends AbstractDisplayer
{
    protected static $js = [
        '@qrcode',
    ];

    protected function addScript()
    {
        $script = <<<'JS'
$('.grid-column-qrcode').on('click', function () {
    var $this = $(this), data = $this.data();
    data.render = 'image';
    $this.qrcode(data);
    
    var img = $this.find('img');
    
    $this.attr('data-content', '<img width="'+data.width+'" height="'+data.height+'" src="'+img.attr('src')+'">');
    img.remove();
    
    $this.popover('show')
});
JS;
        Admin::script($script);
    }

    public function display($formatter = null, $width = 150, $height = 150)
    {
        $this->addScript();

        $content = $this->column->getOriginal();

        if ($formatter instanceof \Closure) {
            $content = $formatter->call($this->row, $content);
        }

        return <<<HTML
<a href="javascript:void(0);" 
    class="grid-column-qrcode text-muted" 
    data-text="{$content}" 
    data-width="{$width}"
    data-height="{$height}"
    data-trigger="trigger" 
    data-html="true" 
    data-toggle='popover' 
    tabindex='0'
    aria-label="QR code"
    title="QR code"
>
    <i class="fa fa-qrcode" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 16 16" focusable="false" aria-hidden="true"><path fill="currentColor" d="M1 1h5v5H1V1zm2 2v1h1V3H3zm7-2h5v5h-5V1zm2 2v1h1V3h-1zM1 10h5v5H1v-5zm2 2v1h1v-1H3zm6-3h2v2H9V9zm3 0h3v2h-3V9zm-3 3h2v3H9v-3zm3 1h1v2h-1v-2zm2-1h1v3h-1v-3z"/></svg></i>
</a>&nbsp;{$this->value}
HTML;
    }
}
