import contract from './compat-contract.json';

// 诊断只保存有限的契约标识，不读取或发送字段值、HTML 或完整脚本。
export function installCompatDiagnostics() {
    const seen = new Map();
    let locations = new WeakMap();
    const assignedLocations = new Set();
    let nextLocation = 0;
    let disposed = false;
    const supported = new Set(contract.classes);
    const bootstrapClass = /^(?:col-|[mp][tblrxy]?-(?:\d|auto)|d-(?:sm-|md-|lg-|xl-)?|btn-|form-|input-group|card|alert|dropdown|modal|popover|tooltip|carousel|control-sidebar|sidebar-mini)/;
    const safeIdentifier = /^[a-zA-Z0-9_.-]{1,80}$/;
    const internalLocation = /^(?:compat-region#\d+|inline-script#source)$/;
    const enabled = () => {
        try { return Boolean(JSON.parse(document.querySelector('#dcat-modern-config')?.textContent || '{}').diagnostics); }
        catch (_) { return false; }
    };
    const locationFor = (island) => {
        if (locations.has(island)) return locations.get(island);
        const configured = island.dataset.dcatCompatId;
        let location = configured && configured !== 'custom-slot' && safeIdentifier.test(configured) && !assignedLocations.has(configured)
            ? configured
            : null;
        if (!location) {
            do { location = `compat-region#${++nextLocation}`; }
            while (assignedLocations.has(location));
        }
        assignedLocations.add(location);
        locations.set(island, location);
        return location;
    };
    const report = (code, surface, location = 'inline-script#source') => {
        if (disposed || !enabled() || !safeIdentifier.test(surface) || (!safeIdentifier.test(location) && !internalLocation.test(location))) return;
        const key = `${code}:${surface}:${location}`;
        if (seen.has(key)) return;
        const entry = { code, surface, location, action: 'Declare a supported Dcat compat descriptor (native, compat-css or compat-jquery); the classic renderer was removed.' };
        seen.set(key, entry);
        console.warn(`[Dcat compatibility] ${code}: ${surface} in ${location}. ${entry.action}`);
        window.dispatchEvent(new CustomEvent('dcat:compat:diagnostic', { detail: entry }));
    };
    const inspect = (root = document) => {
        if (disposed || !enabled()) return;
        root.querySelectorAll('[data-dcat-compat]').forEach((island) => {
            const location = locationFor(island);
            const mode = island.dataset.dcatCompat || '';
            if (mode === 'classic-required') report('CLASSIC_REQUIRED', 'classic-required', location);
            else if (!contract.modes.includes(mode)) report('UNSUPPORTED_COMPAT_MODE', mode || 'unknown', location);
            [island, ...island.querySelectorAll('[class],[data-toggle]')].forEach((element) => {
                element.classList.forEach((name) => { if (bootstrapClass.test(name) && !supported.has(name)) report('UNKNOWN_COMPAT_CLASS', name, location); });
                const toggle = element.getAttribute('data-toggle');
                if (toggle && ![...contract.plugins, 'pill', 'buttons'].includes(toggle)) report('UNKNOWN_COMPAT_API', toggle, location);
            });
        });
    };
    const clearPageDiagnostics = () => {
        seen.clear();
        locations = new WeakMap();
        assignedLocations.clear();
    };
    const inspectOnBoot = () => inspect();
    const inspectOnPjaxLoaded = () => inspect();
    const inspectOnPjaxEnd = () => inspect();
    const jqueryDocument = window.jQuery ? window.jQuery(document) : null;
    const inspectScript = (event) => {
        if (!enabled()) return;
        const source = event.detail?.source || '';
        for (const match of source.matchAll(/\.(carousel|scrollspy|affix|PushMenu|ControlSidebar)\s*\(/g)) report('UNKNOWN_COMPAT_API', match[1]);
        for (const match of source.matchAll(/\.(control-sidebar|sidebar-mini)(?=[\s.'"#:])/g)) report('PRIVATE_ADMINLTE_SELECTOR', match[1]);
    };
    document.addEventListener('dcat:pjax:before-replace', clearPageDiagnostics);
    document.addEventListener('dcat:booted', inspectOnBoot);
    document.addEventListener('dcat:pjax:loaded', inspectOnPjaxLoaded);
    document.addEventListener('dcat:pjax:end', inspectOnPjaxEnd);
    jqueryDocument?.on('pjax:end.dcatCompatDiagnostics', inspectOnPjaxEnd);
    window.addEventListener('dcat:compat:script', inspectScript);
    inspect();
    const diagnostics = {
        inspect,
        diagnostics: () => Array.from(seen.values()),
        contract,
    };
    Object.defineProperty(diagnostics, 'dispose', {
        enumerable: false,
        value: () => {
            if (disposed) return;
            disposed = true;
            document.removeEventListener('dcat:pjax:before-replace', clearPageDiagnostics);
            document.removeEventListener('dcat:booted', inspectOnBoot);
            document.removeEventListener('dcat:pjax:loaded', inspectOnPjaxLoaded);
            document.removeEventListener('dcat:pjax:end', inspectOnPjaxEnd);
            jqueryDocument?.off('pjax:end.dcatCompatDiagnostics', inspectOnPjaxEnd);
            window.removeEventListener('dcat:compat:script', inspectScript);
            seen.clear();
            locations = new WeakMap();
            assignedLocations.clear();
        },
    });
    return diagnostics;
}
