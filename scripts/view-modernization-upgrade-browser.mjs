import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export async function verifyUpgradeCompatibility(page, baseUrl, prefix, evidenceDir) {
    const evidence = { schemaVersion: 1, fixtures: [], descriptors: {}, sourceHashes: {} };
    const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
    const snapshot = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) snapshot(file);
        else evidence.sourceHashes[path.relative(root, file)] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    });
    snapshot(path.join(root, 'tests/Fixtures/upgrade'));
    for (const fixture of ['standard', 'blade', 'extension']) {
        const response = await page.goto(`${baseUrl}${prefix}/tests/view-upgrade/${fixture}?compat_fallback=1`, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200, `${fixture} HTTP status`);
        await page.waitForFunction(() => window.DcatCompat && document.querySelector('#upgrade-controls'));
        const result = { fixture };
        if (fixture === 'blade') assert.equal(await page.locator('[data-upgrade-override="1"]').count(), 1, 'Blade override retained');
        if (fixture === 'extension') {
            await page.waitForFunction(() => window.upgradePluginReady === true);
            assert.equal(await page.evaluate(() => window.upgradeHeadCompatReady), true, 'HEAD inline scripts must run after the compat runtime on modern pages');
            assert.equal(
                await page.evaluate(() => performance.getEntriesByType('resource').filter((entry) => entry.name.includes('/modern-compat/assets/dcat-fallback.js')).length),
                1,
                'Candidate compat fallback runtime must be requested exactly once'
            );
            assert.deepEqual(await page.evaluate(() => window.upgradeOrder), ['extension', 'inline']);
            assert.equal(await page.locator('#upgrade-injected').innerText(), 'Extension ready');
            assert.equal(await page.locator('#upgrade-extra').innerText(), 'Extension extra HTML');
        }
        await page.locator('#upgrade-value').fill('Unsaved legacy input');
        await page.locator('#upgrade-open').click();
        assert.equal(await page.locator('#upgrade-modal').getAttribute('aria-modal'), 'true');
        assert.equal(await page.evaluate(() => document.querySelector('#upgrade-modal').contains(document.activeElement)), true);
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'upgrade-open');
        assert.deepEqual(await page.evaluate(() => window.upgradeEvents), ['shown', 'hidden']);
        await page.locator('#upgrade-menu').focus();
        await page.keyboard.press('ArrowDown');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'upgrade-first');
        await page.keyboard.press('End');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'upgrade-last');
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'upgrade-menu');
        await page.locator('#upgrade-tab-two').click();
        assert.equal(await page.locator('#upgrade-two').isVisible(), true);
        assert.equal(await page.locator('#upgrade-one').isVisible(), false);
        await page.keyboard.press('ArrowLeft');
        assert.equal(await page.locator('#upgrade-tab-one').getAttribute('aria-selected'), 'true');
        await page.locator('#upgrade-collapse').click();
        assert.equal(await page.locator('#upgrade-panel').isVisible(), true);
        await page.locator('#upgrade-help').focus();
        await page.waitForSelector('.dcat-modern-tooltip');
        assert.equal(await page.locator('.dcat-modern-tooltip').innerText(), 'Legacy tooltip');
        await page.keyboard.press('Escape');
        await page.locator('#upgrade-save').click();
        assert.equal(await page.locator('#upgrade-save').isDisabled(), true);
        await page.evaluate(() => window.jQuery('#upgrade-save').button('reset'));
        assert.equal(await page.locator('#upgrade-save').innerText(), 'Save');
        result.viewports = [];
        for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1366, height: 768 }, { width: 1440, height: 900 }]) {
            await page.setViewportSize(viewport);
            await page.locator('#upgrade-popover').click();
            await page.waitForSelector('.dcat-modern-popover');
            const geometry = await page.evaluate(() => {
                const bounds = document.querySelector('.dcat-modern-popover').getBoundingClientRect();
                return { pageOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), contained: bounds.left >= 0 && bounds.right <= innerWidth && bounds.top >= 0 && bounds.bottom <= innerHeight };
            });
            assert.equal(geometry.pageOverflow, 0, `${fixture} ${viewport.width} overflow`);
            assert.equal(geometry.contained, true, `${fixture} ${viewport.width} popover containment`);
            result.viewports.push({ ...viewport, ...geometry });
            if (evidenceDir && [390, 1366].includes(viewport.width)) await page.screenshot({ path: path.join(evidenceDir, `upgrade-${fixture}-${viewport.width}.png`) });
            await page.keyboard.press('Escape');
        }
        assert.equal(await page.locator('#upgrade-value').inputValue(), 'Unsaved legacy input');
        await page.locator('#upgrade-popover').click();
        const nativeTarget = `${baseUrl}${prefix}/tests/view-baseline/modern-runtime-form`;
        await page.evaluate((url) => {
            const container = document.querySelector(window.Dcat.config.pjax_container_selector);
            if (!container) throw new Error('Compat renderer probe requires a PJAX container');
            const link = document.createElement('a');
            link.id = 'upgrade-native-navigation-link';
            link.href = url;
            link.textContent = 'Open native page';
            container.appendChild(link);
        }, nativeTarget);
        const nativePjaxRequestPromise = page.waitForRequest((request) => request.url().startsWith(nativeTarget)
            && request.headers()['x-pjax'] === 'true');
        const nativeDocumentPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
        await page.locator('#upgrade-native-navigation-link').click();
        const nativePjaxRequest = await nativePjaxRequestPromise;
        const nativeResponse = await nativeDocumentPromise;
        assert.equal(nativePjaxRequest.isNavigationRequest(), false, 'Compat renderer changes must begin with a PJAX request');
        assert.equal(nativeResponse?.status(), 200, 'Compat renderer changes must load the native page successfully');
        assert.equal(nativeResponse?.request().resourceType(), 'document', 'Compat renderer changes must load the full document');
        assert.equal(nativeResponse?.request().headers()['x-pjax'], undefined, 'Renderer changes must not replace only the PJAX fragment');
        await page.waitForFunction(() => document.querySelector('[data-dcat-modern-page-config]')?.getAttribute('data-dcat-r') === '1'
            && Boolean(window.DcatReact));
        assert.equal(new URL(page.url()).searchParams.has('__dcat_legacy'), false, 'Native navigation must not carry the legacy renderer query');
        assert.equal(await page.locator('[data-dcat-compat-owner],.modal.show,.dropdown-menu.show').count(), 0, 'PJAX disposes legacy floating state');
        if (fixture === 'extension') {
            // 旧版渲染器与强制回退入口已删除：带 markup 的请求必须仍渲染当前渲染器。
            await page.goto(`${baseUrl}${prefix}/tests/view-upgrade/extension?__dcat_legacy=1`, { waitUntil: 'networkidle' });
            const forcedRenderer = await page.evaluate(() => {
                const scripts = Array.from(document.head.querySelectorAll('script'));
                return {
                    renderer: document.querySelector('[data-dcat-modern-page-config]')?.getAttribute('data-dcat-r') || null,
                    native: Boolean(window.DcatReact),
                    compat: Boolean(window.DcatCompat),
                    vendorsIndex: scripts.findIndex((script) => script.src.includes('/dcat/plugins/vendors.min.js')),
                };
            });
            assert.equal(forcedRenderer.renderer, '1', 'The removed forced-renderer query must not change the renderer');
            assert.equal(forcedRenderer.native, true, 'The removed forced-renderer query must keep the native runtime');
            assert.equal(forcedRenderer.compat, false, 'The removed forced-renderer query must not load the compat runtime');
            evidence.forcedRendererQuery = forcedRenderer;
        }
        result.status = 'passed';
        evidence.fixtures.push(result);
    }
    const captureDiagnostics = () => {
        window.__upgradeCompatDiagnosticEvents = [];
        window.__upgradeCompatDiagnosticLogs = [];
        if (window.__upgradeCompatDiagnosticCaptureInstalled) return;
        window.__upgradeCompatDiagnosticCaptureInstalled = true;
        window.addEventListener('dcat:compat:diagnostic', (event) => window.__upgradeCompatDiagnosticEvents.push(event.detail));
        const originalWarn = console.warn.bind(console);
        console.warn = (...args) => {
            const message = args.map(String).join(' ');
            if (message.startsWith('[Dcat compatibility]')) window.__upgradeCompatDiagnosticLogs.push(message);
            originalWarn(...args);
        };
    };
    await page.addInitScript(captureDiagnostics);
    await page.goto(`${baseUrl}${prefix}/tests/view-upgrade/descriptors`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.DcatCompat && document.querySelector('[data-dcat-compat]'));
    let descriptorFixtureMode = 'live-consumer';
    const liveFixture = await page.evaluate(() => {
        const islands = [...document.querySelectorAll('[data-dcat-compat-id="custom-slot"]')];
        return {
            islands: islands.length,
            matchingIslands: islands.filter((island) => island.querySelector(
                '.btn-unmapped-upgrade[data-toggle="unmapped-upgrade-widget"]'
            )).length,
        };
    });
    if (liveFixture.islands === 0 && liveFixture.matchingIslands === 0) {
        descriptorFixtureMode = 'isolated-current-dist';
        console.warn('B10 diagnostics used an isolated current-dist fixture; the live consumer route does not expose the updated descriptor fixture.');
        await page.goto('about:blank');
        await page.setContent(`<!doctype html><html><head><script id="dcat-modern-config" type="application/json">{"diagnostics":true}</script></head><body>
            <div data-dcat-compat="compat-jquery" data-dcat-compat-id="upgrade-private-surface"><div class="carousel private-extension"><button data-toggle="carousel">Legacy carousel</button></div></div>
            <div data-dcat-compat="compat-css" data-dcat-compat-id="custom-slot"><button class="btn-unmapped-upgrade" data-toggle="unmapped-upgrade-widget">Legacy control</button><input value="private-upgrade-field-sentinel"><span>private-upgrade-html-sentinel</span></div>
            <div data-dcat-compat="compat-css" data-dcat-compat-id="custom-slot"><button class="btn-unmapped-upgrade" data-toggle="unmapped-upgrade-widget">Legacy control</button><input value="private-upgrade-field-sentinel"><span>private-upgrade-html-sentinel</span></div>
        </body></html>`);
        await page.evaluate(captureDiagnostics);
        await page.addScriptTag({ path: path.join(root, 'resources/dist/modern-compat/assets/dcat-modern-compat.js') });
    }
    assert.equal(liveFixture.islands === 0 && liveFixture.matchingIslands === 0
        || liveFixture.islands === 2 && liveFixture.matchingIslands === 2, true,
    `A partially deployed live descriptor fixture must fail instead of falling back (${descriptorFixtureMode}, DOM ${JSON.stringify(liveFixture)})`);
    await page.waitForFunction(() => window.DcatCompat?.diagnostics().some((entry) => entry.surface === 'unmapped-upgrade-widget'));
    const diagnosticsEvidence = await page.evaluate(() => {
        const initial = window.DcatCompat.diagnostics();
        const classLocations = initial
            .filter((entry) => entry.code === 'UNKNOWN_COMPAT_CLASS' && entry.surface === 'btn-unmapped-upgrade')
            .map((entry) => entry.location);
        const apiLocations = initial
            .filter((entry) => entry.code === 'UNKNOWN_COMPAT_API' && entry.surface === 'unmapped-upgrade-widget')
            .map((entry) => entry.location);
        const expectedRegionReports = [...new Set(classLocations)].flatMap((location) => [
            { code: 'UNKNOWN_COMPAT_CLASS', surface: 'btn-unmapped-upgrade', location },
            { code: 'UNKNOWN_COMPAT_API', surface: 'unmapped-upgrade-widget', location },
        ]);
        const capturedInitially = {
            events: expectedRegionReports.map((expected) => window.__upgradeCompatDiagnosticEvents.filter((entry) =>
                entry.code === expected.code && entry.surface === expected.surface && entry.location === expected.location
            ).length),
            logs: expectedRegionReports.map((expected) => window.__upgradeCompatDiagnosticLogs.filter((message) =>
                message.includes(`${expected.code}: ${expected.surface} in ${expected.location}.`)
            ).length),
        };
        const eventCount = window.__upgradeCompatDiagnosticEvents.length;
        const logCount = window.__upgradeCompatDiagnosticLogs.length;
        window.DcatCompat.inspect();
        window.DcatCompat.inspect();
        const repeated = {
            entries: window.DcatCompat.diagnostics().length - initial.length,
            events: window.__upgradeCompatDiagnosticEvents.length - eventCount,
            logs: window.__upgradeCompatDiagnosticLogs.length - logCount,
        };
        const scriptValue = 'private-upgrade-script-value-sentinel';
        const scriptHtml = 'private-upgrade-script-html-sentinel';
        const source = `window.Dcat.carousel('${scriptValue}'); const html = '<p>${scriptHtml}</p>';`;
        window.dispatchEvent(new CustomEvent('dcat:compat:script', { detail: { source } }));
        const diagnostics = window.DcatCompat.diagnostics();
        const serialized = JSON.stringify({
            diagnostics,
            events: window.__upgradeCompatDiagnosticEvents,
            logs: window.__upgradeCompatDiagnosticLogs,
        });

        return {
            mode: document.querySelector('[data-dcat-compat]').dataset.dcatCompat,
            diagnostics,
            classLocations: [...new Set(classLocations)].sort(),
            apiLocations: [...new Set(apiLocations)].sort(),
            capturedInitially,
            repeated,
            inlineScriptLocation: diagnostics.some((entry) => entry.code === 'UNKNOWN_COMPAT_API'
                && entry.surface === 'carousel' && entry.location === 'inline-script#source'),
            privateDataLeaked: ['private-upgrade-field-sentinel', 'private-upgrade-html-sentinel', scriptValue, scriptHtml]
                .some((secret) => serialized.includes(secret)),
        };
    });
    evidence.descriptors = { ...diagnosticsEvidence, fixtureMode: descriptorFixtureMode, consumerFixtureDom: liveFixture };
    assert.equal(evidence.descriptors.mode, 'compat-jquery');
    assert.equal(evidence.descriptors.diagnostics.some((entry) => entry.code === 'UNKNOWN_COMPAT_API' && entry.surface === 'carousel'), true);
    assert.deepEqual(evidence.descriptors.classLocations, ['compat-region#1', 'compat-region#2'],
        `Identical unknown classes must identify both anonymous compat regions (${descriptorFixtureMode}, DOM ${JSON.stringify(liveFixture)})`);
    assert.deepEqual(evidence.descriptors.apiLocations, evidence.descriptors.classLocations, 'Identical unknown APIs must identify the same two compat regions');
    assert.equal(evidence.descriptors.classLocations.every((location) => /^compat-region#\d+$/.test(location)), true);
    assert.deepEqual(evidence.descriptors.capturedInitially, { events: [1, 1, 1, 1], logs: [1, 1, 1, 1] },
        `Initial diagnostics must emit one event and warning per unknown class/API and region (${descriptorFixtureMode}, DOM ${JSON.stringify(liveFixture)})`);
    assert.deepEqual(evidence.descriptors.repeated, { entries: 0, events: 0, logs: 0 }, 'Repeated inspect must deduplicate diagnostics, events, and warnings');
    assert.equal(evidence.descriptors.inlineScriptLocation, true, 'Inline script diagnostics must have a distinct source location');
    assert.equal(evidence.descriptors.privateDataLeaked, false, 'Field values, HTML, and inline script source must not enter diagnostics');
    evidence.compatFallback = [];
    for (const fixture of ['standard', 'blade', 'extension']) {
        await page.goto(`${baseUrl}${prefix}/tests/view-upgrade/${fixture}?compat_fallback=1`, { waitUntil: 'networkidle' });
        const state = await page.evaluate(() => ({
            native: Boolean(window.DcatReact),
            compat: Boolean(window.DcatCompat && window.DcatNativeRuntime),
            active: document.body.classList.contains('dcat-modern-active'),
            forbidden: performance.getEntriesByType('resource').filter((entry) => /\/adminlte\/|\/vendors(?:-rtl)?\.min\./.test(entry.name)).map((entry) => entry.name),
            runtimes: [...document.scripts].filter((script) => /modern-compat\/assets\//.test(script.src)).length,
        }));
        assert.equal(state.native, false, 'Candidate Blade fallback must not need React');
        assert.equal(state.compat, true);
        assert.equal(state.active, true);
        assert.deepEqual(state.forbidden, []);
        assert.equal(state.runtimes, 1, 'Candidate fallback must own one compatibility runtime');
        if (fixture === 'standard') {
            const fallbackDocumentToken = await page.evaluate((destination) => {
                window.__fallbackDocumentToken = Math.random().toString(36);
                window.__fallbackPjaxEvents = [];
                const phases = ['start', 'send', 'beforeReplace', 'success', 'complete', 'loaded', 'end'];
                window.jQuery(document).on(phases.map((phase) => `pjax:${phase}.fallbackProbe`).join(' '), (event) => {
                    window.__fallbackPjaxEvents.push(event.type.slice('pjax:'.length));
                });
                const selector = window.Dcat.config.pjax_container_selector;
                const container = document.querySelector(selector);
                const link = document.createElement('a');
                link.id = 'upgrade-fallback-pjax-link';
                link.href = destination;
                link.textContent = 'Open Blade fixture';
                container.appendChild(link);
                return window.__fallbackDocumentToken;
            }, `${baseUrl}${prefix}/tests/view-upgrade/blade?compat_fallback=1&pjax_probe=1`);
            const pjaxRequestPromise = page.waitForRequest((request) => request.url().includes('pjax_probe=1'));
            await page.locator('#upgrade-fallback-pjax-link').click();
            const pjaxRequest = await pjaxRequestPromise;
            const pjaxHeaders = await pjaxRequest.allHeaders();
            assert.equal(pjaxHeaders['x-pjax'], 'true', 'Same-renderer fallback navigation must retain the PJAX request header');
            assert.equal(pjaxHeaders['x-pjax-container'], await page.evaluate(() => window.Dcat.config.pjax_container_selector));
            await page.waitForURL((url) => url.searchParams.get('pjax_probe') === '1');
            await page.waitForFunction(() => document.querySelector('[data-upgrade-override="1"]'));
            assert.equal(await page.evaluate((token) => window.__fallbackDocumentToken === token, fallbackDocumentToken), true);
            assert.equal(await page.evaluate(() => document.title.includes('Blade override')), true, 'Same-renderer PJAX must update the title');
            assert.deepEqual(await page.evaluate(() => window.__fallbackPjaxEvents), ['start', 'send', 'beforeReplace', 'success', 'complete', 'loaded', 'end']);
            assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').some((entry) => /\/adminlte\/|\/vendors(?:-rtl)?\.min\./.test(entry.name))), false);

            await page.goBack();
            await page.waitForURL((url) => url.pathname.endsWith('/tests/view-upgrade/standard'));
            await page.waitForFunction(() => !document.querySelector('[data-upgrade-override="1"]'));
            assert.deepEqual((await page.evaluate(() => window.__fallbackPjaxEvents)).slice(-7), ['start', 'send', 'beforeReplace', 'success', 'complete', 'loaded', 'end']);
            await page.goForward();
            await page.waitForURL((url) => url.searchParams.get('pjax_probe') === '1');
            await page.waitForFunction(() => document.querySelector('[data-upgrade-override="1"]'));
            assert.equal(await page.evaluate((token) => window.__fallbackDocumentToken === token, fallbackDocumentToken), true);

            const nativeTarget = `${baseUrl}${prefix}/tests/view-baseline/modern-runtime-form`;
            const toNative = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
            await page.evaluate((url) => { window.Dcat.reload(url); }, nativeTarget);
            const nativeResponse = await toNative;
            assert.equal(nativeResponse?.status(), 200, 'Renderer changes must perform a complete document GET');
            await page.waitForSelector('[data-dcat-modern-form-renderer]');
            assert.equal(await page.evaluate(() => Boolean(window.DcatReact)), true, 'Compat-to-native navigation must load the native renderer');

            const compatTarget = `${baseUrl}${prefix}/tests/view-upgrade/standard?compat_fallback=1`;
            const toCompat = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
            await page.evaluate((url) => { window.Dcat.reload(url); }, compatTarget);
            const compatResponse = await toCompat;
            assert.equal(compatResponse?.status(), 200, 'Reverse renderer changes must perform a complete document GET');
            await page.waitForFunction(() => window.DcatCompat && !window.DcatReact && document.body.classList.contains('dcat-modern-active'));
        }
        await page.locator('#upgrade-value').fill('Preserved fallback input');
        await page.locator('#upgrade-open').click();
        assert.equal(await page.locator('#upgrade-modal').getAttribute('aria-modal'), 'true');
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'upgrade-open');
        await page.locator('#upgrade-tab-two').click();
        assert.equal(await page.locator('#upgrade-two').isVisible(), true);
        assert.equal(await page.locator('#upgrade-value').inputValue(), 'Preserved fallback input');
        await page.evaluate(() => window.Dcat.error('Fallback validation failed'));
        assert.equal(await page.locator('[data-dcat-compat-notices] [role="alert"]').innerText(), 'Fallback validation failed\n×');
        await page.getByRole('button', { name: 'Dismiss notification' }).click();
        assert.equal(await page.locator('[data-dcat-compat-notices] [role="alert"]').count(), 0);
        if (fixture === 'extension') assert.equal(await page.evaluate(() => window.upgradeHeadCompatReady), true);
        evidence.compatFallback.push({ fixture, ...state });
    }
    const readRendererState = () => page.evaluate(() => ({
        renderer: document.querySelector('[data-dcat-modern-page-config]')?.getAttribute('data-dcat-r') || null,
        jquery: Boolean(window.jQuery),
        dcat: Boolean(window.Dcat && typeof window.Dcat.reload === 'function'),
        pjax: Boolean(window.jQuery?.pjax && typeof window.jQuery.pjax.reload === 'function'),
        pjaxHandlerActive: window.jQuery?.pjax?._dcatPopstateHandlerActive === true,
        native: Boolean(window.DcatReact),
        compat: Boolean(window.DcatCompat && window.DcatNativeRuntime),
    }));
    const navigateDocument = async (url) => {
        const navigation = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
        await page.evaluate((target) => window.Dcat.reload(target), url);
        const response = await navigation;
        assert.equal(response?.status(), 200, 'Renderer changes must load a complete document successfully');
        assert.equal(response?.request().resourceType(), 'document', 'Renderer changes must use a document request');
        assert.equal(response?.request().headers()['x-pjax'], undefined, 'Renderer changes must not replace only the PJAX fragment');
        return response;
    };
    const assertModernRuntime = async (renderer) => {
        await page.waitForFunction((expectedRenderer) => {
            const marker = document.querySelector('[data-dcat-modern-page-config]');
            return marker?.getAttribute('data-dcat-r') === expectedRenderer
                && (expectedRenderer === '1' ? Boolean(window.DcatReact) : Boolean(window.DcatCompat && window.DcatNativeRuntime));
        }, renderer);
        const state = await readRendererState();
        assert.equal(state.renderer, renderer);
        assert.equal(state.native, renderer === '1', 'Native renderer availability must match its page marker');
        assert.equal(state.compat, renderer === '0', 'Compat renderer availability must match its page marker');
        return state;
    };

    // 旧版渲染器与 classic 包已删除：可观测的跳转只剩 native(1) 与 compat(0)，
    // 两者之间必须完整加载文档，并且历史前进/后退要回到正确的渲染器。
    evidence.rendererNavigation = {};

    const compatUrl = `${baseUrl}${prefix}/tests/view-upgrade/standard?compat_fallback=1`;
    const nativeUrl = `${baseUrl}${prefix}/tests/view-baseline/modern-runtime-form`;

    const historyProbePage = await page.context().newPage();
    const previousPage = page;
    const historyProbeErrors = [];
    page = historyProbePage;
    page.on('pageerror', (error) => historyProbeErrors.push(String(error)));
    await previousPage.close();

    const compatResponse = await page.goto(compatUrl, { waitUntil: 'networkidle' });
    assert.equal(compatResponse?.status(), 200, 'Compat renderer fixture must load successfully');
    evidence.rendererNavigation.compat = await assertModernRuntime('0');
    const compatDocumentToken = await page.evaluate(() => {
        window.__compatDocumentToken = Math.random().toString(36);
        return window.__compatDocumentToken;
    });

    const compatToNativeResponse = await navigateDocument(nativeUrl);
    evidence.rendererNavigation.compatToNative = {
        status: compatToNativeResponse.status(),
        ...(await assertModernRuntime('1')),
    };
    assert.equal(
        await page.evaluate((token) => window.__compatDocumentToken === token, compatDocumentToken),
        false,
        'Compat-to-native renderer changes must create a new document'
    );

    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForURL(compatUrl);
    evidence.rendererNavigation.compatToNativeBack = {
        url: page.url(),
        ...(await assertModernRuntime('0')),
    };

    await page.goForward({ waitUntil: 'domcontentloaded' });
    await page.waitForURL(nativeUrl);
    evidence.rendererNavigation.compatToNativeForward = {
        url: page.url(),
        ...(await assertModernRuntime('1')),
    };

    const nativeToCompatResponse = await navigateDocument(compatUrl);
    evidence.rendererNavigation.nativeToCompat = {
        status: nativeToCompatResponse.status(),
        ...(await assertModernRuntime('0')),
    };
    assert.deepEqual(historyProbeErrors, [], 'Renderer history fixture must not emit page errors');
    if (evidenceDir) fs.writeFileSync(path.join(evidenceDir, 'upgrade-browser.json'), `${JSON.stringify(evidence, null, 2)}\n`);
    return evidence;
}
