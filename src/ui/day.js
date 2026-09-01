import { newDay, actions, step, chooseD2, fmt,
         DIGIT, D2, ENDING, PLACES, CLOCK0, DARK } from '../core/dayrules.js';
import { logDay } from '../core/save.js';
import { wireBack } from './base.js';

export function mountDay(app, M, arg, back){
  let S = newDay(), shown = 0, logged = false;

  app.innerHTML = `
  <div class="day">
    <div class="bar"><button class="back" aria-label="回選單">←</button><span>那一天</span></div>
    <p class="lead">丙模式．自建角色．四階下．不隸屬任何組織</p>

    <div class="statbar card" id="bar"></div>
    <div class="darkline"><div id="darkfill"></div></div>

    <div class="card order">
      <div class="m mono">而手機上有一則訊息</div>
      苗栗。山區。<br>一個東西。要處理掉。<br>今天。天黑之前。<br>12,000
    </div>

    <div class="sec">四碼</div>
    <div class="codes" id="codes"></div>
    <div id="codenote"></div>

    <div class="sec" id="actsec">你可以做的</div>
    <div class="acts" id="acts"></div>

    <div id="log"></div><div id="end" hidden></div>
  </div>`;

  const $ = s => app.querySelector(s);
  wireBack(app, back);

  function draw(){
    $('#bar').innerHTML =
      `<span class="x">時間</span><b>${fmt(S.t)}</b>` +
      `<span class="x">地點</span><b>${PLACES[S.at].name}</b>` +
      `<span class="x">錢</span><b>${S.money.toLocaleString()}</b>` +
      `<span class="x">存</span><b>${S.cun}/${S.cunMax}</b>` +
      `<span class="x">體</span><b>${S.sta}/${S.staMax}</b>`;
    $('#darkfill').style.width =
      Math.min(100,(S.t-CLOCK0)/(DARK-CLOCK0)*100) + '%';

    $('#codes').innerHTML = DIGIT.map((d,i) => {
      const v = S.known['d'+(i+1)];
      return `<div class="code ${v!==null?'on':''}">
        <div class="n mono">第${d.pos}碼</div>
        <div class="v">${v===null?'—':v}</div>
        <div class="q">${d.asks}</div></div>`;
    }).join('');
    const blind = Object.values(S.known).filter(v => v===null).length;
    $('#codenote').innerHTML = blind===4
      ? '<b class="em">而你一格都沒有。</b><br>界的人會拿到四碼。而你拿到的是一行字。'
      : blind===0 ? '而你四格都有了。<br>而界那邊，那是林雪芸排班前就有的東西。'
      : `而你還有 ${blind} 格是空的。`;

    const acts = $('#acts');
    if (S.await === 'd2'){
      $('#actsec').hidden = false; $('#actsec').textContent = '而你那一秒要決定的';
      acts.innerHTML = D2.map(o =>
        `<button class="btn" data-d2="${o.id}">${o.label}<span class="nt">${o.note}</span></button>`).join('');
      acts.querySelectorAll('[data-d2]').forEach(b =>
        b.onclick = () => { S = chooseD2(S, b.dataset.d2); draw(); });
    } else if (S.done){
      acts.innerHTML = ''; $('#actsec').hidden = true;
    } else {
      $('#actsec').hidden = false; $('#actsec').textContent = '你可以做的';
      acts.innerHTML = actions(S).map(a =>
        `<button class="btn" data-a="${a.id}"><span>${a.label}${
          a.note?`<span class="nt">${a.note}</span>`:''}</span>
          <span class="c mono">${a.cost?'+'+a.cost+'分':''}${a.money?'　'+a.money:''}</span>
        </button>`).join('');
      acts.querySelectorAll('[data-a]').forEach(b =>
        b.onclick = () => { S = step(S, b.dataset.a); draw(); });
    }

    const lg = $('#log');
    for (let i = shown; i < S.log.length; i++){
      const x = S.log[i], d = document.createElement('div');
      d.className = 'l ' + (x.s || '');
      d.innerHTML = x.s === 'gap' ? '' :
        `<div class="ck mono">${x.clock}</div><div class="tx">${x.t}</div>`;
      d.style.animationDelay = ((i - shown) * 40) + 'ms';
      lg.appendChild(d);
    }
    shown = S.log.length;

    if (S.done){
      if (!logged){ logDay({ ending:S.ending, clock:fmt(S.t), money:S.money }); logged = true; }
      const e = ENDING[S.ending], el = $('#end');
      el.hidden = false;
      el.innerHTML = `<div class="t">${e.t}</div><div class="s">${e.s}</div>
        <div class="r"><b>而這一天要測的是四碼在玩家手上沒有的時候會怎樣。</b><br>
        而界的人拿到的是四個數字。<br>而丙模式拿到的是一行字，跟一個天黑之前。<br><br>
        <b>而第 2 碼是到了才知道的。</b><br>而那正是界那邊改最多次的一碼。</div>
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
