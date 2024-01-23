@php($id=uniqid())
<div class="box-footer">

  <div class="col-md-{{$width['label']}} d-md-block" style="display: none"></div>

  <div class="col-md-{{$width['field']}}">

    @if(!empty($buttons['submit']))
      <div class="btn-group pull-right">
        <button class="btn btn-info submit" onclick="$('#{{$id}}-after-save').val('3');">
          <i class="feather icon-eye"></i> {{ trans('admin.save_and_view') }}
        </button>
      </div>
      <div class="btn-group pull-right mr-2">
        <button class="btn btn-primary submit" onclick="$('#{{$id}}-after-save').val('1');">
          <i class="feather icon-save"></i> {{ trans('admin.save_and_edit') }}
        </button>
      </div>
      @foreach($buttons as $button)
        @if($button instanceof  App\Admin\Extensions\Form\Button)
          {!! $button->render() !!}
        @elseif($button instanceof  Dcat\Admin\Form\AbstractTool)
          {!! $button->render(1, true) !!}
        @endif
      @endforeach

      @if(!empty($buttons['back']))
        <div class="btn-group pull-right mr-2">
          <button type="button" class="btn btn-secondary" onclick="history.back()">
            <i class="feather icon-arrow-left-circle"></i> {{ trans('admin.back') }}
          </button>
        </div>
      @endif

      {{--      @if($checkboxes)--}}
      {{--        <div class="pull-right d-md-flex" style="margin:10px 15px 0 0; display: none!important;">--}}
      {{--          {!! $checkboxes !!}--}}
      {{--        </div>--}}
      {{--      @endif--}}
      <input type="hidden" id="{{$id}}-after-save" name="after-save">
    @endif

    @if(!empty($buttons['reset']))
      <div class="btn-group pull-left">
        <button type="reset" class="btn btn-white">
          <i class="feather icon-rotate-ccw"></i> {{ trans('admin.reset') }}
        </button>
      </div>
    @endif
  </div>
</div>
