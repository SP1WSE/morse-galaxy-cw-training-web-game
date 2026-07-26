import Phaser from 'phaser';
import { SCENES } from '../config/Constants.js';
import { SaveManager } from '../storage/SaveManager.js';
import { KOCH_SEQUENCE } from '../ai/KochSequence.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.MENU });
  }

  create() {
    const { width, height } = this.cameras.main;
    this.profile = SaveManager.load();

    // Tytuł gry
    this.add.text(width / 2, height * 0.2, 'MORSE GALAXY', {
      fontFamily: 'monospace', fontSize: '56px', fill: '#00ff00', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    this.add.text(width / 2, height * 0.28, 'CW KOCH METHOD TRAINING GAME by SP1WSE', {
      fontFamily: 'monospace', fontSize: '18px', fill: '#00aa00'
    }).setOrigin(0.5, 0.5);

    // --- MENU GŁÓWNE ---
    this.mainMenuGroup = this.add.container(0, 0);
    this.trainingMenuGroup = this.add.container(0, 0);
    this.trainingMenuGroup.setVisible(false); // Na start ukryte podmenu treningu

    // Opcja 1: Kampania
    const campaignBtn = this.createButton(width / 2, height * 0.45, '[ START CAMPAIGN ]', () => {
      this.scene.start(SCENES.GAME, { mode: 'campaign' });
    });
    this.mainMenuGroup.add(campaignBtn);

    // Opcja 2: Wybór Treningu (otwiera podmenu)
    const trainingMenuBtn = this.createButton(width / 2, height * 0.55, '[ TRAINING MODE ]', () => {
      this.mainMenuGroup.setVisible(false);
      this.trainingMenuGroup.setVisible(true);
    });
    this.mainMenuGroup.add(trainingMenuBtn);

    // Opcja 3: Ustawienia
    const settingsBtn = this.createButton(width / 2, height * 0.65, '[ SYSTEM SETTINGS ]', () => {
      this.scene.start(SCENES.SETTINGS);
    });
    this.mainMenuGroup.add(settingsBtn);

    // --- PODMENU TRENINGU ---
    const trainingTitle = this.add.text(width / 2, height * 0.40, 'SELECT TRAINING TYPE', {
      fontFamily: 'monospace', fontSize: '24px', fill: '#00ffff'
    }).setOrigin(0.5, 0.5);
    this.trainingMenuGroup.add(trainingTitle);

    // Wybór poziomu Kocha do treningu
    this.trainingLevel = 5; // Domyślny poziom treningowy
    const maxLevel = KOCH_SEQUENCE.length;

    this.trainingLevelText = this.add.text(width / 2, height * 0.50, `KOCH LEVEL: ${this.trainingLevel}`, {
      fontFamily: 'monospace', fontSize: '20px', fill: '#00ff00'
    }).setOrigin(0.5, 0.5);

    const minusKochBtn = this.createButton(width / 2 - 120, height * 0.50, ' [ - ] ', () => {
      if (this.trainingLevel > 2) {
        this.trainingLevel--;
        this.trainingLevelText.setText(`KOCH LEVEL: ${this.trainingLevel}`);
      }
    });

    const plusKochBtn = this.createButton(width / 2 + 120, height * 0.50, ' [ + ] ', () => {
      if (this.trainingLevel < maxLevel) {
        this.trainingLevel++;
        this.trainingLevelText.setText(`KOCH LEVEL: ${this.trainingLevel}`);
      }
    });

    this.trainingMenuGroup.add([this.trainingLevelText, minusKochBtn, plusKochBtn]);

    // Przycisk startu treningu Kocha z wybranym poziomem
    const startKochTrainingBtn = this.createButton(width / 2, height * 0.60, '[ START KOCH TRAINING ]', () => {
      this.scene.start(SCENES.GAME, { mode: 'training_koch', level: this.trainingLevel });
    });
    this.trainingMenuGroup.add(startKochTrainingBtn);

    // Przycisk startu treningu cyfr i znaków
    const startNumbersBtn = this.createButton(width / 2, height * 0.70, '[ START NUMBERS & PROSIGNS ]', () => {
      this.scene.start(SCENES.GAME, { mode: 'training_numbers' });
    });
    this.trainingMenuGroup.add(startNumbersBtn);

    // Przycisk powrotu do menu głównego z podmenu treningu
    const backToMainBtn = this.createButton(width / 2, height * 0.82, '[ << BACK TO MAIN MENU ]', () => {
      this.trainingMenuGroup.setVisible(false);
      this.mainMenuGroup.setVisible(true);
    });
    this.trainingMenuGroup.add(backToMainBtn);

    // Informacje o graczu na dole
    const highScore = this.profile.highScore || 0;
    this.add.text(width / 2, height - 50, `HIGH SCORE: ${highScore}  |  CAMPAIGN KOCH LEVEL: ${this.profile.kochLevel || 2}`, {
      fontFamily: 'monospace', fontSize: '16px', fill: '#00aa00'
    }).setOrigin(0.5, 0.5);
  }

  createButton(x, y, label, callback) {
    const btn = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '22px', fill: '#00ff00'
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setFill('#ffffff');
      this.tweens.add({
        targets: btn,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        ease: 'Power1'
      });
    });

    btn.on('pointerout', () => {
      btn.setFill('#00ff00');
      this.tweens.add({
        targets: btn,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 100,
        ease: 'Power1'
      });
    });

    btn.on('pointerdown', callback);

    return btn;
  }
}