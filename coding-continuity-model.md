# 程式開發接力模型

## 用途

本文件說明 Agent Handoff Kit 如何支援 coding 任務的跨 session 接力。

## 程式開發任務開工

AI 應先讀：

1. `AGENTS.md`
2. `dev/SESSION_HANDOFF.md`
3. `dev/PROJECT_INDEX.md`
4. `dev/RULE_PACKS.md`
5. 需要時讀 `dev/rules/coding.md`

涉及檔案刪除、Git、package manager、SDK、API、deploy 或 credential 時，必須同時讀 `dev/rules/safety.md`。

## 程式開發任務中

AI 應：

- 先找相關檔案，不作無關重構；
- 優先使用專案既有測試與工具；
- 修改後記錄驗收結果；
- 若測試不能跑，說明原因；
- 不把未驗證內容寫成已通過。

## 程式開發任務收工

收工時應更新：

- 已改動檔案；
- 測試結果；
- 未解風險；
- 下一步；
- workspace identity；
- opening message。

## 成功標準

下一個 AI 只讀 handoff、project index 與需要的 packs，就能知道：

1. 哪些改動已完成；
2. 哪些檢查已跑；
3. 哪些檢查未跑；
4. 哪裡不能亂碰；
5. 下一步應做甚麼。
