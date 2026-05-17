# 健康檢查

## 用途

健康檢查用來判斷 Agent Handoff Kit 是否仍保持輕量、可用、可驗收。

## 檢查面向

| 面向 | 檢查 |
|---|---|
| Runtime 大小 | 是否只安裝必要 core 與 packs |
| 啟動負擔 | AI 是否只讀必要檔案 |
| 記憶分層 | handoff 是否承擔 current state，log 是否只承擔 evidence |
| 安全 | 高風險操作是否載入 safety |
| 文件同步 | README、handoff、project index、sync registry 是否口徑一致 |
| 發佈 | 未經批准是否避免 tag、GitHub Release、npm publish |

## 指令工具健康檢查

```bash
agent-handoff-kit doctor --root <project>
```

Prototype：

```bash
node bin/agent-handoff-kit.mjs doctor --root <project>
```

`doctor` 應檢查必備檔案、錨點與基本 schema。

## 不應做的事

健康檢查不應變成更多治理規則來源。若檢查結果只會製造文件膨脹，應收口，而不是新增規則。
