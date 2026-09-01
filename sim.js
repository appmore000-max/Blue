/* 對練場．推演器（模組版）
   而它不是動作遊戲。它是一個把設計跑一遍、看規則會不會垮的東西。 */

/* ── 硬限制。而每一條都來自小說 ───────── */
export const HARD = {
  shunfeng: {
    unbeatable: true,
    note: '而輸的方式不是被打倒。是東西全部到位了，而什麼都沒有發生',
    onlyEnd: '你自己停下來。跟那三個人一樣'
  },
  chen_tingya: {
    gate: '那一發要先成立「那個東西擋得住她」',
    needsWeapon: '手上沒有槍，那個東西連影子都不會出現。而那不是消耗不足——那是不存在',
    noCover: '沒有掩體對她是致命的。因為她的整套是為了不打近身'
  },
  lin_ruoshuang: { noOffense: '她不處置對手。她處置傷者', cap: '五十公尺。而她試了五年，那個數字一次都沒有動過' },
  hei_shi: { onlyStand: '他沒有那種技術。他只會不倒', shield: '那面盾是輕的。到得快，而擋得少' },
  ahe: { weather: '陰天只剩約兩成', barrier: '白天結界：十六歲九分鐘。而把範圍收小＝延長' },
  su_yue: { night: '而她晚上看得到。而多數人看不到' },
  huabang: { slow: '他不會做兩次。而那不是冷卻——那是那個人的屬性', reads: '危險感知讀一兩分鐘。而他的打法是不動' },
  aren: { forced: '十七歲硬逼過一次。而有一個地方沒有回來' },
  azhi: { forced: '而他硬逼過。上限少了一截' },
  yuanzou: { nothing: '他什麼都沒有。而他有二十幾年只做觀察' },
  chen_zairen: { stone: '多數東西打不進去。而他自己不知道' },
  zhang_fugui: { human: '一百零二歲。凡人' },
  yu_lengchuan: { human: '而他記得每一件事。而那在對練場沒有用' },
  lin_xueyun: { human: '' }, xiao_yuyan: { human: '' }, bai_lan: { human: '' },
};

export const NO_WIN = ['lin_ruoshuang','yuanzou','chen_zairen','zhang_fugui','yu_lengchuan','lin_xueyun','xiao_yuyan','bai_lan'];

/* 處置格。而不是每個人都能選 */
export const GATE = {
  zhang_zhenqi:{can:['release','subdue','cripple','kill','leave'],note:'她可以停在任何一格。而那是五歲起的累積'},
  chen_tingya:{can:['release','subdue','cripple','kill','leave'],note:'而她的職業就是最後一格'},
  huabang:{can:['release','subdue','cripple','kill','leave'],note:'而他要付一次。而他只剩三次'},
  cheng_yijin:{can:['release','subdue','leave'],note:'不是做不到。是他的整套設計是為了不走到那一步'},
  gao_zhiyuan:{can:['subdue','leave'],note:'他是擋的，不是輸出的'},
  hei_shi:{can:['leave'],note:'他沒有那種技術。他只會不倒'},
  lin_ruoshuang:{can:[],note:'她不處置對手。她處置傷者'},
  ahe:{can:['subdue'],note:'他打不贏多數'},
  shunfeng:{can:['stop_it'],note:'誓約。而「讓那件事停下來」不是五格裡的任何一格'},
};
export const GATE_LABEL={release:'放走',subdue:'制伏',cripple:'廢掉',kill:'殺',leave:'不處置',stop_it:'讓那件事停下來'};

const BAND = { fast:0.22, normal:0.14, slow:0.07 };

