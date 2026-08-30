import { DOMElement } from './platform';
export interface NavigationHost {
    config: Record<string, unknown>;
    wait(value?: boolean): unknown;
    triggerReady(): unknown;
    error(message: string): unknown;
}

interface NavigationOptions {
    replace?: boolean;
    history?: boolean;
    scroll?: [number, number];
}

const scripts = new Map<string, Promise<void>>();
const styles = new Set<string>();

function rememberAssets(): void {
    document.querySelectorAll<HTMLScriptElement>('script[src]').forEach((node) => {
        if (!scripts.has(node.src)) scripts.set(node.src, Promise.resolve());
    });
    document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach((node) => styles.add(node.href));
}

export function loadScript(source: HTMLScriptElement | string): Promise<void> {
    const url = new URL(typeof source === 'string' ? source : source.src, location.href).href;
    const cached = scripts.get(url);
    if (cached) return cached;
    const node = document.createElement('script');
    if (typeof source !== 'string') Array.from(source.attributes).forEach((attribute) => node.setAttribute(attribute.name, attribute.value));
    node.nonce = (typeof source !== 'string' && source.nonce) || document.querySelector<HTMLScriptElement>('script[nonce]')?.nonce || '';
    node.src = url;
    node.async = false;
    const loaded = new Promise<void>((resolve, reject) => {
        node.onload = () => { node.onload = node.onerror = null; resolve(); };
        node.onerror = () => {
            scripts.delete(url);
            node.remove();
            reject(new Error('Page asset could not be loaded'));
        };
        document.head.appendChild(node);
    });
    scripts.set(url, loaded);
    return loaded;
}

async function executePageScripts(container: HTMLElement, current: () => boolean): Promise<void> {
    for (const source of Array.from(container.querySelectorAll<HTMLScriptElement>('script'))) {
        if (!current()) return;
        if (source.type && !/^(?:text|application)\/(?:java|ecma)script$|^module$/.test(source.type)) continue;
        if (source.src) {
            await loadScript(source);
            source.remove();
        } else {
            const node = document.createElement('script');
            Array.from(source.attributes).forEach((attribute) => node.setAttribute(attribute.name, attribute.value));
            node.nonce = source.nonce || document.querySelector<HTMLScriptElement>('script[nonce]')?.nonce || '';
            node.textContent = source.textContent;
            source.replaceWith(node);
        }
    }
}

function emit(container: HTMLElement, phase: string, detail: Record<string, unknown>): void {
    container.dispatchEvent(new CustomEvent('dcat:pjax:' + phase, { bubbles: true, detail }));
}

export class NativeNavigation {
    private host?: NavigationHost;
    private bindings?: AbortController;
    private pending?: AbortController;
    private sequence = 0;
    private pendingContainer?: HTMLElement;

    bind(host: NavigationHost): void {
        this.host = host;
        if (this.bindings || !host.config.pjax_container_selector) return;
        this.bindings = new AbortController();
        const options = { signal: this.bindings.signal };
        history.replaceState({ ...history.state, dcatPjax: { url: location.href, scroll: [scrollX, scrollY] } }, '', location.href);
        document.addEventListener('click', (event) => {
            const link = event.target instanceof DOMElement ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
            if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
            const raw = link.getAttribute('href') || '';
            if (!raw || raw.startsWith('#') || (link.target && link.target !== '_self') || link.matches('[download],[data-no-pjax],[data-dcat-legacy],[data-pjax="0"]')) return;
            const url = new URL(link.href, location.href);
            if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
            if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
            if (!document.querySelector(String(this.host?.config.pjax_container_selector || ''))) return;
            event.preventDefault();
            void this.navigate(this.host!, url.href);
        }, options);
        window.addEventListener('popstate', (event) => {
            if (this.host && event.state?.dcatPjax) {
                void this.navigate(this.host, location.href, { history: false, scroll: event.state.dcatPjax.scroll });
            } else if (event.state
                && typeof event.state.id === 'number'
                && typeof event.state.url === 'string'
                && typeof event.state.container === 'string'
                && !hasActiveJQueryPjaxPopstateHandler()) {
                // 旧版 UI 留下的 PJAX 历史条目在当前页面没有 jQuery PJAX handler，
                // 需要完整重载才能按当前 manifest 重新选择 renderer。
                location.reload();
            }
        }, options);
    }

