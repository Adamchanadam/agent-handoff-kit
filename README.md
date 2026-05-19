# Agent Handoff Kit

狀態：`v0.1.2` 已正式發佈。這是早期可用版本，尚未宣稱所有需求已完成。

Agent Handoff Kit 是一套給 AI 專案使用的交接工具。它會在你的專案中放入一組固定文件，讓 AI 在下一次工作時知道：目前做到哪裡、哪些資料要先讀、哪些檔案不可亂動、收工時要留下甚麼。

它不是聊天機器人，也不是另一個開發框架。它的作用比較像一本固定放在專案內的交接簿，讓不同 AI 工具和不同工作階段都能接上同一條線。

## 它解決甚麼問題

AI 很容易在新工作階段失去前文。它可能不知道上次改了甚麼、哪些文件才是最新、哪些資料只是參考、哪些操作需要先問你。

Agent Handoff Kit 把這些事情寫進專案文件：開工先讀哪裡、任務前要確認哪些必讀資料、收工要留下哪些交接內容、下次要貼哪段文字重新開始。

## 適合誰使用

適合以下情況：

- 你會隔幾天才回到同一個 AI 專案。
- 你會在 Codex、Claude Code、Gemini CLI 等工具之間切換。
- 你希望 AI 每次開始前先讀專案狀態，而不是重新猜背景。
- 你希望收工時留下下一次可直接貼上的開工文字。
- 你不是開發人員，但想讓 AI 在長期專案中穩定接力。

不適合以下情況：

- 只問一次性問題，不需要保存專案狀態。
- 不想在專案內新增任何交接文件。
- 需要已完全成熟的穩定版安裝工具。

## 安裝

在你的專案資料夾打開 Terminal，執行：

```bash
npx @adamchanadam/agent-handoff-kit init
```

出現確認問題時，輸入：

```text
y
```

若工具列出即將建立的文件，並詢問是否寫入，請輸入：

```text
yes
```

安裝完成後，你會看到一個「下一步」區塊。請特別留意：那一段不是給 Terminal 的指令，而是給 AI 對話使用的文字。

## 安裝後第一步

安裝完成後，不要在 Terminal 輸入 `Follow AGENTS.md`。

正確做法是：

1. 打開你要使用的 AI 工具。
2. 新增一段對話。
3. 貼上安裝工具顯示的 `Work in ...` 文字。
4. 要求 AI 先讀 `AGENTS.md`，並在改檔前說明它讀到的目前狀態。
5. 然後直接描述你要完成的任務。

你可以貼上類似以下文字：

```text
Work in <你的專案資料夾>.
Read AGENTS.md first. Tell me what you understand before changing files.
```

接著再寫你的任務，例如：

```text
整理這個專案，先告訴我目前狀態、下一步、風險，暫時不要改檔。
```

或：

```text
更新 README，完成後檢查交接文件是否仍然準確。
```

## 檢查是否安裝完整

如要檢查安裝是否完整，可在 Terminal 執行：

```bash
npx @adamchanadam/agent-handoff-kit doctor
```

看到 `status: passed`，代表必要文件與基本結構存在。

這個檢查只能確認文件結構，不代表 AI 已理解你的專案。真正開始工作前，仍應要求 AI 先讀入口文件並說明目前狀態。

## 會安裝甚麼

安裝工具會在你的專案中建立以下文件：

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

每個文件的用途如下：

| 文件 | 用途 |
|---|---|
| `AGENTS.md` | AI 開工時最先讀的入口文件。 |
| `CLAUDE.md` | 讓 Claude Code 找到同一套入口。 |
| `GEMINI.md` | 讓 Gemini CLI 找到同一套入口。 |
| `dev/SESSION_HANDOFF.md` | 保存目前狀態、下一步、風險、驗收結果與下一次開工文字。 |
| `dev/SESSION_LOG.md` | 保存近期實際做過的事與檢查結果。 |
| `dev/PROJECT_INDEX.md` | 記錄專案檔案、必讀資料、外部來源與常用檢查。 |
| `dev/DOC_SYNC_REGISTRY.md` | 記錄哪些文件改動後需要同步。 |
| `dev/RULE_PACKS.md` | 告訴 AI 不同任務應讀哪些工作規則。 |
| `dev/rules/*.md` | 按任務載入的細分工作規則。 |

