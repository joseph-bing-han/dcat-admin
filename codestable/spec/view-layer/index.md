# 当前 View 层

> **图示状态：当前。** 本文只记录已经成立的 View 层真相，不包含现代化目标。

> **当前事实（2026-09-28）：** Admin 页面由新版 View runtime 接管。manifest 有效时使用 native React View；native 不适用或 manifest 缺失时使用 Dcat-owned compat shell/island。旧版 Bootstrap/AdminLTE 整页 renderer、renderer 开关和 classic 回退已从当前实现中移除。兼容契约保留 PHP Controller/API、HTTP/表单协议和登记的稳定锚点，不承诺旧版整页 View、任意 Bootstrap class 或私有 DOM 等价。View 现代化 Epic 已关闭；发布候选与 Git 提交仍按独立授权和状态记录管理。

2026-10-08：详情附件列表清除圆点与重复回形针，文件类型图标与文件名同排，长名称在内容列换行。右侧下载按钮与文件名首行顶端对齐，大小位于名称下方。文件名和下载按钮使用同一URL及download属性，名称/URL经过HTML转义；跨域强制下载仍需文件服务返回Content-Disposition。PHP聚焦测试与构建通过，Chrome extension桌面临时布局预览确认按钮与文件名顶部一致，未验证实际下载或部署消费应用。见 [详情附件优化](../../issues/032-x-ff-优化详情附件列表.md)。

验证范围按用户 2026-09-26 的决定限定为当前实际使用的 PHP/Laravel 版本，本轮是官方 Demo 的 PHP 8.1.34 / Laravel 10.50.3。不要求验证其它版本组合；旧多版本矩阵仅作历史参考，不能将单环境证据写成其它版本已通过。

项目已按用户要求移除 `.github` 与 workflow 草案；View 验收通过本地脚本执行，不依赖 GitHub Actions。

2026-10-03：默认前端命令已统一为新版 Vite 构建。`dev/development`、`prod/production/build` 和 `watch/watch-poll` 均生成 `resources/dist/` 下的新版视图、compat/facade、插件扩展与静态资源；`hot` 是监听别名，需刷新消费应用，不提供 HMR。`test/typecheck/verify` 等检查命令不再带 `modern:` 前缀。旧 Mix 配置、专用依赖及 extra sourcemap 已移除；新版所需插件兼容层仍保留。开发、生产、两种监听、类型检查及 169 项测试已通过；完整 verify 仍受既有 Blade 盘点 140/142 漂移影响。执行证据见 [默认构建迁移](../../tasks/archived/2026-10-03-010-unify-default-build.md)。

## 页面怎样产生

2026-10-09：新版 Grid 保留行复选框 `change` 传播，兼容 SelectTable 先处理单选互斥和多选上限，再在冒泡阶段同步行高亮与表头状态。行点击和全选逐行派发 `change`，全选使用原始勾选快照。65 项 runtime/Grid 测试、类型检查、构建和产物检查通过；Chrome extension 最终资源临时预览确认发票客户回填、重开默认勾选、单选互斥及取消保留原值。未提交发票或发布消费应用资源。见 [弹窗选择回填修复](../../issues/033-x-ff-修复弹窗表格选择回填.md)。

Dcat Admin 不是独立 SPA。应用控制器使用 `Content`、`Grid`、`Form`、`Show`、`Tree` 和 Widgets 等 PHP API 组织页面；新版 ViewModel/payload adapter 将内建语义交给 Modern runtime。自定义 Blade、Renderable 和扩展内容通过明确的 compat island 显示在新版页面中。

```text
Laravel route/controller
        |
        v
PHP page builders -> ViewModel / payload adapters
        |
        v
Modern View runtime / PJAX
        |
        +------> Native React View
        |
        v
 Dcat-owned compat islands
        |
        +------> custom Blade / Renderable / plugin nodes
        |
        v
Browser-visible modern admin page
```

新版 runtime 始终拥有页面 renderer；PJAX 请求只返回内容片段及本页增量资源。`Admin::resolveHtml()` 从 Controller/Renderable 输出中提取 `link`、`style`、`script` 和 `template`，交给统一资源和初始化生命周期。compat island 是新版页面中的内容边界，不是完整旧 View。

