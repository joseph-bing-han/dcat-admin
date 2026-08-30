<?php

namespace Dcat\Admin\Modern;

use Dcat\Admin\Tree;
use Dcat\Admin\Support\Helper;

class TreeViewModel
{
    public static function make(Tree $tree, array $items): array
    {
        $native = $tree->isModernNativeCandidate();
        $actionsCompat = $native && $tree->hasModernActionCompat();
        $columns = $tree->modernColumns();
        $slots = [];
        $nodes = $native
            ? static::nodes($items, (string) $columns['id'], (string) $columns['title'], $actionsCompat, $slots)
            : [];

        if (! $native) {
            $slots[] = ['id' => 'tree-primary', 'kind' => 'compat', 'role' => 'tree'];
        }

        $hasCompat = count($slots) > 0;

        return ViewModel::make('tree', 'tree.page', [
            'id' => (string) $tree->modernId(),
            'native' => $native,
            'saveUrl' => (string) $tree->resource(),
            'orderName' => Tree::SAVE_ORDER_NAME,
            'useSave' => (bool) $tree->useSave,
            'useRefresh' => (bool) $tree->useRefresh,
            'useCreate' => (bool) $tree->useCreate,
            'createUrl' => rtrim((string) $tree->resource(), '/').'/create',
            'expanded' => (bool) $tree->expand,
            'maxDepth' => $tree->modernMaxDepth(),
            'nodes' => $nodes,
        ], [
            'knownTypes' => ['tree-node'],
            'slots' => $slots,
            'compatRequirements' => [
                'jquery' => $hasCompat,
                'pluginAdapters' => [],
                'customSlots' => $hasCompat,
            ],
        ]);
    }

    public static function actionSlotId($id): string
    {
        return 'tree-action-'.sha1((string) $id);
    }

    protected static function nodes(array $items, string $idColumn, string $titleColumn, bool $actionsCompat, array &$slots): array
    {
        $nodes = [];
        foreach ($items as $item) {
            $row = Helper::array($item);
            $id = $row[$idColumn] ?? null;
            if ($id === null || $id === '') {
                continue;
            }
            $slotId = $actionsCompat ? static::actionSlotId($id) : '';
            if ($slotId) {
                $slots[] = ['id' => $slotId, 'kind' => 'compat', 'role' => 'node-actions'];
            }
            $children = isset($row['children']) ? Helper::array($row['children']) : [];
            $nodes[] = [
                'id' => (string) $id,
                'label' => trim((string) $id.' - '.(string) ($row[$titleColumn] ?? '')),
                'actionSlotId' => $slotId,
                'children' => static::nodes($children, $idColumn, $titleColumn, $actionsCompat, $slots),
            ];
        }

        return $nodes;
    }
}
