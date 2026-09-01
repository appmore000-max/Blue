/* 那條路
 *
 * 而這不是一個泛泛的開放世界。這是書裡那一條。
 *
 *   而那條路要走一公里。
 *   而柏油變成碎石大概在三分之二的地方。
 *   而他走那一公里要十四分鐘。
 *   而他走到最後那個彎的時候停下來。
 *   而他站兩秒。
 *
 * 所以：一公里、三分之二處換碎石、最後一個彎、空地二十幾公尺見方。
 * 而那些數字全部是書裡寫的。
 */

import * as THREE from './three.module.min.js';

/* ── 那些數字 ─────────────────────── */
export const ROAD = {
  length: 1000,          /* 一公里 */
  gravelAt: 0.667,       /* 三分之二的地方 */
  width: 3.4,            /* 一條產業道路 */
  clearing: 24,          /* 空地二十幾公尺見方 */
  walkMin: 14,           /* 而他走那一公里要十四分鐘 */
};

/* 而他走十四分鐘一公里 = 1.19 m/s。而那是一個五十幾歲的人的速度 */
export const WALK = ROAD.length / (ROAD.walkMin * 60);
export const RUN  = WALK * 2.6;

/* 那條線。而它是書裡十三筆 */
export const CIRCLE = [
  ['3/11',27],['4/8',28],['5/6',28],['6/17',29],['6/24',29],
  ['8月底',31],['9/9',41],['10/7',44],['10/21',46],
  ['11/4',49],['11/7',51],['11/19',53],['12/2',56],
];

/* ── 顏色 ─────────────────────────
 * ⚠ 這一套跟文字介面那一套是不一樣的，而那是刻意的。
 *
 *   文字介面沒有重點色 —— 因為這本書從來沒有大聲講過話。
 *   而這個世界要看起來像一個真的地方。
 *
 * 而「那個還沒有決定的天色」不是黑的。它是淡的。 */
const C = {
  sky:     0xA6B2BA,   /* 那個還沒有決定的顏色。不是藍的，也不是灰的 */
  skyLow:  0xC2C8C6,   /* 而靠地平線那一段更淡 */
  fog:     0xAEB8BE,
  road:    0x4B4F53,   /* 柏油 */
  roadPat: 0x565A5C,   /* 而補過的那一塊比較新 */
  gravel:  0x8A8072,   /* 碎石。而它是暖的 */
  earth:   0x453F33,   /* 落葉層 */
  trunk:   0x4A4238,   /* 相思樹 */
  leafA:   0x4E5C3E,   /* 而山上的綠是悶的 */
  leafB:   0x5C6A44,
  bamboo:  0x6E7A4A,   /* 竹 */
  grass:   0xA79A80,   /* 芒草 */
  rail:    0x8E9194,   /* 護欄。鍍鋅 */
  mirrorF: 0xC4622E,   /* 反光鏡那個橘 —— 而那是這條路唯一的顏色 */
  pole:    0x736E66,   /* 電線桿 */
  tin:     0x7E7468,   /* 鐵皮 */
  person:  0x3E464C,
  personS: 0xB8AFA2,
  thing:   0xDCE2E6,   /* 而它是亮的。因為它在那裡 */
};

