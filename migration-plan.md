# 遷移計劃

## 目標

本文件說明如何從舊式單檔或未治理專案，遷移到 Agent Handoff Kit。

## 遷移路徑

| 情況 | 建議指令 | 說明 |
|---|---|---|
| 全新空專案 | `init` | 建立完整 runtime |
| 既有專案 | `upgrade --dry-run` | 先查看 create / merge / skip / conflict |
| 已有 `AGENTS.md` | `upgrade` | 只在安全範圍內加入 managed core |
| 已有工具記憶檔 | `upgrade` | 無法安全判斷時報 conflict |

## 必須保留的資料

- 使用者原有規則；
- 專案既有 README / docs；
- 現有 handoff / log；
- 未知自訂段落；
- credentials 或 local-only 設定。

## 安全邊界

遷移不得：

1. 靜默覆寫既有檔案；
2. 刪除未知檔案；
3. 重置 Git history；
4. 自動 tag、publish、deploy；
5. 把 WORK session state 放入 public runtime。

## 驗收

遷移後必須跑：

```bash
agent-handoff-kit doctor --root <project>
```

Prototype 階段可用：

```bash
node bin/agent-handoff-kit.mjs doctor --root <project>
```

若 `doctor` 未通過，應先處理缺失檔案、錨點或 schema 問題，再進行下一輪工作。
