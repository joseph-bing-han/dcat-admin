import React from 'react';
import { Button, Tabs } from '../presentation';
import { Input, Textarea, Select, Choice } from '../controls';
import { directFallback, LegacyNodesIsland, meaningfulNodes, safeStructuralProps } from '../dom';

export interface FormControlOptionPayload {
    value: string;
    label: string;
}

export interface FormControlPayload {
    kind: 'input' | 'textarea' | 'display' | 'hidden' | 'select' | 'radio' | 'checkbox' | 'switch' | 'color' | 'dual-list' | 'range-pair';
    type: string;
    id: string;
    name: string;
    value: string | Array<string | number>;
    options: FormControlOptionPayload[];
    groups: Array<{ label: string; options: FormControlOptionPayload[] }>;
    multiple?: boolean;
    prepend?: string;
    append?: string;
    prependIcon?: string;
    appendIcon?: string;
    inputs?: Array<{
        key: string;
        id: string;
        name: string;
        type: string;
        value: string;
        attributes: Record<string, unknown>;
    }>;
    placeholder: string;
    className: string;
    attributes: Record<string, unknown>;
    viewClass: Record<string, string>;
    formGroupClass: string;
    help: string;
    errorKey: string;
}

interface NativeFieldModel {
    kind: 'native';
    groupProps: Record<string, unknown>;
    labelProps: Record<string, unknown>;
    label: string;
    fieldProps: Record<string, unknown>;
    control: FormControlPayload;
    hasError?: boolean;
    initialErrors: string[];
}

interface NativeHiddenFieldModel {
    kind: 'native-hidden';
    control: FormControlPayload;
}

interface AdvancedFieldModel {
    kind: 'advanced';
    node: HTMLElement;
}

interface IslandModel {
    kind: 'island';
    node: Node;
}

type FormItemModel = NativeFieldModel | NativeHiddenFieldModel | AdvancedFieldModel | IslandModel;

interface FieldsSectionModel {
    kind: 'fields';
    items: FormItemModel[];
    props?: Record<string, unknown>;
}

export interface FormLayoutNodePayload {
    kind: 'stack' | 'rows' | 'columns' | 'row' | 'column' | 'field' | 'block' | 'tabs' | 'compat-layout';
    slotId?: string;
    width?: Record<string, number>;
    title?: string;
    children?: FormLayoutNodePayload[];
    content?: FormLayoutNodePayload;
    serverType?: string;
    items?: Array<{
        id: string;
        title: string;
        active: boolean;
        content: FormLayoutNodePayload;
    }>;
}

type NativeLayoutModel =
    | { kind: 'field'; item: FormItemModel }
    | { kind: 'stack' | 'rows' | 'columns' | 'row'; children: NativeLayoutModel[] }
    | { kind: 'column'; width: Record<string, number>; children: NativeLayoutModel[] }
    | { kind: 'block'; title: string; content: NativeLayoutModel }
    | { kind: 'tabs'; defaultId?: string; items: Array<{ id: string; label: string; content: NativeLayoutModel }> };

interface NativeLayoutSectionModel {
    kind: 'native-layout';
    tree: NativeLayoutModel;
}

type FormSectionModel = FieldsSectionModel | NativeLayoutSectionModel;

export interface FormModel {
    compatNodes?: Node[];
    headerNodes: Node[];
    sections: FormSectionModel[];
    footerNodes: Node[];
    hiddenNodes: Node[];
    layoutWrappers?: Record<string, unknown>[];
    surfaceProps?: Record<string, unknown>;
    bodyProps?: Record<string, unknown>;
}

export interface FormFieldPayload {
    slotId: string;
    column: string | string[];
    name?: string | string[];
    label: string;
    serverType: string;
    fieldType: string;
    view: string;
    renderer: 'native' | 'compat';
    adapter: string;
    control?: FormControlPayload | null;
}

export interface FormViewPayload {
    id: string;
    title: string;
    mode: string;
    action: string;
    method: string;
    multipart: boolean;
    layout: {
        hasRows: boolean;
        hasColumns: boolean;
        hasBlocks: boolean;
        tree?: FormLayoutNodePayload;
    };
    fields: FormFieldPayload[];
    advancedFieldCount: number;
}

