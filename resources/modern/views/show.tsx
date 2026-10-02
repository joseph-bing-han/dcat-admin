import { Button } from '../ui/components/base/buttons/button';
import { TableCard } from '../ui/components/application/table/table';
import React from 'react';
import { directFallback, LegacyNodesIsland, meaningfulNodes } from '../dom';

export interface ShowActionPayload {
    kind: 'link' | 'button';
    action: 'list' | 'edit' | 'delete' | string;
    label: string;
    url: string;
    redirect?: string;
}

export interface ShowFieldPayload {
    slotId: string;
    name: string;
    label: string;
    value: string | null;
    renderer: 'native' | 'compat';
    wrapped: boolean;
    width: { field: number; label: number };
    offset: number;
    labelClass: string;
    fieldClass: string;
}

export interface ShowViewPayload {
    width: number;
    standardPanel: boolean;
    panel: {
        title: string;
        actions: ShowActionPayload[];
    };
    fields: ShowFieldPayload[];
    relations: Array<{ slotId: string; width: number }>;
}

interface LegacyShowModel {
    mode: 'legacy';
    standardPanel: false;
    nodes: Node[];
}

interface PayloadShowModel {
    mode: 'payload';
    standardPanel: boolean;
    payload: ShowViewPayload;
    primaryCompatNode?: HTMLElement;
    compatFields: Record<string, HTMLElement>;
    relationNodes: Record<string, HTMLElement>;
}

export type ShowModel = LegacyShowModel | PayloadShowModel;

function readPayloadModel(owner: HTMLElement, payload: ShowViewPayload): PayloadShowModel {
    const fallback = directFallback(owner);
    const slotNode = (attribute: string, id: string) => Array.from(fallback.querySelectorAll<HTMLElement>(`[${attribute}]`))
        .find((node) => node.getAttribute(attribute) === id);
    const compatFields: Record<string, HTMLElement> = {};
    payload.fields.forEach((field) => {
        if (field.renderer !== 'compat') return;
        const node = slotNode('data-dcat-modern-show-field-slot', field.slotId);
        if (node) compatFields[field.slotId] = node;
    });
    const relationNodes: Record<string, HTMLElement> = {};
    payload.relations.forEach((relation) => {
        const node = slotNode('data-dcat-modern-slot', relation.slotId);
        if (node) relationNodes[relation.slotId] = node;
    });
    const primaryCompatNode = !payload.standardPanel
        ? fallback.querySelector<HTMLElement>('[data-dcat-modern-slot="show-primary"]') ?? undefined
        : undefined;

    return { mode: 'payload', standardPanel: payload.standardPanel, payload, primaryCompatNode, compatFields, relationNodes };
}

export function readShowModel(owner: HTMLElement, payload: ShowViewPayload | null = null): ShowModel {
    if (payload) return readPayloadModel(owner, payload);

    // 缺少显式 payload 时保留整个自定义视图，不再解析 Bootstrap 结构。
    return { mode: 'legacy', standardPanel: false, nodes: meaningfulNodes(directFallback(owner).childNodes) };
}

function ShowAction({ action }: { action: ShowActionPayload }) {
    if (action.kind === 'link') {
        return <Button href={action.url} color={action.action === 'list' ? 'secondary' : 'primary'} size="sm" aria-label={action.label} data-show-action={action.action}>{action.label}</Button>;
    }
    const handleDelete = () => {
        const dcat = (window as unknown as { Dcat?: Record<string, any> }).Dcat;
        if (!dcat || action.action !== 'delete') return;
        const execute = async () => {
            const body = new URLSearchParams({ _method: 'DELETE' });
            if (dcat.token) body.set('_token', String(dcat.token));
            try {
                const response = await dcat.request(action.url, { method: 'POST', body });
                const record = response && typeof response === 'object' ? response : {};
                if (action.redirect && !record.redirect && !record.refresh && !record.reload) record.redirect = action.redirect;
                dcat.handleJsonResponse(record);
            } catch (error) {
                dcat.handleAjaxError(error);
            }
        };
        const title = String(dcat.lang?.trans?.('delete_confirm') || action.label);
        if (typeof dcat.confirm === 'function') dcat.confirm(title, '', execute);
        else void execute();
    };
    return (
        <Button
            type="button"
            color={action.action === 'delete' ? 'primary-destructive' : 'secondary'} size="sm"
            aria-label={action.label}
            data-action={action.action}
            data-show-action={action.action}
            data-url={action.url}
            data-redirect={action.redirect || undefined}
            onPress={handleDelete}
        >
            {action.label}
        </Button>
    );
}

function NativeShowField({ field }: { field: ShowFieldPayload }) {
    const labelWidth = Math.max(0, Math.min(12, Number(field.width?.label ?? 2)));
    const fieldWidth = Math.max(1, Math.min(12, Number(field.width?.field ?? 8)));
    return (
        <div className="show-field form-group row dcat-modern-show-field" data-dcat-modern-show-field="native" data-show-field={field.name}>
            <div className={`col-sm-${labelWidth} control-label ${field.labelClass || ''}`.trim()} data-show-label={field.name}>
                <span>{field.label}</span>
            </div>
            <div className={`col-sm-${fieldWidth} ${field.fieldClass || ''}`.trim()} data-show-value={field.name}>
                {field.value ?? ''}
            </div>
        </div>
    );
}

function PayloadShowView({ model }: { model: PayloadShowModel }) {
    const payload = model.payload;
    const relationNodes = payload.relations
        .map((relation) => model.relationNodes[relation.slotId])
        .filter((node): node is HTMLElement => Boolean(node));

    return (
        <div className="row dcat-modern-show-payload" data-dcat-modern-show-renderer="payload">
            {payload.standardPanel ? (
                <div className={`col-md-${payload.width}`}>
                    <TableCard.Root className="dcat-box">
                        {(payload.panel.title || payload.panel.actions.length) ? (
                            <div className="box-header with-border dcat-modern-show-header">
                                {payload.panel.title ? <h3 className="box-title">{payload.panel.title}</h3> : null}
                                {payload.panel.actions.length ? (
                                    <div className="pull-right dcat-modern-show-actions">
                                        {payload.panel.actions.map((action, index) => <ShowAction key={`${action.action}-${index}`} action={action} />)}
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                        <div className="box-body dcat-modern-show-body">
                            <div className="form-horizontal mt-1">
                                {payload.fields.map((field) => field.renderer === 'native'
                                    ? <NativeShowField key={field.slotId} field={field} />
                                    : model.compatFields[field.slotId]
                                        ? <LegacyNodesIsland key={field.slotId} nodes={[model.compatFields[field.slotId]]} kind="show-field-compat" />
                                        : null)}
                                <div className="clearfix" />
                            </div>
                        </div>
                    </TableCard.Root>
                </div>
            ) : model.primaryCompatNode ? <LegacyNodesIsland nodes={[model.primaryCompatNode]} kind="show-custom-panel" /> : null}
            {relationNodes.length ? (
                <div className={`col-md-${payload.width}`}>
                    <div className="row show-relation-container">
                        {relationNodes.map((node, index) => <LegacyNodesIsland key={payload.relations[index]?.slotId || index} nodes={[node]} kind="show-relation" />)}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export function ShowView({ model }: { model: ShowModel }) {
    if (model.mode === 'payload') return <PayloadShowView model={model} />;
    return <LegacyNodesIsland nodes={model.nodes} kind="show-custom-panel" />;
}
