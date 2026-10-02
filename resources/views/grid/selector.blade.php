<div class="grid-selector">
    @foreach($self->all(true) as $column => $selector)
        <div class="wrap">
            <div class="select-label">{{ $selector['label'] }}</div>
            <div class="select-options">
                <ul>
                    @foreach($selector['options'] as $value => $option)
                        @php
                            $active = in_array((string) $value, \Illuminate\Support\Arr::get($selected, $column, []), true);
                        @endphp
                        <li>
                            <a href="{{ $self->url($column, $value, true) }}"
                               class="{{$active ? 'active' : ''}}" @if($active) aria-current="true" @endif>{{ $option }}</a>
                            @if(!$active && $selector['type'] == 'many')
                                <a href="{{ $self->url($column, $value) }}" class="add" aria-label="Add {{ $option }}"><i class="feather icon-plus-square" aria-hidden="true"></i></a>
                            @endif
                        </li>
                    @endforeach
                    <li>
                        <a href="{{ $self->url($column) }}" class="clear" aria-label="Clear {{ $selector['label'] }}"><i class="feather icon-trash-2" aria-hidden="true"></i></a>
                    </li>
                </ul>
            </div>
        </div>
    @endforeach
</div>
