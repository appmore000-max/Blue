/* 那一天．甲模式
 *
 * 同一個自建角色。四階下。而他加入界了。
 *
 * 而變的是四樣：
 *   案子從 Line 群組來，而全體成員都看得到
 *   你拿到的是四碼，不是一行字
 *   受傷是林若霜，零元
 *   而你被登錄了
 *
 * 而這一天的核心不是打得贏打不贏。
 * 是你要在不殺的前提下，把一群比你強的無辜的人壓下去。
 */

export const CLOCK0 = 7*60 + 40;    /* 07:40 家 */
export const DEADLINE = 14*60;      /* 14:00 前到 */

export const fmt = m =>
  String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0');

/* 而這一次四碼是給你的。而它是通報的人講的 —— 所以第 2 碼會改 */
export const CODE = { d1:1, d2:3, d3:3, d4:2 };
export const CODE_MEAN = {
  d1:'一般人或低規格',
  d2:'有，而他們是對面的一部分',
  d3:'已經在傳了',
  d4:'幾小時',
};

export const POST = `【1332】南投。廢棄廠房。
@ 高志遠　@ 林若霜　@［你］
14:00 前到。`;

export function newDay(){
  return {
    t: CLOCK0,
    at: 'home',
    cun: 60, cunMax: 60,      /* 而跟丙模式一樣。四階下 */
    uses: 3,                  /* 而你只有三次 */
    money: 0,                 /* 車錢會核銷 */
    wound: 0,
    at_site: false,
    joined: null,             /* 有沒有接 */
    ride: null,
    scouted: 0,
    seven: 7,                 /* 對面七個 */
    subdued: 0,
    log: [], flags: {},
    await: null, done: false, ending: null,
  };
}

/* ── 可以做的事 ─────────────────────── */
export function actions(S){
  const A = [];

  if (S.at === 'home' && S.joined === null){
    A.push({ id:'join',  label:'回覆：我去',
      note:'而 @ 名單上只有三個人' });
    A.push({ id:'pass',  label:'不回',
      note:'而界不會罰你。而那件事就是兩個人去' });
    A.push({ id:'read2', label:'先看第 2 碼是什麼意思', cost:0,
      note:'而那是這套系統裡唯一一個瓶頸' });
  }

  if (S.at === 'home' && S.joined === true){
    A.push({ id:'hsr',   label:'高鐵（12:35 到）', cost:0,
      note:'而早到那一小時可以偵察' });
    A.push({ id:'tra',   label:'台鐵（13:50 到）', cost:0,
      note:'而那樣剛好趕上。而不能偵察' });
  }

  if (S.at === 'site' && !S.flags.entered){
    if (S.ride === 'hsr' && S.scouted < 4)
      A.push({ id:'scout', label:`偵察（第 ${S.scouted+1} 段．15 分）`, cost:15,
        note:'而每一段給你一格' });
    if (S.t < 13*60+40)
      A.push({ id:'wait', label:'等另外兩個', cost:0,
        note:'而那是別的東西' });
    if (S.flags.ruoshuang)
      A.push({ id:'enter', label:'進去', cost:0 });
  }

  return A;
}

