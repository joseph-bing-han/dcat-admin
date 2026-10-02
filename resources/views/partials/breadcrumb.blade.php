@if ($breadcrumb)
    <div class="breadcrumb-wrapper w-full">
    <ol class="breadcrumb m-0 mt-2 flex max-w-full list-none flex-nowrap items-center gap-0 overflow-x-auto p-0 whitespace-nowrap">
        <li class="breadcrumb-item m-0 inline-flex flex-none list-none items-center text-tertiary"><a class="text-tertiary" href="{{ admin_url('/') }}"><i class="fa fa-dashboard"></i> {{admin_trans('admin.home')}}</a></li>
        @foreach($breadcrumb as $item)
            @if($loop->last)
                <li class="active breadcrumb-item m-0 inline-flex flex-none list-none items-center font-medium text-secondary not-first:before:mx-2 not-first:before:text-fg-quaternary not-first:before:content-['/']">
                    @if (\Illuminate\Support\Arr::has($item, 'icon'))
                        <i class="fa {{ $item['icon'] }}"></i>
                    @endif
                    {{ $item['text'] }}
                </li>
            @else
                <li class="breadcrumb-item m-0 inline-flex flex-none list-none items-center text-tertiary not-first:before:mx-2 not-first:before:text-fg-quaternary not-first:before:content-['/']">
                    <a class="text-tertiary" href="{{ admin_url(\Illuminate\Support\Arr::get($item, 'url')) }}">
                        @if (\Illuminate\Support\Arr::has($item, 'icon'))
                            <i class="fa {{ $item['icon'] }}"></i>
                        @endif
                        {{ $item['text'] }}
                    </a>
                </li>
            @endif
        @endforeach
    </ol>
    </div>
@elseif(config('admin.enable_default_breadcrumb'))
    <div class="breadcrumb-wrapper w-full">
    <ol class="breadcrumb m-0 mt-2 flex max-w-full list-none flex-nowrap items-center gap-0 overflow-x-auto p-0 whitespace-nowrap">
        <li class="breadcrumb-item m-0 inline-flex flex-none list-none items-center text-tertiary"><a class="text-tertiary" href="{{ admin_url('/') }}"><i class="fa fa-dashboard"></i> {{admin_trans('admin.home')}}</a></li>
        @for($i = 2; $i <= ($len = count(Request::segments())); $i++)
            <li class="breadcrumb-item m-0 inline-flex flex-none list-none items-center text-tertiary not-first:before:mx-2 not-first:before:text-fg-quaternary not-first:before:content-['/']">
                @if($i == $len) <a href=""> @endif
                {{admin_trans_label(Request::segment($i))}}
                @if($i == $len) </a> @endif
            </li>
        @endfor
    </ol>
    </div>
@endif

<div class="clear-both"></div>
