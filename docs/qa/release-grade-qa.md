# 發佈級驗收計劃

狀態：原始碼倉庫驗收計劃。本文件不屬於 npm package，也不會安裝到使用者專案。

## 用途

本文件定義 Agent Handoff Kit 發佈前與發佈後必須通過的檢查。可安裝套件必須保持輕量；驗收文件與原始碼倉庫專用腳本除非未來明確改變 `package.json` `files` 白名單，否則不得進入 npm package。

## 驗收分層

| 層級 | 指令 | 範圍 | 發佈前是否必須通過 |
|---|---|---|---|
| 原型驗收 | `npm run qa:prototype` | 範本安裝、`doctor`、CLI 版本自檢 mock、套件預演、過時字串與污染標記。 | 是 |
| 規則包場景驗收 | `npm run qa:packs` | coding、research、writing、knowledge、release、safety、governance、communication 與 mixed-scenario 規則包路由。 | 是 |
| 升級安全驗收 | `npm run qa:upgrade` | 既有專案升級、備份、合併與衝突行為。 | 是 |
| 發佈前驗收 | `npm run qa:release` | 發佈前關卡、版本、套件內容、文件一致性、較完整的 `doctor` schema 檢查，以及 tag / release / npm 準備度。 | 是 |
| 用戶流程驗收 | 已併入 `npm run qa:release` | 安裝、`doctor`、模擬收工、抽取開工訊息、接力後 `doctor`，並確認不預設建立 archive。 | 是 |
| 任務入口事實驗收 | 已併入 `doctor` 與 `npm run qa:release` | 檢查 `PROJECT_INDEX` 具備 Fact Base / External Sources / Local QC Commands，`SESSION_HANDOFF` 具備 Next Task Required Reading，並保留「可達不等於已讀入」口徑。 | 是 |
| 交接狀態對賬驗收 | 已併入 `doctor` 與 `npm run qa:release` | 檢查 `SESSION_HANDOFF` 分清 Durable Anchors 與 Closeout-Reconciled State，具備 Task Understanding Summary 與 State Reconciliation Check，並用負面測試確認 stale snapshot 不能當作已對賬。 | 是 |
| 交接語言本地化驗收 | 已併入 `doctor` 與 `npm run qa:release` | 檢查 `SESSION_HANDOFF` 保留 `ack:section:*` 與 `ack:field:*` 語義標記時，標題與可見欄位名稱可翻成中文或其他語言。 | 是 |
| 安裝後指示驗收 | 已併入 `npm run qa:prototype` 與 `npm run qa:release` | 檢查安裝成功後的 Terminal 輸出不會令用戶誤把提示文字當成命令，並確認 README 說明安裝後第一步。 | 是 |
| 技能／子代理流程仲裁驗收 | 已併入 `npm run qa:packs` 與 `npm run qa:release` | 檢查外部技能、子代理、demo workspace 或其他工具的 closeout 不可取代目前根目錄自己的 Agent Handoff Kit 持久化。 | 是 |
| 舊核心升級結構驗收 | 已併入 `npm run qa:upgrade` 與 `npm run qa:release` | 檢查舊版未標記 `AGENTS.md` core 升級後不會留下雙核心、雙收尾合約或 stale 上半段，且保留 core 前後的使用者本地規則。 | 是 |
| PROJECT_DECISIONS 結構驗收 | 已併入 `doctor` 與 `npm run qa:release` | 檢查 `dev/PROJECT_DECISIONS.md` 含 4 個 H2 section heading（Evolution Timeline / Decisions Archive / Architecture Choices / Insights & Learnings）並保持順序；檔頭含 onboarding 句式（「warm 資料層」、「AI 開工不需要讀」、「AI 在收工時自動 update」）。 | 是 |
| Release Artifact Vocabulary Sweep | 已併入 `npm run qa:release` | 對 `bin/agent-handoff-kit.mjs` + `README.md` + `agent-handoff-kit-intro.html` + `agent-handoff-kit-guide.html` 跑禁忌字眼 grep（「人話解讀」「人話補一句」「人話解釋」）；對 `CHANGELOG.md` 限 latest version section (anchor-bounded by `## v` heading) 跑相同 grep；命中數必為 0。 | 是 |
| Onboarding HTML 書面語紀律 | 已併入 `npm run qa:release` | 對 `agent-handoff-kit-intro.html` 與 `agent-handoff-kit-guide.html` 跑廣東口語字符 grep（「嘅 / 咁 / 喺 / 揀 / 唔 / 乜 / 啱 / 嚟 / 咗 / 嗰」）；命中數必為 0（onboarding HTML 必為繁體中文書面語）。 | 是 |
| Onboarding Pack 結構驗收 (R-029) | 已併入 `doctor` 與 `npm run qa:release` 與 `npm run qa:packs` | 檢查 `dev/rules/onboarding.md` 含 H2 sections（Scope / Load When / Discipline / Application Scenario Library / Cross-reference to guide.html / Tone Discipline / Closeout）並保持順序；含 5 個 Scenario H3 heading（A 寫 / 改代碼項目 / B 整理研究資料 / C 整理電腦檔案 / D 學寫代碼 / E 其他）；含 transient pack + 5-step walk-through pattern wording；含 Tone Discipline 5 條（書面語 / 講人話 / 敍事+解釋 / 不過度解釋 internals / 鼓勵性而非考試）。 | 是 |
| Cross-surface wording consistency 驗收 (R-029.1, v0.2.1+) | 已併入 `npm run qa:release` 與 `npm run qa:prototype` 與 `npm run qa:upgrade` | 對 4 個 user-facing surface（`bin/agent-handoff-kit.mjs` printInstallNextSteps + `README.md` first-screen R-029 callout 同三步上手 step 2 + `agent-handoff-kit-intro.html` #howto Step 2 + #recap cell 1 + `agent-handoff-kit-guide.html` hero R-029 callout）grep canonical R-029 trigger phrase「I just installed agent-handoff-kit. Help me get started.」一致；每個 surface count ≥ 1；post-install CLI output 必含此 phrase；qa:upgrade chain test final hop 嘅 `dev/RULE_PACKS.md` 必含「First-time user signals」+「dev/rules/onboarding.md」routing row。 | 是 |

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
| 技能流程覆蓋 | 用核心規則、治理規則包與 QA 錨點確認外部技能流程只能作 subordinate evidence，不能讓 active root 跳過 handoff/log/index/registry 持久化。 |
| 舊核心殘留 | 用升級負面測試確認舊版 `AGENTS.md` core 被替換而不是附加；`doctor` 必須擋下同一檔案內兩個 core runtime 標題。 |
| 升級路徑覆蓋 | `qa:upgrade` 必須含跨版本鏈式升級驗收（`v0.1.4` → `v0.1.5` → `v0.1.6` → 當前 HEAD），每跳用對應版本嘅 CLI 跑 `init`／`upgrade`／`doctor`，最後一跳用當前 HEAD 跑並 self-check 通過。 |
| 補丁前置狀態枚舉 | 每個 `R-XXX` 補丁必須明文列覆蓋與唔覆蓋嘅前置狀態枚舉，唔填唔放行。例：R-024 覆蓋「夾心 managed + stale」「legacy single core」「無 core」三態，唔覆蓋「managed marker 不成對」（屬 conflict，由人工處理）。 |
| CLI Output Contract 一致性 | 每次 release 前 sweep `bin/agent-handoff-kit.mjs`：（a）`init`／`upgrade`／`doctor` 完成輸出必含版本（v0.X.Y）、模式（mode）、剛做咗乜（counts）、下一步四項；（b）禁忌用語清單命中 = 0（含「人話解讀」等自貶字眼）；（c）內部 action 名（create／merge／skip／conflict／status）保留唔變。 |
| SESSION_LOG handoff-role discipline（R-010）| 每次 release 前 grep `bin/agent-handoff-kit.mjs` 含 `assessSessionLogDiscipline` 函數 + doctor 集成；grep `runtime-core/AGENTS.core.md` closeout step list 含「Advance the SESSION_LOG N-rule」+「R-010 SESSION_LOG handoff-role discipline」；grep `runtime-core/SESSION_LOG.md` template 含「Handoff role」blockquote。Fresh install + doctor 跑出「SESSION_LOG discipline (R-010): ok」（warn-only：N=11+ warn，doctor exit 不變 0）。 |
| Plan scope coverage matrix | 每次 release 嘅 plan 必明文列出三層 artifact families 嘅對齊範圍：（a）**Content layer** — `README.md` 版本字串 + `已正式發佈` 句、`CHANGELOG.md` prepend 新版本段、`package.json` version bump、`docs/qa/release-grade-qa.md` prepend 新版本「發佈狀態」段、對外 onboarding HTML（intro / guide）版本字串 + 任何因 release notes 觸發嘅描述更新；（b）**Script layer** — `scripts/check-release-readiness.mjs` 嘅 release baseline assertion + tarball name + README/CHANGELOG/release-grade-qa.md required string、`scripts/check-public-prototype.mjs` 嘅 tarball name + update notice mock newer version；（c）**Source layer** — `runtime-core/*.md` 嘅模板更新、`bin/agent-handoff-kit.mjs` 嘅功能改動、`packs/*.md` 嘅工作模式紀律。Plan 漏列任何 family 即視為 plan design gap，需 root-fix 或補 plan amend 後再 release。本維度由 v0.1.8 R-005 治理健康檢查（`outputs/governance-health-check-20260522.md`）落地：v0.1.7 → v0.1.8 plan 初版漏咗 script layer，qa:release fail 揭發後加 root-fix（dynamic baseline refactor），令 script layer 之後自動同 package.json 對齊；future release plan 仍必明文列三層 families 做覆蓋自驗。 |
| Project Decisions discipline（R-028） | 每次 release 前須驗證：（a）`runtime-core/PROJECT_DECISIONS.md` template 含 4 個 H2 section heading 順序正確 + 檔頭 onboarding 句式；（b）`runtime-core/AGENTS.core.md` closeout step 12 wording 命中（含「Maintain `dev/PROJECT_DECISIONS.md`」、「R-028 project narrative discipline」、4 個 H2 section name）；（c）`bin/agent-handoff-kit.mjs` mappings 含 `runtime-core/PROJECT_DECISIONS.md` → `dev/PROJECT_DECISIONS.md`；（d）`bin/agent-handoff-kit.mjs` requiredAnchors + schemaChecks 含 `dev/PROJECT_DECISIONS.md` rule + group；（e）Fresh install 後 `dev/PROJECT_DECISIONS.md` 存在且 doctor 「project decisions log structure」schema check pass；（f）Upgrade 既有專案後 `dev/PROJECT_DECISIONS.md` 自動建立（若不存在）或保留（若用戶已有 content）。`npm run qa:release` 自動驗 (a)-(e)；(f) 由 `npm run qa:upgrade` mergeRoot scenario 嘅 existsSync assertion 驗。 |
| 書面語紀律（HTML 輸出） | 對外 onboarding HTML（`agent-handoff-kit-intro.html` + `agent-handoff-kit-guide.html`）必為繁體中文書面語，廣東口語字符（「嘅 / 咁 / 喺 / 揀 / 唔 / 乜 / 啱 / 嚟 / 咗 / 嗰」）grep 命中數必為 0。Release 前 `npm run qa:release` 自動驗。違反即視為 release artifact 質量落差，需逐句修正後再 release。 |
| Onboarding UX discipline（R-029） | 每次 release 前須驗證：（a）`packs/onboarding.md` template 含 7 個 H2 section（Scope / Load When / Discipline / Application Scenario Library / Cross-reference to guide.html / Tone Discipline / Closeout）+ 5 個 Scenario H3 + Anti-pattern table；（b）`runtime-core/AGENTS.core.md` `## 1. Startup Reads` 含 first-time-user signal detection wording + onboarding pack proactive load 紀律；（c）`runtime-core/RULE_PACKS.md` 含 onboarding signal routing row；（d）`bin/agent-handoff-kit.mjs` mappings 含 `packs/onboarding.md` → `dev/rules/onboarding.md`；（e）`bin/agent-handoff-kit.mjs` requiredAnchors + schemaChecks 含 onboarding pack rule + group；（f）Fresh install 後 `dev/rules/onboarding.md` 存在且 doctor schema check pass；（g）`npm run qa:packs` 嘅 onboarding routing scenario + first-time onboarding to first task mixed scenario 通過。`npm run qa:release` 自動驗 (a)-(f)；(g) 由 `qa:packs` 驗。 |
| Cross-surface wording alignment（R-029.1，v0.2.1 新加 dim） | v0.2.0 release ceremony 嘅 critical QC gap：plan scope coverage matrix 嘅三層（content / script / source）唔 cover cross-surface wording alignment。R-029 嘅 onboarding trigger phrase 跨 5 個 surface（CLI source + README + intro.html + guide.html + onboarding pack 自身），但 v0.2.0 release 時 CLI source 仍係 legacy wording 而其他 surface 已 update —— silent disconnect。v0.2.1 起加新 dim（第四 layer）：每次涉及 user-facing prompt / wording / canonical trigger phrase 嘅 release plan 必明文驗證跨 surface 一致。`scripts/check-release-readiness.mjs` 嘅 `checkCrossSurfaceWordingConsistency()` helper 自動 enforce canonical R-029 trigger phrase 喺 4 個 surface（bin + README + intro + guide）一致。違反即 throw error，release 阻擋。 |
| Routing table propagation discipline（R-029.2，v0.2.1 新加 dim） | v0.2.0 既有 upgrade 紀律對 `dev/RULE_PACKS.md` 沿用 default `skip "preserve existing file"`，導致 v0.1.X 用戶 upgrade 後 routing table 仍係舊版（silent missing R-029 onboarding routing row）。Architectural reclassification：`dev/RULE_PACKS.md` 由 user customization target 重新歸類為 **maintainer-owned routing table**（同 AGENTS.md managed core block 同類紀律）。v0.2.1 起 `bin/agent-handoff-kit.mjs` `classifyExistingFile` 加 force-update merge logic：當 stale state detected (targetText 唔含 v0.2.0+ 嘅 routing rows)，trigger `action: "merge"` 用 latest source 覆寫。`scripts/check-upgrade-safety.mjs` chain test final hop 加 RULE_PACKS.md routing row 強制 assertion。Doctor schema check 加 strict anchor enforce routing table 一致性。 |

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
- `npm run qa:upgrade` 已補舊 Kit core 回歸守門：v0.1.3-style 與 v0.1.4-style 未標記 core 升級後，只能保留一個 `# Agent Handoff Kit Core Runtime`，並保留 core 前後的本地規則。
- `npm run qa:release` 已存在並通過，會串起三條既有驗收、驗證套件邊界、文件錨點、較完整的 `doctor` schema 輸出，並執行從安裝到收工再到接力開工的多步驟用戶流程模擬。
- `doctor` 已檢查任務入口事實欄位：Fact Base、External Sources、Local QC Commands 與 Next Task Required Reading。
- `doctor` 已檢查 handoff 對賬欄位：Durable Anchors、Closeout-Reconciled State、Task Understanding Summary 與 State Reconciliation Check。
- `doctor` 已改以 handoff 語義標記為主要 schema 依據，英文段名只作預設模板與舊版本兼容。
- `doctor` 已檢查 `START_NEXT_SESSION_PROMPT.txt` 與 `dev/SESSION_HANDOFF.md` 的 fenced opening message 是否一致。
- 安裝後指示已改為清楚分隔的中文下一步區塊，明確說明後續文字應貼到 AI 對話，不是在 Terminal 繼續輸入。
- 套件預演目前維持 21 個 package files；新增的 runtime 檔案是 `START_NEXT_SESSION_PROMPT.txt`。
- 完整 section-aware merge 仍待補；非空既有專案 upgrade trial 已通過，正式發佈前仍須重跑或以等效臨時專案重驗。

