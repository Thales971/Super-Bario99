// Drone (v2): inimigo voador (bom para TecnoZen / Metro)
window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const SPRITE = {
    idle: [
      '..HHHH..',
      '.HBBBBH.',
      '.BEEEBB.',
      '.BEEEBB.',
      '.BBBBBB.',
      '..BBBB..',
      '.BBCCBB.',
      '.BBCCBB.',
      '..PPPP..'
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

  class Drone {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 28;
      this.height = 18;
      this.type = 'drone';
      this.alive = true;

      this.timer = 0;
      this.baseY = y;
      this.direction = 1;
    }

    update(level, player, diff) {
      if (!this.alive) return;
      this.timer++;

      const speed = 1.35 * diff.enemySpeed;
      const dir = player.x < this.x ? -1 : 1;
      this.direction = dir;
      this.x += dir * speed;

      // flutuação
      this.y = this.baseY + Math.sin(this.timer * 0.08) * 14;

      const maxX = (level.worldWidth || 800) - this.width;
      if (this.x < 0) this.x = 0;
      if (this.x > maxX) this.x = maxX;
    }

    checkPlayerCollision(player) {
      if (!this.alive) return false;
      if (this._collides(player)) {
        // stomp
        if (player.vy > 0 && player.y + player.height < this.y + this.height * 0.65) {
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

      let base = '#dfe6e9';
      if (v === 'tecnozen') base = '#00FFFF';
      else if (v === 'metro') base = '#4aa3ff';
      else if (v === 'vaporwave') base = '#FF00FF';
      else if (v === 'aurora-aero') base = '#FFD700';
      else if (v === 'windows-xp') base = '#ECE9D8';
      else if (v === 'windows-vista') base = 'rgba(255,255,255,0.60)';
      else if (v === 'fruitiger') base = '#6fe7ff';

      const dark = 'rgba(0,0,0,0.35)';
      const eye = (v === 'evil') ? '#ff3b2f' : (v === 'vaporwave' ? '#00FFFF' : '#2c3e50');

      const palette = {
        H: base,
        B: base,
        E: eye,
        C: dark,
        P: dark
      };

      const flip = this.direction === -1;
      _drawPixelSprite(ctx, SPRITE.idle, x, this.y, this.width, this.height, palette, flip);

      // jato/propulsão (leve)
      ctx.fillStyle = 'rgba(255,255,255,0.20)';
      ctx.fillRect(x + 2, this.y + this.height - 4, this.width - 4, 3);

      // detalhe extra: rotor + luzes (novo visual)
      try {
        let light = 'rgba(255,255,255,0.18)';
        if (v === 'tecnozen') light = 'rgba(0,255,255,0.22)';
        else if (v === 'metro') light = 'rgba(74,163,255,0.22)';
        else if (v === 'vaporwave') light = 'rgba(255,0,255,0.18)';
        else if (v === 'aurora-aero') light = 'rgba(255,215,0,0.16)';

        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 2;
        const rx = x + this.width / 2;
        const ry = this.y - 2;
        ctx.beginPath();
        ctx.moveTo(rx - 12, ry);
        ctx.lineTo(rx + 12, ry);
        ctx.stroke();

        ctx.fillStyle = light;
        ctx.fillRect(x - 1, this.y + 6, 2, 4);
        ctx.fillRect(x + this.width - 1, this.y + 6, 2, 4);
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

  SuperBario99.DroneEnemy = Drone;
})();
