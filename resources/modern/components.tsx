import React, {
    type AnchorHTMLAttributes,
    type ButtonHTMLAttributes,
    type CSSProperties,
    type HTMLAttributes,
    type InputHTMLAttributes,
    type ReactNode,
    type SelectHTMLAttributes,
    type TextareaHTMLAttributes,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import type { ButtonProps as AriaButtonProps } from 'react-aria-components/Button';
import type { SwitchProps as AriaSwitchProps } from 'react-aria-components/Switch';
import { useSwitch } from 'react-aria/useSwitch';
import { useButton } from 'react-aria/useButton';
import { useHover } from 'react-aria/useHover';
import { useFocusRing } from 'react-aria/useFocusRing';
import { mergeProps } from 'react-aria/mergeProps';
import { useToggleState } from 'react-stately/useToggleState';
import { overlayStore } from './store';

export type ButtonTone = 'primary' | 'secondary' | 'tertiary' | 'danger';

interface FloatingRect {
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}

export function computeFloatingPosition(
    anchor: FloatingRect,
    panel: Pick<FloatingRect, 'width' | 'height'>,
    viewport: { width: number; height: number },
    gap = 6,
    margin = 8,
) {
    const fitsBelow = anchor.bottom + gap + panel.height <= viewport.height - margin;
    const fitsAbove = anchor.top - gap - panel.height >= margin;
    const placement = !fitsBelow && fitsAbove ? 'top' : 'bottom';
    let top = placement === 'top' ? anchor.top - gap - panel.height : anchor.bottom + gap;
    let left = anchor.left;

    if (left + panel.width > viewport.width - margin) {
        left = viewport.width - margin - panel.width;
    }
    left = Math.max(margin, left);
    top = Math.max(margin, Math.min(top, viewport.height - margin - panel.height));

    return { top, left, placement } as const;
}

function useFloatingPanel(open: boolean, gap = 6) {
    const anchor = useRef<HTMLElement | null>(null);
    const panel = useRef<HTMLElement | null>(null);
    const [style, setStyle] = useState<CSSProperties>({ position: 'fixed', visibility: 'hidden' });
    const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');

    useLayoutEffect(() => {
        if (!open || !anchor.current || !panel.current) return;

        const update = () => {
            if (!anchor.current || !panel.current) return;
            const anchorRect = anchor.current.getBoundingClientRect();
            const panelRect = panel.current.getBoundingClientRect();
            const position = computeFloatingPosition(anchorRect, panelRect, {
                width: document.documentElement.clientWidth || window.innerWidth,
                height: document.documentElement.clientHeight || window.innerHeight,
            }, gap);
            setPlacement(position.placement);
            setStyle({ position: 'fixed', top: position.top, left: position.left, visibility: 'visible' });
        };

        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [open, gap]);

    return {
        anchorRef: (node: HTMLElement | null) => { anchor.current = node; },
        panelRef: (node: HTMLElement | null) => { panel.current = node; },
        style,
        placement,
    };
}

export interface ButtonProps extends Omit<AriaButtonProps, 'children' | 'className' | 'isDisabled' | 'isPending'> {
    tone?: ButtonTone;
    loading?: boolean;
    disabled?: boolean;
    className?: string;
    children?: ReactNode;
}

export function Table({ children, ...props }: HTMLAttributes<HTMLTableElement>) {
    return <div className="dcat-modern-table-wrap"><table {...props} className={`dcat-modern-table ${props.className ?? ''}`.trim()}>{children}</table></div>;
}

export function Pagination({ current, pages, onChange }: { current: number; pages: number[]; onChange: (page: number) => void }) {
    return (
        <nav className="dcat-modern-pagination" aria-label="Pagination">
            <Button tone="tertiary" disabled={current <= 1} onPress={() => onChange(current - 1)}>Previous</Button>
            <ol>
                {pages.map((page) => (
                    <li key={page}>
                        <button type="button" aria-current={page === current ? 'page' : undefined} onClick={() => onChange(page)}>{page}</button>
                    </li>
                ))}
            </ol>
            <Button tone="tertiary" disabled={current >= Math.max(...pages)} onPress={() => onChange(current + 1)}>Next</Button>
        </nav>
    );
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
    const firstEnabled = items.find((item) => !item.disabled)?.id ?? '';
    const requestedDefault = items.find((item) => item.id === defaultId && !item.disabled)?.id;
    const [active, setActive] = useState(requestedDefault ?? firstEnabled);
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const activate = (id: string) => {
        setActive(id);
        onChange?.(id);
    };

    const move = (current: string, direction: number) => {
        const enabled = items.filter((item) => !item.disabled);
        const index = enabled.findIndex((item) => item.id === current);
        if (index < 0 || enabled.length === 0) return;
        const next = enabled[(index + direction + enabled.length) % enabled.length];
        activate(next.id);
        tabRefs.current[next.id]?.focus();
    };

    return (
        <div className="dcat-modern-tabs">
            <div role="tablist" aria-label="Tabs">
                {items.map((item) => (
                    <button
                        key={item.id}
                        ref={(node) => { tabRefs.current[item.id] = node; }}
                        id={item.tabId ?? `${item.id}-tab`}
                        type="button"
                        role="tab"
                        aria-selected={active === item.id}
                        aria-controls={item.panelId ?? `${item.id}-panel`}
                        tabIndex={active === item.id ? 0 : -1}
                        disabled={item.disabled}
                        onClick={() => activate(item.id)}
                        onKeyDown={(event) => {
                            if (event.key === 'ArrowRight') { event.preventDefault(); move(item.id, 1); }
                            if (event.key === 'ArrowLeft') { event.preventDefault(); move(item.id, -1); }
                        }}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            {items.map((item) => (
                <section
                    key={item.id}
                    id={item.panelId ?? `${item.id}-panel`}
                    role="tabpanel"
                    aria-labelledby={item.tabId ?? `${item.id}-tab`}
                    className={[item.panelClassName, active === item.id ? 'active' : ''].filter(Boolean).join(' ') || undefined}
                    hidden={active !== item.id}
                    tabIndex={0}
                >
                    {item.panel}
                </section>
            ))}
        </div>
    );
}

export function DropdownMenu({ label, children }: { label: ReactNode; children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const id = useId();
    const container = useRef<HTMLDivElement>(null);
    const floating = useFloatingPanel(open);

    const focusTrigger = () => container.current?.querySelector<HTMLElement>('.dcat-modern-button')?.focus();

    useEffect(() => {
        if (!open) return;
        const close = (event: MouseEvent) => {
            if (container.current && !container.current.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        container.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    }, [open]);

    const moveMenuFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
            focusTrigger();
            return;
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        const items = Array.from(container.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []);
        if (!items.length) return;
        const current = items.indexOf(document.activeElement as HTMLElement);
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const next = current < 0 ? (direction > 0 ? 0 : items.length - 1) : (current + direction + items.length) % items.length;
        event.preventDefault();
        items[next].focus();
    };

    return (
        <div className="dcat-modern-menu" ref={(node) => { container.current = node; floating.anchorRef(node); }}>
            <Button tone="secondary" aria-haspopup="menu" aria-expanded={open} aria-controls={id} onPress={() => setOpen((value) => !value)}>{label}</Button>
            {open ? <div ref={floating.panelRef} style={floating.style} data-placement={floating.placement} id={id} role="menu" className="dcat-modern-menu__panel" onKeyDown={moveMenuFocus}>{children}</div> : null}
        </div>
    );
}

export function MenuItem({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props} type="button" role="menuitem" className={`dcat-modern-menu__item ${props.className ?? ''}`.trim()}>{children}</button>;
}

export function Popover({ label, children }: { label: ReactNode; children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const id = useId();
    const container = useRef<HTMLSpanElement>(null);
    const floating = useFloatingPanel(open);

    const focusTrigger = () => container.current?.querySelector<HTMLElement>('.dcat-modern-button')?.focus();

    useEffect(() => {
        if (!open) return;
        const close = (event: MouseEvent) => {
            if (container.current && !container.current.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    return (
        <span ref={(node) => { container.current = node; floating.anchorRef(node); }} className="dcat-modern-popover">
            <Button tone="tertiary" aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onPress={() => setOpen((value) => !value)}>{label}</Button>
            {open ? <span ref={floating.panelRef} style={floating.style} data-placement={floating.placement} id={id} role="dialog" className="dcat-modern-popover__panel" onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    setOpen(false);
                    focusTrigger();
                }
            }}>{children}</span> : null}
        </span>
    );
}

export function Tooltip({ label, children }: { label: ReactNode; children: ReactNode }) {
    const [visible, setVisible] = useState(false);
    const id = useId();
    const floating = useFloatingPanel(visible, 5);
    return (
        <span ref={floating.anchorRef} className="dcat-modern-tooltip" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)} onFocus={() => setVisible(true)} onBlur={() => setVisible(false)}>
            <span tabIndex={0} aria-describedby={visible ? id : undefined}>{children}</span>
            {visible ? <span ref={floating.panelRef} style={floating.style} data-placement={floating.placement} id={id} role="tooltip" className="dcat-modern-tooltip__bubble">{label}</span> : null}
        </span>
    );
}

export function Button({ tone = 'secondary', loading = false, disabled, children, ...props }: ButtonProps) {
    const ref = useRef<HTMLButtonElement>(null);
    const { buttonProps, isPressed } = useButton({ ...props, isDisabled: disabled || loading }, ref);
    const { hoverProps, isHovered } = useHover({ ...props, isDisabled: disabled || loading });
    const { focusProps, isFocused, isFocusVisible } = useFocusRing({ autoFocus: props.autoFocus });
    const handlers = mergeProps(buttonProps, hoverProps, focusProps);
    const state = { isPressed, isHovered, isFocused, isFocusVisible, isDisabled: Boolean(disabled), isPending: loading, defaultStyle: {} };
    return (
        <button
            {...handlers}
            ref={ref}
            className={`dcat-modern-button dcat-modern-button--${tone} ${props.className ?? ''}`.trim()}
            style={typeof props.style === 'function' ? props.style(state) : props.style}
            disabled={disabled}
            aria-disabled={loading || buttonProps['aria-disabled']}
            aria-busy={loading || undefined}
            data-pending={loading || undefined}
            data-pressed={isPressed || undefined}
            data-hovered={isHovered || undefined}
            data-focused={isFocused || undefined}
            data-focus-visible={isFocusVisible || undefined}
            onClick={(event) => {
                if (loading) { event.preventDefault(); return; }
                handlers.onClick?.(event);
            }}
        >
            {loading ? <span className="dcat-modern-spinner" aria-hidden="true" /> : null}
            <span>{children}</span>
        </button>
    );
}

export function IconButton({ children, 'aria-label': ariaLabel, ...props }: ButtonProps) {
    if (!ariaLabel) {
        throw new Error('IconButton requires an aria-label');
    }
    return (
        <Button {...props} aria-label={ariaLabel} className={`dcat-modern-icon-button ${props.className ?? ''}`.trim()}>
            {children}
        </Button>
    );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} className={`dcat-modern-input ${props.className ?? ''}`.trim()} />;
}

export function Link({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
    return <a {...props} className={`dcat-modern-link ${props.className ?? ''}`.trim()}>{children}</a>;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
    return <select {...props} className={`dcat-modern-select ${props.className ?? ''}`.trim()} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea {...props} className={`dcat-modern-textarea ${props.className ?? ''}`.trim()} />;
}

export function Panel({ children, ...props }: HTMLAttributes<HTMLElement>) {
    return <section {...props} className={`dcat-modern-panel ${props.className ?? ''}`.trim()}>{children}</section>;
}

export function Card({ children, ...props }: HTMLAttributes<HTMLElement>) {
    return <article {...props} className={`dcat-modern-card ${props.className ?? ''}`.trim()}>{children}</article>;
}

interface ChoiceProps extends InputHTMLAttributes<HTMLInputElement> {
    label: ReactNode;
}

export function Checkbox({ label, ...props }: ChoiceProps) {
    const id = useId();
    const inputId = props.id ?? id;
    return (
        <label className="dcat-modern-choice" htmlFor={inputId}>
            <input {...props} id={inputId} type="checkbox" />
            <span>{label}</span>
        </label>
    );
}

export function Radio({ label, ...props }: ChoiceProps) {
    const id = useId();
    const inputId = props.id ?? id;
    return (
        <label className="dcat-modern-choice" htmlFor={inputId}>
            <input {...props} id={inputId} type="radio" />
            <span>{label}</span>
        </label>
    );
}

export interface SwitchProps extends Omit<AriaSwitchProps, 'children' | 'className' | 'isDisabled'> {
    label: ReactNode;
    disabled?: boolean;
    className?: string;
}

export function Switch({ label, disabled, className, ...props }: SwitchProps) {
    const ref = useRef<HTMLInputElement>(null);
    const options = { ...props, children: label, isDisabled: disabled };
    const state = useToggleState(options);
    const { inputProps, labelProps } = useSwitch(options, state, ref);
    const { focusProps, isFocusVisible } = useFocusRing({ autoFocus: props.autoFocus });
    return (
        <label
            {...labelProps}
            className={`dcat-modern-switch ${className ?? ''}`.trim()}
            data-selected={state.isSelected || undefined}
            data-disabled={disabled || undefined}
            data-focus-visible={isFocusVisible || undefined}
        >
            <input {...mergeProps(inputProps, focusProps)} ref={ref} />
            <span className="dcat-modern-switch__track" aria-hidden="true"><span /></span>
            <span>{label}</span>
        </label>
    );
}

export function Avatar({ src, alt = '', fallback }: { src?: string; alt?: string; fallback?: ReactNode }) {
    return (
        <span className="dcat-modern-avatar">
            {src ? <img src={src} alt={alt} /> : <span aria-hidden={alt ? undefined : true}>{fallback ?? '?'}</span>}
        </span>
    );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
    return <span className={`dcat-modern-badge dcat-modern-badge--${tone}`}>{children}</span>;
}

export function Alert({ children, tone = 'neutral', ...props }: HTMLAttributes<HTMLDivElement> & { tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
    return (
        <div {...props} className={`dcat-modern-alert dcat-modern-alert--${tone} ${props.className ?? ''}`.trim()} role={tone === 'danger' ? 'alert' : 'status'}>
            {children}
        </div>
    );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
    return (
        <div className="dcat-modern-empty" role="status">
            <strong>{title}</strong>
            {description ? <p>{description}</p> : null}
            {action}
        </div>
    );
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
    return (
        <div className="dcat-modern-loading" role="status" aria-live="polite">
            <span className="dcat-modern-spinner" aria-hidden="true" />
            <span>{label}</span>
        </div>
    );
}

export function ErrorState({ title = 'Unable to load', description, action }: { title?: string; description?: string; action?: ReactNode }) {
    return (
        <div className="dcat-modern-error" role="alert">
            <strong>{title}</strong>
            {description ? <p>{description}</p> : null}
            {action}
        </div>
    );
}

function useFocusTrap(active: boolean, onEscape: () => void) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!active || !ref.current) return;
        const container = ref.current;
        const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const selector = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
        const first = container.querySelector<HTMLElement>(selector);
        first?.focus();

        const handler = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onEscape();
                return;
            }
            if (event.key !== 'Tab') return;
            const focusable = Array.from(container.querySelectorAll<HTMLElement>(selector));
            if (!focusable.length) return;
            const current = focusable.indexOf(document.activeElement as HTMLElement);
            let next = event.shiftKey ? current - 1 : current + 1;
            if (next < 0) next = focusable.length - 1;
            if (next >= focusable.length) next = 0;
            if (current === -1 || next !== current + (event.shiftKey ? -1 : 1)) {
                event.preventDefault();
                focusable[next].focus();
            }
        };

        container.addEventListener('keydown', handler);
        return () => {
            container.removeEventListener('keydown', handler);
            previous?.focus();
        };
    }, [active, onEscape]);

    return ref;
}

export function Modal() {
    const state = useSyncExternalStore(overlayStore.subscribe, overlayStore.snapshot, overlayStore.snapshot);
    const dialog = state.dialog;
    const ref = useFocusTrap(Boolean(dialog), () => overlayStore.resolveDialog(false));
    if (!dialog) return null;

    return createPortal(
        <div className="dcat-modern-overlay" role="presentation">
            <div ref={ref} className="dcat-modern-modal" role="dialog" aria-modal="true" aria-labelledby={`${dialog.id}-title`}>
                <h2 id={`${dialog.id}-title`}>{dialog.title}</h2>
                {dialog.body ? <div className="dcat-modern-modal__body">{dialog.body}</div> : null}
                <div className="dcat-modern-modal__actions">
                    <Button tone="tertiary" onPress={() => overlayStore.resolveDialog(false)}>{dialog.cancelLabel ?? 'Cancel'}</Button>
                    <Button tone={dialog.danger ? 'danger' : 'primary'} onPress={() => overlayStore.resolveDialog(true)}>{dialog.confirmLabel ?? 'Confirm'}</Button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export function Drawer() {
    const state = useSyncExternalStore(overlayStore.subscribe, overlayStore.snapshot, overlayStore.snapshot);
    const drawer = state.drawer;
    const ref = useFocusTrap(Boolean(drawer), () => overlayStore.closeDrawer());
    if (!drawer) return null;

    return createPortal(
        <div className="dcat-modern-overlay dcat-modern-overlay--drawer" role="presentation" onMouseDown={(event) => {
            if (event.currentTarget === event.target) overlayStore.closeDrawer(drawer.id);
        }}>
            <aside ref={ref} className="dcat-modern-drawer" role="dialog" aria-modal="true" aria-labelledby={`${drawer.id}-title`}>
                <header>
                    <h2 id={`${drawer.id}-title`}>{drawer.title}</h2>
                    <Button tone="tertiary" onPress={() => overlayStore.closeDrawer(drawer.id)}>{drawer.closeLabel ?? 'Close'}</Button>
                </header>
                <div className="dcat-modern-drawer__body">{drawer.body}</div>
            </aside>
        </div>,
        document.body,
    );
}

export function Toast({ notice }: { notice: { id: string; message: string; tone: 'neutral' | 'success' | 'warning' | 'danger' } }) {
    return (
        <div className={`dcat-modern-toast dcat-modern-toast--${notice.tone}`} role={notice.tone === 'danger' ? 'alert' : 'status'}>
            <span>{notice.message}</span>
            <button type="button" aria-label="Dismiss notification" onClick={() => overlayStore.dismissNotice(notice.id)}>×</button>
        </div>
    );
}

export function ToastRegion() {
    const state = useSyncExternalStore(overlayStore.subscribe, overlayStore.snapshot, overlayStore.snapshot);
    if (!state.notices.length) return null;
    return createPortal(
        <div className="dcat-modern-toasts" role="region" aria-label="Notifications" aria-live="polite">
            {state.notices.map((notice) => <Toast key={notice.id} notice={notice} />)}
        </div>,
        document.body,
    );
}

export function OverlayHost() {
    return (
        <>
            <ToastRegion />
            <Modal />
            <Drawer />
        </>
    );
}

export function CapabilityHost({ capability }: { capability: string }) {
    return <span className="dcat-modern-capability-host" data-capability={capability} aria-hidden="true" />;
}
