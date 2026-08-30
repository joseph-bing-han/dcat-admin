<?php

namespace Dcat\Admin\Layout;

use Closure;
use Dcat\Admin\Admin;
use Dcat\Admin\Support\Helper;
use Illuminate\Support\Facades\Lang;

class Menu
{
    const DEFAULT_VIEW = 'admin::partials.menu';

    protected static $helperNodes = [
        [
            'id'        => 1,
            'title'     => 'Helpers',
            'icon'      => 'fa fa-keyboard-o',
            'uri'       => '',
            'parent_id' => 0,
        ],
        [
            'id'        => 2,
            'title'     => 'Extensions',
            'icon'      => '',
            'uri'       => 'auth/extensions',
            'parent_id' => 1,
        ],
        [
            'id'        => 3,
            'title'     => 'Scaffold',
            'icon'      => '',
            'uri'       => 'helpers/scaffold',
            'parent_id' => 1,
        ],
        [
            'id'        => 4,
            'title'     => 'Icons',
            'icon'      => '',
            'uri'       => 'helpers/icons',
            'parent_id' => 1,
        ],
    ];

    protected $view = self::DEFAULT_VIEW;

    // 保留回调身份和原始节点，让同一份 section 同时支持 HTML 与结构化渲染。
    protected $nodeSections = [];

    public function register()
    {
        if (! admin_has_default_section(Admin::SECTION['LEFT_SIDEBAR_MENU'])) {
            admin_inject_default_section(Admin::SECTION['LEFT_SIDEBAR_MENU'], function () {
                $menuModel = config('admin.database.menu_model');

                return $this->toHtml((new $menuModel())->allNodes()->toArray());
            });
        }

        if (config('app.debug') && config('admin.helpers.enable', true)) {
            $this->add(static::$helperNodes, 20);
        }
    }

    /**
     * 增加菜单节点.
     *
     * @param  array  $nodes
     * @param  int  $priority
     * @return void
     */
    public function add(array $nodes = [], int $priority = 10)
    {
        $render = function () use ($nodes) {
            return $this->toHtml($nodes);
        };
        $this->nodeSections[spl_object_id($render)] = ['render' => $render, 'nodes' => $nodes];

        admin_inject_section(Admin::SECTION['LEFT_SIDEBAR_MENU_BOTTOM'], $render, true, $priority);
    }

    /**
     * 转化为HTML.
     *
     * @param  array  $nodes
     * @return string
     *
     * @throws \Throwable
     */
    public function toHtml($nodes)
    {
        $html = '';

        foreach (Helper::buildNestedArray($nodes) as $item) {
            $html .= $this->render($item);
        }

        return $html;
    }

    /**
     * 设置菜单视图.
     *
     * @param  string  $view
     * @return $this
     */
    public function view(string $view)
    {
        $this->view = $view;

        return $this;
    }

    /**
     * 渲染视图.
     *
     * @param  array  $item
     * @return string
     */
    public function render($item)
    {
        return view($this->view, ['item' => &$item, 'builder' => $this])->render();
    }

