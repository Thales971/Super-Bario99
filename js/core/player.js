// Player v2: humano estilo anime com kimono + ataque no X

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  class PlayerV2 {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 32;
      this.height = 52;

      this.speed = 5;
      this.jumpForce = 15;
      this.velocityY = 0;
      this.onGround = false;

      this.direction = 'right';
      this.score = 0;
      this.lives = 10;

      this.invincibleTime = 0;

      // animação
      this.walkTime = 0;
      this._isMoving = false;

      // Ataque
      this.attackCooldown = 0;
      this.attackTime = 0;
    }

    update(gravity, level, keys) {
      if (this.invincibleTime > 0) this.invincibleTime--;
      if (this.attackCooldown > 0) this.attackCooldown--;
      if (this.attackTime > 0) this.attackTime--;

      this._isMoving = false;

      // Movimento horizontal
      if (keys['ArrowLeft']) {
        this.x -= this.speed;
        this.direction = 'left';
        this._isMoving = true;
      }
      if (keys['ArrowRight']) {
        this.x += this.speed;
        this.direction = 'right';
        this._isMoving = true;
      }

      if (this._isMoving && this.onGround) this.walkTime++;
      else this.walkTime = 0;

      // Gravidade
      this.velocityY += gravity;
      this.y += this.velocityY;

      // Colisão com plataformas (somente de cima para simplificar)
      this.onGround = false;
      for (const p of level.platforms) {
        if (this._collides(p)) {
          if (this.velocityY > 0 && this.y + this.height <= p.y + 18) {
            this.y = p.y - this.height;
            this.velocityY = 0;
            this.onGround = true;
          }
        }
      }

      // chão
      if (this.y > 450 - this.height) {
        this.y = 450 - this.height;
        this.velocityY = 0;
        this.onGround = true;
      }

      // limites mundo
      const worldWidth = level.worldWidth || 800;
      if (this.x < 0) this.x = 0;
      if (this.x > worldWidth - this.width) this.x = worldWidth - this.width;
    }

    jump(audio) {
      if (this.onGround) {
        this.velocityY = -this.jumpForce;
        this.onGround = false;
        if (audio) audio.playSfx('jump');
      }
    }

    attack(audio) {
      if (this.attackCooldown > 0) return;
      this.attackTime = 10;
      this.attackCooldown = 24;
      if (audio) audio.playSfx('slash');
    }

    getAttackHitbox() {
      if (this.attackTime <= 0) return null;
      const dir = this.direction === 'right' ? 1 : -1;
      return {
        x: this.x + (dir === 1 ? this.width : -26),
        y: this.y + 18,
        width: 26,
        height: 16
      };
    }

    takeHit() {
      if (this.invincibleTime > 0) return;
      this.lives--;
      this.invincibleTime = 90;
    }

    draw(ctx, cameraX, themeId) {
      const blink = this.invincibleTime > 0 && (Math.floor(this.invincibleTime / 6) % 2 === 0);
      if (blink) return;

      const x = this.x - cameraX;
      const y = this.y;

      // Paleta (kimono muda levemente por tema)
      let kimono = '#c0392b';
      let kimonoShade = '#a93226';
      let obi = '#f1c40f';
      if (themeId === 'fruitiger') { kimono = '#4b6cb7'; kimonoShade = '#3b5a9a'; obi = '#dbe6ff'; }
      if (themeId === 'tecnozen') { kimono = '#1a1f2b'; kimonoShade = '#0f1320'; obi = '#23d5ff'; }
      if (themeId === 'dorfic') { kimono = '#2f2a24'; kimonoShade = '#1f1b17'; obi = '#3c6e47'; }
      if (themeId === 'metro') { kimono = '#2b2f36'; kimonoShade = '#1f2329'; obi = '#4aa3ff'; }
      if (themeId === 'evil') { kimono = '#1b0d12'; kimonoShade = '#12060b'; obi = '#ff3b2f'; }
      if (themeId === 'memefusion') { kimono = '#3a2f5b'; kimonoShade = '#2a2044'; obi = '#ffd27d'; }

      // Pernas (animação simples)
      const stride = this.onGround ? Math.sin(this.walkTime * 0.35) * 4 : 0;
      ctx.fillStyle = '#2c2c2c';
      ctx.fillRect(x + 8, y + 44, 6, 8 + Math.max(0, stride));
      ctx.fillRect(x + 18, y + 44, 6, 8 + Math.max(0, -stride));

      // Corpo (kimono)
      ctx.fillStyle = kimono;
      ctx.fillRect(x + 6, y + 18, this.width - 12, this.height - 22);
      ctx.fillStyle = kimonoShade;
      ctx.fillRect(x + 6, y + 18, 10, this.height - 22);

      // Obi
      ctx.fillStyle = obi;
      ctx.fillRect(x + 8, y + 36, this.width - 16, 7);

      // Braços/mangas
      ctx.fillStyle = kimonoShade;
      ctx.fillRect(x - 2, y + 24, 10, 14);
      ctx.fillRect(x + this.width - 8, y + 24, 10, 14);

      // Cabeça (mais humana)
      ctx.fillStyle = '#f2c9a0';
      ctx.beginPath();
      ctx.arc(x + 16, y + 12, 10, 0, Math.PI * 2);
      ctx.fill();

      // Cabelo + franja
      ctx.fillStyle = '#1f1f1f';
      ctx.beginPath();
      ctx.arc(x + 16, y + 9, 12, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + 6, y + 2, 20, 6);

      // Faixa/headband (anime)
      ctx.fillStyle = themeId === 'tecnozen' ? '#23d5ff' : 'rgba(255,255,255,0.75)';
      ctx.fillRect(x + 6, y + 7, 20, 3);

      // Olhos (menos "quadradão")
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 9, y + 11, 6, 4);
      ctx.fillRect(x + 17, y + 11, 6, 4);
      ctx.fillStyle = themeId === 'evil' ? '#ff3b2f' : '#2e86de';
      ctx.fillRect(x + 11, y + 12, 3, 2);
      ctx.fillRect(x + 19, y + 12, 3, 2);

      // Nariz/boca discretos
      ctx.fillStyle = 'rgba(44,62,80,0.65)';
      ctx.fillRect(x + 15, y + 16, 2, 1);
      ctx.fillStyle = 'rgba(142,68,173,0.55)';
      ctx.fillRect(x + 14, y + 18, 4, 1);

      // Espada no ataque
      const hit = this.getAttackHitbox();
      if (hit) {
        const hx = hit.x - cameraX;
        ctx.strokeStyle = '#f5f6fa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hx + (this.direction === 'right' ? 2 : hit.width - 2), hit.y + 14);
        ctx.lineTo(hx + (this.direction === 'right' ? hit.width : 0), hit.y);
        ctx.stroke();

        // rastro do golpe
        ctx.strokeStyle = themeId === 'evil' ? 'rgba(255,59,47,0.35)' : 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(x + 16 + (this.direction === 'right' ? 18 : -18), y + 28, 18, -0.9, 0.9);
        ctx.stroke();
      }
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

  SuperBario99.PlayerV2 = PlayerV2;
})();
