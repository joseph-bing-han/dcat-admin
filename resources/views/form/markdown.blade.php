<style>
    .editormd-fullscreen {z-index: 99999999;}
</style>

<div class="{{$viewClass['form-group']}}">

    <label class="{{$viewClass['label']}} control-label">{!! $label !!}</label>

    <div class="{{$viewClass['field']}}">

        @include('admin::form.error')

        <div class="{{$class}}" {!! $attributes !!}>
            <textarea class="d-none" name="{{$name}}" placeholder="{{ $placeholder }}">{!! $value !!}</textarea>
        </div>

        @include('admin::form.help-block')

    </div>
</div>

<script first>
    var ele = window.Element;
    Dcat.eMatches = ele.prototype.matches ||
        ele.prototype.msMatchesSelector ||
        ele.prototype.webkitMatchesSelector;
</script>

<script require="@editor-md-form" init="{!! $selector !!}">
    var markdownEditor = editormd(id, {!! $options !!});

    $this.data('dcatModernCleanup', function () {
        if (!markdownEditor) return;
        try {
            if (markdownEditor.codeMirror && typeof markdownEditor.codeMirror.toTextArea === 'function') {
                markdownEditor.codeMirror.toTextArea();
            } else if (markdownEditor.codeMirror && typeof markdownEditor.codeMirror.remove === 'function') {
                markdownEditor.codeMirror.remove();
            }
        } catch (e) {}
        try {
            if (markdownEditor.editor && typeof markdownEditor.editor.remove === 'function') {
                markdownEditor.editor.remove();
            }
        } catch (e) {}
        markdownEditor = null;
    });

    Element.prototype.matches = Dcat.eMatches;
</script>
