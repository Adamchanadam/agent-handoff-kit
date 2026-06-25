# v0.3.30 發佈前全面檢人工報告

日期：2026-06-25
候選版本：`0.3.30`
結論：PASS，可進入 commit / push / tag / GitHub Release / npm publish 授權點；外部發佈須另得 Adam 明確批准。

## 候選範圍

| 檔案 | 變更 |
|---|---|
| `runtime-core/AGENTS.core.md` | 將長任務中途新增或改動的產品目標、開發清單、驗收規則、非目標與優先序列為 durable facts，要求先收斂成單一當前任務契約。 |
| `packs/agent-governance.md` | 在既有 governance pack 內承接任務契約變更，不新增品質驗收 pack，不複製核心三層持久化門檻。 |
| `bin/agent-handoff-kit.mjs` | 降低 `doctor` 健康狀態與 no-op upgrade 成功後的收工提示頻率，避免把普通任務完成誤導成必須完整 closeout。 |
| `README.md` / `agent-handoff-kit-guide.html` | 增加用戶向說明：AI 的工作規則由 Kit 提供，用戶只需說明任務目的與新要求。 |
| `agent-handoff-kit-intro.html` / `agent-handoff-kit-ai-install.html` | 對齊 v0.3.30 版本口徑。 |
| `scripts/check-release-readiness.mjs` | 新增 task contract anchors、舊 closeout 誤導語句反向掃描、v0.3.30 release evidence 檢查。 |
| `scripts/check-upgrade-safety.mjs` / `scripts/generate-upgrade-fixtures.mjs` / `test-fixtures/v0.3.29/*` | 加入 v0.3.29 -> v0.3.30 升級鏈與新核心 anchor 傳播驗收。 |
| `docs/qa/release-grade-qa.md` / `CHANGELOG.md` / `docs/whatsnew/v0.3.30.md` | 補候選版本狀態、人工驗收結論、發佈說明與用戶影響。 |

## 機器驗收

| 檢查 | 結果 | 證據 |
|---|---|---|
| `node --check` | PASS | `bin/agent-handoff-kit.mjs`、`scripts/check-upgrade-safety.mjs`、`scripts/check-release-readiness.mjs`。 |
| `npm run qa:prototype` | PASS | prototype 安裝、doctor、套件預演、污染掃描通過。 |
| `npm run qa:packs` | PASS | 既有 pack routing 通過；本候選未新增 public 七類驗收或 quality pack。 |
| `npm run qa:upgrade` | PASS | v0.3.29 tag -> current HEAD v0.3.30 chain 通過；final AGENTS 含 `Task contract changes are durable facts`。 |
| `npm run qa:release` | PASS | release readiness、task persistence gate、CLI scenario branching、package boundary、packed smoke、prior-version upgrade smoke 全通過。 |
| `git diff --check` | PASS | 無空白錯誤；只餘 Windows 換行提示。 |

## 治理健康八維

總判定：緊張。

建議方向：繼續。

| 維度 | 判定 | 摘要 |
|---|---|---|
| 開工負擔 | 緊張 | 核心 runtime 增加一段 durable fact 口徑，但它減少長任務漂移，不要求用戶讀更多文件。 |
| 真源清晰度 | 健康 | 任務契約收斂由核心 runtime 定義，agent-governance pack 只負責路由與落點，不形成第二真源。 |
| 輸出邊界 | 健康 | npm package 白名單仍只含 `bin/`、`runtime-core/`、`packs/`、`README.md`、`LICENSE`；`docs/qa/`、`scripts/`、`test-fixtures/` 不入包。 |
| 修補模式 | 緊張 | 本輪觸及 runtime、CLI、docs、QA 與 upgrade chain，但修補點集中於任務契約漂移與收工提示降噪。 |
| 執行落差 | 健康 | 新口徑已由 `qa:release` anchors、CLI 反向掃描與 `qa:upgrade` required anchor 傳播承接。 |
| onboarding / UX 缺口閉合 | 健康 | README / guide 以用戶可理解語句說明 AI 規則，不要求新手理解內部 pack 或七類驗收。 |
| upgrade migration safety | 健康 | v0.3.29 fixture 已加入升級鏈，舊用戶升級後會取得新核心 anchor。 |
| CLI 場景分流一致性 | 健康 | `doctor` healthy、no-op upgrade、status overview 不再把普通任務完成寫成必須完整收工。 |

## Product Journey Matrix