## 發佈前人工審閱清單

本清單用來判斷是否可以進入候選發佈。勾完本清單仍不等於可以發佈；tag、GitHub Release、npm publish 或 release closeout 必須由使用者另行明確批准。

| 審閱面向 | 目前證據 | 候選發佈前判斷 |
|---|---|---|
| 發佈授權 | 使用者已明確批准 tag、GitHub Release、push 與 npm publish，並要求 GitHub 與 npm 同版本。 | 通過 |
| 版本口徑 | 發佈版本採 `0.1.6`，GitHub 與 npm 同版本。 | 通過 |
| 公開名稱 | GitHub repo 為 `Adamchanadam/agent-handoff-kit`；npm package 為 `@adamchanadam/agent-handoff-kit`；CLI command 仍為 `agent-handoff-kit`。 | 已準備，publish 前須即時重驗 npm 名稱 |
| 套件邊界 | `package.json` `files` 僅包含 `bin/`、`runtime-core/`、`packs/`、`README.md`、`LICENSE`。 | 通過，但發佈前須重跑套件預演 |
| 原始碼驗收 | `qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release` 已建立並通過。 | 通過，但發佈前須重跑 |
| 非空既有專案升級 | 候選發佈準備重驗已通過：臨時非空專案保留既有 README、docs、src、notes、package 與本地規則；`AGENTS.md` 建立 backup 並合併 managed core；`doctor` 通過。 | 通過，發佈前如有 installer 改動須再重跑 |
| 完整 merge 能力 | 目前只有 `AGENTS.md` managed-core merge；完整 section-aware merge 尚未完成。 | 阻擋正式穩定版；可作 prototype / candidate 風險項 |
| 公開文件一致性 | README、CHANGELOG、發佈級 QA、package metadata 與 CLI help 已對齊 `v0.1.6` GitHub 與 npm 正式發佈口徑。 | 通過 |
| 交接可靠性 | R-009、R-010、R-011 已納入 `doctor` / `qa:release`，包含必讀事實、狀態對賬與本地化 handoff 標題。 | 通過，但需人工確認語意無誤 |
| 安裝後可理解性 | R-013 已修補 Terminal 成功提示與 README，用戶可分清 Terminal 檢查與 AI 對話下一步。 | 通過，但發佈前需人工終讀 |
| 安全邊界 | safety pack、release pack 與核心安全底線均禁止未批准的 destructive / release / publish 行為。 | 通過，但需人工確認無放寬措辭 |
| 污染掃描 | `qa:prototype` 掃描 WORK 路徑、private repo 名稱、舊 opening marker、常見 secret pattern。 | 通過，但發佈前須重跑 |
| GitHub / npm 發佈材料 | `CHANGELOG.md` 已新增 `v0.1.6` 正式發佈變更說明，並保留 `v0.1.5`、`v0.1.4`、`v0.1.3`、`v0.1.2`、`v0.1.1` 與 `v0.1.0` 已發佈紀錄。 | 通過 |
| 用戶安裝路徑 | README 保留正式 `npx` 安裝路徑，並明示 `v0.1.6` 已發佈。 | 通過 |

