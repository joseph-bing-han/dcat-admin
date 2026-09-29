<?php

namespace Dcat\Admin\Layout;

use Dcat\Admin\Admin;
use Dcat\Admin\Color;
use Illuminate\Support\Str;

class Asset
{
    protected $inlineCompat = false;

    protected $renderedScripts = [];

    protected $renderedStylesheets = [];

    // 保留旧自定义 Blade 的内联脚本执行时机，仅提前装载其依赖。
    public function prepareHtml(string $html)
    {
        $hasLegacyToggle = preg_match('/data-toggle\s*=\s*[\x22\x27](?:modal|dropdown|tab|pill|collapse|popover|tooltip)[\x22\x27]/i', $html);
        $hasNativeOwner = $this->isModernRequest() && $this->containsNativeModernComponent($html);
        $hasCompatDescriptor = preg_match('/data-dcat-compat\s*=/i', $html);
        $hasUnownedLegacyToggle = $this->containsUnownedLegacyToggle($html);
        if ($hasLegacyToggle && (! $hasNativeOwner || $hasCompatDescriptor || $hasUnownedLegacyToggle)) {
            $this->inlineCompat = true;
        }
        preg_match_all('/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/i', $html, $scripts, PREG_SET_ORDER);
        foreach ($scripts as $script) {
            if (preg_match('/\btype\s*=\s*[\x22\x27](?!text\/javascript|application\/javascript|module)[^\x22\x27]+/i', $script[1])) {
                continue;
            }
            if (preg_match('/\bsrc\s*=/i', $script[1]) || $this->scriptNeedsCompat($script[2])) {
                $this->inlineCompat = true;
            }
        }
    }
    /**
     * 别名.
     *
     * @var array
     */
    protected $alias = [
        // Dcat Admin静态资源路径别名
        '@admin' => 'vendor/dcat-admin',
        // Dcat Acmin扩展静态资源路径别名
        '@extension' => 'vendor/dcat-admin-extensions',

        // Dcat-owned compatibility runtime. This intentionally lives outside
        // the native modern bundle and is loaded only when a legacy plugin is
        // explicitly requested on a modern page.
        '@dcat-compat' => [
            'js' => '@admin/modern-compat/assets/dcat-modern-compat.js',
        ],

        '@adminlte' => [
            'js' => [
                '@admin/adminlte/adminlte.js',
            ],
            'css' => [
                '@admin/adminlte/adminlte.css',
            ],
        ],
        '@nunito' => [
            //'css' => 'https://fonts.googleapis.com/css?family=Nunito:200,200i,300,300i,400,400i,600,600i,800,800i,900,900i',
            'css' => '@admin/dcat/css/nunito.css',
        ],
        '@bootstrap-icons' => [
            'css' => '@admin/dcat/css/bootstrap-icons.css',
        ],
        '@dcat' => [
            'js'  => '@admin/dcat/js/dcat-app.js',
            'css' => '@admin/dcat/css/dcat-app.css',
        ],
        '@vendors' => [
            'js'  => '@admin/dcat/plugins/vendors.min.js',
            'css' => '@admin/dcat/plugins/vendors.min.css',
        ],
        '@jquery.initialize' => [
            'js' => '@admin/dcat/plugins/jquery.initialize/jquery.initialize.min.js',
        ],
        '@datatables' => [
            'css' => '@admin/dcat/plugins/tables/datatable/datatables.min.css',
        ],
        '@grid-extension' => [
            'js' => '@admin/dcat/extra/grid-extend.js',
        ],
        '@resource-selector' => [
            'js' => '@admin/dcat/extra/resource-selector.js',
        ],
        '@select-table' => [
            'js' => '@admin/dcat/extra/select-table.js',
        ],
        '@layer' => [
            'js' => '@admin/dcat/plugins/layer/layer.js',
        ],
        '@tinymce' => [
            'js' => '@admin/dcat/plugins/tinymce/tinymce.min.js',
        ],
        '@pjax' => [
            'js' => '@admin/dcat/plugins/jquery-pjax/jquery.pjax.min.js',
        ],
        '@toastr' => [
            'js'  => '@admin/dcat/plugins/extensions/toastr.min.js',
            'css' => '@admin/dcat/plugins/extensions/toastr.css',
        ],
        '@jquery.nestable' => [
            'js'  => '@admin/dcat/plugins/nestable/jquery.nestable.min.js',
            'css' => '@admin/dcat/plugins/nestable/nestable.css',
        ],
        '@validator' => [
            'js' => '@admin/dcat/plugins/bootstrap-validator/validator.min.js',
        ],
        '@select2' => [
            'js'  => [
                '@admin/dcat/plugins/select/select2.full.min.js',
                '@admin/dcat/plugins/select/i18n/{lang}.js',
            ],
            'css' => '@admin/dcat/plugins/select/select2.min.css',
        ],
        '@bootstrap-datetimepicker' => [
            'js'  => '@admin/dcat/plugins/bootstrap-datetimepicker/bootstrap-datetimepicker.min.js',
            'css' => '@admin/dcat/plugins/bootstrap-datetimepicker/bootstrap-datetimepicker.min.css',
        ],
        '@moment' => [
            'js' => [
                '@admin/dcat/plugins/moment/moment-with-locales.min.js',
            ],
        ],
        '@moment-timezone' => [
            'js' => [
                '@admin/dcat/plugins/moment-timezone/moment-timezone-with-data.min.js',
            ],
        ],
        '@jstree' => [
            'js'  => '@admin/dcat/plugins/jstree-theme/jstree.min.js',
            'css' => '@admin/dcat/plugins/jstree-theme/themes/proton/style.min.css',
        ],
        '@switchery' => [
            'js'  => '@admin/dcat/plugins/switchery/switchery.min.js',
            'css' => '@admin/dcat/plugins/switchery/switchery.min.css',
        ],
        '@webuploader' => [
            'js' => [
                '@admin/dcat/plugins/webuploader/webuploader.min.js',
                '@admin/dcat/extra/upload.js',
            ],
            'css' => '@admin/dcat/extra/upload.css',
        ],
        '@chartjs' => [
            'js' => '@admin/dcat/plugins/chart.js/chart.bundle.min.js',
        ],
        '@jquery.sparkline' => [
            'js' => '@admin/dcat/plugins/jquery.sparkline/jquery.sparkline.min.js',
        ],
        '@jquery.bootstrap-duallistbox' => [
            'js'  => '@admin/dcat/plugins/bootstrap-duallistbox/dist/jquery.bootstrap-duallistbox.min.js',
            'css' => '@admin/dcat/plugins/bootstrap-duallistbox/dist/bootstrap-duallistbox.min.css',
        ],
        '@number-input' => [
            'js' => '@admin/dcat/plugins/number-input/bootstrap-number-input.js',
        ],
        '@ionslider' => [
            'js' => [
                '@admin/dcat/plugins/ionslider/ion.rangeSlider.min.js',
            ],
            'css' => [
                '@admin/dcat/plugins/ionslider/ion.rangeSlider.css',
                '@admin/dcat/plugins/ionslider/ion.rangeSlider.skinNice.css',
            ],
        ],
        '@editor-md' => [
            'js' => [
                '@admin/dcat/plugins/editor-md/lib/raphael.min.js',
                '@admin/dcat/plugins/editor-md/lib/marked.min.js',
                '@admin/dcat/plugins/editor-md/lib/prettify.min.js',
                '@admin/dcat/plugins/editor-md/lib/underscore.min.js',
                '@admin/dcat/plugins/editor-md/lib/sequence-diagram.min.js',
                '@admin/dcat/plugins/editor-md/lib/flowchart.min.js',
                '@admin/dcat/plugins/editor-md/lib/jquery.flowchart.min.js',
                '@admin/dcat/plugins/editor-md/editormd.min.js',
            ],
            'css' => [
                '@admin/dcat/plugins/editor-md/css/editormd.preview.min.css',
                '@admin/dcat/extra/markdown.css',
            ],
        ],
        '@editor-md-form' => [
            'js' => [
                '@admin/dcat/plugins/editor-md/lib/raphael.min.js',
                '@admin/dcat/plugins/editor-md/editormd.min.js',
            ],
            'css' => [
                '@admin/dcat/plugins/editor-md/css/editormd.min.css',
            ],
        ],
        '@jquery.inputmask' => [
            'js' => '@admin/dcat/plugins/input-mask/jquery.inputmask.bundle.min.js',
        ],
        '@apex-charts' => [
            'js' => '@admin/dcat/plugins/charts/apexcharts.min.js',
        ],
        '@fontawesome-iconpicker' => [
            'js' => '@admin/dcat/plugins/fontawesome-iconpicker/dist/js/fontawesome-iconpicker.js',
            'css' => '@admin/dcat/plugins/fontawesome-iconpicker/dist/css/fontawesome-iconpicker.min.css',
        ],
        '@color' => [
            'js' => '@admin/dcat/plugins/bootstrap-colorpicker/js/bootstrap-colorpicker.min.js',
            'css' => '@admin/dcat/plugins/bootstrap-colorpicker/css/bootstrap-colorpicker.min.css',
        ],
        '@qrcode' => [
            'js' => '@admin/dcat/plugins/jquery-qrcode/dist/jquery-qrcode.min.js',
        ],
        '@sortable' => [
            'js' => '@admin/dcat/plugins/sortable/Sortable.min.js',
        ],
        '@autocomplete' => [
            'js' => '@admin/dcat/plugins/autocomplete/jquery.autocomplete.min.js',
        ],
    ];

