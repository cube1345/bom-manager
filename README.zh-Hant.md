[简体中文](./README.md) | [English](./README.en.md) | [繁體中文](#) | [日本語](./README.ja.md) | [Русский](./README.ru.md)

# 使用方式

# 物料管理助手

物料管理助手是面向 **嘉立創 EDA 專業版** 的 BOM 與庫存管理外掛。它會在編輯器內開啟內嵌 IFrame 視窗，協助硬體團隊集中管理類型、元器件、採購記錄、專案、PCB 與 BOM，並支援資料匯入與匯出。

> 嘉立創 API 文件參考：[https://prodocs.lceda.cn/cn/api/guide/invoke-apis.html](https://prodocs.lceda.cn/cn/api/guide/invoke-apis.html)

## 功能

- 類型管理：維護一級 / 二級類型字典。
- 元器件管理：維護型號、輔助資訊、備註、庫存預警閾值，並展示 PCB 需求統計與關聯 PCB。
- 採購記錄：為每個元器件維護平台、連結、數量、單價與店鋪資訊。
- 專案 / PCB / BOM：一個專案可掛多個 PCB，每個 PCB 獨立維護自己的 BOM 明細。
- 採購清單：可依專案或 PCB 生成「需求 vs 庫存」缺口清單，並支援匯出 `JSON/CSV`。
- 當前工程同步：支援從目前的 EDA 工程匯入 BOM，也支援整個工程批次同步。
- 製造匯出：支援匯出 `BOM / Gerber / Pick&Place / 3D / Netlist / Test Point`。
- 畫布工具：支援適應視圖、選區截取、標記、截圖與歷史記錄。
- 偏好設定：支援語言切換與亮色 / 暗色主題切換。

## 功能演示

### 一鍵匯入目前工程資料

在主頁點擊「记录工程快照」，即可保存目前開啟工程的上下文資料。

![記錄工程快照](./images/image1.png)

點擊「导入当前PCB BOM」，即可將目前工程中的元器件資料批次匯入。

![匯入目前 PCB BOM](./images/image8.png)

### 建立你的專案與 PCB 檔案

你可以按照嘉立創中建立的專案來管理元器件庫存，方便快速找到目前設計需要的元器件。

你也可以直接在外掛中建立專案與 PCB 項目。

![專案與 PCB 檔案](./images/image2.png)

### 建立類型與元器件

此外掛支援用一級類型與二級類型來分類管理目前的元器件庫存。

![建立類型](./images/image3.png)
![建立元器件](./images/image4.png)

### 資料匯出

你可以在此頁面匯出目前的元器件資料到本機，也支援再匯入，方便快速搬移不同環境中的資料。

![元器件資料匯出](./images/image5.png)

除了 BOM 資訊，也支援其他製造資料的一鍵匯出。

![資料匯出](./images/image6.png)

### 截圖與畫布工具

此外掛內建目前視圖、目前圖元與選區等多種截圖方式，可依需求自由使用。

同時也支援保存目前工程快照，方便後續回看。

![截圖工具](./images/image7.png)

## 使用步驟

1. 在嘉立創 EDA 專業版中安裝 `.eext` 外掛包。
2. 在頂部選單找到 `物料管理助手`，點擊 `打开物料管理助手`。
3. 首次執行時，外掛會自動初始化一份預設資料庫。

## 資料儲存與備份

- 外掛資料保存在使用者設定中的 `eda.sys_Storage`。
- 建議定期使用 `导出 JSON` 進行離線備份；若需跨裝置遷移，可透過 `导入` 還原資料。

## 匯入說明

### JSON

- 支援整體資料庫匯入，例如：`{ types: [], components: [], projects: [], pcbs: [], stores: [] }`。
- 也支援元器件清單匯入，例如：`[{ typeName, model, auxInfo?, note?, warningThreshold?, records? }]` 或 `{ items: [...] }`。

### CSV

- 僅支援元器件清單匯入。
- 必填欄位：類型（如 `type/typeName/类型`）與型號（如 `model/型号`）。
- 可選欄位：`auxInfo/辅助信息`、`note/备注`、`warningThreshold/预警阈值`、`platform/平台`、`link/链接`、`quantity/数量`、`pricePerUnit/单价`。

### XLSX

- 若為此外掛匯出的 `.xlsx`，會自動識別並匯入。
- 若為一般 `.xlsx`，會彈出「匯入映射」視窗，先選擇工作表並對應欄位後再匯入。

## 開發與建置

執行環境：Node.js 20+

```shell
npm install
npm run build
```

產物位於 `build/dist/*.eext`。

入口檔案：

- 外掛入口：[`src/index.ts`](./src/index.ts)
- IFrame 應用：[`iframe/src/app.ts`](./iframe/src/app.ts)

## 已知限制

- 舊版二進位 `.xls` 匯入尚未實作。
- 外掛儲存容量受宿主環境限制，若資料量較大，建議定期匯出 `JSON` 做歸檔備份。

## 開源授權

本專案採用 Apache License 2.0。
