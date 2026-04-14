import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GamePhase, Spell, getComboMultiplier, HighScore } from '../game/types';
import { attackSpells, defenseSpells, getRandomAttackSpell } from '../game/spells';
import { createTypingState, processInput, TypingState, getDisplayRomaji, getRomajiLength } from '../game/romajiEngine';
import { createNormalEnemies, createBossEnemy, getBossTimeLimit, getNormalTimeLimit } from '../game/enemies';
import { Enemy } from '../game/types';
import TitleScreen from './TitleScreen';
import ResultScreen from './ResultScreen';
import HUD from './HUD';
import MagicCircle from './MagicCircle';
import SpellDisplay from './SpellDisplay';
import BossSpellList from './BossSpellList';
import EnemyDisplay from './EnemyDisplay';

const STORAGE_KEY = 'magic-typing-highscores';

function loadHighScores(): HighScore[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveHighScore(hs: HighScore) {
  const scores = loadHighScores();
  scores.push(hs);
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores.slice(0, 10)));
}

const GameManager: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('title');
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [currentEnemyIndex, setCurrentEnemyIndex] = useState(0);
  const [bossEnemy, setBossEnemy] = useState<Enemy | null>(null);
  const [currentSpell, setCurrentSpell] = useState<Spell | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [typingState, setTypingState] = useState<TypingState | null>(null);
  const [completedSegments, setCompletedSegments] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeLimit, setTimeLimit] = useState(0);
  const [totalTyped, setTotalTyped] = useState(0);
  const [correctTyped, setCorrectTyped] = useState(0);
  const [enemiesDefeated, setEnemiesDefeated] = useState(0);
  const [noMissCount, setNoMissCount] = useState(0);
  const [currentSpellHasMiss, setCurrentSpellHasMiss] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);
  const [bossWarning, setBossWarning] = useState(false);
  const [selectedBossSpellIndex, setSelectedBossSpellIndex] = useState(0);
  const [castingAnimation, setCastingAnimation] = useState(false);
  const [waveIntroText, setWaveIntroText] = useState('');
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  const timerRef = useRef<number | null>(null);
  const bossAttackTimerRef = useRef<number | null>(null);
  const lastTickRef = useRef(Date.now());

  // Magic circle progress
  const magicProgress = currentSpell
    ? (() => {
        const totalChars = currentSpell.segments.reduce((acc, s) => acc + getDisplayRomaji(s).length, 0);
        let typedChars = 0;
        for (let i = 0; i < completedSegments; i++) {
          typedChars += getDisplayRomaji(currentSpell.segments[i]).length;
        }
        if (typingState && currentSegmentIndex === completedSegments) {
          const chars = typingState.chars;
          for (let ci = 0; ci < typingState.currentCharIndex; ci++) {
            typedChars += chars[ci].acceptedRomaji[0].length;
          }
          typedChars += typingState.currentInput.length;
        }
        return totalChars > 0 ? typedChars / totalChars : 0;
      })()
    : 0;

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (bossAttackTimerRef.current) { clearInterval(bossAttackTimerRef.current); bossAttackTimerRef.current = null; }
  }, []);

  const takeDamage = useCallback((amount: number) => {
    setPlayerHp(prev => {
      const newHp = Math.max(0, prev - amount);
      if (newHp <= 0) {
        // Game over handled in useEffect
      }
      return newHp;
    });
    setCombo(0);
    setDamageFlash(true);
    setTimeout(() => setDamageFlash(false), 300);
  }, []);

  // Start normal phase
  const startNormalPhase = useCallback((w: number) => {
    const normalEnemies = createNormalEnemies(w);
    setEnemies(normalEnemies);
    setCurrentEnemyIndex(0);
    setBossEnemy(null);

    const spell = getRandomAttackSpell(w);
    setCurrentSpell(spell);
    setCurrentSegmentIndex(0);
    setCompletedSegments(0);
    setCurrentSpellHasMiss(false);

    const seg = spell.segments[0];
    setTypingState(createTypingState(seg));

    const rl = spell.segments.reduce((a, s) => a + getRomajiLength(s), 0);
    const tl = getNormalTimeLimit(rl, w);
    setTimeLimit(tl);
    setTimeRemaining(tl);
    lastTickRef.current = Date.now();

    setPhase('normal');
  }, []);

  // Start boss phase
  const startBossPhase = useCallback((w: number) => {
    const boss = createBossEnemy(w);
    setBossEnemy(boss);
    setEnemies([]);

    const spell = attackSpells[0];
    setCurrentSpell(spell);
    setCurrentSegmentIndex(0);
    setCompletedSegments(0);
    setCurrentSpellHasMiss(false);
    setSelectedBossSpellIndex(0);
    setTypingState(createTypingState(spell.segments[0]));

    const tl = getBossTimeLimit(w);
    setTimeLimit(tl);
    setTimeRemaining(tl);
    lastTickRef.current = Date.now();

    setPhase('boss');
  }, []);

  // Wave intro
  const showWaveIntro = useCallback((w: number, isBoss: boolean) => {
    if (isBoss) {
      const boss = createBossEnemy(w);
      setWaveIntroText(boss.name);
    } else {
      setWaveIntroText(`WAVE ${w}`);
    }
    setPhase('wave-intro');
    setTimeout(() => {
      if (isBoss) {
        startBossPhase(w);
      } else {
        startNormalPhase(w);
      }
    }, 2000);
  }, [startNormalPhase, startBossPhase]);

  // Start game
  const startGame = useCallback(() => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setPlayerHp(100);
    setTotalTyped(0);
    setCorrectTyped(0);
    setEnemiesDefeated(0);
    setNoMissCount(0);
    setWave(1);
    setDamageFlash(false);
    setBossWarning(false);
    setCastingAnimation(false);
    showWaveIntro(1, false);
  }, [showWaveIntro]);

  // Timer tick
  useEffect(() => {
    if (phase !== 'normal' && phase !== 'boss') {
      clearTimers();
      return;
    }

    timerRef.current = window.setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setTimeRemaining(prev => {
        const next = prev - delta;
        if (next <= 0) {
          // Time's up
          if (phase === 'normal') {
            takeDamage(25);
          } else {
            takeDamage(35);
          }
          return 0;
        }
        return next;
      });
    }, 50);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, clearTimers, takeDamage]);

  // Boss attack timer
  useEffect(() => {
    if (phase !== 'boss' || !bossEnemy) return;

    const interval = (bossEnemy.attackInterval || 8) * 1000;
    const warningTime = (bossEnemy.attackWarningTime || 3) * 1000;

    const scheduleAttack = () => {
      bossAttackTimerRef.current = window.setTimeout(() => {
        setBossWarning(true);
        setTimeout(() => {
          setBossWarning(false);
          // Check if player is defending
          if (currentSpell?.type !== 'defense') {
            takeDamage(bossEnemy.attackDamage || 20);
          }
          // Schedule next attack
          scheduleAttack();
        }, warningTime);
      }, interval - warningTime);
    };

    scheduleAttack();

    return () => { if (bossAttackTimerRef.current) clearTimeout(bossAttackTimerRef.current); };
  }, [phase, bossEnemy, takeDamage, currentSpell?.type]);

  // Game over check
  useEffect(() => {
    if (playerHp <= 0 && (phase === 'normal' || phase === 'boss')) {
      clearTimers();
      const scores = loadHighScores();
      const isNew = scores.length < 10 || score > (scores[scores.length - 1]?.score || 0);
      setIsNewHighScore(isNew);
      saveHighScore({
        score, wave, maxCombo, enemiesDefeated,
        accuracy: totalTyped > 0 ? Math.floor((correctTyped / totalTyped) * 100) : 0,
        date: new Date().toISOString(),
      });
      setPhase('result');
    }
  }, [playerHp, phase, clearTimers, score, wave, maxCombo, enemiesDefeated, totalTyped, correctTyped]);

  // Time up - move to next enemy or game over
  useEffect(() => {
    if (timeRemaining <= 0 && phase === 'normal') {
      // Move to next enemy
      const nextIndex = currentEnemyIndex + 1;
      if (nextIndex >= enemies.length) {
        // All enemies done, boss time
        showWaveIntro(wave, true);
      } else {
        setCurrentEnemyIndex(nextIndex);
        const spell = getRandomAttackSpell(wave);
        setCurrentSpell(spell);
        setCurrentSegmentIndex(0);
        setCompletedSegments(0);
        setCurrentSpellHasMiss(false);
        setTypingState(createTypingState(spell.segments[0]));
        const rl = spell.segments.reduce((a, s) => a + getRomajiLength(s), 0);
        const tl = getNormalTimeLimit(rl, wave);
        setTimeLimit(tl);
        setTimeRemaining(tl);
        lastTickRef.current = Date.now();
      }
    }
  }, [timeRemaining, phase, currentEnemyIndex, enemies.length, wave, showWaveIntro]);

  // Handle spell completion
  const onSpellComplete = useCallback(() => {
    if (!currentSpell) return;

    setCastingAnimation(true);
    setTimeout(() => {
      setCastingAnimation(false);

      if (currentSpell.type === 'attack') {
        const multiplier = getComboMultiplier(combo);
        const damage = Math.floor(currentSpell.baseDamage * multiplier);

        // Score calculation
        const baseScore = currentSpell.baseDamage * 10;
        const timeBonus = timeRemaining / timeLimit > 0.8 ? 1.5 : timeRemaining / timeLimit > 0.5 ? 1.2 : 1.0;
        const missBonus = currentSpellHasMiss ? 1.0 : 1.5;
        const spellScore = Math.floor(baseScore * multiplier * timeBonus * missBonus);
        setScore(prev => prev + spellScore);

        if (!currentSpellHasMiss) {
          setCombo(prev => {
            const next = prev + 1;
            setMaxCombo(mc => Math.max(mc, next));
            return next;
          });
          setNoMissCount(prev => prev + 1);
        }

        if (phase === 'normal') {
          // Damage current enemy
          const updatedEnemies = [...enemies];
          if (updatedEnemies[currentEnemyIndex]) {
            updatedEnemies[currentEnemyIndex] = {
              ...updatedEnemies[currentEnemyIndex],
              hp: Math.max(0, updatedEnemies[currentEnemyIndex].hp - damage),
            };
            setEnemies(updatedEnemies);

            if (updatedEnemies[currentEnemyIndex].hp <= 0) {
              setEnemiesDefeated(prev => prev + 1);
              const nextIndex = currentEnemyIndex + 1;
              if (nextIndex >= enemies.length) {
                showWaveIntro(wave, true);
                return;
              }
              setCurrentEnemyIndex(nextIndex);
            }
          }

          // Next spell
          const spell = getRandomAttackSpell(wave);
          setCurrentSpell(spell);
          setCurrentSegmentIndex(0);
          setCompletedSegments(0);
          setCurrentSpellHasMiss(false);
          setTypingState(createTypingState(spell.segments[0]));
          const rl = spell.segments.reduce((a, s) => a + getRomajiLength(s), 0);
          const tl = getNormalTimeLimit(rl, wave);
          setTimeLimit(tl);
          setTimeRemaining(tl);
          lastTickRef.current = Date.now();
        } else if (phase === 'boss' && bossEnemy) {
          const newBoss = { ...bossEnemy, hp: Math.max(0, bossEnemy.hp - damage) };
          setBossEnemy(newBoss);

          if (newBoss.hp <= 0) {
            setEnemiesDefeated(prev => prev + 1);
            const nextWave = wave + 1;
            setWave(nextWave);
            showWaveIntro(nextWave, false);
            return;
          }

          // Reset for next spell input in boss mode
          setCurrentSegmentIndex(0);
          setCompletedSegments(0);
          setCurrentSpellHasMiss(false);
          setTypingState(createTypingState(currentSpell.segments[0]));
        }
      } else {
        // Defense spell - successful defense
        // Reset for next spell
        if (phase === 'boss') {
          const spell = attackSpells[selectedBossSpellIndex < attackSpells.length ? selectedBossSpellIndex : 0];
          setCurrentSpell(spell);
          setCurrentSegmentIndex(0);
          setCompletedSegments(0);
          setCurrentSpellHasMiss(false);
          setTypingState(createTypingState(spell.segments[0]));
        }
      }
    }, 1500);
  }, [currentSpell, combo, phase, enemies, currentEnemyIndex, wave, bossEnemy,
      timeRemaining, timeLimit, currentSpellHasMiss, showWaveIntro, selectedBossSpellIndex]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      // Title screen
      if (phase === 'title') {
        if (e.key === 'Enter') startGame();
        return;
      }

      // Result screen
      if (phase === 'result') {
        if (e.key === 'Enter') startGame();
        if (e.key === 'Escape') setPhase('title');
        return;
      }

      if (phase !== 'normal' && phase !== 'boss') return;
      if (castingAnimation) return;

      // Boss phase spell selection
      if (phase === 'boss') {
        const numKey = parseInt(e.key);
        if (numKey >= 1 && numKey <= 5) {
          const spell = attackSpells[numKey - 1];
          setCurrentSpell(spell);
          setSelectedBossSpellIndex(numKey - 1);
          setCurrentSegmentIndex(0);
          setCompletedSegments(0);
          setCurrentSpellHasMiss(false);
          setTypingState(createTypingState(spell.segments[0]));
          return;
        }
        if (e.key.toLowerCase() === 'q') {
          setCurrentSpell(defenseSpells[0]);
          setSelectedBossSpellIndex(attackSpells.length);
          setCurrentSegmentIndex(0);
          setCompletedSegments(0);
          setCurrentSpellHasMiss(false);
          setTypingState(createTypingState(defenseSpells[0].segments[0]));
          return;
        }
        if (e.key.toLowerCase() === 'w') {
          setCurrentSpell(defenseSpells[1]);
          setSelectedBossSpellIndex(attackSpells.length + 1);
          setCurrentSegmentIndex(0);
          setCompletedSegments(0);
          setCurrentSpellHasMiss(false);
          setTypingState(createTypingState(defenseSpells[1].segments[0]));
          return;
        }
      }

      // Typing input - only process single alphabetic keys
      const key = e.key.toLowerCase();
      if (key.length !== 1 || !/[a-z-]/.test(key)) return;

      if (!typingState || !currentSpell) return;

      setTotalTyped(prev => prev + 1);

      const { result, state: newState } = processInput(typingState, key);

      if (result === 'miss') {
        setCurrentSpellHasMiss(true);
        // Reset to segment start
        const seg = currentSpell.segments[currentSegmentIndex];
        setTypingState(createTypingState(seg));
        return;
      }

      setCorrectTyped(prev => prev + 1);

      if (result === 'complete') {
        // Segment complete
        const nextSeg = currentSegmentIndex + 1;
        if (nextSeg >= currentSpell.segments.length) {
          // Spell complete!
          setTypingState(newState);
          setCompletedSegments(nextSeg);
          onSpellComplete();
        } else {
          setCurrentSegmentIndex(nextSeg);
          setCompletedSegments(nextSeg);
          setTypingState(createTypingState(currentSpell.segments[nextSeg]));
        }
      } else {
        setTypingState(newState);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, typingState, currentSpell, currentSegmentIndex, castingAnimation,
      startGame, onSpellComplete, selectedBossSpellIndex]);

  // Render
  if (phase === 'title') {
    const scores = loadHighScores();
    return <TitleScreen onStart={startGame} highScore={scores[0]?.score || 0} />;
  }

  if (phase === 'result') {
    return (
      <ResultScreen
        score={score} wave={wave} maxCombo={maxCombo}
        enemiesDefeated={enemiesDefeated} noMissCount={noMissCount}
        totalTyped={totalTyped} correctTyped={correctTyped}
        isNewHighScore={isNewHighScore}
        onRetry={startGame} onTitle={() => setPhase('title')}
      />
    );
  }

  if (phase === 'wave-intro') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background select-none">
        <div className="text-center" style={{ animation: 'wave-title 2s ease-in-out forwards' }}>
          <h2 className="font-sans-jp text-5xl font-black tracking-[0.4em] text-foreground">
            {waveIntroText}
          </h2>
        </div>
      </div>
    );
  }

  const isBoss = phase === 'boss';
  const currentEnemy = isBoss ? bossEnemy : (enemies[currentEnemyIndex] || null);

  return (
    <div className={`relative min-h-screen bg-background select-none overflow-hidden ${
      damageFlash ? 'animate-screen-shake' : ''
    }`}>
      {/* Damage flash overlay */}
      {damageFlash && (
        <div
          className="absolute inset-0 z-50 pointer-events-none border-[6px] border-destructive/60"
          style={{ animation: 'damage-flash 0.3s ease-out forwards' }}
        />
      )}

      {/* Boss warning overlay */}
      {bossWarning && (
        <div className="absolute inset-0 z-40 pointer-events-none border-2 border-timer-warning/20 animate-pulse" />
      )}

      {/* HUD */}
      <HUD
        score={score} wave={wave} combo={combo}
        playerHp={playerHp} playerMaxHp={100}
        isBoss={isBoss}
        bossName={bossEnemy?.name}
        bossHp={bossEnemy?.hp}
        bossMaxHp={bossEnemy?.maxHp}
        timeRemaining={timeRemaining}
        timeLimit={timeLimit}
      />

      {/* Main game area */}
      <div className="flex min-h-screen">
        {/* Boss spell list */}
        {isBoss && (
          <div className="w-48 flex items-center">
            <BossSpellList
              selectedIndex={selectedBossSpellIndex}
              onSelect={(spell) => {
                const idx = [...attackSpells, ...defenseSpells].findIndex(s => s.id === spell.id);
                setSelectedBossSpellIndex(idx);
                setCurrentSpell(spell);
                setCurrentSegmentIndex(0);
                setCompletedSegments(0);
                setCurrentSpellHasMiss(false);
                setTypingState(createTypingState(spell.segments[0]));
              }}
            />
          </div>
        )}

        {/* Center area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
          {/* Enemy */}
          {currentEnemy && (
            <EnemyDisplay
              name={currentEnemy.name}
              type={currentEnemy.type}
              hpPercent={(currentEnemy.hp / currentEnemy.maxHp) * 100}
              isAttacking={false}
              isWarning={bossWarning}
            />
          )}

          {/* Magic Circle */}
          {currentSpell && (
            <MagicCircle
              progress={magicProgress}
              combo={combo}
              element={currentSpell.element}
              circleType={currentSpell.magicCircleType}
              castingAnimation={castingAnimation}
            />
          )}

          {/* Spacer for BLEACH-like negative space */}
          <div className="h-8" />

          {/* Spell display */}
          {currentSpell && typingState && !castingAnimation && (
            <SpellDisplay
              textJp={currentSpell.textJp}
              segments={currentSpell.segments}
              currentSegmentIndex={currentSegmentIndex}
              typingState={typingState}
              completedSegments={completedSegments}
            />
          )}

          {castingAnimation && currentSpell && (
            <div className="text-center animate-fade-in-up">
              <p className="font-serif-jp text-3xl tracking-[0.2em] text-foreground">
                {currentSpell.name}
              </p>
              <p className="font-serif-jp text-sm text-muted-foreground mt-2">
                {currentSpell.nameReading}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameManager;
