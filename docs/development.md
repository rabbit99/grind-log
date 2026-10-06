# 開發流程與規範

## 工作流程

1. **每個修改都開新分支**，從最新的 `main` 分出來。
   - 命名例如 `fix/…`（修正）、`feat/…`（新功能）、`docs/…`（文件）。
   - `main` 在合併前不動。
2. **改程式時同步更新文件**：同一個分支、同一個 commit 裡更新 `docs/` 對應的文件。
3. **合併前一定要獨立審查**：
   - 審查者只讀不改。瀏覽器實測與跟 main 對照由主對話做、結果交審查者核對；審查者負責讀碼與事實核對，無法實測的項目要標明。
   - 發現分成三級：阻擋合併、應修但不阻擋、小建議。
   - 阻擋等級修完後，請同一位審查者複查。
4. **合併**：
   - 沒有問題才 fast-forward 合併到 `main` 並推送，**推上去就會部署到 GitHub Pages**。
   - 等 `pages build and deployment` 跑完，到線上版確認有這次的改動。
5. **合併後刪掉本機分支**。

Claude Code 有 `review-merge` skill，會自動跑完第 3～5 步。它放在 `.claude/skills/`，已納入版控（`.gitignore` 只放行 `.claude/skills/`，其他 `.claude/` 內容仍不入庫）。

審查者是 ai-company 的茶茶（`reviewer-chacha`），不再用 `general-purpose`。茶茶沒有瀏覽器，瀏覽器實測由主對話做、結果交給茶茶核對；細節見 skill 的第 2 節。`.claude/skills/` 整個目錄都會被追蹤，裡面不要放私人或機器專屬的內容。

### 什麼時候要先問使用者

使用者授權開發流程可以自動進行，但下面這些設計取捨要先說明選項、由使用者決定：

- 改變 **901px 以上桌面版的外觀**。
- 改變**資料格式**，例如 `docs/format.md` 的欄位或規則。
- 可能**刪掉或覆蓋使用者的資料**。

### Commit

- 作者用：`git -c user.email="vvbest2012@gmail.com" -c user.name="rabbit99" commit …`
- 訊息用繁體中文：
  - 第一行說明做了什麼。
  - 內文說明原因和影響。
  - 結尾附上 Co-Authored-By。
- 審查找到問題而修正時，另開一個 commit，例如「修正審查找到的問題：…」。
- 不要 squash，除非中間的 commit 是壞的或已經被取代。

## 編碼規範

- **語言**：註解、介面文字、commit、文件一律用繁體中文。註解寫的是**為什麼**，包括踩過的坑；程式本身說得清楚的不用註解。
- **XSS**：
  - 放進 `innerHTML` 的文字一律經過 `esc()`，或者改用 `textContent`。
  - `confirm()` 和 `textContent` 不需要 `esc()`。
