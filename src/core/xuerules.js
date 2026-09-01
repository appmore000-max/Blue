/* 乙模式．林雪芸
 *
 * 而這一段的玩法不是戰鬥。
 *
 *   通報進來 → 你給四碼 → 你挑人 → 他們去 → 回報進來 → 四碼被改
 *
 * 而你不會知道你的決定造成了什麼。
 *
 * 因為回報只寫傷勢與處置。
 * 而那些人不會跟你講他們遇到了什麼。
 */

export const CLOCK0 = 8*60 + 10;
export const fmt = m =>
  String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');

/* ── 今天進來的東西 ─────────────────── */
/* intake：通報的人講的。而它會錯 —— 而第 2 碼錯最多 */
const CASES = [
  { id:'a', where:'南投．廢棄廠房',
    said:'有人說裡面有東西。而那邊有幾個人沒有出來。',
    intake:{d1:2,d2:1,d3:1,d4:2},
    truth :{d1:1,d2:3,d3:3,d4:2},          /* 而那是茲克瓦留下來的殘餘 */
    hint:'而通報的人不在現場。',
  },
  { id:'b', where:'台中．舊市場',
    said:'東西在動。而白天。',
    intake:{d1:2,d2:0,d3:2,d4:3},
    truth :{d1:2,d2:0,d3:3,d4:3},
    hint:'而那是白天的市場。',
  },
  { id:'c', where:'花蓮．產業道路',
    said:'那個東西已經在那裡三個月了。而沒有人靠近。',
    intake:{d1:3,d2:0,d3:0,d4:0},
    truth :{d1:3,d2:0,d3:0,d4:0},
    hint:'而它沒有在跑。',
  },
];

/* ── 名單 ───────────────────────────── */
/* 而她本子上那一頁寫的是三行 */
export const ROSTER = [
  { id:'gao_zhiyuan', name:'高志遠', tier:'三階上', role:'擋',
    book:['太太、兩個小孩','而他每一次出勤前會親女兒的額頭','—'],
    can:'站在人跟東西中間', block:null },
  { id:'lin_ruoshuang', name:'林若霜', tier:'三階中', role:'醫',
    book:['而界只有一個','五十公尺。而一次一個','—'],
    can:'第 2 碼不是 0 的時候，她是瓶頸', block:null },
  { id:'hei_shi', name:'黑石', tier:'三階上', role:'擋',
    book:['一個女兒，十三歲','而他每個月十五號固定','—'],
    can:'他不是靠打贏的，是靠不倒', block:null },
  { id:'zheng_yichen', name:'鄭翊辰', tier:'三階中', role:'快',
    book:['而他二〇二〇年回台灣','父親二〇一四年不見了','—'],
    can:'到得快', block:null },
  { id:'wang', name:'王志偉', tier:'四階中', role:'查',
    book:['母親、一個妹妹','今年三月結婚','而那個日期是三月八號'],
    can:'查證', block:'三月' },     /* 而她這個月把他劃掉了 */
  { id:'cheng_yijin', name:'程以今', tier:'二階下', role:'全',
    book:['—','而他碰到任何一件事，第一個反應是：有沒有別的做法','—'],
    can:'而他不需要別人', block:null },
];

export function newDay(){
  return {
    t: CLOCK0,
    i: 0,                       /* 第幾件 */
    cases: CASES.map(c => ({ ...c, mine:null, sent:[], report:null })),
    book: [],                   /* 抄進本子的名字 */
    log: [], stomach: 0,
    phase: 'grade',             /* grade → pick → wait → report */
    done: false,
  };
}

export const DIGIT = [
  { pos:1, asks:'對面是什麼', decides:'派什麼規格的人',
    lv:['沒有對面。純善後','一般人或低規格','明確越過人類極限的東西','規格不明'] },
  { pos:2, asks:'裡面有沒有不該在的人', decides:'要不要帶醫療',
    lv:['沒有','有，而他們走得掉','有，而他們走不掉','有，而他們是對面的一部分'],
    bottleneck:true },
  { pos:3, asks:'有多少人會看到', decides:'要不要帶會收尾的人',
    lv:['沒有人會看到','少數，處理得掉','多。會上新聞','已經在傳了'] },
  { pos:4, asks:'還有多久', decides:'派誰比較快',
    lv:['沒有在跑','幾天','幾小時','現在'] },
];

/* ── 你給四碼 ───────────────────────── */
export function grade(S, digits){
  const c = S.cases[S.i];
  const say = (t,s='') => S.log.push({ t,s,clock:fmt(S.t) });
  c.mine = { ...digits };
  S.t += 10;

  say(`【${digits.d1}${digits.d2}${digits.d3}${digits.d4}】${c.where}`, 'act');
  say('而那是你修過的。','dim');
  say('','gap');
  say('而通報進來的是【' +
      `${c.intake.d1}${c.intake.d2}${c.intake.d3}${c.intake.d4}】。`,'dim');
  say('而你不覆蓋。兩個都留著。','dim');
  S.phase = 'pick';
  return S;
}

