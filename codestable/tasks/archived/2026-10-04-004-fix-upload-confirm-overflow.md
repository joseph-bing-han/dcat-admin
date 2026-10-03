---
doc_type: task-list
task: fix-upload-confirm-overflow
goal: 修复上传删除确认弹窗的长路径溢出与文字裁切
status: archived
workflow: fast
owner_skill: cs
created: 2026-10-04
updated: 2026-10-04
archived: 2026-10-04
related_docs:
  - codestable/issues/008-o-ff-修复上传删除确认弹窗溢出.md
  - codestable/spec/view-layer/index.md
---

# 修复上传删除确认弹窗的长路径溢出与文字裁切

## 1. 任务目标

修复上传删除确认弹窗的长路径溢出与文字裁切

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 修复确认弹窗内容尺寸并构建资源
- [x] 验证长路径显示和确认取消协议

## 4. CodeStable 文档索引

- `codestable/issues/008-o-ff-修复上传删除确认弹窗溢出.md`
- `codestable/spec/view-layer/index.md`

## 5. 执行步骤

### 1. 修复确认弹窗内容尺寸并构建资源

- 状态：done

### 2. 验证长路径显示和确认取消协议

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-04：Task 已创建。

2026-10-04：已确认原弹窗480px、内容列921.453px、scrollWidth945/scrollLeft465的失败信号。CSS将确认卡片列设为minmax(0,1fr)，标题正文支持anywhere换行、动作允许换行，弹窗最大高度留32px视口边距。18项既有overlay/上传请求测试、生产构建、artifact与diff检查通过；CSS产物DeJ1IVRO，JS保持vswbogst。正在实际页面预览并核对取消/Escape/确认协议，无真实删除。

2026-10-04：实际Chrome extension在独立PayTaxNZ创建页临时加载编译CSS，重新打开确认弹窗后：桌面clientWidth=scrollWidth=480、375px下343、320px下288，均scrollLeft=0、标题与按钮位于卡片内；文件路径自动换行。320x600下超长标题正文弹窗clientHeight568、scrollHeight922，通过纵向滚动承载内容，scrollWidth=clientWidth273（含竖向滚动条）。取消/Escape关闭且计数回调为0，确认关闭且回调仅执行一次（计数1）；此回调只修改测试页计数，没有上传、删除请求、业务提交或数据库操作。截图artifacts/upload-confirm-layout/desktop.png、mobile-375.png、mobile-320.png。18项既有compat-overlays/upload-request测试、生产构建、artifact、diff检查通过；纯CSS不新增实现镜像测试、不重跑PHP及无关类型检查。构建有既有Sass弃用提示。测试页已关闭并清理视口覆盖，未部署应用资源。无可调用独立子代理工具。归档后按快改契约将008-o-ff改为008-x-ff、回写四答和View spec，无额外Talk/Note/Tool，不提交、不推送。

2026-10-04：Task 已标记 completed，等待归档。

2026-10-04：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：58940bf89004a838bd3846ab2add6cba475415783baae01056c682a6345e7005
