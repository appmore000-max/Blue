import { newDay, actions, step, fight, fallen, fmt,
         CODE, CODE_MEAN, POST, FIGHT, FALLEN, ENDING,
         CLOCK0, DEADLINE } from '../core/jierules.js';
import { logDay } from '../core/save.js';
import { wireBack } from './base.js';

const DIGIT = [
  { pos:1, asks:'對面是什麼' },
  { pos:2, asks:'裡面有沒有不該在的人' },
  { pos:3, asks:'有多少人會看到' },
  { pos:4, asks:'還有多久' },
];

export function mountJie(app, M, arg, back){
  let S = newDay(), shown = 0, logged = false;

  app.innerHTML = `
  <div class="day jie">
    <div class="bar"><button class="back" aria-label="回選單">←</button><span>那一天．界</span></div>
    <p class="lead">甲模式．同一個自建角色．四階下．<b>而他加入界了</b></p>

    <div class="statbar card" id="bar"></div>
    <div class="darkline"><div id="darkfill"></div></div>

    <div class="card order post">
      <div class="m mono">而 Line 群組上有一則貼文</div>
      <pre>${POST}</pre>
      <div class="m mono" style="margin-top:10px">而那則貼文全體成員都看得到</div>
    </div>

    <div class="sec">四碼</div>
    <div class="codes" id="codes"></div>
    <div id="codenote">而這一次四碼是給你的。<br>
      <b class="em">而你第一眼看的是第 2 碼。</b><br>因為那是這套系統裡唯一一個瓶頸。</div>

    <div class="sec" id="actsec">你可以做的</div>
    <div class="acts" id="acts"></div>

    <div id="log"></div><div id="end" hidden></div>
  </div>`;

  const $ = s => app.querySelector(s);
  wireBack(app, back);

  function draw(){
    $('#bar').innerHTML =
      `<span class="x">時間</span><b>${fmt(S.t)}</b>` +
      `<span class="x">存</span><b>${Math.max(0,S.cun)}/${S.cunMax}</b>` +
      `<span class="x">次</span><b>${Math.max(0,S.uses)}</b>` +
      `<span class="x">車錢</span><b>${S.money}</b>` +
      (S.wound ? `<span class="x">傷</span><b>${S.wound} 級</b>` : '');
    $('#darkfill').style.width =
      Math.min(100,(S.t-CLOCK0)/(DEADLINE-CLOCK0)*100) + '%';

    /* 四碼一開始就全有 —— 而那正是甲跟丙最大的差別 */
    $('#codes').innerHTML = DIGIT.map((d,i) => {
      const k='d'+(i+1), v=CODE[k];
      return `<div class="code on ${k==='d2'?'key':''}">
        <div class="n mono">第${d.pos}碼</div>
        <div class="v">${v}</div>
        <div class="q">${d.asks}</div></div>`;
    }).join('');

    const acts = $('#acts');
    const sec  = $('#actsec');
    if (S.await === 'fight'){
      sec.hidden=false; sec.textContent='而這一場';
      acts.innerHTML = FIGHT.filter(o => !o.needs || S.flags[o.needs]).map(o =>
        `<button class="btn" data-f="${o.id}">${o.label}<span class="nt">${o.note}</span></button>`).join('');
      acts.querySelectorAll('[data-f]').forEach(b =>
        b.onclick = () => { S = fight(S, b.dataset.f); draw(); });
    } else if (S.await === 'fallen'){
      sec.hidden=false; sec.textContent='而那裡有一個決定';
      acts.innerHTML = FALLEN.map(o =>
        `<button class="btn" data-x="${o.id}">${o.label}<span class="nt">${o.note}</span></button>`).join('');
      acts.querySelectorAll('[data-x]').forEach(b =>
        b.onclick = () => { S = fallen(S, b.dataset.x); draw(); });
    } else if (S.done){
      acts.innerHTML=''; sec.hidden=true;
    } else {
      sec.hidden=false; sec.textContent='你可以做的';
      const list = actions(S);
      acts.innerHTML = list.map(a =>
        `<button class="btn" data-a="${a.id}"><span>${a.label}${
          a.note?`<span class="nt">${a.note}</span>`:''}</span>
          <span class="c mono">${a.cost?'+'+a.cost+'分':''}</span></button>`).join('');
      acts.querySelectorAll('[data-a]').forEach(b =>
        b.onclick = () => { S = step(S, b.dataset.a); draw(); });
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
      if (!logged){ logDay({ mode:'jie', ending:S.ending, clock:fmt(S.t) }); logged=true; }
      const e = ENDING[S.ending], el = $('#end');
      el.hidden = false;
      el.innerHTML = `<div class="t">${e.t}</div><div class="s">${e.s}</div>
        <div class="r"><b>而甲跟丙最大的差別，不是四碼。</b><br>
        是你可以不接——<b>而 @ 名單上只有三個人。</b><br><br>
        ${e.tail}</div>
        <button class="btn again" id="again">再　一　次</button>`;
      $('#again').onclick = () => {
        S = newDay(); shown = 0; logged = false;
        $('#log').innerHTML = ''; el.hidden = true; draw();
        (window.scrollTo||function(){})({ top:0, behavior:'smooth' });
      };
      el.scrollIntoView?.({ behavior:'smooth', block:'nearest' });
    }
  }
  draw();
}
