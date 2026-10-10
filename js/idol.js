// ===== 偶像 SVG：成熟比例 + 依卡片 shape 分層繪製 =====
function shade(hex, amt) {
  let c = (hex || '#888').replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const n = parseInt(c, 16);
  const f = v => Math.max(0, Math.min(255, v + amt));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('');
}

const P = {
  cx: 100, headY: 46, headR: 23,
  earL: [78, 50], earR: [122, 50], lobeL: [77, 60], lobeR: [123, 60],
  neckY: 68, shY: 90, shL: 74, shR: 126,
  chestY: 110, waistY: 142, hipY: 168, inseam: 174,
  kneeY: 276, ankleY: 368, soleY: 394,
  handL: [62, 206], handR: [138, 206],
};

function idolSVG(idol, outfit = {}, cls = '') {
  const skin = '#f0cbb8', skinS = '#e0b09a';
  const top = outfit.top || null, bot = outfit.bottom || null, sh = outfit.shoes || null, acc = outfit.acc || null;
  const tc = top ? top.color : '#d8c8c0', ts = top ? top.sub : '#eee4dc';
  const bc = bot ? bot.color : '#6a6470', bs = bot ? bot.sub : '#ddd6ce';
  const sc = sh ? sh.color : '#2a2428', ss = sh ? sh.sub : '#cfc6bc';
  const ac = acc ? acc.color : '#c9a06a', as = acc ? acc.sub : '#f0e6d4';
  const topSh = (top && top.shape) || 'blouse';
  const botSh = (bot && bot.shape) || 'pencil';
  const shoeSh = (sh && sh.shape) || 'pump';
  const accSh = (acc && acc.shape) || '';
  const h = idol.hair, h2 = idol.hair2, uid = idol.id + Math.random().toString(36).slice(2, 7);
  const hair = hairSVG(idol, h, h2, ts);
  const accParts = accSVG(accSh, ac, as);
  const sleeves = sleeveKind(topSh);
  const longCoat = ['jacket', 'neon-jacket', 'knight-coat', 'bomber', 'hoodie'].includes(topSh);

  const rare = [top, bot, sh, acc].filter(c => c && c.rarity === 'PR').length;
  const sparkle = rare ? `<g class="svg-spark" opacity=".45">
    <circle cx="38" cy="120" r="1.2" fill="#e8d5a3"/><circle cx="162" cy="190" r="1" fill="#e8d5a3"/>
    <circle cx="46" cy="250" r="0.9" fill="#fff8e8"/></g>` : '';

  return `<svg class="idol-svg ${cls}" viewBox="0 0 200 440" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="t${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(tc, 18)}"/><stop offset="1" stop-color="${shade(tc, -28)}"/></linearGradient>
    <linearGradient id="b${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(bc, 14)}"/><stop offset="1" stop-color="${shade(bc, -32)}"/></linearGradient>
    <linearGradient id="s${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(sc, 16)}"/><stop offset="1" stop-color="${shade(sc, -22)}"/></linearGradient>
    <linearGradient id="skin${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skin}"/><stop offset="1" stop-color="${skinS}"/></linearGradient>
  </defs>
  <ellipse cx="100" cy="428" rx="42" ry="6" fill="rgba(0,0,0,.22)"/>
  ${hair.back}
  ${topBackSVG(topSh, tc)}
  ${accParts.back}
  ${legsSVG(skin)}
  ${bottomSVG(botSh, uid, bc, bs)}
  ${shoesSVG(shoeSh, uid, sc, ss)}
  ${!longCoat ? topSVG(topSh, uid, tc, ts) : ''}
  <g class="arm-l">${armSVG('l', skin)}${sleeveSVG('l', sleeves, tc, ts)}${accParts.handL}</g>
  <g class="arm-r">${armSVG('r', skin)}${sleeveSVG('r', sleeves, tc, ts)}${accParts.handR}</g>
  ${longCoat ? topSVG(topSh, uid, tc, ts) : ''}
  ${neckSVG(skin)}
  <circle cx="${P.cx}" cy="${P.headY}" r="${P.headR}" fill="url(#skin${uid})"/>
  ${earsSVG(skin)}
  ${faceSVG(idol)}
  ${hair.front}
  ${accParts.head}
  ${accParts.ears}
  ${accParts.neck}
  ${accParts.hip}
  ${sparkle}
</svg>`;
}

