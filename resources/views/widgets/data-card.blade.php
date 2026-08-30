@php
    $modernWidget = Dcat\Admin\Admin::modern()->available('widget') && Dcat\Admin\Admin::modern()->capabilityEnabled('widget.surface');
    $dataCardLeft = (string) ($options['content']['left'] ?? '');
    $dataCardRight = (string) ($options['content']['right'] ?? '');
    $dataCardDescription = (string) ($options['description'] ?? '');
    $dataCardNativeContent = trim($dataCardLeft) === trim(strip_tags($dataCardLeft))
        && trim($dataCardRight) === trim(strip_tags($dataCardRight))
        && trim($dataCardDescription) === trim(strip_tags($dataCardDescription));
    $dataCardSlots = [];
    if (! empty($options['tools'])) {
        $dataCardSlots[] = ['id' => 'widget-tools', 'kind' => 'compat', 'role' => 'tools'];
    }
    if (! $dataCardNativeContent) {
        $dataCardSlots[] = ['id' => 'widget-content', 'kind' => 'compat', 'role' => 'content'];
    }
    $modernWidgetPayload = $modernWidget ? Dcat\Admin\Modern\ViewModel::make('widget', 'widget.surface', [
        'variant' => 'data-card',
        'title' => trim(strip_tags((string) $options['title'])),
        'description' => trim(strip_tags($dataCardDescription)),
        'contentLeft' => $dataCardNativeContent ? $dataCardLeft : null,
        'contentRight' => $dataCardNativeContent ? $dataCardRight : null,
        'progress' => $dataCardNativeContent && $options['progress'] ? [
            'percent' => (float) ($options['progress']['percent'] ?? 0),
            'style' => (string) ($options['progress']['style'] ?? 'primary'),
        ] : null,
        'hasProgress' => (bool) $options['progress'],
    ], [
        'slots' => $dataCardSlots,
        'compatRequirements' => ['customSlots' => ! empty($dataCardSlots)],
    ]) : null;
@endphp
@if($modernWidget)
<div data-dcat-react-component="widget.surface" data-dcat-modern-family="widget">
    <div data-dcat-modern-fallback {!! $attributes !!}>
@else
<div {!! $attributes !!}>
@endif
    <div class="dropdown btn-group {!! $options['show_tool_shadow'] ? '' : 'no-shadow' !!} pull-right"{!! $modernWidget && ! empty($options['tools']) ? ' data-dcat-modern-slot="widget-tools"' : '' !!}>
        @foreach($options['tools'] as $tool)
            {!! $tool !!}
        @endforeach
    </div>

    <h4 class="header-title m-t-0 m-b-25">{!! $options['title'] !!}</h4>

    <div{!! $modernWidget && ! $dataCardNativeContent ? ' data-dcat-modern-slot="widget-content"' : '' !!}>
        <div>
            <div class="right-content pull-right">{!! $options['content']['right'] !!}</div>

            <h2 class="main-content m-b-10" >
                {!! $options['content']['left'] !!}&nbsp;
            </h2>
            <p class="text-muted">
                {!! $options['description'] !!}&nbsp;
            </p>
        </div>

        @if($options['progress'])
        <div class="progress progress-sm m-b-0">
            <div data-width="{!! $options['progress']['percent'] !!}%" class="progress-bar progress-bar-{!! $options['progress']['style'] !!}" >
                <span class="sr-only"></span>
            </div>
        </div>
        @endif

    </div>
@if($modernWidget)
    </div>
</div>
{!! Dcat\Admin\Admin::modern()->payload('widget.surface', $modernWidgetPayload, 'widget') !!}
@else
</div>
@endif
