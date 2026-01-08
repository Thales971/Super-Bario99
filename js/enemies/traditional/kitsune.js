// Kitsune (v2): raposa-espírito com "blink" e dashes curtos
window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const SPRITE = {
    idle: [
      '....HHHHHH....',
      '...HOOOOOOH...',
      '...OWW..WWO...',
      '...OWW..WWO...',
      '...OOOOOOOO...',
      '..TT000000TT..',
      '..TTTT00TTTT..',
      '....OOOOOO....',
      '...OOOOOOOO...',
      '...OOFFFFOO...',
      '...PPOOOOPP...',
      '...PPOOOOPP...',
      '....PP..PP....',
      '....PP..PP....'
    ],
    run1: [
      '....HHHHHH....',
      '...HOOOOOOH...',
      '...OWW..WWO...',
      '...OWW..WWO...',
      '...OOOOOOOO...',
      '..TT000000TT..',
      '..TTTT00TTTT..',
      '....OOOOOO....',
      '...OOOOOOOO...',
      '...OOFFFFOO...',
      '...PPOOOOPP...',
      '...PPOOOOPP...',
      '...PP..PP.....',
      '.....PP..PP...'
    ],
    run2: [
      '....HHHHHH....',
      '...HOOOOOOH...',
      '...OWW..WWO...',
      '...OWW..WWO...',
      '...OOOOOOOO...',
      '..TT000000TT..',
      '..TTTT00TTTT..',
      '....OOOOOO....',
      '...OOOOOOOO...',
      '...OOFFFFOO...',
      '...PPOOOOPP...',
      '...PPOOOOPP...',
      '.....PP..PP...',
      '...PP..PP.....'
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

  class Kitsune {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 30;
      this.height = 34;
      this.type = 'kitsune';
      this.alive = true;

      this.vx = 0;
      this.vy = 0;
      this.gravity = 0.8;
      this.onGround = false;

      this.timer = 0;
      this.blinkTimer = 0;
      this.blinkCooldown = 140;
    }

    update(level, player, diff) {
      if (!this.alive) return;
      this.timer++;
      if (this.blinkTimer > 0) this.blinkTimer--;

      const speed = 1.25 * diff.enemySpeed;
      const dir = player.x < this.x ? -1 : 1;

      // blink: teleporta um pouco para "flanquear"
      if (this.timer % this.blinkCooldown === 0) {
        this.blinkTimer = 10;
        this.x += dir * (60 + (this.timer % 2) * 18);
      }

      // dash curto
      if (this.timer % 55 === 0) {
        this.vx = dir * speed * 4.0;
      } else {
        this.vx += dir * speed * 0.08;
        this.vx *= 0.90;
      }

      // física
      this.vy += this.gravity;
      this.y += this.vy;
      this.x += this.vx;

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
        if (player.vy > 0 && player.y + player.height < this.y + this.height * 0.55) {
          this.die();
          player.vy = -10;
          player.score += 150;
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

      // blink visual
      if (this.blinkTimer > 0) {
        ctx.fillStyle = 'rgba(255,182,213,0.22)';
        ctx.fillRect(x - 6, this.y - 6, this.width + 12, this.height + 12);
      }

      // corpo humanoide (espírito raposa)
      let body = '#f39c12';
      if (v === 'evil') body = '#ff3b2f';
      else if (v === 'vaporwave') body = '#FF00FF';
      else if (v === 'tecnozen') body = '#00FFFF';
      else if (v === 'aurora-aero') body = '#FFD700';
      else if (v === 'windows-xp') body = '#00CC00';
      else if (v === 'windows-vista') body = '#00BFFF';
      else if (v === 'metro') body = '#4aa3ff';
      else if (v === 'fruitiger') body = '#6fe7ff';

      const tail = 'rgba(255,255,255,0.75)';
      const eye = '#2c3e50';
      const accent = 'rgba(0,0,0,0.18)';

      const palette = {
        H: tail,
        O: body,
        W: 'rgba(245,246,250,0.85)',
        F: accent,
        0: body,
        T: tail,
        P: '#1b1b1b'
      };

      const flip = this.vx < 0;
      const frame = (Math.abs(this.vx) > 0.25)
        ? ((Math.floor((Date.now() / 110) % 2) === 0) ? SPRITE.run1 : SPRITE.run2)
        : SPRITE.idle;

      _drawPixelSprite(ctx, frame, x, this.y, this.width, this.height, palette, flip);

      // detalhe extra: caudas brilhando (novo visual)
      try {
        let glow = 'rgba(255,255,255,0.10)';
        if (v === 'evil') glow = 'rgba(255,59,47,0.12)';
        else if (v === 'tecnozen') glow = 'rgba(0,255,255,0.12)';
        else if (v === 'vaporwave') glow = 'rgba(255,0,255,0.10)';
        else if (v === 'aurora-aero') glow = 'rgba(127,255,0,0.10)';
        else if (v === 'metro') glow = 'rgba(74,163,255,0.10)';

        ctx.save();
        ctx.fillStyle = glow;
        ctx.globalAlpha = 1;
        const baseX = x + (flip ? this.width - 6 : 6);
        const baseY = this.y + 20;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(baseX + (flip ? 8 : -8) + i * (flip ? -4 : 4), baseY + i * 2, 6 - i, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } catch (_) {}

      // pupilas (por cima)
      ctx.fillStyle = eye;
      const px = x + (flip ? 8 : 18);
      ctx.fillRect(px, this.y + 12, 2, 2);
      ctx.fillRect(px + (flip ? 6 : -6), this.y + 12, 2, 2);
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

  SuperBario99.KitsuneEnemy = Kitsune;
})();
