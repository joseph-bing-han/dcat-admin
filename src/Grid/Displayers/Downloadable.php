<?php

namespace Dcat\Admin\Grid\Displayers;

use Dcat\Admin\Support\Helper;
use Illuminate\Support\Facades\Storage;

class Downloadable extends AbstractDisplayer
{
    public function display($server = '', $disk = null)
    {
        return collect($this->resolvedDownloads($server, $disk))->map(function ($item) {
            return <<<HTML
<a href='{$item['href']}' download='{$item['name']}' target='_blank' class='text-muted'>
    <i class="feather icon-download"></i> {$item['name']}
</a>
HTML;
        })->implode('<br>');
    }

    public function modernPayload(...$arguments)
    {
        return [
            'kind' => 'downloads',
            'items' => $this->resolvedDownloads($arguments[0] ?? '', $arguments[1] ?? null),
        ];
    }

    protected function resolvedDownloads($server, $disk)
    {
        return collect(Helper::array($this->value))->filter()->map(function ($value) use ($server, $disk) {
            if (url()->isValidUrl($value)) {
                $src = $value;
            } elseif ($server) {
                $src = rtrim($server, '/').'/'.ltrim($value, '/');
            } else {
                $src = Storage::disk($disk ?: config('admin.upload.disk'))->url($value);
            }

            return [
                'href' => $src,
                'name' => Helper::basename($value),
            ];
        })->values()->all();
    }
}
