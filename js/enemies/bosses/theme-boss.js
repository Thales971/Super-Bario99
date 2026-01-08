// Boss por tema (v2): um boss no fim de cada bloco (5,10,15,20,...)
// Mantém tudo em Canvas shapes.

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const util = SuperBario99.util;

  const SPRITE = {
    idle: [
      '........HHHHHHHH........',
      '.......HAAAAAAAAAAH......',
      '......AAEEEE..EEEEAA.....',
      '......AAEEEE..EEEEAA.....',
      '......AAAAAAAAAAAAAA.....',
      '.....AAAAAAFFFFAAAAAA....',
      '....AAABBBBBBBBBBBAAA....',
      '....AABBBBBBBBBBBBBAA....',
      '....AABBBCCCCCCCCBBAA....',
      '....AABBBCCCCCCCCBBAA....',
      '.....AABBBBBBBBBBAA......',
      '......AABBBBBBBBAA.......',
      '.......AABBBBBBAA........',
      '.......PPBBBBBBPP........',
      '......PPPBBBBBBPPP.......',
      '......PP..BBBB..PP.......',
      '......PP..BBBB..PP.......',
      '.....PPP..PPPP..PPP......',
      '.....PP...PPPP...PP......'
    ]
  };

  function _drawPixelSprite(ctx, sprite, x, y, boxW, boxH, palette, flip) {
    const h = sprite.length;
    const w = sprite[0] ? sprite[0].length : 0;
    if (!w || !h) return;

    const scale = Math.max(1, Math.min(Math.floor(boxW / w), Math.floor(boxH / h)));

    let visibleBottom = -1;
    for (let row = 0; row < h; row++) {
      const line = sprite[row];
      for (let col = 0; col < w; col++) {
        const ch = line[col];
        if (ch !== '.' && ch !== ' ') { visibleBottom = row; break; }
      }
    }
    const trimBottom = (visibleBottom >= 0) ? (h - 1 - visibleBottom) : 0;

    const drawW = w * scale;
    const drawH = h * scale;
    const x0 = x + Math.floor((boxW - drawW) / 2);
    const y0 = y + (boxH - drawH) + (trimBottom * scale);

    for (let row = 0; row < h; row++) {
      const line = sprite[row];
      for (let col = 0; col < w; col++) {
        const ch = line[col];
        const color = palette[ch];
        if (!color) continue;
        const drawCol = flip ? (w - 1 - col) : col;
        ctx.fillStyle = color;
        ctx.fillRect(x0 + drawCol * scale, y0 + row * scale, scale, scale);
      }
    }
  }

  function _roundRectPath(ctx, x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r || 0, w / 2, h / 2));
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, rr);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  class ThemeBoss {
    constructor(x, y, themeId, levelIndex, bossConfig) {
      this.x = x;
      this.y = y;
      this.width = 84;
      this.height = 72;
      this.type = 'boss';
      this.alive = true;

      this.themeId = themeId;
      this.levelIndex = levelIndex;

      // Boss nomeado (CSV)
      this.bossId = bossConfig?.id || null;
      this.bossName = bossConfig?.name || null;
      this.weakness = bossConfig?.weakness || null;
      this.phaseThresholds = Array.isArray(bossConfig?.phases) ? bossConfig.phases.slice(0, 2) : null;

      this.vx = 0;
      this.vy = 0;
      this.gravity = 0.8;
      this.onGround = false;

      this.timer = 0;
      this.hitIFrames = 0;

      const block = Math.floor(levelIndex / 5);
      const defaultHp = 22 + block * 7;
      this.maxHp = (typeof bossConfig?.maxHp === 'number' && isFinite(bossConfig.maxHp)) ? bossConfig.maxHp : defaultHp;
      this.hp = this.maxHp;

      // Ajuste global de dificuldade do boss (escala suave por bloco/nível)
      // 1.0 ~ 2.2 (nomeados levemente acima)
      this._sb99Aggro = 1 + Math.min(1.0, block * 0.06) + (this.bossId ? 0.22 : 0);

      this.projectiles = [];
      this.shootCooldown = 0;
      this.dashCooldown = 0;

      // Cooldowns/estados extras (bosses nomeados)
      this._spinUntil = 0;
      this._spinCooldown = 0;
      this._elementCooldown = 0;
      this._patternCooldown = 0;

      // Variação única por fase (poderes)
      const vSeed = (((levelIndex + 1) * 1103515245) ^ (themeId ? themeId.length * 99991 : 7)) >>> 0;
      const variants = ['brute', 'mage', 'trickster', 'summoner'];
      this.variant = (bossConfig?.variant && variants.includes(bossConfig.variant)) ? bossConfig.variant : variants[vSeed % variants.length];

      this._slamCooldown = 0;
      this._blinkCooldown = 0;
      this._summonCooldown = 0;

      // fila de spawns (lida pelo GameV2)
      this._sb99SpawnRequests = [];
    }

    _spawnProjectile(p) {
      if (!p) return;
      if (this.projectiles.length > 140) return;
      if (!isFinite(p.x) || !isFinite(p.y)) return;
      p.vx = isFinite(p.vx) ? p.vx : 0;
      p.vy = isFinite(p.vy) ? p.vy : 0;
      p.r = isFinite(p.r) ? p.r : 6;
      p.life = isFinite(p.life) ? p.life : 160;
      p.kind = String(p.kind || 'orb');
      this.projectiles.push(p);
    }

    _shootElementBurst(player, kind, count, speed, spreadY, color) {
      const dir = player.x < this.x ? -1 : 1;
      const baseVx = dir * speed;
      const start = -spreadY;
      const step = (count <= 1) ? 0 : ((spreadY * 2) / (count - 1));
      for (let i = 0; i < count; i++) {
        this._spawnProjectile({
          kind,
          x: this.x + (dir === 1 ? this.width : -6),
          y: this.y + 22 + (Math.random() * 10),
          vx: baseVx,
          vy: start + i * step,
          r: (kind === 'electric') ? 5 : 6,
          life: 210,
          color
        });
      }
    }

    _startSpin(toward, phase) {
      const ag = this._sb99Aggro || 1;
      const dur0 = (phase >= 2) ? 78 : (phase >= 1 ? 64 : 52);
      const dur = Math.floor(dur0 * (1 + Math.min(0.28, (ag - 1) * 0.22)));
      this._spinUntil = this.timer + dur;
      this._spinDir = toward;
      const cd0 = (phase >= 2) ? 170 : (phase >= 1 ? 210 : 250);
      this._spinCooldown = Math.max(95, Math.floor(cd0 / (1 + (ag - 1) * 0.55)));
    }

    _ensureOrbits(color, phase) {
      // Mantém 3..6 orbes orbitando o boss
      const desired = (phase >= 2) ? 6 : (phase >= 1 ? 5 : 4);
      const existing = this.projectiles.filter((p) => p && p.kind === 'orbit');
      if (existing.length >= desired) return;

      const add = desired - existing.length;
      for (let i = 0; i < add; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 22 + Math.random() * 18;
        this._spawnProjectile({
          kind: 'orbit',
          anchor: 'boss',
          angle: a,
          omega: (phase >= 2 ? 0.12 : 0.10) + Math.random() * 0.03,
          rad: r,
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          vx: 0,
          vy: 0,
          r: 5,
          life: 999999,
          color
        });
      }
    }

    _namedBossAttacks(level, player, diff) {
      // Se não for boss nomeado, deixa o comportamento antigo
      if (!this.bossId) return;

      const hpRatio = this.maxHp > 0 ? (this.hp / this.maxHp) : 1;
      const phase = (hpRatio <= (this.phaseThresholds ? this.phaseThresholds[1] : 0.33)) ? 2
        : (hpRatio <= (this.phaseThresholds ? this.phaseThresholds[0] : 0.66) ? 1 : 0);

      const toward = player.x < this.x ? -1 : 1;

      const ag = this._sb99Aggro || 1;
      const cdScale = 1 + (ag - 1) * 0.60 + phase * 0.22;
      const spScale = 1 + (ag - 1) * 0.14 + phase * 0.10;
      const countBonus = Math.min(5, Math.floor((ag - 1) * 2.6) + phase + 1);

      const cd = (v, min) => Math.max(min || 18, Math.floor(v / cdScale));
      const sp = (v) => v * spScale;
      const cnt = (base, max) => Math.min(max || 12, base + countBonus);

      if (this._spinCooldown > 0) this._spinCooldown--;
      if (this._elementCooldown > 0) this._elementCooldown--;
      if (this._patternCooldown > 0) this._patternCooldown--;

      // Spin ativo: avança agressivo e solta faíscas
      if (this._spinUntil && this.timer < this._spinUntil) {
        const speed = (phase >= 2 ? 10.0 : 8.8) * diff.enemySpeed * (1 + (ag - 1) * 0.18);
        this.vx = (this._spinDir || toward) * speed;
        const interval = Math.max(3, 6 - Math.floor((ag - 1) * 2));
        if ((this.timer % interval) === 0) {
          const dir = (this._spinDir || toward);
          this._spawnProjectile({
            kind: 'electric',
            x: this.x + this.width / 2,
            y: this.y + 18 + Math.random() * 30,
            vx: dir * sp(4.8 + phase * 0.9),
            vy: -1.2 + Math.random() * 2.4,
            r: 5,
            life: 80,
            color: 'rgba(255,255,255,0.85)'
          });
        }
        return;
      }

      // Kits por bossId (varia e escala por fase)
      switch (this.bossId) {
        case 'jade-dragon': {
          // gelo + investidas
          if (this._elementCooldown <= 0) {
            const spd = sp(5.6 + phase * 1.05);
            this._shootElementBurst(player, 'ice', cnt((phase >= 2 ? 9 : 7), 12), spd, (phase >= 2 ? 3.4 : 3.0), 'rgba(190,245,255,0.95)');
            this._elementCooldown = cd((phase >= 2) ? 55 : (phase >= 1 ? 72 : 86), 26);
          }
          // dash extra
          if (this.dashCooldown <= 0 && Math.abs(player.x - this.x) < 520) {
            this.vx = toward * sp(7.4 + phase * 1.0) * diff.enemySpeed;
            this.dashCooldown = cd((phase >= 2) ? 52 : (phase >= 1 ? 66 : 82), 26);
          }
          break;
        }
        case 'cosmic-mechanism': {
          // orbes orbitais + rajadas elétricas
          this._ensureOrbits('rgba(140,240,255,0.95)', phase);
          if (this._elementCooldown <= 0) {
            this._shootElementBurst(player, 'electric', cnt((phase >= 2 ? 7 : 5), 12), sp(6.4 + phase * 1.0), (phase >= 2 ? 3.2 : 2.6), 'rgba(140,240,255,0.95)');
            this._elementCooldown = cd((phase >= 2) ? 48 : (phase >= 1 ? 64 : 78), 22);
          }
          break;
        }
        case 'forest-spirit': {
          // sementes + invocação
          if (this._elementCooldown <= 0) {
            this._shootElementBurst(player, 'seed', cnt((phase >= 2 ? 6 : 5), 10), sp(4.9 + phase * 0.7), 2.3, 'rgba(120,220,140,0.95)');
            this._elementCooldown = cd((phase >= 2) ? 58 : (phase >= 1 ? 74 : 92), 26);
          }
          if (this._patternCooldown <= 0) {
            const count = Math.min(4, ((phase >= 2) ? 3 : (phase >= 1 ? 2 : 1)) + (ag >= 1.55 ? 1 : 0));
            for (let i = 0; i < count; i++) {
              this._sb99SpawnRequests.push({ kind: 'ninja', x: this.x - 220 - i * 46, y: this.y + 10 });
            }
            this._patternCooldown = cd((phase >= 2) ? 190 : (phase >= 1 ? 230 : 270), 95);
          }
          break;
        }
        case 'metro-robot': {
          // giro + disparos
          if (this._spinCooldown <= 0 && Math.abs(player.x - this.x) < 560) {
            this._startSpin(toward, phase);
            break;
          }
          if (this._elementCooldown <= 0) {
            this._shootElementBurst(player, 'electric', cnt((phase >= 2 ? 8 : 6), 12), sp(6.6 + phase * 0.9), 2.7, 'rgba(180,220,255,0.95)');
            this._elementCooldown = cd((phase >= 2) ? 52 : (phase >= 1 ? 68 : 86), 24);
          }
          break;
        }
        case 'vapor-god': {
          // teleporte + névoa (minas)
          if (this._blinkCooldown <= 0 && Math.abs(player.x - this.x) > 220) {
            const target = player.x + (toward === 1 ? -170 : 170);
            const maxX = (level.worldWidth || 800) - this.width;
            this.x = util.clamp(target, 0, maxX);
            this._blinkCooldown = cd((phase >= 2) ? 70 : (phase >= 1 ? 92 : 118), 44);
            for (let i = 0; i < Math.min(10, 5 + phase + Math.floor((ag - 1) * 2)); i++) {
              this._spawnProjectile({
                kind: 'mist',
                x: this.x + this.width / 2 + (Math.random() * 60 - 30),
                y: this.y + 40 + (Math.random() * 10),
                vx: (Math.random() * 1.2 - 0.6),
                vy: -0.2 - Math.random() * 0.6,
                r: 14,
                life: 170,
                color: 'rgba(255,255,255,0.10)'
              });
            }
          }
          if (this._elementCooldown <= 0) {
            this._shootElementBurst(player, 'orb', cnt((phase >= 2 ? 7 : 5), 12), sp(5.6 + phase * 0.8), 2.6, 'rgba(255,255,255,0.82)');
            this._elementCooldown = cd((phase >= 2) ? 54 : (phase >= 1 ? 70 : 88), 26);
          }
          break;
        }
        case 'ocean-guardian': {
          // bolhas (minas) + tiros
          if (this._patternCooldown <= 0) {
            const mines = (phase >= 2) ? 4 : 3;
            const mines2 = Math.min(7, mines + (ag >= 1.55 ? 1 : 0));
            for (let i = 0; i < mines2; i++) {
              this._spawnProjectile({
                kind: 'bubble',
                x: this.x + (Math.random() * this.width),
                y: this.y + this.height - 6,
                vx: (Math.random() * 1.4 - 0.7),
                vy: -1.4 - Math.random() * 1.2,
                r: 10,
                life: 140,
                color: 'rgba(170,240,255,0.35)'
              });
            }
            this._patternCooldown = cd((phase >= 2) ? 140 : (phase >= 1 ? 175 : 210), 78);
          }
          if (this._elementCooldown <= 0) {
            this._shootElementBurst(player, 'ice', cnt((phase >= 2 ? 7 : 6), 12), sp(5.9 + phase * 0.8), 2.7, 'rgba(170,240,255,0.90)');
            this._elementCooldown = cd((phase >= 2) ? 56 : (phase >= 1 ? 74 : 92), 26);
          }
          break;
        }
        case 'setting-sun': {
          // fogo + chuva de brasas
          if (this._elementCooldown <= 0) {
            this._shootElementBurst(player, 'fire', cnt((phase >= 2 ? 8 : 6), 12), sp(6.1 + phase * 1.0), 2.8, 'rgba(255,150,60,0.95)');
            this._elementCooldown = cd((phase >= 2) ? 50 : (phase >= 1 ? 66 : 84), 22);
          }
          if (this._patternCooldown <= 0) {
            const drops = (phase >= 2) ? 5 : 4;
            const drops2 = Math.min(8, drops + (ag >= 1.55 ? 1 : 0));
            for (let i = 0; i < drops2; i++) {
              this._spawnProjectile({
                kind: 'fireRain',
                x: player.x + (Math.random() * 420 - 210),
                y: this.y - 160 - Math.random() * 80,
                vx: (Math.random() * 1.0 - 0.5),
                vy: 2.0 + Math.random() * 1.8,
                r: 8,
                life: 170,
                color: 'rgba(255,120,45,0.92)'
              });
            }
            this._patternCooldown = cd((phase >= 2) ? 160 : (phase >= 1 ? 190 : 230), 88);
          }
          break;
        }
        case 'neon-king': {
          // atirador rápido + blink
          if (this._blinkCooldown <= 0 && (phase >= 1) && Math.abs(player.x - this.x) > 260) {
            const target = player.x + (toward === 1 ? -150 : 150);
            const maxX = (level.worldWidth || 800) - this.width;
            this.x = util.clamp(target, 0, maxX);
            this._blinkCooldown = cd((phase >= 2) ? 78 : 105, 52);
          }
          if (this._elementCooldown <= 0) {
            const shots = (phase >= 2) ? 10 : 8;
            this._shootElementBurst(player, 'neon', cnt(shots, 14), sp(7.3 + phase * 1.1), 2.9, 'rgba(255,60,220,0.92)');
            this._elementCooldown = cd((phase >= 2) ? 44 : (phase >= 1 ? 58 : 74), 18);
          }
          break;
        }
        case 'bee-king': {
          // stingers + invoca drones
          if (this._elementCooldown <= 0) {
            this._shootElementBurst(player, 'stinger', cnt((phase >= 2 ? 7 : 6), 12), sp(7.8 + phase * 1.0), 2.3, 'rgba(255,220,70,0.95)');
            this._elementCooldown = cd((phase >= 2) ? 52 : (phase >= 1 ? 68 : 86), 24);
          }
          if (this._patternCooldown <= 0) {
            const count = Math.min(4, ((phase >= 2) ? 3 : 2) + (ag >= 1.55 ? 1 : 0));
            for (let i = 0; i < count; i++) {
              this._sb99SpawnRequests.push({ kind: 'drone', x: this.x - 240 - i * 60, y: this.y - 30 + Math.random() * 70 });
            }
            this._patternCooldown = cd((phase >= 2) ? 170 : (phase >= 1 ? 210 : 260), 92);
          }
          break;
        }
        case 'planet-lord': {
          // orbes cósmicas com leve “homing” + anel
          if (this._patternCooldown <= 0) {
            const n = (phase >= 2) ? 10 : 8;
            const n2 = Math.min(14, n + (ag >= 1.55 ? 2 : 1));
            for (let i = 0; i < n2; i++) {
              const ang = (i / n2) * Math.PI * 2;
              this._spawnProjectile({
                kind: 'cosmic',
                x: this.x + this.width / 2,
                y: this.y + 26,
                vx: Math.cos(ang) * sp(3.2 + phase * 0.6),
                vy: Math.sin(ang) * sp(2.3 + phase * 0.5),
                r: 6,
                life: 170,
                color: 'rgba(170,200,255,0.92)',
                homing: (0.018 + phase * 0.008) * (1 + (ag - 1) * 0.45)
              });
            }
            this._patternCooldown = cd((phase >= 2) ? 180 : (phase >= 1 ? 220 : 270), 98);
          }
          if (this._elementCooldown <= 0) {
            this._shootElementBurst(player, 'cosmic', cnt((phase >= 2 ? 7 : 6), 12), sp(5.9 + phase * 0.8), 2.7, 'rgba(170,200,255,0.92)');
            this._elementCooldown = cd((phase >= 2) ? 56 : (phase >= 1 ? 72 : 92), 26);
          }
          break;
        }
        case 'bario-final': {
          // caos: alterna padrões
          if (this._spinCooldown <= 0 && phase >= 1 && Math.abs(player.x - this.x) < 620 && (this.timer % 160) === 0) {
            this._startSpin(toward, phase);
            break;
          }
          if (this._blinkCooldown <= 0 && (phase >= 1) && Math.abs(player.x - this.x) > 240) {
            const target = player.x + (toward === 1 ? -160 : 160);
            const maxX = (level.worldWidth || 800) - this.width;
            this.x = util.clamp(target, 0, maxX);
            this._blinkCooldown = cd((phase >= 2) ? 72 : 98, 44);
          }
          if (this._elementCooldown <= 0) {
            const pick = (this.timer / 60) | 0;
            const m = pick % 4;
            if (m === 0) this._shootElementBurst(player, 'electric', cnt((phase >= 2 ? 8 : 6), 14), sp(7.1 + phase * 1.0), 2.8, 'rgba(255,255,255,0.90)');
            else if (m === 1) this._shootElementBurst(player, 'fire', cnt((phase >= 2 ? 8 : 6), 14), sp(6.3 + phase * 1.0), 2.7, 'rgba(255,120,45,0.92)');
            else if (m === 2) this._shootElementBurst(player, 'ice', cnt((phase >= 2 ? 9 : 7), 14), sp(6.1 + phase * 0.9), 3.1, 'rgba(190,245,255,0.92)');
            else this._shootElementBurst(player, 'neon', cnt((phase >= 2 ? 10 : 8), 14), sp(7.6 + phase * 1.1), 2.9, 'rgba(255,60,220,0.90)');
            this._elementCooldown = cd((phase >= 2) ? 42 : (phase >= 1 ? 56 : 72), 16);
          }
          break;
        }
        default:
          break;
      }
    }

    update(level, player, diff) {
      if (!this.alive) return;
      this.timer++;
      if (this.hitIFrames > 0) this.hitIFrames--;
      if (this.shootCooldown > 0) this.shootCooldown--;
      if (this.dashCooldown > 0) this.dashCooldown--;
      if (this._slamCooldown > 0) this._slamCooldown--;
      if (this._blinkCooldown > 0) this._blinkCooldown--;
      if (this._summonCooldown > 0) this._summonCooldown--;
      if (this._spinCooldown > 0) this._spinCooldown--;

      const hpRatio = this.maxHp > 0 ? (this.hp / this.maxHp) : 1;
      const th1 = this.phaseThresholds ? this.phaseThresholds[0] : 0.66;
      const th2 = this.phaseThresholds ? this.phaseThresholds[1] : 0.33;
      const phase = (hpRatio <= th2) ? 2 : (hpRatio <= th1 ? 1 : 0);
      this._phase = phase;

      const enrage = phase >= 1;
      const phaseMult = 1 + phase * 0.16;
      let speedBase = (1.35 * diff.enemySpeed) * (enrage ? 1.18 : 1.0) * phaseMult;
      const toward = player.x < this.x ? -1 : 1;

      // Dificuldade global (todos os bosses): mais pressão conforme o jogo avança
      const block = Math.floor(this.levelIndex / 5);
      const globalAgg = 1 + Math.min(0.45, block * 0.02);
      speedBase *= globalAgg;

      // Nomeados: ainda mais agressivos
      if (this.bossId) {
        speedBase *= 1 + Math.min(0.28, (this._sb99Aggro - 1) * 0.18) + phase * 0.04;
        if (this.shootCooldown > 0 && (this.timer % 2) === 0) this.shootCooldown--;
        if (this.dashCooldown > 0 && (this.timer % 3) === 0) this.dashCooldown--;
        if (this._blinkCooldown > 0 && (this.timer % 3) === 0) this._blinkCooldown--;
        if (this._summonCooldown > 0 && (this.timer % 2) === 0) this._summonCooldown--;
      }

      // Padrões simples por tema
      const wantsDash = this.bossId ? true : (this.themeId === 'japan' || this.themeId === 'metro' || this.themeId === 'memefusion');
      const wantsShots = this.bossId ? true : (this.themeId === 'tecnozen' || this.themeId === 'evil' || this.themeId === 'fruitiger' || this.themeId === 'memefusion');

      // Movimento base (pressão no player)
      this.vx = toward * speedBase;

      // Ataques especiais por boss nomeado (mais variedade)
      this._namedBossAttacks(level, player, diff);

      // Dash periódico
      if (wantsDash && this.dashCooldown <= 0 && Math.abs(player.x - this.x) < 420) {
        const dashMult = (phase >= 2) ? 7.9 : (enrage ? 7.2 : 6.4);
        this.vx = toward * speedBase * (this.bossId ? dashMult * 1.08 : dashMult);
        const cd0 = (phase >= 2) ? 52 : (enrage ? 60 : 78);
        this.dashCooldown = this.bossId ? Math.max(28, Math.floor(cd0 * 0.82)) : cd0;
      }

      // Poderes únicos por variação
      if (this.variant === 'brute') {
        // Slam: cria onda de choque no chão (projétil baixo)
        if (this.onGround && this._slamCooldown <= 0 && Math.abs(player.x - this.x) < 360) {
          const cd0 = (phase >= 2) ? 76 : (enrage ? 90 : 115);
          this._slamCooldown = this.bossId ? Math.max(40, Math.floor(cd0 * 0.78)) : cd0;
          const dir = toward;
          const baseVx = dir * (5.4 + Math.min(4.0, this.levelIndex / 16)) * (this.bossId ? 1.15 : 1);
          const waves = this.bossId ? 3 : 2;
          for (let i = 0; i < waves; i++) {
            this.projectiles.push({
              kind: 'shock',
              x: this.x + this.width / 2,
              y: this.y + this.height - 8,
              vx: baseVx * (i === 0 ? 1 : -1),
              vy: 0,
              r: 10,
              life: 140,
              color: 'rgba(255,255,255,0.35)'
            });
          }
        }
      } else if (this.variant === 'mage') {
        // Rajada em leque (mais tiros)
        if (this.shootCooldown <= 0) {
          this._shootSpreadAt(player, enrage);
          const baseCd = this.themeId === 'evil' ? 34 : 46;
          const cd0 = (phase >= 2) ? Math.max(18, baseCd - 14) : (enrage ? Math.max(22, baseCd - 10) : baseCd);
          this.shootCooldown = this.bossId ? Math.max(14, Math.floor(cd0 * 0.80)) : cd0;
        }
      } else if (this.variant === 'trickster') {
        // Blink: teleporta perto do player (sem sair do mundo)
        if (this._blinkCooldown <= 0 && Math.abs(player.x - this.x) > 220) {
          const target = player.x + (toward === 1 ? -140 : 140);
          const maxX = (level.worldWidth || 800) - this.width;
          this.x = util.clamp(target, 0, maxX);
          const cd0 = (phase >= 2) ? 78 : (enrage ? 95 : 125);
          this._blinkCooldown = this.bossId ? Math.max(44, Math.floor(cd0 * 0.82)) : cd0;
          // mini explosão visual (projéteis curtos)
          const burst = this.bossId ? 7 : 5;
          for (let i = 0; i < burst; i++) {
            this.projectiles.push({
              kind: 'orb',
              x: this.x + this.width / 2,
              y: this.y + 26,
              vx: (Math.random() * 6 - 3),
              vy: (Math.random() * -3.5),
              r: 5,
              life: 42,
              color: 'rgba(255,255,255,0.40)'
            });
          }
        }
        // também atira, mas menos
        if (wantsShots && this.shootCooldown <= 0) {
          this._shootAt(player);
          const cd0 = enrage ? 34 : 48;
          this.shootCooldown = this.bossId ? Math.max(18, Math.floor(cd0 * 0.80)) : cd0;
        }
      } else if (this.variant === 'summoner') {
        // Summon: chama minions periodicamente
        if (this._summonCooldown <= 0) {
          const cd0 = (phase >= 2) ? 120 : (enrage ? 140 : 175);
          this._summonCooldown = this.bossId ? Math.max(78, Math.floor(cd0 * 0.78)) : cd0;
          const count0 = (phase >= 2) ? 3 : (enrage ? 2 : 1);
          const count = this.bossId ? Math.min(4, count0 + 1) : count0;
          for (let i = 0; i < count; i++) {
            this._sb99SpawnRequests.push({
              kind: (this.themeId === 'tecnozen' || this.themeId === 'metro') ? 'drone' : 'ninja',
              x: this.x - 220 - i * 46,
              y: this.y + 10
            });
          }
        }
        // tiros mais raros
        if (wantsShots && this.shootCooldown <= 0) {
          this._shootAt(player);
          const cd0 = enrage ? 40 : 58;
          this.shootCooldown = this.bossId ? Math.max(22, Math.floor(cd0 * 0.80)) : cd0;
        }
      }

      // Tiro (projéteis) padrão (só quando o variant não substituiu)
      if (this.variant !== 'mage' && this.variant !== 'trickster' && this.variant !== 'summoner') {
        if (wantsShots && this.shootCooldown <= 0) {
          this._shootAt(player);
          const baseCd = this.themeId === 'evil' ? 32 : 44;
          const cd0 = enrage ? Math.max(22, baseCd - 10) : baseCd;
          this.shootCooldown = this.bossId ? Math.max(16, Math.floor(cd0 * 0.82)) : cd0;
        }
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
      const baseSpd = (4.2 + Math.min(3.4, this.levelIndex / 14)) * (1 + Math.min(0.25, (this._sb99Aggro - 1) * 0.10));
      const baseVx = dir * (this.bossId ? baseSpd * 1.12 : baseSpd);

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
      const countBase = this.themeId === 'evil' ? 4 : (this.themeId === 'memefusion' ? 3 : 2);
      const count = this.bossId ? Math.min(6, countBase + 1) : countBase;
      for (let i = 0; i < count; i++) {
        const vy = (-1.8 + i * 1.2) * (this.bossId ? 1.08 : 1);
        this.projectiles.push({
          kind: 'orb',
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

    _shootSpreadAt(player, enrage) {
      const dir = player.x < this.x ? -1 : 1;
      const baseV = 4.0 + Math.min(3.6, this.levelIndex / 14);
      const count = enrage ? 8 : 6;
      const start = -2.6;
      const step = (enrage ? 0.75 : 0.85);
      for (let i = 0; i < count; i++) {
        this.projectiles.push({
          kind: 'orb',
          x: this.x + (dir === 1 ? this.width : -6),
          y: this.y + 26,
          vx: dir * baseV,
          vy: start + i * step,
          r: (enrage && (i % 2 === 0)) ? 7 : 6,
          life: 190,
          color: (this.themeId === 'evil') ? 'rgba(255,59,47,0.95)' : 'rgba(111,231,255,0.92)'
        });
      }
    }

    _updateProjectiles(player) {
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const pr = this.projectiles[i];
        const kind = String(pr.kind || 'orb');

        // movimentação por tipo
        if (kind === 'orbit') {
          pr.life = pr.life || 999999;
          pr.angle = (pr.angle || 0) + (pr.omega || 0.1);
          const cx = this.x + this.width / 2;
          const cy = this.y + this.height / 2;
          const rr = pr.rad || 30;
          pr.x = cx + Math.cos(pr.angle) * rr;
          pr.y = cy + Math.sin(pr.angle) * rr;
        } else {
          // homing cósmico leve
          if (kind === 'cosmic' && pr.homing) {
            const tx = player.x + player.width / 2;
            const ty = player.y + player.height / 2;
            const dx = tx - pr.x;
            const dy = ty - pr.y;
            pr.vx += util.clamp(dx * pr.homing, -0.22, 0.22);
            pr.vy += util.clamp(dy * pr.homing, -0.18, 0.18);
          }

          // gravidade em fogo
          if (kind === 'fire' || kind === 'fireRain') {
            pr.vy += 0.06;
            pr.vx *= 0.995;
          }

          // zigzag elétrico
          if (kind === 'electric') {
            pr._t = (pr._t || 0) + 1;
            pr.y += Math.sin(pr._t / 3) * 0.6;
          }

          // bolhas sobem/derivam
          if (kind === 'bubble') {
            pr.vy -= 0.02;
            pr.vx *= 0.995;
          }

          // névoa flutua
          if (kind === 'mist') {
            pr.vx *= 0.992;
            pr.vy *= 0.992;
          }

          pr.x += pr.vx;
          pr.y += pr.vy;
          pr.life--;
        }

        // hit player
        const rr = pr.r || 6;
        if (
          player.x < pr.x + rr &&
          player.x + player.width > pr.x - rr &&
          player.y < pr.y + rr &&
          player.y + player.height > pr.y - rr
        ) {
          // respeita invencibilidade (não aplica status se estiver piscando)
          if (!(player.invincibleTime > 0)) {
            // efeitos leves por elemento
            if (kind === 'ice' || kind === 'seed' || kind === 'bubble') {
              player._sb99SlowUntil = performance.now() + (kind === 'ice' ? 1400 : 1050);
            } else if (kind === 'electric') {
              player._sb99StunUntil = performance.now() + 650;
              // pequeno knockback
              const dir = (player.x < this.x) ? -1 : 1;
              player.vx = util.clamp(player.vx + dir * 2.6, -8, 8);
            } else if (kind === 'fire' || kind === 'fireRain') {
              const dir = (player.x < this.x) ? -1 : 1;
              player.vx = util.clamp(player.vx + dir * 3.8, -10, 10);
              player.vy = Math.min(player.vy, -6);
            }

            player.takeHit();
          }
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
        if (player.vy > 0 && player.y + player.height < this.y + this.height * 0.45) {
          this.takeDamage(2);
          player.vy = -12;
          player.score += 180;
          return false;
        }

        player.takeHit();
        return true;
      }
      return false;
    }

    // Compatível: GameV2 pode chamar takeDamage(amount, { kind: 'fire'|'ice'|'melee'|'electric'|'cosmic' })
    takeDamage(amount = 1, src) {
      if (!this.alive) return;
      if (this.hitIFrames > 0) return;

      const kind = src && typeof src.kind === 'string' ? src.kind : null;

      let dmg = Number(amount);
      if (!isFinite(dmg)) dmg = 1;

      // fraqueza simples (não cria imunidades para evitar soft-lock)
      if (this.weakness && kind) {
        if (String(kind) === String(this.weakness)) dmg = Math.max(dmg, 2);
      }

      this.hitIFrames = 14;
      this.hp -= dmg;
      if (this.hp <= 0) {
        this.hp = 0;
        this.alive = false;
      }
    }

    draw(ctx, cameraX, themeId) {
      if (!this.alive) return;
      const x = this.x - cameraX;
      const y = this.y;

      const id = (themeId || this.themeId || 'japan');
      const s0 = String(id || 'japan').toLowerCase();
      const v = (s0 === 'japan-retro') ? 'japan'
        : (s0 === 'fruitiger-aero') ? 'fruitiger'
        : (s0.startsWith('fruitiger-')) ? 'fruitiger'
        : (s0 === 'metro-aero') ? 'metro'
        : (s0 === 'tecno-zen') ? 'tecnozen'
        : (s0 === 'windows-xp') ? 'windows-xp'
        : (s0 === 'windows-vista') ? 'windows-vista'
        : (s0 === 'vaporwave') ? 'vaporwave'
        : (s0 === 'aurora-aero') ? 'aurora-aero'
        : s0;

      const flip = (this.vx < 0);

      // Visual novo para bosses nomeados (mais “com cara do nome”)
      if (this.bossId) {
        const cx = x + this.width / 2;
        const cy = y + this.height / 2;
        const phase = (this._phase | 0) || 0;

        ctx.save();
        // sombra
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.beginPath();
        ctx.ellipse(cx, y + this.height + 6, 30, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        // leve glow por fase
        ctx.globalAlpha = 0.85;
        let glow = 'rgba(255,255,255,0.10)';
        if (this.bossId === 'jade-dragon') glow = 'rgba(120,255,190,0.10)';
        else if (this.bossId === 'cosmic-mechanism') glow = 'rgba(140,240,255,0.12)';
        else if (this.bossId === 'forest-spirit') glow = 'rgba(120,220,140,0.12)';
        else if (this.bossId === 'metro-robot') glow = 'rgba(180,220,255,0.10)';
        else if (this.bossId === 'vapor-god') glow = 'rgba(255,255,255,0.08)';
        else if (this.bossId === 'ocean-guardian') glow = 'rgba(170,240,255,0.10)';
        else if (this.bossId === 'setting-sun') glow = 'rgba(255,160,60,0.12)';
        else if (this.bossId === 'neon-king') glow = 'rgba(255,60,220,0.12)';
        else if (this.bossId === 'bee-king') glow = 'rgba(255,220,70,0.12)';
        else if (this.bossId === 'planet-lord') glow = 'rgba(170,200,255,0.12)';
        else if (this.bossId === 'bario-final') glow = 'rgba(255,255,255,0.10)';

        const pad = 8 + phase * 2;
        ctx.fillStyle = glow;
        ctx.fillRect(x - pad, y - pad, this.width + pad * 2, this.height + pad * 2);
        ctx.restore();

        // corpo por boss
        ctx.save();
        if (this.bossId === 'jade-dragon') {
          // cabeça de dragão + chifres
          ctx.fillStyle = 'rgba(40,160,110,0.92)';
          _roundRectPath(ctx, x + 8, y + 14, this.width - 16, this.height - 22, 16);
          ctx.fill();
          ctx.fillStyle = 'rgba(210,255,235,0.85)';
          ctx.fillRect(x + 18, y + 28, this.width - 36, 10);
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.fillRect(x + (flip ? 20 : this.width - 30), y + 26, 6, 6);
          ctx.fillRect(x + (flip ? 28 : this.width - 22), y + 26, 3, 3);
          // chifres
          ctx.fillStyle = 'rgba(220,255,245,0.75)';
          ctx.beginPath();
          ctx.moveTo(cx - 18, y + 12);
          ctx.lineTo(cx - 32, y + 2);
          ctx.lineTo(cx - 10, y + 10);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(cx + 18, y + 12);
          ctx.lineTo(cx + 32, y + 2);
          ctx.lineTo(cx + 10, y + 10);
          ctx.closePath();
          ctx.fill();
        } else if (this.bossId === 'cosmic-mechanism') {
          // engrenagem/círculo
          ctx.strokeStyle = 'rgba(140,240,255,0.90)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(cx, cy + 2, 28, 0, Math.PI * 2);
          ctx.stroke();
          // dentes
          ctx.lineWidth = 4;
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2 + (this.timer / 30);
            const x1 = cx + Math.cos(a) * 30;
            const y1 = cy + 2 + Math.sin(a) * 30;
            const x2 = cx + Math.cos(a) * 38;
            const y2 = cy + 2 + Math.sin(a) * 38;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.beginPath();
          ctx.arc(cx, cy + 2, 10, 0, Math.PI * 2);
          ctx.fill();
        } else if (this.bossId === 'forest-spirit') {
          // máscara de madeira + folhas
          ctx.fillStyle = 'rgba(60,110,71,0.92)';
          _roundRectPath(ctx, x + 12, y + 10, this.width - 24, this.height - 16, 18);
          ctx.fill();
          ctx.fillStyle = 'rgba(20,40,25,0.35)';
          ctx.fillRect(x + 22, y + 26, this.width - 44, 6);
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.fillRect(cx - 16, y + 24, 6, 6);
          ctx.fillRect(cx + 10, y + 24, 6, 6);
          ctx.fillStyle = 'rgba(120,220,140,0.75)';
          ctx.beginPath();
          ctx.arc(cx, y + 8, 18, 0, Math.PI);
          ctx.fill();
        } else if (this.bossId === 'metro-robot') {
          // robô quadrado + visor
          ctx.fillStyle = 'rgba(40,50,65,0.92)';
          ctx.fillRect(x + 10, y + 10, this.width - 20, this.height - 12);
          ctx.fillStyle = 'rgba(180,220,255,0.85)';
          ctx.fillRect(x + 18, y + 18, this.width - 36, 12);
          ctx.fillStyle = 'rgba(255,60,60,0.75)';
          ctx.fillRect(x + 18 + ((this.timer * 2) % (this.width - 44)), y + 20, 10, 8);
        } else if (this.bossId === 'vapor-god') {
          // nuvem
          ctx.fillStyle = 'rgba(255,255,255,0.22)';
          for (let i = 0; i < 5; i++) {
            const ox = (i - 2) * 14;
            const oy = (i % 2) * 8;
            ctx.beginPath();
            ctx.arc(cx + ox, cy + oy, 18, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.fillRect(x + 10, y + 32, this.width - 20, 22);
        } else if (this.bossId === 'ocean-guardian') {
          // onda + tridente
          ctx.fillStyle = 'rgba(60,170,220,0.80)';
          ctx.beginPath();
          ctx.arc(cx - 8, cy + 10, 22, Math.PI, Math.PI * 2);
          ctx.arc(cx + 16, cy + 10, 26, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(210,250,255,0.60)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx + 22, y + 14);
          ctx.lineTo(cx + 22, y + 60);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx + 14, y + 18);
          ctx.lineTo(cx + 22, y + 10);
          ctx.lineTo(cx + 30, y + 18);
          ctx.stroke();
        } else if (this.bossId === 'setting-sun') {
          // sol com raios
          ctx.fillStyle = 'rgba(255,150,60,0.92)';
          ctx.beginPath();
          ctx.arc(cx, cy + 4, 26, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,200,120,0.70)';
          ctx.lineWidth = 3;
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * 30, cy + 4 + Math.sin(a) * 30);
            ctx.lineTo(cx + Math.cos(a) * 40, cy + 4 + Math.sin(a) * 40);
            ctx.stroke();
          }
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.fillRect(cx - 10, cy - 4, 6, 6);
          ctx.fillRect(cx + 4, cy - 4, 6, 6);
        } else if (this.bossId === 'neon-king') {
          // rei neon: coroa + outline
          ctx.strokeStyle = 'rgba(255,60,220,0.90)';
          ctx.lineWidth = 4;
          ctx.strokeRect(x + 12, y + 14, this.width - 24, this.height - 18);
          ctx.fillStyle = 'rgba(255,60,220,0.55)';
          ctx.beginPath();
          ctx.moveTo(cx - 18, y + 14);
          ctx.lineTo(cx - 10, y + 4);
          ctx.lineTo(cx, y + 14);
          ctx.lineTo(cx + 10, y + 4);
          ctx.lineTo(cx + 18, y + 14);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.70)';
          ctx.fillRect(cx - 12, y + 28, 6, 6);
          ctx.fillRect(cx + 6, y + 28, 6, 6);
        } else if (this.bossId === 'bee-king') {
          // abelha: listras + asas
          ctx.fillStyle = 'rgba(255,220,70,0.92)';
          ctx.beginPath();
          ctx.ellipse(cx, cy + 6, 28, 20, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          for (let i = 0; i < 4; i++) {
            ctx.fillRect(cx - 22 + i * 12, cy - 6, 6, 26);
          }
          ctx.fillStyle = 'rgba(200,245,255,0.25)';
          ctx.beginPath();
          ctx.ellipse(cx - 18, cy - 8, 18, 10, -0.25, 0, Math.PI * 2);
          ctx.ellipse(cx + 18, cy - 8, 18, 10, 0.25, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.70)';
          ctx.fillRect(cx - 10, cy, 6, 6);
          ctx.fillRect(cx + 4, cy, 6, 6);
        } else if (this.bossId === 'planet-lord') {
          // planeta com anel
          ctx.fillStyle = 'rgba(170,200,255,0.85)';
          ctx.beginPath();
          ctx.arc(cx, cy + 4, 24, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.ellipse(cx, cy + 8, 36, 14, 0.25, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.70)';
          ctx.fillRect(cx - 12, cy - 4, 6, 6);
          ctx.fillRect(cx + 6, cy - 4, 6, 6);
        } else if (this.bossId === 'bario-final') {
          // glitch/máscara
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.fillRect(x + 10, y + 10, this.width - 20, this.height - 12);
          for (let i = 0; i < 10; i++) {
            const gx = x + 10 + Math.floor(Math.random() * (this.width - 20));
            const gy = y + 10 + Math.floor(Math.random() * (this.height - 20));
            ctx.fillStyle = (i % 2 === 0) ? 'rgba(255,60,220,0.35)' : 'rgba(140,240,255,0.28)';
            ctx.fillRect(gx, gy, 10 + Math.random() * 14, 3 + Math.random() * 4);
          }
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.fillRect(cx - 12, y + 28, 6, 6);
          ctx.fillRect(cx + 6, y + 28, 6, 6);
          ctx.fillStyle = 'rgba(255,120,45,0.65)';
          ctx.fillRect(cx - 6, y + 42, 12, 4);
        }
        ctx.restore();
      } else {
        // Boss antigo (pixel art) + máscara por tema
        let body = '#2c2c2c';
        let accent = '#f5f6fa';
        if (v === 'japan') { body = '#c0392b'; accent = '#f5f6fa'; }
        if (v === 'fruitiger') { body = '#4b6cb7'; accent = '#dbe6ff'; }
        if (v === 'tecnozen') { body = '#1a1f2b'; accent = '#00FFFF'; }
        if (v === 'dorfic') { body = '#2f2a24'; accent = '#3c6e47'; }
        if (v === 'metro') { body = '#2b2f36'; accent = '#4aa3ff'; }
        if (v === 'evil') { body = '#1b0d12'; accent = '#ff3b2f'; }
        if (v === 'memefusion') { body = '#3a2f5b'; accent = '#ffd27d'; }
        if (v === 'windows-xp') { body = '#0055E5'; accent = '#ECE9D8'; }
        if (v === 'windows-vista') { body = 'rgba(0,120,215,0.78)'; accent = 'rgba(255,255,255,0.65)'; }
        if (v === 'vaporwave') { body = '#141018'; accent = '#FF00FF'; }
        if (v === 'aurora-aero') { body = '#0d1020'; accent = '#FFD700'; }

        const cloak = 'rgba(0,0,0,0.22)';
        const boots = 'rgba(0,0,0,0.35)';
        const eye = (v === 'evil') ? '#ff3b2f' : (v === 'aurora-aero' ? '#FFD700' : (v === 'vaporwave' ? '#00FFFF' : '#2e86de'));

        const palette = {
          H: cloak,
          A: accent,
          B: body,
          C: 'rgba(255,255,255,0.08)',
          E: eye,
          F: 'rgba(0,0,0,0.18)',
          P: boots
        };

        _drawPixelSprite(ctx, SPRITE.idle, x, y, this.width, this.height, palette, flip);
      }

      // detalhe único por variação
      const cx = x + this.width / 2;
      const cy = y + 10;
      if (this.variant === 'brute') {
        // ombreiras + punhos grandes
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(cx - 30, y + 2, 60, 12);
        ctx.fillStyle = (v === 'evil') ? 'rgba(255,59,47,0.22)' : 'rgba(0,0,0,0.18)';
        const fx = x + (flip ? 8 : this.width - 26);
        ctx.fillRect(fx, y + 40, 18, 12);
        ctx.fillRect(fx + (flip ? 22 : -22), y + 40, 18, 12);
        ctx.restore();
      } else if (this.variant === 'mage') {
        // halo + cajado
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy + 6, 20, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = (v === 'tecnozen') ? 'rgba(35,213,255,0.55)'
          : (v === 'vaporwave') ? 'rgba(255,0,255,0.45)'
            : (v === 'aurora-aero') ? 'rgba(127,255,0,0.40)'
              : 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 3;
        const sx = x + (flip ? 10 : this.width - 10);
        ctx.beginPath();
        ctx.moveTo(sx, y + 14);
        ctx.lineTo(sx, y + 62);
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(sx, y + 14, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (this.variant === 'trickster') {
        // "máscara" + afterimage curto
        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(cx - 18, y + 16, 36, 14);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.arc(cx - 22, cy + 10, 6, 0, Math.PI * 2);
        ctx.arc(cx + 22, cy + 10, 6, 0, Math.PI * 2);
        ctx.fill();

        // afterimage (direção do movimento)
        ctx.globalAlpha = 0.10;
        const ax = x + (flip ? 10 : -10);
        ctx.fillStyle = accent;
        ctx.fillRect(ax, y + 10, this.width, this.height);
        ctx.restore();
      } else if (this.variant === 'summoner') {
        // coroa + runas (chamador)
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        ctx.fillRect(cx - 12, y - 6, 24, 10);
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.45;
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(cx - 16 + i * 10, y + 8, 3, 3);
        }

        // círculo rúnico leve
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, y + 38, 34, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // aura (pulso)
      ctx.strokeStyle = (v === 'tecnozen')
        ? 'rgba(0,255,255,0.35)'
        : (v === 'vaporwave')
          ? 'rgba(255,0,255,0.28)'
          : (v === 'aurora-aero')
            ? 'rgba(127,255,0,0.20)'
            : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + this.width / 2, y + this.height / 2, 40 + (this.timer % 14), 0, Math.PI * 2);
      ctx.stroke();

      // reforço visual por variante (cor secundária)
      try {
        let vGlow = null;
        if (this.variant === 'brute') vGlow = (v === 'evil') ? 'rgba(255,59,47,0.10)' : 'rgba(255,255,255,0.08)';
        else if (this.variant === 'mage') vGlow = 'rgba(111,231,255,0.08)';
        else if (this.variant === 'trickster') vGlow = 'rgba(255,255,255,0.07)';
        else if (this.variant === 'summoner') vGlow = 'rgba(255,210,125,0.07)';
        if (vGlow) {
          ctx.save();
          ctx.fillStyle = vGlow;
          ctx.fillRect(x - 6, y - 6, this.width + 12, this.height + 12);
          ctx.restore();
        }
      } catch (_) {}

      // projéteis (visuais por tipo)
      for (const pr of this.projectiles) {
        const kind = String(pr.kind || 'orb');
        const px = (pr.x - cameraX);
        const py = pr.y;
        const rr = pr.r || 6;
        if (kind === 'electric' || kind === 'neon') {
          ctx.save();
          ctx.globalAlpha = 0.9;
          ctx.strokeStyle = pr.color || (kind === 'neon' ? 'rgba(255,60,220,0.9)' : 'rgba(200,240,255,0.9)');
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px - rr, py);
          ctx.lineTo(px - rr / 2, py - rr);
          ctx.lineTo(px, py);
          ctx.lineTo(px + rr / 2, py + rr);
          ctx.lineTo(px + rr, py);
          ctx.stroke();
          ctx.restore();
        } else if (kind === 'ice') {
          ctx.save();
          ctx.globalAlpha = 0.95;
          ctx.fillStyle = pr.color || 'rgba(190,245,255,0.95)';
          ctx.beginPath();
          ctx.moveTo(px, py - rr);
          ctx.lineTo(px + rr, py);
          ctx.lineTo(px, py + rr);
          ctx.lineTo(px - rr, py);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else if (kind === 'fire' || kind === 'fireRain') {
          ctx.save();
          ctx.globalAlpha = 0.92;
          ctx.fillStyle = pr.color || 'rgba(255,120,45,0.92)';
          ctx.beginPath();
          ctx.arc(px, py, rr, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 0.55;
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          ctx.beginPath();
          ctx.arc(px - 2, py - 2, Math.max(2, rr * 0.45), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (kind === 'mist') {
          ctx.save();
          ctx.globalAlpha = 1;
          ctx.fillStyle = pr.color || 'rgba(255,255,255,0.10)';
          ctx.beginPath();
          ctx.arc(px, py, rr, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.fillStyle = pr.color || 'rgba(255,255,255,0.9)';
          ctx.beginPath();
          ctx.arc(px, py, rr, 0, Math.PI * 2);
          ctx.fill();
        }
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

  SuperBario99.ThemeBoss = ThemeBoss;
})();
