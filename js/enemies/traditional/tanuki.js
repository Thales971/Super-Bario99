// Tanuki (v2): vira estátua quando o jogador olha, anda quando não olha
window.SuperBario99 = window.SuperBario99 || {};

(function () {
  class Tanuki {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 30;
      this.height = 34;
      this.type = 'tanuki';
      this.alive = true;

      this.vx = 0;
      this.vy = 0;
      this.gravity = 0.8;
      this.onGround = false;

      this.asStatue = false;
      this.direction = 1;
    }

    update(level, player, diff) {
      if (!this.alive) return;

      // "Olhar" do player: se ele está virado para o tanuki e perto
      const playerFacing = player.direction === 'right' ? 1 : -1;
      const rel = this.x - player.x;
      const looking = (playerFacing === 1 && rel > 0) || (playerFacing === -1 && rel < 0);
      const near = Math.abs(rel) < 360;

      this.asStatue = looking && near;

      if (!this.asStatue) {
        this.direction = player.x < this.x ? -1 : 1;
        const speed = 1.0 * diff.enemySpeed;
        this.vx = this.direction * speed;
      } else {
        this.vx = 0;
      }

      this.vy += this.gravity;
      this.y += this.vy;
      this.x += this.vx;

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

      const maxX = (level.worldWidth || 800) - this.width;
      if (this.x < 0) this.x = 0;
      if (this.x > maxX) this.x = maxX;
    }

    checkPlayerCollision(player) {
      if (!this.alive) return false;
      if (this._collides(player)) {
        if (player.velocityY > 0 && player.y + player.height < this.y + this.height * 0.5) {
          this.die();
          player.velocityY = -10;
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

      if (this.asStatue) {
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(x, this.y, this.width, this.height);
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(x + 6, this.y + 8, this.width - 12, 6);
        return;
      }

      ctx.fillStyle = '#8e5a2b';
      ctx.fillRect(x, this.y, this.width, this.height);

      // máscara
      ctx.fillStyle = '#f5f6fa';
      ctx.fillRect(x + 6, this.y + 8, 18, 12);
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(x + 10, this.y + 12, 3, 3);
      ctx.fillRect(x + 17, this.y + 12, 3, 3);

      // cauda
      ctx.fillStyle = '#6d3c1b';
      ctx.fillRect(x + (this.direction === 1 ? -6 : this.width), this.y + 18, 6, 10);
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

  SuperBario99.TanukiEnemy = Tanuki;
})();
