import React from 'react';
import { Card, Panel } from '../components';
import { directFallback, LegacyNodesIsland, safeElementProps } from '../dom';

export interface WidgetViewPayload {
    variant: 'card' | 'box' | 'data-card' | string;
    title: string;
    description?: string;
    contentLeft?: string | null;
    contentRight?: string | null;
    toolCount?: number;
    hasFooter?: boolean;
    hasProgress?: boolean;
    progress?: { percent: number; style: string } | null;
    logoUrl?: string;
    links?: Array<{ label: string; url: string }>;
    nativeTools?: { collapse?: boolean; remove?: boolean };
}

interface WidgetModel {
    payload: WidgetViewPayload;
    tools?: HTMLElement;
    content?: HTMLElement;
    footer?: HTMLElement;
    surfaceProps: React.HTMLAttributes<HTMLElement>;
}

function findSlot(fallback: HTMLElement, id: string): HTMLElement | undefined {
    return Array.from(fallback.querySelectorAll<HTMLElement>('[data-dcat-modern-slot]'))
        .find((node) => node.getAttribute('data-dcat-modern-slot') === id);
}

export function readWidgetModel(owner: HTMLElement, payload: WidgetViewPayload): WidgetModel {
    const fallback = directFallback(owner);
    return {
        payload,
        tools: findSlot(fallback, 'widget-tools'),
        content: findSlot(fallback, 'widget-content'),
        footer: findSlot(fallback, 'widget-footer'),
        surfaceProps: safeElementProps(fallback),
    };
}

function Slot({ node, kind }: { node?: HTMLElement; kind: string }) {
    return node ? <LegacyNodesIsland nodes={[node]} kind={kind} /> : null;
}

export function WidgetView({ model }: { model: WidgetModel }) {
    const { payload } = model;
    const [collapsed, setCollapsed] = React.useState(false);
    const [removed, setRemoved] = React.useState(false);
    const hasTools = model.tools || payload.nativeTools?.collapse || payload.nativeTools?.remove;
    if (removed) return null;
    if (payload.variant === 'dashboard') {
        return (
            <Card className="dcat-modern-dashboard" data-dcat-modern-widget-renderer="payload" data-widget-variant="dashboard">
                {payload.logoUrl ? <img className="dcat-modern-dashboard__logo" src={payload.logoUrl} alt="Dcat Admin" /> : null}
                <h2 className="dcat-modern-dashboard__title">{payload.title}</h2>
                <nav className="dcat-modern-dashboard__links" aria-label="Dashboard resources">
                    {(payload.links || []).map((link) => <a key={`${link.url}-${link.label}`} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>)}
                </nav>
            </Card>
        );
    }
    if (payload.variant === 'data-card') {
        const progressPercent = Math.max(0, Math.min(100, Number(payload.progress?.percent ?? 0)));
        return (
            <Panel {...model.surfaceProps} className={`dcat-modern-widget dcat-modern-widget--data-card ${model.surfaceProps.className ?? ''}`} data-dcat-modern-widget-renderer="payload" data-widget-variant="data-card">
                {(payload.title || model.tools) ? (
                    <header className="dcat-modern-widget__header">
                        {payload.title ? <h2 className="dcat-modern-widget__title">{payload.title}</h2> : null}
                        {model.tools ? <div className="dcat-modern-widget__tools"><Slot node={model.tools} kind="widget-tools" /></div> : null}
                    </header>
                ) : null}
                {model.content ? (
                    <div className="dcat-modern-widget__body"><Slot node={model.content} kind="widget-content" /></div>
                ) : (
                    <div className="dcat-modern-widget__body dcat-modern-data-card__body">
                        <div className="dcat-modern-data-card__values">
                            <strong className="dcat-modern-data-card__primary">{payload.contentLeft ?? ''}</strong>
                            <span className="dcat-modern-data-card__secondary">{payload.contentRight ?? ''}</span>
                        </div>
                        {payload.description ? <p className="dcat-modern-widget__description">{payload.description}</p> : null}
                        {payload.progress ? (
                            <div className="dcat-modern-data-card__progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent} aria-label={payload.title || 'Progress'}>
                                <span className={`dcat-modern-data-card__progress-bar dcat-modern-data-card__progress-bar--${payload.progress.style || 'primary'}`} style={{ width: `${progressPercent}%` }} />
                            </div>
                        ) : null}
                    </div>
                )}
            </Panel>
        );
    }

    return (
        <Card {...model.surfaceProps} className={`dcat-modern-widget dcat-modern-widget--${payload.variant} ${model.surfaceProps.className ?? ''}`} data-dcat-modern-widget-renderer="payload" data-widget-variant={payload.variant}>
            {(payload.title || hasTools) ? (
                <header className="dcat-modern-widget__header">
                    {payload.title ? <h2 className="dcat-modern-widget__title">{payload.title}</h2> : null}
                    {hasTools ? (
                        <div className="dcat-modern-widget__tools">
                            {payload.nativeTools?.collapse ? (
                                <button type="button" className="dcat-modern-widget__tool" aria-label={collapsed ? 'Expand widget' : 'Collapse widget'} title={collapsed ? 'Expand widget' : 'Collapse widget'} aria-expanded={!collapsed} onClick={() => setCollapsed((value) => !value)}>{collapsed ? '+' : '−'}</button>
                            ) : null}
                            {payload.nativeTools?.remove ? (
                                <button type="button" className="dcat-modern-widget__tool" aria-label="Remove widget" title="Remove widget" onClick={() => setRemoved(true)}>×</button>
                            ) : null}
                            {model.tools ? <Slot node={model.tools} kind="widget-tools" /> : null}
                        </div>
                    ) : null}
                </header>
            ) : null}
            <div className="dcat-modern-widget__body" hidden={collapsed}><Slot node={model.content} kind="widget-content" /></div>
            {model.footer ? <footer className="dcat-modern-widget__footer"><Slot node={model.footer} kind="widget-footer" /></footer> : null}
        </Card>
    );
}
