// Ninja (v2): aparece/desaparece e dá dash com fumaça
window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const SPRITE = {
    idle: [
      '....HHHHHH....',
      '...HMMMMMMH...',
      '...MWWWWWWM...',
      '...MWWWWWWM...',
      '...MMMMMMMM...',
      '..SSMMMMMMSS..',
      '..SSSSMMSSSS..',
      '....MMMMMM....',
      '...MMMMMMMM...',
      '...MMMMMMMM...',
      '...PPMMMMPP...',
      '...PPMMMMPP...',
      '....PP..PP....',
      '....PP..PP....'
    ],
    run1: [
      '....HHHHHH....',
      '...HMMMMMMH...',
      '...MWWWWWWM...',
      '...MWWWWWWM...',
      '...MMMMMMMM...',
      '..SSMMMMMMSS..',
      '..SSSSMMSSSS..',
      '....MMMMMM....',
      '...MMMMMMMM...',
      '...MMMMMMMM...',
      '...PPMMMMPP...',
      '...PPMMMMPP...',
      '...PP..PP.....',
      '.....PP..PP...',
    ],
    run2: [
      '....HHHHHH....',
      '...HMMMMMMH...',
      '...MWWWWWWM...',
      '...MWWWWWWM...',
      '...MMMMMMMM...',
      '..SSMMMMMMSS..',
      '..SSSSMMSSSS..',
      '....MMMMMM....',
      '...MMMMMMMM...',
      '...MMMMMMMM...',
      '...PPMMMMPP...',
      '...PPMMMMPP...',
      '.....PP..PP...',
      '...PP..PP.....'
    ]
  };

  function _drawPixelSprite(ctx, sprite, x, y, boxW, boxH, palette, flip) {
    const h = sprite.length;
    const w = sprite[0] ? sprite[0].length : 0;
    if (!w || !h) return;

    // escala inteira para ficar “pixelado”
    const scale = Math.max(1, Math.min(Math.floor(boxW / w), Math.floor(boxH / h)));

    // alinha pelo último pixel visível (evita “flutuar”)
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

  class Ninja {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 28;
      this.height = 38;
      this.type = 'ninja';
      this.alive = true;

      this.vx = 0;
      this.vy = 0;
      this.gravity = 0.8;
      this.onGround = false;

      this.timer = 0;
      this.visible = true;
      this.direction = 1;
    }

    update(level, player, diff) {
      if (!this.alive) return;
      this.timer++;

      // Invisível por um tempo
      const cycle = 180;
      const phase = this.timer % cycle;
      this.visible = phase < 110;

      // Movimento estilo "fumaça"
      const speed = 1.2 * diff.enemySpeed;
      if (this.visible && phase % 45 === 0) {
        this.direction = (player.x < this.x) ? -1 : 1;
        this.vx = this.direction * (speed * 4.2);
      }

      // Física
      this.vy += this.gravity;
      this.y += this.vy;
      this.x += this.vx;
      this.vx *= 0.92;

      // Colisão com plataformas (somente de cima)
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

      // Limites do mundo
      const maxX = (level.worldWidth || 800) - this.width;
      if (this.x < 0) this.x = 0;
      if (this.x > maxX) this.x = maxX;
    }

    checkPlayerCollision(player) {
      if (!this.alive || !this.visible) return false;

      if (this._collides(player)) {
        // stomp
        if (player.vy > 0 && player.y + player.height < this.y + this.height * 0.5) {
          this.die();
          player.vy = -10;
          player.score += 120;
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

      const id = (themeId || 'japan');
      const v = (id === 'fruitiger-aero') ? 'fruitiger'
        : (id === 'metro-aero') ? 'metro'
        : (id === 'tecno-zen') ? 'tecnozen'
        : (id === 'windows-xp') ? 'windows-xp'
        : (id === 'windows-vista') ? 'windows-vista'
        : (id === 'vaporwave') ? 'vaporwave'
        : (id === 'aurora-aero') ? 'aurora-aero'
        : id;

      const x = this.x - cameraX;
      if (!this.visible) {
        // fumaça
        ctx.fillStyle = 'rgba(200,200,200,0.25)';
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(x + 8 + i * 5, this.y + 18, 6 - i * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
        return;
      }

      // Ninja humanoide (pixel art)
      let suit = '#0f0f12';
      if (v === 'evil') suit = '#1b0d12';
      else if (v === 'tecnozen') suit = '#0b0f18';
      else if (v === 'metro') suit = '#1b1f26';
      else if (v === 'vaporwave') suit = '#141018';
      else if (v === 'aurora-aero') suit = '#0d1020';
      else if (v === 'windows-xp' || v === 'windows-vista') suit = '#1b2a4a';
      else if (v === 'fruitiger') suit = '#1c2230';

      let eye = '#00d2ff';
      if (v === 'vaporwave') eye = '#00FFFF';
      else if (v === 'aurora-aero') eye = '#FFD700';
      else if (v === 'windows-xp') eye = '#39FF14';
      else if (v === 'windows-vista') eye = '#00BFFF';
      else if (v === 'fruitiger') eye = '#6fe7ff';

      const palette = {
        H: suit,
        M: suit,
        S: '#f5f6fa',
        W: eye,
        P: suit,
      };

      const flip = this.direction === -1;
      const frame = (Math.abs(this.vx) > 0.25)
        ? ((Math.floor(this.timer / 6) % 2) === 0 ? SPRITE.run1 : SPRITE.run2)
        : SPRITE.idle;
      _drawPixelSprite(ctx, frame, x, this.y, this.width, this.height, palette, flip);

      // detalhe extra: faixa/lenço + “katana” (novo visual)
      try {
        let accent = eye;
        if (v === 'japan') accent = '#c0392b';
        else if (v === 'evil') accent = '#ff3b2f';
        else if (v === 'tecnozen') accent = '#23d5ff';
        else if (v === 'metro') accent = '#4aa3ff';
        else if (v === 'vaporwave') accent = '#FF00FF';
        else if (v === 'fruitiger') accent = '#6fe7ff';
        else if (v === 'windows-xp') accent = '#0055E5';
        else if (v === 'windows-vista') accent = '#0078D7';
        else if (v === 'aurora-aero') accent = '#FFD700';

        // faixa na testa
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = accent;
        const hx = x + (flip ? 6 : 8);
        ctx.fillRect(hx, this.y + 8, 14, 3);
        // ponta do lenço
        ctx.globalAlpha = 0.55;
        ctx.fillRect(hx + (flip ? -4 : 14), this.y + 9, 4, 2);

        // katana nas costas
        ctx.globalAlpha = 0.65;
        ctx.strokeStyle = 'rgba(245,246,250,0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const kx = x + (flip ? this.width - 6 : 6);
        ctx.moveTo(kx, this.y + 14);
        ctx.lineTo(kx + (flip ? -10 : 10), this.y + 26);
        ctx.stroke();
        ctx.restore();
      } catch (_) {}
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

  SuperBario99.NinjaEnemy = Ninja;
})();
