// Ninja (v2): aparece/desaparece e dá dash com fumaça
window.SuperBario99 = window.SuperBario99 || {};

(function () {
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
        if (player.velocityY > 0 && player.y + player.height < this.y + this.height * 0.5) {
          this.die();
          player.velocityY = -10;
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

      // Corpo ninja
      ctx.fillStyle = themeId === 'evil' ? '#ff3b2f' : '#111';
      ctx.fillRect(x, this.y, this.width, this.height);

      // Faixa
      ctx.fillStyle = '#f5f6fa';
      ctx.fillRect(x + 4, this.y + 12, this.width - 8, 6);

      // Olhos
      ctx.fillStyle = '#00d2ff';
      ctx.fillRect(x + 6, this.y + 14, 6, 3);
      ctx.fillRect(x + 16, this.y + 14, 6, 3);
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
