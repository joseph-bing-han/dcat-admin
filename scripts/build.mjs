import { cpSync, mkdirSync, readdirSync, rmSync, statSync, watch, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { build } from 'vite';
import * as sass from 'sass';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const args = process.argv.slice(2);
const mode = args.includes('--mode=development') ? 'development' : 'production';
const watching = args.includes('--watch');
const dist = 'resources/dist';

async function buildAssets() {
    // 所有模式输出到 PHP 实际发布的目录，并按依赖顺序生成 facade。
    for (const configFile of ['vite.config.mts', 'vite.compat.config.mts', 'vite.fallback.config.mts']) {
        await build({ configFile, mode, build: { minify: mode === 'production', cssMinify: mode === 'production' } });
    }
    for (const directory of ['images', 'fonts', 'dcat/plugins']) {
        cpSync(`resources/assets/${directory}`, `${dist}/${directory}`, { recursive: true });
    }
    mkdirSync(`${dist}/dcat/css`, { recursive: true });
    for (const name of ['nunito', 'bootstrap-icons']) {
        cpSync(`resources/assets/dcat/sass/${name}.css`, `${dist}/dcat/css/${name}.css`);
    }
    // 清除旧编译器遗留的 sourcemap，避免发布不再匹配的构建内容。
    rmSync(`${dist}/dcat/extra`, { recursive: true, force: true });
    mkdirSync(`${dist}/dcat/extra`, { recursive: true });
    for (const file of readdirSync('resources/assets/dcat/extra').sort()) {
        const source = `resources/assets/dcat/extra/${file}`;
        const name = path.parse(file).name;
        if (file.endsWith('.js')) {
            await build({
                configFile: false,
                mode,
                build: {
                    target: ['chrome111', 'edge111', 'firefox114', 'safari16.4'],
                    outDir: `${dist}/dcat/extra`,
                    emptyOutDir: false,
                    minify: mode === 'production',
                    lib: { entry: source, name: `DcatExtra_${name.replaceAll('-', '_')}`, formats: ['iife'] },
                    rollupOptions: { output: { entryFileNames: `${name}.js` } },
                },
            });
        } else if (file.endsWith('.scss')) {
            const result = sass.compile(source, { style: mode === 'production' ? 'compressed' : 'expanded' });
            mkdirSync(`${dist}/dcat/extra`, { recursive: true });
            writeFileSync(`${dist}/dcat/extra/${name}.css`, result.css);
        }
    }
    for (const script of ['view-modernization-notices.js', 'view-modernization-legacy-assets.js']) {
        const result = spawnSync(process.execPath, [`scripts/${script}`, '--out-dir=resources/dist'], { stdio: 'inherit' });
        if (result.error) throw result.error;
        if (result.status !== 0) throw new Error(`${script} failed (${result.status})`);
    }
    console.log(`Assets built (${mode}).`);
}

// 同步监听所有输入，串行重建，避免多份 manifest 与 facade 相互覆盖。
let pending = false;
let building = false;
let timer;
async function rebuild() {
    if (building) { pending = true; return; }
    building = true;
    do {
        pending = false;
        try { await buildAssets(); }
        catch (error) {
            if (!watching) throw error;
            console.error(error);
        }
    } while (pending);
    building = false;
}
function schedule() {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 150);
}

if (watching) {
    const inputs = ['resources/modern', 'resources/assets', 'vite.config.mts', 'vite.compat.config.mts', 'vite.fallback.config.mts', 'scripts', 'package.json'];
    if (args.includes('--poll')) {
        function snapshot(entry) {
            const stat = statSync(entry);
            return stat.isDirectory()
                ? readdirSync(entry).sort().map((file) => `${file}:${snapshot(path.join(entry, file))}`).join('|')
                : `${stat.mtimeMs}:${stat.size}`;
        }
        let previous = inputs.map(snapshot).join('|');
        setInterval(() => {
            const current = inputs.map(snapshot).join('|');
            if (previous !== current) { previous = current; schedule(); }
        }, 1000);
    } else {
        for (const input of inputs) watch(input, { recursive: statSync(input).isDirectory() }, schedule);
    }
    console.log('Watching asset sources; refresh the consuming application after each build.');
}
await rebuild();
