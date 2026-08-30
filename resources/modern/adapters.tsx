import { LayoutHeaderView, type LayoutHeaderPayload, LayoutMenuView, type LayoutMenuPayload } from './views/layout';
import { FormView, readFormModel, type FormViewPayload } from './views/form';
import { GridView, readGridModel, type GridViewPayload } from './views/grid';
import { readShowModel, ShowView, type ShowViewPayload } from './views/show';
import { readTreeModel, TreeView, type TreeViewPayload } from './views/tree';
import { readWidgetModel, WidgetView, type WidgetViewPayload } from './views/widget';
import { readSystemModel, SystemView, type SystemViewPayload } from './views/system';
import { directFallback, LegacyNodesIsland, meaningfulNodes } from './dom';
import type { ModernViewModel, MountContext, RegisteredCapability } from './types';

function progressiveEnhancement(className: string) {
    return (element: HTMLElement, context: MountContext) => {
        element.classList.add(className);
        context.telemetry('CAPABILITY_MOUNTED', { capability: context.capability.id });
        return () => element.classList.remove(className);
    };
}

function treeEnhancement(element: HTMLElement, context: MountContext) {
    element.classList.add('dcat-modern-tree');
    const card = element.closest<HTMLElement>('.card');
    card?.classList.add('dcat-modern-tree-card');
    context.telemetry('CAPABILITY_MOUNTED', { capability: context.capability.id });
    return () => {
        element.classList.remove('dcat-modern-tree');
        card?.classList.remove('dcat-modern-tree-card');
    };
}

function gridReadEnhancement(element: HTMLElement, context: MountContext) {
    const table = element.querySelector<HTMLTableElement>('table');
    if (!table) return;
    element.classList.add('dcat-modern-grid');
    const addedScope: HTMLElement[] = [];
    table.querySelectorAll<HTMLElement>('thead th').forEach((header) => {
        if (!header.hasAttribute('scope')) {
            header.setAttribute('scope', 'col');
            addedScope.push(header);
        }
    });
    context.telemetry('CAPABILITY_MOUNTED', { capability: context.capability.id });
    return () => {
        element.classList.remove('dcat-modern-grid');
        addedScope.forEach((header) => header.removeAttribute('scope'));
    };
}

function formEnhancement(element: HTMLElement, context: MountContext) {
    element.classList.add('dcat-modern-form');
    const invalid = Array.from(element.querySelectorAll<HTMLElement>('.has-error input, .has-error select, .has-error textarea'));
    const addedAriaInvalid: HTMLElement[] = [];
    const addedUploaderLabels: HTMLInputElement[] = [];
    const labelUploader = (field: HTMLInputElement) => {
        if (field.hasAttribute('aria-label') || field.hasAttribute('aria-labelledby')) return;
        const label = field.closest('.form-group')?.querySelector<HTMLElement>('.control-label')?.textContent?.trim() || 'File upload';
        field.setAttribute('aria-label', label);
        addedUploaderLabels.push(field);
    };
    invalid.forEach((field) => {
        if (!field.hasAttribute('aria-invalid')) {
            field.setAttribute('aria-invalid', 'true');
            addedAriaInvalid.push(field);
        }
    });
    element.querySelectorAll<HTMLInputElement>('input.webuploader-element-invisible[type="file"]').forEach(labelUploader);
    const uploaderObserver = new MutationObserver((records) => {
        records.forEach((record) => record.addedNodes.forEach((node) => {
            if (!(node instanceof HTMLElement)) return;
            if (node.matches('input.webuploader-element-invisible[type="file"]')) labelUploader(node as HTMLInputElement);
            node.querySelectorAll<HTMLInputElement>('input.webuploader-element-invisible[type="file"]').forEach(labelUploader);
        }));
    });
    uploaderObserver.observe(element, { childList: true, subtree: true });
    context.telemetry('CAPABILITY_MOUNTED', { capability: context.capability.id });
    return () => {
        element.querySelectorAll<HTMLElement>('[data-dcat-modern-legacy-field], [data-dcat-modern-legacy-island^="form-"]').forEach((field) => {
            field.dispatchEvent(new CustomEvent('dcat:modern:form-field-cleanup', { bubbles: true }));
        });
        uploaderObserver.disconnect();
        element.classList.remove('dcat-modern-form');
        addedAriaInvalid.forEach((field) => field.removeAttribute('aria-invalid'));
        addedUploaderLabels.forEach((field) => field.removeAttribute('aria-label'));
    };
}

