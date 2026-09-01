/* 靜態檢查
 *
 * ⚠ 這一支是因為一個實際的 bug 才寫的：
 *
 *   我把一段程式碼抽成 finish()，而 `e.scrollIntoView(...)` 那一行沒跟著搬走。
 *   而 `e` 已經不在那個作用域裡了。
 *
 *   → Uncaught ReferenceError: e is not defined
 *
 * 而整合測試沒抓到，因為它按了「跳到結果」，剛好繞過那一行。
 *
 * 所以：不能只靠「跑起來看看」。有些路徑跑不到。
 */

import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ok = [], bad = [];

/* 把 src/ 跟 3d/ 底下的 .js 全部撈出來 */
const files = [];
(function walk(d, rel=''){
  for (const f of readdirSync(d, { withFileTypes:true })){
    if (f.name === 'node_modules' || f.name.startsWith('three')) continue;
    const p = join(d, f.name);
    if (f.isDirectory()) walk(p, rel + f.name + '/');
    else if (f.name.endsWith('.js')) files.push([rel + f.name, readFileSync(p,'utf8')]);
  }
})(join(ROOT,'src'));
for (const f of readdirSync(join(ROOT,'3d'))){
  if (f.endsWith('.js') && !f.startsWith('three'))
    files.push(['3d/'+f, readFileSync(join(ROOT,'3d',f),'utf8')]);
}

const strip = src => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``')
  .replace(/'(?:[^'\\]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\]|\\.)*"/g, '""');

/* ── 一、用了 e / err / ev 但那個函式沒有收它 ─── */
for (const [name, raw] of files){
  const src = strip(raw);
  /* 每一個 => 或 function 的參數列 */
  const lines = src.split('\n');
  let bodyStack = [];
  let flagged = 0;
  /* 簡化：找 `e.` 或 `e)` 出現的行，往回找最近的函式頭，看它有沒有 e */
  for (let i = 0; i < lines.length; i++){
    if (!/\be\.(stopPropagation|preventDefault|scrollIntoView|target|key|code|client[XY]|deltaY|pointerId|message)\b/.test(lines[i])) continue;
    /* 往回找最近的函式頭 */
    let head = null;
    for (let j = i; j >= 0 && j > i - 40; j--){
      const m = lines[j].match(/(\(([^)]*)\)|(\w+))\s*=>|function\s*\w*\s*\(([^)]*)\)/);
      if (m){ head = m[0]; break; }
    }
    if (!head) continue;
    if (/\be\b/.test(head)) continue;         /* 有收，沒問題 */
    if (/addEventListener|catch\s*\(/.test(lines[i])) continue;
    bad.push(`${name}:${i+1}　用了 e 而最近的函式沒有收它 —— ${lines[i].trim().slice(0,52)}`);
    flagged++;
  }
  if (!flagged) ok.push(`${name}　沒有孤兒 e`);
}

/* ── 二、同一支檔案裡不能有兩個同名的 function ── */
for (const [name, raw] of files){
  const src = strip(raw);
  const seen = new Map();
  for (const m of src.matchAll(/^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm))
    seen.set(m[1], (seen.get(m[1])||0) + 1);
  const dup = [...seen].filter(([,n]) => n > 1);
  if (dup.length) bad.push(`${name}　有重複的函式：${dup.map(([k,n])=>`${k}×${n}`).join('、')}`);
}
if (!bad.some(x => x.includes('重複的函式'))) ok.push('沒有重複定義的函式');

/* ── 三、同一支裡不能宣告兩次同名的 const/let ── */
for (const [name, raw] of files){
  const src = strip(raw);
  const seen = new Map();
  for (const m of src.matchAll(/^\s*(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/gm))
    seen.set(m[1], (seen.get(m[1])||0) + 1);
  const dup = [...seen].filter(([,n]) => n > 1);
  /* 而不同區塊裡同名是合法的，所以只在同一縮排層級才算 */
  const real = dup.filter(([k]) =>
    (src.match(new RegExp(`^(?:const|let) ${k}\\s*=`, 'gm')) || []).length > 1);
  if (real.length) bad.push(`${name}　頂層重複宣告：${real.map(([k])=>k).join('、')}`);
}
if (!bad.some(x => x.includes('頂層重複宣告'))) ok.push('沒有頂層重複宣告');

/* ── 四、打包出來的那一份要能過語法 ── */
try {
  const html = readFileSync(join(ROOT,'..','藍天白雲傳承.html'),'utf8');
  const js = html.match(/<script>\n([\s\S]*)\n<\/script>/);
  if (!js) bad.push('單檔裡找不到那段 script');
  else {
    const { Script } = await import('vm');
    new Script(js[1]);
    ok.push('單檔那一段語法過得了');
  }
} catch (e){ bad.push(`單檔語法：${String(e.message).slice(0,60)}`); }

console.log('═══ 靜態檢查 ═══\n');
ok.forEach(x => console.log('  ✓ ' + x));
if (bad.length){ console.log('\n壞掉'); bad.forEach(x => console.log('  ✗ ' + x)); }
console.log(`\n${ok.length} 通過　${bad.length} 壞掉`);
process.exit(bad.length ? 1 : 0);
