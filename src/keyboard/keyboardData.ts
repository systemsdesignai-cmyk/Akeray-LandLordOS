/**
 * Akarai / LandlordOS Multilingual In-App Keyboard — Language Layouts & Verified Unicode Mappings
 * Supports:
 * 1. English (EN) — Mobile QWERTY
 * 2. Amharic (አማ) — Ethiopic Fidel (7 orders + labialized forms)
 * 3. Tigrinya (ትግ) — Ethiopic Fidel with Tigrinya-specific series (ቐ, ቘ, ኸ, ዀ, ሐ, ዐ)
 * 4. Afaan Oromoo (OR) — Qubee QWERTY + Digraph & Long-Vowel Shortcut Row
 */

export type KeyboardLanguageId = 'en' | 'am' | 'ti' | 'om';

export interface KeyboardLanguageMeta {
  id: KeyboardLanguageId;
  shortLabel: string; // Shown in top pill: EN, አማ, ትግ, OR
  fullName: string; // Shown on spacebar: English, አማርኛ, ትግርኛ, Afaan Oromoo
  englishName: string;
  script: 'Latin' | 'Ethiopic';
  mappingStatus: string;
}

export const KEYBOARD_LANGUAGES: KeyboardLanguageMeta[] = [
  {
    id: 'en',
    shortLabel: 'EN',
    fullName: 'English',
    englishName: 'English (QWERTY)',
    script: 'Latin',
    mappingStatus: 'Verified Standard Mobile QWERTY',
  },
  {
    id: 'am',
    shortLabel: 'አማ',
    fullName: 'አማርኛ',
    englishName: 'Amharic (Fidel)',
    script: 'Ethiopic',
    mappingStatus: 'Verified Ethiopic Unicode (U+1200–U+137F) · 7 Orders + Labiovelars',
  },
  {
    id: 'ti',
    shortLabel: 'ትግ',
    fullName: 'ትግርኛ',
    englishName: 'Tigrinya (Fidel)',
    script: 'Ethiopic',
    mappingStatus: 'Verified Tigrinya Ethiopic Series (incl. ቐ/ቘ & ኸ/ዀ) · Configurable Layout',
  },
  {
    id: 'om',
    shortLabel: 'OR',
    fullName: 'Afaan Oromoo',
    englishName: 'Afaan Oromoo (Qubee)',
    script: 'Latin',
    mappingStatus: 'Verified Qubee Latin + Digraph & Long-Vowel Shortcut Bar',
  },
];

/**
 * English QWERTY Rows
 */
export const ENGLISH_QWERTY_ROWS: string[][] = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

/**
 * Afaan Oromoo Qubee Shortcut Row (Mandatory exact order from specification & reference image)
 * Dh | Ch | Sh | Ny | Ph | Aa | Ee | Ii | Oo | Uu
 */
export const OROMO_QUBEE_SHORTCUTS: string[] = [
  'Dh',
  'Ch',
  'Sh',
  'Ny',
  'Ph',
  'Aa',
  'Ee',
  'Ii',
  'Oo',
  'Uu',
];

/**
 * Afaan Oromoo QWERTY Rows (includes Hudhaa apostrophe ’ on Row 2 as in the reference screenshot)
 */
export const OROMO_QWERTY_ROWS: string[][] = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', '’'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

/**
 * Ethiopic Fidel Family definition:
 * base: 1st order (Ge'ez / ግዕዝ)
 * orders: [1st -ä/e, 2nd -u, 3rd -i, 4th -a, 5th -ē, 6th -ə/∅, 7th -o, optional 8th -wa]
 */
export interface FidelFamily {
  base: string;
  label: string;
  orders: string[];
}

export const ETHIOPIC_ORDER_LABELS = [
  '1ኛ (ግዕዝ)',
  '2ኛ (ካዕብ)',
  '3ኛ (ሣልስ)',
  '4ኛ (ራብዕ)',
  '5ኛ (ኃምስ)',
  '6ኛ (ሳድስ)',
  '7ኛ (ሳብዕ)',
  'ዲቃላ (-ዋ)',
];

