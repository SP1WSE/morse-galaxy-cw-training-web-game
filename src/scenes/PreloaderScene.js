import Phaser from 'phaser';
import { SCENES, COLORS } from '../config/Constants.js';

/**
 * @class PreloaderScene
 * @extends Phaser.Scene
 * @description Zarządza asynchronicznym ładowaniem wszystkich zasobów gry.
 * Wyświetla terminalowy pasek postępu.
 */
export class PreloaderScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.PRELOADER });
  }

  preload() {
    const { width, height } = this.cameras.main;
    
    // Rysowanie paska postępu
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    
    progressBox.lineStyle(2, COLORS.TERMINAL_GREEN, 1);
    progressBox.strokeRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'INITIALIZING SYSTEM...', {
      fontFamily: 'monospace',
      fontSize: '20px',
      fill: '#00ff00'
    }).setOrigin(0.5, 0.5);

    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontFamily: 'monospace',
      fontSize: '18px',
      fill: '#000000'
    }).setOrigin(0.5, 0.5);

    // Eventy Phasera raportujące postęp
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(COLORS.TERMINAL_GREEN, 1);
      progressBar.fillRect(width / 2 - 158, height / 2 - 23, 316 * value, 46);
      percentText.setText(parseInt(value * 100) + '%');
      
      // Gdy pasek przekroczy połowę, zmieniamy kolor tekstu procentów na czarny dla kontrastu
      percentText.setColor(value > 0.5 ? '#000000' : '#00ff00');
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      
      this.scene.start(SCENES.MENU);
    });

    // Symulacja ładowania zasobów (zostanie zastąpiona prawdziwymi plikami w kolejnych etapach)
    for (let i = 0; i < 50; i++) {
      this.load.image(`logo${i}`, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
    }
  }
}