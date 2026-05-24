# 變更紀錄

## v0.3.9 — 2026-05-24

狀態：正式發佈版本。本版本修補 v0.3.8 發佈後在真實項目 `AI_Public_Squares` 驗收時揭發的 lifecycle 判斷誤判。

### 本版對用戶有甚麼價值

- 舊項目交接文件若已明確寫出「已解決」，但同一句仍提到仍待處理的下一步，`doctor` 不應再誤判為未完成。
- `upgrade` 與 `doctor` 的分工維持不變：Kit 檔案更新由 `upgrade` 處理；交接狀態是否乾淨由 `doctor` 指出。
- 真實項目驗收暴露的詞彙誤判，已轉成自動回歸測試，日後不靠記憶防止重犯。

### Changed

- `doctor` 的 lifecycle 判斷先辨認明確確認句，再判斷未完成佔位語，避免 `yes — ... pending ...` 這類合理句子被誤殺。
- `scripts/check-release-readiness.mjs` 加入「明確 yes，但後文含 pending follow-up」的回歸案例。
- package fileCount 32 → 33：新增 `docs/whatsnew/v0.3.9.md`。

### Migration path（v0.3.8 → v0.3.9，backward-compat preserved）

- 既有項目不用重裝；照常執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --yes`。
- 若 `doctor` 提示交接狀態未完成，應先請 AI 修 handoff，不要用重裝覆蓋用戶內容。

## v0.3.8 — 2026-05-24

狀態：正式發佈版本。本版本修補 v0.3.7 真實升級測試揭發的升級與檢查訊息矛盾：`upgrade` 可以判斷檔案已是最新版，但 `doctor` 隨後因交接狀態未完成而失敗。

- `upgrade` 在零改動短路時會檢查交接生命週期欄位；如 handoff 已有實質內容但欄位仍待核對，不再說「繼續日常使用即可」，改為提示先做 AI closeout 核對。
- `doctor` 不再用任意 AI 正文詞語硬猜生命週期矛盾；可機器判斷的範圍收斂到 Kit 控制的結構標記與狀態欄位，避免把 `@adamchanadam`、`pending` 等一般文字誤判為已完成事項回流。
- 發佈級 QA 新增 scenario 4b，覆蓋「已最新版、無檔案可合併，但 handoff 欄位仍需 closeout 核對」的通用舊項目旅程；真實項目只作證據，不作硬編碼特例。

## v0.3.7 — 2026-05-24

狀態：正式發佈版本。本版本回應舊項目真實測試揭發的 `npx doctor` 認知落差：資料夾已有 Kit 文件，並不代表本機已有可直接執行的 npm 工具。裸寫 `npx ... doctor` 時，npm 可能先詢問是否下載 package，容易令人誤以為 `doctor` 正在安裝或修改項目。

### 用戶可見修補

- README、CLI help、新手介紹頁與操作指南的示範命令統一改為 `npx --yes @adamchanadam/agent-handoff-kit@latest ...`。
- README 明確分開兩層「安裝」：項目內 Kit 文件，以及 npm 用來執行 `init` / `upgrade` / `doctor` 的 CLI 工具。
- `doctor` 的說明再次表明自己只檢查，不建立、不安裝、不修改項目文件。

### QC framework 修補

- `scripts/check-release-readiness.mjs` 新增 `npx` 冷啟動 UX 守門，檢查 README、CLI help、新手介紹頁與操作指南都使用正式 `npx --yes ...@latest` 路徑。
- `docs/qa/release-grade-qa.md` 補上 `Npx Cold-start UX Sweep` 與舊項目 `doctor` 場景。
- package fileCount 30 → 31：新增 `docs/whatsnew/v0.3.7.md`。

### Migration path（v0.3.6 → v0.3.7，backward-compat preserved）

- 不新增使用者專案模板檔案；不改動既有 handoff 結構。
- 舊項目可先使用 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run` 預覽，再決定是否升級。
- `doctor` 仍只檢查，不會安裝或修改項目文件。

## v0.3.6 — 2026-05-24

狀態：正式發佈版本。此版本已建立 tag、GitHub Release，並已 npm publish。本版本修補 v0.3.5 後續 dogfood 發現的交接狀態一致性缺口：上一輪已完成並驗證的事項，不能在同一份 handoff 的下一步、風險或開工訊息中又被當成未解待辦。

### 產品層修補

- **`doctor` 新增 handoff lifecycle consistency 檢查**：比對 `Completed This Session`、`Validation / QC`、`Next Priorities`、`Risks / Blockers`、`Next Session Opening Message`。如已完成或已驗證的事項又被列為未解調查、待辦或下一次開工必做項，且沒有明確標成 monitor-only、follow-up scope、blocked 或 reopened，`doctor` 會失敗。
- **`SESSION_HANDOFF` 模板新增生命週期欄位**：`State Reconciliation Check` 加入 `Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified`，closeout 時必須填寫。
- **closeout 規則補上產品級防線**：`AGENTS.md` runtime core 明確要求 closeout 前檢查完成事項是否被錯誤帶入下一輪。

