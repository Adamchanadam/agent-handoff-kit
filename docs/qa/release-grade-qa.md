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
| 交接狀態對賬驗收 | 已併入 `doctor` 與 `npm run qa:release` | 檢查 `SESSION_HANDOFF` 分清 Durable Anchors 與 Closeout-Reconciled State，具備 Task Understanding Summary 與 State Reconciliation Check，並用負面測試確認 stale snapshot 不能當作已對賬；v0.3.6 起再加入交接生命週期一致性反例，確認已完成事項不能被下一輪當成未解待辦。 | 是 |
| 交接語言本地化驗收 | 已併入 `doctor` 與 `npm run qa:release` | 檢查 `SESSION_HANDOFF` 保留 `ack:section:*` 與 `ack:field:*` 語義標記時，標題與可見欄位名稱可翻成中文或其他語言。 | 是 |
| 安裝後指示驗收 | 已併入 `npm run qa:prototype` 與 `npm run qa:release` | 檢查安裝成功後的終端機輸出不會令用戶誤把提示文字當成命令，並確認 README 說明安裝後第一步；同時檢查 `npx` 取得 CLI 工具與項目內 Kit 文件安裝不可混淆。 | 是 |
| 技能／子代理流程仲裁驗收 | 已併入 `npm run qa:packs` 與 `npm run qa:release` | 檢查外部技能、子代理、demo workspace 或其他工具的 closeout 不可取代目前根目錄自己的 Agent Handoff Kit 持久化。 | 是 |
| 舊核心升級結構驗收 | 已併入 `npm run qa:upgrade` 與 `npm run qa:release` | 檢查舊版未標記 `AGENTS.md` core 升級後不會留下雙核心、雙收尾合約或 stale 上半段，且保留 core 前後的使用者本地規則；同時確認升級後 core 已帶收工 read-back discipline，沒有殘留「先表面輸出、後重生 prompt」的第三真源舊次序。 | 是 |
| PROJECT_DECISIONS 結構驗收 | 已併入 `doctor` 與 `npm run qa:release` | 檢查 `dev/PROJECT_DECISIONS.md` 含 4 個 H2 section heading（Evolution Timeline / Decisions Archive / Architecture Choices / Insights & Learnings）並保持順序；檔頭含 onboarding 句式（「warm 資料層」、「AI 開工不需要讀」、「AI 在收工時自動 update」）。 | 是 |
| Prompt mirror 固定檢查器 | 已併入 `doctor`、`npm run qa:prompt-mirror` 與 `npm run qa:release` | 以同一 runtime helper 錨定 `ack:section:next-session-opening-message` / `## Next Session Opening Message`、copy marker 與下一個 fenced `text` block；比對前正規化 CRLF / LF，只把真內容差異列為 mismatch。 | 是 |
| 收工三面同源驗收 | 已併入 `npm run qa:release` 與人工 opening-message read-through | runtime closeout 必須先由 `dev/SESSION_HANDOFF.md` 重生並驗證 `START_NEXT_SESSION_PROMPT.txt`，再把穩定 bootstrap 句交給用戶；final response 不可成為 handoff / prompt file 之外的第三份 stateful prompt。 | 是 |
| Release Artifact Vocabulary Sweep | 已併入 `npm run qa:release` | 對 `bin/agent-handoff-kit.mjs` + `README.md` + `agent-handoff-kit-intro.html` + `agent-handoff-kit-guide.html` 跑禁忌字眼 grep（「人話解讀」「人話補一句」「人話解釋」）；對 `CHANGELOG.md` 限 latest version section (anchor-bounded by `## v` heading) 跑相同 grep；命中數必為 0。 | 是 |
| Onboarding HTML 書面語紀律 | 已併入 `npm run qa:release` | 對 `agent-handoff-kit-intro.html` 與 `agent-handoff-kit-guide.html` 跑廣東口語字符 grep（「嘅 / 咁 / 喺 / 揀 / 唔 / 乜 / 啱 / 嚟 / 咗 / 嗰」）；命中數必為 0（onboarding HTML 必為繁體中文書面語）。 | 是 |
| Onboarding Pack 結構驗收 (R-029) | 已併入 `doctor` 與 `npm run qa:release` 與 `npm run qa:packs` | 檢查 `dev/rules/onboarding.md` 含 H2 sections（Scope / Load When / Discipline / Application Scenario Library / Cross-reference to guide.html / Tone Discipline / Closeout）並保持順序；含 6 個 Scenario H3 heading（A 建構系統 / B 整理研究資料 / C 整理電腦檔案 / D 學寫代碼 / E 其他 / F 外部工具治理）；含 transient pack + 5-step walk-through pattern wording；含 Tone Discipline 5 條（書面語 / 講人話 / 敍事+解釋 / 不過度解釋 internals / 鼓勵性而非考試）。 | 是 |
| Cross-surface wording consistency 驗收 (R-029.1 → v0.3.19 startup-entry update) | 已併入 `npm run qa:release` 與 `npm run qa:prototype` 與 `npm run qa:upgrade` | 對 4 個 user-facing surface（`bin/agent-handoff-kit.mjs` printInstallNextSteps + `README.md` first-screen callout 同三步上手 step 2 + `agent-handoff-kit-intro.html` #howto Step 2 + #recap cell 1 + `agent-handoff-kit-guide.html` hero callout）grep `Start Agent Handoff` /「開工」主入口、`Read AGENTS.md first, then Start Agent Handoff` 帶路徑 fallback、普通 web chat AI 不支援邊界、`Wrap up Agent Handoff` /「收工」收工入口與「某某開工 / 某某收工」歧義保護；current surface 不得再把舊長句「Read AGENTS.md first. Then open START_NEXT_SESSION_PROMPT.txt」、任何 AI 工具均可用、貼一段提示 / 貼一段字、或「固定開工句 / 貼回提示」當成主流程。執行規則仍以 runtime `AGENTS.md` 單一真源為準；qa:upgrade chain test final hop 仍須含「First-time user signals」+「dev/rules/onboarding.md」routing row。 | 是 |

## QC 觸發分層

本文件同時覆蓋發佈前與發佈後，但兩者不可混成同一個 gate：

| 觸發 | 時機 | 覆蓋 | 通過代表 |
|---|---|---|---|
| 🟢 日常快檢（觸發詞：`快檢`） | 日常 source 修改後、commit 前。 | 四條 `npm run qa:*`：`qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release`。 | 原始碼層未破壞既有機器驗收。 |
| 🔴 發佈前全面檢（觸發詞：`全面檢`） | 發佈前，尤其是候選版本、治理結構改動，或使用者明示要求 full audit。 | 快檢 + 本文件人工審閱清單 + 維護者側 WORK 治理健康檢查八維度 + 產品級旅程矩陣 + UX / user journey 審閱 + CLI output sweep + cross-file read-through + rules / packs 路由與入庫範圍審核 + upgrade migration / scenario branching semantic sweep + QC gap backflow。 | 候選版本可以進入 tag / GitHub Release / npm publish；仍未代表已發佈完成。 |
| 🟡 發佈後驗證（觸發詞：`發佈檢`） | GitHub Release 與 `npm publish` 完成後立即執行。 | 七項 registry / release artifact smoke test：GitHub Release metadata、npm latest / fileCount、fresh install、published `--help` / `init` / `doctor`、previous published version → new published version upgrade + sequential doctor。 | 已公開 artifact 經 registry / release / fresh-install / upgrade smoke 驗證，release 才算完成；不承擔產品 QA。 |

`全面檢` 就是 `發佈前全面檢`，不得包含需要已 publish 才能執行的檢查。`發佈檢` 就是 `發佈後驗證`，只在公開發佈完成後執行，性質是 registry / release artifact smoke test，不是產品 QA。完整 release closeout 的順序是：先 `全面檢` PASS，取得明確 publish 批准後才 tag / GitHub Release / npm publish，最後跑 `發佈檢`。

## 產品級發佈前全面檢

🔴 發佈前全面檢要同時驗產品、流程、UX、場景與治理健康。它不是只跑 `qa:release`，也不是只讀文件。每次候選版本都必須留下可審閱的發佈前報告，至少包含：

1. 維護者側 WORK 治理健康八維正式結論：健康 / 緊張 / 不健康 / 過載，並給出繼續 / 合併 / 暫停 / 刪減方向。
2. 產品旅程矩陣：每個場景標記 automated PASS / manual PASS / blocked / not applicable，並附證據。
3. UX / user journey 結論：CLI、README、runtime handoff、onboarding pack、whatsnew 是否回答用戶在該步最可能問的下一句問題。
4. QC gap backflow 結論：本次發現的每個新問題，除產品修補外，是否已轉成自動驗收、人工清單、或有理由的暫時人工阻擋。
5. Rules / packs 路由與入庫範圍結論：`runtime-core/RULE_PACKS.md` 是否能以自然語言任務訊號載入相應 pack；標準 pack 的 Scope / Load When / Rules / Checks / Closeout 是否清楚；onboarding / integrations 等特殊 pack 是否有等效 discipline / closeout / checks 承接；可重用操作程序是否被導向既有 pack 或 registered reference，而不是隨意新建治理文件或只放入 handoff / log。

### Product Journey Matrix

| 場景 | 必驗問題 | 最低承接 | 未通過時 |
|---|---|---|---|
| Fresh install → init → first task | 新用戶安裝後是否知道下一步是在 AI 對話中開始，而不是把提示當終端機指令。 | `qa:release` user-flow + R-029 wording sweep + 人工終讀 | 阻擋 publish，直到 CLI / README / onboarding wording 對齊 |
| First task → closeout → next session handoff | 收工後下一個 AI 是否不需聊天記憶，也不會重開已完成調查；handoff、`START_NEXT_SESSION_PROMPT.txt` 與 final response 是否同源，不產生表面第三版本。 | `doctor` handoff lifecycle check + negative fixture + prompt mirror checker + final response read-back discipline + opening-message read-through | 阻擋 publish，並補 lifecycle fixture、prompt mirror assertion 或 manual checklist |
| Existing project upgrade → doctor → closeout | 舊用戶升級後是否不丟本地規則、不覆寫用戶內容、不出現「剛升完又叫再升」或「升級說可用、doctor 立刻失敗」矛盾。 | `qa:upgrade` chain + user-data fixture + CLI scenario branching sweep | 阻擋 publish，並補 prior-version fixture / scenario |
| Existing project upgrade → failed self-check repair | 正式 `upgrade` 已執行後，若自動 `doctor` 因 anchor 缺失失敗，輸出是否講清楚缺哪個檔案、缺哪段文字、下一步怎樣交給 AI 修；不得只叫新手回頭跑 `upgrade --dry-run`。 | Scenario 4c / 4d automated + anchor failure detail output | 阻擋 publish，直到失敗訊息有精準缺失與非破壞性修補步驟 |
| Existing Kit files → official npx doctor path | 舊項目已經有 Kit 文件時，用戶是否明白官方路徑是 `npx --yes @adamchanadam/agent-handoff-kit@latest doctor`；裸 `npx ... doctor` 只是 npm 通用執行方式，不作產品旅程。 | README / CLI help / intro / guide 冷啟動 `npx --yes` 指令 + `qa:release` npx UX guard + 人工終讀 | 阻擋 publish，直到 README、CLI help、doctor 下一步、intro、guide 與 QA guard 對齊 |
| Non-empty project with local rules | 既有 `AGENTS.md` / `PROJECT_INDEX.md` / `RULE_PACKS.md` 內容是否保留或停手報 conflict。 | `qa:upgrade` merge / custom-row / conflict fixtures | 阻擋 publish，除非明確列為人工-only conflict 類 |
| Conflict / blocked state | 工具是否清楚停手，說明沒有覆寫，並指出 migration report / 手動處理方向。 | Scenario 2 / 5 manual checklist until automated fixtures exist | 同類第二次出現即必須轉 automated |
| Doctor healthy / outdated / lifecycle conflict | `doctor` 是否分清健康、可升級、交接矛盾三類，不混成同一個下一步。 | Scenario 6 automated + scenario 7 manual + lifecycle negative fixture | 阻擋 publish，並補 scenario output contract |
| AI-generated handoff prose tolerance | `doctor` 不得用任意正文詞語硬猜生命週期；可機器判斷的只限 Kit 控制的結構標記與狀態欄位。 | Scenario 4b automated + lifecycle field fixture | 阻擋 publish，直到誤判 fixture 通過 |
| Natural-language task → rule pack → durable home | 用戶以自然語言提出寫作、研究、編碼、整合、發佈、治理、回覆格式或新手上手需求時，AI 是否能載入最少必要 pack，並把可重用程序寫入既有 pack / registered reference；不得因一次任務就任意新建 governance docs。 | `qa:packs` + Rule Pack Routing And Durable-home Scope Sweep + 人工抽樣 | 阻擋 publish，直到路由、pack scope、入庫位置與人工樣例對齊 |

### QC Gap Backflow

任何發佈前全面檢、人工終讀、UAT、真實用戶 session，或發佈後 artifact smoke test 意外揭出的新問題，都要同時判斷兩層：

- 產品層：需要修哪個 runtime、template、CLI、pack、README 或 release note。
- QC 層：為何現有驗收沒有抓到；要補自動 assertion、真實 fixture、scenario simulation、public manual checklist，還是記為暫時人工阻擋。

