---
doc_type: task-list
task: restore-color-utilities
goal: 统一补齐公共颜色类并恢复发票添加按钮显示
status: archived
workflow: fast
owner_skill: cs
created: 2026-10-04
updated: 2026-10-04
archived: 2026-10-04
related_docs:
  - codestable/issues/012-o-ff-补齐公共颜色工具类.md
  - codestable/spec/view-layer/index.md
---

# 统一补齐公共颜色类并恢复发票添加按钮显示

## 1. 任务目标

统一补齐公共颜色类并恢复发票添加按钮显示

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 实现公共颜色工具类并编译资源
- [x] 验证完整颜色集合和真实按钮并闭环记录

## 4. CodeStable 文档索引

- `codestable/issues/012-o-ff-补齐公共颜色工具类.md`
- `codestable/spec/view-layer/index.md`

## 5. 执行步骤

### 1. 实现公共颜色工具类并编译资源

- 状态：done

### 2. 验证完整颜色集合和真实按钮并闭环记录

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-04：Task 已创建。

2026-10-04：实测发票添加按钮bg-tear-1 text-white为白底白字，公共facade仅实现过bg-blue-1。旧Dcat _colors.scss及theme/_colors.scss作为命名色依据，tailwind.css集中新增颜色值，facade补齐43组bg/text颜色、透明背景、深色文字别名和品牌渐变；按钮边框及hover/active状态统一，禁用保留原色，主题语义色不变。生产构建完成CSS 8PFop-uR，JS仍vswbogst；tokens/artifact已通过，继续完整颜色与真实按钮浏览器验证。

2026-10-04：实际预览发现bg-primary/text-primary等旧语义名与上游Tailwind同名类冲突，会误改侧栏/textarea/footer。已将primary和secondary的bg/text规则限定.btn组合，保留原现代组件语义；其他命名颜色继续全局按modern-active作用域实现。添加按钮实测恢复#00b5b5背景和边框、白字；标签因flex布局拆字，公共.btn补white-space:nowrap。重新构建后复核原生组件与所有颜色，不以首次预览作为最终交付。

2026-10-04：最终CSS BRhDYWJo、JS仍vswbogst。生产构建、tokens、artifact、bootstrap-absence和diff通过；对照历史Dcat _colors.scss的50个颜色类无遗漏。Chrome extension隔离发票页预览最终编译CSS：添加按钮#00b5b5背景/边框、白字、图标与文字横排，悬停深色、水鸭色焦点环保持；375/320px按钮70.22x44px且完整位于视口。43组按钮背景/边框与文字计算色检查无失败，129组active/disabled-class/disabled-attribute无失败，bg-tear-1 text-orange-2组合独立取色，渐变非none。primary/secondary仅在旧.btn组合实现，未误改上游bg-primary/text-primary；原生textarea浅色白底/深色rgb(3,7,18)，对应深色文字正确，sidebar/footer浅色白底。截图artifacts/color-utilities/invoice-desktop.png、invoice-375.png。纯CSS改动以聚焦浏览器验证覆盖，不新增实现镜像测试、不重跑无关PHP/TS测试；保留既有Sass弃用提示，无可调用独立子代理。临时样式/节点、强制hover、dark-mode和视口均已清理，测试页关闭，无业务保存、无应用部署。截图中的快速编辑底部裁切属于既有011修复，不重复修改。归档后012-o-ff改012-x-ff，回写Issue和View spec，无新增Talk/Note/Tool，不提交不推送。

2026-10-04：Task 已标记 completed，等待归档。

2026-10-04：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：d762ac17bfd27a069e2ab3a31f71e5156b2fc0205fbaad80eb9bac16ee76ae82
