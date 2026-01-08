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
      this.currentVariant = 0; // 0=A, 1=B, 2=C

      this.muteButton = null;
      this._warnedAutoplay = false;

      // fallback (se você colocar mp3 reais depois)
      this.htmlMusic = null;

      // Ambiência (clima): ruído filtrado em loop
      this._desiredAmbience = { type: 'none', intensity: 0 };
      this._ambienceType = 'none';
      this._ambienceSource = null;
      this._ambienceGain = null;
      this._ambienceFilter = null;
      this._noiseBuffer = null;

      // pause/resume por eventos de visibilidade (mobile)
      this._systemPaused = false;
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

      // aplica ambiência pendente quando o áudio ficar disponível
      try { this._applyDesiredAmbience(); } catch (_) {}

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

      // aplica ambiência pendente após liberar áudio
      try { this._applyDesiredAmbience(); } catch (_) {}
    }

    pauseAll() {
      this._systemPaused = true;

      // WebAudio
      try {
        if (this.audioContext && this.audioContext.state === 'running') {
          this.audioContext.suspend();
        }
      } catch (_) {}

      // HTMLAudio fallback
      try {
        if (this.htmlMusic && !this.htmlMusic.paused) {
          this.htmlMusic.pause();
        }
      } catch (_) {}
    }

    async resumeAll() {
      this._systemPaused = false;
      if (this.isMuted) return;

      try { await this.resume(); } catch (_) {}

      // retoma fallback se a música estiver habilitada
      try {
        if (this.musicEnabled && this.htmlMusic && this.htmlMusic.paused) {
          await this.htmlMusic.play();
        }
      } catch (_) {}
    }

    setAmbience(type, intensity = 0, aestheticId = '') {
      this._desiredAmbience = { type: String(type || 'none'), intensity: Number(intensity) || 0, aestheticId: String(aestheticId || '') };
      this._applyDesiredAmbience();
    }

    _applyDesiredAmbience() {
      if (!this.audioContext || !this.masterGain) return;
      if (this.isMuted) {
        this._stopAmbience();
        return;
      }

      const type = this._desiredAmbience?.type || 'none';
      const intensity = Math.max(0, Math.min(1, this._desiredAmbience?.intensity || 0));

      if (type === this._ambienceType && this._ambienceGain) {
        this._ambienceGain.gain.value = this._ambienceGain.gain.value * 0 + (0.015 + intensity * 0.05);
        return;
      }

      this._stopAmbience();
      if (type === 'none') {
        this._ambienceType = 'none';
        return;
      }

      this._ensureNoiseBuffer();

      const src = this.audioContext.createBufferSource();
      src.buffer = this._noiseBuffer;
      src.loop = true;

      const filter = this.audioContext.createBiquadFilter();
      const gain = this.audioContext.createGain();

      // volumes baixos (ambiente, não música)
      gain.gain.value = 0.015 + intensity * 0.05;

      // perfis simples por clima
      if (type === 'rain') {
        filter.type = 'bandpass';
        filter.frequency.value = 900;
        filter.Q.value = 0.7;
      } else if (type === 'snow') {
        filter.type = 'lowpass';
        filter.frequency.value = 520;
        filter.Q.value = 0.6;
        gain.gain.value *= 0.85;
      } else if (type === 'sand') {
        filter.type = 'bandpass';
        filter.frequency.value = 420;
        filter.Q.value = 0.9;
      } else if (type === 'storm') {
        filter.type = 'lowpass';
        filter.frequency.value = 380;
        filter.Q.value = 0.8;
        gain.gain.value *= 1.05;
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 650;
        filter.Q.value = 0.7;
      }

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      const now = this.audioContext.currentTime;
      try { src.start(now); } catch (_) {}

      this._ambienceType = type;
      this._ambienceSource = src;
      this._ambienceFilter = filter;
      this._ambienceGain = gain;
    }

    _stopAmbience() {
      try { this._ambienceSource?.stop?.(); } catch (_) {}
      try { this._ambienceSource?.disconnect?.(); } catch (_) {}
      try { this._ambienceFilter?.disconnect?.(); } catch (_) {}
      try { this._ambienceGain?.disconnect?.(); } catch (_) {}
      this._ambienceSource = null;
      this._ambienceFilter = null;
      this._ambienceGain = null;
      this._ambienceType = 'none';
    }

    _ensureNoiseBuffer() {
      if (this._noiseBuffer || !this.audioContext) return;
      const sr = this.audioContext.sampleRate;
      const len = Math.floor(sr * 1.0);
      const buf = this.audioContext.createBuffer(1, len, sr);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * 0.65;
      this._noiseBuffer = buf;
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
      this.currentVariant = (this.currentVariant + 1) % 3;

      // Normaliza (aceita themeId antigo e aestheticId novo)
      const normalizeBase = (id) => {
        const s = String(id || 'menu');
        if (s === 'menu') return 'menu';
        if (s === 'japan-retro') return 'japan-retro';
        if (s === 'japan') return 'japan';
        if (s === 'fruitiger') return 'fruitiger-aero';
        if (s === 'fruitiger-aero') return 'fruitiger-aero';
        if (s === 'fruitiger-ocean') return 'fruitiger-ocean';
        if (s === 'fruitiger-sunset') return 'fruitiger-sunset';
        if (s === 'fruitiger-neon') return 'fruitiger-neon';
        if (s === 'fruitiger-forest') return 'fruitiger-forest';
        if (s === 'fruitiger-galaxy') return 'fruitiger-galaxy';
        if (s === 'caos-final') return 'caos-final';
        if (s === 'tecnozen') return 'tecno-zen';
        if (s === 'tecno-zen') return 'tecno-zen';
        if (s === 'dorfic') return 'dorfic';
        if (s === 'metro') return 'metro-aero';
        if (s === 'metro-aero') return 'metro-aero';
        if (s === 'evil') return 'vaporwave';
        if (s === 'memefusion') return 'aurora-aero';
        if (s === 'windows-xp') return 'windows-xp';
        if (s === 'windows-vista') return 'windows-vista';
        if (s === 'vaporwave') return 'vaporwave';
        if (s === 'aurora-aero') return 'aurora-aero';
        return s;
      };

      this.baseThemeId = normalizeBase(this.baseThemeId);

      // BPM por bloco (efeito “temático”)
      const tempoByTheme = {
        menu: 110,
        'japan-retro': 128,
        japan: 132,
        'fruitiger-aero': 118,
        'fruitiger-ocean': 112,
        'fruitiger-sunset': 116,
        'fruitiger-neon': 144,
        'fruitiger-forest': 108,
        'fruitiger-galaxy': 124,
        'caos-final': 150,
        'tecno-zen': 108,
        dorfic: 92,
        'metro-aero': 156,
        vaporwave: 112,
        'aurora-aero': 124,
        'windows-xp': 120,
        'windows-vista': 122
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
      if (name === 'ding') return this._sfxDing(t);
      if (name === 'oneup') return this._sfxOneUp(t);

      // Power-ups (engrenagens)
      if (name === 'fire') return this._sfxFirePower(t);
      if (name === 'ice') return this._sfxIcePower(t);
      if (name === 'ninja') return this._sfxNinjaPower(t);
      if (name === 'electric') return this._sfxElectricPower(t);
      if (name === 'time') return this._sfxTimePower(t);
      if (name === 'cosmic') return this._sfxCosmicPower(t);

      // Ações/impactos
      if (name === 'ninjaUse') return this._sfxNinjaUse(t);
      if (name === 'fireShot') return this._sfxFireShot(t);
      if (name === 'iceFreeze') return this._sfxIceFreeze(t);
      if (name === 'electricZap') return this._sfxElectricZap(t);
      if (name === 'enemyDie') return this._sfxNinjaShh(t);
      if (name === 'hurt') return this._sfxHurt(t);
      if (name === 'slash') return this._sfxSlash(t);
      if (name === 'bossHit') return this._sfxBossHit(t);
      if (name === 'gameOver') return this._sfxTempleBellSad(t);
      if (name === 'thunder') return this._sfxThunder(t);
    }

    _sfxThunder(t) {
      // Rumble grave + "crack" curto (sem estourar volume)
      this._tone(55, t, 0.22, 'sine', 0.08);
      this._tone(44, t + 0.06, 0.30, 'triangle', 0.06);
      this._tone(33, t + 0.12, 0.40, 'sine', 0.05);
      this._tone(880, t + 0.02, 0.05, 'sawtooth', 0.015);
    }

    _sfxHurt(t) {
      // curto, descendente (feedback de dano)
      this._tone(440, t, 0.05, 'triangle', 0.06);
      this._tone(330, t + 0.05, 0.07, 'triangle', 0.05);
      this._tone(220, t + 0.12, 0.08, 'sine', 0.04);
    }

    _sfxDing(t) {
      this._tone(988, t, 0.05, 'triangle', 0.07);
      this._tone(1318.5, t + 0.02, 0.06, 'triangle', 0.05);
    }

    _sfxOneUp(t) {
      this._tone(523.25, t, 0.07, 'square', 0.06);
      this._tone(659.25, t + 0.08, 0.07, 'square', 0.06);
      this._tone(783.99, t + 0.16, 0.09, 'square', 0.06);
    }

    _sfxFirePower(t) {
      this._tone(220, t, 0.06, 'sawtooth', 0.06);
      this._tone(440, t + 0.03, 0.08, 'triangle', 0.05);
      this._tone(880, t + 0.07, 0.06, 'sine', 0.04);
    }

    _sfxIcePower(t) {
      this._tone(784, t, 0.05, 'sine', 0.05);
      this._tone(1174.66, t + 0.03, 0.07, 'sine', 0.04);
      this._tone(1568, t + 0.06, 0.05, 'triangle', 0.03);
    }

    _sfxNinjaPower(t) {
      this._tone(196, t, 0.06, 'sawtooth', 0.05);
      this._tone(392, t + 0.02, 0.08, 'triangle', 0.05);
    }

    _sfxElectricPower(t) {
      this._tone(880, t, 0.03, 'square', 0.05);
      this._tone(1320, t + 0.02, 0.03, 'square', 0.05);
      this._tone(1760, t + 0.04, 0.03, 'square', 0.05);
    }

    _sfxTimePower(t) {
      this._tone(330, t, 0.08, 'triangle', 0.05);
      this._tone(262, t + 0.06, 0.10, 'triangle', 0.04);
      this._tone(196, t + 0.12, 0.12, 'sine', 0.03);
    }

    _sfxCosmicPower(t) {
      this._tone(523.25, t, 0.05, 'sine', 0.05);
      this._tone(659.25, t + 0.03, 0.05, 'sine', 0.05);
      this._tone(783.99, t + 0.06, 0.05, 'sine', 0.05);
      this._tone(1046.5, t + 0.09, 0.08, 'triangle', 0.05);
    }

    _sfxNinjaUse(t) {
      this._tone(392, t, 0.03, 'triangle', 0.04);
      this._tone(196, t + 0.02, 0.06, 'sawtooth', 0.04);
    }

    _sfxFireShot(t) {
      this._tone(880, t, 0.03, 'sawtooth', 0.04);
      this._tone(660, t + 0.01, 0.05, 'triangle', 0.03);
    }

    _sfxIceFreeze(t) {
      this._tone(1174.66, t, 0.03, 'sine', 0.04);
      this._tone(1568, t + 0.02, 0.06, 'triangle', 0.03);
    }

    _sfxElectricZap(t) {
      this._tone(1760, t, 0.02, 'square', 0.05);
      this._tone(1320, t + 0.01, 0.03, 'square', 0.05);
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
      if (base === 'windows-xp') return this._musicWindowsXP(step, time, this.currentVariant);
      if (base === 'windows-vista') return this._musicWindowsVista(step, time, this.currentVariant);
      if (base === 'fruitiger-aero') return this._musicFruitigerAero(step, time, this.currentVariant);
      if (base === 'tecno-zen') return this._musicTecnoZen(step, time, this.currentVariant);
      if (base === 'dorfic') return this._musicDorfic(step, time, this.currentVariant);
      if (base === 'metro-aero') return this._musicMetroAero(step, time, this.currentVariant);
      if (base === 'vaporwave') return this._musicVaporwave(step, time, this.currentVariant);
      if (base === 'aurora-aero') return this._musicAuroraAero(step, time, this.currentVariant);
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
        'windows-xp': [130.81, 146.83, 164.81, 146.83, 123.47, 130.81, 146.83, 164.81],
        'windows-vista': [146.83, 164.81, 196, 174.61, 164.81, 146.83, 130.81, 146.83],
        'fruitiger-aero': [130.81, 164.81, 196, 164.81, 146.83, 164.81, 196, 220],
        'tecno-zen': [92.5, 110, 92.5, 123.47, 92.5, 110, 92.5, 146.83],
        dorfic: [82.41, 98, 110, 98, 73.42, 82.41, 98, 82.41],
        'metro-aero': [110, 110, 146.83, 110, 98, 110, 146.83, 110],
        vaporwave: [98, 110, 123.47, 110, 146.83, 130.81, 123.47, 110],
        'aurora-aero': [110, 123.47, 146.83, 164.81, 146.83, 123.47, 110, 98]
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
        : (variant === 1
          ? [0, 3, 2, 1, 4, 3, 2, 1]
          : [0, 2, 4, 2, 3, 1, 3, 2]
        )
      )[step % 8];
      const f = scale[idx];
      this._tone(f, time, 0.10, 'triangle', 0.05);
      this._tone(f / 2, time, 0.12, 'sine', 0.02);
    }

    _musicWindowsXP(step, time, variant) {
      // "startup / chime" simplificado (major alegre)
      const seqA = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 329.63];
      const seqB = [293.66, 369.99, 440, 587.33, 440, 369.99, 329.63, 369.99];
      const seqC = [329.63, 392, 493.88, 659.25, 493.88, 392, 349.23, 392];
      const seq = (variant === 0) ? seqA : (variant === 1 ? seqB : seqC);
      const f = seq[step % 8];
      this._tone(f, time, 0.10, 'sine', 0.04);
      if (step % 4 === 0) this._tone(f * 2, time + 0.02, 0.06, 'triangle', 0.02);
    }

    _musicWindowsVista(step, time, variant) {
      // "Aero" mais suave e brilhante
      const padA = [220, 246.94, 277.18, 329.63, 277.18, 246.94, 220, 196];
      const padB = [246.94, 277.18, 329.63, 392, 329.63, 277.18, 246.94, 220];
      const padC = [196, 220, 246.94, 293.66, 246.94, 220, 196, 174.61];
      const seq = (variant === 0) ? padA : (variant === 1 ? padB : padC);
      const f = seq[step % 8];
      this._tone(f, time, 0.14, 'triangle', 0.03);
      if (step % 2 === 0) this._tone(f * 2, time + 0.01, 0.06, 'sine', 0.02);
    }

    _musicFruitigerAero(step, time, variant) {
      const chordA = [261.63, 329.63, 392];
      const chordB = [293.66, 369.99, 440];
      const chordC = [329.63, 392, 493.88];
      const pick = (variant === 0) ? chordA : (variant === 1 ? chordB : chordC);
      const f = pick[step % pick.length] * (step % 4 === 0 ? 2 : 1);
      this._tone(f, time, 0.12, 'sine', 0.04);
      this._tone(f * 2, time + 0.02, 0.06, 'triangle', 0.02);
    }

    _musicTecnoZen(step, time, variant) {
      const seq = variant === 0
        ? [220, 0, 246.94, 0, 277.18, 0, 246.94, 0]
        : (variant === 1
          ? [246.94, 0, 277.18, 0, 293.66, 0, 277.18, 0]
          : [277.18, 0, 293.66, 0, 329.63, 0, 293.66, 0]
        );
      const f = seq[step % seq.length];
      if (!f) return;
      this._tone(f, time, 0.18, 'sine', 0.035);
      this._tone(f * 4, time, 0.04, 'square', 0.01);
    }

    _musicDorfic(step, time, variant) {
      const seq = variant === 0
        ? [196, 220, 246.94, 220, 174.61, 196, 220, 196]
        : (variant === 1
          ? [174.61, 196, 220, 246.94, 220, 196, 174.61, 196]
          : [220, 246.94, 293.66, 246.94, 196, 220, 246.94, 220]
        );
      const f = seq[step % seq.length];
      this._tone(f, time, 0.20, 'sawtooth', 0.03);
      this._tone(f / 2, time, 0.22, 'square', 0.02);
    }

    _musicMetroAero(step, time, variant) {
      // DnB feel: kick/hat simulado com tons
      const kick = (step % 4 === 0) ? 65.41 : 0;
      if (kick) this._tone(kick, time, 0.06, 'sine', 0.06);
      if (step % 2 === 1) this._tone(880, time, 0.02, 'square', 0.015);
      const bass = (variant === 0
        ? [110, 110, 146.83, 110, 98, 110, 146.83, 110]
        : (variant === 1
          ? [98, 110, 123.47, 110, 146.83, 110, 123.47, 110]
          : [110, 123.47, 146.83, 164.81, 146.83, 123.47, 110, 98]
        )
      )[step % 8];
      this._tone(bass, time, 0.10, 'triangle', 0.03);
    }

    _musicVaporwave(step, time, variant) {
      // neon lento + pulsos (sine + square suave)
      const seqA = [110, 0, 123.47, 0, 146.83, 0, 123.47, 0];
      const seqB = [98, 0, 110, 0, 130.81, 0, 110, 0];
      const seqC = [130.81, 0, 146.83, 0, 164.81, 0, 146.83, 0];
      const seq = (variant === 0) ? seqA : (variant === 1 ? seqB : seqC);
      const f = seq[step % 8];
      if (!f) return;
      this._tone(f, time, 0.20, 'sine', 0.03);
      if (step % 4 === 0) this._tone(f * 2, time + 0.01, 0.06, 'square', 0.012);
    }

    _musicAuroraAero(step, time, variant) {
      // arpejo espacial brilhante
      const seqA = [261.63, 329.63, 392, 493.88, 392, 329.63, 293.66, 329.63];
      const seqB = [293.66, 392, 493.88, 587.33, 493.88, 392, 329.63, 392];
      const seqC = [220, 293.66, 369.99, 440, 369.99, 293.66, 246.94, 293.66];
      const seq = (variant === 0) ? seqA : (variant === 1 ? seqB : seqC);
      const f = seq[step % 8];
      this._tone(f, time, 0.12, 'triangle', 0.03);
      this._tone(f * 2, time + 0.02, 0.06, 'sine', 0.02);
      if (step % 8 === 0) this._tone(55, time, 0.18, 'sine', 0.02);
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
