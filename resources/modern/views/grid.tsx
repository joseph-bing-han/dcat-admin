import React, { useLayoutEffect, useRef, useState } from 'react';
import { directFallback, LegacyNodesIsland, meaningfulNodes, safeStructuralProps } from '../dom';
import { Table, TableCard } from '../ui/components/application/table/table';
import { Button } from '../ui/components/base/buttons/button';
import { Pagination } from '../ui/components/application/pagination/pagination-base';
import { EmptyState } from '../presentation';
import { Badge } from '../ui/components/base/badges/badges';
import type { BadgeColors } from '../ui/components/base/badges/badge-types';
import { ProgressBarBase } from '../ui/components/base/progress-indicators/progress-indicators';

export interface GridSortModel {
    href: string;
    icon: string;
    active: boolean;
    currentType?: string | null;
    nextType: string;
    className: string;
    label: string;
}

const gridLabelTones: Record<string, string> = {
    '586cb1': 'primary', '4c60a3': 'primary', '62a8ea': 'primary', '6d8be6': 'primary', '4e9876': 'primary', '458769': 'primary',
    '21b978': 'success',
    'dda451': 'warning',
    'ea5455': 'danger',
    '3085d6': 'info',
    'd2d6de': 'neutral',
};

let gridLabelCanvas: CanvasRenderingContext2D | null | undefined;

export type GridCellModel =
    | {
        kind: 'text';
        text: string;
        props: Record<string, unknown>;
        colSpan: number;
        rowSpan: number;
        width?: string;
    }
    | {
        kind: 'header';
        text: string;
        sort?: GridSortModel | null;
        props: Record<string, unknown>;
        colSpan: number;
        rowSpan: number;
        width?: string;
    }
    | {
        kind: 'link';
        text: string;
        href: string;
        target?: string;
        rel?: string;
        linkProps: Record<string, unknown>;
        props: Record<string, unknown>;
        colSpan: number;
        rowSpan: number;
        width?: string;
    }
    | {
        kind: 'button';
        text: string;
        className: string;
        props: Record<string, unknown>;
        colSpan: number;
        rowSpan: number;
        width?: string;
    }
    | {
        kind: 'labels';
        items: string[];
        className: string;
        style?: React.CSSProperties;
        props: Record<string, unknown>;
        colSpan: number;
        rowSpan: number;
        width?: string;
    }
    | {
        kind: 'images';
        items: Array<{ src: string; maxWidth: number; maxHeight: number; preview?: boolean }>;
        props: Record<string, unknown>;
        colSpan: number;
        rowSpan: number;
        width?: string;
    }
    | {
        kind: 'progress';
        value: number;
        max: number;
        className: string;
        props: Record<string, unknown>;
        colSpan: number;
        rowSpan: number;
        width?: string;
    }
    | {
        kind: 'downloads';
        items: Array<{ href: string; name: string }>;
        props: Record<string, unknown>;
        colSpan: number;
        rowSpan: number;
        width?: string;
    }
    | {
        kind: 'table';
        headers: string[];
        rows: string[][];
        props: Record<string, unknown>;
        colSpan: number;
        rowSpan: number;
        width?: string;
    }
    | {
        kind: 'expand';
        button: string;
        content: string;
        rowKey: string;
        dataKey: string;
        props: Record<string, unknown>;
        colSpan: number;
        rowSpan: number;
        width?: string;
    }
    | {
        kind: 'island';
        nodes: Node[];
        props: Record<string, unknown>;
        colSpan: number;
        rowSpan: number;
        width?: string;
    };

export interface GridRowModel {
    props: Record<string, unknown>;
    cells: GridCellModel[];
}

export interface GridPaginationItem {
    label: string;
    href?: string | null;
    rel?: string;
    ariaLabel?: string;
    active: boolean;
    disabled: boolean;
    className: string;
}

export interface GridPaginationModel {
    className: string;
    items: GridPaginationItem[];
    range?: {
        first?: number | null;
        last?: number | null;
        total?: number | null;
        label?: string;
    };
    perPage?: {
        current: number;
        name: string;
        options: Array<{ label: string; href: string; active: boolean }>;
    } | null;
}

