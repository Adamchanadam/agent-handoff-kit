# Agent Handoff Kit

[繁體中文](README.md) · [Getting started](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-intro.en.html) · [Practical guide](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html) · [AI install page](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-ai-install.en.html)

Current candidate: `v0.3.43` (not published). The currently published npm release is `v0.3.42`.

Agent Handoff Kit is a small continuity layer for local AI agents. It gives the next AI conversation an honest, readable project handoff: what happened, what matters next, what must not be broken, and which project files are authoritative.

It is for AI tools that can read and write your local project folder. It is not a prompt for ordinary web-chat AI that cannot access that folder.

## Start in three steps

1. Open an AI agent in the folder you want to work in and send it this message:

   ```text
   Read https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-ai-install.en.html and install or upgrade Agent Handoff Kit in this folder.
   ```

2. After installation, say `Start Agent Handoff` or `開工` to that AI.
3. When you are genuinely ending the session, say `wrap up` or `收工`.

You do not need to decide whether this is an install, upgrade, health check, or conflict. The AI must first show the folder it sees and ask for confirmation before it writes. Existing AI files such as `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` are inspected rather than silently overwritten.

## Choose an entry point

| Page | What it is for |
| --- | --- |
| [This README](README.en.md) | Product purpose, safe use, and boundaries. |
| [60-second introduction](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-intro.en.html) | A non-technical overview. |
| [Practical guide](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-guide.en.html) | Three everyday scenarios from installation to handoff. |
| [AI install page](https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-ai-install.en.html) | The precise instructions an AI uses to install, upgrade, or stop safely. |

## What problem it solves

Long-running AI work usually fails at the boundaries between conversations:

| Problem | What the kit does |
| --- | --- |
| The next AI does not know the current state | Keeps a current handoff with objective, risks, validation, and next action. |
| New documents become disconnected | Routes important documents through the project index and rule packs. |
| A session ends without a usable handoff | A real closeout records the result and refreshes the next-session prompt. |
| An upgrade overwrites local material | Only exact, artifact-identified Kit content is replaceable; non-exact content is preserved or causes a safe stop. |
| A health check says success but gives contradictory advice | Doctor reads the same verified accepted state as the transaction, report, and success result. |

## What an upgrade promises

An upgrade must not trade safety for convenience. It must preserve user and user-AI content, update only exact Kit-managed bytes, keep effective rules reachable through the normal runtime entry, and recover to a complete old or complete new state if interrupted.

The published upgrade path is checked with a previous-version artifact, direct user rules in `AGENTS.md`, fresh formal user rules, repeated upgrades, bytes drift, and recovery. If ownership cannot be proved exactly, the tool must not guess from a title, language, location, or formatting.

## Everyday use

Use ordinary language. Examples:

- `Start Agent Handoff`
- `Help me review this proposal and keep the project handoff current.`
- `Please connect docs/research-notes.md to Agent Handoff Kit.`
- `wrap up`

A bare `Start Agent Handoff` or `開工` restores the minimum current state, shows the startup card and recommended next action, then stops. It does not authorize the AI to begin research, planning, QA, packaging, or file edits on its own. To continue work immediately, say so in the same message, for example: `Start Agent Handoff, continue the current task.`

## Technical boundary

The npm package contains only the runtime files needed by a project: the CLI, runtime core, and rule packs. Public source documentation and release QA live in the source repository and are deliberately not installed into user projects.

For manual terminal use, the canonical commands are:

```text
npx --yes @adamchanadam/agent-handoff-kit@latest init
npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run
npx --yes @adamchanadam/agent-handoff-kit@latest doctor
```

`upgrade --dry-run` is only a preview. It is not a completed upgrade.

## Links

- [GitHub repository](https://github.com/Adamchanadam/agent-handoff-kit)
- [npm package](https://www.npmjs.com/package/@adamchanadam/agent-handoff-kit)
- [Traditional Chinese README](README.md)
- [License](LICENSE)
