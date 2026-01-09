// js/levels/secret-phase-system.js
// Gerencia estéticas secretas aleatórias com cooldown e persistência.

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const KEY = 'sb99_secret_phase_map_v1';
  const KEY_UNLOCKS = 'sb99_secret_themes_unlocked_v1';

  class SecretPhaseManager {
    constructor() {
      this.secretThemeChance = 0.05; // 5%
      this.cooldown = 10; // 10 fases
      this._map = Object.create(null); // phaseNumber -> themeId
      this._unlocked = ['glitch-aero'];
      this._lastSecretPhase = 0;

      this._load();
    }

    resetRun() {
      this._map = Object.create(null);
      this._lastSecretPhase = 0;
      this._persist();
    }

    // desbloqueios simples por progresso (até o LoreSystem existir)
    unlockByProgress(phaseNumber) {
      const n = Number(phaseNumber);
      if (!Number.isFinite(n)) return;
      if (n >= 30) this.unlockSecretTheme('glitch-aero');
      if (n >= 60) this.unlockSecretTheme('dark-aero');
      if (n >= 75) this.unlockSecretTheme('old-brother-core');
      if (n >= 85) this.unlockSecretTheme('dream-core');
    }

    unlockSecretTheme(themeId) {
      const t = String(themeId || '').toLowerCase();
      if (!t) return false;
      if (!this._unlocked.includes(t)) {
        this._unlocked.push(t);
        this._persistUnlocks();
      }
      return true;
    }

    getRandomUnlockedSecretTheme() {
      if (!this._unlocked.length) return null;
      const idx = Math.floor(Math.random() * this._unlocked.length);
      return this._unlocked[idx] || null;
    }

    // Retorna themeId secreto para a fase atual, se existir.
    // Cria uma decisão nova se:
    // - não existe no mapa
    // - não está em cooldown
    // - passou no roll de chance
    getOrRollSecretTheme(phaseNumber) {
      const n = Number(phaseNumber);
      if (!Number.isFinite(n) || n <= 0) return null;

      // já decidido
      if (this._map[n]) return this._map[n];

      // cooldown
      if ((n - this._lastSecretPhase) < this.cooldown) return null;

      if (Math.random() >= this.secretThemeChance) return null;

      const picked = this.getRandomUnlockedSecretTheme();
      if (!picked) return null;

      this._map[n] = picked;
      this._lastSecretPhase = n;
      this._persist();
      return picked;
    }

    _persist() {
      try {
        localStorage.setItem(KEY, JSON.stringify({ map: this._map, last: this._lastSecretPhase }));
      } catch (_) {}
    }

    _persistUnlocks() {
      try {
        localStorage.setItem(KEY_UNLOCKS, JSON.stringify(this._unlocked));
      } catch (_) {}
    }

    _load() {
      try {
        const rawU = localStorage.getItem(KEY_UNLOCKS);
        if (rawU) {
          const arr = JSON.parse(rawU);
          if (Array.isArray(arr) && arr.length) this._unlocked = arr.map((s) => String(s).toLowerCase()).filter(Boolean);
        }
      } catch (_) {}

      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          if (data.map && typeof data.map === 'object') this._map = data.map;
          if (Number.isFinite(data.last)) this._lastSecretPhase = data.last;
        }
      } catch (_) {}
    }
  }

  SuperBario99.SecretPhaseManager = SecretPhaseManager;
})();