## 稳定布局

桌面端使用左侧导航、顶部导航、内容标题与面包屑、主内容、页脚的固定信息架构。默认展开侧栏宽度为 260px；折叠侧栏、水平菜单、顶部导航 sticky/floating/hidden、浅色/深色/主色侧栏和 full-page 均是现有配置形态。

```text
+----------------------+-----------------------------------------------+
| Logo / brand         | Top navigation and user actions               |
+----------------------+-----------------------------------------------+
|                      | Page title / description      Breadcrumbs     |
| Sidebar navigation   +-----------------------------------------------+
|                      | Alerts / exceptions                            |
|                      |                                               |
|                      | Main content: Grid / Form / Show / custom     |
|                      |                                               |
+----------------------+-----------------------------------------------+
|                      | Footer                                        |
+----------------------+-----------------------------------------------+
```

稳定关系是区域位置、层级、导航方向和动作顺序，不代表 Bootstrap 的每个偶然像素都成为永久设计目标。

## 兼容面

### 服务端使用面

- `Content` 的标题、描述、面包屑、行、列、full-page 与自定义 view。
- `Grid` 的列、筛选、搜索、选择、分页、导出、行/批量动作、快捷创建、树表和自定义 displayer。
- `Form` 的字段、验证、布局、Tab、嵌套关系、上传、编辑器、异步提交和自定义 view。
- `Show`、`Tree`、Widgets、Renderable、Blade view 覆盖与扩展注册。
- `Admin::css/js/headerJs/script/style/html/requireAssets/view` 及资源别名。
- Section 插入点、Navbar/Menu 自定义内容、主题色、翻译和多应用配置。

### 浏览器使用面

2026-10-06：垂直侧栏main-menu固定视口，以100vh/100dvh覆盖高度，aside占满父容器；页面滚到页脚不再受wrapper底边推移或露出左下背景。品牌不收缩，菜单独立滚动并阻止边界滚动传播；桌面折叠/预览保留列占位、手机抽屉保持。1912×962/1024×400页顶页底、短视口长菜单及375×812抽屉最终CSS预览通过，build/artifact通过；消费应用尚未部署。见 [侧栏滚动修复](../../issues/030-x-ff-固定侧栏并消除底部空白.md)。

2026-10-06：公共Grid排序链接在捕获阶段隔离表头press并通过既有PJAX导航，兼容节点岛内普通a.grid-sort与原生表头共用，保留链接查询参数及修饰键/新窗口默认行为。90项runtime/grid/navigation回归、typecheck、build/artifact通过；实际支出金额降序/Enter升序/取消三阶段与375px日期排序最终JS预览通过，消费应用资源尚未部署。见 [表头排序修复](../../issues/029-x-ff-修复兼容表头排序点击.md)。

2026-10-05：公共顶栏nav-item显式隐藏列表标记，扩展直接插入navbar-right的li也不再泄漏圆点，通知按钮及语言下拉保持。Chrome extension1912/375px最终CSS验证全部6个导航项标记none、语言菜单正常，build/artifact通过；消费应用尚未部署。见 [顶栏圆点修复](../../issues/028-x-ff-去除顶栏导航列表圆点.md)。

2026-10-05：顶栏DarkModeSwitcher月亮/太阳图标固定20px，与铃铛一致；含主题开关的nav-link隐藏伪元素箭头，兼容历史Widget的dropdown-toggle标记，真实下拉箭头保持。Chrome extension1912/375px最终CSS深浅主题及鼠标/Enter验证通过，build/artifact通过，消费应用尚未部署。Issue017的接口修复未覆盖此视觉契约，见 [主题开关视觉修复](../../issues/027-x-ff-修复暗色开关尺寸与箭头.md)。

2026-10-05：手机侧栏的菜单叶子、外部点击、Escape与PJAX生命周期共用关闭入口，清除sidebar-open与桌面悬浮预览并同步aria-expanded及状态事件；分组保持展开、桌面sidebar-collapse保持。84项runtime/layout/navigation回归、typecheck、构建及artifact通过，Chrome extension375px菜单导航/分组/外部点击与320px Escape最终JS预览通过，消费应用资源尚未部署。见 [手机侧栏修复](../../issues/026-x-ff-修复手机侧栏自动收起.md)。

