<?php

namespace Dcat\Admin\Form\Field;

class Month extends Date
{
    // Store PHP date-format syntax; Date::render converts it to Moment's `MM`
    // for the classic datetimepicker path.
    protected $format = 'm';
}