### QC framework 修補

- **發佈級 QA 加反例**：模擬 `doctor` / `upgrade` 已在完成與驗收段落關閉，但下一步又要求下一輪重新調查，確認 reconciliation check 不會誤判通過。
- **package fileCount 29 → 30**：新增 `docs/whatsnew/v0.3.6.md`。

### Migration path（v0.3.5 → v0.3.6，backward-compat preserved）

- 不新增使用者專案模板檔案；只補 `dev/SESSION_HANDOFF.md` 內的狀態對賬欄位與 runtime closeout 規則。
- 既有 handoff 若沒有完成／待辦矛盾，升級後 `doctor` 應通過。
- 既有 handoff 若存在「已完成但仍被列為未解」的矛盾，需先修正 handoff 或明確改成 monitor-only / follow-up scope / blocked / reopened。

## v0.3.5 — 2026-05-24

狀態：正式發佈版本。本版本修補 v0.3.4 後續全面治理審計揭發的 `doctor` / `upgrade` / `init` 用戶旅程問題，重點是避免升級時覆寫用戶已改過的 `dev/RULE_PACKS.md`，並令 `doctor` 清楚表明自己只檢查、不修改。

- `upgrade` 補齊 `dev/RULE_PACKS.md` 的 Kit routing rows 時不再整份覆寫檔案，保留用戶自訂 rows；若 routing table 表頭已被改動、工具無法安全合併，改為 `conflict` 停手。
- `doctor` 明確說明自己只檢查不修改；版本不齊時先建議 `upgrade --dry-run`，並解釋 `--dry-run` 只預覽、不寫入。
- `init` / `upgrade` / `doctor` 的使用者可見輸出改為更清楚的書面中文，讓非技術新手更容易分清 Terminal 檢查與 AI 對話下一步。
- `scripts/check-upgrade-safety.mjs` 新增 `RULE_PACKS.md` 自訂 row 保留、同 pack path 自訂 row、表頭改動 conflict 三個回歸場景。
- `scripts/check-upgrade-safety.mjs` 的 prior-version chain 由 v0.3.4 tag 再升到目前版本，確保 v0.3.4 使用者升級到 v0.3.5 的路徑也被自動驗收。

### Migration path（v0.3.4 → v0.3.5，backward-compat preserved）

- 不新增使用者專案模板檔案；既有使用者內容保持不變。
- 升級後可觀察變化：`dev/RULE_PACKS.md` 只補 Kit 管理的 routing rows；用戶自訂 rows 會保留；表頭如被改到工具無法安全合併，升級會停手回報衝突。
- `doctor` 不會自動升級或修改檔案；只會提示先用 `upgrade --dry-run` 預覽。
- fileCount 28 → 29（新增 `docs/whatsnew/v0.3.5.md`）。

## v0.3.4 — 2026-05-23

狀態：正式發佈版本。本版本修補 v0.3.3 發佈後由真實用戶測試揭發的升級敘事錯誤：專案由舊版本升級後，`dev/PROJECT_INDEX.md` 的 template version metadata 仍可能停留在舊版本，導致 `doctor` 在剛升級完成後又提示 root 落後 CLI。

### 產品層修補

- **`PROJECT_INDEX` template version 注入順序改為合併之後執行**：舊流程先更新版本列，再執行合併；若 `PROJECT_INDEX` 本身也需要合併，合併結果會把剛更新的版本列覆蓋回舊值。本版改為所有 create / merge 動作完成後，再重讀 `PROJECT_INDEX` 並更新版本列，確保最終落地狀態與 CLI 版本一致。
- **metadata-only no-op guard**：升級前會先檢查 `PROJECT_INDEX` 的 template version metadata 是否過期。若只有這一列過期，即使 create / merge / conflict 數量全為 0，也不會走「已經是最新版本」短路訊息，而會完成版本列更新與自動 self-check。
- **migration report 新增 metadata section**：升級紀錄現在會列出 `dev/PROJECT_INDEX.md` 的 `Agent Handoff Kit template version` 是否由舊值更新到目前版本，避免日後追溯時只看到 create / merge 數字而看不到 metadata 變更。
- **staleRoot 驗收口徑重寫**：`PROJECT_INDEX` 的 template version metadata 屬維護者管理的模板資料，不屬使用者內容。這一點與 R-016 保護 External Sources、Fact Base、Workspace Identity 等使用者資料列並不衝突。

### QC framework 修補

