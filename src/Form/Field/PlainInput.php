<?php

namespace Dcat\Admin\Form\Field;

trait PlainInput
{
    protected $prepend;

    protected $append;

    public function prepend($string)
    {
        $this->prepend = $string;

        return $this;
    }

    public function append($string)
    {
        $this->append = $string;

        return $this;
    }

    public function modernInputAffixes()
    {
        return [
            'prepend' => $this->prepend,
            'append' => $this->append,
        ];
    }

    protected function initPlainInput()
    {
        if (empty($this->view)) {
            $this->view = 'admin::form.input';
        }
    }
}
