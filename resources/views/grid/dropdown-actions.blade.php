@if (!empty($default) || !empty($custom))
<div class="grid-dropdown-actions dropdown">
    <a href="#" style="padding:0 10px;" data-toggle="dropdown"{!! Dcat\Admin\Admin::modern()->available('grid') && Dcat\Admin\Admin::modern()->capabilityEnabled('grid.interactions') ? ' data-dcat-modern-owned-toggle="1"' : '' !!} aria-label="{{ trans('admin.more') }}" title="{{ trans('admin.more') }}">
        <i class="feather icon-more-vertical"></i>
    </a>
    <ul class="dropdown-menu" style="left: -65px;">

        @foreach($default as $action)
            <li class="dropdown-item">{!! Dcat\Admin\Support\Helper::render($action) !!}</li>
        @endforeach

        @if(!empty($custom))

            @if(!empty($default))
                <li class="dropdown-divider"></li>
            @endif

            @foreach($custom as $action)
                <li class="dropdown-item">{!! $action !!}</li>
            @endforeach
        @endif
    </ul>
</div>
@endif
