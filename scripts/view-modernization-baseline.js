'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');
const m0Dir = path.join(root, 'codestable/epics/001-x-view-layer-modernization/m0');
const baseline = readJson(path.join(m0Dir, 'baseline.json'));
const matrix = readJson(path.join(m0Dir, 'capability-matrix.json'));
const implementationMatrix = readJson(path.join(root, 'codestable/epics/001-x-view-layer-modernization/implementation-capability-matrix.json'));
const supportMatrix = readJson(path.join(m0Dir, 'support-matrix.json'));
const sourcePolicy = readJson(path.join(m0Dir, 'frontend-source-policy.json'));
const performance = readJson(path.join(m0Dir, 'performance-budget.json'));
const legacyContracts = readJson(path.join(m0Dir, 'legacy-contracts.json'));
const coverageRegistry = readJson(path.join(root, 'codestable/epics/001-x-view-layer-modernization/coverage-registry.json'));
const dependencyCensus = readJson(path.join(root, 'codestable/epics/001-x-view-layer-modernization/dependency-census.json'));
const composer = readJson(path.join(root, 'composer.json'));
const packageJson = readJson(path.join(root, 'package.json'));
const errors = [];

verifyInventory();
verifyContracts();
verifyCapabilityMatrix();
verifyImplementationMatrix();
verifySupportMatrix();
verifyFrontendSourcePolicy();
verifyPerformanceBudget();
verifyLegacyContracts();
verifyBrowserHarnessPolicy();
verifyCoverageRegistry();

