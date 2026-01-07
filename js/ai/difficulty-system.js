// Difficulty System (v2)
window.SuperBario99 = window.SuperBario99 || {};

(function () {
  function getBlock(levelIndex) {
    // levelIndex: 0..34
    return Math.floor(levelIndex / 5); // 0..6
  }

  function getThemeId(levelIndex) {
    const block = getBlock(levelIndex);
    return [
      'japan',
      'fruitiger',
      'tecnozen',
      'dorfic',
      'metro',
      'evil',
      'memefusion'
    ][block] || 'japan';
  }

  function getDifficulty(levelIndex) {
    const block = getBlock(levelIndex);
    const within = levelIndex % 5;

    const tier = block <= 1 ? 'basic' : (block <= 4 ? 'intermediate' : 'advanced');

    const base = {
      basic: { enemySpeed: 1.0, reaction: 0.35, spawnExtra: 0 },
      intermediate: { enemySpeed: 1.25, reaction: 0.22, spawnExtra: 1 },
      advanced: { enemySpeed: 1.55, reaction: 0.15, spawnExtra: 2 }
    }[tier];

    // Escala suave dentro do bloco
    const factor = 1 + within * 0.06;

    return {
      tier,
      enemySpeed: base.enemySpeed * factor,
      reaction: base.reaction,
      spawnExtra: base.spawnExtra,
      projectileChance: block >= 4 ? 0.18 + within * 0.03 : 0.0,
      nightMode: (levelIndex % 2 === 1)
    };
  }

  SuperBario99.difficulty = { getBlock, getThemeId, getDifficulty };
})();
