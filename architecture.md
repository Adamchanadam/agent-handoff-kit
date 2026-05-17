# 架構

## 核心形態

Agent Handoff Kit 由三層組成：

1. CLI：負責 `init`、`upgrade`、`doctor`。
2. Runtime core：安裝到使用者專案的啟動、交接、索引與同步模板。
3. Rule packs：按任務載入的工作模式規則。

## 安裝後結構

```text
AGENTS.md
CLAUDE.md
GEMINI.md
dev/SESSION_HANDOFF.md
dev/SESSION_LOG.md
dev/PROJECT_INDEX.md
dev/DOC_SYNC_REGISTRY.md
dev/RULE_PACKS.md
dev/rules/*.md
```

## 入口設計

`AGENTS.md` 是主要入口。`CLAUDE.md` 與 `GEMINI.md` 是薄橋接檔，只導向同一套啟動流程，不複製完整規則。

這樣做可以同時支援多個 AI 工具，又避免多份規則互相漂移。

## 記憶分層

| 層級 | 檔案 | 用途 |
|---|---|---|
| 熱資料 | `AGENTS.md`、`SESSION_HANDOFF.md`、`PROJECT_INDEX.md` | 每次開工需要讀的現況與路由 |
| 溫資料 | `DOC_SYNC_REGISTRY.md`、`RULE_PACKS.md`、`dev/rules/*.md` | 按任務讀取的同步與工作模式 |
| 冷資料 | 舊 `SESSION_LOG.md` 條目與必要 archive | 審計追溯，不承擔 current state |

## 指令工具責任

| 指令 | 作用 |
|---|---|
| `init` | 在新專案建立缺失的 runtime 檔案 |
| `upgrade` | 在既有專案安全補齊或合併必要檔案 |
| `doctor` | 檢查必備檔案、錨點與基本結構 |

CLI 不應靜默覆寫使用者內容。遇到不能安全處理的既有檔案時，應報 conflict。

## 套件邊界

npm package 只包含：

```json
[
  "bin/",
  "runtime-core/",
  "packs/",
  "README.md",
  "LICENSE"
]
```

`scripts/` 與 `docs/qa/` 是 source-repository assets，不進入安裝後 runtime。
