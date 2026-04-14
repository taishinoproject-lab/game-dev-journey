import React from 'react';

interface EnemyDisplayProps {
  name: string;
  type: 'normal' | 'boss';
  hpPercent: number;
  isAttacking: boolean;
  isWarning: boolean;
}

const EnemyDisplay: React.FC<EnemyDisplayProps> = ({ name, type, hpPercent, isAttacking, isWarning }) => {
  const size = type === 'boss' ? 'w-32 h-40' : 'w-20 h-24';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Warning indicator */}
      {isWarning && (
        <div className="font-sans-jp text-sm text-timer-warning animate-pulse tracking-[0.3em]">
          ⚠ 攻撃が来る！
        </div>
      )}

      {/* Enemy silhouette */}
      <div className={`${size} relative flex items-center justify-center ${isAttacking ? 'animate-screen-shake' : ''}`}>
        {/* Body */}
        <div className={`absolute inset-0 bg-foreground/5 rounded-sm border border-foreground/10 ${
          isWarning ? 'border-timer-warning/30' : ''
        }`} />

        {/* Eyes */}
        <div className="relative flex gap-3">
          <div className={`w-2 h-2 rounded-full ${
            isWarning ? 'bg-timer-warning' : 'bg-primary/80'
          } ${isWarning ? 'animate-pulse' : 'animate-pulse-glow'}`} />
          <div className={`w-2 h-2 rounded-full ${
            isWarning ? 'bg-timer-warning' : 'bg-primary/80'
          } ${isWarning ? 'animate-pulse' : 'animate-pulse-glow'}`} />
        </div>
      </div>

      {/* Name */}
      <span className="font-serif-jp text-xs text-muted-foreground tracking-[0.1em]">{name}</span>
    </div>
  );
};

export default EnemyDisplay;
