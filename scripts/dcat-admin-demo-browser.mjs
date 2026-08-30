import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const demoPath = path.resolve(process.env.DCAT_DEMO_PATH || path.join(root, 'dcat-admin-demo'));
const baseUrl = trimSlash(process.env.DCAT_DEMO_BASE_URL || 'http://127.0.0.1:8301');
const adminPrefix = normalizePrefix(process.env.DCAT_DEMO_ADMIN_PREFIX || '/admin');
const username = process.env.DCAT_DEMO_ADMIN_USERNAME || 'admin';
const password = process.env.DCAT_DEMO_ADMIN_PASSWORD || 'admin';
const phpBinary = process.env.DCAT_PHP_BINARY || 'php';
const label = process.env.DCAT_DEMO_LABEL || 'current';
const chromePath = process.env.DCAT_CHROME_PATH || '/usr/bin/google-chrome';
const evidenceDir = path.resolve(process.env.DCAT_DEMO_EVIDENCE_DIR || path.join(root, 'artifacts/dcat-admin-demo', label));
const baselinePath = process.env.DCAT_DEMO_BASELINE ? path.resolve(process.env.DCAT_DEMO_BASELINE) : null;
const takeScreenshots = process.env.DCAT_DEMO_SCREENSHOTS !== '0';
const interactionsOnly = process.argv.includes('--interactions-only');
const validationContract = JSON.parse(fs.readFileSync(path.join(root, 'codestable/epics/001-o-view-layer-modernization/m11-demo-laravel10-validation.json'), 'utf8'));
const demoControllerBaseline = validationContract.demoControllerBaseline;

if (!fs.existsSync(demoPath)) fail(`Demo project is missing: ${demoPath}`);
if (!fs.existsSync(chromePath)) fail(`Chrome executable is missing: ${chromePath}`);

fs.mkdirSync(evidenceDir, { recursive: true });
if (takeScreenshots) fs.mkdirSync(path.join(evidenceDir, 'screenshots'), { recursive: true });

const routes = discoverPageRoutes();
const menuRoutes = discoverMenuRoutes();
const controllerFiles = discoverDemoControllers();
const missingControllers = demoControllerBaseline.files.filter((file) => !controllerFiles.includes(file));
const baseline = baselinePath && fs.existsSync(baselinePath)
    ? JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
    : null;

if (missingControllers.length) {
    fail(`Demo Controller inventory was reduced. Missing: ${missingControllers.join(', ')}`);
}
if (routes.length < demoControllerBaseline.minimumPageRoutes) {
    fail(`Demo route coverage shrank: ${routes.length} pages found, ${demoControllerBaseline.minimumPageRoutes} required.`);
}
if (menuRoutes.length < demoControllerBaseline.minimumActiveMenuRoutes) {
    fail(`Demo menu coverage shrank: ${menuRoutes.length} active routes found, ${demoControllerBaseline.minimumActiveMenuRoutes} required.`);
}

const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
});

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

try {
    await login(page);

    const evidence = {
        schemaVersion: 1,
        capturedAt: new Date().toISOString(),
        label,
        baseUrl,
        adminPrefix,
        demoPath,
        browserVersion: await browser.version(),
        routesDiscovered: routes.length,
        coverage: {
            menuPagesExpected: menuRoutes,
            menuPagesMissing: [],
            demoControllerFilesExpected: demoControllerBaseline.files.length,
            demoControllerFilesFound: controllerFiles.length,
            demoControllerFilesMissing: missingControllers,
            minimumPageRoutes: demoControllerBaseline.minimumPageRoutes,
            pageRoutesDiscovered: routes.length,
        },
        pages: [],
        interactionChecks: {},
        responsiveChecks: [],
        layoutComparison: null,
        summary: {},
    };

    for (const route of interactionsOnly ? [] : routes) {
        evidence.pages.push(await inspectPage(page, route));
    }

    evidence.interactionChecks = await runInteractionChecks(page);
    evidence.responsiveChecks = interactionsOnly ? [] : await runResponsiveChecks(page);

    if (baseline) {
        evidence.layoutComparison = compareLayouts(baseline, evidence);
    }

    const pagePaths = new Set(evidence.pages.map((item) => item.path));
    evidence.coverage.menuPagesMissing = interactionsOnly ? [] : menuRoutes.filter((route) => !pagePaths.has(route));

    const blockingPages = evidence.pages.filter((item) => item.blocking.length > 0);
    const blockingResponsive = evidence.responsiveChecks.filter((item) => item.blocking.length > 0);
    const blockingInteractions = Object.entries(evidence.interactionChecks)
        .filter(([, item]) => item.status !== 'passed')
        .map(([name, item]) => ({ name, ...item }));
    const layoutBlocking = evidence.layoutComparison?.blocking || [];

    evidence.summary = {
        pagesChecked: evidence.pages.length,
        pageFailures: blockingPages.length,
        responsiveChecks: evidence.responsiveChecks.length,
        responsiveFailures: blockingResponsive.length,
        interactionChecks: Object.keys(evidence.interactionChecks).length,
        interactionFailures: blockingInteractions.length,
        layoutBlockingDifferences: layoutBlocking.length,
        externalWarnings: evidence.pages.reduce((sum, item) => sum + item.externalWarnings.length, 0),
        menuPagesExpected: menuRoutes.length,
        menuPagesMissing: evidence.coverage.menuPagesMissing.length,
        demoControllerFilesExpected: evidence.coverage.demoControllerFilesExpected,
        demoControllerFilesFound: evidence.coverage.demoControllerFilesFound,
        demoControllerFilesMissing: evidence.coverage.demoControllerFilesMissing.length,
        pageRoutesMinimum: evidence.coverage.minimumPageRoutes,
        pageRoutesDiscovered: evidence.coverage.pageRoutesDiscovered,
    };

    const reportPath = path.join(evidenceDir, 'demo-browser-report.json');
    fs.writeFileSync(reportPath, `${JSON.stringify(evidence, null, 2)}\n`);

    if (blockingPages.length || blockingResponsive.length || blockingInteractions.length || layoutBlocking.length || evidence.coverage.menuPagesMissing.length || evidence.coverage.demoControllerFilesMissing.length || evidence.coverage.pageRoutesDiscovered < evidence.coverage.minimumPageRoutes) {
        const messages = [
            ...blockingPages.map((item) => `${item.path}: ${item.blocking.join(' | ')}`),
            ...blockingResponsive.map((item) => `${item.path} ${item.viewport.width}x${item.viewport.height}: ${item.blocking.join(' | ')}`),
            ...blockingInteractions.map((item) => `interaction ${item.name}: ${item.error || item.status}`),
            ...layoutBlocking.map((item) => `layout ${item.path}: ${item.message}`),
            ...evidence.coverage.menuPagesMissing.map((item) => `menu page not covered: ${item}`),
            ...evidence.coverage.demoControllerFilesMissing.map((item) => `Demo Controller is missing: ${item}`),
        ];
        if (evidence.coverage.pageRoutesDiscovered < evidence.coverage.minimumPageRoutes) {
            messages.push(`Demo route coverage shrank: ${evidence.coverage.pageRoutesDiscovered} pages found, ${evidence.coverage.minimumPageRoutes} required.`);
        }
        fail(`Dcat Admin demo browser regression failed (${messages.length} blocking findings). ${messages.slice(0, 20).join(' || ')}`);
    }

    console.log(`Dcat Admin demo browser regression OK: ${evidence.summary.pagesChecked} pages, ${evidence.summary.responsiveChecks} responsive captures, ${evidence.summary.interactionChecks} interactions, ${evidence.summary.externalWarnings} external warnings.`);
    console.log(`Evidence: ${reportPath}`);
} finally {
    await context.close();
    await browser.close();
}

