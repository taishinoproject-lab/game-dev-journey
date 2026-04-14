import React from 'react';
import { TypingState, getDisplayRomaji } from '../game/romajiEngine';

interface SpellDisplayProps {
  textJp: string;
  segments: string[];
  currentSegmentIndex: number;
  typingState: TypingState | null;
  completedSegments: number;
}

const SpellDisplay: React.FC<SpellDisplayProps> = ({
  textJp, segments, currentSegmentIndex, typingState, completedSegments,
}) => {
  // Build romaji display with highlighting
  const segmentDisplays = segments.map((seg, i) => {
    const romaji = getDisplayRomaji(seg);
    const isComplete = i < completedSegments;
    const isCurrent = i === currentSegmentIndex;

    let typedLength = 0;
    if (isCurrent && typingState) {
      // Calculate how many romaji chars have been typed
      const chars = typingState.chars;
      for (let ci = 0; ci < typingState.currentCharIndex && ci < chars.length; ci++) {
        typedLength += chars[ci].acceptedRomaji[0].length;
      }
      typedLength += typingState.currentInput.length;
    }

    return { romaji, isComplete, isCurrent, typedLength };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Japanese text */}
      <p className="font-serif-jp text-2xl tracking-[0.1em] text-foreground">
        「{textJp}」
      </p>

      {/* Romaji guide */}
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
        {segmentDisplays.map((seg, i) => (
          <span key={i} className="font-mono-code text-lg relative">
            {seg.romaji.split('').map((char, ci) => {
              let colorClass = 'text-muted-foreground/40'; // untyped
              if (seg.isComplete) {
                colorClass = 'text-primary/60'; // completed segment
              } else if (seg.isCurrent) {
                if (ci < seg.typedLength) {
                  colorClass = 'text-foreground'; // typed
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
