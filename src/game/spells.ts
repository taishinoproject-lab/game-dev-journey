import { Spell } from './types';

export const attackSpells: Spell[] = [
  {
    id: 'hado_001',
    name: '衝',
    nameReading: 'さい',
    type: 'attack',
    rank: 'low',
    textJp: '裂けよ',
    segments: ['さけよ'],
    baseDamage: 15,
    element: 'light',
    magicCircleType: 'circle',
  },
  {
    id: 'hado_031',
    name: '赤火砲',
    nameReading: 'しゃっかほう',
    type: 'attack',
    rank: 'low',
    textJp: '君臨者よ、血肉の仮面',
    segments: ['くんりんしゃよ', 'けつにくのかめん'],
    baseDamage: 30,
    element: 'fire',
    magicCircleType: 'pentagram',
  },
  {
    id: 'hado_033',
    name: '蒼火墜',
    nameReading: 'そうかつい',
    type: 'attack',
    rank: 'mid',
    textJp: '君臨者よ、血肉の仮面、万象、羽搏き、ヒトの名を冠す者よ',
    segments: ['くんりんしゃよ', 'けつにくのかめん', 'ばんしょう', 'はばたき', 'ひとのなをかんすものよ'],
    baseDamage: 60,
    element: 'fire',
    magicCircleType: 'hexagram',
  },
  {
    id: 'hado_063',
    name: '雷吼炮',
    nameReading: 'らいこうほう',
    type: 'attack',
    rank: 'mid',
    textJp: '散在する獣の骨、尖塔、紅晶、鋼鉄の車輪',
    segments: ['さんざいするけもののほね', 'せんとう', 'こうしょう', 'こうてつのしゃりん'],
    baseDamage: 70,
    element: 'thunder',
    magicCircleType: 'octagram',
  },
  {
    id: 'hado_090',
    name: '黒棺',
    nameReading: 'くろひつぎ',
    type: 'attack',
    rank: 'high',
    textJp: '滲み出す混濁の紋章、不遜なる狂気の器、湧きあがり否定し、痺れ瞬き、眠りを妨げる',
    segments: [
      'にじみだすこんだくのもんしょう',
      'ふそんなるきょうきのうつわ',
      'わきあがりひていし',
      'しびれまたたき',
      'ねむりをさまたげる',
    ],
    baseDamage: 150,
    element: 'dark',
    magicCircleType: 'complex',
  },
];

export const defenseSpells: Spell[] = [
  {
    id: 'bakudo_001',
    name: '斥',
    nameReading: 'せき',
    type: 'defense',
    rank: 'low',
    textJp: '退けよ',
    segments: ['しりぞけよ'],
    baseDamage: 0,
    element: 'barrier',
    magicCircleType: 'circle',
  },
  {
    id: 'bakudo_081',
    name: '断空',
    nameReading: 'だんくう',
    type: 'defense',
    rank: 'mid',
    textJp: '拒絶する白壁、禁じられし境界',
    segments: ['きょぜつするはくへき', 'きんじられしきょうかい'],
    baseDamage: 0,
    element: 'barrier',
    magicCircleType: 'hexagram',
  },
];

export const allSpells = [...attackSpells, ...defenseSpells];

export function getSpellRomajiLength(spell: Spell): number {
  return spell.segments.reduce((acc, seg) => acc + hiraganaToRomajiLength(seg), 0);
}

function hiraganaToRomajiLength(text: string): number {
  // Rough estimate: each hiragana ≈ 2 romaji chars
  return text.length * 2;
}

export function getRandomAttackSpell(wave: number): Spell {
  if (wave <= 2) {
    // low rank only
    const lowSpells = attackSpells.filter(s => s.rank === 'low');
    return lowSpells[Math.floor(Math.random() * lowSpells.length)];
  } else if (wave <= 5) {
    const pool = attackSpells.filter(s => s.rank !== 'high');
    return pool[Math.floor(Math.random() * pool.length)];
  } else {
    return attackSpells[Math.floor(Math.random() * attackSpells.length)];
  }
}
