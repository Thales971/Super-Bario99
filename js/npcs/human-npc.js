// NPC humano v2: mesmo modelo do player (sprite humano), com diálogo.

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const util = SuperBario99.util;

  // NPC humano v2: usa o MESMO modelo base do player (idle) com variações sutis.
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
    ]
  };

  function _pickBySeed(seed, arr) {
    if (!arr || !arr.length) return null;
    const i = ((seed >>> 0) % arr.length);
    return arr[i];
  }

  function _voiceToIdentity(voice, seed) {
    const v = String(voice || '').toLowerCase();

    // Identidade visual determinística baseada no lore (voice) + seed
    // - accessory: o que desenhar por cima
    // - personality: influencia bob/olhar
    // - paletteHint: sugere cores coerentes
    const table = {
      map: { accessory: 'glasses_satchel', personality: 'calm', paletteHint: 'blue' },
      engine: { accessory: 'goggles_toolbelt', personality: 'energetic', paletteHint: 'cyan' },
      monk: { accessory: 'beads', personality: 'calm', paletteHint: 'green' },
      glitch: { accessory: 'visor', personality: 'mysterious', paletteHint: 'magenta' },
      guard: { accessory: 'headband', personality: 'grumpy', paletteHint: 'red' },
      arch: { accessory: 'hat_bag', personality: 'curious', paletteHint: 'amber' },

      wander: { accessory: 'scarf', personality: 'shy', paletteHint: 'blue' },
      messenger: { accessory: 'cap_bag', personality: 'energetic', paletteHint: 'amber' },
      observer: { accessory: 'glasses', personality: 'calm', paletteHint: 'silver' },
      smith: { accessory: 'apron', personality: 'grumpy', paletteHint: 'green' },
      witness: { accessory: 'mask', personality: 'mysterious', paletteHint: 'silver' },
      audio: { accessory: 'headphones', personality: 'energetic', paletteHint: 'magenta' }
    };

    const base = table[v] || null;
    if (base) return { ...base };

    // fallback: varia por seed
    const accessories = ['glasses', 'scarf', 'headband', 'hat_bag', 'apron', 'headphones', 'beads', 'visor'];
    const personalities = ['calm', 'energetic', 'shy', 'grumpy', 'mysterious', 'curious'];
    const paletteHints = ['blue', 'cyan', 'green', 'red', 'amber', 'silver', 'magenta'];
    return {
      accessory: _pickBySeed(seed ^ 0xA53, accessories),
      personality: _pickBySeed(seed ^ 0xB71, personalities),
      paletteHint: _pickBySeed(seed ^ 0xC19, paletteHints)
    };
  }

  function _drawHumanSprite(ctx, x, y, w, h, flip, palette) {
    const scale = 2;
    const frame = SPRITE.idle;
    const spriteH = frame.length;
    const spriteW = frame[0] ? frame[0].length : 16;
    const drawX0 = x + Math.floor((w - spriteW * scale) / 2);

    // Alinha pelo último pixel visível
    let visibleBottom = -1;
    for (let row = 0; row < frame.length; row++) {
      const line = frame[row];
      for (let col = 0; col < line.length; col++) {
        const ch = line[col];
        if (ch !== '.' && ch !== ' ' && ch !== undefined) {
          visibleBottom = row;
          break;
        }
      }
    }
    const trimBottom = (visibleBottom >= 0) ? (frame.length - 1 - visibleBottom) : 0;
    const drawY0 = y + (h - spriteH * scale) + (trimBottom * scale);

    // Pixels do sprite
    for (let row = 0; row < frame.length; row++) {
      const line = frame[row];
      for (let col = 0; col < line.length; col++) {
        const ch = line[col];
        if (ch === '.' || ch === ' ' || !palette[ch]) continue;
        const drawCol = flip ? (line.length - 1 - col) : col;
        ctx.fillStyle = palette[ch];
        ctx.fillRect(drawX0 + drawCol * scale, drawY0 + row * scale, scale, scale);
      }
    }
  }

  function _drawAccessory(ctx, x, y, flip, pal, kind, seed, disguised) {
    const k = String(kind || 'none');
    const px = Math.floor(x);
    const py = Math.floor(y);
    const hair = ((seed >>> 1) % 4);

    // Cabelo/identidade leve (atrás da cabeça)
    if (!disguised) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = pal.K;
      if (hair === 1) {
        // rabo de cavalo
        const hx = flip ? (px + 6) : (px + 24);
        ctx.fillRect(hx, py + 10, 3, 10);
        ctx.fillRect(hx - 1, py + 18, 5, 3);
      } else if (hair === 2) {
        // topete
        ctx.fillRect(px + 14, py + 2, 4, 4);
        ctx.fillRect(px + 12, py + 4, 8, 2);
      }
      ctx.restore();
    }

    // Acessórios (simples, pixel-art)
    ctx.save();
    const ink = pal.K;
    const accent = pal.R;
    const cloth = pal.B;

    // Se disfarçado, puxa mais pro "misterioso"
    if (disguised) {
      // máscara leve
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = 'rgba(0,0,0,0.20)';
      ctx.fillRect(px + 10, py + 14, 12, 8);
      ctx.fillStyle = ink;
      ctx.fillRect(px + 12, py + 16, 3, 2);
      ctx.fillRect(px + 17, py + 16, 3, 2);
      ctx.restore();
      return;
    }

    if (k === 'glasses' || k === 'glasses_satchel') {
      ctx.fillStyle = ink;
      ctx.fillRect(px + 11, py + 16, 4, 3);
      ctx.fillRect(px + 17, py + 16, 4, 3);
      ctx.fillRect(px + 15, py + 17, 2, 1);
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(px + 12, py + 17, 2, 1);
      ctx.fillRect(px + 18, py + 17, 2, 1);
      ctx.globalAlpha = 1;
    }

    if (k === 'headphones') {
      ctx.fillStyle = ink;
      ctx.fillRect(px + 10, py + 12, 2, 8);
      ctx.fillRect(px + 20, py + 12, 2, 8);
      ctx.fillRect(px + 12, py + 10, 8, 2);
      ctx.fillStyle = accent;
      ctx.fillRect(px + 11, py + 14, 2, 4);
      ctx.fillRect(px + 19, py + 14, 2, 4);
    }

    if (k === 'headband') {
      ctx.fillStyle = accent;
      ctx.fillRect(px + 10, py + 12, 12, 2);
      ctx.fillStyle = ink;
      ctx.fillRect(px + 10, py + 14, 12, 1);
    }

    if (k === 'visor') {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(px + 10, py + 15, 12, 5);
      ctx.fillStyle = accent;
      ctx.fillRect(px + 10, py + 15, 12, 1);
      ctx.fillRect(px + 10, py + 19, 12, 1);
    }

    if (k === 'scarf') {
      ctx.fillStyle = accent;
      ctx.fillRect(px + 10, py + 24, 12, 3);
      ctx.fillRect(px + (flip ? 9 : 21), py + 26, 3, 6);
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(px + 11, py + 25, 10, 1);
      ctx.globalAlpha = 1;
    }

    if (k === 'beads') {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(px + 12, py + 24, 8, 10);
      ctx.fillStyle = accent;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(px + 13 + i * 2, py + 25 + (i % 2), 1, 1);
      }
    }

    if (k === 'apron') {
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.fillRect(px + 11, py + 30, 10, 14);
      ctx.fillStyle = cloth;
      ctx.fillRect(px + 12, py + 31, 8, 12);
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(px + 12, py + 36, 8, 1);
      ctx.globalAlpha = 1;
    }

    if (k === 'hat_bag' || k === 'cap_bag') {
      // boné/chapéu
      ctx.fillStyle = ink;
      ctx.fillRect(px + 9, py + 6, 14, 3);
      ctx.fillStyle = accent;
      ctx.fillRect(px + 10, py + 7, 12, 2);
      if (k === 'cap_bag') {
        ctx.fillStyle = ink;
        ctx.fillRect(px + (flip ? 8 : 22), py + 9, 4, 2);
      }

      // bolsa lateral
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(px + (flip ? 6 : 22), py + 34, 5, 8);
      ctx.fillStyle = cloth;
      ctx.fillRect(px + (flip ? 7 : 23), py + 35, 3, 6);
      ctx.fillStyle = ink;
      ctx.fillRect(px + (flip ? 9 : 23), py + 34, 1, 8);
    }

    if (k === 'goggles_toolbelt') {
      // óculos/goggles
      ctx.fillStyle = ink;
      ctx.fillRect(px + 11, py + 16, 4, 3);
      ctx.fillRect(px + 17, py + 16, 4, 3);
      ctx.fillRect(px + 15, py + 17, 2, 1);
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(px + 12, py + 17, 2, 1);
      ctx.fillRect(px + 18, py + 17, 2, 1);
      ctx.globalAlpha = 1;

      // cinto de ferramentas
      ctx.fillStyle = ink;
      ctx.fillRect(px + 11, py + 36, 10, 2);
      ctx.fillStyle = accent;
      ctx.fillRect(px + 15, py + 36, 2, 2);
      ctx.fillStyle = cloth;
      ctx.fillRect(px + 12, py + 38, 3, 3);
      ctx.fillRect(px + 17, py + 38, 3, 3);
    }

    ctx.restore();
  }

  class HumanNpcV2 {
    constructor(x, y, config) {
      this.x = x;
      this.y = y;
      this.width = 32;
      this.height = 52;

      this.id = String(config?.id || 'npc');
      this.name = String(config?.name || 'NPC');
      this.lines = Array.isArray(config?.lines) ? config.lines.slice(0) : ['...'];
      this.disguised = !!config?.disguised;
      this.voice = String(config?.voice || '');

      const seed = (config?.variantSeed >>> 0) || 1;
      this._seed = seed;
      this._t = 0;

      this._identity = _voiceToIdentity(this.voice, seed);

      // Variação leve de paleta (próxima do player)
      // R = "chapéu/cabelo"; B = "roupa".
      const shirt = (seed % 5);
      const cap = ((seed >>> 3) % 5);
      const shirts = ['#2b63d1', '#4aa3ff', '#23d5ff', '#3c6e47', '#c0392b'];
      const caps = ['#d12b2b', '#ff3b2f', '#ffb6d5', '#ffd27d', '#7FFF00'];

      // Direciona paleta por "hint" (mantém humano parecido com o player, mas com identidade)
      const hint = String(this._identity?.paletteHint || '');
      const H = {
        blue: { R: '#ffb6d5', B: '#2b63d1' },
        cyan: { R: '#23d5ff', B: '#4aa3ff' },
        green: { R: '#7FFF00', B: '#3c6e47' },
        red: { R: '#ff3b2f', B: '#c0392b' },
        amber: { R: '#ffd27d', B: '#2d6a4f' },
        silver: { R: '#C0C0C0', B: '#4aa3ff' },
        magenta: { R: '#ff00ff', B: '#00ffff' }
      };
      const basePal = H[hint] || { R: caps[cap], B: shirts[shirt] };

      this._palette = {
        R: basePal.R,
        B: basePal.B,
        K: '#1b1b1b',
        W: '#f5f6fa'
      };
    }

    update(player, nowMs) {
      this._t++;
      // NPC olha para o player (melhora leitura)
      if (player) {
        this._flip = (player.x < this.x);
      }

      // bob (varia com "personalidade")
      const pers = String(this._identity?.personality || 'calm');
      const base = (pers === 'energetic') ? 1.9 : (pers === 'shy') ? 0.9 : (pers === 'mysterious') ? 1.1 : 1.2;
      const speed = (pers === 'energetic') ? 92 : (pers === 'grumpy') ? 140 : 120;
      const tt = (this._t % speed) / speed;
      this._bob = Math.sin(tt * Math.PI * 2) * base;

      // disfarçado: tremor sutil (mas ainda humano)
      if (this.disguised) {
        this._jitX = ((this._t % 10) === 0) ? (Math.random() * 2 - 1) : (this._jitX || 0);
      } else {
        this._jitX = 0;
      }

      this._lastNow = nowMs;
    }

    isNear(player) {
      if (!player) return false;
      const cx = this.x + this.width / 2;
      const px = player.x + player.width / 2;
      const dx = Math.abs(px - cx);
      const dy = Math.abs((player.y + player.height / 2) - (this.y + this.height / 2));
      return dx < 56 && dy < 58;
    }

    draw(ctx, cameraX, showPrompt, aestheticId) {
      const x = (this.x - cameraX) + (this._jitX || 0);
      const y = this.y + (this._bob || 0);

      ctx.save();
      // sombra
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.beginPath();
      ctx.ellipse(x + this.width / 2, y + this.height + 6, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      if (this.disguised) ctx.globalAlpha = 0.78;
      _drawHumanSprite(ctx, x, y, this.width, this.height, !!this._flip, this._palette);
      ctx.restore();

      // Acessórios / identidade
      _drawAccessory(ctx, x, y, !!this._flip, this._palette, this._identity?.accessory, this._seed, this.disguised);

      // Nome curto + prompt
      if (showPrompt) {
        const tagW = 132;
        const tagH = 22;
        const tx = Math.floor(x + this.width / 2 - tagW / 2);
        const ty = Math.floor(y - 26);

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(tx, ty, tagW, tagH);
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.strokeRect(tx, ty, tagW, tagH);
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.font = '12px Arial';
        const n = this.name.length > 16 ? (this.name.slice(0, 16) + '…') : this.name;
        ctx.fillText(`${n}  (↑)`, tx + 8, ty + 15);
        ctx.restore();
      }
    }
  }

  SuperBario99.HumanNpcV2 = HumanNpcV2;
})();
