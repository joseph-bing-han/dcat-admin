export interface FormHost {
    token: string | null;
    error(message: unknown): unknown;
    handleAjaxError(error: unknown): unknown;
    handleJsonResponse(response: Record<string, unknown>): unknown;
    confirm(title: string, content: string, callback: () => void): unknown;
}

export interface FormOptions {
    confirm?: { title?: string; content?: string } | null;
    redirect?: boolean;
    validationErrorToastr?: boolean;
    before?: (data: FormData, form: HTMLFormElement) => unknown;
    after?: (success: boolean, response: unknown) => unknown;
    success?: (response: unknown) => unknown;
    error?: (response: unknown) => unknown;
}

export const formState: { lastSubmit: Record<string, unknown> | null } = { lastSubmit: null };
const bindings = new WeakMap<HTMLFormElement, FormOptions>();

function clearErrors(form: HTMLFormElement): void {
    form.querySelectorAll('.has-error,.has-danger').forEach((group) => group.classList.remove('has-error', 'has-danger'));
    form.querySelectorAll('.help-block.with-errors').forEach((container) => container.replaceChildren());
    form.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute('aria-invalid'));
}

export function showFormErrors(host: FormHost, form: HTMLFormElement, errors: Record<string, unknown>): void {
    let first: HTMLElement | null = null;
    Object.entries(errors).forEach(([column, messages]) => {
        const [head, ...parts] = column.split('.');
        const name = head + parts.map((part) => `[${part}]`).join('');
        const candidates = [name, `${name}[]`, name.replace(/start$/, ''), name.replace(/end$/, ''), name.replace(/(?:start|end)\]$/, ']')];
        let field: HTMLElement | null = null;
        for (const candidate of candidates) {
            const element = form.elements.namedItem(candidate);
            if (element instanceof HTMLElement) field = element;
            else if (element instanceof RadioNodeList && element[0] instanceof HTMLElement) field = element[0];
            if (field) break;
        }
        const messageList = Array.isArray(messages) ? messages : [messages];
        if (!field) { host.error(messageList.map(String).join('\n')); return; }
        const group = field.closest('.form-group,.form-label-group,.form-field');
        group?.classList.add('has-error', 'has-danger');
        field.setAttribute('aria-invalid', 'true');
        let container = group?.querySelector<HTMLElement>('.help-block.with-errors');
        if (!container && group) {
            container = document.createElement('div');
            container.className = 'help-block with-errors';
            group.appendChild(container);
        }
        container?.replaceChildren(...messageList.map((message) => {
            const item = document.createElement('div');
            item.className = 'dcat-modern-form-error';
            item.textContent = String(message);
            return item;
        }));
        first ||= field;
    });
    if (!first) return;
    const field = first as HTMLElement;
    const pane = field.closest('.tab-pane,[role="tabpanel"]');
    if (pane?.id) document.querySelector<HTMLElement>(`[role="tab"][aria-controls="${CSS.escape(pane.id)}"],a[href="#${CSS.escape(pane.id)}"]`)?.click();
    const focus = () => {
        if (!field.isConnected) return;
        field.focus({ preventScroll: true });
        if (document.activeElement === field) field.scrollIntoView({ block: 'center', behavior: 'auto' });
    };
    focus();
    if (document.activeElement !== field) requestAnimationFrame(focus);
}

