# 核心合約

## 目的

核心合約定義 AI 每次 session 必須遵守的最小行為。它要短、穩定、可安裝，避免回到大型 monolithic prompt。

## 啟動合約

AI 開工時應讀：

1. `AGENTS.md`
2. `dev/SESSION_HANDOFF.md`
3. `dev/SESSION_LOG.md`
4. `dev/PROJECT_INDEX.md`
5. `dev/RULE_PACKS.md`

若目前根目錄與 handoff 記錄不一致，AI 必須停止並要求使用者確認。

## 工作合約

AI 應先確認：

1. 目前目標；
2. 相關檔案；
3. 應載入的 rule packs；
4. 驗收方式；
5. 風險與禁止事項。

AI 不應在未理解專案狀態時直接修改長期文件。

## 安全合約

高風險操作必須先載入 `dev/rules/safety.md`，包括：

- 刪除、覆寫、移動、重命名；
- Git history 變更；
- package manager、installer、deploy、release；
- external API、SDK、CLI；
- credentials、permission error、locked files。

## 收工合約

使用者輸入 `收工`、`wrap up`、`handoff` 或其他明確交接意圖時，AI 應：

1. 更新 `dev/SESSION_HANDOFF.md`；
2. 更新 `dev/SESSION_LOG.md`；
3. 檢查 `dev/PROJECT_INDEX.md` 是否需要更新；
4. 檢查 `dev/DOC_SYNC_REGISTRY.md` 是否需要同步狀態；
5. 輸出下一次 session 可直接貼上的 opening message。

## 驗收合約

`doctor` 至少應檢查：

- 必備檔案；
- 啟動與收工錨點；
- handoff / log / project index / sync registry / rule router 基本結構。
