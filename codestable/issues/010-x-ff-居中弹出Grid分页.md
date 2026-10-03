---
kind: issue
title: 居中弹出Grid分页
type: ff
status: closed
created: 2026-10-04
---

# 居中弹出Grid分页

已修复弹出List Grid页码靠右的问题。公共分页容器原先使用flex/space-between，缺少每页数量选择器时把页码推至右侧；现在使用左右对称的三列布局，范围信息在左、页码居中、数量选择器在右，任一侧区缺失不影响页码位置。

- 改动：`resources/modern/styles.css` 覆盖React、Blade及兼容直接ul分页结构；575.98px以下页码跨列，长分页居中换行。旧数量选择器inline margin不干扰右侧16px边距，保留原选择器启用状态与d-sm显示约定。已编译 `resources/dist/`，CSS为 `dcat-modern-BAqTewHp.css`，JS仍为 `dcat-modern-vswbogst.js`；保留工作区已有修改。
- 验证：生产构建、artifact、diff检查通过。Chrome extension独立PayTaxNZ客户选择弹窗与支出列表预览编译CSS：桌面及600/375/320px页码中心偏差不超过0.016px，数量下拉在右侧、菜单可展开/闭合；无footer/nav横向溢出。临时600px克隆结构验证直接ul/pull-right、缺少range、仅有分页，中心偏差0px且数量选择器无重叠。截图：[弹窗桌面](../../artifacts/grid-pagination/dialog-desktop.png)、[列表桌面](../../artifacts/grid-pagination/list-desktop.png)、[弹窗320px](../../artifacts/grid-pagination/dialog-mobile-320.png)、[列表320px](../../artifacts/grid-pagination/list-mobile-320.png)。纯CSS修复采用实际布局验证，不新增实现镜像测试或重跑无关PHP/TS验证；构建有既有Sass弃用提示，无可调用独立子代理。未提交业务表单，临时覆盖及视口已清理，测试标签已关闭，应用资源尚未部署。
- codestable：已同步 [View规格](../spec/view-layer/index.md)；[Task已归档](../tasks/archived/2026-10-04-006-center-grid-pagination.md)，原010-o-ff按快改约定关闭为010-x-ff。不提交、不推送。
- 沉淀检查：无新增Talk/Note/Tool，本次属于公共分页样式的局部修复。
