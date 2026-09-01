import { loadRoster, loadWorld } from '../core/data.js';
import { sim, HARD, NO_WIN, GATE, GATE_LABEL, END_LABEL } from '../core/sim.js';
import { logSpar, known, setting, load as sv } from '../core/save.js';
import { wireBack } from './base.js';
import { startArena } from '../../3d/arena.js';

const CONDS = [
  ['sky','天色',['晴','陰']],
  ['time','時段',['日','夜']],
  ['terrain','地形',['室外','室內','狹窄']],
  ['cover','掩體',[true,false]],
];

export async function mountSpar(app, M, arg, back){
  app.innerHTML = `<div class="loading">載入角色</div>`;
  const R = await loadRoster(Object.keys(M.cast));
  const CHRON = (await loadWorld('chronology')).people || {};
  const ids = Object.keys(R);
  const cond = { sky:'晴', time:'日', terrain:'室外', cover:true };
  let a = ids.includes('zhang_zhenqi') ? 'zhang_zhenqi' : ids[0];
  let b = ids.includes('cheng_yijin')  ? 'cheng_yijin'  : ids[1];
  /* 年份。而選年份不是難度選擇 —— 那是不同的人 */
  const at = {};

  app.innerHTML = `
  <div class="spar">
    <div class="bar"><button class="back" aria-label="回選單">←</button><span>對練</span></div>
    <p class="lead">而輸贏不影響任何一件事。</p>

    <div class="sec">選人</div>
    <div class="pick">
      <div class="card side"><select id="pa"></select>
        <div class="years" id="ya"></div>
        <div class="stat" id="sa"></div><div class="warn" id="wa"></div></div>
      <div class="vs">對</div>
      <div class="card side"><select id="pb"></select>
        <div class="years" id="yb"></div>
        <div class="stat" id="sb"></div><div class="warn" id="wb"></div></div>
    </div>

    <div class="sec">條件</div>
    <div class="conds" id="conds"></div>

    <div class="sec">資訊</div>
    <div class="conds">
      <button class="btn c" id="mOpen">公開</button>
      <button class="btn c" id="mBlind">不對等</button>
    </div>
    <p class="blindnote" id="blindnote"></p>

    <button class="btn go" id="go">推　演</button>

    <div class="arena" id="arena" hidden>
      <div class="a3d" id="a3d"></div>
      <div class="anames">
        <span class="an a" id="anA">—</span>
        <span class="ac mono">對</span>
        <span class="an b" id="anB">—</span>
      </div>
      <div class="akeys mono">
        <span><i class="sw cun"></i>存</span>
        <span><i class="sw sta"></i>體</span>
        <span class="dimk">而存空了不是輸</span>
      </div>
      <div class="afeed" id="afeed"></div>
      <div class="actl">
        <button class="btn" id="aSkip">跳到結果</button>
      </div>
    </div>

    <div id="out"></div><div id="end" hidden></div>
    <div id="rec"></div>
  </div>`;

  const $ = s => app.querySelector(s);
  wireBack(app, back);

  const fill = (sel, def) => {
    sel.innerHTML = ids.map(id => `<option value="${id}">${R[id].name}</option>`).join('');
    sel.value = def;
  };
  fill($('#pa'), a); fill($('#pb'), b);

  function conds(){
    $('#conds').innerHTML = CONDS.flatMap(([k,, opts]) =>
      opts.map(o => `<button class="btn c" data-k="${k}" data-v="${o}"
        aria-pressed="${cond[k]===o}">${k==='cover' ? (o?'有掩體':'沒有掩體') : o}</button>`)
    ).join('');
    $('#conds').querySelectorAll('[data-k]').forEach(el => el.onclick = () => {
      const v = el.dataset.v;
      cond[el.dataset.k] = v==='true' ? true : v==='false' ? false : v;
      conds(); info();
    });
  }

  function modes(){
    const bl = setting('blind');
    $('#mOpen').setAttribute('aria-pressed', String(!bl));
    $('#mBlind').setAttribute('aria-pressed', String(bl));
    $('#blindnote').innerHTML = bl
      ? '你只看得到自己的。<br>而對方的東西，<b>你要打過才知道。</b>'
      : '兩邊的東西都看得到。而那是一個沙盒該有的樣子。';
  }
  $('#mOpen').onclick  = () => { setting('blind', false); modes(); info(); };
  $('#mBlind').onclick = () => { setting('blind', true);  modes(); info(); };

  function years(){
    [[a,'#ya'],[b,'#yb']].forEach(([id, sel]) => {
      const P = CHRON[id];
      if (!P){ $(sel).innerHTML=''; return; }
      $(sel).innerHTML = P.ages.map(y =>
        `<button class="btn yr" data-i="${id}" data-a="${y.age}"
          aria-pressed="${(at[id]?.age ?? P.ages.find(x=>x.current)?.age) === y.age}"
        >${y.label}</button>`).join('');
      $(sel).querySelectorAll('[data-a]').forEach(btn => btn.onclick = () => {
        const P2 = CHRON[btn.dataset.i];
        const y = P2.ages.find(x => x.age === +btn.dataset.a);
        if (y.current) delete at[btn.dataset.i]; else at[btn.dataset.i] = y;
        years(); info();
      });
    });
  }

  function info(){
    a = $('#pa').value; b = $('#pb').value;
    const blind = setting('blind');
    /* ⚠ 不對等：你只看得到自己的。而「自己的」＝左邊那一個 */
    [[a,'#sa','#wa',false],[b,'#sb','#wb',true]].forEach(([id, s, w, isFoe]) => {
      const c = R[id];
      const y = at[id];
      const hide = blind && isFoe && !known(id);
      if (hide){
        $(s).innerHTML = `存 <b>—</b>　體 <b>—</b>　招 <b>—</b>`
          + (y ? `<br>　${y.age} 歲（${y.year}）` : (c.age ? `<br>　${c.age} 歲` : ''));
        $(w).innerHTML = '<b>而你不知道他會什麼。</b>';
        return;
      }
      $(s).innerHTML = `存 <b>${(y?.cun ?? c.cun) ?? '—'}</b>　體 <b>${(y?.sta ?? c.sta) ?? '—'}</b>　招 <b>${
        y?.abilities != null ? y.abilities : c.ab.length}</b>`
        + (c.h ? `<br>${c.h} / ${c.w}` : '')
        + (y ? `　${y.age} 歲（${y.year}）` : (c.age ? `　${c.age} 歲` : ''))
        + (blind && isFoe ? '<br><i class="mono kn">你打過他了</i>' : '');
      const h = HARD[id] || {};
      const bits = Object.values(h).filter(v => typeof v === 'string' && v);
      if (NO_WIN.includes(id)) bits.unshift('不能贏，而很難結束');
      if (y){ bits.unshift(y['⚠'] || y.note || ''); }
      $(w).innerHTML = bits.filter(Boolean).slice(0,2).join('<br>');
    });
    const same = a === b;
    $('#go').disabled = same;
    $('#go').textContent = same ? '不能挑自己' : '推　演';
  }
  $('#pa').onchange = () => { a=$('#pa').value; delete at[a]; years(); info(); };
  $('#pb').onchange = () => { b=$('#pb').value; delete at[b]; years(); info(); };

  /* 而唯一會留下來的東西。而它沒有排名 —— 它就只是一份清單 */
  function rec(){
    const list = sv().spar;
    if (!list.length){ $('#rec').innerHTML=''; return; }
    const nm = id => R[id]?.name || id;
    const yr = (r,id) => r.years?.[id] ? `（${r.years[id]}歲）` : '';
    $('#rec').innerHTML = `
      <div class="sec">紀錄</div>
      <div class="recs">
        ${list.slice(0,14).map(r => `
          <div class="rc">
            <span class="w">${nm(r.a)}${yr(r,r.a)}　對　${nm(r.b)}${yr(r,r.b)}</span>
            <span class="c mono">${r.cond.sky}${r.cond.time}${r.cond.terrain}${
              r.cond.cover?'':'．無掩體'}${r.blind?'．不對等':''}</span>
            <span class="e">${END_LABEL[r.end]}${r.winner?`／${nm(r.winner)}`:''}</span>
          </div>`).join('')}
      </div>
      <p class="recnote">而它沒有排名。<b>它就只是一份清單。</b></p>`;
  }

  let wasBlindLast = false;

  /* 結果 */
  function finish(r, RR){
    let gate = '';
    if (r.winner){
      const g = GATE[r.winner];
      const all = ['release','subdue','cripple','kill','leave'];
      const can = g ? g.can : all;
      gate = `<div class="gate"><div class="k">而 ${RR[r.winner].name} 那一秒能選的</div>
        <div class="chips">${all.map(k =>
          `<span class="chip ${can.includes(k)?'on':'off'}">${GATE_LABEL[k]}</span>`).join('')}
          ${can.includes('stop_it')?`<span class="chip on">${GATE_LABEL.stop_it}</span>`:''}</div>
        ${g?`<div class="gnote">${g.note}</div>`:''}
        <div class="gnote">而這裡沒有第四格。對練場不能殺。</div></div>`;
    }
    const el = $('#end');
    el.hidden = false;
    el.innerHTML = `<div class="k">結束條件</div><div class="v">${END_LABEL[r.end]}</div>
      <div class="t">${r.tail}</div>
      ${r.line?`<div class="t em">${r.line}</div>`:''}
      ${wasBlindLast ? `<div class="knew">你現在知道他會什麼了。</div>` : ''}${gate}
      <div class="rule"><b>而打完之後兩邊都回到原本的狀態。</b><br>
      不記錄。不排名。沒有獎勵。<br>
      華邦那三次在這裡不算。阿仁那個上限不會再少。</div>`;
    /* 全文留在下面，可以往回看 */
    $('#out').innerHTML = r.L.map((x,i) =>
      `<div class="line ${x.s||''}" style="animation-delay:${i*12}ms">${x.t}</div>`).join('');
    info(); rec();
    el.scrollIntoView?.({ behavior:'smooth', block:'nearest' });
  }

  /* ── 播 ─────────────────────────
     而它一行一行跑。因為那一行對應場上的一個動作。 */
  let arena = null, timer = 0, lastR = null, lastRoster = null;

  function play(r, RR, aId, bId){
    const wrap = $('#arena');
    wrap.hidden = false;
    $('#anA').textContent = RR[aId].name;
    $('#anB').textContent = RR[bId].name;
    $('#afeed').innerHTML = '';
    $('#out').innerHTML = '';
    $('#end').hidden = true;

    if (!arena){
      try { arena = startArena($('#a3d')); }
      catch (err){
        $('#a3d').innerHTML =
          `<div class="err"><b>畫不出來。</b><p class="dim">這一段需要 WebGL。</p></div>`;
      }
    }
    arena && arena.reset();

    let i = 0;
    clearInterval(timer);
    const feed = $('#afeed');
    const step = () => {
      if (i >= r.L.length){ clearInterval(timer); finish(r, RR); return; }
      const x = r.L[i++];
      if (x.s !== 'gap'){
        const d = document.createElement('div');
        d.className = 'fl ' + (x.s || '');
        d.textContent = x.t;
        feed.appendChild(d);
        while (feed.children.length > 5) feed.removeChild(feed.firstChild);
      }
      if (arena){
        if (x.at){ arena.set('a', x.at.a.cun, x.at.a.sta);
                   arena.set('b', x.at.b.cun, x.at.b.sta); }
        if (x.side) arena.beat(x.side);
        if (x.down) arena.down(x.down);
        if (x.halt) arena.stop(x.halt);
      }
    };
    timer = setInterval(step, 420);
    step();
  }

  $('#aSkip').onclick = () => {
    clearInterval(timer);
    if (lastR) finish(lastR, lastRoster);
  };

  $('#go').onclick = () => {
    if (a === b) return;
    const r = sim(R, a, b, { ...cond }, 40, Object.keys(at).length ? at : null);
    wasBlindLast = setting('blind') && !known(b);
    logSpar({ a, b, cond:{...cond}, blind: setting('blind'),
      years:{ [a]:at[a]?.age ?? null, [b]:at[b]?.age ?? null },
      end:r.end, winner:r.winner });
    lastR = r; lastRoster = R;
    play(r, R, a, b);
  };

  /* ⚠ 有些環境沒有 MutationObserver。而沒有防守的話整頁會炸。 */
  const obs = typeof MutationObserver !== 'undefined' ? new MutationObserver(() => {
    if (!app.querySelector('.spar')){
      clearInterval(timer); arena && arena.stop3d(); obs && obs.disconnect();
    }
  }) : null;
  obs && obs.observe(app, { childList:true });

  conds(); years(); modes(); info(); rec();
}
