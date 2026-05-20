# 變更紀錄

## v0.1.5 — 2026-05-20

狀態：正式發佈版本。此版本已建立 tag、GitHub Release，並已 npm publish。

### 已修正

- 修正 README 新手介紹頁連結，改用 GitHub Pages 絕對網址 `https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-intro.html`，避免 GitHub 與 npm 顯示時用相對路徑解析失敗。

## v0.1.4 — 2026-05-20

狀態：正式發佈版本。此版本已建立 tag、GitHub Release，並已 npm publish。

### 已改善

- 新增 `START_NEXT_SESSION_PROMPT.txt` 作為下次開工可直接貼上的便利副本；`dev/SESSION_HANDOFF.md` 仍是權威真源，`doctor` 會檢查副本與 handoff opening message 是否一致。
- 新增 public GitHub 新手介紹頁 `agent-handoff-kit-intro.html` 與品牌圖片；README 首屏、三步上手、工作模式與安全說明已跟隨該頁的 onboarding message。
- `init`、`upgrade --dry-run`、`doctor`、help 與版本提示輸出補上中文人話解讀與功能性 emoji，讓新手知道 conflict、dry-run、doctor failed 下一步應怎樣做。
- 外部技能流程、子代理計劃、demo workspace 或其他工具的 closeout 不再可被視為取代目前根目錄的 Agent Handoff Kit 持久化；核心規則、治理規則包與 QA 錨點已補防線。

## v0.1.3 — 2026-05-19

狀態：正式發佈版本。此版本已建立 tag、GitHub Release，並已 npm publish。

### 已改善

- 安裝／升級完成的回傳訊息加入 emoji 視覺重點（✅ 完成、⚠️ 非 Terminal 指令、📋 貼上區、🚀 描述任務、🩺 doctor 檢查、💾 備份），令關鍵下一步更易辨識。
- 安裝後與日常開工提示統一為單一精簡句，不再要求用戶在提示內逐一列出檔案。`AGENTS.md` 已是開工讀序唯一真源，AI 讀它就會自行讀入交接、紀錄與索引；避免提示與真源漂移。長檔案列表降為小字故障排除備用。
- CLI 執行時會非阻塞檢查 npm latest；若有新版，顯示更新提示與 GitHub release notes 連結。離線、逾時、CI 或設定 `AGENT_HANDOFF_KIT_NO_UPDATE_CHECK=1` 時不影響原命令。
- README「目前限制」刪除重複句。

### 已修正

- `doctor` 對 `dev/PROJECT_INDEX.md` 的版本錨點不再寫死目前版本號。先前 `doctor` 要求該檔同時含「Agent Handoff Kit template version」與當前版本字串，但 `upgrade` 會保留該用戶檔不覆寫，導致以較舊版本安裝的專案升級後 `doctor` 回報 `status: failed`。現改為只檢查版本行存在，不比對寫死版本；不需再手動改版本行。原始碼倉庫升級安全 QA 已新增「舊版本行升級後 `doctor` 仍須通過」的回歸守門測試。

## v0.1.2 — 2026-05-19

狀態：正式發佈版本。此版本修正 `v0.1.1` package README 仍顯示候選狀態的文件事實錯誤。

### 已修正

- README、發佈級 QA、版本 metadata 與 QA 腳本已對齊正式發佈狀態。
- 保留 `v0.1.1` 的功能改善，同時避免 npm package 頁面誤導用戶以為最新版本仍是候選版。

## v0.1.1 — 2026-05-19

狀態：正式發佈版本。此版本已建立 tag、GitHub Release，並已 npm publish；`v0.1.2` 修正其 README 發佈狀態文字。

### 已改善

- 安裝完成後的 Terminal 指示改為清楚分隔的中文「下一步」區塊，明確說明後續文字應貼到 AI 對話，不應在 Terminal 當作指令輸入。
- README 全文重整為用戶向說明，優先說明安裝後第一步、如何開始第一個 AI 工作階段、如何檢查安裝、如何收工，以及目前版本限制。
- 發佈級 QA 增加治理 QA 缺口矩陣，覆蓋重複、矛盾、膨脹與負載、認知影響、事實漂移與執行落差。
- 原始碼倉庫 QA 增加舊安裝誤導提示的負面檢查，防止它重新出現在產品或文件內容中。

