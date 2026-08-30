<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="{{ Dcat\Admin\Admin::modern()->runtimeAvailable() ? 'dcat-modern-root' : '' }}">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="chrome=1,IE=edge">
    {{-- 默认使用谷歌浏览器内核--}}
    <meta name="renderer" content="webkit">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">

    <title>@if(! empty($header)){{ $header }} | @endif {{ Dcat\Admin\Admin::title() }}</title>

    @if(! config('admin.disable_no_referrer_meta'))
        <meta name="referrer" content="no-referrer"/>
    @endif

    @if(! empty($favicon = Dcat\Admin\Admin::favicon()))
        <link rel="shortcut icon" href="{{$favicon}}">
    @endif

    @php
        $headSectionHtml = (string) admin_section(Dcat\Admin\Admin::SECTION['HEAD']);
        Dcat\Admin\Admin::asset()->prepareHtml($headSectionHtml);
        $modernHead = Dcat\Admin\Admin::modern()->runtimeAvailable();
    @endphp

    @if($modernHead)
        {!! Dcat\Admin\Admin::modern()->headHtml() !!}
        {!! Dcat\Admin\Admin::asset()->headerJsToHtml() !!}
        {!! $headSectionHtml !!}
    @else
        {!! $headSectionHtml !!}
        {!! Dcat\Admin\Admin::modern()->headHtml() !!}
        {!! Dcat\Admin\Admin::asset()->headerJsToHtml() !!}
    @endif

    {!! Dcat\Admin\Admin::asset()->cssToHtml() !!}
</head>

@php
    $modernFullPage = Dcat\Admin\Admin::modern()->available('layout') && Dcat\Admin\Admin::modern()->capabilityEnabled('layout.full-page');
    $modernFullPagePayload = $modernFullPage ? Dcat\Admin\Modern\ViewModel::make('layout', 'layout.full-page', [
        'pjaxContainerId' => (string) $pjaxContainerId,
        'bodyClass' => (string) $configData['body_class'],
    ], [
        'componentId' => 'full-page',
    ]) : null;
@endphp
<body class="dcat-admin-body full-page {{ $configData['body_class'] }}"{!! $modernFullPage ? ' data-dcat-react-component="layout.full-page"' : '' !!}>

<script>
    var Dcat = CreateDcat({!! Dcat\Admin\Admin::jsVariables() !!});
</script>

@if($modernFullPage)
{!! Dcat\Admin\Admin::modern()->payload('layout.full-page', $modernFullPagePayload, 'layout') !!}
@endif

{{-- 页面埋点 --}}
{!! admin_section(Dcat\Admin\Admin::SECTION['BODY_INNER_BEFORE']) !!}

<div class="app-content content">
    <div class="wrapper" id="{{ $pjaxContainerId }}" role="main">
        @yield('app')
    </div>
</div>

{!! admin_section(Dcat\Admin\Admin::SECTION['BODY_INNER_AFTER']) !!}

{!! Dcat\Admin\Admin::asset()->jsToHtml() !!}


<script>Dcat.boot();</script>

</body>
</html>
