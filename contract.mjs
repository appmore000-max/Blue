/* 資料契約
 *
 * 而那個 type 是 undefined 的 bug，是「程式以為的資料形狀」跟
 * 「資料實際的形狀」對不上。
 *
 * 而那一類問題不會報錯。
 *
 * 所以這一支的工作是：把程式讀的每一個欄位，拿去對真的資料。
 */

import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = p => JSON.parse(readFileSync(join(ROOT,'data',p),'utf8'));

const bad = [];
const warn = [];
const ok = [];
const fail = (w,m) => bad.push(`${w}　${m}`);

/* ── 劇本層 ─────────────────────────── */
const M = D('manifest.json');
const CAST = M.cast, MINOR = M.minor;
const KNOWN_ID = new Set([...Object.keys(CAST), ...Object.keys(MINOR)]);

/* 而 story.js 認得的框型只有這六種 */
const TYPES = new Set(['narration','emphasis','speech','quote','section','screen']);
const COLLECTIVE = new Set(['74_那九年','98_一樣的下午','99_那一天']);

let boxes=0, speech=0, maxPause=0;
const badType = new Set(), badWho = new Set(), badPov = new Set(), badRule = new Set();
let noWho = 0, noPause = 0, noText = 0;

/* ⚠ 檔名已經改成純 ASCII（GitHub Pages）。而 id 還是中文 —— 從檔案內容讀 */
const files = readdirSync(join(ROOT,'data/script'))
  .filter(f => f.endsWith('.json') && !['index.json','minor-cast.json'].includes(f));

for (const f of files){
  const s = D(`script/${f}`);
  const id = s.id || f.replace(/\.json$/,'');

  /* pov */
  if (!s.pov){ if (!COLLECTIVE.has(id)) badPov.add(`${id}　沒有 pov`); }
  else if (!KNOWN_ID.has(s.pov)) badPov.add(`${id}　pov=${s.pov} 不在名字表裡`);

  /* label_rule 的鍵要是合法 id */
  for (const k of Object.keys(s['⚠_label_rule'] || {})){
    if (k === '⚠') continue;
    if (!KNOWN_ID.has(k)) badRule.add(`${id}　規則鍵 ${k} 不在名字表裡`);
  }

  for (const b of s.boxes){
    boxes++;
    if (typeof b.text !== 'string') noText++;
    if (typeof b.pause_before !== 'number') noPause++;
    else maxPause = Math.max(maxPause, b.pause_before);

    /* ⚠ 這一條就是那個 bug */
    if (!TYPES.has(b.t)) badType.add(`${b.t}`);

    if (b.t === 'speech'){
      speech++;
      if (!b.who) noWho++;
      else if (!KNOWN_ID.has(b.who)) badWho.add(b.who);
    }
  }
}

ok.push(`劇本　${files.length} 篇　${boxes.toLocaleString()} 框　對白 ${speech}`);
if (badType.size) fail('框型', `出現程式不認得的：${[...badType].join('、')}`);
else ok.push(`框型　全部是那六種`);
if (noText)  fail('框', `${noText} 個沒有 text`);
if (noPause) fail('框', `${noPause} 個沒有 pause_before`);
else ok.push(`pause_before　全部有。最大 ${maxPause}`);
if (noWho)   fail('對白', `${noWho} 句沒有說話人`);
else ok.push('對白　全部有說話人');
if (badWho.size) fail('說話人', `不在名字表裡：${[...badWho].join('、')}`);
else ok.push('說話人　全部在名字表裡');
if (badPov.size) fail('視角', [...badPov].slice(0,4).join('；'));
else ok.push('視角　全部有，而且都在名字表裡');
if (badRule.size) fail('標籤規則', [...badRule].slice(0,4).join('；'));
else ok.push('標籤規則　鍵全部合法');

/* ── 角色層：對練場讀的欄位 ───────────── */
const charFiles = readdirSync(join(ROOT,'data/characters')).filter(f=>f.endsWith('.json'));
let noName=0, noRole=0, weirdCost=new Set();
/* ⚠ 直接讀對練場那一份，不要自己寫。否則下次又會脫節 */
const { COST } = await import('../src/core/sim.js');
const COSTS = new Set([...Object.keys(COST), 'null', 'undefined']);

