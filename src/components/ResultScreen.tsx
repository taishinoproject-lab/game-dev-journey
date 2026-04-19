import React from 'react';
import { HighScore, getComboMultiplier } from '../game/types';

interface ResultScreenProps {
  score: number;
  wave: number;
  maxCombo: number;
  enemiesDefeated: number;
  noMissCount: number;
  totalTyped: number;
  correctTyped: number;
  isNewHighScore: boolean;
  onRetry: () => void;
  onTitle: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({
  score, wave, maxCombo, enemiesDefeated, noMissCount, totalTyped, correctTyped,
  isNewHighScore, onRetry, onTitle,
}) => {
  const accuracy = totalTyped > 0 ? Math.floor((correctTyped / totalTyped) * 100) : 0;
  const comboMultiplier = getComboMultiplier(maxCombo);

  const stats = [
    { label: 'SCORE', value: score.toLocaleString(), highlight: true },
    { label: 'WAVE', value: wave.toString() },
    { label: 'MAX COMBO', value: `${maxCombo}  →  ×${comboMultiplier.toFixed(1)}` },
    { label: 'ENEMIES', value: enemiesDefeated.toString() },
    { label: 'NO MISS SPELLS', value: `${noMissCount}  →  ×1.5 each` },
    { label: 'TOTAL TYPED', value: totalTyped.toString() },
    { label: 'ACCURACY', value: `${accuracy}%` },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background select-none">
      <div className="flex-1" />

      <div className="flex flex-col items-center gap-12 animate-fade-in-up">
        {isNewHighScore && (
          <p className="font-sans-jp text-sm tracking-[0.5em] text-primary animate-pulse-glow">
            NEW HIGH SCORE
          </p>
        )}

        <h2 className="font-serif-jp text-4xl tracking-[0.3em] text-foreground">
          終焉
        </h2>

        <div className="w-px h-12 bg-gradient-to-b from-transparent via-muted-foreground to-transparent" />

        <div className="flex flex-col gap-4 min-w-[280px]">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`flex justify-between items-baseline gap-8 ${
                stat.highlight ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <span className="font-mono-code text-xs tracking-[0.2em]">{stat.label}</span>
              <span className={`font-mono-code ${stat.highlight ? 'text-2xl text-foreground' : 'text-lg'}`}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        <div className="w-px h-8 bg-gradient-to-b from-transparent via-muted-foreground to-transparent" />

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onRetry}
            className="font-sans-jp text-sm tracking-[0.4em] text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            RETRY
          </button>
          <button
            onClick={onTitle}
            className="font-sans-jp text-xs tracking-[0.3em] text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-300"
          >
            TITLE
          </button>
        </div>
      </div>

      <div className="flex-1" />
    </div>
  );
};

export default ResultScreen;
