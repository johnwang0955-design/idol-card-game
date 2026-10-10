// ===== 品牌、32 張單品卡、偶像、曲目 =====
const SLOTS = [
  { key: 'top', name: '上衣', icon: '▣' },
  { key: 'bottom', name: '下身', icon: '▤' },
  { key: 'shoes', name: '鞋子', icon: '▲' },
  { key: 'acc', name: '配件', icon: '✦' },
];
const RARITIES = ['N', 'R', 'SR', 'PR'];
const TYPES = {
  cute: { name: '可愛', color: '#c47a8c' },
  cool: { name: '酷炫', color: '#6f8fc0' },
  elegant: { name: '優雅', color: '#8a3d55' },
  pop: { name: '流行', color: '#c4923a' },
};
const BRANDS = [
  { id: 'mid', name: '午夜鋒芒', en: 'Midnight Edge', type: 'cool', mark: '◆',
    colors: ['#3d4a6b', '#1c2033', '#8a97b8', '#3ad4f0'], accent: '#c5cde0', special: '霓虹雷閃' },
  { id: 'ros', name: '玫瑰絲絨', en: 'Rouge Velvet', type: 'elegant', mark: '❖',
    colors: ['#8b1e3f', '#4a1630', '#c9a06a', '#1a0a12'], accent: '#e4c98a', special: '午夜玫瑰之吻' },
  { id: 'sug', name: '糖霜緞帶', en: 'Sugar Ribbon', type: 'cute', mark: '✦',
    colors: ['#c9a4b0', '#b87a8f', '#f4ece8', '#8a3d55'], accent: '#f0ddd4', special: '糖霜迴旋' },
  { id: 'pop', name: '彩虹汽水', en: 'Rainbow Soda', type: 'pop', mark: '★',
    colors: ['#c4923a', '#2a7a86', '#d46a42', '#1e2a38'], accent: '#f3e6c8', special: '虹彩爆閃' },
];
const brandOf = id => BRANDS.find(b => b.id === id || b.name === id);

function rarityOfItem(id, slot) {
  const setA = id.endsWith('_a');
  if (setA) return (slot === 'top' || slot === 'bottom') ? 'PR' : 'SR';
  return (slot === 'top' || slot === 'bottom') ? 'R' : 'N';
}
const APPEAL = { N: 220, R: 440, SR: 740, PR: 1020 };

const ITEM_LAYERS = (window.ASSETS && ASSETS.layers ? ASSETS.layers : []).filter(l => l.brand && SLOTS.some(s => s.key === l.slot));
const CARDS = ITEM_LAYERS.map((l, i) => {
  const b = brandOf(l.brand);
  const rarity = rarityOfItem(l.id, l.slot);
  const ri = RARITIES.indexOf(rarity);
  return {
    id: l.id, name: l.name, brand: b.id, type: b.type, slot: l.slot, rarity,
    appeal: APPEAL[rarity] + ((i * 7) % 9) * 10,
    color: b.colors[ri], sub: b.accent,
    icon: l.icon, file: l.file, z: l.z, extra: l.extra || [], hides: l.hides || [],
  };
});
const CARD_MAP = Object.fromEntries(CARDS.map(c => [c.id, c]));

const IDOLS = [
  { id: 'rinne', name: '凜音', en: 'Rinne', type: 'cool', brand: 'mid',
    portrait: 'portraits/rinne.webp', thumb: 'portraits/rinne_thumb.webp',
    desc: '冷冽的頂尖舞者，把每一步都練成刀鋒。', catch: '「跟上我的節奏。」' },
  { id: 'haruka', name: '晴夏', en: 'Haruka', type: 'elegant', brand: 'ros',
    portrait: 'portraits/haruka.webp', thumb: 'portraits/haruka_thumb.webp',
    desc: '以柔美聲線走紅的新世代偶像，舞台上永遠帶著從容笑意。', catch: '「今晚，也請與我共舞。」' },
  { id: 'ria', name: '莉亞', en: 'Ria', type: 'pop', brand: 'pop',
    portrait: 'portraits/ria.webp', thumb: 'portraits/ria_thumb.webp',
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
const GACHA_RATES = {
  S: [20, 35, 32, 13], A: [30, 38, 25, 7], B: [40, 35, 20, 5], C: [55, 33, 10, 2],
};
const ASSET_BASE = 'assets/';
