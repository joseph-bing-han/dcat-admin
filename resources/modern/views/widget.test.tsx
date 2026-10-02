import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { readWidgetModel, WidgetView, type WidgetViewPayload } from './widget';

describe('Widget modern view', () => {
    it('owns the card shell while preserving explicit custom slots', async () => {
        const owner = document.createElement('div');
        owner.innerHTML = `
            <div data-dcat-modern-fallback id="fixture-card" class="card custom-widget" style="margin-top: 7px">
                <div data-dcat-modern-slot="widget-tools"><button data-custom-tool="1">Custom</button></div>
                <div data-dcat-modern-slot="widget-content"><span data-custom-content="1">Body</span></div>
                <div data-dcat-modern-slot="widget-footer"><span data-custom-footer="1">Footer</span></div>
            </div>`;
        document.body.appendChild(owner);
        const tool = owner.querySelector<HTMLElement>('[data-custom-tool]')!;
        const content = owner.querySelector<HTMLElement>('[data-custom-content]')!;
        const footer = owner.querySelector<HTMLElement>('[data-custom-footer]')!;
        const payload: WidgetViewPayload = { variant: 'card', title: 'Native card' };
        const model = readWidgetModel(owner, payload);
        const host = document.createElement('div');
        owner.appendChild(host);
        const root = createRoot(host);
        await act(async () => root.render(<WidgetView model={model} />));
        const surface = host.querySelector<HTMLElement>('.dcat-modern-widget--card')!;
        expect(surface.id).toBe('fixture-card');
        expect(surface.classList.contains('custom-widget')).toBe(true);
        expect(surface.style.marginTop).toBe('7px');
        expect(host.querySelector('.card-header,.card-body,.card-footer')).toBeNull();
        expect(host.querySelector('[data-custom-tool]')).toBe(tool);
        expect(host.querySelector('[data-custom-content]')).toBe(content);
        expect(host.querySelector('[data-custom-footer]')).toBe(footer);
        await act(async () => root.unmount());
        expect(owner.querySelector('[data-dcat-modern-fallback] [data-custom-content]')).toBe(content);
        owner.remove();
    });

    it('implements built-in box collapse and remove without legacy tool nodes', async () => {
        const owner = document.createElement('div');
        owner.innerHTML = '<div data-dcat-modern-fallback><div data-dcat-modern-slot="widget-content"><span>Body</span></div></div>';
        document.body.appendChild(owner);
        const model = readWidgetModel(owner, {
            variant: 'box',
            title: 'Native box',
            nativeTools: { collapse: true, remove: true },
        });
        const host = document.createElement('div');
        owner.appendChild(host);
        const root = createRoot(host);
        await act(async () => root.render(<WidgetView model={model} />));
        const collapse = host.querySelector<HTMLButtonElement>('[aria-label="Collapse widget"]')!;
        expect(collapse.title).toBe('Collapse widget');
        await act(async () => collapse.click());
        expect(host.querySelector('.dcat-modern-widget__body')?.hasAttribute('hidden')).toBe(true);
        const expand = host.querySelector<HTMLButtonElement>('[aria-label="Expand widget"]')!;
        expect(expand.title).toBe('Expand widget');
        await act(async () => expand.click());
        expect(host.querySelector('.dcat-modern-widget__body')?.hasAttribute('hidden')).toBe(false);
        const remove = host.querySelector<HTMLButtonElement>('[aria-label="Remove widget"]')!;
        expect(remove.title).toBe('Remove widget');
        await act(async () => remove.click());
        expect(host.querySelector('[data-widget-variant="box"]')).toBeNull();
        await act(async () => root.unmount());
        owner.remove();
    });

    it('renders a standard DataCard fully from payload, including progress semantics', async () => {
        const owner = document.createElement('div');
        owner.innerHTML = '<div data-dcat-modern-fallback><div>Legacy data card</div></div>';
        document.body.appendChild(owner);
        const model = readWidgetModel(owner, {
            variant: 'data-card',
            title: 'Revenue',
            description: 'Monthly total',
            contentLeft: '42',
            contentRight: 'Ready',
            progress: { percent: 75, style: 'warning' },
        });
        const host = document.createElement('div');
        owner.appendChild(host);
        const root = createRoot(host);
        await act(async () => root.render(<WidgetView model={model} />));
        const dataCard = host.querySelector<HTMLElement>('[data-widget-variant="data-card"]')!;
        expect(dataCard.textContent).toContain('42');
        expect(dataCard.textContent).toContain('Ready');
        expect(dataCard.querySelector('[data-dcat-modern-legacy-island]')).toBeNull();
        expect(dataCard.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('75');
        expect(dataCard.querySelector('[role="progressbar"]')?.getAttribute('aria-label')).toBe('Revenue');
        expect(dataCard.querySelector('.dcat-modern-data-card__progress-bar--warning')).not.toBeNull();
        await act(async () => root.unmount());
        owner.remove();
    });

    it('renders the dashboard entirely from payload data', async () => {
        const owner = document.createElement('div');
        owner.innerHTML = '<div data-dcat-modern-fallback><div class="legacy-dashboard">Legacy</div></div>';
        document.body.appendChild(owner);
        const model = readWidgetModel(owner, {
            variant: 'dashboard',
            title: 'Dcat Admin',
            logoUrl: '/logo.png',
            links: [
                { label: 'Docs', url: 'https://example.test/docs' },
                { label: 'Demo', url: 'https://example.test/demo' },
            ],
        });
        const host = document.createElement('div');
        owner.appendChild(host);
        const root = createRoot(host);
        await act(async () => root.render(<WidgetView model={model} />));
        expect(host.querySelector('.dcat-modern-dashboard')).not.toBeNull();
        expect(host.querySelectorAll('.dcat-modern-dashboard__links a')).toHaveLength(2);
        expect(host.querySelector('[data-dcat-modern-legacy-island]')).toBeNull();
        await act(async () => root.unmount());
        owner.remove();
    });
});