/* ── 那條路的形狀 ─────────────────── */
/* 一條會彎的路。而最後那個彎是重點 */
export function roadCurve(){
  const p = [];
  const L = ROAD.length;
  for (let i = 0; i <= 40; i++){
    const t = i / 40;
    const z = -t * L;
    /* 前面幾乎直，而越後面彎越多 */
    const x = Math.sin(t * 3.1) * 14 * t + Math.sin(t * 8.4) * 4 * t * t;
    const y = t * 46;           /* 往山上 */
    p.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(p);
}

export function build(scene, curve){
  scene.background = new THREE.Color(C.sky);
  /* 霧要遠一點。而近的地方要看得見 —— 這是山上，不是山洞 */
  scene.fog = new THREE.Fog(C.fog, 60, 420);

  /* 早上的光。而山上的早上是散的，不是直的 */
  scene.add(new THREE.HemisphereLight(C.sky, C.earth, 2.1));
  const sun = new THREE.DirectionalLight(0xFFF2DE, 1.15);
  sun.position.set(-60, 80, 40);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x8894A0, 0.5));

  const g = new THREE.Group();
  const L = (c) => new THREE.MeshLambertMaterial({ color: c });

  /* ── 地 ───────────────────────── */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 1600, 1, 1), L(C.earth));
  ground.rotation.x = -Math.PI/2;
  ground.position.set(0, -1.2, -ROAD.length/2);
  g.add(ground);

  /* ── 路面。三分之二處換碎石 ──────── */
  const seg = 200;
  const strip = (from, to, color, lift=0) => {
    const pos = [], idx = [];
    for (let i = from; i <= to; i++){
      const t = i/seg;
      const p = curve.getPointAt(t), tan = curve.getTangentAt(t);
      const n = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const w = ROAD.width/2;
      pos.push(p.x - n.x*w, p.y+lift, p.z - n.z*w);
      pos.push(p.x + n.x*w, p.y+lift, p.z + n.z*w);
    }
    for (let i = 0; i < to-from; i++){
      const a = i*2; idx.push(a,a+1,a+2, a+1,a+3,a+2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
    geo.setIndex(idx); geo.computeVertexNormals();
    return new THREE.Mesh(geo, L(color));
  };
  const cut = Math.floor(seg * ROAD.gravelAt);
  g.add(strip(0, cut, C.road));
  g.add(strip(cut, seg, C.gravel));
  /* 而那一段柏油是補過的。市公所這個月補的 */
  g.add(strip(cut-26, cut-6, C.roadPat, 0.012));

  const at = t => {
    const p = curve.getPointAt(t), tan = curve.getTangentAt(t);
    const n = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    return { p, n, tan };
  };
  const put = (mesh, t, off, y=0, side=1) => {
    const { p, n } = at(t);
    mesh.position.set(p.x + n.x*off*side, p.y + y, p.z + n.z*off*side);
    g.add(mesh); return mesh;
  };

  /* ── 樹。相思樹跟竹 ──────────────── */
  const trunkG = new THREE.CylinderGeometry(0.13, 0.22, 1, 5);
  const leafG  = new THREE.SphereGeometry(1, 7, 5);
  const N = 520;
  const tI = new THREE.InstancedMesh(trunkG, L(C.trunk), N);
  const lI = new THREE.InstancedMesh(leafG,  L(C.leafA), N);
  const l2 = new THREE.InstancedMesh(leafG,  L(C.leafB), N);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion();
  let n1=0, n2=0;
  for (let i = 0; i < N; i++){
    const t = Math.random();
    const { p, n } = at(t);
    const side = Math.random() < 0.5 ? -1 : 1;
    const off = ROAD.width/2 + 1.4 + Math.random()*20;
    const x = p.x + n.x*off*side, z = p.z + n.z*off*side;
    const near = 1 - Math.min(1, (off - ROAD.width/2) / 14);
    const h = 3.2 + Math.random()*6.5 - near*1.8;
    m.compose(new THREE.Vector3(x, p.y + h/2 - 0.4, z), q, new THREE.Vector3(1, h, 1));
    tI.setMatrixAt(i, m);
    const r = 1.3 + Math.random()*2.1 - near*0.5;
    m.compose(new THREE.Vector3(x, p.y + h + r*0.4, z), q,
              new THREE.Vector3(r, r*0.66, r));
    (i % 3 ? lI : l2).setMatrixAt(i % 3 ? n1++ : n2++, m);
  }
  lI.count = n1; l2.count = n2;
  g.add(tI, lI, l2);

  /* ── 芒草。而那是台灣山路邊最多的東西 ─ */
  const bladeG = new THREE.PlaneGeometry(0.5, 1.5);
  const gm = new THREE.MeshLambertMaterial({ color: C.grass, side: THREE.DoubleSide,
    transparent:true, opacity:0.9 });
  const gI = new THREE.InstancedMesh(bladeG, gm, 900);
  const e = new THREE.Euler();
  for (let i = 0; i < 900; i++){
    const t = Math.random();
    const { p, n } = at(t);
    const side = Math.random() < 0.5 ? -1 : 1;
    const off = ROAD.width/2 + 0.2 + Math.random()*3.2;
    e.set(0, Math.random()*Math.PI, (Math.random()-0.5)*0.5);
    q.setFromEuler(e);
    const h = 0.7 + Math.random()*1.1;
    m.compose(new THREE.Vector3(p.x + n.x*off*side, p.y + h*0.6, p.z + n.z*off*side),
              q, new THREE.Vector3(1, h, 1));
    gI.setMatrixAt(i, m);
  }
  g.add(gI);

  /* ── 電線桿＋電線。而那是台灣 ─────── */
  const poleG = new THREE.CylinderGeometry(0.14, 0.18, 8.5, 6);
  const armG  = new THREE.BoxGeometry(1.5, 0.09, 0.09);
  const wirePts = [];
  for (let i = 0; i < 9; i++){
    const t = 0.04 + i*0.11;
    if (t > 1) break;
    const { p, n } = at(t);
    const pole = new THREE.Mesh(poleG, L(C.pole));
    put(pole, t, ROAD.width/2 + 1.1, 4.0, -1);
    const arm = new THREE.Mesh(armG, L(C.pole));
    put(arm, t, ROAD.width/2 + 1.1, 7.6, -1);
    arm.lookAt(pole.position.x + n.x, arm.position.y, pole.position.z + n.z);
    wirePts.push(new THREE.Vector3(pole.position.x, p.y + 7.4, pole.position.z));
  }
  if (wirePts.length > 1){
    for (const dz of [-0.32, 0, 0.32]){
      const sag = wirePts.map((v,i) => new THREE.Vector3(v.x+dz, v.y - (i%2?0.22:0.18), v.z));
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(sag),
        new THREE.LineBasicMaterial({ color: 0x3A3E42 }));
      g.add(line);
    }
  }

  /* ── 護欄。而只有外側那邊有 ───────── */
  const railM = L(C.rail);
  for (let i = 0; i < 34; i++){
    const t = 0.32 + i*0.02;
    if (t > 0.98) break;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.8, 0.09), railM);
    put(post, t, ROAD.width/2 + 0.45, 0.3, 1);
    if (i % 1 === 0){
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 1.9), railM);
      const b = put(beam, t + 0.01, ROAD.width/2 + 0.45, 0.62, 1);
      const { tan } = at(t);
      b.lookAt(b.position.x + tan.x, b.position.y, b.position.z + tan.z);
    }
  }

  /* ── 反光鏡。而它在最後那個彎 ─────── */
  const mp = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,2.6,6), L(C.pole));
  put(mp, 0.955, ROAD.width/2 + 0.9, 1.3, 1);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.055, 6, 20),
    new THREE.MeshLambertMaterial({ color: C.mirrorF }));
  const fr = put(frame, 0.955, ROAD.width/2 + 0.9, 2.5, 1);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.40, 20),
    new THREE.MeshLambertMaterial({ color: 0xB6BEC2 }));
  const fa = put(face, 0.955, ROAD.width/2 + 0.87, 2.5, 1);
  { const { p } = at(0.90);
    fr.lookAt(p.x, 2.5, p.z); fa.lookAt(p.x, 2.5, p.z); }

  /* ── 里程樁 ───────────────────── */
  for (let i = 1; i <= 4; i++){
    const t = i/5;
    const k = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.12),
      new THREE.MeshLambertMaterial({ color: 0xD8D2C6 }));
    put(k, t, ROAD.width/2 + 0.6, 0.16, -1);
  }

  /* ── 那間鐵皮的。而它空著 ────────── */
  {
    const t = 0.46;
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.5, 3.2), L(C.tin));
    put(body, t, 9.5, 1.25, -1);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.14, 3.8), L(0x8C8478));
    put(roof, t, 9.5, 2.58, -1);
  }

  /* ── 空地 ─────────────────────── */
  const end = curve.getPointAt(1), tanEnd = curve.getTangentAt(1);
  const cPos = end.clone().addScaledVector(tanEnd, ROAD.clearing*0.55);
  const clearing = new THREE.Mesh(
    new THREE.CircleGeometry(ROAD.clearing/2, 28), L(C.gravel));
  clearing.rotation.x = -Math.PI/2;
  clearing.position.copy(cPos); clearing.position.y += 0.02;
  g.add(clearing);

  scene.add(g);
  return { clearing: cPos, sun };
}

