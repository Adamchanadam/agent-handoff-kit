# Agent Handoff Kit

狀態：目前版本為 `v0.3.24`。這是早期可用版本，仍在持續完善中。

![Agent Handoff Kit 主視覺](https://raw.githubusercontent.com/Adamchanadam/agent-handoff-kit/main/images/agent-handoff-kit-main-visual2.png)

Agent Handoff Kit 是 **AI 對話之間的接力棒**。

它只處理一件狹窄但重要的事：AI 跨對話失憶。每次開新對話，AI 往往不記得你上次做到哪裡，也認不出中途新建的文件、你引入的參考資料、哪些檔案是真源。這套工具把進度、下一步、風險、檔案登記與下次開工提示寫進固定文件，讓下一個 AI 工具能接得上上一棒。

> 🚀 **第一次用？你不需要先讀本 README 或任何文件。**
>
> 安裝完成後，打開能讀寫本機專案資料夾的 AI agent。若 AI 已經在正確專案資料夾內，只需輸入：
>
> ```text
> Start Agent Handoff
> ```
>
> 中文可說「開工」。
>
> 只有當 AI 還未指向你的專案資料夾時，才使用帶路徑啟動句：
>
> ```text
> Work in <你的資料夾>. Read AGENTS.md first, then Start Agent Handoff. Before changing anything, tell me the current state and your recommended next step.
> ```
>
> AI 會依 `AGENTS.md` 打開專案內的 `START_NEXT_SESSION_PROMPT.txt`。第一次安裝後，該檔會帶它載入新手引導；之後每次收工後，該檔會改成下一次接力需要的真實狀態。本 README 與下方介紹頁是參考對照，不是必讀。

想先看非技術版介紹，可打開 GitHub Pages 上的 [`agent-handoff-kit-intro.html`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-intro.html) —— 新手 60 秒入門。看完想看實際操作示範，可開 [`agent-handoff-kit-guide.html`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html) —— 三個日常情境的完整流程示範。本 README 則保留安裝、日常使用與限制。

## 它解決甚麼問題

用 AI 做長期項目，常見四個問題：

| 問題 | Agent Handoff Kit 怎樣處理 |
|---|---|
| 新 AI 不知做到哪 | 用 `dev/SESSION_HANDOFF.md` 保存目前狀態、下一步、風險與驗收。 |
| 新建檔案、參考資料變孤兒 | 用 `dev/PROJECT_INDEX.md` 與 `dev/DOC_SYNC_REGISTRY.md` 登記檔案角色、真源與同步責任。 |
| 不同 AI 工具入口不同 | 同時安裝 `AGENTS.md`、`CLAUDE.md`、`GEMINI.md`，全部指向同一套開工流程；Antigravity CLI 會讀工作資料夾內的 `AGENTS.md` 與 `GEMINI.md`。 |
| AI 可能亂改、亂刪或誤發佈 | 內置安全規則；高風險操作必須先講計劃，破壞性指令與未批准發佈一律禁止。 |

它不是聊天機器人，也不是開發框架。它比較像一本固定放在專案內的交接簿。

## 三步上手

![Agent Handoff Kit 新手流程](https://raw.githubusercontent.com/Adamchanadam/agent-handoff-kit/main/images/agent-handoff-kit-new-user-flow.png)

這張圖是給第一次使用的人看的流程摘要：先在專案資料夾安裝，然後在能讀寫本機資料夾的 AI 對話輸入 `Start Agent Handoff` 或「開工」；AI 會依 `AGENTS.md` 打開 `START_NEXT_SESSION_PROMPT.txt` 進入新手引導。準備結束本輪工作時說「收工」，讓 AI 留下下一次能接上的交接。

### 適用工具

Agent Handoff Kit 適合能讀寫本機專案資料夾的 agentic AI 工具，例如 Claude Code、OpenAI Codex、Gemini CLI、Google Antigravity，或其他具備本機工作區讀寫能力的工具。

它不適合普通 web chat AI，例如沒有本機檔案讀寫能力的 ChatGPT、Claude、Gemini 網頁版。上載檔案或貼上交接內容不能取代本工具需要的本機讀寫能力；這類工具不能可靠維護專案內的交接文件。

### 一、安裝

在你的專案資料夾打開終端機，執行：

```bash
npx --yes @adamchanadam/agent-handoff-kit@latest init
```

出現確認問題時，輸入 `yes`。

安裝完成後，終端機會顯示 AI 對話的下一步。請特別留意：`Start Agent Handoff`、中文「開工」或帶路徑啟動句都不是終端機指令，而是給 AI agent 的對話內容。

可用的 AI 工具必須能讀寫此資料夾。不同工具對入口檔的支援可能不同；本工具會同時放置 `AGENTS.md`、`CLAUDE.md`、`GEMINI.md`，讓常見工具能找到同一套開工路徑。Google 官方遷移文件說明，Antigravity CLI 會讀工作資料夾內的 `GEMINI.md` 和 `AGENTS.md`；因此 `AGENTS.md` 仍是唯一真源，`GEMINI.md` 只做橋接。

> 補充：`--yes` 只是讓 npm 先取得這個工具，避免多問一次安裝確認。真正會建立項目文件的是 `init`；`doctor` 只檢查，不會安裝或改動你的項目文件。

安裝成功後，先做 AI 對話，不必立刻跑 `doctor`。`doctor` 是之後不確定狀態、升級後驗收，或 AI 要排錯時才需要用的檢查工具。

### 常見入口

| 你現在的狀態 | 建議指令 |
|---|---|
| 第一次在新資料夾使用 | `npx --yes @adamchanadam/agent-handoff-kit@latest init` |
| 已安裝舊版，或已有 AI 記憶文件 | `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade` |
| 不確定是否安裝完整，或升級後想檢查 | `npx --yes @adamchanadam/agent-handoff-kit@latest doctor` |

### 已安裝舊版，或已有 AI 記憶文件？

如果你的專案已經裝過舊版 Agent Handoff Kit，或本來已有 `AGENTS.md`、`CLAUDE.md`、`GEMINI.md` 等 AI 記憶文件，不要重新 `init`，改用 `upgrade`。

你可以先預演：

```bash
npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run
```

`dry-run` 只會預覽，不會完成升級，也不會寫入檔案。確認沒有問題後，才執行正式升級：

```bash
npx --yes @adamchanadam/agent-handoff-kit@latest upgrade
```

`@latest` 代表使用 npm 上最新版本的 Agent Handoff Kit。`upgrade` 負責把專案內已安裝的文件、規則與檢查結構安全更新。升級工具會保留既有檔案；能安全合併時才合併，不能安全合併時會回報衝突，不會靜默覆寫。

正式升級最後會自動做一次 `doctor` 健康檢查。若檔案已是最新版本，但交接狀態仍需要處理，工具會列出需要修正的位置；若屬於工具可安全判斷的 Kit 結構或提示副本問題，會先自動修復再檢查。

看到「衝突」不代表檔案壞掉。它只代表工具不能安全判斷怎樣合併，所以先停手，等你或 AI 判斷下一步。最簡單做法是把預演輸出貼給 AI，請它幫你判斷要保留、合併還是手動修改。

即使目前資料夾已安裝舊版 Kit 文件，電腦也未必已經有可直接執行的 npm 工具。判斷點不是資料夾有沒有 `AGENTS.md` 或 `dev/`，而是你是否用上方 `npx --yes ... @latest` 路徑取得最新工具。裸寫不帶 `--yes` / `@latest` 的 `npx ... doctor` 不是本工具的建議用戶路徑，容易先出現 npm 自己的安裝提示。

### 二、開工

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

### 三、收工

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

## 檢查是否安裝完整

如你不確定目前資料夾是否安裝完整，或剛做完升級，可在終端機執行：

```bash
npx --yes @adamchanadam/agent-handoff-kit@latest doctor
```

看到「檢查通過」代表必要文件與基本結構通過檢查。若 `START_NEXT_SESSION_PROMPT.txt` 落後於 `dev/SESSION_HANDOFF.md`，`doctor` 只會提醒；這個便利副本應在收工 closeout 時由 AI 重新生成，不需要在 session 中途手動更新。

`doctor` 只檢查，不會建立或修改項目文件。這個檢查只能確認文件齊不齊、格式是否正常，不代表 AI 已理解你的專案。真正開始工作前，應在能讀寫本機資料夾的 AI agent 對話輸入 `Start Agent Handoff` 或「開工」；若 AI 尚未指向資料夾，才使用帶路徑啟動句。

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
dev/PROJECT_DECISIONS.md
dev/DOC_SYNC_REGISTRY.md
dev/RULE_PACKS.md
dev/rules/*.md
```

| 文件 | 用途 |
|---|---|
| `AGENTS.md` | AI 開工時最先讀的入口文件。 |
| `CLAUDE.md` | 讓 Claude Code 找到同一套入口。 |
| `GEMINI.md` | 讓 Google Antigravity CLI、Gemini CLI 遷移期或相容入口工具找到同一套入口。Antigravity CLI 會讀 `AGENTS.md` 與 `GEMINI.md`，所以此檔只做橋接，不另寫一套規則。 |
| `START_NEXT_SESSION_PROMPT.txt` | 下一次開工時由 AI 讀取的提示副本；初次安裝時放新手引導，收工後由交接文件自動產生。 |
| `dev/SESSION_HANDOFF.md` | 保存目前狀態、下一步、風險、驗收結果與下一次開工文字。 |
| `dev/SESSION_LOG.md` | 保存近期實際做過的事與檢查結果。每次收工會先做維護觸發檢查；長期使用後，命中條件時舊條目會整理入封存資料夾，主檔保持簡短。日常使用不需要打開本檔，做審計或追溯時才看。 |
| `dev/PROJECT_INDEX.md` | 記錄專案檔案、必讀資料、外部來源與常用檢查。 |
| `dev/PROJECT_DECISIONS.md` | 保存項目的長期演進、決策、架構取捨與學習觀察。AI 在每次收工時檢查是否需要維護，重大決策可即時寫入；日常開工不需要讀。當你問「之前為何這樣做」時，AI 會自己從這裡找答案。 |
| `dev/DOC_SYNC_REGISTRY.md` | 記錄哪些文件改動後需要同步。 |
| `dev/RULE_PACKS.md` | 告訴 AI 不同任務應讀哪些工作規則。 |
| `dev/rules/*.md` | 按任務載入的工作規則，共十份：安全、寫代碼、寫作、研究、AI 治理、發佈、知識整理、溝通、新手引導、外部工具治理。 |

你不需要自己逐一閱讀全部文件。你的工作是描述目標；AI 的工作是讀入口文件、判斷要讀哪些資料，再告訴你它準備怎樣做。

## SESSION_LOG 的自動整理機制

長期使用後，`dev/SESSION_LOG.md` 不會無止境膨脹。每次你講「收工」，AI 會先做一次很短的維護觸發檢查；命中條件時才完整整理：

- 最新三條對話紀錄保留完整內容，作為意外時的後備。
- 之後的條目，如核心內容已被交接文件吸收，會在需要整理時縮成一行短索引（日期 + 標題 + 對應資料來源）。
- 累積到第十一條開始，會封存到 `dev/SESSION_LOG_archive/` 資料夾；主檔末尾留一份封存索引，方便日後追溯。
- 即使沒有明顯觸發，AI 也會每十次收工做一次完整維護兜底，避免長期使用後慢慢漏記。

接力責任由 `dev/SESSION_HANDOFF.md` 承擔；`dev/SESSION_LOG.md` 主要用來日後追溯。**新對話開工不需要讀完整紀錄**，只需要讀 `AGENTS.md`、`dev/SESSION_HANDOFF.md` 和索引文件，就足夠接力。

所以你的電腦中的 `dev/` 資料夾不會被對話紀錄不停撐大，也不需要你手動清理。如主檔意外膨脹，`doctor` 會在輸出顯示提醒，請 AI 下次收工時整理；這只是提醒，不會令 `doctor` 失敗，也不阻擋安裝。

## 項目決策日誌

`dev/PROJECT_DECISIONS.md` 保存項目的長期演進、決策、架構取捨與學習觀察。AI 每次收工都會檢查是否需要維護；遇到重大決策、方向轉變、架構取捨或重複出現的模式時才寫入，並且每十次收工做一次完整兜底。日常開工不需要讀本檔；當你問「之前為何這樣做」時，AI 會自己從這裡找答案。

短期單一任務的項目，本檔幾乎保持空白，你不需要維護。長期持續演進的項目，AI 會自動累積以下四類紀錄：

- **長期演進** —— 任務需求隨時間的變化
- **決策封存** —— 累積決策的歷史紀錄
- **架構取捨** —— 主要設計選擇與原因
- **學習觀察** —— 多次對話累積的觀察與心得

當交接文件中的決策清單累積到三十條以上，AI 會自動把較舊的條目搬入本檔，保持交接文件簡潔。

新手用戶完全不需要打開本檔，也不需要記任何結構 —— 一切由 AI 自動處理。

## 外部工具治理

如你的項目涉及外部工具（例如 Notion、Google Drive、Slack、Linear、GitHub 等），Agent Handoff Kit 提供跨對話的治理紀律，確保 AI 在不同對話之間能穩定使用這些工具。

**登記表**：`dev/PROJECT_INDEX.md` 內設有「已裝外部工具」段，記錄項目已連接哪些外部工具。AI 在新對話開工時會自動讀取，了解能直接讀寫哪些資料來源。

**機密分離原則**：API key、token、密碼等任何敏感資料**永不寫入** `dev/` 內任何檔案。這類機密由你的 AI 工具或系統安全儲存管理，與本工具完全分離。`doctor` 會自動掃描，若發現任何疑似敏感資料寫入，會立即報錯。

**已裝才用**：如你已透過 Claude Desktop 等工具連接好外部服務，AI 會直接使用對應功能讀寫資料。如未連接，AI 會改為產生需要你手動同步的內容，並提示你下一步。

**失靈不亂修**：如外部工具中途認證失效，AI 會立即說明，不會嘗試自動修復；同時將狀況記錄入交接文件，方便你或下一個對話判斷處理。

## 工作模式

你不需要記規則名稱，只要描述任務。AI 會按任務切換工作模式。

| 你的任務 | AI 應使用的工作規則 |
|---|---|
| 寫或改代碼、檢查錯誤、執行測試 | 寫代碼規則；涉及刪除、覆寫、Git、套件管理或外部服務時，再讀安全規則 |
| 查資料、比較來源、整理證據 | 研究規則 |
| 改 README、寫說明、整理文案 | 寫作規則，通常再加溝通規則 |
| 整理 Notion、Google Drive 或知識庫 | 知識整理規則 |
| 準備發佈說明 | 發佈規則；真正發佈、上傳或建立版本前必須再讀安全規則 |
| 改規則、改流程、整理交接 | AI 治理規則；先找既有真源，不盲目新增規則 |

原則是只讀當前任務需要的規則，不是每次讀全部文件。

## 安全護欄

就算你不懂代碼，這套工具也會要求 AI 在高風險操作前停下來講清楚。

- 禁止破壞性指令：例如 `rm -rf`、`git reset --hard`、強制推送、系統根路徑操作。
- 機密保護：`.env`、API key、token 不可印出、不可提交、不可上傳。
- 查證不猜：使用第三方服務或工具前先查官方文件；查不到就標示未核實。
- 權限不足就停手：檔案被鎖或沒有權限時，輸出手動操作清單，不嘗試繞過。
- 發佈需明確批准：建立版本標籤、GitHub Release、npm publish、部署或上傳，都不能因「準備好了」而自動執行。

## 版本提示

安裝工具執行時會短暫檢查 npm 上是否有更新版本。若有新版，會顯示更新提示與版本說明連結；若離線、網路逾時或檢查失敗，原本的 `init`、`upgrade`、`doctor` 仍會照常執行。

若你不想檢查更新，可設定環境變數：

```bash
AGENT_HANDOFF_KIT_NO_UPDATE_CHECK=1
```

## 配合 Adam-AI-Instructions 使用

Agent Handoff Kit 可與 [Adam-AI-Instructions](https://github.com/prompt-templates/Adam-AI-Instructions) 配合使用。兩者分工互補，不重疊：

- **Adam-AI-Instructions** 負責 AI 在**單一對話**內的做事規矩：語氣、做事優先序、回覆骨架、計算紀律、用語紀律、安全護欄、輸出層分工。屬「AI 應該怎樣答你」的持久基準。
- **Agent Handoff Kit** 負責 AI 在**對話之間**的接力：當前狀態、下一步、檔案登記、收工同下次開工。屬「AI 在對話之間怎樣記住你的項目」的持久基準。

到該倉庫的「五、提示詞索引」選擇適合你 AI 工具的版本（Claude Cowork、Claude Code、OpenAI Codex、ChatGPT 等），複製對應子目錄的 `prompt.md` 全文，貼入 AI 工具設定。然後再在項目資料夾執行 `npx --yes @adamchanadam/agent-handoff-kit@latest init` 安裝本工具。兩者配合，就能同時照顧單次對話的做事規矩，以及不同對話之間的項目接力。

## 目前限制

- 目前版本為 `v0.3.24`；正式安裝請以 npm registry `latest` 顯示為準。
- 這是早期可用版本，仍在持續完善中。
- 升級合併屬窄範圍策略，不是完整的複雜合併工具。
- `doctor` 能檢查結構，不能代替 AI 對專案內容的理解。
- 未取得明確批准前，不應因安裝成功而自動建立新版本、發佈或上傳任何內容。
