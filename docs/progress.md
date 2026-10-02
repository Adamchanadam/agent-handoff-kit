# 專案總覽 / Project dashboard

對 AI 說「開啟專案進度頁」，或啟用[快捷入口](commands.md)後使用 `/handoff-kit-progress`。Codex 使用 `$handoff-kit-progress` 或從 `/skills` 選取。這是每個已安裝 Kit 的專案共用的固定頁面，無須重新設計 HTML。

## 三個入口

- **總覽**：專案名稱、交接記錄的目前工作、各項工作狀態、待完成／等待／待驗收事項、成果及最近變更。「正在查看」只表示你選中的工作，不改變交接狀態。工作排列不表示先後順序，子項完成也不表示整項完成。
- **歷程**：近 7 日、近 30 日、自選日期、關鍵字及工作線篩選。日期標示年份，按封存索引逐批查閱歷史；日期不隱藏目前未完事項。
- **文件導覽**：核心關係圖顯示八種 Kit 文件角色；清單另列已登記的專案文件，並非專案所有檔案。點選節點突出相關文件與方向，查看用途、原文及來源，也可切換清單。沒有明確記錄的關係不靠 AI 猜補。

保存紀錄後自動更新，不需要刷新。點選主線、日期及文件時有短動畫；新資料短暫標示改變處，支援減少動畫設定。動畫不代表 AI 正在思考、已驗收或已完整接收交接。

品牌旁的版本讀取專案 `PROJECT_INDEX.md` 的 `Stack`，沿用 Kit 共用讀取方法；「資料依據」另列啟動頁面工具的套件版本。兩者不同會提示，缺失或格式無效則顯示「版本未核實」，不以工具版本代替專案版本。讀取不查網絡、不呼叫 AI，也不升級專案。

## 少量維護，不另寫報告

AI 在正常、已授權的保存時，維護 Index 的專案名稱／目標與 Handoff 的精簡工作表；只改有變的事項，不記錄每一步終端操作。兩份模板定義欄位格式，詳細證據保留在原有位置。尚無工作表項目的專案，直接顯示已有「下一步」及「風險與阻礙」，標明尚未分類，不猜測其狀態。首頁只顯示有界摘要；其餘項目數量與查看完整工作／交接原文的入口一併列出。缺失資訊保持未記錄，不捏造階段、百分比或完成數字。「交接保存」專指交接檔案保存時間，不代表整個專案最後有變更的時間。

介面支援繁中／英文。來源可選 `Name zh-Hant`、`Goal zh-Hant`、`Title zh-Hant`、`Summary zh-Hant`，缺少則保留原文；日誌也可在正常保存時加入簡短中文標題／摘要，不必回寫歷史翻譯。讀取、篩選、動畫及同步由程式處理，**不呼叫 AI、不要求第二份進度 JSON 或重複報告**。

## 啟動及環境

沿用 Kit 的 Node.js 與瀏覽器，不需要資料庫、Python、建置工具或 API key。

```text
npx --yes @adamchanadam/agent-handoff-kit@latest progress --background --root <project-root>
```

`npx` 可能下載 CLI 至快取；未發佈版本使用選定的本機套件。`progress` 自身不查網絡版本、不安裝／升級、不寫回專案。`--background` 啟動或重用同專案、版本與頁面內容的背景服務，開啟瀏覽器後返回。`--no-open` 只給網址；`--port <0-65535>` 指定埠。不停止不相符的服務。

只綁定 `127.0.0.1`，拒絕跨網站請求及寫入。有頁面連線時持續運作；全部頁面斷線後保留 8 小時，未曾開啟亦保留 8 小時。無連線時停止輪詢紀錄，再次開啟立即讀取最新內容並延長保留時間。超時、電腦重啟或服務結束後，使用既有快捷入口便會重新啟動；舊網址不能自行啟動已停止的本機程式。前景模式可按 Ctrl+C 立即停止。

## 來源及邊界

| 內容 | 來源 | 界限 |
|---|---|---|
| 名稱／專案目標 | `dev/PROJECT_INDEX.md` → `Project` | 512 KiB |
| 工作／交接 | `dev/SESSION_HANDOFF.md` → `Work Items` 及原有段落 | 1 MiB；128 項工作 |
| 最近變更 | `dev/SESSION_LOG.md` | 頭 64 KiB、十則完整條目；首頁三則 |
| 歷程 | 主日誌及 `dev/SESSION_LOG_archive/INDEX.md` 登記批次 | 每次 256 KiB 日誌、4 檔、20 結果；索引 512 KiB |
| 文件 | Kit 角色、Index Directory Map / Document Relations、工作 Source | 160 文件；文字預覽 1 MiB |

自訂文件關係在 Index 的 `## Document Relations` 使用 `From | To | Relation`：已登記的相對路徑及 `references`、`routes`、`mirrors`、`checks`。只表達關係，不授權同步。只讀專案內登記文件，拒絕越界、隱藏設定、機密名稱及遷移內部檔；原文以純文字顯示，不執行 HTML 等內容。已知憑證模式會遮蔽，不代替來源的機密管理。

首頁與歷程共用同一日誌欄位讀取方式，支援逐行欄位、項目符號、粗體欄位名及縮排續行；中文標題與摘要在兩處一致使用。識別欄位不會被當成摘要。歷程只涵蓋索引登記批次。缺索引、格式錯誤、缺檔、未封口／過大條目、同 Event ID 內容衝突及超限都明示覆蓋不足。日誌可選 `Event ID` 用於搬移去重、`Work` 對應工作 ID；無 Event ID 則用原標題與內容辨識；原有 ID 是 agent/session 識別，可重複。單則上限 64 KiB；每查詢最多記住 10,000 事件，超過請收窄日期。最多 32 個分頁查詢，十五分鐘到期；來源改變即拒絕舊分頁。日期排序只涵蓋已載入結果。

