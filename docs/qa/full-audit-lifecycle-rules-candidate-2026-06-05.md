# 發佈前全面檢 — lifecycle 誤報與 rules 錯層 source candidate

日期：2026-06-05

狀態：PASS，可以進入 version bump 準備；尚未批准 commit、push、tag、GitHub Release 或 npm publish。

## 候選範圍

本次候選仍停在 source candidate，`package.json` 版本保持 `0.3.25`。候選修補只涉及三個檔案：

| 檔案 | 變更 |
|---|---|
| `bin/agent-handoff-kit.mjs` | 新增 rules pack 錯層診斷；收窄 handoff lifecycle placeholder / unresolved 判斷，避免欄位敘述中間的 `pending` 造成 false-positive。 |
| `scripts/check-upgrade-safety.mjs` | 新增 rules pack 錯層回歸；新增 v0.3.11 風格 lifecycle narrative pending 升級回歸。 |
| `scripts/check-release-readiness.mjs` | 同步 lifecycle 判斷 helper；新增直接 lifecycle consistency 回歸。 |

未做事項：未 version bump、未更新 CHANGELOG 新版本段、未 commit、未 push、未 tag、未建立 GitHub Release、未 npm publish、未做發佈後驗證。

## 機器驗收

| 檢查 | 結果 | 證據 |
|---|---|---|
| `npm run qa:prototype` | PASS | Prototype QA passed；package dry-run 通過。 |
| `npm run qa:packs` | PASS | Rule pack structure、routing、phased loading 全部通過。 |
| `npm run qa:upgrade` | PASS | 新增 `upgrade lifecycle narrative pending field root` 通過；rules 錯層回歸通過；chain upgrade 覆蓋至 v0.3.24 -> current HEAD。 |
| `npm run qa:release` | PASS | 首次因新增測試層級錯置而 fail；修正為直接測 lifecycle consistency 後重跑 PASS。 |
| `npm pack --dry-run --json` | PASS | entryCount 25；只包含 `bin/`、`runtime-core/`、`packs/`、`README.md`、`LICENSE`。 |
| `git diff --check` | PASS with warnings | 只有 CRLF 換行提示，無 whitespace error。 |

## 治理健康八維

總判定：緊張。

建議方向：繼續。

| 維度 | 判定 | 摘要 |
|---|---|---|
| 開工負擔 | 緊張 | WORK 記錄有新增 source-candidate 狀態，但熱層仍由 `SESSION_HANDOFF` / `PROJECT_INDEX` 承擔；未要求日常開工讀新報告。 |
| 真源清晰度 | 健康 | public 行為在 source 與 QA；WORK 決策只記錄候選邊界；`GOVERNANCE_MAP.html` 仍是入口頁，不是規則真源。 |
| 輸出邊界 | 健康 | 本報告與 scripts 不進 npm package；package 白名單未擴大。 |
| 修補模式 | 緊張 | 兩個真實 runtime 問題集中在 upgrade / doctor；但均已抽象成通用狀態和回歸，不是硬編單一 repo。 |
| 執行落差 | 健康 | lifecycle false-positive 已由 `qa:upgrade` 和 `qa:release` 承接；rules 錯層也有 doctor / upgrade 回歸。 |
| onboarding / UX 缺口閉合 | 健康 | 本次未改新手流程；README / HTML user-facing surface 無需新增 bug 敘事。 |
| upgrade migration safety | 健康 | prior-version chain 覆蓋至 v0.3.24；新增 v0.3.11-style lifecycle narrative case。 |
| CLI 場景分流一致性 | 健康 | `qa:release` scenario branching 全通過；no-op、conflict、doctor healthy / outdated 等場景未被本次改動破壞。 |

## 產品旅程矩陣

