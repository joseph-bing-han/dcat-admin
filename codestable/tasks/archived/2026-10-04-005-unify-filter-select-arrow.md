---
doc_type: task-list
task: unify-filter-select-arrow
goal: 统一Filter Select2和通用下拉控件的箭头样式
status: archived
workflow: fast
owner_skill: cs
created: 2026-10-04
updated: 2026-10-04
archived: 2026-10-04
related_docs:
  - codestable/issues/009-o-ff-统一Filter下拉箭头.md
  - codestable/spec/view-layer/index.md
---

# 统一Filter Select2和通用下拉控件的箭头样式

## 1. 任务目标

统一Filter Select2和通用下拉控件的箭头样式

## 2. 当前状态

archived

## 3. Agent 原生 Tasks 同步区

- [x] 统一Select2箭头并构建资源
- [x] 验证实际筛选下拉箭头及交互状态

## 4. CodeStable 文档索引

- `codestable/issues/009-o-ff-统一Filter下拉箭头.md`
- `codestable/spec/view-layer/index.md`

## 5. 执行步骤

### 1. 统一Select2箭头并构建资源

- 状态：done

### 2. 验证实际筛选下拉箭头及交互状态

- 状态：done

## 6. 中断恢复提示

先核对关联业务依据，再从第一个未完成步骤继续，并以 Task 正本恢复 Agent 原生 Tasks。计划确定后按 references/autonomy.md 自动择优，不再请求路线确认。

Task 已归档时只继续关联文档的最终回写，按归档记录中的位置与路径映射恢复；不修改冻结 Task，不为回写另建 Task。归档后的 related_docs 保留历史路径，最终引用在业务正本维护。

## 7. 完成与归档记录

2026-10-04：Task 已创建。

2026-10-04：已将Select2单选箭头改为16px SVG mask，路径m6 9 6 6 6-6、2.25描边与上游NativeSelect相同，使用fg-quaternary主题色、10px逻辑侧边距；展开旋转180度，清除原b边框三角，为显示文本保留箭头间距。原节点、模板、Select2初始化和协议未修改。生产构建完成，继续实际Filter面板及产物检查。

2026-10-04：Chrome extension独立PayTaxNZ列表页预览编译CSS：箭头16x16px、fg-quaternary=rgb156,163,175、侧边距10px，旧b边框0px，闭合transform none，展开matrix(-1,0,0,-1,0,0)。键盘Down/Return选择选项后原select节点仍保持，FormData中category_id与select.value一致，aria-expanded恢复false；未点击搜索/提交筛选。RTL临时dir下箭头距左10px，恢复方向后375px下44px控件中箭头16px、右侧10px，与清除按钮和文本不重叠。截图artifacts/filter-select-arrow/desktop.png、mobile-375.png。生产构建、artifact、diff检查通过，JS仍vswbogst，CSS为Dj9mFheC；纯CSS变化不新增实现镜像测试、不重跑PHP/TS与无关测试。构建有既有Sass弃用提示，无独立子代理可调用。临时dir/视口已恢复，独立测试页已关闭，未部署PayTaxNZ资源，未修改业务数据。归档后将009-o-ff关闭为009-x-ff并回写四答与View spec，无新增Talk/Note/Tool，不提交不推送。

2026-10-04：Task 已标记 completed，等待归档。

2026-10-04：Task 已原子移动到 archived，active 正本已移除。 源快照 SHA-256：365cce4673f4bbc9e92c88e57866bfd4eeba9dccd77264067f0d7cd899baa8ac
