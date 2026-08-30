import React, { useLayoutEffect, useRef } from 'react';

export function directFallback(owner: HTMLElement): HTMLElement {
    const fallback = Array.from(owner.children).find((child) => child.hasAttribute('data-dcat-modern-fallback'));
    if (!(fallback instanceof HTMLElement)) {
        throw new Error('Modern React capability requires a direct data-dcat-modern-fallback child');
    }
    return fallback;
}

export function meaningfulNodes(nodes: Iterable<Node>): Node[] {
    return Array.from(nodes).filter((node) => node.nodeType !== Node.TEXT_NODE || Boolean(node.textContent?.trim()));
}

export function LegacyNodesIsland({
    nodes,
    className = '',
    hidden = false,
    kind = 'content',
}: {
    nodes: Node[];
    className?: string;
    hidden?: boolean;
    kind?: string;
}) {
    const host = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!host.current) return;
        const records = nodes.map((node) => {
            const parent = node.parentNode;
            if (!parent) return null;
            const anchor = document.createComment('dcat-modern-legacy-island');
            parent.insertBefore(anchor, node);
            host.current?.appendChild(node);
            return { node, anchor };
        }).filter((record): record is { node: Node; anchor: Comment } => Boolean(record));

        return () => {
            records.forEach(({ node, anchor }) => {
                if (anchor.parentNode) {
                    anchor.parentNode.insertBefore(node, anchor);
                    anchor.remove();
                }
            });
        };
    }, [nodes]);

    return (
        <div
            ref={host}
            className={`dcat-modern-legacy-island ${className}`.trim()}
            data-dcat-modern-legacy-island={kind}
            hidden={hidden}
        />
    );
}

export function safeClassName(element: Element): string {
    return element.getAttribute('class') ?? '';
}

export function safeElementProps(element: HTMLElement): Record<string, unknown> {
    const props: Record<string, unknown> = {};
    Array.from(element.attributes).forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        if (name === 'class') {
            props.className = attribute.value;
        } else if (name === 'style') {
            props.style = styleObject(element.style);
        } else if (name === 'tabindex') {
            props.tabIndex = Number(attribute.value);
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
            props[name] = attribute.value;
        }
    });
    return props;
}

export function safeStructuralProps(element: HTMLElement, preservedByCaller: string[] = []): Record<string, unknown> {
    const allowed = new Set([
        'class',
        'style',
        'tabindex',
        'id',
        'role',
        'scope',
        'title',
        'dir',
        'lang',
        ...preservedByCaller.map((name) => name.toLowerCase()),
    ]);

    Array.from(element.attributes).forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        if (allowed.has(name) || name.startsWith('aria-') || name.startsWith('data-')) {
            return;
        }
        throw new Error(`Unsafe structural attribute requires legacy fallback: ${element.tagName.toLowerCase()}[${name}]`);
    });

    return safeElementProps(element);
}

export function styleObject(style: CSSStyleDeclaration): Record<string, string | number> {
    const result: Record<string, string | number> = {};
    Array.from(style).forEach((property) => {
        const value = style.getPropertyValue(property);
        if (!value) return;
        const key = property.startsWith('--')
            ? property
            : property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
        result[key] = value;
    });
    return result;
}

