'use strict';

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'resources/dist/modern');
const manifestPath = path.join(dist, 'manifest.json');
const noticesPath = path.join(dist, 'THIRD_PARTY_NOTICES.txt');
const budget = JSON.parse(fs.readFileSync(path.join(root, 'codestable/epics/001-o-view-layer-modernization/m0/performance-budget.json'), 'utf8'));
const errors = [];

if (!fs.existsSync(manifestPath)) {
    fail('Modern manifest is missing. Run npm run modern:build first.');
    finish();
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const entry = manifest['resources/modern/index.tsx'] || Object.values(manifest).find((item) => item && item.isEntry);
if (!entry || !entry.file) {
    fail('Modern manifest has no entry for resources/modern/index.tsx.');
    finish();
}

const jsFiles = [entry.file];
const cssFiles = Array.from(new Set([
    ...((entry.css || [])),
    ...Object.values(manifest).filter((item) => item && typeof item.file === 'string' && item.file.endsWith('.css')).map((item) => item.file),
]));

if (jsFiles.length !== 1) fail(`IIFE topology requires exactly one entry JS file; got ${jsFiles.length}.`);
if (cssFiles.length === 0) fail('Modern build must emit scoped CSS.');

const hashPattern = /-[A-Za-z0-9_-]{8,}\.(?:js|css)$/;
[...jsFiles, ...cssFiles].forEach((file) => {
    if (!hashPattern.test(file)) fail(`Modern asset is not content-hashed: ${file}`);
    if (!fs.existsSync(path.join(dist, file))) fail(`Manifest asset is missing: ${file}`);
});

const jsGzip = sumGzip(jsFiles);
const cssGzip = sumGzip(cssFiles);
const totalGzip = jsGzip + cssGzip;
const modernBudget = budget.modernBudgets.firstModernPage;

if (jsGzip > modernBudget.initialJsGzipBytesMax) {
    fail(`Modern JS gzip budget exceeded: ${jsGzip} > ${modernBudget.initialJsGzipBytesMax}`);
}
if (cssGzip > modernBudget.initialCssGzipBytesMax) {
    fail(`Modern CSS gzip budget exceeded: ${cssGzip} > ${modernBudget.initialCssGzipBytesMax}`);
}
if (totalGzip > modernBudget.initialTotalGzipBytesMax) {
    fail(`Modern total gzip budget exceeded: ${totalGzip} > ${modernBudget.initialTotalGzipBytesMax}`);
}

const js = jsFiles.map((file) => fs.readFileSync(path.join(dist, file), 'utf8')).join('\n');
if (/\bimport\s*\(/.test(js)) fail('IIFE output contains dynamic import().');
if (/\bimport\s+[^;]+\bfrom\b/.test(js)) fail('IIFE output contains an ESM import statement.');
if (/\bexport\s+(?:default|\{|const|let|var|function|class)\b/.test(js)) fail('IIFE output contains an ESM export statement.');

walk(path.join(root, 'resources/modern'))
    .filter((file) => /\.(?:ts|tsx)$/.test(file) && !/\.test\./.test(file))
    .forEach((file) => {
        const source = fs.readFileSync(file, 'utf8');
        if (/\bimport\s*\(/.test(source)) fail(`IIFE source must not use dynamic import(): ${path.relative(root, file)}`);
        if (source.includes(':has(')) fail(`Modern source must not use :has() because it is outside the frozen browser floor: ${path.relative(root, file)}`);
    });

verifyScopedCss(path.join(root, 'resources/modern/styles.css'));

if (walk(dist).some((file) => file.endsWith('.map'))) {
    fail('Production modern package must not ship source maps.');
}

if (!fs.existsSync(noticesPath)) {
    fail('Modern production package must include THIRD_PARTY_NOTICES.txt.');
} else {
    const notices = fs.readFileSync(noticesPath, 'utf8');
    [
        'Untitled UI React provenance',
        'c981a73bcd6b6c68d2a54070f20f020191212828',
        'react@',
        'react-dom@',
        'react-aria-components@1.20.0',
        'Apache License',
        'MIT License',
    ].forEach((literal) => {
        if (!notices.includes(literal)) fail(`THIRD_PARTY_NOTICES.txt is missing ${literal}`);
    });
}

const legacyLoginBackground = path.join(root, 'resources/dist/images/pages/login/bg.jpg');
if (!fs.existsSync(legacyLoginBackground)) {
    fail('Legacy login background compatibility asset is missing: resources/dist/images/pages/login/bg.jpg');
}

const configSource = fs.readFileSync(path.join(root, 'config/admin.php'), 'utf8');
const modernBlock = (configSource.match(/'modern'\s*=>\s*\[([\s\S]*?)\n    \],/) || [])[1] || '';
if (!/'manifest'\s*=>/.test(modernBlock)) {
    fail('Modern renderer configuration must declare its manifest entry point.');
}
const removedGates = modernBlock.match(/'(?:enabled|routes|exclude_routes|families|capabilities|fallback_query|bootstrap_free_fallback)'\s*=>/g);
if (removedGates) {
    fail(`Modern renderer configuration must not declare a legacy renderer switch or scope allowlist: ${removedGates.join(', ')}`);
}

finish();

function verifyScopedCss(file) {
    const css = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const externalUrl = /url\(\s*['"]?https?:\/\//i.test(css);
    if (externalUrl) fail('Modern CSS must not contain external asset/font URLs.');
    if (!css.includes('@media (prefers-reduced-motion: reduce)')) {
        fail('Modern CSS must retain the prefers-reduced-motion media query.');
    }
    if (!css.includes('animation: none;') || !css.includes('transition: none;')) {
        fail('Modern reduced-motion rules must disable non-essential animation and transitions.');
    }

    const ast = postcss.parse(css, { from: file });
    ast.walkDecls((declaration) => {
        if (declaration.prop.startsWith('--dcat-modern-')) return;
        if (/(?:#[0-9a-f]{3,8}\b|rgba?\s*\()/i.test(declaration.value)) {
            fail(`Untokenized modern color in ${declaration.prop}: ${declaration.value}`);
        }
        if (declaration.prop === 'z-index' && /^\d+$/.test(declaration.value.trim())) {
            fail(`Untokenized modern z-index: ${declaration.value.trim()}`);
        }
    });
    ast.walkRules((rule) => {
        const parent = rule.parent;
        if (parent && parent.type === 'atrule' && parent.name.toLowerCase().includes('keyframes')) return;
        rule.selectors.forEach((selector) => {
            if (!/^\.dcat-modern-(?:active|root)(?=[\s.:[#>+~]|$)/.test(selector.trim())) {
                fail(`Unscoped modern CSS selector: ${selector.trim()}`);
            }
        });
    });
}

function sumGzip(files) {
    return files.reduce((total, file) => total + zlib.gzipSync(fs.readFileSync(path.join(dist, file)), { level: 9 }).length, 0);
}

function walk(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(entryPath) : [entryPath];
    });
}

function fail(message) {
    errors.push(message);
}

function finish() {
    if (errors.length) {
        console.error('Modern artifact verification failed:');
        errors.forEach((error) => console.error(`- ${error}`));
        process.exit(1);
    }
    console.log(`Modern artifact OK: IIFE JS ${jsGzip} gzip bytes, CSS ${cssGzip} gzip bytes, total ${totalGzip} gzip bytes.`);
}
