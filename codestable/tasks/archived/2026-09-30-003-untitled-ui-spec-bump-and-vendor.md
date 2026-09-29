---
doc_type: task-list
task: untitled-ui-spec-bump-and-vendor
goal: 完成 Epic 002 的 S0 规格升版与 S2 vendor 组件层，并把新增门禁接入 modern:verify
status: archived
workflow: design
owner_skill: cs
created: 2026-09-30
updated: 2026-09-30
archived: 2026-09-30
related_docs:
  - codestable/epics/002-o-untitled-ui-react-adoption/spec.md
  - codestable/epics/002-o-untitled-ui-react-adoption/issues/003-o-vendor-untitled-ui-组件层.md
  - codestable/epics/002-o-untitled-ui-react-adoption/token-mapping.md
---

# 完成 Epic 002 的 S0 规格升版与 S2 vendor 组件层，并把新增门禁接入 modern:verify

## 1. 任务目标

完成 Epic 002 的 S0 规格升版与 S2 vendor 组件层，并把新增门禁接入 modern:verify

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 把 ui-ux-spec 升到 2.0.0、compatibility-contract 升到 5.0.0，并同步契约指纹与门禁期望版本
- [x] 按上游 revision vendor 组件源码到 resources/modern/ui，建立 provenance 与离线门禁，登记新增依赖
- [x] 按 AA 实测确定状态色口径并写回映射表与规范
- [x] 跑通 modern:verify 全链并回写 Epic Spec 与 Issue

## 4. CodeStable 文档索引

- `codestable/epics/002-o-untitled-ui-react-adoption/spec.md`
- `codestable/epics/002-o-untitled-ui-react-adoption/issues/003-o-vendor-untitled-ui-组件层.md`
- `codestable/epics/002-o-untitled-ui-react-adoption/token-mapping.md`

## 5. 执行步骤

### 1. 把 ui-ux-spec 升到 2.0.0、compatibility-contract 升到 5.0.0，并同步契约指纹与门禁期望版本

- 状态：done

### 2. 按上游 revision vendor 组件源码到 resources/modern/ui，建立 provenance 与离线门禁，登记新增依赖

- 状态：done

### 3. 按 AA 实测确定状态色口径并写回映射表与规范

- 状态：done

### 4. 跑通 modern:verify 全链并回写 Epic Spec 与 Issue

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-09-30：Task 已创建。

2026-09-30：S0 完成。`ui-ux-spec` 1.1.0 → 2.0.0（组件与样式来源节、上游字号体系、状态色 AA 结论、兼容与 preflight 节、AI 门禁第 4/6/8/9 条重写、维护归属与毕业说明）；`compatibility-contract` 4.0.0 → 5.0.0（C3 改为规定 Tailwind v4 接入方式、新增「组件来源与 provenance」节、变更控制与破坏性判定各加一条）。指纹同步：`implementation-capability-matrix.json` 的 `targetContracts` 更新为 2.0.0/5.0.0 与新 sha256；`view-modernization-baseline.js` 的期望版本由 1.1.0/4.0.0 改为 2.0.0/5.0.0。M0 baseline 门禁通过。

2026-09-30：状态色口径落定并实现。上游 600 档实测 success 3.22:1 / warning 2.94:1 不满足规范 4.5:1；实现为保留上游语义变量名、值取 AA 达标档（error 6.57 / success 5.41 / warning 5.43），`info` 为 Dcat 扩展，上游基础色阶不动。写回 `token-mapping.md` 与 `ui-ux-spec` 2.0.0。

2026-09-30：S2 完成。新增维护工具 `scripts/view-modernization-vendor-untitled-ui.mjs`（默认拉取并刷新 provenance；`--check` 离线校验；`--check-upstream` 比对上游文件树），vendor 69 文件 / 403842 字节到 `resources/modern/ui/`，逐文件 sha256 + 排除原因；`tsconfig.json` 改为 `paths` 相对解析（TypeScript 7 已移除 `baseUrl`），`vite.config.mts` 增加 `@/*` 别名使上游文件保持原样；`resources/modern/ui/PATCHES.md` 登记改动约定与后续适配点；notices 门禁的依赖图根加入 vendor 运行时包（16 → 20 个包）并按族汇总 vendor 清单；`modern:vendor` 接入 `modern:verify`。

2026-09-30：`npm run modern:verify` 退出码 0（coverage 303/296/870、grid 28/36/22、form 68、tokens 43、baseline、vendor 69、php-static、bootstrap-absence、typecheck、Vitest 113、build、artifact JS 98131 + CSS 31865 = 129996 gzip、Chrome self-test、preflight 30 探针 0 差异）。体积余量由 25891 降至 13364，原因是 `@source` 的文件级探测会为尚未引用的 vendor 组件预生成 utility；已记入 Epic 的 R2 与 S2 结果。

2026-09-30：Task 已标记 completed，等待归档。

2026-09-30：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：705a2f93cb754b13dcd165c6ff446b1bb220e5a2f724b98cbf81ab3a22cc9a83
