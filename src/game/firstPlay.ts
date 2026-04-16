const FIRST_NORMAL_KEY = 'mgt-first-normal';
const FIRST_BOSS_KEY = 'mgt-first-boss';

export function isFirstNormal(): boolean {
  try { return !localStorage.getItem(FIRST_NORMAL_KEY); } catch { return false; }
}

export function markFirstNormalDone(): void {
  try { localStorage.setItem(FIRST_NORMAL_KEY, '1'); } catch { /* ignore */ }
}

export function isFirstBoss(): boolean {
  try { return !localStorage.getItem(FIRST_BOSS_KEY); } catch { return false; }
}

export function markFirstBossDone(): void {
  try { localStorage.setItem(FIRST_BOSS_KEY, '1'); } catch { /* ignore */ }
}
