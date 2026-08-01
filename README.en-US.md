

# Agent Handoff Kit

English: [README.en.md](README.en.md) · [Getting started](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-intro.en.html) · [Practical guide](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html) · [AI install page](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-ai-install.en.html)

Kit version: `v0.3.56`. For npm `@latest` and GitHub Release, please refer to the official published version.
 
<p align="center">
  <img src="https://raw.githubusercontent.com/Adamchanadam/agent-handoff-kit/main/images/agent-handoff-kit-promo-30s.gif" alt="Agent Handoff Kit feature overview animation" width="720">
</p>

Agent Handoff Kit is the **baton between AI conversations**.

It handles one narrow but critical problem: AI amnesia across conversations. Every time you start a new conversation, the AI often forgets where you left off, fails to recognize newly created files mid-project, the references you introduced, or which document serves as the latest source of truth. This tool writes progress, next steps, risks, file registry, and prompts for the next session into fixed documents, enabling the next AI tool to pick up right where the last one left off.

📌 When using it, you only need to state your goal; let an AI capable of reading and writing your local folder handle folder verification, installation/upgrade detection, command execution, and result checks.

## 🚀 Three-Step Onboarding

On your first use, you don't need to read the entire README or study terminal commands. Just do three things:

1. Open your AI in the folder where you want to use Agent Handoff Kit, and paste this:

   ```text
   Please read https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-ai-install.html, and install or upgrade Agent Handoff Kit in this folder.
   ```

   You can also open [`agent-handoff-kit-ai-install.html`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-ai-install.html) first to see the steps the AI will follow.

2. After installation, tell the AI `Start Agent Handoff` or "Start work".
3. After finishing this round of work, tell the AI "Wrap up".

🔎 You don't need to judge installations, upgrades, checks, or file structures. The AI will first explain what it sees in the folder, along with risks and next steps; it will pause only when your confirmation is required.

