// Boss Registry (v2)
// Mapeia as fases de boss (CSV) para dados de boss “nomeado”.

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  function clone(obj) {
    return obj ? JSON.parse(JSON.stringify(obj)) : null;
  }

  // phase = (levelIndex + 1)
  const BOSS_BY_PHASE = {
    10: {
      id: 'jade-dragon',
      name: 'Dragão de Jade',
      themeId: 'japan',
      musicId: 'japan-retro',
      maxHp: 38,
      phases: [0.70, 0.40],
      weakness: 'ice',
      variant: 'brute'
    },
    20: {
      id: 'cosmic-mechanism',
      name: 'Mecanismo Cósmico',
      themeId: 'fruitiger',
      musicId: 'fruitiger-aero',
      maxHp: 44,
      phases: [0.70, 0.40],
      weakness: 'electric',
      variant: 'mage'
    },
    30: {
      id: 'forest-spirit',
      name: 'Espírito da Floresta',
      themeId: 'dorfic',
      musicId: 'dorfic',
      maxHp: 50,
      phases: [0.70, 0.40],
      weakness: 'fire',
      variant: 'summoner'
    },
    40: {
      id: 'metro-robot',
      name: 'Robô do Metrô',
      themeId: 'metro',
      musicId: 'metro-aero',
      maxHp: 56,
      phases: [0.70, 0.40],
      weakness: 'electric',
      variant: 'trickster'
    },
    49: {
      id: 'vapor-god',
      name: 'Deus do Vapor',
      themeId: 'vaporwave',
      musicId: 'vaporwave',
      maxHp: 62,
      phases: [0.70, 0.40],
      weakness: 'ice',
      variant: 'mage'
    },
    59: {
      id: 'ocean-guardian',
      name: 'Guardião do Oceano',
      themeId: 'fruitiger',
      musicId: 'fruitiger-ocean',
      maxHp: 68,
      phases: [0.70, 0.40],
      weakness: 'electric',
      variant: 'brute'
    },
    69: {
      id: 'setting-sun',
      name: 'Sol Poente',
      themeId: 'fruitiger',
      musicId: 'fruitiger-sunset',
      maxHp: 74,
      phases: [0.70, 0.40],
      weakness: 'ice',
      variant: 'mage'
    },
    79: {
      id: 'neon-king',
      name: 'Rei do Neon',
      themeId: 'fruitiger',
      musicId: 'fruitiger-neon',
      maxHp: 80,
      phases: [0.70, 0.40],
      weakness: 'fire',
      variant: 'trickster'
    },
    89: {
      id: 'bee-king',
      name: 'Rei das Abelhas',
      themeId: 'fruitiger',
      musicId: 'fruitiger-forest',
      maxHp: 86,
      phases: [0.70, 0.40],
      weakness: 'fire',
      variant: 'summoner'
    },
    99: {
      id: 'planet-lord',
      name: 'Senhor dos Planetas',
      themeId: 'fruitiger',
      musicId: 'fruitiger-galaxy',
      maxHp: 92,
      phases: [0.70, 0.40],
      weakness: 'cosmic',
      variant: 'mage'
    },
    100: {
      id: 'bario-final',
      name: 'Bario Final',
      themeId: 'memefusion',
      musicId: 'caos-final',
      maxHp: 110,
      phases: [0.75, 0.45],
      weakness: 'melee',
      variant: 'brute'
    }
  };

  function getBossForLevel(levelIndex) {
    const phase = (levelIndex | 0) + 1;
    const base = BOSS_BY_PHASE[phase];
    if (!base) return null;
    const cfg = clone(base);
    cfg.phase = phase;
    return cfg;
  }

  SuperBario99.bossesV2 = {
    getBossForLevel,
    BOSS_BY_PHASE
  };
})();