你不需要自己逐一閱讀全部文件。你的工作是描述目標；AI 的工作是讀入口文件、判斷要讀哪些資料，再告訴你它準備怎樣做。

## 日常使用方式

每次開始新的 AI 工作階段時，建議先貼上上一輪收工產生的開工文字。若沒有那段文字，可以貼：

```text
Work in <你的專案資料夾>.
Read AGENTS.md, dev/SESSION_HANDOFF.md, dev/SESSION_LOG.md, dev/PROJECT_INDEX.md, and dev/RULE_PACKS.md.
Tell me the current objective, pending work, risks, and your recommended next action before changing files.
```

然後直接描述任務。

對簡單任務，可以這樣寫：

```text
幫我檢查 README 是否清楚，先只提出問題，不要改檔。
```

對需要改檔的任務，可以這樣寫：

```text
請更新 README 的安裝後說明，完成後執行必要檢查，並告訴我改了甚麼。
```

對需要收工的情況，只需輸入：

```text
收工
```

也可以輸入：

```text
wrap up
handoff
```

AI 應更新交接文件，並輸出下一次可直接貼上的開工文字。那段文字會放在 fenced `text` code block 內，方便完整複製。

## 工作規則怎樣運作

Agent Handoff Kit 會把任務分成不同工作模式。例如：

| 你的任務 | AI 應使用的工作規則 |
|---|---|
| 修改程式、檢查錯誤、執行測試 | `coding`；涉及刪除、覆寫、Git、套件管理或外部服務時加 `safety` |
| 改 README、寫說明、整理文案 | `writing`，通常再加 `communication` |
| 查證資料、比較來源、整理證據 | `research` |
| 整理 Notion、Google Drive 或知識庫 | `knowledge` |
| 準備發佈說明 | `release`；真正發佈、上傳或建立版本前必須加 `safety` |

原則是只讀當前任務需要的規則，不是每次讀全部文件。

## 既有專案升級

若你的專案已經有 `AGENTS.md` 或其他 AI 記憶文件，請先預演，不要直接覆寫：

```bash
npx @adamchanadam/agent-handoff-kit upgrade --dry-run
```

確認計劃後再執行：

```bash
npx @adamchanadam/agent-handoff-kit upgrade
```

升級工具會保留既有檔案。能安全合併時才合併；不能安全合併時會報 conflict，不會靜默覆寫。

## 語言使用

安裝後的核心指令文件預設使用英文，原因是不同 AI 工具對英文結構較穩定。這不是限制你的專案必須用英文。

你的交接筆記、任務說明和文件內容可以使用中文或其他語言。需要機器檢查的結構，會由模板內的 `ack:section:*` 與 `ack:field:*` 標記承擔。

## 原始碼倉庫驗收

以下指令供維護者檢查原始碼倉庫，不是一般用戶日常必須執行的步驟：

```bash
npm run qa:prototype
npm run qa:packs
npm run qa:upgrade
npm run qa:release
```

這些檢查涵蓋安裝、`doctor`、套件預演、過時字串、公開輸出污染標記、工作規則路由、升級安全，以及從安裝到收工再到下一次開工的流程模擬。

## 套件邊界

npm package 只包含安裝所需內容：

- `bin/`
- `runtime-core/`
- `packs/`
- `README.md`
- `LICENSE`
- `package.json`

原始碼倉庫中的驗收文件與腳本供維護者使用，不會安裝到你的專案。

## 目前限制

- `v0.1.2` 是早期可用版本，尚未宣稱完整穩定。
- 這仍是早期可用版本，尚未宣稱完整穩定。
- 升級合併仍是窄範圍策略，不是完整的複雜合併工具。
- `doctor` 能檢查結構，不能代替 AI 對專案內容的理解。
- 未取得明確批准前，不應因安裝成功而自動建立新版本、發佈或上傳任何內容。
