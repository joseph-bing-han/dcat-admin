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
        act(() => root.render(<LayoutMenuView payload={{ horizontal: false, defaultIcon: '', items: [group('Admin', [leaf('Users')]), group('Forms', [group('Layouts', [leaf('Columns')])])] }} />));
        const toggles = container.querySelectorAll<HTMLAnchorElement>('a[aria-expanded]');
        const locationBefore = location.href;
        act(() => toggles[1].click());
        expect(toggles[0].getAttribute('aria-expanded')).toBe('false');
        expect(toggles[1].getAttribute('aria-expanded')).toBe('true');
        const nested = container.querySelector<HTMLAnchorElement>('.nav-treeview a[aria-expanded]')!;
        act(() => nested.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })));
        expect(nested.getAttribute('aria-expanded')).toBe('true');
        expect(container.querySelector('a[href="/admin/Columns"]')).not.toBeNull();
        expect(location.href).toBe(locationBefore);
        act(() => toggles[1].click());
        expect(container.querySelector('a[href="/admin/Columns"]')).toBeNull();
        expect(errors).not.toHaveBeenCalled();
    } finally {
        act(() => root.unmount());
        container.remove();
    }
});
