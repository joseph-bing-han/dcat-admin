import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NativeDcat } from './runtime';
import { navigation } from './navigation';
// @ts-expect-error 兼容模块保留 jQuery 的旧调用面。
import $ from 'jquery';
import selectTableScript from '../assets/dcat/extra/select-table.js?raw';

beforeEach(() => {
    navigation.dispose();
    document.body.innerHTML = '<main id="pjax-container"></main>';
    document.dispatchEvent(new CustomEvent('dcat:pjax:before-replace'));
});

afterEach(() => navigation.dispose());

describe('save notices across full page navigation', () => {
    afterEach(() => sessionStorage.clear());

    it('restores a save notice once when PJAX is disabled', async () => {
        const dcat = new NativeDcat({ pjax_container_selector: '' });
        vi.spyOn(dcat, 'reload').mockResolvedValue(undefined);
        dcat.handleJsonResponse({ status: true, data: { type: 'success', message: 'Saved', then: { action: 'redirect', value: location.href } } });
        const notices = vi.fn();
        window.addEventListener('dcat:notice', notices);
        try {
            new NativeDcat();
            await Promise.resolve();
            expect(notices).toHaveBeenCalledTimes(1);
            expect(notices.mock.calls[0][0].detail).toEqual({ tone: 'success', message: 'Saved' });
            new NativeDcat();
            await Promise.resolve();
            expect(notices).toHaveBeenCalledTimes(1);
        } finally { window.removeEventListener('dcat:notice', notices); }
    });

    it('does not persist notices for PJAX or another origin', () => {
        const dcat = new NativeDcat();
        vi.spyOn(dcat, 'reload').mockResolvedValue(undefined);
        dcat.handleJsonResponse({ message: 'Saved', redirect: location.href });
        expect(sessionStorage.getItem('dcat:pending-navigation-notice')).toBeNull();
        const fullPage = new NativeDcat({ pjax_container_selector: '' });
        vi.spyOn(fullPage, 'reload').mockResolvedValue(undefined);
        fullPage.handleJsonResponse({ message: 'Saved', redirect: 'https://example.com/' });
        expect(sessionStorage.getItem('dcat:pending-navigation-notice')).toBeNull();
    });

    it('discards stale, mismatched and malformed navigation notices', async () => {
        const notices = vi.fn();
        window.addEventListener('dcat:notice', notices);
        try {
            for (const raw of [
                JSON.stringify({ tone: 'success', message: 'Old', target: location.pathname + location.search, created: Date.now() - 61000 }),
                JSON.stringify({ tone: 'success', message: 'Other page', target: '/different-page', created: Date.now() }),
                'invalid json',
            ]) {
                sessionStorage.setItem('dcat:pending-navigation-notice', raw);
                new NativeDcat();
                await Promise.resolve();
                expect(sessionStorage.getItem('dcat:pending-navigation-notice')).toBeNull();
            }
            expect(notices).not.toHaveBeenCalled();
        } finally { window.removeEventListener('dcat:notice', notices); }
    });
});

