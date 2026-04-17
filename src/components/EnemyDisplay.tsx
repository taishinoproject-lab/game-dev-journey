import React from 'react';

interface EnemyDisplayProps {
  name: string;
  type: 'normal' | 'boss';
  hpPercent: number;
  isAttacking: boolean;
  isWarning: boolean;
  warningCountdown: number | null; // 残り秒数（null = 警告なし）
}

// 通常虚（小型ホロウ）— 角と虚穴を持つシルエット
const HollowNormal: React.FC<{ isWarning: boolean }> = ({ isWarning }) => {
  const eyeColor = isWarning ? 'hsl(var(--destructive))' : 'hsl(var(--primary) / 0.85)';
  const maskColor = 'hsl(0 0% 96%)';
  const bodyColor = 'hsl(0 0% 6%)';
  const outline = isWarning ? 'hsl(var(--destructive) / 0.6)' : 'hsl(var(--foreground) / 0.25)';

  return (
    <svg viewBox="0 0 100 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {/* 体（黒いシルエット・霊圧の揺らぎ） */}
      <path
        d="M50 115 C 25 115, 18 95, 22 75 C 14 70, 16 55, 28 50 C 26 35, 38 28, 50 30 C 62 28, 74 35, 72 50 C 84 55, 86 70, 78 75 C 82 95, 75 115, 50 115 Z"
        fill={bodyColor}
        stroke={outline}
        strokeWidth="0.8"
      />
      {/* マスク（白い仮面） */}
      <path
        d="M32 48 C 32 30, 40 22, 50 22 C 60 22, 68 30, 68 48 C 68 58, 62 64, 50 64 C 38 64, 32 58, 32 48 Z"
        fill={maskColor}
      />
      {/* マスクのヒビ */}
      <path d="M40 30 L 44 38 L 41 46" stroke={bodyColor} strokeWidth="0.7" fill="none" />
      <path d="M58 28 L 62 36" stroke={bodyColor} strokeWidth="0.6" fill="none" />
      {/* 角 */}
      <path d="M36 24 L 30 10 L 40 20 Z" fill={maskColor} />
      <path d="M64 24 L 70 10 L 60 20 Z" fill={maskColor} />
      {/* 牙のスリット（口） */}
      <path d="M42 54 L 45 58 L 48 54 L 51 58 L 54 54 L 57 58" stroke={bodyColor} strokeWidth="1.2" fill="none" strokeLinejoin="miter" />
      {/* 目（光る穴） */}
      <ellipse cx="42" cy="44" rx="2.5" ry="3.5" fill={eyeColor}>
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="58" cy="44" rx="2.5" ry="3.5" fill={eyeColor}>
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
      </ellipse>
      {/* 虚穴（胸の穴） */}
      <circle cx="50" cy="82" r="5" fill="hsl(0 0% 0%)" stroke={outline} strokeWidth="0.6" />
    </svg>
  );
};

// ボス虚（破面風）— より人型・装飾的なマスク
const HollowBoss: React.FC<{ isWarning: boolean }> = ({ isWarning }) => {
  const eyeColor = isWarning ? 'hsl(var(--destructive))' : 'hsl(var(--primary))';
  const maskColor = 'hsl(0 0% 96%)';
  const bodyColor = 'hsl(0 0% 5%)';
  const outline = isWarning ? 'hsl(var(--destructive) / 0.7)' : 'hsl(var(--foreground) / 0.3)';
  const auraColor = isWarning ? 'hsl(var(--destructive) / 0.4)' : 'hsl(var(--primary) / 0.3)';

  return (
    <svg viewBox="0 0 120 160" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {/* オーラ（霊圧） */}
      <ellipse cx="60" cy="80" rx="55" ry="75" fill={auraColor} opacity="0.25">
        <animate attributeName="opacity" values="0.15;0.35;0.15" dur="3s" repeatCount="indefinite" />
      </ellipse>

      {/* マント／体の輪郭 */}
      <path
        d="M60 155 L 18 150 L 22 110 L 12 80 L 20 50 L 35 35 L 50 28 L 70 28 L 85 35 L 100 50 L 108 80 L 98 110 L 102 150 Z"
        fill={bodyColor}
        stroke={outline}
        strokeWidth="1"
      />

      {/* 肩のトゲ */}
      <path d="M25 45 L 18 28 L 32 40 Z" fill={bodyColor} stroke={outline} strokeWidth="0.6" />
      <path d="M95 45 L 102 28 L 88 40 Z" fill={bodyColor} stroke={outline} strokeWidth="0.6" />

      {/* 虚穴（胸） */}
      <circle cx="60" cy="95" r="9" fill="hsl(0 0% 0%)" stroke={outline} strokeWidth="0.8" />
      <circle cx="60" cy="95" r="6" fill="hsl(0 0% 0%)" stroke={outline} strokeWidth="0.4" opacity="0.5" />

      {/* マスク（仮面）— 細長く威圧的 */}
      <path
        d="M38 50 C 38 25, 48 15, 60 15 C 72 15, 82 25, 82 50 C 82 65, 74 75, 60 75 C 46 75, 38 65, 38 50 Z"
        fill={maskColor}
        stroke="hsl(0 0% 80%)"
        strokeWidth="0.4"
      />

      {/* 角（左右に大きく） */}
      <path d="M42 22 L 28 2 L 38 8 L 46 18 Z" fill={maskColor} stroke="hsl(0 0% 80%)" strokeWidth="0.4" />
      <path d="M78 22 L 92 2 L 82 8 L 74 18 Z" fill={maskColor} stroke="hsl(0 0% 80%)" strokeWidth="0.4" />

      {/* マスクの紋様（縦のヒビ） */}
      <path d="M60 18 L 60 75" stroke={bodyColor} strokeWidth="0.8" />
      <path d="M48 28 L 52 40 L 50 52" stroke={bodyColor} strokeWidth="0.6" fill="none" />
      <path d="M72 28 L 68 40 L 70 52" stroke={bodyColor} strokeWidth="0.6" fill="none" />

      {/* 目（虚ろな穴 + 光） */}
      <path d="M44 42 L 54 40 L 52 50 L 44 48 Z" fill="hsl(0 0% 0%)" />
      <path d="M76 42 L 66 40 L 68 50 L 76 48 Z" fill="hsl(0 0% 0%)" />
      <ellipse cx="49" cy="45" rx="2" ry="3" fill={eyeColor}>
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="71" cy="45" rx="2" ry="3" fill={eyeColor}>
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
      </ellipse>

      {/* 牙（口元） */}
      <path
        d="M46 60 L 49 68 L 52 60 L 55 68 L 58 60 L 60 68 L 62 60 L 65 68 L 68 60 L 71 68 L 74 60"
        stroke={bodyColor}
        strokeWidth="1.2"
        fill="none"
        strokeLinejoin="miter"
      />
    </svg>
  );
};

const EnemyDisplay: React.FC<EnemyDisplayProps> = ({
  name, type, hpPercent, isAttacking, isWarning, warningCountdown,
}) => {
  const size = type === 'boss' ? 'w-40 h-52' : 'w-24 h-28';

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
      <div className={`${size} relative ${isAttacking ? 'animate-screen-shake' : ''}`}>
        {type === 'boss' ? (
          <HollowBoss isWarning={isWarning} />
        ) : (
          <HollowNormal isWarning={isWarning} />
        )}
      </div>

      {/* 名前 */}
      <span className="font-serif-jp text-xs text-muted-foreground tracking-[0.1em]">{name}</span>
    </div>
  );
};

export default EnemyDisplay;
