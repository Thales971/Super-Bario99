// Shark (v2): inimigo temático do Fruitiger Ocean
// - Patrulha horizontal e dá “dash” quando o player chega perto
// - Stompável

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const SPRITE = {
    idle: [
      '....HHHHHH....',
      '...HBBBBBBH...',
      '..HBBEEEEBBH..',
      '.HBBEEEEEEBBH.',
      'HBBEEEEEEEEBBH',
      'HBBBBBBBBBBBBH',
      '.HBBBBBBBBBBH.',
      '..H..TTTT..H..',
      '...T......T...',
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

  class Shark {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 40;
      this.height = 26;
      this.type = 'shark';
      this.alive = true;

      this.timer = 0;
      this.direction = 1;
      this.vx = 1.1;

      this._dashUntil = 0;
      this._cooldownUntil = 0;
    }

    update(level, player, diff) {
      if (!this.alive) return;
      this.timer++;

      const t = this.timer;
      const ww = (level && level.worldWidth) ? level.worldWidth : 800;
      const sp = (diff?.enemySpeed || 1);

      // Decide dash quando player estiver perto e alinhado no Y
      const now = t;
      const dx = player ? (player.x - this.x) : 9999;
      const dy = player ? Math.abs((player.y + player.height / 2) - (this.y + this.height / 2)) : 9999;

      const canDash = now >= this._cooldownUntil && now >= this._dashUntil;
      if (player && canDash && Math.abs(dx) < 260 && dy < 90) {
        this.direction = dx < 0 ? -1 : 1;
        this._dashUntil = now + 28;      // ~0.5s
        this._cooldownUntil = now + 110; // cooldown
      }

      const isDashing = now < this._dashUntil;
      const baseSpeed = (0.95 + 0.25 * Math.sin(t / 40)) * sp;
      const dashSpeed = (4.2 + 0.6 * sp) * sp;

      this.vx = this.direction * (isDashing ? dashSpeed : baseSpeed);
      this.x += this.vx;

      // bob “na água”
      this.y += Math.sin(t * 0.09) * 0.35;

      // bounce nos limites
      const maxX = Math.max(0, ww - this.width);
      if (this.x < 0) {
        this.x = 0;
        this.direction = 1;
      }
      if (this.x > maxX) {
        this.x = maxX;
        this.direction = -1;
      }
    }

    checkPlayerCollision(player) {
      if (!this.alive) return false;
      if (this._collides(player)) {
        // stomp
        if (player.vy > 0 && player.y + player.height < this.y + this.height * 0.6) {
          this.die();
          player.vy = -10;
          player.score += 160;
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

      const id = String(themeId || 'fruitiger-ocean').toLowerCase();

      let body = '#4aa3ff';
      let fin = '#00ced1';
      if (id.includes('galaxy')) { body = '#a66bff'; fin = '#ff00ff'; }
      if (id.includes('evil')) { body = '#2b000a'; fin = '#ff3b2f'; }

      const palette = {
        H: fin,
        B: body,
        E: 'rgba(0,0,0,0.40)',
        T: 'rgba(255,255,255,0.30)'
      };

      _drawPixelSprite(ctx, SPRITE.idle, x, this.y, this.width, this.height, palette, this.direction === -1);

      // olho
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x + (this.direction === 1 ? 27 : 9), this.y + 9, 3, 3);
      ctx.restore();
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

  SuperBario99.SharkEnemy = Shark;
})();
