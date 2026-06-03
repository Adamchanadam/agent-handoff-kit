# v0.3.25 發佈前全面檢人工報告

日期：2026-06-03

候選版本：`0.3.25`

結論：**PASS，可在已取得明確批准後進入 commit / push / tag / GitHub Release / npm publish。**

治理健康總判定：**緊張**

建議方向：**繼續**。原因是本輪觸及 runtime 持久化判斷、治理 pack 引用、QA script 與 release 文件，但改動已收斂在既有真源與既有驗收；沒有新增平行治理規則，公開用戶頁亦沒有承載內部治理分類。

發佈邊界：本報告只代表發佈前全面檢通過。commit、push、tag、GitHub Release、npm publish、發佈後七項驗證仍須在本報告之後執行。

## 機器驗收

| 項目 | 結果 | 證據 |
|---|---|---|
| `npm run qa:prototype` | PASS | template install、doctor、update notice、package dry-run 全通過 |
| `npm run qa:packs` | PASS | coding / research / writing / knowledge / release / safety / governance / communication / onboarding / integrations 與 mixed scenarios 全通過 |
| `npm run qa:upgrade` | PASS | v0.1.4 → v0.3.24 tag → current HEAD v0.3.25 chain、v0.3.24 fixture single-hop、user-data preservation、upgrade quality matrix、negative conflict cases 全通過 |
| `npm run qa:release` | PASS | package dry-run、packed install、packed v0.3.24 → v0.3.25 upgrade smoke、scenario branching、rules / packs routing、task persistence gate contract、forbidden vocabulary、book-language sweep、npx guidance 全通過 |

## 治理健康八維結論

| 維度 | 判定 | 人工結論 |
|---|---|---|
| 開工負擔 | 健康 | 本輪目的正是降低任務後過度 closeout；核心分流要求普通任務完成不重生整套交接。 |
| 真源清晰度 | 健康 | 任務持久化分流的唯一真源是 `runtime-core/AGENTS.core.md`；`packs/agent-governance.md` 只引用，不複製門檻。 |
| 輸出邊界 | 健康 | npm package 白名單仍是 `bin/`、`runtime-core/`、`packs/`、`README.md`、`LICENSE`；QA docs、fixtures、scripts 不入包。 |
| 修補模式 | 緊張 | 本輪源自真實使用節奏問題，屬治理 root-fix；但修補落在既有 runtime + QA，不新開治理文件。 |
| 執行落差 | 健康 | `qa:release` 已檢查正向保存條件、反向不保存條件、pack 引用與 public page negative wording。 |
| onboarding / UX 缺口閉合 | 健康 | README、intro、guide 只保留「開工 / 收工」操作語句，沒有要求新用戶理解內部 persistence gate。 |
| upgrade migration safety | 健康 | 已新增 `test-fixtures/v0.3.24` 並把 chain final hop 轉為 `v0.3.25 current HEAD`；`qa:upgrade` 全通過。 |
| CLI 場景分流一致性 | 健康 | `qa:release` 的 scenario 1 / 2 / 3a / 3b / 3c / 4 / 4b / 4c / 4d / 4e / 4f / 4g / 5 / 6 / 7 全通過。 |

## 產品旅程矩陣

