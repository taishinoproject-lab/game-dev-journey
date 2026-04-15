import React from 'react';
import { Spell } from '../game/types';
import { attackSpells, defenseSpells } from '../game/spells';
import { getDisplayRomaji } from '../game/romajiEngine';

interface BossSpellListProps {
  candidates: Spell[];       // 現在マッチしている呪文
  currentSpell: Spell | null; // 詠唱中の呪文
  inputBuffer: string;        // 候補絞り込み中のタイプ文字列
}

const BossSpellList: React.FC<BossSpellListProps> = ({ candidates, currentSpell, inputBuffer }) => {
  const candidateIds = new Set(candidates.map(s => s.id));

  const renderSpell = (spell: Spell) => {
    const isCasting = currentSpell?.id === spell.id;
    const isCandidate = candidateIds.has(spell.id);
    const fullRomaji = getDisplayRomaji(spell.segments.join(''));
    const isDefense = spell.type === 'defense';

    // 先頭3文字は常に大きく表示、残りは小さく
    const headRomaji = fullRomaji.slice(0, 3);
    const tailRomaji = fullRomaji.slice(3);

    // 候補行のtail部分：inputBuffer と合わせて打ち込み済み/未入力を色分け
    const renderTail = () => {
      if (!isCandidate && !isCasting) {
        return <span className="font-mono-code text-xs text-muted-foreground/15">{tailRomaji}</span>;
      }
      if (isCasting) {
        return <span className="font-mono-code text-xs text-primary/60">{tailRomaji}</span>;
      }
      // inputBuffer の先頭3文字を超えた部分がtailの入力済み分
      if (inputBuffer.length > 3 && fullRomaji.startsWith(inputBuffer)) {
        const typed = inputBuffer.slice(3);
        return (
          <span className="font-mono-code text-xs">
            <span className="text-foreground">{typed}</span>
            <span className="text-muted-foreground/40">{tailRomaji.slice(typed.length)}</span>
          </span>
        );
      }
      return <span className="font-mono-code text-xs text-muted-foreground/40">{tailRomaji}</span>;
    };

    const headColor = isCasting
      ? 'text-primary'
      : isCandidate
        ? 'text-foreground'
        : 'text-muted-foreground/25';

    return (
      <div
        key={spell.id}
        className={`flex flex-col gap-0.5 px-3 py-2 rounded-sm border transition-all duration-150 ${
          isCasting
            ? 'border-primary/40 bg-primary/5 opacity-100'
            : isCandidate
              ? 'border-foreground/10 opacity-90'
              : 'border-transparent opacity-30'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className={`font-serif-jp text-sm ${isDefense ? 'text-muted-foreground' : 'text-foreground'}`}>
            {spell.name}
          </span>
          {isCasting && (
            <span className="font-mono-code text-xs text-primary/60 animate-pulse">詠唱中</span>
          )}
          {isDefense && isCandidate && !isCasting && (
            <span className="font-mono-code text-xs text-muted-foreground/40">防</span>
          )}
        </div>
        {/* 先頭3文字を大きく、残りを小さく横並びで表示 */}
        <div className="flex items-baseline gap-0 max-w-[160px]">
          <span className={`font-mono-code text-base font-bold leading-none ${headColor}`}>
            {headRomaji}
          </span>
          <span className="truncate">
            {renderTail()}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1.5 p-3 w-full">
      <p className="font-mono-code text-xs text-muted-foreground/40 tracking-[0.2em] mb-1">破道</p>
      {attackSpells.map(renderSpell)}
      <p className="font-mono-code text-xs text-muted-foreground/40 tracking-[0.2em] mt-3 mb-1">縛道</p>
      {defenseSpells.map(renderSpell)}

      {/* Ctrl+C ヒント */}
      {currentSpell && (
        <p className="font-mono-code text-xs text-muted-foreground/25 mt-4 tracking-wider">
          Ctrl+C で中断
        </p>
      )}
    </div>
  );
};

export default BossSpellList;
