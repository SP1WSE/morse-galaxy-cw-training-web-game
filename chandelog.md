# Changelog - Morse Galaxy v1.0

## [1.0.0] - 2026-07-25 (Milestone Release)
### Added:
- **Stała prędkość statków:** W pełni konfigurowalna z poziomu menu (`Base Game Speed`), niezmienna w trakcie całej rozgrywki (brak sztucznego przyspieszania po osiągnięciu progu punktowego).
- **Stabilny system spawnów:** Czas między pojawianiem się statków został ustabilizowany na stałym interwale (brak nagłego zagęszczania fali wrogów w późniejszym etapie).
- **Zaawansowany tryb treningowy (Training Mode):**
  - Wybór poziomu metody Kocha za pomocą intuicyjnego interfejsu z poziomu menu.
  - Trening cyfr i znaków specjalnych (`Numbers & Prosigns`).
  - Pełna izolacja treningu: punkty, statystyki i poziom trudności liter AI (`AdaptiveLearner`) nie wpływają na główny postęp w kampanii.
- **System Audio (CWEngine):**
  - Prawidłowe generowanie tonów Morse'a przez Web Audio API.
  - Działający suwak częstotliwości tonu w Hz (`Tone Frequency`).
  - Przycisk podglądu dźwięku (`[ ♫ TEST AUDIO SIGNAL ]`) w menu ustawień.
- **Wsparcie urządzeń mobilnych:**
  - Wbudowany niewidoczny input DOM (`mobile-keyboard-fix`) wymuszający wysuwanie klawiatury ekranowej na smartfonach i tabletach po dotknięciu ekranu.
- **Interfejs i Menu:**
  - Płynne efekty najechania myszką na przyciski (skalowanie i rozbłyśnienie).
  - Poprawione hierarchie kontenerów i responsywność elementów podmenu.