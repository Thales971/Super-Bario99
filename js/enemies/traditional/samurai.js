// Samurai (v2): bloqueia e ataca em intervalos
window.SuperBario99 = window.SuperBario99 || {};

(function () {
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
        if (player.velocityY > 0 && player.y + player.height < this.y + this.height * 0.5) {
          this.die();
          player.velocityY = -10;
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

      // Armadura
      ctx.fillStyle = themeId === 'metro' ? '#c0c8d1' : '#34495e';
      ctx.fillRect(x, this.y, this.width, this.height);

      // Kabuto
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(x + 4, this.y - 8, this.width - 8, 10);

      // Faixa vermelha
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(x + 6, this.y + 18, this.width - 12, 5);

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

      // Olhos
      ctx.fillStyle = '#f5f6fa';
      ctx.fillRect(x + 10, this.y + 10, 4, 4);
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

  SuperBario99.SamuraiEnemy = Samurai;
})();
