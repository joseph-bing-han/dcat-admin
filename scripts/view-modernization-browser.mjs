import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';
import { verifyNativeRuntime } from './view-modernization-runtime-browser.mjs';
import { verifyUpgradeCompatibility } from './view-modernization-upgrade-browser.mjs';
import { verifyModernUi } from './view-modernization-ui-browser.mjs';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const contractPath = path.join(root, 'codestable/epics/001-x-view-layer-modernization/m0/legacy-contracts.json');
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const gridCapabilityPath = path.join(root, 'codestable/epics/001-x-view-layer-modernization/grid-capability-registry.json');
const gridCapabilities = JSON.parse(fs.readFileSync(gridCapabilityPath, 'utf8'));
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const selfTest = process.argv.includes('--self-test');
const accessibilityOnly = process.argv.includes('--accessibility-only');
const accessibilityOrderOnly = process.argv.includes('--accessibility-order-only');
const reflow200Only = process.argv.includes('--reflow-200-only');
const shellOnly = process.argv.includes('--shell-only');
const gridReadOnly = process.argv.includes('--grid-read-only');
const gridInteractionsOnly = process.argv.includes('--grid-interactions-only');
const gridFilterMatrixOnly = process.argv.includes('--grid-filter-matrix-only');
const gridCompatDisplayersOnly = process.argv.includes('--grid-compat-displayers-only');
const gridActionMatrixOnly = process.argv.includes('--grid-action-matrix-only');
const formBasicOnly = process.argv.includes('--form-basic-only');
const formLayoutOnly = process.argv.includes('--form-layout-only');
const formAdvancedNativeOnly = process.argv.includes('--form-advanced-native-only');
const formAdvancedVendorOnly = process.argv.includes('--form-advanced-vendor-only');
const formAdvancedCompatOnly = process.argv.includes('--form-advanced-compat-only');
const formAdvancedOptionalOnly = process.argv.includes('--form-advanced-optional-only');
const showNativeOnly = process.argv.includes('--show-native-only');
const treeNativeOnly = process.argv.includes('--tree-native-only');
const b8SurfacesOnly = process.argv.includes('--b8-surfaces-only');
const runtimeOnly = process.argv.includes('--runtime-only');
const upgradeOnly = process.argv.includes('--upgrade-only');
const chromePath = process.env.DCAT_CHROME_PATH || '/usr/bin/google-chrome';

if (!fs.existsSync(chromePath)) {
    fail(`Chrome executable is missing: ${chromePath}`);
}

async function runAccessibilityOnly() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const username = process.env.DCAT_ADMIN_USERNAME || 'admin';
    const password = process.env.DCAT_ADMIN_PASSWORD || 'admin';
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await login(page, `${baseUrl}${adminPrefix}`, username, password);
    const checks = await verifyModernAccessibility(page, baseUrl, adminPrefix);
    const accessibilityOrder = await verifyAutomatedAccessibilityOrder(page, baseUrl, adminPrefix);
    const reflow200 = await verifyAutomatedReflow200(page, baseUrl, adminPrefix);
    console.log(`View modernization accessibility contracts OK: ${Object.keys(checks).length} axe families, ${accessibilityOrder.families.length} representative families, ${reflow200.cases.length} automated 200% reflow cases.`);
    await context.close();
}

async function runAccessibilityOrderOnly() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await login(page, `${baseUrl}${adminPrefix}`, process.env.DCAT_ADMIN_USERNAME || 'admin', process.env.DCAT_ADMIN_PASSWORD || 'admin');
    const evidence = await verifyAutomatedAccessibilityOrder(page, baseUrl, adminPrefix);
    console.log(`View modernization automated accessibility order contracts OK: ${evidence.families.length} representative families.`);
    await context.close();
}

async function runReflow200Only() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await login(page, `${baseUrl}${adminPrefix}`, process.env.DCAT_ADMIN_USERNAME || 'admin', process.env.DCAT_ADMIN_PASSWORD || 'admin');
    const evidence = await verifyAutomatedReflow200(page, baseUrl, adminPrefix);
    console.log(`View modernization automated reflow proxy contracts OK: ${evidence.cases.length} cases across ${evidence.sourceViewports.length} source viewports (native browser UI zoom: ${evidence.nativeBrowserUiZoom}).`);
    await context.close();
}

const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
});

try {
    if (selfTest) {
        await runSelfTest();
    } else if (process.argv.includes('--ui-only')) {
        const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
        const prefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
        const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        await login(page, `${baseUrl}${prefix}`, process.env.DCAT_ADMIN_USERNAME || 'admin', process.env.DCAT_ADMIN_PASSWORD || 'admin');
        const result = await verifyModernUi(page, baseUrl, prefix, path.resolve(process.env.DCAT_BROWSER_EVIDENCE_DIR || 'artifacts/bootstrap-free'));
        console.log(`Modern UI ${result.uiSpecVersion} OK: ${result.captures.length} captures, native focus and vendor dropdown states.`);
        await context.close();
    } else if (accessibilityOnly) {
        await runAccessibilityOnly();
    } else if (accessibilityOrderOnly) {
        await runAccessibilityOrderOnly();
    } else if (reflow200Only) {
        await runReflow200Only();
    } else if (shellOnly) {
        await runShellOnly();
    } else if (gridReadOnly) {
        await runGridReadOnly();
    } else if (gridInteractionsOnly) {
        await runGridInteractionsOnly();
    } else if (gridFilterMatrixOnly) {
        await runGridFilterMatrixOnly();
    } else if (gridCompatDisplayersOnly) {
        await runGridCompatDisplayersOnly();
    } else if (gridActionMatrixOnly) {
        await runGridActionMatrixOnly();
    } else if (formBasicOnly) {
        await runFormBasicOnly();
    } else if (formLayoutOnly) {
        await runFormLayoutOnly();
    } else if (formAdvancedNativeOnly) {
        await runFormAdvancedNativeOnly();
    } else if (formAdvancedVendorOnly) {
        await runFormAdvancedVendorOnly();
    } else if (formAdvancedCompatOnly) {
        await runFormAdvancedCompatOnly();
    } else if (formAdvancedOptionalOnly) {
        await runFormAdvancedOptionalOnly();
    } else if (showNativeOnly) {
        await runShowNativeOnly();
    } else if (treeNativeOnly) {
        await runTreeNativeOnly();
    } else if (b8SurfacesOnly) {
        await runB8SurfacesOnly();
    } else if (upgradeOnly) {
        const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
        const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
        const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(String(error)));
        const evidenceDir = path.resolve(process.env.DCAT_BROWSER_EVIDENCE_DIR || path.join(root, 'artifacts/bootstrap-free'));
        fs.mkdirSync(evidenceDir, { recursive: true });
        await login(page, `${baseUrl}${adminPrefix}`, process.env.DCAT_ADMIN_USERNAME || 'admin', process.env.DCAT_ADMIN_PASSWORD || 'admin');
        const evidence = await verifyUpgradeCompatibility(page, baseUrl, adminPrefix, evidenceDir);
        if (errors.length) fail(`upgrade errors: ${errors.join(' | ')}`);
        console.log(`Upgrade compatibility contracts OK: ${evidence.fixtures.length} fixtures, ${evidence.fixtures.reduce((count, fixture) => count + fixture.viewports.length, 0)} viewports.`);
        await context.close();
    } else if (runtimeOnly) {
        const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
        const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
        const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(String(error)));
        await login(page, `${baseUrl}${adminPrefix}`, process.env.DCAT_ADMIN_USERNAME || 'admin', process.env.DCAT_ADMIN_PASSWORD || 'admin');
        const evidence = await verifyNativeRuntime(page, baseUrl, adminPrefix);
        if (errors.length) fail(`native runtime errors: ${errors.join(' | ')}`);
        console.log(`Native runtime contracts OK: ${JSON.stringify(evidence)}`);
        await context.close();
    } else {
        await runContracts();
    }
} finally {
    await browser.close();
}

async function runFormBasicOnly() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    await login(page, `${baseUrl}${adminPrefix}`, process.env.DCAT_ADMIN_USERNAME || 'admin', process.env.DCAT_ADMIN_PASSWORD || 'admin');
    const evidence = await verifyModernFormBasic(page, baseUrl, adminPrefix);
    if (pageErrors.length) fail(`form-basic: browser emitted page errors: ${pageErrors.join(' | ')}`);
    console.log(`View modernization Form basic contracts OK: ${JSON.stringify(evidence)}`);
    await context.close();
}

async function runFormLayoutOnly() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    await login(page, `${baseUrl}${adminPrefix}`, process.env.DCAT_ADMIN_USERNAME || 'admin', process.env.DCAT_ADMIN_PASSWORD || 'admin');
    const evidence = await verifyModernFormLayout(page, baseUrl, adminPrefix);
    if (pageErrors.length) fail(`form-layout: browser emitted page errors: ${pageErrors.join(' | ')}`);
    console.log(`View modernization Form layout contracts OK: ${JSON.stringify(evidence)}`);
    await context.close();
}

async function runFormAdvancedNativeOnly() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    await login(page, `${baseUrl}${adminPrefix}`, process.env.DCAT_ADMIN_USERNAME || 'admin', process.env.DCAT_ADMIN_PASSWORD || 'admin');
    const evidence = await verifyModernFormAdvancedNative(page, baseUrl, adminPrefix);
    if (pageErrors.length) fail(`form-advanced-native: browser emitted page errors: ${pageErrors.join(' | ')}`);
    console.log(`View modernization Form advanced native contracts OK: ${JSON.stringify(evidence)}`);
    await context.close();
}

async function runFormAdvancedVendorOnly() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    await login(page, `${baseUrl}${adminPrefix}`, process.env.DCAT_ADMIN_USERNAME || 'admin', process.env.DCAT_ADMIN_PASSWORD || 'admin');
    const evidence = await verifyModernFormAdvancedVendor(page, baseUrl, adminPrefix);
    if (pageErrors.length) fail(`form-advanced-vendor: browser emitted page errors: ${pageErrors.join(' | ')}`);
    console.log(`View modernization Form advanced vendor contracts OK: ${JSON.stringify(evidence)}`);
    await context.close();
}

async function runFormAdvancedCompatOnly() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error?.stack || String(error)));
    await login(page, `${baseUrl}${adminPrefix}`, process.env.DCAT_ADMIN_USERNAME || 'admin', process.env.DCAT_ADMIN_PASSWORD || 'admin');
    const evidence = await verifyModernFormAdvancedCompat(page, baseUrl, adminPrefix);
    if (pageErrors.length) fail(`form-advanced-compat: browser emitted page errors: ${pageErrors.join(' | ')}`);
    console.log(`View modernization Form advanced compat contracts OK: ${JSON.stringify(evidence)}`);
    await context.close();
}

async function runFormAdvancedOptionalOnly() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error?.stack || String(error)));
    await login(page, `${baseUrl}${adminPrefix}`, process.env.DCAT_ADMIN_USERNAME || 'admin', process.env.DCAT_ADMIN_PASSWORD || 'admin');
    const evidence = await verifyModernFormAdvancedOptional(page, baseUrl, adminPrefix);
    if (pageErrors.length) fail(`form-advanced-optional: browser emitted page errors: ${pageErrors.join(' | ')}`);
    console.log(`View modernization Form advanced optional contracts OK: ${JSON.stringify(evidence)}`);
    await context.close();
}

async function runShowNativeOnly() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error?.stack || String(error)));
    await login(page, `${baseUrl}${adminPrefix}`, process.env.DCAT_ADMIN_USERNAME || 'admin', process.env.DCAT_ADMIN_PASSWORD || 'admin');
    const evidence = await verifyModernShowNative(page, baseUrl, adminPrefix);
    if (pageErrors.length) fail(`show-native: browser emitted page errors: ${pageErrors.join(' | ')}`);
    console.log(`View modernization Show native contracts OK: ${JSON.stringify(evidence)}`);
    await context.close();
}

async function runTreeNativeOnly() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error?.stack || String(error)));
    await login(page, `${baseUrl}${adminPrefix}`, process.env.DCAT_ADMIN_USERNAME || 'admin', process.env.DCAT_ADMIN_PASSWORD || 'admin');
    const evidence = await verifyModernTreeNative(page, baseUrl, adminPrefix);
    if (pageErrors.length) fail(`tree-native: browser emitted page errors: ${pageErrors.join(' | ')}`);
    console.log(`View modernization Tree native contracts OK: ${JSON.stringify(evidence)}`);
    await context.close();
}

async function runB8SurfacesOnly() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const username = process.env.DCAT_ADMIN_USERNAME || 'admin';
    const password = process.env.DCAT_ADMIN_PASSWORD || 'admin';

    const authenticated = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await authenticated.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error?.stack || String(error)));
    await login(page, `${baseUrl}${adminPrefix}`, username, password);
    const surfaces = await verifyModernB8Surfaces(page, baseUrl, adminPrefix);
    if (pageErrors.length) fail(`b8-surfaces: browser emitted page errors: ${pageErrors.join(' | ')}`);
    await authenticated.close();

    const loginContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const loginPage = await loginContext.newPage();
    const loginErrors = [];
    loginPage.on('pageerror', (error) => loginErrors.push(error?.stack || String(error)));
    const loginEvidence = await verifyModernB8Login(loginPage, baseUrl, adminPrefix, username, password);
    if (loginErrors.length) fail(`b8-login: browser emitted page errors: ${loginErrors.join(' | ')}`);
    await loginContext.close();

    const fallbackContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const fallbackEvidence = await verifyModernB8ServerFallbacks(fallbackContext, baseUrl, adminPrefix, username, password);
    await fallbackContext.close();

    console.log(`View modernization B8 Widget/System/Login contracts OK: ${JSON.stringify({ surfaces, login: loginEvidence, fallback: fallbackEvidence })}`);
}

async function runGridActionMatrixOnly() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await login(page, `${baseUrl}${adminPrefix}`, process.env.DCAT_ADMIN_USERNAME || 'admin', process.env.DCAT_ADMIN_PASSWORD || 'admin');
    const evidence = await verifyModernGridActionMatrix(page, baseUrl, adminPrefix);
    console.log(`View modernization Grid action matrix contracts OK: ${JSON.stringify(evidence)}`);
    await context.close();
}

async function runGridCompatDisplayersOnly() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const username = process.env.DCAT_ADMIN_USERNAME || 'admin';
    const password = process.env.DCAT_ADMIN_PASSWORD || 'admin';
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    await login(page, `${baseUrl}${adminPrefix}`, username, password);
    const evidence = await verifyModernGridCompatDisplayers(page, baseUrl, adminPrefix);
    if (pageErrors.length) fail(`grid-compat-displayers: browser emitted page errors: ${pageErrors.join(' | ')}`);
    console.log(`View modernization Grid compat displayer contracts OK: ${JSON.stringify(evidence)}`);
    await context.close();
}

async function runGridFilterMatrixOnly() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const username = process.env.DCAT_ADMIN_USERNAME || 'admin';
    const password = process.env.DCAT_ADMIN_PASSWORD || 'admin';
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    await login(page, `${baseUrl}${adminPrefix}`, username, password);
    const evidence = await verifyModernGridFilterMatrix(page, baseUrl, adminPrefix);
    if (pageErrors.length) fail(`grid-filter-matrix: browser emitted page errors: ${pageErrors.join(' | ')}`);
    console.log(`View modernization Grid filter matrix contracts OK: ${JSON.stringify(evidence)}`);
    await context.close();
}

async function runGridInteractionsOnly() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const username = process.env.DCAT_ADMIN_USERNAME || 'admin';
    const password = process.env.DCAT_ADMIN_PASSWORD || 'admin';
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await login(page, `${baseUrl}${adminPrefix}`, username, password);
    const evidence = await verifyModernGridInteractions(page, baseUrl, adminPrefix);
    console.log(`View modernization Grid interaction contracts OK: ${JSON.stringify(evidence)}`);
    await context.close();
}

async function runGridReadOnly() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const username = process.env.DCAT_ADMIN_USERNAME || 'admin';
    const password = process.env.DCAT_ADMIN_PASSWORD || 'admin';
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await login(page, `${baseUrl}${adminPrefix}`, username, password);
    const evidence = await verifyModernGridRead(page, baseUrl, adminPrefix);
    console.log(`View modernization Grid read contracts OK: ${JSON.stringify(evidence)}`);
    await context.close();
}

async function runShellOnly() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const username = process.env.DCAT_ADMIN_USERNAME || 'admin';
    const password = process.env.DCAT_ADMIN_PASSWORD || 'admin';
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    console.log('[shell] login');
    await login(page, `${baseUrl}${adminPrefix}`, username, password);
    console.log('[shell] pjax');
    const pjax = await verifyPjax(page, baseUrl, adminPrefix);
    console.log('[shell] stable-anchors');
    const stableAnchors = await verifyModernStableAnchors(page, baseUrl, adminPrefix);
    console.log('[shell] bootstrap-free-shell');
    const bootstrapFreeShell = await verifyBootstrapFreeShell(page, baseUrl, adminPrefix);
    const evidence = { pjax, stableAnchors, bootstrapFreeShell };
    console.log(`View modernization shell contracts OK: ${Object.keys(evidence.bootstrapFreeShell).length} shell profiles.`);
    await context.close();
}

async function runSelfTest() {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.setContent('<!doctype html><html lang="en"><head><title>Browser self-test</title></head><body><main><h1>Browser self-test</h1><button type="button">OK</button></main></body></html>');
    await installAxe(page);
    const result = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } }));
    if (result.violations.some((item) => ['serious', 'critical'].includes(item.impact))) {
        fail('Browser/axe self-test produced serious accessibility violations.');
    }
    console.log(`View modernization browser harness self-test OK: ${await browser.version()}.`);
    await page.close();
}

async function runContracts() {
    const baseUrl = trimSlash(process.env.DCAT_BROWSER_BASE_URL || 'http://127.0.0.1:8300');
    const adminPrefix = normalizePrefix(process.env.DCAT_ADMIN_PREFIX || '/admin');
    const evidenceDir = path.resolve(process.env.DCAT_BROWSER_EVIDENCE_DIR || path.join(root, 'artifacts/view-modernization-browser'));
    const username = process.env.DCAT_ADMIN_USERNAME || 'admin';
    const password = process.env.DCAT_ADMIN_PASSWORD || 'admin';
    const takeScreenshots = process.env.DCAT_BROWSER_SCREENSHOTS !== '0';
    fs.mkdirSync(evidenceDir, { recursive: true });
    if (takeScreenshots) fs.mkdirSync(path.join(evidenceDir, 'screenshots'), { recursive: true });

    const context = await browser.newContext({
        viewport: { width: 1366, height: 768 },
        reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));

    await login(page, `${baseUrl}${adminPrefix}`, username, password);

    const evidence = {
        schemaVersion: 1,
        capturedAt: new Date().toISOString(),
        baseUrl,
        adminPrefix,
        browserVersion: await browser.version(),
        viewports: [],
        network: {},
        modernFamilies: {},
        gridRead: {},
        gridInteractions: {},
        gridFilterMatrix: {},
        gridCompatDisplayers: {},
        gridActionMatrix: {},
        formBasic: {},
        formLayout: {},
        formAdvancedNative: {},
        formAdvancedVendor: {},
        formAdvancedCompat: {},
        formAdvancedOptional: {},
        b8Surfaces: {},
        b8Login: {},
        b8ServerFallbacks: {},
        accessibility: {},
        accessibilityOrder: {},
        reflow200: {},
        pageErrors,
    };

    for (const viewport of contract.viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        for (const profile of contract.domProfiles) {
            const url = adminUrl(baseUrl, adminPrefix, profile.fixtureRoute);
            await page.goto(url, { waitUntil: 'networkidle' });
            await assertSelectors(page, profile.requiredSelectors, profile.forbiddenSelectors, `${profile.id} ${viewport.width}x${viewport.height}`);
            const geometry = await measureGeometry(page, profile.requiredSelectors);
            evidence.viewports.push({ profile: profile.id, viewport, geometry });

            if (takeScreenshots) {
                await page.screenshot({
                    path: path.join(evidenceDir, 'screenshots', `${profile.id}-${viewport.width}x${viewport.height}.png`),
                    fullPage: true,
                });
            }
        }
    }

    await page.setViewportSize({ width: 1366, height: 768 });
    await verifyGridAndForm(page, baseUrl, adminPrefix);
    evidence.network = await verifyPjax(page, baseUrl, adminPrefix);
    evidence.stableAnchors = await verifyModernStableAnchors(page, baseUrl, adminPrefix);
    evidence.bootstrapFreeShell = await verifyBootstrapFreeShell(page, baseUrl, adminPrefix);
    evidence.modernFamilies = await verifyModernFamilies(page, baseUrl, adminPrefix, evidenceDir, takeScreenshots);
    evidence.gridRead = await verifyModernGridRead(page, baseUrl, adminPrefix);
    evidence.gridInteractions = await verifyModernGridInteractions(page, baseUrl, adminPrefix);
    evidence.gridFilterMatrix = await verifyModernGridFilterMatrix(page, baseUrl, adminPrefix);
    evidence.gridCompatDisplayers = await verifyModernGridCompatDisplayers(page, baseUrl, adminPrefix);
    evidence.gridActionMatrix = await verifyModernGridActionMatrix(page, baseUrl, adminPrefix);
    evidence.formBasic = await verifyModernFormBasic(page, baseUrl, adminPrefix);
    evidence.formLayout = await verifyModernFormLayout(page, baseUrl, adminPrefix);
    evidence.formAdvancedNative = await verifyModernFormAdvancedNative(page, baseUrl, adminPrefix);
    evidence.formAdvancedVendor = await verifyModernFormAdvancedVendor(page, baseUrl, adminPrefix);
    evidence.formAdvancedCompat = await verifyModernFormAdvancedCompat(page, baseUrl, adminPrefix);
    evidence.formAdvancedOptional = await verifyModernFormAdvancedOptional(page, baseUrl, adminPrefix);
    evidence.nativeRuntime = await verifyNativeRuntime(page, baseUrl, adminPrefix);
    evidence.accessibility = await verifyModernAccessibility(page, baseUrl, adminPrefix);
    evidence.accessibilityOrder = await verifyAutomatedAccessibilityOrder(page, baseUrl, adminPrefix);
    evidence.reflow200 = await verifyAutomatedReflow200(page, baseUrl, adminPrefix);
    evidence.keyboard = await verifyKeyboardNavigation(page, baseUrl, adminPrefix);
    evidence.reducedMotion = await verifyReducedMotion(page, baseUrl, adminPrefix);
    evidence.rendererLockdown = await verifyRendererLockdown(page, baseUrl, adminPrefix);
    evidence.b8Surfaces = await verifyModernB8Surfaces(page, baseUrl, adminPrefix);
    evidence.ui = await verifyModernUi(page, baseUrl, adminPrefix, evidenceDir);

    const b8LoginContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const b8LoginPage = await b8LoginContext.newPage();
    const b8LoginErrors = [];
    b8LoginPage.on('pageerror', (error) => b8LoginErrors.push(error?.stack || String(error)));
    evidence.b8Login = await verifyModernB8Login(b8LoginPage, baseUrl, adminPrefix, username, password);
    if (b8LoginErrors.length) fail(`B8 aggregate login emitted page errors: ${b8LoginErrors.join(' | ')}`);
    await b8LoginContext.close();

    const b8FallbackContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    evidence.b8ServerFallbacks = await verifyModernB8ServerFallbacks(b8FallbackContext, baseUrl, adminPrefix, username, password);
    await b8FallbackContext.close();

    if (pageErrors.length) {
        fail(`Browser emitted page errors: ${pageErrors.join(' | ')}`);
    }

    fs.writeFileSync(path.join(evidenceDir, 'browser-contracts.json'), `${JSON.stringify(evidence, null, 2)}\n`);
    console.log(`View modernization browser contracts OK: ${evidence.viewports.length} profile/viewport captures, ${Object.keys(evidence.modernFamilies).length} modern page families.`);
    await context.close();
}

async function login(page, adminBaseUrl, username, password) {
    await page.goto(`${adminBaseUrl}/auth/login`, { waitUntil: 'domcontentloaded' });
    const usernameInput = page.locator('input[name="username"]');
    if (await usernameInput.count()) {
        await usernameInput.fill(username);
        await page.locator('input[name="password"]').fill(password);
        const submit = page.locator('button[type="submit"], input[type="submit"]').first();
        await Promise.all([
            page.waitForURL((url) => !url.pathname.endsWith('/auth/login'), { timeout: 15_000 }),
            submit.click(),
        ]);
    }
    if (page.url().includes('/auth/login')) fail('Browser harness could not authenticate the default admin fixture user.');
}

async function assertSelectors(page, required, forbidden, label) {
    for (const selector of required) {
        const count = await page.locator(selector).count();
        if (count !== 1) fail(`${label}: expected exactly one ${selector}, found ${count}`);
    }
    for (const selector of forbidden) {
        const count = await page.locator(selector).count();
        if (count !== 0) fail(`${label}: expected ${selector} to be absent, found ${count}`);
    }
}

async function measureGeometry(page, selectors) {
    return page.evaluate((requiredSelectors) => {
        const anchors = {};
        for (const selector of requiredSelectors) {
            anchors[selector] = Array.from(document.querySelectorAll(selector)).map((node) => {
                const rect = node.getBoundingClientRect();
                const style = getComputedStyle(node);
                return {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    display: style.display,
                    position: style.position,
                };
            });
        }
        return {
            viewport: { width: innerWidth, height: innerHeight },
            document: {
                clientWidth: document.documentElement.clientWidth,
                clientHeight: document.documentElement.clientHeight,
                scrollWidth: document.documentElement.scrollWidth,
                scrollHeight: document.documentElement.scrollHeight,
            },
            anchors,
        };
    }, selectors);
}

async function verifyGridAndForm(page, baseUrl, adminPrefix) {
    await page.goto(adminUrl(baseUrl, adminPrefix, contract.runtimeCapture.standaloneFixtureRoutes.grid), { waitUntil: 'networkidle' });
    await assertSelectors(page, ['form.grid-filter-form[pjax-container]', 'form.quick-search-form[pjax-container]'], [], 'Grid contract');

    await page.goto(adminUrl(baseUrl, adminPrefix, contract.runtimeCapture.standaloneFixtureRoutes.form), { waitUntil: 'networkidle' });
    const form = page.locator('form[data-toggle="validator"]');
    if (await form.count() !== 1) fail('Form contract: validator form must be unique.');
    const enctype = await form.getAttribute('enctype');
    if (enctype !== 'multipart/form-data') fail(`Form contract: expected multipart/form-data, got ${enctype}`);
    for (const name of ['username', 'email', 'password', 'password_confirmation', 'profile[first_name]', 'profile[last_name]', 'profile[postcode]']) {
        if (await page.locator(`input[name="${cssAttributeValue(name)}"]`).count() !== 1) fail(`Form contract missing input name ${name}`);
    }
}

