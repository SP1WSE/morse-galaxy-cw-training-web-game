import Phaser from 'phaser';
import { SCENES } from '../config/Constants.js';

/**
 * @class BootScene
 * @extends Phaser.Scene
 * @description Inicjalizuje podstawowe ustawienia skali i natychmiast przechodzi do Preloadera.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  /**
   * Zwykle ładuje absolutne minimum zasobów potrzebnych DO pokazania paska ładowania.
   */
  preload() {
    // Miejsce na załadowanie logo studia lub ramki paska postępu
  }

  /**
   * Uruchamia scenę Preloadera, gdy Boot zakończy działanie.
   */
  create() {
    this.scene.start(SCENES.PRELOADER);
  }
}