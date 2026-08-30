import { describe, expect, it, vi } from 'vitest';
import { coreCapabilities } from './adapters';
import type { MountContext, RegisteredCapability } from './types';

function capability(id: string): RegisteredCapability {
    const match = coreCapabilities.find((item) => item.id === id);
    if (!match) throw new Error(`Missing capability ${id}`);
    return match;
}

function context(item: RegisteredCapability): MountContext {
    return {
        config: {
            bridgeVersion: '1.0.0',
            payloadVersion: '1.0.0',
            telemetry: true,
        },
        capability: item,
        payloads: [],
        notify: vi.fn(),
        telemetry: vi.fn(),
    };
}

describe('modern adapter cleanup', () => {
    it('adds missing Grid scope without deleting a legacy scope on cleanup', () => {
        const item = capability('grid.read');
        const element = document.createElement('div');
        element.innerHTML = '<table><thead><tr><th id="legacy" scope="colgroup">Group</th><th id="added">Name</th></tr></thead></table>';
        const cleanup = item.mount(element, context(item));

        expect(element.querySelector('#legacy')?.getAttribute('scope')).toBe('colgroup');
        expect(element.querySelector('#added')?.getAttribute('scope')).toBe('col');
        if (typeof cleanup === 'function') cleanup();
        expect(element.querySelector('#legacy')?.getAttribute('scope')).toBe('colgroup');
        expect(element.querySelector('#added')?.hasAttribute('scope')).toBe(false);
    });

    it('adds aria-invalid only when legacy did not already own the attribute', () => {
        const item = capability('form.basic');
        const element = document.createElement('form');
        element.innerHTML = '<div class="has-error"><input id="legacy" aria-invalid="true"><input id="added"></div>';
        const cleanup = item.mount(element, context(item));

        expect(element.querySelector('#legacy')?.getAttribute('aria-invalid')).toBe('true');
        expect(element.querySelector('#added')?.getAttribute('aria-invalid')).toBe('true');
        if (typeof cleanup === 'function') cleanup();
        expect(element.querySelector('#legacy')?.getAttribute('aria-invalid')).toBe('true');
        expect(element.querySelector('#added')?.hasAttribute('aria-invalid')).toBe(false);
    });

    it('adds and restores an accessible name for legacy WebUploader file inputs created after mount', async () => {
        const item = capability('form.basic');
        const element = document.createElement('form');
        element.innerHTML = '<div class="form-group"><div class="control-label">Avatar</div><div id="picker"></div></div>';
        const cleanup = item.mount(element, context(item));
        const upload = document.createElement('input');
        upload.id = 'upload';
        upload.type = 'file';
        upload.className = 'webuploader-element-invisible';
        element.querySelector('#picker')?.appendChild(upload);
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(element.querySelector('#upload')?.getAttribute('aria-label')).toBe('Avatar');
        if (typeof cleanup === 'function') cleanup();
        expect(element.querySelector('#upload')?.hasAttribute('aria-label')).toBe(false);
    });
});