    /**
     * js代码.
     *
     * @var array
     */
    public $script = [];

    /**
     * @var array
     */
    public $directScript = [];

    /**
     * css代码.
     *
     * @var array
     */
    public $style = [];

    /**
     * css脚本路径.
     *
     * @var array
     */
    public $css = [];

    /**
     * js脚本路径.
     *
     * @var array
     */
    public $js = [];

    /**
     * 在head标签内加载的js脚本.
     *
     * @var array
     */
    public $headerJs = [
        'vendors' => '@vendors',
        'dcat'    => '@dcat',
    ];

    /**
     * 基础css.
     *
     * @var array
     */
    public $baseCss = [
        'adminlte'    => '@adminlte',
        'vendors'     => '@vendors',
        'toastr'      => '@toastr',
        'datatables'  => '@datatables',
        'dcat'        => '@dcat',
    ];

    /**
     * 基础js.
     *
     * @var array
     */
    public $baseJs = [
        'adminlte'  => '@adminlte',
        'toastr'    => '@toastr',
        'pjax'      => '@pjax',
        'validator' => '@validator',
        'layer'     => '@layer',
        'init'      => '@jquery.initialize',
    ];

    /**
     * @var array
     */
    public $fonts = [
        '@nunito',
        '@bootstrap-icons',
    ];

