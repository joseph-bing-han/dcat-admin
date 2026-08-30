@php
    $modernGrid = Dcat\Admin\Admin::modern()->available('grid') && Dcat\Admin\Admin::modern()->capabilityEnabled('grid.read');
    $modernGridPayload = $modernGrid ? Dcat\Admin\Modern\GridViewModel::make($grid, $tableId) : null;
@endphp
@if($modernGrid)
<div data-dcat-react-component="grid.read">
    <div data-dcat-modern-fallback>
@endif
<div class="dcat-box"{!! Dcat\Admin\Admin::modern()->available('grid') ? ' data-dcat-modern-family="grid"' : '' !!}>

    <div class="d-block pb-0"{!! $modernGrid ? ' data-dcat-modern-slot="grid-toolbar"' : '' !!}>
        @include('admin::grid.table-toolbar')
    </div>

    @if($modernGrid)<div data-dcat-modern-slot="grid-filter">@endif
        {!! $grid->renderFilter() !!}
    @if($modernGrid)</div>@endif

    @if($modernGrid)<div data-dcat-modern-slot="grid-header-extra">@endif
        {!! $grid->renderHeader() !!}
    @if($modernGrid)</div>@endif

    <div class="{!! $grid->formatTableParentClass() !!}">
        <table class="{{ $grid->formatTableClass() }}" id="{{ $tableId }}" >
            <thead>
            @if ($headers = $grid->getVisibleComplexHeaders())
                <tr{!! $modernGrid && data_get($modernGridPayload, 'data.complexHeaderCompat') ? ' data-dcat-modern-slot="grid-complex-header"' : '' !!}>
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
                    <th {!! $column->formatTitleAttributes() !!}{!! $modernHeaderCompat ? ' data-dcat-modern-slot="grid-header-'.$modernColumnIndex.'"' : '' !!}>{!! $column->getLabel() !!}{!! $column->renderHeader() !!}</th>
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
                        <td {!! $row->columnAttributes($name) !!}{!! $modernCellSlot ? ' data-dcat-modern-slot="'.$modernCellSlot.'"' : '' !!}>{!! $row->column($name) !!}</td>
                    @endforeach
                </tr>
            @endforeach
            @if ($grid->rows()->isEmpty())
                <tr>
                    <td colspan="{!! count($grid->getVisibleColumnNames()) !!}">
                        <div style="margin:5px 0 0 10px;"><span class="help-block" style="margin-bottom:0"><i class="feather icon-alert-circle"></i>&nbsp;{{ trans('admin.no_data') }}</span></div>
                    </td>
                </tr>
            @endif
            </tbody>
        </table>
    </div>

    @if($modernGrid)<div data-dcat-modern-slot="grid-footer">@endif
        {!! $grid->renderFooter() !!}
    @if($modernGrid)</div>@endif

    {!! $grid->renderPagination() !!}

</div>
@if($modernGrid)
    </div>
</div>
{!! Dcat\Admin\Admin::modern()->payload('grid.read', $modernGridPayload, 'grid') !!}
@endif
