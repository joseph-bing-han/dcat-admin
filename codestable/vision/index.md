# Vision

> **读者：** 想理解「应用最终为谁创造什么」并导航产品地图的人。  
> **自检（材料有则写，无则合并，禁止空章）：** 产品核心 · 用户旅程 · 能力版图 · 跨区域边界 · 探索中的候选/互斥 · 与 Epic/Spec 的实现程度链接 · 统一语言 · 三条以上阅读路径。  
> 主线是旅程与结果，不是技术模块目录。

---

## 产品核心

Dcat Admin 为 Laravel 应用开发者和后台操作人员提供一套保持服务端契约的管理端体验。开发者继续用 PHP API、路由、Blade 和扩展协议组织业务；操作人员在统一的现代 View 页面中完成后台任务，不需要理解页面是由 native React 内容还是兼容内容组成。

## 用户怎样获得结果

- 登录并进入后台 — 服务端认证和权限协议保持不变，Modern View runtime 负责登录、反馈和异常页面的呈现；深入读 [当前 View 层](../spec/view-layer/index.md)。
- 导航、查询并操作数据 — 使用固定的导航、标题、面包屑、Grid、筛选、分页和动作结构完成列表任务；现有查询参数、HTTP 方法和 PJAX 语义继续有效。
- 创建、编辑和上传 — Form 的布局、字段名称、CSRF、验证、上传和嵌套载荷由 PHP/HTML 契约继续负责，native 表面与 compat field island 协作完成任务。
- 查看、排序和管理层级 — Show、Tree、Widget 和 Dashboard 使用新版页面结构；第三方插件、Renderable 和任意扩展内容留在 Dcat-owned compat island 内，不切换整页 renderer。

## 能力怎样支撑旅程

- Modern View shell — 统一承载导航、标题、面包屑、页脚、PJAX 和焦点生命周期。
- Native React families — Layout、Grid、Form 基础布局、Show、Tree、Widget 和 System 的可结构化部分由版本化 payload 与 Dcat UI 令牌驱动。
- Compat islands — 承载自定义 Blade/Renderable、第三方 Form 插件、Grid displayers/actions、编辑器、上传、Select2 和扩展节点；保留原始 DOM 节点、表单载荷、监听器和插件生命周期。
- PHP/HTTP authority — Controller、PHP builders、路由、权限、请求参数、表单载荷和响应语义仍是业务状态与传输的权威来源。

## 边界、候选与现实差距（按需）

- 跨区域原则/数据/平台边界：Modern View 是唯一页面 renderer；native 和 compat 是同一运行时的内容路径。旧 Bootstrap/AdminLTE 整页 renderer、classic fallback、renderer 开关、route/family/capability allowlist 和强制回退 marker 不属于当前系统。消费者使用预构建资源，不需要 Node.js。
- 仍探索或互斥的方向（意图状态）：允许未来以保持 HTTP、DOM 和生命周期契约为前提逐步减少 compat islands；不接受通过恢复旧整页 UI 来解决不兼容。发布 candidate、能力 promotion、package publish 和 Git 操作仍是独立授权/状态事项。
- 实现程度与 Epic / Project Spec 链接：View 层现代化 Epic 已关闭；当前稳定事实见 [Project Spec](../spec/view-layer/index.md)，设计和验证历史见 [已关闭 Epic](../epics/001-x-view-layer-modernization/spec.md)。当前验收记录的实际环境为 PHP 8.1.34 / Laravel 10.50.3；不将该环境证据扩大到其它版本组合。

## 用语与下一步读哪

- 术语：native View 是新版 runtime 中由 React/payload 负责的结构；compat island 是新版 runtime 内保留原始节点和扩展生命周期的局部兼容边界；旧 renderer 指已删除的 Bootstrap/AdminLTE 整页实现。
- 想理解最终体验 → [当前 View 层](../spec/view-layer/index.md) → [Modern View 扩展指南](../../docs/modern-view-extensions.md)。
- 想理解设计取舍 → [已关闭 View 层现代化 Epic](../epics/001-x-view-layer-modernization/spec.md) → [兼容契约](../epics/001-x-view-layer-modernization/compatibility-contract.md)。
- 想摘开发切片 → [当前 View 层证据索引](../spec/view-layer/index.md) → 对应的 `src/`, `resources/modern/`, `resources/views/` 和测试。
