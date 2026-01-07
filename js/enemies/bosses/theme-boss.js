// Boss por tema (v2): um boss no fim de cada bloco (5,10,15,20,25,30,35,40,45,50)
// Mantém tudo em Canvas shapes.

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const util = SuperBario99.util;

  const SPRITE = {
    idle: [
      '........HHHHHHHH........',
      '.......HAAAAAAAAAAH......',
      '......AAEEEE..EEEEAA.....',
      '......AAEEEE..EEEEAA.....',
      '......AAAAAAAAAAAAAA.....',
      '.....AAAAAAFFFFAAAAAA....',
      '....AAABBBBBBBBBBBAAA....',
      '....AABBBBBBBBBBBBBAA....',
      '....AABBBCCCCCCCCBBAA....',
      '....AABBBCCCCCCCCBBAA....',
      '.....AABBBBBBBBBBAA......',
      '......AABBBBBBBBAA.......',
      '.......AABBBBBBAA........',
      '.......PPBBBBBBPP........',
      '......PPPBBBBBBPPP.......',
      '......PP..BBBB..PP.......',
      '......PP..BBBB..PP.......',
      '.....PPP..PPPP..PPP......',
      '.....PP...PPPP...PP......'
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

  class ThemeBoss {
    constructor(x, y, themeId, levelIndex) {
      this.x = x;
      this.y = y;
      this.width = 84;
      this.height = 72;
      this.type = 'boss';
      this.alive = true;

      this.themeId = themeId;
      this.levelIndex = levelIndex;

      this.vx = 0;
      this.vy = 0;
      this.gravity = 0.8;
      this.onGround = false;

      this.timer = 0;
      this.hitIFrames = 0;

      const block = Math.floor(levelIndex / 5);
      this.maxHp = 22 + block * 7;
      this.hp = this.maxHp;

      this.projectiles = [];
      this.shootCooldown = 0;
      this.dashCooldown = 0;
    }

    update(level, player, diff) {
      if (!this.alive) return;
      this.timer++;
      if (this.hitIFrames > 0) this.hitIFrames--;
      if (this.shootCooldown > 0) this.shootCooldown--;
      if (this.dashCooldown > 0) this.dashCooldown--;

      const hpRatio = this.maxHp > 0 ? (this.hp / this.maxHp) : 1;
      const enrage = hpRatio <= 0.5;
      const speedBase = (1.35 * diff.enemySpeed) * (enrage ? 1.22 : 1.0);
      const toward = player.x < this.x ? -1 : 1;

      // Padrões simples por tema
      const wantsDash = (this.themeId === 'japan' || this.themeId === 'metro' || this.themeId === 'memefusion');
      const wantsShots = (this.themeId === 'tecnozen' || this.themeId === 'evil' || this.themeId === 'fruitiger' || this.themeId === 'memefusion');

      // Movimento base (pressão no player)
      this.vx = toward * speedBase;

      // Dash periódico
      if (wantsDash && this.dashCooldown <= 0 && Math.abs(player.x - this.x) < 420) {
        this.vx = toward * speedBase * (enrage ? 7.0 : 6.2);
        this.dashCooldown = enrage ? 60 : 78;
      }

      // Tiro (projéteis)
      if (wantsShots && this.shootCooldown <= 0) {
        this._shootAt(player);
        const baseCd = this.themeId === 'evil' ? 32 : 44;
        this.shootCooldown = enrage ? Math.max(22, baseCd - 10) : baseCd;
      }

      // Física
      this.vy += this.gravity;
      this.y += this.vy;
      this.x += this.vx;

      // Colisão com plataformas (de cima)
      this.onGround = false;
      for (const p of level.platforms) {
        if (this._collides(p)) {
          if (this.vy > 0 && this.y + this.height <= p.y + 22) {
            this.y = p.y - this.height;
            this.vy = 0;
            this.onGround = true;
          }
        }
      }

      const maxX = (level.worldWidth || 800) - this.width;
      this.x = util.clamp(this.x, 0, maxX);

      this._updateProjectiles(player);
    }

    _shootAt(player) {
      const dir = player.x < this.x ? -1 : 1;
      const baseVx = dir * (4.2 + Math.min(3.4, this.levelIndex / 14));

      const style = this.themeId;
      const colorByStyle = {
        japan: 'rgba(255,182,213,0.95)',
        fruitiger: 'rgba(111,231,255,0.95)',
        tecnozen: 'rgba(35,213,255,0.95)',
        dorfic: 'rgba(60,110,71,0.95)',
        metro: 'rgba(74,163,255,0.95)',
        evil: 'rgba(255,59,47,0.95)',
        memefusion: 'rgba(255,210,125,0.95)'
      };

      // padrão: 1~3 tiros
      const count = this.themeId === 'evil' ? 4 : (this.themeId === 'memefusion' ? 3 : 2);
      for (let i = 0; i < count; i++) {
        const vy = -1.6 + i * 1.25;
        this.projectiles.push({
          x: this.x + (dir === 1 ? this.width : -6),
          y: this.y + 26,
          vx: baseVx,
          vy,
          r: 6,
          life: 210,
          color: colorByStyle[style] || 'rgba(255,255,255,0.9)'
        });
      }
    }

    _updateProjectiles(player) {
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const pr = this.projectiles[i];
        pr.x += pr.vx;
        pr.y += pr.vy;
        pr.life--;

        // hit player
        if (
          player.x < pr.x + pr.r &&
          player.x + player.width > pr.x - pr.r &&
          player.y < pr.y + pr.r &&
          player.y + player.height > pr.y - pr.r
        ) {
          player.takeHit();
          this.projectiles.splice(i, 1);
          continue;
        }

        if (pr.life <= 0) this.projectiles.splice(i, 1);
      }
    }

    checkPlayerCollision(player) {
      if (!this.alive) return false;

      if (this._collides(player)) {
        // stomp: dano, não mata de primeira
        if (player.vy > 0 && player.y + player.height < this.y + this.height * 0.45) {
          this.takeDamage(2);
          player.vy = -12;
          player.score += 180;
          return false;
        }

        player.takeHit();
        return true;
      }
      return false;
    }

    takeDamage(amount = 1) {
      if (!this.alive) return;
      if (this.hitIFrames > 0) return;
      this.hitIFrames = 14;
      this.hp -= amount;
      if (this.hp <= 0) {
        this.hp = 0;
        this.alive = false;
      }
    }

    draw(ctx, cameraX, themeId) {
      if (!this.alive) return;
      const x = this.x - cameraX;
      const y = this.y;

      const id = (themeId || this.themeId || 'japan');
      const v = (id === 'fruitiger-aero') ? 'fruitiger'
        : (id === 'metro-aero') ? 'metro'
        : (id === 'tecno-zen') ? 'tecnozen'
        : (id === 'windows-xp') ? 'windows-xp'
        : (id === 'windows-vista') ? 'windows-vista'
        : (id === 'vaporwave') ? 'vaporwave'
        : (id === 'aurora-aero') ? 'aurora-aero'
        : id;

      // Boss humanoide (pixel art) + máscara por tema
      let body = '#2c2c2c';
      let accent = '#f5f6fa';
      if (v === 'japan') { body = '#c0392b'; accent = '#f5f6fa'; }
      if (v === 'fruitiger') { body = '#4b6cb7'; accent = '#dbe6ff'; }
      if (v === 'tecnozen') { body = '#1a1f2b'; accent = '#00FFFF'; }
      if (v === 'dorfic') { body = '#2f2a24'; accent = '#3c6e47'; }
      if (v === 'metro') { body = '#2b2f36'; accent = '#4aa3ff'; }
      if (v === 'evil') { body = '#1b0d12'; accent = '#ff3b2f'; }
      if (v === 'memefusion') { body = '#3a2f5b'; accent = '#ffd27d'; }
      if (v === 'windows-xp') { body = '#0055E5'; accent = '#ECE9D8'; }
      if (v === 'windows-vista') { body = 'rgba(0,120,215,0.78)'; accent = 'rgba(255,255,255,0.65)'; }
      if (v === 'vaporwave') { body = '#141018'; accent = '#FF00FF'; }
      if (v === 'aurora-aero') { body = '#0d1020'; accent = '#FFD700'; }

      const cloak = 'rgba(0,0,0,0.22)';
      const boots = 'rgba(0,0,0,0.35)';
      const eye = (v === 'evil') ? '#ff3b2f' : (v === 'aurora-aero' ? '#FFD700' : (v === 'vaporwave' ? '#00FFFF' : '#2e86de'));

      const palette = {
        H: cloak,
        A: accent,
        B: body,
        C: 'rgba(255,255,255,0.08)',
        E: eye,
        F: 'rgba(0,0,0,0.18)',
        P: boots
      };

      const flip = (this.vx < 0);
      _drawPixelSprite(ctx, SPRITE.idle, x, y, this.width, this.height, palette, flip);

      // aura (pulso)
      ctx.strokeStyle = (v === 'tecnozen')
        ? 'rgba(0,255,255,0.35)'
        : (v === 'vaporwave')
          ? 'rgba(255,0,255,0.28)'
          : (v === 'aurora-aero')
            ? 'rgba(127,255,0,0.20)'
            : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + this.width / 2, y + this.height / 2, 40 + (this.timer % 14), 0, Math.PI * 2);
      ctx.stroke();

      // projéteis
      for (const pr of this.projectiles) {
        ctx.fillStyle = pr.color;
        ctx.beginPath();
        ctx.arc(pr.x - cameraX, pr.y, pr.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // barra de HP
      const barW = 180;
      const barH = 10;
      const bx = 18;
      const by = 54;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = (v === 'evil') ? 'rgba(255,59,47,0.9)'
        : (v === 'aurora-aero') ? 'rgba(255,215,0,0.85)'
          : (v === 'vaporwave') ? 'rgba(255,0,255,0.80)'
            : 'rgba(255,210,125,0.9)';
      ctx.fillRect(bx, by, Math.floor(barW * (this.hp / this.maxHp)), barH);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.strokeRect(bx, by, barW, barH);
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

  SuperBario99.ThemeBoss = ThemeBoss;
})();
