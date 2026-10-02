<div data-dcat-tab-widget {!! $attributes !!}>
    <ul class="nav nav-tabs {{ $tabStyle }}" @if($isTabList) role="tablist" @endif>
        @foreach($tabs as $id => $tab)
            @if($tab['type'] == \Dcat\Admin\Widgets\Tab::TYPE_CONTENT)
                <li class="nav-item" @if($isTabList) role="presentation" @endif>
                    <a href="#tab_{{ $tab['id'] }}" id="tab_{{ $tab['id'] }}_trigger" class=" nav-link  {{ $id == $active ? 'active' : '' }}" data-toggle="tab" @if($isTabList) role="tab" aria-controls="tab_{{ $tab['id'] }}" aria-selected="{{ $id == $active ? 'true' : 'false' }}" tabindex="{{ $id == $active ? '0' : '-1' }}" @endif>{!! $tab['title'] !!}</a>
                </li>
            @elseif($tab['type'] == \Dcat\Admin\Widgets\Tab::TYPE_LINK)
                <li class="nav-item" >
                    <a href="{{ $tab['href'] }}" class=" nav-link  {{ $id == $active ? 'active' : '' }}">{!! $tab['title'] !!}</a>
                </li>
            @endif
        @endforeach

        @if (!empty($dropDown))
        <li class="dropdown nav-item">
            <a class="dropdown-toggle nav-link" data-toggle="dropdown" href="#">
                Dropdown <span class="caret"></span>
            </a>
            <ul class="dropdown-menu" role="menu">
                @foreach($dropDown as $link)
                <li role="presentation"><a role="menuitem" tabindex="-1" href="{{ $link['href'] }}">{!! $link['name'] !!}</a></li>
                @endforeach
            </ul>
        </li>
        @endif
        <li class="nav-item pull-right header" @if($isTabList) role="presentation" @endif>{!! $title !!}</li>
    </ul>

    <div class="tab-content" style="{!! $padding !!}">
        @foreach($tabs as $id => $tab)
        <div class="tab-pane {{ $id == $active ? 'active' : '' }}" id="tab_{{ $tab['id'] }}" @if($isTabList) role="tabpanel" aria-labelledby="tab_{{ $tab['id'] }}_trigger" @endif>
            {!! $tab['content'] ?? '' !!}
        </div>
        @endforeach

    </div>
</div>
