@php
    $modernNavigation = Dcat\Admin\Admin::modern()->available('layout') && Dcat\Admin\Admin::modern()->capabilityEnabled('layout.navigation');
@endphp
<div class="{{ $configData['horizontal_menu'] ? 'header-navbar navbar-expand-sm navbar navbar-horizontal' : 'main-menu' }}"{!! $modernNavigation ? ' data-dcat-react-component="layout.navigation"' : '' !!}>
    <div class="main-menu-content">
        {{--
            Epic 002 / S3：外壳改用 Tailwind 类。`main-sidebar` / `main-horizontal-sidebar` 仍是冻结锚点
            （外壳几何契约与门禁引用它们），Tailwind 负责内边距、边框、背景与折叠态。
        --}}
        <aside class="{{ $configData['horizontal_menu']
            ? 'main-horizontal-sidebar w-full border-b border-secondary bg-primary'
            : 'main-sidebar flex h-full min-h-0 flex-col border-r border-secondary bg-primary' }} {{ $configData['sidebar_style'] }}">

            @if(! $configData['horizontal_menu'])
            <div class="navbar-header flex min-h-[52px] items-center border-b border-secondary px-4 py-2">
                <ul class="nav navbar-nav flex w-full flex-nowrap items-center">
                    <li class="nav-item mr-auto">
                        <a href="{{ admin_url('/') }}" class="navbar-brand inline-flex min-h-8 items-center p-0">
                            {{--
                                折叠态的品牌切换（logo-lg ↔ logo-mini）当前仍由 compat facade 的
                                `.dcat-modern-active.sidebar-collapse … .logo-*` 规则负责：它的特异性高于 Tailwind 工具类，
                                而 `[.sidebar-collapse_&]:` 这类 arbitrary variant 在 Tailwind v4 下没有生成出对应规则。
                                因此这里保持原始结构，不写既会被覆盖、又形同虚设的类；S6 收口 facade 时再一并迁到 Tailwind。
                            --}}
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
            <div class="{{ $configData['horizontal_menu'] ? 'px-1 py-0' : 'sidebar min-h-0 flex-1 overflow-y-auto pb-3' }}">
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
