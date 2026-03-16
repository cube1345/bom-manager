[简体中文](#) | [English](./README.en.md) | [繁體中文](./README.zh-Hant.md) | [日本語](./README.ja.md) | [Русский](./README.ru.md)

# 使用方法

# 物料管理助手

面向硬件团队的 BOM 管理插件，运行在 **嘉立创 EDA 专业版** 扩展环境中：在插件内打开一个内联窗口（IFrame），完成类型、元器件、采购记录、项目、PCB 与 BOM 的统一维护，并提供导入导出能力。

> 嘉立创 API 文档参考：[https://prodocs.lceda.cn/cn/api/guide/invoke-apis.html](https://prodocs.lceda.cn/cn/api/guide/invoke-apis.html)

## 功能

- 类型管理：维护一级/二级类型字典。
- 元器件管理：维护型号、辅助信息、备注、库存预警阈值；展示 PCB 需求统计与关联 PCB。
- 采购记录：为元器件维护多条采购记录（平台、链接、数量、价格、店铺关联）。
- 项目 / PCB / BOM：项目可挂多个 PCB，每个 PCB 独立维护 BOM 明细，并可按项目筛选统计需求总量。
- 采购清单：按项目或按 PCB 生成“需求 vs 库存”的缺口清单，并支持导出 `JSON/CSV`。
- 当前工程同步：支持从当前 EDA 工程导入 BOM，也支持整工程批量同步。
- 制造导出：支持导出 `BOM / Gerber / Pick&Place / 3D / Netlist / Test Point`。
- 画布工具：支持适应、框选、标记、截图与记录历史。
- 偏好设置：支持中英文切换、亮色/暗色主题切换。

## 功能演示

### 一键导入你的工程数据

在当前页面下，点击“记录工程快照”，将你当前打开的工程数据全部保存
![记录工程快照](./images/image1.png)
点击“导入当前PCB BOM”，一键即可批量化导入当前的工程的元器件信息
![导入当前PCB BOM](./images/image8.png)

### 新建你的项目与PCB文件

在本插件中，你可以根据嘉立创上创建的项目进行元器件库存数目管理，便于你快速找到你当前需要的元器件
你可以在当前页面创建项目与PCB
![项目与PCB文件](./images/image2.png)

### 新建类型与元器件

在本插件中，你可以管理你当前的元器件数目，每一个元器件都可以通过一级类型与二级类型进行分类管理
![新建类型](./images/image3.png)
![新建元器件](./images/image4.png)

### 数据导出

你可以在此页面下导出你现在的元器件数目，数据会存放在你的本地电脑上，同时也支持数据导入，从而一键将不同的元器件数据信息转移
![元器件数据导出](./images/image5.png)
除了 BOM 信息，也支持其他信息的一键导出
![数据导出](./images/image6.png)

### 截图与画布工具

本插件同时也集成了截图功能，当前视图、当前图元以及选区，根据自己的需要根据自由截图
同时，也支持对当前工程快照进行保存
![截图](./images/image7.png)

## 使用方式

1. 在嘉立创 EDA 专业版中安装扩展包（`.eext`）。
2. 在顶部菜单中找到 `物料管理助手`，点击 `打开物料管理助手`。
3. 首次运行会自动初始化一份默认数据库。

## 数据存储与备份

- 本插件数据保存在扩展的用户配置中（`eda.sys_Storage`）。
- 建议定期使用 `导出 JSON` 做离线备份；需要跨设备迁移时，可用 `导入` 导入导出的 JSON。

## 导入说明

### JSON

- 支持全量数据库导入：形如 `{ types: [], components: [], projects: [], pcbs: [], stores: [] }`。
- 支持元器件列表导入：形如 `[{ typeName, model, auxInfo?, note?, warningThreshold?, records? }]` 或 `{ items: [...] }`。

### CSV

- 仅支持元器件列表导入。
- 必填列：类型（如 `type/typeName/类型`）与型号（如 `model/型号`）。
- 可选列：`auxInfo/辅助信息`、`note/备注`、`warningThreshold/预警阈值`、`platform/平台`、`link/链接`、`quantity/数量`、`pricePerUnit/单价`。

### XLSX

- 若为本插件导出的 `.xlsx`，会自动识别并导入。
- 若为普通 `.xlsx`，会弹出“导入映射”窗口，选择工作表并映射列后导入。

## 开发与构建

运行环境：Node.js 20+

```shell
npm install
npm run build
```

产物位于 `build/dist/*.eext`。

入口文件：

- 扩展入口：[`src/index.ts`](./src/index.ts)
- 内联应用：[`iframe/src/app.ts`](./iframe/src/app.ts)

## 已知限制

- `.xls`（旧格式二进制）导入尚未实现。
- 插件存储容量受宿主限制，建议大型数据集使用“导出 JSON”做定期归档。

## 开源许可

本项目使用 Apache License 2.0。