| 場景 | 狀態 | 證據 |
|---|---|---|
| Fresh install -> init -> first task | automated PASS | `qa:prototype` 與 `qa:release` user-flow / install / doctor checks 通過。 |
| Existing project upgrade -> doctor -> closeout | automated PASS | `qa:upgrade` chain 與 `qa:release` packed prior-version upgrade smoke 通過。 |
| Long task 中途分批新增產品目標、開發清單、驗收規則 | manual PASS + automated guard | 核心 runtime anchor、agent-governance routing、`qa:release` Task Persistence Gate Sweep 同步承接。 |
| Existing workspace 已有自己的驗收機制 | manual PASS | 本候選不新增 public 七類驗收，不建立 `docs/qa` 至用戶專案；新要求先收斂到既有 spec / backlog / issue / runbook 或 handoff current-state。 |
| Doctor healthy / no-op upgrade 下一步提示 | automated PASS | 舊「剛完成任務就收工」類語句已由 `scripts/check-release-readiness.mjs` 反向掃描守住。 |
| Conflict / blocked state | automated PASS | 既有 scenario branching 與 upgrade safety conflict fixtures 通過；本候選未放寬停手語言。 |
| Package boundary | automated PASS | `npm pack` 預演維持 25 files；發佈 QA、whatsnew、fixtures 均不入 npm package。 |
| New user reading README / guide | manual PASS | 文案說明「用戶說目的，AI 依 Kit 規則工作」，不把內部治理分類推給新手。 |

## Rules / Packs 路由與入庫範圍

結論：PASS。任務契約變更承接在既有 `agent-governance` pack 與核心 runtime persistence gate；未新增第二套 public 驗收框架、未新增 public quality pack、未要求用戶專案安裝 `docs/qa`。可重用操作程序仍導向既有 pack / registered reference / project index / sync registry / project decisions，而不是只放入 `SESSION_LOG` 或聊天。

## Manual Checklist

| 審閱面向 | 狀態 | 摘要 |
|---|---|---|
| 發佈授權 | blocked by policy | 候選已可進入授權點，但 commit / push / tag / GitHub Release / npm publish 尚未獲 Adam 明確批准。 |
| 版本口徑 | PASS | `package.json`、README、HTML、CHANGELOG、whatsnew 對齊 `0.3.30` / `v0.3.30`。 |
| 公開名稱 | PASS | GitHub repo、npm package、CLI command 無改名。 |
| 套件邊界 | PASS | npm package boundary 未擴大；public 七類驗收未進 runtime。 |
| 原始碼驗收 | PASS | 四條 source QA 與 release QA 通過。 |
| 非空既有專案升級 | PASS | 由 `qa:upgrade` chain、user-data fixture 與 release packed prior-version upgrade smoke 承接。 |
| 完整 merge 能力 | known limitation | 完整 section-aware merge 仍是原有穩定版前風險；本 patch 不擴大該範圍。 |
| 公開文件一致性 | PASS | README、guide、intro、AI install page、CHANGELOG、whatsnew 對齊。 |
| 交接可靠性 | PASS | 任務契約變更不再只留聊天或散落文檔；upgrade chain 驗證新 anchor 傳播。 |
| 安裝後可理解性 | PASS | 健康檢查與 no-op upgrade 不再過早催完整收工。 |
| 安全邊界 | PASS | release / publish 行為仍需另行批准。 |
| 污染掃描 | PASS | WORK-only 七類驗收沒有進 public runtime；機器 release scan 通過。 |
| GitHub / npm 發佈材料 | PASS | changelog 與 `docs/whatsnew/v0.3.30.md` 已準備；外部發佈待批准。 |

## QC Gap Backflow

| 新問題 | 產品修補 | QC 承接 |
|---|---|---|
| 長任務中途追加需求散落多份文件，造成唯一真源漂移 | 核心 runtime 定義 task contract changes 為 durable facts；agent-governance pack 指向既有任務真源或 handoff current-state。 | `qa:release` Task Persistence Gate anchors + `qa:upgrade` required anchor propagation。 |
| `SESSION_HANDOFF` / `SESSION_LOG` 過度寫入，令普通小步驟污染成持久狀態 | CLI 健康檢查與 no-op upgrade 改成只在結束本輪、需要交接或下一輪必須知道狀態時提示收工。 | `scripts/check-release-readiness.mjs` 增加舊誤導句反向掃描。 |
| 舊用戶升級後可能拿不到新核心規則 | 升級鏈加 v0.3.29 tag -> v0.3.30 current-head，final assertion 驗證新 anchor。 | `scripts/check-upgrade-safety.mjs` + `test-fixtures/v0.3.29/*`。 |
| public runtime 若加入七類驗收，可能與用戶既有驗收機制衝突並增加 AI 認知負荷 | 本候選不加入 public 七類驗收，不新增 public `docs/qa` 或 quality pack。 | WORK 已把七類驗收留在維護者發佈前治理；public release QA 僅守 runtime 邊界。 |

## 阻擋項

無產品阻擋項。唯一阻擋是外部發佈授權：commit / push / tag / GitHub Release / npm publish 必須由 Adam 另行明確批准。發佈後仍須執行 `發佈檢` 七項 artifact smoke，才可宣告 release complete。
