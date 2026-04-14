import React from 'react';
import { TypingState, getDisplayChar, getDisplayRomaji } from '../game/romajiEngine';

interface SpellDisplayProps {
  textJp: string;
  segments: string[];
  currentSegmentIndex: number;
  typingState: TypingState | null;
  completedSegments: number;
  missFlash: boolean;
}

const SpellDisplay: React.FC<SpellDisplayProps> = ({
  textJp, segments, currentSegmentIndex, typingState, completedSegments, missFlash,
}) => {
  const segmentDisplays = segments.map((seg, i) => {
    const isComplete = i < completedSegments;
    const isCurrent = i === currentSegmentIndex;

    // 表示ローマ字文字列（ん → 'n' 1文字で表示）
    let displayStr: string;
    let typedLength = 0;

    if (isCurrent && typingState) {
      displayStr = typingState.chars.map(getDisplayChar).join('');
      // 打ち終わった文字数（表示長基準）
      for (let ci = 0; ci < typingState.currentCharIndex && ci < typingState.chars.length; ci++) {
        typedLength += getDisplayChar(typingState.chars[ci]).length;
      }
      typedLength += typingState.currentInput.length;
    } else {
      displayStr = getDisplayRomaji(seg);
    }

    return { displayStr, isComplete, isCurrent, typedLength };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 日本語テキスト */}
      <p className="font-serif-jp text-2xl tracking-[0.1em] text-foreground">
        「{textJp}」
      </p>

      {/* ローマ字ガイド */}
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
        {segmentDisplays.map((seg, i) => (
          <span key={i} className="font-mono-code text-lg relative">
            {seg.displayStr.split('').map((char, ci) => {
              let colorClass = 'text-muted-foreground/40';
              if (seg.isComplete) {
                colorClass = 'text-primary/60';
              } else if (seg.isCurrent) {
                if (ci < seg.typedLength) {
                  colorClass = 'text-foreground';
                } else if (missFlash) {
                  colorClass = 'text-destructive/70';
                }
              }
              return (
                <span key={ci} className={`${colorClass} transition-colors duration-75`}>
                  {char}
                </span>
              );
            })}
            {i < segments.length - 1 && (
              <span className="text-muted-foreground/20 mx-1">·</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

export default SpellDisplay;
