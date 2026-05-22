# 變更紀錄

## v0.2.2 — 2026-05-22

狀態：正式發佈版本。此版本已建立 tag、GitHub Release，並已 npm publish。屬 v0.2.1 嘅 immediate follow-up patch，修補 internal reference IDs（v2-specific governance jargon）泄露於 user-facing surface 嘅 gap。Adam catch 揭發 R-026 forbidden vocabulary sweep 第三次 design gap —— scope expansion 仍不夠 comprehensive。

### Critical fix（R-029.4 — Internal reference ID leak on user-facing surfaces）

v0.2.0 + v0.2.1 release 落地時，user-facing surfaces（README + agent-handoff-kit-intro.html + agent-handoff-kit-guide.html）大量混入 v2-specific internal governance references：

- R-XXX explicit IDs（R-010 / R-026 / R-028 / R-029 等）—— 10+ 處
- 「closeout step 12」/「closeout step N」internal step numbering —— 多處
- 「strict mechanical」internal discipline jargon —— 多處

R-026 forbidden vocabulary sweep 嘅 v0.2.0 + v0.2.1 scope **只 cover 自貶 phrase**（譬如 v0.1.X 時期 retired 嘅特定 wording），**唔 cover internal governance jargon**。Adam observation 揭發呢個 silent gap。

v0.2.2 修補：

- **User-facing surface 全部 internal references normalize 為人話**：
  - `R-029 onboarding trigger` → 「新手引導 trigger」
  - `SESSION_LOG 接力角色紀律(R-010)` → 「SESSION_LOG 接力角色紀律（自動整理機制）」
  - `closeout step 12 (a)/(b) trigger` → 「AI 收工時嘅自動 maintain 條件 a/b」
  - `R-028 紀律` → 「AI 嘅自動 maintain 紀律」
  - `Split 紀律 strict mechanical` → 「Split 紀律屬硬性自動執行」
- **R-026 sweep scope 第三次擴展**：`scripts/check-release-readiness.mjs` 加 `internalReferenceForbidden` patterns（`/R-\d{3}/` + `/closeout step \d+/` + `/strict mechanical/i`），對 3 個 user-facing surface（README + intro + guide）強制 grep 0 命中。違反即 throw error，release 阻擋。永久 enforce internal jargon block。
- **CHANGELOG 嘅 historical entries 自然 reference R-XXX**（屬 release 敘事必要），由既有 anchor-bounded grep 排除 historical sections（v0.2.2 release notes 本身列 R-029.4 + earlier R-XXX，仍係 latest section，但 internal-reference sweep scope 排除 CHANGELOG）。

### Honest reflection（R-026 設計再次 demonstrate scope insufficient）

R-026 forbidden vocabulary sweep 三次 design gap 累積揭發：

1. **v0.1.7 落地時**：scope = CLI source only（`bin/agent-handoff-kit.mjs`）
2. **v0.2.0 expansion**：scope 擴展 release artifacts（README + onboarding HTML + CHANGELOG anchor-bounded）—— 但 only enforce 既有自貶 phrase patterns
3. **v0.2.1 cross-surface alignment**：加 canonical trigger phrase positive consistency check —— 但仍未 enforce internal reference ID block
4. **v0.2.2 internal reference block（本 patch）**：加 internal ID + step numbering + discipline jargon patterns enforcement

呢個 progressive scope expansion pattern 反映 v2 governance 設計嘅 systemic 教訓：**R-026 嘅 forbidden vocabulary 設計從一開始應該 separate concerns**：

- **自貶 vocabulary**（譬如 v0.1.X 時期 retired 嘅特定 wording）—— 屬語氣紀律
- **Internal reference ID**（R-XXX / closeout step N）—— 屬 surface 隔離紀律
- **Cross-surface canonical phrase**（R-029 trigger phrase）—— 屬一致性紀律

三者唔應該全部 ad-hoc 加入同一個 sweep helper —— 應該 separate 為 3 個 forbidden categories。但既有 design 已混入 `checkForbiddenVocabulary()` helper 入面，v0.2.2 沿用同樣 pattern（加 `internalReferenceForbidden` array），future refactor 可以重組為 categorical sweeps。

### Migration path（v0.2.0 / v0.2.1 → v0.2.2）

既有用戶 upgrade 無影響：

1. v0.2.2 嘅改動限於 release artifact wording + scripts QA sweep；唔影響 runtime behavior
2. `upgrade` action 對 v0.2.0 / v0.2.1 既有 install state 行為一致
3. RULE_PACKS.md routing table 已喺 v0.2.1 force-refresh，無需再做

