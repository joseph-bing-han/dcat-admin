import { installLoadingPlugins, createProgress } from './compat-loading';
import { installFormSerialization } from './compat-form';
import { installCompatOverlays, positionLayerTip } from './compat-overlays';
import { installCompatDiagnostics } from './compat-diagnostics';
import { legacyFieldHelpers } from './compat-fields';
import { DOMElement } from './platform';
import jQuery from 'jquery';
import GridCompat from '../assets/dcat/js/extensions/Grid.js';
import RowSelectorCompat from '../assets/dcat/js/extensions/RowSelector.js';
import DialogFormCompat from '../assets/dcat/js/extensions/DialogForm.js';
import ColorCompat from '../assets/dcat/js/extensions/Color.js';
import { executePageScripts } from './navigation';

const $ = window.jQuery || jQuery;
window.jQuery = $;
window.$ = $;
installFormSerialization($);
installCompatOverlays($);
const compatState = {};
Object.defineProperty(compatState, 'lastFormSubmit', { get: () => window.DcatNativeRuntime?.formState?.lastSubmit || null });
const charts = new Map();

function destroyChart(container) {
    const entry = charts.get(container);
    if (!entry) return;
    charts.delete(container);
    entry.cancelled = true;
    entry.observer?.disconnect();
    if (entry.chart) safeCompatDestroy(() => entry.chart.destroy());
}

function mountChart(container, options) {
    if (!(container instanceof HTMLElement) || typeof window.ApexCharts !== 'function') return null;
    destroyChart(container);
    const entry = { chart: null, observer: null, cancelled: false };
    charts.set(container, entry);
    const render = () => {
        if (entry.cancelled || !container.isConnected || container.getBoundingClientRect().width <= 0) return;
        entry.observer?.disconnect();
        entry.observer = null;
        entry.chart = new window.ApexCharts(container, options);
        Promise.resolve(entry.chart.render()).then(() => {
            if (entry.cancelled) safeCompatDestroy(() => entry.chart.destroy());
        }).catch((error) => {
            if (!entry.cancelled) window.Dcat?.handleAjaxError(error);
        });
    };
    if (container.isConnected && container.getBoundingClientRect().width > 0) render();
    else {
        entry.observer = new ResizeObserver(render);
        entry.observer.observe(container);
    }
    return entry.chart;
}

function cleanupCharts() {
    Array.from(charts.keys()).forEach(destroyChart);
}

document.addEventListener('dcat:pjax:before-replace', cleanupCharts);
window.addEventListener('pagehide', cleanupCharts);

function safeCompatDestroy(callback) {
    try {
        callback();
    } catch (_) {
        // A compat island may already have been destroyed by its own PJAX hook.
        // Cleanup is deliberately idempotent so one plugin cannot block others.
    }
}


function cleanupFormFieldIsland(root) {
    if (!(root instanceof HTMLElement)) return;
    const nodes = [root, ...root.querySelectorAll('*')];
    nodes.forEach((node) => {
        const $node = $(node);
        const cleanup = $node.data('dcatModernCleanup');
        if (typeof cleanup === 'function') {
            safeCompatDestroy(cleanup);
            $node.removeData('dcatModernCleanup');
        }
        if ($.fn.select2 && $node.data('select2')) safeCompatDestroy(() => $node.select2('destroy'));
        const slider = $node.data('ionRangeSlider');
        if (slider && typeof slider.destroy === 'function') safeCompatDestroy(() => slider.destroy());
        if ($.fn.ionRangeSlider && $node.data('isActive')) safeCompatDestroy(() => $node.ionRangeSlider('remove'));
        if ($.fn.iconpicker && $node.data('iconpicker')) safeCompatDestroy(() => $node.iconpicker('destroy'));
        if ($.fn.autocomplete && $node.data('autocomplete')) safeCompatDestroy(() => $node.autocomplete('dispose'));
    });
    if ($.jstree?.reference) {
        root.querySelectorAll('.jstree').forEach((node) => {
            const tree = $.jstree.reference(node);
            if (tree && typeof tree.destroy === 'function') safeCompatDestroy(() => tree.destroy());
        });
    }
    if (window.tinymce?.get) {
        root.querySelectorAll('[id]').forEach((node) => {
            const editor = window.tinymce.get(node.id);
            if (editor && typeof editor.remove === 'function') safeCompatDestroy(() => editor.remove());
        });
    }
}

