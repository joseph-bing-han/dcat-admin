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
