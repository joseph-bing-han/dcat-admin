import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutMenuView, type LayoutMenuItem } from './layout';

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