/* ── 你挑人 ─────────────────────────── */
export function pick(S, ids){
  const c = S.cases[S.i];
  const say = (t,s='') => S.log.push({ t,s,clock:fmt(S.t) });
  c.sent = [...ids];
  S.t += 20;

  say('','gap');
  say('你 @ 了 ' + ids.map(i => ROSTER.find(r=>r.id===i).name).join('、') + '。');

  /* 而你挑了誰，也就是你決定了誰不去 */
  const notSent = ROSTER.filter(r => !ids.includes(r.id) && !r.block);
  if (notSent.length){
    say('','gap');
    say('而其餘的人今天不去。','dim');
  }
  S.phase = 'wait';
  return S;
}

/* ── 他們去 ─────────────────────────── */
export function wait(S){
  const c = S.cases[S.i];
  const say = (t,s='') => S.log.push({ t,s,clock:fmt(S.t) });
  S.t += 200;

  say('','gap');
  say('而接下來三個多小時，你不知道那裡發生了什麼。','em');
  say('','gap');
  say('因為沒有人會在中間回報。','dim');

  /* 結算 —— 而玩家看不到這一段 */
  const hasMedic = c.sent.includes('lin_ruoshuang');
  const hasGuard = c.sent.some(x => ['gao_zhiyuan','hei_shi'].includes(x));
  const t = c.truth;

  let wounds = 0, down = 0, note = [];
  if (t.d1 >= 2 && !hasGuard) wounds += 2;
  if (t.d2 >= 2){
    if (!hasMedic){ wounds += 2; down = 1; note.push('nomedic'); }
    else note.push('medic');
  }
  if (t.d1 - (c.mine.d1 ?? 0) > 0) wounds += 1;      /* 你估低了 */
  if (t.d3 >= 2 && c.mine.d3 < 2) note.push('leak'); /* 而第三碼收不掉 */

  c.report = {
    wounds: Math.min(4, wounds),
    down,
    note,
    /* 而回報只寫傷勢與處置 */
    lines: [
      `對象：處理完成。`,
      `傷勢：${wounds === 0 ? '0 級' : wounds + ' 級'}`,
      `處置：制伏。`,
    ],
  };
  S.phase = 'report';
  return S;
}

/* ── 回報進來。而四碼被改成真的 ───────── */
export function report(S){
  const c = S.cases[S.i];
  const say = (t,s='') => S.log.push({ t,s,clock:fmt(S.t) });
  S.t += 40;

  say('','gap');
  say('回報進來了。','em');
  say('','gap');
  c.report.lines.forEach(l => say(l, 'act'));
  say('','gap');
  say('而那就是全部。','dim');
  say('','gap');
  say('而它沒有寫他們遇到了什麼。','em');

  /* 而第三碼收不掉的話，隔天會有別的東西進來 */
  if (c.report.note.includes('leak')){
    say('','gap');
    say('而隔天早上，有一則新的通報。','em');
    say('','gap');
    say('同一個地點。','dim');
    say('而這一次第 3 碼是 3。','dim');
    say('','gap');
    say('因為昨天沒有帶會收尾的人。','em');
  }

  /* 四碼改成真的。而她不覆蓋 —— 兩個都留著 */
  const t = c.truth, mine = c.mine;
  const diff = ['d1','d2','d3','d4'].filter(k => t[k] !== mine[k]);
  say('','gap');
  say(`而你把四碼改成真的：【${t.d1}${t.d2}${t.d3}${t.d4}】`, 'act');
  if (diff.length){
    say('','gap');
    diff.forEach(k => {
      const d = DIGIT[+k[1]-1];
      say(`第 ${d.pos} 碼　你給 ${mine[k]}　而它是 ${t[k]}`, 'em');
      if (k === 'd2') say('　　而那是這套系統裡唯一一個瓶頸。','dim');
    });
  } else {
    say('','gap');
    say('而你四碼都對。','em');
  }

  /* 而胃 */
  if (c.report.wounds >= 2 || c.report.down){
    S.stomach++;
    say('','gap');
    say('而你的胃有一下。','dim');
    say(`而那大概 ${20 + S.stomach*20} 秒。`,'dim');
    say('而你沒有跟任何人講過。','dim');
  }

  /* 而那些名字要抄進本子 */
  if (c.report.wounds >= 2){
    c.sent.forEach(id => {
      const r = ROSTER.find(x => x.id === id);
      if (!S.book.includes(r.name)) S.book.push(r.name);
    });
    say('','gap');
    say('而那些名字要抄進本子裡。','em');
    say('','gap');
    say('而那不是劃掉。','em');
  }

  S.i++;
  if (S.i >= S.cases.length){ S.done = true; }
  else { S.phase = 'grade'; }
  return S;
}

export const ENDING = {
  t:'而那一天結束了。',
  lines:[
    '而你讀完了所有進來的東西。',
    '而你排了下個星期。',
    '',
    '<b>而你不會知道你的決定造成了什麼。</b>',
    '',
    '因為回報只寫傷勢與處置。',
    '<b>而那些人不會跟你講他們遇到了什麼。</b>',
  ],
  tail:'而她關燈的時候要伸長一點。因為她一百六十二公分，而那個開關裝得有點高。',
};