    /**
     * 判断是否选中.
     *
     * @param  array  $item
     * @param  null|string  $path
     * @return bool
     */
    public function isActive($item, ?string $path = null)
    {
        if (empty($path)) {
            $path = request()->path();
        }

        if (empty($item['children'])) {
            if (empty($item['uri'])) {
                return false;
            }

            return trim($this->getPath($item['uri']), '/') == $path;
        }

        foreach ($item['children'] as $v) {
            if ($path == trim($this->getPath($v['uri']), '/')) {
                return true;
            }
            if (! empty($v['children'])) {
                if ($this->isActive($v, $path)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * 判断节点是否可见.
     *
     * @param  array  $item
     * @return bool
     */
    public function visible($item)
    {
        if (
            ! $this->checkPermission($item)
            || ! $this->checkExtension($item)
            || ! $this->userCanSeeMenu($item)
        ) {
            return false;
        }

        $show = $item['show'] ?? null;
        if ($show !== null && ! $show) {
            return false;
        }

        return true;
    }

    /**
     * 判断扩展是否启用.
     *
     * @param $item
     * @return bool
     */
    protected function checkExtension($item)
    {
        $extension = $item['extension'] ?? null;

        if (! $extension) {
            return true;
        }

        if (! $extension = Admin::extension($extension)) {
            return false;
        }

        return $extension->enabled();
    }

    /**
     * 判断用户.
     *
     * @param  array|\Dcat\Admin\Models\Menu  $item
     * @return bool
     */
    protected function userCanSeeMenu($item)
    {
        $user = Admin::user();

        if (! $user || ! method_exists($user, 'canSeeMenu')) {
            return true;
        }

        return $user->canSeeMenu($item);
    }

    /**
     * 判断权限.
     *
     * @param $item
     * @return bool
     */
    protected function checkPermission($item)
    {
        $permissionIds = $item['permission_id'] ?? null;
        $roles = array_column(Helper::array($item['roles'] ?? []), 'slug');
        $permissions = array_column(Helper::array($item['permissions'] ?? []), 'slug');

        if (! $permissionIds && ! $roles && ! $permissions) {
            return true;
        }

        $user = Admin::user();

        if (! $user || $user->visible($roles)) {
            return true;
        }

        foreach (array_merge(Helper::array($permissionIds), $permissions) as $permission) {
            if ($user->can($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  string  $text
     * @return string
     */
    public function translate($text)
    {
        $titleTranslation = 'menu.titles.'.trim(str_replace(' ', '_', strtolower($text)));

        if (Lang::has($titleTranslation)) {
            return __($titleTranslation);
        }

        return $text;
    }

    /**
     * @param  string  $uri
     * @return string
     */
    public function getPath($uri)
    {
        return $uri
            ? (url()->isValidUrl($uri) ? $uri : admin_base_path($uri))
            : $uri;
    }

    /**
     * @param  string  $uri
     * @return string
     */
    public function getUrl($uri)
    {
        return $uri ? admin_url($uri) : $uri;
    }

    /**
     * 判断当前菜单是否可结构化渲染，任意自定义 section/view 仍保留为内容岛。
     *
     * @return bool
     */
    public function supportsModern()
    {
        if ($this->view !== static::DEFAULT_VIEW) {
            return false;
        }

        $sections = Admin::section();
        foreach ([
            Admin::SECTION['LEFT_SIDEBAR_MENU'],
            Admin::SECTION['LEFT_SIDEBAR_MENU_TOP'],
        ] as $section) {
            if ($sections->hasSection($section)) {
                return false;
            }
        }

        foreach ($sections->getSections(Admin::SECTION['LEFT_SIDEBAR_MENU_BOTTOM']) as $section) {
            $render = $section['value'];
            if (! $render instanceof Closure || ! isset($this->nodeSections[spl_object_id($render)])) {
                return false;
            }
        }

        return true;
    }

    /**
     * 按 section 的实际优先级组装经过权限过滤的菜单，拒绝有损转换自定义 HTML。
     *
     * @return array|null
     */
    public function modernPayload()
    {
        if (! $this->supportsModern()) {
            return;
        }

        $menuModel = config('admin.database.menu_model');
        if (! $menuModel || ! class_exists($menuModel)) {
            return;
        }

        $nodes = (new $menuModel())->allNodes()->toArray();
        $items = $this->normalizeModernItems(Helper::buildNestedArray($nodes));
        if ($items === null) {
            return;
        }

        foreach (Admin::section()->getSections(Admin::SECTION['LEFT_SIDEBAR_MENU_BOTTOM']) as $section) {
            $nodes = $this->nodeSections[spl_object_id($section['value'])]['nodes'];
            // 各批节点独立建树，避免数据库、Helpers 与应用菜单的重复 ID 串组。
            $appended = $this->normalizeModernItems(Helper::buildNestedArray($nodes));
            if ($appended === null) {
                return;
            }
            $items = array_merge($items, $appended);
        }

        return [
            'horizontal' => (bool) config('admin.layout.horizontal_menu'),
            'defaultIcon' => config('admin.menu.default_icon', 'feather icon-circle'),
            'items' => $items,
        ];
    }

    /**
     * @param  array  $nodes
     * @return array|null
     */
    protected function normalizeModernItems(array $nodes)
    {
        $result = [];

        foreach ($nodes as $item) {
            if (! $this->visible($item)) {
                continue;
            }

            $title = $this->plainModernText($this->translate($item['title'] ?? ''));
            if ($title === null) {
                return;
            }

            $icon = (string) ($item['icon'] ?? '');
            if ($icon && ! preg_match('/^[A-Za-z0-9 _:\-]+$/', $icon)) {
                return;
            }

            $children = $this->normalizeModernItems((array) ($item['children'] ?? []));
            if ($children === null) {
                return;
            }

            $uri = (string) ($item['uri'] ?? '');
            $result[] = [
                'id' => isset($item['id']) ? (string) $item['id'] : '',
                'title' => $title,
                'icon' => $icon,
                'url' => $uri ? $this->getUrl($uri) : '',
                'external' => $uri && mb_strpos($uri, '://') !== false,
                'active' => $this->isActive($item),
                'children' => $children,
            ];
        }

        return $result;
    }

    /**
     * @param  mixed  $value
     * @return string|null
     */
    protected function plainModernText($value)
    {
        if (! is_scalar($value) && $value !== null) {
            return;
        }

        $value = (string) $value;
        if ($value !== strip_tags($value)) {
            return;
        }

        return html_entity_decode($value, ENT_QUOTES, 'UTF-8');
    }
}