## v0.1.0 — 2026-05-17

狀態：早期正式發佈版本。這是可安裝的 `0.1.0` 版本，但仍未宣稱 requirements-complete。

### 新增

- Prototype `agent-handoff-kit` CLI scaffold，包含 `init`、`upgrade`、`doctor`。
- 原始碼倉庫專用 `npm run qa:prototype`，檢查安裝、`doctor`、套件預演、過時字串與公開輸出污染標記。
- 原始碼倉庫專用 `npm run qa:packs`，檢查規則包路由、安全升級與混合場景分階段載入。
- 原始碼倉庫專用 `npm run qa:upgrade`，檢查升級合併、備份與衝突行為。
- 原始碼倉庫專用 `npm run qa:release`，檢查發佈前準備度、套件邊界、文件錨點，以及從安裝到收工再到接力開工的多步驟用戶流程模擬。
- `doctor` 第一輪 schema checks，覆蓋 handoff、log、project index、doc sync registry 與 rule-pack router 結構。
- `doctor` 任務入口事實欄位檢查，覆蓋 Fact Base、External Sources、Local QC Commands 與 Next Task Required Reading。
- `doctor` handoff 對賬欄位檢查，覆蓋 Durable Anchors、Closeout-Reconciled State、Task Understanding Summary 與 State Reconciliation Check。
- `SESSION_HANDOFF` 語義標記與本地化標題驗收，支援用戶項目把交接筆記標題翻成中文或其他語言。
- 發佈前人工審閱清單，列明候選發佈前的通過項、人工確認項與阻擋項。
- 候選發佈準備狀態，包含 `0.1.0` 候選版本口徑、非空既有專案升級重驗與 README 安裝口徑整理。
- 公開產品、GitHub repo、npm package 與 CLI 已改名為 `agent-handoff-kit`，並在新名稱下重跑發佈前驗收。
- README 用戶入門內容，說明工具用途、安裝、日常使用、安裝檔案、工作模式與規則包。
- `docs/qa/` 下的發佈級驗收計劃。
- 輕量 runtime core 範本，覆蓋開工、收工、項目索引、文件同步登記、session handoff、session log 與規則包路由。
- `AGENTS.md`、`CLAUDE.md`、`GEMINI.md` 跨工具入口模板。
- coding、writing、research、agent governance、release、knowledge、communication、safety 等按需載入規則包。

### 已對齊

- Public product naming 使用 `Agent Handoff Kit`。
- README 區分 npm package 內容與原始碼倉庫設計文件。
- Closeout opening-message UX 使用 copy marker 與 fenced `text` block，不使用額外 end marker。
- Closeout handoff UX 要求收尾方對賬當前狀態，不只追加快照，並明示沒有過時 handoff state。
- Safety 採短核心基線加按需載入安全規則包，覆蓋高風險檔案、shell、Git、API、CLI、安裝工具、部署、發佈、憑證與權限工作。
- Scenario / working-mode guidance 已放入 README、runtime core、installer design 與 CLI help，未新增 profile files。
- 非簡單任務的必讀事實入口已放入 runtime 模板；可達不等於已讀入，未讀來源不得當成沒有資料。
- 交接筆記不再硬性依賴英文段名；英文是預設模板語言，結構驗收改以 `ack:section:*` 與 `ack:field:*` 語義標記為準。

### 已知限制

- 完整 section-aware merge 仍待補，現在只有 `AGENTS.md` managed-core merge 的初步安全合併。
- 修改 merged files 前的 backup 已有初步實作。
- Unsafe bridge files 的 conflict reporting 已有初步實作。
- 非空既有專案 upgrade trial 已通過；如 installer 後續有改動，需以等效臨時專案重驗。
- Installer hardening 仍未完成；此版本只作早期可用版本，不宣稱穩定版完整能力。
