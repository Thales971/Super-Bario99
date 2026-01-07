// Tanuki (v2): vira estátua quando o jogador olha, anda quando não olha
window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const SPRITE = {
    idle: [
      '....HHHHHH....',
      '...HBBBBBBH...',
      '...BWWWWWWB...',
      '...BWWWWWWB...',
      '...BBBBBBBB...',
      '..TTBBBBBBTT..',
      '..TTTTBBTTTT..',
      '....BBBBBB....',
      '...BBBBBBBB...',
      '...BBMMMMBB...',
      '...PPBBBBPP...',
      '...PPBBBBPP...',
      '....PP..PP....',
      '....PP..PP....'
    ],
    run1: [
      '....HHHHHH....',
      '...HBBBBBBH...',
      '...BWWWWWWB...',
      '...BWWWWWWB...',
      '...BBBBBBBB...',
      '..TTBBBBBBTT..',
      '..TTTTBBTTTT..',
      '....BBBBBB....',
      '...BBBBBBBB...',
      '...BBMMMMBB...',
      '...PPBBBBPP...',
      '...PPBBBBPP...',
      '...PP..PP.....',
      '.....PP..PP...'
    ],
    run2: [
      '....HHHHHH....',
      '...HBBBBBBH...',
      '...BWWWWWWB...',
      '...BWWWWWWB...',
      '...BBBBBBBB...',
      '..TTBBBBBBTT..',
      '..TTTTBBTTTT..',
      '....BBBBBB....',
      '...BBBBBBBB...',
      '...BBMMMMBB...',
      '...PPBBBBPP...',
      '...PPBBBBPP...',
      '.....PP..PP...',
      '...PP..PP.....'
    ],
    statue: [
      '....HHHHHH....',
      '...HSSSSSSH...',
      '...SSSSSSSS...',
      '...SSSSSSSS...',
      '...SSSSSSSS...',
      '..SSSSSSSSSS..',
      '..SSSSSSSSSS..',
      '....SSSSSS....',
      '...SSSSSSSS...',
      '...SSSMMSSS...',
      '...PPSSSSPP...',
      '...PPSSSSPP...',
      '....PP..PP....',
      '....PP..PP....'
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

  class Tanuki {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 30;
      this.height = 34;
      this.type = 'tanuki';
      this.alive = true;

      this.vx = 0;
      this.vy = 0;
      this.gravity = 0.8;
      this.onGround = false;

      this.asStatue = false;
      this.direction = 1;
    }

    update(level, player, diff) {
      if (!this.alive) return;

      // "Olhar" do player: se ele está virado para o tanuki e perto
      const playerFacing = player.direction === 'right' ? 1 : -1;
      const rel = this.x - player.x;
      const looking = (playerFacing === 1 && rel > 0) || (playerFacing === -1 && rel < 0);
      const near = Math.abs(rel) < 360;

      this.asStatue = looking && near;

      if (!this.asStatue) {
        this.direction = player.x < this.x ? -1 : 1;
        const speed = 1.0 * diff.enemySpeed;
        this.vx = this.direction * speed;
      } else {
        this.vx = 0;
      }

      this.vy += this.gravity;
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
        if (player.vy > 0 && player.y + player.height < this.y + this.height * 0.5) {
          this.die();
          player.vy = -10;
          player.score += 130;
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

      if (this.asStatue) {
        const palette = {
          H: '#7f8c8d',
          S: '#95a5a6',
          M: 'rgba(0,0,0,0.18)',
          P: '#7f8c8d'
        };
        _drawPixelSprite(ctx, SPRITE.statue, x, this.y, this.width, this.height, palette, this.direction !== 1);
        return;
      }

      let body = '#8e5a2b';
      if (v === 'evil') body = '#1b0d12';
      else if (v === 'tecnozen') body = '#1a1f2b';
      else if (v === 'metro') body = '#2b2f36';
      else if (v === 'vaporwave') body = '#2b1340';
      else if (v === 'aurora-aero') body = '#0d1020';
      else if (v === 'windows-xp') body = '#0055E5';
      else if (v === 'windows-vista') body = 'rgba(0,120,215,0.55)';
      else if (v === 'fruitiger') body = '#4b6cb7';

      const mask = '#f5f6fa';
      const eye = '#2c3e50';
      const tail = '#6d3c1b';

      const palette = {
        H: tail,
        B: body,
        T: mask,
        W: mask,
        M: eye,
        P: '#1b1b1b'
      };

      const flip = this.direction !== 1;
      const frame = (Math.abs(this.vx) > 0.2)
        ? ((Math.floor((Date.now() / 110) % 2) === 0) ? SPRITE.run1 : SPRITE.run2)
        : SPRITE.idle;
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

  SuperBario99.TanukiEnemy = Tanuki;
})();
