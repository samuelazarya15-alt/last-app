import wordsData from './words.json';

export interface Word {
  id: string;
  tigrinya: string;
  english: string;
  dutch: string;
  norwegian: string;
  swedish: string;
  german: string;
  category: string;
  emoji: string;
  translations: {
    english: string;
    dutch: string;
    norwegian: string;
    swedish: string;
    german: string;
    tigrinya: string;
  };
  audioUrl?: string;
}

const getCategoryAndEmoji = (id: number, english: string): { category: string, emoji: string } => {
  if (id >= 1 && id <= 10) return { category: 'Family', emoji: '👨‍👩‍👧‍👦' };
  if (id >= 11 && id <= 17) return { category: 'Colors', emoji: '🎨' };
  if (id >= 18 && id <= 25) return { category: 'Adjectives', emoji: '✨' };
  if (id >= 26 && id <= 35) return { category: 'Verbs', emoji: '🏃' };
  if (id >= 36 && id <= 40) return { category: 'Professions', emoji: '👷' };
  if (id >= 41 && id <= 48) return { category: 'Food', emoji: '🍎' };
  if (id >= 49 && id <= 56) return { category: 'Nature', emoji: '🌳' };
  if (id >= 57 && id <= 61) return { category: 'Misc', emoji: '📦' };
  if (id >= 62 && id <= 71) return { category: 'Numbers', emoji: '🔢' };
  if (id >= 72 && id <= 91) return { category: 'Adjectives', emoji: '✨' };
  if (id >= 92 && id <= 100) return { category: 'Verbs', emoji: '🏃' };
  if (id >= 101 && id <= 110) return { category: 'Animals', emoji: '🦁' };
  if (id >= 111 && id <= 120) return { category: 'Body', emoji: '👀' };
  if (id >= 121 && id <= 130) return { category: 'House', emoji: '🏠' };
  if (id >= 131 && id <= 140) return { category: 'Nature', emoji: '🌳' };
  if (id >= 141 && id <= 150) return { category: 'Transport', emoji: '🚗' };
  
  // Fallback
  return { category: 'Misc', emoji: '📦' };
};

// Add some clothing words since they are missing from the original list
const clothingWords: Word[] = [
  {
    id: 'c1', tigrinya: 'ክዳን', english: 'Shirt', dutch: 'Overhemd', norwegian: 'Skjorte', swedish: 'Skjorta', german: 'Hemd',
    category: 'Clothing', emoji: '👕',
    translations: { english: 'Shirt', dutch: 'Overhemd', norwegian: 'Skjorte', swedish: 'Skjorta', german: 'Hemd', tigrinya: 'ክዳን' }
  },
  {
    id: 'c2', tigrinya: 'ስረ', english: 'Pants', dutch: 'Broek', norwegian: 'Bukse', swedish: 'Byxor', german: 'Hose',
    category: 'Clothing', emoji: '👖',
    translations: { english: 'Pants', dutch: 'Broek', norwegian: 'Bukse', swedish: 'Byxor', german: 'Hose', tigrinya: 'ስረ' }
  },
  {
    id: 'c3', tigrinya: 'ጫማ', english: 'Shoes', dutch: 'Schoenen', norwegian: 'Sko', swedish: 'Skor', german: 'Schuhe',
    category: 'Clothing', emoji: '👞',
    translations: { english: 'Shoes', dutch: 'Schoenen', norwegian: 'Sko', swedish: 'Skor', german: 'Schuhe', tigrinya: 'ጫማ' }
  },
  {
    id: 'c4', tigrinya: 'ቆብዕ', english: 'Hat', dutch: 'Hoed', norwegian: 'Hatt', swedish: 'Hatt', german: 'Hut',
    category: 'Clothing', emoji: '🎩',
    translations: { english: 'Hat', dutch: 'Hoed', norwegian: 'Hatt', swedish: 'Hatt', german: 'Hut', tigrinya: 'ቆብዕ' }
  },
  {
    id: 'c5', tigrinya: 'ካልሲ', english: 'Socks', dutch: 'Sokken', norwegian: 'Sokker', swedish: 'Strumpor', german: 'Socken',
    category: 'Clothing', emoji: '🧦',
    translations: { english: 'Socks', dutch: 'Sokken', norwegian: 'Sokker', swedish: 'Strumpor', german: 'Socken', tigrinya: 'ካልሲ' }
  }
];

export const words: Word[] = [
  ...wordsData.map((w: any) => {
    const { category, emoji } = getCategoryAndEmoji(parseInt(w.id), w.english);
    return {
      ...w,
      category,
      emoji,
      translations: {
        english: w.english,
        dutch: w.dutch,
        norwegian: w.norwegian,
        swedish: w.swedish,
        german: w.german,
        tigrinya: w.tigrinya
      }
    };
  }),
  ...clothingWords
];
