import React, { useState } from 'react';

export interface LayoutMenuItem {
    id: string;
    title: string;
    icon: string;
    url: string;
    external: boolean;
    active: boolean;
    children: LayoutMenuItem[];
}

export interface LayoutMenuPayload {
    horizontal: boolean;
    defaultIcon: string;
    items: LayoutMenuItem[];
}

export interface LayoutHeaderPayload {
    header: string;
    description: string;
    breadcrumbs: Array<{
        text: string;
        url: string;
        icon: string;
        current: boolean;
    }>;
}

function MenuItem({ item, horizontal, defaultIcon, depth = 0 }: { item: LayoutMenuItem; horizontal: boolean; defaultIcon: string; depth?: number }) {
    const hasChildren = item.children.length > 0;
    const [open, setOpen] = useState(item.active);
    const icon = item.icon || defaultIcon;
    const itemClass = [
        horizontal && hasChildren ? 'dropdown' : '',
        !horizontal && hasChildren ? 'has-treeview' : '',
        depth > 0 && hasChildren ? 'dropdown-submenu' : '',
        'nav-item',
        open ? 'menu-open' : '',
    ].filter(Boolean).join(' ');

    return (
        <li className={itemClass}>
            <a
                data-id={item.id}
                href={hasChildren ? '#' : item.url}
                target={!hasChildren && item.external ? '_blank' : undefined}
                rel={!hasChildren && item.external ? 'noopener noreferrer' : undefined}
                aria-current={!hasChildren && item.active ? 'page' : undefined}
                aria-expanded={hasChildren ? open : undefined}
                role={hasChildren ? 'button' : undefined}
                className={[
                    'nav-link',
                    !hasChildren && item.active ? 'active' : '',
                    hasChildren && horizontal ? 'dropdown-toggle' : '',
                    hasChildren && item.active && horizontal ? 'active' : '',
                ].filter(Boolean).join(' ')}
                onClick={hasChildren ? (event) => {
                    event.preventDefault();
                    setOpen((value) => !value);
                } : undefined}
                onKeyDown={hasChildren ? (event) => {
                    if (event.key === ' ') {
                        event.preventDefault();
                        setOpen((value) => !value);
                    }
                } : undefined}
            >
                <span className="dcat-modern-menu-indent" style={{ width: depth * 12 }} aria-hidden="true" />
                <i className={`fa fa-fw ${icon}`} aria-hidden="true" />
                <p>
                    {item.title}
                    {hasChildren && !horizontal ? <i className="right fa fa-angle-left" aria-hidden="true" /> : null}
                </p>
            </a>
            {hasChildren && open ? (
                <ul className={`nav ${horizontal ? 'dropdown-menu' : 'nav-treeview'}`}>
                    {item.children.map((child, index) => (
                        <MenuItem key={`${child.id}-${index}`} item={child} horizontal={horizontal} defaultIcon={defaultIcon} depth={depth + 1} />
                    ))}
                </ul>
            ) : null}
        </li>
    );
}

export function LayoutMenuView({ payload }: { payload: LayoutMenuPayload }) {
    return (
        <ul
            className={`nav nav-pills nav-sidebar ${payload.horizontal ? '' : 'flex-column'}`.trim()}
            data-modern-treeview={payload.horizontal ? undefined : 'true'}
        >
            {payload.items.map((item, index) => (
                <MenuItem key={`${item.id}-${index}`} item={item} horizontal={payload.horizontal} defaultIcon={payload.defaultIcon} />
            ))}
        </ul>
    );
}

export function LayoutHeaderView({ payload }: { payload: LayoutHeaderPayload }) {
    return (
        <div className="content-header dcat-modern-page-header">
            <section className="content-header breadcrumbs-top">
                {payload.header || payload.description ? (
                    <h1 className="float-left">
                        <span className="text-capitalize">{payload.header}</span>
                        {payload.description ? <small>{payload.description}</small> : null}
                    </h1>
                ) : null}
                {payload.breadcrumbs.length ? (
                    <div className="breadcrumb-wrapper col-12">
                        <ol className="breadcrumb float-right text-capitalize" aria-label="Breadcrumb">
                            {payload.breadcrumbs.map((item, index) => (
                                <li key={`${item.text}-${index}`} className={`breadcrumb-item ${item.current ? 'active' : ''}`.trim()} aria-current={item.current ? 'page' : undefined}>
                                    {item.url && !item.current ? (
                                        <a href={item.url}>
                                            {item.icon ? <i className={`fa ${item.icon}`} aria-hidden="true" /> : null}
                                            {' '}{item.text}
                                        </a>
                                    ) : (
                                        <>
                                            {item.icon ? <i className={`fa ${item.icon}`} aria-hidden="true" /> : null}
                                            {' '}{item.text}
                                        </>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </div>
                ) : null}
                <div className="clearfix" />
            </section>
        </div>
    );
}
