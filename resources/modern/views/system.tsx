import React from 'react';
import { Alert, Button, Card, Checkbox, Input } from '../components';
import { LegacyNodesIsland, meaningfulNodes } from '../dom';

export interface SystemViewPayload {
    page: 'login' | 'feedback' | 'exception' | string;
    action?: string;
    remember?: boolean;
    csrf?: string;
    adminName?: string;
    welcome?: string;
    submitLabel?: string;
    labels?: { username?: string; password?: string; remember?: string };
    old?: { username?: string; remember?: boolean };
    errors?: Record<string, string[]>;
    tone?: 'danger' | 'success' | 'info' | 'warning' | string;
    title?: string;
    messages?: string[];
    renderer?: 'native' | 'compat';
    exception?: {
        type: string;
        file: string;
        line: string;
        message: string;
        trace: string;
    };
}

interface SystemModel {
    payload: SystemViewPayload | null;
    contentSlot?: HTMLElement;
    legacyNodes: Node[];
}

function findSlot(fallback: HTMLElement, id: string): HTMLElement | undefined {
    return Array.from(fallback.querySelectorAll<HTMLElement>('[data-dcat-modern-slot]'))
        .find((node) => node.getAttribute('data-dcat-modern-slot') === id);
}

export function readSystemModel(owner: HTMLElement, payload: SystemViewPayload | null): SystemModel {
    const fallback = owner.querySelector<HTMLElement>(':scope > [data-dcat-modern-fallback]');
    if (!fallback) {
        return {
            payload,
            legacyNodes: meaningfulNodes(Array.from(owner.childNodes).filter((node) => !(node instanceof HTMLElement && node.hasAttribute('data-dcat-modern-managed')))),
        };
    }
    return {
        payload,
        contentSlot: findSlot(fallback, 'system-feedback-content'),
        legacyNodes: meaningfulNodes(fallback.childNodes),
    };
}

function LoginView({ payload }: { payload: SystemViewPayload }) {
    const [errors, setErrors] = React.useState<Record<string, string[]>>(() => payload.errors || {});
    const [submitting, setSubmitting] = React.useState(false);
    const usernameLabel = payload.labels?.username || 'Username';
    const passwordLabel = payload.labels?.password || 'Password';
    const rememberLabel = payload.labels?.remember || 'Remember me';

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (submitting || !payload.action) return;
        const dcat = (window as unknown as { Dcat?: Record<string, any> }).Dcat;
        if (!dcat) return;
        const form = event.currentTarget;
        setSubmitting(true);
        setErrors({});
        try {
            const response = await dcat.request(payload.action, { method: 'POST', body: new FormData(form) });
            dcat.handleJsonResponse(response && typeof response === 'object' ? response : {});
        } catch (error) {
            const candidate = error as { payload?: unknown };
            const response = candidate?.payload && typeof candidate.payload === 'object' ? candidate.payload as Record<string, unknown> : {};
            const rawValidation = response.errors && typeof response.errors === 'object' ? response.errors as Record<string, unknown> : {};
            const validation = Object.fromEntries(Object.entries(rawValidation).map(([name, messages]) => [
                name,
                Array.isArray(messages) ? messages.map((message) => String(message)) : [String(messages ?? '')],
            ]));
            setErrors(validation);
            if (!Object.keys(validation).length) dcat.handleAjaxError(error);
        } finally {
            setSubmitting(false);
        }
    };

    const fieldError = (name: string) => (errors[name] || [])[0] || '';
    return (
        <main className="dcat-modern-login" data-dcat-modern-system-renderer="login">
            <div className="dcat-modern-login__brand">{payload.adminName}</div>
            <Card className="dcat-modern-login__card">
                <p className="dcat-modern-login__welcome">{payload.welcome}</p>
                <form id="login-form" method="POST" action={payload.action} onSubmit={(event) => void submit(event)} noValidate>
                    <input type="hidden" name="_token" value={payload.csrf || ''} />
                    <div className="dcat-modern-login__field">
                        <label htmlFor="login-username">{usernameLabel}</label>
                        <Input id="login-username" type="text" name="username" placeholder={usernameLabel} defaultValue={payload.old?.username || ''} required autoFocus aria-invalid={fieldError('username') ? 'true' : undefined} aria-describedby="login-username-error" />
                        <div id="login-username-error" className="dcat-modern-login__error" aria-live="polite">{fieldError('username')}</div>
                    </div>
                    <div className="dcat-modern-login__field">
                        <label htmlFor="login-password">{passwordLabel}</label>
                        <Input id="login-password" minLength={5} maxLength={20} type="password" name="password" placeholder={passwordLabel} required autoComplete="current-password" aria-invalid={fieldError('password') ? 'true' : undefined} aria-describedby="login-password-error" />
                        <div id="login-password-error" className="dcat-modern-login__error" aria-live="polite">{fieldError('password')}</div>
                    </div>
                    <div className="dcat-modern-login__actions">
                        {payload.remember ? <Checkbox id="remember" name="remember" value="1" label={rememberLabel} defaultChecked={Boolean(payload.old?.remember)} /> : <span />}
                        <Button type="submit" tone="primary" loading={submitting} disabled={submitting}>{payload.submitLabel || 'Login'}</Button>
                    </div>
                </form>
            </Card>
        </main>
    );
}

function FeedbackView({ model }: { model: SystemModel }) {
    const payload = model.payload!;
    const [visible, setVisible] = React.useState(true);
    if (!visible) return null;
    const tone = payload.tone === 'danger' || payload.tone === 'warning' || payload.tone === 'success' ? payload.tone : 'neutral';
    return (
        <Alert tone={tone} className="dcat-modern-feedback" data-dcat-modern-system-renderer="feedback">
            <button type="button" className="dcat-modern-feedback__dismiss" aria-label="Dismiss notification" onClick={() => setVisible(false)}>×</button>
            {payload.title ? <h4>{payload.title}</h4> : null}
            {payload.renderer === 'compat' && model.contentSlot
                ? <LegacyNodesIsland nodes={[model.contentSlot]} kind="system-feedback-content" />
                : (payload.messages || []).map((message, index) => <p key={`${index}-${message}`}>{message}</p>)}
        </Alert>
    );
}

function ExceptionView({ payload }: { payload: SystemViewPayload }) {
    const [expanded, setExpanded] = React.useState(false);
    const exception = payload.exception;
    if (!exception) return null;
    return (
        <Alert tone="warning" className="dcat-modern-exception" data-dcat-modern-system-renderer="exception">
            <h4 className="dcat-modern-exception__title">
                <span>{exception.type}</span>
                <span> in {exception.file} line {exception.line}</span>
            </h4>
            <Button
                tone="tertiary"
                className="dcat-modern-exception__toggle"
                aria-expanded={expanded}
                aria-controls="dcat-modern-exception-trace"
                onPress={() => setExpanded((value) => !value)}
            >
                {exception.message}
            </Button>
            {expanded ? <pre id="dcat-modern-exception-trace" className="dcat-modern-exception__trace" tabIndex={0}>{exception.trace}</pre> : null}
        </Alert>
    );
}

export function SystemView({ model }: { model: SystemModel }) {
    if (model.payload?.page === 'login') return <LoginView payload={model.payload} />;
    if (model.payload?.page === 'feedback') return <FeedbackView model={model} />;
    if (model.payload?.page === 'exception') return <ExceptionView payload={model.payload} />;
    return <LegacyNodesIsland nodes={model.legacyNodes} kind="system-legacy" />;
}
