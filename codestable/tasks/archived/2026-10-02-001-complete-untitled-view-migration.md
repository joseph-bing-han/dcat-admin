---
doc_type: task-list
task: complete-untitled-view-migration
goal: 完成 Untitled UI View 组件迁移、令牌收口与当前消费者验收
status: archived
workflow: implementation
owner_skill: cs
created: 2026-10-02
updated: 2026-10-02
archived: 2026-10-02
related_docs:
  - codestable/epics/002-o-untitled-ui-react-adoption/issues/005-o-完成-view-组件迁移与验收.md
  - codestable/epics/002-o-untitled-ui-react-adoption/spec.md
---

# 完成 Untitled UI View 组件迁移、令牌收口与当前消费者验收

## 1. 任务目标

完成 Untitled UI View 组件迁移、令牌收口与当前消费者验收

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 迁移 Grid 并验证复杂表头与展开行协议
- [x] 迁移 Form 并验证控件载荷与错误定位
- [x] 迁移其余页面族与浮层并退役自研 DOM 组件
- [x] 收口主题令牌与兼容样式并修复验证顺序
- [x] 完成构建与真实消费者五视口验收并准备回写

## 4. CodeStable 文档索引

- `codestable/epics/002-o-untitled-ui-react-adoption/issues/005-o-完成-view-组件迁移与验收.md`
- `codestable/epics/002-o-untitled-ui-react-adoption/spec.md`

## 5. 执行步骤

### 1. 迁移 Grid 并验证复杂表头与展开行协议

- 状态：done

### 2. 迁移 Form 并验证控件载荷与错误定位

- 状态：done

### 3. 迁移其余页面族与浮层并退役自研 DOM 组件

- 状态：done

### 4. 收口主题令牌与兼容样式并修复验证顺序

- 状态：done

### 5. 完成构建与真实消费者五视口验收并准备回写

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-02：Task 已创建。

2026-10-02：Grid 已接入上游 Table/TableCard 与链接 Button，5 个既有行为测试通过。穿刺发现 React Aria 过滤 scope/width，已在列 ref 恢复公开属性；复杂表头、展开行、快速新增仍保持原生表格结构。首次构建 JS 172.17k/CSS 32.81k gzip，原总预算 143360 无法覆盖上游 Table 引入的 collection 运行时；后续先收口重复样式再测最终成本。Chrome extension 已连接，消费者 8300 未启动。旧 Task 格式已修复，scan 无冲突；原未完成项保留 pending，不篡改历史结果。

2026-10-02：Form 基本控件接入 InputBase/TextAreaBase/NativeSelect/CheckboxBase/RadioButtonBase/ToggleBase，9 项既有测试通过。用户明确选择保留完整上游迁移、按最终实测重定预算；最终预算修改已授权，保持体积量测与来源证据。PHP 8.1.34 / Laravel 10.50.3 服务已在 127.0.0.1:8300 启动，未修改数据库与消费者环境。

2026-10-02：2026-10-02：用户最终决定彻底取消文件大小限制，替代按实测重定预算。artifact/baseline 的绝对、相对和分资源大小门禁已移除；规格、兼容契约和发布清单同步为仅观测，历史结果保留。Form/Show/Tree 与 presentation 已接入上游组件，原 primitives DOM 实现退役；令牌改为 Tailwind 的 43 个兼容别名。仍需解决 Popover outside input 验证、旧样式覆盖和最终消费者验收，不声明整体完成。

2026-10-02：2026-10-02：Popover 外部输入测试修正为真实 pointerdown/click 后通过，presentation 与 Widget 14 项测试通过，typecheck 通过。Widget 工具按钮、进度条与 Tree 创建按钮接入上游组件；旧 primitives 视觉规则退役，原生 form-control 不再被兼容视觉覆盖，同名工具类移入 base 层。Chrome extension 已登录消费者；发现全局 UA 补偿侵入上游菜单，已限定到兼容岛并更新对应探针。新增 Select/FormData/非活动 Tab 与复杂 Grid/quick-create/固定列协议测试，完整 verify 正在执行。

2026-10-02：2026-10-02：preflight 基线改为只移除 preflight 与补偿层，保留主题及 utilities；30 探针 0 差异。当前环境 PHP focused tests 20 tests/117 assertions 通过。Chrome 手机 Grid 无整页溢出，axe 无违规；修复根字号14导致标题21px，改根字号16与主题display-xs。Grid Badge/Progress/展开 Button 迁移；标签显式颜色切换与单选视觉/reset 回归已修复并测试通过。最终 verify 与五视口消费者证据继续执行。

2026-10-02：2026-10-02：Chrome extension 已完成六页面族和九外壳变体的五视口检查，共75组几何/截图，全部无整页溢出，15代表页 axe无违规；30组半宽CSS视口200%重排代理无溢出。Modal焦点约束/取消后焦点恢复、Drawer点击面/Escape关闭通过；真实Select2下拉、TinyMCE、Markdown及6上传器加载成功。折叠菜单名称、外链属性、密码按钮触控尺寸、进度名称及页脚链接识别已修复。独立子代理工具不可用，已做当前会话代码复核；额外在线上游树校验HTTP403，73文件本地来源哈希门禁通过。证据位于artifacts/view-migration-2026-10-02/；不把代理重排声明为原生缩放或人工读屏。

2026-10-02：2026-10-02：五个执行步骤完成。最终完整 modern:verify 通过17文件/117前端测试、typecheck、来源/许可证、构建与静态门禁；最后仅按钮下划线样式修正又通过build/artifact/coverage/preflight，30探针0差异。PHP8.1.34/Laravel10.50.3 focused tests20/117通过。最终Chrome extension基线16代表页/80五视口captures均无溢出、axe0违规，另30重排代理无溢出；实际产物JS195832+CSS31586=227418gzip字节，不设大小门禁。复杂Grid保留原生结构并由TableCard包裹；Form多选/分组/颜色等保持原生协议；旧节点岛与旧Dcat.confirm兼容API继续有效，不冒称全部原生化。回写目标：Issue005结果与验证；Epic002 S4-S7状态、适配边界和证据；ProjectSpec仅当前证实事实。不关闭Issue/Epic、不提交/推送/部署。独立审查/原生UI缩放/人工读屏未执行，额外上游树在线核验403已注明。

2026-10-02：Task 已标记 completed，等待归档。

2026-10-02：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：48c8dad76bca3019e01395df71cbda7891bd9465840b35467b0b4cf250b7ec6b
