// Drone (v2): inimigo voador (bom para TecnoZen / Metro)
window.SuperBario99 = window.SuperBario99 || {};

(function () {
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
    }

    update(level, player, diff) {
      if (!this.alive) return;
      this.timer++;

      const speed = 1.35 * diff.enemySpeed;
      const dir = player.x < this.x ? -1 : 1;
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
        if (player.velocityY > 0 && player.y + player.height < this.y + this.height * 0.65) {
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

      const base = themeId === 'tecnozen' ? '#23d5ff' : (themeId === 'metro' ? '#4aa3ff' : '#dfe6e9');
      ctx.fillStyle = base;
      ctx.fillRect(x, this.y, this.width, this.height);

      // hélices
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 6, this.y + 2);
      ctx.lineTo(x + 6, this.y + 2);
      ctx.moveTo(x + this.width - 6, this.y + 2);
      ctx.lineTo(x + this.width + 6, this.y + 2);
      ctx.stroke();

      // olho/sensor
      ctx.fillStyle = themeId === 'evil' ? '#ff3b2f' : '#2c3e50';
      ctx.fillRect(x + 11, this.y + 6, 6, 4);
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
