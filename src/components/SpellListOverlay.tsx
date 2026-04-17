import React, { useEffect } from 'react';
import { attackSpells, defenseSpells } from '../game/spells';
import { getDisplayRomaji } from '../game/romajiEngine';

interface SpellListOverlayProps {
  onClose: () => void;
}

const rankLabel: Record<string, string> = {
  low: '低級',
  mid: '中級',
  high: '高級',
};

const SpellListOverlay: React.FC<SpellListOverlayProps> = ({ onClose }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H' || e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      // Tab / Enter は TitleScreen 側のハンドラが処理するのでここでは何もしない
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-background/97 overflow-y-auto animate-fade-in-up">
      <div className="flex flex-col items-center py-16 px-8 min-h-full">

        {/* ヘッダー */}
        <div className="w-full max-w-xl mb-10 text-center">
          <h2 className="font-serif-jp text-2xl tracking-[0.5em] text-foreground mb-6">
            呪文一覧
          </h2>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent" />
        </div>

        {/* 破道 */}
        <div className="w-full max-w-xl mb-10">
          <p className="font-mono-code text-xs tracking-[0.4em] text-muted-foreground/50 mb-4 uppercase">
            破道 — 攻撃呪文
          </p>
          <div className="flex flex-col gap-3">
            {attackSpells.map(spell => {
              const romajiSegments = spell.segments.map(s => getDisplayRomaji(s));
              return (
                <div
                  key={spell.id}
                  className="border border-foreground/8 px-5 py-4 rounded-sm"
                >
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-serif-jp text-lg text-foreground">{spell.name}</span>
                    <span className="font-sans-jp text-xs text-muted-foreground/60">
                      （{spell.nameReading}）
                    </span>
                    <span className="font-mono-code text-xs text-muted-foreground/35 ml-auto">
                      {rankLabel[spell.rank]}
                    </span>
                  </div>
                  <p className="font-serif-jp text-sm text-muted-foreground/60 mb-2 tracking-widest">
                    「{spell.textJp}」
                  </p>
                  <p className="font-mono-code text-sm text-magic-circle/80 tracking-wider break-all">
                    {romajiSegments.join(' · ')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 縛道 */}
        <div className="w-full max-w-xl mb-14">
          <p className="font-mono-code text-xs tracking-[0.4em] text-muted-foreground/50 mb-4 uppercase">
            縛道 — 防御呪文
          </p>
          <div className="flex flex-col gap-3">
            {defenseSpells.map(spell => {
              const romajiSegments = spell.segments.map(s => getDisplayRomaji(s));
              const effect = spell.id === 'bakudo_081'
                ? '完全防御 + 次の攻撃バフ'
                : '完全防御';
              return (
                <div
                  key={spell.id}
                  className="border border-foreground/8 px-5 py-4 rounded-sm"
                >
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-serif-jp text-lg text-muted-foreground">{spell.name}</span>
                    <span className="font-sans-jp text-xs text-muted-foreground/60">
                      （{spell.nameReading}）
                    </span>
                    <span className="font-mono-code text-xs text-muted-foreground/35 ml-auto">
                      {effect}
                    </span>
                  </div>
                  <p className="font-serif-jp text-sm text-muted-foreground/60 mb-2 tracking-widest">
                    「{spell.textJp}」
                  </p>
                  <p className="font-mono-code text-sm text-magic-circle/60 tracking-wider break-all">
                    {romajiSegments.join(' · ')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* フッター */}
        <p className="font-mono-code text-xs text-muted-foreground/25 tracking-[0.3em] text-center">
          H · Esc: 閉じる &nbsp;·&nbsp; Tab · Enter: スタート
        </p>

      </div>
    </div>
  );
};

export default SpellListOverlay;
