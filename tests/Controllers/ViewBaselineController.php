<?php

namespace Tests\Controllers;

use Dcat\Admin\Admin;
use Dcat\Admin\Form;
use Dcat\Admin\Grid;
use Dcat\Admin\Http\Controllers\Dashboard as AdminDashboard;
use Dcat\Admin\Http\Repositories\Administrator;
use Dcat\Admin\Layout\Content;
use Dcat\Admin\Layout\Asset;
use Dcat\Admin\Layout\Navbar;
use Dcat\Admin\Models\Administrator as AdministratorModel;
use Dcat\Admin\Show;
use Dcat\Admin\Tree;
use Dcat\Admin\Widgets\Box;
use Dcat\Admin\Widgets\Card;
use Dcat\Admin\Widgets\Dropdown;
use Dcat\Admin\Widgets\Modal;
use Illuminate\Support\MessageBag;
use Illuminate\Support\ViewErrorBag;

class ViewBaselineController
{
    public function vertical(Content $content)
    {
        config(['admin.layout.horizontal_menu' => false]);

        return $this->render($content, 'M0 Vertical');
    }

    public function horizontal(Content $content)
    {
        config(['admin.layout.horizontal_menu' => true]);

        return $this->render($content, 'M0 Horizontal');
    }

    public function fullPage(Content $content)
    {
        return $this->render($content->full(), 'M0 Full Page');
    }

    public function pjaxDisabled(Content $content)
    {
        Admin::disablePjax();

        return $this->render($content, 'M0 PJAX Disabled');
    }

    public function customPjax(Content $content)
    {
        Admin::context()->pjaxContainerId = 'm0-custom-pjax';

        return $this->render($content, 'M0 Custom PJAX');
    }

    public function modernVertical(Content $content)
    {
        $this->enableModernLayout();
        config(['admin.layout.horizontal_menu' => false]);

        return $this->render($content, 'M0 Modern Vertical');
    }

    protected function prepareNativeRuntimeFixture()
    {
        // 纯 core fixture 单独排除宿主 Demo 的设置弹窗等自定义兼容注入。
        // 普通 fixture 和 Demo 回归仍保留这些消费者，验证按需加载兼容能力。
        app()->instance('admin.asset', new Asset());
        app()->instance('admin.navbar', new Navbar());
        Admin::context()->html = [];
    }

    public function modernRuntimeShell(Content $content)
    {
        $this->prepareNativeRuntimeFixture();

        return $this->modernVertical($content);
    }

    public function modernRuntimeForm(Content $content)
    {
        $this->prepareNativeRuntimeFixture();

        return $this->modernFormBasic($content);
    }

    public function modernRuntimeGrid(Content $content)
    {
        $this->prepareNativeRuntimeFixture();

        return $this->modernGridInteractions($content);
    }

    public function modernHorizontal(Content $content)
    {
        $this->enableModernLayout();
        config(['admin.layout.horizontal_menu' => true]);

        return $this->render($content, 'M0 Modern Horizontal');
    }

    public function modernCollapsed(Content $content)
    {
        $this->enableModernLayout();
        config([
            'admin.layout.horizontal_menu' => false,
            'admin.layout.sidebar_collapsed' => true,
        ]);

        return $this->render($content, 'M0 Modern Collapsed');
    }

    public function modernFloatingNavbar(Content $content)
    {
        $this->enableModernLayout();
        config([
            'admin.layout.horizontal_menu' => false,
            'admin.layout.navbar_class' => 'floating',
        ]);

        return $this->render($content, 'M0 Modern Floating Navbar');
    }

    public function modernHiddenNavbar(Content $content)
    {
        $this->enableModernLayout();
        config([
            'admin.layout.horizontal_menu' => false,
            'admin.layout.navbar_class' => 'hidden',
        ]);

        return $this->render($content, 'M0 Modern Hidden Navbar');
    }

    public function modernFullPage(Content $content)
    {
        $this->enableModernLayout(['layout.full-page']);

        return $this->render($content->full(), 'M0 Modern Full Page');
    }

    public function grid(Content $content)
    {
        $grid = Grid::make(Administrator::with(['roles']), function (Grid $grid) {
            $grid->column('id', 'ID')->sortable();
            $grid->column('username');
            $grid->quickSearch(['id', 'username']);
            $grid->filter(function (Grid\Filter $filter) {
                $filter->equal('id');
                $filter->like('username');
            });
        });

        return $content
            ->header('M0 Grid Contract')
            ->description('Standalone Grid contract fixture')
            ->body($grid);
    }

    public function form(Content $content)
    {
        $form = Form::make(Administrator::with(['roles']), function (Form $form) {
            $form->text('username');
            $form->email('email')->rules('required');
            $form->password('password');
            $form->password('password_confirmation');
            $form->image('avatar');
            $form->text('profile.first_name');
            $form->text('profile.last_name');
            $form->text('profile.postcode');
        });

        return $content
            ->header('M0 Form Contract')
            ->description('Standalone Form contract fixture')
            ->body($form);
    }

    public function modernGrid(Content $content)
    {
        $this->enableModernFamily('grid', ['grid.read', 'grid.interactions']);

        return $this->grid($content);
    }

