'use strict';

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const root = path.resolve(__dirname, '..');
const aliases = JSON.parse(fs.readFileSync(path.join(root, 'resources/modern/token-aliases.json'), 'utf8'));
const themeFiles = ['resources/modern/tailwind.css', 'resources/modern/ui/styles/theme.css'];
const declared = new Set();
// Tailwind 内建圆角、阴影与白色，其余变量必须来自已 vendor 的主题或 Dcat 覆盖。
const builtins = new Set(['--color-white', '--radius-sm', '--radius-md', '--radius-lg', '--radius-xl', '--shadow-xs', '--shadow-lg', '--shadow-xl']);
for (const file of themeFiles) {
    const ast = postcss.parse(fs.readFileSync(path.join(root, file), 'utf8'));
    ast.walkDecls((decl) => { if (decl.prop.startsWith('--')) declared.add(decl.prop); });
}
for (const [alias, variable] of Object.entries(aliases)) {
    if (!/^--[a-z0-9-]+$/.test(variable) || (!declared.has(variable) && !builtins.has(variable))) {
        throw new Error(`Theme variable for ${alias} is missing: ${variable}`);
    }
}
const cssPath = path.join(root, 'resources/modern/tokens.css');
const css = `/* Generated compatibility aliases; values live in Tailwind @theme. */\n.dcat-modern-active {\n${Object.entries(aliases).map(([alias, variable]) => `    --dcat-modern-${alias}: var(${variable});`).join('\n')}\n}\n`;
if (process.argv.includes('--check')) {
    if (fs.readFileSync(cssPath, 'utf8') !== css) throw new Error('Compatibility token aliases are stale.');
    for (const retired of ['tokens.json', 'tokens.ts']) {
        if (fs.existsSync(path.join(root, 'resources/modern', retired))) throw new Error(`Duplicate token source remains: ${retired}`);
    }
} else {
    fs.writeFileSync(cssPath, css);
}
console.log(`Tailwind theme OK: ${Object.keys(aliases).length} compatibility aliases, one value source.`);
