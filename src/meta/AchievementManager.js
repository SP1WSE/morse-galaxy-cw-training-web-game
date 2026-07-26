import { globalEventBus } from '../core/EventBus.js';
import { SaveManager } from '../storage/SaveManager.js';

/**
 * @module AchievementManager
 * @description Definicje i logika weryfikacji osiągnięć gracza.
 */

export const ACHIEVEMENTS = {
  FIRST_BLOOD: { id: 'FIRST_BLOOD', title: 'Pierwsza Litera', desc: 'Zniszcz pierwszy statek wroga.' },
  CW_NOVICE: { id: 'CW_NOVICE', title: 'Nowicjusz CW', desc: 'Osiągnij 5 poziom metody Kocha.' },
  HITS_100: { id: 'HITS_100', title: 'Szeregowy', desc: 'Wpisz poprawnie 100 znaków.' },
  HITS_200: { id: 'HITS_200', title: 'Kapral', desc: 'Wpisz poprawnie 200 znaków.' },
  HITS_500: { id: 'HITS_500', title: 'Sierżant', desc: 'Wpisz poprawnie 500 znaków.' },
  HITS_1000: { id: 'HITS_1000', title: 'Porucznik', desc: 'Wpisz poprawnie 1000 znaków.' },
  HITS_1500: { id: 'HITS_1500', title: 'Kapitan', desc: 'Wpisz poprawnie 1500 znaków.' },
  HITS_2000: { id: 'HITS_2000', title: 'Major', desc: 'Wpisz poprawnie 2000 znaków.' },
  HITS_3000: { id: 'HITS_3000', title: 'Pułkownik', desc: 'Wpisz poprawnie 3000 znaków.' }
};

export class AchievementManager {
  /**
   * @param {Object} profile - Zapisany profil gracza
   */
  constructor(profile) {
    this.profile = profile;
    if (!this.profile.achievements) {
      this.profile.achievements = [];
    }
    
    // Inicjalizacja globalnego licznika znaków (aby zliczał przez wszystkie sesje gry)
    if (this.profile.lifetimeHits === undefined) {
      this.profile.lifetimeHits = 0;
    }
  }

  /**
   * Główna funkcja weryfikująca, wywoływana po każdej udanej akcji w grze.
   * @param {Object} sessionStats - Statystyki z bieżącej sesji gry
   * @param {number} currentKochLevel - Aktualny poziom Kocha
   */
  checkAchievements(sessionStats, currentKochLevel) {
    // Przy każdym wywołaniu tej metody (czyli przy każdym trafieniu) zwiększamy globalny licznik
    this.profile.lifetimeHits += 1;
    const total = this.profile.lifetimeHits;

    // Sprawdzenie: Pierwsza litera
    if (!this.has(ACHIEVEMENTS.FIRST_BLOOD.id) && total > 0) {
      this.unlock(ACHIEVEMENTS.FIRST_BLOOD);
    }

    // Sprawdzenie: Osiągnięcie poziomu Kocha
    if (!this.has(ACHIEVEMENTS.CW_NOVICE.id) && currentKochLevel >= 5) {
      this.unlock(ACHIEVEMENTS.CW_NOVICE);
    }

    // Sprawdzanie kolejnych kamieni milowych trafień
    if (!this.has(ACHIEVEMENTS.HITS_100.id) && total >= 100) this.unlock(ACHIEVEMENTS.HITS_100);
    if (!this.has(ACHIEVEMENTS.HITS_200.id) && total >= 200) this.unlock(ACHIEVEMENTS.HITS_200);
    if (!this.has(ACHIEVEMENTS.HITS_500.id) && total >= 500) this.unlock(ACHIEVEMENTS.HITS_500);
    if (!this.has(ACHIEVEMENTS.HITS_1000.id) && total >= 1000) this.unlock(ACHIEVEMENTS.HITS_1000);
    if (!this.has(ACHIEVEMENTS.HITS_1500.id) && total >= 1500) this.unlock(ACHIEVEMENTS.HITS_1500);
    if (!this.has(ACHIEVEMENTS.HITS_2000.id) && total >= 2000) this.unlock(ACHIEVEMENTS.HITS_2000);
    if (!this.has(ACHIEVEMENTS.HITS_3000.id) && total >= 3000) this.unlock(ACHIEVEMENTS.HITS_3000);

    // Dynamiczne tworzenie nieskończonych rang od 4000 wzwyż (równo co 1000 znaków)
    if (total > 3000 && total % 1000 === 0) {
      const dynamicId = `HITS_${total}`;
      if (!this.has(dynamicId)) {
        this.unlock({
          id: dynamicId,
          title: `Mistrz: ${total} znaków!`,
          desc: `Wpisano poprawnie ${total} znaków.`
        });
      }
    }
  }

  has(achievementId) {
    return this.profile.achievements.includes(achievementId);
  }

  unlock(achievement) {
    this.profile.achievements.push(achievement.id);
    SaveManager.save(this.profile);
    
    // Emitujemy zdarzenie, by UI mogło narysować powiadomienie na ekranie
    globalEventBus.emit('ACHIEVEMENT_UNLOCKED', achievement);
    console.log(`[Achievement Unlocked]: ${achievement.title}`);
  }
}