    public function modernGridInteractions(Content $content)
    {
        $this->enableModernFamily('grid', ['grid.read', 'grid.interactions']);

        $grid = Grid::make(Administrator::with(['roles']), function (Grid $grid) {
            $grid->column('id', 'ID')->sortable();
            $grid->column('username');
            $grid->quickSearch(['id', 'username']);
            $grid->showColumnSelector();
            $grid->filter(function (Grid\Filter $filter) {
                $filter->equal('id');
                $filter->like('username');
            });
        });

        return $content
            ->header('M0 Grid Interaction Contract')
            ->description('Native Grid interaction fixture')
            ->body($grid);
    }

    public function modernGridFilterMatrix(Content $content)
    {
        $this->enableModernFamily('grid', ['grid.read', 'grid.interactions']);

        $grid = Grid::make(Administrator::with(['roles']), function (Grid $grid) {
            $grid->disableRowSelector();
            $grid->disableActions();
            $grid->disableCreateButton();
            $grid->disableBatchActions();
            $grid->column('id', 'ID');
            $grid->column('username');
            $grid->filter(function (Grid\Filter $filter) {
                $filter->equal('cap_equal', 'Equal')->ignore();
                $filter->notEqual('cap_not_equal', 'Not Equal')->ignore();
                $filter->ilike('cap_ilike', 'Ilike')->ignore();
                $filter->like('cap_like', 'Like')->ignore();
                $filter->startWith('cap_start_with', 'Start With')->ignore();
                $filter->endWith('cap_end_with', 'End With')->ignore();
                $filter->gt('cap_gt', 'Gt')->ignore();
                $filter->lt('cap_lt', 'Lt')->ignore();
                $filter->ngt('cap_ngt', 'Ngt')->ignore();
                $filter->nlt('cap_nlt', 'Nlt')->ignore();
                $filter->between('cap_between', 'Between')->ignore();
                $in = $filter->in('cap_in', 'In');
                $in->multipleSelect(['a' => 'A', 'b' => 'B']);
                $in->ignore();
                $notIn = $filter->notIn('cap_not_in', 'Not In');
                $notIn->multipleSelect(['a' => 'A', 'b' => 'B']);
                $notIn->ignore();
                $filter->findInSet('cap_find_in_set', 'Find In Set')->ignore();
                $filter->date('cap_date', 'Date')->ignore();
                $filter->day('cap_day', 'Day')->ignore();
                $filter->month('cap_month', 'Month')->ignore();
                $filter->year('cap_year', 'Year')->ignore();
                $filter->where('cap_where', function ($query) {
                    $query->where('id', '>', 0);
                }, 'Where')->ignore();
                $filter->whereBetween('cap_where_between', function ($query) {
                    $query->whereBetween('id', [1, 999999]);
                }, 'Where Between')->ignore();
                $filter->group('cap_group', function (Grid\Filter\Group $group) {
                    $group->equal('Equal')->gt('Greater');
                }, 'Group')->ignore();
                $filter->hidden('cap_hidden', 'hidden-value')->ignore();
                $filter->newline();

                $select = $filter->equal('cap_presenter_select', 'Presenter Select');
                $select->select(['a' => 'A', 'b' => 'B']);
                $select->ignore();
                $multiple = $filter->equal('cap_presenter_multiple', 'Presenter Multiple');
                $multiple->multipleSelect(['a' => 'A', 'b' => 'B']);
                $multiple->ignore();
                $radio = $filter->equal('cap_presenter_radio', 'Presenter Radio');
                $radio->radio(['a' => 'A', 'b' => 'B']);
                $radio->ignore();
                $checkbox = $filter->equal('cap_presenter_checkbox', 'Presenter Checkbox');
                $checkbox->checkbox(['a' => 'A', 'b' => 'B']);
                $checkbox->ignore();
                $dateTime = $filter->equal('cap_presenter_datetime', 'Presenter DateTime');
                $dateTime->datetime();
                $dateTime->ignore();
                $selectTable = $filter->equal('cap_presenter_select_table', 'Presenter Select Table');
                $selectTable->selectTable(new ViewBaselineLazyGrid())->pluck('username', 'id');
                $selectTable->ignore();
                $multipleSelectTable = $filter->equal('cap_presenter_multiple_select_table', 'Presenter Multiple Select Table');
                $multipleSelectTable->multipleSelectTable(new ViewBaselineLazyGrid())->pluck('username', 'id');
                $multipleSelectTable->ignore();
                $filter->scope('cap_scope', 'Scope')->where('id', '>', 0);
            });
        });

        return $content
            ->header('M0 Grid Filter Capability Matrix')
            ->description('Aggregate compat-filter fixture with native drawer/query ownership')
            ->body($grid);
    }

