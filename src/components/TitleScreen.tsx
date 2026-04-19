import React, { useState, useEffect } from 'react';
import SpellListOverlay from './SpellListOverlay';
import HowToPlayOverlay from './HowToPlayOverlay';

interface TitleScreenProps {
  onStart: () => void;
  highScore: number;
}

const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, highScore }) => {
  const [showSpellList, setShowSpellList] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setShowSpellList(prev => !prev);
        return;
      }
      if (e.key === '?') {
        setShowHowToPlay(prev => !prev);
        return;
      }
      // Tab: ページにフォーカスがある場合のサブ手段として残す
      if (e.key === 'Tab') {
        e.preventDefault();
        onStart();
        return;
      }
      if (e.key === 'Enter') {
        onStart();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onStart]);

  if (showSpellList) {
    return <SpellListOverlay onClose={() => setShowSpellList(false)} />;
  }
  if (showHowToPlay) {
    return <HowToPlayOverlay onClose={() => setShowHowToPlay(false)} />;
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background select-none">

      {/* スキップボタン（右上）*/}
      <button
        onClick={onStart}
        className="absolute top-6 right-8 font-mono-code text-xs tracking-[0.3em] text-muted-foreground/30 hover:text-muted-foreground/70 transition-colors duration-500"
      >
        SKIP →
      </button>

      {/* Large empty space above - BLEACH aesthetic */}
      <div className="flex-1" />

      <div className="flex flex-col items-center gap-12 animate-fade-in-up">
        {/* Title */}
        <div className="text-center">
          <h1 className="font-serif-jp text-6xl font-bold tracking-[0.3em] text-foreground mb-4">
            魔法陣
          </h1>
          <p className="font-sans-jp text-lg tracking-[0.5em] text-muted-foreground">
            TYPING BATTLE
          </p>
        </div>

        {/* Decorative line */}
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-muted-foreground to-transparent" />

        {/* ゲーム概要 — BLEACH の世界観に沿った導入 */}
        <div className="max-w-md text-center px-6">
          <p className="font-serif-jp text-sm leading-loose tracking-[0.2em] text-muted-foreground/80">
            破道<span className="text-muted-foreground/40 text-xs mx-1">— 攻撃呪文 —</span>と
            縛道<span className="text-muted-foreground/40 text-xs mx-1">— 防御呪文 —</span>を詠唱し
          </p>
          <p className="font-serif-jp text-sm leading-loose tracking-[0.2em] text-muted-foreground/80 mt-1">
            襲い来る<span className="text-foreground/90">虚</span>を討伐せよ
          </p>
          <p className="font-mono-code text-[10px] tracking-[0.3em] text-muted-foreground/40 mt-4 uppercase">
            Type romaji to cast spells
          </p>
        </div>

        {/* Decorative line */}
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-muted-foreground to-transparent" />

        {/* Start */}
        <button
          onClick={onStart}
          className="group relative font-sans-jp text-sm tracking-[0.4em] text-foreground/80 hover:text-foreground transition-colors duration-500 uppercase px-8 py-3 border border-foreground/20 hover:border-foreground/60"
        >
          <span className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-500" />
          <span className="relative">Press Enter to Start</span>
        </button>

        {highScore > 0 && (
          <p className="font-mono-code text-xs text-muted-foreground tracking-widest">
            HIGH SCORE: {highScore.toLocaleString()}
          </p>
        )}
      </div>

      {/* Large empty space below */}
      <div className="flex-1" />

      {/* フッター操作ガイド — 視認性を上げつつ世界観を保持 */}
      <div className="flex flex-col items-center gap-4 mb-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSpellList(true)}
            className="group flex items-center gap-2 font-sans-jp text-xs tracking-[0.25em] text-muted-foreground/70 hover:text-foreground transition-all duration-300 px-4 py-2 border border-foreground/15 hover:border-foreground/40 hover:bg-foreground/5"
          >
            <kbd className="font-mono-code text-[10px] text-muted-foreground/60 group-hover:text-foreground/80 border border-foreground/20 group-hover:border-foreground/50 px-1.5 py-0.5 rounded-sm">H</kbd>
            <span>呪文一覧</span>
          </button>
          <button
            onClick={() => setShowHowToPlay(true)}
            className="font-mono-code text-xs text-muted-foreground/30 tracking-[0.2em] hover:text-muted-foreground transition-colors duration-300"
          >
            ?: 遊び方
          </button>
          <span className="font-mono-code text-xs text-muted-foreground/15">·</span>
          <button
            onClick={onStart}
            className="group flex items-center gap-2 font-sans-jp text-xs tracking-[0.25em] text-muted-foreground/70 hover:text-foreground transition-all duration-300 px-4 py-2 border border-foreground/15 hover:border-foreground/40 hover:bg-foreground/5"
          >
            <kbd className="font-mono-code text-[10px] text-muted-foreground/60 group-hover:text-foreground/80 border border-foreground/20 group-hover:border-foreground/50 px-1.5 py-0.5 rounded-sm">Tab</kbd>
            <span>即スタート</span>
          </button>
        </div>
        <p className="font-mono-code text-[10px] text-muted-foreground/30 tracking-[0.4em]">
          PC KEYBOARD ONLY
        </p>
      </div>
    </div>
  );
};

export default TitleScreen;
