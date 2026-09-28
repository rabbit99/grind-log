# 開發文件

這裡是 Grind Log 的開發文件：功能定義、計算規則、架構與開發流程。
使用者看的說明在根目錄的 [README.md](../README.md)。

## 怎麼用這些文件

- **改功能之前**：先讀對應的功能文件（`features/`）。
  - 「行為規則」和「設計決策」寫的是目前的正確行為和原因。改動不能在沒說明的情況下違反它們。
- **改完之後**：同一個 commit 裡更新對應的文件，文件要和程式一致。
- **新發現、這次不修的問題**：記到 [tech-debt.md](tech-debt.md)。
- **文件和程式不一致時**：以程式為準，先確認哪一邊是對的，再修正另一邊。

## 目錄

### 總覽

| 文件 | 內容 |
|---|---|
| [architecture.md](architecture.md) | 檔案組成、`index.html` 的區段地圖、資料流、全域狀態、localStorage、開機順序、Electron、部署 |
| [calculations.md](calculations.md) | 所有數字怎麼算：時數、經驗、費用、效率、當前%、排序、格式化 |
| [format.md](format.md) | 資料格式 `grind-log/v1` 的規格，以及讀入時的整理規則 |
| [development.md](development.md) | 開發流程、編碼規範、測試方法、文件維護規則 |
| [tech-debt.md](tech-debt.md) | 技術債與已知限制 |

### 功能

| 文件 | 功能 |
|---|---|
| [features/hero.md](features/hero.md) | 經驗條與本級統計 |
| [features/session-form.md](features/session-form.md) | 記一筆時段（新增、修改） |
| [features/records.md](features/records.md) | 記錄表（啟用勾選、分頁、改／刪） |
| [features/worker-stats.md](features/worker-stats.md) | 人員效率表 |
| [features/workers.md](features/workers.md) | 人員與時薪 |
| [features/levels.md](features/levels.md) | 等級經驗對照表 |
| [features/daily.md](features/daily.md) | 每日進度頁 |
| [features/file-io.md](features/file-io.md) | 匯出、匯入、還原示範資料、清空全部、Electron 開檔／存檔 |
| [features/storage-recovery.md](features/storage-recovery.md) | 自動儲存、讀不出資料時的保護與救回 |
| [features/layout.md](features/layout.md) | 頁籤、版面、窄螢幕、表格左右捲 |

## 功能文件的格式

每份功能文件大致有這些段落，沒有內容的段落可以省略：

1. **目的**：這個功能要解決什麼問題。
2. **介面**：在畫面上的位置、元素 id。
3. **行為規則**：目前的正確行為，改動時要維持。
4. **邊界情況**：怪資料、空資料、極端值怎麼處理。
5. **設計決策**：為什麼這樣做，通常是踩過的坑或使用者的要求。
6. **相關程式**：主要的函式和元素，方便在 `index.html` 裡搜尋。
7. **修改時要檢查**：改到這個功能時，至少要驗證哪些情境。
