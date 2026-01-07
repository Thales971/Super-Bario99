// Yokai (v2): persegue com pathfinding A* (coarse grid)
window.SuperBario99 = window.SuperBario99 || {};

(function () {
  class Yokai {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 30;
      this.height = 40;
      this.type = 'yokai';
      this.alive = true;

      this.vx = 0;
      this.vy = 0;
      this.gravity = 0.8;
      this.onGround = false;

      this.repathTimer = 0;
      this.path = null;
      this.pathIndex = 0;

      this.tileSize = 32;
      this.gridCache = null;
    }

    _ensureGrid(level, canvasHeight) {
      if (!this.gridCache || this.gridCache.levelRef !== level) {
        const grid = SuperBario99.pathfinding.buildSolidGrid(level, this.tileSize, canvasHeight);
        this.gridCache = { levelRef: level, grid };
      }
      return this.gridCache.grid;
    }

    update(level, player, diff, canvasHeight) {
      if (!this.alive) return;

      // só ativa pathfinding a partir do tier intermediário
      const useAStar = diff.tier !== 'basic';

      if (useAStar) {
        this.repathTimer--;
        if (this.repathTimer <= 0) {
          this.repathTimer = Math.floor(25 + diff.reaction * 120);

          const grid = this._ensureGrid(level, canvasHeight);
          const s = SuperBario99.pathfinding.toCell(grid, this.x, this.y);
          const g = SuperBario99.pathfinding.toCell(grid, player.x, player.y);

          const path = SuperBario99.pathfinding.findPath(grid, s, g, 1600);
          this.path = path;
          this.pathIndex = 0;
        }
      }

      // decide direção
      let targetX = player.x;
      if (useAStar && this.path && this.path.length > 1) {
        const grid = this._ensureGrid(level, canvasHeight);
        const node = this.path[Math.min(this.pathIndex + 1, this.path.length - 1)];
        targetX = node.x * grid.tileSize + 8;
        // avança no path
        const dxNode = (node.x * grid.tileSize) - this.x;
        if (Math.abs(dxNode) < 12) this.pathIndex++;
      }

      const speed = 1.15 * diff.enemySpeed;
      const direction = targetX < this.x ? -1 : 1;
      this.vx = direction * speed;

      // "flutua" um pouco (yokai)
      if (diff.tier === 'advanced') {
        this.vy += this.gravity * 0.6;
      } else {
        this.vy += this.gravity;
      }

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
        // Yokai pode ser morto pulando (exceto em advanced: precisa ataque)
        if (player.velocityY > 0 && player.y + player.height < this.y + this.height * 0.5) {
          this.die();
          player.velocityY = -10;
          player.score += 200;
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

      // corpo espectral
      ctx.fillStyle = themeId === 'evil' ? 'rgba(255,59,47,0.9)' : 'rgba(155,89,182,0.9)';
      ctx.beginPath();
      ctx.arc(x + 15, this.y + 16, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillRect(x + 2, this.y + 16, 26, 20);

      // olhos
      ctx.fillStyle = '#f5f6fa';
      ctx.fillRect(x + 9, this.y + 14, 4, 4);
      ctx.fillRect(x + 18, this.y + 14, 4, 4);
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(x + 10, this.y + 15, 2, 2);
      ctx.fillRect(x + 19, this.y + 15, 2, 2);
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

  SuperBario99.YokaiEnemy = Yokai;
})();
