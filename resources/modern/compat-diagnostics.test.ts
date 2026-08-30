import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error 此依赖在当前项目中没有 TypeScript 声明。
import jquery from 'jquery';
// @ts-expect-error 此 JavaScript 模块没有单独的 TypeScript 声明。
import { installCompatDiagnostics } from './compat-diagnostics';

type CompatDiagnostic = {
    code: string;
    surface: string;
    location: string;
    action: string;
};

type CompatDiagnostics = {
    inspect: () => void;
    diagnostics: () => CompatDiagnostic[];
    dispose: () => void;
};

const installDiagnostics = installCompatDiagnostics as () => CompatDiagnostics;
let entries: CompatDiagnostic[];
let capture: EventListener;
let installed: CompatDiagnostics | undefined;

beforeEach(() => {
    document.body.innerHTML = '<script id="dcat-modern-config" type="application/json">{"diagnostics":true}</script>';
    entries = [];
    installed = undefined;
    capture = (event) => entries.push((event as CustomEvent<CompatDiagnostic>).detail);
    window.addEventListener('dcat:compat:diagnostic', capture);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    installed?.dispose();
    window.removeEventListener('dcat:compat:diagnostic', capture);
    vi.unstubAllGlobals();
});

function setDiagnosticsEnabled(enabled: boolean): void {
    document.querySelector('#dcat-modern-config')!.textContent = JSON.stringify({ diagnostics: enabled });
}

function addIsland(id?: string, mode = 'compat-css'): HTMLElement {
    const island = document.createElement('section');
    island.setAttribute('data-dcat-compat', mode);
    if (id !== undefined) island.setAttribute('data-dcat-compat-id', id);

    const control = document.createElement('button');
    control.className = 'btn-unregistered';
    control.setAttribute('data-toggle', 'unsupported-widget');
    island.appendChild(control);
    document.body.appendChild(island);
    return island;
}

function startDiagnostics(): CompatDiagnostics {
    installed = installDiagnostics();
    return installed;
}

