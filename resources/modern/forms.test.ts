import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindForm, submitForm, type FormHost } from './forms';

let form: HTMLFormElement;
let host: FormHost;

beforeEach(() => {
    document.body.innerHTML = '<form action="/write" method="post"><div class="form-group"><input name="record[name]" value="Alice"><div class="help-block with-errors"></div></div><input name="_method" type="hidden" value="PUT"><input name="after-save" type="hidden" value="3"><button type="submit">Save</button><button type="submit" disabled>Disabled</button></form>';
    form = document.querySelector('form')!;
    host = { token: 'fixture-token', error: vi.fn(), handleAjaxError: vi.fn(), handleJsonResponse: vi.fn(), confirm: vi.fn() };
});
afterEach(() => vi.unstubAllGlobals());

describe('native form transport', () => {
    it('preserves multipart names, CSRF, method spoofing and after-save with one write for duplicate submits', async () => {
        let release!: (value: unknown) => void;
        const pending = new Promise((resolve) => { release = resolve; });
        vi.stubGlobal('fetch', vi.fn().mockReturnValue(pending));
        bindForm(host, form);
        bindForm(host, form);
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        expect(fetch).toHaveBeenCalledTimes(1);
        const options = vi.mocked(fetch).mock.calls[0][1]!;
        const body = options.body as FormData;
        expect(body.get('record[name]')).toBe('Alice');
        expect(body.get('_method')).toBe('PUT');
        expect(body.get('after-save')).toBe('3');
        expect(body.get('_token')).toBe('fixture-token');
        expect(options.headers).toMatchObject({ 'X-CSRF-TOKEN': 'fixture-token' });
        expect(form.getAttribute('aria-busy')).toBe('true');
        release({ status: 200, ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({ status: true }) });
        await vi.waitFor(() => expect(host.handleJsonResponse).toHaveBeenCalledTimes(1));
        const buttons = form.querySelectorAll('button');
        expect(buttons[0].disabled).toBe(false);
        expect(buttons[1].disabled).toBe(true);
        expect(form.hasAttribute('aria-busy')).toBe(false);
    });

    it('renders server validation as text and focuses the nested field', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 422, ok: false, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({ errors: { 'record.name': ['<img src=x onerror=alert(1)>'] } }) }));
        await submitForm(host, form);
        expect(form.querySelector('.help-block')?.textContent).toBe('<img src=x onerror=alert(1)>');
        expect(form.querySelector('img')).toBeNull();
        expect(form.querySelector('input')?.getAttribute('aria-invalid')).toBe('true');
        expect(document.activeElement).toBe(form.querySelector('input'));
        expect(host.handleJsonResponse).not.toHaveBeenCalled();
    });

    it('leaves a failed write retryable without replaying it or changing values', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Offline')));
        await submitForm(host, form);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(form.querySelector('input')?.value).toBe('Alice');
        expect(form.dataset.dcatSubmitting).toBeUndefined();
        expect(host.handleAjaxError).toHaveBeenCalledTimes(1);
        await submitForm(host, form);
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('ignores an old write response after its form has been removed', async () => {
        let release!: (value: unknown) => void;
        vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise((resolve) => { release = resolve; })));
        const request = submitForm(host, form);
        form.remove();
        release({ status: 200, ok: true, headers: new Headers(), text: async () => 'Saved' });
        await request;
        expect(host.handleJsonResponse).not.toHaveBeenCalled();
        expect(host.error).not.toHaveBeenCalled();
        expect(fetch).toHaveBeenCalledTimes(1);
    });
});
