# 變更紀錄

## v0.3.62 — 2026-08-23

狀態：source package version。本版修補接力快照被誤當成即時任務真源的判斷風險，並把 worktree 健康讀回、QA 暫存清理與 release-readiness 守門收斂成更乾淨的候選版本；正式發布狀態仍由 GitHub Release 與 npm `@latest` 發佈後讀回確認。

- Core Persistence Gate 明確：任務進行中、兩次 gate 判斷之間，`dev/SESSION_HANDOFF.md` 可合理落後於已讀回的任務真源；這是 expected lag，不應每一步都更新 handoff 或重生 startup mirror。
- 同一條規則保留必要保存例外：durable / startup-needed fact、handoff 是最小正確 home、Kit-managed / release / closeout / external-effect 狀態變更，或已選 full closeout 時，仍必須按 gate 保存。
- 新增 `workspace-health` 唯讀健康入口，並讓 `closeout-status` 對照 handoff Workspace Identity 與真實 Git / worktree 狀態，防止「沒有平行 worktree」等錯誤快照被當成已保存交接。
- QA 暫存目錄在 PASS 後自動清理；失敗或指定保留時才留下 fixture evidence，避免本機長期累積 release / cold evidence 殘檔。
- Release-readiness gate 同步鎖住 expected-lag 反例、workspace-health false-green closeout、QA temp cleanup，以及 task persistence gate contract。

## v0.3.61 — 2026-08-08

狀態：source package version。本版收窄正式收工的持久化成本，令 Agent Handoff Kit 保留交接安全，但不把每次收尾放大成全段重寫與重跑流程；正式發布狀態仍由 GitHub Release 與 npm `@latest` 發佈後讀回確認。

- Closeout Pack 明確 full closeout 是 differential and write-minimal：只更新真實狀態有變的欄位或段落；已是最新的 handoff 內容不為儀式重寫。
- `START_NEXT_SESSION_PROMPT.txt` 改成 verify-first：先用 normalized content 讀回比對，只有便利副本真的 drift 時才重生。
- `runtime-core/SESSION_HANDOFF.md` 同步改成 changed-truth-only，讓新安裝或升級後的項目沿用同一套精簡收工語義。
- `scripts/check-closeout-efficiency.mjs`、pack scenario QA 與 release-readiness gate 同步鎖住 write-minimal / verify-first 條件，防止全段確認與未先比對就重生 mirror 回流。
- `closeout-status` 的單次 fresh doctor read-back 保留；本版只減少多餘寫入與重跑，不降低 closeout 安全 gate。

## v0.3.60 — 2026-08-08

狀態：source package version。本版收窄普通文檔修改的 runtime 治理觸發，並修正開工狀態卡 ASCII 走位風險；正式發布狀態仍由 GitHub Release 與 npm `@latest` 發佈後讀回確認。

- 開工狀態卡現在要求用 fenced `text` block 顯示並保留 spacing；小貓 ASCII 本身不變。
- Core proportionate work loop 明確：普通文檔局部修改若目標文件本身就是權威來源，且沒有碰到 Kit-managed files、migration、release / closeout gates、external effects、cross-source conflicts 或 safe-continuation blockers，不因文件改動而跑 `agent-handoff-kit doctor`、寫 handoff / log 或重生 startup mirror。
- Agent-governance generated artifact workflow 分清 existing target-authority local edit 與新 durable artifact；`doctor` 只作 scoped Kit / typed registered-surface checks，不代替普通文檔分類或內容驗收。
- QA 加入 proportionate document edit use-case matrix，覆蓋 ordinary target-authority document edit、new durable document bridge candidate、Kit-managed governance file edit 與 startup card rendering；release-readiness gate 同步鎖住 startup card fenced block 與普通文檔免預設 doctor 的 contract。

## v0.3.59 — 2026-08-08

狀態：source package version。本版修補 `doctor` 在 formal user-rules 見證存在時，先給泛用 anchor 手修建議的安全漏洞；正式發布狀態仍由 GitHub Release 與 npm `@latest` 發佈後讀回確認。

- `doctor` 現在先驗證 `AGENTS.md` 與 `dev/USER_RULES.md` 的 formal user-rules 接受見證，再進入泛用 anchor / schema 修復提示；若 `AGENTS.md` managed core 與 `managedCoreSha256` 不一致，會先報 user-rules 見證錯誤。
- `AGENTS.md` managed core anchor 缺失但已有 formal user-rules acceptance 時，不再提示 AI「非破壞性補回 anchor」；下一步改為還原已接受 managed core，或透過正式 upgrade transaction 重新建立完整接受紀錄。
- QA 補入交叉合約 regression：accepted user-rules 狀態下故意製造 managed-core anchor drift，必須由 formal reader 和 `doctor` 同時拒絕，而且 `doctor` 不得輸出泛用 anchor repair guidance。
- QA manifest 的 prototype claim 擴充為 formal user-rules / managed-core drift 覆蓋；WORK QA 策略同步加入 cross-contract false-green 規則，避免用單項 anchor / hash / schema 宣稱複合行為可靠。
- official-origin catalog 已納入正式發布的 v0.3.58 lineage，讓下一個候選版本的 preflight 能以 npm latest / GitHub Release / remote tag 讀回為基線。

## v0.3.58 — 2026-08-07

狀態：source package version。本版修補首次安裝 onboarding 與 create-only 安裝交易邊界；正式發布狀態仍由 GitHub Release 與 npm `@latest` 發佈後讀回確認。

- 首次安裝會把 first-use guidance 標記為 `eligible`，新用戶第一次只說 `Start Agent Handoff` /「開工」且沒有同句明確任務時，AI 會進入新手引導；升級不會把已 `consumed` / `not_applicable` 的狀態重設。
- fresh `init` 和只補齊缺檔的 create-only `init` / AI install page `upgrade` 會直接以 no-clobber 建檔並讀回驗收，不再建立 `dev/governance_migrations` 或 `.upgrade.lock`。
- 若遇到已完成 create-only `init` 留下的過期 `.upgrade.lock`，CLI 會嚴格讀回 journal、pid、host、狀態與目標檔 hash；確認安全後把它當歷史證據忽略，不要求 AI 刪除受權限保護的 lock。
- malformed、invalid、仍在執行、非 create-only 或涉及 merge / archive 的 active lock 仍 fail closed，保留交易安全邊界。
- QA 機制加入 `install-lock-smoke`，日常 quick 會守住 fresh install / create-only install / stale completed init lock 的事故面；發佈前 full 仍跑完整 upgrade-safety 與 transaction-window。
- 評估全域 `governance-bridge` skill 後，不新增第二套標準 skill；只把有用的 bounded search / generated-output workflow discipline 合併到既有 agent-governance owner。

## v0.3.57 — 2026-08-04

狀態：source package version。本版修補收工診斷讀回不透明、收工 lifecycle classifier 把背景／已清除／有條件監察句誤判為未解事項、舊 schema-2 歷史 witness 回歸覆蓋，以及 Codex 類 runtime 中開工標題工具需要延遲發現時未能改名的問題；正式發布狀態仍由 GitHub Release 與 npm `@latest` 發佈後讀回確認。

- `closeout-status` 在 fresh doctor read-back 失敗時，會顯示第一個安全、可操作的 doctor blocker，而不是只顯示籠統的 `fresh doctor read-back did not pass`。
- `closeout-status` 的 lifecycle classifier 不再把開場白背景路徑、`No blocker remains ...` 類已清除風險，或 `只監察：...如有...才重開` 類有條件監察誤判成 unresolved carry-forward；真正叫下一輪 `Continue` /「繼續」處理已完成事項的開場白仍會 blocked。
- 升級安全 QA 加入有效的舊 schema-2 committed `currentStateWitness` 加後續 witnessless migration 情景，防止歷史交易收據再次變成 current-state authority。
- 單獨 `Start Agent Handoff` /「開工」若 runtime 的標題控制工具需要先 discovery，現在規則要求只做一次窄範圍 title/rename/current-thread 工具搜尋，找到安全的 current-thread title tool 才改名。
- 開工標題命名仍不得讀取或管理無關 thread，不得 create/fork/navigate/message/archive/pin，也不得把標題當成進度、完成證據或任務授權。

## v0.3.56 — 2026-07-31

狀態：source package version。本版修補收工診斷不透明與單獨開工標題時序；正式發布狀態仍由 GitHub Release 與 npm `@latest` 發佈後讀回確認。

- `closeout-status` 不再只輸出 `handoff lifecycle read-back is not healthy`；若偵測到 lifecycle 衝突，會列出第一組 `Resolved [...]` / `Carry-forward [...]` 原文，讓 AI 可直接修正 handoff。
- `doctor` 的 handoff lifecycle 組改為機械可讀檢查；語義 lifecycle gate 留在 `closeout-status`，避免把尚未收工的正常工作誤報成專案不健康。
- Closeout Pack 明確收斂：blocked 時按 `closeout-status` 顯示的第一組衝突修，不用重跑 doctor、查 Kit 內部，或擴大成專案治理修補。
- 單獨 `Start Agent Handoff` /「開工」的標題改名改在 startup facts 定稿後才做，作為回覆前最後 presentation step，避免用 `開工` 或「開始交接工作」這類泛稱命名。
- 支援安全當前對話標題控制的平台，不再因缺少 title readback 就放棄命名；讀回仍可用來避免覆寫已有清楚標題。

## v0.3.55 — 2026-07-27

狀態：source package version。本版修正單獨開工時的對話標題更新時機；正式發布狀態仍由 GitHub Release 與 npm `@latest` 發佈後讀回確認。

- 標題改名只會在 startup card 的目前目標與推薦下一步已得出後、顯示 card 前執行，避免用尚未收斂的資訊命名。
- 主要動作依序取同一句明確任務、已載入目前目標、推薦下一步；`Start Agent Handoff`、「開工」、「開始工作交接」等 generic continuity trigger 不會被當成標題主動作。
- 若已載入事實沒有同時提供具體項目名稱與具體主動作，會跳過改名；標題仍只是 display-only，不授權任何工作、讀檔、連網或狀態聲稱。
## v0.3.54 — 2026-07-27

狀態：正式發佈版本。本版把交易證據收回到單次 operation-local 邊界，移除把舊交易收據當成永久 workspace bytes 權威的模型；GitHub Release 與 npm `@latest` 已發佈為 v0.3.54。

- 沒有 active `.upgrade.lock` 時，舊 `dev/governance_migrations/*/transaction.json` 只作歷史收據；`doctor` 與 `upgrade` 不再枚舉或讀取已完成舊 journal 來判斷目前 workspace bytes 是否仍匹配。
- 有 active lock 時，recovery 只使用 lock 精確引用的 operation-local journal、stage、backup、target 與 archive 狀態；空白、半截、不可讀、malformed 或 schema 無效的 lock 會 fail closed、零寫入、保留原 lock，不掃歷史 journal，也不 quarantine。
- `reconcile-current-state` 與 `finalize-closeout` 這類手動補綁命令已移除；正常日常 agent 修改 handoff、log、rule pack、archive、普通 docs、Unicode path 或新檔後，不需要 bless、repair 或 journal edit 才能再次升級或通過 `doctor`。
- Kit-owned current lifecycle 仍保守處理：managed core、正式 USER_RULES、PROJECT_INDEX 結構、archive casing、active transaction recovery、credential 檢查與 typed unsafe state 仍 fail closed。
- 普通 workspace 檔案不會因位於 root、被 Markdown 連結提到或被舊 journal 記錄過，就被 discovery、read、hash、report 或阻擋。

## v0.3.53 — 2026-07-26

狀態：source package version。本版把升級、健康檢查、交易寫入前重驗、歷史 witness 退役與單獨開工版本顯示收回到更小的可信邊界。正式發布狀態仍由 GitHub Release 與 npm `@latest` 發佈後讀回確認。

