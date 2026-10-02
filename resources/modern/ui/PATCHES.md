# 本地上游裁剪

## empty-state-core

来源：Untitled UI React OSS 固定 revision `c981a73bcd6b6c68d2a54070f20f020191212828` 的 `components/application/empty-state/empty-state.tsx`。

保留 Root、FeaturedIcon、Footer、Title、Description 原实现；删除依赖文件图标与营销插画的 Header/Illustration/FileTypeIcon/Avatar 装饰导出。Title 改用 h2，避免后台页内空态成为第二个 h1。未修改选择、动作或数据协议。上游与本地 SHA-256 同时记录在 PROVENANCE，vendor 工具的 `applyLocalPatches` 可重现此裁剪。
