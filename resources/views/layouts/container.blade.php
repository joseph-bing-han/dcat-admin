<body
        class="dcat-admin-body sidebar-mini layout-fixed {{ $configData['body_class']}} {{ $configData['sidebar_class'] }}
        {{ $configData['navbar_class'] === 'fixed-top' ? 'navbar-fixed-top' : '' }} " >

<script{!! Dcat\Admin\Admin::modern()->nonceAttribute() !!}>
    var Dcat = CreateDcat({!! Dcat\Admin\Admin::jsVariables() !!});
</script>

{!! admin_section(Dcat\Admin\Admin::SECTION['BODY_INNER_BEFORE']) !!}

<div class="wrapper">
    @include('admin::partials.sidebar')

    @include('admin::partials.navbar')

    <div class="app-content content">
        <div class="content-wrapper" id="{{ $pjaxContainerId }}" role="main" style="top: 0;min-height: 900px;">
            @yield('app')
        </div>
    </div>
</div>

@php
    $modernFooter = Dcat\Admin\Admin::modern()->available('layout') && Dcat\Admin\Admin::modern()->capabilityEnabled('layout.footer');
@endphp
<footer class="main-footer pt-1"{!! $modernFooter ? ' data-dcat-react-component="layout.footer"' : '' !!}>
    <p class="clearfix blue-grey lighten-2 mb-0 text-center">
        @if(is_null(config('admin.footer.copyright', null)))
            <span class="text-center d-block d-md-inline-block mt-25">
                Powered by
                <a target="_blank" href="https://github.com/jqhph/dcat-admin">Dcat Admin</a>
                <span>&nbsp;·&nbsp;</span>
                v{{ Dcat\Admin\Admin::VERSION }}
            </span>
        @else
            <span class="text-center d-block d-md-inline-block mt-25">
                {!! config('admin.footer.copyright') !!}
            </span>
        @endif        <button class="btn btn-primary btn-icon scroll-top pull-right" style="position: fixed;bottom: 2%; right: 10px;display: none">
            <i class="feather icon-arrow-up"></i>
        </button>
    </p>
</footer>

{!! admin_section(Dcat\Admin\Admin::SECTION['BODY_INNER_AFTER']) !!}

{!! Dcat\Admin\Admin::asset()->jsToHtml() !!}


<script{!! Dcat\Admin\Admin::modern()->nonceAttribute() !!}>Dcat.boot();</script>

</body>

</html>