function standardFormSurface(fallback: HTMLElement): HTMLElement {
    if (Array.from(fallback.children).some((child) => child.classList.contains('box-body'))) {
        return fallback;
    }

    // 弹窗表单使用 row/column 包装，不包含标准页面的 card。
    const dialogColumns = Array.from(fallback.querySelectorAll<HTMLElement>(':scope > .row > .col-md-12')).filter((column) =>
        Array.from(column.children).some((child) => child.classList.contains('box-body')));
    if (dialogColumns.length === 1) return dialogColumns[0];

    const cards = Array.from(fallback.querySelectorAll<HTMLElement>('.card')).filter((card) => {
        if (card.closest('.form-group')) return false;
        return Array.from(card.children).some((child) => child.classList.contains('box-body'));
    });

    if (cards.length !== 1) {
        throw new Error('Form fallback does not match the standard Dcat Form structure');
    }

    return cards[0];
}

function topLevelFormGroups(fallback: HTMLElement): HTMLElement[] {
    return Array.from(fallback.querySelectorAll<HTMLElement>('.form-group')).filter((group) => {
        const parentGroup = group.parentElement?.closest('.form-group');
        return !parentGroup || !fallback.contains(parentGroup);
    });
}

function initialErrorMessages(group?: HTMLElement): string[] {
    const container = group?.querySelector<HTMLElement>('.help-block.with-errors');
    if (!container) return [];

    const messages = (element: HTMLElement): string[] => {
        const children = Array.from(element.children) as HTMLElement[];
        const messageElements = children.every((child) => ['DIV', 'P', 'LI'].includes(child.tagName)
            || child.classList.contains('dcat-modern-form-error'));

        if ((element.matches('ul,ol') || (children.length > 0 && messageElements)) && children.length > 0) {
            return children.flatMap(messages);
        }

        const text = element.textContent?.trim() || '';
        return text ? [text] : [];
    };

    return messages(container);
}

function nativeFieldFromPayload(descriptor: FormFieldPayload, group?: HTMLElement): NativeFieldModel | NativeHiddenFieldModel {
    const control = descriptor.control;
    if (!control) throw new Error(`Native Form field ${descriptor.slotId} has no control payload`);
    if (control.kind === 'hidden') return { kind: 'native-hidden', control };

    const label = group?.querySelector<HTMLElement>('.control-label');
    const field = group ? Array.from(group.children).find((child): child is HTMLElement => (
        child instanceof HTMLElement && child !== label && !['SCRIPT', 'STYLE'].includes(child.tagName)
    )) : undefined;
    const initialErrors = initialErrorMessages(group);
    const groupProps = group ? safeStructuralProps(group) : {
        className: `form-group row ${control.formGroupClass || ''}`.trim(),
    };
    const labelProps = label ? safeStructuralProps(label) : {
        className: `${control.viewClass?.label || ''} control-label`.trim(),
    };
    const fieldProps = field ? safeStructuralProps(field) : {
        className: String(control.viewClass?.field || ''),
    };

    return {
        kind: 'native',
        groupProps,
        labelProps,
        label: descriptor.label,
        fieldProps,
        control: {
            ...control,
            // 图标 affix 的 HTML 不进入 payload 文本，保留服务端已有图标类。
            prependIcon: group?.querySelector<HTMLElement>('.input-group-prepend i')?.className,
            appendIcon: group?.querySelector<HTMLElement>('.input-group-append i')?.className,
        },
        hasError: Boolean(initialErrors.length || group?.classList.contains('has-error') || group?.classList.contains('has-danger')),
        initialErrors,
    };
}

function compatHiddenNode(fallback: HTMLElement, descriptor: FormFieldPayload): Node | null {
    const names = Array.isArray(descriptor.name) ? descriptor.name : [descriptor.name || ''];
    const inputs = Array.from(fallback.querySelectorAll<HTMLInputElement>('input[type="hidden"]'));
    return inputs.find((input) => names.includes(input.name)) || null;
}

function payloadFieldItems(fallback: HTMLElement, payload: FormViewPayload): Map<string, FormItemModel> {
    const groups = topLevelFormGroups(fallback);
    const items = new Map<string, FormItemModel>();
    let groupIndex = 0;

    payload.fields.forEach((descriptor) => {
        if (descriptor.renderer === 'native' && descriptor.control?.kind === 'hidden') {
            items.set(descriptor.slotId, nativeFieldFromPayload(descriptor));
            return;
        }

        const group = groups[groupIndex++];
        if (descriptor.renderer === 'native') {
            items.set(descriptor.slotId, nativeFieldFromPayload(descriptor, group));
            return;
        }
        if (group) {
            items.set(descriptor.slotId, { kind: 'advanced', node: group });
            return;
        }
        const hidden = compatHiddenNode(fallback, descriptor);
        if (hidden) {
            items.set(descriptor.slotId, { kind: 'island', node: hidden });
            return;
        }
        throw new Error(`Compat Form field ${descriptor.slotId} cannot be matched to its fallback node`);
    });

    return items;
}

