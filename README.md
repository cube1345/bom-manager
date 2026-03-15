[简体中文](#)

# 工程脉搏（Design Pulse）

面向 **嘉立创 EDA 专业版** 的插件，围绕当前工程上下文、制造资料导出、画布快照与 BOM 协作，提供一套更贴近硬件设计审查与交付的工作流。

> 官方 API 入口：<https://prodocs.lceda.cn/cn/api/guide/invoke-apis.html>

## 核心能力

- 工程快照：读取当前工程、PCB、板子、文档类型、团队与工作区信息。
- 报告历史：生成工程快照报告，并记录制造导出与画布截图历史。
- 画布工具：支持适应全部、适应选中、矩形标记、当前视图/全图/选区截图。
- 制造导出中心：统一导出 `BOM / Gerber / Pick&Place / 3D / Netlist / Test Point`。
- BOM 协作：保留当前工程 BOM 导入、整工程批量同步、项目/PCB 需求统计与采购清单。

## 依赖的嘉立创 API

插件直接调用官方 `eda` 对象及相关模块，包括：

- `sys_IFrame`、`sys_Storage`、`sys_FileSystem`
- `dmt_Project`、`dmt_Pcb`、`dmt_Board`
- `dmt_SelectControl`、`dmt_EditorControl`
- `dmt_Team`、`dmt_Workspace`
- `pcb_ManufactureData`、`sch_ManufactureData`

## 使用方式

1. 运行 `npm install`
2. 运行 `npm run build`
3. 在 `build/dist/` 中获取 `.eext`，安装到嘉立创 EDA 专业版
4. 在顶部菜单中找到 `工程脉搏` 并打开插件

## 开发说明

- 入口文件：`src/index.ts`
- IFrame 应用：`iframe/src/app.ts`
- 打包脚本：`build/packaged.ts`
- 迭代发版脚本：`scripts/release-iteration.ps1`

构建产物会输出到 `dist/` 和 `build/dist/`。其中 `build/dist/*.eext` 会被保留用于版本回溯。
