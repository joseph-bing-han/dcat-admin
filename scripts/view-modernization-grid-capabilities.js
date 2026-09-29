'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'codestable/epics/001-x-view-layer-modernization/grid-capability-registry.json');
const checkOnly = process.argv.includes('--check');
const errors = [];

const nativeDisplayers = new Set([
    'AbstractDisplayer.php',
    'Badge.php',
    'Button.php',
    'Downloadable.php',
    'Expand.php',
    'Image.php',
    'Label.php',
    'Link.php',
    'ProgressBar.php',
    'Table.php',
]);

const compatDisplayers = new Set([
    'Actions.php',
    'Checkbox.php',
    'ContextMenuActions.php',
    'Copyable.php',
    'DialogTree.php',
    'DropdownActions.php',
    'Editable.php',
    'Input.php',
    'Limit.php',
    'Modal.php',
    'Orderable.php',
    'QRCode.php',
    'Radio.php',
    'Select.php',
    'SwitchDisplay.php',
    'SwitchGroup.php',
    'Textarea.php',
    'Tree.php',
]);

const compatFilters = new Set([
    'AbstractFilter.php',
    'Between.php',
    'Date.php',
    'Day.php',
    'EndWith.php',
    'Equal.php',
    'FindInSet.php',
    'Group.php',
    'Gt.php',
    'Hidden.php',
    'Ilike.php',
    'In.php',
    'Layout/Column.php',
    'Layout/Layout.php',
    'Like.php',
    'Lt.php',
    'Month.php',
    'Newline.php',
    'Ngt.php',
    'Nlt.php',
    'NotEqual.php',
    'NotIn.php',
    'Presenter/Checkbox.php',
    'Presenter/DateTime.php',
    'Presenter/MultipleSelect.php',
    'Presenter/MultipleSelectTable.php',
    'Presenter/Presenter.php',
    'Presenter/Radio.php',
    'Presenter/Select.php',
    'Presenter/SelectTable.php',
    'Presenter/Text.php',
    'Scope.php',
    'StartWith.php',
    'Where.php',
    'WhereBetween.php',
    'Year.php',
]);

const actionStatus = new Map([
    ['Actions/Delete.php', ['native', 'compat-island', 'native-grid-runtime', 'standard request + native confirm overlay']],
    ['Actions/Edit.php', ['native', 'compat-island', 'native-pjax', 'link navigation']],
    ['Actions/QuickEdit.php', ['compat', 'compat-island', 'compat', 'inline edit keeps legacy extension lifecycle']],
    ['Actions/Show.php', ['native', 'compat-island', 'native-pjax', 'link navigation']],
    ['BatchAction.php', ['compat', 'compat-island', 'compat', 'custom batch callbacks may register arbitrary scripts']],
    ['GridAction.php', ['compat', 'compat-island', 'compat', 'custom action base may register arbitrary scripts']],
    ['RowAction.php', ['compat', 'compat-island', 'compat', 'custom row action base may register arbitrary scripts']],
    ['Tools/AbstractTool.php', ['compat', 'compat-island', 'compat', 'abstract/custom tool contract']],
    ['Tools/ActionDivider.php', ['native', 'compat-island', 'native-grid-runtime', 'presentational divider']],
    ['Tools/BatchActions.php', ['native', 'compat-island', 'native-grid-runtime', 'selection state + dropdown ownership']],
    ['Tools/BatchDelete.php', ['native', 'compat-island', 'native-grid-runtime', 'standard batch request + native confirm overlay']],
    ['Tools/ColumnSelector.php', ['native', 'compat-island', 'native-grid-runtime', 'debounced PJAX query ownership']],
    ['Tools/CreateButton.php', ['compat', 'compat-island', 'compat', 'plain links are native-navigation compatible; dialog variant remains compat']],
    ['Tools/ExportButton.php', ['native', 'compat-island', 'native-grid-runtime', 'native dropdown + selected-key substitution']],
    ['Tools/FilterButton.php', ['native', 'compat-island', 'native-grid-runtime', 'native filter drawer/scope dropdown ownership']],
    ['Tools/Paginator.php', ['native', 'react-payload', 'native-pjax', 'server pagination payload']],
    ['Tools/PerPageSelector.php', ['native', 'compat-island', 'native-pjax', 'native dropdown + link navigation']],
    ['Tools/QuickCreate.php', ['compat', 'compat-island', 'compat', 'inline create form remains legacy extension surface']],
    ['Tools/QuickSearch.php', ['native', 'compat-island', 'native-grid-runtime', 'IME-safe debounced native PJAX query']],
    ['Tools/RefreshButton.php', ['native', 'compat-island', 'native-grid-runtime', 'native PJAX refresh']],
    ['Tools/RowSelector.php', ['native', 'compat-island', 'native-grid-runtime', 'row/select-all state + batch visibility']],
    ['Tools/Selector.php', ['compat', 'compat-island', 'compat', 'generic custom selector surface']],
]);

