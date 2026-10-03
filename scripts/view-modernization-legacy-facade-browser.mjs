import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { loginCompatGeometry } from './login-compat-geometry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'resources/modern/legacy-assets.json'), 'utf8'));
const marker = '/*! Dcat-owned legacy asset facade. No Bootstrap or AdminLTE implementation. */';
const chromePath = process.env.DCAT_CHROME_PATH || '/usr/bin/google-chrome';
const assets = [
    ...registry.javascript.map((asset) => ({ path: asset, kind: 'javascript' })),
    ...registry.stylesheets.map((asset) => ({ path: asset, kind: 'stylesheet' })),
];
const allowedPaths = new Set(assets.map(({ path: asset }) => `/vendor/dcat-admin/${asset}`));
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dcat-legacy-facade-browser-'));
const stagedDist = path.join(temporaryRoot, 'dist');
const server = createServer();
let browser;

function serveFile(requestPath, response) {
    const relativePath = requestPath.replace(/^\/vendor\/dcat-admin\//, '');
    const filePath = path.resolve(stagedDist, relativePath);

    if (!filePath.startsWith(`${stagedDist}${path.sep}`) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Not found');
        return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = extension === '.css'
        ? 'text/css; charset=utf-8'
        : extension === '.js'
            ? 'application/javascript; charset=utf-8'
            : extension === '.woff2'
                ? 'font/woff2'
                : extension === '.woff'
                    ? 'font/woff'
                    : 'application/octet-stream';

    response.writeHead(200, { 'content-type': contentType, 'cache-control': 'no-store' });
    fs.createReadStream(filePath).pipe(response);
}

server.on('request', (request, response) => {
    const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');

    if (requestUrl.pathname === '/fixture') {
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        response.end(fixtureHtml());
        return;
    }

    if (requestUrl.pathname === '/login-compat-geometry.mjs') {
        response.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
        response.end(fs.readFileSync(path.join(root, 'scripts/login-compat-geometry.mjs')));
        return;
    }

    if (requestUrl.pathname.startsWith('/vendor/dcat-admin/')) {
        serveFile(requestUrl.pathname, response);
        return;
    }

    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
});

function fixtureHtml() {
    const styles = registry.stylesheets
        .map((asset) => `<link rel="stylesheet" href="/vendor/dcat-admin/${asset}">`)
        .join('\n');
    const scripts = registry.javascript
        .map((asset) => `<script src="/vendor/dcat-admin/${asset}"></script>`)
        .join('\n');

    return `<!doctype html>
<html lang="en" class="dcat-modern-active">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${styles}${scripts}</head>
<body class="dcat-modern-active">
  <main>
    <div id="layout-probe" class="row"><div id="column-probe" class="col-md-6">Column</div></div>
    <button id="modal-opener" type="button">Open modal</button>
    <div id="modal-probe" class="modal" role="dialog" aria-hidden="true">
      <div class="modal-dialog"><div class="modal-content"><div class="modal-body"><button id="modal-first">Save</button><button id="modal-last">Close</button></div></div></div>
    </div>
    <div class="nav nav-tabs"><a id="tab-one" href="#panel-one" data-toggle="tab" class="active">One</a><a id="tab-two" href="#panel-two" data-toggle="tab">Two</a></div>
    <div id="panel-one" class="tab-pane active">Panel one</div><div id="panel-two" class="tab-pane">Panel two</div>
    <div class="dropdown"><button id="dropdown-trigger" data-toggle="dropdown" aria-expanded="false">Actions</button><div class="dropdown-menu"><button id="dropdown-first">First action</button><button id="dropdown-last">Last action</button></div></div>
  </main>
  <div class="dcat-modern-active full-page">
    <div class="app-content content"><div class="content-body"><section class="content">
      <div class="row"><div class="col-md-12"><div class="login-page"><div class="login-box" style="margin-top:-10rem;padding:5px">
        <div class="login-logo"><svg width="80" height="80" aria-label="Logo"></svg><span>Example Admin</span></div>
        <div class="card"><div class="card-body login-card-body">
          <p class="login-box-msg">Welcome back</p>
          <form onsubmit="return false">
            <fieldset class="form-label-group form-group has-icon-left">
              <input id="compat-login-email" class="form-control" placeholder="Email" name="username">
              <div class="form-control-position">@</div><label for="compat-login-email">Email</label>
              <div class="help-block with-errors"></div>
            </fieldset>
            <fieldset class="form-label-group form-group has-icon-left">
              <input id="compat-login-password" class="form-control" placeholder="Password" type="password" name="password">
              <div class="form-control-position">*</div><label for="compat-login-password">Password</label>
              <div class="help-block with-errors"></div>
            </fieldset>
            <div><a class="btn btn-success login-btn">Register</a><button class="btn btn-primary pull-right login-btn">Login</button></div>
          </form>
        </div></div>
      </div></div></div></div>
    </section></div></div>
  </div>
</body>
</html>`;
}

function isOldDependency(url) {
    return /(?:^|\/)adminlte(?:\/|\.|$)|(?:^|\/)bootstrap(?:\/|\.|$)/i.test(url.pathname);
}

async function run() {
    assert.ok(fs.existsSync(chromePath), `Chrome executable is missing: ${chromePath}`);
    assert.equal(registry.javascript.length, 3, 'The frozen legacy registry should contain three JavaScript paths.');
    assert.equal(registry.stylesheets.length, 10, 'The frozen legacy registry should contain ten stylesheet paths.');
    assert.equal(new Set(assets.map(({ path: asset }) => asset)).size, assets.length, 'The legacy registry should not contain duplicate paths.');

    fs.cpSync(path.join(root, 'resources/dist'), stagedDist, { recursive: true });
    const generated = spawnSync(process.execPath, [
        path.join(root, 'scripts/view-modernization-legacy-assets.js'),
        `--out-dir=${stagedDist}`,
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(generated.status, 0, `${generated.stdout}${generated.stderr}`);

    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(Number(process.env.DCAT_FACADE_PORT || 0), process.env.DCAT_FACADE_HOST || '127.0.0.1', resolve);
    });
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const baseUrl = `http://127.0.0.1:${address.port}`;
    // 扩展连接验证复用同一 fixture，避免另起一套页面或浏览器配置。
    if (process.argv.includes('--serve-only')) {
        console.log(`Facade fixture ready: ${baseUrl}/fixture`);
        await new Promise((resolve) => process.once('SIGINT', resolve));
        return;
    }
    browser = await chromium.launch({
        executablePath: chromePath,
        headless: true,
        args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
    });

    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const pageErrors = [];
    const failedRequests = [];
    const badResponses = [];
    const externalRequests = [];
    const legacyRequests = [];
    const unexpectedRuntimeAssets = [];
    const serverOrigin = new URL(baseUrl).origin;

    page.on('pageerror', (error) => pageErrors.push(String(error)));
    page.on('requestfailed', (request) => failedRequests.push(`${request.url()}: ${request.failure()?.errorText || 'failed'}`));
    page.on('response', (response) => {
        if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
    });
    page.on('request', (request) => {
        const requestUrl = new URL(request.url());
        if (requestUrl.origin !== serverOrigin) externalRequests.push(request.url());
        if (isOldDependency(requestUrl) && !allowedPaths.has(requestUrl.pathname)) legacyRequests.push(request.url());
        if (['script', 'stylesheet'].includes(request.resourceType()) && !allowedPaths.has(requestUrl.pathname)) {
            unexpectedRuntimeAssets.push(request.url());
        }
    });
    await page.route('**/*', (route) => {
        if (new URL(route.request().url()).origin !== serverOrigin) {
            return route.abort();
        }
        return route.continue();
    });

    try {
        for (const asset of assets) {
            const url = `${baseUrl}/vendor/dcat-admin/${asset.path}`;
            const response = await context.request.get(url);
            assert.equal(response.status(), 200, `${asset.path} should return HTTP 200.`);
            const contentType = response.headers()['content-type'] || '';
            assert.match(contentType, asset.kind === 'stylesheet' ? /text\/css/i : /javascript/i, asset.path);
            assert.ok((await response.text()).includes(marker), `${asset.path} should return the Dcat facade marker.`);
        }

        await page.goto(`${baseUrl}/fixture`, { waitUntil: 'networkidle' });
        await page.waitForFunction(() => Boolean(window.jQuery?.fn?.modal && window.DcatCompat));

        const cssState = await page.evaluate(() => ({
            rowDisplay: getComputedStyle(document.querySelector('#layout-probe')).display,
            columnWidth: document.querySelector('#column-probe').getBoundingClientRect().width,
            modalHidden: getComputedStyle(document.querySelector('#modal-probe')).display,
        }));
        assert.equal(cssState.rowDisplay, 'flex', 'The legacy row facade should apply Dcat compatibility layout CSS.');
        assert.ok(cssState.columnWidth > 300, 'The legacy column facade should apply its responsive width.');
        assert.equal(cssState.modalHidden, 'none', 'The modal should start hidden under compatibility CSS.');

        await page.locator('#modal-opener').focus();
        await page.evaluate(() => window.jQuery('#modal-probe').modal('show'));
        assert.equal(await page.locator('#modal-probe').evaluate((element) => getComputedStyle(element).display), 'grid');
        assert.equal(await page.evaluate(() => document.activeElement?.id), 'modal-first');
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => document.activeElement?.id), 'modal-opener');
        assert.equal(await page.locator('#modal-probe').getAttribute('aria-hidden'), 'true');

        await page.evaluate(() => window.jQuery('#tab-two').tab('show'));
        assert.equal(await page.locator('#panel-two').evaluate((element) => element.classList.contains('active')), true);
        await page.locator('#tab-two').press('ArrowLeft');
        assert.equal(await page.evaluate(() => document.activeElement?.id), 'tab-one');

        await page.locator('#dropdown-trigger').focus();
        await page.keyboard.press('ArrowDown');
        assert.equal(await page.evaluate(() => document.activeElement?.id), 'dropdown-first');
        assert.equal(await page.locator('.dropdown-menu').evaluate((element) => getComputedStyle(element).display), 'block');
        await page.keyboard.press('End');
        assert.equal(await page.evaluate(() => document.activeElement?.id), 'dropdown-last');
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => document.activeElement?.id), 'dropdown-trigger');

        for (const width of [1280, 375, 320]) {
            await page.setViewportSize({ width, height: 812 });
            for (const value of ['', 'layout-check']) {
                await page.locator('#compat-login-email').fill(value);
                await page.locator('#compat-login-password').fill(value);
                const geometry = await page.evaluate(loginCompatGeometry);
                assert.equal(geometry.fields.length, 2);
                assert.ok(geometry.fields.every((field) => field.iconInside && field.textClearsIcon && field.labelCorrect), JSON.stringify(geometry));
                assert.ok(geometry.brandSingleRow && geometry.buttonsSingleRow && geometry.noHorizontalOverflow, JSON.stringify(geometry));
            }
            const errorLayout = await page.evaluate(() => {
                const groups = document.querySelectorAll('.form-label-group');
                const error = groups[0].querySelector('.help-block');
                error.textContent = 'Please enter a valid email address.';
                const bounds = error.getBoundingClientRect();
                const clear = bounds.top >= groups[0].querySelector('input').getBoundingClientRect().bottom
                    && bounds.bottom <= groups[1].querySelector('label').getBoundingClientRect().top;
                error.textContent = '';
                return clear;
            });
            assert.ok(errorLayout, 'Validation feedback must not overlap the current input or next floating label.');
        }

        assert.deepEqual(pageErrors, [], `The facade page should not emit page errors: ${pageErrors.join(' | ')}`);
        assert.deepEqual(failedRequests, [], `The facade page should not fail requests: ${failedRequests.join(' | ')}`);
        assert.deepEqual(badResponses, [], `The facade page should not receive bad responses: ${badResponses.join(' | ')}`);
        assert.deepEqual(externalRequests, [], `The facade page should not request external assets: ${externalRequests.join(' | ')}`);
        assert.deepEqual(legacyRequests, [], `The facade page should not request Bootstrap/AdminLTE implementations: ${legacyRequests.join(' | ')}`);
        assert.deepEqual(unexpectedRuntimeAssets, [], `The facade page should only load registered facade JavaScript and CSS: ${unexpectedRuntimeAssets.join(' | ')}`);
        console.log(`Legacy facade browser contracts OK: ${assets.length} fixed URLs, modal/tab/dropdown interactions, compat CSS, and zero old dependency requests.`);
    } finally {
        await context.close();
    }
}

try {
    await run();
} finally {
    try {
        if (browser) await browser.close();
    } finally {
        try {
            if (server.listening) await new Promise((resolve) => server.close(resolve));
        } finally {
            fs.rmSync(temporaryRoot, { recursive: true, force: true });
        }
    }
}
