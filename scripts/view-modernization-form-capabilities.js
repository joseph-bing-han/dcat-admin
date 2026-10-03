'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'codestable/epics/001-x-view-layer-modernization/form-capability-registry.json');
const checkOnly = process.argv.includes('--check');
const errors = [];

const nativeBasic = new Map([
    ['Checkbox.php', 'control:cap_checkbox'],
    ['Date.php', 'control:cap_date'],
    ['Display.php', 'control:cap_display'],
    ['Email.php', 'control:email'],
    ['Hidden.php', 'control:cap_hidden'],
    ['Id.php', 'control:cap_id'],
    ['Number.php', 'control:cap_number'],
    ['Password.php', 'control:cap_password'],
    ['Radio.php', 'control:cap_radio'],
    ['Select.php', 'control:cap_select'],
    ['SwitchField.php', 'control:cap_switch'],
    ['Tel.php', 'control:cap_tel'],
    ['Text.php', 'control:username'],
    ['Textarea.php', 'control:name'],
    ['Time.php', 'control:cap_time'],
    ['Url.php', 'control:cap_url'],
]);

const nativeAdvanced = new Map([
    ['Color.php', 'control:adv_color'],
    ['Currency.php', 'control:adv_currency'],
    ['DateRange.php', 'range:adv_date_start+adv_date_end'],
    ['Datetime.php', 'control:adv_datetime'],
    ['DatetimeRange.php', 'range:adv_datetime_start+adv_datetime_end'],
    ['Decimal.php', 'control:adv_decimal'],
    ['Ip.php', 'control:adv_ip'],
    ['Listbox.php', 'dual-list:adv_listbox'],
    ['Mobile.php', 'control:adv_mobile'],
    ['Month.php', 'control:adv_month'],
    ['MultipleSelect.php', 'control:adv_multiple'],
    ['Range.php', 'range:adv_range_start+adv_range_end'],
    ['Rate.php', 'control:adv_rate'],
    ['TimeRange.php', 'range:adv_time_start+adv_time_end'],
    ['Timezone.php', 'control:adv_timezone'],
    ['Year.php', 'control:adv_year'],
]);

const vendorAdvanced = new Map([
    ['Autocomplete.php', 'autocomplete:vendor_autocomplete'],
    ['Editor.php', 'tinymce:vendor_editor'],
    ['File.php', 'webuploader:vendor_file'],
    ['Icon.php', 'iconpicker:vendor_icon'],
    ['Image.php', 'webuploader:vendor_image'],
    ['Markdown.php', 'editor-md:vendor_markdown'],
    ['MultipleFile.php', 'webuploader:vendor_files'],
    ['MultipleImage.php', 'webuploader:vendor_images'],
    ['Slider.php', 'ion-range-slider:vendor_slider'],
    ['Tags.php', 'select2-tags:vendor_tags'],
    ['Tree.php', 'jstree:vendor_tree'],
]);

const compatAdvanced = new Map([
    ['ArrayField.php', 'nested-array:compat_array'],
    ['Button.php', 'callback:Compat Button'],
    ['CascadeGroup.php', 'cascade:compat_cascade'],
    ['Divide.php', 'content:Compat divider'],
    ['Embeds.php', 'embeds:compat_embeds'],
    ['HasMany.php', 'nested-has-many:roles'],
    ['Head.php', 'content:Compat heading'],
    ['Html.php', 'content:data-compat-html'],
    ['KeyValue.php', 'key-value:compat_key_value'],
    ['ListField.php', 'list:compat_list'],
    ['MultipleSelectTable.php', 'dialog:compat_multi_select_table'],
    ['SelectTable.php', 'dialog:compat_select_table'],
    ['Table.php', 'nested-table:compat_table'],
]);

const optionalAdvanced = new Map([
    ['Captcha.php', 'captcha:__captcha__'],
    ['Map.php', 'map:optional_lat+optional_lng'],
]);

