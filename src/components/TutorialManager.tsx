import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Spell } from '../game/types';
import { attackSpells, defenseSpells } from '../game/spells';
import {
  createTypingState, processInput, TypingState,
  getDisplayRomaji, getDisplayChar,
} from '../game/romajiEngine';
import { markFirstTutorialDone } from '../game/firstPlay';
import SpellDisplay from './SpellDisplay';
import MagicCircle from './MagicCircle';
import BossSpellList from './BossSpellList';

// =========================================================
// 型 & 定数
// =========================================================

type TutorialStep =
  | 'attack-basic'    // STEP 1: 衝を打つ（タイマーなし）
  | 'attack-advanced' // STEP 2: 赤火砲を打つ（2セグメント体験）
  | 'defense-seki'    // STEP 3: 攻撃予告 → 斥で防ぐ
  | 'defense-dankuu'  // STEP 4: 攻撃予告 → 断空で防ぐ
  | 'boss-candidate'  // STEP 5: 攻撃呪文を候補から選んで完成
  | 'complete';

const STEP_ORDER: TutorialStep[] = [
  'attack-basic', 'attack-advanced', 'defense-seki',
  'defense-dankuu', 'boss-candidate', 'complete',
];

const SPELL_SEKI = defenseSpells.find(s => s.id === 'bakudo_001')!;
const SPELL_DANKUU = defenseSpells.find(s => s.id === 'bakudo_081')!;
const SPELL_SAI = attackSpells.find(s => s.id === 'hado_001')!;          // 衝
const SPELL_SHAKKAHOU = attackSpells.find(s => s.id === 'hado_031')!;    // 赤火砲

interface StepConfig {
  number: number;
  title: string;
  instruction: string;
  mode: 'direct' | 'candidate';
  spell?: Spell;          // direct モード時の固定呪文
  pool?: Spell[];         // candidate モード時の候補プール
  hasWarning?: boolean;   // 攻撃予告を発動するか
  warningDelay?: number;  // 準備フェーズの長さ ms（入力無効・呪文を先に見せる）
  warningDuration?: number; // カウントダウンの長さ ms
}

const STEP_CONFIG: Record<Exclude<TutorialStep, 'complete'>, StepConfig> = {
  'attack-basic': {
    number: 1,
    title: '破道の基礎',
    instruction: '画面の呪文をローマ字で入力せよ  ·  時間制限なし',
    mode: 'direct',
    spell: SPELL_SAI,
  },
  'attack-advanced': {
    number: 2,
    title: '節の詠唱',
    instruction: '呪文には複数の節がある。節が終わるたびに次へ続く',
    mode: 'direct',
    spell: SPELL_SHAKKAHOU,
  },
  'defense-seki': {
    number: 3,
    title: '縛道の基礎 — 斥',
    instruction: '攻撃が迫る — 斥を詠唱して防げ',
    mode: 'direct',
    spell: SPELL_SEKI,
    hasWarning: true,
    warningDelay: 3000,    // 3秒間の準備フェーズ
    warningDuration: 10000, // 10秒カウントダウン
  },
  'defense-dankuu': {
    number: 4,
    title: '縛道の応用 — 断空',
    instruction: '二節の盾。詠唱を完了させよ',
    mode: 'direct',
    spell: SPELL_DANKUU,
    hasWarning: true,
    warningDelay: 3000,
    warningDuration: 16000, // 16秒カウントダウン（断空は長い）
  },
  'boss-candidate': {
    number: 5,
    title: 'ボス戦の詠唱',
    instruction: 'タイプするたびに候補が絞られる。攻撃呪文を一つ完成させよ',
    mode: 'candidate',
    pool: attackSpells,
    hasWarning: false,
  },
};

// =========================================================
// tryReplayInput (GameManager と同じロジック)
// =========================================================

function tryReplayInput(spell: Spell, buffer: string): {
  segmentIndex: number;
  completedSegments: number;
  typingState: TypingState;
} | null {
  if (!buffer) {
    return { segmentIndex: 0, completedSegments: 0, typingState: createTypingState(spell.segments[0]) };
  }
  let segIdx = 0, completed = 0;
  let state = createTypingState(spell.segments[0]);
  for (const key of buffer) {
    const { result, state: next } = processInput(state, key);
    if (result === 'miss') return null;
    if (result === 'absorb') continue;
    state = next;
    if (result === 'complete') {
      completed++;
      segIdx = completed;
      if (segIdx >= spell.segments.length) return { segmentIndex: segIdx, completedSegments: completed, typingState: state };
      state = createTypingState(spell.segments[segIdx]);
    }
  }
  return { segmentIndex: segIdx, completedSegments: completed, typingState: state };
}

