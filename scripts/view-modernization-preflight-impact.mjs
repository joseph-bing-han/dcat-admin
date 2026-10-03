/*
 * Preflight 影响测量（Epic 002 / S1）。
 *
 * 目的：量化 Tailwind v4 全局 preflight 对 compat island 真实插件样式的破坏面。
 *
 * 做法：用系统 Chrome 加载同一份夹具 HTML 两次——一次只注入“接入 Tailwind 之前”的
 * Modern CSS 构建产物，一次注入“接入之后”的产物——然后逐探针对比 getComputedStyle。
 * 夹具引用的是仓库里真实的第三方插件 CSS（Select2 / datetimepicker / duallistbox /
 * webuploader / editormd）与真实 Select2 脚本渲染出的 DOM，不是手写近似标记。
 *
 * 用法：
 *   # 自动推导基线：临时关闭 Tailwind 入口重新构建，比对后再恢复构建
 *   node scripts/view-modernization-preflight-impact.mjs --build-baseline \
 *     --out=artifacts/view-modernization-preflight/preflight-impact.json --strict
 *
 *   # 或显式指定两端产物
 *   node scripts/view-modernization-preflight-impact.mjs \
 *     --before=/tmp/modern-before.css --after=/tmp/modern-after.css
 *
 * 退出码：报告模式下始终为 0，除非出现阻断级回归（critical 探针差异）时加 --strict。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const chromePath = process.env.DCAT_CHROME_PATH || '/usr/bin/google-chrome';
const entryPath = path.join(root, 'resources/modern/index.tsx');
const disabledMarker = '// preflight-impact:';

const options = parseOptions(process.argv.slice(2));
const strict = process.argv.includes('--strict');
const buildBaseline = process.argv.includes('--build-baseline');

/*
 * 陈旧状态守卫。buildWithoutTailwind() 会把 Tailwind 入口临时改成注释，
 * 正常路径由 finally 恢复；但 SIGKILL 不会执行 finally，会让工作区停在“Tailwind 被关闭”的中间态，
 * 后续构建会静默产出不含 Tailwind 的 CSS。因此这里先检测并拒绝继续。
 */
if (fs.existsSync(entryPath) && fs.readFileSync(entryPath, 'utf8').includes(disabledMarker)) {
    fail(
        `resources/modern/index.tsx 残留上一次基线构建的标记（${disabledMarker}），` +
            '说明之前的运行被强杀且未恢复。请先恢复 Tailwind 入口导入再重跑。',
    );
}

if (!options.after) {
    options.after = currentBuiltCss();
}
if (!options.before && !buildBaseline) {
    fail('需要 --build-baseline，或显式提供 --before 构建产物路径');
}
if (!fs.existsSync(chromePath)) {
    fail(`Chrome executable is missing: ${chromePath}`);
}

const pluginStylesheets = [
    'resources/dist/dcat/plugins/select/select2.css',
    'resources/dist/dcat/plugins/bootstrap-datetimepicker/bootstrap-datetimepicker.css',
    'resources/dist/dcat/plugins/bootstrap-duallistbox/dist/bootstrap-duallistbox.css',
    'resources/dist/dcat/plugins/webuploader/webuploader.css',
    'resources/dist/dcat/plugins/editor-md/css/editormd.css',
].filter((relative) => fs.existsSync(path.join(root, relative)));

