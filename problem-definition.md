# 問題定義

## 背景

AI 長期協作最常見的失敗，不是單次回答錯誤，而是跨 session 後失去上下文。下一個 AI 往往不知道目前目標、最近決策、哪些檔案是權威來源、哪些檢查已跑、哪些操作不可做。

Agent Handoff Kit 的目標，是用小型、可安裝、可驗收的 runtime，讓 AI 在不同 session 之間維持專案延續性。

## 核心問題

1. AI 只靠聊天記憶，下一輪很容易失去現況。
2. 專案文件、handoff、log、README、外部知識庫容易口徑漂移。
3. 舊式大型 prompt 把所有規則塞進每次啟動，會令 AI 讀入過多不相關內容。
4. 既有專案通常已有自己的 `AGENTS.md`、docs 或規則，installer 不能粗暴覆寫。
5. 使用者不應需要記住冗長收工指令；AI 應能偵測 `收工`、`wrap up`、`handoff` 等自然語言意圖。

## 產品判斷

Agent Handoff Kit 不做大型 agent platform。它只提供一套輕量專案延續層：

- 啟動入口；
- session handoff；
- session log；
- project index；
- doc sync registry；
- 按需載入的 rule packs；
- 安全安裝與健康檢查。

## 成功條件

1. 新專案可安裝 runtime。
2. 既有專案可 dry-run upgrade，並保留使用者已有內容。
3. AI 能從 handoff 與 project index 安全接力。
4. Rule packs 能按任務載入，不需每次讀全部規則。
5. `doctor` 能檢查必備檔案、關鍵錨點與基本結構。
6. 收工後能輸出下一次 session 可直接貼上的 opening message。

## 不做的事

1. 不把所有治理規則塞入單一巨大 prompt。
2. 不預設綁定某一 AI 工具。
3. 不在沒有明確批准時 tag、建立 GitHub Release 或 npm publish。
4. 不把 WORK session state 放入 public runtime。
