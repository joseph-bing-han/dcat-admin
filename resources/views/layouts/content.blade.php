@section('content-header')
    <section class="content-header breadcrumbs-top">
        @if($header || $description)
            <h1 class="m-0 flex max-w-full flex-wrap items-baseline gap-2 text-xl leading-7 font-semibold tracking-normal text-primary">
                <span class="capitalize">{!! $header !!}</span>
                <small class="m-0 text-sm leading-5 font-normal text-tertiary">{!! $description !!}</small>
            </h1>
        @elseif($breadcrumb || config('admin.enable_default_breadcrumb'))
            <div>&nbsp;</div>
        @endif

        @include('admin::partials.breadcrumb')

    </section>
@endsection

@section('content')
    @include('admin::partials.alerts')
    @include('admin::partials.exception')

    {!! $content !!}

    @include('admin::partials.toastr')
@endsection

@section('app')
    {!! Dcat\Admin\Admin::asset()->styleToHtml() !!}
    {!! Dcat\Admin\Admin::modern()->pageConfigHtml() !!}

    @php
        $modernHeaderPayload = null;
        if (Dcat\Admin\Admin::modern()->available('layout') && Dcat\Admin\Admin::modern()->capabilityEnabled('layout.header')) {
            $modernHeaderPayload = Dcat\Admin\Modern\LayoutPayload::header($header, $description, $breadcrumb);
        }
    @endphp
    @if($modernHeaderPayload)
        <div data-dcat-react-component="layout.header">
            <div data-dcat-modern-fallback>
                <div class="content-header">
                    @yield('content-header')
                </div>
            </div>
        </div>
        {!! Dcat\Admin\Admin::modern()->payload('layout.header', $modernHeaderPayload, 'layout') !!}
    @else
        <div class="content-header">
            @yield('content-header')
        </div>
    @endif

    <div class="content-body" id="app">
        {{-- 页面埋点--}}
        {!! admin_section(Dcat\Admin\Admin::SECTION['APP_INNER_BEFORE']) !!}

        @yield('content')

        {{-- 页面埋点--}}
        {!! admin_section(Dcat\Admin\Admin::SECTION['APP_INNER_AFTER']) !!}
    </div>

    {!! Dcat\Admin\Admin::asset()->scriptToHtml() !!}
    <div class="extra-html">{!! Dcat\Admin\Admin::html() !!}</div>
    @if(Dcat\Admin\Admin::modern()->available())
        <span data-dcat-modern-request="1" hidden></span>
    @endif
@endsection

@if(! request()->pjax())
    @include('admin::layouts.page')
@else
    <title>{{ Dcat\Admin\Admin::title() }} @if($header) | {{ $header }}@endif</title>

    <script>Dcat.wait()</script>

    {!! Dcat\Admin\Admin::asset()->cssToHtml() !!}
    {!! Dcat\Admin\Admin::asset()->jsToHtml() !!}

    @yield('app')
@endif