if (errors.length) {
    console.error('View modernization M0 baseline verification failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
}

function verifyImplementationMatrix() {
    if (implementationMatrix.impactGraphUsable) {
        equal('Implementation revalidation flag after graph promotion', implementationMatrix.revalidationRequired, false);
    } else {
        equal('Implementation revalidation flag while graph is frozen', implementationMatrix.revalidationRequired, true);
    }
    const contractMap = {
        manifest: { version: '1.0.0', path: 'codestable/epics/001-x-view-layer-modernization/contracts/manifest-v1.json' },
        payload: { version: '1.1.0', path: 'codestable/epics/001-x-view-layer-modernization/contracts/payload-v1.1.json' },
        bridge: { version: '1.0.0', path: 'codestable/epics/001-x-view-layer-modernization/contracts/bridge-v1.json' },
    };

    Object.keys(contractMap).forEach((key) => {
        const contract = implementationMatrix.contracts[key];
        const expected = contractMap[key];
        if (!contract || contract.version !== expected.version) {
            errors.push(`Implementation ${key} contract must be ${expected.version}`);
            return;
        }
        equal(`Implementation ${key} contract path`, contract.path, expected.path);
        equal(`Implementation ${key} contract SHA-256`, sha256(path.join(root, contract.path)), contract.sha256);
    });

    const baselineIds = new Set(matrix.capabilities.map((capability) => capability.capabilityId));
    const implementationIds = new Set();
    const modernIds = new Set();
    implementationMatrix.capabilities.forEach((capability) => {
        if (!baselineIds.has(capability.capabilityId)) {
            errors.push(`Implementation matrix contains unknown baseline capability ${capability.capabilityId}`);
        }
        if (implementationIds.has(capability.capabilityId)) {
            errors.push(`Implementation matrix duplicates ${capability.capabilityId}`);
        }
        implementationIds.add(capability.capabilityId);
        if (!['experimental', 'verified', 'default-candidate'].includes(capability.modernStatus)) {
            errors.push(`${capability.capabilityId} has unsupported implementation status ${capability.modernStatus}`);
        }
        capability.modernCapabilityIds.forEach((id) => {
            modernIds.add(id);
        });
    });
    baselineIds.forEach((id) => {
        if (!implementationIds.has(id)) errors.push(`Implementation matrix is missing baseline capability ${id}`);
    });

    const adapters = fs.readFileSync(path.join(root, 'resources/modern/adapters.tsx'), 'utf8');
    modernIds.forEach((id) => {
        if (!adapters.includes(`id: '${id}'`)) {
            errors.push(`Implementation matrix modern capability is not registered by core adapters: ${id}`);
        }
    });
}

function verifyCoverageRegistry() {
    equal('B0 coverage contract version', coverageRegistry.contractVersion, '4.0.0');
    equal('B0 Blade inventory', coverageRegistry.inventory.blade, baseline.views.total);
    equal('B0 Form field inventory', coverageRegistry.inventory['form-field'], 68);
    equal('B0 Grid displayer inventory', coverageRegistry.inventory['grid-displayer'], 28);
    equal('B0 Grid filter inventory', coverageRegistry.inventory['grid-filter'], 36);
    equal('B0 Widget inventory', coverageRegistry.inventory.widget, 31);
    equal('B0 coverage total', coverageRegistry.entries.length, 303);

    coverageRegistry.entries.forEach((entry) => {
        if (!entry.path || !entry.serverEntry || !entry.family || !entry.nativeStatus || !entry.compatStatus) {
            errors.push(`B0 coverage entry is incomplete: ${entry.id || '<unknown>'}`);
        }
        if (entry.visible && (!entry.fixtureRoute || !entry.browserTestId)) {
            errors.push(`B0 visible coverage entry lacks browser evidence mapping: ${entry.id}`);
        }
    });

    equal('B0 dependency census contract version', dependencyCensus.contractVersion, '4.0.0');
    if (!dependencyCensus.entries.length || dependencyCensus.totals.scannedFiles < coverageRegistry.entries.length) {
        errors.push('B0 dependency census is empty or incomplete');
    }
}

function verifySupportMatrix() {
    equal('Recorded project PHP constraint', supportMatrix.phpLaravel.projectPhpConstraint, composer.require.php);
    equal('Recorded project Laravel constraint', supportMatrix.phpLaravel.projectLaravelConstraint, composer.require['laravel/framework']);

    const expectedLaravelSeries = ['8', '9', '10'];
    const actualLaravelSeries = supportMatrix.phpLaravel.matrix.map((entry) => entry.laravelSeries);
    equal('Laravel support series', actualLaravelSeries.join(','), expectedLaravelSeries.join(','));

    equal('PHP/Laravel verification scope', supportMatrix.phpLaravel.verificationScope, 'current-environment-only');
    const current = supportMatrix.phpLaravel.currentEnvironment;
    const supported = supportMatrix.phpLaravel.matrix.find((entry) => entry.laravelSeries === current?.laravelSeries);
    if (!supported || !supported.ciPhpVersions.includes(current.php)) {
        errors.push('The current PHP/Laravel environment must belong to the declared support range');
    }
    if (!current?.phpVersion?.startsWith(`${current.php}.`) || !current?.frameworkVersion?.startsWith(`${current.laravelSeries}.`)) {
        errors.push('The current PHP/Laravel environment must record its actual patch versions');
    }

    const requiredGates = new Set(['composer-install', 'resource-resolution', 'modern-native-compat-smoke', 'shared-contract-tests']);
    requiredGates.forEach((gate) => {
        if (!supportMatrix.phpLaravel.requiredCurrentEnvironment?.includes(gate)) {
            errors.push(`The current PHP/Laravel environment is missing required gate ${gate}`);
        }
    });

    supportMatrix.phpLaravel.matrix.forEach((entry) => {
        if (!entry.frameworkPhpConstraint || !entry.effectiveProjectMinimum) {
            errors.push(`Laravel ${entry.laravelSeries} is missing a PHP constraint or effective minimum`);
        }
        if (!Array.isArray(entry.ciPhpVersions) || entry.ciPhpVersions.length === 0) {
            errors.push(`Laravel ${entry.laravelSeries} must have at least one CI PHP target`);
        }
        if (!entry.evidence || !entry.evidence.startsWith('https://')) {
            errors.push(`Laravel ${entry.laravelSeries} must have HTTPS evidence`);
        }
    });

    equal('Modern Chrome minimum', supportMatrix.browser.modern.minimums.chrome, 111);
    equal('Modern Edge minimum', supportMatrix.browser.modern.minimums.edge, 111);
    equal('Modern Firefox minimum', supportMatrix.browser.modern.minimums.firefox, 114);
    equal('Modern Safari minimum', supportMatrix.browser.modern.minimums.safari, 16.4);
    equal('Modern build target must be explicit', supportMatrix.browser.modern.buildTargetMustBeExplicit, true);
    equal('Unsupported modern browser behavior', supportMatrix.browser.modern.unsupportedBrowserBehavior, 'modern-compat');
    equal('Browser matrix driver', supportMatrix.browser.matrixHarness.driver, 'playwright-core-system-chrome');
    equal('Browser matrix must be independent from historical Dusk ChromeDriver', supportMatrix.browser.matrixHarness.independentFromHistoricalDuskChromedriver, true);
    equal('Legacy Dusk reference version', supportMatrix.browser.legacyDuskReference.duskVersion, '6.25.2');
    equal('Production consumer Node requirement', supportMatrix.productionConsumer.nodeRequired, false);
}

function verifyBrowserHarnessPolicy() {
    equal('playwright-core development dependency present', Boolean(packageJson.devDependencies['playwright-core']), true);
    equal('axe-core development dependency present', Boolean(packageJson.devDependencies['axe-core']), true);
    equal('Browser contract script', packageJson.scripts['modern:browser'], 'node scripts/view-modernization-browser.mjs');
    equal('Browser harness self-test script', packageJson.scripts['modern:browser:self-test'], 'node scripts/view-modernization-browser.mjs --self-test');
    if (!packageJson.scripts['modern:verify'].includes('modern:browser:self-test')) {
        errors.push('modern:verify must retain the system-Chrome browser harness self-test');
    }

    const installDep = fs.readFileSync(path.join(root, 'tests/bin/install-dep.sh'), 'utf8');
    if (installDep.includes('laravel/dusk:*')) {
        errors.push('Historical Dusk installation must not use a floating wildcard');
    }
    if (!installDep.includes('DCAT_DUSK_CONSTRAINT')) {
        errors.push('Legacy Dusk installation must require an explicit pinned constraint');
    }

}

function verifyFrontendSourcePolicy() {
    equal('Untitled UI required source license', sourcePolicy.source.requiredLicense, 'MIT');
    equal('Untitled UI PRO source permission', sourcePolicy.source.proSourceAllowed, false);
    equal('Untitled UI commercial raw source permission', sourcePolicy.source.commercialRawSourceAllowed, false);
    equal('Untitled UI official repository', sourcePolicy.source.repository, 'https://github.com/untitleduico/react');
    equal('Untitled UI pinned revision', sourcePolicy.source.revision, 'c981a73bcd6b6c68d2a54070f20f020191212828');
    equal('Untitled UI adaptation strategy', sourcePolicy.adaptation.strategy, 'react-aria-state-model-with-dcat-scoped-css');
    equal('Untitled UI Tailwind imported', sourcePolicy.adaptation.tailwindImported, false);
    equal('React Aria Components pinned version', sourcePolicy.adaptation.reactAria.version, '1.20.0');
    equal('React Aria Components package version', require(path.join(root, 'node_modules/react-aria-components/package.json')).version, '1.20.0');
    if (!fs.existsSync(path.join(root, sourcePolicy.source.licenseFile))) {
        errors.push('Pinned Untitled UI MIT license file is missing');
    }
    if (!fs.existsSync(path.join(root, sourcePolicy.source.provenanceFile))) {
        errors.push('Pinned Untitled UI provenance file is missing');
    }

    if (!Array.isArray(sourcePolicy.evidence) || sourcePolicy.evidence.length < 3) {
        errors.push('Untitled UI source policy requires at least three official evidence links');
    } else {
        sourcePolicy.evidence.forEach((evidence) => {
            const officialSite = evidence.url.startsWith('https://www.untitledui.com/');
            const officialRepository = evidence.url.startsWith('https://github.com/untitleduico/react/');
            if (!officialSite && !officialRepository) {
                errors.push(`Untitled UI source evidence must use the official site or official repository: ${evidence.url}`);
            }
        });
    }
}

function verifyPerformanceBudget() {
    const base = performance.measurement.legacyBaseAssets;
    const distRoot = path.join(root, 'resources/dist');
    const facades = readJson(path.join(root, 'resources/modern/legacy-assets.json'));
    const facadePaths = new Set([...facades.javascript, ...facades.stylesheets]);
    let rawTotal = 0;
    let gzipTotal = 0;
    let cssRaw = 0;
    let cssGzip = 0;
    let jsRaw = 0;
    let jsGzip = 0;

    base.files.forEach((asset) => {
        const file = path.join(distRoot, asset.path);
        if (!fs.existsSync(file)) {
            errors.push(`Measured legacy base asset is missing: ${asset.path}`);
            return;
        }

        const bytes = fs.readFileSync(file);
        let rawBytes = bytes.length;
        let gzipBytes = zlib.gzipSync(bytes, { level: 9 }).length;
        if (facadePaths.has(asset.path)) {
            // 这些 URL 已改为每次构建生成的 facade；预算仍使用冻结参考值，不能随新产物抬高。
            if (!bytes.toString('utf8').startsWith('/*! Dcat-owned legacy asset facade.')) {
                errors.push(`Generated facade marker is missing: ${asset.path}`);
            }
            rawBytes = asset.rawBytes;
            gzipBytes = asset.gzipBytes;
        } else {
            equal(`${asset.path} raw bytes`, rawBytes, asset.rawBytes);
            equal(`${asset.path} gzip bytes`, gzipBytes, asset.gzipBytes);
        }

        rawTotal += rawBytes;
        gzipTotal += gzipBytes;
        if (asset.type === 'css') {
            cssRaw += rawBytes;
            cssGzip += gzipBytes;
        } else if (asset.type === 'js') {
            jsRaw += rawBytes;
            jsGzip += gzipBytes;
        } else {
            errors.push(`Measured legacy base asset has unsupported type ${asset.type}: ${asset.path}`);
        }
    });

    equal('Legacy base raw total', rawTotal, base.rawBytes);
    equal('Legacy base gzip total', gzipTotal, base.gzipBytes);
    equal('Legacy base CSS raw total', cssRaw, base.cssRawBytes);
    equal('Legacy base CSS gzip total', cssGzip, base.cssGzipBytes);
    equal('Legacy base JS raw total', jsRaw, base.jsRawBytes);
    equal('Legacy base JS gzip total', jsGzip, base.jsGzipBytes);

    const legacyDisabled = performance.modernBudgets.legacyPageWhenModernDisabled;
    equal('Modern-disabled legacy added requests', legacyDisabled.addedNetworkRequests, 0);
    equal('Modern-disabled legacy added transfer', legacyDisabled.addedTransferGzipBytes, 0);

    const modern = performance.modernBudgets.firstModernPage;
    if (modern.initialTotalGzipBytesMax > base.gzipBytes * modern.relativeToLegacyBaseGzipMax) {
        errors.push('Modern initial total gzip budget exceeds its declared legacy-base ratio');
    }
    if (modern.initialJsGzipBytesMax + modern.initialCssGzipBytesMax > modern.initialTotalGzipBytesMax) {
        errors.push('Modern JS and CSS budgets exceed the modern total initial-transfer budget');
    }
    if (modern.initialJsGzipBytesMax >= base.jsGzipBytes) {
        errors.push('Modern initial JS budget must remain below the measured legacy base JS gzip size');
    }
    if (modern.initialCssGzipBytesMax >= base.cssGzipBytes) {
        errors.push('Modern initial CSS budget must remain below the measured legacy base CSS gzip size');
    }
}

function verifyLegacyContracts() {
    const expectedViewports = ['390x844', '768x1024', '1024x768', '1366x768', '1440x900'];
    const actualViewports = legacyContracts.viewports.map((viewport) => `${viewport.width}x${viewport.height}`);
    equal('Frozen M0 viewport set', actualViewports.join(','), expectedViewports.join(','));

    const expectedProfiles = ['vertical', 'horizontal', 'full-page', 'pjax-disabled', 'custom-pjax'];
    const actualProfiles = legacyContracts.domProfiles.map((profile) => profile.id);
    equal('Frozen M0 DOM profiles', actualProfiles.join(','), expectedProfiles.join(','));

    const allowedSelectorClasses = new Set(['stable', 'bridge-only', 'legacy-internal']);
    const seenSelectors = new Set();
    legacyContracts.selectorInventory.forEach((entry) => {
        if (seenSelectors.has(entry.selector)) {
            errors.push(`Duplicate selector contract ${entry.selector}`);
        }
        seenSelectors.add(entry.selector);

        if (!allowedSelectorClasses.has(entry.classification)) {
            errors.push(`Unknown selector classification ${entry.classification} for ${entry.selector}`);
        }
        if (!Array.isArray(entry.evidence) || entry.evidence.length === 0) {
            errors.push(`Selector ${entry.selector} must contain evidence`);
        }
        entry.evidence.forEach((file) => {
            if (!fs.existsSync(path.join(root, file))) {
                errors.push(`Selector evidence is missing for ${entry.selector}: ${file}`);
            }
        });
    });

    const requiredStableSelectors = [
        '.main-menu-content',
        '.main-sidebar',
        '.main-horizontal-sidebar',
        '.header-navbar',
        '.app-content.content',
        '.content-wrapper',
        '.content-body#app',
        '.main-footer',
        '.extra-html',
        '[pjax-container]',
        '.grid-filter-form',
        '.quick-search-form',
        'form[data-toggle="validator"]',
    ];
    requiredStableSelectors.forEach((selector) => {
        const entry = legacyContracts.selectorInventory.find((item) => item.selector === selector);
        if (!entry || entry.classification !== 'stable') {
            errors.push(`Required stable selector is missing or misclassified: ${selector}`);
        }
    });

    const expectedGridQueryTokens = ['page', 'per_page', '_sort', '_search_', '_export_', '_scope_', '_parent_id_', '_depth_'];
    const actualGridQueryTokens = legacyContracts.httpContracts.gridQueryTokens.map((entry) => entry.name);
    equal('Frozen Grid query tokens', actualGridQueryTokens.join(','), expectedGridQueryTokens.join(','));
    equal('PJAX primary header', legacyContracts.httpContracts.pjaxHeaders[0].name, 'X-PJAX');
    equal('PJAX primary header value', legacyContracts.httpContracts.pjaxHeaders[0].value, 'true');
    equal('PJAX container header', legacyContracts.httpContracts.pjaxHeaders[1].name, 'X-PJAX-Container');
    equal('Form edit method spoofing key', legacyContracts.httpContracts.formProtocol.methodSpoofingKey, '_method');
    equal('Form edit method', legacyContracts.httpContracts.formProtocol.editMethod, 'PUT');
    equal('Form multipart contract', legacyContracts.httpContracts.formProtocol.multipartWhenFileFieldsExist, true);
    equal('Form PJAX configured-container contract', legacyContracts.httpContracts.formProtocol.pjaxContainerAttributeUsesConfiguredId, true);

    legacyContracts.sourceChecks.forEach((check) => {
        const file = path.join(root, check.path);
        if (!fs.existsSync(file)) {
            errors.push(`Legacy contract source file is missing: ${check.path}`);
            return;
        }

        const contents = fs.readFileSync(file, 'utf8');
        check.literals.forEach((literal) => {
            if (!contents.includes(literal)) {
                errors.push(`Legacy contract literal drifted in ${check.path}: ${literal}`);
            }
        });
    });

    const runtime = legacyContracts.runtimeCapture;
    equal('M0 runtime capture status', runtime.status, 'pending-execution');
    [runtime.testPath, runtime.controllerPath, runtime.routePath].forEach((file) => {
        if (!fs.existsSync(path.join(root, file))) {
            errors.push(`M0 runtime capture harness file is missing: ${file}`);
        }
    });
    if (!Array.isArray(runtime.requiredEvidence) || runtime.requiredEvidence.length < 7) {
        errors.push('M0 runtime capture must declare the full evidence set before closure');
    }
}

console.log(`View modernization M0 baseline OK: ${baseline.views.total} Blade templates, ${baseline.assets.totalFiles} asset files, ${matrix.capabilities.length} capabilities, ${supportMatrix.phpLaravel.matrix.length} Laravel series, ${performance.measurement.legacyBaseAssets.gzipBytes} legacy base gzip bytes, ${legacyContracts.selectorInventory.length} selector contracts, runtime ${legacyContracts.runtimeCapture.status}.`);

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function walkFiles(dir) {
    const files = [];

    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkFiles(entryPath));
        } else if (entry.isFile()) {
            files.push(entryPath);
        }
    });

    return files;
}

