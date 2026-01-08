// Fases (v2) - geradas proceduralmente com variação de tema/layout/inimigos

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

      // Montanha/penhasco jogável (obstáculo): desenha como pedra em vez de "madeira"
      if (this.style === 'mountain') {
        // base rochosa por estética
        let rockA = 'rgba(0,0,0,0.25)';
        let rockB = 'rgba(255,255,255,0.10)';
        let ridge = 'rgba(255,255,255,0.12)';

        if (v === 'dorfic') { rockA = 'rgba(47,42,36,0.75)'; rockB = 'rgba(75,59,42,0.55)'; ridge = 'rgba(60,110,71,0.18)'; }
        else if (v === 'evil') { rockA = 'rgba(27,13,18,0.80)'; rockB = 'rgba(95,15,47,0.45)'; ridge = 'rgba(255,59,47,0.18)'; }
        else if (v === 'tecnozen') { rockA = 'rgba(26,31,43,0.78)'; rockB = 'rgba(35,213,255,0.14)'; ridge = 'rgba(166,107,255,0.16)'; }
        else if (v === 'metro') { rockA = 'rgba(43,47,54,0.78)'; rockB = 'rgba(192,200,209,0.20)'; ridge = 'rgba(74,163,255,0.16)'; }
        else if (v === 'vaporwave') { rockA = 'rgba(20,16,24,0.80)'; rockB = 'rgba(255,0,255,0.12)'; ridge = 'rgba(0,255,255,0.14)'; }
        else if (v === 'aurora-aero') { rockA = 'rgba(13,16,32,0.82)'; rockB = 'rgba(127,255,0,0.10)'; ridge = 'rgba(255,105,180,0.10)'; }
        else if (v === 'fruitiger') { rockA = 'rgba(44,62,80,0.72)'; rockB = 'rgba(111,231,255,0.12)'; ridge = 'rgba(255,255,255,0.12)'; }
        else if (v === 'windows-xp' || v === 'windows-vista') { rockA = 'rgba(0,0,0,0.32)'; rockB = 'rgba(255,255,255,0.14)'; ridge = 'rgba(0,120,215,0.12)'; }

        // preenchimento com gradiente vertical
        const g = ctx.createLinearGradient(0, this.y, 0, this.y + this.height);
        g.addColorStop(0, rockB);
        g.addColorStop(1, rockA);
        ctx.fillStyle = g;
        ctx.fillRect(x, this.y, this.width, this.height);

        // “crista” no topo (melhora leitura de onde pisar)
        ctx.fillStyle = ridge;
        ctx.fillRect(x, this.y, this.width, Math.min(8, Math.max(4, Math.floor(this.height * 0.12))));

        // textura de pedra (rachaduras leves)
        ctx.strokeStyle = 'rgba(0,0,0,0.16)';
        ctx.lineWidth = 2;
        const lines = Math.max(1, Math.min(6, Math.floor(this.width / 70)));
        for (let i = 0; i < lines; i++) {
          const ox = x + 10 + i * (this.width / lines);
          ctx.beginPath();
          ctx.moveTo(ox, this.y + 10);
          ctx.lineTo(ox - 12, this.y + this.height * 0.45);
          ctx.lineTo(ox + 8, this.y + this.height - 12);
          ctx.stroke();
        }
        return;
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

      // Extensões v2 (power-ups)
      this.blocks = [];
      this.items = [];

      // Obstáculos
      this.hazards = [];
    }
  }

  class Hazard {
    constructor(x, y, kind, opt = {}) {
      this.x = x;
      this.y = y;
      this.kind = kind; // 'spikes' | 'saw' | 'boulder' | 'flame' | 'laser'

      this.width = opt.width || (kind === 'saw' ? 28 : (kind === 'boulder' ? 30 : (kind === 'laser' ? 52 : 36)));
      this.height = opt.height || (kind === 'saw' ? 28 : (kind === 'boulder' ? 30 : (kind === 'flame' ? 28 : 18)));

      // serra móvel
      this._baseX = x;
      this._range = opt.range || 70;
      this._phase = opt.phase || 0;
      this._speed = opt.speed || 0.02;

      // flame/laser: ciclo on/off
      this._cycle = opt.cycle || 120;
      this._onFor = opt.onFor || 55;
      this._active = true;
    }

    update(now, timeScale = 1.0) {
      const ts = (typeof timeScale === 'number' && isFinite(timeScale)) ? Math.max(0.1, Math.min(1.0, timeScale)) : 1.0;
      if (this.kind === 'saw' || this.kind === 'boulder') {
        this._phase += this._speed * ts;
        this.x = this._baseX + Math.sin(this._phase) * this._range;
        return;
      }

      // hazards com pulso (flame/laser)
      if (this.kind === 'flame' || this.kind === 'laser') {
        const t0 = (typeof now === 'number') ? now : (typeof performance !== 'undefined' ? performance.now() : 0);
        const t = t0 * ts;
        const phase = Math.floor(t / 16) % Math.max(20, (this._cycle | 0));
        this._active = phase < Math.max(10, (this._onFor | 0));
      }
    }

    checkCollision(player) {
      if ((this.kind === 'flame' || this.kind === 'laser') && !this._active) return false;
      return (
        player.x < this.x + this.width &&
        player.x + player.width > this.x &&
        player.y < this.y + this.height &&
        player.y + player.height > this.y
      );
    }

    draw(ctx, cameraX, aestheticId) {
      const x = this.x - cameraX;
      const y = this.y;
      ctx.save();

      if (this.kind === 'spikes') {
        ctx.fillStyle = 'rgba(30,30,30,0.9)';
        const n = 4;
        const step = this.width / n;
        for (let i = 0; i < n; i++) {
          ctx.beginPath();
          ctx.moveTo(x + i * step, y + this.height);
          ctx.lineTo(x + i * step + step / 2, y);
          ctx.lineTo(x + (i + 1) * step, y + this.height);
          ctx.closePath();
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.strokeRect(x, y, this.width, this.height);
      } else if (this.kind === 'saw') {
        // saw
        ctx.fillStyle = 'rgba(200,200,200,0.75)';
        ctx.beginPath();
        ctx.arc(x + this.width / 2, y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(20,20,20,0.65)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + this.width / 2, y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.arc(x + this.width / 2, y + this.height / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.kind === 'boulder') {
        // boulder
        ctx.fillStyle = 'rgba(120,120,120,0.55)';
        ctx.beginPath();
        ctx.arc(x + this.width / 2, y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + this.width / 2, y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.stroke();
        // rachaduras
        ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 10);
        ctx.lineTo(x + 14, y + 16);
        ctx.lineTo(x + 8, y + 24);
        ctx.stroke();
      } else if (this.kind === 'flame') {
        // flame (pulsante)
        if (!this._active) {
          ctx.fillStyle = 'rgba(0,0,0,0.20)';
          ctx.fillRect(x, y + this.height - 6, this.width, 6);
        } else {
          const grd = ctx.createLinearGradient(0, y, 0, y + this.height);
          grd.addColorStop(0, 'rgba(255,255,255,0.85)');
          grd.addColorStop(0.25, 'rgba(255,210,0,0.85)');
          grd.addColorStop(1, 'rgba(255,59,47,0.55)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.moveTo(x + this.width * 0.5, y);
          ctx.quadraticCurveTo(x + this.width * 0.9, y + this.height * 0.55, x + this.width * 0.65, y + this.height);
          ctx.quadraticCurveTo(x + this.width * 0.5, y + this.height * 0.75, x + this.width * 0.35, y + this.height);
          ctx.quadraticCurveTo(x + this.width * 0.1, y + this.height * 0.55, x + this.width * 0.5, y);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(255,210,0,0.20)';
          ctx.fillRect(x - 8, y - 10, this.width + 16, this.height + 18);
        }
      } else if (this.kind === 'laser') {
        // laser (pulsante)
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(x, y + this.height - 4, this.width, 4);
        if (this._active) {
          ctx.fillStyle = 'rgba(0,255,255,0.22)';
          ctx.fillRect(x - 6, y - 6, this.width + 12, this.height + 12);
          ctx.fillStyle = 'rgba(0,255,255,0.65)';
          ctx.fillRect(x, y + Math.floor(this.height / 2) - 2, this.width, 4);
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.fillRect(x + 4, y + Math.floor(this.height / 2) - 1, this.width - 8, 2);
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,0.20)';
          ctx.strokeRect(x, y + Math.floor(this.height / 2) - 2, this.width, 4);
        }
      }

      ctx.restore();
    }
  }

  const WORLD_GROUND_Y = 360; // sobe o chão para dar mais área jogável vertical
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
    const baseWidth = 3200 + levelIndex * 180;
    const worldWidth = Math.min(11000, baseWidth);

    const level = new Level({ index: levelIndex, themeId, aestheticId, worldWidth });
    addGround(level);

    // Gera "ilhas" de plataformas
    const segmentCount = 14 + Math.floor(levelIndex * 0.6);
    // Gaps precisam respeitar alcance do pulo com velocidade/controle atuais.
    const minGap = 80;
    const maxGap = 190 + Math.floor(levelIndex * 1.8);

    let x = 180;
    let lastY = 300;
    for (let i = 0; i < segmentCount; i++) {
      const w = 80 + Math.floor(rng() * 120);
      const h = 20;
      // Altura mais suave (evita plataformas "longe" verticalmente)
      const delta = Math.floor((rng() - 0.5) * 120);
      lastY = Math.max(160, Math.min(320, lastY + delta + (diff.nightMode ? 10 : 0)));
      const y = lastY;

      level.platforms.push(new Platform(x, y, w, h));

      // Montanha escalável (escadinha de plataformas)
      // cria um trecho que o player pode subir (sem colisão especial)
      if (levelIndex > 3 && rng() < 0.16 && w >= 110 && y >= 220 && x > 320 && (x + 360) < (level.worldWidth - 240)) {
        const steps = 6 + Math.floor(rng() * 3);
        const stepW = 56;
        const stepH = 18;
        const stepRise = 22;
        for (let s = 0; s < steps; s++) {
          level.platforms.push(new Platform(x + 30 + s * (stepW - 6), y - 40 - s * stepRise, stepW, stepH));
        }
      }

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

    // Montanhas jogáveis como obstáculo real (paredão + escadas).
    // Ideia: bloquear o chão em 1~2 pontos para forçar escalada.
    try {
      const mountCount = (levelIndex > 6) ? ((rng() < 0.55) ? 1 : 2) : (levelIndex > 2 && rng() < 0.35 ? 1 : 0);
      const groundBottom = WORLD_GROUND_Y + WORLD_GROUND_H;

      // parâmetros das escadas (usados também para reservar área)
      const stepW = 56;
      const stepH = 18;
      const stepRise = 22;
      const maxStepsUp = 11;
      const maxStepsDown = 8;
      const maxWallW = 112; // 84..111

      const reserveLeft = 80 + 40 + ((maxStepsUp - 1) * (stepW - 10)) + stepW;
      const reserveRight = 80 + maxWallW + 18 + ((maxStepsDown - 1) * (stepW - 12)) + stepW;

      const overlapsAny = (x0, x1, y0, y1) => {
        for (const p of (level.platforms || [])) {
          if (p === level.platforms[0]) continue; // ignora o chão gigante
          const hit = (x0 < (p.x + p.width) && x1 > p.x && y0 < (p.y + p.height) && y1 > p.y);
          if (hit) return true;
        }
        return false;
      };

      for (let m = 0; m < mountCount; m++) {
        let tries = 0;
        let mx = 0;
        while (tries++ < 12) {
          mx = 720 + Math.floor(rng() * Math.max(600, worldWidth - 1600));
          // evita muito perto do final
          if (mx > worldWidth - 700) continue;
          // área “vazia” para não sobrepor plataformas pequenas
          if (overlapsAny(mx - reserveLeft, mx + reserveRight, 120, WORLD_GROUND_Y)) continue;
          break;
        }
        if (!mx) continue;

        const peakY = Math.max(150, Math.min(250, 170 + Math.floor(rng() * 90)));
        const wallW = 84 + Math.floor(rng() * 28);
        const wallH = Math.max(80, groundBottom - peakY);

        // paredão (sólido) = montanha
        level.platforms.push(new Platform(mx, peakY, wallW, wallH, 'mountain'));

        // escadas para subir (lado esquerdo)
        // BUG: em picos altos (peakY baixo), as escadas antigas não alcançavam a altura do paredão.
        // Agora calculamos a quantidade mínima pra alcançar o topo (ou bem próximo dele).
        const baseStepY = WORLD_GROUND_Y - stepH;
        const desiredTopY = Math.max(120, Math.min(baseStepY - 44, peakY + 14));
        const neededSteps = 1 + Math.max(0, Math.ceil((baseStepY - desiredTopY) / stepRise));
        let stepsUp = Math.max(7, Math.min(maxStepsUp, neededSteps));
        if (stepsUp < maxStepsUp && rng() < 0.35) stepsUp++;

        // Deixa um vão para não sobrepor o paredão (evita degrau “dentro” da parede)
        const wallGap = 10;
        const lastStepX = mx - wallGap - stepW;
        for (let s = 0; s < stepsUp; s++) {
          const sx = lastStepX - (stepsUp - 1 - s) * (stepW - 10);
          const sy = baseStepY - s * stepRise;
          level.platforms.push(new Platform(sx, sy, stepW, stepH, 'mountain'));
          // moedas guiando a subida
          if (s % 2 === 0) level.coins.push(new Coin(sx + 18, sy - 26));
        }

        // descida (lado direito)
        const stepsDown = 6 + Math.floor(rng() * 2);
        for (let s = 0; s < stepsDown; s++) {
          const sx = mx + wallW + 18 + s * (stepW - 12);
          const sy = peakY + 10 + s * stepRise;
          if (sy >= (WORLD_GROUND_Y - 10)) break;
          level.platforms.push(new Platform(sx, sy, stepW, stepH, 'mountain'));
          if (s === 0) level.coins.push(new Coin(sx + 18, sy - 26));
        }
      }
    } catch (_) {}

    // Meta no fim
    level.goals.push(new Goal(worldWidth - 120, WORLD_GROUND_Y - GOAL_H));

    // Question blocks (se o módulo estiver carregado)
    try {
      if (SuperBario99.questionBlocks && SuperBario99.questionBlocks.addQuestionBlocksToLevel) {
        SuperBario99.questionBlocks.addQuestionBlocksToLevel(level, levelIndex, rng);
      }
    } catch (_) {}

    // Obstáculos (espinhos/serras + novos hazards)
    try {
      const hazardCount = Math.max(1, Math.min(6, 1 + Math.floor(levelIndex / 10)));
      const candidates = (level.platforms || []).filter((p) => p.width >= 120 && p.width <= 260 && p.y <= 340 && p.x > 260 && p.x < (level.worldWidth - 260));
      for (let i = 0; i < hazardCount && candidates.length; i++) {
        const idx = Math.floor(rng() * candidates.length);
        const p = candidates.splice(idx, 1)[0];

        const blocksNear = (level.blocks || []).filter((b) => {
          const horizontallyOnPlatform = (b.x + b.width) > p.x && b.x < (p.x + p.width);
          const verticallyAbove = b.y < p.y && (p.y - b.y) < 90;
          return horizontallyOnPlatform && verticallyAbove;
        });

        // seleção por estética (mantém coerência visual)
        const v = (String(aestheticId || '').toLowerCase());
        const canLaser = (v.includes('tecno') || v.includes('metro') || v.includes('windows') || v.includes('vapor'));
        const canFlame = (v.includes('evil') || v.includes('dorfic') || v.includes('vapor') || v.includes('memefusion'));
        const canBoulder = (v.includes('dorfic') || v.includes('evil'));

        let kind = 'spikes';
        const r0 = rng();
        if (r0 < 0.55) kind = 'spikes';
        else if (r0 < 0.76) kind = 'saw';
        else if (canBoulder && r0 < 0.84) kind = 'boulder';
        else if (canFlame && r0 < 0.92) kind = 'flame';
        else if (canLaser) kind = 'laser';

        // tenta escolher posição longe de blocos da plataforma
        let hx = 0;
        let tries = 0;
        do {
          hx = Math.floor(p.x + 20 + rng() * Math.max(1, p.width - 80));
          tries++;
        } while (tries < 5 && blocksNear.some((b) => Math.abs((hx + 18) - (b.x + b.width / 2)) < 72));

        // se não achou posição segura, pula este hazard
        if (blocksNear.length && blocksNear.some((b) => Math.abs((hx + 18) - (b.x + b.width / 2)) < 72)) {
          continue;
        }

        const hy = Math.floor(p.y - (kind === 'saw' ? 26 : (kind === 'boulder' ? 30 : (kind === 'flame' ? 28 : 18))));

        if (kind === 'saw') {
          level.hazards.push(new Hazard(hx, hy, 'saw', { range: 60 + Math.floor(rng() * 50), phase: rng() * Math.PI * 2, speed: 0.02 + rng() * 0.02 }));
        } else if (kind === 'boulder') {
          level.hazards.push(new Hazard(hx, hy, 'boulder', { range: 70 + Math.floor(rng() * 70), phase: rng() * Math.PI * 2, speed: 0.016 + rng() * 0.018 }));
        } else if (kind === 'flame') {
          level.hazards.push(new Hazard(hx, hy, 'flame', { width: 28, height: 28, cycle: 110 + Math.floor(rng() * 80), onFor: 42 + Math.floor(rng() * 26) }));
        } else if (kind === 'laser') {
          level.hazards.push(new Hazard(hx, hy + 8, 'laser', { width: 58 + Math.floor(rng() * 36), height: 14, cycle: 140 + Math.floor(rng() * 80), onFor: 48 + Math.floor(rng() * 30) }));
        } else {
          level.hazards.push(new Hazard(hx, hy, 'spikes', { width: 36 + Math.floor(rng() * 20), height: 18 }));
        }
      }
    } catch (_) {}

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

  function createLevels(count) {
    const n = Math.max(1, Math.min(199, (count | 0) || 50));
    const levels = [];
    for (let i = 0; i < n; i++) {
      const rng = mulberry32(1000 + i * 999);
      levels.push(generateLayout(i, rng));
    }
    return levels;
  }

  function createLevels50() {
    return createLevels(50);
  }

  function createLevels99() {
    return createLevels(99);
  }

  function createLevels100() {
    return createLevels(100);
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
    Hazard,
    Level,
    createLevels35,
    createLevels50,
    createLevels99,
    createLevels100,
    createLevel
  };
})();
