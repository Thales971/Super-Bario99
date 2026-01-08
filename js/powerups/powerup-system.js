// Sistema de Power-ups (estilo Mario) - v2
// - Modular (sem ES modules): expõe SuperBario99.PowerupSystem
// - Mantém jogabilidade como prioridade e evita dependências externas.

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const util = SuperBario99.util;

  // Durações em ms (conforme especificação)
  const DURATIONS = {
    fire: 60000,
    ice: 45000,
    ninja: 90000,
    electric: 30000,
    time: 20000,
    cosmic: 15000
  };

  // Cores base por power-up (ícone/engrenagem)
  const COLORS = {
    fire: '#FF3B2F',
    ice: '#00BFFF',
    ninja: '#39FF14',
    electric: '#FFD700',
    time: '#A66BFF',
    oneup: '#FFFFFF',
    cosmic: '#FF00FF'
  };

  class PowerupSystem {
    constructor() {
      this.active = null;        // 'fire'|'ice'|'ninja'|'electric'|'time'|'cosmic'
      this.activeUntil = 0;

      // Ninja: invisibilidade sob demanda
      this.ninjaInvisibleUntil = 0;
      this.ninjaCooldownUntil = 0;

      // Fire: cadência de tiro
      this.fireNextShotAt = 0;

      // Ice: cadência de tiro (mais lento)
      this.iceNextShotAt = 0;
    }

    getColor(type) {
      return COLORS[type] || '#FFFFFF';
    }

    isActive(type, now) {
      if (!this.active || now >= this.activeUntil) return false;
      if (this.active === 'cosmic') return true;
      return this.active === type;
    }

    getActive(now) {
      if (!this.active || now >= this.activeUntil) return null;
      return this.active;
    }

    getRemainingMs(now) {
      const a = this.getActive(now);
      if (!a) return 0;
      return Math.max(0, this.activeUntil - now);
    }

    // Ativa um power-up (substitui o anterior)
    // type: 'fire'|'ice'|'ninja'|'electric'|'time'|'cosmic'|'oneup'
    activate(type, now, player, audio) {
      // 1-UP é instantâneo
      if (type === 'oneup') {
        if (player) player.lives += 1;
        if (audio) audio.playSfx('oneup');
        return;
      }

      this.active = type;
      this.activeUntil = now + (DURATIONS[type] || 15000);

      // reset alguns estados “específicos” para evitar bugs de troca rápida
      if (type !== 'ninja') {
        this.ninjaInvisibleUntil = 0;
        this.ninjaCooldownUntil = 0;
      }
      if (type !== 'fire') {
        this.fireNextShotAt = 0;
      }
      if (type !== 'ice') {
        this.iceNextShotAt = 0;
      }

      if (audio) audio.playSfx(type);
    }

    // Usar power-up ativo (ação manual): atualmente, Ninja invisível.
    // Retorna true se consumiu a ação.
    tryUseActive(now, player, audio) {
      const a = this.getActive(now);
      if (!a) return false;

      const ninjaEnabled = (a === 'ninja' || a === 'cosmic');
      if (!ninjaEnabled) return false;

      if (now < this.ninjaCooldownUntil) return false;

      this.ninjaInvisibleUntil = now + 3000;  // 3s
      this.ninjaCooldownUntil = now + 10000;  // 10s

      if (audio) audio.playSfx('ninjaUse');
      return true;
    }

    isPlayerInvisible(now) {
      return now < this.ninjaInvisibleUntil;
    }

    // Fire: pode atirar?
    canShootFire(now) {
      return this.isActive('fire', now) && now >= this.fireNextShotAt;
    }

    markFireShot(now) {
      this.fireNextShotAt = now + 220; // ~4.5 tiros/s
    }

    canShootIce(now) {
      return this.isActive('ice', now) && now >= this.iceNextShotAt;
    }

    markIceShot(now) {
      this.iceNextShotAt = now + 420;
    }
  }

  SuperBario99.PowerupSystem = PowerupSystem;
})();