function discoverMenuRoutes() {
    const php = `
$menu = require 'app/Admin/menu.php';
$paths = [];
foreach ($menu as $item) {
    $uri = trim((string) ($item['uri'] ?? ''), '/');
    if ($uri !== '') {
        $paths[] = $uri;
    }
}

echo json_encode(array_values(array_unique($paths)));
`;

    let output;
    try {
        output = execFileSync(phpBinary, ['-r', php], {
            cwd: demoPath,
            encoding: 'utf8',
            maxBuffer: 1024 * 1024,
        });
    } catch (error) {
        fail(`Unable to read Demo menu.php: ${error.stderr || error.message}`);
    }

    return JSON.parse(output).map((uri) => `${adminPrefix}/${String(uri).replace(/^\/+/, '')}`);
}

function discoverDemoControllers() {
    const controllerRoot = path.join(demoPath, 'app', 'Admin', 'Controllers');
    if (!fs.existsSync(controllerRoot)) fail(`Demo Controller directory is missing: ${controllerRoot}`);

    const files = [];
    const visit = (directory) => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const filename = path.join(directory, entry.name);
            if (entry.isDirectory()) visit(filename);
            else if (entry.isFile() && filename.endsWith('.php')) {
                files.push(path.relative(controllerRoot, filename).split(path.sep).join('/'));
            }
        }
    };

    visit(controllerRoot);

    return files.sort();
}

