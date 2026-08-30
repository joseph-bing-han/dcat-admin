@php
    $modernWidget = Dcat\Admin\Admin::modern()->available('widget') && Dcat\Admin\Admin::modern()->capabilityEnabled('widget.surface');
    $modernWidgetPayload = $modernWidget ? Dcat\Admin\Modern\ViewModel::make('widget', 'widget.surface', [
        'variant' => 'card',
        'title' => trim(strip_tags((string) $title)),
        'toolCount' => is_countable($tools) ? count($tools) : 0,
        'hasFooter' => (bool) $footer,
    ], [
        'slots' => [
            ['id' => 'widget-tools', 'kind' => 'compat', 'role' => 'tools'],
            ['id' => 'widget-content', 'kind' => 'compat', 'role' => 'content'],
            ['id' => 'widget-footer', 'kind' => 'compat', 'role' => 'footer'],
        ],
        'compatRequirements' => ['customSlots' => true],
    ]) : null;
@endphp
@if($modernWidget)
<div data-dcat-react-component="widget.surface" data-dcat-modern-family="widget">
    <div data-dcat-modern-fallback {!! $attributes !!}>
@else
<div {!! $attributes !!}>
@endif
    @if ($title || $tools)
        <div class="card-header {{ $divider ? 'with-border' : '' }}">
            <span class="card-box-title">{!! $title !!}</span>
            <div class="box-tools pull-right"{!! $modernWidget ? ' data-dcat-modern-slot="widget-tools"' : '' !!}>
                @foreach($tools as $tool)
                    {!! $tool !!}
                @endforeach
            </div>
        </div>
    @endif
    <div class="card-body" style="{!! $padding !!}"{!! $modernWidget ? ' data-dcat-modern-slot="widget-content"' : '' !!}>
        {!! $content !!}
    </div>
    @if($footer)
    <div class="card-footer"{!! $modernWidget ? ' data-dcat-modern-slot="widget-footer"' : '' !!}>
        {!! $footer !!}
    </div>
    @endif
@if($modernWidget)
    </div>
</div>
{!! Dcat\Admin\Admin::modern()->payload('widget.surface', $modernWidgetPayload, 'widget') !!}
@else
</div>
@endif