## v0.2.2 發佈狀態

- 發佈版本：`0.2.2`。
- release notes：`CHANGELOG.md` 的 `v0.2.2` 段落。
- 發佈內容：Critical patch release 修補 v0.2.0 + v0.2.1 release 落地時嘅 **internal reference ID leak on user-facing surfaces** —— R-XXX explicit IDs / closeout step N internal numbering / strict mechanical discipline jargon 大量混入 README + intro.html + guide.html。R-026 forbidden vocabulary sweep 第三次 design gap：scope 只 cover「人話解讀」自貶 phrase，唔 cover internal governance jargon。**v0.2.2 修補**：(a) 10+ 處 user-facing surface internal references normalize 為人話（R-029 → 新手引導 / R-028 紀律 → AI 自動 maintain 紀律 / closeout step 12 → AI 收工時嘅自動 maintain 條件 / strict mechanical → 硬性自動執行 等）；(b) `scripts/check-release-readiness.mjs` 加 `internalReferenceForbidden` patterns 對 3 個 user-facing surface 強制 grep 0 命中（R-\d{3} / closeout step \d+ / strict mechanical patterns）；(c) CHANGELOG historical entries 自然 reference R-XXX 屬 release 敘事必要，由既有 anchor-bounded grep strategy 排除（internal-reference sweep scope 不 cover CHANGELOG）。Honest reflection：R-026 forbidden vocabulary 設計從一開始應該 separate concerns（自貶 vocab / internal ID / canonical phrase），但既有 ad-hoc 累加 pattern 沿用，future refactor 可重組為 categorical sweeps。
- 發佈前驗收：qa:release 全綠（既有 18 assertion + 3 個新 internal-reference sweep verifications，總 21 個 assertion）+ post-install CLI output 含 canonical R-029 trigger phrase（沿用 v0.2.1 紀律）+ chain test RULE_PACKS routing row 強制 assertion 通過。
- npm 狀態：已 npm publish；npm latest 為 `0.2.2`；package fileCount 23（不變 by R-029.4 design — patch 屬 wording/QC discipline，唔加新 file）。

