<div {!! $attributes !!}>
    <div class="card-header d-flex justify-content-between align-items-start pb-0">
        <div>
            @if($icon)
            <div class="avatar bg-rgba-{{ $style }} p-50 m-0">
                <div class="avatar-content">
                    <i class="{{ $icon }} text-{{ $style }} font-medium-5"></i>
                </div>
            </div>
            @endif

            @if($title)
                <h2 class="card-title mb-1">{!! $title !!}</h2>
            @endif

            <div class="metric-header">{!! $header !!}</div>
        </div>

        @if (! empty($subTitle))
            <span class="metric-subtitle">
                {{ $subTitle }}
            </span>
        @endif

        @if(! empty($dropdown))
        <div class="dropdown chart-dropdown">
            <button type="button" class="btn btn-sm btn-light shadow-0 dropdown-toggle waves-effect" data-toggle="dropdown" aria-haspopup="menu" aria-expanded="false">
                {{ current($dropdown) }}
            </button>
            <div class="dropdown-menu dropdown-menu-right">
                @foreach($dropdown as $key => $value)
                <li class="dropdown-item"><a href="javascript:void(0)" class="select-option" data-option="{{ $key }}" @if($loop->first) aria-current="true" @endif>{{ $value }}</a></li>
                @endforeach
            </div>
        </div>
        @endif
    </div>

    <div class="metric-content">{!! $content !!}</div>
</div>
