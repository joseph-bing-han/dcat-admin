import { afterEach, describe, expect, it, vi } from 'vitest';
import { overlayStore } from './store';

afterEach(() => {
    overlayStore.reset();
    vi.useRealTimers();
});

describe('overlayStore notice queue', () => {
    it('shows at most three notices and promotes queued notices FIFO', () => {
        const ids = [1, 2, 3, 4, 5].map((value) => overlayStore.notify(`Notice ${value}`, 'neutral', 0));
        expect(overlayStore.snapshot().notices.map((notice) => notice.message)).toEqual(['Notice 1', 'Notice 2', 'Notice 3']);
        expect(overlayStore.snapshot().noticeQueue.map((notice) => notice.message)).toEqual(['Notice 4', 'Notice 5']);

        overlayStore.dismissNotice(ids[1]);
        expect(overlayStore.snapshot().notices.map((notice) => notice.message)).toEqual(['Notice 1', 'Notice 3', 'Notice 4']);
        expect(overlayStore.snapshot().noticeQueue.map((notice) => notice.message)).toEqual(['Notice 5']);
    });

    it('starts queued notice timeout only after promotion', () => {
        vi.useFakeTimers();
        overlayStore.notify('One', 'neutral', 100);
        overlayStore.notify('Two', 'neutral', 100);
        overlayStore.notify('Three', 'neutral', 100);
        const queued = overlayStore.notify('Four', 'neutral', 100);

        vi.advanceTimersByTime(99);
        expect(overlayStore.snapshot().noticeQueue.some((notice) => notice.id === queued)).toBe(true);
        vi.advanceTimersByTime(1);
        expect(overlayStore.snapshot().notices.some((notice) => notice.id === queued)).toBe(true);

        vi.advanceTimersByTime(99);
        expect(overlayStore.snapshot().notices.some((notice) => notice.id === queued)).toBe(true);
        vi.advanceTimersByTime(1);
        expect(overlayStore.snapshot().notices.some((notice) => notice.id === queued)).toBe(false);
    });

    it('clears visible and queued notices on reset', () => {
        [1, 2, 3, 4].forEach((value) => overlayStore.notify(`Notice ${value}`, 'neutral', 0));
        overlayStore.reset();
        expect(overlayStore.snapshot().notices).toEqual([]);
        expect(overlayStore.snapshot().noticeQueue).toEqual([]);
    });
});