function hairSVG(idol, h, h2, accent) {
  const hi = shade(h, 36);
  let back = '', front = '';
  if (idol.style === 'twin') {
    back = `<path d="M76 54 C46 78 42 150 56 230 C64 180 72 112 88 80Z" fill="${h2}"/>
            <path d="M124 54 C154 78 158 150 144 230 C136 180 128 112 112 80Z" fill="${h2}"/>
            <path d="M78 36 Q100 16 122 36 Q132 60 120 74 L80 74 Q68 56 78 36Z" fill="${h}"/>
            <path d="M52 140 C48 180 56 210 64 220" fill="none" stroke="${hi}" stroke-width="2" opacity=".45"/>
            <path d="M148 140 C152 180 144 210 136 220" fill="none" stroke="${hi}" stroke-width="2" opacity=".45"/>`;
    front = `<path d="M80 38 Q86 56 78 70" fill="${h}"/>
             <path d="M120 38 Q114 56 122 70" fill="${h}"/>
             <path d="M84 34 Q100 46 116 34" fill="${hi}" opacity=".55"/>`;
  } else if (idol.style === 'long') {
    back = `<path d="M76 52 C50 96 46 210 58 330 L82 336 L92 80Z" fill="${h2}" stroke="${hi}" stroke-width="1.2"/>
            <path d="M124 52 C150 96 154 210 142 330 L118 336 L108 80Z" fill="${h2}" stroke="${hi}" stroke-width="1.2"/>
            <path d="M78 34 Q100 14 122 34 Q134 64 120 76 L80 76 Q66 56 78 34Z" fill="${h}" stroke="${hi}" stroke-width="1"/>
            <path d="M60 160 C56 220 64 280 70 310" fill="none" stroke="${hi}" stroke-width="2.4" opacity=".4"/>
            <path d="M140 160 C144 220 136 280 130 310" fill="none" stroke="${hi}" stroke-width="2.4" opacity=".4"/>`;
    front = `<path d="M82 36 Q90 58 76 72" fill="${h}"/>
             <path d="M118 36 Q110 58 124 72" fill="${h}"/>
             <path d="M86 32 Q100 42 114 32" fill="${hi}" opacity=".5"/>`;
  } else {
    back = `<path d="M78 36 Q100 14 120 36 Q132 66 118 78 L82 78 Q68 54 78 36Z" fill="${h}"/>
            <path d="M118 48 C160 74 166 180 150 270 C148 210 140 110 110 80Z" fill="${h2}"/>
            <path d="M150 140 C158 190 152 230 140 250" fill="none" stroke="${hi}" stroke-width="2.2" opacity=".45"/>`;
    front = `<path d="M120 34 Q138 50 130 74" fill="${h}"/>
             <path d="M82 36 Q92 56 76 68" fill="${h}"/>
             <path d="M86 32 Q100 42 112 32" fill="${hi}" opacity=".5"/>`;
  }
  return { back, front };
}

function earsSVG(skin) {
  return `<ellipse cx="${P.earL[0]}" cy="${P.earL[1]}" rx="4.2" ry="6.2" fill="${skin}"/>
          <ellipse cx="${P.earR[0]}" cy="${P.earR[1]}" rx="4.2" ry="6.2" fill="${skin}"/>`;
}

function neckSVG(skin) {
  return `<path d="M93 62 L107 62 L109 86 L91 86Z" fill="${skin}"/>`;
}

function faceSVG(idol) {
  const e = idol.eye;
  return `<g class="eyes">
    <path d="M84 42 Q92 38 99 43" fill="none" stroke="${shade(e, -45)}" stroke-width="1.35" stroke-linecap="round"/>
    <path d="M101 43 Q108 38 116 42" fill="none" stroke="${shade(e, -45)}" stroke-width="1.35" stroke-linecap="round"/>
    <ellipse cx="91" cy="49" rx="6.2" ry="6.6" fill="${e}"/>
    <ellipse cx="109" cy="49" rx="6.2" ry="6.6" fill="${e}"/>
    <ellipse cx="91" cy="49" rx="3.2" ry="3.4" fill="#1a1220"/>
    <ellipse cx="109" cy="49" rx="3.2" ry="3.4" fill="#1a1220"/>
    <circle cx="93.2" cy="47" r="2" fill="#fff"/><circle cx="111.2" cy="47" r="2" fill="#fff"/>
    <path d="M85 51 Q91 54 97 51" fill="none" stroke="${shade(e, -40)}" stroke-width=".8" opacity=".5"/>
    <path d="M103 51 Q109 54 115 51" fill="none" stroke="${shade(e, -40)}" stroke-width=".8" opacity=".5"/>
  </g>
  <path d="M98.4 53.5 L101 59.2 L97.8 59.4" fill="none" stroke="#c9a090" stroke-width="1" stroke-linejoin="round"/>
  <path d="M94.5 63 Q100 67 105.5 63" fill="none" stroke="#a04a58" stroke-width="1.6" stroke-linecap="round"/>
  <ellipse cx="83" cy="58" rx="5" ry="2.6" fill="#e8a0a0" opacity=".32"/>
  <ellipse cx="117" cy="58" rx="5" ry="2.6" fill="#e8a0a0" opacity=".32"/>`;
}

