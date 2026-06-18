# AI 安裝頁與長期治理入庫候選全面檢

日期：2026-06-18
候選版本：`0.3.29`
候選狀態：原始碼候選，基於已發佈 `0.3.28`。本報告不代表已 commit、push、tag、GitHub Release、npm publish 或發佈後驗證。
結論：PASS，可作為 `v0.3.29` 候選內容；外部發佈須由 Adam 明確批准後執行。

## 候選範圍

| 檔案 | 變更 |
|---|---|
| `agent-handoff-kit-ai-install.html` | 新增 GitHub Pages 普通 HTML，供 AI 讀取後在用戶已打開的目標資料夾判斷安裝或升級。 |
| `README.md` | 新手第一屏與安裝段落改為先給 AI 讀安裝頁；`npx` 表格改名為手動入口。 |
| `agent-handoff-kit-intro.html` / `agent-handoff-kit-guide.html` | 新手流程改為 AI 安裝頁優先，終端機保留為手動路徑。 |
| `runtime-core/RULE_PACKS.md` | 新增長期治理入庫的自然語言路由列。 |
| `packs/agent-governance.md` | 在既有治理規則包內加入長期治理入庫流程，並保留「接入 Agent Handoff Kit」只處理文件 orphan 的邊界。 |
| `scripts/check-pack-scenarios.mjs` / `scripts/check-release-readiness.mjs` | 新增 AI 安裝頁、長期治理入庫與終端機優先舊語句防回歸檢查。 |
| `docs/qa/release-grade-qa.md` | 增加 AI 安裝頁、長期治理入庫與產品旅程矩陣驗收列。 |

## 一條規則一個位置

| 規則或責任 | 唯一真源 | 其他位置角色 | 判定 |
|---|---|---|---|
| AI 代安裝 / 升級操作合約 | `agent-handoff-kit-ai-install.html` | README / intro / guide 只引導用戶把該頁交給 AI；`scripts/check-release-readiness.mjs` 只驗收。 | PASS |
| 手動 `npx` 入口 | README 手動入口與 CLI help | AI 安裝頁只在需要執行時列出命令；介紹頁只作新手示例。 | PASS |
| 長期治理入庫 | `packs/agent-governance.md` `Long-term Governance Routing` | `runtime-core/RULE_PACKS.md` 只路由；README 只用人可讀方式說明何時使用。 | PASS |
| 文件接入 Agent Handoff Kit | `packs/agent-governance.md` `Governance Bridge Workflow` | README / guide 只描述用戶可說的任務；未擴張成非文件治理。 | PASS |
| 實踐經驗轉機制 | WORK `docs/QA_STRATEGY.md` | public 候選只處理產品行為與驗收，不搬入另一套方法。 | PASS |

結論：符合 consolidation 原則。新增內容沒有另開平行規則文件；新增 HTML 是 AI 安裝入口，不是第二套治理規則。唯一需控制的負荷，是 README / intro / guide 同時出現同一句提示，因此已用自動檢查防止它們漂成不同操作流程。

## 治理健康八維

總判定：緊張。

建議方向：繼續。

| 維度 | 判定 | 摘要 |
|---|---|---|
| 開工負擔 | 健康 | 沒有增加預設 startup 必讀；只有用戶要求安裝 / 升級時才讀 AI 安裝頁。 |
| 真源清晰度 | 健康 | 安裝合約、長期治理入庫、文件接入三者分家，沒有共用同一模糊入口。 |
| 輸出邊界 | 健康 | `package.json` `files` 白名單不包含 HTML 與 QA 文件；npm package 邊界未擴張。 |
| 修補模式 | 緊張 | 同步修改 README、兩個 HTML、規則包、QA 腳本與 QA 文檔，屬多表面修補，需要報告與驗收承接。 |
| 執行落差 | 健康 | AI 安裝頁合約、長期治理 use cases、舊語句防回歸均已有機器驗收。 |
| onboarding / UX 缺口閉合 | 健康 | 新手只需貼一句 URL 指令給 AI；`Work in <folder>` 不再作預設要求。 |
| upgrade migration safety | 健康 | 未改安裝到用戶專案內的模板版本；既有升級鏈仍全通。 |
| CLI 場景分流一致性 | 健康 | 未新增 CLI 子命令；`init` / `upgrade` / `doctor` 情景仍由既有 scenario branching 驗收。 |

