# Agent Handoff Kit

狀態：`v0.1.0` 已正式發佈。這是早期可用版本，仍未達 requirements-complete。

Agent Handoff Kit 是一套輕量 AI 專案延續工具。它幫助 AI 在多個 session 之間保留專案狀態、交接訊息、檔案地圖與工作邊界，避免下一次開工時重新猜測背景。

## 它解決甚麼問題

Agent Handoff Kit 讓 AI 有一套固定、可重複的專案記憶流程：

- 開工時，AI 讀同一組入口檔，不靠聊天記憶猜測現況。
- 工作時，AI 只載入當前任務需要的規則包，例如 coding、writing、research、knowledge sync、release 或 safety。
- 複雜任務開始前，AI 先確認本次必讀事實來源；找得到資料不等於已讀入，未讀來源不能當成沒有資料。
- 收工時，AI 不是只追加紀錄；它要對賬 handoff 內的當前狀態，確認沒有過時快照，再輸出下一次 session 可直接貼上的 opening message。
- 下一次 session 即使換了 AI，也能從專案檔案接續，而不是依賴上一段對話。

適合用於長期專案、跨 session AI 協作、需要穩定交接的 coding / writing / research / knowledge 管理工作。

## 安裝

目前正式公開版本為 `0.1.0`。npm package 名稱是 `@adamchanadam/agent-handoff-kit`，安裝後提供的 CLI 指令仍是 `agent-handoff-kit`。新專案可使用：

```bash
npx @adamchanadam/agent-handoff-kit init
```

既有專案升級會使用：

```bash
npx @adamchanadam/agent-handoff-kit upgrade
```

健康檢查：

```bash
npx @adamchanadam/agent-handoff-kit doctor
```

如要從原始碼倉庫本機測試，可使用：

```bash
node bin/agent-handoff-kit.mjs init --yes --root <your-project>
node bin/agent-handoff-kit.mjs doctor --root <your-project>
```

既有專案請先預演：

```bash
node bin/agent-handoff-kit.mjs upgrade --dry-run --root <your-project>
node bin/agent-handoff-kit.mjs upgrade --yes --root <your-project>
```

installer 預設保留既有檔案；不能安全合併時會報 conflict，不會靜默覆寫。

## 會安裝甚麼

installer 會在你的專案中建立：

- `AGENTS.md`：主要 AI 入口。
- `CLAUDE.md`、`GEMINI.md`：給 Claude Code 與 Gemini CLI 的薄橋接入口。
- `dev/SESSION_HANDOFF.md`：保存耐久錨點、每次收尾必對賬的當前狀態、任務理解摘要、下一步、風險、驗收與工作區身份。
- `dev/SESSION_LOG.md`：保存近期實際發生過的工作證據。
- `dev/PROJECT_INDEX.md`：記錄專案檔案、必讀事實來源、外部來源、指令、入口與變更熱點。
- `dev/DOC_SYNC_REGISTRY.md`：記錄文件或外部索引需要同步的情況。
- `dev/RULE_PACKS.md`：告訴 AI 不同任務應載入哪些規則包。
- `dev/rules/*.md`：按需載入的工作模式規則包。

你不需要每次自己讀完所有檔案。AI 應讀啟動檔，判斷任務，載入需要的規則包，並告訴你目前使用甚麼工作模式。

## 日常使用

開新 session 時，貼上 `dev/SESSION_HANDOFF.md` 內的 opening message。也可以對 AI 說：

```text
Work in <your-project>.
Read AGENTS.md, dev/SESSION_HANDOFF.md, dev/SESSION_LOG.md, dev/PROJECT_INDEX.md, and dev/RULE_PACKS.md.
```

然後直接描述任務：

```text
更新 README，並確認 handoff 仍然準確。
```

AI 應該：

1. 確認目前目標與工作區。
2. 說明本次會使用哪些規則包。
3. 對非簡單任務，先列出本次必讀事實來源，讀取或標記 blocked。
4. 完成任務並執行必要檢查。
5. 收工時對賬 handoff 的當前狀態，更新 handoff / log。

要結束 session，只需輸入：

```text
收工
```

或：

```text
wrap up
handoff
```

AI 會更新交接檔，並輸出下一次 session 可直接貼上的 fenced `text` code block。

## 工作模式與規則包

規則包是 AI 的工作模式守則，不是要求用戶閱讀的額外說明書。

| 你的任務 | 預期使用的 packs |
|---|---|
| 修 code、跑 tests、處理 build | `coding`；涉及檔案、Git、package manager、API、deploy 風險時加 `safety` |
| 寫作、改 README、整理文案 | `writing`，通常再加 `communication` |
| 查證資料、比較來源 | `research` |
| 整理 Notion、Drive、知識庫 | `knowledge` |
| 準備 release note | `release`；真正 tag、publish、upload、deploy 前加 `safety` |

原則是載入最少必要 packs，不是每次讀全部規則。

## 原始碼 repo 驗收

本倉庫有原始碼專用驗收；這些指令用來驗證 prototype，不會安裝到使用者專案：

```bash
npm run qa:prototype
npm run qa:packs
npm run qa:upgrade
npm run qa:release
```

這些檢查涵蓋安裝、`doctor`、套件預演、過時字串、公開輸出污染標記、規則包路由、升級安全、發佈前準備度，以及從安裝到收工再到接力開工的用戶流程模擬。

## 安裝後形態

安裝後的核心結構如下：

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

`AGENTS.md` 是主要入口。`CLAUDE.md` 與 `GEMINI.md` 只做橋接，導向同一套啟動流程，不複製完整規則。

## 跨語言項目

Agent Handoff Kit 的 runtime instruction 預設使用英文，是為了跨工具穩定與降低 token 成本，不是限制用戶項目的工作語言。你的專案可以用中文、日文或其他語言撰寫 `dev/SESSION_HANDOFF.md` 的段落標題與可見欄位名稱。

做法是保留模板內的 `ack:section:*` 與 `ack:field:*` 語義標記，然後翻譯標題與欄位文字。`doctor` 會驗這些語義標記，而不是要求每個交接段名必須維持英文。

## 倉庫與套件邊界

npm package 只保留安裝所需 runtime：

- `bin/`：prototype CLI。
- `runtime-core/`：安裝到專案內的核心模板。
- `packs/`：安裝到 `dev/rules/*.md` 的規則包。
- `README.md`、`LICENSE`、`package.json`。

原始碼倉庫另外包含設計與驗收文件，供維護者審核，不會進入安裝後的 runtime：

- `docs/qa/`：發佈級驗收計劃。
- `scripts/`：原始碼倉庫專用驗收腳本。
- root 層設計文件：問題定義、架構、遷移、保留價值、複雜度與停止規則等。

## 非破壞性原則

本公開草案不修改舊版 `ai-session-governance` repo。`INIT.md` 不是 Agent Handoff Kit 的主要安裝路徑。
