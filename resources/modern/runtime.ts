import { DOMElement } from './platform';
import { navigation } from './navigation';
import { bindForm, formState, type FormOptions } from './forms';

type DcatCallback = (...args: any[]) => void;

type NativeDcatConfig = Record<string, unknown> & {
    token?: string;
    lang?: Record<string, unknown>;
    pjax_container_selector?: string;
};

interface InitRecord {
    observer: MutationObserver;
}

class NativeHttpError extends Error {
    status: number;
    payload: unknown;

    constructor(status: number, payload: unknown) {
        const message = payload && typeof payload === 'object' && typeof (payload as Record<string, unknown>).message === 'string'
            ? String((payload as Record<string, unknown>).message)
            : `HTTP ${status}`;
        super(message);
        this.name = 'NativeHttpError';
        this.status = status;
        this.payload = payload;
    }
}

const actions = new Map<string, DcatCallback>();
const boundActions = new Set<string>();
const initialized = new Map<string, InitRecord>();
const bootingCallbacks: Array<{ callback: DcatCallback; once: boolean }> = [];
let waiting = false;
let shellBound = false;
let gridInteractionsBound = false;
let widgetInteractionsBound = false;
let dataActionsBound = false;
let gridInteractionDcat: NativeDcat | null = null;
let activeGridFilterPanel: HTMLElement | null = null;
const quickSearchTimers = new Map<HTMLInputElement, number>();
const columnSelectorTimers = new Map<HTMLElement, number>();
const gridMenuStyles = new Map<HTMLElement, string | null>();

function closeWidgetDropdowns(except: HTMLElement | null = null): void {
    document.querySelectorAll<HTMLElement>('[data-dcat-native-widget-dropdown="1"]').forEach((root) => {
        if (root === except) return;
        const trigger = root.querySelector<HTMLElement>('[data-dcat-widget-dropdown-trigger="1"]');
        const menu = root.querySelector<HTMLElement>('[role="menu"]');
        if (!trigger || !menu) return;
        trigger.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
    });
}

function toggleWidgetDropdown(root: HTMLElement, force?: boolean): void {
    const trigger = root.querySelector<HTMLElement>('[data-dcat-widget-dropdown-trigger="1"]');
    const menu = root.querySelector<HTMLElement>('[role="menu"]');
    if (!trigger || !menu) return;
    const open = force ?? menu.hidden;
    closeWidgetDropdowns(open ? root : null);
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) {
        menu.querySelectorAll<HTMLElement>('a,button').forEach((item) => {
            if (!item.hasAttribute('role')) item.setAttribute('role', 'menuitem');
            if (!item.hasAttribute('tabindex')) item.tabIndex = -1;
        });
    }
}

function bindNativeWidgetInteractions(): void {
    if (widgetInteractionsBound) return;
    widgetInteractionsBound = true;

    document.addEventListener('click', (eventValue) => {
        const target = eventValue.target instanceof DOMElement ? eventValue.target : null;
        if (!target) return;
        const root = target.closest<HTMLElement>('[data-dcat-native-widget-dropdown="1"]');
        const trigger = target.closest<HTMLElement>('[data-dcat-widget-dropdown-trigger="1"]');
        if (root && trigger) {
            eventValue.preventDefault();
            toggleWidgetDropdown(root);
            return;
        }
        if (root) {
            const option = target.closest<HTMLElement>('[role="menu"] a,[role="menu"] button');
            if (option) {
                if (root.dataset.dcatDropdownSelect === '1') {
                    const label = root.querySelector<HTMLElement>('[data-dcat-dropdown-label]');
                    if (label) label.innerHTML = option.innerHTML;
                }
                toggleWidgetDropdown(root, false);
                return;
            }
        }
        closeWidgetDropdowns();
    }, true);

    document.addEventListener('keydown', (eventValue) => {
        const target = eventValue.target instanceof DOMElement ? eventValue.target : null;
        const root = target?.closest<HTMLElement>('[data-dcat-native-widget-dropdown="1"]');
        if (!root) return;
        const trigger = root.querySelector<HTMLElement>('[data-dcat-widget-dropdown-trigger="1"]');
        const menu = root.querySelector<HTMLElement>('[role="menu"]');
        if (!trigger || !menu) return;
        if (eventValue.key === 'Escape') {
            eventValue.preventDefault();
            toggleWidgetDropdown(root, false);
            trigger.focus();
            return;
        }
        if ((eventValue.key === 'ArrowDown' || eventValue.key === 'ArrowUp') && (target === trigger || !menu.hidden)) {
            eventValue.preventDefault();
            toggleWidgetDropdown(root, true);
            const items = Array.from(menu.querySelectorAll<HTMLElement>('a,button'));
            if (!items.length) return;
            const current = items.indexOf(document.activeElement as HTMLElement);
            const direction = eventValue.key === 'ArrowDown' ? 1 : -1;
            const next = current < 0
                ? (direction > 0 ? 0 : items.length - 1)
                : (current + direction + items.length) % items.length;
            items[next]?.focus();
        }
    }, true);

    document.addEventListener('dcat:pjax:start', () => closeWidgetDropdowns());
}

function random(length = 8): string {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = new Uint8Array(Math.max(1, length));
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('');
}

function getPath(value: unknown, path: string, fallback: unknown = undefined): unknown {
    if (!path) return value;
    return path.split('.').reduce<unknown>((current, segment) => {
        if (!current || typeof current !== 'object') return fallback;
        return Object.prototype.hasOwnProperty.call(current, segment)
            ? (current as Record<string, unknown>)[segment]
            : fallback;
    }, value);
}

