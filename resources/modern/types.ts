import type { ReactNode, createElement as ReactCreateElement } from 'react';

export type CapabilityFamily =
    | 'layout'
    | 'grid'
    | 'form'
    | 'show'
    | 'tree'
    | 'widget'
    | 'system'
    | 'extension';

export type Cleanup = () => void;

export interface ModernConfig {
    enabled?: boolean;
    bridgeVersion: string;
    payloadVersion: string;
    telemetry: boolean;
}

export interface PayloadEnvelope<T = unknown> {
    version: string;
    capability: string;
    payload: T;
}

export interface ModernViewModel<T = unknown> {
    schemaVersion: string;
    family: CapabilityFamily;
    componentType: string;
    componentId: string;
    status: string;
    permissions: string[];
    requiredBridgeCapabilities: string[];
    knownTypes: string[];
    renderer: {
        candidate: 'native' | 'compat';
        fallbackScope: 'component' | 'page' | 'route' | 'global';
        reason: string | null;
    };
    resources: {
        core: string[];
        compat: string[];
        aliases: string[];
    };
    compatRequirements: {
        bootstrapCss: string[];
        bootstrapPlugins: string[];
        jquery: boolean;
        pluginAdapters: string[];
        customSlots: boolean;
        bladeOverride: boolean;
    };
    customContent: {
        bladeOverride: boolean;
        renderable: boolean;
        sections: boolean;
    };
    slots: Array<Record<string, unknown>>;
    data: T;
}

export interface MountContext {
    config: ModernConfig;
    capability: CapabilityDefinition;
    payloads: PayloadEnvelope[];
    notify: (message: string, tone?: NoticeTone) => void;
    telemetry: (code: string, details?: Record<string, unknown>) => void;
}

export interface CapabilityDefinition {
    id: string;
    family: CapabilityFamily;
    selector: string;
    fallbackScope: 'component' | 'page' | 'route' | 'global';
    mount: (element: HTMLElement, context: MountContext) => void | Cleanup;
}

export interface RegisteredCapability extends CapabilityDefinition {
    source?: 'core' | 'extension';
    render?: (props: ReactCapabilityProps) => ReactNode;
}

export interface ReactCapabilityProps {
    element: HTMLElement;
    context: MountContext;
}

export interface ReactCapabilityRegistration {
    id: string;
    family: CapabilityFamily;
    selector: string;
    fallbackScope: 'component' | 'page' | 'route' | 'global';
    render: (props: ReactCapabilityProps) => ReactNode;
}

export type NoticeTone = 'neutral' | 'success' | 'warning' | 'danger';

export interface Notice {
    id: string;
    message: string;
    tone: NoticeTone;
    timeout: number;
}

export interface DialogRequest {
    id: string;
    title: string;
    body?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    resolve: (value: boolean) => void;
}

export interface DrawerRequest {
    id: string;
    title: string;
    body: ReactNode;
    closeLabel?: string;
}

export interface DcatReactApi {
    version: string;
    register: (capability: CapabilityDefinition) => void;
    registerReact: (capability: ReactCapabilityRegistration) => void;
    unregister: (capabilityId: string) => void;
    createElement: typeof ReactCreateElement;
    canMount: (capabilityId: string, element: HTMLElement) => boolean;
    mount: (root?: ParentNode) => void;
    unmount: (root?: ParentNode) => void;
    start: () => void;
    stop: () => void;
    notify: (message: string, tone?: NoticeTone, timeout?: number) => void;
    confirm: (options: Omit<DialogRequest, 'id' | 'resolve'>) => Promise<boolean>;
    openDrawer: (options: Omit<DrawerRequest, 'id'>) => string;
    closeDrawer: (id?: string) => void;
    fallback: (code: string) => void;
    status: () => {
        started: boolean;
        capabilities: string[];
        mountedRoots: number;
    };
}

declare global {
    interface Window {
        DcatReact?: DcatReactApi;
        jQuery?: JQueryStatic;
        $?: JQueryStatic;
    }

    interface JQueryStatic {
        (target: Document | Element | string): JQueryLike;
    }

    interface JQueryLike {
        on(events: string, handler: (...args: unknown[]) => void): JQueryLike;
        off(events: string): JQueryLike;
    }
}