    async navigate(host: NavigationHost, target: string, options: NavigationOptions = {}): Promise<void> {
        const url = new URL(target, location.href);
        if (!/^https?:$/.test(url.protocol)) return;
        const selector = String(host.config.pjax_container_selector || '');
        const container = selector ? document.querySelector<HTMLElement>(selector) : null;
        if (!container || url.origin !== location.origin) { location.assign(url.href); return; }

        if (this.pending) {
            this.pending.abort();
            this.pendingContainer?.removeAttribute('aria-busy');
            emit(this.pendingContainer || container, 'abort', { container: selector });
        }
        const controller = new AbortController();
        this.pending = controller;
        this.pendingContainer = container;
        const sequence = ++this.sequence;
        const current = () => !controller.signal.aborted && sequence === this.sequence;
        const detail = { url: url.href, container: selector };
        rememberAssets();
        emit(container, 'start', detail);
        container.setAttribute('aria-busy', 'true');
        try {
            const response = await fetch(url.href, {
                signal: controller.signal, credentials: 'same-origin',
                headers: { 'X-PJAX': 'true', 'X-PJAX-Container': selector, 'X-Requested-With': 'XMLHttpRequest', Accept: 'text/html, application/xhtml+xml' },
            });
            if (!current()) return;
            if (!response.ok) throw new Error('Navigation failed. Please try again.');
            const html = await response.text();
            if (!current()) return;
            const destination = new URL(response.headers.get('X-PJAX-URL') || response.url || url.href, location.href);
            const template = document.createElement('template');
            template.innerHTML = html;
            const configSelector = '[data-dcat-modern-page-config]';
            const currentRenderer = document.querySelector<HTMLScriptElement>(configSelector)?.dataset.dcatR;
            const destinationRenderer = template.content.querySelector<HTMLScriptElement>(configSelector)?.dataset.dcatR;
            const compatRuntime = (window as unknown as { DcatCompat?: unknown }).DcatCompat;
            const runtimeRenderer = window.DcatReact ? '1' : compatRuntime ? '0' : '';
            const currentRendererIsModern = currentRenderer === '0' || currentRenderer === '1';
            const destinationRendererIsModern = destinationRenderer === '0' || destinationRenderer === '1';
            if (
                destination.origin !== location.origin
                || /<html[\s>]/i.test(html)
                || !currentRendererIsModern
                || currentRenderer !== runtimeRenderer
                || !destinationRendererIsModern
                || destinationRenderer !== currentRenderer
            ) {
                location.assign(destination.href);
                return;
            }
            const title = template.content.querySelector('title')?.textContent;
            template.content.querySelector('title')?.remove();
            template.content.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach((node) => {
                if (!styles.has(node.href)) { styles.add(node.href); document.head.appendChild(node); }
                else node.remove();
            });
            // 只有响应确定可替换时才清理旧页面，取消或失败的请求保留用户输入。
            emit(container, 'before-replace', detail);
            host.wait();
            container.replaceChildren(template.content);
            await executePageScripts(container, current);
            if (!current()) return;
            if (options.history !== false) {
                if (!options.replace) history.replaceState({ ...history.state, dcatPjax: { url: location.href, scroll: [scrollX, scrollY] } }, '', location.href);
                history[options.replace ? 'replaceState' : 'pushState']({ ...history.state, dcatPjax: { url: destination.href, scroll: options.scroll || [0, 0] } }, '', destination.href);
            }
            if (title) document.title = title;
            emit(container, 'success', detail);
            emit(container, 'complete', detail);
            host.triggerReady();
            emit(container, 'end', detail);
            window.dispatchEvent(new CustomEvent('dcat:modern:navigation', { detail: { url: destination.href } }));
            requestAnimationFrame(() => {
                if (!current()) return;
                window.scrollTo(...(options.scroll || [0, 0]));
                const focus = container.querySelector<HTMLElement>('h1, [autofocus]');
                if (focus && !options.scroll) { focus.tabIndex = -1; focus.focus({ preventScroll: true }); }
            });
        } catch (error) {
            if (current()) {
                host.wait(false);
                emit(container, 'error', { ...detail, code: 'NAVIGATION_FAILED' });
                emit(container, 'complete', { ...detail, status: 'error' });
                emit(container, 'end', { ...detail, status: 'error' });
                host.error(error instanceof Error ? error.message : 'Navigation failed. Please try again.');
            }
        } finally {
            if (sequence === this.sequence) {
                this.pending = undefined;
                this.pendingContainer = undefined;
                container.removeAttribute('aria-busy');
            }
        }
    }

    status() { return { pendingRequests: this.pending ? 1 : 0, scripts: scripts.size, styles: styles.size }; }

    dispose(): void {
        this.pending?.abort();
        this.pendingContainer?.removeAttribute('aria-busy');
        this.bindings?.abort();
        this.pending = this.bindings = undefined;
        this.pendingContainer = undefined;
    }
}

function hasActiveJQueryPjaxPopstateHandler(): boolean {
    const jquery = window.jQuery;
    if (!jquery) return false;
    const pjax = Reflect.get(jquery, 'pjax');
    return typeof pjax === 'function' && Reflect.get(pjax, '_dcatPopstateHandlerActive') === true;
}

export const navigation = new NativeNavigation();
