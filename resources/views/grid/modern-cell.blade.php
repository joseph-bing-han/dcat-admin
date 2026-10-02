{{-- 与 GridCell 使用同一载荷；首屏就呈现最终内容，compat 单元格仍保留原节点。 --}}
@switch($cell['kind'])
@case('text')
{{ $cell['text'] }}
@break
@case('link')
<a href="{{ $cell['href'] }}"@isset($cell['target']) target="{{ $cell['target'] }}"@endisset @isset($cell['rel']) rel="{{ $cell['rel'] }}"@endisset>{{ $cell['text'] }}</a>
@break
@case('button')
<span class="{{ $cell['className'] }}">{{ $cell['text'] }}</span>
@break
@case('labels')
@foreach($cell['items'] as $item)<span class="dcat-modern-grid-label {{ empty($cell['tone']) ? '' : 'dcat-modern-grid-label--'.$cell['tone'] }} {{ $cell['className'] }}" style="background-color:{{ $cell['style']['backgroundColor'] ?? 'transparent' }};@isset($cell['style']['color'])color:{{ $cell['style']['color'] }};@endisset">{{ $item }}</span>{{ $loop->last ? '' : ' ' }}@endforeach
@break
@case('images')
@foreach($cell['items'] as $item)<img src="{{ $item['src'] }}" alt="" class="img img-thumbnail" style="max-width:{{ $item['maxWidth'] }}px;max-height:{{ $item['maxHeight'] }}px;{{ empty($item['preview']) ? '' : 'cursor:pointer' }}"@if(!empty($item['preview'])) data-action="preview-img"@endif>{{ $loop->last ? '' : ' ' }}@endforeach
@break
@case('progress')
<div><div role="progressbar" aria-label="Progress: {{ $cell['value'] }}%" aria-valuenow="{{ $cell['value'] }}" aria-valuemin="0" aria-valuemax="{{ $cell['max'] }}" class="dcat-modern-grid-progress {{ $cell['className'] }}"><div class="progress-bar" style="transform:translateX(-{{ 100 - $cell['value'] * 100 / max(1, $cell['max']) }}%)"></div></div></div>
@break
@case('downloads')
@foreach($cell['items'] as $item)<a href="{{ $item['href'] }}" download="{{ $item['name'] }}" target="_blank" class="text-muted"><i class="feather icon-download" aria-hidden="true"></i> {{ $item['name'] }}</a>@if(!$loop->last)<br>@endif @endforeach
@break
@case('table')
<table class="table table-hover" style="margin-bottom:0"><thead><tr>@foreach($cell['headers'] as $header)<th>{{ $header }}</th>@endforeach</tr></thead><tbody>@foreach($cell['rows'] as $row)<tr>@foreach($row as $value)<td>{{ $value }}</td>@endforeach</tr>@endforeach</tbody></table>
@break
@case('expand')
<button type="button" class="grid-expand dcat-modern-grid-expand" data-id="{{ $cell['rowKey'] }}" data-key="{{ $cell['dataKey'] }}" aria-expanded="false"><i class="feather icon-chevrons-right" aria-hidden="true"></i> {{ $cell['button'] }}</button>
@break
@endswitch
