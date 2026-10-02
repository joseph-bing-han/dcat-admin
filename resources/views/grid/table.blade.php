@php
    $modernGrid = Dcat\Admin\Admin::modern()->available('grid') && Dcat\Admin\Admin::modern()->capabilityEnabled('grid.read');
    $modernGridPayload = $modernGrid ? Dcat\Admin\Modern\GridViewModel::make($grid, $tableId) : null;
    $gridToolbar = view('admin::grid.table-toolbar', get_defined_vars())->render();
    $gridFilter = $grid->renderFilter();
    $gridHeader = $grid->renderHeader();
    $modernToolbar = $modernGrid && trim($gridToolbar.$gridFilter.$gridHeader) !== '';
@endphp
@if($modernGrid)
<div class="dcat-modern-scope dcat-modern-grid dcat-modern-grid-interactive" data-dcat-react-component="grid.read">
    <div data-dcat-modern-fallback>
@endif
<div class="{{ $modernGrid ? 'dcat-modern-grid-view' : 'dcat-box' }}"{!! Dcat\Admin\Admin::modern()->available('grid') ? ' data-dcat-modern-family="grid"' : '' !!}>

    @if($modernToolbar)<div class="dcat-modern-grid-toolbar">@endif
    <div{!! $modernGrid ? ' data-dcat-modern-legacy-island="grid-toolbar" data-dcat-modern-slot="grid-toolbar"' : ' class="d-block pb-0"' !!}>
        {!! $gridToolbar !!}
    </div>

    @if($modernGrid)<div data-dcat-modern-legacy-island="grid-toolbar" data-dcat-modern-slot="grid-filter">@endif
        {!! $gridFilter !!}
    @if($modernGrid)</div>@endif

    @if($modernGrid)<div data-dcat-modern-legacy-island="grid-toolbar" data-dcat-modern-slot="grid-header-extra">@endif
        {!! $gridHeader !!}
    @if($modernGrid)</div>@endif

    @if($modernToolbar)</div>@endif
    @if($modernGrid)
    <div class="dcat-modern-grid-table-card">
    @endif
    <div class="{{ $modernGrid ? 'dcat-modern-table-wrap' : '' }} {!! $grid->formatTableParentClass() !!}">
        <table class="{{ $modernGrid ? 'dcat-modern-table' : '' }} {{ $grid->formatTableClass() }}" id="{{ $tableId }}" >
            <thead>
            @if ($headers = $grid->getVisibleComplexHeaders())
                <tr{!! $modernGrid && data_get($modernGridPayload, 'data.complexHeaderCompat') ? ' data-dcat-modern-legacy-island="grid-header-cell" data-dcat-modern-slot="grid-complex-header"' : '' !!}>
                    @foreach($headers as $header)
                        {!! $header->render() !!}
                    @endforeach
                </tr>
            @endif
            <tr>
                @foreach($grid->getVisibleColumns() as $column)
                    @php
                        $modernColumnIndex = $loop->index;
                        $modernHeaderCompat = $modernGrid && data_get($modernGridPayload, 'data.columns.'.$modernColumnIndex.'.header.mode') === 'compat';
                    @endphp
                    <th {!! $column->formatTitleAttributes() !!}{!! $modernHeaderCompat ? ' data-dcat-modern-legacy-island="grid-header-cell" data-dcat-modern-slot="grid-header-'.$modernColumnIndex.'"' : '' !!}>@if($modernGrid && ! $modernHeaderCompat){{ data_get($modernGridPayload, 'data.columns.'.$modernColumnIndex.'.label') }}@if($sort = data_get($modernGridPayload, 'data.columns.'.$modernColumnIndex.'.header.sort'))<span aria-hidden="true">&nbsp;</span><a href="{{ $sort['href'] }}" class="{{ $sort['className'] }}" aria-label="{{ $sort['label'] }}" title="{{ $sort['label'] }}"></a>@endif @else{!! $column->getLabel() !!}{!! $column->renderHeader() !!}@endif</th>
                @endforeach
            </tr>
            </thead>

            @if ($grid->hasQuickCreate())
                {!! $grid->renderQuickCreate() !!}
            @endif

            <tbody>
            @foreach($grid->rows() as $row)
                @php
                    $modernRowIndex = $loop->index;
                @endphp
                <tr {!! $row->rowAttributes() !!}>
                    @foreach($grid->getVisibleColumnNames() as $name)
                        @php
                            $modernCellIndex = $loop->index;
                            $modernCell = $modernGrid ? data_get($modernGridPayload, 'data.rows.'.$modernRowIndex.'.cells.'.$modernCellIndex) : null;
                            $modernCellSlot = is_array($modernCell) && ($modernCell['kind'] ?? null) === 'compat' ? ($modernCell['slotId'] ?? null) : null;
                        @endphp
                        <td {!! $row->columnAttributes($name) !!}{!! $modernCellSlot ? ' data-dcat-modern-legacy-island="grid-cell" data-dcat-modern-slot="'.$modernCellSlot.'"' : '' !!}>@if($modernGrid && ! $modernCellSlot)@include('admin::grid.modern-cell', ['cell' => $modernCell])@else{!! $row->column($name) !!}@endif</td>
                    @endforeach
                </tr>
            @endforeach
            @if ($grid->rows()->isEmpty())
                <tr>
                    <td colspan="{!! count($grid->getVisibleColumnNames()) !!}">
                        @if($modernGrid)
                            <div class="dcat-modern-grid-empty" role="status"><h2>{{ trans('admin.no_data') }}</h2></div>
                        @else
                            <div style="margin:5px 0 0 10px;"><span class="help-block" style="margin-bottom:0"><i class="feather icon-alert-circle"></i>&nbsp;{{ trans('admin.no_data') }}</span></div>
                        @endif
                    </td>
                </tr>
            @endif
            </tbody>
        </table>
    </div>
    @if($modernGrid)</div>@endif

    @if($modernGrid)<div class="dcat-modern-grid-footer" data-dcat-modern-legacy-island="grid-footer" data-dcat-modern-slot="grid-footer">@endif
        {!! $grid->renderFooter() !!}
    @if($modernGrid)</div>@endif

    @if($modernGrid)
        @include('admin::grid.modern-pagination', ['pagination' => data_get($modernGridPayload, 'data.pagination')])
    @else
        {!! $grid->renderPagination() !!}
    @endif

</div>
@if($modernGrid)
    </div>
</div>
{!! Dcat\Admin\Admin::modern()->payload('grid.read', $modernGridPayload, 'grid') !!}
@endif
