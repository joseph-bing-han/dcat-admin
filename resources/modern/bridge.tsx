import { DOMElement } from './platform';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CapabilityHost, OverlayHost } from './presentation';
import { overlayStore } from './store';
import type {
    CapabilityDefinition,
    DcatReactApi,
    ModernConfig,
    MountContext,
    PayloadEnvelope,
    ReactCapabilityRegistration,
    RegisteredCapability,
} from './types';

interface MountedRoot {
    capabilityId: string;
    element: HTMLElement;
    cleanup?: () => void;
    host: HTMLElement;
    reactRoot: Root;
    reactView: boolean;
    reactReady: boolean;
    fallback?: HTMLElement;
    fallbackDetached: boolean;
}

interface ReactViewBoundaryProps {
    children: React.ReactNode;
    onCommit: () => void;
    onError: (error: unknown) => void;
}

class ReactViewBoundary extends React.Component<ReactViewBoundaryProps, { failed: boolean }> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error: unknown) {
        this.props.onError(error);
    }

    render() {
        if (this.state.failed) return null;
        return (
            <>
                {this.props.children}
                <CommitSignal onCommit={this.props.onCommit} />
            </>
        );
    }
}

function CommitSignal({ onCommit }: { onCommit: () => void }) {
    React.useLayoutEffect(() => {
        onCommit();
    }, [onCommit]);
    return null;
}

function registerReact(capability: ReactCapabilityRegistration): void {
    registerCapability({
        ...capability,
        mount: () => undefined,
        render: capability.render,
    }, 'extension');
}

const BRIDGE_VERSION = '1.0.0';
const registry = new Map<string, RegisteredCapability>();
const mounted = new Map<HTMLElement, Map<string, MountedRoot>>();
let started = false;
let overlayElement: HTMLElement | null = null;
let overlayRoot: Root | null = null;

function readConfig(): ModernConfig {
    const node = document.querySelector('[data-dcat-modern-page-config]') || document.getElementById('dcat-modern-config');
    if (!node?.textContent) {
        return {
            bridgeVersion: BRIDGE_VERSION,
            payloadVersion: '1.1.0',
            telemetry: true,
        };
    }
    try {
        return JSON.parse(node.textContent) as ModernConfig;
    } catch {
        return {
            bridgeVersion: BRIDGE_VERSION,
            payloadVersion: '1.1.0',
            telemetry: true,
        };
    }
}

let config = readConfig();

function major(version: string): string {
    return String(version || '').split('.')[0];
}

function telemetry(code: string, details: Record<string, unknown> = {}): void {
    if (!config.telemetry) return;
    window.dispatchEvent(new CustomEvent('dcat:modern:telemetry', { detail: { code, ...details } }));
}

function payloadEntries(): Array<{ node: HTMLScriptElement; envelope: PayloadEnvelope }> {
    const result: Array<{ node: HTMLScriptElement; envelope: PayloadEnvelope }> = [];
    document.querySelectorAll<HTMLScriptElement>('script[data-dcat-modern-payload]').forEach((node) => {
        try {
            const envelope = JSON.parse(node.textContent || '') as PayloadEnvelope;
            if (major(envelope.version) !== major(config.payloadVersion)) {
                telemetry('PAYLOAD_MAJOR_MISMATCH', { capability: envelope.capability, version: envelope.version });
                return;
            }
            result.push({ node, envelope });
        } catch {
            telemetry('PAYLOAD_INVALID_JSON');
        }
    });
    return result;
}

function payloadsForElement(capability: CapabilityDefinition, element: HTMLElement): PayloadEnvelope[] {
    const entries = payloadEntries().filter(({ envelope }) => envelope.capability === capability.id);
    const adjacent = entries.find(({ node }) => node.previousElementSibling === element);
    return adjacent ? [adjacent.envelope] : entries.map(({ envelope }) => envelope);
}

function makeContext(capability: CapabilityDefinition, element: HTMLElement): MountContext {
    return {
        config,
        capability,
        payloads: payloadsForElement(capability, element),
        notify: (message, tone) => overlayStore.notify(message, tone),
        telemetry,
    };
}

function ensureOverlay(): void {
    if (overlayRoot) return;
    overlayElement = document.createElement('div');
    overlayElement.id = 'dcat-modern-overlay-root';
    overlayElement.setAttribute('data-dcat-modern-managed', 'overlay');
    document.body.appendChild(overlayElement);
    overlayRoot = createRoot(overlayElement);
    overlayRoot.render(<OverlayHost />);
}

function fallback(code: string): void {
    // 旧版 UI 已删除：降级路径是服务端已渲染的新版 Blade 结构，不能跳转到另一个渲染器。
    telemetry(code);
    overlayStore.notify('Modern view failed to start. The page is showing its server-rendered fallback.', 'danger', 0);
}

