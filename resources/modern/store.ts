import type { DialogRequest, DrawerRequest, Notice, NoticeTone } from './types';

type Listener = () => void;

interface OverlayState {
    notices: Notice[];
    noticeQueue: Notice[];
    dialog: DialogRequest | null;
    drawer: DrawerRequest | null;
}

function startNoticeTimer(notice: Notice): void {
    if (notice.timeout <= 0 || noticeTimers.has(notice.id)) return;
    const timer = window.setTimeout(() => overlayStore.dismissNotice(notice.id), notice.timeout);
    noticeTimers.set(notice.id, timer);
}

function clearNoticeTimer(noticeId: string): void {
    const timer = noticeTimers.get(noticeId);
    if (timer !== undefined) window.clearTimeout(timer);
    noticeTimers.delete(noticeId);
}

function clearAllNoticeTimers(): void {
    noticeTimers.forEach((timer) => window.clearTimeout(timer));
    noticeTimers.clear();
}

let state: OverlayState = {
    notices: [],
    noticeQueue: [],
    dialog: null,
    drawer: null,
};

const listeners = new Set<Listener>();
const noticeTimers = new Map<string, number>();

function emit(): void {
    listeners.forEach((listener) => listener());
}

function id(prefix: string): string {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const overlayStore = {
    subscribe(listener: Listener): () => void {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },

    snapshot(): OverlayState {
        return state;
    },

    notify(message: string, tone: NoticeTone = 'neutral', timeout = 4500): string {
        const notice: Notice = { id: id('notice'), message, tone, timeout };
        if (state.notices.length < 3) {
            state = { ...state, notices: [...state.notices, notice] };
            startNoticeTimer(notice);
        } else {
            state = { ...state, noticeQueue: [...state.noticeQueue, notice] };
        }
        emit();
        return notice.id;
    },

    dismissNotice(noticeId: string): void {
        const visible = state.notices.some((notice) => notice.id === noticeId);
        if (!visible) {
            state = { ...state, noticeQueue: state.noticeQueue.filter((notice) => notice.id !== noticeId) };
            emit();
            return;
        }

        clearNoticeTimer(noticeId);
        const notices = state.notices.filter((notice) => notice.id !== noticeId);
        const [promoted, ...noticeQueue] = state.noticeQueue;
        if (promoted) {
            notices.push(promoted);
            startNoticeTimer(promoted);
        }
        state = { ...state, notices, noticeQueue };
        emit();
    },

    confirm(options: Omit<DialogRequest, 'id' | 'resolve'>): Promise<boolean> {
        if (state.dialog) {
            state.dialog.resolve(false);
        }

        return new Promise<boolean>((resolve) => {
            state = { ...state, dialog: { ...options, id: id('dialog'), resolve } };
            emit();
        });
    },

    resolveDialog(result: boolean): void {
        const dialog = state.dialog;
        if (!dialog) return;
        state = { ...state, dialog: null };
        emit();
        dialog.resolve(result);
    },

    openDrawer(options: Omit<DrawerRequest, 'id'>): string {
        const drawer = { ...options, id: id('drawer') };
        state = { ...state, drawer };
        emit();
        return drawer.id;
    },

    closeDrawer(drawerId?: string): void {
        if (drawerId && state.drawer?.id !== drawerId) return;
        state = { ...state, drawer: null };
        emit();
    },

    reset(): void {
        if (state.dialog) state.dialog.resolve(false);
        clearAllNoticeTimers();
        state = { notices: [], noticeQueue: [], dialog: null, drawer: null };
        emit();
    },
};

