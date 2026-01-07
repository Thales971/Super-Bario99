// Game v2: estéticas por fase + 50 fases procedurais + inimigos com IA
// Sem bibliotecas externas.

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const util = SuperBario99.util;

  class GameV2 {
    constructor() {
      // DOM
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d');

      this.menu = document.getElementById('menu');
      this.instructions = document.getElementById('instructions');
      this.endScreen = document.getElementById('end-screen');

      this.continueBtn = document.getElementById('continue-btn');
      this.startBtn = document.getElementById('start-btn');
      this.freeModeBtn = document.getElementById('free-mode-btn');
      this.instructionsBtn = document.getElementById('instructions-btn');
      this.backBtn = document.getElementById('back-btn');
      this.restartBtn = document.getElementById('restart-btn');
      this.menuBtn = document.getElementById('menu-btn');

      this.muteBtn = document.getElementById('mute-btn');
      this.scoreDisplay = document.getElementById('score-display');
      this.levelDisplay = document.getElementById('level-display');
      this.bestDisplay = document.getElementById('best-display');

      this.endTitle = document.getElementById('end-title');
      this.endScore = document.getElementById('end-score');
      this.endBest = document.getElementById('end-best');

      // Estado
      this.keys = Object.create(null);
      this.gravity = 0.8;
      this.running = false;

      // Modo Livre (não afeta recorde principal)
      this._isFreeMode = false;
      this._freeConfig = null;

      this.levels = [];
      this.levelIndex = 0;
      this.player = null;
      this.cameraX = 0;

      this.enemies = null;

      this.particles = [];
      this.sakura = [];

      // Seed dinâmico por fase (para layout variar a cada tentativa)
      this.levelSeed = 0;
      this._nextAutosaveAt = 0;
      this._lastLives = null;

      // Touch / swipe
      this.touchControls = document.getElementById('touch-controls');
      this.touchLeftBtn = document.getElementById('touch-left');
      this.touchRightBtn = document.getElementById('touch-right');
      this.touchJumpBtn = document.getElementById('touch-jump');
      this.touchAttackBtn = document.getElementById('touch-attack');
      this._touch = {
        active: false,
        id: null,
        startX: 0,
        startY: 0,
        moved: false,
        jumpTriggered: false
      };

      // Gamepad
      this._gamepadEnabled = true;
      this._gamepadState = { left: false, right: false, jump: false, attack: false };

      this.highKey = 'superbario99_highscore_v2';
      this.saveKey = 'superbario99_save_v2';
      this.bestScore = Number(localStorage.getItem(this.highKey) || 0);

      // Menu preview
      this.previewTimer = 0;
      this.previewThemeIndex = 0;

      // Áudio
      this.audio = new SuperBario99.AudioManagerV2();
      this.audio.attachUI({ muteButton: this.muteBtn });

      // Cache pathfinding
      this._gridCacheLevelIndex = -1;
      this._grid = null;

      this._bindEvents();
      this._checkSave();
    }

    _isTouchDevice() {
      return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
    }

    _makeSeed() {
      // seed 32-bit
      const t = (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0;
      return t;
    }

    _applyTouchVisibility() {
      if (!this.touchControls) return;
      const show = this._isTouchDevice();
      this.touchControls.style.display = show ? 'block' : 'none';
      this.touchControls.setAttribute('aria-hidden', show ? 'false' : 'true');
    }

    _regenLevelForCurrentSeed() {
      if (!this.levels || !this.levels.length) return;
      this.levels[this.levelIndex] = SuperBario99.levelsV2.createLevel(this.levelIndex, this.levelSeed);
      this._gridCacheLevelIndex = -1;
    }

    _clearInput() {
      this.keys = Object.create(null);
    }

    _checkSave() {
      const saveRaw = localStorage.getItem(this.saveKey);
      if (saveRaw) {
        this.continueBtn.style.display = 'inline-block';
        this.startBtn.textContent = 'NOVO JOGO';
      } else {
        this.continueBtn.style.display = 'none';
        this.startBtn.textContent = 'INICIAR JOGO';
      }
    }

    init() {
      this.levels = SuperBario99.levelsV2.createLevels50();
      this._spawnMenuSakura();

      this._applyTouchVisibility();

      // Aplica estética do menu no boot
      if (SuperBario99.themes && SuperBario99.themes.applyThemeForLevel) {
        SuperBario99.themes.applyThemeForLevel(0);
      }

      this.bestDisplay.textContent = `Recorde: ${this.bestScore}`;
      this._loop(performance.now());
    }

    _bindEvents() {
      window.addEventListener('keydown', (e) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'x', 'X'].includes(e.key)) e.preventDefault();
        this.keys[e.key] = true;
      });
      window.addEventListener('keyup', (e) => {
        this.keys[e.key] = false;
      });

      window.addEventListener('blur', () => this._clearInput());
      window.addEventListener('resize', () => this._applyTouchVisibility());

      this.continueBtn.addEventListener('click', () => this.loadGame());
      this.startBtn.addEventListener('click', () => this.start());
      if (this.freeModeBtn) {
        this.freeModeBtn.addEventListener('click', async () => {
          this.audio.init();
          await this.audio.resume();
          // abre o overlay do Modo Livre (script free-mode.js)
          try { SuperBario99.__freeModeUI?.open?.(); } catch (_) {}
        });
      }
      this.restartBtn.addEventListener('click', () => this.start());
      this.menuBtn.addEventListener('click', async () => {
        this.audio.init();
        await this.audio.resume();
        this.goToMenu();
      });

      this.instructionsBtn.addEventListener('click', () => {
        this.instructions.style.display = 'flex';
        this.menu.style.display = 'none';
      });
      this.backBtn.addEventListener('click', () => {
        this.instructions.style.display = 'none';
        this.menu.style.display = 'flex';
      });

      this.muteBtn.addEventListener('click', async () => {
        this.audio.init();
        await this.audio.resume();
        this.audio.toggleMute();
      });

      // Touch buttons (pointer events = melhor compatibilidade)
      const bindHold = (el, keyName) => {
        if (!el) return;
        const down = (ev) => {
          ev.preventDefault();
          this.keys[keyName] = true;
          try { el.setPointerCapture?.(ev.pointerId); } catch (_) {}
        };
        const up = (ev) => {
          ev.preventDefault();
          this.keys[keyName] = false;
          try { el.releasePointerCapture?.(ev.pointerId); } catch (_) {}
        };
        el.addEventListener('pointerdown', down);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
        el.addEventListener('pointerleave', up);
      };

      bindHold(this.touchLeftBtn, 'ArrowLeft');
      bindHold(this.touchRightBtn, 'ArrowRight');
      bindHold(this.touchJumpBtn, ' ');
      bindHold(this.touchAttackBtn, 'x');

      // Swipe no canvas: swipe para cima = pulo; arrasto horizontal = mover enquanto segura
      this.canvas.addEventListener('pointerdown', (ev) => {
        if (!this._isTouchDevice()) return;
        this._touch.active = true;
        this._touch.id = ev.pointerId;
        this._touch.startX = ev.clientX;
        this._touch.startY = ev.clientY;
        this._touch.moved = false;
        this._touch.jumpTriggered = false;
        try { this.canvas.setPointerCapture?.(ev.pointerId); } catch (_) {}
      });
      this.canvas.addEventListener('pointermove', (ev) => {
        if (!this._touch.active || ev.pointerId !== this._touch.id) return;
        const dx = ev.clientX - this._touch.startX;
        const dy = ev.clientY - this._touch.startY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (absX > 18 || absY > 18) this._touch.moved = true;

        // Swipe up -> pulo (uma vez)
        if (!this._touch.jumpTriggered && dy < -42 && absY > absX) {
          this.keys[' '] = true;
          this._touch.jumpTriggered = true;
          // solta logo em seguida para não ficar pulando infinito
          setTimeout(() => { this.keys[' '] = false; }, 0);
        }

        // Arrasto horizontal -> mover enquanto segura
        if (absX > 30 && absX > absY) {
          this.keys['ArrowLeft'] = dx < 0;
          this.keys['ArrowRight'] = dx > 0;
        }
      });
      const endSwipe = (ev) => {
        if (ev.pointerId !== this._touch.id) return;
        this._touch.active = false;
        this._touch.id = null;
        this.keys['ArrowLeft'] = false;
        this.keys['ArrowRight'] = false;
      };
      this.canvas.addEventListener('pointerup', endSwipe);
      this.canvas.addEventListener('pointercancel', endSwipe);
    }

    async start() {
      // Limpa save ao começar do zero
      localStorage.removeItem(this.saveKey);
      this._checkSave();

      this.audio.init();
      await this.audio.resume();

      this.running = true;
      this._isFreeMode = false;
      this._freeConfig = null;
      this.levelIndex = 0;
      this.levelSeed = this._makeSeed();
      this._regenLevelForCurrentSeed();
      this.player = new SuperBario99.PlayerV2(60, 320);
      this._lastLives = this.player.lives;
      this.cameraX = 0;
      this.particles.length = 0;

      this.enemies = this._buildEnemiesForLevel(this.levelIndex);

      this._nextAutosaveAt = performance.now() + 30000;

      this._setThemeForLevel();
      this.audio.playMusic();

      this.menu.style.display = 'none';
      this.instructions.style.display = 'none';
      this.endScreen.style.display = 'none';

      this._updateHud();
      this._spawnMenuSakura();
      
      this._saveProgress();
    }

    // Inicia o jogo usando configurações do Modo Livre.
    // Importante: não grava no ranking principal e não sobrescreve o save do modo principal.
    async startFreeMode(config) {
      this.audio.init();
      await this.audio.resume();

      this.running = true;
      this._isFreeMode = true;
      this._freeConfig = config ? { ...config } : {};

      const startLevel = util.clamp((this._freeConfig.startLevel | 0), 0, 49);
      this.levelIndex = startLevel;

      // Gravidade
      const g = Number(this._freeConfig.gravity);
      this.gravity = isFinite(g) ? g : 0.8;

      // Seed nova para começar o sandbox
      this.levelSeed = this._makeSeed();
      this._regenLevelForCurrentSeed();

      this.player = new SuperBario99.PlayerV2(60, 320);
      this.player.score = 0;

      // Vidas
      if (this._freeConfig.lives === 'inf') {
        this.player.lives = 9999;
      } else {
        const lv = Number(this._freeConfig.lives);
        this.player.lives = (isFinite(lv) && lv > 0) ? lv : 10;
      }
      this._lastLives = this.player.lives;

      this.cameraX = 0;
      this.particles.length = 0;
      this._gridCacheLevelIndex = -1;

      this.enemies = this._buildEnemiesForLevel(this.levelIndex);

      this._nextAutosaveAt = performance.now() + 30000;

      // Tema/estética
      this._setThemeForLevel();
      this.audio.playMusic();

      this.menu.style.display = 'none';
      this.instructions.style.display = 'none';
      this.endScreen.style.display = 'none';

      this._updateHud();
      this._spawnMenuSakura();
    }

    async loadGame() {
      const saveRaw = localStorage.getItem(this.saveKey);
      if (!saveRaw) return this.start();

      try {
        const data = JSON.parse(saveRaw);
        this.audio.init();
        await this.audio.resume();

        this.running = true;
        this._isFreeMode = false;
        this._freeConfig = null;
        this.levelIndex = data.levelIndex || 0;
        this.levelSeed = (data.levelSeed >>> 0) || this._makeSeed();
        this._regenLevelForCurrentSeed();
        this.player = new SuperBario99.PlayerV2(60, 320);
        this.player.score = data.score || 0;
        this.player.lives = (data.lives > 0) ? data.lives : 10;
        this._lastLives = this.player.lives;
        
        this.cameraX = 0;
        this.particles.length = 0;

        this.enemies = this._buildEnemiesForLevel(this.levelIndex);
        this._setThemeForLevel();
        this.audio.playMusic();

  this._nextAutosaveAt = performance.now() + 30000;

        this.menu.style.display = 'none';
        this.instructions.style.display = 'none';
        this.endScreen.style.display = 'none';

        this._updateHud();
        this._spawnMenuSakura();

      } catch (e) {
        console.error('Save corrompido, iniciando novo jogo', e);
        this.start();
      }
    }

    _saveProgress() {
      if (!this.player) return;

      // No Modo Livre não persistimos o save principal.
      if (this._isFreeMode) return;

      const data = {
        levelIndex: this.levelIndex,
        score: this.player.score,
        lives: this.player.lives,
        levelSeed: this.levelSeed >>> 0,
        savedAt: Date.now()
      };
      localStorage.setItem(this.saveKey, JSON.stringify(data));
      this._checkSave();
    }

    goToMenu() {
      this.running = false;
      this.audio.stopMusic();

      this._isFreeMode = false;
      this._freeConfig = null;

      // tema/música do menu
      this.audio.setTheme('menu');
      this.audio.playMusic();

      // estética do menu (usa a estética da fase 1 como padrão)
      if (SuperBario99.themes && SuperBario99.themes.applyTheme) {
        SuperBario99.themes.applyThemeForLevel(0);
      }

      this.enemies = null;
      this.menu.style.display = 'flex';
      this.instructions.style.display = 'none';
      this.endScreen.style.display = 'none';
      this.bestDisplay.textContent = `Recorde: ${this.bestScore}`;
    }

    _setThemeForLevel() {
      const themeId = SuperBario99.difficulty.getThemeId(this.levelIndex);
      const boss = this._isBossLevel(this.levelIndex);

      const level = this._getLevel();

      // Estética (UI/efeitos): por fase no modo normal; override no Modo Livre
      const aestheticId = (this._isFreeMode && this._freeConfig && this._freeConfig.aestheticId)
        ? this._freeConfig.aestheticId
        : (level && level.aestheticId ? level.aestheticId
          : (SuperBario99.themes ? SuperBario99.themes.getAestheticIdForLevel(this.levelIndex) : 'windows-xp'));

      // Música: agora acompanha a estética (normal e boss)
      this.audio.setTheme(boss ? `boss_${aestheticId}` : aestheticId);

      if (SuperBario99.themes && SuperBario99.themes.applyTheme) {
        SuperBario99.themes.applyTheme(aestheticId);
      }
    }

    _isBossLevel(levelIndex) {
      // níveis 5,10,15,...,50
      return (levelIndex % 5) === 4;
    }

    _getLevel() {
      return this.levels[this.levelIndex];
    }

    _spawnMenuSakura() {
      // partículas de sakura (persistem no menu e no jogo Japan/MemeFusion)
      this.sakura.length = 0;
      for (let i = 0; i < 45; i++) {
        this.sakura.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          vx: util.rand(-0.3, 0.6),
          vy: util.rand(0.5, 1.3),
          r: util.rand(2, 4),
          rot: util.rand(0, Math.PI * 2)
        });
      }
    }

    _updateSakura() {
      for (const s of this.sakura) {
        s.x += s.vx;
        s.y += s.vy;
        s.rot += 0.02;
        if (s.y > this.canvas.height + 10) {
          s.y = -10;
          s.x = Math.random() * this.canvas.width;
        }
        if (s.x < -10) s.x = this.canvas.width + 10;
        if (s.x > this.canvas.width + 10) s.x = -10;
      }
    }

    _drawSakura() {
      this.ctx.fillStyle = 'rgba(255, 182, 193, 0.85)';
      for (const s of this.sakura) {
        const x = s.x;
        const y = s.y;
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(s.rot);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, s.r, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    }

    _spawnCoinParticles(x, y, themeId) {
      for (let i = 0; i < 12; i++) {
        this.particles.push({
          x,
          y,
          vx: util.rand(-2.2, 2.2),
          vy: util.rand(-4.2, -1.2),
          life: util.irand(25, 45),
          color: themeId === 'tecnozen' ? '#23d5ff' : '#FFD700'
        });
      }
    }

    _updateParticles() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.vy += 0.18;
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
    }

    _drawParticles() {
      for (const p of this.particles) {
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(p.x - this.cameraX, p.y, 3, 3);
      }
    }

    _buildEnemiesForLevel(levelIndex) {
      const level = this.levels[levelIndex];
      const diff = SuperBario99.difficulty.getDifficulty(levelIndex);
      const themeId = level.themeId;

      const rng = (() => {
        let seed = ((this.levelSeed >>> 0) ^ (777 + levelIndex * 1337)) >>> 0;
        return () => {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          return seed / 4294967296;
        };
      })();

      const enemies = [];

      // Overrides do Modo Livre
      const free = (this._isFreeMode && this._freeConfig) ? this._freeConfig : null;
      const desiredCount = free ? util.clamp((free.enemyCount | 0), 0, 50) : null;
      const poolId = free ? String(free.enemyPool || 'mixed') : null;
      const behavior = free ? String(free.enemyBehavior || 'random') : 'random';

      // Boss no fim do bloco
      if (this._isBossLevel(levelIndex)) {
        const bx = Math.max(420, level.worldWidth - 520);
        const by = 290;
        enemies.push(new SuperBario99.ThemeBoss(bx, by, themeId, levelIndex));

        const extra = diff.tier === 'advanced' ? 4 : 2;
        for (let i = 0; i < extra; i++) {
          const x = bx - 260 - i * 110;
          const y = 260 + Math.floor(rng() * 70);
          enemies.push(new SuperBario99.DroneEnemy(x, y));
        }

        return enemies;
      }

      // Random real por estética (pesos por tema)
      const tables = {
        japan: [
          // alvo aproximado: 30% ninja, 30% yokai, 20% samurai, 20% "aleatórios" (tanuki/kitsune)
          { w: 3, make: (x, y) => new SuperBario99.NinjaEnemy(x, y) },
          { w: 3, make: (x, y) => new SuperBario99.YokaiEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.SamuraiEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.TanukiEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.KitsuneEnemy(x, y) }
        ],
        fruitiger: [
          { w: 3, make: (x, y) => new SuperBario99.DroneEnemy(x, y - 30) },
          { w: 2, make: (x, y) => new SuperBario99.NinjaEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.TanukiEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.KitsuneEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.SamuraiEnemy(x, y) }
        ],
        tecnozen: [
          { w: 4, make: (x, y) => new SuperBario99.DroneEnemy(x, y - 40) },
          { w: 2, make: (x, y) => new SuperBario99.YokaiEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.NinjaEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.SamuraiEnemy(x, y) }
        ],
        dorfic: [
          { w: 3, make: (x, y) => new SuperBario99.YokaiEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.SamuraiEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.TanukiEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.NinjaEnemy(x, y) }
        ],
        metro: [
          { w: 4, make: (x, y) => new SuperBario99.DroneEnemy(x, y - 40) },
          { w: 2, make: (x, y) => new SuperBario99.NinjaEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.SamuraiEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.YokaiEnemy(x, y) }
        ],
        evil: [
          { w: 3, make: (x, y) => new SuperBario99.YokaiEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.NinjaEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.SamuraiEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.KitsuneEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.DroneEnemy(x, y - 35) }
        ],
        memefusion: [
          { w: 2, make: (x, y) => new SuperBario99.NinjaEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.DroneEnemy(x, y - 35) },
          { w: 2, make: (x, y) => new SuperBario99.KitsuneEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.YokaiEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.SamuraiEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.TanukiEnemy(x, y) }
        ]
      };

      let table = tables[themeId] || tables.japan;

      // No Modo Livre, substitui a tabela conforme pool
      if (free) {
        const all = {
          ninja: { w: 2, make: (x, y) => new SuperBario99.NinjaEnemy(x, y) },
          yokai: { w: 2, make: (x, y) => new SuperBario99.YokaiEnemy(x, y) },
          samurai: { w: 2, make: (x, y) => new SuperBario99.SamuraiEnemy(x, y) },
          tanuki: { w: 2, make: (x, y) => new SuperBario99.TanukiEnemy(x, y) },
          kitsune: { w: 2, make: (x, y) => new SuperBario99.KitsuneEnemy(x, y) },
          drone: { w: 2, make: (x, y) => new SuperBario99.DroneEnemy(x, y - 35) }
        };

        const pools = {
          japanese: ['ninja', 'yokai', 'samurai', 'tanuki', 'kitsune'],
          tech: ['drone', 'yokai'],
          mixed: ['ninja', 'yokai', 'samurai', 'tanuki', 'kitsune', 'drone']
        };
        const ids = pools[poolId] || pools.mixed;
        table = ids.map((id) => all[id]).filter(Boolean);
        if (!table.length) table = tables.japan;
      }
      const totalW = table.reduce((a, it) => a + it.w, 0);
      const pickOne = () => {
        let r = rng() * totalW;
        for (const it of table) {
          r -= it.w;
          if (r <= 0) return it;
        }
        return table[0];
      };

      // escala: ~3 no começo, ~18 perto da fase 50 (clamp 2..20)
      // No Modo Livre: usa slider 0..50
      const count = (desiredCount != null)
        ? desiredCount
        : util.clamp(Math.round(3 + (levelIndex / 49) * 15), 2, 20);
      for (let i = 0; i < count; i++) {
        const x = 320 + Math.floor(rng() * (level.worldWidth - 520));
        let y = 260 + Math.floor(rng() * 80);

        // comportamento simples: agressivo tende a ficar mais perto do player / mais central,
        // defensivo tende a ficar mais longe e mais alto.
        if (free) {
          if (behavior === 'aggressive') {
            y = 280 + Math.floor(rng() * 60);
          } else if (behavior === 'defensive') {
            y = 220 + Math.floor(rng() * 60);
          }
        }

        enemies.push(pickOne().make(x, y));
      }

      return enemies;
    }

    _ensureGridForLevel(levelIndex) {
      if (this._gridCacheLevelIndex === levelIndex && this._grid) return;
      const level = this.levels[levelIndex];
      this._grid = SuperBario99.pathfinding.buildSolidGrid(level, 32, this.canvas.height);
      this._gridCacheLevelIndex = levelIndex;
    }

    _updateHud() {
      this.scoreDisplay.textContent = `Pontos: ${this.player ? this.player.score : 0}`;
      this.levelDisplay.textContent = `Fase: ${this.levelIndex + 1}/50`;
      this.bestDisplay.textContent = `Recorde: ${this.bestScore}`;
    }

    _end(victory) {
      // No Modo Livre: não mexe no save do modo principal nem no recorde principal.
      if (this._isFreeMode) {
        this.running = false;
        this.audio.stopMusic();
        this.audio.playSfx(victory ? 'powerup' : 'gameOver');
        this.endTitle.textContent = victory ? 'VITÓRIA!' : 'FIM (MODO LIVRE)';
        this.endScore.textContent = `Pontuação: ${this.player ? this.player.score : 0}`;
        this.endBest.textContent = `Recorde: ${this.bestScore}`;
        this.endScreen.style.display = 'flex';
        return;
      }

      if (victory) {
        // Zera o save se zerou o jogo
        localStorage.removeItem(this.saveKey);
      } else {
        // Se morreu: salva a fase atual para tentar de novo.
        // Também atualiza vidas e seed (layout muda a cada nova tentativa desta fase).
        if (this.player) {
          this.levelSeed = this._makeSeed();
          this.player.lives = 10;
          this._saveProgress();
        }
      }
      this._checkSave();

      this.running = false;
      this.audio.stopMusic();
      this.audio.playSfx(victory ? 'powerup' : 'gameOver');

      if (this.player && this.player.score > this.bestScore) {
        this.bestScore = this.player.score;
        localStorage.setItem(this.highKey, String(this.bestScore));
      }

      this.endTitle.textContent = victory ? 'VITÓRIA!' : 'GAME OVER';
      this.endScore.textContent = `Pontuação: ${this.player ? this.player.score : 0}`;
      this.endBest.textContent = `Recorde: ${this.bestScore}`;
      this.endScreen.style.display = 'flex';
    }

    _cameraUpdate(level) {
      const target = this.player.x - this.canvas.width * 0.45;
      this.cameraX = util.clamp(target, 0, Math.max(0, level.worldWidth - this.canvas.width));
    }

    _renderBackground(themeId, nightMode) {
      const ctx = this.ctx;

      // Dia/noite
      const darken = nightMode ? 0.55 : 0.0;

      // A partir daqui, `themeId` pode ser um themeId antigo OU um aestheticId novo.
      const id = themeId || 'windows-xp';

      const isFruitiger = (id === 'fruitiger' || id === 'fruitiger-aero');
      const isMetro = (id === 'metro' || id === 'metro-aero');
      const isTecno = (id === 'tecnozen' || id === 'tecno-zen');
      const isDorfic = (id === 'dorfic');
      const isVapor = (id === 'vaporwave');
      const isAurora = (id === 'aurora-aero');
      const isXP = (id === 'windows-xp');
      const isVista = (id === 'windows-vista');

      // -----------------------------
      // WINDOWS XP (fases 1-5)
      // -----------------------------
      if (isXP) {
        // céu
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#65B9FF');
        grd.addColorStop(1, '#0055E5');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // colinas "Bliss" (estilizado)
        const par = -(this.cameraX * 0.18) % (this.canvas.width + 400);
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.moveTo(par - 200, 420);
        ctx.quadraticCurveTo(par + 120, 260, par + 520, 420);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.moveTo(par + 200, 420);
        ctx.quadraticCurveTo(par + 520, 290, par + 900, 420);
        ctx.closePath();
        ctx.fill();

        // "barra de tarefas" no topo
        ctx.fillStyle = 'rgba(236,233,216,0.92)';
        ctx.fillRect(0, 0, this.canvas.width, 28);
        ctx.fillStyle = 'rgba(0,85,229,0.55)';
        ctx.fillRect(0, 26, this.canvas.width, 2);
        ctx.fillStyle = 'rgba(0,204,0,0.85)';
        ctx.fillRect(8, 6, 62, 18);
        ctx.fillStyle = 'rgba(255,255,255,0.80)';
        ctx.fillRect(14, 10, 18, 10);

        // ícones simples no "desktop"
        ctx.fillStyle = 'rgba(236,233,216,0.25)';
        for (let i = 0; i < 6; i++) {
          const ix = 22;
          const iy = 46 + i * 44;
          ctx.fillRect(ix, iy, 20, 20);
        }

      }

      // -----------------------------
      // FRUITIGER AERO (fases 6-10)
      // -----------------------------
      else if (isFruitiger) {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#87CEEB');
        grd.addColorStop(1, '#1E90FF');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // nuvens fofas ("blur" simulado com camadas)
        const base = -(this.cameraX * 0.22) % 900;
        for (let i = 0; i < 7; i++) {
          const x = base + i * 160;
          const y = 62 + (i % 3) * 24;
          ctx.fillStyle = 'rgba(255,255,255,0.20)';
          ctx.beginPath();
          ctx.arc(x + 20, y, 22, 0, Math.PI * 2);
          ctx.arc(x + 46, y - 12, 24, 0, Math.PI * 2);
          ctx.arc(x + 72, y, 22, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.beginPath();
          ctx.arc(x + 20, y, 16, 0, Math.PI * 2);
          ctx.arc(x + 42, y - 10, 18, 0, Math.PI * 2);
          ctx.arc(x + 64, y, 16, 0, Math.PI * 2);
          ctx.fill();

          // avião de papel
          ctx.strokeStyle = 'rgba(255,255,255,0.80)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 96, y + 26);
          ctx.lineTo(x + 118, y + 18);
          ctx.lineTo(x + 104, y + 38);
          ctx.closePath();
          ctx.stroke();
        }

        // grade sutil no chão
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < this.canvas.width; gx += 24) {
          ctx.beginPath();
          ctx.moveTo(gx, 380);
          ctx.lineTo(gx, this.canvas.height);
          ctx.stroke();
        }
        for (let gy = 380; gy < this.canvas.height; gy += 18) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(this.canvas.width, gy);
          ctx.stroke();
        }

        // partículas de brilho (2px)
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        const t = performance.now() * 0.001;
        for (let i = 0; i < 34; i++) {
          const px = ((i * 67) + (this.cameraX * 0.12) + (t * 60)) % (this.canvas.width + 40) - 20;
          const py = 120 + ((i * 29) % 240);
          ctx.fillRect(px, py, 2, 2);
        }

        // luz suave global
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }

      // -----------------------------
      // TECNO ZEN (fases 11-15)
      // -----------------------------
      else if (isTecno) {
        // base escura
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // gradiente tecnológico
        const grd = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        grd.addColorStop(0, 'rgba(138,43,226,0.38)');
        grd.addColorStop(1, 'rgba(0,191,255,0.30)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // circuitos
        ctx.strokeStyle = 'rgba(0,255,255,0.55)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
          const x = ((i * 120) + (this.cameraX * 0.25)) % this.canvas.width;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, this.canvas.height);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(57,255,20,0.28)';
        for (let i = 0; i < 6; i++) {
          const y = 40 + i * 68;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(this.canvas.width, y);
          ctx.stroke();
        }

        // "código" flutuando (texto pequeno em verde)
        ctx.fillStyle = 'rgba(57,255,20,0.35)';
        ctx.font = '10px monospace';
        const baseX = -(this.cameraX * 0.32) % 420;
        for (let i = 0; i < 22; i++) {
          const tx = baseX + (i % 6) * 72;
          const ty = 70 + (i * 17) % 260;
          ctx.fillText('010101001', tx, ty);
        }

        // mandala digital (círculos)
        ctx.strokeStyle = 'rgba(0,255,255,0.25)';
        ctx.lineWidth = 2;
        const cx = this.canvas.width * 0.72;
        const cy = 150;
        for (let r = 40; r <= 120; r += 20) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // partículas de dados (pontos conectados)
        ctx.strokeStyle = 'rgba(0,255,255,0.20)';
        ctx.fillStyle = 'rgba(0,255,255,0.35)';
        for (let i = 0; i < 10; i++) {
          const px = ((this.cameraX * 0.18) + i * 90) % (this.canvas.width + 120) - 60;
          const py = 90 + (i % 5) * 44;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + 24, py + 12);
          ctx.stroke();
        }

        // overlay preto 90% opacidade ("fundo" profundo)
        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }

      // -----------------------------
      // DORFIC (fases 16-20)
      // -----------------------------
      else if (isDorfic) {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#556B2F');
        grd.addColorStop(1, '#228B22');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // árvores antigas (casca)
        const base = -(this.cameraX * 0.18) % 900;
        for (let i = 0; i < 6; i++) {
          const x = base + i * 180;
          ctx.fillStyle = 'rgba(139,69,19,0.55)';
          ctx.fillRect(x, 170, 26, 240);
          ctx.fillStyle = 'rgba(0,0,0,0.10)';
          for (let s = 0; s < 6; s++) ctx.fillRect(x + 4 + (s % 2) * 10, 180 + s * 34, 4, 18);
          ctx.fillStyle = 'rgba(60,110,71,0.45)';
          ctx.beginPath();
          ctx.arc(x + 13, 158, 42, 0, Math.PI * 2);
          ctx.fill();
        }

        // rochas com musgo
        ctx.fillStyle = 'rgba(105,105,105,0.55)';
        for (let i = 0; i < 7; i++) {
          const rx = ((this.cameraX * 0.10) + i * 140) % (this.canvas.width + 200) - 80;
          ctx.beginPath();
          ctx.arc(rx, 380, 30 + (i % 3) * 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(60,110,71,0.35)';
          ctx.beginPath();
          ctx.arc(rx - 10, 370, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(105,105,105,0.55)';
        }

        // raios de sol
        ctx.fillStyle = 'rgba(240,230,140,0.08)';
        for (let i = 0; i < 4; i++) {
          const sx = 120 + i * 190;
          ctx.beginPath();
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx + 80, 0);
          ctx.lineTo(sx + 40, 260);
          ctx.closePath();
          ctx.fill();
        }

        // neblina baixa
        const fog = ctx.createLinearGradient(0, 310, 0, this.canvas.height);
        fog.addColorStop(0, 'rgba(255,255,255,0.00)');
        fog.addColorStop(1, 'rgba(255,255,255,0.12)');
        ctx.fillStyle = fog;
        ctx.fillRect(0, 310, this.canvas.width, this.canvas.height - 310);
      }

      // -----------------------------
      // METRO AERO (fases 21-25)
      // -----------------------------
      else if (isMetro) {
        // fundo profundo
        ctx.fillStyle = '#0A0A0A';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, 'rgba(0,102,204,0.40)');
        grd.addColorStop(1, 'rgba(0,191,255,0.22)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // trilhos com perspectiva
        ctx.strokeStyle = 'rgba(192,192,192,0.60)';
        ctx.lineWidth = 3;
        const base = -(this.cameraX * 0.45) % 120;
        for (let i = 0; i < 10; i++) {
          const x = base + i * 120;
          ctx.beginPath();
          ctx.moveTo(x, 360);
          ctx.lineTo(x + 40, 420);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(0,191,255,0.60)';
        ctx.beginPath();
        ctx.moveTo(0, 330);
        ctx.lineTo(this.canvas.width, 330);
        ctx.stroke();

        // trem passando (sprites simples)
        const tx = ((-this.cameraX * 0.70) % (this.canvas.width + 320)) + this.canvas.width;
        ctx.fillStyle = 'rgba(192,192,192,0.28)';
        ctx.fillRect(tx - 320, 248, 260, 40);
        ctx.fillStyle = 'rgba(0,191,255,0.35)';
        for (let i = 0; i < 7; i++) ctx.fillRect(tx - 300 + i * 34, 258, 18, 12);

        // sinais (vermelho/verde)
        for (let i = 0; i < 3; i++) {
          const sx = 90 + i * 220;
          ctx.fillStyle = 'rgba(192,192,192,0.35)';
          ctx.fillRect(sx, 280, 10, 90);
          ctx.fillStyle = 'rgba(255,0,0,0.65)';
          ctx.beginPath();
          ctx.arc(sx + 5, 290, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(57,255,20,0.75)';
          ctx.beginPath();
          ctx.arc(sx + 5, 304, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // mapas de metrô (linhas coloridas)
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(520, 120);
        ctx.lineTo(650, 150);
        ctx.lineTo(720, 110);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(57,255,20,0.20)';
        ctx.beginPath();
        ctx.moveTo(540, 160);
        ctx.lineTo(680, 170);
        ctx.lineTo(740, 150);
        ctx.stroke();

        // linhas de velocidade nas bordas
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 18; i++) {
          const y = 40 + i * 22;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(40, y + 18);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(this.canvas.width, y);
          ctx.lineTo(this.canvas.width - 40, y + 18);
          ctx.stroke();
        }
      }

      // -----------------------------
      // VAPORWAVE (fases 26-30)
      // -----------------------------
      else if (isVapor) {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#FF00FF');
        grd.addColorStop(0.55, '#800080');
        grd.addColorStop(1, '#000000');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // grade de computador antigo (pontos)
        ctx.fillStyle = 'rgba(0,255,255,0.10)';
        for (let y = 70; y < this.canvas.height; y += 14) {
          for (let x = 0; x < this.canvas.width; x += 14) {
            if (((x + y) % 28) === 0) ctx.fillRect(x, y, 2, 2);
          }
        }

        // palmeiras neon (contorno)
        ctx.strokeStyle = 'rgba(255,0,255,0.80)';
        ctx.lineWidth = 3;
        const base = -(this.cameraX * 0.20) % 700;
        for (let i = 0; i < 4; i++) {
          const px = base + i * 200 + 60;
          ctx.beginPath();
          ctx.moveTo(px, 420);
          ctx.lineTo(px + 14, 290);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(px + 14, 290);
          ctx.lineTo(px - 16, 270);
          ctx.lineTo(px + 2, 260);
          ctx.lineTo(px + 22, 270);
          ctx.closePath();
          ctx.stroke();
        }

        // estátuas (dourado antigo) quebradas no fundo
        ctx.fillStyle = 'rgba(212,175,55,0.35)';
        for (let i = 0; i < 3; i++) {
          const sx = 120 + i * 240;
          ctx.fillRect(sx, 260, 60, 110);
          ctx.clearRect(sx + 6, 312, 14, 12);
          ctx.fillRect(sx + 18, 236, 26, 26);
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.fillRect(sx + 10, 350, 18, 20);
          ctx.fillStyle = 'rgba(212,175,55,0.35)';
        }
      }

      // -----------------------------
      // AURORA AERO (fases 31–35 e 46–50, no total 1–50)
      // -----------------------------
      else if (isAurora) {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#191970');
        grd.addColorStop(1, '#000010');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // estrelas
        ctx.fillStyle = 'rgba(255,215,0,0.75)';
        for (let i = 0; i < 60; i++) {
          const sx = (i * 37 + (this.cameraX * 0.05)) % this.canvas.width;
          const sy = (i * 19) % 220;
          const s = (i % 3) + 1;
          ctx.fillRect(sx, sy, s, s);
        }

        // aurora (ondas coloridas)
        const wave = (baseY, amp, color, speed) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = 4;
          ctx.beginPath();
          for (let x = 0; x <= this.canvas.width; x += 10) {
            const t = (performance.now() * 0.001 * speed) + x * 0.03;
            const y = baseY + Math.sin(t) * amp;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        };
        wave(120, 16, 'rgba(127,255,0,0.28)', 1.0);
        wave(140, 18, 'rgba(255,105,180,0.22)', 0.9);
        wave(160, 14, 'rgba(148,0,211,0.18)', 0.8);

        // planetas
        ctx.fillStyle = 'rgba(148,0,211,0.20)';
        ctx.beginPath();
        ctx.arc(680, 110, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.beginPath();
        ctx.arc(702, 96, 18, 0, Math.PI * 2);
        ctx.fill();

        // naves passando
        const shipX = ((-this.cameraX * 0.40) + (performance.now() * 0.05)) % (this.canvas.width + 220) - 110;
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.beginPath();
        ctx.moveTo(shipX, 210);
        ctx.lineTo(shipX + 34, 198);
        ctx.lineTo(shipX + 68, 210);
        ctx.lineTo(shipX + 34, 222);
        ctx.closePath();
        ctx.fill();
      }

      // -----------------------------
      // WINDOWS VISTA (aparece no Modo Livre)
      // -----------------------------
      else if (isVista) {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#4169E1');
        grd.addColorStop(1, '#0078D7');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // brilho "Aero Glass"
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.arc(620, 80, 140, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }

      // -----------------------------
      // Fallback antigo (caso algum caller ainda mande themeId legado)
      // -----------------------------
      else if (themeId === 'japan') {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#ffb6d5');
        grd.addColorStop(1, '#ffeef6');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Fuji
        const par = -(this.cameraX * 0.15) % 900;
        ctx.fillStyle = 'rgba(210, 120, 170, 0.45)';
        ctx.beginPath();
        ctx.moveTo(par + 180, 380);
        ctx.lineTo(par + 320, 210);
        ctx.lineTo(par + 460, 380);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.moveTo(par + 320, 210);
        ctx.lineTo(par + 290, 250);
        ctx.lineTo(par + 350, 250);
        ctx.closePath();
        ctx.fill();

        // Templo/torii distante
        ctx.fillStyle = 'rgba(192, 57, 43, 0.4)';
        for (let i = 0; i < 4; i++) {
          const x = (par + i * 240 + 60) % (this.canvas.width + 100);
          ctx.fillRect(x, 320, 6, 60);
          ctx.fillRect(x + 26, 320, 6, 60);
          ctx.fillRect(x - 8, 315, 48, 8);
        }

        this._updateSakura();
        this._drawSakura();

        // lanternas distantes
        ctx.fillStyle = 'rgba(255,210,125,0.28)';
        for (let i = 0; i < 6; i++) {
          const lx = ((par + 120 + i * 170) % (this.canvas.width + 140)) - 40;
          const ly = 250 + (i % 3) * 18;
          ctx.fillRect(lx, ly, 10, 14);
        }

      } else if (themeId === 'fruitiger') {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#a1d9ff');
        grd.addColorStop(1, '#eaf7ff');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // nuvens fofas + aviões de papel
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        const base = -(this.cameraX * 0.22) % 900;
        for (let i = 0; i < 7; i++) {
          const x = base + i * 160;
          const y = 60 + (i % 3) * 24;
          ctx.beginPath();
          ctx.arc(x + 20, y, 16, 0, Math.PI * 2);
          ctx.arc(x + 40, y - 10, 18, 0, Math.PI * 2);
          ctx.arc(x + 60, y, 16, 0, Math.PI * 2);
          ctx.fill();

          // avião
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 90, y + 25);
          ctx.lineTo(x + 110, y + 18);
          ctx.lineTo(x + 100, y + 35);
          ctx.closePath();
          ctx.stroke();
        }

        // orbs/bolhas glossy (Fruitiger)
        for (let i = 0; i < 10; i++) {
          const ox = ((this.cameraX * 0.28) + i * 110) % (this.canvas.width + 160) - 40;
          const oy = 110 + (i % 4) * 40;
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.beginPath();
          ctx.arc(ox, oy, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.beginPath();
          ctx.arc(ox - 6, oy - 6, 6, 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (themeId === 'tecnozen') {
        ctx.fillStyle = '#08111b';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // circuitos neon
        ctx.strokeStyle = 'rgba(35,213,255,0.7)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 9; i++) {
          const x = ((i * 120) + (this.cameraX * 0.25)) % this.canvas.width;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, this.canvas.height);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(166,107,255,0.55)';
        for (let i = 0; i < 6; i++) {
          const y = (i * 70 + 30);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(this.canvas.width, y);
          ctx.stroke();
        }

        // lotus/círculos zen neon
        ctx.strokeStyle = 'rgba(35,213,255,0.25)';
        ctx.lineWidth = 2;
        const cx = this.canvas.width * 0.5;
        const cy = 220;
        for (let r = 40; r <= 120; r += 20) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }

      } else if (themeId === 'dorfic') {
        ctx.fillStyle = '#0f1410';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // silhuetas góticas
        ctx.fillStyle = 'rgba(60,110,71,0.35)';
        const base = -(this.cameraX * 0.18) % 900;
        for (let i = 0; i < 5; i++) {
          const x = base + i * 240;
          ctx.fillRect(x + 60, 260, 80, 140);
          ctx.fillRect(x + 90, 220, 20, 40);
          ctx.fillRect(x + 80, 240, 40, 10);
        }

        // névoa
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        for (let i = 0; i < 6; i++) {
          const fx = ((this.cameraX * 0.12) + i * 160) % (this.canvas.width + 200) - 80;
          ctx.beginPath();
          ctx.arc(fx, 360, 70, 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (themeId === 'metro') {
        ctx.fillStyle = '#0b1320';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // trilhos
        ctx.strokeStyle = 'rgba(192,200,209,0.55)';
        ctx.lineWidth = 3;
        const base = -(this.cameraX * 0.45) % 120;
        for (let i = 0; i < 10; i++) {
          const x = base + i * 120;
          ctx.beginPath();
          ctx.moveTo(x, 360);
          ctx.lineTo(x + 40, 420);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(74,163,255,0.6)';
        ctx.beginPath();
        ctx.moveTo(0, 330);
        ctx.lineTo(this.canvas.width, 330);
        ctx.stroke();

        // trem distante (parallax)
        const tx = ((-this.cameraX * 0.55) % (this.canvas.width + 260)) + this.canvas.width;
        ctx.fillStyle = 'rgba(192,200,209,0.25)';
        ctx.fillRect(tx - 260, 250, 220, 34);
        ctx.fillStyle = 'rgba(74,163,255,0.35)';
        for (let i = 0; i < 6; i++) ctx.fillRect(tx - 240 + i * 34, 258, 18, 10);

      } else if (themeId === 'evil') {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#2b000a');
        grd.addColorStop(1, '#000000');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // nuvens tempestuosas
        ctx.fillStyle = 'rgba(80,0,20,0.65)';
        const base = -(this.cameraX * 0.22) % 900;
        for (let i = 0; i < 7; i++) {
          const x = base + i * 160;
          const y = 75 + (i % 3) * 20;
          ctx.beginPath();
          ctx.arc(x + 20, y, 18, 0, Math.PI * 2);
          ctx.arc(x + 45, y - 8, 20, 0, Math.PI * 2);
          ctx.arc(x + 70, y, 18, 0, Math.PI * 2);
          ctx.fill();
        }

        // relâmpagos ocasionais
        if ((Math.floor(performance.now() / 300) % 9) === 0) {
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(520, 30);
          ctx.lineTo(480, 120);
          ctx.lineTo(520, 120);
          ctx.lineTo(470, 210);
          ctx.stroke();
        }

      } else {
        // MemeFusion: mistura (sakura + neon + gradiente)
        const grd = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        grd.addColorStop(0, '#ffb6d5');
        grd.addColorStop(0.5, '#23d5ff');
        grd.addColorStop(1, '#ffd27d');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this._updateSakura();
        this._drawSakura();

        // glitch blocks
        ctx.fillStyle = 'rgba(0,0,0,0.10)';
        for (let i = 0; i < 8; i++) {
          const gx = ((this.cameraX * 0.33) + i * 120) % (this.canvas.width + 200) - 60;
          ctx.fillRect(gx, 90 + (i % 4) * 40, 60, 12);
        }
      }

      if (darken > 0) {
        ctx.fillStyle = `rgba(0,0,0,${darken})`;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    _updateGame(now) {
      const level = this._getLevel();
      const diff = SuperBario99.difficulty.getDifficulty(this.levelIndex);
      const themeId = level.themeId;
      const bossLevel = this._isBossLevel(this.levelIndex);

      // Gamepad (polled)
      if (this._gamepadEnabled) {
        const pads = navigator.getGamepads ? navigator.getGamepads() : null;
        const pad = pads && pads[0];
        if (pad) {
          const ax = pad.axes && pad.axes.length ? pad.axes[0] : 0;
          this._gamepadState.left = ax < -0.25;
          this._gamepadState.right = ax > 0.25;

          // A / B / X -> pulo; Y / RB -> ataque
          this._gamepadState.jump = !!(pad.buttons?.[0]?.pressed || pad.buttons?.[1]?.pressed || pad.buttons?.[2]?.pressed);
          this._gamepadState.attack = !!(pad.buttons?.[3]?.pressed || pad.buttons?.[5]?.pressed);
        } else {
          this._gamepadState.left = false;
          this._gamepadState.right = false;
          this._gamepadState.jump = false;
          this._gamepadState.attack = false;
        }
      }

      // Mescla teclado/touch + gamepad (sem grudar estado)
      const input = {
        ArrowLeft: !!this.keys['ArrowLeft'] || this._gamepadState.left,
        ArrowRight: !!this.keys['ArrowRight'] || this._gamepadState.right,
        ArrowUp: !!this.keys['ArrowUp'] || this._gamepadState.jump,
        ' ': !!this.keys[' '] || this._gamepadState.jump,
        x: !!this.keys['x'] || !!this.keys['X'] || this._gamepadState.attack,
        X: !!this.keys['x'] || !!this.keys['X'] || this._gamepadState.attack
      };

      // ações
      if (input[' '] || input['ArrowUp']) this.player.jump(this.audio);
      if (input['x'] || input['X']) this.player.attack(this.audio);

      this.player.update(this.gravity, level, input, this.canvas.height);

      // câmera
      this._cameraUpdate(level);

      // moedas
      for (const c of level.coins) {
        if (c.checkCollision(this.player)) {
          this.audio.playSfx('coin');
        }
      }

      // objetivo
      for (const g of level.goals) {
        // BUG CRÍTICO (boss): se chamar g.checkCollision(), ele marca reached=true.
        // Em fase de boss, só checa/ativa a meta quando o boss estiver morto.
        if (bossLevel && this.enemies && this.enemies.some((e) => e.type === 'boss' && e.alive)) {
          const colliding = (
            this.player.x < g.x + g.width &&
            this.player.x + this.player.width > g.x &&
            this.player.y < g.y + g.height &&
            this.player.y + this.player.height > g.y
          );
          if (colliding) {
            this.player.x = Math.max(0, this.player.x - 20);
          }
          continue;
        }

        if (!g.checkCollision(this.player)) continue;

        this.levelIndex++;
        if (this.levelIndex >= 50) {
          this._end(true);
          return;
        }

        // preserva score/vidas
        const score = this.player.score;
        const lives = this.player.lives;
        this.player = new SuperBario99.PlayerV2(60, 320);
        this.player.score = score;
        this.player.lives = lives;

        // nova seed a cada fase (layout novo)
        this.levelSeed = this._makeSeed();
        this._regenLevelForCurrentSeed();

        this._saveProgress(); // modo principal apenas

        this._setThemeForLevel();
        this.audio.playMusic();
        this._gridCacheLevelIndex = -1;
        this.enemies = this._buildEnemiesForLevel(this.levelIndex);

        this._nextAutosaveAt = now + 30000;

        // IMPORTANTÍSSIMO: encerra o frame aqui.
        // Senão, o restante do update ainda usa `level` antigo e dá bugs/soft-lock.
        return;
      }

      // inimigos
      if (!this.enemies) this.enemies = this._buildEnemiesForLevel(this.levelIndex);

      // hitbox ataque
      const hit = this.player.getAttackHitbox();

      for (const e of this.enemies) {
        if (!e.alive) continue;

        // Yokai usa A* em tiers superiores
        if (e.type === 'yokai') {
          this._ensureGridForLevel(this.levelIndex);
          e.update(level, this.player, diff, this.canvas.height);
        } else {
          e.update(level, this.player, diff);
        }

        // dano do player
        if (hit) {
          if (
            hit.x < e.x + e.width &&
            hit.x + hit.width > e.x &&
            hit.y < e.y + e.height &&
            hit.y + hit.height > e.y
          ) {
            if (e.type === 'boss') {
              e.takeDamage?.(1);
              this.audio.playSfx('bossHit');
              this.player.score += 45;
            } else {
              e.takeDamage?.();
              this.audio.playSfx('enemyDie');
              this.player.score += 80;
            }
          }
        }

        // colisão do inimigo com player
        const collided = e.checkPlayerCollision(this.player);
        if (collided) {
          this.audio.playSfx(e.type === 'boss' ? 'bossHit' : 'enemyDie');
        }
      }

      // Salva imediatamente quando vidas mudarem
      if (this._lastLives !== this.player.lives) {
        this._lastLives = this.player.lives;
        this._saveProgress();
        this._nextAutosaveAt = now + 30000;
      }

      if (this.player.lives <= 0) {
        return this._end(false);
      }

      // Autosave a cada 30s
      if (now && now >= this._nextAutosaveAt) {
        this._saveProgress();
        this._nextAutosaveAt = now + 30000;
      }

      // partículas
      this._updateParticles();
      this.audio.update();
      this._updateHud();
    }

    _drawGame() {
      const level = this._getLevel();
      const diff = SuperBario99.difficulty.getDifficulty(this.levelIndex);

      // AestheticId efetivo (fase ou override do Modo Livre)
      const aestheticId = (this._isFreeMode && this._freeConfig && this._freeConfig.aestheticId)
        ? this._freeConfig.aestheticId
        : (level.aestheticId || (SuperBario99.themes ? SuperBario99.themes.getAestheticIdForLevel(this.levelIndex) : 'windows-xp'));

      // Intensidade de efeito (Modo Livre)
      const effectIntensity = (this._isFreeMode && this._freeConfig && typeof this._freeConfig.effectIntensity === 'number')
        ? this._freeConfig.effectIntensity
        : 1;

      // Background passa a ser baseado na estética
      this._renderBackground(aestheticId, diff.nightMode);

      // plataformas, moedas, goal (por estética)
      for (const p of level.platforms) p.draw(this.ctx, this.cameraX, aestheticId);
      for (const c of level.coins) c.draw(this.ctx, this.cameraX, aestheticId);
      for (const g of level.goals) g.draw(this.ctx, this.cameraX, aestheticId);

      // inimigos (visual segue estética; IA/música seguem themeId no update/spawn)
      if (this.enemies) {
        for (const e of this.enemies) {
          if (e.alive) e.draw(this.ctx, this.cameraX, aestheticId);
        }
      }

      // partículas
      this._drawParticles();

      // player (por estética para casar com atmosfera)
      this.player.draw(this.ctx, this.cameraX, aestheticId);

      // overlays (scanlines/glitch/soft glow etc.)
      if (SuperBario99.themes && SuperBario99.themes.drawOverlay) {
        SuperBario99.themes.drawOverlay(this.ctx, this.canvas, aestheticId, performance.now(), effectIntensity);
      }

      // Karma (simples): bônus por stomp em vez de desviar (mostrado como texto)
      this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Karma: ${Math.floor(this.player.score / 250)}`, 20, 402);
    }

    _drawMenuPreview() {
      // Mostra prévia de estéticas no fundo do menu
      const previewThemes = ['windows-xp', 'fruitiger-aero', 'tecno-zen', 'dorfic', 'metro-aero', 'vaporwave', 'aurora-aero'];
      this.previewTimer++;
      if (this.previewTimer > 220) {
        this.previewTimer = 0;
        this.previewThemeIndex = (this.previewThemeIndex + 1) % previewThemes.length;
      }

      const themeId = previewThemes[this.previewThemeIndex];
      const night = (this.previewThemeIndex % 2 === 1);
      this._renderBackground(themeId, night);

      // desenha um "mini layout" genérico no preview
      const ctx = this.ctx;
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 380, this.canvas.width, 70);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(80 + i * 120, 320 - (i % 3) * 40, 90, 16);
      }

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '18px Arial';
      ctx.fillText(`Preview: ${themeId.toUpperCase()}`, 18, 28);
    }

    _loop(now) {
      if (this.running && this.player) {
        this._updateGame(now);
        if (this.running) this._drawGame();
      } else {
        // Menu/instruções: preview no fundo
        this._drawMenuPreview();
        this.audio.update();
      }

      requestAnimationFrame((t) => this._loop(t));
    }
  }

  SuperBario99.GameV2 = GameV2;
})();
