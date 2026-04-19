import React, { useEffect } from 'react';

interface HowToPlayOverlayProps {
  onClose: () => void;
}

const HowToPlayOverlay: React.FC<HowToPlayOverlayProps> = ({ onClose }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' || e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
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
            遊び方
          </h2>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent" />
        </div>

        {/* 基本操作 */}
        <div className="w-full max-w-xl mb-10">
          <p className="font-mono-code text-xs tracking-[0.4em] text-muted-foreground/50 mb-4 uppercase">
            基本操作
          </p>
          <div className="flex flex-col gap-3">
            {[
              ['呪文のローマ字を入力する', '例: 衝 → s · h · o · u'],
              ['ミスタイプしても入力は巻き戻らない', '打てた文字はそのまま残る'],
              ['制限時間内に入力完了', '敵にダメージ。時間切れは自分がダメージ'],
            ].map(([title, sub]) => (
              <div key={title} className="border border-foreground/8 px-5 py-3 rounded-sm">
                <p className="font-sans-jp text-sm text-foreground/80 mb-1">{title}</p>
                <p className="font-mono-code text-xs text-muted-foreground/50">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* スコア倍率 */}
        <div className="w-full max-w-xl mb-10">
          <p className="font-mono-code text-xs tracking-[0.4em] text-muted-foreground/50 mb-4 uppercase">
            スコア倍率
          </p>
          <div className="border border-foreground/8 px-5 py-4 rounded-sm">
            <div className="flex flex-col gap-3">
              <div>
                <p className="font-sans-jp text-sm text-foreground/80 mb-1">コンボ倍率</p>
                <p className="font-mono-code text-xs text-magic-circle/70 tracking-wider">
                  0〜4 ×1.0 &nbsp;·&nbsp; 5〜9 ×1.5 &nbsp;·&nbsp; 10〜14 ×2.0
                  &nbsp;·&nbsp; 15〜19 ×2.5 &nbsp;·&nbsp; 20+ ×3.0
                </p>
              </div>
              <div className="w-full h-px bg-foreground/5" />
              <div>
                <p className="font-sans-jp text-sm text-foreground/80 mb-1">速度ボーナス</p>
                <p className="font-mono-code text-xs text-magic-circle/70 tracking-wider">
                  残り時間 80%超 ×1.5 &nbsp;·&nbsp; 50%超 ×1.2 &nbsp;·&nbsp; それ以下 ×1.0
                </p>
              </div>
              <div className="w-full h-px bg-foreground/5" />
              <div>
                <p className="font-sans-jp text-sm text-foreground/80 mb-1">ノーミスボーナス</p>
                <p className="font-mono-code text-xs text-magic-circle/70 tracking-wider">
                  その呪文でミスなし → ×1.5 &nbsp;·&nbsp; 1ミスでも失効
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ボス戦 */}
        <div className="w-full max-w-xl mb-14">
          <p className="font-mono-code text-xs tracking-[0.4em] text-muted-foreground/50 mb-4 uppercase">
            ボス戦
          </p>
          <div className="flex flex-col gap-3">
            {[
              ['呪文の自動絞り込み', 'タイプするたびに候補が減り、1つになると詠唱モードへ移行'],
              ['Ctrl+C で詠唱中断', '呪文を間違えたら中断して打ち直せる'],
              ['攻撃予告が出たら防御呪文', '点滅したら縛道（防御呪文）を詠唱して攻撃を弾け'],
              ['断空は完全防御 + 次の攻撃バフ', '斥より強力。ボス戦は断空優先がおすすめ'],
            ].map(([title, sub]) => (
              <div key={title} className="border border-foreground/8 px-5 py-3 rounded-sm">
                <p className="font-sans-jp text-sm text-muted-foreground/80 mb-1">{title}</p>
                <p className="font-mono-code text-xs text-muted-foreground/50">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* フッター */}
        <p className="font-mono-code text-xs text-muted-foreground/25 tracking-[0.3em] text-center">
          ? · Esc: 閉じる &nbsp;·&nbsp; Tab · Enter: スタート
        </p>

      </div>
    </div>
  );
};

export default HowToPlayOverlay;