const helperAdvanced = new Map([
    ['CanCascadeFields.php', { fixture: '/tests/view-baseline/modern-form-advanced-compat', test: 'form-advanced-compat', witness: 'cascade:compat_cascade' }],
    ['CanLoadFields.php', { fixture: '/tests/view-baseline/modern-form-advanced-compat', test: 'form-advanced-compat', witness: 'load-fields:compat_load_parent' }],
    ['Fieldset.php', { fixture: '/tests/view-baseline/modern-form-advanced-compat', test: 'form-advanced-compat', witness: 'fieldset:Compat fieldset' }],
    ['HasDepends.php', { fixture: '/tests/view-baseline/modern-form-advanced-vendor', test: 'form-advanced-vendor', witness: 'host:Autocomplete.php' }],
    ['ImageField.php', { fixture: '/tests/view-baseline/modern-form-advanced-vendor', test: 'form-advanced-vendor', witness: 'host:Image.php' }],
    ['Nullable.php', { fixture: '/tests/view-baseline/modern-form-advanced-compat', test: 'form-advanced-compat', witness: 'sentinel:non-rendering-field' }],
    ['PlainInput.php', { fixture: '/tests/view-baseline/modern-form-advanced-native', test: 'form-advanced-native', witness: 'affix:adv_currency' }],
    ['Sizeable.php', { fixture: '/tests/view-baseline/modern-form-basic', test: 'form-basic-native', witness: 'host:Select.php' }],
    ['UploadField.php', { fixture: '/tests/view-baseline/modern-form-advanced-vendor', test: 'form-advanced-vendor', witness: 'upload-protocol:vendor_file' }],
    ['WebUploader.php', { fixture: '/tests/view-baseline/modern-form-advanced-vendor', test: 'form-advanced-vendor', witness: 'upload-retry-cleanup:vendor_file' }],
]);

const actual = relativeFiles('src/Form/Field');
const classified = [...nativeBasic.keys(), ...nativeAdvanced.keys(), ...vendorAdvanced.keys(), ...compatAdvanced.keys(), ...optionalAdvanced.keys(), ...helperAdvanced.keys()].sort();
validateExact(actual, classified, 68);

const fields = actual.map((file) => {
    if (nativeBasic.has(file)) {
        return {
            path: `src/Form/Field/${file}`,
            phase: 'B6',
            status: 'native',
            renderOwner: 'react-payload',
            interactionOwner: 'native-form/browser',
            fallback: ['Select.php', 'Radio.php', 'Checkbox.php'].includes(file)
                ? 'compat-for-dynamic-options-or-cascade'
                : ['Date.php', 'Time.php'].includes(file)
                    ? 'compat-for-nonstandard-format-or-plugin-behavior'
                    : 'compat-if-custom-script-or-callback',
            fixtureRoute: '/tests/view-baseline/modern-form-basic',
            browserTestId: 'form-basic-native',
            browserWitness: nativeBasic.get(file),
        };
    }
    if (nativeAdvanced.has(file)) {
        return {
            path: `src/Form/Field/${file}`,
            phase: 'B7',
            status: 'native',
            renderOwner: 'react-payload',
            interactionOwner: 'native-form/browser',
            fallback: ['MultipleSelect.php', 'Listbox.php'].includes(file)
                ? 'field-compat-for-dynamic-options-or-cascade'
                : 'field-compat-if-custom-script-or-callback',
            fixtureRoute: '/tests/view-baseline/modern-form-advanced-native',
            browserTestId: 'form-advanced-native',
            browserWitness: nativeAdvanced.get(file),
        };
    }
    if (vendorAdvanced.has(file)) {
        return {
            path: `src/Form/Field/${file}`,
            phase: 'B7',
            status: 'vendor-adapter',
            renderOwner: 'compat-island',
            interactionOwner: 'vendor-adapter/browser',
            fallback: 'field-scoped-compat',
            fixtureRoute: '/tests/view-baseline/modern-form-advanced-vendor',
            browserTestId: 'form-advanced-vendor',
            browserWitness: vendorAdvanced.get(file),
        };
    }
    if (compatAdvanced.has(file)) {
        return {
            path: `src/Form/Field/${file}`,
            phase: 'B7',
            status: 'compat-island',
            renderOwner: 'compat-island',
            interactionOwner: 'dcat-compat/browser',
            fallback: 'field-scoped-compat',
            fixtureRoute: '/tests/view-baseline/modern-form-advanced-compat',
            browserTestId: 'form-advanced-compat',
            browserWitness: compatAdvanced.get(file),
        };
    }
    if (optionalAdvanced.has(file)) {
        return {
            path: `src/Form/Field/${file}`,
            phase: 'B7',
            status: 'compat-island',
            renderOwner: 'compat-island',
            interactionOwner: 'optional-provider/browser',
            fallback: 'field-scoped-compat',
            fixtureRoute: '/tests/view-baseline/modern-form-advanced-optional',
            browserTestId: 'form-advanced-optional',
            browserWitness: optionalAdvanced.get(file),
        };
    }
    if (helperAdvanced.has(file)) {
        const helper = helperAdvanced.get(file);
        return {
            path: `src/Form/Field/${file}`,
            phase: 'B7',
            status: 'helper',
            renderOwner: 'host-field',
            interactionOwner: 'host-field/browser',
            fallback: 'not-a-standalone-renderer',
            fixtureRoute: helper.fixture,
            browserTestId: helper.test,
            browserWitness: helper.witness,
        };
    }
    fail(`Form field classification branch missing: ${file}`);
    return null;
});

