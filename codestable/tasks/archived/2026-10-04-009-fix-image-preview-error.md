---
doc_type: task-list
task: fix-image-preview-error
goal: 修复图片加载失败时预览弹窗缩成关闭按钮
status: archived
workflow: fast
owner_skill: cs
created: 2026-10-04
updated: 2026-10-04
archived: 2026-10-04
related_docs:
  - codestable/issues/013-o-ff-修复图片预览失败弹窗.md
  - codestable/spec/view-layer/index.md
---

# 修复图片加载失败时预览弹窗缩成关闭按钮

## 1. 任务目标

修复图片加载失败时预览弹窗缩成关闭按钮

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 实现图片预览状态并验证构建
- [x] 验证实际设置页图片预览并闭环记录

## 4. CodeStable 文档索引

- `codestable/issues/013-o-ff-修复图片预览失败弹窗.md`
- `codestable/spec/view-layer/index.md`

## 5. 执行步骤

### 1. 实现图片预览状态并验证构建

- 状态：done

### 2. 验证实际设置页图片预览并闭环记录

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-04：Task 已创建。

2026-10-04：公共previewImage增加Loading image…/Unable to load image.状态、aria-busy和图片隐藏切换，监听先于src并处理缓存complete，关闭后移除图片监听、恢复焦点。状态区320px受视口约束、最小160px高度，正常图片尺寸策略保持。runtime与compat-overlays两文件38项测试、typecheck、生产构建、artifact、diff通过。Chrome实际设置页原预览宽32px已复现，继续临时预览最终CSS及正式产物中提取的previewImage方法，不重新初始化页面，不提交账号设置。

2026-10-04：追加已complete的缓存成功/失败两种回归，runtime/compat-overlays总40项通过。Chrome extension实际设置页原入口加载中窗口由32x64px变352x224px，375px为343x224px。使用正式产物提取的previewImage函数临时替换同入口；损坏data图片触发浏览器真实error后显示Unable to load image.、aria-busy=false且图片隐藏；桌面/375/320px失败卡片完整，320x480下288x224px无横向溢出、关闭按钮在卡片内，按钮及Escape可关闭。正常480x320 SVG图隐藏状态区、保持原尺寸；320px下等比缩至255.98x170.66px，弹窗288x234.66px位于视口内。截图artifacts/image-preview-error/error-desktop.png、error-375.png。未等待不可控头像服务器请求结束、未恢复头像文件，错误分支使用无网络损坏图片验证；正常分支使用自有SVG fixture，无业务上传或账号设置保存。临时helper/CSS与视口已恢复，测试页关闭。最终JS DBMYIjW0、CSS BIe7CooY；生产构建/artifact/diff已通过，新增测试后再核对typecheck。既有Sass弃用提示保留，无独立子代理可调用。归档后013-o-ff改013-x-ff并回写Issue和View spec，不新增Talk/Note/Tool、不提交推送或部署。

2026-10-04：最终新增测试后的typecheck和diff检查通过；已验证范围完成，进入归档及关联正本回写。

2026-10-04：Task 已标记 completed，等待归档。

2026-10-04：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：95b7d13ee909f987b962822e065be5e0d7ded515590acfb111b523eaa5a9d430
