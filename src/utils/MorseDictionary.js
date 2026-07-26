/**
 * @module MorseDictionary
 * @description Definiuje standardowe mapowanie znaków na kod Morse'a (ITU).
 * Używa kropki (.) dla krótkiego sygnału i myślnika (-) dla długiego.
 */

export const MorseMap = {
  // Litery
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',

  // Cyfry
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',

  // Znaki interpunkcyjne i Prosigns
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  '/': '-..-.',
  '=': '-...-', // BT (Break)
  '+': '.-.-.', // AR (End of message)
  '<SK>': '...-.-' // End of work
};

/**
 * Zwraca kod Morse'a dla danego znaku.
 * @param {string} char - Znak do przetłumaczenia.
 * @returns {string|null} - Reprezentacja Morse'a lub null, jeśli znak nie istnieje.
 */
export function getMorseForChar(char) {
  if (!char) return null;
  const upperChar = char.toUpperCase();
  return MorseMap[upperChar] || null;
}