    public function modernGridCompatDisplayers(Content $content)
    {
        $this->enableModernFamily('grid', ['grid.read', 'grid.interactions']);

        $query = ViewBaselineAdministrator::query()
            ->select(['id', 'username', 'name', 'email'])
            ->selectRaw('username as compat_copy, username as compat_limit, username as compat_modal, username as compat_qrcode, username as compat_orderable')
            ->selectRaw('username as compat_input, username as compat_textarea, username as compat_select, username as compat_radio')
            ->selectRaw("'[\"admin\"]' as compat_checkbox")
            ->selectRaw('id as compat_switch, username as compat_switch_group, 1 as compat_switch_a, 0 as compat_switch_b')
            ->selectRaw("'1' as compat_dialog_tree, username as compat_tree")
            ->limit(1);

        $grid = Grid::make($query, function (Grid $grid) {
            $grid->setName('m0-compat-displayers');
            $grid->disableRowSelector();
            $grid->disableActions();
            $grid->disableCreateButton();
            $grid->disableFilter();
            $grid->disableBatchActions();
            $grid->column('compat_copy', 'Copyable')->copyable();
            $grid->column('compat_limit', 'Limit')->limit(4);
            $grid->column('compat_modal', 'Modal')->modal();
            $grid->column('compat_qrcode', 'QRCode')->qrcode(null, 64, 64);
            $grid->column('compat_orderable', 'Orderable')->orderable();
            $grid->column('compat_input', 'Input')->input();
            $grid->column('compat_textarea', 'Textarea')->textarea();
            $grid->column('compat_select', 'Select')->select(['admin' => 'Admin', 'other' => 'Other']);
            $grid->column('compat_radio', 'Radio')->radio(['admin' => 'Admin', 'other' => 'Other']);
            $grid->column('compat_checkbox', 'Checkbox')->checkbox(['admin' => 'Admin', 'other' => 'Other']);
            $grid->column('compat_switch', 'Switch')->switch();
            $grid->column('compat_switch_group', 'Switch Group')->switchGroup([
                'compat_switch_a' => 'Switch A',
                'compat_switch_b' => 'Switch B',
            ]);
            $grid->column('compat_dialog_tree', 'Dialog Tree')->showTreeInDialog([
                ['id' => 1, 'name' => 'Root', 'parent_id' => 0],
                ['id' => 2, 'name' => 'Child', 'parent_id' => 1],
            ]);
            $grid->column('compat_tree', 'Tree')->displayUsing(\Dcat\Admin\Grid\Displayers\Tree::class);
        });

        $makeActionGrid = function (string $name, string $actionClass) {
            return Grid::make(Administrator::with(['roles']), function (Grid $grid) use ($name, $actionClass) {
                $grid->setName($name);
                $grid->disableCreateButton();
                $grid->disableFilter();
                $grid->disableBatchActions();
                $grid->disableRowSelector();
                $grid->setActionClass($actionClass);
                $grid->column('id', 'ID');
                $grid->column('username', 'Username');
                $grid->paginate(1);
                $grid->disablePerPages();
            });
        };

        $actionMode = request()->get('actions', 'dropdown');
        $actionClasses = [
            'default' => \Dcat\Admin\Grid\Displayers\Actions::class,
            'dropdown' => \Dcat\Admin\Grid\Displayers\DropdownActions::class,
            'context' => \Dcat\Admin\Grid\Displayers\ContextMenuActions::class,
        ];
        $actionClass = $actionClasses[$actionMode] ?? $actionClasses['dropdown'];
        $actions = $makeActionGrid('m0-actions-'.$actionMode, $actionClass);

        return $content
            ->header('M0 Grid Compat Displayer Matrix')
            ->description('Aggregate compat-displayer fixture with scoped islands and safe interaction witnesses')
            ->body($grid)
            ->body($actions);
    }

    public function modernGridActionMatrix(Content $content)
    {
        $this->enableModernFamily('grid', ['grid.read', 'grid.interactions']);

        $grid = Grid::make(Administrator::with(['roles']), function (Grid $grid) {
            $grid->setName('m0-action-matrix');
            $grid->setResource('auth/users');
            $grid->column('id', 'ID')->sortable();
            $grid->column('username', 'Username');
            $grid->showQuickEditButton();
            $grid->enableDialogCreate();
            $grid->export();
            $grid->paginate(1);
            $grid->quickCreate(function (Grid\Tools\QuickCreate $create) {
                $create->action('tests/view-baseline/native-request-probe');
                $create->text('username', 'Username');
            });
            $grid->batchActions(function (Grid\Tools\BatchActions $batch) {
                $batch->divider();
            });
            $grid->selector(function (Grid\Tools\Selector $selector) {
                $selector->selectOne('id', 'ID Selector', [1 => 'ID 1', 2 => 'ID 2']);
            });
        });

        return $content
            ->header('M0 Grid Action Matrix')
            ->description('Grid action/tool compatibility fixture with safe intercepted write contracts')
            ->body($grid);
    }