document.addEventListener('dcat:modern:form-field-cleanup', (event) => {
    cleanupFormFieldIsland(event.target);
});

function dispatchNative(name, detail = {}) {
    document.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
}

function installLayerCompat() {
    if (window.layer?.open && window.layer?.close) return;

    let layerIndex = 0;
    const instances = new Map();
    const tipsByTarget = new WeakMap();
    const defaults = { shade: false, shadeClose: false, maxmin: false, resize: false };
    const appendContent = (container, content) => {
        if (content instanceof Node) {
            container.appendChild(content);
        } else if (content?.jquery) {
            content.toArray().forEach((node) => node instanceof Node && container.appendChild(node));
        } else if (content !== undefined && content !== null) {
            container.innerHTML = String(content);
        }
    };
    const close = (index, fromCancel = false) => {
        const key = Number(index);
        const instance = instances.get(key);
        if (!instance) return;
        if (fromCancel && typeof instance.options.cancel === 'function') {
            const allowed = instance.options.cancel(key, $(instance.panel));
            if (allowed === false) {
                instance.root.style.pointerEvents = 'none';
                return;
            }
        }
        instance.cleanup?.();
        instance.root.remove();
        instances.delete(key);
        if (typeof instance.options.end === 'function') instance.options.end();
    };
    const api = {
        config(options = {}) {
            Object.assign(defaults, options || {});
            return api;
        },
        open(options = {}) {
            const settings = { ...defaults, ...(options || {}) };
            const index = ++layerIndex;
            const root = document.createElement('div');
            root.className = 'dcat-modern-layer-host';
            root.dataset.layerIndex = String(index);
            Object.assign(root.style, {
                position: 'fixed', inset: '0', zIndex: String(1055 + index),
                display: 'flex', justifyContent: 'center', alignItems: settings.offset ? 'flex-start' : 'center',
                padding: '16px', background: settings.shade === false ? 'transparent' : 'rgba(17,24,39,.45)',
                pointerEvents: 'auto',
            });

            const panel = document.createElement('section');
            panel.id = `layui-layer${index}`;
            panel.className = 'layui-layer layui-layer-page dcat-modern-layer';
            panel.setAttribute('role', 'dialog');
            panel.setAttribute('aria-modal', 'true');
            Object.assign(panel.style, {
                position: 'relative', maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)',
                background: 'var(--dcat-modern-surface, #fff)', color: 'var(--dcat-modern-text, #111827)',
                border: '1px solid var(--dcat-modern-border, #d1d5db)', borderRadius: 'var(--dcat-modern-radius-lg, 8px)',
                boxShadow: 'var(--dcat-modern-shadow-modal, 0 12px 32px rgba(17,24,39,.18))', overflow: 'hidden',
                marginTop: settings.offset && settings.offset !== 'auto' ? (Array.isArray(settings.offset) ? String(settings.offset[0]) : String(settings.offset)) : '0',
            });
            const area = Array.isArray(settings.area) ? settings.area : settings.area ? [settings.area] : [];
            if (area[0]) panel.style.width = String(area[0]);
            if (area[1]) panel.style.height = String(area[1]);

            if (settings.title !== false && settings.title !== null && settings.title !== undefined && settings.title !== '') {
                const title = document.createElement('header');
                title.className = 'layui-layer-title';
                title.innerHTML = String(settings.title);
                Object.assign(title.style, { padding: '14px 48px 14px 16px', fontWeight: '600', borderBottom: '1px solid var(--dcat-modern-border-subtle, #e5e7eb)' });
                panel.appendChild(title);
            }

            const content = document.createElement('div');
            content.className = 'layui-layer-content';
            Object.assign(content.style, { overflow: 'auto', maxHeight: 'calc(100vh - 96px)', height: area[1] ? '100%' : 'auto' });
            appendContent(content, settings.content);
            panel.appendChild(content);

            if (Array.isArray(settings.btn) && settings.btn.length) {
                const footer = document.createElement('footer');
                footer.className = 'layui-layer-btn';
                Object.assign(footer.style, { display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 16px', borderTop: '1px solid var(--dcat-modern-border-subtle, #e5e7eb)' });
                settings.btn.forEach((label, buttonIndex) => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = `layui-layer-btn${buttonIndex} btn ${buttonIndex === 0 ? 'btn-primary' : 'btn-white'}`;
                    button.textContent = String(label);
                    button.addEventListener('click', () => {
                        const handler = buttonIndex === 0 ? settings.yes : settings[`btn${buttonIndex + 1}`];
                        if (typeof handler === 'function') {
                            const result = handler(index, $(panel));
                            if (result === false) return;
                        } else if (buttonIndex > 0) {
                            close(index, false);
                        }
                    });
                    footer.appendChild(button);
                });
                panel.appendChild(footer);
            }

            const closer = document.createElement('button');
            closer.type = 'button';
            closer.className = 'layui-layer-close dcat-modern-layer-close';
            closer.setAttribute('aria-label', 'Close');
            closer.textContent = '×';
            Object.assign(closer.style, { position: 'absolute', top: '8px', right: '10px', border: '0', background: 'transparent', fontSize: '24px', lineHeight: '1', cursor: 'pointer' });
            closer.addEventListener('click', () => close(index, true));
            panel.appendChild(closer);
            root.appendChild(panel);
            document.body.appendChild(root);

            const keydown = (event) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    close(index, true);
                }
            };
            document.addEventListener('keydown', keydown);
            if (settings.shadeClose) root.addEventListener('click', (event) => { if (event.target === root) close(index, true); });
            instances.set(index, { root, panel, options: settings, cleanup: () => document.removeEventListener('keydown', keydown) });
            // innerHTML 不会执行脚本，动态表单须先加载依赖再初始化字段。
            executePageScripts(content, () => root.isConnected)
                .then(() => { if (root.isConnected) window.Dcat?.triggerReady(); })
                .catch((error) => window.Dcat?.handleAjaxError(error));
            if (typeof settings.success === 'function') settings.success($(panel), index);
            queueMicrotask(() => (panel.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || panel).focus?.());
            return index;
        },
        close(index) {
            close(index, false);
        },
        closeAll() {
            Array.from(instances.keys()).forEach((index) => close(index, false));
        },
        restore(index) {
            const instance = instances.get(Number(index));
            if (!instance) return;
            instance.root.style.pointerEvents = 'auto';
            instance.panel.style.display = '';
        },
        tips(title, target, options = {}) {
            const element = target instanceof DOMElement ? target : $(target)[0];
            const previous = element && tipsByTarget.get(element);
            if (previous) close(previous);
            const index = ++layerIndex;
            const tip = document.createElement('div');
            tip.id = `layui-layer${index}`;
            tip.className = 'layui-layer layui-layer-tips dcat-modern-layer-tip';
            tip.setAttribute('role', 'tooltip');
            tip.textContent = String(title ?? '');
            Object.assign(tip.style, {
                position: 'fixed', zIndex: 'var(--dcat-modern-z-toast, 1200)', maxWidth: `${Math.min(options.maxWidth || 320, Math.max(0, innerWidth - 16))}px`,
                padding: '6px 9px', borderRadius: 'var(--dcat-modern-radius-sm, 4px)',
                background: options.tips?.[1] || '#111827', color: '#fff',
                pointerEvents: 'none',
            });
            document.body.appendChild(tip);
            const update = () => {
                if (!element?.isConnected || !tip.isConnected) return;
                tip.style.maxWidth = `${Math.min(options.maxWidth || 320, Math.max(0, innerWidth - 16))}px`;
                positionLayerTip(element, tip, Array.isArray(options.tips) ? options.tips[0] : options.tips);
            };
            update();
            if (element) tipsByTarget.set(element, index);
            window.addEventListener('resize', update);
            window.addEventListener('scroll', update, true);
            instances.set(index, { root: tip, panel: tip, options, cleanup: () => {
                window.removeEventListener('resize', update);
                window.removeEventListener('scroll', update, true);
                if (element && tipsByTarget.get(element) === index) tipsByTarget.delete(element);
            } });
            if (options.time) window.setTimeout(() => close(index, false), Number(options.time));
            return index;
        },
    };
    window.layer = api;
}

