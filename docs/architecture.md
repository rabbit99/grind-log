# 架構

## 檔案

| 檔案 | 用途 |
|---|---|
| `index.html` | 全部程式：CSS、HTML、JS 都在這一個檔案裡。不需要建置，可以離線使用，網頁版和 Electron 版共用 |
| `main.js` | Electron 主程序：視窗、選單、開檔／存檔對話框（IPC） |
| `preload.js` | Electron preload：用 `contextBridge` 提供 `window.grindLogNative` |
| `package.json` | Electron 啟動設定（`npm start`） |
| `privacy.html` | 隱私權政策（靜態頁）。Google OAuth 同意畫面的「隱私權政策網址」指向線上版的這一頁 |
| `docs/` | 開發文件 |
| `tools/` | 開發用工具：模擬 Google API 的測試頁產生器（`make-cloud-test.js`、`cloud-mock.js`） |
| `CLAUDE.md` | 給 Claude Code 的開發指引 |

沒有任何建置步驟或第三方前端套件。唯一的外部程式是 Google 登入元件（`https://accounts.google.com/gsi/client`）：只有啟用 Google 試算表同步、而且使用者按了連結或已經連結過時才載入。

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
| 練功計畫頁 | 全部限定在 `#pagePlan` 底下（`.plform`、`.plrow`、`.plslot`、`.pldays`、`.pltimes`、`.plhint`、`.plwip`），不影響其他兩頁；窄螢幕規則在 `@media(max-width:900px)` |

### HTML

```
header.top（#docTitle、#saveState）
#loadBanner（讀不出資料時才顯示）
#pageTabs（練功記錄｜每日進度｜練功計畫）
#pageMain
  .hero（經驗條）
  .cols
    .side：記一筆時段（#f-*、#btnSave）、檔案（#btnExport、#btnCsv、#btnImport、#nativeRow、#btnDemo、#btnReset、#ioMsg）
    .main：人員效率（#tblWorkers）、記錄（#tblSessions、#sessPager）、
           details：人員與時薪（#tblWorkerEdit）、等級經驗對照表（#tblLevels、#lvMsg）
#pageDaily
  標題的 #dayCount、#dailyBody（整塊由 renderDaily 產生）、#dayPager、#dayEmpty
#pagePlan
  標題的 #planCount、#planEmpty（沒有計畫的說明）、#planBad（計畫無法使用時的原因＋刪除按鈕，由 renderPlan 產生）、
  #planBody（#planSummary、#planTableBox 內的 #tblPlan、#planPager〔#planSize、#planRange、#planLinks、#planToday〕；摘要第 4、5 項與狀態欄仍是佔位，S3d 實作）、
  details#planEdit（內含條件表單 #planForm：#pl-* 欄位、#planMsg；沒有計畫時攤開並隱藏 summary）
```

### JS（依出現順序）

