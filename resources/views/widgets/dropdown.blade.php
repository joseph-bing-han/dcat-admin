@if($modern)
    @if($hasButton)
        <span class="dcat-modern-widget-dropdown drop{{ $direction }}" data-dcat-native-widget-dropdown="1" data-dcat-dropdown-select="{{ $click ? '1' : '0' }}">
            <button id="{{ $buttonId }}" type="button" class="dcat-modern-button dcat-modern-button--secondary {{ $button['class'] }}" style="{{ $button['style'] }}" data-dcat-widget-dropdown-trigger="1" aria-label="{{ $buttonLabel }}" @if($buttonTitle) title="{{ $buttonTitle }}" @endif aria-haspopup="menu" aria-expanded="false" aria-controls="{{ $menuId }}">
                <span data-dcat-dropdown-label>{!! $defaultLabel !!}</span>
            </button>
            <ul id="{{ $menuId }}" class="dcat-modern-widget-dropdown__menu" role="menu" hidden>{!! $options !!}</ul>
        </span>
    @else
        <ul class="dcat-modern-widget-dropdown__menu dcat-modern-widget-dropdown__menu--static" role="menu">{!! $options !!}</ul>
    @endif
@else
    @if($hasButton)
        <span class="drop{{ $direction }}" style="display:inline-block">
            <a id="{{ $buttonId }}" class="dropdown-toggle {{ $button['class'] }}" style="{{ $button['style'] }}" data-toggle="dropdown"{!! $modernOwnedToggle ? ' data-dcat-modern-owned-toggle="1"' : '' !!} href="javascript:void(0)" aria-label="{{ $buttonLabel }}" @if($buttonTitle) title="{{ $buttonTitle }}" @endif aria-haspopup="menu" aria-expanded="false" aria-controls="{{ $menuId }}">
                <stub>{!! $button['text'] !!}</stub>
                <span class="caret"></span>
            </a>
            <ul class="dropdown-menu">{!! $options !!}</ul>
        </span>
    @else
        <ul class="dropdown-menu">{!! $options !!}</ul>
    @endif

    @if($click)
        <script>
            var $btn = $('#{{ $buttonId }}'),
                $a = $btn.parent().find('ul li a'),
                text = String($btn.text());

            $a.on('click', function () {
                $btn.find('stub').html($(this).html() + ' &nbsp;');
            });

            if (text.replace(/(^\s*)|(\s*$)/g,"")) {
                $btn.find('stub').html(text + ' &nbsp;');
            } else {
                (!$a.length) || $btn.find('stub').html($($a[0]).html() + ' &nbsp;');
            }
        </script>
    @endif
@endif
