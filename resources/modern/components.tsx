// 浮层几何工具保留为纯函数；页面视觉由上游组件承担。
interface FloatingRect {
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}

export function computeFloatingPosition(
    anchor: FloatingRect,
    panel: Pick<FloatingRect, 'width' | 'height'>,
    viewport: { width: number; height: number },
    gap = 6,
    margin = 8,
) {
    const fitsBelow = anchor.bottom + gap + panel.height <= viewport.height - margin;
    const fitsAbove = anchor.top - gap - panel.height >= margin;
    const placement = !fitsBelow && fitsAbove ? 'top' : 'bottom';
    let top = placement === 'top' ? anchor.top - gap - panel.height : anchor.bottom + gap;
    let left = anchor.left;

    if (left + panel.width > viewport.width - margin) {
        left = viewport.width - margin - panel.width;
    }
    left = Math.max(margin, left);
    top = Math.max(margin, Math.min(top, viewport.height - margin - panel.height));

    return { top, left, placement } as const;
}
