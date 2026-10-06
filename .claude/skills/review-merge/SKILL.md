---
name: review-merge
description: 替目前的功能分支跑獨立審查，沒有問題就 fast-forward 合併到 main、推上 GitHub 並確認 GitHub Pages 部署完成。使用者說「跑審查，沒問題就合併」「審查後合併」「review 完合併」，或一個分支的修改已完成、準備合併時使用。
---

# 跑審查，沒問題就合併

這個專案（Grind Log 練功記錄，`index.html` 單檔網頁 app）的 `main` 一推上去就會由 GitHub Pages
部署到 https://rabbit99.github.io/grind-log/ 。所以合併前一定要先有獨立審查，確認沒有會出錯的問題。

使用者已授權這個流程自動進行：審查、依結果修正、合併、推送、確認部署、刪除已合併的本機分支，
都不需要逐步詢問。只有遇到需要使用者做決定的取捨（會改變桌面版外觀、改變資料格式、
可能刪掉使用者資料）時，才先停下來說明選項。

回報一律用繁體中文。

## 1. 確認分支狀態

```bash
git status --short                      # 必須乾淨；有修改先 commit
git log --oneline main..HEAD            # 要審查的 commit
git fetch origin
git merge-base --is-ancestor origin/main HEAD && echo 可以 fast-forward
```

- 不能在 `main` 上跑這個流程。
- 不能 fast-forward 時先把分支 rebase 到 `origin/main`，重新驗證後再繼續。

## 2. 開審查 subagent

**審查者是茶茶（`reviewer-chacha`，AI 一人公司的公司級獨立 QA）**，用 Agent 工具、`subagent_type: reviewer-chacha` 開。prompt 要自帶完整背景，因為它看不到這段對話。

- 茶茶定義在 ai-company repo 的 `.claude/agents/`，所以要從 ai-company 開 session（並把本 repo 加為額外工作目錄）才叫得到。
- **叫不到茶茶時（agent 清單沒有 `reviewer-chacha`）就停下來告訴使用者，不要自行退回 `general-purpose` 審查後合併。**
- 茶茶只有 Read／Glob／Grep／Bash／WebSearch／WebFetch，**沒有瀏覽器**，也沒有 `node_modules`（沒裝 jsdom／puppeteer）。因此分工是：
  - 瀏覽器實測、跟 main 對照由**主對話**做，結果（步驟、截圖描述、`db` 比對、console 錯誤）整理進 prompt 的「背景」交給茶茶核對。
  - 茶茶負責 diff 逐行審查、語法檢查（`new Function` 跑 `<script>`）、對照 `docs/features/*.md`、`CLAUDE.md` 鐵律、事實與宣稱是否屬實；可用 Bash 跑 node 做不需要 DOM 的檢查。
  - 茶茶不能自己實測的項目，要在回報裡標明「未實測、僅讀碼推測」。
- 審查意見要記到 ai-company 的 `departments/content-studio/projects/grind-log/review-log.md`（主對話代記），並在 plan.md 該切片列記下本 repo 的分支名與 commit hash。

prompt 必須包含：

- **範圍**：repo 路徑、分支名、`git diff main..<branch>`、commit 列表、改了哪些檔案。
- **限制**：
  - **只讀不改**：不改 repo 檔案、不 commit、不切分支。
  - 審查者（茶茶）不開瀏覽器；若用 Bash 起暫時伺服器或產生暫存檔，一律放 scratchpad，用完關掉、刪掉。
  - **不要碰 localhost:5599**：那是使用者的預覽，裡面有真實資料。
  - 主對話自己做瀏覽器實測時，同樣不碰 5599，測完清掉自己 origin 的 localStorage、關掉伺服器、刪掉暫存檔。
  - 回報用繁體中文。
