import assert from 'node:assert/strict';

export async function verifyNativeRuntime(page, baseUrl, adminPrefix) {
    const route = (name) => `${baseUrl}${adminPrefix}/tests/view-baseline/${name}`;
    const basic = route('modern-runtime-form');
    const shell = route('modern-runtime-shell');
    const grid = route('modern-runtime-grid');
    const compat = route('modern-grid-compat-displayers');
    await page.goto(basic, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-dcat-modern-form-renderer="react-layout"]');
    const native = await page.evaluate(() => ({
        jquery: typeof window.jQuery,
        core: Boolean(window.DcatNativeRuntime && window.Dcat),
        scripts: Array.from(document.scripts, (node) => node.src).filter(Boolean),
    }));
    assert.equal(native.core, true, 'Native Dcat must boot');
    assert.equal(native.jquery, 'undefined', 'Native Form must not load jQuery');
    assert.equal(native.scripts.some((url) => /modern-compat|jquery|adminlte|vendors\.min|bootstrap-(?!icons)/i.test(url)), false);

    const field = page.locator('input[type="text"]:visible').first();
    await field.fill('B9 unsaved input');
    await page.evaluate(() => {
        window.__b9Draft = document.querySelector('input[type="text"]');
        window.__b9Events = [];
        ['start', 'before-replace', 'success', 'complete', 'loaded', 'end', 'abort', 'error'].forEach((name) => {
            document.addEventListener(`dcat:pjax:${name}`, () => window.__b9Events.push(name));
        });
    });
    await page.route('**/b9-network-failure', (request) => request.abort());
    await page.evaluate(async () => window.Dcat.reload('/b9-network-failure'));
    assert.equal(await field.inputValue(), 'B9 unsaved input');
    assert.equal(await page.evaluate(() => window.__b9Draft === document.querySelector('input[type="text"]')), true);
    assert.equal(await page.evaluate(() => window.__b9Events.includes('before-replace')), false);
    await page.unroute('**/b9-network-failure');

    await page.route('**/b9-slow-read', async (request) => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        await request.fulfill({ contentType: 'text/html', body: '<div id="b9-stale">Stale read</div>' }).catch(() => {});
    });
    await page.evaluate(async (target) => {
        const first = window.DcatNativeRuntime.pjax(window.Dcat, '/b9-slow-read');
        await window.DcatNativeRuntime.pjax(window.Dcat, target);
        await first;
    }, shell);
    await page.waitForFunction(() => window.DcatReact.status().mountedRoots > 0);
    assert.equal(await page.locator('#b9-stale').count(), 0);
    assert.equal(await page.evaluate(() => window.__b9Events.includes('abort')), true);
    await page.unroute('**/b9-slow-read');

    const navigate = async (target) => {
        const previous = await page.locator('#app').elementHandle();
        await page.evaluate(async (url) => window.DcatNativeRuntime.pjax(window.Dcat, url), target);
        await page.waitForFunction((node) => !node?.isConnected, previous);
        await previous?.dispose();
        await page.waitForFunction(() => window.DcatReact.status().mountedRoots > 0);
    };
    await navigate(basic);
    await page.evaluate(() => { window.__b9HistorySentinel = true; });
    await page.goBack();
    await page.waitForURL(shell);
    await page.waitForFunction(() => Boolean(document.querySelector('[data-dcat-modern-capability]')) && document.querySelector('#pjax-container')?.getAttribute('aria-busy') !== 'true');
    assert.equal(await page.evaluate(() => window.__b9HistorySentinel), true, 'Back must preserve the runtime');
    await page.goForward();
    await page.waitForURL(basic);
    await page.waitForSelector('[data-dcat-modern-form-renderer="react-layout"]');
    assert.equal(await page.evaluate(() => window.__b9HistorySentinel), true);

    const samples = [];
    for (let cycle = 0; cycle < 10; cycle += 1) {
        await navigate(shell);
        await navigate(basic);
        samples.push(await page.evaluate(() => ({
            ...window.DcatNativeRuntime.status(),
            roots: window.DcatReact.status().mountedRoots,
            overlays: document.querySelectorAll('#dcat-modern-overlay-root').length,
            nodes: document.querySelectorAll('*').length,
        })));
    }
    const first = samples[0];
    const last = samples.at(-1);
    assert.equal(last.initObservers, first.initObservers);
    assert.equal(last.pendingTimers, 0);
    assert.equal(last.pendingRequests, 0);
    assert.equal(last.roots, first.roots);
    assert.equal(last.overlays, 1);
    assert.equal(last.scripts, first.scripts);
    assert.equal(last.nodes, first.nodes);
    assert.equal(await page.evaluate(() => typeof window.jQuery), 'undefined');

    await navigate(grid);
    await page.waitForSelector('[data-dcat-modern-grid-renderer="react-payload"]');
    assert.equal(await page.evaluate(() => typeof window.jQuery), 'undefined', 'Native Grid must not load jQuery');
    const checkbox = page.locator('[data-dcat-grid-row-selector="1"]').first();
    await checkbox.check();
    assert.deepEqual(await page.evaluate(() => window.Dcat.grid.selected()), [await checkbox.getAttribute('data-id')]);
    await page.locator('.filter-button-group > button').first().click();
    await page.waitForSelector('[data-dcat-modern-filter-backdrop]');
    await page.keyboard.press('Escape');

    await navigate(compat);
    await page.waitForFunction(() => typeof window.jQuery?.fn?.qrcode === 'function');
    await page.evaluate(() => {
        window.__b9Jquery = window.jQuery;
        window.__b9LegacyEvents = [];
        ['start', 'send', 'beforeReplace', 'success', 'complete', 'loaded', 'end'].forEach((name) => {
            window.jQuery(document).on(`pjax:${name}.b9`, () => window.__b9LegacyEvents.push(name));
        });
    });
    await navigate(basic);
    const eventOrder = await page.evaluate(() => window.__b9LegacyEvents);
    assert.deepEqual(eventOrder, ['start', 'send', 'beforeReplace', 'success', 'complete', 'loaded', 'end']);
    await navigate(compat);
    assert.equal(await page.evaluate(() => window.__b9Jquery === window.jQuery && typeof window.jQuery.fn.qrcode === 'function'), true);
    await page.evaluate(() => window.jQuery(document).off('.b9'));
    return { native, nativeGridSelection: true, cycles: samples.length * 2, first, last, staleReadCommitted: false, failedNavigationPreservedDraft: true, eventOrder };
}
