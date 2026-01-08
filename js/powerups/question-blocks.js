// Blocos de Pergunta + Itens (engrenagens) - v2
// Implementa a mecânica clássica:
// - Bloco 32x32 com pulsação
// - Ativa ao bater por baixo
// - Após usar vira bloco cinza sólido
// - Pode soltar: moedas (3), 1UP, power-up, ou fake

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const util = SuperBario99.util;

  function normalizeAestheticId(themeId) {
    const id = (themeId || 'japan');
    return (id === 'fruitiger-aero') ? 'fruitiger'
      : (id === 'metro-aero') ? 'metro'
      : (id === 'tecno-zen') ? 'tecnozen'
      : (id === 'windows-xp') ? 'windows-xp'
      : (id === 'windows-vista') ? 'windows-vista'
      : (id === 'vaporwave') ? 'vaporwave'
      : (id === 'aurora-aero') ? 'aurora-aero'
      : id;
  }

  function makeQuestionGradient(ctx, x, y, size, aestheticId) {
    const v = normalizeAestheticId(aestheticId);

    // Mapeamento pedido (mantendo coerência com as estéticas atuais)
    let a = '#87CEEB';
    let b = '#FF69B4';

    if (v === 'fruitiger') { a = '#87CEEB'; b = '#FF69B4'; }
    else if (v === 'vaporwave') { a = '#FF00FF'; b = '#00FFFF'; }
    else if (v === 'dorfic') { a = '#556B2F'; b = '#8B4513'; }
    else if (v === 'metro') { a = '#0066CC'; b = '#39FF14'; }
    else if (v === 'tecnozen') { a = '#23d5ff'; b = '#a66bff'; }
    else if (v === 'evil') { a = '#ff3b2f'; b = '#2b000a'; }

    const g = ctx.createLinearGradient(x, y, x + size, y + size);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    return g;
  }

  class QuestionBlock {
    constructor(x, y, contents) {
      this.x = x;
      this.y = y;
      this.width = 32;
      this.height = 32;

      this.kind = 'question';
      this.used = false;
      this.contents = contents || { type: 'coin3' };

      // animação de “bump” (quando bate por baixo)
      this.bump = 0;
    }

    _spawnPowerupItem(level) {
      const powerType = this.contents?.powerType || 'fire';
      if (!level || !level.items) return;

      // Estilo Mario: nasce "dentro" do bloco e emerge para cima.
      const gx = Math.floor(this.x + (this.width / 2) - 12);
      const finalY = Math.floor(this.y - 24); // em cima do bloco (altura do item)
      const startY = Math.floor(this.y + this.height - 24); // começa dentro do bloco
      level.items.push(new GearItem(gx, startY, powerType, { emergeToY: finalY }));
    }

    // Chamada quando o player bate por baixo (vy < 0)
    onHitFromBelow(player, audio, level, now) {
      if (this.used) return;
      // Resolve conteúdo
      const type = this.contents?.type || 'coin3';

      this.used = true;
      this.bump = 10;

      if (audio) audio.playSfx('ding');

      // Power-up: gera item (engrenagem) para o player coletar.
      // Suporta bater por baixo E pousar por cima (mais robusto e mais intuitivo).
      if (type === 'powerup') {
        this._spawnPowerupItem(level);
        return;
      }

      // Moedas (3): soma pontuação e cria partículas (se disponível)
      if (type === 'coin3') {
        if (player) player.score += 300;
        try {
          const game = SuperBario99.__game;
          if (game && game._spawnCoinParticles) {
            const cx = this.x + this.width * 0.5;
            const cy = this.y - 6;
            for (let i = 0; i < 3; i++) game._spawnCoinParticles(cx + (i - 1) * 6, cy, level?.aestheticId || level?.themeId);
          }
          if (game && game.audio) game.audio.playSfx('coin');
        } catch (_) {}
        return;
      }

      // 1UP
      if (type === 'oneup') {
        if (player) player.lives += 1;
        if (audio) audio.playSfx('oneup');
        return;
      }

      // Fake: só vira bloco sólido
      if (type === 'fake') {
        return;
      }
    }

    // NOVO: quando o player pousa em cima do bloco
    onHitFromAbove(player, audio, level, now) {
      // Mesma lógica de ativação do hit por baixo.
      // Isso evita o caso frustrante de “pisei no bloco e não aconteceu nada”.
      return this.onHitFromBelow(player, audio, level, now);
    }

    update() {
      if (this.bump > 0) this.bump--;
    }

    draw(ctx, cameraX, aestheticId, now) {
      const x = this.x - cameraX;
      const y = this.y - (this.bump > 0 ? 2 : 0);
      const s = 32;

      ctx.save();

      // Pulsação suave: 1.0 -> 1.1 -> 1.0 em ~1.5s
      let scale = 1;
      if (!this.used) {
        const t = (now || performance.now()) / 1500;
        scale = 1 + 0.10 * (0.5 - 0.5 * Math.cos(t * Math.PI * 2));
      }
      ctx.translate(x + s / 2, y + s / 2);
      ctx.scale(scale, scale);
      ctx.translate(-s / 2, -s / 2);

      // Corpo do bloco
      if (this.used) {
        ctx.fillStyle = 'rgba(180,180,180,0.95)';
      } else {
        ctx.fillStyle = makeQuestionGradient(ctx, 0, 0, s, aestheticId);
      }
      roundRect(ctx, 0, 0, s, s, 4);
      ctx.fill();

      // Borda
      ctx.strokeStyle = this.used ? 'rgba(90,90,90,0.9)' : 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 2;
      roundRect(ctx, 1, 1, s - 2, s - 2, 4);
      ctx.stroke();

      // “?” ou marca
      ctx.fillStyle = this.used ? 'rgba(70,70,70,0.55)' : 'rgba(0,0,0,0.35)';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.used ? '■' : '?', s / 2, s / 2 + 1);

      ctx.restore();
    }
  }

  class GearItem {
    constructor(x, y, powerType, opt) {
      this.x = x;
      this.y = y;
      this.width = 24;
      this.height = 24;
      this.powerType = powerType;
      this.collected = false;

      const o = opt || {};
      // Emerge (sobe para fora do bloco)
      this.emerging = (typeof o.emergeToY === 'number');
      this._emergeFromY = y;
      this._emergeToY = (typeof o.emergeToY === 'number') ? o.emergeToY : y;
      this._emergeT = 0;
      this._emergeFrames = 16;

      // Movimento simples: sobe um pouco e depois “flutua”
      this.vy = -1.6;
      this.life = 60 * 12; // ~12s para sumir se não pegar
      this.rot = 0;
    }

    update(gravity, level) {
      if (this.collected) return;

      // Durante o emerge: só interpola Y (sem gravidade/colisão)
      if (this.emerging) {
        this._emergeT++;
        const t = Math.max(0, Math.min(1, this._emergeT / this._emergeFrames));
        this.y = this._emergeFromY + (this._emergeToY - this._emergeFromY) * t;
        if (t >= 1) {
          this.emerging = false;
          // pequeno "pop" pra dar leitura visual
          this.vy = -1.2;
        }
        this.rot += 0.10;
        return;
      }

      this.life--;
      if (this.life <= 0) {
        this.collected = true;
        return;
      }

      const prevY = this.y;
      const prevBottom = prevY + this.height;

      this.vy += (gravity || 0.8) * 0.08;
      this.y += this.vy;
      if (this.vy > 0.65) this.vy = 0.65;

      // Colide com plataformas (principalmente o chão), para não cair fora da tela
      if (level && level.platforms && this.vy >= 0) {
        for (const p of level.platforms) {
          if (!p) continue;
          if (typeof p.x !== 'number' || typeof p.y !== 'number') continue;
          if (typeof p.width !== 'number' || typeof p.height !== 'number') continue;

          const hit = (
            this.x < p.x + p.width &&
            this.x + this.width > p.x &&
            this.y < p.y + p.height &&
            this.y + this.height > p.y
          );
          if (!hit) continue;

          // Só “pousa” se estiver caindo e cruzou o topo da plataforma.
          // (Evita teleportar para cima ao encostar na lateral.)
          const crossedTop = (prevBottom <= p.y + 1) && (this.y + this.height >= p.y);
          if (!crossedTop) continue;

          // pousa em cima
          this.y = p.y - this.height;
          this.vy = 0;
          break;
        }
      }

      this.rot += 0.08;
    }

    checkCollision(player) {
      if (this.collected) return false;
      // tolerância para toque (facilita pegar)
      const pad = 12;
      const collision = (
        (player.x - pad) < (this.x + this.width + pad) &&
        (player.x + player.width + pad) > (this.x - pad) &&
        (player.y - pad) < (this.y + this.height + pad) &&
        (player.y + player.height + pad) > (this.y - pad)
      );
      if (collision) {
        this.collected = true;
        return true;
      }
      return false;
    }

    draw(ctx, cameraX, now) {
      if (this.collected) return;
      const x = this.x - cameraX + this.width / 2;
      const y = this.y + this.height / 2;

      const base = SuperBario99.__game?.powerups?.getColor?.(this.powerType) || '#FFFFFF';
      const pulse = 0.06 * (0.5 - 0.5 * Math.cos(((now || performance.now()) / 900) * Math.PI * 2));

      SuperBario99.gearRenderer?.drawGear?.(ctx, x, y, 12, {
        color: base,
        innerColor: 'rgba(0,0,0,0.25)',
        glowColor: 'rgba(255,255,255,0.25)',
        rotation: this.rot,
        teeth: 10,
        pulse
      });
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  // Helper para gerar conteúdo com pesos
  function pickWeighted(rng, items) {
    const total = items.reduce((a, it) => a + it.w, 0);
    let r = rng() * total;
    for (const it of items) {
      r -= it.w;
      if (r <= 0) return it.v;
    }
    return items[0].v;
  }

  // Cria alguns question blocks ao longo das plataformas
  function addQuestionBlocksToLevel(level, levelIndex, rng) {
    if (!level.blocks) level.blocks = [];
    if (!level.items) level.items = [];

    // Quantidade baixa no começo, cresce pouco (prioriza jogabilidade)
    const target = util.clamp(2 + Math.floor(levelIndex / 6), 2, 8);

    const powerTable = [
      { w: 3, v: 'fire' },
      { w: 3, v: 'ice' },
      { w: 3, v: 'ninja' },
      { w: 2, v: 'electric' },
      { w: 2, v: 'time' },
      { w: 1, v: 'cosmic' }
    ];

    const contentsTable = [
      { w: 5, v: { type: 'coin3' } },
      { w: 3, v: { type: 'powerup', powerType: pickWeighted(rng, powerTable) } },
      { w: 1, v: { type: 'oneup' } },
      { w: 1, v: { type: 'fake' } }
    ];

    // Seleciona plataformas “ilhas” (não o chão gigantesco)
    // Importante: evita montanhas/escadas de montanha (costumam ser estreitas e geram overlaps visuais).
    const candidates = (level.platforms || []).filter((p) => {
      if (!p) return false;
      if (p.width > 260) return false;
      if (p.y > 350) return false;

      // Evita degraus muito estreitos (ex.: escadas da montanha)
      if (p.width < 96) return false;

      // Evita a geometria especial da montanha
      if (p.style && p.style === 'mountain') return false;

      return true;
    });
    for (let i = 0; i < target && candidates.length; i++) {
      const idx = Math.floor(rng() * candidates.length);
      const p = candidates.splice(idx, 1)[0];

      // Posição em cima da plataforma (pousável): bloco encosta no topo da plataforma
      const bx = Math.floor(p.x + 10 + rng() * Math.max(1, p.width - 52));
      const by = Math.floor(p.y - 32);

      const contents = pickWeighted(rng, contentsTable);
      const block = new QuestionBlock(bx, by, contents);

      level.blocks.push(block);
      // Importante: vira plataforma sólida
      level.platforms.push(block);

      // Evita moedas sobrepostas ao bloco (melhora leitura e evita confusão no pickup)
      if (level.coins && level.coins.length) {
        const pad = 6;
        level.coins = level.coins.filter((c) => {
          if (!c) return false;
          const hit = (
            (c.x) < (block.x + block.width + pad) &&
            (c.x + (c.width || 16)) > (block.x - pad) &&
            (c.y) < (block.y + block.height + pad) &&
            (c.y + (c.height || 16)) > (block.y - pad)
          );
          return !hit;
        });
      }
    }
  }

  SuperBario99.questionBlocks = {
    QuestionBlock,
    GearItem,
    addQuestionBlocksToLevel
  };
})();
