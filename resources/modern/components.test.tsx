import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Alert, Button, Card, computeFloatingPosition, DropdownMenu, ErrorState, Input, MenuItem, Panel, Popover, Switch, Tabs, Textarea } from './components';

describe('modern primitives', () => {
    it('renders accessible disabled/loading button semantics', async () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        const press = vi.fn();
        await act(async () => {
            root.render(<Button loading onPress={press}>Save</Button>);
        });
        const button = host.querySelector('button');
        expect(button?.hasAttribute('data-pending')).toBe(true);
        expect(button?.disabled).toBe(false);
        await act(async () => button?.click());
        expect(press).not.toHaveBeenCalled();
        await act(async () => root.render(<Button onPress={press}>Save</Button>));
        await act(async () => button?.click());
        expect(press).toHaveBeenCalledTimes(1);
        await act(async () => root.unmount());
        host.remove();
    });

    it('uses alert semantics for danger feedback', async () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        await act(async () => {
            root.render(<Alert tone="danger">Failed</Alert>);
        });
        expect(host.querySelector('[role="alert"]')?.textContent).toContain('Failed');
        await act(async () => root.unmount());
        host.remove();
    });

    it('keeps native input name semantics intact', async () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        await act(async () => {
            root.render(<Input name="profile[first_name]" />);
        });
        expect(host.querySelector('input')?.getAttribute('name')).toBe('profile[first_name]');
        await act(async () => root.unmount());
        host.remove();
    });

    it('provides Bootstrap-independent textarea, panel, card, and error primitives', async () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        await act(async () => root.render(
            <Panel aria-label="Profile panel">
                <Card><Textarea name="profile[bio]" /></Card>
                <ErrorState title="Invalid profile" description="Check the highlighted fields." />
            </Panel>,
        ));
        expect(host.querySelector('textarea')?.getAttribute('name')).toBe('profile[bio]');
        expect(host.querySelector('.dcat-modern-panel')).not.toBeNull();
        expect(host.querySelector('.dcat-modern-card')).not.toBeNull();
        expect(host.querySelector('[role="alert"]')?.textContent).toContain('Invalid profile');
        await act(async () => root.unmount());
        host.remove();
    });

    it('provides semantic switches', async () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        const change = vi.fn();
        await act(async () => root.render(<Switch label="Enabled" name="enabled" onChange={change} />));
        expect(host.querySelector('[role="switch"]')?.getAttribute('name')).toBe('enabled');
        await act(async () => host.querySelector<HTMLInputElement>('input')?.click());
        expect(change).toHaveBeenCalledWith(true);
        expect(host.querySelector('.dcat-modern-switch')?.hasAttribute('data-selected')).toBe(true);
        await act(async () => root.render(<Switch label="Enabled" name="enabled" disabled onChange={change} />));
        await act(async () => host.querySelector<HTMLInputElement>('input')?.click());
        expect(change).toHaveBeenCalledTimes(1);
        await act(async () => root.unmount());
        host.remove();
    });

    it('links tabs to their panels', async () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        await act(async () => root.render(<Tabs items={[{ id: 'general', label: 'General', panel: 'General panel' }, { id: 'advanced', label: 'Advanced', panel: 'Advanced panel' }]} />));
        const selected = host.querySelector('[role="tab"][aria-selected="true"]');
        expect(selected?.getAttribute('aria-controls')).toBe('general-panel');
        expect(host.querySelector('#general-panel')?.textContent).toContain('General panel');
        await act(async () => root.unmount());
        host.remove();
    });

    it('flips a floating panel above when the viewport bottom would collide', () => {
        const result = computeFloatingPosition(
            { top: 730, left: 100, right: 200, bottom: 760, width: 100, height: 30 },
            { width: 240, height: 180 },
            { width: 1024, height: 768 },
        );
        expect(result.placement).toBe('top');
        expect(result.top).toBe(544);
    });

    it('clamps floating panels inside the horizontal viewport safety margin', () => {
        const result = computeFloatingPosition(
            { top: 50, left: 370, right: 390, bottom: 80, width: 20, height: 30 },
            { width: 200, height: 80 },
            { width: 390, height: 844 },
        );
        expect(result.left).toBe(182);
        expect(result.placement).toBe('bottom');
    });

    it('closes dropdown menus with Escape and restores focus to the trigger', async () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        await act(async () => root.render(
            <DropdownMenu label="Actions">
                <MenuItem>First</MenuItem>
                <MenuItem>Second</MenuItem>
            </DropdownMenu>,
        ));
        const trigger = host.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')!;
        await act(async () => trigger.click());
        const first = host.querySelector<HTMLButtonElement>('[role="menuitem"]')!;
        expect(document.activeElement).toBe(first);
        await act(async () => {
            first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        });
        expect(host.querySelector('[role="menu"]')).toBeNull();
        expect(document.activeElement).toBe(trigger);
        await act(async () => root.unmount());
        host.remove();
    });

    it('closes popovers on Escape and outside pointer input', async () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        await act(async () => root.render(<Popover label="Details"><button type="button">Inside</button></Popover>));
        const trigger = host.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!;
        await act(async () => trigger.click());
        const panel = host.querySelector<HTMLElement>('[role="dialog"]')!;
        await act(async () => {
            panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        });
        expect(host.querySelector('[role="dialog"]')).toBeNull();
        expect(document.activeElement).toBe(trigger);

        await act(async () => trigger.click());
        await act(async () => {
            document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        });
        expect(host.querySelector('[role="dialog"]')).toBeNull();
        await act(async () => root.unmount());
        host.remove();
    });
});