describe('dark mode switcher compatibility', () => {
    afterEach(() => {
        document.body.classList.remove('dark-mode');
        document.dispatchEvent(new CustomEvent('dcat:pjax:before-replace'));
    });

    it('is available immediately and avoids duplicate handlers on reinitialization', () => {
        document.body.innerHTML = '<span class="dark-mode-switcher"><i class="feather icon-moon"></i></span>';
        const dcat = new NativeDcat();
        dcat.darkMode.initSwitcher('.dark-mode-switcher');
        dcat.darkMode.initSwitcher('.dark-mode-switcher');
        const switcher = document.querySelector<HTMLElement>('.dark-mode-switcher')!;
        expect(switcher.getAttribute('role')).toBe('button');
        expect(switcher.tabIndex).toBe(0);
        switcher.click();
        expect(document.body.classList.contains('dark-mode')).toBe(true);
        expect(switcher.getAttribute('aria-pressed')).toBe('true');
        expect(switcher.querySelector('.icon-sun')).not.toBeNull();
        switcher.click();
        expect(document.body.classList.contains('dark-mode')).toBe(false);
        expect(switcher.querySelector('.icon-moon')).not.toBeNull();
    });

    it('supports keyboard activation, existing dark mode, and newly inserted switchers', async () => {
        document.body.classList.add('dark-mode');
        const dcat = new NativeDcat();
        dcat.darkMode.initSwitcher('.dark-mode-switcher');
        document.body.insertAdjacentHTML('beforeend', '<span class="dark-mode-switcher"><i class="feather icon-moon"></i></span>');
        await Promise.resolve();
        const switcher = document.querySelector<HTMLElement>('.dark-mode-switcher')!;
        expect(switcher.getAttribute('aria-pressed')).toBe('true');
        switcher.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        expect(document.body.classList.contains('dark-mode')).toBe(false);
        switcher.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        expect(document.body.classList.contains('dark-mode')).toBe(true);
        switcher.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', repeat: true, bubbles: true }));
        expect(document.body.classList.contains('dark-mode')).toBe(true);
    });

    it('accepts the compat init callback with a jQuery-style first argument', () => {
        document.body.innerHTML = '<span class="dark-mode-switcher"><i class="feather icon-moon"></i></span>';
        const dcat = new NativeDcat();
        const nativeInit = dcat.init.bind(dcat);
        vi.spyOn(dcat, 'init').mockImplementation((selector, callback, options) => nativeInit(selector, function (this: HTMLElement) {
            callback.call(this, { 0: this, length: 1 });
        }, options));
        dcat.darkMode.initSwitcher('.dark-mode-switcher');
        document.querySelector<HTMLElement>('.dark-mode-switcher')!.click();
        expect(document.body.classList.contains('dark-mode')).toBe(true);
    });
});