function armSVG(side, skin) {
  if (side === 'l') {
    return `<path d="M78 90 C60 128 56 168 60 200 C62 208 70 208 68 198 C64 160 70 124 80 96Z" fill="${skin}"/>
            <ellipse cx="62" cy="206" rx="6.2" ry="7" fill="${skin}"/>`;
  }
  return `<path d="M122 90 C140 128 144 168 140 200 C138 208 130 208 132 198 C136 160 130 124 120 96Z" fill="${skin}"/>
          <ellipse cx="138" cy="206" rx="6.2" ry="7" fill="${skin}"/>`;
}

function sleeveKind(shape) {
  if (['hoodie', 'jacket', 'neon-jacket', 'knight-coat', 'bomber'].includes(shape)) return 'long';
  if (['knit', 'gown-bodice'].includes(shape)) return 'three';
  if (['offshoulder'].includes(shape)) return 'off';
  if (['tank', 'corset'].includes(shape)) return 'none';
  return 'short';
}

function sleeveSVG(side, kind, tc, ts) {
  if (kind === 'none') return '';
  const L = side === 'l';
  const x1 = L ? 78 : 122, x2 = L ? 66 : 134, x3 = L ? 64 : 136;
  if (kind === 'long') {
    return `<path d="M${x1} 90 Q${L ? 63 : 137} 140 ${x3} 186" stroke="${tc}" stroke-width="12" fill="none" stroke-linecap="butt"/>
            <path d="M${L ? 56 : 128} 186 q${L ? 16 : -16} 4 ${L ? 16 : -16} 10" fill="${shade(tc, -20)}"/>`;
  }
  if (kind === 'three') {
    return `<path d="M${x1} 90 Q${L ? 64 : 136} 128 ${x2} 154" stroke="${tc}" stroke-width="11.5" fill="none"/>`;
  }
  if (kind === 'off') {
    return `<path d="M${L ? 70 : 130} 108 Q${L ? 62 : 138} 132 ${x2} 148" stroke="${tc}" stroke-width="10" fill="none"/>`;
  }
  return `<path d="M${x1} 90 Q${L ? 68 : 132} 112 ${x2} 128" stroke="${tc}" stroke-width="11" fill="none"/>`;
}

function legsSVG(skin) {
  return `<g class="legs">
    <path d="M86 168 L93 168 L96 366 L84 366Z" fill="${skin}"/>
    <path d="M107 168 L114 168 L116 366 L104 366Z" fill="${skin}"/>
  </g>`;
}