async function verifyPjax(page, baseUrl, adminPrefix) {
    await page.goto(adminUrl(baseUrl, adminPrefix, contract.runtimeCapture.standaloneFixtureRoutes.grid), { waitUntil: 'networkidle' });
    await page.locator('.content-body#app').evaluate((element) => element.setAttribute('data-dcat-pjax-probe', 'before'));
    const requestPromise = page.waitForRequest((request) => request.headers()['x-pjax'] === 'true', { timeout: 10_000 });
    const responsePromise = page.waitForResponse((response) => response.request().headers()['x-pjax'] === 'true', { timeout: 10_000 });
    await page.evaluate(() => {
        window.$.pjax({ url: window.location.href, container: window.Dcat.config.pjax_container_selector });
    });
    const request = await requestPromise;
    const response = await responsePromise;
    const responseText = await response.text();
    const responseState = {
        status: response.status(),
        url: response.url(),
        hasAppRoot: /class=["']content-body["'][^>]*id=["']app["']|id=["']app["'][^>]*class=["']content-body["']/.test(responseText),
        bytes: responseText.length,
    };
    if (!responseState.hasAppRoot) fail(`PJAX response omitted #app root: ${JSON.stringify(responseState)}`);
    await page.waitForFunction(() => !document.querySelector('[data-dcat-pjax-probe="before"]'), null, { timeout: 10_000 });
    await page.waitForSelector('.content-body#app', { state: 'attached', timeout: 10_000 });
    const headers = request.headers();
    if (headers['x-pjax'] !== 'true') fail('PJAX request did not preserve X-PJAX=true.');
    if (headers['x-pjax-container'] !== '#pjax-container') fail(`PJAX request container changed: ${headers['x-pjax-container']}`);
    const pjaxState = await page.evaluate(() => ({
        url: window.location.href,
        appRoots: document.querySelectorAll('.content-body#app').length,
        appIds: document.querySelectorAll('#app').length,
        pjaxContainers: document.querySelectorAll('#pjax-container').length,
        contentWrappers: document.querySelectorAll('.content-wrapper').length,
        title: document.title,
        text: (document.body?.innerText || '').slice(0, 180),
    }));
    if (pjaxState.appRoots !== 1) fail(`PJAX fragment produced duplicate/missing #app roots: ${JSON.stringify(pjaxState)}`);
    return { xPjax: headers['x-pjax'], xPjaxContainer: headers['x-pjax-container'] };
}

async function verifyModernStableAnchors(page, baseUrl, adminPrefix) {
    const routes = contract.runtimeCapture.standaloneFixtureRoutes;
    await page.goto(adminUrl(baseUrl, adminPrefix, routes.modernVertical), { waitUntil: 'networkidle' });
    await page.waitForSelector('body.dcat-modern-active');
    const vertical = await page.evaluate(() => ({
        menuContentParent: document.querySelector('.main-menu-content')?.parentElement?.classList.contains('main-menu') === true,
        sidebarParent: document.querySelector('.main-sidebar')?.parentElement?.classList.contains('main-menu-content') === true,
        navbarParent: document.querySelector('nav.header-navbar')?.parentElement?.classList.contains('wrapper') === true,
        footerParent: document.querySelector('footer.main-footer')?.parentElement === document.body,
        navbarReactHost: Boolean(document.querySelector('nav.header-navbar > .dcat-modern-react-view')),
        footerReactHost: Boolean(document.querySelector('footer.main-footer > .dcat-modern-react-view')),
    }));
    Object.entries(vertical).forEach(([key, value]) => {
        const expected = !key.endsWith('ReactHost');
        if (value !== expected) fail(`Modern vertical stable anchor assertion failed: ${key}=${value}`);
    });

    await page.goto(adminUrl(baseUrl, adminPrefix, routes.modernHorizontal), { waitUntil: 'networkidle' });
    const horizontal = await page.evaluate(() => ({
        horizontalParent: document.querySelector('.header-navbar.navbar-horizontal')?.parentElement?.classList.contains('wrapper') === true,
        menuContentParent: document.querySelector('.main-menu-content')?.parentElement?.classList.contains('navbar-horizontal') === true,
        horizontalSidebarParent: document.querySelector('.main-horizontal-sidebar')?.parentElement?.classList.contains('main-menu-content') === true,
    }));
    Object.entries(horizontal).forEach(([key, value]) => { if (!value) fail(`Modern horizontal stable anchor assertion failed: ${key}`); });

    await page.goto(adminUrl(baseUrl, adminPrefix, routes.modernFullPage), { waitUntil: 'networkidle' });
    await page.waitForSelector('body[data-dcat-react-component="layout.full-page"]');
    const fullPage = await page.evaluate(() => ({
        appContentParent: document.querySelector('.app-content.content')?.parentElement === document.body,
        wrapperParent: document.querySelector('.app-content.content > .wrapper') !== null,
        bodyReactHost: Boolean(document.querySelector('body > .dcat-modern-react-view')),
    }));
    if (!fullPage.appContentParent || !fullPage.wrapperParent || fullPage.bodyReactHost) fail('Modern full-page stable anchor relationship changed.');
    return { vertical, horizontal, fullPage };
}

async function verifyBootstrapFreeShell(page, baseUrl, adminPrefix) {
    const routes = contract.runtimeCapture.standaloneFixtureRoutes;
    const shellCases = {
        vertical: routes.modernVertical,
        horizontal: routes.modernHorizontal,
        collapsed: routes.modernCollapsed,
        floatingNavbar: routes.modernFloatingNavbar,
        hiddenNavbar: routes.modernHiddenNavbar,
        fullPage: routes.modernFullPage,
    };
    const evidence = {};

    const inspectResources = async (label) => {
        const resources = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name));
        const forbidden = resources.filter((resource) => {
            let pathname = resource.toLowerCase();
            try { pathname = new URL(resource, location.href).pathname.toLowerCase(); } catch (error) {}
            return /adminlte(?:\.min)?\.(?:css|js)$/.test(pathname)
                || /bootstrap(?:\.bundle)?(?:\.min)?\.(?:css|js)$/.test(pathname)
                || /\/bootstrap\/.*\.(?:css|js)$/.test(pathname)
                || /vendors\.min\.(?:css|js)$/.test(pathname);
        });
        if (forbidden.length) fail(`${label}: Bootstrap/AdminLTE shell network gate failed: ${forbidden.join(', ')}`);
        return { requests: resources.length, forbidden };
    };

    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(adminUrl(baseUrl, adminPrefix, routes.modernVertical), { waitUntil: 'networkidle' });
    await page.waitForSelector('body.dcat-modern-active');
    const expanded = await page.evaluate(() => {
        const sidebar = document.querySelector('.main-sidebar')?.getBoundingClientRect();
        const app = document.querySelector('.app-content.content')?.getBoundingClientRect();
        const footer = document.querySelector('.main-footer')?.getBoundingClientRect();
        return {
            sidebarWidth: sidebar?.width ?? 0,
            appX: app?.x ?? 0,
            footerX: footer?.x ?? 0,
        };
    });
    if (Math.abs(expanded.sidebarWidth - 260) > 0.5) fail(`vertical: expanded sidebar width changed: ${expanded.sidebarWidth}`);
    if (expanded.appX < 259.5 || expanded.footerX < 259.5) fail(`vertical: shell content did not clear 260px sidebar: ${JSON.stringify(expanded)}`);
    evidence.vertical = { ...expanded, ...(await inspectResources('vertical')) };

    const toggle = page.locator('[data-widget="pushmenu"], .menu-toggle').first();
    if (await toggle.count() !== 1) fail('vertical: native sidebar toggle is missing or duplicated.');
    await toggle.click();
    await page.waitForFunction(() => document.body.classList.contains('sidebar-collapse'));
    const collapsedByToggle = await page.evaluate(() => ({
        sidebarWidth: document.querySelector('.main-sidebar')?.getBoundingClientRect().width ?? 0,
        expectedWidth: parseFloat(getComputedStyle(document.documentElement).fontSize) * 5.4,
        rootFontSize: getComputedStyle(document.documentElement).fontSize,
        ariaExpanded: document.querySelector('[data-widget="pushmenu"], .menu-toggle')?.getAttribute('aria-expanded'),
    }));
    if (Math.abs(collapsedByToggle.sidebarWidth - collapsedByToggle.expectedWidth) > 0.5 || collapsedByToggle.ariaExpanded !== 'false') {
        fail(`vertical: native collapse toggle failed: ${JSON.stringify(collapsedByToggle)}`);
    }

    /*
     * Epic 002 / S3：折叠态的品牌与菜单标签行为必须显式断言。
     * 只检查几何（260px / 5.4rem）会漏掉「折叠后品牌消失」这类回归：S3 批次 1 曾在 Blade 上给
     * `logo-mini` 加了 `hidden`，几何与全量门禁都通过，但折叠态的品牌实际被隐藏了。
     */
    const collapsedBrand = await page.evaluate(() => {
        const mini = document.querySelector('.main-sidebar .navbar-header .logo-mini');
        const full = document.querySelector('.main-sidebar .navbar-header .logo-lg');
        const label = document.querySelector('.dcat-shell-menu .nav-item > a > span, .dcat-shell-menu .nav-item > summary > span');
        return {
            mini: mini ? getComputedStyle(mini).display : 'missing',
            full: full ? getComputedStyle(full).display : 'missing',
            menuLabel: label ? getComputedStyle(label).display : 'missing',
        };
    });
    if (collapsedBrand.full !== 'none' || collapsedBrand.mini === 'none' || collapsedBrand.mini === 'missing' || collapsedBrand.menuLabel !== 'none') {
        fail(`collapsed: brand or menu-label state is wrong: ${JSON.stringify(collapsedBrand)}`);
    }
    evidence.collapsedBrand = collapsedBrand;

    const inspectPreview = () => page.evaluate(() => {
        const geometry = (selector) => {
            const element = document.querySelector(selector);
            const rect = element.getBoundingClientRect();
            return { x: rect.x, width: rect.width };
        };
        const sidebar = document.querySelector('.main-sidebar');
        const fullLogo = sidebar.querySelector('.logo-lg');
        const miniLogo = sidebar.querySelector('.logo-mini');
        return {
            collapsed: document.body.classList.contains('sidebar-collapse'),
            previewed: document.body.classList.contains('sidebar-hover'),
            sidebar: geometry('.main-sidebar'),
            slot: geometry('.main-menu'),
            content: geometry('.app-content.content'),
            navbar: geometry('nav.header-navbar'),
            footer: geometry('.main-footer'),
            fullLogo: getComputedStyle(fullLogo).display,
            miniLogo: getComputedStyle(miniLogo).display,
            aboveNavbar: sidebar.contains(document.elementFromPoint(240, 24)),
            ariaExpanded: document.querySelector('[data-widget="pushmenu"], .menu-toggle').getAttribute('aria-expanded'),
        };
    });
    const beforePreview = await inspectPreview();
    await page.locator('.main-sidebar').hover({ position: { x: 40, y: 90 } });
    const preview = await inspectPreview();
    if (!preview.collapsed || !preview.previewed || Math.abs(preview.sidebar.width - 260) > 0.5
        || !preview.aboveNavbar || preview.fullLogo === 'none' || preview.miniLogo !== 'none' || preview.ariaExpanded !== 'false') {
        fail(`collapsed: hover preview failed: ${JSON.stringify(preview)}`);
    }
    for (const region of ['slot', 'content', 'navbar', 'footer']) {
        if (Math.abs(preview[region].x - beforePreview[region].x) > 0.5 || Math.abs(preview[region].width - beforePreview[region].width) > 0.5) {
            fail(`collapsed: hover shifted ${region}: ${JSON.stringify({ beforePreview, preview })}`);
        }
    }
    const group = page.locator('.dcat-shell-menu summary').first();
    if (await group.count()) {
        await group.click();
        const afterGroup = await inspectPreview();
        if (!afterGroup.collapsed || !afterGroup.previewed) fail(`collapsed: group click pinned or dismissed the sidebar: ${JSON.stringify(afterGroup)}`);
    }
    // 这里只验证选择后的侧栏状态；导航自身由独立 PJAX 用例覆盖。
    await page.locator('.dcat-shell-menu a').first().evaluate((link) => link.addEventListener('click', (event) => event.preventDefault(), { once: true }));
    await page.locator('.dcat-shell-menu a').first().click();
    const afterSelection = await inspectPreview();
    if (!afterSelection.collapsed || afterSelection.previewed || Math.abs(afterSelection.sidebar.width - beforePreview.sidebar.width) > 0.5) {
        fail(`collapsed: menu selection did not restore the icon rail: ${JSON.stringify(afterSelection)}`);
    }
    await page.mouse.move(500, 100);
    await page.locator('.main-sidebar').hover({ position: { x: 40, y: 90 } });
    await page.mouse.move(500, 100);
    const afterExit = await inspectPreview();
    if (!afterExit.collapsed || afterExit.previewed || Math.abs(afterExit.sidebar.width - beforePreview.sidebar.width) > 0.5) {
        fail(`collapsed: pointer exit did not restore the icon rail: ${JSON.stringify(afterExit)}`);
    }
    evidence.collapsedPreview = { beforePreview, preview, afterSelection, afterExit };

    await toggle.click();

    const expandedBrand = await page.evaluate(() => {
        const mini = document.querySelector('.main-sidebar .navbar-header .logo-mini');
        const full = document.querySelector('.main-sidebar .navbar-header .logo-lg');
        const label = document.querySelector('.dcat-shell-menu .nav-item > a > span, .dcat-shell-menu .nav-item > summary > span');
        return {
            mini: mini ? getComputedStyle(mini).display : 'missing',
            full: full ? getComputedStyle(full).display : 'missing',
            menuLabel: label ? getComputedStyle(label).display : 'missing',
        };
    });
    if (expandedBrand.mini !== 'none' || expandedBrand.full === 'none' || expandedBrand.menuLabel === 'none') {
        fail(`vertical: restored brand or menu-label state is wrong: ${JSON.stringify(expandedBrand)}`);
    }
    evidence.expandedBrand = expandedBrand;

    await page.goto(adminUrl(baseUrl, adminPrefix, routes.modernCollapsed), { waitUntil: 'networkidle' });
    const collapsed = await page.evaluate(() => ({
        collapsed: document.body.classList.contains('sidebar-collapse'),
        sidebarWidth: document.querySelector('.main-sidebar')?.getBoundingClientRect().width ?? 0,
        expectedWidth: parseFloat(getComputedStyle(document.documentElement).fontSize) * 5.4,
        rootFontSize: getComputedStyle(document.documentElement).fontSize,
    }));
    if (!collapsed.collapsed || Math.abs(collapsed.sidebarWidth - collapsed.expectedWidth) > 0.5) fail(`collapsed: profile geometry failed: ${JSON.stringify(collapsed)}`);
    evidence.collapsed = { ...collapsed, ...(await inspectResources('collapsed')) };

    await page.goto(adminUrl(baseUrl, adminPrefix, routes.modernFloatingNavbar), { waitUntil: 'networkidle' });
    const floatingNavbar = await page.evaluate(() => {
        const navbar = document.querySelector('nav.header-navbar');
        const style = navbar ? getComputedStyle(navbar) : null;
        return {
            present: Boolean(navbar?.classList.contains('floating-nav')),
            marginLeft: style?.marginLeft || '',
            borderRadius: style?.borderRadius || '',
        };
    });
    if (!floatingNavbar.present || parseFloat(floatingNavbar.marginLeft) <= 0) fail(`floating navbar profile failed: ${JSON.stringify(floatingNavbar)}`);
    evidence.floatingNavbar = { ...floatingNavbar, ...(await inspectResources('floating navbar')) };

    await page.goto(adminUrl(baseUrl, adminPrefix, routes.modernHiddenNavbar), { waitUntil: 'networkidle' });
    const hiddenNavbar = await page.evaluate(() => {
        const navbar = document.querySelector('nav.header-navbar');
        return { display: navbar ? getComputedStyle(navbar).display : 'missing' };
    });
    if (hiddenNavbar.display !== 'none') fail(`hidden navbar profile failed: ${JSON.stringify(hiddenNavbar)}`);
    evidence.hiddenNavbar = { ...hiddenNavbar, ...(await inspectResources('hidden navbar')) };

    await page.goto(adminUrl(baseUrl, adminPrefix, routes.modernHorizontal), { waitUntil: 'networkidle' });
    const horizontal = await page.evaluate(() => ({
        horizontalSidebarWidth: document.querySelector('.main-horizontal-sidebar')?.getBoundingClientRect().width ?? 0,
        viewportWidth: document.documentElement.clientWidth,
    }));
    if (horizontal.horizontalSidebarWidth < horizontal.viewportWidth - 1) fail(`horizontal: navigation does not span the viewport: ${JSON.stringify(horizontal)}`);
    evidence.horizontal = { ...horizontal, ...(await inspectResources('horizontal')) };

    await page.goto(adminUrl(baseUrl, adminPrefix, routes.modernFullPage), { waitUntil: 'networkidle' });
    const fullPage = await page.evaluate(() => ({
        sidebar: Boolean(document.querySelector('.main-sidebar, .main-horizontal-sidebar')),
        navbar: Boolean(document.querySelector('.header-navbar')),
        footer: Boolean(document.querySelector('.main-footer')),
    }));
    if (fullPage.sidebar || fullPage.navbar || fullPage.footer) fail(`full-page: shell chrome leaked into full-page layout: ${JSON.stringify(fullPage)}`);
    evidence.fullPage = { ...fullPage, ...(await inspectResources('full-page')) };

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(adminUrl(baseUrl, adminPrefix, routes.modernVertical), { waitUntil: 'networkidle' });
    const mobileToggle = page.locator('[data-widget="pushmenu"], .menu-toggle').first();
    await mobileToggle.click();
    await page.waitForFunction(() => document.body.classList.contains('sidebar-open'));
    const mobileOpen = await page.evaluate(() => {
        const menu = document.querySelector('.main-menu')?.getBoundingClientRect();
        return { open: document.body.classList.contains('sidebar-open'), x: menu?.x ?? -1, width: menu?.width ?? 0 };
    });
    if (!mobileOpen.open || Math.abs(mobileOpen.x) > 0.5 || Math.abs(mobileOpen.width - 260) > 0.5) fail(`mobile drawer open geometry failed: ${JSON.stringify(mobileOpen)}`);
    await page.keyboard.press('Escape');
    if (await page.evaluate(() => document.body.classList.contains('sidebar-open'))) fail('mobile drawer did not close on Escape.');
    evidence.mobile = { ...mobileOpen, ...(await inspectResources('mobile vertical')) };

    await page.setViewportSize({ width: 1366, height: 768 });
    return evidence;
}

async function verifyModernFamilies(page, baseUrl, adminPrefix, evidenceDir, takeScreenshots) {
    const routes = contract.runtimeCapture.standaloneFixtureRoutes;
    const cases = {
        grid: { route: routes.modernGrid, marker: '[data-dcat-react-component="grid.read"]', capability: 'grid.read', structural: true },
        form: { route: routes.modernForm, marker: 'form[data-dcat-react-component="form.basic"]', capability: 'form.basic', structural: true },
        show: { route: routes.modernShow, marker: '[data-dcat-react-component="show.detail"]', capability: 'show.detail', structural: true },
        tree: { route: routes.modernTree, marker: '[data-dcat-react-component="tree.page"]', capability: 'tree.page', structural: true },
        widget: { route: routes.modernWidget, marker: '[data-dcat-react-component="widget.surface"]', capability: 'widget.surface', structural: true },
        system: { route: routes.modernSystem, marker: '[data-dcat-react-component="system.page"]', capability: 'system.page', structural: true },
    };
    const result = {};
    for (const [family, testCase] of Object.entries(cases)) {
        await page.goto(adminUrl(baseUrl, adminPrefix, testCase.route), { waitUntil: 'networkidle' });
        const marker = page.locator(testCase.marker).first();
        await marker.waitFor({ state: 'attached' });
        await page.waitForFunction(({ selector, capability }) => {
            const element = document.querySelector(selector);
            return element?.getAttribute('data-dcat-modern-capability')?.split(/\s+/).includes(capability);
        }, { selector: testCase.marker, capability: testCase.capability });
        if (testCase.structural && await marker.locator('.dcat-modern-react-view').count() !== 1) {
            fail(`${family}: structural modern boundary did not commit exactly one React view.`);
        }
        if (!testCase.structural && await marker.locator(':scope > .dcat-modern-react-view').count() !== 0) {
            fail(`${family}: stable in-place boundary unexpectedly created a structural React host.`);
        }
        result[family] = {
            capability: testCase.capability,
            mounted: await marker.getAttribute('data-dcat-modern-capability'),
            reactViewCount: await marker.locator('.dcat-modern-react-view').count(),
        };
        if (['show', 'tree', 'widget'].includes(family)) {
            result[family].viewports = [];
            for (const viewport of contract.viewports) {
                await page.setViewportSize({ width: viewport.width, height: viewport.height });
                const geometry = await page.evaluate(({ family, width }) => {
                    const selectors = {
                        show: '.dcat-modern-show-actions [data-show-action]',
                        tree: '.dcat-modern-tree-toolbar button, .dcat-modern-tree-toolbar a, .dcat-modern-tree-node-row button:not(:disabled), .dcat-modern-tree-node-row a',
                        widget: '.dcat-modern-widget__tool',
                    };
                    const targets = Array.from(document.querySelectorAll(selectors[family] || ''));
                    const minTarget = width <= 991 ? 44 : 34;
                    const undersized = targets.filter((target) => {
                        const rect = target.getBoundingClientRect();
                        return rect.width < minTarget || rect.height < minTarget;
                    }).map((target) => ({
                        label: target.getAttribute('aria-label') || target.textContent?.trim(),
                        width: Math.round(target.getBoundingClientRect().width),
                        height: Math.round(target.getBoundingClientRect().height),
                    }));
                    const dashboard = document.querySelector('.dashboard-title[data-dcat-react-component="widget.surface"]');
                    const dashboardTitle = dashboard?.querySelector('.dcat-modern-dashboard__title');
                    return {
                        pageOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
                        contentOverflow: Math.max(0, (document.querySelector('.content-wrapper')?.scrollWidth || 0) - (document.querySelector('.content-wrapper')?.clientWidth || 0)),
                        targets: targets.length,
                        undersized,
                        dashboardTitleSize: dashboardTitle ? getComputedStyle(dashboardTitle).fontSize : null,
                        dashboardLegacyBackground: dashboard?.classList.contains('bg-primary') || false,
                    };
                }, { family, width: viewport.width });
                if (geometry.pageOverflow > 1 || geometry.contentOverflow > 1 || geometry.undersized.length
                    || (family === 'widget' && (geometry.dashboardTitleSize !== '20px' || geometry.dashboardLegacyBackground))) {
                    fail(`${family}: ${viewport.width}x${viewport.height} visual contract failed: ${JSON.stringify(geometry)}`);
                }
                result[family].viewports.push({ viewport, geometry });
                if (takeScreenshots) {
                    await page.screenshot({ path: path.join(evidenceDir, 'screenshots', `modern-${family}-${viewport.width}x${viewport.height}.png`), fullPage: true });
                }
            }
            await page.setViewportSize({ width: 1366, height: 768 });
        } else if (takeScreenshots) {
            await page.screenshot({ path: path.join(evidenceDir, 'screenshots', `modern-${family}-1366x768.png`), fullPage: true });
        }
    }
    return result;
}

