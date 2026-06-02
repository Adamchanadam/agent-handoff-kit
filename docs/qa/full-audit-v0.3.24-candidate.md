# v0.3.24 發佈前全面檢人工報告

日期：2026-06-02

候選版本：`0.3.24`

結論：**PASS，可在取得明確批准後進入 commit / push / tag / GitHub Release / npm publish。**

治理健康總判定：**緊張**

建議方向：**繼續**。原因是產品行為、升級安全、規則包路由與 QC gap backflow 已有機器與人工承接；但本輪屬治理與 upgrade root-fix，跨檔同步面積大，發佈前不應再擴建新規則或新流程。

發佈邊界：本報告只代表發佈前全面檢通過；不代表已發佈。commit、push、tag、GitHub Release、npm publish、發佈後七項驗證仍未執行。

## 機器驗收

| 項目 | 結果 | 證據 |
|---|---|---|
| `npm run qa:prototype` | PASS | prototype install、doctor、update notice、package dry-run 全通過 |
| `npm run qa:packs` | PASS | coding / research / writing / knowledge / release / safety / governance / communication / onboarding / integrations 與 mixed scenarios 全通過 |
| `npm run qa:upgrade` | PASS | v0.1.4 → v0.3.23 → current HEAD v0.3.24 chain、user-data preservation、upgrade quality matrix、negative conflict cases、`SESSION_LOG` preserve 全通過 |
| `npm run qa:release` | PASS | package dry-run、packed install、packed prior-version upgrade smoke、scenario branching、rules / packs routing、forbidden vocabulary、book-language sweep、npx guidance 全通過 |

## 治理健康八維結論

| 維度 | 判定 | 人工結論 |
|---|---|---|
| 開工負擔 | 緊張 | WORK handoff / decision / QA 記錄變多，但 current state 仍由 `dev/SESSION_HANDOFF.md` 承擔，`SESSION_LOG` 仍是 trace evidence。未見 public runtime 開工負擔失控。 |
| 真源清晰度 | 健康 | trigger vocabulary 在 WORK `AGENTS.md`；QA 方法在 WORK `docs/QA_STRATEGY.md`；public 發佈級驗收在 `docs/qa/release-grade-qa.md`；本報告是同一 QA 目錄下的正式審核紀錄。 |
| 輸出邊界 | 健康 | npm package 白名單仍是 `bin/`、`runtime-core/`、`packs/`、`README.md`、`LICENSE`；`docs/qa/`、`scripts/`、`test-fixtures/` 不入包。 |
| 修補模式 | 緊張 | 本輪由多個真實 runtime 失敗觸發，存在治理自修密度高的信號；但修補已收斂成一套 marker standard 與同進程 doctor gate，沒有以新增長篇規則處理。 |
| 執行落差 | 健康 | no-op false success、safe drift auto-repair、unsafe conflict、`SESSION_LOG` marker uniqueness / ordering 均已落到自動檢查或負面 fixture。 |
| onboarding / UX 缺口閉合 | 健康 | README、intro、guide、CLI output、npx guidance 由 `qa:release` 與人工終讀承接；本輪沒有新增需要新手另學的新流程。 |
| upgrade migration safety | 健康 | chainSteps 覆蓋所有已發佈 patch 至 `v0.3.23`，current HEAD 覆蓋 `v0.3.24`；舊 `SESSION_LOG` 遷移、保留與 marker contract 已補入。 |
| CLI 場景分流一致性 | 健康 | scenario 1 / 2 / 3a / 3b / 3c / 4 / 4b / 4c / 4d / 4e / 4f / 4g / 5 / 6 / 7 均有 automated contract 或 release-grade checklist 承接。 |

## 產品旅程矩陣

