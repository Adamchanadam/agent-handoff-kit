# 變更紀錄

## 尚未發佈

狀態：prototype checkpoint。這不是正式發佈、GitHub Release、npm publish 或需求完整版本。

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

### 尚未達可發佈狀態

- 完整 section-aware merge 仍待補，現在只有 `AGENTS.md` managed-core merge 的初步安全合併。
- 修改 merged files 前的 backup 已有初步實作。
- Unsafe bridge files 的 conflict reporting 已有初步實作。
- 非空既有專案 upgrade trial 已通過；正式發佈前仍須重跑或以等效臨時專案重驗。
- GitHub Release、tag、npm publish 與 installer hardening 均尚未執行。
