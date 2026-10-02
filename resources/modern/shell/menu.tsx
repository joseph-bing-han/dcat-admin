/*
 * 侧栏菜单：把 Dcat 的菜单 payload 渲染成 Untitled UI React `app-navigation` 的行组件（Epic 002 / S3）。
 *
 * 为什么这里不是 `ui/` 下的文件：`resources/modern/ui/` 必须逐文件等于上游（provenance 记录 sha256），
 * Dcat 侧的适配放在本目录。行组件本身来自上游 `NavItemBase`，本文件只负责数据映射、分组披露与品牌状态色。
 *
 * 与上游 `SidebarNavigationSimple` 的差异（有意）：上游侧栏固定 280px、无折叠图标态、无水平菜单；
 * Dcat 必须保留 260px / 5.4rem 折叠 / 水平菜单，因此容器仍由 Dcat 的 shell 控制，只复用行与列表结构。
 */
import { type FC, type HTMLAttributes, useState } from 'react';
import { RouterProvider } from 'react-aria-components';
import { NavItemBase } from '@/components/application/app-navigation/base-components/nav-item';
import { navigation, type NavigationHost } from '../navigation';
import { dismissSidebarPreview } from '../runtime';

export interface ShellMenuNode {
    id: string;
    title: string;
    icon: string;
    url: string;
    external: boolean;
    active: boolean;
    children: ShellMenuNode[];
}

export interface ShellMenuPayload {
    horizontal: boolean;
    defaultIcon: string;
    items: ShellMenuNode[];
}

/*
 * Dcat 的菜单图标是图标字体类名（font-awesome / feather），上游 `NavItemBase` 期望传入一个图标组件。
 * 这里把类名包装成组件；尺寸与颜色对齐上游图标（20px、fg-quaternary），保证行高与对齐一致。
 */
export function MenuIcon({ iconClass, className = '' }: { iconClass: string; className?: string }) {
    const classes = iconClass.trim().split(/\s+/);
    const isCircle = !iconClass.trim() || classes.includes('icon-circle');
    // 默认图标不依赖字体字形，避免字体未加载时出现方块；兼容仅配置 fa-* 的菜单。
    const fontClass = isCircle ? '' : `${classes.some((value) => value.startsWith('fa-')) ? 'fa ' : ''}${iconClass}`;
    return (
        <i aria-hidden="true" className={`${fontClass} ${className}`}>
            {isCircle && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block align-middle"><circle cx="12" cy="12" r="8" /></svg>}
        </i>
    );
}

function createMenuIcon(iconClass: string): FC<HTMLAttributes<HTMLOrSVGElement>> {
    const Icon: FC<HTMLAttributes<HTMLOrSVGElement>> = () => (
        <MenuIcon iconClass={iconClass} className="mr-2 h-5 w-5 shrink-0 text-center text-base leading-5 text-fg-quaternary" />
    );
    return Icon;
}

function iconClassFor(item: ShellMenuNode, defaultIcon: string): string {
    return item.icon || defaultIcon;
}

function ShellMenuLeaf({ item, defaultIcon }: { item: ShellMenuNode; defaultIcon: string }) {
    let href = item.url;
    // 上游组件把 http 地址一律视为外链；同源站内菜单改为路径，避免新窗口和外链图标。
    if (!item.external && /^https?:\/\//i.test(href)) {
        const url = new URL(href);
        if (url.origin === window.location.origin) {
            href = `${url.pathname}${url.search}${url.hash}`;
        }
    }
    return (
        <li className="nav-item py-px" data-id={item.id} data-dcat-menu-leaf="1" ref={(node) => {
            const link = node?.querySelector('a');
            if (!link) return;
            // 折叠侧栏隐藏可见文本时仍保留名称；外链契约由适配层恢复。
            link.setAttribute('aria-label', item.title);
            link.target = item.external ? '_blank' : '_self';
            if (item.external) link.rel = 'noopener noreferrer';
            else link.removeAttribute('rel');
        }}>
            <NavItemBase
                type="link"
                href={href}
                current={item.active}
                icon={createMenuIcon(iconClassFor(item, defaultIcon))}
                truncate={false}
                onClick={dismissSidebarPreview}
            >
                {item.title}
            </NavItemBase>
        </li>
    );
}

/*
 * 分组行使用原生 <details>/<summary>：与上游 `NavList` 相同，展开状态是浏览器原生披露语义
 * （summary 自带 expanded 状态，Enter/Space 均可切换），因此不需要额外的 aria-expanded 锚点。
 */
function ShellMenuGroup({ item, defaultIcon }: { item: ShellMenuNode; defaultIcon: string }) {
    const [open, setOpen] = useState(item.active);

    return (
        <li className="nav-item py-px" data-id={item.id} data-dcat-menu-group="1" ref={(node) => {
            node?.querySelector('summary')?.setAttribute('aria-label', item.title);
        }}>
            <details
                className="dcat-shell-menu-group"
                open={open}
                onToggle={(event) => setOpen(event.currentTarget.open)}
            >
                {/*
                 * 展开状态由 React 控制：summary 的点击默认行为会被取消，避免与受控 open 状态相互抵消；
                 * onToggle 仍保留，用于兜住浏览器的原生披露路径（例如 Enter 触发的原生 toggle）。
                 */}
                <NavItemBase
                    type="collapsible"
                    icon={createMenuIcon(iconClassFor(item, defaultIcon))}
                    truncate={false}
                    onClick={(event) => {
                        event.preventDefault();
                        setOpen((current) => !current);
                    }}
                >
                    {item.title}
                </NavItemBase>
                <dd className="m-0">
                    <ul className="dcat-shell-menu-subtree ml-4 flex flex-col border-l border-secondary pl-2">
                        {/* Dcat 允许不同分组复用同一个数据库 id，因此 key 必须带兄弟位置。 */}
                        {item.children.map((child, index) => (
                            <ShellMenuRow key={`${child.id}-${index}`} item={child} defaultIcon={defaultIcon} />
                        ))}
                    </ul>
                </dd>
            </details>
        </li>
    );
}

function ShellMenuRow({ item, defaultIcon }: { item: ShellMenuNode; defaultIcon: string }) {
    return item.children.length > 0
        ? <ShellMenuGroup item={item} defaultIcon={defaultIcon} />
        : <ShellMenuLeaf item={item} defaultIcon={defaultIcon} />;
}

/*
 * 垂直侧栏菜单。上游 `NavList` 只支持两级且以 label 作 key；Dcat 的菜单是任意深度且
 * 分组与叶子可能复用数据库 id，因此这里保留 Dcat 自己的递归，行组件仍用上游 `NavItemBase`。
 */
export function ShellMenu({ payload }: { payload: ShellMenuPayload }) {
    return (
        // AriaLink 阻止点击冒泡，通过官方路由入口复用 PJAX，避免完整重载丢失侧栏状态。
        <RouterProvider navigate={(href) => {
            const dcat = (window as unknown as { Dcat?: NavigationHost }).Dcat;
            if (dcat) void navigation.navigate(dcat, href);
            else window.location.assign(href);
        }}>
            <ul className="dcat-shell-menu nav-sidebar flex flex-col px-2 pt-3 pb-2">
                {payload.items.map((item, index) => (
                    <ShellMenuRow key={`${item.id}-${index}`} item={item} defaultIcon={payload.defaultIcon} />
                ))}
            </ul>
        </RouterProvider>
    );
}
