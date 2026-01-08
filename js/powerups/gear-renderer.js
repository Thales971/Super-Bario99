// Renderizador de engrenagens (power-ups) 100% em Canvas 2D.
// Objetivo: ícones claros, leves e sem dependência de imagens.

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // Desenha uma engrenagem estilizada com “dentes”, miolo e detalhes.
  // - ctx: CanvasRenderingContext2D
  // - x,y: centro
  // - r: raio base
  // - opt: { color, innerColor, glowColor, rotation, teeth, pulse }
  function drawGear(ctx, x, y, r, opt) {
    const color = opt?.color || '#FF00FF';
    const innerColor = opt?.innerColor || 'rgba(0,0,0,0.25)';
    const glowColor = opt?.glowColor || null;
    const rotation = opt?.rotation || 0;
    const teeth = clamp(opt?.teeth ?? 10, 8, 16);
    const pulse = opt?.pulse || 0;

    const rr = r * (1 + pulse);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    if (glowColor) {
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = Math.max(2, rr * 0.18);
      ctx.beginPath();
      ctx.arc(0, 0, rr * 0.92, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Corpo com dentes
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a0 = (i / teeth) * Math.PI * 2;
      const a1 = ((i + 0.45) / teeth) * Math.PI * 2;
      const a2 = ((i + 0.55) / teeth) * Math.PI * 2;
      const a3 = ((i + 1) / teeth) * Math.PI * 2;

      const rOuter = rr;
      const rInner = rr * 0.78;

      const x0 = Math.cos(a0) * rInner;
      const y0 = Math.sin(a0) * rInner;
      const x1 = Math.cos(a1) * rOuter;
      const y1 = Math.sin(a1) * rOuter;
      const x2 = Math.cos(a2) * rOuter;
      const y2 = Math.sin(a2) * rOuter;
      const x3 = Math.cos(a3) * rInner;
      const y3 = Math.sin(a3) * rInner;

      if (i === 0) ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
    }
    ctx.closePath();
    ctx.fill();

    // Miolo
    ctx.fillStyle = innerColor;
    ctx.beginPath();
    ctx.arc(0, 0, rr * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // Parafusos / detalhes
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * rr * 0.55, Math.sin(a) * rr * 0.55, Math.max(1.5, rr * 0.07), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  SuperBario99.gearRenderer = {
    drawGear
  };
})();
