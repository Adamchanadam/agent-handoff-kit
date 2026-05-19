# 發佈級驗收計劃

狀態：原始碼倉庫驗收計劃。本文件不屬於 npm package，也不會安裝到使用者專案。

## 用途

本文件定義 Agent Handoff Kit 發佈前與發佈後必須通過的檢查。可安裝套件必須保持輕量；驗收文件與原始碼倉庫專用腳本除非未來明確改變 `package.json` `files` 白名單，否則不得進入 npm package。

## 驗收分層

| 層級 | 指令 | 範圍 | 發佈前是否必須通過 |
|---|---|---|---|
| 原型驗收 | `npm run qa:prototype` | 範本安裝、`doctor`、套件預演、過時字串與污染標記。 | 是 |
| 規則包場景驗收 | `npm run qa:packs` | coding、research、writing、knowledge、release、safety、governance、communication 與 mixed-scenario 規則包路由。 | 是 |
| 升級安全驗收 | `npm run qa:upgrade` | 既有專案升級、備份、合併與衝突行為。 | 是 |
| 發佈前驗收 | `npm run qa:release` | 發佈前關卡、版本、套件內容、文件一致性、較完整的 `doctor` schema 檢查，以及 tag / release / npm 準備度。 | 是 |
| 用戶流程驗收 | 已併入 `npm run qa:release` | 安裝、`doctor`、模擬收工、抽取開工訊息、接力後 `doctor`，並確認不預設建立 archive。 | 是 |
| 任務入口事實驗收 | 已併入 `doctor` 與 `npm run qa:release` | 檢查 `PROJECT_INDEX` 具備 Fact Base / External Sources / Local QC Commands，`SESSION_HANDOFF` 具備 Next Task Required Reading，並保留「可達不等於已讀入」口徑。 | 是 |
| 交接狀態對賬驗收 | 已併入 `doctor` 與 `npm run qa:release` | 檢查 `SESSION_HANDOFF` 分清 Durable Anchors 與 Closeout-Reconciled State，具備 Task Understanding Summary 與 State Reconciliation Check，並用負面測試確認 stale snapshot 不能當作已對賬。 | 是 |
| 交接語言本地化驗收 | 已併入 `doctor` 與 `npm run qa:release` | 檢查 `SESSION_HANDOFF` 保留 `ack:section:*` 與 `ack:field:*` 語義標記時，標題與可見欄位名稱可翻成中文或其他語言。 | 是 |
| 安裝後指示驗收 | 已併入 `npm run qa:prototype` 與 `npm run qa:release` | 檢查安裝成功後的 Terminal 輸出不會令用戶誤把提示文字當成命令，並確認 README 說明安裝後第一步。 | 是 |

## 規則包場景覆蓋

| 場景 | 預期 pack 行為 |
|---|---|
| Coding | 載入 `coding`；只有出現檔案、Git、API、install、deploy、release、credential 或 permission 風險時才加 `safety`。 |
| Research | 載入 `research`；要求來源、日期，以及證據與推論分開。 |
| Writing | 涉及受眾、語氣或交付格式時載入 `writing` / `communication`。 |
| Knowledge | 涉及 source-of-truth 或 sync work 時載入 `knowledge`；外部寫入、權限或破壞性操作才加 `safety`。 |
| Required reading | 非簡單任務先從 handoff、project index、使用者要求與 sync registry 找出必讀本機真源與外部來源；未讀來源只能標記 pending / blocked，不得當成沒有資料。 |
| Release | 載入 `release` 與 `safety`；沒有明確批准不得 tag、建立 GitHub Release、npm publish 或 close release。 |
| Safety | 刪除、覆寫、移動、reset、Git history、package manager、API、deploy、release、credential、permission error 都要升級到 `safety`。 |
| Mixed scenario | 先拆階段，每階段載入最少必要 packs，不一次載入全部 packs。 |

