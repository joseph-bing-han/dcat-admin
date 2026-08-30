@php
    $choiceTag = Dcat\Admin\Admin::modern()->runtimeAvailable() ? 'label' : 'div';
@endphp
@if($inline)
<div class="d-flex flex-wrap">
@endif

@foreach($options as $k => $label)
    <{{ $choiceTag }} class="vs-checkbox-con vs-checkbox-{{ $style }}" style="margin-right: {{ $right }}">
        <input {!! in_array($k, $disabled) ? 'disabled' : '' !!} value="{{$k}}" {!! $attributes !!} {!! (in_array($k, $checked)) ? 'checked' : '' !!}>
        <span class="vs-checkbox vs-checkbox-{{ $size }}">
          <span class="vs-checkbox--check">
            <i class="vs-icon feather icon-check"></i>
          </span>
        </span>
        @if($label !== null && $label !== '')
        <span>{!! $label !!}</span>
        @endif
    </{{ $choiceTag }}>
@endforeach

@if($inline)
</div>
@endif
