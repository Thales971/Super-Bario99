// Samurai (v2): bloqueia e ataca em intervalos
window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const SPRITE = {
    idle: [
      '....HHHHHHHH....',
      '...HAAAAAAAAH...',
      '...AEEEEEEEEA...',
      '...AEEEEEEEEA...',
      '...AAAAAAAAAA...',
      '..CCCCAAAA C C..',
      '..CCCCAAAA C C..',
      '....AAAAAAAA....',
      '...AARRRRRRAA...',
      '...AAAAAAAAAA...',
      '...PPAAAAAAPP...',
      '...PPAAAAAAPP...',
      '....PP....PP....',
      '....PP....PP....'
    ],
    run1: [
      '....HHHHHHHH....',
      '...HAAAAAAAAH...',
      '...AEEEEEEEEA...',
      '...AEEEEEEEEA...',
      '...AAAAAAAAAA...',
      '..CCCCAAAA C C..',
      '..CCCCAAAA C C..',
      '....AAAAAAAA....',
      '...AARRRRRRAA...',
      '...AAAAAAAAAA...',
      '...PPAAAAAAPP...',
      '...PPAAAAAAPP...',
      '...PP....PP.....',
      '.....PP....PP...',
    ],
    run2: [
      '....HHHHHHHH....',
      '...HAAAAAAAAH...',
      '...AEEEEEEEEA...',
      '...AEEEEEEEEA...',
      '...AAAAAAAAAA...',
      '..CCCCAAAA C C..',
      '..CCCCAAAA C C..',
      '....AAAAAAAA....',
      '...AARRRRRRAA...',
      '...AAAAAAAAAA...',
      '...PPAAAAAAPP...',
      '...PPAAAAAAPP...',
      '.....PP....PP...',
      '...PP....PP.....'
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

  class Samurai {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 32;
      this.height = 44;
      this.type = 'samurai';
      this.alive = true;

      this.vx = 0;
      this.vy = 0;
      this.gravity = 0.8;
      this.onGround = false;

      this.attackCooldown = 0;
      this.swingTime = 0;
      this.direction = 1;
    }

    update(level, player, diff) {
      if (!this.alive) return;

      // face player
      this.direction = player.x < this.x ? -1 : 1;

      if (this.attackCooldown > 0) this.attackCooldown--;
      if (this.swingTime > 0) this.swingTime--;

      // Avança pouco, mas bloqueia
      const speed = 0.7 * diff.enemySpeed;
      const dist = Math.abs(player.x - this.x);
      if (dist < 260 && this.attackCooldown <= 0) {
        this.swingTime = 20;
        this.attackCooldown = 80;
      } else {
        // patrulha curta
        this.vx = this.direction * speed;
      }

      // Física
      this.vy += this.gravity;
      this.y += this.vy;
      this.x += this.vx;
      this.vx *= 0.85;

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

      // mundo
      const maxX = (level.worldWidth || 800) - this.width;
      if (this.x < 0) this.x = 0;
      if (this.x > maxX) this.x = maxX;
    }

    checkPlayerCollision(player) {
      if (!this.alive) return false;

      if (this._collides(player)) {
        // stomp
        if (player.vy > 0 && player.y + player.height < this.y + this.height * 0.5) {
          this.die();
          player.vy = -10;
          player.score += 160;
          return false;
        }

        // Se está atacando, dano garantido
        if (this.swingTime > 0) {
          player.takeHit();
          return true;
        }

        // Encostar também machuca
        player.takeHit();
        return true;
      }

      // Alcance do golpe (hitbox)
      if (this.swingTime > 0) {
        const hit = {
          x: this.x + (this.direction === 1 ? this.width : -24),
          y: this.y + 14,
          width: 24,
          height: 16
        };
        if (
          player.x < hit.x + hit.width &&
          player.x + player.width > hit.x &&
          player.y < hit.y + hit.height &&
          player.y + player.height > hit.y
        ) {
          player.takeHit();
          return true;
        }
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

      // Armadura (paleta por estética)
      let armor = '#34495e';
      if (v === 'metro') armor = '#c0c8d1';
      else if (v === 'tecnozen') armor = '#1a1f2b';
      else if (v === 'vaporwave') armor = '#2b1340';
      else if (v === 'aurora-aero') armor = '#0d1020';
      else if (v === 'windows-xp') armor = '#0055E5';
      else if (v === 'windows-vista') armor = 'rgba(192,192,192,0.78)';
      else if (v === 'fruitiger') armor = '#2c3e50';

      const helmet = '#1b1b1b';
      const sash = (v === 'vaporwave') ? '#FF00FF' : '#c0392b';
      const eye = '#f5f6fa';
      const boots = '#1b1b1b';

      const palette = {
        A: armor,
        H: helmet,
        R: sash,
        E: eye,
        C: 'rgba(0,0,0,0.0)',
        P: boots,
      };

      const flip = this.direction !== 1;
      const frame = (Math.abs(this.vx) > 0.2)
        ? ((Math.floor((Date.now() / 100) % 2) === 0) ? SPRITE.run1 : SPRITE.run2)
        : SPRITE.idle;

      _drawPixelSprite(ctx, frame, x, this.y, this.width, this.height, palette, flip);

      // Espada
      if (this.swingTime > 0) {
        ctx.strokeStyle = '#f5f6fa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const sx = x + (this.direction === 1 ? this.width : 0);
        ctx.moveTo(sx, this.y + 24);
        ctx.lineTo(sx + this.direction * 28, this.y + 12);
        ctx.stroke();
      }
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

  SuperBario99.SamuraiEnemy = Samurai;
})();
