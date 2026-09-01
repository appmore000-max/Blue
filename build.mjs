/* 打包成單檔
 *
 * 而理由很實際：直接點 index.html 一定是白的。
 * 因為 ES 模組從 file:// 開會被瀏覽器擋掉 ——
 * 而那個擋是在 JS 跑起來之前，所以連錯誤訊息都出不來。
 *
 * 所以要一個點兩下就能開的版本。
 *
 * node build.mjs  →  藍天白雲傳承.html
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const R = p => readFileSync(join(ROOT, p), 'utf8');

/* ── 一、把資料壓成一坨 ─────────────── */
const DATA = { script:{}, characters:{}, world:{}, knowledge:{} };
DATA.manifest = JSON.parse(R('data/manifest.json'));
for (const [dir, key] of [['script','script'],['characters','characters'],
                          ['world','world'],['knowledge','knowledge']]){
  for (const f of readdirSync(join(ROOT,'data',dir))){
    if (!f.endsWith('.json')) continue;
    const j = JSON.parse(R(`data/${dir}/${f}`));
    /* ⚠ 單檔版不經過檔案系統，所以 key 用資料裡的 id（中文），
       而 loadScript 進來的也是 id —— 兩邊才對得起來。 */
    const k = (dir === 'script' && j.id) ? j.id : f.replace(/\.json$/,'');
    DATA[key][k] = j;
  }
}
const dataJs = 'const __DATA = ' + JSON.stringify(DATA) + ';';

/* ── 二、模組。而順序就是相依順序 ────── */
const ORDER = [
  'core/labels', 'core/save', 'core/sim',
  'core/dayrules', 'core/jierules', 'core/xuerules',
  'core/knows',
  'ui/base',
  '3d/road', '3d/walk', '3d/arena',
  'ui/story', 'ui/spar', 'ui/day', 'ui/jie', 'ui/xue', 'ui/knows', 'ui/road',
  'ui/shell',
];

/* core/data 換成讀那一坨，不 fetch */
const INLINE_DATA = `
const __get = (bucket, id) => {
  const v = __DATA[bucket] && __DATA[bucket][id];
  if (v === undefined) throw new Error('讀不到 ' + bucket + '/' + id);
  return v;
};
const loadManifest  = async () => __DATA.manifest;
const loadScript    = async id => __get('script', id);
const setFileMap    = () => {};   /* 單檔版不需要 —— key 就是 id */
const loadCharacter = async id => __get('characters', id);
const loadWorld     = async n  => __get('world', n);
const loadSecrets   = async () => __get('knowledge', 'secrets');
async function loadRoster(ids){
  const out = {};
  for (const id of ids){
    const c = __get('characters', id);
    const i = c.identity||{}, r = c.resource||{}, cb = c.combat||{}, b = c.body||{};
    const cun = r.cun||{}, st = r.stamina||{}, ben = r.ben||{};
    out[id] = { id, name:i.name_zh||id, age:i.age??null,
      h:b.height_cm??null, w:b.weight_kg??null,
      cun:cun.max??null, regen:cun.regen_band??null, sta:st.max??null,
      ben:!!ben.can_force, benUsed:!!ben.forced_before,
      role:cb.role||null, roleNote:cb.role_note||'', sig:cb.signature||'',
      ab:(cb.abilities||[]).map(a=>({id:a.id,label:a.label,cost:a.cost})),
      empty:(cb.empty_profile||{}).one_line||'' };
  }
  return out;
}
__M['core/data'] = { loadManifest, loadScript, loadCharacter, loadWorld, loadSecrets, loadRoster, setFileMap };
`;

/* three.js。而它是 ES 模組，所以要脫掉 export 再包起來。
   ⚠ 它 360 KB —— 而內嵌的理由是：離線也要能開。 */
function wrapThree(){
  /* ⚠ 用 CJS 版，不用 module 版。
     因為 three.module.min.js 會 import './three.core.min.js' ——
     而那是兩個檔，單檔打包接不起來。
     而 three.cjs 是自帶全部的，零個 require。 */
  const src = R('3d/three.cjs');
  return `__M['3d/three.module.min'] = (function(){\n` +
         `const exports = {}; const module = { exports };\n` +
         src + `\nreturn module.exports;\n})();`;
}

/* 把一個模組轉成 IIFE */
function wrap(name){
  let src = R(name.startsWith('3d/') ? `${name}.js` : `src/${name}.js`);
  const exported = new Set();

  /* import * as X from '...' */
  src = src.replace(/import\s*\*\s*as\s+([A-Za-z_$][\w$]*)\s*from\s*'([^']+)'\s*;?/g,
    (_, id, path) => {
      const key = path.replace(/^(\.\.?\/)+/,'').replace(/\.js$/,'');
      const dir = name.split('/')[0];
      const resolved = key.includes('/') ? key
        : (dir === '3d' ? '3d/'+key : dir === 'ui' ? 'ui/'+key : 'core/'+key);
      return `const ${id} = __M['${resolved}'];`;
    });

  /* import { a, b as c } from './x.js'  →  const {a, b: c} = __M['...'] */
  src = src.replace(
    /import\s*\{([^}]*)\}\s*from\s*'([^']+)'\s*;?/g,
    (_, names, path) => {
      const key = path.replace(/^(\.\.?\/)+/,'').replace(/\.js$/,'');
      const dir = name.split('/')[0];
      const resolved = key.includes('/') ? key
        : (dir === '3d' ? '3d/'+key : dir === 'ui' ? 'ui/'+key : 'core/'+key);
      const binds = names.split(',').map(s=>s.trim()).filter(Boolean)
        .map(s => s.includes(' as ') ? s.replace(/\s+as\s+/,': ') : s).join(', ');
      return `const { ${binds} } = __M['${resolved}'];`;
    });

  /* export const/let/function/async function → 記下名字並脫掉 export */
  src = src.replace(/export\s+(async\s+function|function|const|let|var)\s+([A-Za-z_$][\w$]*)/g,
    (_, kind, id) => { exported.add(id); return `${kind} ${id}`; });

  return `__M['${name}'] = (function(){\n${src}\nreturn { ${[...exported].join(', ')} };\n})();`;
}

const modules = [wrapThree(), ...ORDER.map(wrap)].join('\n\n');

/* ── 三、樣式 ───────────────────────── */
const css = R('src/style/tokens.css') + '\n' + R('src/style/app.css');

/* ── 四、組起來 ─────────────────────── */
const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="dark">
<title>藍天白雲傳承</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@200;300;500;700&family=Noto+Serif+TC:wght@400;600&display=swap" rel="stylesheet">
<style>
${css}
</style>
</head>
<body>
<div id="app"></div>
<script>
/* 而這是單檔版。點兩下就能開，不需要伺服器。
   而原始碼在 src/ 底下 —— 那一份才是拿來改的。 */
const __M = {};
${dataJs}
${INLINE_DATA}
${modules}
__M['ui/shell'].boot();
</script>
</body>
</html>
`;

writeFileSync(join(ROOT,'..','藍天白雲傳承.html'), html);
console.log(`✓ 藍天白雲傳承.html　${(html.length/1024/1024).toFixed(2)} MB`);
console.log(`  資料 ${Object.keys(DATA.script).length} 篇劇本、${Object.keys(DATA.characters).length} 角色`);
console.log(`  模組 ${ORDER.length} 支`);
