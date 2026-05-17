# 停止規則

## 用途

停止規則用來避免 Agent Handoff Kit 從輕量 continuity tool 膨脹成另一套大型治理框架。

## 應停止的情況

出現以下情況時，應先停止新增內容：

1. 同一規則已有真源，只是想再寫一次。
2. 新文件只解釋既有文件，沒有新的驗收價值。
3. 每次開工必讀內容變長，但沒有減少其他負擔。
4. Public runtime 開始混入 WORK session state。
5. 設計文件取代了可執行 QA。
6. 沒有使用者需求，卻新增工具或外部同步層。

## 收口方式

1. 合併重複段落。
2. 把 current state 放回 handoff。
3. 把歷史證據降到 log。
4. 把按需規則放入 packs。
5. 用 QA 驗證，不用更多說明替代驗證。

## 發佈前停止線

未通過 release-required QA 前，不得：

- tag；
- 建立 GitHub Release；
- npm publish；
- 宣稱 requirements-complete。
