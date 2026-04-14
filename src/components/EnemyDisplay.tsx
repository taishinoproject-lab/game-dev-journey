import React from 'react';

interface EnemyDisplayProps {
  name: string;
  type: 'normal' | 'boss';
  hpPercent: number;
  isAttacking: boolean;
  isWarning: boolean;
  warningCountdown: number | null; // 残り秒数（null = 警告なし）
}

const EnemyDisplay: React.FC<EnemyDisplayProps> = ({
  name, type, hpPercent, isAttacking, isWarning, warningCountdown,
}) => {
  const size = type === 'boss' ? 'w-32 h-40' : 'w-20 h-24';

  // カウントダウン数値の色（残り秒数で変化）
  const countdownColor = warningCountdown === null
    ? ''
    : warningCountdown > 2
      ? 'text-foreground'
      : warningCountdown > 1
        ? 'text-timer-warning'
        : 'text-destructive';

  return (
    <div className="flex flex-col items-center gap-2">
      {/* 攻撃警告エリア */}
      <div className="h-20 flex flex-col items-center justify-end gap-1">
        {isWarning && warningCountdown !== null ? (
          <>
            <span className="font-sans-jp text-xs text-timer-warning tracking-[0.3em]">
              ⚠ 攻撃が来る！
            </span>
            {/* カウントダウン数字 */}
            <span className={`font-mono-code text-5xl font-bold tabular-nums leading-none ${countdownColor}`}>
              {warningCountdown <= 0 ? '!' : Math.ceil(warningCountdown)}
            </span>
            {/* カウントダウンバー */}
            <div className="w-24 h-0.5 bg-secondary rounded overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-100 ${
                  warningCountdown > 2 ? 'bg-foreground/60' :
                  warningCountdown > 1 ? 'bg-timer-warning' : 'bg-destructive'
                }`}
                style={{ width: `${Math.max(0, (warningCountdown / 3) * 100)}%` }}
              />
            </div>
          </>
        ) : null}
      </div>

      {/* 敵シルエット */}
      <div className={`${size} relative flex items-center justify-center ${isAttacking ? 'animate-screen-shake' : ''}`}>
        <div className={`absolute inset-0 bg-foreground/5 rounded-sm border ${
          isWarning ? 'border-timer-warning/50' : 'border-foreground/10'
        }`} />
        {/* 目 */}
        <div className="relative flex gap-3">
          <div className={`w-2 h-2 rounded-full ${
            isWarning ? 'bg-destructive animate-pulse' : 'bg-primary/80 animate-pulse-glow'
          }`} />
          <div className={`w-2 h-2 rounded-full ${
            isWarning ? 'bg-destructive animate-pulse' : 'bg-primary/80 animate-pulse-glow'
          }`} />
        </div>
      </div>

      {/* 名前 */}
      <span className="font-serif-jp text-xs text-muted-foreground tracking-[0.1em]">{name}</span>
    </div>
  );
};

export default EnemyDisplay;
