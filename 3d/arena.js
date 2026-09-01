/* 對練場．畫面
 *
 * 而這裡不是血條互砍。
 *
 *   存空了 —— 那個東西沒有了。而人還在，還能跑，還能用技術。
 *
 * 所以存跟體是兩條，而它們的意思不一樣：
 *   存空了不是輸。體空了才是動不了。
 *
 * 而場上沒有第四格。對練場不能殺。
 */

import * as THREE from '../3d/three.module.min.js';

const C = {
  floor:  0x3A3D40,   /* 水泥 */
  line:   0x55595C,   /* 而地上有一個圈 */
  wall:   0x2A2D30,
  sky:    0x1B1E22,
  A:      0x8FA6B4,   /* 左邊那一個 */
  B:      0xB49A8F,   /* 右邊那一個 */
  skin:   0xB8AFA2,
  cun:    0x9AA6AE,   /* 存 */
  sta:    0xC4A88F,   /* 體 */
  guard:  0x8E9194,
};

export const RING = 11;

function figure(scene, color){
  const g = new THREE.Group();
  const body = new THREE.MeshLambertMaterial({ color });
  const skin = new THREE.MeshLambertMaterial({ color: C.skin });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.52, 3, 8), body);
  torso.position.y = 1.08; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), skin);
  head.position.y = 1.56; g.add(head);

  const limb = (x, y, len) => {
    const p = new THREE.Group(); p.position.set(x, y, 0);
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, len, 3, 6), body);
    mesh.position.y = -len/2; p.add(mesh); g.add(p); return p;
  };
  const parts = {
    armL: limb(-0.245, 1.30, 0.48), armR: limb(0.245, 1.30, 0.48),
    legL: limb(-0.11, 0.80, 0.64),  legR: limb(0.11, 0.80, 0.64),
    torso, head,
  };
  scene.add(g);
  return { root: g, parts, phase: 0, down: false };
}