describe('collapsed sidebar preview', () => {
    beforeEach(() => {
        vi.stubGlobal('innerWidth', 1366);
        document.body.className = 'dcat-modern-active sidebar-collapse';
        document.body.innerHTML = '<button data-widget="pushmenu">Toggle navigation</button><aside class="main-sidebar"><details><summary>Forms</summary><a href="#form">Form</a></details></aside><button id="content">Content</button>';
        window.dispatchEvent(new Event('resize'));
    });

    afterEach(() => {
        document.body.className = '';
        vi.unstubAllGlobals();
    });

    const moveMouse = (type: 'mouseover' | 'mouseout', target: Element, relatedTarget: EventTarget | null) => {
        target.dispatchEvent(new MouseEvent(type, { bubbles: true, relatedTarget }));
    };
    const isPreviewed = () => document.body.classList.contains('sidebar-hover');

    it('previews on entry, stays open within the sidebar and closes on exit without toggling the layout', () => {
        const sidebar = document.querySelector('.main-sidebar')!;
        const summary = sidebar.querySelector('summary')!;
        const changed = vi.fn();
        document.addEventListener('dcat:sidebar:changed', changed);
        try {
            moveMouse('mouseover', sidebar, document.body);
            expect(isPreviewed()).toBe(true);
            expect(document.body.classList.contains('sidebar-collapse')).toBe(true);
            expect(document.querySelector('[data-widget="pushmenu"]')!.getAttribute('aria-expanded')).toBe('false');
            moveMouse('mouseout', sidebar, summary);
            moveMouse('mouseover', summary, sidebar);
            expect(isPreviewed()).toBe(true);
            moveMouse('mouseout', summary, document.querySelector('#content'));
            expect(isPreviewed()).toBe(false);
            expect(changed).not.toHaveBeenCalled();
        } finally {
            document.removeEventListener('dcat:sidebar:changed', changed);
        }
    });

    it('keeps groups usable and dismisses a selected link until the mouse re-enters', () => {
        const sidebar = document.querySelector('.main-sidebar')!;
        const summary = sidebar.querySelector('summary')!;
        const link = sidebar.querySelector('a')!;
        const select = vi.fn((event: Event) => event.preventDefault());
        link.addEventListener('click', select);
        summary.click();
        expect(sidebar.querySelector('details')!.open).toBe(true);
        expect(isPreviewed()).toBe(true);
        expect(document.body.classList.contains('sidebar-collapse')).toBe(true);
        link.click();
        expect(select).toHaveBeenCalledOnce();
        expect(isPreviewed()).toBe(false);
        expect(document.body.classList.contains('sidebar-collapse')).toBe(true);
        moveMouse('mouseover', summary, link);
        expect(isPreviewed()).toBe(false);
        moveMouse('mouseout', summary, document.body);
        moveMouse('mouseover', sidebar, document.body);
        expect(isPreviewed()).toBe(true);
    });

    it('supports keyboard focus without leaving the preview pinned after focus exits', () => {
        const summary = document.querySelector('summary')!;
        summary.focus();
        expect(isPreviewed()).toBe(true);
        summary.click();
        document.querySelector('a')!.focus();
        expect(isPreviewed()).toBe(true);
        document.querySelector<HTMLButtonElement>('#content')!.focus();
        expect(isPreviewed()).toBe(false);
        expect(document.body.classList.contains('sidebar-collapse')).toBe(true);
    });

    it.each(['outside click', 'Escape', 'dcat:pjax:start', 'dcat:pjax:before-replace', 'dcat:pjax:loaded'])('dismisses on %s', (action) => {
        document.querySelector('summary')!.focus();
        expect(isPreviewed()).toBe(true);
        if (action === 'outside click') document.querySelector<HTMLButtonElement>('#content')!.click();
        else if (action === 'Escape') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        else document.dispatchEvent(new CustomEvent(action));
        expect(isPreviewed()).toBe(false);
        expect(document.body.classList.contains('sidebar-collapse')).toBe(true);
        if (action === 'Escape') expect(document.activeElement).toBe(document.querySelector('[data-widget="pushmenu"]'));
    });

    it('keeps the explicit toggle independent from the preview', () => {
        const toggle = document.querySelector<HTMLButtonElement>('[data-widget="pushmenu"]')!;
        moveMouse('mouseover', document.querySelector('.main-sidebar')!, document.body);
        toggle.click();
        expect(isPreviewed()).toBe(false);
        expect(document.body.classList.contains('sidebar-collapse')).toBe(false);
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        toggle.click();
        expect(isPreviewed()).toBe(false);
        expect(document.body.classList.contains('sidebar-collapse')).toBe(true);
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    it('clears the desktop preview at the mobile breakpoint and preserves drawer controls', () => {
        const sidebar = document.querySelector('.main-sidebar')!;
        moveMouse('mouseover', sidebar, document.body);
        vi.stubGlobal('innerWidth', 375);
        window.dispatchEvent(new Event('resize'));
        expect(isPreviewed()).toBe(false);
        moveMouse('mouseover', sidebar, document.body);
        document.querySelector('summary')!.focus();
        expect(isPreviewed()).toBe(false);
        const toggle = document.querySelector<HTMLButtonElement>('[data-widget="pushmenu"]')!;
        toggle.click();
        expect(document.body.classList.contains('sidebar-open')).toBe(true);
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(document.body.classList.contains('sidebar-open')).toBe(false);
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    it.each([375, 767])('closes the mobile drawer on dismissal at %spx and keeps groups usable', (width) => {
        vi.stubGlobal('innerWidth', width);
        const toggle = document.querySelector<HTMLButtonElement>('[data-widget="pushmenu"]')!;
        const changed = vi.fn();
        document.addEventListener('dcat:sidebar:changed', changed);
        try {
            for (const action of ['outside click', 'menu link', 'Escape', 'dcat:pjax:start', 'dcat:pjax:before-replace', 'dcat:pjax:loaded']) {
                toggle.click();
                expect(toggle.getAttribute('aria-expanded')).toBe('true');
                document.querySelector('summary')!.click();
                expect(document.body.classList.contains('sidebar-open')).toBe(true);
                changed.mockClear();
                if (action === 'outside click') document.querySelector<HTMLButtonElement>('#content')!.click();
                else if (action === 'menu link') document.querySelector('a')!.click();
                else if (action === 'Escape') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
                else document.dispatchEvent(new CustomEvent(action));
                expect(document.body.classList.contains('sidebar-open')).toBe(false);
                expect(document.body.classList.contains('sidebar-collapse')).toBe(true);
                expect(toggle.getAttribute('aria-expanded')).toBe('false');
                expect(changed).toHaveBeenCalledOnce();
                expect(changed.mock.calls[0][0].detail).toEqual({ collapsed: true, open: false });
                if (action === 'Escape') expect(document.activeElement).toBe(toggle);
            }
        } finally {
            document.removeEventListener('dcat:sidebar:changed', changed);
        }
    });

    it.each(['dcat-modern-active', 'dcat-modern-active sidebar-collapse horizontal-menu', 'sidebar-collapse'])('does not preview outside the collapsed modern vertical layout: %s', (classes) => {
        document.body.className = classes;
        moveMouse('mouseover', document.querySelector('.main-sidebar')!, document.body);
        document.querySelector('summary')!.focus();
        document.querySelector('summary')!.click();
        expect(isPreviewed()).toBe(false);
    });
});

describe('native Dcat public lifecycle', () => {
    it('previews uploaded data images in a dialog and returns focus after closing', () => {
        Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.setAttribute('open', ''); } });
        Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); } });
        const dcat = new NativeDcat();
        const button = document.createElement('button');
        document.body.appendChild(button);
        button.focus();
        const open = vi.spyOn(window, 'open');
        const url = 'data:image/png;base64,aGVsbG8=';
        dcat.helpers.previewImage(url, null, 'Avatar');
        const dialog = document.querySelector<HTMLDialogElement>('.dcat-modern-image-preview')!;
        expect(dialog.open).toBe(true);
        expect(dialog.querySelector('img')!.src).toBe(url);
        expect(dialog.querySelector('img')!.alt).toBe('Avatar');
        expect(dialog.getAttribute('aria-busy')).toBe('true');
        expect(dialog.querySelector('[role="status"]')!.textContent).toBe('Loading image…');
        expect(dialog.querySelector('img')!.hidden).toBe(true);
        dialog.querySelector('img')!.dispatchEvent(new Event('load'));
        expect(dialog.querySelector('img')!.hidden).toBe(false);
        expect(dialog.querySelector<HTMLElement>('[role="status"]')!.hidden).toBe(true);
        expect(dialog.getAttribute('aria-busy')).toBe('false');
        expect(open).not.toHaveBeenCalled();
        dialog.querySelector('button')!.click();
        expect(dialog.isConnected).toBe(false);
        expect(document.activeElement).toBe(button);
    });
    it('keeps an accessible error state for failed images and ignores late events after closing', () => {
        Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.setAttribute('open', ''); } });
        Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); } });
        const trigger = document.createElement('button');
        document.body.appendChild(trigger);
        trigger.focus();
        const dialog = new NativeDcat().helpers.previewImage('/missing-image.jpg', null, 'Avatar')!;
        const image = dialog.querySelector('img')!;
        image.dispatchEvent(new Event('error'));
        const status = dialog.querySelector<HTMLElement>('[role="status"]')!;
        expect(dialog.open).toBe(true);
        expect(image.hidden).toBe(true);
        expect(status.hidden).toBe(false);
        expect(status.textContent).toBe('Unable to load image.');
        expect(dialog.getAttribute('aria-busy')).toBe('false');
        dialog.querySelector('button')!.click();
        expect(dialog.isConnected).toBe(false);
        expect(document.activeElement).toBe(trigger);
        image.dispatchEvent(new Event('load'));
        expect(image.hidden).toBe(true);
        expect(status.hidden).toBe(false);
    });
    it.each([0, 240])('resolves already complete image state with natural width %i', (width) => {
        Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.setAttribute('open', ''); } });
        Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); } });
        vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
        vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(width);
        const dialog = new NativeDcat().helpers.previewImage('/cached-image.png')!;
        expect(dialog.getAttribute('aria-busy')).toBe('false');
        expect(dialog.querySelector('img')!.hidden).toBe(width === 0);
        const status = dialog.querySelector<HTMLElement>('[role="status"]')!;
        expect(status.hidden).toBe(width > 0);
        if (width === 0) expect(status.textContent).toBe('Unable to load image.');
        dialog.close();
    });
    it('shows one fullscreen loading indicator and removes it when finished', () => {
        const dcat = new NativeDcat();
        dcat.loading();
        dcat.loading();
        expect(document.querySelectorAll('[data-dcat-fullscreen-loading]')).toHaveLength(1);
        expect(document.querySelector('[role="status"] .dcat-modern-loading-spinner')).not.toBeNull();
        expect(document.body.getAttribute('aria-busy')).toBe('true');
        dcat.loading(false);
        expect(document.querySelector('[data-dcat-fullscreen-loading]')).toBeNull();
        expect(document.documentElement.classList.contains('dcat-is-loading')).toBe(false);
        expect(document.body.getAttribute('aria-busy')).toBe('false');
    });
    it('toggles only the async table filter and preserves its submit handler', () => {
        new NativeDcat();
        document.querySelector('#pjax-container')!.innerHTML = '<div class="async-table"><div class="filter-button-group"><button type="button">Filter</button></div><div class="filter-box d-none"><form class="grid-filter-form"><input name="username"><button>Search</button></form></div><table></table></div>';
        const table = document.querySelector<HTMLElement>('.async-table')!;
        const button = table.querySelector<HTMLButtonElement>('.filter-button-group button')!;
        const filter = table.querySelector<HTMLElement>('.filter-box')!;
        const form = table.querySelector<HTMLFormElement>('form')!;
        const submit = vi.fn((event: Event) => event.preventDefault());
        form.addEventListener('submit', submit);
        button.click();
        expect(filter.classList.contains('d-none')).toBe(false);
        expect(table.classList.contains('d-none')).toBe(false);
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        expect(submit).toHaveBeenCalledOnce();
        button.click();
        expect(filter.classList.contains('d-none')).toBe(true);
        expect(table.classList.contains('d-none')).toBe(false);
    });

    it('keeps native grid selection working when table ancestors cancel clicks', () => {
        new NativeDcat();
        document.querySelector('#pjax-container')!.innerHTML = '<section class="dcat-modern-grid-view"><table><thead><tr><th><input type="checkbox" class="select-all" data-dcat-grid-select-all="1"></th></tr></thead><tbody><tr><td><input type="checkbox" data-dcat-grid-row-selector="1"></td></tr><tr><td><input type="checkbox" data-dcat-grid-row-selector="1"></td></tr></tbody></table></section>';
        const table = document.querySelector('table')!;
        table.addEventListener('click', (event) => event.preventDefault());
        const selectAll = table.querySelector<HTMLInputElement>('.select-all')!;
        const rows = Array.from(table.querySelectorAll<HTMLInputElement>('[data-dcat-grid-row-selector]'));
        selectAll.click();
        expect(selectAll.checked).toBe(true);
        expect(rows.every((input) => input.checked)).toBe(true);
        rows[0].click();
        expect(selectAll.checked).toBe(false);
        expect(selectAll.indeterminate).toBe(true);
        selectAll.click();
        selectAll.click();
        expect(rows.every((input) => !input.checked)).toBe(true);
    });

    it.each([false, true])('passes row changes to SelectTable and synchronizes its final selection (multiple=%s)', (multiple) => {
        const dcat = new NativeDcat();
        vi.stubGlobal('$', $);
        vi.stubGlobal('Dcat', dcat);
        // 使用实际兼容脚本，防止只验证 Grid 视觉勾选而遗漏字段回填。
        new Function(selectTableScript)();
        document.querySelector('main')!.innerHTML = `<div id="selected"><span class="default-text">Choose</span><span class="option d-none"></span><input name="customer_id" type="hidden"></div>
            <div id="selection-dialog"><button class="submit-btn">Select</button><button class="cancel-btn">Cancel</button><div class="async-table"><section class="dcat-modern-grid-view"><table>
            <thead><tr><th><div class="checkbox-grid-header"><input type="checkbox" class="select-all" data-dcat-grid-select-all="1"></div></th></tr></thead>
            <tbody>${['Alice', 'Bob', 'Carol'].map((label, i) => `<tr><td><div class="checkbox-grid-column"><input type="checkbox" data-dcat-grid-row-selector="1" data-dcat-row-clickable="1" data-id="${i + 1}" data-label="${label}"></div></td><td>${label}</td></tr>`).join('')}</tbody></table></section></div></div>`;
        const dialog = $('#selection-dialog');
        const selector = (dcat.grid as any).SelectTable({ dialog: '#selection-dialog', container: '#selected', input: '#selected input', multiple, max: multiple ? 2 : 0 });
        const rows = Array.from(document.querySelectorAll<HTMLInputElement>('[data-dcat-grid-row-selector]'));
        const input = document.querySelector<HTMLInputElement>('#selected input')!;
        const changed = vi.fn();
        $(input).on('change', changed);
        const open = () => { dialog.trigger('dialog:shown'); dialog.find('.async-table').trigger('table:loaded'); };
        try {
            open();
            rows[0].click();
            rows[1].closest('tr')!.querySelector('td:last-child')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            expect(selector.getSelectedRows()[1]).toEqual(multiple ? ['1', '2'] : ['2']);
            expect(rows[0].checked).toBe(multiple);
            expect(rows[0].closest('tr')!.classList.contains('dcat-modern-grid-row-selected')).toBe(multiple);
            if (multiple) {
                rows[2].click();
                expect(rows[2].checked).toBe(false);
                expect(rows[2].closest('tr')!.classList.contains('dcat-modern-grid-row-selected')).toBe(false);
            }
            dialog.find('.submit-btn').trigger('click');
            expect(input.value).toBe(multiple ? '1,2' : '2');
            expect($('#selected .option').text()).toContain('Bob');
            expect(changed).toHaveBeenCalledOnce();
            dialog.find('button').off('click');
            dialog.find('.async-table').off('table:loaded');
            open();
            expect(rows[1].checked).toBe(true);
            rows[1].click();
            dialog.find('.cancel-btn').trigger('click');
            expect(input.value).toBe(multiple ? '1,2' : '2');
            if (multiple) {
                document.querySelector<HTMLInputElement>('.select-all')!.click();
                expect(selector.getSelectedRows()[1]).toEqual(['1', '2']);
                expect(rows[2].checked).toBe(false);
            }
        } finally {
            $(document).off('dialog:shown', '#selection-dialog');
            vi.unstubAllGlobals();
        }
    });

    it.each(['link', 'icon', 'keyboard click'])('sorts compatibility headers through PJAX on %s despite header press handlers', (action) => {
        new NativeDcat();
        const navigate = vi.spyOn(navigation, 'navigate').mockResolvedValue(undefined);
        document.querySelector('main')!.innerHTML = '<section class="dcat-modern-grid-view"><table><thead><tr><th><span data-dcat-modern-legacy-island="grid-header-cell"><a class="grid-sort" href="/expenses?filter-total%5Bstart%5D=20&_sort%5Bcolumn%5D=total&_sort%5Btype%5D=desc"><i>Sort</i></a></span></th></tr></thead></table></section>';
        const headerPress = vi.fn((event: Event) => event.preventDefault());
        document.querySelector('th')!.addEventListener('pointerdown', headerPress);
        document.querySelector('th')!.addEventListener('click', headerPress);
        const link = document.querySelector<HTMLAnchorElement>('a.grid-sort')!;
        const target = action === 'icon' ? link.querySelector<HTMLElement>('i')! : link;
        try {
            if (action !== 'keyboard click') target.dispatchEvent(new Event('pointerdown', { bubbles: true }));
            target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: action === 'keyboard click' ? 0 : 1 }));
            expect(headerPress).not.toHaveBeenCalled();
            expect(navigate).toHaveBeenCalledOnce();
            const url = new URL(navigate.mock.calls[0][1]);
            expect(url.pathname).toBe('/expenses');
            expect(url.searchParams.get('_sort[column]')).toBe('total');
            expect(url.searchParams.get('_sort[type]')).toBe('desc');
            expect(url.searchParams.get('filter-total[start]')).toBe('20');
        } finally { navigate.mockRestore(); }
    });

    it.each(['ctrlKey', 'metaKey', 'shiftKey', 'altKey', 'new window'])('preserves native sort link behavior for %s', (modifier) => {
        new NativeDcat();
        const navigate = vi.spyOn(navigation, 'navigate').mockResolvedValue(undefined);
        document.querySelector('main')!.innerHTML = '<section class="dcat-modern-grid-view"><table><thead><tr><th><a class="grid-sort" href="/expenses?_sort%5Bcolumn%5D=total">Sort</a></th></tr></thead></table></section>';
        const link = document.querySelector<HTMLAnchorElement>('a.grid-sort')!;
        if (modifier === 'new window') link.target = '_blank';
        const click = new MouseEvent('click', { bubbles: true, cancelable: true, ...(modifier === 'new window' ? {} : { [modifier]: true }) });
        document.querySelector('th')!.addEventListener('click', (event) => event.preventDefault());
        try {
            link.dispatchEvent(click);
            expect(click.defaultPrevented).toBe(false);
            expect(navigate).not.toHaveBeenCalled();
        } finally { navigate.mockRestore(); }
    });

    it.each(['button', 'icon', 'submit', 'enter'])('submits a column filter through PJAX on %s', (action) => {
        new NativeDcat();
        const navigate = vi.spyOn(navigation, 'navigate').mockResolvedValue(undefined);
        document.querySelector('main')!.innerHTML = '<section class="dcat-modern-grid-view"><table><thead><tr><th><span class="dropdown"><form action="/expenses?category=tools&page=1&filter-total%5Bstart%5D=10" pjax-container><a href="#" data-toggle="dropdown">Amount</a><ul class="dropdown-menu"><li><input name="filter-total[start]" value="20" required><input name="filter-total[end]" value="80"></li><li><button class="column-filter-submit"><i>Search</i></button></li></ul></form></span></th></tr></thead></table></section>';
        const form = document.querySelector('form')!;
        const button = form.querySelector<HTMLButtonElement>('button')!;
        document.querySelector('th')!.addEventListener('click', (event) => event.preventDefault());
        try {
            form.querySelector<HTMLAnchorElement>('[data-toggle]')!.click();
            if (action === 'button') button.click();
            else if (action === 'icon') button.querySelector<HTMLElement>('i')!.click();
            else if (action === 'enter') form.querySelector('input')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
            else form.requestSubmit(button);
            expect(navigate).toHaveBeenCalledOnce();
            const url = new URL(navigate.mock.calls[0][1]);
            expect(url.pathname).toBe('/expenses');
            expect(url.searchParams.getAll('filter-total[start]')).toEqual(['20']);
            expect(url.searchParams.get('filter-total[end]')).toBe('80');
            expect(url.searchParams.get('category')).toBe('tools');
            expect(url.searchParams.get('page')).toBe('1');
            expect(form.querySelector('.dropdown-menu')!.classList.contains('show')).toBe(false);
        } finally { navigate.mockRestore(); }
    });

    it('keeps an invalid column filter open without navigating', () => {
        new NativeDcat();
        const navigate = vi.spyOn(navigation, 'navigate').mockResolvedValue(undefined);
        document.querySelector('main')!.innerHTML = '<section class="dcat-modern-grid-view"><span class="dropdown"><form pjax-container><a href="#" data-toggle="dropdown">Amount</a><ul class="dropdown-menu"><li><input required></li><li><button class="column-filter-submit">Search</button></li></ul></form></span></section>';
        try {
            document.querySelector<HTMLAnchorElement>('[data-toggle]')!.click();
            document.querySelector<HTMLButtonElement>('.column-filter-submit')!.click();
            expect(navigate).not.toHaveBeenCalled();
            expect(document.querySelector('.dropdown-menu')!.classList.contains('show')).toBe(true);
        } finally { navigate.mockRestore(); }
    });

    it('resets a column filter through PJAX when the header cancels link defaults', () => {
        new NativeDcat();
        const navigate = vi.spyOn(navigation, 'navigate').mockResolvedValue(undefined);
        document.querySelector('main')!.innerHTML = '<section class="dcat-modern-grid-view"><table><thead><tr><th><span class="dropdown"><form pjax-container><a href="#" data-toggle="dropdown">Amount</a><ul class="dropdown-menu"><li><button class="column-filter-submit">Search</button><a class="btn-default" href="/expenses?category=tools"><i>Reset</i></a></li></ul></form></span></th></tr></thead></table></section>';
        document.querySelector('th')!.addEventListener('click', (event) => event.preventDefault());
        try {
            document.querySelector<HTMLAnchorElement>('[data-toggle]')!.click();
            document.querySelector<HTMLElement>('.btn-default i')!.click();
            expect(navigate).toHaveBeenCalledOnce();
            expect(new URL(navigate.mock.calls[0][1]).pathname).toBe('/expenses');
            expect(new URL(navigate.mock.calls[0][1]).search).toBe('?category=tools');
            expect(document.querySelector('.dropdown-menu')!.classList.contains('show')).toBe(false);
        } finally { navigate.mockRestore(); }
    });

    it('keeps column filter pointer presses out of table header press handlers', () => {
        new NativeDcat();
        document.querySelector('main')!.innerHTML = '<section class="dcat-modern-grid-view"><table><thead><tr><th><span class="dropdown"><form><a id="range" href="#" data-toggle="dropdown"><i>Amount</i></a><ul class="dropdown-menu"><li><input></li></ul></form></span></th></tr></thead></table></section>';
        const headerPress = vi.fn();
        document.querySelector('th')!.addEventListener('pointerdown', headerPress);
        const icon = document.querySelector('#range i')!;
        icon.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        expect(headerPress).not.toHaveBeenCalled();
        document.querySelector<HTMLAnchorElement>('#range')!.click();
        expect(document.querySelector('.dropdown-menu')!.classList.contains('show')).toBe(true);
        document.querySelector('input')!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        expect(headerPress).toHaveBeenCalledOnce();
    });

    it.each(['toggle', 'outside', 'escape', 'other-menu', 'resize', 'scroll', 'pjax'])('closes a column filter nested inside a form on %s', (action) => {
        new NativeDcat();
        document.querySelector('main')!.innerHTML = '<section class="dcat-modern-grid-view"><span class="dropdown"><form><a id="range" href="#" data-toggle="dropdown">Amount</a><ul class="dropdown-menu" style="min-width: 180px; padding: 10px"><li><input name="amount[start]"></li><li><button type="submit">Search</button></li></ul></form></span><div class="dropdown"><button id="other" data-toggle="dropdown">Other</button><ul class="dropdown-menu"><li><a href="#">Item</a></li></ul></div></section>';
        const trigger = document.querySelector<HTMLAnchorElement>('#range')!;
        const menu = document.querySelector<HTMLElement>('.dropdown-menu')!;
        const originalStyle = menu.getAttribute('style');
        trigger.click();
        expect(menu.classList.contains('show')).toBe(true);
        expect(menu.style.position).toBe('fixed');
        menu.querySelector('input')!.click();
        expect(menu.classList.contains('show')).toBe(true);
        if (action === 'toggle') trigger.click();
        else if (action === 'outside') document.body.click();
        else if (action === 'escape') menu.querySelector('input')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        else if (action === 'other-menu') document.querySelector<HTMLButtonElement>('#other')!.click();
        else if (action === 'resize') window.dispatchEvent(new Event('resize'));
        else if (action === 'scroll') document.dispatchEvent(new Event('scroll'));
        else document.dispatchEvent(new CustomEvent('dcat:pjax:start'));
        expect(menu.classList.contains('show')).toBe(false);
        expect(trigger.closest('.dropdown')!.classList.contains('show')).toBe(false);
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(menu.getAttribute('style')).toBe(originalStyle);
        if (action === 'escape') expect(document.activeElement).toBe(trigger);
        trigger.click();
        expect(menu.classList.contains('show')).toBe(true);
        trigger.click();
        expect(menu.classList.contains('show')).toBe(false);
        expect(menu.getAttribute('style')).toBe(originalStyle);
    });

    it.each([
        { left: 700, top: 400, expectedLeft: 600, expectedTop: 156 },
        { left: 740, top: 400, expectedLeft: 617, expectedTop: 156 },
        { left: 10, top: 20, expectedLeft: 8, expectedTop: 56 },
    ])('keeps the page-size dropup visible and anchored at $left/$top', ({ left, top, expectedLeft, expectedTop }) => {
        new NativeDcat();
        document.querySelector('main')!.innerHTML = '<div class="dcat-modern-grid-view"><div class="dropdown dropup"><button data-toggle="dropdown">20</button><ul class="dropdown-menu"><li><a href="#">20</a></li></ul></div></div>';
        const trigger = document.querySelector<HTMLButtonElement>('[data-toggle="dropdown"]')!;
        const menu = document.querySelector<HTMLElement>('.dropdown-menu')!;
        vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(785);
        vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(600);
        vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({ left, right: left + 60, top, bottom: top + 32, width: 60, height: 32 } as DOMRect);
        vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue({ width: 160, height: 240 } as DOMRect);
        try {
            trigger.click();
            expect(trigger.getAttribute('aria-expanded')).toBe('true');
            expect(menu.style.left).toBe(`${expectedLeft}px`);
            expect(menu.style.top).toBe(`${expectedTop}px`);
            trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            expect(trigger.getAttribute('aria-expanded')).toBe('false');
            expect(document.activeElement).toBe(trigger);
            expect(menu.getAttribute('style')).toBeNull();
        } finally { vi.restoreAllMocks(); }
    });

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