2026-10-05：公共间距兼容层补齐margin/padding七方向、25/50/75 rem档、margin负值/auto及sm/md/lg/xl响应式；保留整数0–5的既有4px档位。与Tailwind重名默认类仅在明确legacy island加强优先级，原生组件遵循原层级；响应式类可覆盖默认档位。编译CSS在375/576/768/1024/1280px各945类共4725例验证通过，真实9个邮件按钮mr-50为8px，原生隔离与断点覆盖通过；生产构建及artifact通过，消费应用资源尚未部署。见 [兼容间距修复](../../issues/025-x-ff-补齐兼容间距工具类.md)。

2026-10-05：QuickSearch::width()输出到label的rem宽度在现代兼容层生效；搜索form及label限制最大宽度，空间不足时可收缩。实际发票24rem/支出18rem在16px根字号下为384px/288px，768px超宽配置受容器限制；375/320px沿用原快速搜索隐藏断点。生产构建、artifact与实际页面临时CSS预览通过，消费应用资源尚未部署。见 [快速搜索宽度修复](../../issues/024-x-ff-恢复快速搜索配置宽度.md)。

2026-10-05：Native Grid列筛选form通过放大镜按钮/图标及Enter触发原生校验与PJAX GET提交，校验通过后收起菜单；重置链接使用同一导航生命周期。提交保留form action中其它查询参数并替换本次字段，避免表头React Aria press取消默认提交/重置。87项聚焦测试、类型、构建检查及实际支出页最终JS预览验证20–80为127条、重置恢复357条，Enter及375px图标提交通过；消费应用磁盘资源尚未部署。见 [列筛选提交修复](../../issues/023-x-ff-修复列筛选提交无响应.md)。

2026-10-05：Native Grid关闭列筛选时支持form内嵌套菜单并恢复原定位样式；输入区点击保持展开，重复图标点击、外部点击、Esc及其它菜单切换可收起。菜单触发器pointerdown不交给React Aria表头press，避免补发TH点击使菜单刚开即关。列筛选搜索/重置按钮同排且按内容宽度显示。54项聚焦测试、类型、构建检查与实际支出页桌面/375px最终资源临时预览通过；消费应用资源尚未部署，见 [列筛选弹窗修复](../../issues/022-x-ff-修复列筛选弹窗排版与关闭.md)。

2026-10-05：公共兼容层支持 `justify-content-around`；指标卡片内直接使用该布局的自定义指标采用16px间距并按完整指标换行，`font-xl` 标签18px、其 `h2` 金额24px/600字重与等宽数字。实际PayTax仪表盘桌面、375/320px及收入年度切换的临时CSS预览通过，编译规则一致；未部署消费应用，不扩大为整页窄屏导航验收。见 [指标排版修复](../../issues/021-x-ff-修复仪表盘指标排版.md)。

2026-10-04：保存响应触发的无PJAX同站整页跳转会暂存提示，新页面runtime一次性恢复并按当前默认6秒计时；目标路径须匹配，超过60秒或无效记录丢弃，不向跨站跳转携带。PJAX局部卸载保留可见/排队通知及原计时，只清理dialog/drawer；全局卸载/stop仍完全清理。59项聚焦测试通过；历史默认10秒时的实际设置页合成成功响应GET刷新验证新文档5.5秒提示可见、超过10秒关闭；未提交账号设置或部署消费资源。见 [保存换页通知修复](../../issues/019-x-ff-保留换页后的保存通知.md)。

2026-10-04：右上角自动关闭通知默认显示6秒，成功/失败/警告/普通通知共享 overlayStore 默认值，DcatReact.notify 复用该值；显式时长、0常驻和手动关闭保持，排队通知仍从实际显示时开始计时。store/bridge 26项聚焦测试与构建检查通过，消费应用尚未部署。默认值已按用户最新要求由10秒调为6秒，59项store/bridge/runtime回归、类型与构建检查通过，见 [6秒调整](../../issues/020-x-ff-调整通知默认时长为6秒.md)；[前轮时长调整](../../issues/018-x-ff-延长通知默认显示时长.md)保留历史证据。

