/* 上線前
 *
 * ⚠ 這一支管的是「本機好好的，上線就壞」那一類問題。
 *   而它們的共同點是：在你自己的電腦上永遠測不出來。
 *
 *   一｜中文檔名 —— 上線後 URL 要 encode，而編碼行為不一定一樣
 *   二｜底線開頭 —— Jekyll 預設會整個忽略，那些檔會 404
 *   三｜大小寫    —— 本機不分大小寫，伺服器分
 *   四｜絕對路徑 —— 放在子目錄底下就全部找不到
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ok = [], bad = [], warn = [];

/* 把要上傳的檔案全撈出來 */
const all = [];
(function walk(d){
  for (const f of readdirSync(d, { withFileTypes:true })){
    if (['node_modules','test','.git'].includes(f.name)) continue;
    const p = join(d, f.name);
    f.isDirectory() ? walk(p) : all.push(relative(ROOT, p));
  }
})(ROOT);

/* ── 一、中文／空白／特殊字元 ─────────── */
const badName = all.filter(p => /[^\x20-\x7E]|[ #?%]/.test(p));
if (badName.length)
  bad.push(`${badName.length} 個檔名有非 ASCII 或空白：${badName.slice(0,3).join('、')}⋯`);
else ok.push(`${all.length} 個檔名全部是純 ASCII`);

/* ── 二、底線開頭 —— Jekyll 會忽略 ────── */
const under = all.filter(p => p.split('/').some(seg => seg.startsWith('_')));
if (under.length)
  bad.push(`${under.length} 個路徑有底線開頭（Jekyll 會忽略）：${under.slice(0,3).join('、')}`);
else ok.push('沒有底線開頭的路徑');
/* 而 .nojekyll 是保險 */
existsSync(join(ROOT,'.nojekyll'))
  ? ok.push('有 .nojekyll —— 而那把 Jekyll 整個關掉')
  : bad.push('缺 .nojekyll');

/* ── 三、大小寫撞名 ─────────────────── */
const lower = new Map();
for (const p of all){
  const k = p.toLowerCase();
  if (lower.has(k) && lower.get(k) !== p) bad.push(`大小寫撞名：${lower.get(k)} vs ${p}`);
  lower.set(k, p);
}
if (!bad.some(x=>x.includes('大小寫'))) ok.push('沒有大小寫撞名');

/* ── 四、絕對路徑 —— 放子目錄會全壞 ───── */
const html = readFileSync(join(ROOT,'index.html'),'utf8');
if (/(src|href)="\//.test(html)) bad.push('index.html 有絕對路徑 —— 放在子目錄底下會全部找不到');
else ok.push('index.html 全部是相對路徑');
const dataJs = readFileSync(join(ROOT,'src/core/data.js'),'utf8');
if (/BASE\s*=\s*'\//.test(dataJs)) bad.push('data.js 的 BASE 是絕對路徑');
else ok.push('data.js 用相對路徑');

/* ── 五、檔名對照要對得起來 ──────────── */
const M = JSON.parse(readFileSync(join(ROOT,'data/manifest.json'),'utf8'));
if (!M.file) bad.push('manifest 沒有檔名對照');
else {
  let miss = 0;
  for (const [id, fn] of Object.entries(M.file))
    if (!existsSync(join(ROOT,'data/script',fn+'.json'))) miss++;
  miss ? bad.push(`${miss} 篇劇本的檔名對照指到不存在的檔`)
       : ok.push(`${Object.keys(M.file).length} 篇的檔名對照全部指得到`);
  /* 而索引裡的 id 都要有對照 */
  const noMap = M.scripts.filter(s => !M.file[s.id]).length;
  noMap ? bad.push(`${noMap} 篇在索引裡而沒有檔名對照`) : ok.push('索引的每一篇都有對照');
}

/* ── 六、大小 ───────────────────────── */
const total = all.reduce((a,p) => a + statSync(join(ROOT,p)).size, 0);
const mb = total/1024/1024;
if (mb > 100) bad.push(`${mb.toFixed(1)} MB —— 超過 GitHub 建議上限`);
else if (mb > 50) warn.push(`${mb.toFixed(1)} MB —— 有點大，而還可以`);
else ok.push(`${mb.toFixed(1)} MB`);
const big = all.filter(p => statSync(join(ROOT,p)).size > 50*1024*1024);
if (big.length) bad.push(`單檔超過 50 MB：${big.join('、')}`);

console.log('═══ 上線前 ═══\n');
ok.forEach(x => console.log('  ✓ ' + x));
if (warn.length){ console.log('\n提醒'); warn.forEach(x => console.log('  ⚠ ' + x)); }
if (bad.length){ console.log('\n會壞'); bad.forEach(x => console.log('  ✗ ' + x)); }
console.log(`\n${ok.length} 通過　${warn.length} 提醒　${bad.length} 會壞`);
process.exit(bad.length ? 1 : 0);
