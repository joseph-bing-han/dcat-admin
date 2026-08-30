<?php

namespace Dcat\Admin\Modern;

use Dcat\Admin\Form\BlockForm;
use Dcat\Admin\Form\Builder;
use Dcat\Admin\Form\Field;
use Dcat\Admin\Form\Layout as FormLayout;
use Dcat\Admin\Form\Row as FormRow;
use Dcat\Admin\Layout\Column as LayoutColumn;
use Dcat\Admin\Layout\Row as LayoutRow;

class FormViewModel
{
    protected const NATIVE_BASIC_FIELDS = [
        'Text', 'Textarea', 'Id', 'Url', 'Email', 'Password', 'Number', 'Tel', 'Display', 'Hidden',
        'Select', 'Radio', 'Checkbox', 'SwitchField', 'Date', 'Time',
    ];

    /**
     * B7 fields whose legacy Bootstrap/jQuery presentation can be replaced by
     * a Dcat-owned payload control without changing the submitted field shape.
     */
    protected const NATIVE_ADVANCED_FIELDS = [
        'Currency', 'Decimal', 'Ip', 'Mobile', 'Rate',
        'Datetime', 'Month', 'Year', 'Color',
        'MultipleSelect', 'Listbox', 'Timezone',
        'Range', 'DateRange', 'DatetimeRange', 'TimeRange',
    ];

    protected const RANGE_FIELDS = ['Range', 'DateRange', 'DatetimeRange', 'TimeRange'];

    public static function make(Builder $builder): array
    {
        $fields = [];
        $slotsByObject = [];
        $register = function (Field $field) use (&$fields, &$slotsByObject) {
            $objectId = spl_object_hash($field);
            if (isset($slotsByObject[$objectId])) {
                return $slotsByObject[$objectId];
            }

            $slotId = 'field-'.count($fields);
            $slotsByObject[$objectId] = $slotId;
            $fields[] = static::field($field, $slotId);

            return $slotId;
        };

        $layoutTree = static::layoutTree($builder, $register);
        $advanced = array_values(array_filter($fields, function (array $field) {
            return $field['renderer'] !== 'native';
        }));
        $slots = array_map(function (array $field) {
            return [
                'id' => $field['slotId'],
                'kind' => $field['renderer'] === 'native' ? 'control' : 'compat',
                'role' => 'field',
                'column' => $field['column'],
                'serverType' => $field['serverType'],
            ];
        }, $fields);
        $layoutCompat = static::layoutHasCompat($layoutTree);

        return ViewModel::make('form', 'form.basic', [
            'id' => $builder->getElementId(),
            'title' => (string) $builder->title(),
            'mode' => (string) $builder->mode(),
            'action' => (string) $builder->action(),
            'method' => $builder->isMode(Builder::MODE_EDIT) ? 'PUT' : 'POST',
            'multipart' => $builder->hasFile(),
            'layout' => [
                'hasRows' => $builder->hasRows(),
                'hasColumns' => $builder->layout()->hasColumns(),
                'hasBlocks' => $builder->layout()->hasBlocks(),
                'tree' => $layoutTree,
            ],
            'fields' => $fields,
            'advancedFieldCount' => count($advanced),
        ], [
            'componentId' => $builder->getElementId(),
            'knownTypes' => array_values(array_unique(array_column($fields, 'serverType'))),
            'slots' => $slots,
            'compatRequirements' => [
                'jquery' => count($advanced) > 0,
                'pluginAdapters' => array_values(array_unique(array_filter(array_column($advanced, 'adapter')))),
                'customSlots' => count($advanced) > 0 || $layoutCompat,
            ],
        ]);
    }

