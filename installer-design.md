# 安裝工具設計

## 目標

Installer 的目標，是讓使用者能把 Agent Handoff Kit 安全放進新專案或既有專案。

公開入口規劃：

```bash
npx @adamchanadam/agent-handoff-kit init
npx @adamchanadam/agent-handoff-kit upgrade
npx @adamchanadam/agent-handoff-kit doctor
```

目前 prototype 可用本地指令執行：

```bash
node bin/agent-handoff-kit.mjs init --yes --root <project>
node bin/agent-handoff-kit.mjs upgrade --dry-run --root <project>
node bin/agent-handoff-kit.mjs doctor --root <project>
```

## 設計原則

1. 新專案可直接建立缺失檔案。
2. 既有專案不可靜默覆寫。
3. 修改既有檔案前要有 backup。
4. 能安全 merge 才 merge；不能安全 merge 就報 conflict。
5. 每次 install / upgrade 後都能用 `doctor` 驗證。

## 模式判斷

| 模式 | 條件 | 行為 |
|---|---|---|
| first-install | 沒有核心檔案 | 建立 runtime files |
| upgrade-existing | 已有核心檔案 | 補缺失、保留既有內容 |
| migrate-monolith | 已有舊式單檔治理內容 | 只做安全範圍內的合併 |
| partial | 部分檔案存在 | 建立缺失檔，保留既有檔 |
| conflict | 既有檔案無法判斷安全合併 | 報 conflict，不覆寫 |

## Upgrade 策略

目前已實作的安全範圍：

- `AGENTS.md` 可加入 managed core block。
- 合併前建立 backup。
- `CLAUDE.md` / `GEMINI.md` 若已有自訂內容且未導向 `AGENTS.md`，報 conflict。
- 其他既有檔案預設 preserve。

完整 section-aware merge 仍待補。

## Migration report

每次寫入後，installer 會建立 migration report，記錄：

- created；
- merged；
- skipped existing；
- conflicts；
- backup path；
- notes。

## 不做事項

Installer 不負責 tag、GitHub Release、npm publish。這些行為必須由使用者明確批准，並先通過 release QA。
