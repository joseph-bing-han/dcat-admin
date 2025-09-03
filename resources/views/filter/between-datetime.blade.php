<div class="filter-input col-sm-{{ $width }}"  style="{!! $style !!}">
    <div class="form-group">
        <div class="input-group input-group-sm">

            <div class="input-group-prepend">
                <span class="input-group-text bg-white text-capitalize"><b>{!! $label !!}</b>&nbsp;<i class="feather icon-calendar"></i></span>
            </div>

            <input autocomplete="off" type="text" class="form-control" id="{{$id['start']}}" placeholder="{{$label}}" name="{{$name['start']}}" value="{{ request($name['start'], \Illuminate\Support\Arr::get($value, 'start')) }}">
            <span class="input-group-addon" style="border-left: 0; border-right: 0;">{{ admin_trans_label('To') }}</span>
            <input autocomplete="off" type="text" class="form-control" id="{{$id['end']}}" placeholder="{{$label}}" name="{{$name['end']}}" value="{{ request($name['end'], \Illuminate\Support\Arr::get($value, 'end')) }}">
        </div>
    </div>
</div>

<script require="@moment,@bootstrap-datetimepicker">
    var options = {!! admin_javascript_json($dateOptions) !!};

    // 设置moment.js的locale
    if (options.locale) {
        moment.locale(options.locale.toLowerCase());
    }
    
    // 从URL参数中获取并设置日期值
    const urlParams = new URLSearchParams(window.location.search);
    const startParamName = '{{ $name['start'] }}';
    const endParamName = '{{ $name['end'] }}';
    
    // 获取URL参数值
    let startParamValue = urlParams.get(startParamName);
    let endParamValue = urlParams.get(endParamName);
    
    // 根据Laravel配置构建可能的日期格式数组
    const possibleFormats = [];
    
    // 添加当前配置的格式
    if (options.format) {
        possibleFormats.push(options.format);
    }
    
    // 使用框架提供的函数转换Laravel日期格式
    const laravelJsFormat = '{!! datetime_format_2_js(config('app.date_format', 'd/m/Y')) !!}';
    possibleFormats.push(laravelJsFormat);
    
    // 添加一些常用的备选格式
    possibleFormats.push('DD/MM/YYYY', 'D/M/YYYY', 'YYYY-MM-DD');
    
    // 去重
    const uniqueFormats = [...new Set(possibleFormats)];
    
    // 如果URL参数存在，设置到输入字段并格式化
    if (startParamValue) {
        const startMoment = moment(startParamValue, uniqueFormats, true);
        if (startMoment.isValid()) {
            $('#{{ $id['start'] }}').val(startMoment.format(options.format));
        }
    } else if ($('#{{ $id['start'] }}').val() !== '') {
        // 如果没有URL参数但字段有值，格式化现有值
        const startValue = $('#{{ $id['start'] }}').val();
        const start = moment(startValue, uniqueFormats, true);
        if (start.isValid()) {
            $('#{{ $id['start'] }}').val(start.format(options.format));
        }
    }
    
    if (endParamValue) {
        const endMoment = moment(endParamValue, uniqueFormats, true);
        if (endMoment.isValid()) {
            $('#{{ $id['end'] }}').val(endMoment.format(options.format));
        }
    } else if ($('#{{ $id['end'] }}').val() !== '') {
        // 如果没有URL参数但字段有值，格式化现有值
        const endValue = $('#{{ $id['end'] }}').val();
        const end = moment(endValue, uniqueFormats, true);
        if (end.isValid()) {
            $('#{{ $id['end'] }}').val(end.format(options.format));
        }
    }
    $('#{{ $id['start'] }}').datetimepicker(options);
    $('#{{ $id['end'] }}').datetimepicker($.extend(options, {useCurrent: false}));
    $("#{{ $id['start'] }}").on("dp.change", function (e) {
        $('#{{ $id['end'] }}').data("DateTimePicker").minDate(e.date);
    });
    $("#{{ $id['end'] }}").on("dp.change", function (e) {
        $('#{{ $id['start'] }}').data("DateTimePicker").maxDate(e.date);
    });
</script>