function translator(values: Record<string, unknown> = {}) {
    const trans = (key: string, replacements: Record<string, string | number> = {}) => {
        const raw = getPath(values, key, key);
        let result = typeof raw === 'string' ? raw : key;
        Object.entries(replacements).forEach(([name, value]) => {
            result = result.replace(new RegExp(`:${name}\\b`, 'g'), String(value));
        });
        return result;
    };
    return Object.assign(values, { trans });
}

function nativeHelpers() {
    return {
        random,
        get: getPath,
        len(value: unknown) {
            if (Array.isArray(value) || typeof value === 'string') return value.length;
            if (value && typeof value === 'object') return Object.keys(value).length;
            return 0;
        },
        isset(value: unknown) {
            return value !== undefined && value !== null;
        },
        inObject(haystack: unknown, needle: unknown, strict = false) {
            const values = Array.isArray(haystack)
                ? haystack
                : haystack && typeof haystack === 'object'
                    ? Object.values(haystack as Record<string, unknown>)
                    : [haystack];
            return values.some((value) => strict ? value === needle : String(value) === String(needle));
        },
        debounce<T extends (...args: any[]) => unknown>(callback: T, wait = 250) {
            let timer = 0;
            return (...args: Parameters<T>) => {
                window.clearTimeout(timer);
                timer = window.setTimeout(() => callback(...args), wait);
            };
        },

        previewImage(url: string) {
            window.open(url, '_blank', 'noopener,noreferrer');
        },
    };
}

function notify(tone: string, message: unknown): void {
    window.dispatchEvent(new CustomEvent('dcat:notice', {
        detail: { tone, message: String(message ?? '') },
    }));
}

function event(name: string, detail: Record<string, unknown> = {}): CustomEvent {
    return new CustomEvent(name, { bubbles: true, detail });
}

function nativePjax(dcat: NativeDcat, url: string, options: { replace?: boolean } = {}): Promise<void> {
    return navigation.navigate(dcat, url, options);
}

function syncSidebarToggleState(): void {
    if (!document.body) return;
    const mobile = window.innerWidth < 768;
    const expanded = mobile
        ? document.body.classList.contains('sidebar-open')
        : !document.body.classList.contains('sidebar-collapse');

    document.querySelectorAll<HTMLElement>('[data-widget="pushmenu"], .menu-toggle').forEach((toggle) => {
        toggle.setAttribute('aria-expanded', String(expanded));
        if (!toggle.hasAttribute('role') && toggle.tagName !== 'BUTTON') toggle.setAttribute('role', 'button');
        if (!toggle.hasAttribute('tabindex') && toggle.tagName !== 'BUTTON') toggle.setAttribute('tabindex', '0');
        if (!toggle.hasAttribute('aria-label')) toggle.setAttribute('aria-label', 'Toggle navigation');
    });
}

function toggleSidebar(): void {
    if (!document.body) return;
    if (window.innerWidth < 768) {
        document.body.classList.toggle('sidebar-open');
    } else {
        document.body.classList.toggle('sidebar-collapse');
        document.body.classList.remove('sidebar-open');
    }
    syncSidebarToggleState();
    document.dispatchEvent(event('dcat:sidebar:changed', {
        collapsed: document.body.classList.contains('sidebar-collapse'),
        open: document.body.classList.contains('sidebar-open'),
    }));
}

function bindNativeShell(): void {
    if (shellBound) return;
    shellBound = true;

    document.addEventListener('click', (eventValue) => {
        const target = eventValue.target instanceof DOMElement ? eventValue.target : null;
        if (!target || !document.body?.classList.contains('dcat-modern-active')) return;
        const toggle = target.closest<HTMLElement>('[data-widget="pushmenu"], .menu-toggle');
        if (!toggle) return;
        eventValue.preventDefault();
        toggleSidebar();
    });

    document.addEventListener('keydown', (eventValue) => {
        if (!document.body?.classList.contains('dcat-modern-active')) return;
        const target = eventValue.target instanceof DOMElement ? eventValue.target : null;
        const toggle = target?.closest<HTMLElement>('[data-widget="pushmenu"], .menu-toggle');
        if (toggle && (eventValue.key === 'Enter' || eventValue.key === ' ')) {
            eventValue.preventDefault();
            toggleSidebar();
            return;
        }
        if (eventValue.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
            document.body.classList.remove('sidebar-open');
            syncSidebarToggleState();
        }
    });

    window.addEventListener('resize', syncSidebarToggleState);
    document.addEventListener('dcat:pjax:loaded', syncSidebarToggleState);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncSidebarToggleState, { once: true });
    } else {
        syncSidebarToggleState();
    }
}


function modernGridRoot(target: EventTarget | null): HTMLElement | null {
    const element = target instanceof DOMElement ? target : null;
    return element?.closest<HTMLElement>('.dcat-modern-grid-view') ?? null;
}

function nativeGridSelectedKeys(root: HTMLElement): string[] {
    const selected: string[] = [];
    root.querySelectorAll<HTMLInputElement>('[data-dcat-grid-row-selector="1"]:checked').forEach((checkbox) => {
        const id = checkbox.dataset.id;
        if (id && !selected.includes(id)) selected.push(id);
    });
    return selected;
}

function nativeGridSelectedRows(root: HTMLElement): Array<{ id: string; label: string }> {
    return Array.from(root.querySelectorAll<HTMLInputElement>('[data-dcat-grid-row-selector="1"]:checked')).map((checkbox) => ({
        id: checkbox.dataset.id || '',
        label: checkbox.dataset.label || checkbox.dataset.id || '',
    })).filter((entry) => entry.id);
}