const actualDisplayers = relativeFiles('src/Grid/Displayers');
const actualFilters = relativeFiles('src/Grid/Filter');
const actualActions = [
    ...relativeFiles('src/Grid/Actions').map((file) => `Actions/${file}`),
    ...relativeFiles('src/Grid/Tools').map((file) => `Tools/${file}`),
    ...['BatchAction.php', 'GridAction.php', 'RowAction.php'].filter((file) => fs.existsSync(path.join(root, 'src/Grid', file))),
].sort();

validateExact('displayer', actualDisplayers, [...nativeDisplayers, ...compatDisplayers].sort(), 28);
validateExact('filter', actualFilters, [...compatFilters].sort(), 36);
validateExact('action/tool', actualActions, [...actionStatus.keys()].sort(), 22);

const displayers = actualDisplayers.map((file) => ({
    path: `src/Grid/Displayers/${file}`,
    status: nativeDisplayers.has(file) ? 'native' : 'compat',
    renderOwner: nativeDisplayers.has(file) && file !== 'AbstractDisplayer.php' ? 'react-payload' : nativeDisplayers.has(file) ? 'native-contract' : 'compat-island',
    interactionOwner: file === 'Expand.php' ? 'react' : nativeDisplayers.has(file) ? 'native-grid-view' : 'compat',
    fallback: file === 'Expand.php' ? 'cell-compat-for-remote-or-raw-html' : nativeDisplayers.has(file) ? 'cell-compat-if-payload-rejected' : 'cell-compat',
    ...displayerBrowserContract(file),
}));

const filters = actualFilters.map((file) => ({
    path: `src/Grid/Filter/${file}`,
    status: 'compat',
    renderOwner: 'compat-island',
    interactionOwner: 'native-grid-runtime',
    fallback: 'compat-filter-script-for-plugin-specific-control-behavior',
    fixtureRoute: '/tests/view-baseline/modern-grid-filter-matrix',
    browserTestId: 'grid-filter-matrix',
    browserWitness: filterBrowserWitness(file),
    note: file.startsWith('Presenter/')
        ? 'Presenter markup/plugin initialization remains compat; drawer/query submit is native.'
        : 'Server predicate contract unchanged; form/drawer/query submit is native while field markup remains compat.',
}));

const actions = actualActions.map((file) => {
    const [status, renderOwner, interactionOwner, note] = actionStatus.get(file);
    return {
        path: `src/Grid/${file}`,
        status,
        renderOwner,
        interactionOwner,
        note,
        ...actionBrowserContract(file),
    };
});

const registry = {
    schemaVersion: 1,
    contractVersion: '4.0.0',
    generatedAt: '2026-09-05',
    generator: 'scripts/view-modernization-grid-capabilities.js',
    policy: {
        statusValues: ['native', 'compat'],
        rule: 'Every inventoried Grid displayer, filter, and action/tool must have an explicit native or compat conclusion. Missing/new files fail the gate.',
        compatBoundary: 'Compat is component/cell/filter-control scoped; page-level rollback is not a capability classification.',
    },
    summary: {
        displayers: { total: displayers.length, native: count(displayers, 'native'), compat: count(displayers, 'compat') },
        filters: { total: filters.length, native: count(filters, 'native'), compat: count(filters, 'compat') },
        actions: { total: actions.length, native: count(actions, 'native'), compat: count(actions, 'compat') },
    },
    displayers,
    filters,
    actions,
};

[...displayers, ...filters, ...actions].forEach((entry) => {
    if (!entry.fixtureRoute || !entry.browserTestId || !entry.browserWitness) {
        fail(`Grid capability browser mapping is incomplete: ${entry.path}`);
    }
});

if (errors.length) finish();

