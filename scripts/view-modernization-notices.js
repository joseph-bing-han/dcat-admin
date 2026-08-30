'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'resources/dist/modern/THIRD_PARTY_NOTICES.txt');
const roots = ['react', 'react-dom', 'react-aria-components'];
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
    `Selected sources: ${untitledProvenance.selectedSources.join(', ')}`,
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