2026-10-04：NativeDcat 创建时即提供 `darkMode.initSwitcher`，兼容 DarkModeSwitcher 的 inline 初始化；使用原生/compat init共同的DOM回调上下文，重复初始化不重复绑定。当前文档主题切换同步body dark-mode、配置、月亮/太阳图标及aria-pressed，旧span开关补键盘按钮语义；不新增跨刷新持久化契约。28项runtime测试与实际仪表盘最终编译JS响应预览验证初始脚本无新增错误、鼠标和Enter切换正常；消费应用磁盘资源未部署。见 [暗色开关接口修复](../../issues/017-x-ff-恢复暗色模式开关接口.md)。

2026-10-04：公共 `admin_trans_option` 将布尔选项值映射到0/1翻译键，false不再形成空键，数字/字符串键与null获取全选项行为保留。Show 包裹值框的内层背景继承外框圆角，避免遮挡边框四角。PHP8.1.34/Laravel10.50.3下8项回归、真实中英文选项文件检查，以及实际发票页1912/375/320px最终CSS圆角预览通过；消费应用旧包副本尚未更新，状态文字未进行部署后页面验证。见 [详情状态与圆角修复](../../issues/016-x-ff-修复详情状态翻译与值框圆角.md)。

2026-10-04：Show 的兼容面板标题与动作使用 flex 横排并允许换行，默认动作保留列表/编辑/删除顺序；字段标签对齐，包裹值框采用紧凑间距，小屏标签上排。关系 slot 限制最小宽度，表格内容不再撑宽其外层。实际发票详情最终编译 CSS 预览在1912/768/375/320px通过布局断言，保留字段列宽、原节点和动作协议；未执行业务动作或部署消费应用。320px顶部用户区另有既有溢出，不属于详情区验证通过的范围。见 [详情面板布局修复](../../issues/015-x-ff-修复详情面板布局.md)。

2026-10-04：公共header-navbar兼容样式保留导航链接及下拉菜单图片的行内排列，语言触发标签按内容宽度且不拆行，中英文国旗与文字横排。图片显式尺寸保留，展开/闭合箭头及原语言切换协议不变；实际设置页桌面/375px编译CSS预览验证国旗24×16px、菜单无横向溢出、头像仍32×32px，未提交语言切换请求或部署消费应用。见 [导航栏国旗排列修复](../../issues/014-x-ff-修复导航栏国旗排列.md)。

2026-10-04：公共 `Dcat.helpers.previewImage` 使用加载/成功/失败状态，加载中及失败时保留受视口约束的状态区，失败提示“Unable to load image.”；成功隐藏状态区并按原比例显示图片。监听先于src赋值，兼容缓存complete状态，关闭后清理图片监听并恢复可用的原焦点。40项runtime/overlay测试及实际设置页最终资源预览验证通过，错误分支使用损坏data图片、成功分支使用自有SVG；桌面/375/320px弹窗完整，无弹窗横向溢出。此修复保证预览状态显示，不恢复服务器头像文件，消费应用尚未部署。见 [图片预览失败修复](../../issues/013-x-ff-修复图片预览失败弹窗.md)。

2026-10-04：公共颜色工具类覆盖历史Dcat `_colors.scss` 的50个类，43组命名/语义背景与文字色由Tailwind主题取值；水鸭色 `bg-tear-1` 与 `text-tear-1` 为 `#00b5b5`。按钮同步边框、悬停/按下状态，禁用保留原色及透明度，标签横排。`primary/secondary` 与上游同名类冲突，旧颜色仅在 `.btn` 组合生效，原生组件和外壳保留上游语义；背景与文字不同色可组合。实际发票添加按钮桌面/375/320px、43组取色、129组交互状态及浅色/深色组件预览已验证，未部署消费应用。见 [公共颜色工具类修复](../../issues/012-x-ff-补齐公共颜色工具类.md)。

