// Projectiles (v2) - usado por power-ups (fire/ice)
// Sem imagens externas. Render simples em Canvas.

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  class Projectile {
    constructor({ x, y, vx, vy, kind, bornAt }) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.kind = kind; // 'fire' | 'ice'
      this.bornAt = bornAt || performance.now();
      this.radius = (kind === 'ice') ? 6 : 6;
      this.alive = true;
      this.lifeMs = (kind === 'ice') ? 1500 : 1600;
    }

    update(gravity, level, now, timeScale) {
      if (!this.alive) return;
      const t = (typeof now === 'number') ? now : performance.now();
      if (t - this.bornAt > this.lifeMs) {
        this.alive = false;
        return;
      }

      const ts = (typeof timeScale === 'number') ? timeScale : 1;

      // Movimento simples por frame (o jogo não usa dt ainda)
      this.vy += (gravity || 0.8) * 0.18 * ts;
      this.x += this.vx * ts;
      this.y += this.vy * ts;

      // Colisão com plataformas: se bater, morre (ice) ou quica 1x (fire)
      const r = this.radius;
      const px = this.x - r;
      const py = this.y - r;
      const pw = r * 2;
      const ph = r * 2;

      for (const p of (level.platforms || [])) {
        const hit = (
          px < p.x + p.width &&
          px + pw > p.x &&
          py < p.y + p.height &&
          py + ph > p.y
        );
        if (!hit) continue;

        if (this.kind === 'fire') {
          // quica levemente uma vez
          if (!this._bounced) {
            this._bounced = true;
            this.vy = -Math.abs(this.vy) * 0.65;
            this.vx *= 0.92;
            this.y = p.y - r - 1;
          } else {
            this.alive = false;
          }
        } else {
          this.alive = false;
        }
        break;
      }

      // Limites do mundo
      const worldWidth = level.worldWidth || 800;
      if (this.x < -40 || this.x > worldWidth + 40 || this.y > 520 || this.y < -80) {
        this.alive = false;
      }
    }

    intersectsAabb(a) {
      const r = this.radius;
      const px = this.x - r;
      const py = this.y - r;
      const pw = r * 2;
      const ph = r * 2;
      return (
        px < a.x + a.width &&
        px + pw > a.x &&
        py < a.y + a.height &&
        py + ph > a.y
      );
    }

    draw(ctx, cameraX, now) {
      if (!this.alive) return;
      const x = this.x - cameraX;
      const y = this.y;
      const t = (typeof now === 'number') ? now : performance.now();

      ctx.save();

      if (this.kind === 'fire') {
        const pulse = 0.35 + 0.25 * Math.sin(t / 70);
        ctx.fillStyle = 'rgba(255,59,47,0.95)';
        ctx.beginPath();
        ctx.arc(x, y, this.radius + pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,215,0,0.65)';
        ctx.beginPath();
        ctx.arc(x - 2, y - 2, Math.max(2, this.radius - 2), 0, Math.PI * 2);
        ctx.fill();
      } else {
        const pulse = 0.25 + 0.20 * Math.sin(t / 90);
        ctx.fillStyle = 'rgba(0,191,255,0.92)';
        ctx.beginPath();
        ctx.arc(x, y, this.radius + pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, this.radius + 2 + pulse, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  SuperBario99.Projectile = Projectile;
})();
