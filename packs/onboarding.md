# Onboarding Pack

## Scope

新手用戶 day-1 walk-through 與 application scenario routing。

當用戶第一次使用 Agent Handoff Kit、沒有預設 expectation 或 prior context 時，本 pack 引導 AI 主動帶用戶完成第一個任務，不要求用戶先讀任何文檔。

本 pack 屬 transient pack —— 完成 onboarding session 後，AI 自動 unload 並由 regular scenario pack（coding / research / writing / knowledge / ...）接手。

## Load When

### 明確 onboarding signal keywords（用戶 message 含任一即可）

- 「新手」/「I'm new」
- 「教我用」/「teach me」/「教我點用」
- 「help me start」/「help me get started」
- 「first time」/「first-time」
- 「我啱啱安裝」/「I just installed」
- 「點開始」/「how do I start」
- 「show me how」
- 「getting started」
- 「agent handoff kit 可幫我做什麼」/「what can agent handoff kit do」
- 「我想做 [類型] project」/「I want to do a [type] project」（vague project intent）
- 「點用」/「點 leverage」/「能力」/「能做甚麼」/「what can it do」

### Implicit signals（任一即可）

- 用戶首段 message ≤ 30 字 + 任務描述 vague
- HANDOFF Active Objective 空白 + Session count 1（fresh installation context）
- 用戶 message 屬 generic capability question 而非 specific task description
- 用戶語氣 unfamiliar with v2 workflow（譬如問 AI 自己應該做甚麼，而非告訴 AI 做甚麼）

## Discipline

### 1. 不假設用戶已讀任何文檔

用戶可能直接從 AI 對話開始，沒讀過 README、`agent-handoff-kit-intro.html`、`agent-handoff-kit-guide.html` 或 `AGENTS.md`。AI 主動解釋必要 concept，但只解釋當前 walk-through 需要的最小範圍，不灌輸全部 v2 governance。

### 2. 主動 offer 而非被動 wait

用戶首段 message vague 或含 onboarding signal 時，AI 不立即 dive into task，而要主動 ask user about scenario。Sample opening wording：

> 「我看到你是第一次使用 Agent Handoff Kit（或者想了解它如何幫你）。為了帶你最快上手，可以選擇以下其中一個情景，告訴我你最近想做的事：
>
> **A. 寫 / 改代碼項目** —— 你有一個 project 的 codebase 想長期維護
> **B. 整理研究資料 / 寫報告** —— 你想做市場調查、寫 thesis、寫 newsletter
> **C. 整理電腦檔案 / Notion / Drive 知識庫** —— 你想 organize 多個來源的資料
> **D. 學寫代碼（我是技術新手）** —— 你想由零開始學寫小工具
> **E. 其他** —— 描述你的情景，我會 customize 引導
>
> 選擇其中一個（A/B/C/D/E），我會引導你做第一個任務。如果你想看完整 narrative example，可以開新 tab 看 https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html 的 Case A/B/C。本指南是參考對照，不需要先讀。」

### 3. 5-step walk-through pattern

用戶選定 scenario 後，AI 跑 5 step walk-through（全部 scenario 共用同一 pattern，內容 customize per scenario）：

1. **AI 確認 project context**（root / 已有資料 / git status / 工具 stack）
2. **AI 解釋 v2 如何 fit 這個 scenario**（高層 value statement，3 點 max）
3. **AI ask user about 第一個 concrete task scope**（提供 4-6 個 option）
4. **AI suggest minimum viable first task**（dry-run / minimal output，10-15 分鐘可完成）
5. **AI ask user about confirm + 進入 actual work loop**（載入對應 regular scenario pack）

### 4. 每 step 解釋 + 等用戶 confirm

不可以一次過跑全部 5 step。每 step：
- 解釋緊做甚麼
- 等用戶「OK，下一步」/「我有問題」/「我想 skip 這 step」
- 若用戶有問題，先解答再繼續

### 5. 進入 actual task 前先 verify minimum context

用戶第一個任務應該 minimal scope（dry-run / 短輸出 / 10-15 分鐘可完成），讓用戶感覺到 v2 的 rhythm 才擴大 scope。**不要**第一個 task 就 commit 大改動。

### 6. 完成 onboarding 後 transition

5-step walk-through 完成後：
- 載入用戶 scenario 對應的 regular pack（coding / research / writing / knowledge / ...）
- Unload onboarding pack（transient pack，不長期駐留）
- 進入 PLAN → READ → CHANGE → QC → PERSIST 嘅 regular work loop
- SESSION_HANDOFF Active Objective 記錄 first-task scope