/* ── 執行 ───────────────────────────── */
export function step(S, id){
  const say = (t,s='') => S.log.push({ t, s, clock: fmt(S.t) });
  const a = actions(S).find(x => x.id === id);
  if (!a || S.done) return S;
  if (a.cost) S.t += a.cost;

  switch(id){
    case 'read2':
      say('第 2 碼是 3。');
      say('「有，而他們是對面的一部分。」','em');
      say('','gap');
      say('而那一級發生過一次。','dim');
      say('被感染的人至少是三階的戰力。而其中一部分突破到二階。','dim');
      say('而那些人全部都是無辜的平民。','em');
      say('','gap');
      say('而反抗方的目標從頭到尾都是制伏，不是清除。','dim');
      say('','gap');
      say('而那是茲克瓦。','em');
      say('而今天這一件是那件事留下來的殘餘。','dim');
      S.flags.read2 = true;
      break;

    case 'join':
      S.joined = true; S.t = 11*60+10;
      say('你回了兩個字。');
      say('','gap');
      say('而那則貼文全體成員都看得到。','dim');
      say('所以你不是被通知。你是在等被 @。','dim');
      break;

    case 'pass':
      S.joined = false; S.done = true; S.ending = 'passed';
      say('你沒有回。');
      say('','gap');
      say('而沒有人找你談。','dim');
      say('而界不會罰你。','dim');
      break;

    case 'hsr':
      S.ride='hsr'; S.at='site'; S.t = 12*60+35; S.money -= 700;
      say('高鐵。而車錢會核銷。','dim');
      say('','gap');
      say('而你到的時候，高志遠已經在了。','em');
      say('','gap');
      say('他一百八十八公分，九十五公斤。','dim');
      say('而他的位置是站在人跟東西中間。','dim');
      say('','gap');
      say('而他做的第一件事，是把四碼再講一次。','dim');
      say('「二碼三。」');
      say('「⋯⋯裡面有多少人？」');
      say('「不知道。」','em');
      say('','gap');
      say('而通報進來的四碼是有人講的。','dim');
      say('而那個人多半不在現場。','em');
      break;

    case 'tra':
      S.ride='tra'; S.at='site'; S.t = 13*60+50; S.money -= 300;
      say('台鐵。而你 13:50 到。');
      say('','gap');
      say('而高志遠已經在了。而林若霜也在。','dim');
      say('','gap');
      say('而她已經把頭髮重新綁好了。','em');
      S.flags.ruoshuang = true; S.flags.sawKnot = true;
      break;

    case 'scout': {
      S.scouted++;
      say(`偵察　第 ${S.scouted} 段。`);
      const found = [
        '而裡面至少有五個人。而他們沒有在動。',
        '而那不是五個。而是七個。',
        '而其中一個站得不太穩。',
        '而那個站不穩的，是他們裡面最年輕的。',
      ][S.scouted-1];
      say(found, S.scouted>=3 ? 'em' : 'dim');
      if (S.scouted === 2) S.flags.knowSeven = true;
      if (S.scouted === 4) S.flags.knowWeak = true;
      break;
    }

    case 'wait':
      S.t = 13*60+40;
      say('13:40。');
      say('','gap');
      say('林若霜到了。','em');
      say('','gap');
      say('而她做的第一件事，是把辮子拆掉。','dim');
      say('然後重新綁成一個很緊的髮髻。','dim');
      say('','gap');
      say('因為救人的時候頭髮不能掉下來。','dim');
      say('而那在界裡面變成了訊號。','em');
      say('','gap');
      say('所以你看到那個動作的時候，你就知道——','dim');
      say('她判斷這一場會有人倒下。','em');
      S.flags.ruoshuang = true; S.flags.sawKnot = true;
      break;

    case 'enter':
      S.flags.entered = true; S.t = 14*60;
      say('14:00。');
      say('','gap');
      say('你們進去了。','em');
      say('','gap');
      say('而對面是七個人。','em');
      say('一般人。而他們身上那個東西讓他們變成三階。','dim');
      say('','gap');
      say('而你四階下。','dim');
      say('','gap');
      say('他們對你　×1.9','act');
      say('你對他們　×0.55','act');
      say('','gap');
      say('而你要制伏，不是清除。','em');
      say('','gap');
      say('所以你要用 0.55 的傷害，','dim');
      say('把一個 1.9 倍的人壓到倒下而不死。','em');
      say('','gap');
      say(`而你有 ${S.uses} 次。而對面七個。`,'em');
      say('','gap');
      say('算不過來。','em');
      S.await = 'fight';
      break;
  }
  return S;
}

/* ── 那一場 ─────────────────────────── */
export const FIGHT = [
  { id:'solo',  label:'自己一個一個壓',
    note:'而你有三次。而對面七個' },
  { id:'behind',label:'讓高志遠站住，你繞到後面',
    note:'而他的定位是站在人跟東西中間' },
  { id:'weak',  label:'先處理那個站不穩的',
    note:'而你要偵察到第四段才看得到他',  needs:'knowWeak' },
];

