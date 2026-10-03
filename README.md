# Agent Handoff Kit

[English](README.en.md) · [入門介紹](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-intro.html) · [常用指令用法](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html)

**Session 接力棒**。讓下一次 AI 對話接得上：保留進度、重要決定、文件位置和未完事項。

文件對應程式版本：`v0.4.1`。這份說明包含尚未發布的更新；正式下載可用的功能，以已發布版本為準。

[![Agent Handoff Kit 宣傳動畫](https://raw.githubusercontent.com/Adamchanadam/agent-handoff-kit/main/images/agent-handoff-kit-promo-30s.gif)](https://youtu.be/RopbfBiSw1I)

## 這套工具怎樣幫你

- **跨對話接力**：保存目標、你的修正、重要決定、已完成和未完事項，下次不用從頭交代。不同支援工具開啟同一專案，可沿用已保存內容。
- **重要文件不漏掉**：記下文件用途、何時要讀、哪些改動需要一起更新，減少拿錯版本或找不到資料。
- **長期紀錄找得回**：保留重要選擇及原因，讓你日後追問「之前為甚麼這樣做」。舊紀錄按需要整理和封存，不必每次全部重讀。
- **按任務選做法**：寫作先看讀者和語氣，研究先核對來源，寫程式先讀檔再測試，整理雲端文件先查權限。你不用自己選規則。
- **保留日後要求**：把你明示要長期遵守的習慣留在專案，讓下一次相關工作讀得到；不是只記在當次聊天。
- **安全處理工具與資料**：重要操作先核對及取得所需批准，秘密不寫進紀錄；用完只關閉確定屬於本次工作的臨時程式，不亂停其他工作。

常用指令是這些功能的使用入口。Dashboard 則把已保存的進度、歷程和文件關係放到眼前。這套工具不是雲端同步工具，也不會自動帶走未保存的對話。

## 第一次使用

1. 在你的專案資料夾打開 AI，把下面這句貼進對話。
2. AI 會確認資料夾、安裝或升級，然後檢查結果；你不用選安裝指令。
3. 完成後用 `handoff-kit-onboard` 取得引導，或用 `handoff-kit-start` 接回工作。

```text
請讀取 https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-ai-install.html ，並在這個資料夾安裝或升級 Agent Handoff Kit。
```

已裝過舊版、資料夾已有 AI 工作文件，或不確定是否裝好，都用同一句。需要能讀寫專案資料夾的 AI 工具及 Node.js 18 以上；普通網頁聊天若不能存取資料夾便不適用，AI 可先替你檢查環境。

## 常用指令，按需要用

在專案的 AI 對話輸入指令，不是在終端機。Claude Code、Gemini CLI、Antigravity CLI 用 /；Codex 用 $，也可從 /skills 選取。 例如 Codex 的開工指令是 `$handoff-kit-start`。

| 想做甚麼 | 指令 |
|---|---|
| 接回上次工作 | [`/handoff-kit-start`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html#start) |
| 看專案全貌 | [`/handoff-kit-progress`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html#progress) |
| 準備結束這次對話 | [`/handoff-kit-close`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html#close) |

[完整指令用法：新手引導、整理文件、記住要求、檢查及更新](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html#commands)

日常節奏：**開工 → 說明任務 → 需要時看進度 → 結束對話前收工**。不用每次跑完常用指令。原有「開工」「收工」說法仍可使用。

單獨開工會先完整讀取交接、說明現況，再等你提出任務；初次使用而尚未有目標時會簡短引導。想立即繼續，可在指令後加「繼續完成目前目標」。交接未讀齊時，AI 必須明說，不能假裝已接上。

新安裝或升級會一併放好快捷入口，只供這個專案使用，不會安裝到整部電腦的共用設定。舊對話未顯示入口時，重新開啟專案對話；其他問題見[快捷入口說明](docs/commands.md)。

## 進度頁：一眼找回方向

用 `handoff-kit-progress` 打開 Dashboard，看目前工作、未完成／等待／待確認事項、最近變更及重要文件的關係。

![繁中 Dashboard](https://raw.githubusercontent.com/Adamchanadam/agent-handoff-kit/main/images/agent-handoff-kit-dashboard-zh-Hant.webp)

*實際介面截圖；Atlas 是虛構範例。相同頁面會讀取每個專案自己的紀錄。*

<details>
<summary>查看英文介面</summary>

![English Dashboard](https://raw.githubusercontent.com/Adamchanadam/agent-handoff-kit/main/images/agent-handoff-kit-dashboard-en.webp)

</details>

AI 保存紀錄後，畫面自動更新，不用刷新。你叫 AI 開啟頁面及平常保存紀錄會使用一些 token；之後查看、篩選和更新畫面由本機程式處理，不另叫 AI 寫報告。未保存的工作不會出現。[進度頁用法與常見問題](docs/progress.md)

## 放心使用前，知道這幾點

- AI 負責讀取、整理、執行及檢查；你提出需求、回饋和必要決定，不用維護內部文件。
- 收工保存的是交接，未做完的工作會保留為未完成；這不等於整個專案已完成。
- 檢查安裝不會修復或升級；檢查更新會在有正式新版時自動升級。你的自訂內容遇到衝突會保留並停止處理。
- 刪除重要資料、上傳、發布或更改權限等操作，AI 必須先說明影響並取得所需批准。密碼和金鑰不可寫入交接。
- 這套工具用規則和檢查協助交接，不能保證 AI 永不出錯。交接缺漏、讀取失敗或未完成的檢查，應明確告訴你。

想一步步學，開啟[使用指南](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html)。想另外設定 AI 的回覆語氣，可選用 [Adam-AI-Instructions](https://github.com/prompt-templates/Adam-AI-Instructions)；它不是使用這套工具的必要條件。
