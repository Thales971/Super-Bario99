// Monkey (v2): inimigo temático (usado em fases especiais Japan Retro)
// - Anda/patrulha e dá saltos periódicos (ou quando o player aproxima)
// - Stompável

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const SPRITE = {
    idle: [
      '..HHHH..',
      '.HBBBBH.',
      'HBBE EBBH',
      'HBBBBBBH',
      '.HBRRBH.',
      '..BRRB..',
      '..B..B..',
      '.P....P.',
      'P......P'
    ],
    jump: [
      '..HHHH..',
      '.HBBBBH.',
      'HBBE EBBH',
      'HBBBBBBH',
      '.HBRRBH.',
      '..BRRB..',
      '.P....P.',
      '........',
      '........'
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

  class Monkey {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 30;
      this.height = 34;
      this.type = 'monkey';
      this.alive = true;

      this.vx = 0;
      this.vy = 0;
      this.gravity = 0.8;
      this.onGround = false;

      this.timer = 0;
      this.direction = 1;
      this._nextHopAt = 40;
    }

    update(level, player, diff) {
      if (!this.alive) return;
      this.timer++;

      const t = this.timer;
      const sp = (diff?.enemySpeed || 1);
      const ww = (level && level.worldWidth) ? level.worldWidth : 800;

      // lê config da fase especial quando existir
      const spec = this._sb99SpecialSpec || null;
      const behavior = String(spec?.behavior || '').toLowerCase();

      // patrulha básica
      if (this.onGround) {
        const dx = player ? (player.x - this.x) : 9999;
        if (player && Math.abs(dx) < 220) this.direction = dx < 0 ? -1 : 1;

        const walk = (behavior === 'jump') ? 0.55 : 0.75;
        this.vx = this.direction * (walk * sp);
      }

      // salto: periódico e também quando o player chega perto
      const dxp = player ? (player.x - this.x) : 9999;
      const wantHop = player && Math.abs(dxp) < 200;
      if (this.onGround && (t >= this._nextHopAt || wantHop)) {
        // hop
        this.vy = -(8.8 + 1.0 * sp);
        this.vx += this.direction * (2.2 * sp);
        this._nextHopAt = t + 55 + ((Math.random() * 30) | 0);
        this.onGround = false;
      }

      // física
      this.vy += this.gravity;
      this.y += this.vy;
      this.x += this.vx;
      this.vx *= 0.92;

      // colisão com plataformas (somente de cima)
      this.onGround = false;
      const plats = level?.platforms || [];
      for (const p of plats) {
        if (!p) continue;
        if (this._collides(p)) {
          if (this.vy > 0 && this.y + this.height <= p.y + 18) {
            this.y = p.y - this.height;
            this.vy = 0;
            this.onGround = true;
          }
        }
      }

      // limites do mundo
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
        if (player.vy > 0 && player.y + player.height < this.y + this.height * 0.55) {
          this.die();
          player.vy = -10;
          player.score += 135;
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

      // paleta simples (sem assets)
      const id = String(themeId || 'japan-retro').toLowerCase();
      let fur = '#7b4b2a';
      let belly = '#caa17a';
      let accent = '#ff3b2f';
      if (id.includes('evil')) {
        fur = '#2b000a';
        belly = '#4b1a22';
        accent = '#ff3b2f';
      }

      const palette = {
        H: fur,
        B: fur,
        R: belly,
        E: 'rgba(0,0,0,0.55)',
        P: 'rgba(0,0,0,0.35)'
      };

      const flip = this.direction === -1;
      const frame = (!this.onGround || Math.abs(this.vy) > 0.2) ? SPRITE.jump : SPRITE.idle;
      _drawPixelSprite(ctx, frame, x, this.y, this.width, this.height, palette, flip);

      // bandana simples (japan vibe)
      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = accent;
      ctx.fillRect(x + (flip ? 7 : 9), this.y + 8, 12, 3);
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

  SuperBario99.MonkeyEnemy = Monkey;
})();