export interface NativeGridModel {
    name: string;
    tableId: string;
    tableProps: Record<string, unknown>;
    tableContainerTag: string;
    tableContainerProps: Record<string, unknown>;
    headerRows: GridRowModel[];
    rows: GridRowModel[];
    quickCreateRows: HTMLTableRowElement[];
    beforeTable: Node[];
    afterTable: Node[];
    pagination: GridPaginationModel | null;
    fixedColumns: { left: number[]; right: number[] };
    empty: boolean;
    emptyLabel: string;
    columnCount: number;
}

export type GridModel = NativeGridModel | { compatNodes: Node[] };

interface GridPayloadCellBase {
    attributes?: Record<string, unknown>;
}

type GridPayloadCell = GridPayloadCellBase & (
    | { kind: 'text'; text: string }
    | { kind: 'link'; text: string; href: string; target?: string; rel?: string }
    | { kind: 'button'; text: string; className: string }
    | { kind: 'labels'; items: string[]; className: string; style?: React.CSSProperties }
    | { kind: 'images'; items: Array<{ src: string; maxWidth: number; maxHeight: number; preview?: boolean }> }
    | { kind: 'progress'; value: number; max: number; className: string }
    | { kind: 'downloads'; items: Array<{ href: string; name: string }> }
    | { kind: 'table'; headers: string[]; rows: string[][] }
    | { kind: 'expand'; button: string; content: string; rowKey: string; dataKey: string }
    | { kind: 'compat'; slotId: string }
);

export interface GridViewPayload {
    name?: string;
    tableId: string;
    tableClassName?: string;
    tableContainerClassName?: string;
    columns: Array<{
        name: string;
        label: string;
        serverType: string;
        attributes?: Record<string, unknown>;
        header?: {
            mode: 'native' | 'compat';
            sort?: GridSortModel | null;
            attributes?: Record<string, unknown>;
        };
    }>;
    complexHeaders?: Array<{
        label: string;
        columns: string[];
        attributes?: Record<string, unknown>;
    }>;
    complexHeaderCompat?: boolean;
    rows: Array<{
        key: string;
        index: number;
        attributes?: Record<string, unknown>;
        cells: GridPayloadCell[];
    }>;
    empty: boolean;
    emptyLabel?: string;
    hasQuickCreate: boolean;
    pagination?: GridPaginationModel | [];
    fixedColumns?: { left?: string[]; right?: string[] } | [];
}

function cellBase(cell: HTMLTableCellElement) {
    return {
        props: safeStructuralProps(cell, ['colspan', 'rowspan', 'width']),
        colSpan: cell.colSpan || 1,
        rowSpan: cell.rowSpan || 1,
        width: cell.getAttribute('width') ?? undefined,
    };
}

function payloadCellBase(attributes: Record<string, unknown> = {}) {
    const colSpan = numberAttribute(attributes.colspan, 1);
    const rowSpan = numberAttribute(attributes.rowspan, 1);
    const width = attributes.width == null ? undefined : String(attributes.width);
    return {
        props: payloadProps(attributes),
        colSpan,
        rowSpan,
        width,
    };
}

