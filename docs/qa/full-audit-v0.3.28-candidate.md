# v0.3.28 發佈前全面檢人工報告

日期：2026-06-07
候選版本：`0.3.28`
結論：PASS，可進入 commit / push / tag / GitHub Release / npm publish；外部發佈須在本報告通過後執行。

## 候選範圍

| 檔案 | 變更 |
|---|---|
| `runtime-core/RULE_PACKS.md` | 新增「把文件接入 Agent Handoff Kit」與「掃描未接入 Agent Handoff Kit 的重要文件」中文觸發語，保留「治理打通」與英文觸發語。 |
| `packs/agent-governance.md` | Load When 與 Governance Bridge Workflow 入口承認新版中文觸發語。 |
| `bin/agent-handoff-kit.mjs` | schema anchors 與 upgrade migration 會補齊新版中文觸發語；舊治理打通路由列可非破壞性升級。 |
| README、intro HTML、guide HTML | 公眾文案主推「接入 Agent Handoff Kit」，保留「治理打通」作舊說法；intro highlight 與兩種用法展示修正。 |
| `scripts/check-pack-scenarios.mjs` | 治理打通四情景矩陣加入新版中文觸發語。 |
| `scripts/check-upgrade-safety.mjs` / `test-fixtures/v0.3.27/*` | 新增上一版 fixture 與舊治理打通路由列遷移驗收。 |
| `scripts/check-release-readiness.mjs` / `docs/qa/release-grade-qa.md` | Release contract 改為驗證新版中文入口與舊入口同時有效。 |

## 機器驗收

| 檢查 | 結果 | 證據 |
|---|---|---|
| `node --check` | PASS | `bin/agent-handoff-kit.mjs`、`scripts/check-pack-scenarios.mjs`、`scripts/check-release-readiness.mjs`、`scripts/check-upgrade-safety.mjs`。 |
| `npm run qa:packs` | PASS | 新版中文觸發語與舊觸發語都能路由至 `agent-governance`；四情景矩陣通過。 |
| `npm run qa:upgrade` | PASS | v0.3.27 tag -> current HEAD v0.3.28 chain 通過；舊治理打通路由列補新版中文觸發語通過。 |
| `npm run qa:release` | PASS | Governance Bridge contract、packed prior-version upgrade smoke、scenario branching、文件錨點全通過。 |
| `git diff --check` | PASS | 無空白錯誤；只餘 Windows 換行提示。 |

## 治理健康八維

總判定：健康。

建議方向：繼續。

| 維度 | 判定 | 摘要 |
|---|---|---|
| 開工負擔 | 健康 | 只新增自然語言觸發語，不增加預設 startup 掃描或必讀文件。 |
| 真源清晰度 | 健康 | 規則真源仍在既有 `agent-governance` workflow；`RULE_PACKS` 只做路由。 |
| 輸出邊界 | 健康 | npm package 白名單維持；HTML 鏡像不入包。 |
| 修補模式 | 健康 | 修補的是入口語意與展示，不新增第二套治理流程。 |
| 執行落差 | 健康 | 文檔、runtime、upgrade、QC 同步更新，避免文檔承諾超前。 |
| onboarding / UX 缺口閉合 | 健康 | 公眾頁面主推「接入 Agent Handoff Kit」，比「治理打通」更直白。 |
| upgrade migration safety | 健康 | 舊路由列與舊 workflow 都可補入新版中文觸發語。 |
| CLI 場景分流一致性 | 健康 | 未新增 CLI 子命令；既有 init / upgrade / doctor 場景保持通過。 |

## Governance Bridge Scenario Matrix

| 情景 | 狀態 | automated PASS 證據 |
|---|---|---|
| new stock list source-of-truth | PASS | `qa:packs` 驗證「把 docs/stock-list.md 接入 Agent Handoff Kit」與「治理打通 docs/stock-list.md」均有 public docs 示例，並路由至 `agent-governance`。 |
| production guide / runbook | PASS | `qa:packs` 驗證「把 docs/production-guide.md 接入 Agent Handoff Kit」與自然語句「把這份文件接入 Agent Handoff Kit」可承接 production guide / runbook 情景。 |
| repo-wide unbridged document scan | PASS | `qa:packs` 驗證「掃描未接入 Agent Handoff Kit 的重要文件」與英文 scan 入口，並確認掃描只列候選與缺口。 |
| duplicate source-of-truth risk | PASS | `qa:packs` 驗證流程只提出 merge / reference / retire 建議，不自動刪除、重命名、移動或合併真源。 |

## Rules / Packs 路由與入庫範圍

結論：PASS。新版中文觸發語仍路由到既有 `agent-governance` pack；未新增第二份治理真源。`RULE_PACKS` 只負責自然語言路由，具體 workflow 在 pack 內。

## QC Gap Backflow

| 新問題 | 產品修補 | QC 承接 |
|---|---|---|
| 「治理打通」對新手不夠直白 | 新增「接入 Agent Handoff Kit」主用語，保留舊入口。 | `qa:packs` 與 `qa:release` 驗證新舊入口同時存在。 |
| 文檔可能承諾 runtime 不支援的中文入口 | runtime 路由、pack、schema anchors、upgrade migration 同步更新。 | `qa:upgrade` 舊路由列遷移情景。 |
| intro HTML highlight 無效、兩種用法被誤讀 | 補 `#bridge .intro .hl` 樣式，卡片改成兩組入口。 | `qa:release` cross-surface / governance bridge contract 通過。 |

## 阻擋項

無產品阻擋項。外部發佈完成後仍須執行發佈後七項驗證，才可宣告 release complete。