只修產品 bug 而沒有處理 QC 層，不可宣稱 release-grade。若同一類問題第二次以人工方式被發現，而仍沒有自動或明確 checklist 承接，該候選版本 blocked。

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
| 認知影響 | 檢查安裝後提示與 README 是否讓用戶分清終端機檢查與 AI 對話下一步；舊項目跑 `npx ... doctor` 時，也要分清 npm 取得 CLI 工具與 `doctor` 檢查項目文件。 |
| 事實漂移 | 用 handoff 對賬欄位、stale snapshot 負面測試與必讀來源欄位降低風險。 |
| 交接生命週期一致性 | 用 `doctor` 與 `qa:release` 檢查 `Completed This Session` / `Validation / QC` / `Next Priorities` / `Risks / Blockers` / `Next Session Opening Message`。已完成或已驗證的事項，不得在同一 handoff 中又以未解調查、待辦或下一次開工指令延續；除非明確改成 monitor-only、follow-up scope、blocked 或 reopened。 |
| 收工三面同源 | 用 `qa:release` 檢查 runtime closeout 次序含「先重生並驗證 `START_NEXT_SESSION_PROMPT.txt`，再展示穩定 bootstrap 句」；人工終讀確認 final response 不是另一份手寫 stateful next-session prompt。 |
| 執行落差 | 檢查規則是否有 `doctor`、QA 腳本、負面測試或人工審閱承接；不得只增加提醒文字。 |
| 技能流程覆蓋 | 用核心規則、治理規則包與 QA 錨點確認外部技能流程只能作 subordinate evidence，不能讓 active root 跳過 handoff/log/index/registry 持久化。 |
| Rules / packs 路由與入庫範圍 | 每次 release 前確認 `runtime-core/RULE_PACKS.md` 有自然語言任務訊號到各 pack 的路由；每個 `packs/*.md` 都有 Scope / Load When / Rules / Checks / Closeout；`runtime-core/AGENTS.core.md` 與 `packs/agent-governance.md` 都要求可重用操作程序進既有 rule pack 或 registered reference，不可只放 handoff / log，也不可未分類就新建治理文件。 |
| 舊核心殘留 | 用升級負面測試確認舊版 `AGENTS.md` core 被替換而不是附加；`doctor` 必須擋下同一檔案內兩個 core runtime 標題。 |
| 升級路徑覆蓋 | `qa:upgrade` 必須含跨版本鏈式升級驗收（`v0.1.4` → `v0.1.5` → `v0.1.6` → 當前 HEAD），每跳用對應版本嘅 CLI 跑 `init`／`upgrade`／`doctor`，最後一跳用當前 HEAD 跑並 self-check 通過。 |
| 補丁前置狀態枚舉 | 每個 `R-XXX` 補丁必須明文列覆蓋與唔覆蓋嘅前置狀態枚舉，唔填唔放行。例：R-024 覆蓋「夾心 managed + stale」「legacy single core」「無 core」三態，唔覆蓋「managed marker 不成對」（屬 conflict，由人工處理）。 |
| CLI Output Contract 一致性 | 每次 release 前 sweep `bin/agent-handoff-kit.mjs`：（a）`init`／`upgrade`／`doctor` 完成輸出必含版本（v0.X.Y）、模式（mode）、剛完成（counts）、下一步四項；（b）禁忌用語清單命中 = 0（含「人話解讀」等自貶字眼）；（c）內部 action 名（create／merge／skip／conflict／status）保留唔變。 |
| SESSION_LOG handoff-role discipline（R-010）| 每次 release 前 grep `bin/agent-handoff-kit.mjs` 含 `assessSessionLogDiscipline` 函數 + doctor 集成；grep `runtime-core/AGENTS.core.md` closeout step list 含「Advance the SESSION_LOG N-rule」+「R-010 SESSION_LOG handoff-role discipline」；grep `runtime-core/SESSION_LOG.md` template 含「Handoff role」blockquote。Fresh install + doctor 跑出「SESSION_LOG discipline (R-010): ok」（warn-only：N=11+ warn，doctor exit 不變 0）。 |
| Plan scope coverage matrix | 每次 release 嘅 plan 必明文列出三層 artifact families 嘅對齊範圍：（a）**Content layer** — `README.md` 版本字串 + `已正式發佈` 句、`CHANGELOG.md` prepend 新版本段、`package.json` version bump、`docs/qa/release-grade-qa.md` prepend 新版本「發佈狀態」段、對外 onboarding HTML（intro / guide）版本字串 + 任何因 release notes 觸發嘅描述更新；（b）**Script layer** — `scripts/check-release-readiness.mjs` 嘅 release baseline assertion + tarball name + README/CHANGELOG/release-grade-qa.md required string、`scripts/check-public-prototype.mjs` 嘅 tarball name + update notice mock newer version；（c）**Source layer** — `runtime-core/*.md` 嘅模板更新、`bin/agent-handoff-kit.mjs` 嘅功能改動、`packs/*.md` 嘅工作模式紀律。Plan 漏列任何 family 即視為 plan design gap，需 root-fix 或補 plan amend 後再 release。本維度由 v0.1.8 R-005 治理健康檢查（維護者側紀錄，2026-05-22）落地：v0.1.7 → v0.1.8 plan 初版漏咗 script layer，qa:release fail 揭發後加 root-fix（dynamic baseline refactor），令 script layer 之後自動同 package.json 對齊；future release plan 仍必明文列三層 families 做覆蓋自驗。 |
| Project Decisions discipline（R-028） | 每次 release 前須驗證：（a）`runtime-core/PROJECT_DECISIONS.md` template 含 4 個 H2 section heading 順序正確 + 檔頭 onboarding 句式；（b）`runtime-core/AGENTS.core.md` closeout step 12 wording 命中（含「Maintain `dev/PROJECT_DECISIONS.md`」、「R-028 project narrative discipline」、4 個 H2 section name）；（c）`bin/agent-handoff-kit.mjs` mappings 含 `runtime-core/PROJECT_DECISIONS.md` → `dev/PROJECT_DECISIONS.md`；（d）`bin/agent-handoff-kit.mjs` requiredAnchors + schemaChecks 含 `dev/PROJECT_DECISIONS.md` rule + group；（e）Fresh install 後 `dev/PROJECT_DECISIONS.md` 存在且 doctor 「project decisions log structure」schema check pass；（f）Upgrade 既有專案後 `dev/PROJECT_DECISIONS.md` 自動建立（若不存在）或保留（若用戶已有 content）。`npm run qa:release` 自動驗 (a)-(e)；(f) 由 `npm run qa:upgrade` mergeRoot scenario 嘅 existsSync assertion 驗。 |
| 書面語紀律（HTML 輸出） | 對外 onboarding HTML（`agent-handoff-kit-intro.html` + `agent-handoff-kit-guide.html`）必為繁體中文書面語，廣東口語字符（「嘅 / 咁 / 喺 / 揀 / 唔 / 乜 / 啱 / 嚟 / 咗 / 嗰」）grep 命中數必為 0。Release 前 `npm run qa:release` 自動驗。違反即視為 release artifact 質量落差，需逐句修正後再 release。 |
| Onboarding UX discipline（R-029） | 每次 release 前須驗證：（a）`packs/onboarding.md` template 含 7 個 H2 section（Scope / Load When / Discipline / Application Scenario Library / Cross-reference to guide.html / Tone Discipline / Closeout）+ 6 個 Scenario H3 + Anti-pattern table；（b）`runtime-core/AGENTS.core.md` `## 1. Startup Reads` 含 first-time-user signal detection wording + onboarding pack proactive load 紀律；（c）`runtime-core/RULE_PACKS.md` 含 onboarding signal routing row；（d）`bin/agent-handoff-kit.mjs` mappings 含 `packs/onboarding.md` → `dev/rules/onboarding.md`；（e）`bin/agent-handoff-kit.mjs` requiredAnchors + schemaChecks 含 onboarding pack rule + group；（f）Fresh install 後 `dev/rules/onboarding.md` 存在且 doctor schema check pass；（g）`npm run qa:packs` 嘅 onboarding routing scenario + first-time onboarding to first task mixed scenario 通過。`npm run qa:release` 自動驗 (a)-(f)；(g) 由 `qa:packs` 驗。 |
| Cross-surface wording alignment（R-029.1，v0.2.1 新加 dim；v0.3.19 更新） | v0.2.0 release ceremony 嘅 critical QC gap：plan scope coverage matrix 嘅三層（content / script / source）唔 cover cross-surface wording alignment。R-029 嘅 onboarding trigger phrase 跨 5 個 surface（CLI source + README + intro.html + guide.html + onboarding pack 自身），但 v0.2.0 release 時 CLI source 仍係 legacy wording 而其他 surface 已 update —— silent disconnect。v0.3.19 起 current public surface 改為短入口優先：`Start Agent Handoff` /「開工」是 AI 已在專案內的主入口，`Read AGENTS.md first, then Start Agent Handoff` 是 AI 尚未指向資料夾時的帶路徑 fallback；`scripts/check-release-readiness.mjs` 嘅 `checkCrossSurfaceWordingConsistency()` helper 自動 enforce 主入口、fallback、local-agent 支援邊界、收工入口與歧義保護喺 4 個 surface（bin + README + intro + guide）一致，並禁止舊長句或「固定開工句 / 貼回提示」回流。違反即 throw error，release 阻擋。 |
| Routing table propagation discipline（R-029.2，v0.2.1 新加 dim） | v0.2.0 既有 upgrade 紀律對 `dev/RULE_PACKS.md` 沿用 default `skip "preserve existing file"`，導致 v0.1.X 用戶 upgrade 後 routing table 仍係舊版（silent missing R-029 onboarding routing row）。Architectural reclassification：`dev/RULE_PACKS.md` 是 Kit 維護的 routing table，但升級仍須保留用戶自訂列。v0.2.1 起 `bin/agent-handoff-kit.mjs` `classifyExistingFile` 加 force-update merge logic；本修補起改為只補缺少的 Kit rows，不整份覆寫檔案。`scripts/check-upgrade-safety.mjs` chain test final hop 加 RULE_PACKS.md routing row 強制 assertion，並加 custom-row preservation regression。Doctor schema check 加 strict anchor enforce routing table 一致性。 |
| Upgrade migration safety from prior minor versions（R-030，v0.3.0 新加 dim） | v0.3.0 audit 揭發 systemic QC gap：`scripts/check-upgrade-safety.mjs` chain test fixture 只 cover `v0.1.4 → v0.1.5 → v0.1.6 → v0.1.7 → v0.1.8`，**跳過 v0.2.0 / v0.2.1 / v0.2.2 / v0.2.3 整個 state**，所以 v0.2.x → v0.3.0 嘅 upgrade-time migration / requiredAnchors propagation / user-data preservation 完全冇 automated test。v0.3.0 release Phase 5.5 🔴 全面檢 初版 audit miss 咗 5 個 upgrade pitfalls（External Sources 用戶 rows overwrite / doctor schema 7-col mismatch / v0.2.x doctor without upgrade fail / onboarding.md upgrade 後 doctor anchor fail / AGENTS.md managed-core R-030 propagation skip），由 Adam catch 才補。同類 pattern 同 v0.2.1 RULE_PACKS.md propagation gap 一致：每次 release reactive 發現，QC framework 唔自我擴展。v0.3.0 起 5 支柱 sustainable mechanism 落地：(P1) chain test extension —— chainSteps append 全部已 release minor / patch versions（v0.2.0 / v0.2.1 / v0.2.2 / v0.2.3），future release 必同步 append 新 tag；(P2) user-data-preservation regression fixture（`test-fixtures/user-data/`）—— PROJECT_INDEX 含用戶填過 External Sources / Fact Base / Workspace Identity 完整 rows，upgrade 後 8+ assertion 驗證 rows 全部 preserved；(P3) prior-version requiredAnchors propagation test —— chain final 後 explicit assert AGENTS.md 含當前 major release 新 anchors（譬如 v0.3.0「startup availability probe」/「dev/rules/integrations.md」/「Credential separation」）+ onboarding.md 含 Scenario F；(P4) docs/qa/release-grade-qa.md 加本 dim + Upgrade Migration Safety Sweep section；(P5) WORK AGENTS.md `## QC Trigger Vocabulary` 🔴 全面檢 條目加新 mandatory item + 長期記憶 codify。Future major bump 必 cover 呢 5 支柱，違反即視為 audit-time blind spot。 |
| CLI 場景分流（scenario branching）一致性（R-031.1，v0.3.1 新加 dim） | v0.3.1 第一個真實 v0.3.0 用戶 session 揭發 systemic QC gap：CLI output 喺唔同場景下重用同一 banner，未按場景分流。實際事故：upgrade 完成印「✅ 安裝完成」+ 推送新手起步句「I just installed agent-handoff-kit」；第二次 upgrade（零改動）仍跑完整 ceremony 寫 migration report + self-check doctor；doctor 結尾叫人「如要升級到較新版」但 startup `maybePrintUpdateNotice` 已印過更新通知。Root cause：既有 R-026 CLI Output Contract sweep helper 屬 **lexical / structural layer**（grep token 存在性 + R-026 contract 四項 + forbidden vocabulary），未 cover **semantic / scenario-fit layer**（同一字串喺場景 X 出現係咪事實正確 + 用戶可行動）。譬如「安裝完成」字串本身合法（唔屬 forbidden），但喺 upgrade no-op 場景印屬事實錯誤；grep miss 因為 grep 只 sweep token，唔 sweep 場景。 v0.3.1 起加新 dim「CLI 場景分流（scenario branching）一致性」+ 配套 CLI Scenario Branching Coverage Sweep（automated）。列舉七個 user-invocable 場景：(1) install fresh / (2) init with existing local rules（資料夾已有本地 AI 規則）/ (3) upgrade fresh substantive（首次升級含 create+merge）/ (4) upgrade no-op（已 latest 零改動）/ (5) upgrade with conflict / (6) doctor healthy & latest / (7) doctor healthy with newer available。每個場景定 output contract（must-have / must-not-have / context-appropriate），simulation 真實 invoke 驗收。同 5 支柱 sustainable QC 同層擴展。 |

### Handoff Lifecycle Consistency Sweep（v0.3.6 新加）

對應治理 QA 缺口矩陣「交接生命週期一致性」。`scripts/check-release-readiness.mjs` 必須同時驗證：

- 正常 closeout：`State Reconciliation Check` 的 stale snapshot、lifecycle conflict、opening message、next AI can continue 欄位全部通過。
- 負面反例：同一份 handoff 若在 `Completed This Session` / `Validation / QC` 寫明 `doctor` / `upgrade` 已完成，卻在 `Next Priorities` 或 opening message 要求下一輪重新調查同一件事，`isReconciledHandoff()` 必須回傳 false。
- `doctor` fresh install 仍須通過；新增欄位不得令空白模板或無矛盾 handoff 失敗。

### Upgrade Migration Safety Sweep（R-030，v0.3.0 新加 Sweep）

對應 7-dim 第七項 dim「Upgrade migration safety from prior minor versions」嘅 automated enforcement Sweep。`scripts/check-upgrade-safety.mjs` 強制 grep + assertion：

- (a) **Chain test 覆蓋全部 already-released minor / patch versions**：chainSteps array 含 v0.1.4 → v0.1.5 → v0.1.6 → v0.1.7 → v0.1.8 → v0.2.0 → v0.2.1 → v0.2.2 → v0.2.3 → v0.3.0 → v0.3.1 → v0.3.2 → v0.3.3 → v0.3.4 → v0.3.5 → current HEAD v0.3.6（15 個已發佈 tag + final current HEAD）。每次新 release 必 append 新 tag 至 array，否則該 release 失「upgrade chain coverage from prior version」紀律；v0.3.6 起另由機器斷言候選 patch 版本不可漏上一個已發佈 patch tag。
- (b) **User-data-preservation regression fixture**：`test-fixtures/user-data/dev/PROJECT_INDEX.md` 含 Notion DB「Project Tasks」/ Drive「Project Files/」/ Linear「Project Backlog」/ Python 3.11 Stack / pytest QC commands / a1b2c3d Workspace Identity 等用戶填過 rows。chain test 之後 run upgrade，8+ assertion 驗證 rows 全部 preserved + Installed Integrations section 已 insert（non-destructive migration）。
- (c) **Prior-version requiredAnchors propagation test**：chain final 後 explicit assert AGENTS.md 含當前 major release 新 anchors（v0.3.0：「startup availability probe」/「dev/rules/integrations.md」/「Credential separation」）+ onboarding.md 含 Scenario F（v0.3.0 R-030 anchor）—— 確認 managed-core merge + smart-merge 對 v(N-1) state propagation 觸發。

違反任何 (a) / (b) / (c) 即 throw error，release 阻擋。

### CLI Scenario Branching Coverage Sweep（R-031.1，v0.3.1 新加 Sweep）

對應治理 QA 缺口矩陣第 9 項 dim「CLI 場景分流（scenario branching）一致性」嘅 automated enforcement Sweep。`scripts/check-release-readiness.mjs` 真實 invoke `bin/agent-handoff-kit.mjs` 喺各場景 fixture，並 assert output 嘅 must-have / must-not-have 規則：

**七個場景嘅 output contract（scenario 3 由 v0.3.4 起拆成 3a / 3b 兩條驗收路徑；v0.3.15 起補 3c lifecycle placeholder 路徑）**：

