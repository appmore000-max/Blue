/* 數的那一套。而它是這條路真正的動作。
   ⚠ jsdom 沒有 WebGL，所以 walk.js 跑不起來 ——
     這一支直接把那段判斷抄出來測，確保規則本身是對的。 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(ROOT, '3d/walk.js'), 'utf8');
const ok = [], bad = [];

/* 一｜規則有寫進去 */
for (const [name, re] of [
  ['按一下＝一圈',        /function mark\(\)/],
  ['第一下是起點，不算',   /start:true/],
  ['三下之後收起來',      /counts\.length >= 3/],
  ['而三次一不一樣要判斷', /every\(x => x === state\.counts\[0\]\)/],
  ['跟真值比',            /CIRCLE\[state\.dayIdx\]\[1\]/],
  ['換日期要清掉',        /clearNote|state\.noted = null/],
]) re.test(src) ? ok.push(name) : bad.push(`walk.js 缺：${name}`);

/* 二｜把那段判斷抄出來，實際跑 */
function judge(counts, truth){
  const same = counts.every(x => x === counts[0]);
  const avg = Math.round(counts.reduce((a,b)=>a+b,0)/3);
  return { steady: same, value: same ? counts[0] : avg, off: Math.abs(avg - truth) };
}
const cases = [
  [[27,27,27], 27, true,  0, '三次一樣，而且對'],
  [[27,27,28], 27, false, 0, '三次不一樣 —— 而那本身是資訊'],
  [[30,30,30], 27, true,  3, '很穩，而數錯了'],
  [[56,56,56], 56, true,  0, '十二月那一格'],
];
for (const [c, truth, wantSteady, wantOff, label] of cases){
  const r = judge(c, truth);
  if (r.steady === wantSteady && r.off === wantOff) ok.push(`${label}　${c.join('/')}`);
  else bad.push(`${label}：穩=${r.steady}（要 ${wantSteady}）差=${r.off}（要 ${wantOff}）`);
}

/* 三｜那條線的十三筆 */
const road = readFileSync(join(ROOT, '3d/road.js'), 'utf8');
const m = road.match(/CIRCLE = \[([\s\S]*?)\];/);
const n = m ? (m[1].match(/\['/g) || []).length : 0;
n === 13 ? ok.push(`那條線 13 筆`) : bad.push(`那條線只有 ${n} 筆`);
/* 而它要單調遞增 */
const vals = [...m[1].matchAll(/,(\d+)\]/g)].map(x => +x[1]);
const mono = vals.every((v,i) => i===0 || v >= vals[i-1]);
mono ? ok.push(`27 → ${vals[vals.length-1]}　單調遞增`) : bad.push('那條線倒退了');

console.log('═══ 數 ═══\n');
ok.forEach(x => console.log('  ✓ ' + x));
if (bad.length){ console.log('\n壞掉'); bad.forEach(x => console.log('  ✗ ' + x)); }
console.log(`\n${ok.length} 通過　${bad.length} 壞掉`);
process.exit(bad.length ? 1 : 0);
