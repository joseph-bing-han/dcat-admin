import React from 'react';
import { directFallback, LegacyNodesIsland, meaningfulNodes } from '../dom';

export interface TreeNodePayload {
    id: string;
    label: string;
    actionSlotId: string;
    children: TreeNodePayload[];
}

export interface TreeViewPayload {
    id: string;
    native: boolean;
    saveUrl: string;
    orderName: string;
    useSave: boolean;
    useRefresh: boolean;
    useCreate: boolean;
    createUrl: string;
    expanded: boolean;
    maxDepth: number;
    nodes: TreeNodePayload[];
}

interface LegacyTreeModel {
    mode: 'legacy';
    nodes: Node[];
}

interface PayloadTreeModel {
    mode: 'payload';
    payload: TreeViewPayload;
    actionNodes: Record<string, HTMLElement>;
}

export type TreeModel = LegacyTreeModel | PayloadTreeModel;

function cloneNodes(nodes: TreeNodePayload[]): TreeNodePayload[] {
    return nodes.map((node) => ({ ...node, children: cloneNodes(node.children || []) }));
}

function allIds(nodes: TreeNodePayload[]): string[] {
    return nodes.flatMap((node) => [node.id, ...allIds(node.children || [])]);
}

function subtreeDepth(node: TreeNodePayload): number {
    return 1 + Math.max(0, ...(node.children || []).map(subtreeDepth));
}

interface LocatedNode {
    siblings: TreeNodePayload[];
    index: number;
    depth: number;
    parent?: { siblings: TreeNodePayload[]; index: number; node: TreeNodePayload };
}

function locateNode(nodes: TreeNodePayload[], id: string, depth = 1, parent?: LocatedNode['parent']): LocatedNode | null {
    for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index];
        if (node.id === id) return { siblings: nodes, index, depth, parent };
        const child = locateNode(node.children || [], id, depth + 1, { siblings: nodes, index, node });
        if (child) return child;
    }
    return null;
}

function serializeOrder(nodes: TreeNodePayload[]): Array<{ id: string; children?: ReturnType<typeof serializeOrder> }> {
    return nodes.map((node) => ({
        id: node.id,
        ...(node.children?.length ? { children: serializeOrder(node.children) } : {}),
    }));
}

function readPayloadModel(owner: HTMLElement, payload: TreeViewPayload): PayloadTreeModel {
    const fallback = directFallback(owner);
    const available = Array.from(fallback.querySelectorAll<HTMLElement>('[data-dcat-modern-slot]'));
    const actionNodes: Record<string, HTMLElement> = {};
    const collect = (nodes: TreeNodePayload[]) => nodes.forEach((node) => {
        if (node.actionSlotId) {
            const match = available.find((candidate) => candidate.getAttribute('data-dcat-modern-slot') === node.actionSlotId);
            if (match) actionNodes[node.actionSlotId] = match;
        }
        collect(node.children || []);
    });
    collect(payload.nodes || []);
    return { mode: 'payload', payload, actionNodes };
}

export function readTreeModel(owner: HTMLElement, payload: TreeViewPayload | null = null): TreeModel {
    if (payload?.native) return readPayloadModel(owner, payload);

    return { mode: 'legacy', nodes: meaningfulNodes(directFallback(owner).childNodes) };
}

