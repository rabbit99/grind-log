# 架構

## 檔案

| 檔案 | 用途 |
|---|---|
| `index.html` | 全部程式：CSS、HTML、JS 都在這一個檔案裡。不需要建置，可以離線使用，網頁版和 Electron 版共用 |
| `main.js` | Electron 主程序：視窗、選單、開檔／存檔對話框（IPC） |
| `preload.js` | Electron preload：用 `contextBridge` 提供 `window.grindLogNative` |
| `package.json` | Electron 啟動設定（`npm start`） |
| `docs/` | 開發文件 |
| `CLAUDE.md` | 給 Claude Code 的開發指引 |

沒有任何建置步驟或第三方前端套件。

## 部署

- **網頁版**：GitHub Pages 從 `main` 分支的根目錄發布到 https://rabbit99.github.io/grind-log/ 。
  - 推上 `main` 後，`pages build and deployment` workflow 約一分鐘跑完，就會生效。
  - **推上 main 等於上線**，所以合併前一定要審查，流程見 [development.md](development.md)。
- **桌面版**：`npm install` 後執行 `npm start`。

## index.html 的區段地圖

### CSS（依出現順序）

| 區段 | 內容 |
|---|---|
| `:root` | 色彩變數（`--stone-*`、`--bone*`、`--gold*`、`--crimson`、`--jade`）、人員色 `--w1`～`--w6`、`--pad`、`--radius` |
| 基本 | `[hidden]{display:none!important}`、body 字型與行高 1.55 |
| header | 標題 `#docTitle`、存檔狀態 `#saveState` |
| hero | 經驗條 `.bar`、統計 `.stats`、圖例 `.legend` |
| layout | `.cols` 兩欄 grid（320px + 1fr）、`.panel`、`.side`（桌面版 sticky） |
| form | 輸入框、按鈕、訊息 `.msg` |
| tables | 表格共用樣式、`.scroll`、`.rowact`、`.is-scroll` 與 `.act`（固定欄）、記錄表內距 |
| 啟用勾選 | `.cb`、停用列 `tr.off` |
| 分頁 | `.pager`、`.pglinks` |
| `details.tool` | 人員與時薪、等級表的摺疊面板 |
| loadbanner | 讀不出資料時的紅框提示 |
| 頁籤 | `.pagetabs` |
| 每日進度頁 | `.dlegend`、`#tblDaily`、時間軸 `.track`／`.dseg`；900px 以下改成卡片 |

### HTML

```
header.top（#docTitle、#saveState）
#loadBanner（讀不出資料時才顯示）
#pageTabs（練功記錄｜每日進度）
#pageMain
  .hero（經驗條）
  .cols
    .side：記一筆時段（#f-*、#btnSave）、檔案（#btnExport、#btnCsv、#btnImport、#nativeRow、#btnDemo、#btnReset、#ioMsg）
    .main：人員效率（#tblWorkers）、記錄（#tblSessions、#sessPager）、
           details：人員與時薪（#tblWorkerEdit）、等級經驗對照表（#tblLevels、#lvMsg）
#pageDaily
  #dailyBody（整塊由 renderDaily 產生）、#dayPager
```

### JS（依出現順序）

| 區段 | 主要內容 |
|---|---|
| 常數 | `WCOLORS`、`STORE_KEY`、`WEEK` |
| 示範資料 | `seed()` |
| 狀態 | `loadProblem`、`db = load()`、`editingId`、UI 狀態（`page`、`pageSize`、`focusId`、`tab`、`dayPage`、`dayPageSize`）、`persistUI()` |
| 載入 | `load()` |
| 資料整理 | `safeStr`、`cleanId`、`isPlainObj`、`numField`、`normalize` |
| 儲存 | `persist()`、`setSaveState()` |
| 計算 | `num`、`pctOf`、`numOrNaN`、`lvOf`、`hoursOf`、`billHoursOf`、`levelInfo`、`workerOf`、`colorOf`、`derive`、`byStart`、`sorted`、`isOn`、`activeSorted` |
| 格式化 | `fin`、`fmt0`／`fmt1`／`fmt2`／`fmt4`、`weekday`、`esc`、`hhmm` |
| 畫面 | `render`、`renderHero`、`renderWorkers`、`renderSessions`、`syncAllCb`、`pageList`、`renderPager`、`renderWorkerEdit`、`renderLevels`、`syncBhField`、`fillWorkerSelect` |
| 表單 | `formMsg`、`readForm`、`validate`，以及儲存、取消的事件 |
| 記錄表事件 | 啟用勾選、改／刪、整頁開關、分頁 |
| 人員／等級編輯 | 行內編輯與刪除事件、`lvMsg`、`lvLabel`、新增人員、新增等級 |
| 檔案 | `resumeSaving`、`applyLoaded`、`NOT_SAVED*`、`scrollRO`、`syncLoadBanner`、`resetEditUI`、`ioMsg`、`download`、`stamp`、`csvCell`、`backupAdvice`、`confirmReplaceUnreadable`，以及匯出、匯入、還原示範、清空的事件 |
| Electron | `if(window.grindLogNative){…}`：開檔、存檔、選單 |
| 頁籤 | `applyTab` 與鍵盤、點擊事件 |
| 每日進度 | `addDays`、`normDate`、`dayRow`、`dailyRows`、`addCumulative`、`segHtml`、`dayRowHtml`、`renderDaily` 與分頁事件 |
| 開機 | 表單日期預設今天 → `applyTab()` → `render()` → `syncLoadBanner()` |