/* ── 那個東西 ───────────────────────
   而它繞著同一片空地。而它從來沒有出去過。 */
export function makeThing(scene, at){
  const geo = new THREE.IcosahedronGeometry(0.62, 1);
  const mat = new THREE.MeshBasicMaterial({
    color: C.thing, wireframe: true, transparent: true, opacity: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(at);
  scene.add(mesh);
  return {
    mesh, at,
    /* @param secs 繞一圈要幾秒 —— 而那是書裡那條線 */
    tick(t, secs){
      const a = (t / secs) * Math.PI * 2;
      const r = ROAD.clearing * 0.36;
      mesh.position.set(at.x + Math.cos(a)*r, at.y + 0.9, at.z + Math.sin(a)*r);
      mesh.rotation.y = -a;
      mesh.rotation.x = t * 0.4;
    }
  };
}

/* ── 那個人 ───────────────────────── */
export function makePerson(scene){
  const g = new THREE.Group();
  const mat  = new THREE.MeshLambertMaterial({ color: C.personS });  /* 皮膚 */
  const dark = new THREE.MeshLambertMaterial({ color: C.person });   /* 那件深色外套 */

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.5, 3, 7), dark);
  torso.position.y = 1.06; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 10, 8), mat);
  head.position.y = 1.53; g.add(head);

  const limb = (x, y, len, m) => {
    const p = new THREE.Group(); p.position.set(x, y, 0);
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, len, 3, 6), m);
    mesh.position.y = -len/2; p.add(mesh); g.add(p); return p;
  };
  const parts = {
    armL: limb(-0.235, 1.28, 0.46, dark),
    armR: limb( 0.235, 1.28, 0.46, dark),
    legL: limb(-0.105, 0.78, 0.62, dark),
    legR: limb( 0.105, 0.78, 0.62, dark),
  };
  scene.add(g);

  return {
    root: g, parts, phase: 0,
    /* 走路。而不是跑 */
    step(dt, speed){
      this.phase += dt * speed * 2.1;
      const s = Math.sin(this.phase), c = Math.cos(this.phase);
      const amp = Math.min(1, speed / WALK) * 0.52;
      parts.legL.rotation.x =  s * amp;
      parts.legR.rotation.x = -s * amp;
      parts.armL.rotation.x = -s * amp * 0.8;
      parts.armR.rotation.x =  s * amp * 0.8;
      g.position.y += 0;
      torso.position.y = 1.06 + Math.abs(c) * 0.012 * amp;
    },
    idle(){
      this.phase = 0;
      parts.legL.rotation.x = parts.legR.rotation.x = 0;
      parts.armL.rotation.x = parts.armR.rotation.x = 0;
    }
  };
}
