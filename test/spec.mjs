/* 設計對實作
 *
 * 而「還剩什麼沒做」這個問題，應該由文件回答，不是由記憶回答。
 *
 * 所以這一支把設計文件裡每一條規格，拿去對程式碼。
 *
 * 而它抓到過一項：「不對等」資訊模式。設計裡最重的一條，而它沒有做。
 */

import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

/* 把 src 底下全部讀成一坨，然後找 */
let ALL = '';
(function walk(d){
  for (const f of readdirSync(d, { withFileTypes:true })){
    const p = join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(js|css)$/.test(f.name)) ALL += readFileSync(p,'utf8') + '\n';
  }
})(SRC);

/* 規格 → 在程式碼裡要找得到的東西 */
const SPEC = [
  ['對練場', [
    ['選年份。而那不是難度選擇',      /chronology|function years/],
    ['條件：天色／時段／地形／掩體',   /CONDS|terrain/],
    ['四種結束條件',                   /END_LABEL/],
    ['處置格。而不是每個角色都能選',   /GATE_LABEL/],
    ['而這裡沒有第四格',               /沒有第四格/],
    ['資訊模式：不對等',               /blind/],
    ['而你要打過才知道',               /known\(|fought/],
    ['順風：你是第四個',               /你是第四個/],
    ['一份紀錄。而它沒有排名',         /沒有排名/],
  ]],
  ['劇情介面', [
    ['名牌跟著視角人物的認知走',       /plateFor/],
    ['跳過要長按',                     /HOLD\s*=/],
    ['自動時點畫面是關掉自動',         /setAuto\(false\)/],
    ['六種框',                         /narration[\s\S]{0,80}screen/],
    ['強調慢 30%',                     /1\.3/],
    ['強調自動多停 0.4 秒',            /400 : 0|extra = /],
    ['引用不逐字',                     /type\s*===\s*'quote'/],
    ['小標不需要點',                   /'section'\)\{/],
    ['pause_before 變成時間',          /pause_before|300 : /],
    ['懸掛的「而」',                   /erS|hang/],
    ['而入口叫「那些事」',             /那些事/],
  ]],
  ['打贏不是打死', [
    ['存空了不等於輸',                 /存空了/],
    ['而人還在，還能跑',               /還能跑/],
    ['一方停下來',                     /stopped/],
    ['而對練場不能殺',                 /不能殺/],
  ]],
  ['那一天', [
    ['丙：四碼是空的',                 /你一格都沒有/],
    ['丙：偵察一段給你一格',           /scout/],
    ['甲：四碼一開始就全有',           /CODE_MEAN|codes/],
    ['甲：而你可以不接',               /pass/],
    ['甲：而她把辮子拆掉',             /辮子/],
    ['乙：你給四碼 → 挑人 → 回報',     /grade[\s\S]{0,400}pick[\s\S]{0,400}report/],
    ['乙：而回報只寫傷勢與處置',       /只寫傷勢與處置/],
    ['乙：名單上有一個人被劃掉',       /block/],
  ]],
  ['知識層', [
    ['只看得到那個人知道的',           /fromPOV/],
    ['被瞞的內容只給數量',             /doesnt/],
    ['而跟閱讀進度綁在一起',           /unlocked/],
  ]],
];

const miss = [];
let n = 0, hit = 0;
console.log('═══ 設計對實作 ═══\n');
for (const [group, items] of SPEC){
  console.log(group);
  for (const [name, re] of items){
    n++;
    const ok = re.test(ALL);
    if (ok) hit++; else miss.push(`${group}　${name}`);
    console.log(`  ${ok?'✓':'✗'} ${name}`);
  }
  console.log();
}
console.log(`${hit}/${n} 做了`);
if (miss.length){
  console.log('\n而還沒做的');
  miss.forEach(m => console.log('  ✗ ' + m));
}
process.exit(miss.length ? 1 : 0);