function discoverPageRoutes() {
    let routeJson;
    try {
        routeJson = execFileSync(phpBinary, ['artisan', 'route:list', '--json'], {
            cwd: demoPath,
            encoding: 'utf8',
            maxBuffer: 8 * 1024 * 1024,
        });
    } catch (error) {
        fail(`Unable to read Laravel route list: ${error.stderr || error.message}`);
    }

    const discovered = JSON.parse(routeJson)
        .filter((route) => String(route.method).split('|').includes('GET'))
        .map((route) => String(route.uri).replace(/^\/+/, ''))
        .filter((uri) => uri === adminPrefix.replace(/^\//, '') || uri.startsWith(`${adminPrefix.replace(/^\//, '')}/`))
        .filter((uri) => !uri.includes('{'))
        .filter((uri) => !/\/auth\/(?:login|logout)$/.test(uri))
        .filter((uri) => !uri.includes('/dcat-api/'))
        .filter((uri) => uri !== `${stripPrefix(adminPrefix)}/users/create`)
        .filter((uri) => !uri.startsWith(`${stripPrefix(adminPrefix)}/extensions/ueditor`));

    const dynamicPages = [
        `${stripPrefix(adminPrefix)}/auth/menu/1/edit`,
        `${stripPrefix(adminPrefix)}/auth/users/1`,
        `${stripPrefix(adminPrefix)}/auth/users/1/edit`,
        `${stripPrefix(adminPrefix)}/auth/roles/1`,
        `${stripPrefix(adminPrefix)}/auth/roles/1/edit`,
        `${stripPrefix(adminPrefix)}/auth/permissions/1/edit`,
    ];

    const pages = [...new Set([...discovered, ...dynamicPages])]
        .map((uri) => ({ path: `/${uri}` }))
        .sort((a, b) => a.path.localeCompare(b.path));

    return pages;
}

async function inspectPage(page, route) {
    const localErrors = [];
    const externalWarnings = [];
    const consoleErrors = [];
    const pageErrors = [];

    const onConsole = (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    };
    const onPageError = (error) => pageErrors.push(error.stack || String(error));
    const onRequestFailed = (request) => {
        const target = request.url();
        const detail = `${request.method()} ${target}: ${request.failure()?.errorText || 'request failed'}`;
        if (isLocal(target)) localErrors.push(detail);
        else externalWarnings.push(detail);
    };
    const onResponse = (response) => {
        if (response.status() < 400) return;
        const target = response.url();
        const detail = `${response.status()} ${target}`;
        if (isLocal(target)) localErrors.push(detail);
        else externalWarnings.push(detail);
    };

    page.on('console', onConsole);
    page.on('pageerror', onPageError);
    page.on('requestfailed', onRequestFailed);
    page.on('response', onResponse);

    let response = null;
    let navigationError = null;
    try {
        response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
        await page.waitForLoadState('networkidle', { timeout: 4_000 }).catch(() => {});
        await page.waitForTimeout(150);
    } catch (error) {
        navigationError = String(error);
    }

    const metrics = await page.evaluate(() => {
        const selectors = [
            '.main-sidebar',
            '.main-menu-content',
            '.header-navbar',
            '.app-content.content',
            '.content-wrapper',
            '.content-body#app',
            '.main-footer',
        ];
        const rect = (element) => {
            if (!(element instanceof HTMLElement)) return null;
            const r = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return {
                x: Math.round(r.x * 100) / 100,
                y: Math.round(r.y * 100) / 100,
                width: Math.round(r.width * 100) / 100,
                height: Math.round(r.height * 100) / 100,
                display: style.display,
                position: style.position,
            };
        };
        return {
            url: location.href,
            title: document.title,
            heading: document.querySelector('h1, .content-header h1, .content-title')?.textContent?.trim() || '',
            bodyClass: document.body?.className || '',
            document: {
                viewportWidth: innerWidth,
                viewportHeight: innerHeight,
                clientWidth: document.documentElement.clientWidth,
                scrollWidth: document.documentElement.scrollWidth,
                scrollHeight: document.documentElement.scrollHeight,
            },
            anchors: Object.fromEntries(selectors.map((selector) => [selector, rect(document.querySelector(selector))])),
            stylesheetCount: document.querySelectorAll('link[rel="stylesheet"]').length,
            scriptCount: document.querySelectorAll('script[src]').length,
            modernActive: document.body?.classList.contains('dcat-modern-active') || false,
            modernRuntime: Boolean(document.getElementById('dcat-modern-runtime')),
            modernRendererMode: document.querySelector('[data-dcat-modern-page-config]')?.getAttribute('data-dcat-r') || null,
            modernRequestMarkers: document.querySelectorAll('[data-dcat-modern-request="1"]').length,
            modernMountedCapabilities: [...document.querySelectorAll('[data-dcat-modern-react-mounted]')]
                .flatMap((element) => String(element.getAttribute('data-dcat-modern-react-mounted') || '').split(/\s+/))
                .filter(Boolean),
            forcedRendererQuery: new URL(location.href).searchParams.has('__dcat_legacy'),
            exceptionText: document.querySelector('.exception-message, .error-page, .whoops')?.textContent?.trim().slice(0, 500) || '',
        };
    }).catch(() => ({
        url: '', title: '', heading: '', bodyClass: '', document: {}, anchors: {}, stylesheetCount: 0, scriptCount: 0,
        modernActive: false, modernRuntime: false, modernRendererMode: null, modernRequestMarkers: 0, modernMountedCapabilities: [],
        forcedRendererQuery: false, exceptionText: '',
    }));

    if (takeScreenshots && !navigationError) {
        await page.screenshot({
            path: path.join(evidenceDir, 'screenshots', `${slug(route.path)}.png`),
            fullPage: true,
        }).catch(() => {});
    }

    page.off('console', onConsole);
    page.off('pageerror', onPageError);
    page.off('requestfailed', onRequestFailed);
    page.off('response', onResponse);

    const blocking = [];
    const status = response?.status() ?? null;
    if (navigationError) blocking.push(`navigation error: ${navigationError}`);
    if (status !== 200) blocking.push(`HTTP status ${status}`);
    if (localErrors.length) blocking.push(`local HTTP/resource errors: ${localErrors.join('; ')}`);
    if (pageErrors.length) blocking.push(`page errors: ${pageErrors.join('; ')}`);
    const actionableConsoleErrors = consoleErrors.filter((message) => !message.startsWith('Failed to load resource:'));
    if (actionableConsoleErrors.length) blocking.push(`console errors: ${actionableConsoleErrors.join('; ')}`);
    if (metrics.exceptionText) blocking.push(`exception UI detected: ${metrics.exceptionText}`);
    if (!metrics.modernRuntime) blocking.push('Modern runtime is not present');
    if (!metrics.modernActive) blocking.push('Modern renderer is not active');
    if (metrics.modernRendererMode !== '1') blocking.push(`Modern native manifest renderer is not active (mode=${metrics.modernRendererMode})`);
    if (!metrics.modernRequestMarkers) blocking.push('Modern request marker is not present');
    if (metrics.forcedRendererQuery) blocking.push('Page URL still carries the removed forced-renderer query');
    const isPreview = route.path.endsWith('/preview');
    if (!isPreview && metrics.document.scrollWidth > metrics.document.clientWidth + 32) {
        blocking.push(`document horizontal overflow ${metrics.document.scrollWidth}px > ${metrics.document.clientWidth}px`);
    }

    const isFullPage = route.path.endsWith('/full') || (
        !metrics.anchors['.header-navbar']
        && !metrics.anchors['.content-wrapper']
        && Boolean(metrics.anchors['.app-content.content'])
        && Boolean(metrics.anchors['.content-body#app'])
    );
    if (!isPreview && !isFullPage) {
        for (const selector of ['.header-navbar', '.app-content.content', '.content-wrapper', '.content-body#app']) {
            if (!metrics.anchors[selector]) blocking.push(`missing layout anchor ${selector}`);
        }
    } else if (!isPreview && !metrics.anchors['.app-content.content']) {
        blocking.push('full page is missing .app-content.content');
    }

    return {
        path: route.path,
        status,
        ...metrics,
        localErrors: unique(localErrors),
        externalWarnings: unique(externalWarnings),
        consoleErrors: unique(consoleErrors),
        actionableConsoleErrors: unique(actionableConsoleErrors),
        pageErrors: unique(pageErrors),
        layoutProfile: isPreview ? 'preview-fragment' : (isFullPage ? 'full' : 'standard'),
        blocking: unique(blocking),
    };
}

async function runInteractionChecks(page) {
    const checks = {};

    checks.pjaxMenuNavigation = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}`, { waitUntil: 'networkidle' });
        const target = page.locator(`a[href$="${adminPrefix}/layout"]`).first();
        if (await target.count() !== 1) throw new Error('layout menu link not found');
        await target.click();
        await page.waitForURL((url) => url.pathname.endsWith(`${adminPrefix}/layout`), { timeout: 10_000 });
        if (await page.locator('.content-body#app').count() !== 1) throw new Error('PJAX navigation produced missing/duplicate #app');
        const chartCount = await page.evaluate(() => window.Dcat?.charts?.count?.() ?? 0);
        if (chartCount) throw new Error(`PJAX navigation retained ${chartCount} chart instances from the previous page`);
    });

    checks.sidebarNestedMenus = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}`, { waitUntil: 'networkidle' });
        const menu = page.locator('[data-dcat-react-component="layout.menu"] .dcat-modern-react-view');
        await menu.waitFor({ state: 'visible' });
        const forms = menu.locator('.nav-sidebar > li > a[data-id="form"]');
        const before = page.url();
        await forms.click();
        if (await forms.getAttribute('aria-expanded') !== 'true') throw new Error('added Form menu did not expand');
        const nested = forms.locator('..').locator(':scope > ul a[aria-expanded]').first();
        await nested.focus();
        await page.keyboard.press('Space');
        if (await nested.getAttribute('aria-expanded') !== 'true') throw new Error('third-level menu did not expand by keyboard');
        const leaf = nested.locator('..').locator(':scope > ul a[href]:not([href="#"])').first();
        if (!await leaf.isVisible()) throw new Error('expanded third-level menu is not visible');
        if (page.url() !== before) throw new Error('expanding a menu changed the URL');
        if (takeScreenshots) await page.screenshot({ path: path.join(evidenceDir, 'screenshots', 'sidebar-nested-expanded.png') });
        const target = await leaf.getAttribute('href');
        await leaf.click();
        await page.waitForURL(target, { timeout: 10_000 });
        if (await page.locator('.content-body#app').count() !== 1) throw new Error('nested menu navigation lost the content root');
    });

    checks.dashboardSpacingAndDropdown = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}`, { waitUntil: 'networkidle' });
        const padding = await page.locator('.card > .metric-content').evaluateAll((nodes) => nodes.map((node) => {
            const style = getComputedStyle(node);
            return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
        }));
        if (!padding.length || padding.some((sides) => sides.some((value) => value !== '16px'))) throw new Error(`Metrics content padding differs from 16px: ${JSON.stringify(padding)}`);
        const dropdown = page.locator('.chart-dropdown').first();
        const trigger = dropdown.locator('[data-toggle="dropdown"]');
        await trigger.scrollIntoViewIfNeeded();
        const before = await trigger.boundingBox();
        await trigger.click();
        const menu = dropdown.locator('.dropdown-menu');
        if (!await menu.isVisible()) throw new Error('Metrics dropdown did not open');
        const geometry = await dropdown.evaluate((node) => {
            const trigger = node.querySelector('[data-toggle="dropdown"]');
            const menu = node.querySelector('.dropdown-menu');
            const item = menu.querySelector('.dropdown-item > a');
            const anchor = trigger.getBoundingClientRect();
            const bounds = menu.getBoundingClientRect();
            const style = getComputedStyle(menu);
            const itemStyle = getComputedStyle(item);
            return { width: bounds.width, right: bounds.right, top: bounds.top, bottom: bounds.bottom, anchorRight: anchor.right, anchorTop: anchor.top, anchorBottom: anchor.bottom, padding: [style.paddingLeft, style.paddingRight], itemPadding: [itemStyle.paddingLeft, itemStyle.paddingRight] };
        });
        if (geometry.width < 150 || geometry.width > 320) throw new Error(`Metrics dropdown lost its content width: ${geometry.width}`);
        if (Math.abs(geometry.right - geometry.anchorRight) > 2) throw new Error('Metrics dropdown is not right-aligned with its trigger');
        if (geometry.padding.some((value) => value !== '8px') || geometry.itemPadding.some((value) => value !== '12px')) throw new Error(`Metrics dropdown horizontal padding is incorrect: ${JSON.stringify(geometry)}`);
        if (geometry.top < geometry.anchorBottom && geometry.bottom > geometry.anchorTop) throw new Error('Metrics dropdown covers its trigger');
        const after = await trigger.boundingBox();
        if (Math.abs(before.x - after.x) > 1 || Math.abs(before.y - after.y) > 1) throw new Error('Metrics dropdown shifted its trigger');
        if (takeScreenshots) await page.screenshot({ path: path.join(evidenceDir, 'screenshots', 'dashboard-dropdown-expanded.png') });
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Escape');
        if (await menu.isVisible()) throw new Error('Metrics dropdown did not close on Escape');
        if (!await trigger.evaluate((node) => document.activeElement === node)) throw new Error('Metrics dropdown did not restore trigger focus');
    });

    checks.gridControls = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}/components/grid`, { waitUntil: 'networkidle' });
        if (await page.locator('.grid-table').count() < 1 && await page.locator('table').count() < 1) throw new Error('grid table not rendered');
        const filterToggle = page.locator('[data-action="filter"], .filter-btn, .grid-filter-btn').first();
        if (await filterToggle.count()) await filterToggle.click();
    });

    checks.formControls = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}/form`, { waitUntil: 'networkidle' });
        if (await page.locator('form').count() < 1) throw new Error('form page has no form');
        if (await page.locator('input, select, textarea').count() < 5) throw new Error('form controls did not render');
        const rangeLabels = await page.locator('form input').evaluateAll((nodes) => nodes
            .filter((node) => /(?:date|time|datetime)-(?:start|end)\]$/.test(node.name))
            .map((node) => node.getAttribute('aria-label')));
        if (rangeLabels.length !== 6 || rangeLabels.some((label) => !label?.trim()) || new Set(rangeLabels).size !== 6) throw new Error('range fields do not have distinct accessible start/end labels');
        const mixedTabs = page.locator('.nav-tabs').filter({ has: page.locator('a[href*="_t=2"]') }).first();
        if (await mixedTabs.getAttribute('role') === 'tablist') throw new Error('page navigation links were incorrectly declared as ARIA tabs');
        const input = page.locator('.form-horizontal .input-group > input.form-control').first();
        const before = await input.boundingBox();
        await input.focus();
        const focused = await input.evaluate((node) => ({ border: getComputedStyle(node).borderColor, shadow: getComputedStyle(node).boxShadow }));
        if (focused.border !== 'rgb(88, 108, 177)' || focused.shadow === 'none') throw new Error('compat form focus is not visible');
        if (JSON.stringify(await input.boundingBox()) !== JSON.stringify(before)) throw new Error('compat form focus shifted the input');
    });

    checks.compatChoices = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}/form?_t=2`, { waitUntil: 'networkidle' });
        const input = page.locator('.vs-checkbox-con input[name="form2[checkbox][]"]').first();
        const checked = await input.isChecked();
        const label = input.locator('..');
        if (await label.evaluate((node) => node.tagName) !== 'LABEL') throw new Error('compat checkbox has no clickable label');
        await label.locator(':scope > span:last-child').click();
        if (await input.isChecked() === checked) throw new Error('compat checkbox label did not toggle the input');
        if (await label.locator('.vs-checkbox').isVisible()) throw new Error('compat checkbox shows duplicate decorative state');
        await input.focus();
        await page.keyboard.press('Space');
        if (await input.isChecked() !== checked) throw new Error('compat checkbox keyboard toggle failed');
        const dualButton = page.locator('.bootstrap-duallistbox-container .moveall').first();
        const caption = await dualButton.evaluate((node) => getComputedStyle(node, '::after').content);
        if (!caption.includes('Move all')) throw new Error('compat dual-list action is visually blank');
    });

    checks.tabs = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}/components/tab-button`, { waitUntil: 'networkidle' });
        const tabs = page.locator('.nav-tabs .nav-link, [role="tab"]');
        if (await tabs.count() < 2) throw new Error('tab controls not rendered');
        await tabs.nth(1).click();
    });

    checks.dropdown = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}/components/dropdown-menu`, { waitUntil: 'networkidle' });
        const toggle = page.locator('[data-toggle="dropdown"]').first();
        if (await toggle.count() < 1) throw new Error('dropdown toggle not rendered');
        await toggle.click();
    });

    checks.layerIconOnlyDropdowns = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}/components/layer`, { waitUntil: 'networkidle' });
        if (!await page.locator('body.dcat-modern-active').count()) throw new Error('Layer Controller left the Modern renderer');

        const toggles = page.locator('[data-dcat-native-widget-dropdown="1"] button[data-dcat-widget-dropdown-trigger="1"]');
        if (await toggles.count() !== 4) throw new Error(`expected 4 native icon-only Layer dropdowns, found ${await toggles.count()}`);

        for (const toggle of await toggles.all()) {
            const label = await toggle.getAttribute('aria-label');
            const visibleText = (await toggle.locator('[data-dcat-dropdown-label]').textContent())?.trim() || '';
            if (!label?.trim()) throw new Error('icon-only Layer dropdown has no accessible name');
            if (visibleText) throw new Error('Layer dropdown unexpectedly displays button text');
        }

        const first = toggles.first();
        await first.click();
        if (await first.getAttribute('aria-expanded') !== 'true') throw new Error('icon-only Layer dropdown did not open');
        const menuId = await first.getAttribute('aria-controls');
        if (!menuId || !await page.locator(`#${menuId}`).isVisible()) throw new Error('icon-only Layer dropdown menu is not visible');
    });

    checks.modal = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}/components/modal`, { waitUntil: 'networkidle' });
        const trigger = page.locator('span[data-toggle="modal"]', { hasText: '普通弹窗' }).first();
        if (await trigger.count() < 1) throw new Error('modal trigger not rendered');
        const target = await trigger.getAttribute('data-target');
        await trigger.click();
        if (!target) throw new Error('modal trigger is missing data-target');
        await page.locator(target).waitFor({ state: 'visible', timeout: 5_000 });
        await page.keyboard.press('Escape');
    });

    checks.tree = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}/tree`, { waitUntil: 'networkidle' });
        if (await page.locator('.grid-table, table').count() < 1) throw new Error('tree grid did not render');
        if (await page.locator('[data-action="tree"], .tree-column, .grid-column-tree').count() < 1) {
            const hasExpandableRows = await page.locator('tr[data-key], tbody tr').count();
            if (hasExpandableRows < 1) throw new Error('tree rows did not render');
        }
    });

    checks.editor = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}/form/markdown`, { waitUntil: 'networkidle' });
        if (await page.locator('textarea, .editor.md, .CodeMirror').count() < 1) throw new Error('markdown editor did not render');
    });

    checks.modernBlockForm = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}/form/layout/block`, { waitUntil: 'networkidle' });
        if (!await page.locator('body.dcat-modern-active').count()) throw new Error('block form left the Modern renderer');
        if (!await page.locator('[data-dcat-modern-form-layout="block"]').count()) throw new Error('Form::block compatibility island did not mount');
        if (!await page.locator('form[data-dcat-modern-react-mounted~="form.basic"]').count()) throw new Error('Form::block outer form did not commit the Modern form view');
        if (await page.locator('form input:not([type="hidden"]), form textarea').count() < 10) throw new Error('Form::block controls were lost');
    });

    checks.formTabs = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}/form/layout/tab`, { waitUntil: 'networkidle' });
        const tabs = page.locator('[role="tab"]');
        if (await tabs.count() < 2) throw new Error('Modern Form tabs did not render');
        await tabs.nth(1).click();
        if (await tabs.nth(1).getAttribute('aria-selected') !== 'true') throw new Error('Modern Form tab selection did not change');
    });

    checks.checkboxRadio = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}/components/checkbox-radio`, { waitUntil: 'networkidle' });
        const input = page.locator('input[type="checkbox"]:not(:disabled), input[type="radio"]:not(:disabled)').first();
        if (!await input.count()) throw new Error('checkbox/radio controls did not render');
        const before = await input.isChecked();
        await input.click({ force: true });
        if (await input.getAttribute('type') === 'checkbox' && await input.isChecked() === before) throw new Error('checkbox state did not change');
    });

    checks.userShow = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}/auth/users/1`, { waitUntil: 'networkidle' });
        if (!await page.locator('body.dcat-modern-active').count()) throw new Error('user Show page left the Modern renderer');
        if (!await page.locator('[data-dcat-modern-react-mounted~="show.detail"]').count()) throw new Error('Show detail Modern view did not commit');
    });

    checks.userCreateForm = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}/auth/users/create`, { waitUntil: 'networkidle' });
        for (const name of ['username', 'name', 'password', 'password_confirmation']) {
            if (!await page.locator(`[name="${name}"]`).count()) throw new Error(`administrator create field missing: ${name}`);
        }
        if (!await page.locator('form[data-dcat-modern-react-mounted~="form.basic"]').count()) throw new Error('administrator create Modern form did not commit');
    });

    checks.quickSearch = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}/auth/users`, { waitUntil: 'networkidle' });
        const search = page.locator('form.quick-search-form input[name="_search_"], input[name="_search_"]').first();
        if (!await search.count()) throw new Error('administrator Grid quick search did not render');
        await search.fill('admin');
        await search.press('Enter');
        await page.waitForTimeout(300);
        if (!await page.locator('body.dcat-modern-active').count()) throw new Error('quick search left the Modern renderer');
        if (await page.locator('table tbody tr').count() < 1) throw new Error('quick search produced no Grid rows');
    });

    checks.mobileGridOverflow = await interaction(async () => {
        await page.setViewportSize({ width: 485, height: 473 });
        await page.goto(`${baseUrl}${adminPrefix}/auth/users`, { waitUntil: 'networkidle' });
        const wrapper = page.locator('.dcat-modern-grid-view .dcat-modern-table-wrap').first();
        if (!await wrapper.count()) throw new Error('Modern Grid table wrapper did not render');
        const geometry = await wrapper.evaluate((element) => ({
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
            clientHeight: element.clientHeight,
            scrollHeight: element.scrollHeight,
            overflowX: getComputedStyle(element).overflowX,
            overflowY: getComputedStyle(element).overflowY,
        }));
        if (!['auto', 'scroll'].includes(geometry.overflowX)) throw new Error(`mobile Grid horizontal overflow policy is ${geometry.overflowX}, expected a scrollable data container`);
        if (await page.locator('.dcat-modern-grid-view--stacked').count()) throw new Error('mobile Grid must preserve table semantics instead of converting rows to cards');
        if (await page.locator('.dcat-modern-grid-view table').evaluate((table) => getComputedStyle(table).display) !== 'table') throw new Error('mobile Grid table semantics were lost');

        const toggle = page.locator('tbody [data-toggle="dropdown"], tbody .dropdown-toggle').first();
        if (await toggle.count()) {
            await toggle.scrollIntoViewIfNeeded();
            await toggle.click();
            const surface = await page.locator('tbody .dropdown-menu.show').first().evaluate((menu) => {
                const rect = menu.getBoundingClientRect();
                const item = menu.querySelector('a,button') || menu;
                const hit = item.getBoundingClientRect();
                const target = document.elementFromPoint(hit.x + hit.width / 2, hit.y + hit.height / 2);
                return {
                    withinViewport: rect.x >= 0 && rect.y >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight,
                    clickable: item === target || item.contains(target),
                };
            });
            if (!surface.withinViewport || !surface.clickable) throw new Error(`row action dropdown is clipped or not clickable: ${JSON.stringify(surface)}`);
        }
        await page.setViewportSize({ width: 1440, height: 900 });
    });

    checks.conditionalForm = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}/form/when`, { waitUntil: 'networkidle' });
        const radio = page.locator('input[name="radio"][value="2"]').first();
        if (!await radio.count()) throw new Error('conditional Form radio trigger did not render');
        await radio.click({ force: true });
        await page.waitForTimeout(200);
        const editorSurface = page.locator('[name="editor"], .CodeMirror, .editor-md, [class*="editor"]');
        if (!await editorSurface.count()) throw new Error('conditional Form did not expose the editor branch');
        if (!await page.locator('body.dcat-modern-active').count()) throw new Error('conditional Form left the Modern renderer');
    });

    checks.tinymce = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}/form/tinymce`, { waitUntil: 'networkidle' });
        if (!await page.locator('.tox-tinymce, .mce-tinymce, iframe').count()) throw new Error('TinyMCE editor did not initialize');
        if (!await page.locator('body.dcat-modern-active').count()) throw new Error('TinyMCE page left the Modern renderer');
    });

    checks.authCycle = await interaction(async () => {
        await page.goto(`${baseUrl}${adminPrefix}/auth/logout`, { waitUntil: 'domcontentloaded' });
        await page.waitForURL((url) => url.pathname.endsWith('/auth/login'));
        await page.locator('input[name="username"]').fill(username);
        await page.locator('input[name="password"]').fill(password);
        await Promise.all([
            page.waitForURL((url) => !url.pathname.endsWith('/auth/login')),
            page.locator('button[type="submit"]').click(),
        ]);
        await page.waitForTimeout(150);
        if (!await page.locator('body.dcat-modern-active').count()) throw new Error('authenticated Admin page did not re-enter the Modern renderer');
    });

    return checks;
}

async function runResponsiveChecks(page) {
    const pages = [`${adminPrefix}`, `${adminPrefix}/auth/users`, `${adminPrefix}/components/grid`, `${adminPrefix}/form`, `${adminPrefix}/form?_t=2`, `${adminPrefix}/full`];
    const viewports = [
        { width: 390, height: 844 },
        { width: 768, height: 1024 },
        { width: 1024, height: 768 },
        { width: 1366, height: 768 },
        { width: 1440, height: 900 },
    ];
    const results = [];

    for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        for (const route of pages) {
            await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
            await page.waitForTimeout(150);
            const geometry = await page.evaluate(() => {
                const rect = (selector) => {
                    const element = document.querySelector(selector);
                    if (!(element instanceof HTMLElement)) return null;
                    const value = element.getBoundingClientRect();
                    return {
                        x: Math.round(value.x * 100) / 100,
                        y: Math.round(value.y * 100) / 100,
                        width: Math.round(value.width * 100) / 100,
                        height: Math.round(value.height * 100) / 100,
                    };
                };
                const overflow = (selector) => {
                    const element = document.querySelector(selector);
                    if (!(element instanceof HTMLElement)) return null;
                    const style = getComputedStyle(element);
                    return {
                        clientWidth: element.clientWidth,
                        scrollWidth: element.scrollWidth,
                        clientHeight: element.clientHeight,
                        scrollHeight: element.scrollHeight,
                        overflowX: style.overflowX,
                        overflowY: style.overflowY,
                    };
                };
                const appearance = (selector) => Array.from(document.querySelectorAll(selector)).filter((node) => node.getBoundingClientRect().width > 1).map((node) => {
                    const style = getComputedStyle(node);
                    return { height: node.getBoundingClientRect().height, radius: style.borderRadius, start: style.borderStartStartRadius, end: style.borderStartEndRadius, color: style.color };
                });
                return {
                    clientWidth: document.documentElement.clientWidth,
                    scrollWidth: document.documentElement.scrollWidth,
                    sidebar: rect('.main-sidebar'),
                    navbar: rect('.header-navbar'),
                    content: rect('.app-content.content'),
                    app: rect('.content-body#app'),
                    gridTableWrap: overflow('.dcat-modern-grid-view .dcat-modern-table-wrap'),
                    menu: appearance('.main-sidebar .nav-sidebar .nav-link.active'),
                    inputAddons: appearance('.form-horizontal .input-group > .input-group-prepend .input-group-text'),
                    groupedInputs: appearance('.form-horizontal .input-group > .input-group-prepend + input.form-control'),
                    vendorControls: appearance('.form-horizontal .select2-selection, .form-horizontal .web-uploader .webuploader-pick'),
                };
            });
            const blocking = [];
            const warnings = [];
            if (geometry.scrollWidth > geometry.clientWidth + 4) blocking.push(`document horizontal overflow ${geometry.scrollWidth}px > ${geometry.clientWidth}px`);
            if (!route.endsWith('/full') && (!geometry.navbar || !geometry.content || !geometry.app)) blocking.push('required responsive layout anchors missing');
            if (geometry.gridTableWrap) {
                if (!['auto', 'scroll'].includes(geometry.gridTableWrap.overflowX)) {
                    blocking.push(`Grid data container overflow-x is ${geometry.gridTableWrap.overflowX}, expected auto/scroll`);
                }
            }
            if (route === `${adminPrefix}/form`) {
                if (!geometry.menu.length || geometry.menu.some((item) => item.radius !== '8px')) blocking.push('legacy theme overrides the Modern navigation radius');
                if (!geometry.inputAddons.length || !geometry.groupedInputs.length) blocking.push('compat input group visual witness missing');
                if (geometry.inputAddons.some((item) => item.start !== '8px' || item.end !== '0px')) blocking.push('compat input addon does not join the input');
                if (geometry.groupedInputs.some((item) => item.start !== '0px' || item.end !== '8px' || item.height < (viewport.width < 992 ? 44 : 40))) blocking.push('compat input group radius or height differs from the Modern contract');
            }
            if (route === `${adminPrefix}/form?_t=2`) {
                if (geometry.vendorControls.length < 5) blocking.push('compat Select2 and upload witnesses missing');
                if (geometry.vendorControls.some((item) => item.radius !== '8px' || item.height < (viewport.width < 992 ? 44 : 40))) blocking.push('compat vendor controls do not share Modern control dimensions');
                if (geometry.vendorControls.some((item) => item.color === 'rgb(255, 255, 255)')) blocking.push('compat vendor label is invisible on its white control');
            }
            results.push({ path: route, viewport, geometry, warnings, blocking });

            if (takeScreenshots) {
                await page.screenshot({
                    path: path.join(evidenceDir, 'screenshots', `responsive-${viewport.width}x${viewport.height}-${slug(route)}.png`),
                    fullPage: true,
                });
            }
        }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    return results;
}

function compareLayouts(baselineEvidence, currentEvidence) {
    const baselinePages = new Map((baselineEvidence.pages || []).map((item) => [item.path, item]));
    const differences = [];
    const blocking = [];
    const selectors = ['.main-sidebar', '.main-menu-content', '.header-navbar', '.app-content.content', '.content-wrapper', '.content-body#app', '.main-footer'];

    for (const current of currentEvidence.pages) {
        const before = baselinePages.get(current.path);
        if (!before || before.status !== 200 || current.status !== 200) continue;
        if (Boolean(before.modernActive) !== Boolean(current.modernActive)) {
            differences.push({
                path: current.path,
                selector: 'renderer',
                severe: false,
                message: `renderer mode changed from ${before.modernActive ? 'modern' : 'legacy'} to ${current.modernActive ? 'modern' : 'legacy'}; legacy geometry is not a valid Modern regression baseline`,
            });
            continue;
        }
        for (const selector of selectors) {
            const a = before.anchors?.[selector] || null;
            const b = current.anchors?.[selector] || null;
            if (Boolean(a) !== Boolean(b)) {
                const item = { path: current.path, selector, message: `${selector} presence changed` };
                differences.push(item);
                blocking.push(item);
                continue;
            }
            if (!a || !b) continue;
            const deltas = {
                x: Math.abs(a.x - b.x),
                y: Math.abs(a.y - b.y),
                width: Math.abs(a.width - b.width),
                height: Math.abs(a.height - b.height),
            };
            const relativeWidth = a.width > 0 ? deltas.width / a.width : 0;
            const relativeHeight = a.height > 0 ? deltas.height / a.height : 0;
            // Footer Y is derived from the page's content height. Several official
            // Demo repositories generate Faker content on every request, so the
            // footer naturally moves even when the shell layout is identical.
            // Its horizontal placement and dimensions remain meaningful.
            const severe = selector === '.main-footer'
                ? deltas.x > 48 || relativeWidth > 0.15 || relativeHeight > 0.25
                : deltas.x > 48 || deltas.y > 48 || relativeWidth > 0.15 || relativeHeight > 0.25;
            if (Object.values(deltas).some((value) => value > 1)) {
                const item = { path: current.path, selector, deltas, relativeWidth, relativeHeight, severe, message: `${selector} geometry changed` };
                differences.push(item);
                if (severe) blocking.push(item);
            }
        }
    }

    return { baselineLabel: baselineEvidence.label, differences, blocking };
}

async function login(page) {
    const diagnostics = [];
    const onPageError = (error) => diagnostics.push(`pageerror: ${String(error)}`);
    const onConsole = (message) => {
        if (message.type() === 'error') diagnostics.push(`console: ${message.text()}`);
    };
    page.on('pageerror', onPageError);
    page.on('console', onConsole);
    await page.goto(`${baseUrl}${adminPrefix}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    const usernameInput = page.locator('input[name="username"]');
    if (await usernameInput.count()) {
        await usernameInput.fill(username);
        await page.locator('input[name="password"]').fill(password);
        const submit = page.locator('button[type="submit"], input[type="submit"]').first();
        try {
            await Promise.all([
                page.waitForURL((url) => !url.pathname.endsWith('/auth/login'), { timeout: 15_000 }),
                submit.click(),
            ]);
        } catch (error) {
            const runtime = await page.evaluate(() => ({
                createDcat: typeof window.CreateDcat,
                dcat: typeof window.Dcat,
                jquery: typeof window.jQuery,
                compat: typeof window.DcatCompat,
                compatState: window.DcatCompat?.state || null,
                readyState: document.readyState,
                formCompat: document.querySelector('#login-form')?.dataset.dcatCompatForm || null,
                formValid: document.querySelector('#login-form')?.checkValidity?.() ?? null,
                invalidControls: Array.from(document.querySelectorAll('#login-form :invalid')).map((element) => ({ name: element.getAttribute('name'), type: element.getAttribute('type'), message: element.validationMessage })),
                buttonDisabled: Boolean(document.querySelector('button[type="submit"]')?.disabled),
            }));
            fail(`Demo login navigation failed: ${String(error)}; runtime=${JSON.stringify(runtime)}; diagnostics=${unique(diagnostics).join(' | ')}`);
        }
    }
    page.off('pageerror', onPageError);
    page.off('console', onConsole);
    if (page.url().includes('/auth/login')) fail('Could not authenticate Demo admin user.');
}

