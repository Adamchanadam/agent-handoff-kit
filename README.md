# Agent Handoff Kit

狀態：`v0.1.8` 已正式發佈到 GitHub 與 npm。這是早期可用版本，尚未宣稱所有需求已完成。

![Agent Handoff Kit 主視覺](https://raw.githubusercontent.com/Adamchanadam/agent-handoff-kit/main/images/agent-handoff-kit-main-visual2.png)

Agent Handoff Kit 是 **AI Session 之間的接力棒**。

它只處理一件狹窄但重要的事：AI 跨對話失憶。每次開新對話，AI 往往不記得你上次做到哪裡，也認不出中途新建的文件、你引入的參考資料、哪些檔案是真源。這套工具把進度、下一步、風險、檔案登記與下次開工提示寫進固定文件，讓下一個 AI 工具能接得上上一棒。

想先看非技術版介紹，可打開 GitHub Pages 上的 [`agent-handoff-kit-intro.html`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-intro.html) —— 新手 60 秒入門。看完想睇實際操作示範，可開 [`agent-handoff-kit-guide.html`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html) —— 兩個日常情景（整理電腦下載目錄、開咖啡店市場調查）嘅七步流程完整示範。README 則保留安裝、日常使用與限制。

## 它解決甚麼問題

用 AI 做長期項目，常見四個問題：

| 問題 | Agent Handoff Kit 怎樣處理 |
|---|---|
| 新 AI 不知做到哪 | 用 `dev/SESSION_HANDOFF.md` 保存目前狀態、下一步、風險與驗收。 |
| 新建檔案、參考資料變孤兒 | 用 `dev/PROJECT_INDEX.md` 與 `dev/DOC_SYNC_REGISTRY.md` 登記檔案角色、真源與同步責任。 |
| 不同 AI 工具入口不同 | 同時安裝 `AGENTS.md`、`CLAUDE.md`、`GEMINI.md`，全部指向同一套開工流程。 |
| AI 可能亂改、亂刪或誤發佈 | 內置 safety 工作模式；高風險操作必須先講計劃，破壞性指令與未批准發佈一律禁止。 |

它不是聊天機器人，也不是開發框架。它比較像一本固定放在專案內的交接簿。

## 三步上手

### 一、安裝

在你的專案資料夾打開 Terminal，執行：

```bash
npx @adamchanadam/agent-handoff-kit init
```

出現確認問題時，輸入 `yes`。

安裝完成後，你會看到一段 `Work in ...` 文字。請特別留意：那一段不是給 Terminal 的指令，而是要貼到 AI 對話。

### 二、開工

打開你想用的 AI 工具，在新對話貼上安裝工具顯示的文字。沒有那段文字時，可貼這句：

```text
Work in <你的專案資料夾>. Read AGENTS.md and follow it. Before changing anything, tell me the current state and your recommended next step.
```

然後用日常話描述你要完成的任務。AI 應先讀交接文件，說明目前狀態、下一步與風險，再開始工作。

### 三、收工

工作完成想結束時，只需輸入：

```text
收工
```

也可以輸入：

```text
wrap up
handoff
```

AI 應更新交接文件，並輸出下一次可直接貼上的開工文字。最終回覆會把那段文字放在 fenced `text` code block 內，方便完整複製。安裝後也會有一個更直覺的副本檔：

```text
START_NEXT_SESSION_PROMPT.txt
```

這個檔案只是方便你複製下次開工提示；真正權威來源仍是 `dev/SESSION_HANDOFF.md` 裡的 `Next Session Opening Message`。若兩者不同，永遠以 `dev/SESSION_HANDOFF.md` 為準重生副本。

## 檢查是否安裝完整

如要檢查安裝是否完整，可在 Terminal 執行：

```bash
npx @adamchanadam/agent-handoff-kit doctor
```

看到 `status: passed`，代表必要文件、基本結構與 `START_NEXT_SESSION_PROMPT.txt` 副本一致性通過檢查。

這個檢查只能確認文件結構，不代表 AI 已理解你的專案。真正開始工作前，仍應要求 AI 先讀入口文件並說明目前狀態。

## 會安裝甚麼

安裝工具會在你的專案中建立：

```text
AGENTS.md
CLAUDE.md
GEMINI.md
START_NEXT_SESSION_PROMPT.txt
dev/SESSION_HANDOFF.md
dev/SESSION_LOG.md
dev/PROJECT_INDEX.md
dev/DOC_SYNC_REGISTRY.md
dev/RULE_PACKS.md
dev/rules/*.md
```

| 文件 | 用途 |
|---|---|
| `AGENTS.md` | AI 開工時最先讀的入口文件。 |
| `CLAUDE.md` | 讓 Claude Code 找到同一套入口。 |
| `GEMINI.md` | 讓 Gemini CLI 找到同一套入口。 |
| `START_NEXT_SESSION_PROMPT.txt` | 下次開工時可直接貼上的便利副本；由 handoff 產生。 |
| `dev/SESSION_HANDOFF.md` | 保存目前狀態、下一步、風險、驗收結果與下一次開工文字。 |
| `dev/SESSION_LOG.md` | 保存近期實際做過的事與檢查結果。主檔長期保持短小；N=11+ 嘅舊條目自動 archive 至 `dev/SESSION_LOG_archive/`，trace-back 用。接力靠 `SESSION_HANDOFF.md`，本檔屬冷資料層。 |
| `dev/PROJECT_INDEX.md` | 記錄專案檔案、必讀資料、外部來源與常用檢查。 |
| `dev/DOC_SYNC_REGISTRY.md` | 記錄哪些文件改動後需要同步。 |
| `dev/RULE_PACKS.md` | 告訴 AI 不同任務應讀哪些工作規則。 |
| `dev/rules/*.md` | 按任務載入的細分工作規則。 |

你不需要自己逐一閱讀全部文件。你的工作是描述目標；AI 的工作是讀入口文件、判斷要讀哪些資料，再告訴你它準備怎樣做。

## 工作模式

你不需要記規則包名稱，只要描述任務。AI 會按任務切換工作模式。

| 你的任務 | AI 應使用的工作規則 |
|---|---|
| 寫或改代碼、檢查錯誤、執行測試 | `coding`；涉及刪除、覆寫、Git、套件管理或外部服務時加 `safety` |
| 查資料、比較來源、整理證據 | `research` |
| 改 README、寫說明、整理文案 | `writing`，通常再加 `communication` |
| 整理 Notion、Google Drive 或知識庫 | `knowledge` |
| 準備發佈說明 | `release`；真正發佈、上傳或建立版本前必須加 `safety` |
| 改規則、改流程、整理交接 | `agent-governance`；先找既有真源，不盲目新增規則 |

原則是只讀當前任務需要的規則，不是每次讀全部文件。

## 安全護欄

就算你不懂代碼，這套工具也會要求 AI 在高風險操作前停下來講清楚。

- 禁止破壞性指令：例如 `rm -rf`、`git reset --hard`、強制推送、系統根路徑操作。
- 機密保護：`.env`、API key、token 不可印出、不可 commit、不可上傳。
- 查證不猜：用第三方 API、CLI、SDK 前先查官方文件；查不到就標示未核實。
- 權限不足就停手：檔案被鎖或沒有權限時，輸出手動操作清單，不嘗試繞過。
- 發佈需明確批准：tag、GitHub Release、npm publish、部署或上傳都不能因「準備好了」而自動執行。

## 已安裝舊版，或已有 AI 記憶文件？

如果你的專案已經裝過舊版 Agent Handoff Kit，或本來已有 `AGENTS.md`、`CLAUDE.md`、`GEMINI.md` 等 AI 記憶文件，先用最新版 CLI dry-run  預演會發生甚麼：

```bash
npx @adamchanadam/agent-handoff-kit@latest upgrade --dry-run
```

確認沒有問題後，再執行：

```bash
npx @adamchanadam/agent-handoff-kit@latest upgrade
```

`@latest` 代表使用 npm 上最新的 Agent Handoff Kit CLI。`upgrade` 則負責把專案內已安裝的 Kit 文件、規則與檢查結構安全更新。升級工具會保留既有檔案；能安全合併時才合併，不能安全合併時會報 conflict，不會靜默覆寫。

看到 `conflict` 不代表檔案壞掉。它只代表工具不能安全判斷怎樣合併，所以先停手，等你或 AI 判斷下一步。最簡單做法是把 dry-run 輸出貼給 AI，請它幫你判斷要保留、合併，還是手動修改。

## 版本提示

CLI 執行時會短暫檢查 npm 上是否有更新版本。若有新版，會顯示更新提示與 release notes 連結；若離線、網路逾時或檢查失敗，原本的 `init`、`upgrade`、`doctor` 仍會照常執行。

若你不想檢查更新，可設定：

```bash
AGENT_HANDOFF_KIT_NO_UPDATE_CHECK=1
```

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

GitHub Pages 上的兩個 onboarding 頁 —— [`agent-handoff-kit-intro.html`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-intro.html)（60 秒入門）與 [`agent-handoff-kit-guide.html`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html)（實操指南）—— 由原始碼倉庫根目錄發佈；兩個 HTML 與 `images/` 是原始碼倉庫資產，不會安裝到你的專案。

## 配合 Adam-AI-Instructions 使用

Agent Handoff Kit 同 [Adam-AI-Instructions](https://github.com/prompt-templates/Adam-AI-Instructions)（Meta Instruction for AI）配合使用效果最好。兩者分工互補，不重疊：

- **Adam-AI-Instructions** 負責 AI 喺**單一對話**內嘅做事規矩：語氣、做事優先序、回覆骨架、計算紀律、用語紀律、安全護欄、輸出層分工。屬「AI 應該點答你」嘅持久基準。
- **Agent Handoff Kit** 負責 AI 喺**對話之間**嘅接力：當前狀態、下一步、檔案登記、收工同下次開工。屬「AI 對話之間點記憶你個項目」嘅持久基準。

到該 repo 嘅「**五、Prompt 索引**」揀啱你 AI 工具嘅 prompt（Claude Cowork / Claude Code / OpenAI Codex / ChatGPT 等），複製對應子目錄嘅 `prompt.md` 全文，貼入 AI 工具嘅 system prompt、personal preferences 或 project instructions（例如 Claude Cowork 的 Global Instructions、Claude Code 的 `~/.claude/CLAUDE.md`、ChatGPT 的 Custom Instructions）。然後再喺項目資料夾跑 `npx @adamchanadam/agent-handoff-kit init` 安裝呢套 Kit。兩者配合就能涵蓋「單次對話質素」+「跨對話接力」兩個維度。

## 目前限制

- `v0.1.8` 是 GitHub 與 npm 同步發佈版本。
- 這是早期可用版本，尚未宣稱完整穩定。
- 升級合併仍是窄範圍策略，不是完整的複雜合併工具。
- `doctor` 能檢查結構，不能代替 AI 對專案內容的理解。
- 未取得明確批准前，不應因安裝成功而自動建立新版本、發佈或上傳任何內容。
