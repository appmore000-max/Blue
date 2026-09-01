/* 整合測試
 *
 * 而這一支要做的事，是把五個模式真的掛起來跑一次。
 *
 * 因為這個 session 的教訓是：
 * 檔案能開、數字看起來合理、模組匯出得出來 —— 而它還是可能整個不會動。
 */

import { JSDOM } from 'jsdom';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const errs = [];
const warns = [];
const ok = [];

/* ── 假的瀏覽器 ─────────────────────── */
function makeDOM(){
  const dom = new JSDOM('<!DOCTYPE html><body><div id="app"></div></body>',
    { url:'http://localhost/', pretendToBeVisual:true });
  const w = dom.window;

  /* fetch → 直接讀檔 */
  w.fetch = async (url) => {
    let rel = String(url).replace(/^\.?\//,'').replace(/^http:\/\/localhost\//,'');
    try { rel = decodeURIComponent(rel); } catch {}
    const p = join(ROOT, rel);
    if (!existsSync(p)) return { ok:false, status:404, json:async()=>{throw new Error('404 '+rel)} };
    const txt = readFileSync(p, 'utf8');
    return { ok:true, status:200, json: async()=>JSON.parse(txt), text: async()=>txt };
  };
  w.matchMedia = () => ({ matches:false, addEventListener(){}, removeEventListener(){} });
  w.requestAnimationFrame = cb => setTimeout(()=>cb(performance.now()), 0);
  w.cancelAnimationFrame = id => clearTimeout(id);
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};

  /* 全域搬過去 */
  for (const k of ['document','fetch','matchMedia','requestAnimationFrame',
    'cancelAnimationFrame','localStorage','Element','HTMLElement',
    'Node','CustomEvent','location','scrollTo']){
    try { globalThis[k] = w[k]; } catch {}
  }
  globalThis.addEventListener = w.addEventListener.bind(w);
  globalThis.removeEventListener = w.removeEventListener.bind(w);
  if (!globalThis.performance) globalThis.performance = { now: () => Date.now() };
  globalThis.window = w;
  globalThis.document = w.document;

  const onerr = [];
  w.addEventListener('error', e => onerr.push(e.message));
  return { dom, w, onerr };
}

const M = JSON.parse(readFileSync(join(ROOT,'data/manifest.json'),'utf8'));

/* ── 一個一個掛 ─────────────────────── */
async function mount(name, importPath, fn){
  const { w } = makeDOM();
  const app = w.document.getElementById('app');
  try {
    const mod = await import(importPath);
    const { initLabels } = await import('../src/core/labels.js');
    initLabels({ cast:M.cast, minor:M.minor });
    await fn(mod, app);
    await new Promise(r => setTimeout(r, 60));
    const html = app.innerHTML;
    if (!html || html.length < 60) throw new Error(`畫面幾乎是空的（${html.length} chars）`);
    ok.push(`${name}　渲染 ${html.length} chars`);
    return { app, w };
  } catch (e){
    errs.push(`${name}　${e.message}`);
    return null;
  }
}

/* ── 點東西 ─────────────────────────── */
function click(app, sel){
  const el = app.querySelector(sel);
  if (!el) return null;
  el.click();
  return el;
}

console.log('═══ 整合測試 ═══\n');

/* 一｜選單 */
{
  const r = await mount('選單', '../src/ui/shell.js', async (mod, app) => {
    /* boot 會自己讀 manifest */
    await mod.boot();
  });
  if (r){
    const modes = r.app.querySelectorAll('[data-go]').length;
    if (modes !== 7) warns.push(`選單只有 ${modes} 個模式，應該 7 個`);
    else ok.push("選單　7 個模式都在");
  }
}