## v0.2.1 發佈狀態

- 發佈版本：`0.2.1`。
- release notes：`CHANGELOG.md` 的 `v0.2.1` 段落。
- 發佈內容：Critical patch release 修補 v0.2.0 R-029 落地時嘅 cross-surface wording inconsistency + upgrade flow routing table propagation gap + QC 流程粗疏 dimension。**R-029.1**（cross-surface wording fix）：`bin/agent-handoff-kit.mjs` `printInstallNextSteps` + `printHelp` 對齊 canonical R-029 trigger phrase；README + intro.html + guide.html user prompt examples 統一；既有 legacy prompt 保留為 fallback。**R-029.2**（upgrade flow routing table propagation）：`bin/agent-handoff-kit.mjs` `classifyExistingFile` 加 `dev/RULE_PACKS.md` force-update merge logic；schemaChecks 加 strict anchor「First-time user signals」+「dev/rules/onboarding.md」；`scripts/check-upgrade-safety.mjs` chain test final hop 加 RULE_PACKS.md routing row assertion。**R-029.3**（QC process gap fix）：`scripts/check-release-readiness.mjs` 加 `checkCrossSurfaceWordingConsistency()` helper；`scripts/check-public-prototype.mjs` 加 post-install CLI output canonical phrase assertion；docs/qa/release-grade-qa.md 加新 Cross-surface Wording Consistency Sweep section + 治理 QA 缺口矩陣加 2 新 dim（Cross-surface wording alignment + Routing table propagation discipline）+ 補丁前置狀態枚舉加 R-029.1 row；🟡 發佈檢由 6 項擴展為 7 項。Architectural reclassification：`dev/RULE_PACKS.md` 由 user customization target 重新歸類為 maintainer-owned routing table。
- 發佈前驗收：完整四條 QA + R-029.1 cross-surface wording sweep 通過 + chain test final hop RULE_PACKS.md routing row assertion 通過 + R-005 quick re-walk verify 緊張可控 + Cross-surface wording consistency Sweep 全部 grep 命中。
- npm 狀態：已 npm publish；npm latest 為 `0.2.1`；package fileCount 23（不變）。

## v0.2.0 發佈狀態

- 發佈版本：`0.2.0`。
- release notes：`CHANGELOG.md` 的 `v0.2.0` 段落。
- 發佈內容：**R-028 用戶項目治理擴展 + R-029 新手 onboarding AI driven walk-through** 二合一 architectural improvement。R-028 部分：新加 `runtime-core/PROJECT_DECISIONS.md` template（4 H2 section + 檔頭 onboarding tone）+ `runtime-core/AGENTS.core.md` closeout step 12 紀律（AI smart detect heuristic：Decisions split / Evolution / Architecture / Insights）+ R-026 forbidden vocabulary scope 擴展（CLI source + README + onboarding HTML + CHANGELOG anchor-bounded latest section）+ Onboarding HTML 書面語紀律 enforcement。R-029 部分：新加 `packs/onboarding.md` rule pack（含 5 個 Application Scenario A-E × 5-step walk-through pattern + AI sample wording per step + Cross-reference to guide.html + Tone Discipline + Anti-pattern table）+ `runtime-core/AGENTS.core.md` `## 1. Startup Reads` 加 first-time-user signal detection + proactive onboarding load 紀律 + `runtime-core/RULE_PACKS.md` 加 first-time signal routing row + 配套 `bin/agent-handoff-kit.mjs` mappings / requiredAnchors / schemaChecks 擴展。Scripts 同步：4 個 scripts 全部 update (total files 21 → 22 → 23；assertions 加 PROJECT_DECISIONS + onboarding；book-language sweep + R-026 forbidden vocabulary sweep + onboarding pack mixed scenario)。對外 onboarding：intro 加 `#tiers` section「分檔有層次」（Hot / Warm / Cold 三格）+ guide 加 Case C「長期項目演進」4-phase narrative + README 加「項目決策日誌」段 + README first-screen「不需要先讀」messaging + intro/guide 加「不需要先讀」cross-reference。Major version bump（v0.1.8 → v0.2.0）反映 R-028 + R-029 屬 substantive architectural change。npm package files 由 21 → 23（含 `runtime-core/PROJECT_DECISIONS.md` + `packs/onboarding.md`）。
- 發佈前驗收：完整四條 QA + 動態 baseline real first-test 通過（version 0.1.8 → 0.2.0 腳本零改動仍 PASS）+ Plan scope coverage matrix release-context first-test 通過 + R-005 治理健康檢查 walk-through verdict ∈ {健康, 緊張 / 合併方向} + Release Artifact Vocabulary Sweep 全部 grep 命中 + Project Decisions Discipline Sweep 全部 grep 命中 + **Onboarding Pack Discipline Sweep 全部 grep 命中** + 書面語紀律 grep 0 命中 + CLI Output Contract sweep 既有 grep 仍命中 + `qa:packs` 嘅 onboarding routing scenario + first-time onboarding to first task mixed scenario 通過。
- npm 狀態：已 npm publish；npm latest 為 `0.2.0`；package fileCount 23。

## v0.1.8 發佈狀態

- 發佈版本：`0.1.8`。
- release notes：`CHANGELOG.md` 的 `v0.1.8` 段落。
- 發佈內容：R-010 SESSION_LOG 接力角色紀律 propagation 入 npm package — `runtime-core/AGENTS.core.md` closeout step 11（N 規則 mandatory advancement + AI proactive enforce）+ `runtime-core/SESSION_LOG.md` head blockquote + `bin/agent-handoff-kit.mjs` `assessSessionLogDiscipline()` doctor warn-only safety net（H2 entry ≥ 11 / ≥ 25 / 主檔 line ≥ 1500 全部 warn，exit 不變 0）+ `scripts/check-release-readiness.mjs` 加 grep + doctor stdout assertions + 本文件加 SESSION_LOG handoff-role discipline sweep section + 治理 QA 缺口矩陣 +1 維度。對外 onboarding（`agent-handoff-kit-intro.html` / `agent-handoff-kit-guide.html` / `README.md`）同步 v0.1.8 + R-010 紀律描述（指南頁 Case A Step 06「Kit 內置邏輯」box 加第 5 條治理段；README `dev/SESSION_LOG.md` row description 補 archive 機制）。release-gate 腳本根因治理：`scripts/check-release-readiness.mjs` + `scripts/check-public-prototype.mjs` 嘅 current release baseline / tarball name / README assertion / CHANGELOG latest segment / release-grade-qa.md latest pointer / mock newer version 全部 refactor 至動態讀 `package.json` 嘅 version，免下次 release 漏對齊。
- 發佈前驗收：完整四條 QA（含新 `SESSION_LOG discipline (R-010): ok` assertion 與動態 baseline）+ 版本號對齊（`README.md` + `package.json` + `CHANGELOG.md` + onboarding HTML + 本文件 latest pointer）+ package boundary（21 files 未變）+ GitHub Release 材料 + npm package metadata + CLI Output Contract sweep。
- npm 狀態：已 npm publish；npm latest 為 `0.1.8`。