function NativeTree({ model }: { model: PayloadTreeModel }) {
    const payload = model.payload;
    const [nodes, setNodes] = React.useState<TreeNodePayload[]>(() => cloneNodes(payload.nodes || []));
    const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set(payload.expanded ? allIds(payload.nodes || []) : []));
    const [saving, setSaving] = React.useState(false);

    const mutate = (id: string, action: 'up' | 'down' | 'indent' | 'outdent') => {
        setNodes((current) => {
            const next = cloneNodes(current);
            const located = locateNode(next, id);
            if (!located) return current;
            const node = located.siblings[located.index];
            if (action === 'up') {
                if (located.index === 0) return current;
                located.siblings.splice(located.index - 1, 2, node, located.siblings[located.index - 1]);
                return next;
            }
            if (action === 'down') {
                if (located.index >= located.siblings.length - 1) return current;
                located.siblings.splice(located.index, 2, located.siblings[located.index + 1], node);
                return next;
            }
            if (action === 'indent') {
                if (located.index === 0 || located.depth + subtreeDepth(node) > payload.maxDepth) return current;
                const previous = located.siblings[located.index - 1];
                located.siblings.splice(located.index, 1);
                previous.children = previous.children || [];
                previous.children.push(node);
                setExpanded((value) => new Set([...value, previous.id]));
                return next;
            }
            if (!located.parent) return current;
            located.siblings.splice(located.index, 1);
            located.parent.siblings.splice(located.parent.index + 1, 0, node);
            return next;
        });
    };

    const save = async () => {
        const dcat = (window as unknown as { Dcat?: Record<string, any> }).Dcat;
        if (!dcat || saving) return;
        setSaving(true);
        const body = new URLSearchParams();
        body.set(payload.orderName, JSON.stringify(serializeOrder(nodes)));
        if (dcat.token) body.set('_token', String(dcat.token));
        try {
            const response = await dcat.request(payload.saveUrl, { method: 'POST', body });
            dcat.handleJsonResponse(response && typeof response === 'object' ? response : {});
        } catch (error) {
            dcat.handleAjaxError(error);
        } finally {
            setSaving(false);
        }
    };

    const refresh = () => {
        const dcat = (window as unknown as { Dcat?: Record<string, any> }).Dcat;
        dcat?.reload?.();
    };

    const toggle = (id: string) => setExpanded((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });

    const renderNodes = (items: TreeNodePayload[], level = 1): React.ReactNode => (
        <ul className={level === 1 ? 'dcat-modern-tree-list' : 'dcat-modern-tree-children'} role={level === 1 ? 'tree' : 'group'}>
            {items.map((node, index) => {
                const open = expanded.has(node.id);
                const hasChildren = Boolean(node.children?.length);
                const actionNode = node.actionSlotId ? model.actionNodes[node.actionSlotId] : undefined;
                return (
                    <li key={node.id} role="treeitem" aria-level={level} aria-expanded={hasChildren ? open : undefined} className="dcat-modern-tree-node" data-tree-node-id={node.id}>
                        <div className="dcat-modern-tree-node-row">
                            {hasChildren ? (
                                <button type="button" className="btn btn-sm btn-white dcat-modern-tree-disclosure" aria-label={`${open ? 'Collapse' : 'Expand'} ${node.label}`} onClick={() => toggle(node.id)}>
                                    {open ? '−' : '+'}
                                </button>
                            ) : <span className="dcat-modern-tree-disclosure-spacer" aria-hidden="true" />}
                            <span className="dcat-modern-tree-label">{node.label}</span>
                            {actionNode ? <LegacyNodesIsland nodes={[actionNode]} kind="tree-node-actions" /> : null}
                            <span className="dcat-modern-tree-reorder" aria-label={`Reorder ${node.label}`}>
                                <button type="button" className="btn btn-sm btn-white" aria-label={`Move ${node.label} up`} disabled={index === 0} onClick={() => mutate(node.id, 'up')}>↑</button>
                                <button type="button" className="btn btn-sm btn-white" aria-label={`Move ${node.label} down`} disabled={index === items.length - 1} onClick={() => mutate(node.id, 'down')}>↓</button>
                                <button type="button" className="btn btn-sm btn-white" aria-label={`Indent ${node.label}`} disabled={index === 0 || level + subtreeDepth(node) > payload.maxDepth} onClick={() => mutate(node.id, 'indent')}>→</button>
                                <button type="button" className="btn btn-sm btn-white" aria-label={`Outdent ${node.label}`} disabled={level === 1} onClick={() => mutate(node.id, 'outdent')}>←</button>
                            </span>
                        </div>
                        {hasChildren && open ? renderNodes(node.children, level + 1) : null}
                    </li>
                );
            })}
        </ul>
    );

    return (
        <div className="dcat-modern-tree-view" data-dcat-modern-tree-renderer="payload" data-tree-id={payload.id}>
            <div className="card-header pb-1 with-border dcat-modern-tree-toolbar">
                <div className="dcat-modern-tree-toolbar-primary">
                    <button type="button" className="btn btn-primary btn-sm" aria-label="Expand all" onClick={() => setExpanded(new Set(allIds(nodes)))}>Expand</button>
                    <button type="button" className="btn btn-primary btn-sm" aria-label="Collapse all" onClick={() => setExpanded(new Set())}>Collapse</button>
                    {payload.useSave ? <button type="button" className="btn btn-primary btn-sm" aria-label="Save tree order" disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save'}</button> : null}
                    {payload.useRefresh ? <button type="button" className="btn btn-outline-primary btn-sm" aria-label="Refresh tree" onClick={refresh}>Refresh</button> : null}
                </div>
                {payload.useCreate ? <a href={payload.createUrl} className="btn btn-primary btn-sm" aria-label="Create tree item">New</a> : null}
            </div>
            <div className="card-body dcat-modern-tree-body">
                {nodes.length ? renderNodes(nodes) : <div className="help-block" role="status">No data</div>}
            </div>
        </div>
    );
}

export function TreeView({ model }: { model: TreeModel }) {
    if (model.mode === 'payload') return <NativeTree model={model} />;
    return (
        <div className="dcat-modern-tree-view" data-dcat-modern-tree-renderer="compat">
            <LegacyNodesIsland nodes={model.nodes} kind="tree-custom-view" />
        </div>
    );
}