- **scenario 3 拆成 3a / 3b**：scenario 3a 覆蓋「結構已最新、只有 metadata 過期」的短路防線；scenario 3b 使用真實 `test-fixtures/v0.1.7/dev/PROJECT_INDEX.md` 覆蓋「結構過期、需要合併」的注入順序防線。
- **fixture 真實性補強**：v0.3.3 的測試曾用「目前版本 init 後再手動改字串」製造舊版本狀態，結果沒有覆蓋真實舊版 `PROJECT_INDEX` 合併路徑。本版改用真實 v0.1.7 fixture 驗證結構過期場景。
- **prior-version chain coverage 補齊**：`qa:upgrade` 的鏈式升級路徑補上 v0.3.0 / v0.3.1 / v0.3.2 / v0.3.3 / v0.3.4，避免 v0.3.x 使用者升級到 v0.3.4 的路徑停留在人工信念而無自動驗收。
- **Cross-mind evidence 9-trigger table 補齊**：發佈前驗收文件新增 v0.3.4 狀態段，逐列登記九個跨心智審核觸發條件、是否適用、審核結果與證據來源。

### Migration path（v0.3.3 → v0.3.4，backward-compat preserved）

- 不新增使用者專案模板檔案；既有使用者內容保持不變。
- 升級後可觀察變化：`dev/PROJECT_INDEX.md` 的 template version metadata 更新為目前 CLI 版本；migration report 會顯示 metadata 更新紀錄；`doctor` 不應再於升級完成後提示 root 落後 CLI。
- fileCount 27 → 28（新增 `docs/whatsnew/v0.3.4.md`）。

---

## v0.3.3 — 2026-05-23

狀態：正式發佈版本。由 Adam 喺真實用戶 root 跑 `npx ... upgrade`（root template version v0.1.3 → CLI v0.3.2）即時揭發兩個 user journey narrative coherence bug：

1. **Upgrade 完成後 doctor 自相矛盾**：用戶剛跑完 upgrade、見到「✅ 升級完成」banner，下一秒 self-check doctor 嘅「項目狀態速覽」立刻講「root v0.1.3 落後 CLI v0.3.2，可執行 upgrade」。兩個 message 直接矛盾。Root cause：v0.3.2 嘅 PROJECT_INDEX template version inject logic 只 cover fresh install scenario，upgrade 場景冇 trigger。
2. **跨多版本 upgrade 嘅 whatsnew 數字 misleading**：用戶由 v0.1.3 升到 v0.3.2，output 講「涵蓋 2 個版本嘅 release notes」—— 事實對（whatsnew folder 只有 v0.3.1.md + v0.3.2.md）但 narrative 缺說明，用戶可能誤以為 v0.1.3 → v0.3.2 之間只改咗呢 2 個版本嘅嘢。

呢兩個 bug 嘅深層 root cause：v0.3.2 ceremony 驗證**只 simulate fresh install + upgrade no-op + upgrade substantive (v0.3.0 → v0.3.2 細跨度)**三個場景，完全冇 simulate「v0.1.x / v0.2.x 真實舊用戶 → 新版 deep range upgrade」嘅 user journey。Adam catch 嘅 second iteration 揭發我 verification approach 嘅同類 blind spot 重演（L3 critique recurrence）。

### 產品層修補

- **`bin/agent-handoff-kit.mjs` `doInstallOrUpgrade` PROJECT_INDEX template version inject 擴 scope** —— 條件由 `created.includes("dev/PROJECT_INDEX.md")` 擴至 `command === "upgrade" || created.includes(...)`。Upgrade 場景現在會 inject CLI 當前 version 入 template version metadata row，但仍 preserve user content rows（External Sources / Fact Base / Workspace Identity 等）。R-016 「user-owned」原意保護 user content；template version metadata row 屬 maintainer-owned 嘅 template structure metadata。
- **`bin/agent-handoff-kit.mjs` `printWhatsnew` 加 deep range narrative** —— 當 fromVersion 比 oldestAvailable whatsnew 跨多個 minor / major version，明文 print「跨度較大；本工具 release notes 庫只 cover 由 v{oldest} 起嘅 N 個版本；較舊版本見 GitHub Release」。

### QC framework 修補

- **`scripts/check-release-readiness.mjs` R-031.1 scenario 3 加跨多版本 fixture** —— 模擬 root template version v0.1.3 + 刪 v0.2.0+ files → upgrade → assert post-upgrade template version 已 inject 為當前 CLI version + doctor self-check 無「root 落後」hint + whatsnew deep range narrative 命中。
- **`docs/qa/release-grade-qa.md` 加 plan-time discipline** —— mandatory「未來涉及 user-facing 命令嘅 release verification，必 simulate 至少一個 deep version range upgrade（譬如 v0.1.x → 當前）」，避免 reactive default 重演同類 narrative coherence gap。

### 治理層

- **`docs/REQUIREMENTS_CONVERGENCE.md` R-016 row 加註** —— 明文「user-owned」指 user content rows（External Sources / Fact Base 等），唔包 template version metadata row（屬 maintainer-owned 嘅 template structure metadata）。
- **`docs/REQUIREMENTS_CONVERGENCE.md` R-031 row 補 R-031.3 v0.3.3 narrative**。

