// 50 Fases (v2) - geradas proceduralmente com variação de tema/layout/inimigos

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

      // Normaliza IDs (aceita themeId antigo e aestheticId novo)
      const id = (themeId || 'japan');
      const v = (id === 'fruitiger-aero') ? 'fruitiger'
        : (id === 'metro-aero') ? 'metro'
        : (id === 'tecno-zen') ? 'tecnozen'
        : (id === 'windows-xp') ? 'windows-xp'
        : (id === 'windows-vista') ? 'windows-vista'
        : (id === 'vaporwave') ? 'vaporwave'
        : (id === 'aurora-aero') ? 'aurora-aero'
        : id;

      // Plataforma "japonesa" (madeira + bambu) como base
      let base = '#8B4513';
      let trim = '#A0522D';
      let bamboo = '#6ab04c';

      if (v === 'tecnozen') {
        base = '#1a1f2b'; trim = '#23d5ff'; bamboo = '#a66bff';
      } else if (v === 'dorfic') {
        base = '#2f2a24'; trim = '#4b3b2a'; bamboo = '#3c6e47';
      } else if (v === 'metro') {
        base = '#2b2f36'; trim = '#c0c8d1'; bamboo = '#4aa3ff';
      } else if (v === 'evil') {
        base = '#1b0d12'; trim = '#ff3b2f'; bamboo = '#5f0f2f';
      } else if (v === 'fruitiger') {
        base = '#4b6cb7'; trim = '#dbe6ff'; bamboo = '#6fe7ff';
      } else if (v === 'memefusion') {
        base = '#3a2f5b'; trim = '#ffd27d'; bamboo = '#7dffb2';
      } else if (v === 'windows-xp') {
        base = '#ECE9D8'; trim = '#0055E5'; bamboo = '#00CC00';
      } else if (v === 'windows-vista') {
        base = 'rgba(192,192,192,0.70)'; trim = '#0078D7'; bamboo = 'rgba(255,255,255,0.65)';
      } else if (v === 'vaporwave') {
        base = '#141018'; trim = '#FF00FF'; bamboo = '#00FFFF';
      } else if (v === 'aurora-aero') {
        base = '#0d1020'; trim = '#7FFF00'; bamboo = '#FF69B4';
      }

      ctx.fillStyle = base;
      ctx.fillRect(x, this.y, this.width, this.height);

      // Vaporwave: textura de mármore simples (veios leves)
      if (v === 'vaporwave') {
        ctx.strokeStyle = 'rgba(212,175,55,0.25)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const ox = x + 10 + i * 22;
          ctx.beginPath();
          ctx.moveTo(ox, this.y + 4);
          ctx.bezierCurveTo(ox + 18, this.y + 6, ox - 10, this.y + this.height - 6, ox + 28, this.y + this.height - 4);
          ctx.stroke();
        }
      }

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

      const id = (themeId || 'japan');
      const v = (id === 'fruitiger-aero') ? 'fruitiger'
        : (id === 'metro-aero') ? 'metro'
        : (id === 'tecno-zen') ? 'tecnozen'
        : (id === 'windows-xp') ? 'windows-xp'
        : (id === 'windows-vista') ? 'windows-vista'
        : (id === 'vaporwave') ? 'vaporwave'
        : (id === 'aurora-aero') ? 'aurora-aero'
        : id;

      let color = '#FFD700';
      if (v === 'tecnozen') color = '#00FFFF';
      if (v === 'metro') color = '#C0C0C0';
      if (v === 'vaporwave') color = '#00FFFF';
      if (v === 'aurora-aero') color = '#FFD700';
      if (v === 'windows-xp' || v === 'windows-vista') color = '#FFD700';

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

      const id = (themeId || 'japan');
      const v = (id === 'fruitiger-aero') ? 'fruitiger'
        : (id === 'metro-aero') ? 'metro'
        : (id === 'tecno-zen') ? 'tecnozen'
        : (id === 'windows-xp') ? 'windows-xp'
        : (id === 'windows-vista') ? 'windows-vista'
        : (id === 'vaporwave') ? 'vaporwave'
        : (id === 'aurora-aero') ? 'aurora-aero'
        : id;

      // Torii/portal estilizado (japan) ou variações por estética
      if (v === 'japan') {
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(x, this.y + 18, 6, this.height - 18);
        ctx.fillRect(x + 26, this.y + 18, 6, this.height - 18);
        ctx.fillRect(x - 8, this.y + 12, 48, 8);
        ctx.fillRect(x - 4, this.y + 4, 40, 8);
        ctx.fillStyle = '#f5f6fa';
        ctx.fillRect(x + 14, this.y + 24, 4, 8);
        return;
      }

      if (v === 'windows-xp') {
        // "janela" + bandeira estilo Windows
        ctx.fillStyle = '#0055E5';
        ctx.fillRect(x - 6, this.y + 8, 44, 48);
        ctx.fillStyle = '#ECE9D8';
        ctx.fillRect(x - 4, this.y + 10, 40, 10);
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 2, this.y + 24, 36, 28);

        // bandeira (4 cores)
        ctx.fillStyle = '#ff3b2f';
        ctx.fillRect(x + 2, this.y + 28, 10, 10);
        ctx.fillStyle = '#39FF14';
        ctx.fillRect(x + 12, this.y + 28, 10, 10);
        ctx.fillStyle = '#00BFFF';
        ctx.fillRect(x + 2, this.y + 38, 10, 10);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + 12, this.y + 38, 10, 10);
        return;
      }

      if (v === 'windows-vista') {
        ctx.fillStyle = 'rgba(0,120,215,0.55)';
        ctx.fillRect(x - 10, this.y + 6, 52, 52);
        ctx.fillStyle = 'rgba(255,255,255,0.20)';
        ctx.fillRect(x - 8, this.y + 8, 48, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 4, this.y + 30, 24, 18);
        return;
      }

      if (v === 'tecnozen') {
        ctx.strokeStyle = 'rgba(0,255,255,0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + 16, this.y + 34, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(57,255,20,0.25)';
        ctx.fillRect(x + 10, this.y + 18, 12, 34);
        return;
      }

      if (v === 'metro') {
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(x, this.y + 18, 4, this.height - 18);
        ctx.fillStyle = '#0066CC';
        ctx.fillRect(x + 6, this.y + 12, 26, 18);
        ctx.fillStyle = '#39FF14';
        ctx.beginPath();
        ctx.arc(x + 28, this.y + 21, 5, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      if (v === 'vaporwave') {
        // portal neon
        ctx.strokeStyle = 'rgba(255,0,255,0.90)';
        ctx.lineWidth = 4;
        ctx.strokeRect(x - 6, this.y + 6, 44, 54);
        ctx.strokeStyle = 'rgba(0,255,255,0.75)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 2, this.y + 10, 36, 46);
        return;
      }

      if (v === 'aurora-aero') {
        ctx.strokeStyle = 'rgba(255,215,0,0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + 16, this.y + 34, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(127,255,0,0.35)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(x + 16, this.y + 34, 14, 0, Math.PI * 2);
        ctx.stroke();
        return;
      }

      // Bandeira genérica para outros temas
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x, this.y, 4, this.height);
      ctx.fillStyle = (v === 'evil') ? '#ff3b2f' : '#00d2ff';
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
    constructor({ index, themeId, aestheticId, worldWidth }) {
      this.index = index;
      this.themeId = themeId;
      this.aestheticId = aestheticId;
      this.worldWidth = worldWidth;
      this.platforms = [];
      this.coins = [];
      this.goals = [];
    }
  }

  const WORLD_GROUND_Y = 380; // antes 400 (plataformas estavam muito baixas)
  const WORLD_GROUND_H = 50;
  const GOAL_H = 64;

  function addGround(level) {
    level.platforms.push(new Platform(0, WORLD_GROUND_Y, level.worldWidth, WORLD_GROUND_H));
  }

  function generateLayout(levelIndex, rng) {
    const themeId = SuperBario99.difficulty.getThemeId(levelIndex);
    const diff = SuperBario99.difficulty.getDifficulty(levelIndex);
    const aestheticId = (SuperBario99.themes && SuperBario99.themes.getAestheticIdForLevel)
      ? SuperBario99.themes.getAestheticIdForLevel(levelIndex)
      : themeId;

    // largura cresce com a progressão
    // Mais longas: começo já maior e cresce mais por fase.
    // Mantém um teto para não explodir custo de render/IA em mobile.
    const baseWidth = 2200 + levelIndex * 120;
    const worldWidth = Math.min(7200, baseWidth);

    const level = new Level({ index: levelIndex, themeId, aestheticId, worldWidth });
    addGround(level);

    // Gera "ilhas" de plataformas
    const segmentCount = 10 + Math.floor(levelIndex / 2);
    // Gaps precisam respeitar alcance do pulo com velocidade/controle atuais.
    const minGap = 80;
    const maxGap = 160 + Math.floor(levelIndex * 1.4);

    let x = 180;
    let lastY = 320;
    for (let i = 0; i < segmentCount; i++) {
      const w = 80 + Math.floor(rng() * 120);
      const h = 20;
      // Altura mais suave (evita plataformas "longe" verticalmente)
      const delta = Math.floor((rng() - 0.5) * 120);
      lastY = Math.max(180, Math.min(340, lastY + delta + (diff.nightMode ? 10 : 0)));
      const y = lastY;

      level.platforms.push(new Platform(x, y, w, h));

      // moedas acima
      const coinCount = 1 + Math.floor(rng() * 3);
      for (let c = 0; c < coinCount; c++) {
        level.coins.push(new Coin(x + 12 + c * 22, y - 28));
      }

      // evita "buracos" exagerados (não gerar fases impossíveis)
      const gap = Math.floor(minGap + rng() * (maxGap - minGap));
      x += w + Math.min(gap, 210);
      if (x > worldWidth - 380) break;
    }

    // Meta no fim
    level.goals.push(new Goal(worldWidth - 120, WORLD_GROUND_Y - GOAL_H));

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

  function createLevels50() {
    const levels = [];
    for (let i = 0; i < 50; i++) {
      const rng = mulberry32(1000 + i * 999);
      levels.push(generateLayout(i, rng));
    }
    return levels;
  }

  // compatibilidade
  function createLevels35() {
    return createLevels50();
  }

  // Cria 1 fase com seed variável (para layout mudar a cada tentativa)
  function createLevel(levelIndex, seed) {
    const safeSeed = (Number.isFinite(seed) ? seed : (Date.now() >>> 0)) >>> 0;
    const rng = mulberry32(safeSeed);
    return generateLayout(levelIndex, rng);
  }

  SuperBario99.levelsV2 = {
    Platform,
    Coin,
    Goal,
    Level,
    createLevels35,
    createLevels50,
    createLevel
  };
})();
