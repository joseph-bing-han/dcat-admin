<div class="row">
    <div class="col-md-{{ $width }}">{!! $panel !!}</div>

    @if($relations->count())
        <div class="col-md-{{ $width }}">
            <div class="row show-relation-container">
                @foreach($relations as $relation)
                    <div class="col-md-{{ $relation->width ?: 12 }}">
                        {!!  $relation->render() !!}
                    </div>
                @endforeach
            </div>
        </div>
    @endif
</div>
