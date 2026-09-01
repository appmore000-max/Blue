/* 資料層
 *
 * 而資料是唯一的真相。這裡不改它，只讀它。
 * data/ 底下那些 JSON 就是 game/ 那一包，原封不動。
 */

const BASE = './data';
const cache = new Map();

async function get(path){
  if (cache.has(path)) return cache.get(path);
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`讀不到 ${path}（${res.status}）`);
  const json = await res.json();
  cache.set(path, json);
  return json;
}

/* manifest：125 篇的索引 + 名字表。23 KB。
   而全部劇本是 2 MB —— 所以要一篇一篇載 */
export const loadManifest = () => get('manifest.json');

/* 一篇劇本。
   ⚠ 檔名是純 ASCII，而 id 是中文 —— 兩個是不一樣的東西。
     理由：GitHub Pages 上中文檔名的編碼行為跟本機不一定一樣。 */
let FILE = null;
export function setFileMap(m){ FILE = m || null; }
export const loadScript = id =>
  get(`script/${(FILE && FILE[id]) || id}.json`);

/* 一個角色 */
export const loadCharacter = id => get(`characters/${id}.json`);

/* 世界層 */
export const loadWorld = name => get(`world/${name}.json`);

/* 知識層 */
export const loadSecrets = () => get('knowledge/secrets.json');

/* 全部角色。而對練場要這一份 */
export async function loadRoster(ids){
  const out = {};
  await Promise.all(ids.map(async id => {
    const c = await loadCharacter(id);
    const i = c.identity || {}, r = c.resource || {}, cb = c.combat || {}, b = c.body || {};
    const cun = r.cun || {}, st = r.stamina || {}, ben = r.ben || {};
    out[id] = {
      id,
      name: i.name_zh || id,
      age: i.age ?? null,
      h: b.height_cm ?? null, w: b.weight_kg ?? null,
      cun: cun.max ?? null, regen: cun.regen_band ?? null,
      sta: st.max ?? null,
      ben: !!ben.can_force, benUsed: !!ben.forced_before,
      role: cb.role || null,
      roleNote: cb.role_note || '',
      sig: cb.signature || '',
      ab: (cb.abilities || []).map(a => ({ id:a.id, label:a.label, cost:a.cost })),
      empty: (cb.empty_profile || {}).one_line || '',
    };
  }));
  return out;
}
