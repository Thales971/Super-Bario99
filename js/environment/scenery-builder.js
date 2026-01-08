// Scenery Builder (v2)
// Cenário decorativo (sem colisão). Mantém custo baixo para mobile.

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const util = SuperBario99.util;

  function normalizeAestheticId(id) {
    const v = (id || 'japan');
    return (v === 'fruitiger-aero') ? 'fruitiger'
      : (v === 'metro-aero') ? 'metro'
      : (v === 'tecno-zen') ? 'tecnozen'
      : v;
  }

  class SceneryBuilder {
    build(levelIndex, aestheticId, rng) {
      const r = rng || Math.random;
      const a = normalizeAestheticId(aestheticId);

      // acompanha o gerador v2 (estimativa) para não "acabar" o cenário antes do fim da fase
      const estWorldWidth = Math.min(11000, 3200 + (levelIndex | 0) * 180);
      const groundBandY = 360; // topo do chão no v2

      const out = [];
      const count = util ? util.clamp(8 + Math.floor(levelIndex / 3), 8, 28) : (8 + Math.floor(levelIndex / 3));
      for (let i = 0; i < count; i++) {
        const x = 120 + Math.floor(r() * Math.max(900, estWorldWidth - 240));
        let y = 80 + Math.floor(r() * 240);

        if (a === 'japan') {
          out.push({ kind: (r() < 0.55 ? 'lantern' : (r() < 0.85 ? 'toriiMini' : 'bigCloud')), x, y, s: 0.6 + r() * 0.8 });
        } else if (a === 'tecnozen') {
          out.push({ kind: (r() < 0.45 ? 'neonPillar' : (r() < 0.75 ? 'circuitOrb' : 'mountain')), x, y, s: 0.7 + r() * 1.0 });
        } else if (a === 'metro') {
          const k = (r() < 0.40 ? 'billboard' : (r() < 0.70 ? 'antenna' : (r() < 0.88 ? 'house' : 'bigCloud')));
          if (k === 'house') y = (groundBandY - 70) + Math.floor(r() * 18);
          out.push({ kind: k, x, y, s: 0.7 + r() * 1.0 });
        } else if (a === 'dorfic') {
          const k = (r() < 0.40 ? 'tree' : (r() < 0.65 ? 'ruinPillar' : (r() < 0.82 ? 'village' : 'mountain')));
          if (k === 'village') y = (groundBandY - 78) + Math.floor(r() * 14);
          if (k === 'mountain') y = 150 + Math.floor(r() * 70);
          out.push({ kind: k, x, y, s: 0.7 + r() * 1.0 });
        } else if (a === 'evil') {
          const k = (r() < 0.45 ? 'obelisk' : (r() < 0.78 ? 'skullTorch' : 'mountain'));
          if (k === 'mountain') y = 150 + Math.floor(r() * 70);
          out.push({ kind: k, x, y, s: 0.7 + r() * 1.0 });
        } else if (a === 'vaporwave') {
          const k = (r() < 0.45 ? 'sunGrid' : (r() < 0.72 ? 'palm' : (r() < 0.88 ? 'bigCloud' : 'mountain')));
          if (k === 'mountain') y = 150 + Math.floor(r() * 70);
          out.push({ kind: k, x, y, s: 0.7 + r() * 1.0 });
        } else if (a === 'windows-xp' || a === 'windows-vista') {
          const k = (r() < 0.55 ? 'house' : (r() < 0.80 ? 'bigCloud' : 'mountain'));
          if (k === 'house') y = (groundBandY - 72) + Math.floor(r() * 16);
          if (k === 'mountain') y = 150 + Math.floor(r() * 70);
          out.push({ kind: k, x, y, s: 0.7 + r() * 1.0 });
        } else {
          out.push({ kind: (r() < 0.75 ? 'cloudlet' : 'bigCloud'), x, y, s: 0.7 + r() * 1.0 });
        }
      }

      // Reagrupa um pouco: vilarejo vira "cluster" (não ficar jogado sozinho)
      // cria 1~2 casas extras próximas quando houver um item 'village'.
      const extras = [];
      for (const it of out) {
        if (it.kind !== 'village') continue;
        const baseX = it.x;
        const baseY = it.y;
        const n = 1 + Math.floor(r() * 2);
        for (let j = 0; j < n; j++) {
          extras.push({ kind: 'house', x: baseX + (j === 0 ? -90 : 90), y: baseY + 8 + Math.floor(r() * 8), s: 0.7 + r() * 0.5 });
        }
      }
      if (extras.length) out.push(...extras);

      return out;
    }

    draw(ctx, cameraX, aestheticId, scenery) {
      if (!ctx || !scenery || !scenery.length) return;
      const a = normalizeAestheticId(aestheticId);

      // parallax leve
      const par = (cameraX || 0) * 0.22;
      ctx.save();

      for (const it of scenery) {
        const x = (it.x - par);
        const y = it.y;
        const s = it.s || 1;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s, s);

        if (it.kind === 'lantern') {
          ctx.fillStyle = 'rgba(255,200,90,0.22)';
          ctx.beginPath();
          ctx.arc(0, 10, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(140,60,20,0.55)';
          ctx.fillRect(-4, 18, 8, 28);
          ctx.fillStyle = 'rgba(255,215,0,0.85)';
          ctx.fillRect(-8, 0, 16, 18);
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.strokeRect(-8, 0, 16, 18);
        } else if (it.kind === 'toriiMini') {
          ctx.fillStyle = 'rgba(192,57,43,0.55)';
          ctx.fillRect(-18, 10, 6, 34);
          ctx.fillRect(12, 10, 6, 34);
          ctx.fillRect(-26, 6, 52, 8);
          ctx.fillRect(-22, 0, 44, 6);
        } else if (it.kind === 'neonPillar') {
          ctx.fillStyle = 'rgba(35,213,255,0.22)';
          ctx.fillRect(-10, 0, 20, 70);
          ctx.strokeStyle = 'rgba(166,107,255,0.30)';
          ctx.lineWidth = 3;
          ctx.strokeRect(-10, 0, 20, 70);
        } else if (it.kind === 'circuitOrb') {
          ctx.strokeStyle = 'rgba(57,255,20,0.35)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 16, 18, 0, Math.PI * 2);
          ctx.stroke();
        } else if (it.kind === 'tree') {
          ctx.fillStyle = 'rgba(60,110,71,0.45)';
          ctx.beginPath();
          ctx.arc(0, 14, 18, 0, Math.PI * 2);
          ctx.arc(-12, 24, 16, 0, Math.PI * 2);
          ctx.arc(12, 24, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(139,69,19,0.40)';
          ctx.fillRect(-4, 30, 8, 26);
        } else if (it.kind === 'ruinPillar') {
          ctx.fillStyle = 'rgba(120,120,120,0.35)';
          ctx.fillRect(-6, 10, 12, 42);
          ctx.fillRect(-10, 6, 20, 8);
        } else if (it.kind === 'billboard') {
          ctx.fillStyle = 'rgba(0,0,0,0.22)';
          ctx.fillRect(-24, 0, 48, 22);
          ctx.fillStyle = 'rgba(0,210,255,0.22)';
          ctx.fillRect(-22, 2, 44, 18);
        } else if (it.kind === 'antenna') {
          ctx.strokeStyle = 'rgba(200,200,200,0.35)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 50);
          ctx.lineTo(0, 0);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.stroke();
        } else if (it.kind === 'obelisk') {
          ctx.fillStyle = 'rgba(30,0,10,0.45)';
          ctx.fillRect(-8, 0, 16, 66);
          ctx.fillStyle = 'rgba(255,59,47,0.20)';
          ctx.fillRect(-6, 8, 12, 8);
        } else if (it.kind === 'skullTorch') {
          ctx.fillStyle = 'rgba(255,59,47,0.18)';
          ctx.beginPath();
          ctx.arc(0, 6, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(120,60,20,0.40)';
          ctx.fillRect(-3, 16, 6, 42);
          ctx.fillStyle = 'rgba(230,230,230,0.35)';
          ctx.beginPath();
          ctx.arc(0, 8, 8, 0, Math.PI * 2);
          ctx.fill();
        } else if (it.kind === 'sunGrid') {
          ctx.fillStyle = 'rgba(255,0,255,0.10)';
          ctx.beginPath();
          ctx.arc(0, 20, 26, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,255,255,0.18)';
          ctx.lineWidth = 1;
          for (let i = -22; i <= 22; i += 6) {
            ctx.beginPath();
            ctx.moveTo(-26, 20 + i);
            ctx.lineTo(26, 20 + i);
            ctx.stroke();
          }
        } else if (it.kind === 'palm') {
          ctx.fillStyle = 'rgba(0,255,255,0.15)';
          ctx.fillRect(-3, 20, 6, 42);
          ctx.fillStyle = 'rgba(255,0,255,0.12)';
          ctx.beginPath();
          ctx.arc(0, 16, 20, 0, Math.PI * 2);
          ctx.fill();
        } else if (it.kind === 'bigCloud') {
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.beginPath();
          ctx.arc(-22, 18, 18, 0, Math.PI * 2);
          ctx.arc(-6, 12, 22, 0, Math.PI * 2);
          ctx.arc(16, 16, 18, 0, Math.PI * 2);
          ctx.arc(30, 22, 14, 0, Math.PI * 2);
          ctx.fill();
        } else if (it.kind === 'mountain') {
          // montanha decorativa (parallax)
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          ctx.beginPath();
          ctx.moveTo(-40, 70);
          ctx.lineTo(0, 6);
          ctx.lineTo(46, 70);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.10)';
          ctx.beginPath();
          ctx.moveTo(-10, 34);
          ctx.lineTo(0, 18);
          ctx.lineTo(12, 36);
          ctx.closePath();
          ctx.fill();
        } else if (it.kind === 'house') {
          // casinha simples
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.fillRect(-20, 28, 40, 28);
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.beginPath();
          ctx.moveTo(-24, 30);
          ctx.lineTo(0, 10);
          ctx.lineTo(24, 30);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.20)';
          ctx.fillRect(-6, 40, 12, 16);
          ctx.fillStyle = 'rgba(0,0,0,0.16)';
          ctx.fillRect(8, 36, 8, 8);
          ctx.fillRect(-16, 36, 8, 8);
        } else if (it.kind === 'village') {
          // vilarejo: 3 casas em cluster
          ctx.save();
          ctx.scale(0.9, 0.9);
          const drawHouse = (ox, oy, s2) => {
            ctx.save();
            ctx.translate(ox, oy);
            ctx.scale(s2, s2);
            ctx.fillStyle = 'rgba(255,255,255,0.10)';
            ctx.fillRect(-18, 28, 36, 26);
            ctx.fillStyle = 'rgba(0,0,0,0.16)';
            ctx.beginPath();
            ctx.moveTo(-22, 30);
            ctx.lineTo(0, 12);
            ctx.lineTo(22, 30);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.fillRect(-5, 40, 10, 14);
            ctx.restore();
          };
          drawHouse(-26, 8, 0.95);
          drawHouse(0, 0, 1.05);
          drawHouse(26, 10, 0.92);
          ctx.restore();
        } else {
          // cloudlet
          ctx.fillStyle = 'rgba(255,255,255,0.10)';
          ctx.beginPath();
          ctx.arc(-12, 14, 12, 0, Math.PI * 2);
          ctx.arc(0, 10, 14, 0, Math.PI * 2);
          ctx.arc(12, 14, 12, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      ctx.restore();
    }
  }

  SuperBario99.SceneryBuilder = SceneryBuilder;
})();
