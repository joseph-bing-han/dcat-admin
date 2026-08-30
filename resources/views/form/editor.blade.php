<div class="{{$viewClass['form-group']}}">

    <label class="{{$viewClass['label']}} control-label">{!! $label !!}</label>

    <div class="{{$viewClass['field']}}">

        @include('admin::form.error')

        <textarea class="form-control {{$class}}" name="{{$name}}" placeholder="{{ $placeholder }}" {!! $attributes !!} >{{ $value }}</textarea>

        @include('admin::form.help-block')

    </div>
</div>

<script require="@tinymce" init="{!! $selector !!}">
    var opts = {!! admin_javascript_json($options) !!},
        destroyed = false,
        originalInitCallback = opts.init_instance_callback,
        cleanupTinyUi = function () {
            setTimeout(function () {
                if (!tinymce.editors || tinymce.editors.length === 0) {
                    $('.tox-tinymce-aux').remove();
                }
            }, 0);
        };

    opts.selector = '#'+id;

    opts.init_instance_callback = function (editor) {
        if (destroyed) {
            editor.remove();
            cleanupTinyUi();
            return;
        }

        if (originalInitCallback) {
            originalInitCallback(editor);
        } else {
            editor.on('Change', function(e) {
                $this.val(String(e.target.getContent()).replace('<p><br data-mce-bogus="1"></p>', '').replace('<p><br></p>', ''));
            });
        }
    };

    $this.data('dcatModernCleanup', function () {
        destroyed = true;
        var editor = tinymce.get(id);
        if (editor) editor.remove();
        cleanupTinyUi();
    });

    tinymce.init(opts)
</script>
