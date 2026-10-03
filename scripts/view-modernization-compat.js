'use strict';

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const scope = '.dcat-modern-active';
const rules = ['/* Dcat 自有兼容工具类，由 view-modernization-compat.js 生成。 */'];
// 与 Tailwind 同名的工具类置于 base 层，避免兼容规则覆盖上游 utilities。
const add = (name, declarations) => {
    const overlaps = /^(?:[mp][tblrxy]?-(?:[0-5]|auto)|w-(?:25|50|75|100)|border-0|flex-shrink-0)$/.test(name);
    rules.push(overlaps
        ? `@layer base { ${scope} .${name} { ${declarations.replace(/ !important/g, '')} } }`
        : `${scope} .${name} { ${declarations} }`);
};

function addSpacing(breakpoint = '') {
    for (const [prefix, property] of [['m', 'margin'], ['p', 'padding']]) {
        for (const [axis, sides] of Object.entries({ '': [''], t: ['-top'], b: ['-bottom'], l: ['-left'], r: ['-right'], x: ['-left', '-right'], y: ['-top', '-bottom'] })) {
            const sizes = { 0: '0px', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 25: '0.25rem', 50: '0.5rem', 75: '0.75rem' };
            if (prefix === 'm') {
                for (const [size, value] of Object.entries(sizes)) {
                    if (size !== '0') sizes[`n${size}`] = `-${value}`;
                }
                sizes.auto = 'auto';
            }
            for (const [size, value] of Object.entries(sizes)) {
                const name = `${prefix}${axis}-${breakpoint ? `${breakpoint}-` : ''}${size}`;
                const declarations = sides.map((side) => `${property}${side}: ${value} !important;`).join(' ');
                add(name, declarations);
                if (!breakpoint && /^(?:[0-5]|auto)$/.test(size)) {
                    // 重名类在原生 UI 仍遵循 Tailwind 层级，仅旧内容可覆盖组件默认间距。
                    rules.push(`${scope} :where([data-dcat-modern-legacy-island]).${name}, ${scope} :where([data-dcat-modern-legacy-island]) .${name} { ${declarations} }`);
                }
            }
        }
    }
}
for (const [breakpoint, minimum] of [['', 0], ['sm', 576], ['md', 768], ['lg', 992], ['xl', 1200]]) {
    if (minimum) rules.push(`@media (min-width: ${minimum}px) {`);
    addSpacing(breakpoint);
    const name = (base, suffix) => `${base}-${breakpoint ? `${breakpoint}-` : ''}${suffix}`;
    for (let span = 1; span <= 12; span++) add(name('col', span), `flex: 0 0 ${span / 12 * 100}%; max-width: ${span / 12 * 100}%;`);
    add(name('col', 'auto'), 'flex: 0 0 auto; width: auto; max-width: 100%;');
    for (const display of ['none', 'block', 'inline', 'inline-block', 'flex', 'inline-flex', 'table', 'table-row', 'table-cell']) add(name('d', display), `display: ${display} !important;`);
    if (minimum) rules.push('}');
}
add('col', 'flex: 1 1 0; min-width: 0;');
add('clearfix::after', 'content: ""; display: table; clear: both;');
add('flex-grow-1', 'flex-grow: 1 !important;');
add('flex-shrink-0', 'flex-shrink: 0 !important;');
add('text-nowrap', 'white-space: nowrap !important;');
add('text-wrap', 'white-space: normal !important;');
add('text-truncate', 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;');
add('font-weight-bold', 'font-weight: 700 !important;');
add('border-0', 'border: 0 !important;');
add('list-unstyled', 'list-style: none; padding-left: 0;');
for (const width of [25, 50, 75, 100]) add(`w-${width}`, `width: ${width}% !important;`);
fs.writeFileSync(path.join(root, 'resources/modern/compat-utilities.css'), `${rules.join('\n')}\n`);
const selectors = ['compat-facade.css', 'compat-utilities.css'].map((file) => fs.readFileSync(path.join(root, 'resources/modern', file), 'utf8')).join('\n');
const classes = Array.from(new Set(Array.from(selectors.matchAll(/\.([a-zA-Z][\w-]*)/g), (match) => match[1]))).filter((name) => !name.startsWith('dcat-modern')).sort();
const contract = { version: '1.0.0', classes, plugins: ['modal', 'dropdown', 'tab', 'collapse', 'popover', 'tooltip', 'button', 'validator', 'form', 'pjax', 'datetimepicker', 'bootstrapDualListbox', 'bootstrapNumber', 'colorpicker'], modes: ['native', 'compat-css', 'compat-jquery'], deprecatedModes: ['classic-required'] };
fs.writeFileSync(path.join(root, 'resources/modern/compat-contract.json'), `${JSON.stringify(contract, null, 2)}\n`);
console.log(`Dcat compatibility contract: ${classes.length} CSS classes, ${contract.plugins.length} API surfaces.`);
