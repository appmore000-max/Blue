/* 知識層
 *
 * 而這一份有一個設計上的難題。
 *
 * 因為那 49 條每一條的定義都是：被說出來就沒了。
 *
 * 所以一次列出 49 條，這本書就毀了。
 *
 * ── 而那個介面本身要遵守同一條規則。
 *
 * 你只看得到「你選的那個視角知道的」。
 * 而別人知道什麼、別人不知道什麼 —— 那不給你看。
 */

import { loadSecrets } from './data.js';
import { load as sv } from './save.js';

let CACHE = null;

export async function edges(){
  if (CACHE) return CACHE;
  const d = await loadSecrets();
  CACHE = {
    one_way: d.one_way || [],
    mutual:  d.mutual_silent || [],
    landed:  d.landed || [],
    /* 長篇那一層格式不一樣：每一個人手上有什麼、缺什麼 */
    long:    (d['⚠_long_form'] || {}).who_holds_what || {},
    longNote:(d['⚠_long_form'] || {}).the_idea_nobody_has_had || '',
  };
  return CACHE;
}

/* ── 從一個人的角度，他知道什麼 ─────── */
/**
 * @param {string} me   視角人物 id
 * @returns {{knows:[], doesnt:number, landed:[], mutual:[]}}
 *
 * knows   —— 他知道的（而別人不知道他知道）
 * doesnt  —— 別人瞞著他的「數量」。而內容不給看
 * landed  —— 有一句話落在他身上。而講的人不知道
 * mutual  —— 兩個人都知道，而誰都不提
 */
export function fromPOV(E, me){
  const knows = E.one_way
    .filter(e => (e.known_by || []).includes(me))
    .map(e => ({
      id: e.id,
      fact: e.fact,
      about: (e.unknown_to || []),
      believes: e.unaware_believes,
      since: e.since,
      note: e.note,
      cost: e.if_revealed,
    }));

  /* ⚠ 而這裡只給數量。因為內容給了就沒了 */
  const doesnt = E.one_way.filter(e => (e.unknown_to || []).includes(me)).length;

  const landed = E.landed
    .filter(l => l.landed_on === me)
    .map(l => ({ line: l.line, effect: l.effect, speakerKnows: l.speaker_knows }));

  /* 而他自己講過、落在別人身上、而他不知道的 —— 也不給看 */
  const spokeBlind = E.landed.filter(l => l.speaker === me && !l.speaker_knows).length;

  const mutual = E.mutual
    .filter(m => (m.between || m.known_by || []).includes(me))
    .map(m => ({ fact: m.fact, note: m.note }));

  /* 長篇：手上有什麼／缺什麼 */
  const L = (E.long || {})[me];
  const holds = L ? {
    has: L.has || [],
    /* ⚠ lacks 給看 —— 因為那不是別人瞞他的，是他自己不知道自己不知道 */
    lacks: L.lacks || [],
    note: L['⚠'] || '',
  } : null;

  return { knows, doesnt, landed, spokeBlind, mutual, holds };
}

/* ── 而它要跟閱讀進度綁在一起 ─────────── */
/* 沒讀過那個人的篇，就看不到他的那一格 */
export function unlocked(M, me){
  const s = sv();
  const mine = M.scripts.filter(x => x.pov === me);
  const read = mine.filter(x => s.finished.includes(x.id) ||
    (s.read[x.id] ?? 0) > x.boxes * 0.6);
  return { total: mine.length, read: read.length, open: read.length > 0 };
}

export const NOTE =
  '而你只看得到這個人知道的。<br>' +
  '別人瞞著他的東西，只給你一個數字。<br>' +
  '<b>因為那些東西一旦被說出來，就沒了。</b>';
