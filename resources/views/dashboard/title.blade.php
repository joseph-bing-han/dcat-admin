<style>
    .dashboard-title .links {
        text-align: center;
        margin-bottom: 2.5rem;
    }
    .dashboard-title .links > a {
        padding: 0 25px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: .1rem;
        text-decoration: none;
        text-transform: uppercase;
        color: #fff;
    }
    .dashboard-title h1 {
        font-weight: 200;
        font-size: 2.5rem;
    }
    .dashboard-title .avatar {
        background: #fff;
        border: 2px solid #fff;
        width: 70px;
        height: 70px;
    }
</style>

@php
    $modernDashboard = Dcat\Admin\Admin::modern()->available('widget') && Dcat\Admin\Admin::modern()->capabilityEnabled('widget.surface');
    $dashboardLinks = [
        ['label' => 'Github', 'url' => 'https://github.com/jqhph/dcat-admin'],
        ['label' => __('admin.documentation'), 'url' => 'http://www.dcatadmin.com/'],
        ['label' => __('admin.extensions'), 'url' => 'http://www.dcatadmin.com/'],
        ['label' => __('admin.demo'), 'url' => 'https://jqhph.github.io/dcat-admin/demo.html'],
    ];
    $modernDashboardPayload = $modernDashboard ? Dcat\Admin\Modern\ViewModel::make('widget', 'widget.surface', [
        'variant' => 'dashboard',
        'title' => 'Dcat Admin',
        'logoUrl' => admin_asset('@admin/images/logo.png'),
        'links' => $dashboardLinks,
    ], [
        'componentId' => 'dashboard-title',
        'slots' => [],
        'compatRequirements' => ['customSlots' => false],
    ]) : null;
@endphp

<div class="dashboard-title{{ $modernDashboard ? '' : ' card bg-primary' }}"{!! $modernDashboard ? ' data-dcat-react-component="widget.surface" data-dcat-modern-family="widget"' : '' !!}>
    @if($modernDashboard)
    {{-- 首屏与 WidgetView 的 Dashboard 卡片保持一致，避免挂载时品牌图像跳位。 --}}
    <div data-dcat-modern-fallback>
        <div class="overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary dcat-modern-card dcat-modern-dashboard">
            <img class="dcat-modern-dashboard__logo" src="{{ $modernDashboardPayload['data']['logoUrl'] }}" alt="Dcat Admin" width="48" height="48">
            <h2 class="dcat-modern-dashboard__title">{{ $modernDashboardPayload['data']['title'] }}</h2>
            <nav class="dcat-modern-dashboard__links" aria-label="Dashboard resources">
                @foreach($dashboardLinks as $link)
                    <a href="{{ $link['url'] }}" target="_blank" rel="noreferrer">{{ $link['label'] }}</a>
                @endforeach
            </nav>
        </div>
    </div>
    @else
    <div class="card-body">
        <div class="text-center ">
            <img class="avatar img-circle shadow mt-1" src="{{ admin_asset('@admin/images/logo.png') }}" alt="">

            <div class="text-center mb-1">
                <h1 class="mb-3 mt-2 text-white">Dcat Admin</h1>
                <div class="links">
                    <a href="https://github.com/jqhph/dcat-admin" target="_blank">Github</a>
                    <a href="http://www.dcatadmin.com/" id="doc-link" target="_blank">{{ __('admin.documentation') }}</a>
                    <a href="http://www.dcatadmin.com/" id="demo-link" target="_blank">{{ __('admin.extensions') }}</a>
                    <a href="https://jqhph.github.io/dcat-admin/demo.html" id="demo-link" target="_blank">{{ __('admin.demo') }}</a>
                </div>
            </div>
        </div>
    </div>
    @endif
</div>
@if($modernDashboard)
{!! Dcat\Admin\Admin::modern()->payload('widget.surface', $modernDashboardPayload, 'widget') !!}
@endif