有頁面連線時每半秒檢查狀態，無變動不重讀內容。斷線時保留已顯示資料，以 1、2、4、8、16、30 秒間隔重試，其後每 30 秒一次；回到頁面會提早重連，也可按「立即重連」。服務重啟後會更新歷程及詳情，保留日期、工作選擇及介面語言。失敗提示附可複製的重開口令。首頁不掃歷史；最近查過的 128 份封存檔會監看。文件地圖只檢查登記檔案的存在及時間。讀前／後核對身份與穩定性；無效來源保留上次有效畫面並告警，升級鎖存在即暫停。歷程自動更新每輪最多五個有界請求，更多可繼續查閱。

一般 Markdown 不是交易格式：結構完整的中間狀態不能永遠與最終意圖區分。來源完成聲稱不等於獨立驗收；總覽不代替 AI 全文接收交接包。

## English

The brand badge reads the project's Kit version from `PROJECT_INDEX.md` Stack through the shared Kit reader. Sources also shows the running dashboard package version. Different versions are indicated; missing or invalid project metadata displays “Version unverified”, never the tool version as a substitute. This reads locally without model calls, network version checks or project upgrades.

Open the dashboard through your AI or the [command entry](commands.md). The fixed, reusable view has Overview, History and Documents. Overview shows project identity, current work recorded in handoff, declared work and states, outstanding work and references. “Viewing” only identifies the reader's selection; it does not change recorded work. History includes years in date headings and filters saved events by date, keyword and work ID, reading indexed archives in batches. The core map shows eight Kit document roles; the list also includes registered project files, not every project file. It highlights declared relationships and opens source text. Workstream order is not a sequence; child completion never completes its parent.

At normal authorized saves, maintain only changed meaningful rows in Handoff `Work Items` and stable identity in Index `Project`; their templates own the fields. No extra report, per-terminal-step record or progress JSON is required. Without work rows, existing Next Priorities and Risks / Blockers appear directly as unclassified source text, with no inferred status. Home shows bounded excerpts and a remaining count with access to all work or the handoff source. “Handoff saved” is that file's save time, not the last change across the project. Optional `Name zh-Hant`, `Goal zh-Hant`, `Title zh-Hant` and `Summary zh-Hant` provide Chinese counterparts; otherwise source language is preserved. Logs may carry the Chinese title/summary too, without rewriting history. Missing fields stay unrecorded. Viewing, filtering, motion and live updates make no model calls or source writes.

Run the command above. Background mode reuses a matching project/version/build service; `--no-open` returns its URL, `--port` selects a port. `npx` may fetch the package; progress itself does not check network versions, install or upgrade. It needs existing Node.js and a browser, not a database, Python, build tools or API keys. It binds only to 127.0.0.1, rejects foreign origins and writes, and remains available for eight hours without connected pages, including before the first connection. File polling stops with no clients and resumes with a fresh read on return. Reopening renews the idle window. After expiry, process exit or a computer restart, use the existing command entry to start it again; a cold browser URL cannot launch a stopped local process. Ctrl+C stops foreground mode; unrelated services are not terminated.

Home and History share one event reader for plain fields, list fields, bold labels and indented continuations, including Chinese titles and summaries. Identity metadata is never used as the summary.

Limits: Handoff 1 MiB/128 work items; Index 512 KiB; 160 registered documents with 1 MiB text previews; home log prefix 64 KiB/ten complete entries, displaying three. Each history request reads at most 256 KiB from four log files and returns twenty events. Archive selection uses the 512 KiB master index. Each entry is limited to 64 KiB; queries track at most 10,000 identities, then require a narrower date range. Up to 32 cursors expire after fifteen minutes and reject source changes. Global date sorting covers loaded results only. Missing/malformed manifests, missing files, incomplete/oversized entries, Event ID conflicts and capacity limits disclose incomplete coverage. Optional log `Event ID` supports move deduplication; `Work` links a work item; otherwise original title/body identify entries; existing `ID` denotes an agent/session and may repeat.

Only registered project-relative documents are available. Hidden/secret-related paths, migration internals and real paths outside the project are rejected. Text is escaped; HTML and other executable content are never run. Known credential patterns are redacted as a secondary defense. Optional Index `Document Relations` use `From | To | Relation`, registered relative paths and `references`, `routes`, `mirrors` or `checks`; links grant no write permission.

While pages are connected, metadata is checked every half second; unchanged content is not reread. Disconnection retains the last displayed data and retries after 1, 2, 4, 8, 16 and 30 seconds, then every 30 seconds. Returning to the page or Reconnect now retries sooner. Recovery refreshes history and details, including after server restarts, while preserving filters, selection and UI language. The failure notice includes a copyable reopen prompt. Home does not scan archives; the 128 most recently queried archives are watched. Registered document existence/time is checked. Reads verify identity and stability; invalid input retains the last valid state with warnings, and upgrade locks pause reads. History auto-update makes up to five bounded requests per round; further reading is explicit. Brief transitions and change highlights respect reduced motion, never imply agent reasoning or acceptance. Structurally complete intermediate Markdown can be indistinguishable from intended final state. The dashboard proves neither independent acceptance nor full AI handoff reception.
