# CMU 今天吃什麼？網站第一版

這是一個靜態網站版本，使用純 HTML、CSS、JavaScript，可以部署到 GitHub Pages。

## 本機測試

最簡單的方式：直接雙擊 `index.html`。

若瀏覽器擋本機檔案，請在此資料夾開啟終端機，輸入：

```bash
python -m http.server 8000
```

接著打開：

```text
http://localhost:8000
```

## Google Maps 導航修正

本版已修正導航連結問題：

- `data.js` 保留未編碼的 `mapQuery`，例如「盡心亭拉麵 台中市北區五常街60號」。
- `app.js` 在使用者點擊結果卡片時，才用 `encodeURIComponent()` 產生 Google Maps URL。
- 不再使用先前被截斷的 `mapUrl` 欄位。

## 部署到 GitHub Pages

1. 建立 GitHub repository。
2. 上傳 `index.html`、`style.css`、`data.js`、`app.js`、`restaurants.json`。
3. 進入 repository 的 Settings → Pages。
4. Source 選 `Deploy from a branch`。
5. Branch 選 `main`，資料夾選 `/root`。
6. 儲存後等待 GitHub 產生網址。

