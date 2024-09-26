<?php

namespace Dcat\Admin\Form\Field;

class Rate extends Text
{
    protected $view = 'admin::form.rate';

    /**
     * Set min value of number field.
     *
     * @param int $value
     * @return $this
     */
    public function min($value)
    {
        $this->attribute('min', $value);

        return $this;
    }

    /**
     * Set max value of number field.
     *
     * @param int $value
     * @return $this
     */
    public function max($value)
    {
        $this->attribute('max', $value);

        return $this;
    }

    /**
     * Set step value of number field.
     *
     * @param int $value
     * @return $this
     */
    public function step($value)
    {
        $this->attribute('step', $value);

        return $this;
    }

    public function render()
    {
        $this->defaultAttribute('style', 'width: 140px; flex:none; text-align: right;');
        $this->defaultAttribute('placeholder', 0);

        return parent::render();
    }
}
