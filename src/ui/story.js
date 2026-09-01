import { loadScript } from '../core/data.js';
import { plateFor } from '../core/labels.js';
import { markRead, markFinished, setting, load as sv } from '../core/save.js';
import { topbar, wireBack } from './base.js';

/* ⚠ 劇本檔裡的 t 是全名（"speech"）。
   而做原型的時候內嵌資料用的是縮寫（"s"）—— 所以這裡兩種都要收。
   對不上的話 type 會是 undefined，而名牌永遠不會亮。 */
const T = {
  n:'narration', e:'emphasis', s:'speech', q:'quote', h:'section', c:'screen',
  narration:'narration', emphasis:'emphasis', speech:'speech',
  quote:'quote', section:'section', screen:'screen',
};
/* ⚠ 有些環境沒有 matchMedia。而沒有防守的話，整個畫面會全白。 */
const reduced = (() => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
})();

const COL = {
  '01':'一｜那一夜，以及之後','10':'二｜他們以為那是不給','13':'三｜沒有人問',
  '16':'四｜那一年','19':'五｜而他們什麼都沒有','24':'六｜而那是他守的東西',
  '27':'七｜那些年','33':'八｜那三個東西','36':'九｜首爾與潮州',
  '40':'十｜而他們找到了他','長篇':'長篇｜越來越慢',
};
function colOf(id){
  if (id.startsWith('長篇')) return '長篇｜越來越慢';
  const n = +id.slice(0,2);
  if (n<=9) return COL['01']; if (n<=12) return COL['10']; if (n<=15) return COL['13'];
  if (n<=18) return COL['16']; if (n<=23) return COL['19']; if (n<=26) return COL['24'];
  if (n<=32) return COL['27']; if (n<=35) return COL['33']; if (n<=39) return COL['36'];
  if (n<=43) return COL['40'];
  return '十一｜剩下的';
}

export async function mountStory(app, M, arg, back){
  if (arg) return reader(app, M, arg, back);
  list(app, M, back);
}

/* ── 目次 ─────────────────────────── */
function list(app, M, back){
  const s = sv();
  const groups = {};
  M.scripts.forEach(x => (groups[colOf(x.id)] ||= []).push(x));

  app.innerHTML = topbar('那些事') + `<div class="story-list">
    <p class="lead">而這一百二十五篇沒有一篇是主線。<br>它們就是一些發生過的事。</p>
    ${Object.entries(groups).map(([g, items]) => `
      <div class="sec">${g}</div>
      <div class="items">
        ${items.map(x => {
          const done = s.finished.includes(x.id);
          const at = s.read[x.id];
          return `<button class="btn item" data-id="${x.id}">
            <b>${x.title || x.id}</b>
            <span class="nt">${M.cast[x.pov] || (x.pov ?? '多視角')}　${x.boxes} 框${
              done ? '　· 讀完' : at ? `　· ${Math.round(at/x.boxes*100)}%` : ''}</span>
          </button>`;
        }).join('')}
      </div>`).join('')}
  </div>`;

  wireBack(app, back);
  app.querySelectorAll('[data-id]').forEach(b =>
    b.onclick = () => location.hash = `story/${encodeURIComponent(b.dataset.id)}`);
}