async function verifyModernGridRead(page, baseUrl, adminPrefix) {
    const route = '/tests/view-baseline/modern-grid-displayers';
    const openFixture = async (query = '') => {
        const response = await page.goto(adminUrl(baseUrl, adminPrefix, `${route}${query}`), { waitUntil: 'networkidle' });
        const fixtureState = await page.evaluate(() => ({
            ownerCount: document.querySelectorAll('[data-dcat-react-component="grid.read"]').length,
            reactViewCount: document.querySelectorAll('.dcat-modern-react-view').length,
            bodyText: (document.body?.innerText || '').slice(0, 600),
            title: document.title,
        }));
        if (response?.status() !== 200 || fixtureState.ownerCount !== 1) {
            fail(`grid-read fixture failed before React mount: status=${response?.status()} ${JSON.stringify(fixtureState)}`);
        }
        await page.waitForSelector('[data-dcat-modern-grid-renderer="react-payload"]', { state: 'attached', timeout: 15_000 });
    };

    await page.setViewportSize({ width: 1366, height: 768 });
    await openFixture();
    const state = await page.evaluate(() => {
        const view = document.querySelector('[data-dcat-modern-grid-renderer="react-payload"]');
        const table = view?.querySelector('table');
        const headers = Array.from(table?.querySelectorAll(':scope > thead > tr:last-child > th') || []).map((cell) => cell.textContent?.trim() || '');
        const row = table?.querySelector(':scope > tbody > tr');
        const cells = Array.from(row?.children || []);
        const index = Object.fromEntries(headers.map((label, position) => [label, position]));
        const cell = (label) => cells[index[label]];
        const payloadScript = document.querySelector('script[data-dcat-modern-payload="grid.read"]');
        let serverPayloadKinds = [];
        try {
            const value = JSON.parse(payloadScript?.textContent || '{}');
            serverPayloadKinds = value?.payload?.data?.rows?.[0]?.cells?.map((entry) => entry.kind) || [];
        } catch {}
        return {
            renderer: view?.getAttribute('data-dcat-modern-grid-renderer'),
            headers,
            bodyCellCount: cells.length,
            bodyRowCount: table?.querySelectorAll(':scope > tbody > tr').length ?? 0,
            nativeDisplayerChecks: {
                button: Boolean(cell('Button')?.querySelector('.btn.btn-sm')),
                label: Boolean(cell('Label')?.querySelector('.label')),
                badge: Boolean(cell('Badge')?.querySelector('.badge')),
                link: Boolean(cell('Link')?.querySelector('a[href]')),
                image: Boolean(cell('Image')?.querySelector('img.img-thumbnail')),
                progress: Boolean(cell('Progress')?.querySelector('[role="progressbar"]')),
                download: Boolean(cell('Download')?.querySelector('a[download]')),
                expand: Boolean(cell('Expand')?.querySelector('button.grid-expand[aria-expanded="false"]')),
                table: Boolean(cell('Table')?.querySelector('table tbody tr td')),
            },
            customCompat: Boolean(cell('Custom Compat')?.querySelector('[data-dcat-modern-legacy-island="grid-cell"] [data-m0-grid-custom="1"]')),
            gridCellIslands: view?.querySelectorAll('[data-dcat-modern-legacy-island="grid-cell"]').length ?? 0,
            sortHref: view?.querySelector('a.grid-sort')?.getAttribute('href') || '',
            pagination: Boolean(view?.querySelector('.dcat-modern-grid-pagination ul.pagination')),
            islandCellIndexes: Array.from(view?.querySelectorAll('[data-dcat-modern-legacy-island="grid-cell"]') || []).map((node) => node.parentElement?.cellIndex ?? -1),
            serverPayloadKinds,
        };
    });

    if (state.renderer !== 'react-payload') fail(`grid-read: expected payload-first renderer: ${JSON.stringify(state)}`);
    if (state.bodyCellCount !== 13) fail(`grid-read: expected 13 fixture cells: ${JSON.stringify(state)}`);
    for (const [name, passed] of Object.entries(state.nativeDisplayerChecks)) {
        if (!passed) fail(`grid-read: native ${name} displayer was not rendered from payload: ${JSON.stringify(state)}`);
    }
    if (!state.customCompat || state.bodyRowCount < 1 || state.gridCellIslands !== state.bodyRowCount) {
        fail(`grid-read: custom displayer must remain exactly one cell-level compat island per row: ${JSON.stringify(state)}`);
    }
    if (!state.pagination || !state.sortHref) fail(`grid-read: native sort/pagination contract is missing: ${JSON.stringify(state)}`);

    const expectedKinds = ['text', 'text', 'button', 'labels', 'labels', 'link', 'images', 'progress', 'downloads', 'expand', 'table', 'text', 'compat'];
    if (JSON.stringify(state.serverPayloadKinds) !== JSON.stringify(expectedKinds)) {
        fail(`grid-read: server payload kind classification drifted: ${JSON.stringify(state)}`);
    }

    await openFixture('?contrast=1');
    const labelContrast = await page.evaluate(() => {
        const table = document.querySelector('[data-dcat-modern-grid-renderer="react-payload"] table');
        const headers = Array.from(table?.querySelectorAll('thead tr:last-child th') || []).map((cell) => cell.textContent?.trim());
        const cells = Array.from(table?.querySelector('tbody tr')?.children || []);
        const luminance = (color) => {
            const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number) || [];
            if (channels.length !== 3) return NaN;
            const [red, green, blue] = channels.map((value) => {
                const channel = value / 255;
                return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
        };
        return ['Variable Label', 'Gray Label', 'Alpha Label'].map((name) => {
            const label = cells[headers.indexOf(name)]?.querySelector('.dcat-modern-grid-label');
            const style = label ? getComputedStyle(label) : null;
            const background = style?.backgroundColor || '';
            const foreground = style?.color || '';
            const components = background.match(/[\d.]+/g)?.map(Number) || [];
            const alpha = components[3] ?? 1;
            const composite = `rgb(${components.slice(0, 3).map((value) => Math.round(value * alpha + 255 * (1 - alpha))).join(',')})`;
            const values = [luminance(composite), luminance(foreground)].sort((a, b) => b - a);
            return { name, background, foreground, contrast: (values[0] + 0.05) / (values[1] + 0.05) };
        });
    });
    if (labelContrast.some((label) => !Number.isFinite(label.contrast) || label.contrast < 4.5)
        || labelContrast[0].background !== 'rgb(127, 127, 127)') {
        fail(`grid-read: custom label contrast failed: ${JSON.stringify(labelContrast)}`);
    }
    const variableLabel = page.locator('[data-dcat-modern-grid-renderer="react-payload"] tbody tr:first-child td').filter({ has: page.locator('.dcat-modern-grid-label') }).nth(2).locator('.dcat-modern-grid-label');
    await page.evaluate(() => document.querySelector('.dcat-modern-grid-view').style.setProperty('--dcat-modern-test-label-bg', '#111827'));
    await page.waitForFunction(() => {
        const labels = Array.from(document.querySelectorAll('[data-dcat-modern-grid-renderer="react-payload"] tbody tr:first-child .dcat-modern-grid-label'));
        const label = labels.find((element) => element.style.backgroundColor.includes('--dcat-modern-test-label-bg'));
        return label && getComputedStyle(label).color === 'rgb(255, 255, 255)';
    });
    await openFixture();

    const expandButton = page.locator('button.grid-expand').first();
    await expandButton.click();
    await page.waitForSelector('tr.dcat-modern-grid-expand-row');
    const expand = {
        expanded: await expandButton.getAttribute('aria-expanded'),
        content: (await page.locator('tr.dcat-modern-grid-expand-row').innerText()).trim(),
    };
    if (expand.expanded !== 'true' || !expand.content) fail(`grid-read: native expand row failed: ${JSON.stringify(expand)}`);
    await expandButton.click();
    if (await page.locator('tr.dcat-modern-grid-expand-row').count()) fail('grid-read: native expand row did not collapse.');

    const sortUrl = new URL(state.sortHref, page.url());
    if (!sortUrl.search.includes('id') || !sortUrl.search.includes('desc')) {
        fail(`grid-read: sort URL did not preserve column/type protocol: ${sortUrl.href}`);
    }
    await page.goto(sortUrl.href, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-dcat-modern-grid-renderer="react-payload"]');
    if (await page.locator('a.grid-sort.active').count() !== 1) fail('grid-read: sorted header did not preserve active state.');

    await openFixture('?empty=1');
    const empty = await page.evaluate(() => ({
        emptyState: document.querySelectorAll('.dcat-modern-grid-empty').length,
        dataRows: document.querySelectorAll('[data-dcat-modern-grid-renderer="react-payload"] tbody tr').length,
    }));
    if (empty.emptyState !== 1 || empty.dataRows !== 1) fail(`grid-read: native empty state failed: ${JSON.stringify(empty)}`);

    await openFixture('?complex=1');
    const complex = await page.evaluate(() => ({
        headerRows: document.querySelectorAll('[data-dcat-modern-grid-renderer="react-payload"] thead tr').length,
        firstHeader: document.querySelector('[data-dcat-modern-grid-renderer="react-payload"] thead tr:first-child th')?.textContent?.trim() || '',
        complexCompat: document.querySelectorAll('[data-dcat-modern-legacy-island="grid-header-cell"]').length,
    }));
    if (complex.headerRows !== 2 || complex.firstHeader !== 'Identity' || complex.complexCompat !== 0) {
        fail(`grid-read: native complex header failed: ${JSON.stringify(complex)}`);
    }

    await openFixture('?fixed=1');
    await page.waitForFunction(() => document.querySelectorAll('.dcat-modern-grid-fixed--left').length > 0 && document.querySelectorAll('.dcat-modern-grid-fixed--right').length > 0);
    const fixed = await page.evaluate(() => ({
        marker: document.querySelector('[data-dcat-modern-grid-renderer="react-payload"] table')?.getAttribute('data-dcat-modern-fixed-columns'),
        left: document.querySelectorAll('.dcat-modern-grid-fixed--left').length,
        right: document.querySelectorAll('.dcat-modern-grid-fixed--right').length,
        legacyClones: document.querySelectorAll('.table-fixed').length,
        leftPosition: getComputedStyle(document.querySelector('.dcat-modern-grid-fixed--left')).position,
        rightPosition: getComputedStyle(document.querySelector('.dcat-modern-grid-fixed--right')).position,
    }));
    if (fixed.marker !== '1' || fixed.left < 2 || fixed.right < 2 || fixed.legacyClones !== 0 || fixed.leftPosition !== 'sticky' || fixed.rightPosition !== 'sticky') {
        fail(`grid-read: native fixed-column layout failed: ${JSON.stringify(fixed)}`);
    }

    await openFixture('?multi=1');
    const multi = await page.evaluate(() => {
        const view = document.querySelector('[data-dcat-modern-grid-renderer="react-payload"]');
        const table = view?.querySelector('table');
        return {
            rowCount: table?.querySelectorAll(':scope > tbody > tr:not(.dcat-modern-grid-expand-row)').length ?? 0,
            page2: view?.querySelector('.pagination a[href*="page=2"]')?.getAttribute('href') || '',
            range: document.querySelector('.dcat-modern-grid-pagination-range')?.textContent?.trim() || '',
        };
    });
    if (multi.rowCount !== 1 || !multi.page2 || !multi.range) fail(`grid-read: native multi-page pagination failed: ${JSON.stringify(multi)}`);

    const viewports = [];
    for (const viewport of contract.viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await openFixture('?fixed=1');
        const geometry = await page.evaluate(() => {
            const wrapper = document.querySelector('.dcat-modern-table-wrap');
            const content = document.querySelector('.content-wrapper');
            const rect = wrapper?.getBoundingClientRect();
            return {
                pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
                contentOverflow: content ? content.scrollWidth - content.clientWidth : 0,
                wrapperRight: rect?.right ?? 0,
                viewportWidth: window.innerWidth,
                wrapperOverflowX: wrapper ? getComputedStyle(wrapper).overflowX : '',
                tableScrollable: wrapper ? wrapper.scrollWidth > wrapper.clientWidth + 1 : false,
            };
        });
        if (geometry.pageOverflow > 1 || geometry.contentOverflow > 1 || geometry.wrapperRight > geometry.viewportWidth + 1) {
            fail(`grid-read: viewport containment failed at ${viewport.width}x${viewport.height}: ${JSON.stringify(geometry)}`);
        }
        if (viewport.width < 768 && geometry.tableScrollable && !['auto', 'scroll'].includes(geometry.wrapperOverflowX)) {
            fail(`grid-read: narrow table overflow is not contained by the table wrapper: ${JSON.stringify(geometry)}`);
        }
        viewports.push({ viewport, geometry });
    }
    await page.setViewportSize({ width: 1366, height: 768 });

    return { base: state, labelContrast, expand, empty, complex, fixed, multi, viewports };
}

async function verifyModernGridInteractions(page, baseUrl, adminPrefix) {
    const route = '/tests/view-baseline/modern-grid-interactions';
    const open = async () => {
        await page.goto(adminUrl(baseUrl, adminPrefix, route), { waitUntil: 'networkidle' });
        await page.waitForSelector('[data-dcat-grid-interactions="native"]', { state: 'attached', timeout: 15_000 });
    };
    const waitForPjax = async (trigger, predicate = () => true) => {
        await page.locator('[data-dcat-grid-interactions="native"]').first().evaluate((element) => element.setAttribute('data-dcat-grid-probe', 'before'));
        const requestPromise = page.waitForRequest((request) => request.headers()['x-pjax'] === 'true' && predicate(request), { timeout: 12_000 });
        const responsePromise = page.waitForResponse((response) => response.request().headers()['x-pjax'] === 'true' && predicate(response.request()), { timeout: 12_000 });
        await trigger();
        const request = await requestPromise;
        await responsePromise;
        await page.waitForFunction(() => !document.querySelector('[data-dcat-grid-probe="before"]'), null, { timeout: 12_000 });
        await page.waitForSelector('[data-dcat-grid-interactions="native"]', { state: 'attached', timeout: 12_000 });
        return request;
    };

    await open();
    const root = page.locator('[data-dcat-grid-interactions="native"]').first();
    const row = root.locator('.grid-row-checkbox').first();
    await row.check();
    const batch = root.locator('[class*="-select-all-btn"].dropdown').first();
    const selection = {
        checked: await row.isChecked(),
        batchDisplay: await batch.evaluate((element) => getComputedStyle(element).display),
        label: (await batch.locator('.selected').innerText()).trim(),
        rowSelected: await row.locator('xpath=ancestor::tr').evaluate((element) => element.classList.contains('dcat-modern-grid-row-selected')),
    };
    if (!selection.checked || selection.batchDisplay === 'none' || !selection.label.includes('1') || !selection.rowSelected) {
        fail(`grid-interactions: row selection state failed: ${JSON.stringify(selection)}`);
    }

    const selectAll = root.locator('input.select-all').first();
    if (await selectAll.count()) {
        await selectAll.check();
        const allSelected = await root.locator('.grid-row-checkbox').evaluateAll((items) => items.filter((item) => !item.disabled).every((item) => item.checked));
        if (!allSelected) fail('grid-interactions: select-all state did not synchronize.');
    }

    const batchToggle = batch.locator('[data-toggle="dropdown"]').first();
    await batchToggle.focus();
    await page.keyboard.press('ArrowDown');
    const dropdown = {
        expanded: await batchToggle.getAttribute('aria-expanded'),
        shown: await batch.locator('.dropdown-menu').evaluate((element) => element.classList.contains('show')),
        focusInside: await page.evaluate(() => Boolean(document.activeElement?.closest('.dropdown-menu'))),
    };
    if (dropdown.expanded !== 'true' || !dropdown.shown || !dropdown.focusInside) {
        fail(`grid-interactions: dropdown keyboard contract failed: ${JSON.stringify(dropdown)}`);
    }
    await page.keyboard.press('Escape');
    if (await batchToggle.getAttribute('aria-expanded') !== 'false') fail('grid-interactions: Escape did not close the dropdown.');

    const filterButton = root.locator('.filter-button-group > button:not([data-toggle="dropdown"])').first();
    await filterButton.click();
    const filter = await page.evaluate(() => ({
        panel: document.querySelectorAll('.dcat-modern-filter-panel--open').length,
        backdrop: document.querySelectorAll('[data-dcat-modern-filter-backdrop="1"]').length,
        hidden: document.querySelector('.dcat-modern-filter-panel')?.getAttribute('aria-hidden'),
        focused: document.activeElement?.tagName || '',
    }));
    if (filter.panel !== 1 || filter.backdrop !== 1 || filter.hidden !== 'false' || !filter.focused) {
        fail(`grid-interactions: filter drawer contract failed: ${JSON.stringify(filter)}`);
    }
    await page.keyboard.press('Escape');
    if (await page.locator('.dcat-modern-filter-panel--open').count()) fail('grid-interactions: Escape did not close the filter drawer.');

    await open();
    const quick = page.locator('.quick-search-input[auto="1"]').first();
    const quickName = await quick.getAttribute('name');
    if (!quickName) fail('grid-interactions: quick-search query name is missing.');
    const quickRequest = await waitForPjax(
        () => quick.fill('admin'),
        (request) => new URL(request.url()).searchParams.get(quickName) === 'admin',
    );

    await open();
    const form = page.locator('.grid-filter-form').first();
    const username = form.locator('input[name="username"]').first();
    let filterRequestUrl = '';
    if (await username.count()) {
        await page.locator('.filter-button-group > button:not([data-toggle="dropdown"])').first().click();
        await username.fill('admin');
        const request = await waitForPjax(
            () => form.evaluate((element) => element.requestSubmit()),
            (candidate) => new URL(candidate.url()).searchParams.get('username') === 'admin',
        );
        filterRequestUrl = request.url();
    }

    await open();
    const refresh = page.locator('[data-action="refresh"]').first();
    const refreshRequest = await waitForPjax(
        () => refresh.click(),
        (request) => new URL(request.url()).pathname.endsWith(route),
    );

    await open();
    const selector = page.locator('.column-selector[data-dcat-column-name]').first();
    let column = { supported: false, name: '', value: '' };
    if (await selector.count()) {
        const name = await selector.getAttribute('data-dcat-column-name') || '';
        const items = selector.locator('.column-select-item');
        const checkedItems = selector.locator('.column-select-item:checked');
        const uncheckedItems = selector.locator('.column-select-item:not(:checked)');
        if (!name || !await items.count()) fail('grid-interactions: column selector metadata is incomplete.');
        const item = await checkedItems.count() > 1 ? checkedItems.first() : uncheckedItems.first();
        if (!await item.count()) fail('grid-interactions: column selector cannot produce a non-empty changed selection.');
        const initiallyChecked = await item.isChecked();
        await selector.locator('[data-toggle="dropdown"]').first().click();
        await page.locator('[data-dcat-grid-interactions="native"]').first().evaluate((element) => element.setAttribute('data-dcat-grid-probe', 'column-before'));
        const requestPromise = page.waitForRequest((candidate) => candidate.headers()['x-pjax'] === 'true' && new URL(candidate.url()).searchParams.has(name), { timeout: 4_000 }).catch(() => null);
        await item.evaluate((element, wasChecked) => {
            element.checked = !wasChecked;
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }, initiallyChecked);
        const request = await requestPromise;
        if (!request) {
            const debug = await selector.evaluate((element) => ({
                state: element.dataset.dcatNativeColumnState || '',
                selected: element.dataset.dcatNativeColumnSelected || '',
                url: element.dataset.dcatNativeColumnUrl || '',
            }));
            fail(`grid-interactions: column selector did not request PJAX: ${JSON.stringify({ name, initiallyChecked, debug })}`);
        }
        await page.waitForFunction(() => !document.querySelector('[data-dcat-grid-probe="column-before"]'), null, { timeout: 8_000 });
        await page.waitForSelector('[data-dcat-grid-interactions="native"]', { state: 'attached', timeout: 8_000 });
        column = { supported: true, name, value: new URL(request.url()).searchParams.get(name) || '' };
    }

    await open();
    const currentRoot = page.locator('[data-dcat-grid-interactions="native"]').first();
    const tableWrap = currentRoot.locator('.dcat-modern-table-wrap').first();
    await tableWrap.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
    const rowActionToggle = currentRoot.locator('.grid-dropdown-actions [data-toggle="dropdown"]').first();
    await rowActionToggle.evaluate((element) => element.click());
    const rowDropdown = {
        expanded: await rowActionToggle.getAttribute('aria-expanded'),
        shown: await rowActionToggle.locator('xpath=ancestor::*[contains(@class,"dropdown")][1]').locator('.dropdown-menu').evaluate((element) => element.classList.contains('show')),
    };
    if (rowDropdown.expanded !== 'true' || !rowDropdown.shown) fail(`grid-interactions: row action dropdown failed: ${JSON.stringify(rowDropdown)}`);
    await page.keyboard.press('Escape');

    await page.evaluate(() => {
        window.__dcatProbeConfirmed = false;
        window.Dcat.confirm('Confirm probe', 'No write is performed.', () => { window.__dcatProbeConfirmed = true; });
    });
    await page.waitForSelector('dialog.dcat-modern-confirm-dialog[open]');
    await page.locator('dialog.dcat-modern-confirm-dialog button[value="confirm"]').click();
    await page.waitForFunction(() => window.__dcatProbeConfirmed === true);
    if (await page.locator('dialog.dcat-modern-confirm-dialog').count()) fail('grid-interactions: confirm dialog did not clean up after confirmation.');

    const probeUrl = `${baseUrl}${adminPrefix}/tests/view-baseline/native-request-probe`;
    let probePosts = 0;
    let probeHeaders = {};
    await page.route('**/tests/view-baseline/native-request-probe', async (routeHandler) => {
        const request = routeHandler.request();
        if (request.method() === 'POST') {
            probePosts += 1;
            probeHeaders = request.headers();
            return routeHandler.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Permission probe' }) });
        }
        return routeHandler.continue();
    });
    await page.evaluate(() => {
        window.__dcatGridProbeErrors = [];
        document.addEventListener('dcat:request:error', (event) => window.__dcatGridProbeErrors.push(event.detail));
    });
    await page.evaluate(async (requestUrl) => {
        try {
            await window.Dcat.request(requestUrl, { method: 'POST', body: new URLSearchParams({ probe: '1' }) });
        } catch (error) {
            window.Dcat.handleAjaxError(error);
        }
    }, probeUrl);
    await page.waitForFunction(() => Array.isArray(window.__dcatGridProbeErrors) && window.__dcatGridProbeErrors.some((entry) => entry?.status === 403));
    if (probePosts !== 1 || !probeHeaders['x-csrf-token']) fail(`grid-interactions: request/CSRF contract failed: posts=${probePosts}`);

    await page.unroute('**/tests/view-baseline/native-request-probe');
    await page.route('**/tests/view-baseline/native-request-probe', (routeHandler) => routeHandler.abort('failed'));
    await page.evaluate(() => { window.__dcatGridProbeErrors = []; });
    await page.evaluate(async (requestUrl) => {
        try {
            await window.Dcat.request(requestUrl, { method: 'POST', body: new URLSearchParams({ probe: '2' }) });
        } catch (error) {
            window.Dcat.handleAjaxError(error);
        }
    }, probeUrl);
    await page.waitForFunction(() => Array.isArray(window.__dcatGridProbeErrors) && window.__dcatGridProbeErrors.some((entry) => entry?.status === 0));
    await page.unroute('**/tests/view-baseline/native-request-probe');

    return {
        selection,
        dropdown,
        filter,
        quick: { name: quickName, url: quickRequest.url(), pjax: quickRequest.headers()['x-pjax'] },
        filterRequestUrl,
        refresh: { url: refreshRequest.url(), pjax: refreshRequest.headers()['x-pjax'] },
        column,
        rowDropdown,
        requestProbe: { posts: probePosts, csrf: Boolean(probeHeaders['x-csrf-token']) },
    };
}

async function verifyModernGridActionMatrix(page, baseUrl, adminPrefix) {
    const route = '/tests/view-baseline/modern-grid-action-matrix';
    const url = adminUrl(baseUrl, adminPrefix, route);
    const mappedActions = gridCapabilities.actions.filter((entry) => entry.fixtureRoute && entry.browserTestId && entry.browserWitness);
    if (mappedActions.length !== gridCapabilities.summary.actions.total) {
        fail(`grid-action-matrix: registry action coverage is incomplete (${mappedActions.length}/${gridCapabilities.summary.actions.total}).`);
    }
    const open = async () => {
        const response = await page.goto(url, { waitUntil: 'networkidle' });
        if (!response || !response.ok()) fail(`grid-action-matrix: fixture returned HTTP ${response?.status() ?? 'unknown'}.`);
        await page.waitForSelector('[data-dcat-grid-interactions="native"]', { state: 'attached', timeout: 15_000 });
    };
    const waitForPjax = async (trigger, predicate = () => true) => {
        const requestPromise = page.waitForRequest((request) => request.headers()['x-pjax'] === 'true' && predicate(request), { timeout: 12_000 });
        await trigger();
        const request = await requestPromise;
        await page.waitForResponse((response) => response.request() === request || (response.request().url() === request.url() && response.request().headers()['x-pjax'] === 'true'), { timeout: 12_000 }).catch(() => null);
        return request;
    };

    await open();
    const structure = await page.evaluate(() => ({
        quickCreate: document.querySelectorAll('.quick-create .create-form').length,
        selector: document.querySelectorAll('.grid-selector').length,
        dialogCreate: document.querySelectorAll('[class*="dialog-create"][data-url]').length,
        quickEdit: document.querySelectorAll('.quick-edit[data-url]').length,
        exportSelected: document.querySelectorAll('a[href*="__rows__"]').length,
        perPage: document.querySelectorAll('.per-pages-selector .dropdown-menu a').length,
        batchDivider: document.querySelectorAll('[class*="select-all-btn"] .dropdown-divider').length,
    }));
    if (!structure.quickCreate || !structure.selector || !structure.dialogCreate || !structure.quickEdit || !structure.exportSelected || !structure.perPage || !structure.batchDivider) {
        fail(`grid-action-matrix: tool/action structure is incomplete: ${JSON.stringify(structure)}`);
    }

    let quickCreateRequest = null;
    await page.route('**/tests/view-baseline/native-request-probe', async (routeHandler) => {
        const request = routeHandler.request();
        quickCreateRequest = { method: request.method(), body: request.postData() || '', headers: request.headers() };
        await routeHandler.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: true, data: { message: 'Quick create probe' } }) });
    });
    const quickCreate = page.locator('.quick-create').first();
    await quickCreate.locator('.create').click();
    await quickCreate.locator('input[name="username"]').fill('matrix-user');
    const quickCreateSent = page.waitForRequest((request) => request.url().includes('/tests/view-baseline/native-request-probe') && request.method() === 'POST', { timeout: 8_000 });
    await quickCreate.locator('.create-form').evaluate((form) => form.requestSubmit());
    await quickCreateSent;
    await page.waitForTimeout(100);
    await page.unroute('**/tests/view-baseline/native-request-probe');
    if (!quickCreateRequest || quickCreateRequest.method !== 'POST' || !quickCreateRequest.body.includes('username=matrix-user') || !/(?:^|&)_token=/.test(quickCreateRequest.body)) {
        fail(`grid-action-matrix: QuickCreate POST/CSRF contract failed: ${JSON.stringify(quickCreateRequest)}`);
    }

    await open();
    const selectorLink = page.locator('.grid-selector .select-options a[href]').filter({ hasText: 'ID 1' }).first();
    const selectorRequest = await waitForPjax(() => selectorLink.click(), (request) => request.url().includes('_selector'));
    if (!selectorRequest.url().includes('_selector')) fail(`grid-action-matrix: Selector query contract failed: ${selectorRequest.url()}`);

    await open();
    const perPage = page.locator('.per-pages-selector').first();
    const perPageName = await perPage.getAttribute('data-dcat-per-page-name') || '';
    const perPageToggle = perPage.locator('[data-toggle="dropdown"]').first();
    await perPageToggle.click();
    if (!perPageName || await perPageToggle.getAttribute('aria-expanded') !== 'true') fail('grid-action-matrix: per-page dropdown metadata/open state is invalid.');
    const perPageLink = perPage.locator('.dropdown-menu a[href]').first();
    const perPageHref = await perPageLink.getAttribute('href') || '';
    const perPageRequest = await waitForPjax(() => perPageLink.click(), (request) => request.url() === new URL(perPageHref, page.url()).href);
    if (!new URL(perPageRequest.url()).searchParams.has(perPageName)) fail(`grid-action-matrix: per-page query contract failed: ${perPageRequest.url()}`);

    const openDialogAndClose = async (selector, label) => {
        await open();
        const trigger = page.locator(selector).first();
        if (!await trigger.count()) fail(`grid-action-matrix: ${label} trigger is missing.`);
        await trigger.evaluate((element) => element.click());
        const dialog = page.locator('.layui-layer.dcat-modern-layer').last();
        await dialog.waitFor({ state: 'visible', timeout: 12_000 });
        const dialogId = await dialog.getAttribute('id') || '';
        const state = { form: await dialog.locator('form').count(), submit: await dialog.locator('.layui-layer-btn0').count(), role: await dialog.getAttribute('role') };
        if (!dialogId || !state.form || !state.submit || state.role !== 'dialog') fail(`grid-action-matrix: ${label} dialog contract failed: ${JSON.stringify(state)}`);
        await dialog.locator('.layui-layer-close').click();
        await page.waitForFunction((id) => {
            const element = document.getElementById(id);
            return !element || getComputedStyle(element).display === 'none';
        }, dialogId);
        return state;
    };
    const quickEdit = await openDialogAndClose('.quick-edit[data-url]', 'QuickEdit');
    const dialogCreate = await openDialogAndClose('[class*="dialog-create"][data-url]', 'DialogCreate');

    await open();
    const root = page.locator('[data-dcat-grid-interactions="native"]').first();
    const rowCheckbox = root.locator('[data-dcat-grid-row-selector="1"]').first();
    await rowCheckbox.check();
    const exportToggle = root.locator('.btn-group.dropdown [data-toggle="dropdown"]').filter({ has: page.locator('.icon-download') }).first();
    if (await exportToggle.count()) await exportToggle.evaluate((element) => element.click());
    const exportSelected = root.locator('a[href*="__rows__"]').first();
    const selectedId = await rowCheckbox.getAttribute('data-id') || '';
    const exportRequestPromise = page.waitForRequest((request) => request.url().includes('selected%3A') || request.url().includes('selected:'), { timeout: 8_000 });
    await page.route('**/auth/users?*', async (routeHandler) => {
        const request = routeHandler.request();
        const parsed = new URL(request.url());
        if ([...parsed.searchParams.values()].some((value) => String(value).startsWith('selected:'))) {
            return routeHandler.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>export probe</title>' });
        }
        return routeHandler.continue();
    });
    await exportSelected.evaluate((element) => element.click());
    const exportRequest = await exportRequestPromise;
    await page.unroute('**/auth/users?*');
    if (exportRequest.url().includes('__rows__') || !exportRequest.url().includes(encodeURIComponent(selectedId)) && !exportRequest.url().includes(`:${selectedId}`)) {
        fail(`grid-action-matrix: selected export substitution failed: ${exportRequest.url()}`);
    }

    return {
        structure,
        quickCreate: { method: quickCreateRequest.method, token: Boolean(quickCreateRequest.headers['x-csrf-token'] || /(?:^|&)_token=/.test(quickCreateRequest.body)) },
        selector: selectorRequest.url(),
        perPage: perPageRequest.url(),
        quickEdit,
        dialogCreate,
        exportSelected: exportRequest.url(),
    };
}

async function verifyModernGridCompatDisplayers(page, baseUrl, adminPrefix) {
    const route = '/tests/view-baseline/modern-grid-compat-displayers';
    const base = adminUrl(baseUrl, adminPrefix, route);
    const open = async (mode = 'dropdown') => {
        const response = await page.goto(`${base}?actions=${mode}`, { waitUntil: 'networkidle' });
        if (!response || !response.ok()) {
            const body = response ? await response.text() : '';
            const diagnostic = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 700);
            fail(`grid-compat-displayers: ${mode} fixture returned HTTP ${response?.status() ?? 'unknown'}: ${diagnostic}`);
        }
        await page.waitForFunction(() => document.querySelectorAll('[data-dcat-modern-grid-renderer="react-payload"]').length >= 2, null, { timeout: 15_000 });
    };

    await open('dropdown');
    const structure = await page.evaluate(() => ({
        views: document.querySelectorAll('[data-dcat-modern-grid-renderer="react-payload"]').length,
        islands: document.querySelectorAll('[data-dcat-modern-legacy-island="grid-cell"]').length,
        copyable: document.querySelectorAll('.grid-column-copyable').length,
        limit: document.querySelectorAll('.limit-more').length,
        modal: document.querySelectorAll('[data-toggle="modal"]').length,
        qrcode: document.querySelectorAll('.grid-column-qrcode').length,
        orderable: document.querySelectorAll('[data-direction][class*="-orderable"]').length,
        input: document.querySelectorAll('.grid-editable-input').length,
        textarea: document.querySelectorAll('.grid-editable-textarea').length,
        select: document.querySelectorAll('.grid-column-select').length,
        radio: document.querySelectorAll('.grid-editable-radio').length,
        checkbox: document.querySelectorAll('.grid-editable-checkbox').length,
        switcher: document.querySelectorAll('.grid-column-switch').length,
        switchGroup: document.querySelectorAll('.grid-column-switch-group').length,
        dialogTree: document.querySelectorAll('.grid-dialog-tree').length,
        tree: document.querySelectorAll('[class*="-grid-load-children"]').length,
        dropdownActions: document.querySelectorAll('.grid-dropdown-actions').length,
    }));
    const required = ['copyable', 'modal', 'qrcode', 'input', 'textarea', 'select', 'radio', 'checkbox', 'switcher', 'dialogTree', 'tree', 'dropdownActions'];
    if (structure.views < 2 || structure.islands < 15 || structure.limit < 2 || structure.orderable < 2 || structure.switchGroup < 2 || required.some((key) => structure[key] < 1)) {
        fail(`grid-compat-displayers: structural witnesses are incomplete: ${JSON.stringify(structure)}`);
    }

    const limitToggle = page.locator('.limit-more').first();
    await limitToggle.click();
    const limit = await page.locator('.limit-text').evaluateAll((nodes) => nodes.slice(0, 2).map((node) => ({ hidden: node.classList.contains('d-none'), text: node.textContent?.trim() || '' })));
    if (limit.length < 2 || !limit[0].hidden || limit[1].hidden) fail(`grid-compat-displayers: Limit toggle failed: ${JSON.stringify(limit)}`);

    const editable = {};
    for (const [name, selector, expectedType] of [
        ['input', '.grid-editable-input', 'input'],
        ['textarea', '.grid-editable-textarea', 'textarea'],
        ['radio', '.grid-editable-radio', 'radio'],
        ['checkbox', '.grid-editable-checkbox', 'checkbox'],
    ]) {
        await page.locator(selector).first().click();
        const popover = page.locator('.dcat-modern-popover').filter({ visible: true }).last();
        await popover.waitFor({ state: 'visible', timeout: 8_000 });
        const type = await popover.locator('.ie-content').getAttribute('data-type');
        editable[name] = type;
        if (type !== expectedType) fail(`grid-compat-displayers: ${name} popover type drifted: ${type}`);
        await popover.locator('.ie-cancel').click();
    }

    const modalTrigger = page.locator('[data-toggle="modal"]').first();
    await modalTrigger.click();
    const modal = page.locator('.modal.show').first();
    await modal.waitFor({ state: 'visible', timeout: 8_000 });
    const modalState = { role: await modal.getAttribute('role'), modal: await modal.getAttribute('aria-modal') };
    if (modalState.role !== 'dialog' || modalState.modal !== 'true') fail(`grid-compat-displayers: modal facade contract failed: ${JSON.stringify(modalState)}`);
    await modal.locator('[data-dismiss="modal"]').click();

    const qrTrigger = page.locator('.grid-column-qrcode').first();
    const qrGeometry = await qrTrigger.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const wrapper = element.closest('.dcat-modern-table-wrap');
        return {
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            wrapper: wrapper ? { scrollLeft: wrapper.scrollLeft, scrollWidth: wrapper.scrollWidth, clientWidth: wrapper.clientWidth } : null,
        };
    });
    if (!qrGeometry.rect.width || !qrGeometry.rect.height || qrGeometry.display === 'none' || qrGeometry.visibility === 'hidden') {
        fail(`grid-compat-displayers: QRCode trigger is not render-visible: ${JSON.stringify(qrGeometry)}`);
    }
    await qrTrigger.evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'center' }));
    await qrTrigger.click();
    await page.waitForTimeout(150);
    const qrcode = await qrTrigger.evaluate((element) => {
        const jq = window.jQuery;
        const popovers = Array.from(document.querySelectorAll('.dcat-modern-popover')).filter((node) => getComputedStyle(node).display !== 'none');
        return {
            qrcodePlugin: Boolean(jq?.fn?.qrcode),
            popoverPlugin: Boolean(jq?.fn?.popover),
            hasDataContent: Boolean(element.getAttribute('data-content')),
            dataContentLength: (element.getAttribute('data-content') || '').length,
            childImages: element.querySelectorAll('img').length,
            popovers: popovers.length,
            popoverImages: popovers.reduce((count, node) => count + node.querySelectorAll('img').length, 0),
        };
    });
    if (!qrcode.qrcodePlugin || !qrcode.popoverPlugin || !qrcode.hasDataContent || !qrcode.popovers || !qrcode.popoverImages) {
        fail(`grid-compat-displayers: QRCode popover failed: ${JSON.stringify(qrcode)}`);
    }

    const dialogRuntime = await page.evaluate(() => ({
        layer: Boolean(window.layer),
        jstree: Boolean(window.jQuery?.fn?.jstree),
        resolver: typeof window.resolveDialogTree,
    }));
    if (!dialogRuntime.jstree || dialogRuntime.resolver !== 'function') {
        fail(`grid-compat-displayers: DialogTree prerequisites are incomplete: ${JSON.stringify(dialogRuntime)}`);
    }
    await page.locator('.grid-dialog-tree').first().click();
    await page.waitForTimeout(200);
    const dialogTreeState = await page.evaluate(() => {
        const layers = Array.from(document.querySelectorAll('.layui-layer'));
        const last = layers[layers.length - 1];
        return {
            layer: layers.length,
            tree: last?.querySelectorAll('.da-tree').length || 0,
            id: last?.id || '',
            display: last ? getComputedStyle(last).display : '',
            visibility: last ? getComputedStyle(last).visibility : '',
            open: typeof window.layer?.open,
            errors: [],
        };
    });
    if (!dialogTreeState.layer || !dialogTreeState.tree || dialogTreeState.display === 'none' || dialogTreeState.visibility === 'hidden') {
        fail(`grid-compat-displayers: DialogTree overlay failed: ${JSON.stringify(dialogTreeState)}`);
    }

    const dropdownToggle = page.locator('.grid-dropdown-actions [data-toggle="dropdown"]').first();
    await dropdownToggle.evaluate((element) => element.click());
    const dropdown = { expanded: await dropdownToggle.getAttribute('aria-expanded'), shown: await page.locator('.grid-dropdown-actions .dropdown-menu.show').count() };
    if (dropdown.expanded !== 'true' || !dropdown.shown) fail(`grid-compat-displayers: DropdownActions interaction failed: ${JSON.stringify(dropdown)}`);

    await open('default');
    const defaultActions = await page.evaluate(() => ({
        actionCells: document.querySelectorAll('.grid__actions__').length,
        delete: document.querySelectorAll('[data-action="delete"]').length,
        view: document.querySelectorAll('.grid__actions__ a[href]:not([data-action="delete"])').length,
    }));
    if (!defaultActions.actionCells || !defaultActions.delete || defaultActions.view < 2) fail(`grid-compat-displayers: Actions render contract failed: ${JSON.stringify(defaultActions)}`);

    await open('context');
    const grids = page.locator('[data-dcat-modern-grid-renderer="react-payload"]');
    const actionGrid = grids.last();
    const actionRow = actionGrid.locator('tbody > tr').first();
    await actionRow.dispatchEvent('contextmenu', { button: 2, clientX: 300, clientY: 300 });
    const contextMenu = await page.evaluate(() => {
        const menu = document.querySelector('#grid-context-menu .dropdown-menu');
        return { host: document.querySelectorAll('#grid-context-menu').length, menu: Boolean(menu), display: menu ? getComputedStyle(menu).display : '' };
    });
    if (!contextMenu.host || !contextMenu.menu || contextMenu.display === 'none') fail(`grid-compat-displayers: ContextMenuActions interaction failed: ${JSON.stringify(contextMenu)}`);

    return { structure, limit, editable, modal: modalState, qrcode, dialogTree: dialogTreeState, dropdown, defaultActions, contextMenu };
}