- `upgrade`、`upgrade --dry-run` 與 `doctor` 不再掃描或依賴 Kit 管理範圍外的普通工作檔案；一般 docs、outputs、inline path、Markdown link、AGENTS generic reference 和 `RULE_PACKS.md` 自訂 row 會保留文字，不會被讀取、hash、journal 或誤當 blocker。
- Gate 5 current inventory 只由 installed contract、正式 USER_RULES router/content、Kit transaction registry 與 session-log archive 等有類型來源推導；表頭已被改動、路徑越界、symlink/junction/reparse 或 typed source bytes 漂移時仍會 `conflict` 停手。
- dry-run 與正式升級共用同一完整預檢；正式 apply 在取得 transaction lock 後、替換 target 前重建 scoped snapshot 與 candidate identity。若漂移或清理失敗，不會假報升級成功。
- 舊版留下的 whole-root 或一般引用 witness，在 sealed metadata 證明它不再屬目前 typed scope 時可安全退役；真正 Kit-managed、transaction.json、archive、正式 USER_RULES 與 typed runtime edge 仍 fail closed。
- 單獨 `Start Agent Handoff` /「開工」只為 startup card 讀 `dev/PROJECT_INDEX.md` 唯一真實 `## Stack` 版本列；fenced / commented / duplicate / malformed / prerelease 證據只顯示 `version unverified`，直接任務不為版本卡預讀 handoff 或 index。

## v0.3.52 — 2026-07-25

狀態：source package version。本版修補正式來源正常演進後，既有 current-state witness 令 `doctor` 與 `closeout-status` 無法恢復健康的死結；同時讓明示開工在平台安全支援時，可用已載入事實改善過於籠統的對話標題。正式發布狀態仍由 GitHub Release 與 npm `@latest` 發佈後讀回確認。

- `reconcile-current-state` 先以 dry-run 產生 deterministic manifest，再以 `--yes --manifest <sha256>` 綁定同一份已核對計劃；只接受精確六份直接 closeout state、安全可證的 formal user sources，以及完整合格的 canonical archive group。
- 寫入路徑使用已驗證的記憶體計劃，只新增既有 journal / report / lock 證據，不覆寫、複製、移動或刪除專案內容；init / upgrade 亦不能繞過 manifest authority 代為恢復 reconciliation。
- 既有 init、upgrade、finalize-closeout、doctor、closeout-status、Gate 5、archive migration 與 recovery 保護保持原契約。
- 單獨 `Start Agent Handoff` /「開工」可在平台具備安全標題讀回與控制時，將 generic / stale title 改成 `<project name>｜<primary action>`；它不額外讀檔或連網、不反覆改名、不包含進度或完成聲稱，且不支援時靜默略過。
- 標題只屬 display-only derived view，不是項目狀態、權限、進度、健康結果或新的真源，也不放寬單獨開工的 no-auto-execute 邊界。

## v0.3.51 — 2026-07-23

狀態：source package version。本版修補 source-conservation 的保護範圍：Gate 5 仍保留 whole-root discovery 作為唯讀安全證據，但 current-state witness 只保護有 Kit reachability、transaction、archive migration 或 installed contract coverage 的項目。普通 user-owned root files 不再因 README、CHANGELOG 或其他專案檔案正常變更而令 `doctor` 或 `closeout-status` 永久無法通過。正式發布狀態由 GitHub Release 與 npm `@latest` 發佈後讀回確認。

### Source-conservation 範圍收口

- `createSourceConservation()` 不再把 Gate 5 whole-root frozen set 全部放入 protected current-state authority；它只綁定已知 Kit-reachable 的 source-conservation subset。
- legacy v0.3.46-style all-root witness 可在 upgrade rebind 中安全遷移：只有唯一 `root-source`、outside-known disposition / priority / effect、且沒有 existing reader 的普通 root entry 可退休。
- 有 reader、非 outside-known metadata、rule-pack、formal-route、managed-core、archive migration 或 transaction state 的 entry 仍必須有 replacement / archive coverage，不能被 root-source-only 捷徑靜默 supersede。
- 新回歸覆蓋 published v0.3.46 all-root witness、ordinary root file mutate、unsafe metadata synthetic entries、current arbitrary project files、managed-core drift、state-only bridge、archive bridge、missing / ambiguous / cycle fail-closed。

## v0.3.50 — 2026-07-23

狀態：source package version。本版修補 closeout 與 QA runner 的終態處理：正式 QA 不再依賴可能無界等待的 `spawnSync` timeout；timeout、child signal、spawn / transport error、partial PASS、wrapper false-green 和 Windows command-wrapper shell option 都有結構化處理與反例保護。正式發布狀態由 GitHub Release 與 npm `@latest` 發佈後讀回確認。

### Closeout / QA runner 終態收口

- `scripts/qa.mjs` 和 release-readiness inventory 改用 bounded async checked runner，避免 child 攔截 SIGTERM 時令正式 QA 無限等待。
- `scripts/qa-runner-core.mjs` 集中處理 timeout cleanup、force-kill、settlement deadline、child signal、sync / async spawn-error，以及 Windows `npm.cmd` / `npx.cmd` fallback 的 `shell: true` 傳遞。
- closeout 規則改為差量收口：identity 未變時不重跑已完成 task QA，只從第一個未完成或未確定 gate 繼續。
- WORK closeout checker 立即排空 stdout / stderr，避免高輸出子程序塞滿 pipe 後假逾時；self-test 覆蓋 2MB stdout。

## v0.3.49 — 2026-07-20

狀態：source package version。本版修正 conflict / blocker 出現時的產品路徑：未知本地 hash 只作 witness；用戶只確認需求和授權；能讀寫該專案的 AI 負責語意合併；Kit 以 dry-run、doctor 與 hash / readback 驗收。正式發布狀態由 GitHub Release 與 npm `@latest` 發佈後讀回確認。

### Conflict 升級指引收口

- CLI conflict 輸出不再把一般用戶推去做技術裁決，也不把維護者收納用戶本地內容當成產品路徑。
- AI 安裝頁中英文版本同步說明：不要重裝或整檔覆寫；先由能讀寫資料夾的 AI 在用戶授權下合併，再驗收。
- `release-readiness` 與 `upgrade-safety` 檢查加入 conflict-role wording guard，防止舊錯誤路線回流。

## v0.3.48 — 2026-07-19

狀態：source package version。本版修補 v0.3.47 發佈後發現的合法升級阻塞：舊 runtime 已接受的 `dev/session_log_archive` lowercase archive witness，現在可在同一 upgrade transaction 內遷移到 canonical `dev/SESSION_LOG_archive`。正式發布狀態由 GitHub Release 與 npm `@latest` 發佈後讀回確認。

### Legacy archive casing 升級閉環

- `upgrade` 會在 transaction journal 內登記 archive casing migration，先保存 lowercase legacy archive 的原始 bytes，再 materialize canonical archive。
- rollback 會回復精確 legacy bytes；若 staging 後中斷，下一次 upgrade 會 recovery 後在同一 transaction 邊界重試，不留下半修狀態。
- `doctor` 仍保持嚴格：canonical casing 之外的 ambiguous archive layout 會停手，不把多路徑或不明狀態自動合併。
- `finalize-closeout` 保持原有邊界，不把非收工漂移收進 witness；新版只補合法 archive casing 遷移，不放寬漂移判斷。

### QA/QC 分層收口

- 新增 manifest-owned QA entry point：`scripts/qa-assurance-manifest.mjs` 集中定義 quick / full / postpublish claim membership 與 release-readiness full-suite inventory，避免 release gate 條件分散硬編。
- `scripts/qa.mjs` 按 manifest 執行；`docs/qa/release-grade-qa.md` 只鏡像命令契約，不再作為可執行 claim owner。
- post-upgrade closeout finalize QA 改用 packed candidate tarball，並新增 published v0.3.41 -> published v0.3.45 產生的 accepted current-state witness + legacy lowercase archive 真實相鄰狀態組合。
- release readiness 會先檢查 QA manifest wiring，再跑 R-034、upgrade safety、post-upgrade closeout finalize、package smoke 等既有閘門。

## v0.3.47 — 2026-07-19

狀態：正式發佈版本。本版修補升級後正常收工會被 Gate 5 witness 擋住的真實路徑缺口，GitHub Release 與 npm `@latest` 應以 v0.3.47 為準。

### 升級後收工補綁

- 新增 `finalize-closeout` 命令：只在升級後已有 current-state witness、且後續變動限於合法收工檔案時，重新綁定交接、日誌、下次開工提示等狀態。
- `doctor` 保持嚴格：未補綁的 post-upgrade closeout 仍會報 `unbound success state`；補綁後才會重新通過。
- `finalize-closeout` 會拒絕非收工檔案漂移，避免把普通修改誤收進健康狀態。
- `doctor` 新增 `dev/SESSION_LOG_archive` canonical 大小寫檢查，阻止 Windows 上 legacy lowercase archive 路徑混入。
- `check-release-readiness.mjs` 加入相鄰版本升級後收工測試，覆蓋「升級當下健康，但之後正常收工變壞」這類相鄰流程缺口。

## v0.3.46 — 2026-07-19

狀態：正式發佈版本。本版把新手狀態卡修補由 GitHub Pages 補到實際安裝套件，GitHub Release 與 npm `@latest` 應以 v0.3.46 為準。

### 安裝後也看得到的阻塞提示

- `closeout-status` 在 `handoff blocked` 時加入人話說明：這不是失敗，而是仍有未保存、未提交、未驗證或需要處理的事，使用者應先照 Blocker 行處理。
- `packs/closeout.md` 要求 AI 保留 blocked 卡的人話說明，不可把 blocked 總結成已完成交接。
- README 與英文 README 加入同一套貓貓狀態圖例，令 npm 內附說明與 GitHub Pages 入門頁一致。
- 收工卡合約檢查新增回歸保護；日後 blocked 人話提示消失時，發佈檢查會攔截。

## v0.3.45 — 2026-07-18

狀態：正式發佈版本。本版是 v0.3.44 後的發佈狀態一致性 hotfix；GitHub Release 與 npm `@latest` 應以 v0.3.45 為準。

### 發佈狀態一致性

- 修正 v0.3.44 發佈後 README、英文 README、CHANGELOG、版本頁索引與公開 HTML 仍顯示 candidate / 尚未發佈 / v0.3.43 latest 的錯誤。
- 發佈前候選 commit 不再把會進入 npm 或 public main 的 active surface 寫成「尚未發佈」；候選狀態只屬發佈前 QA 報告，不屬使用者入口文案。
- `check-release-readiness.mjs` 新增 release-state coherence gate，阻擋 active public surfaces 在當前版本中殘留 candidate、unpublished 或上一個 npm latest 狀態。

## v0.3.44 — 2026-07-18

狀態：正式發佈版本；後續由 v0.3.45 修正其公開 surface 發佈狀態文案與 QC 漏檢。

### 中英文公開說明對齊

- 本版逐頁把英文 README、入門、實操指南、AI 安裝頁與本機工作系統案例對齊繁體中文來源；未完成獨立語意及視覺讀回的頁面不可宣稱完成或作為發佈證據。
- 雙向語言導航和頁面可用性保留為恆常公開表面檢查；完整翻譯對齊只在該中英文文件對有變動時觸發，不能用字數、emoji 或一段舊 PASS 冒充語意驗收。

## v0.3.43 — 2026-07-17

狀態：正式發佈版本。GitHub `main`、annotated `v0.3.43` tag、GitHub Release 與 npm `latest` 均已完成；公開套件為 35 個檔案。

### 升級完成後的狀態一致性