| 場景 | 狀態 | 證據 / 判斷 |
|---|---|---|
| Fresh install → init → first task | automated PASS + manual PASS | `qa:release` user-flow install / doctor PASS；README、intro、guide 均使用 AI 對話下一步與 `npx --yes ...@latest` 正式路徑。 |
| First task → closeout → next session handoff | automated PASS + manual PASS | `qa:release` simulated closeout / resumed doctor PASS；prompt mirror checker 由同一抽取規則承接。 |
| Task evidence → closeout disposition → next session startup | automated PASS + manual PASS | current-state evidence boundary、temperature auto-repair、`SESSION_LOG` evidence disposition 與 v0.3.23 trace boundary 已承接；本輪人工讀過 hot/cold 分層無新污染。 |
| Existing project upgrade → doctor → closeout | automated PASS | `qa:upgrade` chain、single-hop fixtures、user-data regression、stale lifecycle placeholder、metadata stale、packed prior-version upgrade smoke 全通過。 |
| Existing project upgrade → anchor drift auto-repair | automated PASS | `SESSION_HANDOFF` continuity、`SESSION_LOG` marker contract、`PROJECT_DECISIONS`、safety、integrations、onboarding auto-repair / conflict fixtures 全通過。 |
| Existing Kit files → official npx doctor path | automated PASS + manual PASS | `qa:release` npx cold-start UX guidance PASS；README / CLI / intro / guide 均保留 `npx --yes @adamchanadam/agent-handoff-kit@latest doctor` 口徑。 |
| Non-empty project with local rules | automated PASS | `qa:upgrade` custom row preservation、same-path preservation、changed-header conflict fixtures 通過。 |
| Conflict / blocked state | automated PASS | Scenario 5、unsafe safety / integrations / onboarding / repair marker / fake project index negative cases 均要求 conflict stop。 |
| Doctor healthy / outdated / lifecycle conflict | automated PASS | Scenario 6 healthy latest、Scenario 7 newer available、Scenario 4b lifecycle failure contract 均通過。 |
| AI-generated handoff prose tolerance | automated PASS | lifecycle field fixture 與 affirmative wording regression 保持：只信 Kit-controlled fields，不靠任意正文猜 lifecycle。 |
| Natural-language task → rule pack → durable home | automated PASS + manual PASS | `qa:packs` 與 `qa:release` rules / packs anchors PASS；人工抽樣確認可重用程序導向既有 pack / registered reference，不開新治理文件。 |

## Rules / Packs Routing 結論

結論：**PASS**。

`runtime-core/RULE_PACKS.md` 與 public `packs/*.md` 能把自然語言任務訊號導向最少必要 pack。`qa:packs` 覆蓋 coding、research、writing、knowledge、release、safety、agent-governance、communication、onboarding、integrations，以及跨階段 mixed scenarios。`qa:release` 亦檢查 durable-home scope anchors。

人工結論是：本輪 v0.3.24 不需要新增 pack；upgrade / release / safety / governance 的可重用程序已回流到既有 runtime contract、upgrade QA、release-grade checklist 與 WORK QA strategy。沒有發現一次性 runtime case 被升級成長期治理規則。

## QC Gap Backflow 結論

| 發現 | 分類 | 回流結果 | 狀態 |
|---|---|---|---|
| `SESSION_LOG` 原檢查偏向 marker 存在，未明確檢查唯一性與順序 | QC precision gap | 已補 `assertSessionLogMarkerContract()` 到 `qa:release` fresh install / simulated closeout，以及 `qa:upgrade` old log migration / preservation | closed |
| no-op upgrade 以前可能在 latest zero-change 時跳過完整健康檢查 | product bug + QC gap | 已改為同進程 `runDoctor()` gate；Scenario 4b / 4f / 4g 覆蓋 fail / auto-repair / pass 三類狀態 | closed |
| 真實 runtime 失敗容易被硬寫成專案特例 | governance risk | release QA 與 WORK decision 明確記錄真實 runtime 只作證據；驗收以通用 state / fixture 表達 | closed |
| 本次全面檢本身是否再發現新缺口 | audit result | 未發現新的 open QC gap；後續如 publish 後 artifact smoke 發現問題，需回流到下一版 QC gap loop | no open gap |

## Cross-file Read-through

| Surface | 結論 |
|---|---|
| README | v0.3.24 口徑、正式 `npx --yes ...@latest` 指令、upgrade / doctor 邊界一致。未加入內部全面檢文字，避免污染用戶頁。 |
| intro HTML | v0.3.24 版本顯示一致，保留新手路徑與 README 真源連結。未加入內部全面檢文字。 |
| guide HTML | v0.3.24 版本顯示一致，保留日常場景、升級與 doctor 引導。未加入內部全面檢文字。 |
| CHANGELOG / whatsnew | v0.3.24 候選 root-fix、migration path 與 marker standard 口徑一致。 |
| release-grade QA | v0.3.24 scenario、marker uniqueness / ordering、full audit requirement 均已對齊。 |
| runtime templates | `SESSION_LOG` 有標準註解錨點，`AGENTS.core` 有 closeout write contract。 |
| package metadata | `package.json` 版本為 `0.3.24`；npm package fileCount 預演仍維持 25。 |

## 發佈前阻擋項

沒有產品 / QC 阻擋項。

仍未完成但不屬全面檢阻擋的外部操作：

1. commit
2. push
3. tag
4. GitHub Release
5. npm publish
6. 發佈後七項驗證

以上操作需要使用者另行明確批准。
