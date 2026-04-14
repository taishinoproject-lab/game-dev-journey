// Romaji state machine for hiragana input

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
  'わ': ['wa'], 'を': ['wo'], 'ん': ['nn'],
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

function isSmallKana(c: string): boolean {
  return 'ゃゅょ'.includes(c);
}

export interface RomajiChar {
  hiragana: string;
  acceptedRomaji: string[];
}

// ん の表示用ローマ字は常に 'n' 1文字
export function getDisplayChar(c: RomajiChar): string {
  return c.hiragana === 'ん' ? 'n' : c.acceptedRomaji[0];
}

export function parseHiragana(text: string): RomajiChar[] {
  const result: RomajiChar[] = [];
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    const nextChar = i + 1 < text.length ? text[i + 1] : undefined;

    // っ (sokuon)
    if (char === 'っ') {
      const nextUnit = peekNextUnit(text, i + 1);
      if (nextUnit) {
        const firstConsonants = nextUnit.acceptedRomaji.map(r => r[0]);
        const uniqueConsonants = [...new Set(firstConsonants)];
        const patterns = uniqueConsonants.map(c => c + c.toLowerCase());
        patterns.push('xtu', 'ltu', 'xtsu', 'ltsu');
        result.push({ hiragana: 'っ', acceptedRomaji: [...new Set(patterns)] });
      } else {
        result.push({ hiragana: 'っ', acceptedRomaji: ['xtu', 'ltu'] });
      }
      i++;
      continue;
    }

    // Combo kana
    if (nextChar && isSmallKana(nextChar)) {
      const combo = char + nextChar;
      if (ROMAJI_MAP[combo]) {
        result.push({ hiragana: combo, acceptedRomaji: ROMAJI_MAP[combo] });
        i += 2;
        continue;
      }
    }

    // ん — 常に ['nn'] で管理。表示は 'n'、n1打+子音でも確定
    if (char === 'ん') {
      result.push({ hiragana: 'ん', acceptedRomaji: ['nn'] });
      i++;
      continue;
    }

    if (ROMAJI_MAP[char]) {
      result.push({ hiragana: char, acceptedRomaji: ROMAJI_MAP[char] });
    } else {
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
  currentInput: string;
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

// 'absorb' = ん の後の余分な n を無音で無視
export type InputResult = 'correct' | 'complete' | 'miss' | 'absorb';

export function processInput(state: TypingState, key: string): { result: InputResult; state: TypingState } {
  if (state.currentCharIndex >= state.chars.length) {
    return { result: 'complete', state };
  }

  const newInput = state.currentInput + key;
  const stillViable = state.viablePatterns.filter(p => p.startsWith(newInput));

  if (stillViable.length === 0) {
    // ん の n1打+子音確定: currentInput が 'n'（部分一致中）のとき次の文字の子音が来たら確定
    if (state.chars[state.currentCharIndex].hiragana === 'ん' && state.currentInput === 'n') {
      const nextCharIndex = state.currentCharIndex + 1;
      if (nextCharIndex < state.chars.length) {
        const nextPatterns = state.chars[nextCharIndex].acceptedRomaji;
        const matchesNext = nextPatterns.some(p => p.startsWith(key));
        if (matchesNext) {
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

    // ん が single-n で確定した直後に余分な 'n' が来ても miss にしない
    if (
      key === 'n' &&
      state.currentInput === '' &&
      state.currentCharIndex > 0 &&
      state.chars[state.currentCharIndex - 1].hiragana === 'ん'
    ) {
      return { result: 'absorb', state };
    }

    return { result: 'miss', state };
  }

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

  // Partial match
  return {
    result: 'correct',
    state: { ...state, currentInput: newInput, viablePatterns: stillViable },
  };
}

// ん は 'n' 1文字で表示
export function getDisplayRomaji(hiragana: string): string {
  const chars = parseHiragana(hiragana);
  return chars.map(getDisplayChar).join('');
}

export function getRomajiLength(hiragana: string): number {
  return getDisplayRomaji(hiragana).length;
}
