import { edges, fromPOV, unlocked, NOTE } from '../core/knows.js';
import { wireBack } from './base.js';

export async function mountKnows(app, M, arg, back){
  app.innerHTML = `<div class="loading">載入</div>`;
  const E = await edges();

  /* 只列有邊的人。而那些人是這本書的骨架 */
  const has = new Set();
  E.one_way.forEach(e => [...(e.known_by||[]), ...(e.unknown_to||[])].forEach(x=>has.add(x)));
  E.landed.forEach(l => { has.add(l.landed_on); has.add(l.speaker); });
  Object.keys(E.long || {}).forEach(x => has.add(x));
  const people = [...has].filter(x => M.cast[x] || M.minor[x]).sort();

  let me = arg && people.includes(arg) ? arg : people[0];

  app.innerHTML = `
  <div class="knows">
    <div class="bar"><button class="back" aria-label="回選單">←</button><span>那些人知道的</span></div>
    <p class="lead">${NOTE}</p>

    <div class="sec">從誰的角度</div>
    <div class="who-pick" id="pick"></div>

    <div id="view"></div>
  </div>`;

  const $ = s => app.querySelector(s);
  wireBack(app, back);

  function pick(){
    $('#pick').innerHTML = people.map(p => {
      const u = unlocked(M, p);
      return `<button class="btn wp ${u.open?'':'locked'}" data-p="${p}"
        aria-current="${p===me}">
        ${M.cast[p] || M.minor[p] || p}
        ${u.total ? `<i class="mono">${u.read}/${u.total}</i>` : ''}
      </button>`;
    }).join('');
    $('#pick').querySelectorAll('[data-p]').forEach(b =>
      b.onclick = () => { me = b.dataset.p; pick(); view(); });
  }

  function view(){
    const K = fromPOV(E, me);
    const u = unlocked(M, me);
    const name = M.cast[me] || M.minor[me] || me;

    if (u.total && !u.open){
      $('#view').innerHTML = `
        <div class="locked-note card">
          <b>而你還沒有讀過 ${name} 的任何一篇。</b>
          <p>而在那之前，這一格是空的。</p>
          <p class="dim">${name} 有 ${u.total} 篇。</p>
        </div>`;
      return;
    }

    $('#view').innerHTML = `
      ${K.holds ? `
        <div class="sec">而在《越來越慢》裡，他手上有的</div>
        <div class="ks">
          <div class="k card holds">
            ${K.holds.has.length
              ? K.holds.has.map(h=>`<div class="fact">${h}</div>`).join('')
              : '<div class="fact dim">而他手上什麼都沒有。</div>'}
            ${K.holds.lacks.length ? `<div class="lacks">
              ${K.holds.lacks.map(l=>`<div>而他缺的：${l}</div>`).join('')}</div>`:''}
            ${K.holds.note?`<div class="cost mono">${K.holds.note}</div>`:''}
          </div>
        </div>` : ''}

      ${K.knows.length ? `
        <div class="sec">${name} 知道的</div>
        <div class="ks">
          ${K.knows.map(k => `
            <div class="k card">
              <div class="fact">${k.fact}</div>
              ${k.about.length ? `<div class="about mono">而 ${
                k.about.map(a=>M.cast[a]||M.minor[a]||a).join('、')} 不知道</div>`:''}
              ${k.believes ? `<div class="bl">而他們以為：${k.believes}</div>`:''}
              ${k.note ? `<div class="nt">${k.note}</div>`:''}
              ${k.cost ? `<div class="cost mono">說出來 → ${k.cost.effect}${
                k.cost.reversible===false?'．不可逆':''}</div>`:''}
            </div>`).join('')}
        </div>` : ''}

      ${K.landed.length ? `
        <div class="sec">而有幾句話落在他身上</div>
        <div class="ks">
          ${K.landed.map(l => `
            <div class="k card land">
              <div class="line">「${l.line}」</div>
              <div class="nt">${l.effect}</div>
              ${l.speakerKnows === false
                ? `<div class="cost mono">而講的人不知道</div>` : ''}
            </div>`).join('')}
        </div>` : ''}

      ${K.mutual.length ? `
        <div class="sec">而有幾件兩個人都知道，而誰都不提</div>
        <div class="ks">
          ${K.mutual.map(m => `<div class="k card">
            <div class="fact">${m.fact}</div>
            ${m.note?`<div class="nt">${m.note}</div>`:''}</div>`).join('')}
        </div>` : ''}

      <div class="sec">而別人瞞著他的</div>
      <div class="hidden-count card">
        <div class="big mono">${K.doesnt}</div>
        <div class="hn">${K.doesnt ? '件' : '件'}</div>
        <p>${K.doesnt
          ? '而內容不給你看。<br><b>因為那些東西一旦被說出來，就沒了。</b>'
          : '而沒有人瞞著他。'}</p>
      </div>

      ${K.spokeBlind ? `
        <div class="hidden-count card sm">
          <div class="big mono">${K.spokeBlind}</div>
          <div class="hn">句</div>
          <p>而他講過的話落在別人身上。<br><b>而他不知道。</b></p>
        </div>` : ''}
    `;
  }

  pick(); view();
}
