# 藍天白雲傳承

**開這裡 →** `https://你的帳號.github.io/repo名/`

---

## 這個 repo 只有一個檔

**`index.html`。而它是整包——七個模式、125 篇劇本、22 個角色、3D 場景，全部在裡面。**

所以：

- **不會因為資料夾攤平而壞掉**——因為根本沒有第二個檔要找
- 不需要建置、不需要安裝、不需要後端
- 存檔在使用者自己的瀏覽器裡（localStorage）

---

## 而 `.nojekyll` 是必要的

**GitHub Pages 預設會跑 Jekyll，而它會動一些檔案。**

**那個空檔把它整個關掉。**

---

## 上線

Settings → Pages → Source 選 **Deploy from a branch** → **main** / **(root)** → Save。

等一兩分鐘。

---

## 而原始碼不在這裡

**這一個是打包出來的。**

要改的話，用另外那一包（`藍天白雲傳承_全部.zip` 裡的 `app/`），改完跑：

```bash
npm install
npm run build     # 重新產生 index.html
npm test          # 全部測一次
```
