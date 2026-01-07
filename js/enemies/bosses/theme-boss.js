// Boss por tema (v2): um boss no fim de cada bloco (5,10,15,20,25,30,35)
// Mantém tudo em Canvas shapes.

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const util = SuperBario99.util;

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

      this.maxHp = 14 + Math.floor(levelIndex / 5) * 4;
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

      const speedBase = 1.1 * diff.enemySpeed;
      const toward = player.x < this.x ? -1 : 1;

      // Padrões simples por tema
      const wantsDash = (this.themeId === 'japan' || this.themeId === 'metro' || this.themeId === 'memefusion');
      const wantsShots = (this.themeId === 'tecnozen' || this.themeId === 'evil' || this.themeId === 'fruitiger' || this.themeId === 'memefusion');

      // Movimento base (pressão no player)
      this.vx = toward * speedBase;

      // Dash periódico
      if (wantsDash && this.dashCooldown <= 0 && Math.abs(player.x - this.x) < 420) {
        this.vx = toward * speedBase * 5.2;
        this.dashCooldown = 95;
      }

      // Tiro (projéteis)
      if (wantsShots && this.shootCooldown <= 0) {
        this._shootAt(player);
        this.shootCooldown = this.themeId === 'evil' ? 45 : 60;
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
      const baseVx = dir * (3.2 + Math.min(2.2, this.levelIndex / 18));

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
      const count = this.themeId === 'evil' ? 3 : (this.themeId === 'memefusion' ? 2 : 1);
      for (let i = 0; i < count; i++) {
        const vy = -1.2 + i * 1.2;
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
        if (player.velocityY > 0 && player.y + player.height < this.y + this.height * 0.45) {
          this.takeDamage(2);
          player.velocityY = -12;
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

      // Corpo (bem grande) + “máscara” por tema
      let body = '#2c2c2c';
      let accent = '#f5f6fa';
      if (themeId === 'japan') { body = '#c0392b'; accent = '#f5f6fa'; }
      if (themeId === 'fruitiger') { body = '#4b6cb7'; accent = '#dbe6ff'; }
      if (themeId === 'tecnozen') { body = '#1a1f2b'; accent = '#23d5ff'; }
      if (themeId === 'dorfic') { body = '#2f2a24'; accent = '#3c6e47'; }
      if (themeId === 'metro') { body = '#2b2f36'; accent = '#4aa3ff'; }
      if (themeId === 'evil') { body = '#1b0d12'; accent = '#ff3b2f'; }
      if (themeId === 'memefusion') { body = '#3a2f5b'; accent = '#ffd27d'; }

      // base
      ctx.fillStyle = body;
      ctx.fillRect(x, y + 10, this.width, this.height - 10);
      ctx.fillStyle = accent;
      ctx.fillRect(x + 10, y + 22, this.width - 20, 10);

      // “cabeça”
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(x + this.width * 0.5, y + 16, 16, 0, Math.PI * 2);
      ctx.fill();

      // olhos
      ctx.fillStyle = themeId === 'evil' ? '#ff3b2f' : '#2e86de';
      ctx.fillRect(x + 26, y + 14, 10, 6);
      ctx.fillRect(x + 48, y + 14, 10, 6);

      // aura (pulso)
      ctx.strokeStyle = themeId === 'tecnozen' ? 'rgba(35,213,255,0.35)' : 'rgba(255,255,255,0.18)';
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
      ctx.fillStyle = themeId === 'evil' ? 'rgba(255,59,47,0.9)' : 'rgba(255,210,125,0.9)';
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
