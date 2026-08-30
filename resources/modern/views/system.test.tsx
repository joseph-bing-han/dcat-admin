import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { readSystemModel, SystemView, type SystemViewPayload } from './system';

async function render(payload: SystemViewPayload, fallback = '<div data-dcat-modern-fallback></div>') {
    const owner = document.createElement('div');
    owner.innerHTML = fallback;
    document.body.appendChild(owner);
    const host = document.createElement('div');
    owner.appendChild(host);
    const root = createRoot(host);
    await act(async () => root.render(<SystemView model={readSystemModel(owner, payload)} />));
    return { owner, host, root };
}

describe('System modern view', () => {
    it('renders login controls with Dcat UI primitives and stable protocol names', async () => {
        const { owner, host, root } = await render({
            page: 'login',
            action: '/admin/auth/login',
            remember: true,
            csrf: 'token',
            adminName: 'Dcat Admin',
            welcome: 'Welcome back',
            submitLabel: 'Login',
            labels: { username: 'Username', password: 'Password', remember: 'Remember me' },
            old: { username: 'alice', remember: true },
            errors: {},
        });
        expect(host.querySelector('[data-dcat-modern-system-renderer="login"]')).not.toBeNull();
        expect(host.querySelector('.dcat-modern-card')).not.toBeNull();
        expect(host.querySelector('.card,.card-body,.form-group,.form-control,.btn')).toBeNull();
        expect(host.querySelector<HTMLInputElement>('input[name="username"]')?.value).toBe('alice');
        expect(host.querySelector<HTMLInputElement>('input[name="remember"]')?.checked).toBe(true);
        expect(host.querySelector<HTMLInputElement>('input[name="_token"]')?.value).toBe('token');
        await act(async () => root.unmount());
        owner.remove();
    });

    it('renders native feedback and dismisses it without Bootstrap data attributes', async () => {
        const { owner, host, root } = await render({
            page: 'feedback',
            tone: 'success',
            title: 'Saved',
            messages: ['Changes persisted'],
            renderer: 'native',
        });
        const feedback = host.querySelector<HTMLElement>('[data-dcat-modern-system-renderer="feedback"]')!;
        expect(feedback.classList.contains('dcat-modern-alert')).toBe(true);
        expect(feedback.classList.contains('alert')).toBe(false);
        expect(feedback.textContent).toContain('Changes persisted');
        await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Dismiss notification"]')?.click());
        expect(host.querySelector('[data-dcat-modern-system-renderer="feedback"]')).toBeNull();
        await act(async () => root.unmount());
        owner.remove();
    });

    it('renders exception disclosure from payload without legacy handlers', async () => {
        const { owner, host, root } = await render({
            page: 'exception',
            renderer: 'native',
            exception: {
                type: 'RuntimeException',
                file: 'fixture.php',
                line: '73',
                message: 'Fixture failed',
                trace: '#0 fixture():73\n#1 controller():1',
            },
        });
        const view = host.querySelector<HTMLElement>('[data-dcat-modern-system-renderer="exception"]')!;
        const toggle = view.querySelector<HTMLButtonElement>('[aria-controls="dcat-modern-exception-trace"]')!;
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
        expect(view.querySelector('[onclick],[ondblclick]')).toBeNull();
        expect(view.querySelector('#dcat-modern-exception-trace')).toBeNull();
        await act(async () => toggle.click());
        expect(view.querySelector('#dcat-modern-exception-trace')?.textContent).toContain('#0 fixture():73');
        expect(view.querySelector('[aria-controls="dcat-modern-exception-trace"]')?.getAttribute('aria-expanded')).toBe('true');
        await act(async () => root.unmount());
        owner.remove();
    });
});
