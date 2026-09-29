# 本地对 vendor 源码的改动

本目录是 Untitled UI React 开源组件源码（上游 revision 见 `../vendor/untitled-ui/PROVENANCE.json`）。
文件按上游路径镜像，**默认保持原样**，以便未来按 commit diff 升级。

约束（`compatibility-contract.md` 5.0.0「组件来源与 provenance」）：

- 任何本地改动都必须在本文件登记：文件、原因、改动摘要、以及是否可回填上游。
- 改动后必须运行 `node scripts/view-modernization-vendor-untitled-ui.mjs` 更新 sha256；
  但请把改动**写在适配层而不是原地改上游文件**，除非确无替代方案。

## 当前登记

（暂无）

## 已知需要在后续切片处理的适配点

| 位置 | 问题 | 处理方向 |
|---|---|---|
| `components/application/app-navigation/sidebar-navigation/sidebar-simple.tsx` | 引用上游品牌 logo `@/components/foundations/logo/untitledui-logo` | S3 纳入 shell 时改为可注入的品牌插槽，不 vendor 上游 logo |
| `components/application/app-navigation/base-components/nav-account-card.tsx` | 引用 `@/hooks/use-breakpoint` 与 `@react-types/overlays` | S3 按需纳入，并补上缺失的 hook 或改为 Dcat 自有实现 |
| `components/application/empty-state/empty-state.tsx` | 依赖 `@untitledui/file-icons` | S4 决定是否引入该依赖 |
| `components/application/file-upload/draggable.tsx` | 依赖 `motion/react` 与 `@untitledui/file-icons` | 后台上传走 compat island，暂不纳入 |
