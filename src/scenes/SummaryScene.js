import Phaser from 'phaser';
import { SCENES } from '../config/Constants.js';

export class SummaryScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.SUMMARY });
  }

  init(data) {
    this.score = data.score || 0;
    this.gameMode = data.gameMode || 'campaign';
    this.selectedTrainingLevel = data.selectedTrainingLevel || 2;
    this.stats = data.stats || { totalHits: 0, totalErrors: 0, totalMisses: 0, charHits: {}, charMistakes: {} };
  }

  create() {
    const { width, height } = this.cameras.main;

    this.cameras.main.postFX.addBloom(0xffffff, 1, 1, 1, 1.2);

    // Tytuł
    this.add.text(width / 2, height * 0.08, 'MISSION DEBRIEFING', {
      fontFamily: 'monospace', fontSize: '38px', fill: '#00ff00', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    let modeDesc = 'CAMPAIGN MODE';
    if (this.gameMode === 'training_numbers') {
      modeDesc = 'TRAINING: NUMBERS & PROSIGNS';
    } else if (this.gameMode === 'training_koch') {
      modeDesc = `TRAINING: LVL ${this.selectedTrainingLevel}`;
    }

    this.add.text(width / 2, height * 0.14, modeDesc, {
      fontFamily: 'monospace', fontSize: '18px', fill: '#00ffff'
    }).setOrigin(0.5, 0.5);

    // --- PODSUMOWANIE OGÓLNE (Zastąpienie missed przez confused/errors) ---
    const totalActions = this.stats.totalHits + this.stats.totalErrors;
    const accuracy = totalActions > 0 ? Math.round((this.stats.totalHits / totalActions) * 100) : 100;

    const summaryText = `SCORE: ${this.score}  |  HITS: ${this.stats.totalHits}  |  CONFUSED: ${this.stats.totalErrors}  |  ACCURACY: ${accuracy}%`;
    this.add.text(width / 2, height * 0.20, summaryText, {
      fontFamily: 'monospace', fontSize: '16px', fill: '#00ff00'
    }).setOrigin(0.5, 0.5);

    // --- SZCZEGÓŁOWY RAPORT POJEDYNCZYCH ZNAKÓW ---
    this.add.text(50, height * 0.26, 'CHARACTER PERFORMANCE & REACTION TIMES:', {
      fontFamily: 'monospace', fontSize: '16px', fill: '#00aa00'
    });

    let startY = height * 0.31;
    const allChars = new Set([...Object.keys(this.stats.charHits), ...Object.keys(this.stats.charMistakes)]);
    
    if (allChars.size === 0) {
      this.add.text(width / 2, height * 0.45, 'No character data recorded in this session.', {
        fontFamily: 'monospace', fontSize: '16px', fill: '#888888'
      }).setOrigin(0.5, 0.5);
    } else {
      let count = 0;
      for (const char of allChars) {
        if (count >= 7) break; // Ograniczenie do 7 linijek

        const hitData = this.stats.charHits[char] || { count: 0, totalTime: 0 };
        const avgTimeSec = hitData.count > 0 ? (hitData.totalTime / hitData.count / 1000).toFixed(1) + 's' : '-';
        
        // Zbieramy informacje o tym, z czym ten znak był mylony (confused)
        let confusedStr = 'None';
        const mistakes = this.stats.charMistakes[char];
        if (mistakes) {
          confusedStr = Object.entries(mistakes)
            .map(([wrongChar, times]) => `${wrongChar} (${times}x)`)
            .join(', ');
        }

        const line = `[${char}] -> Hits: ${hitData.count} | Avg Time: ${avgTimeSec} | Confused with: ${confusedStr}`;
        
        this.add.text(50, startY, line, {
          fontFamily: 'monospace', fontSize: '15px', fill: '#ffffff'
        });

        startY += 32;
        count++;
      }
    }

    // Przycisk powrotu do Menu
    const returnBtn = this.add.text(width / 2, height * 0.88, '[ RETURN TO MAIN MENU ]', {
      fontFamily: 'monospace', fontSize: '22px', fill: '#00ff00'
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

    returnBtn.on('pointerover', () => {
      returnBtn.setFill('#ffffff');
      this.tweens.add({ targets: returnBtn, scaleX: 1.1, scaleY: 1.1, duration: 100 });
    });

    returnBtn.on('pointerout', () => {
      returnBtn.setFill('#00ff00');
      this.tweens.add({ targets: returnBtn, scaleX: 1.0, scaleY: 1.0, duration: 100 });
    });

    returnBtn.on('pointerdown', () => {
      this.scene.start(SCENES.MENU);
    });

    this.input.keyboard.once('keydown-ENTER', () => { this.scene.start(SCENES.MENU); });
    this.input.keyboard.once('keydown-SPACE', () => { this.scene.start(SCENES.MENU); });
  }
}