function closeGridDropdowns(except: HTMLElement | null = null): void {
    document.querySelectorAll<HTMLElement>('.dcat-modern-grid-view .dropdown.show, .dcat-modern-grid-view .btn-group.show').forEach((dropdown) => {
        if (dropdown === except) return;
        dropdown.classList.remove('show');
        const menu = dropdown.querySelector<HTMLElement>(':scope > .dropdown-menu');
        menu?.classList.remove('show');
        if (menu && gridMenuStyles.has(menu)) {
            const style = gridMenuStyles.get(menu);
            if (style === null) menu.removeAttribute('style');
            else menu.setAttribute('style', style || '');
            gridMenuStyles.delete(menu);
        }
        dropdown.querySelector<HTMLElement>('[data-toggle="dropdown"]')?.setAttribute('aria-expanded', 'false');
    });
}

function setGridDropdown(toggle: HTMLElement, open?: boolean): boolean {
    const dropdown = toggle.closest<HTMLElement>('.dropdown, .btn-group');
    if (!dropdown) return false;
    const menu = dropdown.querySelector<HTMLElement>(':scope > .dropdown-menu')
        ?? dropdown.querySelector<HTMLElement>('.dropdown-menu');
    if (!menu) return false;
    const next = open ?? !dropdown.classList.contains('show');
    closeGridDropdowns(next ? dropdown : null);
    dropdown.classList.toggle('show', next);
    menu.classList.toggle('show', next);
    toggle.setAttribute('aria-expanded', String(next));
    if (next) {
        if (!gridMenuStyles.has(menu)) gridMenuStyles.set(menu, menu.getAttribute('style'));
        // 浮层相对视口定位，表格继续保留自己的横向滚动和稳定选择器。
        Object.assign(menu.style, {
            position: 'fixed', right: 'auto', bottom: 'auto',
            maxWidth: 'calc(100vw - 16px)', maxHeight: 'calc(100vh - 16px)',
            overflow: 'auto', zIndex: 'var(--dcat-modern-z-overlay)',
        });
        const anchor = toggle.getBoundingClientRect();
        const rect = menu.getBoundingClientRect();
        const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
        const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
        const dropup = dropdown.classList.contains('dropup');
        const alignRight = dropup || menu.classList.contains('dropdown-menu-right');
        const left = alignRight ? anchor.right - rect.width : anchor.left;
        const fitsAbove = anchor.top - rect.height - 4 >= 8;
        const openAbove = fitsAbove && (dropup || anchor.bottom + rect.height + 4 > viewportHeight - 8);
        const top = openAbove ? anchor.top - rect.height - 4 : anchor.bottom + 4;
        menu.style.left = `${Math.max(8, Math.min(left, viewportWidth - rect.width - 8))}px`;
        menu.style.top = `${Math.max(8, Math.min(top, viewportHeight - rect.height - 8))}px`;
        if (!menu.hasAttribute('role')) menu.setAttribute('role', 'menu');
        menu.querySelectorAll<HTMLElement>('a, button:not(:disabled)').forEach((item) => {
            if (!item.hasAttribute('tabindex')) item.tabIndex = -1;
            if (!item.hasAttribute('role')) item.setAttribute('role', 'menuitem');
        });
    }
    return next;
}

function ensureGridFilterPanel(filter: HTMLElement): HTMLElement {
    const hiddenHost = filter.parentElement?.classList.contains('hidden') ? filter.parentElement : null;
    hiddenHost?.classList.remove('hidden');
    hiddenHost?.classList.add('dcat-modern-filter-panel-host');
    filter.classList.add('dcat-modern-filter-panel');
    filter.setAttribute('role', 'dialog');
    filter.setAttribute('aria-modal', 'true');
    filter.setAttribute('aria-hidden', 'true');
    const filterLabel = String(gridInteractionDcat?.lang.trans('filter') || 'Filter');
    filter.setAttribute('aria-label', filterLabel === 'filter' ? 'Filter' : filterLabel);
    if (!filter.querySelector('.dcat-modern-filter-close')) {
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'dcat-modern-filter-close';
        close.setAttribute('aria-label', 'Close filter');
        close.innerHTML = '<span aria-hidden="true">&times;</span>';
        filter.prepend(close);
    }
    return filter;
}

function closeGridFilterPanel(): void {
    const panel = activeGridFilterPanel;
    if (!panel) return;
    panel.classList.remove('dcat-modern-filter-panel--open');
    panel.setAttribute('aria-hidden', 'true');
    document.body?.classList.remove('dcat-modern-filter-open');
    document.querySelector('.dcat-modern-filter-backdrop')?.remove();
    activeGridFilterPanel = null;
}

function toggleGridFilter(root: HTMLElement): void {
    const form = root.querySelector<HTMLFormElement>('.grid-filter-form');
    if (!form) return;
    const rightSide = form.closest<HTMLElement>('.right-side-filter-container');
    if (!rightSide) {
        const box = form.closest<HTMLElement>('.filter-box') ?? form.parentElement;
        const host = box?.parentElement ?? box;
        host?.classList.toggle('d-none');
        return;
    }

    const panel = ensureGridFilterPanel(rightSide);
    const opening = activeGridFilterPanel !== panel || !panel.classList.contains('dcat-modern-filter-panel--open');
    closeGridFilterPanel();
    if (!opening) return;

    activeGridFilterPanel = panel;
    panel.classList.add('dcat-modern-filter-panel--open');
    panel.setAttribute('aria-hidden', 'false');
    document.body?.classList.add('dcat-modern-filter-open');
    const backdrop = document.createElement('div');
    backdrop.className = 'dcat-modern-filter-backdrop';
    backdrop.setAttribute('data-dcat-modern-filter-backdrop', '1');
    document.body?.appendChild(backdrop);
    panel.querySelector<HTMLElement>('input:not([type="hidden"]), select, textarea, button:not(.dcat-modern-filter-close)')?.focus();
}

