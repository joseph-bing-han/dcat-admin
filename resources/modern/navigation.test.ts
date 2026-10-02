import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { executePageScripts, NativeNavigation, type NavigationHost } from './navigation';

let navigation: NativeNavigation;
let host: NavigationHost;

it('loads dynamic dialog dependencies before activating inline initializers', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<script src="/dialog-tree-dependency.js"></script><script>window.dialogTreeInit = true;</script><script type="application/json">{"nodes":[]}</script>';
    document.body.appendChild(container);
    const inline = container.querySelectorAll('script')[1];
    const execution = executePageScripts(container, () => container.isConnected);
    expect(container.querySelectorAll('script')[1]).toBe(inline);
    const dependency = document.head.querySelector<HTMLScriptElement>('script[src$="/dialog-tree-dependency.js"]')!;
    expect(dependency).not.toBeNull();
    dependency.dispatchEvent(new Event('load'));
    await execution;
    expect(container.querySelector('script')).not.toBe(inline);
    expect(container.querySelector('script')?.textContent).toBe('window.dialogTreeInit = true;');
    expect(container.querySelector('script[type="application/json"]')?.textContent).toBe('{"nodes":[]}');
    dependency.remove();
    container.remove();
});

function pageConfig(renderer: string | null = '1') {
    const marker = renderer === null ? '' : ` data-dcat-r="${renderer}"`;
    return `<script type="application/json" data-dcat-modern-page-config${marker}>{"enabled":true,"compat":false}</script>`;
}

beforeEach(() => {
    document.body.innerHTML = `<main id="pjax-container">${pageConfig()}<input id="draft" value="Saved draft"></main>`;
    history.replaceState({}, '', '/');
    navigation = new NativeNavigation();
    host = { config: { pjax_container_selector: '#pjax-container' }, wait: vi.fn(), triggerReady: vi.fn(), error: vi.fn() };
    vi.stubGlobal('DcatReact', {});
    vi.stubGlobal('scrollTo', vi.fn());
});

afterEach(() => {
    navigation.dispose();
    vi.unstubAllGlobals();
});

function response(html: string, url = '/next', renderer: string | null = '1') {
    return { ok: true, url: new URL(url, location.href).href, headers: new Headers(), text: async () => `${pageConfig(renderer)}${html}` } as Response;
}

function setCurrentRenderer(renderer: string | null): void {
    const config = document.querySelector('[data-dcat-modern-page-config]')!;
    if (renderer === null) config.removeAttribute('data-dcat-r');
    else config.setAttribute('data-dcat-r', renderer);
}

function setRuntimeRenderer(renderer: string): void {
    vi.stubGlobal('DcatReact', renderer === '1' ? {} : undefined);
    vi.stubGlobal('DcatCompat', renderer === '0' ? {} : undefined);
}

