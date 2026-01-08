// Game v2: estéticas por fase + fases procedurais + inimigos com IA
// Sem bibliotecas externas.

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const util = SuperBario99.util;

  class GameV2 {
    constructor() {
      // DOM
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d');

      this.menu = document.getElementById('menu');
      this.instructions = document.getElementById('instructions');
      this.endScreen = document.getElementById('end-screen');

      this.continueBtn = document.getElementById('continue-btn');
      this.startBtn = document.getElementById('start-btn');
      this.freeModeBtn = document.getElementById('free-mode-btn');
      this.instructionsBtn = document.getElementById('instructions-btn');
      this.backBtn = document.getElementById('back-btn');
      this.restartBtn = document.getElementById('restart-btn');
      this.menuBtn = document.getElementById('menu-btn');

      this.muteBtn = document.getElementById('mute-btn');
      this.scoreDisplay = document.getElementById('score-display');
      this.levelDisplay = document.getElementById('level-display');
      this.bestDisplay = document.getElementById('best-display');
      this.powerupDisplay = document.getElementById('powerup-display');

      this.endTitle = document.getElementById('end-title');
      this.endScore = document.getElementById('end-score');
      this.endBest = document.getElementById('end-best');

      // Estado
      this.keys = Object.create(null);
      this.gravity = 0.8;
      this.running = false;

      // Modo Livre (não afeta recorde principal)
      this._isFreeMode = false;
      this._freeConfig = null;

      this.levels = [];
      this.levelIndex = 0;
      this.player = null;
      this.cameraX = 0;

      this.enemies = null;

      // NPCs / Lore
      this.npcs = [];
      this._nearNpc = null;
      this._dialogue = null;
      this._dialogueNextAt = 0;
      this._prevInput = { ArrowUp: false, space: false, x: false };

      this.particles = [];
      this.sakura = [];

      // Seed dinâmico por fase (para layout variar a cada tentativa)
      this.levelSeed = 0;
      this._nextAutosaveAt = 0;
      this._lastLives = null;

      // Touch / swipe
      this.touchControls = document.getElementById('touch-controls');
      this.touchLeftBtn = document.getElementById('touch-left');
      this.touchRightBtn = document.getElementById('touch-right');
      this.touchJumpBtn = document.getElementById('touch-jump');
      this.touchAttackBtn = document.getElementById('touch-attack');
      this._touch = {
        active: false,
        id: null,
        startX: 0,
        startY: 0,
        moved: false,
        jumpTriggered: false
      };

      // Gamepad
      this._gamepadEnabled = true;
      this._gamepadState = { left: false, right: false, jump: false, attack: false };

      this.highKey = 'superbario99_highscore_v2';
      this.saveKey = 'superbario99_save_v2';
      this.bestScore = Number(localStorage.getItem(this.highKey) || 0);

      // Menu preview
      this.previewTimer = 0;
      this.previewThemeIndex = 0;

      // Áudio
      this.audio = new SuperBario99.AudioManagerV2();
      this.audio.attachUI({ muteButton: this.muteBtn });

      // Power-ups / itens
      this.powerups = new SuperBario99.PowerupSystem();
      this.projectiles = [];
      this._lastTapAt = 0;

      // Feedback visual leve
      this._floatTexts = [];
      this._footprints = [];

      // Popup de comandos no início de cada fase
      this._phaseIntroUntil = 0;
      this._phaseIntroLevelIndex = -1;

      // Spawn do player via portal (corrige “aparecer debaixo da terra”)
      this._spawnPortal = null;

      // Ambiente (clima/cenário)
      this.weatherSystem = SuperBario99.WeatherSystem ? new SuperBario99.WeatherSystem() : null;
      this.sceneryBuilder = SuperBario99.SceneryBuilder ? new SuperBario99.SceneryBuilder() : null;
      this._weather = { type: 'none', intensity: 0 };
      this._scenery = [];

      // Cache pathfinding
      this._gridCacheLevelIndex = -1;
      this._grid = null;

      this._bindEvents();
      this._checkSave();
    }

    _queuePhaseIntro() {
      const now = performance.now();
      this._phaseIntroUntil = now + 2600;
      this._phaseIntroLevelIndex = this.levelIndex;
    }

    _getPlayerSpawnPoint(level, spawnX = 60, playerW = 32, playerH = 52) {
      const ww = Number(level?.worldWidth || this.canvas?.width || 800);
      const floorMargin = 20;
      const floorY = (this.canvas ? this.canvas.height : 450) - playerH - floorMargin;

      const x = util.clamp(Number(spawnX) || 60, 0, Math.max(0, ww - playerW));

      // Escolhe o “chão” (plataforma mais baixa / maior y) que cobre o spawnX.
      let best = null;
      if (level && Array.isArray(level.platforms)) {
        const cx = x + playerW / 2;
        for (const p of level.platforms) {
          if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.width)) continue;
          if (cx < p.x - 2 || cx > (p.x + p.width) + 2) continue;
          if (!best || p.y > best.y) best = p;
        }
      }

      const y = util.clamp(best ? (best.y - playerH) : floorY, 0, floorY);
      return { x, y };
    }

    _beginSpawnPortal(level, now, aestheticId) {
      if (!this.player || !level) return;

      const t0 = (typeof now === 'number') ? now : performance.now();
      const a = aestheticId || (this._getEffectiveAestheticId ? this._getEffectiveAestheticId(level, t0) : (level.aestheticId || level.themeId));

      const baseX = Number.isFinite(this.player.x) ? this.player.x : 60;
      const baseY = Number.isFinite(this.player.y) ? this.player.y : 320;
      const groundY = baseY + this.player.height;

      this._spawnPortal = {
        active: true,
        startedAt: t0,
        duration: 900,
        aestheticId: a,
        x: baseX,
        baseY,
        groundY
      };

      // trava estado do player durante o portal
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.onGround = true;
    }

    _isSpawnPortalActive(now) {
      const sp = this._spawnPortal;
      if (!sp || !sp.active) return false;
      const tNow = (typeof now === 'number') ? now : performance.now();
      return tNow < (sp.startedAt + sp.duration);
    }

    _drawSpawnPortal(aestheticId, now) {
      const sp = this._spawnPortal;
      if (!sp || !sp.active) return;
      const tNow = (typeof now === 'number') ? now : performance.now();
      const t = Math.max(0, Math.min(1, (tNow - sp.startedAt) / Math.max(1, sp.duration)));
      if (t >= 1) return;

      const easeOut = (u) => 1 - Math.pow(1 - u, 3);
      const p = easeOut(t);

      const a = aestheticId || sp.aestheticId || 'windows-xp';
      const aLower = String(a || '').toLowerCase();
      const aKey = (aLower.includes('japan')) ? 'japan'
        : (aLower.includes('tecno') || aLower.includes('zen')) ? 'tecno'
          : (aLower.includes('metro')) ? 'metro'
            : (aLower.includes('vapor')) ? 'vapor'
              : (aLower.includes('fruitiger')) ? 'fruitiger'
                : (aLower.includes('vista')) ? 'vista'
                  : (aLower.includes('xp') || aLower.includes('windows')) ? 'xp'
                    : (aLower.includes('evil')) ? 'evil'
                      : (aLower.includes('aurora')) ? 'aurora'
                        : (aLower.includes('dorfic')) ? 'dorfic'
                          : (aLower.includes('caos')) ? 'caos'
                            : (aLower.includes('meme')) ? 'meme'
                              : 'generic';
      let core = 'rgba(255,255,255,0.40)';
      let rim = 'rgba(255,255,255,0.72)';
      let glow = 'rgba(255,255,255,0.14)';
      if (a === 'evil') { core = 'rgba(255,59,47,0.36)'; rim = 'rgba(255,59,47,0.78)'; glow = 'rgba(255,59,47,0.14)'; }
      else if (a === 'tecno-zen' || a === 'tecnozen') { core = 'rgba(35,213,255,0.34)'; rim = 'rgba(35,213,255,0.76)'; glow = 'rgba(35,213,255,0.14)'; }
      else if (a === 'metro-aero' || a === 'metro') { core = 'rgba(74,163,255,0.34)'; rim = 'rgba(74,163,255,0.76)'; glow = 'rgba(74,163,255,0.13)'; }
      else if (a === 'vaporwave') { core = 'rgba(255,0,255,0.28)'; rim = 'rgba(255,182,213,0.78)'; glow = 'rgba(255,0,255,0.12)'; }
      else if (a === 'aurora-aero') { core = 'rgba(127,255,0,0.26)'; rim = 'rgba(127,255,0,0.70)'; glow = 'rgba(127,255,0,0.12)'; }
      else if (a === 'fruitiger-aero' || a === 'fruitiger') { core = 'rgba(111,231,255,0.30)'; rim = 'rgba(111,231,255,0.74)'; glow = 'rgba(111,231,255,0.12)'; }
      else if (a === 'windows-xp') { core = 'rgba(0,85,229,0.22)'; rim = 'rgba(255,255,255,0.72)'; glow = 'rgba(0,85,229,0.11)'; }
      else if (a === 'windows-vista') { core = 'rgba(0,120,215,0.22)'; rim = 'rgba(255,255,255,0.70)'; glow = 'rgba(0,120,215,0.11)'; }

      const ctx = this.ctx;
      const cx = (sp.x - this.cameraX) + (this.player ? this.player.width / 2 : 16);
      const gy = sp.groundY - 6;

      const wob = Math.sin(tNow / 55) * 0.8;
      const open = Math.max(0, Math.min(1, (p - 0.08) / 0.92));
      const rx = (18 + open * 18) + wob;
      const ry = (4 + open * 6);

      ctx.save();
      ctx.globalAlpha = 0.95;

      // glow no chão
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(cx, gy + 2, rx * 1.35, ry * 1.65, 0, 0, Math.PI * 2);
      ctx.fill();

      // “boca” do portal
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.ellipse(cx, gy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = rim;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, gy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      // coluna vertical (sugere profundidade)
      const colH = 72 * open;
      if (colH > 2) {
        const grad = ctx.createLinearGradient(0, gy - colH, 0, gy);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.4, core);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = grad;
        ctx.fillRect(cx - rx, gy - colH, rx * 2, colH);
      }

      // detalhes por estética (mantém leve e “lê” rápido)
      try {
        ctx.save();
        ctx.globalAlpha = 0.65 * open;

        if (aKey === 'japan') {
          // sakura: pétalas orbitando
          ctx.fillStyle = 'rgba(255,182,213,0.65)';
          const petN = 7;
          for (let i = 0; i < petN; i++) {
            const ang = (i / petN) * Math.PI * 2 + (tNow / 260);
            const rr = rx * (0.75 + 0.08 * Math.sin(tNow / 160 + i));
            const px = cx + Math.cos(ang) * rr;
            const py = gy - 18 - open * 30 + Math.sin(ang * 1.3) * 4;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(ang + Math.sin(tNow / 180 + i) * 0.35);
            ctx.beginPath();
            ctx.ellipse(0, 0, 3.6, 2.0, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          // brilho branco leve
          ctx.strokeStyle = 'rgba(255,255,255,0.20)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(cx, gy, rx * 0.84, ry * 0.70, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (aKey === 'tecno' || aKey === 'metro' || aKey === 'xp') {
          // scanlines + "brackets" (HUD)
          ctx.strokeStyle = rim;
          ctx.lineWidth = 2;
          const bw = rx * 2.2;
          const bh = Math.max(18, colH * 0.45);
          const bx = cx - bw / 2;
          const by = gy - bh - 10;

          // brackets nos cantos
          ctx.globalAlpha = 0.55 * open;
          ctx.beginPath();
          ctx.moveTo(bx, by + 8); ctx.lineTo(bx, by); ctx.lineTo(bx + 10, by);
          ctx.moveTo(bx + bw - 10, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + 8);
          ctx.moveTo(bx, by + bh - 8); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + 10, by + bh);
          ctx.moveTo(bx + bw - 10, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - 8);
          ctx.stroke();

          // scanlines dentro da coluna do portal
          ctx.globalAlpha = 0.28 * open;
          ctx.fillStyle = rim;
          const lineCount = 10;
          for (let i = 0; i < lineCount; i++) {
            const yy = gy - colH + (i / lineCount) * colH;
            const w2 = rx * (0.6 + 0.25 * Math.sin((tNow / 140) + i));
            ctx.fillRect(cx - w2, yy, w2 * 2, 1);
          }

          // Windows: mini “janela” translúcida (OS vibe)
          if (aKey === 'xp' || aKey === 'vista') {
            const winW = Math.max(150, rx * 3.2);
            const winH = 58;
            const wx = Math.floor(cx - winW / 2);
            const wy = Math.floor(by - winH - 8);

            // corpo da janela (glass)
            ctx.globalAlpha = 0.52 * open;
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.fillRect(wx, wy, winW, winH);
            ctx.strokeStyle = 'rgba(255,255,255,0.20)';
            ctx.lineWidth = 2;
            ctx.strokeRect(wx, wy, winW, winH);

            // titlebar
            ctx.globalAlpha = 0.62 * open;
            ctx.fillStyle = 'rgba(0,0,0,0.18)';
            ctx.fillRect(wx, wy, winW, 16);
            // botões (min/max/close)
            ctx.globalAlpha = 0.55 * open;
            ctx.fillStyle = rim;
            ctx.fillRect(wx + winW - 34, wy + 5, 4, 4);
            ctx.fillRect(wx + winW - 24, wy + 5, 4, 4);
            ctx.fillRect(wx + winW - 14, wy + 5, 4, 4);

            // barra de carregamento (sutil)
            const barX = wx + 10;
            const barY = wy + 30;
            const barW = winW - 20;
            const barH = 8;
            ctx.globalAlpha = 0.38 * open;
            ctx.fillStyle = 'rgba(0,0,0,0.20)';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.strokeStyle = 'rgba(255,255,255,0.18)';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, barH);
            ctx.globalAlpha = 0.55 * open;
            ctx.fillStyle = core;
            const prog = (0.25 + 0.75 * Math.sin((tNow - sp.startedAt) / 160)) * 0.5 + 0.25;
            ctx.fillRect(barX + 1, barY + 1, Math.max(6, (barW - 2) * prog), barH - 2);
          }
        } else if (aKey === 'vapor') {
          // vaporwave: gradiente + mini grid
          const gw = rx * 2.2;
          const gh = Math.max(26, colH * 0.55);
          const gx = cx - gw / 2;
          const gy0 = gy - gh - 12;
          const g = ctx.createLinearGradient(gx, gy0, gx + gw, gy0 + gh);
          g.addColorStop(0, 'rgba(255,182,213,0.22)');
          g.addColorStop(0.5, 'rgba(35,213,255,0.18)');
          g.addColorStop(1, 'rgba(255,0,255,0.18)');
          ctx.fillStyle = g;
          ctx.globalAlpha = 0.55 * open;
          ctx.fillRect(gx, gy0, gw, gh);

          ctx.globalAlpha = 0.30 * open;
          ctx.strokeStyle = 'rgba(255,255,255,0.22)';
          ctx.lineWidth = 1;
          const step = 10;
          for (let x = 0; x <= gw; x += step) {
            ctx.beginPath();
            ctx.moveTo(gx + x, gy0);
            ctx.lineTo(gx + x, gy0 + gh);
            ctx.stroke();
          }
          for (let y = 0; y <= gh; y += step) {
            ctx.beginPath();
            ctx.moveTo(gx, gy0 + y);
            ctx.lineTo(gx + gw, gy0 + y);
            ctx.stroke();
          }
        } else if (aKey === 'fruitiger' || aKey === 'vista') {
          // glass/bubbles: círculos translúcidos e highlight
          ctx.globalAlpha = 0.55 * open;
          ctx.fillStyle = 'rgba(255,255,255,0.16)';
          const bubN = 6;
          for (let i = 0; i < bubN; i++) {
            const ang = (i / bubN) * Math.PI * 2 + (tNow / 320);
            const rr = rx * (0.55 + 0.18 * Math.sin(tNow / 210 + i));
            const bx = cx + Math.cos(ang) * rr;
            const by = gy - 22 - open * 24 + Math.sin(ang * 1.5) * 4;
            const br = 4 + (i % 3);
            ctx.beginPath();
            ctx.arc(bx, by, br, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.22)';
            ctx.stroke();
          }

          // highlight no anel do portal
          ctx.globalAlpha = 0.45 * open;
          ctx.strokeStyle = 'rgba(255,255,255,0.30)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cx - rx * 0.12, gy - 1, rx * 0.82, ry * 0.78, 0, Math.PI * 1.05, Math.PI * 1.85);
          ctx.stroke();
        } else if (aKey === 'evil') {
          // fenda: triângulos “rasgando” pra cima
          ctx.globalAlpha = 0.60 * open;
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          const spikeN = 7;
          for (let i = 0; i < spikeN; i++) {
            const u = (i / (spikeN - 1)) * 2 - 1; // -1..1
            const sx = cx + u * rx * 0.95;
            const sh = (10 + (i % 3) * 6) * open;
            ctx.beginPath();
            ctx.moveTo(sx, gy + 1);
            ctx.lineTo(sx + 5, gy - sh);
            ctx.lineTo(sx + 10, gy + 1);
            ctx.closePath();
            ctx.fill();
          }
          ctx.strokeStyle = 'rgba(255,59,47,0.25)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(cx, gy, rx * 0.92, ry * 0.78, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (aKey === 'aurora') {
          // aurora: arco suave acima
          ctx.globalAlpha = 0.45 * open;
          const aw = rx * 2.2;
          const ah = 46 * open;
          const ax = cx - aw / 2;
          const ay = gy - ah - 16;
          const ag = ctx.createLinearGradient(ax, ay, ax + aw, ay);
          ag.addColorStop(0, 'rgba(127,255,0,0.10)');
          ag.addColorStop(0.5, 'rgba(35,213,255,0.08)');
          ag.addColorStop(1, 'rgba(255,255,255,0.10)');
          ctx.fillStyle = ag;
          ctx.beginPath();
          ctx.moveTo(ax, ay + ah);
          ctx.quadraticCurveTo(cx, ay, ax + aw, ay + ah);
          ctx.lineTo(ax + aw, ay + ah + 6);
          ctx.quadraticCurveTo(cx, ay + 8, ax, ay + ah + 6);
          ctx.closePath();
          ctx.fill();
        } else if (aKey === 'caos' || aKey === 'meme') {
          // caos/meme: blocos glitch rápidos
          ctx.globalAlpha = 0.42 * open;
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          const n = 7;
          for (let i = 0; i < n; i++) {
            const gx = cx - rx + ((i * 17 + Math.floor(tNow / 30)) % 60);
            const gy1 = gy - colH + ((i * 13 + Math.floor(tNow / 22)) % Math.max(12, colH));
            ctx.fillRect(gx, gy1, 22, 6);
          }
        } else if (aKey === 'dorfic') {
          // pedra/eco: anel duplo com “trincas”
          ctx.globalAlpha = 0.40 * open;
          ctx.strokeStyle = 'rgba(255,255,255,0.16)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cx, gy, rx * 0.88, ry * 0.70, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 0.26 * open;
          ctx.beginPath();
          ctx.moveTo(cx - rx * 0.6, gy - 10);
          ctx.lineTo(cx - rx * 0.25, gy - 2);
          ctx.lineTo(cx - rx * 0.15, gy - 14);
          ctx.stroke();
        }

        ctx.restore();
      } catch (_) {}

      // faíscas
      ctx.globalAlpha = 0.65 * open;
      ctx.fillStyle = rim;
      const sparkN = 6;
      for (let i = 0; i < sparkN; i++) {
        const ang = (i / sparkN) * Math.PI * 2 + (tNow / 240);
        const sr = rx * (0.55 + 0.35 * Math.sin(tNow / 180 + i));
        const sx = cx + Math.cos(ang) * sr;
        const sy = gy - (8 + 24 * open) + Math.sin(ang * 1.7) * 3;
        ctx.fillRect(sx, sy, 2, 2);
      }

      ctx.restore();
    }

    _drawPhaseIntro() {
      const now = performance.now();
      if (!this._phaseIntroUntil || now >= this._phaseIntroUntil) return;
      if (this._phaseIntroLevelIndex !== this.levelIndex) return;

      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // Em telas muito baixas, não cobre o HUD todo
      const boxW = Math.min(460, w - 36);
      const boxH = (h < 420) ? 102 : 118;
      const x = Math.floor((w - boxW) / 2);
      const y = 18;
      const pad = 14;

      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x, y, boxW, boxH);
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, boxW, boxH);

      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = '18px Arial';
      ctx.fillText(`FASE ${this.levelIndex + 1}`, x + pad, y + 26);

      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.fillText('Mover: ←/→  |  Pular: Espaço/↑  |  Ataque: X', x + pad, y + 52);
      ctx.fillText('Mobile: botões na tela (duplo toque = usar power-up)', x + pad, y + 72);
      ctx.fillStyle = 'rgba(255,255,255,0.70)';
      ctx.fillText('Dica: pouse em cima do bloco ? para liberar power-up', x + pad, y + (h < 420 ? 92 : 96));

      ctx.restore();
    }

    _releaseTouchKeys() {
      // Chaves usadas por controles touch/swipe
      this.keys['ArrowLeft'] = false;
      this.keys['ArrowRight'] = false;
      this.keys[' '] = false;
      this.keys['x'] = false;
      this.keys['X'] = false;
    }

    _isTouchDevice() {
      return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
    }

    _makeSeed() {
      // seed 32-bit
      const t = (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0;
      return t;
    }

    _applyTouchVisibility() {
      if (!this.touchControls) return;
      const show = this._isTouchDevice();
      this.touchControls.style.display = show ? 'block' : 'none';
      this.touchControls.setAttribute('aria-hidden', show ? 'false' : 'true');
    }

    _regenLevelForCurrentSeed() {
      if (!this.levels || !this.levels.length) return;
      this.levels[this.levelIndex] = SuperBario99.levelsV2.createLevel(this.levelIndex, this.levelSeed);
      try { this._sanitizeLevelGeometry(this.levels[this.levelIndex]); } catch (_) {}
      this._gridCacheLevelIndex = -1;
      this._rebuildEnvironmentForLevel();
    }

    _sanitizeLevelGeometry(level) {
      if (!level) return;

      const h = this.canvas ? this.canvas.height : 450;
      const margin = 20;
      const maxY = Math.max(0, h - margin);

      // worldWidth mínimo
      try {
        if (!Number.isFinite(level.worldWidth) || level.worldWidth < (this.canvas ? this.canvas.width : 800)) {
          level.worldWidth = Math.max((this.canvas ? this.canvas.width : 800), Number(level.worldWidth) || 800);
        }
      } catch (_) {}

      const clampRectY = (o) => {
        if (!o || !Number.isFinite(o.y)) return;
        const hh = Number.isFinite(o.height) ? o.height : 0;
        if (o.y < 0) o.y = 0;
        if (o.y + hh > maxY) o.y = Math.max(0, maxY - hh);
      };

      const clampRectX = (o) => {
        if (!o || !Number.isFinite(o.x)) return;
        const ww = Number.isFinite(o.width) ? o.width : 0;
        const maxX = Math.max(0, (level.worldWidth || 800) - ww);
        if (o.x < 0) o.x = 0;
        if (o.x > maxX) o.x = maxX;
      };

      // Plataformas
      if (Array.isArray(level.platforms)) {
        for (const p of level.platforms) {
          clampRectX(p);
          clampRectY(p);
        }
      }

      // Blocos / hazards / itens / goals / coins (best-effort)
      const arrays = ['blocks', 'hazards', 'items', 'goals', 'coins'];
      for (const key of arrays) {
        const arr = level[key];
        if (!Array.isArray(arr)) continue;
        for (const o of arr) {
          clampRectX(o);
          clampRectY(o);
        }
      }
    }

    _clearInput() {
      this.keys = Object.create(null);
      this._gamepadState = { left: false, right: false, jump: false, attack: false };
    }

    _checkSave() {
      const saveRaw = localStorage.getItem(this.saveKey);
      if (saveRaw) {
        this.continueBtn.style.display = 'inline-block';
        this.startBtn.textContent = 'NOVO JOGO';
      } else {
        this.continueBtn.style.display = 'none';
        this.startBtn.textContent = 'INICIAR JOGO';
      }
      this.powerupDisplay = document.getElementById('powerup-display') || null;
    }

    init() {
      this.levels = SuperBario99.levelsV2.createLevels100
        ? SuperBario99.levelsV2.createLevels100()
        : (SuperBario99.levelsV2.createLevels99
          ? SuperBario99.levelsV2.createLevels99()
          : SuperBario99.levelsV2.createLevels50());
      this._spawnMenuSakura();

      this._applyTouchVisibility();

      // Aplica estética do menu no boot
      if (SuperBario99.themes && SuperBario99.themes.applyThemeForLevel) {
        SuperBario99.themes.applyThemeForLevel(0);
      }

      this.bestDisplay.textContent = `Recorde: ${this.bestScore}`;
      this._rebuildEnvironmentForLevel();
      this._loop(performance.now());
    }

    _bindEvents() {
      window.addEventListener('keydown', (e) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'x', 'X'].includes(e.key)) e.preventDefault();
        this.keys[e.key] = true;
      });
      window.addEventListener('keyup', (e) => {
        this.keys[e.key] = false;
      });

      window.addEventListener('blur', () => {
        this._clearInput();
        try { this.audio?.pauseAll?.(); } catch (_) {}
      });
      window.addEventListener('focus', async () => {
        try { await this.audio?.resumeAll?.(); } catch (_) {}
      });
      document.addEventListener('visibilitychange', async () => {
        if (document.hidden) {
          this._clearInput();
          try { this.audio?.pauseAll?.(); } catch (_) {}
        } else {
          try { await this.audio?.resumeAll?.(); } catch (_) {}
        }
      });
      window.addEventListener('resize', () => this._applyTouchVisibility());

      this.continueBtn.addEventListener('click', () => this.loadGame());
      this.startBtn.addEventListener('click', () => this.start());
      if (this.freeModeBtn) {
        this.freeModeBtn.addEventListener('click', async () => {
          this.audio.init();
          await this.audio.resume();
          // abre o overlay do Modo Livre (script free-mode.js)
          try { SuperBario99.__freeModeUI?.open?.(); } catch (_) {}
        });
      }
      this.restartBtn.addEventListener('click', () => this.start());
      this.menuBtn.addEventListener('click', async () => {
        this.audio.init();
        await this.audio.resume();
        this.goToMenu();
      });

      this.instructionsBtn.addEventListener('click', () => {
        this.instructions.style.display = 'flex';
        this.menu.style.display = 'none';
      });
      this.backBtn.addEventListener('click', () => {
        this.instructions.style.display = 'none';
        this.menu.style.display = 'flex';
      });

      this.muteBtn.addEventListener('click', async () => {
        this.audio.init();
        await this.audio.resume();
        this.audio.toggleMute();
      });

      // Touch buttons (pointer events = melhor compatibilidade)
      const bindHold = (el, keyName) => {
        if (!el) return;
        const down = (ev) => {
          ev.preventDefault();
          this.keys[keyName] = true;
          try { el.setPointerCapture?.(ev.pointerId); } catch (_) {}
        };
        const up = (ev) => {
          ev.preventDefault();
          this.keys[keyName] = false;
          try { el.releasePointerCapture?.(ev.pointerId); } catch (_) {}
        };
        el.addEventListener('pointerdown', down);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
        el.addEventListener('pointerleave', up);
        el.addEventListener('pointerout', up);
        el.addEventListener('lostpointercapture', up);
      };

      bindHold(this.touchLeftBtn, 'ArrowLeft');
      bindHold(this.touchRightBtn, 'ArrowRight');
      bindHold(this.touchJumpBtn, ' ');
      bindHold(this.touchAttackBtn, 'x');

      // Swipe no canvas: swipe para cima = pulo; arrasto horizontal = mover enquanto segura
      this.canvas.addEventListener('pointerdown', (ev) => {
        if (!this._isTouchDevice()) return;

        // Double tap -> usar power-up ativo (padrão de jogos mobile)
        const now = performance.now();
        if (this._lastTapAt && (now - this._lastTapAt) < 280) {
          this.useActivePowerup();
          this._lastTapAt = 0;
        } else {
          this._lastTapAt = now;
        }

        this._touch.active = true;
        this._touch.id = ev.pointerId;
        this._touch.startX = ev.clientX;
        this._touch.startY = ev.clientY;
        this._touch.moved = false;
        this._touch.jumpTriggered = false;
        try { this.canvas.setPointerCapture?.(ev.pointerId); } catch (_) {}
      });
      this.canvas.addEventListener('pointermove', (ev) => {
        if (!this._touch.active || ev.pointerId !== this._touch.id) return;
        const dx = ev.clientX - this._touch.startX;
        const dy = ev.clientY - this._touch.startY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (absX > 18 || absY > 18) this._touch.moved = true;

        // Swipe up -> pulo (uma vez)
        if (!this._touch.jumpTriggered && dy < -42 && absY > absX) {
          this.keys[' '] = true;
          this._touch.jumpTriggered = true;
          // solta logo em seguida para não ficar pulando infinito
          setTimeout(() => { this.keys[' '] = false; }, 0);
        }

        // Arrasto horizontal -> mover enquanto segura
        if (absX > 30 && absX > absY) {
          this.keys['ArrowLeft'] = dx < 0;
          this.keys['ArrowRight'] = dx > 0;
        }
      });
      const endSwipe = (ev) => {
        if (ev.pointerId !== this._touch.id) return;
        this._touch.active = false;
        this._touch.id = null;
        this.keys['ArrowLeft'] = false;
        this.keys['ArrowRight'] = false;
      };
      this.canvas.addEventListener('pointerup', endSwipe);
      this.canvas.addEventListener('pointercancel', endSwipe);
    }

    async start() {
      // Limpa save ao começar do zero
      localStorage.removeItem(this.saveKey);
      this._checkSave();

      this.audio.init();
      await this.audio.resume();

      this.running = true;
      this._isFreeMode = false;
      this._freeConfig = null;
      this.levelIndex = 0;
      this.levelSeed = this._makeSeed();
      this._regenLevelForCurrentSeed();
      {
        const level = this._getLevel();
        const sp = this._getPlayerSpawnPoint(level, 60, 32, 52);
        this.player = new SuperBario99.PlayerV2(sp.x, sp.y);
        this._beginSpawnPortal(level, performance.now());
      }
      this._lastLives = this.player.lives;
      this.cameraX = 0;
      this.particles.length = 0;

      this.enemies = this._buildEnemiesForLevel(this.levelIndex);
      this._buildNpcsForLevel(this.levelIndex);
      this._dialogue = null;

      this._nextAutosaveAt = performance.now() + 30000;

      this._setThemeForLevel();
      this.audio.playMusic();

      this._rebuildEnvironmentForLevel();

      this._queuePhaseIntro();

      this.menu.style.display = 'none';
      this.instructions.style.display = 'none';
      this.endScreen.style.display = 'none';

      this._updateHud();
      this._spawnMenuSakura();
      
      this._saveProgress();
    }

    // Inicia o jogo usando configurações do Modo Livre.
    // Importante: não grava no ranking principal e não sobrescreve o save do modo principal.
    async startFreeMode(config) {
      this.audio.init();
      await this.audio.resume();

      this.running = true;
      this._isFreeMode = true;
      this._freeConfig = config ? { ...config } : {};

      const maxLevel = (this.levels && this.levels.length) ? (this.levels.length - 1) : 98;
      const startLevel = util.clamp((this._freeConfig.startLevel | 0), 0, maxLevel);
      this.levelIndex = startLevel;

      // Gravidade
      const g = Number(this._freeConfig.gravity);
      this.gravity = isFinite(g) ? g : 0.8;

      // Seed nova para começar o sandbox
      this.levelSeed = this._makeSeed();
      this._regenLevelForCurrentSeed();

      {
        const level = this._getLevel();
        const sp = this._getPlayerSpawnPoint(level, 60, 32, 52);
        this.player = new SuperBario99.PlayerV2(sp.x, sp.y);
        this._beginSpawnPortal(level, performance.now());
      }
      this.player.score = 0;

      // Vidas
      if (this._freeConfig.lives === 'inf') {
        this.player.lives = 9999;
      } else {
        const lv = Number(this._freeConfig.lives);
        this.player.lives = (isFinite(lv) && lv > 0) ? lv : 10;
      }
      this._lastLives = this.player.lives;

      this.cameraX = 0;
      this.particles.length = 0;
      this._gridCacheLevelIndex = -1;

      this.enemies = this._buildEnemiesForLevel(this.levelIndex);
      this._buildNpcsForLevel(this.levelIndex);
      this._dialogue = null;

      this._nextAutosaveAt = performance.now() + 30000;

      // Tema/estética
      this._setThemeForLevel();
      this.audio.playMusic();

      this._rebuildEnvironmentForLevel();

      this._queuePhaseIntro();

      this.menu.style.display = 'none';
      this.instructions.style.display = 'none';
      this.endScreen.style.display = 'none';

      this._updateHud();
      this._spawnMenuSakura();
    }

    // Ação manual de power-up (mobile: double tap). Hoje: Ninja invisível.
    useActivePowerup() {
      if (!this.running || !this.player) return false;
      try {
        this.audio.init();
        return this.powerups.tryUseActive(performance.now(), this.player, this.audio);
      } catch (_) {
        return false;
      }
    }

    async loadGame() {
      const saveRaw = localStorage.getItem(this.saveKey);
      if (!saveRaw) return this.start();

      try {
        const data = JSON.parse(saveRaw);
        this.audio.init();
        await this.audio.resume();

        this.running = true;
        this._isFreeMode = false;
        this._freeConfig = null;
        this.levelIndex = data.levelIndex || 0;
        this.levelSeed = (data.levelSeed >>> 0) || this._makeSeed();
        this._regenLevelForCurrentSeed();
        {
          const level = this._getLevel();
          const sp = this._getPlayerSpawnPoint(level, 60, 32, 52);
          this.player = new SuperBario99.PlayerV2(sp.x, sp.y);
          this._beginSpawnPortal(level, performance.now());
        }
        this.player.score = data.score || 0;
        this.player.lives = (data.lives > 0) ? data.lives : 10;
        this._lastLives = this.player.lives;
        
        this.cameraX = 0;
        this.particles.length = 0;

        this.enemies = this._buildEnemiesForLevel(this.levelIndex);
        this._buildNpcsForLevel(this.levelIndex);
        this._dialogue = null;
        this._setThemeForLevel();
        this.audio.playMusic();

        this._rebuildEnvironmentForLevel();

        this._queuePhaseIntro();

  this._nextAutosaveAt = performance.now() + 30000;

        this.menu.style.display = 'none';
        this.instructions.style.display = 'none';
        this.endScreen.style.display = 'none';

        this._updateHud();
        this._spawnMenuSakura();

      } catch (e) {
        console.error('Save corrompido, iniciando novo jogo', e);
        this.start();
      }
    }

    _saveProgress() {
      if (!this.player) return;

      // No Modo Livre não persistimos o save principal.
      if (this._isFreeMode) return;

      const data = {
        levelIndex: this.levelIndex,
        score: this.player.score,
        lives: this.player.lives,
        levelSeed: this.levelSeed >>> 0,
        savedAt: Date.now()
      };
      localStorage.setItem(this.saveKey, JSON.stringify(data));
      this._checkSave();
    }

    goToMenu() {
      this.running = false;
      this.audio.stopMusic();
      this._releaseTouchKeys();

      this._spawnPortal = null;

      this._isFreeMode = false;
      this._freeConfig = null;

      // tema/música do menu
      this.audio.setTheme('menu');
      this.audio.playMusic();

      // estética do menu (usa a estética da fase 1 como padrão)
      if (SuperBario99.themes && SuperBario99.themes.applyTheme) {
        SuperBario99.themes.applyThemeForLevel(0);
      }

      this.enemies = null;
      this.npcs = [];
      this._nearNpc = null;
      this._dialogue = null;
      this.menu.style.display = 'flex';
      this.instructions.style.display = 'none';
      this.endScreen.style.display = 'none';
      this.bestDisplay.textContent = `Recorde: ${this.bestScore}`;
    }

    _buildNpcsForLevel(levelIndex) {
      const level = this.levels ? this.levels[levelIndex] : null;
      if (!level) {
        this.npcs = [];
        return;
      }

      if (!SuperBario99.HumanNpcV2 || !SuperBario99.loreV2?.getNpcConfigsForLevel) {
        this.npcs = [];
        return;
      }

      const tNow = performance.now();
      const aestheticId = this._getEffectiveAestheticId ? this._getEffectiveAestheticId(level, tNow) : (level.aestheticId || level.themeId);
      const bossCfg = (SuperBario99.bossesV2 && SuperBario99.bossesV2.getBossForLevel) ? SuperBario99.bossesV2.getBossForLevel(levelIndex) : null;

      const configs = SuperBario99.loreV2.getNpcConfigsForLevel(levelIndex, aestheticId, level, bossCfg) || [];
      const ww = Number(level.worldWidth || this.canvas.width || 800);
      const npcW = 32;
      const npcH = 52;
      const isBoss = !!bossCfg;

      const hashStr32 = (str) => {
        const s = String(str || '');
        let h = 2166136261 >>> 0;
        for (let i = 0; i < s.length; i++) {
          h ^= s.charCodeAt(i);
          h = Math.imul(h, 16777619) >>> 0;
        }
        return h >>> 0;
      };

      // RNG determinístico (por fase + estética + largura), pra NPCs não “pularem” de lugar à toa
      let seed = (((levelIndex + 1) * 0x9e3779b1) ^ (ww | 0) ^ hashStr32(aestheticId)) >>> 0;
      const rng = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };

      const rectOverlap = (a, b) => {
        return (
          a.x < b.x + b.w &&
          a.x + a.w > b.x &&
          a.y < b.y + b.h &&
          a.y + a.h > b.y
        );
      };

      const getRect = (o) => {
        if (!o || !Number.isFinite(o.x) || !Number.isFinite(o.y)) return null;
        const w = Number.isFinite(o.width) ? o.width : 0;
        const h = Number.isFinite(o.height) ? o.height : 0;
        return { x: o.x, y: o.y, w, h };
      };

      const collectBlockers = () => {
        const blockers = [];
        const keys = ['hazards', 'blocks', 'items', 'goals', 'coins'];
        for (const k of keys) {
          const arr = level[k];
          if (!Array.isArray(arr)) continue;
          for (const o of arr) {
            const r = getRect(o);
            if (r && r.w > 0 && r.h > 0) blockers.push(r);
          }
        }
        return blockers;
      };

      const blockers = collectBlockers();

      const isRectSafe = (x, y, w, h) => {
        const pad = 16;
        const rr = { x: x - pad, y: y - pad, w: w + pad * 2, h: h + pad * 2 };

        // bordas (evita spawn colado na câmera / fora do mundo)
        if (rr.x < 10 || (rr.x + rr.w) > (ww - 10)) return false;

        // não ficar colado no goal (fim)
        if (rr.x > (ww - 200)) return false;

        for (const b of blockers) {
          // goal e hazards precisam de buffer maior (legibilidade + segurança)
          const extra = (b.h >= 40 ? 18 : 12);
          const bb = { x: b.x - extra, y: b.y - extra, w: b.w + extra * 2, h: b.h + extra * 2 };
          if (rectOverlap(rr, bb)) return false;
        }

        return true;
      };

      const pickSafeSpawnOnPlatform = (platformCandidates, avoidX, rangeX) => {
        if (!platformCandidates || !platformCandidates.length) return null;

        const minX = rangeX && Number.isFinite(rangeX.minX) ? rangeX.minX : null;
        const maxX = rangeX && Number.isFinite(rangeX.maxX) ? rangeX.maxX : null;

        for (let tries = 0; tries < 40; tries++) {
          const p = platformCandidates[Math.floor(rng() * platformCandidates.length) % platformCandidates.length];
          if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.width)) continue;

          const marginX = 18;
          const span = Math.max(1, p.width - (marginX * 2) - npcW);
          const x = Math.floor(p.x + marginX + rng() * span);
          const y = Math.floor(p.y - npcH);

          if (Number.isFinite(minX) && x < minX) continue;
          if (Number.isFinite(maxX) && x > maxX) continue;

          if (Number.isFinite(avoidX) && Math.abs(x - avoidX) < 160) continue;
          if (!isRectSafe(x, y, npcW, npcH)) continue;
          return { x, y };
        }

        return null;
      };

      const pickGroundY = (x) => {
        const h = this.canvas ? this.canvas.height : 450;
        let best = null;
        if (Array.isArray(level.platforms)) {
          for (const p of level.platforms) {
            if (!p) continue;
            const px0 = p.x;
            const px1 = p.x + p.width;
            const cx = x + 16;
            if (cx < px0 - 4 || cx > px1 + 4) continue;
            if (!Number.isFinite(p.y)) continue;
            // pega a plataforma mais "baixa" (maior y) pra parecer chão
            if (!best || p.y > best.y) best = p;
          }
        }
        const groundY = best ? best.y : 372;
        return util.clamp(groundY - npcH, 60, h - 60);
      };

      const platformsAll = Array.isArray(level.platforms) ? level.platforms.slice(0) : [];
      const platformMinW = platformsAll.some((p) => p && p.width >= 140) ? 140 : 90;

      // Em boss level: mantém NPCs na metade esquerda (longe da arena)
      const pxMin = isBoss ? 80 : 160;
      const pxMax = isBoss ? Math.floor(ww * 0.55) : (ww - 320);

      const platformCandidates = platformsAll
        .filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.width) && p.width >= platformMinW)
        .filter((p) => (p.x + p.width) > pxMin && p.x < pxMax)
        .filter((p) => p.y >= 140 && p.y <= 380);

      const clampRange = (minX, maxX) => {
        const min = util.clamp(minX, 20, ww - 240);
        const max = util.clamp(maxX, 40, ww - 220);
        return (max > min + 40) ? { minX: min, maxX: max } : { minX: min, maxX: min + 120 };
      };

      // Zonas: 1 NPC mais perto do começo; 1 mais pro meio.
      // Em boss level, ambos ficam na metade esquerda (longe do fim/arena).
      const zones = isBoss
        ? [
          clampRange(140, Math.floor(ww * 0.30)),
          clampRange(Math.floor(ww * 0.30), Math.floor(ww * 0.52))
        ]
        : [
          clampRange(160, Math.floor(ww * 0.30)),
          clampRange(Math.floor(ww * 0.45), Math.floor(ww * 0.70))
        ];

      // fallback Xs caso algo dê errado
      const xsFallback = isBoss
        ? [util.clamp(180, 80, ww - 220), util.clamp(340, 120, ww - 220)]
        : [util.clamp(240, 80, ww - 220), util.clamp(Math.floor(ww * 0.55), 160, ww - 260)];

      const npcs = [];
      for (let i = 0; i < 2; i++) {
        const cfg = configs[i] || { id: `npc_${levelIndex}_${i}`, name: 'NPC', lines: ['...'], disguised: false };
        const avoidX = (i > 0 && npcs[0]) ? npcs[0].x : null;
        const zone = zones[i] || null;
        const inZone = zone
          ? platformCandidates.filter((p) => (p.x + p.width) >= (zone.minX - 40) && p.x <= (zone.maxX + 40))
          : platformCandidates;
        const picked = pickSafeSpawnOnPlatform(inZone.length ? inZone : platformCandidates, avoidX, zone);
        const x = picked ? picked.x : (xsFallback[i] || 220);
        const y = picked ? picked.y : pickGroundY(x);
        // se caiu no fallback, tenta ao menos evitar colisão direta com hazards/goal
        const safe = picked ? true : isRectSafe(x, y, npcW, npcH);
        npcs.push(new SuperBario99.HumanNpcV2(x, safe ? y : util.clamp(y - 24, 60, (this.canvas ? this.canvas.height : 450) - 60), cfg));
      }
      this.npcs = npcs;
    }

    _updateNpcs(nowMs, aestheticId) {
      if (!this.npcs || !this.npcs.length) {
        this._nearNpc = null;
        return;
      }

      // Atualiza NPCs e detecta o mais próximo
      let nearest = null;
      let nearestD = Infinity;

      for (const npc of this.npcs) {
        npc.update?.(this.player, nowMs);
        if (!this.player) continue;
        const cx = npc.x + npc.width / 2;
        const px = this.player.x + this.player.width / 2;
        const d = Math.abs(px - cx) + Math.abs((this.player.y + this.player.height / 2) - (npc.y + npc.height / 2));
        if (npc.isNear?.(this.player) && d < nearestD) {
          nearest = npc;
          nearestD = d;
        }
      }

      this._nearNpc = nearest;
    }

    _startDialogue(npc, nowMs) {
      if (!npc) return;
      this._dialogue = {
        active: true,
        npcId: npc.id,
        name: npc.name,
        lines: Array.isArray(npc.lines) ? npc.lines.slice(0) : ['...'],
        index: 0
      };
      this._dialogueNextAt = nowMs + 180;
    }

    _advanceDialogue(nowMs) {
      if (!this._dialogue || !this._dialogue.active) return;
      if (nowMs < (this._dialogueNextAt || 0)) return;
      this._dialogueNextAt = nowMs + 160;

      this._dialogue.index++;
      if (this._dialogue.index >= (this._dialogue.lines ? this._dialogue.lines.length : 0)) {
        this._dialogue = null;
      }
    }

    _drawDialogueHud(aestheticId) {
      if (!this._dialogue || !this._dialogue.active) return;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      const boxW = Math.min(680, w - 30);
      const boxH = 112;
      const x = Math.floor((w - boxW) / 2);
      const y = h - boxH - 18;
      const pad = 14;

      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.62)';
      ctx.fillRect(x, y, boxW, boxH);
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, boxW, boxH);

      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = '16px Arial';
      ctx.fillText(String(this._dialogue.name || 'NPC'), x + pad, y + 26);

      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      const line = (this._dialogue.lines && this._dialogue.lines[this._dialogue.index]) ? String(this._dialogue.lines[this._dialogue.index]) : '...';

      // quebra simples por largura
      const maxTextW = boxW - pad * 2;
      const words = line.split(' ');
      let cur = '';
      let row = 0;
      for (let i = 0; i < words.length; i++) {
        const test = cur ? (cur + ' ' + words[i]) : words[i];
        if (ctx.measureText(test).width > maxTextW && cur) {
          ctx.fillText(cur, x + pad, y + 52 + row * 18);
          cur = words[i];
          row++;
          if (row >= 2) break;
        } else {
          cur = test;
        }
      }
      if (cur && row < 3) ctx.fillText(cur, x + pad, y + 52 + row * 18);

      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = '12px Arial';
      ctx.fillText('Continuar: ↑ / Espaço / X', x + pad, y + boxH - 14);
      ctx.restore();
    }

    _setThemeForLevel() {
      const themeId = SuperBario99.difficulty.getThemeId(this.levelIndex);
      const boss = this._isBossLevel(this.levelIndex);

      const level = this._getLevel();

      // Estética (UI/efeitos): por fase no modo normal; override no Modo Livre
      const aestheticId = (this._isFreeMode && this._freeConfig && this._freeConfig.aestheticId)
        ? this._freeConfig.aestheticId
        : (level && level.aestheticId ? level.aestheticId
          : (SuperBario99.themes ? SuperBario99.themes.getAestheticIdForLevel(this.levelIndex) : 'windows-xp'));

      // Música: agora acompanha a estética (normal e boss)
      if (boss && SuperBario99.bossesV2 && SuperBario99.bossesV2.getBossForLevel) {
        const cfg = SuperBario99.bossesV2.getBossForLevel(this.levelIndex);
        const musicId = cfg?.musicId || aestheticId;
        this.audio.setTheme(`boss_${musicId}`);
      } else {
        this.audio.setTheme(boss ? `boss_${aestheticId}` : aestheticId);
      }

      if (SuperBario99.themes && SuperBario99.themes.applyTheme) {
        SuperBario99.themes.applyTheme(aestheticId);
      }
    }

    _isBossLevel(levelIndex) {
      // Bosses épicos conforme tabela/CSV:
      // 10,20,30,40,49,59,69,79,89,99,100
      const phase = (levelIndex | 0) + 1;
      return (phase === 10 || phase === 20 || phase === 30 || phase === 40 || phase === 49 || phase === 59 || phase === 69 || phase === 79 || phase === 89 || phase === 99 || phase === 100);
    }

    _getLevel() {
      return this.levels[this.levelIndex];
    }

    _rebuildEnvironmentForLevel() {
      const level = this._getLevel();
      if (!level) return;

      const aestheticId = (this._isFreeMode && this._freeConfig && this._freeConfig.aestheticId)
        ? this._freeConfig.aestheticId
        : (level.aestheticId || level.themeId);

      // RNG simples a partir da seed da fase (determinístico o suficiente)
      const seed = (this.levelSeed >>> 0) || ((1000 + this.levelIndex * 999) >>> 0);
      let s = seed;
      const rng = () => {
        s |= 0;
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };

      this._weather = this.weatherSystem?.generateForLevel?.(this.levelIndex, aestheticId, rng) || { type: 'none', intensity: 0 };
      this._scenery = this.sceneryBuilder?.build?.(this.levelIndex, aestheticId, rng) || [];

      // Ambiente sonoro (se suportado)
      try { this.audio?.setAmbience?.(this._weather?.type || 'none', this._weather?.intensity || 0, aestheticId); } catch (_) {}
    }

    _getChaosVariantAesthetic(nowMs) {
      // alterna estética a cada 30s, sem mexer na UI (CSS vars)
      const idx = Math.floor(((nowMs || performance.now()) / 30000) % 5);
      return (idx === 0) ? 'fruitiger-ocean'
        : (idx === 1) ? 'fruitiger-sunset'
          : (idx === 2) ? 'fruitiger-neon'
            : (idx === 3) ? 'fruitiger-forest'
              : 'fruitiger-galaxy';
    }

    _getEffectiveAestheticId(level, nowMs) {
      const base = (this._isFreeMode && this._freeConfig && this._freeConfig.aestheticId)
        ? this._freeConfig.aestheticId
        : (level && (level.aestheticId || (SuperBario99.themes ? SuperBario99.themes.getAestheticIdForLevel(this.levelIndex) : level.themeId))) || 'windows-xp';

      if (base === 'caos-final') return this._getChaosVariantAesthetic(nowMs);
      return base;
    }

    _getGroundY(level) {
      // tenta pegar a plataforma mais "chão" (mais larga e mais baixa)
      if (!level || !level.platforms || !level.platforms.length) return this.canvas.height - 60;
      let best = null;
      for (const p of level.platforms) {
        if (!best) { best = p; continue; }
        const pArea = (p.width || 0) * (p.height || 0);
        const bArea = (best.width || 0) * (best.height || 0);
        if ((p.y > best.y && pArea >= bArea * 0.75) || pArea > bArea * 1.35) best = p;
      }
      return (best && typeof best.y === 'number') ? best.y : (this.canvas.height - 60);
    }

    _pushFloatText(x, y, text, color = 'rgba(255,255,255,0.9)') {
      const now = performance.now();
      this._floatTexts.push({ x, y, text, color, bornAt: now, until: now + 900 });
    }

    _spawnMenuSakura() {
      // partículas de sakura (persistem no menu e no jogo Japan/MemeFusion)
      this.sakura.length = 0;
      for (let i = 0; i < 45; i++) {
        this.sakura.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          vx: util.rand(-0.3, 0.6),
          vy: util.rand(0.5, 1.3),
          r: util.rand(2, 4),
          rot: util.rand(0, Math.PI * 2)
        });
      }
    }

    _updateSakura() {
      for (const s of this.sakura) {
        s.x += s.vx;
        s.y += s.vy;
        s.rot += 0.02;
        if (s.y > this.canvas.height + 10) {
          s.y = -10;
          s.x = Math.random() * this.canvas.width;
        }
        if (s.x < -10) s.x = this.canvas.width + 10;
        if (s.x > this.canvas.width + 10) s.x = -10;
      }
    }

    _drawSakura() {
      this.ctx.fillStyle = 'rgba(255, 182, 193, 0.85)';
      for (const s of this.sakura) {
        const x = s.x;
        const y = s.y;
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(s.rot);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, s.r, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    }

    _spawnCoinParticles(x, y, themeId) {
      for (let i = 0; i < 12; i++) {
        this.particles.push({
          x,
          y,
          vx: util.rand(-2.2, 2.2),
          vy: util.rand(-4.2, -1.2),
          life: util.irand(25, 45),
          color: themeId === 'tecnozen' ? '#23d5ff' : '#FFD700'
        });
      }
    }

    _updateParticles() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.vy += 0.18;
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
    }

    _drawParticles() {
      for (const p of this.particles) {
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(p.x - this.cameraX, p.y, 3, 3);
      }
    }

    _buildEnemiesForLevel(levelIndex) {
      const level = this.levels[levelIndex];
      const diff = SuperBario99.difficulty.getDifficulty(levelIndex);
      const aestheticId = (level && (level.aestheticId || (SuperBario99.themes ? SuperBario99.themes.getAestheticIdForLevel(levelIndex) : null))) || level.themeId;
      const themeId = (() => {
        const a = String(aestheticId || level.themeId || 'japan');
        if (a === 'japan-retro') return 'japan';
        if (a.startsWith('fruitiger-')) return 'fruitiger';
        if (a === 'caos-final') return 'memefusion';
        if (a === 'tecno-zen') return 'tecnozen';
        if (a === 'metro-aero') return 'metro';
        if (a === 'aurora-aero') return 'memefusion';
        return a;
      })();

      const rng = (() => {
        let seed = ((this.levelSeed >>> 0) ^ (777 + levelIndex * 1337)) >>> 0;
        return () => {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          return seed / 4294967296;
        };
      })();

      const enemies = [];

      // Overrides do Modo Livre
      const free = (this._isFreeMode && this._freeConfig) ? this._freeConfig : null;
      const desiredCount = free ? util.clamp((free.enemyCount | 0), 0, 50) : null;
      const poolId = free ? String(free.enemyPool || 'mixed') : null;
      const behavior = free ? String(free.enemyBehavior || 'random') : 'random';

      // Boss no fim do bloco
      if (this._isBossLevel(levelIndex)) {
        const bx = Math.max(420, level.worldWidth - 520);
        const by = 290;
        const bossCfg = (SuperBario99.bossesV2 && SuperBario99.bossesV2.getBossForLevel)
          ? SuperBario99.bossesV2.getBossForLevel(levelIndex)
          : null;
        const bossVisualId = String(bossCfg?.musicId || aestheticId || themeId);
        enemies.push(new SuperBario99.ThemeBoss(bx, by, bossVisualId, levelIndex, bossCfg));

        const extra = diff.tier === 'advanced' ? 4 : 2;
        for (let i = 0; i < extra; i++) {
          const x = bx - 260 - i * 110;
          const y = 260 + Math.floor(rng() * 70);
          enemies.push(new SuperBario99.DroneEnemy(x, y));
        }

        return enemies;
      }

      // Random real por estética (pesos por tema)
      const tables = {
        japan: [
          // alvo aproximado: 30% ninja, 30% yokai, 20% samurai, 20% "aleatórios" (tanuki/kitsune)
          { w: 3, make: (x, y) => new SuperBario99.NinjaEnemy(x, y) },
          { w: 3, make: (x, y) => new SuperBario99.YokaiEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.SamuraiEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.TanukiEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.KitsuneEnemy(x, y) }
        ],
        fruitiger: [
          { w: 3, make: (x, y) => new SuperBario99.DroneEnemy(x, y - 30) },
          { w: 2, make: (x, y) => new SuperBario99.NinjaEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.TanukiEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.KitsuneEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.SamuraiEnemy(x, y) }
        ],
        tecnozen: [
          { w: 4, make: (x, y) => new SuperBario99.DroneEnemy(x, y - 40) },
          { w: 2, make: (x, y) => new SuperBario99.YokaiEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.NinjaEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.SamuraiEnemy(x, y) }
        ],
        dorfic: [
          { w: 3, make: (x, y) => new SuperBario99.YokaiEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.SamuraiEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.TanukiEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.NinjaEnemy(x, y) }
        ],
        metro: [
          { w: 4, make: (x, y) => new SuperBario99.DroneEnemy(x, y - 40) },
          { w: 2, make: (x, y) => new SuperBario99.NinjaEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.SamuraiEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.YokaiEnemy(x, y) }
        ],
        evil: [
          { w: 3, make: (x, y) => new SuperBario99.YokaiEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.NinjaEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.SamuraiEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.KitsuneEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.DroneEnemy(x, y - 35) }
        ],
        memefusion: [
          { w: 2, make: (x, y) => new SuperBario99.NinjaEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.DroneEnemy(x, y - 35) },
          { w: 2, make: (x, y) => new SuperBario99.KitsuneEnemy(x, y) },
          { w: 2, make: (x, y) => new SuperBario99.YokaiEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.SamuraiEnemy(x, y) },
          { w: 1, make: (x, y) => new SuperBario99.TanukiEnemy(x, y) }
        ]
      };

      let table = tables[themeId] || tables.japan;

      // No Modo Livre, substitui a tabela conforme pool
      if (free) {
        const all = {
          ninja: { w: 2, make: (x, y) => new SuperBario99.NinjaEnemy(x, y) },
          yokai: { w: 2, make: (x, y) => new SuperBario99.YokaiEnemy(x, y) },
          samurai: { w: 2, make: (x, y) => new SuperBario99.SamuraiEnemy(x, y) },
          tanuki: { w: 2, make: (x, y) => new SuperBario99.TanukiEnemy(x, y) },
          kitsune: { w: 2, make: (x, y) => new SuperBario99.KitsuneEnemy(x, y) },
          drone: { w: 2, make: (x, y) => new SuperBario99.DroneEnemy(x, y - 35) }
        };

        const pools = {
          japanese: ['ninja', 'yokai', 'samurai', 'tanuki', 'kitsune'],
          tech: ['drone', 'yokai'],
          mixed: ['ninja', 'yokai', 'samurai', 'tanuki', 'kitsune', 'drone']
        };
        const ids = pools[poolId] || pools.mixed;
        table = ids.map((id) => all[id]).filter(Boolean);
        if (!table.length) table = tables.japan;
      }
      const totalW = table.reduce((a, it) => a + it.w, 0);
      const pickOne = () => {
        let r = rng() * totalW;
        for (const it of table) {
          r -= it.w;
          if (r <= 0) return it;
        }
        return table[0];
      };

      // escala: ~3 no começo, ~18 perto do fim do jogo (clamp 2..20)
      // No Modo Livre: usa slider 0..50
      let count = (desiredCount != null)
        ? desiredCount
        : (() => {
          const denom = Math.max(1, ((this.levels && this.levels.length) ? (this.levels.length - 1) : 49));
          return util.clamp(Math.round(3 + (levelIndex / denom) * 15), 2, 20);
        })();

      if (this._weather && this._weather.type === 'storm') {
        count = Math.min(50, Math.ceil(count * 1.2));
      }

      const rectsHit = (ax, ay, aw, ah, bx, by, bw, bh) => (
        ax < bx + bw &&
        ax + aw > bx &&
        ay < by + bh &&
        ay + ah > by
      );

      const isSpawnClear = (sx, sy, sw, sh) => {
        const plats = level.platforms || [];
        for (let i = 0; i < plats.length; i++) {
          const p = plats[i];
          if (!p) continue;
          if (typeof p.x !== 'number' || typeof p.y !== 'number') continue;
          if (typeof p.width !== 'number' || typeof p.height !== 'number') continue;
          if (rectsHit(sx, sy, sw, sh, p.x, p.y, p.width, p.height)) return false;
        }
        return true;
      };

      for (let i = 0; i < count; i++) {
        // Tenta evitar nascer “dentro” de parede/escada/plataforma.
        let x = 320 + Math.floor(rng() * (level.worldWidth - 520));
        let y = 260 + Math.floor(rng() * 80);

        // comportamento simples: agressivo tende a ficar mais perto do player / mais central,
        // defensivo tende a ficar mais longe e mais alto.
        if (free) {
          if (behavior === 'aggressive') {
            y = 280 + Math.floor(rng() * 60);
          } else if (behavior === 'defensive') {
            y = 220 + Math.floor(rng() * 60);
          }
        }

        // Rejeição simples: se cair dentro de uma plataforma sólida, tenta outro ponto.
        // Mantém o comportamento atual (spawns mais “soltos”), só elimina os casos bugados.
        const spawnW = 32;
        const spawnH = 40;
        let tries = 0;
        while (tries < 14 && !isSpawnClear(x, y, spawnW, spawnH)) {
          x = 320 + Math.floor(rng() * (level.worldWidth - 520));
          y = 250 + Math.floor(rng() * 110);
          tries++;
        }

        enemies.push(pickOne().make(x, y));
      }

      return enemies;
    }

    _ensureGridForLevel(levelIndex) {
      if (this._gridCacheLevelIndex === levelIndex && this._grid) return;
      const level = this.levels[levelIndex];
      this._grid = SuperBario99.pathfinding.buildSolidGrid(level, 32, this.canvas.height);
      this._gridCacheLevelIndex = levelIndex;
    }

    _updateHud() {
      this.scoreDisplay.textContent = `Pontos: ${this.player ? this.player.score : 0}`;
      const total = (this.levels && this.levels.length) ? this.levels.length : 50;
      this.levelDisplay.textContent = `Fase: ${this.levelIndex + 1}/${total}`;
      this.bestDisplay.textContent = `Recorde: ${this.bestScore}`;
      if (!this.powerupDisplay) return;
      const now = performance.now();
      const a = this.powerups?.getActive?.(now);
      if (!a) {
        this.powerupDisplay.style.display = 'none';
        return;
      }

      const ms = this.powerups.getRemainingMs(now);
      const s = Math.max(0, Math.ceil(ms / 1000));
      const icon = this.powerupDisplay.querySelector('.pu-icon');
      const text = this.powerupDisplay.querySelector('.pu-text');
      if (icon) icon.style.background = this.powerups.getColor(a);
      if (text) text.textContent = `${a.toUpperCase()} • ${s}s`;
      this.powerupDisplay.style.display = 'inline-flex';
    }

    _end(victory) {
      // No Modo Livre: não mexe no save do modo principal nem no recorde principal.
      if (this._isFreeMode) {
        this.running = false;
        this.audio.stopMusic();
        this._releaseTouchKeys();
        this.audio.playSfx(victory ? 'powerup' : 'gameOver');
        this.endTitle.textContent = victory ? 'VITÓRIA!' : 'FIM (MODO LIVRE)';
        this.endScore.textContent = `Pontuação: ${this.player ? this.player.score : 0}`;
        this.endBest.textContent = `Recorde: ${this.bestScore}`;
        this.endScreen.style.display = 'flex';
        return;
      }

      if (victory) {
        // Zera o save se zerou o jogo
        localStorage.removeItem(this.saveKey);
      } else {
        // Se morreu: salva a fase atual para tentar de novo.
        // Também atualiza vidas e seed (layout muda a cada nova tentativa desta fase).
        if (this.player) {
          this.levelSeed = this._makeSeed();
          this.player.lives = 10;
          this._saveProgress();
        }
      }
      this._checkSave();

      this.running = false;
      this.audio.stopMusic();
      this._releaseTouchKeys();
      this.audio.playSfx(victory ? 'powerup' : 'gameOver');

      if (this.player && this.player.score > this.bestScore) {
        this.bestScore = this.player.score;
        localStorage.setItem(this.highKey, String(this.bestScore));
      }

      this.endTitle.textContent = victory ? 'VITÓRIA!' : 'GAME OVER';
      this.endScore.textContent = `Pontuação: ${this.player ? this.player.score : 0}`;
      this.endBest.textContent = `Recorde: ${this.bestScore}`;
      this.endScreen.style.display = 'flex';
    }

    _cameraUpdate(level) {
      const target = this.player.x - this.canvas.width * 0.45;
      this.cameraX = util.clamp(target, 0, Math.max(0, level.worldWidth - this.canvas.width));
    }

    _renderBackground(themeId, nightMode) {
      const ctx = this.ctx;

      // Dia/noite
      const darken = nightMode ? 0.55 : 0.0;

      // A partir daqui, `themeId` pode ser um themeId antigo OU um aestheticId novo.
      const id = themeId || 'windows-xp';

      const isFruitiger = (id === 'fruitiger' || id === 'fruitiger-aero');
      const isOcean = (id === 'fruitiger-ocean');
      const isSunset = (id === 'fruitiger-sunset');
      const isNeon = (id === 'fruitiger-neon');
      const isForest = (id === 'fruitiger-forest');
      const isGalaxy = (id === 'fruitiger-galaxy');
      const isJapanRetro = (id === 'japan-retro');
      const isChaos = (id === 'caos-final');
      const isMetro = (id === 'metro' || id === 'metro-aero');
      const isTecno = (id === 'tecnozen' || id === 'tecno-zen');
      const isDorfic = (id === 'dorfic');
      const isVapor = (id === 'vaporwave');
      const isAurora = (id === 'aurora-aero');
      const isXP = (id === 'windows-xp');
      const isVista = (id === 'windows-vista');

      // -----------------------------
      // JAPÃO RETRO (fases 1-10)
      // -----------------------------
      if (isJapanRetro) {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#ffb6d5');
        grd.addColorStop(1, '#ffeef6');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Fuji
        const par = -(this.cameraX * 0.15) % 900;
        ctx.fillStyle = 'rgba(210, 120, 170, 0.45)';
        ctx.beginPath();
        ctx.moveTo(par + 180, 380);
        ctx.lineTo(par + 320, 210);
        ctx.lineTo(par + 460, 380);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.moveTo(par + 320, 210);
        ctx.lineTo(par + 290, 250);
        ctx.lineTo(par + 350, 250);
        ctx.closePath();
        ctx.fill();

        // Torii
        ctx.fillStyle = 'rgba(192, 57, 43, 0.40)';
        for (let i = 0; i < 4; i++) {
          const x = (par + i * 240 + 60) % (this.canvas.width + 100);
          ctx.fillRect(x, 320, 6, 60);
          ctx.fillRect(x + 26, 320, 6, 60);
          ctx.fillRect(x - 8, 315, 48, 8);
        }

        this._updateSakura();
        this._drawSakura();
      }

      // -----------------------------
      // WINDOWS XP
      // -----------------------------
      else if (isXP) {
        // céu
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#65B9FF');
        grd.addColorStop(1, '#0055E5');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // colinas "Bliss" (estilizado)
        const par = -(this.cameraX * 0.18) % (this.canvas.width + 400);
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.moveTo(par - 200, 420);
        ctx.quadraticCurveTo(par + 120, 260, par + 520, 420);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.moveTo(par + 200, 420);
        ctx.quadraticCurveTo(par + 520, 290, par + 900, 420);
        ctx.closePath();
        ctx.fill();

        // "barra de tarefas" no topo
        ctx.fillStyle = 'rgba(236,233,216,0.92)';
        ctx.fillRect(0, 0, this.canvas.width, 28);
        ctx.fillStyle = 'rgba(0,85,229,0.55)';
        ctx.fillRect(0, 26, this.canvas.width, 2);
        ctx.fillStyle = 'rgba(0,204,0,0.85)';
        ctx.fillRect(8, 6, 62, 18);
        ctx.fillStyle = 'rgba(255,255,255,0.80)';
        ctx.fillRect(14, 10, 18, 10);

        // ícones simples no "desktop"
        ctx.fillStyle = 'rgba(236,233,216,0.25)';
        for (let i = 0; i < 6; i++) {
          const ix = 22;
          const iy = 46 + i * 44;
          ctx.fillRect(ix, iy, 20, 20);
        }

      }

      // -----------------------------
      // FRUITIGER AERO (fases 6-10)
      // -----------------------------
      else if (isFruitiger) {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#87CEEB');
        grd.addColorStop(1, '#1E90FF');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // nuvens fofas ("blur" simulado com camadas)
        const base = -(this.cameraX * 0.22) % 900;
        for (let i = 0; i < 7; i++) {
          const x = base + i * 160;
          const y = 62 + (i % 3) * 24;
          ctx.fillStyle = 'rgba(255,255,255,0.20)';
          ctx.beginPath();
          ctx.arc(x + 20, y, 22, 0, Math.PI * 2);
          ctx.arc(x + 46, y - 12, 24, 0, Math.PI * 2);
          ctx.arc(x + 72, y, 22, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.beginPath();
          ctx.arc(x + 20, y, 16, 0, Math.PI * 2);
          ctx.arc(x + 42, y - 10, 18, 0, Math.PI * 2);
          ctx.arc(x + 64, y, 16, 0, Math.PI * 2);
          ctx.fill();

          // avião de papel
          ctx.strokeStyle = 'rgba(255,255,255,0.80)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 96, y + 26);
          ctx.lineTo(x + 118, y + 18);
          ctx.lineTo(x + 104, y + 38);
          ctx.closePath();
          ctx.stroke();
        }

        // grade sutil no chão
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < this.canvas.width; gx += 24) {
          ctx.beginPath();
          ctx.moveTo(gx, 380);
          ctx.lineTo(gx, this.canvas.height);
          ctx.stroke();
        }
        for (let gy = 380; gy < this.canvas.height; gy += 18) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(this.canvas.width, gy);
          ctx.stroke();
        }

        // partículas de brilho (2px)
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        const t = performance.now() * 0.001;
        for (let i = 0; i < 34; i++) {
          const px = ((i * 67) + (this.cameraX * 0.12) + (t * 60)) % (this.canvas.width + 40) - 20;
          const py = 120 + ((i * 29) % 240);
          ctx.fillRect(px, py, 2, 2);
        }

        // luz suave global
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }

      // -----------------------------
      // FRUITIGER OCEAN (50-59)
      // -----------------------------
      else if (isOcean) {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#00CED1');
        grd.addColorStop(1, '#1E90FF');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // ondas na base
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        const t = performance.now() * 0.001;
        for (let i = 0; i < 4; i++) {
          const wave = 4 + i * 2;
          ctx.fillRect(0, 386 + Math.sin(t * 1.4 + i) * wave, this.canvas.width, 10);
        }
      }

      // -----------------------------
      // FRUITIGER SUNSET (60-69)
      // -----------------------------
      else if (isSunset) {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#FF6347');
        grd.addColorStop(0.55, '#FFA500');
        grd.addColorStop(1, '#FFD700');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // sol
        ctx.fillStyle = 'rgba(255,215,0,0.35)';
        ctx.beginPath();
        ctx.arc(660, 120, 60, 0, Math.PI * 2);
        ctx.fill();
      }

      // -----------------------------
      // FRUITIGER NEON (70-79)
      // -----------------------------
      else if (isNeon) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // círculos concêntricos
        ctx.strokeStyle = 'rgba(0,255,255,0.18)';
        ctx.lineWidth = 2;
        const cx = this.canvas.width * 0.55;
        const cy = 160;
        for (let r = 40; r <= 180; r += 20) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // -----------------------------
      // FRUITIGER FOREST (80-89)
      // -----------------------------
      else if (isForest) {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#228B22');
        grd.addColorStop(1, '#145a22');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // árvores altas
        const base = -(this.cameraX * 0.16) % 900;
        for (let i = 0; i < 7; i++) {
          const x = base + i * 140;
          ctx.fillStyle = 'rgba(139,69,19,0.35)';
          ctx.fillRect(x, 160, 22, 260);
          ctx.fillStyle = 'rgba(34,139,34,0.30)';
          ctx.beginPath();
          ctx.arc(x + 11, 150, 44, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // -----------------------------
      // FRUITIGER GALAXY (90-99)
      // -----------------------------
      else if (isGalaxy) {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#0b0014');
        grd.addColorStop(1, '#00008B');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // estrelas
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        for (let i = 0; i < 70; i++) {
          const sx = (i * 37 + (this.cameraX * 0.05)) % this.canvas.width;
          const sy = (i * 19) % 240;
          const s = (i % 3) + 1;
          ctx.fillRect(sx, sy, s, s);
        }
      }

      // -----------------------------
      // CAOS FINAL (100)
      // -----------------------------
      else if (isChaos) {
        // base neutra; o overlay e o fluxo do Game alternam estéticas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }

      // -----------------------------
      // TECNO ZEN (fases 11-15)
      // -----------------------------
      else if (isTecno) {
        // base escura
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // gradiente tecnológico
        const grd = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        grd.addColorStop(0, 'rgba(138,43,226,0.38)');
        grd.addColorStop(1, 'rgba(0,191,255,0.30)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // circuitos
        ctx.strokeStyle = 'rgba(0,255,255,0.55)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
          const x = ((i * 120) + (this.cameraX * 0.25)) % this.canvas.width;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, this.canvas.height);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(57,255,20,0.28)';
        for (let i = 0; i < 6; i++) {
          const y = 40 + i * 68;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(this.canvas.width, y);
          ctx.stroke();
        }

        // "código" flutuando (texto pequeno em verde)
        ctx.fillStyle = 'rgba(57,255,20,0.35)';
        ctx.font = '10px monospace';
        const baseX = -(this.cameraX * 0.32) % 420;
        for (let i = 0; i < 22; i++) {
          const tx = baseX + (i % 6) * 72;
          const ty = 70 + (i * 17) % 260;
          ctx.fillText('010101001', tx, ty);
        }

        // mandala digital (círculos)
        ctx.strokeStyle = 'rgba(0,255,255,0.25)';
        ctx.lineWidth = 2;
        const cx = this.canvas.width * 0.72;
        const cy = 150;
        for (let r = 40; r <= 120; r += 20) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // partículas de dados (pontos conectados)
        ctx.strokeStyle = 'rgba(0,255,255,0.20)';
        ctx.fillStyle = 'rgba(0,255,255,0.35)';
        for (let i = 0; i < 10; i++) {
          const px = ((this.cameraX * 0.18) + i * 90) % (this.canvas.width + 120) - 60;
          const py = 90 + (i % 5) * 44;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + 24, py + 12);
          ctx.stroke();
        }

        // overlay preto 90% opacidade ("fundo" profundo)
        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }

      // -----------------------------
      // DORFIC (fases 16-20)
      // -----------------------------
      else if (isDorfic) {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#556B2F');
        grd.addColorStop(1, '#228B22');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // árvores antigas (casca)
        const base = -(this.cameraX * 0.18) % 900;
        for (let i = 0; i < 6; i++) {
          const x = base + i * 180;
          ctx.fillStyle = 'rgba(139,69,19,0.55)';
          ctx.fillRect(x, 170, 26, 240);
          ctx.fillStyle = 'rgba(0,0,0,0.10)';
          for (let s = 0; s < 6; s++) ctx.fillRect(x + 4 + (s % 2) * 10, 180 + s * 34, 4, 18);
          ctx.fillStyle = 'rgba(60,110,71,0.45)';
          ctx.beginPath();
          ctx.arc(x + 13, 158, 42, 0, Math.PI * 2);
          ctx.fill();
        }

        // rochas com musgo
        ctx.fillStyle = 'rgba(105,105,105,0.55)';
        for (let i = 0; i < 7; i++) {
          const rx = ((this.cameraX * 0.10) + i * 140) % (this.canvas.width + 200) - 80;
          ctx.beginPath();
          ctx.arc(rx, 380, 30 + (i % 3) * 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(60,110,71,0.35)';
          ctx.beginPath();
          ctx.arc(rx - 10, 370, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(105,105,105,0.55)';
        }

        // raios de sol
        ctx.fillStyle = 'rgba(240,230,140,0.08)';
        for (let i = 0; i < 4; i++) {
          const sx = 120 + i * 190;
          ctx.beginPath();
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx + 80, 0);
          ctx.lineTo(sx + 40, 260);
          ctx.closePath();
          ctx.fill();
        }

        // neblina baixa
        const fog = ctx.createLinearGradient(0, 310, 0, this.canvas.height);
        fog.addColorStop(0, 'rgba(255,255,255,0.00)');
        fog.addColorStop(1, 'rgba(255,255,255,0.12)');
        ctx.fillStyle = fog;
        ctx.fillRect(0, 310, this.canvas.width, this.canvas.height - 310);
      }

      // -----------------------------
      // METRO AERO (fases 21-25)
      // -----------------------------
      else if (isMetro) {
        // fundo profundo
        ctx.fillStyle = '#0A0A0A';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, 'rgba(0,102,204,0.40)');
        grd.addColorStop(1, 'rgba(0,191,255,0.22)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // trilhos com perspectiva
        ctx.strokeStyle = 'rgba(192,192,192,0.60)';
        ctx.lineWidth = 3;
        const base = -(this.cameraX * 0.45) % 120;
        for (let i = 0; i < 10; i++) {
          const x = base + i * 120;
          ctx.beginPath();
          ctx.moveTo(x, 360);
          ctx.lineTo(x + 40, 420);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(0,191,255,0.60)';
        ctx.beginPath();
        ctx.moveTo(0, 330);
        ctx.lineTo(this.canvas.width, 330);
        ctx.stroke();

        // trem passando (sprites simples)
        const tx = ((-this.cameraX * 0.70) % (this.canvas.width + 320)) + this.canvas.width;
        ctx.fillStyle = 'rgba(192,192,192,0.28)';
        ctx.fillRect(tx - 320, 248, 260, 40);
        ctx.fillStyle = 'rgba(0,191,255,0.35)';
        for (let i = 0; i < 7; i++) ctx.fillRect(tx - 300 + i * 34, 258, 18, 12);

        // sinais (vermelho/verde)
        for (let i = 0; i < 3; i++) {
          const sx = 90 + i * 220;
          ctx.fillStyle = 'rgba(192,192,192,0.35)';
          ctx.fillRect(sx, 280, 10, 90);
          ctx.fillStyle = 'rgba(255,0,0,0.65)';
          ctx.beginPath();
          ctx.arc(sx + 5, 290, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(57,255,20,0.75)';
          ctx.beginPath();
          ctx.arc(sx + 5, 304, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // mapas de metrô (linhas coloridas)
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(520, 120);
        ctx.lineTo(650, 150);
        ctx.lineTo(720, 110);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(57,255,20,0.20)';
        ctx.beginPath();
        ctx.moveTo(540, 160);
        ctx.lineTo(680, 170);
        ctx.lineTo(740, 150);
        ctx.stroke();

        // linhas de velocidade nas bordas
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 18; i++) {
          const y = 40 + i * 22;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(40, y + 18);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(this.canvas.width, y);
          ctx.lineTo(this.canvas.width - 40, y + 18);
          ctx.stroke();
        }
      }

      // -----------------------------
      // VAPORWAVE (fases 26-30)
      // -----------------------------
      else if (isVapor) {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#FF00FF');
        grd.addColorStop(0.55, '#800080');
        grd.addColorStop(1, '#000000');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // grade de computador antigo (pontos)
        ctx.fillStyle = 'rgba(0,255,255,0.10)';
        for (let y = 70; y < this.canvas.height; y += 14) {
          for (let x = 0; x < this.canvas.width; x += 14) {
            if (((x + y) % 28) === 0) ctx.fillRect(x, y, 2, 2);
          }
        }

        // palmeiras neon (contorno)
        ctx.strokeStyle = 'rgba(255,0,255,0.80)';
        ctx.lineWidth = 3;
        const base = -(this.cameraX * 0.20) % 700;
        for (let i = 0; i < 4; i++) {
          const px = base + i * 200 + 60;
          ctx.beginPath();
          ctx.moveTo(px, 420);
          ctx.lineTo(px + 14, 290);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(px + 14, 290);
          ctx.lineTo(px - 16, 270);
          ctx.lineTo(px + 2, 260);
          ctx.lineTo(px + 22, 270);
          ctx.closePath();
          ctx.stroke();
        }

        // estátuas (dourado antigo) quebradas no fundo
        ctx.fillStyle = 'rgba(212,175,55,0.35)';
        for (let i = 0; i < 3; i++) {
          const sx = 120 + i * 240;
          ctx.fillRect(sx, 260, 60, 110);
          ctx.clearRect(sx + 6, 312, 14, 12);
          ctx.fillRect(sx + 18, 236, 26, 26);
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.fillRect(sx + 10, 350, 18, 20);
          ctx.fillStyle = 'rgba(212,175,55,0.35)';
        }
      }

      // -----------------------------
      // AURORA AERO (parte do ciclo de estéticas; em 99 fases o mapping é estendido)
      // -----------------------------
      else if (isAurora) {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#191970');
        grd.addColorStop(1, '#000010');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // estrelas
        ctx.fillStyle = 'rgba(255,215,0,0.75)';
        for (let i = 0; i < 60; i++) {
          const sx = (i * 37 + (this.cameraX * 0.05)) % this.canvas.width;
          const sy = (i * 19) % 220;
          const s = (i % 3) + 1;
          ctx.fillRect(sx, sy, s, s);
        }

        // aurora (ondas coloridas)
        const wave = (baseY, amp, color, speed) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = 4;
          ctx.beginPath();
          for (let x = 0; x <= this.canvas.width; x += 10) {
            const t = (performance.now() * 0.001 * speed) + x * 0.03;
            const y = baseY + Math.sin(t) * amp;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        };
        wave(120, 16, 'rgba(127,255,0,0.28)', 1.0);
        wave(140, 18, 'rgba(255,105,180,0.22)', 0.9);
        wave(160, 14, 'rgba(148,0,211,0.18)', 0.8);

        // planetas
        ctx.fillStyle = 'rgba(148,0,211,0.20)';
        ctx.beginPath();
        ctx.arc(680, 110, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.beginPath();
        ctx.arc(702, 96, 18, 0, Math.PI * 2);
        ctx.fill();

        // naves passando
        const shipX = ((-this.cameraX * 0.40) + (performance.now() * 0.05)) % (this.canvas.width + 220) - 110;
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.beginPath();
        ctx.moveTo(shipX, 210);
        ctx.lineTo(shipX + 34, 198);
        ctx.lineTo(shipX + 68, 210);
        ctx.lineTo(shipX + 34, 222);
        ctx.closePath();
        ctx.fill();
      }

      // -----------------------------
      // WINDOWS VISTA (aparece no Modo Livre)
      // -----------------------------
      else if (isVista) {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#4169E1');
        grd.addColorStop(1, '#0078D7');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // brilho "Aero Glass"
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.arc(620, 80, 140, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }

      // -----------------------------
      // Fallback antigo (caso algum caller ainda mande themeId legado)
      // -----------------------------
      else if (themeId === 'japan') {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#ffb6d5');
        grd.addColorStop(1, '#ffeef6');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Fuji
        const par = -(this.cameraX * 0.15) % 900;
        ctx.fillStyle = 'rgba(210, 120, 170, 0.45)';
        ctx.beginPath();
        ctx.moveTo(par + 180, 380);
        ctx.lineTo(par + 320, 210);
        ctx.lineTo(par + 460, 380);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.moveTo(par + 320, 210);
        ctx.lineTo(par + 290, 250);
        ctx.lineTo(par + 350, 250);
        ctx.closePath();
        ctx.fill();

        // Templo/torii distante
        ctx.fillStyle = 'rgba(192, 57, 43, 0.4)';
        for (let i = 0; i < 4; i++) {
          const x = (par + i * 240 + 60) % (this.canvas.width + 100);
          ctx.fillRect(x, 320, 6, 60);
          ctx.fillRect(x + 26, 320, 6, 60);
          ctx.fillRect(x - 8, 315, 48, 8);
        }

        this._updateSakura();
        this._drawSakura();

        // lanternas distantes
        ctx.fillStyle = 'rgba(255,210,125,0.28)';
        for (let i = 0; i < 6; i++) {
          const lx = ((par + 120 + i * 170) % (this.canvas.width + 140)) - 40;
          const ly = 250 + (i % 3) * 18;
          ctx.fillRect(lx, ly, 10, 14);
        }

      } else if (themeId === 'fruitiger') {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#a1d9ff');
        grd.addColorStop(1, '#eaf7ff');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // nuvens fofas + aviões de papel
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        const base = -(this.cameraX * 0.22) % 900;
        for (let i = 0; i < 7; i++) {
          const x = base + i * 160;
          const y = 60 + (i % 3) * 24;
          ctx.beginPath();
          ctx.arc(x + 20, y, 16, 0, Math.PI * 2);
          ctx.arc(x + 40, y - 10, 18, 0, Math.PI * 2);
          ctx.arc(x + 60, y, 16, 0, Math.PI * 2);
          ctx.fill();

          // avião
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 90, y + 25);
          ctx.lineTo(x + 110, y + 18);
          ctx.lineTo(x + 100, y + 35);
          ctx.closePath();
          ctx.stroke();
        }

        // orbs/bolhas glossy (Fruitiger)
        for (let i = 0; i < 10; i++) {
          const ox = ((this.cameraX * 0.28) + i * 110) % (this.canvas.width + 160) - 40;
          const oy = 110 + (i % 4) * 40;
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.beginPath();
          ctx.arc(ox, oy, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.beginPath();
          ctx.arc(ox - 6, oy - 6, 6, 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (themeId === 'tecnozen') {
        ctx.fillStyle = '#08111b';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // circuitos neon
        ctx.strokeStyle = 'rgba(35,213,255,0.7)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 9; i++) {
          const x = ((i * 120) + (this.cameraX * 0.25)) % this.canvas.width;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, this.canvas.height);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(166,107,255,0.55)';
        for (let i = 0; i < 6; i++) {
          const y = (i * 70 + 30);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(this.canvas.width, y);
          ctx.stroke();
        }

        // lotus/círculos zen neon
        ctx.strokeStyle = 'rgba(35,213,255,0.25)';
        ctx.lineWidth = 2;
        const cx = this.canvas.width * 0.5;
        const cy = 220;
        for (let r = 40; r <= 120; r += 20) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }

      } else if (themeId === 'dorfic') {
        ctx.fillStyle = '#0f1410';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // silhuetas góticas
        ctx.fillStyle = 'rgba(60,110,71,0.35)';
        const base = -(this.cameraX * 0.18) % 900;
        for (let i = 0; i < 5; i++) {
          const x = base + i * 240;
          ctx.fillRect(x + 60, 260, 80, 140);
          ctx.fillRect(x + 90, 220, 20, 40);
          ctx.fillRect(x + 80, 240, 40, 10);
        }

        // névoa
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        for (let i = 0; i < 6; i++) {
          const fx = ((this.cameraX * 0.12) + i * 160) % (this.canvas.width + 200) - 80;
          ctx.beginPath();
          ctx.arc(fx, 360, 70, 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (themeId === 'metro') {
        ctx.fillStyle = '#0b1320';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // trilhos
        ctx.strokeStyle = 'rgba(192,200,209,0.55)';
        ctx.lineWidth = 3;
        const base = -(this.cameraX * 0.45) % 120;
        for (let i = 0; i < 10; i++) {
          const x = base + i * 120;
          ctx.beginPath();
          ctx.moveTo(x, 360);
          ctx.lineTo(x + 40, 420);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(74,163,255,0.6)';
        ctx.beginPath();
        ctx.moveTo(0, 330);
        ctx.lineTo(this.canvas.width, 330);
        ctx.stroke();

        // trem distante (parallax)
        const tx = ((-this.cameraX * 0.55) % (this.canvas.width + 260)) + this.canvas.width;
        ctx.fillStyle = 'rgba(192,200,209,0.25)';
        ctx.fillRect(tx - 260, 250, 220, 34);
        ctx.fillStyle = 'rgba(74,163,255,0.35)';
        for (let i = 0; i < 6; i++) ctx.fillRect(tx - 240 + i * 34, 258, 18, 10);

      } else if (themeId === 'evil') {
        const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, '#2b000a');
        grd.addColorStop(1, '#000000');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // nuvens tempestuosas
        ctx.fillStyle = 'rgba(80,0,20,0.65)';
        const base = -(this.cameraX * 0.22) % 900;
        for (let i = 0; i < 7; i++) {
          const x = base + i * 160;
          const y = 75 + (i % 3) * 20;
          ctx.beginPath();
          ctx.arc(x + 20, y, 18, 0, Math.PI * 2);
          ctx.arc(x + 45, y - 8, 20, 0, Math.PI * 2);
          ctx.arc(x + 70, y, 18, 0, Math.PI * 2);
          ctx.fill();
        }

        // relâmpagos ocasionais
        if ((Math.floor(performance.now() / 300) % 9) === 0) {
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(520, 30);
          ctx.lineTo(480, 120);
          ctx.lineTo(520, 120);
          ctx.lineTo(470, 210);
          ctx.stroke();
        }

      } else {
        // MemeFusion: mistura (sakura + neon + gradiente)
        const grd = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        grd.addColorStop(0, '#ffb6d5');
        grd.addColorStop(0.5, '#23d5ff');
        grd.addColorStop(1, '#ffd27d');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this._updateSakura();
        this._drawSakura();

        // glitch blocks
        ctx.fillStyle = 'rgba(0,0,0,0.10)';
        for (let i = 0; i < 8; i++) {
          const gx = ((this.cameraX * 0.33) + i * 120) % (this.canvas.width + 200) - 60;
          ctx.fillRect(gx, 90 + (i % 4) * 40, 60, 12);
        }
      }

      if (darken > 0) {
        ctx.fillStyle = `rgba(0,0,0,${darken})`;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    _updateGame(now) {
      const level = this._getLevel();
      let diff = SuperBario99.difficulty.getDifficulty(this.levelIndex);
      const themeId = level.themeId;
      const bossLevel = this._isBossLevel(this.levelIndex);
      const tNow = (typeof now === 'number') ? now : performance.now();

      // Determina estética efetiva aqui também (NPCs/lore)
      const effAesthetic = this._getEffectiveAestheticId(level, tNow);

      // Atualiza NPCs sempre (mesmo se diálogo aberto, para manter virado/bob)
      this._updateNpcs(tNow, effAesthetic);

      // aplica ajustes de clima (agressividade/velocidade)
      try { diff = this.weatherSystem?.applyDifficulty?.(diff, this._weather) || diff; } catch (_) {}

      const active = this.powerups?.getActive?.(tNow);
      const timeSlow = (active === 'time' || active === 'cosmic');
      const timeScale = timeSlow ? 0.55 : 1.0;
      const diffScaled = timeSlow ? { ...diff, enemySpeed: diff.enemySpeed * timeScale } : diff;

      // Ninja invisível: além de visual, vira invulnerável enquanto durar.
      // Reusa a mecânica existente de invencibilidade do player para não quebrar inimigos/hazards.
      if (this.player && this.powerups?.isPlayerInvisible?.(tNow)) {
        const cur = this.player.invincibleTime || 0;
        if (cur < 2) this.player.invincibleTime = 2;
      }

      // efeitos de gameplay por clima
      const weatherType = this._weather?.type || 'none';
      const sandScale = (weatherType === 'sand') ? 0.85 : 1.0; // -15% no deserto
      let puddleScale = 1.0;
      try { puddleScale = this.weatherSystem?.getSpeedScaleForPlayer?.(this.player, this._weather, tNow) || 1.0; } catch (_) {}
      const playerSpeedScale = Math.min(sandScale, puddleScale);

      // Gamepad (polled)
      if (this._gamepadEnabled) {
        const pads = navigator.getGamepads ? navigator.getGamepads() : null;
        const pad = pads && pads[0];
        if (pad) {
          const ax = pad.axes && pad.axes.length ? pad.axes[0] : 0;
          this._gamepadState.left = ax < -0.25;
          this._gamepadState.right = ax > 0.25;

          // A / B / X -> pulo; Y / RB -> ataque
          this._gamepadState.jump = !!(pad.buttons?.[0]?.pressed || pad.buttons?.[1]?.pressed || pad.buttons?.[2]?.pressed);
          this._gamepadState.attack = !!(pad.buttons?.[3]?.pressed || pad.buttons?.[5]?.pressed);
        } else {
          this._gamepadState.left = false;
          this._gamepadState.right = false;
          this._gamepadState.jump = false;
          this._gamepadState.attack = false;
        }
      }

      // Mescla teclado/touch + gamepad (sem grudar estado)
      const input = {
        ArrowLeft: !!this.keys['ArrowLeft'] || this._gamepadState.left,
        ArrowRight: !!this.keys['ArrowRight'] || this._gamepadState.right,
        ArrowUp: !!this.keys['ArrowUp'] || this._gamepadState.jump,
        ' ': !!this.keys[' '] || this._gamepadState.jump,
        x: !!this.keys['x'] || !!this.keys['X'] || this._gamepadState.attack,
        X: !!this.keys['x'] || !!this.keys['X'] || this._gamepadState.attack
      };

      // Edge detect (evita pular linhas em hold)
      const prev = this._prevInput || { ArrowUp: false, space: false, x: false };
      const justUp = input.ArrowUp && !prev.ArrowUp;
      const justSpace = input[' '] && !prev.space;
      const justX = (input.x || input.X) && !prev.x;

      // Se diálogo ativo: pausa gameplay e só avança texto
      if (this._dialogue && this._dialogue.active) {
        if (justUp || justSpace || justX) this._advanceDialogue(tNow);
        this._cameraUpdate(level);
        this._prevInput = { ArrowUp: !!input.ArrowUp, space: !!input[' '], x: !!(input.x || input.X) };
        this._updateHud();
        return;
      }

      // Interação: perto de NPC, ↑ (ou X no mobile) inicia diálogo.
      const canTalk = this._nearNpc && this._nearNpc.isNear?.(this.player);
      if (canTalk && (justUp || (justX && this._isTouchDevice()))) {
        this._startDialogue(this._nearNpc, tNow);
        this._prevInput = { ArrowUp: !!input.ArrowUp, space: !!input[' '], x: !!(input.x || input.X) };
        this._updateHud();
        return;
      }

      // Spawn via portal: trava gameplay por um instante e só anima o portal.
      if (this._isSpawnPortalActive(tNow)) {
        try {
          const sp = this._spawnPortal;
          if (sp && this.player) {
            this.player.vx = 0;
            this.player.vy = 0;
            this.player.onGround = true;
            // mantém o player “ancorado” no ponto base (draw faz o emerge)
            this.player.x = sp.x;
            this.player.y = sp.baseY;
          }
        } catch (_) {}

        this._cameraUpdate(level);
        this._updateParticles();
        this.audio.update();
        this._updateHud();
        this._prevInput = { ArrowUp: !!input.ArrowUp, space: !!input[' '], x: !!(input.x || input.X) };
        return;
      } else if (this._spawnPortal && this._spawnPortal.active) {
        // encerra portal
        this._spawnPortal = null;
      }

      // ações
      if (input[' '] || input['ArrowUp']) this.player.jump(this.audio);
      if (input['x'] || input['X']) {
        const dir = (this.player.direction === 'left') ? -1 : 1;
        const canFire = (active === 'fire' || active === 'cosmic') && this.powerups?.canShootFire?.(tNow);
        const canIce = (active === 'ice' || active === 'cosmic') && this.powerups?.canShootIce?.(tNow);

        if (canFire && SuperBario99.Projectile) {
          this.powerups.markFireShot(tNow);
          this.audio.playSfx('fireShot');
          this.projectiles.push(new SuperBario99.Projectile({
            x: this.player.x + this.player.width / 2 + dir * 18,
            y: this.player.y + 22,
            vx: dir * 8.5,
            vy: -1.2,
            kind: 'fire',
            bornAt: tNow
          }));
        } else if (canIce && SuperBario99.Projectile) {
          this.powerups.markIceShot(tNow);
          // sfx de ativação de gelo já existe; serve como tiro leve
          this.audio.playSfx('ice');
          this.projectiles.push(new SuperBario99.Projectile({
            x: this.player.x + this.player.width / 2 + dir * 18,
            y: this.player.y + 22,
            vx: dir * 7.0,
            vy: -0.6,
            kind: 'ice',
            bornAt: tNow
          }));
        } else {
          this.player.attack(this.audio);
        }
      }

      this.player.update(this.gravity, level, input, this.canvas.height, this.audio, tNow, { speedScale: playerSpeedScale });

      // câmera
      this._cameraUpdate(level);

      // clima (update antes de desenhar)
      try {
        const groundY = this._getGroundY(level);
        const effAesthetic = this._getEffectiveAestheticId(level, tNow);
        this.weatherSystem?.update?.(this.canvas, this._weather, tNow, { groundY, cameraX: this.cameraX, audio: this.audio, aestheticId: effAesthetic });
      } catch (_) {}

      // blocos (animação de bump)
      if (level.blocks) {
        for (const b of level.blocks) b.update?.();
      }

      // itens (engrenagens)
      if (level.items && level.items.length) {
        for (const it of level.items) {
          it.update?.(this.gravity, level);
          if (it.checkCollision?.(this.player)) {
            this.powerups?.activate?.(it.powerType, tNow, this.player, this.audio);
          }
        }
        level.items = level.items.filter((it) => !it.collected);
      }

      // projéteis (fire/ice)
      if (this.projectiles && this.projectiles.length) {
        for (const pr of this.projectiles) {
          pr.update?.(this.gravity, level, tNow, timeScale);
        }
        this.projectiles = this.projectiles.filter((p) => p && p.alive);
      }

      // obstáculos
      if (level.hazards && level.hazards.length) {
        for (const hz of level.hazards) {
          hz.update?.(tNow, timeScale);
          if (hz.checkCollision?.(this.player)) {
            this.player.takeHit?.();
            this.audio.playSfx('hurt');
          }
        }
      }

      // moedas
      for (const c of level.coins) {
        if (c.checkCollision(this.player)) {
          this.audio.playSfx('coin');
        }
      }

      // objetivo
      for (const g of level.goals) {
        // BUG CRÍTICO (boss): se chamar g.checkCollision(), ele marca reached=true.
        // Em fase de boss, só checa/ativa a meta quando o boss estiver morto.
        if (bossLevel && this.enemies && this.enemies.some((e) => e.type === 'boss' && e.alive)) {
          const colliding = (
            this.player.x < g.x + g.width &&
            this.player.x + this.player.width > g.x &&
            this.player.y < g.y + g.height &&
            this.player.y + this.player.height > g.y
          );
          if (colliding) {
            this.player.x = Math.max(0, this.player.x - 20);
          }
          continue;
        }

        if (!g.checkCollision(this.player)) continue;

        this.levelIndex++;
        if (this.levelIndex >= (this.levels ? this.levels.length : 50)) {
          this._end(true);
          return;
        }

        // preserva score/vidas
        const score = this.player.score;
        const lives = this.player.lives;
        // nova seed a cada fase (layout novo)
        this.levelSeed = this._makeSeed();
        this._regenLevelForCurrentSeed();

        {
          const nextLevel = this._getLevel();
          const sp = this._getPlayerSpawnPoint(nextLevel, 60, 32, 52);
          this.player = new SuperBario99.PlayerV2(sp.x, sp.y);
          this.player.score = score;
          this.player.lives = lives;
          this._beginSpawnPortal(nextLevel, tNow);
        }

        this._saveProgress(); // modo principal apenas

        this._setThemeForLevel();
        this.audio.playMusic();
        this._gridCacheLevelIndex = -1;
        this.enemies = this._buildEnemiesForLevel(this.levelIndex);
        this._buildNpcsForLevel(this.levelIndex);
        this._dialogue = null;

        this._queuePhaseIntro();

        this._nextAutosaveAt = tNow + 30000;

        // IMPORTANTÍSSIMO: encerra o frame aqui.
        // Senão, o restante do update ainda usa `level` antigo e dá bugs/soft-lock.
        return;
      }

      // inimigos
      if (!this.enemies) this.enemies = this._buildEnemiesForLevel(this.levelIndex);

      // hitbox ataque
      const hit = this.player.getAttackHitbox();

      const spawnAdds = [];

      for (const e of this.enemies) {
        if (!e.alive) continue;

        // Congelado: pausa IA/movimento por alguns segundos
        if (e._sb99FreezeUntil && tNow < e._sb99FreezeUntil) {
          // não atualiza
        } else if (e.type === 'yokai') {
          // Yokai usa A* em tiers superiores
          this._ensureGridForLevel(this.levelIndex);
          e.update(level, this.player, diffScaled, this.canvas.height);
        } else {
          e.update(level, this.player, diffScaled);
        }

        // Boss pode solicitar spawn de minions
        if (e.type === 'boss' && e._sb99SpawnRequests && e._sb99SpawnRequests.length) {
          for (const req of e._sb99SpawnRequests) {
            const kind = String(req.kind || 'drone');
            const x = Number(req.x);
            const y = Number(req.y);
            if (!isFinite(x) || !isFinite(y)) continue;

            if (kind === 'ninja' && SuperBario99.NinjaEnemy) spawnAdds.push(new SuperBario99.NinjaEnemy(x, y));
            else if (kind === 'yokai' && SuperBario99.YokaiEnemy) spawnAdds.push(new SuperBario99.YokaiEnemy(x, y));
            else if (kind === 'samurai' && SuperBario99.SamuraiEnemy) spawnAdds.push(new SuperBario99.SamuraiEnemy(x, y));
            else if (kind === 'tanuki' && SuperBario99.TanukiEnemy) spawnAdds.push(new SuperBario99.TanukiEnemy(x, y));
            else if (kind === 'kitsune' && SuperBario99.KitsuneEnemy) spawnAdds.push(new SuperBario99.KitsuneEnemy(x, y));
            else if (SuperBario99.DroneEnemy) spawnAdds.push(new SuperBario99.DroneEnemy(x, y));
          }
          e._sb99SpawnRequests.length = 0;
        }

        // dano do player
        if (hit) {
          if (
            hit.x < e.x + e.width &&
            hit.x + hit.width > e.x &&
            hit.y < e.y + e.height &&
            hit.y + hit.height > e.y
          ) {
            if (e.type === 'boss') {
              e.takeDamage?.(1, { kind: 'melee' });
              this.audio.playSfx('bossHit');
              this.player.score += 45;
            } else {
              e.takeDamage?.();
              this.audio.playSfx('enemyDie');
              this.player.score += 80;
            }
          }
        }

        // colisão do inimigo com player
        const collided = e.checkPlayerCollision(this.player);
        if (collided) {
          this.audio.playSfx(e.type === 'boss' ? 'bossHit' : 'enemyDie');
        }

        // Aura elétrica: dano por proximidade
        if ((active === 'electric' || active === 'cosmic') && !this.powerups?.isPlayerInvisible?.(tNow)) {
          const cx = this.player.x + this.player.width / 2;
          const cy = this.player.y + this.player.height / 2;
          const ex = e.x + e.width / 2;
          const ey = e.y + e.height / 2;
          const dx = cx - ex;
          const dy = cy - ey;
          const d2 = dx * dx + dy * dy;
          if (d2 < 46 * 46) {
            const nextAt = e._sb99ZapAt || 0;
            if (tNow >= nextAt) {
              e._sb99ZapAt = tNow + 460;
              if (e.type === 'boss') {
                e.takeDamage?.(1, { kind: (active === 'electric') ? 'electric' : 'cosmic' });
                this.player.score += 35;
              } else {
                e.takeDamage?.();
                this.player.score += 55;
              }
              this.audio.playSfx('electricZap');
            }
          }
        }
      }

      if (spawnAdds.length) {
        // adiciona depois do loop para evitar comportamento estranho
        this.enemies.push(...spawnAdds);
      }

      // projéteis acertando inimigos (fire dá dano; ice congela)
      if (this.projectiles && this.projectiles.length && this.enemies) {
        for (const pr of this.projectiles) {
          if (!pr.alive) continue;
          for (const e of this.enemies) {
            if (!e.alive) continue;
            if (!pr.intersectsAabb?.(e)) continue;

            if (pr.kind === 'ice') {
              if (e.type === 'boss') {
                // Boss: gelo causa dano leve + congelamento curto (evita trivializar)
                e.takeDamage?.(1, { kind: 'ice' });
                e._sb99FreezeUntil = tNow + 2200;
                this.audio.playSfx('iceFreeze');
                this.player.score += 25;
                pr.alive = false;
                break;
              } else {
                e._sb99FreezeUntil = tNow + 5000;
                this.audio.playSfx('iceFreeze');
                pr.alive = false;
                break;
              }
            }

            // fire
            if (e.type === 'boss') {
              e.takeDamage?.(1, { kind: 'fire' });
              this.audio.playSfx('bossHit');
              this.player.score += 35;
            } else {
              e.takeDamage?.();
              this.audio.playSfx('enemyDie');
              this.player.score += 80;
            }
            pr.alive = false;
            break;
          }
        }
        this.projectiles = this.projectiles.filter((p) => p && p.alive);
      }

      // Salva imediatamente quando vidas mudarem
      if (this._lastLives !== this.player.lives) {
        this._lastLives = this.player.lives;
        this._saveProgress();
        this._nextAutosaveAt = tNow + 30000;
      }

      if (this.player.lives <= 0) {
        return this._end(false);
      }

      // Autosave a cada 30s
      if (tNow && tNow >= this._nextAutosaveAt) {
        this._saveProgress();
        this._nextAutosaveAt = tNow + 30000;
      }

      // partículas
      this._updateParticles();
      this.audio.update();
      this._updateHud();

      this._prevInput = { ArrowUp: !!input.ArrowUp, space: !!input[' '], x: !!(input.x || input.X) };
    }

    _drawGame() {
      const level = this._getLevel();
      const diff = SuperBario99.difficulty.getDifficulty(this.levelIndex);

      // AestheticId efetivo (fase ou override do Modo Livre)
      const tNow = performance.now();
      const aestheticId = this._getEffectiveAestheticId(level, tNow);

      // Intensidade de efeito (Modo Livre)
      const effectIntensity = (this._isFreeMode && this._freeConfig && typeof this._freeConfig.effectIntensity === 'number')
        ? this._freeConfig.effectIntensity
        : 1;

      // Background passa a ser baseado na estética
      this._renderBackground(aestheticId, diff.nightMode);

      // clima (camada de fundo): afeta a fase inteira “por trás”
      try { this.weatherSystem?.draw?.(this.ctx, this.canvas, this.cameraX, aestheticId, this._weather, tNow, 'back'); } catch (_) {}

      // cenário (decorativo)
      try { this.sceneryBuilder?.draw?.(this.ctx, this.cameraX, aestheticId, this._scenery); } catch (_) {}

      // plataformas, moedas, goal (por estética)
      for (const p of level.platforms) p.draw(this.ctx, this.cameraX, aestheticId);
      for (const c of level.coins) c.draw(this.ctx, this.cameraX, aestheticId);
      for (const g of level.goals) g.draw(this.ctx, this.cameraX, aestheticId);

      // poças (chuva/temporal) — por cima do chão, antes dos personagens
      try { this.weatherSystem?.drawPuddles?.(this.ctx, this.canvas, this.cameraX, aestheticId, this._weather, tNow); } catch (_) {}

      // obstáculos
      if (level.hazards) {
        for (const hz of level.hazards) hz.draw?.(this.ctx, this.cameraX, aestheticId);
      }

      // itens (engrenagens)
      if (level.items) {
        for (const it of level.items) it.draw?.(this.ctx, this.cameraX, performance.now());
      }

      // NPCs (humano) + prompt quando perto
      if (this.npcs && this.npcs.length) {
        for (const npc of this.npcs) {
          const showPrompt = (this._nearNpc && npc === this._nearNpc && !(this._dialogue && this._dialogue.active));
          npc.draw?.(this.ctx, this.cameraX, showPrompt, aestheticId);
        }
      }

      // inimigos (visual segue estética; IA/música seguem themeId no update/spawn)
      if (this.enemies) {
        for (const e of this.enemies) {
          if (!e.alive) continue;

          // sombra no chão (melhora leitura/estética)
          try {
            const sx = (e.x - this.cameraX) + e.width / 2;
            const sy = e.y + e.height;
            const sw = Math.max(10, e.width * 0.65);
            const sh = Math.max(4, e.height * 0.14);
            this.ctx.save();
            this.ctx.globalAlpha = 0.18;
            this.ctx.fillStyle = 'rgba(0,0,0,1)';
            this.ctx.translate(sx, sy);
            this.ctx.scale(sw / 2, sh / 2);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 1, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
          } catch (_) {}

          // aura sutil por estética (novo visual)
          try {
            let glow = 'rgba(255,255,255,0.06)';
            if (aestheticId === 'evil') glow = 'rgba(255,59,47,0.06)';
            else if (aestheticId === 'tecno-zen' || aestheticId === 'tecnozen') glow = 'rgba(35,213,255,0.06)';
            else if (aestheticId === 'metro-aero' || aestheticId === 'metro') glow = 'rgba(74,163,255,0.06)';
            else if (aestheticId === 'vaporwave') glow = 'rgba(255,0,255,0.06)';
            else if (aestheticId === 'aurora-aero') glow = 'rgba(127,255,0,0.05)';
            else if (aestheticId === 'fruitiger-aero' || aestheticId === 'fruitiger') glow = 'rgba(111,231,255,0.06)';
            else if (aestheticId === 'windows-xp') glow = 'rgba(0,85,229,0.05)';
            else if (aestheticId === 'windows-vista') glow = 'rgba(0,120,215,0.05)';

            const gx = (e.x - this.cameraX) - 3;
            const gy = e.y - 3;
            this.ctx.save();
            this.ctx.fillStyle = glow;
            this.ctx.fillRect(gx, gy, e.width + 6, e.height + 6);
            this.ctx.restore();
          } catch (_) {}

          // congelado: desenha com “casca” de gelo
          if (e._sb99FreezeUntil && performance.now() < e._sb99FreezeUntil) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.92;
            e.draw(this.ctx, this.cameraX, aestheticId);
            const x = e.x - this.cameraX;
            this.ctx.fillStyle = 'rgba(0,191,255,0.15)';
            this.ctx.fillRect(x - 2, e.y - 2, e.width + 4, e.height + 4);
            this.ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x - 2, e.y - 2, e.width + 4, e.height + 4);
            this.ctx.restore();
          } else {
            e.draw(this.ctx, this.cameraX, aestheticId);
          }
        }
      }

      // partículas
      this._drawParticles();

      // portal de spawn (antes do player)
      this._drawSpawnPortal(aestheticId, tNow);

      // player (por estética para casar com atmosfera)
      if (this._spawnPortal && this._spawnPortal.active) {
        const sp = this._spawnPortal;
        const tt = Math.max(0, Math.min(1, (tNow - sp.startedAt) / Math.max(1, sp.duration)));
        const easeOut = (u) => 1 - Math.pow(1 - u, 3);
        const p = easeOut(tt);
        const appear = Math.max(0, Math.min(1, (p - 0.10) / 0.60));
        const emerge = (1 - p) * 70;

        const savedY = this.player.y;
        this.player.y = sp.baseY + emerge;

        // clip para parecer que sai do portal
        const ctx = this.ctx;
        const px = this.player.x - this.cameraX;
        const clipH = Math.max(8, this.player.height * p);
        const clipY = sp.groundY - clipH;

        ctx.save();
        ctx.globalAlpha = appear;
        ctx.beginPath();
        ctx.rect(px - 10, clipY - 6, this.player.width + 20, clipH + 18);
        ctx.clip();
        this.player.draw(ctx, this.cameraX, aestheticId, this.powerups);
        ctx.restore();

        this.player.y = savedY;
      } else {
        this.player.draw(this.ctx, this.cameraX, aestheticId, this.powerups);
      }

      // projéteis (fire/ice)
      if (this.projectiles && this.projectiles.length) {
        for (const pr of this.projectiles) pr.draw?.(this.ctx, this.cameraX, performance.now());
      }

      // overlays (scanlines/glitch/soft glow etc.)
      if (SuperBario99.themes && SuperBario99.themes.drawOverlay) {
        SuperBario99.themes.drawOverlay(this.ctx, this.canvas, aestheticId, tNow, effectIntensity);
      }

      // clima (camada da frente)
      try { this.weatherSystem?.draw?.(this.ctx, this.canvas, this.cameraX, aestheticId, this._weather, tNow, 'front'); } catch (_) {}

      // HUD do boss (nome + vida)
      this._drawBossHud?.(tNow);

      // popup de comandos (início da fase)
      this._drawPhaseIntro();

      // diálogo (overlay no canvas)
      this._drawDialogueHud(aestheticId);

      // Karma (simples): bônus por stomp em vez de desviar (mostrado como texto)
      this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Karma: ${Math.floor(this.player.score / 250)}`, 20, 402);
    }

    _drawBossHud(nowMs) {
      if (!this.enemies || !this.enemies.length) return;
      const boss = this.enemies.find((e) => e && e.type === 'boss' && e.alive);
      if (!boss) return;

      const ctx = this.ctx;
      const name = boss.bossName || 'BOSS';
      const hp = Math.max(0, Number(boss.hp || 0));
      const maxHp = Math.max(1, Number(boss.maxHp || 1));
      const ratio = Math.max(0, Math.min(1, hp / maxHp));

      const w = 360;
      const h = 34;
      const x = Math.floor((this.canvas.width - w) / 2);
      const y = 14;

      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x, y, w, h);

      // nome
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = '14px Arial';
      ctx.fillText(name, x + 10, y + 14);

      // barra
      const barX = x + 10;
      const barY = y + 18;
      const barW = w - 20;
      const barH = 10;
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = 'rgba(255,70,70,0.78)';
      ctx.fillRect(barX, barY, Math.floor(barW * ratio), barH);
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);
      ctx.restore();
    }

    _drawMenuPreview() {
      // Mostra prévia de estéticas no fundo do menu
      const previewThemes = ['windows-xp', 'fruitiger-aero', 'tecno-zen', 'dorfic', 'metro-aero', 'vaporwave', 'aurora-aero'];
      this.previewTimer++;
      if (this.previewTimer > 220) {
        this.previewTimer = 0;
        this.previewThemeIndex = (this.previewThemeIndex + 1) % previewThemes.length;
      }

      const themeId = previewThemes[this.previewThemeIndex];
      const night = (this.previewThemeIndex % 2 === 1);
      this._renderBackground(themeId, night);

      // desenha um "mini layout" genérico no preview
      const ctx = this.ctx;
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 380, this.canvas.width, 70);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(80 + i * 120, 320 - (i % 3) * 40, 90, 16);
      }

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '18px Arial';
      ctx.fillText(`Preview: ${themeId.toUpperCase()}`, 18, 28);
    }

    _loop(now) {
      if (this.running && this.player) {
        this._updateGame(now);
        if (this.running) this._drawGame();
      } else {
        // Menu/instruções: preview no fundo
        this._drawMenuPreview();
        this.audio.update();
      }

      requestAnimationFrame((t) => this._loop(t));
    }
  }

  SuperBario99.GameV2 = GameV2;
})();