- `doctor` 現在只會在已完整驗證同一份 current-state witness 後，才把其中的 accepted version 當作項目的目前狀態。
- 舊專案為保護原始 bytes 而保留的 `PROJECT_INDEX` 版本，只會清楚顯示為保留資料；若 accepted version 已等於目前工具，`doctor` 不會再叫用戶重跑 upgrade。
- `doctor` 會分清目前工具、已接受目前狀態、保留 metadata 與 npm 最新版本；工具太舊、項目確實較舊、或 npm 有新版時，才顯示相應下一步。
- v0.3.41 direct-`AGENTS.md` 升級旅程與打包後安裝旅程，現在都驗證第一次與第二次 `doctor` 的版本及下一步語意，避免只靠 exit code 或 `status: passed` 假綠。

### 公開中英文入口

- 保留原有繁體中文 README、入門、實操指南與 AI 安裝頁，並新增對應英文版本及雙向語言導航。
- 英文 README 是公開套件的一部分；公開 mirror 和 npm package 會明確驗證它存在，QA、fixtures 與維護工具仍不會入包。

## v0.3.42 — 2026-07-17

狀態：正式發佈版本。本節保留技術變更；使用者摘要見 GitHub Release 與版本頁。

### R-034 資料保護根修

- Kit 內容只有在 package 身分、受管 target 與精確原始 bytes 同時吻合時才可替換；標題、語言、格式、位置或整份檔案看似官方都不再是所有權證據。
- 非精確、混入或不明的 rules / prompts 以整份原始 bytes 保留，並由既有正式入口讀回；`AGENTS.md` → `RULE_PACKS` 的實際 reader、優先與效力必須與保存紀錄一致。
- upgrade、interruption 與 recovery 只會呈現完整舊狀態或完整新狀態；ordinary entry、doctor、過渡報告與成功畫面讀同一份 fresh current-state witness。
- 頂層 readiness 現會實跑 official-origin catalog、Gate-5 whole-set closure、artifact-backed vertical 及原五檔 closure；任一 checker 缺失或失敗都不能輸出成功。
- 對已釘選的 v0.3.38 舊 `AGENTS.md`，只有官方 artifact 能精確證明的 Kit core 才會更新；舊 core 前後的內容會原樣保留並可重建整檔。任何 core bytes 不精確的混合檔仍整檔保留，不會靠標題、語言或位置猜測分段。
- 若舊專案版本早於候選、但官方 catalog 尚未有該版本的 raw-byte 身分，`AGENTS.md` 與直接讀取的交接狀態只會整檔保留並由同一 acceptance 讀回；版本欄位只可觸發保守保留，不能授權覆寫。
- 已釘選的 v0.3.41 舊專案若以直接 `AGENTS.md` 加入用戶內容，升級會真正更新精確 Kit core 並保留外圍原始 bytes；catalog 未能精確證明身分時，core 未更新不會被誤報為升級成功。

### 開工與收工

- 單獨輸入「開工」只會恢復最低必要狀態、顯示目前狀態與推薦下一步後結束；不會自行研究、計劃、搜尋、叫子代理、跑 QA、封包、寫檔或連網。同一句明確要求繼續工作時，AI 仍會開始該工作。
- 完整收工只做一次完整 doctor；關閉狀態內部不再重複查版本。即使停用更新提示，任何 doctor、mirror 或 handoff 失敗仍會令收工失敗。
- 一般回覆先用清楚日常語言交代結果、實際影響與下一步；需要技術細節時才在後面提供證據與指令。

### 發佈前驗證範圍

- 原五檔 v0.3.40 輸入以既錄 SHA-256 從可信 artifact fixture 重建，驗證原始 bytes、無標題繁中／英文／日文規則效力及 interruption/recovery。
- 頂層 release readiness、隔離 UAT 與 npm pack/install smoke 均已在候選 commit 上通過。

## v0.3.41 — 2026-07-12

狀態：正式發佈版本。

### 根因修正

- 升級器新增 54 個 npm 正式版本的完整安裝來源清單，逐版記錄目前 21 個受管路徑的實際存在／缺席狀態；未改過的正式舊檔可直接辨識並升級，不再因舊 `safety.md`、bridge 或其他 Kit 原檔被誤報 conflict。
- 正式安裝基線改以 npm tarball 的 integrity／shasum 固定；Git tag 與 GitHub Release 只作版本交叉證據。這修正了 v0.3.35、v0.3.38 tag 與 npm 實際安裝內容不同而令舊 fixture 驗錯產品的根因。
- 21 個安裝檔路徑及遷移策略集中到單一契約；歷史內容按 hash 去重，取代只保存 `AGENTS.md`／`PROJECT_INDEX.md` 兩檔的假完整測試及 v0.3.38 專用基線。
- 精確正式檔辨識不依賴版本列；涉及自訂內容的合併則要求版本列與多個正式檔案指紋一致。版本列偽造、缺失或與檔案世代矛盾時不猜基線。
- 規則包只自動保留清楚標題分隔的本地附錄；任意改寫官方規則即使行數不重疊，也會零寫入停手，避免把機械合併誤當語意安全。
- CLI 明示實際項目版本、目標版本及目前交易狀態；舊 migration stage／已回滾報告只屬歷史證據。現行衝突路徑是由能讀寫該專案的 AI 在用戶授權下核對與合併，再由 Kit 以 dry-run、doctor 與 hash 讀回驗收；只有能證明未改動正式舊檔被 Kit 誤判時才回報 baseline bug，不把一般使用者或維護者收納用戶本地內容當產品路徑。
- 退役以 `## Architecture` 等常見字串猜測「舊官方 bridge」的過寬捷徑；只有 catalog 可精確證明的正式舊 bridge 才會自動收斂，自訂 `CLAUDE.md`／`GEMINI.md` 會保留或在交易前停手。
- `dry-run` 與正式升級共用同一套候選內容、機密及完整結構驗收；驗收不通過時，在建立 lock、stage、backup、journal 或 migration 目錄前停手。
- 交易恢復不再只信任 journal 的 `committed` 旗標：每個目標、stage 及 backup 都要核對路徑、真實位置與雜湊；替換後但 journal 尚未更新的中斷窗可正確辨識。損壞、越界、第三種內容或 junction 一律保留 lock 並在改動目標前停手。
- 不存在的安裝 root 只會在使用者確認後建立；取消時「沒有寫入」與實際檔案狀態一致。公開 source 頁亦分清頁面候選版本與 npm `@latest` 的已發佈版本。

### 驗收

- 54 個 npm 正式版本均由完整 manifest 重建並單跳升級；全部通過交易驗收及 `doctor`。
- 正反回歸覆蓋 CRLF、歷史缺席檔案、npm／tag 分叉、偽造或缺失版本列、可保留本地附錄、不可合併規則改寫、自訂 bridge 常見標題、預演／正式結構驗收一致、歷史日誌、回滾、恢復及冪等。
- 交易故障回歸另覆蓋確認前取消、替換後 journal 更新前中斷、pending transaction 經 junction root、stage／backup junction、越界 journal、損壞 stage／backup 及第三種內容；失敗情景均核對目標、journal、report 與 lock 的前後狀態。
- 截圖所屬真實 v0.3.38 專案已由原交易 backup 在隔離副本重建；新版預演 conflict 0，正式交易成功，`doctor 54/54`，原專案保持不變。

## v0.3.40 — 2026-07-12

狀態：正式發佈版本。

### 修正

- 修正大型中英交接把零散通用詞誤判為同一完成／待辦事項，導致 v0.3.39 升級在候選驗收階段回復。
- 生命週期檢查現在讀取權威 fenced 開場訊息；短中文、兩詞英文及實質後續條件均有正反回歸，空白或待定條件不能繞過矛盾檢查。
- `SESSION_LOG` 升級只更新唯一現行 Entry Template；多筆歷史 marker、日誌內容及 fenced 開場證據逐位元組保留，不再要求全檔只有一組 marker，也不會把新欄位插入或清理歷史 entry。
- 短中文生命週期比對補上「修復／修補／修正」等同題動詞正規化；同題不同詞序會正確阻擋，異題仍可通過。
- 精確識別已知 v0.3.38 continuity quick-fix 規則包；完全相符才換成現行官方 pack，任何額外本地修改仍走保守三方合併或 conflict。

### 驗收

- 三個原失敗治理形狀均由 untouched original 建立 fresh 隔離副本並完成正式升級交易；三案 `doctor 54/54`，原專案 pre/post hash 一致。
- 第二案首次隔離正式交易仍回復，進一步揭出否定發布／寫入邊界及 Kit 固定開場文字假紅；根修後由原狀態重建再驗通過。
- `qa:upgrade` 覆蓋 49 個已提交歷史 fixture、歷史 marker 與 fenced 歷史證據逐位元組保留、模糊範本零寫入、大型交接假紅、短中文同義詞／詞序假綠與異題正例、實質後續條件、權威 fenced 開場訊息及既有交易回復。
- 正式獨立審閱曾攔下「歷史 fenced 證據被誤清理」及「完成登入修復／繼續修補登入」兩個 blocker；根修後由乾淨副本重驗，前者 hash 不變，後者負例失敗而異題正例通過。
- 三名原失敗 runtime agent 依各自原 session 證據覆核後均判定「確認對準」；獨立前向覆核無發布 blocker。

## v0.3.39 — 2026-07-12

### 修正

- 「開工」現在走 continuity 熱路徑：已在專案根目錄時只讀 `AGENTS.md` 與權威 handoff；普通明確任務不顯示開工卡，也不進 onboarding。
- onboarding 改為低頻、可消耗的 first-use guidance；fresh install 只令它可用，upgrade 不會重新啟動。
- 完整收工規則集中到新的 `closeout` pack，核心只保留觸發與不可省略的不變條件，減少日常常駐內容。
- doctor 的生命週期驗收不再相信「已解決」自述；完成、驗收、待辦、風險與下次開場訊息會交叉比對。相同事項仍未完成會失敗，明確列作後續監察並附原因／重檢條件才通過。
- prompt mirror 驗證加入 marker、heading、fence 唯一性及第三份完整副本偵測；`SESSION_LOG` 只記鏡像結果，不保存全文。
- `PROJECT_INDEX` 升級只承認真實二級章節，忽略表格、註解與 fenced code 內的同名字樣。
- `CLAUDE.md` / `GEMINI.md` doctor 驗證只承認有效的一跳橋接，註解或 fenced code 不算。
- integrations 改為使用前才作最小 availability probe；placeholder / TBD 不算已安裝，`file://` 單一表面失敗須走安全 localhost fallback 後才可判 blocked。
- README 更正 Adam-AI-Instructions 關係：兩者不是父子真源；安全、機密、不可逆操作及發佈底線有刻意的最低重疊。

### 升級與安全

- `upgrade` 改為交易式：正式 conflict 零治理寫入；候選 overlay 先驗證，逐檔原子替換並寫 journal；中途故障只回復能證明屬本交易的檔案。
- v0.3.38 safety、onboarding、integrations 規則包附隨包基準並作三方合併，保留非重疊自訂內容；重疊改動安全停止。
- `RULE_PACKS` 以穩定 route marker 更新官方列，未標記本地列保留；future-version project 會阻擋舊 CLI 降級。
- 新增 48 個已提交歷史 fixture 單跳升級、v0.3.38 自訂內容、conflict 零寫入、future-version、章節假命中、生命週期正反例、第三提示副本、故障回復及冪等回歸。

## v0.3.38 — 2026-07-05

狀態：候選發佈版本。本版修補 v0.3.37 發佈後驗證揭出的升級缺口：fresh install 已有 full closeout 外部工具資源收口檢查，但 v0.3.36 舊項目升級時 `AGENTS.md` 可能因舊 required-anchor 判斷而被 skip，導致核心 closeout 流程未補上。

### Changed

- `AGENTS.md` required anchors 新增 `If this session used external tools` 與 `ownership-based external-tool resource closeout check`，令舊項目 upgrade 必須補回完整 closeout resource check。
- `qa:upgrade` 升級鏈加入 `v0.3.37` 正式 tag hop，並把 final hop 改為 `v0.3.38 current HEAD`。
- `qa:release` 的 packed prior-version upgrade smoke 會直接讀 upgrade 後的 `AGENTS.md`，確認 closeout resource check 已真正寫入，而不是只靠 doctor PASS。

