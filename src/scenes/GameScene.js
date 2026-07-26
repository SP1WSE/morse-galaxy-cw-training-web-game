import Phaser from 'phaser';
import { SCENES, COLORS } from '../config/Constants.js';
import { CWEngine } from '../cw/CWEngine.js';
import { EnemyShip } from '../entities/EnemyShip.js';
import { SaveManager } from '../storage/SaveManager.js';
import { AdaptiveLearner } from '../ai/AdaptiveLearner.js';
import { AchievementManager } from '../meta/AchievementManager.js';
import { ParticleFX } from '../entities/ParticleFX.js';
import { globalEventBus } from '../core/EventBus.js';
import { KOCH_SEQUENCE } from '../ai/KochSequence.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.GAME });
  }

  init(data) {
    this.cwEngine = new CWEngine();
    this.cwEngine.resumeContext();
    
    this.score = 0;
    this.lives = 3;
    this.activeEnemies = [];
    this.isPlayingAudio = false;
    this.sessionStats = { totalHits: 0 };
    
    // Zmienne systemu COMBO
    this.comboCount = 0;
    this.multiplier = 1;
    
    // Odbieramy tryb oraz opcjonalny poziom z menu treningowego
    this.gameMode = data && data.mode ? data.mode : 'campaign';
    this.selectedTrainingLevel = data && data.level ? data.level : 5;
    // --- NOWE: Zapisanie czasu startu sesji ---
    this.sessionStartTime = Date.now();
  }

  create() {
    const { width, height } = this.cameras.main;

    this.playerProfile = SaveManager.load();
    this.ai = new AdaptiveLearner(this.playerProfile);
    this.achievements = new AchievementManager(this.playerProfile);
    
    // Konfiguracja puli znaków w zależności od trybu gry
    if (this.gameMode === 'training_numbers') {
      this.customTargetSequence = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', ',', '?', '/'];
    } else if (this.gameMode === 'training_koch') {
      const clampedLevel = Phaser.Math.Clamp(this.selectedTrainingLevel, 2, KOCH_SEQUENCE.length);
      this.customTargetSequence = KOCH_SEQUENCE.slice(0, clampedLevel);
    }

    this.cwEngine.setWPM(
      this.playerProfile.settings.characterWPM, 
      this.playerProfile.settings.overallWPM
    );

    if (this.playerProfile.settings.frequency && this.cwEngine.setFrequency) {
      this.cwEngine.setFrequency(this.playerProfile.settings.frequency);
    }

    ParticleFX.initTextures(this);
    this.createStarfieldTexture(width, height);

    this.bgStarsSlow = this.add.tileSprite(0, 0, width, height, 'starfield').setOrigin(0, 0).setAlpha(0.5);
    this.bgStarsFast = this.add.tileSprite(0, 0, width, height, 'starfield').setOrigin(0, 0).setAlpha(0.8);
    this.bgStarsFast.tileScaleX = 1.5;
    this.bgStarsFast.tileScaleY = 1.5;

    this.cameras.main.postFX.addBloom(0xffffff, 1, 1, 1, 1.2);

    this.defenseLineY = height - 100;
    const defenseLine = this.add.graphics();
    defenseLine.lineStyle(2, COLORS.TERMINAL_GREEN_DIM, 0.5);
    defenseLine.beginPath();
    defenseLine.moveTo(0, this.defenseLineY);
    defenseLine.lineTo(width, this.defenseLineY);
    defenseLine.strokePath();

    this.scoreText = this.add.text(20, 20, `SCORE: 0000`, {
      fontFamily: 'monospace', fontSize: '24px', fill: '#00ff00'
    });
    this.livesText = this.add.text(width - 150, 20, `LIVES: 3`, {
      fontFamily: 'monospace', fontSize: '24px', fill: '#00ff00'
    });
    
    let modeLabel = `KOCH LEVEL: ${this.ai.level}`;
    if (this.gameMode === 'training_numbers') {
      modeLabel = 'NUMBERS & PROSIGNS';
    } else if (this.gameMode === 'training_koch') {
      modeLabel = `TRAINING: LVL ${this.selectedTrainingLevel}`;
    }

    this.levelText = this.add.text(width / 2, 20, modeLabel, {
      fontFamily: 'monospace', fontSize: '24px', fill: '#00ff00'
    }).setOrigin(0.5, 0);

    // --- HUD: Tekst systemu Combo (tylko mnożnik) ---
    this.comboText = this.add.text(width / 2, 55, `COMBO: x1`, {
      fontFamily: 'monospace', fontSize: '20px', fill: '#555555', fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    this.add.text(20, height - 30, '[ESC] ABORT MISSION', {
      fontFamily: 'monospace', fontSize: '16px', fill: '#00aa00'
    });

    let displayChars = '';
    if (this.gameMode === 'training_numbers' || this.gameMode === 'training_koch') {
      displayChars = this.customTargetSequence.join(' ');
    } else {
      displayChars = KOCH_SEQUENCE.slice(0, this.ai.level).join(' ');
    }

    this.activeCharsText = this.add.text(width / 2, height - 50, `[ TARGETS: ${displayChars} ]`, {
      fontFamily: 'monospace', fontSize: '18px', fill: '#00aa00'
    }).setOrigin(0.5, 0.5);

    this.enemyGroup = this.physics.add.group();
    
    this.input.keyboard.on('keydown', this.handleInput, this);
    this.input.keyboard.on('keydown-ESC', this.abortMission, this);

    globalEventBus.on('ACHIEVEMENT_UNLOCKED', this.showAchievementNotification, this);

    this.scheduleNextSpawn();
    this.setupMobileKeyboardInput();
  }

  // --- LOGIKA COMBO ---
  updateCombo(isHit) {
    if (isHit) {
      this.comboCount += 1;
      let newMultiplier = 1;
      let color = '#555555'; // Szary (domyślny)

      // Progi mnożnika i kolory
      if (this.comboCount >= 20) { newMultiplier = 4; color = '#ff00ff'; } // Magenta
      else if (this.comboCount >= 10) { newMultiplier = 3; color = '#ff8800'; } // Pomarańczowy
      else if (this.comboCount >= 5) { newMultiplier = 2; color = '#ffff00'; } // Żółty

      // Jeśli mnożnik właśnie wzrósł, odpal animację
      if (newMultiplier > this.multiplier) {
        this.tweens.add({
          targets: this.comboText,
          scaleX: 1.5, scaleY: 1.5,
          duration: 150,
          yoyo: true,
          ease: 'Power2'
        });
      }

      this.multiplier = newMultiplier;
      this.comboText.setText(`COMBO: x${this.multiplier}`);
      
      // Kolorujemy tekst
      this.comboText.setFill(this.multiplier > 1 ? color : '#aaaaaa');
      
    } else {
      // Pomyłka - resetujemy Combo
      this.comboCount = 0;
      this.multiplier = 1;
      this.comboText.setText(`COMBO: x1`);
      this.comboText.setFill('#555555'); 
      
      // Animacja potrząśnięcia licznikiem przy utracie Combo
      this.tweens.add({
        targets: this.comboText,
        x: this.comboText.x + 10,
        duration: 50,
        yoyo: true,
        repeat: 3
      });
    }
  }

  update() {
    this.bgStarsSlow.tilePositionY -= 0.2;
    this.bgStarsFast.tilePositionY -= 0.8;

    for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
      const enemy = this.activeEnemies[i];
      if (enemy.y >= this.defenseLineY) {
        this.takeDamage();
        enemy.destroy();
        this.activeEnemies.splice(i, 1);
      }
    }
  }

  createStarfieldTexture(width, height) {
    if (!this.textures.exists('starfield')) {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(0xffffff, 1);
      for(let i = 0; i < 200; i++) {
        graphics.fillRect(Math.random() * width, Math.random() * height, 2, 2);
      }
      graphics.generateTexture('starfield', width, height);
    }
  }

  scheduleNextSpawn() {
    const currentDelay = 2000; 
    
    this.spawnTimer = this.time.delayedCall(currentDelay, () => {
      this.spawnEnemy();
      this.scheduleNextSpawn(); 
    });
  }

  async spawnEnemy() {
    let targetChar;

    if (this.gameMode === 'training_numbers' || this.gameMode === 'training_koch') {
      const randomIndex = Phaser.Math.Between(0, this.customTargetSequence.length - 1);
      targetChar = this.customTargetSequence[randomIndex];
    } else {
      targetChar = this.ai.getNextCharacter();
    }

    const xPos = Phaser.Math.Between(100, this.cameras.main.width - 100);
    
    const enemy = new EnemyShip(this, xPos, -50, targetChar);
    enemy.spawnTime = Date.now();
    
    this.enemyGroup.add(enemy);
    
    const fixedSpeed = Number(this.playerProfile.settings.baseGameSpeed) || 100;
    enemy.body.setVelocityY(fixedSpeed); 
    
    this.activeEnemies.push(enemy);

    if (!this.isPlayingAudio) {
      this.playOldestEnemyCode();
    }
  }

  async playOldestEnemyCode() {
    if (this.activeEnemies.length === 0) return;
    this.isPlayingAudio = true;
    const target = this.activeEnemies[0];
    
    try {
      await this.cwEngine.playCharacter(target.targetCharacter);
    } catch (e) {
      console.error(e);
    } finally {
      this.isPlayingAudio = false;
    }
  }

  handleInput(event) {
    const key = event.key.toUpperCase();
    if (!/^[A-Z0-9.\/,?]$/.test(key)) return;

    if (this.activeEnemies.length > 0) {
      const targetEnemy = this.activeEnemies[0];
      const reactionTime = Date.now() - targetEnemy.spawnTime;

      if (key === targetEnemy.targetCharacter) {
        // --- SUKCES ---
        this.updateCombo(true); 
        
        this.score += (100 * this.multiplier);
        
        this.sessionStats.totalHits += 1; 
        this.scoreText.setText(`SCORE: ${this.score.toString().padStart(4, '0')}`);
        
        ParticleFX.createExplosion(this, targetEnemy.x, targetEnemy.y);
        
        const isTraining = (this.gameMode === 'training_numbers' || this.gameMode === 'training_koch');
        
        if (!isTraining) {
          const oldLevel = this.ai.level;
          this.ai.recordAttempt(key, reactionTime, true);
          
          if (this.ai.level > oldLevel) {
            const newChar = KOCH_SEQUENCE[this.ai.level - 1] || '';
            this.showLevelUpBanner(this.ai.level, newChar);
          }

          this.updateLevelHUD();
          this.achievements.checkAchievements(this.sessionStats, this.ai.level);
        }

        targetEnemy.destroyShip();
        this.activeEnemies.shift();

        if (this.activeEnemies.length > 0) this.playOldestEnemyCode();
      } else {
        // --- BŁĄD ---
        this.cameras.main.shake(100, 0.005);
        this.sessionStats.totalErrors = (this.sessionStats.totalErrors || 0) + 1;
        
        this.updateCombo(false);

        const isTraining = (this.gameMode === 'training_numbers' || this.gameMode === 'training_koch');
        if (!isTraining) {
          this.ai.recordAttempt(targetEnemy.targetCharacter, reactionTime, false);
        }
      }
    }
  }

  showLevelUpBanner(level, newChar) {
    const { width, height } = this.cameras.main;

    const bannerBg = this.add.rectangle(width / 2, height / 2, width, 120, 0x000000, 0.9).setOrigin(0.5, 0.5);
    
    const bannerText = this.add.text(width / 2, height / 2 - 20, `NEXT LEVEL: ${level}`, {
      fontFamily: 'monospace', fontSize: '36px', fill: '#00ff00', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5, 0.5);

    const subText = this.add.text(width / 2, height / 2 + 25, `NEW CHARACTER UNLOCKED: [ ${newChar} ]`, {
      fontFamily: 'monospace', fontSize: '20px', fill: '#ffffff', align: 'center'
    }).setOrigin(0.5, 0.5);

    bannerBg.setScale(1, 0);
    bannerText.setAlpha(0);
    subText.setAlpha(0);

    this.tweens.add({
      targets: bannerBg,
      scaleY: 1,
      duration: 250,
      ease: 'Back.out',
      onComplete: () => {
        this.tweens.add({
          targets: [bannerText, subText],
          alpha: 1,
          duration: 200
        });
      }
    });

    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: [bannerText, subText],
        alpha: 0,
        duration: 200,
        onComplete: () => {
          this.tweens.add({
            targets: bannerBg,
            scaleY: 0,
            duration: 250,
            onComplete: () => {
              bannerBg.destroy();
              bannerText.destroy();
              subText.destroy();
            }
          });
        }
      });
    });
  }

  setupMobileKeyboardInput() {
    let hiddenInput = document.getElementById('mobile-keyboard-fix');
    if (!hiddenInput) {
      hiddenInput = document.createElement('input');
      hiddenInput.id = 'mobile-keyboard-fix';
      hiddenInput.type = 'text';
      hiddenInput.style.position = 'absolute';
      hiddenInput.style.opacity = '0';
      hiddenInput.style.pointerEvents = 'none';
      hiddenInput.style.fontSize = '16px';
      document.body.appendChild(hiddenInput);
    }

    this.input.on('pointerdown', () => {
      hiddenInput.focus();
    });

    hiddenInput.oninput = (e) => {
      const char = e.target.value.slice(-1).toUpperCase();
      hiddenInput.value = '';

      if (char) {
        this.handleInput({ key: char });
      }
    };

    setTimeout(() => {
      hiddenInput.focus();
    }, 300);
  }

  showAchievementNotification(achievement) {
    const { width, height } = this.cameras.main;
    const popup = this.add.text(width / 2, height - 80, `ACHIEVEMENT UNLOCKED:\n${achievement.title}`, {
      fontFamily: 'monospace', fontSize: '20px', fill: '#000000', backgroundColor: '#00ff00',
      align: 'center', padding: { x: 10, y: 10 }
    }).setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: popup,
      y: height - 130,
      alpha: 0,
      duration: 3000,
      ease: 'Power2',
      onComplete: () => popup.destroy()
    });
  }

  saveProgress() {
    const isTraining = (this.gameMode === 'training_numbers' || this.gameMode === 'training_koch');
    
    if (!isTraining) {
      this.playerProfile.kochLevel = this.ai.level;
      this.playerProfile.stats = this.ai.exportState().stats;
    }
    
    if (this.score > (this.playerProfile.highScore || 0)) {
      this.playerProfile.highScore = this.score;
    }
    
 // --- NOWE: Obliczanie i zapisywanie czasu gry ---
    const now = Date.now();
    const playedMs = now - this.sessionStartTime;
    this.playerProfile.totalPlayTimeMs = (this.playerProfile.totalPlayTimeMs || 0) + playedMs;
    this.sessionStartTime = now; // Resetujemy stoper, żeby nie naliczyć podwójnie
    
    
    SaveManager.save(this.playerProfile);
  }

  updateLevelHUD() {
    const isTraining = (this.gameMode === 'training_numbers' || this.gameMode === 'training_koch');
    if (!isTraining && this.levelText.text !== `KOCH LEVEL: ${this.ai.level}`) {
      this.levelText.setText(`KOCH LEVEL: ${this.ai.level}`);
      const currentChars = KOCH_SEQUENCE.slice(0, this.ai.level).join(' ');
      this.activeCharsText.setText(`[ TARGETS: ${currentChars} ]`);
      this.saveProgress();
    }
  }

  takeDamage() {
    this.lives -= 1;
    this.livesText.setText(`LIVES: ${this.lives}`);
    this.cameras.main.shake(200, 0.01);
    this.cameras.main.flash(200, 255, 0, 0);
    
    this.updateCombo(false);

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      for (const enemy of this.activeEnemies) {
        if (enemy && enemy.destroy) {
          enemy.destroy();
        }
      }
      this.activeEnemies = [];
      
      this.isPlayingAudio = false;

      if (this.spawnTimer) {
        this.spawnTimer.remove();
      }
      this.scheduleNextSpawn();

      this.spawnEnemy();
    }
  }

  abortMission() {
    this.saveProgress();
    this.physics.pause();
    if (this.spawnTimer) this.spawnTimer.remove();
    this.input.keyboard.off('keydown');
    this.input.keyboard.off('keydown-ESC');
    this.scene.start(SCENES.MENU);
  }

  gameOver() {
    globalEventBus.off('ACHIEVEMENT_UNLOCKED', this.showAchievementNotification, this);
    
    this.saveProgress();
    
    this.physics.pause();
    if (this.spawnTimer) this.spawnTimer.remove();
    this.input.keyboard.off('keydown');
    this.input.keyboard.off('keydown-ESC');

    const { width, height } = this.cameras.main;
    this.add.text(width / 2, height / 2, 'GAME OVER', {
      fontFamily: 'monospace', fontSize: '64px', fill: '#ff0000', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    this.time.delayedCall(3000, () => {
      this.scene.start(SCENES.MENU);
    });
  }
}