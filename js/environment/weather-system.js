// Weather System (v2)
// Implementação leve: chuva/neve/tempestade/areia com partículas simples em Canvas.

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const util = SuperBario99.util;

  function normalizeAestheticId(id) {
    const v0 = String(id || 'japan').toLowerCase();
    if (v0 === 'japan-retro') return 'japan';
    if (v0 === 'fruitiger-aero') return 'fruitiger';
    if (v0.startsWith('fruitiger-')) return 'fruitiger';
    if (v0 === 'metro-aero') return 'metro';
    if (v0 === 'tecno-zen') return 'tecnozen';
    if (v0 === 'windows-xp') return 'windows-xp';
    if (v0 === 'windows-vista') return 'windows-vista';
    return v0;
  }

  function pickWeighted(rng, items) {
    const total = items.reduce((a, it) => a + it.w, 0);
    let r = (rng ? rng() : Math.random()) * total;
    for (const it of items) {
      r -= it.w;
      if (r <= 0) return it.v;
    }
    return items[0].v;
  }

  class WeatherSystem {
    constructor() {
      this.current = 'none';
      this.intensity = 0;
      this._particles = [];

      // Partículas de fundo (neblina/haze)
      this._backParticles = [];

      // Efeitos de tempestade
      this._flashUntil = 0;
      this._nextLightningAt = 0;
      this._pendingThunderAt = 0;

      // Respingos (chuva)
      this._splashes = [];

      // Poças (chuva/temporal) em coordenadas do mundo
      this._puddles = [];
      this._nextPuddleAt = 0;

      // “Lente molhada” (overlay em coordenadas de tela)
      this._lensDrops = [];

      // Controle de variação da ambiência
      this._nextAmbienceAt = 0;

      // Overlay fullscreen (chuva 100% da tela)
      this._screenCanvas = null;
      this._screenCtx = null;
      this._screenCssW = 0;
      this._screenCssH = 0;
      this._screenDpr = 1;
      this._screenHostEl = null;
      this._screenAnchorCanvas = null;
      this._screenCurrent = 'none';
      this._screenIntensity = 0;
      this._screenParticles = [];
      this._screenSplashes = [];
      this._screenLensDrops = [];
      this._didBindScreenResize = false;
    }

    _ensureScreenOverlay(gameCanvas) {
      if (this._screenCanvas && this._screenCtx) return;
      if (typeof document === 'undefined') return;
      const c = document.createElement('canvas');
      c.className = 'sb99-weather-overlay';
      c.style.position = 'absolute';
      c.style.left = '0';
      c.style.top = '0';
      c.style.width = '100%';
      c.style.height = '100%';
      c.style.pointerEvents = 'none';
      // acima do canvas, abaixo do HUD (por DOM order)
      c.style.zIndex = '1';
      c.style.background = 'transparent';

      // evita blur/anti-alias forçado em alguns navegadores
      c.style.imageRendering = 'auto';

      const host = document.getElementById('game-container') || (document.body || document.documentElement);
      this._screenHostEl = host;
      this._screenAnchorCanvas = gameCanvas || document.getElementById('game-canvas') || null;

      // insere logo após o canvas, para o HUD continuar por cima
      if (host && this._screenAnchorCanvas && this._screenAnchorCanvas.parentNode === host) {
        host.insertBefore(c, this._screenAnchorCanvas.nextSibling);
      } else if (host) {
        host.appendChild(c);
      }

      const ctx = c.getContext('2d');
      this._screenCanvas = c;
      this._screenCtx = ctx;
      this._resizeScreenOverlay();

      if (!this._didBindScreenResize && typeof window !== 'undefined') {
        this._didBindScreenResize = true;
        window.addEventListener('resize', () => this._resizeScreenOverlay(), { passive: true });
        window.addEventListener('orientationchange', () => this._resizeScreenOverlay(), { passive: true });
      }
    }

    _resizeScreenOverlay() {
      if (!this._screenCanvas || !this._screenCtx) return;
      const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
      const host = this._screenHostEl || document.getElementById('game-container') || (document.body || document.documentElement);
      const rect = host?.getBoundingClientRect ? host.getBoundingClientRect() : null;
      const cssW = Math.max(1, rect ? rect.width : (host?.clientWidth || 1));
      const cssH = Math.max(1, rect ? rect.height : (host?.clientHeight || 1));

      this._screenDpr = dpr;
      this._screenCssW = cssW;
      this._screenCssH = cssH;

      const pxW = Math.max(1, Math.floor(cssW * dpr));
      const pxH = Math.max(1, Math.floor(cssH * dpr));

      if (this._screenCanvas.width !== pxW) this._screenCanvas.width = pxW;
      if (this._screenCanvas.height !== pxH) this._screenCanvas.height = pxH;

      // desenhar em coordenadas CSS (mais previsível)
      this._screenCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    _ensureScreenParticles(weather, gameCanvas) {
      const type = weather?.type || 'none';
      const intensity = weather?.intensity || 0;
      this._ensureScreenOverlay(gameCanvas);
      if (!this._screenCanvas || !this._screenCtx) return;
      this._resizeScreenOverlay();

      if (type === this._screenCurrent && Math.abs(intensity - this._screenIntensity) < 0.05 && this._screenParticles.length) return;

      this._screenCurrent = type;
      this._screenIntensity = intensity;
      this._screenParticles.length = 0;
      this._screenSplashes.length = 0;

      // lente molhada: só em chuva/temporal
      this._screenLensDrops.length = 0;

      if (type === 'none') return;

      const cssW = this._screenCssW || 1;
      const cssH = this._screenCssH || 1;
      const areaScale = Math.max(0.85, Math.min(2.5, (cssW * cssH) / (800 * 450)));

      const isSmall = Math.min(cssW, cssH) < 520;
      const cap = isSmall ? 620 : 1200;

      let count = Math.floor((90 + intensity * 520) * areaScale);
      if (type === 'snow') count = Math.floor((65 + intensity * 320) * areaScale);
      if (type === 'sand') count = Math.floor((95 + intensity * 420) * areaScale);
      count = Math.max(50, Math.min(cap, count));

      for (let i = 0; i < count; i++) {
        this._screenParticles.push({
          x: Math.random() * cssW,
          y: Math.random() * cssH,
          vx: 0,
          vy: 0,
          r: 1 + Math.random() * 2,
          a: 0.35 + Math.random() * 0.55
        });
      }

      if (type === 'rain' || type === 'storm') {
        const lensCount = Math.max(4, Math.min(12, Math.floor(5 + intensity * 9)));
        for (let i = 0; i < lensCount; i++) {
          this._screenLensDrops.push({
            x: Math.random() * cssW,
            y: Math.random() * cssH,
            r: 16 + Math.random() * 42,
            vy: 0.15 + Math.random() * 0.60,
            a: 0.06 + Math.random() * 0.09
          });
        }
      }
    }

    _drawScreenOverlay(weather, now, gameCanvas) {
      if (!weather) return;
      this._ensureScreenParticles(weather, gameCanvas);
      if (!this._screenCtx || !this._screenCanvas) return;

      const type = weather.type || 'none';
      const intensity = weather.intensity || 0;
      const t = (typeof now === 'number') ? now : performance.now();
      const w = this._screenCssW || 1;
      const h = this._screenCssH || 1;
      const ctx = this._screenCtx;

      // limpar sempre (canvas overlay fica por cima do jogo)
      ctx.clearRect(0, 0, w, h);
      if (type === 'none') return;

      // tempestade: leve escurecimento/flash em tela inteira
      if (type === 'storm') {
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(0, 0, w, h);
        if (t < this._flashUntil) {
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.fillRect(0, 0, w, h);
        }
        ctx.restore();
      }

      if (type === 'rain' || type === 'storm') {
        ctx.save();
        ctx.strokeStyle = 'rgba(180,220,255,0.40)';
        ctx.lineWidth = 2;
        for (let i = 0; i < this._screenParticles.length; i++) {
          const p = this._screenParticles[i];
          ctx.globalAlpha = p.a;
          const isBig = (i % 9) === 0;
          const dx = isBig ? 10 : 6;
          const dy = isBig ? 28 : 18;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - dx, p.y + dy);
          ctx.stroke();
        }

        if (this._screenSplashes && this._screenSplashes.length) {
          ctx.fillStyle = 'rgba(210,235,255,0.55)';
          for (const s of this._screenSplashes) {
            ctx.globalAlpha = s.a;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 2.2 + (1 - s.a) * 2.0, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        if (this._screenLensDrops && this._screenLensDrops.length) {
          ctx.globalAlpha = 1;
          for (let i = 0; i < this._screenLensDrops.length; i++) {
            const d = this._screenLensDrops[i];
            const a0 = d.a * (0.65 + intensity * 0.9);
            if (a0 <= 0.01) continue;

            ctx.save();
            ctx.globalAlpha = a0;
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.beginPath();
            ctx.ellipse(d.x, d.y, d.r * 0.65, d.r, 0.15, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = a0 * 0.75;
            ctx.strokeStyle = 'rgba(255,255,255,0.22)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(d.x - d.r * 0.15, d.y - d.r * 0.15, d.r * 0.35, d.r * 0.55, 0.12, 0, Math.PI * 2);
            ctx.stroke();

            ctx.globalAlpha = a0 * 0.45;
            ctx.strokeStyle = 'rgba(255,255,255,0.12)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(d.x + d.r * 0.10, d.y + d.r * 0.55);
            ctx.lineTo(d.x + d.r * 0.06, d.y + d.r * 1.55);
            ctx.stroke();
            ctx.restore();
          }
        }
        ctx.restore();
      } else if (type === 'snow') {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        for (let i = 0; i < this._screenParticles.length; i++) {
          const p = this._screenParticles[i];
          ctx.globalAlpha = p.a;
          const rr = ((i % 11) === 0) ? (p.r + 1.6) : p.r;
          ctx.beginPath();
          ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (type === 'sand') {
        ctx.save();
        ctx.fillStyle = 'rgba(255,210,120,0.55)';
        for (let i = 0; i < this._screenParticles.length; i++) {
          const p = this._screenParticles[i];
          ctx.globalAlpha = p.a;
          const long = ((i % 8) === 0);
          ctx.fillRect(p.x, p.y, (long ? 12 : 3) + p.r, 1 + (p.r * 0.6));
        }
        const alpha = 0.18 + 0.36 * Math.max(0, Math.min(1, intensity));
        ctx.globalAlpha = 1;
        ctx.fillStyle = `rgba(255,210,120,${alpha})`;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    // Decide o clima no início da fase.
    // Retorna: { type: 'none'|'rain'|'snow'|'storm'|'sand', intensity: 0..1 }
    generateForLevel(levelIndex, aestheticId, rng) {
      const a = normalizeAestheticId(aestheticId);
      const r = rng || Math.random;

      // Especificação do usuário (fixa e previsível):
      // - Chuva: 15% (qualquer fase)
      // - Neve: 10% (apenas Dorfic e Evil)
      // - Tempestade: 5% (apenas Evil e Vaporwave)
      // - Tempestade de Areia: 8% (apenas fases com deserto)
      // Observação: o projeto atual não tem um tema "desert" dedicado; então areia só ocorre
      // quando a estética indicar explicitamente deserto.
      const canSnow = (a === 'dorfic' || a === 'evil');
      const canStorm = (a === 'evil' || a === 'vaporwave');
      const canSand = (a === 'desert' || String(aestheticId || '').toLowerCase().includes('desert'));

      const roll = r();
      let type = 'none';

      // Ordem importa (eventos raros primeiro)
      if (canStorm && roll < 0.05) type = 'storm';
      else if (canSand && roll < (0.05 + 0.08)) type = 'sand';
      else if (canSnow && roll < (0.05 + 0.08 + 0.10)) type = 'snow';
      else if (roll < (0.05 + 0.08 + 0.10 + 0.15)) type = 'rain';

      const base = (type === 'none') ? 0 : (0.45 + (r() * 0.45));
      const intensity = util ? util.clamp(base, 0, 1) : Math.max(0, Math.min(1, base));

      // Reset timers de tempestade ao escolher clima
      this._flashUntil = 0;
      this._pendingThunderAt = 0;
      this._nextLightningAt = 0;
      if (type === 'storm') {
        const now0 = (typeof performance !== 'undefined') ? performance.now() : 0;
        this._nextLightningAt = now0 + 1200 + r() * 2200;
      }

      return { type, intensity };
    }

    applyDifficulty(baseDiff, weather) {
      if (!weather || weather.type === 'none') return baseDiff;
      // Tempestade: inimigos mais agressivos
      if (weather.type === 'storm') {
        return {
          ...baseDiff,
          enemySpeed: baseDiff.enemySpeed * 1.08,
          reaction: Math.max(0.08, baseDiff.reaction * 0.85)
        };
      }
      return baseDiff;
    }

    _ensureParticles(canvas, weather) {
      const type = weather?.type || 'none';
      const intensity = weather?.intensity || 0;
      if (type === this.current && Math.abs(intensity - this.intensity) < 0.05 && this._particles.length) return;

      this.current = type;
      this.intensity = intensity;
      this._particles.length = 0;
      this._backParticles.length = 0;

      if (!canvas) return;
      if (type === 'none') return;

      const lw = (canvas && Number.isFinite(canvas._sb99LogicalWidth)) ? canvas._sb99LogicalWidth : canvas.width;
      const lh = (canvas && Number.isFinite(canvas._sb99LogicalHeight)) ? canvas._sb99LogicalHeight : canvas.height;

      // mais partículas (escala por área em CSS px; cap conservador para mobile)
      const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
      const cssW = Math.max(1, canvas.width / Math.max(1, dpr));
      const cssH = Math.max(1, canvas.height / Math.max(1, dpr));
      const areaScale = Math.max(0.85, Math.min(2.25, (cssW * cssH) / (800 * 450)));

      const isSmall = Math.min(cssW, cssH) < 520;
      const cap = isSmall ? 520 : 900;

      let count = Math.floor((70 + intensity * 420) * areaScale);
      if (type === 'snow') count = Math.floor((50 + intensity * 260) * areaScale);
      if (type === 'sand') count = Math.floor((80 + intensity * 360) * areaScale);
      count = Math.max(40, Math.min(cap, count));
      for (let i = 0; i < count; i++) {
        this._particles.push({
          x: Math.random() * lw,
          y: Math.random() * lh,
          vx: 0,
          vy: 0,
          r: 1 + Math.random() * 2,
          a: 0.35 + Math.random() * 0.5
        });
      }

      // Partículas de fundo: maior/mais suave
      const backCap = 90;
      const backCount = Math.max(18, Math.min(backCap, Math.floor(18 + intensity * 70)));
      for (let i = 0; i < backCount; i++) {
        this._backParticles.push({
          x: Math.random() * lw,
          y: Math.random() * lh,
          vx: (Math.random() * 0.6) - 0.3,
          vy: (Math.random() * 0.35) - 0.15,
          r: 10 + Math.random() * 26,
          a: 0.06 + Math.random() * 0.10
        });
      }

      this._splashes.length = 0;

      // lente molhada: poucos drops grandes; população inicial pequena
      this._lensDrops.length = 0;
      const lensCount = Math.max(3, Math.min(10, Math.floor(4 + intensity * 8)));
      for (let i = 0; i < lensCount; i++) {
        this._lensDrops.push({
          x: Math.random() * lw,
          y: Math.random() * lh,
          r: 16 + Math.random() * 40,
          vy: 0.15 + Math.random() * 0.55,
          a: 0.06 + Math.random() * 0.08
        });
      }
    }

    // opt: { groundY?: number, cameraX?: number, audio?: AudioManagerV2, aestheticId?: string }
    update(canvas, weather, now, opt) {
      if (!canvas || !weather) return;
      this._ensureParticles(canvas, weather);
      if (weather.type === 'none') return;

      const t = (typeof now === 'number') ? now : performance.now();
      const w = (canvas && Number.isFinite(canvas._sb99LogicalWidth)) ? canvas._sb99LogicalWidth : canvas.width;
      const h = (canvas && Number.isFinite(canvas._sb99LogicalHeight)) ? canvas._sb99LogicalHeight : canvas.height;
      const intensity = weather.intensity || 0;
      const groundY = (opt && typeof opt.groundY === 'number') ? opt.groundY : (h - 90);
      const audio = opt?.audio || null;
      const cameraX = (opt && typeof opt.cameraX === 'number') ? opt.cameraX : 0;
      const aestheticId = opt?.aestheticId || '';

      // Tempestade: agenda relâmpagos e trovões
      if (weather.type === 'storm') {
        if (!this._nextLightningAt) this._nextLightningAt = t + 1200 + Math.random() * 2200;
        if (t >= this._nextLightningAt) {
          this._flashUntil = t + 50; // 50ms conforme spec
          this._pendingThunderAt = t + 2000;
          this._nextLightningAt = t + 1400 + Math.random() * 2600;
        }
        if (this._pendingThunderAt && t >= this._pendingThunderAt) {
          this._pendingThunderAt = 0;
          try { audio?.playSfx?.('thunder'); } catch (_) {}
        }
      }

      for (const p of this._particles) {
        if (weather.type === 'rain' || weather.type === 'storm') {
          p.vx = -0.8 - intensity * 0.8;
          p.vy = 6.5 + intensity * 7.5;
          p.x += p.vx;
          p.y += p.vy;
          if (p.y > groundY) {
            // respingo ao tocar o chão
            this._splashes.push({ x: p.x, y: groundY, a: 0.55 + Math.random() * 0.25, life: 10 + Math.random() * 10 });
            p.x = w + Math.random() * 60;
            p.y = -Math.random() * 120;
          } else if (p.x < -20) {
            p.x = w + Math.random() * 60;
            p.y = -Math.random() * 120;
          }
        } else if (weather.type === 'snow') {
          p.vx = Math.sin((t / 700) + p.r) * (0.6 + intensity * 0.8);
          p.vy = 1.2 + intensity * 1.6;
          p.x += p.vx;
          p.y += p.vy;
          if (p.y > h + 10) {
            p.y = -10;
            p.x = Math.random() * w;
          }
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;
        } else if (weather.type === 'sand') {
          p.vx = 3.0 + intensity * 4.0;
          p.vy = 0.25 + intensity * 0.35;
          p.x += p.vx;
          p.y += p.vy;
          if (p.x > w + 20) {
            p.x = -20;
            p.y = Math.random() * h;
          }
          if (p.y > h + 10) p.y = -10;
        }
      }

      // lente molhada (só faz sentido em chuva/temporal)
      if ((weather.type === 'rain' || weather.type === 'storm') && this._lensDrops && this._lensDrops.length) {
        const drift = 0.18 + intensity * 0.45;
        for (const d of this._lensDrops) {
          d.y += d.vy * drift;
          // pequenas variações (escorre)
          d.x += Math.sin((t / 750) + d.r) * 0.05;
          if (d.y - d.r > h + 40) {
            d.y = -40 - Math.random() * 80;
            d.x = Math.random() * w;
            d.r = 16 + Math.random() * 42;
            d.vy = 0.12 + Math.random() * 0.65;
            d.a = 0.06 + Math.random() * 0.09;
          }
        }
      }

      // Atualiza partículas de fundo (leve drift + loop)
      if (this._backParticles && this._backParticles.length) {
        for (const p of this._backParticles) {
          const drift = (weather.type === 'sand') ? (1.0 + intensity * 1.4)
            : (weather.type === 'storm') ? (0.6 + intensity * 0.9)
              : (weather.type === 'rain') ? (0.5 + intensity * 0.8)
                : (weather.type === 'snow') ? (0.25 + intensity * 0.5)
                  : 0.35;
          p.x += p.vx * drift;
          p.y += p.vy * drift;

          if (p.x < -40) p.x = w + 40;
          if (p.x > w + 40) p.x = -40;
          if (p.y < -40) p.y = h + 40;
          if (p.y > h + 40) p.y = -40;
        }
      }

      // Atualiza respingos
      if (this._splashes.length) {
        for (const s of this._splashes) {
          s.life -= 1;
          s.a *= 0.92;
        }
        this._splashes = this._splashes.filter((s) => s.life > 0 && s.a > 0.03);
      }

      // Partículas em coordenadas de tela (overlay fullscreen)
      // Mantém o sistema “world” intacto (poças/back layer), mas garante chuva 100% da viewport.
      try {
        this._ensureScreenParticles(weather, canvas);
        const sw = this._screenCssW || 0;
        const sh = this._screenCssH || 0;
        if (sw > 0 && sh > 0 && this._screenParticles && this._screenParticles.length) {
          const groundY2 = sh - 8;
          for (const p of this._screenParticles) {
            if (weather.type === 'rain' || weather.type === 'storm') {
              p.vx = -0.8 - intensity * 0.8;
              p.vy = 6.5 + intensity * 7.5;
              p.x += p.vx;
              p.y += p.vy;
              if (p.y > groundY2) {
                this._screenSplashes.push({ x: p.x, y: groundY2, a: 0.55 + Math.random() * 0.25, life: 10 + Math.random() * 10 });
                p.x = sw + Math.random() * 60;
                p.y = -Math.random() * 120;
              } else if (p.x < -20) {
                p.x = sw + Math.random() * 60;
                p.y = -Math.random() * 120;
              }
            } else if (weather.type === 'snow') {
              p.vx = Math.sin((t / 700) + p.r) * (0.6 + intensity * 0.8);
              p.vy = 1.2 + intensity * 1.6;
              p.x += p.vx;
              p.y += p.vy;
              if (p.y > sh + 10) {
                p.y = -10;
                p.x = Math.random() * sw;
              }
              if (p.x < -10) p.x = sw + 10;
              if (p.x > sw + 10) p.x = -10;
            } else if (weather.type === 'sand') {
              p.vx = 3.0 + intensity * 4.0;
              p.vy = 0.25 + intensity * 0.35;
              p.x += p.vx;
              p.y += p.vy;
              if (p.x > sw + 20) {
                p.x = -20;
                p.y = Math.random() * sh;
              }
              if (p.y > sh + 10) p.y = -10;
            }
          }

          if (this._screenSplashes && this._screenSplashes.length) {
            for (const s of this._screenSplashes) {
              s.life -= 1;
              s.a *= 0.92;
            }
            this._screenSplashes = this._screenSplashes.filter((s) => s.life > 0 && s.a > 0.03);
          }

          if ((weather.type === 'rain' || weather.type === 'storm') && this._screenLensDrops && this._screenLensDrops.length) {
            const drift = 0.18 + intensity * 0.45;
            for (const d of this._screenLensDrops) {
              d.y += d.vy * drift;
              d.x += Math.sin((t / 750) + d.r) * 0.05;
              if (d.y - d.r > sh + 40) {
                d.y = -40 - Math.random() * 80;
                d.x = Math.random() * sw;
                d.r = 16 + Math.random() * 42;
                d.vy = 0.12 + Math.random() * 0.65;
                d.a = 0.06 + Math.random() * 0.09;
              }
            }
          }
        }
      } catch (_) {}

      // Poças: cria no “chão” (world coords) e mantém um número limitado
      if (weather.type === 'rain' || weather.type === 'storm') {
        if (!this._nextPuddleAt) this._nextPuddleAt = t + 600;
        if (t >= this._nextPuddleAt) {
          const w = (canvas && Number.isFinite(canvas._sb99LogicalWidth)) ? canvas._sb99LogicalWidth : canvas.width;
          const span = Math.max(260, w);
          const worldX = cameraX + (Math.random() * span);
          const pw = 28 + Math.random() * (64 + intensity * 80);
          const ph = 4 + Math.random() * 5;
          const until = t + (8000 + intensity * 12000);
          this._puddles.push({ x: worldX, y: groundY, w: pw, h: ph, until });
          if (this._puddles.length > 26) this._puddles.splice(0, this._puddles.length - 26);

          const freq = 520 - Math.min(360, intensity * 320);
          this._nextPuddleAt = t + Math.max(180, freq) + Math.random() * 260;
        }
      }

      if (this._puddles && this._puddles.length) {
        this._puddles = this._puddles.filter((p) => (p.until || 0) > t);
      }

      // Ambiência variável (não spammar): atualiza ~3x/s
      if (audio && (weather.type !== 'none')) {
        if (!this._nextAmbienceAt) this._nextAmbienceAt = t + 260;
        if (t >= this._nextAmbienceAt) {
          const wobble = 0.85 + 0.20 * Math.sin(t / 900) + 0.10 * (Math.random() - 0.5);
          const mod = Math.max(0, Math.min(1, (weather.intensity || 0) * wobble));
          try { audio.setAmbience?.(weather.type, mod, aestheticId); } catch (_) {}
          this._nextAmbienceAt = t + 320;
        }
      }
    }

    // Retorna um multiplicador de velocidade para o player (poças)
    getSpeedScaleForPlayer(player, weather, now) {
      if (!player || !weather) return 1.0;
      const type = weather.type || 'none';
      if (!(type === 'rain' || type === 'storm')) return 1.0;
      if (!this._puddles || !this._puddles.length) return 1.0;
      const t = (typeof now === 'number') ? now : performance.now();

      const feetY = player.y + player.height;
      const cx = player.x + player.width / 2;

      // check simples: centro do player sobre uma poça próxima do chão
      for (let i = this._puddles.length - 1; i >= 0; i--) {
        const p = this._puddles[i];
        if (!p || (p.until || 0) <= t) continue;
        if (Math.abs(feetY - p.y) > 14) continue;
        if (cx >= p.x && cx <= (p.x + p.w)) {
          return 0.72;
        }
      }
      return 1.0;
    }

    drawPuddles(ctx, canvas, cameraX, aestheticId, weather, now) {
      if (!ctx || !canvas || !weather) return;
      const type = weather.type || 'none';
      if (!(type === 'rain' || type === 'storm')) return;
      if (!this._puddles || !this._puddles.length) return;
      const t = (typeof now === 'number') ? now : performance.now();

      const w = (canvas && Number.isFinite(canvas._sb99LogicalWidth)) ? canvas._sb99LogicalWidth : canvas.width;
      const h = (canvas && Number.isFinite(canvas._sb99LogicalHeight)) ? canvas._sb99LogicalHeight : canvas.height;

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      for (const p of this._puddles) {
        if (!p || (p.until || 0) <= t) continue;
        const x = p.x - (cameraX || 0);
        if (x + p.w < -40 || x > w + 40) continue;

        // poça: brilho suave + borda
        const alpha = 0.16 + (weather.intensity || 0) * 0.18;
        ctx.fillStyle = `rgba(200,230,255,${alpha})`;
        ctx.fillRect(x, p.y - p.h, p.w, p.h);
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(x + 4, p.y - p.h + 1, Math.max(6, p.w * 0.35), 1);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }

    drawLayer(ctx, canvas, cameraX, aestheticId, weather, now, layer) {
      if (!ctx || !canvas || !weather) return;
      this._ensureParticles(canvas, weather);
      if (weather.type === 'none') {
        // limpa overlay também, para não “congelar” a chuva quando o clima desliga
        try { this._drawScreenOverlay(weather, now, canvas); } catch (_) {}
        return;
      }

      const t = (typeof now === 'number') ? now : performance.now();
      const intensity = weather.intensity || 0;
      const w = (canvas && Number.isFinite(canvas._sb99LogicalWidth)) ? canvas._sb99LogicalWidth : canvas.width;
      const h = (canvas && Number.isFinite(canvas._sb99LogicalHeight)) ? canvas._sb99LogicalHeight : canvas.height;

      ctx.save();

      const which = layer || 'front';

      if (which === 'back') {
        // “haze” de fundo: afeta a fase inteira atrás dos objetos
        if (weather.type === 'rain') {
          ctx.fillStyle = `rgba(20,60,90,${0.05 + intensity * 0.08})`;
          ctx.fillRect(0, 0, w, h);
        } else if (weather.type === 'snow') {
          ctx.fillStyle = `rgba(210,235,255,${0.05 + intensity * 0.10})`;
          ctx.fillRect(0, 0, w, h);
        } else if (weather.type === 'sand') {
          ctx.fillStyle = `rgba(255,210,120,${0.07 + intensity * 0.12})`;
          ctx.fillRect(0, 0, w, h);
        } else if (weather.type === 'storm') {
          ctx.fillStyle = `rgba(0,0,0,${0.06 + intensity * 0.12})`;
          ctx.fillRect(0, 0, w, h);
        }

        // partículas de fundo (grandes e suaves)
        if (this._backParticles && this._backParticles.length) {
          let color = 'rgba(255,255,255,0.10)';
          if (weather.type === 'sand') color = 'rgba(255,210,120,0.14)';
          if (weather.type === 'storm') color = 'rgba(200,220,255,0.10)';
          if (weather.type === 'rain') color = 'rgba(200,220,255,0.08)';
          if (weather.type === 'snow') color = 'rgba(255,255,255,0.12)';

          ctx.fillStyle = color;
          for (const p of this._backParticles) {
            ctx.globalAlpha = p.a;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // partículas principais também no fundo (para o efeito realmente ocupar a fase inteira)
        // usa parallax leve para não ficar idêntico à camada da frente.
        try {
          const cam = (typeof cameraX === 'number') ? cameraX : 0;
          const par = ((cam * 0.18) % w + w) % w;
          const step = (weather.type === 'storm') ? 2 : 3; // cap leve

          if (weather.type === 'rain' || weather.type === 'storm') {
            ctx.strokeStyle = 'rgba(180,220,255,0.22)';
            ctx.lineWidth = 2;
            for (let i = 0; i < this._particles.length; i += step) {
              const p = this._particles[i];
              ctx.globalAlpha = Math.max(0.08, p.a * 0.35);
              const bx = (p.x + par) % w;
              const isBig = (i % 9) === 0;
              const dx = isBig ? 10 : 6;
              const dy = isBig ? 34 : 22;
              ctx.beginPath();
              ctx.moveTo(bx, p.y);
              ctx.lineTo(bx - dx, p.y + dy);
              ctx.stroke();
            }
          } else if (weather.type === 'snow') {
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            for (let i = 0; i < this._particles.length; i += step) {
              const p = this._particles[i];
              ctx.globalAlpha = Math.max(0.06, p.a * 0.30);
              const bx = (p.x + par) % w;
              const rr = Math.max(1.1, p.r * 0.85);
              ctx.beginPath();
              ctx.arc(bx, p.y, rr, 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (weather.type === 'sand') {
            ctx.fillStyle = 'rgba(255,210,120,0.28)';
            for (let i = 0; i < this._particles.length; i += step) {
              const p = this._particles[i];
              ctx.globalAlpha = Math.max(0.06, p.a * 0.26);
              const bx = (p.x + par) % w;
              const long = ((i % 8) === 0);
              ctx.fillRect(bx, p.y, (long ? 14 : 4) + p.r, 1 + (p.r * 0.55));
            }
          }
        } catch (_) {}

        // Tempestade: flash também ilumina “o mundo todo”
        if (weather.type === 'storm' && t < this._flashUntil) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.fillRect(0, 0, w, h);
        }

        ctx.restore();
        return;
      }

      // FRONT (partículas principais por cima)
      if (weather.type === 'storm') {
        // leve escurecimento na frente + flashes (reforça o clima)
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(0, 0, w, h);
        if (t < this._flashUntil) {
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.fillRect(0, 0, w, h);
        }
      }

      // Overlay fullscreen: garante partículas cobrindo 100% da viewport.
      // Mantém o “back layer” no canvas do jogo, e joga a precipitação frontal no overlay.
      if (weather.type === 'rain' || weather.type === 'storm' || weather.type === 'snow' || weather.type === 'sand') {
        try { this._drawScreenOverlay(weather, now, canvas); } catch (_) {}
      }

      // Se estiver usando o overlay, evita desenhar as partículas frontais no canvas do jogo
      // (para não duplicar e não depender do tamanho do canvas/letterboxing).
      if (weather.type === 'rain' || weather.type === 'storm' || weather.type === 'snow' || weather.type === 'sand') {
        ctx.restore();
        return;
      }

      ctx.restore();
    }

    // compat: se alguém chamar draw(), desenha como camada da frente
    draw(ctx, canvas, cameraX, aestheticId, weather, now, layer) {
      return this.drawLayer(ctx, canvas, cameraX, aestheticId, weather, now, layer || 'front');
    }
  }

  SuperBario99.WeatherSystem = WeatherSystem;
})();
