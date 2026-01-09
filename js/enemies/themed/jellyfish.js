// Jellyfish (v2): inimigo temático do Fruitiger Ocean
// - Flutua em padrão senoidal e “puxa” levemente em direção ao player
// - Stompável

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const SPRITE = {
    idle: [
      '....HHHH....',
      '...HBBBBH...',
      '..HBEEEEBH..',
      '..HBEEEEBH..',
      '..HBBBBBBH..',
      '...HBBBBH...',
      '....HBBH....',
      '...TT..TT...',
      '..TT....TT..',
      '..TT....TT..'
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

  class Jellyfish {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 30;
      this.height = 34;
      this.type = 'jellyfish';
      this.alive = true;

      this.timer = 0;
      this.baseY = y;
      this.direction = 1;
    }

    update(level, player, diff) {
      if (!this.alive) return;
      this.timer++;

      const ww = (level && level.worldWidth) ? level.worldWidth : 800;

      // “caça” bem suave, pra não virar drone.
      const dx = (player ? (player.x - this.x) : 0);
      this.direction = dx < 0 ? -1 : 1;

      const chase = (Math.abs(dx) < 260) ? 1 : 0;
      const speed = (0.55 + chase * 0.35) * (diff?.enemySpeed || 1);
      this.x += this.direction * speed;

      // flutuação
      const amp = 16;
      this.y = this.baseY + Math.sin(this.timer * 0.07) * amp;

      // limites
      const maxX = Math.max(0, ww - this.width);
      if (this.x < 0) this.x = 0;
      if (this.x > maxX) this.x = maxX;
    }

    checkPlayerCollision(player) {
      if (!this.alive) return false;
      if (this._collides(player)) {
        // stomp
        if (player.vy > 0 && player.y + player.height < this.y + this.height * 0.55) {
          this.die();
          player.vy = -10;
          player.score += 140;
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

      const id = String(themeId || 'fruitiger-ocean');
      const v = id.toLowerCase();

      // cores “mar” (sem depender de assets)
      let body = '#ff7ad9'; // rosa jelly
      let glow = '#6fe7ff'; // ciano
      if (v.includes('galaxy')) { body = '#a66bff'; glow = '#ff00ff'; }
      if (v.includes('evil')) { body = '#ff3b2f'; glow = '#2b000a'; }

      const palette = {
        H: glow,
        B: body,
        E: 'rgba(0,0,0,0.35)',
        T: 'rgba(255,255,255,0.30)'
      };

      _drawPixelSprite(ctx, SPRITE.idle, x, this.y, this.width, this.height, palette, this.direction === -1);

      // brilho suave (aesthetic)
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(x + this.width / 2, this.y + this.height * 0.55, 22, 14, 0, 0, Math.PI * 2);
      ctx.fill();
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

  SuperBario99.JellyfishEnemy = Jellyfish;
})();
