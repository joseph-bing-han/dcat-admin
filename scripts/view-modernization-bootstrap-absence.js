'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const errors = [];
const facadeMarker = '/*! Dcat-owned legacy asset facade. No Bootstrap or AdminLTE implementation. */';

const removedPaths = [
    'packages',
    'resources/assets/adminlte',
    'resources/assets/sass',
    'resources/assets/dcat/js/Dcat.js',
    'resources/assets/dcat/js/dcat-app.js',
    'resources/assets/dcat/js/bootstrappers',
    'resources/assets/dcat/js/NProgress',
    'resources/assets/dcat/js/jquery-form',
    'resources/assets/dcat/js/sweetalert',
    'resources/assets/dcat/sass/dcat-app.scss',
    'resources/assets/dcat/sass/components',
    'resources/assets/dcat/sass/theme',
    'src/Console/MinifyCommand.php',
    'scripts/classic-assets.js',
];

const removedReferences = [
    [/resources[\\/]assets[\\/]adminlte/, 'AdminLTE source tree reference'],
    [/resources[\\/]assets[\\/]sass[\\/]/, 'Bootstrap SCSS source tree reference'],
    [/\bclassicAssets\b/, 'classicAssets() renderer selection'],
    [/__dcat_legacy/, 'forced legacy query marker'],
    [/ADMIN_MODERN_ENABLED/, 'ADMIN_MODERN_ENABLED switch'],
    [/admin\.modern\.(?:enabled|routes|exclude_routes|families|capabilities|bootstrap_free_fallback|fallback_query)/, 'removed modern renderer gate config'],
    [/\bMinifyCommand\b/, 'removed Laravel Mix theme compiler command'],
];

const referenceRoots = ['src', 'config', 'resources/views', 'resources/modern'];
const ignoredDirs = new Set(['node_modules', 'vendor', 'dist', 'pre-dist', 'laravel-tests', '.git']);

removedPaths.forEach((target) => {
    if (fs.existsSync(path.join(root, target))) {
        errors.push(`removed path is still present: ${target}`);
    }
});

referenceRoots.forEach((relative) => {
    const start = path.join(root, relative);
    if (!fs.existsSync(start)) return;
    walk(start).forEach((file) => {
        const contents = fs.readFileSync(file, 'utf8');
        removedReferences.forEach(([pattern, label]) => {
            if (pattern.test(contents)) {
                errors.push(`${label} remains in ${path.relative(root, file)}`);
            }
        });
    });
});

['webpack.mix.js', 'package.json'].forEach((relative) => {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) {
        errors.push(`expected build entry is missing: ${relative}`);
        return;
    }
    const contents = fs.readFileSync(file, 'utf8');
    if (/adminlte|assets\/sass|dcat-app|AdminLTE/i.test(contents)) {
        errors.push(`${relative} still builds or ships Bootstrap/AdminLTE assets`);
    }
    if (/classic[:_-]?assets/i.test(contents)) {
        errors.push(`${relative} still ships a classic asset entrypoint`);
    }
});

const registry = JSON.parse(fs.readFileSync(path.join(root, 'resources/modern/legacy-assets.json'), 'utf8'));
const facadePaths = [...registry.javascript, ...registry.stylesheets];
facadePaths.forEach((relative) => {
    const file = path.join(root, 'resources/dist', relative);
    if (!fs.existsSync(file)) {
        errors.push(`legacy fixed path is not served by a Dcat facade: ${relative}`);
        return;
    }
    if (!fs.readFileSync(file, 'utf8').startsWith(facadeMarker)) {
        errors.push(`legacy fixed path is not a Dcat facade: ${relative}`);
    }
});

walk(path.join(root, 'resources/dist'), true).forEach((file) => {
    if (file.endsWith('.map')) return;
    const head = fs.readFileSync(file, 'utf8').slice(0, 200);
    if (/^\/\*!\s*(?:Bootstrap|AdminLTE|AdminLTE 3)/i.test(head)) {
        errors.push(`compiled Bootstrap/AdminLTE bundle is still published: ${path.relative(root, file)}`);
    }
});

if (errors.length) {
    console.error('Bootstrap/AdminLTE absence verification failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
}

console.log(`Bootstrap/AdminLTE absence OK: ${removedPaths.length} removed paths absent, ${facadePaths.length} fixed paths served by Dcat facades, ${referenceRoots.length} source roots clean.`);

function walk(dir, skipIgnored = false) {
    if (!fs.existsSync(dir)) return [];

    const files = [];
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
        if (skipIgnored && ignoredDirs.has(entry.name)) return;
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) files.push(...walk(entryPath, skipIgnored));
        else files.push(entryPath);
    });

    return files;
}