## v0.2.1 — 2026-05-22

狀態：正式發佈版本。此版本已建立 tag、GitHub Release，並已 npm publish。屬 v0.2.0 嘅 critical patch release，修補 R-029 落地時嘅 cross-surface wording inconsistency + 升級流程 routing table 漏網 + QC 流程粗疏 gap。

### Critical fixes (R-029.1 + R-029.2 + R-029.3)

#### R-029.1 — Cross-surface wording inconsistency fix

v0.2.0 release 落地時，R-029 嘅 onboarding trigger phrase（「I just installed agent-handoff-kit. Help me get started.」）只出現於 README + onboarding HTML 嘅新加 R-029 callouts。**CLI 安裝後 print 出嚟嘅 next-step prompt 仍係 legacy v0.1.X wording**（「Read AGENTS.md and follow it. Before changing anything, tell me current state...」）—— 用戶跑完 npm install 見到嘅 default prompt **唔會 trigger R-029 onboarding pack**。R-029 design intent 對 default user behavior 失效。

v0.2.1 修補：

- `bin/agent-handoff-kit.mjs` `printInstallNextSteps` 更新 post-install prompt 至 canonical R-029 trigger：`Work in <root>. I just installed agent-handoff-kit. Help me get started.`（雙 signal trigger：「I just installed」+「Help me get started」，AI startup detection 必 fire）
- `bin/agent-handoff-kit.mjs` `printHelp` "After install" 段對齊 R-029 vision
- 既有 returning-user prompt 保留為 fallback option（喺 install output 第二段呈現）
- `README.md` 三步上手 step 2 對齊：first-time = R-029 trigger，returning = legacy prompt
- `agent-handoff-kit-intro.html` #howto Step 2 + #recap cell 1 對齊
- `agent-handoff-kit-guide.html` hero R-029 callout 加 disclaimer：「下方 Case A/B/C 屬已熟悉 v2 嘅 advanced user path（用戶直接描述任務）」明確 distinction

#### R-029.2 — Upgrade flow routing table propagation gap fix

v0.2.0 既有 upgrade 紀律對 `dev/RULE_PACKS.md` 沿用 default `skip "preserve existing file"` —— 即 v0.1.X 用戶 upgrade 至 v0.2.0 後，routing table **仍係舊版**，唔含 R-029 嘅「First-time user signals」routing row。Doctor PASS but routing inconsistent —— silent degradation。

v0.2.1 修補：

