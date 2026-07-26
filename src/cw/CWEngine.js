export class CWEngine {
  constructor() {
    this.audioCtx = null;
    this.characterWPM = 20;
    this.overallWPM = 10;
    this.frequency = 600; // Domyślna częstotliwość w Hz
  }

  // Bezpieczna inicjalizacja kontekstu audio (wymagana po interakcji użytkownika)
  resumeContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setWPM(charWPM, overallWPM) {
    this.characterWPM = charWPM;
    this.overallWPM = overallWPM;
  }

  // Kluczowa metoda pozwalająca zmieniać częstotliwość tonu z poziomu ustawień
  setFrequency(freq) {
    this.frequency = freq;
  }

  // Słownik kodów Morse'a dla liter, cyfr i podstawowych znaków
  getMorseCode(char) {
    const MORSE_MAP = {
      'A': '.-',    'B': '-...',  'C': '-.-.',  'D': '-..',
      'E': '.',     'F': '..-.',  'G': '--.',   'H': '....',
      'I': '..',    'J': '.---',  'K': '-.-',   'L': '.-..',
      'M': '--',    'N': '-.',    'O': '---',   'P': '.--.',
      'Q': '--.-',  'R': '.-.',   'S': '...',   'T': '-',
      'U': '..-',   'V': '...-',  'W': '.--',   'X': '-..-',
      'Y': '-.--',  'Z': '--..',
      '0': '-----', '1': '.----', '2': '..---', '3': '...--',
      '4': '....-', '5': '.....', '6': '-....', '7': '--...',
      '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--',
      '?': '..--..', '/': '-..-.'
    };
    return MORSE_MAP[char.toUpperCase()] || '';
  }

  // Odtwarzanie pojedynczego znaku kodu Morse'a
  async playCharacter(char) {
    this.resumeContext();
    const code = this.getMorseCode(char);
    if (!code) return;

    // Czas trwania kropki (Standard PARIS: dit = 1200 / characterWPM ms)
    const ditDuration = 1200 / this.characterWPM;
    const dahDuration = ditDuration * 3;
    const elementSpace = ditDuration;
    const charSpace = ditDuration * 3;

    for (let i = 0; i < code.length; i++) {
      const symbol = code[i];
      const duration = (symbol === '.') ? ditDuration : dahDuration;

      await this._playTone(duration / 1000);
      
      if (i < code.length - 1) {
        await this._wait(elementSpace / 1000);
      }
    }

    await this._wait(charSpace / 1000);
  }

  // Generowanie pojedynczego tonu audio przez Web Audio API
  _playTone(durationInSeconds) {
    return new Promise((resolve) => {
      if (!this.audioCtx) {
        resolve();
        return;
      }

      const now = this.audioCtx.currentTime;
      
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Używamy aktualnie przypisanej częstotliwości (zmienianej suwakiem w Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(this.frequency, now);

      // Płynny narast i wygaszenie (Envelope), aby uniknąć kliknięć głośnika
      const attack = 0.005;
      const release = 0.005;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + attack);
      gain.gain.setValueAtTime(0.3, now + durationInSeconds - release);
      gain.gain.linearRampToValueAtTime(0, now + durationInSeconds);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + durationInSeconds);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
        resolve();
      };
    });
  }

  // Pomocnicza funkcja oczekiwania (pauza między sygnałami)
  _wait(seconds) {
    return new Promise((resolve) => {
      setTimeout(resolve, seconds * 1000);
    });
  }
}