function registerCapability(capability: RegisteredCapability, source: 'core' | 'extension'): void {
    if (!capability.id || !capability.selector || typeof capability.mount !== 'function') {
        throw new Error('Invalid DcatReact capability registration');
    }
    if (registry.has(capability.id)) {
        throw new Error(`DcatReact capability is already registered: ${capability.id}`);
    }
    if (source === 'extension' && (capability.family !== 'extension' || !capability.id.startsWith('extension.'))) {
        throw new Error('DcatReact extension capabilities must use family "extension" and the extension.* namespace');
    }
    registry.set(capability.id, { ...capability, source });
    if (started) mount(document);
}

function register(capability: CapabilityDefinition): void {
    registerCapability(capability, 'extension');
}

export function registerCoreCapability(capability: RegisteredCapability): void {
    registerCapability(capability, 'core');
}

function unregister(capabilityId: string): void {
    const capability = registry.get(capabilityId);
    if (capability?.source === 'core') {
        throw new Error(`DcatReact core capability cannot be unregistered by extensions: ${capabilityId}`);
    }
    Array.from(mounted.entries()).forEach(([element, capabilities]) => {
        if (capabilities.has(capabilityId)) unmountElement(element, capabilityId);
    });
    registry.delete(capabilityId);
}

function canMount(capabilityId: string, element: HTMLElement): boolean {
    const capability = registry.get(capabilityId);
    return Boolean(capability && element.matches(capability.selector));
}

function mountElement(capability: RegisteredCapability, element: HTMLElement): void {
    if (mounted.get(element)?.has(capability.id)) return;
    const host = document.createElement(capability.render ? 'div' : 'span');
    host.className = capability.render ? 'dcat-modern-react-view' : 'dcat-modern-react-host';
    host.setAttribute('data-dcat-modern-managed', capability.id);
    if (!capability.render) host.setAttribute('aria-hidden', 'true');
    element.appendChild(host);
    const reactRoot = createRoot(host);
    let cleanup: void | (() => void) = undefined;
    const fallbackElement = capability.render
        ? Array.from(element.children).find((child): child is HTMLElement => child instanceof HTMLElement && child.hasAttribute('data-dcat-modern-fallback'))
        : undefined;

    try {
        element.classList.add('dcat-modern-scope');
        element.setAttribute('data-dcat-modern-capability', capability.id);
        const context = makeContext(capability, element);
        const rendered = capability.render ? capability.render({ element, context }) : null;
        cleanup = capability.mount(element, context);
        const capabilities = mounted.get(element) ?? new Map<string, MountedRoot>();
        const item: MountedRoot = {
            capabilityId: capability.id,
            element,
            cleanup: typeof cleanup === 'function' ? cleanup : undefined,
            host,
            reactRoot,
            reactView: Boolean(capability.render),
            reactReady: false,
            fallback: fallbackElement,
            fallbackDetached: false,
        };
        capabilities.set(capability.id, item);
        mounted.set(element, capabilities);
        syncMountedAttributes(element, capabilities);

        if (capability.render) {
            reactRoot.render(
                <ReactViewBoundary
                    onCommit={() => {
                        item.reactReady = true;
                        const current = mounted.get(element);
                        if (current?.get(capability.id) === item) {
                            syncMountedAttributes(element, current);
                            Promise.resolve().then(() => {
                                const latest = mounted.get(element);
                                if (latest?.get(capability.id) !== item || !item.reactReady || !item.fallback) return;
                                if (item.fallback.parentNode === element) {
                                    item.fallback.remove();
                                    item.fallbackDetached = true;
                                }
                            });
                        }
                    }}
                    onError={() => {
                        item.reactReady = false;
                        const current = mounted.get(element);
                        if (current?.get(capability.id) === item) {
                            if (item.fallbackDetached && item.fallback) {
                                element.insertBefore(item.fallback, item.host);
                                item.fallbackDetached = false;
                            }
                            syncMountedAttributes(element, current);
                        }
                        telemetry('CAPABILITY_RENDER_FAILED', { capability: capability.id });
                        if (capability.fallbackScope !== 'component') fallback('CAPABILITY_PAGE_FALLBACK');
                    }}
                >
                    {rendered}
                </ReactViewBoundary>,
            );
        } else {
            reactRoot.render(<CapabilityHost capability={capability.id} />);
        }
    } catch {
        const capabilities = mounted.get(element);
        if (capabilities?.has(capability.id)) {
            capabilities.delete(capability.id);
            if (capabilities.size) {
                syncMountedAttributes(element, capabilities);
            } else {
                mounted.delete(element);
            }
        }
        if (typeof cleanup === 'function') cleanup();
        reactRoot.unmount();
        host.remove();
        if (!mounted.has(element)) {
            element.classList.remove('dcat-modern-scope');
            element.removeAttribute('data-dcat-modern-capability');
            element.removeAttribute('data-dcat-modern-react-mounted');
        }
        telemetry('CAPABILITY_MOUNT_FAILED', { capability: capability.id });
        if (capability.fallbackScope !== 'component') fallback('CAPABILITY_PAGE_FALLBACK');
    }
}