function bottomSVG(shape, uid, bc, bs) {
  const g = `url(#b${uid})`;
  switch (shape) {
    case 'shorts':
      return `<path d="M78 164 L122 164 L128 178 L124 236 L102 236 L100 178 L98 236 L76 236 L72 178Z" fill="${g}" stroke="${shade(bc, -40)}" stroke-width="1"/>
              <path d="M78 164 H122 L120 174 H80Z" fill="${shade(bc, -28)}"/>
              <path d="M99 176 V228" stroke="${bs}" stroke-width="1.4" opacity=".55"/>
              <rect x="94" y="166" width="12" height="5" rx="1" fill="${bs}"/>`;
    case 'suspender-shorts':
      return `<path d="M81 164 L119 164 L122 174 L120 220 L104 220 L100 174 L96 220 L80 220 L78 174Z" fill="${g}"/>
              <path d="M88 140 L92 166 M108 166 L112 140" stroke="${bc}" stroke-width="3"/>
              <path d="M86 138 H114" stroke="${bc}" stroke-width="3"/>`;
    case 'culottes':
      return `<path d="M78 164 L122 164 L132 250 L104 250 L100 180 L96 250 L68 250Z" fill="${g}"/>
              <path d="M100 176 V248" stroke="${bs}" stroke-width="1" opacity=".4"/>`;
    case 'pencil':
      return `<path d="M80 164 L120 164 L118 186 Q116 280 110 300 L90 300 Q84 280 82 186Z" fill="${g}"/>`;
    case 'slit':
      return `<path d="M79 164 L121 164 L124 186 Q128 340 118 390 L108 390 Q112 300 100 220 L96 390 L82 390 Q76 320 80 186Z" fill="${g}" stroke="${shade(bc, -40)}" stroke-width="1"/>
              <path d="M100 220 L96 390" stroke="${bs}" stroke-width="1.6" opacity=".65"/>`;
    case 'mermaid':
      return `<path d="M80 164 L120 164 L118 190 Q114 260 108 300 Q140 360 146 400 L54 400 Q60 360 92 300 Q86 260 82 190Z" fill="${g}"/>
              <path d="M70 370 Q100 350 130 370" fill="none" stroke="${bs}" stroke-width="1.2" opacity=".5"/>`;
    case 'gown-skirt':
      return `<path d="M78 164 L122 164 L128 200 Q160 360 168 410 L32 410 Q40 360 72 200Z" fill="${g}"/>
              <path d="M48 390 Q100 360 152 390" fill="none" stroke="${bs}" stroke-width="1.4" opacity=".35"/>`;
    case 'lace-long':
      return `<path d="M79 164 L121 164 L126 200 Q134 340 130 396 L70 396 Q66 340 74 200Z" fill="${g}"/>
              <path d="M74 370 Q100 358 126 370 Q100 386 74 370Z" fill="${bs}" opacity=".45"/>`;
    case 'knight-skirt':
      return `<path d="M78 164 L122 164 L128 188 L132 360 L68 360 L72 188Z" fill="${g}"/>
              <path d="M86 168 V350 M114 168 V350" stroke="${bs}" stroke-width="1.4" opacity=".55"/>
              <path d="M70 350 H130" stroke="${bs}" stroke-width="2"/>`;
    case 'denim-skirt':
      return `<path d="M79 164 L121 164 L128 188 L126 248 L74 248 L72 188Z" fill="${g}"/>
              <path d="M86 176 L90 196 L86 200" fill="none" stroke="${bs}" stroke-width="1.1"/>
              <path d="M90 230 Q100 238 110 230" fill="none" stroke="${shade(bc, -40)}" stroke-width="1.2"/>
              <circle cx="92" cy="210" r="1.4" fill="${bs}"/><circle cx="108" cy="210" r="1.4" fill="${bs}"/>`;
    case 'check-skirt':
      return `<path d="M79 164 L121 164 L130 186 L128 250 L72 250 L70 186Z" fill="${g}"/>
              ${[176, 188, 200, 212, 224, 236].map(y => `<path d="M${74 + (y - 176) * 0.08} ${y} H${126 - (y - 176) * 0.08}" stroke="${bs}" stroke-width=".7" opacity=".45"/>`).join('')}
              ${[86, 94, 100, 106, 114].map(x => `<path d="M${x} 168 L${x + (x - 100) * 0.35} 248" stroke="${bs}" stroke-width=".7" opacity=".35"/>`).join('')}`;
    case 'cake-skirt':
      return `<path d="M80 164 L120 164 L126 186 L132 210 L138 248 L62 248 L68 210 L74 186Z" fill="${g}"/>
              <path d="M68 210 H132" stroke="${bs}" stroke-width="2" opacity=".5"/>
              <path d="M62 246 Q100 258 138 246" fill="${shade(bc, -18)}"/>`;
    case 'mini-pleat':
      return `<path d="M80 164 L120 164 L128 182 L126 226 L74 226 L72 182Z" fill="${g}"/>
              ${[84, 90, 96, 100, 104, 110, 116].map(x => `<path d="M${x} 168 L${x + (x - 100) * 0.25} 224" stroke="${bs}" stroke-width="1.1" opacity=".4"/>`).join('')}`;
    case 'layer-skirt':
      return `<path d="M79 164 L121 164 L130 200 L136 250 L64 250 L70 200Z" fill="${g}"/>
              <path d="M70 200 Q100 214 130 200" fill="${shade(bc, 10)}" opacity=".7"/>
              <path d="M66 228 Q100 244 134 228" fill="${shade(bc, -10)}" opacity=".55"/>`;
    case 'stage-skirt':
      return `<path d="M78 164 L122 164 L134 210 Q150 300 146 340 L54 340 Q50 300 66 210Z" fill="${g}"/>
              <path d="M60 320 Q100 300 140 320" fill="none" stroke="${bs}" stroke-width="1.6" opacity=".5"/>`;
    default:
      return `<path d="M80 164 L120 164 L126 190 L122 260 L78 260 L74 190Z" fill="${g}"/>`;
  }
}

