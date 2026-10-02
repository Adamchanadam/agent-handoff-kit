# 快捷入口 / Kit shortcuts

啟用後，在專案的 AI 對話輸入短口令即可。Claude Code、Gemini CLI、Antigravity CLI 用 `/handoff-kit-help`；Codex 用 `$handoff-kit-help`，或輸入 `/skills` 選擇 `handoff-kit-help`。Codex 並不提供相同的直接 `/handoff-kit-*` 自訂命令。

| 用途 | Claude / Gemini / Antigravity | Codex |
|---|---|---|
| 開工、接收交接 | `/handoff-kit-start` | `$handoff-kit-start` |
| 收工、保存及檢查交接 | `/handoff-kit-close` | `$handoff-kit-close` |
| 開啟自動更新的進度頁 | `/handoff-kit-progress` | `$handoff-kit-progress` |
| 檢查文件是否接上治理 | `/handoff-kit-align` | `$handoff-kit-align` |
| 新手引導 | `/handoff-kit-onboard` | `$handoff-kit-onboard` |
| 保存日後要遵守的工作規則 | `/handoff-kit-remember` | `$handoff-kit-remember` |
| 檢查 Kit 安裝狀態 | `/handoff-kit-check` | `$handoff-kit-check` |
| 顯示這份功能選單 | `/handoff-kit-help` | `$handoff-kit-help` |

可在口令後補充目標，例如 `/handoff-kit-align docs/plan.md`、`/handoff-kit-remember 回覆請用繁體中文`，或 `/handoff-kit-start 繼續完成目前目標`。單獨開工只接收狀態；未指定文件的對齊先列候選，不自行整理整個專案。收工會執行原有完整流程，但不新增提交或發佈權限。原有「開工」「收工」等自然語句仍可使用。

## 每個專案啟用一次

對 AI 說：「在這個專案啟用 Kit 常用快捷入口。」正常 AI 安裝教學亦包含這一步。AI 應先完成 Kit 安裝／升級及其驗收，再執行：

```text
npx --yes @adamchanadam/agent-handoff-kit@latest commands --root . --dry-run
npx --yes @adamchanadam/agent-handoff-kit@latest commands --root . --yes
```

預設建立全部平台入口；`--agent claude|gemini|codex|antigravity` 可只建立指定平台。Codex 與 Antigravity 共用一份 `.agents/skills`。程序只建立缺少的入口；相同內容保持不動；任何同名差異會在寫入前停止，不覆寫用戶設定。中斷時保留已完成入口，重新預覽再補齊。此程序不代替 Kit 健康檢查，亦不修改全機設定或官方規則正文。

快捷入口只可安裝在專案內。預覽及啟用都會拒絕使用者主目錄、磁碟根目錄，以及已知的 AI 全域設定位置（包括環境變數指定的位置）；即使目錄已有 Kit 檔案也不例外。若任何入口的輸出位置會落入全域範圍，整批停止，不建立檔案或目錄。主目錄下的一般專案及 Codex 管理的 `worktrees` 內專案仍可使用；全域設定資料夾本身不能當作專案。

如入口未出現，重新開啟該專案的 AI 對話；Gemini CLI 亦可用 `/commands reload`。舊版 CLI 若顯示不認識 `commands`，代表執行的套件未包含此功能。未發佈開發版必須使用已選定的本機套件，不能把 npm 舊版當成新功能驗收。

入口由 `bin/commands.mjs` 統一產生。Claude 使用 `.claude/skills/handoff-kit-*/SKILL.md`，Gemini 使用 `.gemini/commands/handoff-kit-*.toml`，Codex／Antigravity 使用 `.agents/skills/handoff-kit-*/SKILL.md`。規則仍由專案 `AGENTS.md`、`dev/RULE_PACKS.md` 及其指向的文件負責。這些入口不會因被 AI 自動發現便授權執行。

## 進度頁與使用成本