function descriptorNames(descriptor: FormFieldPayload): string[] {
    const raw = Array.isArray(descriptor.name) ? descriptor.name : [descriptor.name || descriptor.control?.name || ''];
    return raw.map(String).filter(Boolean);
}

function groupMatchesDescriptor(group: HTMLElement, descriptor: FormFieldPayload): boolean {
    const names = descriptorNames(descriptor);
    if (names.length) {
        const controls = Array.from(group.querySelectorAll<HTMLElement>('[name]'));
        const matchesName = controls.some((control) => {
            const actual = control.getAttribute('name') || '';
            return names.some((name) => actual === name || actual === `${name}[]` || actual.startsWith(`${name}[`));
        });
        if (matchesName) return true;
    }

    const label = group.querySelector<HTMLElement>('.control-label')?.textContent?.replace(/\s+/g, ' ').trim() || '';
    return Boolean(descriptor.label && label === descriptor.label);
}

function readPayloadStack(source: HTMLElement, payload: FormViewPayload): FormItemModel[] {
    const used = new Set<string>();
    const native = payload.fields.filter((descriptor) => descriptor.renderer === 'native');

    const matchNative = (group: HTMLElement) => native.find((descriptor) => (
        !used.has(descriptor.slotId)
        && descriptor.control?.kind !== 'hidden'
        && groupMatchesDescriptor(group, descriptor)
    ));

    return meaningfulNodes(source.childNodes).map((node): FormItemModel => {
        if (node instanceof HTMLInputElement && node.type === 'hidden') {
            const descriptor = native.find((candidate) => (
                !used.has(candidate.slotId)
                && candidate.control?.kind === 'hidden'
                && descriptorNames(candidate).includes(node.name)
            ));
            if (descriptor) {
                used.add(descriptor.slotId);
                return nativeFieldFromPayload(descriptor);
            }
            return { kind: 'island', node };
        }

        if (node instanceof HTMLElement && node.classList.contains('form-group')) {
            const descriptor = matchNative(node);
            if (descriptor) {
                used.add(descriptor.slotId);
                return nativeFieldFromPayload(descriptor, node);
            }
            return { kind: 'advanced', node };
        }

        // Structural legacy nodes such as Fieldset/CascadeGroup intentionally
        // remain intact. Their nested fields are scoped by this island instead
        // of splitting start/end markup across independent React slots.
        return { kind: 'island', node };
    });
}

function layoutModelHasError(node: NativeLayoutModel): boolean {
    if (node.kind === 'field') return node.item.kind === 'native' && Boolean(node.item.hasError)
        || node.item.kind === 'advanced' && (node.item.node.classList.contains('has-error') || node.item.node.classList.contains('has-danger'));
    if (node.kind === 'block') return layoutModelHasError(node.content);
    if (node.kind === 'tabs') return node.items.some((item) => layoutModelHasError(item.content));
    return node.children.some(layoutModelHasError);
}

