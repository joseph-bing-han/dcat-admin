---
doc_type: task-list
task: fix-navbar-flag-layout
goal: 修复导航栏语言菜单国旗与文字排列
status: archived
workflow: fast
owner_skill: cs
created: 2026-10-04
updated: 2026-10-04
archived: 2026-10-04
related_docs:
  - codestable/issues/014-o-ff-修复导航栏国旗排列.md
  - codestable/spec/view-layer/index.md
---

# 修复导航栏语言菜单国旗与文字排列

## 1. 任务目标

修复导航栏语言菜单国旗与文字排列

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 调整导航栏图标布局并编译资源
- [x] 验证语言菜单布局并闭环记录

## 4. CodeStable 文档索引

- `codestable/issues/014-o-ff-修复导航栏国旗排列.md`
- `codestable/spec/view-layer/index.md`

## 5. 执行步骤

### 1. 调整导航栏图标布局并编译资源

- 状态：done

### 2. 验证语言菜单布局并闭环记录

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-04：Task 已创建。

2026-10-04：公共header-navbar导航链接和下拉菜单图片恢复inline-block/vertical-align:middle；dropdown-language触发标签width:auto且nowrap，菜单标签nowrap，保留图片尺寸和切换协议。生产构建、artifact、diff通过，CSS xBLKkmsG，JS保持DBMYIjW0。Chrome实际设置页国旗与文字垂直差原18px，新约1.3px，国旗24x16px，文字位于图片右侧4px；中英文展开项横排，继续箭头、375px与头像验证。

2026-10-04：Chrome extension独立实际设置页最终编译CSS预览：国旗24x16px，图片display由block变inline-block，国旗与文字垂直差由18px降至约1.3px，文字从国旗右侧4px开始；中文/English (NZ)触发标签及两项展开菜单均保持横排。展开箭头矩阵对应向上，闭合恢复向下，aria-expanded正确。仅临时将触发标签替换为现有英文菜单HTML验证较长标签，未提交语言切换POST。375px菜单完整位于视口内、无菜单横向溢出，触发控件44px高、头像仍32x32px。截图artifacts/navbar-flag-layout/desktop.png（展开）及mobile-375.png（英文标签）；临时HTML、CSS、视口已清理，测试页关闭。生产构建、artifact、diff通过，JS保持DBMYIjW0、CSS xBLKkmsG；纯CSS修复使用实际浏览器布局验证，不新增实现镜像测试或重跑无关PHP/TS验证，构建保留既有Sass弃用提示，无独立子代理工具。归档后014-o-ff改014-x-ff，回写Issue和View spec，无新增Talk/Note/Tool，不提交推送或部署。

2026-10-04：Task 已标记 completed，等待归档。

2026-10-04：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：e6865afc64d251b979b0589742f2a455a869944212feb73a9f9f8cef2c8d247d
