# Morse Galaxy - CW Koch Method Trainer v1.0

## O grze
Morse Galaxy to gra zręcznościowo-edukacyjna oparta na **metodze Kocha** do nauki odbioru kodu Morse'a ze słuchu. Gracz niszczy opadające statki kosmiczne poprzez poprawne rozpoznawanie i wpisywanie nadawanych znaków.

## Główne Funkcje
1. **Kampania adaptacyjna:** Automatyczne zwiększanie poziomu trudności i wprowadzanie nowych liter według sekwencji Kocha na podstawie postępów gracza.
2. **Tryb Treningu:** Pozwala na ćwiczenie konkretnych poziomów Kocha lub sekwencji cyfr bez modyfikowania profilu kampanii.
3. **Pełna personalizacja (System Settings):**
   - Prędkość statków (Base Game Speed)
   - Prędkość znaków (Character WPM)
   - Prędkość ogólna (Overall WPM)
   - Częstotliwość tonu (Tone Frequency w Hz) z opcjoną odsłuchu testowego.
4. **Kompatybilność mobilna:** Pełna obsługa ekranów dotykowych i klawiatur ekranowych na smartfonach.

## Architektura techniczna
- **Silnik:** Phaser 3
- **Audio:** Web Audio API (własny `CWEngine`)
- **Przechowywanie danych:** `localStorage` przez `SaveManager`