2026-10-04：公共 Layer 使用纵向 flex，标题和底部动作区不收缩，内容区在固定高度或视口高度限制内伸缩滚动；取消隐藏后恢复为 flex。标题栏默认支持主指针拖动，`move:false` 可禁用；标题内交互控件不启动拖动，拖动位置保留 16px 视口边距，缩小视口及恢复时重新约束，关闭后清理指针和 resize 监听。Chrome extension 在实际快速编辑中临时预览最终编译兼容资源，桌面/375/320px 的按钮、重置、关闭、拖动和内容滚动通过；独立弹窗验证保存回调、隐藏恢复和相邻布局，19 项 Layer/overlay 测试通过。未提交真实商品表单或部署消费应用。见 [快速编辑弹窗修复](../../issues/011-x-ff-恢复快速编辑弹窗底部按钮.md)。

2026-10-04：公共Grid分页使用左右对称的三列布局：范围信息在左、页码居中、每页数量选择器在右；任一侧区缺失时页码位置保持。React、Blade及兼容直接ul分页共享样式，575.98px以下页码跨列，长分页可换行。Chrome extension实际客户选择弹窗、普通列表的桌面及600/375/320px编译CSS预览通过，数量下拉菜单正常展开；临时兼容结构验证无重叠或横向溢出，未部署应用资源。见 [弹出Grid分页修复](../../issues/010-x-ff-居中弹出Grid分页.md)。

2026-10-04：Filter等兼容Select2单选控件的箭头使用与通用NativeSelect相同的ChevronDown路径、16px尺寸、2.25描边、fg-quaternary主题色及10px侧边距；展开方向与RTL逻辑侧边定位保留。实际支出筛选面板在桌面/375px预览编译CSS并验证键盘选择、原select节点及FormData值，未提交筛选请求。见 [Filter箭头修复](../../issues/009-x-ff-统一Filter下拉箭头.md)。

2026-10-04：公共 `Dcat.confirm()` 的确认卡片使用受弹窗宽度约束的 Grid 列，标题与正文支持无空格长文件路径换行；小屏动作可换行，过高内容在保留视口边距的弹窗内纵向滚动。上传删除使用此入口，确认仍调用原回调，取消与Escape不调用回调。桌面/375/320px通过Chrome extension实际页面编译CSS预览，弹窗无横向溢出，未执行真实删除。见 [上传删除确认弹窗修复](../../issues/008-x-ff-修复上传删除确认弹窗溢出.md)。

2026-10-04：新版 Form 重建标准卡片时保存 `formWidth()` 对应的外层 row/column 与安全结构属性，原生输入的显式宽度约束上游容器，百分比宽度只应用一次。横向表单在桌面保持标签右对齐，手机标签上排；原生和兼容字段的前置必填标记不重复。文本 affix 图标、帮助图标、品牌色上传按钮以及查看/新增保存动作的旧版蓝色区分已恢复。PayTaxNZ支出创建页在1912/1024/375px经过实际资源预览，聚焦回归测试验证 readonly/required、FormData、容器宽度及结构属性。仅声明布局与样式兼容；业务提交、实际上传和应用已有初始化报错不属于此证据。见 [消费表单修复](../../issues/007-o-修复消费表单布局与动作样式.md)。

2026-10-03：自定义登录模板的 `.login-page` 兼容样式支持品牌横排、`.has-icon-left` 输入框内图标和 `.form-label-group` 浮动标签，并消除 full-page 登录容器嵌套 padding 引起的窄屏挤压。原输入节点与提交协议保留；1280/375/320px 的空值、填写和错误反馈布局已通过 Chrome 扩展验证。这是限定登录页的兼容增量，不恢复旧 Bootstrap 整页样式。见 [登录布局修复](../../issues/004-x-ff-修复自定义登录页布局兼容.md)。

- `.wrapper`、sidebar、navbar、`.content-wrapper#pjax-container`、`#app` 等页面锚点。
- `Dcat.boot()`、`Dcat.ready/init/wait`、PJAX 事件和 jQuery 插件生命周期。
- `data-action`、`pjax-container`、表单 `name/id`、Grid 查询参数及现有 Dusk/扩展使用的关键选择器。
- Dcat-owned resource alias/facade、`@pjax`、`@select2` 等登记入口和发布路径；不得加载旧版整页 renderer 或 Bootstrap/AdminLTE runtime。

