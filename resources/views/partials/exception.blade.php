@if(isset($errors) && $errors->hasBag('exception'))
    <?php $error = $errors->getBag('exception'); ?>
    @php
        $modernSystem = Dcat\Admin\Admin::modern()->available('system') && Dcat\Admin\Admin::modern()->capabilityEnabled('system.page');
        $exceptionType = (string) ($error->get('type')[0] ?? 'Exception');
        $exceptionFile = (string) ($error->get('file')[0] ?? '');
        $exceptionLine = (string) ($error->get('line')[0] ?? '');
        $exceptionMessage = trim(html_entity_decode(strip_tags((string) $error->first('message')), ENT_QUOTES, 'UTF-8'));
        $exceptionTrace = (string) $error->first('trace');
        $modernSystemPayload = $modernSystem ? Dcat\Admin\Modern\ViewModel::make('system', 'system.page', [
            'page' => 'exception',
            'renderer' => 'native',
            'exception' => [
                'type' => class_basename($exceptionType),
                'file' => basename($exceptionFile),
                'line' => $exceptionLine,
                'message' => $exceptionMessage,
                'trace' => $exceptionTrace,
            ],
        ], [
            'componentId' => 'system-exception',
            'slots' => [],
            'compatRequirements' => ['jquery' => false, 'pluginAdapters' => [], 'customSlots' => false],
        ]) : null;
    @endphp
    <div class="dcat-system-fallback-exception"{!! $modernSystem ? ' data-dcat-react-component="system.page" data-dcat-modern-family="system" data-dcat-modern-server-fallback="1"' : '' !!}>
        @if($modernSystem)<div data-dcat-modern-fallback>@endif
        <div class="alert alert-warning" role="alert">
            <h4>{{ class_basename($exceptionType) }} in {{ basename($exceptionFile) }} line {{ $exceptionLine }}</h4>
            <details>
                <summary>{{ $exceptionMessage }}</summary>
                <pre>{{ $exceptionTrace }}</pre>
            </details>
        </div>
        @if($modernSystem)</div>@endif
    </div>
    @if($modernSystem)
        {!! Dcat\Admin\Admin::modern()->payload('system.page', $modernSystemPayload, 'system') !!}
    @endif
@endif