| # | 場景 | must-have（用戶必睇到） | must-NOT-have（避免事實錯誤） |
|---|---|---|---|
| 1 | install fresh（新目錄首次 init） | 「安裝完成」/「Start Agent Handoff」主入口 /「Read AGENTS.md first, then Start Agent Handoff」帶路徑 fallback /「普通 web chat AI」不支援邊界 /「下面這句不是終端機指令」 | 「升級完成」/「你已經是最新版本」/「Read AGENTS.md first. Then open START_NEXT_SESSION_PROMPT.txt」 |
| 2 | init with existing local rules（資料夾已有本地 AI 規則） | 「已補齊缺少檔案，但仍要檢查入口連接」/「upgrade --dry-run」/ 既有 `AGENTS.md` 保留 | 「乾淨首次安裝」起步句 / 覆寫既有規則 |
| 3a | upgrade metadata-only stale（結構已最新，只有 template version metadata 過期） | 「升級完成」/「版本詳情不在升級流程內展開」/ metadata 更新紀錄 / template version metadata 更新為當前版本 / doctor self-check 不再提示項目版本未對齊 | 「你已經是最新版本，沒有檔案需要建立或合併」/「安裝完成」/「I just installed agent-handoff-kit. Help me get started.」/「本次升級涵蓋」（避免重做 onboarding 或在 CLI 內展開長篇 release notes） |
| 3b | upgrade structurally stale（真實舊版 fixture → 當前，含 create + merge） | 「升級完成」/「進行中的工作對話已熟悉 Agent Handoff Kit 可繼續使用原本開工方式」/「版本詳情不在升級流程內展開」/ template version metadata 更新為當前版本 | 「安裝完成」/「I just installed agent-handoff-kit. Help me get started.」/「I just upgraded agent-handoff-kit」/「本次升級涵蓋」（避免重做 onboarding 或要求用戶在升級當刻讀長篇版本說明） |
| 3c | upgrade stale lifecycle placeholder（舊版本 metadata + 既有 lifecycle 欄位仍為 placeholder + handoff 已有 substantive Completed / Validation） | 「升級完成」/ `Reclassified at upgrade` /「升級驗收完成」/ template version metadata 更新為當前版本 | `missing dev/SESSION_HANDOFF.md (handoff lifecycle consistency)` / `status: failed` /「交接狀態仍需 AI closeout 核對」/「本次升級涵蓋」（避免工具自己升級後又被自己擋住，亦避免升級成功輸出被 release notes 淹沒） |
| 4 | upgrade no-op（已 latest 零改動，交接健康） | 「你已經是最新版本，沒有檔案需要建立或合併」/ output 行數 ≤ 20 行 | 「安裝完成」/「升級完成」/「I just installed」/「I just upgraded」/「migration report」/「升級後自動檢查」 |
| 4b | upgrade no-op（已 latest 零改動，但 handoff 欄位仍需 closeout 核對） | 「Kit 檔案已是最新版本，沒有檔案需要建立或合併」/「交接狀態仍需 AI closeout 核對」/「不要重裝或覆寫用戶內容」 | 「繼續日常使用即可」/「安裝完成」/「升級完成」/「I just installed」/「I just upgraded」 |
| 4c | upgrade substantive with stale prompt convenience copy（mac 用戶實測類型：正式 upgrade 合併 `AGENTS.md`，但 `START_NEXT_SESSION_PROMPT.txt` 是舊便利副本） | `START_NEXT_SESSION_PROMPT.txt` 便利副本落後只可 warning / 「升級驗收完成」 | `status: failed` / anchor checks failed / 正式 upgrade 後叫用戶回頭跑 `upgrade --dry-run` |
| 4d | upgrade self-check anchor failure（正式 upgrade 後，保留檔案仍缺 blocking anchor） | `missing anchor text` /「怎樣修這個」/「不要重跑 upgrade」/ 缺段檔案與缺失片段 | 只叫用戶跑 `upgrade --dry-run` 而沒有修補步驟 |
| 5 | upgrade with conflict | 「conflict」count > 0 / 「migration report」/「工具已停手，沒有覆寫」 | 「升級完成」 |
| 6 | doctor healthy & latest（已係最新版） | 「status: passed」/「檢查已通過」/「項目狀態速覽」/版本、上次收工、首次安裝距今三向狀態 | 「如要升級到較新版」/「繼續日常使用即可」（避免叫剛升完嘅用戶再升，亦避免把 doctor 健康輸出膨脹成安裝後新手指引） |
| 7 | doctor healthy with newer available | startup `maybePrintUpdateNotice` 嘅升級通知 / 「status: passed」 | doctor 結尾再講一次升級指令（避免 redundant） |

**Automated simulation 範圍（v0.3.1 first land；v0.3.4 split scenario 3；v0.3.8 add handoff-needs-closeout no-op；v0.3.9 add affirmative lifecycle wording regression；v0.3.10 post-release debt cleanup add scenario 2 / 5 / 7；v0.3.13 add post-upgrade failed-self-check UX scenarios 4c / 4d；v0.3.15 add scenario 3c stale lifecycle placeholder）**：場景 1 / 2 / 3a / 3b / 3c / 4 / 4b / 4c / 4d / 5 / 6 / 7 為 automated。場景 2 改以「已有本地 AI 規則的 init」表示真實可觸發的安裝邊界：`init` 不覆寫既有規則，而是補齊缺檔並指向 `upgrade --dry-run`。

場景 4b / 4c / 4d 是通用舊項目旅程，不綁定任何單一用戶目錄。真實項目只能作發現問題的證據；自動驗收必須用可重建 fixture 表達同類狀態，避免把個別專案文字硬寫成產品規則。

**未來新加 user-invocable surface 嘅紀律**：每加一個新 CLI sub-command 或新場景分流，必同步加 dim row + Sweep row + automated simulation；違反即視為 audit-time blind spot 重演（同 v0.3.0 R-030 5 支柱嘅 P4 紀律一致）。

### Rule Pack Routing And Durable-home Scope Sweep（v0.3.14 新增）

對應治理 QA 缺口矩陣「Rules / packs 路由與入庫範圍」。發佈前全面檢必須同時做機器錨點與人工語意審閱，確認 rules / packs 不是只有檔案存在，而是真的能引導 AI 從用戶自然語言進入正確工作模式與正確入庫位置。

`npm run qa:packs` 與 `npm run qa:release` 必須守住以下錨點：

- `runtime-core/RULE_PACKS.md` 有所有已發佈 pack 的自然語言任務訊號路由，並保留 minimum set / safety escalation / cannot weaken core safety 紀律。
- 標準 `packs/*.md` 有固定結構：Scope、Load When、Rules、Checks、Closeout；特殊 scenario / integration pack 若使用 Discipline / Scenario Library / Cross-reference 等結構，仍必須保留清楚的 Load When、可檢查規則與 Closeout。
- `packs/agent-governance.md` 明確要求：新增 durable workflow / runbook / instruction files 前，先分類 knowledge type，先找既有 home；可重用 operating procedures 屬於 relevant rule pack 或 registered reference；new runbooks are last resort only。
- `runtime-core/AGENTS.core.md` Pack Loading 段明確要求：task 後把 durable facts 寫入正確 home；handoff / log 不足以承載 reusable procedure knowledge。
- `docs/qa/release-grade-qa.md` 本段與 Product Journey Matrix 都保留「Natural-language task → rule pack → durable home」檢查，令 full audit 報告必須對 rules / packs 路由給出結論。

人工審閱時，至少抽樣以下自然語言類型並標記 automated PASS / manual PASS / blocked：

| 自然語言任務類型 | 預期路由 | 入庫判斷 |
|---|---|---|
| 「幫我改 code / debug / 跑 test」 | coding；如有檔案破壞、package manager、API、deploy 風險再加 safety | 程式行為與命令地圖進 PROJECT_INDEX / DOC_SYNC；可重用開發程序才進 coding pack 或 registered reference |
| 「幫我查資料 / 比較方案 / 找最新資料」 | research；如涉及外部知識庫再加 knowledge / integrations | 來源與不確定性進 handoff/log；長期 reference map 進 PROJECT_INDEX；可重用研究流程進 research pack 或 registered reference |
| 「幫我寫文案 / 改 README / 統一語氣」 | writing / communication | 讀者口徑與格式規則進相應 pack 或 human document governance；不要只留在一次性回覆 |
| 「幫我同步 Notion / Drive / 知識庫」 | knowledge + integrations；有寫入或權限風險再加 safety | 外部真源與 sync obligation 進 PROJECT_INDEX / DOC_SYNC_REGISTRY；connector 程序進 integrations pack 或 registered reference |
| 「改 AI 規則 / handoff / closeout / tool-use」 | agent-governance + relevant domain pack | 先找既有 pack / registry / reference；新 governance doc 必須是 last resort 且 indexed |
| 「發佈 / tag / npm publish / hotfix」 | release + safety | 版本、commit、artifact、驗證證據進 release closeout；未經批准不得外部發佈 |
| 「我是新手 / 教我用 / 點開始」 | onboarding，再 transition 至 regular scenario pack | first-task scope 入 handoff；完成 onboarding 後 unload onboarding pack |

若 pack change 或 runtime routing change 未能通過以上機器錨點或人工抽樣，候選版本不得進入 publish。

### Npx Cold-start UX Sweep（v0.3.7 候選新加）

對應治理 QA 缺口矩陣「認知影響」與 Product Journey Matrix「Existing Kit files → official npx doctor path」。本缺口來自真實舊項目實測：目錄內已有舊版 Kit 文件，但執行裸 `npx ... doctor` 時，npm 仍先顯示 `Need to install the following packages`。用戶會合理理解成「doctor 正在安裝」，但實際上 `doctor` 尚未開始執行；npm 只是要先取得 CLI 工具。

`scripts/check-release-readiness.mjs` 必須守住以下口徑：

- README、CLI help / next-step output、`agent-handoff-kit-intro.html`、`agent-handoff-kit-guide.html` 的用戶示範命令須使用 `npx --yes @adamchanadam/agent-handoff-kit@latest ...`，避免裸 `npx ... doctor` 觸發誤導性確認提示。
- 裸寫不帶 `--yes` / `@latest` 的 `npx doctor` 不列為官方建議用戶路徑；它只是 npm 仍可接受的通用執行方式，不應為它另開產品旅程。
- README 必須明確說明兩層安裝：項目內 Kit 文件，與電腦用來執行指令的 npm CLI 工具。
- README 必須明確說明：即使目前資料夾已安裝舊版 Kit 文件，`npx` 仍可能因本機沒有可執行工具而先取得 package；這不等於 `doctor` 正在安裝或改動項目。
- CLI 可見輸出必須明確說明：`doctor` 只檢查，不會安裝或修改項目文件。

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

`docs/whatsnew/` 是 repo / GitHub Release 發佈材料，不再屬於 npm package runtime 資料；`docs/qa/`、原始碼設計文件、`scripts/` 與 `test-fixtures/` 也都是原始碼倉庫資產。除非未來發佈明確改變套件邊界，否則不應出現在 `npm pack --dry-run` 輸出中。

## 目前基線

- `npm run qa:prototype` 已存在並通過。
- `npm run qa:packs` 已存在並通過，會檢查靜態規則包路由、安全升級與 mixed-scenario 分階段載入。
- `npm run qa:upgrade` 已存在並通過，會檢查初步 safe `AGENTS.md` merge、backup creation、conflict reporting 與 upgrade 後 `doctor`。
- `npm run qa:upgrade` 已補舊 Kit core 回歸守門：v0.1.3-style 與 v0.1.4-style 未標記 core 升級後，只能保留一個 `# Agent Handoff Kit Core Runtime`，並保留 core 前後的本地規則。
- `npm run qa:release` 已存在並通過，會串起三條既有驗收、驗證套件邊界、用真正 packed tarball 安裝後跑 prior-version upgrade smoke、文件錨點、較完整的 `doctor` schema 輸出，並執行從安裝到收工再到接力開工的多步驟用戶流程模擬。
- `doctor` 已檢查任務入口事實欄位：Fact Base、External Sources、Local QC Commands 與 Next Task Required Reading。
- `doctor` 已檢查 handoff 對賬欄位：Durable Anchors、Closeout-Reconciled State、Task Understanding Summary 與 State Reconciliation Check。
- `doctor` 已改以 handoff 語義標記為主要 schema 依據，英文段名只作預設模板與舊版本兼容。
- `doctor` 會檢查 `START_NEXT_SESSION_PROMPT.txt` 與 `dev/SESSION_HANDOFF.md` 的 fenced opening message 是否一致；安裝後與 closeout 後必須一致，session 進行中若只有便利副本落後，普通 `doctor` 只可警告，不可 fail。
- 安裝後指示已改為清楚分隔的中文下一步區塊，明確說明後續文字應貼到能讀寫本機專案資料夾的 AI agent 對話，不是在終端機繼續輸入；普通 web chat AI 若不能讀寫本機資料夾，不屬於支援場景。
- 套件預演目前維持 25 個 package files；`docs/whatsnew/v0.3.1.md` 至 `docs/whatsnew/v0.3.19.md` 保留在 repo 作 GitHub Release / changelog 材料，但不入 npm package；runtime 共用 prompt mirror helper 位於 `bin/`，`docs/qa/`、`scripts/` 與 `test-fixtures/` 不入包。
- 完整 section-aware merge 仍待補；非空既有專案 upgrade trial 已通過，正式發佈前仍須重跑或以等效臨時專案重驗。

## 發佈前人工審閱清單

本清單用來判斷是否可以進入候選發佈。勾完本清單仍不等於可以發佈；tag、GitHub Release、npm publish 或 release closeout 必須由使用者另行明確批准。

| 審閱面向 | 目前證據 | 候選發佈前判斷 |
|---|---|---|
| 發佈授權 | Adam 已明確授權執行 v0.3.19 commit、push、tag、GitHub Release、npm publish 與發佈後驗證。 | 可進入發佈動作 |
| 版本口徑 | `package.json` 目前為 `0.3.19`；v0.3.19 是短開工入口優先與公開說明去長句化修補。 | 正式發佈口徑 |
| 公開名稱 | GitHub repo 為 `Adamchanadam/agent-handoff-kit`；npm package 為 `@adamchanadam/agent-handoff-kit`；CLI command 仍為 `agent-handoff-kit`。 | 已準備，publish 前須即時重驗 npm 名稱 |
| 套件邊界 | `package.json` `files` 包含 `bin/`、`runtime-core/`、`packs/`、`README.md`、`LICENSE`；`docs/whatsnew/` 不入 npm package；目前 `npm pack --dry-run` 應為 25 files。 | 通過，但發佈前須重跑套件預演 |
| 原始碼驗收 | `qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release` 已建立並通過；subagent follow-up 補丁後已在本地未提交候選狀態重跑 `qa:release`。 | 通過；若後續再改 source，publish 前須重跑 |
| 非空既有專案升級 | 候選發佈準備重驗已通過：臨時非空專案保留既有 README、docs、src、notes、package 與本地規則；`AGENTS.md` 建立 backup 並合併 managed core；`doctor` 通過。 | 通過，發佈前如有 installer 改動須再重跑 |
| 完整 merge 能力 | 目前只有 `AGENTS.md` managed-core merge；完整 section-aware merge 尚未完成。 | 阻擋正式穩定版；可作 prototype / candidate 風險項 |
| 公開文件一致性 | README、package metadata、CHANGELOG、`docs/whatsnew/v0.3.19.md` 與 onboarding HTML 轉入 v0.3.19 正式發佈口徑。 | 通過 |
| 交接可靠性 | R-009、R-010、R-011 已納入 `doctor` / `qa:release`，包含必讀事實、狀態對賬、本地化 handoff 標題與交接生命週期一致性。 | 通過，但需人工確認語意無誤 |
| 安裝後可理解性 | R-013 已修補終端機成功提示與 README，用戶可分清終端機檢查與 AI 對話下一步。 | 通過，但發佈前需人工終讀 |
| 安全邊界 | safety pack、release pack 與核心安全底線均禁止未批准的 destructive / release / publish 行為。 | 通過，但需人工確認無放寬措辭 |
| 污染掃描 | `qa:prototype` 掃描 WORK 路徑、private repo 名稱、舊 opening marker、常見 secret pattern；subagent follow-up 後已重跑通過。 | 通過；若後續再改 source，publish 前須重跑 |
| GitHub / npm 發佈材料 | `CHANGELOG.md` 已新增 `v0.3.19` 段，`docs/whatsnew/v0.3.19.md` 已補本版用戶說明。 | 可用於 GitHub Release / npm publish |
| 用戶安裝路徑 | README 保留正式 `npx --yes ...@latest` 安裝與檢查路徑，並標示目前版本為 `v0.3.19` 正式發佈版本。 | 通過 |