function numberAttribute(value: unknown, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function payloadProps(attributes: Record<string, unknown> = {}): Record<string, unknown> {
    const props: Record<string, unknown> = {};
    Object.entries(attributes).forEach(([rawName, rawValue]) => {
        if (rawValue == null) return;
        const name = rawName.toLowerCase();
        const value = String(rawValue);
        if (name === 'class') {
            props.className = value;
        } else if (name === 'style') {
            props.style = styleTextObject(value);
        } else if (name === 'tabindex') {
            props.tabIndex = Number(value);
        } else if (name === 'colspan' || name === 'rowspan' || name === 'width' || name === 'height') {
            return;
        } else if (
            name === 'id'
            || name === 'role'
            || name === 'scope'
            || name === 'title'
            || name === 'dir'
            || name === 'lang'
            || name.startsWith('aria-')
            || (name.startsWith('data-') && !name.startsWith('data-dcat-modern'))
        ) {
            props[name] = value;
        }
    });
    return props;
}

function styleTextObject(style: string): React.CSSProperties {
    const result: Record<string, string> = {};
    style.split(';').forEach((declaration) => {
        const colon = declaration.indexOf(':');
        if (colon < 1) return;
        const property = declaration.slice(0, colon).trim();
        const value = declaration.slice(colon + 1).trim();
        if (!property || !value) return;
        const key = property.startsWith('--')
            ? property
            : property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
        result[key] = value;
    });
    return result as React.CSSProperties;
}

function readCompatCell(cell: HTMLTableCellElement): GridCellModel {
    return { kind: 'island', nodes: Array.from(cell.childNodes), ...cellBase(cell) };
}

function selectAllHeaderLabel(cell: GridCellModel): string | null {
    if (cell.kind !== 'island' || cell.nodes.some((node) => node.textContent?.trim())) return null;

    for (const node of cell.nodes) {
        if (!(node instanceof Element)) continue;
        const input = node.matches('input[data-dcat-grid-select-all="1"]')
            ? node
            : node.querySelector('input[data-dcat-grid-select-all="1"]');
        const label = input?.getAttribute('aria-label')?.trim();
        if (label) return label;
    }

    return null;
}

function readRow(row: HTMLTableRowElement): GridRowModel {
    return {
        props: safeStructuralProps(row),
        cells: Array.from(row.cells).map(readCompatCell),
    };
}

function slot(owner: HTMLElement, id: string): HTMLElement | null {
    return owner.querySelector<HTMLElement>(`[data-dcat-modern-slot="${CSS.escape(id)}"]`);
}

function slotNodes(owner: HTMLElement, id: string): Node[] {
    const element = slot(owner, id);
    return element ? meaningfulNodes(element.childNodes) : [];
}

function payloadCell(owner: HTMLElement, payload: GridPayloadCell): GridCellModel {
    if (payload.kind === 'compat') {
        const element = slot(owner, payload.slotId);
        if (!(element instanceof HTMLTableCellElement)) {
            throw new Error(`Grid compat slot ${payload.slotId} is missing`);
        }
        return readCompatCell(element);
    }

    const base = payloadCellBase(payload.attributes);
    if (payload.kind === 'text') return { kind: 'text', text: payload.text, ...base };
    if (payload.kind === 'link') {
        return {
            kind: 'link',
            text: payload.text,
            href: payload.href,
            target: payload.target,
            rel: payload.rel,
            linkProps: {},
            ...base,
        };
    }
    if (payload.kind === 'button') return { kind: 'button', text: payload.text, className: payload.className, ...base };
    if (payload.kind === 'labels') return { ...payload, ...base };
    if (payload.kind === 'images') return { ...payload, ...base };
    if (payload.kind === 'progress') return { kind: 'progress', value: payload.value, max: payload.max, className: payload.className, ...base };
    if (payload.kind === 'downloads') return { kind: 'downloads', items: payload.items, ...base };
    if (payload.kind === 'expand') return { kind: 'expand', button: payload.button, content: payload.content, rowKey: payload.rowKey, dataKey: payload.dataKey, ...base };
    return { kind: 'table', headers: payload.headers, rows: payload.rows, ...base };
}

function fixedColumnIndexes(columns: GridViewPayload['columns'], names: string[]): number[] {
    const wanted = new Set(names);
    return columns.map((column, index) => wanted.has(column.name) ? index : -1).filter((index) => index >= 0);
}

function useFixedColumns(tableRef: React.RefObject<HTMLTableElement | null>, tableNode: HTMLTableElement | null, fixed: NativeGridModel['fixedColumns']) {
    useLayoutEffect(() => {
        const table = tableRef.current;
        if (!table || (!fixed.left.length && !fixed.right.length)) return undefined;

        const apply = () => {
            const reference = table.querySelector<HTMLTableRowElement>('thead tr:last-child');
            if (!reference) return;
            const widths = Array.from(reference.cells).map((cell) => cell.getBoundingClientRect().width);
            const leftOffsets = new Map<number, number>();
            const rightOffsets = new Map<number, number>();
            let offset = 0;
            fixed.left.forEach((index) => {
                leftOffsets.set(index, offset);
                offset += widths[index] ?? 0;
            });
            offset = 0;
            [...fixed.right].reverse().forEach((index) => {
                rightOffsets.set(index, offset);
                offset += widths[index] ?? 0;
            });

            table.querySelectorAll<HTMLTableRowElement>('tr').forEach((row) => {
                if (row.cells.length !== widths.length) return;
                Array.from(row.cells).forEach((cell, index) => {
                    cell.classList.remove('dcat-modern-grid-fixed', 'dcat-modern-grid-fixed--left', 'dcat-modern-grid-fixed--right');
                    cell.style.removeProperty('left');
                    cell.style.removeProperty('right');
                    if (leftOffsets.has(index)) {
                        cell.classList.add('dcat-modern-grid-fixed', 'dcat-modern-grid-fixed--left');
                        cell.style.left = `${leftOffsets.get(index)}px`;
                    } else if (rightOffsets.has(index)) {
                        cell.classList.add('dcat-modern-grid-fixed', 'dcat-modern-grid-fixed--right');
                        cell.style.right = `${rightOffsets.get(index)}px`;
                    }
                });
            });
        };

        apply();
        const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(apply) : null;
        observer?.observe(table);
        window.addEventListener('resize', apply);
        return () => {
            observer?.disconnect();
            window.removeEventListener('resize', apply);
        };
    }, [tableRef, tableNode, fixed.left.join(','), fixed.right.join(',')]);
}

export function readGridModel(owner: HTMLElement, payload: GridViewPayload | null = null): GridModel {
    const fallback = directFallback(owner);
    if (!payload) return { compatNodes: meaningfulNodes(fallback.childNodes) };
    const box = fallback;
    {
        const headerRows: GridRowModel[] = [];
        if (payload.complexHeaderCompat) {
            const compat = slot(box, 'grid-complex-header');
            if (!(compat instanceof HTMLTableRowElement)) throw new Error('Grid complex-header compat slot is missing');
            headerRows.push(readRow(compat));
        } else if (payload.complexHeaders?.length) {
            headerRows.push({
                props: {},
                cells: payload.complexHeaders.map((header) => ({
                    kind: 'header',
                    text: header.label,
                    sort: null,
                    ...payloadCellBase(header.attributes),
                })),
            });
        }

        headerRows.push({
            props: {},
            cells: payload.columns.map((column, columnIndex): GridCellModel => {
                if (column.header?.mode === 'compat') {
                    const element = slot(box, `grid-header-${columnIndex}`);
                    if (!(element instanceof HTMLTableCellElement)) {
                        throw new Error(`Grid header compat slot grid-header-${columnIndex} is missing`);
                    }
                    return readCompatCell(element);
                }
                return {
                    kind: 'header',
                    text: column.label,
                    sort: column.header?.sort,
                    ...payloadCellBase(column.header?.attributes),
                };
            }),
        });

        const pagination = payload.pagination && !Array.isArray(payload.pagination) ? payload.pagination : null;
        const quickCreateSection = payload.hasQuickCreate ? slot(box, 'grid-quick-create') : null;
        if (payload.hasQuickCreate && !(quickCreateSection instanceof HTMLTableSectionElement)) {
            throw new Error('Grid quick-create compat slot is missing');
        }
        return {
            name: payload.name || '',
            tableId: payload.tableId,
            tableProps: { className: payload.tableClassName ?? '' },
            tableContainerTag: 'div',
            tableContainerProps: { className: payload.tableContainerClassName ?? '' },
            headerRows,
            rows: payload.rows.map((row) => ({
                props: payloadProps(row.attributes),
                cells: row.cells.map((cell) => payloadCell(box, cell)),
            })),
            quickCreateRows: quickCreateSection instanceof HTMLTableSectionElement ? Array.from(quickCreateSection.rows) : [],
            beforeTable: ['grid-toolbar', 'grid-filter', 'grid-header-extra'].flatMap((id) => slotNodes(box, id)),
            afterTable: slotNodes(box, 'grid-footer'),
            pagination,
            fixedColumns: {
                left: fixedColumnIndexes(payload.columns, Array.isArray(payload.fixedColumns) ? [] : (payload.fixedColumns?.left ?? [])),
                right: fixedColumnIndexes(payload.columns, Array.isArray(payload.fixedColumns) ? [] : (payload.fixedColumns?.right ?? [])),
            },
            empty: payload.empty,
            emptyLabel: payload.emptyLabel ?? '',
            columnCount: payload.columns.length,
        };
    }

}

function LegacyQuickCreateRows({ rows }: { rows: HTMLTableRowElement[] }) {
    const host = useRef<HTMLTableSectionElement>(null);

    useLayoutEffect(() => {
        if (!host.current) return;
        const records = rows.map((row) => {
            const parent = row.parentNode;
            if (!parent) return null;
            const anchor = document.createComment('dcat-modern-grid-quick-create');
            parent.insertBefore(anchor, row);
            host.current?.appendChild(row);
            return { row, anchor };
        }).filter((record): record is { row: HTMLTableRowElement; anchor: Comment } => Boolean(record));

        return () => {
            records.forEach(({ row, anchor }) => {
                if (anchor.parentNode) {
                    anchor.parentNode.insertBefore(row, anchor);
                    anchor.remove();
                }
            });
        };
    }, [rows]);

    if (!rows.length) return null;
    return <tbody ref={host} className="dcat-modern-grid-quick-create" data-dcat-modern-legacy-island="grid-quick-create" />;
}

function GridLabel({ children, className, style, tone, autoContrast }: { children: string; className: string; style?: React.CSSProperties; tone?: string; autoContrast: boolean }) {
    const colors: Record<string, BadgeColors> = { primary: 'brand', success: 'success', warning: 'warning', danger: 'error', info: 'blue', neutral: 'gray' };
    return <span className="contents" ref={(wrapper) => {
        const badge = wrapper?.querySelector('span');
        if (!badge) return;
        // Badge 不转发 style/ref；保留 PHP 配置的自定义颜色与对比度修正。
        badge.removeAttribute('style');
        Object.assign(badge.style, style ?? {});
        if (autoContrast) { badge.setAttribute('data-dcat-contrast', ''); gridLabelForeground(badge); }
        else badge.removeAttribute('data-dcat-contrast');
    }}><Badge size="sm" color={colors[tone ?? ''] ?? 'gray'} className={className}>{children}</Badge></span>;
}

function GridCell({ cell, header = false, onExpandToggle, expanded = false, component, collectionProps }: { cell: GridCellModel; header?: boolean; onExpandToggle?: () => void; expanded?: boolean; component?: React.ElementType; collectionProps?: Record<string, unknown> }) {
    const Tag = component ?? (header ? 'th' : 'td');
    const common = {
        ...cell.props,
        colSpan: cell.colSpan,
        rowSpan: cell.rowSpan,
        width: cell.width,
        ...(header ? { scope: typeof cell.props.scope === 'string' ? cell.props.scope : 'col' } : {}),
        ...collectionProps,
    };

    if (cell.kind === 'text') return <Tag {...common}>{cell.text}</Tag>;
    if (cell.kind === 'header') {
        return (
            <Tag {...common}>
                {cell.text}
                {cell.sort ? <><span aria-hidden="true">&nbsp;</span><a href={cell.sort.href} className={cell.sort.className} aria-label={cell.sort.label} title={cell.sort.label} /></> : null}
            </Tag>
        );
    }
    if (cell.kind === 'link') {
        return (
            <Tag {...common}>
                <a {...cell.linkProps} href={cell.href} target={cell.target} rel={cell.rel}>{cell.text}</a>
            </Tag>
        );
    }
    if (cell.kind === 'button') return <Tag {...common}><span className={cell.className}>{cell.text}</span></Tag>;
    if (cell.kind === 'labels') {
        const background = String(cell.style?.backgroundColor ?? '').trim().toLowerCase();
        const tone = gridLabelTones[background.replace(/^#/, '')];
        const className = `dcat-modern-grid-label${tone ? ` dcat-modern-grid-label--${tone}` : ''} ${cell.className}`;
        const autoContrast = background && !tone && !cell.style?.color;
        return <Tag {...common}>{cell.items.map((item, index) => <React.Fragment key={`${item}-${index}`}><GridLabel className={className} style={cell.style} tone={tone} autoContrast={Boolean(autoContrast)}>{item}</GridLabel>{index < cell.items.length - 1 ? ' ' : null}</React.Fragment>)}</Tag>;
    }
    if (cell.kind === 'images') {
        return <Tag {...common}>{cell.items.map((item, index) => <React.Fragment key={`${item.src}-${index}`}><img data-action={item.preview ? 'preview-img' : undefined} src={item.src} alt="" className="img img-thumbnail" style={{ maxWidth: item.maxWidth, maxHeight: item.maxHeight, cursor: item.preview ? 'pointer' : undefined }} />{index < cell.items.length - 1 ? ' ' : null}</React.Fragment>)}</Tag>;
    }
    if (cell.kind === 'progress') {
        return <Tag {...common}><div ref={(node) => node?.querySelector('[role="progressbar"]')?.setAttribute('aria-label', `Progress: ${cell.value}%`)}><ProgressBarBase value={cell.value} max={cell.max} className={cell.className} progressClassName="progress-bar" /></div></Tag>;
    }
    if (cell.kind === 'downloads') {
        return <Tag {...common}>{cell.items.map((item, index) => <React.Fragment key={`${item.href}-${index}`}><a href={item.href} download={item.name} target="_blank" className="text-muted"><i className="feather icon-download" aria-hidden="true" /> {item.name}</a>{index < cell.items.length - 1 ? <br /> : null}</React.Fragment>)}</Tag>;
    }
    if (cell.kind === 'table') {
        return (
            <Tag {...common}>
                <table className="table table-hover" style={{ marginBottom: 0 }}>
                    <thead><tr>{cell.headers.map((headerValue) => <th key={headerValue}>{headerValue}</th>)}</tr></thead>
                    <tbody>{cell.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => <td key={columnIndex}>{value}</td>)}</tr>)}</tbody>
                </table>
            </Tag>
        );
    }
    if (cell.kind === 'expand') {
        return (
            <Tag {...common}>
                <Button
                    color="tertiary"
                    className="grid-expand dcat-modern-grid-expand"
                    data-id={cell.rowKey}
                    data-key={cell.dataKey}
                    aria-expanded={expanded}
                    onPress={onExpandToggle}
                >
                    <i className={`feather ${expanded ? 'icon-chevrons-down' : 'icon-chevrons-right'}`} aria-hidden="true" />{' '}{cell.button}
                </Button>
            </Tag>
        );
    }
    const headerLabel = header ? selectAllHeaderLabel(cell) : null;
    return (
        <Tag {...common}>
            <LegacyNodesIsland nodes={cell.nodes} kind={header ? 'grid-header-cell' : 'grid-cell'} />
            {headerLabel ? <span className="sr-only">{headerLabel}</span> : null}
        </Tag>
    );
}

