/**
 * @module EventBus
 * @description Implementacja wzorca Publish-Subscribe (Event Bus).
 * Nie zależy od Phasera, aby ułatwić testowanie i integrację z czystym JS (np. CWEngine).
 */
export class EventBus {
  constructor() {
    /** @type {Map<string, Array<{callback: Function, context: Object|null}>>} */
    this.listeners = new Map();
  }

  /**
   * Rejestruje nasłuchiwacz na dane zdarzenie.
   * @param {string} event - Nazwa zdarzenia.
   * @param {Function} callback - Funkcja wywoływana, gdy zdarzenie wystąpi.
   * @param {Object} [context=null] - Kontekst (this) dla callbacku.
   */
  on(event, callback, context = null) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push({ callback, context });
  }

  /**
   * Wyrejestrowuje nasłuchiwacz.
   * @param {string} event - Nazwa zdarzenia.
   * @param {Function} callback - Funkcja do usunięcia.
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const filtered = callbacks.filter(cbObj => cbObj.callback !== callback);
    
    if (filtered.length === 0) {
      this.listeners.delete(event);
    } else {
      this.listeners.set(event, filtered);
    }
  }

  /**
   * Emituje zdarzenie, wywołując wszystkie zarejestrowane callbacki.
   * @param {string} event - Nazwa zdarzenia.
   * @param {...any} args - Argumenty przekazywane do callbacków.
   */
  emit(event, ...args) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    // POPRAWKA: Użycie "of" zamiast "from"
    for (const { callback, context } of callbacks) {
      if (context) {
        callback.apply(context, args);
      } else {
        callback(...args);
      }
    }
  }

  /**
   * Czyści wszystkie nasłuchiwacze (użyteczne przy restarcie gry).
   */
  clear() {
    this.listeners.clear();
  }
}

// Eksportujemy globalną instancję (Singleton) jako główny punkt komunikacji
export const globalEventBus = new EventBus();