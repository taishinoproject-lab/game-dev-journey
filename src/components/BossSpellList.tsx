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

    // 候補の場合、タイプ済み部分と未入力部分を色分け
    const renderRomaji = () => {
      if (!isCandidate) {
        return <span className="font-mono-code text-xs text-muted-foreground/20">{fullRomaji}</span>;
      }
      if (isCasting) {
        return <span className="font-mono-code text-xs text-primary/70">{fullRomaji}</span>;
      }
      // inputBuffer がある場合、先頭一致部分を強調
      if (inputBuffer && fullRomaji.startsWith(inputBuffer)) {
        return (
          <span className="font-mono-code text-xs">
            <span className="text-foreground">{inputBuffer}</span>
            <span className="text-muted-foreground/50">{fullRomaji.slice(inputBuffer.length)}</span>
          </span>
        );
      }
      return <span className="font-mono-code text-xs text-muted-foreground/50">{fullRomaji}</span>;
    };

    return (
      <div
        key={spell.id}
        className={`flex flex-col gap-0.5 px-3 py-2 rounded-sm border transition-all duration-150 ${
          isCasting
            ? 'border-primary/40 bg-primary/5 opacity-100'
            : isCandidate
              ? 'border-foreground/10 opacity-75'
              : 'border-transparent opacity-15'
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
        <div className="truncate max-w-[160px]">
          {renderRomaji()}
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