async function interaction(callback) {
    const errors = [];
    const ignoredLocalResource = (url) => {
        try {
            return new URL(url).pathname === '/favicon.ico';
        } catch {
            return false;
        }
    };
    const onConsole = (message) => {
        if (message.type() !== 'error') return;
        if (message.text().startsWith('Failed to load resource:')) return;
        errors.push(`console: ${message.text()}`);
    };
    const onPageError = (error) => errors.push(`pageerror: ${String(error)}`);
    const onResponse = (response) => {
        if (response.status() >= 400 && isLocal(response.url()) && !ignoredLocalResource(response.url())) {
            errors.push(`http ${response.status()}: ${response.url()}`);
        }
    };
    const onRequestFailed = (request) => {
        if (isLocal(request.url()) && !ignoredLocalResource(request.url())) {
            errors.push(`request failed: ${request.url()} ${request.failure()?.errorText ?? ''}`.trim());
        }
    };
    page.on('console', onConsole);
    page.on('pageerror', onPageError);
    page.on('response', onResponse);
    page.on('requestfailed', onRequestFailed);
    try {
        await callback();
        await page.waitForTimeout(100);
        if (errors.length) throw new Error(unique(errors).join(' | '));
        return { status: 'passed' };
    } catch (error) {
        return { status: 'failed', error: String(error) };
    } finally {
        page.off('console', onConsole);
        page.off('pageerror', onPageError);
        page.off('response', onResponse);
        page.off('requestfailed', onRequestFailed);
    }
}

function isLocal(value) {
    try {
        const url = new URL(value);
        return url.origin === new URL(baseUrl).origin;
    } catch {
        return false;
    }
}

function normalizePrefix(prefix) {
    const normalized = `/${String(prefix).replace(/^\/+|\/+$/g, '')}`;
    return normalized === '/' ? '' : normalized;
}

function stripPrefix(prefix) {
    return String(prefix).replace(/^\/+|\/+$/g, '');
}

function trimSlash(value) {
    return String(value).replace(/\/+$/, '');
}

function slug(value) {
    return String(value).replace(/^\/+/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'admin-home';
}

function unique(values) {
    return [...new Set(values)];
}

function fail(message) {
    console.error(message);
    process.exitCode = 1;
    throw new Error(message);
}
