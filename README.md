# 藍天白雲傳承

**開這裡 →** `https://你的帳號.github.io/repo名/`

---

## 這個 repo 只有一個檔在做事

**`index.html`。而它是整包**——七個模式、125 篇劇本、22 個角色、3D 場景，全部在裡面。

所以：

- **不會因為資料夾攤平而壞掉** —— 因為根本沒有第二個檔要找
- 不需要建置、不需要安裝、不需要後端
- 存檔在使用者自己的瀏覽器裡（localStorage）

---

## 而 `.nojekyll` 是選配

**它是一個空檔。而 GitHub 上傳的時候會顯示「This file is hidden.」—— 那是正常的。**

**因為它本來就沒有內容。它存在本身就是訊號。**

---

### 而這一包其實不需要它

`.nojekyll` 的作用是：**叫 GitHub Pages 不要跑 Jekyll。**

**而 Jekyll 只會對兩種東西動手：**

| | 這一包有嗎 |
|---|---|
| 底線開頭的檔案（會被整個忽略） | **沒有** |
| 開頭有 front matter 的檔案 | **沒有** |

**所以傳不上去也沒關係。**

**而留著它的好處是：Pages 部署會快一點，而且以後加檔案的時候不會踩到。**

---

### 如果你還是想加

在 GitHub 上按 **Add file → Create new file**，
檔名打 `.nojekyll`，**內容留空**，直接 Commit。

**（而如果它不讓你 commit 空檔，隨便打一個空格就好。）**

---

## 上線

Settings → Pages → Source 選 **Deploy from a branch** → **main** / **(root)** → Save。

等一兩分鐘。

---

## 而原始碼不在這裡

**這一個是打包出來的。**

要改的話用另外那一包（`藍天白雲傳承_全部.zip` 裡的 `app/`），改完跑：

```bash
npm install
npm run build     # 重新產生 index.html
npm test          # 169 項
```

**然後把新的 `index.html` 傳上去覆蓋。**
