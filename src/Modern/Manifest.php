<?php

namespace Dcat\Admin\Modern;

class Manifest
{
    const ENTRY = 'resources/modern/index.tsx';

    protected $data;

    protected $path;

    public function path()
    {
        if ($this->path) {
            return $this->path;
        }

        return $this->path = config('admin.modern.manifest')
            ?: dirname(__DIR__, 2).'/resources/dist/modern/manifest.json';
    }

    public function exists()
    {
        return is_file($this->path());
    }

    public function all()
    {
        if ($this->data !== null) {
            return $this->data;
        }

        if (! $this->exists()) {
            return $this->data = [];
        }

        $data = json_decode(file_get_contents($this->path()), true);

        return $this->data = is_array($data) ? $data : [];
    }

    public function entry($name = self::ENTRY)
    {
        $manifest = $this->all();

        if (isset($manifest[$name])) {
            return $manifest[$name];
        }

        foreach ($manifest as $entry) {
            if (! empty($entry['isEntry'])) {
                return $entry;
            }
        }

        return null;
    }

    public function assets($name = self::ENTRY)
    {
        $entry = $this->entry($name);

        if (! is_array($entry) || empty($entry['file']) || ! $this->assetExists($entry['file'], '.js')) {
            return ['js' => null, 'css' => []];
        }

        $css = isset($entry['css']) ? (array) $entry['css'] : [];

        if (! $css) {
            foreach ($this->all() as $item) {
                if (! empty($item['file']) && substr($item['file'], -4) === '.css') {
                    $css[] = $item['file'];
                }
            }
        }

        foreach ($css as $file) {
            if (! $this->assetExists($file, '.css')) {
                return ['js' => null, 'css' => []];
            }
        }

        return [
            'js' => $entry['file'],
            'css' => array_values(array_unique($css)),
        ];
    }

    public function fingerprint()
    {
        return $this->exists() ? hash_file('sha256', $this->path()) : null;
    }

    protected function assetExists($file, $extension)
    {
        if (! is_string($file) || $file === '' || substr($file, -strlen($extension)) !== $extension) {
            return false;
        }

        $file = str_replace('\\', '/', $file);
        if ($file[0] === '/' || strpos($file, "\0") !== false || preg_match('#(?:^|/)\.\.(?:/|$)#', $file)) {
            return false;
        }

        return is_file(dirname($this->path()).'/'.$file);
    }
}

