import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
const ROOT='/home/claude/work/app';
const html=readFileSync('/home/claude/work/交付/藍天白雲傳承.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'file:///x/y.html'});
const w=dom.window;
w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
await new Promise(r=>setTimeout(r,600));
const app=w.document.getElementById('app');

console.log('=== 選單上有什麼 ===');
[...app.querySelectorAll('[data-go]')].forEach(b=>
  console.log('  ', b.dataset.go, '　', b.querySelector('b')?.textContent));

console.log('\n=== 一個一個點進去 ===');
for (const b of [...app.querySelectorAll('[data-go]')]){
  const id=b.dataset.go, name=b.querySelector('b')?.textContent;
  b.click();
  await new Promise(r=>setTimeout(r,500));
  const len=app.innerHTML.length;
  const has=app.querySelector('.bar span')?.textContent || '（沒有標題列）';
  console.log(`  ${id.padEnd(6)} ${name}　→　${len} chars　標題:「${has}」`);
  // 回選單
  const back=app.querySelector('.back');
  if(back){ back.click(); await new Promise(r=>setTimeout(r,300)); }
  else { w.location.hash=''; await new Promise(r=>setTimeout(r,300)); }
  const backOK = app.querySelectorAll('[data-go]').length===6;
  if(!backOK) console.log(`     ⚠ 回不去選單（現在 ${app.querySelectorAll('[data-go]').length} 個鈕）`);
}