- **背景**：要修的問題是什麼、改法摘要、自己已經做過的實測與結果。
- **已知且刻意不處理的 main 既有問題**：列給它，並寫明「除非這次讓它們更糟，不用再報」。清單見下方「待辦」。
- **檢查項**：針對這次改動的具體風險列出來，例如邊界值、怪資料、與其他功能的交互、901px 以上是否和 main 相同、語法。需要瀏覽器的項目（如 901px 以上外觀）由主對話先實測，把結果放進「背景」，請茶茶核對而不是自己實測。
  - 語法可以用 `new Function` 檢查 `<script>` 內容。
- **回報格式**：
  - 每個發現標明嚴重度：阻擋合併／應修但不阻擋／小建議。
  - 附行號與具體重現情境；推測要標明是推測。
  - 最後一句給結論：是否可以合併。

## 3. 判讀結果並修正

| 發現 | 處理 |
|---|---|
| 阻擋合併 | 一定要修 |
| 應修但不阻擋，而且是這個分支造成的 | 修 |
| 小建議，與這個分支直接相關、改起來便宜 | 順手修 |
| main 本來就有、這次沒變糟 | 不修，列入待辦 |
| 需要使用者做設計取捨 | 不自行決定，回報時說明選項 |

修正時要遵守：

- 每一項都要實測，能對照的就和 main 比較：
  - `git show main:index.html > _main_compare.html` 產生對照檔，用完刪掉，絕不 commit。
  - 在 iframe 裡同時載入兩版做比較。
- 修正另開 commit，不要 squash，除非中間的 commit 是壞的。
- 如果修的是「阻擋」等級的問題，用 SendMessage 請**同一個**審查 agent（茶茶）複查修正的 commit，確認沒問題才合併。
  - SendMessage 續用不了時，重開一次茶茶，prompt 附上前一輪的意見（review-log）和修正 commit，請它只複查那些項目。
- 茶茶給 🔴 即為阻擋、🟡 為應修或建議、🟢 可保留；對應本節上方判讀表的三級。
- 如果只是小修，自己驗證完就可以合併。

## 4. 合併、推送、確認部署

```bash
git fetch origin
git merge-base --is-ancestor origin/main <branch> && echo 可以 fast-forward
git checkout main
git merge --ff-only <branch>
git push origin main
```

確認部署：

1. 用 `gh run list --repo rabbit99/grind-log` 找到對應 commit 的 `pages build and deployment` run。
2. 用 `gh run watch <id> --exit-status` 等它完成。
3. 在瀏覽器用 `fetch('/grind-log/index.html?nocache=…',{cache:'no-store'})` 取得線上版，確認裡面有這次新增的特徵字串。
4. 確認頁面沒有錯誤訊息。

最後刪除已合併的本機分支：`git branch -d <branch>`。遠端通常只有 main。

## 5. 回報

用繁體中文依序說明：

1. 審查結論。
2. 合併前修了什麼、為什麼。
3. 測試結果。
4. 刻意沒處理的項目。
5. 更新後的待辦清單。

## 專案慣例與測試方法

以 repo 裡的文件為準，這裡不重複寫，避免兩邊不一致：

- 開發流程、commit 規範、編碼規範、測試方法（預覽資料備份、跟 main 對照、預覽窗格隱藏時改用 Electron、模擬寫入失敗）：`docs/development.md`。
- 絕對不能破壞的規則：根目錄的 `CLAUDE.md`。
- 審查時，把這次改到的功能對應的 `docs/features/*.md` 一併交給審查 agent，請它確認：
  - 程式行為符合文件的「行為規則」。
  - 文件有跟著程式更新。

## 待辦（main 既有、尚未處理）

已知問題、技術債，以及需要其他環境才能驗證的項目，都記在 `docs/tech-debt.md`：

- 審查時把它列給審查 agent，當成「已知且刻意不處理」的清單。
- 修掉一項就從文件裡刪掉，並在 commit 訊息提到它。
- 審查發現新的既有問題、這次不修的，補進文件。

## 工具使用注意

**Edit 工具會照字面保留** `\n` 這類字元。但用 bash heredoc、`printf` 或 `node -e` 產生補丁時，跳脫字元會被多處理一層，容易對不上。補丁腳本要用 Write 工具寫。
