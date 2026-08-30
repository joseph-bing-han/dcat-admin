@php
    $messages = array_values(array_filter((array) ($messages ?? []), function ($message) {
        return $message !== null && $message !== '';
    }));
    $title = $title ?? null;
    $tone = $tone ?? 'info';
    $modernSystem = Dcat\Admin\Admin::modern()->available('system') && Dcat\Admin\Admin::modern()->capabilityEnabled('system.page');
    $plainMessages = array_map(function ($message) {
        return trim(html_entity_decode(strip_tags((string) $message), ENT_QUOTES, 'UTF-8'));
    }, $messages);
    $native = collect($messages)->every(function ($message, $index) use ($plainMessages) {
        return trim((string) $message) === ($plainMessages[$index] ?? '');
    });
    $modernSystemPayload = $modernSystem ? Dcat\Admin\Modern\ViewModel::make('system', 'system.page', [
        'page' => 'feedback',
        'tone' => $tone,
        'title' => $title ? trim(html_entity_decode(strip_tags((string) $title), ENT_QUOTES, 'UTF-8')) : '',
        'messages' => $plainMessages,
        'renderer' => $native ? 'native' : 'compat',
    ], [
        'slots' => $native ? [] : [['id' => 'system-feedback-content', 'kind' => 'compat', 'role' => 'message']],
        'compatRequirements' => [
            'jquery' => false,
            'pluginAdapters' => [],
            'customSlots' => ! $native,
        ],
    ]) : null;
@endphp
<div class="alert alert-{{ $tone }} alert-dismissable"{!! $modernSystem ? ' data-dcat-react-component="system.page" data-dcat-modern-family="system"' : '' !!}>
    @if($modernSystem)<div data-dcat-modern-fallback>@endif
    <button type="button" class="close" data-dismiss="alert" aria-label="Dismiss notification">×</button>
    @if($title)
        <h4>{{ $title }}</h4>
    @endif
    <div{!! $modernSystem && ! $native ? ' data-dcat-modern-slot="system-feedback-content"' : '' !!}>
        @foreach($messages as $message)
            <p>{!! $message !!}</p>
        @endforeach
    </div>
    @if($modernSystem)</div>@endif
</div>
@if($modernSystem)
{!! Dcat\Admin\Admin::modern()->payload('system.page', $modernSystemPayload, 'system') !!}
@endif
