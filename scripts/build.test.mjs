import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));

test('default commands reach the new build without obsolete entrypoints', () => {
    for (const name of ['dev', 'prod', 'build', 'watch', 'watch-poll', 'hot']) {
        let command = pkg.scripts[name];
        const visited = new Set([name]);
        while (command.startsWith('npm run ')) {
            const next = command.slice('npm run '.length);
            assert.ok(!visited.has(next), `Cyclic script: ${next}`);
            visited.add(next);
            command = pkg.scripts[next];
        }
        assert.match(command, /^node scripts\/build\.mjs(?: |$)/);
    }
    assert.ok(!Object.keys(pkg.scripts).some((name) => /^modern(?:ization)?:/.test(name)));
    for (const name of ['laravel-mix', 'webpack-cli', 'sass-loader', 'vue-template-compiler']) {
        assert.ok(!pkg.devDependencies[name]);
    }
    assert.ok(!existsSync(new URL('../webpack.mix.js', import.meta.url)));
});

test('published assets include extensions and static resource trees', () => {
    const paths = ['images', 'fonts', 'dcat/plugins', 'dcat/css/nunito.css', 'dcat/css/bootstrap-icons.css'];
    for (const file of readdirSync(new URL('../resources/assets/dcat/extra', import.meta.url))) {
        if (/\.(js|scss)$/.test(file)) paths.push(`dcat/extra/${file.replace(/\.scss$/, '.css')}`);
    }
    for (const path of paths) {
        assert.ok(existsSync(new URL(`../resources/dist/${path}`, import.meta.url)), `Missing published asset: ${path}`);
    }
    assert.ok(!readdirSync(new URL('../resources/dist/dcat/extra', import.meta.url)).some((file) => file.endsWith('.map')));
});
