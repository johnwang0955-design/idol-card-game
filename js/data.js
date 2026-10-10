// ===== 原創資料：品牌、卡片、偶像、曲目 =====
const SLOTS = [
  { key: 'top', name: '上衣', icon: '▣' },
  { key: 'bottom', name: '下身', icon: '▤' },
  { key: 'shoes', name: '鞋子', icon: '▲' },
  { key: 'acc', name: '配件', icon: '✦' },
];
const RARITIES = ['N', 'R', 'SR', 'PR'];
const TYPES = {
  cute: { name: '甜美', color: '#b76e86' },
  cool: { name: '酷炫', color: '#4c6a9a' },
  sexy: { name: '性感', color: '#7a2348' },
  pop:  { name: '流行', color: '#c4923a' },
};
const SHAPES = {
  top: {
    sugar:    ['blouse', 'knit', 'lace-blouse', 'gown-bodice'],
    midnight: ['hoodie', 'jacket', 'neon-jacket', 'knight-coat'],
    rouge:    ['satin-blouse', 'offshoulder', 'corset', 'gown-bodice'],
    soda:     ['tee', 'tank', 'bomber', 'stage-top'],
  },
  bottom: {
    sugar:    ['check-skirt', 'cake-skirt', 'lace-long', 'gown-skirt'],
    midnight: ['denim-skirt', 'shorts', 'culottes', 'knight-skirt'],
    rouge:    ['pencil', 'slit', 'mermaid', 'gown-skirt'],
    soda:     ['suspender-shorts', 'mini-pleat', 'layer-skirt', 'stage-skirt'],
  },
  shoes: {
    sugar:    ['maryjane', 'ankle-boot', 'lace-heel', 'glass-heel'],
    midnight: ['hightop', 'combat', 'neon-boot', 'knight-boot'],
    rouge:    ['pump', 'laceup-heel', 'sandal', 'crystal-heel'],
    soda:     ['sneaker', 'loafer', 'platform-boot', 'stage-boot'],
  },
  acc: {
    sugar:    ['clip', 'headband', 'veil', 'crown'],
    midnight: ['earrings', 'necklace', 'visor', 'headphones'],
    rouge:    ['pearl-earrings', 'choker', 'gloves', 'tiara'],
    soda:     ['star-clip', 'bag', 'earbuds', 'mic'],
  },
};
const BRANDS = [
  { id: 'sugar', name: '糖霜緞帶', en: 'Sugar Ribbon', type: 'cute', mark: '✦',
    colors: ['#c9a4b0', '#b87a8f', '#f4ece8', '#8a3d55'], accent: '#f0ddd4', special: '糖霜迴旋',
    items: {
      top: ['草莓格紋襯衫', '蝴蝶結針織衫', '糖霜蕾絲襯衫', '星糖晚禮服上衣'],
      bottom: ['草莓格紋裙', '層次蛋糕裙', '糖霜蕾絲長裙', '星糖晚禮服裙'],
      shoes: ['草莓瑪莉珍', '蝴蝶結短靴', '糖霜蕾絲跟鞋', '星糖水晶跟鞋'],
      acc: ['草莓髮夾', '緞帶髮箍', '糖霜蕾絲頭紗', '星糖寶石冠'] } },
  { id: 'midnight', name: '午夜鋒芒', en: 'Midnight Edge', type: 'cool', mark: '◆',
    colors: ['#3d4a6b', '#1c2033', '#8a97b8', '#3ad4f0'], accent: '#c5cde0', special: '霓虹雷閃',
    items: {
      top: ['街頭連帽衫', '鉚釘皮夾克', '霓虹電光外套', '銀河騎士外套'],
      bottom: ['破洞牛仔褲裙', '皮革短褲', '霓虹電光褲裙', '銀河騎士長裙'],
      shoes: ['帆布高筒鞋', '鉚釘馬汀靴', '霓虹電光長靴', '銀河騎士戰靴'],
      acc: ['金屬耳環', '十字架項鍊', '霓虹護目鏡', '銀河騎士耳機'] } },
  { id: 'rouge', name: '玫瑰絲絨', en: 'Rouge Velvet', type: 'sexy', mark: '❖',
    colors: ['#8b1e3f', '#4a1630', '#c9a06a', '#1a0a12'], accent: '#e4c98a', special: '午夜玫瑰之吻',
    items: {
      top: ['絲緞襯衫', '露肩絲絨上衣', '玫瑰蕾絲馬甲', '午夜玫瑰禮服上衣'],
      bottom: ['窄版鉛筆裙', '開衩絲絨長裙', '玫瑰蕾絲魚尾裙', '午夜玫瑰禮服裙'],
      shoes: ['尖頭跟鞋', '綁帶絲絨高跟鞋', '玫瑰蕾絲涼鞋', '午夜玫瑰水晶鞋'],
      acc: ['珍珠耳環', '黑絲絨頸鍊', '玫瑰蕾絲手套', '午夜玫瑰后冠'] } },
  { id: 'soda', name: '彩虹汽水', en: 'Rainbow Soda', type: 'pop', mark: '★',
    colors: ['#c4923a', '#2a7a86', '#d46a42', '#1e2a38'], accent: '#f3e6c8', special: '虹彩爆閃',
    items: {
      top: ['彩色短袖T恤', '汽水條紋背心', '虹彩飛行外套', '七彩流星舞台上衣'],
      bottom: ['吊帶短褲', '百褶迷你裙', '虹彩層次裙', '七彩流星舞台裙'],
      shoes: ['彩色運動鞋', '厚底樂福鞋', '虹彩厚底靴', '七彩流星舞台靴'],
      acc: ['星星髮夾', '汽水瓶包包', '虹彩耳掛耳機', '七彩流星麥克風'] } },
];