## 治理 QA 缺口矩陣

本矩陣用來檢查治理環境是否只增加文字而沒有驗收。能機器檢查的項目應進入 `doctor` 或 QA 腳本；不能機器檢查的語意判斷，應列入發佈前人工審閱。

| 維度 | 發佈前檢查方式 |
|---|---|
| 重複 | 檢查同一口徑是否已有單一真源；避免 README、runtime、QA 文件各自變成權威。 |
| 矛盾 | 用 `qa:release` 文件錨點與人工終讀確認 README、runtime、CHANGELOG、發佈級 QA 說法一致。 |
| 膨脹與負載 | 確認 npm package 邊界不擴大，且新增 QA 文件不進使用者安裝 runtime。 |
| 認知影響 | 檢查安裝後提示與 README 是否讓用戶分清 Terminal 檢查與 AI 對話下一步。 |
| 事實漂移 | 用 handoff 對賬欄位、stale snapshot 負面測試與必讀來源欄位降低風險。 |
| 執行落差 | 檢查規則是否有 `doctor`、QA 腳本、負面測試或人工審閱承接；不得只增加提醒文字。 |

## 套件邊界

npm package 由 `package.json` 的 `files` 控制：

```json
[
  "bin/",
  "runtime-core/",
  "packs/",
  "README.md",
  "LICENSE"
]
```

`docs/qa/`、原始碼設計文件與 `scripts/` 是原始碼倉庫資產。除非未來發佈明確改變套件邊界，否則不應出現在 `npm pack --dry-run` 輸出中。

## 目前基線

- `npm run qa:prototype` 已存在並通過。
- `npm run qa:packs` 已存在並通過，會檢查靜態規則包路由、安全升級與 mixed-scenario 分階段載入。
- `npm run qa:upgrade` 已存在並通過，會檢查初步 safe `AGENTS.md` merge、backup creation、conflict reporting 與 upgrade 後 `doctor`。
- `npm run qa:release` 已存在並通過，會串起三條既有驗收、驗證套件邊界、文件錨點、較完整的 `doctor` schema 輸出，並執行從安裝到收工再到接力開工的多步驟用戶流程模擬。
- `doctor` 已檢查任務入口事實欄位：Fact Base、External Sources、Local QC Commands 與 Next Task Required Reading。
- `doctor` 已檢查 handoff 對賬欄位：Durable Anchors、Closeout-Reconciled State、Task Understanding Summary 與 State Reconciliation Check。
- `doctor` 已改以 handoff 語義標記為主要 schema 依據，英文段名只作預設模板與舊版本兼容。
- 安裝後指示已改為清楚分隔的中文下一步區塊，明確說明後續文字應貼到 AI 對話，不是在 Terminal 繼續輸入。
- 套件預演目前維持 20 個 package files。
- 完整 section-aware merge 仍待補；非空既有專案 upgrade trial 已通過，正式發佈前仍須重跑或以等效臨時專案重驗。

## 發佈前人工審閱清單

本清單用來判斷是否可以進入候選發佈。勾完本清單仍不等於可以發佈；tag、GitHub Release、npm publish 或 release closeout 必須由使用者另行明確批准。