installLayerCompat();

const validatorDefaults = { custom: {}, errors: {} };
$.fn.validator = function validator(command) {
    return this.each(function () {
        if (!(this instanceof HTMLFormElement)) return;
        this.setAttribute('novalidate', 'novalidate');
        if (command === 'validate') {
            this.querySelectorAll('.has-error').forEach((element) => element.classList.remove('has-error'));
            Object.entries(validatorDefaults.custom).forEach(([rule, callback]) => {
                this.querySelectorAll(`[data-${rule}]`).forEach((element) => {
                    if (callback($(element))) element.closest('.form-group,.form-label-group,.form-field')?.classList.add('has-error');
                });
            });
            if (!this.checkValidity()) this.reportValidity();
            return;
        }
        if (this.dataset.dcatCompatValidator === '1') return;
        this.dataset.dcatCompatValidator = '1';
        this.addEventListener('submit', (event) => {
            if (this.checkValidity()) return;
            event.preventDefault();
            this.reportValidity();
        });
    });
};
$.fn.validator.Constructor = { DEFAULTS: validatorDefaults };

$.fn.form = function dcatForm(options = {}) {
    return this.each(function () {
        if (!(this instanceof HTMLFormElement)) return;
        if (options.validate) $(this).validator();
        this.dataset.dcatCompatForm = '1';
        window.Dcat?.bindForm(this, options);
    });
};

