# Agent Handoff Kit 常用指令

[English](#shortcuts)

這份說明包含尚未發布的更新；正式下載可用的功能，以已發布版本為準。

在專案的 AI 對話輸入指令，不是在終端機。Claude Code、Gemini CLI、Antigravity CLI 用 /；Codex 用 $，也可從 /skills 選取。 例如 Codex 用 `$handoff-kit-start`。

| 想做甚麼 | 指令 |
|---|---|
| 接回上次工作 | [`/handoff-kit-start`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html#start) |
| 看專案全貌 | [`/handoff-kit-progress`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html#progress) |
| 準備結束這次對話 | [`/handoff-kit-close`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html#close) |
| 第一次用，想有人帶路 | [`/handoff-kit-onboard`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html#onboard) |
| 忘了用哪個指令 | [`/handoff-kit-help`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html#help) |
| 讓下次 AI 找得到重要文件 | [`/handoff-kit-align`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html#align) |
| 希望以後都照這樣做 | [`/handoff-kit-remember`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html#remember) |
| 交接功能出了問題 | [`/handoff-kit-check`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html#check) |
| 想用最新正式版 | [`/handoff-kit-update`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html#update) |

日常用開工、進度頁、收工；其他按需要用。每個指令的例子與注意事項都在[使用指南](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html)，不用另外讀一套教學。候選版 `handoff-kit-update` 受控實測必須在同一條 `npx --registry <loopback> ...` 呼叫明確傳入一般 registry，讓 npx 啟動的 CLI 繼承設定作更新檢查；專案 `.npmrc` 的讀回只是準備紀錄，不能證明已繼承，直接以 Node 執行亦不足。

### 安裝與選單

安裝或升級時，指令入口會一併放好，只供目前專案使用，不安裝到電腦的共用設定。不用額外啟用。舊對話未顯示時，重新開啟專案對話；Gemini CLI 可用 `/commands reload`。Codex 選單有簡短中英文說明，例如「開工 / Start」。

如果入口缺漏，把[安裝頁](../agent-handoff-kit-ai-install.html)的句子交給 AI。同版本也可補齊缺項；你的自訂內容遇到衝突會保留並停止，不會強行覆寫。檔案齊備只證明安裝結果，實際選單和呼叫仍須在所用工具確認。

### 使用成本

叫 AI 執行指令及平常保存紀錄會使用一些 token。進度頁開啟後，查看、篩選和自動更新由本機程式處理，不再叫 AI 寫報告。[進度頁說明](progress.md)包含重開、斷線和資料不完整時的處理。

## Shortcuts

This guide includes updates that have not been released yet. Features available to download depend on the published version.

Enter shortcuts in your project’s AI conversation, not in the terminal. Claude Code, Gemini CLI and Antigravity CLI use /; Codex uses $, or selection through /skills. For example, Codex uses `$handoff-kit-start`.

| What you want to do | Shortcut |
|---|---|
| Pick up where you left off | [`/handoff-kit-start`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html#start) |
| See the whole project | [`/handoff-kit-progress`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html#progress) |
| Finish this conversation | [`/handoff-kit-close`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html#close) |
| Get help getting started | [`/handoff-kit-onboard`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html#onboard) |
| Find the right shortcut | [`/handoff-kit-help`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html#help) |
| Help the next AI find an important file | [`/handoff-kit-align`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html#align) |
| Keep a working preference for next time | [`/handoff-kit-remember`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html#remember) |
| Check whether the tool is installed correctly | [`/handoff-kit-check`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html#check) |
| Get the latest released version | [`/handoff-kit-update`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html#update) |

Start, Progress and Wrap up are the everyday shortcuts; use the others as needed. Examples and limits for each are in the [guide](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html), so you do not need a second set of instructions. Controlled candidate `handoff-kit-update` testing must pass the general registry explicitly on the same `npx --registry <loopback> ...` invocation, so the CLI launched by npx inherits it for the update check. A project `.npmrc` readback is setup metadata only, not proof of inheritance, and a direct Node run is insufficient.

### Installation and menus

Installation and upgrades include the shortcuts for this project only, not shared computer-wide settings. No separate activation is needed. If an older conversation does not show them, reopen the project conversation; Gemini CLI can use `/commands reload`. Codex has short bilingual labels such as “開工 / Start”.

For missing entries, give the AI the sentence on the [setup page](../agent-handoff-kit-ai-install.en.html). Reapplying the same version can fill missing files. Conflicting custom content is kept and the operation stops, without forced overwrites. Complete files prove installation only; check menus and invocation in the tool you use.

### Usage cost

Asking the AI to run a shortcut and saving normal records use some tokens. Once the dashboard is open, viewing, filtering and automatic updates run locally without asking the AI to write another report. [Dashboard help](progress.md) covers reopening, disconnections and incomplete data.
