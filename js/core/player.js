// Player v2: personagem retro (pixel art) + ataque no X

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  // Sprite "pixel art" simples (16x26) em escala 2 => 32x52.
  // Observação: é um personagem original estilo retro (não é sprite NES copiado).
  const SPRITE = {
    idle: [
      '.....RRRRRR.....',
      '....RRRRRRRR....',
      '...RRRWWRRRRR...',
      '...RRRWWRRRRR...',
      '...RRRRRRRRRR...',
      '....KKWWWWKK....',
      '....KWWWWWWK....',
      '....KKKWWKKK....',
      '.....RRRRRR.....',
      '....RRRRRRRR....',
      '....BBBBBBBB....',
      '...BBBBBBBBBB...',
      '...BBBBKKBBBB...',
      '...BBBBBBBBBB...',
      '....BBBBBBBB....',
      '....BB....BB....',
      '...BBB....BBB...',
      '...KKK....KKK...',
      '...KKK....KKK...',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................'
    ],
    run1: [
      '.....RRRRRR.....',
      '....RRRRRRRR....',
      '...RRRWWRRRRR...',
      '...RRRWWRRRRR...',
      '...RRRRRRRRRR...',
      '....KKWWWWKK....',
      '....KWWWWWWK....',
      '....KKKWWKKK....',
      '.....RRRRRR.....',
      '....RRRRRRRR....',
      '....BBBBBBBB....',
      '...BBBBBBBBBB...',
      '...BBBBKKBBBB...',
      '...BBBBBBBBBB...',
      '....BBBBBBBB....',
      '....BB....BB....',
      '...BBB...BBB....',
      '...KKK..KKK.....',
      '....KKK.KKK.....',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................'
    ],
    run2: [
      '.....RRRRRR.....',
      '....RRRRRRRR....',
      '...RRRWWRRRRR...',
      '...RRRWWRRRRR...',
      '...RRRRRRRRRR...',
      '....KKWWWWKK....',
      '....KWWWWWWK....',
      '....KKKWWKKK....',
      '.....RRRRRR.....',
      '....RRRRRRRR....',
      '....BBBBBBBB....',
      '...BBBBBBBBBB...',
      '...BBBBKKBBBB...',
      '...BBBBBBBBBB...',
      '....BBBBBBBB....',
      '.....BB..BB.....',
      '....BBB..BBB....',
      '....KKK..KKK....',
      '....KKK..KKK....',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................'
    ],
    run3: [
      '.....RRRRRR.....',
      '....RRRRRRRR....',
      '...RRRWWRRRRR...',
      '...RRRWWRRRRR...',
      '...RRRRRRRRRR...',
      '....KKWWWWKK....',
      '....KWWWWWWK....',
      '....KKKWWKKK....',
      '.....RRRRRR.....',
      '....RRRRRRRR....',
      '....BBBBBBBB....',
      '...BBBBBBBBBB...',
      '...BBBBKKBBBB...',
      '...BBBBBBBBBB...',
      '....BBBBBBBB....',
      '....BB....BB....',
      '....BBB...BBB...',
      '.....KKK..KKK...',
      '.....KKK.KKK....',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................'
    ],
    jump: [
      '.....RRRRRR.....',
      '....RRRRRRRR....',
      '...RRRWWRRRRR...',
      '...RRRWWRRRRR...',
      '...RRRRRRRRRR...',
      '....KKWWWWKK....',
      '....KWWWWWWK....',
      '....KKKWWKKK....',
      '.....RRRRRR.....',
      '....RRRRRRRR....',
      '....BBBBBBBB....',
      '...BBBBBBBBBB...',
      '...BBBBKKBBBB...',
      '...BBBBBBBBBB...',
      '....BBBBBBBB....',
      '.....BB..BB.....',
      '.....BB..BB.....',
      '....KKK..KKK....',
      '....KKK..KKK....',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................'
    ]
  };

  class PlayerV2 {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 32;
      this.height = 52;

      // Física “clássica”: aceleração gradual + controle no ar
      this.vx = 0;
      this.vy = 0;
      this.maxSpeed = 4.6;
      this.accelGround = 0.62;
      this.accelAir = 0.36;
      this.frictionGround = 0.80;
      this.frictionAir = 0.94;

      this.jumpForce = 15;
      this.onGround = false;

      // Classe / cosméticos
      this._sb99Class = 'bario';
      this._sb99Cosmetics = { palette: 'default', hat: 'none' };
      this._sb99BaseStats = {
        maxSpeed: this.maxSpeed,
        accelGround: this.accelGround,
        accelAir: this.accelAir,
        frictionGround: this.frictionGround,
        frictionAir: this.frictionAir,
        jumpForce: this.jumpForce
      };

      // Habilidades
      this._sb99JumpCount = 0;
      this._sb99MaxJumps = 2; // default: double jump leve
      this._sb99JumpWasDown = false;
      this._sb99DashWasDown = false;
      this._sb99SkillWasDown = false;
      this._sb99DashUntil = 0;
      this._sb99DashCdUntil = 0;
      this._sb99DashDir = 1;
      this._sb99WallJumpUntil = 0;
      this._sb99TouchWallLeft = false;
      this._sb99TouchWallRight = false;

      // Ninja: invisibilidade de classe
      this._sb99ClassInvisUntil = 0;
      this._sb99ClassSkillCdUntil = 0;

      this.direction = 'right';
      this.score = 0;
      this.lives = 10;

      this.invincibleTime = 0;

      // Efeitos temporários (usados por bosses)
      this._sb99SlowUntil = 0;
      this._sb99StunUntil = 0;

      // animação
      this.walkTime = 0;
      this._isMoving = false;

      // Ataque
      this.attackCooldown = 0;
      this.attackTime = 0;

      // squash & stretch (simples)
      this.squashTimer = 0;
      this.stretchTimer = 0;

      // água/nado
      this._sb99SwimCooldown = 0;
    }

    configure(opt) {
      const cls = String(opt?.playerClass || opt?.classId || 'bario');
      const palette = String(opt?.palette || 'default');
      const hatRaw = opt?.hat;
      const hat = (typeof hatRaw === 'string')
        ? hatRaw
        : (hatRaw ? 'cap' : 'none');

      this._sb99Class = cls;
      this._sb99Cosmetics = { palette, hat };

      // restaura base
      const b = this._sb99BaseStats;
      this.maxSpeed = b.maxSpeed;
      this.accelGround = b.accelGround;
      this.accelAir = b.accelAir;
      this.frictionGround = b.frictionGround;
      this.frictionAir = b.frictionAir;
      this.jumpForce = b.jumpForce;

      // defaults por classe
      if (cls === 'ninja') {
        this.jumpForce = b.jumpForce * 1.12;
        this.maxSpeed = b.maxSpeed * 1.06;
        this._sb99MaxJumps = 3; // triple jump
      } else if (cls === 'engineer') {
        this.maxSpeed = b.maxSpeed * 0.98;
        this._sb99MaxJumps = 2;
      } else if (cls === 'mage') {
        this.maxSpeed = b.maxSpeed * 0.98;
        this._sb99MaxJumps = 2;
      } else {
        // bario
        this._sb99MaxJumps = 2;
      }
    }

    update(gravity, level, keys, canvasHeight = 450, audio = null, now = 0, mod = null) {
      if (this.invincibleTime > 0) this.invincibleTime--;
      if (this.attackCooldown > 0) this.attackCooldown--;
      if (this.attackTime > 0) this.attackTime--;
      if (this.squashTimer > 0) this.squashTimer--;
      if (this.stretchTimer > 0) this.stretchTimer--;
      if (this._sb99SwimCooldown > 0) this._sb99SwimCooldown--;

      const baseScale = (mod && typeof mod.speedScale === 'number') ? mod.speedScale : 1;
      const tNow = (typeof now === 'number' && isFinite(now)) ? now : performance.now();
      const statusScale = (this._sb99SlowUntil && tNow < this._sb99SlowUntil) ? 0.62 : 1;
      const speedScale = baseScale * statusScale;

      const inWater = !!(mod && mod.inWater);
      const waterResistance = (mod && Number.isFinite(Number(mod.waterResistance))) ? Math.max(0, Math.min(0.9, Number(mod.waterResistance))) : 0;

      this._isMoving = false;

      // Estados de parede (wall jump)
      this._sb99TouchWallLeft = false;
      this._sb99TouchWallRight = false;

      // Entrada
      const stunned = (this._sb99StunUntil && tNow < this._sb99StunUntil);
      const left = stunned ? false : !!keys['ArrowLeft'];
      const right = stunned ? false : !!keys['ArrowRight'];

      const jumpDown = stunned ? false : (!!keys[' '] || !!keys['ArrowUp']);
      const jumpJust = jumpDown && !this._sb99JumpWasDown;

      const dashDown = stunned ? false : (!!keys['Shift'] || !!keys['z'] || !!keys['Z']);
      const dashJust = dashDown && !this._sb99DashWasDown;

      const skillDown = stunned ? false : (!!keys['c'] || !!keys['C']);
      const skillJust = skillDown && !this._sb99SkillWasDown;

      // Ninja: skill = invisibilidade temporária
      if (skillJust && this._sb99Class === 'ninja') {
        if (!this._sb99ClassSkillCdUntil || tNow >= this._sb99ClassSkillCdUntil) {
          this._sb99ClassInvisUntil = tNow + 3000;
          this._sb99ClassSkillCdUntil = tNow + 10000;
          try { audio?.playSfx?.('ninjaUse'); } catch (_) {}
        }
      }

      // Dash
      if (dashJust && (!this._sb99DashCdUntil || tNow >= this._sb99DashCdUntil)) {
        const dir = (left && !right) ? -1 : (right && !left) ? 1 : (this.direction === 'left' ? -1 : 1);
        this._sb99DashDir = dir;
        this._sb99DashUntil = tNow + 160;
        this._sb99DashCdUntil = tNow + 5000;
        try { audio?.playSfx?.('ninjaUse'); } catch (_) {}
      }

      const dashing = (this._sb99DashUntil && tNow < this._sb99DashUntil);
      if (dashing) {
        const dashSpeed = 11.0 * Math.max(0.65, Math.min(1.15, speedScale));
        this.vx = this._sb99DashDir * dashSpeed;
        this._isMoving = true;
        this.direction = (this._sb99DashDir < 0) ? 'left' : 'right';
      } else {
        // Movimento horizontal (aceleração)
        let accel = this.onGround ? this.accelGround : this.accelAir;
        if (inWater) accel *= 0.55;
        if (left && !right) {
          this.vx -= accel;
          this.direction = 'left';
          this._isMoving = true;
        } else if (right && !left) {
          this.vx += accel;
          this.direction = 'right';
          this._isMoving = true;
        } else {
          // atrito
          const fr = inWater ? (0.90 - waterResistance * 0.10) : (this.onGround ? this.frictionGround : this.frictionAir);
          this.vx *= fr;
          if (Math.abs(this.vx) < 0.03) this.vx = 0;
        }
      }

      // clamp velocidade (clima pode reduzir movimentação)
      let maxSpeed = this.maxSpeed * Math.max(0.55, Math.min(1.2, speedScale));
      if (inWater) maxSpeed *= (1 - 0.22 * waterResistance);
      if (this.vx > maxSpeed) this.vx = maxSpeed;
      if (this.vx < -maxSpeed) this.vx = -maxSpeed;

      if (this._isMoving && this.onGround) this.walkTime++;
      else this.walkTime = 0;

      // ---- Integração + colisão por eixos (resolve “atravessar plataforma”) ----

      // eixo X
      this.x += this.vx;
      for (const p of level.platforms) {
        if (p && p.sb99Solid === false) continue;
        if (!this._collides(p)) continue;
        if (this.vx > 0) {
          this._sb99TouchWallRight = true;
          this.x = p.x - this.width;
          this.vx = 0;
        } else if (this.vx < 0) {
          this._sb99TouchWallLeft = true;
          this.x = p.x + p.width;
          this.vx = 0;
        }
      }

      // eixo Y
      const prevY = this.y;
      const prevTop = prevY;
      const prevBottom = prevY + this.height;

      // Física na água: mantém compatibilidade (só altera quando inWater)
      let g = gravity;
      if (inWater && g > 0.45) g = g * 0.35;
      this.vy += g;

      if (inWater) {
        // arrasto e limite de queda (evita “pedra”)
        this.vy *= (0.90 - waterResistance * 0.10);
        const fallCap = 6.0;
        if (this.vy > fallCap) this.vy = fallCap;
      }
      this.y += this.vy;

      const wasOnGround = this.onGround;
      this.onGround = false;

      // Resolve colisão vertical escolhendo o melhor candidato.
      // Isso evita casos em que o player encosta em 2 retângulos empilhados
      // (ex.: plataforma + QuestionBlock em cima) e “pousa” no de baixo.
      // eps maior para não perder landing em blocos 32x32.
      const eps = 8;
      if (this.vy >= 0) {
        // caindo: escolhe a plataforma mais alta (menor y) que foi atingida por cima
        let best = null;
        for (const p of level.platforms) {
          if (p && p.sb99Solid === false) continue;
          if (!this._collides(p)) continue;
          // landing: precisa ter cruzado o topo da plataforma vindo de cima
          const crossedTop = (prevBottom <= p.y + eps) && ((this.y + this.height) >= p.y - 1);
          if (!crossedTop) continue;
          if (!best || p.y < best.y) best = p;
        }
        if (best) {
          this.y = best.y - this.height;
          this.vy = 0;
          this.onGround = true;
          if (typeof best.onHitFromAbove === 'function') {
            try { best.onHitFromAbove(this, audio, level, now || performance.now()); } catch (_) {}
          }
        }
      } else if (this.vy < 0) {
        // subindo: escolhe a plataforma mais baixa (maior y+height) atingida por baixo
        let best = null;
        for (const p of level.platforms) {
          if (p && p.sb99Solid === false) continue;
          if (!this._collides(p)) continue;
          // head-bump: precisa ter cruzado a base da plataforma vindo de baixo
          const crossedBottom = (prevTop >= (p.y + p.height) - eps) && (this.y <= (p.y + p.height) + 1);
          if (!crossedBottom) continue;
          if (!best || (p.y + p.height) > (best.y + best.height)) best = p;
        }
        if (best) {
          this.y = best.y + best.height;
          this.vy = 0;
          if (typeof best.onHitFromBelow === 'function') {
            try { best.onHitFromBelow(this, audio, level, now || performance.now()); } catch (_) {}
          }
        }
      }

      // chão do canvas (fallback) — margem para evitar “abaixo da terra”
      const floorMargin = 20;
      const floorY = canvasHeight - this.height - floorMargin;
      if (this.y > floorY) {
        this.y = floorY;
        this.vy = 0;
        this.onGround = true;
      }

      // squash ao aterrissar
      if (!wasOnGround && this.onGround) {
        this.squashTimer = 8;
        this._sb99JumpCount = 0;
      }

      // Jump / wall jump (edge)
      if (jumpJust) {
        const canWall = (!this.onGround) && (this._sb99TouchWallLeft || this._sb99TouchWallRight) && (!this._sb99WallJumpUntil || tNow >= this._sb99WallJumpUntil);
        if (canWall) {
          const away = this._sb99TouchWallLeft ? 1 : -1;
          this.vx = away * 6.8;
          this.vy = -this.jumpForce * 0.95;
          this._sb99WallJumpUntil = tNow + 180;
          this._sb99JumpCount = Math.min(this._sb99MaxJumps, this._sb99JumpCount + 1);
          this.stretchTimer = 8;
          try { audio?.playSfx?.('jump'); } catch (_) {}
        } else {
          if (this.onGround || this._sb99JumpCount < this._sb99MaxJumps) {
            const idx = this._sb99JumpCount;
            const scale = (idx <= 0) ? 1.0 : (idx === 1 ? 0.95 : 0.90);
            this.vy = -this.jumpForce * scale;
            this.onGround = false;
            this.stretchTimer = 8;
            this._sb99JumpCount++;
            try { audio?.playSfx?.('jump'); } catch (_) {}
          }
        }
      }

      this._sb99JumpWasDown = jumpDown;
      this._sb99DashWasDown = dashDown;
      this._sb99SkillWasDown = skillDown;

      // limites mundo
      const worldWidth = level.worldWidth || 800;
      if (this.x < 0) this.x = 0;
      if (this.x > worldWidth - this.width) this.x = worldWidth - this.width;
    }

    jump(audio) {
      if (this.onGround) {
        this.vy = -this.jumpForce;
        this.onGround = false;
        this.stretchTimer = 8;
        if (audio) audio.playSfx('jump');
      }
    }

    // Nado: stroke curto (usado quando o GameV2 detecta que está na água)
    swimStroke(strength, audio) {
      const s = Number(strength);
      if (!Number.isFinite(s) || s <= 0) return;
      if (this._sb99SwimCooldown > 0) return;

      // stroke: impulsão para cima + corta queda
      this.vy = -Math.min(16, Math.max(2, s));
      this.onGround = false;
      this.stretchTimer = 6;
      this._sb99SwimCooldown = 10;
      try { audio?.playSfx?.('jump'); } catch (_) {}
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

    draw(ctx, cameraX, themeId, powerups = null) {
      const blink = this.invincibleTime > 0 && (Math.floor(this.invincibleTime / 6) % 2 === 0);
      if (blink) return;

      const now = performance.now();
      const invisible = !!(
        (powerups && powerups.isPlayerInvisible && powerups.isPlayerInvisible(now)) ||
        (this._sb99ClassInvisUntil && now < this._sb99ClassInvisUntil)
      );
      const electric = !!(powerups && powerups.isActive && powerups.isActive('electric', now));

      const x = this.x - cameraX;
      const y = this.y;

      // squash & stretch (bem leve)
      const squash = this.squashTimer > 0 ? (this.squashTimer / 8) : 0;
      const stretch = this.stretchTimer > 0 ? (this.stretchTimer / 8) : 0;
      const sx = 1 + squash * 0.10 - stretch * 0.04;
      const sy = 1 - squash * 0.10 + stretch * 0.08;

      ctx.save();
      if (invisible) ctx.globalAlpha = 0.28;
      ctx.translate(x + this.width / 2, y + this.height / 2);
      ctx.scale(sx, sy);
      ctx.translate(-(x + this.width / 2), -(y + this.height / 2));

      // Aura elétrica (simples, prioriza leitura)
      if (electric) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,215,0,0.35)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + this.width / 2, y + this.height / 2, 34, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Seleção de frame
      let frameName = 'idle';
      if (!this.onGround) frameName = 'jump';
      else if (this._isMoving) {
        const idx = Math.floor((this.walkTime / 6) % 3);
        frameName = (idx === 0) ? 'run1' : (idx === 1 ? 'run2' : 'run3');
      }

      // Desenha sprite 8-bit (paleta limitada)
      const flip = this.direction === 'left';
      const scale = 2;
      const frame = SPRITE[frameName] || SPRITE.idle;
      const spriteH = frame.length;
      const spriteW = frame[0] ? frame[0].length : 16;
      const drawX0 = x + Math.floor((this.width - spriteW * scale) / 2);
      // Alinha pelo último pixel visível (as matrizes têm linhas vazias no fim)
      let visibleBottom = -1;
      for (let row = 0; row < frame.length; row++) {
        const line = frame[row];
        // linha contém algum pixel desenhável?
        for (let col = 0; col < line.length; col++) {
          const ch = line[col];
          if (ch !== '.' && ch !== ' ' && ch !== undefined) {
            visibleBottom = row;
            break;
          }
        }
      }
      const trimBottom = (visibleBottom >= 0) ? (frame.length - 1 - visibleBottom) : 0;
      const drawY0 = y + (this.height - spriteH * scale) + (trimBottom * scale);
      const palId = String(this._sb99Cosmetics?.palette || 'default');
      const palette = (palId === 'ocean')
        ? { R: '#00bcd4', B: '#2b63d1', K: '#0d1b2a', W: '#f5f6fa' }
        : (palId === 'neon')
          ? { R: '#ff00ff', B: '#00ffff', K: '#0a0a0a', W: '#f5f6fa' }
          : (palId === 'retro')
            ? { R: '#c44536', B: '#2d6a4f', K: '#1b1b1b', W: '#f6f1d1' }
            : { R: '#d12b2b', B: '#2b63d1', K: '#1b1b1b', W: '#f5f6fa' };

      for (let row = 0; row < frame.length; row++) {
        const line = frame[row];
        for (let col = 0; col < line.length; col++) {
          const ch = line[col];
          if (ch === '.' || !palette[ch]) continue;
          const drawCol = flip ? (line.length - 1 - col) : col;
          ctx.fillStyle = palette[ch];
          ctx.fillRect(drawX0 + drawCol * scale, drawY0 + row * scale, scale, scale);
        }
      }

      // Acessório simples: chapéu
      const hatType = String(this._sb99Cosmetics?.hat || 'none');
      if (hatType !== 'none') {
        if (hatType === 'cap') {
          ctx.fillStyle = palette.K;
          ctx.fillRect(x + 8, y + 2, 16, 4);
          ctx.fillRect(x + 12, y, 8, 4);
        } else if (hatType === 'beanie') {
          ctx.fillStyle = palette.K;
          ctx.fillRect(x + 9, y + 2, 14, 6);
          ctx.fillRect(x + 11, y, 10, 2);
        } else if (hatType === 'crown') {
          ctx.fillStyle = palette.B;
          ctx.fillRect(x + 9, y + 3, 14, 3);
          ctx.fillStyle = palette.R;
          ctx.fillRect(x + 10, y + 1, 3, 2);
          ctx.fillRect(x + 14, y + 0, 3, 3);
          ctx.fillRect(x + 18, y + 1, 3, 2);
        }
      }

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

        // rastro do golpe (aceita themeId antigo e aestheticId novo)
        const id = themeId || '';
        const isEvil = (id === 'evil');
        const isVapor = (id === 'vaporwave');
        const isTecno = (id === 'tecnozen' || id === 'tecno-zen');
        const isAurora = (id === 'aurora-aero');
        const isFruit = (id === 'fruitiger' || id === 'fruitiger-aero');
        const isMetro = (id === 'metro' || id === 'metro-aero');

        if (isVapor) ctx.strokeStyle = 'rgba(255,0,255,0.35)';
        else if (isTecno) ctx.strokeStyle = 'rgba(0,255,255,0.30)';
        else if (isAurora) ctx.strokeStyle = 'rgba(255,215,0,0.28)';
        else if (isFruit) ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        else if (isMetro) ctx.strokeStyle = 'rgba(0,191,255,0.22)';
        else if (isEvil) ctx.strokeStyle = 'rgba(255,59,47,0.35)';
        else ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(x + 16 + (this.direction === 'right' ? 18 : -18), y + 28, 18, -0.9, 0.9);
        ctx.stroke();
      }

      ctx.restore();
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