| 場景 | 狀態 | 證據 / 判斷 |
|---|---|---|
| Fresh install → init → first task | automated PASS + manual PASS | `qa:release` user-flow install / doctor PASS；README 與 HTML 仍把下一步放在 AI 對話，不放在終端機。 |
| First task → closeout → next session handoff | automated PASS + manual PASS | prompt mirror checker、simulated closeout、resumed doctor PASS；完整 closeout 仍只在明確收工 / 交接等情境。 |
| Task evidence → closeout disposition → next session startup | automated PASS + manual PASS | persistence gate 將 current state、trace evidence、project index、project decisions、rule pack 分開；不把一次性任務證據拖入 opening message。 |
| Existing project upgrade → doctor → closeout | automated PASS | `qa:upgrade` chain 與 packed prior-version smoke 均覆蓋 v0.3.24 → v0.3.25。 |
| Existing Kit files → official npx doctor path | automated PASS + manual PASS | `qa:release` npx cold-start UX guidance PASS；本輪沒有改動官方 `npx --yes ...@latest` 路徑。 |
| Non-empty project with local rules | automated PASS | `qa:upgrade` custom row preservation、same-path preservation、changed-header conflict fixtures 通過。 |
| Conflict / blocked state | automated PASS | unsafe safety / integrations / onboarding、repair marker、fake project index 等負面 fixture 均要求停手。 |
| Doctor healthy / outdated / lifecycle conflict | automated PASS | scenario 4 / 4b / 4f / 4g / 6 / 7 均通過，沒有把健康、需自修、需停手混成同一輸出。 |
| AI-generated handoff prose tolerance | automated PASS | lifecycle field fixture 與 handoff boundary 仍只信 Kit-controlled fields，不靠任意正文猜狀態。 |
| Natural-language task → rule pack → durable home | automated PASS + manual PASS | `qa:packs` 與 `qa:release` rules / packs routing PASS；agent-governance pack 引用核心分流而不新增 home。 |
| Task persistence gate | automated PASS + manual PASS | `qa:release` task persistence gate contract PASS；人工終讀確認草稿未拍板、新來源、錯誤經驗轉機制三類情景落點清楚。 |

## Rules / Packs Routing 結論

結論：**PASS**。

`runtime-core/RULE_PACKS.md` 與 `packs/*.md` 仍能把自然語言任務訊號導向最少必要 pack。`packs/agent-governance.md` 對本輪新增行為只引用核心 persistence gate decision，沒有複製三層門檻；可重用程序仍要求先找既有 pack、registered reference 或 project decision home。

## QC Gap Backflow 結論

| 發現 | 分類 | 回流結果 | 狀態 |
|---|---|---|---|
| 任務完成後重複完整 handoff，拖慢流程 | product bug + QC gap | 核心 runtime 新增三層分流；`qa:release` 新增 task persistence gate contract；release-grade checklist 新增人工情景 | closed |
| 擔心修補後跌入漏做治理 | governance risk | 正向條件明確覆蓋新增 / 刪除文件、新真源、不可重建驗證結果、用戶要求轉長期機制、工具即將停止 | closed |
| 公開 README / HTML 容易污染新手理解 | UX risk | `qa:release` 反向檢查 public pages 不暴露內部術語，不把普通小任務寫成完整收工 | closed |
| 本次全面檢本身是否再發現新缺口 | audit result | 發現缺 v0.3.24 previous-release fixture；已補入 `test-fixtures/v0.3.24`、generator TARGETS 與 chainSteps | closed |

## Cross-file Read-through

| Surface | 結論 |
|---|---|
| README | 只更新到 v0.3.25 版本顯示；不加入內部治理說明。 |
| intro HTML | 只更新到 v0.3.25 版本顯示；新手入門仍保持操作語言。 |
| guide HTML | 只更新到 v0.3.25 版本顯示；示例版本對齊。 |
| CHANGELOG / whatsnew | v0.3.25 任務持久化分流、文件角色落點、migration path 口徑一致。 |
| release-grade QA | v0.3.25 發佈狀態、正式結論、九項證據表與 Task Persistence Gate Sweep 對齊。 |
| runtime templates / packs | 核心 runtime 承擔三層分流；agent-governance pack 只引用核心判斷。 |
| package metadata | `package.json` 版本為 `0.3.25`；npm package dry-run 仍維持 25 files。 |

## 發佈前阻擋項

沒有產品 / QC 阻擋項。

仍未完成但不屬全面檢阻擋的外部操作：

1. commit
2. push
3. tag
4. GitHub Release
5. npm publish
6. 發佈後七項驗證

以上操作已由 Adam 明確批准，下一步可執行。
