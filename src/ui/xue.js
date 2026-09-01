import { newDay, grade, pick, wait, report, fmt,
         DIGIT, ROSTER, ENDING, CLOCK0 } from '../core/xuerules.js';
import { logDay } from '../core/save.js';
import { wireBack } from './base.js';

export function mountXue(app, M, arg, back){
  let S = newDay(), shown = 0, logged = false;
  let draft = { d1:0, d2:0, d3:0, d4:0 };
  let chosen = new Set();

  app.innerHTML = `
  <div class="day xue">
    <div class="bar"><button class="back" aria-label="回選單">←</button><span>那一天．統籌</span></div>
    <p class="lead">乙模式．林雪芸．<b>而這一段的玩法不是戰鬥</b></p>

    <div class="statbar card" id="bar"></div>

    <div class="card order case" id="case"></div>

    <div class="sec" id="phasesec">你給四碼</div>
    <div id="stage"></div>

    <div id="log"></div><div id="end" hidden></div>
  </div>`;

  const $ = s => app.querySelector(s);
  wireBack(app, back);

  function draw(){
    const c = S.cases[S.i];
    $('#bar').innerHTML =
      `<span class="x">時間</span><b>${fmt(S.t)}</b>` +
      `<span class="x">今天</span><b>${Math.min(S.i+1,S.cases.length)} / ${S.cases.length}</b>` +
      `<span class="x">本子</span><b>${S.book.length}</b>` +
      (S.stomach ? `<span class="x">胃</span><b>${S.stomach}</b>` : '');

    $('#case').innerHTML = S.done ? '' : `
      <div class="m mono">而通報進來的是這個</div>
      <div class="said">${c.said}</div>
      <div class="intake mono">【${c.intake.d1}${c.intake.d2}${c.intake.d3}${c.intake.d4}】${c.where}</div>
      <div class="m mono" style="margin-top:8px">${c.hint}</div>`;

    const st = $('#stage'), sec = $('#phasesec');

    if (S.done){ st.innerHTML=''; sec.hidden=true; $('#case').hidden=true; }

    else if (S.phase === 'grade'){
      sec.hidden=false; sec.textContent='你給四碼';
      draft = { ...c.intake };
      st.innerHTML = `
        <div class="grade">
          ${DIGIT.map((d,i)=>{
            const k='d'+(i+1);
            return `<div class="grow ${d.bottleneck?'key':''}">
              <div class="gh"><b>第${d.pos}碼</b><span>${d.asks}</span>
                ${d.bottleneck?'<i class="mono">瓶頸</i>':''}</div>
              <div class="glv" data-k="${k}">
                ${d.lv.map((L,v)=>`<button class="btn lv" data-v="${v}"
                  aria-pressed="${draft[k]===v}"><b>${v}</b>${L}</button>`).join('')}
              </div>
              <div class="gd mono">→ ${d.decides}</div>
            </div>`;
          }).join('')}
          <button class="btn go" id="ok">送出四碼</button>
        </div>`;
      st.querySelectorAll('.glv').forEach(row => {
        const k = row.dataset.k;
        row.querySelectorAll('[data-v]').forEach(b => b.onclick = () => {
          draft[k] = +b.dataset.v;
          row.querySelectorAll('[data-v]').forEach(x =>
            x.setAttribute('aria-pressed', String(+x.dataset.v === draft[k])));
        });
      });
      $('#ok').onclick = () => { S = grade(S, draft); draw(); };
    }

    else if (S.phase === 'pick'){
      sec.hidden=false; sec.textContent='你挑人';
      chosen = new Set();
      st.innerHTML = `
        <p class="picknote">而你挑了誰，也就是你決定了誰不去。</p>
        <div class="roster">
          ${ROSTER.map(r => `
            <button class="btn who ${r.block?'blocked':''}" data-id="${r.id}"
              ${r.block?'disabled':''} aria-pressed="false">
              <span class="n"><b>${r.name}</b><i class="mono">${r.tier}　${r.role}</i></span>
              <span class="bk">${r.book.filter(x=>x!=='—').join('　·　')}</span>
              ${r.block?`<span class="blk mono">${r.block}．你劃掉了</span>`:''}
            </button>`).join('')}
        </div>
        <button class="btn go" id="send" disabled>派出去</button>`;
      st.querySelectorAll('[data-id]').forEach(b => b.onclick = () => {
        const id = b.dataset.id;
        chosen.has(id) ? chosen.delete(id) : chosen.add(id);
        b.setAttribute('aria-pressed', String(chosen.has(id)));
        $('#send').disabled = chosen.size === 0;
        $('#send').textContent = chosen.size ? `派出去（${chosen.size}）` : '派出去';
      });
      $('#send').onclick = () => { S = pick(S, [...chosen]); draw(); };
    }

    else if (S.phase === 'wait'){
      sec.hidden=false; sec.textContent='而接下來';
      st.innerHTML = `<button class="btn go" id="w">等</button>`;
      $('#w').onclick = () => { S = wait(S); draw(); };
    }

    else if (S.phase === 'report'){
      sec.hidden=false; sec.textContent='回報';
      st.innerHTML = `<button class="btn go" id="r">讀</button>`;
      $('#r').onclick = () => { S = report(S); draw(); };
    }

    const lg = $('#log');
    for (let i = shown; i < S.log.length; i++){
      const x = S.log[i], d = document.createElement('div');
      d.className = 'l ' + (x.s || '');
      d.innerHTML = x.s === 'gap' ? '' :
        `<div class="ck mono">${x.clock}</div><div class="tx">${x.t}</div>`;
      d.style.animationDelay = ((i-shown)*40) + 'ms';
      lg.appendChild(d);
    }
    shown = S.log.length;

    if (S.done){
      if (!logged){ logDay({ mode:'xue', book:S.book.length, stomach:S.stomach }); logged=true; }
      const el = $('#end'); el.hidden = false;
      el.innerHTML = `<div class="t">${ENDING.t}</div>
        <div class="s">${ENDING.lines.join('<br>')}</div>
        ${S.book.length ? `<div class="gate"><div class="k">而本子上今天多了</div>
          <div class="chips">${S.book.map(n=>`<span class="chip on">${n}</span>`).join('')}</div>
          <div class="gnote">而那不是劃掉。是抄進去。</div></div>` : ''}
        <div class="r">${ENDING.tail}</div>
        <button class="btn again" id="again">再　一　次</button>`;
      $('#again').onclick = () => {
        S = newDay(); shown = 0; logged = false;
        $('#log').innerHTML=''; el.hidden=true; $('#case').hidden=false; draw();
        (window.scrollTo||function(){})({top:0,behavior:'smooth'});
      };
      el.scrollIntoView?.({behavior:'smooth',block:'nearest'});
    }
  }
  draw();
}