const fixtureMarkup = `
<div class="dcat-modern-active dcat-modern-root"><div id="island" data-dcat-modern-legacy-island="preflight-probes">
    <div class="row">
        <div class="col-6"><div class="p-2 text-muted" id="probe-facade-utility">facade utility</div></div>
        <div class="col-6"><div class="d-flex align-items-center justify-content-between"><span>a</span><span>b</span></div></div>
    </div>

    <h4 id="probe-heading">Island heading</h4>
    <p id="probe-paragraph">Island paragraph with <a id="probe-anchor" href="#">a link</a>.</p>
    <ul id="probe-list"><li>first item</li><li>second item</li></ul>
    <ol id="probe-ordered-list"><li>first</li><li>second</li></ol>
    <hr id="probe-divider">
    <img id="probe-image" alt="" width="16" height="16" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==">
    <i class="fa" id="probe-icon-font" aria-hidden="true">x</i>
    <p id="probe-strong-paragraph"><strong id="probe-strong">strong text</strong> and <code id="probe-code">code</code> and <small id="probe-small">small</small></p>
    <pre id="probe-pre">pre block</pre>
    <blockquote id="probe-blockquote">quoted</blockquote>
    <dl id="probe-dl"><dt id="probe-dt">term</dt><dd id="probe-dd">definition</dd></dl>

    <table id="probe-table" class="table">
        <thead><tr><th id="probe-th">Header</th></tr></thead>
        <tbody><tr><td id="probe-td">Cell</td></tr></tbody>
    </table>

    <button type="button" id="probe-button" class="btn">Plugin button</button>
    <input id="probe-input" class="form-control" placeholder="Plugin input">
    <select id="probe-native-select" class="form-control"><option>one</option></select>

    <div class="input-group" id="probe-input-group">
        <span class="input-group-addon" id="probe-input-group-addon">@</span>
        <input type="text" class="form-control" id="probe-input-group-input">
    </div>

    <div class="bootstrap-duallistbox-container" id="probe-duallistbox">
        <div class="box1"><select multiple class="form-control"></select></div>
    </div>

    <div class="webuploader-container" id="probe-uploader">
        <div class="webuploader-pick" id="probe-uploader-pick">选择文件</div>
        <ul class="uploader-list" id="probe-uploader-list"><li>file.txt</li></ul>
    </div>

    <div class="editormd-toolbar" id="probe-editor-toolbar">
        <ul class="editormd-menu"><li><a href="#"><i class="fa">B</i></a></li></ul>
    </div>

    <select id="probe-select2" class="form-control">
        <option value="1" selected>Alpha</option>
        <option value="2">Beta</option>
    </select>
</div>
`;

const probes = [
    { id: 'facade-utility', selector: '#probe-facade-utility', level: 'critical' },
    { id: 'heading', selector: '#probe-heading', level: 'critical' },
    { id: 'paragraph', selector: '#probe-paragraph', level: 'critical' },
    { id: 'anchor', selector: '#probe-anchor', level: 'critical' },
    { id: 'list-item', selector: '#probe-list li', level: 'critical' },
    { id: 'ordered-list-item', selector: '#probe-ordered-list li', level: 'critical' },
    { id: 'divider', selector: '#probe-divider', level: 'critical' },
    { id: 'image', selector: '#probe-image', level: 'critical' },
    { id: 'icon-font', selector: '#probe-icon-font', level: 'critical' },
    { id: 'strong', selector: '#probe-strong', level: 'critical' },
    { id: 'code', selector: '#probe-code', level: 'critical' },
    { id: 'small', selector: '#probe-small', level: 'minor' },
    { id: 'pre', selector: '#probe-pre', level: 'critical' },
    { id: 'blockquote', selector: '#probe-blockquote', level: 'critical' },
    { id: 'definition-list', selector: '#probe-dl', level: 'critical' },
    { id: 'definition-term', selector: '#probe-dt', level: 'critical' },
    { id: 'definition-desc', selector: '#probe-dd', level: 'critical' },
    { id: 'table', selector: '#probe-table', level: 'critical' },
    { id: 'table-header-cell', selector: '#probe-th', level: 'critical' },
    { id: 'table-cell', selector: '#probe-td', level: 'critical' },
    { id: 'button', selector: '#probe-button', level: 'critical' },
    { id: 'input', selector: '#probe-input', level: 'critical' },
    { id: 'native-select', selector: '#probe-native-select', level: 'critical' },
    { id: 'input-group-addon', selector: '#probe-input-group-addon', level: 'critical' },
    { id: 'duallistbox-box1', selector: '#probe-duallistbox .box1', level: 'major' },
    { id: 'uploader-pick', selector: '#probe-uploader-pick', level: 'critical' },
    { id: 'uploader-list-item', selector: '#probe-uploader-list li', level: 'critical' },
    { id: 'editor-toolbar-item', selector: '#probe-editor-toolbar .editormd-menu li', level: 'critical' },
    { id: 'select2-selection', selector: '#probe-select2 + .select2-container .select2-selection--single', level: 'critical' },
    { id: 'select2-results', selector: '#probe-select2 + .select2-container .select2-selection--single .select2-selection__rendered', level: 'major' },
];

