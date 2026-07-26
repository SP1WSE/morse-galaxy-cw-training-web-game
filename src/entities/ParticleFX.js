/**
 * @module ParticleFX
 * @description Definiuje wizualne efekty cząsteczkowe (eksplozje, smugi).
 */
export class ParticleFX {
  /**
   * Tworzy teksturę dla cząsteczek w pamięci, jeśli jeszcze nie istnieje.
   * @param {Phaser.Scene} scene 
   */
  static initTextures(scene) {
    if (!scene.textures.exists('particle_pixel')) {
      const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(0x00ff00, 1);
      graphics.fillRect(0, 0, 4, 4);
      graphics.generateTexture('particle_pixel', 4, 4);
    }
  }

  /**
   * Generuje efekt eksplozji zniszczonego statku.
   * @param {Phaser.Scene} scene 
   * @param {number} x 
   * @param {number} y 
   */
  static createExplosion(scene, x, y) {
    const emitter = scene.add.particles(x, y, 'particle_pixel', {
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 600,
      quantity: 30,
      tint: [0x00ff00, 0xffffff],
      emitting: false
    });

    emitter.explode();

    // Sprzątanie pamięci po zakończeniu efektu
    scene.time.delayedCall(1000, () => {
      emitter.destroy();
    });
  }
}