function shoesSVG(shape, uid, sc, ss) {
  const heel = (h = 18) =>
    `<path d="M80 390 L88 390 L85 ${392 + h} L78 ${392 + h}Z" fill="${shade(sc, -35)}" stroke="${shade(sc, -50)}" stroke-width=".6"/>
     <path d="M120 390 L112 390 L115 ${392 + h} L122 ${392 + h}Z" fill="${shade(sc, -35)}" stroke="${shade(sc, -50)}" stroke-width=".6"/>`;
  const foot = (open = false) => open
    ? `<path d="M78 366 L86 366 L92 390 L72 390 Q74 376 78 366Z" fill="url(#s${uid})"/>
       <path d="M114 366 L122 366 L128 390 L108 390 Q110 376 114 366Z" fill="url(#s${uid})"/>`
    : `<path d="M78 366 L96 366 L94 392 L70 392 Q72 376 78 366Z" fill="url(#s${uid})"/>
       <path d="M104 366 L122 366 L130 392 L106 392 Q108 376 104 366Z" fill="url(#s${uid})"/>`;

  switch (shape) {
    case 'pump':
    case 'lace-heel':
    case 'glass-heel':
    case 'crystal-heel':
    case 'laceup-heel':
      return `${foot(false)}${heel(shape === 'pump' ? 16 : 20)}
        ${shape === 'laceup-heel' ? `<path d="M84 370 V384 M116 370 V384" stroke="${ss}" stroke-width="1"/>
          <path d="M80 374 H90 M80 380 H90 M110 374 H120 M110 380 H120" stroke="${ss}" stroke-width=".8"/>` : ''}
        ${shape === 'lace-heel' ? `<path d="M80 372 Q86 368 92 372 M108 372 Q114 368 120 372" fill="none" stroke="${ss}" stroke-width="1"/>` : ''}
        ${['glass-heel', 'crystal-heel'].includes(shape) ? `<path d="M74 386 H92 M108 386 H126" stroke="${ss}" stroke-width="1.2" opacity=".7"/>` : ''}`;
    case 'sandal':
      return `${foot(true)}${heel(14)}
        <path d="M80 374 H90 M80 382 H90 M110 374 H120 M110 382 H120" stroke="${ss}" stroke-width="1.4"/>`;
    case 'maryjane':
      return `${foot(false)}
        <path d="M80 392 H94 L92 398 H78Z" fill="${shade(sc, -20)}"/>
        <path d="M106 392 H120 L122 398 H108Z" fill="${shade(sc, -20)}"/>
        <path d="M80 376 H94 M106 376 H120" stroke="${ss}" stroke-width="2"/>
        ${heel(8)}`;
    case 'ankle-boot':
      return `<path d="M79 348 L96 348 L96 392 L70 392 Q72 360 79 348Z" fill="url(#s${uid})"/>
              <path d="M104 348 L121 348 L128 392 L104 392 Q104 360 104 348Z" fill="url(#s${uid})"/>
              <path d="M82 352 Q88 348 94 352 M106 352 Q112 348 118 352" fill="none" stroke="${ss}" stroke-width="1.3"/>
              ${heel(6)}`;
    case 'combat':
    case 'knight-boot':
    case 'neon-boot':
    case 'stage-boot':
    case 'platform-boot':
      return `<path d="M78 300 L97 300 L97 396 L68 396 Q70 320 78 300Z" fill="url(#s${uid})"/>
              <path d="M103 300 L122 300 L132 396 L103 396 Q103 320 103 300Z" fill="url(#s${uid})"/>
              <path d="M70 388 H96 M104 388 H130" stroke="${ss}" stroke-width="${shape === 'platform-boot' || shape === 'stage-boot' ? 6 : 3}"/>
              ${['combat', 'knight-boot'].includes(shape) ? `<path d="M82 312 H94 M82 322 H94 M82 332 H94 M106 312 H118 M106 322 H118 M106 332 H118" stroke="${ss}" stroke-width="1.1"/>` : ''}
              ${shape === 'knight-boot' ? `<path d="M78 300 H97 L94 292 H81Z M103 300 H122 L119 292 H106Z" fill="${ss}"/>` : ''}
              ${shape === 'neon-boot' ? `<path d="M80 340 H94 M106 340 H120" stroke="${ss}" stroke-width="2"/>` : ''}`;
    case 'hightop':
      return `<path d="M79 338 L96 338 L95 394 L70 394 Q72 350 79 338Z" fill="url(#s${uid})"/>
              <path d="M104 338 L121 338 L130 394 L105 394 Q104 350 104 338Z" fill="url(#s${uid})"/>
              <path d="M72 386 H94 M106 386 H128" stroke="${ss}" stroke-width="3"/>
              <path d="M84 346 H92 M84 354 H92 M108 346 H116 M108 354 H116" stroke="${ss}" stroke-width="1"/>`;
    case 'sneaker':
      return `<path d="M76 362 L96 362 L96 394 L68 394 Q70 372 76 362Z" fill="url(#s${uid})"/>
              <path d="M104 362 L124 362 L132 394 L104 394 Q104 372 104 362Z" fill="url(#s${uid})"/>
              <path d="M68 388 H96 M104 388 H132" stroke="${ss}" stroke-width="4"/>
              <path d="M70 368 Q78 360 90 364 M110 364 Q118 360 128 368" fill="${shade(sc, 30)}" opacity=".7"/>`;
    case 'loafer':
      return `<path d="M76 364 L96 364 L95 396 L68 396 Q70 374 76 364Z" fill="url(#s${uid})"/>
              <path d="M104 364 L124 364 L132 396 L105 396 Q104 374 104 364Z" fill="url(#s${uid})"/>
              <path d="M68 390 H95 M105 390 H132" stroke="${ss}" stroke-width="5"/>
              <rect x="80" y="372" width="12" height="3" rx="1" fill="${ss}"/>
              <rect x="108" y="372" width="12" height="3" rx="1" fill="${ss}"/>`;
    default:
      return foot(false) + heel(12);
  }
}