If you have an older version installed, or if the folder already contains AI memory files like `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, use the same command and let the AI decide. The AI will check first and will not silently overwrite.

Want a non-technical introduction first? Open [`agent-handoff-kit-intro.html`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-intro.html) on GitHub Pages. For a full operational demo, open [`agent-handoff-kit-guide.html`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html). To understand its place in a local Agentic AI workflow, see [`local-agentic-ai-workflow-case-study.html`](https://adamchanadam.github.io/agent-handoff-kit/local-agentic-ai-workflow-case-study.html).

## 🐱 How to Read Status Cards

| Status | Meaning |
|---|---|
| `( o.o ) continuity ready` | Ready to relay; the AI has read a state it can continue from. |
| `( -.- ) handoff saved` | Wrapped up and saved; you can say "Start work" next time. |
| `( x.x ) handoff blocked` | Not broken; just that there are still unsaved, uncommitted, unverified, or pending items. Follow the Blocker row to resolve them first. Do not treat this session as a completed handoff. |

## 🧭 How to Read This Repo
 
If you just want to use Agent Handoff Kit, you only need to look at four entry points:

| Entry | Purpose |
|---|---|
| `README.md` | Official use, installation path, and safety boundaries. |
| [`agent-handoff-kit-intro.html`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-intro.html) | Non-technical 60-second intro and promo animation. |
| [`agent-handoff-kit-guide.html`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.html) | Three practical scenarios demonstrating starting, working, and wrapping up. |
| [`agent-handoff-kit-ai-install.html`](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-ai-install.html) | Installation and upgrade instruction page for AI to read. |

This public repo retains the content necessary for usage, installation, onboarding, GitHub Pages, and npm execution. For daily use, you only need to start from the four entry points above.

## 🔎 What Problems It Solves

When using AI for long-term projects, five common problems arise:

| Problem | How Agent Handoff Kit Handles It |
|---|---|
| New AI doesn't know where you left off | Uses `dev/SESSION_HANDOFF.md` to save current state, next steps, risks, and acceptance criteria. |
| New files and references become orphans | You can ask the AI to integrate documents into Agent Handoff Kit, recording each file's purpose, which one is authoritative, and when to sync. |
| Different AI tools have different entry points | Installs `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` simultaneously, all pointing to the same startup workflow; Antigravity CLI will read `AGENTS.md` and `GEMINI.md` in the working folder. |
| AI might randomly modify, delete, or mistakenly publish | Built-in safety rules; high-risk operations require a prior plan. Destructive commands and unauthorized publishes are strictly prohibited. |
| External tools leave residues or get cleaned up randomly | After using MCP, browser, automation tools, notebooks, or helper servers, the AI judges by ownership: task-specific resources can be closed; unknown or shared resources are reported with evidence and await your confirmation. |


It is not a chatbot, nor a development framework. It is more like a fixed handoff log kept within the project.

## 🧰 Compatible Tools

Agent Handoff Kit is suitable for agentic AI tools capable of reading and writing local project folders, such as Claude Code, OpenAI Codex, Gemini CLI, Google Antigravity, or other tools with local workspace read/write capabilities.

It is not suitable for standard web chat AIs, such as ChatGPT, Claude, or Gemini web versions that lack local file read/write capabilities. Uploading files or pasting handoff content cannot replace the local read/write capability required by this tool; such tools cannot reliably maintain handoff documents within the project.

## 🟢 Start Work

Open an AI agent capable of reading and writing your local project folder.

If the AI is already in the correct project folder, daily startup only requires inputting:

```text
Start Agent Handoff
```

You can also say "Start work" in Chinese.

If the current platform can safely control the conversation title, starting work can conveniently rename overly vague or outdated titles to a concise `\<Project Name> | <Primary Action>`. The title should be generated from the current goal or recommended next step loaded in the startup card; generic terms like "Start work" or "Begin handoff" cannot be used as the primary action. It does not read extra files or connect to the network for naming; clear existing titles are retained, and unsupported title controls are silently skipped. Titles are for display only and do not represent project status, progress, completion proof, or additional authorization.
 
If the AI has not yet pointed to your project folder, only use the path-included startup command:

```text
Work in <your project folder>. Read AGENTS.md first, then Start Agent Handoff. Before changing anything, tell me the current state and your recommended next step.
```

First-time installation only makes the beginner guide available; it does not force a startup. If you have clearly described your goal and existing data, the AI will directly start the first safe step; the beginner guide is only loaded if the goal remains vague or you explicitly request a tutorial. Daily "Start work" reads `dev/SESSION_HANDOFF.md` first; it will not re-read `START_NEXT_SESSION_PROMPT.txt` or `dev/SESSION_LOG.md` within the same folder. The prompt copy is only for AI that has not yet pointed to the project folder.

Saying "Start work, continue \<task\>", "\<Project\> start work", or `Start Agent Handoff and continue \<task\>` will directly relay. The AI will only make a brief confirmation if the statement clearly refers to real-world events like opening a business, shifts, or other unrelated matters.

Then describe your task in plain language. The AI should first read the handoff documents, explain the current state, next steps, and risks, before starting work.

## 💾 Wrap Up

When this round of work is complete and you're ready to finish, just input:

```text
Wrap up
```

You can also input:

```text
Wrap up Agent Handoff
wrap up
handoff
```

If you say something like "XX wrap up" (e.g., restaurant closing, today's event wrap up) with other context, the AI should first ask if you want to execute the Agent Handoff Kit wrap-up handoff, rather than immediately rewriting the handoff documents.

The AI should update the handoff documents and simultaneously update the next startup prompt copy:

```text
START_NEXT_SESSION_PROMPT.txt
```

This file saves the actual startup content to be read next time. Next time, you only need to say `Start Agent Handoff` or "Start work"; use the path-included startup command only if the AI has not yet pointed to the project folder. The true authoritative source remains the "Next Startup Prompt" section in `dev/SESSION_HANDOFF.md`. If the two differ, always regenerate the copy based on `dev/SESSION_HANDOFF.md`.

## 🩺 When Unsure About Status

If you are unsure whether the current folder is fully installed, needs an upgrade, or want to check the status after an upgrade, simply ask the AI:

```text
Please read the installation page at the top and help me check the Agent Handoff Kit status in this folder.
```

The AI will handle the check and will not mistake "check passed" for understanding your project. Before truly starting work, you still need to tell the AI `Start Agent Handoff` or "Start work".

## 🗂️ What AI Maintains for You

After installation, Agent Handoff Kit places a set of handoff documents in your project. You do not need to read them one by one, nor manually maintain them.

- **Startup Entry Points**: Enable different AI tools to find the same startup method, e.g., `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and `START_NEXT_SESSION_PROMPT.txt`.
- **Current State**: Saves where you left off, next steps, risks, and check results, e.g., `dev/SESSION_HANDOFF.md`.
- **Trace Log**: Saves recent activities; after long-term use, the AI will automatically organize it to prevent endless bloat.
- **Project Index & Decisions**: Records important documents, external sources, sync responsibilities, and long-term decisions, making it easy to ask "why was this done this way?" later.
- **Work Rules**: The AI loads the necessary rules based on your task; you don't need to memorize rule names.

## 🧭 How AI Work Rules Operate

You don't need to remember any rule filenames. Agent Handoff Kit will have the AI first determine what you need to do now, then load only the necessary work rules.

