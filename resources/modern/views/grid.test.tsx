import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { GridView, readGridModel, type GridViewPayload } from './grid';

describe('Grid modern view', () => {
    it('preserves table identity, links, pagination and transports complex cells', async () => {
        const source = document.createElement('div');
        source.innerHTML = `
            <div data-dcat-modern-fallback>
                <div class="dcat-box">
                    <div class="d-block pb-0" data-dcat-modern-slot="grid-toolbar">
                        <form class="quick-search-form" action="/users" pjax-container method="get"><input name="_search_" value="alice"></form>
                        <a class="create-button" href="/users/create">Create</a>
                    </div>
                    <div class="filter-box" data-dcat-modern-slot="grid-filter"><form class="grid-filter-form" action="/users" pjax-container method="get"><input name="username" value="ali"></form></div>
                    <div class="table-responsive">
                        <table id="grid-table" class="table custom-grid" data-grid-extension="root">
                            <thead><tr><th data-column="id" scope="colgroup" width="96">ID</th><th>Name</th><th>Actions</th></tr></thead>
                            <tbody>
                                <tr data-key="1">
                                    <td data-cell-extension="selector" data-dcat-modern-slot="selector"><input class="grid-row-checkbox" type="checkbox" data-id="1"></td>
                                    <td><a href="/users/1">Alice</a></td>
                                    <td data-dcat-modern-slot="delete"><a data-action="delete" data-url="/users/1" href="javascript:void(0)">Delete</a></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <ul class="pagination pagination-sm"><li class="page-item active"><span class="page-link">1</span></li><li class="page-item"><a class="page-link" href="?page=2">2</a></li></ul>
                </div>
            </div>`;
        document.body.appendChild(source);
        const quickSearch = source.querySelector<HTMLFormElement>('form.quick-search-form');
        const filter = source.querySelector<HTMLFormElement>('form.grid-filter-form');
        const rowCheckbox = source.querySelector<HTMLInputElement>('input.grid-row-checkbox');
        const deleteAction = source.querySelector<HTMLAnchorElement>('[data-action="delete"]');
        const payload: GridViewPayload = {
            tableId: 'grid-table', tableClassName: 'table custom-grid', empty: false, hasQuickCreate: false,
            columns: [
                { name: 'id', label: 'ID', serverType: 'selector', header: { mode: 'native', attributes: { 'data-column': 'id', scope: 'colgroup', width: 96 } } },
                { name: 'name', label: 'Name', serverType: 'link' },
                { name: 'actions', label: 'Actions', serverType: 'compat' },
            ],
            rows: [{ key: '1', index: 0, cells: [
                { kind: 'compat', slotId: 'selector' },
                { kind: 'link', text: 'Alice', href: '/users/1' },
                { kind: 'compat', slotId: 'delete' },
            ] }],
            pagination: { className: 'pagination', items: [
                { label: '', href: '?page=1', rel: 'prev', ariaLabel: 'Previous', active: false, disabled: false, className: 'page-item previous' },
                { label: '2', href: '?page=2', active: false, disabled: false, className: 'page-item' },
                { label: '', href: '?page=3', rel: 'next', ariaLabel: 'Next', active: false, disabled: false, className: 'page-item next' },
            ] },
        };
        const model = readGridModel(source, payload);
        if ('compatNodes' in model) throw new Error('Expected a native payload');
        expect(model.tableId).toBe('grid-table');
        expect(model.rows[0].cells[1].kind).toBe('link');
        expect(model.rows[0].cells[2].kind).toBe('island');

        const host = document.createElement('div');
        source.appendChild(host);
        const root = createRoot(host);
        await act(async () => root.render(<GridView model={model} />));
        expect(host.querySelector('table')?.id).toBe('grid-table');
        expect(host.querySelector('table')?.className).toContain('custom-grid');
        expect(host.querySelector('th')?.getAttribute('data-column')).toBe('id');
        expect(host.querySelector('th')?.getAttribute('scope')).toBe('colgroup');
        expect(host.querySelector('th')?.getAttribute('width')).toBe('96');
        expect(host.querySelector('tbody td')?.getAttribute('data-cell-extension')).toBe('selector');
        expect(host.querySelector('a[href="/users/1"]')?.textContent).toBe('Alice');
        expect(host.querySelector('a[rel="prev"]')?.textContent).toBe('‹');
        expect(host.querySelector('a[rel="prev"]')?.getAttribute('aria-label')).toBe('Previous');
        expect(host.querySelector('a[href="?page=2"]')).not.toBeNull();
        expect(host.querySelector('a[rel="next"]')?.textContent).toBe('›');
        expect(host.querySelector('a[rel="next"]')?.getAttribute('aria-label')).toBe('Next');
        expect(host.querySelector('form.quick-search-form')).toBe(quickSearch);
        expect(host.querySelector('form.quick-search-form')?.getAttribute('action')).toBe('/users');
        expect(host.querySelector('form.quick-search-form input')?.getAttribute('name')).toBe('_search_');
        expect(host.querySelector('form.grid-filter-form')).toBe(filter);
        expect(host.querySelector('form.grid-filter-form')?.getAttribute('pjax-container')).not.toBeNull();
        expect(host.querySelector('input.grid-row-checkbox')).toBe(rowCheckbox);
        expect(host.querySelector('[data-action="delete"]')).toBe(deleteAction);
        expect(host.querySelector('[data-action="delete"]')?.getAttribute('data-url')).toBe('/users/1');
        await act(async () => root.unmount());
        expect(source.querySelector('[data-dcat-modern-fallback] form.quick-search-form')).toBe(quickSearch);
        expect(source.querySelector('[data-dcat-modern-fallback] form.grid-filter-form')).toBe(filter);
        expect(source.querySelector('[data-dcat-modern-fallback] input.grid-row-checkbox')).toBe(rowCheckbox);
        expect(source.querySelector('[data-dcat-modern-fallback] [data-action="delete"]')).toBe(deleteAction);
        source.remove();
    });

    it('preserves arbitrary custom Grid markup and handlers without inferring Bootstrap structure', async () => {
        const source = document.createElement('div');
        source.innerHTML = '<div data-dcat-modern-fallback><section><button onclick="window.legacyRowClick=true">Custom Grid</button></section></div>';
        document.body.appendChild(source);
        const original = source.querySelector('section');
        const button = source.querySelector('button');
        const callback = vi.fn();
        button?.addEventListener('click', callback);
        const model = readGridModel(source);
        expect('compatNodes' in model).toBe(true);
        const host = document.createElement('div');
        source.appendChild(host);
        const root = createRoot(host);
        await act(async () => root.render(<GridView model={model} />));
        expect(host.querySelector('section')).toBe(original);
        host.querySelector('button')?.click();
        expect(callback).toHaveBeenCalledTimes(1);
        await act(async () => root.unmount());
        expect(source.querySelector('[data-dcat-modern-fallback] section')).toBe(original);
        source.remove();
    });

    it('uses the localized select-all label as hidden text for the row-selector header', async () => {
        const source = document.createElement('div');
        source.innerHTML = `
            <div data-dcat-modern-fallback>
                <table>
                    <thead><tr>
                        <th data-dcat-modern-slot="grid-header-0"><div class="checkbox-grid-header"><input class="select-all" type="checkbox" data-dcat-grid-select-all="1" aria-label="Select all"></div></th>
                        <th>ID</th><th>Name</th>
                    </tr></thead>
                    <tbody>
                        <tr><td><input type="checkbox" aria-label="1"></td><td>1</td><td>Alice</td></tr>
                        <tr><td><input type="checkbox" aria-label="2"></td><td>2</td><td>Bob</td></tr>
                        <tr><td><input type="checkbox" aria-label="3"></td><td>3</td><td>Carol</td></tr>
                    </tbody>
                </table>
            </div>`;
        document.body.appendChild(source);
        const selectAll = source.querySelector<HTMLInputElement>('[data-dcat-grid-select-all="1"]');
        const model = readGridModel(source, {
            tableId: 'grid-selector-table',
            columns: [
                { name: '__row_selector__', label: '', serverType: 'selector', header: { mode: 'compat' } },
                { name: 'id', label: 'ID', serverType: 'text' },
                { name: 'name', label: 'Name', serverType: 'text' },
            ],
            rows: [1, 2, 3].map((id) => ({
                key: String(id),
                index: id - 1,
                cells: [
                    { kind: 'text', text: String(id) },
                    { kind: 'text', text: String(id) },
                    { kind: 'text', text: ['Alice', 'Bob', 'Carol'][id - 1] },
                ],
            })),
            empty: false,
            hasQuickCreate: false,
        });
        if ('compatNodes' in model) throw new Error('Expected a native payload');

        const host = document.createElement('div');
        source.appendChild(host);
        const root = createRoot(host);
        await act(async () => root.render(<GridView model={model} />));

        const header = host.querySelector('thead th');
        expect(header?.getAttribute('scope')).toBe('col');
        expect(header?.querySelector('.sr-only')?.textContent).toBe('Select all');
        expect(header?.textContent?.trim()).toBe('Select all');
        expect(header?.querySelector('[data-dcat-grid-select-all="1"]')).toBe(selectAll);

        await act(async () => root.unmount());
        source.remove();
    });

    it('renders legacy semantic labels and maintains contrast for custom backgrounds', async () => {
        vi.stubGlobal('CSS', { escape: CSS.escape.bind(CSS), supports: () => true });
        const source = document.createElement('div');
        source.innerHTML = '<div data-dcat-modern-fallback></div>';
        document.body.appendChild(source);
        document.body.style.setProperty('--grid-label-bg', '#7f7f7f');
        const pixels: Record<string, [number, number, number]> = {
            '#fff': [255, 255, 255], '#111827': [17, 24, 39],
            '#586cb1': [88, 108, 177], '#21b978': [33, 185, 120],
            '#f3f4f6': [243, 244, 246], '#7a7a7a': [122, 122, 122], '#7c7c7c': [124, 124, 124], '#7f7f7f': [127, 127, 127],
            'rgb(17, 24, 39)': [17, 24, 39], 'hsl(270, 50%, 40%)': [102, 51, 153],
        };
        let pixel: [number, number, number] = [0, 0, 0];
        let canvasContext: CanvasRenderingContext2D;
        canvasContext = {
            fillStyle: '#fff',
            clearRect: vi.fn(() => { pixel = [0, 0, 0]; }),
            fillRect: vi.fn(() => {
                const color = String(canvasContext.fillStyle);
                const values = color.match(/[\d.]+/g)?.map(Number) || [];
                const rgb = pixels[color] ?? (values.length >= 3 ? values.slice(0, 3) : [0, 0, 0]);
                const alpha = values[3] ?? (color === 'transparent' ? 0 : 1);
                pixel = rgb.map((value, index) => Math.round(value * alpha + pixel[index] * (1 - alpha))) as [number, number, number];
            }),
            getImageData: vi.fn(() => {
                return { data: new Uint8ClampedArray([...pixel, 255]) } as ImageData;
            }),
        } as unknown as CanvasRenderingContext2D;
        const canvasSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => canvasContext);
        const originalGetComputedStyle = window.getComputedStyle;
        const styleSpy = vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
            if (element instanceof HTMLSpanElement && element.style.backgroundColor.startsWith('var(')) {
                return { backgroundColor: document.body.style.getPropertyValue('--grid-label-bg') } as CSSStyleDeclaration;
            }
            return originalGetComputedStyle(element);
        });
        const model = readGridModel(source, {
            tableId: 'grid',
            columns: [
                { name: 'role', label: 'Role', serverType: 'labels' },
                { name: 'status', label: 'Status', serverType: 'labels' },
                { name: 'dark', label: 'Custom dark', serverType: 'labels' },
                { name: 'rgb', label: 'Custom RGB', serverType: 'labels' },
                { name: 'light', label: 'Custom light', serverType: 'labels' },
                { name: 'css', label: 'Custom CSS', serverType: 'labels' },
                { name: 'gray-white', label: 'Mid gray light text', serverType: 'labels' },
                { name: 'gray-dark', label: 'Mid gray dark text', serverType: 'labels' },
                { name: 'hsl', label: 'Custom HSL', serverType: 'labels' },
                { name: 'variable', label: 'CSS variable', serverType: 'labels' },
                { name: 'alpha', label: 'Alpha', serverType: 'labels' },
                { name: 'explicit', label: 'Explicit foreground', serverType: 'labels' },
            ],
            rows: [{ key: '1', index: 0, cells: [
                { kind: 'labels', items: ['Administrator'], className: 'label', style: { backgroundColor: '#586CB1' } },
                { kind: 'labels', items: ['Enabled'], className: 'badge', style: { backgroundColor: '#21b978' } },
                { kind: 'labels', items: ['Custom dark'], className: 'label', style: { backgroundColor: '#111827' } },
                { kind: 'labels', items: ['Custom RGB'], className: 'label', style: { backgroundColor: 'rgb(17, 24, 39)' } },
                { kind: 'labels', items: ['Custom light'], className: 'label', style: { backgroundColor: '#f3f4f6' } },
                { kind: 'labels', items: ['Custom CSS'], className: 'label', style: { backgroundColor: 'rebeccapurple', color: 'white' } },
                { kind: 'labels', items: ['Mid gray light text'], className: 'label', style: { backgroundColor: '#7a7a7a' } },
                { kind: 'labels', items: ['Mid gray dark text'], className: 'label', style: { backgroundColor: '#7c7c7c' } },
                { kind: 'labels', items: ['Custom HSL'], className: 'label', style: { backgroundColor: 'hsl(270, 50%, 40%)' } },
                { kind: 'labels', items: ['CSS variable'], className: 'label', style: { backgroundColor: 'var(--grid-label-bg)' } },
                { kind: 'labels', items: ['Alpha'], className: 'label', style: { backgroundColor: 'rgba(0, 0, 0, 0.1)' } },
                { kind: 'labels', items: ['Explicit foreground'], className: 'label', style: { backgroundColor: 'var(--grid-label-bg)', color: 'yellow' } },
            ] }],
            empty: false,
            hasQuickCreate: false,
        });
        const host = document.createElement('div');
        source.appendChild(host);
        const root = createRoot(host);
        await act(async () => root.render(<GridView model={model} />));

        const labels = host.querySelectorAll('.dcat-modern-grid-label');
        expect(labels).toHaveLength(12);
        expect(labels[0].textContent).toBe('Administrator');
        expect(labels[0].classList.contains('label')).toBe(true);
        expect(labels[0].classList.contains('dcat-modern-grid-label--primary')).toBe(true);
        expect(labels[1].classList.contains('dcat-modern-grid-label--success')).toBe(true);
        expect(labels[2].getAttribute('style')).toContain('color: rgb(255, 255, 255)');
        expect(labels[3].getAttribute('style')).toContain('color: rgb(255, 255, 255)');
        expect(labels[4].getAttribute('style')).toContain('color: rgb(0, 0, 0)');
        expect((labels[5] as HTMLSpanElement).style.color).toBe('white');
        expect(labels[6].getAttribute('style')).toContain('color: rgb(0, 0, 0)');
        expect(labels[7].getAttribute('style')).toContain('color: rgb(0, 0, 0)');
        expect(labels[8].getAttribute('style')).toContain('color: rgb(255, 255, 255)');
        expect(labels[9].getAttribute('style')).toContain('color: rgb(0, 0, 0)');
        expect(labels[10].getAttribute('style')).toContain('color: rgb(0, 0, 0)');
        await act(async () => document.body.style.setProperty('--grid-label-bg', '#111827'));
        expect((labels[9] as HTMLSpanElement).style.color).toBe('rgb(255, 255, 255)');
        expect((labels[11] as HTMLSpanElement).style.color).toBe('yellow');
        if ('rows' in model && model.rows[0].cells[9].kind === 'labels') {
            model.rows[0].cells[9].style = { backgroundColor: 'var(--grid-label-bg)', color: 'yellow' };
        }
        await act(async () => root.render(<GridView model={model} />));
        await act(async () => document.body.style.setProperty('--grid-label-bg', '#7f7f7f'));
        expect((labels[9] as HTMLSpanElement).style.color).toBe('yellow');
        expect(labels[9].hasAttribute('data-dcat-contrast')).toBe(false);
        await act(async () => root.unmount());
        await act(async () => document.body.style.setProperty('--grid-label-bg', '#111827'));
        expect((labels[9] as HTMLSpanElement).style.color).toBe('yellow');
        canvasSpy.mockRestore();
        styleSpy.mockRestore();
        vi.unstubAllGlobals();
        document.body.style.removeProperty('--grid-label-bg');
        source.remove();
    });

    it('fails closed when a declared compat slot is missing', () => {
        const source = document.createElement('div');
        source.innerHTML = '<div data-dcat-modern-fallback></div>';
        expect(() => readGridModel(source, {
            tableId: 'grid', columns: [], rows: [{ key: '1', index: 0, cells: [{ kind: 'compat', slotId: 'missing' }] }], empty: false, hasQuickCreate: false,
        })).toThrow(/compat slot missing is missing/);
    });
});
