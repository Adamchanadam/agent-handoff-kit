# Agent Handoff Kit Test Fixtures

Complete installed outputs produced by every formal npm release. Remote
Git tags and public GitHub Releases are cross-checked before generation.
Local tags and guessed commits are not accepted as release sources.

Run `npm run qa:fixtures` to rebuild. Each version directory keeps the two
legacy files used by focused tests plus `fixture-manifest.json`. The manifest
marks all current managed targets as `present` or `absent`; full historical
install trees are reconstructed from the deduplicated catalog during QA.

Do not edit generated fixtures or the official-origin catalog by hand.
The fixtures stay outside the npm package; the deduplicated runtime catalog
is published under `bin/migration-baselines/`.

Covered formal releases: 62

- v0.1.0
- v0.1.1
- v0.1.2
- v0.1.3
- v0.1.4
- v0.1.5
- v0.1.6
- v0.1.7
- v0.1.8
- v0.2.0
- v0.2.1
- v0.2.2
- v0.2.3
- v0.3.0
- v0.3.1
- v0.3.2
- v0.3.3
- v0.3.4
- v0.3.5
- v0.3.6
- v0.3.7
- v0.3.8
- v0.3.9
- v0.3.10
- v0.3.11
- v0.3.12
- v0.3.13
- v0.3.14
- v0.3.15
- v0.3.16
- v0.3.17
- v0.3.18
- v0.3.19
- v0.3.20
- v0.3.21
- v0.3.22
- v0.3.23
- v0.3.24
- v0.3.25
- v0.3.26
- v0.3.27
- v0.3.28
- v0.3.29
- v0.3.30
- v0.3.31
- v0.3.32
- v0.3.33
- v0.3.34
- v0.3.35
- v0.3.36
- v0.3.37
- v0.3.38
- v0.3.39
- v0.3.40
- v0.3.41
- v0.3.42
- v0.3.43
- v0.3.44
- v0.3.45
- v0.3.46
- v0.3.47
- v0.3.48
