
@include('admin::scripts.select')

<script require="@select2?lang={{ config('app.locale') === 'en' ? '' : str_replace('_', '-', config('app.locale')) }}" init="{!! $selector !!}">
    var configs = {!! admin_javascript_json($configs) !!};

    @yield('admin.select-ajax')

    @if(isset($remoteOptions))
    $.ajax({!! admin_javascript_json($remoteOptions) !!}).done(function(data) {
        configs.data = data;

        $this.each(function (_, select) {
            select = $(select);

            select.select2(configs);
            select.next('.select2').find('ul.select2-selection__rendered').attr('role', 'list');
            select.closest('form').find('ul.select2-selection__rendered').attr('role', 'list');

            var value = select.data('value') + '';

            if (value) {
                select.val(value.split(',')).trigger("change")
            }
        });
    });
    @else
    $this.select2(configs);
    $this.next('.select2').find('ul.select2-selection__rendered').attr('role', 'list');
    $this.closest('form').find('ul.select2-selection__rendered').attr('role', 'list');
    @endif

    {!! $cascadeScript !!}
</script>