    /**
     * 初始化主题样式.
     */
    protected function setUpTheme()
    {
        $color = Admin::color()->getName();

        if ($color === Color::DEFAULT_COLOR) {
            return;
        }

        $alias = [
            '@adminlte',
            '@dcat',
        ];

        foreach ($alias as $n) {
            $before = (array) $this->alias[$n]['css'];

            $this->alias[$n]['css'] = [];

            foreach ($before as $css) {
                $this->alias[$n]['css'][] = str_replace('.css', "-{$color}.css", $css);
            }
        }
    }

    /**
     * 设置或获取别名.
     *
     * @param  string|array  $name
     * @param  string|array  $value
     * @return void|array
     */
    public function alias($name, $value = null)
    {
        if (is_array($name)) {
            foreach ($name as $key => $value) {
                $this->alias($key, $value);
            }

            return;
        }

        if ($value === null) {
            return $this->getAlias($name);
        }

        if (mb_strpos($name, '@') !== 0) {
            $name = '@'.$name;
        }

        $this->alias[$name] = $value;
    }

    /**
     * 获取别名.
     *
     * @param  string  $name
     * @param  array  $params
     * @return array|string
     */
    public function getAlias($name, array $params = [])
    {
        if (mb_strpos($name, '@') !== 0) {
            $name = '@'.$name;
        }

        [$name, $query] = $this->parseParams($name);

        $assets = $this->alias[$name] ?? [];

        // 路径别名
        if (is_string($assets)) {
            return $assets;
        }

        $params += $query;

        return [
            'js' => $this->normalizeAliasPaths($assets['js'] ?? [], $params) ?: null,
            'css' => $this->normalizeAliasPaths($assets['css'] ?? [], $params) ?: null,
        ];
    }

