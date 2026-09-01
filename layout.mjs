/* 版面
 * ⚠ 截圖裡搖桿跟日期、說明文字疊在一起 —— 而測試沒抓到。
 *   因為我只測「有沒有渲染」，沒測「有沒有壓在一起」。 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(ROOT,'src/style/app.css'),'utf8');
const ui  = readFileSync(join(ROOT,'src/ui/road.js'),'utf8');
const ok=[], bad=[];
const has = (re, name, src=css) => re.test(src) ? ok.push(name) : bad.push(name);

/* 一｜畫布要填滿，不能被下面的東西擠扁 */
has(/#view\{position:absolute;inset:0\}/, '畫布填滿整個容器');
has(/\.road\{position:relative;width:100%;height:100dvh/, '容器是滿版');
if (/\.road\{[^}]*grid-template-rows/.test(css))
  bad.push('容器還在切格子 —— 畫布會被擠扁');
else ok.push('容器不切格子');

/* 二｜控制不能壓到日期 */
const pad  = css.match(/\.pad\{[^}]*bottom:(\d+)px/);
const dayH = /\.daybar\{[^}]*bottom:0/.test(css);
if (pad && dayH && +pad[1] >= 50) ok.push(`控制在日期列上面 ${pad[1]}px —— 不會壓到`);
else bad.push('控制可能壓到日期列');

/* 三｜說明文字不能排在畫面下面 —— 要蓋上去 */
if (/\.info\{position:absolute;inset:0/.test(css)) ok.push('說明是蓋上去的，不是排在下面');
else bad.push('說明還排在下面 —— 會把畫布擠扁');
if (/class="note"/.test(ui)) bad.push('road.js 還有排在下面的說明段');
else ok.push('road.js 沒有排在下面的說明段');

/* 四｜z 層要分開，不能同層互壓 */
const z = {};
for (const m of css.matchAll(/\.(road-bar|hud|stand|count|pad|daybar|note-card|info)\{[^}]*z-index:(\d+)/g))
  z[m[1]] = +m[2];
const need = ['road-bar','hud','pad','daybar','note-card','info'];
const missing = need.filter(k => !(k in z));
if (missing.length) bad.push(`沒有設 z-index：${missing.join('、')}`);
else if (z['note-card'] > z.pad && z.info > z['note-card'])
  ok.push(`層次對：控制 ${z.pad} < 那一頁 ${z['note-card']} < 說明 ${z.info}`);
else bad.push('層次不對 —— 蓋不住下面的東西');

/* 五｜手機上要縮 */
has(/@media \(max-width:430px\)[\s\S]{0,200}#stick\{width:88px/, '窄螢幕搖桿會縮小');

/* 六｜世界不能是全黑的 */
const road = readFileSync(join(ROOT,'3d/road.js'),'utf8');
const cols = [...road.matchAll(/0x([0-9A-Fa-f]{6})/g)].map(m => parseInt(m[1],16));
const bright = cols.filter(c => ((c>>16)+((c>>8)&255)+(c&255))/3 > 110).length;
if (bright >= 5) ok.push(`世界有 ${bright} 個亮色 —— 不是全黑的`);
else bad.push(`世界只有 ${bright} 個亮色 —— 而那會看起來像關著燈`);
if (/new THREE\.Fog\(C\.fog, 60, 420\)/.test(road)) ok.push('霧夠遠，近處看得見');
else bad.push('霧太近 —— 什麼都看不到');

/* 七｜台灣的東西 */
for (const [k,n] of [[/反光鏡/,'反光鏡'],[/電線桿/,'電線桿'],[/護欄/,'護欄'],
                     [/芒草/,'芒草'],[/里程樁/,'里程樁'],[/鐵皮/,'鐵皮屋']])
  k.test(road) ? ok.push(`有 ${n}`) : bad.push(`缺 ${n}`);

console.log('═══ 版面 ═══\n');
ok.forEach(x=>console.log('  ✓ '+x));
if (bad.length){ console.log('\n壞掉'); bad.forEach(x=>console.log('  ✗ '+x)); }
console.log(`\n${ok.length} 通過　${bad.length} 壞掉`);
process.exit(bad.length?1:0);