function GridDataRow({ row, columnCount }: { row: GridRowModel; columnCount: number }) {
    const [expanded, setExpanded] = useState(false);
    const expandCell = row.cells.find((cell): cell is Extract<GridCellModel, { kind: 'expand' }> => cell.kind === 'expand');
    return (
        <>
            <tr {...row.props}>
                {row.cells.map((cell, cellIndex) => (
                    <GridCell
                        key={cellIndex}
                        cell={cell}
                        expanded={expanded}
                        onExpandToggle={cell.kind === 'expand' ? () => setExpanded((value) => !value) : undefined}
                    />
                ))}
            </tr>
            {expandCell && expanded ? (
                <tr className="dcat-modern-grid-expand-row" data-expand-row={expandCell.dataKey}>
                    <td colSpan={Math.max(1, columnCount)}>{expandCell.content}</td>
                </tr>
            ) : null}
        </>
    );
}

function GridRows({ rows, header = false, columnCount = 1 }: { rows: GridRowModel[]; header?: boolean; columnCount?: number }) {
    return (
        <>
            {rows.map((row, rowIndex) => header ? (
                <tr key={rowIndex} {...row.props}>
                    {row.cells.map((cell, cellIndex) => <GridCell key={cellIndex} cell={cell} header />)}
                </tr>
            ) : <GridDataRow key={rowIndex} row={row} columnCount={columnCount} />)}
        </>
    );
}

