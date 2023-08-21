<div class="{{$viewClass['form-group']}}">

    <label class="{{$viewClass['label']}} control-label">{!! $label !!}</label>

    <div class="{{$viewClass['field']}}">

        @include('admin::form.error')

        <div class="input-group">
            <input type="number" name="{{$name}}" value="{{ $value }}" class="form-control {{ $class }}" placeholder="0" style="text-align:right;" {!! $attributes !!} />
            <span class="input-group-append"><span class="input-group-text bg-white">%</span></span>
        </div>

        @include('admin::form.help-block')

    </div>
</div>
