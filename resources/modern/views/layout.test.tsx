import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutMenuView, type LayoutMenuItem } from './layout';
import { navigation, type NavigationHost } from '../navigation';

it.each([false, true])('keeps the collapsed layout when toggling a previewed group that was open=%s', (active) => {
    const container = document.createElement('div');
    const toggle = document.createElement('button');
    toggle.dataset.widget = 'pushmenu';
    const onToggle = vi.fn(() => document.body.classList.remove('sidebar-collapse'));
    toggle.addEventListener('click', onToggle);
    document.body.append(toggle, container);
    document.body.classList.add('sidebar-collapse', 'sidebar-hover');
    const root = createRoot(container);
    try {
        act(() => root.render(<LayoutMenuView payload={{ horizontal: false, defaultIcon: '', items: [{
            id: '1', title: 'Forms', icon: '', url: '', external: false, active,
            children: [{ id: '2', title: 'Modal', icon: '', url: '/admin/form/modal', external: false, active: false, children: [] }],
        }] }} />));
        act(() => container.querySelector('summary')!.click());
        expect(onToggle).not.toHaveBeenCalled();
        expect(document.body.classList.contains('sidebar-collapse')).toBe(true);
        expect(document.body.classList.contains('sidebar-hover')).toBe(true);
        expect(container.querySelector('details')!.open).toBe(!active);
        expect(container.querySelector('a')!.getAttribute('href')).toBe('/admin/form/modal');
        act(() => container.querySelector('summary')!.click());
        expect(container.querySelector('details')!.open).toBe(active);
    } finally {
        act(() => root.unmount());
        container.remove();
        toggle.remove();
        document.body.classList.remove('sidebar-collapse', 'sidebar-hover');
    }
});

it.each([[1366, 'mouse'], [1366, 'keyboard'], [375, 'mouse'], [375, 'keyboard']] as const)('routes a menu selection through PJAX and closes transient navigation at %spx using %s', (width, input) => {
    vi.stubGlobal('innerWidth', width);
    const dcat: NavigationHost = { config: { pjax_container_selector: '#pjax-container' }, wait: vi.fn(), triggerReady: vi.fn(), error: vi.fn() };
    vi.stubGlobal('Dcat', dcat);
    const navigate = vi.spyOn(navigation, 'navigate').mockResolvedValue(undefined);
    const container = document.createElement('div');
    document.body.appendChild(container);
    document.body.classList.add('sidebar-collapse', 'sidebar-hover');
    if (width < 768) document.body.classList.add('sidebar-open');
    const root = createRoot(container);
    try {
        act(() => root.render(<LayoutMenuView payload={{ horizontal: false, defaultIcon: '', items: [{
            id: '1', title: 'Forms', icon: '', url: '/admin/form?tab=fields', external: false, active: false, children: [],
        }] }} />));
        const link = container.querySelector('a')!;
        act(() => {
            if (input === 'keyboard') link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            link.click();
            if (input === 'keyboard') link.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
        });
        expect(navigate).toHaveBeenCalledExactlyOnceWith(dcat, '/admin/form?tab=fields');
        expect(document.body.classList.contains('sidebar-collapse')).toBe(true);
        expect(document.body.classList.contains('sidebar-hover')).toBe(false);
        expect(document.body.classList.contains('sidebar-open')).toBe(false);
    } finally {
        act(() => root.unmount());
        container.remove();
        document.body.classList.remove('sidebar-collapse', 'sidebar-hover', 'sidebar-open');
        vi.unstubAllGlobals();
    }
});

