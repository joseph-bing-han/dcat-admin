
{!! admin_section(Dcat\Admin\Admin::SECTION['NAVBAR_BEFORE']) !!}

@php
    $modernNavbar = Dcat\Admin\Admin::modern()->available('layout') && Dcat\Admin\Admin::modern()->capabilityEnabled('layout.navbar');
@endphp
<nav class="header-navbar navbar-expand-lg navbar
    navbar-with-menu {{ $configData['navbar_class'] }}
    {{ $configData['navbar_color'] }}
        navbar-light navbar-shadow " style="top: 0;"{!! $modernNavbar ? ' data-dcat-react-component="layout.navbar"' : '' !!}>

    <div class="navbar-wrapper">
        <div class="navbar-container content">
            @if(! $configData['horizontal_menu'])
            <div class="bookmark-wrapper mr-auto flex items-center">
                <ul class="nav navbar-nav">
                    <li class="nav-item mr-auto">
                        <a class="nav-link menu-toggle" data-widget="pushmenu" style="cursor: pointer;">
                            <i class="fa fa-bars text-lg"></i>
                        </a>
                    </li>
                </ul>
            </div>
            @endif

            <div class="navbar-collapse flex items-center justify-between">
                <div class="navbar-left flex min-w-0 items-center">
                    {!! Dcat\Admin\Admin::navbar()->render('left') !!}
                </div>

                @if($configData['horizontal_menu'])
                <div class="horizontal-navbar-brand hidden justify-center text-center md:block">
                    <ul class="nav navbar-nav flex-row">
                        <li class="nav-item mr-auto">
                            <a href="{{ admin_url('/') }}">
                                <span class="logo-lg">{!! config('admin.logo') !!}</span>
                            </a>
                        </li>
                    </ul>
                </div>
                @endif

                <div class="navbar-right flex min-w-0 items-center">
                    {!! Dcat\Admin\Admin::navbar()->render() !!}

                    <ul class="nav navbar-nav">
                        {{--User Account Menu--}}
                        {!! admin_section(Dcat\Admin\Admin::SECTION['NAVBAR_USER_PANEL']) !!}

                        {!! admin_section(Dcat\Admin\Admin::SECTION['NAVBAR_AFTER_USER_PANEL']) !!}
                    </ul>
                </div>
            </div>
        </div>
    </div>
</nav>

{!! admin_section(Dcat\Admin\Admin::SECTION['NAVBAR_AFTER']) !!}
