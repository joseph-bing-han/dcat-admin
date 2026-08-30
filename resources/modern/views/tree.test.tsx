import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { readTreeModel, TreeView } from './tree';

describe('Tree modern view', () => {
    it('reorders payload nodes and submits the legacy _order JSON protocol without nestable DOM', async () => {
        const owner = document.createElement('div');
        owner.innerHTML = `
            <div data-dcat-modern-fallback>
                <div class="card-header"></div>
                <div class="card-body"><div class="dd" data-dcat-modern-family="tree">
                    <ol><li><span data-dcat-modern-slot="tree-action-a1"><a data-action-probe="1">Action</a></span></li></ol>
                </div></div>
            </div>`;
        document.body.appendChild(owner);
        const request = vi.fn(async (_url: string, _options: { method: string; body: URLSearchParams }) => ({ status: true }));
        const handleJsonResponse = vi.fn();
        (window as unknown as { Dcat: unknown }).Dcat = {
            token: 'csrf-test',
            request,
            handleJsonResponse,
            handleAjaxError: vi.fn(),
            reload: vi.fn(),
        };
        const payload = {
            id: 'tree-fixture',
            native: true,
            saveUrl: '/tree/save',
            orderName: '_order',
            useSave: true,
            useRefresh: true,
            useCreate: false,
            createUrl: '/tree/create',
            expanded: true,
            maxDepth: 3,
            nodes: [
                { id: '1', label: '1 - One', actionSlotId: 'tree-action-a1', children: [] },
                { id: '2', label: '2 - Two', actionSlotId: '', children: [] },
            ],
        };
        const model = readTreeModel(owner, payload);
        const action = owner.querySelector<HTMLElement>('[data-action-probe="1"]')!;
        const host = document.createElement('div');
        owner.appendChild(host);
        const root = createRoot(host);
        await act(async () => root.render(<TreeView model={model} />));
        expect(host.querySelector('[data-dcat-modern-tree-renderer="payload"]')).not.toBeNull();
        expect(host.querySelector('[data-action-probe="1"]')).toBe(action);

        await act(async () => {
            (host.querySelector('[aria-label="Move 1 - One down"]') as HTMLButtonElement).click();
        });
        expect(Array.from(host.querySelectorAll('[data-tree-node-id]')).map((node) => node.getAttribute('data-tree-node-id')).slice(0, 2)).toEqual(['2', '1']);

        await act(async () => {
            (host.querySelector('[aria-label="Indent 1 - One"]') as HTMLButtonElement).click();
        });
        expect(host.querySelector('[data-tree-node-id="2"] [data-tree-node-id="1"]')).not.toBeNull();

        await act(async () => {
            (host.querySelector('[aria-label="Save tree order"]') as HTMLButtonElement).click();
            await Promise.resolve();
        });
        expect(request).toHaveBeenCalledTimes(1);
        const body = request.mock.calls[0][1].body as URLSearchParams;
        expect(body.get('_token')).toBe('csrf-test');
        expect(JSON.parse(String(body.get('_order')))).toEqual([{ id: '2', children: [{ id: '1' }] }]);
        expect(handleJsonResponse).toHaveBeenCalled();

        await act(async () => root.unmount());
        expect(owner.querySelector('[data-dcat-modern-fallback] [data-action-probe="1"]')).toBe(action);
        owner.remove();
    });

    it('rebuilds header/body structure while preserving the initialized nestable node and action nodes', async () => {
        const owner = document.createElement('div');
        owner.innerHTML = `
            <div data-dcat-modern-fallback>
                <div class="card-header pb-1 with-border"><button data-action="expand">Expand</button><button data-action="collapse">Collapse</button></div>
                <div class="card-body table-responsive"><div class="dd" id="menu-tree" data-dcat-modern-family="tree"><ol class="dd-list"><li data-id="1">Node</li></ol></div></div>
            </div>`;
        document.body.appendChild(owner);
        const tree = owner.querySelector<HTMLElement>('.dd');
        const expand = owner.querySelector<HTMLElement>('[data-action="expand"]');
        const model = readTreeModel(owner);
        const host = document.createElement('div');
        owner.appendChild(host);
        const root = createRoot(host);
        await act(async () => root.render(<TreeView model={model} />));
        expect(host.querySelector('.card-header')).not.toBeNull();
        expect(host.querySelector('.card-body')).not.toBeNull();
        expect(host.querySelector('#menu-tree')).toBe(tree);
        expect(host.querySelector('[data-action="expand"]')).toBe(expand);
        await act(async () => root.unmount());
        expect(owner.querySelector('[data-dcat-modern-fallback] #menu-tree')).toBe(tree);
        owner.remove();
    });
});