describe('compatibility diagnostics', () => {
    it('reports the same unknown surfaces for each compat island and deduplicates repeated scans', () => {
        addIsland('user-form');
        addIsland('filter-form');

        const diagnostics = startDiagnostics();
        diagnostics.inspect();
        diagnostics.inspect();

        expect(diagnostics.diagnostics().map(({ code, surface, location }) => [code, surface, location])).toEqual([
            ['UNKNOWN_COMPAT_CLASS', 'btn-unregistered', 'user-form'],
            ['UNKNOWN_COMPAT_API', 'unsupported-widget', 'user-form'],
            ['UNKNOWN_COMPAT_CLASS', 'btn-unregistered', 'filter-form'],
            ['UNKNOWN_COMPAT_API', 'unsupported-widget', 'filter-form'],
        ]);
        expect(entries).toEqual(diagnostics.diagnostics());
        expect(console.warn).toHaveBeenCalledTimes(4);
    });

    it('scopes seen diagnostics and assigned IDs to the current PJAX page', () => {
        const first = addIsland('shared-descriptor');
        const diagnostics = startDiagnostics();
        expect(diagnostics.diagnostics()).toHaveLength(2);

        document.dispatchEvent(new Event('dcat:pjax:before-replace'));
        first.remove();
        const second = addIsland('shared-descriptor');
        document.dispatchEvent(new Event('dcat:pjax:loaded'));
        diagnostics.inspect();

        expect(diagnostics.diagnostics().map(({ location }) => location)).toEqual(['shared-descriptor', 'shared-descriptor']);
        expect(entries).toHaveLength(4);

        document.dispatchEvent(new Event('dcat:pjax:before-replace'));
        second.remove();
        addIsland();
        document.dispatchEvent(new Event('dcat:pjax:loaded'));
        diagnostics.inspect();

        expect(diagnostics.diagnostics().map(({ location }) => location)).toEqual(['compat-region#1', 'compat-region#1']);
        expect(entries).toHaveLength(6);

        document.dispatchEvent(new Event('dcat:pjax:before-replace'));
        document.querySelector('[data-dcat-compat]')!.remove();
        addIsland();
        document.dispatchEvent(new Event('dcat:pjax:end'));

        expect(diagnostics.diagnostics().map(({ location }) => location)).toEqual(['compat-region#2', 'compat-region#2']);
        expect(entries).toHaveLength(8);
    });

    it('reinspects cached PJAX content on the jQuery pjax:end event', () => {
        vi.stubGlobal('jQuery', jquery);
        const first = addIsland('cached-region');

        const diagnostics = startDiagnostics();
        document.dispatchEvent(new Event('dcat:pjax:before-replace'));
        first.remove();
        addIsland('cached-region');
        jquery(document.body).trigger('pjax:end');

        expect(diagnostics.diagnostics().map(({ location }) => location)).toEqual(['cached-region', 'cached-region']);
        expect(entries).toHaveLength(4);
    });

    it('keeps dispose internal and clears retained diagnostics idempotently', () => {
        addIsland('disposable-region');
        const diagnostics = startDiagnostics();

        expect(Object.keys(diagnostics)).toEqual(['inspect', 'diagnostics', 'contract']);
        expect(diagnostics.diagnostics()).toHaveLength(2);
        diagnostics.dispose();
        diagnostics.dispose();
        document.dispatchEvent(new Event('dcat:booted'));
        diagnostics.inspect();

        expect(diagnostics.diagnostics()).toEqual([]);
        expect(entries).toHaveLength(2);
    });

    it('assigns unique locations to default and duplicate descriptor IDs', () => {
        addIsland('custom-slot');
        addIsland('custom-slot');
        addIsland('shared-descriptor');
        addIsland('shared-descriptor');

        const diagnostics = startDiagnostics();

        expect(diagnostics.diagnostics().map(({ location }) => location)).toEqual([
            'compat-region#1', 'compat-region#1',
            'compat-region#2', 'compat-region#2',
            'shared-descriptor', 'shared-descriptor',
            'compat-region#3', 'compat-region#3',
        ]);
    });

    it('keeps anonymous locations distinct from valid IDs using the old anonymous pattern', () => {
        addIsland();
        addIsland('compat-region-1');

        const diagnostics = startDiagnostics();

        expect(diagnostics.diagnostics().map(({ location }) => location)).toEqual([
            'compat-region#1', 'compat-region#1',
            'compat-region-1', 'compat-region-1',
        ]);
    });

    it('keeps inline-script diagnostics distinct from an island with the same label', () => {
        const island = addIsland('inline-script');
        island.querySelector('button')!.setAttribute('data-toggle', 'carousel');

        const diagnostics = startDiagnostics();
        window.dispatchEvent(new CustomEvent('dcat:compat:script', { detail: { source: "window.Dcat.carousel('private value')" } }));

        expect(diagnostics.diagnostics().filter(({ code, surface }) => code === 'UNKNOWN_COMPAT_API' && surface === 'carousel').map(({ location }) => location)).toEqual([
            'inline-script',
            'inline-script#source',
        ]);
    });

    it('assigns stable anonymous locations to islands with missing or unsafe IDs', () => {
        addIsland();
        addIsland('invalid id');
        addIsland('<unsafe>');

        const diagnostics = startDiagnostics();
        const firstLocations = diagnostics.diagnostics().map(({ location }) => location);
        diagnostics.inspect();

        expect(firstLocations).toEqual(['compat-region#1', 'compat-region#1', 'compat-region#2', 'compat-region#2', 'compat-region#3', 'compat-region#3']);
        expect(diagnostics.diagnostics().map(({ location }) => location)).toEqual(firstLocations);
        expect(new Set(firstLocations.filter((_, index) => index % 2 === 0)).size).toBe(3);
        expect(console.warn).toHaveBeenCalledTimes(6);
    });

    it('reports removed and unknown compat modes without treating them as supported', () => {
        addIsland('removed-mode', 'classic-required');
        addIsland('unknown-mode', 'bootstrap');

        const diagnostics = startDiagnostics();

        const removed = diagnostics.diagnostics().filter(({ code, surface }) => code === 'CLASSIC_REQUIRED' && surface === 'classic-required');
        const unknown = diagnostics.diagnostics().filter(({ code, surface }) => code === 'UNSUPPORTED_COMPAT_MODE' && surface === 'bootstrap');

        expect(removed.map(({ location }) => location)).toEqual(['removed-mode']);
        expect(unknown.map(({ location }) => location)).toEqual(['unknown-mode']);
    });

    it('stays silent when diagnostics are disabled', () => {
        addIsland('disabled-region');
        setDiagnosticsEnabled(false);

        const diagnostics = startDiagnostics();
        document.dispatchEvent(new Event('dcat:booted'));
        document.dispatchEvent(new Event('dcat:pjax:loaded'));
        window.dispatchEvent(new CustomEvent('dcat:compat:script', { detail: { source: '.carousel(' } }));
        diagnostics.inspect();

        expect(diagnostics.diagnostics()).toEqual([]);
        expect(entries).toEqual([]);
        expect(console.warn).not.toHaveBeenCalled();
    });

    it('does not include field values or island HTML in diagnostic data', () => {
        const island = addIsland('profile-panel');
        const field = document.createElement('input');
        field.value = 'private-user@example.test';
        island.appendChild(field);
        const markup = document.createElement('span');
        markup.innerHTML = '<em>private profile markup</em>';
        island.appendChild(markup);

        const diagnostics = startDiagnostics();
        window.dispatchEvent(new CustomEvent('dcat:compat:script', {
            detail: { source: `window.Dcat.charts.carousel('private script value'); const html = '<p>private script markup</p>';` },
        }));
        const reported = diagnostics.diagnostics();
        const serialized = JSON.stringify({
            diagnostics: reported,
            events: entries,
            logs: vi.mocked(console.warn).mock.calls,
        });

        expect(serialized).not.toContain(field.value);
        expect(serialized).not.toContain('private profile markup');
        expect(serialized).not.toContain('private script value');
        expect(serialized).not.toContain('private script markup');
        expect(serialized).not.toContain('<em>');
        expect(reported.slice(0, 2).every(({ location }) => location === 'profile-panel')).toBe(true);
        expect(reported[reported.length - 1]?.location).toBe('inline-script#source');
    });
});