function updateGridSelection(root: HTMLElement): void {
    const rows = Array.from(root.querySelectorAll<HTMLInputElement>('[data-dcat-grid-row-selector="1"]'));
    const enabled = rows.filter((checkbox) => !checkbox.disabled);
    const checked = enabled.filter((checkbox) => checkbox.checked);
    const selectAll = root.querySelector<HTMLInputElement>('input.select-all');
    if (selectAll) {
        selectAll.checked = enabled.length > 0 && checked.length === enabled.length;
        selectAll.indeterminate = checked.length > 0 && checked.length < enabled.length;
    }
    rows.forEach((checkbox) => {
        const row = checkbox.closest<HTMLTableRowElement>('tr');
        row?.classList.toggle('dcat-modern-grid-row-selected', checkbox.checked);
        if (row && checkbox.dataset.dcatRowBackground) {
            row.style.setProperty('--dcat-modern-grid-selected-bg', checkbox.dataset.dcatRowBackground);
        }
    });
    root.querySelectorAll<HTMLElement>('[class*="-select-all-btn"]').forEach((button) => {
        if (!button.classList.contains('dropdown')) return;
        button.style.display = checked.length ? '' : 'none';
        const selected = button.querySelector<HTMLElement>('.selected');
        if (selected) {
            const template = selected.dataset.dcatSelectionTemplate || String(gridInteractionDcat?.lang.trans('grid_items_selected') || '{n} items selected');
            selected.textContent = template.replace('{n}', String(checked.length));
        }
    });
    root.dispatchEvent(event('dcat:grid:selection-changed', {
        keys: checked.map((checkbox) => checkbox.dataset.id).filter(Boolean),
        rows: nativeGridSelectedRows(root),
    }));
}

function formUrl(form: HTMLFormElement): string {
    const url = new URL(form.action || location.href, location.href);
    url.search = '';
    const params = new URLSearchParams();
    new FormData(form).forEach((value, key) => {
        if (typeof value === 'string') params.append(key, value);
    });
    url.search = params.toString();
    return url.href;
}

function submitNativeGridGetForm(dcat: NativeDcat, form: HTMLFormElement): void {
    void nativePjax(dcat, formUrl(form));
}

function scheduleQuickSearch(dcat: NativeDcat, input: HTMLInputElement): void {
    const previous = quickSearchTimers.get(input);
    if (previous) window.clearTimeout(previous);
    const timer = window.setTimeout(() => {
        quickSearchTimers.delete(input);
        const form = input.closest<HTMLFormElement>('form.quick-search-form');
        if (form?.isConnected) submitNativeGridGetForm(dcat, form);
    }, 1200);
    quickSearchTimers.set(input, timer);
}

function scheduleColumnSelector(dcat: NativeDcat, selector: HTMLElement): void {
    const previous = columnSelectorTimers.get(selector);
    if (previous) window.clearTimeout(previous);
    selector.dataset.dcatNativeColumnState = 'scheduled';
    const timer = window.setTimeout(() => {
        columnSelectorTimers.delete(selector);
        const columnName = selector.dataset.dcatColumnName;
        if (!columnName) {
            selector.dataset.dcatNativeColumnState = 'missing-name';
            return;
        }
        const selected = Array.from(selector.querySelectorAll<HTMLInputElement>('.column-select-item:checked')).map((input) => input.value);
        selector.dataset.dcatNativeColumnSelected = selected.join(',');
        if (!selected.length) {
            selector.dataset.dcatNativeColumnState = 'empty';
            return;
        }
        const defaults = (selector.dataset.dcatColumnDefaults || '').split(',').filter(Boolean).sort();
        const sorted = [...selected].sort();
        const url = new URL(location.href);
        url.searchParams.delete('page');
        if (sorted.join(',') === defaults.join(',')) url.searchParams.set(columnName, '');
        else url.searchParams.set(columnName, selected.join(','));
        selector.dataset.dcatNativeColumnState = 'requesting';
        selector.dataset.dcatNativeColumnUrl = url.href;
        void nativePjax(dcat, url.href);
    }, 200);
    columnSelectorTimers.set(selector, timer);
}

function deleteRequestBody(dcat: NativeDcat): URLSearchParams {
    const body = new URLSearchParams({ _method: 'DELETE' });
    if (dcat.token) body.set('_token', dcat.token);
    return body;
}

function runNativeGridDelete(dcat: NativeDcat, action: HTMLElement, root: HTMLElement, batch: boolean): void {
    if (action.dataset.dcatNativeBusy === '1' || action.dataset.dcatConfirming === '1') return;
    let url = action.dataset.url || '';
    const keys = batch ? nativeGridSelectedKeys(root) : [];
    if (batch) {
        if (!keys.length) {
            dcat.warning(String(dcat.lang.trans('no_data_selected') || 'No data selected!'));
            return;
        }
        url = `${url.replace(/\/$/, '')}/${keys.join(',')}`;
    }
    if (!url) return;
    const message = batch ? `ID - ${keys.join(', ')}` : (action.dataset.message || '');
    const title = String(dcat.lang.trans('delete_confirm') || 'Confirm delete');
    action.dataset.dcatConfirming = '1';
    const dialog = dcat.confirm(title, message, async () => {
        delete action.dataset.dcatConfirming;
        if (!action.isConnected || action.dataset.dcatNativeBusy === '1') return;
        action.dataset.dcatNativeBusy = '1';
        action.setAttribute('aria-disabled', 'true');
        try {
            const response = await dcat.request(url, { method: 'POST', body: deleteRequestBody(dcat) });
            const record = response && typeof response === 'object' ? response as Record<string, unknown> : {};
            if (action.dataset.redirect && !record.redirect && !record.refresh && !record.reload) {
                record.redirect = action.dataset.redirect;
            }
            dcat.handleJsonResponse(record);
        } catch (error) {
            dcat.handleAjaxError(error);
        } finally {
            delete action.dataset.dcatNativeBusy;
            action.removeAttribute('aria-disabled');
        }
    });
    if (dialog instanceof HTMLDialogElement) dialog.addEventListener('close', () => { delete action.dataset.dcatConfirming; }, { once: true });
    else delete action.dataset.dcatConfirming;
}

