const FIRST_NORMAL_KEY = 'mgt-first-normal';
const FIRST_BOSS_KEY = 'mgt-first-boss';
const FIRST_TUTORIAL_KEY = 'mgt-first-tutorial';

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

export function isFirstTutorialDone(): boolean {
  try { return !!localStorage.getItem(FIRST_TUTORIAL_KEY); } catch { return false; }
}

export function markFirstTutorialDone(): void {
  try { localStorage.setItem(FIRST_TUTORIAL_KEY, '1'); } catch { /* ignore */ }
}