## v0.3.19 發佈狀態

- package version：`0.3.19`。
- release notes：`CHANGELOG.md` 的 `v0.3.19` 段落 + `docs/whatsnew/v0.3.19.md`。
- 發佈目標：把公開 README、npm README 來源、CLI 安裝後輸出、intro / guide HTML 與 runtime closeout 顯示統一為短開工入口優先：`Start Agent Handoff` /「開工」；只有 AI 尚未指向專案資料夾時才使用帶路徑啟動句。
- 發佈狀態：Adam 已明確授權全套發佈；source commit / tag / GitHub Release / npm publish / 發佈後驗證由本輪 release ceremony 執行並在 WORK 紀錄收口。

### Cross-mind evidence 9-trigger table（v0.3.19）

| Trigger | Required? | Result | Evidence / rationale |
|---|---|---|---|
| 1. 失敗或 blocker | no — not observed yet in this candidate | passed | 目前修補來自公開說明殘留舊長句的用戶挑戰；subagent follow-up 後本地機器驗收已 PASS。若要 publish，仍須按流程完成發佈前全面檢 / 授權 / 發佈後驗證。 |
| 2. 同類 bug 連續 2+ 次修補仍未斷 | yes | iterated | v0.3.18 已修 local-agent 邊界但公開 README / HTML 仍把長句放主入口；v0.3.19 把短入口提升為主流程並新增舊句殘留檢查。 |
| 3. 真實用戶 / Adam challenge | yes | iterated | Adam 明確指出 GitHub Pages intro 仍不清楚，要求逐句重檢 README、npm README 來源與 HTML。 |
| 4. 三個以上治理檔同步改動 | yes | iterated | 涉 README、intro、guide、CLI、runtime、QA 腳本與 release-grade QA；同步責任已記錄，subagent follow-up 後本地機器驗收已重跑通過。 |
| 5. 將要對外 commit / tag / publish | yes | passed | Adam 已明確授權 v0.3.19 全套發佈；publish 後仍須跑發佈後驗證收口。 |
| 6. 存在人工語意判斷而無機器斷言 | yes | iterated | 已把短入口、fallback、舊長句殘留、固定開工句殘留轉入 `checkCrossSurfaceWordingConsistency()` 與 prototype check。 |
| 7. Cross-agent / cross-session handoff point | yes | iterated | Runtime closeout 顯示改為短入口 + fallback；`START_NEXT_SESSION_PROMPT.txt` 仍由 handoff 真源生成，不把 final response 變第三份 stateful prompt。 |
| 8. Public-user journey / onboarding wording changed | yes | iterated | README、intro、guide、CLI 均改為「AI 已在專案內：Start Agent Handoff / 開工；未指向資料夾：帶路徑啟動句」。 |
| 9. QC framework exposed or should have exposed the gap | yes | iterated | 舊 QC 只守長 bootstrap phrase，反而把錯誤主入口固化；v0.3.19 將守門口徑改成短入口優先與舊句禁止。 |

## v0.3.18 發佈狀態

- 發佈版本：`0.3.18`。
- release notes：`CHANGELOG.md` 的 `v0.3.18` 段落 + `docs/whatsnew/v0.3.18.md`。
- 發佈內容：收緊工具適用邊界；Agent Handoff Kit 面向能讀寫本機專案資料夾的 agentic AI 長任務，不面向不能讀寫本機檔案的普通 web chat AI。
- 開工口徑：CLI / README / HTML 顯示固定 bootstrap 句，要求 AI 先讀 `AGENTS.md`，再打開 `START_NEXT_SESSION_PROMPT.txt`；初次安裝的 prompt 檔承載新手引導，收工後的 prompt 檔承載真正接力狀態。`Start Agent Handoff` / `Wrap up Agent Handoff` 只作簡短入口提示；真正的開工 / 收工意圖偵測與「某某開工 / 某某收工」反問規則只放 runtime `AGENTS.md`。
- 發佈前驗收：全面檢 PASS；`qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release` 均通過，並確認 CLI / README / HTML 含 local-agent 邊界、普通 web chat 不支援聲明、固定 bootstrap 句；prompt mirror 仍確認 `START_NEXT_SESSION_PROMPT.txt` 與 handoff opening message 同源。
- 發佈後驗證：7/7 artifact smoke PASS；GitHub Release `v0.3.18 - 開工接力更清楚` 非 draft / 非 prerelease，npm latest 為 `0.3.18`，package fileCount 25；fresh published install、published `--help` / `init` / `doctor`、以及 v0.3.17 → v0.3.18 published-package upgrade + sequential doctor 均通過。

### Cross-mind evidence 9-trigger table（v0.3.18）

| Trigger | Required? | Result | Evidence |
|---|---|---|---|
| 1. 發佈說明使用「已修復／可用」等強聲明 | yes | passed | 已以全面檢、`qa:release`、npm metadata 與發佈後 7/7 artifact smoke 支撐。 |
| 2. 同類 bug 連續 2+ 次修補仍未斷 | yes | iterated | README 曾把 `Read AGENTS.md...` 放成日常開工句，令用戶誤以為不用 `START_NEXT_SESSION_PROMPT.txt`；本版改成固定 bootstrap 句。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | iterated | 功能層：CLI / runtime prompt；測試層：prototype / release readiness；敘事層：README / HTML / CHANGELOG / whatsnew。 |
| 4. 三個以上治理檔同步改動 | yes | iterated | README、CLI、runtime core、QA scripts、QA doc、HTML、WORK governance map 與 registered mirrors 需同步。 |
| 5. 將要對外 commit / tag / publish | yes | passed | Adam 已授權發佈；source commit `d3bd498` 已 push，tag `v0.3.18`、GitHub Release 與 npm publish 已完成。 |
| 6. 結論基於語意判斷而非單一 grep | yes | iterated | 語意為「Kit 需要本機讀寫能力」與「prompt 檔承載狀態，surface 只給 bootstrap」。 |
| 7. 上次同類問題曾被用戶 catch | yes | iterated | Adam 指出 README / npm README 會誤導用戶，並要求明確工具範圍。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | 新檢查以 fresh install CLI、installed prompt、README / HTML 文案共同守門。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | local-agent 邊界、固定 bootstrap、快捷詞與歧義保護均已有 QA 斷言；npm publish 後 registry metadata 已對齊。 |

## v0.3.17 發佈狀態

- 發佈版本：`0.3.17`。
- release notes：`CHANGELOG.md` 的 `v0.3.17` 段落 + `docs/whatsnew/v0.3.17.md`。
- 發佈內容：修正 Jay 真實升級成功後 CLI 輸出過長問題；`upgrade` 成功後不再 inline 展開多版本 `docs/whatsnew` 全文，只保留完成狀態、自動 `doctor` 提示與 GitHub Release 入口。
- 發佈前驗收：`qa:release` 必須確認 scenario 3a / 3b / 3c 的 substantive upgrade output 不含「本次升級涵蓋」、markdown 版本標題或「本版新加了甚麼」長篇 release notes 內容；同時用正向短輸出守門限制 upgrade success narrative ≤ 8 條非空行、≤ 430 字，輸出版本必須對齊 package version；再用真正 packed tarball 安裝後跑 v0.3.16 → v0.3.17 upgrade + doctor smoke，防止 package fileCount / files 邊界改動令 published package 缺檔或升級失敗。
- npm 狀態：已 npm publish；npm latest 為 `0.3.17`；package fileCount 25（移除 `docs/whatsnew/` 入包，版本說明留在 repo / GitHub Release 材料）。
- 🟡 發佈檢：v0.3.17 post-publish artifact smoke 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、published `--help` / `init` / `doctor`、以及 v0.3.16 → v0.3.17 published-package upgrade 均通過。

### Cross-mind evidence 9-trigger table（v0.3.17）

| Trigger | Required? | Result | Evidence |
|---|---|---|---|
| 1. 發佈說明使用「已修復／可用」等強聲明 | yes | passed | 強聲明只對應 upgrade 成功輸出降噪；機器落點為 `qa:release` scenario 3a / 3b / 3c must-not-have assertions。 |
| 2. 同類 bug 連續 2+ 次修補仍未斷 | yes | iterated | v0.3.2 曾加入 inline whatsnew 解決「升級不知道改了甚麼」；Jay v0.3.16 實測證明該資訊放在 installer 流程會造成 UX 噪音，本版改由 GitHub Release 承接詳情。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：CLI upgrade output；測試層：release readiness scenario contract；敘事層：CHANGELOG、whatsnew、本段、README / HTML 版本口徑。 |
| 4. 三個以上治理檔同步改動 | yes | passed | public CLI、QA docs、QA script、CHANGELOG、whatsnew、README、HTML 與 WORK governance records 需同步；WORK session state 不進 npm package。 |
| 5. 將要對外 commit / tag / publish | yes | passed | Adam 已明確批准 v0.3.17 commit、push、tag、GitHub Release、npm publish；發佈後七項 artifact smoke 已通過。 |
| 6. 結論基於語意判斷而非單一 grep | yes | iterated | 語意為「升級流程只完成升級和驗收，不承載長篇版本詳情」；用禁止長篇標記、正向行數 / 字數上限、版本對齊、GitHub Release 入口與 packed-package upgrade smoke 多層驗證。 |
| 7. 上次同類問題曾被用戶 catch | yes | iterated | Jay 真實 upgrade 成功輸出被長篇 v0.3.15 / v0.3.16 說明淹沒；本版將該輸出類型轉為發佈前守門。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | scenario 3b 使用真實 v0.1.7 fixture；scenario 3c 通用重建 Jay 類 lifecycle placeholder 狀態；本次 UX guard 針對所有 substantive upgrade output。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明對應 CLI output、scenario 3a / 3b / 3c、GitHub Release link、README / HTML 版本口徑、`docs/whatsnew/` 不入包、package fileCount，以及 packed-package upgrade smoke。 |

## v0.3.16 發佈狀態

- 發佈版本：`0.3.16`。
- release notes：`CHANGELOG.md` 的 `v0.3.16` 段落 + `docs/whatsnew/v0.3.16.md`。
- 發佈內容：修正 closeout prompt 第三真源風險；runtime closeout 必須先由 handoff 重生並讀回 `START_NEXT_SESSION_PROMPT.txt`，再把讀回內容放入 final response。
- 發佈前驗收：快檢四項、`qa:prompt-mirror`、收工三面同源驗收、舊核心升級 read-back discipline regression、v0.3.15 → v0.3.16 upgrade chain、41 個入包檔案、公開文件版本口徑與 HTML mirror hash 均已通過；Adam 其後明確批准公開發佈動作。
- npm 狀態：已 npm publish；npm latest 為 `0.3.16`；package fileCount 41（從 40 增加 1，加 `docs/whatsnew/v0.3.16.md`）。
- 🟡 發佈檢：v0.3.16 post-publish artifact smoke 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、published `--help` / `init` / `doctor`、以及 v0.3.15 → v0.3.16 published-package upgrade 均通過。

### Cross-mind evidence 9-trigger table（v0.3.16）

| Trigger | Required? | Result | Evidence |
|---|---|---|---|
| 1. 發佈說明使用「已修復／可用」等強聲明 | yes | passed | 強聲明只對應 closeout prompt read-back / third-source guard；機器落點為 `qa:release` runtime core assertion 與 `qa:upgrade` old-core propagation assertion。 |
| 2. 同類 bug 連續 2+ 次修補仍未斷 | yes | iterated | v0.3.12 修 prompt convenience warning，v0.3.14 修 fixed checker，今次再揭發 final response 可能成為第三真源；本版把同類坑位轉成發佈前守門。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：runtime core closeout order；測試層：release readiness + upgrade safety；敘事層：CHANGELOG、whatsnew、本段、README / HTML 版本口徑。 |
| 4. 三個以上治理檔同步改動 | yes | passed | public runtime、QA docs、QA scripts、CHANGELOG、whatsnew、README、HTML 與 WORK governance records 同步；WORK session state 不進 npm package。 |
| 5. 將要對外 commit / tag / publish | yes | passed | Adam 已明確批准本輪執行 commit、push、tag、GitHub Release、npm publish 與 release closeout；發佈後七項 smoke 已通過。 |
| 6. 結論基於語意判斷而非單一 grep | yes | iterated | 語意為「final response 只能展示已持久化並讀回的 prompt copy」；用必含 guard、禁止舊次序、prompt mirror、升級傳播四層驗證。 |
| 7. 上次同類問題曾被用戶 catch | yes | iterated | Adam 指出 START prompt 可能只在 surface 顯示且 WORK prompt 是手動更新；本版將該情況轉成 closeout 三面同源產品合約。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | 舊核心 fixture 仍保留舊次序作輸入狀態，但升級後必須消除舊句並帶入 read-back discipline。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明對應 runtime order、final-response guard、old-core upgrade propagation、prompt mirror status、whatsnew / README 版本口徑與 package fileCount。 |

## v0.3.15 發佈狀態

- 發佈版本：`0.3.15`。
- release notes：`CHANGELOG.md` 的 `v0.3.15` 段落 + `docs/whatsnew/v0.3.15.md`。
- 發佈內容：修正 Jay 類舊項目升級路徑：root template metadata 落後、既有 lifecycle 欄位仍為 `TBD`，但 handoff 已有 substantive Completed / Validation 內容時，upgrade 必須安全重分類 placeholder，不能先顯示升級完成再由同一次自動 `doctor` 報 `handoff lifecycle consistency` 失敗。
- 發佈前驗收：快檢四項、Jay 類 stale lifecycle placeholder regression、`qa:release` scenario 3c、v0.3.14 → v0.3.15 upgrade chain、40 個入包檔案、公開文件版本口徑均已通過。
- npm 狀態：已 npm publish；npm latest 為 `0.3.15`；package fileCount 40（從 39 增加 1，加 `docs/whatsnew/v0.3.15.md`）。
- 🟡 發佈檢：v0.3.15 post-publish artifact smoke 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、published `--help` / `init` / `doctor`、以及 v0.3.14 → v0.3.15 published-package upgrade 均通過。

### Cross-mind evidence 9-trigger table（v0.3.15）

