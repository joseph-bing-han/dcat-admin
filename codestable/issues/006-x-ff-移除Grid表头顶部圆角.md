---
kind: issue
title: 移除 Grid 表头顶部圆角
type: ff
status: closed
created: 2026-10-04
---

# 移除 Grid 表头顶部圆角

Grid 的灰色表头被 `.dcat-modern-grid-table-card` 的圆角裁剪，导致与上方工具栏交界处出现圆角。已将表格卡片顶部两角设为直角，保留底部及 Grid 外壳的圆角。

- 改动：`resources/modern/styles.css` 中表格卡片改为 `border-radius: 0 0 var(--dcat-modern-radius-panel) var(--dcat-modern-radius-panel)`，重建 `resources/dist/` 发布资源；保留前一项提示框间距修复。
- 验证：官方 Chrome extension 在独立 PayTaxNZ 支出列表标签页临时加载构建 CSS，实测顶部两角 0px、底部两角及 Grid 外壳 12px，截图确认灰色表头直角。首屏 Blade 与 React 接管共用该卡片 class。`npm run prod`、`npm run artifact`、`git diff --check` 通过；纯 CSS 调整，未运行 PHP/Laravel 或全量测试。预览标签页已清理，未修改业务系统资源。
- codestable：局部样式调整，无架构、协议或规格增量；执行结果记录在本事项与 Task。
- 沉淀检查：无独立 Talk、Note、Tool 增量。

原路径为 `006-o-ff-移除Grid表头顶部圆角.md`。执行记录：[已归档 Task](../tasks/archived/2026-10-04-002-square-grid-header-corners.md)。改动未提交、推送或部署到业务系统。
