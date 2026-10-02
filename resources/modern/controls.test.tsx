import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { Choice, Select } from './controls';
import { Tabs } from './presentation';

describe('upstream form protocol adapters', () => {
    it('keeps radio visuals synchronized with native grouping and form reset', async () => {
        const form = document.createElement('form');
        document.body.appendChild(form);
        const root = createRoot(form);
        await act(async () => root.render(<><Choice kind="radio" name="choice" value="a" label="A" defaultChecked /><Choice kind="radio" name="choice" value="b" label="B" /></>));
        const inputs = form.querySelectorAll('input');
        await act(async () => inputs[1].click());
        expect(inputs[0].checked).toBe(false);
        expect(new FormData(form).get('choice')).toBe('b');
        // 上游视觉使用品牌填充表示选中；不允许两个单选按钮同时显示为选中。
        expect(form.querySelectorAll('.bg-brand-solid').length).toBe(1);
        await act(async () => form.reset());
        expect(inputs[0].checked).toBe(true);
        expect(new FormData(form).get('choice')).toBe('a');
        expect(form.querySelectorAll('.bg-brand-solid').length).toBe(1);
        await act(async () => root.unmount());
        form.remove();
    });

    it('preserves select anchors, disabled options and submitted values across rerenders', async () => {
        const form = document.createElement('form');
        document.body.appendChild(form);
        const root = createRoot(form);
        const render = (disabled: boolean) => <><label htmlFor="status">Status</label><Select id="status" name="status" defaultValue="ready" aria-describedby="status-hint"><option value="ready">Ready</option><option value="locked" disabled={disabled}>Locked</option></Select><p id="status-hint">Choose status</p></>;
        await act(async () => root.render(render(true)));
        let select = form.querySelector('select')!;
        expect(select.id).toBe('status');
        expect(select.getAttribute('aria-describedby')).toBe('status-hint');
        expect(select.options[1].disabled).toBe(true);
        expect(new FormData(form).get('status')).toBe('ready');
        await act(async () => root.render(render(false)));
        select = form.querySelector('select')!;
        expect(select.id).toBe('status');
        expect(select.options[1].disabled).toBe(false);
        await act(async () => root.unmount());
        form.remove();
    });

    it('submits grouped multiple selections and controls in an inactive tab', async () => {
        const form = document.createElement('form');
        document.body.appendChild(form);
        const root = createRoot(form);
        await act(async () => root.render(<Tabs items={[
            { id: 'first', label: 'First', panel: <Select name="groups[]" multiple defaultValue={['a', 'b']}><optgroup label="Group"><option value="a">A</option><option value="b">B</option></optgroup></Select> },
            { id: 'second', label: 'Second', tabId: 'second-tab', panelId: 'second-panel', panel: <input name="inactive" defaultValue="retained" /> },
        ]} />));
        expect(new FormData(form).getAll('groups[]')).toEqual(['a', 'b']);
        expect(new FormData(form).get('inactive')).toBe('retained');
        expect(form.querySelector('#second-panel')?.hasAttribute('hidden')).toBe(true);
        expect(form.querySelector('#second-tab')?.getAttribute('aria-controls')).toBe('second-panel');
        await act(async () => root.unmount());
        form.remove();
    });
});