for (const f of charFiles){
  const c = D(`characters/${f}`);
  const i = c.identity || {}, cb = c.combat || {};
  if (!i.name_zh) noName++;
  if (!cb.role) noRole++;
  for (const a of (cb.abilities || [])){
    if (a.cost == null) continue;
    if (typeof a.cost === 'object') continue;          /* 陳婷雅：兩種發射 */
    if (!COSTS.has(String(a.cost))) weirdCost.add(String(a.cost));
  }
}
ok.push(`角色　${charFiles.length} 個`);
if (noName) fail('角色', `${noName} 個沒有 name_zh`);
if (noRole) warn.push(`角色　${noRole} 個沒有 role（而那些是非戰鬥角色）`);
if (weirdCost.size) warn.push(`招式消耗　出現沒對照到的：${[...weirdCost].join('、')}（會用預設值 12）`);
else ok.push('招式消耗　全部對照得到');

const charIdsPre = new Set(charFiles.map(f=>f.replace(/\.json$/,'')));

/* ── 世界層：那一天讀的欄位 ───────────── */
const eg = D('world/event_grading.json');
if (!Array.isArray(eg.digits) || eg.digits.length !== 4) fail('四碼', '不是四碼');
else {
  const okLv = eg.digits.every(d => d.levels && Object.keys(d.levels).length === 4);
  if (!okLv) fail('四碼', '有某一碼不是四級');
  else ok.push('四碼　四碼四級，而且 never_sum=' + eg.never_sum);
}

/* ── 編年 ───────────────────────────── */
const C = D('world/chronology.json');
let chronBad = 0, chronN = 0;
for (const [pid,P] of Object.entries(C.people || {})){
  if (!charIdsPre.has(pid)){ fail('編年', `${pid} 沒有對應的角色檔`); chronBad++; continue; }
  let cur = 0;
  for (const a of P.ages){
    chronN++;
    if (a.year - P.born !== a.age){
      fail('編年', `${pid} ${a.label}：${a.year}−${P.born}≠${a.age}`); chronBad++;
    }
    if (a.current){ cur++; if (a.year !== C.now){ fail('編年', `${pid} current 不是 ${C.now}`); chronBad++; } }
  }
  if (cur !== 1){ fail('編年', `${pid} 的 current 有 ${cur} 個`); chronBad++; }
  /* 現在那一格要跟角色檔的年齡一致 */
  const c = D(`characters/${pid}.json`);
  const now = (c.identity||{}).age;
  const cu = P.ages.find(a=>a.current);
  if (now && cu && cu.age !== now){ fail('編年', `${pid} 編年說 ${cu.age}，角色檔說 ${now}`); chronBad++; }
}
if (!chronBad) ok.push(`編年　${Object.keys(C.people||{}).length} 人 ${chronN} 格，全部對得上角色檔`);

/* ── 名字表 vs 角色檔 ───────────────── */
const charIds = new Set(charFiles.map(f=>f.replace(/\.json$/,'')));
const inCastNotFile = Object.keys(CAST).filter(k=>!charIds.has(k));
const inFileNotCast = [...charIds].filter(k=>!(k in CAST));
if (inCastNotFile.length) fail('名字表', `有 id 沒有對應的角色檔：${inCastNotFile.join('、')}`);
if (inFileNotCast.length) fail('角色檔', `有檔案不在名字表裡：${inFileNotCast.join('、')}`);
if (!inCastNotFile.length && !inFileNotCast.length) ok.push('名字表　跟角色檔一一對應');

/* ── 報告 ───────────────────────────── */
console.log('═══ 資料契約 ═══\n');
console.log('通過');
ok.forEach(x=>console.log('  ✓ '+x));
if (warn.length){ console.log('\n提醒'); warn.forEach(x=>console.log('  ⚠ '+x)); }
if (bad.length){ console.log('\n對不上'); bad.forEach(x=>console.log('  ✗ '+x)); }
console.log(`\n${ok.length} 通過　${warn.length} 提醒　${bad.length} 對不上`);
process.exit(bad.length ? 1 : 0);
