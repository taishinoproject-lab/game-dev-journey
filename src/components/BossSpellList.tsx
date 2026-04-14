import React from 'react';
import { Spell } from '../game/types';
import { attackSpells, defenseSpells } from '../game/spells';

interface BossSpellListProps {
  selectedIndex: number;
  onSelect: (spell: Spell) => void;
}

const BossSpellList: React.FC<BossSpellListProps> = ({ selectedIndex, onSelect }) => {
  return (
    <div className="flex flex-col gap-2 p-4">
      <p className="font-mono-code text-xs text-muted-foreground/50 tracking-[0.2em] mb-2">破道</p>
      {attackSpells.map((spell, i) => (
        <button
          key={spell.id}
          onClick={() => onSelect(spell)}
          className={`flex items-center gap-3 px-3 py-2 text-left transition-colors duration-200 border rounded-sm ${
            selectedIndex === i
              ? 'border-primary/50 text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground/70'
          }`}
        >
          <span className="font-mono-code text-xs text-muted-foreground/40 w-4">[{i + 1}]</span>
          <span className="font-serif-jp text-sm">{spell.name}</span>
          <span className="font-mono-code text-xs text-muted-foreground/40 ml-auto">{spell.baseDamage}</span>
        </button>
      ))}

      <p className="font-mono-code text-xs text-muted-foreground/50 tracking-[0.2em] mt-4 mb-2">縛道</p>
      {defenseSpells.map((spell, i) => (
        <button
          key={spell.id}
          onClick={() => onSelect(spell)}
          className={`flex items-center gap-3 px-3 py-2 text-left transition-colors duration-200 border rounded-sm ${
            selectedIndex === attackSpells.length + i
              ? 'border-primary/50 text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground/70'
          }`}
        >
          <span className="font-mono-code text-xs text-muted-foreground/40 w-4">[{['Q', 'W'][i]}]</span>
          <span className="font-serif-jp text-sm">{spell.name}</span>
        </button>
      ))}
    </div>
  );
};

export default BossSpellList;
