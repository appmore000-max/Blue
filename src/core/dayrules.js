/* 那一天．丙模式
   而丙模式的核心是：你拿到的四碼是空的。
   而你要用時間去換那四個數字——而時間就是天黑之前。 */

export const CLOCK0 = 8*60 + 12;      /* 08:12 */
export const DARK   = 17*60 + 40;     /* 天黑 */
export const UNIT   = 10;             /* 最小單位十分鐘 */

/* 真實的四碼。而玩家一開始一格都不知道 */
export const TRUTH = { d1:2, d2:2, d3:0, d4:2 };

export const DIGIT = [
  { pos:1, asks:'對面是什麼',            decides:'派什麼規格的人',
    lv:{0:'沒有對面。純善後',1:'一般人或低規格',2:'明確越過人類極限的東西',3:'規格不明'} },
  { pos:2, asks:'裡面有沒有不該在的人',   decides:'要不要帶醫療',
    lv:{0:'沒有',1:'有，而他們走得掉',2:'有，而他們走不掉',3:'有，而他們是對面的一部分'} },
  { pos:3, asks:'有多少人會看到',        decides:'要不要帶會收尾的人',
    lv:{0:'沒有人會看到',1:'少數，處理得掉',2:'多。會上新聞',3:'已經在傳了'} },
  { pos:4, asks:'還有多久',              decides:'派誰比較快',
    lv:{0:'沒有在跑',1:'幾天',2:'幾小時',3:'現在'} },
];

export const fmt = m => String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');

/* ── 一天的狀態 ─────────────────────── */
export function newDay(){
  return {
    t: CLOCK0,
    at: 'home',
    money: 3400,          /* 而你身上有這些 */
    fee: 12000,
    cun: 60, cunMax: 60,  /* 四階下。而那不多 */
    sta: 95, staMax: 95,
    known: { d1:null, d2:null, d3:null, d4:null },
    log: [],
    flags: {},
    done: false, ending: null
  };
}

export const PLACES = {
  home:   { name:'家',        note:'而那是存檔點' },
  bus:    { name:'客運站',    note:'' },
  town:   { name:'苗栗．鎮上', note:'疏。而眼睛不多' },
  road:   { name:'產業道路口', note:'過。而沒有人' },
  site:   { name:'那個地方',   note:'山區。而中午跟深夜的眼睛都是 0' },
};

/* ── 可以做的事 ─────────────────────── */
export function actions(S){
  const A = [];
  const t = S.t;

  if (S.at === 'home'){
    A.push({ id:'ask',   label:'回訊息問清楚',  cost:10,  money:0,
      note:'而問了要等' });
    A.push({ id:'search',label:'查那個地名',    cost:20,  money:0,
      note:'而網路上查得到的東西有限' });
    A.push({ id:'gear',  label:'去買東西',      cost:40,  money:-1200,
      note:'而你身上只有 3,400' });
    A.push({ id:'go',    label:'出發',          cost:0,   money:0 });
  }
  if (S.at === 'bus'){
    A.push({ id:'bus_go',  label:'搭客運（便宜、慢）', cost:150, money:-380 });
    A.push({ id:'taxi_go', label:'包車（快、貴）',     cost:95,  money:-2600 });
  }
  if (S.at === 'town'){
    A.push({ id:'ask_local', label:'問當地人', cost:30, money:0,
      note:'而一個外地人在問山上的事' });
    A.push({ id:'eat',   label:'吃東西',   cost:20, money:-120, note:'而體力會回來一點' });
    A.push({ id:'to_road', label:'往山上',  cost:40, money:0 });
  }
  if (S.at === 'road'){
    A.push({ id:'scout', label:'偵察（每段 15 分）', cost:15, money:0,
      note:'上限四段。而每一段給你一格' });
    A.push({ id:'enter', label:'進去',  cost:20, money:0 });
    A.push({ id:'leave', label:'不做了。回家', cost:0, money:0, quit:true });
  }
  if (S.at === 'site'){
    A.push({ id:'engage', label:'動手', cost:0, money:0 });
    A.push({ id:'back',   label:'退出來', cost:20, money:0 });
  }
  return A.filter(a => t + a.cost <= DARK + 120);
}

