# 規則包載入合約

## 目的

Rule packs 用來讓 AI 按任務切換工作模式。它們不是給用戶逐行閱讀的說明書，也不是每次 session 都要全部讀取的規則堆。

## 基本原則

1. 先判斷任務類型。
2. 只載入最少必要 packs。
3. 若任務涉及安全風險，才加載 `safety`。
4. Packs 可以增加限制，但不可削弱 core safety 或 closeout requirements。

## 常見對應

| 任務訊號 | Pack | 用途 |
|---|---|---|
| code、tests、build | `coding` | 開發流程與驗證 |
| writing、README、copy、docs | `writing` | 寫作、結構、語氣 |
| user-facing response | `communication` | 回覆格式與可讀性 |
| sources、evidence、comparison | `research` | 來源與不確定性 |
| Notion、Drive、knowledge base | `knowledge` | 真源與同步 |
| release、publish、tag | `release` | 發佈前檢查 |
| destructive operation、Git、API、deploy、credential | `safety` | 高風險操作保護 |

## 混合任務

混合任務應先拆階段。例如「市場研究 → 商業分析 → 網站文案」不應一次載入全部 packs，而應分階段載入：

1. research；
2. research + writing；
3. writing + communication。

## 驗收

`npm run qa:packs` 應檢查 pack routing、safety escalation 與 mixed-scenario phased loading。
