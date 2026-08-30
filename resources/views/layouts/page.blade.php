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
        <link rel="shortcut icon" href="{{ $favicon }}">
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

@extends('admin::layouts.container')