export function fight(S, id){
  const say = (t,s='') => S.log.push({ t, s, clock: fmt(S.t) });
  S.await = null;
  S.t += 40;
  say('','gap');

  if (id === 'solo'){
    S.uses = 0; S.cun -= 60; S.wound = 4;
    say('你自己上。','em');
    say('三次用完。','act');
    say('','gap');
    say('而你壓下了三個。','dim');
    say('而剩下四個。','em');
    say('','gap');
    say('而高志遠一個人擋不住四個。','em');
    S.subdued = 3;
    S.done = true; S.ending = 'solo';
    return S;
  }

  if (id === 'behind'){
    S.uses -= 3; S.cun -= 60; S.wound = 2;
    say('高志遠站住。','em');
    say('','gap');
    say('而他不動。','dim');
    say('而那七個人全部往他身上去。','dim');
    say('','gap');
    say('而你繞到後面。','em');
    say('','gap');
    say('一個一個壓下去。','dim');
    S.subdued = 7;
    S.await = 'fallen';
    return S;
  }

  if (id === 'weak'){
    S.uses -= 1; S.cun -= 20; S.wound = 1;
    say('你先處理那個站不穩的。','em');
    say('','gap');
    say('而他一下就倒了。','dim');
    say('','gap');
    say('而剩下六個那一秒停了半秒。','em');
    say('','gap');
    say('因為他們看到了。','dim');
    say('','gap');
    say('而那半秒夠高志遠往前一步。','em');
    S.subdued = 7;
    S.await = 'fallen';
    return S;
  }
  return S;
}

/* ── 而中間有一個人倒下了 ─────────────── */
export const FALLEN = [
  { id:'save',   label:'叫林若霜去救',
    note:'而那個人是對面。而她的精氣會少一次' },
  { id:'nosave', label:'不叫',
    note:'而她感覺得到那個人在往下掉' },
];

export function fallen(S, id){
  const say = (t,s='') => S.log.push({ t, s, clock: fmt(S.t) });
  S.await = null;
  S.t += 20;

  say('','gap');
  say('而中間有一個人倒下了。','em');
  say('','gap');
  say('不是你。','dim');
  say('是那七個裡面的一個——','dim');
  say('他被推得太過頭，而他自己撐不住。','dim');
  say('','gap');
  say('而林若霜五十公尺內感知得到。','dim');
  say('','gap');
  say('而她的目標是隊友。','em');
  say('','gap');
  say('而那個人不是隊友。','em');
  say('','gap');

  if (id === 'save'){
    say('你叫了。');
    say('','gap');
    say('而她那一秒沒有問為什麼。','dim');
    say('','gap');
    say('她過去了。','em');
    say('','gap');
    say('而她的精氣剩不到三分之一。','dim');
    S.flags.saved = true;
    S.done = true; S.ending = 'saved';
    return S;
  }

  say('你沒有叫。');
  say('','gap');
  say('而她站在那裡。','dim');
  say('','gap');
  say('而她感覺得到那個人在往下掉。','em');
  say('','gap');
  say('而《世界規則》沒有寫這一條。','dim');
  say('','gap');
  say('因為茲克瓦那一年，反抗方從頭到尾的目標都是制伏。','dim');
  say('','gap');
  say('所以那七個人，本來就不是敵人。','em');
  S.done = true; S.ending = 'nosave';
  return S;
}

export const ENDING = {
  passed: {
    t:'而那件事是兩個人去的。',
    s:'而沒有人找你談。<br>而界不會罰你。<br><br>' +
      '<b>而那正好是最難的地方。</b>',
    tail:'加入界的實際意思只有一個：你同意在有事的時候被派遣。' },
  solo: {
    t:'你壓下了三個。',
    s:'而剩下四個。<br>而高志遠一個人擋不住四個。<br><br>' +
      '<b>而這一場不是靠你的能力打贏的。</b>',
    tail:'你有三次。而對面七個。算不過來。' },
  saved: {
    t:'七個人全部制伏。沒有人死。',
    s:'你的傷 2 級。高志遠 3 級。<br>' +
      '而林若霜 0 級——而她的精氣剩不到三分之一。<br><br>' +
      '<b>而她在現場就處理了。而那是零元。</b>',
    tail:'而丙模式那一天，2 級的傷是八千塊，跟一個沒有登記的地方。' },
  nosave: {
    t:'七個人全部制伏。',
    s:'而那個倒下的，後來怎麼樣，回報上不會寫。<br><br>' +
      '<b>而回報是林雪芸讀的。</b><br>' +
      '而她每天讀完所有進來的東西。',
    tail:'而她記得幾百個名字，加上每一張臉。' },
};
