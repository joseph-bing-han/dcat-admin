---
kind: issue
title: 统一Filter下拉箭头
type: ff
status: closed
created: 2026-10-04
---

# 统一Filter下拉箭头

已统一Filter与通用下拉控件的箭头。Select2原先使用5px/4px边框组成的实心三角，现在使用与NativeSelect相同的ChevronDown路径、16px尺寸、2.25描边和10px侧边距，颜色沿用fg-quaternary主题值；展开时向上，闭合时向下。

- 改动：`resources/modern/styles.css` 的公共Select2单选箭头样式使用SVG mask并移除原三角边框，使用逻辑侧边定位，为文本保留28px尾部间距；已重建 `resources/dist/`，manifest CSS为 `dcat-modern-Dj9mFheC.css`，JS仍为 `dcat-modern-vswbogst.js`。未修改上游文件、Select2节点或请求协议，保留工作区已有修改。
- 验证：生产构建、artifact、diff检查通过。Chrome extension独立实际支出列表页预览编译CSS，桌面/375px箭头均16px、距控件右边10px，无文本/清除按钮重叠；展开旋转180度，键盘选择后原select节点与FormData值保持，RTL箭头距左侧10px。截图：[桌面](../../artifacts/filter-select-arrow/desktop.png)、[375px](../../artifacts/filter-select-arrow/mobile-375.png)。纯CSS修复不新增实现镜像测试；未提交筛选请求或修改业务数据，测试页与临时覆盖已清理，应用资源尚未部署。构建有既有Sass弃用提示，无独立子代理工具。
- codestable：已同步 `spec/view-layer/index.md` 的Select2与通用箭头视觉兼容事实；[Task已归档](../tasks/archived/2026-10-04-005-unify-filter-select-arrow.md)，原009-o-ff按快改约定关闭为009-x-ff。不提交、不推送。
- 沉淀检查：无新增Talk/Note/Tool，本次属于现有公共控件样式的局部修复。
