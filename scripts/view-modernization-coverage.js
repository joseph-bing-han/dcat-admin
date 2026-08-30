'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const epicDir = path.join(root, 'codestable/epics/001-o-view-layer-modernization');
const registryPath = path.join(epicDir, 'coverage-registry.json');
const censusPath = path.join(epicDir, 'dependency-census.json');
const checkOnly = process.argv.includes('--check');
const errors = [];

const inventories = [
    { type: 'blade', root: 'resources/views', pattern: /\.blade\.php$/, expected: 140 },
    { type: 'form-field', root: 'src/Form/Field', pattern: /\.php$/, expected: 68 },
    { type: 'grid-displayer', root: 'src/Grid/Displayers', pattern: /\.php$/, expected: 28 },
    { type: 'grid-filter', root: 'src/Grid/Filter', pattern: /\.php$/, expected: 36 },
    { type: 'widget', root: 'src/Widgets', pattern: /\.php$/, expected: 31 },
];

const inventoryEntries = inventories.flatMap((inventory) => {
    const absoluteRoot = path.join(root, inventory.root);
    const files = walk(absoluteRoot)
        .filter((file) => inventory.pattern.test(file))
        .sort();
    if (files.length !== inventory.expected) {
        fail(`${inventory.type} inventory drift: expected ${inventory.expected}, got ${files.length}`);
    }
    return files.map((file) => coverageEntry(inventory.type, relative(file)));
});

const dependencyRoots = ['resources/assets', 'resources/views', 'src', 'resources/dist'];
const dependencyFiles = dependencyRoots.flatMap((dir) => walk(path.join(root, dir)))
    .filter((file) => /\.(?:php|blade\.php|js|jsx|ts|tsx|css|scss|sass|less|json)$/.test(file))
    .sort();

const dependencyEntries = dependencyFiles
    .map((file) => dependencyEntry(relative(file), fs.readFileSync(file, 'utf8')))
    .filter((entry) => entry.signals.length > 0);

const registry = {
    schemaVersion: 1,
    contractVersion: '4.0.0',
    generatedAt: '2026-09-04',
    generator: 'scripts/view-modernization-coverage.js',
    inventory: Object.fromEntries(inventories.map((inventory) => [inventory.type, inventory.expected])),
    visibleCount: inventoryEntries.filter((entry) => entry.visible).length,
    fixtureRule: 'Every visible entry must map to a real browser fixture route and stable browser test id before promotion.',
    entries: inventoryEntries,
};

const census = {
    schemaVersion: 1,
    contractVersion: '4.0.0',
    generatedAt: '2026-09-04',
    generator: 'scripts/view-modernization-coverage.js',
    roots: dependencyRoots,
    totals: {
        scannedFiles: dependencyFiles.length,
        filesWithSignals: dependencyEntries.length,
        bootstrapClassFiles: dependencyEntries.filter((entry) => entry.signals.includes('bootstrap-class')).length,
        bootstrapPluginFiles: dependencyEntries.filter((entry) => entry.signals.includes('bootstrap-plugin')).length,
        adminlteFiles: dependencyEntries.filter((entry) => entry.signals.includes('adminlte')).length,
        jqueryFiles: dependencyEntries.filter((entry) => entry.signals.includes('jquery')).length,
    },
    ownership: {
        dcatCore: dependencyEntries.filter((entry) => entry.owner === 'dcat-core').length,
        bundledThirdParty: dependencyEntries.filter((entry) => entry.owner === 'bundled-third-party').length,
        publishedOutput: dependencyEntries.filter((entry) => entry.owner === 'published-output').length,
    },
    entries: dependencyEntries,
};

validate(registry, census);

if (checkOnly) {
    compare(registryPath, registry, 'coverage registry');
    compare(censusPath, census, 'dependency census');
    if (errors.length) finish();
    console.log(`View modernization coverage OK: ${registry.entries.length} inventory entries, ${registry.visibleCount} visible mappings, ${census.totals.filesWithSignals} dependency-signal files.`);
    process.exit(0);
}