## Application Scenario Library

每個 scenario 提供 5 step walk-through 嘅紀律 wording 加 1 句 AI sample wording 作為 anchor。AI 模型可 adapt 具體 wording 但保留 intent 與 tone。

### Scenario A. 寫 / 改代碼項目

**對應 guide.html Case A**（整理電腦下載目錄 + 公開發佈為 Git project）

#### Step A.1 — 確認 project context

- 任務：AI 確認 project root 存在 + 識別 stack + 檢查 git status
- AI sample wording：
  > 「請告訴我你的 project 在哪個目錄？如果還未建立，可以在電腦開新 folder 然後告訴我路徑。我會檢查 git status、讀 README / package.json 識別你的 stack（譬如 Python / Node.js / Rust 等），再為下一步建議方向。」

#### Step A.2 — 解釋 v2 如何 fit

- 任務：AI 用 3 點解釋 v2 對 coding 項目的核心 value
- AI sample wording：
  > 「v2 對 coding 項目的核心 value 有三點：(1) AI 跨對話記得你 project 的 stack、規則、進度，下次任何 AI 工具開新對話都接得返；(2) 危險指令（rm -rf、git reset --hard、強制推送）必須先講計劃，不會 silent 執行；(3) 收工時自動寫低你做過甚麼，連 commit hash 都記錄，方便日後追溯。」

#### Step A.3 — Ask user about 第一個 task scope

- 任務：AI 提供 4-6 個 concrete task option 讓用戶選
- AI sample wording：
  > 「你的 project 現在最想處理的是：(a) bug fix / (b) 新功能 / (c) 重構既有代碼 / (d) 加測試 / (e) 寫 README / (f) Git initial commit？如果你想做的不在這幾項，告訴我即可，我會 customize。」

#### Step A.4 — Suggest minimum viable first task

- 任務：AI 將用戶選擇 narrow scope 至 10-15 分鐘可完成的 minimum viable task
- AI sample wording：
  > 「你選『寫 README』。我建議第一個任務最 minimal scope：寫一個約 100 字的 README.md，含一句項目簡介加三點功能。寫好後你 review、加自己的修改，最後 git commit。整個過程約 10 分鐘。可以嗎？」

#### Step A.5 — Ask user about confirm + 進入 work loop

- 任務：AI 確認用戶同意 + 載入對應 regular pack + 開始 work loop
- AI sample wording：
  > 「Confirm 之後，我會載入 coding 模式 + writing 模式（README 屬 writing），開始 PLAN → READ → CHANGE → QC → PERSIST 五階段。準備好嗎？」

### Scenario B. 整理研究資料 / 寫報告

**對應 guide.html Case B**（開咖啡店市場調查 + 寫完成報告）

#### Step B.1 — 確認 project context

- AI sample wording：
  > 「請告訴我三點：(1) 你的報告主題；(2) 已有資料在哪裡（Notion / Google Drive / 本地檔案）；(3) 報告的讀者是誰（自己 / 客戶 / 合作伙伴 / 公開）。我會根據這三點建議分工。」

#### Step B.2 — 解釋 v2 如何 fit

- AI sample wording：
  > 「v2 對研究類項目的核心 value 有三點：(1) 真源紀律 —— 每條 claim 必須引用，事實與推論分開寫，AI 不會憑印象寫；(2) 外部來源邊界 —— Notion / Drive 寫入由你親手做，AI 列步驟但不代辦你的帳號操作；(3) 跨 session 接力 —— 你寫到 50% 收工，下次接得返，包括引用紀律。」

#### Step B.3 — Ask user about 第一個 task scope

- AI sample wording：
  > 「你想 first session 處理：(a) 列章節結構 / (b) 整理已有 reference 入 PROJECT_INDEX / (c) 寫摘要段 / (d) 寫第一個 sub-section / (e) 整體 review 已有 draft？」

#### Step B.4 — Suggest minimum viable first task

- AI sample wording：
  > 「你選『列章節結構』。我建議第一個任務 minimal scope：列 5-7 個 H2 chapter heading 加每章一句目標。寫好後你 review、調整。約 15 分鐘可以完成。可以嗎？」

#### Step B.5 — Ask user about confirm + 進入 work loop

- AI sample wording：
  > 「Confirm 之後，我會載入 research 模式 + writing 模式 + knowledge 模式（涉外部來源時 trigger）。開始五階段 work loop。」

### Scenario C. 整理電腦檔案 / Notion / Drive 知識庫

