import Phaser from 'phaser';
import { SCENES } from '../config/Constants.js';
import { SaveManager } from '../storage/SaveManager.js';
import { CWEngine } from '../cw/CWEngine.js';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.SETTINGS });
  }

  create() {
    const { width, height } = this.cameras.main;
    this.profile = SaveManager.load();

    this.cwEngine = new CWEngine();
    this.cwEngine.resumeContext();

    this.add.text(width / 2, 50, 'SYSTEM SETTINGS', {
      fontFamily: 'monospace', fontSize: '40px', fill: '#00ff00', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    this.speedVal = this.profile.settings.baseGameSpeed || 100;
    this.charWpmVal = this.profile.settings.characterWPM || 20;
    this.overallWpmVal = this.profile.settings.overallWPM || 10;
    this.freqVal = this.profile.settings.frequency || 600;
    
    // NOWE: Pobranie wartości Bossa (domyślnie 2)
    this.bossLevelVal = this.profile.bossLevel || 2; 

    let startY = 130;
    const spacing = 55;

    // 1. Prędkość statków (60 - 180)
    this.createSettingRow(width, startY, 'BASE SHIP SPEED:', () => this.speedVal, (step) => {
      this.speedVal = Phaser.Math.Clamp(this.speedVal + step, 60, 180);
      return this.speedVal;
    });

    // 2. Character WPM
    startY += spacing;
    this.createSettingRow(width, startY, 'CHARACTER WPM:', () => this.charWpmVal, (step) => {
      this.charWpmVal = Phaser.Math.Clamp(this.charWpmVal + step, 10, 40);
      return this.charWpmVal;
    });

    // 3. Overall WPM
    startY += spacing;
    this.createSettingRow(width, startY, 'OVERALL WPM:', () => this.overallWpmVal, (step) => {
      this.overallWpmVal = Phaser.Math.Clamp(this.overallWpmVal + step, 5, this.charWpmVal);
      return this.overallWpmVal;
    });

    // 4. Częstotliwość (Hz) - krok co 50 Hz
    startY += spacing;
    this.createSettingRow(width, startY, 'TONE FREQUENCY (Hz):', () => this.freqVal, (step) => {
      this.freqVal = Phaser.Math.Clamp(this.freqVal + step, 400, 1000);
      return this.freqVal;
    }, 50);

    // 5. NOWE: Maksymalna długość Bossa / Słów (krok co 1, max 8)
    startY += spacing;
    this.createSettingRow(width, startY, 'BOSS MAX LENGTH (CHARS):', () => this.bossLevelVal, (step) => {
      this.bossLevelVal = Phaser.Math.Clamp(this.bossLevelVal + step, 2, 8);
      return this.bossLevelVal;
    }, 1);

    // Test dźwięku
    startY += spacing + 10;
    const testAudioBtn = this.add.text(width / 2, startY, '[ ♫ TEST AUDIO SIGNAL ]', {
      fontFamily: 'monospace', fontSize: '22px', fill: '#00ffff', backgroundColor: '#002222', padding: { x: 10, y: 5 }
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

    testAudioBtn.on('pointerover', () => testAudioBtn.setFill('#ffffff'));
    testAudioBtn.on('pointerout', () => testAudioBtn.setFill('#00ffff'));
    testAudioBtn.on('pointerdown', async () => {
      this.cwEngine.setWPM(this.charWpmVal, this.overallWpmVal);
      if (this.cwEngine.setFrequency) {
        this.cwEngine.setFrequency(this.freqVal);
      }
      try {
        await this.cwEngine.playCharacter('K');
      } catch (e) {
        console.error("Audio test error:", e);
      }
    });

    // Przycisk powrotu do menu
    const backBtn = this.add.text(width / 2, height - 70, '[ SAVE & RETURN TO MENU ]', {
      fontFamily: 'monospace', fontSize: '22px', fill: '#00ff00'
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setFill('#ffffff'));
    backBtn.on('pointerout', () => backBtn.setFill('#00ff00'));
    backBtn.on('pointerdown', () => {
      this.profile.settings.baseGameSpeed = this.speedVal;
      this.profile.settings.characterWPM = this.charWpmVal;
      this.profile.settings.overallWPM = this.overallWpmVal;
      this.profile.settings.frequency = this.freqVal;
      
      // Zapisujemy długość bossa do głównego profilu (nie w settings)
      this.profile.bossLevel = this.bossLevelVal;

      SaveManager.save(this.profile);
      this.scene.start(SCENES.MENU);
    });
  }

  createSettingRow(width, y, label, getValue, modifyValue, customStep = null) {
    this.add.text(width / 2 - 280, y, label, {
      fontFamily: 'monospace', fontSize: '20px', fill: '#00aa00'
    }).setOrigin(0, 0.5);

    const valText = this.add.text(width / 2 + 180, y, `${getValue()}`, {
      fontFamily: 'monospace', fontSize: '20px', fill: '#00ff00'
    }).setOrigin(0, 0.5);

    const minusBtn = this.add.text(width / 2 + 80, y, ' [ - ] ', {
      fontFamily: 'monospace', fontSize: '20px', fill: '#00aa00'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    const plusBtn = this.add.text(width / 2 + 250, y, ' [ + ] ', {
      fontFamily: 'monospace', fontSize: '20px', fill: '#00aa00'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    let step = 1;
    if (label.includes('SPEED')) step = 10;
    if (label.includes('FREQUENCY')) step = 50;
    if (customStep) step = customStep;

    minusBtn.on('pointerdown', () => {
      modifyValue(-step);
      valText.setText(`${getValue()}`);
    });

    plusBtn.on('pointerdown', () => {
      modifyValue(step);
      valText.setText(`${getValue()}`);
    });
  }
}