| 區段 | 主要內容 |
|---|---|
| 常數 | `WCOLORS`、`STORE_KEY`、`WEEK` |
| 示範資料 | `seed()` |
| 狀態 | `loadProblem`、`db = load()`、`editingId`、`UI_KEY`、UI 狀態（`page`、`pageSize`、`focusId`、`tab`、`dayPage`、`dayPageSize`）、`persistUI()` |
| 載入 | `load()` |
| 資料整理 | `safeStr`、`cleanId`、`isPlainObj`、`numField`、`normalize`、`normPlan` |
| 儲存 | `persist()`、`saveTimer`、`setSaveState()` |
| 計算 | `num`、`pctOf`、`numOrNaN`、`lvOf`、`hoursOf`、`billHoursOf`、`levelInfo`、`workerOf`、`colorOf`、`derive`、`startKey`、`byStart`、`sorted`、`isOn`、`activeSorted` |
| 格式化 | `fin`、`fmt0`／`fmt1`／`fmt2`／`fmt4`、`weekday`、`esc`、`hhmm` |
| 畫面 | `render`、`renderHero`、`renderWorkers`、`renderSessions`、`syncAllCb`、`pageList`、`renderPager`、`renderWorkerEdit`、`renderLevels`、`syncBhField`、`fillWorkerSelect` |
| 表單 | `formMsg`、`readForm`、`validate`，以及儲存、取消的事件 |
| 記錄表事件 | 啟用勾選、改／刪、整頁開關、分頁 |
| 人員／等級編輯 | 行內編輯與刪除事件、`lvMsg`、`lvLabel`、新增人員、新增等級 |
| 檔案 | `resumeSaving`、`applyLoaded`、`NOT_SAVED*`、`scrollRO`、`syncLoadBanner`、「下載原始內容」`#btnDownloadRaw` 的事件、`resetEditUI`、`ioMsg`、`download`、`stamp`、`csvCell`、`backupAdvice`、`confirmReplaceUnreadable`，以及匯出、匯入、還原示範、清空的事件 |
| Electron | `if(window.grindLogNative){…}`：開檔、存檔、選單 |
| Google 試算表同步 | `GOOGLE_CLIENT_ID`、`cloudEnabled`、`cloud`（同步狀態）、`toSheets`／`fromSheets`／`sheetHash`／`sheetProblem`、`cloudLoadGis`／`cloudGetToken`、`cloudApi` 與各 API 函式、`cloudSync`／`cloudLink`／`cloudStep`／`cloudChoose`／`cloudPutLocal`／`cloudTakeCloud`／`cloudAsk`、`cloudMarkDirty`、`cloudReplaceWarning`、`cloudInit`，見 [features/cloud-sync.md](features/cloud-sync.md) |
| 頁籤 | `applyTab` 與鍵盤、點擊事件（三個頁籤，鍵盤左右／Home／End 循環） |
| 每日進度 | `addDays`、`normDate`、`dayRow`、`dailyRows`、`addCumulative`、`segHtml`、`dayRowHtml`、`renderDaily` 與分頁事件 |
| 練功計畫 | `normPlan`（在資料整理區，開機時由 `normalize` 呼叫）、`utcMs`／`planDays`／`planSpanToEnd`（期限換算）、`planKeyOk`、`planSlots`、`planCheck`、`planMissingLevels`／`planMissingText`、`planMarkCount`、`planBrief`、`planReplaceWarning`、`planHistRate`、`localToday`、`planFromRec`；表單：`planMsg`、`planSlotAdd`／`planSlotSync`、`planSyncWorkerSelect`、`planRateInfo`、`planEndShow`、`planFillForm`／`planFormSync`、`planSave`、`planDelete`；`renderPlan`（自己有 try／catch）與表單事件。另有 `heroLevel`（經驗條與「從練功記錄帶入」共用）。S3c 加入：`planLevelMap`、`planPos`、`planDelayDate`、`planCalc`、`planPctTxt`／`planHm`／`planMD`、`planPages`／`planTodayPage`／`planPageRange`、`planRowHtml`、`planSummaryHtml`、`planRenderBody`，以及 `#planSize`／`#planLinks`／`#planToday` 的事件。見 [features/plan.md](features/plan.md)。**時段狀態、完成標記、進度與落後、計時器（S3d）尚未實作** |
| 開機 | 表單日期預設今天 → `applyTab()` → `render()` → `syncLoadBanner()` → `cloudInit()` |

## 資料流