## v0.1.7 發佈狀態

- 發佈版本：`0.1.7`。
- release notes：`CHANGELOG.md` 的 `v0.1.7` 段落。
- 發佈內容：R-024 夾心 dup core 修補（`assessAgentsMdHealth()` 函數合三為一）+ `upgrade` self-check；R-025 真實 fixture（`test-fixtures/v0.1.4`/`v0.1.5`/`v0.1.6` + `scripts/generate-upgrade-fixtures.mjs`）+ 跨版本鏈式升級驗收 + 補丁前置狀態枚舉；R-026 CLI Output Contract 取代 R-013／R-017／R-021；`runtime-core/AGENTS.core.md` 加 `## 2.1 Upgrade Done Contract` 段。
- 發佈前驗收：完整四條 QA + `qa:fixtures`、版本號確認、package boundary（21 files 未變）、GitHub Release 材料、npm package metadata、CLI Output Contract sweep（「人話解讀」字眼 0 命中 + 版本／模式／剛做咗乜／下一步四項契約滿足）。
- npm 狀態：已 npm publish；npm latest 為 `0.1.7`。

## v0.1.6 發佈狀態

- 發佈版本：`0.1.6`。
- release notes：`CHANGELOG.md` 的 `v0.1.6` 段落。
- 發佈內容：修正舊版未標記 `AGENTS.md` core 升級時 append 成雙核心的問題；升級會替換 stale Kit core 並保留 core 前後本地規則；`doctor` 與 `qa:upgrade` 已補雙核心負面檢查。
- 發佈前驗收：完整四條 QA、版本號確認、package boundary、GitHub Release 材料、npm package metadata。
- npm 狀態：已 npm publish；npm latest 為 `0.1.6`（v0.1.7 發佈後改為 archived，但 npm registry 仍可 install）。

## v0.1.5 發佈狀態

- 發佈版本：`0.1.5`。
- release notes：`CHANGELOG.md` 的 `v0.1.5` 段落。
- 發佈內容：修正 README 內新手介紹頁連結，改為 GitHub Pages 絕對網址 `https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-intro.html`，讓 GitHub 與 npm README 都能正確導向。
- 發佈前驗收：完整四條 QA、版本號確認、package boundary、GitHub Pages 來源設定、GitHub Release 材料、npm package metadata。
- npm 狀態：已 npm publish；npm latest 為 `0.1.5`。

## v0.1.4 發佈狀態

- 發佈版本：`0.1.4`。
- release notes：`CHANGELOG.md` 的 `v0.1.4` 段落。
- 發佈內容：R-019 下次開工提示副本、R-020 新手介紹頁與 onboarding 對齊、R-021 CLI 回傳訊息新手化、R-022 技能／子代理流程仲裁。
- 發佈前驗收：完整四條 QA、版本號確認、package boundary、GitHub Release 材料、npm package metadata。
- npm 狀態：已 npm publish；npm latest 為 `0.1.4`。

## v0.1.3 發佈狀態

- 發佈版本：`0.1.3`。
- release notes：`CHANGELOG.md` 的 `v0.1.3` 段落。
- 發佈內容：R-016 doctor 版本錨點修復、R-017 emoji / 精簡開工 prompt、R-018 CLI 非阻塞版本自檢。
- 發佈前驗收：完整四條 QA、版本號確認、package boundary、GitHub Release 材料、npm package metadata。
- npm 狀態：已 npm publish；npm latest 為 `0.1.3`。

## v0.1.2 發佈狀態

- 發佈版本：`0.1.2`。
- release notes：`CHANGELOG.md` 的 `v0.1.2` 段落。
- 發佈內容：修正 `v0.1.1` package README 仍顯示候選狀態的文件事實錯誤。
- 發佈前驗收：完整四條 QA、版本號確認、npm package metadata、`npx` 實際安裝與 `doctor`。

## v0.1.1 發佈狀態

- 發佈版本：`0.1.1`。
- release notes：`CHANGELOG.md` 的 `v0.1.1` 段落。
- 發佈內容：安裝後新手指示、README 用戶向重整、治理 QA 缺口矩陣、舊誤導提示負面檢查。
- 已知補救：`v0.1.2` 修正 `v0.1.1` package README 的發佈狀態文字。

## v0.1.0 已發佈狀態

- 發佈版本：`0.1.0`。
- release notes：`CHANGELOG.md` 的 `v0.1.0` 段落。
- public package / CLI：`@adamchanadam/agent-handoff-kit` package，`agent-handoff-kit` CLI。
- 非空既有專案升級重驗：已通過，臨時根目錄為 `C:\tmp\ack_release_candidate_upgrade_trial_20260517_171753`。
- 最近發佈前驗收：`npm run qa:prototype`、`npm run qa:packs`、`npm run qa:upgrade`、`npm run qa:release` 已在新名稱下通過；公開文件補齊後 `npm run qa:release` 已再次通過。
- 發佈後仍需驗證：GitHub Release、npm package metadata、`npx @adamchanadam/agent-handoff-kit --help`、`npx @adamchanadam/agent-handoff-kit doctor` 的實際可用性。

## QA Fixture 真實性紀律（R-025）

升級或回歸 fixture 必須由真實舊版本嘅 `init`／`upgrade` 產物生成；手嗒 template literal 合成只可做 schema 邊界測試。

- 真源生成：`scripts/generate-upgrade-fixtures.mjs` 用 `git worktree add --detach <tmp> <tag>` 喺對應 tag 開臨時 worktree，跑該版本 CLI 嘅 `init`，將產物 copy 入 `test-fixtures/<version>/`。
- Fixture 涵蓋：`AGENTS.md`（core runtime form）+ `dev/PROJECT_INDEX.md`（template version metadata）。新加版本須一齊納入。
- 退役對象：合成嘅 `staleCoreFixture()` 函數限 schema-boundary use（toggle skillArbitration／promptMirror 等模型參數）；production-state preconditions 必用真實 fixture。
- npm package 邊界：`test-fixtures/` 唔喺 `package.json` `files` 白名單內，唔會入 npm package；只屬原始碼倉庫資產。
- 違反例：用 inline string 寫一個冒充「v0.1.X 嘅 AGENTS.md」嚟測 production state，係 R-025 違反，必須改用對應版本 fixture。

## 跨版本鏈式升級驗收（R-025）

`qa:upgrade` 必含 `chainUpgradeScenario`：

1. `v0.1.4` CLI 跑 `init`（生成 v0.1.4 form 嘅 root）+ `v0.1.4` CLI doctor PASS。
2. `v0.1.5` CLI 跑 `upgrade`（用 `git worktree add v0.1.5` 嘅 detached HEAD CLI）+ `v0.1.5` CLI doctor PASS。
3. `v0.1.6` CLI 跑 `upgrade` + `v0.1.6` CLI doctor PASS。
4. 當前 HEAD CLI 跑 `upgrade`（自動跑 R-024 self-check）+ self-check `status: passed`。
5. 最終 `AGENTS.md` 必係 single core + single managed marker pair（即 R-024 嘅 clean state）。

