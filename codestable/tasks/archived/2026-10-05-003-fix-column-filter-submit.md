---
doc_type: task-list
task: fix-column-filter-submit
goal: 恢复列筛选放大镜按钮提交与PJAX结果更新
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-05
updated: 2026-10-05
archived: 2026-10-05
related_docs:
  - codestable/issues/023-o-ff-修复列筛选提交无响应.md
  - resources/modern/runtime.ts
---

# 恢复列筛选放大镜按钮提交与PJAX结果更新

## 1. 任务目标

恢复列筛选放大镜按钮提交与PJAX结果更新

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 修复列筛选提交链路并回归测试
- [x] 构建并验证实际请求和结果再回写

## 4. CodeStable 文档索引

- `codestable/issues/023-o-ff-修复列筛选提交无响应.md`
- `resources/modern/runtime.ts`

## 5. 执行步骤

### 1. 修复列筛选提交链路并回归测试

- 状态：done

### 2. 构建并验证实际请求和结果再回写

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-05：Task 已创建。

2026-10-05：实际消费页当前使用前轮Bx5aSlRP脚本，20–80点击未发出请求；新增4个回归修复前失败。runtime显式requestSubmit并纳入列筛选GET表单，校验后关闭菜单，经form action合并字段保留其它查询参数。85项runtime/navigation/compat-overlays回归、typecheck、生产build、artifact、diff-check通过；继续最终编译JS实际请求验证。

2026-10-05：最终87项runtime/navigation/compat-overlays测试、typecheck、生产build、artifact、diff-check通过。Chrome官方扩展在独立实际支出页临时加载最终编译JS：20–80点击按钮/图标发出GET Fetch，357条变127条，当前页20项金额绝对值均20–80；Enter改20–50发出GET并变99条；375px图标提交20–80变127条。发现重置也被表头press阻止，已补显式PJAX并加回归；最终CBt0P7HT脚本重新验证图标提交20–80为127条、重置回无过滤URL与357条、输入清空。warn/error为空。消费目录未部署；仅GET读取业务数据。临时标签、拦截、缓存覆盖、视口和静态服务器均清理。归档后回写023-x-ff和当前View规格；无Talk/Note/Tool增量，无子代理接口，当前会话自查而非独立review。

2026-10-05：Task 已标记 completed，等待归档。

2026-10-05：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：2c70733cb0a712e54b5144e51607241bf61be8574e9a3b3a8ae5c06f18134e53
