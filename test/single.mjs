/* 驗證單檔版真的能開。而「能開」的意思是：像從 file:// 點兩下一樣。 */
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT,'..','藍天白雲傳承.html'),'utf8');

const errs = [];
const dom = new JSDOM(html, {
  runScripts:'dangerously', pretendToBeVisual:true,
  url:'file:///C:/x/%E8%97%8D%E5%A4%A9%E7%99%BD%E9%9B%B2%E5%82%B3%E6%89%BF.html',
  virtualConsole: new (await import('jsdom')).VirtualConsole()
    .on('jsdomError', e => errs.push(e.message))
    .on('error', (...a) => errs.push(String(a[0]))),
});
const w = dom.window;
w.matchMedia = () => ({ matches:false, addEventListener(){}, removeEventListener(){} });
/* ⚠ 刻意不補 scrollIntoView / scrollTo。
   因為有些 WebView 也沒有 —— 而程式要自己撐得住。 */

await new Promise(r => setTimeout(r, 500));

const app = w.document.getElementById('app');
const out = [];
const bad = [];

/* 一｜沒有外部 JS/CSS 參照 */
if (/<script[^>]+src=/.test(html)) bad.push('還有外部 <script src>');
else out.push('沒有外部 script');
if (/<link[^>]+href="\.\//.test(html)) bad.push('還有本機 <link href>');
else out.push('沒有本機 link（只有 Google 字型，而它離線也不會壞）');

/* 二｜有沒有炸 */
if (errs.length) bad.push('執行錯誤：' + errs.slice(0,2).join('｜'));
else out.push('載入沒有炸');

/* 三｜選單畫出來了嗎 */
const modes = app.querySelectorAll('[data-go]').length;
if (modes !== 7) bad.push(`選單只有 ${modes} 個模式`);
else out.push('選單 7 個模式');

/* 四｜真的進得去嗎 —— 而 fetch 在這裡是不存在的 */
w.location.hash = 'story';
await new Promise(r => setTimeout(r, 300));
const items = app.querySelectorAll('[data-id]').length;
if (items !== 125) bad.push(`目次只有 ${items} 篇`);
else out.push('目次 125 篇');

/* 五｜讀一篇，而名牌要對 */
w.location.hash = 'story/長篇_20_靠窗那個位置';
await new Promise(r => setTimeout(r, 1200));
const txt = app.querySelector('#text')?.textContent || '';
if (!txt.trim()) bad.push('讀不到內文');
else out.push(`讀得到內文：「${txt.slice(0,12)}⋯」`);

let seen = [];
for (let i=0;i<14;i++){
  const t = app.querySelector('#tap'); if (t) t.click();
  await new Promise(r => setTimeout(r, 260));
  const pl = app.querySelector('#plate');
  if (pl?.classList.contains('on') && pl.textContent && !seen.includes(pl.textContent))
    seen.push(pl.textContent);
}
if (seen.includes('余冷川')) bad.push('⚠⚠ 名牌漏出「余冷川」');
else if (seen.length) out.push(`名牌：${seen.join('／')}。而沒有漏出「余冷川」`);
else out.push('（14 下沒點到對白）');

/* 六｜對練跑得動嗎 */
w.location.hash = 'spar';
await new Promise(r => setTimeout(r, 400));
const go = app.querySelector('#go');
if (!go) bad.push('對練沒有推演鈕');
else { go.click(); await new Promise(r=>setTimeout(r,150));
  /* ⚠ 推演現在是「播」的 —— 要按跳到結果 */
  app.querySelector('#aSkip')?.click();
  await new Promise(r=>setTimeout(r,150));
  const end = app.querySelector('#end');
  if (!end || end.hidden) bad.push('對練推不出結果');
  else out.push(`對練：${end.querySelector('.v')?.textContent}`); }

console.log('═══ 單檔版 ═══\n');
out.forEach(x => console.log('  ✓ ' + x));
if (bad.length){ console.log('\n壞掉'); bad.forEach(x => console.log('  ✗ ' + x)); }
console.log(`\n${out.length} 通過　${bad.length} 壞掉`);
process.exit(bad.length ? 1 : 0);
