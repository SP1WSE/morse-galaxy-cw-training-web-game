export class SaveManager {
  static SAVE_KEY = 'morse_galaxy_save_v1';

  static getDefaultProfile() {
    return {
      kochLevel: 2,
      highScore: 0,
      xp: 0,
      stats: {}, 
      settings: {
        characterWPM: 20,
        overallWPM: 10,
        volume: 0.5,
        frequency: 600,
        baseGameSpeed: 70 // NOWE: Stała prędkość bazowa z menu
      }
    };
  }

  static save(data) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(this.SAVE_KEY, json);
      return true;
    } catch (e) {
      console.error('Failed to save game data:', e);
      return false;
    }
  }

  static load() {
    try {
      const json = localStorage.getItem(this.SAVE_KEY);
      if (json) {
        return { ...this.getDefaultProfile(), ...JSON.parse(json) };
      }
    } catch (e) {
      console.error('Failed to load game data, returning default:', e);
    }
    return this.getDefaultProfile();
  }

  static exportJSON() {
    return JSON.stringify(this.load(), null, 2);
  }
}