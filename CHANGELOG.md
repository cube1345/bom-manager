# 更新日志（Changelog）

> 注：本仓库在 `1.0.9` 后未单独发布 `1.0.10`，版本直接进入 `1.1.x` 分支。

# 1.1.16

## 新增

1. 新增窗口最大化与最小化支持：插件现在使用官方 `sys_IFrame.openIFrame(..., id, { maximizeButton, minimizeButton })` 打开窗口，并在再次点击菜单时通过 `showIFrame(id)` 恢复已最小化的窗口。
2. 新增设置页“功能开关”：可按需启用或关闭当前工程快照、当前 PCB BOM 导入、整工程批量导入、打开对应 PCB、采购清单页、店铺页等入口。
3. 新增“启动时自动读取工程快照”偏好项，适合需要频繁从当前工程同步 BOM 的使用场景。

## 变更

1. 首页、顶部工具栏、项目页与导航会根据设置中的功能开关动态显示，关闭后不再展示对应入口。
2. 当窗口被最小化后，再次点击“打开物料管理助手”会优先恢复现有窗口，减少重复打开多个插件窗口的情况。

# 1.1.15

## 新增

1. 新增“整工程批量导入”能力：基于嘉立创官方 `dmt_Project.getCurrentProjectInfo()`、`dmt_Pcb.getAllPcbsInfo()`、`dmt_EditorControl.openDocument()/activateDocument()/closeDocument()` 与 `pcb_ManufactureData.getBomFile()`，可依次同步当前工程下全部 PCB 的 BOM。
2. 新增“打开对应 PCB”按钮：对已关联宿主 `sourcePcbUuid` 的插件 PCB，可一键跳回嘉立创 EDA 中对应的 PCB 文档。

## 变更

1. 批量同步的工程/PCB 会写入来源工程 UUID、PCB UUID、板子名和导入时间，后续再次同步时会按来源 UUID 更新，而不再重复新增。
2. 扩展“环境自检”输出：新增 `dmt_EditorControl`、`dmt_SelectControl`、`getAllPcbsInfo()`、`getAllBoardsInfo()`、`getCurrentDocumentInfo()` 等依赖能力检查。

# 1.1.14

## 新增

1. 新增“当前工程快照”卡片：基于嘉立创官方 `dmt_Project.getCurrentProjectInfo()`、`dmt_Pcb.getCurrentPcbInfo()`、`dmt_Board.getCurrentBoardInfo()` 读取当前工程/PCB/板子上下文，并在插件内展示最近一次读取结果。

## 变更

1. 优化“从当前工程导入 BOM”流程：导入时会优先带入当前工程真实名称、PCB 名称、板子名称与工程 UUID，并把这些来源信息写入新建项目/PCB 的备注中，便于后续追溯。
2. 扩展“环境自检”输出：新增 `dmt_Project`、`dmt_Pcb`、`dmt_Board` 以及 `pcb_ManufactureData` / `sch_ManufactureData` 的可用性检查，便于定位宿主版本兼容性问题。

# 1.1.12

## 修复

1. 默认只打开兼容页面 `iframe/index.abs.html`，避免部分客户端（如 EDA Pro 3.2.91）打开主页面空白或无法渲染。

# 1.1.11

## 修复

1. 修复点击一次却弹出两个 IFrame 窗口的问题：兼容页面不再自动打开，改为延迟检测后提示用户确认。

# 1.1.10

## 新增

1. 从当前 EDA 工程一键生成并导入 BOM：调用 `pcb_ManufactureData.getBomFile()`（或回退 `sch_ManufactureData.getBomFile()`）获取 BOM 文件并导入到插件数据库（自动创建项目/PCB/BOM 明细，必要时自动创建类型与元器件）。

# 1.1.9

## 修复

1. 调整 IFrame 打开策略，优先使用更兼容的 `openIFrame(html, width, height)` 形式并用 boot 标记辅助判定，修复部分客户端“能打开窗口但不渲染”的问题。

# 1.1.8

## 变更

1. IFrame 打开逻辑回退与简化（参考早期可用策略），降低闪退与兼容性风险。

# 1.1.7

## 性能

1. 优化 IFrame 打开策略，减少不必要等待（后续版本继续迭代兼容方案）。

# 1.1.6

## 新增

1. 新增“采购清单”页面：按项目/PCB 统计需求与库存缺口，支持导出 `JSON/CSV` 便于采购下单。

## 变更

1. 打开窗口策略调整（更快返回、减少误报）。

# 1.1.5

## 修复

1. 增强 IFrame 启动诊断：记录启动信息与运行时错误（写入扩展用户配置），便于在宿主不便打开开发者工具时排查。

## 变更

1. 扩展 `openIFrame` 的兼容调用策略（多签名尝试）。

# 1.1.3

## 新增

1. 新增“环境自检”菜单项：输出宿主环境信息、关键 API 可用性、扩展资源可读性等排障信息。

# 1.1.2

## 变更

1. IFrame 资源加载兼容性优化：主页面使用相对路径加载资源；新增 `iframe/index.abs.html` 作为绝对路径兼容页面。
2. IFrame 打开逻辑增强：针对部分客户端 `openIFrame()` 返回值不可靠的问题，增加“启动回执”判定，减少误报。

# 1.1.1

## 变更

1. 为了符合隐私政策，禁止在 `extension.json`、`README.md`、`CHANGELOG.md`、`LICENSE` 内添加电子邮箱地址作为联系方式。

# 1.1.0

## 新增

1. 新增扩展注册头部菜单的多语言翻译支持。
2. 新增更新日志（CHANGELOG.md）。

## 变更

1. 替换已弃用的方法（SYS_Dialog.showInformationMessage）。

# 1.0.9

## 修复

1. 修复输入框在部分环境下无法聚焦输入的问题。

## 变更

1. 默认内置类型调整：电阻/电容/电感等作为一级类型。

# 1.0.8

## 新增

1. 扩展默认内置的“元器件类型”列表（更适合硬件团队开箱即用）。

# 1.0.7

## 新增

1. 支持导出 Excel 为 `.xlsx`（并内置可自动导入的数据库数据）。
2. 支持导入 `.xlsx`：本插件导出的 `.xlsx` 会自动识别并导入；普通 `.xlsx` 会弹出“导入映射”窗口，可将列映射为类型/元器件/项目/店铺后导入。

## 修复

1. 导入 `.xlsx` 时无效果的问题（现在会进入自动导入或映射导入流程）。

## 变更

1. 导出 Excel 的入口从 `.xls` 调整为 `.xlsx`。

# 1.0.6

## 修复

1. 修复打包产物缺少 `dist/index.js` 导致扩展无法在嘉立创 EDA 中打开的问题。

## 变更

1. 删除“桌面版迁移/迁移差异”相关文案。
2. 设置页点击“重置数据”后，类型/元器件/项目数目会立即清零。
3. 设置页按钮与统计文字之间的间距微调。

# 1.0.0

初始版本。
