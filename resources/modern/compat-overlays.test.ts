// @ts-expect-error 兼容模块保留 jQuery 的旧调用面。
import $ from 'jquery';
// @ts-expect-error 生产 facade 是供旧扩展加载的 JavaScript 入口。
import { installCompatOverlays } from './compat-overlays';

installCompatOverlays($);

beforeEach(() => {
    document.dispatchEvent(new CustomEvent('dcat:pjax:before-replace'));
    document.body.innerHTML = '';
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockImplementation(function (this: HTMLElement) {
        return (this.isConnected && !this.hidden ? [{ width: 100, height: 34 }] : []) as unknown as DOMRectList;
    });
});

it('preserves modal cancellation, focus containment, Escape and focus return', () => {
    document.body.innerHTML = '<button id="open">Open</button><div id="modal" class="modal"><h2 class="modal-title">Edit</h2><button id="first">Save</button><button id="last">Close</button></div>';
    const opener = document.querySelector<HTMLButtonElement>('#open')!;
    opener.focus();
    $('#modal').one('show.bs.modal', (event: Event) => event.preventDefault()).modal('show');
    expect(document.querySelector('#modal')?.classList.contains('show')).toBe(false);
    $('#modal').modal('show');
    expect(document.activeElement?.id).toBe('first');
    document.querySelector<HTMLButtonElement>('#last')!.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement?.id).toBe('first');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.activeElement).toBe(opener);
    expect(document.querySelector('#modal')?.getAttribute('aria-hidden')).toBe('true');
    $('#modal').modal('show');
    document.dispatchEvent(new CustomEvent('dcat:pjax:before-replace'));
    expect(document.body.classList.contains('modal-open')).toBe(false);
    opener.focus();
    expect(document.activeElement).toBe(opener);
});

it('honors tab hide/show cancellation, event order and keyboard activation', () => {
    document.body.innerHTML = '<div class="nav"><a id="one" href="#p1" data-toggle="tab" class="active">One</a><a id="two" href="#p2" data-toggle="tab">Two</a></div><div><div id="p1" class="tab-pane active">One</div><div id="p2" class="tab-pane">Two</div></div>';
    const events: string[] = [];
    $('#one').on('hide.bs.tab hidden.bs.tab', (event: Event) => events.push(event.type));
    $('#two').on('show.bs.tab shown.bs.tab', (event: Event) => events.push(event.type));
    $('#one').one('hide.bs.tab', (event: Event) => event.preventDefault());
    $('#two').tab('show');
    expect(document.querySelector('#p1')?.classList.contains('active')).toBe(true);
    events.length = 0;
    $('#two').tab('show');
    expect(events).toEqual(['hide', 'show', 'hidden', 'shown']);
    expect(document.querySelector('#two')?.getAttribute('aria-selected')).toBe('true');
    document.querySelector('#two')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement?.id).toBe('one');
    expect(document.querySelector('#p2')?.getAttribute('aria-hidden')).toBe('true');
});

it('keeps collapse initialization inert and updates every related trigger', () => {
    document.body.innerHTML = '<button data-toggle="collapse" data-target="#panel">Open</button><button data-toggle="collapse" data-target="#panel">Also open</button><div id="panel" class="collapse">Body</div>';
    $('#panel').collapse({ toggle: false });
    expect(document.querySelector('#panel')?.classList.contains('show')).toBe(false);
    $('#panel').collapse('show');
    expect(Array.from(document.querySelectorAll('button')).every((button) => button.getAttribute('aria-expanded') === 'true')).toBe(true);
    $('#panel').one('hide.bs.collapse', (event: Event) => event.preventDefault()).collapse('hide');
    expect(document.querySelector('#panel')?.classList.contains('show')).toBe(true);
});

it('keeps mixed page links as navigation and gives pure tabs presentation wrappers', () => {
    document.body.innerHTML = '<ul class="nav"><li><a id="content" href="#panel" data-toggle="tab">Content</a></li><li><a href="/next">Next page</a></li></ul><div><div id="panel" class="tab-pane">Content</div></div>';
    $('#content').tab('show');
    expect(document.querySelector('ul')?.getAttribute('role')).toBeNull();
    expect(document.querySelector('a[href="/next"]')?.getAttribute('role')).toBeNull();
    document.body.innerHTML = '<ul class="nav"><li><a id="one" href="#p1" data-toggle="tab" class="active">One</a></li><li><a id="two" href="#p2" data-toggle="tab">Two</a></li></ul><div><div id="p1" class="tab-pane active">One</div><div id="p2" class="tab-pane">Two</div></div>';
    $('#two').tab('show');
    expect(document.querySelector('ul')?.getAttribute('role')).toBe('tablist');
    expect(Array.from(document.querySelectorAll('li')).every((item) => item.getAttribute('role') === 'presentation')).toBe(true);
    expect(document.querySelector('#two')?.getAttribute('role')).toBe('tab');
});