const registry = {
    schemaVersion: 1,
    contractVersion: '4.0.0',
    generatedAt: '2026-09-05',
    generator: 'scripts/view-modernization-form-capabilities.js',
    policy: {
        rule: 'All 68 Form field classes/traits are explicitly classified. Every standalone B7 field is frozen as native, vendor-adapter, or compat-island; non-rendering traits/helpers are classified as host-field helpers. Every entry has a real browser witness through its owning fixture.',
        nativeBasicFixture: '/tests/view-baseline/modern-form-basic',
        layoutFixture: '/tests/view-baseline/modern-form-layout',
        advancedFixtures: [
            '/tests/view-baseline/modern-form-advanced-native',
            '/tests/view-baseline/modern-form-advanced-vendor',
            '/tests/view-baseline/modern-form-advanced-compat',
            '/tests/view-baseline/modern-form-advanced-optional',
        ],
    },
    summary: {
        total: fields.length,
        nativeB6: fields.filter((entry) => entry.phase === 'B6' && entry.status === 'native').length,
        nativeB7: fields.filter((entry) => entry.phase === 'B7' && entry.status === 'native').length,
        vendorAdapterB7: fields.filter((entry) => entry.phase === 'B7' && entry.status === 'vendor-adapter').length,
        compatIslandB7: fields.filter((entry) => entry.phase === 'B7' && entry.status === 'compat-island').length,
        helperB7: fields.filter((entry) => entry.phase === 'B7' && entry.status === 'helper').length,
        pendingB7: fields.filter((entry) => entry.phase === 'B7' && (!entry.fixtureRoute || !entry.browserTestId || !entry.browserWitness || entry.browserWitness === 'pending-b7')).length,
    },
    layout: {
        status: 'native',
        fixtureRoute: '/tests/view-baseline/modern-form-layout',
        browserTestId: 'form-layout-native',
        witnesses: ['stack', 'rows', 'columns', 'blocks', 'tabs', 'tab-422-focus', 'five-viewports'],
    },
    fields,
};

fields.filter(Boolean).forEach((entry) => {
    if (!entry.fixtureRoute || !entry.browserTestId || !entry.browserWitness || entry.browserWitness === 'pending-b7') {
        fail(`Form capability browser mapping is incomplete: ${entry.path}`);
    }
});
if (registry.summary.pendingB7 !== 0) {
    fail(`B7 Form classification is not closed: ${registry.summary.pendingB7} entries remain pending`);
}

if (errors.length) finish();
if (checkOnly) {
    if (!fs.existsSync(outputPath)) fail(`Form capability registry is missing: ${relative(outputPath)}`);
    else if (JSON.stringify(JSON.parse(fs.readFileSync(outputPath, 'utf8'))) !== JSON.stringify(registry)) {
        fail('Form capability registry is stale; run npm run form-capabilities:update');
    }
    finish();
    console.log(`Form capability registry OK: ${fields.length} fields (${registry.summary.nativeB6} B6 native; B7 ${registry.summary.nativeB7} native, ${registry.summary.vendorAdapterB7} vendor-adapter, ${registry.summary.compatIslandB7} compat-island, ${registry.summary.helperB7} helper, ${registry.summary.pendingB7} pending).`);
    process.exit(0);
}

fs.writeFileSync(outputPath, `${JSON.stringify(registry, null, 2)}\n`);
finish();
console.log(`Form capability registry updated: ${fields.length} fields (${registry.summary.nativeB6} B6 native; B7 ${registry.summary.nativeB7} native, ${registry.summary.vendorAdapterB7} vendor-adapter, ${registry.summary.compatIslandB7} compat-island, ${registry.summary.helperB7} helper, ${registry.summary.pendingB7} pending).`);

function relativeFiles(dir) {
    const absolute = path.join(root, dir);
    return walk(absolute).filter((file) => file.endsWith('.php')).map((file) => path.relative(absolute, file).replace(/\\/g, '/')).sort();
}

function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const file = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(file) : entry.isFile() ? [file] : [];
    });
}

function validateExact(actual, classified, expected) {
    if (actual.length !== expected) fail(`Form field inventory drift: expected ${expected}, got ${actual.length}`);
    const missing = actual.filter((file) => !classified.includes(file));
    const stale = classified.filter((file) => !actual.includes(file));
    if (missing.length) fail(`Form field classification missing: ${missing.join(', ')}`);
    if (stale.length) fail(`Form field classification references missing files: ${stale.join(', ')}`);
}

function relative(file) {
    return path.relative(root, file).replace(/\\/g, '/');
}

function fail(message) {
    errors.push(message);
}

function finish() {
    if (!errors.length) return;
    console.error('Form capability registry verification failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
}
