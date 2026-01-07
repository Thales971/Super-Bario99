// Game v2: estética Japão Retro/Anime + 35 fases procedurais + inimigos com IA
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

      this.levels = [];
      this.levelIndex = 0;
      this.player = null;
      this.cameraX = 0;

      this.enemies = null;

      this.particles = [];
      this.sakura = [];

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
      this.levels = SuperBario99.levelsV2.createLevels35();
      this._spawnMenuSakura();

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

      this.continueBtn.addEventListener('click', () => this.loadGame());
      this.startBtn.addEventListener('click', () => this.start());
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
    }

    async start() {
      // Limpa save ao começar do zero
      localStorage.removeItem(this.saveKey);
      this._checkSave();

      this.audio.init();
      await this.audio.resume();

      this.running = true;
      this.levelIndex = 0;
      this.player = new SuperBario99.PlayerV2(60, 320);
      this.cameraX = 0;
      this.particles.length = 0;

      this.enemies = this._buildEnemiesForLevel(this.levelIndex);

      this._setThemeForLevel();
      this.audio.playMusic();

      this.menu.style.display = 'none';
      this.instructions.style.display = 'none';
      this.endScreen.style.display = 'none';

      this._updateHud();
      this._spawnMenuSakura();
      
      this._saveProgress();
    }

    async loadGame() {
      const saveRaw = localStorage.getItem(this.saveKey);
      if (!saveRaw) return this.start();

      try {
        const data = JSON.parse(saveRaw);
        this.audio.init();
        await this.audio.resume();

        this.running = true;
        this.levelIndex = data.levelIndex || 0;
        this.player = new SuperBario99.PlayerV2(60, 320);
        this.player.score = data.score || 0;
        this.player.lives = (data.lives > 0) ? data.lives : 10;
        
        this.cameraX = 0;
        this.particles.length = 0;

        this.enemies = this._buildEnemiesForLevel(this.levelIndex);
        this._setThemeForLevel();
        this.audio.playMusic();

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
      const data = {
        levelIndex: this.levelIndex,
        score: this.player.score,
        lives: this.player.lives
      };
      localStorage.setItem(this.saveKey, JSON.stringify(data));
      this._checkSave();
    }

    goToMenu() {
      this.running = false;
      this.audio.stopMusic();

      // tema/música do menu
      this.audio.setTheme('menu');
      this.audio.playMusic();

      this.enemies = null;
      this.menu.style.display = 'flex';
      this.instructions.style.display = 'none';
      this.endScreen.style.display = 'none';
      this.bestDisplay.textContent = `Recorde: ${this.bestScore}`;
    }

    _setThemeForLevel() {
      const themeId = SuperBario99.difficulty.getThemeId(this.levelIndex);
      const boss = this._isBossLevel(this.levelIndex);
      this.audio.setTheme(boss ? `boss_${themeId}` : themeId);
    }

    _isBossLevel(levelIndex) {
      // níveis 5,10,15,20,25,30,35
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
        let seed = 777 + levelIndex * 1337;
        return () => {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          return seed / 4294967296;
        };
      })();

      const enemies = [];

      // Boss no fim do bloco
      if (this._isBossLevel(levelIndex)) {
        const bx = Math.max(420, level.worldWidth - 520);
        const by = 290;
        enemies.push(new SuperBario99.ThemeBoss(bx, by, themeId, levelIndex));

        const extra = diff.tier === 'advanced' ? 2 : 1;
        for (let i = 0; i < extra; i++) {
          const x = bx - 220 - i * 90;
          const y = 260 + Math.floor(rng() * 70);
          enemies.push(new SuperBario99.DroneEnemy(x, y));
        }

        return enemies;
      }

      // Random real por estética (pesos por tema)
      const tables = {
        japan: [
          { w: 3, make: (x, y) => new SuperBario99.NinjaEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.SamuraiEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.TanukiEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.KitsuneEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.YokaiEnemy(x, y) }
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

      const table = tables[themeId] || tables.japan;
      const totalW = table.reduce((a, it) => a + it.w, 0);
      const pickOne = () => {
        let r = rng() * totalW;
        for (const it of table) {
          r -= it.w;
          if (r <= 0) return it;
        }
        return table[0];
      };

      const count = 3 + Math.floor(levelIndex / 2) + diff.spawnExtra;
      for (let i = 0; i < count; i++) {
        const x = 320 + Math.floor(rng() * (level.worldWidth - 520));
        const y = 260 + Math.floor(rng() * 80);
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
      this.levelDisplay.textContent = `Fase: ${this.levelIndex + 1}/35`;
      this.bestDisplay.textContent = `Recorde: ${this.bestScore}`;
    }

    _end(victory) {
      if (victory) {
        // Zera o save se zerou o jogo
        localStorage.removeItem(this.saveKey);
      } else {
        // Se morreu, mantemos o save da ÚLTIMA fase alcançada (mas pode resetar score/vida se quiser dificultar)
        // Aqui, optei por manter o save intacto como estava no início da fase, 
        // para o jogador tentar de novo com o botão "Continuar" no menu.
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

      if (themeId === 'japan') {
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

    _updateGame() {
      const level = this._getLevel();
      const diff = SuperBario99.difficulty.getDifficulty(this.levelIndex);
      const themeId = level.themeId;
      const bossLevel = this._isBossLevel(this.levelIndex);

      // ações
      if (this.keys[' '] || this.keys['ArrowUp']) this.player.jump(this.audio);
      if (this.keys['x'] || this.keys['X']) this.player.attack(this.audio);

      this.player.update(this.gravity, level, this.keys);

      // câmera
      this._cameraUpdate(level);

      // moedas
      for (const c of level.coins) {
        if (c.checkCollision(this.player)) {
          this.audio.playSfx('coin');
          this._spawnCoinParticles(c.x + 8, c.y + 8, themeId);
        }
      }

      // objetivo
      for (const g of level.goals) {
        if (g.checkCollision(this.player)) {
          // Em fase de boss, só libera a meta quando o boss cair
          if (bossLevel && this.enemies && this.enemies.some((e) => e.type === 'boss' && e.alive)) {
            this.player.x = Math.max(0, this.player.x - 20);
            break;
          }

          this.levelIndex++;
          if (this.levelIndex >= 35) {
            return this._end(true);
          }

          // preserva score/vidas
          const score = this.player.score;
          const lives = this.player.lives;
          this.player = new SuperBario99.PlayerV2(60, 320);
          this.player.score = score;
          this.player.lives = lives;

          this._saveProgress(); // Salva ao passar de fase

          this._setThemeForLevel();
          this.audio.playMusic();
          this._gridCacheLevelIndex = -1;
          this.enemies = this._buildEnemiesForLevel(this.levelIndex);
          break;
        }
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

      if (this.player.lives <= 0) {
        return this._end(false);
      }

      // partículas
      this._updateParticles();
      this.audio.update();
      this._updateHud();
    }

    _drawGame() {
      const level = this._getLevel();
      const diff = SuperBario99.difficulty.getDifficulty(this.levelIndex);

      this._renderBackground(level.themeId, diff.nightMode);

      // plataformas, moedas, goal
      for (const p of level.platforms) p.draw(this.ctx, this.cameraX, level.themeId);
      for (const c of level.coins) c.draw(this.ctx, this.cameraX, level.themeId);
      for (const g of level.goals) g.draw(this.ctx, this.cameraX, level.themeId);

      // inimigos
      if (this.enemies) {
        for (const e of this.enemies) {
          if (e.alive) e.draw(this.ctx, this.cameraX, level.themeId);
        }
      }

      // partículas
      this._drawParticles();

      // player
      this.player.draw(this.ctx, this.cameraX, level.themeId);

      // Karma (simples): bônus por stomp em vez de desviar (mostrado como texto)
      this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Karma: ${Math.floor(this.player.score / 250)}`, 20, 402);
    }

    _drawMenuPreview() {
      // Mostra prévia de temas/fases no fundo do menu
      const previewThemes = ['japan', 'fruitiger', 'tecnozen', 'dorfic', 'metro', 'evil', 'memefusion'];
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
        this._updateGame();
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
