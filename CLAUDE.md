# CLAUDE.md

給 Claude Code 的開發指引。這個專案的所有回覆、註解、commit 訊息、文件一律用**繁體中文**。

## 專案

Grind Log 練功記錄：記錄練功時段，把「每時段獲得幾 %」換算成可以跨等級比較的效率與成本。

- `index.html` 是單檔網頁 app：CSS、HTML、JS 都在裡面，沒有建置步驟。
- 同一個 `index.html` 也用在 Electron 桌面版（`main.js`、`preload.js`）。
- 網頁版由 GitHub Pages 從 `main` 發布到 https://rabbit99.github.io/grind-log/ ：**推上 main 就等於上線**。

## 開始工作前

1. 讀 [docs/README.md](docs/README.md)，找到跟這次工作有關的文件。
2. 改某個功能之前，先讀 `docs/features/` 裡對應的文件：
   - 「行為規則」是目前的正確行為。
   - 「設計決策」寫的是為什麼這樣做，多半是踩過的坑或使用者的要求。
   - 沒有明確理由時，不要違反它們。
3. 牽涉到數字的，讀 [docs/calculations.md](docs/calculations.md)。
4. 牽涉到資料格式或讀入規則的，讀 [docs/format.md](docs/format.md)。
5. 看一下 [docs/tech-debt.md](docs/tech-debt.md)，確認這次的工作是否剛好能處理其中某一項。
6. **文件和程式不一致時以程式為準**：確認後修正文件，並在回報時說明。

## 改完之後

- 在同一個分支、同一個 commit 裡**更新對應的文件**。哪種改動要更新哪份文件，見 [docs/development.md](docs/development.md#文件維護)。
- 這次發現、但不修的問題，記到 `docs/tech-debt.md`。

## 絕對不能破壞的規則

- **載入不能掉資料**：從 localStorage 載入時，`normalize()` 只做不會掉資料的轉換。會略過、刪除的規則只在匯入時執行，而且要回報。
- **讀不出資料時不能蓋掉原文**：`loadProblem` 期間暫停自動儲存，見 [docs/features/storage-recovery.md](docs/features/storage-recovery.md)。
- **XSS**：放進 `innerHTML` 的文字一律經過 `esc()`，或者改用 `textContent`。
- **TDZ**：`load()`、`normalize()` 在開機時、其他頂層 `const` 宣告之前執行，只能用函式宣告和區域變數。
- **901px 以上的桌面版外觀**、**資料格式**、**可能刪掉使用者資料的行為**：要改之前先問使用者。
- **表單的人員選單不能悄悄換人**，見 [docs/features/session-form.md](docs/features/session-form.md)。
- **效率與費用的分母是計費時數**（`billHours`），不是時段長度。

## 工作流程

- 每個修改開新分支，例如 `fix/…`、`feat/…`、`docs/…`；`main` 在合併前不動。
- 合併前一定要跑獨立審查。
  - 使用者說「跑審查，沒問題就合併」時，用本機的 `review-merge` skill。
  - 使用者已授權這個流程自動進行：審查、依結果修正、合併、推送、確認部署、刪分支。
  - 遇到上面「要先問使用者」的取捨時才停下來問。
- Commit 作者：`git -c user.email="vvbest2012@gmail.com" -c user.name="rabbit99" commit …`。
- 詳細流程、編碼規範、測試方法見 [docs/development.md](docs/development.md)。

## 測試重點

- **預覽**：`.claude/launch.json` 的 `grind-log`，在 localhost:5599。
  - 預覽的 localStorage 裡，`__preview_backup` 是使用者 160 筆真實資料的副本。
  - **測完要把 `grind-log/v1` 還原成它**。
- **跟 main 對照**：`git show main:index.html > _main_compare.html`，用 iframe 同時載入兩版比較。這個檔案用完刪掉，不要 commit。
- **預覽窗格被隱藏時**，ResizeObserver 和 requestAnimationFrame 不會執行，要改用可見的 Electron 視窗量測。
- **Electron 測試**：`app.setPath("userData", <暫存資料夾>)`，不要動到使用者的資料。

## 檔案地圖

| 路徑 | 內容 |
|---|---|
| `index.html` | 全部程式。區段地圖見 [docs/architecture.md](docs/architecture.md) |
| `main.js`、`preload.js`、`package.json` | Electron 桌面版 |
| `README.md` | 給使用者的說明 |
| `docs/` | 開發文件：架構、計算、格式、功能定義、開發流程、技術債 |
| `grind-log-*.json` | 使用者的真實資料（已被 gitignore，只讀，不要 commit） |