鏈式測試嘅意義：重現用戶長期升級嘅 cumulative drift，並確保當前 CLI 能 reset 任何之前版本累積嘅 sandwich / dup core / anchor 缺漏。中間 hop 失敗（例如 v0.1.5 CLI 嘅 doctor 對 v0.1.4 root 失敗）唔當 chain 通過；要根因到舊版 CLI 嘅實際邊界 bug，唔可以 silent 跳過。

## 補丁前置狀態枚舉（R-025）

每個 `R-XXX` 補丁喺發佈級 QA 必填一條「覆蓋／唔覆蓋嘅前置狀態枚舉」，唔填唔放行。

| R 編號 | 覆蓋嘅前置狀態 | 唔覆蓋嘅前置狀態 |
|---|---|---|
| R-024 | （a）夾心 sandwich：managed marker pair + unmarked stale core；（b）legacy single core：無 managed marker + 單一 title；（c）legacy duplicate cores：無 managed marker + 多 title；（d）無 Kit core：file 存在但完全冇 core；（e）clean：managed marker pair + 無 unmarked dup。 | （f）managed-core markers 不成對／多 pair → 屬 conflict 狀態，CLI 顯示 conflict action，人工介入，唔由 upgrade auto-merge 處理。 |
| R-026 | 全部 `init`／`upgrade`／`doctor` 完成輸出（含 first-install / upgrade-existing / healthy / needs-fix / partial 模式）；`help` 命令完成輸出（version + mode + next）；v0.2.0 起擴 scope 至對外 release artifacts (README + onboarding HTML + CHANGELOG anchor-bounded latest section)。 | 中間進度行（如 `ok: create` 之類）唔強制四項契約；`migration-report.md` 內容契約唔屬 CLI Output Contract 範圍（migration report 有獨立 schema）；CHANGELOG historical sections（latest 段之前）唔受 R-026 scope 限制（historical fact 不可改）；內部 governance docs (SESSION_LOG / HANDOFF / DECISION_LOG) 不受 R-026 scope 限制。 |
| R-028 | （a）first-install fresh project：installer create `dev/PROJECT_DECISIONS.md` 為 4 H2 section template + 檔頭 onboarding tone；（b）upgrade from v0.1.X：用戶 dev/ 缺 PROJECT_DECISIONS.md，upgrade auto-create empty template；（c）upgrade existing PROJECT_DECISIONS.md：用戶手動加過 narrative，upgrade preserve（同 SESSION_HANDOFF.md / SESSION_LOG.md preserve discipline 一致）。 | （d）retro-archive sweep：用戶 explicit trigger AI scan SESSION_LOG 舊條目 reclassify 入 PROJECT_DECISIONS 屬 v0.2.x opt-in feature，唔屬 v0.2.0 critical path；（e）file-level conflict：用戶嘅 `dev/PROJECT_DECISIONS.md` 完全不可讀（permission / encoding）— 屬人工介入範疇，唔由 upgrade auto-merge 處理。 |
| R-029 | （a）First-time user fresh install：用戶安裝後第一句 message 含 onboarding signal keyword 或 vague description，AI 主動 load `dev/rules/onboarding.md` proactively，offer Scenario A-E selection；（b）First-time user 揀 Scenario X：AI 跑 5-step walk-through pattern (Step 1 確認 context / Step 2 解釋 v2 fit / Step 3 ask task scope / Step 4 suggest minimum viable / Step 5 confirm + transition)；（c）Onboarding completion：AI 完成 walk-through 後 unload onboarding pack + load 對應 regular scenario pack；（d）Returning user：用戶已熟悉 v2，無 onboarding signal，AI 直接進入 regular work loop 跳過 onboarding pack。 | （e）用戶 mid-session 觸發 onboarding signal（譬如已 progress 至 Step 4，但突然 say「教我用」）— AI 應 ask user about clarification 是否真係想 restart onboarding，唔自動 reload；（f）Onboarding pack 嘅 internal sample wording 字面 mismatch（譬如 AI adapt wording 過分背離 anchor）— 屬語意 drift，不可機器驗，由人工終讀承擔。 |
| R-029.1 (v0.2.1 critical patch) | （a）Fresh install v0.2.1+：CLI printInstallNextSteps 印出 canonical R-029 trigger phrase（「Work in <root>. I just installed agent-handoff-kit. Help me get started.」）；用戶貼上後 AI 必 trigger onboarding pack；（b）Upgrade v0.1.X → v0.2.1：`dev/RULE_PACKS.md` force-refresh 含 R-029 routing row；doctor schema check enforce「First-time user signals」+「dev/rules/onboarding.md」anchor；（c）Returning user upgrade v0.2.0 → v0.2.1：CLI prompt + routing table 自動同步至 v0.2.1 canonical state；（d）Advanced user 直接描述任務：保留 legacy prompt「Read AGENTS.md and follow it...」作 fallback option（CLI install output 印出 second-tier prompt + intro/guide 嘅 advanced disclaimer）。 | （e）User manually customizes `dev/RULE_PACKS.md` (e.g. adds custom domain pack row)：v0.2.1 force-update 會 lose custom rows —— architectural design decision，RULE_PACKS.md 屬 maintainer-owned routing table；user customization 應入 packs/*.md 自身。（f）CLI 跨 OS / locale 嘅 trigger phrase 字符 encoding：屬 OS-level concern，唔屬 R-029.1 scope。 |

## Release Artifact Vocabulary Sweep（R-026，v0.2.0 起 scope 擴展）

發佈前須 grep 公開倉庫源碼，確認以下命中：

CLI source（內部 action 名 + 完成訊息四項契約）：

```text
grep -n "人話解讀" bin/agent-handoff-kit.mjs       # 期望 0 命中
grep -c "📦 版本" bin/agent-handoff-kit.mjs         # 期望 ≥ 3（init/upgrade/doctor/help 至少四處）
grep -c "🛠️" bin/agent-handoff-kit.mjs              # 期望 ≥ 2（install/help 模式）
grep -c "🩺 模式" bin/agent-handoff-kit.mjs         # 期望 ≥ 1（doctor 模式）
grep -c "🚀 下一步" bin/agent-handoff-kit.mjs       # 期望 ≥ 3（install/doctor/help）
```

對外 release artifacts（v0.2.0 新加 scope）：

```text
grep -n -E "人話解讀|人話補一句|人話解釋" README.md                       # 期望 0 命中
grep -n -E "人話解讀|人話補一句|人話解釋" agent-handoff-kit-intro.html   # 期望 0 命中
grep -n -E "人話解讀|人話補一句|人話解釋" agent-handoff-kit-guide.html   # 期望 0 命中
# CHANGELOG.md 限 latest section (anchor-bounded by ## v heading)，避免 historical entries false positive
# 由 scripts/check-release-readiness.mjs 嘅 checkForbiddenVocabularyInChangelogLatestSection() 執行
```

人工驗證（語氣審閱必填項）：

- 安裝完成訊息：用戶讀完知道版本、做咗乜、下一步點處理。
- 升級完成訊息：用戶讀完知道 self-check 結果，唔會誤以為「skip」即係未完成。
- Doctor 失敗訊息：四種模式（missing files / anchor / schema / prompt mirror）每種都應有對應中文下一步指示。
- Help 訊息：用戶第一次跑 `--help` 應理解三個命令、版本同下一步。
- 禁忌用語清單：「人話解讀」「人話補一句」「人話解釋」等自我評論／粗俗自貶 phrasing 一律禁；由 v0.2.0 起 enforce scope 由 CLI source 擴展至對外 release artifacts (README / onboarding HTML / CHANGELOG latest section)；內部 governance docs (SESSION_LOG / HANDOFF / DECISION_LOG / 內部討論) 不受限。
- 內部 action 名：`create` / `merge` / `skip` / `conflict` / `status` 保留唔變（QA 同 migration report 依賴）。

## Onboarding HTML Book-language Discipline Sweep（v0.2.0 起新加）

對外 onboarding HTML 必為繁體中文書面語，廣東口語字符 grep 命中數必為 0：

```text
grep -n -E "[嘅咁喺揀唔乜啱嚟咗嗰]" agent-handoff-kit-intro.html      # 期望 0 命中
grep -n -E "[嘅咁喺揀唔乜啱嚟咗嗰]" agent-handoff-kit-guide.html      # 期望 0 命中
```

由 `scripts/check-release-readiness.mjs` 嘅 `checkBookLanguage()` helper 自動執行；違反即 throw error，release 阻擋。

範圍紀律：

- Onboarding HTML（intro + guide）為用戶第一個接觸嘅頁面，書面語紀律強制 enforce。
- README.md 屬 maintainer-friendly，允許 mixed style；不受書面語紀律約束。
- WORK 治理檔 + SESSION_LOG / HANDOFF / DECISION_LOG / 內部 audit report 屬 maintainer 對話 surface，不受書面語紀律約束。
- npm package CHANGELOG 屬 release artifact 但 historical sections 不可改；由 R-026 anchor-bounded grep 處理 false positive。

## Project Decisions Discipline Sweep（R-028，v0.2.0 起新加）

發佈前須 grep 公開倉庫源碼，確認以下命中：

```text
grep -c "Project Decisions Log" runtime-core/PROJECT_DECISIONS.md           # 期望 ≥ 1（檔頭）
grep -c "Evolution Timeline" runtime-core/PROJECT_DECISIONS.md              # 期望 ≥ 1（H2 section）
grep -c "Decisions Archive" runtime-core/PROJECT_DECISIONS.md               # 期望 ≥ 1
grep -c "Architecture Choices" runtime-core/PROJECT_DECISIONS.md            # 期望 ≥ 1
grep -c "Insights & Learnings" runtime-core/PROJECT_DECISIONS.md            # 期望 ≥ 1
grep -c "warm 資料層" runtime-core/PROJECT_DECISIONS.md                     # 期望 ≥ 1（檔頭 onboarding tone）

grep -c "Maintain \`dev/PROJECT_DECISIONS.md\`" runtime-core/AGENTS.core.md  # 期望 ≥ 1
grep -c "R-028 project narrative discipline" runtime-core/AGENTS.core.md    # 期望 ≥ 1
grep -c "Evolution Timeline" runtime-core/AGENTS.core.md                    # 期望 ≥ 1（在 closeout step 12 內）
grep -c "Decisions Archive" runtime-core/AGENTS.core.md                     # 期望 ≥ 1
grep -c "Architecture Choices" runtime-core/AGENTS.core.md                  # 期望 ≥ 1
grep -c "Insights & Learnings" runtime-core/AGENTS.core.md                  # 期望 ≥ 1

grep -c "runtime-core/PROJECT_DECISIONS.md" bin/agent-handoff-kit.mjs       # 期望 ≥ 1（mappings entry）
grep -c "dev/PROJECT_DECISIONS.md" bin/agent-handoff-kit.mjs                # 期望 ≥ 1
grep -c "project decisions log structure" bin/agent-handoff-kit.mjs         # 期望 ≥ 1（schemaChecks label）
```

Fresh install 嘅 runtime behavior 驗證：

- `init --yes --root <tmp>` 完成後 `dev/PROJECT_DECISIONS.md` 存在。
- `doctor --root <tmp>` 跑出 `dev/PROJECT_DECISIONS.md (project decisions log structure)` schema check `ok`。
- Doctor 完整 schema checks 包含 PROJECT_DECISIONS group。

Upgrade behavior 驗證（由 `npm run qa:upgrade` mergeRoot scenario 自動驗）：

- 既有專案缺 `dev/PROJECT_DECISIONS.md`：upgrade auto-create empty template。
- 既有專案已有 `dev/PROJECT_DECISIONS.md`（用戶手動加過 narrative）：upgrade preserve user content（同 SESSION_HANDOFF / SESSION_LOG preserve discipline 一致，由 `classifyExistingFile` 嘅 default `skip "preserve existing file"` 路徑承擔）。

人工驗證（語意審閱必填項）：

- 安裝後嘅 `dev/PROJECT_DECISIONS.md` 檔頭 onboarding tone 對新手友善（明文「AI 開工不需要讀」「不需要你手動寫」），不會誤導用戶以為自己要 fill in。
- 4 個 H2 section 順序保持（Evolution → Decisions Archive → Architecture → Insights），不可被 random order。
- Closeout step 12 嘅 4 個 trigger 條件 (a)/(b)/(c)/(d) 紀律 wording 清晰，AI 自律執行有 anchor。

## Onboarding Pack Discipline Sweep（R-029，v0.2.0 起新加）

發佈前須 grep 公開倉庫源碼，確認以下命中：

```text
grep -c "Onboarding Pack" packs/onboarding.md                              # 期望 ≥ 1（H1 title）
grep -c "transient pack" packs/onboarding.md                                # 期望 ≥ 2（Scope + Discipline）
grep -c "5-step walk-through pattern" packs/onboarding.md                   # 期望 ≥ 1
grep -c "Scenario A. 寫 / 改代碼項目" packs/onboarding.md                   # 期望 ≥ 1
grep -c "Scenario B. 整理研究資料" packs/onboarding.md                      # 期望 ≥ 1
grep -c "Scenario C. 整理電腦檔案" packs/onboarding.md                      # 期望 ≥ 1
grep -c "Scenario D. 學寫代碼" packs/onboarding.md                          # 期望 ≥ 1
grep -c "Scenario E. 其他" packs/onboarding.md                              # 期望 ≥ 1
grep -c "Tone Discipline" packs/onboarding.md                               # 期望 ≥ 1
grep -c "Anti-pattern" packs/onboarding.md                                  # 期望 ≥ 1
grep -c "Cross-reference to guide.html" packs/onboarding.md                 # 期望 ≥ 1

grep -c "First-time user signals" runtime-core/RULE_PACKS.md                # 期望 ≥ 1（router row）
grep -c "dev/rules/onboarding.md" runtime-core/RULE_PACKS.md                # 期望 ≥ 1

grep -c "first-time-user signals" runtime-core/AGENTS.core.md               # 期望 ≥ 1（startup detection）
grep -c "onboarding signal keywords" runtime-core/AGENTS.core.md            # 期望 ≥ 1
grep -c "transient pack" runtime-core/AGENTS.core.md                        # 期望 ≥ 1

grep -c "packs/onboarding.md" bin/agent-handoff-kit.mjs                     # 期望 ≥ 1（mappings entry）
grep -c "dev/rules/onboarding.md" bin/agent-handoff-kit.mjs                 # 期望 ≥ 1
grep -c "onboarding pack structure" bin/agent-handoff-kit.mjs               # 期望 ≥ 1（schemaChecks label）
```

Fresh install 嘅 runtime behavior 驗證：

- `init --yes --root <tmp>` 完成後 `dev/rules/onboarding.md` 存在。
- `doctor --root <tmp>` 跑出 `dev/rules/onboarding.md (onboarding pack structure (R-029))` schema check `ok`。
- Doctor 完整 schema checks count 由 8 升至 9。

Pack scenario routing 驗證（由 `npm run qa:packs` mergeRoot scenario 自動驗）：

- `onboarding` routing scenario：router 含「First-time user signals」+ pack 含 5 個 Scenario + transient pack wording。
- `first-time onboarding to first task` mixed scenario：phases `[onboarding] → [onboarding, coding] → [coding]` 順序合法 (轉折 onboarding → coding 並 unload onboarding)。

人工驗證（語意審閱必填項）：

- Onboarding pack 嘅 5 個 Scenario walk-through 每 step 含 AI sample wording，書面語紀律 enforce（紀律目標：用戶讀 AI sample 即明白意義，無需先讀任何文檔）。
- 5 個 Scenario 嘅 step 5 「ask user about confirm + 進入 work loop」明文 transition 至對應 regular pack（A → coding+writing；B → research+writing+knowledge；C → knowledge+safety；D → coding+safety；E → custom）。
- Cross-reference to guide.html 嘅 wording 明確「不需要先讀本指南」，避免用戶誤以為要 mandatory reading。
- Anti-pattern table 列 6 個明確 anti-pattern，每個含 「點解唔做」+「正確做法」對照。

## Cross-surface Wording Consistency Sweep（R-029.1，v0.2.1 起新加）

v0.2.0 release ceremony 嘅 critical QC gap：plan scope coverage matrix 嘅三層（content / script / source）唔 cover cross-surface wording alignment。R-029 嘅 canonical onboarding trigger phrase 跨 4 個 user-facing surface，但 v0.2.0 release 時 CLI source 仍係 legacy wording 而其他 surface 已 update —— silent disconnect 令 R-029 design intent 對 default user behavior 失效。

v0.2.1 起，發佈前須對以下 4 個 surface grep canonical R-029 trigger phrase，每個 surface count ≥ 1：

```text
grep -c "I just installed agent-handoff-kit. Help me get started." bin/agent-handoff-kit.mjs       # 期望 ≥ 1 (CLI printInstallNextSteps)
grep -c "I just installed agent-handoff-kit. Help me get started." README.md                       # 期望 ≥ 1 (first-screen R-029 callout + 三步上手 step 2)
grep -c "I just installed agent-handoff-kit. Help me get started." agent-handoff-kit-intro.html    # 期望 ≥ 1 (#howto Step 2 + #recap cell 1)
grep -c "I just installed agent-handoff-kit. Help me get started." agent-handoff-kit-guide.html    # 期望 ≥ 1 (hero R-029 callout)
```

由 `scripts/check-release-readiness.mjs` 嘅 `checkCrossSurfaceWordingConsistency()` helper 自動 enforce；違反即 throw error，release 阻擋。

額外 verification：

- post-install CLI output 必印出 canonical phrase（由 `scripts/check-public-prototype.mjs` enforce）
- qa:upgrade chain test final hop 嘅 `dev/RULE_PACKS.md` 必含 R-029 routing row（force-refresh 紀律驗證）

紀律邊界：

- Canonical trigger phrase 屬 user-facing surface 嘅 first-time install entry point；其他 surface (e.g. CHANGELOG / DECISION_LOG / SESSION_LOG) 唔 enforce
- Legacy fallback prompt（「Read AGENTS.md and follow it...」）允許 second-tier 出現喺 install output + intro/guide 嘅 advanced user note
- guide.html Case A/B/C user bubbles 保留既有 v0.1.X wording —— 屬 narrative 演示 advanced-user path（用戶已 onboarded 直接描述任務）；hero callout 加 disclaimer 明示 distinction

## SESSION_LOG handoff-role discipline Sweep（R-010）

發佈前須 grep 公開倉庫源碼，確認以下命中：

```text
grep -c "assessSessionLogDiscipline" bin/agent-handoff-kit.mjs       # 期望 ≥ 2（函數定義 + doctor 集成 call）
grep -c "SESSION_LOG discipline (R-010)" bin/agent-handoff-kit.mjs   # 期望 ≥ 1（doctor output line）
grep -c "R-010 SESSION_LOG handoff-role discipline" runtime-core/AGENTS.core.md  # 期望 ≥ 1
grep -c "Advance the SESSION_LOG N-rule" runtime-core/AGENTS.core.md            # 期望 ≥ 1
grep -c "Handoff role" runtime-core/SESSION_LOG.md                              # 期望 ≥ 1（blockquote）
```

Fresh install 嘅 runtime behavior 驗證：

- `init --yes --root <tmp>` 完成。
- `doctor --root <tmp>` 跑出 `SESSION_LOG discipline (R-010): ok` + `status: passed` + exit 0。
- 因 fresh install 嘅 SESSION_LOG.md 只 1 條 template entry，未到 N=11 threshold，所以期望 ok（不 warn）。

Warn behavior 驗證（人工或 fixture-based）：

- Fresh init 後注入 12 條 fake H2 entry (`## 2026-01-01 — test1` 等) 入 SESSION_LOG.md → doctor 跑出 `SESSION_LOG discipline (R-010): warn` + `warn: SESSION_LOG entry count = 12...` + `status: passed`（warn-only，doctor exit 不變 0）。

人工驗證：

- AI Closeout flow 是否自動執行 N 規則推進（由 `runtime-core/AGENTS.core.md` `## Closeout And Handoff` 步驟 11 enforce）。
- Doctor warn 是否唔 block release（exit 0；release-grade QA 唔會因 warn 而 fail）。
- 接力角色定位是否清晰（HANDOFF carries handoff capability；SESSION_LOG carries trace-back only）。

## 發佈阻擋項

未來任何新版本仍必須先通過本文件列出的發佈前驗收；不得因 `v0.1.0` 已發佈而宣稱 Agent Handoff Kit 已需求完整。
