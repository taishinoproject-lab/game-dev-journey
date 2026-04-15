import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GamePhase, Spell, getComboMultiplier, HighScore } from '../game/types';
import { attackSpells, defenseSpells, allSpells, getRandomAttackSpell } from '../game/spells';
import {
  createTypingState, processInput, TypingState,
  getDisplayRomaji, getRomajiLength, getDisplayChar,
} from '../game/romajiEngine';
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

/**
 * inputBuffer をスペルの TypingState に沿ってリプレイし、
 * マッチすれば現在のセグメント位置と TypingState を返す。
 * マッチしなければ null を返す。
 */
function tryReplayInput(spell: Spell, inputBuffer: string): {
  segmentIndex: number;
  completedSegments: number;
  typingState: TypingState;
} | null {
  if (!inputBuffer) {
    return {
      segmentIndex: 0,
      completedSegments: 0,
      typingState: createTypingState(spell.segments[0]),
    };
  }

  let segmentIndex = 0;
  let completedSegments = 0;
  let state = createTypingState(spell.segments[0]);

  for (const key of inputBuffer) {
    const { result, state: newState } = processInput(state, key);

    if (result === 'miss') return null;
    if (result === 'absorb') continue;

    state = newState;

    if (result === 'complete') {
      completedSegments++;
      segmentIndex = completedSegments;
      if (segmentIndex >= spell.segments.length) {
        // 入力バッファだけで呪文が完成してしまった（通常は起きない）
        return { segmentIndex, completedSegments, typingState: state };
      }
      state = createTypingState(spell.segments[segmentIndex]);
    }
  }

  return { segmentIndex, completedSegments, typingState: state };
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
  // ボス戦: キー入力による候補絞り込み
  const [bossInputBuffer, setBossInputBuffer] = useState('');
  const [bossCandidates, setBossCandidates] = useState<Spell[]>(allSpells);
  // 視覚エフェクト専用（入力はブロックしない）
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

  /** ボス戦: 候補モードに戻す */
  const returnToCandidateMode = useCallback(() => {
    setCurrentSpell(null);
    setBossInputBuffer('');
    setBossCandidates(allSpells);
    setCurrentSegmentIndex(0);
    setCompletedSegments(0);
    setTypingState(null);
    setCurrentSpellHasMiss(false);
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

  // --- ボスフェーズ開始（呪文は未選択・候補モードで開始） ---
  const startBossPhase = useCallback((w: number) => {
    const boss = createBossEnemy(w);
    setBossEnemy(boss);
    setEnemies([]);
    setCastingAnimation(false);
    setCastingSpellName(null);
    setBossWarning(false);
    setBossWarningCountdown(null);

    setCurrentSpell(null);
    setBossInputBuffer('');
    setBossCandidates(allSpells);
    setCurrentSegmentIndex(0);
    setCompletedSegments(0);
    setTypingState(null);
    setCurrentSpellHasMiss(false);

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
    setBossInputBuffer(''); setBossCandidates(allSpells);
    showWaveIntro(1, false);
  }, [showWaveIntro]);

  // --- メインタイマー ---
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
        const warningStart = Date.now();
        setBossWarning(true);
        setBossWarningCountdown(warningMs / 1000);

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

        window.setTimeout(() => {
          if (bossCountdownIntervalRef.current) {
            clearInterval(bossCountdownIntervalRef.current);
            bossCountdownIntervalRef.current = null;
          }
          setBossWarning(false);
          setBossWarningCountdown(null);

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

  // --- タイムアップ → 次の敵（通常フェーズ） ---
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

  // --- 魔法陣進捗 ---
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
          for (let ci = 0; ci < typingState.currentCharIndex; ci++) {
            typedChars += getDisplayChar(typingState.chars[ci]).length;
          }
          typedChars += typingState.currentInput.length;
        }
        return totalChars > 0 ? typedChars / totalChars : 0;
      })()
    : 0;

  // --- 呪文完了処理 ---
  const onSpellComplete = useCallback(() => {
    if (!currentSpell) return;

    // アニメーション（ノンブロッキング）
    setCastingSpellName(`${currentSpell.name}（${currentSpell.nameReading}）`);
    setCastingAnimation(true);
    setTimeout(() => { setCastingAnimation(false); setCastingSpellName(null); }, 1500);

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

        // 呪文完了 → 候補モードに戻る
        returnToCandidateMode();
      }

    } else {
      // 防御呪文完了 → 候補モードに戻る
      if (phase === 'boss') returnToCandidateMode();
    }
  }, [currentSpell, combo, phase, enemies, currentEnemyIndex, wave, bossEnemy,
      timeRemaining, timeLimit, currentSpellHasMiss, showWaveIntro, returnToCandidateMode]);

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

      // --- Ctrl+C: 詠唱中断（ボス戦のみ）---
      if (e.ctrlKey && e.key === 'c') {
        if (phase === 'boss') {
          e.preventDefault();
          returnToCandidateMode();
        }
        return;
      }

      const key = e.key.toLowerCase();
      if (key.length !== 1 || !/[a-z-]/.test(key)) return;

      // ========== ボス戦: 候補モード（currentSpell が未確定）==========
      if (phase === 'boss' && !currentSpell) {
        const newBuffer = bossInputBuffer + key;

        // 全呪文に対して入力をリプレイして候補を絞り込む
        const matched: Array<{ spell: Spell; match: NonNullable<ReturnType<typeof tryReplayInput>> }> = [];
        for (const spell of allSpells) {
          const m = tryReplayInput(spell, newBuffer);
          if (m) matched.push({ spell, match: m });
        }

        if (matched.length === 0) {
          // どの呪文にもマッチしない → ミスフラッシュ、バッファは変えない
          setMissFlash(true);
          setTimeout(() => setMissFlash(false), 120);
          return;
        }

        setBossInputBuffer(newBuffer);
        setBossCandidates(matched.map(m => m.spell));

        if (matched.length === 1) {
          // 呪文が1つに確定
          const { spell, match } = matched[0];
          setCurrentSpell(spell);
          setCurrentSegmentIndex(match.segmentIndex);
          setCompletedSegments(match.completedSegments);
          setTypingState(match.typingState);
          setBossInputBuffer('');
          setCurrentSpellHasMiss(false);
        }
        return;
      }

      // ========== 通常タイピング（呪文確定後） ==========
      if (!typingState || !currentSpell) return;

      const { result, state: newState } = processInput(typingState, key);

      if (result === 'absorb') return; // ん 後の余分な n を無視

      setTotalTyped(prev => prev + 1);

      if (result === 'miss') {
        setCurrentSpellHasMiss(true);
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
  }, [phase, typingState, currentSpell, currentSegmentIndex, bossInputBuffer,
      startGame, onSpellComplete, returnToCandidateMode]);

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
  const inCandidateMode = isBoss && !currentSpell;

  return (
    <div className={`relative min-h-screen bg-background select-none overflow-hidden ${
      damageFlash ? 'animate-screen-shake' : ''
    }`}>
      {/* ダメージフラッシュ */}
      {damageFlash && (
        <div
          className="absolute inset-0 z-50 pointer-events-none border-[6px] border-destructive/60"
          style={{ animation: 'damage-flash 0.3s ease-out forwards' }}
        />
      )}

      {/* ボス攻撃警告フラッシュ */}
      {bossWarning && (
        <div className="absolute inset-0 z-40 pointer-events-none border-2 border-timer-warning/30 animate-pulse" />
      )}

      {/* 防御成功/失敗フィードバック */}
      {defenseResult && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className={`animate-fade-in-up text-center px-8 py-4 rounded-sm border ${
            defenseResult === 'success'
              ? 'border-primary/30 bg-primary/5'
              : 'border-destructive/30 bg-destructive/5'
          }`}>
            <p className={`font-serif-jp text-4xl font-bold tracking-[0.3em] ${
              defenseResult === 'success' ? 'text-primary' : 'text-destructive'
            }`}>
              {defenseResult === 'success' ? '防御成功' : '防御失敗'}
            </p>
          </div>
        </div>
      )}

      {/* 発動アニメーション（ノンブロッキング） */}
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
        {/* ボス戦: 呪文候補リスト（左パネル） */}
        {isBoss && (
          <div className="w-52 flex items-center overflow-y-auto">
            <BossSpellList
              candidates={bossCandidates}
              currentSpell={currentSpell}
              inputBuffer={bossInputBuffer}
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
          <MagicCircle
            progress={magicProgress}
            combo={combo}
            element={currentSpell?.element ?? 'light'}
            circleType={currentSpell?.magicCircleType ?? 'circle'}
            castingAnimation={castingAnimation}
          />

          <div className="h-4" />

          {/* 候補モード: 入力バッファ表示 */}
          {inCandidateMode && (
            <div className="flex flex-col items-center gap-2">
              <div className={`font-mono-code text-2xl tracking-[0.3em] min-h-[2.5rem] transition-colors ${
                missFlash ? 'text-destructive' : 'text-foreground'
              }`}>
                {bossInputBuffer
                  ? <>{bossInputBuffer}<span className="animate-pulse opacity-60">_</span></>
                  : <span className="text-muted-foreground/30 text-base tracking-normal font-sans-jp">
                      唱えたい呪文のローマ字を入力...
                    </span>
                }
              </div>
              {bossInputBuffer && (
                <p className="font-mono-code text-xs text-muted-foreground/40">
                  候補: {bossCandidates.length}件
                </p>
              )}
            </div>
          )}

          {/* 詠唱モード: 呪文テキスト表示 */}
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