function bindNativeDataActions(dcat: NativeDcat): void {
    if (dataActionsBound) return;
    dataActionsBound = true;
    document.addEventListener('click', (eventValue) => {
        const target = eventValue.target instanceof DOMElement ? eventValue.target : null;
        const trigger = target?.closest<HTMLElement>('[data-action],.scroll-top');
        if (!trigger || eventValue.defaultPrevented || modernGridRoot(trigger) || trigger.hasAttribute('data-show-action')) return;
        const action = trigger.dataset.action || '';
        if (actions.has(action)) return;
        if (trigger.matches('.scroll-top')) {
            eventValue.preventDefault();
            window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        } else if (action === 'refresh') {
            eventValue.preventDefault();
            void dcat.reload(trigger.dataset.url);
        } else if (action === 'delete') {
            eventValue.preventDefault();
            runNativeGridDelete(dcat, trigger, document.documentElement, false);
        } else if (action === 'preview-img') {
            eventValue.preventDefault();
            dcat.helpers.previewImage(trigger.getAttribute('src') || '');
        } else if (action === 'collapse' && trigger.closest('.box')) {
            eventValue.preventDefault();
            const body = trigger.closest('.box')?.querySelector<HTMLElement>('.box-body');
            if (body) { body.hidden = !body.hidden; trigger.setAttribute('aria-expanded', String(!body.hidden)); }
        } else if (action === 'remove' && trigger.closest('.box')) {
            eventValue.preventDefault();
            trigger.closest('.box')?.remove();
        }
    }, true);
    window.addEventListener('scroll', () => {
        document.querySelectorAll<HTMLElement>('.scroll-top').forEach((button) => { button.hidden = window.scrollY <= 400; });
    }, { passive: true });
}

