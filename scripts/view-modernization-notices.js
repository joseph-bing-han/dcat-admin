'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'resources/dist/modern/THIRD_PARTY_NOTICES.txt');
/*
 * 依赖图根：核心运行时，加上 vendor 的 Untitled UI 组件实际引用的运行时包
 * （Epic 002 / S2 起）。vendor 组件一旦被引入构建，这些包就进入发布产物，必须有许可声明。
 */
const roots = [
    'react',
    'react-dom',
    'react-aria-components',
    '@untitledui/icons',
    '@internationalized/date',
    '@react-aria/utils',
    '@react-stately/utils',
    'react-aria',
    'tailwind-merge',
];
const packages = new Map();
const missing = [];

roots.forEach((name) => visit(name, root));

if (missing.length) {
    console.error('Unable to generate complete modern third-party notices:');
    missing.forEach((item) => console.error(`- ${item}`));
    process.exit(1);
}

function fallbackLicense(pkg) {
    if (pkg.name === 'client-only' && pkg.license === 'MIT') {
        const reactLicense = path.join(root, 'node_modules/react/LICENSE');
        if (fs.existsSync(reactLicense)) {
            return [
                'Upstream package metadata declares MIT and does not publish a standalone LICENSE file.',
                'The package is distributed from the React project; the React MIT license text follows.',
                '',
                fs.readFileSync(reactLicense, 'utf8').trim(),
            ].join('\n');
        }
    }
    return null;
}

const untitledLicense = fs.readFileSync(path.join(root, 'resources/modern/vendor/untitled-ui/LICENSE'), 'utf8').trim();
const untitledProvenance = JSON.parse(fs.readFileSync(path.join(root, 'resources/modern/vendor/untitled-ui/PROVENANCE.json'), 'utf8'));

const sections = [
    'Dcat Admin Modern View Layer - Third Party Notices',
    '===================================================',
    '',
    'Untitled UI React provenance',
    '----------------------------',
    `Repository: ${untitledProvenance.repository}`,
    `Revision: ${untitledProvenance.revision}`,
    `Vendored files: ${untitledProvenance.selectedSources.length} (see resources/modern/vendor/untitled-ui/PROVENANCE.json for the per-file list, hashes and the documented exclusions)`,
    `Vendored families: ${summarizeVendoredFamilies(untitledProvenance.selectedSources)}`,
    `Adaptation: ${untitledProvenance.adaptation}`,
    '',
    untitledLicense,
];

Array.from(packages.values())
    .sort((a, b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`))
    .forEach((item) => {
        sections.push(
            '',
            '--------------------------------------------------------------------------------',
            '',
            `${item.name}@${item.version}`,
            '-'.repeat(Math.min(80, `${item.name}@${item.version}`.length)),
            `License: ${item.license}`,
            item.repository ? `Repository: ${item.repository}` : 'Repository: not declared by package metadata',
            '',
            item.licenseText,
        );
    });

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${sections.join('\n')}\n`);
console.log(`Modern third-party notices OK: ${packages.size} npm runtime packages plus pinned Untitled UI provenance.`);

function visit(name, fromDir) {
    const packageDir = resolvePackageDir(name, fromDir);
    if (!packageDir) {
        missing.push(`${name} could not be resolved from ${path.relative(root, fromDir) || '.'}`);
        return;
    }

    const pkg = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
    const key = `${pkg.name}@${pkg.version}`;
    if (packages.has(key)) return;

    const licenseFile = findLicenseFile(packageDir);
    const fallbackLicenseText = fallbackLicense(pkg);
    if (!pkg.license) missing.push(`${key} does not declare a license identifier`);
    if (!licenseFile && !fallbackLicenseText) {
        missing.push(`${key} does not contain a distributable LICENSE/COPYING file and has no audited license-text fallback`);
    }

    packages.set(key, {
        name: pkg.name,
        version: pkg.version,
        license: pkg.license || 'UNKNOWN',
        repository: normalizeRepository(pkg.repository),
        licenseText: licenseFile ? fs.readFileSync(licenseFile, 'utf8').trim() : fallbackLicenseText,
    });

    Object.keys(pkg.dependencies || {}).forEach((dependency) => visit(dependency, packageDir));
}

function resolvePackageDir(name, fromDir) {
    try {
        const packageJson = require.resolve(`${name}/package.json`, { paths: [fromDir] });
        return path.dirname(packageJson);
    } catch (_) {
        try {
            let current = require.resolve(name, { paths: [fromDir] });
            while (current !== path.dirname(current)) {
                current = path.dirname(current);
                const candidate = path.join(current, 'package.json');
                if (fs.existsSync(candidate)) {
                    const pkg = JSON.parse(fs.readFileSync(candidate, 'utf8'));
                    if (pkg.name === name) return current;
                }
            }
        } catch (_) {
            return null;
        }
    }
    return null;
}

function findLicenseFile(packageDir) {
    const files = fs.readdirSync(packageDir);
    const preferred = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'COPYING', 'COPYING.md', 'COPYING.txt'];
    for (const name of preferred) {
        const match = files.find((file) => file.toLowerCase() === name.toLowerCase());
        if (match) return path.join(packageDir, match);
    }
    const loose = files.find((file) => /^(?:licen[cs]e|copying)(?:\..+)?$/i.test(file));
    return loose ? path.join(packageDir, loose) : null;
}

function normalizeRepository(repository) {
    if (!repository) return null;
    if (typeof repository === 'string') return repository;
    return repository.url || null;
}

/* 把 vendor 文件路径折叠成 "目录 (n)" 形式，避免通知文件罗列上百行路径。 */
function summarizeVendoredFamilies(sources) {
    const families = new Map();
    (sources || []).forEach((source) => {
        const parts = source.split('/');
        const family = parts.length > 2 && parts[0] === 'components'
            ? `${parts[0]}/${parts[1]}/${parts[2]}`
            : parts.slice(0, Math.min(2, parts.length)).join('/');
        families.set(family, (families.get(family) || 0) + 1);
    });
    return Array.from(families.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([family, count]) => `${family} (${count})`)
        .join(', ');
}
