class AudioManager {
    constructor() {
        this.isMuted = false;

        // Web Audio
        this.audioContext = null;
        this.masterGain = null;

        // HTMLAudio fallback (opcional)
        this.htmlSounds = {
            jump: null,
            coin: null,
            enemyDie: null,
            gameOver: null
        };
        this.htmlMusic = null;

        // Música sintetizada
        this.musicEnabled = false;
        this.musicTempo = 140; // bpm
        this.nextNoteTime = 0;
        this.noteIndex = 0;
        this.musicPattern = [
            // Sequência simples original (não é tema de Mario)
            440, 0, 523.25, 0, 659.25, 0, 523.25, 0,
            392, 0, 440, 0, 523.25, 0, 659.25, 0
        ];

        // UI
        this.muteButton = null;
        this._warnedAutoplay = false;
    }

    attachUI({ muteButton } = {}) {
        this.muteButton = muteButton || null;
        this._syncMuteButton();
    }

    init() {
        // Deve ser chamado a partir de um gesto do usuário (click)
        if (!this.audioContext) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.audioContext = new AudioCtx();
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.value = this.isMuted ? 0 : 0.7;
                this.masterGain.connect(this.audioContext.destination);
            }
        }

        // Preparar fallback HTMLAudio (pode falhar se placeholders forem vazios)
        this._tryLoadHtmlAudio();
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

    update(dt) {
        // Chamado pelo loop do jogo para agendar música sem setInterval
        if (this.isMuted) return;

        if (this.musicEnabled && this.audioContext && this.masterGain) {
            const now = this.audioContext.currentTime;
            const secondsPerBeat = 60 / this.musicTempo;
            const scheduleAhead = 0.25;

            if (!this.nextNoteTime) {
                this.nextNoteTime = now;
            }

            while (this.nextNoteTime < now + scheduleAhead) {
                const freq = this.musicPattern[this.noteIndex % this.musicPattern.length];
                if (freq && freq > 0) {
                    this._playTone(freq, this.nextNoteTime, 0.09, 'square', 0.06);
                    this._playTone(freq / 2, this.nextNoteTime, 0.09, 'triangle', 0.03);
                }
                this.noteIndex++;
                this.nextNoteTime += secondsPerBeat / 2; // colcheias
            }
        }
    }

    playSound(name) {
        if (this.isMuted) return;

        // Preferir WebAudio (não depende de arquivos)
        if (this.audioContext && this.masterGain) {
            const now = this.audioContext.currentTime;
            switch (name) {
                case 'jump':
                    this._sfxJump(now);
                    return;
                case 'coin':
                    this._sfxCoin(now);
                    return;
                case 'enemyDie':
                    this._sfxEnemyDie(now);
                    return;
                case 'gameOver':
                    this._sfxGameOver(now);
                    return;
                default:
                    break;
            }
        }

        // Fallback HTMLAudio (se existir)
        const audio = this.htmlSounds[name];
        if (!audio) return;
        try {
            audio.currentTime = 0;
            audio.play();
        } catch (e) {
            // Silencioso para não quebrar o jogo
        }
    }

    playMusic() {
        if (this.isMuted) return;

        this.musicEnabled = true;
        this.nextNoteTime = 0;
        this.noteIndex = 0;

        if (this.htmlMusic) {
            try {
                this.htmlMusic.loop = true;
                this.htmlMusic.volume = 0.25;
                this.htmlMusic.play();
            } catch (e) {
                // ok, música sintética cobre
            }
        }
    }

    stopMusic() {
        this.musicEnabled = false;
        this.nextNoteTime = 0;
        this.noteIndex = 0;

        if (this.htmlMusic) {
            try {
                this.htmlMusic.pause();
                this.htmlMusic.currentTime = 0;
            } catch (e) {
                // ignore
            }
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : 0.7;
        }
        if (this.isMuted) {
            this.stopMusic();
        } else {
            this.playMusic();
        }
        this._syncMuteButton();
    }

    _syncMuteButton() {
        if (!this.muteButton) return;
        this.muteButton.textContent = this.isMuted ? '🔇' : '🔊';
        this.muteButton.setAttribute('aria-pressed', String(this.isMuted));
        this.muteButton.title = this.isMuted ? 'Ativar som' : 'Silenciar';
    }

    _tryLoadHtmlAudio() {
        try {
            this.htmlSounds.jump = new Audio('assets/audio/jump.mp3');
            this.htmlSounds.coin = new Audio('assets/audio/coin.mp3');
            this.htmlSounds.enemyDie = new Audio('assets/audio/enemy-die.mp3');
            this.htmlSounds.gameOver = new Audio('assets/audio/game-over.mp3');
            this.htmlMusic = new Audio('assets/audio/theme.mp3');
        } catch (e) {
            // ignore
        }
    }

    _playTone(frequency, startTime, duration, type, gainValue) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, startTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);
    }

    _sfxJump(now) {
        this._playTone(523.25, now, 0.08, 'square', 0.08);
        this._playTone(784, now + 0.02, 0.06, 'square', 0.05);
    }

    _sfxCoin(now) {
        this._playTone(880, now, 0.06, 'triangle', 0.07);
        this._playTone(1318.5, now + 0.03, 0.05, 'triangle', 0.05);
    }

    _sfxEnemyDie(now) {
        this._playTone(220, now, 0.08, 'sawtooth', 0.08);
        this._playTone(165, now + 0.03, 0.10, 'sawtooth', 0.05);
    }

    _sfxGameOver(now) {
        this._playTone(196, now, 0.18, 'square', 0.08);
        this._playTone(174.6, now + 0.10, 0.22, 'square', 0.07);
        this._playTone(146.8, now + 0.22, 0.28, 'square', 0.06);
    }
}

const audioManager = new AudioManager();