/* 戰鬥畫面
 * ⚠ 這個世界的仗不是血條互砍。
 *   存空了 —— 那個東西沒有了。而人還在，還能跑，還能用技術。
 *   所以存跟體要是兩條，而且不能合成一條。 */
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arena = readFileSync(join(ROOT,'3d/arena.js'),'utf8');
const spar  = readFileSync(join(ROOT,'src/ui/spar.js'),'utf8');
const css   = readFileSync(join(ROOT,'src/style/app.css'),'utf8');
const ok=[], bad=[];
const has=(re,n,src)=> re.test(src)?ok.push(n):bad.push(n);

/* 一｜兩條，不是一條 */
has(/cun:\s*bar\([\s\S]{0,40}sta:\s*bar\(/, '存跟體是兩條', arena);
has(/\.sw\.cun\{background:#9AA6AE\}[\s\S]{0,40}\.sw\.sta\{background:#C4A88F\}/,
    '兩條顏色不一樣，看得出來', css);
has(/而存空了不是輸/, '畫面上寫著「存空了不是輸」', spar);
/* ⚠ 只看程式碼，不看註解 —— 註解裡本來就會寫「不是血條互砍」 */
const code = arena.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');
if (/\b(hp|health|hitPoints)\b/i.test(code)) bad.push('arena.js 的程式碼裡有血量變數');
else ok.push('程式碼裡沒有血量這種東西');

/* 二｜動不了是倒下，不是消失 */
has(/down\(side\)[\s\S]{0,200}rotation\.z/, '動不了＝倒下，不是消失', arena);
has(/而「停下來」不是倒下/, '停下來跟倒下是兩件事', arena);

/* 三｜逐拍。而每一拍要帶狀態 */
const sim = readFileSync(join(ROOT,'src/core/sim.js'),'utf8');
has(/const snap = \(\)/, 'sim 每一行帶那一刻的狀態', sim);
has(/side=null/, 'sim 標了是誰出手', sim);
has(/setInterval\(step, \d+\)/, '畫面是一拍一拍跑的', spar);
has(/aSkip/, '有「跳到結果」', spar);

/* 四｜實際跑一場，看狀態序列合不合理 */
const R={};
for (const f of readdirSync(join(ROOT,'data/characters'))){
  const c=JSON.parse(readFileSync(join(ROOT,'data/characters',f),'utf8'));
  const id=f.replace('.json',''), i=c.identity||{}, r=c.resource||{}, cb=c.combat||{};
  R[id]={id,name:i.name_zh||id,cun:(r.cun||{}).max,regen:(r.cun||{}).regen_band,
    sta:(r.stamina||{}).max,ab:(cb.abilities||[]).map(a=>({id:a.id,label:a.label,cost:a.cost}))};
}
const { sim: run } = await import('../src/core/sim.js');
const r = run(R,'zhang_zhenqi','cheng_yijin',{sky:'晴',time:'日',terrain:'室外',cover:true});
const st = r.L.filter(x=>x.at);
if (st.length > 20) ok.push(`跑一場帶了 ${st.length} 個狀態點`);
else bad.push(`狀態點只有 ${st.length} 個 —— 畫面會跟不動`);
const inRange = st.every(x =>
  [x.at.a.cun,x.at.a.sta,x.at.b.cun,x.at.b.sta].every(v => v >= 0 && v <= 1.001));
inRange ? ok.push('存與體都在 0–1 之間') : bad.push('有值跑出 0–1');
/* 而存空了之後，那一場不能立刻結束 */
const empty = st.findIndex(x => x.at.a.cun <= 0 || x.at.b.cun <= 0);
if (empty === -1) ok.push('（這一場沒有人存空）');
else if (empty < st.length - 2) ok.push(`存空之後還打了 ${st.length-1-empty} 拍 —— 而那是對的`);
else bad.push('存一空就結束了 —— 而那把設定拆掉了');

console.log('═══ 戰鬥畫面 ═══\n');
ok.forEach(x=>console.log('  ✓ '+x));
if (bad.length){ console.log('\n壞掉'); bad.forEach(x=>console.log('  ✗ '+x)); }
console.log(`\n${ok.length} 通過　${bad.length} 壞掉`);
process.exit(bad.length?1:0);