/**
 * Comprehensive Ethiopic Fidel Registry covering both Amharic and Tigrinya characters
 */
export const FIDEL_FAMILIES: Record<string, FidelFamily> = {
  ሀ: { base: 'ሀ', label: 'hä', orders: ['ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ'] },
  ለ: { base: 'ለ', label: 'lä', orders: ['ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ', 'ሏ'] },
  ሐ: { base: 'ሐ', label: 'ḥä', orders: ['ሐ', 'ሑ', 'ሒ', 'ሓ', 'ሔ', 'ሕ', 'ሖ', 'ሗ'] },
  መ: { base: 'መ', label: 'mä', orders: ['መ', 'ሙ', 'ሚ', 'ማ', 'ሜ', 'ም', 'ሞ', 'ሟ'] },
  ሠ: { base: 'ሠ', label: 'śä', orders: ['ሠ', 'ሡ', 'ሢ', 'ሣ', 'ሤ', 'ሥ', 'ሦ', 'ሧ'] },
  ረ: { base: 'ረ', label: 'rä', orders: ['ረ', 'ሩ', 'ሪ', 'ራ', 'ሬ', 'ር', 'ሮ', 'ሯ'] },
  ሰ: { base: 'ሰ', label: 'sä', orders: ['ሰ', 'ሱ', 'ሲ', 'ሳ', 'ሴ', 'ስ', 'ሶ', 'ሷ'] },
  ሸ: { base: 'ሸ', label: 'šä', orders: ['ሸ', 'ሹ', 'ሺ', 'ሻ', 'ሼ', 'ሽ', 'ሾ', 'ሿ'] },
  ቀ: { base: 'ቀ', label: 'qä', orders: ['ቀ', 'ቁ', 'ቂ', 'ቃ', 'ቄ', 'ቅ', 'ቆ', 'ቋ'] },
  ቐ: { base: 'ቐ', label: 'qhÄ (Tigrinya)', orders: ['ቐ', 'ቑ', 'ቒ', 'ቓ', 'ቔ', 'ቕ', 'ቖ', 'ቛ'] },
  በ: { base: 'በ', label: 'bä', orders: ['በ', 'ቡ', 'ቢ', 'ባ', 'ቤ', 'ብ', 'ቦ', 'ቧ'] },
  ቨ: { base: 'ቨ', label: 'vä', orders: ['ቨ', 'ቩ', 'ቪ', 'ቫ', 'ቬ', 'ቭ', 'ቮ', 'ቯ'] },
  ተ: { base: 'ተ', label: 'tä', orders: ['ተ', 'ቱ', 'ቲ', 'ታ', 'ቴ', 'ት', 'ቶ', 'ቷ'] },
  ቸ: { base: 'ቸ', label: 'čä', orders: ['ቸ', 'ቹ', 'ቺ', 'ቻ', 'ቼ', 'ች', 'ቾ', 'ቿ'] },
  ኀ: { base: 'ኀ', label: 'ḫä', orders: ['ኀ', 'ኁ', 'ኂ', 'ኃ', 'ኄ', 'ኅ', 'ኆ', 'ኋ'] },
  ነ: { base: 'ነ', label: 'nä', orders: ['ነ', 'ኑ', 'ኒ', 'ና', 'ኔ', 'ን', 'ኖ', 'ኗ'] },
  ኘ: { base: 'ኘ', label: 'ñä', orders: ['ኘ', 'ኙ', 'ኚ', 'ኛ', 'ኜ', 'ኝ', 'ኞ', 'ኟ'] },
  አ: { base: 'አ', label: 'ʾä', orders: ['አ', 'ኡ', 'ኢ', 'ኣ', 'ኤ', 'እ', 'ኦ', 'ኧ'] },
  ከ: { base: 'ከ', label: 'kä', orders: ['ከ', 'ኩ', 'ኪ', 'ካ', 'ኬ', 'ክ', 'ኮ', 'ኳ'] },
  ኸ: { base: 'ኸ', label: 'khä', orders: ['ኸ', 'ኹ', 'ኺ', 'ኻ', 'ኼ', 'ኽ', 'ኾ', 'ዃ'] },
  ወ: { base: 'ወ', label: 'wä', orders: ['ወ', 'ዉ', 'ዊ', 'ዋ', 'ዌ', 'ው', 'ዎ'] },
  ዐ: { base: 'ዐ', label: 'ʿä', orders: ['ዐ', 'ዑ', 'ዒ', 'ዓ', 'ዔ', 'ዕ', 'ዖ'] },
  ዘ: { base: 'ዘ', label: 'zä', orders: ['ዘ', 'ዙ', 'ዚ', 'ዛ', 'ዜ', 'ዝ', 'ዞ', 'ዟ'] },
  ዠ: { base: 'ዠ', label: 'žä', orders: ['ዠ', 'ዡ', 'ዢ', 'ዣ', 'ዤ', 'ዥ', 'ዦ', 'ዧ'] },
  የ: { base: 'የ', label: 'yä', orders: ['የ', 'ዩ', 'ዪ', 'ያ', 'ዬ', 'ይ', 'ዮ'] },
  ደ: { base: 'ደ', label: 'dä', orders: ['ደ', 'ዱ', 'ዲ', 'ዳ', 'ዴ', 'ድ', 'ዶ', 'ዷ'] },
  ጀ: { base: 'ጀ', label: 'ǧä', orders: ['ጀ', 'ጁ', 'ጂ', 'ጃ', 'ጄ', 'ጅ', 'ጆ', 'ጇ'] },
  ገ: { base: 'ገ', label: 'gä', orders: ['ገ', 'ጉ', 'ጊ', 'ጋ', 'ጌ', 'ግ', 'ጎ', 'ጓ'] },
  ጠ: { base: 'ጠ', label: 'ṭä', orders: ['ጠ', 'ጡ', 'ጢ', 'ጣ', 'ጤ', 'ጥ', 'ጦ', 'ጧ'] },
  ጨ: { base: 'ጨ', label: 'č̣ä', orders: ['ጨ', 'ጩ', 'ጪ', 'ጫ', 'ጬ', 'ጭ', 'ጮ', 'ጯ'] },
  ጰ: { base: 'ጰ', label: 'p̣ä', orders: ['ጰ', 'ጱ', 'ጲ', 'ጳ', 'ጴ', 'ጵ', 'ጶ', 'ጷ'] },
  ጸ: { base: 'ጸ', label: 'ṣä', orders: ['ጸ', 'ጹ', 'ጺ', 'ጻ', 'ጼ', 'ጽ', 'ጾ', 'ጿ'] },
  ፀ: { base: 'ፀ', label: 'ṣ́ä', orders: ['ፀ', 'ፁ', 'ፂ', 'ፃ', 'ፄ', 'ፅ', 'ፆ'] },
  ፈ: { base: 'ፈ', label: 'fä', orders: ['ፈ', 'ፉ', 'ፊ', 'ፋ', 'ፌ', 'ፍ', 'ፎ', 'ፏ'] },
  ፐ: { base: 'ፐ', label: 'pä', orders: ['ፐ', 'ፑ', 'ፒ', 'ፓ', 'ፔ', 'ፕ', 'ፖ', 'ፗ'] },
  ቈ: { base: 'ቈ', label: 'qwä', orders: ['ቈ', 'ቊ', 'ቋ', 'ቌ', 'ቍ'] },
  ቘ: { base: 'ቘ', label: 'qhwä (Tigrinya)', orders: ['ቘ', 'ቚ', 'ቛ', 'ቜ', 'ቝ'] },
  ኈ: { base: 'ኈ', label: 'hwä', orders: ['ኈ', 'ኊ', 'ኋ', 'ኌ', 'ኍ'] },
  ኰ: { base: 'ኰ', label: 'kwä', orders: ['ኰ', 'ኲ', 'ኳ', 'ኴ', 'ኵ'] },
  ዀ: { base: 'ዀ', label: 'khwä (Tigrinya)', orders: ['ዀ', 'ዂ', 'ዃ', 'ዄ', 'ዅ'] },
  ጐ: { base: 'ጐ', label: 'gwä', orders: ['ጐ', 'ጒ', 'ጓ', 'ጔ', 'ጕ'] },
};

