/* ui 共用的小零件。
 * ⚠ 這一支是從 shell.js 拆出來的 —— 因為 shell 跟六個模式互相 import，
 *   而那個循環在單檔打包的時候會壞。 */

export function topbar(title){
  return `<div class="bar">
    <button class="back" aria-label="回選單">←</button>
    <span>${title}</span>
  </div>`;
}

export function wireBack(root, back){
  const b = root.querySelector('.back');
  if (b) b.onclick = () => { location.hash = ''; if (back) back(); };
}
