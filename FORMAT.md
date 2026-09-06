# Grind Log 通用格式 v1

一種記錄「分母會變動的進度」的通用資料格式。

## 為什麼需要這個格式

用「每小時獲得幾 %」比較效率是錯的。每一級的 % 代表的實際量不同 —— 51 等的 1% 是
553,488 點經驗，53 等的 1% 是 671,282 點。同樣的打怪速度，等級越高 %/hr 看起來越差。

這個格式的原則是：**只儲存原始觀察值，所有效率指標都用算的。**

只要換掉 `levels` 對照表，同一套工具可以記錄任何有階段門檻的進度 —— 遊戲練等、
證照時數、健身課表、外包計件。

## 結構

```json
{
  "schema": "grind-log/v1",
  "meta": {
    "title": "天堂經典版 練功記錄",
    "unit": "exp",
    "currency": "TWD",
    "updatedAt": "2026-09-06T00:00:00.000Z"
  },
  "levels": [
    { "level": 51, "required": 55348837, "confidence": "measured", "note": "" },
    { "level": 53, "required": 67128205, "confidence": "estimated", "note": "x1.10 外推" }
  ],
  "workers": [
    { "id": "me",   "name": "我",   "hourlyRate": 0,     "billable": false, "note": "自己練，不計費" },
    { "id": "hire", "name": "代練", "hourlyRate": 200,   "billable": true,  "note": "日薪1600÷8h" }
  ],
  "sessions": [
    {
      "id": "s1",
      "date": "2026-09-01",
      "start": 7,
      "end": 10,
      "workerId": "me",
      "level": 51,
      "gainedPct": 4,
      "enabled": true,
      "note": ""
    }
  ]
}
```

## 欄位

### meta
| 欄位 | 型別 | 說明 |
|---|---|---|
| `title` | string | 這份記錄的名稱 |
| `unit` | string | 進度單位名稱，如 `exp`、`小時`、`件` |
| `currency` | string | 費用幣別 |
| `updatedAt` | ISO 8601 | 最後修改時間 |

### levels
階段門檻對照表。`level` 是階段編號，`required` 是**該階段升到下一階段**所需的總量。

`confidence` 用 `measured`（實測）或 `estimated`（推估）標記資料可信度，介面會把
推估值標成不同顏色，避免拿估值當事實用。

### workers
| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | string | 唯一識別碼，`sessions.workerId` 參照它 |
| `name` | string | 顯示名稱 |
| `hourlyRate` | number | 時薪。日薪請自行換算，或設 0 表示不計費 |
| `billable` | boolean | 是否計入費用統計 |

### sessions
| 欄位 | 型別 | 說明 |
|---|---|---|
| `date` | `YYYY-MM-DD` | 開始日期 |
| `start` / `end` | number | 小時制，可用小數（`3.5` = 3:30）。`end` 小於 `start` 視為跨午夜 |
| `workerId` | string | 參照 `workers.id` |
| `level` | number | 該時段所處階段 |
| `gainedPct` | number | 該時段獲得的百分比 |
| `billableHours` | number | null | 實際計費／有效時數。**省略或 `null` 視為等同時段長度** |
| `enabled` | boolean | 是否列入統計。**省略視為 `true`**，所以舊檔可以直接匯入 |

**跨階段的時段**請拆成兩筆分別記錄，否則換算會有誤差。

### 為什麼時段長度不等於計費時數

真人代練的時段含休息。休息時間**既不計費，也不會產生進度**，所以
`billableHours` 同時是費用和效率的分母，`start`/`end` 只描述佔用的時間窗。

例：時段 10:00–18:00（8 小時）但實際計費 7 小時 —— 費用算 7 小時，
每小時經驗也除以 7。若改用 8 去除，算出來的效率會比代練自己的記錄低 12.5%。

留空的話兩者相同，所以不需要計費概念的資料（自己練、機器掛網）不必填。

`enabled: false` 的時段仍會留在檔案裡、也照樣顯示在記錄表，只是不計入任何統計
（經驗條、人員效率、時數、費用都跳過）。用來排除維修中斷、測試資料，或試算
「少請一個打手會差多少」，不必真的把記錄刪掉。

## 推導公式

所有指標都不儲存，由原始值即時計算：

```
hours          = end >= start ? end - start : end + 24 - start
requiredUnits  = levels[level].required
hours          = end − start                  ← 時段長度（跨午夜 +24）
billHours      = billableHours ?? hours       ← 計費／有效時數
gainedUnits    = gainedPct / 100 × requiredUnits
unitsPerHour   = gainedUnits / hours          ← 唯一可跨階段比較的效率指標
pctPerHour     = gainedPct / hours            ← 僅限同階段內比較
cost           = billable ? hours × hourlyRate : 0
costPerPct     = cost / gainedPct
costPerMUnit   = cost / (gainedUnits / 1e6)   ← 可跨階段比較的成本指標
```

## 相容性

- 匯出的 JSON 可直接餵給任何實作，不依賴任何執行環境。
- CSV 匯出為扁平化的 sessions（含推導欄位），供試算表使用；CSV 不是主格式，
  因為它無法承載 `levels` 與 `workers`。
- 未知欄位一律保留不刪，方便日後擴充。