function bindNativeGridInteractions(dcat: NativeDcat): void {
    gridInteractionDcat = dcat;
    if (gridInteractionsBound) return;
    gridInteractionsBound = true;

    document.addEventListener('click', (eventValue) => {
        const target = eventValue.target instanceof DOMElement ? eventValue.target : null;
        if (!target) return;

        if (target.closest('[data-dcat-modern-filter-backdrop], .dcat-modern-filter-close')) {
            eventValue.preventDefault();
            eventValue.stopImmediatePropagation();
            closeGridFilterPanel();
            return;
        }

        const root = modernGridRoot(target);
        if (!root) {
            closeGridDropdowns();
            return;
        }
        root.dataset.dcatGridInteractions = 'native';
        const customAction = target.closest<HTMLElement>('[data-action]')?.dataset.action;
        if (customAction && actions.has(customAction)) return;

        const row = target.closest<HTMLTableRowElement>('tbody tr');
        if (row && !target.closest('a, button, input, select, textarea, label, [role="button"]')) {
            const checkbox = row.querySelector<HTMLInputElement>('[data-dcat-grid-row-selector="1"][data-dcat-row-clickable="1"]:not(:disabled)');
            if (checkbox) {
                eventValue.preventDefault();
                eventValue.stopImmediatePropagation();
                checkbox.checked = !checkbox.checked;
                updateGridSelection(root);
                return;
            }
        }

        const filterButton = target.closest<HTMLElement>('.filter-button-group > button:not([data-toggle="dropdown"])');
        if (filterButton) {
            eventValue.preventDefault();
            eventValue.stopImmediatePropagation();
            toggleGridFilter(root);
            return;
        }

        const dropdownToggle = target.closest<HTMLElement>('[data-toggle="dropdown"]');
        if (dropdownToggle) {
            eventValue.preventDefault();
            eventValue.stopImmediatePropagation();
            setGridDropdown(dropdownToggle);
            return;
        }

        const refresh = target.closest<HTMLElement>('[data-action="refresh"]');
        if (refresh) {
            eventValue.preventDefault();
            eventValue.stopImmediatePropagation();
            dcat.reload(refresh.dataset.url || undefined);
            return;
        }

        const remove = target.closest<HTMLElement>('[data-action="delete"], [data-action="batch-delete"]');
        if (remove) {
            eventValue.preventDefault();
            eventValue.stopImmediatePropagation();
            runNativeGridDelete(dcat, remove, root, remove.dataset.action === 'batch-delete');
            return;
        }

        const exportSelected = target.closest<HTMLAnchorElement>('a[href*="__rows__"]');
        if (exportSelected) {
            eventValue.preventDefault();
            eventValue.stopImmediatePropagation();
            const keys = nativeGridSelectedKeys(root);
            if (!keys.length) {
                dcat.warning(String(dcat.lang.trans('no_data_selected') || 'No data selected!'));
                return;
            }
            location.assign(exportSelected.href.replace('__rows__', keys.join(',')));
            return;
        }

        const quickClear = target.closest<HTMLElement>('.quick-search-clear');
        if (quickClear) {
            eventValue.preventDefault();
            eventValue.stopImmediatePropagation();
            const form = quickClear.closest<HTMLFormElement>('form.quick-search-form');
            const input = form?.querySelector<HTMLInputElement>('.quick-search-input');
            if (form && input) {
                input.value = '';
                submitNativeGridGetForm(dcat, form);
            }
            return;
        }

        closeGridDropdowns();
    }, true);

    document.addEventListener('change', (eventValue) => {
        const input = eventValue.target instanceof HTMLInputElement ? eventValue.target : null;
        const root = modernGridRoot(input);
        if (!input || !root) return;

        if (input.matches('[data-dcat-grid-row-selector="1"]')) {
            eventValue.stopImmediatePropagation();
            updateGridSelection(root);
            return;
        }
        if (input.matches('input.select-all') && !input.closest('.column-selector')) {
            eventValue.stopImmediatePropagation();
            root.querySelectorAll<HTMLInputElement>('[data-dcat-grid-row-selector="1"]:not(:disabled)').forEach((checkbox) => {
                checkbox.checked = input.checked;
            });
            updateGridSelection(root);
            return;
        }
        const selector = input.closest<HTMLElement>('.column-selector[data-dcat-column-name]');
        if (selector) {
            eventValue.stopImmediatePropagation();
            if (input.name === '_all_') {
                selector.querySelectorAll<HTMLInputElement>('.column-select-item').forEach((checkbox) => {
                    checkbox.checked = input.checked;
                });
            }
            scheduleColumnSelector(dcat, selector);
        }
    }, true);

    document.addEventListener('input', (eventValue) => {
        const input = eventValue.target instanceof HTMLInputElement ? eventValue.target : null;
        const root = modernGridRoot(input);
        if (!input || !root || !input.matches('.quick-search-input[auto="1"]')) return;
        if (eventValue instanceof InputEvent && eventValue.isComposing) return;
        eventValue.stopImmediatePropagation();
        scheduleQuickSearch(dcat, input);
    }, true);

    document.addEventListener('submit', (eventValue) => {
        const form = eventValue.target instanceof HTMLFormElement ? eventValue.target : null;
        const root = modernGridRoot(form);
        if (!form || !root || (!form.matches('.quick-search-form') && !form.matches('.grid-filter-form'))) return;
        if ((form.method || 'get').toLowerCase() !== 'get') return;
        eventValue.preventDefault();
        eventValue.stopImmediatePropagation();
        closeGridFilterPanel();
        submitNativeGridGetForm(dcat, form);
    }, true);

    document.addEventListener('keydown', (eventValue) => {
        if (activeGridFilterPanel && eventValue.key === 'Tab') {
            const focusable = Array.from(activeGridFilterPanel.querySelectorAll<HTMLElement>(
                'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
            )).filter((element) => element.offsetParent !== null);
            if (focusable.length) {
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (eventValue.shiftKey && document.activeElement === first) {
                    eventValue.preventDefault();
                    last.focus();
                    return;
                }
                if (!eventValue.shiftKey && document.activeElement === last) {
                    eventValue.preventDefault();
                    first.focus();
                    return;
                }
            }
        }
        if (eventValue.key === 'Escape') {
            const opened = document.querySelector<HTMLElement>('.dcat-modern-grid-view .dropdown.show [data-toggle="dropdown"]');
            closeGridDropdowns();
            closeGridFilterPanel();
            opened?.focus();
            return;
        }
        const target = eventValue.target instanceof DOMElement ? eventValue.target : null;
        const root = modernGridRoot(target);
        const toggle = target?.closest<HTMLElement>('[data-toggle="dropdown"]');
        if (!root || !toggle || (eventValue.key !== 'ArrowDown' && eventValue.key !== 'ArrowUp')) return;
        eventValue.preventDefault();
        eventValue.stopImmediatePropagation();
        setGridDropdown(toggle, true);
        const dropdown = toggle.closest<HTMLElement>('.dropdown, .btn-group');
        const items = Array.from(dropdown?.querySelectorAll<HTMLElement>('.dropdown-menu a, .dropdown-menu button:not(:disabled)') || []);
        (eventValue.key === 'ArrowUp' ? items[items.length - 1] : items[0])?.focus();
    }, true);

    document.addEventListener('dcat:pjax:start', () => {
        closeGridDropdowns();
        closeGridFilterPanel();
    });
    window.addEventListener('resize', () => closeGridDropdowns());
    document.addEventListener('scroll', (eventValue) => {
        if (!(eventValue.target instanceof DOMElement) || !eventValue.target.closest('.dropdown-menu')) closeGridDropdowns();
    }, true);
}

function nativeConfirmDialog(dcat: NativeDcat, title: string, content: string, onConfirm?: DcatCallback): HTMLDialogElement | null {
    if (typeof HTMLDialogElement === 'undefined') return null;
    const dialog = document.createElement('dialog');
    const titleId = `dcat-confirm-title-${random()}`;
    const contentId = `dcat-confirm-content-${random()}`;
    dialog.className = 'dcat-modern-confirm-dialog';
    dialog.setAttribute('aria-labelledby', titleId);
    if (content) dialog.setAttribute('aria-describedby', contentId);

    dialog.innerHTML = '<form method="dialog" class="dcat-modern-confirm-card"><h2 class="dcat-modern-confirm-title"></h2><p class="dcat-modern-confirm-content"></p><div class="dcat-modern-confirm-actions"><button type="submit" value="cancel" class="btn btn-white"></button><button type="submit" value="confirm" class="btn btn-primary"></button></div></form>';
    const heading = dialog.querySelector('h2')!;
    heading.id = titleId;
    heading.textContent = title;
    const body = dialog.querySelector('p')!;
    body.id = contentId;
    if (content) body.textContent = content;
    else body.remove();
    const cancelText = String(dcat.lang.trans('cancel'));
    dialog.querySelector('[value="cancel"]')!.textContent = cancelText === 'cancel' ? 'Cancel' : cancelText;
    const confirmText = String(dcat.lang.trans('confirm'));
    dialog.querySelector('[value="confirm"]')!.textContent = confirmText === 'confirm' ? 'Confirm' : confirmText;
    document.body?.appendChild(dialog);
    dialog.addEventListener('close', () => {
        const accepted = dialog.returnValue === 'confirm';
        dialog.remove();
        if (accepted && onConfirm) onConfirm();
    }, { once: true });
    dialog.addEventListener('cancel', () => {
        dialog.returnValue = 'cancel';
    });
    dialog.showModal();
    document.dispatchEvent(event('dcat:confirm:opened', { title, content }));
    return dialog;
}