function pjax(url, options = {}) {
    // jQuery 的公开入口使用 options 对象，Dcat 的调用方也可传 URL 与 options。
    if (url && typeof url === 'object') {
        options = { ...url, ...options };
        url = options.url;
    }
    url = url || location.href;
    const runtime = window.DcatNativeRuntime;
    if (runtime?.pjax && window.Dcat) return runtime.pjax(window.Dcat, url, options);
    location.assign(url);
}
pjax.reload = function reload(container = {}, options = {}) {
    options = typeof container === 'string' ? { ...options, container } : { ...container, ...options };
    return pjax(options.url || location.href, { ...options, replace: true });
};
$.pjax = pjax;

function patchDcatInit(dcat) {
    if (!dcat || typeof dcat.init !== 'function' || dcat.__dcatCompatInit === true) return dcat;
    const nativeInit = dcat.init.bind(dcat);
    dcat.init = function compatInit(selector, callback, options) {
        return nativeInit(selector, function (element, id) { return callback.call(this, $(element), id); }, options);
    };
    dcat.__dcatCompatInit = true;
    return dcat;
}

async function submitCompatDcatForm(dcat, options = {}) {
    const form = $(options.form).first().get(0);
    if (!(form instanceof HTMLFormElement)) return false;
    const data = new FormData(form);
    if (dcat.token && !data.has('_token')) data.append('_token', dcat.token);
    if (typeof options.before === 'function' && options.before(data, $(form), {}, options) === false) return false;
    try {
        const response = await fetch(form.action || location.href, {
            method: (form.method || 'POST').toUpperCase(),
            credentials: 'same-origin',
            headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
            body: data,
        });
        const contentType = response.headers.get('content-type') || '';
        const payload = contentType.includes('application/json') ? await response.json() : { message: await response.text(), success: response.ok };
        if (typeof options.after === 'function' && options.after(response.ok, payload, options) === false) return false;
        if (response.ok) {
            if (typeof options.success === 'function' && options.success(payload, options) === false) return false;
            if (options.redirect !== false && dcat.handleJsonResponse) dcat.handleJsonResponse(payload);
            return payload;
        }
        if (typeof options.error === 'function') options.error(payload, options);
        dcat.handleAjaxError?.(payload?.message || `HTTP ${response.status}`);
        return false;
    } catch (error) {
        if (typeof options.after === 'function') options.after(false, error, options);
        if (typeof options.error === 'function') options.error(error, options);
        dcat.handleAjaxError?.(error);
        return false;
    }
}

