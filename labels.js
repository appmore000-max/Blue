/* 名牌規則
 *
 * 對話框上的那個名字，要跟著視角人物的認知走。
 *
 * 而那不是風格。那是這整套東西的地基。
 *
 * 第 09 篇裡那個人如果顯示「余冷川」，一百二十五篇的設計全部作廢。
 */

let CAST = {};    /* id → 本名 */
let MINOR = {};   /* id → 泛稱 */

export function initLabels({ cast, minor }){
  CAST = cast || {};
  MINOR = minor || {};
}

/**
 * @param {string} who    說話的人的 id
 * @param {string} pov    這一篇的視角人物 id
 * @param {object} rule   這一篇的 label_rule
 * @returns {string}      要顯示在名牌上的字
 */
export function plateFor(who, pov, rule){
  if (!who) return '';

  /* 一｜視角人物用本名。因為他知道自己是誰 */
  if (who === pov) return CAST[who] || MINOR[who] || who;

  /* 二｜這一篇有規則，規則最大 */
  if (rule && rule[who]) return rule[who];

  /* 三｜配角泛稱。而多數配角沒有名字——因為視角人物不知道他們叫什麼 */
  if (MINOR[who]) return MINOR[who];

  /* 四｜其餘用本名 */
  return CAST[who] || who;
}

/**
 * 檢查一篇劇本有沒有違反規則。
 *
 * ⚠ 這一支只抓「視角人物不該知道對方名字，而畫面上會顯示本名」的情況。
 *
 * 而兩個彼此認識的人（鄭翊辰叫高志遠「遠哥」）不算違規 ——
 * 那些人本來就知道對方叫什麼。
 *
 * 所以要靠 KNOWN_STRANGERS 這一份白名單：只列出「該遮的」。
 */

/* 該遮的關係。而每一條都來自小說 */
const MUST_MASK = {
  chen_wenbin:  ['yu_lengchuan'],   /* 他只知道那是「靠窗那個人」 */
  yu_lengchuan: ['chen_wenbin'],    /* 而他不知道那個人叫什麼 */
  zhang_fugui:  ['huabang'],        /* 而他不知道華邦叫什麼 */
  jiyuan:       ['kong','shunfeng'],/* 而它不用名字 */
  kong:         ['shunfeng'],
};

export function auditScript(script){
  const problems = [];
  const rule = script['⚠_label_rule'] || {};
  const pov = script.pov;
  if (!pov) return problems;                 /* 集體篇沒有單一視角 */
  const mask = MUST_MASK[pov] || [];
  if (!mask.length) return problems;

  const seen = new Set();
  for (const b of script.boxes){
    if (b.t !== 'speech' || !b.who || seen.has(b.who)) continue;
    if (!mask.includes(b.who)) continue;
    seen.add(b.who);
    const shown = plateFor(b.who, pov, rule);
    if (shown === (CAST[b.who] || MINOR[b.who])){
      problems.push({
        who: b.who, shown,
        why: `視角是 ${CAST[pov]||MINOR[pov]||pov}，而他不知道這個人叫「${shown}」。`
      });
    }
  }
  return problems;
}

export const labelNote =
  '對話框上的那個名字，要跟著視角人物的認知走。而那不是風格。';