```
開機：   localStorage ─load()→ normalize() ─→ db ─render()→ 畫面
操作：   事件 → 改 db → persist()（寫 localStorage，有連結試算表時 cloudMarkDirty() 排定上傳）→ render()（整頁重畫）
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
| `saveTimer` | 存檔狀態訊息 2.2 秒後消失的計時器 |
| `page`、`pageSize` | 記錄表的目前頁與每頁筆數（10／20／50） |
| `focusId` | 剛新增的記錄 id，重畫時翻到它所在的頁，用完清掉 |
| `tab` | 目前頁籤：`"main"`、`"daily"` 或 `"plan"` |
| `dayPage`、`dayPageSize` | 每日進度頁的目前頁與每頁天數 |
| `planPage`、`planPageSize` | 練功計畫頁的目前頁與每頁天數（7／14／30，預設 14）。`planPage` ＝ 0 代表尚未決定：`renderPlan` 會翻到包含今天（本地日期）的那一頁；進頁籤、更新或刪除計畫、按「回到今天」時重設成 0 |
| `planRateSrc`、`planFormFor`、`planFormDb` | 計畫表單的暫存：目前預估時速的來源（`history`／`manual`）、表單上次是用哪份計畫與哪份 `db` 填的（沒變就不重填，避免洗掉使用者正在輸入的內容） |

## localStorage

| key | 內容 |
|---|---|
| `grind-log/v1` | 整份資料的 JSON |
| `grind-log/v1:ui` | UI 偏好：`{pageSize, tab, dayPageSize, planPageSize}`（`tab` 可以是 `"plan"`；`planPageSize` 只認 7／14／30） |
| `grind-log/v1:unreadable`、`grind-log/v1:unreadable-<時間戳>` | 讀不出來的原文備份，見 [features/storage-recovery.md](features/storage-recovery.md) |
| `grind-log/v1:sync` | Google 試算表同步狀態：`{fileId, hash, dirty}`，見 [features/cloud-sync.md](features/cloud-sync.md) |
| `grind-log/v1:local-backup` | 「用雲端的」取代這台之前另存的資料 `{savedAt, data}`，只有一份；一般下載不會蓋掉已有的備份，見 [features/cloud-sync.md](features/cloud-sync.md) |

Google 的存取權杖只放在記憶體，不寫進 localStorage。

- 第一次開啟（沒有 `grind-log/v1`）時顯示示範資料。要等使用者第一次操作，才會寫進 localStorage。
- 瀏覽器不允許使用 localStorage 時，也顯示示範資料；這時所有修改都存不下來，狀態列會說明。

## 開機順序與 TDZ

`let db = load()` 在 script 很前面就執行，**比後面用 `const` 宣告的東西都早**，例如 `num`、`pctOf`、`fmt*`、`NOT_SAVED*`、`scrollRO`。

- `load()`、`normalize()` 會用到的東西，只能是：
  - 函式宣告（會被提升），例如 `safeStr`、`cleanId`、`numField`、`normDate`。
  - 它們自己的區域變數。
  - 宣告在 `let db = load()` 之前的頂層變數，例如 `STORE_KEY`、`loadProblem`。
- 在這條路徑上用到後面才宣告的 `const`，開機就會拋出 ReferenceError，整頁掛掉。
- 事件處理函式只在開機後才會執行，可以放心使用任何頂層 `const`。

開機最後的 `render()` 包在 try／catch 裡。畫不出來時，檔案區會顯示「資料有問題，畫面無法完整顯示。請先「匯出 JSON」備份，再「還原示範資料」或匯入正確的檔案。」，按鈕照樣可以用。
每日進度頁另外有自己的 try／catch，那一頁出錯不會影響練功記錄頁。練功計畫頁的 `renderPlan` 也一樣：自己 try／catch，出錯只顯示「練功計畫頁顯示失敗，資料本身沒有受影響」。
`normPlan`（`normalize` 在開機時呼叫）只用函式宣告與區域變數，常數寫在函式裡；之後才宣告的 `PLAN_MAX_SLOTS`、`PLAN_MAX_JSON` 只給 `planCheck` 等事件／畫面階段的函式用。

## Electron

**main.js**

- 視窗 1320×900，最小寬度 760。`contextIsolation: true`、`nodeIntegration: false`，並掛上 `preload.js`。
- 選單：
  - 檔案：開啟…（Ctrl／Cmd+O，送出 `menu:open`）、另存新檔…（Ctrl／Cmd+S，送出 `menu:save`）；最後一項在 Windows 是結束，在 macOS 是關閉視窗。
  - 編輯。
  - 檢視：重新整理、開發者工具、縮放、全螢幕。
  - 說明：「資料格式說明」，會開啟 `docs/format.md`。
- 視窗已經關掉時點選單不會出錯（先檢查 `win.isDestroyed()`）。
- IPC：
  - `file:save`：存檔對話框 → 寫檔。
  - `file:open`：開檔對話框 → 讀檔。
  - 回傳格式：
    - 存檔成功：`{ok:true, path}`。
    - 開檔成功：`{ok:true, text, path}`。
    - 取消：`{ok:false, canceled:true}`。
    - 失敗：`{ok:false, error}`，對話框本身出錯也包成這種格式。

**preload.js**：`window.grindLogNative = {save(text), open(), onMenu(fn)}`。

**index.html**：只有 `window.grindLogNative` 存在時，才顯示「開啟檔案／儲存到檔案」並接上選單。網頁版完全不會執行這段。

Electron 版的 localStorage 和瀏覽器版是分開的（`file://` origin，資料在 userData）。

## 安全

- 使用者或匯入檔提供的文字放進 `innerHTML` 時一律經過 `esc()`，或者直接用 `textContent`。
- id 會放進 HTML 屬性，所以讀入時用 `cleanId()` 拿掉控制字元。
- CSV 每一格都經過 `csvCell()`，防止公式注入，見 [features/file-io.md](features/file-io.md)。
