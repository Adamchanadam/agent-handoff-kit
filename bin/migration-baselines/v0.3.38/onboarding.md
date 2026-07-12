# Onboarding Pack

## Scope

Use this transient pack for first-time Agent Handoff Kit users, vague first messages, or fresh-install sessions where the user has not yet chosen a working scenario.

The goal is to help the user complete a small first task without requiring them to read README, guide pages, `AGENTS.md`, or internal Kit rules first. After the onboarding walk-through finishes, unload this pack and continue with the regular scenario pack such as coding, research, writing, knowledge, or integrations.

## Load When

### Explicit onboarding signal keywords

Load this pack when the user message contains an onboarding signal such as:

- "I'm new" / "new user"
- "teach me" / "help me start" / "help me get started"
- "first time" / "first-time" / "I just installed"
- "how do I start" / "show me how" / "getting started"
- "what can agent handoff kit do"
- vague project intent such as "I want to do a project"
- equivalent Chinese user phrases such as "新手", "教我用", "我剛安裝", "點開始", "開工", "能力", or "能做甚麼"

### Implicit signals

- The first user message is short and vague.
- `SESSION_HANDOFF` Active Objective is empty and Session count is 1.
- The user asks a generic capability question instead of giving a concrete task.
- The user appears unfamiliar with the workflow, for example asking what the AI should do rather than giving an objective.

## Discipline

### 1. Do not assume prior reading

The user may start directly from an AI conversation. Explain only the minimum needed for the current step. Do not teach internal file structure, pack names, release identifiers, maintenance rules, or implementation details unless the user asks.

### 2. Offer scenario choice before task execution

When onboarding applies, the first visible response must combine the startup card and scenario chooser into one complete response. Do not print a partial startup card first. Do not repeat the status card, current objective, warnings, or next step.

Offer six scenarios:

- **A. Build systems, tools, platforms, websites, or apps**: the user wants AI help to create or maintain a working project.
- **B. Organize research or write a report**: the user has sources, notes, articles, presentations, or a report goal.
- **C. Organize local files, Notion, Google Drive, or a knowledge base**: the user wants source, reference, mirror, and draft material kept clear.
- **D. Learn to code**: the user is a technical beginner and wants a small guided exercise.
- **E. Custom scenario**: the user has another goal.
- **F. Review installed external tools and design governance**: the user already has Connectors, MCPs, Plugins, Skills, or browser / notebook / crawler tools and wants a safe operating model.

### 3. 5-step walk-through pattern

After the user picks a scenario, guide one small first task through five steps:

1. Confirm project context: folder, existing material, current tools, source locations, and whether external tools are already connected.
2. Explain in three plain points how Agent Handoff Kit helps this scenario.
3. Ask for the first concrete task scope, offering four to six practical options.
4. Suggest one minimum viable task that can usually be completed in 10-15 minutes.
5. Wait for user confirmation, then transition to the regular work loop.

### 4. Advance one step at a time

Do not run all five steps in one message. At each step:

- state what the AI will do,
- state what the user needs to answer or confirm,
- answer questions before continuing,
- let the user skip or change the step.

### 5. Keep the first task small

The first task should be a preview, a short draft, a small classification sample, a dry-run, or another bounded result. Do not begin with broad refactors, bulk file moves, publishing, deployment, or destructive operations.

### 6. Transition after onboarding

After the walk-through:

- load the regular pack(s) for the chosen task,
- unload this transient onboarding pack,
- enter the PLAN -> READ -> CHANGE -> QC -> PERSIST work loop,
- record the first-task scope in `SESSION_HANDOFF` when the persistence gate requires it.

## Application Scenario Library

Each scenario keeps the same five-step rhythm. The model may adapt wording, but must preserve the intent, tone, and safety boundaries.

### Scenario A. Build systems, tools, platforms, websites, or apps

Step A.1: ask for the project folder, current stack if known, whether git exists, and whether GitHub, Linear, Slack, Notion, Google Drive, or other external tools are connected.

Step A.2: explain that Kit helps the AI remember project state across sessions, avoid silent risky commands, and record what changed at closeout.

Step A.3: offer task choices such as fix a bug, add a feature, organize code, add tests, write README, or prepare a first commit.

Step A.4: suggest a small first task, such as a short README section, one failing test investigation, or a dry-run plan.

Step A.5: after confirmation, load the relevant coding / writing / safety packs and begin the normal work loop.

### Scenario B. Organize research or write a report

Step B.1: ask for the topic, existing source locations, intended reader, and whether Notion, Google Drive, or another source tool is connected.

Step B.2: explain that Kit separates source evidence from inference, records source locations, and preserves progress across sessions.

Step B.3: offer task choices such as outline sections, register sources, summarize one source, draft a subsection, or review an existing draft.

Step B.4: suggest a small first task, such as a 5-7 heading outline with one sentence per section.

Step B.5: after confirmation, load research / writing / knowledge packs and begin the normal work loop.

### Scenario C. Organize local files, Notion, Google Drive, or a knowledge base

