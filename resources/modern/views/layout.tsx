import React, { useState } from 'react';
import { MenuIcon, ShellMenu, type ShellMenuPayload } from '../shell/menu';

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

/*
 * 水平菜单行。垂直侧栏已迁到 `shell/menu.tsx`（上游 app-navigation 行组件），
 * 这里只保留 horizontal_menu 使用的 dropdown 结构：上游没有水平变体，
 * 且 AdminLTE 的 `.navbar-horizontal` / `.dropdown-menu` 定位依赖它。
 */
function HorizontalMenuItem({ item, defaultIcon, depth = 0 }: { item: LayoutMenuItem; defaultIcon: string; depth?: number }) {
    const hasChildren = item.children.length > 0;
    const [open, setOpen] = useState(item.active);
    const icon = item.icon || defaultIcon;
    const itemClass = [
        hasChildren ? 'dropdown' : '',
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
                    hasChildren ? 'dropdown-toggle' : '',
                    hasChildren && item.active ? 'active' : '',
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
                <MenuIcon iconClass={icon} className="fa-fw" />
                <p>
                    {item.title}
                </p>
            </a>
            {hasChildren && open ? (
                <ul className="nav dropdown-menu">
                    {item.children.map((child, index) => (
                        <HorizontalMenuItem key={`${child.id}-${index}`} item={child} defaultIcon={defaultIcon} depth={depth + 1} />
                    ))}
                </ul>
            ) : null}
        </li>
    );
}

export function LayoutMenuView({ payload }: { payload: LayoutMenuPayload }) {
    /*
     * 垂直侧栏由上游 app-navigation 行组件渲染（Epic 002 / S3）。
     * 水平菜单保留 Dcat 自己的 dropdown 结构：上游 app-navigation 没有水平变体，
     * 而 horizontal_menu 依赖 AdminLTE 的 dropdown 定位与 .navbar-horizontal 外壳。
     */
    if (!payload.horizontal) {
        return <ShellMenu payload={payload as ShellMenuPayload} />;
    }

    return (
        <ul className="nav nav-pills nav-sidebar">
            {payload.items.map((item, index) => (
                <HorizontalMenuItem key={`${item.id}-${index}`} item={item} defaultIcon={payload.defaultIcon} />
            ))}
        </ul>
    );
}

export function LayoutHeaderView({ payload }: { payload: LayoutHeaderPayload }) {
    return (
        <div className="content-header dcat-modern-page-header">
            <section className="content-header breadcrumbs-top">
                {payload.header || payload.description ? (
                    <h1 className="m-0 flex max-w-full flex-wrap items-baseline gap-2 text-xl leading-7 font-semibold tracking-normal text-primary">
                        <span className="capitalize">{payload.header}</span>
                        {payload.description ? (
                            <small className="m-0 text-sm leading-5 font-normal text-tertiary">{payload.description}</small>
                        ) : null}
                    </h1>
                ) : null}
                {payload.breadcrumbs.length ? (
                    <div className="breadcrumb-wrapper w-full">
                        <ol className="breadcrumb m-0 mt-2 flex max-w-full list-none flex-nowrap items-center gap-0 overflow-x-auto p-0 whitespace-nowrap" aria-label="Breadcrumb">
                            {payload.breadcrumbs.map((item, index) => (
                                <li
                                    key={`${item.text}-${index}`}
                                    className={[
                                        'breadcrumb-item m-0 inline-flex flex-none list-none items-center text-tertiary',
                                        "not-first:before:mx-2 not-first:before:text-fg-quaternary not-first:before:content-['/']",
                                        item.current ? 'active font-medium text-secondary' : '',
                                    ].filter(Boolean).join(' ')}
                                    aria-current={item.current ? 'page' : undefined}
                                >
                                    {item.url && !item.current ? (
                                        <a className="text-tertiary" href={item.url}>
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
                <div className="clear-both" />
            </section>
        </div>
    );
}
