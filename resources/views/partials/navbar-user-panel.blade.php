@if($user)
<li class="dropdown dropdown-user nav-item">
    <a class="dropdown-toggle nav-link dropdown-user-link" href="#" data-toggle="dropdown"{!! Dcat\Admin\Admin::modern()->available('layout') && Dcat\Admin\Admin::modern()->capabilityEnabled('layout.navbar') ? ' data-dcat-modern-owned-toggle="1"' : '' !!}>
        {{-- Epic 002 / S3：Bootstrap 工具类换成 Tailwind；`dropdown-toggle` / `dropdown-menu` 等由 compat dropdown 驱动，保留。 --}}
        <div class="user-nav hidden min-[576px]:flex">
            <span class="user-name font-semibold">{{ $user->name }}</span>
            <span class="user-status"><i class="fa fa-circle text-success"></i> {{ trans('admin.online') }}</span>
        </div>
        <span>
            <img class="round size-10 rounded-full object-cover" src="{{ $user->getAvatar() }}" alt="avatar" height="40" width="40" />
        </span>
    </a>
    <div class="dropdown-menu dropdown-menu-right">
        <a href="{{ admin_url('auth/setting') }}" class="dropdown-item">
            <i class="feather icon-user"></i> {{ trans('admin.setting') }}
        </a>

        <div class="dropdown-divider"></div>

        <a class="dropdown-item" href="{{ admin_url('auth/logout') }}">
            <i class="feather icon-power"></i> {{ trans('admin.logout') }}
        </a>
    </div>
</li>
@endif
