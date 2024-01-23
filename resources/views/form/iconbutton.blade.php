<div class="btn-group pull-right mr-2">
  <span class="btn {{ $class }} {{ $buttonClass }}" {!! $attributes !!}>
    @if(!empty($icon))
      <i class="{{ $icon }}"></i>
    @endif
    {!! $label !!}
  </span>
</div>
