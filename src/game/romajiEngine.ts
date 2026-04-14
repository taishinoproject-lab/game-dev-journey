// Romaji state machine for hiragana input

// Map of hiragana to all accepted romaji patterns
const ROMAJI_MAP: Record<string, string[]> = {
  'あ': ['a'], 'い': ['i'], 'う': ['u'], 'え': ['e'], 'お': ['o'],
  'か': ['ka'], 'き': ['ki'], 'く': ['ku'], 'け': ['ke'], 'こ': ['ko'],
  'さ': ['sa'], 'し': ['si', 'shi'], 'す': ['su'], 'せ': ['se'], 'そ': ['so'],
  'た': ['ta'], 'ち': ['ti', 'chi'], 'つ': ['tu', 'tsu'], 'て': ['te'], 'と': ['to'],
  'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
  'は': ['ha'], 'ひ': ['hi'], 'ふ': ['hu', 'fu'], 'へ': ['he'], 'ほ': ['ho'],
  'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
  'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
  'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
  'わ': ['wa'], 'を': ['wo'], 'ん': ['nn', 'n'],
  'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
  'ざ': ['za'], 'じ': ['zi', 'ji'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
  'だ': ['da'], 'ぢ': ['di'], 'づ': ['du', 'zu'], 'で': ['de'], 'ど': ['do'],
  'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
  'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
  // Combo chars
  'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'],
  'しゃ': ['sya', 'sha'], 'しゅ': ['syu', 'shu'], 'しょ': ['syo', 'sho'],
  'ちゃ': ['tya', 'cha'], 'ちゅ': ['tyu', 'chu'], 'ちょ': ['tyo', 'cho'],
  'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
  'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
  'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
  'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo'],
  'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
  'じゃ': ['zya', 'ja', 'jya'], 'じゅ': ['zyu', 'ju', 'jyu'], 'じょ': ['zyo', 'jo', 'jyo'],
  'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
  'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],
  'ー': ['-'],
};

// Check if char is a small ya/yu/yo
function isSmallKana(c: string): boolean {
  return 'ゃゅょ'.includes(c);
}

// Check if 'n' can be accepted as single for ん
function canSingleN(nextChar: string | undefined): boolean {
  if (!nextChar) return false; // end of text needs nn
  const vowels = 'あいうえおやゆよなにぬねの';
  // If next char starts a combo that begins with a/i/u/e/o/y/n, need nn
  if (vowels.includes(nextChar)) return false;
  return true;
}

export interface RomajiChar {
  hiragana: string;
  acceptedRomaji: string[];
}

// Parse hiragana text into romaji char units
export function parseHiragana(text: string): RomajiChar[] {
  const result: RomajiChar[] = [];
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    const nextChar = i + 1 < text.length ? text[i + 1] : undefined;

    // っ (sokuon/geminate)
    if (char === 'っ') {
      // Look ahead for the next consonant
      const nextUnit = peekNextUnit(text, i + 1);
      if (nextUnit) {
        const firstConsonants = nextUnit.acceptedRomaji.map(r => r[0]);
        const uniqueConsonants = [...new Set(firstConsonants)];
        const patterns = uniqueConsonants.map(c => c + c.toLowerCase());
        // also allow xtu, ltu
        patterns.push('xtu', 'ltu', 'xtsu', 'ltsu');
        result.push({ hiragana: 'っ', acceptedRomaji: [...new Set(patterns)] });
      } else {
        result.push({ hiragana: 'っ', acceptedRomaji: ['xtu', 'ltu'] });
      }
      i++;
      continue;
    }

    // Combo kana (き + ゃ etc.)
    if (nextChar && isSmallKana(nextChar)) {
      const combo = char + nextChar;
      if (ROMAJI_MAP[combo]) {
        result.push({ hiragana: combo, acceptedRomaji: ROMAJI_MAP[combo] });
        i += 2;
        continue;
      }
    }

    // ん special handling
    if (char === 'ん') {
      const following = i + 1 < text.length ? text[i + 1] : undefined;
      if (canSingleN(following)) {
        result.push({ hiragana: 'ん', acceptedRomaji: ['nn', 'n'] });
      } else {
        result.push({ hiragana: 'ん', acceptedRomaji: ['nn'] });
      }
      i++;
      continue;
    }

    // Normal char
    if (ROMAJI_MAP[char]) {
      result.push({ hiragana: char, acceptedRomaji: ROMAJI_MAP[char] });
    } else {
      // Unknown char (kanji, punctuation) - skip or treat as-is
      // For this game, segments should be in hiragana
      result.push({ hiragana: char, acceptedRomaji: [char] });
    }
    i++;
  }
  return result;
}

