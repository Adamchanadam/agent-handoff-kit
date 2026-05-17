# 場景預演摘要

## 用途

本文件保存場景設定檔的公開摘要。詳細 WORK 設計與歷史紀錄不放入公開 runtime。

## 已驗證方向

五類預演支持同一結論：場景設定檔應是薄路由層，而不是另一套大型規則。

| 場景 | 結論 |
|---|---|
| 市場研究 → 商業分析 → 網站文案 | 可分階段載入 `research`、`writing`、`communication` |
| Notion / Drive 外部資料研究 | 需要先判斷外部資料是真源、索引、附件還是輸出地 |
| coding → docs → release prep | 可分階段載入 `coding`、`writing`、`release`；實際發佈前才加 `safety` |
| 代理工作流 → 知識庫同步 → closeout | 可用 `agent-governance`、`knowledge`、`communication` |
| 資料分類 → 真源標記 → 同步包 | 可用 `knowledge`、`writing`，需要查證時加 `research` |

## 公開輸出判斷

目前不新增 `profiles.md` 或 `profiles/*.md`。README 與指令說明只需要告訴用戶：AI 會按任務選擇工作模式，並載入最少必要規則包。

## 驗收

`npm run qa:packs` 檢查這些路由原則沒有漂移。
