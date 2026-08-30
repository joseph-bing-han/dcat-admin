import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bridge, registerCoreCapability } from './bridge';

beforeEach(async () => {
    await act(async () => bridge.stop());
    document.body.innerHTML = '<div id="app" class="content-body" data-dcat-modern-request="1"><div class="fixture"></div></div>';
});

describe('DcatReact bridge', () => {
    it('mounts a registered capability once and cleans it up', async () => {
        const mount = vi.fn(() => vi.fn());
        bridge.register({
            id: 'extension.test-capability',
            family: 'extension',
            selector: '.fixture',
            fallbackScope: 'component',
            mount,
        });

        await act(async () => {
            bridge.start();
            bridge.mount();
        });
        expect(mount).toHaveBeenCalledTimes(1);
        expect(bridge.status().mountedRoots).toBeGreaterThanOrEqual(1);

        await act(async () => bridge.unmount());
        expect(document.querySelector('.fixture')?.hasAttribute('data-dcat-modern-capability')).toBe(false);
        bridge.unregister('extension.test-capability');
    });

    it('keeps repeated start idempotent', async () => {
        await act(async () => bridge.start());
        const first = bridge.status();
        await act(async () => bridge.start());
        const second = bridge.status();
        expect(second.started).toBe(true);
        expect(second.mountedRoots).toBe(first.mountedRoots);
    });

    it('unmounts a page scope even when a vendor overwrites window.Element', async () => {
        const cleanup = vi.fn();
        bridge.register({ id: 'extension.vendor-element', family: 'extension', selector: '.fixture', fallbackScope: 'component', mount: () => cleanup });
        await act(async () => bridge.start());
        const original = window.Element;
        try {
            window.Element = function VendorElement() {} as unknown as typeof Element;
            await act(async () => bridge.unmount(document.querySelector('#app')!));
            expect(cleanup).toHaveBeenCalledTimes(1);
            expect(bridge.status().mountedRoots).toBe(0);
        } finally {
            window.Element = original;
            bridge.unregister('extension.vendor-element');
        }
    });

    it('keeps repeated mount/unmount cycles bounded and reuses a single overlay root', async () => {
        const mount = vi.fn(() => vi.fn());
        bridge.register({
            id: 'extension.test-cycles',
            family: 'extension',
            selector: '.fixture',
            fallbackScope: 'component',
            mount,
        });
        await act(async () => bridge.start());
        for (let index = 0; index < 20; index += 1) {
            expect(bridge.status().mountedRoots).toBe(1);
            expect(document.querySelectorAll('#dcat-modern-overlay-root')).toHaveLength(1);
            await act(async () => bridge.unmount(document));
            expect(bridge.status().mountedRoots).toBe(0);
            expect(document.body.classList.contains('dcat-modern-active')).toBe(false);
            await act(async () => bridge.mount(document));
        }
        expect(mount).toHaveBeenCalledTimes(21);
        expect(document.querySelectorAll('#dcat-modern-overlay-root')).toHaveLength(1);
        await act(async () => bridge.unregister('extension.test-cycles'));
    });

    it('does not replace or mutate the legacy window.Dcat runtime object', async () => {
        const legacyDcat = { boot: vi.fn(), ready: vi.fn(), init: vi.fn(), wait: vi.fn() };
        const legacyWindow = window as unknown as { Dcat?: typeof legacyDcat };
        const original = legacyWindow.Dcat;
        legacyWindow.Dcat = legacyDcat;
        await act(async () => bridge.start());
        expect(legacyWindow.Dcat).toBe(legacyDcat);
        expect(legacyWindow.Dcat?.boot).toBe(legacyDcat.boot);
        await act(async () => bridge.stop());
        legacyWindow.Dcat = original;
    });

    it('allows multiple capabilities to share the same DOM root', async () => {
        const first = vi.fn();
        const second = vi.fn();
        const definition = {
            family: 'extension' as const,
            selector: '.fixture',
            fallbackScope: 'component' as const,
        };
        bridge.register({ ...definition, id: 'extension.test-shared-first', mount: first });
        bridge.register({ ...definition, id: 'extension.test-shared-second', mount: second });
        await act(async () => bridge.start());
        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
        expect(document.querySelector('.fixture')?.getAttribute('data-dcat-modern-capability')).toContain('extension.test-shared-first');
        expect(document.querySelector('.fixture')?.getAttribute('data-dcat-modern-capability')).toContain('extension.test-shared-second');
        await act(async () => {
            bridge.unregister('extension.test-shared-first');
            bridge.unregister('extension.test-shared-second');
        });
    });

    it('renders an extension React capability and restores fallback on unregister', async () => {
        document.body.innerHTML = '<div data-dcat-modern-request="1"><div data-dcat-react-component="sample"><div data-dcat-modern-fallback>Legacy fallback</div></div></div>';
        bridge.registerReact({
            id: 'extension.sample',
            family: 'extension',
            selector: '[data-dcat-react-component="sample"]',
            fallbackScope: 'component',
            render: () => bridge.createElement('strong', null, 'Modern extension'),
        });
        await act(async () => bridge.start());
        const island = document.querySelector<HTMLElement>('[data-dcat-react-component="sample"]');
        expect(island?.getAttribute('data-dcat-modern-react-mounted')).toBe('extension.sample');
        const modernView = island?.querySelector<HTMLElement>('.dcat-modern-react-view');
        expect(modernView?.textContent).toContain('Modern extension');
        expect(modernView?.hasAttribute('aria-hidden')).toBe(false);
        await act(async () => bridge.unregister('extension.sample'));
        expect(island?.hasAttribute('data-dcat-modern-react-mounted')).toBe(false);
    });

    it('detaches a committed fallback from the live DOM and restores the same node on unmount', async () => {
        document.body.innerHTML = '<div data-dcat-modern-request="1"><div data-dcat-react-component="detached"><div data-dcat-modern-fallback><div class="stable-anchor">Legacy</div></div></div></div>';
        const island = document.querySelector<HTMLElement>('[data-dcat-react-component="detached"]')!;
        const fallback = island.querySelector<HTMLElement>('[data-dcat-modern-fallback]')!;
        bridge.registerReact({
            id: 'extension.detached',
            family: 'extension',
            selector: '[data-dcat-react-component="detached"]',
            fallbackScope: 'component',
            render: () => bridge.createElement('div', { className: 'stable-anchor' }, 'Modern'),
        });
        await act(async () => bridge.start());
        await act(async () => Promise.resolve());
        expect(island.querySelectorAll('.stable-anchor')).toHaveLength(1);
        expect(fallback.isConnected).toBe(false);
        await act(async () => bridge.unregister('extension.detached'));
        expect(fallback.isConnected).toBe(true);
        expect(island.querySelector('[data-dcat-modern-fallback]')).toBe(fallback);
    });

    it('keeps extension fallback visible when a React view throws during render', async () => {
        document.body.innerHTML = '<div data-dcat-modern-request="1"><div data-dcat-react-component="broken"><div data-dcat-modern-fallback>Legacy survives</div></div></div>';
        const Broken = () => {
            throw new Error('broken extension');
        };
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        bridge.registerReact({
            id: 'extension.broken',
            family: 'extension',
            selector: '[data-dcat-react-component="broken"]',
            fallbackScope: 'component',
            render: () => bridge.createElement(Broken),
        });
        await act(async () => bridge.start());
        const island = document.querySelector<HTMLElement>('[data-dcat-react-component="broken"]');
        expect(island?.hasAttribute('data-dcat-modern-react-mounted')).toBe(false);
        expect(island?.querySelector('[data-dcat-modern-fallback]')?.textContent).toContain('Legacy survives');
        await act(async () => bridge.unregister('extension.broken'));
        consoleError.mockRestore();
    });

    it('preserves an extension payload and exact fallback node across unmount/remount cycles', async () => {
        document.body.innerHTML = `
            <div data-dcat-modern-request="1">
                <div data-dcat-react-component="sample" data-dcat-modern-extension="1"><div data-dcat-modern-fallback><span class="legacy-extension">Legacy</span></div></div>
                <script type="application/json" data-dcat-modern-payload="extension.sample-cycle">{"version":"1.0.0","capability":"extension.sample-cycle","payload":{"title":"Modern title"}}</script>
            </div>`;
        const island = document.querySelector<HTMLElement>('[data-dcat-react-component="sample"]')!;
        const fallback = island.querySelector<HTMLElement>('[data-dcat-modern-fallback]')!;
        const legacy = fallback.querySelector<HTMLElement>('.legacy-extension')!;
        bridge.registerReact({
            id: 'extension.sample-cycle',
            family: 'extension',
            selector: '[data-dcat-react-component="sample"]',
            fallbackScope: 'component',
            render: ({ context }) => bridge.createElement('strong', { className: 'modern-extension' }, String(context.payloads[0]?.payload && (context.payloads[0].payload as { title?: string }).title)),
        });
        await act(async () => bridge.start());
        expect(island.querySelector('.modern-extension')?.textContent).toBe('Modern title');
        expect(fallback.isConnected).toBe(false);

        await act(async () => bridge.unmount(document));
        expect(fallback.isConnected).toBe(true);
        expect(fallback.querySelector('.legacy-extension')).toBe(legacy);

        await act(async () => bridge.mount(document));
        expect(fallback.isConnected).toBe(false);
        expect(island.querySelector('.modern-extension')).not.toBeNull();

        await act(async () => bridge.unregister('extension.sample-cycle'));
        expect(fallback.isConnected).toBe(true);
        expect(fallback.querySelector('.legacy-extension')).toBe(legacy);
    });

    it('binds each repeated capability root to its adjacent payload', async () => {
        document.body.innerHTML = `
            <div data-dcat-modern-request="1">
                <div data-dcat-react-component="multi"><div data-dcat-modern-fallback>Legacy A</div></div>
                <script type="application/json" data-dcat-modern-payload="extension.multi-payload">{"version":"1.0.0","capability":"extension.multi-payload","payload":{"title":"Payload A"}}</script>
                <div data-dcat-react-component="multi"><div data-dcat-modern-fallback>Legacy B</div></div>
                <script type="application/json" data-dcat-modern-payload="extension.multi-payload">{"version":"1.0.0","capability":"extension.multi-payload","payload":{"title":"Payload B"}}</script>
            </div>`;
        bridge.registerReact({
            id: 'extension.multi-payload',
            family: 'extension',
            selector: '[data-dcat-react-component="multi"]',
            fallbackScope: 'component',
            render: ({ context }) => bridge.createElement(
                'strong',
                { className: 'multi-payload-value' },
                String((context.payloads[0]?.payload as { title?: string } | undefined)?.title || ''),
            ),
        });

        await act(async () => bridge.start());
        await act(async () => Promise.resolve());

        const values = Array.from(document.querySelectorAll('.multi-payload-value')).map((node) => node.textContent);
        expect(values).toEqual(['Payload A', 'Payload B']);
        await act(async () => bridge.unregister('extension.multi-payload'));
    });

    it('keeps the runtime dormant when the server request marker is absent', async () => {
        document.body.innerHTML = '<div id="app" class="content-body"><div class="fixture"></div></div>';
        const mount = vi.fn();
        bridge.register({
            id: 'extension.test-route-gate',
            family: 'extension',
            selector: '.fixture',
            fallbackScope: 'component',
            mount,
        });
        await act(async () => bridge.start());
        expect(mount).not.toHaveBeenCalled();
        expect(document.body.classList.contains('dcat-modern-active')).toBe(false);
        expect(document.getElementById('dcat-modern-overlay-root')).toBeNull();
        await act(async () => bridge.unregister('extension.test-route-gate'));
    });

    it('prevents extensions from spoofing, replacing or unregistering core capabilities', () => {
        registerCoreCapability({
            id: 'extension.core-owned-fixture',
            family: 'extension',
            selector: '.fixture',
            fallbackScope: 'component',
            mount: () => undefined,
        });

        expect(() => bridge.register({
            id: 'extension.core-owned-fixture',
            family: 'extension',
            selector: '.fixture',
            fallbackScope: 'component',
            mount: () => undefined,
        })).toThrow(/already registered/i);
        expect(() => bridge.unregister('extension.core-owned-fixture')).toThrow(/core capability/i);
        expect(() => bridge.register({
            id: 'grid.read',
            family: 'extension',
            selector: '.fixture',
            fallbackScope: 'component',
            mount: () => undefined,
        })).toThrow(/extension\.\*/i);
        expect(() => bridge.register({
            id: 'extension.bad-family',
            family: 'grid',
            selector: '.fixture',
            fallbackScope: 'component',
            mount: () => undefined,
        })).toThrow(/family "extension"/i);
    });
});