    /**
     * @param  array  $files
     * @param  array  $params
     * @return array
     */
    protected function normalizeAliasPaths($files, array $params)
    {
        $files = (array) $files;

        foreach ($files as &$file) {
            foreach ($params as $k => $v) {
                if ($v !== '' && $v !== null) {
                    $file = str_replace("{{$k}}", $v, $file);
                }
            }
        }

        return array_filter($files, function ($file) {
            return ! mb_strpos($file, '{');
        });
    }

    /**
     * 解析参数.
     *
     * @param  string  $name
     * @return array
     */
    protected function parseParams($name)
    {
        $name = explode('?', $name);

        if (empty($name[1])) {
            return [$name[0], []];
        }

        parse_str($name[1], $params);

        return [$name[0], $params];
    }

    /**
     * 根据别名设置需要载入的js和css脚本.
     *
     * @param  string|array  $alias
     * @param  array  $params
     * @return void
     */
    public function require($alias, array $params = [])
    {
        if (is_array($alias)) {
            foreach ($alias as $v) {
                $this->require($v, $params);
            }

            return;
        }

        $assets = $this->getAlias($alias, $params);

        $this->js($assets['js']);
        $this->css($assets['css']);
    }

    /**
     * 设置需要载入的css脚本.
     *
     * @param  string|array  $css
     */
    public function css($css)
    {
        if (! $css) {
            return;
        }
        $this->css = array_merge(
            $this->css,
            (array) $css
        );
    }

    /**
     * 设置需要载入的基础css脚本.
     *
     * @param  array  $css
     */
    public function baseCss(array $css, bool $merge = false)
    {
        if ($merge) {
            $this->baseCss = array_merge($this->baseCss, $css);
        } else {
            $this->baseCss = $css;
        }
    }

    /**
     * 设置需要载入的js脚本.
     *
     * @param  string|array  $js
     */
    public function js($js)
    {
        if (! $js) {
            return;
        }

        $files = (array) $js;

        // Most historical field/grid/widget classes register their assets via
        // Admin::js() rather than Admin::requireAssets(). On a modern request
        // those scripts must still see the opt-in jQuery compatibility runtime
        // before they execute; the native shell itself remains jQuery-free.
        if ($this->isModernRequest() && $this->containsLegacyJavascript($files)) {
            $compat = $this->getAlias('@dcat-compat');
            $this->js = array_merge($this->js, (array) ($compat['js'] ?? []));
        }

        $this->js = array_merge($this->js, $files);
    }

