@if ($grid->allowPagination())
    <div class="box-footer dcat-modern-grid-pagination">
        {!! $grid->paginator()->render() !!}
    </div>
@endif
