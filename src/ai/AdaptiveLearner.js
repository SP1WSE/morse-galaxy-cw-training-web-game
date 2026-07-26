import { KOCH_SEQUENCE } from './KochSequence.js';

/**
 * @module AdaptiveLearner
 * @description Dobiera znaki na podstawie analizy błędów gracza i zarządza progresem (Metoda Kocha).
 */
export class AdaptiveLearner {
  /**
   * @param {Object} profile - Profil wczytany z SaveManager.
   */
  constructor(profile) {
    this.level = profile.kochLevel || 2;
    this.stats = profile.stats || {};
    
    // Inicjalizacja statystyk dla nowych znaków
    this._initializeStats();
  }

  _initializeStats() {
    const activeChars = KOCH_SEQUENCE.slice(0, this.level);
    activeChars.forEach(char => {
      if (!this.stats[char]) {
        this.stats[char] = { attempts: 0, hits: 0, totalTimeMs: 0, consecutiveHits: 0 };
      }
    });
  }

  /**
   * Zapisuje wynik próby odgadnięcia znaku.
   * @param {string} char - Znak.
   * @param {number} responseTimeMs - Czas reakcji.
   * @param {boolean} isCorrect - Czy gracz wpisał poprawnie.
   */
  recordAttempt(char, responseTimeMs, isCorrect) {
    if (!this.stats[char]) this._initializeStats();
    
    const stat = this.stats[char];
    stat.attempts += 1;
    stat.totalTimeMs += responseTimeMs;
    
    if (isCorrect) {
      stat.hits += 1;
      stat.consecutiveHits += 1;
    } else {
      stat.consecutiveHits = 0; // Reset przy błędzie
    }

    this._checkPromotion();
  }

  /**
   * Sprawdza, czy gracz opanował obecne znaki na tyle, by dodać nowy (awans).
   * Próg: minimum 90% skuteczności z ostatnich 20 prób dla każdego aktywnego znaku.
   * Uproszczone na potrzeby MVP: jeśli każda litera ma 5 trafień z rzędu.
   * @private
   */
  _checkPromotion() {
    if (this.level >= KOCH_SEQUENCE.length) return; // Osiągnięto max poziom

    const activeChars = KOCH_SEQUENCE.slice(0, this.level);
    const readyForNext = activeChars.every(char => this.stats[char].consecutiveHits >= 5);

    if (readyForNext) {
      this.level += 1;
      this._initializeStats();
      console.log(`[Koch Method] Promotion! Now learning ${this.level} characters.`);
    }
  }

  /**
   * Wybiera następny znak za pomocą algorytmu wagowego (Weighted Random).
   * Znaki z niższym wskaźnikiem trafień i dłuższym czasem reakcji mają większą wagę.
   * @returns {string} - Znak do wygenerowania.
   */
  getNextCharacter() {
    const activeChars = KOCH_SEQUENCE.slice(0, this.level);
    
    let totalWeight = 0;
    const weights = activeChars.map(char => {
      const stat = this.stats[char];
      
      // Baza to 10 punktów wagi
      let weight = 10; 
      
      if (stat.attempts > 0) {
        const accuracy = stat.hits / stat.attempts;
        const avgTime = stat.totalTimeMs / stat.attempts;
        
        // Im niższa celność, tym wyższa waga (kara od 0 do 20)
        weight += (1 - accuracy) * 20;
        
        // Jeśli średni czas jest większy niż 2 sekundy, powoli zwiększaj wagę
        if (avgTime > 2000) {
          weight += Math.min((avgTime - 2000) / 500, 10);
        }
      } else {
        // Nowe, nietestowane znaki mają wysoki priorytet
        weight = 30; 
      }
      
      totalWeight += weight;
      return { char, weight };
    });

    // Losowanie na podstawie wag
    let randomValue = Math.random() * totalWeight;
    for (const item of weights) {
      randomValue -= item.weight;
      if (randomValue <= 0) {
        return item.char;
      }
    }
    
    return activeChars[0]; // Fallback
  }

  /**
   * Zwraca dane do zapisania.
   * @returns {Object}
   */
  exportState() {
    return {
      kochLevel: this.level,
      stats: this.stats
    };
  }
}