- **載入不能掉資料**：
  - `normalize(d)`（沒有 `issues`）不略過任何一列，只拿掉型別根本不對的東西，見 [format.md](format.md#讀入時的整理) 表格的「載入時也做」欄。
  - 會略過列的規則（無效、重複的等級）只在匯入時執行，而且要寫進 `issues` 回報給使用者。
- **TDZ**：`load()`、`normalize()` 會在開機時（`let db = load()` 那一行）就執行，只能用函式宣告、區域變數，以及宣告在那一行之前的頂層變數，見 [architecture.md](architecture.md#開機順序與-tdz)。
- **不拋出例外**：資料可能是怪的，轉字串用 `safeStr()`，轉數字用 `fin()`、`numOrNaN()`，不要讓一筆壞資料弄垮整個畫面。
- **重畫模式**：修改 `db` 後呼叫 `persist()` 和 `render()`。事件用委派，掛在 table 或 tbody 上。
- **UI 偏好和資料分開**：每頁筆數、頁籤這類設定存在 `grind-log/v1:ui`，不放進資料檔。
- **CSS**：
  - 顏色用 `:root` 的變數。
  - 窄螢幕的規則放在 `@media(max-width:900px)` 裡，不要影響 901px 以上。
  - `hidden` 屬性一律有效（`[hidden]{display:none!important}`）。

## 測試方法

### 預覽

- `.claude/launch.json` 的 `grind-log` 設定，在 http://localhost:5599 開啟預覽。
- 預覽瀏覽器的 localStorage 裡：
  - `__preview_backup` 存著使用者 160 筆真實資料的副本。
  - 測試會改動 `grind-log/v1`，**測完要還原成 `__preview_backup`**，也要清掉 `grind-log/v1:unreadable*`。
- 預覽的 storage 被清空時：
  1. 用專案根目錄的 `grind-log-2026-09-25.json`（已被 gitignore，是使用者的真實資料）走一次匯入流程。
  2. 再把 `grind-log/v1` 存一份到 `__preview_backup`。

### 跟 main 對照

1. `git show main:index.html > _main_compare.html` 產生 main 的副本。
   - 放在 repo 根目錄，預覽伺服器才讀得到。已經列在 `.gitignore`，但用完還是要刪掉，**絕不 commit**。
   - 只讀的審查者不要在 repo 裡產生檔案，改放在自己的 scratchpad 資料夾，用自己開的伺服器讀取。
   - 要跟這個分支修正前的版本比較時，同樣用 `git show HEAD:index.html > _prev_compare.html`（也已列在 `.gitignore`）。
2. 在頁面裡建立 iframe，同時載入 `_main_compare.html` 和 `index.html`，比較：
   - 資料：`db` 去掉 `updatedAt` 後比較。
   - 版面：每個元素的 `getBoundingClientRect()`。
   - 匯出內容：把 `window.download` 換掉，攔截下載的內容。
3. 改動不該影響的部分（例如 901px 以上的外觀、真實資料的 CSV）要逐項相同。

### 預覽窗格被隱藏時

預覽窗格被隱藏時，頁面是 hidden 狀態，`requestAnimationFrame` 和 ResizeObserver 都不會觸發，表格的 `is-scroll` 判斷也就不會執行。

- 用 `tabs_context` 確認窗格有沒有顯示。
- 窗格隱藏時，改用**可見的 Electron 視窗**量測：
  - 全域有 `electron` 指令可以用。
  - 用 `new BrowserWindow({show:true})` 載入 `file://` 頁面，再用 `executeJavaScript` 注入資料。
  - 加上 `app.on("window-all-closed", ()=>{})`，不然關掉第一個視窗時程式就結束了。
  - 用 `app.setPath("userData", <暫存資料夾>)`，不要動到使用者平常的 Electron 資料（`%APPDATA%\grind-log`）。

### Electron

- 在測試腳本裡載入專案的 `main.js`，並把 `dialog.showSaveDialog`／`showOpenDialog` 換成假的回應，就能自動測試開檔、存檔、選單。
- 選單項目可以用 `Menu.getApplicationMenu()` 找到後呼叫 `click()`。
- 按鍵用 `webContents.sendInputEvent`，例如 Ctrl+S。
- 要模擬「打字後不離開輸入框」，要用 `sendInputEvent({type:"char"})` 真的打字。用程式直接設定 `value` 的話，離開時不會觸發 change 事件。

### Google 試算表同步

- **用模擬的 Google 測試**：
  1. `node tools/make-cloud-test.js` 產生 `_cloud_test.html`。
     - 這是 `index.html` 加上 `tools/cloud-mock.js`：假的登入元件和 Drive、Sheets API，並指定一個測試用的用戶端 ID。
     - 這個檔案已列在 `.gitignore`，用完刪掉。
  2. 模擬的雲端資料放在**外層頁面**的 `window.__cloudStore`。在預覽頁裡用 iframe 開 `_cloud_test.html`，換 iframe 時雲端資料還在。
  3. 要模擬「換一台裝置」：先存下這台的 `grind-log/v1*` localStorage，換成另一組，再開新的 iframe。
  4. `__cloudStore` 可以控制的測試情境：
     - `failNext`（正規表示式）：下一個符合的請求回傳 500。
     - `expireAuth`：下一個請求回傳 401。
     - `denyToken`：登入視窗被關掉。
     - 在 `files[id].sheets[].cells` 直接改內容：模擬使用者在試算表裡手動修改。
  5. `db`、`cloud`、`cloudBusy` 是用 `let` 宣告的頂層變數，不在 `window` 上，要用 `iframe.contentWindow.eval("db")` 取得。
- **用真的 Google 帳號測試**：
  - 只能由使用者自己在預覽視窗裡登入。**不要代替使用者輸入帳號密碼**。
  - 用戶端的「已授權的 JavaScript 來源」要有 `https://rabbit99.github.io`（線上版）和 `http://localhost:5599`（預覽）。其他網址（例如 `127.0.0.1`）開啟時，Google 會拒絕登入。
- **用戶端 ID** 寫在 `index.html` 的 `GOOGLE_CLIENT_ID`，是公開資訊；絕不要放用戶端密鑰。

### 模擬寫入失敗

- 在 iframe 裡覆寫 `Storage.prototype.setItem`，讓特定 key 拋出 `QuotaExceededError`。
- 要在開機時就失敗（例如測備份失敗），用 `srcdoc` 在主程式前面插入覆寫的 script。

### 語法檢查

- `index.html`：把 `<script>` 的內容丟給 `new Function(...)`。
- `main.js`、`preload.js`：`node --check`。

## 文件維護

| 改了什麼 | 要更新的文件 |
|---|---|
| 功能的行為 | `docs/features/` 裡對應的文件：行為規則、邊界情況、設計決策 |
| 計算方式 | `docs/calculations.md`，必要時也改 `docs/format.md` 的推導公式 |
| 資料格式、讀入時的整理規則 | `docs/format.md` |
| 程式結構（新區段、新的全域狀態、新的 localStorage key） | `docs/architecture.md` |
| 開發流程、測試方法 | 本文件 |
| 新發現、這次不修的問題 | `docs/tech-debt.md` |
| 使用者看得到的用法 | 根目錄的 `README.md` |
| 資料存放位置、會傳給誰、Google 權限 | 根目錄的 `privacy.html`（公開的隱私權政策，要跟程式行為一致） |
