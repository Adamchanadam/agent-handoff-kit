# Agent Handoff Kit

狀態：目前版本為 `v0.3.33`。這是早期可用版本，仍在持續完善中。

<p align="center">
  <img src="https://raw.githubusercontent.com/Adamchanadam/agent-handoff-kit/main/images/agent-handoff-kit-promo-30s.gif" alt="Agent Handoff Kit 功能簡介動畫" width="720">
</p>

Agent Handoff Kit 是 **AI 對話之間的接力棒**。

它只處理一件狹窄但重要的事：AI 跨對話失憶。每次開新對話，AI 往往不記得你上次做到哪裡，也認不出中途新建的文件、你引入的參考資料、哪些檔案是真源。這套工具把進度、下一步、風險、檔案登記與下次開工提示寫進固定文件，讓下一個 AI 工具能接得上上一棒。

📌 使用時，你只需要說明目的；確認資料夾、判斷安裝或升級、執行指令和檢查結果，交給能讀寫本機資料夾的 AI 處理。

## 🚀 三步上手

第一次用，不需要先讀完整 README，也不需要研究終端機指令。只做三件事：

1. 在你想使用 Agent Handoff Kit 的資料夾打開 AI，貼上這句話：

   ```text
   請讀取 https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-ai-install.html，並在這個資料夾安裝或升級 Agent Handoff Kit。
   ```

   你也可以先打開 [`agent-handoff-kit-ai-install.html`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-ai-install.html) 看看 AI 會照甚麼步驟處理。

2. 安裝完成後，對 AI 說 `Start Agent Handoff` 或「開工」。
3. 完成本輪工作後，對 AI 說「收工」。

🔎 你不用判斷安裝、升級、檢查或檔案結構。AI 會先說明它看到的資料夾、風險與下一步；需要你確認時才停下來。

已裝過舊版，或資料夾裡已有 `AGENTS.md`、`CLAUDE.md`、`GEMINI.md` 等 AI 記憶文件，也用同一句交給 AI 判斷。AI 會先檢查，不會靜默覆寫。