/* ── 建戰鬥用的狀態 ─────────────────── */
function build(R, id, cond, at){
  const c = R[id];
  /* ⚠ 選年份不是把數字調低。那是不同的人。
     所以存、體、防護、招數全部換掉。 */
  const y = at && at[id];
  const base = y ? {
    cun: y.cun ?? c.cun, sta: y.sta ?? c.sta,
    guard: y.guard, abN: y.abilities,
  } : null;

  const cun = (base ? base.cun : c.cun) ?? 0;
  let mult = 1, notes = [];
  if (y){
    notes.push(`${y.label}：${y.note || ''}`);
    if (y['⚠']) notes.push(y['⚠']);
    if (y.cunNote) notes.push(y.cunNote);
  }

  if (id === 'ahe'){
    if (cond.sky === '陰'){ mult = 0.2; notes.push('陰天：那三項只剩約兩成'); }
    else notes.push('晴天：而他還是三個人裡最弱的');
  }
  if (id === 'su_yue'){
    if (cond.time === '夜'){ notes.push('夜間：而她看得到，多數人看不到'); mult = 1.15; }
    else { notes.push('白天：而她跟所有人一樣'); mult = 0.8; }
  }
  if (id === 'chen_tingya'){
    if (!cond.cover){ notes.push('沒有掩體：而她的整套是為了不打近身'); mult = 0.55; }
    else notes.push('有掩體：而那是她要的距離');
  }
  if (id === 'hei_shi' && cond.terrain === '狹窄') notes.push('狹窄：而一個不追的重型會把空間吃掉');

  /* 防護係數。而它不是血量——是「打進去多少」 */
  const GUARD = { hei_shi:0.42, gao_zhiyuan:0.5, chen_zairen:0.15, qiangzang:0.7,
                  aren:0.72, cheng_yijin:0.85, zhang_zhenqi:0.8, wu_ziyi:0.85,
                  huabang:0.55, ahe:1.0, chen_tingya:1.15, su_yue:1.0 };

  return {
    id, name: c.name, role: c.role, sig: c.sig || c.roleNote || '',
    cunMax: Math.round(cun * mult), cun: Math.round(cun * mult),
    regen: BAND[c.regen] ?? 0.10,
    staMax: (base ? base.sta : c.sta) ?? 0, sta: (base ? base.sta : c.sta) ?? 0,
    guard: (base && base.guard != null) ? base.guard : (GUARD[id] ?? 1),
    /* 他不是靠打贏的，是靠不倒。
       ⚠ 而那面盾是二〇二二年之後才做的。所以三十八歲那一年他還沒有。 */
    stand: id === 'hei_shi' && !(y && y.age < 41),
    down: false, yielded: false, stopped: false,
    ben: c.ben, benUsed: c.benUsed,
    /* 招數：那一年他還沒有那麼多 */
    ab: (base && base.abN != null) ? (c.ab || []).slice(0, base.abN) : (c.ab || []),
    year: y || null,
    notes, log: []
  };
}

/* ── 推演 ───────────────────────────── */
/* 消耗表。而它要對得上資料裡實際出現的每一種 —— 否則會被當成預設值，
   而那等於把設定拆掉。 */
export const COST = {
  very_low:4, low:7, medium:14, high:22, very_high:34,
  scaling:12, variable:12,
  0:0,                 /* 林若霜的緊急外科不是能力。是醫學系七年＋急診科 */
  ALL:9999,            /* 集中精神／解除禁制：全部 */
  double:9999,         /* 吳紫儀的解放：氣量耗盡即強制解除 */
  LIFE:9999,           /* 強葬的爆發：燃燒氣血與壽命。而那不是存，也不是本 */
  BEN:9999,            /* 阿智的解禁自身：扣的是本。而且不是他啟動的 */
};

/* 而有幾項不該被隨機挑到 */
const NOT_CHOSEN = new Set([
  'LIFE',    /* 沒贏就變成待宰羔羊 */
  'BEN',     /* 臨界點時被強制推進。不是他啟動的 */
  'double',  /* 對身體造成極大負擔 */
  'ALL',
]);

function abCost(a){
  const c = a.cost;
  if (c && typeof c === 'object') return COST[c.loaded_shot] ?? 12;   /* 陳婷雅 */
  return COST[c] ?? 12;
}
function selectable(a){
  return !NOT_CHOSEN.has(a.cost) && !(a.cost && typeof a.cost === 'object' && false);
}

/* 每一擊的體力傷害。而它要小——因為這個世界的仗打得久，
   而結束多半不是被打倒，是資源先見底。 */
const HIT = { ability:6, body:3 };