const properties = [
    'display', 'boxSizing', 'position',
    'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'borderTopStyle', 'borderTopColor', 'borderRadius',
    'backgroundColor', 'backgroundImage',
    'color', 'fontSize', 'fontWeight', 'fontFamily', 'lineHeight',
    'listStyleType', 'listStylePosition', 'textDecorationLine', 'textIndent',
    'maxWidth', 'height', 'verticalAlign', 'borderCollapse', 'opacity',
    'appearance', 'outlineStyle',
];

const browser = await chromium.launch({ executablePath: chromePath, args: ['--no-sandbox'] });

try {
    if (buildBaseline) {
        options.before = await buildWithoutTailwind();
    }
    const before = await collect(options.before, 'before');
    const after = await collect(options.after, 'after');
    const report = buildReport(before, after);

    if (options.out) {
        fs.mkdirSync(path.dirname(path.resolve(root, options.out)), { recursive: true });
        fs.writeFileSync(path.resolve(root, options.out), JSON.stringify(report, null, 2));
    }

    printReport(report);

    if (strict && report.criticalDeltaCount > 0) {
        process.exit(1);
    }
} finally {
    await browser.close();
}

function currentBuiltCss() {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'resources/dist/modern/manifest.json'), 'utf8'));
    // lib 模式下 CSS 不会挂在入口的 css 字段上，而是作为独立条目出现，按扩展名识别。
    const entry = Object.values(manifest).find((value) => typeof value?.file === 'string' && value.file.endsWith('.css'));
    const file = entry?.file || null;
    if (!file) {
        fail('无法从 resources/dist/modern/manifest.json 解析当前 CSS 产物；请先运行 build');
    }
    return path.join('resources/dist/modern', file);
}

/*
 * 基线 = 保留 Tailwind 主题与 utilities、仅关闭 preflight 与补偿层的构建产物。
 * 全程 try/finally 保证 index.tsx 与 dist 一定恢复，避免把“基线产物”留在工作区。
 *
 * 注意：基线构建输出到临时目录。Vite 的 emptyOutDir 会清空输出目录，
 * 若直接构建到 resources/dist/modern，会连带删除该目录里非 Vite 产物
 * （例如 THIRD_PARTY_NOTICES.txt），把发布目录改坏。
 */
async function buildWithoutTailwind() {
    const original = fs.readFileSync(entryPath, 'utf8');
    const baselineThemePath = path.join(root, 'resources/modern/.preflight-baseline.css');
    const theme = fs.readFileSync(path.join(root, 'resources/modern/tailwind.css'), 'utf8');
    const withoutPreflight = theme.replace('@import "tailwindcss" source(none);', '@layer theme, base, components, utilities;\n@import "tailwindcss/theme.css" layer(theme);\n@import "tailwindcss/utilities.css" layer(utilities) source(none);');
    if (withoutPreflight === theme) fail('未找到 Tailwind 导入，无法隔离 preflight');
    const snapshotDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dcat-preflight-'));
    const snapshotPath = path.join(snapshotDir, 'modern-before.css');
    const buildOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dcat-preflight-build-'));
    const restore = () => {
        try {
            fs.writeFileSync(entryPath, original);
            fs.rmSync(baselineThemePath, { force: true });
        } catch (_) {
            // 恢复失败时不再抛错，避免掩盖原始退出原因；陈旧标记守卫会在下次运行时拦下。
        }
    };
    // SIGINT/SIGTERM（例如 Ctrl-C、CI 超时）也恢复入口，只有 SIGKILL 无法拦截。
    const onSignal = (signal) => {
        restore();
        process.exit(signal === 'SIGINT' ? 130 : 143);
    };
    process.once('SIGINT', () => onSignal('SIGINT'));
    process.once('SIGTERM', () => onSignal('SIGTERM'));

    const disabled = original
        .replace(/^import '\.\/tailwind\.css';$/m, "import './.preflight-baseline.css'; // preflight-impact: preflight disabled")
        .replace(/^import '\.\/compat-preflight-restore\.css';$/m, '// preflight-impact: restore layer disabled');

    if (disabled === original) {
        fail('未能在 resources/modern/index.tsx 中找到 Tailwind 入口导入，无法构建基线');
    }

    try {
        fs.writeFileSync(baselineThemePath, withoutPreflight);
        fs.writeFileSync(entryPath, disabled);
        runBaselineBuild(buildOutDir);
        fs.copyFileSync(cssFromManifest(buildOutDir), snapshotPath);
    } finally {
        restore();
        process.removeAllListeners('SIGINT');
        process.removeAllListeners('SIGTERM');
        fs.rmSync(buildOutDir, { recursive: true, force: true });
    }

    return snapshotPath;
}