function installLegacyDcatSurface(dcat) {
    if (!dcat) return dcat;
    patchDcatInit(dcat);
    if (dcat.__dcatCompatSurface === true) return dcat;
    Object.assign(dcat.helpers, legacyFieldHelpers);
    dcat.charts = { mount: mountChart, destroy: destroyChart, count: () => charts.size };
    dcat.Slider = function Slider(options = {}) {
        this.$container = $(options.target);
        this.open = () => window.DcatNativeRuntime.filter(this.$container[0], true);
        this.close = () => window.DcatNativeRuntime.filter(this.$container[0], false);
        this.toggle = () => window.DcatNativeRuntime.filter(this.$container[0]);
    };

    if (!dcat.color) new ColorCompat(dcat);
    if (!dcat.grid?.async) {
        const nativeGrid = dcat.grid;
        new GridCompat(dcat);
        const compatGrid = dcat.grid;
        compatGrid.selected = (name) => compatGrid.selectors[name || '_def_']?.getSelectedKeys() || nativeGrid?.selected(name) || [];
        compatGrid.selectedRows = (name) => compatGrid.selectors[name || '_def_']?.getSelectedRows() || nativeGrid?.selectedRows(name) || [];
    }
    if (typeof $.fn.loading !== 'function' || typeof $.fn.buttonLoading !== 'function') installLoadingPlugins($);

    dcat.RowSelector ||= (options) => new RowSelectorCompat(options);
    dcat.DialogForm ||= (options) => new DialogFormCompat(dcat, options);
    dcat.Form ||= (options) => submitCompatDcatForm(dcat, options);
    dcat.validator ||= {
        extend(rule, callback, message) {
            validatorDefaults.custom[rule] = callback;
            validatorDefaults.errors[rule] = message || null;
        },
    };
    dcat.NP ||= createProgress();
    dcat.assets ||= {
        resolveHtml(html, done) {
            return {
                render() {
                    if (typeof done === 'function') queueMicrotask(() => done.call(dcat));
                    return html;
                },
            };
        },
    };

    dcat.__dcatCompatSurface = true;
    return dcat;
}

// The page creates `window.Dcat` near the top of <body>, while this opt-in
// compatibility bundle is emitted later with page-specific legacy assets.
// Patch the live instance as well as any future instance created after PJAX.
installLegacyDcatSurface(window.Dcat);
const originalCreateDcat = window.CreateDcat;
if (typeof originalCreateDcat === 'function') {
    window.CreateDcat = function createCompatDcat(config) {
        return installLegacyDcatSurface(originalCreateDcat(config));
    };
}

$(document).off('.dcatCompatLifecycle');
let bridgingLifecycle = false;
const lifecycleEvents = {
    start: ['pjax:start', 'pjax:send'],
    'before-replace': ['pjax:beforeReplace'],
    success: ['pjax:success'],
    complete: ['pjax:complete'],
    loaded: ['pjax:loaded'],
    end: ['pjax:end'],
    error: ['pjax:error'],
    abort: ['pjax:abort'],
};
Object.entries(lifecycleEvents).forEach(([phase, names]) => {
    document.addEventListener(`dcat:pjax:${phase}`, (event) => {
        if (bridgingLifecycle) return;
        const detail = event.detail || {};
        const selector = detail.container || window.Dcat?.config?.pjax_container_selector;
        const target = selector ? document.querySelector(selector) || document : document;
        bridgingLifecycle = true;
        try {
            names.forEach((name) => $(target).trigger($.Event(name), [detail.xhr || null, detail.status || 'success', { ...detail, container: selector }]));
        } finally { bridgingLifecycle = false; }
    });
});
// 旧脚本主动触发的生命周期仍可唤醒 bridge，反向转发时阻止事件回环。
Object.entries({ send: 'start', beforeReplace: 'before-replace', complete: 'complete', loaded: 'loaded' }).forEach(([legacy, phase]) => {
    $(document).on(`pjax:${legacy}.dcatCompatLifecycle`, (_event, ...args) => {
        if (bridgingLifecycle) return;
        bridgingLifecycle = true;
        try { dispatchNative(`dcat:pjax:${phase}`, { args }); }
        finally { bridgingLifecycle = false; }
    });
});

window.DcatCompat = {
    version: '1.0.0',
    jquery: $.fn.jquery,
    surfaces: ['modal', 'dropdown', 'tab', 'collapse', 'popover', 'tooltip', 'button', 'validator', 'form', 'pjax'],
    state: compatState,
    ...installCompatDiagnostics(),
};