it('associates tooltip text, sanitizes default HTML and disposes every floating node', () => {
    document.body.innerHTML = '<button id="tip" title="Help" aria-describedby="help">Help</button><span id="help">Original help</span><button id="pop">Edit</button>';
    $('#tip').tooltip();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    $('#tip').tooltip('show');
    const tooltip = document.querySelector<HTMLElement>('[role="tooltip"]')!;
    expect(tooltip.textContent).toBe('Help');
    expect(document.querySelector('#tip')?.getAttribute('aria-describedby')).toBe(`help ${tooltip.id}`);
    $('#pop').popover({ html: true, content: '<b>Safe</b><img onerror="window.bad=1"><script>window.bad=1</script>', trigger: 'manual' }).popover('show');
    expect(document.querySelector('.popover-body b')?.textContent).toBe('Safe');
    expect(document.querySelector('.popover-body script,.popover-body [onerror]')).toBeNull();
    document.dispatchEvent(new CustomEvent('dcat:pjax:before-replace'));
    expect(document.querySelector('[data-dcat-compat-owner]')).toBeNull();
    expect(document.querySelector('#tip')?.getAttribute('aria-describedby')).toBe('help');
    expect(document.querySelector('#tip')?.getAttribute('title')).toBe('Help');
    expect($('#pop').data('bs.popover')).toBeUndefined();
});

it('supports dropdown keyboard navigation and cancellation without a Bootstrap runtime', () => {
    document.body.innerHTML = '<div class="dropdown"><button id="menu" data-toggle="dropdown">Actions</button><div class="dropdown-menu"><button id="a">First</button><button id="b">Second</button></div></div>';
    $('.dropdown').one('show.bs.dropdown', (event: Event) => event.preventDefault());
    $('#menu').dropdown('show');
    expect(document.querySelector('.dropdown-menu')?.classList.contains('show')).toBe(false);
    document.querySelector('#menu')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement?.id).toBe('a');
    document.querySelector('#a')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement?.id).toBe('b');
    document.querySelector('#b')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.activeElement?.id).toBe('menu');
    expect(document.querySelector('#menu')?.getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('.dropdown-menu')?.getAttribute('style')).toBeNull();
});

it('restores a loading button without losing its original disabled state or content', () => {
    document.body.innerHTML = '<button id="save" data-loading-text="Saving"><b>Save</b></button>';
    $('#save').button('loading').button('loading');
    expect(document.querySelector<HTMLButtonElement>('#save')!.disabled).toBe(true);
    expect(document.querySelector('#save')?.textContent).toBe('Saving');
    $('#save').button('reset');
    expect(document.querySelector('#save b')?.textContent).toBe('Save');
    expect(document.querySelector<HTMLButtonElement>('#save')!.disabled).toBe(false);
});

it('keeps right-aligned dropdowns within the viewport and restores inline positioning', () => {
    document.body.innerHTML = '<div class="dropdown"><button id="range" data-toggle="dropdown">Range</button><div class="dropdown-menu dropdown-menu-right" style="right: 0px; bottom: 4px"><button>Last month</button></div></div>';
    const trigger = document.querySelector<HTMLButtonElement>('#range')!;
    const menu = document.querySelector<HTMLElement>('.dropdown-menu')!;
    const originalStyle = menu.getAttribute('style');
    let anchorLeft = 600;
    vi.spyOn(trigger, 'getBoundingClientRect').mockImplementation(() => ({ left: anchorLeft, right: anchorLeft + 100, top: 200, bottom: 240, width: 100, height: 40 }) as DOMRect);
    vi.spyOn(menu, 'getBoundingClientRect').mockImplementation(() => {
        // 模拟 CSS 同时指定 left/right 时的拉伸，必须先清除相反方向再测量。
        const width = menu.style.right === 'auto' ? 160 : innerWidth;
        return { width, height: 120, left: 0, top: 0, right: width, bottom: 120 } as DOMRect;
    });
    $('#range').dropdown('show');
    expect(menu.style.left).toBe('540px');
    expect(menu.style.right).toBe('auto');
    expect(menu.style.bottom).toBe('auto');
    anchorLeft = 0;
    window.dispatchEvent(new Event('resize'));
    expect(menu.style.left).toBe('8px');
    $('#range').dropdown('hide');
    expect(menu.getAttribute('style')).toBe(originalStyle);
});
