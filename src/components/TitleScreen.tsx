import React from 'react';

interface TitleScreenProps {
  onStart: () => void;
  highScore: number;
}

const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, highScore }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background select-none">
      {/* Large empty space above - BLEACH aesthetic */}
      <div className="flex-1" />

      <div className="flex flex-col items-center gap-16 animate-fade-in-up">
        {/* Title */}
        <div className="text-center">
          <h1 className="font-serif-jp text-6xl font-bold tracking-[0.3em] text-foreground mb-4">
            魔法陣
          </h1>
          <p className="font-sans-jp text-lg tracking-[0.5em] text-muted-foreground">
            TYPING BATTLE
          </p>
        </div>

        {/* Decorative line */}
        <div className="w-px h-20 bg-gradient-to-b from-transparent via-muted-foreground to-transparent" />

        {/* Start */}
        <button
          onClick={onStart}
          className="font-sans-jp text-sm tracking-[0.4em] text-muted-foreground hover:text-foreground transition-colors duration-500 uppercase"
        >
          Press Enter to Start
        </button>

        {highScore > 0 && (
          <p className="font-mono-code text-xs text-muted-foreground">
            HIGH SCORE: {highScore.toLocaleString()}
          </p>
        )}
      </div>

      {/* Large empty space below */}
      <div className="flex-1" />

      <p className="font-mono-code text-xs text-muted-foreground/30 mb-8">
        PC KEYBOARD ONLY
      </p>
    </div>
  );
};

export default TitleScreen;