    public function modernGridDisplayers(Content $content)
    {
        $this->enableModernFamily('grid', ['grid.read']);
        if (request()->boolean('contrast')) {
            Admin::style('.dcat-modern-grid-view { --dcat-modern-test-label-bg: #7f7f7f; }');
        }

        $makeQuery = function () {
            return ViewBaselineAdministrator::query()
                ->select(['id', 'username', 'name', 'email'])
                ->selectRaw('username as button_value, username as label_value, username as badge_value, username as link_value, username as download_value, username as expand_value, username as contrast_var_value, username as contrast_gray_value, username as contrast_alpha_value, id as progress_value')
                ->selectRaw("'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==' as image_value")
                ->selectRaw("'[{\"key\":\"alpha\",\"value\":\"beta\"}]' as table_value")
                ->selectRaw("'A deliberately long Grid cell value used to prove table containment without page-level overflow.' as long_value");
        };

        $query = $makeQuery();
        if (request()->boolean('empty')) {
            $query->whereRaw('1 = 0');
        } elseif (request()->boolean('multi')) {
            $query->unionAll($makeQuery())->unionAll($makeQuery());
        }

        $complex = request()->boolean('complex');
        $fixed = request()->boolean('fixed');
        $multi = request()->boolean('multi');

        $grid = Grid::make($query, function (Grid $grid) use ($complex, $fixed, $multi) {
            $grid->disableRowSelector();
            $grid->disableActions();
            $grid->disableCreateButton();
            $grid->disableFilter();
            $grid->disableBatchActions();
            $grid->column('id', 'ID')->sortable();
            $grid->column('username', 'Text');
            $grid->column('button_value', 'Button')->button();
            $grid->column('label_value', 'Label')->label();
            if (request()->boolean('contrast')) {
                $grid->column('contrast_var_value', 'Variable Label')->label('var(--dcat-modern-test-label-bg)');
                $grid->column('contrast_gray_value', 'Gray Label')->label('#7f7f7f');
                $grid->column('contrast_alpha_value', 'Alpha Label')->label('rgba(0,0,0,0.1)');
            }
            $grid->column('badge_value', 'Badge')->badge('success');
            $grid->column('link_value', 'Link')->link('/admin/tests/view-baseline/modern-grid-displayers', '_self');
            $grid->column('image_value', 'Image')->image('', 32, 32);
            $grid->column('progress_value', 'Progress')->progressBar('primary', 'sm', 100);
            $grid->column('download_value', 'Download')->downloadable('/files');
            $grid->column('expand_value', 'Expand')->expand();
            $grid->column('table_value', 'Table')->table(['key' => 'Key', 'value' => 'Value']);
            $grid->column('long_value', 'Long Text');
            $grid->column('name', 'Custom Compat')->display(function ($value) {
                return '<strong data-m0-grid-custom="1">'.e($value).'</strong>';
            });

            if ($complex) {
                $grid->combine('identity', ['id', 'username'], 'Identity');
            }
            if ($fixed) {
                $grid->fixColumns(1, -1);
            }
            if ($multi) {
                $grid->paginate(1);
                $grid->disablePerPages();
            }
        });

        return $content
            ->header('M0 Grid Displayer Contract')
            ->description('Payload-first read-only displayer fixture')
            ->body($grid);
    }

    public function modernFormBasic(Content $content)
    {
        $this->enableModernFamily('form', ['form.basic']);

        $form = Form::make(Administrator::with(['roles']), function (Form $form) {
            $form->text('username', 'Username')->rules('required')->help('Required text field');
            $form->id('cap_id', 'ID')->value(42);
            $form->textarea('name', 'Biography')->rows(3)->value("Line one\nLine two");
            $form->number('cap_number', 'Number')->min(1)->max(99)->value(7);
            $form->email('email', 'Email')->rules('required|email')->value('admin@example.test');
            $form->url('cap_url', 'URL')->value('https://example.test');
            $form->password('cap_password', 'Password')->value('secret-value');
            $form->tel('cap_tel', 'Telephone')->value('+64 9 555 0100');
            $form->hidden('cap_hidden')->value('hidden-value');
            $form->display('cap_display', 'Display')->value('Display value');
            $form->select('cap_select', 'Select')->options(['admin' => 'Admin', 'user' => 'User'])->value('admin');
            $form->radio('cap_radio', 'Radio')->options(['yes' => 'Yes', 'no' => 'No'])->value('yes');
            $form->checkbox('cap_checkbox', 'Checkbox')->options(['a' => 'Alpha', 'b' => 'Beta'])->value(['a']);
            $form->switch('cap_switch', 'Switch')->value(1);
            $form->date('cap_date', 'Date')->value('2026-09-05');
            $form->time('cap_time', 'Time')->value('13:05:00');
            $form->text('cap_disabled', 'Disabled')->disable()->value('disabled-value');
            $form->text('cap_readonly', 'Read only')->readOnly()->value('readonly-value');
        });

        if (request()->boolean('edit')) {
            $form->edit(1);
        }
        $form->action(admin_url('tests/view-baseline/modern-form-probe'));

        return $content
            ->header('M0 Modern Basic Form Contract')
            ->description('Payload-first native basic Form fixture')
            ->body($form);
    }

