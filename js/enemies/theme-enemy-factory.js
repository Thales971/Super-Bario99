// js/enemies/theme-enemy-factory.js
// Pools dinâmicos de inimigos por estética.
// Nota: vários tipos do seu documento (oni-mask, jellyfish etc.) ainda não existem como classes.
// Por enquanto, este factory mapeia para os inimigos já existentes e deixa o sistema pronto
// para você plugar classes novas depois.

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  function normalizeThemeId(id) {
    const a = String(id || '').toLowerCase();

    // Mantém os IDs oficiais do theme-manager.js
    if (a === 'japan-retro') return 'japan-retro';
    if (a === 'fruitiger-aero') return 'fruitiger-aero';
    if (a === 'fruitiger-ocean') return 'fruitiger-ocean';
    if (a === 'fruitiger-sunset') return 'fruitiger-sunset';
    if (a === 'fruitiger-neon') return 'fruitiger-neon';
    if (a === 'fruitiger-forest') return 'fruitiger-forest';
    if (a === 'fruitiger-galaxy') return 'fruitiger-galaxy';
    if (a === 'dorfic') return 'dorfic';
    if (a === 'metro-aero' || a === 'metro') return 'metro-aero';
    if (a === 'vaporwave') return 'vaporwave';
    if (a === 'caos-final' || a === 'memefusion') return 'caos-final';
    if (a === 'tecno-zen' || a === 'tecnozen') return 'tecno-zen';
    if (a === 'windows-xp') return 'windows-xp';
    if (a === 'windows-vista') return 'windows-vista';
    if (a === 'evil') return 'evil';
    if (a === 'aurora-aero') return 'aurora-aero';

    // Estéticas secretas
    if (a === 'glitch-aero') return 'glitch-aero';
    if (a === 'dark-aero') return 'dark-aero';
    if (a === 'old-brother-core') return 'old-brother-core';
    if (a === 'dream-core') return 'dream-core';

    // Fallbacks: agrupa variantes fruitiger desconhecidas na "fruitiger-aero"
    if (a.startsWith('fruitiger-')) return 'fruitiger-aero';

    return a;
  }

  const pools = {
    'japan-retro': [
      { type: 'ninja', spawnRate: 0.35 },
      { type: 'yokai', spawnRate: 0.30 },
      { type: 'samurai', spawnRate: 0.20 },
      { type: 'tanuki', spawnRate: 0.10 },
      { type: 'kitsune', spawnRate: 0.05 }
    ],

    // Fruitiger (variações): ainda sem inimigos novos (jellyfish/shark etc.), então usamos os existentes
    // com pesos que "combinam" com a vibe (drones mais presentes).
    'fruitiger-aero': [
      { type: 'drone', spawnRate: 0.45 },
      { type: 'ninja', spawnRate: 0.20 },
      { type: 'kitsune', spawnRate: 0.15 },
      { type: 'tanuki', spawnRate: 0.10 },
      { type: 'yokai', spawnRate: 0.10 }
    ],

    'fruitiger-ocean': [
      { type: 'jellyfish', spawnRate: 0.30 },
      { type: 'shark', spawnRate: 0.20 },
      { type: 'drone', spawnRate: 0.20 },
      { type: 'tanuki', spawnRate: 0.15 },
      { type: 'kitsune', spawnRate: 0.10 },
      { type: 'ninja', spawnRate: 0.03 },
      { type: 'yokai', spawnRate: 0.02 }
    ],

    'fruitiger-sunset': [
      { type: 'kitsune', spawnRate: 0.30 },
      { type: 'samurai', spawnRate: 0.20 },
      { type: 'ninja', spawnRate: 0.20 },
      { type: 'drone', spawnRate: 0.20 },
      { type: 'tanuki', spawnRate: 0.10 }
    ],

    'fruitiger-neon': [
      { type: 'drone', spawnRate: 0.45 },
      { type: 'ninja', spawnRate: 0.25 },
      { type: 'yokai', spawnRate: 0.15 },
      { type: 'samurai', spawnRate: 0.10 },
      { type: 'kitsune', spawnRate: 0.05 }
    ],

    'fruitiger-forest': [
      { type: 'tanuki', spawnRate: 0.35 },
      { type: 'kitsune', spawnRate: 0.25 },
      { type: 'yokai', spawnRate: 0.20 },
      { type: 'ninja', spawnRate: 0.10 },
      { type: 'drone', spawnRate: 0.10 }
    ],

    'fruitiger-galaxy': [
      { type: 'drone', spawnRate: 0.40 },
      { type: 'yokai', spawnRate: 0.25 },
      { type: 'ninja', spawnRate: 0.15 },
      { type: 'kitsune', spawnRate: 0.10 },
      { type: 'samurai', spawnRate: 0.10 }
    ],

    'dorfic': [
      { type: 'samurai', spawnRate: 0.35 },
      { type: 'yokai', spawnRate: 0.25 },
      { type: 'tanuki', spawnRate: 0.20 },
      { type: 'ninja', spawnRate: 0.10 },
      { type: 'kitsune', spawnRate: 0.10 }
    ],

    'metro-aero': [
      { type: 'drone', spawnRate: 0.50 },
      { type: 'samurai', spawnRate: 0.20 },
      { type: 'ninja', spawnRate: 0.15 },
      { type: 'yokai', spawnRate: 0.15 }
    ],

    'tecno-zen': [
      { type: 'drone', spawnRate: 0.55 },
      { type: 'yokai', spawnRate: 0.20 },
      { type: 'ninja', spawnRate: 0.15 },
      { type: 'samurai', spawnRate: 0.10 }
    ],

    'vaporwave': [
      { type: 'kitsune', spawnRate: 0.30 },
      { type: 'drone', spawnRate: 0.25 },
      { type: 'yokai', spawnRate: 0.20 },
      { type: 'ninja', spawnRate: 0.15 },
      { type: 'tanuki', spawnRate: 0.10 }
    ],

    'aurora-aero': [
      { type: 'kitsune', spawnRate: 0.30 },
      { type: 'drone', spawnRate: 0.25 },
      { type: 'samurai', spawnRate: 0.20 },
      { type: 'yokai', spawnRate: 0.15 },
      { type: 'ninja', spawnRate: 0.10 }
    ],

    'windows-xp': [
      { type: 'drone', spawnRate: 0.55 },
      { type: 'ninja', spawnRate: 0.20 },
      { type: 'yokai', spawnRate: 0.15 },
      { type: 'samurai', spawnRate: 0.10 }
    ],

    'windows-vista': [
      { type: 'drone', spawnRate: 0.55 },
      { type: 'kitsune', spawnRate: 0.15 },
      { type: 'yokai', spawnRate: 0.15 },
      { type: 'ninja', spawnRate: 0.15 }
    ],

    'evil': [
      { type: 'yokai', spawnRate: 0.35 },
      { type: 'samurai', spawnRate: 0.25 },
      { type: 'ninja', spawnRate: 0.20 },
      { type: 'kitsune', spawnRate: 0.10 },
      { type: 'drone', spawnRate: 0.10 }
    ],

    'caos-final': [
      { type: 'drone', spawnRate: 0.25 },
      { type: 'ninja', spawnRate: 0.20 },
      { type: 'yokai', spawnRate: 0.20 },
      { type: 'tanuki', spawnRate: 0.20 },
      { type: 'kitsune', spawnRate: 0.10 },
      { type: 'samurai', spawnRate: 0.05 }
    ],

    // Estéticas secretas (fallbacks atuais)
    'glitch-aero': [
      { type: 'drone', spawnRate: 0.40 },
      { type: 'yokai', spawnRate: 0.30 },
      { type: 'ninja', spawnRate: 0.20 },
      { type: 'samurai', spawnRate: 0.10 }
    ],
    'dark-aero': [
      { type: 'yokai', spawnRate: 0.35 },
      { type: 'samurai', spawnRate: 0.25 },
      { type: 'kitsune', spawnRate: 0.20 },
      { type: 'ninja', spawnRate: 0.20 }
    ],
    'old-brother-core': [
      { type: 'drone', spawnRate: 0.45 },
      { type: 'samurai', spawnRate: 0.25 },
      { type: 'ninja', spawnRate: 0.20 },
      { type: 'yokai', spawnRate: 0.10 }
    ],
    'dream-core': [
      { type: 'kitsune', spawnRate: 0.35 },
      { type: 'tanuki', spawnRate: 0.25 },
      { type: 'yokai', spawnRate: 0.20 },
      { type: 'drone', spawnRate: 0.20 }
    ]
  };

  // “Inimigo assinatura” por estética: garantido 1 por fase.
  const signatureByTheme = {
    'japan-retro': 'ninja',
    'fruitiger-aero': 'drone',
    'fruitiger-ocean': 'jellyfish',
    'fruitiger-sunset': 'kitsune',
    'fruitiger-neon': 'drone',
    'fruitiger-forest': 'tanuki',
    'fruitiger-galaxy': 'drone',
    'dorfic': 'samurai',
    'metro-aero': 'drone',
    'tecno-zen': 'drone',
    'vaporwave': 'kitsune',
    'aurora-aero': 'kitsune',
    'windows-xp': 'drone',
    'windows-vista': 'drone',
    'evil': 'yokai',
    'caos-final': 'tanuki',
    'glitch-aero': 'drone',
    'dark-aero': 'yokai',
    'old-brother-core': 'drone',
    'dream-core': 'kitsune'
  };

  function weightedRandom(list, rng = Math.random) {
    const total = list.reduce((a, it) => a + (Number(it.spawnRate) || 0), 0);
    let r = rng() * (total || 1);
    for (const it of list) {
      r -= (Number(it.spawnRate) || 0);
      if (r <= 0) return it;
    }
    return list[0];
  }

  function createEnemy(type, x, y) {
    const t = String(type || '').toLowerCase();
    const SB = window.SuperBario99;

    if (t === 'ninja' && SB.NinjaEnemy) return new SB.NinjaEnemy(x, y);
    if (t === 'yokai' && SB.YokaiEnemy) return new SB.YokaiEnemy(x, y);
    if (t === 'samurai' && SB.SamuraiEnemy) return new SB.SamuraiEnemy(x, y);
    if (t === 'tanuki' && SB.TanukiEnemy) return new SB.TanukiEnemy(x, y);
    if (t === 'kitsune' && SB.KitsuneEnemy) return new SB.KitsuneEnemy(x, y);
    if (t === 'drone' && SB.DroneEnemy) return new SB.DroneEnemy(x, y);

    // Temáticos novos (Ocean)
    if (t === 'jellyfish' && SB.JellyfishEnemy) return new SB.JellyfishEnemy(x, y);
    if (t === 'shark' && SB.SharkEnemy) return new SB.SharkEnemy(x, y);

    // Temáticos novos (Japan Retro)
    if ((t === 'oni-mask' || t === 'onimask') && SB.OniMaskEnemy) return new SB.OniMaskEnemy(x, y);
    if (t === 'monkey' && SB.MonkeyEnemy) return new SB.MonkeyEnemy(x, y);

    // fallback: drone
    if (SB.DroneEnemy) return new SB.DroneEnemy(x, y);
    return null;
  }

  function pickSpawn(level, worldWidth, rng) {
    const ww = Number.isFinite(worldWidth) ? worldWidth : (Number(level?.worldWidth) || 800);

    // Evita muito perto do spawn inicial e do goal no fim
    const minX = 260;
    const maxX = Math.max(minX + 60, ww - 260);

    // Se houver plataformas, tenta escolher uma plataforma “boa”
    const platforms = Array.isArray(level?.platforms) ? level.platforms : null;
    if (platforms && platforms.length) {
      for (let tries = 0; tries < 40; tries++) {
        const p = platforms[(platforms.length * rng()) | 0];
        if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.width)) continue;
        if (p.width < 80) continue;

        const px0 = Math.max(p.x + 16, minX);
        const px1 = Math.min(p.x + p.width - 48, maxX);
        if (px1 <= px0) continue;

        const x = Math.floor(px0 + rng() * Math.max(1, (px1 - px0)));
        // y inicial levemente acima do topo; a física do inimigo completa o ajuste
        const y = Math.floor(Math.max(40, p.y - 140));
        return { x, y };
      }
    }

    // fallback: spawn no ar numa faixa média
    const x = Math.floor(minX + rng() * Math.max(1, (maxX - minX)));
    const y = 220 + Math.floor(rng() * 120);
    return { x, y };
  }

  function spawnThemedEnemies(themeId, phaseNumber, opts) {
    const t = normalizeThemeId(themeId);
    const pool = pools[t] || pools['japan-retro'];
    if (!pool || !pool.length) return [];

    const rng = (opts && typeof opts.rng === 'function') ? opts.rng : Math.random;
    const level = (opts && opts.level) ? opts.level : null;
    const worldWidth = (opts && Number.isFinite(opts.worldWidth)) ? opts.worldWidth : (Number(level?.worldWidth) || 8000);

    const phase = Number(phaseNumber) || 1;
    const enemyCount = (opts && Number.isFinite(opts.enemyCount))
      ? Math.max(0, Math.min(50, opts.enemyCount | 0))
      : Math.min(15, 5 + Math.floor(phase / 10));

    const requireSignature = !(opts && opts.requireSignature === false);
    const signatureType = signatureByTheme[t] || 'ninja';

    const enemies = [];

    // 1) Inimigo assinatura: garante que toda fase tenha "cara" da estética
    if (requireSignature) {
      const pos = pickSpawn(level, worldWidth, rng);
      const sig = createEnemy(signatureType, pos.x, pos.y);
      if (sig) enemies.push(sig);
    }

    // 2) Resto do pool
    for (let i = 0; i < enemyCount; i++) {
      const picked = weightedRandom(pool, rng);
      const pos = pickSpawn(level, worldWidth, rng);
      const x = pos.x;
      const y = pos.y;
      const e = createEnemy(picked.type, x, y);
      if (e) enemies.push(e);
    }

    return enemies;
  }

  SuperBario99.themeEnemyFactory = {
    normalizeThemeId,
    pools,
    signatureByTheme,
    createEnemy,
    spawnThemedEnemies
  };
})();