**對應 guide.html Case A 的檔案整理部分 + Case B 的 Notion reference 部分**

#### Step C.1 — 確認 project context

- AI sample wording：
  > 「請告訴我你想整理的是：(a) 電腦目錄（哪個 folder）/ (b) Notion DB（請描述 schema）/ (c) Google Drive（哪個 folder）/ (d) 多個來源混合（請描述）。」

#### Step C.2 — 解釋 v2 如何 fit

- AI sample wording：
  > 「v2 對知識庫整理的核心 value 有三點：(1) 識別真源 vs reference vs draft —— PROJECT_INDEX 登記每份檔案的角色，避免 AI 將參考檔當真源；(2) Notion / Drive 寫入由你親手做，AI 列詳細步驟但不代辦；(3) 危險動作（大量檔案移動 / 重命名 / 刪除）必須 dry-run 列清單，等你 confirm 才實際執行。」

#### Step C.3 — Ask user about 第一個 task scope

- AI sample wording：
  > 「你想 first session 處理：(a) 掃描 + 分類已有檔案 / (b) 建立 Notion DB schema / (c) 設計 folder 結構 / (d) 寫整理 script + dry-run / (e) 對齊 Notion 與本地 reference？」

#### Step C.4 — Suggest minimum viable first task

- AI sample wording：
  > 「你選『掃描 + 分類已有檔案』。Minimal scope：先 dry-run 100 個檔案，列分類建議由你 confirm，先不做實際移動。約 15 分鐘可完成。可以嗎？」

#### Step C.5 — Ask user about confirm + 進入 work loop

- AI sample wording：
  > 「Confirm 之後，我會載入 knowledge 模式 + safety 模式（涉檔案移動）。」

### Scenario D. 學寫代碼（技術新手）

**不對應 specific guide case，屬 onboarding-only scenario**

#### Step D.1 — 確認 project context

- AI sample wording：
  > 「你想學寫的是：(a) 簡單 script（譬如自動 organize 檔案）/ (b) 一個 web page（HTML/CSS/JS）/ (c) 一個 Python 小工具 / (d) 學 git/GitHub 基本概念？告訴我你的興趣方向，我會 customize 第一個練習。」

#### Step D.2 — 解釋 v2 如何 fit

- AI sample wording：
  > 「v2 對學寫代碼的核心 value 有三點：(1) AI 幫你寫，但不會默默改你的檔案 —— 每改一步等你 review；(2) 危險指令 AI 自己拒絕，你可以在 sandbox 安全試；(3) 跨 session 記住你學到哪裡，下次接得返，包括之前學過的概念。」

#### Step D.3 — Ask user about 第一個 task scope

- AI sample wording：
  > 「你選『簡單 script』？我建議第一個 script：『重命名 Downloads 目錄裡面所有 screenshot 加日期』—— 涉及 file system basics 加 Python basic syntax。你想試嗎？或者選其他方向。」

#### Step D.4 — Suggest minimum viable first task

- AI sample wording：
  > 「First minimal scope：我寫一個 5 行 Python script，先做 dry-run（只 print 想做的 rename），你 review 後再做 actual rename。整個過程我會逐句解釋每一行做甚麼。約 15 分鐘。可以嗎？」

#### Step D.5 — Ask user about confirm + 進入 work loop

- AI sample wording：
  > 「Confirm 之後，我會載入 coding 模式 + safety 模式。我會用最簡單的 wording 解釋每個概念，不假設你知道任何 jargon。」

### Scenario E. 其他 / 用戶自定義情景

如果用戶的 use case 不屬 A-D，AI ask user about 更多細節後 customize 5-step walk-through。

#### Step E.1 — 確認 project context（custom intake）

- AI sample wording：
  > 「請告訴我四點：(1) 你想完成的目標（一句講完）；(2) 已有資料 / 工具 / 限制；(3) 你的技術水平（零基礎 / 略有經驗 / 熟練）；(4) 想 first session 達成的 minimal output。我會根據這四點 customize 一個 5-step walk-through，對應 v2 適合你的工作模式。」

#### Step E.2 — 解釋 v2 如何 fit（custom）

- AI 根據用戶 intake 嘅四點，customize 解釋 v2 嘅 value statement（保留「跨對話接力 + 安全護欄 + 自動 maintain」三項 universal value）

#### Step E.3 — Ask user about 第一個 task scope（custom）

- AI 提供 customized options 對應用戶嘅 use case

#### Step E.4 — Suggest minimum viable first task（custom）

- AI narrow scope 至 10-15 分鐘可完成 minimum viable task

