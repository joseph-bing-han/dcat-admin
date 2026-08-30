import { DOMElement } from './platform';

// 旧插件入口统一由 Dcat 管理事件、焦点、定位和页面卸载。
export function installCompatOverlays($) {
    if ($.fn.modal?.dcatFacade) return;
function targetFor(trigger) {
    const selector = trigger.getAttribute('data-target') || trigger.getAttribute('href');
    if (!selector || selector === '#' || !selector.startsWith('#')) return null;
    try {
        return document.querySelector(selector);
    } catch (_) {
        return null;
    }
}

function focusable(element) {
    return Array.from(element.querySelectorAll('a[href],button,input,select,textarea,[tabindex]'))
        .filter((node) => !node.disabled && !node.classList.contains('disabled') && node.tabIndex >= 0 && node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden');
}

function positionOverlay(trigger, overlay, placement = 'bottom') {
    const anchor = trigger.getBoundingClientRect();
    const alignRight = overlay.classList.contains('dropdown-menu-right')
        || getComputedStyle(trigger).direction === 'rtl';
    overlay.style.position = 'fixed';
    // 清除相反方向约束，避免 fixed left 与主题 right: 0 同时把内容宽度拉满。
    overlay.style.right = 'auto';
    overlay.style.bottom = 'auto';
    overlay.style.left = '0px';
    overlay.style.top = '0px';
    overlay.style.maxWidth = `${Math.max(0, innerWidth - 16)}px`;
    overlay.style.maxHeight = `${Math.max(0, innerHeight - 16)}px`;
    const box = overlay.getBoundingClientRect();
    let left = alignRight ? anchor.right - box.width : anchor.left;
    let top = anchor.bottom + 6;
    if (placement.startsWith('top')) top = anchor.top - box.height - 6;
    if (placement.startsWith('left')) { left = anchor.left - box.width - 6; top = anchor.top; }
    if (placement.startsWith('right')) { left = anchor.right + 6; top = anchor.top; }
    if (top + box.height > innerHeight - 8 && anchor.top - box.height - 6 >= 8) top = anchor.top - box.height - 6;
    if (left + box.width > innerWidth - 8) left = anchor.right - box.width;
    overlay.style.left = `${Math.max(8, Math.min(left, innerWidth - box.width - 8))}px`;
    overlay.style.top = `${Math.max(8, Math.min(top, innerHeight - box.height - 8))}px`;
}

function emit($element, phase, name, relatedTarget) {
    const event = $.Event(`${phase}.bs.${name}`, { relatedTarget });
    $element.trigger(event);
    return !event.isDefaultPrevented();
}

const modalOptions = new WeakMap();
const activeModals = new Map();

function modalFocusable(element) {
    return focusable(element);
}

function showModal(element, relatedTarget) {
    if (activeModals.has(element)) return;
    const $element = $(element);
    if (!emit($element, 'show', 'modal', relatedTarget)) return;
    const options = { keyboard: true, backdrop: true, focus: true, ...modalOptions.get(element) };
    const previousFocus = relatedTarget instanceof HTMLElement
        ? (relatedTarget.contains(document.activeElement) ? document.activeElement : relatedTarget.tabIndex >= 0 ? relatedTarget : modalFocusable(relatedTarget)[0])
        : document.activeElement;
    const controller = new AbortController();
    activeModals.set(element, { controller, previousFocus, hadTabindex: element.hasAttribute('tabindex') });
    element.classList.add('show');
    element.style.display = 'grid';
    element.removeAttribute('aria-hidden');
    element.setAttribute('aria-modal', 'true');
    element.setAttribute('role', 'dialog');
    const title = element.querySelector('.modal-title');
    if (title && !element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
        if (!title.id) title.id = `dcat-modal-title-${Math.random().toString(36).slice(2, 10)}`;
        element.setAttribute('aria-labelledby', title.id);
    }
    if (!element.hasAttribute('tabindex')) element.tabIndex = -1;
    document.body.classList.add('modal-open');

    const focusFirst = () => (modalFocusable(element)[0] || element).focus();
    document.addEventListener('keydown', (event) => {
        if (Array.from(activeModals.keys()).pop() !== element) return;
        if (event.key === 'Escape' && options.keyboard) {
            event.preventDefault();
            event.stopImmediatePropagation();
            hideModal(element);
        } else if (event.key === 'Tab') {
            const nodes = modalFocusable(element);
            const current = nodes.indexOf(document.activeElement);
            if (!nodes.length || (event.shiftKey ? current <= 0 : current === nodes.length - 1 || current < 0)) {
                event.preventDefault();
                (event.shiftKey ? nodes[nodes.length - 1] || element : nodes[0] || element).focus();
            }
        }
    }, { capture: true, signal: controller.signal });
    document.addEventListener('focusin', (event) => {
        if (options.focus && Array.from(activeModals.keys()).pop() === element && !element.contains(event.target)) focusFirst();
    }, { signal: controller.signal });
    element.addEventListener('click', (event) => {
        if (event.target !== element) return;
        if (options.backdrop === true) hideModal(element);
        else if (options.backdrop === 'static') focusFirst();
    }, { signal: controller.signal });
    if (options.focus) focusFirst();
    emit($element, 'shown', 'modal', relatedTarget);
}

function hideModal(element, relatedTarget, dispose = false) {
    const state = activeModals.get(element);
    if (!state) return;
    const $element = $(element);
    if (!dispose && !emit($element, 'hide', 'modal', relatedTarget)) return;
    state.controller.abort();
    activeModals.delete(element);
    element.classList.remove('show');
    element.style.display = 'none';
    element.setAttribute('aria-hidden', 'true');
    element.removeAttribute('aria-modal');
    if (!state.hadTabindex) element.removeAttribute('tabindex');
    document.body.classList.toggle('modal-open', activeModals.size > 0);
    if (!dispose && state.previousFocus instanceof HTMLElement && state.previousFocus.isConnected) state.previousFocus.focus();
    if (!dispose) emit($element, 'hidden', 'modal', relatedTarget);
}

$.fn.modal = function modal(command) {
    return this.each(function () {
        if (command && typeof command === 'object') modalOptions.set(this, { ...modalOptions.get(this), ...command });
        if (command === 'dispose') {
            hideModal(this, undefined, true);
            modalOptions.delete(this);
        } else if (command === 'hide') hideModal(this);
        else if (command === 'toggle') this.classList.contains('show') ? hideModal(this) : showModal(this);
        else if (!command || typeof command === 'string' || command.show !== false) showModal(this);
    });
};

document.addEventListener('dcat:pjax:before-replace', () => {
    Array.from(activeModals.keys()).forEach((element) => hideModal(element, undefined, true));
});

const openDropdowns = new Map();

function toggleDropdown(trigger, force, dispose = false) {
    const parent = trigger.closest('.dropdown, .btn-group') || trigger.parentElement;
    if (!parent) return;
    const menu = parent.querySelector('.dropdown-menu');
    if (!menu) return;
    const show = force === undefined ? !menu.classList.contains('show') : force;
    if (show === menu.classList.contains('show')) return;
    if (show && !emit($(parent), 'show', 'dropdown', trigger)) return;
    if (!show && !dispose && !emit($(parent), 'hide', 'dropdown', trigger)) return;
    if (show) {
        openDropdowns.forEach((_state, other) => { if (other !== trigger) toggleDropdown(other, false); });
        const controller = new AbortController();
        openDropdowns.set(trigger, { controller, style: menu.getAttribute('style') });
        const update = () => positionOverlay(trigger, menu);
        window.addEventListener('resize', update, { signal: controller.signal });
        window.addEventListener('scroll', update, { signal: controller.signal, capture: true });
    } else {
        const state = openDropdowns.get(trigger);
        state?.controller.abort();
        if (state?.style === null) menu.removeAttribute('style');
        else if (state) menu.setAttribute('style', state.style);
        openDropdowns.delete(trigger);
    }
    const overflowContainer = parent.closest('.dcat-modern-table-wrap');
    overflowContainer?.classList.toggle('dcat-modern-dropdown-overflow-open', show);
    parent.classList.toggle('show', show);
    menu.classList.toggle('show', show);
    trigger.setAttribute('aria-expanded', show ? 'true' : 'false');
    if (show) positionOverlay(trigger, menu);
    if (!dispose) emit($(parent), show ? 'shown' : 'hidden', 'dropdown', trigger);
}

$.fn.dropdown = function dropdown(command) {
    return this.each(function () {
        if (command === 'hide') toggleDropdown(this, false);
        else if (command === 'show') toggleDropdown(this, true);
        else if (command === 'dispose') toggleDropdown(this, false, true);
        else toggleDropdown(this);
    });
};

function showTab(trigger) {
    const list = trigger.closest('.nav, .nav-tabs');
    const target = targetFor(trigger);
    const active = list?.querySelector('.active');
    if (active === trigger || trigger.matches('.disabled,:disabled')) return;
    if (active && !emit($(active), 'hide', 'tab', trigger)) return;
    if (!emit($(trigger), 'show', 'tab', active)) return;
    list?.querySelectorAll('.active').forEach((element) => element.classList.remove('active'));
    trigger.classList.add('active');
    if (target) {
        const parent = target.parentElement;
        parent?.querySelectorAll('.tab-pane.active, .tab-pane.show').forEach((element) => element.classList.remove('active', 'show'));
        target.classList.add('active', 'show');
    }
    const tabs = Array.from(list?.querySelectorAll('[data-toggle="tab"],[data-toggle="pill"]') || []);
    const isTabList = list && Array.from(list.querySelectorAll('a[href],button')).every((item) => tabs.includes(item));
    if (isTabList) list.setAttribute('role', 'tablist');
    if (isTabList) Array.from(list.children).forEach((item) => {
        if (item.tagName === 'LI') item.setAttribute('role', 'presentation');
    });
    if (isTabList) tabs.forEach((tab) => {
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', String(tab === trigger));
        tab.tabIndex = tab === trigger ? 0 : -1;
        const panel = targetFor(tab);
        if (panel) {
            tab.setAttribute('aria-controls', panel.id);
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('aria-hidden', String(tab !== trigger));
        }
    });
    if (active) emit($(active), 'hidden', 'tab', trigger);
    emit($(trigger), 'shown', 'tab', active);
}

$.fn.tab = function tab(command) {
    if (command === 'dispose') return this;
    return this.each(function () { showTab(this); });
};

const collapseOptions = new WeakMap();

function toggleCollapse(trigger, element, force) {
    const show = force === undefined ? !element.classList.contains('show') : force;
    if (show === element.classList.contains('show')) return;
    if (!emit($(element), show ? 'show' : 'hide', 'collapse', trigger)) return;
    const options = collapseOptions.get(element) || {};
    if (show && options.parent) {
        const parent = typeof options.parent === 'string' ? document.querySelector(options.parent) : options.parent;
        parent?.querySelectorAll('.collapse.show').forEach((other) => { if (other !== element) toggleCollapse(null, other, false); });
    }
    element.classList.toggle('show', show);
    trigger?.setAttribute('aria-expanded', show ? 'true' : 'false');
    document.querySelectorAll('[data-toggle="collapse"]').forEach((button) => {
        if (targetFor(button) !== element) return;
        button.setAttribute('aria-expanded', String(show));
        button.classList.toggle('collapsed', !show);
    });
    emit($(element), show ? 'shown' : 'hidden', 'collapse', trigger);
}

$.fn.collapse = function collapse(command) {
    return this.each(function () {
        if (command && typeof command === 'object') collapseOptions.set(this, command);
        if (command === 'dispose') collapseOptions.delete(this);
        else if (command === 'hide') toggleCollapse(null, this, false);
        else if (command === 'show') toggleCollapse(null, this, true);
        else if (command?.toggle !== false) toggleCollapse(null, this);
    });
};

const floatingInstances = new Map();
let floatingId = 0;

function createFloatingInstance(element, type, options = {}) {
    const controller = new AbortController();
    const originalTitle = element.getAttribute('title');
    if (originalTitle !== null) {
        element.setAttribute('data-original-title', originalTitle);
        element.removeAttribute('title');
    }
    const tip = document.createElement('div');
    tip.id = `dcat-compat-${type}-${++floatingId}`;
    tip.className = `${type} dcat-modern-${type}`;
    tip.setAttribute('role', 'tooltip');
    tip.dataset.dcatCompatOwner = type;
    const body = document.createElement('div');
    body.className = type === 'popover' ? 'popover-body' : 'tooltip-inner';
    tip.appendChild(body);
    let visible = false;
    let positionController;
    const value = (name, fallback) => {
        const candidate = options[name] ?? element.getAttribute(`data-${name}`) ?? fallback;
        return typeof candidate === 'function' ? candidate.call(element, tip, element) : candidate;
    };
    const update = () => {
        if (tip.isConnected) positionOverlay(element, tip, String(value('placement', type === 'tooltip' ? 'top' : 'right')));
    };
    const describe = (add) => {
        const ids = (element.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && id !== tip.id);
        if (add) ids.push(tip.id);
        if (ids.length) element.setAttribute('aria-describedby', ids.join(' '));
        else element.removeAttribute('aria-describedby');
    };
    const instance = {
        tip,
        show() {
            if (visible) { update(); return; }
            if (!emit($(element), 'show', type)) return;
            const title = value('title', element.getAttribute('data-original-title') || '');
            const content = type === 'tooltip' ? title : value('content', title);
            if (content === '' || content == null) return;
            body.replaceChildren();
            if (content instanceof Node) body.appendChild(content);
            else if (content?.jquery) content.toArray().forEach((node) => body.appendChild(node));
            else if ([true, 'true', '1'].includes(value('html', false))) {
                body.innerHTML = String(content);
                // 与旧公开选项一致；默认移除脚本和事件属性，不记录 HTML。
                if (options.sanitize !== false) {
                    body.querySelectorAll('script,iframe,object,embed').forEach((node) => node.remove());
                    body.querySelectorAll('*').forEach((node) => Array.from(node.attributes).forEach((attribute) => {
                        if (/^on/i.test(attribute.name) || /^(?:href|src|xlink:href)$/i.test(attribute.name) && /^\s*javascript:/i.test(attribute.value)) node.removeAttribute(attribute.name);
                    }));
                }
            } else body.textContent = String(content);
            const requestedContainer = value('container', null);
            const container = requestedContainer instanceof DOMElement ? requestedContainer
                : typeof requestedContainer === 'string' ? document.querySelector(requestedContainer) : null;
            (container || document.body).appendChild(tip);
            tip.style.display = 'block';
            visible = true;
            describe(true);
            update();
            positionController = new AbortController();
            window.addEventListener('resize', update, { signal: positionController.signal });
            window.addEventListener('scroll', update, { capture: true, signal: positionController.signal });
            emit($(element), 'shown', type);
        },
        hide(dispose = false) {
            if (!visible) return;
            if (!dispose && !emit($(element), 'hide', type)) return;
            visible = false;
            positionController?.abort();
            describe(false);
            tip.remove();
            if (!dispose) emit($(element), 'hidden', type);
        },
        toggle() { visible ? this.hide() : this.show(); },
        update,
        dispose() {
            this.hide(true);
            controller.abort();
            if (originalTitle !== null) element.setAttribute('title', originalTitle);
            $(element).removeData(`bs.${type}`);
            floatingInstances.delete(tip);
        },
        getTipElement() { return tip; },
    };
    const triggers = String(value('trigger', type === 'tooltip' ? 'hover focus' : 'click')).split(/\s+/);
    if (triggers.includes('click')) element.addEventListener('click', () => instance.toggle(), { signal: controller.signal });
    if (triggers.includes('hover')) {
        element.addEventListener('mouseenter', () => instance.show(), { signal: controller.signal });
        element.addEventListener('mouseleave', () => { if (!element.contains(document.activeElement)) instance.hide(); }, { signal: controller.signal });
    }
    if (triggers.includes('focus')) {
        element.addEventListener('focusin', () => instance.show(), { signal: controller.signal });
        element.addEventListener('focusout', () => instance.hide(), { signal: controller.signal });
    }
    floatingInstances.set(tip, instance);
    return instance;
}

for (const type of ['tooltip', 'popover']) {
    $.fn[type] = function floating(command) {
        return this.each(function () {
            let instance = $(this).data(`bs.${type}`);
            if (!instance && ['dispose', 'hide'].includes(command)) return;
            if (!instance) {
                instance = createFloatingInstance(this, type, typeof command === 'object' ? command : {});
                $(this).data(`bs.${type}`, instance);
            }
            if (typeof command === 'string' && typeof instance[command] === 'function') instance[command]();
        });
    };
    $.fn[type].Constructor = { Default: { animation: false, container: false, content: '', html: false, placement: type === 'tooltip' ? 'top' : 'right', trigger: type === 'tooltip' ? 'hover focus' : 'click' } };
}

const buttonStates = new WeakMap();
$.fn.button = function button(command) {
    return this.each(function () {
        if (command === 'loading') {
            if (!buttonStates.has(this)) buttonStates.set(this, { html: this.innerHTML, disabled: this.disabled });
            this.disabled = true;
            this.setAttribute('aria-busy', 'true');
            if (this.dataset.loadingText) this.textContent = this.dataset.loadingText;
        } else if (command === 'reset') {
            const state = buttonStates.get(this);
            if (!state) return;
            this.innerHTML = state.html;
            this.disabled = state.disabled;
            this.removeAttribute('aria-busy');
            buttonStates.delete(this);
        }
        if (command === 'toggle') {
            if (this.matches(':disabled,.disabled')) return;
            this.classList.toggle('active');
            this.setAttribute('aria-pressed', this.classList.contains('active') ? 'true' : 'false');
        }
    });
};

document.addEventListener('click', (event) => {
    const trigger = event.target instanceof DOMElement ? event.target.closest('[data-toggle], [data-dismiss]') : null;
    if (!(trigger instanceof HTMLElement)) return;
    const toggle = trigger.getAttribute('data-toggle');
    const dismiss = trigger.getAttribute('data-dismiss');
    if (toggle === 'dropdown') {
        event.preventDefault();
        toggleDropdown(trigger);
    } else if (toggle === 'modal') {
        event.preventDefault();
        const target = targetFor(trigger);
        if (target) showModal(target, trigger);
    } else if (dismiss === 'modal') {
        event.preventDefault();
        const modal = trigger.closest('.modal');
        if (modal) hideModal(modal, trigger);
    } else if (toggle === 'tab' || toggle === 'pill') {
        event.preventDefault();
        showTab(trigger);
    } else if (toggle === 'collapse') {
        event.preventDefault();
        const target = targetFor(trigger);
        if (target) toggleCollapse(trigger, target);
    } else if (toggle === 'button' || toggle === 'buttons') {
        const button = toggle === 'button' ? trigger : event.target.closest('.btn');
        if (button) { event.preventDefault(); $(button).button('toggle'); }
    } else if (toggle === 'popover' && !$(trigger).data('bs.popover')) {
        $(trigger).popover();
        if (!trigger.dataset.trigger || trigger.dataset.trigger === 'click') $(trigger).popover('show');
    } else if (dismiss === 'alert') {
        event.preventDefault();
        trigger.closest('.alert')?.remove();
    }
});

document.addEventListener('click', (event) => {
    openDropdowns.forEach((_state, trigger) => {
        if (!(trigger.closest('.dropdown,.btn-group') || trigger.parentElement)?.contains(event.target)) toggleDropdown(trigger, false);
    });
});

for (const name of ['mouseover', 'focusin']) document.addEventListener(name, (event) => {
    const element = event.target instanceof DOMElement ? event.target.closest('[data-toggle="tooltip"]') : null;
    if (!element || $(element).data('bs.tooltip')) return;
    $(element).tooltip();
    $(element).tooltip('show');
});

document.addEventListener('keydown', (event) => {
    if (!(event.target instanceof DOMElement)) return;
    const tab = event.target.closest('[data-toggle="tab"],[data-toggle="pill"]');
    if (tab && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
        const tabs = Array.from(tab.closest('.nav,.nav-tabs')?.querySelectorAll('[data-toggle="tab"],[data-toggle="pill"]') || []).filter((node) => !node.matches('.disabled,:disabled'));
        const current = tabs.indexOf(tab);
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
            : (current + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1) + tabs.length) % tabs.length;
        if (tabs[index]) { event.preventDefault(); showTab(tabs[index]); tabs[index].focus(); }
    }
    const dropdown = event.target.closest('.dropdown,.btn-group');
    const trigger = dropdown?.querySelector('[data-toggle="dropdown"]');
    if (trigger && ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape', 'Tab'].includes(event.key)) {
        if (event.key === 'Escape' || event.key === 'Tab') {
            if (openDropdowns.has(trigger)) {
                toggleDropdown(trigger, false);
                if (event.key === 'Escape') { event.preventDefault(); trigger.focus(); }
            }
        } else if (!event.target.matches('input,textarea,select')) {
            event.preventDefault();
            toggleDropdown(trigger, true);
            const items = focusable(dropdown.querySelector('.dropdown-menu'));
            const current = items.indexOf(document.activeElement);
            const index = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
                : Math.max(0, Math.min(items.length - 1, current + (event.key === 'ArrowUp' ? -1 : 1)));
            items[index]?.focus();
        }
    }
    if (event.key === 'Escape') floatingInstances.forEach((instance) => instance.hide());
});

document.addEventListener('dcat:pjax:before-replace', () => {
    openDropdowns.forEach((_state, trigger) => toggleDropdown(trigger, false, true));
    floatingInstances.forEach((instance) => instance.dispose());
});


    $.fn.modal.dcatFacade = true;
}
