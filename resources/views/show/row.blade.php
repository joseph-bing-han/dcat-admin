<div class="row" style="margin-bottom: 5px">
    @foreach($fields as $field)
        <div class="col-md-{{ $field['width'] }} @if(!empty($field['element']->offset())) offset-md-{{ $field['element']->offset() }} @endif">
            {!! $field['element']->render() !!}
        </div>
    @endforeach
</div>
