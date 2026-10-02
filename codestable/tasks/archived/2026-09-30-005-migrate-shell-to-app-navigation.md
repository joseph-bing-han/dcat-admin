---
doc_type: task-list
task: migrate-shell-to-app-navigation
goal: 完成 Epic 002 的 S3：把后台外壳迁移到 Untitled UI app-navigation 结构与 Tailwind，并保持全部冻结锚点与门禁
status: archived
workflow: design
owner_skill: cs
created: 2026-09-30
updated: 2026-09-30
archived: 2026-09-30
related_docs:
  - codestable/epics/002-o-untitled-ui-react-adoption/spec.md
  - codestable/epics/002-o-untitled-ui-react-adoption/issues/004-o-迁移-shell-到-app-navigation.md
  - codestable/epics/001-x-view-layer-modernization/compatibility-contract.md
---

# 完成 Epic 002 的 S3：把后台外壳迁移到 Untitled UI app-navigation 结构与 Tailwind，并保持全部冻结锚点与门禁

## 1. 任务目标

按 Epic `002-o-untitled-ui-react-adoption` 的 S3 切片与 Issue `004-o-迁移-shell-到-app-navigation`，把侧栏（品牌头 + 菜单）、顶栏、页头/面包屑、页脚迁移到 Untitled UI `app-navigation` 结构与 Tailwind 类；vendor app-navigation 最小必要面并保持 provenance 纯净；保持 `data-dcat-*`、capability 门禁、fallback、260px/折叠/水平菜单/三档顶栏行为与全部冻结锚点。

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] vendor app-navigation（config / nav-item / nav-list）并登记排除原因与依赖
- [x] 新增 `resources/modern/shell/` 适配层（图标映射、品牌 logo 插槽、递归菜单）
- [x] `LayoutMenuView` 改为基于上游 `NavItemBase`，保留全部冻结行为
- [x] sidebar / navbar / breadcrumb / footer 的 Bootstrap 工具类改 Tailwind，并新增受限 `@source`
- [ ] 收口 `compat-facade.css` 与 `styles.css` 中已被 Tailwind 取代的 shell 规则
- [x] 更新受影响的 Vitest / 门禁期望（php-static、coverage、census）
- [ ] 跑通 `modern:verify`、复测体积并跑外壳浏览器契约

## 4. CodeStable 文档索引

- `codestable/epics/002-o-untitled-ui-react-adoption/spec.md`
- `codestable/epics/002-o-untitled-ui-react-adoption/issues/004-o-迁移-shell-到-app-navigation.md`
- `codestable/epics/001-x-view-layer-modernization/compatibility-contract.md`
- `codestable/epics/001-x-view-layer-modernization/ui-ux-spec.md`

## 5. 执行步骤

### 1. vendor app-navigation（config / nav-item / nav-list）并登记排除原因与依赖

- 状态：done

### 2. 新增 `resources/modern/shell/` 适配层（图标映射、品牌 logo 插槽、递归菜单）

- 状态：done

### 3. `LayoutMenuView` 改为基于上游 `NavItemBase`，保留全部冻结行为

- 状态：done

### 4. sidebar / navbar / breadcrumb / footer 的 Bootstrap 工具类改 Tailwind，并新增受限 `@source`

- 状态：done

### 5. 收口 `compat-facade.css` 与 `styles.css` 中已被 Tailwind 取代的 shell 规则

- 状态：pending

历史部分完成：styles.css 的菜单规则已收口；compat-facade 外壳段待后续验证。

### 6. 更新受影响的 Vitest / 门禁期望（php-static、coverage、census）

- 状态：done

### 7. 跑通 `modern:verify`、复测体积并跑外壳浏览器契约

- 状态：pending

历史部分完成：modern:verify 与体积验证已完成，浏览器契约移交批次 2。

## 6. 中断恢复提示

从第一个未完成步骤继续，并先以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

本切片的验证依赖 demo 运行环境：改动后需重跑 `tests/bin/install-dep.sh` 把包同步进 `laravel-tests/dcat-admin`，再 `install-admin.sh` 与 `tests/bin/start.sh`（详见 Issue 的验证节）。

## 7. 完成与归档记录

2026-09-30：Task 已创建。

2026-09-30：批次 1 完成并归档。

- 交付：vendor app-navigation 最小面（72 文件 / 411560 字节）、`resources/modern/shell/menu.tsx`（上游 `NavItemBase` + `details/summary`）、`LayoutMenuView`/`LayoutHeaderView` 更新、外壳 Blade 工具类 Tailwind 化、受限 `@source`、`styles.css` 菜单规则收口、`vitest.config.mts` 的 `@/*` 别名、`layout.test.tsx` 更新。
- 验证：`npm run modern:verify` 退出码 0（14 道门禁；artifact JS 110709 + CSS 32401 = 143110 gzip ≤ 143360；preflight 30 探针 0 差异；Vitest 113）。
- 用户授权：子预算重冻结 JS 102400 → 110848、CSS 40960 → 32512（总量与 ratio 不变），已记入 `performance-budget.json` 的 `subBudgetRevision`。
- 冻结契约同步：`m0/legacy-contracts.json` 的 sidebar 源字面量更新并附 note；coverage registry 与 census 重生成。
- 未完成项已写入 Issue [004-o-迁移-shell-到-app-navigation](../../epics/002-o-untitled-ui-react-adoption/issues/004-o-迁移-shell-到-app-navigation.md) 的「遗留」，批次 2 从那里继续。

过程中曾停在「JS 子预算超 8309 字节」的分叉上等授权；用户 2026-09-30 选择保留上游组件并重冻结子预算，决策与测量已记入 `performance-budget.json` 的 `subBudgetRevision`。

2026-09-30：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：157a7fc544d01101f77b6c921e6eb3e6721000c3b7f656e6080675f1e46a0fc3
