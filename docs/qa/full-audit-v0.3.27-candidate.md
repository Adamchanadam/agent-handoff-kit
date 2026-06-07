# v0.3.27 發佈前全面檢人工報告

日期：2026-06-07
候選版本：`0.3.27`
結論：PASS，可進入 commit / push / tag / GitHub Release / npm publish；外部發佈須在本報告通過後執行。

## 候選範圍

| 檔案 | 變更 |
|---|---|
| `packs/agent-governance.md` | 新增 Governance Bridge Workflow，定義指定文件與 repo-wide 掃描的檢查鏈、輸出格式與不可自動處理邊界。 |
| `runtime-core/RULE_PACKS.md` | 新增治理打通自然語言路由。 |
| `bin/agent-handoff-kit.mjs` | 新增治理打通 schema anchors 與舊項目非破壞性 upgrade migration。 |
| `scripts/check-pack-scenarios.mjs` | 新增四個治理打通情景矩陣。 |
| `scripts/check-upgrade-safety.mjs` / `test-fixtures/v0.3.26/*` | 新增上一版 fixture 與治理打通遷移驗收。 |
| `scripts/check-release-readiness.mjs` | 新增 Governance Bridge contract 與 full audit 證據要求。 |
| README、intro HTML、guide HTML | 新增公眾使用說明、用途與示例。 |
| `CHANGELOG.md`、`docs/whatsnew/v0.3.27.md`、`docs/qa/release-grade-qa.md` | 版本與候選發佈說明對齊 v0.3.27。 |

## 機器驗收

| 檢查 | 結果 | 證據 |
|---|---|---|
| `npm run qa:prototype` | PASS | Prototype QA passed；package dry-run 通過。 |
| `npm run qa:packs` | PASS | Governance bridge 四情景與既有 pack routing 全部通過。 |
| `npm run qa:upgrade` | PASS | v0.3.26 tag -> current HEAD v0.3.27 chain 通過；治理打通 migration fixture 通過。 |
| `npm run qa:release` | PASS | Governance Bridge contract、packed v0.3.26 -> v0.3.27 upgrade smoke、scenario branching、文件錨點全通過。 |
| `git diff --check` | PASS | 無空白錯誤；只餘 Windows 換行提示。 |

## 治理健康八維

總判定：緊張。

建議方向：繼續。

| 維度 | 判定 | 摘要 |
|---|---|---|
| 開工負擔 | 緊張 | 新增治理打通能力，但採按需觸發，不增加日常開工必讀文件。 |
| 真源清晰度 | 健康 | 功能真源在 `agent-governance` workflow；路由在 `RULE_PACKS`；驗收在 QA scripts。 |
| 輸出邊界 | 健康 | npm package 白名單維持 25 files；QA、whatsnew、fixtures 不入包。 |
| 修補模式 | 健康 | 文件孤兒與重複真源風險被抽象成四個可驗收情景。 |
| 執行落差 | 健康 | `qa:packs`、`qa:upgrade`、`qa:release` 都已承接，不依賴 Adam 人工 diff review。 |
| onboarding / UX 缺口閉合 | 健康 | README / HTML 以實際指令與用途說明，不要求新手理解內部治理術語。 |
| upgrade migration safety | 健康 | 舊項目會補上治理打通路由與 workflow，並保留自訂內容。 |
| CLI 場景分流一致性 | 健康 | 未新增 CLI 子命令；既有 init / upgrade / doctor 場景全通過。 |

## 產品旅程矩陣

| 場景 | 狀態 | 證據 |
|---|---|---|
| Fresh install -> init -> first task | automated PASS | `qa:prototype` / `qa:release`。 |
| First task -> closeout -> next session handoff | automated PASS | prompt mirror、handoff lifecycle checks。 |
| Existing project upgrade -> doctor -> closeout | automated PASS | `qa:upgrade` chain 與 packed prior-version smoke。 |
| Existing Kit files -> official npx doctor path | automated PASS | README / CLI npx UX guard。 |
| Non-empty project with local rules preserved | automated PASS | custom-row / conflict fixtures。 |
| Conflict / blocked states | automated PASS | scenario output contract 與 unsafe fixtures。 |
| Rules / packs routing | automated PASS | `qa:packs` 與 durable-home scope sweep。 |
| Governance bridge / 治理打通 | automated PASS | Governance Bridge Scenario Matrix 四情景通過。 |

## Governance Bridge Scenario Matrix

| 情景 | 狀態 | automated PASS 證據 |
|---|---|---|
| new stock list source-of-truth | PASS | `qa:packs` 驗證 `治理打通` 路由至 `agent-governance`，並要求檢查文件本身、`PROJECT_INDEX`、`DOC_SYNC_REGISTRY` 與重複真源風險。 |
| production guide / runbook | PASS | `qa:packs` 驗證 `connect this document to governance` 路由，並要求檢查相關 workflow / guide / runbook 與具體 Acceptance。 |
| repo-wide unbridged document scan | PASS | `qa:packs` 驗證 `scan for unbridged governance documents` 路由，並確認掃描只列候選與缺口。 |
| duplicate source-of-truth risk | PASS | `qa:packs` 驗證流程只提出 merge / reference / retire 建議，不自動刪除、重命名、移動或合併真源。 |

## Rules / Packs 路由與入庫範圍

結論：PASS。治理打通放入既有 `agent-governance` pack，沒有新增第二份治理真源。`RULE_PACKS` 只負責自然語言路由，具體 workflow 在 pack 內；可重用程序沒有落到 handoff / log。

## QC Gap Backflow

| 新問題 | 產品修補 | QC 承接 |
|---|---|---|
| 重要文件容易變孤兒 | 新增 Governance Bridge Workflow 與公眾使用說明。 | `qa:packs` 四情景矩陣。 |
| 舊用戶升級後可能缺治理打通路由 | `upgrade` 非破壞性補 `RULE_PACKS` 路由與 `agent-governance` workflow。 | `qa:upgrade` governance bridge migration fixture。 |
| Adam 不做人工 diff review | 將四個實際使用情景轉成機器驗收。 | `qa:release` 要求 full audit 報告列出 automated PASS 證據。 |

## 阻擋項

無產品阻擋項。外部發佈完成後仍須執行發佈後七項驗證，才可宣告 release complete。
