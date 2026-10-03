import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { FormView, readFormModel, type FormFieldPayload, type FormViewPayload } from './form';

function field(name: string, asterisk = true): FormFieldPayload {
    return {
        slotId: name, column: name, name, label: name, serverType: 'Text', fieldType: 'text',
        view: 'admin::form.text', renderer: 'native', adapter: 'native',
        control: {
            kind: 'input', type: 'text', id: 'native-' + name, name, value: 'server value',
            options: [], groups: [], placeholder: '', className: '', attributes: { required: true },
            viewClass: { label: `col-md-2${asterisk ? ' asterisk' : ''}`, field: 'col-md-8' }, formGroupClass: '', help: 'Public name', errorKey: name,
        },
    };
}

it('reads the row/column surface used by dynamic modal forms', () => {
    const form = document.createElement('form');
    form.innerHTML = '<div data-dcat-modern-fallback><div class="row"><div class="col-md-12"><div class="box-body"><div class="fields-group"></div></div></div></div></div>';
    expect(() => readFormModel(form, payload([]))).not.toThrow();
});

function payload(fields: FormFieldPayload[]): FormViewPayload {
    return {
        id: 'profile', title: '', mode: 'edit', action: '/users/1', method: 'POST', multipart: true,
        layout: { hasRows: false, hasColumns: false, hasBlocks: false, tree: { kind: 'stack' } },
        fields, advancedFieldCount: 0,
    };
}

async function render(html: string, data: FormViewPayload | null = null) {
    const form = document.createElement('form');
    form.innerHTML = '<div data-dcat-modern-fallback>' + html + '</div>';
    document.body.appendChild(form);
    const host = document.createElement('div');
    const model = readFormModel(form, data);
    form.appendChild(host);
    const root = createRoot(host);
    await act(async () => root.render(<FormView model={model} />));
    return { form, host, unmount: async () => { await act(async () => root.unmount()); form.remove(); } };
}

