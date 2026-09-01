/* 那條路．第三人稱
 *
 * WASD 走。滑鼠拖曳看。Shift 快一點。
 * 而「快一點」不是跑 —— 因為他不跑。
 */

import * as THREE from './three.module.min.js';
import { ROAD, WALK, RUN, CIRCLE, roadCurve, build, makeThing, makePerson } from './road.js';

const $ = s => document.querySelector(s);

export function start(mount, opts = {}){
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(58, 1, 0.1, 400);
  const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  mount.appendChild(renderer.domElement);

  const curve = roadCurve();
  const { clearing } = build(scene, curve);
  const thing = makeThing(scene, clearing);
  const me = makePerson(scene);

  /* 起點：路口。而他把車停在下面 */
  const p0 = curve.getPointAt(0);
  me.root.position.copy(p0);
  const state = {
    yaw: Math.PI, pitch: -0.12, dist: 4.6,
    vy: 0, walked: 0, standing: 0,
    dayIdx: 0, t: 0, arrived: false,
    /* 而他到了之後做的事，是數。
       而三次數出來如果不一樣，那本身是資訊。 */
    counting: false, markAt: 0, counts: [], noted: null,
  };

  /* ── 地面高度：離路最近的那一點 ─────── */
  const SAMPLES = 220;
  const pts = [];
  for (let i = 0; i <= SAMPLES; i++) pts.push(curve.getPointAt(i/SAMPLES));
  function groundAt(x, z){
    let best = 0, bd = Infinity;
    for (let i = 0; i <= SAMPLES; i++){
      const p = pts[i];
      const d = (p.x-x)**2 + (p.z-z)**2;
      if (d < bd){ bd = d; best = i; }
    }
    const p = pts[best];
    /* 離路越遠，地形越往下掉。而那不是牆，是斜坡 */
    const off = Math.max(0, Math.sqrt(bd) - ROAD.width/2);
    return { y: p.y - Math.min(off*0.16, 5), t: best/SAMPLES, off };
  }

  /* ── 輸入 ───────────────────────── */
  const key = {};
  addEventListener('keydown', e => {
    key[e.code] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  });
  addEventListener('keyup', e => key[e.code] = false);

  let drag = null;
  const el = renderer.domElement;
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', e => { drag = { x:e.clientX, y:e.clientY }; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointerup',   e => { drag = null; });
  el.addEventListener('pointermove', e => {
    if (!drag) return;
    state.yaw   -= (e.clientX - drag.x) * 0.005;
    state.pitch -= (e.clientY - drag.y) * 0.004;
    state.pitch = Math.max(-0.85, Math.min(0.5, state.pitch));
    drag = { x:e.clientX, y:e.clientY };
  });
  el.addEventListener('wheel', e => {
    e.preventDefault();
    state.dist = Math.max(2.2, Math.min(11, state.dist + e.deltaY*0.005));
  }, { passive:false });

  /* 觸控搖桿 */
  const stick = { on:false, dx:0, dy:0 };
  const pad = $('#stick');
  if (pad){
    const rect = () => pad.getBoundingClientRect();
    const set = e => {
      const r = rect();
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      let dx = (e.clientX - cx) / (r.width/2), dy = (e.clientY - cy) / (r.height/2);
      const L = Math.hypot(dx,dy); if (L > 1){ dx/=L; dy/=L; }
      stick.dx = dx; stick.dy = dy;
      const k = pad.querySelector('i');
      if (k) k.style.transform = `translate(${dx*26}px,${dy*26}px)`;
    };
    pad.addEventListener('pointerdown', e => { stick.on=true; set(e); pad.setPointerCapture(e.pointerId); });
    pad.addEventListener('pointermove', e => { if (stick.on) set(e); });
    const off = () => { stick.on=false; stick.dx=stick.dy=0;
      const k = pad.querySelector('i'); if (k) k.style.transform=''; };
    pad.addEventListener('pointerup', off);
    pad.addEventListener('pointercancel', off);
  }

  /* ── 主迴圈 ─────────────────────── */
  const clock = new THREE.Clock();
  let raf = 0, dead = false;

  function resize(){
    const w = mount.clientWidth, h = mount.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    cam.aspect = w/h; cam.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(mount); resize();

  function loop(){
    if (dead) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    state.t += dt;

    /* 走 */
    let fx = 0, fz = 0;
    if (key.KeyW || key.ArrowUp)    fz -= 1;
    if (key.KeyS || key.ArrowDown)  fz += 1;
    if (key.KeyA || key.ArrowLeft)  fx -= 1;
    if (key.KeyD || key.ArrowRight) fx += 1;
    if (stick.on){ fx += stick.dx; fz += stick.dy; }

    const L = Math.hypot(fx, fz);
    const fast = key.ShiftLeft || key.ShiftRight;
    let speed = 0;

    if (L > 0.08){
      fx /= L; fz /= L;
      speed = fast ? RUN : WALK;
      /* 相機朝向決定前後 */
      const s = Math.sin(state.yaw), c = Math.cos(state.yaw);
      const wx = fx*c - fz*s, wz = fx*s + fz*c;
      const nx = me.root.position.x + wx*speed*dt;
      const nz = me.root.position.z + wz*speed*dt;
      const g = groundAt(nx, nz);
      /* 太陡就走不上去 */
      if (g.off < 26){
        me.root.position.x = nx;
        me.root.position.z = nz;
        me.root.position.y += (g.y - me.root.position.y) * Math.min(1, dt*9);
        state.walked += speed*dt;
        me.root.rotation.y = Math.atan2(wx, wz);
      }
      me.step(dt, speed);
      state.standing = 0;
    } else {
      me.idle();
      state.standing += dt;
    }

    /* 相機 */
    const back = new THREE.Vector3(
      Math.sin(state.yaw)*Math.cos(state.pitch),
      -Math.sin(state.pitch),
      Math.cos(state.yaw)*Math.cos(state.pitch)).multiplyScalar(state.dist);
    const want = me.root.position.clone().add(back).add(new THREE.Vector3(0,1.5,0));
    cam.position.lerp(want, Math.min(1, dt*7));
    cam.lookAt(me.root.position.x, me.root.position.y + 1.25, me.root.position.z);

    /* 那個東西 */
    const secs = CIRCLE[state.dayIdx][1];
    thing.tick(state.t, secs);

    /* 到了空地沒 */
    const d = me.root.position.distanceTo(clearing);
    const near = d < ROAD.clearing * 0.85;
    if (near && !state.arrived){ state.arrived = true; opts.onArrive?.(); }

    opts.onTick?.({
      walked: state.walked,
      pct: Math.min(1, state.walked / ROAD.length),
      standing: state.standing,
      near, secs, day: CIRCLE[state.dayIdx][0],
      minutes: state.t / 60,
      counting: state.counting,
      counts: state.counts.slice(),
      elapsed: state.counting ? state.t - state.markAt : 0,
      noted: state.noted,
    });

    renderer.render(scene, cam);
  }
  loop();

  /* 按一下＝一圈。而第一下是起點，不算 */
  function mark(){
    if (!state.arrived) return null;
    if (!state.counting){
      state.counting = true; state.markAt = state.t; state.counts = [];
      return { start:true };
    }
    const dt = state.t - state.markAt;
    state.markAt = state.t;
    const n = Math.round(dt);
    state.counts.push(n);
    if (state.counts.length >= 3){
      state.counting = false;
      /* 而三次一不一樣，本身是資訊 */
      const same = state.counts.every(x => x === state.counts[0]);
      const truth = CIRCLE[state.dayIdx][1];
      state.noted = {
        day: CIRCLE[state.dayIdx][0],
        counts: state.counts.slice(),
        steady: same,
        value: same ? state.counts[0] : Math.round(state.counts.reduce((a,b)=>a+b,0)/3),
        truth,
        off: Math.abs(Math.round(state.counts.reduce((a,b)=>a+b,0)/3) - truth),
      };
      return { done: state.noted };
    }
    return { n };
  }

  addEventListener('keydown', e => {
    if (e.code === 'Space' && state.arrived){ e.preventDefault(); opts.onMark?.(mark()); }
  });

  return {
    mark,
    clearNote(){ state.noted = null; state.counts = []; state.counting = false; },
    setDay(i){ state.dayIdx = Math.max(0, Math.min(CIRCLE.length-1, i)); state.t = 0;
      state.counting = false; state.counts = []; state.noted = null; },
    get day(){ return CIRCLE[state.dayIdx]; },
    reset(){
      me.root.position.copy(p0);
      state.walked = 0; state.arrived = false; state.t = 0;
      state.counting = false; state.counts = []; state.noted = null;
    },
    stop(){ dead = true; cancelAnimationFrame(raf); ro.disconnect();
      renderer.dispose(); mount.innerHTML = ''; },
  };
}
