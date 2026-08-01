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
    
    // Kontekst audio dla efektów dźwiękowych (SFX)
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.sfxCtx = new AudioContext();
    
    this.score = 0;
    this.lives = 3;
    this.activeEnemies = [];
    this.isPlayingAudio = false;
    this.isPaused = false;
    
    this.sessionStats = { totalHits: 0, totalErrors: 0, totalReactionTime: 0 };
    
    this.comboCount = 0;
    this.multiplier = 1;
    this.sessionMistakes = 0;
    
    this.gameMode = data && data.mode ? data.mode : 'campaign';
    this.selectedTrainingLevel = data && data.level ? data.level : 5;
    
    const now = Date.now();
    this.sessionStartTime = now;
    this.lastSaveTime = now;
    
    this.totalPauseTime = 0;
    this.pauseStartTime = 0;

    // --- ZMIENNE BOSSA ---
    this.bossWords = [
      'QRT','QSB','QTH','QRQ','QRS','QRL','QRP','QSY','QRM','QRN',
      'QRO','QRV','QRX','QRZ','DE','KN','RR','RRR','TNX','TU',
      'FB','GA','GM','GE','CU','FER','HW?','OP','73','88','44',
      'GL','VY','RST','5NN','SK','DR','OM','UR','NAME','CALL',
      'CQ','POTA','SOTA','TEST','DX','SP1','5W','NR','AGN',
      '599','BK','EFHW','ANDY','TOM','817','AR','AS','CL','CFM',
      'MSG','TEMP','PWR','MNI','HV','NIL','TKS','CUL','CUAGN',
      'GB','GD','HPE','QTC','EXCH','SER','RUN','SNP','PARK',
      'REF','ACT','HUNTER','SPOT','LOG','WWFF','SPFF','579','589',
      '559','123','SN','SQ','DL','OK','OM','OE','SM','LA',
      'OH','PA','CT','LZ','M0ABC','EA5AAA','F4XYZ','N7DR','SP1WSE',
      'HR','NW','ABT','B4','XCVR','SIGS'     
    ];
    this.bossProgress = 0; 
    this.bossThreshold = 5000; 
    
    this.bossPhase = false; 
    this.isBossActive = false; 
  }

  create() {
    const { width, height } = this.cameras.main;

    this.playerProfile = SaveManager.load();
    this.ai = new AdaptiveLearner(this.playerProfile);
    this.achievements = new AchievementManager(this.playerProfile);
    
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

    this.comboText = this.add.text(width / 2, 55, `COMBO: x1`, {
      fontFamily: 'monospace', fontSize: '20px', fill: '#555555', fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    this.add.text(20, height - 30, '[ESC] PAUSE / STATS', {
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

    // --- EKRAN PAUZY / STATYSTYK ---
    this.pauseContainer = this.add.container(0, 0);
    this.pauseContainer.setDepth(100);
    
    this.pauseContainer.add(this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9).setOrigin(0.5, 0.5));
    
    this.pauseContainer.add(this.add.text(width / 2, height / 2 - 120, 'PAUSED', {
      fontFamily: 'monospace', fontSize: '48px', fill: '#ffff00', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5));

    this.pauseStatsText = this.add.text(width / 2, height / 2, '', {
      fontFamily: 'monospace', fontSize: '24px', fill: '#00ff00', align: 'left', lineSpacing: 10
    }).setOrigin(0.5, 0.5);
    this.pauseContainer.add(this.pauseStatsText);

    const endMissionBtn = this.add.text(width / 2, height / 2 + 120, '[ END MISSION & BACK TO MAIN MENU ]', {
      fontFamily: 'monospace', fontSize: '24px', fill: '#ffffff'
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

    endMissionBtn.on('pointerover', () => endMissionBtn.setFill('#ff0000'));
    endMissionBtn.on('pointerout', () => endMissionBtn.setFill('#ffffff'));
    endMissionBtn.on('pointerdown', () => this.exitToMenu());
    
    this.pauseContainer.add(endMissionBtn);
    this.pauseContainer.setVisible(false);

    this.enemyGroup = this.physics.add.group();
    
    this.input.keyboard.on('keydown', this.handleInput, this);
    this.input.keyboard.on('keydown-ESC', this.togglePause, this);

    globalEventBus.on('ACHIEVEMENT_UNLOCKED', this.showAchievementNotification, this);

    this.scheduleNextSpawn();
    this.setupMobileKeyboardInput();
  }

  // --- NOWY LEJEK DLA DŹWIĘKÓW (ZAPOBIEGA NAKŁADANIU) ---
  requestAudioPlay() {
    // UWAGA: Usunięto z tego miejsca wczesne porzucanie żądania (if isPlayingAudio return),
    // ponieważ zablokowane żądanie w fazie Bossa nigdy by nie wróciło.
    
    if (this.isPaused || this.activeEnemies.length === 0) return;
    
    if (this.audioDebounceTimer) {
      this.audioDebounceTimer.remove();
    }
    
    this.audioDebounceTimer = this.time.delayedCall(50, () => {
      // Jeśli inne audio nadal gra (np. trwa blokada 200ms po wcześniejszym trafieniu),
      // nie porzucamy żądania w niepamięć, tylko zlecamy ponowne sprawdzenie.
      if (this.isPlayingAudio) {
        this.requestAudioPlay();
        return;
      }
      
      // Jeśli kanał jest wolny, puszczamy kod Morse'a
      if (!this.isPaused && this.activeEnemies.length > 0) {
        this.playOldestEnemyCode();
      }
    });
  }
  playExplosionSound() {
    if (!this.sfxCtx) return;
    if (this.sfxCtx.state === 'suspended') this.sfxCtx.resume();

    const bufferSize = this.sfxCtx.sampleRate * 0.3; 
    const buffer = this.sfxCtx.createBuffer(1, bufferSize, this.sfxCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; 
    }

    const noiseSource = this.sfxCtx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = this.sfxCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, this.sfxCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.sfxCtx.currentTime + 0.2);

    const gainNode = this.sfxCtx.createGain();
    gainNode.gain.setValueAtTime(0.3, this.sfxCtx.currentTime); 
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.sfxCtx.currentTime + 0.3);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.sfxCtx.destination);

    noiseSource.start();
  }

  togglePause() {
    if (this.lives <= 0 || this.scene.isSleeping()) return;

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.pauseStartTime = Date.now();
      this.physics.pause();
      if (this.spawnTimer) this.spawnTimer.paused = true;
      
      if (this.activeEnemies.length > 0 && this.activeEnemies[0].isBoss && this.activeEnemies[0].bossAudioTimer) {
        this.activeEnemies[0].bossAudioTimer.paused = true;
      }
      if (this.audioDebounceTimer) this.audioDebounceTimer.paused = true;
      
      const activeSessionMs = Date.now() - this.sessionStartTime - this.totalPauseTime;
      const minutes = Math.floor(activeSessionMs / 60000);
      const seconds = Math.floor((activeSessionMs % 60000) / 1000);

      // Obliczanie procentu poprawnych odpowiedzi
      const totalAttempts = this.sessionStats.totalHits + this.sessionMistakes;
      const accuracy = totalAttempts > 0 ? Math.round((this.sessionStats.totalHits / totalAttempts) * 100) : 0;

      // NOWE: Obliczanie średniego czasu reakcji
      const avgReaction = this.sessionStats.totalHits > 0 
        ? Math.round(this.sessionStats.totalReactionTime / this.sessionStats.totalHits) 
        : 0;

      // Zaktualizowany tekst pauzy
      this.pauseStatsText.setText(
        `WYNIK      : ${this.score}\n` +
        `CZAS SESJI : ${minutes} min ${seconds} sek\n` +
        `REAKCJA    : ${avgReaction} ms\n` +
        `TRAFIONE   : ${this.sessionStats.totalHits}\n` +
        `POMYŁKI    : ${this.sessionMistakes}\n` +
        `CELNOŚĆ    : ${accuracy}%`
      );

      this.pauseContainer.setVisible(true);
    } else {
      this.totalPauseTime += (Date.now() - this.pauseStartTime);
      this.pauseContainer.setVisible(false);
      
      this.physics.resume();
      if (this.spawnTimer) this.spawnTimer.paused = false;
      if (this.audioDebounceTimer) this.audioDebounceTimer.paused = false;
      
      if (this.activeEnemies.length > 0) {
        const target = this.activeEnemies[0];
        if (target.isBoss && target.bossAudioTimer) {
          target.bossAudioTimer.paused = false;
        } else {
          this.requestAudioPlay();
        }
      }
    }
  }

  updateCombo(isHit) {
    if (isHit) {
      this.comboCount += 1;
      let newMultiplier = 1;
      let color = '#555555'; 

      if (this.comboCount >= 20) { newMultiplier = 4; color = '#ff00ff'; } 
      else if (this.comboCount >= 10) { newMultiplier = 3; color = '#ff8800'; } 
      else if (this.comboCount >= 5) { newMultiplier = 2; color = '#ffff00'; } 

      if (newMultiplier > this.multiplier) {
        this.tweens.add({ targets: this.comboText, scaleX: 1.5, scaleY: 1.5, duration: 150, yoyo: true, ease: 'Power2' });
      }

      this.multiplier = newMultiplier;
      this.comboText.setText(`COMBO: x${this.multiplier}`);
      this.comboText.setFill(this.multiplier > 1 ? color : '#aaaaaa');
    } else {
      this.sessionMistakes += 1;
      this.comboCount = 0;
      this.multiplier = 1;
      this.comboText.setText(`COMBO: x1`);
      this.comboText.setFill('#555555'); 
      this.tweens.add({ targets: this.comboText, x: this.comboText.x + 10, duration: 50, yoyo: true, repeat: 3 });
    }
  }

  update() {
    if (this.isPaused) return;

    this.bgStarsSlow.tilePositionY -= 0.2;
    this.bgStarsFast.tilePositionY -= 0.8;

    for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
      const enemy = this.activeEnemies[i];
      
      if (enemy.isBoss && enemy.bossTextObj) {
        enemy.bossTextObj.x = enemy.x;
        enemy.bossTextObj.y = enemy.y - 45;
      }

      if (enemy.y >= this.defenseLineY) {
        if (enemy.isBoss) {
          if (enemy.bossAudioTimer) enemy.bossAudioTimer.remove();
          if (enemy.bossTextObj) enemy.bossTextObj.destroy();
          enemy.destroy();
          this.activeEnemies.splice(i, 1);
          this.endBossPhase();
        } else {
          this.takeDamage();
          enemy.destroy();
          this.activeEnemies.splice(i, 1);
        }
      }
    }

    if (this.bossPhase && !this.isBossActive && this.activeEnemies.length === 0) {
      this.isBossActive = true;
      this.showBossWarningBanner();
      
      this.time.delayedCall(2500, () => {
        if (!this.isPaused) this.spawnBoss();
      });
    }
  }

  createStarfieldTexture(width, height) {
    if (!this.textures.exists('starfield')) {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(0xffffff, 1);
      for(let i = 0; i < 200; i++) graphics.fillRect(Math.random() * width, Math.random() * height, 2, 2);
      graphics.generateTexture('starfield', width, height);
    }
  }

  scheduleNextSpawn() {
    if (this.bossPhase || this.isBossActive) return;

    const currentDelay = 2000; 
    this.spawnTimer = this.time.delayedCall(currentDelay, () => {
      this.spawnEnemy();
      this.scheduleNextSpawn(); 
    });

    if (this.isPaused) {
      this.spawnTimer.paused = true;
    }
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

    // Zamiast bezwarunkowo grać kod, wysyłamy zapytanie do bufora (który przepuści to dalej tylko jeśli nic nie gra)
    this.requestAudioPlay();
  }

  // --- LOGIKA BOSSA ---
  showBossWarningBanner() {
    const { width, height } = this.cameras.main;
    const banner = this.add.text(width / 2, height / 2, "⚠ UNKNOWN SIGNAL DETECTED ⚠", {
      fontFamily: 'monospace', fontSize: '32px', fill: '#ff00ff', fontStyle: 'bold', backgroundColor: '#220022', padding: { x: 20, y: 20 }
    }).setOrigin(0.5, 0.5);
    
    this.tweens.add({
      targets: banner,
      alpha: 0,
      duration: 400,
      yoyo: true,
      repeat: 3,
      onComplete: () => banner.destroy()
    });
  }

  spawnBoss() {
    const word = Phaser.Math.RND.pick(this.bossWords);
    const xPos = Phaser.Math.Between(150, this.cameras.main.width - 150);
    
    const boss = new EnemyShip(this, xPos, -80, word);
    boss.isBoss = true;
    boss.fullWord = word;
    boss.remainingWord = word;
    boss.spawnTime = Date.now();
    boss.setScale(1.5);
    
    this.enemyGroup.add(boss);
    const fixedSpeed = Number(this.playerProfile.settings.baseGameSpeed) || 100;
    boss.body.setVelocityY(fixedSpeed * 0.4); 
    
    this.activeEnemies.push(boss);
    
    const dots = '.'.repeat(word.length);
    boss.bossTextObj = this.add.text(xPos, -125, dots, {
      fontFamily: 'monospace', fontSize: '36px', fill: '#ff00ff', fontStyle: 'bold', padding: {x: 5, y: 5}
    }).setOrigin(0.5, 0.5);
    boss.bossTextObj.setDepth(50);

    this.requestAudioPlay();
  }

  endBossPhase() {
    this.bossPhase = false;
    this.isBossActive = false;
    this.time.delayedCall(2000, () => {
      this.scheduleNextSpawn();
      if (this.activeEnemies.length === 0 && !this.isPaused) {
        this.spawnEnemy();
      }
    });
  }

async playOldestEnemyCode() {
    if (this.activeEnemies.length === 0 || this.isPaused) return;
    if (this.isPlayingAudio) return; 
    
    const target = this.activeEnemies[0];
    
    // --- NOWY WARUNEK ZAPOBIEGAJĄCY PODWÓJNEMU ODTWARZANIU ---
    // Jeśli statek już raz się odezwał (i nie jest Bossem), ignorujemy żądanie.
    if (target.hasPlayedAudio && !target.isBoss) {
      return;
    }
    // Zaznaczamy, że ten statek właśnie został obsłużony
    target.hasPlayedAudio = true;
    
    this.isPlayingAudio = true;
    
    try {
      if (target.isBoss) {
        for (let i = 0; i < target.fullWord.length; i++) {
          if (this.isPaused || !this.activeEnemies.includes(target)) break; 
          await this.cwEngine.playCharacter(target.fullWord[i]);
          if (i < target.fullWord.length - 1) {
            await new Promise(res => setTimeout(res, 150)); 
          }
        }
      } else {
        await this.cwEngine.playCharacter(target.targetCharacter);
        
        // Zapisujemy dokładny moment zakończenia nadawania litery (do wyliczania czasu reakcji)
        target.audioEndTime = Date.now();
      }
    } catch (e) {
      console.error(e);
    } finally {
      // Miękka blokada – trzymamy zamek jeszcze przez ułamek sekundy po zakończeniu, 
      // żeby absolutnie wykluczyć szybkie API z nakładaniem się obwiedni w Web Audio API.
      this.time.delayedCall(200, () => {
         this.isPlayingAudio = false;
      });

      // PĘTLA DŹWIĘKOWA BOSSA CO 3 SEKUNDY
      if (target.isBoss && this.activeEnemies.includes(target)) {
        if (target.bossAudioTimer) target.bossAudioTimer.remove();
        
        target.bossAudioTimer = this.time.delayedCall(3000, () => {
          if (this.activeEnemies.includes(target) && !this.isPaused) {
             this.playOldestEnemyCode();
          }
        });
      }
    }
  }
  
  handleInput(event) {
    if (this.isPaused) return;

    // Blokada anti-spam dla klawiatury fizycznej (przytrzymanie klawisza)
    if (event && event.repeat) return;

    const key = (event.key || '').toUpperCase();
    if (!/^[A-Z0-9.\/,?]$/.test(key)) return;

    // Blokada przed duplikowaniem inputów (np. klawiatura fizyczna uderza razem ze skryptem mobile)
    const now = Date.now();
    if (this.lastInputTime && (now - this.lastInputTime < 60) && this.lastInputKey === key) {
      return; 
    }
    this.lastInputTime = now;
    this.lastInputKey = key;

    if (this.activeEnemies.length === 0) return;

    const firstEnemy = this.activeEnemies[0];

    // --- LOGIKA BOSSA ---
    if (firstEnemy.isBoss) {
      const expectedChar = firstEnemy.remainingWord[0];
      
      if (key === expectedChar) {
        firstEnemy.remainingWord = firstEnemy.remainingWord.substring(1);
        
        firstEnemy.bossTextObj.setText('.'.repeat(firstEnemy.remainingWord.length));
        ParticleFX.createExplosion(this, firstEnemy.x, firstEnemy.y);

        if (firstEnemy.remainingWord.length === 0) {
          if (firstEnemy.bossAudioTimer) firstEnemy.bossAudioTimer.remove();
          
          this.playExplosionSound();
          this.score += 10000;
          
          this.scoreText.setText(`SCORE: ${this.score.toString().padStart(4, '0')}`);
          ParticleFX.createExplosion(this, firstEnemy.x, firstEnemy.y);
          
          if (firstEnemy.bossTextObj) firstEnemy.bossTextObj.destroy();
          if (typeof firstEnemy.destroyShip === 'function') firstEnemy.destroyShip();
          else firstEnemy.destroy();
          
          this.activeEnemies.shift();
          this.endBossPhase();
          
          if (this.activeEnemies.length > 0) this.requestAudioPlay();
        }
      } else {
        this.cameras.main.shake(100, 0.005);
      }
      return; 
    }

    // --- LOGIKA ZWYKŁYCH STATKÓW ---
    let hitIndex = -1;
    let lowestY = -Infinity;
    
    // Szukamy pasującej litery – priorytet ma statek znajdujący się najniżej na ekranie
    for (let i = 0; i < this.activeEnemies.length; i++) {
      if (this.activeEnemies[i].targetCharacter === key) {
        if (this.activeEnemies[i].y > lowestY) {
          lowestY = this.activeEnemies[i].y;
          hitIndex = i;
        }
      }
    }

    if (hitIndex !== -1) {
      // Trafienie prawidlowe - mnożnik rośnie
      const targetEnemy = this.activeEnemies[hitIndex];
      
      // Na to:
      let reactionTime = 0;
      if (targetEnemy.audioEndTime) {
          // Dźwięk się zakończył - liczymy czas od tego momentu
          reactionTime = Date.now() - targetEnemy.audioEndTime;
      } else {
          // Ktoś był tak szybki (albo strzelał w ciemno), że trafił ZANIM dźwięk przestał grać.
          // Wtedy dla zachowania logiki możemy przyjąć bardzo szybki czas bazujący na spawnie, albo np. uznać to za 0.
          reactionTime = Date.now() - targetEnemy.spawnTime; 
      }
      this.sessionStats.totalReactionTime += Math.max(0, reactionTime); // Zabezpieczenie przed wartościami ujemnymi

      this.updateCombo(true); 
      this.playExplosionSound(); 
      
      const earnedPoints = 100 * this.multiplier;
      this.score += earnedPoints;
      this.bossProgress += earnedPoints; 
      
      if (this.bossProgress >= this.bossThreshold && !this.bossPhase) {
        this.bossPhase = true;
        this.bossProgress -= this.bossThreshold; 
        if (this.spawnTimer) this.spawnTimer.remove(); 
      }

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

      if (typeof targetEnemy.destroyShip === 'function') targetEnemy.destroyShip();
      else targetEnemy.destroy();
      
      this.activeEnemies.splice(hitIndex, 1);

      // Jeżeli zestrzeliliśmy "najstarszego", to żądamy puszczenia dźwięku dla nowego najstarszego
      if (hitIndex === 0 && this.activeEnemies.length > 0) {
        this.requestAudioPlay();
      }
    } else {
      // BŁĄD PUDŁO: Wciśnięto przycisk, którego nie ma aktualnie na planszy
      const reactionTime = Date.now() - firstEnemy.spawnTime;
      this.cameras.main.shake(100, 0.005);
      this.sessionStats.totalErrors += 1;
      this.updateCombo(false); // Zerowanie mnożnika

      const isTraining = (this.gameMode === 'training_numbers' || this.gameMode === 'training_koch');
      if (!isTraining) {
        this.ai.recordAttempt(firstEnemy.targetCharacter, reactionTime, false);
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
      targets: bannerBg, scaleY: 1, duration: 250, ease: 'Back.out',
      onComplete: () => { this.tweens.add({ targets: [bannerText, subText], alpha: 1, duration: 200 }); }
    });

    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: [bannerText, subText], alpha: 0, duration: 200,
        onComplete: () => {
          this.tweens.add({
            targets: bannerBg, scaleY: 0, duration: 250,
            onComplete: () => {
              bannerBg.destroy(); bannerText.destroy(); subText.destroy();
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

    this.input.on('pointerdown', () => hiddenInput.focus());

    hiddenInput.oninput = (e) => {
      const char = e.target.value.slice(-1).toUpperCase();
      hiddenInput.value = '';
      if (char) this.handleInput({ key: char });
    };

    setTimeout(() => hiddenInput.focus(), 300);
  }

  showAchievementNotification(achievement) {
    const { width, height } = this.cameras.main;
    const popup = this.add.text(width / 2, height - 80, `ACHIEVEMENT UNLOCKED:\n${achievement.title}`, {
      fontFamily: 'monospace', fontSize: '20px', fill: '#000000', backgroundColor: '#00ff00', align: 'center', padding: { x: 10, y: 10 }
    }).setOrigin(0.5, 0.5);

    this.tweens.add({ targets: popup, y: height - 130, alpha: 0, duration: 3000, ease: 'Power2', onComplete: () => popup.destroy() });
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
    const now = Date.now();
    const playedMs = now - this.lastSaveTime;
    let activePlayTimeSinceLastSave = playedMs;
    if (this.isPaused) {
      activePlayTimeSinceLastSave -= (now - this.pauseStartTime);
    }
    this.playerProfile.totalPlayTimeMs = (this.playerProfile.totalPlayTimeMs || 0) + activePlayTimeSinceLastSave;
    this.lastSaveTime = now;
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

  clearEnemies() {
    for (const enemy of this.activeEnemies) {
      if (enemy.isBoss) {
        if (enemy.bossAudioTimer) enemy.bossAudioTimer.remove();
        if (enemy.bossTextObj) enemy.bossTextObj.destroy();
      }
      if (enemy && enemy.destroy) enemy.destroy();
    }
    this.activeEnemies = [];
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
      this.clearEnemies();
      this.isPlayingAudio = false;

      if (this.spawnTimer) this.spawnTimer.remove();
      
      if (!this.bossPhase && !this.isBossActive) {
        this.scheduleNextSpawn();
        this.spawnEnemy();
      }
    }
  }

  exitToMenu() {
    globalEventBus.off('ACHIEVEMENT_UNLOCKED', this.showAchievementNotification, this);
    if (this.audioDebounceTimer) this.audioDebounceTimer.remove();
    this.saveProgress();
    this.scene.start(SCENES.MENU);
  }

showSummaryScreen(titleText) {
    globalEventBus.off('ACHIEVEMENT_UNLOCKED', this.showAchievementNotification, this);
    this.saveProgress();
    this.physics.pause();
    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.audioDebounceTimer) this.audioDebounceTimer.remove();
    this.input.keyboard.off('keydown');
    this.input.keyboard.off('keydown-ESC');

    const { width, height } = this.cameras.main;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9).setOrigin(0.5, 0.5);
    this.add.text(width / 2, height / 2 - 120, titleText, {
      fontFamily: 'monospace', fontSize: '48px', fill: (titleText === 'GAME OVER' ? '#ff0000' : '#ffff00'), fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    const activeSessionMs = Date.now() - this.sessionStartTime - this.totalPauseTime;
    const minutes = Math.floor(activeSessionMs / 60000);
    const seconds = Math.floor((activeSessionMs % 60000) / 1000);
    
    // Obliczanie procentu poprawnych odpowiedzi
    const totalAttempts = this.sessionStats.totalHits + this.sessionMistakes;
    const accuracy = totalAttempts > 0 ? Math.round((this.sessionStats.totalHits / totalAttempts) * 100) : 0;

// Obliczanie średniego czasu reakcji
    const avgReaction = this.sessionStats.totalHits > 0 
      ? Math.round(this.sessionStats.totalReactionTime / this.sessionStats.totalHits) 
      : 0;

    // Zaktualizowany tekst statystyk
    const statsText = `WYNIK      : ${this.score}\n` +
                      `CZAS SESJI : ${minutes} min ${seconds} sek\n` +
                      `REAKCJA    : ${avgReaction} ms\n` +
                      `TRAFIONE   : ${this.sessionStats.totalHits}\n` +
                      `POMYŁKI    : ${this.sessionMistakes}\n` +
                      `CELNOŚĆ    : ${accuracy}%`;

    this.add.text(width / 2, height / 2, statsText, {
      fontFamily: 'monospace', fontSize: '24px', fill: '#00ff00', align: 'left', lineSpacing: 10
    }).setOrigin(0.5, 0.5);

    const returnBtn = this.add.text(width / 2, height / 2 + 120, '[ POWRÓT DO MENU ]', {
      fontFamily: 'monospace', fontSize: '24px', fill: '#ffffff'
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

    returnBtn.on('pointerover', () => returnBtn.setFill('#00ff00'));
    returnBtn.on('pointerout', () => returnBtn.setFill('#ffffff'));
    returnBtn.on('pointerdown', () => this.scene.start(SCENES.MENU));
  }
  
  gameOver() {
    this.showSummaryScreen('GAME OVER');
  }
}