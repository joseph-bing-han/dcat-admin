@php
    $modernNavigation = Dcat\Admin\Admin::modern()->available('layout') && Dcat\Admin\Admin::modern()->capabilityEnabled('layout.navigation');
@endphp
<div class="{{ $configData['horizontal_menu'] ? 'header-navbar navbar-expand-sm navbar navbar-horizontal' : 'main-menu' }}"{!! $modernNavigation ? ' data-dcat-react-component="layout.navigation"' : '' !!}>
    <div class="main-menu-content">
        <aside class="{{ $configData['horizontal_menu'] ? 'main-horizontal-sidebar' : 'main-sidebar shadow' }} {{ $configData['sidebar_style'] }}">

            @if(! $configData['horizontal_menu'])
            <div class="navbar-header">
                <ul class="nav navbar-nav flex-row">
                    <li class="nav-item mr-auto">
                        <a href="{{ admin_url('/') }}" class="navbar-brand waves-effect waves-light">
                            <span class="logo-mini">{!! config('admin.logo-mini') !!}</span>
                            <span class="logo-lg">{!! config('admin.logo') !!}</span>
                        </a>
                    </li>
                </ul>
            </div>
            @endif

            @php
                $modernMenuPayload = null;
                if (Dcat\Admin\Admin::modern()->available('layout') && Dcat\Admin\Admin::modern()->capabilityEnabled('layout.menu')) {
                    $modernMenuPayload = Dcat\Admin\Admin::menu()->modernPayload();
                }
            @endphp
            <div class="p-0 {{ $configData['horizontal_menu'] ? 'pl-1 pr-1' : 'sidebar pb-3' }}">
                @if($modernMenuPayload)
                    <div data-dcat-react-component="layout.menu">
                        <div data-dcat-modern-fallback>
                            <ul class="nav nav-pills nav-sidebar {{ $configData['horizontal_menu'] ? '' : 'flex-column' }}"
                                {!! $configData['horizontal_menu'] ? '' : 'data-widget="treeview"' !!}
                                 style="padding-top: 10px">
                                {!! admin_section(Dcat\Admin\Admin::SECTION['LEFT_SIDEBAR_MENU_TOP']) !!}
                                {!! admin_section(Dcat\Admin\Admin::SECTION['LEFT_SIDEBAR_MENU']) !!}
                                {!! admin_section(Dcat\Admin\Admin::SECTION['LEFT_SIDEBAR_MENU_BOTTOM']) !!}
                            </ul>
                        </div>
                    </div>
                    {!! Dcat\Admin\Admin::modern()->payload('layout.menu', $modernMenuPayload, 'layout') !!}
                @else
                    <ul class="nav nav-pills nav-sidebar {{ $configData['horizontal_menu'] ? '' : 'flex-column' }}"
                        {!! $configData['horizontal_menu'] ? '' : 'data-widget="treeview"' !!}
                         style="padding-top: 10px">
                        {!! admin_section(Dcat\Admin\Admin::SECTION['LEFT_SIDEBAR_MENU_TOP']) !!}
                        {!! admin_section(Dcat\Admin\Admin::SECTION['LEFT_SIDEBAR_MENU']) !!}
                        {!! admin_section(Dcat\Admin\Admin::SECTION['LEFT_SIDEBAR_MENU_BOTTOM']) !!}
                    </ul>
                @endif
            </div>
        </aside>
    </div>
</div>