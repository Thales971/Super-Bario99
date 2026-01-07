// Yokai (v2): persegue com pathfinding A* (coarse grid)
window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const SPRITE = {
    idle: [
      '....HHHHHH....',
      '...HGGGGGGH...',
      '...GEE..EEG...',
      '...GEE..EEG...',
      '...GGGGGGGG...',
      '..GGGGGGGGGG..',
      '..GGGMMMMGGG..',
      '....GGGGGG....',
      '...GGGGGGGG...',
      '...GGGGGGGG...',
      '...PPGGGGPP...',
      '...PPGGGGPP...',
      '....PP..PP....',
      '....PP..PP....'
    ],
    float: [
      '....HHHHHH....',
      '...HGGGGGGH...',
      '...GEE..EEG...',
      '...GEE..EEG...',
      '...GGGGGGGG...',
      '..GGGGGGGGGG..',
      '..GGGMMMMGGG..',
      '....GGGGGG....',
      '...GGGGGGGG...',
      '...GGGGGGGG...',
      '....PP..PP....',
      '...PP....PP...',
      '..............',
      '..............'
    ]
  };

  function _drawPixelSprite(ctx, sprite, x, y, boxW, boxH, palette, flip) {
    const h = sprite.length;
    const w = sprite[0] ? sprite[0].length : 0;
    if (!w || !h) return;

    const scale = Math.max(1, Math.min(Math.floor(boxW / w), Math.floor(boxH / h)));

    let visibleBottom = -1;
    for (let row = 0; row < h; row++) {
      const line = sprite[row];
      for (let col = 0; col < w; col++) {
        const ch = line[col];
        if (ch !== '.' && ch !== ' ') { visibleBottom = row; break; }
      }
    }
    const trimBottom = (visibleBottom >= 0) ? (h - 1 - visibleBottom) : 0;

    const drawW = w * scale;
    const drawH = h * scale;
    const x0 = x + Math.floor((boxW - drawW) / 2);
    const y0 = y + (boxH - drawH) + (trimBottom * scale);

    for (let row = 0; row < h; row++) {
      const line = sprite[row];
      for (let col = 0; col < w; col++) {
        const ch = line[col];
        const color = palette[ch];
        if (!color) continue;
        const drawCol = flip ? (w - 1 - col) : col;
        ctx.fillStyle = color;
        ctx.fillRect(x0 + drawCol * scale, y0 + row * scale, scale, scale);
      }
    }
  }

  class Yokai {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 30;
      this.height = 40;
      this.type = 'yokai';
      this.alive = true;

      this.vx = 0;
      this.vy = 0;
      this.gravity = 0.8;
      this.onGround = false;

      this.repathTimer = 0;
      this.path = null;
      this.pathIndex = 0;

      this.tileSize = 32;
      this.gridCache = null;
    }

    _ensureGrid(level, canvasHeight) {
      if (!this.gridCache || this.gridCache.levelRef !== level) {
        const grid = SuperBario99.pathfinding.buildSolidGrid(level, this.tileSize, canvasHeight);
        this.gridCache = { levelRef: level, grid };
      }
      return this.gridCache.grid;
    }

    update(level, player, diff, canvasHeight) {
      if (!this.alive) return;

      // só ativa pathfinding a partir do tier intermediário
      const useAStar = diff.tier !== 'basic';

      if (useAStar) {
        this.repathTimer--;
        if (this.repathTimer <= 0) {
          this.repathTimer = Math.floor(25 + diff.reaction * 120);

          const grid = this._ensureGrid(level, canvasHeight);
          const s = SuperBario99.pathfinding.toCell(grid, this.x, this.y);
          const g = SuperBario99.pathfinding.toCell(grid, player.x, player.y);

          const maxIter = diff.tier === 'advanced' ? 1400 : 1000;
          const path = SuperBario99.pathfinding.findPath(grid, s, g, maxIter);
          this.path = path;
          this.pathIndex = 0;

          // Se falhou, diminui a frequência para evitar "lag em massa"
          if (!this.path) this.repathTimer = Math.max(this.repathTimer, 110);
        }
      }

      // decide direção
      let targetX = player.x;
      if (useAStar && this.path && this.path.length > 1) {
        const grid = this._ensureGrid(level, canvasHeight);
        const node = this.path[Math.min(this.pathIndex + 1, this.path.length - 1)];
        targetX = node.x * grid.tileSize + 8;
        // avança no path
        const dxNode = (node.x * grid.tileSize) - this.x;
        if (Math.abs(dxNode) < 12) this.pathIndex++;
      }

      const speed = 1.15 * diff.enemySpeed;
      const direction = targetX < this.x ? -1 : 1;
      this.vx = direction * speed;

      // "flutua" um pouco (yokai)
      if (diff.tier === 'advanced') {
        this.vy += this.gravity * 0.6;
      } else {
        this.vy += this.gravity;
      }

      this.y += this.vy;
      this.x += this.vx;

      // Colisão com plataformas (de cima)
      this.onGround = false;
      for (const p of level.platforms) {
        if (this._collides(p)) {
          if (this.vy > 0 && this.y + this.height <= p.y + 18) {
            this.y = p.y - this.height;
            this.vy = 0;
            this.onGround = true;
          }
        }
      }

      const maxX = (level.worldWidth || 800) - this.width;
      if (this.x < 0) this.x = 0;
      if (this.x > maxX) this.x = maxX;
    }

    checkPlayerCollision(player) {
      if (!this.alive) return false;
      if (this._collides(player)) {
        // Yokai pode ser morto pulando (exceto em advanced: precisa ataque)
        if (player.vy > 0 && player.y + player.height < this.y + this.height * 0.5) {
          this.die();
          player.vy = -10;
          player.score += 200;
          return false;
        }
        player.takeHit();
        return true;
      }
      return false;
    }

    takeDamage() {
      this.die();
    }

    die() {
      this.alive = false;
    }

    draw(ctx, cameraX, themeId) {
      if (!this.alive) return;
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

      // corpo espectral (paleta)
      let ghost = 'rgba(155,89,182,0.70)';
      if (v === 'evil') ghost = 'rgba(255,59,47,0.55)';
      else if (v === 'vaporwave') ghost = 'rgba(255,0,255,0.45)';
      else if (v === 'tecnozen') ghost = 'rgba(0,255,255,0.32)';
      else if (v === 'aurora-aero') ghost = 'rgba(127,255,0,0.28)';
      else if (v === 'windows-xp') ghost = 'rgba(0,85,229,0.26)';
      else if (v === 'windows-vista') ghost = 'rgba(0,120,215,0.24)';
      else if (v === 'metro') ghost = 'rgba(74,163,255,0.26)';
      else if (v === 'fruitiger') ghost = 'rgba(111,231,255,0.26)';

      const palette = {
        H: 'rgba(255,255,255,0.10)',
        G: ghost,
        E: 'rgba(245,246,250,0.90)',
        M: 'rgba(0,0,0,0.28)',
        P: ghost
      };

      const flip = this.vx < 0;
      const frame = (Math.abs(this.vy) > 0.35 && !this.onGround) ? SPRITE.float : SPRITE.idle;

      // leve aura
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(x - 6, this.y - 4, this.width + 12, this.height + 8);

      _drawPixelSprite(ctx, frame, x, this.y, this.width, this.height, palette, flip);
    }

    _collides(obj) {
      return (
        this.x < obj.x + obj.width &&
        this.x + this.width > obj.x &&
        this.y < obj.y + obj.height &&
        this.y + this.height > obj.y
      );
    }
  }

  SuperBario99.YokaiEnemy = Yokai;
})();