### Migration path（v0.3.2 → v0.3.3 + 跨多版本舊用戶，backward-compat preserved）

- 冇 user-facing template 改動；user dev/ 同 packs/ 維持原狀。
- 升級後唯一可觀察改動：CLI output narrative coherence 改善 —— upgrade 完成後 doctor 即時對齊。
- doctor 對既有用戶仍 PASS。
- fileCount 26 → 27（加 `docs/whatsnew/v0.3.3.md`）。

---

## v0.3.2 — 2026-05-23

狀態：正式發佈版本。本版本由 Adam 對 v0.3.1 release 後做 user journey critique 觸發 —— Adam 跑 `npx ... doctor` 時揭發「doctor 唔識自動做新版本檢查、唔推薦升新版」嘅 awareness gap，同時對 framework 提出更深 critique：QC 機制設計上粗疏、欠不同情景 user journey 嘅 UX 設計、AI 欠主動引導新手用戶嘅思維。本版本針對 init / upgrade / doctor 三個命令做 user-journey-driven 嘅 UX 重設計。

### Init / upgrade / doctor 嘅 user journey UX 改進

從用戶嗰刻嘅 mental state 出發，直接 surface 用戶可能想知道嘅資訊，唔等用戶主動 ask AI。

- **`init` 加「點 confirm 你裝啱咗」mini-checklist** — 直接答首次安裝後嘅 anxiety「我裝啱咗嗎」。列三個具體 verify step（跑 doctor / 數 dev/ 檔案數 / 喺 AI tool 開新對話），並講清「Agent Handoff Kit 只係 background harness，需要連住 AI tool 先見到實際 value」。
- **`doctor` 加「項目狀態速覽」三句** —
  - **三向 version 對比**：CLI version / root template metadata version / npm latest 三者並列。對應 user mental model「我用緊邊個版本 / 有冇升級需要」。舊版設計依賴 startup `maybePrintUpdateNotice`，但 npx 自動 fetch latest 嗰陣 silently 失效（CLI 已 = npm latest）—— 呢個 gap 由 Adam 喺 v0.3.1 後揭發。
  - **距上次 closeout 幾耐** — 對應 user mental model「呢個 project 嘅 reflection cycle 健康嗎」。讀 `dev/SESSION_HANDOFF.md` 嘅「Last Updated:」line。
  - **項目首次安裝距今幾耐** — 對應 user mental model「呢個 project 嘅 continuity awareness」。讀 `dev/governance_migrations/<oldest folder>` 嘅 timestamp。
- **`upgrade` 加 inline whatsnew summary** — 升級完成時直接 print 本版同跨版本嘅 release notes 摘要，唔等用戶 ask AI 先知道有咩改。新檔 `docs/whatsnew/v<version>.md` 三段固定 schema（本版新加咗咩 / 對你已有檔案嘅影響 / 建議下一步），每次 release maintainer 必寫。
- **`init` fresh install 注入當前 CLI version 入 PROJECT_INDEX template metadata row** — 由 v0.1.7 起 template 嘅 hardcoded `0.1.7` row 從未 update，導致 fresh install 後三向 version 對比顯示 root v0.1.7（事實錯誤）。本版本只喺 fresh install 場景（`created.includes("dev/PROJECT_INDEX.md")`）注入；upgrade 場景仍 preserve user-owned row（保留 R-016 紀律）。

### Adam 嘅 framework critique 觸發嘅深層教訓

呢個 v0.3.2 唔係單純 patch issue，係對「QC 框架 + AI 思維 + 開發過程」三層 systemic redesign 嘅起步。Adam 嘅 critique 揭發三層 gap：

1. **QC framework 屬 state-based 唔係 journey-based** — 既有 lexical（forbidden vocabulary grep）+ semantic（scenario branching simulation）兩層 sweep 都係 token / state existence check。冇 mechanism cover「用戶喺呢個 state 嘅 mental model 是否被服務」。Doctor scenario 嘅 must-have / must-not-have contract 可以全綠，但 user mental model「我用緊邊個版本」可以完全 missing —— grep 抓唔到。
2. **AI mental model 預設 reactive responder 唔係 proactive anticipator** — 用戶問 → AI 答。冇主動 anticipate「用戶 next likely 問題係咩 / 我有冇 pre-answer」嘅 plan-time discipline。R-029 onboarding 嘅 proactive thinking 喺其他 entry point（upgrade / doctor / 日常使用 / debug）冇 transferable。
3. **Development process 把 Adam catch 當 single-data-point absorption** — 每次 catch 即 absorb 入 R 編號 + sweep dim + 長期記憶，但屬個別 issue level；冇做 N-catch-level 嘅 meta-retrospective + lesson cross-check enforcement。教訓 codify 變紀念碑，唔係 living guard rail。

呢三層教訓 codify 入治理層做下一步 framework redesign 嘅起點。本版本 user journey UX 改進屬第一個落地 demonstration —— 用 user-journey-driven mindset 做嘢，唔再 reactive patch token。