/* 二｜那些事：目次 → 讀一篇 */
{
  const r = await mount('那些事．目次', '../src/ui/story.js',
    (mod, app) => mod.mountStory(app, M, null, ()=>{}));
  if (r){
    const items = r.app.querySelectorAll('[data-id]').length;
    if (items !== 125) warns.push(`目次只有 ${items} 篇，應該 125 篇`);
    else ok.push('那些事　125 篇都在');
  }
}
{
  const r = await mount('那些事．讀', '../src/ui/story.js',
    (mod, app) => mod.mountStory(app, M, '長篇_20_靠窗那個位置', ()=>{}));
  if (r){
    /* 逐字要跑完。而第一框是 section，會自己往下走 */
    await new Promise(res => setTimeout(res, 1400));
    const text = r.app.querySelector('#text');
    if (!text || !text.textContent.trim()) errs.push('那些事．讀　文字沒有出來');
    else ok.push(`那些事．讀　「${text.textContent.slice(0,16)}⋯」`);
    /* 名牌規則：跑到有對白的地方，看名牌對不對 */
    const plate = r.app.querySelector('#plate');
    /* 點到有名牌的地方，看名牌對不對 —— 而那是這整套東西的地基 */
    /* ⚠ 要等到 #next 亮起來（那一框跑完了）才點下一下。
       否則會在停頓期間點掉，而名牌永遠抓不到。 */
    let seen = [];
    for (let n=0;n<16;n++){
      let waited=0;
      while (waited<3000){
        await new Promise(res => setTimeout(res, 50)); waited+=50;
        if (r.app.querySelector('#next')?.classList.contains('on')) break;
      }
      const pl = r.app.querySelector('#plate');
      if (pl?.classList.contains('on') && pl.textContent && !seen.includes(pl.textContent))
        seen.push(pl.textContent);
      click(r.app,'#tap');
    }
    ok.push('那些事．讀　走過 16 框沒有炸');
    if (seen.length){
      ok.push(`名牌　${seen.join('／')}`);
      /* 長篇_20 視角是陳文彬。而余冷川絕對不能顯示本名 */
      if (seen.includes('余冷川'))
        errs.push('⚠⚠ 名牌漏出本名「余冷川」—— 而這一篇的規則寫著絕對不能');
      else ok.push('名牌　沒有漏出「余冷川」。而地基還在');
    } else warns.push('那些事．讀　16 框內沒有點到對白');
  }
}

/* 三｜對練 */
{
  const r = await mount('對練', '../src/ui/spar.js',
    (mod, app) => mod.mountSpar(app, M, null, ()=>{}));
  if (r){
    await new Promise(res => setTimeout(res, 100));
    const opts = r.app.querySelectorAll('#pa option').length;
    if (opts !== 22) warns.push(`對練名單只有 ${opts} 個`);
    /* 年份選擇器 —— 而選年份不是難度選擇，那是不同的人 */
    const yrs = r.app.querySelectorAll('#ya .yr').length;
    if (!yrs) warns.push('對練　沒有年份選擇器');
    else ok.push(`對練　張真琪有 ${yrs} 個年份`);
    click(r.app, '#go');
    await new Promise(res => setTimeout(res, 80));
    /* ⚠ 推演現在是「播」的 —— 要按「跳到結果」才會出來 */
    click(r.app, '#aSkip');
    await new Promise(res => setTimeout(res, 80));
    const end = r.app.querySelector('#end');
    if (!end || end.hidden) errs.push('對練　推演之後沒有結果');
    else ok.push(`對練　推演出結果：${end.querySelector('.v')?.textContent}`);
    /* 而戰鬥畫面 */
    if (r.app.querySelector('#arena') && !r.app.querySelector('#arena').hidden)
      ok.push('對練　戰鬥畫面出來了');
    else errs.push('對練　推演之後沒有戰鬥畫面');
    const feed = r.app.querySelectorAll('.afeed .fl').length;
    if (feed) ok.push(`對練　逐拍跑了 ${feed} 行`);
    else warns.push('對練　逐拍沒有出字');

    /* 不對等模式 —— 而那是設計裡最重的一項 */
    const mb = r.app.querySelector('#mBlind');
    if (!mb) errs.push('對練　沒有資訊模式開關');
    else {
      mb.click(); await new Promise(res=>setTimeout(res,40));
      const foe = r.app.querySelector('#sb')?.textContent || '';
      const warnB = r.app.querySelector('#wb')?.textContent || '';
      if (foe.includes('—') && warnB.includes('不知道'))
        ok.push('不對等　對方的東西看不到了');
      else errs.push(`不對等　對方的東西還看得到：${foe.slice(0,24)}`);
      click(r.app,'#go'); await new Promise(res=>setTimeout(res,80));
      click(r.app,'#aSkip'); await new Promise(res=>setTimeout(res,80));
      const knew = r.app.querySelector('.knew')?.textContent || '';
      if (knew.includes('你現在知道他會什麼了')) ok.push('不對等　打完之後解鎖了');
      else errs.push('不對等　打完之後沒有那一行');
      const foe2 = r.app.querySelector('#sb')?.textContent || '';
      if (!foe2.includes('存 —')) ok.push('不對等　解鎖之後看得到了');
      else errs.push('不對等　解鎖之後還是看不到');
      const recs = r.app.querySelectorAll('.rc').length;
      if (recs) ok.push(`紀錄　${recs} 筆。而它沒有排名`);
      else warns.push('紀錄　沒有出現');
      r.app.querySelector('#mOpen')?.click();
    }

    /* 切到十二歲，看標題有沒有帶年份 */
    const y12 = [...r.app.querySelectorAll('#ya .yr')].find(b=>b.dataset.a==='12');
    if (y12){
      y12.click(); click(r.app,'#go');
      await new Promise(res => setTimeout(res, 80));
      click(r.app,'#aSkip'); await new Promise(res => setTimeout(res, 80));
      const head = r.app.querySelector('#out .head')?.textContent || '';
      if (head.includes('十二歲')) ok.push(`對練　年份有進去：${head}`);
      else errs.push('對練　選了年份，而標題沒有帶');
    }
  }
}

