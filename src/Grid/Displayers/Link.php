<?php

namespace Dcat\Admin\Grid\Displayers;

class Link extends AbstractDisplayer
{
    protected $resolvedHref;
    protected $resolvedTarget;

    public function display($href = '', $target = '_blank')
    {
        if ($href instanceof \Closure) {
            $href = $href->bindTo($this->row);

            $href = call_user_func($href, $this->value);
        } else {
            $href = $href ?: $this->value;
        }

        $this->resolvedHref = $href;
        $this->resolvedTarget = $target;

        return "<a href='$href' target='$target'>{$this->value}</a>";
    }

    public function modernPayload(...$arguments)
    {
        $text = $this->modernText($this->value);
        $href = (string) $this->resolvedHref;
        if ($text === null || preg_match('/^\s*javascript:/i', $href)) {
            return null;
        }

        return [
            'kind' => 'link',
            'text' => $text,
            'href' => $href,
            'target' => (string) $this->resolvedTarget,
        ];
    }
}
