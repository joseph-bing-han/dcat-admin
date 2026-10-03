import React, { type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, useState } from 'react';
import { InputBase } from './ui/components/base/input/input';
import { TextAreaBase } from './ui/components/base/textarea/textarea';
import { NativeSelect } from './ui/components/base/select/select-native';
import { CheckboxBase } from './ui/components/base/checkbox/checkbox';
import { RadioButtonBase } from './ui/components/base/radio-buttons/radio-buttons';
import { ToggleBase } from './ui/components/base/toggle/toggle';

// 服务端原生属性留在实际控件上，上游组件承担视觉，不改变表单序列化。
export function Input({ className, disabled, required, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return <InputBase {...props} data-dcat-ui-control="input" groupRef={(node) => {
        if (!node) return;
        // 显式输入宽度必须约束上游容器，否则 affix 被 w-full 推到行尾。
        node.style.width = props.style?.width != null ? String(typeof props.style.width === 'number' ? `${props.style.width}px` : props.style.width) : '';
        node.style.maxWidth = props.style?.width != null ? '100%' : '';
        node.style.flex = props.style?.flex != null ? String(props.style.flex) : '';
    }} style={props.style?.width != null ? { ...props.style, width: '100%', flex: undefined } : props.style} wrapperClassName="dcat-modern-upstream-input" size="sm" inputClassName={className} disabled={disabled} isDisabled={disabled} isRequired={required} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <TextAreaBase {...props} data-dcat-ui-control="textarea" size="sm" />;
}

export function Select({ children, className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    const options = React.Children.toArray(children);
    // 多选列表与 optgroup 不在上游 NativeSelect 协议内，保留原生语义并使用主题工具类。
    if (props.multiple || options.some((child) => React.isValidElement(child) && child.type !== 'option')) {
        return <select {...props} data-dcat-ui-control="select" className={`w-full rounded-lg bg-primary px-3 py-2 text-sm text-primary ring-1 ring-primary focus-visible:ring-2 focus-visible:ring-brand ${className ?? ''}`}>{children}</select>;
    }
    return <div className="contents" ref={(wrapper) => {
        const node = wrapper?.querySelector('select');
        if (!node) return;
        // 上游会覆盖 id 和 ARIA 并忽略 option.disabled，恢复 Dcat 的公共契约。
        node.setAttribute('data-dcat-ui-control', 'select');
        if (props.id) node.id = props.id;
        for (const attribute of ['aria-describedby', 'aria-labelledby', 'aria-label'] as const) {
            const value = props[attribute];
            if (value) node.setAttribute(attribute, value);
            else node.removeAttribute(attribute);
        }
        options.forEach((option, index) => {
            if (React.isValidElement(option) && node.options[index]) node.options[index].disabled = Boolean((option.props as { disabled?: boolean }).disabled);
        });
    }}><NativeSelect {...props} size="sm" selectClassName={className} options={options.filter(React.isValidElement).map((option) => {
        const attributes = option.props as { value?: string; children?: React.ReactNode; disabled?: boolean };
        return { value: String(attributes.value ?? ''), label: String(attributes.children ?? ''), disabled: attributes.disabled };
    })} /></div>;
}

interface ChoiceProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: React.ReactNode;
    kind?: 'checkbox' | 'radio' | 'switch';
}

export function Choice({ label, kind = 'checkbox', defaultChecked, checked, onChange, onFocus, onBlur, disabled, className, ...props }: ChoiceProps) {
    const input = React.useRef<HTMLInputElement>(null);
    const [selected, setSelected] = useState(Boolean(defaultChecked));
    React.useEffect(() => {
        const node = input.current;
        if (!node) return;
        const form = node.form;
        const sync = () => setSelected(node.checked);
        const reset = () => queueMicrotask(sync);
        node.ownerDocument.addEventListener('change', sync);
        form?.addEventListener('reset', reset);
        return () => { node.ownerDocument.removeEventListener('change', sync); form?.removeEventListener('reset', reset); };
    }, []);
    const [focusVisible, setFocusVisible] = useState(false);
    const active = checked ?? selected;
    const visualProps = { isSelected: active, isDisabled: disabled, isFocusVisible: focusVisible };
    return <label htmlFor={props.id} className={`relative inline-flex items-center gap-2 text-sm text-secondary ${className ?? ''}`}>
        <input {...props} ref={input} type={kind === 'radio' ? 'radio' : 'checkbox'} role={kind === 'switch' ? 'switch' : undefined} className="sr-only" disabled={disabled} checked={checked} defaultChecked={checked == null ? defaultChecked : undefined}
            onFocus={(event) => { setFocusVisible(true); onFocus?.(event); }} onBlur={(event) => { setFocusVisible(false); onBlur?.(event); }} onChange={(event) => { setSelected(event.currentTarget.checked); onChange?.(event); }} />
        {kind === 'switch' ? <ToggleBase {...visualProps} /> : kind === 'radio' ? <RadioButtonBase {...visualProps} /> : <CheckboxBase {...visualProps} />}
        {label ? <span>{label}</span> : null}
    </label>;
}
