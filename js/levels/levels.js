// 35 Fases (v2) - geradas proceduralmente com variação de tema/layout/inimigos

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  class Platform {
    constructor(x, y, width, height, style = 'wood') {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.style = style;
    }

    draw(ctx, cameraX, themeId) {
      const x = this.x - cameraX;

      // Plataforma "japonesa" (madeira + bambu) como base
      let base = '#8B4513';
      let trim = '#A0522D';
      let bamboo = '#6ab04c';

      if (themeId === 'tecnozen') {
        base = '#1a1f2b'; trim = '#23d5ff'; bamboo = '#a66bff';
      } else if (themeId === 'dorfic') {
        base = '#2f2a24'; trim = '#4b3b2a'; bamboo = '#3c6e47';
      } else if (themeId === 'metro') {
        base = '#2b2f36'; trim = '#c0c8d1'; bamboo = '#4aa3ff';
      } else if (themeId === 'evil') {
        base = '#1b0d12'; trim = '#ff3b2f'; bamboo = '#5f0f2f';
      } else if (themeId === 'fruitiger') {
        base = '#4b6cb7'; trim = '#dbe6ff'; bamboo = '#6fe7ff';
      } else if (themeId === 'memefusion') {
        base = '#3a2f5b'; trim = '#ffd27d'; bamboo = '#7dffb2';
      }

      ctx.fillStyle = base;
      ctx.fillRect(x, this.y, this.width, this.height);

      ctx.fillStyle = trim;
      ctx.fillRect(x, this.y + this.height - 4, this.width, 4);

      // detalhe "bambu" discreto
      ctx.fillStyle = bamboo;
      for (let i = 0; i < Math.floor(this.width / 48); i++) {
        ctx.fillRect(x + 12 + i * 48, this.y + 6, 10, this.height - 12);
      }
    }
  }

  class Coin {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 16;
      this.height = 16;
      this.collected = false;
    }

    draw(ctx, cameraX, themeId) {
      if (this.collected) return;
      const x = this.x - cameraX;

      let color = '#FFD700';
      if (themeId === 'tecnozen') color = '#23d5ff';
      if (themeId === 'evil') color = '#ff3b2f';
      if (themeId === 'metro') color = '#c0c8d1';

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(x + this.width / 2 - 2, this.y + this.height / 2 - 2, this.width / 6, 0, Math.PI * 2);
      ctx.fill();
    }

    checkCollision(player) {
      if (this.collected) return false;
      const collision = (
        player.x < this.x + this.width &&
        player.x + player.width > this.x &&
        player.y < this.y + this.height &&
        player.y + player.height > this.y
      );
      if (collision) {
        this.collected = true;
        player.score += 100;
        return true;
      }
      return false;
    }
  }

  class Goal {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 32;
      this.height = 64;
      this.reached = false;
    }

    draw(ctx, cameraX, themeId) {
      const x = this.x - cameraX;

      // Torii/portal estilizado (japan) ou variações por tema
      if (themeId === 'japan') {
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(x, this.y + 18, 6, this.height - 18);
        ctx.fillRect(x + 26, this.y + 18, 6, this.height - 18);
        ctx.fillRect(x - 8, this.y + 12, 48, 8);
        ctx.fillRect(x - 4, this.y + 4, 40, 8);
        ctx.fillStyle = '#f5f6fa';
        ctx.fillRect(x + 14, this.y + 24, 4, 8);
        return;
      }

      // Bandeira genérica para outros temas
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x, this.y, 4, this.height);
      ctx.fillStyle = themeId === 'evil' ? '#ff3b2f' : '#00d2ff';
      ctx.fillRect(x + 4, this.y, 24, 24);
    }

    checkCollision(player) {
      if (this.reached) return false;
      const collision = (
        player.x < this.x + this.width &&
        player.x + player.width > this.x &&
        player.y < this.y + this.height &&
        player.y + player.height > this.y
      );
      if (collision) {
        this.reached = true;
        return true;
      }
      return false;
    }
  }

  class Level {
    constructor({ index, themeId, worldWidth }) {
      this.index = index;
      this.themeId = themeId;
      this.worldWidth = worldWidth;
      this.platforms = [];
      this.coins = [];
      this.goals = [];
    }
  }

  function addGround(level) {
    level.platforms.push(new Platform(0, 400, level.worldWidth, 50));
  }

  function generateLayout(levelIndex, rng) {
    const themeId = SuperBario99.difficulty.getThemeId(levelIndex);
    const diff = SuperBario99.difficulty.getDifficulty(levelIndex);

    // largura cresce com a progressão
    const baseWidth = 1600 + levelIndex * 70;
    const worldWidth = Math.min(5200, baseWidth);

    const level = new Level({ index: levelIndex, themeId, worldWidth });
    addGround(level);

    // Gera "ilhas" de plataformas
    const segmentCount = 8 + Math.floor(levelIndex / 2);
    const minGap = 120;
    const maxGap = 240 + Math.floor(levelIndex * 2.5);

    let x = 180;
    for (let i = 0; i < segmentCount; i++) {
      const w = 80 + Math.floor(rng() * 120);
      const h = 20;
      const yBase = 340 - Math.floor(rng() * 160);
      const y = Math.max(120, Math.min(360, yBase + (diff.nightMode ? 10 : 0)));

      level.platforms.push(new Platform(x, y, w, h));

      // moedas acima
      const coinCount = 1 + Math.floor(rng() * 3);
      for (let c = 0; c < coinCount; c++) {
        level.coins.push(new Coin(x + 12 + c * 22, y - 28));
      }

      x += w + Math.floor(minGap + rng() * (maxGap - minGap));
      if (x > worldWidth - 380) break;
    }

    // Meta no fim
    level.goals.push(new Goal(worldWidth - 120, 336));

    return level;
  }

  // RNG determinístico por fase
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createLevels35() {
    const levels = [];
    for (let i = 0; i < 35; i++) {
      const rng = mulberry32(1000 + i * 999);
      levels.push(generateLayout(i, rng));
    }
    return levels;
  }

  SuperBario99.levelsV2 = {
    Platform,
    Coin,
    Goal,
    Level,
    createLevels35
  };
})();