### QA

- 發佈前必須通過 `qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release`。
- 發佈後必須額外驗證 published v0.3.37 → v0.3.38 upgrade 後 `AGENTS.md` 含 `ownership-based external-tool resource closeout check`。

### Migration path（v0.3.37 → v0.3.38，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。升級會補回 full closeout 外部工具資源收口強制檢查；不會自動終止不明程序、刪除共享 cache、停用工具、修改 browser profile 或改外部工具配置。

## v0.3.37 — 2026-07-05

狀態：候選發佈版本。本版修補 v0.3.36 發佈後發現的 release packaging 漏包：外部工具資源收口已在 `integrations` / `safety` 規則包內，但 full closeout 核心流程沒有在 v0.3.36 tag / npm latest 內強制執行。v0.3.37 將已在 public source main 的 closeout 第 6 步正式發佈。

### Changed

- `runtime-core/AGENTS.core.md` 的 full closeout 流程明確要求：若本輪使用 Connectors、MCP、plugin、browser automation、DevTools、Playwright、crawler、notebook、本地 helper service 或 task-created helper process，宣告 closeout ready 前必須執行 ownership-based external-tool resource closeout check。
- closeout 回報需列出已關閉 / 已清理的 task-owned 或 agent-managed 資源、runtime 可見的釋放數字、保留的 shared / user-owned / other-agent-owned / system-level / unknown 資源與可見度限制。
- 升級鏈把 `v0.3.36` 轉成正式上一版 tag hop，並把 final hop 改為 `v0.3.37 current HEAD`，防止 future release 再漏掉最新正式版到 current head 的升級覆蓋。

### QA

- `qa:release` 守住 closeout core 內的 ownership-based resource closeout wording。
- `qa:upgrade` 覆蓋 `v0.3.36` tag → `v0.3.37 current HEAD` upgrade path。
- package fileCount 預期維持 25；本版不新增 npm package 檔案類型。

### Migration path（v0.3.36 → v0.3.37，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。升級會把 full closeout 核心流程補上外部工具資源收口強制檢查；不會自動終止不明程序、刪除共享 cache、停用工具、修改 browser profile 或改外部工具配置。

## v0.3.36 — 2026-07-04

狀態：已正式發佈。本版把 Adam-AI-Instructions 的「明確推薦下一步」紀律收斂成 Agent Handoff Kit 的通用 runtime 契約，並把本機 `governance-bridge` skill 的可用價值合併回既有 `agent-governance` 規則包，避免另開 public skill 或新增長期治理真源。

### Added

- runtime startup / closeout 契約新增 `推薦下一步` / recommended next-step 欄位：AI 必須直接給出一個建議下一步與簡短原因；只有真正需要使用者抉擇時才列選項。
- `SESSION_HANDOFF` 模板新增 recommended-next-step 欄位、語義錨點與 closeout 對賬要求，避免下一輪 AI 只見一堆待辦而沒有可執行方向。
- `qa:release` 新增 recommended next-step contract 與 governance bridge output contract，將兩個人工發現的盲點轉成發佈前守門。

### Changed

- `communication` 規則包新增清晰推薦下一步紀律，避免把已判斷完成的技術建議包裝成開放式反問。
- `agent-governance` 規則包承接治理打通 workflow：只有目標文件、index、sync registry、相關 workflow、handoff/log 角色與重複真源風險都已處理或明確不適用時，才可標示 `bridged`；部分接合必須標示 `partially bridged`。
- upgrade migration 會以非破壞方式補回舊 handoff / communication pack / governance bridge workflow 所需錨點，保留用戶既有內容。
- 升級鏈加入 `v0.3.35` real fixture，並把 final hop 改為 `v0.3.36 current HEAD`。

### QA

- `qa:packs`、`qa:upgrade`、`qa:release` 覆蓋 recommended-next-step 契約、governance bridge output boundary、舊版本遷移與 user-data preservation。
- 發佈前全面檢會核對：沒有新增 public governance-bridge skill、沒有 Adam 本機路徑、沒有 Codex Desktop-only wording、沒有大型中文 runtime 規則污染，且不把一次性本機 skill 拆成另一套 public governance。

### Migration path（v0.3.35 → v0.3.36，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。升級會補齊 recommended-next-step 欄位與治理打通 workflow 錨點，不會覆寫用戶 handoff 內容、不會新增獨立 governance-bridge skill，也不會自動 commit、push、tag、release 或 publish。

## v0.3.35 — 2026-07-03

狀態：候選發佈版本。本版把真實使用中出現的 MCP、browser、plugin、`node.exe` / `python` helper 資源失控經驗，整理成通用外部工具資源生命週期治理：AI 使用外部工具後要做收尾檢查；可證明是本任務擁有的資源可自動優雅關閉或清理；共享、使用者擁有、系統層、其他 AI agent 可能擁有或 ownership 未明的資源，只可回報證據與建議，未經確認不得終止、刪除、停用或改配置。

### Added

- `integrations` 規則包新增 External Tool Resource Lifecycle，覆蓋 task-owned、agent-managed、shared / user-owned / other-agent-owned / system-level、unknown 四類資源。
- `safety` 規則包新增 Process termination and cache cleanup boundary，明確禁止按通用程序名或工具名大範圍 kill process / 清 cache。
- `RULE_PACKS.md` 新增外部工具資源壓力任務路由，將 MCP / browser / plugin / node / Python helper 殘留問題導向 integrations + safety。

### Changed

- 既有 integrations / onboarding 等 AI-facing runtime 文字清理為英文規則原文；保留必要的使用者可見中文觸發詞與歷史發佈紀錄。
- upgrade repair / release QA / pack scenario QA 加入 resource lifecycle、process cleanup boundary、other-agent-owned ownership boundary 斷言。
- 升級鏈加入 `v0.3.34` real fixture，並把 final hop 改為 `v0.3.35 current HEAD`。

### QA

- `qa:packs`、`qa:upgrade`、`qa:release` 覆蓋外部工具資源生命週期、程序清理邊界、同機其他 AI agent ownership 盲點與舊 pack repair。
- 候選整理包含合理壓力測試：啟動多個 mock node helper，只嘗試處理記錄於本任務 manifest 的 PID；遇到可能 PID reuse / ownership 不明時不終止，改列為人工確認風險。

### Migration path（v0.3.34 → v0.3.35，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。升級會修補 runtime 規則文字與檢查錨點，不會自動終止程序、刪 cache、停用工具或修改使用者外部工具配置。

## v0.3.34 — 2026-07-01

狀態：候選發佈版本。本版修補 AI 代安裝提示在 WhatsApp 轉發時的 URL 邊界問題：公開提示句在 `agent-handoff-kit-ai-install.html` 後加入空格，再接中文逗號，避免逗號被訊息軟件誤判為 URL 一部分。

### Changed

- README、入門頁、實操指南頁與 AI 安裝頁的可複製提示句改為：`請讀取 https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-ai-install.html ，並在這個資料夾安裝或升級 Agent Handoff Kit。`
- `docs/qa/release-grade-qa.md` 與 `scripts/check-release-readiness.mjs` 同步守住新提示句，避免日後回退成逗號貼住 URL。

### QA

- `qa:release` 覆蓋 README / intro / guide / AI install page link sweep 與 AI install page contract。
- WORK registered HTML mirrors 需與 public HTML diff empty，避免 GitHub Pages 教學面與 WORK 鏡像漂移。

### Migration path（v0.3.33 → v0.3.34，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。本版主要修補公開教學與提示文字；runtime 行為與既有治理文件保持相容。

## v0.3.33 — 2026-06-30

狀態：候選發佈版本。本版修補外部工具使用時的盲猜風險：AI 不應憑舊記憶猜 Notion、Google Drive、Obsidian、GitHub、Connector、MCP、CLI、API、URI 或 plugin API 的指令形狀；使用前要先對齊目前 runtime schema、官方文件、官方型別 / sample，或有版本日期的本地 runbook。

### Added

- `integrations` 規則包新增 External Tool Usage Verification Gate：首次使用外部工具、寫入、不可逆操作、API / SDK / CLI / URI / plugin API、或工具錯誤後重試前，必須先核對當前 schema 或官方真源。
- `qa:release` 新增外部工具核實門檻錨點，確保 runtime、knowledge、safety 與 integrations pack 不會退回固定工具名或憑記憶試錯。

### Changed

- `PROJECT_INDEX` 的整合表欄位由 `Credential Location` 改為 `Credential Reference（no value）`，明確只記安全儲存位置、env var name 或 user-managed secret store 類型，不讀取、不貼出、不保存 credential value。
- startup integration probe 改為使用 active runtime 當前暴露的 tool name、description 與 input schema；不再用舊 `mcp__*` 例子當作可執行指令。
- `knowledge`、`safety`、`onboarding` 相關文字改為引用通用核實門檻，而不是寫死某個工具的指令。

### QA

- `qa:packs`、`qa:upgrade`、`qa:release` 已覆蓋 External Tool Usage Verification Gate、credential reference migration、以及舊 PROJECT_INDEX 欄位的非破壞升級。
- 發佈前全面檢必須確認新候選版本號、whatsnew、CHANGELOG、README 與 upgrade chain 全部指向 `v0.3.33`，避免把已發佈 `v0.3.32` source candidate 誤當成可 publish 候選。

### Migration path（v0.3.32 → v0.3.33，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。升級會保留既有治理文件與本地自訂內容；若 `dev/PROJECT_INDEX.md` 仍使用舊 `Credential Location` 欄位，會以非破壞方式改為 `Credential Reference（no value）`，並保留既有整合記錄。

## v0.3.32 — 2026-06-29

狀態：候選發佈版本。本版修補兩個真實使用中暴露的交接治理缺口：明確「收工」被 AI 降級成普通聊天總結，以及中途生成 Markdown / durable artifact 後未入庫、未同步、未合併或未標成臨時證據而變成 orphan。

### Added

- `doctor` 新增 generated Markdown governance checks：fresh install 後若 `docs/`、`outputs/`、root Markdown 或常見參考資料夾出現未登記、未同步、未分類的 Markdown / durable artifact，會直接 fail，並指出 orphan path。
- 核心 runtime 新增 Artifact Governance Gate：任務建立或實質修改 Markdown、generated output、spec、runbook、checklist、guide、research artifact 時，完成前必須分類為真源、參考、流程、公開文件、generated output、草稿、一次性證據或臨時文件，並按角色入庫或標示。
- `agent-governance` 與 `writing` 規則包新增 generated artifact workflow，要求先查是否已有權威家，避免另起爐灶造成 one rule one place 破裂。

### Fixed

- 明確 closeout phrase（例如「收工」「wrap up」「handoff」「Wrap up Agent Handoff」）不得再只回普通總結；runtime 現要求立即進入 full closeout，讀 handoff/log/index，更新必要文件，跑檢查，再顯示 closeout card。
- fresh install 的 `dev/PROJECT_INDEX.md` 不再把 official doctor command 留成 `TBD`，避免補救 closeout 時 AI 誤判「本專案沒有 doctor 腳本」。

### QA

- `qa:prototype` 新增 orphan Markdown dry-run：建立未登記 `outputs/unregistered_design.md` 後，`doctor` 必須 fail 並列出該 path。
- `qa:release` 新增 generated Markdown governance 正反 contract：未登記 generated Markdown 必須 fail；登記到 `dev/PROJECT_INDEX.md` 後必須 pass。
- `qa:upgrade` 鏈式升級 final doctor 會確認 generated Markdown governance check 仍存在，避免舊版升級路徑漏傳播。

### Migration path（v0.3.31 → v0.3.32，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。升級會保留既有治理文件與本地自訂內容；核心 managed block、規則包與項目索引模板會取得 closeout semantic hardening 與 generated artifact governance。若既有項目已有未登記 generated Markdown，升級後 `doctor` 可能提示補登記、合併或標成 temporary / one-time evidence；這是治理修補，不會自動刪除用戶文件。

