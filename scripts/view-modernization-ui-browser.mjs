import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// 同时检查 native 和真实插件 CSS，避免只验令牌而漏掉运行时覆盖。
export async function verifyModernUi(page, baseUrl, prefix, evidenceDir) {
    const evidence = { uiSpecVersion: '1.1.0', captures: [] };
    const viewports = [[390, 844], [768, 1024], [1024, 768], [1366, 768], [1440, 900]];
    fs.mkdirSync(evidenceDir, { recursive: true });
    for (const family of ['form-basic', 'form-advanced-vendor', 'grid']) {
        await page.goto(`${baseUrl}${prefix}/tests/view-baseline/modern-${family}`, { waitUntil: 'networkidle' });
        await page.waitForSelector('[data-dcat-modern-react-mounted]');
        for (const [width, height] of viewports) {
            await page.setViewportSize({ width, height });
            const state = await page.evaluate(() => {
                const visible = (node) => node.getBoundingClientRect().width > 1 && node.getBoundingClientRect().height > 1;
                const describe = (node) => {
                    const style = getComputedStyle(node);
                    return { height: node.getBoundingClientRect().height, radius: style.borderRadius, grouped: Boolean(node.closest('.input-group')), color: style.color, background: style.backgroundColor };
                };
                return {
                    overflow: document.documentElement.scrollWidth - innerWidth,
                    controls: [...document.querySelectorAll('.dcat-modern-form-field input.form-control:not([type="hidden"]),.dcat-modern-form .select2-selection,.web-uploader .placeholder .webuploader-pick')].filter(visible).map(describe),
                    panels: [...document.querySelectorAll('.dcat-modern-form-view,.dcat-modern-grid-view')].map(describe),
                    upload: [...document.querySelectorAll('.web-uploader .placeholder .webuploader-pick')].filter(visible).map(describe),
                };
            });
            assert.ok(state.overflow <= 1, `${family}/${width}: page overflow ${state.overflow}`);
            assert.ok(state.panels.length, `${family}: missing rendered surface`);
            state.panels.forEach((panel) => {
                assert.equal(panel.radius, '12px', `${family}: surface radius`);
                assert.equal(panel.background, 'rgb(255, 255, 255)', `${family}: surface background`);
            });
            if (family !== 'grid') assert.ok(state.controls.length, `${family}: missing controls`);
            state.controls.forEach((control) => {
                assert.ok(control.height >= (width <= 991 ? 44 : 40), `${family}/${width}: undersized control ${JSON.stringify(control)}`);
                if (!control.grouped) assert.equal(control.radius, '8px', `${family}: control radius`);
            });
            if (family === 'form-advanced-vendor') {
                assert.ok(state.upload.length, 'missing real WebUploader witness');
                state.upload.forEach((upload) => assert.equal(upload.color, 'rgb(55, 65, 81)', 'upload label must remain readable after plugin CSS loads'));
            }
            await page.screenshot({ path: path.join(evidenceDir, `ui-${family}-${width}.png`), fullPage: true });
            evidence.captures.push({ family, width, height, ...state });
        }
        if (family === 'form-basic') {
            const input = page.locator('.dcat-modern-form-field input.form-control:not([type="hidden"]):not(:disabled):not([readonly])').first();
            const before = await input.boundingBox();
            await input.focus();
            const focused = await input.evaluate((node) => ({ border: getComputedStyle(node).borderColor, shadow: getComputedStyle(node).boxShadow }));
            assert.equal(focused.border, 'rgb(88, 108, 177)');
            assert.notEqual(focused.shadow, 'none');
            assert.deepEqual(await input.boundingBox(), before, 'focus must not shift the control');
            evidence.focus = focused;
        }
        if (family === 'form-advanced-vendor') {
            const selection = page.locator('.select2-selection').first();
            await selection.click();
            await page.waitForSelector('.select2-dropdown');
            const dropdown = await page.locator('.select2-dropdown').evaluate((node) => {
                const rect = node.getBoundingClientRect();
                return { radius: getComputedStyle(node).borderRadius, shadow: getComputedStyle(node).boxShadow, contained: rect.left >= 0 && rect.right <= innerWidth };
            });
            assert.equal(dropdown.radius, '8px');
            assert.notEqual(dropdown.shadow, 'none');
            assert.equal(dropdown.contained, true);
            await page.keyboard.press('Escape');
            evidence.dropdown = dropdown;
        }
    }
    fs.writeFileSync(path.join(evidenceDir, 'ui-browser.json'), `${JSON.stringify(evidence, null, 2)}\n`);
    return evidence;
}