/* 四｜那一天（丙） */
{
  const r = await mount('那一天．丙', '../src/ui/day.js',
    (mod, app) => mod.mountDay(app, M, null, ()=>{}));
  if (r){
    const acts = r.app.querySelectorAll('[data-a]').length;
    if (!acts) errs.push('那一天．丙　沒有可以做的事');
    else {
      for (let i=0;i<14;i++){
        const b = r.app.querySelector('[data-a]') || r.app.querySelector('[data-d2]');
        if (!b) break;
        b.click();
      }
      const end = r.app.querySelector('#end');
      ok.push(`那一天．丙　跑到結局：${end && !end.hidden ? end.querySelector('.t')?.textContent : '（還沒結束）'}`);
    }
  }
}

/* 五｜那一天．界（甲） */
{
  const r = await mount('那一天．界', '../src/ui/jie.js',
    (mod, app) => mod.mountJie(app, M, null, ()=>{}));
  if (r){
    const codes = r.app.querySelectorAll('.code.on').length;
    if (codes !== 4) warns.push(`甲模式四碼只顯示 ${codes} 格`);
    else ok.push('甲模式　四碼一開始就全有');
    for (let i=0;i<12;i++){
      const b = r.app.querySelector('[data-a]') ||
                r.app.querySelector('[data-f]') || r.app.querySelector('[data-x]');
      if (!b) break; b.click();
    }
    const end = r.app.querySelector('#end');
    ok.push(`甲模式　跑到結局：${end && !end.hidden ? end.querySelector('.t')?.textContent : '（還沒結束）'}`);
  }
}

/* 六｜那一天．統籌（乙） */
{
  const r = await mount('那一天．統籌', '../src/ui/xue.js',
    (mod, app) => mod.mountXue(app, M, null, ()=>{}));
  if (r){
    const lv = r.app.querySelectorAll('.lv').length;
    if (lv !== 16) warns.push(`乙模式四碼選項有 ${lv} 個，應該 16 個`);
    else ok.push('乙模式　四碼 16 個選項都在');
    for (let round=0; round<3; round++){
      click(r.app,'#ok');
      const whos = r.app.querySelectorAll('[data-id]');
      if (whos[0]) whos[0].click();
      click(r.app,'#send');
      click(r.app,'#w');
      click(r.app,'#r');
    }
    const end = r.app.querySelector('#end');
    ok.push(`乙模式　跑完三件：${end && !end.hidden ? '有結局' : '（沒到結局）'}`);
  }
}

/* 七｜那些人知道的 */
{
  const r = await mount('那些人知道的', '../src/ui/knows.js',
    (mod, app) => mod.mountKnows(app, M, null, ()=>{}));
  if (r){
    await new Promise(res => setTimeout(res, 200));
    const people = r.app.querySelectorAll('[data-p]').length;
    if (people < 20) warns.push(`知識層只有 ${people} 個人`);
    else ok.push(`知識層　${people} 個人有邊`);
    /* ⚠ 而「被瞞的內容」絕對不能出現在畫面上 */
    const html = r.app.innerHTML;
    const E = JSON.parse(readFileSync(join(ROOT,'data/knowledge/secrets.json'),'utf8'));
    /* 切到一個「被瞞很多」的人，看內容有沒有漏 */
    const qz = [...r.app.querySelectorAll('[data-p]')].find(b=>b.dataset.p==='qiangzang');
    if (qz){ qz.click(); await new Promise(res=>setTimeout(res,120)); }
    const h2 = r.app.innerHTML;
    const leaked = E.one_way
      .filter(e => (e.unknown_to||[]).includes('qiangzang'))
      .filter(e => e.fact && h2.includes(e.fact));
    if (leaked.length)
      errs.push(`⚠⚠ 知識層漏出被瞞的內容：${leaked[0].fact}`);
    else ok.push('知識層　被瞞的內容沒有漏出來');
  }
}

/* ── 報告 ───────────────────────────── */
console.log('通過');
ok.forEach(x => console.log('  ✓ ' + x));
if (warns.length){ console.log('\n提醒'); warns.forEach(x => console.log('  ⚠ ' + x)); }
if (errs.length){ console.log('\n壞掉'); errs.forEach(x => console.log('  ✗ ' + x)); }
console.log(`\n${ok.length} 通過　${warns.length} 提醒　${errs.length} 壞掉`);
process.exit(errs.length ? 1 : 0);
