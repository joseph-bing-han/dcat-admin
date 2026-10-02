import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { readShowModel, ShowView } from './show';

describe('Show modern view', () => {
    it('renders payload-native fields/actions while transporting only explicit compat slots', async () => {
        const owner = document.createElement('div');
        owner.innerHTML = `
            <div data-dcat-modern-fallback>
                <div class="row" data-dcat-modern-family="show">
                    <div class="col-md-12" data-dcat-modern-slot="show-primary">
                        <div class="card dcat-box"><div class="box-body"><div class="form-horizontal">
                            <div class="show-field" data-dcat-modern-show-field-slot="show-field-1"><code data-formatter="custom">formatted</code></div>
                        </div></div></div>
                    </div>
                    <div class="col-md-12"><div class="row show-relation-container"><div class="col-md-12" data-dcat-modern-slot="show-relation-0"><a data-relation="roles">Roles</a></div></div></div>
                </div>
            </div>`;
        document.body.appendChild(owner);
        const formatter = owner.querySelector<HTMLElement>('[data-formatter="custom"]')!;
        const relation = owner.querySelector<HTMLElement>('[data-relation="roles"]')!;
        const payload = {
            width: 12,
            standardPanel: true,
            panel: {
                title: 'Detail',
                actions: [
                    { kind: 'link' as const, action: 'list', label: 'List', url: '/users' },
                    { kind: 'link' as const, action: 'edit', label: 'Edit', url: '/users/1/edit' },
                    { kind: 'button' as const, action: 'delete', label: 'Delete', url: '/users/1', redirect: '/users' },
                ],
            },
            fields: [
                { slotId: 'show-field-0', name: 'name', label: 'Name', value: 'Alice', renderer: 'native' as const, wrapped: true, width: { field: 8, label: 2 }, offset: 0, labelClass: '', fieldClass: '' },
                { slotId: 'show-field-1', name: 'custom', label: 'Custom', value: null, renderer: 'compat' as const, wrapped: true, width: { field: 8, label: 2 }, offset: 0, labelClass: '', fieldClass: '' },
            ],
            relations: [{ slotId: 'show-relation-0', width: 12 }],
        };
        const model = readShowModel(owner, payload);
        expect(model.mode).toBe('payload');
        const host = document.createElement('div');
        owner.appendChild(host);
        const root = createRoot(host);
        await act(async () => root.render(<ShowView model={model} />));
        expect(host.querySelector('[data-dcat-modern-show-renderer="payload"]')).not.toBeNull();
        expect(host.querySelector('[data-dcat-modern-show-field="native"] [data-show-value="name"]')?.textContent).toContain('Alice');
        expect(host.querySelector('[data-dcat-modern-show-field="native"] .box-show')).toBeNull();
        expect(host.querySelector('[aria-label="List"]')?.getAttribute('href')).toBe('/users');
        expect(host.querySelector('[data-show-action="list"]')?.classList.contains('bg-primary')).toBe(true);
        expect(host.querySelector('[data-show-action="edit"]')?.classList.contains('bg-brand-solid')).toBe(true);
        expect(host.querySelector('[data-show-action="delete"]')?.classList.contains('bg-error-solid')).toBe(true);
        expect(host.querySelector('[data-show-action="delete"]')?.getAttribute('data-redirect')).toBe('/users');
        expect(host.querySelector('[data-formatter="custom"]')).toBe(formatter);
        expect(host.querySelector('[data-relation="roles"]')).toBe(relation);
        await act(async () => root.unmount());
        expect(owner.querySelector('[data-dcat-modern-fallback] [data-formatter="custom"]')).toBe(formatter);
        owner.remove();
    });

    it('renders standard Show fields in React while preserving formatter nodes and relations', async () => {
        const owner = document.createElement('div');
        owner.innerHTML = `
            <div data-dcat-modern-fallback>
                <div class="row" data-dcat-modern-family="show">
                    <div class="col-md-12">
                        <div class="card dcat-box">
                            <div class="box-header with-border"><h3 class="box-title">Detail</h3><div class="pull-right"><a data-action="edit" href="/users/1/edit">Edit</a></div></div>
                            <div class="box-body"><div class="form-horizontal mt-1">
                                <div class="show-field form-group row" data-show-field="name"><div class="col-sm-2 control-label" data-show-label="name"><span>Name</span></div><div class="col-sm-8" data-show-value="name"><code data-formatter="custom">Alice</code></div></div>
                                <div class="clearfix"></div>
                            </div></div>
                        </div>
                    </div>
                    <div class="col-md-12"><div class="show-relation-container"><a href="/tags">Tags</a></div></div>
                </div>
            </div>`;
        document.body.appendChild(owner);
        const formatter = owner.querySelector<HTMLElement>('[data-formatter="custom"]');
        const relation = owner.querySelector<HTMLElement>('.show-relation-container');
        const edit = owner.querySelector<HTMLElement>('[data-action="edit"]');
        const model = readShowModel(owner);
        expect(model.mode).toBe('legacy');
        const host = document.createElement('div');
        owner.appendChild(host);
        const root = createRoot(host);
        await act(async () => root.render(<ShowView model={model} />));
        expect(host.querySelector('[data-dcat-modern-legacy-island="show-custom-panel"]')).not.toBeNull();
        expect(host.querySelector('[data-show-field="name"]')).not.toBeNull();
        expect(host.querySelector('[data-show-label="name"]')).not.toBeNull();
        expect(host.querySelector('[data-show-value="name"]')).not.toBeNull();
        expect(host.querySelector('[data-formatter="custom"]')).toBe(formatter);
        expect(host.querySelector('[data-action="edit"]')).toBe(edit);
        expect(host.querySelector('.show-relation-container')).toBe(relation);
        await act(async () => root.unmount());
        expect(owner.querySelector('[data-dcat-modern-fallback] [data-formatter="custom"]')).toBe(formatter);
        owner.remove();
    });

    it('keeps custom Show row composition as a whole legacy island', async () => {
        const owner = document.createElement('div');
        owner.innerHTML = '<div data-dcat-modern-fallback><div class="row" data-dcat-modern-family="show"><div class="col-md-12"><div class="card dcat-box"><div class="box-body"><div class="form-horizontal"><div class="row custom-layout"><div class="col-md-6"><div class="show-field form-group row"><div class="control-label">A</div><div>Value</div></div></div></div></div></div></div></div></div></div>';
        const outer = owner.querySelector<HTMLElement>('[data-dcat-modern-family="show"]');
        const panel = owner.querySelector<HTMLElement>('.card.dcat-box');
        const model = readShowModel(owner);
        expect(model.standardPanel).toBe(false);
        const host = document.createElement('div');
        owner.appendChild(host);
        const root = createRoot(host);
        await act(async () => root.render(<ShowView model={model} />));
        expect(host.querySelector('[data-dcat-modern-family="show"]')).toBe(outer);
        expect(host.querySelector('.card.dcat-box')).toBe(panel);
        await act(async () => root.unmount());
        owner.remove();
    });

    it('keeps an entirely custom Show root intact when no default panel can be recognized', async () => {
        const owner = document.createElement('div');
        owner.innerHTML = '<div data-dcat-modern-fallback><div class="row" data-dcat-modern-family="show"><article class="custom-show"><button data-action="custom">Custom</button></article></div></div>';
        const outer = owner.querySelector<HTMLElement>('[data-dcat-modern-family="show"]');
        const button = owner.querySelector<HTMLElement>('[data-action="custom"]');
        const model = readShowModel(owner);
        expect(model.standardPanel).toBe(false);
        const host = document.createElement('div');
        owner.appendChild(host);
        const root = createRoot(host);
        await act(async () => root.render(<ShowView model={model} />));
        expect(host.querySelector('[data-dcat-modern-family="show"]')).toBe(outer);
        expect(host.querySelector('[data-action="custom"]')).toBe(button);
        await act(async () => root.unmount());
        expect(owner.querySelector('[data-dcat-modern-fallback] [data-action="custom"]')).toBe(button);
        owner.remove();
    });
});