describe('native navigation', () => {
    it('preserves entered values and node identity on HTTP and network failures', async () => {
        const draft = document.querySelector<HTMLInputElement>('#draft')!;
        draft.value = 'Unsaved input';
        const beforeReplace = vi.fn();
        draft.parentElement!.addEventListener('dcat:pjax:before-replace', beforeReplace);
        const fetch = vi.fn().mockResolvedValueOnce({ ok: false }).mockRejectedValueOnce(new TypeError('Offline'));
        vi.stubGlobal('fetch', fetch);
        await navigation.navigate(host, '/failure');
        await navigation.navigate(host, '/offline');
        expect(document.querySelector('#draft')).toBe(draft);
        expect(draft.value).toBe('Unsaved input');
        expect(beforeReplace).not.toHaveBeenCalled();
        expect(host.error).toHaveBeenCalledTimes(2);
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(location.pathname).toBe('/');
        expect(navigation.status().pendingRequests).toBe(0);
    });

    it('restores the previous page when a destination script fails after replacement', async () => {
        const draft = document.querySelector<HTMLInputElement>('#draft')!;
        draft.value = 'Unsaved input';
        const fetch = vi.fn().mockResolvedValue(response('<h1 id="destination">Destination</h1><script src="/missing.js"></script>'));
        vi.stubGlobal('fetch', fetch);
        const originalAppendChild = document.head.appendChild.bind(document.head);
        vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
            const result = originalAppendChild(node);
            if (node instanceof HTMLScriptElement) queueMicrotask(() => node.dispatchEvent(new Event('error')));
            return result;
        });

        await navigation.navigate(host, '/destination');

        expect(document.querySelector('#draft')).toBe(draft);
        expect(draft.value).toBe('Unsaved input');
        expect(document.querySelector('#destination')).toBeNull();
        expect(location.pathname).toBe('/');
        expect(host.error).toHaveBeenCalledWith('Page asset could not be loaded');
        expect(host.triggerReady).toHaveBeenCalledTimes(1);
    });

    it('aborts superseded reads and never commits a stale response', async () => {
        let release!: (response: Response) => void;
        const pending = new Promise<Response>((resolve) => { release = resolve; });
        const fetch = vi.fn().mockReturnValueOnce(pending).mockResolvedValueOnce(response('<p id="latest">Latest result</p>', '/latest'));
        vi.stubGlobal('fetch', fetch);
        const first = navigation.navigate(host, '/slow');
        const signal = fetch.mock.calls[0][1].signal as AbortSignal;
        await navigation.navigate(host, '/latest');
        release(response('<p>Stale result</p>', '/slow'));
        await first;
        expect(signal.aborted).toBe(true);
        expect(document.querySelector('#latest')?.textContent).toBe('Latest result');
        expect(document.body.textContent).not.toContain('Stale');
        expect(location.pathname).toBe('/latest');
        expect(host.triggerReady).toHaveBeenCalledTimes(1);
        expect(host.error).not.toHaveBeenCalled();
    });

    it('keeps the legacy read headers, inert payload, title and lifecycle order', async () => {
        const phases: string[] = [];
        const container = document.querySelector('#pjax-container')!;
        ['start', 'before-replace', 'success', 'complete', 'end'].forEach((phase) => {
            container.addEventListener(`dcat:pjax:${phase}`, () => phases.push(phase));
        });
        host.triggerReady = () => phases.push('loaded');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response('<title>Native page</title><h1>Heading</h1><script type="application/json">{"payload":true}</script>')));
        await navigation.navigate(host, '/next');
        expect(phases).toEqual(['start', 'before-replace', 'success', 'complete', 'loaded', 'end']);
        expect(document.title).toBe('Native page');
        expect(document.querySelector('script[type="application/json"]:not([data-dcat-modern-page-config])')?.textContent).toBe('{"payload":true}');
        expect(vi.mocked(fetch).mock.calls[0][1]?.headers).toMatchObject({ 'X-PJAX': 'true', 'X-PJAX-Container': '#pjax-container' });
    });

    it.each(['0', '1'])('uses fragment navigation when renderer remains %s', async (renderer) => {
        setCurrentRenderer(renderer);
        setRuntimeRenderer(renderer);
        const assign = vi.fn();
        vi.stubGlobal('location', { href: window.location.href, origin: window.location.origin, assign });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response('<p id="destination">Destination</p>', '/next', renderer)));

        await navigation.navigate(host, '/next');

        expect(assign).not.toHaveBeenCalled();
        expect(document.querySelector('#destination')?.textContent).toBe('Destination');
        expect(host.triggerReady).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['is missing in native runtime', null, '1'],
        ['is stale against native runtime', '0', '1'],
        ['is legacy in compat runtime', '2', '0'],
        ['is invalid in compat runtime', '01', '0'],
    ])('uses document navigation when the current marker %s', async (_name, currentMarker, renderer) => {
        setCurrentRenderer(currentMarker);
        setRuntimeRenderer(renderer);
        const assign = vi.fn();
        vi.stubGlobal('location', { href: window.location.href, origin: window.location.origin, assign });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response('<p id="destination">Destination</p>', '/next', renderer)));

        await navigation.navigate(host, '/next');

        expect(assign).toHaveBeenCalledWith(new URL('/next', window.location.href).href);
        expect(document.querySelector('#destination')).toBeNull();
        expect(host.triggerReady).not.toHaveBeenCalled();
    });

    it('uses document navigation when neither modern runtime is active', async () => {
        setCurrentRenderer('1');
        setRuntimeRenderer('');
        const assign = vi.fn();
        vi.stubGlobal('location', { href: window.location.href, origin: window.location.origin, assign });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response('<p id="destination">Destination</p>', '/next', '1')));

        await navigation.navigate(host, '/next');

        expect(assign).toHaveBeenCalledWith(new URL('/next', window.location.href).href);
        expect(document.querySelector('#destination')).toBeNull();
        expect(host.triggerReady).not.toHaveBeenCalled();
    });

    it('reloads a legacy PJAX history entry in the page renderer', () => {
        const reload = vi.fn();
        vi.stubGlobal('location', { href: window.location.href, origin: window.location.origin, assign: vi.fn(), reload });
        navigation.bind(host);

        window.dispatchEvent(new PopStateEvent('popstate', {
            state: { id: 1, url: '/legacy', container: '#pjax-container' },
        }));

        expect(reload).toHaveBeenCalledOnce();
    });

    it('leaves legacy PJAX history entries to an installed jQuery PJAX handler', () => {
        const reload = vi.fn();
        vi.stubGlobal('location', { href: window.location.href, origin: window.location.origin, assign: vi.fn(), reload });
        const pjax = Object.assign(vi.fn(), { _dcatPopstateHandlerActive: true });
        vi.stubGlobal('jQuery', { pjax });
        navigation.bind(host);

        window.dispatchEvent(new PopStateEvent('popstate', {
            state: { id: 1, url: '/legacy', container: '#pjax-container' },
        }));

        expect(reload).not.toHaveBeenCalled();
    });

    it('reloads legacy PJAX history when a compat facade lacks a popstate handler', () => {
        const reload = vi.fn();
        vi.stubGlobal('location', { href: window.location.href, origin: window.location.origin, assign: vi.fn(), reload });
        vi.stubGlobal('jQuery', { pjax: vi.fn() });
        navigation.bind(host);

        window.dispatchEvent(new PopStateEvent('popstate', {
            state: { id: 1, url: '/legacy', container: '#pjax-container' },
        }));

        expect(reload).toHaveBeenCalledOnce();
    });

    it('reloads legacy PJAX history after the jQuery PJAX handler is disabled', () => {
        const reload = vi.fn();
        vi.stubGlobal('location', { href: window.location.href, origin: window.location.origin, assign: vi.fn(), reload });
        const pjax = Object.assign(vi.fn(), { _dcatPopstateHandlerActive: false });
        vi.stubGlobal('jQuery', { pjax });
        navigation.bind(host);

        window.dispatchEvent(new PopStateEvent('popstate', {
            state: { id: 1, url: '/legacy', container: '#pjax-container' },
        }));

        expect(reload).toHaveBeenCalledOnce();
    });

    it('ignores history states that are not legacy PJAX entries', () => {
        const reload = vi.fn();
        vi.stubGlobal('location', { href: window.location.href, origin: window.location.origin, assign: vi.fn(), reload });
        navigation.bind(host);

        window.dispatchEvent(new PopStateEvent('popstate', { state: { container: 'third-party' } }));

        expect(reload).not.toHaveBeenCalled();
    });

    it.each([
        ['native to compat', '1', '0'],
        ['compat to native', '0', '1'],
        ['native to legacy', '1', '2'],
        ['compat to legacy', '0', '2'],
        ['native to unknown', '1', '3'],
        ['compat to leading-zero marker', '0', '01'],
        ['native to missing marker', '1', null],
    ])('uses document navigation for %s renderer changes', async (_name, renderer, destinationRenderer) => {
        setCurrentRenderer(renderer);
        setRuntimeRenderer(renderer);
        const assign = vi.fn();
        vi.stubGlobal('location', { href: window.location.href, origin: window.location.origin, assign });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response('<p id="destination">Destination</p>', '/next', destinationRenderer)));

        await navigation.navigate(host, '/next');

        expect(assign).toHaveBeenCalledWith(new URL('/next', window.location.href).href);
        expect(document.querySelector('#destination')).toBeNull();
        expect(host.triggerReady).not.toHaveBeenCalled();
    });

    it('ignores renderer-like attributes outside the page config marker', async () => {
        setCurrentRenderer('1');
        setRuntimeRenderer('1');
        const assign = vi.fn();
        vi.stubGlobal('location', { href: window.location.href, origin: window.location.origin, assign });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response('<p id="destination" data-dcat-r="1">Destination</p>', '/next', null)));

        await navigation.navigate(host, '/next');

        expect(assign).toHaveBeenCalledWith(new URL('/next', window.location.href).href);
        expect(document.querySelector('#destination')).toBeNull();
        expect(host.triggerReady).not.toHaveBeenCalled();
    });

    it('does not duplicate click handlers and releases them on dispose', async () => {
        document.querySelector('#pjax-container')!.innerHTML = `${pageConfig()}<a href="/next">Next</a>`;
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response('<p>Next page</p>')));
        navigation.bind(host);
        navigation.bind(host);
        const click = new MouseEvent('click', { bubbles: true, cancelable: true });
        document.querySelector('a')!.dispatchEvent(click);
        await vi.waitFor(() => expect(host.triggerReady).toHaveBeenCalledTimes(1));
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(click.defaultPrevented).toBe(true);
        navigation.dispose();
        document.body.innerHTML = '<a href="#other">Other</a>';
        const later = new MouseEvent('click', { bubbles: true, cancelable: true });
        document.querySelector('a')!.dispatchEvent(later);
        expect(later.defaultPrevented).toBe(false);
        later.preventDefault();
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('keeps history length unchanged while restoring a previous entry', async () => {
        const length = history.length;
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response('<p>Restored</p>', '/')));
        await navigation.navigate(host, '/', { history: false, scroll: [0, 120] });
        expect(history.length).toBe(length);
        expect(host.triggerReady).toHaveBeenCalledTimes(1);
    });
});