class NativeDcat {
    config: NativeDcatConfig;
    token: string | null;
    lang: ReturnType<typeof translator>;
    helpers: ReturnType<typeof nativeHelpers>;
    colors: unknown;
    grid = {
        selected: (name?: string) => {
            const root = this.gridRoot(name);
            return root ? nativeGridSelectedKeys(root) : [];
        },
        selectedRows: (name?: string) => {
            const root = this.gridRoot(name);
            return root ? nativeGridSelectedRows(root) : [];
        },
    };

    private gridRoot(name?: string) {
        return document.querySelector<HTMLElement>(name ? `[data-dcat-modern-grid-name="${CSS.escape(name)}"]` : '.dcat-modern-grid-view');
    }
    constructor(config: NativeDcatConfig = {}) {
        this.config = { pjax_container_selector: '#pjax-container', ...config };
        this.token = typeof config.token === 'string' ? config.token : null;
        this.lang = translator(config.lang || {});
        this.helpers = nativeHelpers();
        this.colors = config.colors;
        navigation.bind(this);
        bindNativeGridInteractions(this);
        bindNativeWidgetInteractions();
        bindNativeDataActions(this);
    }

    Translator(values: Record<string, unknown> = {}) {
        return translator(values);
    }

    withToken(token?: string) {
        if (token) this.token = token;
        return this;
    }

    withLang(values?: Record<string, unknown>) {
        if (values) this.lang = translator(values);
        return this;
    }

    withConfig(config: NativeDcatConfig) {
        this.config = { ...this.config, ...config };
        this.withToken(config.token);
        this.withLang(config.lang);
        return this;
    }

    booting(callback: DcatCallback, once = true) {
        bootingCallbacks.push({ callback, once });
        return this;
    }

    bootingEveryRequest(callback: DcatCallback) {
        return this.booting(callback, false);
    }

    boot() {
        actions.forEach((callback, name) => {
            if (boundActions.has(name)) return;
            boundActions.add(name);
            callback(`[data-action="${CSS.escape(name)}"]`, this);
        });
        const callbacks = bootingCallbacks.splice(0, bootingCallbacks.length);
        callbacks.forEach((entry) => {
            entry.callback(this);
            if (!entry.once) bootingCallbacks.push(entry);
        });
        document.dispatchEvent(event('dcat:booted'));
        return this;
    }

    ready(callback: DcatCallback, hostWindow: Window = window) {
        if (hostWindow !== window) {
            const host = hostWindow as unknown as { Dcat?: NativeDcat };
            host.Dcat?.ready(callback);
            return this;
        }
        const run = () => callback.call(document, event('dcat:ready'));
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
        else if (waiting) document.addEventListener('dcat:pjax:loaded', run, { once: true });
        else queueMicrotask(run);
        return this;
    }

    wait(value: boolean = true) {
        waiting = value !== false;
        document.dispatchEvent(event('dcat:waiting', { waiting }));
        return this;
    }

    triggerReady() {
        waiting = false;
        this.boot();
        document.dispatchEvent(event('dcat:pjax:loaded'));
        return this;
    }

    onPjaxLoaded(callback: DcatCallback, once = true) {
        document.addEventListener('dcat:pjax:loaded', callback as EventListener, { once });
        return this;
    }

    onPjaxComplete(callback: DcatCallback, once = true) {
        document.addEventListener('dcat:pjax:complete', callback as EventListener, { once });
        return this;
    }

    reload(url?: string) {
        return nativePjax(this, url || location.href, { replace: true });
    }

    init(selector: string, callback: DcatCallback, options: { target?: Element } = {}) {
        initialized.get(selector)?.observer.disconnect();
        const initialize = (element: HTMLElement) => {
            if (element.hasAttribute('initialized')) return;
            element.setAttribute('initialized', '1');
            if (!element.id) element.id = `_${random()}`;
            callback.call(element, element, element.id);
        };
        const run = (root: ParentNode = document) => {
            if (root instanceof HTMLElement && root.matches(selector)) initialize(root);
            root.querySelectorAll<HTMLElement>(selector).forEach(initialize);
        };
        run(options.target || document);
        const observer = new MutationObserver((records) => {
            records.forEach((record) => record.addedNodes.forEach((node) => {
                if (node instanceof DOMElement) run(node);
            }));
        });
        observer.observe(options.target || document.documentElement, { childList: true, subtree: true });
        initialized.set(selector, { observer });
        return this;
    }

    offInit(selector: string) {
        initialized.get(selector)?.observer.disconnect();
        initialized.delete(selector);
        document.dispatchEvent(event('dcat:init:off', { selector }));
    }