async function verifyModernFormLayout(page, baseUrl, adminPrefix) {
    const route = '/tests/view-baseline/modern-form-layout';
    const base = adminUrl(baseUrl, adminPrefix, route);
    const profiles = [
        { id: 'rows', expectedTree: 'rows' },
        { id: 'columns', expectedTree: 'columns' },
        { id: 'blocks', expectedTree: 'columns' },
        { id: 'tabs', expectedTree: 'tabs' },
    ];
    const evidence = {};

    const open = async (profile) => {
        await page.goto(`${base}?profile=${profile}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(150);
        const mountState = await page.evaluate(() => {
            const form = document.querySelector('form[data-dcat-react-component="form.basic"]');
            return {
                url: location.href,
                form: Boolean(form),
                mounted: form?.getAttribute('data-dcat-modern-react-mounted') || '',
                capability: form?.getAttribute('data-dcat-modern-capability') || '',
                managed: form?.querySelectorAll('[data-dcat-modern-managed="form.basic"]').length || 0,
                layout: form?.querySelectorAll('[data-dcat-modern-form-layout]').length || 0,
                bridge: window.DcatModernBridge?.status?.() || null,
                bodyText: document.body?.innerText?.replace(/\s+/g, ' ').trim().slice(0, 240) || '',
            };
        });
        if (!mountState.form || !mountState.mounted.includes('form.basic') || !mountState.layout) {
            fail(`form-layout:${profile}: mount failed: ${JSON.stringify(mountState)}`);
        }
        return page.locator('form[data-dcat-react-component="form.basic"]').first();
    };

    for (const profile of profiles) {
        const form = await open(profile.id);
        const state = await form.evaluate((element) => {
            const script = element.querySelector('script[data-dcat-modern-payload="form.basic"]');
            const envelope = script?.textContent ? JSON.parse(script.textContent) : null;
            const data = envelope?.payload?.data || {};
            const tree = data.layout?.tree || {};
            return {
                treeKind: tree.kind || '',
                layoutFlags: { hasRows: data.layout?.hasRows, hasColumns: data.layout?.hasColumns, hasBlocks: data.layout?.hasBlocks },
                fieldCount: data.fields?.length || 0,
                nativeFields: (data.fields || []).filter((field) => field.renderer === 'native').length,
                slots: (envelope?.payload?.slots || []).map((slot) => slot.id),
                legacyBlockIslands: element.querySelectorAll('.dcat-modern-form-block-layout .dcat-modern-legacy-island').length,
                nativeBlocks: element.querySelectorAll('.dcat-modern-form-block').length,
                nativeRows: element.querySelectorAll('[data-dcat-modern-form-layout="row"]').length,
                nativeColumns: element.querySelectorAll('[data-dcat-modern-form-layout="column"]').length,
                tabs: element.querySelectorAll('[role="tab"]').length,
                panels: element.querySelectorAll('[role="tabpanel"]').length,
                duplicateIds: Array.from(element.querySelectorAll('[id]')).map((node) => node.id).filter((id, index, ids) => ids.indexOf(id) !== index),
            };
        });
        if (state.treeKind !== profile.expectedTree || state.fieldCount !== 2 || state.nativeFields !== 2) {
            fail(`form-layout:${profile.id}: payload tree/field classification failed: ${JSON.stringify(state)}`);
        }
        if (new Set(state.slots).size !== state.slots.length || state.duplicateIds.length) {
            fail(`form-layout:${profile.id}: duplicate slot/id contract failed: ${JSON.stringify(state)}`);
        }
        if (state.legacyBlockIslands !== 0) fail(`form-layout:${profile.id}: legacy block layout island is still mounted.`);
        if (profile.id === 'rows' && (state.nativeRows < 1 || state.nativeColumns !== 2)) fail(`form-layout:rows: expected one native row and two columns: ${JSON.stringify(state)}`);
        if (profile.id === 'columns' && state.nativeColumns !== 2) fail(`form-layout:columns: expected two native columns: ${JSON.stringify(state)}`);
        if (profile.id === 'blocks' && state.nativeBlocks !== 2) fail(`form-layout:blocks: expected two native blocks: ${JSON.stringify(state)}`);
        if (profile.id === 'tabs' && (state.tabs !== 2 || state.panels !== 2)) fail(`form-layout:tabs: accessible tabs missing: ${JSON.stringify(state)}`);

        const viewports = [];
        for (const viewport of contract.viewports) {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await open(profile.id);
            const geometry = await page.evaluate(() => ({
                pageOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
                contentOverflow: Math.max(0, (document.querySelector('.content-wrapper')?.scrollWidth || 0) - (document.querySelector('.content-wrapper')?.clientWidth || 0)),
                formOverflow: (() => {
                    const form = document.querySelector('form[data-dcat-react-component="form.basic"]');
                    return form ? Math.max(0, form.scrollWidth - form.clientWidth) : 0;
                })(),
            }));
            if (geometry.pageOverflow > 1 || geometry.contentOverflow > 1 || geometry.formOverflow > 1) {
                fail(`form-layout:${profile.id}:${viewport.width}x${viewport.height}: overflow failed: ${JSON.stringify(geometry)}`);
            }
            viewports.push({ viewport, geometry });
        }
        evidence[profile.id] = { state, viewports };
    }

    await page.setViewportSize({ width: 1366, height: 768 });
    const tabForm = await open('tabs');
    const profileTab = tabForm.locator('[role="tab"][aria-controls="layout-profile-tab"]');
    const securityTab = tabForm.locator('[role="tab"][aria-controls="layout-security-tab"]');
    if (await profileTab.getAttribute('aria-selected') !== 'true') fail('form-layout:tabs: server active tab was not preserved.');
    await securityTab.click();
    if (await securityTab.getAttribute('aria-selected') !== 'true' || !page.url().endsWith('#layout-security-tab')) {
        fail('form-layout:tabs: native tab/hash navigation failed.');
    }
    const secret = tabForm.locator('input[name="layout_secret"]');
    await secret.fill('server-error');
    await profileTab.click();
    const errorResponse = page.waitForResponse((response) => new URL(response.url()).pathname.endsWith(`${adminPrefix}/tests/view-baseline/modern-form-probe`) && response.status() === 422, { timeout: 15_000 });
    await tabForm.evaluate((element) => element.requestSubmit());
    await errorResponse;
    await page.waitForFunction(() => document.querySelector('input[name="layout_secret"]')?.getAttribute('aria-invalid') === 'true', null, { timeout: 8_000 });
    const tabError = await secret.evaluate((element) => ({
        value: element.value,
        active: document.activeElement === element,
        invalid: element.getAttribute('aria-invalid'),
        selected: document.querySelector('[role="tab"][aria-controls="layout-security-tab"]')?.getAttribute('aria-selected'),
        message: element.closest('.form-group')?.querySelector('.with-errors')?.textContent?.trim() || '',
        hash: location.hash,
    }));
    if (tabError.value !== 'server-error' || !tabError.active || tabError.invalid !== 'true' || tabError.selected !== 'true' || !tabError.message.includes('secret field is invalid')) {
        fail(`form-layout:tabs: 422 tab focus/old-input contract failed: ${JSON.stringify(tabError)}`);
    }
    evidence.tabs.error = tabError;

    return evidence;
}

async function verifyModernFormAdvancedCompat(page, baseUrl, adminPrefix) {
    const route = '/tests/view-baseline/modern-form-advanced-compat';
    const url = adminUrl(baseUrl, adminPrefix, route);
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
    if (!response?.ok()) {
        const body = response ? await response.text() : '';
        fail(`form-advanced-compat: HTTP ${response?.status() ?? 'unknown'}: ${body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 1000)}`);
    }
    await page.waitForTimeout(400);
    const state = await page.evaluate(() => {
        const form = document.querySelector('form[data-dcat-react-component="form.basic"]');
        const script = form?.querySelector('script[data-dcat-modern-payload="form.basic"]');
        const envelope = script?.textContent ? JSON.parse(script.textContent) : null;
        const fields = envelope?.payload?.data?.fields || [];
        return {
            form: Boolean(form),
            mounted: form?.getAttribute('data-dcat-modern-react-mounted') || '',
            fields: fields.map((field) => `${field.fieldType}:${field.renderer}`),
            islands: form?.querySelectorAll('[data-dcat-modern-legacy-field]').length || 0,
            native: form?.querySelectorAll('[data-dcat-modern-field="native"]').length || 0,
            fallback: form?.querySelectorAll('[data-dcat-modern-fallback]').length || 0,
            bodyText: document.body?.innerText?.replace(/\s+/g, ' ').trim().slice(0, 300) || '',
        };
    });
    if (!state.form || !state.mounted.includes('form.basic')) {
        fail(`form-advanced-compat: mount failed: ${JSON.stringify(state)}`);
    }
    const requiredCompat = ['Button', 'Divide', 'Head', 'Html', 'KeyValue', 'ListField', 'ArrayField', 'Table', 'HasMany', 'Embeds', 'SelectTable', 'MultipleSelectTable', 'CascadeGroup'];
    for (const type of requiredCompat) {
        if (!state.fields.includes(`${type}:compat`)) fail(`form-advanced-compat: missing ${type} compat witness: ${JSON.stringify(state.fields)}`);
    }

    const form = page.locator('form[data-dcat-react-component="form.basic"]').first();

    await page.getByText('Compat Button', { exact: true }).click();
    const buttonClicks = await page.evaluate(() => window.__dcatCompatButton || 0);
    if (buttonClicks !== 1) fail(`form-advanced-compat: custom Button callback fired ${buttonClicks} times.`);

    const fieldsetToggle = page.locator('a').filter({ hasText: 'Compat fieldset' }).first();
    const fieldsetHref = await fieldsetToggle.getAttribute('href');
    if (!fieldsetHref) fail('form-advanced-compat: fieldset collapse anchor is missing.');
    const fieldsetPanel = page.locator(fieldsetHref);
    const fieldsetBefore = await fieldsetPanel.evaluate((element) => element.classList.contains('show'));
    await fieldsetToggle.click();
    const fieldsetAfter = await fieldsetPanel.evaluate((element) => element.classList.contains('show'));
    if (fieldsetBefore === fieldsetAfter) fail('form-advanced-compat: fieldset collapse did not toggle.');
    await fieldsetToggle.click();

    const keyValueGroup = form.locator('input[name="compat_key_value[_def_]"]').locator('xpath=ancestor::*[contains(@class,"form-group")][1]');
    const keyRowsBefore = await keyValueGroup.locator('tbody.kv-table tr').count();
    await keyValueGroup.locator('.kv-add').click();
    const keyRowsAfter = await keyValueGroup.locator('tbody.kv-table tr').count();
    if (keyRowsAfter !== keyRowsBefore + 1) fail('form-advanced-compat: KeyValue add-row failed.');
    await keyValueGroup.locator('tbody.kv-table tr').last().locator('input[name*="[keys]"]').fill('beta');
    await keyValueGroup.locator('tbody.kv-table tr').last().locator('input[name*="[values]"]').fill('two');

    const listGroup = form.locator('input[name="compat_list[values][_def_]"]').locator('xpath=ancestor::*[contains(@class,"form-group")][1]');
    const listRowsBefore = await listGroup.locator('tbody.list-table tr').count();
    await listGroup.locator('.list-add').click();
    const listRowsAfter = await listGroup.locator('tbody.list-table tr').count();
    if (listRowsAfter !== listRowsBefore + 1) fail('form-advanced-compat: ListField add-row failed.');
    await listGroup.locator('tbody.list-table tr').last().locator('input[name*="[values]"]').fill('second');

    const arrayGroup = form.locator('.has-many-compat_array').first();
    const arrayBefore = await arrayGroup.locator('.has-many-compat_array-form').count();
    await arrayGroup.locator('.compat_array-add').click();
    const arrayAfter = await arrayGroup.locator('.has-many-compat_array-form').count();
    if (arrayAfter !== arrayBefore + 1) fail('form-advanced-compat: ArrayField add nested form failed.');
    await arrayGroup.locator('.has-many-compat_array-form').last().locator('input[name$="[name]"]').fill('Array two');

    const tableGroup = form.locator('.has-many-table-compat_table').first();
    const tableBefore = await tableGroup.locator('tbody tr.has-many-table-compat_table-form').count();
    await tableGroup.locator('.add').click();
    const tableAfter = await tableGroup.locator('tbody tr.has-many-table-compat_table-form').count();
    if (tableAfter !== tableBefore + 1) fail('form-advanced-compat: Table add nested row failed.');
    await tableGroup.locator('tbody tr.has-many-table-compat_table-form').last().locator('input[name$="[name]"]').fill('Table two');

    const manyGroup = form.locator('.has-many-compat_many').first();
    const manyBefore = await manyGroup.locator('.has-many-compat_many-form').count();
    await manyGroup.locator('.compat_many-add').click();
    const manyAfter = await manyGroup.locator('.has-many-compat_many-form').count();
    if (manyAfter !== manyBefore + 1) fail('form-advanced-compat: HasMany add nested form failed.');
    await manyGroup.locator('.has-many-compat_many-form').last().locator('input[name$="[name]"]').fill('Many two');

    const embedTitle = form.locator('input[name="compat_embed[title]"]');
    await embedTitle.fill('Embedded changed');

    const cascade = form.locator('select[name="compat_cascade"]');
    const cascadeDetail = form.locator('input[name="compat_cascade_detail"]');
    const cascadeGroup = cascadeDetail.locator('xpath=ancestor::*[contains(@class,"cascade-group")][1]');
    const cascadeParentBefore = await cascadeGroup.count();
    await cascade.selectOption('show');
    await page.waitForTimeout(80);
    const cascadeState = {
        parent: cascadeParentBefore,
        visible: cascadeParentBefore ? await cascadeGroup.evaluate((element) => !element.classList.contains('d-none')) : false,
    };
    if (!cascadeState.parent || !cascadeState.visible) fail(`form-advanced-compat: cascade structural contract failed: ${JSON.stringify(cascadeState)}`);

    const loadParent = form.locator('select[name="compat_load_parent"]');
    const loadChild = form.locator('select[name="compat_load_child"]');
    const loadRequests = [];
    const loadRequestListener = (request) => {
        if (new URL(request.url()).pathname.endsWith(`${adminPrefix}/tests/view-baseline/modern-form-load-options`)) loadRequests.push(request.url());
    };
    page.on('request', loadRequestListener);
    await page.evaluate(() => {
        const original = window.Dcat.helpers.loadFields;
        const originalAjax = window.jQuery.ajax;
        window.__dcatLoadProbe = { calls: 0, ajaxCalls: 0, errors: [], args: [] };
        window.jQuery.ajax = function (...ajaxArgs) {
            window.__dcatLoadProbe.ajaxCalls += 1;
            return originalAjax.apply(this, ajaxArgs);
        };
        window.Dcat.helpers.loadFields = function (...args) {
            window.__dcatLoadProbe.calls += 1;
            window.__dcatLoadProbe.args.push({
                value: args[0]?.value || '',
                selected: Array.from(args[0]?.selectedOptions || []).map((option) => option.value),
                fields: args[1]?.fields || [],
                urls: args[1]?.urls || [],
                group: args[1]?.group || '',
            });
            try {
                return original.apply(this, args);
            } catch (error) {
                window.__dcatLoadProbe.errors.push(String(error));
                throw error;
            }
        };
    });
    await loadParent.selectOption('two');
    await loadParent.evaluate((element) => window.jQuery(element).trigger('change'));
    await page.waitForTimeout(500);
    const loadDiagnostic = await page.evaluate(() => {
        const parent = document.querySelector('select[name="compat_load_parent"]');
        const child = document.querySelector('select[name="compat_load_child"]');
        const events = window.jQuery?._data?.(document, 'events')?.change || [];
        const delegates = events.map((event) => event.selector || '').filter(Boolean);
        const scope = parent?.closest('.fields-group');
        return {
            parentValue: parent?.value || '',
            parentClass: parent?.className || '',
            childClass: child?.className || '',
            formId: parent?.closest('form')?.id || '',
            scopeClass: scope?.className || '',
            scopeContainsChild: Boolean(scope && child && scope.contains(child)),
            targetCount: scope ? scope.querySelectorAll('.field_compat_load_child').length : 0,
            changeDelegates: delegates,
            delegateMatches: delegates.map((selector) => ({ selector, count: document.querySelectorAll(selector).length, matchesParent: parent ? parent.matches(selector) : false })),
            probe: window.__dcatLoadProbe || null,
        };
    });
    page.off('request', loadRequestListener);
    if (!loadRequests.length) fail(`form-advanced-compat: load-fields emitted no request: ${JSON.stringify(loadDiagnostic)}`);
    await page.waitForFunction(() => Array.from(document.querySelectorAll('select[name="compat_load_child"] option')).some((option) => option.value === 'loaded-b'), null, { timeout: 8_000 });
    const loadedOptions = await loadChild.locator('option').evaluateAll((options) => options.map((option) => option.value));
    if (!loadedOptions.includes('loaded-a') || !loadedOptions.includes('loaded-b')) fail(`form-advanced-compat: load-fields contract failed: ${JSON.stringify({ loadedOptions, loadRequests, loadDiagnostic })}`);

    const selectTableField = form.locator('input[name="compat_select_table"]').locator('xpath=ancestor::*[contains(@class,"select-resource")][1]');
    const selectTableButton = selectTableField.locator('.input-group-append .btn').first();
    await selectTableButton.click();
    await page.waitForTimeout(100);
    const selectTableOverlay = await page.evaluate(() => document.querySelectorAll('.modal.show,[role="dialog"]:not([hidden]),.layui-layer').length);
    if (!selectTableOverlay) fail('form-advanced-compat: SelectTable dialog did not open.');
    await page.keyboard.press('Escape');

    const firstCompatValue = keyValueGroup.locator('tbody.kv-table tr').first().locator('input[name*="[values]"]');
    await firstCompatValue.fill('server-error');
    const validationResponse = page.waitForResponse((candidate) => new URL(candidate.url()).pathname.endsWith(`${adminPrefix}/tests/view-baseline/modern-form-probe`) && candidate.status() === 422, { timeout: 15_000 });
    await form.evaluate((element) => element.requestSubmit());
    await validationResponse;
    await page.waitForFunction(() => document.querySelector('input[name="compat_key_value[values][0]"]')?.getAttribute('aria-invalid') === 'true', null, { timeout: 8_000 });
    const validation = await firstCompatValue.evaluate((element) => ({
        invalid: element.getAttribute('aria-invalid'),
        active: document.activeElement === element,
        message: element.closest('.form-group')?.querySelector('.with-errors')?.textContent?.trim() || '',
    }));
    if (validation.invalid !== 'true' || !validation.active || !validation.message.includes('compat value')) {
        fail(`form-advanced-compat: nested 422 contract failed: ${JSON.stringify(validation)}`);
    }
    await firstCompatValue.fill('one');

    const successRequestPromise = page.waitForRequest((request) => new URL(request.url()).pathname.endsWith(`${adminPrefix}/tests/view-baseline/modern-form-probe`), { timeout: 15_000 });
    const successResponsePromise = page.waitForResponse((candidate) => new URL(candidate.url()).pathname.endsWith(`${adminPrefix}/tests/view-baseline/modern-form-probe`) && candidate.status() === 200, { timeout: 15_000 });
    await form.evaluate((element) => element.requestSubmit());
    const successRequest = await successRequestPromise;
    await successResponsePromise;
    const successBody = successRequest.postData() || '';
    for (const witness of ['compat_key_value', 'compat_list', 'compat_array', 'compat_table', 'compat_many', 'compat_embed']) {
        if (!successBody.includes(`name="${witness}`)) fail(`form-advanced-compat: submit body missing ${witness}: ${successBody.slice(0, 1600)}`);
    }

    const editResponse = await page.goto(`${url}?edit=1`, { waitUntil: 'domcontentloaded' });
    if (!editResponse?.ok()) fail(`form-advanced-compat: edit fixture returned HTTP ${editResponse?.status() ?? 'unknown'}.`);
    await page.waitForSelector('form[data-dcat-modern-react-mounted~="form.basic"]', { state: 'attached', timeout: 15_000 });
    const edit = await page.locator('form[data-dcat-react-component="form.basic"]').first().evaluate((element) => ({
        method: element.method.toUpperCase(),
        spoof: element.querySelector('input[name="_method"]')?.value || '',
    }));
    if (edit.method !== 'POST' || edit.spoof !== 'PUT') fail(`form-advanced-compat: edit method contract failed: ${JSON.stringify(edit)}`);

    const basicUrl = adminUrl(baseUrl, adminPrefix, '/tests/view-baseline/modern-form-basic');
    const cleanupCycles = [];
    for (let index = 0; index < 3; index += 1) {
        await page.evaluate(async (target) => window.DcatNativeRuntime.pjax(window.Dcat, target), basicUrl);
        await page.waitForSelector('form[data-dcat-modern-react-mounted~="form.basic"] input[name="username"]', { state: 'attached', timeout: 15_000 });
        cleanupCycles.push(await page.evaluate(() => ({
            compatFields: document.querySelectorAll('input[name^="compat_"],select[name^="compat_"]').length,
            select2: document.querySelectorAll('body > .select2-container').length,
            dialogs: document.querySelectorAll('.modal.show,.layui-layer').length,
        })));
        await page.evaluate(async (target) => window.DcatNativeRuntime.pjax(window.Dcat, target), url);
        await page.waitForSelector('form[data-dcat-modern-react-mounted~="form.basic"] input[name="compat_fieldset_text"]', { state: 'attached', timeout: 15_000 });
    }
    if (cleanupCycles.some((cycle) => cycle.compatFields || cycle.select2 || cycle.dialogs)) {
        fail(`form-advanced-compat: repeated PJAX cleanup failed: ${JSON.stringify(cleanupCycles)}`);
    }

    return { state, buttonClicks, cascadeState, loadedOptions, validation, edit, cleanupCycles };
}

