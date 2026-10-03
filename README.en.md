# Agent Handoff Kit

[繁體中文](README.md) · [Introduction](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-intro.en.html) · [Command guide](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html)

**Your session relay baton.** Help the next AI conversation pick up your work: keep progress, key decisions, file locations and unfinished tasks.

Code version covered: `v0.4.1`. This guide includes updates that have not been released yet. Features available to download depend on the published version.

[![Agent Handoff Kit introduction video](https://raw.githubusercontent.com/Adamchanadam/agent-handoff-kit/main/images/agent-handoff-kit-promo-30s.gif)](https://youtu.be/RopbfBiSw1I)

## How this tool helps your project

- **Carry work between conversations**: save goals, your corrections, important decisions, completed work and outstanding items, so you do not retell everything. Supported tools can reuse saved content in the same project.
- **Keep important files connected**: record what files are for, when to read them and what related content needs updating, reducing missing material and wrong-version use.
- **Keep a useful long-term record**: preserve important choices and reasons so you can ask “Why did we do this?” later. Older records are organized and archived as needed, without rereading everything every time.
- **Adapt to the task**: writing checks audience and tone; research checks sources; coding reads files and tests results; cloud document work checks permissions. You do not select the rules yourself.
- **Keep future working requirements**: save the preferences you explicitly want followed in this project for relevant work next time, beyond the current chat.
- **Handle tools and data carefully**: check important actions and obtain required approval, keep secrets out of records, and close only temporary processes confirmed to belong to this task.

The commands are entry points to these functions. The dashboard brings saved progress, history and file connections into view. The tool is not a cloud sync tool and does not automatically carry unsaved chats between tools.

## First time here

1. Open your project folder in your AI tool and paste the sentence below into the conversation.
2. The AI confirms the folder, installs or upgrades the tool, then checks the result. You do not have to choose installation commands.
3. Once it is ready, use `handoff-kit-onboard` for guidance or `handoff-kit-start` to pick up your work.

```text
Read https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-ai-install.en.html and install or upgrade Agent Handoff Kit in this project folder.
```

Use the same sentence if you have an older version, existing AI work files, or are unsure whether setup is complete. You need an AI tool that can read and write your project folder, plus Node.js 18 or later. Ordinary web chat without folder access is not supported; the AI can check your setup first.

## Useful commands, as you need them

Enter shortcuts in your project’s AI conversation, not in the terminal. Claude Code, Gemini CLI and Antigravity CLI use /; Codex uses $, or selection through /skills. For example, the Codex start shortcut is `$handoff-kit-start`.

| What you want to do | Shortcut |
|---|---|
| Pick up where you left off | [`/handoff-kit-start`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html#start) |
| See the whole project | [`/handoff-kit-progress`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html#progress) |
| Finish this conversation | [`/handoff-kit-close`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html#close) |

[All commands: guidance, files, working requirements, checks and updates](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html#commands)

The daily rhythm: **start → describe your task → check progress when useful → wrap up before ending the conversation**. You do not need all commands every time. Natural phrases such as “Start Agent Handoff” and “wrap up” still work.

Start on its own reads the full handoff, explains the current state and waits for your task. On first use, with no goal yet, it adds a short welcome. To continue immediately, add “continue the current goal”. If the handoff has not been read in full, the AI must say so instead of claiming it has resumed.

Installation and upgrades include the shortcuts for this project only, without installing them in shared computer-wide settings. If an older conversation does not show them, reopen the project conversation. See [shortcut help](docs/commands.md) for other issues.

## The dashboard: find your bearings

Use `handoff-kit-progress` to see current work, unfinished items, things waiting or needing confirmation, recent changes and connections between important files.

![Traditional Chinese dashboard](https://raw.githubusercontent.com/Adamchanadam/agent-handoff-kit/main/images/agent-handoff-kit-dashboard-zh-Hant.webp)

*Actual interface screenshot; Atlas is a fictional example. The same page reads each project’s own saved records.*

<details>
<summary>View the English interface</summary>

![English dashboard](https://raw.githubusercontent.com/Adamchanadam/agent-handoff-kit/main/images/agent-handoff-kit-dashboard-en.webp)

</details>

The page updates automatically when the AI saves records, without a refresh. Asking the AI to open it and saving normal records use some tokens. After that, viewing, filtering and page updates run locally without asking the AI to write another report. Unsaved work does not appear. [Dashboard help](docs/progress.md)

## A few things to know

- The AI handles reading, organizing, doing the work and checking results. You give requirements, feedback and necessary decisions; you do not maintain internal files.
- Wrapping up saves a handoff. Unfinished work stays unfinished; it does not mean the whole project is complete.
- Checking the installation does not repair or upgrade it. Checking for updates automatically upgrades when a newer release exists. Conflicting custom content is kept, and the operation stops.
- Before deleting important data, uploading, publishing or changing access, the AI must explain the effects and obtain the required approval. Passwords and secret keys must not go into handoff records.
- The tool’s rules and checks support handoff; they cannot guarantee an AI will never make a mistake. Missing context, failed reads and incomplete checks should be clearly reported.

For step-by-step help, open the [guide](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html). To set the AI’s reply style separately, you can also use [Adam-AI-Instructions](https://github.com/prompt-templates/Adam-AI-Instructions). It is optional, not a requirement for the tool.
