/**
 * @module Constants
 * @description Centralny rejestr stałych wartości, kluczy i konfiguracji.
 */

export const SCENES = {
  BOOT: 'BootScene',
  PRELOADER: 'PreloaderScene',
  MENU: 'MenuScene',
  GAME: 'GameScene',
  SETTINGS: 'SettingsScene',
  TRAINING_MENU: 'TrainingMenuScene',
  SUMMARY: 'SUMMARY' // <--- Czy to tam jest?
};

export const EVENTS = {
  GAME_START: 'GAME_START',
  SETTINGS_OPEN: 'SETTINGS_OPEN',
  CW_PLAY_CHAR: 'CW_PLAY_CHAR',
  CW_CHAR_FINISHED: 'CW_CHAR_FINISHED'
};

export const COLORS = {
  TERMINAL_GREEN: 0x00ff00,
  TERMINAL_GREEN_DIM: 0x005500,
  BACKGROUND: 0x000000,
  WARNING_RED: 0xff0000
};