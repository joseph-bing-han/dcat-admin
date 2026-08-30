'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'resources/dist');
const registry = require('../resources/modern/legacy-assets.json');
const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'modern/manifest.json'), 'utf8'));
const entry = manifest['resources/modern/index.tsx'];
const core = fs.readFileSync(path.join(dist, 'modern-compat/assets/dcat-fallback.js'), 'utf8');
const compat = fs.readFileSync(path.join(dist, 'modern-compat/assets/dcat-modern-compat.js'), 'utf8');
const cssFiles = entry.css || Object.values(manifest).filter((asset) => asset.file.endsWith('.css')).map((asset) => asset.file);
const css = cssFiles.map((file) => fs.readFileSync(path.join(dist, 'modern', file), 'utf8')).join('\n');
const marker = '/*! Dcat-owned legacy asset facade. No Bootstrap or AdminLTE implementation. */\n';
const check = process.argv.includes('--check');
const outputArgument = process.argv.find((argument) => argument.startsWith('--out-dir='));
const output = path.resolve(root, outputArgument ? outputArgument.slice('--out-dir='.length) : 'artifacts/bootstrap-free/legacy-facades');

for (const asset of registry.javascript) {
    const runtime = asset === 'dcat/js/dcat-app.js' ? `if (!window.DcatNativeRuntime) {\n${core}\n}\n` : '';
    publish(asset, `${marker}${runtime}if (!window.DcatCompat) {\n${compat}\n}\n`);
}
for (const asset of registry.stylesheets) publish(asset, `${marker}${css}`);

console.log(`Dcat legacy asset facades ${check ? 'verified' : 'built'}: ${registry.javascript.length} JavaScript and ${registry.stylesheets.length} CSS paths.`);

function publish(asset, content) {
    const target = path.join(output, asset);
    if (check) {
        if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== content) throw new Error(`Stale legacy facade: ${asset}`);
        return;
    }
    // classic 回退包已删除：旧固定路径现在直接由 Dcat facade 接管，不再保留
    // Bootstrap/AdminLTE 原始副本。
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
}