if (checkOnly) {
    if (!fs.existsSync(outputPath)) fail(`Grid capability registry is missing: ${relative(outputPath)}`);
    else if (JSON.stringify(JSON.parse(fs.readFileSync(outputPath, 'utf8'))) !== JSON.stringify(registry)) {
        fail('Grid capability registry is stale; run npm run modern:grid-capabilities:update');
    }
    finish();
    console.log(`Grid capability registry OK: ${displayers.length} displayers (${registry.summary.displayers.native} native), ${filters.length} filters (${registry.summary.filters.compat} compat), ${actions.length} actions/tools (${registry.summary.actions.native} native).`);
    process.exit(0);
}

fs.writeFileSync(outputPath, `${JSON.stringify(registry, null, 2)}\n`);
finish();
console.log(`Grid capability registry updated: ${displayers.length} displayers, ${filters.length} filters, ${actions.length} actions/tools.`);

function filterBrowserWitness(file) {
    const special = new Map([
        ['AbstractFilter.php', 'derived-control:cap_equal'],
        ['Layout/Column.php', 'structure:.filter-input'],
        ['Layout/Layout.php', 'structure:.grid-filter-form'],
        ['Newline.php', 'structure:.grid-filter-form .col-md-12'],
        ['Presenter/Presenter.php', 'derived-presenter:cap_presenter_select'],
        ['Presenter/Text.php', 'default-presenter:cap_equal'],
        ['Presenter/Checkbox.php', 'control:cap_presenter_checkbox'],
        ['Presenter/DateTime.php', 'control:cap_presenter_datetime'],
        ['Presenter/MultipleSelect.php', 'control:cap_presenter_multiple'],
        ['Presenter/MultipleSelectTable.php', 'control:cap_presenter_multiple_select_table'],
        ['Presenter/Radio.php', 'control:cap_presenter_radio'],
        ['Presenter/Select.php', 'control:cap_presenter_select'],
        ['Presenter/SelectTable.php', 'control:cap_presenter_select_table'],
        ['Scope.php', 'scope:cap_scope'],
    ]);
    if (special.has(file)) return special.get(file);
    const base = file.replace(/\.php$/, '').replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
    return `control:cap_${base}`;
}

function displayerBrowserContract(file) {
    const nativeWitness = new Map([
        ['AbstractDisplayer.php', 'derived-base:text-cell'],
        ['Badge.php', 'payload:badge'],
        ['Button.php', 'payload:button'],
        ['Downloadable.php', 'payload:download'],
        ['Expand.php', 'interaction:expand-toggle'],
        ['Image.php', 'payload:image'],
        ['Label.php', 'payload:label'],
        ['Link.php', 'payload:link'],
        ['ProgressBar.php', 'payload:progress'],
        ['Table.php', 'payload:nested-table'],
    ]);
    const compatWitness = new Map([
        ['Actions.php', 'actions:default'],
        ['Checkbox.php', 'editable:checkbox'],
        ['ContextMenuActions.php', 'actions:contextmenu'],
        ['Copyable.php', 'render:.grid-column-copyable'],
        ['DialogTree.php', 'interaction:dialog-tree'],
        ['DropdownActions.php', 'interaction:dropdown-actions'],
        ['Editable.php', 'derived-base:editable-input'],
        ['Input.php', 'editable:input'],
        ['Limit.php', 'interaction:limit-toggle'],
        ['Modal.php', 'interaction:modal'],
        ['Orderable.php', 'render:orderable-controls'],
        ['QRCode.php', 'interaction:qrcode-popover'],
        ['Radio.php', 'editable:radio'],
        ['Select.php', 'render:.grid-column-select'],
        ['SwitchDisplay.php', 'render:.grid-column-switch'],
        ['SwitchGroup.php', 'render:.grid-column-switch-group'],
        ['Textarea.php', 'editable:textarea'],
        ['Tree.php', 'render:tree-load-children'],
    ]);
    if (nativeDisplayers.has(file)) {
        return {
            fixtureRoute: '/tests/view-baseline/modern-grid-displayers',
            browserTestId: 'grid-read-only',
            browserWitness: nativeWitness.get(file),
        };
    }
    return {
        fixtureRoute: '/tests/view-baseline/modern-grid-compat-displayers',
        browserTestId: 'grid-compat-displayers',
        browserWitness: compatWitness.get(file),
    };
}