function gridLabelForeground(label: HTMLSpanElement | null) {
    if (!label) return;
    const canvas = gridLabelCanvas ??= document.createElement('canvas').getContext('2d');
    if (!canvas) return;

    const ancestors: Element[] = [];
    for (let node: Element | null = label; node; node = node.parentElement) ancestors.unshift(node);
    canvas.fillStyle = '#fff';
    canvas.fillRect(0, 0, 1, 1);
    ancestors.forEach((node) => {
        canvas.fillStyle = getComputedStyle(node).backgroundColor;
        canvas.fillRect(0, 0, 1, 1);
    });

    const [red, green, blue] = canvas.getImageData(0, 0, 1, 1).data;
    const channel = (value: number) => {
        const normalized = value / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    };
    label.style.color = 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue) > 0.179 ? '#000' : '#fff';
}

function paginationItemLabel(item: GridPaginationItem) {
    if (item.label.trim()) return item.label;
    if (item.rel === 'prev') return '‹';
    if (item.rel === 'next') return '›';
    return '';
}

function GridPagination({ model }: { model: GridPaginationModel | null }) {
    if (!model?.items.length) return null;
    return (
        <div className="dcat-modern-grid-pagination">
            {model.range?.label ? <span className="d-none d-sm-inline dcat-modern-grid-pagination-range">{model.range.label}</span> : null}
            <Pagination.Root page={Math.max(1, Number(model.items.find((item) => item.active)?.label) || 1)} total={Math.max(1, ...model.items.map((item) => Number(item.label) || 0))} className="flex items-center gap-1">
                <ul className={model.className}>
                    {model.items.map((item, index) => (
                        <li key={`${item.label}-${index}`} className={item.className}>
                            {item.href && !item.disabled
                                ? <Button className="page-link" color="secondary" size="sm" href={item.href} rel={item.rel} aria-label={item.ariaLabel}>{paginationItemLabel(item)}</Button>
                                : <span className="page-link" aria-current={item.active ? 'page' : undefined} aria-label={item.ariaLabel}>{paginationItemLabel(item)}</span>}
                        </li>
                    ))}
                </ul>
            </Pagination.Root>
            {model.perPage?.options.length ? (
                <div className="pull-right d-none d-sm-inline per-pages-selector" data-dcat-per-page-name={model.perPage.name}>
                    <span className="dropdown dropup">
                        <button type="button" className="btn btn-white dropdown-toggle btn-sm" data-toggle="dropdown" aria-expanded="false" aria-label={`Rows per page: ${model.perPage.current}`}>
                            {model.perPage.current}
                        </button>
                        <ul className="dropdown-menu" role="menu">
                            {model.perPage.options.map((option) => (
                                <li key={option.href} className={`dropdown-item${option.active ? ' active' : ''}`}>
                                    <a href={option.href} aria-current={option.active ? 'page' : undefined}>{option.label}</a>
                                </li>
                            ))}
                        </ul>
                    </span>
                </div>
            ) : null}
        </div>
    );
}

