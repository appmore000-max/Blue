/* 那條路。而 jsdom 沒有 WebGL ——
   所以這一支測兩件事：
     一｜three.js 有沒有被正確包進去（拿不到就是打包壞了）
     二｜沒有 WebGL 的時候，它會不會好好講話（而不是白畫面） */
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT,'..','藍天白雲傳承.html'),'utf8');
const ok=[], bad=[];

const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true,
  url:'file:///x/y.html' });
const w = dom.window;
w.matchMedia = () => ({ matches:false, addEventListener(){}, removeEventListener(){} });
await new Promise(r => setTimeout(r, 600));
const app = w.document.getElementById('app');

/* 一｜選單有第七個 */
const modes = [...app.querySelectorAll('[data-go]')].map(b=>b.dataset.go);
if (modes.length !== 7) bad.push(`選單 ${modes.length} 個，應該 7 個`);
else ok.push(`選單 7 個：${modes.join('、')}`);

/* 二｜three.js 進去了 */
if (!/IcosahedronGeometry|CatmullRomCurve3/.test(html)) bad.push('three.js 沒有進去');
else ok.push('three.js 內嵌了（1.5 MB 單檔，離線也能開）');

/* 三｜那些數字是書裡的 */
for (const [k, re] of [
  ['一公里', /length:\s*1000/],
  ['三分之二處換碎石', /gravelAt:\s*0\.667/],
  ['空地二十幾公尺', /clearing:\s*24/],
  ['十四分鐘', /walkMin:\s*14/],
  ['那條線十三筆', /\['12\/2',56\]/],
]) re.test(html) ? ok.push(`那些數字：${k}`) : bad.push(`數字對不上：${k}`);

/* 四｜沒有 WebGL 的時候會講話，不會白畫面 */
const road = [...app.querySelectorAll('[data-go]')].find(b=>b.dataset.go==='road');
road.click();
await new Promise(r => setTimeout(r, 500));
const t = app.textContent || '';
if (!t.trim()) bad.push('那條路：整頁空白');
else if (/畫不出來|WebGL/.test(t)) ok.push('沒有 WebGL 的時候會講話，不是白畫面');
else if (/那條路/.test(t)) ok.push('那條路：畫面出來了');
else bad.push(`那條路：畫面怪怪的「${t.trim().slice(0,30)}」`);

/* 五｜回得去 */
const back = app.querySelector('.back');
if (back){ back.click(); await new Promise(r=>setTimeout(r,300)); }
if (app.querySelectorAll('[data-go]').length === 7) ok.push('回得去選單');
else bad.push('回不去選單');

console.log('═══ 那條路 ═══\n');
ok.forEach(x=>console.log('  ✓ '+x));
if (bad.length){ console.log('\n壞掉'); bad.forEach(x=>console.log('  ✗ '+x)); }
console.log(`\n${ok.length} 通過　${bad.length} 壞掉`);
process.exit(bad.length?1:0);
