import wordsData from './words.json';

export interface Word {
  id: number;
  tigrinya: string;
  latin: string;
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
    latin: string;
  };
  audioUrl?: string;
}

const getCategoryAndEmoji = (id: number, english: string): { category: string, emoji: string } => {
  const eng = english.toLowerCase();
  
  // Keyword based categorization (Higher priority)
  if (eng.includes('brother') || eng.includes('sister') || eng.includes('mother') || eng.includes('father') || eng.includes('uncle') || eng.includes('aunt') || eng.includes('grand')) return { category: 'Family', emoji: '👨‍👩‍👧‍👦' };
  if (eng.includes('red') || eng.includes('blue') || eng.includes('green') || eng.includes('yellow') || eng.includes('black') || eng.includes('white')) return { category: 'Colors', emoji: '🎨' };
  if (eng.includes('lion') || eng.includes('cat') || eng.includes('dog') || eng.includes('elephant') || eng.includes('bird')) return { category: 'Animals', emoji: '🦁' };
  if (eng.includes('car') || eng.includes('train') || eng.includes('plane') || eng.includes('bicycle')) return { category: 'Transport', emoji: '🚗' };
  if (eng.includes('apple') || eng.includes('bread') || eng.includes('water') || eng.includes('food') || eng.includes('coffee')) return { category: 'Food', emoji: '🍎' };
  if (eng.includes('computer') || eng.includes('phone') || eng.includes('internet')) return { category: 'Tech', emoji: '💻' };

  // ID based categorization for 551 words (Redistributed)
  if (id >= 1 && id <= 20) return { category: 'Family', emoji: '👨‍👩‍👧‍👦' };
  if (id >= 21 && id <= 40) return { category: 'Colors', emoji: '🎨' };
  if (id >= 41 && id <= 60) return { category: 'Time', emoji: '📅' };
  if (id >= 61 && id <= 80) return { category: 'Nature', emoji: '🌳' };
  if (id >= 81 && id <= 100) return { category: 'Numbers', emoji: '🔢' };
  if (id >= 101 && id <= 120) return { category: 'People', emoji: '👤' };
  if (id >= 121 && id <= 140) return { category: 'Body', emoji: '👀' };
  if (id >= 141 && id <= 160) return { category: 'Clothing', emoji: '👕' };
  if (id >= 161 && id <= 180) return { category: 'House', emoji: '🏠' };
  if (id >= 181 && id <= 200) return { category: 'Kitchen', emoji: '🍳' };
  if (id >= 201 && id <= 230) return { category: 'Verbs', emoji: '🏃' };
  if (id >= 231 && id <= 260) return { category: 'Emotions', emoji: '😊' };
  if (id >= 261 && id <= 280) return { category: 'Animals', emoji: '🦁' };
  if (id >= 281 && id <= 300) return { category: 'Travel', emoji: '✈️' };
  if (id >= 301 && id <= 330) return { category: 'Society', emoji: '👥' };
  if (id >= 331 && id <= 360) return { category: 'Adjectives', emoji: '✨' };
  if (id >= 361 && id <= 390) return { category: 'Places', emoji: '🏙️' };
  if (id >= 391 && id <= 410) return { category: 'Tech', emoji: '💻' };
  if (id >= 411 && id <= 430) return { category: 'Weather', emoji: '🌤️' };
  if (id >= 431 && id <= 460) return { category: 'Abstract', emoji: '🧠' };
  if (id >= 461 && id <= 490) return { category: 'Health', emoji: '🏥' };
  if (id >= 491 && id <= 520) return { category: 'Education', emoji: '🎓' };
  if (id >= 521 && id <= 551) return { category: 'Philosophy', emoji: '🧠' };
  
  // Fallback
  return { category: 'General', emoji: '📚' };
};

export const words: Word[] = [
  ...wordsData.map((w: any) => {
    const { category, emoji } = getCategoryAndEmoji(w.id, w.english);
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
        tigrinya: w.tigrinya,
        latin: w.latin || ''
      }
    };
  })
];
