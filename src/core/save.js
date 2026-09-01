/* 存檔
 *
 * 而這個世界沒有重來。所以存的東西很少：
 * 讀到哪裡、對練過誰、那一天跑過幾次。
 *
 * 而「接手，不是重來」——那件事之後要在這裡實作。
 */

const KEY = 'blue-sky.v1';
let mem = null;                       /* localStorage 不能用的時候的退路 */

const blank = () => ({
  read: {},          /* scriptId → 讀到第幾框 */
  finished: [],      /* 讀完的 */
  spar: [],          /* {a,b,cond,end,winner} —— 而它沒有排名 */
  fought: [],        /* ⚠ 在「不對等」模式下打過的人。而那是解鎖 */
  days: [],          /* {ending, clock, money} */
  settings: { speed: 36, hold: 1100, blind: false },
});

function raw(){
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export function load(){
  if (mem) return mem;
  mem = raw() || blank();
  return mem;
}

export function save(){
  try { localStorage.setItem(KEY, JSON.stringify(mem)); }
  catch { /* 記憶體模式。而那一場結束就沒了 */ }
}

export function markRead(id, box){
  const s = load();
  s.read[id] = Math.max(s.read[id] || 0, box);
  save();
}

export function markFinished(id){
  const s = load();
  if (!s.finished.includes(id)) s.finished.push(id);
  save();
}

/* 對練紀錄。而它只有你自己看得到，而且沒有排名 */
export function logSpar(rec){
  const s = load();
  s.spar.unshift({ ...rec, at: Date.now() });
  s.spar = s.spar.slice(0, 60);
  /* ⚠ 而在「不對等」模式下打過的人，你現在知道他會什麼了 */
  if (rec.blind){
    for (const id of [rec.a, rec.b])
      if (id && !s.fought.includes(id)) s.fought.push(id);
  }
  save();
}

/* 你打過他了嗎 */
export function known(id){ return load().fought.includes(id); }

export function logDay(rec){
  const s = load();
  s.days.unshift({ ...rec, at: Date.now() });
  s.days = s.days.slice(0, 30);
  save();
}

export function setting(k, v){
  const s = load();
  if (v === undefined) return s.settings[k];
  s.settings[k] = v; save(); return v;
}

export function reset(){
  mem = blank();
  try { localStorage.removeItem(KEY); } catch {}
}