// =========================================================
// コンポーネント
// =========================================================

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

const TutorialManager: React.FC<Props> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState<TutorialStep>('attack-basic');
  const [stepDone, setStepDone] = useState(false);

  // 入力状態 (direct / candidate 両用)
  const [currentSpell, setCurrentSpell] = useState<Spell | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [completedSegments, setCompletedSegments] = useState(0);
  const [typingState, setTypingState] = useState<TypingState | null>(null);
  const [missFlash, setMissFlash] = useState(false);

  // Candidate モード専用
  const [inputBuffer, setInputBuffer] = useState('');
  const [candidates, setCandidates] = useState<Spell[]>([]);

  // 攻撃予告（縛道ステップ）
  const [warningActive, setWarningActive] = useState(false);
  const [warningPending, setWarningPending] = useState(false); // 準備フェーズ中（入力無効）
  const [warningCountdown, setWarningCountdown] = useState<number | null>(null);
  const [defenseFailed, setDefenseFailed] = useState(false);

  // 演出
  const [castingAnimation, setCastingAnimation] = useState(false);
  const [castingSpellName, setCastingSpellName] = useState<string | null>(null);

  const warningIntervalRef = useRef<number | null>(null);
  const warningStartRef = useRef<number>(0);

  // ─── ステップ初期化 ───────────────────────────────────
  const initStep = useCallback((newStep: TutorialStep) => {
    if (warningIntervalRef.current) { clearInterval(warningIntervalRef.current); warningIntervalRef.current = null; }
    setStep(newStep);
    setStepDone(false);
    setMissFlash(false);
    setCastingAnimation(false);
    setCastingSpellName(null);
    setWarningActive(false);
    setWarningPending(false);
    setWarningCountdown(null);
    setDefenseFailed(false);
    setCurrentSpell(null);
    setCurrentSegmentIndex(0);
    setCompletedSegments(0);
    setTypingState(null);
    setInputBuffer('');
    setCandidates([]);

    if (newStep === 'complete') return;

    const cfg = STEP_CONFIG[newStep];
    if (cfg.mode === 'direct' && cfg.spell) {
      setCurrentSpell(cfg.spell);
      setTypingState(createTypingState(cfg.spell.segments[0]));
    } else if (cfg.mode === 'candidate' && cfg.pool) {
      setCandidates(cfg.pool);
    }
  }, []);

  // 初回マウント
  useEffect(() => { initStep('attack-basic'); }, [initStep]);

  // ─── 攻撃予告タイマー ────────────────────────────────
  const startWarning = useCallback((duration: number) => {
    if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
    setWarningActive(true);
    setWarningCountdown(duration / 1000);
    warningStartRef.current = Date.now();

    warningIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - warningStartRef.current;
      const remaining = Math.max(0, (duration - elapsed) / 1000);
      setWarningCountdown(remaining);
      if (remaining <= 0) {
        if (warningIntervalRef.current) { clearInterval(warningIntervalRef.current); warningIntervalRef.current = null; }
        setWarningActive(false);
        setWarningCountdown(null);
        setDefenseFailed(true);
      }
    }, 100);
  }, []);

  // 縛道ステップの警告開始（ステップ開始 & 防御失敗リセット後）
  useEffect(() => {
    const cfg = step !== 'complete' ? STEP_CONFIG[step] : null;
    if (!cfg?.hasWarning || stepDone || defenseFailed) return;

    const delay = cfg.warningDelay ?? 0;
    const duration = cfg.warningDuration ?? 6000;

    if (delay > 0) {
      setWarningPending(true);
      const prepTimer = window.setTimeout(() => {
        setWarningPending(false);
        startWarning(duration);
      }, delay);
      return () => {
        clearTimeout(prepTimer);
        if (warningIntervalRef.current) { clearInterval(warningIntervalRef.current); warningIntervalRef.current = null; }
      };
    } else {
      startWarning(duration);
      return () => { if (warningIntervalRef.current) { clearInterval(warningIntervalRef.current); warningIntervalRef.current = null; } };
    }
  }, [step, stepDone, defenseFailed, startWarning]);

  // 防御失敗 → 2秒後にリトライ
  useEffect(() => {
    if (!defenseFailed || stepDone) return;
    const timer = setTimeout(() => {
      if (step === 'complete') return;
      const cfg = STEP_CONFIG[step as Exclude<TutorialStep, 'complete'>];
      setCurrentSegmentIndex(0);
      setCompletedSegments(0);
      setInputBuffer('');
      if (cfg.mode === 'direct' && cfg.spell) {
        // direct モード: 呪文はそのまま、打鍵状態だけリセット
        setTypingState(createTypingState(cfg.spell.segments[0]));
      } else {
        setCurrentSpell(null);
        setTypingState(null);
        setCandidates(cfg.pool ?? []);
      }
      setDefenseFailed(false); // → warning useEffect が再発火して準備フェーズに入る
    }, 2000);
    return () => clearTimeout(timer);
  }, [defenseFailed, stepDone, step]);

  // ─── 呪文完了処理 ─────────────────────────────────────
  const onSpellComplete = useCallback((spell: Spell) => {
    if (warningIntervalRef.current) { clearInterval(warningIntervalRef.current); warningIntervalRef.current = null; }
    setWarningActive(false);
    setWarningPending(false);
    setWarningCountdown(null);
    setCastingSpellName(`${spell.name}（${spell.nameReading}）`);
    setCastingAnimation(true);
    setStepDone(true);

    setTimeout(() => {
      setCastingAnimation(false);
      setCastingSpellName(null);
      const idx = STEP_ORDER.indexOf(step);
      initStep(STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)]);
    }, 1800);
  }, [step, initStep]);

  // チュートリアル完了
  useEffect(() => {
    if (step !== 'complete') return;
    markFirstTutorialDone();
    const timer = setTimeout(onComplete, 2200);
    return () => clearTimeout(timer);
  }, [step, onComplete]);

  // ─── キーボード入力 ───────────────────────────────────
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.key === 'Escape') { onSkip(); return; }
      if (step === 'complete' || stepDone || defenseFailed || warningPending) return;

      const cfg = step !== 'complete' ? STEP_CONFIG[step] : null;
      if (!cfg) return;

      // Ctrl+C: 候補モードでリセット
      if (e.ctrlKey && e.key === 'c') {
        if (cfg.mode === 'candidate' && currentSpell) {
          e.preventDefault();
          setCurrentSpell(null);
          setTypingState(null);
          setInputBuffer('');
          setCandidates(cfg.pool ?? []);
          setCurrentSegmentIndex(0);
          setCompletedSegments(0);
        }
        return;
      }

      const key = e.key.toLowerCase();
      if (key.length !== 1 || !/[a-z-]/.test(key)) return;

      // ===== Direct モード (STEP 1, 2, 3, 4) =====
      if (cfg.mode === 'direct') {
        if (!typingState || !currentSpell) return;
        const { result, state: newState } = processInput(typingState, key);
        if (result === 'absorb') return;
        if (result === 'miss') {
          setMissFlash(true);
          setTimeout(() => setMissFlash(false), 120);
          return;
        }
        if (result === 'complete') {
          const nextSeg = currentSegmentIndex + 1;
          if (nextSeg >= currentSpell.segments.length) {
            setTypingState(newState);
            setCompletedSegments(nextSeg);
            onSpellComplete(currentSpell);
          } else {
            setCurrentSegmentIndex(nextSeg);
            setCompletedSegments(nextSeg);
            setTypingState(createTypingState(currentSpell.segments[nextSeg]));
          }
        } else {
          setTypingState(newState);
        }
        return;
      }

      // ===== Candidate モード (STEP 5) =====
      if (!currentSpell) {
        // 候補絞り込み中
        const newBuffer = inputBuffer + key;
        const pool = cfg.pool ?? [];
        const matched: Array<{ spell: Spell; match: NonNullable<ReturnType<typeof tryReplayInput>> }> = [];
        for (const spell of pool) {
          const m = tryReplayInput(spell, newBuffer);
          if (m) matched.push({ spell, match: m });
        }
        if (matched.length === 0) {
          setMissFlash(true);
          setTimeout(() => setMissFlash(false), 120);
          return;
        }
        setInputBuffer(newBuffer);
        setCandidates(matched.map(m => m.spell));
        if (matched.length === 1) {
          const { spell, match } = matched[0];
          setCurrentSpell(spell);
          setCurrentSegmentIndex(match.segmentIndex);
          setCompletedSegments(match.completedSegments);
          setTypingState(match.typingState);
          setInputBuffer('');
        }
        return;
      }

      // 呪文確定後の詠唱
      if (!typingState) return;
      const { result, state: newState } = processInput(typingState, key);
      if (result === 'absorb') return;
      if (result === 'miss') {
        setMissFlash(true);
        setTimeout(() => setMissFlash(false), 120);
        return;
      }
      if (result === 'complete') {
        const nextSeg = currentSegmentIndex + 1;
        if (nextSeg >= currentSpell.segments.length) {
          setTypingState(newState);
          setCompletedSegments(nextSeg);
          onSpellComplete(currentSpell);
        } else {
          setCurrentSegmentIndex(nextSeg);
          setCompletedSegments(nextSeg);
          setTypingState(createTypingState(currentSpell.segments[nextSeg]));
        }
      } else {
        setTypingState(newState);
      }
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [step, stepDone, defenseFailed, warningPending, typingState, currentSpell,
      currentSegmentIndex, inputBuffer, onSpellComplete, onSkip]);

  // ─── 魔法陣進捗 ──────────────────────────────────────
  const magicProgress = (() => {
    if (!currentSpell) return 0;
    const totalChars = currentSpell.segments.reduce((a, s) => a + getDisplayRomaji(s).length, 0);
    let typedChars = 0;
    for (let i = 0; i < completedSegments; i++) typedChars += getDisplayRomaji(currentSpell.segments[i]).length;
    if (typingState && currentSegmentIndex === completedSegments) {
      for (let ci = 0; ci < typingState.currentCharIndex && ci < typingState.chars.length; ci++) {
        typedChars += getDisplayChar(typingState.chars[ci]).length;
      }
      typedChars += typingState.currentInput.length;
    }
    return totalChars > 0 ? typedChars / totalChars : 0;
  })();

  // ─── 完了画面 ─────────────────────────────────────────
  if (step === 'complete') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background select-none">
        <div className="text-center animate-fade-in-up">
          <p className="font-mono-code text-[10px] tracking-[0.5em] text-muted-foreground/40 mb-4">
            TRAINING COMPLETE
          </p>
          <h2 className="font-serif-jp text-3xl tracking-[0.4em] text-foreground">訓練完了</h2>
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-muted-foreground/40 to-transparent mx-auto mt-6" />
          <p className="font-sans-jp text-sm text-muted-foreground/60 mt-6 tracking-[0.4em]">
            本番に挑め
          </p>
        </div>
      </div>
    );
  }

  // ─── メインレンダリング ───────────────────────────────
  const cfg = STEP_CONFIG[step];
  const isCandidateMode = cfg.mode === 'candidate';
  const inCandidateSelect = isCandidateMode && !currentSpell;
  const isDefenseStep = step === 'defense-seki' || step === 'defense-dankuu';

  return (
    <div className="relative min-h-screen bg-background select-none overflow-hidden">

      {/* 攻撃予告フラッシュ（カウントダウン中） */}
      {warningActive && (
        <div className="absolute inset-0 z-40 pointer-events-none border-2 border-timer-warning/40 animate-pulse" />
      )}

      {/* 準備フェーズ：背景をほんのり赤みに */}
      {warningPending && (
        <div className="absolute inset-0 z-40 pointer-events-none border border-destructive/20" />
      )}

      {/* 防御失敗オーバーレイ */}
      {defenseFailed && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="border border-destructive/30 bg-destructive/5 px-10 py-5 rounded-sm text-center animate-fade-in-up">
            <p className="font-serif-jp text-3xl font-bold tracking-[0.3em] text-destructive">防御失敗</p>
            <p className="font-sans-jp text-xs text-muted-foreground/60 mt-2 tracking-widest">
              もう一度試みよ
            </p>
          </div>
        </div>
      )}

      {/* 詠唱完了アニメーション */}
      {castingAnimation && castingSpellName && (
        <div className="absolute inset-x-0 top-1/3 z-20 pointer-events-none flex justify-center">
          <p className="font-serif-jp text-2xl tracking-[0.3em] text-foreground/60 animate-fade-in-up">
            {castingSpellName}
          </p>
        </div>
      )}

      {/* チュートリアルヘッダー */}
      <div className="absolute top-0 inset-x-0 z-10 flex flex-col items-center pt-6 pb-5 pointer-events-none">
        <p className="font-mono-code text-[10px] tracking-[0.5em] text-muted-foreground/30 mb-1">
          TRAINING &nbsp;{cfg.number} / 5
        </p>
        <p className="font-serif-jp text-base tracking-[0.3em] text-foreground/75 mb-1">
          {cfg.title}
        </p>
        <p className="font-mono-code text-xs text-muted-foreground/50 tracking-wider">
          {cfg.instruction}
        </p>

        {/* 準備フェーズメッセージ */}
        {warningPending && (
          <p className="font-serif-jp text-sm tracking-[0.3em] text-timer-warning/80 mt-2 animate-pulse">
            攻撃迫る — 備えよ
          </p>
        )}

        {/* 攻撃予告カウントダウン */}
        {warningActive && warningCountdown !== null && (
          <p className={`font-mono-code text-lg mt-2 font-bold tabular-nums ${
            warningCountdown < 3 ? 'text-destructive animate-pulse' : 'text-timer-warning'
          }`}>
            {warningCountdown.toFixed(1)}
          </p>
        )}
      </div>

      {/* メインレイアウト */}
      <div className="flex min-h-screen">
        {/* 候補リスト（左パネル）— STEP 5 のみ */}
        {isCandidateMode && (
          <div className="w-52 flex items-center overflow-y-auto pt-24">
            <BossSpellList
              candidates={candidates}
              currentSpell={currentSpell}
              inputBuffer={inputBuffer}
            />
          </div>
        )}

        {/* 中央エリア */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">

          {/* 魔法陣 */}
          <MagicCircle
            progress={magicProgress}
            combo={0}
            element={currentSpell?.element ?? 'light'}
            circleType={currentSpell?.magicCircleType ?? 'circle'}
            castingAnimation={castingAnimation}
          />

          <div className="h-2" />

          {/* 縛道ラベル（防御ステップのみ） */}
          {isDefenseStep && currentSpell && (
            <div className="flex items-center gap-2">
              <span className="font-mono-code text-xs tracking-[0.3em] text-muted-foreground/60 border border-muted-foreground/30 px-2 py-0.5">
                縛道 · 防御呪文
              </span>
            </div>
          )}

          {/* 候補モード: 入力バッファ & 絞り込み表示 */}
          {inCandidateSelect && (
            <div className="flex flex-col items-center gap-4">
              {/* 入力バッファ */}
              <div className={`font-mono-code text-2xl tracking-[0.3em] min-h-[2.5rem] transition-colors ${
                missFlash ? 'text-destructive' : 'text-foreground'
              }`}>
                {inputBuffer
                  ? <>{inputBuffer}<span className="animate-pulse opacity-60">_</span></>
                  : (
                    <span className="text-muted-foreground/30 text-base font-sans-jp tracking-normal">
                      呪文のローマ字を入力...
                    </span>
                  )
                }
              </div>

              {/* 候補が全候補より減ったとき詳細表示 */}
              {inputBuffer && candidates.length < (cfg.pool?.length ?? 0) && (
                <div className="flex flex-col items-center gap-4">
                  {candidates.map(spell => {
                    const replay = tryReplayInput(spell, inputBuffer);
                    return (
                      <div key={spell.id} className="flex flex-col items-center gap-1.5 px-6 py-3 rounded border border-foreground/10">
                        <span className="font-serif-jp text-lg text-foreground/70 tracking-widest">
                          {spell.name}
                          <span className="font-sans-jp text-sm text-muted-foreground/50 ml-2">（{spell.nameReading}）</span>
                        </span>
                        <div className="font-mono-code text-xl tracking-wider flex flex-wrap gap-x-1">
                          {spell.segments.map((seg, si) => {
                            const segRomaji = getDisplayRomaji(seg);
                            const isComplete = replay ? si < replay.completedSegments : false;
                            const isCurrent = replay ? si === replay.segmentIndex : false;
                            if (isComplete) return <span key={si} className="text-primary/70">{segRomaji}</span>;
                            if (isCurrent && replay) {
                              let typedLen = 0;
                              for (let ci = 0; ci < replay.typingState.currentCharIndex && ci < replay.typingState.chars.length; ci++) {
                                typedLen += getDisplayChar(replay.typingState.chars[ci]).length;
                              }
                              typedLen += replay.typingState.currentInput.length;
                              return (
                                <span key={si}>
                                  <span className="text-foreground">{segRomaji.slice(0, typedLen)}</span>
                                  <span className="text-muted-foreground/50">{segRomaji.slice(typedLen)}</span>
                                </span>
                              );
                            }
                            return <span key={si} className="text-muted-foreground/40">{segRomaji}</span>;
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 詠唱モード / direct モード: SpellDisplay */}
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

      {/* スキップボタン（右上） */}
      <button
        onClick={onSkip}
        className="absolute top-6 right-8 font-mono-code text-xs tracking-[0.3em] text-muted-foreground/20 hover:text-muted-foreground/50 transition-colors duration-500"
      >
        SKIP →
      </button>

      {/* 下部ヒント */}
      <div className="absolute bottom-5 inset-x-0 flex justify-center gap-8 pointer-events-none">
        {isCandidateMode && currentSpell && (
          <p className="font-mono-code text-[10px] text-muted-foreground/25 tracking-[0.3em]">
            Ctrl+C: 詠唱中断
          </p>
        )}
        <p className="font-mono-code text-[10px] text-muted-foreground/20 tracking-[0.2em]">
          Esc: スキップ
        </p>
      </div>
    </div>
  );
};

export default TutorialManager;
