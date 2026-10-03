---
doc_type: task-list
task: restore-consumer-form-layout
goal: 恢复消费应用表单宽度、字段布局与动作颜色契约
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-04
updated: 2026-10-04
archived: 2026-10-04
related_docs:
  - codestable/issues/007-o-修复消费表单布局与动作样式.md
  - codestable/spec/view-layer/index.md
---

# 恢复消费应用表单宽度、字段布局与动作颜色契约

## 1. 任务目标

恢复消费应用表单宽度、字段布局与动作颜色契约

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 保存表单外层布局和控件显式宽度并补充回归测试
- [x] 修复标签、上传与保存按钮样式并构建资源
- [x] 执行聚焦测试与实际页面响应式验证

## 4. CodeStable 文档索引

- `codestable/issues/007-o-修复消费表单布局与动作样式.md`
- `codestable/spec/view-layer/index.md`

## 5. 执行步骤

### 1. 保存表单外层布局和控件显式宽度并补充回归测试

- 状态：done

### 2. 修复标签、上传与保存按钮样式并构建资源

- 状态：done

### 3. 执行聚焦测试与实际页面响应式验证

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-04：Task 已创建。

2026-10-04：布局与样式实现完成：保存外层 row/column 及安全属性，输入容器适配80px与百分比宽度，恢复标签右对齐、前置星号、文本 affix/help 图标、上传按钮和保存颜色。17项聚焦测试、TypeScript、生产构建通过。Chrome extension 独立创建页通过非Document资源拦截预览本次JS/CSS，1912px下卡片宽1032.66px、外层列1048.66px（8/12），readonly抵税率输入与容器均80px；按钮及上传颜色符合旧版值。正在验证手机与产物门禁。

2026-10-04：最终17项 Form/controls 测试、typecheck、生产构建、artifact、tokens、form-capabilities、bootstrap-absence、git diff --check通过。新增动作颜色已纳入 Dcat Tailwind主题，未修改上游组件。最终产物 JS=dcat-modern-vswbogst.js、CSS=dcat-modern-BLRRIn3U.css，manifest与facade同步生成。实际Chrome extension预览最终JS/CSS：1912px外层列1048.66/1573=8/12，卡片1032.66px，日期/金额120px、readonly抵税率80px，标签右对齐，上传品牌色，查看#4277cf、新增#007ee5；1024px列456.66/685=8/12；375px卡片312px，标签上排，footer两行相隔8px，表单区域无横向溢出。视口切换后3个上传input原节点与FormView仍保留。截图位于artifacts/expense-form-layout/desktop-1912.png和mobile-375.png。全页375px仍有外壳导航轻微横向溢出（scrollWidth384），未扩大到导航调整；页面在预览前已记录$未定义及darkMode.initSwitcher错误，业务提交与实际上传未验证。构建有既有Sass弃用提示。独立预览标签页已关闭，未修改PayTaxNZ磁盘资源、数据库或业务数据，无独立子代理工具，不声称独立Review。归档后回写007-o Issue与View spec，Issue保持open，不提交或推送。

2026-10-04：Task 已标记 completed，等待归档。

2026-10-04：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：a53e98af445e035e0ff0102640dd22aad0303a1db10bea8e66f6f86b39c5c5d5