function mount(root: ParentNode = document): void {
    config = readConfig();
    if (config.enabled === false || !document.querySelector('[data-dcat-modern-request="1"]')) {
        document.body.classList.remove('dcat-modern-request-enabled');
        document.body.classList.remove('dcat-modern-active');
        return;
    }
    document.body.classList.add('dcat-modern-active');
    document.body.classList.add('dcat-modern-request-enabled');
    ensureOverlay();
    registry.forEach((capability) => {
        const nodes: HTMLElement[] = [];
        if (root instanceof HTMLElement && root.matches(capability.selector)) nodes.push(root);
        root.querySelectorAll<HTMLElement>(capability.selector).forEach((node) => nodes.push(node));
        nodes.forEach((node) => mountElement(capability, node));
    });
}

function unmountElement(element: HTMLElement, capabilityId?: string): void {
    const capabilities = mounted.get(element);
    if (!capabilities) return;
    const ids = capabilityId ? [capabilityId] : Array.from(capabilities.keys());
    ids.forEach((id) => {
        const item = capabilities.get(id);
        if (!item) return;
        try {
            item.cleanup?.();
        } finally {
            item.reactRoot.unmount();
            if (item.fallbackDetached && item.fallback) {
                element.insertBefore(item.fallback, item.host);
                item.fallbackDetached = false;
            }
            item.host.remove();
            capabilities.delete(id);
        }
    });
    if (capabilities.size === 0) {
        element.classList.remove('dcat-modern-scope');
        element.removeAttribute('data-dcat-modern-capability');
        element.removeAttribute('data-dcat-modern-react-mounted');
        mounted.delete(element);
    } else {
        syncMountedAttributes(element, capabilities);
    }
}

function syncMountedAttributes(element: HTMLElement, capabilities: Map<string, MountedRoot>): void {
    element.setAttribute('data-dcat-modern-capability', Array.from(capabilities.keys()).join(' '));
    const reactViews = Array.from(capabilities.values())
        .filter((item) => item.reactView && item.reactReady)
        .map((item) => item.capabilityId);
    if (reactViews.length) {
        element.setAttribute('data-dcat-modern-react-mounted', reactViews.join(' '));
    } else {
        element.removeAttribute('data-dcat-modern-react-mounted');
    }
}

function unmount(root: ParentNode = document): void {
    Array.from(mounted.keys()).forEach((element) => {
        if (root === document || root === element || (root instanceof DOMElement && root.contains(element))) {
            unmountElement(element);
        }
    });
    overlayStore.reset();
    // 局部卸载（如 PJAX 换页）仍保留外壳，不能让全局样式在新页面挂载前失效。
    if (root === document || root === document.body || root === document.documentElement) {
        document.body.classList.remove('dcat-modern-request-enabled');
        document.body.classList.remove('dcat-modern-active');
    }
}

function beforeNavigation(event: Event): void {
    const selector = (event as CustomEvent<{ container?: string }>).detail?.container;
    const container = event.target instanceof HTMLElement ? event.target : selector ? document.querySelector(selector) : null;
    unmount(container || document);
}

function afterNavigation(): void {
    mount(document);
}

function bindNavigationLifecycle(): void {
    document.removeEventListener('dcat:pjax:before-replace', beforeNavigation);
    document.removeEventListener('dcat:pjax:loaded', afterNavigation);
    document.addEventListener('dcat:pjax:before-replace', beforeNavigation);
    document.addEventListener('dcat:pjax:loaded', afterNavigation);
}

function unbindNavigationLifecycle(): void {
    document.removeEventListener('dcat:pjax:before-replace', beforeNavigation);
    document.removeEventListener('dcat:pjax:loaded', afterNavigation);
}

function start(): void {
    if (started) return;
    if (major(config.bridgeVersion) !== major(BRIDGE_VERSION)) {
        fallback('BRIDGE_MAJOR_MISMATCH');
        return;
    }
    started = true;
    bindNavigationLifecycle();
    mount(document);
    telemetry('BRIDGE_STARTED', { version: BRIDGE_VERSION });
}

function stop(): void {
    if (!started) return;
    unmount(document);
    unbindNavigationLifecycle();
    overlayRoot?.unmount();
    overlayRoot = null;
    overlayElement?.remove();
    overlayElement = null;
    document.body.classList.remove('dcat-modern-active');
    document.body.classList.remove('dcat-modern-request-enabled');
    started = false;
}

export const bridge: DcatReactApi = {
    version: BRIDGE_VERSION,
    register,
    registerReact,
    unregister,
    createElement: React.createElement,
    canMount,
    mount,
    unmount,
    start,
    stop,
    notify: (message, tone = 'neutral', timeout = 4500) => overlayStore.notify(message, tone, timeout),
    confirm: (options) => overlayStore.confirm(options),
    openDrawer: (options) => overlayStore.openDrawer(options),
    closeDrawer: (id) => overlayStore.closeDrawer(id),
    fallback,
    status: () => ({
        started,
        capabilities: Array.from(registry.keys()),
        mountedRoots: Array.from(mounted.values()).reduce((count, capabilities) => count + capabilities.size, 0),
    }),
};
