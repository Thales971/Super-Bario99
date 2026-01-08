// NPC humano v2: mesmo modelo do player (sprite humano), com diálogo.

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const util = SuperBario99.util;

  // Copiado do PlayerV2 (mesmo modelo humano), usando apenas idle/jump para simplicidade.
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

      const seed = (config?.variantSeed >>> 0) || 1;
      this._seed = seed;
      this._t = 0;

      // variação leve de paleta (continua humano, sem fugir do modelo)
      // R = "chapéu/cabelo"; B = "roupa".
      const shirt = (seed % 4);
      const cap = ((seed >>> 3) % 4);
      const shirts = ['#2b63d1', '#4aa3ff', '#23d5ff', '#3c6e47'];
      const caps = ['#d12b2b', '#ff3b2f', '#ffb6d5', '#ffd27d'];

      this._palette = {
        R: caps[cap],
        B: shirts[shirt],
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

      // bob leve
      const t = (this._t % 120) / 120;
      this._bob = Math.sin(t * Math.PI * 2) * 1.2;

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
