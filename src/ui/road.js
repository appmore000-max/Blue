import { wireBack } from './base.js';
import { CIRCLE, ROAD } from '../../3d/road.js';
import { start } from '../../3d/walk.js';

export function mountRoad(app, M, arg, back){
  app.innerHTML = `
  <div class="road">
    <div id="view"></div>

    <div class="bar road-bar">
      <button class="back" aria-label="回選單">←</button>
      <span>那條路</span>
      <button class="ctl" id="bInfo" aria-label="說明">ⓘ</button>
    </div>

    <div class="hud">
      <div class="hl" id="hDay">—</div>
      <div class="hl" id="hWalk">—</div>
      <div class="hl" id="hSec">—</div>
    </div>

    <div class="stand" id="stand"></div>
    <div class="count" id="count"></div>

    <div class="pad">
      <div id="stick"><i></i></div>
      <button class="markbtn" id="bMark">數</button>
    </div>

    <div class="daybar"><div class="days" id="days"></div></div>

    <div class="note-card" id="noteCard"></div>

    <div class="info" id="info" hidden>
      <div class="ib">
        <h3>那條路</h3>
        <p>而這條路是書裡那一條。</p>
        <p><b>一公里。三分之二的地方柏油變成碎石。而空地二十幾公尺見方。</b></p>
        <p>而他走那一公里要十四分鐘。<br>所以這裡能走路的速度也是。</p>
        <p class="k"><b>WASD</b> 走　<b>拖曳</b> 看　<b>Shift</b> 快一點<br>
           而「快一點」不是跑——因為他不跑。</p>
        <p class="k">到了空地，<b>空白鍵</b>（或按「數」）。<br>一下一圈。第一下是起點，不算。</p>
        <button class="btn" id="ibClose">關閉</button>
      </div>
    </div>
  </div>`;

  wireBack(app, back);
  const $ = s => app.querySelector(s);

  /* 而那一頁是他寫的 */
  function onMarkDone(n){
    const card = $('#noteCard');
    card.classList.add('on');
    card.innerHTML = `
      <div class="pg">
        <div class="ln mono">${n.day}</div>
        <div class="ln big mono">${n.counts.join(' / ')}</div>
        ${n.steady
          ? `<div class="ln">而那個數字很穩。</div>`
          : `<div class="ln em">而那三次不一樣。</div>
             <div class="ln dim">而他這輩子數過的東西，沒有一次數錯過。</div>`}
        ${n.off === 0 ? ''
          : `<div class="ln dim">（那個東西實際是 ${n.truth} 秒。而你差了 ${n.off}）</div>`}
      </div>
      <button class="btn again" id="again">再數一次</button>`;
    card.querySelector('#again').onclick = () => {
      card.classList.remove('on'); sim.clearNote();
    };
  }

  let sim = null;
  try {
    sim = start($('#view'), {
      onTick: s => {
        $('#hDay').textContent  = s.day;
        $('#hWalk').textContent = `${Math.round(s.walked)} / ${ROAD.length} m`;
        $('#hSec').textContent  = s.near
          ? (s.counting ? `${s.elapsed.toFixed(1)} 秒` : '按空白鍵開始數')
          : `${s.minutes.toFixed(1)} 分`;

        /* 數到哪了 */
        const c = $('#count');
        if (s.counting || s.counts.length){
          c.classList.add('on');
          c.innerHTML = s.counts.map(n => `<b>${n}</b>`).join('')
            + (s.counting ? `<i>${s.elapsed.toFixed(1)}</i>` : '');
        } else c.classList.remove('on');

        const st = $('#stand');
        if (s.noted || s.counting){ st.classList.remove('on'); return; }
        if (s.near && s.standing > 2){
          st.classList.add('on');
          st.innerHTML = s.standing < 6
            ? '而他站兩秒。'
            : `而那兩秒過完了。<br><b>而那個東西還沒有過去。</b>`;
        } else st.classList.remove('on');
      },
      onArrive: () => {
        const st = $('#stand');
        st.classList.add('on');
        st.innerHTML = '而它繞著同一片空地。<br><b>而它從來沒有出去過。</b><br>'
          + '<span class="hint2">按空白鍵。一下一圈。</span>';
      },
      onMark: r => { if (r && r.done) onMarkDone(r.done); },

    });
  } catch (e){
    $('#view').innerHTML =
      `<div class="err"><b>畫不出來。</b><p class="dim">${e.message}</p>
       <p class="dim">而這一頁需要 WebGL。<br>如果你的瀏覽器很舊，或顯示卡驅動關掉了它，就會這樣。</p></div>`;
    return;
  }

  $('#bInfo').onclick = () => { $('#info').hidden = false; };
  $('#ibClose').onclick = () => { $('#info').hidden = true; };
  $('#bMark').onclick = () => {
    const r = sim.mark();
    if (r && r.done) app.querySelector('#noteCard') && onMarkDone(r.done);
  };

  /* 年份。而那是書裡那條線 */
  $('#days').innerHTML = CIRCLE.map(([d,s],i) =>
    `<button class="btn dy" data-i="${i}" aria-pressed="${i===0}">
      ${d}<i class="mono">${s}秒</i></button>`).join('');
  $('#days').querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
    sim.setDay(+b.dataset.i);
    $('#days').querySelectorAll('[data-i]').forEach(x =>
      x.setAttribute('aria-pressed', String(x === b)));
  });

  /* 離開的時候要收乾淨 —— 否則 WebGL 會一直跑 */
  /* ⚠ 有些環境沒有 MutationObserver。而沒有防守的話整頁會炸。 */
  const obs = typeof MutationObserver !== 'undefined' ? new MutationObserver(() => {
    if (!app.querySelector('.road')){ sim.stop(); obs && obs.disconnect(); }
  }) : null;
  obs && obs.observe(app, { childList:true });
}
