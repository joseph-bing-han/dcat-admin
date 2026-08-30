// 异步旧字段与 HTML 插入只进入兼容产物。
export const legacyFieldHelpers = {
        async asyncRender(url: string, callback: (html: string) => void) {
            const response = await fetch(url, { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            callback(await response.text());
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
