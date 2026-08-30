@php
    $modernWidget = Dcat\Admin\Admin::modern()->available('widget') && Dcat\Admin\Admin::modern()->capabilityEnabled('widget.surface');
    $widgetToolHtml = implode('', (array) $tools);
    $nativeCollapseTool = strpos($widgetToolHtml, 'data-action="collapse"') !== false;
    $nativeRemoveTool = strpos($widgetToolHtml, 'data-action="remove"') !== false;
    $nativeToolCount = ($nativeCollapseTool ? 1 : 0) + ($nativeRemoveTool ? 1 : 0);
    $customToolCount = max(0, (is_countable($tools) ? count($tools) : 0) - $nativeToolCount);
    $widgetSlots = [['id' => 'widget-content', 'kind' => 'compat', 'role' => 'content']];
    if ($customToolCount > 0) {
        array_unshift($widgetSlots, ['id' => 'widget-tools', 'kind' => 'compat', 'role' => 'tools']);
    }
    $modernWidgetPayload = $modernWidget ? Dcat\Admin\Modern\ViewModel::make('widget', 'widget.surface', [
        'variant' => 'box',
        'title' => trim(strip_tags((string) $title)),
        'toolCount' => is_countable($tools) ? count($tools) : 0,
        'nativeTools' => [
            'collapse' => $customToolCount === 0 && $nativeCollapseTool,
            'remove' => $customToolCount === 0 && $nativeRemoveTool,
        ],
    ], [
        'slots' => $widgetSlots,
        'compatRequirements' => ['customSlots' => true],
    ]) : null;
@endphp
@if($modernWidget)
<div data-dcat-react-component="widget.surface" data-dcat-modern-family="widget">
    <div data-dcat-modern-fallback {!! $attributes !!}>
@else
<div {!! $attributes !!}>
@endif
    <div class="box-header with-border">
        <h3 class="box-title">{!! $title !!}</h3>
        <div class="box-tools pull-right"{!! $modernWidget && $customToolCount > 0 ? ' data-dcat-modern-slot="widget-tools"' : '' !!}>
            @foreach($tools as $tool)
                {!! $tool !!}
            @endforeach
        </div>
    </div>
    <div class="box-body collapse show" style="{!! $padding !!}"{!! $modernWidget ? ' data-dcat-modern-slot="widget-content"' : '' !!}>
        {!! $content !!}
    </div>
@if($modernWidget)
    </div>
</div>
{!! Dcat\Admin\Admin::modern()->payload('widget.surface', $modernWidgetPayload, 'widget') !!}
@else
</div>
@endif
