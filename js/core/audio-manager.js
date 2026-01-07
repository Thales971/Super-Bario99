// Áudio v2: Web Audio (sintetizado) + fallback opcional HTMLAudio
// Não depende de arquivos reais para funcionar.

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  class AudioManagerV2 {
    constructor() {
      this.isMuted = false;
      this.audioContext = null;
      this.masterGain = null;

      this.musicEnabled = false;
      this.musicTempo = 120;
      this.musicNextNoteTime = 0;
      this.musicStep = 0;
      this.currentThemeId = 'japan';
      this.baseThemeId = 'japan';
      this.musicMode = 'normal'; // normal | boss | menu
      this.currentVariant = 0; // 0=A, 1=B

      this.muteButton = null;
      this._warnedAutoplay = false;

      // fallback (se você colocar mp3 reais depois)
      this.htmlMusic = null;
    }

    attachUI({ muteButton } = {}) {
      this.muteButton = muteButton || null;
      this._syncMuteButton();
    }

    init() {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
          this.masterGain = this.audioContext.createGain();
          this.masterGain.gain.value = this.isMuted ? 0 : 0.8;
          this.masterGain.connect(this.audioContext.destination);
        }
      }

      // fallback opcional
      try {
        if (!this.htmlMusic) {
          this.htmlMusic = new Audio('assets/audio/theme.mp3');
          this.htmlMusic.loop = true;
          this.htmlMusic.volume = 0.25;
        }
      } catch (_) {
        // ignore
      }
    }

    async resume() {
      if (!this.audioContext) return;
      if (this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
        } catch (e) {
          if (!this._warnedAutoplay) {
            console.log('Audio resume blocked:', e);
            this._warnedAutoplay = true;
          }
        }
      }
    }

    setTheme(themeId) {
      // themeId pode vir como: "japan" | "boss_japan" | "menu"
      this.currentThemeId = themeId;

      if (themeId === 'menu') {
        this.musicMode = 'menu';
        this.baseThemeId = 'menu';
      } else if (String(themeId).startsWith('boss_')) {
        this.musicMode = 'boss';
        this.baseThemeId = String(themeId).slice(5) || 'japan';
      } else {
        this.musicMode = 'normal';
        this.baseThemeId = themeId;
      }

      // Variante A/B muda a cada troca (e faz as músicas parecerem "mais"
      this.currentVariant = (this.currentVariant + 1) % 2;

      // BPM por bloco (efeito “temático”)
      const tempoByTheme = {
        menu: 110,
        japan: 132,
        fruitiger: 118,
        tecnozen: 108,
        dorfic: 92,
        metro: 160,
        evil: 140,
        memefusion: 150
      };

      const base = this.baseThemeId;
      const normalTempo = tempoByTheme[base] || 120;
      this.musicTempo = this.musicMode === 'boss' ? Math.min(190, normalTempo + 26) : normalTempo;
      this.musicNextNoteTime = 0;
      this.musicStep = 0;
    }

    playMusic() {
      if (this.isMuted) return;
      this.musicEnabled = true;
      this.musicNextNoteTime = 0;
      this.musicStep = 0;

      if (this.htmlMusic) {
        try {
          this.htmlMusic.play();
        } catch (_) {
          // ok
        }
      }
    }

    stopMusic() {
      this.musicEnabled = false;
      this.musicNextNoteTime = 0;
      this.musicStep = 0;

      if (this.htmlMusic) {
        try {
          this.htmlMusic.pause();
          this.htmlMusic.currentTime = 0;
        } catch (_) {
          // ignore
        }
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.masterGain) {
        this.masterGain.gain.value = this.isMuted ? 0 : 0.8;
      }
      if (this.isMuted) this.stopMusic();
      else this.playMusic();
      this._syncMuteButton();
    }

    update() {
      if (this.isMuted) return;
      if (!this.musicEnabled) return;
      if (!this.audioContext || !this.masterGain) return;

      const now = this.audioContext.currentTime;
      const secondsPerBeat = 60 / this.musicTempo;
      const scheduleAhead = 0.25;
      if (!this.musicNextNoteTime) this.musicNextNoteTime = now;

      while (this.musicNextNoteTime < now + scheduleAhead) {
        this._scheduleThemeStep(this.currentThemeId, this.musicStep, this.musicNextNoteTime);
        this.musicStep++;
        this.musicNextNoteTime += secondsPerBeat / 2;
      }
    }

    // -------- SFX (personalizados) --------

    playSfx(name) {
      if (this.isMuted) return;
      if (!this.audioContext || !this.masterGain) return;

      const t = this.audioContext.currentTime;
      if (name === 'jump') return this._sfxBoingBell(t);
      if (name === 'coin') return this._sfxMonCoin(t);
      if (name === 'powerup') return this._sfxKawaiiNya(t);
      if (name === 'enemyDie') return this._sfxNinjaShh(t);
      if (name === 'slash') return this._sfxSlash(t);
      if (name === 'bossHit') return this._sfxBossHit(t);
      if (name === 'gameOver') return this._sfxTempleBellSad(t);
    }

    _sfxBoingBell(t) {
      this._tone(392, t, 0.06, 'square', 0.08);
      this._tone(784, t + 0.02, 0.08, 'triangle', 0.06);
      this._tone(1174.66, t + 0.05, 0.12, 'sine', 0.05);
    }

    _sfxMonCoin(t) {
      this._tone(880, t, 0.05, 'triangle', 0.08);
      this._tone(1318.5, t + 0.03, 0.06, 'triangle', 0.06);
      this._tone(1760, t + 0.06, 0.04, 'sine', 0.05);
    }

    _sfxKawaiiNya(t) {
      this._tone(659.25, t, 0.08, 'sine', 0.06);
      this._tone(784, t + 0.05, 0.08, 'sine', 0.05);
      this._tone(987.77, t + 0.10, 0.10, 'sine', 0.04);
    }

    _sfxNinjaShh(t) {
      // "shhh" -> ruído (simulado com saw e envelope curtinho)
      this._tone(220, t, 0.05, 'sawtooth', 0.06);
      this._tone(165, t + 0.02, 0.08, 'sawtooth', 0.04);
    }

    _sfxTempleBellSad(t) {
      this._tone(196, t, 0.18, 'sine', 0.08);
      this._tone(164.81, t + 0.15, 0.25, 'sine', 0.06);
      this._tone(130.81, t + 0.30, 0.35, 'sine', 0.05);
    }

    _sfxSlash(t) {
      // golpe curto/agudo
      this._tone(880, t, 0.04, 'square', 0.05);
      this._tone(1320, t + 0.01, 0.05, 'sawtooth', 0.03);
      this._tone(660, t + 0.02, 0.06, 'triangle', 0.03);
    }

    _sfxBossHit(t) {
      this._tone(110, t, 0.08, 'sine', 0.07);
      this._tone(82.41, t + 0.03, 0.12, 'sawtooth', 0.05);
    }

    // -------- Música por tema (procedural) --------

    _scheduleThemeStep(themeId, step, time) {
      if (this.musicMode === 'menu') return this._musicMenu(step, time);
      if (this.musicMode === 'boss') return this._musicBoss(this.baseThemeId, step, time);

      const base = this.baseThemeId;
      if (base === 'japan') return this._musicJapan(step, time, this.currentVariant);
      if (base === 'fruitiger') return this._musicFruitiger(step, time, this.currentVariant);
      if (base === 'tecnozen') return this._musicTecnoZen(step, time, this.currentVariant);
      if (base === 'dorfic') return this._musicDorfic(step, time, this.currentVariant);
      if (base === 'metro') return this._musicMetro(step, time, this.currentVariant);
      if (base === 'evil') return this._musicEvil(step, time, this.currentVariant);
      if (base === 'memefusion') return this._musicMemeFusion(step, time, this.currentVariant);
      return this._musicJapan(step, time, this.currentVariant);
    }

    _musicMenu(step, time) {
      // loop leve para tela inicial (não compete com o jogo)
      const seq = [261.63, 329.63, 392, 329.63, 293.66, 329.63, 392, 440];
      const f = seq[step % seq.length];
      this._tone(f, time, 0.10, 'triangle', 0.03);
      if (step % 4 === 0) this._tone(f / 2, time, 0.12, 'sine', 0.015);
    }

    _musicBoss(baseThemeId, step, time) {
      // “boss layer”: enfatiza graves + stabs, mas reusa o DNA do tema
      const stab = step % 4 === 0;
      const bassSeq = {
        japan: [110, 110, 146.83, 110, 98, 110, 146.83, 110],
        fruitiger: [130.81, 164.81, 196, 164.81, 146.83, 164.81, 196, 220],
        tecnozen: [92.5, 110, 92.5, 123.47, 92.5, 110, 92.5, 146.83],
        dorfic: [82.41, 98, 110, 98, 73.42, 82.41, 98, 82.41],
        metro: [110, 110, 146.83, 110, 98, 110, 146.83, 110],
        evil: [110, 103.83, 98, 87.31, 98, 103.83, 110, 123.47],
        memefusion: [110, 130.81, 146.83, 164.81, 146.83, 130.81, 110, 98]
      };
      const seq = bassSeq[baseThemeId] || bassSeq.japan;
      const f = seq[step % 8];
      this._tone(f, time, 0.12, 'triangle', 0.05);
      if (stab) this._tone(f * 4, time + 0.01, 0.05, 'square', 0.025);
      if (step % 2 === 1) this._tone(880, time, 0.02, 'square', 0.012);
    }

    _musicJapan(step, time, variant) {
      // pentatônica japonesa (aprox)
      const scale = [
        440, 493.88, 523.25, 659.25, 783.99,
        880, 987.77, 1046.5
      ];
      const idx = (variant === 0
        ? [0, 2, 3, 2, 4, 2, 3, 1]
        : [0, 3, 2, 1, 4, 3, 2, 1]
      )[step % 8];
      const f = scale[idx];
      this._tone(f, time, 0.10, 'triangle', 0.05);
      this._tone(f / 2, time, 0.12, 'sine', 0.02);
    }

    _musicFruitiger(step, time, variant) {
      const chord = [261.63, 329.63, 392];
      const pick = variant === 0 ? chord : [293.66, 369.99, 440];
      const f = pick[step % pick.length] * (step % 4 === 0 ? 2 : 1);
      this._tone(f, time, 0.12, 'sine', 0.04);
      this._tone(f * 2, time + 0.02, 0.06, 'triangle', 0.02);
    }

    _musicTecnoZen(step, time, variant) {
      const seq = variant === 0
        ? [220, 0, 246.94, 0, 277.18, 0, 246.94, 0]
        : [246.94, 0, 277.18, 0, 293.66, 0, 277.18, 0];
      const f = seq[step % seq.length];
      if (!f) return;
      this._tone(f, time, 0.18, 'sine', 0.035);
      this._tone(f * 4, time, 0.04, 'square', 0.01);
    }

    _musicDorfic(step, time, variant) {
      const seq = variant === 0
        ? [196, 220, 246.94, 220, 174.61, 196, 220, 196]
        : [174.61, 196, 220, 246.94, 220, 196, 174.61, 196];
      const f = seq[step % seq.length];
      this._tone(f, time, 0.20, 'sawtooth', 0.03);
      this._tone(f / 2, time, 0.22, 'square', 0.02);
    }

    _musicMetro(step, time, variant) {
      // DnB feel: kick/hat simulado com tons
      const kick = (step % 4 === 0) ? 65.41 : 0;
      if (kick) this._tone(kick, time, 0.06, 'sine', 0.06);
      if (step % 2 === 1) this._tone(880, time, 0.02, 'square', 0.015);
      const bass = (variant === 0
        ? [110, 110, 146.83, 110, 98, 110, 146.83, 110]
        : [98, 110, 123.47, 110, 146.83, 110, 123.47, 110]
      )[step % 8];
      this._tone(bass, time, 0.10, 'triangle', 0.03);
    }

    _musicEvil(step, time, variant) {
      const seq = variant === 0
        ? [220, 207.65, 196, 174.61, 196, 207.65, 220, 246.94]
        : [246.94, 220, 207.65, 196, 174.61, 196, 207.65, 220];
      const f = seq[step % seq.length];
      this._tone(f, time, 0.14, 'sawtooth', 0.045);
      this._tone(f * 2, time + 0.03, 0.06, 'square', 0.02);
    }

    _musicMemeFusion(step, time, variant) {
      // mistura rápida de motivos
      const pick = (step + (variant ? 3 : 0)) % 14;
      if (pick < 4) return this._musicJapan(step, time, variant);
      if (pick < 7) return this._musicFruitiger(step, time, variant);
      if (pick < 10) return this._musicMetro(step, time, variant);
      return this._musicTecnoZen(step, time, variant);
    }

    _tone(freq, startTime, duration, type, gainValue) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    }

    _syncMuteButton() {
      if (!this.muteButton) return;
      this.muteButton.textContent = this.isMuted ? '🔇' : '🔊';
      this.muteButton.setAttribute('aria-pressed', String(this.isMuted));
      this.muteButton.title = this.isMuted ? 'Ativar som' : 'Silenciar';
    }
  }

  SuperBario99.AudioManagerV2 = AudioManagerV2;
})();
