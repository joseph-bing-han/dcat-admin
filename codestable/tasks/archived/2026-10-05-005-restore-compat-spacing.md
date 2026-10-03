---
doc_type: task-list
task: restore-compat-spacing
goal: 统一恢复兼容边距工具类及其响应式行为
status: archived
workflow: bugfix
owner_skill: cs
created: 2026-10-05
updated: 2026-10-05
archived: 2026-10-05
related_docs:
  - codestable/issues/025-o-ff-补齐兼容间距工具类.md
  - scripts/view-modernization-compat.js
  - resources/modern/compat-utilities.css
---

# 统一恢复兼容边距工具类及其响应式行为

## 1. 任务目标

统一恢复兼容边距工具类及其响应式行为

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 补齐间距生成规则并构建验证
- [x] 验证邮件按钮与完整间距矩阵并回写

## 4. CodeStable 文档索引

- `codestable/issues/025-o-ff-补齐兼容间距工具类.md`
- `scripts/view-modernization-compat.js`
- `resources/modern/compat-utilities.css`

## 5. 执行步骤

### 1. 补齐间距生成规则并构建验证

- 状态：done

### 2. 验证邮件按钮与完整间距矩阵并回写

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-05：Task 已创建。

2026-10-05：生成器补全margin/padding七方向，25/50/75 rem、margin负值/auto和五断点，共945个间距类；注册契约共1362类。保留0–5现代4px档位，与Tailwind重名默认类仍base层；legacy island以:where零额外特异性强化important，确保响应式类可覆盖基础档位且不影响原生上游UI。语法、重复生成SHA幂等、代表类契约、生产build/artifact/diff检查通过；继续Chrome实际邮件及完整矩阵。

2026-10-05：Chrome extension最终编译CSS临时预览：375/576/768/1024/1280px各945类，共4725例、18900个方向断言全部通过；覆盖正负margin、padding、auto及断点未激活状态。mr-1/mr-md-50断点覆盖为4px/8px，原生组件margin/padding保留31px，真实9个邮件动作mr-50均为8px；无warn/error。已恢复viewport、缓存和拦截，关闭临时页并停止资源服务器。未部署消费应用，未执行业务动作。

2026-10-05：Task 已标记 completed，等待归档。

2026-10-05：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：e5aed81abe7ee4c82e57afe4224ee390d1a3c7c3958d5b5690f514072532244a