| What You Want to Do | Rules AI Applies |
|---|---|
| Coding / Bug fixing | Reads project index and related files first, then modifies and tests. |
| Writing articles / READMEs / social posts | Confirms audience, purpose, tone, and publishing location first. |
| Researching / Comparing tools | Distinguishes verified facts, source summaries, and AI judgments. |
| Deleting files / Git / Publishing / npm | High-risk operations must explain impacts first and await your confirmation. |
| External tools like Notion / Google Drive | Verifies current tool docs or official documentation first; securely closes resources by ownership after use; never writes secrets into project files. |

You just state your goal in plain language, e.g., "Help me edit the README", "Check if this tool is suitable", "Integrate this document into Agent Handoff Kit". The AI will determine which rules to apply.

To add your own long-term rules, you don't need to manually edit rule files. You can simply say:

```text
When writing public Chinese documents in the future, please use Traditional Chinese formal writing and avoid mixing Chinese and English. Please integrate this rule into Agent Handoff Kit.
```

The AI should first determine where this rule belongs: a one-time memo, next handoff, project index, or long-term work rule. It should not dump everything into a single file.

## 💬 How to Prompt the AI

Just state your goal in natural language, and the AI will determine which handoff documents, rules, or indexes to read.

| What You Want to Do | You Can Say |
|---|---|
| Pick up where you left off | `Start Agent Handoff` or "Start work" |
| Finish this round of work | "Wrap up" |
| Prevent new files from becoming orphans | "Integrate this document into Agent Handoff Kit so the next AI knows when to read and when to update it." |
| Scan for important files that might be missed | "Scan for important files not integrated into Agent Handoff Kit." |
| Help AI avoid similar mistakes next time | "Compile this mistake into a future work rule so the next AI knows how to avoid it." |
| Make API/tool usage persist for next time | "Use this API calling method from now on; continue using it when opening new conversations." |
| Use external tools like Notion, Google Drive, GitHub | "This project will use these external tools; remember which can be used directly, and do not write secrets into project files." |
| Long tasks used MCP, browser, or automation tools | "When wrapping up, please show the external tool resource closure results: which task-specific resources were closed, and which were retained due to unclear ownership with evidence listed." |

When scanning for important files, the AI will only first list the files that may need integration and the reasons, without automatically modifying them; whether to integrate, merge, or retire them is for you to confirm.

Rules requiring long-term retention should be written by the AI into appropriate project documents, not just left in the current conversation summary.

If it involves deletion, renaming, merging authoritative documents, publishing, uploading, or permission changes, the AI should first explain the impacts and wait for your confirmation.

## 🛡️ Safety Guards

Even if you don't understand code, this tool will require the AI to pause and clarify before high-risk operations.

- Destructive operation boundaries: Specified destructive commands like `rm -rf`, `git reset --hard`, and system root path operations are strictly prohibited; force pushes, branch/tag deletions, and history rewrites require explicit authorization and verification of affected refs.
- Secret protection: `.env`, API keys, tokens must not be printed, committed, or uploaded.
- Verify, don't guess: Before using third-party services, connectors, MCP, CLI, API, or plugin APIs, first verify current tool documentation, official docs, or verified local operation guides; if unverifiable, mark as unverified.
- External tool safe closure: After using MCP, browser, automation tools, notebooks, or helper servers, the AI may only automatically close resources proven to belong to this task; processes and temporary data of unknown, shared, user, or other AI agent ownership must be reported and await your confirmation.
- Stop if insufficient permissions: If files are locked or permissions are lacking, output a manual operation list; do not attempt bypasses.
- Publishing requires explicit approval: Creating version tags, GitHub Releases, npm publish, deployments, or uploads must never be automatically executed just because it says "ready".

## 🔗 Optional Pairing: Adam-AI-Instructions

Agent Handoff Kit can be used alongside [Adam-AI-Instructions](https://github.com/prompt-templates/Adam-AI-Instructions). The two are complementary in division of labor, but deliberately maintain a minimal common safety baseline regarding security, secrets, irreversible operations, and publishing boundaries; this is not a parent-child source, nor should they be merged into a single rule set:

- **Adam-AI-Instructions** handles AI behavioral rules **within a single conversation**: tone, task priority, response structure, computational discipline, terminology discipline, safety guards, and output layer division. It serves as a persistent baseline for "how the AI should answer you".
- **Agent Handoff Kit** handles the relay **between conversations**: current state, next steps, file registry, wrap-up, and next startup. It serves as a persistent baseline for "how the AI remembers your project between conversations".

This is an optional pairing and does not affect the installation or daily use of Agent Handoff Kit. To use it, go to the repository, select the version suitable for your AI tool, and paste it into the AI tool settings.
