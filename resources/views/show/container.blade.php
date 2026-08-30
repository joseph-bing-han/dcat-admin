@php
    $modernShow = Dcat\Admin\Admin::modern()->available('show') && Dcat\Admin\Admin::modern()->capabilityEnabled('show.detail');
    $modernShowPayload = $modernShow ? ($modernShowPayload ?? null) : null;
@endphp
@if($modernShow)
<div data-dcat-react-component="show.detail">
    <div data-dcat-modern-fallback>
@endif
<div class="row"{!! Dcat\Admin\Admin::modern()->available('show') ? ' data-dcat-modern-family="show"' : '' !!}>
    <div class="col-md-{{ $width }}"{!! $modernShow ? ' data-dcat-modern-slot="show-primary"' : '' !!}>{!! $panel !!}</div>

    @if($relations->count())
        <div class="col-md-{{ $width }}">
            <div class="row show-relation-container">
                @foreach($relations as $relation)
                    <div class="col-md-{{ $relation->width ?: 12 }}"{!! $modernShow ? ' data-dcat-modern-slot="show-relation-'.$loop->index.'"' : '' !!}>
                        {!!  $relation->render() !!}
                    </div>
                @endforeach
            </div>
        </div>
    @endif
</div>
@if($modernShow)
    </div>
</div>
{!! Dcat\Admin\Admin::modern()->payload('show.detail', $modernShowPayload, 'show') !!}
@endif
