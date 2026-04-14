export type SpellType = 'attack' | 'defense';
export type SpellRank = 'low' | 'mid' | 'high';
export type SpellElement = 'fire' | 'thunder' | 'dark' | 'light' | 'barrier';
export type MagicCircleType = 'circle' | 'pentagram' | 'hexagram' | 'octagram' | 'complex';

export interface Spell {
  id: string;
  name: string;
  nameReading: string;
  type: SpellType;
  rank: SpellRank;
  textJp: string;
  segments: string[];
  baseDamage: number;
  element: SpellElement;
  magicCircleType: MagicCircleType;
}

export type GamePhase = 'title' | 'tutorial' | 'normal' | 'boss' | 'wave-intro' | 'boss-intro' | 'result';

export interface Enemy {
  name: string;
  maxHp: number;
  hp: number;
  type: 'normal' | 'boss';
  attackInterval?: number;
  attackDamage?: number;
  attackWarningTime?: number;
}

export interface GameState {
  phase: GamePhase;
  wave: number;
  score: number;
  combo: number;
  maxCombo: number;
  playerHp: number;
  playerMaxHp: number;
  currentSpell: Spell | null;
  currentSegmentIndex: number;
  currentCharIndex: number;
  typedRomaji: string;
  enemies: Enemy[];
  currentEnemyIndex: number;
  bossEnemy: Enemy | null;
  timeRemaining: number;
  timeLimit: number;
  totalTyped: number;
  correctTyped: number;
  enemiesDefeated: number;
  noMissCount: number;
  currentSpellHasMiss: boolean;
  isDefending: boolean;
  bossAttacking: boolean;
  bossAttackWarning: boolean;
  bossAttackProgress: number;
  damageFlash: boolean;
  selectedBossSpellIndex: number;
  spellComplete: boolean;
  castingAnimation: boolean;
}

export interface HighScore {
  score: number;
  wave: number;
  maxCombo: number;
  enemiesDefeated: number;
  accuracy: number;
  date: string;
}

export function getComboStage(combo: number): number {
  if (combo >= 20) return 4;
  if (combo >= 15) return 3;
  if (combo >= 10) return 2;
  if (combo >= 5) return 1;
  return 0;
}

export function getComboMultiplier(combo: number): number {
  const stage = getComboStage(combo);
  return [1.0, 1.5, 2.0, 2.5, 3.0][stage];
}

export function getComboColor(combo: number): string {
  const stage = getComboStage(combo);
  return [
    '#A0C4FF', // pale blue-white
    '#2E4A7A', // deep blue
    '#3A1A5E', // dark purple
    '#2A0A2A', // dark red-purple
    '#0A0A0A', // black
  ][stage];
}

export function getComboGlowColor(combo: number): string {
  const stage = getComboStage(combo);
  return [
    '#E0EEFF',
    '#4A6A9A',
    '#5A2A7E',
    '#4A1A4A',
    '#FFFFFF', // white edge on black
  ][stage];
}

export function getElementColor(element: SpellElement): string {
  const colors: Record<SpellElement, string> = {
    fire: '#FFD4C4',
    thunder: '#D4C4FF',
    dark: '#2A0A3A',
    light: '#FFFFFF',
    barrier: '#C4FFD4',
  };
  return colors[element];
}