### Migration path（v0.3.1 → v0.3.2，backward-compat preserved）

- 冇 user-facing template 改動；user dev/ 同 packs/ 維持 v0.3.1 狀態。
- 升級後唯一可觀察改動：CLI output（init / upgrade / doctor）narrative 更豐富。
- doctor 對既有用戶仍 PASS（schema + anchor check 未變）。
- fileCount 24 → 26（加 `docs/whatsnew/v0.3.1.md` + `v0.3.2.md`）。

---

## v0.3.1 — 2026-05-23

狀態：正式發佈版本。本版本修補 CLI 升級流程的 messaging gap，並擴展 QC 框架至「CLI 場景分流（scenario branching）一致性」維度，防止同類 audit blind spot 在未來的釋出版本重演。

### CLI messaging gap fix

第一個 v0.3.0 用戶實測揭發升級流程的事實錯誤訊息：

1. 升級完成後印「✅ 安裝完成：下一步請在 AI 對話中操作」大型 banner，但用戶並非首次安裝，係升級。
2. 升級完成嘅 banner 內推送新手引導起步句「I just installed agent-handoff-kit. Help me get started.」，但升級中嘅用戶可能正在進行長期 session，貼此句會誤觸發新手引導包重做 onboarding。
3. 第二次升級（已 latest，零改動）仍跑完整 ceremony：寫 migration report、跑 self-check doctor、印「安裝完成」banner。實際無檔案改動，呢啲動作純屬 noise。
4. `doctor` 結尾叫人「如要升級到較新版，執行 npx ... upgrade」，但啟動本工具時已 `maybePrintUpdateNotice` 印過更新通知，doctor 結尾再叫人升級屬重複加誤導（用戶啱啱升完做 doctor）。
5. 升級完成嘅「剛做咗」摘要純機械 count（create 3 / merge 3 / skip 14），未提供本版本新加咩功能、用戶應留意咩、新加咗咩 section 嘅 substantive narrative。

v0.3.1 修補：

- **`bin/agent-handoff-kit.mjs` `runInstall` 加 plan-time upgrade no-op detection** — 當 upgrade 嘅 plan 顯示零 create / 零 merge / 零 conflict（純 skip），直接跳過 plan listing + confirmWrite + migration report + self-check doctor，改印短訊「你已經是最新版本，沒有檔案需要建立或合併」。
- **`bin/agent-handoff-kit.mjs` `printInstallNextSteps` split** — install 場景保留現有實作（含「安裝完成」+ 新手起步句）；新加 `printUpgradeNextSteps` 替 upgrade substantive 用，narrative 改為「升級完成：管治架構檔案已更新到最新版本」+ 提示「進行中嘅 session 已熟悉本工具可繼續使用原本開工方式」+ 選用嘅 review 起步句（非強推 onboarding）。
- **`bin/agent-handoff-kit.mjs` 新加 `printUpgradeNoopShortCircuit`** — 升級零改動場景嘅極短 banner（約 8 行），跳全部 ceremony，避免噪音。
- **`bin/agent-handoff-kit.mjs` `runDoctor` 結尾 next-step 紀律** — 健康狀態下唔再 unconditional 講「如要升級到較新版」，改為「繼續日常使用即可。如有新版本發佈，啟動本工具時會自動顯示升級通知」。

### QC framework expansion（防同類 gap 重演）

R-026 CLI Output Contract sweep helper 既有 assertion 屬 lexical / structural layer（grep token 存在性），未 cover semantic / scenario-fit layer（同一字串喺場景 X 出現係咪事實正確 + 用戶可行動）。譬如「安裝完成」字串本身合法，但喺 upgrade no-op 場景印屬事實錯誤；既有 grep 抓唔到。

呢個 gap 同 v0.3.0 揭發嘅 upgrade migration safety gap 同 root cause：QC framework 未自我擴展 cover 新 surface 類型。v0.3.1 落地：

- **`docs/qa/release-grade-qa.md` 加新治理 QA 缺口矩陣 dim「CLI 場景分流（scenario branching）一致性」** —— 列出七個 user-invocable 場景（install fresh / install with conflict / upgrade fresh substantive / upgrade no-op / upgrade with conflict / doctor healthy & latest / doctor healthy with newer available），每場景定 output contract（must-have / must-not-have / context-appropriate）+ 配套 Sweep section 描述 automated enforcement 範圍。
- **`scripts/check-release-readiness.mjs` 加場景 simulation assertions** —— 真實 invoke bin/agent-handoff-kit.mjs 喺各場景 fixture，verify output 唔跨場景錯用（譬如 grep upgrade no-op output 唔含「安裝完成」「I just installed」；grep doctor healthy output 唔含「如要升級到較新版」）。
- **`runtime-core/AGENTS.core.md` 同 `runtime-core/RULE_PACKS.md` 不變**，本次紀律屬 release QA framework expansion，未改 user-facing runtime template。