    protected static function layoutTree(Builder $builder, callable $register): array
    {
        $form = $builder->form();
        $tabs = $form ? $form->getTab() : null;
        if ($tabs && ! $tabs->isEmpty()) {
            $items = [];
            foreach ($tabs->getTabs() as $tab) {
                $layout = $tab['layout'] ?? null;
                $content = $layout instanceof FormLayout && ($layout->hasColumns() || $layout->hasBlocks())
                    ? static::formLayoutNode($layout, $register)
                    : static::fieldCollectionNode($tab['fields'] ?? [], $register);
                $items[] = [
                    'id' => (string) ($tab['id'] ?? ''),
                    'title' => trim(html_entity_decode(strip_tags((string) ($tab['title'] ?? '')), ENT_QUOTES, 'UTF-8')),
                    'active' => ! empty($tab['active']),
                    'content' => $content,
                ];
            }

            return ['kind' => 'tabs', 'items' => $items];
        }

        if ($builder->hasRows()) {
            $children = [];
            foreach ($builder->rows() as $row) {
                if ($row instanceof FormRow) {
                    $children[] = static::formRowNode($row, $register);
                }
            }
            foreach ($builder->fields() as $field) {
                if ($field instanceof \Dcat\Admin\Form\Field\Hidden) {
                    $children[] = static::fieldNode($field, $register);
                }
            }

            return ['kind' => 'rows', 'children' => $children];
        }

        if ($builder->layout()->hasColumns() || $builder->layout()->hasBlocks()) {
            return static::formLayoutNode($builder->layout(), $register);
        }

        return static::fieldCollectionNode($builder->fields(), $register);
    }

    protected static function fieldCollectionNode($items, callable $register): array
    {
        $children = [];
        foreach ($items as $item) {
            if ($item instanceof Field) {
                $children[] = static::fieldNode($item, $register);
            } elseif ($item instanceof FormRow) {
                $children[] = static::formRowNode($item, $register);
            }
        }

        return ['kind' => 'stack', 'children' => $children];
    }

    protected static function fieldNode(Field $field, callable $register): array
    {
        return ['kind' => 'field', 'slotId' => $register($field)];
    }

    protected static function formRowNode(FormRow $row, callable $register): array
    {
        $columns = [];
        foreach ($row->fields() as $item) {
            $field = is_array($item) && isset($item['element']) ? $item['element'] : null;
            if (! $field instanceof Field) {
                continue;
            }
            $columns[] = [
                'kind' => 'column',
                'width' => ['md' => (int) ($item['width'] ?? 12)],
                'children' => [static::fieldNode($field, $register)],
            ];
        }

        return ['kind' => 'row', 'children' => $columns];
    }

    protected static function formLayoutNode(FormLayout $layout, callable $register): array
    {
        $columns = [];
        foreach ($layout->getColumns() as $column) {
            if ($column instanceof LayoutColumn) {
                $columns[] = static::layoutColumnNode($column, $register);
            }
        }

        return ['kind' => 'columns', 'children' => $columns];
    }

    protected static function layoutColumnNode(LayoutColumn $column, callable $register): array
    {
        $children = [];
        foreach ($column->contents() as $content) {
            $node = static::layoutContentNode($content, $register);
            if ($node) {
                $children[] = $node;
            }
        }

        return [
            'kind' => 'column',
            'width' => $column->widths(),
            'children' => $children,
        ];
    }

    protected static function layoutContentNode($content, callable $register): ?array
    {
        if ($content instanceof Field) {
            return static::fieldNode($content, $register);
        }
        if ($content instanceof LayoutRow) {
            $columns = [];
            foreach ($content->columns() as $column) {
                if ($column instanceof LayoutColumn) {
                    $columns[] = static::layoutColumnNode($column, $register);
                }
            }

            return ['kind' => 'row', 'children' => $columns];
        }
        if ($content instanceof BlockForm) {
            $body = $content->layout()->hasColumns() || $content->layout()->hasBlocks()
                ? static::formLayoutNode($content->layout(), $register)
                : static::fieldCollectionNode($content->fields(), $register);

            return [
                'kind' => 'block',
                'title' => trim(html_entity_decode(strip_tags((string) $content->getTitle()), ENT_QUOTES, 'UTF-8')),
                'content' => $body,
            ];
        }

        if (is_string($content) && trim($content) === '') {
            return null;
        }

        return [
            'kind' => 'compat-layout',
            'serverType' => is_object($content) ? get_class($content) : gettype($content),
        ];
    }

