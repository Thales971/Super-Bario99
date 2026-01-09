// js/levels/special-phases-config.js
/**
 * Configuração detalhada de fases especiais com mecânicas únicas.
 * Cada estética pode ter várias fases especiais com diferentes tipos de gameplay.
 *
 * Importante: o engine atual ainda não implementa todos os elementos de "environment"
 * (ex.: camadas de background, plataformas especiais, inimigos novos). Mesmo assim,
 * este arquivo expõe a config completa e injeta no `level` metadados/mecânicas
 * para o `GameV2` aplicar o que for suportado.
 */

window.specialPhasesConfig = window.specialPhasesConfig || (function () {
  const KEY = 'sb99_special_phases_v2';

  // Fonte “oficial” de configs (como você enviou). Ainda pode ser estendida via register().
  const specialPhases = [
    // ======================
    // JAPÃO RETRO (fases 1-10)
    // ======================
    {
      theme: 'japan-retro',
      phaseNumber: 3,
      type: 'horizontal-classic',
      name: 'Vale dos Templos',
      description: 'Fase horizontal clássica com templos, pontes e cerejeiras',
      mechanics: {
        gravity: 0.8,
        playerSpeed: 5,
        cameraFollow: 'standard',
        wrapAround: false
      },
      environment: {
        background: {
          layers: [
            { color: '#87CEEB', type: 'sky' },
            { color: '#457B9D', type: 'mountains', height: 150 },
            { color: '#2A9D8F', type: 'hills', height: 80 },
            { type: 'cherry-blossoms', density: 0.3 }
          ]
        },
        platforms: [
          { type: 'ground', x: 0, y: 400, width: 800, height: 50, texture: 'wood' },
          { type: 'temple-platform', x: 200, y: 300, width: 150, height: 30 },
          { type: 'bridge', x: 400, y: 250, width: 100, height: 20 },
          { type: 'temple-roof', x: 600, y: 200, width: 120, height: 40 }
        ],
        interactive: [
          { type: 'temple-bell', x: 250, y: 270 },
          { type: 'lantern', x: 450, y: 220 }
        ],
        weather: { type: 'clear', effects: [] }
      },
      enemies: [
        { type: 'ninja', x: 300, y: 280, behavior: 'patrol', patrolRange: 50 },
        { type: 'tanuki-statue', x: 500, y: 230, behavior: 'trap' }
      ],
      objectives: {
        coins: 15,
        powerUps: 2,
        goal: { type: 'temple-door', x: 750, y: 360 }
      }
    },

    {
      theme: 'japan-retro',
      phaseNumber: 7,
      type: 'vertical-scroll',
      name: 'Montanha Sagrada',
      description: 'Fase vertical subindo uma montanha com templos e cachoeiras',
      mechanics: {
        gravity: 0.8,
        playerSpeed: 4,
        cameraFollow: 'vertical',
        wrapAround: false,
        scrollSpeed: 0.5
      },
      environment: {
        background: {
          layers: [
            { color: '#1D3557', type: 'night-sky' },
            { color: '#457B9D', type: 'mountains', height: 300 },
            { type: 'waterfall', x: 100, y: 200, width: 40, height: 300 },
            { type: 'cherry-blossoms', density: 0.1 }
          ]
        },
        platforms: [
          { type: 'stone-platform', x: 100, y: 500, width: 80, height: 30 },
          { type: 'temple-platform', x: 300, y: 400, width: 120, height: 40 },
          { type: 'suspension-bridge', x: 150, y: 300, width: 100, height: 15 },
          { type: 'stone-platform', x: 400, y: 200, width: 80, height: 30 },
          { type: 'temple-roof', x: 250, y: 100, width: 150, height: 50 }
        ],
        interactive: [
          { type: 'lantern', x: 350, y: 370 },
          { type: 'shrine-gate', x: 200, y: 270 }
        ],
        weather: { type: 'mist', density: 0.3 }
      },
      enemies: [
        { type: 'oni-mask', x: 350, y: 370, behavior: 'floating', floatRange: 30 },
        { type: 'monkey', x: 150, y: 270, behavior: 'jump' }
      ],
      objectives: {
        coins: 12,
        powerUps: 1,
        goal: { type: 'mountain-summit', x: 250, y: 50 }
      }
    },

    // ======================
    // FRUITIGER OCEAN (fases 50-59)
    // ======================
    {
      theme: 'fruitiger-ocean',
      phaseNumber: 52,
      type: 'boat-horizontal',
      name: 'Veleiro das Profundezas',
      description: 'Fase com barco navegando em águas turbulentas, precisa pular entre barcos',
      mechanics: {
        gravity: 0.7,
        playerSpeed: 4,
        cameraFollow: 'boat-follow',
        wrapAround: false,
        boatSpeed: 1.5,
        waterResistance: 0.3,
        canSwim: true,
        swimSpeed: 2.5
      },
      environment: {
        background: {
          layers: [
            { color: '#1E90FF', type: 'ocean-sky' },
            { color: '#00CED1', type: 'ocean-water', waveAmplitude: 20, waveSpeed: 0.05 },
            { type: 'coral-reef', x: 0, y: 500, width: 800, height: 100 },
            { type: 'bubbles', density: 0.5 }
          ]
        },
        platforms: [
          { type: 'sailboat', x: 100, y: 350, width: 120, height: 40, moving: true, path: [100, 300, 500] },
          { type: 'fishing-boat', x: 400, y: 320, width: 100, height: 30, moving: true, path: [400, 200, 600] },
          { type: 'pirate-ship', x: 650, y: 300, width: 150, height: 60 },
          { type: 'floating-barrel', x: 250, y: 380, width: 40, height: 20, moving: true, floatAmplitude: 10 }
        ],
        interactive: [
          { type: 'treasure-chest', x: 300, y: 450, underwater: true },
          { type: 'bottled-message', x: 500, y: 330 }
        ],
        waterLevel: 450,
        weather: { type: 'ocean-breeze', windSpeed: 1.0 }
      },
      enemies: [
        { type: 'jellyfish', x: 500, y: 350, behavior: 'floating', floatRange: 40 },
        { type: 'pirate-crab', x: 650, y: 280, behavior: 'patrol', patrolRange: 60 },
        { type: 'shark', x: 300, y: 480, behavior: 'swim-patrol', underwater: true }
      ],
      objectives: {
        coins: 18,
        powerUps: 3,
        goal: { type: 'lighthouse', x: 750, y: 320 }
      }
    },

    {
      theme: 'fruitiger-ocean',
      phaseNumber: 56,
      type: 'underwater-vertical',
      name: 'Profundezas do Recife',
      description: 'Fase vertical subaquática com corais, cavernas e vida marinha',
      mechanics: {
        gravity: 0.2,
        playerSpeed: 3,
        cameraFollow: 'vertical',
        wrapAround: false,
        scrollSpeed: 0.3,
        underwaterBreathing: true,
        oxygenLevel: 100,
        oxygenDrain: 0.1,
        canSwim: true,
        swimSpeed: 4.0
      },
      environment: {
        background: {
          layers: [
            { color: '#00008B', type: 'deep-ocean' },
            { color: '#0000CD', type: 'mid-ocean', gradient: true },
            { type: 'coral-forest', x: 0, y: 300, width: 800, height: 500 },
            { type: 'bioluminescent-plants', density: 0.4 },
            { type: 'bubbles', density: 0.8, rising: true }
          ]
        },
        platforms: [
          { type: 'coral-platform', x: 200, y: 500, width: 100, height: 30 },
          { type: 'shipwreck-deck', x: 400, y: 400, width: 150, height: 40 },
          { type: 'cave-entrance', x: 150, y: 300, width: 120, height: 60 },
          { type: 'giant-clam', x: 500, y: 250, width: 80, height: 50 },
          { type: 'ancient-temple', x: 300, y: 150, width: 200, height: 80 }
        ],
        interactive: [
          { type: 'pearl', x: 250, y: 450 },
          { type: 'ancient-tablet', x: 350, y: 120 },
          { type: 'oxygen-tank', x: 450, y: 320 }
        ],
        waterLevel: 0,
        weather: { type: 'underwater-currents', currentStrength: 0.5 }
      },
      enemies: [
        { type: 'angler-fish', x: 300, y: 450, behavior: 'lure', underwater: true },
        { type: 'electric-eel', x: 500, y: 350, behavior: 'charge', underwater: true },
        { type: 'giant-squid', x: 200, y: 200, behavior: 'tentacle-swing', underwater: true, boss: true }
      ],
      objectives: {
        coins: 15,
        powerUps: 2,
        goal: { type: 'sunlight-surface', x: 300, y: 50 }
      }
    },

    // ======================
    // FRUITIGER GALAXY (fases 90-99)
    // ======================
    {
      theme: 'fruitiger-galaxy',
      phaseNumber: 93,
      type: 'spaceship-horizontal',
      name: 'Nave Estelar Nebula',
      description: 'Fase dentro de uma nave espacial com gravidade variável e corredores',
      mechanics: {
        gravity: 0.6,
        playerSpeed: 6,
        cameraFollow: 'spaceship-interior',
        wrapAround: false,
        canChangeGravity: true,
        gravityZones: [
          { x: 0, y: 0, width: 300, height: 600, gravityDirection: 'down' },
          { x: 300, y: 0, width: 300, height: 600, gravityDirection: 'left' },
          { x: 600, y: 0, width: 200, height: 600, gravityDirection: 'up' }
        ],
        zeroGravityZones: [
          { x: 400, y: 200, width: 100, height: 100 }
        ]
      },
      environment: {
        background: {
          layers: [
            { color: '#0a0a2a', type: 'deep-space' },
            { type: 'stars', density: 0.8, twinkle: true },
            { type: 'nebula', color: '#4B0082', x: 200, y: 150, size: 300 },
            { type: 'spaceship-interior', x: 0, y: 0, width: 800, height: 600 }
          ]
        },
        platforms: [
          { type: 'metal-floor', x: 0, y: 550, width: 300, height: 50, gravityDirection: 'down' },
          { type: 'wall-platform', x: 290, y: 100, width: 50, height: 400, gravityDirection: 'left' },
          { type: 'ceiling-platform', x: 600, y: 50, width: 200, height: 30, gravityDirection: 'up' },
          { type: 'control-console', x: 150, y: 450, width: 80, height: 40 },
          { type: 'energy-core', x: 450, y: 300, width: 60, height: 60, interactive: true }
        ],
        interactive: [
          { type: 'gravity-switch', x: 250, y: 500 },
          { type: 'holographic-map', x: 400, y: 200 },
          { type: 'emergency-hatch', x: 700, y: 520 }
        ],
        weather: { type: 'zero-gravity', effect: 'float' }
      },
      enemies: [
        { type: 'space-jelly', x: 150, y: 400, behavior: 'float-gravity', gravityDependent: true },
        { type: 'security-drone', x: 400, y: 250, behavior: 'patrol', patrolPath: [[350, 250], [450, 250], [450, 350], [350, 350]] },
        { type: 'alien-worker', x: 650, y: 100, behavior: 'repair', nonAggressive: true }
      ],
      objectives: {
        coins: 12,
        powerUps: 2,
        goal: { type: 'bridge-door', x: 750, y: 300 }
      }
    },

    {
      theme: 'fruitiger-galaxy',
      phaseNumber: 97,
      type: 'balloon-vertical',
      name: 'Ascensão Cósmica',
      description: 'Fase vertical com balões flutuando no espaço, precisa pular entre eles',
      mechanics: {
        gravity: 0.1,
        playerSpeed: 5,
        cameraFollow: 'vertical',
        wrapAround: false,
        scrollSpeed: 0.8,
        canGrab: true,
        balloonBuoyancy: 0.3,
        oxygenLevel: 80,
        oxygenDrain: 0.05
      },
      environment: {
        background: {
          layers: [
            { color: '#191970', type: 'cosmic-sky' },
            { type: 'stars', density: 1.0, twinkle: true },
            { type: 'planets', count: 3, planets: [
              { x: 100, y: 200, radius: 40, color: '#FFD700' },
              { x: 600, y: 300, radius: 60, color: '#87CEEB' },
              { x: 300, y: 500, radius: 30, color: '#FF6347' }
            ] },
            { type: 'aurora-borealis', x: 200, y: 100, width: 400, height: 300, colors: ['#7FFF00', '#FF69B4'] }
          ]
        },
        platforms: [
          { type: 'balloon', x: 200, y: 500, width: 60, height: 80, floating: true, floatSpeed: 0.5, floatRange: 30 },
          { type: 'balloon', x: 400, y: 400, width: 60, height: 80, floating: true, floatSpeed: 0.7, floatRange: 40 },
          { type: 'balloon', x: 600, y: 350, width: 60, height: 80, floating: true, floatSpeed: 0.3, floatRange: 20 },
          { type: 'space-station-platform', x: 300, y: 250, width: 120, height: 30 },
          { type: 'comet-platform', x: 500, y: 150, width: 80, height: 40, moving: true, path: [500, 450, 550] }
        ],
        interactive: [
          { type: 'star-cluster', x: 250, y: 450 },
          { type: 'cosmic-key', x: 450, y: 300 },
          { type: 'oxygen-refill', x: 350, y: 200 }
        ],
        weather: { type: 'solar-wind', windSpeed: 0.8, direction: 'up' }
      },
      enemies: [
        { type: 'comet-worm', x: 300, y: 450, behavior: 'swarm', swarmSize: 3 },
        { type: 'black-hole-minion', x: 500, y: 350, behavior: 'suction', suctionRadius: 80 },
        { type: 'space-butterfly', x: 200, y: 250, behavior: 'erratic', nonAggressive: true }
      ],
      objectives: {
        coins: 15,
        powerUps: 3,
        goal: { type: 'wormhole', x: 400, y: 50 }
      }
    },

    // ======================
    // GLITCH AERO (estética secreta)
    // ======================
    {
      theme: 'glitch-aero',
      phaseNumber: 101,
      type: 'glitch-horizontal',
      name: 'Corrupção do Mainframe',
      description: 'Fase horizontal com distorções de tela e realidade quebrada',
      mechanics: {
        gravity: 0.8,
        playerSpeed: 5,
        cameraFollow: 'standard',
        wrapAround: true,
        screenGlitch: true,
        glitchIntensity: 0.3,
        realityStability: 100,
        realityDrain: 0.2,
        canRepairReality: true
      },
      environment: {
        background: {
          layers: [
            { type: 'matrix-rain', density: 0.7, colors: ['#00ff00', '#008000'] },
            { type: 'corrupted-sky', colors: ['#000000', '#ff00ff', '#00ffff'], glitchAmount: 0.5 },
            { type: 'error-messages', density: 0.2, messages: ['ERROR 404', 'SYSTEM FAILURE', 'CORRUPTED'] },
            { type: 'data-streams', density: 0.4, speed: 2.0 }
          ]
        },
        platforms: [
          { type: 'glitch-block', x: 100, y: 400, width: 80, height: 30, glitching: true, glitchFrequency: 2.0 },
          { type: 'error-platform', x: 300, y: 350, width: 100, height: 30, disappears: true, disappearTime: 3000 },
          { type: 'corrupted-bridge', x: 500, y: 300, width: 120, height: 20, broken: true, repairable: true },
          { type: 'firewall-wall', x: 650, y: 200, width: 50, height: 150, destructible: true }
        ],
        interactive: [
          { type: 'debug-console', x: 200, y: 370 },
          { type: 'anti-virus', x: 450, y: 320 },
          { type: 'system-restore-point', x: 600, y: 270 }
        ],
        weather: { type: 'data-storm', intensity: 0.8, visualEffect: 'screen-tearing' }
      },
      enemies: [
        { type: 'data-worm', x: 250, y: 370, behavior: 'corrupt', corruptionRadius: 50 },
        { type: 'glitch-sprite', x: 400, y: 320, behavior: 'mirror-player', delay: 1000 },
        { type: 'firewall-guardian', x: 650, y: 150, behavior: 'stationary', shootsLasers: true, boss: true }
      ],
      objectives: {
        coins: 10,
        powerUps: 2,
        goal: { type: 'system-core', x: 750, y: 350 }
      }
    },

    {
      theme: 'glitch-aero',
      phaseNumber: 102,
      type: 'reality-vertical',
      name: 'Torre do Infinito Quebrado',
      description: 'Fase vertical com realidades sobrepostas e distorções dimensionais',
      mechanics: {
        gravity: 0.8,
        playerSpeed: 4,
        cameraFollow: 'vertical',
        wrapAround: false,
        scrollSpeed: 0.6,
        realityShifting: true,
        realityTypes: ['glitch', 'normal', 'inverted'],
        currentReality: 'glitch',
        shiftCooldown: 10000
      },
      environment: {
        background: {
          layers: [
            { type: 'reality-layers', count: 3, layers: [
              { color: '#000000', opacity: 0.8 },
              { color: '#ff00ff', opacity: 0.3 },
              { color: '#00ffff', opacity: 0.2 }
            ] },
            { type: 'dimensional-tears', density: 0.4, size: 20 },
            { type: 'binary-code', density: 0.6, speed: 1.5 },
            { type: 'reality-stabilizer', x: 400, y: 100, width: 40, height: 40, interactive: true }
          ]
        },
        platforms: [
          { type: 'reality-platform', x: 200, y: 500, width: 100, height: 30, reality: 'glitch' },
          { type: 'reality-platform', x: 400, y: 400, width: 120, height: 30, reality: 'normal' },
          { type: 'reality-platform', x: 150, y: 300, width: 80, height: 30, reality: 'inverted' },
          { type: 'dimensional-bridge', x: 350, y: 200, width: 150, height: 20, connectsRealities: true },
          { type: 'core-platform', x: 250, y: 100, width: 200, height: 50, bossArena: true }
        ],
        interactive: [
          { type: 'reality-switch', x: 300, y: 450 },
          { type: 'memory-fragment', x: 450, y: 350 },
          { type: 'stabilizer-core', x: 250, y: 150 }
        ],
        weather: { type: 'reality-storm', intensity: 1.0, visualEffect: 'screen-distortion' }
      },
      enemies: [
        { type: 'reality-worm', x: 250, y: 450, behavior: 'dimension-jump', canShiftRealities: true },
        { type: 'corrupted-sprite', x: 400, y: 350, behavior: 'copy', copiesPlayerAbilities: true },
        { type: 'system-administrator', x: 250, y: 120, behavior: 'boss', realityManipulation: true, boss: true }
      ],
      objectives: {
        coins: 8,
        powerUps: 1,
        goal: { type: 'reality-core', x: 250, y: 50 }
      }
    },

    // ======================
    // DREAM CORE (estética secreta)
    // ======================
    {
      theme: 'dream-core',
      phaseNumber: 103,
      type: 'cloud-horizontal',
      name: 'Reino das Nuvens Sonhadoras',
      description: 'Fase horizontal em nuvens fofas com elementos de sonho',
      mechanics: {
        gravity: 0.6,
        playerSpeed: 5,
        cameraFollow: 'standard',
        wrapAround: false,
        dreamState: 'lucid',
        dreamStability: 100,
        dreamDrain: 0.1,
        canChangeState: true,
        cloudBounce: true,
        cloudBounceStrength: 1.2
      },
      environment: {
        background: {
          layers: [
            { color: '#9370DB', type: 'dream-sky' },
            { type: 'clouds', density: 0.8, colors: ['#FFFFFF', '#E6E6FA', '#D8BFD8'] },
            { type: 'stars', density: 0.3, twinkle: true, dreamOnly: true },
            { type: 'rainbow', x: 200, y: 100, width: 400, height: 50, visibleInState: 'lucid' },
            { type: 'shadow-clouds', density: 0.5, visibleInState: 'nightmare' }
          ]
        },
        platforms: [
          { type: 'cloud-platform', x: 100, y: 400, width: 100, height: 40, bouncy: true },
          { type: 'pillow-platform', x: 300, y: 350, width: 80, height: 30, soft: true },
          { type: 'rainbow-bridge', x: 450, y: 300, width: 120, height: 20, visibleInState: 'lucid' },
          { type: 'shadow-platform', x: 600, y: 250, width: 100, height: 30, visibleInState: 'nightmare', slippery: true },
          { type: 'dream-castle', x: 700, y: 200, width: 150, height: 80 }
        ],
        interactive: [
          { type: 'dream-catcher', x: 200, y: 370 },
          { type: 'nightmare-lantern', x: 500, y: 270, visibleInState: 'nightmare' },
          { type: 'lucid-crystal', x: 400, y: 320, visibleInState: 'lucid' },
          { type: 'reality-anchor', x: 650, y: 220 }
        ],
        weather: { type: 'dream-wind', windSpeed: 0.5, leaves: true }
      },
      enemies: [
        { type: 'dream-sprite', x: 250, y: 370, behavior: 'playful', nonAggressive: true, visibleInState: 'lucid' },
        { type: 'nightmare-sprite', x: 500, y: 270, behavior: 'chase', aggressive: true, visibleInState: 'nightmare' },
        { type: 'dream-eater', x: 650, y: 170, behavior: 'boss', consumesDreams: true, boss: true }
      ],
      objectives: {
        coins: 12,
        powerUps: 2,
        goal: { type: 'castle-door', x: 750, y: 150 }
      }
    },

    {
      theme: 'dream-core',
      phaseNumber: 104,
      type: 'time-vertical',
      name: 'Torre do Tempo Sonhador',
      description: 'Fase vertical que manipula o tempo e a realidade do sonho',
      mechanics: {
        gravity: 0.8,
        playerSpeed: 4,
        cameraFollow: 'vertical',
        wrapAround: false,
        scrollSpeed: 0.4,
        timeManipulation: true,
        timeSpeed: 1.0,
        timeZones: [
          { x: 0, y: 400, width: 800, height: 200, timeSpeed: 0.5 },
          { x: 0, y: 200, width: 800, height: 200, timeSpeed: 1.0 },
          { x: 0, y: 0, width: 800, height: 200, timeSpeed: 2.0 }
        ],
        canReverseTime: true,
        timeReversalCooldown: 30000
      },
      environment: {
        background: {
          layers: [
            { type: 'time-sky', colors: ['#87CEFA', '#9370DB', '#4B0082'], gradient: true },
            { type: 'hourglass-sand', density: 0.3, falling: true },
            { type: 'time-crystals', density: 0.2, colors: ['#FFFFFF', '#E6E6FA'] },
            { type: 'temporal-ripples', density: 0.4, speed: 0.5 }
          ]
        },
        platforms: [
          { type: 'past-platform', x: 200, y: 500, width: 100, height: 30, timePeriod: 'past', color: '#87CEFA' },
          { type: 'present-platform', x: 400, y: 400, width: 120, height: 30, timePeriod: 'present', color: '#9370DB' },
          { type: 'future-platform', x: 150, y: 300, width: 80, height: 30, timePeriod: 'future', color: '#4B0082' },
          { type: 'time-bridge', x: 300, y: 250, width: 150, height: 20, connectsTimePeriods: true },
          { type: 'time-core', x: 250, y: 150, width: 100, height: 60, bossArena: true }
        ],
        interactive: [
          { type: 'hourglass', x: 250, y: 470 },
          { type: 'time-crystal', x: 450, y: 370 },
          { type: 'temporal-switch', x: 150, y: 270 },
          { type: 'time-anchor', x: 300, y: 220 }
        ],
        weather: { type: 'temporal-storm', intensity: 0.6, visualEffect: 'time-distortion' }
      },
      enemies: [
        { type: 'time-wisp', x: 250, y: 470, behavior: 'float', timePeriod: 'past' },
        { type: 'present-guardian', x: 450, y: 370, behavior: 'patrol', timePeriod: 'present' },
        { type: 'future-dreadnought', x: 150, y: 270, behavior: 'aggressive', timePeriod: 'future' },
        { type: 'time-keeper', x: 250, y: 120, behavior: 'boss', timeManipulation: true, boss: true }
      ],
      objectives: {
        coins: 10,
        powerUps: 1,
        goal: { type: 'time-core', x: 250, y: 100 }
      }
    },

    // ======================
    // OLD BROTHER CORE (estética secreta)
    // ======================
    {
      theme: 'old-brother-core',
      phaseNumber: 105,
      type: 'factory-horizontal',
      name: 'Complexo Industrial Abandonado',
      description: 'Fase horizontal em uma fábrica abandonada com máquinas perigosas',
      mechanics: {
        gravity: 0.8,
        playerSpeed: 5,
        cameraFollow: 'standard',
        wrapAround: false,
        industrialHazards: true,
        steamDamage: true,
        conveyorBelts: true,
        beltSpeed: 2.0
      },
      environment: {
        background: {
          layers: [
            { color: '#2F4F4F', type: 'industrial-interior' },
            { type: 'pipes', density: 0.8, colors: ['#808080', '#A9A9A9'] },
            { type: 'steam-vents', density: 0.3, emitting: true },
            { type: 'warning-lights', density: 0.5, blinking: true, colors: ['#FF0000', '#FFA500'] }
          ]
        },
        platforms: [
          { type: 'metal-floor', x: 0, y: 500, width: 200, height: 50 },
          { type: 'conveyor-belt', x: 200, y: 450, width: 150, height: 30, moving: true, direction: 'right', speed: 2.0 },
          { type: 'catwalk', x: 400, y: 400, width: 100, height: 20, shaky: true },
          { type: 'control-room', x: 550, y: 350, width: 120, height: 80 },
          { type: 'core-chamber', x: 700, y: 300, width: 100, height: 100 }
        ],
        interactive: [
          { type: 'control-panel', x: 250, y: 420 },
          { type: 'emergency-valve', x: 400, y: 370 },
          { type: 'security-terminal', x: 550, y: 320 },
          { type: 'core-access-key', x: 650, y: 320 }
        ],
        weather: { type: 'steam-leak', intensity: 0.7, damage: 1 }
      },
      enemies: [
        { type: 'security-drone', x: 300, y: 420, behavior: 'patrol', patrolPath: [[250, 420], [350, 420]] },
        { type: 'worker-android', x: 450, y: 370, behavior: 'repair', aggressiveWhenDamaged: true },
        { type: 'steam-monster', x: 600, y: 320, behavior: 'emerge', emergesFromVents: true },
        { type: 'core-guardian', x: 700, y: 250, behavior: 'boss', industrialWeapons: true, boss: true }
      ],
      objectives: {
        coins: 8,
        powerUps: 2,
        goal: { type: 'core-shutdown', x: 750, y: 280 }
      }
    },

    {
      theme: 'old-brother-core',
      phaseNumber: 106,
      type: 'elevator-vertical',
      name: 'Ascensor do Sistema Central',
      description: 'Fase vertical em um elevador industrial com múltiplos andares',
      mechanics: {
        gravity: 0.8,
        playerSpeed: 4,
        cameraFollow: 'elevator',
        wrapAround: false,
        elevatorSpeed: 1.0,
        elevatorDirection: 'up',
        canChangeDirection: true,
        floorHazards: true
      },
      environment: {
        background: {
          layers: [
            { color: '#1C1C1C', type: 'elevator-shaft' },
            { type: 'cables', density: 0.6, moving: true },
            { type: 'floor-indicators', floors: 10, indicators: [
              { floor: 1, label: 'MAINTENANCE' },
              { floor: 2, label: 'SECURITY' },
              { floor: 3, label: 'RESEARCH' },
              { floor: 4, label: 'CONTROL' },
              { floor: 5, label: 'CORE' }
            ] },
            { type: 'emergency-lights', density: 0.4, blinking: true }
          ]
        },
        platforms: [
          { type: 'elevator-platform', x: 300, y: 500, width: 200, height: 40, moving: true },
          { type: 'floor-platform-1', x: 100, y: 400, width: 80, height: 30, floor: 1 },
          { type: 'floor-platform-2', x: 500, y: 350, width: 80, height: 30, floor: 2 },
          { type: 'floor-platform-3', x: 200, y: 300, width: 80, height: 30, floor: 3 },
          { type: 'floor-platform-4', x: 450, y: 250, width: 80, height: 30, floor: 4 },
          { type: 'core-platform', x: 300, y: 150, width: 200, height: 50, floor: 5 }
        ],
        interactive: [
          { type: 'floor-button-1', x: 350, y: 470, floor: 1 },
          { type: 'floor-button-2', x: 380, y: 470, floor: 2 },
          { type: 'emergency-stop', x: 410, y: 470 },
          { type: 'security-keypad', x: 500, y: 320, floor: 2 },
          { type: 'research-data', x: 200, y: 270, floor: 3 },
          { type: 'control-terminal', x: 450, y: 220, floor: 4 },
          { type: 'core-access', x: 350, y: 120, floor: 5 }
        ],
        weather: { type: 'mechanical-failure', intensity: 0.5, visualEffect: 'sparks' }
      },
      enemies: [
        { type: 'floor-guard-1', x: 150, y: 370, behavior: 'patrol', floor: 1 },
        { type: 'security-bot-2', x: 550, y: 320, behavior: 'scan', floor: 2 },
        { type: 'lab-creature-3', x: 250, y: 270, behavior: 'experimental', floor: 3 },
        { type: 'control-drones-4', x: 500, y: 220, behavior: 'swarm', floor: 4 },
        { type: 'system-overseer', x: 300, y: 100, behavior: 'boss', controlsElevator: true, boss: true }
      ],
      objectives: {
        coins: 6,
        powerUps: 1,
        goal: { type: 'system-core', x: 300, y: 100 }
      }
    }
  ];

  const registry = Object.create(null);

  function _themeKey(theme) {
    return String(theme || '').toLowerCase();
  }

  function _getBucket(themeId) {
    const t = _themeKey(themeId);
    if (!t) return null;
    registry[t] = registry[t] || Object.create(null);
    return registry[t];
  }

  // register(themeId, phaseNumber, cfg) OU register(cfgObj)
  function register(themeId, phaseNumber, cfg) {
    let t = themeId;
    let n = phaseNumber;
    let c = cfg;

    if (themeId && typeof themeId === 'object') {
      c = themeId;
      t = c.theme;
      n = c.phaseNumber;
    }

    const bucket = _getBucket(t);
    const num = Number(n);
    if (!bucket || !Number.isFinite(num)) return false;

    bucket[num] = c || null;
    _persist();
    return true;
  }

  function loadSpecialPhase(themeId, phaseNumber) {
    const t = _themeKey(themeId);
    const n = Number(phaseNumber);
    if (!t || !Number.isFinite(n)) return null;
    return (registry[t] && registry[t][n]) ? registry[t][n] : null;
  }

  // Aplica uma config no level atual.
  // - Mantém suporte ao formato antigo ({patch}/{apply})
  // - E injeta metadados/mecânicas do formato novo
  function applyToLevel(level, cfg) {
    if (!level || !cfg) return level;

    // formato antigo (patch)
    try {
      if (cfg.patch && typeof cfg.patch === 'object') {
        const p = cfg.patch;
        for (const k of Object.keys(p)) {
          if (p[k] !== undefined) level[k] = p[k];
        }
      }
    } catch (_) {}

    // formato antigo (hook)
    try {
      if (typeof cfg.apply === 'function') {
        cfg.apply(level, {
          Platform: window.SuperBario99?.levelsV2?.Platform,
          Coin: window.SuperBario99?.levelsV2?.Coin,
          Hazard: window.SuperBario99?.levelsV2?.Hazard,
          Goal: window.SuperBario99?.levelsV2?.Goal
        });
      }
    } catch (_) {}

    // formato novo (metadados)
    try {
      const mech = (cfg.mechanics && typeof cfg.mechanics === 'object') ? cfg.mechanics : null;
      level._sb99Mechanics = mech ? { ...mech } : null;

      // Mantém o resto da config acessível ao engine (sem exigir implementação total agora)
      // Importante: clona para evitar mutação acidental do registry.
      try {
        level._sb99Environment = (cfg.environment && typeof cfg.environment === 'object')
          ? JSON.parse(JSON.stringify(cfg.environment))
          : null;
      } catch (_) {
        level._sb99Environment = null;
      }

      try {
        level._sb99SpecialEnemies = Array.isArray(cfg.enemies)
          ? JSON.parse(JSON.stringify(cfg.enemies))
          : null;
      } catch (_) {
        level._sb99SpecialEnemies = null;
      }

      level._sb99Special = {
        theme: String(cfg.theme || level.aestheticId || level.themeId || ''),
        phaseNumber: Number(cfg.phaseNumber) || null,
        type: String(cfg.type || 'special'),
        name: String(cfg.name || ''),
        description: String(cfg.description || ''),
        tag: String(cfg.tag || '')
      };
    } catch (_) {}

    return level;
  }

  function getPhasesByTheme(themeId) {
    const t = _themeKey(themeId);
    const m = registry[t];
    if (!m) return [];
    return Object.keys(m).map((k) => Number(k)).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  }

  function getPhasesByType(type) {
    const want = String(type || '').toLowerCase();
    const out = [];
    for (const t of Object.keys(registry)) {
      const m = registry[t];
      if (!m) continue;
      for (const k of Object.keys(m)) {
        const n = Number(k);
        const cfg = m[k];
        if (!cfg) continue;
        if (String(cfg.type || '').toLowerCase() === want) out.push({ themeId: t, phase: n, cfg });
      }
    }
    return out;
  }

  function _persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(registry));
    } catch (_) {}
  }

  function _load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      for (const t of Object.keys(data)) {
        registry[t] = data[t];
      }
    } catch (_) {}
  }

  function _seedBuiltin() {
    // Carrega overrides do storage primeiro (para não sobrescrever customização do usuário)
    _load();

    // Depois injeta builtin apenas se ainda não existir entrada naquele tema/fase
    for (const p of specialPhases) {
      if (!p || typeof p !== 'object') continue;
      const t = _themeKey(p.theme);
      const n = Number(p.phaseNumber);
      if (!t || !Number.isFinite(n)) continue;
      registry[t] = registry[t] || Object.create(null);
      if (!registry[t][n]) registry[t][n] = p;
    }
  }

  _seedBuiltin();

  console.log('Configuração de fases especiais carregada com sucesso! Total de fases:', specialPhases.length);

  return {
    specialPhases,
    register,
    loadSpecialPhase,
    applyToLevel,
    getPhasesByTheme,
    getPhasesByType
  };
})();
