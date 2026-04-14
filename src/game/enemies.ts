import { Enemy } from './types';

export function createNormalEnemies(wave: number): Enemy[] {
  const count = Math.min(3 + Math.floor(wave / 2), 6);
  const baseHp = 15 + wave * 5;
  return Array.from({ length: count }, (_, i) => ({
    name: `虚 ${wave}-${i + 1}`,
    maxHp: baseHp + Math.floor(Math.random() * 10),
    hp: baseHp + Math.floor(Math.random() * 10),
    type: 'normal' as const,
  }));
}

export function createBossEnemy(wave: number): Enemy {
  const bossNames = ['巨虚', '大虚', '破面', '十刃', '零番隊'];
  const name = bossNames[Math.min(wave - 1, bossNames.length - 1)];
  const hp = 100 + wave * 50;
  const attackInterval = Math.max(3, 8 - wave * 0.5);
  const attackDamage = 15 + Math.min(wave * 2, 20);

  return {
    name: `${name}【Wave ${wave}】`,
    maxHp: hp,
    hp,
    type: 'boss',
    attackInterval,
    attackDamage,
    attackWarningTime: Math.max(2, 3 - wave * 0.1),
  };
}

export function getBossTimeLimit(wave: number): number {
  if (wave <= 1) return 60;
  if (wave <= 3) return 50;
  if (wave <= 6) return 45;
  return 40;
}

export function getNormalTimeLimit(romajiLength: number, wave: number): number {
  const baseSpeed = 3.0;
  const difficultyCoeff = Math.max(0.8, 2.0 - (wave - 1) * 0.15);
  const buffer = 2.0;
  return (romajiLength / baseSpeed) * difficultyCoeff + buffer;
}
