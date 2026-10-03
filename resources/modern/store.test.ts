import { afterEach, describe, expect, it, vi } from 'vitest';
import { overlayStore } from './store';

afterEach(() => {
    overlayStore.reset();
    vi.useRealTimers();
});

describe('overlayStore notice queue', () => {
    it('preserves notice timers and queues while resetting page dialogs and drawers', async () => {
        vi.useFakeTimers();
        [1, 2, 3, 4].forEach((value) => overlayStore.notify(`Notice ${value}`, 'success'));
        const dialog = overlayStore.confirm({ title: 'Confirm', body: 'Continue?' });
        overlayStore.openDrawer({ title: 'Details', body: 'Content' });
        vi.advanceTimersByTime(2000);
        overlayStore.reset({ preserveNotices: true });
        expect(await dialog).toBe(false);
        expect(overlayStore.snapshot().dialog).toBeNull();
        expect(overlayStore.snapshot().drawer).toBeNull();
        expect(overlayStore.snapshot().notices).toHaveLength(3);
        expect(overlayStore.snapshot().noticeQueue).toHaveLength(1);
        vi.advanceTimersByTime(4000);
        expect(overlayStore.snapshot().notices.map((notice) => notice.message)).toEqual(['Notice 4']);
        vi.advanceTimersByTime(6000);
        expect(overlayStore.snapshot().notices).toEqual([]);
    });

    it('keeps success and failure notices visible for six seconds by default', () => {
        vi.useFakeTimers();
        const success = overlayStore.notify('Saved', 'success');
        const failure = overlayStore.notify('Request failed', 'danger');
        vi.advanceTimersByTime(4500);
        expect(overlayStore.snapshot().notices.map((notice) => notice.id)).toEqual([success, failure]);
        vi.advanceTimersByTime(1499);
        expect(overlayStore.snapshot().notices).toHaveLength(2);
        vi.advanceTimersByTime(1);
        expect(overlayStore.snapshot().notices).toEqual([]);
    });

    it('preserves explicit timeouts and persistent notices', () => {
        vi.useFakeTimers();
        overlayStore.notify('Short notice', 'neutral', 500);
        const persistent = overlayStore.notify('Persistent notice', 'danger', 0);
        vi.advanceTimersByTime(500);
        expect(overlayStore.snapshot().notices.map((notice) => notice.id)).toEqual([persistent]);
        vi.advanceTimersByTime(20000);
        expect(overlayStore.snapshot().notices.map((notice) => notice.id)).toEqual([persistent]);
        overlayStore.dismissNotice(persistent);
        expect(overlayStore.snapshot().notices).toEqual([]);
    });

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