/**
 * Reverse lookup map from any Fidel character back to its base family
 * so tapping a vowel order in the top composition bar can replace the just-typed character.
 */
export const CHAR_TO_FIDEL_FAMILY: Record<string, FidelFamily> = {};
Object.values(FIDEL_FAMILIES).forEach((fam) => {
  fam.orders.forEach((ch) => {
    CHAR_TO_FIDEL_FAMILY[ch] = fam;
  });
});

/**
 * Amharic Primary 3x10 Fidel Grid (Matches the Amharic reference card in the screenshot 1:1)
 * Plus Page 2 for extended characters (ፀ, ፈ, ፐ, ቨ, labiovelars, Ethiopic punctuation)
 */
export const AMHARIC_FIDEL_PAGE_1: string[][] = [
  ['ሀ', 'ለ', 'ሐ', 'መ', 'ሠ', 'ረ', 'ሰ', 'ሸ', 'ቀ', 'በ'],
  ['ተ', 'ቸ', 'ኀ', 'ነ', 'ኘ', 'አ', 'ከ', 'ኸ', 'ወ', 'ዐ'],
  ['ዘ', 'ዠ', 'የ', 'ደ', 'ጀ', 'ገ', 'ጠ', 'ጨ', 'ጰ', 'ጸ'],
];