### Migration path（v0.3.0 → v0.3.1，backward-compat preserved）

既有 v0.3.0 用戶 upgrade 影響：

1. **冇 user-facing template 改動**，所有 `runtime-core/*.md` 同 `packs/*.md` 維持 v0.3.0 狀態。
2. **upgrade 後唯一可觀察改動**：CLI output messaging 流暢度提升 —— 升級完成後睇到「升級完成」而非「安裝完成」+ 升級零改動場景睇到短訊而非完整 ceremony + doctor 結尾唔再叫你升級。
3. **doctor 對既有用戶仍 PASS** —— 因為 doctor schema check 同 anchor check 未變。
4. **fileCount 維持 24** —— 本次無新加檔案入 npm package。

---

## v0.3.0 — 2026-05-22

狀態:正式發佈版本。此版本已建立 tag、GitHub Release,並已 npm publish。**v2 嘅 second major version bump**(v0.2.x → v0.3.0),引入 first-class **Integration governance framework**(R-030):支持 Connectors / MCPs / Plugins / Skills 跨 session 治理 + 機密分離原則 + 多層持久化 source-of-truth architecture + cross-tool resilience。

### Major addition (R-030 Integration Governance Framework)

v0.2.x 設計於 pre-MCP-Connector-mainstream 時期(2024-2025),packs/knowledge.md Rule 5 預設「paste fallback」為 default 紀律。2026-05 reality:Anthropic 官方 Connector directory 398 verified integrations、Claude Desktop Extensions 一鍵安裝、2,300+ public MCP servers —— Connector ecosystem 已成熟,但 v2 framework 完全冇 Integration 治理紀律。

v0.3.0 修補:

- **NEW `packs/integrations.md`** (~400 行) — 4 個 subsection(Connectors / MCPs / Plugins / Skills)各自紀律 + 機密分離原則 + Source-of-truth Architecture 多層持久化 + Cross-session Lifecycle 6 階段
- **`runtime-core/PROJECT_INDEX.md` 加新 `## Installed Integrations` H2 section** — 4 subsection table schema(Connectors / MCPs / Plugins / Skills,每個含 `Credential Location` column 記指向唔記 value)+ `### Source-of-truth Architecture` sub-table 描述多層分工(真源 / Index / Mirror / Working draft)+ ⚠️ 機密分離 header
- **`runtime-core/PROJECT_INDEX.md` 既有 `## External Sources` 表加 `via` column** — 引用 Installed Integrations entry,確認該 source 經邊個 integration 訪問,boundary 同 Installed Integrations 互相一致
- **`runtime-core/AGENTS.core.md` startup reads 加 availability probe 紀律** — 新 session 開工自動 verify 每個 declared Integration,update `Last Verified` cell;auth 失敗即 surface 唔自動 fix
- **`runtime-core/AGENTS.core.md` 加 credential 機密分離 enforcement** — 認 14 種 credential prefix patterns,redact + warn rotate
- **`runtime-core/RULE_PACKS.md` 加 integrations pack routing row**
- **`runtime-core/SESSION_HANDOFF.md` `## Durable Anchors` 加 row 6** — Installed Integrations registry 屬 durable anchor,新 AI 必讀
- **`packs/knowledge.md` Rule 5 重寫 Connector-first default** — (a) check declaration / (b) functional 即用直接 MCP / (c) unavailable fallback paste + drift flag / (d) undeclared 即 ask user(backward-compat preserved)
- **`packs/safety.md` Rule 10 differentiate 三層 external access** — Anthropic-vetted Connectors / community MCP / raw API,加新 Rule 12 credential leak prevention
- **`packs/onboarding.md` 加 Scenario F「審視已裝外部工具 + 設計治理」** 5-step walk-through + 5 既有 Scenarios A-E Step 1 加 micro-question 問已裝整合 + Scenario B Step B.2 + Scenario C Step C.2 retire paste-only mindset + Tone Discipline 第 2 條釐清 jargon 邊界(internal jargon 過濾 / user-facing 概念可教)+ Anti-pattern row 加「假設用戶冇裝任何 Connector」
- **`bin/agent-handoff-kit.mjs`** — mappings 加 integrations pack;requiredAnchors / schemaChecks 加新 anchor + integrations pack structure check;新加 `checkInstalledIntegrationsCredentialLeak()` doctor function(grep 14 credential prefix patterns 對 PROJECT_INDEX + SESSION_HANDOFF + SESSION_LOG);`classifyExistingFile` 加 PROJECT_INDEX upgrade path(v0.2.x 既有用戶 upgrade 後自動 append `## Installed Integrations` section template + `via` column);schema check label 既有「onboarding pack structure (R-029)」normalize 為「(新手引導包)」;7 處 user-facing CLI R-XXX leak(line 326 / 547 / 560 / 781 / 814 / 1232 / 1278)normalize 為日常 wording
- **`scripts/check-release-readiness.mjs`** — assertion 由 21 條擴展至 26+(integrations pack anchors + PROJECT_INDEX Installed Integrations schema + AGENTS.core.md Integration startup probe anchors + 14 credential prefix sweep over runtime-core template files + v2 jargon ban + cross-callout wording grep)
- **`scripts/check-pack-scenarios.mjs`** — 加 integrations routing scenario + Notion+本機+Drive multi-source governance scenario + cross-tool drift fallback scenario
- **`scripts/check-upgrade-safety.mjs`** — chain test final hop 加 PROJECT_INDEX `## Installed Integrations` section migration assertion + `via` column + credential leak doctor check
- **`scripts/check-public-prototype.mjs`** — total files 23 → 24;assertion `dev/rules/integrations.md` 必創建