export function sim(R, aId, bId, cond, maxTurns = 40, at = null){
  const L = [];
  /* ⚠ 每一行要帶那一刻的狀態 —— 否則畫面跟不動。
     而存跟體是兩個東西，不能合成一條。 */
  let _A = null, _B = null;
  const snap = () => (_A && _B) ? {
    a: { cun: Math.max(0,_A.cun)/(_A.cunMax||1), sta: Math.max(0,_A.sta)/(_A.staMax||1) },
    b: { cun: Math.max(0,_B.cun)/(_B.cunMax||1), sta: Math.max(0,_B.sta)/(_B.staMax||1) },
  } : null;
  const say = (t, s='', side=null) => L.push({t, s, side, at: snap()});

  const tag = k => (at && at[k]) ? `（${at[k].label}）` : '';
  say(`${R[aId].name}${tag(aId)}　對　${R[bId].name}${tag(bId)}`, 'head');
  say(`${cond.sky}／${cond.time}／${cond.terrain}／${cond.cover?'有掩體':'沒有掩體'}`, 'cond');

  /* 順風：不是對手，是一個示範 */
  if (aId === 'shunfeng' || bId === 'shunfeng'){
    const you = aId === 'shunfeng' ? bId : aId;
    say('', 'gap');
    say(`${R[you].name} 動了。`);
    say('而東西全部到位了。');
    say('而什麼都沒有發生。', 'em');
    say('', 'gap');
    say('傷害不顯示 0。是不出現。', 'dim');
    say('沒有 MISS——因為你打中了。', 'dim');
    say('他不動。', 'dim');
    say('', 'gap');
    say('而你的存在掉。而他的什麼都沒有變。', 'em');
    say('', 'gap');
    say('你換了打法。更重。更快。從後面——而他沒有背面。', 'dim');
    say('遠距。而沒有用。', 'dim');
    if (R[you].ben) say('你動了本。而沒有用。而你付了。', 'dim');
    say('', 'gap');
    say('而你停下來了。', 'em');
    return { L, end:'stopped', winner:null,
      tail:'而那是唯一的結束方式。跟那三個人一樣。', line:'你是第四個。' };
  }

  const A = build(R, aId, cond, at), B = build(R, bId, cond, at);
  _A = A; _B = B;
  [A,B].forEach(x => x.notes.forEach(n => say(`${x.name}：${n}`, 'dim')));

  const aNoWin = NO_WIN.includes(aId), bNoWin = NO_WIN.includes(bId);
  if (aNoWin && bNoWin){
    say('', 'gap');
    say('而兩個人都不能贏。', 'em');
  }

  let end = null, winner = null, tail = '';

  for (let t = 1; t <= maxTurns && !end; t++){
    for (const [me, foe, meNoWin] of [[A,B,aNoWin],[B,A,bNoWin]]){
      if (end) break;

      /* 阿和：陰天的第一個動作是把陰天變成晴天。而現在有一個計時器 */
      if (me.id === 'ahe' && cond.sky === '陰'){
        if (t === 1){
          me.barrier = 18;   /* 九分鐘 ≈ 18 回合 */
          me.cunMax = Math.round(R.ahe.cun); me.cun = me.cunMax;
          say(`1　${me.name}　白天結界。`, 'act');
          say(`　　而那不是攻擊。那是把陰天變成晴天——只在一小塊地方。`, 'dim');
          say(`　　而現在有一個計時器。九分鐘。`, 'em');
          continue;
        }
        if (me.barrier > 0){
          me.barrier--;
          if (me.barrier === 8){
            me.barrier += 6;
            say(`${t}　${me.name} 把那個範圍收小了。`, 'act');
            say(`　　而收小的意思是：延長。`, 'em');
          }
          if (me.barrier === 0){
            me.cunMax = Math.round(R.ahe.cun * 0.2); me.cun = Math.min(me.cun, me.cunMax);
            say(`${t}　結界結束。而他回到陰天。`, 'em');
          }
        }
      }

      /* 華邦：他不會做兩次 */
      if (me.id === 'huabang'){
        if (t % 2 === 0){
          say(`${t}　${me.name} 不動。而危險感知讀一兩分鐘。`, 'dim');
          continue;
        }
      }

      /* 黑石：他停下來。而一個站著不動的黑石，體力不會掉 */
      if (me.stand && foe.cun < foe.cunMax * 0.5){
        if (!me.stood){ me.stood = true;
          say(`${t}　${me.name} 停下來了。`, 'em');
          L[L.length-1].halt = me === A ? 'a' : 'b';
          say(`　　而一個站著不動的他，體力不會掉。`, 'dim');
        }
        me.sta = Math.min(me.staMax, me.sta + 3);
        continue;
      }

      /* 不能贏那一組：不進攻 */
      if (meNoWin){
        if (t === 1) say(`${t}　${me.name} 沒有動。`, 'dim');
        me.sta = Math.min(me.staMax, me.sta + 4);
        continue;
      }

      /* 沒有招的（純體術）：只耗體 */
      const usable = me.ab.filter(a => selectable(a) && abCost(a) <= me.cun);
      let acted = false;

      /* 存的比例，決定出手的品質。而那才是「不需要贏，只需要不輸」的形式 */
      const edge = me.cunMax ? Math.max(0.35, me.cun / me.cunMax) : 0.5;

      if (usable.length && me.cun > 0){
        const a = usable[Math.floor(Math.random()*usable.length)];
        const c = abCost(a);
        me.cun -= c;
        acted = true;

        /* 陳婷雅的開關 */
        if (me.id === 'chen_tingya'){
          const hasDefense = ['hei_shi','gao_zhiyuan','chen_zairen','ahe','zhang_zhenqi','wu_ziyi','cheng_yijin','qiangzang'].includes(foe.id);
          if (!hasDefense){
            me.cun += c;
            say(`${t}　${me.name} 判斷：${foe.name} 身上沒有擋得住她的東西。那一發不觸發。`, 'dim');
            say(`　　而她用普通的一發。零消耗。`, 'dim');
            foe.sta -= HIT.ability * 0.9 * (foe.guard ?? 1); acted = true;
          } else {
            say(`${t}　${me.name}：那個東西擋得住我。那一發成立。（存 −${c}）`, 'act', me === A ? 'a' : 'b');
            foe.sta -= HIT.ability * 2.2 * edge * (foe.guard ?? 1);
          }
        } else {
          say(`${t}　${me.name}　${a.label || a.id}（存 −${c}）`, 'act', me === A ? 'a' : 'b');
          foe.sta -= (HIT.ability + Math.random()*3) * edge * (foe.guard ?? 1);
        }
      }

      if (!acted){
        /* 存空了。而人還在 */
        if (me.cun <= 0 && me.cunMax > 0){
          if (!me.emptied){
            me.emptied = true;
            say(`${t}　${me.name} 的存空了。`, 'em');
            say(`　　而那不是輸。他還能跑、還能用技術。`, 'dim');
          }
        }
        me.sta -= HIT.body * 0.6;
        foe.sta -= HIT.body * (foe.guard ?? 1);
        say(`${t}　${me.name} 用身體。`, 'dim', me === A ? 'a' : 'b');
      }

      /* 不動就不掉。而恢復 */
      foe.cun = Math.min(foe.cunMax, foe.cun + foe.cunMax * foe.regen * 0.25);

      /* 結束判定 */
      if (foe.sta <= 0){
        foe.down = true;
        end = 'down'; winner = me.id;
        say('', 'gap');
        say(`${foe.name} 動不了了。`, 'em');
        L[L.length-1].down = foe === A ? 'a' : 'b';
        tail = '而他清醒。';
        break;
      }
      if (me.cun <= 0 && me.emptied && me.sta < me.staMax * 0.55 && Math.random() < 0.5){
        end = 'yield'; winner = foe.id;
        say('', 'gap');
        say(`${me.name} 認輸。`, 'em');
        L[L.length-1].yield = me === A ? 'a' : 'b';
        tail = '我打不贏。';
        break;
      }
    }
  }

  if (!end){
    if (aNoWin || bNoWin){
      end = 'stopped'; 
      const who = aNoWin ? A : B;
      say('', 'gap');
      say(`${who.name} 停下來了。`, 'em');
      tail = '而那不是認輸。是我不打了。而沒有人贏。';
    } else {
      end = 'time';
      say('', 'gap');
      say('時間到。', 'em');
      tail = '平手。';
    }
  }
  return { L, end, winner, tail, A, B };
}

export const END_LABEL = { down:'一方存空了，而且動不了', yield:'認輸', time:'時間到 → 平手', stopped:'一方停下來' };
