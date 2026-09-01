import { loadManifest, setFileMap } from '../core/data.js';
import { initLabels } from '../core/labels.js';
import { load as loadSave } from '../core/save.js';
import { wireBack } from './base.js';

import { mountStory } from './story.js';
import { mountSpar }  from './spar.js';
import { mountDay }   from './day.js';
import { mountJie }   from './jie.js';
import { mountXue }   from './xue.js';
import { mountKnows } from './knows.js';
import { mountRoad }  from './road.js';

const app = document.getElementById('app');
let M = null;

const MODES = [
  { id:'story', name:'那些事',
    note:'一百二十五篇。而每一篇只知道自己那一格',
    mount: mountStory },
  { id:'spar',  name:'對練',
    note:'而輸贏不影響任何一件事',
    mount: mountSpar },
  { id:'day',   name:'那一天',
    note:'丙模式。而你拿到的四碼是空的',
    mount: mountDay },
  { id:'jie',   name:'那一天．界',
    note:'甲模式。而你拿到四碼——而你可以不接',
    mount: mountJie },
  { id:'xue',   name:'那一天．統籌',
    note:'乙模式。而你不打——你決定誰去',
    mount: mountXue },
  { id:'knows', name:'那些人知道的',
    note:'而你只看得到那個人知道的',
    mount: mountKnows },
  { id:'road',  name:'那條路',
    note:'走上去。而那一公里要十四分鐘',
    mount: mountRoad },
];

export async function boot(){
  /* ⚠ 最後一道網。而沒有它的話，任何一個沒接到的錯誤都會變成白畫面。 */
  addEventListener('error', e => {
    if (!app.querySelector('.err')) app.innerHTML =
      `<div class="err"><b>它壞在這裡。</b><pre>${e.message}</pre>
       <p class="dim">而如果你是直接點開 index.html，那就是原因——<br>
       請改用「藍天白雲傳承.html」那一個單檔版。</p></div>`;
  });
  app.innerHTML = `<div class="loading">載入中</div>`;
  try {
    M = await loadManifest();
    setFileMap(M.file);
    initLabels({ cast:M.cast, minor:M.minor });
    loadSave();
  } catch (e){
    app.innerHTML =
      `<div class="err"><b>讀不到資料。</b>` +
      `<p>而這個專案要用本機伺服器開，不能直接點 index.html。</p>` +
      `<pre>python3 -m http.server 8000</pre>` +
      `<p class="dim">${e.message}</p></div>`;
    return;
  }
  route();
  addEventListener('hashchange', route);
}

function route(){
  const h = location.hash.slice(1);
  const [mode, ...rest] = h.split('/');
  /* ⚠ hash 裡的中文會被瀏覽器 encode。而沒 decode 的話，
     讀出來的檔名對不上，而它會靜靜地退回目次 —— 不報錯。 */
  let arg = rest.join('/');
  try { arg = decodeURIComponent(arg); } catch {}
  const m = MODES.find(x => x.id === mode);
  if (m) return m.mount(app, M, arg, menu);
  menu();
}

export function menu(){
  const s = loadSave();
  const readCount = Object.keys(s.read).length;

  app.innerHTML = `
  <div class="home">
    <header>
      <h1>藍天白雲傳承</h1>
      <div class="mono">而那個東西還在山上</div>
    </header>

    <nav>
      ${MODES.map(m => `
        <button class="btn mode" data-go="${m.id}">
          <b>${m.name}</b>
          <span class="nt">${m.note}</span>
        </button>`).join('')}
    </nav>

    <div class="sec">現在有的</div>
    <div class="grid">
      <div><i>${M.scripts.length}</i><span>篇</span></div>
      <div><i>${M.scripts.reduce((a,b)=>a+b.boxes,0).toLocaleString()}</i><span>框</span></div>
      <div><i>${Object.keys(M.cast).length}</i><span>角色</span></div>
      <div><i>${readCount}</i><span>讀過</span></div>
    </div>

    <p class="foot">
      而名牌跟著視角人物的認知走。<br>
      <b>而那不是風格。那是這整套東西的地基。</b>
    </p>
  </div>`;

  app.querySelectorAll('[data-go]').forEach(b =>
    b.onclick = () => location.hash = b.dataset.go);
}