async function verifyModernB8Surfaces(page, baseUrl, adminPrefix) {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.addInitScript(() => {
        window.__dcatB8Telemetry = [];
        window.addEventListener('dcat:modern:telemetry', (event) => window.__dcatB8Telemetry.push(event.detail));
    });
    const widgetUrl = adminUrl(baseUrl, adminPrefix, '/tests/view-baseline/modern-widget');
    const systemUrl = adminUrl(baseUrl, adminPrefix, '/tests/view-baseline/modern-system');
    const exceptionUrl = adminUrl(baseUrl, adminPrefix, '/tests/view-baseline/modern-system-exception');

    let response = await page.goto(widgetUrl, { waitUntil: 'networkidle' });
    if (!response?.ok()) fail(`b8-widget: fixture returned HTTP ${response?.status() ?? 'unknown'}.`);
    await page.waitForSelector('[data-widget-variant="dashboard"]', { state: 'attached', timeout: 15_000 });

    const widgetState = await page.evaluate(() => {
        const renderers = Array.from(document.querySelectorAll('[data-dcat-modern-widget-renderer="payload"]'));
        const allOwners = Array.from(document.querySelectorAll('[data-dcat-react-component="widget.surface"]'));
        const payloadScripts = Array.from(document.querySelectorAll('script[data-dcat-modern-payload="widget.surface"]'));
        return {
            variants: renderers.map((node) => node.getAttribute('data-widget-variant')),
            owners: document.querySelectorAll('[data-dcat-react-component="widget.surface"][data-dcat-modern-react-mounted~="widget.surface"]').length,
            allOwners: allOwners.map((owner) => ({
                mounted: owner.getAttribute('data-dcat-modern-react-mounted') || '',
                nextPayload: owner.nextElementSibling?.getAttribute('data-dcat-modern-payload') || '',
                text: owner.textContent?.replace(/\s+/g, ' ').trim().slice(0, 120) || '',
            })),
            payloads: payloadScripts.map((script) => {
                try { return JSON.parse(script.textContent || '{}')?.payload?.data?.variant || ''; } catch (_) { return 'invalid'; }
            }),
            telemetry: (window.__dcatB8Telemetry || []).filter((item) => item?.capability === 'widget.surface' || String(item?.code || '').includes('CAPABILITY')),
            managed: document.querySelectorAll('[data-dcat-modern-managed="widget.surface"]').length,
            legacyShells: renderers.reduce((count, node) => count + node.querySelectorAll(':scope > .card-header,:scope > .card-body,:scope > .card-footer,:scope > .box-header,:scope > .box-body').length, 0),
            dashboardIslands: document.querySelector('[data-widget-variant="dashboard"]')?.querySelectorAll('[data-dcat-modern-legacy-island]').length ?? -1,
            dashboardLinks: document.querySelectorAll('[data-widget-variant="dashboard"] .dcat-modern-dashboard__links a').length,
            boxContent: document.querySelector('[data-widget-variant="box"] [data-b8-widget-content="box"]')?.textContent?.trim() || '',
            cardContent: document.querySelector('[data-widget-variant="card"] [data-b8-widget-content="card"]')?.textContent?.trim() || '',
            cardFooter: document.querySelector('[data-widget-variant="card"] [data-b8-widget-footer="1"]')?.textContent?.trim() || '',
            cardId: document.querySelector('[data-widget-variant="card"]')?.id || '',
            cardWidthRatio: (() => {
                const card = document.querySelector('#b8-widget-card');
                const row = card?.closest('.row');
                return row ? card.getBoundingClientRect().width / row.getBoundingClientRect().width : -1;
            })(),
            cardBodyPadding: getComputedStyle(document.querySelector('[data-widget-variant="card"] .dcat-modern-widget__body')).padding,
            cardContentPadding: getComputedStyle(document.querySelector('[data-widget-variant="card"] [data-dcat-modern-slot="widget-content"]')).padding,
            boxStyle: document.querySelector('[data-widget-variant="box"]')?.classList.contains('box-info') || false,
            dataCardText: document.querySelector('[data-widget-variant="data-card"]')?.textContent?.replace(/\s+/g, ' ').trim() || '',
            dataCardIslands: document.querySelector('[data-widget-variant="data-card"]')?.querySelectorAll('[data-dcat-modern-legacy-island]').length ?? -1,
            dataCardProgress: document.querySelector('[data-widget-variant="data-card"] [role="progressbar"]')?.getAttribute('aria-valuenow') || '',
            dataCardWarning: document.querySelector('[data-widget-variant="data-card"] .dcat-modern-data-card__progress-bar--warning') !== null,
            dashboardLegacyBackground: document.querySelector('.dashboard-title[data-dcat-react-component="widget.surface"]')?.classList.contains('bg-primary') || false,
        };
    });
    for (const variant of ['box', 'card', 'data-card', 'dashboard']) {
        if (!widgetState.variants.includes(variant)) fail(`b8-widget: missing ${variant} payload renderer: ${JSON.stringify(widgetState)}`);
    }
    if (widgetState.owners !== 4 || widgetState.managed !== 4 || widgetState.legacyShells || widgetState.dashboardIslands !== 0 || widgetState.dashboardLinks !== 4) {
        fail(`b8-widget: native ownership failed: ${JSON.stringify(widgetState)}`);
    }
    if (widgetState.boxContent !== 'Box content' || widgetState.cardContent !== 'Card content' || widgetState.cardFooter !== 'Card footer' || !widgetState.dataCardText.includes('42') || !widgetState.dataCardText.includes('Ready')) {
        fail(`b8-widget: custom content transport failed: ${JSON.stringify(widgetState)}`);
    }
    if (widgetState.dataCardIslands !== 0 || widgetState.dataCardProgress !== '75') {
        fail(`b8-widget: standard DataCard must be payload-native: ${JSON.stringify(widgetState)}`);
    }
    if (widgetState.cardId !== 'b8-widget-card' || widgetState.cardWidthRatio < 0.45 || widgetState.cardWidthRatio > 0.55
        || widgetState.cardBodyPadding !== '0px' || widgetState.cardContentPadding !== '0px'
        || !widgetState.boxStyle || !widgetState.dataCardWarning || widgetState.dashboardLegacyBackground) {
        fail(`b8-widget: visual and attribute contracts failed: ${JSON.stringify(widgetState)}`);
    }

    const widgetControls = await page.evaluate(() => ({
        dropdown: document.querySelectorAll('[data-dcat-native-widget-dropdown="1"]').length,
        dropdownBootstrapToggle: document.querySelectorAll('[data-dcat-native-widget-dropdown="1"] [data-toggle="dropdown"]').length,
        modalRoot: document.querySelectorAll('#b8-widget-modal[data-dcat-modern-widget-compat="modal"]').length,
        modalTrigger: document.querySelectorAll('[data-dcat-modern-widget-compat-trigger="modal"][data-target="#b8-widget-modal"]').length,
        compatRuntime: Array.from(document.scripts).some((script) => (script.src || '').includes('/modern-compat/')),
    }));
    if (widgetControls.dropdown !== 1 || widgetControls.dropdownBootstrapToggle || widgetControls.modalRoot !== 1 || widgetControls.modalTrigger !== 1 || !widgetControls.compatRuntime) {
        fail(`b8-widget: dropdown/modal ownership failed: ${JSON.stringify(widgetControls)}`);
    }

    const dropdownRoot = page.locator('[data-dcat-native-widget-dropdown="1"]');
    const dropdownTrigger = dropdownRoot.locator('[data-dcat-widget-dropdown-trigger="1"]');
    if (await dropdownRoot.locator('[data-dcat-dropdown-label]').textContent() !== '1. Alpha') {
        fail('b8-widget: dropdown did not show its first option before selection.');
    }
    if (await dropdownRoot.locator('[data-dcat-dropdown-label] .b8-option .feather').count() !== 1) {
        fail('b8-widget: dropdown lost mapped option markup.');
    }
    await dropdownTrigger.press('ArrowDown');
    const dropdownOpen = await dropdownRoot.evaluate((node) => ({
        expanded: node.querySelector('[data-dcat-widget-dropdown-trigger="1"]')?.getAttribute('aria-expanded'),
        hidden: node.querySelector('[role="menu"]')?.hasAttribute('hidden') ?? true,
        focused: document.activeElement?.getAttribute('role') || '',
    }));
    if (dropdownOpen.expanded !== 'true' || dropdownOpen.hidden || dropdownOpen.focused !== 'menuitem') {
        fail(`b8-widget: native dropdown keyboard open failed: ${JSON.stringify(dropdownOpen)}`);
    }
    await dropdownRoot.getByText('1. Beta', { exact: true }).click();
    const dropdownSelected = await dropdownRoot.evaluate((node) => ({
        label: node.querySelector('[data-dcat-dropdown-label]')?.textContent?.trim() || '',
        expanded: node.querySelector('[data-dcat-widget-dropdown-trigger="1"]')?.getAttribute('aria-expanded'),
        hidden: node.querySelector('[role="menu"]')?.hasAttribute('hidden') ?? false,
    }));
    if (dropdownSelected.label !== '1. Beta' || dropdownSelected.expanded !== 'false' || !dropdownSelected.hidden) {
        fail(`b8-widget: native dropdown selection failed: ${JSON.stringify(dropdownSelected)}`);
    }

    await page.locator('[data-b8-modal-open="1"]').click();
    const modal = page.locator('#b8-widget-modal[data-dcat-modern-widget-compat="modal"]');
    await modal.waitFor({ state: 'visible', timeout: 8_000 });
    const modalOpen = await modal.evaluate((node) => ({
        show: node.classList.contains('show'),
        ariaModal: node.getAttribute('aria-modal'),
        content: node.querySelector('[data-b8-modal-content="1"]')?.textContent?.trim() || '',
        shownEvents: window.__dcatB8ModalShown || 0,
        focused: node.contains(document.activeElement),
    }));
    if (!modalOpen.show || modalOpen.ariaModal !== 'true' || modalOpen.content !== 'Modal content' || modalOpen.shownEvents !== 1 || !modalOpen.focused) {
        fail(`b8-widget: bounded modal compat open failed: ${JSON.stringify(modalOpen)}`);
    }
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    if (!await modal.evaluate((node) => node.contains(document.activeElement))) fail('b8-widget: modal keyboard focus escaped.');
    await modal.locator('[data-dismiss="modal"]').click();
    await page.waitForFunction(() => !document.querySelector('[data-dcat-modern-widget-compat="modal"]')?.classList.contains('show'), null, { timeout: 8_000 });
    const modalClosed = await page.evaluate(() => ({
        hiddenEvents: window.__dcatB8ModalHidden || 0,
        bodyOpen: document.body.classList.contains('modal-open'),
        focusReturned: document.activeElement?.matches('[data-b8-modal-open="1"]'),
    }));
    if (modalClosed.hiddenEvents !== 1 || modalClosed.bodyOpen || !modalClosed.focusReturned) fail(`b8-widget: bounded modal compat close failed: ${JSON.stringify(modalClosed)}`);
    await page.locator('[data-b8-modal-open="1"]').click();
    await page.keyboard.press('Escape');
    if (await modal.isVisible() || !await page.locator('[data-b8-modal-open="1"]').evaluate((node) => node === document.activeElement)) fail('b8-widget: modal Escape/focus return failed.');

    const box = page.locator('[data-widget-variant="box"]');
    const collapse = box.getByRole('button', { name: 'Collapse widget' });
    await collapse.click();
    const collapsed = await box.evaluate((node) => ({
        hidden: node.querySelector('.dcat-modern-widget__body')?.hasAttribute('hidden') === true,
        expanded: node.querySelector('[aria-label="Expand widget"]')?.getAttribute('aria-expanded'),
    }));
    if (!collapsed.hidden || collapsed.expanded !== 'false') fail(`b8-widget: collapse failed: ${JSON.stringify(collapsed)}`);
    await box.getByRole('button', { name: 'Expand widget' }).click();
    if (await box.locator('.dcat-modern-widget__body[hidden]').count()) fail('b8-widget: expand failed.');

    await page.setViewportSize({ width: 390, height: 844 });
    const narrow = await page.evaluate(() => {
        const widgets = Array.from(document.querySelectorAll('[data-dcat-modern-widget-renderer="payload"]'));
        return {
            pageOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
            contentOverflow: Math.max(0, (document.querySelector('.content-wrapper')?.scrollWidth || 0) - (document.querySelector('.content-wrapper')?.clientWidth || 0)),
            widgetOverflow: widgets.map((node) => Math.max(0, node.scrollWidth - node.clientWidth)),
            unnamedButtons: widgets.flatMap((node) => Array.from(node.querySelectorAll('button'))).filter((node) => !node.getAttribute('aria-label') && !node.textContent?.trim()).length,
        };
    });
    if (narrow.pageOverflow > 1 || narrow.contentOverflow > 1 || narrow.widgetOverflow.some((value) => value > 1) || narrow.unnamedButtons) {
        fail(`b8-widget: narrow/accessibility failed: ${JSON.stringify(narrow)}`);
    }

    await page.setViewportSize({ width: 1366, height: 768 });
    response = await page.goto(systemUrl, { waitUntil: 'networkidle' });
    if (!response?.ok()) fail(`b8-system: feedback fixture returned HTTP ${response?.status() ?? 'unknown'}.`);
    await page.waitForSelector('[data-dcat-modern-system-renderer="feedback"]', { state: 'attached', timeout: 15_000 });
    const feedback = await page.locator('[data-dcat-modern-system-renderer="feedback"]').evaluate((node) => ({
        text: node.textContent?.replace(/\s+/g, ' ').trim() || '',
        legacyClass: node.classList.contains('alert'),
        nativeClass: node.classList.contains('dcat-modern-alert'),
        islands: node.querySelectorAll('[data-dcat-modern-legacy-island]').length,
    }));
    if (!feedback.text.includes('M0 system feedback') || feedback.legacyClass || !feedback.nativeClass || feedback.islands) {
        fail(`b8-system: native feedback failed: ${JSON.stringify(feedback)}`);
    }
    await page.getByRole('button', { name: 'Dismiss notification' }).click();
    await page.waitForSelector('[data-dcat-modern-system-renderer="feedback"]', { state: 'detached', timeout: 5_000 });

    response = await page.goto(exceptionUrl, { waitUntil: 'networkidle' });
    if (!response?.ok()) fail(`b8-system: exception fixture returned HTTP ${response?.status() ?? 'unknown'}.`);
    await page.waitForSelector('[data-dcat-modern-system-renderer="exception"]', { state: 'attached', timeout: 15_000 });
    const exceptionToggle = page.locator('[data-dcat-modern-system-renderer="exception"] [aria-controls="dcat-modern-exception-trace"]');
    const beforeExpanded = await exceptionToggle.getAttribute('aria-expanded');
    await exceptionToggle.click();
    const exceptionState = await page.locator('[data-dcat-modern-system-renderer="exception"]').evaluate((node) => ({
        text: node.textContent?.replace(/\s+/g, ' ').trim() || '',
        expanded: node.querySelector('[aria-controls="dcat-modern-exception-trace"]')?.getAttribute('aria-expanded'),
        trace: node.querySelector('#dcat-modern-exception-trace')?.textContent || '',
        inlineHandlers: node.querySelectorAll('[onclick],[ondblclick]').length,
        legacyIslands: node.querySelectorAll('[data-dcat-modern-legacy-island]').length,
    }));
    if (beforeExpanded !== 'false' || exceptionState.expanded !== 'true' || !exceptionState.text.includes('RuntimeException') || !exceptionState.trace.includes('#0 fixture():73') || exceptionState.inlineHandlers || exceptionState.legacyIslands) {
        fail(`b8-system: exception disclosure failed: ${JSON.stringify({ beforeExpanded, ...exceptionState })}`);
    }

    const systemCleanup = [];
    for (let index = 0; index < 3; index += 1) {
        await page.evaluate(async (target) => window.DcatNativeRuntime.pjax(window.Dcat, target), `${systemUrl}?cycle=${index}`);
        await page.waitForSelector('[data-dcat-modern-system-renderer="feedback"]', { state: 'attached', timeout: 15_000 });
        systemCleanup.push(await page.evaluate(() => ({
            exception: document.querySelectorAll('[data-dcat-modern-system-renderer="exception"]').length,
            feedback: document.querySelectorAll('[data-dcat-modern-system-renderer="feedback"]').length,
            managed: document.querySelectorAll('[data-dcat-modern-managed="system.page"]').length,
        })));
        await page.evaluate(async (target) => window.DcatNativeRuntime.pjax(window.Dcat, target), `${exceptionUrl}?cycle=${index}`);
        await page.waitForSelector('[data-dcat-modern-system-renderer="exception"]', { state: 'attached', timeout: 15_000 });
    }
    if (systemCleanup.some((cycle) => cycle.exception || cycle.feedback !== 1 || cycle.managed !== 1)) {
        fail(`b8-system: repeated PJAX cleanup failed: ${JSON.stringify(systemCleanup)}`);
    }

    response = await page.goto(widgetUrl, { waitUntil: 'networkidle' });
    if (!response?.ok()) fail(`b8-widget: cleanup fixture returned HTTP ${response?.status() ?? 'unknown'}.`);
    await page.waitForSelector('[data-widget-variant="dashboard"]', { state: 'attached', timeout: 15_000 });
    const widgetCleanup = [];
    for (let index = 0; index < 3; index += 1) {
        await page.evaluate(async (target) => window.DcatNativeRuntime.pjax(window.Dcat, target), `${widgetUrl}?cycle=${index}`);
        await page.waitForSelector('[data-widget-variant="dashboard"]', { state: 'attached', timeout: 15_000 });
        widgetCleanup.push(await page.evaluate(() => ({
            owners: document.querySelectorAll('[data-dcat-react-component="widget.surface"]').length,
            managed: document.querySelectorAll('[data-dcat-modern-managed="widget.surface"]').length,
            renderers: document.querySelectorAll('[data-dcat-modern-widget-renderer="payload"]').length,
            openDropdowns: Array.from(document.querySelectorAll('[data-dcat-native-widget-dropdown="1"] [role="menu"]')).filter((node) => !node.hasAttribute('hidden')).length,
            openModals: document.querySelectorAll('[data-dcat-modern-widget-compat="modal"].show').length,
            duplicateManagedIds: Array.from(document.querySelectorAll('[id]')).map((node) => node.id).filter((id, index, ids) => id && ids.indexOf(id) !== index),
        })));
    }
    if (widgetCleanup.some((cycle) => cycle.owners !== 4 || cycle.managed !== 4 || cycle.renderers !== 4 || cycle.openDropdowns || cycle.openModals || cycle.duplicateManagedIds.length)) {
        fail(`b8-widget: repeated PJAX cleanup failed: ${JSON.stringify(widgetCleanup)}`);
    }

    const boxCountBeforeRemove = await page.locator('[data-widget-variant="box"]').count();
    await page.locator('[data-widget-variant="box"]').getByRole('button', { name: 'Remove widget' }).click();
    const boxCountAfterRemove = await page.locator('[data-widget-variant="box"]').count();
    if (boxCountBeforeRemove !== 1 || boxCountAfterRemove !== 0) fail(`b8-widget: native remove failed: ${JSON.stringify({ boxCountBeforeRemove, boxCountAfterRemove })}`);

    return { widgetState, widgetControls, dropdownOpen, dropdownSelected, modalOpen, modalClosed, collapsed, narrow, feedback, exceptionState, systemCleanup, widgetCleanup, remove: { before: boxCountBeforeRemove, after: boxCountAfterRemove } };
}

async function verifyModernB8Login(page, baseUrl, adminPrefix, username, password) {
    const fixtureUrl = adminUrl(baseUrl, adminPrefix, '/tests/view-baseline/modern-login');
    const loginPath = `${adminPrefix}/auth/login`;
    const response = await page.goto(fixtureUrl, { waitUntil: 'networkidle' });
    if (!response?.ok()) fail(`b8-login: fixture returned HTTP ${response?.status() ?? 'unknown'}.`);
    await page.waitForSelector('[data-dcat-modern-system-renderer="login"]', { state: 'attached', timeout: 15_000 });
    const initial = await page.locator('[data-dcat-modern-system-renderer="login"]').evaluate((node) => ({
        username: Boolean(node.querySelector('input[name="username"]')),
        password: Boolean(node.querySelector('input[name="password"]')),
        remember: Boolean(node.querySelector('input[name="remember"]')),
        token: Boolean(node.querySelector('input[name="_token"]')?.getAttribute('value')),
        legacyCard: node.querySelectorAll('.card,.card-body,.form-group,.form-control,.btn').length,
        modernCard: node.querySelectorAll('.dcat-modern-card').length,
        pageOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    }));
    if (!initial.username || !initial.password || !initial.remember || !initial.token || initial.legacyCard || initial.modernCard !== 1 || initial.pageOverflow > 1) {
        fail(`b8-login: native login ownership failed: ${JSON.stringify(initial)}`);
    }

    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="password"]').fill('wrong-password');
    await page.locator('input[name="remember"]').check();
    const invalidResponsePromise = page.waitForResponse((candidate) => new URL(candidate.url()).pathname.endsWith(loginPath) && candidate.request().method() === 'POST' && candidate.status() === 422, { timeout: 15_000 });
    await page.locator('#login-form').evaluate((form) => form.requestSubmit());
    await invalidResponsePromise;
    await page.waitForFunction(() => document.querySelector('input[name="username"]')?.getAttribute('aria-invalid') === 'true', null, { timeout: 8_000 });
    const invalid = await page.evaluate(() => ({
        invalid: document.querySelector('input[name="username"]')?.getAttribute('aria-invalid'),
        error: document.querySelector('#login-username-error')?.textContent?.trim() || '',
        remember: document.querySelector('input[name="remember"]')?.checked || false,
        path: location.pathname,
    }));
    if (invalid.invalid !== 'true' || !invalid.error.includes('These credentials') || !invalid.remember || !invalid.path.endsWith('/tests/view-baseline/modern-login')) {
        fail(`b8-login: failed-login contract failed: ${JSON.stringify(invalid)}`);
    }

    await page.locator('input[name="password"]').fill(password);
    const requestPromise = page.waitForRequest((request) => new URL(request.url()).pathname.endsWith(loginPath) && request.method() === 'POST', { timeout: 15_000 });
    const successPromise = page.waitForResponse((candidate) => new URL(candidate.url()).pathname.endsWith(loginPath) && candidate.request().method() === 'POST' && candidate.status() === 200, { timeout: 15_000 });
    await page.locator('#login-form').evaluate((form) => form.requestSubmit());
    const loginRequest = await requestPromise;
    await successPromise;
    await page.waitForURL((url) => !url.pathname.endsWith('/tests/view-baseline/modern-login') && !url.pathname.endsWith('/auth/login'), { timeout: 15_000 });
    const loginBody = loginRequest.postData() || '';
    if (!loginBody.includes('name="remember"') || !loginBody.includes('name="_token"')) {
        fail(`b8-login: remember/CSRF protocol missing from multipart request.`);
    }

    const successPath = new URL(page.url()).pathname;
    await page.goto(`${baseUrl}${adminPrefix}/auth/logout`, { waitUntil: 'networkidle' });
    await page.waitForURL((url) => url.pathname.endsWith('/auth/login'), { timeout: 15_000 });
    const logout = { path: new URL(page.url()).pathname, usernameVisible: await page.locator('input[name="username"]').count() > 0 };
    if (!logout.usernameVisible) fail(`b8-login: logout did not return to login: ${JSON.stringify(logout)}`);

    return { initial, invalid, success: { path: successPath, remember: true, hasToken: true }, logout };
}

async function verifyModernB8ServerFallbacks(context, baseUrl, adminPrefix, username, password) {
    const modernJs = '**/vendor/dcat-admin/modern/assets/*.js';
    const loginPage = await context.newPage();
    await loginPage.route(modernJs, (route) => route.abort());
    const loginUrl = adminUrl(baseUrl, adminPrefix, '/tests/view-baseline/modern-login');
    let response = await loginPage.goto(loginUrl, { waitUntil: 'networkidle' });
    if (!response?.ok()) fail(`b8-fallback: login fixture returned HTTP ${response?.status() ?? 'unknown'}.`);
    const loginFallback = await loginPage.evaluate(() => {
        const root = document.querySelector('.login-page[data-dcat-modern-server-fallback="1"]');
        const form = root?.querySelector('[data-dcat-modern-fallback] #login-form');
        const username = form?.querySelector('input[name="username"]');
        const button = form?.querySelector('button[type="submit"]');
        const rect = username?.getBoundingClientRect();
        return {
            root: Boolean(root),
            form: Boolean(form),
            react: document.querySelectorAll('[data-dcat-modern-system-renderer="login"]').length,
            forcedRendererQuery: new URL(location.href).searchParams.has('__dcat_legacy'),
            usernameVisible: Boolean(rect && rect.width > 100 && rect.height >= 34),
            submitVisible: Boolean(button && button.getBoundingClientRect().height >= 34),
        };
    });
    if (!loginFallback.root || !loginFallback.form || loginFallback.react || loginFallback.forcedRendererQuery || !loginFallback.usernameVisible || !loginFallback.submitVisible) {
        fail(`b8-fallback: login server fallback failed: ${JSON.stringify(loginFallback)}`);
    }

    await loginPage.locator('[data-dcat-modern-fallback] input[name="username"]').fill(username);
    await loginPage.locator('[data-dcat-modern-fallback] input[name="password"]').fill('wrong-password');
    await loginPage.locator('[data-dcat-modern-fallback] input[name="remember"]').check();
    const fallbackInvalidResponse = loginPage.waitForResponse((candidate) => new URL(candidate.url()).pathname.endsWith(`${adminPrefix}/auth/login`) && candidate.request().method() === 'POST' && candidate.status() >= 300 && candidate.status() < 400, { timeout: 15_000 });
    await Promise.all([
        fallbackInvalidResponse,
        loginPage.waitForNavigation({ waitUntil: 'networkidle', timeout: 15_000 }),
        loginPage.locator('[data-dcat-modern-fallback] #login-form button[type="submit"]').click(),
    ]);
    const fallbackInvalid = await loginPage.evaluate(() => ({
        path: location.pathname,
        username: document.querySelector('[data-dcat-modern-fallback] input[name="username"]')?.value || '',
        remember: document.querySelector('[data-dcat-modern-fallback] input[name="remember"]')?.checked || false,
        error: document.querySelector('[data-dcat-modern-fallback] .invalid-feedback')?.textContent?.replace(/\s+/g, ' ').trim() || '',
        forcedRendererQuery: new URL(location.href).searchParams.has('__dcat_legacy'),
    }));
    if (!fallbackInvalid.path.endsWith('/tests/view-baseline/modern-login') || fallbackInvalid.username !== username || !fallbackInvalid.remember || !fallbackInvalid.error || fallbackInvalid.forcedRendererQuery) {
        fail(`b8-fallback: no-JS failed-login redirect contract failed: ${JSON.stringify(fallbackInvalid)}`);
    }

    await loginPage.locator('[data-dcat-modern-fallback] input[name="password"]').fill(password);
    const fallbackSuccessResponse = loginPage.waitForResponse((candidate) => new URL(candidate.url()).pathname.endsWith(`${adminPrefix}/auth/login`) && candidate.request().method() === 'POST' && candidate.status() >= 300 && candidate.status() < 400, { timeout: 15_000 });
    await Promise.all([
        fallbackSuccessResponse,
        loginPage.waitForNavigation({ waitUntil: 'networkidle', timeout: 15_000 }),
        loginPage.locator('[data-dcat-modern-fallback] #login-form button[type="submit"]').click(),
    ]);
    await loginPage.waitForURL((url) => !url.pathname.endsWith('/tests/view-baseline/modern-login') && !url.pathname.endsWith('/auth/login'), { timeout: 15_000 });
    const fallbackSuccess = { path: new URL(loginPage.url()).pathname };
    await loginPage.unroute(modernJs);
    await loginPage.close();

    const exceptionPage = await context.newPage();
    await exceptionPage.route(modernJs, (route) => route.abort());
    const exceptionUrl = adminUrl(baseUrl, adminPrefix, '/tests/view-baseline/modern-system-exception');
    response = await exceptionPage.goto(exceptionUrl, { waitUntil: 'networkidle' });
    if (!response?.ok()) fail(`b8-fallback: exception fixture returned HTTP ${response?.status() ?? 'unknown'}.`);
    const details = exceptionPage.locator('.dcat-system-fallback-exception [data-dcat-modern-fallback] details');
    if (await details.count() !== 1) fail('b8-fallback: exception details fallback missing.');
    const exceptionBefore = await details.evaluate((node) => ({ open: node.open, text: node.textContent?.replace(/\s+/g, ' ').trim() || '' }));
    await details.locator('summary').click();
    const exceptionAfter = await details.evaluate((node) => ({
        open: node.open,
        trace: node.querySelector('pre')?.textContent || '',
        forcedRendererQuery: new URL(location.href).searchParams.has('__dcat_legacy'),
        react: document.querySelectorAll('[data-dcat-modern-system-renderer="exception"]').length,
    }));
    if (exceptionBefore.open || !exceptionAfter.open || !exceptionAfter.trace.includes('#0 fixture():73') || exceptionAfter.forcedRendererQuery || exceptionAfter.react) {
        fail(`b8-fallback: exception server fallback failed: ${JSON.stringify({ exceptionBefore, exceptionAfter })}`);
    }
    await exceptionPage.unroute(modernJs);
    await exceptionPage.close();

    return { login: { initial: loginFallback, invalid: fallbackInvalid, success: fallbackSuccess }, exception: { before: exceptionBefore, after: exceptionAfter } };
}

async function verifyModernTreeNative(page, baseUrl, adminPrefix) {
    const route = '/tests/view-baseline/modern-tree-native';
    const url = adminUrl(baseUrl, adminPrefix, route);
    const treePath = `${adminPrefix}${route}`;
    const forbiddenNestableRequests = [];
    const requestListener = (request) => {
        if (request.url().toLowerCase().includes('nestable')) forbiddenNestableRequests.push(request.url());
    };
    page.on('request', requestListener);

    const open = async () => {
        const response = await page.goto(url, { waitUntil: 'networkidle' });
        if (!response?.ok()) fail(`tree-native: fixture returned HTTP ${response?.status() ?? 'unknown'}.`);
        await page.waitForSelector('[data-dcat-react-component="tree.page"][data-dcat-modern-react-mounted~="tree.page"] [data-dcat-modern-tree-renderer="payload"]', { state: 'attached', timeout: 15_000 });
    };

    await open();
    const payloadText = await page.locator('script[data-dcat-modern-payload="tree.page"]').last().textContent();
    const envelope = payloadText ? JSON.parse(payloadText) : null;
    const payload = envelope?.payload?.data || {};
    const summary = await page.locator('[data-dcat-react-component="tree.page"]').first().evaluate((element, data) => ({
        native: data.native,
        maxDepth: data.maxDepth,
        orderName: data.orderName,
        nodes: (data.nodes || []).map((node) => ({ id: node.id, label: node.label, children: (node.children || []).map((child) => child.id) })),
        slots: (window.__treeSlots || []),
        rendered: Array.from(element.querySelectorAll('[data-tree-node-id]')).map((node) => node.getAttribute('data-tree-node-id')),
        managedNestable: element.querySelectorAll('[data-dcat-modern-managed="tree.page"] .dd').length,
    }), payload);
    summary.slots = (envelope?.payload?.slots || []).map((slot) => slot.id);
    if (!summary.native || summary.maxDepth !== 3 || summary.orderName !== '_order') fail(`tree-native: payload contract failed: ${JSON.stringify(summary)}`);
    if (summary.slots.length || summary.managedNestable) fail(`tree-native: native tree still owns compat/nestable DOM: ${JSON.stringify(summary)}`);
    if (summary.nodes[0]?.id !== '1' || summary.nodes[0]?.children?.[0] !== '3' || summary.nodes[1]?.id !== '2') {
        fail(`tree-native: server node tree changed: ${JSON.stringify(summary.nodes)}`);
    }
    if (forbiddenNestableRequests.length) fail(`tree-native: jquery.nestable requested on native fixture: ${forbiddenNestableRequests.join(', ')}`);

    await page.locator('[aria-label="Collapse all"]').click();
    if (await page.locator('[data-tree-node-id="3"]').count()) fail('tree-native: collapse-all did not hide nested nodes.');
    await page.locator('[aria-label="Expand all"]').click();
    await page.waitForSelector('[data-tree-node-id="3"]', { state: 'attached', timeout: 5_000 });

    await page.locator('[aria-label="Move 2 - Beta up"]').click();
    let rootOrder = await page.locator('[role="tree"] > [role="treeitem"]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-tree-node-id')));
    if (rootOrder.join(',') !== '2,1') fail(`tree-native: move-up failed: ${JSON.stringify(rootOrder)}`);
    await page.locator('[aria-label="Indent 1 - Alpha"]').click();
    rootOrder = await page.locator('[role="tree"] > [role="treeitem"]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-tree-node-id')));
    if (rootOrder.join(',') !== '2' || await page.locator('[data-tree-node-id="2"] [data-tree-node-id="1"] [data-tree-node-id="3"]').count() !== 1) {
        fail(`tree-native: indent/max-depth structure failed: ${JSON.stringify(rootOrder)}`);
    }

    const saveRequestPromise = page.waitForRequest((request) => new URL(request.url()).pathname.endsWith(treePath) && request.method() === 'POST', { timeout: 15_000 });
    const saveResponsePromise = page.waitForResponse((response) => new URL(response.url()).pathname.endsWith(treePath) && response.status() === 200 && response.request().method() === 'POST', { timeout: 15_000 });
    await page.locator('[aria-label="Save tree order"]').click();
    const saveRequest = await saveRequestPromise;
    const saveResponse = await saveResponsePromise;
    const saveJson = await saveResponse.json();
    const formBody = new URLSearchParams(saveRequest.postData() || '');
    const savedOrder = JSON.parse(String(formBody.get('_order') || '[]'));
    const expectedOrder = [{ id: '2', children: [{ id: '1', children: [{ id: '3' }] }] }];
    if (!formBody.get('_token') || JSON.stringify(savedOrder) !== JSON.stringify(expectedOrder) || JSON.stringify(saveJson.order) !== JSON.stringify(expectedOrder)) {
        fail(`tree-native: save-order protocol failed: ${JSON.stringify({ savedOrder, response: saveJson.order, hasToken: Boolean(formBody.get('_token')) })}`);
    }

    await page.goto(`${url}?tree_probe=keep`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-dcat-modern-tree-renderer="payload"]', { state: 'attached', timeout: 15_000 });
    const refreshResponse = page.waitForResponse((response) => {
        const target = new URL(response.url());
        return target.pathname.endsWith(treePath) && target.searchParams.get('tree_probe') === 'keep'
            && response.request().method() === 'GET' && response.status() === 200;
    }, { timeout: 15_000 });
    await page.locator('[aria-label="Refresh tree"]').click();
    await refreshResponse;
    await page.waitForSelector('[data-dcat-modern-tree-renderer="payload"]', { state: 'attached', timeout: 15_000 });

    const otherUrl = adminUrl(baseUrl, adminPrefix, '/tests/view-baseline/modern-show-resource');
    const cleanup = [];
    for (let index = 0; index < 3; index += 1) {
        await page.evaluate(async (target) => window.DcatNativeRuntime.pjax(window.Dcat, target), otherUrl);
        await page.waitForSelector('[data-show-resource-list="1"]', { state: 'attached', timeout: 15_000 });
        cleanup.push(await page.evaluate(() => ({
            treeRoots: document.querySelectorAll('[data-dcat-modern-tree-renderer="payload"]').length,
            treeNodes: document.querySelectorAll('[data-tree-node-id]').length,
            nestable: document.querySelectorAll('.dd[data-dcat-modern-family="tree"]').length,
        })));
        await page.evaluate(async (target) => window.DcatNativeRuntime.pjax(window.Dcat, target), url);
        await page.waitForSelector('[data-dcat-modern-tree-renderer="payload"]', { state: 'attached', timeout: 15_000 });
    }
    if (cleanup.some((cycle) => cycle.treeRoots || cycle.treeNodes || cycle.nestable)) fail(`tree-native: PJAX cleanup leak: ${JSON.stringify(cleanup)}`);

    await page.setViewportSize({ width: 390, height: 844 });
    await open();
    const narrow = await page.evaluate(() => {
        const tree = document.querySelector('[data-dcat-modern-tree-renderer="payload"]');
        const buttons = Array.from(tree?.querySelectorAll('button:not(:disabled), a[href]') || []);
        return {
            pageOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
            contentOverflow: Math.max(0, (document.querySelector('.content-wrapper')?.scrollWidth || 0) - (document.querySelector('.content-wrapper')?.clientWidth || 0)),
            treeOverflow: tree ? Math.max(0, tree.scrollWidth - tree.clientWidth) : -1,
            unnamed: buttons.filter((node) => !node.getAttribute('aria-label') && !node.textContent?.trim()).length,
            undersized: buttons.filter((node) => {
                const rect = node.getBoundingClientRect();
                return rect.width < 44 || rect.height < 44;
            }).map((node) => ({
                label: node.getAttribute('aria-label') || node.textContent?.trim(),
                width: Math.round(node.getBoundingClientRect().width),
                height: Math.round(node.getBoundingClientRect().height),
            })),
        };
    });
    if (narrow.pageOverflow > 1 || narrow.contentOverflow > 1 || narrow.treeOverflow > 1 || narrow.unnamed || narrow.undersized.length) {
        fail(`tree-native: narrow viewport/accessibility failed: ${JSON.stringify(narrow)}`);
    }
    if (forbiddenNestableRequests.length) fail(`tree-native: jquery.nestable requested after lifecycle checks: ${forbiddenNestableRequests.join(', ')}`);
    page.off('request', requestListener);
    return { summary, savedOrder, cleanup, narrow, forbiddenNestableRequests: forbiddenNestableRequests.length };
}

