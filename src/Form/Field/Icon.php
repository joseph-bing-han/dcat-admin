<?php

namespace Dcat\Admin\Form\Field;

class Icon extends Text
{
    public static $js = '@fontawesome-iconpicker';
    public static $css = '@fontawesome-iconpicker';

    public function render()
    {
        $this->addScript();

        $this->prepend("<i class='fa {$this->value()}'>&nbsp;</i>")
            ->defaultAttribute('autocomplete', 'off')
            ->defaultAttribute('style', 'width: 160px;flex:none');

        return parent::render();
    }

    protected function addScript()
    {
        $this->script = <<<JS
(function () {
    var iconTimer = null,
        destroyed = false,
        attempts = 0,
        field = $('{$this->getElementClassSelector()}'),
        parent = field.parents('.form-field'),
        showIcon = function (icon) {
            parent.find('.input-group-prepend .input-group-text').html('<i class="' + icon + '"></i>');
        },
        cleanup = function () {
            destroyed = true;
            if (iconTimer) {
                clearTimeout(iconTimer);
                iconTimer = null;
            }
            if (typeof field.iconpicker === 'function') {
                try { field.iconpicker('destroy'); } catch (e) {}
            }
            field.off('keyup');
            parent.find('.iconpicker-item').off('click');
        },
        initIconpicker = function () {
            iconTimer = null;
            if (destroyed) return;

            if (typeof field.iconpicker !== 'function') {
                attempts++;
                if (attempts < 80) {
                    iconTimer = setTimeout(initIconpicker, 25);
                }
                return;
            }
        
            field.iconpicker({placement:'bottomLeft', animation: false});
        
            parent.find('.iconpicker-item').on('click', function (e) {
               showIcon($(this).find('i').attr('class'));
            });
        
            field.on('keyup', function (e) {
                var val = $(this).val();
            
                if (val.indexOf('fa-') !== -1) {
                    if (val.indexOf('fa ') === -1) {
                        val = 'fa ' + val;
                    }
                }
            
                showIcon(val);
            });
        };

    field.data('dcatModernCleanup', cleanup);
    iconTimer = setTimeout(initIconpicker, 1);
})();
JS;
    }
}