function NativeGridView({ model }: { model: NativeGridModel }) {
    const tableClassName = String(model.tableProps.className ?? '');
    const tableContainerClassName = String(model.tableContainerProps.className ?? '');
    const tableRef = useRef<HTMLTableElement>(null);
    const [tableNode, setTableNode] = useState<HTMLTableElement | null>(null);
    const attachTable = React.useCallback((node: HTMLTableElement | null) => { tableRef.current = node; setTableNode(node); }, []);
    useFixedColumns(tableRef, tableNode, model.fixedColumns);
    useLayoutEffect(() => {
        const table = tableRef.current;
        if (!table) return;
        // 主题变量或祖先背景变化后，重新计算自定义标签的可读前景。
        const observer = new MutationObserver(() => {
            table.querySelectorAll<HTMLSpanElement>('[data-dcat-contrast]').forEach(gridLabelForeground);
        });
        for (let node: Element | null = table; node; node = node.parentElement) {
            observer.observe(node, { attributes: true, attributeFilter: ['style', 'class'] });
        }
        return () => observer.disconnect();
    }, [tableNode]);

    // collection 不支持跨行表头与直接插入的原始 tr；这些能力保留原生表格语义。
    const collectionCompatible = model.headerRows.length === 1 && !model.quickCreateRows.length
        && [...model.headerRows, ...model.rows].every((row) => row.cells.length === model.columnCount
            && row.cells.every((cell) => cell.colSpan === 1 && cell.rowSpan === 1 && cell.kind !== 'expand'));
    const tableProps = { ...model.tableProps, id: model.tableId || undefined, className: `dcat-modern-table ${tableClassName}`.trim(), 'data-dcat-modern-fixed-columns': model.fixedColumns.left.length || model.fixedColumns.right.length ? '1' : undefined };
    const table = collectionCompatible ? (
        <Table ref={attachTable} {...tableProps} aria-label={model.name || 'Data table'} selectionMode="none">
            <Table.Header>
                {model.headerRows[0].cells.map((cell, index) => React.cloneElement(GridCell({ cell, header: true, component: Table.Head, collectionProps: { id: `column-${index}`, isRowHeader: index === 0, ref: (node: HTMLTableCellElement | null) => { if (node) { node.setAttribute("scope", String(cell.props.scope ?? "col")); if (cell.width) node.setAttribute("width", cell.width); } } } }), { key: index }))}
            </Table.Header>
            <Table.Body renderEmptyState={() => <EmptyState title={model.emptyLabel} />}>
                {model.rows.map((row, rowIndex) => (
                    <Table.Row key={rowIndex} {...row.props} id={`row-${rowIndex}`}>
                        {row.cells.map((cell, index) => React.cloneElement(GridCell({ cell, component: Table.Cell, collectionProps: { textValue: cell.kind === 'text' || cell.kind === 'link' ? cell.text : '' } }), { key: index }))}
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    ) : (
        <table ref={attachTable} {...model.tableProps} id={model.tableId || undefined} className={`dcat-modern-table dcat-modern-table--structural ${tableClassName}`.trim()} data-dcat-modern-fixed-columns={model.fixedColumns.left.length || model.fixedColumns.right.length ? '1' : undefined}>
            {model.headerRows.length ? <thead><GridRows rows={model.headerRows} header /></thead> : null}
            <LegacyQuickCreateRows rows={model.quickCreateRows} />
            <tbody>
                {model.rows.length
                    ? <GridRows rows={model.rows} columnCount={model.columnCount} />
                    : model.empty
                        ? <tr><td colSpan={Math.max(1, model.columnCount)}><EmptyState title={model.emptyLabel} /></td></tr>
                        : null}
            </tbody>
        </table>
    );
    return (
        <section className="dcat-modern-grid-view" data-dcat-modern-grid-name={model.name} data-dcat-modern-grid-renderer="react-payload" data-dcat-grid-interactions="native">
            {model.beforeTable.length ? <div className="dcat-modern-grid-toolbar"><LegacyNodesIsland nodes={model.beforeTable} kind="grid-toolbar" /></div> : null}
            <TableCard.Root className="dcat-modern-grid-table-card">{React.createElement(model.tableContainerTag, {
                ...model.tableContainerProps,
                className: `dcat-modern-table-wrap ${tableContainerClassName}`.trim(),
            }, table)}</TableCard.Root>
            {model.afterTable.length ? <div className="dcat-modern-grid-footer"><LegacyNodesIsland nodes={model.afterTable} kind="grid-footer" /></div> : null}
            <GridPagination model={model.pagination} />
        </section>
    );
}

export function GridView({ model }: { model: GridModel }) {
    return 'compatNodes' in model
        ? <LegacyNodesIsland nodes={model.compatNodes} kind="grid-custom-view" />
        : <NativeGridView model={model} />;
}
