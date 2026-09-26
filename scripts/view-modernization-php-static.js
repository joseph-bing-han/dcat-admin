'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const errors = [];

const phpFiles = walk(path.join(root, 'src/Modern')).filter((file) => file.endsWith('.php'));

const forbiddenAfterPhp80 = [
    { label: 'enum declaration', pattern: /\benum\s+[A-Za-z_]/ },
    { label: 'readonly property/class', pattern: /(?:\breadonly\s+class\b|\b(?:public|protected|private)\s+(?:static\s+)?readonly\b|\breadonly\s+(?:public|protected|private)\b)/ },
    { label: 'never return type', pattern: /:\s*never\b/ },
    { label: 'intersection type', pattern: /(?:[A-Z][A-Za-z0-9_\\]*|array|object|iterable)\s*&\s*(?:[A-Z][A-Za-z0-9_\\]*|array|object|iterable)/ },
    { label: 'PHP 8.1 array_is_list', pattern: /\barray_is_list\s*\(/ },
];

phpFiles.forEach((file) => {
    const source = read(file);
    forbiddenAfterPhp80.forEach(({ label, pattern }) => {
        if (pattern.test(source)) {
            errors.push(`${relative(file)} uses ${label}, which is outside the PHP >=8.0 compatibility floor.`);
        }
    });
    if (/\{\$this->[^}]+\(/.test(source)) {
        errors.push(`${relative(file)} interpolates a method call inside a PHP string.`);
    }
});

const structuralReactBoundaries = [
    ['resources/views/partials/sidebar.blade.php', "capabilityEnabled('layout.menu')", 'data-dcat-react-component="layout.menu"'],
    ['resources/views/layouts/content.blade.php', "capabilityEnabled('layout.header')", 'data-dcat-react-component="layout.header"'],
    ['resources/views/grid/table.blade.php', "capabilityEnabled('grid.read')", 'data-dcat-react-component="grid.read"'],
    ['resources/views/show/container.blade.php', "capabilityEnabled('show.detail')", 'data-dcat-react-component="show.detail"'],
    ['resources/views/tree/container.blade.php', "capabilityEnabled('tree.page')", 'data-dcat-react-component="tree.page"'],
    ['resources/views/widgets/box.blade.php', "capabilityEnabled('widget.surface')", 'data-dcat-react-component="widget.surface"'],
    ['resources/views/widgets/card.blade.php', "capabilityEnabled('widget.surface')", 'data-dcat-react-component="widget.surface"'],
    ['resources/views/widgets/data-card.blade.php', "capabilityEnabled('widget.surface')", 'data-dcat-react-component="widget.surface"'],
    ['resources/views/pages/login.blade.php', "capabilityEnabled('system.page')", 'data-dcat-react-component="system.page"'],
    ['resources/views/partials/modern-alert.blade.php', "capabilityEnabled('system.page')", 'data-dcat-react-component="system.page"'],
    ['resources/views/partials/exception.blade.php', "capabilityEnabled('system.page')", 'data-dcat-react-component="system.page"'],
];

const inPlaceReactBoundaries = [
    ['resources/views/partials/sidebar.blade.php', "modern()->available('layout')", "capabilityEnabled('layout.navigation')", 'data-dcat-react-component="layout.navigation"'],
    ['resources/views/partials/navbar.blade.php', "modern()->available('layout')", "capabilityEnabled('layout.navbar')", 'data-dcat-react-component="layout.navbar"'],
    ['resources/views/layouts/container.blade.php', "modern()->available('layout')", "capabilityEnabled('layout.footer')", 'data-dcat-react-component="layout.footer"'],
    ['resources/views/layouts/full-page.blade.php', "modern()->available('layout')", "capabilityEnabled('layout.full-page')", 'data-dcat-react-component="layout.full-page"'],
];

structuralReactBoundaries.forEach(([file, gate, marker]) => {
    const source = read(path.join(root, file));
    required(source, gate, `${file} must retain its explicit modern capability gate.`);
    required(source, marker, `${file} must retain the controlled React boundary ${marker}.`);
    required(source, 'data-dcat-modern-fallback', `${file} must retain a complete legacy fallback inside its React boundary.`);
});

inPlaceReactBoundaries.forEach((boundary) => {
    const [file, firstGate, secondGateOrMarker, maybeMarker] = boundary;
    const source = read(path.join(root, file));
    const marker = maybeMarker || secondGateOrMarker;
    required(source, firstGate, `${file} must retain its explicit modern capability gate.`);
    if (maybeMarker) required(source, secondGateOrMarker, `${file} must retain its scoped capability allowlist gate.`);
    required(source, marker, `${file} must retain the in-place React lifecycle marker ${marker}.`);
});

const adapters = read(path.join(root, 'resources/modern/adapters.tsx'));
const bridgeSource = read(path.join(root, 'resources/modern/bridge.tsx'));
required(bridgeSource, "capability.id.startsWith('extension.')", 'Public extension registration must remain isolated to the extension.* namespace.');
required(bridgeSource, "capability?.source === 'core'", 'Public extension unregister must not remove core capabilities.');
required(bridgeSource, 'registry.has(capability.id)', 'Capability registration must reject duplicate ids instead of overwriting existing core/extension registrations.');
[
    ['layout.menu', 'LayoutMenuView'],
    ['layout.header', 'LayoutHeaderView'],
    ['grid.read', 'GridView'],
    ['form.basic', 'FormView'],
    ['show.detail', 'ShowView'],
    ['tree.page', 'TreeView'],
    ['widget.surface', 'WidgetView'],
    ['system.page', 'SystemView'],
].forEach(([capability, renderer]) => {
    required(adapters, `id: '${capability}'`, `Core adapter ${capability} must remain registered.`);
    required(adapters, renderer, `Core adapter ${capability} must retain its controlled React renderer ${renderer}.`);
});

['layout.navigation', 'layout.navbar', 'layout.footer', 'layout.full-page'].forEach((capability) => {
    const block = adapterBlock(adapters, capability);
    if (!block) {
        errors.push(`Core in-place adapter ${capability} must remain registered.`);
        return;
    }
    if (!block.includes('mount:')) errors.push(`Core in-place adapter ${capability} must retain a lifecycle mount handler.`);
    if (block.includes('render:')) errors.push(`Core in-place adapter ${capability} must not move its frozen stable anchor through a React structural renderer.`);
});

required(adapters, "selector: '[data-dcat-modern-extension=\"1\"]'", 'Core extension classification must remain isolated from core React component markers.');

const renderingContract = JSON.parse(read(path.join(root, 'codestable/epics/001-o-view-layer-modernization/m4-m10-rendering-contract.json')));
if (renderingContract.status !== 'historical-gen1-rendering-contract') {
    errors.push('M4-M10 rendering contract must be marked as historical after the single-renderer transition.');
}
[
    'layout.navigation', 'layout.menu', 'layout.header', 'layout.navbar', 'layout.footer', 'layout.full-page',
    'grid.read', 'grid.interactions', 'form.basic', 'form.advanced', 'show.detail', 'tree.page',
    'widget.surface', 'system.page', 'extension.island',
].forEach((capability) => {
    if (!renderingContract.capabilities || !renderingContract.capabilities[capability]) {
        errors.push(`M4-M10 rendering contract is missing ${capability}.`);
    }
});

const implementationMatrix = JSON.parse(read(path.join(root, 'codestable/epics/001-o-view-layer-modernization/implementation-capability-matrix.json')));
if (![
    'gen1-bridge-evidence-preserved-contract-v3-revalidation-required',
    'bootstrap-free-implementation-external-runtime-evidence-pending',
    'implementation-complete-external-runtime-evidence-pending',
    'b0-b9-complete-b10-b12-in-progress',
    'b0-b12-automated-gates-passed-awaiting-verified-commit',
    'b0-b12-verified-current-environment',
].includes(implementationMatrix.status)) {
    errors.push('Implementation capability matrix status is outside the recognized migration/revalidation states.');
}

const releaseStatus = JSON.parse(read(path.join(root, 'codestable/epics/001-o-view-layer-modernization/m11-release-status.json')));
if (releaseStatus.defaultModernEnabled !== true || releaseStatus.defaultCandidateAuthorized !== true) {
    errors.push('M11 release state must record explicit maintainer authorization for default-modern.');
}
if (!Array.isArray(releaseStatus.remainingImplementation) || releaseStatus.remainingImplementation.length !== 0) {
    errors.push('M11 release state must not claim remaining code implementation after B0-B12 completion.');
}
const releaseReady = releaseStatus.releaseStatus === 'release-candidate';
if (!['not-release-candidate', 'release-candidate'].includes(releaseStatus.releaseStatus)) {
    errors.push('M11 release status is not recognized.');
}
if (!Array.isArray(releaseStatus.remainingAutomatedGates) || (releaseReady && releaseStatus.remainingAutomatedGates.length)) {
    errors.push('Release candidates must have no remaining automated gates.');
}
const expectedCapabilityStatus = releaseReady ? 'verified' : 'experimental';
implementationMatrix.capabilities.forEach((capability) => {
    if (capability.modernStatus !== expectedCapabilityStatus) {
        errors.push(`${capability.capabilityId} must remain ${expectedCapabilityStatus} for the recorded M11 release state.`);
    }
});
if (releaseReady && implementationMatrix.status !== 'b0-b12-verified-current-environment') {
    errors.push('Release candidates require the current-environment verified capability matrix.');
}

const config = read(path.join(root, 'config/admin.php'));
if (!/'modern'\s*=>\s*\[[\s\S]*?'manifest'\s*=>\s*null/.test(config)) {
    errors.push('admin.modern must remain a manifest-driven configuration block.');
}
for (const removed of ['ADMIN_MODERN_ENABLED', 'bootstrap_free_fallback', 'fallback_query', 'exclude_routes']) {
    if (config.includes(removed)) errors.push(`admin.modern must not expose the removed legacy renderer switch ${removed}.`);
}

const admin = read(path.join(root, 'src/Admin.php'));
required(admin, "return app('admin.modern');", 'Admin::modern() must remain a simple service-container lookup compatible with the existing PHP floor.');

const provider = read(path.join(root, 'src/AdminServiceProvider.php'));
required(provider, "new ModernManifest()", 'AdminServiceProvider must register the modern manifest without higher-version PHP syntax.');
required(provider, "new ModernManager(app('admin.modern.manifest'))", 'AdminServiceProvider must register the modern manager through the existing container API.');

const manager = read(path.join(root, 'src/Modern/Manager.php'));
required(manager, '        return $this->manifest->exists();', 'The modern renderer must be gated only by the published manifest.');
required(manager, "if (! $this->enabled($family) || ! $this->manifest->exists())", 'Native capability emission must still require an existing manifest.');
required(manager, 'public function usesCompatRenderer()', 'The bootstrap-free compat renderer must remain available as the only degradation path.');
required(manager, 'return ! $this->available();', 'Compat selection must be derived from manifest availability only.');
required(manager, '不存在配置或请求参数切换到旧版 UI 的入口', 'Manager must document that no legacy renderer switch remains.');
for (const removed of ['classicAssets', 'fallbackUrl', 'fallbackCleanupHtml', 'legacyFallbackRequested', 'admin.modern.enabled', 'admin.modern.bootstrap_free_fallback', '__dcat_legacy']) {
    if (manager.includes(removed)) errors.push(`Modern manager must not retain the removed legacy renderer hook ${removed}.`);
}
required(manager, "JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT", 'Payload/config JSON must retain safe script embedding flags.');
required(manager, "e($this->assetUrl($css))", 'Modern stylesheet URLs must remain HTML-attribute escaped.');
required(manager, "e($this->assetUrl($assets['js']))", 'Modern runtime script URLs must remain HTML-attribute escaped.');
required(manager, "id=\"dcat-modern-config\"'.$nonce", 'Modern config JSON must carry the configured CSP nonce.');
required(manager, "data-dcat-modern-payload=\"'.e($capability).'\"'.$this->nonceAttribute()", 'Modern payload JSON must carry the configured CSP nonce.');
for (const removed of ['bodyHtml', 'location.assign(href', 'sessionStorage']) {
    if (manager.includes(removed)) errors.push(`Modern manager must not redirect to a legacy renderer; found ${removed}.`);
}
required(manager, "data-dcat-modern-extension=\"1\"", 'Extension islands must remain explicitly classified and must not collide with core component markers.');

const manifest = read(path.join(root, 'src/Modern/Manifest.php'));
required(manifest, "! $this->assetExists($entry['file'], '.js')", 'Manifest resolution must reject a missing or invalid JS artifact before modern is selected.');
required(manifest, "preg_match('#(?:^|/)\\.\\.(?:/|$)#', $file)", 'Manifest asset resolution must reject path traversal.');

const formBuilder = read(path.join(root, 'src/Form/Builder.php'));
required(
    formBuilder,
    "$modern = Admin::modern()->available('form') && Admin::modern()->capabilityEnabled('form.basic');",
    'Form builder must derive its modern marker gate from both Form family availability and the form.basic capability gate.'
);
required(
    formBuilder,
    "if ($modern) {\n            $attributes['data-dcat-modern-family'] = 'form';\n            $attributes['data-dcat-react-component'] = 'form.basic';\n        }",
    'Form family/component markers must remain conditional on the eligible modern request gate.'
);

const bladeFiles = walk(path.join(root, 'resources/views')).filter((file) => file.endsWith('.blade.php'));
bladeFiles.forEach((file) => {
    const source = read(file);
    if (/@php\s*\(/.test(source)) {
        errors.push(`${relative(file)} uses inline @php(...), which is not portable across the supported Laravel Blade compilers; use @php/@endphp blocks.`);
    }
    if (source.includes('data-dcat-modern-family=') && !source.includes('modern()->available(')) {
        errors.push(`${relative(file)} emits a modern family marker without an availability gate in the same Blade template.`);
    }
});

const alerts = read(path.join(root, 'resources/views/partials/alerts.blade.php'));
required(alerts, "method_exists($flash, 'get')", 'System feedback must continue accepting legacy MessageBag-like flash payloads.');
required(alerts, 'is_scalar($flash)', 'System feedback must continue accepting scalar flash payloads produced by real Laravel login flows.');

const installDep = read(path.join(root, 'tests/bin/install-dep.sh'));
required(installDep, 'set -euo pipefail', 'Consumer dependency installation must fail fast on command errors.');
required(installDep, 'LOCAL_PACKAGE_NAME=', 'Consumer dependency installation must resolve the current fork package name dynamically.');
required(installDep, '--with-all-dependencies --no-interaction', 'Consumer dependency installation must allow compatible transitive dependency resolution.');
required(installDep, 'Composer\\InstalledVersions::getInstallPath', 'Consumer dependency installation must verify that the current local worktree package was installed.');

['tests/bin/install-admin.sh', 'tests/bin/start.sh'].forEach((file) => {
    required(read(path.join(root, file)), 'set -euo pipefail', `${file} must fail fast instead of masking PHP/runtime failures.`);
});
required(
    read(path.join(root, 'tests/bin/install-admin.sh')),
    'if [ "${DCAT_INSTALL_DUSK:-1}" = "1" ]; then',
    'Modern consumer installation must retain its installed database while the legacy Dusk path may still roll back.'
);

['resources/views/layouts/content.blade.php', 'resources/views/layouts/full-content.blade.php'].forEach((file) => {
    const source = read(path.join(root, file));
    required(source, '<div class="content-body" id="app">', `${file} must preserve the frozen #app opening tag.`);
    if (!/@if\(Dcat\\Admin\\Admin::modern\(\)->available\(\)\)[\s\S]{0,160}data-dcat-modern-request="1"/.test(source)) {
        errors.push(`${file} must emit the request marker only inside an explicit modern availability gate.`);
    }
});

const artifactSource = read(path.join(root, 'scripts/view-modernization-artifact.js'));
required(artifactSource, "source.includes(':has(')", 'Artifact verifier must retain the Firefox 114 :has() source gate.');
required(artifactSource, 'dcat-modern-(?:active|root)', 'Artifact verifier must retain runtime and server root-scoped CSS enforcement.');

if (errors.length) {
    console.error('Modern PHP/Blade static verification failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
}

console.log(`Modern PHP/Blade static verification OK: ${phpFiles.length} new Modern PHP files checked against the PHP 8.0 floor and ${bladeFiles.length} Blade templates checked for gated modern markers.`);

function required(source, literal, message) {
    if (!source.includes(literal)) errors.push(message);
}

function adapterBlock(source, capability) {
    const marker = `id: '${capability}'`;
    const start = source.indexOf(marker);
    if (start < 0) return '';
    const end = source.indexOf('\n    },', start);
    return end < 0 ? source.slice(start) : source.slice(start, end + 7);
}

function read(file) {
    return fs.readFileSync(file, 'utf8');
}

function relative(file) {
    return path.relative(root, file).split(path.sep).join('/');
}

function walk(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const file = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(file) : [file];
    });
}