| Trigger | Required? | Result | Evidence |
|---|---|---|---|
| 1. 發佈說明使用「已修復／可用」等強聲明 | yes | passed | 強聲明只對應 Jay 類 stale lifecycle placeholder migration；機器落點為 `qa:upgrade` regression 與 `qa:release` scenario 3c。 |
| 2. 同類 bug 連續 2+ 次修補仍未斷 | yes | iterated | v0.3.14 修補 missing lifecycle field，但 Jay 再揭發 existing lifecycle marker + placeholder value 組合；本版把該組合轉為獨立 regression。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：CLI bounded merge；測試層：upgrade safety、release scenario 3c；敘事層：CHANGELOG、whatsnew、本段與 README 版本口徑。 |
| 4. 三個以上治理檔同步改動 | yes | passed | public QA docs、scripts、CHANGELOG、whatsnew、README 與 WORK governance records 同步；WORK session state 不進 npm package。 |
| 5. 將要對外 commit / tag / publish | yes | passed | Adam 已明確批准本輪全面檢通過後執行 commit、push、tag、GitHub Release 與 npm publish；若全面檢未通過則不得進入公開發佈動作。 |
| 6. 結論基於語意判斷而非單一 grep | yes | iterated | 產品語意為「metadata stale 時 upgrade migration 應修舊 placeholder；latest no-op 時仍交給 closeout 判斷」；用 scenario 3c 與 4b 分別守住兩條邊界。 |
| 7. 上次同類問題曾被用戶 catch | yes | iterated | Jay 真實 v0.3.14 升級輸出與附件 handoff / migration report 揭發；已轉成可重建 fixture，不硬編碼 Jay 專案文字。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | scenario 3c 由 current init + older metadata row + substantive handoff seed 重建狀態；真實 Jay 附件只作根因證據，產品測試用通用可重建狀態。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明對應 bounded lifecycle reclassification、post-upgrade self-check pass、latest no-op boundary、whatsnew / README 版本口徑與 package fileCount。 |

## v0.3.14 發佈狀態

- 發佈版本：`0.3.14`。
- release notes：`CHANGELOG.md` 的 `v0.3.14` 段落 + `docs/whatsnew/v0.3.14.md`。
- 發佈內容：修正舊版項目跨版本升級時，migration 寫入 `TBD` lifecycle 欄位而同一次自動 `doctor` 又拒絕該欄位的 false failure；同時把 rules / packs 路由與 durable-home scope 納入發佈前全面檢。
- 發佈前驗收：快檢四項、v0.1.7 substantive handoff lifecycle migration regression、rules / packs routing and durable-home scope sweep、prompt mirror 固定檢查器、39 個入包檔案、公開文件版本口徑均已通過。
- npm 狀態：已 npm publish；npm latest 為 `0.3.14`；package fileCount 39（從 37 增加 2，加 `docs/whatsnew/v0.3.14.md` 與 `bin/prompt-mirror-core.mjs`）。
- 🟡 發佈檢：v0.3.14 post-publish artifact smoke 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、published `--help` / `init` / `doctor`、以及 v0.3.13 → v0.3.14 published-package upgrade 均通過。

### Cross-mind evidence 9-trigger table（v0.3.14）

| Trigger | Required? | Result | Evidence |
|---|---|---|---|
| 1. 發佈說明使用「已修復／可用」等強聲明 | yes | passed | 強聲明只對應 lifecycle migration false failure 與 rules / packs full-audit scope；機器落點為 v0.1.7 substantive handoff regression、`qa:packs`、`qa:release` anchors。 |
| 2. 同類 bug 連續 2+ 次修補仍未斷 | yes | iterated | v0.3.13 解決 anchor repair UX，但 Jay Mac 報告揭發 migration 自寫 `TBD` 後被同版 `doctor` 拒絕；本版把該狀態轉成 fixture。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：CLI migration lifecycle value；測試層：upgrade safety、pack scenario、release readiness；敘事層：README、CHANGELOG、whatsnew、本段。 |
| 4. 三個以上治理檔同步改動 | yes | passed | public QA docs、scripts、pack、README、CHANGELOG、whatsnew 與 WORK governance records 同步；WORK session state 不進 npm package。 |
| 5. 將要對外 commit / tag / publish | yes | passed | 本表只作發佈前證據；tag、GitHub Release、npm publish 仍需 Adam 另行明確批准。 |
| 6. 結論基於語意判斷而非單一 grep | yes | passed | 產品語意為「upgrade 不可寫入立即 fail 的 lifecycle 值」與「自然語言任務要路由到 pack / durable home」；不是只靠字串 grep。 |
| 7. 上次同類問題曾被用戶 catch | yes | iterated | Jay Mac 真實升級 log 與 Adam 對 rules / packs 入庫邏輯的追問揭發；已轉成 regression 與 release-grade sweep。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | v0.1.7 root 由真實舊 CLI 生成，再注入 substantive handoff content 以重現舊項目狀態；此人工注入已明確標成 regression seed。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明對應 migration value、post-upgrade self-check、rule pack structure、durable-home routing、prompt mirror 固定檢查器、whatsnew / README 版本口徑與 package fileCount。 |

## v0.3.13 發佈狀態

- 發佈版本：`0.3.13`。
- release notes：`CHANGELOG.md` 的 `v0.3.13` 段落 + `docs/whatsnew/v0.3.13.md`。
- 發佈內容：修正正式 `upgrade` 後自動 `doctor` anchor failure 的新手修補路徑；`START_NEXT_SESSION_PROMPT.txt` 便利副本不再作 blocking anchor；`agent-governance` pack 與 core 持久化流程補明 reusable operating procedure 應歸入 pack / registered reference。
- 發佈前驗收：快檢四項、scenario 4c / 4d、stale prompt warning-pass、true anchor failure repair steps、v0.3.12 → v0.3.13 升級鏈、37 個入包檔案、公開文件版本口徑、以及 reusable procedure governance pack guard 均須通過。
- npm 狀態：發佈後應驗證 npm latest 為 `0.3.13`；package fileCount 37（從 36 增加 1，加 `docs/whatsnew/v0.3.13.md`）。
- 🟡 發佈檢：v0.3.13 publish 後須驗證 GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、published `--help` / `init` / `doctor`、以及 v0.3.12 → v0.3.13 published-package upgrade。

### Cross-mind evidence 9-trigger table（v0.3.13）

| Trigger | Required? | Result | Evidence |
|---|---|---|---|
| 1. 發佈說明使用「已修復／可用」等強聲明 | yes | passed | 強聲明只對應升級後 anchor failure repair UX 與 reusable procedure 歸位規則；`qa:release` scenario 4c / 4d + `qa:packs` guard 覆蓋。 |
| 2. 同類 bug 連續 2+ 次修補仍未斷 | yes | iterated | v0.3.8-v0.3.12 多次由真實用戶旅程揭發 doctor / upgrade UX 邊界；本次把 dry-run 死路與治理入庫漂移轉成自動場景。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：CLI、runtime core、agent-governance pack；測試層：upgrade safety、release scenario、pack scenario；敘事層：README、CHANGELOG、whatsnew、本段。 |
| 4. 三個以上治理檔同步改動 | yes | passed | public core、pack、QA、CHANGELOG、whatsnew、WORK AGENTS / handoff / decision log 同步；WORK session state 不進 npm package。 |
| 5. 將要對外 commit / tag / publish | yes | passed | 本表與全面檢作為發佈前證據；未通過不得進入 commit / tag / release / publish。 |
| 6. 結論基於語意判斷而非單一 grep | yes | passed | 產品語意為「正式 upgrade 後不能送新手回 dry-run」及「reusable procedure 不等於 current handoff state」；用真實 invocation 與 pack guard 驗證。 |
| 7. 上次同類問題曾被用戶 catch | yes | iterated | Adam 由 mac 用戶 upgrade failure 與本 session runbook 歸位漂移揭發；已轉成 scenario 4c / 4d 與 agent-governance pack guard。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | scenario 4c / 4d 是抽象化可重建狀態；同時補 v0.3.12 real fixture 與 chain hop 到 current HEAD。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明對應 CLI output contract、anchor missing detail、non-circular repair guidance、pack persistence guard、whatsnew / README 版本口徑與 package fileCount。 |

## v0.3.12 發佈狀態

- 發佈版本：`0.3.12`。
- release notes：`CHANGELOG.md` 的 `v0.3.12` 段落 + `docs/whatsnew/v0.3.12.md`。
- 發佈內容：修正普通 `doctor` 將 `START_NEXT_SESSION_PROMPT.txt` 中途落後誤判為失敗；保留 closeout 時重生便利副本的嚴格要求。
- 發佈前驗收：快檢四項、in-session prompt convenience drift fixture、v0.3.11 → v0.3.12 升級鏈、36 個入包檔案、公開文件版本口徑、以及 `doctor` warning / failure 分流均通過。
- npm 狀態：已 npm publish；npm latest 為 `0.3.12`；package fileCount 36（從 35 增加 1，加 `docs/whatsnew/v0.3.12.md`）。
- 🟡 發佈檢：v0.3.12 post-publish verification 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、published `--help` / `init` / `doctor`、以及 v0.3.11 → v0.3.12 published-package upgrade 均通過。

### Cross-mind evidence 9-trigger table（v0.3.12）

| Trigger | Required? | Result | Evidence |
|---|---|---|---|
| 1. 發佈說明使用「已修復／可用」等強聲明 | yes | passed | 強聲明只對應普通 `doctor` prompt mirror drift 不再 fail；targeted repro + `qa:release` fixture 覆蓋。 |
| 2. 同類 bug 連續 2+ 次修補仍未斷 | yes | iterated | v0.3.8-v0.3.11 已多次暴露 `doctor` / user journey 邏輯邊界；本次新增 fixture 防止同類 prompt convenience drift 回歸。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：`bin/agent-handoff-kit.mjs`；測試層：`scripts/check-release-readiness.mjs`；敘事層：README、CHANGELOG、whatsnew、本段。 |
| 4. 三個以上治理檔同步改動 | yes | passed | runtime core、PROJECT_INDEX、release QA、README 與 WORK 記錄同步更新；WORK session state 不進 npm package。 |
| 5. 將要對外 commit / tag / publish | yes | passed | 本表與全面檢作為發佈前證據；未通過不得進入 commit / tag / release / publish。 |
| 6. 結論基於語意判斷而非單一 grep | yes | passed | 產品語意為「active session warning vs closeout-ready strict」；用真實 `doctor` invocation 驗證，不只 grep。 |
| 7. 上次同類問題曾被用戶 catch | yes | iterated | Adam 由 runtime project doctor failure 揭發；已轉成 release readiness fixture。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | prompt convenience drift fixture 是最小可重建狀態；同時仍跑完整歷史 upgrade chain 到 current HEAD。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明對應 targeted repro、release user-flow drift fixture、ordinary doctor warning output、closeout regenerated prompt retained。 |

## v0.3.11 發佈狀態

- 發佈版本：`0.3.11`。
- release notes：`CHANGELOG.md` 的 `v0.3.11` 段落 + `docs/whatsnew/v0.3.11.md`。
- 發佈內容：post-v0.3.10 用戶旅程守門；scenario 2 / 5 / 7 自動化；v0.2.x 到 v0.3.10 真實 fixture 升級覆蓋；whatsnew schema；公開文件語氣與 onboarding guide 對齊。
- 發佈前驗收重點：快檢四項、v0.3.10 → v0.3.11 升級鏈、35 個入包檔案、公開文件版本口徑、conflict 停手文字與首次安裝後 AI 對話旅程均須通過。
- npm 狀態：已 npm publish；npm latest 為 `0.3.11`；package fileCount 35（從 34 增加 1，加 `docs/whatsnew/v0.3.11.md`）。
- 🟡 發佈檢：v0.3.11 post-publish verification 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、published `--help` / `init` / `doctor`、以及 v0.3.10 → v0.3.11 published-package upgrade 均通過。

### Cross-mind evidence 9-trigger table（v0.3.11）

| Trigger condition | Required (yes/no) | Result (passed / iterated / blocked) | Follow-up (assertion ID / checklist item / accepted risk reason) |
|---|---|---|---|
| 1. 發佈說明使用「已驗證／已修復／可持續／sustainable」等強聲明 | yes | iterated | 本版只聲明已把 v0.3.10 後續債務轉成候選守門；公開完成狀態仍由發佈後驗證確認。 |
| 2. 同類 bug 連續兩版出現 | yes | iterated | v0.3.7 至 v0.3.10 均暴露用戶旅程與發佈守門落差；本版把 scenario 2 / 5 / 7 轉入自動檢查。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：upgrade conflict 停手文字；測試層：release scenario、upgrade fixture、whatsnew schema；敘事層：README、HTML、CHANGELOG、whatsnew、本段。 |
| 4. 三個以上治理檔同步改動 | yes | passed | public docs、QA scripts、whatsnew、CHANGELOG 與 WORK 鏡像同步規則一起更新；WORK session state 不輸出到 npm package。 |
| 5. 公開可見發佈儀式 | yes | blocked | tag、GitHub Release、npm publish 仍須在候選檢查通過後執行，並以發佈後驗證收口。 |
| 6. 存在人工語意判斷而無機器斷言 | yes | iterated | Case A/B/C guide 順序與非技術語氣屬語意 UX；已補進 release readiness、manual checklist 與 WORK mirror sync 規則。 |
| 7. 發佈後上一版由真實用戶抓 bug | yes | iterated | v0.3.10 後 Adam 抓到 guide / outputs 鏡像漏同步；已轉成 DOC_SYNC_REGISTRY 優先規則與 hash 驗證紀律。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | 升級 fixture 已覆蓋 v0.2.x 至 v0.3.10 真實版本；候選 v0.3.11 由 current HEAD 鏈路驗證。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 主要聲明對應：scenario 2 / 5 / 7、自動升級鏈、whatsnew schema、package fileCount 35 與 mirror sync 規則。 |

## v0.3.10 發佈狀態

- 發佈版本：`0.3.10`。
- release notes：`CHANGELOG.md` 的 `v0.3.10` 段落 + `docs/whatsnew/v0.3.10.md`。
- 發佈內容：首次安裝後真實 AI 對話旅程修補；精簡終端機下一步、修復 Claude Code 橋接檔被擴寫問題、補明 Antigravity CLI / Gemini CLI 遷移期入口關係，並改善新手情境文字。
- 發佈前驗收重點：首次安裝 → AI 對話 → 情境選擇、污染後橋接檔升級修復、v0.3.9 → v0.3.10 升級鏈與 34 個入包檔案均須通過。
- npm 狀態：已 npm publish；npm latest 為 `0.3.10`；package fileCount 34（從 33 增加 1，加 `docs/whatsnew/v0.3.10.md`）。
- 🟡 發佈檢：v0.3.10 post-publish verification 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、published `--help` / `init` / `doctor`、以及 v0.3.9 → v0.3.10 published-package upgrade 均通過。

### Cross-mind evidence 9-trigger table（v0.3.10）

