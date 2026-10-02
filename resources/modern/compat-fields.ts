// 异步旧字段与 HTML 插入只进入兼容产物。
import { executePageScripts, loadScript } from './navigation';

export const legacyFieldHelpers = {
        async asyncRender(url: string, callback: (html: string) => void) {
            const response = await fetch(url, { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const content = document.createElement('div');
            content.innerHTML = await response.text();
            const executable = Array.from(content.querySelectorAll<HTMLScriptElement>('script')).filter((script) =>
                !script.type || /^(?:text|application)\/(?:java|ecma)script$|^module$/.test(script.type));
            // jQuery 插入 HTML 时可能先执行初始化脚本，须先按顺序加载外部依赖。
            for (const script of executable.filter((script) => script.src)) {
                if (!Array.from(document.scripts).some((existing) => existing.src === script.src)) await loadScript(script);
                script.remove();
            }
            const scripts = document.createElement('div');
            for (const script of executable.filter((script) => !script.src)) scripts.appendChild(script);
            callback(content.innerHTML);
            scripts.hidden = true;
            document.body.appendChild(scripts);
            try {
                await executePageScripts(scripts, () => scripts.isConnected);
                (window as unknown as { Dcat?: { triggerReady?: () => void } }).Dcat?.triggerReady?.();
            } finally {
                scripts.remove();
            }
        },
        async loadFields(_this: Element, options: {
            group?: string;
            urls?: string[];
            fields?: string[];
            textField?: string;
            idField?: string;
            values?: string | string[];
        } = {}) {
            const source = _this instanceof HTMLSelectElement ? _this : null;
            const values = options.values !== undefined
                ? (Array.isArray(options.values) ? options.values : [options.values]).map(String).filter(Boolean)
                : source
                    ? Array.from(source.selectedOptions).map((option) => option.value).filter((value) => value === '0' || Boolean(value))
                    : [];
            const fields = options.fields || [];
            const urls = options.urls || [];
            if (!values.length || !fields.length || !urls.length) return;

            const scopeSelector = options.group || '.fields-group';
            const scope = _this.closest(scopeSelector) || _this.closest('form');
            if (!scope) return;

            const dcat = (window as unknown as { Dcat?: { loading?: (active?: boolean) => void; handleAjaxError?: (...args: unknown[]) => void } }).Dcat;
            dcat?.loading?.(true);
            try {
                await Promise.all(fields.map(async (field, index) => {
                    const url = urls[index];
                    if (!url) return;
                    const target = scope.querySelector<HTMLSelectElement>(`.${CSS.escape(field)}`);
                    if (!target) return;

                    const requestUrl = new URL(url, window.location.href);
                    requestUrl.searchParams.set('q', values.join(','));
                    const response = await fetch(requestUrl, {
                        credentials: 'same-origin',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            Accept: 'application/json',
                        },
                    });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const payload = await response.json() as unknown;
                    const rows = Array.isArray(payload)
                        ? payload
                        : payload && typeof payload === 'object' && Array.isArray((payload as Record<string, unknown>).data)
                            ? (payload as Record<string, unknown>).data as unknown[]
                            : [];
                    const idField = options.idField || 'id';
                    const textField = options.textField || 'text';
                    target.replaceChildren(...rows.map((row) => {
                        const record = row && typeof row === 'object' ? row as Record<string, unknown> : {};
                        return new Option(String(record[textField] ?? ''), String(record[idField] ?? ''), false, false);
                    }));

                    const current = String(target.dataset.value || '');
                    if (current) {
                        const selected = new Set(current.split(','));
                        Array.from(target.options).forEach((option) => { option.selected = selected.has(option.value); });
                    }
                    target.dispatchEvent(new Event('change', { bubbles: true }));
                }));
                window.dispatchEvent(new CustomEvent('dcat:compat:load-fields', { detail: { fields, values } }));
            } catch (error) {
                dcat?.handleAjaxError?.(error);
                throw error;
            } finally {
                dcat?.loading?.(false);
            }
        },
 };