想先看非技術版介紹，可打開 GitHub Pages 上的 [`agent-handoff-kit-intro.html`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-intro.html)。想看完整操作示範，可開 [`agent-handoff-kit-guide.html`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html)。想了解它在本機 Agentic AI 工作系統中的位置，可看 [`local-agentic-ai-workflow-case-study.html`](https://adamchanadam.github.io/agent-handoff-kit/local-agentic-ai-workflow-case-study.html)。

## 🧭 這個 repo 怎樣讀

如果你只是想使用 Agent Handoff Kit，只需要看四個入口：

| 入口 | 用途 |
|---|---|
| `README.md` | 正式用途、安裝路徑、限制與安全邊界。 |
| [`agent-handoff-kit-intro.html`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-intro.html) | 非技術版 60 秒入門與宣傳動畫。 |
| [`agent-handoff-kit-guide.html`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html) | 三個實操情景，示範開工、工作、收工。 |
| [`agent-handoff-kit-ai-install.html`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-ai-install.html) | 給 AI 讀的安裝與升級指令頁。 |

這個公開 repo 是用戶流通版，保留使用、安裝、入門、GitHub Pages 與 npm 執行所需內容；內部 release QA、升級夾具和候選審核材料留在開發真源，不放入公開流通版。

## 🔎 它解決甚麼問題

用 AI 做長期項目，常見四個問題：

| 問題 | Agent Handoff Kit 怎樣處理 |
|---|---|
| 新 AI 不知做到哪 | 用 `dev/SESSION_HANDOFF.md` 保存目前狀態、下一步、風險與驗收。 |
| 新建檔案、參考資料變孤兒 | 你可以叫 AI 把文件接入 Agent Handoff Kit，用 `dev/PROJECT_INDEX.md` 與 `dev/DOC_SYNC_REGISTRY.md` 登記檔案角色、真源與同步責任。 |
| 不同 AI 工具入口不同 | 同時安裝 `AGENTS.md`、`CLAUDE.md`、`GEMINI.md`，全部指向同一套開工流程；Antigravity CLI 會讀工作資料夾內的 `AGENTS.md` 與 `GEMINI.md`。 |
| AI 可能亂改、亂刪或誤發佈 | 內置安全規則；高風險操作必須先講計劃，破壞性指令與未批准發佈一律禁止。 |

它不是聊天機器人，也不是開發框架。它比較像一本固定放在專案內的交接簿。

## 🧰 適用工具

Agent Handoff Kit 適合能讀寫本機專案資料夾的 agentic AI 工具，例如 Claude Code、OpenAI Codex、Gemini CLI、Google Antigravity，或其他具備本機工作區讀寫能力的工具。

它不適合普通 web chat AI，例如沒有本機檔案讀寫能力的 ChatGPT、Claude、Gemini 網頁版。上載檔案或貼上交接內容不能取代本工具需要的本機讀寫能力；這類工具不能可靠維護專案內的交接文件。

## 🟢 開工

打開能讀寫本機專案資料夾的 AI agent。

若 AI 已經在正確專案資料夾內，日常開工只需輸入：

```text
Start Agent Handoff
```

中文可說「開工」。

若 AI 還未指向你的專案資料夾，才使用帶路徑啟動句：

```text
Work in <你的專案資料夾>. Read AGENTS.md first, then Start Agent Handoff. Before changing anything, tell me the current state and your recommended next step.
```

第一次安裝後，`START_NEXT_SESSION_PROMPT.txt` 內會放新手引導，AI 會帶你選擇使用情境（建構系統 / 研究報告 / 知識庫整理 / 學寫代碼 / 其他），再一步一步陪你做第一個任務。每次收工後，同一個檔案會改成下一次接力需要的真實狀態。你不需要手動打開或複製整份交接內容。

若你說的是「某某開工」（例如餐廳開工、項目開工）這類帶其他上下文的話，AI 應先反問你是否指 Agent Handoff Kit 接力，而不是立即啟動交接流程。

然後用日常話描述你要完成的任務。AI 應先讀交接文件，說明目前狀態、下一步與風險，再開始工作。

## 💾 收工

本輪工作完成、準備結束時，只需輸入：

```text
收工
```

也可以輸入：

```text
Wrap up Agent Handoff
wrap up
handoff
```

若你說的是「某某收工」（例如餐廳收工、今天活動收工）這類帶其他上下文的話，AI 應先反問你是否要執行 Agent Handoff Kit 收工交接，而不是立即改寫交接文件。

AI 應更新交接文件，並同步更新下一次開工提示副本：

```text
START_NEXT_SESSION_PROMPT.txt
```

這個檔案保存下一次真正要讀的開工內容。你下次仍只需說 `Start Agent Handoff` 或「開工」；若 AI 尚未指向專案資料夾，才使用帶路徑啟動句。真正的權威來源仍是 `dev/SESSION_HANDOFF.md` 裡的「下次開工提示」段。若兩者不同，永遠以 `dev/SESSION_HANDOFF.md` 為準重新產生副本。

## 🩺 不確定狀態時

如你不確定目前資料夾是否安裝完整、是否需要升級，或剛升級後想確認狀態，直接叫 AI：

```text
請讀取頁頂的安裝頁，幫我檢查這個資料夾的 Agent Handoff Kit 狀態。
```

AI 會處理檢查，不會把「檢查通過」誤當成已理解你的專案。真正開始工作前，仍要對 AI 說 `Start Agent Handoff` 或「開工」。

## 🗂️ AI 會替你維護甚麼

安裝後，Agent Handoff Kit 會在你的專案中放入一組交接文件。你不需要逐一閱讀，也不需要手動維護。

- **開工入口**：讓不同 AI 工具找到同一套開工方式，例如 `AGENTS.md`、`CLAUDE.md`、`GEMINI.md` 和 `START_NEXT_SESSION_PROMPT.txt`。
- **目前狀態**：保存做到哪裡、下一步、風險和檢查結果，例如 `dev/SESSION_HANDOFF.md`。
- **追溯紀錄**：保存近期做過的事；長期使用後，AI 會自動整理，避免紀錄無止境膨脹。
- **項目索引與決策**：記錄重要文件、外部來源、同步責任和長期決策，方便你日後問「之前為何這樣做」。
- **工作規則**：AI 會按你的任務自己載入需要的規則；你不用記規則名稱。

## 🧭 AI 工作規則怎樣運作

你不需要記住任何規則檔名。Agent Handoff Kit 會讓 AI 先判斷你現在要做甚麼，再只載入需要的工作規則。

| 你要做的事 | AI 會套用的規則 |
|---|---|
| 寫程式 / 修錯誤 | 先讀項目索引、相關檔案，再改動和測試。 |
| 寫文章 / README / 社交帖文 | 先確認讀者、目的、語氣和發布位置。 |
| 查資料 / 比較工具 | 分清已驗證事實、來源摘要和 AI 推論。 |
| 刪檔 / Git / 發佈 / npm | 高風險操作必須先說明影響，並等你確認。 |
| Notion / Google Drive 等外部工具 | 先核對目前工具 schema 或官方文件；機密不寫入項目文件。 |

你只要用日常話說目的，例如「幫我改 README」、「幫我查這個工具是否適合」、「把這份文件接入 Agent Handoff Kit」。AI 會自己判斷要用哪些規則。

想加入自己的長期規則，也不用手改規則檔。你可以直接說：

```text
以後寫公開中文文件時，請用繁體中文書面語，避免半中半英。請把這條規則接入 Agent Handoff Kit。
```

AI 應先判斷這條規則應放在哪裡：是一次性備忘、下次交接、項目索引，還是長期工作規則。它不應把所有東西都塞進同一個檔案。

## 💬 你可以怎樣叫 AI

你只要用自然語言講目的，AI 會自己判斷要讀哪些交接文件、規則或索引。

| 你想做的事 | 可以這樣說 |
|---|---|
| 接上上次工作 | `Start Agent Handoff` 或「開工」 |
| 結束本輪工作 | 「收工」 |
| 讓新文件不變成孤兒 | 「把這份文件接入 Agent Handoff Kit，讓下次 AI 知道何時要讀、何時要更新。」 |
| 掃描可能被遺漏的重要文件 | 「掃描未接入 Agent Handoff Kit 的重要文件。」 |
| 把錯誤經驗保存成日後機制 | 「把今次錯誤變成日後機制，寫入長期治理。」 |
| 讓 API / 工具用法之後都生效 | 「以後都用這個 API 調用方式，跨 session 生效。」 |
| 使用外部工具，例如 Notion、Google Drive、GitHub | 「這個項目會用到這些外部工具，請記住哪些能直接使用，機密不要寫入項目文件。」 |

這個掃描只列出候選與缺口，不會自動修改；是否接入、合併或退役由你確認。

長期機制不應只寫入 `dev/SESSION_LOG.md`，也不只留在 session log 或 handoff；AI 應放入合適的長期治理位置。

如涉及刪除、改名、合併真源、發佈、上傳或權限變更，AI 應先說明影響並等你確認。

## 🛡️ 安全護欄

就算你不懂代碼，這套工具也會要求 AI 在高風險操作前停下來講清楚。

- 禁止破壞性指令：例如 `rm -rf`、`git reset --hard`、強制推送、系統根路徑操作。
- 機密保護：`.env`、API key、token 不可印出、不可提交、不可上傳。
- 查證不猜：使用第三方服務、Connector、MCP、CLI、API 或 plugin API 前，先核對目前工具 schema、官方文件或有版本日期的本地 runbook；查不到就標示未核實。
- 權限不足就停手：檔案被鎖或沒有權限時，輸出手動操作清單，不嘗試繞過。
- 發佈需明確批准：建立版本標籤、GitHub Release、npm publish、部署或上傳，都不能因「準備好了」而自動執行。

## 🔗 可選配合：Adam-AI-Instructions

Agent Handoff Kit 可與 [Adam-AI-Instructions](https://github.com/prompt-templates/Adam-AI-Instructions) 配合使用。兩者分工互補，不重疊：

- **Adam-AI-Instructions** 負責 AI 在**單一對話**內的做事規矩：語氣、做事優先序、回覆骨架、計算紀律、用語紀律、安全護欄、輸出層分工。屬「AI 應該怎樣答你」的持久基準。
- **Agent Handoff Kit** 負責 AI 在**對話之間**的接力：當前狀態、下一步、檔案登記、收工同下次開工。屬「AI 在對話之間怎樣記住你的項目」的持久基準。

這是可選配合，不影響 Agent Handoff Kit 的安裝和日常使用。想使用時，到該倉庫選擇適合你 AI 工具的版本，貼入 AI 工具設定即可。

## ⚠️ 目前限制

- 目前版本為 `v0.3.33`；正式安裝請以 npm registry `latest` 顯示為準。
- 這是早期可用版本，仍在持續完善中。
- 升級合併屬窄範圍策略，不是完整的複雜合併工具。
- `doctor` 能檢查結構，不能代替 AI 對專案內容的理解。
- 未取得明確批准前，不應因安裝成功而自動建立新版本、發佈或上傳任何內容。