## 資料流

```
開機：   localStorage ─load()→ normalize() ─→ db ─render()→ 畫面
操作：   事件 → 改 db → persist()（寫 localStorage）→ render()（整頁重畫）
換資料： 匯入／開檔 → normalize(d, issues) → applyLoaded(d) → render() 試畫 → resumeSaving()
         還原示範／清空 → 換 db → resumeSaving() → render()
```

- **全部重畫**：沒有框架，也沒有局部更新。每次操作都呼叫 `render()`，用 `innerHTML` 重建表格。
- **事件委派**：事件掛在 `tbody` 或 table 上，用 `data-*` 屬性判斷是哪一列、哪個按鈕。重畫後不需要重新掛事件。
- **識別方式**：記錄用 `data-*="${id}"`；等級表用列在 `db.levels` 裡的位置 `data-li`（原因見 [features/levels.md](features/levels.md)）。
- **UI 偏好和資料分開存**：每頁筆數、目前頁籤存在 `:ui`，不會混進資料檔。

## 全域狀態

| 變數 | 意義 |
|---|---|
| `db` | 整份資料，格式見 [format.md](format.md) |
| `loadProblem` | 讀不出原本資料時的狀態 `{msg, saved, raw, writeFailed?}`；`null` 代表正常。有值時暫停自動儲存 |
| `editingId` | 表單正在修改的記錄 id；`null` 代表新增模式 |
| `page`、`pageSize` | 記錄表的目前頁與每頁筆數（10／20／50） |
| `focusId` | 剛新增的記錄 id，重畫時翻到它所在的頁，用完清掉 |
| `tab` | 目前頁籤：`"main"` 或 `"daily"` |
| `dayPage`、`dayPageSize` | 每日進度頁的目前頁與每頁天數 |

## localStorage

| key | 內容 |
|---|---|
| `grind-log/v1` | 整份資料的 JSON |
| `grind-log/v1:ui` | UI 偏好：`{pageSize, tab, dayPageSize}` |
| `grind-log/v1:unreadable`、`grind-log/v1:unreadable-<時間戳>` | 讀不出來的原文備份，見 [features/storage-recovery.md](features/storage-recovery.md) |

- 第一次開啟（沒有 `grind-log/v1`）時顯示示範資料。要等使用者第一次操作，才會寫進 localStorage。
- 瀏覽器不允許使用 localStorage 時，也顯示示範資料；這時所有修改都存不下來，狀態列會說明。

## 開機順序與 TDZ

`let db = load()` 在 script 很前面就執行，**比後面用 `const` 宣告的東西都早**，例如 `num`、`pctOf`、`fmt*`、`NOT_SAVED*`、`scrollRO`。

- `load()`、`normalize()` 會用到的東西，必須是函式宣告（會被提升）或它們自己的區域變數。例如 `safeStr`、`cleanId`、`numField`、`normDate` 都是函式宣告。
- 在這條路徑上用到後面才宣告的 `const`，開機就會拋出 ReferenceError，整頁掛掉。
- 事件處理函式只在開機後才會執行，可以放心使用任何頂層 `const`。

## Electron

**main.js**

- 視窗 1320×900，最小寬度 760。`contextIsolation: true`、`nodeIntegration: false`，並掛上 `preload.js`。
- 選單：
  - 檔案：開啟…（Ctrl／Cmd+O，送出 `menu:open`）、另存新檔…（Ctrl／Cmd+S，送出 `menu:save`）、結束。
  - 編輯。
  - 檢視：重新整理、開發者工具、縮放、全螢幕。
  - 說明：「資料格式說明」，會開啟 `docs/format.md`。
- 視窗已經關掉時點選單不會出錯（先檢查 `win.isDestroyed()`）。
- IPC：
  - `file:save`：存檔對話框 → 寫檔。
  - `file:open`：開檔對話框 → 讀檔。
  - 兩者都回傳 `{ok, path, text | error | canceled}`，對話框本身出錯也包成 `{ok:false, error}`。

**preload.js**：`window.grindLogNative = {save(text), open(), onMenu(fn)}`。

**index.html**：只有 `window.grindLogNative` 存在時，才顯示「開啟檔案／儲存到檔案」並接上選單。網頁版完全不會執行這段。

Electron 版的 localStorage 和瀏覽器版是分開的（`file://` origin，資料在 userData）。

## 安全

- 使用者或匯入檔提供的文字放進 `innerHTML` 時一律經過 `esc()`，或者直接用 `textContent`。
- id 會放進 HTML 屬性，所以讀入時用 `cleanId()` 拿掉控制字元。
- CSV 每一格都經過 `csvCell()`，防止公式注入，見 [features/file-io.md](features/file-io.md)。
