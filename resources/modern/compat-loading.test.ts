// @ts-expect-error 兼容模块使用 jQuery 旧入口。
import $ from 'jquery';
// @ts-expect-error 生产 facade 保留 JavaScript 入口。
import { installLoadingPlugins, createProgress } from './compat-loading';

installLoadingPlugins($);

beforeEach(() => { document.body.innerHTML = ''; });

it('shows one colored loading overlay and restores the original container position', () => {
    document.body.innerHTML = '<div id="card">Content</div>';
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ position: 'static' } as CSSStyleDeclaration);
    $('#card').loading({ color: 'green', background: 'transparent' }).loading();
    const card = document.querySelector<HTMLElement>('#card')!;
    expect(card.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(card.querySelector<HTMLElement>('[role="status"]')!.style.color).toBe('green');
    expect(card.querySelector('.dcat-modern-loading-spinner')).not.toBeNull();
    expect(card.style.position).toBe('relative');
    $('#card').loading(false);
    expect(card.style.position).toBe('');
    expect(card.querySelector('[role="status"]')).toBeNull();
});

it('restores button content, width and disabled state after repeated loading calls', () => {
    document.body.innerHTML = '<button id="save" disabled aria-label="Save"><b>Save</b></button><a id="link" href="#">Load</a>';
    $('#save,#link').buttonLoading().buttonLoading();
    const save = document.querySelector<HTMLButtonElement>('#save')!;
    expect(save.getAttribute('aria-busy')).toBe('true');
    expect(save.querySelectorAll('.dcat-modern-loading-spinner')).toHaveLength(1);
    $('#save,#link').buttonLoading(false);
    expect(save.disabled).toBe(true);
    expect(save.innerHTML).toBe('<b>Save</b>');
    expect(save.style.minWidth).toBe('');
    expect(save.getAttribute('aria-label')).toBe('Save');
    expect(save.hasAttribute('aria-busy')).toBe(false);
    expect(document.querySelector('#link')!.hasAttribute('disabled')).toBe(false);
    expect(document.querySelector('#link')!.textContent).toBe('Load');
});

it('keeps the top progress bar separate from fullscreen loading and cleans up on navigation', () => {
    vi.useFakeTimers();
    const progress = createProgress();
    try {
        progress.start().start();
        expect(document.querySelectorAll('[role="progressbar"]')).toHaveLength(1);
        expect(document.body.hasAttribute('aria-busy')).toBe(false);
        vi.advanceTimersByTime(400);
        expect(parseFloat(document.querySelector<HTMLElement>('.dcat-modern-progress > span')!.style.width)).toBeGreaterThan(10);
        document.dispatchEvent(new CustomEvent('dcat:pjax:before-replace'));
        expect(document.querySelector('[role="progressbar"]')).toBeNull();
        expect(vi.getTimerCount()).toBe(0);
        progress.start().done();
        expect(document.querySelector('[role="progressbar"]')).toBeNull();
    } finally { progress.done(); vi.useRealTimers(); }
});