function runBaselineBuild(outDir) {
    execFileSync('npx', ['vite', 'build', '--outDir', outDir, '--emptyOutDir'], { cwd: root, stdio: 'pipe' });
}

function cssFromManifest(directory) {
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
    const entry = Object.values(manifest).find((value) => typeof value?.file === 'string' && value.file.endsWith('.css'));
    if (!entry) {
        fail(`无法在 ${directory} 的 manifest 中找到 CSS 产物`);
    }
    return path.join(directory, entry.file);
}

async function collect(cssPath, label) {
    const css = fs.readFileSync(path.resolve(root, cssPath), 'utf8');
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.setContent(fixtureHtml(css), { waitUntil: 'load' });

    // 用真实 jQuery + Select2 渲染真实下拉 DOM。
    await page.addScriptTag({ path: path.join(root, 'node_modules/jquery/dist/jquery.min.js') });
    await page.addScriptTag({ path: path.join(root, 'resources/dist/dcat/plugins/select/select2.full.min.js') });
    await page.evaluate(() => {
        window.jQuery('#probe-select2').select2({ width: '200px' });
    });

    const values = await page.evaluate((spec) => {
        const result = {};
        spec.probes.forEach((probe) => {
            const element = document.querySelector(probe.selector);
            if (!element) {
                result[probe.id] = null;
                return;
            }
            const computed = getComputedStyle(element);
            const entry = {};
            spec.properties.forEach((property) => {
                entry[property] = computed[property];
            });
            result[probe.id] = entry;
        });
        return result;
    }, { probes, properties });

    return { label, cssPath, values };
}

function fixtureHtml(css) {
    const pluginCss = pluginStylesheets
        .map((relative) => `<style>${fs.readFileSync(path.join(root, relative), 'utf8')}</style>`)
        .join('\n');

    return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>preflight impact</title>
<style>${css}</style>
${pluginCss}
</head><body>${fixtureMarkup}</body></html>`;
}

function buildReport(before, after) {
    const probeReports = [];
    let criticalDeltaCount = 0;

    probes.forEach((probe) => {
        const beforeValue = before.values[probe.id];
        const afterValue = after.values[probe.id];

        if (!beforeValue || !afterValue) {
            probeReports.push({
                id: probe.id,
                selector: probe.selector,
                level: probe.level,
                missing: true,
                deltas: [],
            });
            criticalDeltaCount += 1;
            return;
        }

        const deltas = properties
            .filter((property) => beforeValue[property] !== afterValue[property])
            .map((property) => ({ property, before: beforeValue[property], after: afterValue[property] }));

        if (deltas.length && probe.level === 'critical') {
            criticalDeltaCount += 1;
        }

        probeReports.push({
            id: probe.id,
            selector: probe.selector,
            level: probe.level,
            missing: false,
            deltas,
        });
    });

    return {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        chrome: chromePath,
        baselineCss: before.cssPath,
        tailwindCss: after.cssPath,
        pluginStylesheets,
        probeCount: probes.length,
        deltaCount: probeReports.reduce((total, probe) => total + probe.deltas.length, 0),
        criticalDeltaCount,
        probes: probeReports,
    };
}

function printReport(report) {
    console.log(`Preflight impact: ${report.probeCount} probes, ${report.deltaCount} property deltas, ${report.criticalDeltaCount} probes with deltas.`);
    console.log(`Plugin stylesheets loaded: ${report.pluginStylesheets.length}`);
    report.probes.forEach((probe) => {
        if (probe.missing) {
            console.log(`  [MISSING] ${probe.id} (${probe.selector})`);
            return;
        }
        if (!probe.deltas.length) return;
        console.log(`  [${probe.level}] ${probe.id} (${probe.selector})`);
        probe.deltas.forEach((delta) => {
            console.log(`      ${delta.property}: ${delta.before} -> ${delta.after}`);
        });
    });
}

function parseOptions(args) {
    const result = { before: null, after: null, out: null };
    args.forEach((arg) => {
        const match = arg.match(/^--(before|after|out)=(.*)$/);
        if (!match) return;
        result[match[1]] = match[2];
    });
    return result;
}

function fail(message) {
    console.error(message);
    process.exit(1);
}
