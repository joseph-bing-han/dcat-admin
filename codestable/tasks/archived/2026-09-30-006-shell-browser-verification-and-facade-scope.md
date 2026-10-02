---
doc_type: task-list
task: shell-browser-verification-and-facade-scope
goal: 起真实消费者环境验证 S3 外壳契约，修正批次 1 引入的折叠态品牌回归并把它变成门禁，同时界定 facade 收口范围
status: archived
workflow: design
owner_skill: cs
created: 2026-09-30
updated: 2026-09-30
archived: 2026-09-30
related_docs:
  - codestable/epics/002-o-untitled-ui-react-adoption/spec.md
  - codestable/epics/002-o-untitled-ui-react-adoption/issues/004-o-迁移-shell-到-app-navigation.md
  - codestable/epics/001-x-view-layer-modernization/m0/legacy-contracts.json
---

# 起真实消费者环境验证 S3 外壳契约，修正批次 1 引入的折叠态品牌回归并把它变成门禁，同时界定 facade 收口范围

## 1. 任务目标

按 Issue `004-o-迁移-shell-到-app-navigation` 的「遗留」清单推进：起真实消费者环境（laravel-tests + 隔离 MySQL + 夹具路由），跑通 `--shell-only` 与全量浏览器契约，同步 `demo:browser` 的菜单选择器，并对 `compat-facade.css` 的外壳段给出「本批删除 vs 留待 S6」的判定。

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 起真实消费者环境：Laravel 10 消费者 + 隔离 MySQL 库 + `serve-fixtures.php` 夹具路由
- [x] 跑通 `--shell-only` 外壳契约（7 profiles）
- [x] 跑通全量浏览器契约（25 captures / 6 families / axe / reflow / rollback）
- [x] 同步 `scripts/dcat-admin-demo-browser.mjs` 的菜单选择器到新 DOM
- [x] 定位并修正批次 1 引入的折叠态品牌回归（`logo-mini` 上的 `hidden` 抹掉折叠品牌）
- [x] 把「折叠态品牌 + 菜单标签」断言加入 shell 门禁，并用负向注入验证该门禁会失败
- [x] 判定 facade 外壳段的收口范围，并回写 Issue / Epic

## 4. CodeStable 文档索引

- `codestable/epics/002-o-untitled-ui-react-adoption/spec.md`
- `codestable/epics/002-o-untitled-ui-react-adoption/issues/004-o-迁移-shell-到-app-navigation.md`
- `codestable/epics/001-x-view-layer-modernization/m0/legacy-contracts.json`
- `codestable/epics/001-x-view-layer-modernization/m0/performance-budget.json`

## 5. 执行步骤

### 1. 起真实消费者环境：Laravel 10 消费者 + 隔离 MySQL 库 + `serve-fixtures.php` 夹具路由

- 状态：done

### 2. 跑通 `--shell-only` 外壳契约（7 profiles）

- 状态：done

### 3. 跑通全量浏览器契约（25 captures / 6 families / axe / reflow / rollback）

- 状态：done

### 4. 同步 `scripts/dcat-admin-demo-browser.mjs` 的菜单选择器到新 DOM

- 状态：done

### 5. 定位并修正批次 1 引入的折叠态品牌回归（`logo-mini` 上的 `hidden` 抹掉折叠品牌）

- 状态：done

### 6. 把「折叠态品牌 + 菜单标签」断言加入 shell 门禁，并用负向注入验证该门禁会失败

- 状态：done

### 7. 判定 facade 外壳段的收口范围，并回写 Issue / Epic

- 状态：done

## 6. 中断恢复提示

环境配方（下次复用，注意两个坑）：`tests/bin/install-dep.sh` 会覆盖 `laravel-tests/.env` 并把包**复制**到 `laravel-tests/dcat-admin`（vendor 里是指向该副本的符号链接，不是指向仓库工作树），因此每次改完代码都要 `rm -rf laravel-tests/dcat-admin` 重跑 install-dep + `DCAT_INSTALL_DUSK=0 install-admin.sh`，并重打 `.env` 的 DB 配置。另外一个坑：不要在浏览器契约运行期间跑 `modern:verify`（它会重建 dist 并临时改写 Tailwind 入口）。

## 7. 完成与归档记录

2026-09-30：Task 已创建。

2026-09-30：完成。

- 环境：PHP 8.1.34 + Laravel 10.50.3 消费者；隔离库 `dcat_dusk`（含 `admin_users.email`/`profile` 夹具列与 26 行数据）；服务用 `php -S 127.0.0.1:8300 -t laravel-tests/public tests/bin/serve-fixtures.php`（M0 兼容夹具需要 missing-manifest）。
- 证据：`--shell-only` 退出码 0（9 profiles，含新增的品牌/菜单标签断言）；全量浏览器契约退出码 0（25 profile/viewport captures、6 个 modern family、axe、200% reflow、rollback profiles）；`npm run modern:verify` 退出码 0（artifact JS 110709 + CSS 32374 = 143083 gzip）。
- 缺陷：批次 1 在 `logo-mini` 上加了 Tailwind `hidden`，折叠态品牌被隐藏；几何与全量门禁都没发现（已用探针确认并修正）。新增断言后，负向注入同一缺陷会让门禁以 `collapsed: brand or menu-label state is wrong` 失败。
- facade：判定本批不删除外壳段规则。原因是这些规则同时服务 React 菜单与「服务端 fallback」两条路径（fallback 用的是同一套 `.main-sidebar/.nav-header/.nav-link` 标记），且几何/装饰的删除缺少视觉基线比较能力；按 Epic 计划归属 S6（facade 按新令牌重写）与 S7（视觉基线整批重做）。
- 顺带发现：`modern:verify` 的 census 顺序缺陷又触发两次（构建后 census 立即过期），继续按 S7 处理并记入 Epic。

2026-09-30：Task 已原子移动到 archived，active 正本已移除。

2026-09-30：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：8d94ea6fe5288d65cbf4c23378b5344aa773616ae9ca22982be10602a6dd9096