function readPayloadLayout(node: FormLayoutNodePayload, items: Map<string, FormItemModel>): NativeLayoutModel {
    if (node.kind === 'field') {
        const item = node.slotId ? items.get(node.slotId) : null;
        if (!item) throw new Error(`Form layout references unknown slot ${node.slotId || '<missing>'}`);
        return { kind: 'field', item };
    }
    if (node.kind === 'compat-layout') {
        throw new Error(`Form layout contains unsupported compat node ${node.serverType || 'unknown'}`);
    }
    if (node.kind === 'block') {
        if (!node.content) throw new Error('Form block layout has no content');
        return { kind: 'block', title: node.title || '', content: readPayloadLayout(node.content, items) };
    }
    if (node.kind === 'tabs') {
        const tabs = (node.items || []).map((item) => ({
            id: item.id,
            label: item.title,
            active: item.active,
            content: readPayloadLayout(item.content, items),
        }));
        const hashId = window.location.hash ? decodeURIComponent(window.location.hash.replace(/^#/, '')) : '';
        const errorTab = tabs.find((tab) => layoutModelHasError(tab.content));
        const hashTab = tabs.find((tab) => tab.id === hashId);
        const defaultTab = errorTab || hashTab || tabs.find((tab) => tab.active) || tabs[0];
        return {
            kind: 'tabs',
            defaultId: defaultTab?.id,
            items: tabs.map(({ id, label, content }) => ({ id, label, content })),
        };
    }

    const children = (node.children || []).map((child) => readPayloadLayout(child, items));
    if (node.kind === 'column') return { kind: 'column', width: node.width || { md: 12 }, children };
    return { kind: node.kind, children } as NativeLayoutModel;
}

function surfaceLayoutProps(surface: HTMLElement, fallback: HTMLElement): Pick<FormModel, 'layoutWrappers' | 'surfaceProps' | 'bodyProps'> {
    const layoutWrappers: Record<string, unknown>[] = [];
    for (let node = surface.parentElement; surface !== fallback && node && node !== fallback; node = node.parentElement) {
        layoutWrappers.unshift(safeStructuralProps(node));
    }
    const body = Array.from(surface.children).find((child) => child.classList.contains('box-body')) as HTMLElement | undefined;
    return {
        layoutWrappers,
        surfaceProps: surface === fallback ? undefined : safeStructuralProps(surface),
        bodyProps: body ? safeStructuralProps(body) : undefined,
    };
}

export function readFormModel(form: HTMLElement, payload: FormViewPayload | null = null): FormModel {
    const fallback = directFallback(form);
    // 分步扩展拥有容器、导航和工具栏，必须整体保留，避免字段提取拆散插件结构。
    if (!payload?.layout.tree || fallback.querySelector('.dcat-step-box')) {
        return { compatNodes: meaningfulNodes(fallback.childNodes), headerNodes: [], footerNodes: [], hiddenNodes: [], sections: [] };
    }
    const nativeHiddenNames = new Set((payload?.fields ?? [])
        .filter((field) => field.renderer === 'native' && field.control?.kind === 'hidden')
        .map((field) => field.control?.name || ''));
    const hiddenNodes = Array.from(fallback.querySelectorAll<HTMLInputElement>('input[type="hidden"]')).filter((input) => (
        !input.closest('.form-group')
        && !nativeHiddenNames.has(input.name)
    ));

    if (payload?.layout.tree?.kind === 'stack') {
        const surface = standardFormSurface(fallback);
        const header = Array.from(surface.children).find((child) => child.classList.contains('box-header')) as HTMLElement | undefined;
        const body = Array.from(surface.children).find((child) => child.classList.contains('box-body')) as HTMLElement | undefined;
        const footer = Array.from(surface.children).find((child) => child.classList.contains('box-footer')) as HTMLElement | undefined;
        if (!body) throw new Error('Form fallback does not match the standard Dcat Form structure');
        const source = body.querySelector<HTMLElement>('.fields-group') ?? body;
        return {
            ...surfaceLayoutProps(surface, fallback),
            headerNodes: header ? [header] : [],
            sections: [{ kind: 'fields', items: readPayloadStack(source, payload), props: source === body ? undefined : safeStructuralProps(source) }],
            footerNodes: footer ? [footer] : [],
            hiddenNodes,
        };
    }

    if (payload?.layout.tree) {
        const items = payloadFieldItems(fallback, payload);
        const tree = readPayloadLayout(payload.layout.tree, items);
        if (payload.layout.hasBlocks) {
            return {
                headerNodes: [],
                sections: [{ kind: 'native-layout', tree }],
                footerNodes: [],
                hiddenNodes,
            };
        }

        const surface = standardFormSurface(fallback);
        const header = Array.from(surface.children).find((child) => child.classList.contains('box-header')) as HTMLElement | undefined;
        const footer = Array.from(surface.children).find((child) => child.classList.contains('box-footer')) as HTMLElement | undefined;
        return {
            ...surfaceLayoutProps(surface, fallback),
            headerNodes: header ? [header] : [],
            sections: [{ kind: 'native-layout', tree }],
            footerNodes: footer ? [footer] : [],
            hiddenNodes,
        };
    }

    throw new Error('Form payload is missing its layout tree');
}

function styleFromString(value: unknown): React.CSSProperties | undefined {
    if (typeof value !== 'string' || !value.trim()) return undefined;
    const style: Record<string, string> = {};
    value.split(';').forEach((declaration) => {
        const separator = declaration.indexOf(':');
        if (separator < 1) return;
        const property = declaration.slice(0, separator).trim();
        const propertyValue = declaration.slice(separator + 1).trim();
        if (!property || !propertyValue) return;
        const key = property.startsWith('--') ? property : property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
        style[key] = propertyValue;
    });
    return style as React.CSSProperties;
}

function nativeAttributeProps(attributes: Record<string, unknown>): Record<string, unknown> {
    const props: Record<string, unknown> = {};
    const booleanAttributes = new Set(['disabled', 'required', 'readonly', 'multiple', 'autofocus']);
    const propertyNames: Record<string, string> = {
        readonly: 'readOnly',
        autofocus: 'autoFocus',
        autocomplete: 'autoComplete',
        maxlength: 'maxLength',
        minlength: 'minLength',
        tabindex: 'tabIndex',
    };
    Object.entries(attributes || {}).forEach(([rawName, value]) => {
        const name = rawName.toLowerCase();
        if (name === 'class' || name === 'name' || name === 'value' || name === 'type' || name === 'id' || name.startsWith('on')) return;
        const property = propertyNames[name] || rawName;
        if (name === 'style') {
            const style = styleFromString(value);
            if (style) props.style = style;
            return;
        }
        if (booleanAttributes.has(name)) {
            props[property] = value !== false && value !== null && value !== 'false' && value !== '0';
            return;
        }
        if (name === 'tabindex') {
            props[property] = Number(value);
            return;
        }
        props[property] = value;
    });
    return props;
}

function stringValues(value: FormControlPayload['value']): string[] {
    return (Array.isArray(value) ? value : [value]).map(String);
}

function AffixedControl({ control, children }: { control: FormControlPayload; children: React.ReactNode }) {
    if (!control.prepend && !control.append && !control.prependIcon && !control.appendIcon) return <>{children}</>;
    return (
        <div className="dcat-modern-form-input-group">
            {control.prepend || control.prependIcon ? <span className="dcat-modern-form-affix" aria-hidden="true">{control.prependIcon ? <i className={control.prependIcon} /> : null}{control.prepend}</span> : null}
            {children}
            {control.append || control.appendIcon ? <span className="dcat-modern-form-affix" aria-hidden="true">{control.appendIcon ? <i className={control.appendIcon} /> : null}{control.append}</span> : null}
        </div>
    );
}

function NativeRangeControl({ control, describedBy, invalid }: { control: FormControlPayload; describedBy?: string; invalid?: boolean }) {
    const inputs = control.inputs ?? [];
    const [values, setValues] = React.useState<Record<string, string>>(() => Object.fromEntries(inputs.map((input) => [input.key, input.value])));
    const bounded = ['date', 'time'].includes(control.type);
    return (
        <div id={control.id} className="dcat-modern-form-range" data-dcat-modern-native-control="range-pair">
            {inputs.map((input) => {
                const props = nativeAttributeProps(input.attributes) as React.InputHTMLAttributes<HTMLInputElement>;
                if (invalid) props['aria-invalid'] = 'true';
                const limit = input.key === 'start'
                    ? (bounded && values.end ? { max: values.end } : {})
                    : (bounded && values.start ? { min: values.start } : {});
                return (
                    <Input
                        {...props}
                        {...limit}
                        key={input.key}
                        id={input.id}
                        name={input.name}
                        type={input.type}
                        className="form-control"
                        value={values[input.key] ?? ''}
                        aria-describedby={describedBy}
                        aria-label={`${control.name} ${input.key}`}
                        onChange={(event) => setValues((current) => ({ ...current, [input.key]: event.currentTarget.value }))}
                    />
                );
            })}
        </div>
    );
}

function NativeDualListControl({ control, describedBy, invalid }: { control: FormControlPayload; describedBy?: string; invalid?: boolean }) {
    const initial = stringValues(control.value).filter(Boolean);
    const allOptions = React.useMemo(() => {
        const known = new Set(control.options.map((option) => option.value));
        return [...control.options, ...initial.filter((value) => !known.has(value)).map((value) => ({ value, label: value }))];
    }, [control.options]);
    const [selected, setSelected] = React.useState<Set<string>>(() => new Set(initial));
    const [availableChoice, setAvailableChoice] = React.useState<Set<string>>(() => new Set());
    const [selectedChoice, setSelectedChoice] = React.useState<Set<string>>(() => new Set());
    const available = allOptions.filter((option) => !selected.has(option.value));
    const chosen = allOptions.filter((option) => selected.has(option.value));
    const collect = (element: HTMLSelectElement) => new Set(Array.from(element.selectedOptions).map((option) => option.value));
    const add = () => {
        setSelected((current) => new Set([...current, ...availableChoice]));
        setAvailableChoice(new Set());
    };
    const remove = () => {
        setSelected((current) => new Set([...current].filter((value) => !selectedChoice.has(value))));
        setSelectedChoice(new Set());
    };

    return (
        <div id={control.id} className="dcat-modern-form-dual-list" data-dcat-modern-native-control="dual-list">
            <input type="hidden" name={`${control.name}[]`} value="" />
            {chosen.map((option) => <input key={option.value} type="hidden" name={`${control.name}[]`} value={option.value} />)}
            <Select
                id={`${control.id}-available`}
                className="form-control"
                multiple
                size={Math.max(5, Math.min(10, available.length || 5))}
                aria-label={`${control.name} available`}
                aria-describedby={describedBy}
                aria-invalid={invalid ? 'true' : undefined}
                value={[...availableChoice]}
                onChange={(event) => setAvailableChoice(collect(event.currentTarget))}
            >
                {available.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
            <div className="dcat-modern-form-dual-list-actions">
                <Button type="button" tone="primary" onPress={add} disabled={!availableChoice.size} aria-label="Add selected options">→</Button>
                <Button type="button" tone="secondary" onPress={remove} disabled={!selectedChoice.size} aria-label="Remove selected options">←</Button>
            </div>
            <Select
                id={`${control.id}-selected`}
                className="form-control"
                multiple
                size={Math.max(5, Math.min(10, chosen.length || 5))}
                aria-label={`${control.name} selected`}
                aria-describedby={describedBy}
                aria-invalid={invalid ? 'true' : undefined}
                value={[...selectedChoice]}
                onChange={(event) => setSelectedChoice(collect(event.currentTarget))}
            >
                {chosen.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
        </div>
    );
}

function NativeColorControl({ control, describedBy, invalid }: { control: FormControlPayload; describedBy?: string; invalid?: boolean }) {
    const [value, setValue] = React.useState(String(control.value ?? ''));
    const normalizeHex = (candidate: string) => {
        if (/^#[0-9a-f]{6}$/i.test(candidate)) return candidate;
        if (/^#[0-9a-f]{3}$/i.test(candidate)) return `#${candidate.slice(1).split('').map((part) => part + part).join('')}`;
        return '#000000';
    };
    const shared = nativeAttributeProps(control.attributes) as React.InputHTMLAttributes<HTMLInputElement>;
    if (invalid) shared['aria-invalid'] = 'true';
    return (
        <div id={control.id} className="dcat-modern-form-color" data-dcat-modern-native-control="color">
            <input
                {...shared}
                id={`${control.id}-text`}
                name={control.name}
                type="text"
                className={control.className}
                value={value}
                aria-describedby={describedBy}
                onChange={(event) => setValue(event.currentTarget.value)}
            />
            <input
                type="color"
                value={normalizeHex(value)}
                aria-label={`${control.name} color picker`}
                aria-invalid={invalid ? 'true' : undefined}
                onChange={(event) => setValue(event.currentTarget.value)}
            />
        </div>
    );
}

function NativeControl({ control, describedBy, invalid, labelledBy }: { control: FormControlPayload; describedBy?: string; invalid?: boolean; labelledBy?: string }) {
    const shared = nativeAttributeProps(control.attributes);
    if (describedBy) shared['aria-describedby'] = describedBy;
    if (invalid) shared['aria-invalid'] = 'true';
    const marker = { 'data-dcat-modern-native-control': control.kind };
    const value = Array.isArray(control.value) ? control.value.map(String) : String(control.value ?? '');

    if (control.kind === 'hidden') {
        return <input {...shared as React.InputHTMLAttributes<HTMLInputElement>} {...marker} id={control.id} type="hidden" name={control.name} defaultValue={String(value)} />;
    }
    if (control.kind === 'textarea') {
        return <Textarea {...shared as React.TextareaHTMLAttributes<HTMLTextAreaElement>} {...marker} id={control.id} name={control.name} className={control.className} placeholder={control.placeholder} defaultValue={String(value)} />;
    }
    if (control.kind === 'display') {
        return <div {...marker} id={control.id} className={control.className}>{String(value)}</div>;
    }
    if (control.kind === 'range-pair') return <NativeRangeControl control={control} describedBy={describedBy} invalid={invalid} />;
    if (control.kind === 'dual-list') return <NativeDualListControl control={control} describedBy={describedBy} invalid={invalid} />;
    if (control.kind === 'color') return <NativeColorControl control={control} describedBy={describedBy} invalid={invalid} />;
    if (control.kind === 'select') {
        const name = control.multiple ? `${control.name}[]` : control.name;
        const selected = control.multiple ? stringValues(control.value) : String(value);
        return (
            <>
                {control.multiple ? <input type="hidden" name={name} value="" /> : null}
                <Select
                    {...shared as React.SelectHTMLAttributes<HTMLSelectElement>}
                    {...marker}
                    id={control.id}
                    name={name}
                    className={control.className}
                    multiple={Boolean(control.multiple)}
                    defaultValue={selected}
                >
                    {!control.multiple ? <option value="">{control.placeholder}</option> : null}
                    {control.groups.length
                        ? control.groups.map((group, groupIndex) => (
                            <optgroup key={`${group.label}-${groupIndex}`} label={group.label}>
                                {group.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </optgroup>
                        ))
                        : control.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
            </>
        );
    }
    if (control.kind === 'radio' || control.kind === 'checkbox') {
        const checked = new Set(stringValues(control.value));
        const name = control.kind === 'checkbox' ? `${control.name}[]` : control.name;
        return (
            <div
                className={`dcat-modern-form-options dcat-modern-form-options--${control.kind}`}
                {...marker}
                role={control.kind === 'radio' ? 'radiogroup' : 'group'}
                aria-labelledby={labelledBy}
                aria-describedby={describedBy}
                aria-required={control.kind === 'radio' && shared.required ? 'true' : undefined}
            >
                <input type="hidden" name={name} value="" />
                {control.options.map((option, index) => {
                    const optionId = `${control.id}-${index}`;
                    return (
                        <Choice key={option.value}
                            {...shared as React.InputHTMLAttributes<HTMLInputElement>}
                            id={optionId} kind={control.kind === 'radio' ? 'radio' : 'checkbox'} name={name} value={option.value}
                            defaultChecked={checked.has(option.value)} label={option.label}
                            className="dcat-modern-form-option"
                        />
                    );
                })}
            </div>
        );
    }
    if (control.kind === 'switch') {
        const checked = !['', '0', 'false'].includes(String(value).toLowerCase());
        return (
            <span className="dcat-modern-form-switch" {...marker}>
                <input type="hidden" name={control.name} value="0" />
                <Choice {...shared as React.InputHTMLAttributes<HTMLInputElement>} id={control.id} kind="switch" name={control.name} value="1" defaultChecked={checked} aria-labelledby={labelledBy} />
            </span>
        );
    }
    const input = <Input {...shared as React.InputHTMLAttributes<HTMLInputElement>} {...marker} id={control.id} type={control.type || 'text'} name={control.name} className={control.className} placeholder={control.placeholder} defaultValue={String(value)} />;
    return <AffixedControl control={control}>{input}</AffixedControl>;
}

function NativeField({ item }: { item: NativeFieldModel }) {
    const groupClassName = String(item.groupProps.className ?? '');
    const labelClassName = String(item.labelProps.className ?? '');
    const fieldClassName = String(item.fieldProps.className ?? '');
    const control = item.control;
    const errorId = `${control.id}-errors`;
    const helpId = control.help ? `${control.id}-help` : '';
    const describedBy = [helpId, errorId].filter(Boolean).join(' ');
    const multipleChoice = ['radio', 'checkbox'].includes(control.kind);
    const requiredAsterisk = String(control.viewClass?.label || '').split(/\s+/).includes('asterisk');
    const choiceLabelId = multipleChoice && item.label ? `${control.id}-label` : undefined;
    const labelContents = (
        <>
            {requiredAsterisk ? <span className="dcat-modern-form-required" aria-hidden="true">*</span> : null}
            <span>{item.label}</span>
        </>
    );
    const labelFor = control.kind === 'range-pair'
        ? control.inputs?.[0]?.id
        : control.kind === 'dual-list'
            ? `${control.id}-available`
            : control.kind === 'color'
                ? `${control.id}-text`
                : control.id;
    return (
        <div
            {...item.groupProps}
            className={`${groupClassName} dcat-modern-form-field`.trim()}
            data-dcat-modern-field="native"
            data-dcat-modern-field-type={control.kind}
            data-dcat-modern-initial-error={item.initialErrors.length ? 'true' : undefined}
        >
            {item.label ? (
                multipleChoice
                    ? <div {...item.labelProps} id={choiceLabelId} className={labelClassName}>{labelContents}</div>
                    : <label {...item.labelProps} className={labelClassName} htmlFor={labelFor}>{labelContents}</label>
            ) : null}
            <div {...item.fieldProps} className={fieldClassName}>
                <NativeControl control={control} describedBy={describedBy} invalid={item.hasError} labelledBy={choiceLabelId} />
                {control.help ? <div id={helpId} className="help-block"><i className="feather icon-help-circle" aria-hidden="true" /> {control.help}</div> : null}
                <div id={errorId} className="help-block with-errors" aria-live="polite">
                    {item.initialErrors.map((error, index) => <span key={`${index}-${error}`} className="dcat-modern-form-error">{error}</span>)}
                </div>
            </div>
        </div>
    );
}

function FormItem({ item }: { item: FormItemModel }) {
    if (item.kind === 'native') return <NativeField item={item} />;
    if (item.kind === 'native-hidden') return <NativeControl control={item.control} />;
    if (item.kind === 'advanced') {
        return (
            <div className="dcat-modern-form-field dcat-modern-form-field--legacy" data-dcat-modern-legacy-field="advanced">
                <LegacyNodesIsland nodes={[item.node]} kind="form-advanced-field" />
            </div>
        );
    }
    return <LegacyNodesIsland nodes={[item.node]} kind="form-layout-island" />;
}

function FormItems({ items }: { items: FormItemModel[] }) {
    return <>{items.map((item, index) => <FormItem key={index} item={item} />)}</>;
}

function layoutColumnSpan(width: Record<string, number>): number {
    const value = width.md ?? width.sm ?? width.lg ?? width.xl ?? width.xs ?? 12;
    return Math.max(1, Math.min(12, Number(value) || 12));
}

function NativeLayout({ node }: { node: NativeLayoutModel }) {
    if (node.kind === 'field') return <FormItem item={node.item} />;
    if (node.kind === 'block') {
        return (
            <section className="dcat-modern-form-block" data-dcat-modern-form-layout="block">
                {node.title ? <div className="dcat-modern-form-block-header"><h3>{node.title}</h3></div> : null}
                <div className="dcat-modern-form-block-body"><NativeLayout node={node.content} /></div>
            </section>
        );
    }
    if (node.kind === 'tabs') {
        return (
            <Tabs
                defaultId={node.defaultId}
                onChange={(id) => {
                    const nextHash = `#${id}`;
                    if (window.location.hash !== nextHash) window.history.pushState(null, '', nextHash);
                }}
                items={node.items.map((tab) => ({
                    id: tab.id,
                    tabId: `dcat-modern-form-${tab.id}-tab`,
                    panelId: tab.id,
                    panelClassName: 'tab-pane dcat-modern-form-tab-pane',
                    label: tab.label,
                    panel: <NativeLayout node={tab.content} />,
                }))}
            />
        );
    }
    if (node.kind === 'column') {
        const span = layoutColumnSpan(node.width);
        return (
            <div
                className="dcat-modern-form-column"
                data-dcat-modern-form-layout="column"
                data-dcat-modern-form-span={span}
                style={{ '--dcat-modern-form-span': span } as React.CSSProperties}
            >
                {node.children.map((child, index) => <NativeLayout key={index} node={child} />)}
            </div>
        );
    }
    const className = node.kind === 'row' || node.kind === 'columns'
        ? 'dcat-modern-form-row'
        : 'dcat-modern-form-stack';
    return (
        <div className={className} data-dcat-modern-form-layout={node.kind}>
            {node.children.map((child, index) => <NativeLayout key={index} node={child} />)}
        </div>
    );
}

function FormSection({ section }: { section: FormSectionModel }) {
    if (section.kind === 'native-layout') return <NativeLayout node={section.tree} />;
    return <div {...section.props} className={`${section.props?.className ?? 'fields-group'} dcat-modern-form-fields`}><FormItems items={section.items} /></div>;
}

export function FormView({ model }: { model: FormModel }) {
    const viewRef = React.useRef<HTMLDivElement>(null);
    React.useLayoutEffect(() => {
        const view = viewRef.current;
        if (!view) return;
        const firstError = view.querySelector<HTMLElement>(
            '[data-dcat-modern-field="native"][data-dcat-modern-initial-error] [aria-invalid="true"]:not([type="hidden"]):not(:disabled)',
        );
        const active = document.activeElement;
        if (!firstError || (active !== document.body && active !== document.documentElement)) return;

        firstError.focus({ preventScroll: true });
        firstError.scrollIntoView?.({ block: 'center', behavior: 'auto' });
    }, []);

    if (model.compatNodes) return <LegacyNodesIsland nodes={model.compatNodes} kind="form-custom-view" />;

    const view = (
        <div {...model.surfaceProps} ref={viewRef} className={`${model.surfaceProps?.className ?? ''} dcat-modern-form-view`.trim()} data-dcat-modern-form-renderer="react-layout">
            {model.headerNodes.length ? <LegacyNodesIsland nodes={model.headerNodes} kind="form-header" /> : null}
            <div {...model.bodyProps} className={`${model.bodyProps?.className ?? 'box-body'} dcat-modern-form-body`}>
                {model.sections.map((section, index) => <FormSection key={index} section={section} />)}
            </div>
            {model.footerNodes.length ? <LegacyNodesIsland nodes={model.footerNodes} kind="form-footer" /> : null}
            {model.hiddenNodes.length ? <LegacyNodesIsland nodes={model.hiddenNodes} kind="form-hidden" hidden /> : null}
        </div>
    );
    return (model.layoutWrappers ?? []).reduceRight<React.ReactNode>((children, props, index) => <div key={index} {...props}>{children}</div>, view);
}