    addAction(name: string, callback: DcatCallback) {
        actions.set(name, callback);
        return this;
    }

    actions() {
        return Object.fromEntries(actions);
    }

    bindForm(form: HTMLFormElement | string | null, options: FormOptions = {}) {
        const element = typeof form === 'string' ? document.querySelector(form) : form;
        if (element instanceof HTMLFormElement) bindForm(this, element, options);
        return this;
    }

    success(message: unknown) { notify('success', message); }
    error(message: unknown) { notify('danger', message); }
    warning(message: unknown) { notify('warning', message); }
    info(message: unknown) { notify('neutral', message); }

    loading(active: boolean = true) {
        document.documentElement.classList.toggle('dcat-is-loading', active !== false);
        document.body?.setAttribute('aria-busy', active !== false ? 'true' : 'false');
    }

    confirm(title: string, content = '', onConfirm?: DcatCallback) {
        const dialog = nativeConfirmDialog(this, title, content, onConfirm);
        if (dialog) return dialog;
        const accepted = window.confirm([title, content].filter(Boolean).join('\n\n'));
        if (accepted && onConfirm) onConfirm();
        return accepted;
    }

    async request(url: string, options: RequestInit = {}) {
        const headers = new Headers(options.headers || {});
        headers.set('X-Requested-With', 'XMLHttpRequest');
        if (this.token) headers.set('X-CSRF-TOKEN', this.token);
        const response = await fetch(url, { credentials: 'same-origin', ...options, headers });
        const type = response.headers.get('content-type') || '';
        let payload: unknown = null;
        if (response.status !== 204) {
            payload = type.includes('application/json') ? await response.json() : await response.text();
        }
        if (!response.ok) throw new NativeHttpError(response.status, payload);
        return payload;
    }

    handleAjaxError(error: unknown) {
        if (error instanceof NativeHttpError) {
            const payload = error.payload && typeof error.payload === 'object' ? error.payload as Record<string, unknown> : {};
            if (error.status === 401 && typeof payload.redirect === 'string') {
                location.assign(payload.redirect);
                return;
            }
            const translated = getPath(this.lang, String(error.status), '');
            const message = typeof payload.message === 'string' && payload.message
                ? payload.message
                : typeof translated === 'string' && translated
                    ? translated
                    : error.message;
            this.error(message);
            document.dispatchEvent(event('dcat:request:error', { status: error.status, message }));
            return;
        }
        const message = error instanceof Error ? error.message : String(error || 'Request failed');
        this.error(message);
        document.dispatchEvent(event('dcat:request:error', { status: 0, message }));
    }

    handleJsonResponse(response: Record<string, unknown> = {}) {
        const data = response.data && typeof response.data === 'object'
            ? response.data as Record<string, unknown>
            : {};
        const message = typeof data.message === 'string'
            ? data.message
            : typeof response.message === 'string'
                ? response.message
                : '';
        if (message) {
            const requestedTone = typeof data.type === 'string' ? data.type : '';
            const tone = requestedTone === 'error' || requestedTone === 'danger' || response.status === false || response.success === false
                ? 'danger'
                : requestedTone === 'warning'
                    ? 'warning'
                    : requestedTone === 'info'
                        ? 'neutral'
                        : 'success';
            notify(tone, message);
        }

        const then = data.then && typeof data.then === 'object'
            ? data.then as Record<string, unknown>
            : null;
        if (then && typeof then.action === 'string') {
            const value = typeof then.value === 'string' ? then.value : '';
            switch (then.action) {
                case 'refresh':
                    this.reload();
                    break;
                case 'redirect':
                    this.reload(value || undefined);
                    break;
                case 'location':
                    if (value) location.assign(value);
                    else location.reload();
                    break;
                case 'download':
                    if (value) window.open(value, '_blank', 'noopener,noreferrer');
                    break;
                case 'script':
                    window.dispatchEvent(new CustomEvent('dcat:compat:script', { detail: { source: value } }));
                    break;
            }
        }

        const redirect = typeof response.redirect === 'string' ? response.redirect : null;
        if (redirect) this.reload(redirect);
        else if (response.refresh || response.reload) this.reload();
        return response;
    }
}

export function installNativeDcatRuntime(): void {
    const target = window as unknown as Record<string, unknown>;
    if (typeof target.CreateDcat !== 'function') {
        target.CreateDcat = (config: NativeDcatConfig) => new NativeDcat(config);
    }
    target.DcatNativeRuntime = {
        version: '1.0.0',
        pjax: nativePjax,
        formState,
        filter: (target: HTMLElement, open?: boolean) => {
            const root = target?.closest<HTMLElement>('.dcat-modern-grid-view');
            if (!root) return;
            if (open === false) closeGridFilterPanel();
            else if (open === undefined || !activeGridFilterPanel) toggleGridFilter(root);
        },
        status: () => ({ ...navigation.status(), initObservers: initialized.size, pendingTimers: quickSearchTimers.size + columnSelectorTimers.size }),
    };
    bindNativeShell();
}

installNativeDcatRuntime();

document.addEventListener('dcat:pjax:before-replace', () => {
    initialized.forEach(({ observer }) => observer.disconnect());
    initialized.clear();
    quickSearchTimers.forEach((timer) => window.clearTimeout(timer));
    columnSelectorTimers.forEach((timer) => window.clearTimeout(timer));
    quickSearchTimers.clear();
    columnSelectorTimers.clear();
    document.querySelectorAll<HTMLDialogElement>('dialog.dcat-modern-confirm-dialog').forEach((dialog) => {
        dialog.returnValue = 'cancel';
        dialog.close();
        dialog.remove();
    });
});

export { NativeDcat };
