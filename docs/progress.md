# Agent Handoff Kit 進度頁

[English](#dashboard)

在專案的 AI 對話輸入 `/handoff-kit-progress`；Codex 用 `$handoff-kit-progress`，或從 `/skills` 選取。AI 會開啟或重用這個專案的頁面。先看頁面上的專案名稱，避免認錯專案。

## 可以看到甚麼

- **總覽**：目前工作、成果、未完成、等待和待驗收事項。「正在查看」只是你選中的工作，不會改動紀錄。工作排列不是完成順序，完成子項也不代表整項完成。
- **歷程**：用近 7 日、近 30 日、自選日期、關鍵字和工作篩選，找回已保存的改變。日期篩選不會隱藏目前未完事項。長期紀錄分批讀取，還有內容時可繼續載入；日期排序只包括已載入結果。
- **文件地圖**：看重要文件的用途、關係及原文。這裏只列已登記文件，不是整個資料夾的所有檔案；沒有記錄的關係不會自行猜補。

## 何時更新，會用多少 token

AI 正常保存工作紀錄後，頁面自行更新，不用刷新，也不用重新設計。AI 只維護有變的進度和必要紀錄，不必記下每一步操作或再寫一份報告。

叫 AI 開頁面和保存紀錄會使用一些 token；之後瀏覽、篩選、動畫和畫面更新不呼叫 AI。沿用安裝時已有的 Node.js 和瀏覽器，不需另外安裝資料庫、Python 或購買金鑰。進度頁程式會隨正常安裝／升級一併準備好；開頁不需下載工具或連接 npm。

頁面可切換繁體中文和英文。若紀錄本身沒有翻譯，就保留原文。動畫只提示選取或資料變更，不表示 AI 正在思考或工作已驗收。

## 看到缺漏或舊資料時

| 情況 | 意思與做法 |
|---|---|
| 未記錄／尚未分類 | 原有紀錄沒有這項資料。AI 不會猜進度百分比或完成狀態；可查看原文，或請 AI 在正常保存時補清楚。 |
| 紀錄只顯示一部分 | 首頁先顯示摘要，其餘可看完整工作或原文。歷史資料太多、缺檔或格式有問題時，頁面會提示未讀齊；縮窄日期或請 AI 查明原因。 |
| 斷線／更新失敗 | 畫面保留上次資料並提示，會自動重試。可按「立即重連」；仍失敗就再用進度頁指令。 |
| 升級中 | 暫停讀取，等升級完成後再看，避免把更新到一半的內容當作最新。 |
| 版本未核實／版本不同 | 頁面從專案讀取這套工具的版本；讀不到不會猜。「資料依據」另列開啟頁面的工具版本。有疑問用 `handoff-kit-check`；查最新正式版用 `handoff-kit-update`。候選版實測須在執行 `npx` 的工作目錄選擇受控的一般 `registry=`，不是只以 Node 讀取專案 `.npmrc`。 |

「交接保存」是交接文件的保存時間，不是所有專案檔案最後修改的時間。未保存的聊天內容不會出現。頁面只整理已保存的內容，不能證明 AI 已讀齊交接或成果已經驗收。

## 關掉後怎樣重開

頁面開着時會持續連線。全部頁面關閉後，本機服務保留八小時；閒置時不反覆讀檔。超過時間、電腦重啟或服務停止後，再用同一個進度頁指令即可。舊網址不能自己啟動已停止的程式。

這是你電腦上的檢視頁，不會公開上網。查看、篩選和點選文件不會改檔；它只讀取專案內已登記、允許顯示的文件，原文以文字顯示。請勿把密碼等秘密寫進專案紀錄。

## Dashboard

In your project’s AI conversation, enter `/handoff-kit-progress`. In Codex, use `$handoff-kit-progress` or select it through `/skills`. The AI opens or reuses that project’s page. Check the displayed project name so you know which project you are viewing.

### What you can see

- **Overview**: current work, results, unfinished items, things waiting and work awaiting checks. “Viewing” identifies your selection without changing records. The order of work items is not a completion sequence, and completing a child does not complete its parent.
- **History**: find saved changes using the last 7 days, last 30 days, custom dates, keywords and work filters. Date filters do not hide current outstanding items. Long histories load in batches; load more when available. Date sorting covers only loaded results.
- **Documents**: see important files, their purpose, connections and source text. Only registered files appear, not every file in the folder. Unrecorded connections are not invented.

### Updates and token use

The page updates when the AI saves normal work records, without a refresh or redesign. The AI maintains changed progress and necessary records, rather than logging every action or writing a second report.

Asking the AI to open the page and saving records use some tokens. After that, browsing, filters, animation and page updates make no AI calls. It uses the tool’s existing Node.js and your browser; no database, Python or purchased key is needed. Normal installation or upgrade supplies the progress program; opening it requires no tool download or npm connection.

The interface switches between Traditional Chinese and English. Records without a translation keep their original language. Animation indicates a selection or changed data, not AI thinking or accepted work.

### Missing or older information

| What you see | What it means and what to do |
|---|---|
| Unrecorded / unclassified | The records lack that information. No progress percentages or completion states are guessed. Read the source or ask the AI to clarify it during a normal save. |
| Only part of the history | Home shows summaries with links to full work or sources. Large histories, missing files or formatting problems produce an incomplete-coverage notice. Narrow the dates or ask the AI to investigate. |
| Disconnected / update failed | The page keeps the last data with a warning and retries. Select “Reconnect now”, or use the Progress shortcut again if it still fails. |
| Upgrade in progress | Reading pauses until the upgrade finishes, so partly updated files are not treated as current. |
| Version unverified / versions differ | The page reads the version recorded in this project and does not guess if it is unavailable. Sources also lists the tool version that opened the page. Use `handoff-kit-check` for concerns or `handoff-kit-update` to check the latest release. Candidate testing selects the controlled general `registry=` in the working directory that invokes `npx`; a direct Node read of a project `.npmrc` alone is not that route. |

“Handoff saved” is the handoff file’s save time, not the last change to every project file. Unsaved chat content does not appear. The page organizes saved records; it does not prove that the AI has read the full handoff or that the work has passed its checks.

### Reopening the page

The service stays connected while a page is open. After all pages close, it remains available for eight hours without repeatedly reading files while idle. After that, a computer restart or a stopped service, use the same Progress shortcut again. An old browser address cannot start a stopped program by itself.

This is a view on your computer, not a public website. Browsing, filtering and selecting files do not edit them. Only registered files within the project that are allowed for display are read, and their contents are shown as text. Do not put passwords or other secrets into project records.