    protected static function layoutHasCompat(array $node): bool
    {
        if (($node['kind'] ?? '') === 'compat-layout') {
            return true;
        }
        foreach (['children', 'items'] as $key) {
            foreach (($node[$key] ?? []) as $child) {
                $candidate = isset($child['content']) && is_array($child['content']) ? $child['content'] : $child;
                if (is_array($candidate) && static::layoutHasCompat($candidate)) {
                    return true;
                }
            }
        }
        if (isset($node['content']) && is_array($node['content']) && static::layoutHasCompat($node['content'])) {
            return true;
        }

        return false;
    }

    protected static function field(Field $field, string $slotId): array
    {
        $class = get_class($field);
        $base = class_basename($class);
        $metadata = $field->modernViewData();
        $control = static::isNativeField($base, $metadata)
            ? static::nativeControl($base, $metadata, $slotId)
            : null;
        $native = $control !== null;
        $field->markModernNative($native);
        $column = $field->column();

        return [
            'slotId' => $slotId,
            'column' => is_array($column) ? array_values($column) : (string) $column,
            'name' => is_array($metadata['name']) ? array_values($metadata['name']) : (string) $metadata['name'],
            'label' => trim(html_entity_decode(strip_tags((string) $field->label()), ENT_QUOTES, 'UTF-8')),
            'serverType' => $class,
            'fieldType' => $base,
            'view' => (string) $field->view(),
            'renderer' => $native ? 'native' : 'compat',
            'adapter' => $native ? '' : 'legacy-form-field:'.$base,
            'control' => $control,
        ];
    }

    protected static function isNativeField(string $base, array $metadata): bool
    {
        $basic = in_array($base, static::NATIVE_BASIC_FIELDS, true);
        $advanced = in_array($base, static::NATIVE_ADVANCED_FIELDS, true);
        if (! $basic && ! $advanced) {
            return false;
        }

        if (! empty($metadata['hasCustomScript']) || ! empty($metadata['hasDisplayCallback'])) {
            return false;
        }

        if (in_array($base, ['Select', 'Radio', 'Checkbox', 'MultipleSelect', 'Listbox'], true)
            && ! empty($metadata['dynamicBehavior'])) {
            return false;
        }

        if ($base === 'Date' && ($metadata['format'] ?? 'Y-m-d') !== 'Y-m-d') {
            return false;
        }

        if ($base === 'Time' && ! in_array(($metadata['format'] ?? 'H:i:s'), ['H:i', 'H:i:s'], true)) {
            return false;
        }

        return true;
    }

