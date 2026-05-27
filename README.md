# CMU 今天吃什麼？心理測驗網站

v5 更新：多樣化推薦演算法。

本版保留 120 間餐廳資料與 7 題測驗，並調整推薦邏輯：

- 第一張推薦保留最高分店家，確保符合測驗結果。
- 第二、三張推薦從高分候選池挑選，加入類型、來源、距離與探索加分。
- 飲料、甜點、便利商店在午餐/晚餐時會降低權重，避免正餐推薦被補給型店家占滿。
- 擴充資料庫後段店家會有少量探索加分，避免永遠只出現舊版前 30 間。

## 上傳 GitHub Pages

把以下 6 個檔案上傳到 repository 根目錄：

- index.html
- style.css
- data.js
- app.js
- restaurants.json
- README.md

GitHub Pages 設定：main branch / root。

更新後測試網址可加上快取參數：

```text
https://你的帳號.github.io/cmu-food-test/?v=5
```
