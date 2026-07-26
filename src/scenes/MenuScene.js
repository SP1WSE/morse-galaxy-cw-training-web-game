import Phaser from 'phaser';
import { SCENES } from '../config/Constants.js';
import { SaveManager } from '../storage/SaveManager.js';
import { KOCH_SEQUENCE } from '../ai/KochSequence.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.MENU });
  }

  init() {
    // Inicjalizacja kontekstu audio dla cyberpunkowych dźwięków interfejsu (nie wymaga plików zewnętrznych)
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();
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
    this.trainingMenuGroup.setVisible(false);

    // Opcja 1: Kampania
    const campaignBtn = this.createButton(width / 2, height * 0.45, '[ START CAMPAIGN ]', () => {
      this.scene.start(SCENES.GAME, { mode: 'campaign' });
    });
    this.mainMenuGroup.add(campaignBtn);

    // Opcja 2: Wybór Treningu
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

    this.trainingLevel = 5; 
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

    const startKochTrainingBtn = this.createButton(width / 2, height * 0.60, '[ START KOCH TRAINING ]', () => {
      this.scene.start(SCENES.GAME, { mode: 'training_koch', level: this.trainingLevel });
    });
    this.trainingMenuGroup.add(startKochTrainingBtn);

    const startNumbersBtn = this.createButton(width / 2, height * 0.70, '[ START NUMBERS & PROSIGNS ]', () => {
      this.scene.start(SCENES.GAME, { mode: 'training_numbers' });
    });
    this.trainingMenuGroup.add(startNumbersBtn);

    const backToMainBtn = this.createButton(width / 2, height * 0.82, '[ << BACK TO MAIN MENU ]', () => {
      this.trainingMenuGroup.setVisible(false);
      this.mainMenuGroup.setVisible(true);
    });
    this.trainingMenuGroup.add(backToMainBtn);

    // Informacje o graczu na dole
    const highScore = this.profile.highScore || 0;
    this.add.text(width / 2, height - 70, `HIGH SCORE: ${highScore}  |  CAMPAIGN KOCH LEVEL: ${this.profile.kochLevel || 2}`, {
      fontFamily: 'monospace', fontSize: '16px', fill: '#00aa00'
    }).setOrigin(0.5, 0.5);

    // WYŚWIETLANIE RANGI, ZNAKÓW ORAZ MINUT
    const totalHits = this.profile.lifetimeHits || 0;
    const totalMinutes = Math.floor((this.profile.totalPlayTimeMs || 0) / 60000);

    let rank = "REKRUT";
    if (totalHits >= 100) rank = "SZEREGOWY";
    if (totalHits >= 200) rank = "KAPRAL";
    if (totalHits >= 500) rank = "SIERŻANT";
    if (totalHits >= 1000) rank = "PORUCZNIK";
    if (totalHits >= 1500) rank = "KAPITAN";
    if (totalHits >= 2000) rank = "MAJOR";
    if (totalHits >= 3000) rank = "PUŁKOWNIK";
    
    if (totalHits >= 4000) {
      const rankLevel = Math.floor((totalHits - 3000) / 1000);
      const eliteRanks = ['GENERAŁ', 'MARSZAŁEK', 'WETERAN CW', 'MISTRZ KLUCZA', 'LEGENDA ETERU', 'BÓG TELEGRAFU'];
      rank = eliteRanks[Math.min(rankLevel - 1, eliteRanks.length - 1)];
    }

    this.add.text(width / 2, height - 35, `[ RANGA: ${rank} | ZNAKI: ${totalHits} | WYLATANE: ${totalMinutes} MIN ]`, {
      fontFamily: 'monospace', fontSize: '15px', fill: '#00ff00', backgroundColor: '#001100', padding: { x: 8, y: 4 }
    }).setOrigin(0.5, 0.5);
  }

  createButton(x, y, label, callback) {
    const btn = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '22px', fill: '#00ff00'
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

    // Zapisujemy oryginalną pozycję bazową
    const originalX = x;

    btn.on('pointerover', () => {
      this.playHoverSound();
      
      // Czyścimy ewentualne stare animacje, aby uniknąć konfliktów
      if (btn.glitchTween) btn.glitchTween.stop();
      this.tweens.killTweensOf(btn);
      
      // Kolor cyjanowy + twardy, magentowy cień z przesunięciem (aberracja chromatyczna)
      btn.setFill('#00ffff');
      btn.setShadow(4, 0, '#ff00ff', 0, false, true); 
      
      // Zmiana znaków terminala [ ] na zbrojne > <
      btn.setText(label.replace('[', '>').replace(']', '<'));

      // Efekt szarpanego zakłócenia (Glitch)
      // Używamy addCounter, by manualnie aktualizować właściwości co ułamek sekundy
      btn.glitchTween = this.tweens.addCounter({
        from: 0, 
        to: 1, 
        duration: 60, // Bardzo krótki cykl odświeżania
        repeat: -1,   // Nieskończona pętla dopóki trzymasz myszkę
        onUpdate: () => {
          // Szansa na to, że klatka będzie "zepsuta"
          if (Math.random() > 0.3) {
            btn.setX(originalX + Phaser.Math.Between(-10, 10)); // Rozjazd na boki
            btn.setScale(Phaser.Math.FloatBetween(0.85, 1.3), 1); // Przekoszenie wzdłużne
            btn.setAngle(Phaser.Math.Between(-1, 1)); // Minimalny obrót dla "zepsutego sygnału"
          } else {
            // Chwilowy powrót do normy nadaje efekt migotania
            btn.setX(originalX);
            btn.setScale(1, 1);
            btn.setAngle(0);
          }
        }
      });
    });

    btn.on('pointerout', () => {
      // Wyłączamy system glitcha
      if (btn.glitchTween) btn.glitchTween.stop();
      this.tweens.killTweensOf(btn);
      
      // Twardy reset do oryginalnych wartości
      btn.setX(originalX);
      btn.setScale(1, 1);
      btn.setAngle(0);
      
      // Powrót do sterylnego zielonego retro
      btn.setFill('#00ff00');
      btn.setShadow(0, 0, 'transparent', 0);
      btn.setText(label);
    });

    btn.on('pointerdown', () => {
      this.playClickSound();
      
      // Efekt wgniatania przycisku przed startem akcji
      if (btn.glitchTween) btn.glitchTween.stop();
      this.tweens.killTweensOf(btn);
      btn.setX(originalX);
      btn.setAngle(0);

      this.tweens.add({
        targets: btn,
        scaleX: 0.8,
        scaleY: 0.8,
        duration: 50,
        yoyo: true,
        onComplete: () => callback()
      });
    });

    return btn;
  }

  // --- SYNTEZA AUDIO (Web Audio API) ---
  
  playHoverSound() {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    // Krótkie cyfrowe "brzęknięcie"
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.audioCtx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.05);
  }

  playClickSound() {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    // Potwierdzający pisk rosnący w górę
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.1);
  }
}