    protected static function nativeControl(string $base, array $metadata, string $slotId): ?array
    {
        $attributes = (array) $metadata['attributes'];
        $names = is_array($metadata['name']) ? $metadata['name'] : ['value' => (string) $metadata['name']];
        $name = (string) reset($names);
        $value = $metadata['value'];
        $viewClass = (array) $metadata['viewClass'];
        $rawElementClass = $metadata['elementClass'];
        $elementClass = is_array($rawElementClass)
            ? trim(implode(' ', array_filter(array_map('strval', $rawElementClass))))
            : trim((string) $rawElementClass);
        $controlId = isset($attributes['id']) && $attributes['id'] !== ''
            ? (string) $attributes['id']
            : 'dcat-modern-'.str_replace(['[', ']', '.', ' '], ['-', '', '-', '-'], $name ?: $slotId);

        if (in_array($base, static::RANGE_FIELDS, true)) {
            return static::nativeRangeControl($base, $metadata, $slotId, $controlId, $attributes, $viewClass, $elementClass);
        }

        $kind = 'input';
        $type = 'text';
        $multiple = false;
        if ($base === 'Hidden') {
            $kind = 'hidden';
            $type = 'hidden';
        } elseif ($base === 'Textarea') {
            $kind = 'textarea';
        } elseif ($base === 'Display') {
            $kind = 'display';
        } elseif (in_array($base, ['Select', 'MultipleSelect', 'Timezone'], true)) {
            $kind = 'select';
            $multiple = $base === 'MultipleSelect';
        } elseif ($base === 'Listbox') {
            $kind = 'dual-list';
            $multiple = true;
        } elseif ($base === 'Radio') {
            $kind = 'radio';
        } elseif ($base === 'Checkbox') {
            $kind = 'checkbox';
        } elseif ($base === 'SwitchField') {
            $kind = 'switch';
            $type = 'checkbox';
        } elseif ($base === 'Color') {
            $kind = 'color';
        } elseif ($base === 'Date') {
            $type = 'date';
        } elseif ($base === 'Time') {
            $type = 'time';
        } elseif ($base === 'Datetime') {
            // Keep the historical submitted `Y-m-d H:i:s` value shape instead
            // of changing it to the HTML datetime-local `T` separator.
            $type = 'text';
        } elseif ($base === 'Month') {
            $type = 'number';
            $attributes += ['min' => 1, 'max' => 12, 'inputmode' => 'numeric'];
        } elseif ($base === 'Year') {
            $type = 'number';
            $attributes += ['min' => 1, 'inputmode' => 'numeric'];
        } elseif (in_array($base, ['Currency', 'Decimal', 'Rate'], true)) {
            $type = 'number';
            $attributes += ['step' => 'any', 'inputmode' => 'decimal'];
        } elseif ($base === 'Ip') {
            $type = 'text';
            $attributes += ['inputmode' => 'decimal', 'autocomplete' => 'off'];
        } elseif ($base === 'Mobile') {
            $type = 'tel';
            $attributes += ['inputmode' => 'numeric', 'pattern' => '[0-9]{11}'];
        } elseif ($base === 'Email') {
            $type = 'email';
        } elseif ($base === 'Url') {
            $type = 'url';
        } elseif ($base === 'Password') {
            $type = 'password';
        } elseif ($base === 'Number') {
            $type = 'number';
        } elseif ($base === 'Tel') {
            $type = 'tel';
        }

        if ($kind === 'input' && isset($attributes['type'])) {
            $type = (string) $attributes['type'];
        }

        if ($base === 'Id') {
            $attributes['readonly'] = 'readonly';
        }
        if ($metadata['required']) {
            $attributes['required'] = 'required';
        }

        unset($attributes['type'], $attributes['name'], $attributes['value'], $attributes['class'], $attributes['placeholder'], $attributes['id']);

        if (is_array($value) && ! in_array($kind, ['checkbox', 'radio', 'select', 'dual-list'], true)) {
            $value = $kind === 'textarea' ? json_encode($value, JSON_PRETTY_PRINT) : json_encode($value);
        }

        $help = (array) $metadata['help'];
        $options = $base === 'Timezone'
            ? static::normalizeOptions(array_combine(\DateTimeZone::listIdentifiers(\DateTimeZone::ALL), \DateTimeZone::listIdentifiers(\DateTimeZone::ALL)))
            : static::normalizeOptions((array) ($metadata['options'] ?? []));
        $affixes = static::normalizeAffixes((array) ($metadata['affixes'] ?? []));
        if ($base === 'Rate') {
            $affixes['append'] = '%';
        }

        return [
            'kind' => $kind,
            'type' => $type,
            'id' => $controlId,
            'name' => $name,
            'value' => is_array($value) ? array_values($value) : ($value === null ? '' : (string) $value),
            'options' => $options,
            'groups' => static::normalizeGroups((array) ($metadata['groups'] ?? [])),
            'multiple' => $multiple,
            'prepend' => $affixes['prepend'],
            'append' => $affixes['append'],
            'placeholder' => (string) $metadata['placeholder'],
            'className' => in_array($kind, ['display', 'radio', 'checkbox', 'switch', 'hidden', 'dual-list'], true) ? $elementClass : trim('form-control '.$elementClass),
            'attributes' => $attributes,
            'viewClass' => $viewClass,
            'formGroupClass' => (string) $metadata['formGroupClass'],
            'help' => isset($help['text']) ? trim(html_entity_decode(strip_tags((string) $help['text']), ENT_QUOTES, 'UTF-8')) : '',
            'errorKey' => is_array($metadata['errorKey']) ? implode('.', $metadata['errorKey']) : (string) $metadata['errorKey'],
        ];
    }

