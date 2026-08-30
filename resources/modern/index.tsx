import './runtime';
import './tokens.css';
import './compat-facade.css';
import './compat-utilities.css';
import './styles.css';
import { bridge, registerCoreCapability } from './bridge';
import { coreCapabilities } from './adapters';
import { overlayStore } from './store';

window.addEventListener('dcat:notice', (event) => {
    const detail = (event as CustomEvent<{ tone?: string; message?: string }>).detail || {};
    const tone = ['success', 'warning', 'danger'].includes(detail.tone || '') ? detail.tone as 'success' | 'warning' | 'danger' : 'neutral';
    overlayStore.notify(detail.message || '', tone);
});

coreCapabilities.forEach((capability) => registerCoreCapability(capability));

if (window.DcatReact && window.DcatReact !== bridge) {
    window.dispatchEvent(new CustomEvent('dcat:modern:telemetry', {
        detail: { code: 'BRIDGE_NAMESPACE_COLLISION' },
    }));
} else {
    window.DcatReact = bridge;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => bridge.start(), { once: true });
    } else {
        bridge.start();
    }
}

// 只暴露有文档的 window.DcatReact 桥接面，components 内部实现不再作为 IIFE 全局导出。
export { bridge };
export * from './types';