| Trigger condition | Required (yes/no) | Result (passed / iterated / blocked) | Follow-up (assertion ID / checklist item / accepted risk reason) |
|---|---|---|---|
| 1. 發佈說明使用「已驗證／已修復／可持續／sustainable」等強聲明 | yes | iterated | 候選段只聲明本地候選修補；正式發佈與發佈後驗證未完成前，不宣稱已公開驗證。 |
| 2. 同類 bug 連續兩版出現 | yes | iterated | v0.3.7 至 v0.3.9 已連續修補 CLI / doctor / upgrade 旅程邊界；本版把首次 AI 對話與橋接檔污染納入同一用戶旅程層。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | iterated | 功能層：CLI、bridge、onboarding；測試層：scenario、pack、upgrade chain；敘事層：README、HTML、CHANGELOG、whatsnew、本段。 |
| 4. 三個以上治理檔同步改動 | yes | passed | runtime-core、pack、CLI、public docs、QA scripts 同步更新；WORK session state 仍留在 WORK，不輸出到 npm package。 |
| 5. 公開可見發佈儀式 | yes | blocked | publish 尚未批准；tag、GitHub Release、npm publish 須另行明確確認。 |
| 6. 存在人工語意判斷而無機器斷言 | yes | iterated | 新手文字與 AI 對話重複輸出屬語意 UX；已轉入 pack scenario、release scenario 與 manual journey checklist。 |
| 7. 發佈後上一版由真實用戶抓 bug | yes | iterated | 本版由 Adam 真實首次安裝與 Claude Code 對話 log 觸發；產品規則不硬寫單一目錄，只抽象成橋接檔與 onboarding 旅程。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | 自動測試使用可重建 fixture；真實 `ahk_first_ai_test_*` 只作發現問題證據。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 主要聲明對應：首次安裝輸出、bridge restore、Antigravity/Gemini bridge、onboarding Scenario A 與 Google Drive wording。 |

## v0.3.9 發佈狀態

- 發佈版本：`0.3.9`。
- release notes：`CHANGELOG.md` 的 `v0.3.9` 段落 + `docs/whatsnew/v0.3.9.md`。
- 發佈內容：修補 lifecycle 欄位誤判。若欄位明確以 `yes` / `resolved` / 「已完成」等確認語開始，即使後文提到仍有 pending follow-up，也不應被判作未完成。
- 發佈前驗收重點：真實 `AI_Public_Squares` 實測已揭出問題並通過修補；自動回歸加入「yes + pending follow-up wording」案例，防止同類誤判回來。
- npm 狀態：已 npm publish；npm latest 為 `0.3.9`；package fileCount 33（從 32 增加 1，加 `docs/whatsnew/v0.3.9.md`）。
- 🟡 發佈檢：v0.3.9 post-publish verification 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、post-install `--help` / `init` / `doctor`、v0.3.8→v0.3.9 chain-upgrade routing propagation、以及 yes + pending follow-up lifecycle 回歸場景均通過。

### Cross-mind evidence 9-trigger table（v0.3.9）

| Trigger condition | Required (yes/no) | Result (passed / iterated / blocked) | Follow-up (assertion ID / checklist item / accepted risk reason) |
|---|---|---|---|
| 1. 發佈說明使用「已驗證／已修復／可持續／sustainable」等強聲明 | yes | iterated | 本版只聲明 lifecycle 欄位確認句誤判已修補；機器落點為 affirmative lifecycle wording regression 與 package fileCount 33。 |
| 2. 同類 bug 連續兩版出現 | yes | iterated | v0.3.7 / v0.3.8 連續暴露 `doctor` / `upgrade` lifecycle UX 邊界；v0.3.9 把真實項目新缺口收成判斷順序回歸。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：lifecycle field affirmative-first 判斷；測試層：yes + pending follow-up 回歸；發佈敘事層：CHANGELOG、whatsnew、本段。 |
| 4. 三個以上治理檔同步改動 | yes | passed | public release-grade QA、CHANGELOG、whatsnew 與 WORK 紀錄需同步；真實項目 `AI_Public_Squares` 只作驗收證據，不作 public runtime 真源。 |
| 5. 公開可見發佈儀式 | yes | iterated | Adam 已批准本輪發佈前全面檢與 publish；本表覆蓋 publish 前判斷，publish 後仍須跑 🟡 發佈後驗證。 |
| 6. 存在人工語意判斷而無機器斷言 | yes | iterated | 「yes 句中可提待辦」屬語意邊界；已轉成 `isAffirmativeLifecycleFieldValue()` 與 release readiness 回歸。 |
| 7. 發佈後上一版由真實用戶抓 bug | yes | iterated | v0.3.8 發佈後 Adam 在 `AI_Public_Squares` 測到確認句含 `pending` 被誤殺；本版保留真實驗收，同時抽象為通用 fixture。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | 自動測試不硬寫 `AI_Public_Squares` 內容，只重建「確認句 + 後續待辦」狀態類型。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 主要聲明對應斷言：affirmative lifecycle field with pending follow-up wording should pass；`no` 類 unresolved field 仍 fail。 |

## v0.3.8 發佈狀態

- 發佈版本：`0.3.8`。
- release notes：`CHANGELOG.md` 的 `v0.3.8` 段落 + `docs/whatsnew/v0.3.8.md`。
- 發佈內容：修補舊項目 upgrade no-op 與 doctor handoff health 的訊息矛盾。當 Kit 檔案已最新但交接狀態仍需 closeout 核對時，`upgrade` 不再說「繼續日常使用即可」。
- 發佈前驗收重點：scenario 4b 必須通過，確認本修補是通用 fixture，不綁定任何單一項目或 AI 正文。
- npm 狀態：已 npm publish；npm latest 曾為 `0.3.8`；package fileCount 32（從 31 增加 1，加 `docs/whatsnew/v0.3.8.md`）。
- 🟡 發佈檢：v0.3.8 post-publish verification 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、post-install `--help` / `init` / `doctor`、R-029.1 canonical phrase、npm README 與 v0.3.7→v0.3.8 chain-upgrade routing propagation 均通過。其後 `AI_Public_Squares` 實測揭出 lifecycle 欄位確認句誤判，轉入 v0.3.9 修補。

### Cross-mind evidence 9-trigger table（v0.3.8）

| Trigger condition | Required (yes/no) | Result (passed / iterated / blocked) | Follow-up (assertion ID / checklist item / accepted risk reason) |
|---|---|---|---|
| 1. 發佈說明使用「已驗證／已修復／可持續／sustainable」等強聲明 | yes | iterated | 本版只聲明 upgrade no-op handoff-health 訊息矛盾已修補；機器落點為 scenario 4b 與 package fileCount 32。 |
| 2. 同類 bug 連續兩版出現 | yes | iterated | v0.3.5 / v0.3.6 / v0.3.7 連續暴露 `doctor` / `upgrade` UX 邊界；v0.3.8 把真實舊項目問題轉為通用 fixture。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：CLI no-op output + doctor lifecycle boundary；測試層：scenario 4b；發佈敘事層：CHANGELOG、whatsnew、本段。 |
| 4. 三個以上治理檔同步改動 | yes | passed | public release-grade QA、CHANGELOG、whatsnew 與 WORK handoff / decision / QA strategy 已同步記錄。 |
| 5. 公開可見發佈儀式 | yes | iterated | Adam 已批准發佈前全面檢與 publish；本表覆蓋 publish 前判斷，publish 後仍須跑 🟡 發佈後驗證。 |
| 6. 存在人工語意判斷而無機器斷言 | yes | iterated | 「不掃 AI 正文猜語意」屬語意邊界；已轉成 Kit-controlled field check + scenario 4b 自動驗收。 |
| 7. 發佈後上一版由真實用戶抓 bug | yes | iterated | v0.3.7 發佈後 Adam 在真實舊項目測到 upgrade no-op / doctor 矛盾；本版明確把真實目錄抽象為通用 fixture，不硬編特例。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | scenario 4b 為 schema-boundary 通用 fixture，目的是重建狀態類型；真實目錄只作證據來源，不作產品規則。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 主要聲明對應斷言：upgrade no-op 不再誤稱可日常使用、doctor 仍能指出 handoff 欄位待核對、scenario 4b 通過。 |

## v0.3.7 發佈狀態

- 發佈版本：`0.3.7`。
- release notes：`CHANGELOG.md` 的 `v0.3.7` 段落 + `docs/whatsnew/v0.3.7.md`。
- 發佈內容：修補舊項目執行 `doctor` 時的 `npx` 冷啟動 UX 誤解。官方用戶路徑統一為 `npx --yes @adamchanadam/agent-handoff-kit@latest ...`，並明確說明 npm 取得 CLI 工具不等於 `doctor` 安裝或修改項目文件。
- 發佈前驗收重點：`scripts/check-release-readiness.mjs` 的 `Npx Cold-start UX Sweep` 必須確認 README、CLI help、新手介紹頁與操作指南對齊。
- npm 狀態：已 npm publish；npm latest 為 `0.3.7`；package fileCount 31（從 30 增加 1，加 `docs/whatsnew/v0.3.7.md`）。
- 🟡 發佈檢：v0.3.7 post-publish verification 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、post-install `--help` / `init` / `doctor`、R-029.1 canonical phrase、npm README 與 v0.3.6→v0.3.7 chain-upgrade routing propagation 均通過。

### Cross-mind evidence 9-trigger table（v0.3.7）

| Trigger condition | Required (yes/no) | Result (passed / iterated / blocked) | Follow-up (assertion ID / checklist item / accepted risk reason) |
|---|---|---|---|
| 1. 發佈說明使用「已驗證／已修復／可持續／sustainable」等強聲明 | yes | iterated | 本版只聲明 `npx doctor` 冷啟動 UX 已補說明與守門；機器落點為 `checkNpxColdStartUxGuidance()` 與 fileCount 31。 |
| 2. 同類 bug 連續兩版出現 | yes | iterated | v0.3.5 / v0.3.6 先後修 `doctor` / `upgrade` 與 lifecycle consistency；v0.3.7 將真實舊項目 `npx doctor` 誤解轉成正式 UX 守門。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：CLI help / next-step wording；測試層：`scripts/check-release-readiness.mjs`；發佈敘事層：README、CHANGELOG、whatsnew、intro、guide 與本段。 |
| 4. 三個以上治理檔同步改動 | yes | passed | public release-grade QA、README、HTML、CHANGELOG、whatsnew 與 WORK handoff 已同步記錄；公開 runtime 不新增治理負擔。 |
| 5. 公開可見發佈儀式 | yes | iterated | Adam 已要求進入發佈流程；本表覆蓋 publish 前判斷，publish 後仍須跑 🟡 發佈後驗證。 |
| 6. 存在人工語意判斷而無機器斷言 | yes | iterated | 「裸 npx 不是官方旅程」屬語意判斷；已補 README / CLI / intro / guide 的機器字串守門，npm README 需 publish 後驗證。 |
| 7. 發佈後上一版由真實用戶抓 bug | yes | iterated | v0.3.6 發佈後 Adam 在真實舊項目測到 npm `Need to install` 提示；本版把該情境列入 Product Journey Matrix 與 Npx Cold-start UX Sweep。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | no | passed | 產品問題來自真實舊項目行為；自動守門覆蓋公開文字一致性，發佈後再用 fresh install 驗證 npm package。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 主要聲明已對應斷言：官方 `npx --yes ...@latest` 路徑存在、裸命令不作示範、README 兩層安裝說明存在、CLI 說明 `doctor` 不修改項目。 |

## v0.3.6 發佈狀態

- 發佈版本：`0.3.6`。
- release notes：`CHANGELOG.md` 的 `v0.3.6` 段落 + `docs/whatsnew/v0.3.6.md`。
- 發佈內容：修補 v0.3.5 dogfood 發現的交接狀態一致性缺口。`doctor` 會檢查已完成或已驗證的事項是否又被下一輪當成未解調查；`SESSION_HANDOFF` 模板新增 lifecycle conflict 對賬欄位；`qa:release` 加入 `doctor` / `upgrade` 矛盾反例。
- 發佈前驗收重點：`scripts/check-release-readiness.mjs` 的模擬 closeout 必須通過正常對賬，並擋下「completed + pending 同題矛盾」反例。
- npm 狀態：已 npm publish；npm latest 為 `0.3.6`；package fileCount 30（從 29 增加 1，加 `docs/whatsnew/v0.3.6.md`）。
- 🟡 發佈檢：v0.3.6 post-publish verification 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、post-install `--help` / `init` / `doctor`、R-029.1 canonical phrase 與 chain-upgrade routing propagation 均通過。

### Cross-mind evidence 9-trigger table（v0.3.6）

| Trigger condition | Required (yes/no) | Result (passed / iterated / blocked) | Follow-up (assertion ID / checklist item / accepted risk reason) |
|---|---|---|---|
| 1. 發佈說明使用「已驗證／已修復／可持續／sustainable」等強聲明 | yes | iterated | 發佈前全面檢使用獨立 `claude -p` 審閱交叉檢查；審閱抓到本表缺漏後，本次 root-fix 補 v0.3.6 專屬九觸發表，並在 `scripts/check-release-readiness.mjs` 加最新版本表格完整性守門。 |
| 2. 同類 bug 連續兩版出現 | yes | iterated | v0.3.5 修 `doctor` / `upgrade` 用戶旅程與 RULE_PACKS 合併，v0.3.6 修 handoff lifecycle consistency；同屬「完成狀態被下一步敘事重新打開」類風險。機器落點：`doctor` lifecycle consistency schema check、`qa:release` negative fixture、`qa:upgrade` v0.3.5 chain hop。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：`bin/agent-handoff-kit.mjs` lifecycle consistency 與 upgrade merge；測試層：`scripts/check-release-readiness.mjs` + `scripts/check-upgrade-safety.mjs`；發佈敘事層：`CHANGELOG.md` + `docs/whatsnew/v0.3.6.md` + 本段。 |
| 4. 三個以上治理檔同步改動 | yes | iterated | WORK 與 public release-grade QA 同步修正了 QC trigger、產品級發佈前全面檢、Product Journey Matrix、QC Gap Backflow 與 governance map 顯示；本 public repo 的 durable release gate 落點為本文件與 `scripts/check-release-readiness.mjs`，大型 WORK 審查上下文不提交 public repo。 |
| 5. 公開可見發佈儀式 | no — not required: v0.3.6 尚未 tag / GitHub Release / npm publish，Adam 明確要求修完後仍不得立即 publish | passed | 接受風險原因：本表只覆蓋 pre-publish gate；公開發佈儀式須另得使用者明確批准，publish 後再跑 🟡 發佈後驗證。 |
| 6. 存在人工語意判斷而無機器斷言 | yes | iterated | 人工語意判斷包括 handoff lifecycle 是否把已完成事項重新列成待辦、產品旅程矩陣、UX / user journey 結論、九觸發表完整性。已補 `qa:release` lifecycle negative fixture 與最新九觸發表完整性守門；場景 2 / 5 / 7 仍保留人工 checklist，若同類第二次再出現即轉自動 fixture。 |
| 7. 發佈後上一版由真實用戶抓 bug | yes | iterated | v0.3.5 發佈後 dogfood 揭發 handoff 內「已完成 doctor / upgrade 調查」又被下一輪 opening message 當成未解調查；v0.3.6 將此轉為 lifecycle consistency schema check + release negative fixture。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | Handoff lifecycle negative fixture 屬受控合成，用於語意邊界測試；upgrade path 同時由真實 prior-version chain 覆蓋至 v0.3.5。接受條件：合成 fixture 只承擔 schema / semantic-boundary，production upgrade state 仍由 `qa:upgrade` real chain 與 user-data regression 承擔。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | v0.3.6 的主要聲明已對應斷言：lifecycle conflict 欄位存在 → `runtime-core/SESSION_HANDOFF.md` anchor + doctor schema；已完成事項不可未解 carry-forward → `assessHandoffLifecycleConsistency()` + `qa:release` negative fixture；v0.3.5 → v0.3.6 upgrade path → `qa:upgrade` chain；九觸發表不可空白 → `qa:release` 最新版本表格完整性守門。 |

## v0.3.5 發佈狀態