- `bin/agent-handoff-kit.mjs` `classifyExistingFile`：對 `dev/RULE_PACKS.md` 加 force-update merge logic。當 stale state (targetText 唔含「First-time user signals」) detected，trigger `action: "merge"` 用 latest source 覆寫。
- Architectural reclassification：`dev/RULE_PACKS.md` 由 user customization target 重新歸類為 **maintainer-owned routing table**（同 AGENTS.md managed core block 同類紀律）—— 用戶 customization 應歸入 pack 自身（packs/*.md），唔屬 routing table。
- `bin/agent-handoff-kit.mjs` schemaChecks for `dev/RULE_PACKS.md` 加 strict anchor `First-time user signals` + `dev/rules/onboarding.md` —— enforce v0.2.x routing 紀律。
- `scripts/check-upgrade-safety.mjs` chain test final hop 加 assertion：upgrade 完成後 `dev/RULE_PACKS.md` 必含 R-029 routing row。

#### R-029.3 — QC 流程 process gap fix

v0.2.0 release ceremony 嘅 QC 流程**漏咗幾個 dimension**：

- Plan scope coverage matrix 嘅三層（content / script / source）未 cover cross-surface wording alignment（第四 dim）
- qa:upgrade chain test 只驗 doctor PASS，唔驗 routing 紀律 propagation
- Doctor schema check 對 routing table 唔 strict
- 🟡 發佈檢 6 項唔含 cross-surface wording verification

v0.2.1 修補 QC process：

- `scripts/check-release-readiness.mjs` 加 `checkCrossSurfaceWordingConsistency()` helper —— 對 4 個 surface（CLI source + README + intro.html + guide.html）grep canonical R-029 trigger phrase 一致
- `scripts/check-public-prototype.mjs` 加 post-install CLI output 含 R-029 trigger phrase assertion
- `scripts/check-upgrade-safety.mjs` chain test 加 RULE_PACKS.md routing row 強制 verification
- `docs/qa/release-grade-qa.md` 治理 QA 缺口矩陣加新 dim「Cross-surface wording alignment」
- `docs/qa/release-grade-qa.md` 加 Cross-surface Wording Consistency Sweep section
- 🟡 發佈檢由 6 項擴展為 7 項（第 7 項為 cross-surface wording consistency）
- 補丁前置狀態枚舉加 R-029.1 row（覆蓋 first-time install / upgrade from v0.1.X / advanced returning user 三態）

### Honest reflection

v0.2.0 release 嘅 wording disconnect 屬 critical user-facing 缺陷 —— R-029 design intent（「用戶安裝後講『help me start』即可由 AI 主動帶」）對 default user behavior 失效，因為 CLI 印嘅 next-step prompt 仍係 legacy wording。v0.2.1 patch 雖然 close 主要 surface inconsistency，但根本問題在 QC process 漏咗 cross-surface alignment 嘅 verification dimension。v0.2.1 同時建立 long-term QC 紀律改善：(a) Plan scope coverage matrix 加第四 dim；(b) qa:upgrade chain test 強制 routing table propagation；(c) 🟡 發佈檢加 cross-surface wording 強制 verification；(d) RULE_PACKS.md 重新歸類為 routing table (maintainer-owned)。

## v0.2.0 — 2026-05-22

狀態：正式發佈版本。此版本已建立 tag、GitHub Release，並已 npm publish。屬 v2 嘅第一個 major version bump（v0.1.8 → v0.2.0），反映 **R-028 用戶項目治理擴展 + R-029 新手 onboarding AI driven walk-through** 二合一 architectural improvement。

### Major change

#### R-028 用戶項目治理擴展（長期 narrative archival）

- 新加 `runtime-core/PROJECT_DECISIONS.md` template 至 npm package，安裝後落 `dev/PROJECT_DECISIONS.md`。本檔保存項目嘅長期演進 narrative（任務需求演進 / 設計決策 rationale / 架構層判斷取捨 / 累積式學習觀察），屬 warm 資料層 —— AI 開工**不需要讀**本檔，遇到「之前為何這樣做」時 AI 自己會搵。新手用戶**完全不需要打開、不需要記 schema、不需要手動寫** —— 一切由 AI 自律執行。
- Schema 含 4 個固定 H2 section：Evolution Timeline / Decisions Archive / Architecture Choices / Insights & Learnings，由 `bin/agent-handoff-kit.mjs` `requiredAnchors` + `schemaChecks` 強制 enforce。

#### R-029 新手 onboarding AI driven walk-through（day-1 onboarding UX 改善）

- **核心 design**：新加 `packs/onboarding.md` rule pack（含 5 個 Application Scenario A-E × 5-step walk-through pattern + AI sample wording per step + Cross-reference to guide.html + Tone Discipline + Anti-pattern table）。當用戶第一次使用 Agent Handoff Kit、message 含 onboarding signal keyword 或屬 fresh installation context 時，AI 主動 load 本 pack，offer Scenario A-E 選擇，再用 5-step pattern（確認 context / 解釋 v2 fit / ask task scope / suggest minimum viable / confirm + transition）帶用戶做第一個任務。
- **5 個 Application Scenarios**：A 寫 / 改代碼項目 / B 整理研究資料 / 寫報告 / C 整理電腦檔案 / Notion / Drive 知識庫 / D 學寫代碼（技術新手）/ E 其他（用戶自定義）。Scenarios A/B/C cross-reference guide.html 嘅 Case A/B/C，但用戶**不需要先讀** guide —— AI 主動帶 walk-through。
- **解決嘅 critical UX gap**：v2 release 之前嘅 user journey 入面，用戶安裝後仍要自己 figure out「點用 v2」「邊個工作模式對應自己情景」「點描述任務」。R-029 之後，用戶只需講「help me start」「教我用」「我啱啱安裝」之類 trigger，AI 即主動引導 + offer scenarios + walk through 5 step。

#### v0.2.0 紀律強化

- npm package files count 由 21 升至 23（PROJECT_DECISIONS 加 1 + onboarding pack 加 1）；用戶項目 dev/*.md top-level 數量由 5 升至 6（加 PROJECT_DECISIONS）；用戶項目 `dev/*.md` + `docs/*.md` top-level 上限紀律封 10（未來再加新 file 必 trigger major version bump + R-005 verdict「健康」或「緊張 / 合併」）。
- 用戶項目 rule packs 由 8 個（safety / coding / writing / research / agent-governance / release / knowledge / communication）升至 9 個（加 onboarding）。

### 已改善（R-028 + R-029）

#### Source layer

- `runtime-core/AGENTS.core.md` 加 closeout step 12 紀律（R-028）：每次收工 AI 自動執行 R-028 4 個 trigger 條件 — (a) Decisions split / (b) Evolution append / (c) Architecture append / (d) Insights append。AI smart-detect 短期 vs 長期項目 signal（session count / active objective shifting / decisions list size / user retrospective questions）以調整 proactiveness。
- `runtime-core/AGENTS.core.md` `## 1. Startup Reads` 加 first-time-user signal detection 紀律（R-029）：用戶首段 message 含 onboarding signal keyword 或 fresh installation context 時，AI 主動 load `dev/rules/onboarding.md` proactively，offer Scenario A-E selection 而非立即 dive into task。
- `runtime-core/RULE_PACKS.md` 加 first-time signal routing row 喺 table 最頂位置（R-029）。
- `bin/agent-handoff-kit.mjs` `mappings` array 加 `runtime-core/PROJECT_DECISIONS.md` → `dev/PROJECT_DECISIONS.md` + `packs/onboarding.md` → `dev/rules/onboarding.md`；`requiredAnchors` + `schemaChecks` 加 PROJECT_DECISIONS + onboarding rules / groups；doctor 完成輸出嘅 schema checks count 由 7 升至 9。
- `packs/agent-governance.md` 加 Rule 8 + Check item 6 做 R-028 reinforcement wording。
- 新加 `packs/onboarding.md` rule pack（~400 line，含 7 H2 section + 5 Scenario × 5 step + Anti-pattern table）（R-029）。

#### Scripts

- `scripts/check-release-readiness.mjs` 加 PROJECT_DECISIONS + onboarding pack schema check assertion；加 `checkForbiddenVocabulary()` helper 對 README + onboarding HTML + `checkForbiddenVocabularyInChangelogLatestSection()` 對 CHANGELOG latest section（R-026 scope 擴展嘅 anchor-bounded grep strategy）；加 `checkBookLanguage()` 對 onboarding HTML（書面語紀律 enforcement，廣東口語字符 0 命中）。
- `scripts/check-public-prototype.mjs` + `scripts/check-upgrade-safety.mjs` 加 `dev/PROJECT_DECISIONS.md` + `dev/rules/onboarding.md` existsSync assertion 對 fresh install + upgrade scenario。Total files 21 → 23。
- `scripts/check-pack-scenarios.mjs` 加 onboarding routing scenario（含 5 個 Scenario + transient pack wording + Anti-pattern 等 snippets）+ first-time onboarding to first task mixed scenario（phases `[onboarding] → [onboarding, coding] → [coding]`）。

#### QA docs

- `docs/qa/release-grade-qa.md` 加 5 個新 row（PROJECT_DECISIONS 結構驗收 / Release Artifact Vocabulary Sweep / Onboarding HTML 書面語紀律 / Project Decisions discipline / **Onboarding Pack 結構驗收 + Onboarding UX discipline (R-029)**）入「驗收分層」+「治理 QA 缺口矩陣」；「CLI Output Contract Sweep」section rename 為「Release Artifact Vocabulary Sweep」（v0.2.0 起 scope 擴展）+ 加新 3 個 Sweep section（Onboarding HTML Book-language Discipline + Project Decisions Discipline + **Onboarding Pack Discipline (R-029)**）；補丁前置狀態枚舉加 R-028 + R-029 row；prepend v0.2.0 發佈狀態段。

#### User-facing surface

- `README.md` first-screen 加新 R-029 callout：「第一次用？你不需要先讀本 README 或任何文檔。安裝完成後在 AI 對話中講一句 `Work in <你的資料夾>. I just installed agent-handoff-kit. Help me get started.` AI 會自動引導你選擇情景，一步一步帶你做第一個任務。」+ 加新 H2 section「項目決策日誌」說明 PROJECT_DECISIONS.md 嘅職責同分工 + `dev/rules/*.md` row 補 onboarding pack mention。
- `agent-handoff-kit-intro.html` 加 `#tiers` section「分檔有層次」（Hot / Warm / Cold 三格 visual，R-028）+ #howto section 之後加 first-time callout（R-029）。
- `agent-handoff-kit-guide.html` 加 Case C「長期項目演進」（4-phase 時間軸 narrative — Day 1 / Day 30 / Day 60 / Day 90，R-028）+ hero 之後加 first-time callout（R-029）。

### R-026 scope 擴展

- R-026「CLI Output Contract」嘅 forbidden vocabulary 紀律 enforce scope 由原 CLI source（`bin/agent-handoff-kit.mjs`）擴展至**對外 release artifacts**（公開倉庫 `README.md` + GitHub Pages onboarding HTML + `CHANGELOG.md` anchor-bounded latest section）。內部 governance docs（`dev/SESSION_LOG.md` / `dev/SESSION_HANDOFF.md` / `docs/DECISION_LOG.md`）不受 R-026 scope 限制。
- CHANGELOG 嘅 historical sections 因含 v0.1.4 historical mention 屬不可改 historical fact —— anchor-bounded grep strategy（限「## v」heading 之間嘅 latest section）避免 false positive。

### Onboarding HTML 書面語紀律 enforcement（v0.2.0 起新加）

- 對外 onboarding HTML（intro + guide）必為繁體中文書面語，廣東口語字符（嘅 / 咁 / 喺 / 揀 / 唔 / 乜 / 啱 / 嚟 / 咗 / 嗰）grep 命中數必為 0。
- 既有 3-5 處口語混入（intro `#combo` section + guide outro section 嘅 Adam-AI-Instructions cross-recommendation 段）已 normalize 為書面語。
- `scripts/check-release-readiness.mjs` `checkBookLanguage()` helper 自動驗，違反即 throw error，release 阻擋。

### Migration path（v0.1.X → v0.2.0）

既有用戶升級時：

1. `upgrade` action 偵測 `dev/PROJECT_DECISIONS.md` 不存在 → 建立 empty template（含檔頭 onboarding tone + 4 個 H2 section heading）
2. 已有 `dev/PROJECT_DECISIONS.md` → preserve（用戶手動加過嘅內容唔覆寫）
3. AI 由 next session 開始按 closeout step 12 紀律自動 maintain
4. 歷史 narrative 留喺 SESSION_LOG 嘅 archive 中，不 retro-fill

## v0.1.8 — 2026-05-22

狀態：正式發佈版本。此版本已建立 tag、GitHub Release，並已 npm publish。

### 已改善

- 釋出 R-010 SESSION_LOG 接力角色紀律入 npm package。`runtime-core/AGENTS.core.md` 加 closeout step 11，明文化「每次收工自動執行 N 規則推進」mandatory step：N=1-3 留 full 做 safety buffer；N=4-10 已被 `SESSION_HANDOFF.md` / R 表 / `DECISION_LOG.md` / `PROJECT_INDEX.md` 吸收嘅降短索引；N=11+ archive 至 `dev/SESSION_LOG_archive/archive_<batch>_<low_date>_to_<high_date>.md`，主檔末尾留 archive index 段做 trace-back 入口。新 AI session 接力只需讀 `AGENTS.md` + `SESSION_HANDOFF.md` + `PROJECT_INDEX.md` + 相關 R 表 + `DECISION_LOG.md` 即可，無需讀 `SESSION_LOG.md`。
- `runtime-core/SESSION_LOG.md` template 頂部加 head blockquote，講「本檔屬 trace-back / audit trail 冷資料層，唔承擔接力責任」，install 後用戶即見。
- `bin/agent-handoff-kit.mjs` 加 `assessSessionLogDiscipline()` 函數，doctor 跑此函數做 warn-only safety net：H2 entry ≥ 11 warn / ≥ 25 warn (severe) / 主檔 line ≥ 1500 warn。Doctor exit 不變 0，mode 永遠 healthy；enforce 主要靠 AI closeout flow 自律執行 N 規則。
- `scripts/check-release-readiness.mjs` 加 grep + doctor stdout assertions 確保 R-010 wording 同 doctor `SESSION_LOG discipline (R-010): ok` line 一致。
- `docs/qa/release-grade-qa.md` 加 SESSION_LOG handoff-role discipline sweep section + 治理 QA 缺口矩陣 +1 維度。
- 公開介紹頁 `agent-handoff-kit-intro.html` + 實操指南頁 `agent-handoff-kit-guide.html` + `README.md` 同步 v0.1.8 + R-010 紀律描述（指南頁 Case A Step 06「Kit 內置邏輯」box 加第 5 條治理段；`README.md` `dev/SESSION_LOG.md` row description 補 archive 機制）。

## v0.1.7 — 2026-05-20

狀態：正式發佈版本。此版本已建立 tag、GitHub Release，並已 npm publish。

### 已修正

- 修正 `upgrade` 漏網嘅夾心 dup core 案：用戶之前用舊版 `upgrade` 加咗 managed-core 標記，但同一檔仍夾住未標記嘅舊核心。舊版升級邏輯一見 managed marker 就 skip；此版起，會用單一 `assessAgentsMdHealth()` 函數做 `AGENTS.md` 健康判斷唯一真源（三態 `clean` / `needs-merge` / `conflict`），偵測到夾心狀態即時 merge 替換 stale fragment。`doctor` 嘅唯一核心檢查、`upgrade` 嘅 anchor early-skip 路徑同 `findUnmarkedCoreRange` 三處散邏輯全部收歸此函數。
- `upgrade` 完成後自動跑 `doctor` self-check。如 self-check 失敗即 exit 1 + 中文下一步指示；不會默默宣稱 upgrade 完成。

### 已改善

- CLI 輸出按新 Output Contract 重寫：`init` / `upgrade` / `doctor` 完成訊息必含四項（版本、模式、剛做咗乜、下一步）；`help` 加版本／模式／下一步三項。內部 action 名稱（`create` / `merge` / `skip` / `conflict` / `status`）保留唔變，避免破壞 QA 同 migration report 引用。新訊息禁忌用語清單明文，移除「人話解讀」等自貶字眼。
- `runtime-core/AGENTS.core.md` 新增 `## 2.1 Upgrade Done Contract` 段做 upgrade 完成條件唯一真源（clean health + doctor passed + migration report 完整）。
- `scripts/check-upgrade-safety.mjs` 加 R-024 sandwich dup core 負面測試 + 3 個 real-fixture single-hop 場景（v0.1.4 / v0.1.5 / v0.1.6）+ 1 個 real sandwich case + 1 個 chainUpgradeScenario（用 `git worktree add --detach <tag>` 模擬 v0.1.4 init → v0.1.5 upgrade → v0.1.6 upgrade 嘅真實用戶升級鏈，每跳用對應版本 CLI 跑該版本 doctor PASS；最終 hop HEAD CLI self-check 通過）。
- 新 `scripts/generate-upgrade-fixtures.mjs`（透過 `npm run qa:fixtures` 觸發）：用 git worktree 機制喺各 tag detached HEAD 跑該版本 CLI 嘅 init，生成 `test-fixtures/v0.1.4`、`v0.1.5`、`v0.1.6` 真實產物（每組 AGENTS.md + dev/PROJECT_INDEX.md）。`test-fixtures/` 唔入 npm package（whitelist 未變），只屬原始碼倉庫資產。
- `docs/qa/release-grade-qa.md` 加 4 個新 section：QA Fixture 真實性紀律、跨版本鏈式升級驗收、補丁前置狀態枚舉（每個 R-XXX 補丁必填覆蓋／唔覆蓋枚舉）、CLI Output Contract Sweep；治理 QA 缺口矩陣加 3 維度（升級路徑覆蓋／補丁前置狀態枚舉／CLI Output Contract 一致性）。

### 規矩演化（historical pointers）

- R-013（安裝後新手指示）、R-017（emoji UX 與開工 prompt 精簡）、R-021（CLI 回傳訊息新手化）三條需求已由 R-026 「CLI Output Contract」統一取代。R-013 / R-017 / R-021 嘅已發佈內容（v0.1.1 ~ v0.1.4）保留作歷史；未來 CLI 文案改動只入 R-026，唔開新平行 R-XXX。
- `staleCoreFixture()` 合成函數加 R-025 deprecation comment 限 schema-boundary use；production-state preconditions 一律改用 `test-fixtures/<version>/` 真實產物。

## v0.1.6 — 2026-05-20

狀態：正式發佈版本。此版本已建立 tag、GitHub Release，並已 npm publish。

### 已修正

- 修正 `upgrade` 處理舊版 `AGENTS.md` 的合併方式。舊版 Agent Handoff Kit core 若未帶 managed-core 標記，現在會被目前核心替換，不再把新核心附加到舊核心下方，避免同一檔案出現兩個 `# Agent Handoff Kit Core Runtime` 與互相矛盾的收尾步驟；核心前後的使用者本地規則會保留。
- `doctor` 與 `npm run qa:upgrade` 增加雙核心負面檢查；舊版 core 升級後必須只剩一個核心標題，否則驗收失敗。

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