export async function submitForm(host: FormHost, form: HTMLFormElement, options: FormOptions = {}): Promise<unknown> {
    const state = formState.lastSubmit = { stage: 'captured' } as Record<string, unknown>;
    if (form.dataset.dcatSubmitting === '1') { state.stage = 'duplicate-blocked'; return false; }
    clearErrors(form);
    if (!form.checkValidity()) { state.stage = 'invalid'; form.reportValidity(); return false; }
    const data = new FormData(form);
    if (host.token && !data.has('_token')) data.append('_token', host.token);
    if (options.before?.(data, form) === false) return false;
    form.dataset.dcatSubmitting = '1';
    form.setAttribute('aria-busy', 'true');
    const submitters = Array.from(form.querySelectorAll<HTMLButtonElement>('[type="submit"],.submit'));
    const originals = submitters.map((button) => ({ button, disabled: button.disabled, aria: button.getAttribute('aria-disabled') }));
    originals.forEach(({ button }) => {
        button.disabled = true;
        button.dataset.dcatNativeBusy = '1';
        button.classList.add('btn-loading');
        button.setAttribute('aria-disabled', 'true');
    });
    try {
        state.stage = 'fetching';
        const response = await fetch(form.action || location.href, {
            method: (form.method || 'POST').toUpperCase(), credentials: 'same-origin',
            headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json', ...(host.token ? { 'X-CSRF-TOKEN': host.token } : {}) },
            body: data,
        });
        state.stage = 'response';
        state.status = response.status;
        // 页面已离开时只结束写请求，不把旧响应反馈到新页面或重放请求。
        if (!form.isConnected) return false;
        if (response.redirected && response.url && response.url !== location.href) { location.assign(response.url); return; }
        const payload = response.status === 204 ? {} : response.headers.get('content-type')?.includes('application/json')
            ? await response.json() : { message: await response.text(), success: response.ok };
        if (options.after?.(response.ok, payload) === false) return false;
        if (response.ok) {
            if (options.success?.(payload) === false) return false;
            if (options.redirect === false || payload.redirect === false) {
                if (payload.data) delete payload.data.then;
                delete payload.redirect;
                delete payload.refresh;
                delete payload.reload;
            }
            host.handleJsonResponse(payload);
        } else {
            if (options.error?.(payload) === false) return false;
            if (response.status === 422 && payload.errors) {
                state.stage = 'validation-error';
                showFormErrors(host, form, payload.errors);
                if (options.validationErrorToastr) host.error(Object.values(payload.errors).flat().join('\n'));
            } else host.error(payload.message || `HTTP ${response.status}`);
        }
        return payload;
    } catch (error) {
        state.stage = 'network-error';
        if (form.isConnected && options.after?.(false, error) !== false && options.error?.(error) !== false) host.handleAjaxError(error);
        return false;
    } finally {
        delete form.dataset.dcatSubmitting;
        form.removeAttribute('aria-busy');
        originals.forEach(({ button, disabled, aria }) => {
            button.disabled = disabled;
            delete button.dataset.dcatNativeBusy;
            button.classList.remove('btn-loading');
            if (aria === null) button.removeAttribute('aria-disabled');
            else button.setAttribute('aria-disabled', aria);
        });
    }
}

export function bindForm(host: FormHost, form: HTMLFormElement, options: FormOptions = {}): void {
    const bound = bindings.has(form);
    bindings.set(form, options);
    if (bound) return;
    form.dataset.dcatNativeForm = '1';
    form.addEventListener('submit', (event) => {
        if (form.dataset.dcatNativeSubmit === 'off' || event.defaultPrevented) return;
        event.preventDefault();
        const settings = bindings.get(form) || {};
        if (form.dataset.dcatSubmitting === '1' || form.dataset.dcatConfirming === '1') return;
        if (settings.confirm?.title) {
            if (!form.reportValidity()) return;
            form.dataset.dcatConfirming = '1';
            const dialog = host.confirm(settings.confirm.title, settings.confirm.content || '', () => {
                delete form.dataset.dcatConfirming;
                void submitForm(host, form, settings);
            });
            if (dialog instanceof HTMLDialogElement) dialog.addEventListener('close', () => { delete form.dataset.dcatConfirming; }, { once: true });
            else delete form.dataset.dcatConfirming;
        } else void submitForm(host, form, settings);
    });
    form.addEventListener('input', (event) => {
        const field = event.target instanceof HTMLElement ? event.target : null;
        const group = field?.closest('.form-group,.form-label-group,.form-field');
        group?.classList.remove('has-error', 'has-danger');
        field?.removeAttribute('aria-invalid');
        group?.querySelector('.help-block.with-errors')?.replaceChildren();
    });
    form.addEventListener('reset', () => clearErrors(form));
}