function conditionalEnhancement(className: string, predicate: (element: HTMLElement) => boolean) {
    return (element: HTMLElement, context: MountContext) => {
        if (!predicate(element)) return;
        element.classList.add(className);
        context.telemetry('CAPABILITY_MOUNTED', { capability: context.capability.id });
        return () => element.classList.remove(className);
    };
}

function keyboardNavigation(element: HTMLElement, context: MountContext) {
    const handler = (event: KeyboardEvent) => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        const links = Array.from(element.querySelectorAll<HTMLElement>('a[href]:not([tabindex="-1"])'))
            .filter((link) => link.offsetParent !== null);
        if (!links.length) return;
        const active = links.indexOf(document.activeElement as HTMLElement);
        if (active < 0) return;
        event.preventDefault();
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        links[(active + direction + links.length) % links.length].focus();
    };
    element.addEventListener('keydown', handler);
    element.classList.add('dcat-modern-navigation');
    context.telemetry('CAPABILITY_MOUNTED', { capability: context.capability.id });
    return () => {
        element.removeEventListener('keydown', handler);
        element.classList.remove('dcat-modern-navigation');
    };
}

function firstViewModel<T>(context: MountContext): ModernViewModel<T> | null {
    const payload = context.payloads[0]?.payload;
    if (!payload || typeof payload !== 'object') return null;
    const candidate = payload as Partial<ModernViewModel<T>>;
    return candidate.schemaVersion && candidate.componentType && Object.prototype.hasOwnProperty.call(candidate, 'data')
        ? candidate as ModernViewModel<T>
        : null;
}

function firstPayload<T>(context: MountContext): T | null {
    const envelope = context.payloads[0];
    if (!envelope) return null;
    const viewModel = firstViewModel<T>(context);
    return viewModel ? viewModel.data : envelope.payload as T;
}

