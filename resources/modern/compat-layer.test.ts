// @ts-expect-error 兼容模块保留 jQuery 的旧调用面。
import $ from 'jquery';
import './compat';

interface LayerOptions {
    area?: string[];
    title?: string;
    move?: boolean;
    content?: HTMLElement;
    btn?: string[];
    yes?: (index: number, panel: unknown) => unknown;
    btn2?: () => unknown;
    cancel?: () => unknown;
}

const layer = (window as unknown as { layer: {
    open(options: LayerOptions): number;
    close(index: number): void;
    closeAll(): void;
    restore(index: number): void;
} }).layer;

afterEach(() => {
    layer.closeAll();
    document.body.innerHTML = '';
});

function pointer(target: Element, type: string, x: number, y: number, button = 0) {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button });
    Object.defineProperty(event, 'pointerId', { value: 1 });
    target.dispatchEvent(event);
}

it('drags only from the title and keeps the dialog reachable after a viewport resize', async () => {
    const index = layer.open({ area: ['300px', '200px'], title: 'Edit <button>Help</button>', btn: ['Save'] });
    await Promise.resolve();
    const panel = document.querySelector<HTMLElement>(`#layui-layer${index}`)!;
    const title = panel.querySelector<HTMLElement>('.layui-layer-title')!;
    vi.spyOn(panel, 'getBoundingClientRect').mockImplementation(() => ({
        left: parseFloat(panel.style.left || '200'), top: parseFloat(panel.style.top || '150'), width: 300, height: 200,
    }) as DOMRect);
    vi.spyOn(panel, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
    pointer(title.querySelector('button')!, 'pointerdown', 210, 160);
    pointer(title, 'pointermove', 310, 260);
    expect(panel.style.left).toBe('');
    pointer(title, 'pointerdown', 210, 160, 2);
    pointer(title, 'pointermove', 310, 260);
    expect(panel.style.left).toBe('');
    pointer(title, 'pointerdown', 210, 160);
    pointer(title, 'pointermove', 310, 240);
    expect(panel.style.left).toBe('300px');
    expect(panel.style.top).toBe('230px');
    pointer(title, 'pointermove', -2000, -2000);
    expect(panel.style.left).toBe('16px');
    expect(panel.style.top).toBe('16px');
    pointer(title, 'pointermove', 4000, 4000);
    expect(panel.style.left).toBe(`${innerWidth - 316}px`);
    expect(panel.style.top).toBe(`${innerHeight - 216}px`);
    pointer(title, 'pointerup', 4000, 4000);
    const left = panel.style.left;
    pointer(title, 'pointermove', 210, 160);
    expect(panel.style.left).toBe(left);
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(400);
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(300);
    window.dispatchEvent(new Event('resize'));
    expect(panel.style.left).toBe('84px');
    expect(panel.style.top).toBe('84px');
    layer.close(index);
    const finalStyle = panel.getAttribute('style');
    pointer(title, 'pointerdown', 90, 90);
    pointer(title, 'pointermove', 30, 30);
    window.dispatchEvent(new Event('resize'));
    expect(panel.getAttribute('style')).toBe(finalStyle);
});

it('honors the option to disable title dragging', async () => {
    const index = layer.open({ title: 'Edit', move: false });
    await Promise.resolve();
    const panel = document.querySelector<HTMLElement>(`#layui-layer${index}`)!;
    const title = panel.querySelector<HTMLElement>('.layui-layer-title')!;
    pointer(title, 'pointerdown', 100, 100);
    pointer(title, 'pointermove', 200, 200);
    expect(panel.style.left).toBe('');
    expect(panel.style.top).toBe('');
});

it('preserves form nodes and save/reset callbacks in a fixed-height layer', async () => {
    const form = document.createElement('form');
    form.innerHTML = '<input name="name" value="Original">';
    const save = vi.fn(() => false);
    const reset = vi.fn(() => { form.reset(); return false; });
    const index = layer.open({ area: ['700px', '460px'], title: 'Edit', content: form, btn: ['Save', 'Reset'], yes: save, btn2: reset });
    await Promise.resolve();
    const panel = document.querySelector<HTMLElement>(`#layui-layer${index}`)!;
    expect(panel.querySelector('form')).toBe(form);
    form.querySelector('input')!.value = 'Edited';
    panel.querySelector<HTMLButtonElement>('.layui-layer-btn1')!.click();
    expect(reset).toHaveBeenCalledTimes(1);
    expect(new FormData(form).get('name')).toBe('Original');
    expect(panel.isConnected).toBe(true);
    panel.querySelector<HTMLButtonElement>('.layui-layer-btn0')!.click();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(index, expect.anything());
    expect(panel.isConnected).toBe(true);
});

it('restores a cached dialog after its cancellation callback hides it', async () => {
    let panel: HTMLElement;
    const index = layer.open({
        area: ['700px', '460px'], title: 'Edit', btn: ['Save'],
        cancel: () => { $(panel).hide(); return false; },
    });
    await Promise.resolve();
    panel = document.querySelector<HTMLElement>(`#layui-layer${index}`)!;
    const display = getComputedStyle(panel).display;
    const button = panel.querySelector('.layui-layer-btn0');
    panel.querySelector<HTMLButtonElement>('.layui-layer-close')!.click();
    expect(getComputedStyle(panel).display).toBe('none');
    layer.restore(index);
    expect(getComputedStyle(panel).display).toBe(display);
    expect(panel.parentElement?.style.pointerEvents).toBe('auto');
    expect(panel.querySelector('.layui-layer-btn0')).toBe(button);
});