### Documentation rewrites

- **`agent-handoff-kit-guide.html` Cases A/B/C narrative 重寫**:
  - 8 個 Terminal mock blocks(line 541 / 619 / 826 / 891 / 1024 / 1083 / 1305 / 1373)版本字 `v0.1.8` 改為 generic placeholder `vX.Y.Z` + 第一個 mock 上方加 disclaimer footnote 「實際版本字會係你安裝時 npm latest,本指南不會 drift」
  - Hero callout(line 470)+ Case A Step 2 bridging callout 兩處同步 stateless rewrite,retire「v2 advanced user path」內部 jargon,共用「兩種開工方式」白話 anchor(qa:release 對 anchor 一致性 grep enforce)
  - Case B Steps 1-7 major rewrite 為 Connector-primary narrative:Step 4 改為 AI 用 `mcp__notion__search` 直接讀 DB 而非 user 手動 CSV export;Step 4 寫入 3 row 補登記改為 AI 用 `mcp__notion__create-pages` 直接寫 + read-back verify;Step 5 Drive upload 改為 AI 用 `mcp__google-drive__upload` 直接執行 + `update-permissions` 設 share + read-back verify;Step 6 closeout 反映「無待填缺口」嘅完整對齊狀態(declared Connector functional case);所有 paste-only narrative 改為 fallback 路徑(未 declare Connector 才用)
  - Case C Day 30 narrative 加 Integration declaration evolution(項目演進加 Slack + Linear Connector)
- **`agent-handoff-kit-intro.html` v0.2.3 → v0.3.0** + 加 Integration explainer
- **`README.md` 加新 H2 section「外部工具治理」** 介紹 Installed Integrations 機制 + 機密分離原則 + 跨 session lifecycle 6 階段(不教 install)
- **`docs/qa/release-grade-qa.md` v0.3.0 發佈狀態** + 新 Sweep「Installed Integrations Discipline Sweep(R-030)」+「Credential Leak Prevention Sweep」+ 治理 QA 缺口矩陣加 dim「Integration Governance UX gap closure」
- **`CHANGELOG.md` 本檔 prepend v0.3.0 entry**

### v0.2.3 揭發 gap 順手清

v0.2.3 release 後發佈檢 grep 揭發 `bin/agent-handoff-kit.mjs` CLI source 7 處 user-facing R-XXX leak(line 326 / 547 / 560 / 781 / 814 / 1232 / 1278)—— v0.2.2 `internalReferenceForbidden` sweep scope 第四次 design gap(只 cover README + intro + guide 3 個 HTML/MD surface,唔 cover CLI source post-install printed output 或 upgrade reason strings)。本版本一齊清。

### Migration path(v0.2.x → v0.3.0,backward-compat preserved)

既有 v0.2.x 用戶 upgrade 影響:

1. **`upgrade` 自動 append PROJECT_INDEX 新 `## Installed Integrations` section template**(empty rows + schema + `via` column)—— 唔影響既有 sections;Content fields stay user-owned;可選擇填或留空。**無 declare = AI 行 backward-compat fallback path**(knowledge Rule 5 (d) ask-user,等同 v0.2.x behavior)
2. **RULE_PACKS.md 加 integrations pack routing row force-refresh**(同 v0.2.1 紀律一致)
3. **doctor 加 credential leak scan + integrations pack schema check** — 既有項目若無 credential leak + 無 install integrations pack 之前,upgrade 後新 schema 自動 propagate,doctor 仍 pass
4. **既有 CLI behavior preserved** —— 只有 7 處 user-facing R-XXX leak normalize 為日常 wording,功能無變

### Lifecycle 6 階段 cross-session resilience

新引入嘅 Integration governance 治理流程:

1. **First-contact declaration**(onboarding 階段 AI 主動引問)
2. **Initial recording**(寫入 PROJECT_INDEX `## Installed Integrations`)
3. **Cross-session handoff**(SESSION_HANDOFF `## Durable Anchors` 強制要求新 AI 讀本 section)
4. **Startup availability probe**(新 AI 開工 verify 每個 declared Integration + update `Last Verified`)
5. **Mid-session drift handling**(auth 失靈即 surface,唔自動 fix,紀錄入 PROJECT_INDEX + SESSION_LOG)
6. **Multi-tool 環境 cross-tool 一致性**(declaration 屬 project-level,新 AI tool 開工 verify availability + 若無相應 MCP 就 fallback paste)

