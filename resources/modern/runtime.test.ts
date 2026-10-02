import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NativeDcat } from './runtime';
import { navigation } from './navigation';

beforeEach(() => {
    navigation.dispose();
    document.body.innerHTML = '<main id="pjax-container"></main>';
    document.dispatchEvent(new CustomEvent('dcat:pjax:before-replace'));
});

afterEach(() => navigation.dispose());

describe('collapsed sidebar preview', () => {
    beforeEach(() => {
        vi.stubGlobal('innerWidth', 1366);
        document.body.className = 'dcat-modern-active sidebar-collapse';
        document.body.innerHTML = '<button data-widget="pushmenu">Toggle navigation</button><aside class="main-sidebar"><details><summary>Forms</summary><a href="#form">Form</a></details></aside><button id="content">Content</button>';
        window.dispatchEvent(new Event('resize'));
    });

    afterEach(() => {
        document.body.className = '';
        vi.unstubAllGlobals();
    });

    const moveMouse = (type: 'mouseover' | 'mouseout', target: Element, relatedTarget: EventTarget | null) => {
        target.dispatchEvent(new MouseEvent(type, { bubbles: true, relatedTarget }));
    };
    const isPreviewed = () => document.body.classList.contains('sidebar-hover');

    it('previews on entry, stays open within the sidebar and closes on exit without toggling the layout', () => {
        const sidebar = document.querySelector('.main-sidebar')!;
        const summary = sidebar.querySelector('summary')!;
        const changed = vi.fn();
        document.addEventListener('dcat:sidebar:changed', changed);
        try {
            moveMouse('mouseover', sidebar, document.body);
            expect(isPreviewed()).toBe(true);
            expect(document.body.classList.contains('sidebar-collapse')).toBe(true);
            expect(document.querySelector('[data-widget="pushmenu"]')!.getAttribute('aria-expanded')).toBe('false');
            moveMouse('mouseout', sidebar, summary);
            moveMouse('mouseover', summary, sidebar);
            expect(isPreviewed()).toBe(true);
            moveMouse('mouseout', summary, document.querySelector('#content'));
            expect(isPreviewed()).toBe(false);
            expect(changed).not.toHaveBeenCalled();
        } finally {
            document.removeEventListener('dcat:sidebar:changed', changed);
        }
    });

    it('keeps groups usable and dismisses a selected link until the mouse re-enters', () => {
        const sidebar = document.querySelector('.main-sidebar')!;
        const summary = sidebar.querySelector('summary')!;
        const link = sidebar.querySelector('a')!;
        const select = vi.fn((event: Event) => event.preventDefault());
        link.addEventListener('click', select);
        summary.click();
        expect(sidebar.querySelector('details')!.open).toBe(true);
        expect(isPreviewed()).toBe(true);
        expect(document.body.classList.contains('sidebar-collapse')).toBe(true);
        link.click();
        expect(select).toHaveBeenCalledOnce();
        expect(isPreviewed()).toBe(false);
        expect(document.body.classList.contains('sidebar-collapse')).toBe(true);
        moveMouse('mouseover', summary, link);
        expect(isPreviewed()).toBe(false);
        moveMouse('mouseout', summary, document.body);
        moveMouse('mouseover', sidebar, document.body);
        expect(isPreviewed()).toBe(true);
    });

    it('supports keyboard focus without leaving the preview pinned after focus exits', () => {
        const summary = document.querySelector('summary')!;
        summary.focus();
        expect(isPreviewed()).toBe(true);
        summary.click();
        document.querySelector('a')!.focus();
        expect(isPreviewed()).toBe(true);
        document.querySelector<HTMLButtonElement>('#content')!.focus();
        expect(isPreviewed()).toBe(false);
        expect(document.body.classList.contains('sidebar-collapse')).toBe(true);
    });

    it.each(['outside click', 'Escape', 'dcat:pjax:start', 'dcat:pjax:before-replace', 'dcat:pjax:loaded'])('dismisses on %s', (action) => {
        document.querySelector('summary')!.focus();
        expect(isPreviewed()).toBe(true);
        if (action === 'outside click') document.querySelector<HTMLButtonElement>('#content')!.click();
        else if (action === 'Escape') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        else document.dispatchEvent(new CustomEvent(action));
        expect(isPreviewed()).toBe(false);
        expect(document.body.classList.contains('sidebar-collapse')).toBe(true);
        if (action === 'Escape') expect(document.activeElement).toBe(document.querySelector('[data-widget="pushmenu"]'));
    });

    it('keeps the explicit toggle independent from the preview', () => {
        const toggle = document.querySelector<HTMLButtonElement>('[data-widget="pushmenu"]')!;
        moveMouse('mouseover', document.querySelector('.main-sidebar')!, document.body);
        toggle.click();
        expect(isPreviewed()).toBe(false);
        expect(document.body.classList.contains('sidebar-collapse')).toBe(false);
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        toggle.click();
        expect(isPreviewed()).toBe(false);
        expect(document.body.classList.contains('sidebar-collapse')).toBe(true);
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    it('clears the desktop preview at the mobile breakpoint and preserves drawer controls', () => {
        const sidebar = document.querySelector('.main-sidebar')!;
        moveMouse('mouseover', sidebar, document.body);
        vi.stubGlobal('innerWidth', 375);
        window.dispatchEvent(new Event('resize'));
        expect(isPreviewed()).toBe(false);
        moveMouse('mouseover', sidebar, document.body);
        document.querySelector('summary')!.focus();
        expect(isPreviewed()).toBe(false);
        const toggle = document.querySelector<HTMLButtonElement>('[data-widget="pushmenu"]')!;
        toggle.click();
        expect(document.body.classList.contains('sidebar-open')).toBe(true);
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(document.body.classList.contains('sidebar-open')).toBe(false);
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    it.each(['dcat-modern-active', 'dcat-modern-active sidebar-collapse horizontal-menu', 'sidebar-collapse'])('does not preview outside the collapsed modern vertical layout: %s', (classes) => {
        document.body.className = classes;
        moveMouse('mouseover', document.querySelector('.main-sidebar')!, document.body);
        document.querySelector('summary')!.focus();
        document.querySelector('summary')!.click();
        expect(isPreviewed()).toBe(false);
    });
});

describe('native Dcat public lifecycle', () => {
    it('previews uploaded data images in a dialog and returns focus after closing', () => {
        Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.setAttribute('open', ''); } });
        Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); } });
        const dcat = new NativeDcat();
        const button = document.createElement('button');
        document.body.appendChild(button);
        button.focus();
        const open = vi.spyOn(window, 'open');
        const url = 'data:image/png;base64,aGVsbG8=';
        dcat.helpers.previewImage(url, null, 'Avatar');
        const dialog = document.querySelector<HTMLDialogElement>('.dcat-modern-image-preview')!;
        expect(dialog.open).toBe(true);
        expect(dialog.querySelector('img')!.src).toBe(url);
        expect(dialog.querySelector('img')!.alt).toBe('Avatar');
        expect(open).not.toHaveBeenCalled();
        dialog.querySelector('button')!.click();
        expect(dialog.isConnected).toBe(false);
        expect(document.activeElement).toBe(button);
    });
    it('shows one fullscreen loading indicator and removes it when finished', () => {
        const dcat = new NativeDcat();
        dcat.loading();
        dcat.loading();
        expect(document.querySelectorAll('[data-dcat-fullscreen-loading]')).toHaveLength(1);
        expect(document.querySelector('[role="status"] .dcat-modern-loading-spinner')).not.toBeNull();
        expect(document.body.getAttribute('aria-busy')).toBe('true');
        dcat.loading(false);
        expect(document.querySelector('[data-dcat-fullscreen-loading]')).toBeNull();
        expect(document.documentElement.classList.contains('dcat-is-loading')).toBe(false);
        expect(document.body.getAttribute('aria-busy')).toBe('false');
    });
    it('toggles only the async table filter and preserves its submit handler', () => {
        new NativeDcat();
        document.querySelector('#pjax-container')!.innerHTML = '<div class="async-table"><div class="filter-button-group"><button type="button">Filter</button></div><div class="filter-box d-none"><form class="grid-filter-form"><input name="username"><button>Search</button></form></div><table></table></div>';
        const table = document.querySelector<HTMLElement>('.async-table')!;
        const button = table.querySelector<HTMLButtonElement>('.filter-button-group button')!;
        const filter = table.querySelector<HTMLElement>('.filter-box')!;
        const form = table.querySelector<HTMLFormElement>('form')!;
        const submit = vi.fn((event: Event) => event.preventDefault());
        form.addEventListener('submit', submit);
        button.click();
        expect(filter.classList.contains('d-none')).toBe(false);
        expect(table.classList.contains('d-none')).toBe(false);
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        expect(submit).toHaveBeenCalledOnce();
        button.click();
        expect(filter.classList.contains('d-none')).toBe(true);
        expect(table.classList.contains('d-none')).toBe(false);
    });

    it('keeps native grid selection working when table ancestors cancel clicks', () => {
        new NativeDcat();
        document.querySelector('#pjax-container')!.innerHTML = '<section class="dcat-modern-grid-view"><table><thead><tr><th><input type="checkbox" class="select-all" data-dcat-grid-select-all="1"></th></tr></thead><tbody><tr><td><input type="checkbox" data-dcat-grid-row-selector="1"></td></tr><tr><td><input type="checkbox" data-dcat-grid-row-selector="1"></td></tr></tbody></table></section>';
        const table = document.querySelector('table')!;
        table.addEventListener('click', (event) => event.preventDefault());
        const selectAll = table.querySelector<HTMLInputElement>('.select-all')!;
        const rows = Array.from(table.querySelectorAll<HTMLInputElement>('[data-dcat-grid-row-selector]'));
        selectAll.click();
        expect(selectAll.checked).toBe(true);
        expect(rows.every((input) => input.checked)).toBe(true);
        rows[0].click();
        expect(selectAll.checked).toBe(false);
        expect(selectAll.indeterminate).toBe(true);
        selectAll.click();
        selectAll.click();
        expect(rows.every((input) => !input.checked)).toBe(true);
    });

    it.each([
        { left: 700, top: 400, expectedLeft: 600, expectedTop: 156 },
        { left: 740, top: 400, expectedLeft: 617, expectedTop: 156 },
        { left: 10, top: 20, expectedLeft: 8, expectedTop: 56 },
    ])('keeps the page-size dropup visible and anchored at $left/$top', ({ left, top, expectedLeft, expectedTop }) => {
        new NativeDcat();
        document.querySelector('main')!.innerHTML = '<div class="dcat-modern-grid-view"><div class="dropdown dropup"><button data-toggle="dropdown">20</button><ul class="dropdown-menu"><li><a href="#">20</a></li></ul></div></div>';
        const trigger = document.querySelector<HTMLButtonElement>('[data-toggle="dropdown"]')!;
        const menu = document.querySelector<HTMLElement>('.dropdown-menu')!;
        vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(785);
        vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(600);
        vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({ left, right: left + 60, top, bottom: top + 32, width: 60, height: 32 } as DOMRect);
        vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue({ width: 160, height: 240 } as DOMRect);
        try {
            trigger.click();
            expect(trigger.getAttribute('aria-expanded')).toBe('true');
            expect(menu.style.left).toBe(`${expectedLeft}px`);
            expect(menu.style.top).toBe(`${expectedTop}px`);
            trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            expect(trigger.getAttribute('aria-expanded')).toBe('false');
            expect(document.activeElement).toBe(trigger);
            expect(menu.getAttribute('style')).toBeNull();
        } finally { vi.restoreAllMocks(); }
    });

    it('runs ready/init/boot without a jQuery global and cleans page observers', async () => {
        const dcat = new NativeDcat({ token: 'fixture-token', lang: { greeting: 'Hello :name' } });
        expect((window as unknown as { jQuery?: unknown }).jQuery).toBeUndefined();
        const bootOnce = vi.fn();
        const bootEvery = vi.fn();
        dcat.booting(bootOnce).bootingEveryRequest(bootEvery).boot();
        dcat.wait();
        const ready = vi.fn();
        dcat.ready(ready);
        await Promise.resolve();
        expect(ready).not.toHaveBeenCalled();
        dcat.triggerReady();
        expect(ready).toHaveBeenCalledTimes(1);
        expect(bootOnce).toHaveBeenCalledTimes(1);
        expect(bootEvery).toHaveBeenCalledTimes(2);
        expect(dcat.lang.trans('greeting', { name: 'Dcat' })).toBe('Hello Dcat');

        const init = vi.fn();
        dcat.init('.dynamic-control', init);
        const input = document.createElement('input');
        input.className = 'dynamic-control';
        document.querySelector('main')!.appendChild(input);
        await vi.waitFor(() => expect(init).toHaveBeenCalledTimes(1));
        expect(init.mock.calls[0]).toEqual([input, input.id]);
        expect(init.mock.contexts[0]).toBe(input);
        document.querySelector('main')!.appendChild(input);
        await Promise.resolve();
        expect(init).toHaveBeenCalledTimes(1);
        document.dispatchEvent(new CustomEvent('dcat:pjax:before-replace'));
        document.querySelector('main')!.appendChild(input.cloneNode());
        await Promise.resolve();
        expect(init).toHaveBeenCalledTimes(1);
    });

    it('retains CSRF and reports a failed write without automatic retry', async () => {
        const dcat = new NativeDcat({ token: 'fixture-token' });
        const fetch = vi.fn().mockResolvedValue({ status: 422, ok: false, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({ message: 'Validation failed' }) });
        vi.stubGlobal('fetch', fetch);
        try {
            await expect(dcat.request('/write', { method: 'POST', body: new URLSearchParams({ value: 'A' }) })).rejects.toThrow('Validation failed');
            expect(fetch).toHaveBeenCalledTimes(1);
            expect((fetch.mock.calls[0][1].headers as Headers).get('X-CSRF-TOKEN')).toBe('fixture-token');
            expect(fetch.mock.calls[0][1].credentials).toBe('same-origin');
        } finally { vi.unstubAllGlobals(); }
    });
});