async function verifyModernShowNative(page, baseUrl, adminPrefix) {
    const route = '/tests/view-baseline/modern-show-native';
    const url = adminUrl(baseUrl, adminPrefix, route);
    const resourcePath = `${adminPrefix}/tests/view-baseline/modern-show-resource`;
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    if (!response?.ok()) fail(`show-native: fixture returned HTTP ${response?.status() ?? 'unknown'}.`);
    await page.waitForSelector('[data-dcat-react-component="show.detail"][data-dcat-modern-react-mounted~="show.detail"] [data-dcat-modern-show-renderer="payload"]', { state: 'attached', timeout: 15_000 });

    const payloadText = await page.locator('script[data-dcat-modern-payload="show.detail"]').last().textContent();
    const payloadEnvelope = payloadText ? JSON.parse(payloadText) : null;
    const payloadData = payloadEnvelope?.payload?.data || {};
    const payloadSlots = payloadEnvelope?.payload?.slots || [];
    const summary = await page.locator('[data-dcat-react-component="show.detail"]').first().evaluate((element, payload) => {
        const data = payload.data || {};
        return {
            standardPanel: data.standardPanel,
            fields: (data.fields || []).map((field) => `${field.name}:${field.renderer}`),
            actions: (data.panel?.actions || []).map((action) => action.action),
            slots: (payload.slots || []).map((slot) => slot.id),
            nativeValues: Array.from(element.querySelectorAll('[data-dcat-modern-show-field="native"]')).map((field) => ({
                name: field.getAttribute('data-show-field'),
                value: field.querySelector('[data-show-value]')?.textContent?.trim() || '',
            })),
            formatter: element.querySelector('[data-show-formatter="compat"]')?.textContent?.trim() || '',
            primaryCompatVisible: Boolean(element.querySelector('[data-dcat-modern-managed="show.detail"] [data-dcat-modern-slot="show-primary"]')),
        };
    }, { data: payloadData, slots: payloadSlots });
    if (!summary.standardPanel) fail(`show-native: default panel did not stay payload-native: ${JSON.stringify(summary)}`);
    for (const expected of ['id:native', 'username:native', 'name:native', 'formatted:compat']) {
        if (!summary.fields.includes(expected)) fail(`show-native: field ownership missing ${expected}: ${JSON.stringify(summary.fields)}`);
    }
    for (const action of ['list', 'edit', 'delete']) {
        if (!summary.actions.includes(action)) fail(`show-native: built-in action missing ${action}: ${JSON.stringify(summary.actions)}`);
    }
    if (summary.slots.includes('show-primary') || !summary.slots.includes('show-field-3')) {
        fail(`show-native: compat slots are not field-scoped: ${JSON.stringify(summary.slots)}`);
    }
    if (!summary.nativeValues.some((item) => item.name === 'username' && item.value.includes('payload-user')) || summary.formatter !== 'formatter-value' || summary.primaryCompatVisible) {
        fail(`show-native: payload/formatter render failed: ${JSON.stringify(summary)}`);
    }

    const listHref = await page.locator('[data-show-action="list"]').getAttribute('href');
    const editHref = await page.locator('[data-show-action="edit"]').getAttribute('href');
    if (!listHref?.endsWith(resourcePath) || !editHref?.endsWith(`${resourcePath}/42/edit`)) {
        fail(`show-native: action URLs changed: ${JSON.stringify({ listHref, editHref })}`);
    }

    await page.locator('[data-show-action="edit"]').click();
    await page.waitForSelector('[data-show-edit-id="42"]', { state: 'attached', timeout: 15_000 });
    await page.evaluate(async (target) => window.DcatNativeRuntime.pjax(window.Dcat, target), url);
    await page.waitForSelector('[data-dcat-modern-show-renderer="payload"] [data-show-action="delete"]', { state: 'attached', timeout: 15_000 });

    await page.locator('[data-show-action="delete"]').click();
    await page.waitForSelector('dialog.dcat-modern-confirm-dialog[open]', { state: 'attached', timeout: 8_000 });
    const deleteRequestPromise = page.waitForRequest((request) => new URL(request.url()).pathname.endsWith(`${resourcePath}/42`) && request.method() === 'POST', { timeout: 15_000 });
    const deleteResponsePromise = page.waitForResponse((candidate) => new URL(candidate.url()).pathname.endsWith(`${resourcePath}/42`) && candidate.status() === 200, { timeout: 15_000 });
    await page.locator('dialog.dcat-modern-confirm-dialog button[value="confirm"]').click();
    const deleteRequest = await deleteRequestPromise;
    const deleteResponse = await deleteResponsePromise;
    const deleteJson = await deleteResponse.json();
    const deleteBody = deleteRequest.postData() || '';
    if (!deleteBody.includes('_method=DELETE') || !deleteBody.includes('_token=') || deleteJson.method !== 'DELETE') {
        fail(`show-native: delete protocol changed: ${JSON.stringify({ deleteBody, deleteJson })}`);
    }
    await page.waitForURL((candidate) => candidate.pathname.endsWith(`${adminPrefix}/tests/view-baseline/modern-show-native`) && candidate.searchParams.get('deleted') === '42', { timeout: 15_000 });
    await page.waitForSelector('[data-dcat-modern-show-renderer="payload"]', { state: 'attached', timeout: 15_000 });

    const otherUrl = adminUrl(baseUrl, adminPrefix, '/tests/view-baseline/modern-show-resource');
    const cleanup = [];
    for (let index = 0; index < 3; index += 1) {
        await page.evaluate(async (target) => window.DcatNativeRuntime.pjax(window.Dcat, target), otherUrl);
        await page.waitForSelector('[data-show-resource-list="1"]', { state: 'attached', timeout: 15_000 });
        cleanup.push(await page.evaluate(() => ({
            showRoots: document.querySelectorAll('[data-dcat-modern-show-renderer="payload"]').length,
            formatterNodes: document.querySelectorAll('[data-show-formatter="compat"]').length,
        })));
        await page.evaluate(async (target) => window.DcatNativeRuntime.pjax(window.Dcat, target), url);
        await page.waitForSelector('[data-dcat-modern-show-renderer="payload"]', { state: 'attached', timeout: 15_000 });
    }
    if (cleanup.some((cycle) => cycle.showRoots || cycle.formatterNodes)) fail(`show-native: PJAX cleanup leak: ${JSON.stringify(cleanup)}`);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-dcat-modern-show-renderer="payload"]', { state: 'attached', timeout: 15_000 });
    const narrow = await page.evaluate(() => {
        const show = document.querySelector('[data-dcat-modern-show-renderer="payload"]');
        return {
            pageOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
            contentOverflow: Math.max(0, (document.querySelector('.content-wrapper')?.scrollWidth || 0) - (document.querySelector('.content-wrapper')?.clientWidth || 0)),
            showOverflow: show ? Math.max(0, show.scrollWidth - show.clientWidth) : -1,
            unnamedActions: Array.from(document.querySelectorAll('[data-show-action]')).filter((node) => !node.getAttribute('aria-label') && !node.textContent?.trim()).length,
        };
    });
    if (narrow.pageOverflow > 1 || narrow.contentOverflow > 1 || narrow.showOverflow > 1 || narrow.unnamedActions) {
        fail(`show-native: narrow viewport/accessibility failed: ${JSON.stringify(narrow)}`);
    }

    return { summary, deleteMethod: deleteJson.method, cleanup, narrow };
}

async function verifyModernFormAdvancedOptional(page, baseUrl, adminPrefix) {
    const route = '/tests/view-baseline/modern-form-advanced-optional';
    const url = adminUrl(baseUrl, adminPrefix, route);
    const probePath = `${adminPrefix}/tests/view-baseline/modern-form-probe`;
    const mapStub = `(() => {
        const listeners = new WeakMap();
        window.__dcatMapCreated = 0;
        window.__dcatMapDestroyed = 0;
        window.__dcatMapCleared = 0;
        function bucket(target) {
            let value = listeners.get(target);
            if (!value) { value = new Map(); listeners.set(target, value); }
            return value;
        }
        class LatLng {
            constructor(lat, lng) { this._lat = Number(lat || 0); this._lng = Number(lng || 0); }
            lat() { return this._lat; }
            lng() { return this._lng; }
        }
        class GoogleMap {
            constructor(element, options) { this.element = element; this.options = options; window.__dcatMapCreated += 1; }
        }
        class Marker {
            constructor(options) { this.position = options.position; this.map = options.map; window.__dcatMapMarker = this; }
            setMap(map) { this.map = map; if (map === null) window.__dcatMapDestroyed += 1; }
        }
        const event = {
            addListener(target, name, callback) {
                const events = bucket(target);
                const callbacks = events.get(name) || [];
                callbacks.push(callback);
                events.set(name, callbacks);
                return { remove() { events.set(name, callbacks.filter((item) => item !== callback)); } };
            },
            clearInstanceListeners(target) { listeners.delete(target); window.__dcatMapCleared += 1; },
        };
        window.__dcatMapTrigger = (target, name, payload) => (bucket(target).get(name) || []).forEach((callback) => callback(payload));
        window.google = { maps: { LatLng, Map: GoogleMap, Marker, MapTypeId: { ROADMAP: 'roadmap' }, event } };
    })();`;
    await page.route('**maps.googleapis.com/**', async (requestRoute) => {
        await requestRoute.fulfill({ status: 200, contentType: 'application/javascript', body: mapStub });
    });

    const open = async (suffix = '') => {
        const response = await page.goto(`${url}${suffix}`, { waitUntil: 'networkidle' });
        if (!response?.ok()) fail(`form-advanced-optional: fixture returned HTTP ${response?.status() ?? 'unknown'}.`);
        await page.waitForSelector('form[data-dcat-modern-react-mounted~="form.basic"] input[name="optional_lat"]', { state: 'attached', timeout: 15_000 });
        return page.locator('form[data-dcat-react-component="form.basic"]').first();
    };

    const form = await open();
    const state = await form.evaluate((element) => {
        const script = element.querySelector('script[data-dcat-modern-payload="form.basic"]');
        const envelope = script?.textContent ? JSON.parse(script.textContent) : null;
        const fields = envelope?.payload?.data?.fields || [];
        const captcha = element.querySelector('.field-refresh-captcha');
        return {
            fields: fields.map((field) => `${field.fieldType}:${field.renderer}`),
            islands: element.querySelectorAll('[data-dcat-modern-legacy-field]').length,
            lat: element.querySelector('input[name="optional_lat"]')?.value || '',
            lng: element.querySelector('input[name="optional_lng"]')?.value || '',
            captcha: Boolean(captcha),
            captchaSrc: captcha?.getAttribute('src') || '',
            mapCreated: window.__dcatMapCreated || 0,
        };
    });
    if (!state.fields.includes('Map:compat') || !state.fields.includes('Captcha:compat') || state.islands < 2 || !state.captcha || state.mapCreated !== 1) {
        fail(`form-advanced-optional: ownership/init failed: ${JSON.stringify(state)}`);
    }

    await page.evaluate(() => {
        const marker = window.__dcatMapMarker;
        const position = new window.google.maps.LatLng(-36.85, 174.77);
        window.__dcatMapTrigger(marker, 'dragend', { latLng: position });
    });
    const mapInteraction = await form.evaluate((element) => ({
        lat: element.querySelector('input[name="optional_lat"]')?.value || '',
        lng: element.querySelector('input[name="optional_lng"]')?.value || '',
    }));
    if (mapInteraction.lat !== '-36.85' || mapInteraction.lng !== '174.77') {
        fail(`form-advanced-optional: Map drag protocol failed: ${JSON.stringify(mapInteraction)}`);
    }

    const captchaImage = form.locator('.field-refresh-captcha');
    const captchaBefore = await captchaImage.getAttribute('src');
    await captchaImage.click();
    const captchaAfter = await captchaImage.getAttribute('src');
    if (!captchaBefore || !captchaAfter || captchaAfter === captchaBefore || !captchaAfter.includes('?')) {
        fail(`form-advanced-optional: Captcha refresh failed: ${JSON.stringify({ captchaBefore, captchaAfter })}`);
    }

    const captchaInput = form.locator('input[name="__captcha__"]');
    await captchaInput.fill('server-error');
    const validationResponse = page.waitForResponse((candidate) => new URL(candidate.url()).pathname.endsWith(probePath) && candidate.status() === 422, { timeout: 15_000 });
    await form.evaluate((element) => element.requestSubmit());
    await validationResponse;
    await page.waitForFunction(() => document.querySelector('input[name="__captcha__"]')?.getAttribute('aria-invalid') === 'true', null, { timeout: 8_000 });
    const validation = await captchaInput.evaluate((element) => ({
        invalid: element.getAttribute('aria-invalid'),
        active: document.activeElement === element,
        message: element.closest('.form-group')?.querySelector('.with-errors')?.textContent?.trim() || '',
    }));
    if (validation.invalid !== 'true' || !validation.active || !validation.message.includes('captcha')) {
        fail(`form-advanced-optional: Captcha 422 contract failed: ${JSON.stringify(validation)}`);
    }
    await captchaInput.fill('fixture-captcha');

    const successRequestPromise = page.waitForRequest((request) => new URL(request.url()).pathname.endsWith(probePath), { timeout: 15_000 });
    const successResponsePromise = page.waitForResponse((candidate) => new URL(candidate.url()).pathname.endsWith(probePath) && candidate.status() === 200, { timeout: 15_000 });
    await form.evaluate((element) => element.requestSubmit());
    const successRequest = await successRequestPromise;
    await successResponsePromise;
    const submitBody = successRequest.postData() || '';
    for (const witness of ['optional_lat', 'optional_lng', '__captcha__']) {
        if (!submitBody.includes(`name="${witness}"`)) fail(`form-advanced-optional: submit body missing ${witness}.`);
    }

    const editForm = await open('?edit=1');
    const edit = await editForm.evaluate((element) => ({
        method: element.method.toUpperCase(),
        spoof: element.querySelector('input[name="_method"]')?.value || '',
    }));
    if (edit.method !== 'POST' || edit.spoof !== 'PUT') fail(`form-advanced-optional: edit method contract failed: ${JSON.stringify(edit)}`);

    const basicUrl = adminUrl(baseUrl, adminPrefix, '/tests/view-baseline/modern-form-basic');
    const cleanupCycles = [];
    for (let index = 0; index < 3; index += 1) {
        const destroyedBefore = await page.evaluate(() => window.__dcatMapDestroyed || 0);
        await page.evaluate(async (target) => window.DcatNativeRuntime.pjax(window.Dcat, target), basicUrl);
        await page.waitForSelector('form[data-dcat-modern-react-mounted~="form.basic"] input[name="username"]', { state: 'attached', timeout: 15_000 });
        cleanupCycles.push(await page.evaluate((before) => ({
            optionalFields: document.querySelectorAll('input[name="optional_lat"],input[name="optional_lng"],input[name="__captcha__"]').length,
            destroyedDelta: (window.__dcatMapDestroyed || 0) - before,
            mapContainers: document.querySelectorAll('.form-map[id]').length,
        }), destroyedBefore));
        await page.evaluate(async (target) => window.DcatNativeRuntime.pjax(window.Dcat, target), url);
        await page.waitForSelector('form[data-dcat-modern-react-mounted~="form.basic"] input[name="optional_lat"]', { state: 'attached', timeout: 15_000 });
    }
    if (cleanupCycles.some((cycle) => cycle.optionalFields || cycle.destroyedDelta < 1 || cycle.mapContainers)) {
        fail(`form-advanced-optional: repeated PJAX cleanup failed: ${JSON.stringify(cleanupCycles)}`);
    }

    await page.unroute('**maps.googleapis.com/**');
    return { state, mapInteraction, validation, edit, cleanupCycles };
}

async function verifyModernFormAdvancedVendor(page, baseUrl, adminPrefix) {
    const route = '/tests/view-baseline/modern-form-advanced-vendor';
    const url = adminUrl(baseUrl, adminPrefix, route);
    const probePath = `${adminPrefix}/tests/view-baseline/modern-form-probe`;
    const uploadAttempts = [];

    await page.route(`**${probePath}`, async (routeHandle) => {
        const request = routeHandle.request();
        const contentType = request.headers()['content-type'] || '';
        const bodyBuffer = request.postDataBuffer();
        const bodyText = bodyBuffer ? bodyBuffer.toString('latin1') : '';
        const isUploader = contentType.includes('multipart/form-data') && bodyText.includes('name="_file_"');
        if (!isUploader) {
            await routeHandle.continue();
            return;
        }

        uploadAttempts.push({
            uploadColumn: /name="upload_column"\r\n\r\n([^\r]+)/.exec(bodyText)?.[1] || '',
            hasToken: bodyText.includes('name="_token"'),
            hasUploadId: bodyText.includes('name="_id"'),
            hasFile: bodyText.includes('name="_file_"'),
        });
        if (uploadAttempts.length === 1) {
            await routeHandle.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: false, message: 'Synthetic upload failure' }),
            });
            return;
        }
        await routeHandle.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: true,
                data: { id: 'modern-vendor/test.jpg', name: 'test.jpg', path: 'test.jpg', url: null },
            }),
        });
    });

    const open = async () => {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
        if (!response?.ok()) {
            const body = response ? await response.text() : '';
            fail(`form-advanced-vendor: HTTP ${response?.status() ?? 'unknown'}: ${body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 900)}`);
        }
        await page.waitForSelector('form[data-dcat-react-component="form.basic"][data-dcat-modern-react-mounted~="form.basic"]', { state: 'attached', timeout: 20_000 });
        await page.waitForTimeout(1800);
        const initState = await page.evaluate(() => {
            const form = document.querySelector('form[data-dcat-react-component="form.basic"]');
            const textarea = form?.querySelector('textarea[name="vendor_editor"]');
            const editorId = textarea?.id || '';
            const slider = form?.querySelector('input[name="vendor_slider"]');
            const tags = form?.querySelector('select[name="vendor_tags[]"]');
            const tree = form?.querySelector('.da-tree');
            return {
                form: Boolean(form),
                tinymce: Boolean(editorId && window.tinymce?.get?.(editorId)),
                slider: Boolean(slider && (window.jQuery?.(slider).data('isActive') || slider.parentElement?.querySelector('.irs'))),
                select2: Boolean(tags && window.jQuery?.(tags).data('select2')),
                tree: Boolean(tree && window.jQuery?.jstree?.reference?.(tree)),
                markdown: Boolean(form?.querySelector('.editormd')),
                uploader: Boolean(form?.querySelector('input.webuploader-element-invisible[type="file"]')),
                pageText: document.body?.innerText?.replace(/\s+/g, ' ').trim().slice(0, 240) || '',
            };
        });
        const requiredInit = ['tinymce', 'slider', 'select2', 'tree', 'markdown', 'uploader'];
        if (requiredInit.some((key) => !initState[key])) {
            fail(`form-advanced-vendor: vendor initialization incomplete: ${JSON.stringify(initState)}`);
        }
        return page.locator('form[data-dcat-react-component="form.basic"]').first();
    };

    const form = await open();
    const ownership = await form.evaluate((element) => {
        const script = element.querySelector('script[data-dcat-modern-payload="form.basic"]');
        const envelope = script?.textContent ? JSON.parse(script.textContent) : null;
        const fields = envelope?.payload?.data?.fields || [];
        return {
            count: fields.length,
            compatTypes: fields.filter((field) => field.renderer === 'compat').map((field) => field.fieldType),
            nativeTypes: fields.filter((field) => field.renderer === 'native').map((field) => field.fieldType),
            islands: element.querySelectorAll('[data-dcat-modern-legacy-field]').length,
        };
    });
    const expectedTypes = ['Autocomplete', 'Editor', 'File', 'Image', 'MultipleFile', 'MultipleImage', 'Icon', 'Markdown', 'Slider', 'Tags', 'Tree'];
    if (ownership.count !== expectedTypes.length || ownership.nativeTypes.length || ownership.islands !== expectedTypes.length) {
        fail(`form-advanced-vendor: scoped compat ownership failed: ${JSON.stringify(ownership)}`);
    }
    for (const type of expectedTypes) if (!ownership.compatTypes.includes(type)) fail(`form-advanced-vendor: missing ${type} compat payload.`);

    const autocomplete = form.locator('input[name="vendor_autocomplete"]');
    await autocomplete.fill('Be');
    await page.waitForSelector('.autocomplete-suggestions .autocomplete-suggestion', { timeout: 8_000 });
    await page.locator('.autocomplete-suggestions .autocomplete-suggestion').first().click();
    if (await autocomplete.inputValue() !== 'Beta') fail('form-advanced-vendor: autocomplete interaction failed.');

    const editorState = await form.locator('textarea[name="vendor_editor"]').evaluate((element) => {
        const editor = window.tinymce.get(element.id);
        editor.setContent('<p>Edited vendor content</p>');
        editor.fire('Change');
        return { exists: Boolean(editor), value: element.value };
    });
    if (!editorState.exists || !editorState.value.includes('Edited vendor content')) fail(`form-advanced-vendor: TinyMCE interaction failed: ${JSON.stringify(editorState)}`);

    const pluginState = await form.evaluate((element) => {
        const slider = element.querySelector('input[name="vendor_slider"]');
        window.jQuery(slider).ionRangeSlider('update', { from: 55 });
        const tags = element.querySelector('select[name="vendor_tags[]"]');
        window.jQuery(tags).val(['alpha', 'beta']).trigger('change');
        const tree = element.querySelector('.da-tree');
        const treeInstance = window.jQuery.jstree.reference(tree);
        treeInstance.select_node('3');
        return {
            slider: String(slider.value || slider.getAttribute('data-from') || ''),
            tags: window.jQuery(tags).val() || [],
            tree: element.querySelector('input[name="vendor_tree"]')?.value || '',
            markdown: Boolean(element.querySelector('.editormd')),
            iconpicker: Boolean(window.jQuery(element.querySelector('input[name="vendor_icon"]')).data('iconpicker')),
        };
    });
    if (!pluginState.tags.includes('beta') || !pluginState.tree.includes('3') || !pluginState.markdown) {
        fail(`form-advanced-vendor: vendor plugin interaction failed: ${JSON.stringify(pluginState)}`);
    }

    const uploadGroup = form.locator('input[name="vendor_file"]').locator('xpath=ancestor::*[contains(@class,"form-group")][1]');
    const fileInput = uploadGroup.locator('input.webuploader-element-invisible[type="file"]').first();
    await fileInput.setInputFiles(path.join(root, 'tests/resources/assets/test.jpg'));
    await uploadGroup.locator('.upload-btn').click();
    await page.waitForFunction(() => document.querySelector('.web-uploader .info .retry'), null, { timeout: 10_000 });
    await uploadGroup.locator('.info .retry').click();
    await page.waitForFunction(() => (document.querySelector('input[name="vendor_file"]')?.value || '').includes('modern-vendor/test.jpg'), null, { timeout: 12_000 });
    const uploadedValue = await form.locator('input[name="vendor_file"]').inputValue();
    if (uploadAttempts.length < 2 || uploadAttempts.some((attempt) => attempt.uploadColumn !== 'vendor_file' || !attempt.hasToken || !attempt.hasUploadId || !attempt.hasFile)) {
        fail(`form-advanced-vendor: WebUploader request protocol failed: ${JSON.stringify(uploadAttempts)}`);
    }

    const basicUrl = adminUrl(baseUrl, adminPrefix, '/tests/view-baseline/modern-form-basic');
    const staleSelector = [
        'body > .autocomplete-suggestions',
        'body > .select2-container',
        'body > .iconpicker-popover',
        '.tox-tinymce-aux',
        '.mce-floatpanel',
    ].join(',');
    const cleanupCycles = [];
    for (let index = 0; index < 3; index += 1) {
        await page.evaluate(async (target) => window.DcatNativeRuntime.pjax(window.Dcat, target), basicUrl);
        await page.waitForSelector('form[data-dcat-modern-react-mounted~="form.basic"] input[name="username"]', { state: 'attached', timeout: 15_000 });
        cleanupCycles.push(await page.evaluate((selector) => ({
            stale: document.querySelectorAll(selector).length,
            autocomplete: document.querySelectorAll('body > .autocomplete-suggestions').length,
            select2: document.querySelectorAll('body > .select2-container').length,
            iconpicker: document.querySelectorAll('body > .iconpicker-popover').length,
            tinyAux: document.querySelectorAll('.tox-tinymce-aux').length,
            tinyFloat: document.querySelectorAll('.mce-floatpanel').length,
            nodes: Array.from(document.querySelectorAll(selector)).slice(0, 12).map((node) => `${node.tagName}.${node.className}`),
        }), staleSelector));
        await page.evaluate(async (target) => window.DcatNativeRuntime.pjax(window.Dcat, target), url);
        await page.waitForSelector('form[data-dcat-modern-react-mounted~="form.basic"] input[name="vendor_autocomplete"]', { state: 'attached', timeout: 20_000 });
    }
    if (cleanupCycles.some((cycle) => cycle.stale)) fail(`form-advanced-vendor: stale body plugin nodes after PJAX: ${JSON.stringify(cleanupCycles)}`);

    await page.evaluate(async (target) => window.DcatNativeRuntime.pjax(window.Dcat, target), basicUrl);
    await page.waitForSelector('form[data-dcat-modern-react-mounted~="form.basic"] input[name="username"]', { state: 'attached', timeout: 15_000 });
    const cleanup = await page.evaluate((selector) => ({
        stale: document.querySelectorAll(selector).length,
        autocomplete: document.querySelectorAll('.autocomplete-suggestions').length,
        vendorForms: document.querySelectorAll('input[name="vendor_autocomplete"]').length,
    }), staleSelector);
    if (cleanup.stale || cleanup.autocomplete || cleanup.vendorForms) fail(`form-advanced-vendor: final cleanup failed: ${JSON.stringify(cleanup)}`);

    await page.unroute(`**${probePath}`);
    return { fields: ownership.count, pluginState, uploadAttempts, uploadedValue, cleanupCycles, cleanup };
}