| 審閱面向 | 目前證據 | 候選發佈前判斷 |
|---|---|---|
| 發佈授權 | 使用者已批准準備下一個候選版，但未批准建立 tag、GitHub Release 或 npm publish。 | 阻擋正式發佈；可做候選準備 |
| 版本口徑 | 下一候選版本採 `0.1.1`，與 `package.json` 目前版本一致。 | 候選通過；正式發佈前須再確認 |
| 公開名稱 | GitHub repo 為 `Adamchanadam/agent-handoff-kit`；npm package 為 `@adamchanadam/agent-handoff-kit`；CLI command 仍為 `agent-handoff-kit`。 | 已準備，publish 前須即時重驗 npm 名稱 |
| 套件邊界 | `package.json` `files` 僅包含 `bin/`、`runtime-core/`、`packs/`、`README.md`、`LICENSE`。 | 通過，但發佈前須重跑套件預演 |
| 原始碼驗收 | `qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release` 已建立並通過。 | 通過，但發佈前須重跑 |
| 非空既有專案升級 | 候選發佈準備重驗已通過：臨時非空專案保留既有 README、docs、src、notes、package 與本地規則；`AGENTS.md` 建立 backup 並合併 managed core；`doctor` 通過。 | 通過，發佈前如有 installer 改動須再重跑 |
| 完整 merge 能力 | 目前只有 `AGENTS.md` managed-core merge；完整 section-aware merge 尚未完成。 | 阻擋正式穩定版；可作 prototype / candidate 風險項 |
| 公開文件一致性 | README、CHANGELOG、發佈級 QA、package metadata 與 CLI help 已對齊 `0.1.1` 候選口徑；README 明示 npm 已發佈版本仍為 `0.1.0`。 | 已準備，發佈前需人工終讀 |
| 交接可靠性 | R-009、R-010、R-011 已納入 `doctor` / `qa:release`，包含必讀事實、狀態對賬與本地化 handoff 標題。 | 通過，但需人工確認語意無誤 |
| 安裝後可理解性 | R-013 已修補 Terminal 成功提示與 README，用戶可分清 Terminal 檢查與 AI 對話下一步。 | 通過，但發佈前需人工終讀 |
| 安全邊界 | safety pack、release pack 與核心安全底線均禁止未批准的 destructive / release / publish 行為。 | 通過，但需人工確認無放寬措辭 |
| 污染掃描 | `qa:prototype` 掃描 WORK 路徑、private repo 名稱、舊 opening marker、常見 secret pattern。 | 通過，但發佈前須重跑 |
| GitHub / npm 發佈材料 | `CHANGELOG.md` 已新增 `v0.1.1` 候選版變更說明，並保留 `v0.1.0` 已發佈紀錄。 | 候選通過；正式發佈前須轉為 release notes |
| 用戶安裝路徑 | README 保留正式 `npx` 安裝路徑，同時明示目前 npm 已發佈版本仍是 `v0.1.0`。 | 通過 |

## v0.1.1 候選狀態

- 候選版本：`0.1.1`。
- release notes 候選來源：`CHANGELOG.md` 的 `v0.1.1` 段落。
- 候選內容：安裝後新手指示、README 用戶向重整、治理 QA 缺口矩陣、舊誤導提示負面檢查。
- 發佈邊界：未建立 tag、未建立 GitHub Release、未 npm publish；正式發佈前仍須使用者另行明確批准。
- 發佈前仍需驗證：完整四條 QA、人工終讀、版本號確認、npm package metadata、`npx` 實際安裝與 `doctor`。

## v0.1.0 已發佈狀態

- 發佈版本：`0.1.0`。
- release notes：`CHANGELOG.md` 的 `v0.1.0` 段落。
- public package / CLI：`@adamchanadam/agent-handoff-kit` package，`agent-handoff-kit` CLI。
- 非空既有專案升級重驗：已通過，臨時根目錄為 `C:\tmp\ack_release_candidate_upgrade_trial_20260517_171753`。
- 最近發佈前驗收：`npm run qa:prototype`、`npm run qa:packs`、`npm run qa:upgrade`、`npm run qa:release` 已在新名稱下通過；公開文件補齊後 `npm run qa:release` 已再次通過。
- 發佈後仍需驗證：GitHub Release、npm package metadata、`npx @adamchanadam/agent-handoff-kit --help`、`npx @adamchanadam/agent-handoff-kit doctor` 的實際可用性。

## 發佈阻擋項

未來任何新版本仍必須先通過本文件列出的發佈前驗收；不得因 `v0.1.0` 已發佈而宣稱 Agent Handoff Kit 已需求完整。