| 場景 | 狀態 | 證據 |
|---|---|---|
| Fresh install -> init -> first task | automated PASS | `qa:prototype` 與 `qa:release` user-flow install / doctor / resumed doctor 通過。 |
| First task -> closeout -> next session handoff | automated PASS | `qa:release` handoff reconciliation、prompt mirror、lifecycle positive / negative checks 通過。 |
| Task evidence -> closeout disposition -> startup | automated PASS | `qa:release` research trace 與 handoff temperature boundary checks 通過。 |
| Existing project upgrade -> doctor -> closeout | automated PASS | `qa:upgrade` prior-version chain、user-data regression、upgrade quality matrix 通過。 |
| Existing project upgrade -> anchor drift auto-repair | automated PASS | `qa:upgrade` anchor drift、handoff continuity、session log preserve、unsafe conflict fixtures 通過。 |
| Existing Kit files -> official npx doctor path | automated PASS | `qa:release` npx UX guidance 通過；README 仍使用 `npx --yes ...@latest doctor`。 |
| Non-empty project with local rules | automated PASS | `qa:upgrade` custom-row preservation / conflict fixtures 通過。 |
| Conflict / blocked state | automated PASS | `qa:release` scenario 5 output contract 通過；`qa:upgrade` unsafe fixtures停手通過。 |
| Doctor healthy / outdated / lifecycle conflict | automated PASS | `qa:release` scenario 6 / 7、lifecycle negative fixture 通過。 |
| AI-generated handoff prose tolerance | automated PASS | 新增非開頭 `pending` lifecycle narrative 回歸；`qa:upgrade` 與 `qa:release` 均通過。 |
| Natural-language task -> rule pack -> durable home | automated PASS | `qa:packs` 與 `runtime-core/RULE_PACKS.md` routing read-through 通過。 |
| Task persistence gate | automated PASS | `qa:release` task persistence gate contract 通過；本次未改核心分流語意。 |

## Rules / Packs 路由與入庫範圍

結論：PASS。

`runtime-core/RULE_PACKS.md` 能把新手、破壞性操作、編碼、寫作、研究、治理、發佈、知識、外部整合與回覆格式路由到最小必要 pack。`qa:packs` 已驗證結構、routing、durable-home scope 與多階段載入。這次新增的 lifecycle false-positive 屬 CLI / doctor 判斷與 upgrade safety，已落在 source + QA，不新增規則包或平行治理文件。

## 跨檔一致性

| 面向 | 結論 |
|---|---|
| 版本狀態 | public README / package 仍顯示 `v0.3.25`，符合未 bump 狀態。 |
| 候選邊界 | WORK handoff、log、project index、decision log、governance map 已記錄「未發佈 source candidate」。 |
| package 邊界 | `npm pack --dry-run --json` 顯示 25 個檔案；`docs/qa` 與 `scripts` 不進 package。 |
| CHANGELOG | 未新增新版本段，因本輪尚未 version bump。version bump 時必須補新段並重跑驗收。 |
| GitHub Release / npm | 未操作；仍需 Adam 明確批准後才可進行。 |

## QC Gap Backflow

| 新問題 | 產品修補 | QC 承接 |
|---|---|---|
| rules pack 錯層症狀不易診斷 | `doctor` 印 wrong-layer hints；`upgrade` 補回正確 `dev/rules/` copy，不刪錯層副本。 | `scripts/check-upgrade-safety.mjs` 新增 misplaced rule layer regression。 |
| lifecycle 欄位合法敘述含 `pending` 被誤報 | placeholder / unresolved 判斷改為欄位開頭 token 或明確 unresolved phrase。 | `scripts/check-upgrade-safety.mjs` 新增 v0.3.11-style upgrade regression；`scripts/check-release-readiness.mjs` 新增直接 lifecycle consistency regression。 |
| 新增 release-readiness 測試層級錯置 | 測試由 full closeout `yes` contract 改為直接測 lifecycle consistency。 | `qa:release` 重跑 PASS；此報告記錄首次 fail 與修正原因。 |

## 阻擋項

無產品阻擋項。

發佈流程阻擋仍存在，原因是尚未取得下一步明確批准：version bump、commit、push、tag、GitHub Release、npm publish 均未授權。

## 結論

本 source candidate 通過發佈前全面檢，可進入 version bump 準備。下一步若 Adam 批准，應先 bump 下一個 patch version，補 CHANGELOG / public surface 版本對齊，再重跑必要驗收。未取得明確批准前，不得 commit、push、tag、建立 GitHub Release 或 npm publish。