describe('Form payload and compatibility ownership', () => {
    it('retains formWidth wrappers, card attributes and field spacing', async () => {
        const { host, unmount } = await render(
            '<div class="row" style="padding-top:4px"><div class="col-md-8"><div class="card" id="expense-card"><div class="box-body" style="margin-top:6px"><div class="fields-group" style="padding:8px"><div class="form-group row"><label class="col-md-2 control-label asterisk">Description</label><div class="col-md-8"><div class="input-group"><span class="input-group-prepend"><i class="feather icon-edit-2"></i></span><input name="description"></div></div></div></div></div></div></div></div>',
            payload([field('description')]),
        );
        const card = host.querySelector<HTMLElement>('#expense-card')!;
        expect(card.classList.contains('card')).toBe(true);
        expect(card.parentElement?.className).toBe('col-md-8');
        expect(card.parentElement?.parentElement?.className).toBe('row');
        expect(card.parentElement?.parentElement?.style.paddingTop).toBe('4px');
        expect(host.querySelector<HTMLElement>('.box-body')?.style.marginTop).toBe('6px');
        expect(host.querySelector<HTMLElement>('.fields-group')?.style.padding).toBe('8px');
        expect(host.querySelector('.dcat-modern-form-affix .icon-edit-2')).not.toBeNull();
        expect(host.querySelector('.help-block .icon-help-circle')).not.toBeNull();
        expect(host.querySelector('label')?.firstElementChild?.className).toBe('dcat-modern-form-required');
        await unmount();
    });

    it('keeps fixed readonly input widths with affixes and submitted values', async () => {
        const rate = field('deduction_rate', false);
        rate.control!.append = '%';
        rate.control!.attributes = { readonly: true, style: 'flex:none;width:80px;text-align:right;' };
        const { form, host, unmount } = await render('<div class="box-body"><div class="fields-group"><div class="form-group row"><label class="control-label">Rate</label><div><input name="deduction_rate"></div></div></div></div>', payload([rate]));
        const input = host.querySelector<HTMLInputElement>('[name="deduction_rate"]')!;
        expect(input.readOnly).toBe(true);
        expect(input.style.textAlign).toBe('right');
        expect(input.parentElement?.style.width).toBe('80px');
        expect(input.parentElement?.style.flex).toBe('0 0 auto');
        expect(input.parentElement?.nextElementSibling?.textContent).toBe('%');
        // 挂载层会禁用 fallback；此处只验证新控件的序列化。
        form.querySelector<HTMLInputElement>('[data-dcat-modern-fallback] input')!.disabled = true;
        expect(new FormData(form).get('deduction_rate')).toBe('server value');
        await unmount();
    });

    it('retains the complete step extension container and its generated navigation', async () => {
        const { host, unmount } = await render(
            '<div class="box-body"><div class="fields-group dcat-step-box" style="max-width:950px"><ul class="dcat-step"><li>1</li></ul><div class="dcat-step-form"><div id="first-step">Fields</div></div><div class="sw-toolbar"><button class="sw-btn-next" type="button">Next</button></div></div></div>',
            payload([]),
        );
        const box = host.querySelector<HTMLElement>('.dcat-step-box')!;
        expect(box.style.maxWidth).toBe('950px');
        expect(box.querySelector('.dcat-step-form #first-step')).not.toBeNull();
        expect(box.querySelector('.sw-toolbar .sw-btn-next')?.textContent).toBe('Next');
        await unmount();
    });

    it('renders native controls from server values and retains protocol hidden inputs', async () => {
        const { form, host, unmount } = await render(
            '<div class="box-body"><div class="fields-group"><div class="form-group row"><div class="control-label">username</div><div><input id="old" name="username" value="old value"></div></div></div></div><input type="hidden" name="_token" value="csrf"><input type="hidden" name="_method" value="PUT">',
            payload([field('username')]),
        );
        const input = host.querySelector<HTMLInputElement>('#native-username')!;
        expect(input.value).toBe('server value');
        expect(input.name).toBe('username');
        expect(input.required).toBe(true);
        expect(host.querySelector('label[for="native-username"] > span:last-child')?.textContent).toBe('username');
        expect(host.querySelector('label[for="native-username"] .dcat-modern-form-required')?.textContent).toBe('*');
        expect(host.querySelector<HTMLInputElement>('[name="_token"]')?.value).toBe('csrf');
        expect(host.querySelector<HTMLInputElement>('[name="_method"]')?.value).toBe('PUT');
        expect(host.querySelector('#old')).toBeNull();
        expect(form.querySelector('[data-dcat-modern-fallback] #old')).not.toBeNull();
        await unmount();
    });

    it('shows each initial native field error after help text and exposes required/error semantics', async () => {
        const { host, unmount } = await render(
            '<div class="box-body"><div class="fields-group"><div class="form-group row has-error"><label class="control-label asterisk">username</label><div><input name="username"><div class="help-block with-errors"><div>Username is already taken</div><div>Choose a different name</div></div></div></div></div></div>',
            payload([field('username')]),
        );
        const input = host.querySelector<HTMLInputElement>('#native-username')!;
        const help = host.querySelector<HTMLElement>('#native-username-help')!;
        const error = host.querySelector<HTMLElement>('#native-username-errors')!;

        expect(input.required).toBe(true);
        expect(host.querySelector('label[for="native-username"] .dcat-modern-form-required')?.getAttribute('aria-hidden')).toBe('true');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(input.getAttribute('aria-describedby')).toBe('native-username-help native-username-errors');
        expect(help.textContent?.trim()).toBe('Public name');
        expect(Array.from(error.children).map((message) => message.textContent)).toEqual([
            'Username is already taken',
            'Choose a different name',
        ]);
        expect(error.getAttribute('aria-live')).toBe('polite');
        expect(help.compareDocumentPosition(error) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        await unmount();
    });

    it('keeps required validation when the field disables its visible asterisk', async () => {
        const requiredWithoutAsterisk = field('internal_code', false);
        const { host, unmount } = await render(
            '<div class="box-body"><div class="fields-group"><div class="form-group row"><label class="control-label">internal_code</label><div><input name="internal_code"></div></div></div></div>',
            payload([requiredWithoutAsterisk]),
        );

        expect(host.querySelector<HTMLInputElement>('#native-internal_code')?.required).toBe(true);
        expect(host.querySelector('.dcat-modern-form-required')).toBeNull();
        await unmount();
    });

    it('associates a required checkbox group label without repeating its marker on options', async () => {
        const choice = field('roles');
        choice.serverType = 'Checkbox';
        choice.fieldType = 'checkbox';
        choice.control!.kind = 'checkbox';
        choice.control!.type = 'checkbox';
        choice.control!.value = [];
        choice.control!.options = [
            { value: 'admin', label: 'Administrator' },
            { value: 'editor', label: 'Editor' },
        ];
        const { host, unmount } = await render(
            '<div class="box-body"><div class="fields-group"><div class="form-group row"><div class="control-label asterisk">Roles</div><div><input type="checkbox" name="roles[]"></div></div></div></div>',
            payload([choice]),
        );
        const group = host.querySelector<HTMLElement>('[role="group"]')!;

        expect(group.getAttribute('aria-labelledby')).toBe('native-roles-label');
        expect(host.querySelector('#native-roles-label .dcat-modern-form-required')?.getAttribute('aria-hidden')).toBe('true');
        expect(Array.from(group.querySelectorAll('label')).map((label) => label.textContent)).toEqual(['Administrator', 'Editor']);
        expect(group.querySelectorAll('.dcat-modern-form-required')).toHaveLength(0);
        await unmount();
    });

    it('focuses the first initially invalid native control when no page focus exists', async () => {
        if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
            document.activeElement.blur();
        }
        const username = field('username');
        const email = field('email');
        const { host, unmount } = await render(
            '<div class="box-body"><div class="fields-group"><div class="form-group row has-error"><label class="control-label">username</label><div><input name="username"><div class="help-block with-errors"><div>Username is invalid</div></div></div></div><div class="form-group row has-error"><label class="control-label">email</label><div><input name="email"><div class="help-block with-errors"><div>Email is invalid</div></div></div></div></div></div>',
            payload([username, email]),
        );

        expect(document.activeElement).toBe(host.querySelector('#native-username'));
        await unmount();
    });

    it('preserves an existing focus when mounting a form with initial errors', async () => {
        const outside = document.createElement('button');
        document.body.appendChild(outside);
        outside.focus();
        const { unmount } = await render(
            '<div class="box-body"><div class="fields-group"><div class="form-group row has-error"><label class="control-label">username</label><div><input name="username"><div class="help-block with-errors"><div>Username is invalid</div></div></div></div></div></div>',
            payload([field('username')]),
        );

        expect(document.activeElement).toBe(outside);
        await unmount();
        outside.remove();
    });

    it('uses the layout payload for tabs and preserves input state across tab changes', async () => {
        const data = payload([field('profile'), field('security')]);
        data.layout.tree = { kind: 'tabs', items: data.fields.map((item, index) => ({
            id: item.slotId, title: item.label, active: index === 1, content: { kind: 'field', slotId: item.slotId },
        })) };
        const { host, unmount } = await render('<div class="box-body"></div>', data);
        const security = host.querySelector<HTMLButtonElement>('[role="tab"][aria-controls="security"]')!;
        const profile = host.querySelector<HTMLButtonElement>('[role="tab"][aria-controls="profile"]')!;
        expect(security.getAttribute('aria-selected')).toBe('true');
        const input = host.querySelector<HTMLInputElement>('#native-security')!;
        input.value = 'edited';
        await act(async () => profile.click());
        expect(profile.getAttribute('aria-selected')).toBe('true');
        expect(location.hash).toBe('#profile');
        await act(async () => security.click());
        expect(host.querySelector<HTMLInputElement>('#native-security')?.value).toBe('edited');
        await unmount();
        history.replaceState(null, '', location.pathname);
    });

    it('keeps a declared vendor field as the original node beside native controls', async () => {
        const data = payload([field('username'), { ...field('upload'), renderer: 'compat', control: null }]);
        const { form, host, unmount } = await render(
            '<div class="box-body"><div class="fields-group"><div class="form-group"><div class="control-label">username</div><div><input name="username"></div></div><div class="form-group"><div class="control-label">upload</div><input type="file" id="upload" name="upload"></div></div></div>',
            data,
        );
        const upload = host.querySelector<HTMLInputElement>('#upload')!;
        expect(upload).not.toBeNull();
        expect(host.querySelector('[data-dcat-modern-legacy-field="advanced"] #upload')).toBe(upload);
        const changed = vi.fn();
        upload.addEventListener('change', changed);
        upload.dispatchEvent(new Event('change'));
        expect(changed).toHaveBeenCalledTimes(1);
        expect(form.querySelector('[data-dcat-modern-fallback] #upload')).toBeNull();
        await unmount();
    });

    it('preserves arbitrary legacy markup and event listeners when no layout payload is supplied', async () => {
        const { form, host, unmount } = await render('<section class="custom-form"><input name="custom" value="kept"><button type="button">Custom</button><input type="hidden" name="_token" value="csrf"></section>');
        const original = host.querySelector<HTMLElement>('.custom-form')!;
        const clicked = vi.fn();
        original.querySelector('button')!.addEventListener('click', clicked);
        original.querySelector('button')!.click();
        expect(clicked).toHaveBeenCalledTimes(1);
        expect(host.querySelector('[data-dcat-modern-legacy-island="form-custom-view"] .custom-form')).toBe(original);
        expect(host.querySelector<HTMLInputElement>('[name="custom"]')?.value).toBe('kept');
        expect(host.querySelector<HTMLInputElement>('[name="_token"]')?.value).toBe('csrf');
        expect(form.querySelector('[data-dcat-modern-fallback] .custom-form')).toBeNull();
        await unmount();
    });
});