## 產品旅程矩陣

| 情景 | 狀態 | 證據 |
|---|---|---|
| Fresh install → init → first task | automated PASS | `npm run qa:release` user-flow install / doctor / startup boundary 通過。 |
| AI-assisted install page → folder confirmation → init / upgrade / doctor | automated PASS + manual PASS | `qa:release` AI install page contract 通過；人工終讀確認頁面要求先顯示並確認目前資料夾，未確認不執行。 |
| Existing project upgrade → doctor → closeout | automated PASS | `npm run qa:upgrade` 全鏈通過，包含 prior-version chain 到 current HEAD。 |
| Existing Kit files → official `npx --yes ... doctor` path | automated PASS | `qa:release` npx cold-start UX guidance 通過。 |
| Conflict / blocked state | automated PASS | AI 安裝頁與 upgrade fixtures 均要求 conflict 停手，不覆寫衝突。 |
| Natural-language task → rule pack → durable home | automated PASS | `qa:packs` 規則包路由與 durable-home routing 通過。 |
| Governance bridge / 文件接入 | automated PASS | `qa:packs` 四個 governance bridge 情景仍通過；語義未擴張至非文件。 |
| Long-term governance routing / 長期治理入庫 | automated PASS + manual PASS | `qa:packs` 三個長期治理 use case 通過；人工終讀確認無 exact trigger 時仍按內容分類。 |
| Package boundary | automated PASS | `qa:release` package dry-run / packed smoke 通過；AI 安裝頁不在 npm `files` 白名單。 |

## 人工終讀

| 項目 | 結果 |
|---|---|
| README 新手第一屏 | PASS：先給 AI 讀安裝頁；手動 `npx` 入口不是主流程。 |
| intro HTML | PASS：安裝步驟與「第一次用」區塊均指向 AI 安裝頁；舊終端機優先語句已移除。 |
| guide HTML | PASS：Case A、Case B 與結尾總結均改為 AI 安裝頁優先，終端機是手動路徑。 |
| `agent-governance` pack | PASS：文件接入與長期治理入庫是同一 pack 內兩個清楚 workflow，沒有互相改名。 |
| QA 文檔 | PASS：手動入口、AI install page、長期治理入庫與產品旅程矩陣用語一致。 |

## 機器驗收

| 檢查 | 結果 | 摘要 |
|---|---|---|
| `npm run qa:prototype` | PASS | install templates、doctor、update notice、package dry-run 通過。 |
| `npm run qa:packs` | PASS | 規則包路由、governance bridge、long-term governance 三類 use case 通過。 |
| `npm run qa:upgrade` | PASS | 既有升級、衝突、real fixtures、prior-version chain、anchor repair、user data preservation 通過。 |
| `npm run qa:release` | PASS | AI install page contract、npx UX、rule pack durable-home sweep、scenario branching、package smoke 通過。 |
| `git diff --check` | PASS | public 與 WORK 均無空白錯誤；只有 Windows 換行提示。 |

瀏覽器補充：嘗試讀取當前 in-app browser 的本機 `file://` 頁面時被瀏覽器安全政策阻擋。沒有使用繞路方式；改以原始 HTML 內容、人工終讀與 `qa:release` HTML 合約檢查承接。

## QC Gap Backflow

| 發現 | 產品修補 | QC 承接 |
|---|---|---|
| README / intro / guide 曾有終端機優先語句，會削弱新手 AI 安裝路徑。 | 文案改為 AI 安裝頁優先，終端機保留為手動路徑。 | `scripts/check-release-readiness.mjs` 新增 README 手動入口、AI install first、舊終端機優先語句防回歸 assertions。 |
| 長期治理容易被誤寫入 session log / handoff / prompt。 | `packs/agent-governance.md` 新增內容式長期治理入庫流程。 | `qa:packs` 三個長期治理 use case；`qa:release` rule pack durable-home sweep。 |
| 「接入 Agent Handoff Kit」可能被誤擴張到非文件情景。 | README 與 pack 明確保留其文件 orphan 原意；長期治理另立 workflow。 | `qa:packs` 同時驗 governance bridge 與 long-term governance，確認兩者路由不同但同屬治理 pack。 |

## 阻擋項

無產品阻擋項。

未完成的外部事項：尚未 commit、push、tag、GitHub Release、npm publish，也未執行發佈後七項驗證。這些均需另行明確批准。
