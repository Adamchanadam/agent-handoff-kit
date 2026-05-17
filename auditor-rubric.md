# 審核準則

## 用途

本準則用來審核 Agent Handoff Kit 是否仍符合輕量、可接力、可驗收的目標。

## 審核問題

| 問題 | 通過標準 |
|---|---|
| 使用者是否知道怎入手？ | README 說清楚用途、安裝、日常使用、收工與 packs |
| AI 是否能接力？ | handoff 有 current state、next step、risk、validation、opening message |
| Runtime 是否過重？ | core 短、packs 按需讀 |
| Installer 是否安全？ | 不靜默覆寫，不能合併就報 conflict |
| QA 是否可重跑？ | `qa:prototype`、`qa:packs`、`qa:upgrade`、`qa:release` 可執行 |
| Public output 是否乾淨？ | 不含 WORK session state、private repo、舊 repo backlog |

## 審核結論

若審核發現缺口，優先補可驗收行為或文件清晰度，不優先新增治理規則。