    protected function containsLegacyJavascript(array $files)
    {
        foreach ($files as $file) {
            $file = (string) $file;
            // 已知原生资源不需要 jQuery；未声明的旧脚本保持兼容加载语义。
            if ($file !== ''
                && mb_strpos($file, '/modern/') === false
                && mb_strpos($file, 'modern-compat/') === false
                && ! $this->isModernFacadeSourcePath($file)
                && ! $this->isNativeModernJavascript($file)
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * 根据别名获取资源路径.
     *
     * @param  string  $path
     * @param  string  $type
     * @return string|array|null
     */
    public function get($path, string $type = 'js')
    {
        if (empty($this->alias[$path])) {
            return $this->url($path);
        }

        $paths = isset($this->alias[$path][$type]) ? (array) $this->alias[$path][$type] : null;

        if (! $paths) {
            return $paths;
        }

        foreach ($paths as &$value) {
            $value = $this->url($value);
        }

        return array_values(array_filter($paths, function ($value) {
            return $value !== null && $value !== '';
        })) ?: null;
    }

    /**
     * 获取静态资源完整URL.
     *
     * @param  string  $path
     * @return string
     */
    public function url($path)
    {
        if (! $path) {
            return $path;
        }

        $path = $this->getRealPath($path);

        if (! $path) {
            return $path;
        }

        if (mb_strpos($path, '//') === false) {
            $path = config('admin.assets_server').'/'.trim($path, '/');
        }

        return (config('admin.https') || config('admin.secure')) ? secure_asset($path) : asset($path);
    }

    /**
     * 获取真实路径.
     *
     * @param  string|null  $path
     * @return string|null
     */
    public function getRealPath(?string $path)
    {
        if ($path === '@dcat-compat' && Admin::modern()->usesCompatRenderer()) {
            return null;
        }
        $facadePath = $this->modernFacadePath($path);
        if ($facadePath !== $path) {
            return $facadePath ? $this->getRealPath($facadePath) : null;
        }

        if (! $this->containsAlias($path)) {
            return $path;
        }

        return implode(
            '/',
            array_map(
                function ($v) {
                    if (! $this->isPathAlias($v)) {
                        return $v;
                    }

                    return $this->getRealPath($this->alias($v));
                },
                explode('/', $path)
            )
        );
    }

    /**
     * 判断是否是路径别名.
     *
     * @param  mixed  $value
     * @return bool
     */
    public function isPathAlias($value)
    {
        return $this->hasAlias($value) && is_string($this->alias[$value]);
    }

    /**
     * 判断别名是否存在.
     *
     * @param $value
     * @return bool
     */
    public function hasAlias($value)
    {
        return isset($this->alias[$value]);
    }

    /**
     * 判断是否含有别名.
     *
     * @param  string  $value
     * @return bool
     */
    protected function containsAlias($value)
    {
        return $value && mb_strpos($value, '@') === 0;
    }

    /**
     * 设置在head标签内加载的js.
     *
     * @param  string|array  $js
     */
    public function headerJs($js, bool $merge = true)
    {
        if ($merge) {
            $this->headerJs = $js ? array_merge($this->headerJs, (array) $js) : $this->headerJs;
        } else {
            $this->headerJs = (array) $js;
        }
    }

    /**
     * 设置基础js脚本.
     *
     * @param  array  $js
     * @param  bool  $merge
     */
    public function baseJs(array $js, bool $merge = true)
    {
        if ($merge) {
            $this->baseJs = array_merge($this->baseJs, $js);
        } else {
            $this->baseJs = $js;
        }
    }

    /**
     * 设置js代码.
     *
     * @param  string|array  $script
     * @param  bool  $direct
     */
    public function script($script, bool $direct = false)
    {
        if (! $script) {
            return;
        }
        if ($direct) {
            $this->directScript = array_merge($this->directScript, (array) $script);
        } else {
            $this->script = array_merge($this->script, (array) $script);
        }
    }

    /**
     * 设置css代码.
     *
     * @param  string  $style
     */
    public function style($style)
    {
        if (! $style) {
            return;
        }
        $this->style = array_merge($this->style, (array) $style);
    }

    /**
     * 字体css脚本路径.
     */
    protected function addFontCss()
    {
        $this->fonts && ($this->baseCss = array_merge(
            $this->baseCss,
            (array) $this->fonts
        ));
    }

    protected function isPjax()
    {
        return request()->pjax();
    }

    protected function isModernRequest()
    {
        // 新版渲染器是唯一渲染器：页面始终由 modern 层接管（native 或 compat），
        // 不再回落到旧版 Bootstrap/AdminLTE 基础资源。
        return true;
    }

    protected function containsNativeModernComponent(string $html)
    {
        return (bool) preg_match('/data-dcat-react-component\s*=\s*[\x22\x27](?:layout\.(?:navigation|menu|header|navbar|footer|full-page)|grid\.(?:read|interactions)|form\.(?:basic|advanced)|show\.detail|tree\.page|widget\.surface|system\.page)[\x22\x27]/i', $html);
    }

    protected function containsUnownedLegacyToggle(string $html)
    {
        $html = preg_replace('/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/i', '', $html);
        preg_match_all('/<[a-z][^>]*\bdata-toggle\s*=\s*([\x22\x27])(?:modal|dropdown|tab|pill|collapse|popover|tooltip)\1[^>]*>/i', $html, $toggles);

        foreach ($toggles[0] as $toggle) {
            if (! preg_match('/\bdata-dcat-modern-owned-toggle\s*=\s*[\x22\x27]1[\x22\x27]/i', $toggle)) {
                return true;
            }
        }

        return false;
    }

    protected function modernFacadePath(?string $path)
    {
        if (Admin::modern()->usesCompatRenderer() && $path === '@admin/modern-compat/assets/dcat-modern-compat.js') {
            return null;
        }
        if (! $path || ! $this->isModernFacadeSourcePath($path) || ! $this->isModernRequest()) {
            return $path;
        }

        $path = preg_split('/\?/', $path, 2)[0];

        if (Admin::modern()->usesCompatRenderer()) {
            return null;
        }

        if (strtolower(pathinfo($path, PATHINFO_EXTENSION)) === 'js') {
            return '@admin/modern-compat/assets/dcat-modern-compat.js';
        }

        $assets = Admin::modern()->manifest()->assets();
        $css = $assets['css'][0] ?? null;
        if (! $css) {
            return null;
        }

        return '@admin/modern/'.ltrim($css, '/');
    }

    protected function isModernFacadeSource(string $path)
    {
        $path = str_replace('\\', '/', $path);
        $path = ltrim($path, '/');

        if (mb_strpos($path, '@admin/') === 0) {
            $path = substr($path, strlen('@admin/'));
        } elseif (mb_strpos($path, 'vendor/dcat-admin/') === 0) {
            $path = substr($path, strlen('vendor/dcat-admin/'));
        }

        return in_array($path, [
            'adminlte/adminlte.js',
            'adminlte/adminlte.css',
            'adminlte/adminlte-blue.css',
            'adminlte/adminlte-blue-light.css',
            'adminlte/adminlte-green.css',
            'dcat/plugins/vendors.min.css',
            'dcat/plugins/vendors-rtl.min.css',
            'dcat/plugins/vendors.min.js',
            'dcat/js/dcat-app.js',
            'dcat/css/dcat-app.css',
            'dcat/css/dcat-app-blue.css',
            'dcat/css/dcat-app-blue-light.css',
            'dcat/css/dcat-app-green.css',
        ], true);
    }

    protected function isModernFacadeSourcePath(string $path)
    {
        $source = preg_split('/\?/', $path, 2)[0];

        return $this->isModernFacadeSource($source);
    }

    protected function isNativeModernJavascript(string $path)
    {
        if (in_array($path, ['@dcat-compat', 'dcat-compat', '@sortable', '@apex-charts', '@moment', '@moment-timezone', '@tinymce'], true)) {
            return true;
        }

        $path = str_replace('\\', '/', preg_split('/\?/', $path, 2)[0]);
        $path = ltrim($path, '/');

        if (mb_strpos($path, '@admin/') === 0) {
            $path = substr($path, strlen('@admin/'));
        } elseif (mb_strpos($path, 'vendor/dcat-admin/') === 0) {
            $path = substr($path, strlen('vendor/dcat-admin/'));
        }

        // 这些第一方资源由对应 compat adapter 管理，无需再加载通用运行时。
        return in_array($path, [
            'dcat/plugins/sortable/Sortable.min.js',
            'dcat/plugins/charts/apexcharts.min.js',
            'dcat/plugins/moment/moment-with-locales.min.js',
            'dcat/plugins/moment-timezone/moment-timezone-with-data.min.js',
            'dcat/plugins/tinymce/tinymce.min.js',
        ], true);
    }

    protected function needsCompatRuntime()
    {
        $scripts = implode("\n", array_merge($this->script, $this->directScript));

        return $this->inlineCompat || $this->scriptNeedsCompat($scripts);
    }

    protected function scriptNeedsCompat(string $script)
    {
        return (bool) preg_match('/(?:\$\s*\(|\bjQuery\b|\.modal\s*\(|\.dropdown\s*\(|\.popover\s*\(|\.tooltip\s*\(|\.validator\s*\(|\.form\s*\(|Dcat\.(?:Slider|Form|DialogForm|RowSelector)|Dcat\.helpers\.(?:asyncRender|loadFields))/m', $script);
    }

    /**
     * 合并基础css脚本.
     */
    protected function mergeBaseCss()
    {
        if ($this->isPjax()) {
            return;
        }

        if ($this->isModernRequest()) {
            $this->css = array_merge((array) $this->fonts, [
                '@admin/fonts/feather/iconfont.css',
                '@admin/fonts/font-awesome/css/font-awesome.css',
            ], $this->css);
            return;
        }

        $this->addFontCss();

        $this->css = array_merge($this->baseCss, $this->css);
    }

    /**
     * @return string
     */
    public function cssToHtml()
    {
        $this->setUpTheme();

        $this->mergeBaseCss();

        $html = '';
        $preloadedModernStyles = [];
        if ($this->isModernRequest()) {
            $assets = Admin::modern()->manifest()->assets();
            foreach ((array) ($assets['css'] ?? []) as $css) {
                $url = $this->url('@admin/modern/'.ltrim($css, '/'));
                if ($url) {
                    $preloadedModernStyles[$url] = true;
                }
            }
        }

        foreach (array_unique($this->css) as &$v) {
            if (! $paths = $this->get($v, 'css')) {
                continue;
            }

            foreach ((array) $paths as $path) {
                if (! $path || isset($preloadedModernStyles[$path]) || isset($this->renderedStylesheets[$path])) {
                    continue;
                }
                $this->renderedStylesheets[$path] = true;
                $html .= "<link rel=\"stylesheet\" href=\"{$this->withVersionQuery($path)}\"{$this->nonceAttribute()}>";
            }
        }

        return $html;
    }

    /**
     * @param  string  $url
     * @return string
     */
    public function withVersionQuery($url)
    {
        if (! Str::contains($url, '?')) {
            $url .= '?';
        }

        $ver = 'v'.Admin::VERSION;

        return Str::endsWith($url, '?') ? $url.$ver : $url.'&'.$ver;
    }

    /**
     * 合并基础js脚本.
     */
    protected function mergeBaseJs()
    {
        if ($this->isPjax()) {
            return;
        }

        if ($this->isModernRequest()) {
            return;
        }

        $this->js = array_merge($this->baseJs, $this->js);
    }

    /**
     * @return string
     */
    public function jsToHtml()
    {
        if ($this->isModernRequest() && $this->needsCompatRuntime()) {
            $compat = $this->getAlias('@dcat-compat');
            $this->js($compat['js']);
        }

        $this->mergeBaseJs();

        $html = '';

        foreach (array_unique($this->js) as &$v) {
            if (! $paths = $this->get($v, 'js')) {
                continue;
            }

            foreach ((array) $paths as $path) {
                if (! $path || isset($this->renderedScripts[$path])) {
                    continue;
                }
                $this->renderedScripts[$path] = true;
                $html .= "<script src=\"{$this->withVersionQuery($path)}\"{$this->nonceAttribute()}></script>";
            }
        }

        return $html;
    }

    /**
     * @return string
     */
    public function headerJsToHtml()
    {
        $scripts = $this->headerJs;
        if ($this->isModernRequest()) {
            foreach (['vendors' => '@vendors', 'dcat' => '@dcat'] as $key => $default) {
                if (($scripts[$key] ?? null) === $default) {
                    unset($scripts[$key]);
                }
            }
            if ($this->inlineCompat || $this->containsLegacyJavascript($scripts)) {
                $compat = $this->getAlias('@dcat-compat');
                $scripts = array_merge((array) $compat['js'], $scripts);
            }
        }

        $html = '';

        foreach (array_unique($scripts) as &$v) {
            if (! $paths = $this->get($v, 'js')) {
                continue;
            }

            foreach ((array) $paths as $path) {
                if (! $path || isset($this->renderedScripts[$path])) {
                    continue;
                }
                $this->renderedScripts[$path] = true;
                $html .= "<script src=\"{$this->withVersionQuery($path)}\"{$this->nonceAttribute()}></script>";
            }
        }

        return $html;
    }

    /**
     * @return string
     */
    public function scriptToHtml()
    {
        $script = implode(";\n", array_unique($this->script));
        $directScript = implode(";\n", array_unique($this->directScript));

        return <<<HTML
<script data-exec-on-popstate{$this->nonceAttribute()}>
(function () {
    try {
        {$directScript}
    } catch (e) {
        console.error(e)
    }
})();
Dcat.ready(function () {
    try {
        {$script}
    } catch (e) {
        console.error(e)
    }
})
</script>
HTML;
    }

    /**
     * @return string
     */
    public function styleToHtml()
    {
        $style = implode('', array_unique($this->style));

        return "<style{$this->nonceAttribute()}>$style</style>";
    }

    protected function nonceAttribute()
    {
        $nonce = config('admin.modern.csp_nonce');

        if ($nonce instanceof \Closure) {
            $nonce = $nonce();
        }

        return $nonce ? ' nonce="'.e($nonce).'"' : '';
    }
}
