@if(!empty($pagination['items']))
<div class="dcat-modern-grid-pagination">
    @if(!empty($pagination['range']['label']))<span class="d-none d-sm-inline dcat-modern-grid-pagination-range">{{ $pagination['range']['label'] }}</span>@endif
    <nav aria-label="Pagination" class="dcat-modern-grid-pagination-nav">
        <ul class="{{ $pagination['className'] }}">
            @foreach($pagination['items'] as $item)
                <li class="{{ $item['className'] }}">
                    @php
                        $label = trim($item['label']) !== '' ? $item['label'] : (($item['rel'] ?? '') === 'prev' ? '‹' : '›');
                    @endphp
                    @if(!empty($item['href']) && !$item['disabled'])
                        <a class="page-link" href="{{ $item['href'] }}"@isset($item['rel']) rel="{{ $item['rel'] }}"@endisset @isset($item['ariaLabel']) aria-label="{{ $item['ariaLabel'] }}"@endisset>{{ $label }}</a>
                    @else
                        <span class="page-link"@if($item['active']) aria-current="page"@endif @isset($item['ariaLabel']) aria-label="{{ $item['ariaLabel'] }}"@endisset>{{ $label }}</span>
                    @endif
                </li>
            @endforeach
        </ul>
    </nav>
    @if(!empty($pagination['perPage']['options']))
        <div class="pull-right d-none d-sm-inline per-pages-selector" data-dcat-per-page-name="{{ $pagination['perPage']['name'] }}">
            <span class="dropdown dropup">
                <button type="button" class="btn btn-white dropdown-toggle btn-sm" data-toggle="dropdown" aria-expanded="false" aria-label="Rows per page: {{ $pagination['perPage']['current'] }}">{{ $pagination['perPage']['current'] }}</button>
                <ul class="dropdown-menu" role="menu">
                    @foreach($pagination['perPage']['options'] as $option)
                        <li class="dropdown-item{{ $option['active'] ? ' active' : '' }}"><a href="{{ $option['href'] }}"@if($option['active']) aria-current="page"@endif>{{ $option['label'] }}</a></li>
                    @endforeach
                </ul>
            </span>
        </div>
    @endif
</div>
@endif
