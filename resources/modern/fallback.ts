import './runtime';
import './compat';
import './tailwind.css';
import './compat-preflight-restore.css';
import './tokens.css';
import './compat-facade.css';
import './compat-utilities.css';
import './styles.css';

// renderer 相同时保留 PJAX；renderer 变化时由导航 runtime 完整加载目标文档。
function activateCompat() {
    document.documentElement.classList.add('dcat-modern-root');
    document.body.classList.add('dcat-modern-active');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', activateCompat, { once: true });
else activateCompat();
document.addEventListener('dcat:pjax:loaded', activateCompat);

// 候选入口不挂载 React 通知宿主，但仍须展示旧表单的成功与错误反馈。
window.addEventListener('dcat:notice', (event) => {
    const { tone, message } = (event as CustomEvent<{ tone: string; message: string }>).detail;
    let region = document.querySelector<HTMLElement>('[data-dcat-compat-notices]');
    if (!region) {
        region = document.createElement('div');
        region.className = 'dcat-modern-toasts';
        region.dataset.dcatCompatNotices = '';
        region.setAttribute('aria-label', 'Notifications');
        region.setAttribute('role', 'region');
        document.body.appendChild(region);
    }
    const notice = document.createElement('div');
    notice.className = `dcat-modern-toast dcat-modern-toast--${['success', 'warning', 'danger'].includes(tone) ? tone : 'neutral'}`;
    notice.setAttribute('role', tone === 'danger' ? 'alert' : 'status');
    const text = document.createElement('span');
    text.textContent = message;
    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Dismiss notification');
    close.textContent = '×';
    close.addEventListener('click', () => notice.remove(), { once: true });
    notice.append(text, close);
    region.appendChild(notice);
});