export const coreCapabilities: RegisteredCapability[] = [
    {
        id: 'layout.shell',
        family: 'layout',
        selector: '.content-body#app',
        fallbackScope: 'page',
        mount: progressiveEnhancement('dcat-modern-layout'),
    },
    {
        id: 'layout.navigation',
        family: 'layout',
        selector: '[data-dcat-react-component="layout.navigation"]',
        fallbackScope: 'page',
        source: 'core',
        mount: keyboardNavigation,
    },
    {
        id: 'layout.menu',
        family: 'layout',
        selector: '[data-dcat-react-component="layout.menu"]',
        fallbackScope: 'page',
        source: 'core',
        mount: () => undefined,
        render: ({ context }) => {
            const payload = firstPayload<LayoutMenuPayload>(context);
            if (!payload) throw new Error('Missing layout.menu payload');
            return <LayoutMenuView payload={payload} />;
        },
    },
    {
        id: 'layout.header',
        family: 'layout',
        selector: '[data-dcat-react-component="layout.header"]',
        fallbackScope: 'page',
        source: 'core',
        mount: () => undefined,
        render: ({ context }) => {
            const payload = firstPayload<LayoutHeaderPayload>(context);
            if (!payload) throw new Error('Missing layout.header payload');
            return <LayoutHeaderView payload={payload} />;
        },
    },
    {
        id: 'layout.navbar',
        family: 'layout',
        selector: '[data-dcat-react-component="layout.navbar"]',
        fallbackScope: 'page',
        source: 'core',
        mount: progressiveEnhancement('dcat-modern-navbar'),
    },
    {
        id: 'layout.footer',
        family: 'layout',
        selector: '[data-dcat-react-component="layout.footer"]',
        fallbackScope: 'page',
        source: 'core',
        mount: progressiveEnhancement('dcat-modern-footer'),
    },
    {
        id: 'layout.horizontal',
        family: 'layout',
        selector: '.main-horizontal-sidebar',
        fallbackScope: 'page',
        mount: progressiveEnhancement('dcat-modern-horizontal'),
    },
    {
        id: 'layout.full-page',
        family: 'layout',
        selector: '[data-dcat-react-component="layout.full-page"]',
        fallbackScope: 'page',
        source: 'core',
        mount: progressiveEnhancement('dcat-modern-full-page'),
    },
    {
        id: 'grid.read',
        family: 'grid',
        selector: '[data-dcat-react-component="grid.read"]',
        fallbackScope: 'page',
        source: 'core',
        mount: gridReadEnhancement,
        render: ({ element, context }) => <GridView model={readGridModel(element, firstPayload<GridViewPayload>(context))} />,
    },
    {
        id: 'grid.interactions',
        family: 'grid',
        selector: '[data-dcat-react-component="grid.read"]',
        fallbackScope: 'page',
        mount: conditionalEnhancement('dcat-modern-grid-interactive', (element) => Boolean(
            element.querySelector('form.grid-filter-form, input[class*="grid-row"][type="checkbox"], [class*="grid-select-all-btn"]')
        )),
    },
    {
        id: 'form.basic',
        family: 'form',
        selector: 'form[data-dcat-react-component="form.basic"]',
        fallbackScope: 'page',
        source: 'core',
        mount: formEnhancement,
        render: ({ element, context }) => <FormView model={readFormModel(element, firstPayload<FormViewPayload>(context))} />,
    },
    {
        id: 'form.advanced',
        family: 'form',
        selector: 'form[data-dcat-react-component="form.basic"]',
        fallbackScope: 'component',
        mount: conditionalEnhancement('dcat-modern-form-advanced', (element) => Boolean(
            element.querySelector('[type="file"], .select2, .has-many, .has-many-form, [class*="editor"], [class*="web-uploader"]')
        )),
    },
    {
        id: 'show.detail',
        family: 'show',
        selector: '[data-dcat-react-component="show.detail"]',
        fallbackScope: 'page',
        source: 'core',
        mount: progressiveEnhancement('dcat-modern-show'),
        render: ({ element, context }) => <ShowView model={readShowModel(element, firstPayload<ShowViewPayload>(context))} />,
    },
    {
        id: 'tree.page',
        family: 'tree',
        selector: '[data-dcat-react-component="tree.page"]',
        fallbackScope: 'page',
        source: 'core',
        mount: treeEnhancement,
        render: ({ element, context }) => <TreeView model={readTreeModel(element, firstPayload<TreeViewPayload>(context))} />,
    },
    {
        id: 'widget.surface',
        family: 'widget',
        selector: '[data-dcat-react-component="widget.surface"]',
        fallbackScope: 'component',
        source: 'core',
        mount: progressiveEnhancement('dcat-modern-widget'),
        render: ({ element, context }) => {
            const payload = firstPayload<WidgetViewPayload>(context);
            return payload ? <WidgetView model={readWidgetModel(element, payload)} /> : null;
        },
    },
    {
        id: 'system.page',
        family: 'system',
        selector: '[data-dcat-react-component="system.page"]',
        fallbackScope: 'route',
        source: 'core',
        mount: progressiveEnhancement('dcat-modern-system'),
        render: ({ element, context }) => <SystemView model={readSystemModel(element, firstPayload<SystemViewPayload>(context))} />,
    },
    {
        id: 'extension.island',
        family: 'extension',
        selector: '[data-dcat-modern-extension="1"]',
        fallbackScope: 'component',
        mount: progressiveEnhancement('dcat-modern-extension-island'),
    },
];