## v0.3.31 — 2026-06-28

狀態：候選發佈版本。本版把兩類真實跨 agent 問題收斂成可驗收機制：跨 workspace 修改時要留下外部影響提示；本機 shell、臨時腳本、引號、解析器或長文件讀取不完整時，AI 不可反覆盲試或用片段輸出過早下結論。同時補入 public mirror / SEO / 用戶入口瘦身檢查，讓公開流通面與 npm package 邊界更清楚。

### Added

- 核心 runtime 新增 External Impact Note：若本輪工作修改了目前 workspace 以外、但會影響使用者或其他 agent 的 repo / output / runtime，交接必須寫明外部路徑、原因、驗收、未同步風險與下一步。
- `safety` 規則包新增 shell / script parser failure discipline：第一次同類本機腳本或解析器失敗後，必須停下分類失敗層，先做最小可重現腳本與 syntax-only check，再執行寫入；寫入後要讀回 affected files / ranges。
- 核心 runtime 補入長輸出讀取防護：工具輸出被截斷、分頁、只讀 search hit 或只讀摘要時，不得當成全文事實；下判斷前要補讀缺口或標示未核實。
- 新增 public mirror QA，檢查公開流通鏡像只保留 README、GitHub Pages、品牌圖片、npm 執行核心與公開版本說明，並驗證 npm package 邊界、CLI help、fresh init、doctor、upgrade no-op 與本地 tarball 安裝。

### Changed

- `qa:release` 會一併執行 public mirror QA，避免公開 repo、GitHub Pages、維護者材料與 npm package 邊界漂移。
- README、入門頁、指南頁與 AI 安裝頁加入 public mirror / SEO / 影片與導覽調整；維護者材料新增清楚入口，普通用戶路徑與維護者路徑分層。
- 升級鏈新增 v0.3.30 → v0.3.31 current-head 覆蓋，並把 parser failure discipline 納入舊安全規則包的語義修復情景。

### QA

- `qa:packs` 新增 parser failure 情景，驗證停止同類盲試、最小可重現腳本、syntax-only check 與讀回 affected ranges。
- `qa:upgrade` 新增 safety parser failure auto-repair fixture，確認舊安全規則包可在安全語義位置補入新錨點，不用裸字串假通過。
- `qa:release` 新增 cross-workspace External Impact Note、長輸出截斷防護與 public mirror QA 斷言。

### Migration path（v0.3.30 → v0.3.31，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。升級會保留既有治理文件與本地自訂內容；核心 managed block 與安全規則包會在安全合併路徑下更新，以取得跨 workspace 影響提示、parser failure discipline 與長輸出讀取防護。

## v0.3.30 — 2026-06-25

狀態：候選發佈版本。本版修補長任務中途追加要求容易分散成多份文件、聊天片段或交接摘要的問題；同時降低 `doctor` / no-op `upgrade` 成功後把普通任務完成誤導成完整收工的風險。

### Added

- 核心 runtime 新增任務契約變更規則：產品目標、需求、開發清單、驗收規則、非目標、優先序或 scope 在長任務中途改動時，必須先收斂到單一當前任務契約。
- `agent-governance` 規則包新增同一分流：已有 spec / backlog / issue / README / runbook / project index / handoff section 時，先合併到既有權威位置；沒有專門真源時，才落到 `SESSION_HANDOFF` current-state sections。
- README 與實操指南新增「AI 工作規則怎樣運作」說明，讓新手知道 AI 會按任務載入最少必要規則，而不是要求用戶記住內部檔名。

### Changed

- `doctor` 健康狀態與 `upgrade` no-op 成功提示改為：準備結束本輪工作、需要保存交接，或有下一輪必須知道的狀態時，才在 AI 對話輸入「收工」。
- 升級鏈新增 v0.3.29 → v0.3.30 current-head 覆蓋，並把任務契約規則納入 managed core 升級錨點，避免既有用戶升級後仍停留在舊核心規則。

### QA

- `qa:release` 的任務持久化分流驗收新增長任務分批追加產品目標、開發清單與驗收規則的正向場景。
- `qa:release` 新增 CLI 文案防回歸斷言，禁止把健康檢查或 no-op upgrade 的下一步寫成「剛完成任務就收工」。
- `qa:upgrade` 鏈式升級覆蓋到 v0.3.29 tag，再由 v0.3.30 current head 完成最後一跳，並確認 managed core 取得任務契約錨點。

### Migration path（v0.3.29 → v0.3.30，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。升級會保留既有治理文件與本地自訂內容；核心 managed block 會在安全合併路徑下更新，以取得任務契約收斂規則。若項目已有自己的規格或驗收真源，Agent Handoff Kit 應尊重該真源，不會新增通用驗收制度。

## v0.3.29 — 2026-06-18

狀態：候選發佈版本。本版新增一個給 AI 讀的安裝／升級頁，讓非技術用戶只需把一句提示交給能讀寫本機資料夾的 AI agent；同時把「長期治理入庫」與「文件接入 Agent Handoff Kit」分清楚，避免可長期生效的規則、錯誤經驗或 API / MCP / 工具用法只留在 session log 或 handoff。

### Added

- 新增 `agent-handoff-kit-ai-install.html`，作為 GitHub Pages 普通 HTML。用戶可叫 AI 讀該頁，AI 會先顯示並確認目前資料夾，再判斷 fresh install、upgrade dry-run、正式 upgrade、conflict stop 或 doctor。
- `agent-governance` 規則包新增 Long-term Governance Routing。即使用戶沒有說出「寫入長期治理」或「轉成長期機制」，只要內容本身要求 future sessions should remember、修正 recurring AI mistake，或定義 reusable API / MCP / tool-use pattern，AI 都不可只寫入 `SESSION_LOG`、`SESSION_HANDOFF` 或 prompt 副本。

### Changed

- README、intro HTML、guide HTML 改為 AI 安裝頁優先；直接 `npx` 指令保留為手動入口。
- 「接入 Agent Handoff Kit」維持原意：只處理重要文件避免變成 orphan。非文件的長期規則、錯誤經驗與工具用法改走長期治理入庫。

### QA

- `qa:packs` 新增三個 long-term governance use cases：recurring AI mistake、API / MCP / tool pattern、未命中 exact trigger 的內容式分類。
- `qa:release` 新增 AI install page contract，確認頁面要求資料夾確認、conflict 停手、完成後 doctor，並禁止 commit / push / tag / npm publish / GitHub Release。
- `qa:release` 新增終端機優先舊語句防回歸檢查，防止 README / intro / guide 從 AI 安裝頁優先漂回手動終端機優先。
- 發佈前全面檢 PASS：`qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release` 均通過；正式報告在 `docs/qa/full-audit-ai-install-long-term-governance-candidate-2026-06-18.md`。
- `test-fixtures/v0.3.28` 已加入，v0.3.29 的 prior-version upgrade smoke 可用正式上一版作前置樣本。

### Migration path（v0.3.28 → v0.3.29，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。本版主要新增 GitHub Pages 安裝輔助頁、公眾文案與規則包路由；升級會保留既有治理文件與本地自訂內容。若你是新手，也可以在目標資料夾打開能讀寫本機資料夾的 AI agent，叫它讀 `https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-ai-install.html` 並在這個資料夾安裝或升級。

## v0.3.28 — 2026-06-07

狀態：候選發佈版本。本版把「治理打通」的公眾入口改得更直白：新手可以直接說「把文件接入 Agent Handoff Kit」，同時保留「治理打通」與英文觸發語作別名。

### Added

- 新增中文觸發語：「把文件接入 Agent Handoff Kit」、「接入 Agent Handoff Kit」、「掃描未接入 Agent Handoff Kit 的重要文件」。
- README、intro HTML、guide HTML 改以新版直白用語作主入口，並保留「治理打通」作舊說法。

### Fixed

- intro HTML 正文中的 `治理打通` highlight 原本只有標記、沒有有效樣式；本版補上正式 highlight 樣式。
- intro HTML 的「兩種常見用法」改為兩組入口：指定文件與掃描候選，避免把中文、英文與掃描三行誤讀成三種不同用法。

### QA

- `qa:packs` 更新治理打通情景矩陣，確認新版中文觸發語與舊觸發語都會路由至 `agent-governance`。
- `qa:upgrade` 新增舊治理打通路由列遷移情景，確認舊用戶升級時會非破壞性補入新版中文觸發語。
- `qa:release` 更新 Governance Bridge contract，防止 README / HTML 與 runtime 支援能力漂移。
- `test-fixtures/v0.3.27` 已加入，v0.3.28 的 prior-version upgrade smoke 可用正式上一版作前置樣本。

### Migration path（v0.3.27 → v0.3.28，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。升級會保留既有治理文件與本地自訂內容；若項目已有舊版治理打通路由，工具會在可安全判斷時補入新版中文觸發語。舊說法「治理打通 <檔案>」仍可用。

## v0.3.27 — 2026-06-07

狀態：候選發佈版本。本版新增「治理打通」標準能力，讓新建的重要文件、真源、清單、流程與 runbook 不再只停留在局部位置，而是能被下一個 AI 透過項目索引、同步登記、相關流程、交接與紀錄穩定發現和維護。

### Added

- `agent-governance` 規則包新增 Governance Bridge Workflow。使用者可說「治理打通」、「bridge governance」、「connect this document to governance」或「scan for unbridged governance documents」，讓 AI 檢查目標文件、`PROJECT_INDEX`、`DOC_SYNC_REGISTRY`、相關 workflow / guide / runbook、`SESSION_HANDOFF`、`SESSION_LOG` 與重複真源風險。
- `runtime-core/RULE_PACKS.md` 新增治理打通自然語言路由，讓中文與英文觸發語都載入 `agent-governance`，不需要新手記內部規則名稱。
- README、intro HTML、guide HTML 新增公眾使用說明，解釋用途、何時使用、指定文件與 repo-wide 掃描示例，以及不會自動刪除、改名或合併文件的邊界。

### QA

- `qa:packs` 新增 Governance Bridge Scenario Matrix，覆蓋四個情景：新 stock list 真源、production guide / runbook、repo-wide 未接合文件掃描、重複真源風險。
- `qa:upgrade` 新增治理打通遷移 fixture，確認舊項目升級時會非破壞性補上 `RULE_PACKS` 路由與 `agent-governance` workflow，同時保留自訂列與既有內容。
- `qa:release` 新增 Governance Bridge contract，要求發佈前全面檢列出四個情景的 automated PASS 證據；不能只寫「治理打通 PASS」。
- 發佈前全面檢 PASS：`qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release` 均通過；package fileCount 維持 25。
- `test-fixtures/v0.3.26` 已加入，v0.3.27 的 prior-version packed upgrade smoke 可用正式上一版作前置樣本。

### Migration path（v0.3.26 → v0.3.27，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。升級會保留既有 handoff、log、index、decisions 與 rule pack 內容；能安全補上的治理打通路由與 workflow 會以非破壞性方式合併。升級後可在 AI 對話中直接說「治理打通 <檔案>」或「掃描 repo 有沒有未接合文件」。

## v0.3.26 — 2026-06-05

狀態：候選發佈版本。本版修補兩個真實 runtime 回饋揭發的 upgrade / doctor 問題：合法 handoff lifecycle 敘述不應因句中含 `pending` 被誤判為未填欄位；規則包被放到錯誤層級時，工具應給出可定位診斷，而不是只留下模糊缺段。

### Fixed

