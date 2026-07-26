import Phaser from 'phaser';
import { COLORS } from '../config/Constants.js';

/**
 * @class EnemyShip
 * @extends Phaser.GameObjects.Text
 * @description Reprezentuje nadlatujący statek kosmiczny (wiadomość).
 * Posiada przypisaną literę, ale jej NIE WYSWIETLA. Zamiast tego ma retro-wygląd.
 */
export class EnemyShip extends Phaser.GameObjects.Text {
  /**
   * @param {Phaser.Scene} scene 
   * @param {number} x 
   * @param {number} y 
   * @param {string} targetChar - Litera, którą nadaje ten statek
   */
  constructor(scene, x, y, targetChar) {
    // Grafika statku w stylu ASCII art
    const shipDesign = '>-{O}-<';
    
    // Zmiana: Dziedziczymy po klasycznym obiekcie Text
    super(scene, x, y, shipDesign, {
      fontFamily: 'monospace',
      fontSize: '28px',
      fill: '#00ff00',
      fontStyle: 'bold',
      shadow: { blur: 5, color: '#00ff00', fill: true }
    });

    this.scene = scene;
    this.targetCharacter = targetChar.toUpperCase();

    // Dodanie obiektu do sceny
    this.scene.add.existing(this);
    
    // Dynamiczne dodanie silnika fizyki do zwykłego obiektu tekstowego
    this.scene.physics.add.existing(this);

    // Konfiguracja punktu centralnego i rozmiaru pola kolizji (hitbox)
    this.setOrigin(0.5, 0.5);
    
    // Upewniamy się, że ciało fizyczne istnieje przed próbą zmiany jego rozmiaru
    if (this.body) {
      this.body.setSize(this.width, this.height);
    }
  }

  /**
   * Nadaje statkowi prędkość opadania w dół ekranu.
   * @param {number} speed 
   */
  startMoving(speed) {
    if (this.body) {
      this.body.setVelocityY(speed);
    }
  }

  /**
   * Wywoływane, gdy gracz wpisze poprawną literę.
   */
  destroyShip() {
    // Prosty efekt eksplozji (zmiana skali, zniknięcie przed usunięciem)
    this.scene.tweens.add({
      targets: this,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        this.destroy();
      }
    });
  }
}