function topSVG(shape, uid, tc, ts) {
  const g = `url(#t${uid})`;
  switch (shape) {
    case 'hoodie':
      return `<path d="M76 86 L124 86 L130 104 L126 164 L74 164 L70 104Z" fill="${g}" stroke="${shade(tc, -40)}" stroke-width="1"/>
              <path d="M86 116 H114 V150 H86Z" fill="${shade(tc, -26)}" stroke="${ts}" stroke-width="1.2"/>
              <path d="M95 88 Q92 118 90 136 M105 88 Q108 118 110 136" stroke="${ts}" stroke-width="1.6" fill="none"/>
              <circle cx="90" cy="138" r="2.1" fill="${ts}"/><circle cx="110" cy="138" r="2.1" fill="${ts}"/>
              <path d="M76 160 H124" stroke="${ts}" stroke-width="4"/>`;
    case 'jacket':
    case 'neon-jacket':
      return `<path d="M76 86 L124 86 L130 104 L126 168 L112 168 L100 118 L88 168 L74 168 L70 104Z" fill="${g}"/>
              <path d="M90 88 L100 120 L110 88" fill="${shade(tc, 20)}"/>
              <path d="M78 100 L88 164 M122 100 L112 164" fill="none" stroke="${ts}" stroke-width="1.2"/>
              ${shape === 'jacket' ? `<circle cx="90" cy="108" r="1.8" fill="${ts}"/><circle cx="110" cy="108" r="1.8" fill="${ts}"/>
                <circle cx="90" cy="122" r="1.8" fill="${ts}"/><circle cx="110" cy="122" r="1.8" fill="${ts}"/>` : ''}
              ${shape === 'neon-jacket' ? `<path d="M80 96 H120 M82 150 H118" stroke="${ts}" stroke-width="1.8"/>` : ''}`;
    case 'knight-coat':
      return `<path d="M78 80 L122 80 L128 86 L132 110 L130 210 L70 210 L68 110 L72 86Z" fill="${g}"/>
              <path d="M92 80 L100 120 L108 80" fill="${ts}"/>
              <path d="M86 86 V200 M114 86 V200" stroke="${ts}" stroke-width="1.4" opacity=".7"/>
              <path d="M78 80 H122 L118 74 H82Z" fill="${shade(tc, -25)}"/>`;
    case 'bomber':
      return `<path d="M76 86 L124 86 L128 102 L124 156 L76 156 L72 102Z" fill="${g}"/>
              <path d="M76 150 H124" stroke="${ts}" stroke-width="5"/>
              <path d="M76 86 H124" stroke="${ts}" stroke-width="3"/>
              <path d="M88 100 H96 M104 100 H112" stroke="${shade(tc, -30)}" stroke-width="2"/>`;
    case 'offshoulder':
      return `<path d="M82 104 Q100 96 118 104 L124 118 L120 150 L80 150 L76 118Z" fill="${g}"/>
              <path d="M80 104 Q100 98 120 104" fill="none" stroke="${ts}" stroke-width="3"/>`;
    case 'corset':
      return `<path d="M82 92 L118 92 L122 110 L118 148 L82 148 L78 110Z" fill="${g}"/>
              <path d="M90 96 V144 M100 96 V144 M110 96 V144" stroke="${ts}" stroke-width="1.2"/>
              <path d="M84 118 H116" stroke="${ts}" stroke-width="1.6"/>
              <path d="M86 92 H114 L110 86 H90Z" fill="${shade(tc, 16)}"/>`;
    case 'gown-bodice':
      return `<path d="M80 88 Q100 80 120 88 L124 108 L118 148 L82 148 L76 108Z" fill="${g}"/>
              <path d="M90 90 Q100 108 110 90" fill="none" stroke="${ts}" stroke-width="1.6"/>
              <path d="M82 146 H118" stroke="${ts}" stroke-width="2"/>`;
    case 'tank':
      return `<path d="M86 90 L114 90 L120 104 L118 136 L82 136 L80 104Z" fill="${g}"/>
              <path d="M86 90 L82 108 M114 90 L118 108" stroke="${tc}" stroke-width="4"/>
              ${[96, 104, 112, 120, 128].map((y, i) => `<path d="M84 ${y} H116" stroke="${i % 2 ? ts : shade(tc, -20)}" stroke-width="2.4"/>`).join('')}`;
    case 'tee':
      return `<path d="M80 88 L120 88 L124 102 L120 146 L80 146 L76 102Z" fill="${g}"/>
              <path d="M94 88 Q100 96 106 88" fill="${skinSafe(ts)}"/>`;
    case 'stage-top':
      return `<path d="M80 86 L120 86 L126 100 L122 132 L78 132 L74 100Z" fill="${g}"/>
              <path d="M88 90 L100 118 L112 90" fill="none" stroke="${ts}" stroke-width="1.8"/>
              <path d="M82 128 H118" stroke="${ts}" stroke-width="2"/>`;
    case 'knit':
      return `<path d="M78 86 L122 86 L126 104 L122 154 L78 154 L74 104Z" fill="${g}"/>
              ${[96, 108, 120, 132, 144].map(y => `<path d="M78 ${y} H122" stroke="${ts}" stroke-width="1.1" opacity=".45"/>`).join('')}
              <path d="M94 86 Q100 102 106 86" fill="${ts}"/>
              <path d="M96 100 Q100 110 104 100 Q100 106 96 100Z" fill="${ts}"/>`;
    case 'lace-blouse':
      return `<path d="M80 86 L120 86 L124 102 L120 150 L80 150 L76 102Z" fill="${g}"/>
              <path d="M88 92 Q100 108 112 92" fill="none" stroke="${ts}" stroke-width="1.3"/>
              <path d="M86 120 Q100 132 114 120" fill="none" stroke="${ts}" stroke-width="1.1"/>
              <path d="M92 86 Q100 98 108 86" fill="${ts}" opacity=".7"/>`;
    case 'satin-blouse':
      return `<path d="M80 86 L120 86 L124 104 L120 152 L80 152 L76 104Z" fill="${g}" stroke="${shade(tc, -40)}" stroke-width="1"/>
              <path d="M100 88 V150" stroke="${ts}" stroke-width="1.4" opacity=".55"/>
              <path d="M92 86 L100 104 L108 86" fill="${shade(tc, 24)}"/>`;
    case 'blouse':
    default:
      return `<path d="M80 86 L120 86 L124 104 L120 150 L80 150 L76 104Z" fill="${g}"/>
              <path d="M86 92 H114 M86 104 H114 M86 116 H114 M86 128 H114" stroke="${ts}" stroke-width=".8" opacity=".4"/>
              <path d="M86 92 V128 M114 92 V128" stroke="${ts}" stroke-width=".8" opacity=".4"/>
              <path d="M94 86 Q100 96 106 86" fill="${ts}"/>`;
  }
}

