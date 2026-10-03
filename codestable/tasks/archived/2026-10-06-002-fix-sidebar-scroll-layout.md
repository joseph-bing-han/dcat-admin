---
doc_type: task-list
task: fix-sidebar-scroll-layout
goal: 固定侧栏并消除左下空白
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-06
updated: 2026-10-06
archived: 2026-10-06
related_docs:
  - codestable/issues/030-o-ff-固定侧栏并消除底部空白.md
---

# 固定侧栏并消除左下空白

## 1. 任务目标

固定侧栏并消除左下空白

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 修复侧栏几何并构建
- [x] 验证滚动及侧栏变体

## 4. CodeStable 文档索引

- `codestable/issues/030-o-ff-固定侧栏并消除底部空白.md`

## 5. 执行步骤

### 1. 修复侧栏几何并构建

- 状态：done

### 2. 验证滚动及侧栏变体

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-06：Task 已创建。

2026-10-06：垂直main-menu fixed 100vh/100dvh，aside relative 100%，品牌不收缩、菜单overscroll contain。build/artifact/diff通过；最终CSS BNjA4_Im。Chrome extension真实1912×962页顶/页底：aside top0/bottom962，旧页底top-57/bottom905问题消失；1024×400滚到max2640时仍top0/bottom400，底部命中sidebar。折叠86.39px且内容左边86.39，预览260px且内容保持86.39；长菜单滚动top112、页面scrollY0、品牌top0，375×812手机抽屉top0/bottom812。无warn/error，临时视口和页面已清理，服务器停止。未部署消费应用；水平菜单规则排除本次改动，未实际验收该布局。

2026-10-06：Task 已标记 completed，等待归档。

2026-10-06：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：07052c46a2b49c9a38efaa3c223fe93f678bfd5c2c9f6f586b2fe21b0e4471cc
