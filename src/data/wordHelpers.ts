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
  if (id >= 151 && id <= 160) return { category: 'Clothing', emoji: '👕' };
  if (id >= 161 && id <= 177) return { category: 'Time', emoji: '⏰' };
  if (id >= 178 && id <= 185) return { category: 'Emotions', emoji: '😊' };
  if (id >= 186 && id <= 193) return { category: 'Weather', emoji: '🌤️' };
  if (id >= 194 && id <= 200) return { category: 'School', emoji: '📚' };
  if (id >= 201 && id <= 220) return { category: 'Food', emoji: '🍎' };
  if (id >= 221 && id <= 228) return { category: 'House', emoji: '🏠' };
  if (id >= 229 && id <= 234) return { category: 'Tools', emoji: '🛠️' };
  if (id >= 235 && id <= 240) return { category: 'Tech', emoji: '💻' };
  if (id >= 241 && id <= 245) return { category: 'Sports', emoji: '⚽' };
  if (id >= 246 && id <= 250) return { category: 'Hobbies', emoji: '🎨' };
  if (id >= 251 && id <= 255) return { category: 'Colors', emoji: '🎨' };
  if (id >= 256 && id <= 260) return { category: 'Shapes', emoji: '📐' };
  if (id >= 261 && id <= 270) return { category: 'Directions', emoji: '🧭' };
  if (id >= 271 && id <= 280) return { category: 'Adjectives', emoji: '✨' };
  if (id >= 281 && id <= 290) return { category: 'Verbs', emoji: '🏃' };
  if (id >= 291 && id <= 300) return { category: 'Phrases', emoji: '💬' };
  if (id >= 301 && id <= 310) return { category: 'Body', emoji: '👤' };
  if (id >= 311 && id <= 320) return { category: 'Emotions', emoji: '😊' };
  if (id >= 321 && id <= 330) return { category: 'Weather', emoji: '☁️' };
  if (id >= 331 && id <= 344) return { category: 'Time', emoji: '⏰' };
  if (id >= 345 && id <= 353) return { category: 'Dates', emoji: '📅' };
  if (id >= 354 && id <= 363) return { category: 'Food', emoji: '🍎' };
  if (id >= 364 && id <= 373) return { category: 'Animals', emoji: '🦁' };
  if (id >= 374 && id <= 383) return { category: 'House', emoji: '🏠' };
  if (id >= 384 && id <= 393) return { category: 'Tech', emoji: '💻' };
  if (id >= 394 && id <= 403) return { category: 'Sports', emoji: '⚽' };
  if (id >= 404 && id <= 413) return { category: 'Nature', emoji: '🌳' };
  if (id >= 414 && id <= 423) return { category: 'Body', emoji: '👤' };
  if (id >= 424 && id <= 430) return { category: 'Emotions', emoji: '😊' };
  
  // Fallback
  return { category: 'Misc', emoji: '📦' };
};

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
  })
];