- `handoff lifecycle consistency` 改為只把欄位開頭的 placeholder / unresolved token 視為未完成狀態，不再掃描整段自由敘述中的 `pending`、`not pending` 或「由 pending 改成 recorded」等合法語句。
- `upgrade` 從舊版手寫交接資料遷移時，保留使用者既有 lifecycle 敘述；只要語意已完成且不是欄位開頭 placeholder，升級後 `doctor` 應通過。`AGENTS.md` 內容已是最新但缺 managed-core marker 時，upgrade 不再過早 skip，會補回 marker block。
- 規則包錯層狀態新增診斷與回歸守門：若 rules 檔疑似放錯層，`doctor` / `upgrade` 會指出 wrong-layer hints，正確 `dev/rules/` copy 仍由工具補齊或檢查。

### QA

- `qa:upgrade` 新增 v0.3.11-style lifecycle narrative regression，確認欄位敘述中段含 `pending` 不會令 upgrade 後 self-check 失敗。
- `qa:upgrade` 新增 misplaced rule layer regression，確認錯層 rules 檔會有清楚診斷，且升級會補回正確路徑而不刪錯層副本。
- `qa:release` 新增直接 lifecycle consistency regression，鎖定本次 false-positive 根因，而不是只靠完整 closeout 的 `yes` 欄位短路。
- 發佈前全面檢 PASS：`qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release`、`npm pack --dry-run --json` 均通過；package fileCount 維持 25。
- `test-fixtures/v0.3.25` 已加入，v0.3.26 的 prior-version packed upgrade smoke 可用正式上一版作前置樣本。

### Migration path（v0.3.25 → v0.3.26，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。本版不改用戶文件結構；主要修補 `doctor` / `upgrade` 對既有 handoff 敘述與錯層規則包的判斷。若你的 lifecycle 欄位已用自然語言說明「曾是 pending、現在已記錄」，升級後不應再被誤判為未解待辦。
## v0.3.25 — 2026-06-03

狀態：正式發佈版本。本版修補任務完成後過度進入完整交接的流程問題：AI 應先按文件角色判斷是否真的有下一輪必須知道的持久事實；普通任務完成、草稿迭代、例行檢查通過，不應自動重生整套交接文件。

### Fixed

- 核心 runtime 新增任務持久化分流：無持久事實時不寫治理檔；有下一輪必須知道的事實時只做輕量保存；只有明確收工、交接、外部同步、發佈、工具即將停止或同等場景，才完整 closeout。
- 文件角色集中在核心 runtime 定義：目前狀態進 `SESSION_HANDOFF`，可追溯紀錄進 `SESSION_LOG`，新檔案與真源進 `PROJECT_INDEX` / `DOC_SYNC_REGISTRY`，長期經驗與機制進 `PROJECT_DECISIONS` 或相應 rule pack。
- `packs/agent-governance.md` 只引用核心分流判斷，不複製三層門檻，避免同一規則在兩處漂移。
- README、intro HTML、guide HTML 只同步版本與用戶操作語句，不把內部治理分類寫成新手說明。

### QA

- `qa:release` 新增 Task Persistence Gate contract：檢查核心 runtime 的正向條件、反向條件、文件角色落點，以及 agent-governance pack 是否只引用單一真源。
- 發佈級 QA 新增 Task Persistence Gate Sweep：要求人工終讀草稿未拍板、新 URL / 本機來源、用戶要求把錯誤經驗轉成機制三類場景。
- 反向檢查確認 README、intro HTML、guide HTML 沒有暴露內部分流術語，亦沒有把每個小任務完成寫成完整收工。
- `docs/qa/full-audit-task-persistence-gate-2026-06-03.md` 記錄 source-candidate full audit；`docs/qa/full-audit-v0.3.25-candidate.md` 記錄本版發佈前全面檢。
- 發佈前全面檢 PASS；發佈後驗證 7/7 PASS：GitHub Release metadata、npm latest / fileCount、fresh published install、published `--help` / `init` / `doctor`、以及 v0.3.24 → v0.3.25 published-package upgrade + sequential doctor 均通過。

### Migration path（v0.3.24 → v0.3.25，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。本版主要更新 AI runtime 行為與驗收；用戶原有 handoff、log、index、decisions 與 rule pack 內容會按既有非破壞性升級策略保留。升級後照常用「開工」開始；準備結束本輪工作時才說「收工」。

## v0.3.24 — 2026-06-02

狀態：正式發佈版本。本版修補真實 runtime 揭發的 `upgrade` no-op 假成功問題，並把修補重心提升到源頭寫入標準：新版本之後，交接資料必須使用同一套 Agent Handoff Kit marker standard；舊資料可安全遷移才自動修，不能安全判斷用戶意圖時才交給 AI。

### Fixed

- `upgrade` no-op 分支不再只檢查局部 handoff lifecycle；改為在同一進程內共用 `runDoctor()`，避免外部子程序或 runtime 權限差異令健康檢查失真。
- 若 no-op upgrade 遇到可安全修復的 Kit-owned 結構、熱層污染或 prompt mirror 問題，CLI 會自動修復並重新跑 `doctor`。
- 若 no-op upgrade 的完整 `doctor` 仍失敗，而且問題不是工具可安全自修的類型，CLI 會明確輸出「Kit 檔案已是最新，但完整 doctor 健康檢查未通過」，顯示 doctor 證據，並以非零狀態結束。
- 實質升級路徑不再於 `doctor` 前印「升級完成」；中途只說「Kit 檔案已更新」，真正完成只由 `doctor` 通過後的「升級驗收完成」表示。
- 健康 no-op 項目仍保持短輸出；只有 `doctor` 通過時才會顯示「你已經是最新版本，沒有檔案需要建立或合併」的成功語氣。
- `SESSION_LOG` 新增最低機器邊界：`ack:section:session-log-preamble`、`ack:section:session-log-entry-template`、`ack:log-entry:start/end`。新 closeout 寫入必須用統一 marker；舊 heading fallback 只作舊資料遷移 / repair，不作新正常路徑。
- 核心 closeout 寫入合同明確收斂為一套 marker standard：`ack:section:*`、`ack:field:*`、`ack:log-entry:start/end`、managed-core BEGIN/END。這是今版的治理根因修補，不新增平行治理文件。

### QA

- `qa:release` 新增 no-op full-doctor gate 情景：handoff lifecycle 失敗、opening message schema 失敗、handoff temperature boundary 失敗三類都必須阻止 `upgrade` 報成功。
- 發佈級多情境表新增通用 no-op auto-repair 情景，確認解法不綁定任何單一 runtime 目錄、專案名稱或一次性 log。
- `qa:upgrade` 鏈式升級必須把舊 `SESSION_LOG` 非破壞性遷移到統一 marker standard，並保留既有 log 內容；測試驗收改看最後結構與 `doctor`，不再硬綁單次 `merged: 1`。
- 真實 runtime 回饋只作證據來源；提煉後的修補以通用狀態類型驗收：健康 no-op 必須通過、可安全自修的 Kit-owned drift 必須自動修、需要判斷用戶意圖的狀態不得假成功。
- 發佈前全面檢 PASS；發佈後驗證 7/7 PASS：GitHub Release metadata、npm latest / fileCount、fresh published install、published `--help` / `init` / `doctor`、以及 v0.3.23 → v0.3.24 published-package upgrade + sequential doctor 均通過。

### Migration path（v0.3.23 → v0.3.24，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。工具會盡量把舊格式遷移到統一 marker standard，並用完整 `doctor` 判斷項目健康。若剩下的問題需要判斷用戶意圖，CLI 會列出位置與修復 prompt；請交給能讀寫該資料夾的 AI 按 doctor 失敗項修補，不要重裝覆寫。

## v0.3.23 — 2026-06-02

狀態：正式發佈版本。本版修補跨 session 交接被壓縮後的來源脈絡與歷史證據污染問題：研究導向長期決策必須保留可追溯 evidence chain；一次性任務證據、舊版本狀態、build / QC / release evidence 不可再留在下一輪開工的 current state、Durable Anchors、Next Priorities 或 opening message 中驅動行動。

### Fixed

- `doctor` 新增 research decision trace checks：若 `dev/PROJECT_DECISIONS.md` 出現 research-derived decision 或 `Evidence chain:`，必須包含完整 evidence chain，且 `Source=source:<id>` 必須已登記在 `dev/PROJECT_INDEX.md`。
- `doctor` 新增 current-state evidence boundary checks：檢查 `dev/SESSION_HANDOFF.md` 與 `START_NEXT_SESSION_PROMPT.txt`，阻擋一次性 release / build / QC evidence、舊 npm latest 狀態、source token 或 research evidence chain 污染當前交接。
- `SESSION_HANDOFF` template 新增 `Persistence routing checked` 欄位；`SESSION_LOG` template 新增 `Evidence disposition` 欄位，讓 closeout 能明確分辨 current state、trace evidence、project index、project decisions 與 rule pack 的落點。
- `PROJECT_DECISIONS` template 新增 research-derived decision evidence-chain 格式與邊界說明，避免原始 build / upload / QC evidence 被誤放入長期決策檔。
- 開工與收工卡片新增明確版本顯示來源：AI 必須從 `dev/PROJECT_INDEX.md` 的 `Agent Handoff Kit template version` 讀取版本；讀不到時顯示 `version unverified`，不得把 `v<version>` 佔位符直接輸出。

### QA

- `qa:release` 新增 research trace 正反 fixture 與 handoff evidence-boundary 負面 fixture。
- Product Journey Matrix 新增 `Task evidence → closeout disposition → next session startup` full-audit 場景，確認任務證據可保留，但不可拖住下一輪開工。
- `qa:upgrade` 鏈式升級改為 v0.3.22 已發佈 hop + v0.3.23 current HEAD hop，並驗證舊專案可非破壞性補齊 `SESSION_HANDOFF`、`SESSION_LOG` 與 `PROJECT_DECISIONS` 新欄位 / 新錨點。
- `qa:release` 新增 runtime core 錨點，確認開工／收工版本顯示規則仍存在，避免模板回到只印佔位符或漏印版本。

### Migration path（v0.3.22 → v0.3.23，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。升級會保留既有 handoff、log、index、decisions 與 rule pack 內容；缺少的新欄位或可定位 Kit 錨點會以備份加 migration report 的方式非破壞性補回。升級後請執行 `doctor`；若它指出當前交接混入歷史證據，請讓 AI 在 closeout 中把證據移回 `SESSION_LOG`、`PROJECT_INDEX` 或 `PROJECT_DECISIONS`。

## v0.3.22 — 2026-06-01

狀態：正式發佈版本。本版修補真實 runtime upgrade 測試揭發的 root-fix：舊項目升級時，若缺的是 Kit 自己可定位的維護文字，工具應非破壞性補回正確語義位置並讓 `doctor` 穩定通過；只有結構標記損壞、管理區重名，或安全規則語義不可判斷時才停手。

### Fixed

- `doctor` 與 `upgrade` 不再把裸 anchor 字串出現在錯誤位置視為有效狀態，避免檔尾補字令檢查假性通過。
- `requiredAnchors` 收斂為 single upgrade contract：snippet、合法位置判斷、缺失 / 錯位分類與修補策略由同一組 contract / strategy 管理，避免 CLI、測試與修補流程各自維護第二套規則。
- `upgrade` 可自動修補可信 Kit 維護區內的 anchor drift，包括 `dev/SESSION_HANDOFF.md`、`dev/SESSION_LOG.md`、`dev/PROJECT_DECISIONS.md`、`dev/rules/safety.md`、`dev/rules/integrations.md` 與 `dev/rules/onboarding.md` 的可定位缺段。
- 高風險 rules pack 仍維持保護線：若 `dev/rules/safety.md` 的安全規則被改成自訂語義、`dev/rules/integrations.md` heading 重名或不可定位、`dev/rules/onboarding.md` scenario skeleton 不可信，工具會以 `conflict` 停手，不會覆寫。

### QA