export const AMHARIC_FIDEL_PAGE_2: string[][] = [
  ['ፀ', 'ፈ', 'ፐ', 'ቨ', 'ቈ', 'ኈ', 'ኰ', 'ጐ', '።', '፣'],
  ['፤', '፥', '፦', '፧', '፩', '፪', '፫', '፬', '፭', '፮'],
  ['፯', '፰', '፱', '፲', '፳', '፴', '፵', '፶', '«', '»'],
];

/**
 * Tigrinya Primary 3x10 Fidel Grid
 * Prioritizes Tigrinya-specific pharyngeal and uvular/velar fricative series (ሐ, ዐ, ቐ, ኸ, ቘ, ዀ)
 * while matching the visual density and structure of the Tigrinya card in the reference screenshot.
 */
export const TIGRINYA_FIDEL_PAGE_1: string[][] = [
  ['ሀ', 'ለ', 'ሐ', 'መ', 'ረ', 'ሰ', 'ሸ', 'ቀ', 'ቐ', 'በ'],
  ['ተ', 'ቸ', 'ነ', 'ኘ', 'አ', 'ከ', 'ኸ', 'ወ', 'ዐ', 'ዘ'],
  ['ዠ', 'የ', 'ደ', 'ጀ', 'ገ', 'ጠ', 'ጨ', 'ጰ', 'ጸ', 'ፈ'],
];

export const TIGRINYA_FIDEL_PAGE_2: string[][] = [
  ['ፐ', 'ቨ', 'ሠ', 'ኀ', 'ፀ', 'ቘ', 'ዀ', 'ቈ', 'ኰ', 'ጐ'],
  ['።', '፣', '፤', '፥', '፦', '፧', '፩', '፪', '፫', '፬'],
  ['፭', '፮', '፯', '፰', '፱', '፲', '፳', '፴', '«', '»'],
];

/**
 * Numbers & Punctuation Layer (`123` toggle)
 */
export const NUMBERS_AND_SYMBOLS_ROWS: string[][] = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['-', '/', ':', ';', '(', ')', 'R', '&', '@', '"'],
  ['.', ',', '?', '!', "'", '+', '#', '%', '=', '*'],
];

export const ETHIOPIC_PUNCTUATION_SHORTCUTS: string[] = [
  '።',
  '፣',
  '፤',
  '፥',
  '፦',
  '፧',
  '(',
  ')',
  '-',
  '/',
];
