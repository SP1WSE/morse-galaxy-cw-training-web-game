import Phaser from 'phaser';
import { SCENES } from '../config/Constants.js';

export class TrainingMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.TRAINING_MENU });
  }

  create() {
    const { width, height } = this.cameras.main;

    this.add.text(width / 2, 120, 'TRAINING MODE', {
      fontFamily: 'monospace', fontSize: '48px', fill: '#00ff00', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    // Opcja 1: Standardowy trening Kocha
    this.createOption(width / 2, height * 0.4, '> STANDARD KOCH TRAINING', () => {
      this.scene.start(SCENES.GAME, { mode: 'training_koch' });
    });

    // Opcja 2: Trening liter/cyfr
    this.createOption(width / 2, height * 0.5, '> NUMBERS & PROSIGNS ONLY', () => {
      this.scene.start(SCENES.GAME, { mode: 'training_numbers' });
    });

    // Powrót
    const backBtn = this.add.text(width / 2, height - 100, '[ RETURN TO MAIN MENU ]', {
      fontFamily: 'monospace', fontSize: '24px', fill: '#00aa00'
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setFill('#ff0000'));
    backBtn.on('pointerout', () => backBtn.setFill('#00aa00'));
    backBtn.on('pointerdown', () => this.scene.start(SCENES.MENU));
  }

  createOption(x, y, text, onClick) {
    const opt = this.add.text(x, y, text, {
      fontFamily: 'monospace', fontSize: '24px', fill: '#00aa00'
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

    opt.on('pointerover', () => { opt.setFill('#00ff00'); opt.setText(`${text} _`); });
    opt.on('pointerout', () => { opt.setFill('#00aa00'); opt.setText(text); });
    opt.on('pointerdown', onClick);
  }
}