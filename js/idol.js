// ===== 分層立繪合成（沿用 dressup-demo 規則）=====
function shade(hex, amt) {
  let c = (hex || '#888').replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const n = parseInt(c, 16);
  const f = v => Math.max(0, Math.min(255, v + amt));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('');
}

const LAYER_MAP = Object.fromEntries(((window.ASSETS && ASSETS.layers) || []).map(l => [l.id, l]));

function outfitIds(outfit) {
  const ids = {};
  SLOTS.forEach(s => {
    const v = outfit && outfit[s.key];
    ids[s.key] = (v && v.id) ? v.id : (v || null);
    if (ids[s.key] && !LAYER_MAP[ids[s.key]]) ids[s.key] = null;
  });
  return ids;
}

function stackLayers(idolId, outfit) {
  const ids = outfitIds(outfit);
  const items = SLOTS.map(s => ids[s.key]).filter(v => v && LAYER_MAP[v]);
  const hide = new Set(items.flatMap(i => LAYER_MAP[i].hides || []));
  const ls = [];
  const push = (layer) => { if (layer) ls.push([layer.z, layer.file]); };
  push(LAYER_MAP[idolId + '_backhair']);
  push(LAYER_MAP[idolId + '_head']);
  ['base_body', 'base_shin', 'base_feet'].forEach(b => { if (!hide.has(b)) push(LAYER_MAP[b]); });
  items.forEach(i => {
    push(LAYER_MAP[i]);
    (LAYER_MAP[i].extra || []).forEach(e => ls.push([e.z, e.file]));
  });
  return ls.sort((a, b) => a[0] - b[0]);
}

function mountIdol(el, idol, outfit, cls) {
  if (!el) return el;
  const idolId = (idol && idol.id) || idol;
  if (!el.classList.contains('idol-figure')) {
    el.innerHTML = '';
    el._pool = [];
    el.classList.add('idol-figure');
  }
  el.classList.toggle('bob', !!(cls && cls.includes('bob')));
  el.classList.toggle('dance', !!(cls && cls.includes('dance')));
  const ls = stackLayers(idolId, outfit);
  ls.forEach(([z, f], k) => {
    let img = el._pool[k];
    if (!img) {
      img = document.createElement('img');
      img.alt = '';
      img.draggable = false;
      el.appendChild(img);
      el._pool[k] = img;
    }
    img.style.zIndex = z;
    const src = ASSET_BASE + f;
    if (img.getAttribute('src') !== src) img.src = src;
    img.style.display = '';
  });
  for (let k = ls.length; k < el._pool.length; k++) el._pool[k].style.display = 'none';
  return el;
}

function preloadIdolAssets() {
  if (!window.ASSETS) return Promise.resolve();
  const urls = [];
  ASSETS.layers.forEach(l => {
    urls.push(ASSET_BASE + l.file);
    (l.extra || []).forEach(e => urls.push(ASSET_BASE + e.file));
    if (l.icon) urls.push(ASSET_BASE + l.icon);
  });
  ASSETS.idols.forEach(i => {
    urls.push(ASSET_BASE + i.portrait);
    urls.push(ASSET_BASE + i.thumb);
  });
  return Promise.all(urls.map(src => new Promise(res => {
    const im = new Image();
    im.onload = im.onerror = () => res(src);
    im.src = src;
  })));
}

function portraitSrc(idol, thumb) {
  const id = (idol && idol.id) || idol;
  const meta = (window.ASSETS && ASSETS.idols || []).find(i => i.id === id);
  const path = thumb ? (idol.thumb || (meta && meta.thumb)) : (idol.portrait || (meta && meta.portrait));
  return ASSET_BASE + path;
}