- `qa:upgrade` 新增 upgrade quality matrix，覆蓋版本 metadata、功能 anchor 與 post-upgrade `doctor` 穩定性三軸。
- 負面 fixture 覆蓋錯位 handoff anchor、假 `PROJECT_INDEX` 版本列、舊 repair marker、`SESSION_LOG` 既有紀錄保留、安全規則自訂 row、integrations 表頭已被改動 / 重名、onboarding skeleton 不可信等情境。
- `qa:release` 的 CLI scenario branching 增加 4e handoff continuity auto-repair，並把 anchor drift auto-repair 由單一 bug regression 提升為產品級升級旅程驗收。

### Migration path（v0.3.21 → v0.3.22，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。如想先看會改甚麼，可先執行 `upgrade --dry-run`；預演不會寫入檔案。正式升級後，工具會保留用戶內容、建立備份與 migration report，並在可判斷時補回 Kit 維護文字；真正不可信的結構會停手交由 AI 或人工審視。

## v0.3.21 — 2026-05-31

狀態：正式發佈版本。本版把收工時的長期維護改為「每次短檢、命中才完整整理」，降低長期使用時 AI 被過重流程拖慢的風險。

### Changed

- Runtime closeout 規則改為每次先做 maintenance trigger check，而不是每次都完整整理 `SESSION_LOG` 與 `PROJECT_DECISIONS`。
- `SESSION_LOG` 完整整理只在 N≥11、主檔超過 1500 行，或 10 次收工兜底時啟動。
- `PROJECT_DECISIONS` 維護保留決策數 ≥30、任務方向演進、多方案架構取捨、跨 session 模式與用戶追問歷史理由等觸發條件。
- README 與治理規則包同步說明：重大決策可即時記錄，不必等到收工才回想。

### QA

- `qa:release` 加入新錨點，確認 runtime core、SESSION_LOG template 與 release-grade QA 都保留 trigger check 與 10-closeout backstop 口徑。
- 保留舊 `SESSION_LOG` anchor 相容性，避免既有 doctor schema check 因 wording 變更而誤報缺段。

### Migration path（v0.3.20 → v0.3.21，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。升級後，收工仍會保存交接；長期整理會在命中條件或定期兜底時才完整執行。

## v0.3.20 — 2026-05-31

狀態：正式發佈版本。本版修正 README、CLI help 與介紹頁的入口說明，避免新手把 `upgrade --dry-run` 誤解成已完成升級。

### Changed

- README 的「常見入口」改為三個正式入口：`init`、`upgrade`、`doctor`。
- 「已安裝舊版，或已有 AI 記憶文件？」移到 README 前段，讓舊用戶不用在長文底部才找到升級路徑。
- CLI help 與安裝後提示同步改為：舊項目正式執行 `upgrade`；只有想先預覽時才使用 `upgrade --dry-run`。
- 介紹頁第 03 區改為「開工接上狀態，收工留下交接」，不再把流程描述成只需記住收工。

### QA

- `qa:release` 新增守門：README / CLI 常見入口必須是 `init`、`upgrade`、`doctor`；`upgrade --dry-run` 只能作升級前預演，且必須明示不會完成升級。
- Cross-surface wording check 新增守門：介紹頁第 03 區必須同時說明「開工」與「收工」，不得回到收工-only 文案。

### Migration path（v0.3.19 → v0.3.20，backward-compat preserved）

既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。若只想先看會改甚麼，才加 `--dry-run`；預演不會寫入檔案，也不代表升級已完成。

## v0.3.19 — 2026-05-30

狀態：正式發佈版本。本版修正公開說明仍把長開工句當成主入口的問題。

### Changed

- README、CLI 安裝後輸出、介紹頁與操作指南改為短開工入口優先：AI 已在專案資料夾內時，用 `Start Agent Handoff` 或「開工」開始接力。
- 帶路徑啟動句只保留給「AI 尚未指向專案資料夾」的場景：`Work in <project root>. Read AGENTS.md first, then Start Agent Handoff...`。
- 收工說明改為強調 AI 會同步更新 `START_NEXT_SESSION_PROMPT.txt`，下一輪由 AI 自己讀取，不要求用戶手動打開或貼回整份提示檔。
- Runtime closeout 規則改為 final response 顯示短開工入口與帶路徑 fallback，不再把舊長句當成唯一穩定句。

### QA

- `qa:prototype` 與 `qa:release` 改為守短入口、帶路徑 fallback、local-agent 支援邊界、收工入口與「某某開工 / 某某收工」歧義保護。
- Current public surface 新增舊長句與「固定開工句 / 貼回提示」殘留檢查，避免 README、HTML 或 CLI 再漂回舊流程。

### Migration path（v0.3.18 → v0.3.19，backward-compat preserved）

既有項目仍可用同一套檔案。升級後，用戶日常只需在已打開專案的 AI agent 輸入 `Start Agent Handoff` 或「開工」；若 AI 尚未指向資料夾，才使用帶路徑啟動句。`START_NEXT_SESSION_PROMPT.txt` 仍由 AI closeout 自動同步。

## v0.3.18 — 2026-05-30

狀態：正式發佈版本。本版收緊 Agent Handoff Kit 的工具適用邊界，避免用戶把它誤解成普通 web chat 可用的一段 prompt。

### Added

- README 與 onboarding HTML 明確列明：本工具適合能讀寫本機專案資料夾的 agentic AI 工具，例如 Claude Code、OpenAI Codex、Gemini CLI、Google Antigravity；不適合沒有本機檔案讀寫能力的普通 web chat AI。
- CLI 安裝後輸出新的固定開工句：先讀 `AGENTS.md`，再打開 `START_NEXT_SESSION_PROMPT.txt`，由 prompt 檔承載初次新手引導或下一輪接力狀態。
- Runtime `AGENTS.md` 新增清晰的短入口：`Start Agent Handoff` /「開工」用於開始接力，`Wrap up Agent Handoff` /「收工」用於保存交接；「某某開工 / 某某收工」等帶其他上下文的說法須先反問確認。

### Changed

- 初次安裝的 `START_NEXT_SESSION_PROMPT.txt` 內容改為 first-use onboarding prompt；收工後仍由 `dev/SESSION_HANDOFF.md` 生成真正的下一次交接 prompt。
- closeout 核心規則改為：先重生並驗證 `START_NEXT_SESSION_PROMPT.txt`，final response 顯示穩定 bootstrap 句，不再要求用戶手動複製整份 stateful prompt。
- README 的「日常開工」改為一條固定句，第一次安裝後與之後每次接力都使用同一入口。
- 快捷詞只是用戶入口提示；執行優先級與歧義判斷只以 runtime `AGENTS.md` 為單一真源，避免 README、CLI、HTML 各自變成規則來源。

### QA

- `qa:prototype` 與 `qa:release` 改為守新產品邊界：CLI / README / HTML 必須包含 local-agent 支援範圍、`START_NEXT_SESSION_PROMPT.txt` bootstrap 句、快捷詞入口提示與「某某開工 / 某某收工」歧義保護錨點。
- 保留 prompt mirror 檢查：`START_NEXT_SESSION_PROMPT.txt` 仍必須與 `dev/SESSION_HANDOFF.md` 的 opening message 一致。
- 發佈前全面檢與發佈後 7/7 artifact smoke 均已通過；npm latest 為 `0.3.18`，package fileCount 25。

### Migration path（v0.3.17 → v0.3.18，backward-compat preserved）

既有項目升級後不需要手動複製整份 `START_NEXT_SESSION_PROMPT.txt`。日常開新 AI 對話時貼固定 bootstrap 句即可；AI 會自己讀取 prompt 檔。若使用的是不能讀寫本機專案資料夾的普通 web chat AI，該工具不屬於 Agent Handoff Kit 的支援場景。

## v0.3.17 — 2026-05-30

狀態：正式發佈版本。本版修正真實升級流程的輸出過長問題：`upgrade` 成功後不再把跨版本 `docs/whatsnew` 全文直接印在 CLI 內。

### Fixed

- `upgrade` 成功訊息改為短流程：確認升級完成、保留原本 AI 工作方式、提供 GitHub Release 連結，然後立即進入自動 `doctor` 驗收。
- 移除成功流程中的 inline 版本說明全文，避免用戶在「只想完成升級」時被多個版本的詳細變更淹沒。
- 發佈前場景驗收新增禁止條件：substantive upgrade output 不得再出現「本次升級涵蓋」、markdown 版本標題或「本版新加了甚麼」長篇 release notes 內容。

### QA

- `scripts/check-release-readiness.mjs` 的 scenario 3a / 3b / 3c 已更新，守住升級成功輸出降噪。
- `docs/qa/release-grade-qa.md` 的 CLI scenario contract 已改為：版本詳情不在升級流程內展開；詳細內容由 GitHub Release 承接。
- `qa:release` 已加入正向短輸出守門：upgrade success narrative 必須 ≤ 8 條非空行、≤ 430 字，且輸出版本要對齊 package version；另加入 source contract，確認 CLI 不再保留 `printWhatsnew` 舊路徑。
- `qa:release` 會用真正 packed tarball 安裝後跑 v0.3.16 fixture upgrade + doctor，並確認 installed package 不含 `docs/whatsnew/`。
- package fileCount 41 → 25：`docs/whatsnew/` 不再打入 npm package，版本說明保留在 repo / GitHub Release 材料；新增 `docs/whatsnew/v0.3.17.md` 只作發佈敘事來源。本輪驗收已覆蓋 `qa:release`、`qa:upgrade`、`npm pack --dry-run --json`、public HTML mirror 與 WORK current-state sync。
- 發佈後驗證 7/7 PASS：GitHub Release metadata、npm latest / fileCount、fresh published install、published `--help` / `init` / `doctor`、以及 v0.3.16 → v0.3.17 published-package upgrade + sequential doctor 均通過。

### Migration path（v0.3.16 → v0.3.17，backward-compat preserved）

- 既有項目不用重裝；升級流程只改輸出長度，不改文件合併語意。
- 若用戶想看詳細改動，CLI 只提供 GitHub Release 入口；不在 installer / upgrade 流程中插入長篇版本說明。

## v0.3.16 — 2026-05-29

狀態：正式發佈版本。本版修正 closeout prompt 可能只在 final response 表面出現、未先持久化到 `START_NEXT_SESSION_PROMPT.txt` 的第三真源風險。

### Fixed

- 調整 `runtime-core/AGENTS.core.md` full closeout 次序：先由 `dev/SESSION_HANDOFF.md` 的 fenced opening message 重生 `START_NEXT_SESSION_PROMPT.txt`，再讀回或跑 prompt mirror check，最後才把讀回內容放入 final response。
- 明確禁止把 final response 另寫成第三份 next-session prompt；final response 只能展示已持久化並讀回的 prompt copy。
- 舊核心升級驗收同步加守門：升級後的 core 必須含 read-back discipline 與 third-source guard，且不得殘留「先表面輸出、後重生 prompt」的舊次序。

### QA

- `docs/qa/release-grade-qa.md` 新增「收工三面同源驗收」，把 handoff、`START_NEXT_SESSION_PROMPT.txt`、final response 三面同源列入發佈前檢查。
- `scripts/check-release-readiness.mjs` 新增 runtime core 必含 read-back / third-source guard 的斷言，並擋回舊 closeout 次序。
- `scripts/check-upgrade-safety.mjs` 新增舊核心升級後的 closeout read-back discipline regression。
- package fileCount 40 → 41：新增 `docs/whatsnew/v0.3.16.md`。本輪發佈前驗收已覆蓋 `qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release`、`qa:prompt-mirror`、HTML mirror hash、`npm pack --dry-run --json` 與 `git diff --check`。
- 發佈後驗證 7/7 PASS：GitHub Release metadata、npm latest / fileCount、fresh published install、published `--help` / `init` / `doctor`、以及 v0.3.15 → v0.3.16 published-package upgrade + sequential doctor 均通過。

### Migration path（v0.3.15 → v0.3.16，backward-compat preserved）

