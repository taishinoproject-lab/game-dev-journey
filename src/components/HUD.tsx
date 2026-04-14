import React from 'react';
import { getComboStage } from '../game/types';

interface HUDProps {
  score: number;
  wave: number;
  combo: number;
  playerHp: number;
  playerMaxHp: number;
  isBoss: boolean;
  bossName?: string;
  bossHp?: number;
  bossMaxHp?: number;
  timeRemaining: number;
  timeLimit: number;
}

const HUD: React.FC<HUDProps> = ({
  score, wave, combo, playerHp, playerMaxHp,
  isBoss, bossName, bossHp, bossMaxHp, timeRemaining, timeLimit,
}) => {
  const hpPercent = (playerHp / playerMaxHp) * 100;
  const timePercent = (timeRemaining / timeLimit) * 100;
  const isTimeLow = timePercent < 30;
  const isTimeCritical = timePercent < 10;
  const comboStage = getComboStage(combo);

  return (
    <div className="absolute inset-x-0 top-0 p-6 pointer-events-none">
      {/* Top row */}
      <div className="flex justify-between items-start mb-4">
        <div className="font-mono-code text-xs text-muted-foreground tracking-[0.2em]">
          SCORE <span className="text-foreground text-sm ml-2">{score.toLocaleString()}</span>
        </div>
        <div className="font-sans-jp text-xs text-muted-foreground tracking-[0.3em]">
          {isBoss ? `WAVE ${wave} BOSS` : `WAVE ${wave}`}
        </div>
        <div className="text-right">
          <span className="font-mono-code text-xs text-muted-foreground tracking-[0.2em]">COMBO </span>
          <span className={`font-mono-code text-foreground ${
            comboStage >= 4 ? 'text-2xl animate-pulse-glow' :
            comboStage >= 2 ? 'text-xl' : 'text-sm'
          }`}>
            {combo}
          </span>
        </div>
      </div>

      {/* Player HP */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-1.5 bg-secondary rounded-sm overflow-hidden">
          <div
            className="h-full bg-foreground transition-all duration-300"
            style={{ width: `${hpPercent}%`, opacity: hpPercent < 30 ? undefined : undefined }}
          />
        </div>
        <span className="font-mono-code text-xs text-muted-foreground">
          {playerHp}/{playerMaxHp}
        </span>
      </div>

      {/* Boss HP */}
      {isBoss && bossMaxHp && bossHp !== undefined && (
        <div className="flex flex-col items-center mt-8">
          <span className="font-serif-jp text-sm text-muted-foreground tracking-[0.2em] mb-2">
            {bossName}
          </span>
          <div className="w-64 h-1 bg-secondary rounded-sm overflow-hidden">
            <div
              className="h-full bg-hp-bar transition-all duration-300"
              style={{ width: `${(bossHp / bossMaxHp) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Timer - bottom */}
      <div className="absolute inset-x-0 bottom-0 p-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1 bg-secondary rounded-sm overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                isTimeCritical ? 'bg-destructive animate-pulse' :
                isTimeLow ? 'bg-timer-warning' : 'bg-timer-normal'
              }`}
              style={{ width: `${timePercent}%` }}
            />
          </div>
          <span className={`font-mono-code text-xs ${
            isTimeLow ? 'text-timer-warning' : 'text-muted-foreground'
          }`}>
            {timeRemaining.toFixed(1)}s
          </span>
        </div>
      </div>
    </div>
  );
};

export default HUD;
