# 放到 GitHub Pages

## 而這一包已經設定好了

---

# 三步

**一｜建一個 repo，把 `app/` 底下的東西全部推上去**

```bash
cd app
git init
git add .
git commit -m "初版"
git branch -M main
git remote add origin https://github.com/你的帳號/repo名.git
git push -u origin main
```

**⚠ 推的是 `app/` 裡面的內容，不是 `app` 這個資料夾。**

因為 `index.html` 要在 repo 的最上層。

---

**二｜Settings → Pages**

| 欄位 | 選 |
|---|---|
| Source | **Deploy from a branch** |
| Branch | **main** ／ **/ (root)** |

按 Save，**然後等一兩分鐘。**

---

**三｜開 `https://你的帳號.github.io/repo名/`**

---

# 而不需要 Firebase

**因為這個專案沒有後端。**

沒有資料庫、沒有帳號、沒有 API。**存檔走瀏覽器的 localStorage，就在使用者自己的電腦上。**

---

## 而只有這三種情況才需要

| | |
|---|---|
| 跨裝置同步存檔 | 手機讀到一半，電腦接著讀 |
| 帳號登入 | |
| 收集玩家資料 | 例如大家都選誰對練 |

---

# 而有兩件事我已經先處理掉了

## 一｜劇本檔名改成純 ASCII

**原本是 `長篇_02_二十七秒.json`。**

**而 GitHub Pages 上中文檔名的編碼行為，跟你自己電腦上不一定一樣。**

所以檔名改成 `long-02.json`，**而中文的 id 留在資料裡面。**

對照表在 `data/manifest.json` 的 `file` 欄位。

---

## 二｜`.nojekyll`

**GitHub Pages 預設會跑 Jekyll，而 Jekyll 會忽略底線開頭的檔案。**

原本有 `_index.json` 跟 `_minor_cast.json` —— **那兩個會 404。**

已經改名，**而且加了 `.nojekyll` 把 Jekyll 整個關掉。**

---

# 而上線之前跑這一支

```bash
npm install
npm test
```

**其中 `test/deploy.mjs` 專門管「本機好好的，上線就壞」那一類：**

| | |
|---|---|
| 中文／空白檔名 | |
| 底線開頭 | Jekyll 會忽略 |
| **大小寫撞名** | 本機不分，伺服器分 |
| **絕對路徑** | 放在子目錄底下會全部找不到 |
| 檔名對照指不指得到 | |
| 大小 | |

---

# 而如果你只是想給人玩

**`藍天白雲傳承.html` 那一個單檔就夠了。**

**點兩下就能開，不需要伺服器，也不需要 GitHub。**

而放上 GitHub Pages 的意義是：**給一個連結，別人不用下載。**
