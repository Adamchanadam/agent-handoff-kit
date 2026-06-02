# Project Decisions Log

這個檔保存項目的長期演進、決策、架構取捨與學習觀察 narrative。屬 warm 資料層 —— AI 開工**不需要讀**本檔。

🔹 短期 single-task project：本檔保持近空，你不需要 maintain
🔹 長期持續演進項目：AI 會在收工時先做維護觸發檢查；命中觸發或到定期兜底時才完整整理。當你問「我們之前為何這樣做」時，AI 會在這裡找答案

不需要你手動寫 —— AI 在收工時自動 update；重大決策可在發生時即時記錄，不必等到最後才回想。

Research-derived decisions use this compact evidence-chain format inside the relevant section, without creating a new section:

```text
- YYYY-MM-DD [research-derived] Decision summary. Evidence chain: Source=source:<id>; Summary=<source finding>; Inference=<reasoning>; Decision impact=<what changed>; Uncertainty=<limits or none>.
```

The `source:<id>` token must also appear in `dev/PROJECT_INDEX.md` under `Fact Base` or `External Sources`, so later sessions can trace the decision back to its source map.

This file does not store raw build / upload / QC evidence, current next actions, one-time task results, or reusable operating procedures. Keep those in `dev/SESSION_LOG.md`, `dev/SESSION_HANDOFF.md`, or the relevant rule pack / registered reference.

---

## Evolution Timeline

任務需求演進的長期 narrative。Newest first。AI 觀察到 substantive task evolution 時 append。

(empty)

## Decisions Archive

由 SESSION_HANDOFF.md 的「Confirmed Decisions」或同類 decisions section 累積至 30+ 時，AI 自動 split 落這裡的舊條目。Newest first。

(empty)

## Architecture Choices

主要架構取捨與 rationale。AI 在 plan 涉及 multi-option trade-off 時 append，並等用戶 confirm。

(empty)

## Insights & Learnings

累積式學習、反思、觀察。AI 觀察到多 session 累積 pattern 時 append。

(empty)