writeJson(registryPath, registry);
writeJson(censusPath, census);
finish();
console.log(`View modernization coverage updated: ${registry.entries.length} inventory entries and ${census.totals.filesWithSignals} dependency-signal files.`);

function coverageEntry(type, file) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const family = familyFor(type, file);
    const fixture = fixtureFor(type, file, family);
    const signals = dependencySignals(source);
    const visible = visibleFor(type, file, source);
    return {
        id: `${type}:${file}`,
        type,
        path: file,
        family,
        serverEntry: serverEntryFor(type, file),
        visible,
        legacyDependencies: signals,
        stableSelectors: stableSelectors(source),
        resourceAliases: resourceAliases(source),
        nativeStatus: nativeStatusFor(type, file, signals),
        compatStatus: signals.length ? 'required-until-native-or-facade-verified' : 'candidate',
        fixtureRoute: visible ? fixture.route : null,
        browserTestId: visible ? fixture.testId : null,
    };
}

function familyFor(type, file) {
    if (type === 'form-field') return 'Form';
    if (type === 'grid-displayer' || type === 'grid-filter') return 'Grid';
    if (type === 'widget') return 'Widget';
    const rel = file.replace(/^resources\/views\//, '');
    if (/^(grid|filter)\//.test(rel)) return 'Grid';
    if (/^form\//.test(rel)) return 'Form';
    if (/^show\//.test(rel)) return 'Show';
    if (/^tree\//.test(rel)) return 'Tree';
    if (/^(widgets|dashboard)\//.test(rel)) return 'Widget';
    if (/^(pages|partials\/exception|partials\/alerts)/.test(rel)) return 'System';
    if (/^(layouts|partials)\//.test(rel)) return 'Layout';
    if (/^extensions\//.test(rel)) return 'Extension';
    return 'Extension';
}

function fixtureFor(type, file, family) {
    if (type === 'form-field') return { route: '/admin/form', testId: 'form-field-registry' };
    const specialized = [
        [/Markdown\.php$|form\/markdown/i, '/admin/form/markdown', 'form-markdown'],
        [/Editor\.php$|tinymce/i, '/admin/form/tinymce', 'form-editor'],
        [/HasMany|hasmany/i, '/admin/form/has-many', 'form-has-many'],
        [/Tree\.php$|tree\//i, '/admin/components/tree', 'tree-page'],
        [/login\.blade\.php$/i, '/admin/auth/login', 'auth-login'],
        [/extension/i, '/admin/extensions', 'extension-surface'],
    ];
    for (const [pattern, route, testId] of specialized) {
        if (pattern.test(file)) return { route, testId };
    }
    const byFamily = {
        Layout: { route: '/admin', testId: 'layout-shell' },
        Grid: { route: '/admin/auth/users', testId: type === 'grid-filter' ? 'grid-filters' : 'grid-core' },
        Form: { route: '/admin/form', testId: type === 'form-field' ? 'form-field-registry' : 'form-core' },
        Show: { route: '/admin/auth/users/1', testId: 'show-detail' },
        Tree: { route: '/admin/components/tree', testId: 'tree-page' },
        Widget: { route: '/admin', testId: 'widget-dashboard' },
        System: { route: '/admin', testId: 'system-pages' },
        Extension: { route: '/admin/extensions', testId: 'extension-surface' },
    };
    return byFamily[family] || byFamily.Extension;
}

function visibleFor(type, file, source) {
    if (type !== 'blade') return !/(?:Abstract|Can[A-Z]|Has[A-Z]|Nullable|Sizeable|UploadField|PlainInput|Fieldset|Head)\.php$/.test(file);
    const rel = file.replace(/^resources\/views\//, '');
    if (/^(components\/|partials\/scripts|partials\/styles)/.test(rel)) return false;
    return /<(?:div|span|table|form|input|button|a|section|nav|header|footer|main|ol|ul|p|h[1-6])\b|\{!!|\{\{/.test(source);
}

function nativeStatusFor(type, file, signals) {
    if (type === 'blade' && /resources\/views\/layouts\/content\.blade\.php$/.test(file)) return 'payload-first';
    if (type === 'blade' && /resources\/views\/partials\/sidebar\.blade\.php$/.test(file)) return 'payload-first-partial';
    if (signals.length === 0) return 'native-candidate';
    return 'experimental';
}

function serverEntryFor(type, file) {
    if (type === 'blade') return file;
    const className = file.replace(/^src\//, 'Dcat/Admin/').replace(/\.php$/, '').replace(/\//g, '\\');
    return className;
}

function dependencyEntry(file, source) {
    return {
        path: file,
        owner: file.startsWith('resources/dist/') ? 'published-output'
            : file.startsWith('resources/assets/dcat/plugins/') ? 'bundled-third-party'
                : 'dcat-core',
        signals: dependencySignals(source),
    };
}

function dependencySignals(source) {
    const signals = [];
    if (/\b(?:row|col-(?:xs|sm|md|lg|xl)-\d+|btn(?:-[a-z-]+)?|card|form-control|input-group|alert|table-responsive|dropdown-menu|modal|popover|tooltip)\b/.test(source)) signals.push('bootstrap-class');
    if (/\.\s*(?:modal|dropdown|tab|collapse|popover|tooltip|button)\s*\(|bootstrap-(?:validator|datetimepicker|duallistbox|colorpicker|number-input)/i.test(source)) signals.push('bootstrap-plugin');
    if (/adminlte|main-sidebar|control-sidebar|pushmenu|treeview/i.test(source)) signals.push('adminlte');
    if (/\bjQuery\b|\$\s*\(|jquery(?:[-_.]|\b)|jquery\//i.test(source)) signals.push('jquery');
    return signals;
}

function stableSelectors(source) {
    const selectors = new Set();
    let match;
    const classPattern = /class=["'][^"']*\b(main-sidebar|header-navbar|content-wrapper|content-body|main-footer|grid-filter-form|quick-search-form)\b[^"']*["']/g;
    while ((match = classPattern.exec(source)) !== null) selectors.add(`.${match[1]}`);
    const idPattern = /id=["'](app|grid-table)["']/g;
    while ((match = idPattern.exec(source)) !== null) selectors.add(`#${match[1]}`);
    if (/pjax-container/.test(source)) selectors.add('[pjax-container]');
    return Array.from(selectors).sort();
}

function resourceAliases(source) {
    return Array.from(new Set(Array.from(source.matchAll(/@[a-z0-9_.-]+/gi), (match) => match[0]))).sort();
}

function validate(registryValue, censusValue) {
    const ids = new Set();
    registryValue.entries.forEach((entry) => {
        if (ids.has(entry.id)) fail(`duplicate coverage id ${entry.id}`);
        ids.add(entry.id);
        if (!fs.existsSync(path.join(root, entry.path))) fail(`coverage path is missing: ${entry.path}`);
        if (entry.visible && (!entry.fixtureRoute || !entry.browserTestId)) fail(`visible coverage entry has no browser fixture: ${entry.id}`);
    });
    const expectedTotal = inventories.reduce((total, inventory) => total + inventory.expected, 0);
    if (registryValue.entries.length !== expectedTotal) fail(`coverage entry total drift: expected ${expectedTotal}, got ${registryValue.entries.length}`);
    censusValue.entries.forEach((entry) => {
        if (!entry.signals.length) fail(`dependency census entry has no signal: ${entry.path}`);
    });
}

function compare(file, value, label) {
    if (!fs.existsSync(file)) {
        fail(`${label} is missing: ${relative(file)}`);
        return;
    }
    const existing = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (stable(existing) !== stable(value)) fail(`${label} is stale; run node scripts/view-modernization-coverage.js`);
}

function stable(value) {
    return JSON.stringify(value);
}

function writeJson(file, value) {
    fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function sha(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function walk(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const file = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(file) : entry.isFile() ? [file] : [];
    });
}

function relative(file) {
    return path.relative(root, file).replace(/\\/g, '/');
}

function fail(message) {
    errors.push(message);
}

function finish() {
    if (errors.length) {
        console.error('View modernization coverage verification failed:');
        errors.forEach((error) => console.error(`- ${error}`));
        process.exit(1);
    }
}
