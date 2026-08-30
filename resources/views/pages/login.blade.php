<style>
    .login-box {
        margin-top: -10rem;
        padding: 5px;
    }
    .login-card-body {
        padding: 1.5rem 1.8rem 1.6rem;
    }
    .card, .card-body {
        border-radius: .25rem
    }
    .login-btn {
        padding-left: 2rem!important;;
        padding-right: 1.5rem!important;
    }
    .content {
        overflow-x: hidden;
    }
    .form-group .control-label {
        text-align: left;
    }
</style>

@php
    $modernSystem = Dcat\Admin\Admin::modern()->available('system') && Dcat\Admin\Admin::modern()->capabilityEnabled('system.page');
    $modernSystemPayload = $modernSystem ? Dcat\Admin\Modern\ViewModel::make('system', 'system.page', [
        'page' => 'login',
        'action' => admin_url('auth/login'),
        'remember' => (bool) config('admin.auth.remember'),
        'csrf' => csrf_token(),
        'adminName' => trim(strip_tags((string) config('admin.name'))),
        'welcome' => __('admin.welcome_back'),
        'submitLabel' => __('admin.login'),
        'labels' => [
            'username' => trans('admin.username'),
            'password' => trans('admin.password'),
            'remember' => trans('admin.remember_me'),
        ],
        'old' => [
            'username' => old('username'),
            'remember' => (bool) old('remember'),
        ],
        'errors' => [
            'username' => $errors->get('username'),
            'password' => $errors->get('password'),
        ],
    ], [
        'componentId' => 'login-page',
        'slots' => [],
        'compatRequirements' => ['jquery' => false, 'pluginAdapters' => [], 'customSlots' => false],
    ]) : null;
@endphp
<div class="login-page bg-40"{!! $modernSystem ? ' data-dcat-react-component="system.page" data-dcat-modern-family="system" data-dcat-modern-server-fallback="1"' : '' !!}>
    @if($modernSystem)<div data-dcat-modern-fallback>@endif
    <div class="login-box">
        <div class="login-logo mb-2">
            {{ config('admin.name') }}
        </div>
        <div class="card">
            <div class="card-body login-card-body shadow-100">
                <p class="login-box-msg mt-1 mb-1">{{ __('admin.welcome_back') }}</p>

                <form id="login-form" method="POST" action="{{ admin_url('auth/login') }}"{!! $modernSystem ? ' data-dcat-modern-slot="login-form"' : '' !!}>

                    <input type="hidden" name="_token" value="{{ csrf_token() }}"/>

                    <fieldset class="form-label-group form-group position-relative has-icon-left">
                        <input
                                type="text"
                                class="form-control {{ $errors->has('username') ? 'is-invalid' : '' }}"
                                name="username"
                                placeholder="{{ trans('admin.username') }}"
                                value="{{ old('username') }}"
                                required
                                autofocus
                        >

                        <div class="form-control-position">
                            <i class="feather icon-user"></i>
                        </div>

                        <label for="email">{{ trans('admin.username') }}</label>

                        <div class="help-block with-errors"></div>
                        @if($errors->has('username'))
                            <span class="invalid-feedback text-danger" role="alert">
                                            @foreach($errors->get('username') as $message)
                                    <span class="control-label" for="inputError"><i class="feather icon-x-circle"></i> {{$message}}</span><br>
                                @endforeach
                                        </span>
                        @endif
                    </fieldset>

                    <fieldset class="form-label-group form-group position-relative has-icon-left">
                        <input
                                minlength="5"
                                maxlength="20"
                                id="password"
                                type="password"
                                class="form-control {{ $errors->has('password') ? 'is-invalid' : '' }}"
                                name="password"
                                placeholder="{{ trans('admin.password') }}"
                                required
                                autocomplete="current-password"
                        >

                        <div class="form-control-position">
                            <i class="feather icon-lock"></i>
                        </div>
                        <label for="password">{{ trans('admin.password') }}</label>

                        <div class="help-block with-errors"></div>
                        @if($errors->has('password'))
                            <span class="invalid-feedback text-danger" role="alert">
                                            @foreach($errors->get('password') as $message)
                                    <span class="control-label" for="inputError"><i class="feather icon-x-circle"></i> {{$message}}</span><br>
                                @endforeach
                                            </span>
                        @endif

                    </fieldset>
                    <div class="form-group d-flex justify-content-between align-items-center">
                        <div class="text-left">
                            @if(config('admin.auth.remember'))
                            <fieldset class="checkbox">
                                <div class="vs-checkbox-con vs-checkbox-primary">
                                    <input id="remember" name="remember"  value="1" type="checkbox" {{ old('remember') ? 'checked' : '' }}>
                                    <span class="vs-checkbox">
                                                        <span class="vs-checkbox--check">
                                                          <i class="vs-icon feather icon-check"></i>
                                                        </span>
                                                    </span>
                                    <span> {{ trans('admin.remember_me') }}</span>
                                </div>
                            </fieldset>
                            @endif
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary float-right login-btn">

                        {{ __('admin.login') }}
                        &nbsp;
                        <i class="feather icon-arrow-right"></i>
                    </button>
                </form>

            </div>
        </div>
    </div>
    @if($modernSystem)</div>@endif
</div>

@if($modernSystem)
{!! Dcat\Admin\Admin::modern()->payload('system.page', $modernSystemPayload, 'system') !!}
@endif

@unless($modernSystem)
<script>
Dcat.ready(function () {
    // ajax表单提交
    $('#login-form').form({
        validate: true,
    });
});
</script>
@endunless
