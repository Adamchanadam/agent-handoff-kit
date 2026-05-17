# 複雜度預算 schema

## 用途

本文件定義 Agent Handoff Kit 的複雜度預算，用來避免 runtime 變重。

## 預算項目

| 項目 | 原則 |
|---|---|
| Always-read files | 只保留啟動與接力必需內容 |
| Rule packs | 按任務載入，不預設全讀 |
| Session log | 保存證據，不承擔 current state |
| Handoff | 保存目前狀態與下一步 |
| Public package | 只包含 CLI、runtime-core、packs、README、LICENSE |
| QA docs / scripts | 留在 source repo，不進 package |

## 超標訊號

1. README 無法讓用戶快速入手。
2. AI 每次需要讀太多舊 log。
3. 同一規則出現在多個真源。
4. 新增文件沒有對應驗收。
5. Package boundary 意外擴大。

## 驗收

使用 `npm pack --dry-run`、`doctor` 與 source QA 指令檢查。