function sha256(file) {
    return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function verifyInventory() {
    const viewsRoot = path.join(root, baseline.views.root);
    const viewFiles = walkFiles(viewsRoot).filter((file) => file.endsWith('.blade.php'));
    const actualFamilies = {};

    viewFiles.forEach((file) => {
        const relative = path.relative(viewsRoot, file);
        const family = relative.split(path.sep)[0];
        actualFamilies[family] = (actualFamilies[family] || 0) + 1;
    });

    equal('Blade template total', viewFiles.length, baseline.views.total);

    const expectedFamilies = baseline.views.families;
    const familyNames = Array.from(new Set(Object.keys(expectedFamilies).concat(Object.keys(actualFamilies)))).sort();
    familyNames.forEach((family) => {
        equal(`Blade family ${family}`, actualFamilies[family] || 0, expectedFamilies[family] || 0);
    });

    const assetFiles = walkFiles(path.join(root, baseline.assets.root));
    equal('Legacy asset file total', assetFiles.length, baseline.assets.totalFiles);
}

function verifyContracts() {
    Object.keys(baseline.contracts).forEach((key) => {
        const contract = baseline.contracts[key];
        const actual = sha256(path.join(root, contract.path));
        if ((key === 'compatibility' || key === 'uiUx') && actual !== contract.sha256) {
            const target = implementationMatrix.targetContracts && implementationMatrix.targetContracts[key];
            equal(`Current ${key} contract version`, target && target.version, key === 'compatibility' ? '5.0.0' : '2.0.0');
            equal(`Current ${key} contract SHA-256`, target && target.sha256, actual);
        } else {
            equal(`${key} contract SHA-256`, actual, contract.sha256);
        }
    });

    equal('Matrix UI/UX fingerprint', matrix.contractFingerprints.uiUx, baseline.contracts.uiUx.sha256);
    equal('Matrix compatibility historical fingerprint', matrix.contractFingerprints.compatibility, baseline.contracts.compatibility.sha256);
}

function verifyCapabilityMatrix() {
    const requiredFamilies = ['Layout', 'Grid', 'Form', 'Show', 'Tree', 'Widget', 'System', 'Extension'];
    const allowedFamilies = new Set(requiredFamilies);
    const allowedStatuses = new Set(['unsupported', 'experimental', 'verified', 'default-candidate']);
    const allowedFallbackScopes = new Set(['component', 'page', 'route', 'global']);
    const requiredFields = [
        'capabilityId',
        'pageFamily',
        'legacyEvidence',
        'stableContracts',
        'modernStatus',
        'fallbackScope',
        'verification',
        'contractVersions',
        'contractFingerprints',
        'dependsOn',
        'consumers',
        'lastImpactedBy',
        'verifiedCommit',
    ];
    const ids = new Set();
    const families = new Set();
    const byId = new Map();

    matrix.capabilities.forEach((capability) => {
        requiredFields.forEach((field) => {
            if (!Object.prototype.hasOwnProperty.call(capability, field)) {
                errors.push(`${capability.capabilityId || '<unknown>'} is missing ${field}`);
            }
        });

        if (ids.has(capability.capabilityId)) {
            errors.push(`Duplicate capabilityId ${capability.capabilityId}`);
        }
        ids.add(capability.capabilityId);
        byId.set(capability.capabilityId, capability);
        families.add(capability.pageFamily);

        if (!allowedFamilies.has(capability.pageFamily)) {
            errors.push(`${capability.capabilityId} has unknown pageFamily ${capability.pageFamily}`);
        }
        if (!allowedStatuses.has(capability.modernStatus)) {
            errors.push(`${capability.capabilityId} has unknown modernStatus ${capability.modernStatus}`);
        }
        if (!allowedFallbackScopes.has(capability.fallbackScope)) {
            errors.push(`${capability.capabilityId} has unknown fallbackScope ${capability.fallbackScope}`);
        }
        if (!Array.isArray(capability.legacyEvidence) || capability.legacyEvidence.length === 0) {
            errors.push(`${capability.capabilityId} must contain legacy evidence`);
        }
        if (!Array.isArray(capability.consumers) || capability.consumers.length === 0) {
            errors.push(`${capability.capabilityId} must contain consumers`);
        }

        equal(`${capability.capabilityId} UI/UX fingerprint`, capability.contractFingerprints.uiUx, matrix.contractFingerprints.uiUx);
        equal(`${capability.capabilityId} compatibility fingerprint`, capability.contractFingerprints.compatibility, matrix.contractFingerprints.compatibility);
    });

    requiredFamilies.forEach((family) => {
        if (!families.has(family)) {
            errors.push(`Capability matrix does not cover page family ${family}`);
        }
    });

    matrix.capabilities.forEach((capability) => {
        capability.dependsOn.forEach((dependencyId) => {
            if (!byId.has(dependencyId)) {
                errors.push(`${capability.capabilityId} depends on missing capability ${dependencyId}`);
            }
        });
    });

    detectCycles(byId);

    const pendingFingerprints = ['payload', 'bridge', 'manifest'].filter((key) => !matrix.contractFingerprints[key]);
    if (pendingFingerprints.length && matrix.impactGraphUsable !== false) {
        errors.push(`impactGraphUsable must remain false while fingerprints are pending: ${pendingFingerprints.join(', ')}`);
    }
}

function detectCycles(byId) {
    const visiting = new Set();
    const visited = new Set();

    function visit(id, chain) {
        if (visiting.has(id)) {
            errors.push(`Capability dependency cycle detected: ${chain.concat(id).join(' -> ')}`);
            return;
        }
        if (visited.has(id) || !byId.has(id)) {
            return;
        }

        visiting.add(id);
        const capability = byId.get(id);
        capability.dependsOn.forEach((dependencyId) => visit(dependencyId, chain.concat(id)));
        visiting.delete(id);
        visited.add(id);
    }

    byId.forEach((value, id) => visit(id, []));
}

function equal(label, actual, expected) {
    if (actual !== expected) {
        errors.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}