### Honest reflection(2026-05 ecosystem alignment)

v2 設計於 MCP/Connector 仲未 mainstream 嘅時期,先天 framework 缺 Integration 紀律。2026-05 reality 揭發呢個 framework gap 嚴重影響第一次 install 後嘅用戶 UX(onboarding pack Scenario B Step B.2 正面 reinforce 錯 paste-only mindset)。v0.3.0 屬一次性 framework 升級而非 ad-hoc patch,將 Integration 紀律納入 first-class governance dimension。

## v0.2.3 — 2026-05-22

狀態：正式發佈版本。此版本已建立 tag、GitHub Release，並已 npm publish。屬 v0.2.2 嘅 immediate follow-up patch，修補 agent-handoff-kit-guide.html 三類遺留缺口：(1) Case C pre block UI bug（light-on-light unreadable text）、(2) Case C AI 模型版本資訊過時、(3) Cases A/B Step 2 對話框句式與新手引導包 trigger phrase 之間缺 bridging narrative 解釋。

### Fix 1 — Case C pre block UI bug

Case C 4 個 pre block 採用 inline style `background: var(--paper-2)`（淺色）但 inherited `color: var(--paper)`（亦係淺色），導致 light-on-light 文字完全睇唔到。Adam 截圖直接揭發。

修補：移除全部 4 個破壞性 inline style，回歸預設 `.chat-bubble pre` CSS（黑底 paper 字），與 Cases A/B 視覺一致。

### Fix 2 — AI model versions outdated in Case C narrative

Case C「決策日誌」展示嘅後端模型對比範例引用咗 2025 年舊模型（Claude 3.5 Sonnet / GPT-4 Turbo / Gemini 1.5 Pro / 200k context），與 2026-05 時點脫節。Adam catch：「case C .... 寫住嘅內容太舊，現在不是 3.5，已是 Claude 4.6 Sonnet... 上網搜最新資訊對齊。」

修補：WebSearch 確認 2026-05 latest LLM versions —— Claude Sonnet 4.6 (Feb 2026, 1M context window)、GPT-5.5 (April 2026)、Gemini 3.5 Pro (May 2026)。guide.html 7 處更新：line 1562 narrative reference / pre block content / line 1589 / 1595 / 1601 / 1607。

### Fix 3 — Cases A/B Step 2 bridging narrative (R-029.5)

v0.2.0 release shipped R-029 onboarding pack + canonical trigger phrase「Work in <你的資料夾>. I just installed agent-handoff-kit. Help me get started.」Cross-surface wording sweep（v0.2.1）enforce 呢句 trigger phrase 出現喺 4 個 surface（CLI / README / intro / guide hero）。

但 guide.html Cases A/B Step 2 對話框示範嘅係 advanced user direct path：「Work in &lt;root&gt;. Read AGENTS.md and follow it. Before changing anything, tell me the current state...」—— 與第一螢 R-029 callout 句式不同。Adam catch：「'agent-handoff-kit-guide.html' 仍是出現舊句，未改？」

呢個係 design tension：Cases A/B/C 已被 hero 框架定位為 "advanced user path"，所以 Step 2 用直接句式係 narrative authentic；但用戶第一次睇 guide 容易誤會「啲句點解唔一致」。

v0.2.3 採用 β 中度改動（Adam approved）：

- **Case A Step 2 加 bridging callout（15-20 行）**：「兩條入場路 — 新手與老手有別」標題，正式解釋新手嘅 onboarding trigger 句 vs 老手嘅直接句點解殊途同歸、最終都匯入 `AGENTS.md` 讀序契約、新手引導包屬一次性教學完成後自動卸載
- **Case B Step 2 加 reference sentence**：簡短 reference Case A Step 2 嘅完整解釋，避免重複

完整保留 Cases A/B 老手直接 narrative authenticity（不改 user bubble 句式），同時封住「點解第一螢同 Step 2 句式唔同」呢個 UX 缺口。

### QC discipline reinforcement

R-026 sweep 沿用 v0.2.2 內置 `internalReferenceForbidden` patterns（R-XXX + closeout step N + strict mechanical）。v0.2.3 新加嘅 bridging callout 內容避免任何 internal reference ID 泄露，全部用日常語言表達（「新手引導包」/「老手直接句式」/「讀序契約」）。

### Migration path（v0.2.2 → v0.2.3）

既有用戶 upgrade 無影響：

1. v0.2.3 改動限於 guide.html 文案；唔影響 runtime behavior、CLI、scripts、runtime-core
2. `upgrade` action 對既有 install state 行為一致
3. RULE_PACKS.md routing table 已喺 v0.2.1 force-refresh，本版本無需再做

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