    public function modernFormLayout(Content $content)
    {
        $this->enableModernFamily('form', ['form.basic']);
        $profile = request()->get('profile', 'rows');

        $form = Form::make(Administrator::with(['roles']), function (Form $form) use ($profile) {
            if ($profile === 'rows') {
                $form->row(function (Form\Row $row) {
                    $row->width(6)->text('layout_name', 'Name')->value('Alice');
                    $row->width(6)->email('layout_email', 'Email')->value('alice@example.test');
                });

                return;
            }
            if ($profile === 'columns') {
                $form->column(6, function (Form $form) {
                    $form->text('layout_left', 'Left')->value('Left value');
                });
                $form->column(6, function (Form $form) {
                    $form->text('layout_right', 'Right')->value('Right value');
                });

                return;
            }
            if ($profile === 'blocks') {
                $form->block(6, function (Form\BlockForm $block) {
                    $block->title('Primary block');
                    $block->text('layout_primary', 'Primary')->value('Primary value');
                });
                $form->block(6, function (Form\BlockForm $block) {
                    $block->title('Secondary block');
                    $block->text('layout_secondary', 'Secondary')->value('Secondary value');
                });

                return;
            }

            $form->tab('Profile', function (Form $form) {
                $form->text('layout_profile', 'Profile name')->value('Profile value');
            }, true, 'layout-profile-tab');
            $form->tab('Security', function (Form $form) {
                $form->text('layout_secret', 'Secret')->rules('required')->value('keep-me');
            }, false, 'layout-security-tab');
        });
        $form->action(admin_url('tests/view-baseline/modern-form-probe'));

        return $content
            ->header('M0 Modern Form Layout Contract')
            ->description('Payload-first row, column, block and tab layout fixture')
            ->body($form);
    }

    public function modernFormAdvancedNative(Content $content)
    {
        $this->enableModernFamily('form', ['form.basic', 'form.advanced']);

        $form = Form::make(Administrator::with(['roles']), function (Form $form) {
            $form->currency('adv_currency', 'Currency')->symbol('NZ$')->digits(2)->value('1234.50');
            $form->decimal('adv_decimal', 'Decimal')->value('12.5');
            $form->ip('adv_ip', 'IP address')->rules('required')->value('192.168.1.10');
            $form->mobile('adv_mobile', 'Mobile')->value('02112345678');
            $form->rate('adv_rate', 'Rate')->min(0)->max(100)->value(75);
            $form->datetime('adv_datetime', 'Datetime')->value('2026-09-05 14:30:00');
            $form->month('adv_month', 'Month')->value('09');
            $form->year('adv_year', 'Year')->value('2026');
            $form->color('adv_color', 'Color')->value('#586CB1');
            $form->multipleSelect('adv_multiple', 'Multiple select')
                ->options(['a' => 'Alpha', 'b' => 'Beta', 'c' => 'Gamma'])
                ->value(['a', 'c']);
            $form->listbox('adv_listbox', 'Listbox')
                ->options(['red' => 'Red', 'green' => 'Green', 'blue' => 'Blue'])
                ->value(['green']);
            $form->timezone('adv_timezone', 'Timezone')->value('Pacific/Auckland');
            $form->range('adv_range_start', 'adv_range_end', 'Range')->value(['start' => '10', 'end' => '20']);
            $form->dateRange('adv_date_start', 'adv_date_end', 'Date range')->value(['start' => '2026-09-01', 'end' => '2026-09-05']);
            $form->datetimeRange('adv_datetime_start', 'adv_datetime_end', 'Datetime range')->value(['start' => '2026-09-05 09:00:00', 'end' => '2026-09-05 17:00:00']);
            $form->timeRange('adv_time_start', 'adv_time_end', 'Time range')->value(['start' => '09:00:00', 'end' => '17:00:00']);
        });

        if (request()->boolean('edit')) {
            $form->edit(1);
        }
        $form->action(admin_url('tests/view-baseline/modern-form-probe'));

        return $content
            ->header('M0 Modern Advanced Native Form Contract')
            ->description('B7 payload-first native advanced field fixture')
            ->body($form);
    }

    public function modernFormAdvancedVendor(Content $content)
    {
        $this->enableModernFamily('form', ['form.basic', 'form.advanced']);

        $form = Form::make(Administrator::with(['roles']), function (Form $form) {
            $form->autocomplete('vendor_autocomplete', 'Autocomplete')
                ->options(['Alpha', 'Beta', 'Gamma'])
                ->value('Alpha');
            $form->editor('vendor_editor', 'Editor')->value('<p>Initial editor value</p>');
            $form->file('vendor_file', 'File')->autoUpload(false);
            $form->image('vendor_image', 'Image')->autoUpload(false);
            $form->multipleFile('vendor_files', 'Multiple files')->limit(3)->autoUpload(false);
            $form->multipleImage('vendor_images', 'Multiple images')->limit(3)->autoUpload(false);
            $form->icon('vendor_icon', 'Icon')->value('fa fa-user');
            $form->markdown('vendor_markdown', 'Markdown')->value('## Initial markdown');
            $form->slider('vendor_slider', 'Slider')->options(['min' => 0, 'max' => 100])->value(25);
            $form->tags('vendor_tags', 'Tags')->options(['alpha', 'beta', 'gamma'])->value(['alpha']);
            $form->tree('vendor_tree', 'Tree')->nodes([
                ['id' => 1, 'parent_id' => 0, 'name' => 'Root'],
                ['id' => 2, 'parent_id' => 1, 'name' => 'Child A'],
                ['id' => 3, 'parent_id' => 1, 'name' => 'Child B'],
            ])->value([2]);
        });

        $form->action(admin_url('tests/view-baseline/modern-form-probe'));

        return $content
            ->header('M0 Modern Advanced Vendor Form Contract')
            ->description('B7 vendor-adapter lifecycle fixture')
            ->body($form);
    }

