# v0.3.44 Candidate 全面檢報告

狀態：**PASS / RELEASE-READY CANDIDATE**。本地候選已建立乾淨 Git commit identity，並在獨立 clean checkout 內通過頂層 `scripts/check-release-readiness.mjs`。尚未 push、tag、建立 GitHub Release 或 npm publish；實際公開發佈仍屬外部寫入步驟。

## 證據身分

- 產品來源：從已發布 v0.3.43 後的公開 source baseline 建立的隔離本地候選；最終 commit hash 以發佈前 `git rev-parse HEAD` 讀回為準，不寫入本自包含報告以避免自我引用。
- 變更範圍：繁體中文與英文公開 README／入門／實操指南／AI 安裝頁／本機工作系統案例的內容對齊；翻譯對齊只在該中英文文件對改動時觸發，並非既有 release checker 的永久四頁人工重審 ritual。
- npm 邊界：HTML、QA scripts、fixtures 和本報告不會進入 npm；候選 runtime package 預期仍為 35 個檔案。

## 1. 治理健康

候選使用既有 `docs/qa/release-grade-qa.md` 和 `scripts/check-release-readiness.mjs`，沒有建立新的 QA 或文件真源。release checker 只保留公開頁存在、雙向導航、語言宣告、版本／命令、startup/onboarding 契約、official-origin catalog raw fixture 身分、R-034 vertical、pack/install smoke 等長期契約；翻譯語意審閱只在文件對有改動時觸發。候選已用 clean checkout 跑完頂層 release readiness。

## 2. 產品旅程矩陣

| 旅程 | 目標 | 結果 |
| --- | --- | --- |
| 已改動的中英文文件對 | 與中文頁保持同一操作、限制、案例、視覺語氣與導航 | passed — README、intro、guide、AI install、local workflow case study 均已有變更觸發式語意／視覺讀回與 hash evidence |
| R-034 upgrade journey | 原始 bytes、規則效力、recovery 和同一 current state 不回歸 | passed — release readiness 實跑 R-034 inventory、semantic candidate、official-origin catalog、Gate 5 closure、artifact vertical、Phase-0 final closure、upgrade safety |
| packed install | 實際 npm tarball 的 install／upgrade／doctor | passed — release readiness 實跑 npm package dry-run、packed tarball、packed install、prior-version upgrade smoke、doctor、second upgrade no-phantom |

## 3. 使用者旅程與顯示結果

英文頁不可只翻譯標題或保留導航。每個入口都必須用日常英文說明使用者要做甚麼、AI 會做甚麼、甚麼時候會安全停手，以及下一步應在 AI 對話而非終端機完成。本候選已補回 strict bare-start、decision-first onboarding、AI install/upgrade safety、local-agent boundary、external tool readback 與 Adam-AI-Instructions 分界。

## 4. QC 缺口回流

本輪把「兩頁可互相連結」與「兩種語言內容完整對應」分開驗證。前者是長期機械底線；後者是文件實際改動時由獨立讀回裁決的交付驗收。字數、emoji、關鍵字、HTML 元素數與舊 PASS 不能作第二者的替代品。

## 5. 規則／pack 路由與入庫範圍

公開使用說明保留在 README 和 GitHub Pages HTML；可安裝 runtime 仍只包含 CLI、runtime core、packs、README 和 LICENSE。QA 工具及本報告只留在 full-source QA owner，並由公開 mirror boundary 阻擋進入 npm package。

## 結論

- 公開中英文內容對齊：**PASS**，但只作變更觸發式交付證據，不變成每次 release 的常駐人工翻譯 ritual。
- 既有產品旅程：**PASS**，由頂層 release readiness 重新跑 R-034、official-origin catalog、upgrade safety、packed install/upgrade/doctor 與 startup/onboarding assertions。
- v0.3.44 release readiness：**YES for local candidate**；尚未 push、tag、建立 GitHub Release 或 npm publish。
