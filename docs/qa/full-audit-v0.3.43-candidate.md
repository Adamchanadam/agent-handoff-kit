# v0.3.43 Candidate 全面檢報告

狀態：本機候選通過；未推送、未標籤、未發佈。

## 證據身分

- 產品修補基線提交：`1a8db1fe8ff09c5f595cd0f40c73bfa66931d900`；本報告與最後的 QA 契約修正在本機候選提交內一併保存。
- 公開產品檔集合：89 個檔案；SHA-256 `5d233060728a8d447e6985ab2e0201f6cf3c14621ff5feb789dfc4b11acac15c`。
- QA harness 集合（`scripts/`、`test-fixtures/`、本報告以外的 release-grade QA 文件）：193 個檔案；SHA-256 `7bbd7a64eaf71bc35cc19f41dd7ba430af87d77933f608b10d10b22076e33dcb`。
- 本機 npm tarball：35 個檔案（新增 `README.en.md`）；shasum `b87e01b5bce9c78992ae9e7f6c4ef9035dfc4332`；integrity `sha512-f78KWCF77I2zFgy3SdeUFCkI3iEhvL/WMH5LyMOvmXcF2wAeohzTzJnXS1ERP+mtR1wJghLc1JYLe+Q5LqGVVQ==`。
- 全面檢命令：`node scripts/check-release-readiness.mjs`；結果為 `Agent Handoff Kit release readiness QA passed`。

QA scripts、fixtures 與本報告屬 full-source QA owner；npm package 明確不包含它們。這樣產品、驗收工具與封包內容可以各自追溯，而不會把本機驗收工具誤當成公開套件內容。

## 1. 治理健康

公開產品版本、CHANGELOG、README、三個公開 HTML 入口、release note 格式與 npm package allowlist 已對齊為 v0.3.43 candidate。公開 mirror、pack routing、prompt mirror、closeout card、onboarding 與 failure propagation 均由頂層全面檢實跑，不是只檢查文字存在。

繁體中文 README、入門、實操指南與 AI 安裝頁均保留原網址；新增的英文 README 與三個英文 HTML 對應頁均有雙向語言導航，並由頂層 checker 驗證。英文 README 是正式公開內容，因此 npm package 由 34 個檔案增加至 35 個檔案；QA 與 fixtures 仍不入包。

乾淨上下文本機唯讀覆核沒有 blocker 或 major finding。它提出兩項 minor：doctor 的「正常下一步」曾只檢查沒有錯誤提示，現已補為必須實際輸出正常、非重複升級的下一步；封包 smoke 不重複 raw-byte drift，因 direct artifact 直向測試已覆蓋該失敗路徑，避免重複測試矩陣。

## 2. 產品旅程矩陣

| 旅程 | 結果 | 證明 |
| --- | --- | --- |
| 已發布 v0.3.42：v0.3.41 direct AGENTS 升級後 doctor | red 已精確重現 | accepted current state 是 v0.3.42，但 PROJECT_INDEX 保留 v0.3.41 時仍叫使用者再次升級。 |
| v0.3.41 artifact + 無標題用戶 suffix → v0.3.43 | 通過 | exact Kit core 更新；109-byte suffix 原樣保留；完整 source range 可重建；direct AGENTS reader/effect 仍生效。 |
| 同一旅程的 doctor／report／success | 通過 | 都讀同一 `currentStateDigest`；doctor 顯示 accepted current-state version，不再把保留 metadata 當作必須升級。 |
| 第二次 upgrade | 通過 | 沒有 phantom transaction；fresh doctor 結論一致。 |
| bytes drift、無效 witness、transaction interruption/recovery | 通過 | drift 不能假綠；恢復只呈現完整舊或新狀態。 |
| npm pack/install 後的同一 v0.3.41 旅程 | 通過 | real tarball install、upgrade、first/second doctor 均通過同一語意檢查。 |

## 3. 使用者旅程與顯示結果

根修不只是改 doctor 一句字。doctor 現在先驗證同一份 current-state witness，才把其中已接受的版本作為項目目前狀態；PROJECT_INDEX 的舊版本會清楚標成「保留資料」，而不是再被誤當成升級指令。

因此，成功升級後使用者會看見工具版本、已接受目前狀態、保留 metadata（如有）及 npm latest 的分別；正常情況會得到可繼續使用 AI 的下一步，不會被錯誤要求再跑 `upgrade --dry-run`。witness 缺失或失效時，原本的安全拒絕仍會生效，不能用 accepted version 掩蓋錯誤。

## 4. QC 缺口回流

v0.3.42 的缺口是「狀態顯示」和「全面檢成功條件」不同步。v0.3.43 把它回流到兩層驗收：

1. v0.3.41 direct-AGENTS artifact journey 會檢查 first/second doctor 的版本、下一步語意、同一 digest、bytes、reader/effect、second-upgrade 及 drift/recovery。
2. packed candidate smoke 重用同一 doctor 語意，頂層 checker 必須傳遞子 checker 的失敗，不能只因 exit code 為零而宣稱健康。

## 5. 規則／pack 路由與入庫範圍

fresh formal USER_RULES router 由 `qa:prototype` 覆蓋；歷史 direct AGENTS 用戶 suffix 由 artifact vertical 覆蓋。兩者同時由頂層全面檢執行，任何一方失敗都不可成功。

QA source owner 收納 scripts、fixtures 和 QA documents，方便重建與審計；lean public mirror 和 npm package 只收納公開產品所需內容。這是範圍分離，不是刪除驗收。

## 結論

- doctor/current-state 根修：通過。
- 全面檢機制：通過，且已涵蓋 v0.3.42 假綠的同一使用者可見失敗。
- R-034 完整升級旅程：本候選的 v0.3.41 direct-AGENTS 代表旅程通過；既有 fresh formal router 旅程亦通過。
- 實際發佈：尚未進行。本報告不構成 push、tag、GitHub Release 或 npm publish 授權。