function actionBrowserContract(file) {
    const contracts = new Map([
        ['Actions/Delete.php', ['/tests/view-baseline/modern-grid-interactions', 'grid-interactions', 'native-confirm+request-probe']],
        ['Actions/Edit.php', ['/tests/view-baseline/modern-grid-compat-displayers?actions=default', 'grid-compat-displayers', 'actions:edit-link']],
        ['Actions/QuickEdit.php', ['/tests/view-baseline/modern-grid-action-matrix', 'grid-action-matrix', 'interaction:quick-edit-dialog']],
        ['Actions/Show.php', ['/tests/view-baseline/modern-grid-compat-displayers?actions=default', 'grid-compat-displayers', 'actions:show-link']],
        ['BatchAction.php', ['/tests/view-baseline/modern-grid-interactions', 'grid-interactions', 'derived:batch-delete']],
        ['GridAction.php', ['/tests/view-baseline/modern-grid-interactions', 'grid-interactions', 'derived:delete-action']],
        ['RowAction.php', ['/tests/view-baseline/modern-grid-interactions', 'grid-interactions', 'derived:delete-action']],
        ['Tools/AbstractTool.php', ['/tests/view-baseline/modern-grid-interactions', 'grid-interactions', 'derived:filter-button']],
        ['Tools/ActionDivider.php', ['/tests/view-baseline/modern-grid-interactions', 'grid-interactions', 'render:batch-divider']],
        ['Tools/BatchActions.php', ['/tests/view-baseline/modern-grid-interactions', 'grid-interactions', 'interaction:batch-dropdown']],
        ['Tools/BatchDelete.php', ['/tests/view-baseline/modern-grid-interactions', 'grid-interactions', 'interaction:batch-delete-protocol']],
        ['Tools/ColumnSelector.php', ['/tests/view-baseline/modern-grid-interactions', 'grid-interactions', 'interaction:column-selector']],
        ['Tools/CreateButton.php', ['/tests/view-baseline/modern-grid-action-matrix', 'grid-action-matrix', 'interaction:dialog-create']],
        ['Tools/ExportButton.php', ['/tests/view-baseline/modern-grid-action-matrix', 'grid-action-matrix', 'interaction:export-selected']],
        ['Tools/FilterButton.php', ['/tests/view-baseline/modern-grid-interactions', 'grid-interactions', 'interaction:filter-drawer']],
        ['Tools/Paginator.php', ['/tests/view-baseline/modern-grid-displayers?multi=1', 'grid-read-only', 'interaction:pagination']],
        ['Tools/PerPageSelector.php', ['/tests/view-baseline/modern-grid-action-matrix', 'grid-action-matrix', 'interaction:per-page-link']],
        ['Tools/QuickCreate.php', ['/tests/view-baseline/modern-grid-action-matrix', 'grid-action-matrix', 'interaction:quick-create-protocol']],
        ['Tools/QuickSearch.php', ['/tests/view-baseline/modern-grid-interactions', 'grid-interactions', 'interaction:quick-search']],
        ['Tools/RefreshButton.php', ['/tests/view-baseline/modern-grid-interactions', 'grid-interactions', 'interaction:refresh']],
        ['Tools/RowSelector.php', ['/tests/view-baseline/modern-grid-interactions', 'grid-interactions', 'interaction:row-select']],
        ['Tools/Selector.php', ['/tests/view-baseline/modern-grid-action-matrix', 'grid-action-matrix', 'interaction:selector-query']],
    ]);
    const [fixtureRoute, browserTestId, browserWitness] = contracts.get(file) || [];
    return { fixtureRoute, browserTestId, browserWitness };
}

function relativeFiles(dir) {
    const absolute = path.join(root, dir);
    return walk(absolute).filter((file) => file.endsWith('.php')).map((file) => path.relative(absolute, file).replace(/\\/g, '/')).sort();
}

function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const file = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(file) : entry.isFile() ? [file] : [];
    });
}

function validateExact(label, actual, classified, expected) {
    if (actual.length !== expected) fail(`${label} inventory drift: expected ${expected}, got ${actual.length}`);
    const missing = actual.filter((file) => !classified.includes(file));
    const stale = classified.filter((file) => !actual.includes(file));
    if (missing.length) fail(`${label} classification missing: ${missing.join(', ')}`);
    if (stale.length) fail(`${label} classification references missing files: ${stale.join(', ')}`);
}

function count(entries, status) {
    return entries.filter((entry) => entry.status === status).length;
}

function relative(file) {
    return path.relative(root, file).replace(/\\/g, '/');
}

function fail(message) {
    errors.push(message);
}

function finish() {
    if (!errors.length) return;
    console.error('Grid capability registry verification failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
}