/* ── 讀 ───────────────────────────── */
async function reader(app, M, id, back){
  let D;
  try { D = await loadScript(id); }
  catch (e){
    /* ⚠ 而這裡以前是靜靜地退回目次。而那讓一個 decode 的 bug 藏了很久 */
    console.error('讀不到劇本：', id, e);
    app.innerHTML = `<div class="err"><b>讀不到這一篇。</b>
      <pre>${id}</pre><p class="dim">${e.message}</p>
      <button class="btn" id="toList">回目次</button></div>`;
    app.querySelector('#toList').onclick = () => { location.hash='story'; list(app,M,back); };
    return;
  }

  const meta = M.scripts.find(x => x.id === id) || {};
  const rule = D['⚠_label_rule'] || {};
  const pov  = D.pov;
  const B    = D.boxes;

  app.innerHTML = `
  <div class="reader">
    <div class="bar">
      <button class="back" aria-label="回目次">←</button>
      <span id="who">${M.cast[pov] || '　'}　視角</span>
      <button class="ctl" id="bSkip" aria-label="長按跳過">⏭
        <svg id="ring" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14"/></svg></button>
      <button class="ctl" id="bAuto" aria-pressed="false" aria-label="自動">▶</button>
      <button class="ctl" id="bSet" aria-label="設定">⚙</button>
    </div>

    <div class="figure"><div id="slot"><i id="slotKey">—</i><em>立繪位</em></div></div>

    <div class="panel">
      <div id="plate"></div>
      <div class="textwrap">
        <div id="er"><span></span></div>
        <div id="text"></div>
      </div>
      <div id="pause"></div>
      <div class="foot"><span id="count" class="mono"></span><span id="next">▾</span></div>
    </div>
    <div id="tap"></div>

    <div id="sheet" hidden>
      <h2>設定</h2>
      <div class="row"><label for="sp">逐字速度</label>
        <input type="range" id="sp" min="8" max="80" step="2"><output id="spv"></output></div>
      <div class="row"><label for="au">自動間隔</label>
        <input type="range" id="au" min="400" max="3000" step="100"><output id="auv"></output></div>
      <p class="note">名牌跟視角走。這一篇的視角是 <b>${M.cast[pov]||pov||'多視角'}</b>。${
        rule['⚠'] ? '<br>' + rule['⚠'] : ''}</p>
      <button class="btn" id="close">關閉</button>
    </div>
  </div>`;

  const $ = s => app.querySelector(s);
  const el = { plate:$('#plate'), er:$('#er'), erS:$('#er span'), text:$('#text'),
    pause:$('#pause'), count:$('#count'), next:$('#next'), slot:$('#slot'),
    slotKey:$('#slotKey'), ring:$('#ring circle'), sheet:$('#sheet') };

  const st = { i:-1, typing:false, pausing:false, raf:0, autoT:0, pauseT:0, auto:false,
    speed: setting('speed'), hold: setting('hold') };

  wireBack(app, () => list(app, M, back));
  $('.back').onclick = () => { location.hash = 'story'; list(app, M, back); };

  function show(i){
    clearTimeout(st.autoT); clearTimeout(st.pauseT); cancelAnimationFrame(st.raf);
    if (i >= B.length){ el.next.classList.remove('on'); markFinished(id); return; }
    st.i = i;
    markRead(id, i);
    const b = B[i], type = T[b.t], txt = b.text, p = b.pause_before, who = b.who;

    el.count.textContent = String(i+1).padStart(3,'0') + ' / ' + B.length;
    el.next.classList.remove('on');

    if (type === 'speech'){
      el.plate.textContent = plateFor(who, pov, rule);
      el.plate.classList.add('on');
      el.slotKey.textContent = who || '—';
      el.slot.classList.add('on');
    } else { el.plate.classList.remove('on'); el.slot.classList.remove('on'); }

    /* 懸掛的「而」—— 這本書的心跳 */
    let body = txt, hang = '';
    if (type !== 'speech' && type !== 'screen' && txt.startsWith('而')){ hang='而'; body=txt.slice(1); }
    el.erS.textContent = hang;
    el.er.classList.toggle('on', !!hang);
    el.text.className = type;

    const ms = p===0?0 : p===1?300 : p===2?600 : 1000;
    if (ms && !reduced){
      el.pause.classList.add('run');
      el.pause.style.transition='none'; el.pause.style.width='0';
      requestAnimationFrame(()=>{
        el.pause.style.transition=`width ${ms}ms linear`;
        el.pause.style.width = Math.min(100, 24 + p*22) + '%';
      });
      st.pausing = true;
      st.pauseT = setTimeout(()=>{
        st.pausing = false;
        el.pause.classList.remove('run'); run(type, body);
      }, ms);
    } else {
      st.pausing = false;
      el.pause.classList.remove('run'); el.pause.style.width='0'; run(type, body);
    }
  }

  function run(type, body){
    if (type==='quote' || type==='screen' || reduced){
      el.text.textContent = body; el.text.classList.add('done'); finish(type); return;
    }
    st.typing = true;
    el.text.classList.remove('done'); el.text.textContent='';
    const caret = document.createElement('i'); caret.id='caret'; el.text.appendChild(caret);
    const per = st.speed * (type==='emphasis' ? 1.3 : 1);   /* 強調慢 30% */
    let n=0, last=performance.now(), acc=0;
    const step = now => {
      acc += now-last; last=now;
      while (acc>=per && n<body.length){ acc-=per; n++; }
      caret.insertAdjacentText('beforebegin', body.slice(el.text.textContent.length, n));
      if (n<body.length) st.raf = requestAnimationFrame(step);
      else { st.typing=false; el.text.classList.add('done'); finish(type); }
    };
    st.raf = requestAnimationFrame(step);
  }

  function finish(type){
    st.typing = false;
    el.next.classList.add('on');
    if (type === 'section'){ st.autoT = setTimeout(()=>show(st.i+1), 900); return; }
    if (st.auto){
      const extra = type==='emphasis' ? 400 : 0;   /* 強調多停 0.4 秒 */
      st.autoT = setTimeout(()=>show(st.i+1), st.hold + extra);
    }
  }

  function complete(){
    cancelAnimationFrame(st.raf); clearTimeout(st.pauseT);
    st.pausing = false;
    el.pause.classList.remove('run'); el.pause.style.width='0';
    const b = B[st.i]; if (!b) return;
    const type = T[b.t]; let body = b.text;
    if (type!=='speech' && type!=='screen' && body.startsWith('而')) body = body.slice(1);
    el.text.textContent = body; st.typing=false; el.text.classList.add('done'); finish(type);
  }

  $('#tap').onclick = () => {
    if (st.auto){ setAuto(false); return; }
    /* ⚠ 停頓期間也算「還在跑」。
       否則連點會把整框跳過去 —— 而那一框的字一個都沒有出現過。 */
    (st.typing || st.pausing) ? complete() : show(st.i+1);
  };
  function setAuto(on){
    st.auto = on; $('#bAuto').setAttribute('aria-pressed', String(on));
    clearTimeout(st.autoT); if (on && !st.typing) show(st.i+1);
  }
  $('#bAuto').onclick = e => { e.stopPropagation(); setAuto(!st.auto); };

  /* 跳過要長按。而一個誤觸跳過整段劇情的人，不會再回來讀 */
  let hT=0, hS=0, hR=0; const HOLD=700;
  const sk = $('#bSkip');
  sk.addEventListener('pointerdown', e => {
    e.stopPropagation(); e.preventDefault(); hS = performance.now();
    const tick = () => {
      const p = Math.min(1,(performance.now()-hS)/HOLD);
      el.ring.style.strokeDashoffset = String(88*(1-p));
      if (p<1) hR = requestAnimationFrame(tick);
    };
    hR = requestAnimationFrame(tick);
    hT = setTimeout(()=>{ end(); show(B.length-1); }, HOLD);
  });
  const end = () => { clearTimeout(hT); cancelAnimationFrame(hR); el.ring.style.strokeDashoffset='88'; };
  ['pointerup','pointerleave','pointercancel'].forEach(t => sk.addEventListener(t, end));

  const sp=$('#sp'), spv=$('#spv'), au=$('#au'), auv=$('#auv');
  sp.value=st.speed; spv.textContent=st.speed+' ms';
  au.value=st.hold;  auv.textContent=(st.hold/1000).toFixed(1)+' s';
  sp.oninput = () => { st.speed=+sp.value; spv.textContent=sp.value+' ms'; setting('speed',+sp.value); };
  au.oninput = () => { st.hold =+au.value; auv.textContent=(au.value/1000).toFixed(1)+' s'; setting('hold',+au.value); };
  $('#bSet').onclick = e => { e.stopPropagation(); el.sheet.hidden=false;
    requestAnimationFrame(()=>el.sheet.classList.add('on')); };
  $('#close').onclick = e => { e.stopPropagation(); el.sheet.classList.remove('on');
    setTimeout(()=>el.sheet.hidden=true,300); };
  el.sheet.onclick = e => e.stopPropagation();

  /* ⚠ 鍵盤監聽要能被移除。
     否則每進一次讀的畫面就多掛一個，而一個按鍵會前進好幾框。 */
  if (reader._key) removeEventListener('keydown', reader._key);
  reader._key = k => {
    if (!document.body.contains(el.text)){
      removeEventListener('keydown', reader._key); reader._key = null; return;
    }
    if (k.key===' '||k.key==='Enter'||k.key==='ArrowRight'){ k.preventDefault(); $('#tap').click(); }
    if (k.key==='ArrowLeft'){ k.preventDefault(); show(Math.max(0, st.i-1)); }
  };
  addEventListener('keydown', reader._key);

  show(sv().read[id] ?? 0);
}