function topBackSVG(shape, tc) {
  if (shape === 'hoodie') {
    return `<path d="M74 48 Q100 18 126 48 L120 84 Q100 72 80 84Z" fill="${shade(tc, -10)}" stroke="${shade(tc, -40)}" stroke-width="1"/>
            <path d="M88 70 Q100 62 112 70" fill="none" stroke="${shade(tc, 20)}" stroke-width="2"/>`;
  }
  return '';
}
function skinSafe(c) { return c; }

function accSVG(shape, c, a) {
  const empty = { back: '', head: '', ears: '', neck: '', handL: '', handR: '', hip: '' };
  if (!shape) return empty;
  const L = P.lobeL, R = P.lobeR;
  switch (shape) {
    case 'clip':
      return { ...empty, head: `<g transform="translate(122 36) rotate(18)">
        <rect x="-7" y="-3" width="14" height="6" rx="3" fill="${c}"/>
        <circle cx="0" cy="0" r="2.2" fill="${a}"/></g>` };
    case 'star-clip':
      return { ...empty, head: `<g transform="translate(124 34)">
        <polygon points="0,-7 2,-2 7,-2 3,1 4,6 0,3 -4,6 -3,1 -7,-2 -2,-2" fill="${c}" stroke="${a}" stroke-width=".6"/></g>` };
    case 'headband':
      return { ...empty, head: `<path d="M80 30 Q100 18 120 30" fill="none" stroke="${c}" stroke-width="4"/>
        <path d="M96 16 L100 8 L104 16 L112 18 L104 22 L100 30 L96 22 L88 18Z" fill="${a}"/>` };
    case 'veil':
      return { ...empty,
        back: `<path d="M78 28 Q100 16 122 28 L140 160 Q100 180 60 160Z" fill="${c}" opacity=".28"/>`,
        head: `<path d="M80 28 Q100 16 120 28" fill="none" stroke="${a}" stroke-width="2.2"/>` };
    case 'crown':
      return { ...empty, head: `<path d="M82 28 L86 16 L92 26 L100 10 L108 26 L114 16 L118 28Z" fill="${c}" stroke="${a}" stroke-width="1"/>
        <circle cx="100" cy="16" r="2.4" fill="${a}"/>` };
    case 'tiara':
      return { ...empty, head: `<path d="M84 30 Q100 14 116 30" fill="none" stroke="${c}" stroke-width="2.4"/>
        <circle cx="100" cy="16" r="2.6" fill="${a}"/><circle cx="90" cy="24" r="1.6" fill="${a}"/><circle cx="110" cy="24" r="1.6" fill="${a}"/>` };
    case 'earrings':
      return { ...empty, ears: `
        <circle cx="${L[0]}" cy="${L[1]}" r="1.6" fill="${c}"/>
        <path d="M${L[0]} ${L[1]} V${L[1] + 14}" stroke="${c}" stroke-width="1.5"/>
        <polygon points="${L[0]},${L[1] + 14} ${L[0] - 4.2},${L[1] + 22} ${L[0] + 4.2},${L[1] + 22}" fill="${c}"/>
        <circle cx="${R[0]}" cy="${R[1]}" r="1.6" fill="${c}"/>
        <path d="M${R[0]} ${R[1]} V${R[1] + 14}" stroke="${c}" stroke-width="1.5"/>
        <polygon points="${R[0]},${R[1] + 14} ${R[0] - 4.2},${R[1] + 22} ${R[0] + 4.2},${R[1] + 22}" fill="${c}"/>` };
    case 'pearl-earrings':
      return { ...empty, ears: `
        <circle cx="${L[0]}" cy="${L[1]}" r="1.5" fill="${c}"/>
        <circle cx="${L[0]}" cy="${L[1] + 8}" r="3.4" fill="${a}" stroke="${c}" stroke-width=".9"/>
        <circle cx="${R[0]}" cy="${R[1]}" r="1.5" fill="${c}"/>
        <circle cx="${R[0]}" cy="${R[1] + 8}" r="3.4" fill="${a}" stroke="${c}" stroke-width=".9"/>` };
    case 'necklace':
      return { ...empty, neck: `<path d="M90 72 Q100 86 110 72" fill="none" stroke="${c}" stroke-width="1.6"/>
        <path d="M97 84 L100 92 L103 84Z" fill="${c}"/><path d="M99.2 86 H100.8 V94 H99.2Z" fill="${c}"/>` };
    case 'choker':
      return { ...empty, neck: `<path d="M91 74 H109" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/>
        <circle cx="100" cy="74" r="2.2" fill="${a}"/>` };
    case 'visor':
      return { ...empty, head: `<path d="M78 44 H122 L118 52 H82Z" fill="${c}" opacity=".82" stroke="${a}" stroke-width="1"/>
        <path d="M80 44 H120" stroke="${a}" stroke-width="1.4"/>` };
    case 'headphones':
      return { ...empty, head: `<path d="M78 40 Q100 20 122 40" fill="none" stroke="${c}" stroke-width="3.4"/>
        <rect x="72" y="40" width="10" height="16" rx="3" fill="${c}" stroke="${a}" stroke-width="1"/>
        <rect x="118" y="40" width="10" height="16" rx="3" fill="${c}" stroke="${a}" stroke-width="1"/>` };
    case 'earbuds':
      return { ...empty, ears: `
        <circle cx="${P.earL[0] + 1}" cy="${P.earL[1] + 2}" r="2.4" fill="${c}"/>
        <circle cx="${P.earR[0] - 1}" cy="${P.earR[1] + 2}" r="2.4" fill="${c}"/>
        <path d="M${P.earL[0]} ${P.earL[1] + 4} Q90 80 100 88 Q110 80 ${P.earR[0]} ${P.earR[1] + 4}" fill="none" stroke="${c}" stroke-width=".9"/>` };
    case 'gloves':
      return { ...empty,
        handL: `<ellipse cx="64" cy="204" rx="6.4" ry="7.2" fill="${c}"/><path d="M60 198 Q64 192 68 198" fill="${c}"/>`,
        handR: `<ellipse cx="136" cy="204" rx="6.4" ry="7.2" fill="${c}"/><path d="M132 198 Q136 192 140 198" fill="${c}"/>` };
    case 'bag':
      return { ...empty,
        hip: `<path d="M124 90 Q154 108 150 168" fill="none" stroke="${c}" stroke-width="2.2"/>
          <path d="M138 148 C152 146 160 156 158 176 C156 198 148 208 140 206 C128 204 126 188 130 168 C132 154 134 150 138 148Z" fill="${c}" stroke="${a}" stroke-width="1.4"/>
          <ellipse cx="146" cy="172" rx="6" ry="10" fill="${a}" opacity=".5"/>
          <rect x="140" y="142" width="12" height="8" rx="1.5" fill="${a}"/>
          <path d="M142 142 Q146 136 150 142" fill="none" stroke="${a}" stroke-width="1.4"/>` };
    case 'mic':
      return { ...empty,
        handR: `<g transform="translate(136 198)">
          <rect x="-2" y="0" width="4" height="22" rx="1" fill="${a}"/>
          <ellipse cx="0" cy="-6" rx="6" ry="8" fill="${c}"/>
          <path d="M-5 -6 H5" stroke="${a}" stroke-width="1"/></g>` };
    default:
      return empty;
  }
}
