import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NativeDcat } from './runtime';
import { navigation } from './navigation';

beforeEach(() => {
    navigation.dispose();
    document.body.innerHTML = '<main id="pjax-container"></main>';
    document.dispatchEvent(new CustomEvent('dcat:pjax:before-replace'));
});

afterEach(() => navigation.dispose());

describe('native Dcat public lifecycle', () => {
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