const CARDS = [];
BRANDS.forEach((b, bi) => {
  SLOTS.forEach((s, si) => {
    RARITIES.forEach((r, ri) => {
      const base = [200, 420, 720, 1000][ri];
      CARDS.push({
        id: `${b.id}-${s.key}-${r}`,
        name: b.items[s.key][ri],
        brand: b.id, type: b.type, slot: s.key, rarity: r,
        shape: SHAPES[s.key][b.id][ri],
        appeal: base + ((bi * 7 + si * 13 + ri * 5) % 9) * 10,
        color: b.colors[ri], sub: b.accent,
      });
    });
  });
});
const CARD_MAP = Object.fromEntries(CARDS.map(c => [c.id, c]));
const brandOf = id => BRANDS.find(b => b.id === id);

const IDOLS = [
  { id: 'haruka', name: '晴夏', en: 'Haruka', type: 'cute', brand: 'sugar', hair: '#c47a8c', hair2: '#8f4e62', eye: '#8a3a52', style: 'twin',
    desc: '以柔美聲線走紅的新世代偶像，舞台上永遠帶著從容笑意。', catch: '「今晚，也請與我共舞。」' },
  { id: 'rinne', name: '凜音', en: 'Rinne', type: 'cool', brand: 'midnight', hair: '#2a2d4a', hair2: '#151722', eye: '#4aa8c8', style: 'long',
    desc: '冷冽的頂尖舞者，把每一步都練成刀鋒。', catch: '「跟上我的節奏。」' },
  { id: 'ria', name: '莉亞', en: 'Ria', type: 'pop', brand: 'soda', hair: '#c8883a', hair2: '#8a5420', eye: '#2d7a62', style: 'side',
    desc: '時尚與節奏並重的創作型偶像，鏡頭前後都是她的舞台。', catch: '「把這夜，收進鏡頭裡。」' },
];

const SONGS = [
  { id: 'march', name: '星光進行曲', en: 'Starlight March', bpm: 128, root: 60, minor: false,
    prog: [[5, 9, 12], [7, 11, 14], [4, 7, 11], [9, 12, 16]], wave: 'square' },
  { id: 'neon', name: '午夜霓虹', en: 'Midnight Neon', bpm: 140, root: 57, minor: true,
    prog: [[0, 3, 7], [8, 12, 15], [3, 7, 10], [10, 14, 17]], wave: 'sawtooth' },
];
const DIFFS = [
  { id: 'easy', name: '簡單', approach: 1.6 },
  { id: 'normal', name: '普通', approach: 1.3 },
  { id: 'hard', name: '困難', approach: 1.05 },
];

const GACHA_RATES = { // N, R, SR, PR (%)
  S: [20, 35, 32, 13], A: [30, 38, 25, 7], B: [40, 35, 20, 5], C: [55, 33, 10, 2],
};
