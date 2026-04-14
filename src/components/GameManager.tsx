import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GamePhase, Spell, getComboMultiplier, HighScore } from '../game/types';
import { attackSpells, defenseSpells, getRandomAttackSpell } from '../game/spells';
import { createTypingState, processInput, TypingState, getDisplayRomaji, getRomajiLength, getDisplayChar } from '../game/romajiEngine';
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
  const [bossWarningCountdown, setBossWarningCountdown] = useState<number | null>(null);
  const [selectedBossSpellIndex, setSelectedBossSpellIndex] = useState(0);
  // castingAnimation は視覚エフェクト専用。入力はブロックしない
  const [castingAnimation, setCastingAnimation] = useState(false);
  const [castingSpellName, setCastingSpellName] = useState<string | null>(null);
  const [waveIntroText, setWaveIntroText] = useState('');
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [defenseResult, setDefenseResult] = useState<'success' | 'fail' | null>(null);
  const [missFlash, setMissFlash] = useState(false);

  const timerRef = useRef<number | null>(null);
  const bossAttackTimerRef = useRef<number | null>(null);
  const bossCountdownIntervalRef = useRef<number | null>(null);
  const lastTickRef = useRef(Date.now());
  // ボス攻撃タイマーのコールバック内で currentSpell を読むためのref
  const currentSpellRef = useRef<Spell | null>(currentSpell);
  useEffect(() => { currentSpellRef.current = currentSpell; }, [currentSpell]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (bossAttackTimerRef.current) { clearTimeout(bossAttackTimerRef.current); bossAttackTimerRef.current = null; }
    if (bossCountdownIntervalRef.current) { clearInterval(bossCountdownIntervalRef.current); bossCountdownIntervalRef.current = null; }
  }, []);

  const takeDamage = useCallback((amount: number) => {
    setPlayerHp(prev => Math.max(0, prev - amount));
    setCombo(0);
    setDamageFlash(true);
    setTimeout(() => setDamageFlash(false), 300);
  }, []);

  // --- 通常フェーズ開始 ---
  const startNormalPhase = useCallback((w: number) => {
    const normalEnemies = createNormalEnemies(w);
    setEnemies(normalEnemies);
    setCurrentEnemyIndex(0);
    setBossEnemy(null);
    setCastingAnimation(false);
    setCastingSpellName(null);

    const spell = getRandomAttackSpell(w);
    setCurrentSpell(spell);
    setCurrentSegmentIndex(0);
    setCompletedSegments(0);
    setCurrentSpellHasMiss(false);
    setTypingState(createTypingState(spell.segments[0]));

    const rl = spell.segments.reduce((a, s) => a + getRomajiLength(s), 0);
    const tl = getNormalTimeLimit(rl, w);
    setTimeLimit(tl);
    setTimeRemaining(tl);
    lastTickRef.current = Date.now();
    setPhase('normal');
  }, []);

  // --- ボスフェーズ開始 ---
  const startBossPhase = useCallback((w: number) => {
    const boss = createBossEnemy(w);
    setBossEnemy(boss);
    setEnemies([]);
    setCastingAnimation(false);
    setCastingSpellName(null);
    setBossWarning(false);
    setBossWarningCountdown(null);

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

  // --- ウェーブイントロ ---
  const showWaveIntro = useCallback((w: number, isBoss: boolean) => {
    if (isBoss) {
      const boss = createBossEnemy(w);
      setWaveIntroText(boss.name);
    } else {
      setWaveIntroText(`WAVE ${w}`);
    }
    setPhase('wave-intro');
    setTimeout(() => {
      if (isBoss) startBossPhase(w);
      else startNormalPhase(w);
    }, 2000);
  }, [startNormalPhase, startBossPhase]);

  // --- ゲーム開始 ---
  const startGame = useCallback(() => {
    setScore(0); setCombo(0); setMaxCombo(0); setPlayerHp(100);
    setTotalTyped(0); setCorrectTyped(0); setEnemiesDefeated(0); setNoMissCount(0);
    setWave(1); setDamageFlash(false); setBossWarning(false); setBossWarningCountdown(null);
    setCastingAnimation(false); setCastingSpellName(null); setDefenseResult(null);
    showWaveIntro(1, false);
  }, [showWaveIntro]);

  // --- メインタイマー（50msごと） ---
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
          if (phase === 'normal') takeDamage(25);
          else takeDamage(35);
          return 0;
        }
        return next;
      });
    }, 50);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, clearTimers, takeDamage]);

  // --- ボス攻撃タイマー ---
  useEffect(() => {
    if (phase !== 'boss' || !bossEnemy) return;

    const intervalMs = (bossEnemy.attackInterval || 8) * 1000;
    const warningMs = (bossEnemy.attackWarningTime || 3) * 1000;
    const attackDamage = bossEnemy.attackDamage || 20;

    const scheduleAttack = () => {
      bossAttackTimerRef.current = window.setTimeout(() => {
        // 警告開始
        const warningStart = Date.now();
        setBossWarning(true);
        setBossWarningCountdown(warningMs / 1000);

        // カウントダウン更新（100msごと）
        bossCountdownIntervalRef.current = window.setInterval(() => {
          const elapsed = Date.now() - warningStart;
          const remaining = Math.max(0, (warningMs - elapsed) / 1000);
          setBossWarningCountdown(remaining);
          if (remaining <= 0) {
            if (bossCountdownIntervalRef.current) {
              clearInterval(bossCountdownIntervalRef.current);
              bossCountdownIntervalRef.current = null;
            }
          }
        }, 100);

        // 攻撃実行（警告時間後）
        window.setTimeout(() => {
          if (bossCountdownIntervalRef.current) {
            clearInterval(bossCountdownIntervalRef.current);
            bossCountdownIntervalRef.current = null;
          }
          setBossWarning(false);
          setBossWarningCountdown(null);

          // currentSpellRef で最新の呪文種別を参照
          if (currentSpellRef.current?.type !== 'defense') {
            takeDamage(attackDamage);
            setDefenseResult('fail');
          } else {
            setDefenseResult('success');
          }
          setTimeout(() => setDefenseResult(null), 1200);

          scheduleAttack();
        }, warningMs);
      }, intervalMs - warningMs);
    };

    scheduleAttack();

    return () => {
      if (bossAttackTimerRef.current) clearTimeout(bossAttackTimerRef.current);
      if (bossCountdownIntervalRef.current) clearInterval(bossCountdownIntervalRef.current);
    };
  // currentSpell?.type を依存から外してrefで読む
  }, [phase, bossEnemy, takeDamage]); // eslint-disable-line

  // --- ゲームオーバー判定 ---
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

  // --- タイムアップ → 次の敵へ（通常フェーズ） ---
  useEffect(() => {
    if (timeRemaining <= 0 && phase === 'normal') {
      const nextIndex = currentEnemyIndex + 1;
      if (nextIndex >= enemies.length) {
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

  // --- 魔法陣進捗計算 ---
  const magicProgress = currentSpell
    ? (() => {
        const totalChars = currentSpell.segments.reduce(
          (acc, s) => acc + getDisplayRomaji(s).length, 0
        );
        let typedChars = 0;
        for (let i = 0; i < completedSegments; i++) {
          typedChars += getDisplayRomaji(currentSpell.segments[i]).length;
        }
        if (typingState && currentSegmentIndex === completedSegments) {
          const chars = typingState.chars;
          for (let ci = 0; ci < typingState.currentCharIndex; ci++) {
            typedChars += getDisplayChar(chars[ci]).length;
          }
          typedChars += typingState.currentInput.length;
        }
        return totalChars > 0 ? typedChars / totalChars : 0;
      })()
    : 0;

  // --- 呪文完了処理（ゲームロジックを即時実行、アニメーションは非同期） ---
  const onSpellComplete = useCallback(() => {
    if (!currentSpell) return;

    // 完了した呪文の名前をキャプチャしてアニメーション表示（非ブロッキング）
    setCastingSpellName(`${currentSpell.name}（${currentSpell.nameReading}）`);
    setCastingAnimation(true);
    setTimeout(() => {
      setCastingAnimation(false);
      setCastingSpellName(null);
    }, 1500);

    if (currentSpell.type === 'attack') {
      const multiplier = getComboMultiplier(combo);
      const damage = Math.floor(currentSpell.baseDamage * multiplier);

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

        // 即座に次の呪文をセット（アニメーション待ちなし）
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

        // ボス戦: 同じ呪文を即座にリセット
        setCurrentSegmentIndex(0);
        setCompletedSegments(0);
        setCurrentSpellHasMiss(false);
        setTypingState(createTypingState(currentSpell.segments[0]));
      }
    } else {
      // 防御呪文完了 → 攻撃呪文に戻す
      if (phase === 'boss') {
        const spell = attackSpells[selectedBossSpellIndex < attackSpells.length ? selectedBossSpellIndex : 0];
        setCurrentSpell(spell);
        setCurrentSegmentIndex(0);
        setCompletedSegments(0);
        setCurrentSpellHasMiss(false);
        setTypingState(createTypingState(spell.segments[0]));
      }
    }
  }, [currentSpell, combo, phase, enemies, currentEnemyIndex, wave, bossEnemy,
      timeRemaining, timeLimit, currentSpellHasMiss, showWaveIntro, selectedBossSpellIndex]);

  // --- キーボード入力 ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (phase === 'title') {
        if (e.key === 'Enter') startGame();
        return;
      }
      if (phase === 'result') {
        if (e.key === 'Enter') startGame();
        if (e.key === 'Escape') setPhase('title');
        return;
      }
      if (phase !== 'normal' && phase !== 'boss') return;
      // castingAnimation 中も入力を受け付ける（ブロックしない）

      // ボス戦呪文切替キー
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

      const key = e.key.toLowerCase();
      if (key.length !== 1 || !/[a-z-]/.test(key)) return;
      if (!typingState || !currentSpell) return;

      const { result, state: newState } = processInput(typingState, key);

      // ん の後の余分な n を無音でスキップ（カウントしない）
      if (result === 'absorb') return;

      setTotalTyped(prev => prev + 1);

      if (result === 'miss') {
        setCurrentSpellHasMiss(true);
        // 巻き戻しなし: 現在位置をそのまま維持
        // ミスフラッシュで視覚フィードバック
        setMissFlash(true);
        setTimeout(() => setMissFlash(false), 120);
        return;
      }

      setCorrectTyped(prev => prev + 1);

      if (result === 'complete') {
        const nextSeg = currentSegmentIndex + 1;
        if (nextSeg >= currentSpell.segments.length) {
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
  }, [phase, typingState, currentSpell, currentSegmentIndex,
      startGame, onSpellComplete, selectedBossSpellIndex]);

  // --- レンダリング ---
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
      {/* ダメージフラッシュ（画面縁赤） */}
      {damageFlash && (
        <div
          className="absolute inset-0 z-50 pointer-events-none border-[6px] border-destructive/60"
          style={{ animation: 'damage-flash 0.3s ease-out forwards' }}
        />
      )}

      {/* ボス攻撃警告フラッシュ（画面縁パルス） */}
      {bossWarning && (
        <div className="absolute inset-0 z-40 pointer-events-none border-2 border-timer-warning/30 animate-pulse" />
      )}

      {/* 防御成功 / 失敗フィードバック */}
      {defenseResult && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className={`animate-fade-in-up text-center px-8 py-4 rounded-sm ${
            defenseResult === 'success'
              ? 'border border-primary/30 bg-primary/5'
              : 'border border-destructive/30 bg-destructive/5'
          }`}>
            <p className={`font-serif-jp text-4xl font-bold tracking-[0.3em] ${
              defenseResult === 'success' ? 'text-primary' : 'text-destructive'
            }`}>
              {defenseResult === 'success' ? '防御成功' : '防御失敗'}
            </p>
          </div>
        </div>
      )}

      {/* 発動アニメーションオーバーレイ（入力はブロックしない） */}
      {castingAnimation && castingSpellName && (
        <div className="absolute inset-x-0 top-1/3 z-20 pointer-events-none flex justify-center">
          <p className="font-serif-jp text-2xl tracking-[0.3em] text-foreground/60 animate-fade-in-up">
            {castingSpellName}
          </p>
        </div>
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

      {/* ゲームエリア */}
      <div className="flex min-h-screen">
        {/* ボス呪文リスト（左） */}
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

        {/* 中央エリア */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
          {/* 敵表示 */}
          {currentEnemy && (
            <EnemyDisplay
              name={currentEnemy.name}
              type={currentEnemy.type}
              hpPercent={(currentEnemy.hp / currentEnemy.maxHp) * 100}
              isAttacking={false}
              isWarning={bossWarning}
              warningCountdown={bossWarningCountdown}
            />
          )}

          {/* 魔法陣 */}
          {currentSpell && (
            <MagicCircle
              progress={magicProgress}
              combo={combo}
              element={currentSpell.element}
              circleType={currentSpell.magicCircleType}
              castingAnimation={castingAnimation}
            />
          )}

          <div className="h-8" />

          {/* 呪文テキスト（常時表示、アニメーション中も入力可） */}
          {currentSpell && typingState && (
            <SpellDisplay
              textJp={currentSpell.textJp}
              segments={currentSpell.segments}
              currentSegmentIndex={currentSegmentIndex}
              typingState={typingState}
              completedSegments={completedSegments}
              missFlash={missFlash}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GameManager;
