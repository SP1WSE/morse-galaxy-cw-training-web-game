import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { PreloaderScene } from './scenes/PreloaderScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { TrainingMenuScene } from './scenes/TrainingMenuScene.js';
import { COLORS } from './config/Constants.js';
import { SummaryScene } from './scenes/SummaryScene.js';

/**
 * @description Główna konfiguracja instancji silnika Phaser 3.
 * Definiuje parametry renderowania, fizyki oraz kolejność ładowania scen.
 */
const config = {
  type: Phaser.AUTO, // Automatycznie wybiera WebGL, a gdy brak wsparcia - Canvas
  parent: 'game-container', // ID elementu div z pliku index.html
  width: 1280,
  height: 720,
  backgroundColor: COLORS.BACKGROUND,
  
  // Konfiguracja skalowania - gra zawsze zachowa proporcje i wyśrodkuje się na ekranie
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  
  // Konfiguracja systemu fizyki
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // W kosmosie nie ma grawitacji globalnej
      debug: false       // Zmień na true, aby zobaczyć hitboxy w czasie testów
    }
  },
  
  // Rejestracja wszystkich scen gry w kolejności ich wywoływania
  scene: [
    BootScene,
    PreloaderScene,
    MenuScene,
    GameScene,
    SettingsScene,
    TrainingMenuScene,
    SummaryScene     // <-- TUTAJ DODAJ TĘ SCENĘ
  ]
};

// Inicjalizacja gry
const game = new Phaser.Game(config);

export default game;