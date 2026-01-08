// Lore/NPC v2: 2 NPCs por fase (geração determinística)

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const util = SuperBario99.util;

  function _hashStr32(str) {
    const s = String(str || '');
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function _rngFrom(levelIndex, aestheticId) {
    let seed = ((levelIndex + 1) * 1103515245) ^ _hashStr32(aestheticId);
    seed >>>= 0;
    return () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function _pick(rng, arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(rng() * arr.length) % arr.length];
  }

  function _formatAesthetic(aestheticId) {
    const a = String(aestheticId || 'japan');
    if (a === 'japan-retro' || a === 'japan') return 'Japão Retro';
    if (a === 'tecno-zen' || a === 'tecnozen') return 'Tecno-Zen';
    if (a === 'dorfic') return 'Dórfica';
    if (a === 'metro-aero' || a === 'metro') return 'Metrô-Aero';
    if (a === 'evil') return 'Evil';
    if (a === 'memefusion') return 'MemeFusion';
    if (a === 'vaporwave') return 'Vaporwave';
    if (a === 'aurora-aero') return 'Aurora-Aero';
    if (a === 'windows-xp') return 'Windows XP';
    if (a === 'windows-vista') return 'Windows Vista';
    if (a === 'fruitiger' || a === 'fruitiger-aero') return 'Fruitiger Aero';
    if (a.startsWith('fruitiger-')) return 'Fruitiger';
    if (a === 'caos-final') return 'Caos Final';
    return a;
  }

  function _aestheticKey(aestheticId) {
    const v = String(aestheticId || '').toLowerCase();
    if (v.includes('japan')) return 'japan';
    if (v.includes('tecno') || v.includes('zen')) return 'tecnozen';
    if (v.includes('dorfic')) return 'dorfic';
    if (v.includes('metro')) return 'metro';
    if (v.includes('evil')) return 'evil';
    if (v.includes('memefusion')) return 'memefusion';
    if (v.includes('vapor')) return 'vaporwave';
    if (v.includes('aurora')) return 'aurora';
    if (v.includes('vista')) return 'vista';
    if (v.includes('windows') || v.includes('xp')) return 'xp';
    if (v.includes('fruitiger')) return 'fruitiger';
    if (v.includes('caos')) return 'caos';
    return 'generic';
  }

  function getNpcConfigsForLevel(levelIndex, aestheticId, level, bossCfg) {
    const rng = _rngFrom(levelIndex, aestheticId);
    const prettyAesthetic = _formatAesthetic(aestheticId);
    const aKey = _aestheticKey(aestheticId);

    const archetypesA = [
      { name: 'Cartógrafa do Loop', voice: 'map' },
      { name: 'Engenheiro de Portais', voice: 'engine' },
      { name: 'Monge do Cache', voice: 'monk' },
      { name: 'Colecionadora de Glitch', voice: 'glitch' },
      { name: 'Vigilante da Fase', voice: 'guard' },
      { name: 'Arqueóloga de Pixels', voice: 'arch' }
    ];

    const archetypesB = [
      { name: 'Viajante Sem Save', voice: 'wander' },
      { name: 'Mensageira da Dimensão', voice: 'messenger' },
      { name: 'Observador do HUD', voice: 'observer' },
      { name: 'Ferreiro de Frames', voice: 'smith' },
      { name: 'Testemunha do Boss', voice: 'witness' },
      { name: 'Luthier de SFX', voice: 'audio' }
    ];

    const a = _pick(rng, archetypesA);
    const b = _pick(rng, archetypesB);

    const chapter = `Fase ${levelIndex + 1}`;
    const dimension = `Dimensão ${prettyAesthetic}`;

    // Progressão simples (sem precisar de save/lore global): 3 atos
    const act = (levelIndex < 33) ? 1 : (levelIndex < 66 ? 2 : 3);
    const decade = Math.floor((levelIndex + 1) / 10);

    const isBossLevel = !!bossCfg;
    const bossName = bossCfg?.name ? String(bossCfg.name) : null;
    const weakness = bossCfg?.weakness ? String(bossCfg.weakness) : null;

    // 20%: um deles é disfarçado (fala estranho, mas continua humano e não quebra UX)
    const disguised = (rng() < 0.20);

    const hintWeak = (() => {
      if (!weakness) return null;
      const map = {
        melee: 'golpe corpo-a-corpo',
        fire: 'fogo',
        ice: 'gelo',
        electric: 'eletricidade',
        cosmic: 'energia cósmica'
      };
      return map[weakness] || weakness;
    })();

    const motifs = {
      japan: {
        nouns: ['lanternas', 'sakura', 'máscaras', 'torii', 'salas de tatame'],
        verbs: ['silenciam', 'observam', 'lembram', 'inclinam', 'enganam'],
        rules: [
          'O caminho certo parece simples; o errado parece rápido.',
          'Quando o vento muda, o timing muda junto.'
        ]
      },
      tecnozen: {
        nouns: ['protocolos', 'mantras', 'buffers', 'pings', 'linhas de comando'],
        verbs: ['sincronizam', 'atrasam', 'corrigem', 'repetem', 'recusam'],
        rules: [
          'Respirar é resetar o ruído.',
          'O mundo te testa quando você tenta “forçar” o frame perfeito.'
        ]
      },
      dorfic: {
        nouns: ['pedra', 'raízes', 'eco', 'pilares', 'poeira antiga'],
        verbs: ['pesam', 'protegem', 'racham', 'seguram', 'cobram'],
        rules: [
          'Se você cair, caia aprendendo onde o chão volta.',
          'Não lute contra a gravidade: use ela como alavanca.'
        ]
      },
      metro: {
        nouns: ['trilhos', 'placas', 'neon', 'túneis', 'anúncios'],
        verbs: ['apressam', 'distraem', 'arrastam', 'piscam', 'guiam'],
        rules: [
          'O metrô premia quem lê sinais no canto do olho.',
          'O risco não está no salto; está na pressa após o salto.'
        ]
      },
      evil: {
        nouns: ['sussurros', 'brasas', 'fendas', 'sombras', 'promessas'],
        verbs: ['chamam', 'cobram', 'mentem', 'marcam', 'seguem'],
        rules: [
          'Medo é um debuff invisível. Reconheça e ele perde força.',
          'O silêncio aqui é uma armadilha com voz baixa.'
        ]
      },
      vaporwave: {
        nouns: ['memória', 'pôsteres', 'fitas', 'piscinas', 'pastel'],
        verbs: ['derretem', 'repetem', 'brilham', 'apagam', 'voltam'],
        rules: [
          'Se tudo parece familiar, é porque a fase quer que você erre por conforto.',
          'Não confie no “bonito”; confie no consistente.'
        ]
      },
      aurora: {
        nouns: ['horizontes', 'auroras', 'cristais', 'céus frios', 'silhuetas'],
        verbs: ['abrem', 'fecham', 'congelam', 'clareiam', 'enganam'],
        rules: [
          'Visibilidade alta não significa segurança.',
          'O brilho te mostra onde cair — não onde pousar.'
        ]
      },
      xp: {
        nouns: ['janelas', 'atalhos', 'pastas', 'alertas', 'papel de parede'],
        verbs: ['travam', 'carregam', 'salvam', 'duplicam', 'avisam'],
        rules: [
          'Quando o mundo “carrega”, você ganha um micro-respiro. Use.',
          'Se um padrão se repete, ele é um tutorial escondido.'
        ]
      },
      vista: {
        nouns: ['vidro', 'aero', 'brilhos', 'reflexos', 'notificações'],
        verbs: ['disfarçam', 'refletem', 'bloqueiam', 'hipnotizam', 'revelam'],
        rules: [
          'Reflexo bonito costuma esconder hitbox feia.',
          'Clareza vence estilo — mas estilo também pode te distrair.'
        ]
      },
      fruitiger: {
        nouns: ['ícones', 'bolhas', 'gradientes', 'vidros', 'interfaces'],
        verbs: ['flutuam', 'encorajam', 'enganam', 'organizam', 'sugerem'],
        rules: [
          'A dimensão te oferece “conforto” pra abaixar a guarda.',
          'Se parece intuitivo demais, confira duas vezes.'
        ]
      },
      caos: {
        nouns: ['ruído', 'cortes', 'glitches', 'fragmentos', 'ecos quebrados'],
        verbs: ['saltam', 'rasgam', 'invertem', 'desalinham', 'devoram'],
        rules: [
          'No caos, escolha uma regra pequena e siga só ela.',
          'Você não controla tudo — mas controla o próximo salto.'
        ]
      },
      memefusion: {
        nouns: ['referências', 'telas', 'efeitos', 'risos', 'cortes rápidos'],
        verbs: ['explodem', 'distorcem', 'chamam', 'somem', 'voltam'],
        rules: [
          'Se você rir, perdeu 0,2s. Às vezes é o bastante.',
          'O meme é isca: a mecânica é a verdade.'
        ]
      },
      generic: {
        nouns: ['a fase', 'o chão', 'o HUD', 'o loop', 'o silêncio'],
        verbs: ['muda', 'cobra', 'ensina', 'repete', 'resiste'],
        rules: [
          'Olhe o padrão antes de acelerar.',
          'Se doeu, era lição.'
        ]
      }
    };

    const m = motifs[aKey] || motifs.generic;
    const noun = _pick(rng, m.nouns);
    const verb = _pick(rng, m.verbs);
    const rule = _pick(rng, m.rules);

    const linePoolCore = [
      `${dimension} não é cenário: é contrato. E o contrato muda quando você muda de ritmo.`,
      `A fase está contando seus erros — não pra te punir, mas pra te moldar.`,
      `O loop parece eterno porque ele repete até você aprender a mesma coisa de outro jeito.`,
      `O que você chama de azar é só a mesma decisão com outra roupa.`,
      `Aqui, ${noun} ${verb}. Não é poesia: é aviso.`
    ];

    const linePoolAct = (act === 1) ? [
      'No começo, a dimensão finge que é justa.',
      'Você está aprendendo o idioma da hitbox.'
    ] : (act === 2) ? [
      'No meio da jornada, a fase te testa quando você acha que já sabe.',
      'O mundo começa a misturar lições: pulo + timing + nervo.'
    ] : [
      'No fim, a dimensão não quer te matar — quer te convencer a desistir.',
      'Se você chegou até aqui, sua maior arma é a calma.'
    ];

    const linePoolTech = [
      `Regra de bolso: ${rule}`,
      `Se o HUD te distrair, você perde leitura. Se ele te guiar, você ganha tempo.`,
      `Você não está só lutando — está sincronizando com a dimensão e com você mesmo.`
    ];

    const linePoolBoss = isBossLevel ? [
      `Hoje não é uma fase. É um corte na linha do tempo.`,
      `O nome dele é ${bossName}. Ele não é “mais forte”; ele é mais insistente.`,
      hintWeak ? `Se eu tivesse que apostar sua vida: eu apostaria em ${hintWeak}.` : `Não existe truque. Existe leitura: e você aprende rápido.`
    ] : [
      `Os bosses vivem nas bordas do mapa. E as fases normais são a carta que chega antes da guerra.`,
      (decade >= 1 ? 'Você vai começar a ver padrões que não estavam aqui antes. Isso é a história andando.' : 'Ainda é cedo, mas já tem mensagem escondida em cada salto.')
    ];

    const linePoolDisguised = [
      'Chega mais… a fase está “limpa” demais. Limpo demais é armadilha.',
      'Se a música mudar sem motivo, o motivo é você.',
      'Eu não sou daqui. Eu só aprendi a parecer.'
    ];

    const mkLines = (voice, isDisg) => {
      const lines = [];
      lines.push(`${chapter} — ${dimension}.`);

      // 2-3 linhas de “profundidade”
      const picks = [];
      picks.push(_pick(rng, linePoolCore));
      picks.push(_pick(rng, linePoolAct));
      picks.push(_pick(rng, linePoolTech));
      picks.push(_pick(rng, linePoolBoss));

      for (const s of picks) {
        if (s && lines.indexOf(s) < 0) lines.push(s);
      }

      // assinatura
      if (isDisg) {
        for (const s of linePoolDisguised) lines.push(s);
      } else {
        const endingsByVoice = {
          map: 'Se você se perder, volte um passo e olhe o padrão.',
          engine: 'Portais não são portas; são decisões.',
          monk: 'Respira. A fase sempre revela a próxima peça.',
          glitch: 'Nem todo erro é bug. Às vezes é saída.',
          guard: 'Não lute com pressa. Lute com clareza.',
          arch: 'Cada moeda é uma pista. Cada bloco, um símbolo.',
          wander: 'Eu já morri aqui. Você ainda pode aprender sem isso.',
          messenger: 'A próxima dimensão vai tentar te convencer de que você mudou.',
          observer: 'Quando a barra do boss cair, não relaxe. Ele muda antes de cair.',
          smith: 'Seu ataque é simples. Sua intenção não precisa ser.',
          witness: 'Você vai lembrar desse nome. Mesmo que finja que não.',
          audio: 'Escuta o mundo. O som avisa o ataque antes do olho.'
        };
        const end = endingsByVoice[voice] || 'Boa sorte.';
        lines.push(end);
      }

      // garante tamanho razoável (não vira text wall)
      return lines.slice(0, 5);
    };

    const npcA = {
      id: `npc_${levelIndex}_a`,
      name: a.name,
      lines: mkLines(a.voice, false),
      disguised: false,
      variantSeed: (_hashStr32(a.name) ^ (levelIndex * 997)) >>> 0
    };

    const npcB = {
      id: `npc_${levelIndex}_b`,
      name: b.name,
      lines: mkLines(b.voice, disguised),
      disguised,
      variantSeed: (_hashStr32(b.name) ^ (levelIndex * 1319)) >>> 0
    };

    // Em boss level, deixa o “disfarçado” menos frequente (não atrapalhar luta)
    if (isBossLevel && npcB.disguised) {
      npcB.disguised = false;
      npcB.lines = mkLines(b.voice, false);
    }

    return [npcA, npcB];
  }

  SuperBario99.loreV2 = {
    getNpcConfigsForLevel
  };
})();
