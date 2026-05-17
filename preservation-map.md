# 保留價值對照

## 用途

本文件說明 Agent Handoff Kit 從舊版治理思路中保留甚麼、刪減甚麼，以及原因。

## 必須保留

| 舊價值 | 新承載位置 | 原因 |
|---|---|---|
| 開工讀序 | `AGENTS.md`、`SESSION_HANDOFF.md` | 確保 AI 不靠猜測開始 |
| Session handoff | `dev/SESSION_HANDOFF.md` | 保存 current state 與下一步 |
| Session log | `dev/SESSION_LOG.md` | 保存近期證據，不承擔現況 |
| Project index | `dev/PROJECT_INDEX.md` | 讓 AI 知道專案地圖 |
| Doc sync registry | `dev/DOC_SYNC_REGISTRY.md` | 防止文件口徑漂移 |
| 高風險操作安全 | core baseline + `dev/rules/safety.md` | 核心短規則加按需細則 |
| 收工 opening message | handoff / log | 下一個 session 可直接接力 |

## 應刪減

| 舊做法 | 處理 |
|---|---|
| 單一巨大 prompt | 拆成 core + packs |
| 所有情境常駐讀取 | 改為按任務載入 packs |
| 反覆把 log 依行數拆檔 | 改為 handoff / log / archive 分工 |
| 多工具各維護完整規則 | 改為 thin bridge |

## 不輸出到公開 runtime

- WORK session log；
- 未定案草稿；
- 舊 repo backlog；
- private repo URL 或本機內部路徑；
- 研究過程的長篇推理紀錄。

## 驗收方式

1. `npm pack --dry-run` 不包含 WORK state。
2. `doctor` 檢查 runtime 必備檔案與錨點。
3. README 能讓用戶知道如何安裝、使用與收工。
4. UAT 能展示實際任務與 packs 應用痕跡。