Step C.1: ask what needs organizing: local folder, Notion database, Google Drive folder, or mixed sources. Ask which external tools are connected or unknown.

Step C.2: explain that Kit separates source of truth, references, mirrors, and drafts, and that risky file operations require dry-run and confirmation.

Step C.3: offer task choices such as scan and classify files, design a folder structure, draft a Notion schema, write a dry-run script, or align local references with an external index.

Step C.4: suggest a small first task, such as classifying a bounded sample without moving files.

Step C.5: after confirmation, load knowledge / safety / integrations packs as needed.

### Scenario D. Learn to code

Step D.1: ask which direction the user wants: small automation, web page, Python tool, Git / GitHub basics, or another beginner task. Ask whether any relevant tools are already installed.

Step D.2: explain that Kit keeps learning progress across sessions, keeps risky operations explicit, and lets the user review each small change.

Step D.3: offer one small exercise, such as a dry-run file renamer, a one-page HTML example, or a tiny Python script.

Step D.4: keep the exercise small enough to explain line by line.

Step D.5: after confirmation, load coding / safety packs and begin the normal work loop.

### Scenario E. Custom scenario

Step E.1: ask for four facts: objective, existing material or tools, technical comfort level, and the first small result the user wants.

Step E.2: explain how Kit helps the chosen scenario using continuity, safety, and source / artifact governance.

Step E.3: offer task choices tailored to the user's answer.

Step E.4: suggest one minimum viable first task.

Step E.5: after confirmation, load the appropriate regular pack combination.

### Scenario F. External-tool governance

Use this scenario when the user already has external tools installed or asks how to use them safely across sessions. This scenario does not teach installation. It records declarations, boundaries, verification, and safe use.

Step F.1: collect installed external tools by category: Connectors, MCPs, Plugins, Skills, browser automation, crawlers, notebooks, or local helper services. If the user does not know the category, ask for names only and classify them.

Step F.2: explain credential separation: Kit files record tool names, project usage, access scope, and credential reference location only. They must never store API keys, OAuth tokens, secrets, or credential values.

Step F.3: map source-of-truth architecture: source of truth, index, persistent mirror, and working draft. Make each layer's write boundary explicit.

Step F.4: when authorized, write the declaration into `PROJECT_INDEX` `## Installed Integrations` and cross-reference relevant External Sources `via` values.

Step F.5: verify current availability using runtime-exposed tool schemas, official docs, or versioned local runbooks. Mark unavailable tools as blocked / unverified instead of guessing.

## Cross-reference to guide.html

When the user asks for a fuller example, mention `agent-handoff-kit-guide.html` as an optional reference. The guide is not required reading.

- Case A aligns with Scenario A plus parts of Scenario C.
- Case B aligns with Scenario B plus Scenario F.
- Case C aligns with long-running project evolution.

## Tone Discipline

Use plain user-facing language. Avoid internal jargon in onboarding replies unless the user asks for implementation details.

- Say "project registry" before exposing `PROJECT_INDEX`.
- Say "wrap up" or the user's own closeout phrase before exposing closeout internals.
- Say "next-session startup message" only when discussing the persisted handoff file.
- Say "working mode" before exposing "rule pack".
- Say "risky command" before exposing "destructive operation".

Keep user-facing explanations self-contained. For the public product's Chinese surfaces, use steady written Traditional Chinese and avoid Cantonese spoken characters. Inside this AI-facing pack, keep instructions in English and use Chinese only as quoted user phrases that the runtime must recognize.

## Closeout

After onboarding finishes:

1. Confirm that the user knows the next practical action, how to start a later session, and how to request closeout.
2. Update `SESSION_HANDOFF` only when the persistence gate says the first-task scope or next action is durable.
3. Record next priorities only when they affect a later session.
4. Do not paste a separate stateful opening message in chat. The persisted `SESSION_HANDOFF` opening-message block remains authoritative.
5. Unload this pack and continue with the relevant regular pack(s).

In a later session, reload onboarding only when the user gives a fresh onboarding signal or asks to restart the walk-through. Otherwise enter the normal work loop.

## Anti-patterns

| Anti-pattern | Why it is wrong | Correct approach |
|---|---|---|
| Treating a vague first message as a specific task | The user may be trying to learn the workflow or choose a scenario. | Offer the A-F scenario chooser first. |
| Making the first task broad | A first-time user needs rhythm and confidence before large changes. | Suggest one 10-15 minute minimum viable task. |
| Explaining Kit internals before the user needs them | Internal labels increase cognitive load. | Explain the visible effect in plain language. |
| Assuming the user read README or guide pages | Many users start directly in an AI chat. | Surface only the concepts needed for the next step. |
| Keeping onboarding loaded after the first task starts | Onboarding is transient and will distract from normal task work. | Unload onboarding and load the regular pack(s). |
| Running all five steps without waiting | The user loses control of the walk-through. | Pause for confirmation at each step. |
| Assuming no Connector, MCP, Plugin, or Skill exists | Paste-only fallback creates the wrong operating model for users who already connected tools. | Ask a lightweight external-tool question in step 1, or use Scenario F. |