    public function modernFormAdvancedCompat(Content $content)
    {
        $this->enableModernFamily('form', ['form.basic', 'form.advanced']);

        $form = Form::make(Administrator::with(['roles']), function (Form $form) {
            $form->button('Compat Button')->on('click', "window.__dcatCompatButton=(window.__dcatCompatButton||0)+1;");
            $form->divider('Compat divider');
            $form->head('Compat heading', 5);
            $form->html('<div data-compat-html="1">Compat HTML</div>', 'HTML');
            $form->fieldset('Compat fieldset', function (Form $form) {
                $form->text('compat_fieldset_text', 'Fieldset text')->value('fieldset-value');
            });

            $form->keyValue('compat_key_value', 'Key/value')
                ->value(['alpha' => 'one']);
            $form->list('compat_list', 'List')
                ->value(['first']);
            $form->array('compat_array', 'Array', function (Form\NestedForm $nested) {
                $nested->text('name', 'Name')->rules('required');
                $nested->number('qty', 'Qty');
            })->value([
                ['name' => 'Array one', 'qty' => 1],
            ]);
            $form->table('compat_table', 'Table', function (Form\NestedForm $nested) {
                $nested->text('name', 'Name')->rules('required');
                $nested->number('qty', 'Qty');
            })->value([
                ['name' => 'Table one', 'qty' => 2],
            ]);
            $form->hasMany('compat_many', 'Has many', function (Form\NestedForm $nested) {
                $nested->text('name', 'Name')->rules('required');
                $nested->number('qty', 'Qty');
            })->value([
                ['id' => 1, 'name' => 'Many one', 'qty' => 3],
            ]);
            $form->embeds('compat_embed', 'Embedded', function (Form\EmbeddedForm $embedded) {
                $embedded->text('title', 'Title')->value('Embedded title');
                $embedded->number('count', 'Count')->value(4);
            })->value(['title' => 'Embedded title', 'count' => 4]);

            $form->selectTable('compat_select_table', 'Select table')
                ->from(new ViewBaselineLazyGrid())
                ->pluck('username', 'id')
                ->options([1 => 'Administrator'])
                ->value(1);
            $form->multipleSelectTable('compat_multiple_select_table', 'Multiple select table')
                ->from(new ViewBaselineLazyGrid())
                ->pluck('username', 'id')
                ->options([1 => 'Administrator'])
                ->value([1]);

            $form->select('compat_cascade', 'Cascade')
                ->options(['hide' => 'Hide', 'show' => 'Show'])
                ->value('hide')
                ->when('show', function (Form $form) {
                    $form->text('compat_cascade_detail', 'Cascade detail')->value('visible detail');
                });
            $form->select('compat_load_parent', 'Load parent')
                ->options(['one' => 'One', 'two' => 'Two'])
                ->value('one')
                ->load('compat_load_child', 'tests/view-baseline/modern-form-load-options');
            $form->select('compat_load_child', 'Load child')->options([]);
        });
        if (request()->boolean('edit')) {
            $form->edit(1);
        }
        $form->action(admin_url('tests/view-baseline/modern-form-probe'));

        return $content
            ->header('M0 Modern Advanced Compat Form Contract')
            ->description('B7 Dcat complex compat-island fixture')
            ->body($form);
    }

    public function modernFormAdvancedOptional(Content $content)
    {
        require_once __DIR__.'/../Fixtures/captcha_stub.php';

        config([
            'admin.map.provider' => 'google',
            'admin.map.keys.google' => 'fixture-key',
        ]);
        $this->enableModernFamily('form', ['form.basic', 'form.advanced']);

        $form = Form::make(Administrator::with(['roles']), function (Form $form) {
            $form->map('optional_lat', 'optional_lng', 'Map')
                ->value(['lat' => '-36.8485', 'lng' => '174.7633']);
            $form->captcha()->value('fixture-captcha');
        });
        if (request()->boolean('edit')) {
            $form->edit(1);
        }
        $form->action(admin_url('tests/view-baseline/modern-form-probe'));

        return $content
            ->header('M0 Modern Advanced Optional Form Contract')
            ->description('B7 optional-provider compatibility fixture')
            ->body($form);
    }

    public function modernFormLoadOptions(\Illuminate\Http\Request $request)
    {
        $prefix = (string) $request->get('q', $request->get('query', ''));

        return response()->json([
            ['id' => 'loaded-a', 'text' => 'Loaded A '.$prefix],
            ['id' => 'loaded-b', 'text' => 'Loaded B '.$prefix],
        ]);
    }