function peekNextUnit(text: string, startIndex: number): RomajiChar | null {
  if (startIndex >= text.length) return null;
  const char = text[startIndex];
  const nextChar = startIndex + 1 < text.length ? text[startIndex + 1] : undefined;
  if (nextChar && isSmallKana(nextChar)) {
    const combo = char + nextChar;
    if (ROMAJI_MAP[combo]) {
      return { hiragana: combo, acceptedRomaji: ROMAJI_MAP[combo] };
    }
  }
  if (ROMAJI_MAP[char]) {
    return { hiragana: char, acceptedRomaji: ROMAJI_MAP[char] };
  }
  return null;
}

export interface TypingState {
  chars: RomajiChar[];
  currentCharIndex: number;
  currentInput: string; // partial romaji for current char
  // For each char, which romaji patterns are still viable
  viablePatterns: string[];
}

export function createTypingState(hiragana: string): TypingState {
  const chars = parseHiragana(hiragana);
  return {
    chars,
    currentCharIndex: 0,
    currentInput: '',
    viablePatterns: chars.length > 0 ? [...chars[0].acceptedRomaji] : [],
  };
}

export type InputResult = 'correct' | 'complete' | 'miss';

export function processInput(state: TypingState, key: string): { result: InputResult; state: TypingState } {
  if (state.currentCharIndex >= state.chars.length) {
    return { result: 'complete', state };
  }

  const newInput = state.currentInput + key;

  // Check which patterns still match
  const stillViable = state.viablePatterns.filter(p => p.startsWith(newInput));

  if (stillViable.length === 0) {
    // Special case for ん with single 'n': if current input is 'n' and key is a consonant
    // that starts the next character, we should advance ん and process the key for next char
    if (state.chars[state.currentCharIndex].hiragana === 'ん' && state.currentInput === 'n') {
      // Check if the key could start the next character
      const nextCharIndex = state.currentCharIndex + 1;
      if (nextCharIndex < state.chars.length) {
        const nextPatterns = state.chars[nextCharIndex].acceptedRomaji;
        const matchesNext = nextPatterns.some(p => p.startsWith(key));
        if (matchesNext) {
          // Accept 'n' for ん and process key for next char
          const advancedState: TypingState = {
            ...state,
            currentCharIndex: nextCharIndex,
            currentInput: '',
            viablePatterns: [...state.chars[nextCharIndex].acceptedRomaji],
          };
          return processInput(advancedState, key);
        }
      }
    }
    return { result: 'miss', state };
  }

  // Check if any pattern is exactly matched
  const exactMatch = stillViable.find(p => p === newInput);
  if (exactMatch) {
    const nextIndex = state.currentCharIndex + 1;
    if (nextIndex >= state.chars.length) {
      return {
        result: 'complete',
        state: { ...state, currentCharIndex: nextIndex, currentInput: '', viablePatterns: [] },
      };
    }
    return {
      result: 'correct',
      state: {
        ...state,
        currentCharIndex: nextIndex,
        currentInput: '',
        viablePatterns: [...state.chars[nextIndex].acceptedRomaji],
      },
    };
  }

  // Partial match - continue
  return {
    result: 'correct',
    state: { ...state, currentInput: newInput, viablePatterns: stillViable },
  };
}

// Get the display romaji for a segment (using first accepted pattern)
export function getDisplayRomaji(hiragana: string): string {
  const chars = parseHiragana(hiragana);
  return chars.map(c => c.acceptedRomaji[0]).join('');
}

// Get total romaji length for timing calculations
export function getRomajiLength(hiragana: string): number {
  return getDisplayRomaji(hiragana).length;
}
