// Kitsune (v2): raposa-espírito com "blink" e dashes curtos
window.SuperBario99 = window.SuperBario99 || {};

(function () {
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
        if (player.velocityY > 0 && player.y + player.height < this.y + this.height * 0.55) {
          this.die();
          player.velocityY = -10;
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

      // blink visual
      if (this.blinkTimer > 0) {
        ctx.fillStyle = 'rgba(255,182,213,0.22)';
        ctx.fillRect(x - 6, this.y - 6, this.width + 12, this.height + 12);
      }

      // corpo
      ctx.fillStyle = themeId === 'evil' ? '#ff3b2f' : '#f39c12';
      ctx.fillRect(x, this.y, this.width, this.height);

      // cauda
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillRect(x - 8, this.y + 16, 10, 10);

      // olhos
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(x + 8, this.y + 10, 4, 4);
      ctx.fillRect(x + 18, this.y + 10, 4, 4);
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
