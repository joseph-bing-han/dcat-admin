<?php

namespace Dcat\Admin\Modern;

use Dcat\Admin\Show;
use Dcat\Admin\Show\Field;

class ShowViewModel
{
    public static function make(Show $show): array
    {
        $panel = $show->panel()->modernViewData();
        $standardPanel = $show->panel()->usesDefaultView()
            && $show->rows()->isEmpty()
            && ($panel['tools']['renderer'] ?? 'compat') === 'native';

        $fields = [];
        $hasUnsupportedField = false;
        foreach ($show->fields() as $index => $field) {
            if (! $field instanceof Field) {
                $hasUnsupportedField = true;
                continue;
            }
            $slotId = 'show-field-'.$index;
            $field->markModernSlot($slotId);
            $fieldData = $field->modernViewData();
            if (($fieldData['renderer'] ?? '') === 'compat' && empty($fieldData['slotCompatible'])) {
                $standardPanel = false;
            }
            $fields[] = $fieldData;
        }
        if ($hasUnsupportedField) {
            $standardPanel = false;
        }

        $relations = [];
        foreach ($show->relations()->values() as $index => $relation) {
            $relations[] = [
                'slotId' => 'show-relation-'.$index,
                'width' => (int) ($relation->width ?: 12),
            ];
        }

        $slots = [];
        if (! $standardPanel) {
            $slots[] = ['id' => 'show-primary', 'kind' => 'compat', 'role' => 'detail'];
        } else {
            foreach ($fields as $field) {
                if (($field['renderer'] ?? '') !== 'native') {
                    $slots[] = ['id' => $field['slotId'], 'kind' => 'compat', 'role' => 'field'];
                }
            }
        }
        foreach ($relations as $relation) {
            $slots[] = ['id' => $relation['slotId'], 'kind' => 'compat', 'role' => 'relation'];
        }

        $hasCompat = count($slots) > 0;

        return ViewModel::make('show', 'show.detail', [
            'width' => $show->getWidth(),
            'standardPanel' => $standardPanel,
            'panel' => [
                'title' => (string) ($panel['title'] ?? ''),
                'actions' => $panel['tools']['actions'] ?? [],
            ],
            'fields' => $fields,
            'relations' => $relations,
        ], [
            'knownTypes' => array_values(array_unique(array_map(function (array $field) {
                return (string) ($field['name'] ?? '');
            }, $fields))),
            'slots' => $slots,
            'compatRequirements' => [
                'jquery' => $hasCompat,
                'pluginAdapters' => [],
                'customSlots' => $hasCompat,
            ],
        ]);
    }
}