- 發佈版本：`0.3.5`。
- release notes：`CHANGELOG.md` 的 `v0.3.5` 段落 + `docs/whatsnew/v0.3.5.md`。
- 發佈內容：修補 v0.3.4 後續全面治理審計揭發的 `doctor` / `upgrade` / `init` 用戶旅程問題。`upgrade` 補齊 `dev/RULE_PACKS.md` Kit routing rows 時保留用戶自訂 rows；如 routing table 表頭已被改動，工具改為 `conflict` 停手。`doctor` 明確說明自己只檢查、不修改，版本不齊時先建議 `upgrade --dry-run`。
- 發佈前驗收重點：`scripts/check-upgrade-safety.mjs` 新增三個 `RULE_PACKS.md` 回歸場景，覆蓋自訂 row 保留、同 pack path 自訂 row、表頭改動 conflict；prior-version chain 由 v0.3.4 tag 再升到 v0.3.5 current HEAD。
- npm 狀態：發佈後應驗證 npm latest 為 `0.3.5`；package fileCount 29（從 28 增加 1，加 `docs/whatsnew/v0.3.5.md`）。
- 🟡 發佈檢：v0.3.5 publish 後必須執行 GitHub Release、npm package metadata、fresh install、post-install `--help` / `init` / `doctor`、R-029.1 canonical phrase 與 chain-upgrade routing propagation 驗證。

## v0.3.4 發佈狀態

- 發佈版本：`0.3.4`。
- release notes：`CHANGELOG.md` 的 `v0.3.4` 段落 + `docs/whatsnew/v0.3.4.md`。
- 發佈內容：修補 v0.3.3 發佈後由真實用戶測試揭發的升級敘事錯誤。舊流程在 merge 前注入 `PROJECT_INDEX` template version，當 `PROJECT_INDEX` 同時需要結構合併時，merge 會把版本列覆蓋回舊值；本版改為 create / merge 完成後再注入。同步補上 metadata-only no-op guard，避免只有版本資料列過期時誤報「已經是最新版本」。migration report 新增 metadata section，記錄 `Agent Handoff Kit template version` 的更新軌跡。`scripts/check-upgrade-safety.mjs` 的 staleRoot 驗收口徑同步改為：template version metadata 屬維護者管理的模板資料，不屬 External Sources、Fact Base、Workspace Identity 等使用者內容；此口徑不削弱使用者內容保護。
- QC framework 修補：`scripts/check-release-readiness.mjs` 將 scenario 3 拆成 scenario 3a（metadata-only stale）與 scenario 3b（structurally stale via real v0.1.7 fixture）。scenario 3b 使用真實 `test-fixtures/v0.1.7/dev/PROJECT_INDEX.md`，不再只用目前版本 init 後手動改字串的合成狀態。Loop 1 code review 另抓到兩個高信心缺口：`scripts/check-upgrade-safety.mjs` 的 `chainSteps` 漏 v0.3.x 路徑，以及 `scripts/check-release-readiness.mjs` 的 scenario docblock 仍停在 3 個自動場景；兩者已修補。
- 發佈前驗收：本次 ship-prep 後 `npm run qa:release` 重新通過；Loop 1 修補後 `npm run qa:release` 與 `npm run qa:upgrade` 亦已重新通過。重點覆蓋 scenario 3a / 3b、scenario 6 doctor healthy、staleRoot R-031.3 v0.3.4 policy、v0.3.0 → v0.3.4 prior-version chain coverage，以及 package fileCount 28。
- npm 狀態：已 npm publish；npm latest 為 `0.3.4`；package fileCount 28（從 27 增加 1，加 `docs/whatsnew/v0.3.4.md`）。
- 🟡 發佈檢：v0.3.4 post-publish verification 已完成；GitHub Release、npm package metadata、fresh install、post-install `--help` / `init` / `doctor`、R-029.1 canonical phrase 與 chain-upgrade routing propagation 均已通過。`3009712` 屬 v0.3.4 之後的 Unreleased source change，尚未進入 npm 發佈檢範圍。

### Cross-mind evidence 9-trigger table（v0.3.4）

| Trigger condition | Required (yes/no) | Result (passed / iterated / blocked) | Follow-up (assertion ID / checklist item / accepted risk reason) |
|---|---|---|---|
| 1. 發佈說明使用「已驗證／已修復／可持續／sustainable」等強聲明 | yes | iterated | 發佈敘事使用「修補／通過／可發佈」等強口徑，已經 7 round Codex audit + sub-agent audit 交叉檢查；維護者側 audit trail 保留 prompt / response 原文，公開 repo 只保留本表摘要，避免把大型審查上下文納入發佈內容。 |
| 2. 同類 bug 連續兩版出現 | yes | iterated | v0.3.3 已修補 upgrade / doctor 敘事一致性，v0.3.4 再由真實用戶抓到同類 production gap；Round 1-2 將根因收斂為 inject-vs-merge ordering + metadata-only no-op guard；機器覆蓋落點為 `scripts/check-release-readiness.mjs` scenario 3a / 3b 與 `scripts/check-upgrade-safety.mjs` staleRoot policy assertion。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：`bin/agent-handoff-kit.mjs`；測試層：`scripts/check-release-readiness.mjs` + `scripts/check-upgrade-safety.mjs`；發佈敘事層：`CHANGELOG.md` + `docs/whatsnew/v0.3.4.md` + 本段。Round 7 實作審核 verdict: ship；維護者側 audit trail 保留實作審核原文。 |
| 4. 三個以上治理檔同步改動 | no — not required: v0.3.4 ship-prep 只更新一個公開驗收治理檔 `docs/qa/release-grade-qa.md`；先前 WORK 多治理檔更新屬 cross-AI governance integration，已另行審核 | not required | 接受風險原因：本 release 的必要治理落點是本文件的發佈狀態與九觸發表，不新增三個以上治理真源；相關 governance integration 已於維護者側 audit trail 覆核，公開 repo 不提交該大型上下文。 |
| 5. 公開可見發佈儀式 | yes | passed | v0.3.4 已完成 commit / tag / GitHub Release / npm publish；post-publish 發佈檢已完成。`3009712` 屬 v0.3.4 之後的 Unreleased source change，不改寫 v0.3.4 發佈儀式狀態；若要將其發佈到 npm，須另行走新 patch release 流程。 |
| 6. 存在人工語意判斷而無機器斷言 | yes | passed | Loop 1：`chainSteps` 補上 v0.3.0 / v0.3.1 / v0.3.2 / v0.3.3 / v0.3.4（v0.3.4 以 current HEAD pre-tag hop 執行），兩處 `simulateScenarioBranching` docblock 改為 5 個自動場景並移除已過期 delegation claim。Loop 2：刪除 stale final-hop comment、明確排除未提交 `outputs` 證據目錄、將本文件七場景表同步為 3a / 3b 與 5 個自動場景。Loop 3：第三輪 code review 抓到場景 4 表格門檻誤寫為 ≤ 15；已按 `scripts/check-release-readiness.mjs` scenario 4 機器斷言對齊為 ≤ 20，避免文件門檻低於實際驗收。Loop 4：逐列對照七場景表與 `simulateScenarioBranching()` 實際斷言，確認場景 1 / 3b / 4 / 6 與程式一致，場景 2 / 5 / 7 屬人工驗收列；修正場景 3a 由錯誤 no-op 敘事改為升級路徑 + metadata 更新 + doctor 不再提示 root 落後 CLI，並新增 `qa:release` 內建七場景表對齊檢查，防止同類表格漂移重演。重驗：`npm run qa:release` + `npm run qa:upgrade`。 |
| 7. 發佈後上一版由真實用戶抓 bug | yes | iterated | v0.3.3 發佈後由 Adam 真實 root 測試抓到 v0.1.7 template version stuck + doctor contradiction；本版以真實舊版 fixture 補測。WORK `dev/SESSION_HANDOFF.md` 保留 current baseline；公開驗收證據落點為 scenario 3b 的真實 `test-fixtures/v0.1.7/dev/PROJECT_INDEX.md`。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | 原 scenario 3 使用 current init + manual string edit，未覆蓋 merge path；本版保留 3a 作 metadata-only 邊界測試，新增 3b 使用真實 `test-fixtures/v0.1.7/dev/PROJECT_INDEX.md` 覆蓋 structurally stale path。機器斷言：`scripts/check-release-readiness.mjs` scenario 3a / 3b。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 四個產品聲明已對應到斷言或人工 checklist：inject-after-merge → scenario 3b；metadata-only no-op guard → scenario 3a；migration report extension → release narrative + non-blocking reviewer check；staleRoot policy → `scripts/check-upgrade-safety.mjs` staleRoot assertion。維護者側 ship-prep audit 保留 reviewer discussion；公開 repo 保留本摘要與斷言落點。 |

## v0.3.3 發佈狀態

- 發佈版本：`0.3.3`。
- release notes：`CHANGELOG.md` 的 `v0.3.3` 段落 + `docs/whatsnew/v0.3.3.md`。
- 發佈內容：修補 v0.3.2 用戶實測（Adam 跑 `npx ... upgrade` 喺 v0.1.3 root → CLI v0.3.2）即時揭發嘅兩個 user journey narrative coherence bug。(1) Upgrade 完成後 doctor 自相矛盾 —— 用戶剛跑完 upgrade，self-check doctor 立刻講「root 落後 CLI，可執行 upgrade」；root cause 係 v0.3.2 inject logic 只 cover fresh install scenario。(2) 跨多版本 upgrade 嘅 whatsnew range narrative misleading —— output 講「涵蓋 2 個版本嘅 release notes」未明文話跨度。產品層修補：`bin/agent-handoff-kit.mjs` `doInstallOrUpgrade` PROJECT_INDEX template version inject 條件由 `created.includes` 擴至 `command === "upgrade" || created.includes(...)`；`printWhatsnew` 加 deep range narrative（明文 print「跨度較大 + GitHub Release link」）。QC framework 修補：`scripts/check-release-readiness.mjs` 加 R-031.1 scenario 3 deep range fixture（v0.1.3 root → upgrade → assert template version inject + 無 contradicting hint + deep range narrative 命中）。治理層：`docs/REQUIREMENTS_CONVERGENCE.md` R-016 row 加註「user-owned 指 user content rows，唔包 template version metadata row」+ R-031 row 補 R-031.3 v0.3.3 narrative。
- 發佈前驗收：qa:release 全綠（既有 26+ assertions + R-031.1 scenario 1/3/4/6 simulation PASS 含新加 scenario 3 deep range + R-031.3 string assertions PASS）。
- npm 狀態：已 npm publish；npm latest 為 `0.3.3`；package fileCount 27（從 26 增加 1，加 `docs/whatsnew/v0.3.3.md`）。

### Plan-time discipline mandatory（R-031.3，v0.3.3 新加）

**Plan-time user-journey simulation mandatory item** —— 由 v0.3.3 起，任何涉及 user-facing 命令（init / upgrade / doctor / 未來新 sub-command）嘅 release verification，**plan 必明文 simulate 至少一個 deep version range upgrade**（譬如 root template version v0.1.x → 當前 CLI），並 verify：

1. Post-upgrade PROJECT_INDEX template version row 已 inject 為當前 CLI version
2. 自動跑嘅 self-check doctor 嘅 「項目狀態速覽」narrative 同上一步 upgrade banner coherent（唔出 contradicting hint）
3. 跨多版本嘅 whatsnew print 含明文 deep range narrative + GitHub Release link
4. Optional review phrase「I just upgraded」print

呢條紀律屬 framework critique L3 嘅第一步落地 —— 防 reactive default（用 fresh install / 細跨度 fixture 做 verification）重演揭發 cross-version journey gap。違反即視為 L3 critique recurrence。

**Cross-mind evidence sub-rule（v0.3.4 起新加，作為 R-031.3 plan-time discipline 嘅子規則）**

每 release plan 須對 stateless-cross-ai-audit skill 嘅 9 個 trigger conditions 逐一登記證據。**缺表、漏行、空欄、blocked 未處理 = release gate fail；不得進入 commit / tag / publish 或等效發佈步驟**。Skip 屬 explicit decision，必填「not required + reason」，唔可空白。

以下表格只是複製模板，不是任何版本的發佈證據。每個候選版本必須在自己的 `Cross-mind evidence 9-trigger table（vX.Y.Z）` 段落填寫完整表格；不可把本模板留空當作驗收。

| Trigger condition | Required (yes/no) | Result (passed / iterated / blocked) | Follow-up (assertion ID / checklist item / accepted risk reason) |
|---|---|---|---|
| 1. 發佈說明使用「已驗證／已修復／可持續／sustainable」等強聲明 | fill yes/no + reason | fill passed/iterated/blocked | fill assertion ID / checklist item / accepted risk reason |
| 2. 同類 bug 連續兩版出現 | fill yes/no + reason | fill passed/iterated/blocked | fill assertion ID / checklist item / accepted risk reason |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | fill yes/no + reason | fill passed/iterated/blocked | fill assertion ID / checklist item / accepted risk reason |
| 4. 三個以上治理檔同步改動 | fill yes/no + reason | fill passed/iterated/blocked | fill assertion ID / checklist item / accepted risk reason |
| 5. 公開可見發佈儀式 | fill yes/no + reason | fill passed/iterated/blocked | fill assertion ID / checklist item / accepted risk reason |
| 6. 存在人工語意判斷而無機器斷言 | fill yes/no + reason | fill passed/iterated/blocked | fill assertion ID / checklist item / accepted risk reason |
| 7. 發佈後上一版由真實用戶抓 bug | fill yes/no + reason | fill passed/iterated/blocked | fill assertion ID / checklist item / accepted risk reason |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | fill yes/no + reason | fill passed/iterated/blocked | fill assertion ID / checklist item / accepted risk reason |
| 9. 發佈聲明與測試斷言不是一對一映射 | fill yes/no + reason | fill passed/iterated/blocked | fill assertion ID / checklist item / accepted risk reason |

每 trigger 嘅 Result 必填以下三者之一：
- `passed` — cross-AI audit 已跑且 ship-ready
- `iterated` — cross-AI 揭發要 iterate；revised plan 已 incorporate 並重 audit
- `blocked` — cross-AI 揭發 design 性問題未解決；release blocked

Skip 嘅 record 必含具體 reason（譬如「Trigger 7 not required: 上一版冇用戶 catch bug」），唔接受空白或單字「N/A」。

證據追溯：cross-AI audit 嘅 prompt + response 必保留喺維護者側 `outputs` audit trail；除非 release plan 明確決定 versioned audit artifacts 屬公開交付物，公開 repo 不提交大型審查上下文。公開 Follow-up 欄應引用摘要、機器斷言落點、人工 checklist item 或 DECISION_LOG entry；不得引用未提交嘅 repository path。

呢個 sub-rule 屬 R-031.3 plan-time discipline 嘅 operational sub-item；違反同 R-031.3 違反同等視為 L3 critique recurrence，blocks release。

## v0.3.2 發佈狀態

