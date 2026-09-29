<?php

namespace Dcat\Admin\Modern;

use Dcat\Admin\Admin;

class Manager
{
    const BRIDGE_VERSION = '1.0.0';
    const PAYLOAD_VERSION = '1.1.0';

    protected $manifest;

    public function __construct(Manifest $manifest)
    {
        $this->manifest = $manifest;
    }

    public function manifest()
    {
        return $this->manifest;
    }

    public function enabled($family = null)
    {
        // 新版渲染器是唯一渲染器：不存在配置或请求参数切换到旧版 UI 的入口。
        // 唯一前置条件是已发布的 modern manifest；缺失时由新版 compat 降级承担。
        return $this->manifest->exists();
    }

    public function available($family = null)
    {
        if (! $this->enabled($family) || ! $this->manifest->exists()) {
            return false;
        }

        $assets = $this->manifest->assets();

        return ! empty($assets['js']);
    }

    public function capabilityEnabled($capability)
    {
        // 能力级渲染门禁已取消：所有已实现 capability 都随 manifest 一起启用，
        // 不再有任何配置或请求参数可以单独关掉某一项能力。
        return true;
    }

    public function runtimeAvailable()
    {
        // 新版是唯一渲染器：modern 层始终接管页面。manifest 已发布时为 native，
        // 缺失时由新版 compat（Dcat 自有 CSS/API）承担，不存在旧版 UI 运行时。
        return true;
    }

    public function usesBootstrapFreeAssets()
    {
        return $this->runtimeAvailable();
    }

    public function usesCompatRenderer()
    {
        // 新版 compat 是新版渲染器唯一的降级实现：manifest 未发布时使用 Dcat
        // 自有 CSS/API，而不是旧版 Bootstrap/AdminLTE。
        return ! $this->available();
    }

    public function headHtml()
    {
        if (! $this->runtimeAvailable()) {
            return '';
        }

        $assets = $this->manifest->assets();
        if ($this->usesCompatRenderer()) {
            $assets = ['js' => '../modern-compat/assets/dcat-fallback.js', 'css' => ['../modern-compat/assets/dcat-fallback.css']];
        }
        $config = $this->clientConfig();
        $nonce = $this->nonceAttribute();
        $runtimeId = 'dcat-modern-runtime';
        $runtimeUrl = e($this->assetUrl($assets['js']));
        $html = [
            '<script type="application/json" id="dcat-modern-config"'.$nonce.'>'.$this->json($config).'</script>',
        ];

        foreach ($assets['css'] as $css) {
            $html[] = '<link rel="stylesheet" href="'.e($this->assetUrl($css)).'"'.$nonce.'>';
        }

        // The native runtime must exist before the body calls CreateDcat().
        // Bridge mounting itself is deferred internally until DOMContentLoaded.
        $html[] = '<script id="'.$runtimeId.'" src="'.$runtimeUrl.'"'.$nonce.'></script>';

        return implode("\n", $html);
    }

    protected function clientConfig()
    {
        $diagnostics = config('admin.modern.diagnostics');
        if ($diagnostics === null) {
            $diagnostics = config('app.debug', false);
        }

        return [
            'enabled' => $this->available(),
            'compat' => $this->usesCompatRenderer(),
            'bridgeVersion' => static::BRIDGE_VERSION,
            'payloadVersion' => static::PAYLOAD_VERSION,
            'telemetry' => (bool) config('admin.modern.telemetry', true),
            'diagnostics' => (bool) $diagnostics,
        ];
    }

    public function pageConfigHtml()
    {
        $config = $this->clientConfig();
        // 与导航 runtime 的 native=1、compat=0 编码保持一致：新版只有两种渲染器。
        $renderer = $config['enabled'] ? 1 : 0;

        return '<script type="application/json" data-dcat-modern-page-config data-dcat-r="'.$renderer.'"'.$this->nonceAttribute().'>'
            .$this->json($config).'</script>';
    }

    public function payload($capability, array $payload = [], $family = null, array $meta = [])
    {
        if (! $this->available($family)) {
            return '';
        }

        if ($family !== 'extension' && strpos($capability, 'extension.') !== 0) {
            $payload = ViewModel::normalize($capability, $payload, $family, $meta);

            if (! empty($payload['compatRequirements']['jquery'])) {
                Admin::asset()->require('@dcat-compat');
            }
        }

        $data = [
            'version' => static::PAYLOAD_VERSION,
            'capability' => $capability,
            'payload' => $payload,
        ];

        return '<script type="application/json" data-dcat-modern-payload="'.e($capability).'"'.$this->nonceAttribute().'>'
            .$this->json($data)
            .'</script>';
    }

    public function island($component, array $payload = [], $fallbackHtml = '', array $descriptor = [])
    {
        $capability = strpos($component, 'extension.') === 0 ? $component : 'extension.'.$component;

        if (! $this->available('extension')) {
            return $this->compat($fallbackHtml, $descriptor);
        }

        return '<div data-dcat-react-component="'.e($component).'" data-dcat-modern-extension="1">'
            .'<div data-dcat-modern-fallback>'.$this->compat($fallbackHtml, $descriptor).'</div>'
            .'</div>'
            .$this->payload($capability, $payload, 'extension');
    }

    public function compat($html, array $descriptor = [])
    {
        $mode = $descriptor['mode'] ?? 'compat-css';
        if (! in_array($mode, ['native', 'compat-css', 'compat-jquery'], true)) {
            $mode = 'compat-css';
        }
        if ($mode === 'compat-jquery') {
            Admin::requireAssets('@dcat-compat');
        }
        foreach ((array) ($descriptor['assets'] ?? []) as $asset) {
            Admin::requireAssets($asset);
        }

        return '<div data-dcat-compat="'.e($mode).'" data-dcat-compat-id="'.e($descriptor['id'] ?? 'custom-slot').'">'.$html.'</div>';
    }

    protected function assetUrl($file)
    {
        if (strpos($file, '../modern-compat/') === 0) {
            return Admin::asset()->url('@admin/'.substr($file, 3));
        }

        return Admin::asset()->url('@admin/modern/'.ltrim($file, '/'));
    }

    public function nonceAttribute()
    {
        $nonce = config('admin.modern.csp_nonce');

        if ($nonce instanceof \Closure) {
            $nonce = $nonce();
        }

        return $nonce ? ' nonce="'.e($nonce).'"' : '';
    }

    protected function json(array $data)
    {
        return json_encode($data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
    }
}
