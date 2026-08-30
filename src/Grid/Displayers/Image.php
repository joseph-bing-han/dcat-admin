<?php

namespace Dcat\Admin\Grid\Displayers;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Facades\Storage;

class Image extends AbstractDisplayer
{
    public function display($server = '', $width = 200, $height = 200)
    {
        return collect($this->resolvedImages($server))->map(function ($src) use ($width, $height) {
            return "<img data-action='preview-img' src='$src' style='max-width:{$width}px;max-height:{$height}px;cursor:pointer' class='img img-thumbnail' />";
        })->implode('&nbsp;');
    }

    public function modernPayload(...$arguments)
    {
        $server = $arguments[0] ?? '';
        $width = (int) ($arguments[1] ?? 200);
        $height = (int) ($arguments[2] ?? 200);

        return [
            'kind' => 'images',
            'items' => array_map(function ($src) use ($width, $height) {
                return [
                    'src' => $src,
                    'maxWidth' => $width,
                    'maxHeight' => $height,
                    'preview' => true,
                ];
            }, $this->resolvedImages($server)),
        ];
    }

    protected function resolvedImages($server)
    {
        $value = $this->value instanceof Arrayable ? $this->value->toArray() : $this->value;

        return collect((array) $value)->filter()->map(function ($path) use ($server) {
            if (url()->isValidUrl($path) || mb_strpos($path, 'data:image') === 0) {
                return $path;
            }
            if ($server) {
                return rtrim($server, '/').'/'.ltrim($path, '/');
            }

            return Storage::disk(config('admin.upload.disk'))->url($path);
        })->values()->all();
    }
}