/* ── 第 2 碼那一秒的三個選項 ─────────── */
export const D2 = [
  { id:'take',  label:'先把人帶出來',
    note:'而那要時間。而那個東西還在跑' },
  { id:'fight', label:'先處理那個東西',
    note:'而那些人要在裡面多待那段時間' },
  { id:'call',  label:'打電話。找人',
    note:'而你不隸屬任何組織。而那一行不會派人來' },
];

export function chooseD2(S, id){
  const say = (t,s='') => S.log.push({ t, s, clock: fmt(S.t) });
  S.await = null;
  say('','gap');
  if (id === 'take'){
    S.t += 50;
    say('你先把人帶出來。','em');
    say('而那用掉五十分鐘。','dim');
    say('','gap');
    say('而你回頭的時候，那個東西已經不在那裡了。','em');
    say('而它往下走了。','dim');
    S.done = true; S.ending = 'took';
  }
  if (id === 'fight'){
    S.cun -= 26; S.sta -= 30;
    say('你先處理那個東西。','em');
    say(`（存 −26　剩 ${Math.max(0,S.cun)}）`,'act');
    say('','gap');
    if (S.known.d1 === 2 && S.cun > 0){
      say('而你處理掉了。','em');
      say('而那些人在裡面多待了那段時間。','dim');
      S.done = true; S.ending = 'fought';
    } else {
      say('而你的存不夠。','em');
      S.done = true; S.ending = 'short';
    }
  }
  if (id === 'call'){
    S.t += 20;
    say('你打了電話。');
    say('而那一行的人說：「那不是我們的事。」','dim');
    say('','gap');
    say('而你想到界。','dim');
    say('而你沒有那個號碼。','em');
    S.done = true; S.ending = 'nobody';
  }
  return S;
}

/* ── 執行 ───────────────────────────── */
export function step(S, id){
  const a = actions(S).find(x => x.id === id);
  if (!a || S.done) return S;
  const say = (t, s='') => S.log.push({ t, s, clock: fmt(S.t) });

  S.t += a.cost;
  S.money += a.money;

  switch(id){
    case 'ask':
      say('你回了訊息：「那是什麼東西？」');
      say('而過了八分鐘，對方回了兩個字。','dim');
      say('「不知道。」','em');
      say('而那不是敷衍。','dim');
      say('因為那一行的人，多數也不知道自己在轉什麼。','dim');
      S.flags.asked = true;
      break;

    case 'search':
      say('你查了那個地名。');
      say('而查到的是：那一帶今年有兩起山難通報。','dim');
      S.known.d3 = 0;
      say('第 3 碼：沒有人會看到。','act');
      say('而那是山區。','dim');
      break;

    case 'gear':
      say('你去買了東西。');
      say('一支手電筒。一捲膠帶。還有一雙比較好的鞋。','dim');
      say(`而你身上剩 ${S.money}。`,'dim');
      S.flags.gear = true;
      break;

    case 'go':      S.at='bus'; say('你出門了。'); break;

    case 'bus_go':
      S.at='town';
      say('客運。兩個半小時。');
      say('而你在車上睡了一下。','dim');
      S.sta = Math.min(S.staMax, S.sta + 8);
      break;

    case 'taxi_go':
      S.at='town';
      say('你包了車。');
      say(`而那用掉 2,600。你身上剩 ${S.money}。`,'dim');
      say('而那筆錢要從那 12,000 裡面扣。','dim');
      break;

    case 'ask_local':
      say('你問了一個在顧店的老先生。');
      if (Math.random() < 0.7){
        S.known.d1 = 2;
        say('他說上個月有人的狗不見了。而那個人上去找，回來的時候手在抖。','dim');
        say('第 1 碼：明確越過人類極限的東西。','act');
      } else {
        say('他說他不知道。','dim');
        say('而他看你的方式變了。','dim');
        S.flags.noticed = true;
      }
      break;

    case 'eat':
      S.sta = Math.min(S.staMax, S.sta + 15);
      say('你吃了一碗麵。'); say('而那要 120。','dim');
      break;

    case 'to_road': S.at='road'; say('你往山上走。'); break;

    case 'scout': {
      S.flags.scout = (S.flags.scout||0)+1;
      if (S.flags.scout > 4){ S.t -= a.cost; say('偵察上限四段。','dim'); break; }
      say(`偵察　第 ${S.flags.scout} 段。`);
      const order = ['d1','d2','d4','d3'];
      const nxt = order.find(k => S.known[k] === null);
      if (nxt){
        S.known[nxt] = TRUTH[nxt];
        const dg = DIGIT[+nxt[1]-1];
        say(`第 ${dg.pos} 碼：${dg.lv[TRUTH[nxt]]}`, 'act');
        if (nxt === 'd2'){
          say('而裡面有人。而他們走不掉。','em');
          say('而你不是林若霜。','dim');
        }
        if (nxt === 'd4') say('而它在跑。','dim');
      } else say('而沒有更多了。','dim');
      break;
    }

    case 'enter': S.at='site'; say('你進去了。'); break;
    case 'back':  S.at='road'; say('你退出來了。'); break;

    case 'leave':
      S.done = true; S.ending = 'quit';
      say('你回家了。'); 
      break;

    case 'engage': return resolve(S);
  }

  if (S.t >= DARK && !S.done){
    S.done = true; S.ending = 'dark';
  }
  return S;
}