async function verifyModernFormAdvancedNative(page, baseUrl, adminPrefix) {
    const route = '/tests/view-baseline/modern-form-advanced-native';
    const url = adminUrl(baseUrl, adminPrefix, route);
    const probePath = `${adminPrefix}/tests/view-baseline/modern-form-probe`;
    const forbiddenTerms = ['bootstrap-datetimepicker', 'bootstrap-duallistbox', 'colorpicker', 'jquery.inputmask', 'select2'];
    const forbiddenPluginRequests = [];
    const probeRequests = [];
    const requestListener = (request) => {
        const requestUrl = request.url().toLowerCase();
        if (forbiddenTerms.some((term) => requestUrl.includes(term))) forbiddenPluginRequests.push(request.url());
        if (new URL(request.url()).pathname.endsWith(probePath)) probeRequests.push(request);
    };
    page.on('request', requestListener);

    const open = async (suffix = '') => {
        const response = await page.goto(`${url}${suffix}`, { waitUntil: 'networkidle' });
        if (!response?.ok()) {
            const body = response ? await response.text() : '';
            const diagnostic = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 900);
            fail(`form-advanced-native: fixture returned HTTP ${response?.status() ?? 'unknown'}: ${diagnostic}`);
        }
        await page.waitForSelector('form[data-dcat-react-component="form.basic"][data-dcat-modern-react-mounted~="form.basic"]', { state: 'attached', timeout: 15_000 });
        return page.locator('form[data-dcat-react-component="form.basic"]').first();
    };

    const form = await open();
    const summary = await form.evaluate((element) => {
        const script = element.querySelector('script[data-dcat-modern-payload="form.basic"]');
        const envelope = script?.textContent ? JSON.parse(script.textContent) : null;
        const fields = envelope?.payload?.data?.fields || [];
        const duplicateIds = Array.from(element.querySelectorAll('[id]'))
            .map((node) => node.id)
            .filter((id, index, all) => id && all.indexOf(id) !== index);
        return {
            fields: fields.length,
            native: fields.filter((field) => field.renderer === 'native').length,
            compat: fields.filter((field) => field.renderer !== 'native').map((field) => field.fieldType),
            fieldTypes: fields.map((field) => field.fieldType),
            kinds: fields.map((field) => field.control?.kind || ''),
            legacyIslands: element.querySelectorAll('[data-dcat-modern-legacy-field]').length,
            duplicateIds,
            currencyAffix: element.querySelector('input[name="adv_currency"]')?.parentElement?.textContent?.replace(/\s+/g, ' ').trim() || '',
            rateAffix: element.querySelector('input[name="adv_rate"]')?.parentElement?.textContent?.replace(/\s+/g, ' ').trim() || '',
            timezone: element.querySelector('select[name="adv_timezone"]')?.value || '',
            multiple: Array.from(element.querySelectorAll('select[name="adv_multiple[]"] option:checked')).map((option) => option.value),
            listbox: Array.from(element.querySelectorAll('input[name="adv_listbox[]"]')).map((input) => input.value).filter(Boolean),
            rangeNames: Array.from(element.querySelectorAll('[data-dcat-modern-native-control="range-pair"] input')).map((input) => input.name),
        };
    });
    const expectedTypes = ['Currency', 'Decimal', 'Ip', 'Mobile', 'Rate', 'Datetime', 'Month', 'Year', 'Color', 'MultipleSelect', 'Listbox', 'Timezone', 'Range', 'DateRange', 'DatetimeRange', 'TimeRange'];
    if (summary.fields !== expectedTypes.length || summary.native !== expectedTypes.length || summary.compat.length || summary.legacyIslands) {
        fail(`form-advanced-native: payload ownership failed: ${JSON.stringify(summary)}`);
    }
    for (const fieldType of expectedTypes) {
        if (!summary.fieldTypes.includes(fieldType)) fail(`form-advanced-native: missing ${fieldType} payload.`);
    }
    for (const kind of ['input', 'color', 'select', 'dual-list', 'range-pair']) {
        if (!summary.kinds.includes(kind)) fail(`form-advanced-native: missing native ${kind} renderer: ${JSON.stringify(summary.kinds)}`);
    }
    if (summary.duplicateIds.length || !summary.currencyAffix.includes('NZ$') || !summary.rateAffix.includes('%') || summary.timezone !== 'Pacific/Auckland') {
        fail(`form-advanced-native: stable identity/affix/timezone contract failed: ${JSON.stringify(summary)}`);
    }
    if (!summary.multiple.includes('a') || !summary.multiple.includes('c') || !summary.listbox.includes('green')) {
        fail(`form-advanced-native: initial multi-value contract failed: ${JSON.stringify(summary)}`);
    }
    const expectedRangeNames = ['adv_range_start', 'adv_range_end', 'adv_date_start', 'adv_date_end', 'adv_datetime_start', 'adv_datetime_end', 'adv_time_start', 'adv_time_end'];
    if (expectedRangeNames.some((name) => !summary.rangeNames.includes(name))) {
        fail(`form-advanced-native: range names changed: ${JSON.stringify(summary.rangeNames)}`);
    }
    if (forbiddenPluginRequests.length) fail(`form-advanced-native: forbidden plugin requests: ${forbiddenPluginRequests.join(', ')}`);

    await form.locator('select[name="adv_multiple[]"]').selectOption(['a', 'b']);
    const availableList = form.locator('[data-dcat-modern-native-control="dual-list"] select').first();
    await availableList.selectOption('blue');
    await form.locator('[data-dcat-modern-native-control="dual-list"] button[aria-label="Add selected options"]').click();
    await form.locator('input[name="adv_color"]').fill('#485A98');
    await form.locator('input[name="adv_date_start"]').fill('2026-09-02');
    const rangeBounds = await form.evaluate((element) => ({
        start: element.querySelector('input[name="adv_date_start"]')?.value || '',
        endMin: element.querySelector('input[name="adv_date_end"]')?.min || '',
    }));
    if (rangeBounds.start !== '2026-09-02' || rangeBounds.endMin !== '2026-09-02') {
        fail(`form-advanced-native: native range bound contract failed: ${JSON.stringify(rangeBounds)}`);
    }

    const ip = form.locator('input[name="adv_ip"]');
    await ip.fill('server-error');
    const validationResponse = page.waitForResponse((response) => new URL(response.url()).pathname.endsWith(probePath) && response.status() === 422, { timeout: 15_000 });
    await form.evaluate((element) => element.requestSubmit());
    await validationResponse;
    await page.waitForFunction(() => document.querySelector('input[name="adv_ip"]')?.getAttribute('aria-invalid') === 'true', null, { timeout: 8_000 });
    const serverError = await ip.evaluate((element) => ({
        invalid: element.getAttribute('aria-invalid'),
        active: document.activeElement === element,
        message: element.closest('.form-group')?.querySelector('.with-errors')?.textContent?.trim() || '',
    }));
    if (serverError.invalid !== 'true' || !serverError.active || !serverError.message.includes('IP address')) {
        fail(`form-advanced-native: 422 presentation/focus failed: ${JSON.stringify(serverError)}`);
    }
    await ip.fill('192.168.1.20');

    const beforeSuccess = probeRequests.length;
    const successResponse = page.waitForResponse((response) => new URL(response.url()).pathname.endsWith(probePath) && response.status() === 200, { timeout: 15_000 });
    await form.evaluate((element) => element.requestSubmit());
    await successResponse;
    const successRequest = probeRequests[beforeSuccess];
    const body = successRequest?.postData() || '';
    for (const witness of ['adv_currency', 'adv_multiple', 'adv_listbox', 'adv_date_start', 'adv_datetime_end', 'adv_time_end']) {
        if (!body.includes(`name="${witness}`)) fail(`form-advanced-native: submit body missing ${witness}: ${body.slice(0, 1200)}`);
    }
    if (!body.includes('blue') || !body.includes('#485A98')) fail('form-advanced-native: native interaction values were not submitted.');

    const editForm = await open('?edit=1');
    const edit = await editForm.evaluate((element) => ({
        htmlMethod: element.method.toUpperCase(),
        spoof: element.querySelector('input[name="_method"]')?.value || '',
        payloadMethod: (() => {
            const script = element.querySelector('script[data-dcat-modern-payload="form.basic"]');
            const envelope = script?.textContent ? JSON.parse(script.textContent) : null;
            return envelope?.payload?.data?.method || '';
        })(),
    }));
    if (edit.htmlMethod !== 'POST' || edit.spoof !== 'PUT' || edit.payloadMethod !== 'PUT') {
        fail(`form-advanced-native: edit method contract failed: ${JSON.stringify(edit)}`);
    }

    const basicUrl = adminUrl(baseUrl, adminPrefix, '/tests/view-baseline/modern-form-basic');
    for (let index = 0; index < 3; index += 1) {
        await page.evaluate(async (target) => window.DcatNativeRuntime.pjax(window.Dcat, target), basicUrl);
        await page.waitForSelector('form[data-dcat-modern-react-mounted~="form.basic"] input[name="username"]', { state: 'attached', timeout: 15_000 });
        await page.evaluate(async (target) => window.DcatNativeRuntime.pjax(window.Dcat, target), url);
        await page.waitForSelector('form[data-dcat-modern-react-mounted~="form.basic"] input[name="adv_currency"]', { state: 'attached', timeout: 15_000 });
    }
    const cleanup = await page.evaluate(() => {
        const forms = document.querySelectorAll('form[data-dcat-react-component="form.basic"]');
        const ids = Array.from(document.querySelectorAll('#pjax-container [id]')).map((node) => node.id).filter(Boolean);
        return {
            forms: forms.length,
            managed: document.querySelectorAll('form[data-dcat-modern-react-mounted~="form.basic"]').length,
            duplicateIds: ids.filter((id, index, all) => all.indexOf(id) !== index),
            legacyPluginNodes: document.querySelectorAll('.select2-container,.bootstrap-duallistbox-container,.colorpicker,.bootstrap-datetimepicker-widget').length,
        };
    });
    if (cleanup.forms !== 1 || cleanup.managed !== 1 || cleanup.duplicateIds.length || cleanup.legacyPluginNodes) {
        fail(`form-advanced-native: repeated PJAX cleanup/leak contract failed: ${JSON.stringify(cleanup)}`);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('form[data-dcat-modern-react-mounted~="form.basic"]', { state: 'attached', timeout: 15_000 });
    const narrow = await page.evaluate(() => {
        const form = document.querySelector('form[data-dcat-react-component="form.basic"]');
        const offenders = form ? Array.from(form.querySelectorAll('*')).map((element) => ({
            tag: element.tagName,
            className: typeof element.className === 'string' ? element.className : '',
            name: element.getAttribute('name') || '',
            overflow: Math.max(0, element.scrollWidth - element.clientWidth),
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
        })).filter((item) => item.overflow > 1).sort((a, b) => b.overflow - a.overflow).slice(0, 8) : [];
        const host = form?.querySelector('[data-dcat-modern-managed="form.basic"]');
        const body = form?.querySelector('.dcat-modern-form-body');
        const stack = form?.querySelector('.dcat-modern-form-stack');
        const ancestors = [];
        let ancestor = form?.parentElement || null;
        for (let depth = 0; ancestor && depth < 6; depth += 1, ancestor = ancestor.parentElement) {
            ancestors.push({ tag: ancestor.tagName, className: ancestor.className, width: ancestor.clientWidth });
        }
        const app = document.querySelector('.app-content.content');
        const wrapper = document.querySelector('.wrapper');
        const content = document.querySelector('.content-wrapper');
        const pjax = document.querySelector('#pjax-container');
        const outerRow = form?.parentElement?.parentElement;
        const rowStyle = outerRow ? getComputedStyle(outerRow) : null;
        const contentBody = document.querySelector('.content-body');
        const contentBodyStyle = contentBody ? getComputedStyle(contentBody) : null;
        return {
            pageOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
            contentOverflow: Math.max(0, (document.querySelector('.content-wrapper')?.scrollWidth || 0) - (document.querySelector('.content-wrapper')?.clientWidth || 0)),
            formOverflow: form ? Math.max(0, form.scrollWidth - form.clientWidth) : -1,
            widths: { viewport: document.documentElement.clientWidth, wrapper: wrapper?.clientWidth || 0, app: app?.clientWidth || 0, content: content?.clientWidth || 0, pjax: pjax?.clientWidth || 0, form: form?.clientWidth || 0, host: host?.clientWidth || 0, body: body?.clientWidth || 0, stack: stack?.clientWidth || 0 },
            computed: {
                row: rowStyle ? { display: rowStyle.display, width: rowStyle.width, maxWidth: rowStyle.maxWidth, flex: rowStyle.flex, alignSelf: rowStyle.alignSelf, margin: rowStyle.margin } : null,
                contentBody: contentBodyStyle ? { display: contentBodyStyle.display, width: contentBodyStyle.width, flex: contentBodyStyle.flex, alignItems: contentBodyStyle.alignItems } : null,
            },
            ancestors,
            offenders,
        };
    });
    if (narrow.pageOverflow > 1 || narrow.contentOverflow > 1 || narrow.formOverflow > 1) {
        fail(`form-advanced-native: narrow viewport overflow failed: ${JSON.stringify(narrow)}`);
    }

    page.off('request', requestListener);
    return {
        fields: summary.fields,
        kinds: Array.from(new Set(summary.kinds)),
        forbiddenPluginRequests: forbiddenPluginRequests.length,
        serverError,
        edit,
        cleanup,
        narrow,
    };
}