    protected static function nativeRangeControl(string $base, array $metadata, string $slotId, string $controlId, array $attributes, array $viewClass, string $elementClass): array
    {
        $names = (array) $metadata['name'];
        $values = (array) $metadata['value'];
        $type = $base === 'DateRange' ? 'date' : ($base === 'TimeRange' ? 'time' : 'text');
        if ($base === 'TimeRange') {
            $attributes += ['step' => 1];
        }
        if ($metadata['required']) {
            $attributes['required'] = 'required';
        }
        unset($attributes['type'], $attributes['name'], $attributes['value'], $attributes['class'], $attributes['placeholder'], $attributes['id']);

        $inputs = [];
        foreach (['start', 'end'] as $key) {
            $inputName = (string) ($names[$key] ?? $names[array_key_first($names)] ?? '');
            $inputs[] = [
                'key' => $key,
                'id' => $controlId.'-'.$key,
                'name' => $inputName,
                'type' => $type,
                'value' => isset($values[$key]) ? (string) $values[$key] : '',
                'attributes' => $attributes,
            ];
        }

        $help = (array) $metadata['help'];

        return [
            'kind' => 'range-pair',
            'type' => $type,
            'id' => $controlId,
            'name' => (string) ($inputs[0]['name'] ?? $slotId),
            'value' => array_values($values),
            'options' => [],
            'groups' => [],
            'multiple' => false,
            'prepend' => '',
            'append' => '',
            'inputs' => $inputs,
            'placeholder' => (string) $metadata['placeholder'],
            'className' => trim('form-control '.$elementClass),
            'attributes' => $attributes,
            'viewClass' => $viewClass,
            'formGroupClass' => (string) $metadata['formGroupClass'],
            'help' => isset($help['text']) ? trim(html_entity_decode(strip_tags((string) $help['text']), ENT_QUOTES, 'UTF-8')) : '',
            'errorKey' => is_array($metadata['errorKey']) ? implode('.', $metadata['errorKey']) : (string) $metadata['errorKey'],
        ];
    }

    protected static function normalizeAffixes(array $affixes): array
    {
        $text = static function ($value) {
            return trim(html_entity_decode(strip_tags((string) $value), ENT_QUOTES, 'UTF-8'));
        };

        return [
            'prepend' => $text($affixes['prepend'] ?? ''),
            'append' => $text($affixes['append'] ?? ''),
        ];
    }

    protected static function normalizeOptions(array $options): array
    {
        $normalized = [];
        foreach ($options as $value => $label) {
            $normalized[] = [
                'value' => (string) $value,
                'label' => trim(html_entity_decode(strip_tags((string) $label), ENT_QUOTES, 'UTF-8')),
            ];
        }

        return $normalized;
    }

    protected static function normalizeGroups(array $groups): array
    {
        $normalized = [];
        foreach ($groups as $group) {
            if (! is_array($group) || ! isset($group['options'])) {
                continue;
            }
            $normalized[] = [
                'label' => trim(html_entity_decode(strip_tags((string) ($group['label'] ?? '')), ENT_QUOTES, 'UTF-8')),
                'options' => static::normalizeOptions((array) $group['options']),
            ];
        }

        return $normalized;
    }
}