/* ── 結算 ───────────────────────────── */
export function resolve(S){
  const say = (t,s='') => S.log.push({ t, s, clock: fmt(S.t) });
  const k = S.known;
  const blind = Object.values(k).filter(v => v===null).length;

  say('','gap');
  say('而你動手了。','em');

  /* 第 1 碼是 2。而你四階下 */
  if (k.d1 === null){
    say('而你不知道對面是什麼。','dim');
    say('而它越過人類極限。','em');
    S.done = true; S.ending = 'blind';
    return S;
  }

  /* 存不夠 */
  S.cun -= 34;
  say(`你用了那一項。（存 −34　剩 ${S.cun}）`,'act');

  if (S.cun < 20){
    say('而你的存見底了。','em');
    say('而那不是輸。你還能跑。','dim');
  }

  /* 第 2 碼：裡面有人，而他們走不掉 */
  if (k.d2 === 2){
    say('','gap');
    say('而裡面有人。','em');
    say('而他們走不掉。','em');
    say('','gap');
    say('而你那一秒要決定的，不是打不打得贏。','dim');
    S.await = 'd2';       /* 而這裡要給選項，不是結束 */
    return S;
  }
  if (k.d2 === null){
    say('','gap');
    say('而你到了才看到裡面有人。','em');
    say('而你沒有帶任何一個能處理那件事的東西。','em');
    S.done = true; S.ending = 'too_late';
    return S;
  }

  S.done = true; S.ending = 'clear';
  return S;
}

export const ENDING = {
  quit:     { t:'你回家了。', s:'而那一行不會再找你。而那 12,000 也沒有了。而你今天沒有受傷。' },
  dark:     { t:'天黑了。',   s:'而那一行只寫「天黑之前」。而現在天黑了。' },
  blind:    { t:'你沒有出來。', s:'而你到最後都不知道那是什麼。而那不是你不夠強——是你沒有那四個數字。' },
  too_late: { t:'你到了才看到。', s:'而第 2 碼是你到了才知道的。而那正是界那邊改最多次的一碼。' },
  took:     { t:'你把人帶出來了。', s:'而那個東西還在。而它往下走了。<br>而那 12,000 是「處理掉」的錢。而你沒有處理掉。' },
  fought:   { t:'你處理掉了。',     s:'而那些人在裡面多待了那段時間。<br>而他們後來怎麼樣，那一行不會告訴你。' },
  short:    { t:'而你的存不夠。',   s:'而四階下就是這樣。而那不是你做錯了什麼。' },
  nobody:   { t:'而沒有人會來。',   s:'而你不隸屬任何組織。<br>而界那邊有一個人，她的工作就是決定誰去。<br>而你沒有那個號碼。' },
  clear:    { t:'你處理完了。', s:'' },
};
