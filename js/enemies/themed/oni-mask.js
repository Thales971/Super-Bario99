// Oni Mask (v2): inimigo temático do Japan Retro (fases especiais)
// - Flutua ao redor de um ponto e faz “dash” curto quando o player aproxima
// - Stompável

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const SPRITE = {
    idle: [
      '..HHHHHH..',
      '.HBBBBBBH.',
      'HBBRRRRBBH',
      'HBRWWWWRBH',
      'HBRWKKWRBH',
      'HBRWWWWRBH',
      'HBBRRRRBBH',
      '.HBBBBBBH.',
      '..HBBBBH..',
      '...H..H...'
    ]
  };

  function _drawPixelSprite(ctx, sprite, x, y, boxW, boxH, palette, flip) {
    const h = sprite.length;
    const w = sprite[0] ? sprite[0].length : 0;
    if (!w || !h) return;

    const scale = Math.max(1, Math.min(Math.floor(boxW / w), Math.floor(boxH / h)));

    const drawW = w * scale;
    const drawH = h * scale;
    const x0 = x + Math.floor((boxW - drawW) / 2);
    const y0 = y + Math.floor((boxH - drawH) / 2);

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

  class OniMask {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.baseX = x;
      this.baseY = y;

      this.width = 34;
      this.height = 34;
      this.type = 'oni-mask';
      this.alive = true;

      this.timer = 0;
      this.direction = 1;

      this._dashUntil = 0;
      this._cooldownUntil = 0;
      this._dashDir = 1;
    }

    update(level, player, diff) {
      if (!this.alive) return;
      this.timer++;

      const t = this.timer;
      const sp = (diff?.enemySpeed || 1);
      const ww = (level && level.worldWidth) ? level.worldWidth : 800;

      // lê config da fase especial quando existir
      const spec = this._sb99SpecialSpec || null;
      const floatRange = Number(spec?.floatRange);
      const fr = isFinite(floatRange) ? Math.max(8, Math.min(80, floatRange)) : 26;

      // flutuação “viva”
      const fx = Math.cos(t * 0.045) * (fr * 0.55);
      const fy = Math.sin(t * 0.060) * fr;
      this.x = this.baseX + fx;
      this.y = this.baseY + fy;

      // mira o player
      const dx = player ? (player.x - this.x) : 9999;
      this.direction = dx < 0 ? -1 : 1;

      // dash curto quando o player chega perto
      const now = t;
      const canDash = now >= this._cooldownUntil && now >= this._dashUntil;
      if (player && canDash && Math.abs(dx) < 280) {
        this._dashDir = this.direction;
        this._dashUntil = now + 16;
        this._cooldownUntil = now + 92;
      }

      if (now < this._dashUntil) {
        this.x += this._dashDir * (4.6 * sp);
      }

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
          player.score += 170;
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
      const id = String(themeId || 'japan-retro').toLowerCase();

      // sem adicionar novas cores globais: usa uma paleta simples e legível
      let horn = '#ffd166';
      let mask = '#f2f2f2';
      let red = '#ff3b2f';
      let eyeWhite = '#ffffff';
      let eye = 'rgba(0,0,0,0.70)';

      if (id.includes('evil')) {
        horn = '#ff3b2f';
        mask = '#2b000a';
        red = '#ff3b2f';
        eyeWhite = 'rgba(255,255,255,0.85)';
      }

      const palette = {
        H: horn,
        B: mask,
        R: red,
        W: eyeWhite,
        K: eye
      };

      _drawPixelSprite(ctx, SPRITE.idle, x, this.y, this.width, this.height, palette, this.direction === -1);

      // brilho bem sutil (ajuda a destacar em fundo escuro)
      ctx.save();
      ctx.globalAlpha = 0.10;
      ctx.fillStyle = red;
      ctx.beginPath();
      ctx.ellipse(x + this.width / 2, this.y + this.height / 2, 18, 12, 0, 0, Math.PI * 2);
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

  SuperBario99.OniMaskEnemy = OniMask;
})();
