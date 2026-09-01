/* 模擬「直接點兩下 index.html」
 * jsdom 不執行 type=module —— 而那剛好就是瀏覽器從 file:// 擋掉的狀態。
 * 所以這一支測的是：那種時候使用者看得到什麼。 */
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const bad = [], ok = [];

for (const [label, url, file] of [
  ['app/index.html 從 file:// 點開', 'file:///C:/x/app/index.html', 'index.html'],
  ['交付/index.html 從 file:// 點開', 'file:///C:/x/index.html', '../交付/index.html'],
]){
  let html;
  try { html = readFileSync(join(ROOT, file), 'utf8'); }
  catch { bad.push(`${label}：找不到檔案`); continue; }

  const dom = new JSDOM(html, { runScripts:'dangerously', url });
  const w = dom.window;
  await new Promise(r => setTimeout(r, 120));

  /* 使用者看得到的字 */
  const body = w.document.body;
  const seen = [...body.querySelectorAll('*')]
    .filter(el => el.offsetParent !== null || (el.style.display !== 'none' && el.tagName !== 'SCRIPT'))
    .map(el => el.textContent).join(' ');
  const visible = (w.document.getElementById('nofile')?.style.display === 'block')
    || body.textContent.trim().length > 40;

  if (!visible) bad.push(`${label}：還是全黑，什麼都沒有`);
  else {
    const first = body.textContent.trim().replace(/\s+/g,' ').slice(0, 34);
    ok.push(`${label}\n      看得到：「${first}⋯」`);
  }
}

console.log('═══ 點兩下會看到什麼 ═══\n');
ok.forEach(x => console.log('  ✓ ' + x));
if (bad.length){ console.log('\n壞掉'); bad.forEach(x => console.log('  ✗ ' + x)); }
console.log(`\n${ok.length} 通過　${bad.length} 壞掉`);
process.exit(bad.length ? 1 : 0);