- 發佈版本：`0.3.2`。
- release notes：`CHANGELOG.md` 的 `v0.3.2` 段落 + `docs/whatsnew/v0.3.2.md`（new structured whatsnew）。
- 發佈內容：Adam 對 v0.3.1 release 後做 user journey critique 觸發 —— 揭發「doctor 唔識自動做新版本檢查」嘅 awareness gap + framework 三層 systemic critique（QC state-based 唔係 journey-based / AI reactive responder 唔係 proactive anticipator / dev process 把 catch 當 single-data-point absorption）。本版本針對 init / upgrade / doctor 三個命令做 user-journey-driven UX 重設計：(1) init 加 mini-checklist 答「我裝啱咗嗎」；(2) doctor 加「項目狀態速覽」三句（三向 version 對比 + 距上次 closeout + 項目首次安裝距今）；(3) upgrade 加 inline whatsnew summary 直接 surface 本版同跨版本嘅 release notes；(4) fresh install 注入當前 CLI version 入 PROJECT_INDEX template metadata（修補由 v0.1.7 起 hardcoded 0.1.7 嘅 fact-error）。新檔 `docs/whatsnew/v<version>.md` 三段固定 schema（本版新加咗咩 / 對你已有檔案嘅影響 / 建議下一步），每次 release maintainer 必寫。
- 發佈前驗收：qa:release 全綠（既有 26+ assertions + R-031.1 三場景 simulation + 場景 4 upgrade no-op 行數 ≤ 20 sustained）。Doctor schema check 同 anchor check 未變仍全部通過。
- npm 狀態：已 npm publish；npm latest 為 `0.3.2`；package fileCount 26（從 24 增加 2，因加 `docs/whatsnew/v0.3.1.md` + `docs/whatsnew/v0.3.2.md`）。

## v0.3.1 發佈狀態

- 發佈版本：`0.3.1`。
- release notes：`CHANGELOG.md` 的 `v0.3.1` 段落。
- 發佈內容：第一個真實 v0.3.0 用戶 session 揭發 CLI 升級流程 messaging gap：升級完成印「✅ 安裝完成」+ 推送新手起步句、第二次升級（零改動）仍跑完整 ceremony、doctor 結尾叫人升級但 startup 已印 update notice。Root cause：R-026 CLI Output Contract sweep helper 屬 lexical layer，未 cover scenario-fit layer。v0.3.1 修補 `bin/agent-handoff-kit.mjs` —— `runInstall` 加 plan-time upgrade no-op detection（zero create / merge / conflict 即短路）+ `printInstallNextSteps` split 為 install / upgrade-substantive / upgrade-noop 三個 helper + `runDoctor` 結尾 next-step 唔再 unconditional 推送 upgrade。同步擴展 QC framework：`docs/qa/release-grade-qa.md` 加新治理 QA 缺口矩陣 dim「CLI 場景分流（scenario branching）一致性」+ 配套 CLI Scenario Branching Coverage Sweep（automated simulation 場景 1 / 3 / 4 / 6 first land），防同類 audit blind spot 重演。
- 發佈前驗收：qa:release 全綠（既有 26+ assertions + 新加場景 simulation assertions）。Doctor schema check 同 anchor check 未變仍全部通過。
- npm 狀態：已 npm publish；npm latest 為 `0.3.1`；package fileCount 維持 24（本次無新加檔案入 npm package）。

## v0.3.0 發佈狀態

- 發佈版本：`0.3.0`。
- release notes：`CHANGELOG.md` 的 `v0.3.0` 段落。
- 發佈內容：**v2 second major version bump**（v0.2.x → v0.3.0）。引入 first-class **Integration Governance Framework**（R-030）支持 Connectors + MCPs + Plugins + Skills 跨 session 治理 + 機密分離原則 + 多層持久化 source-of-truth architecture + cross-tool resilience。新加 `packs/integrations.md`（~400 行 10th rule pack）+ `runtime-core/PROJECT_INDEX.md` 加 `## Installed Integrations` H2 section（4 subsection + Source-of-truth Architecture sub-table + 機密分離 header）+ 既有 External Sources 表加 `via` column + AGENTS.core.md startup availability probe + RULE_PACKS routing 加新 row + SESSION_HANDOFF Durable Anchors 加 row 6 + packs/knowledge.md Rule 5 重寫 Connector-first（backward-compat preserved）+ packs/safety.md Rule 10 三層 differentiation + 新 Rule 12 credential leak prevention + packs/onboarding.md 加 Scenario F + 5 既有 Scenarios Step 1 micro-question + bin/agent-handoff-kit.mjs 加 `checkInstalledIntegrationsCredentialLeak()` doctor function（14 credential prefix grep）+ classifyExistingFile PROJECT_INDEX migration auto-append + 7 處 user-facing R-XXX leak normalize + 4 scripts 全部 update + guide.html Cases A/B/C narrative 重寫（Connector-primary + Terminal mock blocks version-agnostic + hero/Step 2 callout retire 內部 jargon 共用「兩種開工方式」anchor）+ README 加新「外部工具治理」section。
- 發佈前驗收：qa:release 全綠（既有 21 assertions + 5+ 新 v0.3.0 assertion = 26+）。Doctor 顯示 10 schema checks status passed + credential leak sweep ok + integrations pack structure check ok。Cross-callout wording grep「兩種開工方式」命中 hero + Case A Step 2 callout。內部 jargon ban grep 對 intro + guide 0 hits。credential prefix sweep 對 runtime-core 兩 template files 0 hits。
- npm 狀態：已 npm publish；npm latest 為 `0.3.0`；package fileCount 24（從 23 增加，因加 `packs/integrations.md`）。

### Installed Integrations Discipline Sweep（R-030）

對 `runtime-core/PROJECT_INDEX.md` template 嘅 `## Installed Integrations` section 驗證：
- 4 個 subsection heading 命中：Connectors / MCPs / Plugins / Skills
- Source-of-truth Architecture sub-table 命中
- 機密分離原則 header 命中
- 5 個 table header schema 命中
- External Sources 表 `via` column 命中
- assertIncludes 對 PROJECT_INDEX + AGENTS.core.md + SESSION_HANDOFF + RULE_PACKS + integrations pack + knowledge/safety/onboarding 全部新 anchor 命中

### Credential Leak Prevention Sweep（R-030）

對 `runtime-core/PROJECT_INDEX.md` + `runtime-core/SESSION_HANDOFF.md` template files 強制 grep 14 個 credential prefix patterns（`sk-` / `sk-ant-` / `ntn_` / `secret_` / `ya29.` / `1//` / `xox[abprs]-` / `ghp_` / `gho_` / `ghs_` / `github_pat_` / `sl.` / `AKIA` / `AIza`）。命中即 release 阻擋。Runtime 階段由 `bin/agent-handoff-kit.mjs` `checkInstalledIntegrationsCredentialLeak()` doctor function 對用戶嘅 `dev/PROJECT_INDEX.md` + `dev/SESSION_HANDOFF.md` + `dev/SESSION_LOG.md` 跑同樣 sweep；命中即 doctor `status: failed`。

### 內部 jargon ban（R-030）

對 user-facing HTML（`agent-handoff-kit-intro.html` + `agent-handoff-kit-guide.html`）強制 grep `v2 (的|嘅) advanced user path` 等已 retire 內部 jargon patterns。命中即 release 阻擋。

### Cross-callout wording consistency（R-030）

`agent-handoff-kit-guide.html` 嘅 hero callout + Case A Step 2 bridging callout 必共用同一套白話 anchor「兩種開工方式」。qa:release grep enforce 喺 guide.html 命中此 anchor，確認 cross-callout wording 一致防 silent drift。

## v0.2.3 發佈狀態

- 發佈版本：`0.2.3`。
- release notes：`CHANGELOG.md` 的 `v0.2.3` 段落。
- 發佈內容：Patch release 修補 `agent-handoff-kit-guide.html` 三類遺留缺口。**Fix 1**：Case C 4 個 pre block 採用破壞性 inline style（`background: var(--paper-2)` 淺色 + inherited `color: var(--paper)` 亦淺色）導致 light-on-light 文字完全 unreadable —— 移除全部 inline style 回歸預設 `.chat-bubble pre` CSS（黑底 paper 字）。**Fix 2**：Case C「決策日誌」展示嘅後端模型對比範例引用 2025 舊模型（Claude 3.5 Sonnet / GPT-4 Turbo / Gemini 1.5 Pro / 200k context）已脫節 2026-05 時點；WebSearch 確認 latest 為 Claude Sonnet 4.6（Feb 2026, 1M context）/ GPT-5.5（April 2026）/ Gemini 3.5 Pro（May 2026）；guide.html 7 處更新。**Fix 3（R-029.5）**：Cases A/B Step 2 對話框示範 advanced user direct path「Read AGENTS.md and follow it...」與第一螢 R-029 callout canonical phrase「I just installed agent-handoff-kit. Help me get started.」唔同；Adam catch「啲句點解唔一致」。採用 β 中度改動（Adam approved）：Case A Step 2 加「兩條入場路」bridging callout 15-20 行解釋新手嘅 onboarding trigger 句 vs 老手嘅直接句點解殊途同歸；Case B Step 2 加 reference sentence。完整保留 narrative authenticity（不改 user bubble 句式）。
- 發佈前驗收：qa:release 全綠（既有 21 assertion + 內置 cross-surface + internal-reference + book-language sweep 全部 0 命中）；guide.html 內置 internal reference forbidden patterns（R-XXX / closeout step N / strict mechanical）grep 0 hit；新加 bridging callout 沿用 v0.2.2 紀律全部用日常語言表達。
- npm 狀態：已 npm publish；npm latest 為 `0.2.3`；package fileCount 23（不變 — patch 屬 release artifact wording，唔加新 file）。

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
- 發佈後仍需驗證：GitHub Release、npm package metadata、`npx --yes @adamchanadam/agent-handoff-kit@latest --help`、`npx --yes @adamchanadam/agent-handoff-kit@latest doctor` 的實際可用性。

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
| R-029.1 (v0.2.1 critical patch) | （a）Fresh install v0.2.1+：CLI printInstallNextSteps 印出 canonical R-029 trigger phrase（「Work in <root>. I just installed agent-handoff-kit. Help me get started.」）；用戶貼上後 AI 必 trigger onboarding pack；（b）Upgrade v0.1.X → v0.2.1：`dev/RULE_PACKS.md` force-refresh 含 R-029 routing row；doctor schema check enforce「First-time user signals」+「dev/rules/onboarding.md」anchor；（c）Returning user upgrade v0.2.0 → v0.2.1：CLI prompt + routing table 自動同步至 v0.2.1 canonical state；（d）Advanced user 直接描述任務：保留 legacy prompt「Read AGENTS.md and follow it...」作 fallback option（CLI install output 印出 second-tier prompt + intro/guide 嘅 advanced disclaimer）；（e）本修補起，`dev/RULE_PACKS.md` 升級補齊 Kit routing rows 時必保留用戶自訂 rows。 | （f）CLI 跨 OS / locale 嘅 trigger phrase 字符 encoding：屬 OS-level concern，唔屬 R-029.1 scope。 |

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
- Doctor 失敗訊息：missing files / anchor / schema 等阻擋模式必須有對應中文下一步指示；prompt mirror drift 在普通 `doctor` 只應是警告，並說明便利副本會在 closeout 時重生。
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

- `onboarding` routing scenario：router 含「First-time user signals」+ pack 含 6 個 Scenario + transient pack wording。
- `first-time onboarding to first task` mixed scenario：phases `[onboarding] → [onboarding, coding] → [coding]` 順序合法 (轉折 onboarding → coding 並 unload onboarding)。

人工驗證（語意審閱必填項）：

- Onboarding pack 嘅 6 個 Scenario walk-through 每 step 含 AI sample wording，書面語紀律 enforce（紀律目標：用戶讀 AI sample 即明白意義，無需先讀任何文檔）。
- 6 個 Scenario 嘅 step 5 「ask user about confirm + 進入 work loop」明文 transition 至對應 regular pack（A → coding+writing；B → research+writing+knowledge；C → knowledge+safety；D → coding+safety；E → custom；F → integrations+knowledge+safety）。
- Cross-reference to guide.html 嘅 wording 明確「不需要先讀本指南」，避免用戶誤以為要 mandatory reading。
- Anti-pattern table 列 6 個明確 anti-pattern，每個含 「點解唔做」+「正確做法」對照。

## Cross-surface Wording Consistency Sweep（R-029.1，v0.2.1 起新加；v0.3.19 更新）

v0.2.0 release ceremony 嘅 critical QC gap：plan scope coverage matrix 嘅三層（content / script / source）唔 cover cross-surface wording alignment。R-029 嘅 canonical onboarding trigger phrase 跨 4 個 user-facing surface，但 v0.2.0 release 時 CLI source 仍係 legacy wording 而其他 surface 已 update —— silent disconnect 令 R-029 design intent 對 default user behavior 失效。

v0.3.19 起，發佈前須對以下 4 個 surface grep 短開工主入口、帶路徑 fallback、普通 web chat AI 不支援邊界、收工入口與歧義保護。意圖偵測規則只以 runtime `AGENTS.md` 為單一真源；current public surface 不得再把 `help me start` / `I just installed agent-handoff-kit` /「新手起步句」/ 舊長句 /「任何 AI 工具」/「貼一段提示」/「貼一段字」/「固定開工句」/「貼回提示」當作 standalone 入口，歷史 changelog 敘事除外：

```text
grep -c "Start Agent Handoff" bin/agent-handoff-kit.mjs README.md agent-handoff-kit-intro.html agent-handoff-kit-guide.html
grep -c "開工" bin/agent-handoff-kit.mjs README.md agent-handoff-kit-intro.html agent-handoff-kit-guide.html
grep -c "Read AGENTS.md first, then Start Agent Handoff" bin/agent-handoff-kit.mjs README.md agent-handoff-kit-intro.html agent-handoff-kit-guide.html
grep -c "普通 web chat AI" bin/agent-handoff-kit.mjs README.md agent-handoff-kit-intro.html agent-handoff-kit-guide.html
grep -c "Wrap up Agent Handoff" bin/agent-handoff-kit.mjs README.md agent-handoff-kit-intro.html agent-handoff-kit-guide.html
grep -c "收工" bin/agent-handoff-kit.mjs README.md agent-handoff-kit-intro.html agent-handoff-kit-guide.html
grep -c "某某開工" bin/agent-handoff-kit.mjs README.md agent-handoff-kit-intro.html agent-handoff-kit-guide.html
grep -c "某某收工" bin/agent-handoff-kit.mjs README.md agent-handoff-kit-intro.html agent-handoff-kit-guide.html
grep -n "help me start\\|I just installed agent-handoff-kit\\|新手起步句\\|Read AGENTS.md first. Then open START_NEXT_SESSION_PROMPT.txt\\|固定開工句\\|貼回提示\\|下一次任何 AI 工具\\|貼一段提示\\|貼一段字" README.md agent-handoff-kit-intro.html agent-handoff-kit-guide.html
```

由 `scripts/check-release-readiness.mjs` 嘅 `checkCrossSurfaceWordingConsistency()` helper 自動 enforce；違反即 throw error，release 阻擋。

額外 verification：

- post-install CLI output 必印出 bootstrap phrase 與 local-agent 支援邊界（由 `scripts/check-public-prototype.mjs` enforce）
- 初次安裝的 `START_NEXT_SESSION_PROMPT.txt` 必含 first-use onboarding signal；onboarding 不再依賴 surface prompt 直接寫 `I just installed...`
- qa:upgrade chain test final hop 嘅 `dev/RULE_PACKS.md` 必含 R-029 routing row（force-refresh 紀律驗證）

紀律邊界：

- Bootstrap phrase 屬 user-facing surface 嘅 local-agent startup entry point；其他 surface (e.g. CHANGELOG / DECISION_LOG / SESSION_LOG) 唔 enforce
- Legacy direct prompt（「Read AGENTS.md and follow it...」）不可再作主要 user-facing 開工句；如只在歷史 changelog / QA 敘事中出現，須明確屬歷史。
- guide.html Case A/B/C user bubbles 應使用固定 bootstrap 句；真正任務狀態由 `START_NEXT_SESSION_PROMPT.txt` 承載。

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