    public function modernFormProbe(\Illuminate\Http\Request $request)
    {
        if ($request->input('email') === 'server-error@example.test') {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => ['email' => ['The email field must be a valid email address.']],
            ], 422);
        }
        if ($request->input('layout_secret') === 'server-error') {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => ['layout_secret' => ['The secret field is invalid.']],
            ], 422);
        }
        if ($request->input('adv_ip') === 'server-error') {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => ['adv_ip' => ['The IP address is invalid.']],
            ], 422);
        }
        if (data_get($request->all(), 'compat_key_value.values.0') === 'server-error') {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => ['compat_key_value.values.0' => ['The compat value is invalid.']],
            ], 422);
        }
        if ($request->input('__captcha__') === 'server-error') {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => ['__captcha__' => ['The captcha value is invalid.']],
            ], 422);
        }

        return response()->json([
            'status' => true,
            'redirect' => false,
            'data' => [
                'type' => 'success',
                'message' => 'Saved.',
            ],
        ]);
    }

    public function modernForm(Content $content)
    {
        $this->enableModernFamily('form', ['form.basic', 'form.advanced']);

        return $this->form($content);
    }

    public function modernShow(Content $content)
    {
        $this->enableModernFamily('show', ['show.detail']);

        $show = Show::make(AdministratorModel::DEFAULT_ID, Administrator::with(['roles']), function (Show $show) {
            $show->field('id');
            $show->field('username');
            $show->field('name');
        });

        return $content
            ->header('M0 Show Contract')
            ->description('Standalone Show contract fixture')
            ->body($show);
    }

    public function modernShowNative(Content $content)
    {
        $this->enableModernFamily('show', ['show.detail']);

        $show = Show::make(42, [
            'id' => 42,
            'username' => 'payload-user',
            'name' => 'Payload User',
            'formatted' => 'formatter-value',
        ], function (Show $show) {
            $show->field('id', 'ID');
            $show->field('username', 'Username');
            $show->field('name', 'Name');
            $show->field('formatted', 'Formatted')->unescape()->as(function ($value) {
                return '<strong data-show-formatter="compat">'.e($value).'</strong>';
            });
        });
        $show->setResource('tests/view-baseline/modern-show-resource');

        return $content
            ->header('M0 Modern Show Native Contract')
            ->description('B8 payload-first Show fields and actions fixture')
            ->body($show);
    }

    public function modernShowResource(Content $content)
    {
        $this->enableModernFamily('show', ['show.detail']);

        return $content->body('<div data-show-resource-list="1">Show resource list probe</div>');
    }

    public function modernShowEdit(Content $content, $id)
    {
        $this->enableModernFamily('show', ['show.detail']);

        return $content->body('<div data-show-edit-id="'.e($id).'">Show edit probe</div>');
    }

    public function modernShowDelete(\Illuminate\Http\Request $request, $id)
    {
        return response()->json([
            'status' => true,
            'message' => 'Deleted show fixture '.$id.'.',
            'redirect' => admin_url('tests/view-baseline/modern-show-native?deleted='.$id),
            'method' => $request->method(),
        ]);
    }

    public function modernTree(Content $content)
    {
        $this->enableModernFamily('tree', ['tree.page']);
        $menuModel = config('admin.database.menu_model');
        $tree = new Tree(new $menuModel(), function (Tree $tree) {
            $tree->disableCreateButton();
            $tree->disableQuickCreateButton();
            $tree->disableEditButton();
            $tree->maxDepth(3);
        });

        return $content
            ->header('M0 Tree Contract')
            ->description('Standalone Tree contract fixture')
            ->body($tree);
    }

    public function modernTreeNative(Content $content)
    {
        $this->enableModernFamily('tree', ['tree.page']);

        $tree = new Tree(new ViewBaselineTreeRepository(), function (Tree $tree) {
            $tree->disableCreateButton();
            $tree->disableQuickCreateButton();
            $tree->disableQuickEditButton();
            $tree->disableEditButton();
            $tree->disableDeleteButton();
            $tree->maxDepth(3);
        });
        $tree->setResource('tests/view-baseline/modern-tree-native');

        return $content
            ->header('M0 Modern Tree Native Contract')
            ->description('B8 payload-first Tree reorder/save fixture')
            ->body($tree);
    }

    public function modernTreeNativeSave(\Illuminate\Http\Request $request)
    {
        $repository = new ViewBaselineTreeRepository();
        $tree = new Tree($repository, function (Tree $tree) {
            $tree->disableCreateButton();
            $tree->disableQuickCreateButton();
            $tree->disableQuickEditButton();
            $tree->disableEditButton();
            $tree->disableDeleteButton();
            $tree->maxDepth(3);
        });
        $tree->saveOrder((string) $request->input(Tree::SAVE_ORDER_NAME));

        return response()->json([
            'status' => true,
            'message' => 'Tree order saved.',
            'order' => ViewBaselineTreeRepository::$lastOrder,
        ]);
    }

    public function modernWidget(Content $content)
    {
        $this->enableModernFamily('widget', ['widget.surface']);

        $box = Box::make('M0 Box', '<div data-b8-widget-content="box">Box content</div>')
            ->style('info')
            ->collapsable()
            ->removable();
        $card = Card::make('M0 Card', '<div data-b8-widget-content="card">Card content</div>')
            ->footer('<span data-b8-widget-footer="1">Card footer</span>')
            ->id('b8-widget-card')
            ->class('col-md-6', true)
            ->noPadding();
        $dataCard = view('admin::widgets.data-card', [
            'attributes' => 'class="dcat-b8-data-card"',
            'options' => [
                'show_tool_shadow' => false,
                'tools' => [],
                'title' => 'M0 Data Card',
                'description' => 'Data card description',
                'content' => ['left' => '42', 'right' => 'Ready'],
                'progress' => ['percent' => 75, 'style' => 'warning'],
            ],
        ]);
        $dropdown = Dropdown::make(['alpha' => 'Alpha', 'beta' => 'Beta'])
            ->click()
            ->map(function ($value) {
                return '<span class="b8-option"><i class="feather icon-check"></i>1. '.$value.'</span>';
            });
        $modal = Modal::make('B8 Compat Modal', '<div data-b8-modal-content="1">Modal content</div>')
            ->id('b8-widget-modal')
            ->button('<button type="button" data-b8-modal-open="1">Open modal</button>')
            ->onShown('window.__dcatB8ModalShown=(window.__dcatB8ModalShown||0)+1;')
            ->onHidden('window.__dcatB8ModalHidden=(window.__dcatB8ModalHidden||0)+1;');
        $controls = '<div data-b8-widget-controls="1">'.$dropdown->render().' '.$modal->render().'</div>';

        return $content
            ->header('M0 Widget Contract')
            ->description('B8 Dcat UI widget, data-card, dashboard and bounded dialog fixture')
            ->body($box)
            ->row($card)
            ->row($dataCard)
            ->row($controls)
            ->row(AdminDashboard::title());
    }

    public function modernSystem(Content $content)
    {
        $this->enableModernFamily('system', ['system.page']);
        session()->flash('success', new MessageBag([
            'title' => 'Success',
            'message' => 'M0 system feedback',
        ]));

        return $content
            ->header('M0 System Contract')
            ->description('B8 native System feedback fixture')
            ->body('<div data-m0-system-content="1">System content</div>');
    }

    public function modernSystemException(Content $content)
    {
        $this->enableModernFamily('system', ['system.page']);
        $errors = new ViewErrorBag();
        $errors->put('exception', new MessageBag([
            'type' => [\RuntimeException::class],
            'file' => ['/tmp/dcat-b8-fixture.php'],
            'line' => ['73'],
            'message' => ['B8 exception fixture'],
            'trace' => ["#0 fixture():73\n#1 controller():1"],
        ]));
        view()->share('errors', $errors);

        return $content
            ->header('M0 System Exception Contract')
            ->description('B8 native exception disclosure fixture')
            ->body('<div data-b8-system-exception="content">Exception content</div>');
    }

    public function modernLogin(Content $content)
    {
        $this->enableModernFamily('system', ['system.page']);
        config(['admin.auth.remember' => true]);

        return $content->full()->body(view('admin::pages.login'));
    }

    public function rollbackGlobal(Content $content)
    {
        $this->enableModernLayout();
        // 已删除的开关：夹具保留该键以证明它不再影响渲染器选择。
        config(['admin.modern.enabled' => false]);

        return $this->render($content, 'M0 Removed Global Switch');
    }

    public function rollbackFamily(Content $content)
    {
        $this->enableModernLayout();
        // 已删除的 family 门禁：夹具保留该键以证明它不再影响渲染器选择。
        config(['admin.modern.families' => ['layout' => false]]);

        return $this->render($content, 'M0 Removed Family Gate');
    }

    public function rollbackCapability(Content $content)
    {
        $this->enableModernLayout();
        // 已删除的 capability 门禁：夹具保留该键以证明它不再影响渲染器选择。
        config(['admin.modern.capabilities' => ['layout.navigation' => false]]);

        return $this->render($content, 'M0 Removed Capability Gate');
    }

    public function rollbackRoute(Content $content)
    {
        $this->enableModernLayout();
        // 已删除的 route 门禁：夹具保留该键以证明它不再影响渲染器选择。
        config(['admin.modern.exclude_routes' => [request()->path()]]);

        return $this->render($content, 'M0 Removed Route Gate');
    }

    protected function enableModernLayout(array $capabilities = null)
    {
        $this->enableModernFamily('layout', $capabilities ?: [
                'layout.shell',
                'layout.navigation',
                'layout.menu',
                'layout.header',
                'layout.navbar',
                'layout.footer',
                'layout.horizontal',
            ]);
    }

    protected function enableModernFamily($family, array $capabilities)
    {
        // 保留各页面族的夹具入口，所有能力统一使用当前 native manifest。
        config(['admin.modern.manifest' => null]);
    }

    protected function render(Content $content, string $title)
    {
        return $content
            ->header($title)
            ->description('View modernization legacy baseline fixture')
            ->body('<div data-m0-view-baseline="content">Legacy baseline fixture</div>');
    }
}

class ViewBaselineAdministrator extends AdministratorModel
{
    protected $casts = [
        'table_value' => 'array',
        'compat_checkbox' => 'array',
    ];
}