`handoff-kit-progress` 自動開啟頁面，同一專案重複使用會重用相符服務。全部頁面斷線後保留 8 小時，閒置時暫停讀檔；其後服務才自動停止，下次再用口令會重新啟動。不同專案各自識別；頁面正在顯示哪個專案，以頁面專案名稱為準。詳見[進度頁說明](progress.md)。

口令本身由 AI 處理，會使用少量對話內容；進度頁之後由本機程式讀取既有紀錄並自動更新，不需 AI 再寫報告、重做 HTML 或逐步呼叫更新。使用既有 Node.js 18+ 與瀏覽器，不需額外安裝 Python 或服務平台。`npx` 取得工具可能需要網絡；頁面服務本身只在本機運行。

## English

Use `/handoff-kit-*` in Claude Code, Gemini CLI and Antigravity CLI. In Codex, use `$handoff-kit-*` or select the skill through `/skills`; direct custom `/handoff-kit-*` commands are not equivalent Codex syntax.

The eight entries are **handoff-kit-start** (resume), **handoff-kit-close** (save and verify the full handoff), **handoff-kit-progress** (open the live overview), **handoff-kit-align** (check document governance links), **handoff-kit-onboard** (guided introduction), **handoff-kit-remember** (save an explicitly requested future working rule), **handoff-kit-check** (check the Kit installation), and **handoff-kit-help** (menu).

Add context after an entry, such as `/handoff-kit-align docs/plan.md` or `/handoff-kit-start continue the current objective`. Bare start only recovers state. Alignment without a target lists candidates before any edits. Closeout follows the existing complete workflow without granting Git or publishing permission. Natural-language requests still work.

Ask the AI to “Enable Kit shortcuts in this project.” After installing/upgrading Kit and verifying that operation, run the two commands above: preview, then enable with `--yes`. This setup step is included in the AI installation guide. The default enables all platforms; `--agent claude|gemini|codex|antigravity` selects one. Codex and Antigravity share `.agents/skills`. Missing files are created, identical files kept, and any different same-name file stops the preflight with zero writes. After interruption, completed files remain and a new preview shows what is left. This setup does not replace health checks, change global settings or rewrite official rules.

Shortcuts are project-local only. Preview and enable both refuse user home directories, filesystem roots and known shared AI configuration locations, including environment-configured locations, even if Kit files exist there. If any generated entry would land in global scope, the whole operation stops without creating files or directories. Ordinary projects beneath home and projects inside Codex-managed `worktrees` remain supported; the global configuration folder itself cannot serve as a project.

Reopen the project's AI session if entries do not appear; Gemini also supports `/commands reload`. An unrecognized `commands` option means the running package lacks this feature. Use the selected local package for unreleased development; testing npm's older release cannot verify new features.

`bin/commands.mjs` owns the shared content and generates Claude `.claude/skills/handoff-kit-*/SKILL.md`, Gemini `.gemini/commands/handoff-kit-*.toml`, and Codex/Antigravity `.agents/skills/handoff-kit-*/SKILL.md`. Project `AGENTS.md`, `dev/RULE_PACKS.md` and their routed owners still define procedures. Automatic skill discovery does not authorize action.

`handoff-kit-progress` opens the view and reuses a matching service for the same project. The service stays available for eight hours after all pages disconnect, without idle file polling; invoke the entry again to reuse it or restart it after expiry. Projects have separate identities; check the displayed project name. See [the progress guide](progress.md). An AI invocation uses some conversation tokens; subsequent page updates read existing records locally, without more AI reports, redesigned HTML or per-step update calls. It uses the existing Node.js 18+ environment and a browser; no Python or hosting platform is required. `npx` tool acquisition may need network access, while the view itself runs locally.

Platform references: [Claude skills](https://code.claude.com/docs/en/skills), [Gemini custom commands](https://geminicli.com/docs/cli/custom-commands/), [Antigravity CLI skills](https://antigravity.google/docs/skills?app=cli), [Codex skills](https://learn.chatgpt.com/docs/build-skills).
