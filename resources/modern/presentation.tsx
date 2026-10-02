import React, { type HTMLAttributes, type ReactNode, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import type { ButtonProps as AriaButtonProps, SwitchProps } from 'react-aria-components';
import { DialogTrigger, Dialog } from 'react-aria-components';
import { Button as UiButton } from './ui/components/base/buttons/button';
import { Toggle } from './ui/components/base/toggle/toggle';
import { Dropdown } from './ui/components/base/dropdown/dropdown';
import { Tooltip as UiTooltip, TooltipTrigger } from './ui/components/base/tooltip/tooltip';
import { Popover as UiPopover } from './ui/components/base/select/popover';
import { Tabs as UiTabs } from './ui/components/application/tabs/tabs';
import { TableCard } from './ui/components/application/table/table';
import { LoadingIndicator } from './ui/components/application/loading-indicator/loading-indicator';
import { ModalOverlay, Modal as UiModal, Dialog as UiDialog } from './ui/components/application/modals/modal';
import { ModalOverlay as DrawerOverlay, Modal as UiDrawer, Dialog as DrawerDialog } from './ui/components/application/slideout-menus/slideout-menu';
import { Choice } from './controls';
import { EmptyState as UiEmptyState } from './ui/components/application/empty-state/empty-state';
import { overlayStore } from './store';
export { Input, Textarea } from './controls';

export interface ButtonProps extends Omit<AriaButtonProps, 'children' | 'className'> {
    title?: string;
    tone?: 'primary' | 'secondary' | 'tertiary' | 'danger';
    loading?: boolean;
    disabled?: boolean;
    className?: string;
    children?: ReactNode;
}

export function Button({ tone = 'secondary', loading = false, disabled, children, className, title, ...props }: ButtonProps) {
    const button = <UiButton {...props} color={tone === 'danger' ? 'primary-destructive' : tone} isLoading={loading} isDisabled={disabled}
        aria-busy={loading || undefined} data-pending={loading || undefined} className={`dcat-modern-button ${className ?? ''}`}>
        {children}
    </UiButton>;
    // React Aria 不转发原生 title，保留已有工具按钮的提示契约。
    return title ? <span className="contents" ref={(node) => node?.querySelector('button')?.setAttribute('title', title)}>{button}</span> : button;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
    return <TableCard.Root {...props} className={`dcat-modern-card ${className ?? ''}`} />;
}

export function Panel({ className, ...props }: HTMLAttributes<HTMLElement>) {
    return <TableCard.Root {...props} className={`dcat-modern-panel ${className ?? ''}`} />;
}

export function Checkbox({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
    return <Choice {...props} label={label} />;
}

export function Switch({ label, disabled, className, ...props }: Omit<SwitchProps, 'children' | 'className'> & { label: ReactNode; disabled?: boolean; className?: string }) {
    return <Toggle {...props} label={typeof label === 'string' ? label : undefined} aria-label={typeof label === 'string' ? label : props['aria-label']} isDisabled={disabled} className={`dcat-modern-switch ${className ?? ''}`} />;
}

interface TabItem {
    id: string;
    tabId?: string;
    panelId?: string;
    panelClassName?: string;
    label: ReactNode;
    panel: ReactNode;
    disabled?: boolean;
}

export function Tabs({ items, defaultId, onChange }: { items: TabItem[]; defaultId?: string; onChange?: (id: string) => void }) {
    const first = items.find((item) => item.id === defaultId && !item.disabled) ?? items.find((item) => !item.disabled);
    const [active, setActive] = useState(first?.id ?? '');
    const tabRoot = React.useRef<HTMLDivElement>(null);
    React.useLayoutEffect(() => {
        const root = tabRoot.current;
        if (!root) return;
        const restore = () => {
            root.querySelectorAll<HTMLElement>('[role="tab"]').forEach((node, index) => {
                const item = items[index];
                if (!item) return;
                node.id = item.tabId ?? `${item.id}-tab`;
                node.setAttribute('aria-controls', item.panelId ?? `${item.id}-panel`);
            });
        };
        restore();
        const observer = new MutationObserver(restore);
        observer.observe(root, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, [items, active]);
    return <UiTabs ref={tabRoot} selectedKey={active} onSelectionChange={(key) => { setActive(String(key)); onChange?.(String(key)); }} keyboardActivation="automatic" className="dcat-modern-tabs">
        <UiTabs.List type="underline" aria-label="Tabs">
            {items.map((item) => <UiTabs.Item key={item.id} id={item.id} isDisabled={item.disabled}>{item.label}</UiTabs.Item>)}
        </UiTabs.List>
        {items.map((item) => <UiTabs.Panel key={item.id} id={item.id} shouldForceMount className={`${item.panelClassName ?? ''} ${active === item.id ? 'active' : 'hidden'}`} ref={(node) => {
            if (!node) return;
            node.id = item.panelId ?? `${item.id}-panel`;
            node.setAttribute('aria-labelledby', item.tabId ?? `${item.id}-tab`);
            node.hidden = active !== item.id;
        }}>{item.panel}</UiTabs.Panel>)}
    </UiTabs>;
}

export const MenuItem = Dropdown.Item;

export function DropdownMenu({ label, children }: { label: ReactNode; children: ReactNode }) {
    return <Dropdown.Root><Button tone="tertiary" aria-haspopup="menu">{label}</Button><Dropdown.Popover className="z-[1055]" placement="bottom start"><Dropdown.Menu autoFocus="first">{children}</Dropdown.Menu></Dropdown.Popover></Dropdown.Root>;
}

export function Popover({ label, children }: { label: ReactNode; children: ReactNode }) {
    return <DialogTrigger><Button tone="tertiary" aria-haspopup="dialog">{label}</Button><UiPopover size="md" className="z-[1055] min-w-48 p-4" containerPadding={8}><Dialog aria-label={typeof label === 'string' ? label : 'Details'}>{children}</Dialog></UiPopover></DialogTrigger>;
}

export function Tooltip({ label, children }: { label: ReactNode; children: ReactNode }) {
    return <UiTooltip title={label}><TooltipTrigger>{children}</TooltipTrigger></UiTooltip>;
}

const alertStyles = {
    neutral: 'bg-secondary text-secondary ring-secondary',
    danger: 'bg-error-primary text-error-primary ring-error',
    warning: 'bg-warning-primary text-warning-primary ring-warning',
    success: 'bg-success-primary text-success-primary ring-success',
};

// OSS 没有独立 Alert/Toast 组件，语义容器使用同一上游主题与 Button。
export function Alert({ children, tone = 'neutral', className, ...props }: HTMLAttributes<HTMLDivElement> & { tone?: keyof typeof alertStyles }) {
    return <div {...props} className={`dcat-modern-alert rounded-lg p-4 ring-1 ring-inset ${alertStyles[tone]} ${className ?? ''}`} role={tone === 'danger' ? 'alert' : 'status'}>{children}</div>;
}

export function ErrorState({ title = 'Unable to load', description, action }: { title?: string; description?: string; action?: ReactNode }) {
    return <Alert tone="danger"><strong>{title}</strong>{description ? <p>{description}</p> : null}{action}</Alert>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
    return <UiEmptyState size="sm" role="status" className="py-6"><UiEmptyState.Title>{title}</UiEmptyState.Title>
        {description ? <UiEmptyState.Description>{description}</UiEmptyState.Description> : null}
        {action ? <UiEmptyState.Footer>{action}</UiEmptyState.Footer> : null}
    </UiEmptyState>;
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
    return <div role="status" aria-live="polite"><LoadingIndicator label={label} size="sm" /></div>;
}

export function Modal() {
    const { dialog } = useSyncExternalStore(overlayStore.subscribe, overlayStore.snapshot, overlayStore.snapshot);
    if (!dialog) return null;
    return <ModalOverlay isOpen onOpenChange={(open) => { if (!open) overlayStore.resolveDialog(false); }} className="dcat-modern-overlay z-[1055]">
        <UiModal className="dcat-modern-modal max-w-lg"><UiDialog aria-labelledby={`${dialog.id}-title`}>
            <div className="p-6"><h2 id={`${dialog.id}-title`} className="text-lg font-semibold text-primary">{dialog.title}</h2>
                {dialog.body ? <div className="dcat-modern-modal__body mt-4 text-md text-secondary">{dialog.body}</div> : null}
                <div className="dcat-modern-modal__actions mt-6 flex justify-end gap-3">
                    <Button tone="tertiary" onPress={() => overlayStore.resolveDialog(false)}>{dialog.cancelLabel ?? 'Cancel'}</Button>
                    <Button tone={dialog.danger ? 'danger' : 'primary'} onPress={() => overlayStore.resolveDialog(true)}>{dialog.confirmLabel ?? 'Confirm'}</Button>
                </div>
            </div>
        </UiDialog></UiModal>
    </ModalOverlay>;
}

export function Drawer() {
    const { drawer } = useSyncExternalStore(overlayStore.subscribe, overlayStore.snapshot, overlayStore.snapshot);
    if (!drawer) return null;
    return <DrawerOverlay isOpen isDismissable onOpenChange={(open) => { if (!open) overlayStore.closeDrawer(drawer.id); }} className="dcat-modern-overlay--drawer z-[1055]">
        <UiDrawer className="dcat-modern-drawer"><DrawerDialog aria-label={drawer.title} aria-labelledby={`${drawer.id}-title`}>
            <header className="flex w-full items-center justify-between gap-3 p-6"><h2 id={`${drawer.id}-title`} className="text-lg font-semibold text-primary">{drawer.title}</h2>
                <Button tone="tertiary" onPress={() => overlayStore.closeDrawer(drawer.id)}>{drawer.closeLabel ?? 'Close'}</Button>
            </header>
            <div className="dcat-modern-drawer__body w-full px-6 pb-6">{drawer.body}</div>
        </DrawerDialog></UiDrawer>
    </DrawerOverlay>;
}

export function ToastRegion() {
    const { notices } = useSyncExternalStore(overlayStore.subscribe, overlayStore.snapshot, overlayStore.snapshot);
    if (!notices.length) return null;
    return createPortal(<div className="dcat-modern-toasts fixed right-4 top-4 z-[1060] flex max-w-sm flex-col gap-3" role="region" aria-label="Notifications" aria-live="polite">
        {notices.map((notice) => <Alert key={notice.id} tone={notice.tone} className="flex items-center justify-between gap-4 shadow-lg">
            <span>{notice.message}</span><Button tone="tertiary" aria-label="Dismiss notification" onPress={() => overlayStore.dismissNotice(notice.id)}>×</Button>
        </Alert>)}
    </div>, document.body);
}

export function OverlayHost() {
    return <><ToastRegion /><Modal /><Drawer /></>;
}

export function CapabilityHost({ capability }: { capability: string }) {
    return <span className="dcat-modern-capability-host" data-capability={capability} aria-hidden="true" />;
}
