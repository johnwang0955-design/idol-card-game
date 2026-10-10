// ===== 原創偶像 SVG 繪製 =====
function idolSVG(idol, outfit = {}, cls = '') {
  const skin = '#ffe4d4', skinS = '#f6c9b3';
  const top = outfit.top || null, bot = outfit.bottom || null, sh = outfit.shoes || null, acc = outfit.acc || null;
  const tc = top ? top.color : '#ffffff', ts = top ? top.sub : '#dddddd';
  const bc = bot ? bot.color : '#8fa3c7', bs = bot ? bot.sub : '#ffffff';
  const sc = sh ? sh.color : '#ffffff', ss = sh ? sh.sub : '#cccccc';
  const h = idol.hair, h2 = idol.hair2, uid = idol.id + Math.random().toString(36).slice(2, 7);
  let back = '', front = '';
  if (idol.style === 'twin') {
    back = `<path d="M62 70 C20 90 22 170 40 230 C48 200 44 150 70 110Z" fill="${h2}"/>
            <path d="M138 70 C180 90 178 170 160 230 C152 200 156 150 130 110Z" fill="${h2}"/>
            <path d="M60 80 Q58 130 66 140 L134 140 Q142 130 140 80Z" fill="${h}"/>`;
    front = `<circle cx="62" cy="66" r="8" fill="${ts}"/><circle cx="138" cy="66" r="8" fill="${ts}"/>`;
  } else if (idol.style === 'long') {
    back = `<path d="M56 80 C48 150 46 220 58 250 L142 250 C154 220 152 150 144 80Z" fill="${h2}"/>`;
  } else {
    back = `<path d="M60 80 Q58 120 68 132 L132 132 Q142 120 140 80Z" fill="${h}"/>
            <path d="M136 60 C190 70 186 160 164 210 C160 170 158 120 128 96Z" fill="${h2}"/>`;
    front = `<circle cx="138" cy="60" r="7" fill="${ts}"/>`;
  }
  // 配件形狀依品牌
  let accSvg = '';
  if (acc) {
    const c = acc.color, a = acc.sub;
    if (acc.brand === 'sugar') accSvg = `<g transform="translate(100 40)"><path d="M0 0 L-22 -12 L-22 12Z M0 0 L22 -12 L22 12Z" fill="${c}" stroke="${a}" stroke-width="2"/><circle r="6" fill="${a}"/></g>`;
    else if (acc.brand === 'midnight') accSvg = `<path d="M56 86 Q100 20 144 86" fill="none" stroke="${c}" stroke-width="7"/><rect x="48" y="78" width="14" height="22" rx="6" fill="${c}" stroke="${a}" stroke-width="2"/><rect x="138" y="78" width="14" height="22" rx="6" fill="${c}" stroke="${a}" stroke-width="2"/>`;
    else if (acc.brand === 'rouge') accSvg = `<g transform="translate(70 52)"><circle r="11" fill="${c}"/><circle r="6" fill="${a}" opacity=".7"/><circle r="3" fill="${c}"/></g><circle cx="88" cy="48" r="3" fill="${a}"/>`;
    else accSvg = `<polygon transform="translate(128 50) scale(1.1)" points="0,-13 4,-4 13,-4 6,2 8,11 0,6 -8,11 -6,2 -13,-4 -4,-4" fill="${c}" stroke="#fff" stroke-width="2"/>`;
  }
  const rare = [top, bot, sh, acc].filter(c => c && (c.rarity === 'SR' || c.rarity === 'PR')).length;
  const sparkle = rare ? Array.from({ length: rare * 2 }, (_, i) =>
    `<text class="svg-spark" x="${30 + (i * 53) % 140}" y="${150 + (i * 71) % 170}" font-size="${10 + (i % 3) * 4}" fill="#fff6a8" style="animation-delay:${i * 0.3}s">✦</text>`).join('') : '';
  return `<svg class="idol-svg ${cls}" viewBox="0 0 200 360" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="t${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tc}"/><stop offset="1" stop-color="${shade(tc, -25)}"/></linearGradient>
    <linearGradient id="b${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bc}"/><stop offset="1" stop-color="${shade(bc, -30)}"/></linearGradient>
  </defs>
  <ellipse cx="100" cy="350" rx="50" ry="7" fill="rgba(0,0,0,.18)"/>
  ${back}
  <g class="legs"><rect x="84" y="235" width="13" height="95" rx="6" fill="${skin}"/><rect x="103" y="235" width="13" height="95" rx="6" fill="${skin}"/></g>
  <path d="M78 322 h22 v14 a5 5 0 0 1 -5 5 h-20 a6 6 0 0 1 -6 -6 a10 10 0 0 1 9 -13z" fill="${sc}" stroke="${ss}" stroke-width="2"/>
  <path d="M100 322 h22 a10 10 0 0 1 9 13 a6 6 0 0 1 -6 6 h-20 a5 5 0 0 1 -5 -5z" fill="${sc}" stroke="${ss}" stroke-width="2"/>
  <path d="M74 198 L126 198 L152 262 Q100 274 48 262Z" fill="url(#b${uid})"/>
  <path d="M50 258 Q100 270 150 258 L152 264 Q100 276 48 264Z" fill="${bs}"/>
  <g class="arm-l"><path d="M76 138 Q58 170 62 205" stroke="${skin}" stroke-width="11" fill="none" stroke-linecap="round"/></g>
  <g class="arm-r"><path d="M124 138 Q142 170 138 205" stroke="${skin}" stroke-width="11" fill="none" stroke-linecap="round"/></g>
  <rect x="93" y="112" width="14" height="20" fill="${skinS}"/>
  <path d="M76 132 Q100 124 124 132 L130 204 L70 204Z" fill="url(#t${uid})"/>
  <circle cx="76" cy="140" r="11" fill="${tc}"/><circle cx="124" cy="140" r="11" fill="${tc}"/>
  <path d="M90 130 L100 146 L110 130" fill="none" stroke="${ts}" stroke-width="4"/>
  <path d="M70 196 L130 196 L130 204 L70 204Z" fill="${ts}" opacity=".8"/>
  <circle cx="100" cy="82" r="40" fill="${skin}"/>
  <g class="eyes"><ellipse cx="84" cy="88" rx="7.5" ry="10" fill="${idol.eye}"/><ellipse cx="116" cy="88" rx="7.5" ry="10" fill="${idol.eye}"/>
  <circle cx="86" cy="84" r="3.2" fill="#fff"/><circle cx="118" cy="84" r="3.2" fill="#fff"/><circle cx="82" cy="92" r="1.5" fill="#fff"/><circle cx="114" cy="92" r="1.5" fill="#fff"/></g>
  <ellipse cx="74" cy="102" rx="7" ry="4" fill="#ff8fb1" opacity=".45"/><ellipse cx="126" cy="102" rx="7" ry="4" fill="#ff8fb1" opacity=".45"/>
  <path d="M93 104 Q100 111 107 104" fill="none" stroke="#c0506a" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M58 86 Q56 38 100 40 Q144 38 142 86 Q134 62 120 70 Q112 52 100 66 Q90 52 80 70 Q66 62 58 86Z" fill="${h}"/>
  ${front}${accSvg}${sparkle}
</svg>`;
}
function shade(hex, amt) {
  let c = hex.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const n = parseInt(c, 16);
  const f = v => Math.max(0, Math.min(255, v + amt));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('');
}