#### Step E.5 — Ask user about confirm + 進入 work loop（custom）

- AI 載入適合 user use case 嘅 regular pack（可能組合多個 pack）

## Cross-reference to guide.html

每個 scenario walk-through 完成後（或者用戶問「我想睇完整 example」），AI 可以 mention：

> 「如果想看完整 narrative example，可以開新 tab 看 https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html 的 Case A/B/C：
>
> - Case A 對應 onboarding scenario A（寫 / 改代碼項目）加 scenario C 的檔案整理部分
> - Case B 對應 onboarding scenario B（整理研究資料 / 寫報告）加 scenario C 的 Notion reference 部分
> - Case C 對應長期項目演進（適用於你項目運行到後期，跨多月時間軸）
>
> 本指南是參考對照，不需要先讀。」

## Tone Discipline

### 1. 書面語為主

使用繁體中文書面語表達。避免廣東口語字符（嘅 / 咁 / 喺 / 揀 / 唔 / 乜 / 啱 / 嚟 / 咗 / 嗰）出現在 AI 對用戶 surface 的 sample wording。Pack 內部 governance instructions（rules / discipline 等 maintainer-facing wording）允許 mixed style。

### 2. 講人話

避免內部 jargon（R-XXX / PROJECT_INDEX / closeout step / managed core / SESSION_LOG N-rule 等），改用日常解釋：

- 「項目登記表」而非「PROJECT_INDEX」
- 「收工」而非「closeout」
- 「下次開工提示」而非「next-session opening message」
- 「AI 工作模式」而非「rule pack」
- 「危險指令」而非「destructive operation」

### 3. 敍事 + 解釋

每個解釋句要 self-contained，用戶讀完即知道意義。不留 unexplained acronym 或 inside-reference。

### 4. 不過度解釋 internals

用戶不需要知 AGENTS.md 結構、`dev/*` folder 含甚麼、closeout step 11/12 紀律細節。只解釋 surface impact：「AI 會記住你 project」而非「AGENTS.md startup contract 加 SESSION_HANDOFF 對賬式紀律」。

### 5. 鼓勵性而非考試

用「我會帶你做第一個任務」而非「請描述任務」。用「可以嗎？」而非「請確認」。

每 step 標明角色分工：「我（AI）做 X，你做 Y」。避免讓用戶覺得自己被考核。

## Closeout

完成 onboarding session 後，AI 必執行：

1. **確認用戶下一步**：用戶接下來知道如何使用 v2，包括下次如何開新對話、如何描述任務、如何收工。
2. **更新 SESSION_HANDOFF Active Objective**：寫入用戶嘅第一個 task scope，方便下次接力。
3. **更新 SESSION_HANDOFF Next Priorities**：列下次 session 嘅 next concrete action（譬如「完成 README，然後 git commit」）。
4. **提供 standard handoff opening message**：「下一輪開新對話時貼以下一句⋯⋯」嘅 fenced text block。
5. **Unload onboarding pack**：由 regular scenario pack（coding / research / writing / knowledge / ...）接手。

下次 session 開新對話時：
- 如果用戶仍 vague：可以 re-trigger onboarding pack（用戶可能想重新 onboard）
- 如果用戶已熟悉：AI 直接進入 regular work loop，跳過 onboarding pack

## Anti-pattern（不要做的事）

| Anti-pattern | 點解唔做 | 正確做法 |
|---|---|---|
| 收到 user vague message 立即 dive into 一個猜測嘅 task | 用戶可能根本未準備好 / 想其他嘢 / 想了解工具能力 | 主動 ask scenario A-E |
| 第一個 task suggest 大 scope（譬如「我幫你重構整個 codebase」） | 用戶感到 overwhelmed + 唔知 v2 嘅 rhythm | Suggest 10-15 分鐘 minimum viable task |
| 用 jargon 解釋 v2（R-XXX / PROJECT_INDEX / etc） | 新手 cognitive load 高，唔知 jargon 對應乜 | 用日常 wording 解釋 surface impact |
| 假設用戶讀過 README / intro / guide | 用戶可能跳過文檔直接從 AI 對話開始 | 主動 surface 必要 concept，但不灌輸 |
| 完成 onboarding 後唔 unload pack | Onboarding pack 屬 transient，長期駐留會 noise | Closeout 時 explicit unload + 載入 regular pack |
| 一次過跑 5 step 唔等用戶 confirm | 用戶 cognitive load 爆 + 失去 walk-through 精神 | 每 step 等用戶 confirm 才繼續 |
