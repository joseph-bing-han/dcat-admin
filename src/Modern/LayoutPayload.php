<?php

namespace Dcat\Admin\Modern;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Request;

class LayoutPayload
{
    /**
     * @param  mixed  $header
     * @param  mixed  $description
     * @param  array  $breadcrumb
     * @return array|null
     */
    public static function header($header, $description, array $breadcrumb = [])
    {
        $header = static::plainText($header);
        $description = static::plainText($description);
        if ($header === null || $description === null) {
            return;
        }

        $items = [[
            'text' => static::plainText(admin_trans('admin.home')),
            'url' => admin_url('/'),
            'icon' => 'fa-dashboard',
            'current' => false,
        ]];

        if ($breadcrumb) {
            $last = count($breadcrumb) - 1;
            foreach (array_values($breadcrumb) as $index => $item) {
                $text = static::plainText(Arr::get($item, 'text', ''));
                $icon = (string) Arr::get($item, 'icon', '');
                if ($text === null || ($icon && ! preg_match('/^[A-Za-z0-9 _:\-]+$/', $icon))) {
                    return;
                }

                $items[] = [
                    'text' => $text,
                    'url' => $index === $last ? '' : admin_url(Arr::get($item, 'url')),
                    'icon' => $icon,
                    'current' => $index === $last,
                ];
            }
        } elseif (config('admin.enable_default_breadcrumb')) {
            $segments = Request::segments();
            $last = count($segments) - 1;
            foreach (array_slice($segments, 1) as $index => $segment) {
                $text = static::plainText(admin_trans_label($segment));
                if ($text === null) {
                    return;
                }
                $items[] = [
                    'text' => $text,
                    'url' => $index === $last - 1 ? '' : admin_url(implode('/', array_slice($segments, 1, $index + 1))),
                    'icon' => '',
                    'current' => $index === $last - 1,
                ];
            }
        } elseif (! $breadcrumb) {
            $items = [];
        }

        return [
            'header' => $header,
            'description' => $description,
            'breadcrumbs' => $items,
        ];
    }

    /**
     * @param  mixed  $value
     * @return string|null
     */
    protected static function plainText($value)
    {
        if (! is_scalar($value) && $value !== null) {
            return;
        }

        $value = (string) $value;
        if ($value !== strip_tags($value)) {
            return;
        }

        return html_entity_decode($value, ENT_QUOTES, 'UTF-8');
    }
}