export function startArena(mount){
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.sky);
  scene.fog = new THREE.Fog(C.sky, 20, 60);

  const cam = new THREE.PerspectiveCamera(46, 1, 0.1, 200);
  const renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  mount.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0x9FB0BC, 0x1A1D20, 1.6));
  const key = new THREE.DirectionalLight(0xFFF4E4, 0.85);
  key.position.set(6, 12, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0x7E93A4, 0.5);
  rim.position.set(-8, 5, -10); scene.add(rim);

  /* 地。而它是室內的水泥 */
  const floor = new THREE.Mesh(new THREE.CircleGeometry(RING + 5, 48),
    new THREE.MeshLambertMaterial({ color: C.floor }));
  floor.rotation.x = -Math.PI/2; scene.add(floor);

  /* 而地上有一個圈。它不是規則 —— 它只是畫在那裡 */
  const ring = new THREE.Mesh(new THREE.RingGeometry(RING-0.06, RING, 64),
    new THREE.MeshBasicMaterial({ color: C.line, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI/2; ring.position.y = 0.01; scene.add(ring);

  /* 而外面是牆 */
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(RING+5, RING+5, 9, 40, 1, true),
    new THREE.MeshLambertMaterial({ color: C.wall, side: THREE.BackSide }));
  wall.position.y = 4.5; scene.add(wall);

  const A = figure(scene, C.A), B = figure(scene, C.B);
  A.root.position.set(-3.2, 0, 0);
  B.root.position.set( 3.2, 0, 0);
  A.root.rotation.y =  Math.PI/2;
  B.root.rotation.y = -Math.PI/2;

  /* 而那兩條不是血條。存跟體的意思不一樣 */
  function bar(who, color, yOff){
    const g = new THREE.Group();
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.075),
      new THREE.MeshBasicMaterial({ color: 0x22262A }));
    const fg = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.075),
      new THREE.MeshBasicMaterial({ color }));
    fg.position.z = 0.002;
    g.add(bg, fg); g.position.y = 2.0 + yOff;
    who.root.add(g);
    return { g, fg, set(p){ fg.scale.x = Math.max(0.001, p); fg.position.x = -(1-Math.max(0,p))*0.75; } };
  }
  const bars = {
    a: { cun: bar(A, C.cun, 0.14), sta: bar(A, C.sta, 0) },
    b: { cun: bar(B, C.cun, 0.14), sta: bar(B, C.sta, 0) },
  };

  /* 而出手的時候，有一下 */
  const flashG = new THREE.RingGeometry(0.3, 0.42, 20);
  const flashM = new THREE.MeshBasicMaterial({ color: 0xE6ECEF, transparent:true, opacity:0 });
  const flash = new THREE.Mesh(flashG, flashM);
  flash.rotation.x = -Math.PI/2; flash.position.y = 0.03; scene.add(flash);

  const st = { t:0, camA: 0, beat: null, beatT: 0, dead:false };

  function resize(){
    const w = mount.clientWidth, h = mount.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    cam.aspect = w/h; cam.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(mount); resize();

  const clock = new THREE.Clock();
  let raf = 0;
  function loop(){
    if (st.dead) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    st.t += dt;

    /* 相機慢慢繞。而它不快 —— 因為這裡沒有人在表演 */
    st.camA += dt * 0.08;
    const r = 13.5;
    cam.position.set(Math.sin(st.camA)*r, 6.2, Math.cos(st.camA)*r);
    cam.lookAt(0, 1.1, 0);

    /* 站著的時候，有呼吸 */
    for (const f of [A, B]){
      if (f.down) continue;
      f.phase += dt * 1.6;
      const s = Math.sin(f.phase);
      f.parts.torso.position.y = 1.08 + s*0.012;
      f.parts.armL.rotation.x = s*0.05;
      f.parts.armR.rotation.x = -s*0.05;
    }

    /* 而那一下 */
    if (st.beat){
      st.beatT += dt;
      const k = Math.min(1, st.beatT / 0.42);
      const actor = st.beat.side === 'a' ? A : B;
      const foe   = st.beat.side === 'a' ? B : A;
      if (!actor.down){
        const swing = Math.sin(k * Math.PI);
        actor.parts.armR.rotation.x = -swing * 1.5;
        actor.parts.armL.rotation.x =  swing * 0.5;
        actor.root.position.x += (st.beat.side === 'a' ? 1 : -1) * swing * dt * 1.6;
      }
      if (!foe.down) foe.root.position.x += (st.beat.side === 'a' ? 1 : -1) * swing2(k) * dt * 1.1;
      flashM.opacity = (1-k) * 0.55;
      flash.position.set(foe.root.position.x, 0.03, foe.root.position.z);
      flash.scale.setScalar(1 + k*2.4);
      if (k >= 1){ st.beat = null; st.beatT = 0; }
    } else {
      /* 慢慢回到自己的位置 */
      A.root.position.x += (-3.2 - A.root.position.x) * Math.min(1, dt*1.4);
      B.root.position.x += ( 3.2 - B.root.position.x) * Math.min(1, dt*1.4);
      flashM.opacity *= 0.9;
    }
    renderer.render(scene, cam);
  }
  const swing2 = k => Math.sin(Math.min(1, k*1.4) * Math.PI) * 0.6;
  loop();

  return {
    /* 一步。而它是那一行字對應的動作 */
    beat(side){ st.beat = { side }; st.beatT = 0; },
    set(side, cunP, staP){
      const b = bars[side];
      b.cun.set(cunP); b.sta.set(staP);
    },
    /* 而「動不了」是倒下，不是消失 */
    down(side){
      const f = side === 'a' ? A : B;
      f.down = true;
      f.root.rotation.z = (side === 'a' ? 1 : -1) * Math.PI/2 * 0.92;
      f.root.position.y = 0.22;
    },
    /* 而「停下來」不是倒下 */
    stop(side){
      const f = side === 'a' ? A : B;
      f.parts.armL.rotation.x = f.parts.armR.rotation.x = 0;
      f.phase = 0;
    },
    reset(){
      for (const [f, x] of [[A,-3.2],[B,3.2]]){
        f.down = false; f.root.rotation.z = 0; f.root.position.set(x, 0, 0);
        f.parts.armL.rotation.x = f.parts.armR.rotation.x = 0;
      }
      bars.a.cun.set(1); bars.a.sta.set(1);
      bars.b.cun.set(1); bars.b.sta.set(1);
      flashM.opacity = 0;
    },
    stop3d(){ st.dead = true; cancelAnimationFrame(raf); ro.disconnect();
      renderer.dispose(); mount.innerHTML = ''; },
  };
}