- 既有項目不用重裝；可先執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run` 預覽。
- 若預演沒有 conflict，再執行正式 `upgrade`。
- 升級後，下一次 full closeout 會按新次序持久化並讀回 `START_NEXT_SESSION_PROMPT.txt`；普通 session 中途 `doctor` 對便利副本落後仍只作提醒。

## v0.3.15 — 2026-05-29

狀態：正式發佈版本。本版修正 Jay 真實舊項目在 v0.3.14 升級後仍被同一次自動 `doctor` 擋住的 lifecycle placeholder 遷移缺口。

### Fixed

- 修正 `upgrade` 在「舊版本 `dev/PROJECT_INDEX.md` metadata + 既有 `dev/SESSION_HANDOFF.md` lifecycle 欄位仍為 `TBD` + handoff 已有 substantive Completed / Validation 內容」組合下只更新 metadata、沒有修正 lifecycle placeholder 的問題。現在這類舊 placeholder 會被有界重分類為 `Reclassified at upgrade`，避免工具先顯示升級完成、再由同一次自動 `doctor` 報 `handoff lifecycle consistency` 失敗。
- 保持 v0.3.8 起建立的邊界：若項目已是最新版且零檔案需合併，handoff lifecycle placeholder 仍會被視為 AI closeout 待核對狀態；本修補只適用於 root template version 明確落後於目前 CLI 的 upgrade migration 路徑。

### QA

- `scripts/check-upgrade-safety.mjs` 新增 Jay 類 regression：先製造舊 metadata row，再保留既有 lifecycle marker 的 `TBD` 值與 substantive handoff content，要求 upgrade 後自動 self-check pass。
- `scripts/check-release-readiness.mjs` 新增 scenario 3c：把同一組合納入發佈前 semantic scenario branching，並要求 output 含 `reclassify stale lifecycle placeholder`、`升級驗收完成`，不得再出現 `handoff lifecycle consistency` missing 或 `status: failed`。
- package fileCount 39 → 40：新增 `docs/whatsnew/v0.3.15.md`。本輪發佈前全面檢覆蓋 `qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release`、`npm pack --dry-run --json` 與 `git diff --check`。

### Migration path（v0.3.14 → v0.3.15，backward-compat preserved）

- 舊項目不用重裝。若 lifecycle 欄位是舊模板 placeholder 且項目 metadata 落後，upgrade 會非破壞性重分類該欄位；既有 handoff 工作紀錄仍保留。
- 若 handoff 內容本身真的完成事項與下一步互相矛盾，仍需 AI 在 closeout 時整理；installer 不會猜測專案內容真相。

## v0.3.14 — 2026-05-29

### Fixed

- 修正舊版項目跨版本升級時，migration 自己補入 `TBD` lifecycle 欄位，然後同一次升級後自動 `doctor` 又拒絕該欄位的自相矛盾問題。
- `dev/SESSION_HANDOFF.md` 的 lifecycle migration 現在會寫入明確的重新分類值，說明此欄位由升級補入，下一次 closeout 再核對；不再把舊 handoff 的既有內容誤判成升級失敗。

### QA

- `qa:upgrade` 新增 v0.1.7 substantive handoff regression：先用 v0.1.7 CLI 建立舊 root，再注入已完成工作與驗收內容，最後用 current HEAD 升級並要求自動 `doctor` 通過。
- `qa:packs` 與 `qa:release` 新增 rules / packs 路由與 durable-home scope 守門，確認自然語言任務能導向相應 pack，且可重用操作程序會進既有 rule pack 或 registered reference。
- package fileCount 37 → 39：新增 `docs/whatsnew/v0.3.14.md` 與 runtime 共用 prompt mirror 抽取 helper；source repo 另新增固定 prompt mirror 檢查器，防止未錨定 fenced-block 或換行符差異造成假 mismatch。

### Migration path（v0.3.13 → v0.3.14，backward-compat preserved）

- 既有項目不用重裝；可先執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run` 預覽。
- 若預演沒有 conflict，再執行正式 `upgrade`。
- 升級後自動 `doctor` 若仍指出缺失，請把完整輸出交給 AI 修補；不要用重裝覆寫既有內容。

## v0.3.13 — 2026-05-29

### Fixed

- `upgrade` 後自動 `doctor` 若遇到 anchor 缺失，現在會列出缺失檔案、檢查名稱與缺少文字，並提供新手可照做的 AI 修補步驟；不再把正式升級後的失敗導回 `upgrade --dry-run`。
- `START_NEXT_SESSION_PROMPT.txt` 是 closeout 便利副本，不再作為 blocking anchor check；若它只是落後於 `dev/SESSION_HANDOFF.md`，普通 `doctor` 只應提醒，不能令升級自動檢查失敗。
- `agent-governance` pack 與核心持久化流程補明：可重用操作程序應歸入相關 rule pack 或已登記 reference，不應只寫入 handoff / log 當作完成；新 runbook 是最後手段。
- package fileCount 36 → 37：新增 `docs/whatsnew/v0.3.13.md`。

### QA

- `qa:release` 新增兩個真實旅程場景：正式升級合併 `AGENTS.md` 但便利副本仍舊時只可 warning；正式升級後若保留檔案真的缺 anchor，必須顯示精準缺失與非破壞性修補步驟。
- `qa:packs` 擴充 `agent-governance` pack 守門，防止 durable runbook-like knowledge 繞過既有 pack / reference 歸位。

### Migration path（v0.3.12 → v0.3.13，backward-compat preserved）

- 既有項目可直接執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade`。
- 若升級後自動檢查真的發現 anchor 缺失，請按 CLI 顯示的缺失檔案與缺少文字交給 AI 非破壞性修補；不要回頭重跑 `upgrade --dry-run`。

## v0.3.12 — 2026-05-28

狀態：正式發佈版本。本版本修正持續使用一段時間後，普通 `doctor` 將下次開工提示便利副本落後誤判為項目失敗的問題。

### 本版對用戶有甚麼價值

- `doctor` 不再要求 `START_NEXT_SESSION_PROMPT.txt` 在 session 中途即時 mirror `dev/SESSION_HANDOFF.md`。
- 如果只有便利副本落後，`doctor` 會顯示提醒並保持 `status: passed`；真正需要處理的是下一次 full closeout。
- closeout 規則不放寬：收工完成前仍要由 handoff 的 fenced opening message 重生便利副本。
- 發佈級 QA 新增中途 handoff 演化 fixture，防止同類誤判再次回歸。

### Changed

- `bin/agent-handoff-kit.mjs` 將 prompt mirror drift 分成阻擋與提醒：handoff 不可讀、便利副本不可讀、opening message 缺失仍是阻擋；單純便利副本落後改為 warning。
- `runtime-core/AGENTS.core.md` 與 `runtime-core/PROJECT_INDEX.md` 對齊 closeout-time regenerate 語意，避免把普通 `doctor` 誤用成 closeout-ready gate。
- `scripts/check-release-readiness.mjs` 新增 in-session prompt convenience drift fixture：修改 handoff opening message 而不更新便利副本時，普通 `doctor` 必須通過並說明收工時才重生。
- `docs/qa/release-grade-qa.md` 與 README 補明 `START_NEXT_SESSION_PROMPT.txt` 是便利副本，不是 session 中途健康阻擋條件。
- package fileCount 35 → 36：新增 `docs/whatsnew/v0.3.12.md`。

### Migration path（v0.3.11 → v0.3.12，backward-compat preserved）

- 既有項目不用重裝；可先執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run` 預覽。
- 若預演沒有 conflict，再執行正式 `upgrade`。
- 升級後跑 `doctor`：若只看到提示便利副本落後，可繼續工作，並在完成任務後請 AI 執行「收工」。

## v0.3.11 — 2026-05-25

狀態：正式發佈版本。本版本整理 v0.3.10 發佈後的用戶旅程債務，把已通過的人工實測與文件修補轉成更穩定的發佈前守門。

### 本版對用戶有甚麼價值

- 首次安裝、已有本地規則的安裝、升級衝突、健康檢查與收工接力等日常路徑，現在有更完整的自動情景檢查。
- `upgrade` 遇到 conflict 時，語氣改為清楚停手；不再在同一畫面同時出現完成感與阻擋訊息。
- 公開介紹頁與操作指南對齊新的 5 步新手引導，避免用戶未釐清需求前就被推入改檔流程。
- 舊版本升級 fixture 改用真實版本資料，v0.2.x 到 v0.3.10 的升級風險會在發佈前被重跑。

### Changed

- `scripts/check-release-readiness.mjs` 補齊 scenario 2 / 5 / 7，自動覆蓋有本地 AI 規則的安裝、conflict 停手與日常 `doctor` 健康路徑。
- `scripts/check-upgrade-safety.mjs` 升級鏈改以 `v0.3.10` 作已發佈來源，`v0.3.11` 作 current HEAD，確保上一版到新版的遷移被實測。
- `docs/whatsnew/` 增加 schema 守門；`docs/whatsnew/v0.3.1.md` 至 `v0.3.4.md` 已改回較自然的書面中文。
- package fileCount 34 → 35：新增 `docs/whatsnew/v0.3.11.md`。
- `packs/writing.md` 補上公開文件語氣要求：面向非技術讀者時，以書面中文為主，少用半中半英片段。

### Migration path（v0.3.10 → v0.3.11，backward-compat preserved）

- 既有項目不用重裝；可先執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run` 預覽。
- 若預演顯示 conflict，請先按提示處理衝突，不要用重裝覆蓋既有文件。
- 若沒有 conflict，再執行正式 `upgrade`，完成後用 `doctor` 檢查項目狀態。

## v0.3.10 — 2026-05-25

狀態：正式發佈版本。本版本回應首次安裝後真實進入 AI 對話的用戶旅程測試，重點是讓新用戶從終端機、README、新手頁，到 Claude Code / Codex / Antigravity 等 AI 工具的第一句開工，都更清楚、更少干擾。

### 本版對用戶有甚麼價值

- 安裝完成後，終端機不再要求新用戶立刻跑多餘檢查；下一步會集中指向 AI 對話。
- Claude Code 不應把 `CLAUDE.md` 橋接檔改寫成另一份長規則；`AGENTS.md` 仍是唯一入口真源。
- Google Antigravity CLI 遷移期支援已補明：`GEMINI.md` 是橋接檔，與 `AGENTS.md` 同步指向同一套開工流程。
- 新手情境選單改用更貼近日常目的的文字，例如「建構系統 / 工具 / 平台 / 網站或應用」與「Google Drive」。

### Changed

- `init` 完成輸出精簡為「不用再留在終端機，打開 AI 工具貼起步句」，並列出 Claude Code、Claude Cowork、OpenAI Codex、Google Antigravity 等常見入口。
- `doctor` 在全新安裝但尚未開 AI 對話時，改提示用戶進入 AI 對話，而不是說可以繼續日常使用。
- `upgrade` 可偵測被 Claude Code `/init` 或同類流程擴寫的 `CLAUDE.md`，並恢復為短橋接檔，避免規則分叉。
- `runtime-core/CLAUDE.md` 改為只引用 `@AGENTS.md` 的橋接檔，並明確禁止在入門或設定流程中擴寫、摘要或替換它。
- `runtime-core/GEMINI.md` 補上 Antigravity CLI / Gemini CLI 遷移期說明，保持 `AGENTS.md` 作唯一真源。
- `packs/onboarding.md` 收緊首次引導輸出：只顯示一次完整狀態卡，不先印半張卡，也不重複標誌圖。
- package fileCount 33 → 34：新增 `docs/whatsnew/v0.3.10.md`。

### Migration path（v0.3.9 → v0.3.10，backward-compat preserved）

- 既有項目不用重裝；可先執行 `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run` 預覽。
- 若預演顯示只會修復橋接檔或更新模板錨點，確認後再執行 `upgrade`。
- 如項目已有本地 AI 規則，工具會保留既有內容；不能安全判斷時會停手列為 conflict，不會靜默覆寫。

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