async function verifyModernFormBasic(page, baseUrl, adminPrefix) {
    const route = '/tests/view-baseline/modern-form-basic';
    const url = adminUrl(baseUrl, adminPrefix, route);
    const forbiddenPatterns = [
        'bootstrap-validator',
        'bootstrap-datetimepicker',
        'bootstrap-number-input',
        'switchery',
        'select2',
    ];
    const pluginRequests = [];
    const probeRequests = [];
    const requestListener = (request) => {
        const requestUrl = request.url();
        if (forbiddenPatterns.some((pattern) => requestUrl.toLowerCase().includes(pattern))) pluginRequests.push(requestUrl);
        if (new URL(requestUrl).pathname.endsWith(`${adminPrefix}/tests/view-baseline/modern-form-probe`)) probeRequests.push(request);
    };
    page.on('request', requestListener);

    const open = async (suffix = '') => {
        const response = await page.goto(`${url}${suffix}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(150);
        const state = await page.evaluate(() => {
            const form = document.querySelector('form[data-dcat-react-component="form.basic"]');
            const script = form?.querySelector('script[data-dcat-modern-payload="form.basic"]');
            const envelope = script?.textContent ? JSON.parse(script.textContent) : null;
            return {
                form: Boolean(form),
                mounted: form?.getAttribute('data-dcat-modern-react-mounted') || '',
                nativeForm: form?.dataset.dcatNativeForm || '',
                nativeControls: form?.querySelectorAll('[data-dcat-modern-native-control]').length || 0,
                nativeFields: form?.querySelectorAll('[data-dcat-modern-field="native"]').length || 0,
                basicFields: form?.querySelectorAll('[data-dcat-modern-field="basic"]').length || 0,
                legacyFields: form?.querySelectorAll('[data-dcat-modern-legacy-field]').length || 0,
                hostText: form?.querySelector('[data-dcat-modern-managed="form.basic"]')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 240) || '',
                blockLayout: form?.querySelectorAll('[data-dcat-modern-form-layout="block"]').length || 0,
                hostChildren: Array.from(form?.querySelector('[data-dcat-modern-managed="form.basic"]')?.children || []).map((child) => `${child.tagName}.${child.className}`),
                renderers: (envelope?.payload?.data?.fields || []).map((field) => `${field.fieldType}:${field.renderer}:${field.control?.kind || ''}`),
                bridge: window.DcatModernBridge?.status?.() || null,
                bodyText: document.body?.innerText?.replace(/\s+/g, ' ').trim().slice(0, 300) || '',
            };
        });
        if (!response?.ok() || !state.form || !state.mounted.includes('form.basic') || state.nativeForm !== '1' || state.nativeControls < 10) {
            fail(`form-basic: mount state incomplete: ${JSON.stringify({ status: response?.status(), ...state })}`);
        }
        return page.locator('form[data-dcat-react-component="form.basic"]').first();
    };

    const form = await open();
    const summary = await form.evaluate((element) => {
        const payloadScript = element.querySelector('script[data-dcat-modern-payload="form.basic"]');
        const envelope = payloadScript?.textContent ? JSON.parse(payloadScript.textContent) : null;
        const fields = envelope?.payload?.data?.fields || [];
        const nativeControls = Array.from(element.querySelectorAll('[data-dcat-modern-native-control]'));
        return {
            renderer: element.getAttribute('data-dcat-modern-react-mounted'),
            fallback: element.querySelectorAll('[data-dcat-modern-fallback]').length,
            payloadCount: fields.length,
            nativePayloadCount: fields.filter((field) => field.renderer === 'native').length,
            compatPayloadTypes: fields.filter((field) => field.renderer !== 'native').map((field) => field.fieldType),
            nativeKinds: nativeControls.map((control) => control.getAttribute('data-dcat-modern-native-control')),
            nativeFieldTypes: Array.from(element.querySelectorAll('[data-dcat-modern-field="native"]')).map((field) => field.getAttribute('data-dcat-modern-field-type')),
            hidden: element.querySelector('input[name="cap_hidden"]')?.value || '',
            required: element.querySelector('input[name="username"]')?.required || false,
            disabled: element.querySelector('input[name="cap_disabled"]')?.disabled || false,
            readOnly: element.querySelector('input[name="cap_readonly"]')?.readOnly || false,
            dateType: element.querySelector('input[name="cap_date"]')?.type || '',
            timeType: element.querySelector('input[name="cap_time"]')?.type || '',
            numberType: element.querySelector('input[name="cap_number"]')?.type || '',
            selectValue: element.querySelector('select[name="cap_select"]')?.value || '',
            radioValue: element.querySelector('input[name="cap_radio"]:checked')?.value || '',
            checkedValues: Array.from(element.querySelectorAll('input[name="cap_checkbox[]"]:checked')).map((input) => input.value),
            switchChecked: element.querySelector('input[name="cap_switch"][type="checkbox"]')?.checked || false,
            token: Boolean(element.querySelector('input[name="_token"]')?.value || window.Dcat?.token),
            action: element.action,
            validatorToggle: element.getAttribute('data-toggle') || '',
            compatValidator: element.dataset.dcatCompatValidator || '',
        };
    });
    if (summary.payloadCount !== 18 || summary.nativePayloadCount !== 18 || summary.compatPayloadTypes.length) {
        fail(`form-basic: expected all 18 basic field payloads native: ${JSON.stringify(summary)}`);
    }
    for (const expectedKind of ['input', 'textarea', 'hidden', 'display', 'select', 'radio', 'checkbox', 'switch']) {
        if (!summary.nativeKinds.includes(expectedKind)) fail(`form-basic: missing native ${expectedKind} control: ${JSON.stringify(summary.nativeKinds)}`);
    }
    if (summary.fallback !== 0 || summary.hidden !== 'hidden-value' || !summary.required || !summary.disabled || !summary.readOnly) {
        fail(`form-basic: native field state contract failed: ${JSON.stringify(summary)}`);
    }
    if (summary.dateType !== 'date' || summary.timeType !== 'time' || summary.numberType !== 'number') {
        fail(`form-basic: native typed input contract failed: ${JSON.stringify(summary)}`);
    }
    if (summary.selectValue !== 'admin' || summary.radioValue !== 'yes' || !summary.checkedValues.includes('a') || !summary.switchChecked) {
        fail(`form-basic: option value contract failed: ${JSON.stringify(summary)}`);
    }
    if (!summary.token || !summary.action.endsWith(`${adminPrefix}/tests/view-baseline/modern-form-probe`)) {
        fail(`form-basic: action/CSRF contract failed: ${JSON.stringify(summary)}`);
    }
    if (summary.validatorToggle || summary.compatValidator) {
        fail(`form-basic: Modern path still exposes validator lifecycle markers: ${JSON.stringify(summary)}`);
    }
    if (pluginRequests.length) fail(`form-basic: forbidden legacy plugin requests: ${pluginRequests.join(', ')}`);

    const username = form.locator('input[name="username"]');
    const email = form.locator('input[name="email"]');
    const urlInput = form.locator('input[name="cap_url"]');
    await urlInput.fill('https://changed.example.test');
    await form.locator('button[type="reset"]').click();
    const resetRestored = await urlInput.inputValue();
    if (resetRestored !== 'https://example.test') fail(`form-basic: reset did not restore the original value: ${resetRestored}`);

    await username.focus();
    await page.keyboard.press('Tab');
    const keyboardFirst = await page.evaluate(() => document.activeElement?.getAttribute('name') || '');
    await page.keyboard.press('Tab');
    const keyboardNext = await page.evaluate(() => document.activeElement?.getAttribute('name') || '');
    if (keyboardFirst !== 'cap_id' || keyboardNext !== 'name') {
        fail(`form-basic: keyboard order changed, expected username -> cap_id -> name, got username -> ${keyboardFirst} -> ${keyboardNext}`);
    }

    const beforeInvalidRequests = probeRequests.length;
    await username.fill('');
    await form.evaluate((element) => element.requestSubmit());
    await page.waitForTimeout(100);
    const clientInvalid = await username.evaluate((element) => ({ valid: element.checkValidity(), active: document.activeElement === element }));
    if (clientInvalid.valid || probeRequests.length !== beforeInvalidRequests) {
        fail(`form-basic: native required validation allowed request: ${JSON.stringify(clientInvalid)}`);
    }

    await username.fill('admin');
    await email.fill('server-error@example.test');
    const validationResponse = page.waitForResponse((response) => new URL(response.url()).pathname.endsWith(`${adminPrefix}/tests/view-baseline/modern-form-probe`) && response.status() === 422, { timeout: 15_000 });
    await form.evaluate((element) => element.requestSubmit());
    await validationResponse;
    await page.waitForFunction(() => document.querySelector('input[name="email"]')?.getAttribute('aria-invalid') === 'true', null, { timeout: 8_000 });
    const serverError = await email.evaluate((element) => ({
        invalid: element.getAttribute('aria-invalid'),
        active: document.activeElement === element,
        group: element.closest('.form-group')?.classList.contains('has-error') || false,
        message: element.closest('.form-group')?.querySelector('.with-errors')?.textContent?.trim() || '',
    }));
    if (serverError.invalid !== 'true' || !serverError.active || !serverError.group || !serverError.message.includes('valid email')) {
        fail(`form-basic: 422 presentation/focus contract failed: ${JSON.stringify(serverError)}`);
    }
    await email.fill('admin@example.test');
    await page.waitForFunction(() => !document.querySelector('input[name="email"]')?.hasAttribute('aria-invalid'));

    const beforeAfterSaveRequests = probeRequests.length;
    const afterSaveResponse = page.waitForResponse((response) => new URL(response.url()).pathname.endsWith(`${adminPrefix}/tests/view-baseline/modern-form-probe`) && response.status() === 200, { timeout: 15_000 });
    await form.locator('.box-footer button.btn-info.submit').click();
    await afterSaveResponse;
    const afterSaveBody = probeRequests[beforeAfterSaveRequests]?.postData() || '';
    if (!afterSaveBody.includes('name="after-save"') || !afterSaveBody.includes('3')) {
        fail(`form-basic: save-and-view did not preserve after-save=3: ${afterSaveBody.slice(0, 500)}`);
    }

    const beforeSuccessRequests = probeRequests.length;
    await page.route('**/tests/view-baseline/modern-form-probe', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        await route.continue();
    }, { times: 1 });
    const successResponse = page.waitForResponse((response) => new URL(response.url()).pathname.endsWith(`${adminPrefix}/tests/view-baseline/modern-form-probe`) && response.status() === 200, { timeout: 15_000 });
    await form.evaluate((element) => {
        element.requestSubmit();
        element.requestSubmit();
    });
    await page.waitForFunction(() => {
        const form = document.querySelector('form[data-dcat-react-component="form.basic"]');
        return form?.getAttribute('aria-busy') === 'true' && Boolean(form.querySelector('[data-dcat-native-busy="1"]'));
    }, null, { timeout: 5_000 });
    const busyDuring = await form.evaluate((element) => ({
        ariaBusy: element.getAttribute('aria-busy'),
        busyButtons: element.querySelectorAll('[data-dcat-native-busy="1"]').length,
    }));
    await successResponse;
    await page.waitForFunction(() => !document.querySelector('form[data-dcat-react-component="form.basic"]')?.hasAttribute('aria-busy'));
    const busyAfter = await form.evaluate((element) => ({
        ariaBusy: element.getAttribute('aria-busy'),
        busyButtons: element.querySelectorAll('[data-dcat-native-busy="1"]').length,
    }));
    const duplicateWrites = probeRequests.length - beforeSuccessRequests;
    const csrfHeader = probeRequests[beforeSuccessRequests]?.headers()['x-csrf-token'] || '';
    if (duplicateWrites !== 1 || !csrfHeader || busyDuring.ariaBusy !== 'true' || busyDuring.busyButtons < 1 || busyAfter.ariaBusy || busyAfter.busyButtons) {
        fail(`form-basic: duplicate submit/CSRF/loading contract failed: ${JSON.stringify({ duplicateWrites, csrfHeader: Boolean(csrfHeader), busyDuring, busyAfter })}`);
    }

    const editForm = await open('?edit=1');
    const editState = await editForm.evaluate((element) => ({
        htmlMethod: element.method.toUpperCase(),
        spoof: element.querySelector('input[name="_method"]')?.value || '',
        token: Boolean(element.querySelector('input[name="_token"]')?.value || window.Dcat?.token),
        payloadMethod: (() => {
            const script = element.querySelector('script[data-dcat-modern-payload="form.basic"]');
            const envelope = script?.textContent ? JSON.parse(script.textContent) : null;
            return envelope?.payload?.data?.method || '';
        })(),
    }));
    if (editState.htmlMethod !== 'POST' || editState.spoof !== 'PUT' || editState.payloadMethod !== 'PUT' || !editState.token) {
        fail(`form-basic: edit method spoofing contract failed: ${JSON.stringify(editState)}`);
    }

    await editForm.locator('input[name="username"]').fill('admin');
    await editForm.locator('input[name="email"]').fill('admin@example.test');
    const editRequestPromise = page.waitForRequest((request) => new URL(request.url()).pathname.endsWith(`${adminPrefix}/tests/view-baseline/modern-form-probe`), { timeout: 15_000 });
    const editResponsePromise = page.waitForResponse((response) => new URL(response.url()).pathname.endsWith(`${adminPrefix}/tests/view-baseline/modern-form-probe`) && response.status() === 200, { timeout: 15_000 });
    await editForm.evaluate((element) => element.requestSubmit());
    const editRequest = await editRequestPromise;
    await editResponsePromise;
    const editBody = editRequest.postData() || '';
    if (editRequest.method() !== 'POST' || !editBody.includes('name="_method"') || !editBody.includes('PUT')) {
        fail(`form-basic: edit request protocol failed: method=${editRequest.method()} body=${editBody.slice(0, 400)}`);
    }

    await page.setViewportSize({ width: 683, height: 768 });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('form[data-dcat-modern-react-mounted~="form.basic"]', { timeout: 15_000 });
    const zoomProxy = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        contentOverflow: Math.max(0, (document.querySelector('.content-wrapper')?.scrollWidth || 0) - (document.querySelector('.content-wrapper')?.clientWidth || 0)),
    }));
    if (zoomProxy.overflow > 1 || zoomProxy.contentOverflow > 1) fail(`form-basic: 200% zoom proxy overflow failed: ${JSON.stringify(zoomProxy)}`);

    await installAxe(page);
    const axe = await page.evaluate(async () => {
        const form = document.querySelector('form[data-dcat-react-component="form.basic"]');
        return window.axe.run(form, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
    });
    const serious = axe.violations.filter((item) => ['serious', 'critical'].includes(item.impact));
    if (serious.length) fail(`form-basic: accessibility violations: ${serious.map((item) => `${item.id}:${item.nodes.length}`).join(', ')}`);

    await page.setViewportSize({ width: 1366, height: 768 });
    const historyTarget = `${adminUrl(baseUrl, adminPrefix, '/tests/view-baseline/modern-form-layout')}?profile=rows`;
    await page.goto(historyTarget, { waitUntil: 'networkidle' });
    await page.goto(url, { waitUntil: 'networkidle' });
    const backNavigation = page.waitForURL((candidate) => candidate.toString() === historyTarget, { timeout: 15_000 });
    await page.locator('form[data-dcat-react-component="form.basic"] .box-footer button.btn-secondary').click();
    await backNavigation;
    const backUrl = page.url();

    page.off('request', requestListener);
    return {
        fields: summary.payloadCount,
        nativeFields: summary.nativePayloadCount,
        nativeKinds: Array.from(new Set(summary.nativeKinds)),
        forbiddenPluginRequests: pluginRequests.length,
        validatorMarkers: { dataToggle: summary.validatorToggle, compatValidator: summary.compatValidator },
        resetRestored,
        keyboard: { first: keyboardFirst, next: keyboardNext },
        serverError,
        afterSaveMode: 3,
        duplicateWrites,
        loading: { busyDuring, busyAfter },
        edit: editState,
        zoomProxy,
        backUrl,
    };
}

async function verifyModernGridFilterMatrix(page, baseUrl, adminPrefix) {
    const route = '/tests/view-baseline/modern-grid-filter-matrix';
    const url = adminUrl(baseUrl, adminPrefix, route);
    const mappedFilters = gridCapabilities.filters.filter((entry) => entry.fixtureRoute === route && entry.browserTestId === 'grid-filter-matrix');
    if (mappedFilters.length !== gridCapabilities.summary.filters.total || mappedFilters.some((entry) => !entry.browserWitness)) {
        fail(`grid-filter-matrix: registry coverage is incomplete (${mappedFilters.length}/${gridCapabilities.summary.filters.total}).`);
    }

    const response = await page.goto(url, { waitUntil: 'networkidle' });
    if (!response || !response.ok()) {
        const body = response ? await response.text() : '';
        const diagnostic = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 700);
        fail(`grid-filter-matrix: fixture returned HTTP ${response?.status() ?? 'unknown'}: ${diagnostic}`);
    }
    await page.waitForSelector('[data-dcat-grid-interactions="native"]', { state: 'attached', timeout: 15_000 });

    const form = page.locator('.grid-filter-form').first();
    if (!await form.count()) fail('grid-filter-matrix: filter form is missing.');

    const expectedLabels = [
        'Equal', 'Not Equal', 'Ilike', 'Like', 'Start With', 'End With', 'Gt', 'Lt', 'Ngt', 'Nlt',
        'Between', 'In', 'Not In', 'Find In Set', 'Date', 'Day', 'Month', 'Year', 'Where', 'Where Between',
        'Group', 'Presenter Select', 'Presenter Multiple', 'Presenter Radio', 'Presenter Checkbox',
        'Presenter DateTime', 'Presenter Select Table', 'Presenter Multiple Select Table',
    ];
    const missingLabels = [];
    for (const label of expectedLabels) {
        if (!await page.getByText(label, { exact: true }).count()) missingLabels.push(label);
    }
    if (missingLabels.length) fail(`grid-filter-matrix: rendered filter labels are missing: ${missingLabels.join(', ')}`);

    const expectedNames = [
        'cap_equal', 'cap_not_equal', 'cap_ilike', 'cap_like', 'cap_start_with', 'cap_end_with', 'cap_gt', 'cap_lt',
        'cap_ngt', 'cap_nlt', 'cap_between', 'cap_in', 'cap_not_in', 'cap_find_in_set', 'cap_date', 'cap_day',
        'cap_month', 'cap_year', 'cap_where', 'cap_where_between', 'cap_group', 'cap_hidden', 'cap_presenter_select',
        'cap_presenter_multiple', 'cap_presenter_radio', 'cap_presenter_checkbox', 'cap_presenter_datetime',
        'cap_presenter_select_table', 'cap_presenter_multiple_select_table',
    ];
    const missingNames = [];
    for (const name of expectedNames) {
        if (!await form.locator(`[name="${name}"], [name^="${name}["]`).count()) missingNames.push(name);
    }
    if (missingNames.length) fail(`grid-filter-matrix: filter control names are missing: ${missingNames.join(', ')}`);

    const structure = await page.evaluate(() => ({
        filterInputs: document.querySelectorAll('.grid-filter-form input, .grid-filter-form select, .grid-filter-form textarea').length,
        filterColumns: document.querySelectorAll('.grid-filter-form .filter-input').length,
        newline: document.querySelectorAll('.grid-filter-form .col-md-12').length,
        hidden: document.querySelectorAll('.grid-filter-form input[type="hidden"][name="cap_hidden"]').length,
        selectTableContainers: document.querySelectorAll('.grid-filter-form [id^="select-table-filter-"]').length,
    }));
    if (structure.filterInputs < expectedNames.length || structure.filterColumns < 20 || !structure.newline || structure.hidden !== 1 || structure.selectTableContainers < 2) {
        fail(`grid-filter-matrix: structural/base presenter witnesses failed: ${JSON.stringify(structure)}`);
    }

    const root = page.locator('[data-dcat-grid-interactions="native"]').first();
    const filterButton = root.locator('.filter-button-group > button:not([data-toggle="dropdown"])').first();
    await filterButton.click();
    await page.waitForSelector('.dcat-modern-filter-panel--open');
    const panel = page.locator('.dcat-modern-filter-panel--open').first();
    const drawer = {
        role: await panel.getAttribute('role'),
        modal: await panel.getAttribute('aria-modal'),
        label: await panel.getAttribute('aria-label'),
        focusInside: await page.evaluate(() => Boolean(document.activeElement?.closest('.dcat-modern-filter-panel--open'))),
    };
    await page.keyboard.press('Shift+Tab');
    drawer.tabStayedInside = await page.evaluate(() => Boolean(document.activeElement?.closest('.dcat-modern-filter-panel--open')));
    if (drawer.role !== 'dialog' || drawer.modal !== 'true' || !drawer.label || !drawer.focusInside || !drawer.tabStayedInside) {
        fail(`grid-filter-matrix: native filter drawer accessibility contract failed: ${JSON.stringify(drawer)}`);
    }

    const input = form.locator('input[name="cap_equal"]').first();
    await input.fill('42');
    await root.evaluate((element) => element.setAttribute('data-dcat-grid-probe', 'filter-matrix-before'));
    const requestPromise = page.waitForRequest((request) => request.headers()['x-pjax'] === 'true' && new URL(request.url()).searchParams.get('cap_equal') === '42', { timeout: 12_000 });
    const responsePromise = page.waitForResponse((candidate) => candidate.request().headers()['x-pjax'] === 'true' && new URL(candidate.url()).searchParams.get('cap_equal') === '42', { timeout: 12_000 });
    await form.evaluate((element) => element.requestSubmit());
    const request = await requestPromise;
    const filterResponse = await responsePromise;
    if (!filterResponse.ok()) fail(`grid-filter-matrix: native filter submit returned HTTP ${filterResponse.status()}.`);
    await page.waitForFunction(() => !document.querySelector('[data-dcat-grid-probe="filter-matrix-before"]'), null, { timeout: 12_000 });
    await page.waitForSelector('[data-dcat-grid-interactions="native"]', { state: 'attached', timeout: 12_000 });

    const scope = page.locator('a[href*="_scope_"]').filter({ hasText: 'Scope' }).first();
    if (!await scope.count()) fail('grid-filter-matrix: Scope witness link is missing.');
    const scopeHref = await scope.getAttribute('href') || '';
    const scopeValue = scopeHref ? Array.from(new URL(scopeHref, page.url()).searchParams.entries()).find(([key]) => key.includes('_scope_'))?.[1] || '' : '';
    if (scopeValue !== 'cap_scope') fail(`grid-filter-matrix: Scope query contract drifted: ${scopeHref}`);

    return {
        labels: expectedLabels.length,
        namedControls: expectedNames.length,
        structure,
        drawer,
        submit: { url: request.url(), pjax: request.headers()['x-pjax'] },
        scope: scopeHref,
    };
}

async function verifyModernAccessibility(page, baseUrl, adminPrefix) {
    const routes = contract.runtimeCapture.standaloneFixtureRoutes;
    const checks = {};
    for (const [family, route] of Object.entries({
        layout: routes.modernVertical,
        grid: routes.modernGrid,
        form: routes.modernForm,
        show: routes.modernShow,
        tree: routes.modernTree,
        widget: routes.modernWidget,
        system: routes.modernSystem,
        login: '/tests/view-baseline/modern-login',
        extension: '/tests/view-baseline/modern-form-advanced-optional',
        compat: '/tests/view-baseline/modern-form-advanced-compat',
    })) {
        await page.goto(adminUrl(baseUrl, adminPrefix, route), { waitUntil: 'networkidle' });
        await page.waitForSelector('.dcat-modern-react-view');
        await installAxe(page);
        const result = await page.evaluate(async () => {
            return window.axe.run('.dcat-modern-react-view', {
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
            });
        });
        const violations = result.violations.map((item) => ({
            id: item.id,
            impact: item.impact,
            nodes: item.nodes.length,
            help: item.help,
            targets: item.nodes.flatMap((node) => node.target || []),
        }));
        for (const violation of violations) {
            violation.diagnostics = await page.evaluate((targets) => targets.map((selector) => {
                const element = document.querySelector(selector);
                if (!(element instanceof HTMLElement)) return { selector, missing: true };
                const ancestors = [];
                let current = element;
                for (let depth = 0; current && depth < 6; depth += 1, current = current.parentElement) {
                    ancestors.push(`${current.tagName.toLowerCase()}${current.id ? `#${current.id}` : ''}${current.className ? `.${String(current.className).trim().replace(/\s+/g, '.')}` : ''}`);
                }
                const style = getComputedStyle(element);
                return {
                    selector,
                    color: style.color,
                    backgroundColor: style.backgroundColor,
                    bodyClass: document.body.className,
                    ancestors,
                    modernStylesheets: Array.from(document.styleSheets)
                        .map((sheet) => sheet.href)
                        .filter((href) => href && href.includes('/modern/')),
                };
            }), violation.targets);
        }
        checks[family] = violations;
        const blocking = violations.filter((item) => ['serious', 'critical'].includes(item.impact));
        if (blocking.length) {
            fail(`${family}: serious/critical axe violations: ${blocking.map((item) => `${item.id} [${item.targets.join('; ')}] ${JSON.stringify(item.diagnostics)}`).join(', ')}`);
        }
    }
    return checks;
}

function representativeModernFamilies(routes) {
    return {
        grid: {
            route: routes.modernGrid,
            owner: '[data-dcat-react-component="grid.read"]',
            landmarks: ['.dcat-modern-grid-view', '.dcat-modern-table-wrap', 'table.dcat-modern-table', 'tbody'],
        },
        form: {
            route: routes.modernForm,
            owner: '[data-dcat-react-component="form.basic"]',
            landmarks: ['.dcat-modern-form-view', '.dcat-modern-form-body', '.dcat-modern-form-field'],
        },
        show: {
            route: routes.modernShow,
            owner: '[data-dcat-react-component="show.detail"]',
            landmarks: ['.dcat-modern-show-payload', '.dcat-modern-show-body', '.dcat-modern-show-field'],
        },
        tree: {
            route: routes.modernTree,
            owner: '[data-dcat-react-component="tree.page"]',
            landmarks: ['.dcat-modern-tree-view', '.dcat-modern-tree-toolbar', '.dcat-modern-tree-body', '[role="tree"]'],
        },
        widget: {
            route: routes.modernWidget,
            owner: '[data-dcat-react-component="widget.surface"]',
            landmarks: ['[data-dcat-modern-widget-renderer]', 'h1,h2,h3,h4,h5,h6,[role="heading"]', '.dcat-modern-widget__body,.dcat-modern-dashboard__links'],
        },
        system: {
            route: routes.modernSystem,
            owner: '[data-dcat-react-component="system.page"]',
            landmarks: ['[data-dcat-modern-system-renderer]', 'h1,h2,h3,h4,h5,h6,[role="heading"]', 'p,form'],
        },
    };
}

async function verifyAutomatedAccessibilityOrder(page, baseUrl, adminPrefix) {
    const families = representativeModernFamilies(contract.runtimeCapture.standaloneFixtureRoutes);
    const evidence = {
        schemaVersion: 1,
        method: 'automated-dom-reading-order-and-tab-traversal',
        nativeScreenReader: false,
        manualVerificationRequired: false,
        families: [],
    };

    await page.setViewportSize({ width: 1366, height: 768 });
    for (const [family, testCase] of Object.entries(families)) {
        await page.goto(adminUrl(baseUrl, adminPrefix, testCase.route), { waitUntil: 'networkidle' });
        const owners = page.locator(testCase.owner);
        const ownerCount = await owners.count();
        if (!ownerCount) fail(`${family}: representative page family owner is missing (${testCase.owner}).`);

        const roots = page.locator(`${testCase.owner} .dcat-modern-react-view`);
        const rootCount = await roots.count();
        if (!rootCount) fail(`${family}: representative page family has no mounted modern view.`);

        const familyEvidence = { family, route: testCase.route, ownerCount, rootCount, roots: [] };
        for (let rootIndex = 0; rootIndex < rootCount; rootIndex += 1) {
            const rootProbe = `dcat-a11y-root-${family}-${rootIndex}`;
            const root = roots.nth(rootIndex);
            await root.evaluate((node, probe) => node.setAttribute('data-dcat-a11y-root', probe), rootProbe);
            const snapshot = await page.evaluate(({ rootProbe, landmarks, family }) => {
                const root = document.querySelector(`[data-dcat-a11y-root="${rootProbe}"]`);
                if (!(root instanceof HTMLElement)) return { missing: true };
                const visible = (node) => {
                    if (!(node instanceof HTMLElement)) return false;
                    const style = getComputedStyle(node);
                    return !node.hidden && style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length > 0;
                };
                const label = (node) => {
                    const aria = node.getAttribute('aria-label')?.trim();
                    if (aria) return aria;
                    const labelledBy = node.getAttribute('aria-labelledby')?.trim();
                    if (labelledBy) {
                        const text = labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ').replace(/\s+/g, ' ').trim();
                        if (text) return text;
                    }
                    if (node.id) {
                        const forLabel = root.querySelector(`label[for="${CSS.escape(node.id)}"]`)?.textContent?.trim();
                        if (forLabel) return forLabel;
                    }
                    const parentLabel = node.closest('label')?.textContent?.trim();
                    return parentLabel || node.getAttribute('title')?.trim() || node.getAttribute('placeholder')?.trim() || node.textContent?.replace(/\s+/g, ' ').trim() || '';
                };
                const domNodes = Array.from(root.querySelectorAll('*'));
                const domIndex = (node) => domNodes.indexOf(node);
                const describe = (node, selector) => {
                    const rect = node.getBoundingClientRect();
                    return {
                        selector,
                        tag: node.tagName.toLowerCase(),
                        role: node.getAttribute('role') || '',
                        tabIndex: node.tabIndex,
                        name: label(node),
                        domIndex: domIndex(node),
                        top: Math.round(rect.top * 100) / 100,
                        left: Math.round(rect.left * 100) / 100,
                        width: Math.round(rect.width * 100) / 100,
                        height: Math.round(rect.height * 100) / 100,
                    };
                };
                const landmarkNodes = landmarks.map((selector) => {
                    const node = Array.from(root.querySelectorAll(selector)).find(visible);
                    return node ? describe(node, selector) : { selector, missing: true };
                });
                const missingLandmarks = landmarkNodes.filter((node) => node.missing).map((node) => node.selector);
                const orderedLandmarks = landmarkNodes.filter((node) => !node.missing);
                const landmarkOrderViolations = orderedLandmarks.slice(1).reduce((violations, node, index) => {
                    const previous = orderedLandmarks[index];
                    if (node.domIndex <= previous.domIndex) violations.push({ previous: previous.selector, current: node.selector });
                    return violations;
                }, []);

                const semanticSelector = 'h1,h2,h3,h4,h5,h6,[role="heading"],form,fieldset,table,caption,thead,tbody,[role="tree"],[role="treeitem"],[role="alert"],[role="status"],[role="progressbar"]';
                const semantic = Array.from(root.querySelectorAll(semanticSelector)).filter(visible).map((node) => describe(node, node.tagName.toLowerCase()));
                const flowViolations = [];
                semantic.slice(1).forEach((node, index) => {
                    const previous = semantic[index];
                    if (node.top + 1 < previous.top) flowViolations.push({ previous, current: node });
                });

                const focusSelector = 'a[href],button,input:not([type="hidden"]),select,textarea,[tabindex]:not([tabindex="-1"])';
                const focusables = Array.from(root.querySelectorAll(focusSelector)).filter((node) => {
                    if (!visible(node) || (node instanceof HTMLButtonElement && node.disabled) || (node instanceof HTMLInputElement && node.disabled) || (node instanceof HTMLSelectElement && node.disabled) || (node instanceof HTMLTextAreaElement && node.disabled)) return false;
                    return node.tabIndex >= 0;
                });
                const focusOrder = focusables.map((node, index) => {
                    const probe = `${rootProbe}-${index}`;
                    node.setAttribute('data-dcat-a11y-focus', probe);
                    return { probe, ...describe(node, focusSelector) };
                });
                const unnamed = focusOrder.filter((node) => !node.name).map((node) => ({ tag: node.tag, domIndex: node.domIndex }));
                const positiveTabIndex = focusOrder.filter((node) => Number(node.tabIndex) > 0).map((node) => ({ name: node.name, tabIndex: node.tabIndex }));
                return {
                    missingLandmarks,
                    landmarkNodes,
                    landmarkOrderViolations,
                    semanticCount: semantic.length,
                    flowViolations,
                    focusOrder,
                    unnamed,
                    positiveTabIndex,
                };
            }, { rootProbe, landmarks: testCase.landmarks, family });

            if (snapshot.missing) fail(`${family}: automated accessibility root disappeared while collecting order evidence.`);
            if (snapshot.missingLandmarks.length || snapshot.landmarkOrderViolations.length || snapshot.flowViolations.length) {
                fail(`${family}: automated reading order failed: ${JSON.stringify({ rootIndex, missing: snapshot.missingLandmarks, landmarkOrderViolations: snapshot.landmarkOrderViolations, flowViolations: snapshot.flowViolations.slice(0, 3) })}`);
            }
            if (snapshot.unnamed.length || snapshot.positiveTabIndex.length) {
                fail(`${family}: automated focus contract failed: ${JSON.stringify({ rootIndex, unnamed: snapshot.unnamed, positiveTabIndex: snapshot.positiveTabIndex })}`);
            }

            const traversed = [];
            if (snapshot.focusOrder.length) {
                const firstExpected = snapshot.focusOrder[0];
                const candidate = page.locator(`[data-dcat-a11y-focus="${firstExpected.probe}"]`).first();
                await candidate.focus();
            }
            for (let focusIndex = 0; focusIndex < snapshot.focusOrder.length; focusIndex += 1) {
                const expected = snapshot.focusOrder[focusIndex];
                if (focusIndex > 0) await page.keyboard.press('Tab');
                const actual = await page.evaluate(() => document.activeElement?.getAttribute('data-dcat-a11y-focus') || '');
                traversed.push(actual);
                if (actual !== expected.probe) {
                    fail(`${family}: Tab focus did not reach ${expected.name || expected.tag}: ${JSON.stringify({ expected: expected.probe, actual })}`);
                }
            }

            familyEvidence.roots.push({
                rootIndex,
                landmarks: snapshot.landmarkNodes,
                semanticCount: snapshot.semanticCount,
                focusableCount: snapshot.focusOrder.length,
                focusOrder: snapshot.focusOrder.map(({ probe, name, tag, role, tabIndex, domIndex }) => ({ probe, name, tag, role, tabIndex, domIndex })),
                tabTraversal: traversed,
                nativeTabOrder: snapshot.focusOrder.length > 0,
            });
            await root.evaluate((node) => {
                node.removeAttribute('data-dcat-a11y-root');
                node.querySelectorAll('[data-dcat-a11y-focus]').forEach((candidate) => candidate.removeAttribute('data-dcat-a11y-focus'));
            });
        }
        if (!familyEvidence.roots.some((root) => root.focusableCount > 0)) {
            fail(`${family}: representative page family exposes no keyboard-focusable controls across its modern roots.`);
        }
        evidence.families.push(familyEvidence);
    }

    return evidence;
}

async function verifyAutomatedReflow200(page, baseUrl, adminPrefix) {
    const families = representativeModernFamilies(contract.runtimeCapture.standaloneFixtureRoutes);
    const evidence = {
        schemaVersion: 1,
        requestedZoomPercent: 200,
        method: 'css-viewport-reflow-proxy',
        proxy: true,
        nativeBrowserUiZoom: false,
        actualBrowserUiZoom: false,
        manualVerificationRequired: false,
        deviceScaleFactor: 1,
        sourceViewports: contract.viewports,
        failures: [],
        cases: [],
    };

    for (const [family, testCase] of Object.entries(families)) {
        for (const sourceViewport of contract.viewports) {
            const effectiveViewport = {
                width: Math.max(1, Math.floor(sourceViewport.width / 2)),
                height: Math.max(1, Math.floor(sourceViewport.height / 2)),
            };
            await page.setViewportSize(effectiveViewport);
            await page.goto(adminUrl(baseUrl, adminPrefix, testCase.route), { waitUntil: 'networkidle' });
            const ownerCount = await page.locator(testCase.owner).count();
            if (!ownerCount) {
                const failure = { family, sourceViewport, effectiveViewport, reason: 'fixture-owner-missing' };
                evidence.failures.push(failure);
                evidence.cases.push({ family, route: testCase.route, sourceViewport, effectiveViewport, passed: false, failures: [failure] });
                continue;
            }
            try {
                await page.waitForSelector(`${testCase.owner} .dcat-modern-react-view`, { state: 'attached' });
            } catch (error) {
                const failure = { family, sourceViewport, effectiveViewport, reason: 'modern-root-missing', message: error.message };
                evidence.failures.push(failure);
                evidence.cases.push({ family, route: testCase.route, sourceViewport, effectiveViewport, passed: false, failures: [failure] });
                continue;
            }

            const geometry = await page.evaluate((ownerSelector) => {
                const owners = Array.from(document.querySelectorAll(ownerSelector)).filter((node) => node instanceof HTMLElement);
                const roots = owners
                    .map((owner) => owner.querySelector('.dcat-modern-react-view'))
                    .filter((root) => root instanceof HTMLElement);
                if (!owners.length || !roots.length) return { missingRoot: true };
                const visible = (node) => {
                    if (!(node instanceof HTMLElement)) return false;
                    const style = getComputedStyle(node);
                    const clipped = style.clip === 'rect(1px, 1px, 1px, 1px)' || style.clipPath === 'inset(100%)';
                    return !node.hidden && !node.matches('.webuploader-element-invisible') && !clipped && style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length > 0;
                };
                const describe = (node) => {
                    const rect = node.getBoundingClientRect();
                    return {
                        tag: node.tagName.toLowerCase(),
                        className: String(node.className || '').slice(0, 180),
                        left: Math.round(rect.left * 100) / 100,
                        right: Math.round(rect.right * 100) / 100,
                        top: Math.round(rect.top * 100) / 100,
                        bottom: Math.round(rect.bottom * 100) / 100,
                        width: Math.round(rect.width * 100) / 100,
                        height: Math.round(rect.height * 100) / 100,
                    };
                };
                const rootsEvidence = roots.map((root, rootIndex) => {
                    const scrollSelector = '.dcat-modern-table-wrap,.table-responsive,.table-wrapper,.dcat-modern-tree-body';
                    const scrollStates = Array.from(root.querySelectorAll(scrollSelector)).filter(visible).map((container, containerIndex) => {
                        const style = getComputedStyle(container);
                        const horizontalOverflow = Math.max(0, container.scrollWidth - container.clientWidth);
                        const verticalOverflow = Math.max(0, container.scrollHeight - container.clientHeight);
                        const horizontalScrollable = horizontalOverflow > 1 && ['auto', 'scroll'].includes(style.overflowX);
                        const verticalScrollable = verticalOverflow > 1 && ['auto', 'scroll'].includes(style.overflowY);
                        const initialScroll = { left: container.scrollLeft, top: container.scrollTop };
                        const focusableSelector = 'a[href],button,input:not([type="hidden"]),select,textarea,[tabindex]:not([tabindex="-1"])';
                        const focusables = Array.from(container.querySelectorAll(focusableSelector)).filter(visible);
                        const containerRect = container.getBoundingClientRect();
                        const intersects = (node, rect = node.getBoundingClientRect()) => (
                            rect.right > containerRect.left + 1
                            && rect.left < containerRect.right - 1
                            && rect.bottom > containerRect.top + 1
                            && rect.top < containerRect.bottom - 1
                        );
                        const blocking = [];
                        if (horizontalOverflow > 1 && !horizontalScrollable) blocking.push(`horizontal-overflow-not-scrollable:${Math.round(horizontalOverflow * 100) / 100}`);
                        if (verticalOverflow > 1 && !verticalScrollable) blocking.push(`vertical-overflow-not-scrollable:${Math.round(verticalOverflow * 100) / 100}`);
                        if (horizontalScrollable) container.scrollLeft = container.scrollWidth - container.clientWidth;
                        if (verticalScrollable) container.scrollTop = container.scrollHeight - container.clientHeight;
                        const endFocusable = focusables.filter((node) => intersects(node));
                        const lastFocusable = focusables[focusables.length - 1];
                        const lastFocusableReachable = !lastFocusable || intersects(lastFocusable);
                        if (focusables.length && !endFocusable.length) blocking.push('no-focusable-control-reachable-at-scroll-end');
                        if (focusables.length && !lastFocusableReachable) blocking.push('last-focusable-control-not-reachable-at-scroll-end');
                        const endScroll = { left: container.scrollLeft, top: container.scrollTop };
                        container.scrollLeft = initialScroll.left;
                        container.scrollTop = initialScroll.top;
                        return {
                            node: container,
                            evidence: {
                                containerIndex,
                                className: String(container.className || '').slice(0, 180),
                                overflowX: style.overflowX,
                                overflowY: style.overflowY,
                                horizontalOverflow,
                                verticalOverflow,
                                horizontalScrollable,
                                verticalScrollable,
                                scrollEnd: endScroll,
                                focusableCount: focusables.length,
                                endFocusableCount: endFocusable.length,
                                lastFocusableReachable,
                                blocking,
                            },
                        };
                    });
                    const allowedScrollContainer = (node) => {
                        const container = node.closest(scrollSelector);
                        const state = scrollStates.find((candidate) => candidate.node === container);
                        return Boolean(state && !state.evidence.blocking.length && (state.evidence.horizontalScrollable || state.evidence.verticalScrollable));
                    };
                    const visibleNodes = [root, ...Array.from(root.querySelectorAll('*'))].filter(visible);
                    // React 宿主通常是 display:contents，使用其直接可见表面作为根边界，避免把子节点极值当成容器尺寸。
                    const rootSurface = Array.from(root.children).find((node) => {
                        if (!visible(node)) return false;
                        const rect = node.getBoundingClientRect();
                        return rect.width > 0 || rect.height > 0;
                    });
                    const rootRect = (rootSurface || root).getBoundingClientRect();
                    const hasVisibleChildOverflow = (node) => Array.from(node.querySelectorAll('*')).some((child) => {
                        if (!visible(child) || allowedScrollContainer(child)) return false;
                        const childRect = child.getBoundingClientRect();
                        return childRect.left < rootRect.left - 1 || childRect.right > rootRect.right + 1;
                    });
                    const overflowNodes = visibleNodes.filter((node) => !allowedScrollContainer(node) && node.scrollWidth > node.clientWidth + 1 && hasVisibleChildOverflow(node)).map(describe);
                    const offscreenNodes = visibleNodes.filter((node) => {
                        if (allowedScrollContainer(node)) return false;
                        const rect = node.getBoundingClientRect();
                        return rect.left < -1 || rect.right > innerWidth + 1;
                    }).map(describe);
                    const focusable = Array.from(root.querySelectorAll('a[href],button,input:not([type="hidden"]),select,textarea,[tabindex]:not([tabindex="-1"])')).filter(visible);
                    const focusableOffscreen = focusable.filter((node) => {
                        if (allowedScrollContainer(node)) return false;
                        const rect = node.getBoundingClientRect();
                        return rect.left < -1 || rect.right > innerWidth + 1;
                    }).map(describe);
                    return {
                        rootIndex,
                        rootOverflow: Math.max(0, root.scrollWidth - root.clientWidth),
                        root: { left: Math.round(rootRect.left * 100) / 100, right: Math.round(rootRect.right * 100) / 100, width: Math.round(rootRect.width * 100) / 100 },
                        visibleFocusableCount: focusable.length,
                        scrollContainers: scrollStates.map((state) => state.evidence),
                        overflowNodes: overflowNodes.slice(0, 12),
                        offscreenNodes: offscreenNodes.slice(0, 12),
                        focusableOffscreen,
                    };
                });
                const documentOverflow = Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
                const bodyOverflow = Math.max(0, document.body.scrollWidth - document.documentElement.clientWidth);
                return {
                    missingRoot: false,
                    viewport: { width: innerWidth, height: innerHeight },
                    ownerCount: owners.length,
                    rootCount: roots.length,
                    documentOverflow,
                    bodyOverflow,
                    roots: rootsEvidence,
                    scrollContainers: rootsEvidence.flatMap((root) => root.scrollContainers),
                    overflowNodes: rootsEvidence.flatMap((root) => root.overflowNodes),
                    offscreenNodes: rootsEvidence.flatMap((root) => root.offscreenNodes),
                    focusableOffscreen: rootsEvidence.flatMap((root) => root.focusableOffscreen),
                };
            }, testCase.owner);

            const failures = [];
            if (geometry.missingRoot) failures.push('missing-root');
            if (geometry.documentOverflow > 1) failures.push(`document-overflow:${geometry.documentOverflow}`);
            if (geometry.bodyOverflow > 1) failures.push(`body-overflow:${geometry.bodyOverflow}`);
            if (geometry.overflowNodes.length) failures.push(`overflow-nodes:${geometry.overflowNodes.length}`);
            const scrollFailures = geometry.scrollContainers.flatMap((container) => container.blocking.map((reason) => `${container.className || 'scroll-container'}:${reason}`));
            if (scrollFailures.length) failures.push(...scrollFailures);
            if (geometry.offscreenNodes.length) failures.push(`offscreen-nodes:${geometry.offscreenNodes.length}`);
            if (geometry.focusableOffscreen.length) failures.push(`focusable-offscreen:${geometry.focusableOffscreen.length}`);
            if (failures.length) evidence.failures.push({ family, sourceViewport, effectiveViewport, failures, geometry });
            evidence.cases.push({
                family,
                route: testCase.route,
                sourceViewport,
                effectiveViewport,
                passed: failures.length === 0,
                failures,
                ...geometry,
            });
        }
    }
    await page.setViewportSize({ width: 1366, height: 768 });
    const evidenceDir = path.resolve(process.env.DCAT_BROWSER_EVIDENCE_DIR || path.join(root, 'artifacts/view-modernization-browser'));
    const evidencePath = path.join(evidenceDir, 'reflow-200-proxy.json');
    fs.mkdirSync(evidenceDir, { recursive: true });
    fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
    if (evidence.failures.length) {
        fail(`automated 200% reflow proxy failed in ${evidence.failures.length}/${evidence.cases.length} cases; evidence: ${evidencePath}. ${JSON.stringify(evidence.failures.slice(0, 10))}`);
    }
    return evidence;
}

async function verifyKeyboardNavigation(page, baseUrl, adminPrefix) {
    const route = contract.runtimeCapture.standaloneFixtureRoutes.modernVertical;
    await page.goto(adminUrl(baseUrl, adminPrefix, route), { waitUntil: 'networkidle' });
    const links = page.locator('.main-menu-content a:visible');
    if (await links.count() < 2) return { skipped: 'fewer-than-two-visible-menu-links' };
    await links.nth(0).focus();
    const before = await page.evaluate(() => document.activeElement?.textContent?.trim() || document.activeElement?.tagName);
    await page.keyboard.press('ArrowDown');
    const after = await page.evaluate(() => document.activeElement?.textContent?.trim() || document.activeElement?.tagName);
    if (before === after) fail('Modern navigation ArrowDown did not move focus to another menu item.');
    return { before, after };
}

async function verifyReducedMotion(page, baseUrl, adminPrefix) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(adminUrl(baseUrl, adminPrefix, contract.runtimeCapture.standaloneFixtureRoutes.modernGrid), { waitUntil: 'networkidle' });
    const motions = await page.evaluate(() => Array.from(document.querySelectorAll('.dcat-modern-react-view *')).map((element) => {
        const style = getComputedStyle(element);
        return { animationName: style.animationName, animationDuration: style.animationDuration, transitionDuration: style.transitionDuration };
    }).filter((item) => item.animationName !== 'none' || item.animationDuration !== '0s' || item.transitionDuration !== '0s'));
    const blocking = motions.filter((item) => (
        (item.animationName !== 'none' && !/^0(?:s|ms)$/.test(item.animationDuration))
        || !item.transitionDuration.split(',').every((duration) => /^\s*0(?:s|ms)\s*$/.test(duration))
    ));
    if (blocking.length) fail(`prefers-reduced-motion still has active modern motion: ${JSON.stringify(blocking.slice(0, 5))}`);
    return { activeMotionDeclarations: motions.length, blockingMotionDeclarations: blocking.length };
}

async function verifyRendererLockdown(page, baseUrl, adminPrefix) {
    const routes = contract.runtimeCapture.standaloneFixtureRoutes;
    // 旧版渲染器与所有回退开关都已删除：这些历史夹具 URL 必须继续渲染当前渲染器，
    // 并且 __dcat_legacy 查询标记不得改变渲染结果。
    const cases = {
        removedGlobal: routes.rollbackGlobal,
        removedRoute: routes.rollbackRoute,
        removedFamily: routes.rollbackFamily,
        removedCapability: routes.rollbackCapability,
        forcedLegacyQuery: `${routes.modernVertical}?__dcat_legacy=1`,
    };
    const evidence = {};

    for (const [scope, route] of Object.entries(cases)) {
        await page.goto(adminUrl(baseUrl, adminPrefix, route), { waitUntil: 'networkidle' });
        const state = await page.evaluate(() => ({
            requestMarker: Boolean(document.querySelector('[data-dcat-modern-request="1"]')),
            runtimeScript: Boolean(document.getElementById('dcat-modern-runtime')),
            renderer: document.querySelector('[data-dcat-modern-page-config]')?.dataset.dcatR ?? null,
            managedRoots: document.querySelectorAll('[data-dcat-modern-capability]').length,
            forcedRendererQuery: new URL(location.href).searchParams.has('__dcat_legacy'),
        }));
        if (!state.requestMarker || !state.runtimeScript) {
            fail(`${scope} must keep the modern runtime active: ${JSON.stringify(state)}`);
        }
        if (state.renderer !== '1' && state.renderer !== '0') {
            fail(`${scope} must advertise an existing renderer marker: ${JSON.stringify(state)}`);
        }
        if (scope === 'forcedLegacyQuery' && !state.forcedRendererQuery) {
            fail('the forced legacy query marker must reach the server so the gate can prove it is ignored.');
        }
        evidence[scope] = state;
    }

    return evidence;
}

async function installAxe(page) {
    if (await page.evaluate(() => Boolean(window.axe))) return;
    await page.addScriptTag({ content: axeSource });
}

function adminUrl(baseUrl, adminPrefix, route) {
    return `${baseUrl}${adminPrefix}${route.startsWith('/') ? route : `/${route}`}`;
}

function normalizePrefix(prefix) {
    const normalized = `/${String(prefix).replace(/^\/+|\/+$/g, '')}`;
    return normalized === '/' ? '' : normalized;
}

function trimSlash(value) {
    return String(value).replace(/\/+$/, '');
}

function cssAttributeValue(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function fail(message) {
    console.error(`View modernization browser contract failed: ${message}`);
    process.exitCode = 1;
    throw new Error(message);
}
