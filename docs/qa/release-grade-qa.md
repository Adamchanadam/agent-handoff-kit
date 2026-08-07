# 發佈級驗收計劃

狀態：原始碼倉庫的候選／已發佈 evidence index。本文件不屬於 npm package，也不會安裝到使用者專案；QC 方法的唯一 owner 是 WORK `docs/QA_STRATEGY.md`，可執行 command、claim membership、release-readiness full-suite inventory 與 failure propagation 的唯一 owner 是 `scripts/qa-assurance-manifest.mjs`。

## Current QA command contract

<!-- qa-assurance-command:block:start -->
```text
node scripts/qa.mjs quick
node scripts/qa.mjs candidate-preflight --candidate <version>
node scripts/qa.mjs full --candidate <version> --evidence <candidate-evidence.json>
node scripts/qa.mjs postpublish --version <version> --evidence <postpublish-evidence.json>
```
<!-- qa-assurance-command:block:end -->

`quick` is an engineering signal only. `candidate-preflight` checks candidate synchronization before freeze / independent review / full, but is not a full or release PASS. `full` reuses the same candidate preflight before requiring clean HEAD, package.json version binding, fresh candidate tarball SHA-256, five required manual verdicts all passed, role-isolated independent review receipt, review-bundle digest binding, and manifest-allowed hash-bound release QA evidence before it runs release readiness. `postpublish` reads back npm, GitHub Release URL / targetCommitish, remote Git tag commit, packed published tarball, and ordinary npx help semantic command evidence for the claimed version. Historical release records below are evidence, not the current QA command contract.

## v0.3.58 candidate status

- 狀態：v0.3.58 是下一個 source package candidate，原因是 v0.3.57 已正式發布到 npm `@latest`、遠端 tag 與 GitHub Release；v0.3.58 尚未完成 formal full、push、tag、GitHub Release、npm publish 或 postpublish readback。
- 產品範圍：first install marks first-use guidance as eligible and a fresh plain startup with no same-message task enters the short welcome; upgrades of existing projects preserve consumed / not-applicable onboarding state. Fresh init and create-only upgrade paths use direct create-only writes and leave no `dev/governance_migrations` or `.upgrade.lock`; true active, malformed, cross-host, upgrade, merge, archive, missing-journal, or third-state transactions still fail closed. A stale completed create-only init lock may be ignored only after strict read-only validation proves all target files exist and match the recorded after-hashes. The global governance-bridge skill was reviewed as a workflow reference only; no duplicate standard skill was packaged, and the bounded reusable discipline lives in the existing agent-governance owner.
- release surface 範圍：package/runtime Stack/README/HTML/CHANGELOG/whatsnew/release QA 與 official-origin latest published lineage 對齊 v0.3.58 candidate；v0.3.57 保留為最新已發布 lineage，v0.3.58 不進 official-origin published catalog。
- full / release 邊界：本段記錄 candidate source state、public-surface semantic review evidence 與 release QA readback material；不是 formal full PASS、release authorization、npm publish 或 postpublish evidence。

### pre-release final audit（v0.3.58，PUBLIC_SURFACE_REVIEW_ACCEPTED）

- Clean artifact boundary：v0.3.58 clean candidate commit and tarball must be created from the source tree after the accepted first-install onboarding correction, create-only install lock correction, generated official-origin v0.3.57 fixture, governance-bridge standardization decision, install-lock smoke QA backflow, and required release surfaces are synchronized. The final candidate evidence must bind the resulting clean HEAD, package version, tarball SHA-256, manifest digest, release-readiness inventory digest, review bundle SHA-256, review subject digest, and release QA hash.
- full 必須等 clean commit, frozen tarball SHA-256, manifest digest, release-readiness inventory digest, review bundle SHA-256, review subject digest, accepted independent review receipt, and five-conclusion writer assessment before PASS.
- Full-check role isolation keeps the frozen reviewSubject / review bundle history ending `WAITING_INDEPENDENT_REVIEW`; final accepted candidate evidence later changes only the candidate evidence state history to end `REVIEW_ACCEPTED` and supplies the independent review receipt.
- five-conclusion writer assessment currently records governanceHealth、productJourney、userJourney、qcBackflow、rulesPacksRouting as writer-passed conclusions after the independent public-surface re-review accepted the same five candidate conclusions. It is evidence-layer input, not release publication.
- 發布打包邊界：v0.3.58 remains unpublished until formal full, push, tag, GitHub Release, npm publish, and postpublish readback all pass under explicit authorization.

### Cross-mind evidence 9-trigger table（v0.3.58）

| Trigger | Applies | Status | Notes |
|---|---|---|---|
| 1. Failure or blocker | yes | passed | Real fresh-install runtime reports showed `dev/governance_migrations/.upgrade.lock` could trap agents in permission-bound mounted folders; create-only init / upgrade now avoid transaction artifacts entirely, while true unsafe locks still fail closed. |
| 2. External side effects | yes | iterated | No external publication occurs in this candidate-prep batch; push, tag, GitHub Release, npm publish, and postpublish remain separate authorized gates. |
| 3. User-visible output | yes | passed | First install now gives a short first-use welcome on plain startup without turning that startup into task authority; existing upgraded projects do not reset onboarding. |
| 4. Complexity or boundary | yes | passed | The create-only path is deliberately narrower than migration recovery and uses no migration journal; stale completed init locks are ignored only after strict read-only validation proves the recorded create-only transaction is already materialized. |
| 5. Documentation drift | yes | iterated | Source package surfaces are synchronized to v0.3.58 while v0.3.57 remains the latest published lineage until a later release readback supersedes it. |
| 6. Semantic runtime effect | yes | passed | Fresh install, create-only upgrade, stale completed init lock, malformed / active lock fail-closed, first-use onboarding, and governance-bridge routing are covered by automated regressions and public-doc semantic review. |
| 7. Cross-agent / role boundary | yes | iterated | Public surfaces and candidate conclusions have an independent read-only accepted review; formal full still requires a clean HEAD candidate evidence receipt bound to the final review bundle. |
| 8. Real user journey | yes | passed | A new user who asks an AI to install in a fresh folder should get a real first-use welcome and should not inherit hidden migration artifacts or an undeletable `.upgrade.lock`. |
| 9. Release statement | yes | iterated | v0.3.58 is a source candidate only; no full, push, tag, GitHub Release, npm publish, or postpublish readback is claimed here. |

### Bilingual README semantic gate（v0.3.58，PASS）

- Reviewer：agent `019fdd92-e46f-7cd2-ac5e-6ed7138406b1`；provenance `independent-readonly-reviewer:codex-gpt5`；fresh independent read-only full public-surface review；verdict `accepted`.
- `README.md` SHA-256 `DFD31EB8294AF3DF35E55AA0053D82A8B437AEE1E3EBB8B3AAA44A62E6600F96`
- `README.en.md` SHA-256 `0589A1B0C6D9BA427E488327798097016588C537E9AFA7984CCF65E09888D217`
- Verdict: **PASS** — English preserves the v0.3.58 source / npm registry boundary, fresh first-use welcome, existing-upgrade no-reset behavior, same-message task path, local-agent-only scope, startup / closeout behavior, safety, and separate authorization for publication or destructive work.

### Bilingual practical-guide semantic gate（v0.3.58，PASS）

- Reviewer：agent `019fdd92-e46f-7cd2-ac5e-6ed7138406b1`；provenance `independent-readonly-reviewer:codex-gpt5`；fresh independent read-only full public-surface review；verdict `accepted`.
- `agent-handoff-kit-guide.html` SHA-256 `D775896767DDD7EF15308DFF5BAD145437B256A23730730F3CDDD6BFA2AF93A4`
- `agent-handoff-kit-guide.en.html` SHA-256 `63CAB7F37E1025AEF9C5FB4BB1FB55A1801FBC81102E7C73FC84EA00E4ADD544`
- Verdict: **PASS** — English preserves the corrected first-install plain-start welcome, existing-upgrade status-only distinction, same-message task start, high-risk confirmation boundary, install / upgrade / doctor examples, and document bridge guidance.

### Bilingual AI-install semantic gate（v0.3.58，PASS）

- Reviewer：agent `019fdd92-e46f-7cd2-ac5e-6ed7138406b1`；provenance `independent-readonly-reviewer:codex-gpt5`；fresh independent read-only full public-surface review；verdict `accepted`.
- `agent-handoff-kit-ai-install.html` SHA-256 `8B2317E90310F4AF1F0FA9DAC7E0AB0B7683C8049864C84551A2E2F1527C723B`
- `agent-handoff-kit-ai-install.en.html` SHA-256 `239F05A2CA5495FEFABECCD9DB1E316410BC319A3B9A51D9806C1D9AF2199601`
- Verdict: **PASS** — English preserves folder confirmation first, zero-write behavior before confirmation, fresh install / upgrade dry-run / conflict stop, no Git / npm / GitHub publication, doctor / hash readback, and completion report boundaries.

### Bilingual introduction semantic gate（v0.3.58，PASS）

- Reviewer：agent `019fdd92-e46f-7cd2-ac5e-6ed7138406b1`；provenance `independent-readonly-reviewer:codex-gpt5`；fresh independent read-only full public-surface review；verdict `accepted`.
- `agent-handoff-kit-intro.html` SHA-256 `EA28765ABE58543279A88B9EC50014F9F03F7872B9DBE59DD7D76A6CF96303FD`
- `agent-handoff-kit-intro.en.html` SHA-256 `006CB80F10D82CFF8F9FB76A66B7B466BCF3050259C7C037632959C3A866B63C`
- Verdict: **PASS** — English preserves the v0.3.58 source / npm registry boundary, local-agent-only scope, fresh first-use welcome, existing-upgrade no-reset behavior, startup status and task-authority split, closeout, document bridge, safety, and external resource ownership.

## v0.3.57 candidate status

- 狀態：v0.3.57 是下一個 source package candidate，原因是 v0.3.56 已正式發布到 npm `@latest`、遠端 tag 與 GitHub Release；v0.3.57 尚未完成 formal full、push、tag、GitHub Release、npm publish 或 postpublish readback。
- 產品範圍：closeout-status 在 fresh doctor read-back 失敗時回報第一個安全、可操作的 doctor blocker；lifecycle classifier 不再把開場白背景資料、已清除 blocker 句，或有條件 monitor-only 重開句誤判成 unresolved carry-forward，但真正叫下一輪繼續已完成工作的 opening instruction 仍會 blocked；舊 schema-2 committed `currentStateWitness` 加後續 witnessless migration 的回歸情境進入 upgrade-safety；continuity startup title 在 runtime 需要延遲工具 discovery 時，只允許一次窄範圍 title / rename / current-thread discovery，並且只可呼叫安全的 current-thread title tool。
- release surface 範圍：package/runtime Stack/README/HTML/CHANGELOG/whatsnew/release QA 與 official-origin latest published lineage 對齊 v0.3.57 candidate；v0.3.56 保留為最新已發布 lineage，v0.3.57 不進 official-origin published catalog。
- full / release 邊界：本段記錄 clean product candidate、tarball 與 accepted independent review evidence；不是 formal full PASS、release authorization、npm publish 或 postpublish evidence。

### pre-release final audit（v0.3.57，REVIEW_ACCEPTED）

- Clean artifact boundary：v0.3.57 clean candidate commit and tarball must be created from the source tree after the accepted closeout diagnostic, lifecycle carry-forward classifier regression, schema-2 witness regression, startup-title discovery fixes, generated official-origin v0.3.56 fixture, and required release surfaces are synchronized. The final candidate evidence must bind the resulting clean HEAD, package version, tarball SHA-256, manifest digest, release-readiness inventory digest, review bundle SHA-256, review subject digest, and release QA hash.
- full 必須等 clean commit, frozen tarball SHA-256, manifest digest, release-readiness inventory digest, review bundle SHA-256, review subject digest, accepted independent review receipt, and five-conclusion writer assessment before PASS.
- Full-check role isolation keeps the frozen reviewSubject / review bundle history ending `WAITING_INDEPENDENT_REVIEW`; final accepted candidate evidence later changes only the candidate evidence state history to end `REVIEW_ACCEPTED` and supplies the independent review receipt.
- five-conclusion writer assessment currently records governanceHealth、productJourney、userJourney、qcBackflow、rulesPacksRouting as writer-passed conclusions. It is evidence-layer input, not independent review or full PASS.
- 發布打包邊界：v0.3.57 remains unpublished until formal full, push, tag, GitHub Release, npm publish, and postpublish readback all pass under explicit authorization.

### Cross-mind evidence 9-trigger table（v0.3.57）

| Trigger | Applies | Status | Notes |
|---|---|---|---|
| 1. Failure or blocker | yes | passed | Real closeout-status doctor read-back failure was diagnostically opaque, and a separate runtime report showed lifecycle carry-forward false positives; the CLI now surfaces the first safe doctor blocker line and filters resolved/background monitor cases without hiding true continuation conflicts. |
| 2. External side effects | yes | iterated | No external publication occurs in this candidate-prep batch; push, tag, GitHub Release, npm publish, and postpublish remain separate authorized gates. |
| 3. User-visible output | yes | passed | Plain startup can now find a deferred safe current-thread title tool before deciding title control is unavailable. |
| 4. Complexity or boundary | yes | passed | The title fix stays display-only and forbids unrelated thread listing or task management; closeout diagnostics and semantic lifecycle carry-forward classification stay with closeout-status rather than doctor. |
| 5. Documentation drift | yes | iterated | Source package surfaces are synchronized to v0.3.57 while v0.3.56 remains the latest published lineage until a later release readback supersedes it. |
| 6. Semantic runtime effect | yes | passed | Historical schema-2 witness receipts remain operation evidence, not current-state authority; closeout-status distinguishes background / no-blocker / conditional-monitor text from unresolved carry-forward; startup title discovery cannot authorize task work. |
| 7. Cross-agent / role boundary | yes | iterated | This section prepares writer-side candidate evidence; independent review, formal full, and release publication remain separate gates. |
| 8. Real user journey | yes | passed | A normal 收工 should show the actionable doctor blocker without falsely blocking on already resolved opening background, and a normal 開工 can get a meaningful task title when the runtime exposes title control through discovery. |
| 9. Release statement | yes | iterated | v0.3.57 is a source candidate only; no full, push, tag, GitHub Release, npm publish, or postpublish readback is claimed here. |

### Bilingual README semantic gate（v0.3.57，PASS）

- Reviewer：agent `019fcbfd-e19b-7301-ab49-2daeebae9daf`；provenance `codex-gpt-5-2026-08-04-readonly-fullgate`；fresh independent read-only semantic review；verdict `accepted`.
- `README.md` SHA-256 `2FF0398E22EF6183FE4209F12FD06807F073354C677349CD451AD9C1E6E4456B`
- `README.en.md` SHA-256 `865E55FE2D88D9266F536631126B94819944510794CDFC1CAD797FE4DE9AC5F1`
- Verdict: **PASS** — English preserves the Chinese source package / npm and GitHub readback boundary, three-step user path, startup / closeout behavior, status card, external-tool ownership, candidate-only scan, and separate authorization for publish, deletion, and permission changes.

### Bilingual practical-guide semantic gate（v0.3.57，PASS）

- Reviewer：agent `019fcbfd-e19b-7301-ab49-2daeebae9daf`；provenance `codex-gpt-5-2026-08-04-readonly-fullgate`；fresh independent read-only semantic review；verdict `accepted`.
- `agent-handoff-kit-guide.html` SHA-256 `1AAB1B453FAA75CEB4945B33BCBA2FC3F1D74FEEC917F3F606A588DD705CF2D6`
- `agent-handoff-kit-guide.en.html` SHA-256 `FD477335594BD648B4C49C203DA86D2A629FA6D0A723ECC81411B8A6EB6CED82`
- Verdict: **PASS** — English preserves the three cases, install / upgrade / doctor examples, bare startup no-task boundary, confirmation-before-high-risk rule, Drive / Notion readback, durable decisions, and archive consequences.

### Bilingual AI-install semantic gate（v0.3.57，PASS）

- Reviewer：agent `019fcbfd-e19b-7301-ab49-2daeebae9daf`；provenance `codex-gpt-5-2026-08-04-readonly-fullgate`；fresh independent read-only semantic review；verdict `accepted`.
- `agent-handoff-kit-ai-install.html` SHA-256 `F25524E4D3F38BAB452066D00575A12C651BF7EEC65C8A43EA947B0021044C19`
- `agent-handoff-kit-ai-install.en.html` SHA-256 `2A7ABF1B8F3BB5214B060206202DCA3F262C73240A9F73BA03EB12468A45F178`
- Verdict: **PASS** — English preserves folder confirmation first, zero-write behavior before confirmation, fresh install / upgrade dry-run / conflict stop, no Git / npm / GitHub publication, doctor / hash readback, and completion report boundaries.

### Bilingual introduction semantic gate（v0.3.57，PASS）

- Reviewer：agent `019fcbfd-e19b-7301-ab49-2daeebae9daf`；provenance `codex-gpt-5-2026-08-04-readonly-fullgate`；fresh independent read-only semantic review；verdict `accepted`.
- `agent-handoff-kit-intro.html` SHA-256 `F50A8FA10CF667C5105C2442184F09FFCCAFA1AF4F0CD9F92D43BEEBFAF9EA29`
- `agent-handoff-kit-intro.en.html` SHA-256 `9FD8060634D7CAB148B42A1640D25AC1FC1B4E6225F3B7057947A25451E46FAA`
- Verdict: **PASS** — English preserves the v0.3.57 source / npm registry boundary, local-agent-only scope, startup status-only behavior, closeout, document bridge, safety, and external resource ownership.

## v0.3.56 release history

- 狀態：正式發布歷史。v0.3.56 was released from commit `a13ad3fcf6c629545630471fce6280043ffeb014`; GitHub Release was published at `2026-07-31T11:22:10Z`; npm package `0.3.56` was published at `2026-07-31T11:22:20.140Z` and is npm `@latest` at this candidate-prep readback. The source, bilingual, and candidate evidence below are retained as release evidence history, not current v0.3.57 blockers.
- 產品範圍：closeout-status blocked lifecycle now prints the first conflicting `Resolved [...]` / `Carry-forward [...]` pair；doctor lifecycle check remains a mechanical readability floor, not semantic lifecycle judgment；closeout pack routes agents to the closeout-status diagnostic instead of Kit-internal inspection；startup title naming runs after current objective / boundary / recommended next action are finalized and skips generic titles.
- official-origin lineage：v0.3.56 is now the latest published lineage recorded in the generated official-origin catalog / fixture until v0.3.57 is published.

### pre-release final audit（v0.3.56，HISTORY）

- Clean artifact boundary：v0.3.56 clean candidate commit and tarball must be created from the source tree after the accepted closeout diagnostic and startup-title fixes, generated official-origin v0.3.55 fixture, and required release surfaces are synchronized. The final candidate evidence must bind the resulting clean HEAD, package version, tarball SHA-256, manifest digest, release-readiness inventory digest, review bundle SHA-256, review subject digest, and release QA hash.
- full 必須等 clean commit, frozen tarball SHA-256, manifest digest, release-readiness inventory digest, review bundle SHA-256, review subject digest, accepted independent review receipt, and five-conclusion writer assessment before PASS.
- Full-check role isolation keeps the frozen reviewSubject / review bundle history ending `WAITING_INDEPENDENT_REVIEW`; final accepted candidate evidence later changes only the candidate evidence state history to end `REVIEW_ACCEPTED` and supplies the independent review receipt.
- five-conclusion writer assessment currently records governanceHealth、productJourney、userJourney、qcBackflow、rulesPacksRouting as writer-passed conclusions. It is evidence-layer input, not independent review or full PASS.
- 發布打包邊界：v0.3.56 completed formal release publication and is now prior published lineage for the v0.3.57 candidate.

### Cross-mind evidence 9-trigger table（v0.3.56）

| Trigger | Applies | Status | Notes |
|---|---|---|---|
| 1. Failure or blocker | yes | passed | Real closeout-status lifecycle blocking was diagnostically opaque; the CLI now prints the first conflicting Resolved / Carry-forward pair so agents can fix SESSION_HANDOFF directly. |
| 2. External side effects | yes | iterated | No external publication occurs in this candidate-prep batch; push, tag, GitHub Release, npm publish, and postpublish remain separate authorized gates. |
| 3. User-visible output | yes | passed | Blocked closeout output now identifies the first lifecycle conflict, and plain startup can get a meaningful title after startup facts are finalized. |
| 4. Complexity or boundary | yes | passed | Lifecycle semantics remain owned by closeout-status, doctor is reset to a mechanical floor, and startup title remains display-only; no second lifecycle rule owner or diagnostic command is added. |
| 5. Documentation drift | yes | iterated | Source package surfaces are synchronized to v0.3.56 while v0.3.55 remains the latest published lineage until a later release readback supersedes it. |
| 6. Semantic runtime effect | yes | passed | closeout-status reads existing handoff lifecycle fields and reports the first pair without mutating project files; startup title uses already-loaded facts only. |
| 7. Cross-agent / role boundary | yes | iterated | This section prepares writer-side candidate evidence; independent review, formal full, and release publication remain pending gates. |
| 8. Real user journey | yes | passed | A normal 收工 no longer requires Kit-internal inspection to find the first conflicting lifecycle line; 開工 titles are no longer based on generic startup wording. |
| 9. Release statement | yes | iterated | v0.3.56 is a source candidate only; no full, push, tag, GitHub Release, npm publish, or postpublish readback is claimed here. |

### Bilingual README semantic gate（v0.3.56，PASS）

- Reviewer：agent `019fb7c9-42fd-7331-8c4c-74666291205a`；fresh independent read-only semantic review；receipt `2026-07-31T10:56:49Z`；verdict `accepted`.
- `README.md` SHA-256 `32EDD8AC28AAA89D2CA0A51158F47B07664FE8C01454105EC6C81B2051F07EEB`
- `README.en.md` SHA-256 `F19FC90D1D42B04B8B59FA186C1B48EF856FA2A681FCCC3928B6E455B3C7F4D1`
- Verdict: **PASS** — The English README preserves the Chinese quick-start, source-package version, postpublish readback boundary, local-folder requirement, startup/closeout behavior, and current-thread title rule: title naming uses finalized startup-card facts, generic continuity triggers cannot be the primary action, and the title is display-only.

### Bilingual practical-guide semantic gate（v0.3.56，PASS）

- Reviewer：agent `019fb7c9-42fd-7331-8c4c-74666291205a`；fresh independent read-only semantic review；receipt `2026-07-31T10:56:49Z`；verdict `accepted`.
- `agent-handoff-kit-guide.html` SHA-256 `72C90940B14C2CE47983C7D28D5629FFFC77F57A86053D5878AF901163D46B0A`
- `agent-handoff-kit-guide.en.html` SHA-256 `63A1B81736D34BF7A94451B4DB80C089DE4577B6BA790C0D1839D4A5F887C1CA`
- Verdict: **PASS** — English preserves the three practical journeys, install / startup / closeout flow, versioned examples, and npm registry boundary without widening task authorization or release-state claims.

### Bilingual AI-install semantic gate（v0.3.56，PASS）

- Reviewer：agent `019fb7c9-42fd-7331-8c4c-74666291205a`；fresh independent read-only semantic review；receipt `2026-07-31T10:56:49Z`；verdict `accepted`.
- `agent-handoff-kit-ai-install.html` SHA-256 `00E1080C486F1CE373E3205C235F0ED9F739EA2F9FF7264BC0D28B6E21B0C0AC`
- `agent-handoff-kit-ai-install.en.html` SHA-256 `35605112ED65502E4679BDE95EC5FEDBE2B1334648D8B4BDF9DB5632F6D722C5`
- Verdict: **PASS** — English preserves the Chinese install safeguards: confirm the root first, stop on conflict, preview dry-run before yes, avoid reinstall / whole-file overwrite bypass, and keep credentials / Git / publishing outside install authorization.

### Bilingual introduction semantic gate（v0.3.56，PASS）

- Reviewer：agent `019fb7c9-42fd-7331-8c4c-74666291205a`；fresh independent read-only semantic review；receipt `2026-07-31T10:56:49Z`；verdict `accepted`.
- `agent-handoff-kit-intro.html` SHA-256 `D279F512CDBC8E27FF38362BFD8E5EB371E71765C4C2BC227374EF49C882F048`
- `agent-handoff-kit-intro.en.html` SHA-256 `5F7F44BFE7C9844E618378FDE931E911E0DEC7536ABB1173B5BB316D492633A3`
- Verdict: **PASS** — English preserves the Chinese beginner purpose, local-agent-only boundary, startup / closeout framing, document-layer explanation, and v0.3.56 / npm registry distinction.

## v0.3.55 release history

- 狀態：正式發布歷史。v0.3.55 was released from commit `53e8d095d7149f6461e6c8a7aa336058d6c59b39`; GitHub Release was published at `2026-07-27T11:44:49Z`; npm package `0.3.55` was published at `2026-07-27T11:45:06Z`. The source, bilingual, and candidate evidence below are retained as release evidence history, not current v0.3.56 blockers.
- 發布內容：startup title timing moved naming after startup facts are finalized, and the title must use concrete project / action facts instead of generic continuity triggers.
- official-origin lineage：v0.3.55 is now the latest published lineage recorded in the generated official-origin catalog / fixture until v0.3.56 is published.

### pre-release final audit（v0.3.55，HISTORY）

- Clean artifact boundary：v0.3.55 later completed formal full, push, tag, GitHub Release, npm publish, and postpublish readback from commit `53e8d095d7149f6461e6c8a7aa336058d6c59b39`. This subsection is retained as pre-release evidence history.
- full 必須等 clean commit, frozen tarball SHA-256, manifest digest, release-readiness inventory digest, review bundle SHA-256, review subject digest, accepted independent review receipt, and five-conclusion writer assessment before PASS.
- Full-check role isolation keeps the frozen reviewSubject / review bundle history ending `WAITING_INDEPENDENT_REVIEW`; final accepted candidate evidence later changes only the candidate evidence state history to end `REVIEW_ACCEPTED` and supplies the independent review receipt.
- five-conclusion writer assessment currently records governanceHealth、productJourney、userJourney、qcBackflow、rulesPacksRouting as writer-passed conclusions. It is evidence-layer input, not independent review or full PASS.
- 發布打包邊界：v0.3.55 completed formal release publication and is now prior published lineage for the v0.3.56 candidate.

### Cross-mind evidence 9-trigger table（v0.3.55）

| Trigger | Applies | Status | Notes |
|---|---|---|---|
| 1. Failure or blocker | yes | passed | The accepted title-timing correction prevents startup title selection from running before objective and recommended-next-action facts exist. |
| 2. External side effects | yes | iterated | No external publication occurs in this candidate-prep batch; push, tag, GitHub Release, npm publish, and postpublish remain separate gates. |
| 3. User-visible output | yes | passed | Plain startup can show a more meaningful conversation title when the runtime supports safe title control, without changing startup card or task authorization. |
| 4. Complexity or boundary | yes | passed | The change stays inside existing startup-title wording and its existing checker; no new API, schema, title owner, or governance mechanism is added. |
| 5. Documentation drift | yes | iterated | Source package surfaces were synchronized to v0.3.55 before release; the generated official-origin catalog now carries v0.3.55 as prior published lineage. |
| 6. Semantic runtime effect | yes | passed | Title selection uses already-loaded startup facts only and never reads extra files, network, PROJECT_INDEX, or state solely for naming. |
| 7. Cross-agent / role boundary | yes | iterated | This section prepares writer-side candidate evidence; independent review, formal full, and release publication remain pending gates. |
| 8. Real user journey | yes | passed | Continuity triggers such as `Start Agent Handoff`, `開工`, and `開始工作交接` cannot become the primary action in the title. |
| 9. Release statement | yes | passed | v0.3.55 completed formal full, push, tag, GitHub Release, npm publish, and postpublish readback; this table is retained as release-history evidence. |

### Bilingual README semantic gate（v0.3.55，PASS）

- Reviewer：task/thread `019fa342-53c5-78f3-ae90-8bea8513eae3`；nonce `CER-AHK-R1-V055-TITLE-REVIEW-20260727-01`；fresh independent read-only semantic review；Critical 0 / Major 0 / Minor 0；verdict `accepted_for_full_gate`.
- `README.md` SHA-256 `D54CEBE4921652955F093BDE66D801164407E86D6728FC0587838DBB0C479607`
- `README.en.md` SHA-256 `6089B82E4AAFD9FF6FE449E1FDADF39805FEF8DD180CFF723554DC4AAC2E4405`
- Verdict: **PASS** — English preserves equivalent purpose, three-step start, local-folder boundary, startup/closeout, ordinary workspace scan candidate-only/no automatic change, and release-state readback boundary. No omitted or altered safety instruction, unsafe expansion, release-state mismatch, broken counterpart navigation, or unintended untranslated visible material was found; v0.3.55 version claims are aligned and `@latest` wording remains readback-bound. This is evidence-only and is not formal full, release, npm publish, or postpublish PASS.

### Bilingual practical-guide semantic gate（v0.3.55，PASS）

- Reviewer：task/thread `019fa342-53c5-78f3-ae90-8bea8513eae3`；nonce `CER-AHK-R1-V055-TITLE-REVIEW-20260727-01`；fresh independent read-only semantic review；Critical 0 / Major 0 / Minor 0；verdict `accepted_for_full_gate`.
- `agent-handoff-kit-guide.html` SHA-256 `F2317E4AA3193A8CAFDEDF8969C58AA18E4B465C3FA824D6B69AFCB889A87624`
- `agent-handoff-kit-guide.en.html` SHA-256 `801C3E36A8395677F3120C0683DB1E99C9CEFB013A28ADB9071FA95DAFAF7535`
- Verdict: **PASS** — English preserves the three flows, bare startup versus task authorization, install/doctor/upgrade, safety preview, closeout, and release confirmation; candidate diff is version synchronization without promise expansion. No omitted or altered safety instruction, unsafe expansion, release-state mismatch, broken counterpart navigation, or unintended untranslated visible material was found; v0.3.55 version claims are aligned and `@latest` wording remains readback-bound.

### Bilingual AI-install semantic gate（v0.3.55，PASS）

- Reviewer：task/thread `019fa342-53c5-78f3-ae90-8bea8513eae3`；nonce `CER-AHK-R1-V055-TITLE-REVIEW-20260727-01`；fresh independent read-only semantic review；Critical 0 / Major 0 / Minor 0；verdict `accepted_for_full_gate`.
- `agent-handoff-kit-ai-install.html` SHA-256 `66C777C0FA7E07B61C3CED14A56B2C827E0B75BFADA6AF8E73621131FAC95CC3`
- `agent-handoff-kit-ai-install.en.html` SHA-256 `B2C1E560C1985E1EF8A57C7FE57D1C5BB6B61F05B13E29297D3CEC421D62C0F6`
- Verdict: **PASS** — English preserves root confirmation, zero-write conflict stop, dry-run before yes, no reinstall/whole-file overwrite bypass, and credentials/Git/publish outside authorization. No omitted or altered safety instruction, unsafe expansion, release-state mismatch, broken counterpart navigation, or unintended untranslated visible material was found; v0.3.55 version claims are aligned and `@latest` wording remains readback-bound.

### Bilingual introduction semantic gate（v0.3.55，PASS）

- Reviewer：task/thread `019fa342-53c5-78f3-ae90-8bea8513eae3`；nonce `CER-AHK-R1-V055-TITLE-REVIEW-20260727-01`；fresh independent read-only semantic review；Critical 0 / Major 0 / Minor 0；verdict `accepted_for_full_gate`.
- `agent-handoff-kit-intro.html` SHA-256 `29AF86F22C8C787B1A7DDB7EED73B3CC4FD1C70A1E7A622B569068B7361903E0`
- `agent-handoff-kit-intro.en.html` SHA-256 `0A48FBBB75F3258843D00B8978FD1642DA612EBAFE8797AA5F13DFEF38C1412B`
- Verdict: **PASS** — English preserves beginner problem/purpose, local-agent-only boundary, startup/closeout, document layers, repo-wide ordinary file scan candidate-only/no auto-change, and v0.3.55 state. No omitted or altered safety instruction, unsafe expansion, release-state mismatch, broken counterpart navigation, or unintended untranslated visible material was found; v0.3.55 version claims are aligned and `@latest` wording remains readback-bound.
## v0.3.54 release history

- 狀態：正式發布歷史。v0.3.54 was released from commit `29a65abed761aec2ac17c247389722fc605947c4`; GitHub Release and npm `@latest` readback are v0.3.54. The source, bilingual, evidence, formal full, and postpublish records below are retained as release evidence history, not current v0.3.55 blockers.
- Final source review：fresh GPT-5.5 High reviewer agent `019fa14b-d338-7932-80b5-30831a99f9dd`，nonce `CER-AHK-R-V054-FINAL-SOURCE-20260727-01`，reviewed the exact 40-path Public source candidate at `main@f8495d444b369e13008435888c1b16e363ff49aa` with status SHA-256 `f1243c33b1dceb3edca824b292325aa36817d97143d94d365f841cd68d513fd3`; Critical 0 / Major 0 / Minor 0; verdict `accepted_for_clean_candidate`. Subsequent bounded product/source corrections converged operation-local receipts and Scenario 3c release-readiness assertions into clean HEAD `af0d1a377bc7c3b596e97ef262722bba7aca6a3c`; v0.3.54 later completed formal full, release, npm publish, and postpublish readback.
- Final evidence-merge review：fresh read-only reviewer Chandrasekhar（GPT-5.5 High），agent `019fa29d-cfff-7c22-9831-1cccdd873d1d`，reviewed clean Public `main@af0d1a377bc7c3b596e97ef262722bba7aca6a3c` and frozen tarball SHA-256 `2c955cd87a74e0484ccece733a088de53898acda163930021cb46c41401415e9` with 34 entries; Critical 0 / Major 0; verdict `accepted_for_evidence_merge`. Sole Minor was this current-state identity wording, corrected in place without adding a new evidence schema or QA layer.
- 根修範圍：交易證據只在 active operation / lock 內作 no-clobber、rollback、recovery 與誠實報告；lock 清除後，`doctor` / `upgrade` 不再讀 committed historical journals 作 current workspace bytes authority。`reconcile-current-state` / `finalize-closeout` 與永久 witness / runtimeAcceptance authority 已移除；ordinary workspace files remain inert.
- 真實 runtime replay：C / E1 使用 v0.3.52 live runtime 的隔離副本完成 dry-run → upgrade → doctor → legitimate mutable / ordinary / Unicode / new-file edits → second dry-run / upgrade or truthful no-op → doctor；原 live root only read-back / unchanged，未在原地 upgrade 或 doctor 寫入。
- access observation：ordinary locked-decoy / no-read proof 已覆蓋，驗證普通 workspace paths 不因舊 journal、Markdown text 或 root placement 被 discovery、read、hash、journal、report 或 block。
- current lifecycle evidence：67 published historical single-hop upgrades passed；PROJECT_INDEX legal transforms、SESSION_HANDOFF / SESSION_LOG current migration、rule-pack / archive mutable lifecycle、formal USER_RULES route、credential preflight、typed unsafe fail-closed、active transaction recovery、rollback / interruption windows and no-lock historical journal inertness均已由 current QA owners 覆蓋。
- active-lock correction：empty / `{` / `[` / malformed JSON lock、parsable invalid schema lock、missing / unreadable exact journal all fail closed with byte-exact fixture snapshots, original lock retained, no quarantine, no historical-journal fallback, no new transaction / report / stage / backup. Supported active recovery still uses the exact lock / journal references.
- release assurance correction：scenario 4b now proves arbitrary user-managed handoff prose cannot make `doctor` / `upgrade` no-op fail; full closeout lifecycle consistency remains owned by `closeout-status`. Release-readiness retrieves the pinned v0.3.41 npm artifact from official npm identity during the run, postpublish npx evidence is semantic command readback instead of raw terminal hash, and the latest Cross-mind table is a live mechanical completeness floor.
- official-origin lineage：v0.3.53 is now the latest published lineage recorded in the official-origin catalog / fixture: npm shasum `362b1e555d3b72c2996c333fddc52a38a1e7f293`, integrity `sha512-HJ/Xy8ExkarwaxMNeQm43dmjvtgIHCecU5kZqFxgqMisejnaGNFvCTWnWqtL7ze4pXdzqMj+Fu99VricJv58Tg==`, remote tag / commit `f8495d444b369e13008435888c1b16e363ff49aa`, GitHub Release publishedAt `2026-07-26T21:40:40Z`.
### pre-release final audit（v0.3.54，WAITING）

- Clean artifact boundary：clean product/source HEAD `af0d1a377bc7c3b596e97ef262722bba7aca6a3c` exists and is package-bound to frozen tarball SHA-256 `2c955cd87a74e0484ccece733a088de53898acda163930021cb46c41401415e9`. This final evidence merge updates only package-excluded QA evidence; final candidate evidence must bind the resulting clean HEAD as an evidence-only descendant of that product/source HEAD.
- full 必須等 clean commit, frozen tarball SHA-256, manifest digest, release-readiness inventory digest, review bundle SHA-256, review subject digest, accepted independent review receipt, and five-conclusion writer assessment before PASS.
- Full-check role isolation keeps the frozen reviewSubject / review bundle history ending `WAITING_INDEPENDENT_REVIEW`; final accepted candidate evidence later changes only the candidate evidence state history to end `REVIEW_ACCEPTED` and supplies the independent review receipt.
- five-conclusion writer assessment currently records governanceHealth、productJourney、userJourney、qcBackflow、rulesPacksRouting as writer-passed conclusions. It is evidence-layer input, not independent review or full PASS.
- 發布打包邊界：v0.3.54 product/source is frozen in clean HEAD `af0d1a377bc7c3b596e97ef262722bba7aca6a3c`; this final evidence merge is evidence-only and package-excluded. The final clean HEAD will be an evidence-only descendant bound by candidate evidence. v0.3.54 later completed accepted candidate evidence, formal full gate, push, tag, GitHub Release, npm publish, and postpublish readback; this subsection is retained as pre-release audit history.

### Cross-mind evidence 9-trigger table（v0.3.54）

| Trigger | Applies | Status | Notes |
|---|---|---|---|
| 1. Failure or blocker | yes | passed | Released v0.3.53 could still block a real mutable workspace by reusing committed transaction witness bytes as permanent current authority; v0.3.54 source review accepted the operation-local replacement. |
| 2. External side effects | yes | iterated | Local clean product/source commit exists; no external side effect has been performed: no push, tag, GitHub Release, npm publish, or postpublish. Those remain separate authorization steps. |
| 3. User-visible output | yes | passed | Users no longer need reconcile / finalize / manual journal repair after ordinary valid workspace evolution, as proven by isolated lifecycle replay and accepted source review. |
| 4. Complexity or boundary | yes | passed | Operation-local transaction evidence, active-lock recovery, current lifecycle validation, and ordinary-file inertness are separated. |
| 5. Documentation drift | yes | iterated | README, active HTML, whatsnew, CHANGELOG, release QA and runtime Stack version surfaces are synchronized to v0.3.54 source-package state; release-assurance QA owner drift is corrected without changing package contents. |
| 6. Semantic runtime effect | yes | passed | No-lock historical journals are inert; active lock failures remain fail-closed; Kit-owned current lifecycle remains protected. |
| 7. Cross-agent / role boundary | yes | passed | Fresh reviewers accepted product integration, final source review, bilingual evidence, and final evidence-merge identity binding. Formal full and release gate remain evidence-layer / authorization gates. |
| 8. Real user journey | yes | passed | Isolated copy of the real v0.3.52 runtime path passed the daily mutable-workspace journey without rebind / reconcile / finalize / manual prep. |
| 9. Release statement | yes | iterated | v0.3.54 completed formal full, push, tag, GitHub Release, npm publish, and postpublish readback; this table is retained as release-history evidence. |

### Bilingual README semantic gate（v0.3.54，PASS）

- Reviewer：agent `019fa14b-d338-7932-80b5-30831a99f9dd`；nonce `CER-AHK-R-V054-BILINGUAL-20260727-01`；fresh independent read-only semantic review；Critical 0 / Major 0 / Minor 0；verdict `accepted_for_bilingual_evidence`.
- `README.md` SHA-256 `8B5CA914D64EDA38ACEAF298E1974D301EBA71AB2F978211DAE304A7085AA07B`
- `README.en.md` SHA-256 `41B8338E9DC42CF9E9331827780F94D8DC0F1D63B63C43379E938B966B0E9E92`
- Verdict: **PASS** — English preserves equivalent purpose, three-step start, local-folder boundary, startup/closeout, ordinary workspace scan candidate-only/no automatic change, and release-state readback boundary.

### Bilingual practical-guide semantic gate（v0.3.54，PASS）

- Reviewer：agent `019fa14b-d338-7932-80b5-30831a99f9dd`；nonce `CER-AHK-R-V054-BILINGUAL-20260727-01`；fresh independent read-only semantic review；Critical 0 / Major 0 / Minor 0；verdict `accepted_for_bilingual_evidence`.
- `agent-handoff-kit-guide.html` SHA-256 `DC05AA54DE9EA52715407FF80D65BF65DBB377974683D2457C9671692FB0CE32`
- `agent-handoff-kit-guide.en.html` SHA-256 `6E91F3A00A1AB66B46A66882E996BA77327AFDEA171483E59DE06DD89AA506A3`
- Verdict: **PASS** — English preserves the three flows, bare startup versus task authorization, install/doctor/upgrade, safety preview, closeout, and release confirmation; candidate diff is version synchronization without promise expansion.

### Bilingual AI-install semantic gate（v0.3.54，PASS）

- Reviewer：agent `019fa14b-d338-7932-80b5-30831a99f9dd`；nonce `CER-AHK-R-V054-BILINGUAL-20260727-01`；fresh independent read-only semantic review；Critical 0 / Major 0 / Minor 0；verdict `accepted_for_bilingual_evidence`.
- `agent-handoff-kit-ai-install.html` SHA-256 `17B1F6F9D4499C01CA555D8DD1057BB5F69779B6D70FCDB86A757C97DC5A9324`
- `agent-handoff-kit-ai-install.en.html` SHA-256 `E8A39B3F759AB8081115F67EB0298EB813EDC938D5FB5478FC97B26532D27CC3`
- Verdict: **PASS** — English preserves root confirmation, zero-write conflict stop, dry-run before yes, no reinstall/whole-file overwrite bypass, and credentials/Git/publish outside authorization.

### Bilingual introduction semantic gate（v0.3.54，PASS）

- Reviewer：agent `019fa14b-d338-7932-80b5-30831a99f9dd`；nonce `CER-AHK-R-V054-BILINGUAL-20260727-01`；fresh independent read-only semantic review；Critical 0 / Major 0 / Minor 0；verdict `accepted_for_bilingual_evidence`.
- `agent-handoff-kit-intro.html` SHA-256 `A86B6D950199E8334049CFEFD48A6C2560268BB984CB8131A9069AD7F60C65AA`
- `agent-handoff-kit-intro.en.html` SHA-256 `ADBCA4AE7017E077B9673D606A03E6AAAADDB6C3A923B3F5944EEFDDED1B5050`
- Verdict: **PASS** — English preserves beginner problem/purpose, local-agent-only boundary, startup/closeout, document layers, repo-wide ordinary file scan candidate-only/no auto-change, and v0.3.54 state.

## v0.3.53 release history

- 狀態：正式發布歷史。v0.3.53 was released from commit `f8495d444b369e13008435888c1b16e363ff49aa`; GitHub Release was published at `2026-07-26T21:40:40Z`; npm `@latest` readback is `0.3.53` until a later release supersedes it. The source-review and bilingual gates below are retained as pre-release evidence history, not current v0.3.54 blockers.
- 已接受產品 source review：R4 final frozen review receipt nonce `CER-AHK-R4-BATCH14-CORR2-REVIEW-20260726-01` returned `accepted_for_product_integration` with zero Critical / Major / Minor findings. It accepts the v0.3.53 Public product integration candidate after the BATCH14 / CORR2 PROJECT_INDEX byte-preservation correction, including scoped typed inventory / inert generic references / doctor non-discovery、dry-run/apply preflight parity and lock revalidation、legacy witness retirement、single Stack version parser/startup boundary、PROJECT_INDEX visible-Markdown authority / legal transforms, and the related obsolete QA-owner convergence.
- Frozen scope / C matrix：R4 accepted the product candidate at source level, then Phase A froze it as clean commit `afc49fc2346c2b4709f60184106bf8fae0e7f1d8` for review. C reports the affected product matrix passed, including syntax, upgrade-safety, startup-status-only, stateful raw, Gate 5 closure / transaction-window, post-upgrade closeout/finalize, public-prototype, inventory, QA assurance, quick, candidate-preflight `0.3.53`, npm pack dry-run with 34 files, and diff-check. This row records the historical source-candidate matrix that preceded the final release.
- 發布讀回邊界：v0.3.53 completed clean candidate identity, formal full, push, tag, GitHub Release, npm publish, and postpublish readback in the release flow. It remains release history; v0.3.54 has a separate current source-candidate section above.
- official-origin lineage：v0.3.53 has now been regenerated by the official-origin fixture generator from npm package, remote tag, and GitHub Release readback. v0.3.54 must not enter the catalog until it becomes a published source.

### Bilingual README semantic gate（v0.3.53，PASS）

- Reviewer：task `019fa03a-c35a-7433-8370-7af46130e195`；nonce `CER-AHK-R5-BILINGUAL-20260726-01`；fresh independent read-only semantic review.
- `README.md` SHA-256 `148640BE725D330D89D3142B1F15242148C276869E2515A1C123657431AA3AF3`
- `README.en.md` SHA-256 `B44312DBD5B45B7F162168ABFB87424641B1AAEA384C9BC234A313391BF35421`
- Verdict: **PASS** — English preserves the Chinese README purpose, start path, local-folder requirement, startup/closeout behavior, safety boundaries, external-tool ownership, companion-project relationship, navigation and v0.3.53 release-state note.

### Bilingual practical-guide semantic gate（v0.3.53，PASS）

- Reviewer/provenance：task `019fa03a-c35a-7433-8370-7af46130e195`；nonce `CER-AHK-R5-BILINGUAL-20260726-01`.
- `agent-handoff-kit-guide.html` SHA-256 `641711D20D9B77155C7FB167A1E3EE1A2D9073288F99C24D691E199E20F6F925`
- `agent-handoff-kit-guide.en.html` SHA-256 `F4DD68D83501391846B75618283481BF82881533383224EB69399ECE1078F173`
- Verdict: **PASS** — English preserves the three case flows, task-authorization boundary, install/doctor examples, high-risk preview, document bridge, external writes, closeout/readback and v0.3.53 sample/version claims.

### Bilingual AI-install semantic gate（v0.3.53，PASS）

- Reviewer/provenance：task `019fa03a-c35a-7433-8370-7af46130e195`；nonce `CER-AHK-R5-BILINGUAL-20260726-01`.
- `agent-handoff-kit-ai-install.html` SHA-256 `43D80A74AD684CF3E6535CBC5CDD3581CC7D5AC71A2092AC288BFCDA8513AA6D`
- `agent-handoff-kit-ai-install.en.html` SHA-256 `CF33EDE56DD1F4E7A347B18CD547934DBD9E84A6349B1E45203401033EFE3E3A`
- Verdict: **PASS** — English preserves scope, root confirmation, zero-write stop, init/upgrade choice, dry-run, conflict/readback, doctor and v0.3.53 version note.

### Bilingual introduction semantic gate（v0.3.53，PASS）

- Reviewer/provenance：task `019fa03a-c35a-7433-8370-7af46130e195`；nonce `CER-AHK-R5-BILINGUAL-20260726-01`.
- `agent-handoff-kit-intro.html` SHA-256 `63C428AED8E35D95693B6EFFF8AE5ED9548967C977BA7D25F543979F211F1F52`
- `agent-handoff-kit-intro.en.html` SHA-256 `8B4C484A5D6DD0ACFA57615D45E72F20A0C2E08A82EE1A3B64F115D945D54701`
- Verdict: **PASS** — English preserves beginner problem framing, start/closeout model, work-mode and bridge scope, onboarding, safety guardrails, layered files, companion-tool positioning, navigation and v0.3.53 claims.

### Cross-mind evidence 9-trigger table（v0.3.53）

| Trigger | Applies | Status | Notes |
|---|---|---|---|
| 1. Failure or blocker | yes | iterated | Whole-root / generic-reference inventory, recursive doctor discovery, transaction-window drift, obsolete historical witness authority, and startup version spoofing were accepted as product defects to close. |
| 2. External side effects | yes | passed | Release/publish/tag/push completed later in the release flow; v0.3.53 external lineage is now official-origin fixture input. |
| 3. User-visible output | yes | iterated | Upgrade, doctor, and bare startup should stop misreporting ordinary files, hidden version evidence, or transaction drift as safe success. |
| 4. Complexity or boundary | yes | iterated | Scope is limited to typed inventory, transaction preflight parity, historical witness retirement, and one Stack-version parser. |
| 5. Documentation drift | yes | passed | README, active HTML, whatsnew, CHANGELOG and this release QA index were synchronized for v0.3.53 and later superseded by v0.3.54 source-candidate surfaces. |
| 6. Semantic runtime effect | yes | iterated | Runtime authority moves away from root walking and generic text dereference while preserving typed Kit / USER_RULES / transaction / archive fail-closed behavior. |
| 7. Cross-agent / role boundary | yes | passed | R4 source-review acceptance, R5 bilingual evidence, clean commit, full gate, release decision, and postpublish evidence were separated in the release flow. |
| 8. Real user journey | yes | iterated | Existing projects with ordinary docs, outputs, local links, or stale generic witnesses should no longer be blocked by unrelated user-owned files. |
| 9. Release statement | yes | passed | v0.3.53 and v0.3.54 are release history; v0.3.55 is the current unpublished source candidate. |

## v0.3.52 candidate status

- 狀態：clean source-review commit `ed487e1f3ad3b269e7059bb2a35f250e2c6f8c32`，parent `387a0b0968f875c15437822105ebd5261e7fb921`，reviewed tarball SHA-256 `6D28D214F1CAF36D5128A84A73893635AB295453BACB534A0D31CB42A4472735`。範圍只包括 manifest-bound、no-project-content-overwrite 的 `reconcile-current-state` 根修，以及 continuity startup 的可選 display-only 動態 task title。
- 已有組件證據：根修 final reviewer task `019f9628-466c-78d2-bad8-12021cfbede4` PASS；動態標題 reviewer task `019f97cc-5b74-7041-84e8-77532682c8cc`、nonce `AHK-TITLE-REVIEW-20260725-7C4E91B2` PASS。未獲審閱授權的 handshake-only task 不作證據。
- 根修邊界：一個 `reconcile-current-state` 命令、deterministic manifest、verified in-memory plan、zero project-content overwrite，以及 reconciliation command/mode 專用的 readback / no-backup / recovery authority；原 init / upgrade / finalize / doctor / closeout / Gate 5 / archive migration / recovery 契約不得放寬。
- 標題邊界：平台可安全讀回及控制標題時才可使用；只用已載入事實，保留 informative title，不支援時靜默略過。標題不是狀態、進度、健康結果、完成證據或額外授權。
- source-review receipt：reviewer task `019f97f6-5543-7f80-a701-e137f70e3b70`、nonce `AHK-V0352-FINAL-REVIEW-20260725-8D31C6A4` 的整體 verdict 為 **BLOCK**，唯一 blocker 是本文件仍記載未提交 / dirty-state 且缺少下列 v0.3.52 雙語證據；產品邏輯與四組雙語內容沒有 blocker。完成 evidence-only 修補後，必須由同一 reviewer 對新 commit / tarball identity 重綁再裁決。
- 發布邊界：v0.3.51 仍是已發布版本；v0.3.52 尚未完成 `full`、push、tag、GitHub Release、npm publish 或 postpublish，本段不代表整體 review、release-ready 或 release PASS。

### Bilingual README semantic gate（v0.3.52，PASS）

- Reviewer：task `019f97f6-5543-7f80-a701-e137f70e3b70`；nonce `AHK-V0352-FINAL-REVIEW-20260725-8D31C6A4`；範圍為 source-review commit `ed487e1f3ad3b269e7059bb2a35f250e2c6f8c32` 的繁中／英文 README 語意一致性。
- `README.md` SHA-256 `E2B7899B911336547C1DD488DAD3B26E00F4D802CF0A673D7F87A5C2E082B852`
- `README.en.md` SHA-256 `3FF76E1EB9AE47BBC78ADDF0A1810E63EA9D5D97480122938A04480A3F7CA89A`
- Verdict: **PASS** — 兩份 README 對 v0.3.52 的根修、可選 display-only 動態標題及未發布邊界語意一致；此結論只適用於上述 source candidate，不是整體候選或發布 PASS。

### Bilingual practical-guide semantic gate（v0.3.52，PASS）

- Reviewer：task `019f97f6-5543-7f80-a701-e137f70e3b70`；nonce `AHK-V0352-FINAL-REVIEW-20260725-8D31C6A4`；範圍為 source-review commit `ed487e1f3ad3b269e7059bb2a35f250e2c6f8c32` 的繁中／英文 practical guide 語意一致性。
- `agent-handoff-kit-guide.html` SHA-256 `2C9D883810D23001AF62117C1784617390DF75FA4220A3D6E8265B4A41D2C27E`
- `agent-handoff-kit-guide.en.html` SHA-256 `AAE7B26266CD5168C1D7429DA170C6B24DEC589749106E073044221C429802D9`
- Verdict: **PASS** — 兩份 practical guide 對 v0.3.52 功能價值、日常操作與未發布邊界語意一致；此結論只適用於上述 source candidate，不是整體候選或發布 PASS。

### Bilingual AI-install semantic gate（v0.3.52，PASS）

- Reviewer：task `019f97f6-5543-7f80-a701-e137f70e3b70`；nonce `AHK-V0352-FINAL-REVIEW-20260725-8D31C6A4`；範圍為 source-review commit `ed487e1f3ad3b269e7059bb2a35f250e2c6f8c32` 的繁中／英文 AI-install 語意一致性。
- `agent-handoff-kit-ai-install.html` SHA-256 `AE1A3E6F6B9E26358F0DEBD135DB0B47ECF47572ACF860B60C8AE30834554529`
- `agent-handoff-kit-ai-install.en.html` SHA-256 `E82EBC4F59EFCD77F45B343F7C9220562BBDD5707A5B343E44C13969C7636F20`
- Verdict: **PASS** — 兩份 AI-install 頁對 v0.3.52 安裝／升級邊界、根修與可選標題行為語意一致；此結論只適用於上述 source candidate，不是整體候選或發布 PASS。

### Bilingual introduction semantic gate（v0.3.52，PASS）

- Reviewer：task `019f97f6-5543-7f80-a701-e137f70e3b70`；nonce `AHK-V0352-FINAL-REVIEW-20260725-8D31C6A4`；範圍為 source-review commit `ed487e1f3ad3b269e7059bb2a35f250e2c6f8c32` 的繁中／英文 introduction 語意一致性。
- `agent-handoff-kit-intro.html` SHA-256 `D7830497A4AA004DA0E5463E5AB02F8CD58D5D8ACD0FEAD9CF780DC80D1534A9`
- `agent-handoff-kit-intro.en.html` SHA-256 `B9D9C6376B12FE101395647AA5B51707D45D116575C9DD805ED4638160497F4D`
- Verdict: **PASS** — 兩份 introduction 對 v0.3.52 的一屏使用路徑、可選 display-only 標題與未發布邊界語意一致；此結論只適用於上述 source candidate，不是整體候選或發布 PASS。

## v0.3.51 candidate status

- 狀態：本地 source candidate，尚未發布。目標是修補 source-conservation 範圍缺陷：Gate 5 whole-root discovery 保留為唯讀安全證據，但 protected current-state witness 只綁定 known-Kit-reachability / transaction / archive migration / installed contract coverage。普通 user-owned root files 正常變更不得永久 poison `doctor` 或 `closeout-status`；managed-core、rule-pack、formal-route、archive migration 與 closeout state 仍 fail closed。正式 push、tag、GitHub Release、npm publish 後仍須以 registry / release / npx readback 驗證。

### Full-check role isolation（v0.3.51）

- 狀態：SOURCE_REVIEW_PASS_PENDING_FREEZE。source-level candidate 已取得獨立唯讀審閱 PASS；這不是 freeze、full 或 release PASS。正式 `full` gate 必須等 clean commit、獨立 freeze identity review、candidate evidence、獨立 evidence receipt、candidate commit、tarball SHA-256、manifest digest、review bundle SHA-256、review subject digest 和五項結論全部綁定後才可通過。
- 邊界：thread / role 欄位只作 audit provenance，不是密碼學身份證明，也不是 CLI 資料操作信任根。候選凍結後如 tracked candidate 改動，原 review receipt 自動失效。
- Runner 綁定：`full` 會讀取 review bundle JSON，重算 `sha256(JSON.stringify(bundle.reviewSubject))`，並核對 bundle、evidence、receipt 與 clean HEAD 的 candidate、tarball、manifest、inventory、state history 和五項結論一致；bundle + evidence 一起被替換但沿用舊 receipt 時必須 hard fail。
- five-conclusion writer assessment：governanceHealth、productJourney、userJourney、qcBackflow、rulesPacksRouting 目前仍未進入正式 evidence receipt；不得把 source-level PASS 寫成 full PASS。

### Bilingual README semantic gate（v0.3.51，PASS）

- `README.md` SHA-256 `B9396E146B910A31E9F9FEF30BA0BAD9A029C7C3E23582C4587E650DE6A5EAFD`
- `README.en.md` SHA-256 `C1ED4F949D982C1A1ACEF84BF77E6964A3A6E7790E571D3DF05A015B9E0DA49F`
- Verdict: **PASS** — 中英文 README 只同步 source package version 為 v0.3.51；主路徑仍是用戶講目的、AI 判斷 install / upgrade / doctor，不把技術指令推回一般用戶。

### Bilingual practical-guide semantic gate（v0.3.51，PASS）

- `agent-handoff-kit-guide.html` SHA-256 `7F1A962509DB0D5B2008B20C32CC38618A5AAE520134E1FC9BAE6DC063503F12`
- `agent-handoff-kit-guide.en.html` SHA-256 `F609751CEB4A5D6C0A1E3266C95CAA5592B1145B03732417D6CBB6B3EB562326`
- Verdict: **PASS** — 中英文 practical guide 只同步可見版本與示例輸出為 v0.3.51；三個日常情景、新手一屏循環、blocked 說明與治理打通說法沒有新增分歧。

### Bilingual AI-install semantic gate（v0.3.51，PASS）

- `agent-handoff-kit-ai-install.html` SHA-256 `928FDB642B01344A0FD6676DFAEA1AE5139873262031D662F4A26F9701BDFABC`
- `agent-handoff-kit-ai-install.en.html` SHA-256 `0E5AFBBE86B4C8219C0054B3E1F2B6E69D759233DB421477921223B40B7C55FB`
- Verdict: **PASS** — 中英文 AI-install 頁只同步目前 source package version；既有 install / upgrade / doctor 邊界、用戶授權、AI 處理技術步驟與 npm `@latest` readback 邊界沒有新增分歧。

### Bilingual introduction semantic gate（v0.3.51，PASS）

- `agent-handoff-kit-intro.html` SHA-256 `CEACCA7DBAA1E465533F00EBBBBFD7B27DBA39F8DB5CF67DBDF98972FED7ADF0`
- `agent-handoff-kit-intro.en.html` SHA-256 `5B342420F1296CA54E24A804275F93E6C2D82C6D7066B20B1BBCC24AF54EE106`
- Verdict: **PASS** — 中英文 60 秒入門只同步目前版本為 v0.3.51；狀態圖例、一屏開工 / 收工循環、普通 web chat 不適用邊界與安全提示沒有語意改動。

### Bilingual local-workflow case-study semantic gate（v0.3.51，not changed）

- Verdict: **not changed** — 本輪未改此文件對；它不是 source-conservation scope root-fix 的入口。

### Cross-mind evidence 9-trigger table（v0.3.51）

| Trigger | Applies | Status | Notes |
|---|---|---|---|
| 1. Failure or blocker | yes | iterated | Released v0.3.50 can bind ordinary root project files into current-state authority, then later ordinary README / local-file changes become unbound drift. |
| 2. External side effects | yes | deferred | No push, tag, GitHub Release, npm publish, Pages deployment, or real user-project write has been performed. |
| 3. User-visible output | yes | iterated | Runtime behavior changes reduce false blocked states for ordinary project files; public surfaces only update source package version and release notes. |
| 4. Complexity or boundary | yes | iterated | Whole-root evidence, protected source-conservation authority, legacy retirement, replacement coverage, and archive rebind are separated. |
| 5. Documentation drift | yes | iterated | README, active HTML, whatsnew, CHANGELOG and release QA have v0.3.51 source-version surfaces. |
| 6. Semantic runtime effect | yes | iterated | `createSourceConservation`, `findRestoredCurrentStateDigests`, `journalIsRestoredByOutputs`, and rebind coverage now share one bounded retirement rule. |
| 7. Cross-agent / role boundary | yes | iterated | Source-level side PASS is recorded separately from freeze review, evidence receipt, full gate, and release-decision review. |
| 8. Real user journey | yes | iterated | Ordinary user-owned root files may change without permanently poisoning Kit health; managed/formal/rule/archive state remains guarded. |
| 9. Release statement | yes | deferred | Candidate has not been frozen, full-gated, pushed, tagged, released, published, or postpublish-read back. |

## v0.3.50 candidate status

- 狀態：本地 source candidate，尚未發布。目標是修補 closeout / QA runner terminal-state root cause：正式 QA claims 和 release inventory 使用 bounded async runner；timeout、child signal、spawn / transport error、partial PASS、wrapper false-green、Windows command-wrapper shell option 與 WORK high-output pipe drain 均有反例保護。正式 push、tag、GitHub Release、npm publish 後仍須以 registry / release / npx readback 驗證。

### Full-check role isolation（v0.3.50）

- 狀態：REVIEW_BUNDLE_READY。writer 已完成 five-conclusion writer assessment；正式 `full` gate 必須等 clean commit、獨立 read-only reviewer receipt、candidate commit、tarball SHA-256、manifest digest、review bundle SHA-256、review subject digest 和五項結論全部綁定後才可通過。
- 邊界：thread / role 欄位只作 audit provenance，不是密碼學身份證明，也不是 CLI 資料操作信任根。候選凍結後如 tracked candidate 改動，原 review receipt 自動失效。
- Runner 綁定：`full` 會讀取 review bundle JSON，重算 `sha256(JSON.stringify(bundle.reviewSubject))`，並核對 bundle、evidence、receipt 與 clean HEAD 的 candidate、tarball、manifest、inventory、state history 和五項結論一致；bundle + evidence 一起被替換但沿用舊 receipt 時必須 hard fail。
- five-conclusion writer assessment：governanceHealth、productJourney、userJourney、qcBackflow、rulesPacksRouting 均為 writer-observed passed；這不是 independent review verdict，也不是 release-ready statement。

### Bilingual README semantic gate（v0.3.50，PASS）

- `README.md` SHA-256 `A05691B4263A3D9DA77F42D2822A5BCEAB23B3BB88CA9BE08FD79A1BDF98787D`
- `README.en.md` SHA-256 `5563DD41A07000CD146F760044BDB9A90C7AAE7B5847F1BAB6EB20DDC777C747`
- Verdict: **PASS** — 中英文 README 只同步 source package version 為 v0.3.50；主路徑仍是用戶講目的、AI 判斷 install / upgrade / doctor，不把技術指令推回一般用戶。

### Bilingual practical-guide semantic gate（v0.3.50，PASS）

- `agent-handoff-kit-guide.html` SHA-256 `79DCA8105E1A4CC9ECA6AF7DCCCB0C37C8F008C2352FC358067CC76C8B8BAB56`
- `agent-handoff-kit-guide.en.html` SHA-256 `A828CBCC84D789DDB7F48FF7A21FBBF4EB8F1F2A4B8C59CFC2894EE3E6C5129D`
- Verdict: **PASS** — 中英文 practical guide 只同步可見版本與示例輸出為 v0.3.50；三個日常情景、新手一屏循環、blocked 說明與治理打通說法沒有新增分歧。

### Bilingual AI-install semantic gate（v0.3.50，PASS）

- `agent-handoff-kit-ai-install.html` SHA-256 `806F0E0839A762809BE4E355C665F74ADD6E530D11FD3B7DF18B50D89300FAD8`
- `agent-handoff-kit-ai-install.en.html` SHA-256 `D2404ED5E4C330F353565D50269A1E3FC56701F0F783BB99532CD8AE7863390A`
- Verdict: **PASS** — 中英文 AI-install 頁只同步目前 source package version；既有 install / upgrade / doctor 邊界、用戶授權、AI 處理技術步驟與 npm `@latest` readback 邊界沒有新增分歧。

### Bilingual introduction semantic gate（v0.3.50，PASS）

- `agent-handoff-kit-intro.html` SHA-256 `1BD8D798E9879B58E75BAE1259DC6020D0AD5B17928EF0C52DCE4B6A93086530`
- `agent-handoff-kit-intro.en.html` SHA-256 `BF8679CF2BF6A40F50F0A5B4275AC1331B6021C3FA0DAB8FF49B36BCA5969A1F`
- Verdict: **PASS** — 中英文 60 秒入門只同步目前版本為 v0.3.50；狀態圖例、一屏開工 / 收工循環、普通 web chat 不適用邊界與安全提示沒有語意改動。

### Bilingual local-workflow case-study semantic gate（v0.3.50，not changed）

- Verdict: **not changed** — 本輪未改此文件對；它不是 closeout / QA runner terminal-state root-fix 的入口。

### Cross-mind evidence 9-trigger table（v0.3.50）

| Trigger | Applies | Status | Notes |
|---|---|---|---|
| 1. Failure or blocker | yes | iterated | Real runner blocker showed stopped / aborted / timeout / spawn-error / wrapper false-green could be misclassified or hang. |
| 2. External side effects | yes | deferred | No push, tag, GitHub Release, npm publish, Pages deployment, or real user-project write has been performed. |
| 3. User-visible output | yes | iterated | Runtime closeout wording changes are AI-facing; public user surfaces only update source package version and release notes. |
| 4. Complexity or boundary | yes | iterated | Timeout, child signal, spawn-error, shell option propagation, wrapper exit propagation, and differential closeout are separated. |
| 5. Documentation drift | yes | iterated | README, active HTML, whatsnew, CHANGELOG and release QA have v0.3.50 source-version surfaces. |
| 6. Semantic runtime effect | yes | iterated | `qa.mjs` formal claims and release inventory now use bounded async execution rather than sync timeout. |
| 7. Cross-agent / role boundary | yes | iterated | Writer source freeze and independent reviewer receipt remain separate; source-level PASS is not release PASS. |
| 8. Real user journey | yes | iterated | Users should see fewer stuck or false-green closeout / QA outcomes; blocked or indeterminate operations remain explicit. |
| 9. Release statement | yes | deferred | Candidate has not been pushed, tagged, released, published, or postpublish-read back. |

## v0.3.49 candidate status

- 狀態：本地 source candidate，尚未發布。目標是把 conflict / blocker 的用戶路徑收口：unknown local hash 只作 witness；用戶只確認需求與授權；能讀寫資料夾的 AI 做語意合併；Kit 以 `upgrade --dry-run`、`doctor` 與 hash / readback 驗收。正式 push、tag、GitHub Release、npm publish 後仍須以 registry / release / npx readback 驗證。

### Full-check role isolation（v0.3.49）

- 狀態：WAITING_INDEPENDENT_REVIEW。writer 已完成 five-conclusion writer assessment；正式 `full` gate 必須等 clean commit、獨立 read-only reviewer receipt、candidate commit、tarball SHA-256、manifest digest、review bundle SHA-256、review subject digest 和五項結論全部綁定後才可通過。
- 邊界：thread / role 欄位只作 audit provenance，不是密碼學身份證明，也不是 CLI 資料操作信任根。候選凍結後如 tracked candidate 改動，原 review receipt 自動失效。
- Runner 綁定：`full` 會讀取 review bundle JSON，重算 `sha256(JSON.stringify(bundle.reviewSubject))`，並核對 bundle、evidence、receipt 與 clean HEAD 的 candidate、tarball、manifest、inventory、state history 和五項結論一致；bundle + evidence 一起被替換但沿用舊 receipt 時必須 hard fail。
- 五項 writer assessment：governanceHealth、productJourney、userJourney、qcBackflow、rulesPacksRouting 均為 writer-observed passed；這不是 independent review verdict，也不是 release-ready statement。

### Bilingual README semantic gate（v0.3.49，PASS）

- `README.md` SHA-256 `1AB155203249EFA5B84A79A3404F20A448AED98B5B1554534804995EF1E96A9B`
- `README.en.md` SHA-256 `216F439172BEE6DB817F0AF939912A04DE5D0FE7306448ACE1F0631F04A84128`
- Verdict: **PASS** — 中英文 README 只同步 source package version 為 v0.3.49；主路徑仍是用戶講目的、AI 判斷 install / upgrade / doctor，不把技術指令推回一般用戶。

### Bilingual practical-guide semantic gate（v0.3.49，PASS）

- `agent-handoff-kit-guide.html` SHA-256 `F5C7D1255FDFFC8A948FA038E8FF488F6E2BE359231ABB6BF561E0A5752F124C`
- `agent-handoff-kit-guide.en.html` SHA-256 `6EF1CC49FB9B05ACC2BE69810921FAC53D980E52890723E3E9FA0B210EB3F191`
- Verdict: **PASS** — 中英文 practical guide 只同步可見版本與示例輸出為 v0.3.49；三個日常情景、新手一屏循環、blocked 說明與治理打通說法沒有新增分歧。

### Bilingual AI-install semantic gate（v0.3.49，PASS）

- `agent-handoff-kit-ai-install.html` SHA-256 `B78DD611DA1AE947BA873E4BA09CF8D548A4B87F453AF61C5C7B89A897ACEE08`
- `agent-handoff-kit-ai-install.en.html` SHA-256 `FE4D64321A65A9B1ADB97A8502BA5075BBD197B08B24A8B00FD7C2D1D421AAF5`
- Verdict: **PASS** — 中英文 AI-install 頁的 conflict 路徑對齊：非技術用戶只確認需求與授權；能讀寫資料夾的 AI 做語意合併；未知本地 hash 只作 witness；合併後由 `upgrade --dry-run`、`doctor` 與 hash / readback 驗收；maintainer 回報只限未改動正式舊檔被 Kit 誤判。

### Bilingual introduction semantic gate（v0.3.49，PASS）

- `agent-handoff-kit-intro.html` SHA-256 `A4BC3D61D4837C286D4B43DD5CEB93DC67FDB397C8D4E6B49EEBA7ED08A0AE3D`
- `agent-handoff-kit-intro.en.html` SHA-256 `600353C6E4934BD4A736FB351AD5544BE3A2BC9C81B74883E91CE0D5011F0DCE`
- Verdict: **PASS** — 中英文 60 秒入門只同步目前版本為 v0.3.49；貓貓狀態圖例、一屏開工 / 收工循環、普通 web chat 不適用邊界與安全提示沒有語意改動。

### Bilingual local-workflow case-study semantic gate（v0.3.49，not changed）

- Verdict: **not changed** — 本輪未改此文件對；它不是 conflict-role guidance 的入口。

### Cross-mind evidence 9-trigger table（v0.3.49）

| Trigger | Applies | Status | Notes |
|---|---|---|---|
| 1. Failure or blocker | yes | iterated | Real user conflict case showed maintainer local-content support is the wrong product route. |
| 2. External side effects | yes | deferred | No push, tag, GitHub Release, npm publish, Pages deployment, or real user-project write has been performed. |
| 3. User-visible output | yes | iterated | CLI and AI-install pages now tell users not to judge technical differences, reinstall, or overwrite whole files. |
| 4. Complexity or boundary | yes | iterated | Hash / doctor / semantic understanding are separated; maintainer involvement is only baseline misclassification evidence. |
| 5. Documentation drift | yes | iterated | README, active HTML, whatsnew, CHANGELOG and release QA have v0.3.49 source-version surfaces. |
| 6. Semantic runtime effect | yes | iterated | `qa:upgrade`, release-readiness inventory and packed smoke remain under clean-candidate writer QC; independent reviewer receipt is still separate. |
| 7. Cross-agent / role boundary | yes | iterated | User / project AI / Kit / maintainer roles are separated; future validation should keep writer and reviewer roles isolated. |
| 8. Real user journey | yes | iterated | Nontechnical user authorizes repair; project AI merges; Kit validates by dry-run, doctor, and hash / readback. |
| 9. Release statement | yes | deferred | Candidate has not been pushed, tagged, released, published, or postpublish-read back. |

## v0.3.48 發佈狀態

- 狀態：candidate source prepared。本版修補 v0.3.47 發佈後發現的 legacy lowercase archive path 升級阻塞，並把 QA/QC claim membership 與 release-readiness full-suite inventory 收斂到 manifest owner。GitHub Release 與 npm `@latest` 只能由發佈後讀回確認，不能由 source 文案預先宣稱。
- 範圍：upgrade transaction 內的 archive casing migration、rollback / recovery / retry、packed-candidate post-upgrade closeout finalize QA、QA manifest entry point；不放寬 rule pack conflict、不把非收工漂移納入 finalize、不改外部工具 cleanup 承諾。
- 第一段限制：本節是 candidate-prep evidence；pre-release Terra audit、clean-HEAD full readiness、tag、GitHub Release、npm publish 與 postpublish readback 仍 pending。

### Bilingual README semantic gate（v0.3.48，PASS）

- `README.md` SHA-256 `40039B625D44B311165A88CD3364F1E5AE6516080607110E200810D22CDCC047`
- `README.en.md` SHA-256 `D27CA72E180F3E3D073AF24F73D0EE427E7CDEF6A5A5901BA9850EF8C0DD9947`
- Verdict: **PASS** — 中英文 README 只同步 source package version 為 v0.3.48，並保留 npm / GitHub 狀態要靠 postpublish readback；新手三步、AI 代判斷 install / upgrade / doctor、狀態卡與安全邊界沒有語意改動。

### Bilingual practical-guide semantic gate（v0.3.48，PASS）

- `agent-handoff-kit-guide.html` SHA-256 `1F0E4EE12BD722E9ADB5A1DA0617A85E1EF07A530FE3573A9A1A3409DD3F42E3`
- `agent-handoff-kit-guide.en.html` SHA-256 `C615BED6F197D01ACE8EEFA10D17CBDC0C8A3B08AB014A5A6DF68AA7418632A6`
- Verdict: **PASS** — 中英文 practical guide 只同步可見版本與示例輸出為 v0.3.48；三個日常情景、新手一屏循環、blocked 人話說明與治理打通說法沒有新增分歧。

### Bilingual AI-install semantic gate（v0.3.48，PASS）

- `agent-handoff-kit-ai-install.html` SHA-256 `1C23E299BA3105F498C74B7233EC729FA1E6BB4427284512717C25C540F18AAF`
- `agent-handoff-kit-ai-install.en.html` SHA-256 `CF98793E6286B0AD1A559EEA812AEBCDAA0043A6FD457BF28C077B0AAA802E44`
- Verdict: **PASS** — 中英文 AI-install 頁只同步可見版本為 v0.3.48；確認資料夾、fresh init / upgrade dry-run / upgrade / doctor / conflict stop / completion report 的路徑未改。

### Bilingual introduction semantic gate（v0.3.48，PASS）

- `agent-handoff-kit-intro.html` SHA-256 `4A5FF9F99B42AD72DFCE859876F0E195A5B26B786C48D8BF81592B2101406E56`
- `agent-handoff-kit-intro.en.html` SHA-256 `1FDD1208D4EB21FDA6C2DB9649B25BD4C5A7EE9E341E69CEE9BF4818E925E559`
- Verdict: **PASS** — 中英文 60 秒入門只同步目前版本為 v0.3.48；貓貓狀態圖例、一屏開工 / 收工循環、普通 web chat 不適用邊界與安全提示沒有語意改動。

### Bilingual local-workflow case-study semantic gate（v0.3.48，not changed）

- Verdict: **not changed** — 本輪未改此文件對；它不是 legacy archive casing migration root-fix 的入口。

### Cross-mind evidence 9-trigger table（v0.3.48）

| Trigger | Applied? | Outcome | Evidence |
|---|---:|---|---|
| 1. Failure or blocker | yes | iterated | 真實 v0.3.45 runtime 升級到 v0.3.47 時，dry-run conflict 0，但正式 upgrade 在 post-transaction doctor 因 `dev/session_log_archive` / `dev/SESSION_LOG_archive` casing mismatch rollback。 |
| 2. User correction | yes | iterated | Adam 指出上版分析、判斷、QC 分層和相鄰缺口覆蓋不足；本版退一步修補底層 QC 分層和 upgrade transaction。 |
| 3. User-visible output | yes | iterated | 成功升級後仍維持既有 concise upgrade output；ambiguous archive layout 和 rule conflict 仍 safe stop。 |
| 4. Runtime/package behavior | yes | iterated | `bin/agent-handoff-kit.mjs` 在 upgrade transaction 內準備、套用、rollback、recover archive casing migration。 |
| 5. Documentation drift | yes | iterated | README、README.en、HTML active pages、whatsnew、CHANGELOG 與 release QA 均同步到 v0.3.48，且不再把 source version 預宣稱為 GitHub / npm 已發佈狀態。 |
| 6. Test gap | yes | iterated | 新增 manifest-owned QA entry point，並把 official-catalog-pinned published v0.3.41 -> published v0.3.45 產生的 accepted current-state witness + nested legacy lowercase archive 相鄰組合接入 post-upgrade closeout finalize QA。 |
| 7. External-tool cleanup boundary | yes | passed | 本版不重開 AI 自動 terminate Node / MCP / browser 等承諾；仍只處理 Kit 自身檔案 transaction。 |
| 8. Adjacent workflow coverage | yes | iterated | 覆蓋 packed candidate、published-lineage prior state、legacy archive casing、nested archive tree、rollback、pre-durable interruption recovery 和 idempotent re-upgrade。 |
| 9. Release statement | yes | pending | v0.3.48 仍需 clean-HEAD full readiness、Terra pre-release audit、正式 publish 後 npm / GitHub / npx readback。 |

## v0.3.47 發佈狀態

- 狀態：正式發佈版本。本版補上 upgrade 後正常 closeout 的合法補綁路徑，避免「升級當下健康，但之後正常收工必然撞 Gate 5 witness」的流程缺口。GitHub Release 與 npm `@latest` 應以 v0.3.47 為準。
- 範圍：runtime closeout-state witness root-fix、archive path casing guard、release gate 相鄰流程覆蓋；不重開外部工具自動 terminate / cleanup，不放寬普通非收工檔案漂移。

### Bilingual README semantic gate（v0.3.47，PASS）

- `README.md` SHA-256 `F6EF2AE0D3C65A32BC2AEC2A8723A476431DA67A3B9D124FFF6CD9BB14F14BD3`
- `README.en.md` SHA-256 `EF9170389C3FBA2EF4110E139097C5FD565D71DFCA8713740CF07DB3E59755F7`
- Verdict: **PASS** — 中英文 README 只同步目前正式版本為 v0.3.47；新手狀態圖例、日常開工 / 收工、AI 代判斷 install / upgrade / doctor、資料保護與外部工具邊界沒有語意改動。

### Bilingual practical-guide semantic gate（v0.3.47，PASS）

- `agent-handoff-kit-guide.html` SHA-256 `56B7D7DD7B77B0590CFA42FCE5A363D0EE25D674277FF828DA67B4798511E759`
- `agent-handoff-kit-guide.en.html` SHA-256 `8F3FA3D92587905499971DDC767BDD05DFD378ED7984AEE92C1272B0E85D60B1`
- Verdict: **PASS** — 中英文 practical guide 只同步頁面可見版本與示例輸出為 v0.3.47；三個日常情景、新手一屏循環、blocked 人話說明與治理打通說法沒有新增分歧。

### Bilingual AI-install semantic gate（v0.3.47，PASS）

- `agent-handoff-kit-ai-install.html` SHA-256 `4AA8D6EC52CED069726D4A7D1C71EC978A6A55A53326F01629BBF76E5AD2D0C5`
- `agent-handoff-kit-ai-install.en.html` SHA-256 `948E08451C5AD8036BDCC135F327225DE4D7C0198B508DB03CD394C76C3BAF24`
- Verdict: **PASS** — 中英文 AI-install 頁只同步可見版本為 v0.3.47；確認資料夾、fresh init / upgrade dry-run / upgrade / doctor / conflict stop / completion report 的路徑未改。

### Bilingual introduction semantic gate（v0.3.47，PASS）

- `agent-handoff-kit-intro.html` SHA-256 `53F1687F8F1FB130C1EF8BBFDF57EEC0B77EF10220CDCC4C993B4311E70FC69C`
- `agent-handoff-kit-intro.en.html` SHA-256 `8E4585BAC28A524690850418228762E97AD458C49D5A80A4DD425EF7C78ABE92`
- Verdict: **PASS** — 中英文 60 秒入門只同步目前版本為 v0.3.47；貓貓狀態圖例、一屏開工 / 收工循環、普通 web chat 不適用邊界與安全提示沒有語意改動。

### Bilingual local-workflow case-study semantic gate（v0.3.47，not changed）

- Verdict: **not changed** — 本輪未改此文件對；它不是 post-upgrade closeout finalize root-fix 的入口。

### Cross-mind evidence 9-trigger table（v0.3.47）

| Trigger | Applied? | Outcome | Evidence |
|---|---:|---|---|
| 1. Failure or blocker | yes | iterated | 真實 v0.3.45 升級流程指出：upgrade seal current-state bytes 後，正常 closeout 修改 handoff / log / prompt 會令 Gate 5 witness mismatch。 |
| 2. User correction | yes | iterated | Adam 要求先紅測試、後 runtime 修補、完整 QA、再 patch release；本版按此順序處理。 |
| 3. User-visible output | yes | iterated | CLI help 新增 `finalize-closeout`；blocked 狀態仍不被誤報為完成。 |
| 4. Runtime/package behavior | yes | iterated | `bin/agent-handoff-kit.mjs` 新增合法 closeout-state finalize path，會進入 npm package。 |
| 5. Documentation drift | yes | iterated | README、README.en、HTML active pages、whatsnew、CHANGELOG 與 release QA 均同步到 v0.3.47。 |
| 6. Test gap | yes | iterated | 新增 `check-post-upgrade-closeout-finalize.mjs`，並接入 `check-release-readiness.mjs`。 |
| 7. External-tool cleanup boundary | yes | passed | 本版不重開 AI 自動 terminate Node / MCP / browser 等承諾，只處理 Kit 自身 closeout witness。 |
| 8. Adjacent workflow coverage | yes | iterated | 測試由已發布上一版 init，升到當前版本，模擬正常 closeout，要求 finalize 後 doctor / closeout-status 通過。 |
| 9. Release statement | yes | iterated | v0.3.47 應以 commit / tag / GitHub Release / npm publish 後讀回為準；本節記錄發佈前 root-fix 證據。 |

## v0.3.46 發佈狀態

- 狀態：正式發佈版本。本版把 v0.3.45 已完成的 GitHub Pages 新手狀態 UX 補到實際安裝套件：`closeout-status` blocked 卡、`packs/closeout.md`、README / README.en 與發佈檢查同時對齊。GitHub Release 與 npm `@latest` 應以 v0.3.46 為準。
- 範圍：小型 UX / packaging coherence root-fix；不重開外部工具自動 terminate / cleanup，不改 runtime 行為到程序管理層。

### Bilingual README semantic gate（v0.3.46，PASS）

- `README.md` SHA-256 `D3DB29F6E6564092AC74B7D9224B2B22618FC553177A054E92FA589F04DDC830`
- `README.en.md` SHA-256 `4C1F5296CF38642BEC99DD84B9573CC942333471A6294FE6CE2412E366E7E0AF`
- Verdict: **PASS** — 中英文 README 均由 v0.3.45 更新為 v0.3.46，並加入同等的貓貓狀態圖例：`continuity ready` 代表可以接力，`handoff saved` 代表已收工保存，`handoff blocked` 代表仍有未保存、未提交、未驗證或待處理事項。中文保留日常人話；英文保留同等意思與下一步，不新增終端機主路徑。

### Bilingual practical-guide semantic gate（v0.3.46，PASS）

- `agent-handoff-kit-guide.html` SHA-256 `1E865A171AC93D5C7A5AC1C159A143814F044E0EC137B0BC794399BBD11708C0`
- `agent-handoff-kit-guide.en.html` SHA-256 `CC4C5D186D420D0C04DCD53D21C2926163327C26216EDCDE97AF86AC7C45BD4C`
- Verdict: **PASS** — 本輪只把中英文 practical guide 的可見版本由 v0.3.45 更新為 v0.3.46；新手一屏循環與 blocked 人話說明沿用 v0.3.45 Pages 修補，語意無新增分歧。

### Bilingual AI-install semantic gate（conflict-role update，PASS）

- `agent-handoff-kit-ai-install.html` SHA-256 `D43B143F7A9FE351A461E8C30FBAE4E3EA055FE9B842E4B1A24BE57A9CD2160A`
- `agent-handoff-kit-ai-install.en.html` SHA-256 `29BF357539E3C9BFE6E981A60C5A1AA910ECABFAB471C6C80E86701E14051502`
- Verdict: **PASS** — 本輪把中英文 AI-install 頁的 conflict 路徑對齊：非技術用戶只確認需求與授權；能讀寫資料夾的 AI 做語意合併；未知本地 hash 只作 witness；合併後由 `upgrade --dry-run`、`doctor` 與 hash / readback 驗收；maintainer 回報只限未改動正式舊檔被 Kit 誤判。

### Bilingual introduction semantic gate（v0.3.46，PASS）

- `agent-handoff-kit-intro.html` SHA-256 `6746BD7E655A39B16F6C7424A60E0066B7EAC68E607E98EF5B6DBEBEB4074903`
- `agent-handoff-kit-intro.en.html` SHA-256 `2B791BB81A8F9A33A1C297FF835E2119FF57D699D83CCBD1F540BDD06EC90B2B`
- Verdict: **PASS** — 本輪只把中英文 60 秒入門可見版本由 v0.3.45 更新為 v0.3.46；貓貓狀態圖例與一屏開工 / 收工循環維持中英文同等表達。

### Bilingual local-workflow case-study semantic gate（v0.3.46，not changed）

- Verdict: **not changed** — 本輪未改此文件對；它不是 v0.3.46 runtime blocked-card root-fix 的入口。

### Cross-mind evidence 9-trigger table（v0.3.46）

| Trigger | Applied? | Outcome | Evidence |
|---|---:|---|---|
| 1. Failure or blocker | yes | iterated | 發現 v0.3.45 Pages 已有新手狀態 UX，但 npm 安裝後的 `closeout-status` blocked 卡仍只顯示技術式 blocker，未有 Adam 批准的人話下一步。 |
| 2. User correction | yes | iterated | Adam 指出應做完整 root-fix，而不是 quick fix；本版把修補落到 runtime / pack / npm README / release gate。 |
| 3. User-visible output | yes | iterated | `closeout-status` blocked 卡新增人話說明，README / README.en 新增狀態卡圖例。 |
| 4. Runtime/package behavior | yes | iterated | npm 會帶入 `bin/agent-handoff-kit.mjs` 與 `packs/closeout.md`，新安裝或升級後可用。 |
| 5. Documentation drift | yes | iterated | GitHub Pages、README、README.en、whatsnew、CHANGELOG 與版本字眼同步到 v0.3.46。 |
| 6. Test gap | yes | iterated | `check-closeout-card-contract.mjs` 新增 blocked 人話提示檢查。 |
| 7. External-tool cleanup boundary | yes | passed | 本版不重開 AI 自動 terminate Node / MCP / browser 等承諾；仍維持 ownership-based report / close boundary。 |
| 8. Local source / public source order | yes | iterated | 先在本機 public main 對齊並修改，再提交、推送、發佈；舊 dirty 狀態已封存在 backup 分支。 |
| 9. Release statement | yes | iterated | v0.3.46 應以 commit / tag / GitHub Release / npm publish 後讀回為準；本節記錄發佈前 root-fix 證據。 |

## v0.3.45 發佈狀態

- 狀態：本地 release-state hotfix candidate。此候選修正 v0.3.44 發佈後 active public surfaces 仍自稱 candidate／尚未發佈／npm latest v0.3.43 的假綠；正式 push、tag、GitHub Release、npm publish 後仍須以 registry / release / GitHub Pages readback 驗證 v0.3.45。
- 核心產品行為：不改 R-034 upgrade、資料保護、user-rule reader、transaction/current-state witness 或 recovery；只改公開版本狀態文字、版本號、版本頁、發佈狀態 QC。
- QC 根因修補：`scripts/check-release-readiness.mjs` 新增 release-state coherence gate。它只檢查 active public surfaces（README、英文 README、whatsnew index、公開 HTML、CHANGELOG 最新狀態），不掃歷史段落，不把「掃描候選文件」等正常產品語義誤判為 release drift。
- 發佈前／發佈後分界：候選狀態只可存在於本 QA owner 或 full-audit evidence；會進入 npm README、GitHub README、GitHub Pages 或版本索引的 active surface 必須以目前 release 版本呈現，不得再寫「尚未發佈」或上一版 latest。

### Bilingual README semantic gate（v0.3.45，PASS）

- 中文唯一準則：`README.md` SHA-256 `51FF5EE9F6C2396BBCAEB37A7F5C7438C16F358EB6D100E23E3973AF173B33DD`
- 本次英文讀回：`README.en.md` SHA-256 `109304D1D243AABC7AAF58870699CDF87619573E9828718DA486FD6D1CB93CF4`
- Verdict: **PASS** — 本輪只改版本狀態行。中英文均由「候選／上一版 latest」改為目前正式版本 v0.3.45，沒有改變 README 的安裝、升級、AI 代安裝、資料保護、startup / closeout 或安全邊界語意。

### Bilingual practical-guide semantic gate（v0.3.45，PASS）

- 中文唯一準則：`agent-handoff-kit-guide.html` SHA-256 `B4275D047200DBA04210E96F7656E6457F553DD4B4B15069F567C35BB1946A16`
- 本次英文讀回：`agent-handoff-kit-guide.en.html` SHA-256 `63308E0F49303E6564E679010510C061DCB328B6C97238D58073891B27FC5CCA`
- Verdict: **PASS** — 本輪在中英文 practical guide 頂部加入同等的新手一屏循環：安裝完成 / Install complete → 開工 / Start → AI 繼續做事 / continues work → 收工 / Closeout → 下次再開工 / Next time say Start；並集中列明 `( o.o ) continuity ready`、`( -.- ) handoff saved`、`( x.x ) handoff blocked`。blocked 文案均說明這不是壞了，而是仍有未保存、未提交、未驗證或待處理事項，要先照 Blocker 行處理。A/B/C 案例正文、外部確認、Notion/Drive、本機 reference、startup/closeout 分界與導航沒有語意改動。

### Bilingual AI-install semantic gate（v0.3.45，PASS）

- 中文唯一準則：`agent-handoff-kit-ai-install.html` SHA-256 `1B54EE2BA5CED25528AE6A635BD525FCB04FDD0C5910A1E74BA5E5CCAA0FD607`
- 本次英文讀回：`agent-handoff-kit-ai-install.en.html` SHA-256 `BE339F163A52E18EC97E7D85963F74A65CA8BB4B1E0D6BAC7485DC5AD1D355EB`
- Verdict: **PASS** — 本輪只改頁面版本提示與 kicker。AI 必須先確認資料夾、fresh init / upgrade dry-run / upgrade / doctor / conflict stop / completion report 的流程沒有改動。

### Bilingual introduction semantic gate（v0.3.45，PASS）

- 中文唯一準則：`agent-handoff-kit-intro.html` SHA-256 `398B9A1DCF5CEF3BF59EC2D9B0BD41A44494A6F30AAA6F65647FABC2EED130B2`
- 本次英文讀回：`agent-handoff-kit-intro.en.html` SHA-256 `D76A0CCCFE221A91A776391AF1AD316DDBD528174C7D9C5B3574DC018A329719`
- Verdict: **PASS** — 本輪在中英文 60 秒入門的開工 / 收工段加入同等的新手一屏循環與貓貓狀態圖例：`continuity ready` 代表可以接力，`handoff saved` 代表已收工保存，`handoff blocked` 代表仍有未保存、未提交、未驗證或待處理事項，先照 Blocker 行處理，不應當作已完成交接。pain grid、modes、governance bridge、safety、tiers、recap 與 footer 導航沒有語意改動。

### Bilingual local-workflow case-study semantic gate（v0.3.45，not changed）

- 中文唯一準則：`local-agentic-ai-workflow-case-study.html` SHA-256 `B96A0EB58F5C3596567FBA75CD41DBA32CEC14FD46F6241900AB48D8F10DF779`
- 本次英文讀回：`local-agentic-ai-workflow-case-study.en.html` SHA-256 `777C57B67711F4DF145BF8EC40F3BC1B3AE82FFE58FD4DBF2FCF905512B03870`
- 中文資訊圖：`images/local-agentic-ai-workflow-blueprint.png` SHA-256 `BAC9FB0E4F08BFA7B9954DFD4593825240934FBB67962EFE1220EBE93B57EFE8`
- 英文資訊圖：`images/local-agentic-ai-workflow-blueprint.en.png` SHA-256 `99FAE71B9AF5698797B81AE87ADFC641FECB4177764CA94BC27F1E676B24E6BA`
- Verdict: **not changed** — 本輪未改此文件對；保留 v0.3.44 的逐段語意／視覺讀回結論。

### Cross-mind evidence 9-trigger table（v0.3.45）

| Trigger | Hit? | Decision | Evidence |
|---|---:|---|---|
| 1. Failure or blocker | yes | iterated | Adam 發現 v0.3.44 發佈後 README 仍寫「尚未發佈／正式可用 v0.3.43」；同類漂移也出現在 README.en、CHANGELOG、whatsnew index 與 HTML 版本提示。 |
| 2. External side effects | yes | iterated | 本地候選不改外部狀態；正式 push、tag、GitHub Release、npm publish 後必須做 registry / pages readback。 |
| 3. User-visible output | yes | iterated | Active public surfaces 改為 v0.3.45 release wording；候選狀態只留在 QA evidence，不再進 README / HTML / npm README。 |
| 4. Complexity or boundary | yes | passed | 不改 R-034、upgrade、reader、transaction 或 package file boundary；只修 release-state surface 與 QC gate。 |
| 5. Security or data preservation | no | passed | 本輪不改使用者專案資料、不改 migration behavior；既有資料保護 gate 仍由 release readiness 實跑。 |
| 6. Semantic runtime effect | no | passed | Runtime behavior 不變；仍由既有 release readiness、packed smoke 和 post-publish smoke 承接。 |
| 7. Historical upgrade path | no | passed | 不新增歷史矩陣；既有 v0.3.41 direct-AGENTS journey 在發佈前後 smoke 中保留。 |
| 8. Real user journey | yes | iterated | 使用者入口不再同時叫自己 candidate 與 latest release；發佈後可見狀態要與 GitHub Release / npm latest 一致。 |
| 9. Release statement | yes | iterated | 新 release-state coherence gate 會阻擋 active surface 殘留 `Current source candidate`、`目前候選版本`、`尚未發佈`、`vX candidate` 或上一版 latest。 |

## v0.3.44 發佈狀態

- 狀態：已發佈，後續由 v0.3.45 修正其 active public surfaces 仍顯示候選／未發佈的狀態漂移。本節以下保留 v0.3.44 發佈前候選證據；不得再用它代表目前最新 public surface 狀態。
- 英文 README、入門、實操指南、AI 安裝頁及本機工作系統案例以繁體中文來源為唯一內容準則；保留相同的日常開始／工作／收工流程、使用情景、資料安全邊界、AI 安裝路徑、案例與導航。案例頁的英文資訊圖亦須保留同一資訊層級；不是只保留一條語言連結。
- **Bilingual public docs status：PASS；release readiness：PASS for local candidate。** 先前的整體翻譯 PASS 不能成立；本候選改為逐個變更文件對收口。`README.en.md`、`agent-handoff-kit-intro.en.html`、`agent-handoff-kit-guide.en.html`、`agent-handoff-kit-ai-install.en.html` 與 `local-agentic-ai-workflow-case-study.en.html` 均已完成本輪獨立語意／視覺讀回並記錄新 hash。此 PASS 代表英文公開文件已按中文來源對齊，且 clean checkout 的 release readiness、R-034、official-origin catalog、upgrade safety、packed install/upgrade/doctor 均通過；實際公開發佈尚未執行。
- 翻譯覆核是**變更觸發**，不是每次發佈的常駐 ritual：只要候選改動中文來源、英文對應頁或對應圖像，該文件對就必須以中文全文重新做獨立語意及視覺讀回；未改動的文件對不需因其他版本重做。hash 只在覆核通過後防止內容漂移，不能取代覆核。
- 本節與 `full-audit-v0.3.44-candidate.md` 同屬 v0.3.44 候選證據；hash evidence 防止已通過的翻譯內容漂移，但不取代語意覆核。候選可稱為本地 release-ready；push、tag、GitHub Release、npm publish 仍是尚未執行的外部寫入步驟。

### Bilingual README semantic gate（v0.3.44，PASS）

- 中文唯一準則：`README.md` SHA-256 `FDD11C8EF04B794742179A9C5376FDDED6F3B557FA5FAB014617E58458FE7FE1`
- 本次英文讀回：`README.en.md` SHA-256 `57BBBE161FF002C94DCCC90D3EB120C81DFFF247846359BB47D9265D36CD625F`
- Verdict: **PASS** — 未參與翻譯的 reviewer 確認英文 README 補回中文版關鍵承諾：日常 startup 讀 `dev/SESSION_HANDOFF.md` 且同一資料夾不重讀 `START_NEXT_SESSION_PROMPT.txt` / `dev/SESSION_LOG.md`；Antigravity CLI 的 `AGENTS.md` / `GEMINI.md` 路由；自然語言任務由 AI 自行判斷需讀的 handoff / rules / index，長期規則必須寫入適當項目文件而非只留聊天摘要；system root path、force-push 與 affected refs 的安全護欄；Adam-AI-Instructions 的共同安全底線、非父子真源及不可合併界線。中英文入口連結有對應檔案，未見阻擋項。

### Bilingual practical-guide semantic gate（v0.3.44，PASS）

- 中文唯一準則：`agent-handoff-kit-guide.html` SHA-256 `64479BC21F6FBCEBC37898A3141D080E015E3756190CC175E05F96F964D5E025`
- 本次英文讀回：`agent-handoff-kit-guide.en.html` SHA-256 `8A840C6BDB0817745DF3F93C41A27381F520D81D2CC8411479663DA4A9B89482`
- Verdict: **PASS** — 中文來源已同步至 strict bare-start contract：單獨 `Start Agent Handoff`／「開工」只讀最低必要狀態、顯示狀態／風險／建議下一步後等待；同一句或下一句有明確任務才開始工作。guide 亦明示第一次安裝只令新手引導可用，目標清楚就直接開始，仍無目標才提供引導或短問題。英文頁以中文版為唯一來源重建並完成兩輪獨立 targeted reviewer 讀回：21 個 section、A/B/C 案例順序、Case B Step 02/03 的完整 café 任務、30+ Notion reference／本機 `reference/`／`report/`／Drive 分享授權、Step 07 的計劃確認鏈、footer 導航／版本／作者資訊均對齊。機械核對：中英文 section id 無重複、link count 均為 29、`git diff --check` 退出碼 0（只有 CRLF 提示）。

### Bilingual AI-install semantic gate（v0.3.44，PASS）

- 中文唯一準則：`agent-handoff-kit-ai-install.html` SHA-256 `2FFE57FCB34536CCEEF50D4E73CD429D8F2E792C5751884FD0EF76C1B1A52F2E`
- 本次英文讀回：`agent-handoff-kit-ai-install.en.html` SHA-256 `FCE39CE87DFA8C99BC2A2CE52CF17EF0CFA39DF23731D0C7507C3435B2061E5A`
- Verdict: **PASS** — 未參與翻譯的 reviewer 確認英文頁保留中文版完整安裝／升級安全旅程：用戶只需貼一條請 AI 讀頁；AI 完成後必須交代結果、絕對路徑、doctor 狀態與 AI 對話下一步；未確認資料夾即零寫入；fresh init、existing state 先 `upgrade --dry-run`、無 conflict 才 `upgrade --yes`、有 conflict 停手核對版本／transaction／diff；doctor fail 停，prompt mirror lag 不重裝；`Start Agent Handoff`／「開工」明確屬 AI 對話而非 terminal。中英文互連、GitHub／README 導航與視覺結構沒有發現誤導性缺失。

### Bilingual introduction semantic gate（v0.3.44，PASS）

- 中文唯一準則：`agent-handoff-kit-intro.html` SHA-256 `01D68048A295AD1C44C2B0DCBDD630F2C5A75785C1F76C727DBBE4A68E8987FC`
- 本次英文讀回：`agent-handoff-kit-intro.en.html` SHA-256 `30721B65DF965118207A9E2450FCAB9317C7780C8780DEFFEC27E33933B4FB08`
- Verdict: **PASS** — 中文來源先修正至目前 bare「開工」只讀最低必要狀態、顯示狀態卡後等待下一句指令的產品契約；同一句已交代明確任務或長程指令時，才直接開始第一個安全步驟。英文頁再從該中文 HTML 骨架完整重建。未參與重建的 reviewer 確認 11 個 section、主要 DOM 元件（glyph、五格 pain grid、三個 start／closeout 方塊、八個 mode icon / tag、bridge／how-to 三步、safety、tiers、recap、footer）、操作細節、唯一來源已有的 `🚀` 與視覺語氣均對齊；最後補正 bridge 指令的整句（包括句號）highlight 後讀回 PASS。

### Bilingual local-workflow case-study semantic gate（v0.3.44，PASS）

- 中文唯一準則：`local-agentic-ai-workflow-case-study.html` SHA-256 `B96A0EB58F5C3596567FBA75CD41DBA32CEC14FD46F6241900AB48D8F10DF779`
- 本次英文讀回：`local-agentic-ai-workflow-case-study.en.html` SHA-256 `777C57B67711F4DF145BF8EC40F3BC1B3AE82FFE58FD4DBF2FCF905512B03870`
- 中文資訊圖：`images/local-agentic-ai-workflow-blueprint.png` SHA-256 `BAC9FB0E4F08BFA7B9954DFD4593825240934FBB67962EFE1220EBE93B57EFE8`
- 英文資訊圖：`images/local-agentic-ai-workflow-blueprint.en.png` SHA-256 `99FAE71B9AF5698797B81AE87ADFC641FECB4177764CA94BC27F1E676B24E6BA`
- Verdict: **PASS** — 未參與翻譯的 reviewer 確認英文頁完整保留中文版 9 個 section 與順序，定位仍是 Kit 在本機 agentic AI 工作系統中的「交接層」，沒有重複變成 README／intro／guide；本機 AI agent 與 web chat 的差別、handoff、memory、source-of-truth、stable delivery、tool loop、beginner minimum、next step 語意完整。英文入口用語已修正為正式 `Start Agent Handoff` 與 `Wrap up Agent Handoff`，而非泛化 `start` / `close`。英文資訊圖保留同一五層結構及主要資訊，所有圖中文字均為英文。

人工語意審閱必須逐段回答四件事：中文向用戶承諾甚麼、英文是否保留同一操作／限制／例子、用戶能否實際照做、若不同會造成甚麼後果。下列 22 個對應項是實操指南重審範圍；本輪 `agent-handoff-kit-guide.en.html` 已按此清單通過，但日後若中文或英文 guide 再變更，必須重做該文件對的語意／視覺讀回：

| 中文段落 | 必須保留的英文語意 |
|---|---|
| 工作規則總覽 | task routing、規則落點、只載需要的 packs、把新規則接入既有真源的例子。 |
| A1 安裝 | AI-chat／terminal 分界、21-file 旅程、三入口、folder confirmation、doctor 的正確時機。 |
| A2 開工 | 單獨開工只讀最低必要狀態、顯示狀態／風險／建議下一步後停；同句或下一句有明確任務才開始工作。 |
| A3 bare 開工 | fresh project 無目標時只顯示 startup card 與建議下一步，不出 A–F、不做計劃；下一句 Downloads 任務才收斂為 preview-only + Coding/Safety flow。 |
| A4 計劃／讀取／改動 | 五類副檔名、年份、collision、shortcut／hidden 排除、1,043-file scan、sample、dry-run。 |
| A5 安全預演 | dry-run 數字、確認點、正式結果、filter、不可逆命令／force-push 邊界。 |
| Governance Bridge | 指定／掃描兩入口、read-only 六項 audit、候選先行、不得自動刪改合併。 |
| A6 收工 | trigger、reconcile-not-append、handoff／log／index、prompt mirror、archive。 |
| A7 接力／發布 | 新對話先接回狀態；同句或下一句明確要求發佈才載入 Release/Safety；兩次外部確認、GitHub readback、credential boundary。 |
| B1 資料分工 | Notion schema、本機 source tree、Drive destination、真源與 integration boundary。 |
| B2 開工 | 單獨開工與任務開工分開；完整報告目標、讀者、30+ Notion reference、本機 `reference/`、`report/`、Drive 分享授權與已連接接口。 |
| B3 首回應 | startup card、Notion/Drive 可讀寫核實、Research/Knowledge modes、讀取計劃、確認後才進計劃、可達不等於已讀。 |
| B4 來源對齊 | 32／24 matched + 3 unregistered = 27 available／5 missing、三個處置選項、Notion write/readback、十頁 outline。 |
| B5 報告／Drive | Writing mode、10.3頁／2,847字／4表／24 citation、暫定結論、docx／viewer／readback／secret boundary。 |
| B6 收工 | 具體外部狀態、5 pending、verification date、未連接 fallback。 |
| B7 後續接力 | `Start Agent Handoff` 加新要求、狀態卡、Research/Knowledge/Writing、四步計劃、用戶確認後才寫 3-month pop-up/shared-kitchen；1.4頁／4 citation、保留未解缺項，Drive 替換／新版本另問。 |
| C 結構說明 | 多月、多對話、用戶與 AI 分工，不是每日 ritual。 |
| C Day 1 | AI editing assistant：Markdown 校對與風格建議、coding+research、空 decision log 的原因。 |
| C Day 30 | 需求演進、Slack/Linear、6 turns／4 decisions、long-term trigger。 |
| C Day 60 | 32→12 active／20 archive、A/B/C trade-off、30 條邊界與影響。 |
| C Day 90 | current state→decision log→session-log archive 的三層回顧與選 B 理由。 |
| 結語 | 三案例共同閉環、跨工具／跨日、與 Adam-AI-Instructions 的責任分界及導航出口。 |

此 gate 的 reviewer 不可只報元素數、grep 命中或「大意相同」。若英文新增中文沒有的主段、把操作案例壓成摘要、重複同一內容，或改變 bare-start／外部確認等用戶可見語意，Verdict 必須是 `FAIL`。

### Cross-mind evidence 9-trigger table（v0.3.44）

| Trigger | Hit? | Decision | Evidence |
|---|---:|---|---|
| 1. Failure or blocker | yes | iterated | 使用者指出英文頁只像中文頁的短摘要；導航存在並不等於英文使用者能走完同一旅程。 |
| 2. External side effects | no | passed | 本輪只在隔離本地候選修改和驗證；未做任何公開寫入。 |
| 3. User-visible output | yes | passed | README 與四個 HTML 英文頁（入門、實操指南、AI 安裝頁、本機工作系統案例）均已完成本輪獨立語意／視覺讀回並轉 PASS；不得再沿用舊 PASS 或用 hash／導航存在代替覆核。 |
| 4. Complexity or boundary | yes | passed | 只擴充既有公開說明與既有 release checker，不建立新的文件權威或另一套 QA。 |
| 5. Security or data preservation | yes | passed | R-034 資料保護、升級、recovery 和 current-state 驗證保持在頂層檢查內。 |
| 6. Semantic runtime effect | yes | passed | 完整關卡已確認說明更新沒有影響 fresh router、legacy direct-AGENTS 和 ordinary doctor/readback。 |
| 7. Historical upgrade path | yes | passed | 完整關卡已實跑已釘選的舊版升級與 packed install smoke。 |
| 8. Real user journey | yes | passed | README 與四個 HTML 英文頁已證明可走同一使用旅程；雙向導航只是底線，本輪 PASS 來自逐檔語意／視覺讀回及 reviewer 結論。 |
| 9. Release statement | yes | passed | v0.3.44 是本地 release-ready candidate；尚未 push、tag、建立 GitHub Release 或 npm publish，不得把「可發佈」寫成「已發佈」。 |

## 用途

本節及其後的版本段落保留當時候選／發佈的 evidence、範圍和已知限制，不再定義現行 QC 方法或 command membership。可安裝套件必須保持輕量；驗收文件與原始碼倉庫專用腳本除非未來明確改變 `package.json` `files` 白名單，否則不得進入 npm package。

## v0.3.43 發佈狀態

- 狀態：release-complete。產品 commit `387eeac2f44cf408d48f0ee3615600cd774ec72b` 已推送至公開 `main` 並由 annotated `v0.3.43` tag 精確指向；GitHub Release 為非 draft／非 prerelease；npm `latest` 為 `0.3.43`，fileCount 35，shasum `b87e01b5bce9c78992ae9e7f6c4ef9035dfc4332`，integrity `sha512-f78KWCF77I2zFgy3SdeUFCkI3iEhvL/WMH5LyMOvmXcF2wAeohzTzJnXS1ERP+mtR1wJghLc1JYLe+Q5LqGVVQ==`。
- 本輪修正已發布 v0.3.42 的真實升級旅程假綠：同一份已驗證 current-state witness 證明 target 已接受，doctor 卻只讀保留的 `PROJECT_INDEX` metadata，並叫用戶再升級。修補後，doctor 以已驗證 accepted version 作目前狀態；metadata 只作資訊。
- R-034 資料保護核心仍有效：v0.3.41 direct-`AGENTS.md` user suffix、exact core 更新、same-state readback、drift 拒絕、第二次 upgrade 無 phantom transaction 與 recovery 均須重跑。
- 發佈前驗收必須直接執行本文件所在的 source QA scripts；它們不屬於 npm package，不能以 package.json `scripts` 欄位是否存在取代實際執行。npm package 只驗證 runtime、README、LICENSE、bin、runtime-core 和 packs 的明確白名單。
- 本節和 `full-audit-v0.3.43-candidate.md` 綁定同一產品 commit、QA harness hash 及 package identity。發佈後驗證亦已從 npm 公開套件完成：published install、`--help`、fresh `init`／`doctor`，以及 v0.3.41 direct-`AGENTS.md` user suffix → published v0.3.43 upgrade + sequential doctor 都通過；doctor 顯示 accepted current-state v0.3.43，沒有重複升級建議。

### Cross-mind evidence 9-trigger table（v0.3.43）

| Trigger | Hit? | Decision | Evidence |
|---|---:|---|---|
| 1. Failure or blocker | yes | iterated | Published v0.3.42 could say `status: passed` and still tell a successfully upgraded user to upgrade again; the direct and packed journeys now assert this cannot pass. |
| 2. External side effects | yes | passed | All validation used isolated temporary roots; the explicitly authorized public push, tag, GitHub Release and npm publication completed only after the commit-bound audit passed. |
| 3. User-visible output | yes | iterated | Doctor now distinguishes tool version, accepted current state, retained metadata and npm latest; the next step must match the same verified state. |
| 4. Complexity or boundary | yes | iterated | The frozen 110-path R-034 source witness remains distinct from the lean public candidate's own commit-bound raw-byte manifest. |
| 5. Security or data preservation | yes | passed | Artifact-backed ownership, byte preservation, recovery, and failure-propagation checks remain required. |
| 6. Semantic runtime effect | yes | iterated | The direct journey verifies ordinary entry, doctor, report and success use one fresh current-state witness and the doctor conclusion uses its accepted target. |
| 7. Historical upgrade path | yes | iterated | The pinned v0.3.41 direct-AGENTS journey and packed candidate smoke both preserve the user suffix and reject repeat-upgrade advice. |
| 8. Real user journey | yes | passed | Isolated UAT covers bare status-only startup and explicit continuation without widening the startup contract. |
| 9. Release statement | yes | passed | GitHub main, annotated tag, public Release and npm registry metadata were read back against the same product commit and package identity; the published journey passed. |

## v0.3.41 發佈狀態

- 狀態：release-complete。公開 lean `main`、tag `v0.3.41`、GitHub Release 與 npm `latest` 均為 `0.3.41`；tag target 是 `edaec74d61df90c0a090dd2b47159fd41136d5ef`，npm fileCount 29，shasum `8b9238287485ef15208c4c339e8cdfe283ce1c23`。
- 正式安裝真源改為 npm tarball，以 integrity／shasum 固定；遠端 tag／GitHub Release 只交叉版本集合與來源分叉。v0.3.35、v0.3.38 已 pin 正式 npm artifact，禁止 tag-based fixture 回歸。
- 54 個正式版本均記錄 21 個受管路徑的 `present`／`absent` manifest，共 1,047 個存在、87 個缺席；126 份去重內容由 runtime catalog 完整性驗證。
- `qa:upgrade` 必須從每版完整 manifest 重建，而不是只放 `AGENTS.md`／`PROJECT_INDEX.md` 後把其餘檔案用最新版建立。54 版完整單跳、CRLF、偽造／缺失版本列、自訂附錄、任意規則改寫、自訂 bridge 常見標題、預演／正式共用結構驗收、交易回復及冪等均須通過。
- 精確正式舊檔可不依賴版本列更新；自訂合併必須由版本列及至少兩個其他正式檔案指紋一致支持。矛盾、來源不明或規則正文改寫一律零寫入停手。
- 截圖所屬 v0.3.38 專案已用交易 backup 在隔離副本重建；候選預演 conflict 0，正式交易提交，`doctor 54/54`。原專案未作寫入。
- 首輪獨立候選反證找到自訂 `CLAUDE.md` 常見標題誤覆寫及預演漏跑正式結構驗收兩個 blocker；正式全面檢再找到替換後 journal 尚未更新的恢復窗、未驗證的 transaction artifact、確認前建立 root，以及 source 頁版本與 npm `@latest` 混淆。候選已把 root 驗證移到任何恢復前，以 target／stage／backup hash 與 realpath 完整裁決恢復，並加入取消、pending+junction、越界、損壞、third-state 及 21-target 公開示例回歸。原獨立審閱者重驗後剩餘 blocker／major 為 0；凍結完整原始碼 `215bf23`、精簡公開來源 `c1062ac` 的正式全面檢已 PASS，報告見 `docs/qa/full-audit-v0.3.41-candidate.md`。
- 發佈後驗證 PASS 7/7：GitHub Release 非 draft／非 prerelease且三段正文正確；npm latest `0.3.41`、fileCount 29、shasum 對齊；published install、`--help`、fresh `init`、fresh `doctor` 及 published v0.3.40 → v0.3.41 upgrade + sequential doctor 均通過。

### Cross-mind evidence 9-trigger table（v0.3.41）

| Trigger | Hit? | Decision | Evidence |
|---|---:|---|---|
| 1. 失敗或 blocker | yes | iterated | 正式 v0.3.40 仍把未改過的舊 safety pack 當 conflict；完整歷史矩陣揭出 54 版中只有兩版原本可無衝突預演。 |
| 2. 外部副作用 | yes | passed | 原專案唯讀，實際交易只在隔離副本；source checkpoint 可先提交／推送，但 tag、Release、publish 尚未執行且仍需另行授權。 |
| 3. 用戶可見輸出 | yes | iterated | CLI 與 AI 安裝頁不再把技術裁決交給一般使用者，並分清 live／target／current transaction。 |
| 4. 複雜推理 / 多層取捨 | yes | iterated | npm artifact、tag、Release、版本列、多檔指紋及本地附錄邊界分層裁決。 |
| 5. 安全或權限 | yes | iterated | 精確正式來源自動更新；自訂規則只在可證明安全時合併。常見 bridge 標題不再授權整檔替換；預演與正式升級在任何交易 artifact 前共用結構驗收。 |
| 6. 結論基於語意判斷而非單一 grep | yes | iterated | 規則正文改寫即使 line merge 不重疊也阻擋；完整 `doctor` 仍是交易後 gate。 |
| 7. 舊用戶升級路徑 | yes | iterated | 54 版、21 映射、present／absent、CRLF、來源分叉及自訂邊界均已自動化。 |
| 8. 真實用戶旅程 | yes | iterated | 真實失敗專案由 backup 隔離重建，正式 upgrade transaction + doctor 通過。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 產品、catalog、fixture、CLI、公開說明與 WORK QA 已同步到候選；正式全面檢揭出的交易恢復與公開版本盲點已回流成自動負例，仍須綁定新凍結 commit 才可放行。 |

## v0.3.40 發佈狀態

- 狀態：release-complete。發佈前全面檢綁定 frozen full-source implementation `fa5f1ab108e149c90b3496ee7723439bf04ca5fb` 並通過；lean public `main`、tag 與 GitHub Release 均指向 `1af798d911766034fd8c12e4a59521d6f6b74412`，npm `latest` 為 `0.3.40`。
- 修正三個真實 runtime 揭出的升級相容性缺陷：大型交接生命週期假紅、短題目生命週期假綠，以及多筆歷史 `SESSION_LOG` marker 被錯當範本衝突。
- 升級器只修改唯一現行日誌範本，歷史 entry 及其中的 fenced 開場證據逐位元組保留；模糊範本、真正生命週期矛盾及有額外本地修改的規則包仍安全停止。
- 三個原失敗治理形狀均已由 untouched original 建立 fresh 隔離副本，完成正式 upgrade transaction 與 `doctor 54/54`，原專案 pre/post hash 一致。第二案首次隔離交易仍回復，根修否定發布／寫入邊界及 Kit 固定開場文字假紅後，由原狀態重建再驗通過。
- `qa:upgrade` 的 49 個歷史 fixture、packed v0.3.39 → v0.3.40 upgrade + doctor、正反回歸及獨立前向覆核均通過；三名原失敗 runtime agent 最終均判定根修對準。正式獨立審閱另攔下歷史 fenced 證據被清理及短中文同義詞／詞序假綠，修正後重驗為零 blocker。
- 發佈後驗證已通過：GitHub Release 為 Latest、非草稿、非預發佈且三段正文正確；npm fileCount 29、shasum `78ea0cbd6906ab2542639903d739a550d038dd19`；published `--help`、fresh init／doctor、v0.3.39 → v0.3.40 upgrade／standalone doctor 均通過。歷史 fenced entry 升級前後 hash 同為 `535706CBC3B067AC32DD8BA2EDF8BBDFA21131600E567AD75D1FF97D19BFD7D2`；短中文同題負例 exit 1，異題正例 `54/54`。

### Cross-mind evidence 9-trigger table（v0.3.40）

| Trigger | Hit? | Decision | Evidence |
|---|---:|---|---|
| 1. 失敗或 blocker | yes | iterated | 三個真實升級失敗重開 v0.3.39 結論；正式獨立審閱再攔下歷史 fenced 證據被清理及短中文同義詞／詞序假綠，修正後重驗解除。 |
| 2. 外部副作用 | yes | passed | 三個原專案保持唯讀；正式交易只在 fresh 隔離副本。Source `fa5f1ab` 與 lean public `main` `1af798d` 已凍結；正式全面檢已放行 tag、Release、publish。 |
| 3. 用戶可見輸出 | yes | iterated | README、三份 HTML、CHANGELOG 與 whatsnew 已對齊 v0.3.40 正式發布文字；Release 前仍須全文終讀。 |
| 4. 複雜推理 / 多層取捨 | yes | iterated | 生命週期 hard gate 只保留高可信連續題目與完整短題目相同判定，避免語義過度推斷。 |
| 5. 安全或權限 | yes | passed | dry-run 零寫入、模糊範本 conflict、交易回復及精確 quick-fix 指紋均有保守邊界。 |
| 6. 結論基於語意判斷而非單一 grep | yes | iterated | 大型中英交接、短中文同義詞／詞序、異題短中文、兩詞英文、權威 opening 與歷史 fenced evidence 均有正反案例。 |
| 7. 舊用戶升級路徑 | yes | passed | 真實 v0.3.39 fixture、v0.3.38 自訂／局部漂移、三案 fresh 隔離完整交易、遷移後 doctor 與原專案完整性核對均已覆蓋。 |
| 8. 真實用戶旅程 | yes | passed | 從公開 v0.3.39 packed fixture 正式升級到 packed v0.3.40，再由 doctor 讀回通過。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 歷史保留、假紅、假綠、範本邊界、精確 quick-fix 與交易恢復由不同驗收共同證明。 |

## v0.3.39 發佈狀態

- 狀態：release-complete。發佈前全面檢綁定凍結實作 `ea5237092c23fccd98bf5675e0f1db23795f9332` 並通過；公開 lean commit 為 `747f1f76b54a89e8cc87cd9ada55830e8545b746`。GitHub tag / Release、npm publish 與發佈後驗證均已完成。
- 本版根修 continuity 熱路徑、onboarding 冷路徑、獨立 closeout pack、生命週期交叉驗證、提示副本唯一性、v0.3.38 三方合併及交易式 upgrade。
- npm 白名單預期 29 檔；新增 3 份 v0.3.38 規則包遷移基準及 1 份 closeout pack。
- 候選已通過 `qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:prompt-mirror`、`qa:release`，並以打包後套件重跑 prior-version upgrade + doctor。
- 發佈後驗證已通過：GitHub Release 為非草稿、非預發佈，標題與三段正文契約正確；npm latest 為 `0.3.39`、fileCount 29；published `--help`、fresh init / doctor、published v0.3.38 → v0.3.39 自訂 pack 升級與 sequential doctor 均通過；「聲稱完成但仍列未完成」負例失敗，「明確改列後續追蹤」正例通過。

### Cross-mind evidence 9-trigger table（v0.3.39）

| Trigger | Hit? | Decision | Evidence |
|---|---:|---|---|
| 1. 失敗或 blocker | yes | iterated | 真實 v0.3.38 自訂安裝揭出整包替換、生命週期假通過及 transaction 缺口；候選逐項根修。 |
| 2. 外部副作用 | yes | passed | 本輪只建隔離候選；public／WORK、commit、push、tag、release、publish 全未執行。 |
| 3. 用戶可見輸出 | yes | iterated | README、三份 HTML、CLI 卡及 whatsnew 對齊 continuity 熱路徑與 onboarding 冷路徑。 |
| 4. 複雜推理 / 多層取捨 | yes | iterated | 把常駐 closeout 內容移入獨立 pack，同時保留核心觸發與安全不變條件。 |
| 5. 安全或權限 | yes | iterated | conflict 零寫入、future-version 阻擋、real-path／symlink、credential、journal／rollback 邊界納入。 |
| 6. 結論基於語意判斷而非單一 grep | yes | iterated | doctor 交叉比對完成、驗收、待辦、風險與 opening；加入正反生命週期案例。 |
| 7. 舊用戶升級路徑 | yes | iterated | 48 份已提交 fixture 單跳，並以隨包 v0.3.38 基準三方合併自訂規則。 |
| 8. 真實用戶旅程 | yes | passed | fresh init、開工熱路徑、v0.3.38 自訂升級、故障回復、doctor、冪等及 packed smoke 均有機器證據。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 承諾分別由路由場景、交易故障、內容保留、schema、doctor 反例及打包後升級共同驗證。 |

## 驗收分層

| 層級 | 指令 | 範圍 | 發佈前是否必須通過 |
|---|---|---|---|
| 原型驗收 | `npm run qa:prototype` | 範本安裝、`doctor`、CLI 版本自檢 mock、套件預演、過時字串與污染標記。 | 是 |
| 規則包場景驗收 | `npm run qa:packs` | coding、research、writing、knowledge、release、safety、governance、communication 與 mixed-scenario 規則包路由。 | 是 |
| 升級安全驗收 | `npm run qa:upgrade` | 既有專案升級、備份、合併、衝突行為，以及版本、功能、穩定性三軸矩陣。 | 是 |
| 發佈前驗收 | `npm run qa:release` | 發佈前關卡、版本、套件內容、文件一致性、較完整的 `doctor` schema 檢查，以及 tag / release / npm 準備度。 | 是 |
| 用戶流程驗收 | 已併入 `npm run qa:release` | 安裝、`doctor`、模擬收工、抽取開工訊息、接力後 `doctor`，並確認不預設建立 archive。 | 是 |
| 任務入口事實驗收 | 已併入 `doctor` 與 `npm run qa:release` | 檢查 `PROJECT_INDEX` 具備 Fact Base / External Sources / Local QC Commands，`SESSION_HANDOFF` 具備 Next Task Required Reading，並保留「可達不等於已讀入」口徑。 | 是 |
| 交接狀態對賬驗收 | 已併入 `doctor` 與 `npm run qa:release` | 檢查 `SESSION_HANDOFF` 分清 Durable Anchors 與 Closeout-Reconciled State，具備 Task Understanding Summary 與 State Reconciliation Check，並用負面測試確認 stale snapshot 不能當作已對賬；v0.3.6 起再加入交接生命週期一致性反例，確認已完成事項不能被下一輪當成未解待辦；同時檢查一次性驗收、舊版本、舊發佈與研究證據鏈不可污染 Durable Anchors / Next Priorities / opening message。 | 是 |
| 交接語言本地化驗收 | 已併入 `doctor` 與 `npm run qa:release` | 檢查 `SESSION_HANDOFF` 保留 `ack:section:*` 與 `ack:field:*` 語義標記時，標題與可見欄位名稱可翻成中文或其他語言。 | 是 |
| 安裝後指示驗收 | 已併入 `npm run qa:prototype` 與 `npm run qa:release` | 檢查安裝成功後的終端機輸出不會令用戶誤把提示文字當成命令，並確認 README 說明安裝後第一步；同時檢查 `npx` 取得 CLI 工具與項目內 Kit 文件安裝不可混淆。 | 是 |
| AI 代安裝頁驗收 | 已併入 `npm run qa:release` | 檢查 `agent-handoff-kit-ai-install.html` 是 GitHub Pages 普通 HTML 入口，README / intro / guide 均有連結；頁面要求 AI 先顯示並確認目前資料夾，未確認不執行 `init` / `upgrade` / `doctor`，遇 conflict 停手，不把差異裁決交給一般用戶，也不把維護者收納用戶本地內容列為一般路徑；unknown hash 只作內容 witness，真正合併由能讀寫該資料夾的 AI 在用戶授權下完成，之後再跑 `upgrade --dry-run`、`doctor` 與 hash / readback；完成後跑 `doctor`，並明確禁止 commit / push / tag / npm publish / GitHub Release。完成報告契約必須出現在第一個 `npx` 命令之前，避免 prompt-driven agent 只讀到操作步驟便停止；Prompt 安裝完成後，AI 不可只說「完成」或只貼終端機輸出，必須輸出完成報告，說明結果、目前資料夾、`doctor` 結果、`Start Agent Handoff` /「開工」不是終端機指令，以及下一步要在 AI 對話中開始。此頁不屬於 npm package。 | 是 |
| 技能／子代理流程仲裁驗收 | 已併入 `npm run qa:packs` 與 `npm run qa:release` | 檢查外部技能、子代理、demo workspace 或其他工具的 closeout 不可取代目前根目錄自己的 Agent Handoff Kit 持久化。 | 是 |
| 任務持久化分流驗收 | 已併入 `npm run qa:release` 與人工終讀 | 檢查完成任務不等於完整收工；核心 runtime 是唯一分流真源，README / intro / guide 只保留用戶操作語句，不暴露內部治理分類；例行通過檢查、未拍板草稿不得觸發輕量保存或完整收工，新增或刪除文件、新來源、用戶要求把經驗轉成機制時才按角色保存到正確位置；長任務中途分批新增或改動產品目標、開發清單、驗收規則、非目標或優先序時，必須先合併到單一當前任務契約，不能只留在聊天或分散到多份文件片段。 | 是 |
| Generated artifact governance 驗收 | 已併入 `doctor`、`npm run qa:prototype`、`npm run qa:release` 與人工終讀 | `doctor` 的機器範圍只掃 Markdown：未登記 `outputs/*.md` 必須 fail，精確登記或同一紀錄分類後才 pass。其他持久格式沿用人工治理與索引責任，不得宣稱由 doctor 掃描。 | 是 |
| 跨 workspace 外部影響紀錄 | 已併入 `npm run qa:release` 與人工終讀 | 檢查 expected root 以外的讀取、寫入、生成 artifact、push、publish 或 remote write 必須留下 External Impact Note；每個外部 target 一行；外部同步必須寫明種類與回讀驗證；不得掃描 sibling folders，不得自動寫目標 handoff，不得把紀錄當成 clean / stash / commit / push / publish / release 授權；目標 handoff 未更新、只讀內容被摘要或持久化、未回讀或未核實時都必須明說。 | 是 |
| 長期治理入庫驗收 | 已併入 `npm run qa:packs`、`npm run qa:release` 與人工終讀 | 檢查 Long-term governance routing：用戶要求「寫入長期治理」「轉成長期機制」「之後都要遵守」，或內容本身表明 future sessions should remember / recurring AI mistake / API、MCP、tool-use pattern 時，AI 必須按內容分流至 rule pack、registered reference、project index、sync registry、project decisions 或 QA check；不得只存放在 SESSION_LOG / SESSION_HANDOFF / START_NEXT_SESSION_PROMPT。此項不改變「接入 Agent Handoff Kit」的文件接合原意。 | 是 |
| 舊核心升級結構驗收 | 已併入 `npm run qa:upgrade` 與 `npm run qa:release` | 檢查舊版未標記 `AGENTS.md` core 升級後不會留下雙核心、雙收尾合約或 stale 上半段，且保留 core 前後的使用者本地規則；同時確認升級後 core 已帶收工 read-back discipline，沒有殘留「先表面輸出、後重生 prompt」的第三真源舊次序。 | 是 |
| PROJECT_DECISIONS 結構驗收 | 已併入 `doctor` 與 `npm run qa:release` | 檢查 `dev/PROJECT_DECISIONS.md` 含 4 個 H2 section heading（Evolution Timeline / Decisions Archive / Architecture Choices / Insights & Learnings）並保持順序；檔頭含 onboarding 句式（「warm 資料層」、「AI 開工不需要讀」、「AI 在收工時自動 update」）；research-derived decision trace 使用同檔定義的 evidence-chain format，並由 `doctor` 確認 `source:<id>` 已登記於 `dev/PROJECT_INDEX.md`。 | 是 |
| Prompt mirror 固定檢查器 | 已併入 `doctor`、`npm run qa:prompt-mirror` 與 `npm run qa:release` | 以同一 runtime helper 錨定 `ack:section:next-session-opening-message` / `## Next Session Opening Message`、copy marker 與下一個 fenced `text` block；比對前正規化 CRLF / LF，只把真內容差異列為 mismatch。 | 是 |
| 收工三面同源驗收 | 已併入 `npm run qa:release` 與人工 opening-message read-through | runtime closeout 必須先由 `dev/SESSION_HANDOFF.md` 重生並驗證 `START_NEXT_SESSION_PROMPT.txt`，再把穩定 bootstrap 句交給用戶；final response 不可成為 handoff / prompt file 之外的第三份 stateful prompt。 | 是 |
| Release Artifact Vocabulary Sweep | 已併入 `npm run qa:release` | 對 `bin/agent-handoff-kit.mjs` + `README.md` + `agent-handoff-kit-intro.html` + `agent-handoff-kit-guide.html` 跑禁忌字眼 grep（「人話解讀」「人話補一句」「人話解釋」）；對 `CHANGELOG.md` 限 latest version section (anchor-bounded by `## v` heading) 跑相同 grep；命中數必為 0。 | 是 |
| GitHub Release body 固定結構驗收 | 已併入 `npm run qa:release` 與發佈後 `gh release view` 回讀 | GitHub Release title 必須使用 `vX.Y.Z - <用戶可理解的價值短句>`；body 必須以 `# vX.Y.Z` 開首，並依序使用 `## 本版新加了甚麼`、`## 對你已有檔案的影響`、`## 建議下一步` 三段。若該版本有補充圖，唯一允許位置是 `# vX.Y.Z` 後、第一個 H2 前的一張版本圖；不得把圖解展示規則、維護策略或索引安排寫入 body。body 應由 `docs/whatsnew/vX.Y.Z.md` 生成或保持等價；不得回退成舊 `## 用戶價值` 格式。建立或修改 GitHub Release 後，必須用 `gh release view vX.Y.Z --json name,body` 回讀核對。 | 是 |
| Onboarding HTML 書面語紀律 | 已併入 `npm run qa:release` | 對 `agent-handoff-kit-intro.html` 與 `agent-handoff-kit-guide.html` 跑廣東口語字符 grep（「嘅 / 咁 / 喺 / 揀 / 唔 / 乜 / 啱 / 嚟 / 咗 / 嗰」）；命中數必為 0（onboarding HTML 必為繁體中文書面語）。 | 是 |
| Onboarding Pack 結構驗收 (R-029) | 已併入 `doctor` 與 `npm run qa:release` 與 `npm run qa:packs` | 檢查 `dev/rules/onboarding.md` 含 H2 sections（Scope / Load When / Discipline / Application Scenario Library / Cross-reference to guide.html / Tone Discipline / Closeout）並保持順序；含 6 個 Scenario H3 heading（A 建構系統 / B 整理研究資料 / C 整理電腦檔案 / D 學寫代碼 / E 其他 / F 外部工具治理）；含 `Infer when sufficient; ask only when unresolved` 決策錨點與可選的 guided 5-step pattern；含 Tone Discipline 5 條（書面語 / 講人話 / 敍事+解釋 / 不過度解釋 internals / 鼓勵性而非考試）。 | 是 |
| 新手直接路由與安全邊界驗收 | `npm run qa:packs`、`npm run qa:prototype`、`npm run qa:upgrade`、`npm run qa:release` | 固定驗證三種情境：目標與資料足夠時直接判斷並開始，不顯示 A-F 或重問；真正含糊或用戶要求引導時保留選單；外部、權限、費用、發佈及不可逆操作仍須明確確認。升級驗收須把 0.3.38 的可信舊流程語義合併為新流程，保留自訂規則列與本地段落，結構含糊時報 conflict；初始提示、交接與日誌副本須一致。 | 是 |
| Cross-surface wording consistency 驗收 (R-029.1 → v0.3.19 startup-entry update) | 已併入 `npm run qa:release` 與 `npm run qa:prototype` 與 `npm run qa:upgrade` | 對 4 個 user-facing surface（`bin/agent-handoff-kit.mjs` printInstallNextSteps + `README.md` first-screen callout 同三步上手 step 2 + `agent-handoff-kit-intro.html` #howto Step 2 + #recap cell 1 + `agent-handoff-kit-guide.html` hero callout）grep `Start Agent Handoff` /「開工」主入口、`Read AGENTS.md first, then Start Agent Handoff` 帶路徑 fallback、普通 web chat AI 不支援邊界、`Wrap up Agent Handoff` /「收工」收工入口與「某某開工 / 某某收工」歧義保護；current surface 不得再把舊長句「Read AGENTS.md first. Then open START_NEXT_SESSION_PROMPT.txt」、任何 AI 工具均可用、貼一段提示 / 貼一段字、或「固定開工句 / 貼回提示」當成主流程。README 必須符合「產品設計與用戶旅程優先原則」：用戶講目的，AI 做技術；README 不另開一套平行安裝教學；安裝／升級主路徑是 AI 安裝頁，CLI help 與 AI 安裝頁保留 `init` / `upgrade` / `doctor` 技術細節；README 不能要求用戶自行判斷安裝或升級，也不能把確認資料夾、衝突判斷、預演升級等 AI 技術工作塞回主路徑。`upgrade --dry-run` 只可作升級前預演，並須明示它不會完成升級。執行規則仍以 runtime `AGENTS.md` 單一真源為準；qa:upgrade chain test final hop 須含「Explicit onboarding requests」+「dev/rules/onboarding.md」routing row，並確認「開工」只啟動接力讀取，不列入教學關鍵詞。 | 是 |
| Public README journey discipline | 已併入 `npm run qa:packs`、`npm run qa:release` 與人工終讀 | README、新手頁與其他用戶文檔必須按「用戶講目的，AI 做技術」維護：主路徑只保留一條用戶旅程；可點擊 AI 安裝頁連結可保留；`init` / `upgrade` / `doctor` / `dry-run` 等技術指令留在 AI 安裝頁、CLI help 或進階示範頁；不得把手動安裝段、命令表、狀態檢查段與三步上手重複成多套同等方法。人工終讀必須逐段判斷每句是否屬公眾用戶需要的產品資訊；AI 內部工作訊息、維護策略、source / mirror / publish 狀態、驗收口徑、候選狀態、展示規則與「這裡會放甚麼」一類編輯說明不得進入 README 或 onboarding HTML。已知回歸詞由 `scripts/check-release-readiness.mjs` 作負向斷言，但機器 grep 只是底線，不能取代語意審閱。`packs/writing.md` 必須含此原則，`scripts/check-pack-scenarios.mjs` 必須守住 writing pack 錨點。 | 是 |

## QC 觸發分層

本文件同時覆蓋發佈前與發佈後，但兩者不可混成同一個 gate：

| 觸發 | 時機 | 覆蓋 | 通過代表 |
|---|---|---|---|
| 🟢 日常快檢（觸發詞：`快檢`） | 日常 source 修改後、commit 前。 | 四條 `npm run qa:*`：`qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release`。 | 原始碼層未破壞既有機器驗收。 |
| 🔴 發佈前全面檢（觸發詞：`全面檢`） | 發佈前，尤其是候選版本、治理結構改動，或使用者明示要求 full audit。 | 快檢 + 本文件人工審閱清單 + 維護者側 WORK 治理健康檢查八維度 + 產品級旅程矩陣 + UX / user journey 審閱 + CLI output sweep + cross-file read-through + rules / packs 路由與入庫範圍審核 + upgrade migration / scenario branching semantic sweep + QC gap backflow。 | 候選版本可以進入 tag / GitHub Release / npm publish；仍未代表已發佈完成。 |
| 🟡 發佈後驗證（觸發詞：`發佈檢`） | GitHub Release 與 `npm publish` 完成後立即執行。 | 七項 registry / release artifact smoke test：GitHub Release metadata、npm latest / fileCount、fresh install、published `--help` / `init` / `doctor`、previous published version → new published version upgrade + sequential doctor。 | 已公開 artifact 經 registry / release / fresh-install / upgrade smoke 驗證，release 才算完成；不承擔產品 QA。 |

`全面檢` 就是 `發佈前全面檢`，不得包含需要已 publish 才能執行的檢查。`發佈檢` 就是 `發佈後驗證`，只在公開發佈完成後執行，性質是 registry / release artifact smoke test，不是產品 QA。完整 release closeout 的順序是：先 `全面檢` PASS，取得明確 publish 批准後才 tag / GitHub Release / npm publish，最後跑 `發佈檢`。

## 產品級發佈前全面檢

🔴 發佈前全面檢要同時驗產品、流程、UX、場景與治理健康。它不是只跑 `qa:release`，也不是只讀文件。每次候選版本都必須留下可審閱的發佈前報告，至少包含：

1. 維護者側 WORK 治理健康八維正式結論：健康 / 緊張 / 不健康 / 過載，並給出繼續 / 合併 / 暫停 / 刪減方向。
2. 產品旅程矩陣：每個場景標記 automated PASS / manual PASS / blocked / not applicable，並附證據。
3. UX / user journey 結論：CLI、README、runtime handoff、onboarding pack、whatsnew 是否回答用戶在該步最可能問的下一句問題。
4. QC gap backflow 結論：本次發現的每個新問題，除產品修補外，是否已轉成自動驗收、人工清單、或有理由的暫時人工阻擋。
5. Rules / packs 路由與入庫範圍結論：`runtime-core/RULE_PACKS.md` 是否能以自然語言任務訊號載入相應 pack；標準 pack 的 Scope / Load When / Rules / Checks / Closeout 是否清楚；onboarding / integrations 等特殊 pack 是否有等效 discipline / closeout / checks 承接；可重用操作程序是否被導向既有 pack 或 registered reference，而不是隨意新建治理文件或只放入 handoff / log。
6. Governance Bridge Scenario Matrix 結論：若候選版本改動治理打通，full audit 報告必須列出 stock list、production guide / runbook、repo-wide scan、duplicate source-of-truth 四個情景的 automated PASS 證據；不要求 Adam 做人工 diff review。

### Product Journey Matrix

| 場景 | 必驗問題 | 最低承接 | 未通過時 |
|---|---|---|---|
| Fresh install → init → first task | 新用戶安裝後是否知道下一步是在 AI 對話中開始，而不是把提示當終端機指令。 | `qa:release` user-flow + R-029 wording sweep + 人工終讀 | 阻擋 publish，直到 CLI / README / onboarding wording 對齊 |
| AI-assisted install page → folder confirmation → init / upgrade / doctor | 非技術用戶只貼一句「請讀取 https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-ai-install.html ，並在這個資料夾安裝或升級 Agent Handoff Kit。」時，AI 是否在第一個 `npx` 命令之前已讀到完成報告契約；是否先顯示目前資料夾並請用戶確認；確認後才判斷 fresh install / upgrade dry-run / upgrade / stopped on conflict；遇 conflict 時是否停手零寫入，請能讀寫資料夾的 AI 在用戶授權下做語意合併，再以 Kit dry-run / doctor / hash readback 驗收，而不是要求用戶判斷技術差異或要求 maintainer 為單一用戶內容加例外；完成後是否跑 `doctor`；是否主動輸出完成報告，告訴用戶下一步在 AI 對話輸入 `Start Agent Handoff` /「開工」，而不是只回報命令成功；且不做 commit、push、tag、npm publish 或 GitHub Release。 | `qa:release` AI install page contract + README / intro / guide link sweep + conflict-role wording guard + 人工終讀 | 阻擋 publish，直到 AI 代安裝頁、README 與 onboarding HTML 對齊 |
| First task → closeout → next session handoff | 收工後下一個 AI 是否不需聊天記憶，也不會重開已完成調查；handoff、`START_NEXT_SESSION_PROMPT.txt` 與 final response 是否同源，不產生表面第三版本。 | `doctor` handoff lifecycle check + negative fixture + prompt mirror checker + final response read-back discipline + opening-message read-through | 阻擋 publish，並補 lifecycle fixture、prompt mirror assertion 或 manual checklist |
| Task evidence → closeout disposition → next session startup | 一次性交付要求、build / QC / release evidence、舊 hash / 舊版本狀態、source evidence chain 是否被放到 trace evidence / project index / project decisions / rule pack，而不是 Durable Anchors、Next Priorities 或 opening message；下一輪 AI 是否只被當前目標、有效風險與必要閱讀帶動。 | `doctor` current-state evidence boundary + `qa:release` handoff temperature boundary contract + `SESSION_LOG` Evidence disposition field + `SESSION_HANDOFF` Persistence routing checked field + 人工讀 through state sections | 阻擋 publish，並補 evidence-boundary fixture、欄位遷移或 manual checklist |
| Existing project upgrade → doctor → closeout | 舊用戶升級後是否不丟本地規則、不覆寫用戶內容、不出現「剛升完又叫再升」或「升級說可用、doctor 立刻失敗」矛盾；升級必須同時完成版本 metadata 對齊、功能 anchor 補齊、升級後穩定通過 `doctor`。 | `qa:upgrade` chain + user-data fixture + upgrade quality matrix + CLI scenario branching sweep | 阻擋 publish，並補 prior-version fixture / scenario / matrix case |
| Existing project upgrade → anchor drift auto-repair | 正式 `upgrade` 已執行後，不應要求新手自行修補 Kit anchor 缺段。若缺的是 Kit 模板可定位的維護文字，例如 `SESSION_HANDOFF.md` continuity 句、`SESSION_LOG.md`、`PROJECT_DECISIONS.md`、rules pack 必要 anchor 或 onboarding scenario，`upgrade` 應以備份加 migration report 的方式非破壞性補回正確語義位置，並讓自動 `doctor` 通過。`doctor` 不得因裸 anchor 文字被放到檔尾而轉綠；舊 repair marker、裸文字錯位、高風險 pack 章節不可信、或 `SESSION_LOG` 既有審計紀錄可能被覆寫時，必須由自動測試覆蓋停手或保留紀錄。產品實作須維持 single upgrade contract：每個 required anchor 的 snippet、合法位置判斷、缺失 / 錯位分類與可用修補策略要在同一 contract / strategy 表收斂，不可讓 `doctor`、`upgrade`、測試各自維護第二套規則。必測負面 fixture 包括：`SESSION_HANDOFF.md` continuity anchor 錯位、`PROJECT_INDEX.md` fake version row 放錯位置、`dev/rules/safety.md` 同號規則被改成自訂語義、`dev/rules/integrations.md` heading 錯位 / 章節不可信、`dev/rules/onboarding.md` Scenario library 骨架不可信。只有無法定位安全插入點、檔案不可讀寫、或結構衝突時才停手。 | Scenario 4c / 4d / 4e automated + upgrade quality matrix + single-contract source review + misplaced-anchor / misplaced-handoff / fake-project-index / repair-marker / unsafe-safety-custom / unsafe-integrations / unsafe-onboarding / session-log-preserve negative fixtures + anchor auto-repair output + conflict stop output | 阻擋 publish，直到可自動補的 Kit anchor drift 可自動補；真正不可判斷的結構衝突仍停手且不覆寫 |
| Existing Kit files → official npx doctor path | 舊項目已經有 Kit 文件時，用戶是否明白官方路徑是 `npx --yes @adamchanadam/agent-handoff-kit@latest doctor`；裸 `npx ... doctor` 只是 npm 通用執行方式，不作產品旅程。 | README / CLI help / intro / guide 冷啟動 `npx --yes` 指令 + `qa:release` npx UX guard + 人工終讀 | 阻擋 publish，直到 README、CLI help、doctor 下一步、intro、guide 與 QA guard 對齊 |
| Non-empty project with local rules | 既有 `AGENTS.md` / `PROJECT_INDEX.md` / `RULE_PACKS.md` 內容是否保留或停手報 conflict。 | `qa:upgrade` merge / custom-row / conflict fixtures | 阻擋 publish，除非明確列為人工-only conflict 類 |
| Conflict / blocked state | 工具是否清楚停手並說明沒有覆寫；unknown / user content 是否進入授權語意修補流程：用戶只確認需求和授權，能讀寫該資料夾的 AI 負責合併，Kit 只用 dry-run、doctor 與 hash readback 驗收；只有證明未改動正式舊檔被 Kit 誤判時才回報 Kit baseline bug，不得要求維護者收納用戶本地內容作一般產品路徑。 | Scenario 2 / 5 + `qa:upgrade` formal conflict output guard + `qa:release` scenario 5 output guard + semantic-repair two-phase flow + maintainer-exception negative | 阻擋 publish；同類第二次出現即擴充 fixture |
| Doctor healthy / outdated / lifecycle conflict | `doctor` 是否分清健康、可升級、交接矛盾三類，不混成同一個下一步；doctor / hash 通過不得被說成 Kit 已理解用戶語義。 | Scenario 6 automated + scenario 7 manual + lifecycle negative fixture | 阻擋 publish，並補 scenario output contract |
| AI-generated handoff prose tolerance | `doctor` / `upgrade` no-op 不得用任意正文詞語硬猜生命週期；可機器判斷的只限 Kit 控制的結構標記與狀態欄位。完整 closeout lifecycle consistency 仍由 separate `closeout-status` contract 擁有。 | Scenario 4b automated + lifecycle field fixture | 阻擋 publish，直到 arbitrary prose tolerance fixture 通過 |
| Natural-language task → rule pack → durable home | 用戶以自然語言提出寫作、研究、編碼、整合、發佈、治理、回覆格式或新手上手需求時，AI 是否能載入最少必要 pack，並把可重用程序寫入既有 pack / registered reference；不得因一次任務就任意新建 governance docs。 | `qa:packs` + Rule Pack Routing And Durable-home Scope Sweep + 人工抽樣 | 阻擋 publish，直到路由、pack scope、入庫位置與人工樣例對齊 |
| Governance bridge / 治理打通 | 指定重要文件接入 Agent Handoff Kit 時，AI 是否檢查文件本身、`PROJECT_INDEX`、`DOC_SYNC_REGISTRY`、相關 workflow、handoff / log 角色與重複真源風險；repo-wide 未接合文件掃描是否只列候選與缺口，不把普通文件誤判為必須接入治理層；只有所有適用 governance link 都存在才可報 bridged，略過層必須寫 not applicable 原因。 | `qa:packs` Governance Bridge Scenario Matrix + `qa:upgrade` migration fixture + `qa:release` Governance Bridge contract；不要求 Adam 做人工 diff review | 阻擋 publish，直到 stock list、production guide / runbook、repo-wide scan、duplicate source-of-truth 四個情景均由機器驗收覆蓋 |
| Long-term governance routing / 長期治理入庫 | 新規則、錯誤經驗轉機制、API / MCP / 工具正確用法若需要長期有效，AI 是否按內容判斷持久位置；即使用戶未命中「寫入長期治理」或「轉成長期機制」字眼，只要語義要求跨 session 生效，就不可只寫入 log、handoff 或 prompt 副本。此場景不得重新定義「接入 Agent Handoff Kit」；後者仍只處理文件 orphan。 | `qa:packs` long-term governance use cases + `qa:release` Rule Pack Routing And Durable-home Scope Sweep + 人工終讀 | 阻擋 publish，直到 recurring mistake、API/MCP/tool-use pattern、no exact trigger 三類情景都有驗收 |
| Task persistence gate | 完成任務不等於完整收工；AI 必須按核心 runtime 的三層分流判斷：無持久事實不寫治理檔、有下一輪必須知道的事實才輕量保存、明確收工或交接才完整 closeout。 | `qa:release` Task Persistence Gate Sweep + README / intro / guide 人工終讀 | 阻擋 publish，直到正向場景與反向場景都對齊 |
| Generated artifact → index / sync / classification | AI 在工作中生成或實質修改 Markdown、規格、runbook、checklist、research output、`outputs/*.md` 或其他 durable artifact 時，是否先檢查既有權威家，避免另起爐灶；完成前是否把 artifact 登記、同步、合併，或標成 draft / temporary / one-time evidence；`doctor` 是否能抓到未登記 orphan。 | `doctor` generated markdown governance checks + `qa:prototype` orphan Markdown dry-run + `qa:release` positive / negative contract + 人工 generated artifact read-through | 阻擋 publish，直到 orphan fixture 失敗、登記 fixture 通過，且人工清單確認沒有 parallel source-of-truth |
| Cross-workspace operation -> external impact note -> next session startup | AI 在 active root 以外讀取、寫入、生成 artifact、push、publish 或 remote write 時，是否以 expected root 判斷外部影響，並即時留一目標一行紀錄：target、action、status、read-back、do-not-assume、safe evidence；目標 handoff 未更新時是否明說；未掃描、未回讀、未驗證是否不被推斷為乾淨、同步完成或無副作用。 | `qa:release` Cross-workspace External Impact Note Sweep + 人工 state read-through | 阻擋 publish，直到 runtime、QA 文件與人工終讀都守住簡化紀錄，不擴張成跨 workspace log sync 或自動寫目標 handoff |

### QC Gap Backflow

任何發佈前全面檢、人工終讀、UAT、真實用戶 session，或發佈後 artifact smoke test 意外揭出的新問題，都要同時判斷兩層：

- 產品層：需要修哪個 runtime、template、CLI、pack、README 或 release note。
- QC 層：為何現有驗收沒有抓到；要補自動 assertion、真實 fixture、scenario simulation、public manual checklist，還是記為暫時人工阻擋。

只修產品 bug 而沒有處理 QC 層，不可宣稱 release-grade。若同一類問題第二次以人工方式被發現，而仍沒有自動或明確 checklist 承接，該候選版本 blocked。

## 規則包場景覆蓋

| 場景 | 預期 pack 行為 |
|---|---|
| Coding | 載入 `coding`；只有出現檔案、Git、API、install、deploy、release、credential 或 permission 風險時才加 `safety`。 |
| Research | 載入 `research`；要求來源、日期，以及證據與推論分開。 |
| Writing | 涉及受眾、語氣或交付格式時載入 `writing` / `communication`。 |
| Knowledge | 涉及 source-of-truth 或 sync work 時載入 `knowledge`；外部寫入、權限或破壞性操作才加 `safety`。 |
| Required reading | 非簡單任務先從 handoff、project index、使用者要求與 sync registry 找出必讀本機真源與外部來源；未讀來源只能標記 pending / blocked，不得當成沒有資料。 |
| Release | 載入 `release` 與 `safety`；沒有明確批准不得 tag、建立 GitHub Release、npm publish 或 close release。 |
| Safety | 刪除、覆寫、移動、reset、Git history、package manager、API、deploy、release、credential、permission error 都要升級到 `safety`。 |
| Mixed scenario | 先拆階段，每階段載入最少必要 packs，不一次載入全部 packs。 |

## 治理 QA 缺口矩陣

本矩陣用來檢查治理環境是否只增加文字而沒有驗收。能機器檢查的項目應進入 `doctor` 或 QA 腳本；不能機器檢查的語意判斷，應列入發佈前人工審閱。

| 維度 | 發佈前檢查方式 |
|---|---|
| 重複 | 檢查同一口徑是否已有單一真源；避免 README、runtime、QA 文件各自變成權威。 |
| 矛盾 | 用 `qa:release` 文件錨點與人工終讀確認 README、runtime、CHANGELOG、發佈級 QA 說法一致。 |
| 膨脹與負載 | 確認 npm package 邊界不擴大，且新增 QA 文件不進使用者安裝 runtime。 |
| 認知影響 | 檢查安裝後提示與 README 是否讓用戶分清終端機檢查與 AI 對話下一步；舊項目跑 `npx ... doctor` 時，也要分清 npm 取得 CLI 工具與 `doctor` 檢查項目文件。 |
| 事實漂移 | 用 handoff 對賬欄位、stale snapshot 負面測試與必讀來源欄位降低風險。 |
| 交接生命週期一致性 | 用 `closeout-status` 與 `qa:release` closeout fixture 檢查 `Completed This Session` / `Validation / QC` / `Next Priorities` / `Risks / Blockers` / `Next Session Opening Message`；`doctor` 只檢查 Kit-controlled 結構欄位與未解 placeholder 邊界，不以任意 handoff prose 推斷 full closeout 結論。已完成或已驗證的事項，不得在同一 handoff 中又以未解調查、待辦或下一次開工指令延續；除非明確改成 monitor-only、follow-up scope、blocked 或 reopened。 |
| 當前交接證據邊界 | 用 `doctor` 與 `qa:release` 負面 fixture 檢查一次性 release / build / QC / source evidence 不可進 Durable Anchors / Next Priorities / opening message；語意邊界由全面檢人工終讀。 |
| 收工三面同源 | 用 `qa:release` 檢查 runtime closeout 次序含「先重生並驗證 `START_NEXT_SESSION_PROMPT.txt`，再展示穩定 bootstrap 句」；人工終讀確認 final response 不是另一份手寫 stateful next-session prompt。 |
| 執行落差 | 檢查規則是否有 `doctor`、QA 腳本、負面測試或人工審閱承接；不得只增加提醒文字。 |
| 技能流程覆蓋 | 用核心規則、治理規則包與 QA 錨點確認外部技能流程只能作 subordinate evidence，不能讓 active root 跳過 handoff/log/index/registry 持久化。 |
| Rules / packs 路由與入庫範圍 | 每次 release 前確認 `runtime-core/RULE_PACKS.md` 有自然語言任務訊號到各 pack 的路由；每個 `packs/*.md` 都有 Scope / Load When / Rules / Checks / Closeout；`runtime-core/AGENTS.core.md` 與 `packs/agent-governance.md` 都要求可重用操作程序進既有 rule pack 或 registered reference，不可只放 handoff / log，也不可未分類就新建治理文件。 |
| 治理打通 | 每次 release 前確認 `runtime-core/RULE_PACKS.md` 可由「把文件接入 Agent Handoff Kit」/「掃描未接入 Agent Handoff Kit 的重要文件」/「治理打通」/ `bridge governance` / `connect this document to governance` / `scan for unbridged governance documents` 路由至 `agent-governance`；`packs/agent-governance.md` 有完整治理打通流程、輸出格式、not applicable 原因、bridged / partially bridged 判斷與重複真源風險邊界；README、intro、guide 均解釋用途、使用方法，以及不得自動刪除、重命名或合併真源。`qa:packs` 必須自動覆蓋 stock list、production guide / runbook、repo-wide scan、duplicate source-of-truth 四個情景。 |
| 任務持久化分流 | 每次 release 前確認 `runtime-core/AGENTS.core.md` 是唯一分流真源；`packs/agent-governance.md` 只引用核心 persistence gate、不複製門檻；README / intro / guide 不得把「任務完成」寫成「立即完整收工」，也不得把內部 persistence gate 術語當成新手說明。例行通過檢查、未拍板草稿、普通中途進度屬反向場景；新增或刪除文件、新來源、用戶要求把經驗轉成機制、分批新增產品目標 / 開發清單 / 驗收規則屬正向場景，必須按文件角色保存並收斂到單一當前任務契約。 |
| 跨 workspace 外部影響紀錄 | 每次 release 前確認 `runtime-core/AGENTS.core.md` 要求 expected root 以外的讀取、寫入、生成 artifact、push、publish 或 remote write 必須即時留下 External Impact Note；每個外部 target 一行；外部同步必須寫明種類與回讀驗證；不得掃描 sibling folders，不得自動寫目標 handoff，不得把紀錄當成 clean / stash / commit / push / publish / release 授權；目標 handoff 未更新、只讀內容被摘要或持久化、未回讀或未核實時都必須明說。 |
| 舊核心殘留 | 用升級負面測試確認舊版 `AGENTS.md` core 被替換而不是附加；`doctor` 必須擋下同一檔案內兩個 core runtime 標題。 |
| 升級路徑覆蓋 | `qa:upgrade` 必須含跨版本鏈式升級驗收（`v0.1.4` → `v0.1.5` → `v0.1.6` → 當前 HEAD），每跳用對應版本嘅 CLI 跑 `init`／`upgrade`／`doctor`，最後一跳用當前 HEAD 跑並 self-check 通過；同時必須含 upgrade quality matrix，確認版本 metadata、功能 anchor、post-upgrade `doctor` 穩定性三軸同時通過。 |
| 補丁前置狀態枚舉 | 每個 `R-XXX` 補丁必須明文列覆蓋與唔覆蓋嘅前置狀態枚舉，唔填唔放行。例：R-024 覆蓋「夾心 managed + stale」「legacy single core」「無 core」三態，唔覆蓋「managed marker 不成對」（屬 conflict，由人工處理）。 |
| CLI Output Contract 一致性 | 每次 release 前 sweep `bin/agent-handoff-kit.mjs`：（a）`init`／`upgrade`／`doctor` 完成輸出必含版本（v0.X.Y）、模式（mode）、剛完成（counts）、下一步四項；（b）禁忌用語清單命中 = 0（含「人話解讀」等自貶字眼）；（c）內部 action 名（create／merge／skip／conflict／status）保留唔變。 |
| GitHub Release body 固定結構 | 每次 release 前確認 `docs/whatsnew/vX.Y.Z.md` 已使用 `# vX.Y.Z` + 三個固定 H2（`本版新加了甚麼` / `對你已有檔案的影響` / `建議下一步`），並把 GitHub Release body 視為同一結構的外部呈現。若版本圖需要放入 Release，只可放在 `# vX.Y.Z` 後、第一個 H2 前，且只放用戶可理解的圖像本身，不寫圖解展示策略或維護口徑。每次 `gh release create` / `gh release edit` 後，維護者必須以 `gh release view vX.Y.Z --json name,body` 回讀核對；若 body 仍是舊 `## 用戶價值` 格式，即 release notes 未完成。 |
| SESSION_LOG handoff-role discipline（R-010）| 每次 release 前 grep `bin/agent-handoff-kit.mjs` 含 `assessSessionLogDiscipline` 函數 + doctor 集成；grep `runtime-core/AGENTS.core.md` closeout step list 含「closeout maintenance trigger check」+「Advance the SESSION_LOG N-rule」+「R-010 SESSION_LOG handoff-role discipline」+「10-closeout backstop」；grep `runtime-core/SESSION_LOG.md` template 含「Handoff role」blockquote 與 `Log maintenance` 觸發檢查欄。Fresh install + doctor 跑出「SESSION_LOG discipline (R-010): ok」（warn-only：N=11+ warn，doctor exit 不變 0）。 |
| Plan scope coverage matrix | 每次 release 嘅 plan 必明文列出三層 artifact families 嘅對齊範圍：（a）**Content layer** — `README.md` 版本字串 + `已正式發佈` 句、`CHANGELOG.md` prepend 新版本段、`package.json` version bump、`docs/qa/release-grade-qa.md` prepend 新版本「發佈狀態」段、對外 onboarding HTML（intro / guide）版本字串 + 任何因 release notes 觸發嘅描述更新；（b）**Script layer** — `scripts/check-release-readiness.mjs` 嘅 release baseline assertion + tarball name + README/CHANGELOG/release-grade-qa.md required string、`scripts/check-public-prototype.mjs` 嘅 tarball name + update notice mock newer version；（c）**Source layer** — `runtime-core/*.md` 嘅模板更新、`bin/agent-handoff-kit.mjs` 嘅功能改動、`packs/*.md` 嘅工作模式紀律。Plan 漏列任何 family 即視為 plan design gap，需 root-fix 或補 plan amend 後再 release。本維度由 v0.1.8 R-005 治理健康檢查（維護者側紀錄，2026-05-22）落地：v0.1.7 → v0.1.8 plan 初版漏咗 script layer，qa:release fail 揭發後加 root-fix（dynamic baseline refactor），令 script layer 之後自動同 package.json 對齊；future release plan 仍必明文列三層 families 做覆蓋自驗。 |
| Project Decisions discipline（R-028） | 每次 release 前須驗證：（a）`runtime-core/PROJECT_DECISIONS.md` template 含 4 個 H2 section heading 順序正確 + 檔頭 onboarding 句式，並定義 research-derived decision format：`Evidence chain: Source=source:<id>; Summary=<source finding>; Inference=<reasoning>; Decision impact=<what changed>; Uncertainty=<limits or none>.`；（b）`runtime-core/AGENTS.core.md` closeout maintenance trigger wording 命中（含「Maintain `dev/PROJECT_DECISIONS.md`」、「R-028 project narrative discipline」、4 個 H2 section name、硬觸發、語意觸發、10 次收工兜底，並要求研究導向長期決策使用同檔 evidence-chain format）；（c）`bin/agent-handoff-kit.mjs` mappings 含 `runtime-core/PROJECT_DECISIONS.md` → `dev/PROJECT_DECISIONS.md`；（d）`bin/agent-handoff-kit.mjs` requiredAnchors + schemaChecks 含 `dev/PROJECT_DECISIONS.md` rule + group；（e）Fresh install 後 `dev/PROJECT_DECISIONS.md` 存在且 doctor 「project decisions log structure」schema check pass；（f）若 `dev/PROJECT_DECISIONS.md` 出現 `research-derived` 或 `Evidence chain:` 條目，doctor 的 research decision trace checks 必須確認條目含 evidence chain，且 `Source=source:<id>` token 已在 `dev/PROJECT_INDEX.md` Fact Base 或 External Sources 登記；（g）Upgrade 既有專案後 `dev/PROJECT_DECISIONS.md` 自動建立（若不存在）或保留（若用戶已有 content），並保留研究導向決策 evidence chain。`npm run qa:release` 自動驗 (a)-(f)；(g) 由 `npm run qa:upgrade` mergeRoot / user-data scenario 驗。 |
| 書面語紀律（HTML 輸出） | 對外 onboarding HTML（`agent-handoff-kit-intro.html` + `agent-handoff-kit-guide.html`）必為繁體中文書面語，廣東口語字符（「嘅 / 咁 / 喺 / 揀 / 唔 / 乜 / 啱 / 嚟 / 咗 / 嗰」）grep 命中數必為 0。Release 前 `npm run qa:release` 自動驗。違反即視為 release artifact 質量落差，需逐句修正後再 release。 |
| Onboarding UX discipline（R-029） | 每次 release 前須驗證：（a）`packs/onboarding.md` template 含 7 個 H2 section（Scope / Load When / Discipline / Application Scenario Library / Cross-reference to guide.html / Tone Discipline / Closeout）+ 6 個 Scenario H3 + Anti-pattern table；（b）`runtime-core/AGENTS.core.md` `## 1. Startup Reads` 含 first-time-user signal detection wording + onboarding pack proactive load 紀律；（c）`runtime-core/RULE_PACKS.md` 含 onboarding signal routing row；（d）`bin/agent-handoff-kit.mjs` mappings 含 `packs/onboarding.md` → `dev/rules/onboarding.md`；（e）`bin/agent-handoff-kit.mjs` requiredAnchors + schemaChecks 含 onboarding pack rule + group；（f）Fresh install 後 `dev/rules/onboarding.md` 存在且 doctor schema check pass；（g）`npm run qa:packs` 嘅 onboarding routing scenario + first-time onboarding to first task mixed scenario 通過。`npm run qa:release` 自動驗 (a)-(f)；(g) 由 `qa:packs` 驗。 |
| Cross-surface wording alignment（R-029.1，v0.2.1 新加 dim；v0.3.19 更新） | v0.2.0 release ceremony 嘅 critical QC gap：plan scope coverage matrix 嘅三層（content / script / source）唔 cover cross-surface wording alignment。R-029 嘅 onboarding trigger phrase 跨 5 個 surface（CLI source + README + intro.html + guide.html + onboarding pack 自身），但 v0.2.0 release 時 CLI source 仍係 legacy wording 而其他 surface 已 update —— silent disconnect。v0.3.19 起 current public surface 改為短入口優先：`Start Agent Handoff` /「開工」是 AI 已在專案內的主入口，`Read AGENTS.md first, then Start Agent Handoff` 是 AI 尚未指向資料夾時的帶路徑 fallback；`scripts/check-release-readiness.mjs` 嘅 `checkCrossSurfaceWordingConsistency()` helper 自動 enforce 主入口、fallback、local-agent 支援邊界、收工入口與歧義保護喺 4 個 surface（bin + README + intro + guide）一致，並禁止舊長句或「固定開工句 / 貼回提示」回流。違反即 throw error，release 阻擋。 |
| Routing table propagation discipline（R-029.2，v0.2.1 新加 dim） | v0.2.0 既有 upgrade 紀律對 `dev/RULE_PACKS.md` 沿用 default `skip "preserve existing file"`，導致 v0.1.X 用戶 upgrade 後 routing table 仍係舊版（silent missing R-029 onboarding routing row）。Architectural reclassification：`dev/RULE_PACKS.md` 是 Kit 維護的 routing table，但升級仍須保留用戶自訂列。v0.2.1 起 `bin/agent-handoff-kit.mjs` `classifyExistingFile` 加 force-update merge logic；本修補起改為只補缺少的 Kit rows，不整份覆寫檔案。`scripts/check-upgrade-safety.mjs` chain test final hop 加 RULE_PACKS.md routing row 強制 assertion，並加 custom-row preservation regression。Doctor schema check 加 strict anchor enforce routing table 一致性。 |
| Upgrade migration safety from prior minor versions（R-030，v0.3.0 新加 dim） | v0.3.0 audit 揭發 systemic QC gap：`scripts/check-upgrade-safety.mjs` chain test fixture 只 cover `v0.1.4 → v0.1.5 → v0.1.6 → v0.1.7 → v0.1.8`，**跳過 v0.2.0 / v0.2.1 / v0.2.2 / v0.2.3 整個 state**，所以 v0.2.x → v0.3.0 嘅 upgrade-time migration / requiredAnchors propagation / user-data preservation 完全冇 automated test。v0.3.0 release Phase 5.5 🔴 全面檢 初版 audit miss 咗 5 個 upgrade pitfalls（External Sources 用戶 rows overwrite / doctor schema 7-col mismatch / v0.2.x doctor without upgrade fail / onboarding.md upgrade 後 doctor anchor fail / AGENTS.md managed-core R-030 propagation skip），由 Adam catch 才補。同類 pattern 同 v0.2.1 RULE_PACKS.md propagation gap 一致：每次 release reactive 發現，QC framework 唔自我擴展。v0.3.0 起 5 支柱 sustainable mechanism 落地：(P1) chain test extension —— chainSteps append 全部已 release minor / patch versions（v0.2.0 / v0.2.1 / v0.2.2 / v0.2.3），future release 必同步 append 新 tag；(P2) user-data-preservation regression fixture（`test-fixtures/user-data/`）—— PROJECT_INDEX 含用戶填過 External Sources / Fact Base / Workspace Identity 完整 rows，upgrade 後 8+ assertion 驗證 rows 全部 preserved；(P3) prior-version requiredAnchors propagation test —— chain final 後 explicit assert AGENTS.md 含當前 major release 新 anchors（譬如 v0.3.0「startup availability probe」/「dev/rules/integrations.md」/「Credential separation」）+ onboarding.md 含 Scenario F；(P4) docs/qa/release-grade-qa.md 加本 dim + Upgrade Migration Safety Sweep section；(P5) WORK AGENTS.md `## QC Trigger Vocabulary` 🔴 全面檢 條目加新 mandatory item + 長期記憶 codify。Future major bump 必 cover 呢 5 支柱，違反即視為 audit-time blind spot。 |
| CLI 場景分流（scenario branching）一致性（R-031.1，v0.3.1 新加 dim） | v0.3.1 第一個真實 v0.3.0 用戶 session 揭發 systemic QC gap：CLI output 喺唔同場景下重用同一 banner，未按場景分流。實際事故：upgrade 完成印「✅ 安裝完成」+ 推送新手起步句「I just installed agent-handoff-kit」；第二次 upgrade（零改動）仍跑完整 ceremony 寫 migration report + self-check doctor；doctor 結尾叫人「如要升級到較新版」但 startup `maybePrintUpdateNotice` 已印過更新通知。Root cause：既有 R-026 CLI Output Contract sweep helper 屬 **lexical / structural layer**（grep token 存在性 + R-026 contract 四項 + forbidden vocabulary），未 cover **semantic / scenario-fit layer**（同一字串喺場景 X 出現係咪事實正確 + 用戶可行動）。譬如「安裝完成」字串本身合法（唔屬 forbidden），但喺 upgrade no-op 場景印屬事實錯誤；grep miss 因為 grep 只 sweep token，唔 sweep 場景。 v0.3.1 起加新 dim「CLI 場景分流（scenario branching）一致性」+ 配套 CLI Scenario Branching Coverage Sweep（automated）。列舉七個 user-invocable 場景：(1) install fresh / (2) init with existing local rules（資料夾已有本地 AI 規則）/ (3) upgrade fresh substantive（首次升級含 create+merge）/ (4) upgrade no-op（已 latest 零改動）/ (5) upgrade with conflict / (6) doctor healthy & latest / (7) doctor healthy with newer available。每個場景定 output contract（must-have / must-not-have / context-appropriate），simulation 真實 invoke 驗收。同 5 支柱 sustainable QC 同層擴展。 |

### Handoff Lifecycle Consistency Sweep（v0.3.6 新加）

對應治理 QA 缺口矩陣「交接生命週期一致性」。`scripts/check-release-readiness.mjs` 必須同時驗證：

- 正常 closeout：`State Reconciliation Check` 的 stale snapshot、lifecycle conflict、opening message、next AI can continue 欄位全部通過。
- 負面反例：同一份 handoff 若在 `Completed This Session` / `Validation / QC` 寫明 `doctor` / `upgrade` 已完成，卻在 `Next Priorities` 或 opening message 要求下一輪重新調查同一件事，`isReconciledHandoff()` 必須回傳 false。
- `doctor` fresh install 仍須通過；新增欄位不得令空白模板或無矛盾 handoff 失敗。
- 當前交接只承載下一輪立即需要的 current state、next action、active risk 與 required reading；一次性 validation / build / upload / release evidence 留在 `dev/SESSION_LOG.md`，長期決策與研究推理進 `dev/PROJECT_DECISIONS.md`，可重用程序進 rule pack / registered reference。

### Upgrade Migration Safety Sweep（R-030，v0.3.0 新加 Sweep）

對應 7-dim 第七項 dim「Upgrade migration safety from prior minor versions」嘅 automated enforcement Sweep。`scripts/check-upgrade-safety.mjs` 強制 grep + assertion：

- (a) **Chain test 覆蓋全部 already-released minor / patch versions**：chainSteps array 含 v0.1.4 → v0.1.5 → v0.1.6 → v0.1.7 → v0.1.8 → v0.2.0 → v0.2.1 → v0.2.2 → v0.2.3 → v0.3.0 → v0.3.1 → v0.3.2 → v0.3.3 → v0.3.4 → v0.3.5 → v0.3.6 → v0.3.7 → v0.3.8 → v0.3.9 → v0.3.10 → v0.3.11 → v0.3.12 → v0.3.13 → v0.3.14 → v0.3.15 → v0.3.16 → v0.3.17 → v0.3.18 → v0.3.19 → v0.3.20 → v0.3.21 → v0.3.22 → v0.3.23 → v0.3.24。每次新 release 必 append 新 tag 至 array；下一個候選版本須把 v0.3.24 當作已發佈基線，再以 current HEAD 覆蓋候選版本，否則該 release 失「upgrade chain coverage from prior version」紀律；v0.3.6 起另由機器斷言候選 patch 版本不可漏上一個已發佈 patch tag。
- (b) **User-data-preservation regression fixture**：`test-fixtures/user-data/dev/PROJECT_INDEX.md` 含 Notion DB「Project Tasks」/ Drive「Project Files/」/ Linear「Project Backlog」/ Python 3.11 Stack / pytest QC commands / a1b2c3d Workspace Identity 等用戶填過 rows。chain test 之後 run upgrade，8+ assertion 驗證 rows 全部 preserved + Installed Integrations section 已 insert（non-destructive migration）。
- (c) **Prior-version requiredAnchors propagation test**：chain final 後 explicit assert AGENTS.md 含當前 major release 新 anchors（v0.3.0：「startup availability probe」/「dev/rules/integrations.md」/「Credential separation」）+ onboarding.md 含 Scenario F（v0.3.0 R-030 anchor）—— 確認 managed-core merge + smart-merge 對 v(N-1) state propagation 觸發。

違反任何 (a) / (b) / (c) 即 throw error，release 阻擋。

### CLI Scenario Branching Coverage Sweep（R-031.1，v0.3.1 新加 Sweep）

對應治理 QA 缺口矩陣第 9 項 dim「CLI 場景分流（scenario branching）一致性」嘅 automated enforcement Sweep。`scripts/check-release-readiness.mjs` 真實 invoke `bin/agent-handoff-kit.mjs` 喺各場景 fixture，並 assert output 嘅 must-have / must-not-have 規則：

**多情境 output contract（scenario 3 由 v0.3.4 起拆成 3a / 3b 兩條驗收路徑；v0.3.15 起補 3c lifecycle placeholder 路徑；v0.3.22 起補 4e handoff continuity auto-repair 路徑）**：

| # | 場景 | must-have（用戶必睇到） | must-NOT-have（避免事實錯誤） |
|---|---|---|---|
| 1 | install fresh（新目錄首次 init） | 「安裝完成」/「Start Agent Handoff」主入口 /「Read AGENTS.md first, then Start Agent Handoff」帶路徑 fallback /「普通 web chat AI」不支援邊界 /「下面這句不是終端機指令」 | 「升級完成」/「你已經是最新版本」/「Read AGENTS.md first. Then open START_NEXT_SESSION_PROMPT.txt」 |
| 2 | init with existing local rules（資料夾已有本地 AI 規則） | 「已補齊缺少檔案，但仍要檢查入口連接」/「upgrade --dry-run」/ 既有 `AGENTS.md` 保留 | 「乾淨首次安裝」起步句 / 覆寫既有規則 |
| 3a | upgrade metadata-only stale（結構已最新，只有 template version metadata 過期） | 「Kit 檔案已更新」/「版本詳情不在升級流程內展開」/ metadata 更新紀錄 / template version metadata 更新為當前版本 / doctor self-check 不再提示項目版本未對齊 /「升級驗收完成」 | 「你已經是最新版本，沒有檔案需要建立或合併」/「安裝完成」/「I just installed agent-handoff-kit. Help me get started.」/「本次升級涵蓋」（避免重做 onboarding 或在 CLI 內展開長篇 release notes） |
| 3b | upgrade structurally stale（真實舊版 fixture → 當前，含 create + merge） | 「Kit 檔案已更新」/「進行中的工作對話已熟悉 Agent Handoff Kit 可繼續使用原本開工方式」/「版本詳情不在升級流程內展開」/ template version metadata 更新為當前版本 /「升級驗收完成」 | 「安裝完成」/「I just installed agent-handoff-kit. Help me get started.」/「I just upgraded agent-handoff-kit」/「本次升級涵蓋」（避免重做 onboarding 或要求用戶在升級當刻讀長篇版本說明） |
| 3c | upgrade stale lifecycle placeholder（舊版本 metadata + 既有 lifecycle 欄位仍為 placeholder + handoff 已有 substantive Completed / Validation） | 「Kit 檔案已更新」/ `Reclassified at upgrade` /「升級驗收完成」/ template version metadata 更新為當前版本 | `missing dev/SESSION_HANDOFF.md (handoff lifecycle mechanical checks)` / `status: failed` /「交接狀態仍需 AI closeout 核對」/「本次升級涵蓋」（避免工具自己升級後又被自己擋住，亦避免升級成功輸出被 release notes 淹沒） |
| 4 | upgrade no-op（已 latest 零改動，交接健康） | 「你已經是最新版本，沒有檔案需要建立或合併」/ output 行數 ≤ 20 行 | 「安裝完成」/「升級完成」/「I just installed」/「I just upgraded」/「migration report」/「升級後自動檢查」 |
| 4b | upgrade no-op（已 latest 零改動，含任意 user-managed handoff prose） | 「你已經是最新版本，沒有檔案需要建立或合併」/「繼續日常使用即可」/ `doctor` `status: passed` / fixture bytes unchanged | 「完整 doctor 健康檢查未通過」/ `status: failed` / `handoff lifecycle mechanical checks` /「安裝完成」/「升級完成」/「I just installed」/「I just upgraded」/ `migration report` |
| 4c | upgrade substantive with stale prompt convenience copy（mac 用戶實測類型：正式 upgrade 合併 `AGENTS.md`，但 `START_NEXT_SESSION_PROMPT.txt` 是舊便利副本） | `START_NEXT_SESSION_PROMPT.txt` 便利副本落後只可 warning / 「升級驗收完成」 | `status: failed` / anchor checks failed / 正式 upgrade 後叫用戶回頭跑 `upgrade --dry-run` |
| 4d | upgrade anchor drift auto-repair（`dev/rules/safety.md` 缺 Kit 維護 anchor） | `dev/rules/safety.md` merge / `restore safety pack high-risk rules in ## Rules section` / `cmd /c rmdir` 被補回到 `## Rules` 語義位置 /「升級驗收完成」 | `anchor checks failed` /「不要重跑 upgrade」/ `Agent Handoff Kit Anchor Repair` / 把可自動補的 rules pack 缺段推給用戶手修 |
| 4e | upgrade handoff continuity anchor auto-repair（`dev/SESSION_HANDOFF.md` 缺 Kit 自己的 archive continuity 句） | `dev/SESSION_HANDOFF.md` merge / `insert handoff archive continuity rule` / `do not create an archive directory by default` 被補回 /「升級驗收完成」 | `anchor checks failed` /「不要重跑 upgrade」/ 把可自動補的 handoff template 缺段推給用戶手修 |
| 4f | upgrade no-op schema auto-repair（已 latest 零改動，但 opening message 缺 root mismatch guard） | `restore root mismatch guard in Next Session Opening Message` / `handoff opening message structure` / `If this root does not match the expected project root` / `status: passed` /「升級驗收完成」 | 「完整 doctor 健康檢查未通過」/ `status: failed` /「你已經是最新版本」成功句 /「繼續日常使用即可」/「安裝完成」/「升級完成」 |
| 4g | upgrade no-op temperature auto-repair（已 latest 零改動，但歷史 release / npm 證據污染熱層與 prompt mirror） | `move historical evidence out of hot handoff state` / `regenerate prompt from repaired handoff opening message` / `handoff temperature boundary checks` / `historical npm latest state` / `historical GitHub Release state` / `status: passed` /「升級驗收完成」 | 「完整 doctor 健康檢查未通過」/ `status: failed` /「你已經是最新版本」成功句 /「繼續日常使用即可」/「安裝完成」/「升級完成」 |
| 5 | upgrade with conflict | 「conflict」count > 0 / 「migration report」/「工具已停手，沒有覆寫」 | 「升級完成」 |
| 6 | doctor healthy & latest（已係最新版） | 「status: passed」/「檢查已通過」/「項目狀態速覽」/版本、上次收工、首次安裝距今三向狀態 | 「如要升級到較新版」/「繼續日常使用即可」（避免叫剛升完嘅用戶再升，亦避免把 doctor 健康輸出膨脹成安裝後新手指引） |
| 7 | doctor healthy with newer available | startup `maybePrintUpdateNotice` 嘅升級通知 / 「status: passed」 | doctor 結尾再講一次升級指令（避免 redundant） |

**Automated simulation 範圍（v0.3.1 first land；v0.3.4 split scenario 3；v0.3.8 add handoff no-op branch；v0.3.9 add affirmative lifecycle wording regression；v0.3.10 post-release debt cleanup add scenario 2 / 5 / 7；v0.3.13 add post-upgrade self-check UX scenarios 4c / 4d；v0.3.15 add scenario 3c stale lifecycle placeholder；v0.3.22 update 4d to anchor drift auto-repair + add scenario 4e handoff continuity auto-repair + add upgrade quality matrix；v0.3.24 add no-op full-doctor gate scenarios 4f / 4g；v0.3.54 aligns 4b to arbitrary handoff prose tolerance）**：場景 1 / 2 / 3a / 3b / 3c / 4 / 4b / 4c / 4d / 4e / 4f / 4g / 5 / 6 / 7 為 automated。場景 2 改以「已有本地 AI 規則的 init」表示真實可觸發的安裝邊界：`init` 不覆寫既有規則，而是補齊缺檔並指向 `upgrade --dry-run`。

場景 4b / 4c / 4d / 4f / 4g 是通用舊項目旅程，不綁定任何單一用戶目錄。真實項目只能作發現問題的證據；自動驗收必須用可重建 fixture 表達同類狀態，避免把個別專案文字硬寫成產品規則。

Upgrade quality matrix 屬 `qa:upgrade` 的多情境測試：每個可定位的 Kit 維護文字缺失，都要驗證 upgrade report、template version metadata、功能 anchor 的語義位置修復、post-upgrade `doctor` 四項同時通過；目前覆蓋 `dev/SESSION_HANDOFF.md`、`dev/SESSION_LOG.md`、`dev/PROJECT_DECISIONS.md`、`dev/rules/safety.md`、`dev/rules/integrations.md`、`dev/rules/onboarding.md`。這一組測試是版本、功能、穩定性三軸升級門檻，不是單一 bug regression；不得用檔尾裸字串 repair block 令 `doctor` 假性通過。

不可安全自動修補的負面情境同屬 `qa:upgrade` 必測：當高風險 pack 的語義 heading 被破壞、repair marker 殘缺、檔案不可讀寫或無法定位安全插入點時，`upgrade` 必須報 conflict / 停手，不可追加裸 anchor 文字，不可印「升級驗收完成」。

**未來新加 user-invocable surface 嘅紀律**：每加一個新 CLI sub-command 或新場景分流，必同步加 dim row + Sweep row + automated simulation；違反即視為 audit-time blind spot 重演（同 v0.3.0 R-030 5 支柱嘅 P4 紀律一致）。

### Rule Pack Routing And Durable-home Scope Sweep（v0.3.14 新增）

對應治理 QA 缺口矩陣「Rules / packs 路由與入庫範圍」。發佈前全面檢必須同時做機器錨點與人工語意審閱，確認 rules / packs 不是只有檔案存在，而是真的能引導 AI 從用戶自然語言進入正確工作模式與正確入庫位置。

`npm run qa:packs` 與 `npm run qa:release` 必須守住以下錨點：

- `runtime-core/RULE_PACKS.md` 有所有已發佈 pack 的自然語言任務訊號路由，並保留 minimum set / safety escalation / cannot weaken core safety 紀律。
- 標準 `packs/*.md` 有固定結構：Scope、Load When、Rules、Checks、Closeout；特殊 scenario / integration pack 若使用 Discipline / Scenario Library / Cross-reference 等結構，仍必須保留清楚的 Load When、可檢查規則與 Closeout。
- `packs/agent-governance.md` 明確要求：新增 durable workflow / runbook / instruction files 前，先分類 knowledge type，先找既有 home；可重用 operating procedures 屬於 relevant rule pack 或 registered reference；new runbooks are last resort only。
- `runtime-core/AGENTS.core.md` Persistence Gate 段明確要求：task 後先判斷 no persistence / lightweight checkpoint / full closeout；handoff / log 不足以承載 reusable procedure knowledge。
- `docs/qa/release-grade-qa.md` 本段與 Product Journey Matrix 都保留「Natural-language task → rule pack → durable home」檢查，令 full audit 報告必須對 rules / packs 路由給出結論。

人工審閱時，至少抽樣以下自然語言類型並標記 automated PASS / manual PASS / blocked：

| 自然語言任務類型 | 預期路由 | 入庫判斷 |
|---|---|---|
| 「幫我改 code / debug / 跑 test」 | coding；如有檔案破壞、package manager、API、deploy 風險再加 safety | 程式行為與命令地圖進 PROJECT_INDEX / DOC_SYNC；可重用開發程序才進 coding pack 或 registered reference |
| 「幫我查資料 / 比較方案 / 找最新資料」 | research；如涉及外部知識庫再加 knowledge / integrations | 來源與不確定性進 handoff/log；長期 reference map 進 PROJECT_INDEX；可重用研究流程進 research pack 或 registered reference |
| 「幫我寫文案 / 改 README / 統一語氣」 | writing / communication | 讀者口徑與格式規則進相應 pack 或 human document governance；不要只留在一次性回覆 |
| 「幫我同步 Notion / Drive / 知識庫」 | knowledge + integrations；有寫入或權限風險再加 safety | 外部真源與 sync obligation 進 PROJECT_INDEX / DOC_SYNC_REGISTRY；connector 程序進 integrations pack 或 registered reference |
| 「改 AI 規則 / handoff / closeout / tool-use」 | agent-governance + relevant domain pack | 先找既有 pack / registry / reference；新 governance doc 必須是 last resort 且 indexed |
| 「發佈 / tag / npm publish / hotfix」 | release + safety | 版本、commit、artifact、驗證證據進 release closeout；未經批准不得外部發佈 |
| 「我是新手 / 教我用 / 點開始」 | onboarding，再 transition 至 regular scenario pack | first-task scope 入 handoff；完成 onboarding 後 unload onboarding pack |

若 pack change 或 runtime routing change 未能通過以上機器錨點或人工抽樣，候選版本不得進入 publish。

### Governance Bridge Scenario Matrix Sweep（source-only candidate）

對應治理 QA 缺口矩陣「治理打通」。本掃描的目標是把原本可能落在人工 diff review 的判斷，轉成候選版本 full audit 必須引用的機器情景證據。

`npm run qa:packs` 必須自動驗證以下四個情景：

| 情景 | 必須證明 |
|---|---|
| new stock list source-of-truth | 「把文件接入 Agent Handoff Kit」與 `治理打通` 都能路由至 `agent-governance`；流程會檢查文件本身、`PROJECT_INDEX`、`DOC_SYNC_REGISTRY` 與重複真源風險；README / HTML 有可用示例。 |
| production guide / runbook | `connect this document to governance` 能路由至 `agent-governance`；流程會檢查相關 workflow / guide / runbook，並要求輸出具體 Acceptance。 |
| repo-wide unbridged document scan | 「掃描未接入 Agent Handoff Kit 的重要文件」與 `scan for unbridged governance documents` 都能路由至 `agent-governance`；掃描只列候選與缺口，不把普通文件當成錯誤。 |
| duplicate source-of-truth risk | 流程要求提出 merge / reference / retire 建議，但不得自動刪除、重命名、移動或合併真源。 |

輸出契約亦必須驗證：只有所有適用治理連結都存在才可報 `bridged`；如果只更新 `PROJECT_INDEX` 或 `SESSION_LOG`，必須報 `partially bridged`；任何略過層都要列為 `Not applicable` 並附原因。

`npm run qa:release` 必須反查本節、`scripts/check-pack-scenarios.mjs` 的四情景矩陣、`qa:upgrade` governance bridge migration fixture、README / intro / guide 用戶示例，以及「不要求 Adam 做人工 diff review」邊界。Full audit 報告若只寫治理打通 PASS 而沒有列出上述四情景證據，該候選版本不得進入 publish。

### Task Persistence Gate Sweep（source-only candidate）

對應治理 QA 缺口矩陣「任務持久化分流」。本掃描的目標不是要求每個任務都寫交接，而是防止 AI 在「過度治理」與「漏做治理」之間擺動。

`npm run qa:release` 必須守住以下錨點：

- `runtime-core/AGENTS.core.md` 是唯一分流真源，明確定義 durable fact、No persistence、Lightweight checkpoint、Full closeout，並列明文件角色：`SESSION_HANDOFF` / `SESSION_LOG` / `PROJECT_INDEX` / `DOC_SYNC_REGISTRY` / `PROJECT_DECISIONS` / rule pack。
- Full closeout 的 user-facing card 必須由 `closeout-status` 從既有 `SESSION_HANDOFF` 的 `Closeout outcome` 與 `Project-required persistence` 加上 fresh doctor / prompt-mirror readback 輸出；只有 `status: complete` 可顯示 `handoff saved`。`complete` 但 persistence `blocked` 的反例必須非零並顯示 `handoff blocked`，不得由正常 `doctor` 綠燈掩蓋。
- `packs/agent-governance.md` 只引用核心 persistence gate decision，不複製三層門檻，避免兩處規則漂移。
- README、intro.html、guide.html 對外只保留用戶操作語句，不把普通任務完成、草稿迭代或例行通過檢查寫成完整收工，也不把內部 persistence gate 術語寫成新手說明。
- 反向場景必須被守住：例行通過檢查不得觸發輕量保存；未拍板草稿不得觸發完整收工；普通任務完成但仍在同一對話繼續工作，不得重生 `START_NEXT_SESSION_PROMPT.txt`。
- 正向場景必須被守住：新增或刪除文件、新來源、本機或網址真源、不可重建的驗證結果、用戶要求把經驗轉成機制、代理可能中斷時尚未保存的 durable fact，必須按文件角色作輕量保存或完整收工。

人工終讀要抽樣至少三種場景並標記 automated PASS / manual PASS / blocked：圖片或文稿草稿未拍板、加入一個新的 URL / 本機來源、用戶指出 AI 錯誤並要求轉成長期機制。若任何示例令 AI 以為「每完成一小步都要完整 handoff」，候選版本不得進入 publish。

### Cross-workspace External Impact Note Sweep（source-only candidate）

對應治理 QA 缺口矩陣「跨 workspace 外部影響紀錄」與 Product Journey Matrix「Cross-workspace operation -> external impact note -> next session startup」。本掃描的目標不是建立跨 workspace log sync，而是防止 AI 在 active root 以外操作後，下一個 AI 因目標 handoff 未更新而誤判狀態。

`npm run qa:release` 必須守住以下錨點：

- `runtime-core/AGENTS.core.md` 含 `External Impact Note`、`expected project root`、`one concise note per external target`、`write another workspace's handoff without explicit authorization`、`clean, stash, commit, push, publish, or release`。
- 本文件含 expected root 以外的讀取、寫入、生成 artifact、push、publish 或 remote write，一目標一行，回讀驗證，目標 handoff 未更新，不得掃描 sibling folders，不得自動寫目標 handoff，不得推斷乾淨或同步完成。
- 人工終讀必須確認此規則保持簡化：不新增跨 workspace log sync，不新增新真源，不把 `DOC_SYNC_REGISTRY.md` 用作一次性事件 log。

### Npx Cold-start UX Sweep（v0.3.7 候選新加）

對應治理 QA 缺口矩陣「認知影響」與 Product Journey Matrix「Existing Kit files → official npx doctor path」。本缺口來自真實舊項目實測：目錄內已有舊版 Kit 文件，但執行裸 `npx ... doctor` 時，npm 仍先顯示 `Need to install the following packages`。用戶會合理理解成「doctor 正在安裝」，但實際上 `doctor` 尚未開始執行；npm 只是要先取得 CLI 工具。

`scripts/check-release-readiness.mjs` 必須守住以下口徑：

- README、CLI help / next-step output、`agent-handoff-kit-intro.html`、`agent-handoff-kit-guide.html` 的用戶示範命令須使用 `npx --yes @adamchanadam/agent-handoff-kit@latest ...`，避免裸 `npx ... doctor` 觸發誤導性確認提示。
- README 的手動入口與 CLI help 的 common entries 只列 `init` / `upgrade` / `doctor` 三個正式命令；`upgrade --dry-run` 只作「升級前預演」說明，不得放成舊版用戶的主入口或完成升級步驟。
- 裸寫不帶 `--yes` / `@latest` 的 `npx doctor` 不列為官方建議用戶路徑；它只是 npm 仍可接受的通用執行方式，不應為它另開產品旅程。
- README 必須明確說明兩層安裝：項目內 Kit 文件，與電腦用來執行指令的 npm CLI 工具。
- README 必須明確說明：即使目前資料夾已安裝舊版 Kit 文件，`npx` 仍可能因本機沒有可執行工具而先取得 package；這不等於 `doctor` 正在安裝或改動項目。
- CLI 可見輸出必須明確說明：`doctor` 只檢查，不會安裝或修改項目文件。

## 套件邊界

npm package 由 `package.json` 的 `files` 控制：

```json
[
  "bin/",
  "runtime-core/",
  "packs/",
  "README.md",
  "LICENSE"
]
```

`docs/whatsnew/` 是 repo / GitHub Release 發佈材料，不再屬於 npm package runtime 資料；`docs/qa/`、原始碼設計文件、`scripts/` 與 `test-fixtures/` 也都是原始碼倉庫資產。除非未來發佈明確改變套件邊界，否則不應出現在 `npm pack --dry-run` 輸出中。

## 目前基線

- `npm run qa:prototype` 已存在並通過。
- `npm run qa:packs` 已存在並通過，會檢查靜態規則包路由、安全升級與 mixed-scenario 分階段載入。
- `npm run qa:upgrade` 已存在並通過，會檢查初步 safe `AGENTS.md` merge、backup creation、conflict reporting 與 upgrade 後 `doctor`。
- `npm run qa:upgrade` 已補舊 Kit core 回歸守門：v0.1.3-style 與 v0.1.4-style 未標記 core 升級後，只能保留一個 `# Agent Handoff Kit Core Runtime`，並保留 core 前後的本地規則。
- `npm run qa:release` 已存在並通過，會串起三條既有驗收、驗證套件邊界、用真正 packed tarball 安裝後跑 prior-version upgrade smoke、文件錨點、較完整的 `doctor` schema 輸出，並執行從安裝到收工再到接力開工的多步驟用戶流程模擬。
- `doctor` 已檢查任務入口事實欄位：Fact Base、External Sources、Local QC Commands 與 Next Task Required Reading。
- `doctor` 已檢查 handoff 對賬欄位：Durable Anchors、Closeout-Reconciled State、Task Understanding Summary 與 State Reconciliation Check。
- `doctor` 已改以 handoff 語義標記為主要 schema 依據，英文段名只作預設模板與舊版本兼容。
- `doctor` 會檢查 `START_NEXT_SESSION_PROMPT.txt` 與 `dev/SESSION_HANDOFF.md` 的 fenced opening message 是否一致；安裝後與 closeout 後必須一致，session 進行中若只有便利副本落後，普通 `doctor` 只可警告，不可 fail。
- 安裝後指示已改為清楚分隔的中文下一步區塊，明確說明後續文字應貼到能讀寫本機專案資料夾的 AI agent 對話，不是在終端機繼續輸入；普通 web chat AI 若不能讀寫本機資料夾，不屬於支援場景。
- 套件預演目前維持 25 個 package files；`docs/whatsnew/v0.3.1.md` 至 `docs/whatsnew/v0.3.31.md` 保留在 repo 作 GitHub Release / changelog 材料，但不入 npm package；runtime 共用 prompt mirror helper 位於 `bin/`，`docs/qa/`、`scripts/` 與 `test-fixtures/` 不入包。
- 完整 section-aware merge 仍待補；非空既有專案 upgrade trial 已通過，正式發佈前仍須重跑或以等效臨時專案重驗。

## 發佈前人工審閱清單

本清單用來判斷是否可以進入候選發佈。勾完本清單仍不等於可以發佈；tag、GitHub Release、npm publish 或 release closeout 必須由使用者另行明確批准。

| 審閱面向 | 目前證據 | 候選發佈前判斷 |
|---|---|---|
| 發佈授權 | Adam 已明確批准 v0.3.32 commit / push / tag / GitHub Release / npm publish / 發佈後驗證；公開發佈已完成。 | 已完成 |
| 版本口徑 | `package.json` 目前為 `0.3.32`；v0.3.32 是 closeout semantic hardening 與 generated artifact governance root-fix 正式發佈版。 | 已發佈 |
| 公開名稱 | GitHub repo 為 `Adamchanadam/agent-handoff-kit`；npm package 為 `@adamchanadam/agent-handoff-kit`；CLI command 仍為 `agent-handoff-kit`。 | 已準備，publish 前須即時重驗 npm 名稱 |
| 套件邊界 | `package.json` `files` 包含 `bin/`、`runtime-core/`、`packs/`、`README.md`、`LICENSE`；`docs/whatsnew/` 不入 npm package；`npm pack --dry-run --json` 與 npm registry fileCount 均為 25 files。 | 通過 |
| 原始碼驗收 | `qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release` 已建立並通過；治理打通四情景、upgrade migration 與 full audit evidence contract 均已納入。 | 通過 |
| 非空既有專案升級 | 候選發佈準備重驗已通過：臨時非空專案保留既有 README、docs、src、notes、package 與本地規則；`AGENTS.md` 建立 backup 並合併 managed core；`doctor` 通過。 | 通過，發佈前如有 installer 改動須再重跑 |
| 完整 merge 能力 | 目前只有 `AGENTS.md` managed-core merge；完整 section-aware merge 尚未完成。 | 阻擋正式穩定版；可作 prototype / candidate 風險項 |
| 公開文件一致性 | README、package metadata、CHANGELOG、`docs/whatsnew/v0.3.32.md` 與 release-grade QA 已轉入 v0.3.32 正式發佈口徑；GitHub Release body contract 由 whatsnew schema 驗收。 | 通過 |
| 交接可靠性 | R-009、R-010、R-011 已納入 `doctor` / `qa:release`，包含必讀事實、狀態對賬、本地化 handoff 標題與交接生命週期一致性。 | 通過，但需人工確認語意無誤 |
| 安裝後可理解性 | R-013 已修補終端機成功提示與 README，用戶可分清終端機檢查與 AI 對話下一步。 | 通過，但發佈前需人工終讀 |
| 安全邊界 | safety pack、release pack 與核心安全底線均禁止未批准的 destructive / release / publish 行為。 | 通過，但需人工確認無放寬措辭 |
| 污染掃描 | `qa:prototype` 掃描 WORK 路徑、private repo 名稱、舊 opening marker、常見 secret pattern；subagent follow-up 後已重跑通過。 | 通過；若後續再改 source，publish 前須重跑 |
| GitHub / npm 發佈材料 | `CHANGELOG.md` 已新增 `v0.3.32` 段，`docs/whatsnew/v0.3.32.md` 已作 GitHub Release body；tag `v0.3.32`、GitHub Release 與 npm publish 已完成。 | 已完成 |
| 用戶安裝路徑 | README 保留正式 `npx --yes ...@latest` 安裝與檢查路徑；公開頁面版本已同步為 `v0.3.32`。 | 通過 |

## v0.3.38 發佈狀態

- release notes：`CHANGELOG.md` 的 `v0.3.38` 段落 + `docs/whatsnew/v0.3.38.md`。
- 發佈狀態：候選。目標是修補 v0.3.37 發佈後驗證揭出的 upgrade gap：舊項目 `AGENTS.md` 未必補入 full closeout 外部工具資源收口檢查。
- 發佈前驗收目標：`qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release` 全部 PASS；`v0.3.37` tag → `v0.3.38 current HEAD` upgrade path 通過；packed prior-version upgrade smoke 直接讀回 `AGENTS.md` closeout resource check；npm package fileCount 維持 25。
- 發佈後驗證目標：GitHub Release 非 draft / 非 prerelease；npm latest `0.3.38`、fileCount 25；published install、`--help`、`init`、`doctor`、以及 published v0.3.37 → v0.3.38 upgrade + sequential doctor + upgraded `AGENTS.md` 語意讀回通過。

### v0.3.38 發佈前全面檢正式結論

- 正式報告：`docs/qa/full-audit-v0.3.38-candidate.md`。
- 結論：PASS / 緊張 / 繼續。`qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release` 已通過；`v0.3.37` tag → `v0.3.38 current HEAD` upgrade path 已直接讀回 `AGENTS.md` closeout resource check。可進入 commit / public mirror / tag / GitHub Release / npm publish；發佈後仍須跑 artifact smoke，並再次驗證 published v0.3.37 → published v0.3.38 upgrade 後 `AGENTS.md` 語意讀回。

### v0.3.38 發佈後驗證正式結論

- GitHub Release：`v0.3.38` 非 draft / 非 prerelease，target `80385cff1ba9f243ef78079d759d7784b05de520`。
- npm registry：latest `0.3.38`，fileCount 25。
- Published package：實裝 `@adamchanadam/agent-handoff-kit@0.3.38` 後，`--help` 顯示 v0.3.38；fresh `init` / `doctor` PASS；installed `runtime-core/AGENTS.core.md` 和 fresh `AGENTS.md` 均含 `ownership-based external-tool resource closeout check`。
- Upgrade repair path：published v0.3.36 init 後 `AGENTS.md` 不含 closeout resource check；published v0.3.37 upgrade 後仍不含；published v0.3.38 upgrade 執行 1 個 `AGENTS.md` merge，doctor PASS，升級後 `AGENTS.md` 含 `ownership-based external-tool resource closeout check`。
- 結論：發佈檢 PASS；v0.3.38 可稱為 release-complete。v0.3.37 保留為已發布但未 release-complete 的歷史狀態。

### v0.3.38 QC gap backflow

- 產品缺口：v0.3.37 fresh install 正確，但舊項目 upgrade 可因 required-anchor 未更新而保留舊 `AGENTS.md`。
- QC 缺口：發佈後 smoke 只看 doctor PASS 不足夠；必須讀回 upgrade 後 `AGENTS.md` 的語意內容。
- 回流機制：`AGENTS.md` required anchors 加入 closeout resource check；`qa:release` packed prior-version upgrade smoke 直接 assert upgrade 後 `AGENTS.md` 含 `ownership-based external-tool resource closeout check`；`qa:upgrade` chain 加入 v0.3.37 tag hop。

### Cross-mind evidence 9-trigger table（v0.3.38）

| Trigger | Hit? | Decision | Evidence |
|---|---:|---|---|
| 1. 失敗或 blocker | yes | iterated | v0.3.37 post-publish smoke 揭出 upgrade 後 `AGENTS.md` 未補 closeout resource check。 |
| 2. 外部副作用 | yes | passed | 需要再發 v0.3.38；v0.3.37 不標示 release-complete。 |
| 3. 用戶可見輸出 | yes | passed | README / HTML / whatsnew / CHANGELOG 同步 v0.3.38，不把內部 smoke failure 詳情放入 README。 |
| 4. 複雜推理 / 多層取捨 | yes | passed | 區分 fresh install 正確、package 正確、舊項目 upgrade 未補三種不同狀態。 |
| 5. 安全或權限 | yes | passed | 繼續保留 ownership boundary，不把 closeout check 變成全機清理器。 |
| 6. 結論基於語意判斷而非單一 grep | yes | iterated | 必須讀回 upgrade 後 `AGENTS.md` 語意內容；doctor PASS 不足以證明 core 已補。 |
| 7. 舊用戶升級路徑 | yes | iterated | `v0.3.37` 加入 fixture generator 與 upgrade chain，current HEAD 改為 `v0.3.38`。 |
| 8. 真實用戶旅程 | yes | passed | 以「已裝 v0.3.37 的舊項目再升級」為驗收旅程。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明對應 required anchors、upgrade repair、packed prior-version smoke、post-publish upgraded file readback。 |

## v0.3.37 發佈狀態

- release notes：`CHANGELOG.md` 的 `v0.3.37` 段落 + `docs/whatsnew/v0.3.37.md`。
- 發佈狀態：已發佈，但發佈後驗證揭出舊項目 upgrade gap；不得稱為 release-complete。v0.3.38 接手修補。
- 發佈前驗收目標：`qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release` 全部 PASS；`v0.3.36` tag → `v0.3.37 current HEAD` upgrade path 通過；npm package fileCount 維持 25。
- 發佈後驗證目標：GitHub Release 非 draft / 非 prerelease；npm latest `0.3.37`、fileCount 25；published install、`--help`、`init`、`doctor`、以及 published v0.3.36 → v0.3.37 upgrade + sequential doctor 通過。

### v0.3.37 發佈前全面檢正式結論

- 正式報告：`docs/qa/full-audit-v0.3.37-candidate.md`。
- 結論：發佈後驗證未完成。GitHub tag / npm tarball 的 runtime core 正確，但 published v0.3.36 → v0.3.37 upgrade 後 `AGENTS.md` 沒有補入 closeout resource check；v0.3.38 修補。

### v0.3.37 QC gap backflow

- 產品缺口：v0.3.36 的 `integrations` / `safety` packs 已有資源生命週期治理，但 `runtime-core/AGENTS.core.md` 在正式 tag / npm latest 中未強制 full closeout 執行檢查。
- QC 缺口：source-only main 與 latest release artifact 的 runtime core 差異未被 release completion 問題及時攔截。
- 回流機制：v0.3.37 把 `v0.3.36` 轉成正式 prior-version tag hop，新增 `test-fixtures/v0.3.36`，並在 release-grade QA 內把 release artifact 中的 full closeout core rule 作為本版人工驗收點。

### Cross-mind evidence 9-trigger table（v0.3.37）

| Trigger | Hit? | Decision | Evidence |
|---|---:|---|---|
| 1. 失敗或 blocker | yes | iterated | 用戶追問後證實 latest release / npm package 沒有 full closeout core 強制步驟。 |
| 2. 外部副作用 | yes | passed | 修補需 commit / mirror / tag / GitHub Release / npm publish / 發佈檢；未完成驗收前不得宣稱 release-complete。 |
| 3. 用戶可見輸出 | yes | passed | README / HTML / whatsnew / CHANGELOG 同步 v0.3.37，但不把內部檢查噪音寫入 README。 |
| 4. 複雜推理 / 多層取捨 | yes | passed | 區分 public main source、GitHub tag、npm package 三層；補 runtime core 而不擴張成全機清理器。 |
| 5. 安全或權限 | yes | passed | 保留 ownership boundary；不明 / shared / other-agent-owned 資源仍需人工確認。 |
| 6. 結論基於語意判斷而非單一 grep | yes | passed | 驗收要同時讀 raw GitHub tag、npm tarball、runtime core closeout wording 與 prior-version upgrade path。 |
| 7. 舊用戶升級路徑 | yes | iterated | `v0.3.36` 加入 fixture generator 與 upgrade chain，current HEAD 改為 `v0.3.37`。 |
| 8. 真實用戶旅程 | yes | passed | 覆蓋用戶說「收工」時是否會自動進入外部工具資源收口檢查，而不是只在 pack 內被動存在。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明對應 runtime closeout core、integrations / safety pack 邊界、upgrade chain、package fileCount 與 release artifact readback。 |

## v0.3.36 發佈狀態

- release notes：`CHANGELOG.md` 的 `v0.3.36` 段落 + `docs/whatsnew/v0.3.36.md`。
- 發佈狀態：已正式發佈。Full-source release commit `232eed8`；public lean mirror commit `eab0eed` 已推送到 `main`；tag `v0.3.36` 已推送；GitHub Release 已建立；npm latest 為 `0.3.36`。
- 發佈前驗收：已通過。`qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release`、產品旅程矩陣、rules / packs routing、governance bridge contract、recommended-next-step contract 與 QC gap backflow 已完成。
- 發佈後驗證：已通過七項 artifact smoke：GitHub Release 非 draft / 非 prerelease；npm latest `0.3.36`、fileCount 25；published install 成功；published `--help` 顯示 v0.3.36；published `init` 成功；published `doctor` status passed；published v0.3.35 → v0.3.36 upgrade + standalone doctor 通過。

### v0.3.36 發佈前全面檢正式結論

- 正式報告：`docs/qa/full-audit-v0.3.36-candidate.md`。
- 結論：PASS / 緊張 / 繼續。Adam 已批准並完成 commit / public mirror push / tag / GitHub Release / npm publish；發佈後七項 artifact smoke 已通過，v0.3.36 可稱為 release-complete。

### v0.3.36 QC gap backflow

- Recommended next-step 消失問題：已轉成 runtime startup / handoff 欄位、communication pack 規則、upgrade migration 與 `qa:release` contract。
- 本機 governance-bridge skill 分裂風險：已合併到既有 `agent-governance` 規則包；不新增 public skill。
- 治理打通完成狀態過寬：已要求 `bridged` / `partially bridged` / `unbridged` / `blocked` 四態， skipped layers 必須列 `Not applicable` 原因。

### Cross-mind evidence 9-trigger table（v0.3.36）

| Trigger | Required | Result | Evidence |
|---|---|---|---|
| 1. 真實用戶問題或重複 AI 失誤 | yes | iterated | Adam 指出 handoff kit 使用一段時間後 recommended next step 會消失，並指出治理打通不應靠另一個本機 skill。 |
| 2. 影響 runtime、rule pack、QA 或 release gate | yes | iterated | runtime-core、communication pack、agent-governance pack、upgrade migration 與 release QA 同步修改。 |
| 3. 有無單一真源或重複真源風險 | yes | passed | governance bridge 併回 `agent-governance`，不新增 public skill；recommended next-step 以 runtime / handoff contract 為源。 |
| 4. 可否用現有 pack / registry / reference 承接 | yes | passed | `communication` 承接輸出紀律，`agent-governance` 承接治理打通，未新增 runbook。 |
| 5. 是否需要安全或權限邊界 | yes | passed | 候選不擴大 commit、push、tag、release、publish 權限；發佈動作仍需明確批准。 |
| 6. 版本、發佈或 package 邊界 | yes | iterated | package version、README、HTML version、CHANGELOG、whatsnew、release-grade status、fixture generator 與 upgrade final hop 對齊 v0.3.36。 |
| 7. 舊用戶升級路徑 | yes | iterated | `v0.3.35` 加入 fixture generator 與 upgrade chain，current HEAD 改為 `v0.3.36`。 |
| 8. 非機械式驗收需要 | yes | iterated | 全面檢需覆蓋產品旅程、rules / packs routing、governance bridge contract、recommended-next-step contract 與 QC gap backflow。 |
| 9. 膨脹與失焦風險 | yes | passed | 不新增 public governance-bridge skill；不新增 rule pack；只合併到既有 communication / agent-governance / QA gates。 |

## v0.3.35 發佈狀態

- release notes：`CHANGELOG.md` 的 `v0.3.35` 段落 + `docs/whatsnew/v0.3.35.md`。
- 產品範圍：外部工具資源生命週期治理。AI 使用 MCP / browser / plugin / node / Python helper 後，按 ownership 收尾；本任務擁有的資源可優雅關閉，shared / user-owned / other-agent-owned / system-level / unknown 資源只可回報證據與建議，未經確認不得終止、刪 cache、停用工具或改配置。
- 發佈狀態：已完成。Full-source local release commit `2e3c2d2`；lean public mirror commit `a8af281` 已推送到 public `main`；tag `v0.3.35` 已推送；GitHub Release `v0.3.35 - 外部工具資源收口` 已建立；npm `@adamchanadam/agent-handoff-kit@0.3.35` 已發佈為 latest，fileCount 25。
- 發佈前驗收：PASS。`qa:prototype`、`qa:packs`、`qa:upgrade` 與 `qa:release` 全部通過；`qa:upgrade` 已加入 `v0.3.34` real fixture 與 `v0.3.35 current HEAD` final hop；`qa:release` 已通過 packed prior-version upgrade smoke。
- 發佈後驗證：PASS 7/7。GitHub Release metadata 正確；npm latest / version 為 `0.3.35`，fileCount 25；published install、`--help`、`init`、`doctor` 通過；published v0.3.34 → v0.3.35 upgrade + sequential doctor 通過。

### v0.3.35 發佈前全面檢正式結論

- 正式報告：`docs/qa/full-audit-v0.3.35-candidate.md`。
- 結論：PASS / 緊張 / 繼續。
- 邊界：本結論已由正式發佈與發佈後七項 artifact smoke 補完；v0.3.35 目前可描述為 release-complete。

### v0.3.35 QC gap backflow

- 問題分類：外部工具 / MCP / plugin / browser resource lifecycle governance gap；真實使用中出現工具服務重複啟動、cache / tmp 膨脹與系統資源長期佔用。
- 既有缺口：只禁止 AI 未經確認 kill process / 刪 cache 會留下 overload；若一律允許清理，又會誤殺同機其他 AI agent 或使用者工具。
- 回流機制：規則改成 ownership-based cleanup；`integrations` 定義資源生命週期，`safety` 定義終止程序與清 cache 邊界，`qa:packs` / `qa:upgrade` / `qa:release` 守住 other-agent-owned 盲點。
- 保留邊界：不新增工具專屬清理表、不寫死 Adam 本機路徑或實例數字、不授權按 `node.exe` / MCP 名稱大範圍終止程序。

### Cross-mind evidence 9-trigger table（v0.3.35）

| Trigger | Required | Result | Evidence / decision |
|---|---|---|---|
| 1. 失敗或 blocker | yes | iterated | 真實 Codex Desktop / MCP 資源失控案例觸發；候選從「只回報不清理」修正為 ownership-based cleanup，避免 overload 長期存在。 |
| 2. 外部副作用 | yes | passed | 規則明確區分 task-owned 可優雅收尾，shared / user-owned / other-agent-owned / system-level / unknown 須先確認；發佈動作仍需另行批准。 |
| 3. 用戶可見輸出 | yes | passed | README、whatsnew、CHANGELOG 與 release-grade QA 均說明本版不會自動 kill process、刪 cache、停用工具或改配置。 |
| 4. 三個以上治理檔同步改動 | yes | iterated | runtime-core、integrations、safety、rule routing、QA scripts、upgrade fixtures 與發佈面同步；不新增 rule pack 或長期治理文件。 |
| 5. 規則或流程新增 | yes | passed | 新規則落在既有 integrations + safety 單一職責位置；治理 map / WORK 記錄只作狀態追溯，不成為 public runtime 真源。 |
| 6. 版本、發佈或 package 邊界 | yes | iterated | package version、README、HTML version、CHANGELOG、whatsnew、release-grade status、fixture generator 與 upgrade final hop 對齊 v0.3.35。 |
| 7. 安全、機密或權限 | yes | passed | 不讀取 credential、不保存機密；process / cache cleanup 以 ownership 與明確確認為邊界。 |
| 8. 真實用戶旅程 | yes | passed | 覆蓋 MCP / browser / plugin 使用後收尾、同機其他 AI agent 誤殺風險、cache 膨脹與 node helper 殘留回報路徑。 |
| 9. QC gap backflow | yes | iterated | 盲點已回流到 `qa:packs`、`qa:upgrade`、`qa:release` 與 live mock helper 壓力測試；全面檢須再確認無新阻擋。 |

## v0.3.34 發佈狀態

- release notes：`CHANGELOG.md` 的 `v0.3.34` 段落 + `docs/whatsnew/v0.3.34.md`。
- 產品範圍：WhatsApp-safe AI install prompt spacing。README、intro、guide、AI install page 與 release QA 均使用 `agent-handoff-kit-ai-install.html ，並...`，避免中文逗號貼住 URL。
- 發佈狀態：已完成。Full-source local release commit `a30c2a9`；lean public mirror commit `0116dfb` 已推送到 public `main`；tag `v0.3.34` 已推送；GitHub Release `v0.3.34 - 安裝提示轉發更穩` 已建立；npm `@adamchanadam/agent-handoff-kit@0.3.34` 已發佈為 latest，fileCount 25。
- 發佈前驗收：PASS。`qa:prototype`、`qa:packs`、`qa:upgrade` 與 `qa:release` 全部通過；`qa:upgrade` 已加入 `v0.3.33` real fixture 與 `v0.3.34 current HEAD` final hop。
- 發佈後驗證：PASS 7/7。GitHub Release metadata 正確；npm latest / version 為 `0.3.34`，fileCount 25；published install、`--help`、`init`、`doctor` 通過；published v0.3.33 → v0.3.34 upgrade + sequential doctor 通過。

### v0.3.34 QC gap backflow

- 問題分類：public onboarding / user-journey wording bug；WhatsApp forwarding 可把中文逗號誤併入 URL。
- 既有缺口：AI install page contract 檢查有確認 prompt 存在，但未守住 URL 與標點之間的社交轉發邊界。
- 回流機制：`scripts/check-release-readiness.mjs` 的 AI install page contract 改守新提示句；README / intro / guide / AI install page / release-grade QA / whatsnew 同步改用同一句。
- 保留邊界：不改 runtime 行為、不新增 rule pack、不把工具專屬指令寫入 Kit。
### Cross-mind evidence 9-trigger table（v0.3.34）

| Trigger | Required | Result | Evidence / decision |
|---|---|---|---|
| 1. 失敗或 blocker | yes | iterated | `qa:upgrade` 先擋住缺 `v0.3.33` real fixture；`qa:release` 先後擋住 public mirror file count、CHANGELOG、release-grade status 與本 9-trigger table，均已回流修正。 |
| 2. 外部副作用 | yes | passed | 本版將進行 commit / push / tag / GitHub Release / npm publish；發佈前記錄 release gate，發佈後必跑七項 `發佈檢`。 |
| 3. 用戶可見輸出 | yes | passed | README、intro、guide、AI install page 的可複製 prompt 均加入 URL 後空格；release-readiness 守住新句式。 |
| 4. 三個以上治理檔同步改動 | yes | iterated | public README / HTML / QA / whatsnew / scripts / fixtures 同步；WORK registered mirrors 完整複製 public HTML，避免 mirror drift。 |
| 5. 規則或流程新增 | no | passed | 不新增 runtime 規則、不新增 rule pack；只是公開提示文字與 QA 守門修補。 |
| 6. 版本、發佈或 package 邊界 | yes | passed | package version、README、HTML version、CHANGELOG、whatsnew、upgrade final hop、fixture generator 與 mirror count 對齊 v0.3.34。 |
| 7. 安全、機密或權限 | no | passed | 不涉及 credential、API token、權限變更或資料刪除；保留既有 release / publish 需明確批准邊界。 |
| 8. 真實用戶旅程 | yes | passed | 修補 WhatsApp 轉發時 URL 可能吃入中文逗號的真實分享路徑；新提示句可直接轉發給 AI。 |
| 9. QC gap backflow | yes | iterated | 由單句文字 bug 回流到 release-readiness AI install page contract、release-grade QA、whatsnew 與 WORK mirror diff-empty 驗收。 |
## v0.3.33 發佈狀態

- package version：`0.3.33`。
- release notes：`CHANGELOG.md` 的 `v0.3.33` 段落 + `docs/whatsnew/v0.3.33.md`。
- 發佈目標：修補外部工具使用時的盲猜風險；AI 使用 Notion、Google Drive、Obsidian、GitHub、Connector、MCP、CLI、API、URI 或 plugin API 前，必須先核對 current runtime schema、官方文件、官方型別 / sample，或有版本日期的本地 runbook。
- 發佈狀態：已完成。Full-source local release commit `4b318f0`；lean public mirror commit `78a6664` 已推送到 public `main`；tag `v0.3.33` 已推送；GitHub Release `v0.3.33 - 外部工具使用驗證` 已建立；npm `@adamchanadam/agent-handoff-kit@0.3.33` 已發佈為 latest，fileCount 25。
- 發佈前驗收：PASS。`qa:prototype`、`qa:packs`、`qa:upgrade` 與 `qa:release` 全部通過；`qa:upgrade` 已加入 `v0.3.32` real fixture 與 `v0.3.33 current HEAD` final hop。
- 發佈後驗證：PASS 7/7。GitHub Release metadata 正確；npm latest / version 為 `0.3.33`，fileCount 25；published install、`--help`、`init`、`doctor` 通過；published v0.3.32 → v0.3.33 upgrade + sequential doctor 通過。

### v0.3.33 QC gap backflow

- 產品缺口：AI 面對外部工具時可能用模型舊知識或舊例子猜 tool name、endpoint、CLI flag、URI param 或 plugin API，導致 unknown tool、invalid arguments、HTTP 400 / 404、permission / auth error 與反覆試錯。
- QC 缺口：既有 integrations discipline 主要防 credential leak、connector declaration 與 read-back verify，未把「首次使用或錯誤後重試前必須核對 current schema / official docs」變成 release anchor。
- 回流機制：v0.3.33 將 External Tool Usage Verification Gate 放入 integrations pack，knowledge / safety / onboarding 改引用通用門檻，release readiness 與 upgrade safety 加錨點與 legacy PROJECT_INDEX credential-reference migration。

### Cross-mind evidence 9-trigger table（v0.3.33）

| Trigger | Required? | Result | Evidence / rationale |
|---|---|---|---|
| 1. 失敗或 blocker | yes | iterated | 發佈前全面檢先阻擋未 versioned 的 v0.3.32 source candidate；候選補成 v0.3.33 後，`qa:upgrade` 又揭示缺 v0.3.32 real fixture，`qa:release` 揭示 public mirror count、release-grade status 與本 9-trigger table 缺口，均已回流修正。 |
| 2. 高風險 / 安全 / 發佈 | yes | passed | 本候選改外部工具使用門檻、credential reference、upgrade migration、release QA 與 fixture；Adam 已批准並完成 commit、push、tag、GitHub Release、npm publish 與發佈後驗證 7/7。 |
| 3. 用戶明確挑戰 | yes | passed | Adam 指出根因是 AI 不先查官方 / schema 而憑記憶試錯，且不可把 Notion / Drive / Obsidian / GitHub 固定指令寫入 Kit；本候選採通用 verification gate，不新增工具指令表。 |
| 4. 複雜推理 / 多層取捨 | yes | passed | 規則家放在 integrations pack；knowledge / safety / onboarding 只引用或調整示例；PROJECT_INDEX 只記 credential reference，不保存 credential value；未改 Kit 結構。 |
| 5. 跨檔 / 跨 surface 改動 | yes | iterated | 涉及 runtime core、PROJECT_INDEX、SESSION_HANDOFF、integrations / knowledge / safety / onboarding packs、CLI migration、QA scripts、README、CHANGELOG、whatsnew、HTML 版本標記與 fixture；已用版本掃描和 QA 對齊。 |
| 6. 結論基於語意判斷而非單一 grep | yes | passed | 候選不是只掃字串，而是把外部工具層分成 Connector / MCP schema、Plugin / Skill 指令、raw API / SDK / CLI / URI 官方文件、local app plugin API 與 versioned runbook。 |
| 7. 外部 AI / cross-mind review | no | passed | 本輪已有先前跨來源 research evidence 與本地 release QA；未把私有資料外送，也未要求新外部 review 才能完成候選補丁。 |
| 8. 真實用戶旅程 | yes | passed | README 說明 Notion / Google Drive 等外部工具要先核對 schema 或官方文件；upgrade 從 v0.3.32 tag 到 v0.3.33 current HEAD 並保留舊 PROJECT_INDEX 整合記錄。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 發佈聲明由 integrations gate、credential-reference schema、legacy migration recognizer、upgrade real fixture、release readiness anchors、pack routing與whatsnew / CHANGELOG / README 共同支撐。 |

## v0.3.32 發佈狀態

- package version：`0.3.32`。
- release notes：`CHANGELOG.md` 的 `v0.3.32` 段落 + `docs/whatsnew/v0.3.32.md`。
- 發佈目標：根治明確「收工」被 AI 降級成普通 summary-only 回覆，以及 AI 工作中生成 Markdown / durable artifact 後未入庫、未同步、未合併或未分類而形成 orphan 的問題。
- 發佈狀態：已完成。Full-source local release commit `ee92cfc`；lean public mirror commit `c8685f9` 已推送到 public `main`；tag `v0.3.32` 已推送；GitHub Release `v0.3.32 - 收工與文件入庫更可靠` 已建立；npm `@adamchanadam/agent-handoff-kit@0.3.32` 已發佈為 latest，fileCount 25。
- 發佈前驗收：PASS。`qa:prototype` orphan Markdown dry-run、`qa:packs`、`qa:upgrade` final doctor propagation、`qa:release` generated Markdown governance 正反 fixture、closeout semantic hardening 斷言、public mirror QA、packed prior-version upgrade smoke 均通過。
- 發佈後驗證：PASS 7/7。GitHub Release metadata 正確；npm latest / version 為 `0.3.32`，fileCount 25；published install、`--help`、`init`、`doctor` 通過；published v0.3.31 → v0.3.32 upgrade + sequential doctor 通過，且 doctor 顯示 `generated markdown governance checks: 1`。

### v0.3.32 QC gap backflow

- 產品缺口：v0.3.31 runtime 已有 closeout 規格，但真實長 session 中 AI 可把「收工」當普通總結；另有 generated Markdown orphan 依賴 AI 自律補登記，doctor 不會抓。
- QC 缺口：既有 QA 偏模板錨點、prompt mirror、schema 與 release journey，缺少「只輸入清楚收工不可 summary-only」與「未登記 generated Markdown 必須 fail」兩個真實語義 dry-run。
- 回流機制：v0.3.32 將 closeout phrase hardening 放入 runtime core；將 generated artifact governance 放入 runtime core、PROJECT_INDEX / DOC_SYNC_REGISTRY template、agent-governance / writing packs，並由 `doctor`、`qa:prototype`、`qa:release`、`qa:upgrade` 承接。

### Cross-mind evidence 9-trigger table（v0.3.32）

| Trigger | Required? | Result | Evidence / rationale |
|---|---|---|---|
| 1. 失敗或 blocker | yes | iterated | 真實使用暴露 summary-only closeout 與 generated Markdown orphan 兩類缺口；候選修補後，`qa:prototype`、`qa:upgrade`、`qa:release` 先後揭示 fixture、required anchor、版本 surface、mirror count 與 release-grade table drift，均已回流修正。 |
| 2. 高風險 / 安全 / 發佈 | yes | passed | 本候選改 runtime core、doctor、upgrade required anchors、規則包、PROJECT_INDEX / DOC_SYNC_REGISTRY template、QA scripts、fixture、README / HTML / whatsnew；Adam 已批准並完成 commit、push、tag、GitHub Release、npm publish 與發佈後驗證 7/7。 |
| 3. 用戶明確挑戰 | yes | passed | Adam 明確要求 root-fix，並提醒 public 必須通用、跨 OS、跨專案、不可錨定單一 chat log；本候選以抽象 dry-run fixture 與版本 tag fixture 驗收，不寫入特定專案路徑、commit、文檔題材或 chat log 內容。 |
| 4. 複雜推理 / 多層取捨 | yes | passed | 將 closeout semantic hardening、generated artifact governance、long-term governance routing、governance bridge 與 one rule one place 分層處理；新增規則落在 runtime / pack / template / doctor / QA 對應層，不把一次性案例做成專案特例。 |
| 5. 跨檔 / 跨 surface 改動 | yes | iterated | 涉及 npm CLI、runtime core、template、rule packs、release QA、upgrade fixtures、public mirror、README、intro / guide / AI install HTML、CHANGELOG 與 whatsnew；已用版本 surface grep、public mirror count、package boundary 與 upgrade chain 對齊。 |
| 6. 結論基於語意判斷而非單一 grep | yes | iterated | orphan 修補由 `doctor` 掃描常見 generated artifact families 並要求 indexed / synced / classified；`qa:prototype` 用未登記 `outputs/unregistered_design.md` 負例，`qa:release` 同時驗未登記 fail、登記 pass。 |
| 7. 外部 AI / cross-mind review | no | passed | 本輪用真實 registry / tag 查證、public source dry-run、升級鏈與 package smoke 已足以定位；沒有把私有專案內容外送或寫入 public。 |
| 8. 真實用戶旅程 | yes | iterated | 覆蓋 fresh install → doctor → generated Markdown orphan fail、existing v0.3.31 project → v0.3.32 current-head upgrade、packed prior-version upgrade smoke、clear closeout phrase runtime contract 與 public onboarding 版本同步。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 發佈聲明由 runtime anchors、requiredAnchors propagation、doctor generated markdown governance check、orphan positive / negative fixtures、upgrade chain、public mirror、package smoke、release note schema 與人工 QA checklist 共同支撐。 |

## v0.3.31 發佈狀態

- package version：`0.3.31`。
- release notes：`CHANGELOG.md` 的 `v0.3.31` 段落 + `docs/whatsnew/v0.3.31.md`。
- 發佈目標：加入跨 workspace External Impact Note、shell / script parser failure discipline、長輸出讀取防護、舊 safety pack 語義修復、public mirror / SEO / 用戶入口瘦身 QA。
- 發佈狀態：發佈前全面檢 PASS；尚未 commit、push、tag、建立 GitHub Release 或 npm publish。
- 發佈前驗收：PASS；`qa:upgrade`、`qa:public-mirror`、`qa:release` 均已通過；正式發佈仍須使用者明確批准。
- 發佈後驗證：未適用 — 尚未發佈。

### v0.3.31 發佈前全面檢正式結論

- 正式報告：`docs/qa/full-audit-v0.3.31-candidate.md`。
- 全面檢結論：PASS；尚未取得 commit / push / tag / GitHub Release / npm publish 批准。
- 治理健康總判定：緊張；建議方向：繼續。
- Product Journey Matrix：PASS；fresh install、AI install page、existing project upgrade、anchor drift auto-repair、public mirror、doctor lifecycle、rules / packs routing 均已覆蓋。
- Rules / packs routing 結論：PASS；External Impact Note 在 core，parser failure discipline 在 safety pack，public mirror QA 留在 maintainer QA，不新增第二 rule home。
- QC gap backflow 結論：PASS；v0.3.30 fixture、External Impact Note propagation、parser failure migration、public mirror count、release-grade latest table 均已轉成自動驗收或正式 checklist。

### Cross-mind evidence 9-trigger table（v0.3.31）

| Trigger | Required? | Result | Evidence / rationale |
|---|---|---|---|
| 1. 失敗或 blocker | yes | iterated | `qa:upgrade` 先後揭示缺 `v0.3.30` fixture、`External Impact Note` 未列 required anchor、測試 helper 名稱錯誤；均已按根因修補並重跑。 |
| 2. 高風險 / 安全 / 發佈 | yes | iterated | 本候選改 runtime core、safety pack、installer anchors、upgrade chain、public mirror QA、README / Pages 與發佈文件；commit / tag / publish 仍需另行批准。 |
| 3. 用戶明確挑戰 | yes | passed | Adam 要求跨 workspace 更新要有 QC 條件，並要求 shell/parser 與長文件截斷問題納入治理；本候選已轉成 runtime / safety / QA 機制。 |
| 4. 複雜推理 / 多層取捨 | yes | passed | 將一次性 session log、public runtime rule、WORK-only lesson 與 release QA 分層處理；session log 只作 evidence，不作通用規則真源。 |
| 5. 跨檔 / 跨 surface 改動 | yes | iterated | 涉及 npm runtime、public docs、GitHub Pages、release QA、upgrade fixtures、public mirror 與 WORK 治理記錄；已用 `qa:upgrade`、`qa:public-mirror`、`qa:release` 分段驗收。 |
| 6. 結論基於語意判斷而非單一 grep | yes | iterated | parser failure 不只靠文字命中，另驗證 syntax-only check、minimal reproducible script、read-back affected ranges、safe semantic repair 與 unsafe conflict。 |
| 7. 外部 AI / cross-mind review | no | passed | 本輪先前已用子代理 / dry-run 審過方案；本候選不把再次外部 AI review 設為發佈阻擋，除非全面檢另發現語意缺口。 |
| 8. 真實用戶旅程 | yes | iterated | 覆蓋舊項目由 `v0.3.30` 升級到 current head、public mirror fresh init / doctor / upgrade no-op、跨 workspace closeout note 與非技術用戶入口版本同步。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 發佈聲明由 runtime anchors、safety pack scenario、upgrade chain、public mirror shape、package boundary、Pages 版本與 release-grade QA 狀態共同支撐。 |

## v0.3.30 發佈狀態

- package version：`0.3.30`。
- release notes：`CHANGELOG.md` 的 `v0.3.30` 段落 + `docs/whatsnew/v0.3.30.md`。
- 發佈目標：修補長任務中途追加需求時的任務契約漂移；降低健康檢查與 no-op upgrade 成功後把普通任務完成誤導成完整收工的風險；補 README / guide 對 AI 工作規則的用戶向說明。
- 發佈狀態：已發佈；release source commit `32983b8`，tag `v0.3.30` 已推送，GitHub Release `v0.3.30 - 長任務要求不再散落` 已建立，npm latest 是 `0.3.30`。
- 發佈後驗證：PASS 7/7；GitHub Release metadata、npm latest / fileCount、published install、published `--help`、published `init`、published `doctor`、published v0.3.29 -> v0.3.30 upgrade smoke + doctor 均已通過。

### v0.3.30 發佈前全面檢正式結論

- 正式報告：`docs/qa/full-audit-v0.3.30-candidate.md`。
- 全面檢結論：PASS；已取得 Adam 明確批准並完成 commit / push / tag / GitHub Release / npm publish。
- 治理健康總判定：緊張；建議方向：繼續。
- Product Journey Matrix：PASS；fresh install、existing project upgrade、long-task task-contract change、doctor healthy / no-op upgrade、package boundary、new-user README / guide read-through 均已覆蓋。
- Rules / packs routing 結論：PASS；任務契約變更承接在既有 core runtime + `agent-governance` pack，未新增 public 七類驗收或 quality pack。
- QC gap backflow 結論：PASS；任務契約漂移、收工提示過密、舊用戶升級傳播、public runtime 七類驗收邊界均已有產品修補或 release QA 承接。

### v0.3.30 發佈後驗證

| 發佈後檢查 | 結果 | 證據 |
|---|---|---|
| GitHub Release metadata | PASS | `gh release view v0.3.30` 回報 tag `v0.3.30`，非 draft，非 prerelease。 |
| npm latest / fileCount | PASS | `npm view @adamchanadam/agent-handoff-kit version dist-tags.latest dist.fileCount --json` 回報 version `0.3.30`、latest `0.3.30`、fileCount `25`。 |
| Published package temporary-prefix install | PASS | `npm install --prefix <tmp> @adamchanadam/agent-handoff-kit@0.3.30` 成功。 |
| Published `--help` | PASS | 由 temporary-prefix 安裝出的 package 內 `bin/agent-handoff-kit.mjs --help` 顯示 `v0.3.30`。 |
| Published `init` | PASS | published package `init --yes --root <tmp>` 成功建立 root 與 `AGENTS.md`。 |
| Published `doctor` | PASS | published package `doctor --root <tmp>` exit 0 並回報 `status: passed`。 |
| Previous published version -> new published version upgrade smoke | PASS | published v0.3.29 package 建立 root，published v0.3.30 package 執行 `upgrade --yes`，再執行 v0.3.30 `doctor`；upgrade 與 doctor 均 exit 0，doctor 回報 `status: passed`。 |

### Cross-mind evidence 9-trigger table（v0.3.30）

| Trigger | Required? | Result | Evidence / rationale |
|---|---|---|---|
| 1. 失敗或 blocker | yes | iterated | 用戶指出長任務中分批新增需求會散落到不同文檔，造成唯一真源漂移；同時指出 handoff / log 過度寫入會污染狀態。 |
| 2. 高風險 / 安全 / 發佈 | yes | iterated | 本輪改 runtime core、CLI 提示、agent-governance pack、README / guide 與 release QA；正式發佈前必跑全面檢，且 commit / tag / publish 需另行批准。 |
| 3. 用戶明確挑戰 | yes | passed | Adam 明確挑戰七類驗收是否應進 public runtime；最終決策是不新增 public 七類驗收，本候選只保留任務契約與收工提示修補。 |
| 4. 複雜推理 / 多層取捨 | yes | passed | 將「任務契約收斂」與「七類驗收」分開：前者是 handoff runtime 必要連續性修補，後者只留 WORK / 維護者發佈前治理。 |
| 5. 跨檔 / 跨 surface 改動 | yes | iterated | README、guide、runtime core、CLI、agent-governance pack、release QA、upgrade safety chain、CHANGELOG、whatsnew 均有對齊；intro / AI install page 只做版本口徑更新。 |
| 6. 結論基於語意判斷而非單一 grep | yes | iterated | 除 grep anchor 外，全面檢須覆蓋任務契約普通流程、分批追加極端流程、no-op upgrade、doctor healthy、新手理解與既有驗收真源保留。 |
| 7. 外部 AI / cross-mind review | no | passed | 本輪已用多輪子代理與本地 dry-run 審過 public runtime 邊界；正式候選不把外部 AI review 設為必要阻擋項。 |
| 8. 真實用戶旅程 | yes | iterated | 新手仍只需用自然語言講目的；AI 遇到長任務追加要求時負責收斂任務契約，不要求用戶學會內部檔案分類或七類驗收。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 發佈聲明須由 runtime anchor、pack routing、CLI scenario、upgrade chain、README / guide 可讀性、package boundary 與 full-audit report 共同支撐。 |

## v0.3.29 發佈狀態

- package version：`0.3.29`。
- release notes：`CHANGELOG.md` 的 `v0.3.29` 段落 + `docs/whatsnew/v0.3.29.md`。
- 發佈目標：新增 AI-readable install page，讓非技術用戶可叫 AI 讀頁後在目前資料夾判斷安裝或升級；同時把長期治理入庫與文件接入 Agent Handoff Kit 分開驗收。
- 發佈狀態：已 commit、push、tag、建立 GitHub Release，並已 npm publish。Release source / tag：`bedbe6f`。
- 發佈後驗證：PASS 7/7。GitHub Release metadata 正確；npm latest / version 為 `0.3.29`，fileCount 25；published install、`--help`、`init`、`doctor` 通過；published v0.3.28 → v0.3.29 upgrade + sequential doctor 通過。

### v0.3.29 發佈前全面檢正式結論

- 正式報告：`docs/qa/full-audit-ai-install-long-term-governance-candidate-2026-06-18.md`。
- 全面檢結論：PASS；可進入 commit / push / tag / GitHub Release / npm publish。
- 治理健康總判定：緊張；建議方向：繼續。原因是本輪跨 README、HTML、規則包與 QA 腳本，但沒有新增第二套治理真源。
- Product Journey Matrix：fresh install、AI-assisted install page、existing upgrade、official npx doctor path、conflict stop、rule pack routing、governance bridge、long-term governance routing、package boundary 均為 automated PASS 或 manual PASS。
- Governance Bridge boundary：文件接入 Agent Handoff Kit 維持文件 orphan 原意；非文件長期規則、錯誤經驗、API / MCP / tool-use pattern 走 long-term governance routing。
- Rules / packs routing 結論：PASS。AI 安裝操作真源在 HTML；長期治理入庫真源在 `agent-governance` pack；`RULE_PACKS` 只做自然語言路由。
- QC gap backflow 結論：PASS。終端機優先舊語句、長期治理只留 session log / handoff、文件接入語義擴張三類風險均已轉成自動驗收或 release contract。

### Cross-mind evidence 9-trigger table（v0.3.29）

| Trigger | Required? | Result | Evidence / rationale |
|---|---|---|---|
| 1. 失敗或 blocker | yes | iterated | 用戶指出新手安裝方式應由 AI 讀專用頁，而不是要求用戶自行讀 README 後開 terminal；後續全面檢又發現舊 terminal-first wording 需轉成 QA guard。 |
| 2. 高風險 / 安全 / 發佈 | yes | passed | 本輪涉及 commit、GitHub Release、npm publish 與 post-publish verification；發佈前以 full audit、四條 QA 與 package smoke 承接。 |
| 3. 用戶明確挑戰 | yes | passed | Adam 明確要求保留「接入 Agent Handoff Kit」的文件 orphan 原意，並把非文件長期規則另走長期治理入庫。 |
| 4. 複雜推理 / 多層取捨 | yes | passed | 選擇不擴張 Governance Bridge 語義；AI install page 作操作入口，long-term governance routing 作治理入庫，兩者各有單一真源。 |
| 5. 跨檔 / 跨 surface 改動 | yes | passed | README、intro HTML、guide HTML、AI install HTML、RULE_PACKS、agent-governance pack、QA scripts、release-grade QA、CHANGELOG、whatsnew、fixture chain 已同步。 |
| 6. 結論基於語意判斷而非單一 grep | yes | passed | `qa:packs` 覆蓋 long-term governance 三種語意情景；`qa:release` 覆蓋 AI install page contract、npx UX、terminal-first drift guard 與 durable-home sweep。 |
| 7. 外部 AI / cross-mind review | no | passed | 本輪主要依用戶產品判斷、repo 真源、full audit 與機器驗收；沒有把外部 AI review 當作發佈阻擋條件。 |
| 8. 真實用戶旅程 | yes | passed | 非技術用戶只需貼一句 AI-readable install prompt；AI 必須先確認資料夾，判斷 init / upgrade / conflict stop / doctor，然後回到 Start Agent Handoff。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明由 AI install page、README / HTML surface、rule pack routing、upgrade chain、package boundary、full-audit report 與 post-publish smoke path 共同支撐。 |

## v0.3.28 發佈狀態

- package version：`0.3.28`。
- release notes：`CHANGELOG.md` 的 `v0.3.28` 段落 + `docs/whatsnew/v0.3.28.md`。
- 發佈目標：把「把文件接入 Agent Handoff Kit」與「掃描未接入 Agent Handoff Kit 的重要文件」正式納入 public runtime 觸發語，同時保留「治理打通」與英文入口。
- 發佈狀態：已發佈並完成發佈後驗證；已由 v0.3.29 候選取代為下一個發佈目標。
- 發佈後驗證：已通過七項發佈檢。

### v0.3.28 發佈前全面檢正式結論

- 正式報告：`docs/qa/full-audit-v0.3.28-candidate.md`。
- 全面檢結論：PASS；已完成發佈。
- 治理健康總判定：健康；建議方向：繼續。原因是本輪只新增更直白的觸發語與展示修正，不增加日常開工負擔，也不新增第二套治理真源。
- Product Journey Matrix：fresh install、existing upgrade、official npx doctor path、non-empty local rules、conflict stop、rule pack routing、governance bridge 均為 automated PASS。
- Governance Bridge Scenario Matrix：stock list、production guide / runbook、repo-wide scan、duplicate source-of-truth 四個情景均有新版中文觸發語與舊觸發語 automated PASS 證據。
- Rules / packs routing 結論：PASS。新版中文觸發語仍落在既有 `agent-governance` pack；`RULE_PACKS` 只做自然語言路由。
- QC gap backflow 結論：PASS。文案可讀性、runtime 觸發語支援、upgrade 舊列補新觸發語、intro highlight 無效問題均已轉成自動驗收或 release contract。

### Cross-mind evidence 9-trigger table（v0.3.28）

| Trigger | Required? | Result | Evidence / rationale |
|---|---|---|---|
| 1. 失敗或 blocker | yes | iterated | 用戶在瀏覽器截圖指出 intro HTML 說明錯誤、highlight 無效，並要求新觸發語真正支援。 |
| 2. 高風險 / 安全 / 發佈 | yes | passed | runtime 觸發語改動會影響 npm latest，必須做 patch release 而非只改 README / HTML。 |
| 3. 用戶明確挑戰 | yes | passed | Adam 明確要求 public 版保留「治理打通」並支援新版直白觸發語。 |
| 4. 複雜推理 / 多層取捨 | yes | passed | 選擇將新語句合併到既有 `agent-governance` workflow 與 `RULE_PACKS` 路由，不新增第二真源。 |
| 5. 跨檔 / 跨 surface 改動 | yes | passed | runtime route、pack workflow、CLI schema / migration、README、HTML、QA scripts、release-grade QA、whatsnew、full audit report 已同步。 |
| 6. 結論基於語意判斷而非單一 grep | yes | passed | `qa:packs` 驗證新舊入口；`qa:upgrade` 驗證舊路由列遷移；`qa:release` 驗證 cross-surface contract。 |
| 7. 外部 AI / cross-mind review | no | passed | 本輪是用戶在實際瀏覽器畫面發現 UX / 文案缺口，未需外部 AI review；以本地檔案斷言與 release QA 取代外部 review。 |
| 8. 真實用戶旅程 | yes | passed | 新手可說「把 <檔案> 接入 Agent Handoff Kit」或「掃描未接入 Agent Handoff Kit 的重要文件」；舊入口仍保留。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明由 route、workflow、upgrade migration、四情景矩陣、public docs 與 full-audit report 共同支撐。 |

## v0.3.27 發佈狀態

- package version：`0.3.27`。
- release notes：`CHANGELOG.md` 的 `v0.3.27` 段落 + `docs/whatsnew/v0.3.27.md`。
- 發佈目標：新增「治理打通」標準能力，讓重要文件、真源、runbook、workflow、checklist 或 repo-wide 未接合候選能接入 `PROJECT_INDEX`、`DOC_SYNC_REGISTRY`、相關 workflow、handoff / log 角色與重複真源風險檢查。
- 發佈狀態：候選準備完成。尚未 commit、push、tag、建立 GitHub Release 或 npm publish。
- 發佈後驗證：未執行；須於 GitHub Release 與 npm publish 完成後跑七項發佈檢。

### v0.3.27 發佈前全面檢正式結論

- 正式報告：`docs/qa/full-audit-v0.3.27-candidate.md`。
- 全面檢結論：PASS；可進入 commit / push / tag / GitHub Release / npm publish。
- 治理健康總判定：緊張；建議方向：繼續。原因是本輪新增標準治理能力與升級遷移，觸及跨 session continuity 核心，但採按需觸發，不增加日常開工必讀負擔。
- Product Journey Matrix：fresh install、closeout handoff、existing upgrade、official npx doctor path、non-empty local rules、conflict stop、rule pack routing、governance bridge 均為 automated PASS。
- Governance Bridge Scenario Matrix：stock list、production guide / runbook、repo-wide scan、duplicate source-of-truth 四個情景均有 automated PASS 證據；不要求 Adam 做人工 diff review。
- Rules / packs routing 結論：PASS。治理打通落在既有 `agent-governance` pack；`RULE_PACKS` 只做自然語言路由，不新增第二份治理真源。
- QC gap backflow 結論：PASS。重要文件孤兒風險、舊用戶遷移缺口、人工 diff review 替代方案均已轉成自動驗收或 full audit evidence contract。

### Cross-mind evidence 9-trigger table（v0.3.27）

| Trigger | Required? | Result | Evidence / rationale |
|---|---|---|---|
| 1. 失敗或 blocker | yes | iterated | 實際長期 workflow 存在新真源、新 runbook 或清單只在局部保存的文件孤兒風險。 |
| 2. 高風險 / 安全 / 發佈 | yes | passed | Adam 明確要求繼續做全面檢、版本收口與發佈；發佈前機器驗收已通過，發佈後仍須跑發佈檢。 |
| 3. 用戶明確挑戰 | yes | passed | Adam 要求不做人工 diff review，改由 QC 機制驗收；四情景矩陣與 full audit evidence contract 已落地。 |
| 4. 複雜推理 / 多層取捨 | yes | passed | 最終方案採既有 `agent-governance` pack + `RULE_PACKS` 路由 + upgrade migration，不新增平行治理技能或第二真源。 |
| 5. 跨檔 / 跨 surface 改動 | yes | passed | runtime route、pack workflow、CLI schema / migration、README、HTML、CHANGELOG、whatsnew、QA scripts 與 release-grade QA 已同步。 |
| 6. 結論基於語意判斷而非單一 grep | yes | passed | `qa:packs` 模擬四個使用情景；`qa:upgrade` 測舊用戶遷移；`qa:release` 反查 full audit 證據要求。 |
| 7. 外部 AI / cross-mind review | yes | passed | 外部 runtime 建議已被抽象成 public 版通用能力與驗收，不依賴本地私有技能。 |
| 8. 真實用戶旅程 | yes | passed | 新手只需說「把 <檔案> 接入 Agent Handoff Kit」或「掃描未接入 Agent Handoff Kit 的重要文件」；「治理打通」保留為別名；工具不自動刪除、改名或合併真源。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明由 route、workflow、upgrade migration、四情景矩陣、public docs 與 full-audit report 共同支撐。 |

## v0.3.26 發佈狀態

- package version：`0.3.26`。
- release notes：`CHANGELOG.md` 的 `v0.3.26` 段落 + `docs/whatsnew/v0.3.26.md`。
- 發佈目標：修補 handoff lifecycle consistency false-positive，避免合法敘述中段含 `pending` 被誤判為未完成；同步改善 rules pack wrong-layer diagnostic，讓錯層規則包能被清楚定位；並補回上一版 fresh install `AGENTS.md` same-text 缺 marker 時的 upgrade 早退。
- 發佈狀態：候選準備完成。尚未 commit、push、tag、建立 GitHub Release 或 npm publish。
- 發佈後驗證：未執行；須於 GitHub Release 與 npm publish 完成後跑七項發佈檢。

### v0.3.26 發佈前全面檢正式結論

- 正式報告：`docs/qa/full-audit-v0.3.26-candidate.md`。
- 全面檢結論：PASS；可進入外部發佈確認點，但尚未取得 commit / push / tag / GitHub Release / npm publish 批准。
- 治理健康總判定：緊張；建議方向：繼續。原因是本輪修補 doctor / upgrade 判斷與 QA fixture，觸及發佈核心路徑，但沒有新增用戶 runtime 文件或平行規則包。
- Product Journey Matrix：fresh install、closeout handoff、existing upgrade、official npx doctor path、stale handoff blocked、normal handoff not falsely blocked、non-empty local rules、conflict stop、rule pack routing 均為 automated PASS。
- Rules / packs routing 結論：PASS。wrong-layer 問題以 CLI 診斷與 upgrade safety 承接，不新增規則包。
- QC gap backflow 結論：PASS。lifecycle false-positive、rules wrong-layer diagnostic、v0.3.25 prior-version fixture 缺口，以及 same-text `AGENTS.md` marker 早退問題均已轉成自動驗收或 fixture。

### Cross-mind evidence 9-trigger table（v0.3.26）

| Trigger | Required? | Result | Evidence / rationale |
|---|---|---|---|
| 1. 失敗或 blocker | yes | iterated | 真實 runtime 回報 v0.3.25 upgrade 後 `doctor` 因 lifecycle 欄位中段 `pending` 誤報失敗。 |
| 2. 高風險 / 安全 / 發佈 | yes | blocked | 發佈前檢查已通過；外部 commit / push / tag / release / publish 尚待 Adam 明確批准。 |
| 3. 用戶明確挑戰 | yes | passed | Adam 要求先 full audit，再進入 version bump 與發佈線；流程已按 pre-publish gate 分段。 |
| 4. 複雜推理 / 多層取捨 | yes | passed | 修補採欄位開頭 token / 明確 unresolved phrase，不再全句掃 `pending`，同時保留真 placeholder 阻擋。 |
| 5. 跨檔 / 跨 surface 改動 | yes | passed | CLI source、upgrade QA、release QA、fixture、README、HTML、CHANGELOG、whatsnew、release-grade QA 均已對齊。 |
| 6. 結論基於語意判斷而非單一 grep | yes | passed | `qa:release` 直接測 lifecycle consistency；`qa:upgrade` 測 v0.3.11-style narrative 升級後 self-check。 |
| 7. 外部 AI / cross-mind review | yes | passed | 另一 runtime agent 的 bug report 已提煉為產品 bug + QC gap，不把原 repo 措辭當成唯一案例。 |
| 8. 真實用戶旅程 | yes | passed | 舊項目升級後正常 lifecycle narrative 不再 falsely blocked；真正未解 lifecycle conflict 仍被阻擋。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明由 CLI helper 行為、upgrade fixture、release scenario、full-audit report 與 package dry-run 共同支撐。 |
## v0.3.25 發佈狀態

- package version：`0.3.25`。
- release notes：`CHANGELOG.md` 的 `v0.3.25` 段落 + `docs/whatsnew/v0.3.25.md`。
- 發佈目標：修補任務完成後過度進入完整交接的流程問題。核心 runtime 必須先判斷是否有下一輪必須知道的持久事實：沒有持久事實不寫治理檔；有新檔案、新真源、不可重建驗證結果或用戶要求轉成長期機制時，按文件角色輕量保存；只有明確收工、交接、外部同步、發佈或工具即將停止等情況才完整 closeout。
- 發佈狀態：已完成。Public release source commit `81f293f` 已推送並標記 `v0.3.25`；GitHub Release `v0.3.25 - 任務收尾更穩定` 已發佈；npm `@adamchanadam/agent-handoff-kit` latest 為 `0.3.25`，fileCount 25。
- 發佈後驗證：7/7 PASS。GitHub Release 非 draft / 非 prerelease；npm latest / fileCount 對齊；fresh published install PASS；published `--help` / `init` / `doctor` PASS；v0.3.24 → v0.3.25 published-package upgrade smoke PASS。

### v0.3.25 發佈前全面檢正式結論

- 正式報告：`docs/qa/full-audit-v0.3.25-candidate.md`。
- 全面檢結論：PASS；已取得批准並完成 commit / push / tag / GitHub Release / npm publish。
- 治理健康總判定：緊張；建議方向：繼續。原因是本輪修補 runtime 持久化判斷與 QA gate，觸及治理核心但沒有新增平行規則文件；公開用戶頁只同步版本與操作語句，降低新手負擔。
- Product Journey Matrix：fresh install、closeout handoff、evidence disposition、existing upgrade、official npx doctor path、non-empty local rules、conflict stop、doctor state split、AI prose tolerance、natural-language task routing、task persistence gate 均標記 automated PASS 或 manual PASS，無 blocked 項。
- Rules / packs routing 結論：PASS。`qa:packs` 與 `qa:release` 覆蓋最少必要 pack 載入與 durable-home scope；本輪只在 `agent-governance` pack 引用核心分流真源，不複製門檻。
- QC gap backflow 結論：PASS。真實任務後過度 closeout 問題已回流到 runtime persistence gate、`qa:release` contract、release-grade checklist 與 full-audit source report；本次全面檢沒有 open QC gap。

### Cross-mind evidence 9-trigger table（v0.3.25）

| Trigger | Required? | Result | Evidence / rationale |
|---|---|---|---|
| 1. 失敗或 blocker | yes | iterated | 真實工作流揭發每個小任務完成後重複完整 handoff，造成速度、token 與治理噪音問題。 |
| 2. 高風險 / 安全 / 發佈 | yes | passed | Adam 已明確批准 tag / GitHub Release / npm publish；公開發佈已完成，發佈後驗證 7/7 PASS。 |
| 3. 用戶明確挑戰 | yes | iterated | Adam 要求不可從過度治理跌入漏做治理，並要求納入新增 / 刪除文件、新真源、錯誤經驗轉機制等情景。 |
| 4. 複雜推理 / 多層取捨 | yes | passed | 最終方案採三層分流與文件角色落點，不把每次任務完成等同完整 closeout，也不讓 durable fact 漏記。 |
| 5. 跨檔 / 跨 surface 改動 | yes | passed | `runtime-core/AGENTS.core.md`、`packs/agent-governance.md`、`scripts/check-release-readiness.mjs`、release QA、CHANGELOG、whatsnew、README 與 onboarding HTML 已同步；用戶頁不暴露內部術語。 |
| 6. 結論基於語意判斷而非單一 grep | yes | passed | `qa:release` 同時守正向與反向 contract；人工終讀抽樣草稿未拍板、新 URL / 本機來源、錯誤經驗轉機制三類情景。 |
| 7. 外部 AI / cross-mind review | yes | passed | 本輪已綜合 Codex、Codex subagent 與 Claude review；可產品化方案落在核心 runtime + QA gate，不新增長篇方法論。 |
| 8. 真實用戶旅程 | yes | passed | 用戶仍只需「開工」與「收工」；任務中間的保存由 AI 按文件角色判斷，公開 README / HTML 不要求新用戶學內部分類。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明對應 runtime 分流、pack 引用、QA script contract、release-grade 人工情景與 source full audit，不只靠版本字串替換。 |

## v0.3.24 發佈狀態

- package version：`0.3.24`。
- release notes：`CHANGELOG.md` 的 `v0.3.24` 段落 + `docs/whatsnew/v0.3.24.md`。
- 發佈目標：修補 no-op upgrade 假成功，並把源頭寫入收斂到一套 marker standard。當 Kit 檔案已是最新但完整 `doctor` 仍失敗時，`upgrade` 不得顯示成功語氣；若屬工具可安全判斷的 Kit-owned 結構／熱層污染問題，`upgrade` 必須自行修復並重新驗收；若無法安全判斷，才以非零狀態退出。新 closeout 寫入必須用 `ack:section:*` / `ack:field:*` / `ack:log-entry:start/end` / managed-core BEGIN/END 作唯一機器邊界，舊 heading fallback 只作遷移用途；`SESSION_LOG` 新裝與舊版升級後均須驗證四個標準註解錨點存在、只出現一次、順序正確。
- 發佈狀態：已完成。Public release source commit `0ad866c` 已推送並標記 `v0.3.24`；GitHub Release `v0.3.24 - 升級檢查更可靠` 已發佈；npm `@adamchanadam/agent-handoff-kit` latest 為 `0.3.24`，fileCount 25。
- 發佈後驗證：7/7 PASS。GitHub Release 非 draft / 非 prerelease；npm latest / fileCount 對齊；fresh published install PASS；published `--help` / `init` / `doctor` PASS；v0.3.23 → v0.3.24 published-package upgrade smoke PASS。

### v0.3.24 發佈前全面檢正式結論

- 正式報告：`docs/qa/full-audit-v0.3.24-candidate.md`。
- 全面檢結論：PASS；已取得批准並完成 commit / push / tag / GitHub Release / npm publish。
- 治理健康總判定：緊張；建議方向：繼續。原因是本輪為 upgrade / handoff root-fix，跨檔同步面積大，但產品行為、升級安全、規則包路由與 QC gap backflow 均已有機器或人工承接；發佈前不應再擴建新規則。
- Product Journey Matrix：fresh install、closeout handoff、evidence disposition、existing upgrade、anchor drift auto-repair、official npx doctor path、non-empty local rules、conflict stop、doctor state split、AI prose tolerance、natural-language task routing 均標記 automated PASS 或 manual PASS，無 blocked 項。
- Rules / packs routing 結論：PASS。`qa:packs` 與 `qa:release` 覆蓋最少必要 pack 載入與 durable-home scope；本輪不新增 pack，不新增平行治理文件。
- QC gap backflow 結論：PASS。原先 marker 存在檢查未明確保證唯一性與順序的 precision gap 已回流為 `qa:release` fresh install / simulated closeout 與 `qa:upgrade` old log migration / preservation assertions；本次全面檢沒有 open QC gap。

### Cross-mind evidence 9-trigger table（v0.3.24）

| Trigger | Required? | Result | Evidence / rationale |
|---|---|---|---|
| 1. 失敗或 blocker | yes | iterated | 三個 runtime upgrade 回饋揭發「第一次 doctor 失敗，第二次 no-op upgrade 報成功」假成功路徑。 |
| 2. 高風險 / 安全 / 發佈 | yes | passed | Adam 已明確批准 commit / push / tag / GitHub Release / npm publish；公開發佈已完成，發佈後驗證 7/7 PASS。 |
| 3. 用戶明確挑戰 | yes | passed | Adam 要求檢討 upgrade 機制是否通用、不得 hardcode runtime 情景；修補改為 no-op 成功語氣必須由完整 `doctor` 背書。 |
| 4. 複雜推理 / 多層取捨 | yes | passed | 子程序跑 doctor 會受 AI runtime 沙箱影響；最終改為同一進程共用 `runDoctor()`，降低外部執行環境變體風險。 |
| 5. 跨檔 / 跨 surface 改動 | yes | passed | `bin/agent-handoff-kit.mjs`、runtime templates、`scripts/check-release-readiness.mjs`、release QA、CHANGELOG、whatsnew、README 與 onboarding HTML 已同步；統一 marker standard 改動後四條 QA 與發佈後驗證均通過。 |
| 6. 結論基於語意判斷而非單一 grep | yes | passed | `qa:release` 新增 4b / 4f / 4g no-op full-doctor gate，並檢查 fresh install / simulated closeout 的 `SESSION_LOG` 標準註解錨點只出現一次且順序正確；`qa:upgrade` 鏈式升級須把舊 `SESSION_LOG` 非破壞性遷移到 `ack:log-entry` marker、保留既有歷史 entry，並以最終 doctor / 結構驗收為準，不硬綁單次 merged 數字。 |
| 7. 外部 AI / cross-mind review | no | passed | 本輪用真實 runtime log + 機器 fixture 已足以定位；未再外送 private runtime 內容。 |
| 8. 真實用戶旅程 | yes | passed | 真實 runtime 回饋只作證據來源；驗收提煉為三類通用狀態：健康 no-op 通過、可安全自修的 Kit-owned drift 自動修復、需要判斷用戶意圖的狀態不得假成功。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 主要聲明對應到同進程 `runDoctor()` gate、非零 exit、三類 negative no-op fixture 與真實 runtime dry-run 回測。 |

## v0.3.23 發佈狀態

- package version：`0.3.23`。
- release notes：`CHANGELOG.md` 的 `v0.3.23` 段落 + `docs/whatsnew/v0.3.23.md`。
- 發佈目標：修補 research-derived decision trace、current-state evidence boundary 與 startup / closeout display-version source，避免來源脈絡失真、歷史證據污染下一輪開工，並避免開工／收工卡片漏印版本或輸出 `v<version>` 佔位符。
- 發佈狀態：已完成。Public release source commit `c5024c9` 已推送並標記 `v0.3.23`；GitHub Release `v0.3.23 - 交接來源脈絡與證據邊界修補` 已發佈；npm `@adamchanadam/agent-handoff-kit` latest 為 `0.3.23`，fileCount 25。
- 發佈後驗證：7/7 PASS。GitHub Release 非 draft / 非 prerelease；npm latest / fileCount 對齊；fresh published install PASS；published `--help` / `init` / `doctor` PASS；v0.3.22 → v0.3.23 published-package upgrade smoke PASS。

### Cross-mind evidence 9-trigger table（v0.3.23）

| Trigger | Required? | Result | Evidence / rationale |
|---|---|---|---|
| 1. 失敗或 blocker | yes | iterated | 真實 runtime 多輪 `開工` / `收工` 後，壓縮摘要只留下決策句，未保留 research 來源脈絡；另有外部 AI 指出一次性任務證據與當前狀態混層。 |
| 2. 高風險 / 安全 / 發佈 | yes | passed | 本輪只做 source bump 與候選材料；commit / push / tag / release / publish 仍需另行批准。 |
| 3. 用戶明確挑戰 | yes | passed | Adam 要求 root-fix、小修、one rule one place、consolidation；方案落在既有 runtime template、doctor、qa:release 與 full-audit matrix，不新增治理文件。 |
| 4. 複雜推理 / 多層取捨 | yes | passed | 將資料角色分流為 current handoff、trace log、project index、project decisions、rule pack；不把 hot/warm/cold 術語輸出為公開方法論。 |
| 5. 跨檔 / 跨 surface 改動 | yes | iterated | `bin/agent-handoff-kit.mjs`、runtime templates、research pack、QA scripts、release QA、README、HTML、CHANGELOG、whatsnew 與 WORK governance map 同步。 |
| 6. 結論基於語意判斷而非單一 grep | yes | iterated | `doctor` 同時守 research evidence chain 與 current-state evidence boundary；`qa:release` 加正反 fixture，full audit 加產品旅程場景。 |
| 7. 外部 AI / cross-mind review | yes | passed | 多個 subagent / cross-AI review 結論一致：小型 root-fix，加入行為契約與驗收，不新增長篇方法論。 |
| 8. 真實用戶旅程 | yes | passed | 既有項目升級會保留舊 handoff / log / decisions，缺新欄位時非破壞性補回；下一輪開工不應被舊 release / QC / source evidence 帶偏。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 主要聲明對應到 `research decision trace checks`、`handoff temperature boundary checks`、upgrade chain v0.3.22→v0.3.23、Product Journey Matrix 新場景與 manual full audit。 |

## v0.3.22 發佈狀態

- package version：`0.3.22`。
- release notes：`CHANGELOG.md` 的 `v0.3.22` 段落 + `docs/whatsnew/v0.3.22.md`。
- 發佈目標：修補 upgrade anchor drift root-fix，讓可定位的 Kit 維護文字缺失可非破壞性補回；真正不可判斷的結構衝突仍停手。
- 發佈狀態：已完成。Public release source commit `a083e77` 已推送並標記 `v0.3.22`；GitHub Release `v0.3.22 - Upgrade anchor repair` 已發佈；npm `@adamchanadam/agent-handoff-kit` latest 為 `0.3.22`，fileCount 25。
- 發佈後驗證：7/7 PASS。GitHub Release 非 draft / 非 prerelease；npm latest / fileCount 對齊；fresh published install PASS；published `--help` / `init` / `doctor` PASS；v0.3.21 → v0.3.22 published-package `upgrade --yes` + sequential doctor PASS。

### Cross-mind evidence 9-trigger table（v0.3.22）

| Trigger | Required? | Result | Evidence / rationale |
|---|---|---|---|
| 1. 失敗或 blocker | yes | iterated | 真實 runtime v2 public upgrade 測試揭發可定位 anchor drift 仍會阻擋新手；本版把問題轉成 upgrade quality matrix 與負面 fixture。 |
| 2. 高風險 / 安全 / 發佈 | yes | passed | 安全規則、integrations heading 與 onboarding skeleton 不可信時維持 conflict 停手；未取得批准前不 commit / tag / release / publish。 |
| 3. 用戶明確挑戰 | yes | passed | Adam 要求處理不同 AI / LLM、不同語言、不同任務內容下的通用升級；本版採語義位置與可信結構判斷，不靠單一任務字串。 |
| 4. 複雜推理 / 多層取捨 | yes | passed | 在自動修補與安全停手之間劃線：可定位 Kit 維護文字自動補；結構標記壞、管理區重名或安全語義不可判斷則停手。 |
| 5. 跨檔 / 跨 surface 改動 | yes | iterated | `bin/agent-handoff-kit.mjs`、`scripts/check-upgrade-safety.mjs`、`scripts/check-release-readiness.mjs`、release QA 與發佈材料同步。 |
| 6. 結論基於語意判斷而非單一 grep | yes | passed | `requiredAnchors` 增加 placement / missing / misplaced 分類；裸 anchor 出現在錯誤位置不再令 `doctor` 通過。 |
| 7. 外部 AI / cross-mind review | yes | iterated | 多輪 red-team block 已轉成 fixtures：misplaced handoff、fake PROJECT_INDEX row、unsafe safety custom、integrations duplicate heading 等。 |
| 8. 真實用戶旅程 | yes | passed | 升級成功路徑保留備份、migration report 與 post-upgrade doctor；新手不需自行要求 AI 修補可自動處理的 Kit 缺段。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明涵蓋版本、功能、穩定性三軸；測試同時覆蓋 auto-repair 正向路徑與 unsafe conflict 負向路徑。 |

## v0.3.21 發佈狀態

- package version：`0.3.21`。
- release notes：`CHANGELOG.md` 的 `v0.3.21` 段落 + `docs/whatsnew/v0.3.21.md`。
- 發佈目標：把 closeout 長期維護改為每次短觸發檢查，完整整理只在硬觸發、語意觸發或 10 次收工兜底時執行。
- 發佈狀態：已完成。Public release source commit `f07e682` 已推送並標記 `v0.3.21`；GitHub Release `v0.3.21 - 收工流程更輕` 已發佈；npm `@adamchanadam/agent-handoff-kit` latest 為 `0.3.21`，fileCount 25。
- 發佈後驗證：7/7 PASS。GitHub Release 非 draft / 非 prerelease；npm latest / fileCount 對齊；fresh published install PASS；published `--help` / `init` / `doctor` PASS；v0.3.20 → v0.3.21 published-package `upgrade --yes` + sequential doctor PASS。

### Cross-mind evidence 9-trigger table（v0.3.21）

| Trigger | Required? | Result | Evidence / rationale |
|---|---|---|---|
| 1. 失敗或 blocker | yes | iterated | 初次 `qa:release` 因缺 v0.3.20 fixture blocked；補 fixture、generator target 與 chainSteps 後 upgrade safety PASS。 |
| 2. 高風險 / 安全 / 發佈 | yes | passed | 本輪涉及 runtime closeout 行為與 publish；發佈前 `qa:release` PASS，publish 後 7/7 artifact smoke PASS。 |
| 3. 用戶明確挑戰 | yes | passed | Adam 問分拆長期維護會否漏做；方案採硬觸發、語意觸發與 10-closeout backstop。 |
| 4. 複雜推理 / 多層取捨 | yes | passed | 比較每次完整維護、純 optional trigger、混合 trigger + backstop；採混合方案。 |
| 5. 跨檔 / 跨 surface 改動 | yes | passed | runtime core、SESSION_LOG template、PROJECT_DECISIONS template、README、agent-governance pack、release QA 與 upgrade fixtures 同步。 |
| 6. 結論基於語意判斷而非單一 grep | yes | passed | 發佈語意為「routine closeout remains mandatory, long-term maintenance is trigger-driven」；QA 同時守 runtime wording、template wording 與 upgrade behavior。 |
| 7. 外部 AI / cross-mind review | yes | passed | Claude abstract review 支持「daily lightweight + hard gates + N-session backstop + immediate decision capture」，反對純 optional trigger。 |
| 8. 真實用戶旅程 | yes | passed | 長期用戶收工路徑降低負擔；不要求用戶手動維護，仍保留定期兜底避免長期漂移。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 聲明涵蓋 closeout runtime、README、template 與 QA；測試補足 previous-release fixture 與 chain final hop，避免只改文字不驗升級。 |

## v0.3.20 發佈狀態

- package version：`0.3.20`。
- release notes：`CHANGELOG.md` 的 `v0.3.20` 段落 + `docs/whatsnew/v0.3.20.md`。
- 發佈目標：把 README、npm README 來源、CLI help / next steps 與 intro HTML 統一為三個正式入口：`init`、`upgrade`、`doctor`；`upgrade --dry-run` 只保留作預演，並明示不會完成升級。
- 發佈狀態：已完成。Public release source commit `7f1fde1` 已推送並標記 `v0.3.20`；GitHub Release `v0.3.20 - 常見入口更清楚` 已發佈；npm `@adamchanadam/agent-handoff-kit` latest 為 `0.3.20`，fileCount 25。
- 發佈後驗證：7/7 PASS。GitHub Release 非 draft / 非 prerelease；npm latest / fileCount 對齊；fresh published install PASS；published `--help` / `init` / `doctor` PASS；v0.3.19 → v0.3.20 published-package `upgrade --yes` + sequential doctor PASS。

### Cross-mind evidence 9-trigger table（v0.3.20）

| Trigger | Required? | Result | Evidence / rationale |
|---|---|---|---|
| 1. 失敗或 blocker | no — no release blocker remained after checks | passed | 本輪修補來自公開入口文案風險；版本提升後 `qa:release` 與發佈後 7/7 smoke 均已 PASS。 |
| 2. 同類 bug 連續 2+ 次修補仍未斷 | yes | iterated | v0.3.19 修短開工入口後，README / CLI 仍把 `upgrade --dry-run` 放得太像正式入口；本版把正式入口收斂為 `init` / `upgrade` / `doctor`。 |
| 3. 真實用戶 / Adam challenge | yes | iterated | Adam 明確指出新手做完 `upgrade --dry-run` 會誤以為已完成升級，並指出「已安裝舊版」段落太低。 |
| 4. 三個以上治理檔同步改動 | yes | iterated | 涉 README、CLI、intro HTML、release QA 腳本、release-grade QA、CHANGELOG 與 whatsnew；已新增對應守門。 |
| 5. 將要對外 commit / tag / publish | yes | passed | Adam 已明確要求繼續做到 publish；source commit、tag、GitHub Release、npm publish 與 post-publish smoke 已完成。 |
| 6. 存在人工語意判斷而無機器斷言 | yes | iterated | `checkNpxColdStartUxGuidance()` 已守正式入口與 dry-run 非完成升級；cross-surface check 已守 intro 第 03 區不可回到收工-only。 |
| 7. Cross-agent / cross-session handoff point | yes | iterated | 介紹頁改為「開工接上狀態，收工留下交接」，避免下一輪 AI 只看到 closeout-only 流程敘事。 |
| 8. Public-user journey / onboarding wording changed | yes | iterated | README 前段與 CLI help 改為新項目 `init`、舊項目 `upgrade`、檢查 `doctor`；`dry-run` 只作預演。 |
| 9. QC framework exposed or should have exposed the gap | yes | iterated | 本輪把用戶指出的文案誤導轉為 release readiness 守門，避免下一版再把 dry-run 當入口。 |

## v0.3.19 發佈狀態

- package version：`0.3.19`。
- release notes：`CHANGELOG.md` 的 `v0.3.19` 段落 + `docs/whatsnew/v0.3.19.md`。
- 發佈目標：把公開 README、npm README 來源、CLI 安裝後輸出、intro / guide HTML 與 runtime closeout 顯示統一為短開工入口優先：`Start Agent Handoff` /「開工」；只有 AI 尚未指向專案資料夾時才使用帶路徑啟動句。
- 發佈狀態：已完成。Public release source commit `9a12c31` 已推送並標記 `v0.3.19`；GitHub Release `v0.3.19 - 開工入口更簡單` 已發佈；npm `@adamchanadam/agent-handoff-kit` latest 為 `0.3.19`，fileCount 25。
- 發佈後驗證：7/7 PASS。GitHub Release 非 draft / 非 prerelease；npm latest / fileCount 對齊；fresh published install PASS；published `--help` / `init` / `doctor` PASS；v0.3.18 → v0.3.19 published-package `upgrade --yes` + sequential doctor PASS。

### Cross-mind evidence 9-trigger table（v0.3.19）

| Trigger | Required? | Result | Evidence / rationale |
|---|---|---|---|
| 1. 失敗或 blocker | no — not observed in release verification | passed | 修補來自公開說明殘留舊長句的用戶挑戰；subagent follow-up 後本地機器驗收 PASS，發佈後七項 artifact smoke 亦已 PASS。 |
| 2. 同類 bug 連續 2+ 次修補仍未斷 | yes | iterated | v0.3.18 已修 local-agent 邊界但公開 README / HTML 仍把長句放主入口；v0.3.19 把短入口提升為主流程並新增舊句殘留檢查。 |
| 3. 真實用戶 / Adam challenge | yes | iterated | Adam 明確指出 GitHub Pages intro 仍不清楚，要求逐句重檢 README、npm README 來源與 HTML。 |
| 4. 三個以上治理檔同步改動 | yes | iterated | 涉 README、intro、guide、CLI、runtime、QA 腳本與 release-grade QA；同步責任已記錄，subagent follow-up 後本地機器驗收已重跑通過。 |
| 5. 將要對外 commit / tag / publish | yes | passed | Adam 已明確授權 v0.3.19 全套發佈；commit / push / tag / GitHub Release / npm publish 已完成，發佈後驗證 7/7 PASS。 |
| 6. 存在人工語意判斷而無機器斷言 | yes | iterated | 已把短入口、fallback、舊長句殘留、固定開工句殘留轉入 `checkCrossSurfaceWordingConsistency()` 與 prototype check。 |
| 7. Cross-agent / cross-session handoff point | yes | iterated | Runtime closeout 顯示改為短入口 + fallback；`START_NEXT_SESSION_PROMPT.txt` 仍由 handoff 真源生成，不把 final response 變第三份 stateful prompt。 |
| 8. Public-user journey / onboarding wording changed | yes | iterated | README、intro、guide、CLI 均改為「AI 已在專案內：Start Agent Handoff / 開工；未指向資料夾：帶路徑啟動句」。 |
| 9. QC framework exposed or should have exposed the gap | yes | iterated | 舊 QC 只守長 bootstrap phrase，反而把錯誤主入口固化；v0.3.19 將守門口徑改成短入口優先與舊句禁止。 |

## v0.3.18 發佈狀態

- 發佈版本：`0.3.18`。
- release notes：`CHANGELOG.md` 的 `v0.3.18` 段落 + `docs/whatsnew/v0.3.18.md`。
- 發佈內容：收緊工具適用邊界；Agent Handoff Kit 面向能讀寫本機專案資料夾的 agentic AI 長任務，不面向不能讀寫本機檔案的普通 web chat AI。
- 開工口徑：CLI / README / HTML 顯示固定 bootstrap 句，要求 AI 先讀 `AGENTS.md`，再打開 `START_NEXT_SESSION_PROMPT.txt`；初次安裝的 prompt 檔承載新手引導，收工後的 prompt 檔承載真正接力狀態。`Start Agent Handoff` / `Wrap up Agent Handoff` 只作簡短入口提示；真正的開工 / 收工意圖偵測與「某某開工 / 某某收工」反問規則只放 runtime `AGENTS.md`。
- 發佈前驗收：全面檢 PASS；`qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release` 均通過，並確認 CLI / README / HTML 含 local-agent 邊界、普通 web chat 不支援聲明、固定 bootstrap 句；prompt mirror 仍確認 `START_NEXT_SESSION_PROMPT.txt` 與 handoff opening message 同源。
- 發佈後驗證：7/7 artifact smoke PASS；GitHub Release `v0.3.18 - 開工接力更清楚` 非 draft / 非 prerelease，npm latest 為 `0.3.18`，package fileCount 25；fresh published install、published `--help` / `init` / `doctor`、以及 v0.3.17 → v0.3.18 published-package upgrade + sequential doctor 均通過。

### Cross-mind evidence 9-trigger table（v0.3.18）

| Trigger | Required? | Result | Evidence |
|---|---|---|---|
| 1. 發佈說明使用「已修復／可用」等強聲明 | yes | passed | 已以全面檢、`qa:release`、npm metadata 與發佈後 7/7 artifact smoke 支撐。 |
| 2. 同類 bug 連續 2+ 次修補仍未斷 | yes | iterated | README 曾把 `Read AGENTS.md...` 放成日常開工句，令用戶誤以為不用 `START_NEXT_SESSION_PROMPT.txt`；本版改成固定 bootstrap 句。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | iterated | 功能層：CLI / runtime prompt；測試層：prototype / release readiness；敘事層：README / HTML / CHANGELOG / whatsnew。 |
| 4. 三個以上治理檔同步改動 | yes | iterated | README、CLI、runtime core、QA scripts、QA doc、HTML、WORK governance map 與 registered mirrors 需同步。 |
| 5. 將要對外 commit / tag / publish | yes | passed | Adam 已授權發佈；source commit `d3bd498` 已 push，tag `v0.3.18`、GitHub Release 與 npm publish 已完成。 |
| 6. 結論基於語意判斷而非單一 grep | yes | iterated | 語意為「Kit 需要本機讀寫能力」與「prompt 檔承載狀態，surface 只給 bootstrap」。 |
| 7. 上次同類問題曾被用戶 catch | yes | iterated | Adam 指出 README / npm README 會誤導用戶，並要求明確工具範圍。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | 新檢查以 fresh install CLI、installed prompt、README / HTML 文案共同守門。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | local-agent 邊界、固定 bootstrap、快捷詞與歧義保護均已有 QA 斷言；npm publish 後 registry metadata 已對齊。 |

## v0.3.17 發佈狀態

- 發佈版本：`0.3.17`。
- release notes：`CHANGELOG.md` 的 `v0.3.17` 段落 + `docs/whatsnew/v0.3.17.md`。
- 發佈內容：修正 Jay 真實升級成功後 CLI 輸出過長問題；`upgrade` 成功後不再 inline 展開多版本 `docs/whatsnew` 全文，只保留完成狀態、自動 `doctor` 提示與 GitHub Release 入口。
- 發佈前驗收：`qa:release` 必須確認 scenario 3a / 3b / 3c 的 substantive upgrade output 不含「本次升級涵蓋」、markdown 版本標題或「本版新加了甚麼」長篇 release notes 內容；同時用正向短輸出守門限制 upgrade success narrative ≤ 8 條非空行、≤ 430 字，輸出版本必須對齊 package version；再用真正 packed tarball 安裝後跑 v0.3.16 → v0.3.17 upgrade + doctor smoke，防止 package fileCount / files 邊界改動令 published package 缺檔或升級失敗。
- npm 狀態：已 npm publish；npm latest 為 `0.3.17`；package fileCount 25（移除 `docs/whatsnew/` 入包，版本說明留在 repo / GitHub Release 材料）。
- 🟡 發佈檢：v0.3.17 post-publish artifact smoke 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、published `--help` / `init` / `doctor`、以及 v0.3.16 → v0.3.17 published-package upgrade 均通過。

### Cross-mind evidence 9-trigger table（v0.3.17）

| Trigger | Required? | Result | Evidence |
|---|---|---|---|
| 1. 發佈說明使用「已修復／可用」等強聲明 | yes | passed | 強聲明只對應 upgrade 成功輸出降噪；機器落點為 `qa:release` scenario 3a / 3b / 3c must-not-have assertions。 |
| 2. 同類 bug 連續 2+ 次修補仍未斷 | yes | iterated | v0.3.2 曾加入 inline whatsnew 解決「升級不知道改了甚麼」；Jay v0.3.16 實測證明該資訊放在 installer 流程會造成 UX 噪音，本版改由 GitHub Release 承接詳情。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：CLI upgrade output；測試層：release readiness scenario contract；敘事層：CHANGELOG、whatsnew、本段、README / HTML 版本口徑。 |
| 4. 三個以上治理檔同步改動 | yes | passed | public CLI、QA docs、QA script、CHANGELOG、whatsnew、README、HTML 與 WORK governance records 需同步；WORK session state 不進 npm package。 |
| 5. 將要對外 commit / tag / publish | yes | passed | Adam 已明確批准 v0.3.17 commit、push、tag、GitHub Release、npm publish；發佈後七項 artifact smoke 已通過。 |
| 6. 結論基於語意判斷而非單一 grep | yes | iterated | 語意為「升級流程只完成升級和驗收，不承載長篇版本詳情」；用禁止長篇標記、正向行數 / 字數上限、版本對齊、GitHub Release 入口與 packed-package upgrade smoke 多層驗證。 |
| 7. 上次同類問題曾被用戶 catch | yes | iterated | Jay 真實 upgrade 成功輸出被長篇 v0.3.15 / v0.3.16 說明淹沒；本版將該輸出類型轉為發佈前守門。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | scenario 3b 使用真實 v0.1.7 fixture；scenario 3c 通用重建 Jay 類 lifecycle placeholder 狀態；本次 UX guard 針對所有 substantive upgrade output。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明對應 CLI output、scenario 3a / 3b / 3c、GitHub Release link、README / HTML 版本口徑、`docs/whatsnew/` 不入包、package fileCount，以及 packed-package upgrade smoke。 |

## v0.3.16 發佈狀態

- 發佈版本：`0.3.16`。
- release notes：`CHANGELOG.md` 的 `v0.3.16` 段落 + `docs/whatsnew/v0.3.16.md`。
- 發佈內容：修正 closeout prompt 第三真源風險；runtime closeout 必須先由 handoff 重生並讀回 `START_NEXT_SESSION_PROMPT.txt`，再把讀回內容放入 final response。
- 發佈前驗收：快檢四項、`qa:prompt-mirror`、收工三面同源驗收、舊核心升級 read-back discipline regression、v0.3.15 → v0.3.16 upgrade chain、41 個入包檔案、公開文件版本口徑與 HTML mirror hash 均已通過；Adam 其後明確批准公開發佈動作。
- npm 狀態：已 npm publish；npm latest 為 `0.3.16`；package fileCount 41（從 40 增加 1，加 `docs/whatsnew/v0.3.16.md`）。
- 🟡 發佈檢：v0.3.16 post-publish artifact smoke 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、published `--help` / `init` / `doctor`、以及 v0.3.15 → v0.3.16 published-package upgrade 均通過。

### Cross-mind evidence 9-trigger table（v0.3.16）

| Trigger | Required? | Result | Evidence |
|---|---|---|---|
| 1. 發佈說明使用「已修復／可用」等強聲明 | yes | passed | 強聲明只對應 closeout prompt read-back / third-source guard；機器落點為 `qa:release` runtime core assertion 與 `qa:upgrade` old-core propagation assertion。 |
| 2. 同類 bug 連續 2+ 次修補仍未斷 | yes | iterated | v0.3.12 修 prompt convenience warning，v0.3.14 修 fixed checker，今次再揭發 final response 可能成為第三真源；本版把同類坑位轉成發佈前守門。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：runtime core closeout order；測試層：release readiness + upgrade safety；敘事層：CHANGELOG、whatsnew、本段、README / HTML 版本口徑。 |
| 4. 三個以上治理檔同步改動 | yes | passed | public runtime、QA docs、QA scripts、CHANGELOG、whatsnew、README、HTML 與 WORK governance records 同步；WORK session state 不進 npm package。 |
| 5. 將要對外 commit / tag / publish | yes | passed | Adam 已明確批准本輪執行 commit、push、tag、GitHub Release、npm publish 與 release closeout；發佈後七項 smoke 已通過。 |
| 6. 結論基於語意判斷而非單一 grep | yes | iterated | 語意為「final response 只能展示已持久化並讀回的 prompt copy」；用必含 guard、禁止舊次序、prompt mirror、升級傳播四層驗證。 |
| 7. 上次同類問題曾被用戶 catch | yes | iterated | Adam 指出 START prompt 可能只在 surface 顯示且 WORK prompt 是手動更新；本版將該情況轉成 closeout 三面同源產品合約。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | 舊核心 fixture 仍保留舊次序作輸入狀態，但升級後必須消除舊句並帶入 read-back discipline。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明對應 runtime order、final-response guard、old-core upgrade propagation、prompt mirror status、whatsnew / README 版本口徑與 package fileCount。 |

## v0.3.15 發佈狀態

- 發佈版本：`0.3.15`。
- release notes：`CHANGELOG.md` 的 `v0.3.15` 段落 + `docs/whatsnew/v0.3.15.md`。
- 發佈內容：修正 Jay 類舊項目升級路徑：root template metadata 落後、既有 lifecycle 欄位仍為 `TBD`，但 handoff 已有 substantive Completed / Validation 內容時，upgrade 必須安全重分類 placeholder，不能先顯示升級完成再由同一次自動 `doctor` 報 `handoff lifecycle consistency` 失敗。
- 發佈前驗收：快檢四項、Jay 類 stale lifecycle placeholder regression、`qa:release` scenario 3c、v0.3.14 → v0.3.15 upgrade chain、40 個入包檔案、公開文件版本口徑均已通過。
- npm 狀態：已 npm publish；npm latest 為 `0.3.15`；package fileCount 40（從 39 增加 1，加 `docs/whatsnew/v0.3.15.md`）。
- 🟡 發佈檢：v0.3.15 post-publish artifact smoke 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、published `--help` / `init` / `doctor`、以及 v0.3.14 → v0.3.15 published-package upgrade 均通過。

### Cross-mind evidence 9-trigger table（v0.3.15）

| Trigger | Required? | Result | Evidence |
|---|---|---|---|
| 1. 發佈說明使用「已修復／可用」等強聲明 | yes | passed | 強聲明只對應 Jay 類 stale lifecycle placeholder migration；機器落點為 `qa:upgrade` regression 與 `qa:release` scenario 3c。 |
| 2. 同類 bug 連續 2+ 次修補仍未斷 | yes | iterated | v0.3.14 修補 missing lifecycle field，但 Jay 再揭發 existing lifecycle marker + placeholder value 組合；本版把該組合轉為獨立 regression。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：CLI bounded merge；測試層：upgrade safety、release scenario 3c；敘事層：CHANGELOG、whatsnew、本段與 README 版本口徑。 |
| 4. 三個以上治理檔同步改動 | yes | passed | public QA docs、scripts、CHANGELOG、whatsnew、README 與 WORK governance records 同步；WORK session state 不進 npm package。 |
| 5. 將要對外 commit / tag / publish | yes | passed | Adam 已明確批准本輪全面檢通過後執行 commit、push、tag、GitHub Release 與 npm publish；若全面檢未通過則不得進入公開發佈動作。 |
| 6. 結論基於語意判斷而非單一 grep | yes | iterated | 產品語意為「metadata stale 時 upgrade migration 應修舊 placeholder；latest no-op 時仍交給 closeout 判斷」；用 scenario 3c 與 4b 分別守住兩條邊界。 |
| 7. 上次同類問題曾被用戶 catch | yes | iterated | Jay 真實 v0.3.14 升級輸出與附件 handoff / migration report 揭發；已轉成可重建 fixture，不硬編碼 Jay 專案文字。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | scenario 3c 由 current init + older metadata row + substantive handoff seed 重建狀態；真實 Jay 附件只作根因證據，產品測試用通用可重建狀態。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明對應 bounded lifecycle reclassification、post-upgrade self-check pass、latest no-op boundary、whatsnew / README 版本口徑與 package fileCount。 |

## v0.3.14 發佈狀態

- 發佈版本：`0.3.14`。
- release notes：`CHANGELOG.md` 的 `v0.3.14` 段落 + `docs/whatsnew/v0.3.14.md`。
- 發佈內容：修正舊版項目跨版本升級時，migration 寫入 `TBD` lifecycle 欄位而同一次自動 `doctor` 又拒絕該欄位的 false failure；同時把 rules / packs 路由與 durable-home scope 納入發佈前全面檢。
- 發佈前驗收：快檢四項、v0.1.7 substantive handoff lifecycle migration regression、rules / packs routing and durable-home scope sweep、prompt mirror 固定檢查器、39 個入包檔案、公開文件版本口徑均已通過。
- npm 狀態：已 npm publish；npm latest 為 `0.3.14`；package fileCount 39（從 37 增加 2，加 `docs/whatsnew/v0.3.14.md` 與 `bin/prompt-mirror-core.mjs`）。
- 🟡 發佈檢：v0.3.14 post-publish artifact smoke 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、published `--help` / `init` / `doctor`、以及 v0.3.13 → v0.3.14 published-package upgrade 均通過。

### Cross-mind evidence 9-trigger table（v0.3.14）

| Trigger | Required? | Result | Evidence |
|---|---|---|---|
| 1. 發佈說明使用「已修復／可用」等強聲明 | yes | passed | 強聲明只對應 lifecycle migration false failure 與 rules / packs full-audit scope；機器落點為 v0.1.7 substantive handoff regression、`qa:packs`、`qa:release` anchors。 |
| 2. 同類 bug 連續 2+ 次修補仍未斷 | yes | iterated | v0.3.13 解決 anchor repair UX，但 Jay Mac 報告揭發 migration 自寫 `TBD` 後被同版 `doctor` 拒絕；本版把該狀態轉成 fixture。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：CLI migration lifecycle value；測試層：upgrade safety、pack scenario、release readiness；敘事層：README、CHANGELOG、whatsnew、本段。 |
| 4. 三個以上治理檔同步改動 | yes | passed | public QA docs、scripts、pack、README、CHANGELOG、whatsnew 與 WORK governance records 同步；WORK session state 不進 npm package。 |
| 5. 將要對外 commit / tag / publish | yes | passed | 本表只作發佈前證據；tag、GitHub Release、npm publish 仍需 Adam 另行明確批准。 |
| 6. 結論基於語意判斷而非單一 grep | yes | passed | 產品語意為「upgrade 不可寫入立即 fail 的 lifecycle 值」與「自然語言任務要路由到 pack / durable home」；不是只靠字串 grep。 |
| 7. 上次同類問題曾被用戶 catch | yes | iterated | Jay Mac 真實升級 log 與 Adam 對 rules / packs 入庫邏輯的追問揭發；已轉成 regression 與 release-grade sweep。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | v0.1.7 root 由真實舊 CLI 生成，再注入 substantive handoff content 以重現舊項目狀態；此人工注入已明確標成 regression seed。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明對應 migration value、post-upgrade self-check、rule pack structure、durable-home routing、prompt mirror 固定檢查器、whatsnew / README 版本口徑與 package fileCount。 |

## v0.3.13 發佈狀態

- 發佈版本：`0.3.13`。
- release notes：`CHANGELOG.md` 的 `v0.3.13` 段落 + `docs/whatsnew/v0.3.13.md`。
- 發佈內容：修正正式 `upgrade` 後自動 `doctor` anchor failure 的新手修補路徑；`START_NEXT_SESSION_PROMPT.txt` 便利副本不再作 blocking anchor；`agent-governance` pack 與 core 持久化流程補明 reusable operating procedure 應歸入 pack / registered reference。
- 發佈前驗收：快檢四項、scenario 4c / 4d、stale prompt warning-pass、true anchor failure repair steps、v0.3.12 → v0.3.13 升級鏈、37 個入包檔案、公開文件版本口徑、以及 reusable procedure governance pack guard 均須通過。
- npm 狀態：發佈後應驗證 npm latest 為 `0.3.13`；package fileCount 37（從 36 增加 1，加 `docs/whatsnew/v0.3.13.md`）。
- 🟡 發佈檢：v0.3.13 publish 後須驗證 GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、published `--help` / `init` / `doctor`、以及 v0.3.12 → v0.3.13 published-package upgrade。

### Cross-mind evidence 9-trigger table（v0.3.13）

| Trigger | Required? | Result | Evidence |
|---|---|---|---|
| 1. 發佈說明使用「已修復／可用」等強聲明 | yes | passed | 強聲明只對應升級後 anchor failure repair UX 與 reusable procedure 歸位規則；`qa:release` scenario 4c / 4d + `qa:packs` guard 覆蓋。 |
| 2. 同類 bug 連續 2+ 次修補仍未斷 | yes | iterated | v0.3.8-v0.3.12 多次由真實用戶旅程揭發 doctor / upgrade UX 邊界；本次把 dry-run 死路與治理入庫漂移轉成自動場景。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：CLI、runtime core、agent-governance pack；測試層：upgrade safety、release scenario、pack scenario；敘事層：README、CHANGELOG、whatsnew、本段。 |
| 4. 三個以上治理檔同步改動 | yes | passed | public core、pack、QA、CHANGELOG、whatsnew、WORK AGENTS / handoff / decision log 同步；WORK session state 不進 npm package。 |
| 5. 將要對外 commit / tag / publish | yes | passed | 本表與全面檢作為發佈前證據；未通過不得進入 commit / tag / release / publish。 |
| 6. 結論基於語意判斷而非單一 grep | yes | passed | 產品語意為「正式 upgrade 後不能送新手回 dry-run」及「reusable procedure 不等於 current handoff state」；用真實 invocation 與 pack guard 驗證。 |
| 7. 上次同類問題曾被用戶 catch | yes | iterated | Adam 由 mac 用戶 upgrade failure 與本 session runbook 歸位漂移揭發；已轉成 scenario 4c / 4d 與 agent-governance pack guard。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | scenario 4c / 4d 是抽象化可重建狀態；同時補 v0.3.12 real fixture 與 chain hop 到 current HEAD。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明對應 CLI output contract、anchor missing detail、non-circular repair guidance、pack persistence guard、whatsnew / README 版本口徑與 package fileCount。 |

## v0.3.12 發佈狀態

- 發佈版本：`0.3.12`。
- release notes：`CHANGELOG.md` 的 `v0.3.12` 段落 + `docs/whatsnew/v0.3.12.md`。
- 發佈內容：修正普通 `doctor` 將 `START_NEXT_SESSION_PROMPT.txt` 中途落後誤判為失敗；保留 closeout 時重生便利副本的嚴格要求。
- 發佈前驗收：快檢四項、in-session prompt convenience drift fixture、v0.3.11 → v0.3.12 升級鏈、36 個入包檔案、公開文件版本口徑、以及 `doctor` warning / failure 分流均通過。
- npm 狀態：已 npm publish；npm latest 為 `0.3.12`；package fileCount 36（從 35 增加 1，加 `docs/whatsnew/v0.3.12.md`）。
- 🟡 發佈檢：v0.3.12 post-publish verification 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、published `--help` / `init` / `doctor`、以及 v0.3.11 → v0.3.12 published-package upgrade 均通過。

### Cross-mind evidence 9-trigger table（v0.3.12）

| Trigger | Required? | Result | Evidence |
|---|---|---|---|
| 1. 發佈說明使用「已修復／可用」等強聲明 | yes | passed | 強聲明只對應普通 `doctor` prompt mirror drift 不再 fail；targeted repro + `qa:release` fixture 覆蓋。 |
| 2. 同類 bug 連續 2+ 次修補仍未斷 | yes | iterated | v0.3.8-v0.3.11 已多次暴露 `doctor` / user journey 邏輯邊界；本次新增 fixture 防止同類 prompt convenience drift 回歸。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：`bin/agent-handoff-kit.mjs`；測試層：`scripts/check-release-readiness.mjs`；敘事層：README、CHANGELOG、whatsnew、本段。 |
| 4. 三個以上治理檔同步改動 | yes | passed | runtime core、PROJECT_INDEX、release QA、README 與 WORK 記錄同步更新；WORK session state 不進 npm package。 |
| 5. 將要對外 commit / tag / publish | yes | passed | 本表與全面檢作為發佈前證據；未通過不得進入 commit / tag / release / publish。 |
| 6. 結論基於語意判斷而非單一 grep | yes | passed | 產品語意為「active session warning vs closeout-ready strict」；用真實 `doctor` invocation 驗證，不只 grep。 |
| 7. 上次同類問題曾被用戶 catch | yes | iterated | Adam 由 runtime project doctor failure 揭發；已轉成 release readiness fixture。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | prompt convenience drift fixture 是最小可重建狀態；同時仍跑完整歷史 upgrade chain 到 current HEAD。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | passed | 發佈聲明對應 targeted repro、release user-flow drift fixture、ordinary doctor warning output、closeout regenerated prompt retained。 |

## v0.3.11 發佈狀態

- 發佈版本：`0.3.11`。
- release notes：`CHANGELOG.md` 的 `v0.3.11` 段落 + `docs/whatsnew/v0.3.11.md`。
- 發佈內容：post-v0.3.10 用戶旅程守門；scenario 2 / 5 / 7 自動化；v0.2.x 到 v0.3.10 真實 fixture 升級覆蓋；whatsnew schema；公開文件語氣與 onboarding guide 對齊。
- 發佈前驗收重點：快檢四項、v0.3.10 → v0.3.11 升級鏈、35 個入包檔案、公開文件版本口徑、conflict 停手文字與首次安裝後 AI 對話旅程均須通過。
- npm 狀態：已 npm publish；npm latest 為 `0.3.11`；package fileCount 35（從 34 增加 1，加 `docs/whatsnew/v0.3.11.md`）。
- 🟡 發佈檢：v0.3.11 post-publish verification 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、published `--help` / `init` / `doctor`、以及 v0.3.10 → v0.3.11 published-package upgrade 均通過。

### Cross-mind evidence 9-trigger table（v0.3.11）

| Trigger condition | Required (yes/no) | Result (passed / iterated / blocked) | Follow-up (assertion ID / checklist item / accepted risk reason) |
|---|---|---|---|
| 1. 發佈說明使用「已驗證／已修復／可持續／sustainable」等強聲明 | yes | iterated | 本版只聲明已把 v0.3.10 後續債務轉成候選守門；公開完成狀態仍由發佈後驗證確認。 |
| 2. 同類 bug 連續兩版出現 | yes | iterated | v0.3.7 至 v0.3.10 均暴露用戶旅程與發佈守門落差；本版把 scenario 2 / 5 / 7 轉入自動檢查。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：upgrade conflict 停手文字；測試層：release scenario、upgrade fixture、whatsnew schema；敘事層：README、HTML、CHANGELOG、whatsnew、本段。 |
| 4. 三個以上治理檔同步改動 | yes | passed | public docs、QA scripts、whatsnew、CHANGELOG 與 WORK 鏡像同步規則一起更新；WORK session state 不輸出到 npm package。 |
| 5. 公開可見發佈儀式 | yes | blocked | tag、GitHub Release、npm publish 仍須在候選檢查通過後執行，並以發佈後驗證收口。 |
| 6. 存在人工語意判斷而無機器斷言 | yes | iterated | Case A/B/C guide 順序與非技術語氣屬語意 UX；已補進 release readiness、manual checklist 與 WORK mirror sync 規則。 |
| 7. 發佈後上一版由真實用戶抓 bug | yes | iterated | v0.3.10 後 Adam 抓到 guide / outputs 鏡像漏同步；已轉成 DOC_SYNC_REGISTRY 優先規則與 hash 驗證紀律。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | 升級 fixture 已覆蓋 v0.2.x 至 v0.3.10 真實版本；候選 v0.3.11 由 current HEAD 鏈路驗證。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 主要聲明對應：scenario 2 / 5 / 7、自動升級鏈、whatsnew schema、package fileCount 35 與 mirror sync 規則。 |

## v0.3.10 發佈狀態

- 發佈版本：`0.3.10`。
- release notes：`CHANGELOG.md` 的 `v0.3.10` 段落 + `docs/whatsnew/v0.3.10.md`。
- 發佈內容：首次安裝後真實 AI 對話旅程修補；精簡終端機下一步、修復 Claude Code 橋接檔被擴寫問題、補明 Antigravity CLI / Gemini CLI 遷移期入口關係，並改善新手情境文字。
- 發佈前驗收重點：首次安裝 → AI 對話 → 情境選擇、污染後橋接檔升級修復、v0.3.9 → v0.3.10 升級鏈與 34 個入包檔案均須通過。
- npm 狀態：已 npm publish；npm latest 為 `0.3.10`；package fileCount 34（從 33 增加 1，加 `docs/whatsnew/v0.3.10.md`）。
- 🟡 發佈檢：v0.3.10 post-publish verification 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、published `--help` / `init` / `doctor`、以及 v0.3.9 → v0.3.10 published-package upgrade 均通過。

### Cross-mind evidence 9-trigger table（v0.3.10）

| Trigger condition | Required (yes/no) | Result (passed / iterated / blocked) | Follow-up (assertion ID / checklist item / accepted risk reason) |
|---|---|---|---|
| 1. 發佈說明使用「已驗證／已修復／可持續／sustainable」等強聲明 | yes | iterated | 候選段只聲明本地候選修補；正式發佈與發佈後驗證未完成前，不宣稱已公開驗證。 |
| 2. 同類 bug 連續兩版出現 | yes | iterated | v0.3.7 至 v0.3.9 已連續修補 CLI / doctor / upgrade 旅程邊界；本版把首次 AI 對話與橋接檔污染納入同一用戶旅程層。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | iterated | 功能層：CLI、bridge、onboarding；測試層：scenario、pack、upgrade chain；敘事層：README、HTML、CHANGELOG、whatsnew、本段。 |
| 4. 三個以上治理檔同步改動 | yes | passed | runtime-core、pack、CLI、public docs、QA scripts 同步更新；WORK session state 仍留在 WORK，不輸出到 npm package。 |
| 5. 公開可見發佈儀式 | yes | blocked | publish 尚未批准；tag、GitHub Release、npm publish 須另行明確確認。 |
| 6. 存在人工語意判斷而無機器斷言 | yes | iterated | 新手文字與 AI 對話重複輸出屬語意 UX；已轉入 pack scenario、release scenario 與 manual journey checklist。 |
| 7. 發佈後上一版由真實用戶抓 bug | yes | iterated | 本版由 Adam 真實首次安裝與 Claude Code 對話 log 觸發；產品規則不硬寫單一目錄，只抽象成橋接檔與 onboarding 旅程。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | 自動測試使用可重建 fixture；真實 `ahk_first_ai_test_*` 只作發現問題證據。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 主要聲明對應：首次安裝輸出、bridge restore、Antigravity/Gemini bridge、onboarding Scenario A 與 Google Drive wording。 |

## v0.3.9 發佈狀態

- 發佈版本：`0.3.9`。
- release notes：`CHANGELOG.md` 的 `v0.3.9` 段落 + `docs/whatsnew/v0.3.9.md`。
- 發佈內容：修補 lifecycle 欄位誤判。若欄位明確以 `yes` / `resolved` / 「已完成」等確認語開始，即使後文提到仍有 pending follow-up，也不應被判作未完成。
- 發佈前驗收重點：真實 `AI_Public_Squares` 實測已揭出問題並通過修補；自動回歸加入「yes + pending follow-up wording」案例，防止同類誤判回來。
- npm 狀態：已 npm publish；npm latest 為 `0.3.9`；package fileCount 33（從 32 增加 1，加 `docs/whatsnew/v0.3.9.md`）。
- 🟡 發佈檢：v0.3.9 post-publish verification 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、post-install `--help` / `init` / `doctor`、v0.3.8→v0.3.9 chain-upgrade routing propagation、以及 yes + pending follow-up lifecycle 回歸場景均通過。

### Cross-mind evidence 9-trigger table（v0.3.9）

| Trigger condition | Required (yes/no) | Result (passed / iterated / blocked) | Follow-up (assertion ID / checklist item / accepted risk reason) |
|---|---|---|---|
| 1. 發佈說明使用「已驗證／已修復／可持續／sustainable」等強聲明 | yes | iterated | 本版只聲明 lifecycle 欄位確認句誤判已修補；機器落點為 affirmative lifecycle wording regression 與 package fileCount 33。 |
| 2. 同類 bug 連續兩版出現 | yes | iterated | v0.3.7 / v0.3.8 連續暴露 `doctor` / `upgrade` lifecycle UX 邊界；v0.3.9 把真實項目新缺口收成判斷順序回歸。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：lifecycle field affirmative-first 判斷；測試層：yes + pending follow-up 回歸；發佈敘事層：CHANGELOG、whatsnew、本段。 |
| 4. 三個以上治理檔同步改動 | yes | passed | public release-grade QA、CHANGELOG、whatsnew 與 WORK 紀錄需同步；真實項目 `AI_Public_Squares` 只作驗收證據，不作 public runtime 真源。 |
| 5. 公開可見發佈儀式 | yes | iterated | Adam 已批准本輪發佈前全面檢與 publish；本表覆蓋 publish 前判斷，publish 後仍須跑 🟡 發佈後驗證。 |
| 6. 存在人工語意判斷而無機器斷言 | yes | iterated | 「yes 句中可提待辦」屬語意邊界；已轉成 `isAffirmativeLifecycleFieldValue()` 與 release readiness 回歸。 |
| 7. 發佈後上一版由真實用戶抓 bug | yes | iterated | v0.3.8 發佈後 Adam 在 `AI_Public_Squares` 測到確認句含 `pending` 被誤殺；本版保留真實驗收，同時抽象為通用 fixture。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | 自動測試不硬寫 `AI_Public_Squares` 內容，只重建「確認句 + 後續待辦」狀態類型。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 主要聲明對應斷言：affirmative lifecycle field with pending follow-up wording should pass；`no` 類 unresolved field 仍 fail。 |

## v0.3.8 發佈狀態

- 發佈版本：`0.3.8`。
- release notes：`CHANGELOG.md` 的 `v0.3.8` 段落 + `docs/whatsnew/v0.3.8.md`。
- 發佈內容：修補舊項目 upgrade no-op 與 doctor handoff health 的訊息矛盾。當 Kit 檔案已最新但交接狀態仍需 closeout 核對時，`upgrade` 不再說「繼續日常使用即可」。
- 發佈前驗收重點：scenario 4b 必須通過，確認本修補是通用 fixture，不綁定任何單一項目或 AI 正文。
- npm 狀態：已 npm publish；npm latest 曾為 `0.3.8`；package fileCount 32（從 31 增加 1，加 `docs/whatsnew/v0.3.8.md`）。
- 🟡 發佈檢：v0.3.8 post-publish verification 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、post-install `--help` / `init` / `doctor`、R-029.1 canonical phrase、npm README 與 v0.3.7→v0.3.8 chain-upgrade routing propagation 均通過。其後 `AI_Public_Squares` 實測揭出 lifecycle 欄位確認句誤判，轉入 v0.3.9 修補。

### Cross-mind evidence 9-trigger table（v0.3.8）

| Trigger condition | Required (yes/no) | Result (passed / iterated / blocked) | Follow-up (assertion ID / checklist item / accepted risk reason) |
|---|---|---|---|
| 1. 發佈說明使用「已驗證／已修復／可持續／sustainable」等強聲明 | yes | iterated | 本版只聲明 upgrade no-op handoff-health 訊息矛盾已修補；機器落點為 scenario 4b 與 package fileCount 32。 |
| 2. 同類 bug 連續兩版出現 | yes | iterated | v0.3.5 / v0.3.6 / v0.3.7 連續暴露 `doctor` / `upgrade` UX 邊界；v0.3.8 把真實舊項目問題轉為通用 fixture。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：CLI no-op output + doctor lifecycle boundary；測試層：scenario 4b；發佈敘事層：CHANGELOG、whatsnew、本段。 |
| 4. 三個以上治理檔同步改動 | yes | passed | public release-grade QA、CHANGELOG、whatsnew 與 WORK handoff / decision / QA strategy 已同步記錄。 |
| 5. 公開可見發佈儀式 | yes | iterated | Adam 已批准發佈前全面檢與 publish；本表覆蓋 publish 前判斷，publish 後仍須跑 🟡 發佈後驗證。 |
| 6. 存在人工語意判斷而無機器斷言 | yes | iterated | 「不掃 AI 正文猜語意」屬語意邊界；已轉成 Kit-controlled field check + scenario 4b 自動驗收。 |
| 7. 發佈後上一版由真實用戶抓 bug | yes | iterated | v0.3.7 發佈後 Adam 在真實舊項目測到 upgrade no-op / doctor 矛盾；本版明確把真實目錄抽象為通用 fixture，不硬編特例。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | scenario 4b 為 schema-boundary 通用 fixture，目的是重建狀態類型；真實目錄只作證據來源，不作產品規則。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 主要聲明對應斷言：upgrade no-op 不再誤稱可日常使用、doctor 仍能指出 handoff 欄位待核對、scenario 4b 通過。 |

## v0.3.7 發佈狀態

- 發佈版本：`0.3.7`。
- release notes：`CHANGELOG.md` 的 `v0.3.7` 段落 + `docs/whatsnew/v0.3.7.md`。
- 發佈內容：修補舊項目執行 `doctor` 時的 `npx` 冷啟動 UX 誤解。官方用戶路徑統一為 `npx --yes @adamchanadam/agent-handoff-kit@latest ...`，並明確說明 npm 取得 CLI 工具不等於 `doctor` 安裝或修改項目文件。
- 發佈前驗收重點：`scripts/check-release-readiness.mjs` 的 `Npx Cold-start UX Sweep` 必須確認 README、CLI help、新手介紹頁與操作指南對齊。
- npm 狀態：已 npm publish；npm latest 為 `0.3.7`；package fileCount 31（從 30 增加 1，加 `docs/whatsnew/v0.3.7.md`）。
- 🟡 發佈檢：v0.3.7 post-publish verification 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、post-install `--help` / `init` / `doctor`、R-029.1 canonical phrase、npm README 與 v0.3.6→v0.3.7 chain-upgrade routing propagation 均通過。

### Cross-mind evidence 9-trigger table（v0.3.7）

| Trigger condition | Required (yes/no) | Result (passed / iterated / blocked) | Follow-up (assertion ID / checklist item / accepted risk reason) |
|---|---|---|---|
| 1. 發佈說明使用「已驗證／已修復／可持續／sustainable」等強聲明 | yes | iterated | 本版只聲明 `npx doctor` 冷啟動 UX 已補說明與守門；機器落點為 `checkNpxColdStartUxGuidance()` 與 fileCount 31。 |
| 2. 同類 bug 連續兩版出現 | yes | iterated | v0.3.5 / v0.3.6 先後修 `doctor` / `upgrade` 與 lifecycle consistency；v0.3.7 將真實舊項目 `npx doctor` 誤解轉成正式 UX 守門。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：CLI help / next-step wording；測試層：`scripts/check-release-readiness.mjs`；發佈敘事層：README、CHANGELOG、whatsnew、intro、guide 與本段。 |
| 4. 三個以上治理檔同步改動 | yes | passed | public release-grade QA、README、HTML、CHANGELOG、whatsnew 與 WORK handoff 已同步記錄；公開 runtime 不新增治理負擔。 |
| 5. 公開可見發佈儀式 | yes | iterated | Adam 已要求進入發佈流程；本表覆蓋 publish 前判斷，publish 後仍須跑 🟡 發佈後驗證。 |
| 6. 存在人工語意判斷而無機器斷言 | yes | iterated | 「裸 npx 不是官方旅程」屬語意判斷；已補 README / CLI / intro / guide 的機器字串守門，npm README 需 publish 後驗證。 |
| 7. 發佈後上一版由真實用戶抓 bug | yes | iterated | v0.3.6 發佈後 Adam 在真實舊項目測到 npm `Need to install` 提示；本版把該情境列入 Product Journey Matrix 與 Npx Cold-start UX Sweep。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | no | passed | 產品問題來自真實舊項目行為；自動守門覆蓋公開文字一致性，發佈後再用 fresh install 驗證 npm package。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 主要聲明已對應斷言：官方 `npx --yes ...@latest` 路徑存在、裸命令不作示範、README 兩層安裝說明存在、CLI 說明 `doctor` 不修改項目。 |

## v0.3.6 發佈狀態

- 發佈版本：`0.3.6`。
- release notes：`CHANGELOG.md` 的 `v0.3.6` 段落 + `docs/whatsnew/v0.3.6.md`。
- 發佈內容：修補 v0.3.5 dogfood 發現的交接狀態一致性缺口。`doctor` 會檢查已完成或已驗證的事項是否又被下一輪當成未解調查；`SESSION_HANDOFF` 模板新增 lifecycle conflict 對賬欄位；`qa:release` 加入 `doctor` / `upgrade` 矛盾反例。
- 發佈前驗收重點：`scripts/check-release-readiness.mjs` 的模擬 closeout 必須通過正常對賬，並擋下「completed + pending 同題矛盾」反例。
- npm 狀態：已 npm publish；npm latest 為 `0.3.6`；package fileCount 30（從 29 增加 1，加 `docs/whatsnew/v0.3.6.md`）。
- 🟡 發佈檢：v0.3.6 post-publish verification 已完成；GitHub Release 非 draft / 非 prerelease，npm latest + fileCount 對齊，fresh install、post-install `--help` / `init` / `doctor`、R-029.1 canonical phrase 與 chain-upgrade routing propagation 均通過。

### Cross-mind evidence 9-trigger table（v0.3.6）

| Trigger condition | Required (yes/no) | Result (passed / iterated / blocked) | Follow-up (assertion ID / checklist item / accepted risk reason) |
|---|---|---|---|
| 1. 發佈說明使用「已驗證／已修復／可持續／sustainable」等強聲明 | yes | iterated | 發佈前全面檢使用獨立 `claude -p` 審閱交叉檢查；審閱抓到本表缺漏後，本次 root-fix 補 v0.3.6 專屬九觸發表，並在 `scripts/check-release-readiness.mjs` 加最新版本表格完整性守門。 |
| 2. 同類 bug 連續兩版出現 | yes | iterated | v0.3.5 修 `doctor` / `upgrade` 用戶旅程與 RULE_PACKS 合併，v0.3.6 修 handoff lifecycle consistency；同屬「完成狀態被下一步敘事重新打開」類風險。機器落點：`doctor` lifecycle consistency schema check、`qa:release` negative fixture、`qa:upgrade` v0.3.5 chain hop。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：`bin/agent-handoff-kit.mjs` lifecycle consistency 與 upgrade merge；測試層：`scripts/check-release-readiness.mjs` + `scripts/check-upgrade-safety.mjs`；發佈敘事層：`CHANGELOG.md` + `docs/whatsnew/v0.3.6.md` + 本段。 |
| 4. 三個以上治理檔同步改動 | yes | iterated | WORK 與 public release-grade QA 同步修正了 QC trigger、產品級發佈前全面檢、Product Journey Matrix、QC Gap Backflow 與 governance map 顯示；本 public repo 的 durable release gate 落點為本文件與 `scripts/check-release-readiness.mjs`，大型 WORK 審查上下文不提交 public repo。 |
| 5. 公開可見發佈儀式 | no — not required: v0.3.6 尚未 tag / GitHub Release / npm publish，Adam 明確要求修完後仍不得立即 publish | passed | 接受風險原因：本表只覆蓋 pre-publish gate；公開發佈儀式須另得使用者明確批准，publish 後再跑 🟡 發佈後驗證。 |
| 6. 存在人工語意判斷而無機器斷言 | yes | iterated | 人工語意判斷包括 handoff lifecycle 是否把已完成事項重新列成待辦、產品旅程矩陣、UX / user journey 結論、九觸發表完整性。已補 `qa:release` lifecycle negative fixture 與最新九觸發表完整性守門；場景 2 / 5 / 7 仍保留人工 checklist，若同類第二次再出現即轉自動 fixture。 |
| 7. 發佈後上一版由真實用戶抓 bug | yes | iterated | v0.3.5 發佈後 dogfood 揭發 handoff 內「已完成 doctor / upgrade 調查」又被下一輪 opening message 當成未解調查；v0.3.6 將此轉為 lifecycle consistency schema check + release negative fixture。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | Handoff lifecycle negative fixture 屬受控合成，用於語意邊界測試；upgrade path 同時由真實 prior-version chain 覆蓋至 v0.3.5。接受條件：合成 fixture 只承擔 schema / semantic-boundary，production upgrade state 仍由 `qa:upgrade` real chain 與 user-data regression 承擔。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | v0.3.6 的主要聲明已對應斷言：lifecycle conflict 欄位存在 → `runtime-core/SESSION_HANDOFF.md` anchor + doctor schema；已完成事項不可未解 carry-forward → `assessHandoffLifecycleConsistency()` + `qa:release` negative fixture；v0.3.5 → v0.3.6 upgrade path → `qa:upgrade` chain；九觸發表不可空白 → `qa:release` 最新版本表格完整性守門。 |

## v0.3.5 發佈狀態

- 發佈版本：`0.3.5`。
- release notes：`CHANGELOG.md` 的 `v0.3.5` 段落 + `docs/whatsnew/v0.3.5.md`。
- 發佈內容：修補 v0.3.4 後續全面治理審計揭發的 `doctor` / `upgrade` / `init` 用戶旅程問題。`upgrade` 補齊 `dev/RULE_PACKS.md` Kit routing rows 時保留用戶自訂 rows；如 routing table 表頭已被改動，工具改為 `conflict` 停手。`doctor` 明確說明自己只檢查、不修改，版本不齊時先建議 `upgrade --dry-run`。
- 發佈前驗收重點：`scripts/check-upgrade-safety.mjs` 新增三個 `RULE_PACKS.md` 回歸場景，覆蓋自訂 row 保留、同 pack path 自訂 row、表頭改動 conflict；prior-version chain 由 v0.3.4 tag 再升到 v0.3.5 current HEAD。
- npm 狀態：發佈後應驗證 npm latest 為 `0.3.5`；package fileCount 29（從 28 增加 1，加 `docs/whatsnew/v0.3.5.md`）。
- 🟡 發佈檢：v0.3.5 publish 後必須執行 GitHub Release、npm package metadata、fresh install、post-install `--help` / `init` / `doctor`、R-029.1 canonical phrase 與 chain-upgrade routing propagation 驗證。

## v0.3.4 發佈狀態

- 發佈版本：`0.3.4`。
- release notes：`CHANGELOG.md` 的 `v0.3.4` 段落 + `docs/whatsnew/v0.3.4.md`。
- 發佈內容：修補 v0.3.3 發佈後由真實用戶測試揭發的升級敘事錯誤。舊流程在 merge 前注入 `PROJECT_INDEX` template version，當 `PROJECT_INDEX` 同時需要結構合併時，merge 會把版本列覆蓋回舊值；本版改為 create / merge 完成後再注入。同步補上 metadata-only no-op guard，避免只有版本資料列過期時誤報「已經是最新版本」。migration report 新增 metadata section，記錄 `Agent Handoff Kit template version` 的更新軌跡。`scripts/check-upgrade-safety.mjs` 的 staleRoot 驗收口徑同步改為：template version metadata 屬維護者管理的模板資料，不屬 External Sources、Fact Base、Workspace Identity 等使用者內容；此口徑不削弱使用者內容保護。
- QC framework 修補：`scripts/check-release-readiness.mjs` 將 scenario 3 拆成 scenario 3a（metadata-only stale）與 scenario 3b（structurally stale via real v0.1.7 fixture）。scenario 3b 使用真實 `test-fixtures/v0.1.7/dev/PROJECT_INDEX.md`，不再只用目前版本 init 後手動改字串的合成狀態。Loop 1 code review 另抓到兩個高信心缺口：`scripts/check-upgrade-safety.mjs` 的 `chainSteps` 漏 v0.3.x 路徑，以及 `scripts/check-release-readiness.mjs` 的 scenario docblock 仍停在 3 個自動場景；兩者已修補。
- 發佈前驗收：本次 ship-prep 後 `npm run qa:release` 重新通過；Loop 1 修補後 `npm run qa:release` 與 `npm run qa:upgrade` 亦已重新通過。重點覆蓋 scenario 3a / 3b、scenario 6 doctor healthy、staleRoot R-031.3 v0.3.4 policy、v0.3.0 → v0.3.4 prior-version chain coverage，以及 package fileCount 28。
- npm 狀態：已 npm publish；npm latest 為 `0.3.4`；package fileCount 28（從 27 增加 1，加 `docs/whatsnew/v0.3.4.md`）。
- 🟡 發佈檢：v0.3.4 post-publish verification 已完成；GitHub Release、npm package metadata、fresh install、post-install `--help` / `init` / `doctor`、R-029.1 canonical phrase 與 chain-upgrade routing propagation 均已通過。`3009712` 屬 v0.3.4 之後的 Unreleased source change，尚未進入 npm 發佈檢範圍。

### Cross-mind evidence 9-trigger table（v0.3.4）

| Trigger condition | Required (yes/no) | Result (passed / iterated / blocked) | Follow-up (assertion ID / checklist item / accepted risk reason) |
|---|---|---|---|
| 1. 發佈說明使用「已驗證／已修復／可持續／sustainable」等強聲明 | yes | iterated | 發佈敘事使用「修補／通過／可發佈」等強口徑，已經 7 round Codex audit + sub-agent audit 交叉檢查；維護者側 audit trail 保留 prompt / response 原文，公開 repo 只保留本表摘要，避免把大型審查上下文納入發佈內容。 |
| 2. 同類 bug 連續兩版出現 | yes | iterated | v0.3.3 已修補 upgrade / doctor 敘事一致性，v0.3.4 再由真實用戶抓到同類 production gap；Round 1-2 將根因收斂為 inject-vs-merge ordering + metadata-only no-op guard；機器覆蓋落點為 `scripts/check-release-readiness.mjs` scenario 3a / 3b 與 `scripts/check-upgrade-safety.mjs` staleRoot policy assertion。 |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | yes | passed | 功能層：`bin/agent-handoff-kit.mjs`；測試層：`scripts/check-release-readiness.mjs` + `scripts/check-upgrade-safety.mjs`；發佈敘事層：`CHANGELOG.md` + `docs/whatsnew/v0.3.4.md` + 本段。Round 7 實作審核 verdict: ship；維護者側 audit trail 保留實作審核原文。 |
| 4. 三個以上治理檔同步改動 | no — not required: v0.3.4 ship-prep 只更新一個公開驗收治理檔 `docs/qa/release-grade-qa.md`；先前 WORK 多治理檔更新屬 cross-AI governance integration，已另行審核 | not required | 接受風險原因：本 release 的必要治理落點是本文件的發佈狀態與九觸發表，不新增三個以上治理真源；相關 governance integration 已於維護者側 audit trail 覆核，公開 repo 不提交該大型上下文。 |
| 5. 公開可見發佈儀式 | yes | passed | v0.3.4 已完成 commit / tag / GitHub Release / npm publish；post-publish 發佈檢已完成。`3009712` 屬 v0.3.4 之後的 Unreleased source change，不改寫 v0.3.4 發佈儀式狀態；若要將其發佈到 npm，須另行走新 patch release 流程。 |
| 6. 存在人工語意判斷而無機器斷言 | yes | passed | Loop 1：`chainSteps` 補上 v0.3.0 / v0.3.1 / v0.3.2 / v0.3.3 / v0.3.4（v0.3.4 以 current HEAD pre-tag hop 執行），兩處 `simulateScenarioBranching` docblock 改為 5 個自動場景並移除已過期 delegation claim。Loop 2：刪除 stale final-hop comment、明確排除未提交 `outputs` 證據目錄、將本文件七場景表同步為 3a / 3b 與 5 個自動場景。Loop 3：第三輪 code review 抓到場景 4 表格門檻誤寫為 ≤ 15；已按 `scripts/check-release-readiness.mjs` scenario 4 機器斷言對齊為 ≤ 20，避免文件門檻低於實際驗收。Loop 4：逐列對照七場景表與 `simulateScenarioBranching()` 實際斷言，確認場景 1 / 3b / 4 / 6 與程式一致，場景 2 / 5 / 7 屬人工驗收列；修正場景 3a 由錯誤 no-op 敘事改為升級路徑 + metadata 更新 + doctor 不再提示 root 落後 CLI，並新增 `qa:release` 內建七場景表對齊檢查，防止同類表格漂移重演。重驗：`npm run qa:release` + `npm run qa:upgrade`。 |
| 7. 發佈後上一版由真實用戶抓 bug | yes | iterated | v0.3.3 發佈後由 Adam 真實 root 測試抓到 v0.1.7 template version stuck + doctor contradiction；本版以真實舊版 fixture 補測。WORK `dev/SESSION_HANDOFF.md` 保留 current baseline；公開驗收證據落點為 scenario 3b 的真實 `test-fixtures/v0.1.7/dev/PROJECT_INDEX.md`。 |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | yes | iterated | 原 scenario 3 使用 current init + manual string edit，未覆蓋 merge path；本版保留 3a 作 metadata-only 邊界測試，新增 3b 使用真實 `test-fixtures/v0.1.7/dev/PROJECT_INDEX.md` 覆蓋 structurally stale path。機器斷言：`scripts/check-release-readiness.mjs` scenario 3a / 3b。 |
| 9. 發佈聲明與測試斷言不是一對一映射 | yes | iterated | 四個產品聲明已對應到斷言或人工 checklist：inject-after-merge → scenario 3b；metadata-only no-op guard → scenario 3a；migration report extension → release narrative + non-blocking reviewer check；staleRoot policy → `scripts/check-upgrade-safety.mjs` staleRoot assertion。維護者側 ship-prep audit 保留 reviewer discussion；公開 repo 保留本摘要與斷言落點。 |

## v0.3.3 發佈狀態

- 發佈版本：`0.3.3`。
- release notes：`CHANGELOG.md` 的 `v0.3.3` 段落 + `docs/whatsnew/v0.3.3.md`。
- 發佈內容：修補 v0.3.2 用戶實測（Adam 跑 `npx ... upgrade` 喺 v0.1.3 root → CLI v0.3.2）即時揭發嘅兩個 user journey narrative coherence bug。(1) Upgrade 完成後 doctor 自相矛盾 —— 用戶剛跑完 upgrade，self-check doctor 立刻講「root 落後 CLI，可執行 upgrade」；root cause 係 v0.3.2 inject logic 只 cover fresh install scenario。(2) 跨多版本 upgrade 嘅 whatsnew range narrative misleading —— output 講「涵蓋 2 個版本嘅 release notes」未明文話跨度。產品層修補：`bin/agent-handoff-kit.mjs` `doInstallOrUpgrade` PROJECT_INDEX template version inject 條件由 `created.includes` 擴至 `command === "upgrade" || created.includes(...)`；`printWhatsnew` 加 deep range narrative（明文 print「跨度較大 + GitHub Release link」）。QC framework 修補：`scripts/check-release-readiness.mjs` 加 R-031.1 scenario 3 deep range fixture（v0.1.3 root → upgrade → assert template version inject + 無 contradicting hint + deep range narrative 命中）。治理層：`docs/REQUIREMENTS_CONVERGENCE.md` R-016 row 加註「user-owned 指 user content rows，唔包 template version metadata row」+ R-031 row 補 R-031.3 v0.3.3 narrative。
- 發佈前驗收：qa:release 全綠（既有 26+ assertions + R-031.1 scenario 1/3/4/6 simulation PASS 含新加 scenario 3 deep range + R-031.3 string assertions PASS）。
- npm 狀態：已 npm publish；npm latest 為 `0.3.3`；package fileCount 27（從 26 增加 1，加 `docs/whatsnew/v0.3.3.md`）。

### Plan-time discipline mandatory（R-031.3，v0.3.3 新加）

**Plan-time user-journey simulation mandatory item** —— 由 v0.3.3 起，任何涉及 user-facing 命令（init / upgrade / doctor / 未來新 sub-command）嘅 release verification，**plan 必明文 simulate 至少一個 deep version range upgrade**（譬如 root template version v0.1.x → 當前 CLI），並 verify：

1. Post-upgrade PROJECT_INDEX template version row 已 inject 為當前 CLI version
2. 自動跑嘅 self-check doctor 嘅 「項目狀態速覽」narrative 同上一步 upgrade banner coherent（唔出 contradicting hint）
3. 跨多版本嘅 whatsnew print 含明文 deep range narrative + GitHub Release link
4. Optional review phrase「I just upgraded」print

呢條紀律屬 framework critique L3 嘅第一步落地 —— 防 reactive default（用 fresh install / 細跨度 fixture 做 verification）重演揭發 cross-version journey gap。違反即視為 L3 critique recurrence。

**Cross-mind evidence sub-rule（v0.3.4 起新加，作為 R-031.3 plan-time discipline 嘅子規則）**

每 release plan 須對 stateless-cross-ai-audit skill 嘅 9 個 trigger conditions 逐一登記證據。**缺表、漏行、空欄、blocked 未處理 = release gate fail；不得進入 commit / tag / publish 或等效發佈步驟**。Skip 屬 explicit decision，必填「not required + reason」，唔可空白。

以下表格只是複製模板，不是任何版本的發佈證據。每個候選版本必須在自己的 `Cross-mind evidence 9-trigger table（vX.Y.Z）` 段落填寫完整表格；不可把本模板留空當作驗收。

| Trigger condition | Required (yes/no) | Result (passed / iterated / blocked) | Follow-up (assertion ID / checklist item / accepted risk reason) |
|---|---|---|---|
| 1. 發佈說明使用「已驗證／已修復／可持續／sustainable」等強聲明 | fill yes/no + reason | fill passed/iterated/blocked | fill assertion ID / checklist item / accepted risk reason |
| 2. 同類 bug 連續兩版出現 | fill yes/no + reason | fill passed/iterated/blocked | fill assertion ID / checklist item / accepted risk reason |
| 3. 改動跨越功能 + 測試 + 發佈敘事三層 | fill yes/no + reason | fill passed/iterated/blocked | fill assertion ID / checklist item / accepted risk reason |
| 4. 三個以上治理檔同步改動 | fill yes/no + reason | fill passed/iterated/blocked | fill assertion ID / checklist item / accepted risk reason |
| 5. 公開可見發佈儀式 | fill yes/no + reason | fill passed/iterated/blocked | fill assertion ID / checklist item / accepted risk reason |
| 6. 存在人工語意判斷而無機器斷言 | fill yes/no + reason | fill passed/iterated/blocked | fill assertion ID / checklist item / accepted risk reason |
| 7. 發佈後上一版由真實用戶抓 bug | fill yes/no + reason | fill passed/iterated/blocked | fill assertion ID / checklist item / accepted risk reason |
| 8. 測試 fixture 屬人工合成（非歷史真實版本） | fill yes/no + reason | fill passed/iterated/blocked | fill assertion ID / checklist item / accepted risk reason |
| 9. 發佈聲明與測試斷言不是一對一映射 | fill yes/no + reason | fill passed/iterated/blocked | fill assertion ID / checklist item / accepted risk reason |

每 trigger 嘅 Result 必填以下三者之一：
- `passed` — cross-AI audit 已跑且 ship-ready
- `iterated` — cross-AI 揭發要 iterate；revised plan 已 incorporate 並重 audit
- `blocked` — cross-AI 揭發 design 性問題未解決；release blocked

Skip 嘅 record 必含具體 reason（譬如「Trigger 7 not required: 上一版冇用戶 catch bug」），唔接受空白或單字「N/A」。

證據追溯：cross-AI audit 嘅 prompt + response 必保留喺維護者側 `outputs` audit trail；除非 release plan 明確決定 versioned audit artifacts 屬公開交付物，公開 repo 不提交大型審查上下文。公開 Follow-up 欄應引用摘要、機器斷言落點、人工 checklist item 或 DECISION_LOG entry；不得引用未提交嘅 repository path。

呢個 sub-rule 屬 R-031.3 plan-time discipline 嘅 operational sub-item；違反同 R-031.3 違反同等視為 L3 critique recurrence，blocks release。

## v0.3.2 發佈狀態

- 發佈版本：`0.3.2`。
- release notes：`CHANGELOG.md` 的 `v0.3.2` 段落 + `docs/whatsnew/v0.3.2.md`（new structured whatsnew）。
- 發佈內容：Adam 對 v0.3.1 release 後做 user journey critique 觸發 —— 揭發「doctor 唔識自動做新版本檢查」嘅 awareness gap + framework 三層 systemic critique（QC state-based 唔係 journey-based / AI reactive responder 唔係 proactive anticipator / dev process 把 catch 當 single-data-point absorption）。本版本針對 init / upgrade / doctor 三個命令做 user-journey-driven UX 重設計：(1) init 加 mini-checklist 答「我裝啱咗嗎」；(2) doctor 加「項目狀態速覽」三句（三向 version 對比 + 距上次 closeout + 項目首次安裝距今）；(3) upgrade 加 inline whatsnew summary 直接 surface 本版同跨版本嘅 release notes；(4) fresh install 注入當前 CLI version 入 PROJECT_INDEX template metadata（修補由 v0.1.7 起 hardcoded 0.1.7 嘅 fact-error）。新檔 `docs/whatsnew/v<version>.md` 三段固定 schema（本版新加咗咩 / 對你已有檔案嘅影響 / 建議下一步），每次 release maintainer 必寫。
- 發佈前驗收：qa:release 全綠（既有 26+ assertions + R-031.1 三場景 simulation + 場景 4 upgrade no-op 行數 ≤ 20 sustained）。Doctor schema check 同 anchor check 未變仍全部通過。
- npm 狀態：已 npm publish；npm latest 為 `0.3.2`；package fileCount 26（從 24 增加 2，因加 `docs/whatsnew/v0.3.1.md` + `docs/whatsnew/v0.3.2.md`）。

## v0.3.1 發佈狀態

- 發佈版本：`0.3.1`。
- release notes：`CHANGELOG.md` 的 `v0.3.1` 段落。
- 發佈內容：第一個真實 v0.3.0 用戶 session 揭發 CLI 升級流程 messaging gap：升級完成印「✅ 安裝完成」+ 推送新手起步句、第二次升級（零改動）仍跑完整 ceremony、doctor 結尾叫人升級但 startup 已印 update notice。Root cause：R-026 CLI Output Contract sweep helper 屬 lexical layer，未 cover scenario-fit layer。v0.3.1 修補 `bin/agent-handoff-kit.mjs` —— `runInstall` 加 plan-time upgrade no-op detection（zero create / merge / conflict 即短路）+ `printInstallNextSteps` split 為 install / upgrade-substantive / upgrade-noop 三個 helper + `runDoctor` 結尾 next-step 唔再 unconditional 推送 upgrade。同步擴展 QC framework：`docs/qa/release-grade-qa.md` 加新治理 QA 缺口矩陣 dim「CLI 場景分流（scenario branching）一致性」+ 配套 CLI Scenario Branching Coverage Sweep（automated simulation 場景 1 / 3 / 4 / 6 first land），防同類 audit blind spot 重演。
- 發佈前驗收：qa:release 全綠（既有 26+ assertions + 新加場景 simulation assertions）。Doctor schema check 同 anchor check 未變仍全部通過。
- npm 狀態：已 npm publish；npm latest 為 `0.3.1`；package fileCount 維持 24（本次無新加檔案入 npm package）。

## v0.3.0 發佈狀態

- 發佈版本：`0.3.0`。
- release notes：`CHANGELOG.md` 的 `v0.3.0` 段落。
- 發佈內容：**v2 second major version bump**（v0.2.x → v0.3.0）。引入 first-class **Integration Governance Framework**（R-030）支持 Connectors + MCPs + Plugins + Skills 跨 session 治理 + 機密分離原則 + 多層持久化 source-of-truth architecture + cross-tool resilience。新加 `packs/integrations.md`（~400 行 10th rule pack）+ `runtime-core/PROJECT_INDEX.md` 加 `## Installed Integrations` H2 section（4 subsection + Source-of-truth Architecture sub-table + 機密分離 header）+ 既有 External Sources 表加 `via` column + AGENTS.core.md startup availability probe + RULE_PACKS routing 加新 row + SESSION_HANDOFF Durable Anchors 加 row 6 + packs/knowledge.md Rule 5 重寫 Connector-first（backward-compat preserved）+ packs/safety.md Rule 10 三層 differentiation + 新 Rule 12 credential leak prevention + packs/onboarding.md 加 Scenario F + 5 既有 Scenarios Step 1 micro-question + bin/agent-handoff-kit.mjs 加 `checkInstalledIntegrationsCredentialLeak()` doctor function（14 credential prefix grep）+ classifyExistingFile PROJECT_INDEX migration auto-append + 7 處 user-facing R-XXX leak normalize + 4 scripts 全部 update + guide.html Cases A/B/C narrative 重寫（Connector-primary + Terminal mock blocks version-agnostic + hero/Step 2 callout retire 內部 jargon 共用「兩種開工方式」anchor）+ README 加新「外部工具治理」section。
- 發佈前驗收：qa:release 全綠（既有 21 assertions + 5+ 新 v0.3.0 assertion = 26+）。Doctor 顯示 10 schema checks status passed + credential leak sweep ok + integrations pack structure check ok。Cross-callout wording grep「兩種開工方式」命中 hero + Case A Step 2 callout。內部 jargon ban grep 對 intro + guide 0 hits。credential prefix sweep 對 runtime-core 兩 template files 0 hits。
- npm 狀態：已 npm publish；npm latest 為 `0.3.0`；package fileCount 24（從 23 增加，因加 `packs/integrations.md`）。

### Installed Integrations Discipline Sweep（R-030）

對 `runtime-core/PROJECT_INDEX.md` template 嘅 `## Installed Integrations` section 驗證：
- 4 個 subsection heading 命中：Connectors / MCPs / Plugins / Skills
- Source-of-truth Architecture sub-table 命中
- 機密分離原則 header 命中
- 5 個 table header schema 命中
- External Sources 表 `via` column 命中
- assertIncludes 對 PROJECT_INDEX + AGENTS.core.md + SESSION_HANDOFF + RULE_PACKS + integrations pack + knowledge/safety/onboarding 全部新 anchor 命中

### Credential Leak Prevention Sweep（R-030）

對 `runtime-core/PROJECT_INDEX.md` + `runtime-core/SESSION_HANDOFF.md` template files 強制 grep 14 個 credential prefix patterns（`sk-` / `sk-ant-` / `ntn_` / `secret_` / `ya29.` / `1//` / `xox[abprs]-` / `ghp_` / `gho_` / `ghs_` / `github_pat_` / `sl.` / `AKIA` / `AIza`）。命中即 release 阻擋。Runtime 階段由 `bin/agent-handoff-kit.mjs` `checkInstalledIntegrationsCredentialLeak()` doctor function 對用戶嘅 `dev/PROJECT_INDEX.md` + `dev/SESSION_HANDOFF.md` + `dev/SESSION_LOG.md` 跑同樣 sweep；命中即 doctor `status: failed`。

### 內部 jargon ban（R-030）

對 user-facing HTML（`agent-handoff-kit-intro.html` + `agent-handoff-kit-guide.html`）強制 grep `v2 (的|嘅) advanced user path` 等已 retire 內部 jargon patterns。命中即 release 阻擋。

### Cross-callout wording consistency（R-030）

`agent-handoff-kit-guide.html` 嘅 hero callout + Case A Step 2 bridging callout 必共用同一套白話 anchor「兩種開工方式」。qa:release grep enforce 喺 guide.html 命中此 anchor，確認 cross-callout wording 一致防 silent drift。

## v0.2.3 發佈狀態

- 發佈版本：`0.2.3`。
- release notes：`CHANGELOG.md` 的 `v0.2.3` 段落。
- 發佈內容：Patch release 修補 `agent-handoff-kit-guide.html` 三類遺留缺口。**Fix 1**：Case C 4 個 pre block 採用破壞性 inline style（`background: var(--paper-2)` 淺色 + inherited `color: var(--paper)` 亦淺色）導致 light-on-light 文字完全 unreadable —— 移除全部 inline style 回歸預設 `.chat-bubble pre` CSS（黑底 paper 字）。**Fix 2**：Case C「決策日誌」展示嘅後端模型對比範例引用 2025 舊模型（Claude 3.5 Sonnet / GPT-4 Turbo / Gemini 1.5 Pro / 200k context）已脫節 2026-05 時點；WebSearch 確認 latest 為 Claude Sonnet 4.6（Feb 2026, 1M context）/ GPT-5.5（April 2026）/ Gemini 3.5 Pro（May 2026）；guide.html 7 處更新。**Fix 3（R-029.5）**：Cases A/B Step 2 對話框示範 advanced user direct path「Read AGENTS.md and follow it...」與第一螢 R-029 callout canonical phrase「I just installed agent-handoff-kit. Help me get started.」唔同；Adam catch「啲句點解唔一致」。採用 β 中度改動（Adam approved）：Case A Step 2 加「兩條入場路」bridging callout 15-20 行解釋新手嘅 onboarding trigger 句 vs 老手嘅直接句點解殊途同歸；Case B Step 2 加 reference sentence。完整保留 narrative authenticity（不改 user bubble 句式）。
- 發佈前驗收：qa:release 全綠（既有 21 assertion + 內置 cross-surface + internal-reference + book-language sweep 全部 0 命中）；guide.html 內置 internal reference forbidden patterns（R-XXX / closeout step N / strict mechanical）grep 0 hit；新加 bridging callout 沿用 v0.2.2 紀律全部用日常語言表達。
- npm 狀態：已 npm publish；npm latest 為 `0.2.3`；package fileCount 23（不變 — patch 屬 release artifact wording，唔加新 file）。

## v0.2.2 發佈狀態

- 發佈版本：`0.2.2`。
- release notes：`CHANGELOG.md` 的 `v0.2.2` 段落。
- 發佈內容：Critical patch release 修補 v0.2.0 + v0.2.1 release 落地時嘅 **internal reference ID leak on user-facing surfaces** —— R-XXX explicit IDs / closeout step N internal numbering / strict mechanical discipline jargon 大量混入 README + intro.html + guide.html。R-026 forbidden vocabulary sweep 第三次 design gap：scope 只 cover「人話解讀」自貶 phrase，唔 cover internal governance jargon。**v0.2.2 修補**：(a) 10+ 處 user-facing surface internal references normalize 為人話（R-029 → 新手引導 / R-028 紀律 → AI 自動 maintain 紀律 / closeout step 12 → AI 收工時嘅自動 maintain 條件 / strict mechanical → 硬性自動執行 等）；(b) `scripts/check-release-readiness.mjs` 加 `internalReferenceForbidden` patterns 對 3 個 user-facing surface 強制 grep 0 命中（R-\d{3} / closeout step \d+ / strict mechanical patterns）；(c) CHANGELOG historical entries 自然 reference R-XXX 屬 release 敘事必要，由既有 anchor-bounded grep strategy 排除（internal-reference sweep scope 不 cover CHANGELOG）。Honest reflection：R-026 forbidden vocabulary 設計從一開始應該 separate concerns（自貶 vocab / internal ID / canonical phrase），但既有 ad-hoc 累加 pattern 沿用，future refactor 可重組為 categorical sweeps。
- 發佈前驗收：qa:release 全綠（既有 18 assertion + 3 個新 internal-reference sweep verifications，總 21 個 assertion）+ post-install CLI output 含 canonical R-029 trigger phrase（沿用 v0.2.1 紀律）+ chain test RULE_PACKS routing row 強制 assertion 通過。
- npm 狀態：已 npm publish；npm latest 為 `0.2.2`；package fileCount 23（不變 by R-029.4 design — patch 屬 wording/QC discipline，唔加新 file）。

## v0.2.1 發佈狀態

- 發佈版本：`0.2.1`。
- release notes：`CHANGELOG.md` 的 `v0.2.1` 段落。
- 發佈內容：Critical patch release 修補 v0.2.0 R-029 落地時嘅 cross-surface wording inconsistency + upgrade flow routing table propagation gap + QC 流程粗疏 dimension。**R-029.1**（cross-surface wording fix）：`bin/agent-handoff-kit.mjs` `printInstallNextSteps` + `printHelp` 對齊 canonical R-029 trigger phrase；README + intro.html + guide.html user prompt examples 統一；既有 legacy prompt 保留為 fallback。**R-029.2**（upgrade flow routing table propagation）：`bin/agent-handoff-kit.mjs` `classifyExistingFile` 加 `dev/RULE_PACKS.md` force-update merge logic；schemaChecks 加 strict anchor「First-time user signals」+「dev/rules/onboarding.md」；`scripts/check-upgrade-safety.mjs` chain test final hop 加 RULE_PACKS.md routing row assertion。**R-029.3**（QC process gap fix）：`scripts/check-release-readiness.mjs` 加 `checkCrossSurfaceWordingConsistency()` helper；`scripts/check-public-prototype.mjs` 加 post-install CLI output canonical phrase assertion；docs/qa/release-grade-qa.md 加新 Cross-surface Wording Consistency Sweep section + 治理 QA 缺口矩陣加 2 新 dim（Cross-surface wording alignment + Routing table propagation discipline）+ 補丁前置狀態枚舉加 R-029.1 row；🟡 發佈檢由 6 項擴展為 7 項。Architectural reclassification：`dev/RULE_PACKS.md` 由 user customization target 重新歸類為 maintainer-owned routing table。
- 發佈前驗收：完整四條 QA + R-029.1 cross-surface wording sweep 通過 + chain test final hop RULE_PACKS.md routing row assertion 通過 + R-005 quick re-walk verify 緊張可控 + Cross-surface wording consistency Sweep 全部 grep 命中。
- npm 狀態：已 npm publish；npm latest 為 `0.2.1`；package fileCount 23（不變）。

## v0.2.0 發佈狀態

- 發佈版本：`0.2.0`。
- release notes：`CHANGELOG.md` 的 `v0.2.0` 段落。
- 發佈內容：**R-028 用戶項目治理擴展 + R-029 新手 onboarding AI driven walk-through** 二合一 architectural improvement。R-028 部分：新加 `runtime-core/PROJECT_DECISIONS.md` template（4 H2 section + 檔頭 onboarding tone）+ `runtime-core/AGENTS.core.md` closeout step 12 紀律（AI smart detect heuristic：Decisions split / Evolution / Architecture / Insights）+ R-026 forbidden vocabulary scope 擴展（CLI source + README + onboarding HTML + CHANGELOG anchor-bounded latest section）+ Onboarding HTML 書面語紀律 enforcement。R-029 部分：新加 `packs/onboarding.md` rule pack（含 5 個 Application Scenario A-E × 5-step walk-through pattern + AI sample wording per step + Cross-reference to guide.html + Tone Discipline + Anti-pattern table）+ `runtime-core/AGENTS.core.md` `## 1. Startup Reads` 加 first-time-user signal detection + proactive onboarding load 紀律 + `runtime-core/RULE_PACKS.md` 加 first-time signal routing row + 配套 `bin/agent-handoff-kit.mjs` mappings / requiredAnchors / schemaChecks 擴展。Scripts 同步：4 個 scripts 全部 update (total files 21 → 22 → 23；assertions 加 PROJECT_DECISIONS + onboarding；book-language sweep + R-026 forbidden vocabulary sweep + onboarding pack mixed scenario)。對外 onboarding：intro 加 `#tiers` section「分檔有層次」（Hot / Warm / Cold 三格）+ guide 加 Case C「長期項目演進」4-phase narrative + README 加「項目決策日誌」段 + README first-screen「不需要先讀」messaging + intro/guide 加「不需要先讀」cross-reference。Major version bump（v0.1.8 → v0.2.0）反映 R-028 + R-029 屬 substantive architectural change。npm package files 由 21 → 23（含 `runtime-core/PROJECT_DECISIONS.md` + `packs/onboarding.md`）。
- 發佈前驗收：完整四條 QA + 動態 baseline real first-test 通過（version 0.1.8 → 0.2.0 腳本零改動仍 PASS）+ Plan scope coverage matrix release-context first-test 通過 + R-005 治理健康檢查 walk-through verdict ∈ {健康, 緊張 / 合併方向} + Release Artifact Vocabulary Sweep 全部 grep 命中 + Project Decisions Discipline Sweep 全部 grep 命中 + **Onboarding Pack Discipline Sweep 全部 grep 命中** + 書面語紀律 grep 0 命中 + CLI Output Contract sweep 既有 grep 仍命中 + `qa:packs` 嘅 onboarding routing scenario + first-time onboarding to first task mixed scenario 通過。
- npm 狀態：已 npm publish；npm latest 為 `0.2.0`；package fileCount 23。

## v0.1.8 發佈狀態

- 發佈版本：`0.1.8`。
- release notes：`CHANGELOG.md` 的 `v0.1.8` 段落。
- 發佈內容：R-010 SESSION_LOG 接力角色紀律 propagation 入 npm package — `runtime-core/AGENTS.core.md` closeout step 11（N 規則 mandatory advancement + AI proactive enforce）+ `runtime-core/SESSION_LOG.md` head blockquote + `bin/agent-handoff-kit.mjs` `assessSessionLogDiscipline()` doctor warn-only safety net（H2 entry ≥ 11 / ≥ 25 / 主檔 line ≥ 1500 全部 warn，exit 不變 0）+ `scripts/check-release-readiness.mjs` 加 grep + doctor stdout assertions + 本文件加 SESSION_LOG handoff-role discipline sweep section + 治理 QA 缺口矩陣 +1 維度。對外 onboarding（`agent-handoff-kit-intro.html` / `agent-handoff-kit-guide.html` / `README.md`）同步 v0.1.8 + R-010 紀律描述（指南頁 Case A Step 06「Kit 內置邏輯」box 加第 5 條治理段；README `dev/SESSION_LOG.md` row description 補 archive 機制）。release-gate 腳本根因治理：`scripts/check-release-readiness.mjs` + `scripts/check-public-prototype.mjs` 嘅 current release baseline / tarball name / README assertion / CHANGELOG latest segment / release-grade-qa.md latest pointer / mock newer version 全部 refactor 至動態讀 `package.json` 嘅 version，免下次 release 漏對齊。
- 發佈前驗收：完整四條 QA（含新 `SESSION_LOG discipline (R-010): ok` assertion 與動態 baseline）+ 版本號對齊（`README.md` + `package.json` + `CHANGELOG.md` + onboarding HTML + 本文件 latest pointer）+ package boundary（21 files 未變）+ GitHub Release 材料 + npm package metadata + CLI Output Contract sweep。
- npm 狀態：已 npm publish；npm latest 為 `0.1.8`。

## v0.1.7 發佈狀態

- 發佈版本：`0.1.7`。
- release notes：`CHANGELOG.md` 的 `v0.1.7` 段落。
- 發佈內容：R-024 夾心 dup core 修補（`assessAgentsMdHealth()` 函數合三為一）+ `upgrade` self-check；R-025 真實 fixture（`test-fixtures/v0.1.4`/`v0.1.5`/`v0.1.6` + `scripts/generate-upgrade-fixtures.mjs`）+ 跨版本鏈式升級驗收 + 補丁前置狀態枚舉；R-026 CLI Output Contract 取代 R-013／R-017／R-021；`runtime-core/AGENTS.core.md` 加 `## 2.1 Upgrade Done Contract` 段。
- 發佈前驗收：完整四條 QA + `qa:fixtures`、版本號確認、package boundary（21 files 未變）、GitHub Release 材料、npm package metadata、CLI Output Contract sweep（「人話解讀」字眼 0 命中 + 版本／模式／剛做咗乜／下一步四項契約滿足）。
- npm 狀態：已 npm publish；npm latest 為 `0.1.7`。

## v0.1.6 發佈狀態

- 發佈版本：`0.1.6`。
- release notes：`CHANGELOG.md` 的 `v0.1.6` 段落。
- 發佈內容：修正舊版未標記 `AGENTS.md` core 升級時 append 成雙核心的問題；升級會替換 stale Kit core 並保留 core 前後本地規則；`doctor` 與 `qa:upgrade` 已補雙核心負面檢查。
- 發佈前驗收：完整四條 QA、版本號確認、package boundary、GitHub Release 材料、npm package metadata。
- npm 狀態：已 npm publish；npm latest 為 `0.1.6`（v0.1.7 發佈後改為 archived，但 npm registry 仍可 install）。

## v0.1.5 發佈狀態

- 發佈版本：`0.1.5`。
- release notes：`CHANGELOG.md` 的 `v0.1.5` 段落。
- 發佈內容：修正 README 內新手介紹頁連結，改為 GitHub Pages 絕對網址 `https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-intro.html`，讓 GitHub 與 npm README 都能正確導向。
- 發佈前驗收：完整四條 QA、版本號確認、package boundary、GitHub Pages 來源設定、GitHub Release 材料、npm package metadata。
- npm 狀態：已 npm publish；npm latest 為 `0.1.5`。

## v0.1.4 發佈狀態

- 發佈版本：`0.1.4`。
- release notes：`CHANGELOG.md` 的 `v0.1.4` 段落。
- 發佈內容：R-019 下次開工提示副本、R-020 新手介紹頁與 onboarding 對齊、R-021 CLI 回傳訊息新手化、R-022 技能／子代理流程仲裁。
- 發佈前驗收：完整四條 QA、版本號確認、package boundary、GitHub Release 材料、npm package metadata。
- npm 狀態：已 npm publish；npm latest 為 `0.1.4`。

## v0.1.3 發佈狀態

- 發佈版本：`0.1.3`。
- release notes：`CHANGELOG.md` 的 `v0.1.3` 段落。
- 發佈內容：R-016 doctor 版本錨點修復、R-017 emoji / 精簡開工 prompt、R-018 CLI 非阻塞版本自檢。
- 發佈前驗收：完整四條 QA、版本號確認、package boundary、GitHub Release 材料、npm package metadata。
- npm 狀態：已 npm publish；npm latest 為 `0.1.3`。

## v0.1.2 發佈狀態

- 發佈版本：`0.1.2`。
- release notes：`CHANGELOG.md` 的 `v0.1.2` 段落。
- 發佈內容：修正 `v0.1.1` package README 仍顯示候選狀態的文件事實錯誤。
- 發佈前驗收：完整四條 QA、版本號確認、npm package metadata、`npx` 實際安裝與 `doctor`。

## v0.1.1 發佈狀態

- 發佈版本：`0.1.1`。
- release notes：`CHANGELOG.md` 的 `v0.1.1` 段落。
- 發佈內容：安裝後新手指示、README 用戶向重整、治理 QA 缺口矩陣、舊誤導提示負面檢查。
- 已知補救：`v0.1.2` 修正 `v0.1.1` package README 的發佈狀態文字。

## v0.1.0 已發佈狀態

- 發佈版本：`0.1.0`。
- release notes：`CHANGELOG.md` 的 `v0.1.0` 段落。
- public package / CLI：`@adamchanadam/agent-handoff-kit` package，`agent-handoff-kit` CLI。
- 非空既有專案升級重驗：已通過，臨時根目錄為 `C:\tmp\ack_release_candidate_upgrade_trial_20260517_171753`。
- 最近發佈前驗收：`npm run qa:prototype`、`npm run qa:packs`、`npm run qa:upgrade`、`npm run qa:release` 已在新名稱下通過；公開文件補齊後 `npm run qa:release` 已再次通過。
- 發佈後仍需驗證：GitHub Release、npm package metadata、`npx --yes @adamchanadam/agent-handoff-kit@latest --help`、`npx --yes @adamchanadam/agent-handoff-kit@latest doctor` 的實際可用性。

## QA Fixture 真實性紀律（R-025）

升級或回歸 fixture 必須由真實舊版本嘅 `init`／`upgrade` 產物生成；手嗒 template literal 合成只可做 schema 邊界測試。

- 真源生成：`scripts/generate-upgrade-fixtures.mjs` 用 `git worktree add --detach <tmp> <tag>` 喺對應 tag 開臨時 worktree，跑該版本 CLI 嘅 `init`，將產物 copy 入 `test-fixtures/<version>/`。
- Fixture 涵蓋：`AGENTS.md`（core runtime form）+ `dev/PROJECT_INDEX.md`（template version metadata）。新加版本須一齊納入。
- 退役對象：合成嘅 `staleCoreFixture()` 函數限 schema-boundary use（toggle skillArbitration／promptMirror 等模型參數）；production-state preconditions 必用真實 fixture。
- npm package 邊界：`test-fixtures/` 唔喺 `package.json` `files` 白名單內，唔會入 npm package；只屬原始碼倉庫資產。
- 違反例：用 inline string 寫一個冒充「v0.1.X 嘅 AGENTS.md」嚟測 production state，係 R-025 違反，必須改用對應版本 fixture。

## 跨版本鏈式升級驗收（R-025）

`qa:upgrade` 必含 `chainUpgradeScenario`：

1. `v0.1.4` CLI 跑 `init`（生成 v0.1.4 form 嘅 root）+ `v0.1.4` CLI doctor PASS。
2. `v0.1.5` CLI 跑 `upgrade`（用 `git worktree add v0.1.5` 嘅 detached HEAD CLI）+ `v0.1.5` CLI doctor PASS。
3. `v0.1.6` CLI 跑 `upgrade` + `v0.1.6` CLI doctor PASS。
4. 當前 HEAD CLI 跑 `upgrade`（自動跑 R-024 self-check）+ self-check `status: passed`。
5. 最終 `AGENTS.md` 必係 single core + single managed marker pair（即 R-024 嘅 clean state）。

鏈式測試嘅意義：重現用戶長期升級嘅 cumulative drift，並確保當前 CLI 能 reset 任何之前版本累積嘅 sandwich / dup core / anchor 缺漏。中間 hop 失敗（例如 v0.1.5 CLI 嘅 doctor 對 v0.1.4 root 失敗）唔當 chain 通過；要根因到舊版 CLI 嘅實際邊界 bug，唔可以 silent 跳過。

## 補丁前置狀態枚舉（R-025）

每個 `R-XXX` 補丁喺發佈級 QA 必填一條「覆蓋／唔覆蓋嘅前置狀態枚舉」，唔填唔放行。

| R 編號 | 覆蓋嘅前置狀態 | 唔覆蓋嘅前置狀態 |
|---|---|---|
| R-024 | （a）夾心 sandwich：managed marker pair + unmarked stale core；（b）legacy single core：無 managed marker + 單一 title；（c）legacy duplicate cores：無 managed marker + 多 title；（d）無 Kit core：file 存在但完全冇 core；（e）clean：managed marker pair + 無 unmarked dup。 | （f）managed-core markers 不成對／多 pair → 屬 conflict 狀態，CLI 顯示 conflict action，人工介入，唔由 upgrade auto-merge 處理。 |
| R-026 | 全部 `init`／`upgrade`／`doctor` 完成輸出（含 first-install / upgrade-existing / healthy / needs-fix / partial 模式）；`help` 命令完成輸出（version + mode + next）；v0.2.0 起擴 scope 至對外 release artifacts (README + onboarding HTML + CHANGELOG anchor-bounded latest section)。 | 中間進度行（如 `ok: create` 之類）唔強制四項契約；`migration-report.md` 內容契約唔屬 CLI Output Contract 範圍（migration report 有獨立 schema）；CHANGELOG historical sections（latest 段之前）唔受 R-026 scope 限制（historical fact 不可改）；內部 governance docs (SESSION_LOG / HANDOFF / DECISION_LOG) 不受 R-026 scope 限制。 |
| R-028 | （a）first-install fresh project：installer create `dev/PROJECT_DECISIONS.md` 為 4 H2 section template + 檔頭 onboarding tone；（b）upgrade from v0.1.X：用戶 dev/ 缺 PROJECT_DECISIONS.md，upgrade auto-create empty template；（c）upgrade existing PROJECT_DECISIONS.md：用戶手動加過 narrative，upgrade preserve（同 SESSION_HANDOFF.md / SESSION_LOG.md preserve discipline 一致）。 | （d）retro-archive sweep：用戶 explicit trigger AI scan SESSION_LOG 舊條目 reclassify 入 PROJECT_DECISIONS 屬 v0.2.x opt-in feature，唔屬 v0.2.0 critical path；（e）file-level conflict：用戶嘅 `dev/PROJECT_DECISIONS.md` 完全不可讀（permission / encoding）— 屬人工介入範疇，唔由 upgrade auto-merge 處理。 |
| R-029 | （a）First-time user fresh install：用戶安裝後第一句 message 含 onboarding signal keyword 或 vague description，AI 主動 load `dev/rules/onboarding.md` proactively，offer Scenario A-E selection；（b）First-time user 揀 Scenario X：AI 跑 5-step walk-through pattern (Step 1 確認 context / Step 2 解釋 v2 fit / Step 3 ask task scope / Step 4 suggest minimum viable / Step 5 confirm + transition)；（c）Onboarding completion：AI 完成 walk-through 後 unload onboarding pack + load 對應 regular scenario pack；（d）Returning user：用戶已熟悉 v2，無 onboarding signal，AI 直接進入 regular work loop 跳過 onboarding pack。 | （e）用戶 mid-session 觸發 onboarding signal（譬如已 progress 至 Step 4，但突然 say「教我用」）— AI 應 ask user about clarification 是否真係想 restart onboarding，唔自動 reload；（f）Onboarding pack 嘅 internal sample wording 字面 mismatch（譬如 AI adapt wording 過分背離 anchor）— 屬語意 drift，不可機器驗，由人工終讀承擔。 |
| R-029.1 (v0.2.1 critical patch) | （a）Fresh install v0.2.1+：CLI printInstallNextSteps 印出 canonical R-029 trigger phrase（「Work in <root>. I just installed agent-handoff-kit. Help me get started.」）；用戶貼上後 AI 必 trigger onboarding pack；（b）Upgrade v0.1.X → v0.2.1：`dev/RULE_PACKS.md` force-refresh 含 R-029 routing row；doctor schema check enforce「First-time user signals」+「dev/rules/onboarding.md」anchor；（c）Returning user upgrade v0.2.0 → v0.2.1：CLI prompt + routing table 自動同步至 v0.2.1 canonical state；（d）Advanced user 直接描述任務：保留 legacy prompt「Read AGENTS.md and follow it...」作 fallback option（CLI install output 印出 second-tier prompt + intro/guide 嘅 advanced disclaimer）；（e）本修補起，`dev/RULE_PACKS.md` 升級補齊 Kit routing rows 時必保留用戶自訂 rows。 | （f）CLI 跨 OS / locale 嘅 trigger phrase 字符 encoding：屬 OS-level concern，唔屬 R-029.1 scope。 |

## Release Artifact Vocabulary Sweep（R-026，v0.2.0 起 scope 擴展）

發佈前須 grep 公開倉庫源碼，確認以下命中：

CLI source（內部 action 名 + 完成訊息四項契約）：

```text
grep -n "人話解讀" bin/agent-handoff-kit.mjs       # 期望 0 命中
grep -c "📦 版本" bin/agent-handoff-kit.mjs         # 期望 ≥ 3（init/upgrade/doctor/help 至少四處）
grep -c "🛠️" bin/agent-handoff-kit.mjs              # 期望 ≥ 2（install/help 模式）
grep -c "🩺 模式" bin/agent-handoff-kit.mjs         # 期望 ≥ 1（doctor 模式）
grep -c "🚀 下一步" bin/agent-handoff-kit.mjs       # 期望 ≥ 3（install/doctor/help）
```

對外 release artifacts（v0.2.0 新加 scope）：

```text
grep -n -E "人話解讀|人話補一句|人話解釋" README.md                       # 期望 0 命中
grep -n -E "人話解讀|人話補一句|人話解釋" agent-handoff-kit-intro.html   # 期望 0 命中
grep -n -E "人話解讀|人話補一句|人話解釋" agent-handoff-kit-guide.html   # 期望 0 命中
# CHANGELOG.md 限 latest section (anchor-bounded by ## v heading)，避免 historical entries false positive
# 由 scripts/check-release-readiness.mjs 嘅 checkForbiddenVocabularyInChangelogLatestSection() 執行
```

人工驗證（語氣審閱必填項）：

- 安裝完成訊息：用戶讀完知道版本、做咗乜、下一步點處理。
- 升級完成訊息：用戶讀完知道 self-check 結果，唔會誤以為「skip」即係未完成。
- Doctor 失敗訊息：missing files / anchor / schema 等阻擋模式必須有對應中文下一步指示；prompt mirror drift 在普通 `doctor` 只應是警告，並說明便利副本會在 closeout 時重生。
- Help 訊息：用戶第一次跑 `--help` 應理解三個命令、版本同下一步。
- 禁忌用語清單：「人話解讀」「人話補一句」「人話解釋」等自我評論／粗俗自貶 phrasing 一律禁；由 v0.2.0 起 enforce scope 由 CLI source 擴展至對外 release artifacts (README / onboarding HTML / CHANGELOG latest section)；內部 governance docs (SESSION_LOG / HANDOFF / DECISION_LOG / 內部討論) 不受限。
- 內部 action 名：`create` / `merge` / `skip` / `conflict` / `status` 保留唔變（QA 同 migration report 依賴）。

## Onboarding HTML Book-language Discipline Sweep（v0.2.0 起新加）

對外 onboarding HTML 必為繁體中文書面語，廣東口語字符 grep 命中數必為 0：

```text
grep -n -E "[嘅咁喺揀唔乜啱嚟咗嗰]" agent-handoff-kit-intro.html      # 期望 0 命中
grep -n -E "[嘅咁喺揀唔乜啱嚟咗嗰]" agent-handoff-kit-guide.html      # 期望 0 命中
```

由 `scripts/check-release-readiness.mjs` 嘅 `checkBookLanguage()` helper 自動執行；違反即 throw error，release 阻擋。

範圍紀律：

- Onboarding HTML（intro + guide）為用戶第一個接觸嘅頁面，書面語紀律強制 enforce。
- README.md 屬 maintainer-friendly，允許 mixed style；不受書面語紀律約束。
- WORK 治理檔 + SESSION_LOG / HANDOFF / DECISION_LOG / 內部 audit report 屬 maintainer 對話 surface，不受書面語紀律約束。
- npm package CHANGELOG 屬 release artifact 但 historical sections 不可改；由 R-026 anchor-bounded grep 處理 false positive。

## Project Decisions Discipline Sweep（R-028，v0.2.0 起新加）

發佈前須 grep 公開倉庫源碼，確認以下命中：

```text
grep -c "Project Decisions Log" runtime-core/PROJECT_DECISIONS.md           # 期望 ≥ 1（檔頭）
grep -c "Evolution Timeline" runtime-core/PROJECT_DECISIONS.md              # 期望 ≥ 1（H2 section）
grep -c "Decisions Archive" runtime-core/PROJECT_DECISIONS.md               # 期望 ≥ 1
grep -c "Architecture Choices" runtime-core/PROJECT_DECISIONS.md            # 期望 ≥ 1
grep -c "Insights & Learnings" runtime-core/PROJECT_DECISIONS.md            # 期望 ≥ 1
grep -c "warm 資料層" runtime-core/PROJECT_DECISIONS.md                     # 期望 ≥ 1（檔頭 onboarding tone）

grep -c "Maintain \`dev/PROJECT_DECISIONS.md\`" runtime-core/AGENTS.core.md  # 期望 ≥ 1
grep -c "R-028 project narrative discipline" runtime-core/AGENTS.core.md    # 期望 ≥ 1
grep -c "Evolution Timeline" runtime-core/AGENTS.core.md                    # 期望 ≥ 1（在 closeout maintenance trigger 內）
grep -c "Decisions Archive" runtime-core/AGENTS.core.md                     # 期望 ≥ 1
grep -c "Architecture Choices" runtime-core/AGENTS.core.md                  # 期望 ≥ 1
grep -c "Insights & Learnings" runtime-core/AGENTS.core.md                  # 期望 ≥ 1

grep -c "runtime-core/PROJECT_DECISIONS.md" bin/agent-handoff-kit.mjs       # 期望 ≥ 1（mappings entry）
grep -c "dev/PROJECT_DECISIONS.md" bin/agent-handoff-kit.mjs                # 期望 ≥ 1
grep -c "project decisions log structure" bin/agent-handoff-kit.mjs         # 期望 ≥ 1（schemaChecks label）
grep -c "research decision trace checks" bin/agent-handoff-kit.mjs          # 期望 ≥ 1（research-derived decision trace）
grep -c "Evidence chain: Source=source:<id>" runtime-core/PROJECT_DECISIONS.md # 期望 ≥ 1（research-derived decision format）
```

Fresh install 嘅 runtime behavior 驗證：

- `init --yes --root <tmp>` 完成後 `dev/PROJECT_DECISIONS.md` 存在。
- `doctor --root <tmp>` 跑出 `dev/PROJECT_DECISIONS.md (project decisions log structure)` schema check `ok`。
- `doctor --root <tmp>` 跑出 `research decision trace checks: 1`，空白模板狀態不應誤報失敗。
- Doctor 完整 schema checks 包含 PROJECT_DECISIONS group。

Upgrade behavior 驗證（由 `npm run qa:upgrade` mergeRoot scenario 自動驗）：

- 既有專案缺 `dev/PROJECT_DECISIONS.md`：upgrade auto-create empty template。
- 既有專案已有 `dev/PROJECT_DECISIONS.md`（用戶手動加過 narrative）：upgrade preserve user content（同 SESSION_HANDOFF / SESSION_LOG preserve discipline 一致，由 `classifyExistingFile` 嘅 default `skip "preserve existing file"` 路徑承擔）。
- 若既有 `dev/PROJECT_DECISIONS.md` 有 research-derived decision evidence chain，upgrade 後必須保留；對應 `source:<id>` token 亦須保留在 `dev/PROJECT_INDEX.md` 的 Fact Base 或 External Sources。

人工驗證（語意審閱必填項）：

- 安裝後嘅 `dev/PROJECT_DECISIONS.md` 檔頭 onboarding tone 對新手友善（明文「AI 開工不需要讀」「不需要你手動寫」），不會誤導用戶以為自己要 fill in。
- 4 個 H2 section 順序保持（Evolution → Decisions Archive → Architecture → Insights），不可被 random order。
- Closeout maintenance trigger 嘅硬觸發、語意觸發與 10 次收工兜底 wording 清晰，AI 自律執行有 anchor。
- 研究導向長期決策不得只留下結論；語意審閱要確認 source、summary、inference、decision impact、uncertainty 五件事可從同一條 research-derived decision 追溯。

## Onboarding Pack Discipline Sweep（R-029，v0.2.0 起新加）

發佈前須 grep 公開倉庫源碼，確認以下命中：

```text
grep -c "Onboarding Pack" packs/onboarding.md                              # 期望 ≥ 1（H1 title）
grep -c "transient pack" packs/onboarding.md                                # 期望 ≥ 2（Scope + Discipline）
grep -c "5-step walk-through pattern" packs/onboarding.md                   # 期望 ≥ 1
grep -c "Scenario A. 寫 / 改代碼項目" packs/onboarding.md                   # 期望 ≥ 1
grep -c "Scenario B. 整理研究資料" packs/onboarding.md                      # 期望 ≥ 1
grep -c "Scenario C. 整理電腦檔案" packs/onboarding.md                      # 期望 ≥ 1
grep -c "Scenario D. 學寫代碼" packs/onboarding.md                          # 期望 ≥ 1
grep -c "Scenario E. 其他" packs/onboarding.md                              # 期望 ≥ 1
grep -c "Tone Discipline" packs/onboarding.md                               # 期望 ≥ 1
grep -c "Anti-pattern" packs/onboarding.md                                  # 期望 ≥ 1
grep -c "Cross-reference to guide.html" packs/onboarding.md                 # 期望 ≥ 1

grep -c "Explicit onboarding requests" runtime-core/RULE_PACKS.md           # 期望 ≥ 1（router row）
grep -c "dev/rules/onboarding.md" runtime-core/RULE_PACKS.md                # 期望 ≥ 1

grep -c "first-time-user signals" runtime-core/AGENTS.core.md               # 期望 ≥ 1（startup detection）
grep -c "onboarding signal keywords" runtime-core/AGENTS.core.md            # 期望 ≥ 1
grep -c "transient pack" runtime-core/AGENTS.core.md                        # 期望 ≥ 1

grep -c "packs/onboarding.md" bin/agent-handoff-kit.mjs                     # 期望 ≥ 1（mappings entry）
grep -c "dev/rules/onboarding.md" bin/agent-handoff-kit.mjs                 # 期望 ≥ 1
grep -c "onboarding pack structure" bin/agent-handoff-kit.mjs               # 期望 ≥ 1（schemaChecks label）
```

Fresh install 嘅 runtime behavior 驗證：

- `init --yes --root <tmp>` 完成後 `dev/rules/onboarding.md` 存在。
- `doctor --root <tmp>` 跑出 `dev/rules/onboarding.md (onboarding pack structure (R-029))` schema check `ok`。
- Doctor 完整 schema checks count 由 8 升至 9。

Pack scenario routing 驗證（由 `npm run qa:packs` mergeRoot scenario 自動驗）：

- `onboarding` routing scenario：router 含「Explicit onboarding requests」+ pack 含 6 個 Scenario + transient pack wording；「開工」只啟動接力與讀取狀態，不屬教學關鍵詞。
- `first-time onboarding to first task` mixed scenario：phases `[onboarding] → [onboarding, coding] → [coding]` 順序合法 (轉折 onboarding → coding 並 unload onboarding)。

人工驗證（語意審閱必填項）：

- Onboarding pack 嘅 6 個 Scenario walk-through 每 step 含 AI sample wording，書面語紀律 enforce（紀律目標：用戶讀 AI sample 即明白意義，無需先讀任何文檔）。
- 6 個 Scenario 嘅 step 5 「ask user about confirm + 進入 work loop」明文 transition 至對應 regular pack（A → coding+writing；B → research+writing+knowledge；C → knowledge+safety；D → coding+safety；E → custom；F → integrations+knowledge+safety）。
- Cross-reference to guide.html 嘅 wording 明確「不需要先讀本指南」，避免用戶誤以為要 mandatory reading。
- Anti-pattern table 列 6 個明確 anti-pattern，每個含 「點解唔做」+「正確做法」對照。

## Cross-surface Wording Consistency Sweep（R-029.1，v0.2.1 起新加；v0.3.19 更新）

v0.2.0 release ceremony 嘅 critical QC gap：plan scope coverage matrix 嘅三層（content / script / source）唔 cover cross-surface wording alignment。R-029 嘅 canonical onboarding trigger phrase 跨 4 個 user-facing surface，但 v0.2.0 release 時 CLI source 仍係 legacy wording 而其他 surface 已 update —— silent disconnect 令 R-029 design intent 對 default user behavior 失效。

v0.3.19 起，發佈前須對以下 4 個 surface grep 短開工主入口、帶路徑 fallback、普通 web chat AI 不支援邊界、收工入口與歧義保護。意圖偵測規則只以 runtime `AGENTS.md` 為單一真源；current public surface 不得再把 `help me start` / `I just installed agent-handoff-kit` /「新手起步句」/ 舊長句 /「任何 AI 工具」/「貼一段提示」/「貼一段字」/「固定開工句」/「貼回提示」當作 standalone 入口，歷史 changelog 敘事除外：

```text
grep -c "Start Agent Handoff" bin/agent-handoff-kit.mjs README.md agent-handoff-kit-intro.html agent-handoff-kit-guide.html
grep -c "開工" bin/agent-handoff-kit.mjs README.md agent-handoff-kit-intro.html agent-handoff-kit-guide.html
grep -c "Read AGENTS.md first, then Start Agent Handoff" bin/agent-handoff-kit.mjs README.md agent-handoff-kit-intro.html agent-handoff-kit-guide.html
grep -c "普通 web chat AI" bin/agent-handoff-kit.mjs README.md agent-handoff-kit-intro.html agent-handoff-kit-guide.html
grep -c "Wrap up Agent Handoff" bin/agent-handoff-kit.mjs README.md agent-handoff-kit-intro.html agent-handoff-kit-guide.html
grep -c "收工" bin/agent-handoff-kit.mjs README.md agent-handoff-kit-intro.html agent-handoff-kit-guide.html
grep -c "某某開工" bin/agent-handoff-kit.mjs README.md agent-handoff-kit-intro.html agent-handoff-kit-guide.html
grep -c "某某收工" bin/agent-handoff-kit.mjs README.md agent-handoff-kit-intro.html agent-handoff-kit-guide.html
grep -n "help me start\\|I just installed agent-handoff-kit\\|新手起步句\\|Read AGENTS.md first. Then open START_NEXT_SESSION_PROMPT.txt\\|固定開工句\\|貼回提示\\|下一次任何 AI 工具\\|貼一段提示\\|貼一段字" README.md agent-handoff-kit-intro.html agent-handoff-kit-guide.html
```

由 `scripts/check-release-readiness.mjs` 嘅 `checkCrossSurfaceWordingConsistency()` helper 自動 enforce；違反即 throw error，release 阻擋。

額外 verification：

- post-install CLI output 必印出 bootstrap phrase 與 local-agent 支援邊界（由 `scripts/check-public-prototype.mjs` enforce）
- 初次安裝的 `START_NEXT_SESSION_PROMPT.txt` 必含 first-use onboarding signal；onboarding 不再依賴 surface prompt 直接寫 `I just installed...`
- qa:upgrade chain test final hop 嘅 `dev/RULE_PACKS.md` 必含 R-029 routing row（force-refresh 紀律驗證）

紀律邊界：

- Bootstrap phrase 屬 user-facing surface 嘅 local-agent startup entry point；其他 surface (e.g. CHANGELOG / DECISION_LOG / SESSION_LOG) 唔 enforce
- Legacy direct prompt（「Read AGENTS.md and follow it...」）不可再作主要 user-facing 開工句；如只在歷史 changelog / QA 敘事中出現，須明確屬歷史。
- guide.html Case A/B/C user bubbles 應使用固定 bootstrap 句；真正任務狀態由 `START_NEXT_SESSION_PROMPT.txt` 承載。

## SESSION_LOG handoff-role discipline Sweep（R-010）

發佈前須 grep 公開倉庫源碼，確認以下命中：

```text
grep -c "assessSessionLogDiscipline" bin/agent-handoff-kit.mjs       # 期望 ≥ 2（函數定義 + doctor 集成 call）
grep -c "SESSION_LOG discipline (R-010)" bin/agent-handoff-kit.mjs   # 期望 ≥ 1（doctor output line）
grep -c "R-010 SESSION_LOG handoff-role discipline" runtime-core/AGENTS.core.md  # 期望 ≥ 1
grep -c "Advance the SESSION_LOG N-rule" runtime-core/AGENTS.core.md            # 期望 ≥ 1
grep -c "closeout maintenance trigger check" runtime-core/AGENTS.core.md        # 期望 ≥ 1
grep -c "10-closeout backstop" runtime-core/AGENTS.core.md                      # 期望 ≥ 1
grep -c "Handoff role" runtime-core/SESSION_LOG.md                              # 期望 ≥ 1（blockquote）
grep -c "Log maintenance" runtime-core/SESSION_LOG.md                           # 期望 ≥ 1（trigger check result 欄）
```

Fresh install 嘅 runtime behavior 驗證：

- `init --yes --root <tmp>` 完成。
- `doctor --root <tmp>` 跑出 `SESSION_LOG discipline (R-010): ok` + `status: passed` + exit 0。
- 因 fresh install 嘅 SESSION_LOG.md 只 1 條 template entry，未到 N=11 threshold，所以期望 ok（不 warn）。

Warn behavior 驗證（人工或 fixture-based）：

- Fresh init 後注入 12 條 fake H2 entry (`## 2026-01-01 — test1` 等) 入 SESSION_LOG.md → doctor 跑出 `SESSION_LOG discipline (R-010): warn` + `warn: SESSION_LOG entry count = 12...` + `status: passed`（warn-only，doctor exit 不變 0）。

人工驗證：

- AI Closeout flow 是否每次記錄維護觸發檢查，並只在 N≥11、主檔過長、決策拆分、語意觸發或 10 次收工兜底時做完整長期維護。
- Doctor warn 是否唔 block release（exit 0；release-grade QA 唔會因 warn 而 fail）。
- 接力角色定位是否清晰（HANDOFF carries handoff capability；SESSION_LOG carries trace-back only）。
- 長任務中途連續加入產品目標、開發清單、驗收規則時，AI 是否先找既有 spec / backlog / issue / runbook；沒有專門真源時，是否把單一當前任務契約合併到 `SESSION_HANDOFF` current-state sections，而不是把約束散落在聊天、`SESSION_LOG` 或多份草稿文件。

## 發佈阻擋項

未來任何新版本仍必須先通過本文件列出的發佈前驗收；不得因 `v0.1.0` 已發佈而宣稱 Agent Handoff Kit 已需求完整。
