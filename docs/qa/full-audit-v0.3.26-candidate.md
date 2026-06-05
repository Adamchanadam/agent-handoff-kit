# v0.3.26 發佈前全面檢人工報告

日期：2026-06-05
候選版本：`0.3.26`
結論：PASS，可進入 commit / push / tag / GitHub Release / npm publish 確認點；尚未執行外部發佈。

## 候選範圍

| 檔案 | 變更 |
|---|---|
| `bin/agent-handoff-kit.mjs` | 收窄 lifecycle placeholder / unresolved 判斷；新增 rules pack 錯層診斷；修正 `AGENTS.md` same-text 早退，讓缺 managed marker 的上一版安裝可被 upgrade 補齊。 |
| `scripts/check-upgrade-safety.mjs` | 新增 lifecycle narrative pending regression；upgrade chain 最後一跳改為 v0.3.26 current HEAD。 |
| `scripts/check-release-readiness.mjs` | 新增直接 lifecycle consistency regression。 |
| `scripts/generate-upgrade-fixtures.mjs` / `test-fixtures/v0.3.25/*` | 補正式上一版 fixture，支援 v0.3.26 prior-version smoke。 |
| `package.json`、README、HTML、CHANGELOG、`docs/whatsnew/v0.3.26.md`、`docs/qa/release-grade-qa.md` | 版本與候選發佈說明對齊 v0.3.26。 |

## 機器驗收

| 檢查 | 結果 | 證據 |
|---|---|---|
| `npm run qa:prototype` | PASS | Prototype QA passed；package dry-run 通過。 |
| `npm run qa:packs` | PASS | Rule pack structure、routing、phased loading 全部通過。 |
| `npm run qa:upgrade` | PASS | v0.3.25 tag -> current HEAD v0.3.26 chain 通過；lifecycle narrative regression 通過。 |
| `npm run qa:release` | PASS | packed v0.3.25 -> v0.3.26 upgrade smoke、scenario branching、lifecycle regression、文件錨點全通過。 |
| `npm pack --dry-run --json` | PASS | entryCount 25；`docs/qa`、`docs/whatsnew`、`scripts`、`test-fixtures` 不入包。 |

## 治理健康八維

總判定：緊張。

建議方向：繼續。

| 維度 | 判定 | 摘要 |
|---|---|---|
| 開工負擔 | 緊張 | 本輪新增 source 與 QA 記錄，但不增加用戶 runtime 文件數量。 |
| 真源清晰度 | 健康 | 產品行為在 CLI source；驗收在 QA scripts；發佈敘事在 CHANGELOG / whatsnew。 |
| 輸出邊界 | 健康 | package 白名單維持 25 files；QA 與 fixture 不進 npm package。 |
| 修補模式 | 健康 | 真實 runtime 問題已抽象成通用 lifecycle / wrong-layer regression。 |
| 執行落差 | 健康 | false-positive 與錯層診斷均有自動守門。 |
| onboarding / UX 缺口閉合 | 健康 | 未改新手入口；公開頁只同步版本。 |
| upgrade migration safety | 健康 | v0.3.25 fixture 已補；chain 覆蓋至 current HEAD v0.3.26。 |
| CLI 場景分流一致性 | 健康 | scenario branching 全通過，未破壞 init / upgrade / doctor 路徑。 |

## 產品旅程矩陣

| 場景 | 狀態 | 證據 |
|---|---|---|
| Fresh install -> init -> first task | automated PASS | `qa:prototype` / `qa:release`。 |
| First task -> closeout -> next session handoff | automated PASS | prompt mirror、handoff lifecycle positive / negative checks。 |
| Existing project upgrade -> doctor -> closeout | automated PASS | `qa:upgrade` chain 與 packed prior-version smoke。 |
| Existing Kit files -> official npx doctor path | automated PASS | README / CLI npx UX guard。 |
| Stale handoff contradiction blocked | automated PASS | lifecycle negative fixture 仍阻擋真矛盾。 |
| Normal handoff not falsely blocked | automated PASS | 非開頭 `pending` narrative regression。 |
| Non-empty project with local rules preserved | automated PASS | custom-row / conflict fixtures。 |
| Conflict / blocked states | automated PASS | scenario 5 output contract 與 unsafe fixtures。 |
| Rules / packs routing | automated PASS | `qa:packs` 與 durable-home scope sweep。 |

## Rules / Packs 路由與入庫範圍

結論：PASS。`runtime-core/RULE_PACKS.md` 路由仍覆蓋自然語言任務到最少必要 packs；本輪沒有新增規則包或平行治理文件。wrong-layer 問題回到 CLI 診斷與 upgrade safety，不把一次性 bug report 寫成新規則。

## QC Gap Backflow

| 新問題 | 產品修補 | QC 承接 |
|---|---|---|
| lifecycle 欄位合法敘述含 `pending` 被誤報 | 欄位檢查改為開頭 token / 明確 unresolved phrase。 | `qa:upgrade` 與 `qa:release` 新增 regression。 |
| rules pack 錯層診斷不足 | `doctor` / `upgrade` 提供 wrong-layer hints，正確層級仍補齊。 | `qa:upgrade` 新增 misplaced rule layer regression。 |
| v0.3.26 prior-version smoke 缺上一版 fixture | 補 `test-fixtures/v0.3.25`，並修出 same-text AGENTS marker 早退問題。 | `qa:upgrade` chain / fixture single-hop 與 `qa:release` packed upgrade smoke 以 v0.3.25 fixture 驗收。 |

## 阻擋項

無產品阻擋項。外部發佈仍需 Adam 明確批准後才可執行 commit、push、tag、GitHub Release、npm publish 與發佈後驗證。

