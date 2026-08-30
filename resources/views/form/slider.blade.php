<div class="{{$viewClass['form-group']}}">

    <label class="{{$viewClass['label']}} control-label">{!! $label !!}</label>

    <div class="{{$viewClass['field']}}">

        @include('admin::form.error')

        <input type="text" class="{{$class}}" name="{{$name}}" data-from="{{ $value }}" {!! $attributes !!} />

        @include('admin::form.help-block')

    </div>
</div>

<script require="@ionslider" init="{!! $selector !!}">
    var sliderResizeObserver = null;
    var sliderTimer = setTimeout(function () {
        sliderTimer = null;
        $this.ionRangeSlider({!! admin_javascript_json($options) !!});
        if (window.ResizeObserver && $this.closest('.dcat-modern-form').length) {
            var sliderWidth = $this.parent().width();
            // 旧插件用像素定位刻度；容器变宽时重新测量，保留当前值。
            sliderResizeObserver = new ResizeObserver(function () {
                var width = $this.parent().width();
                if (width > 0 && width !== sliderWidth && $this.data('isActive')) {
                    sliderWidth = width;
                    $this.ionRangeSlider('update', {});
                }
            });
            sliderResizeObserver.observe($this.parent()[0]);
        }
    }, 400);

    $this.data('dcatModernCleanup', function () {
        if (sliderResizeObserver) {
            sliderResizeObserver.disconnect();
            sliderResizeObserver = null;
        }
        if (sliderTimer) {
            clearTimeout(sliderTimer);
            sliderTimer = null;
        }
        if ($.fn.ionRangeSlider && $this.data('isActive')) {
            try { $this.ionRangeSlider('remove'); } catch (e) {}
        }
    });
</script>
