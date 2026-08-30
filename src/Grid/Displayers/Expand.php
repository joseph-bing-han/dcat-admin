<?php

namespace Dcat\Admin\Grid\Displayers;

use Dcat\Admin\Admin;
use Dcat\Admin\Contracts\LazyRenderable;
use Dcat\Admin\Support\Helper;
use Illuminate\Support\Str;

class Expand extends AbstractDisplayer
{
    protected $button;

    protected static $counter = 0;

    protected $modernResolvedHtml;
    protected $modernResolvedUrl = '';
    protected $modernResolvedButton;
    protected $modernResolvedDataKey;

    public function button($button)
    {
        $this->button = $button;
    }

    public function display($callbackOrButton = null)
    {
        $html = $this->value;
        $remoteUrl = '';

        if ($callbackOrButton && $callbackOrButton instanceof \Closure) {
            $callbackOrButton = $callbackOrButton->call($this->row, $this);

            if (! $callbackOrButton instanceof LazyRenderable) {
                $html = Helper::render($callbackOrButton);

                $callbackOrButton = null;
            }
        }

        if ($callbackOrButton instanceof LazyRenderable) {
            $html = '<div style="min-height: 150px"></div>';

            $remoteUrl = $callbackOrButton->getUrl();
        } elseif (is_string($callbackOrButton) && is_subclass_of($callbackOrButton, LazyRenderable::class)) {
            $html = '<div style="min-height: 150px"></div>';

            $renderable = $callbackOrButton::make();

            $remoteUrl = $renderable->getUrl();
        } elseif ($callbackOrButton && is_string($callbackOrButton)) {
            $this->button = $callbackOrButton;
        }

        $button = is_null($this->button) ? $this->value : $this->button;
        $dataKey = $this->getDataKey();

        $this->modernResolvedHtml = $html;
        $this->modernResolvedUrl = $remoteUrl;
        $this->modernResolvedButton = $button;
        $this->modernResolvedDataKey = $dataKey;

        return Admin::view('admin::grid.displayer.expand', [
            'key'     => $this->getKey(),
            'url'     => $remoteUrl,
            'button'  => $button,
            'html'    => $html,
            'dataKey' => $dataKey,
        ]);
    }

    public function modernPayload(...$arguments)
    {
        // Remote/LazyRenderable expansion keeps the historical async-render
        // lifecycle inside a cell compat island until B5/B9 own that protocol.
        if ($this->modernResolvedUrl !== '') {
            return null;
        }

        $button = $this->modernText($this->modernResolvedButton);
        $content = $this->modernText($this->modernResolvedHtml);
        if ($button === null || $content === null) {
            return null;
        }

        return [
            'kind' => 'expand',
            'button' => $button,
            'content' => $content,
            'rowKey' => (string) $this->getKey(),
            'dataKey' => (string) $this->modernResolvedDataKey,
        ];
    }

    protected function getDataKey()
    {
        $key = $this->getKey() ?: Str::random(8);

        static::$counter++;

        return $this->grid->makeName($key.'-'.static::$counter);
    }
}