任意扩展可能依赖未文档化的内部 DOM。此类内容可以留在新版 compat island；未知内部选择器和旧版整页布局不属于稳定契约，也不提供旧 renderer 回退。

## 当前规模与验证证据

- B11 当前源码盘点为 140 个 Blade、821 个受盘点资源文件；旧 AdminLTE 与 Bootstrap 源码/编译目录已从 core 移除，包仍发布 modern 和 modern-compat 产物及 Dcat facade。
- 官方 Demo 基线记录了 81 个可达页面、33 个活动菜单入口；完整新版 View crawl 已在 [已归档执行记录](../../tasks/archived/2026-09-26-002-modern-view-single-renderer-demo-coverage.md) 中完成并按维护者决定收尾。
- 历史 PHP 8.1.34 / Laravel 10.50.3 证据包含资源发布、`modern:verify`、五视口浏览器合同、Demo 全路由 crawl、10 类 axe 页面、6 类语义 DOM/Tab 顺序和 30 个半宽 CSS 视口重排案例；代表性旧功能回归在隔离 SQLite 下通过 6 tests/30 assertions。Demo 覆盖 81 页、49 个 Controller、33 个活动菜单、30 组响应式和 27 项交互，296 条可见 registry 映射均有见证。2026-09-27 Review 修复后，当前 checkout 的 `modern:verify` 通过 16 个文件/113 项 Vitest 测试，PHP focused tests、PHP/Blade 静态检查、Bootstrap absence、构建和 artifact budget 通过。14 项能力的实现与状态记录已同步，Epic 已关闭；发布候选与 verified commit 仍按 M11 状态管理。其它 PHP/Laravel 组合已排除在验收范围外。历史证据见 [当前环境验证记录](../../epics/001-x-view-layer-modernization/m11-demo-laravel10-validation.json)、`artifacts/view-modernization-browser/2026-09-26-automated/` 与 `artifacts/dcat-admin-demo/2026-09-26-demo-witness-freshness-final/`。

历史 classic 基线仅作为对照证据；后续验证不要求部署旧 View，而以新版 native/compat 行为、稳定后端契约和 Demo 页面覆盖为准。

## 证据索引

- `src/AdminServiceProvider.php`：View namespace、服务注册与资源发布。
- `src/Layout/Content.php`：页面内容构建与布局配置。
- `src/Layout/Asset.php`、`src/Traits/HasAssets.php`、`src/Traits/HasHtml.php`：资源、内联代码与 HTML 解析协议。
- `resources/views/layouts/`、`resources/views/partials/`：页面骨架和稳定插入点。
- `resources/modern/`：新版 View、bridge、native/compat runtime 与样式。
- `scripts/view-modernization-bootstrap-absence.js`、`package.json`：旧 UI 依赖门禁与构建/验证入口。
- `tests/Browser/`：已有浏览器行为证据及选择器依赖。

2026-10-02 维护者决定：View 构建产物不设文件大小限制（绝对、相对、分资源和增量 chunk 均取消）。脚本保留 raw/gzip 观测、完整性、许可证、兼容与行为门禁；历史预算记录不再作为当前验收条件。

当前已证实的组件层事实（2026-10-02）：内建控件与容器已消费固定revision的Untitled UI OSS组件，Dcat适配层负责冻结的DOM/载荷协议；components.tsx只保留几何纯函数。主题值来自Tailwind @theme，43个旧CSS变量为兼容别名。简单Grid使用上游Table，复杂表头/展开/quick-create使用原生结构与TableCard；多选/optgroup/颜色等原生语义、插件与自定义原节点岛继续保留。旧Dcat.confirm返回dialog协议与新的DcatReact上游Modal并存。此增量由[当前执行结果](../../epics/002-o-untitled-ui-react-adoption/issues/005-o-完成-view-组件迁移与验收.md)证明；Epic002仍open，本段不表示Epic关闭或发布候选晋级。