it('keeps absolute same-origin menus in the current window and preserves external links', () => {
    const leaf = (title: string, url: string, external = false): LayoutMenuItem => ({
        id: title, title, icon: '', url, external, active: false, children: [],
    });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
        act(() => root.render(<LayoutMenuView payload={{ horizontal: false, defaultIcon: '', items: [
            leaf('Users', `${location.origin}/admin/auth/users?page=2#roles`),
            leaf('Grid', '/admin/components/grid'),
            leaf('Docs', 'https://example.com/docs', true),
        ] }} />));
        const links = Array.from(container.querySelectorAll<HTMLAnchorElement>('a'));
        expect(links[0].getAttribute('href')).toBe('/admin/auth/users?page=2#roles');
        for (const link of links.slice(0, 2)) {
            expect(link.target).toBe('_self');
            expect(link.hasAttribute('rel')).toBe(false);
            expect(link.querySelector(':scope > svg')).toBeNull();
        }
        expect(links[2].href).toBe('https://example.com/docs');
        expect(links[2].target).toBe('_blank');
        expect(links[2].rel).toBe('noopener noreferrer');
        expect(links[2].querySelector(':scope > svg')).not.toBeNull();
    } finally {
        act(() => root.unmount());
        container.remove();
    }
});

it.each([false, true])('renders default circles and bare Font Awesome icons in horizontal=%s menus', (horizontal) => {
    const container = document.createElement('div');
    const root = createRoot(container);
    try {
        act(() => root.render(<LayoutMenuView payload={{ horizontal, defaultIcon: 'feather icon-circle', items: [
            { id: '1', title: 'Default', icon: '', url: '/admin', external: false, active: false, children: [] },
            { id: '2', title: 'Custom', icon: 'fa-cubes', url: '/admin/custom', external: false, active: false, children: [] },
        ] }} />));
        const icons = container.querySelectorAll('a > i');
        expect(icons[0].querySelector('svg circle')).not.toBeNull();
        expect(icons[0].classList.contains('feather')).toBe(false);
        expect(icons[1].classList.contains('fa')).toBe(true);
        expect(icons[1].classList.contains('fa-cubes')).toBe(true);
    } finally {
        act(() => root.unmount());
    }
});

it('opens nested groups independently when added menus reuse database IDs', () => {
    const leaf = (title: string): LayoutMenuItem => ({ id: '2', title, icon: '', url: `/admin/${title}`, external: false, active: false, children: [] });
    const group = (title: string, children: LayoutMenuItem[]): LayoutMenuItem => ({ ...leaf(title), id: '1', url: '', children });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
        // 垂直侧栏由上游 app-navigation 行组件渲染：分组是 <details>/<summary>，叶子是 <a>。
        act(() => root.render(<LayoutMenuView payload={{ horizontal: false, defaultIcon: '', items: [group('Admin', [leaf('Users')]), group('Forms', [group('Layouts', [leaf('Columns')])])] }} />));
        const groups = Array.from(container.querySelectorAll<HTMLDetailsElement>('details'));
        const toggles = Array.from(container.querySelectorAll<HTMLElement>('summary'));
        expect(groups).toHaveLength(3);
        expect(toggles).toHaveLength(3);
        // 菜单项 id 仍保留在 DOM 上（标记契约），且行组件来自上游 NavItemBase。
        expect(container.querySelectorAll<HTMLElement>('li[data-dcat-menu-group="1"]')).toHaveLength(3);
        expect(container.querySelectorAll<HTMLElement>('li[data-dcat-menu-leaf="1"]')).toHaveLength(2);
        expect(groups.every((element) => element.closest('.nav-sidebar') !== null)).toBe(true);
        const locationBefore = location.href;
        act(() => toggles[1].click());
        expect(groups[1].open).toBe(true);
        expect(groups[0].open).toBe(false);
        const nestedGroup = groups[2];
        const nestedToggle = nestedGroup.querySelector<HTMLElement>('summary')!;
        act(() => nestedToggle.click());
        expect(nestedGroup.open).toBe(true);
        expect(container.querySelector('a[href="/admin/Columns"]')).not.toBeNull();
        expect(location.href).toBe(locationBefore);
        act(() => toggles[1].click());
        expect(groups[1].open).toBe(false);
        expect(errors).not.toHaveBeenCalled();
    } finally {
        act(() => root.unmount());
        container.remove();
    }
});
