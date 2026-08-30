<?php

namespace Dcat\Admin\Modern;

class ViewModel
{
    const SCHEMA_VERSION = '1.1.0';

    public static function make(string $family, string $componentType, array $data = [], array $meta = []): array
    {
        $fallbackScope = $meta['fallbackScope'] ?? static::fallbackScope($family, $componentType);
        $compat = array_merge([
            'bootstrapCss' => [],
            'bootstrapPlugins' => [],
            'jquery' => false,
            'pluginAdapters' => [],
            'customSlots' => false,
            'bladeOverride' => false,
        ], $meta['compatRequirements'] ?? []);

        return [
            'schemaVersion' => static::SCHEMA_VERSION,
            'family' => $family,
            'componentType' => $componentType,
            'componentId' => (string) ($meta['componentId'] ?? $data['id'] ?? $componentType),
            'status' => (string) ($meta['status'] ?? 'ready'),
            'permissions' => array_values($meta['permissions'] ?? []),
            'requiredBridgeCapabilities' => array_values(array_unique($meta['requiredBridgeCapabilities'] ?? [$componentType])),
            'knownTypes' => array_values(array_unique($meta['knownTypes'] ?? [])),
            'renderer' => [
                'candidate' => (string) ($meta['renderer'] ?? 'native'),
                'fallbackScope' => $fallbackScope,
                'reason' => $meta['fallbackReason'] ?? null,
            ],
            'resources' => [
                'core' => array_values($meta['coreChunks'] ?? ['dcat-modern']),
                'compat' => array_values($meta['compatChunks'] ?? []),
                'aliases' => array_values($meta['resourceAliases'] ?? []),
            ],
            'compatRequirements' => $compat,
            'customContent' => [
                'bladeOverride' => (bool) ($meta['bladeOverride'] ?? false),
                'renderable' => (bool) ($meta['renderable'] ?? false),
                'sections' => (bool) ($meta['sections'] ?? false),
            ],
            'slots' => array_values($meta['slots'] ?? []),
            'data' => $data,
        ];
    }

    public static function normalize(string $capability, array $payload, ?string $family = null, array $meta = []): array
    {
        if (isset($payload['schemaVersion'], $payload['componentType'], $payload['data'])) {
            return $payload;
        }

        $family = $family ?: explode('.', $capability, 2)[0];

        return static::make($family, $capability, $payload, $meta);
    }

    protected static function fallbackScope(string $family, string $componentType): string
    {
        if ($family === 'widget' || $family === 'extension' || $componentType === 'form.advanced') {
            return 'component';
        }
        if ($family === 'system') {
            return 'route';
        }

        return 'page';
    }
}
