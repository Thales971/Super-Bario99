// Theme Manager (v2)
// Responsável por aplicar estética visual (UI + efeitos) por fase.
// - Sem ES Modules (compatível com file://)
// - Fallbacks para browsers antigos (Chrome 80+, Safari 14+)

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const util = SuperBario99.util;

  // -----------------------------
  // Configurações de estética
  // -----------------------------
  // Observação importante:
  // As fontes listadas podem não existir no dispositivo. Por isso, sempre há fallbacks.
  const THEMES = {
    'japan-retro': {
      id: 'japan-retro',
      name: 'Japão Retro',
      ui: {
        fontFamily: "'Segoe UI', Arial, sans-serif",
        uiSize: 22,
        titleSize: 46,
        textColor: '#ffffff',
        textShadow: '0 2px 8px rgba(0,0,0,0.55)',
        radius: 18,
        panelBg: 'rgba(0,0,0,0.45)',
        panelBlur: 6,
        panelBorder: 'rgba(255,182,213,0.35)',
        buttonBg: 'linear-gradient(45deg, rgba(255,182,213,0.90) 0%, rgba(255,238,246,0.90) 100%)',
        buttonText: '#2b2b2b'
      },
      palette: {
        skyTop: '#ffb6d5',
        skyBottom: '#ffeef6',
        accent: '#c0392b',
        highlight: '#ffd27d'
      },
      effects: {
        softGlow: true,
        scanlines: false,
        vhsGlitch: false
      }
    },

    'windows-xp': {
      id: 'windows-xp',
      name: 'Windows XP',
      ui: {
        fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif",
        uiSize: 18,
        titleSize: 36,
        textColor: '#000000',
        textShadow: 'none',
        radius: 10,
        panelBg: 'rgba(236,233,216,0.92)',
        panelBlur: 6,
        panelBorder: 'rgba(0,85,229,0.50)',
        buttonBg: 'linear-gradient(180deg, #65B9FF 0%, #0055E5 100%)',
        buttonText: '#ffffff'
      },
      palette: {
        skyTop: '#65B9FF',
        skyBottom: '#0055E5',
        accent: '#00CC00',
        warn: '#FFD700',
        surface: '#ECE9D8'
      },
      effects: {
        softGlow: false,
        scanlines: false,
        vhsGlitch: false
      }
    },

    'fruitiger-aero': {
      id: 'fruitiger-aero',
      name: 'Fruitiger Aero',
      ui: {
        fontFamily: "'Segoe UI', Arial, sans-serif",
        uiSize: 24,
        titleSize: 48,
        textColor: '#ffffff',
        textShadow: '0 0 0 #0000',
        radius: 24,
        panelBg: 'rgba(255,255,255,0.18)',
        panelBlur: 10,
        panelBorder: 'rgba(30,144,255,0.55)',
        buttonBg: 'linear-gradient(45deg, #87CEEB 0%, #1E90FF 100%)',
        buttonText: '#ffffff'
      },
      palette: {
        skyTop: '#87CEEB',
        skyBottom: '#1E90FF',
        accent: '#FF69B4',
        highlight: '#FFD700',
        snow: 'rgba(255,255,255,0.10)'
      },
      effects: {
        softGlow: true,
        scanlines: false,
        vhsGlitch: false
      }
    },

    'fruitiger-ocean': {
      id: 'fruitiger-ocean',
      name: 'Fruitiger Ocean',
      ui: {
        fontFamily: "'Segoe UI', Arial, sans-serif",
        uiSize: 24,
        titleSize: 48,
        textColor: '#ffffff',
        textShadow: '0 2px 10px rgba(0,0,0,0.45)',
        radius: 24,
        panelBg: 'rgba(255,255,255,0.16)',
        panelBlur: 10,
        panelBorder: 'rgba(30,144,255,0.55)',
        buttonBg: 'linear-gradient(45deg, #00CED1 0%, #1E90FF 100%)',
        buttonText: '#ffffff'
      },
      palette: {
        skyTop: '#00CED1',
        skyBottom: '#1E90FF',
        accent: '#FFD700',
        highlight: '#ffffff'
      },
      effects: {
        softGlow: true,
        scanlines: false,
        vhsGlitch: false
      }
    },

    'fruitiger-sunset': {
      id: 'fruitiger-sunset',
      name: 'Fruitiger Sunset',
      ui: {
        fontFamily: "'Segoe UI', Arial, sans-serif",
        uiSize: 24,
        titleSize: 48,
        textColor: '#ffffff',
        textShadow: '0 2px 10px rgba(0,0,0,0.50)',
        radius: 24,
        panelBg: 'rgba(0,0,0,0.35)',
        panelBlur: 8,
        panelBorder: 'rgba(255,215,0,0.25)',
        buttonBg: 'linear-gradient(45deg, #FF6347 0%, #FFA500 100%)',
        buttonText: '#ffffff'
      },
      palette: {
        skyTop: '#FF6347',
        skyBottom: '#FFD700',
        accent: '#FFA500',
        highlight: '#ffffff'
      },
      effects: {
        softGlow: true,
        scanlines: false,
        vhsGlitch: false
      }
    },

    'fruitiger-neon': {
      id: 'fruitiger-neon',
      name: 'Fruitiger Neon',
      ui: {
        fontFamily: "'Segoe UI', Arial, sans-serif",
        uiSize: 22,
        titleSize: 46,
        textColor: '#ffffff',
        textShadow: '0 0 12px rgba(0,255,255,0.25)',
        radius: 18,
        panelBg: 'rgba(0,0,0,0.55)',
        panelBlur: 6,
        panelBorder: 'rgba(0,255,255,0.25)',
        buttonBg: 'linear-gradient(45deg, #FF00FF 0%, #00FFFF 100%)',
        buttonText: '#ffffff'
      },
      palette: {
        skyTop: '#000000',
        skyBottom: '#000000',
        accent: '#00FFFF',
        highlight: '#FF00FF'
      },
      effects: {
        softGlow: true,
        scanlines: true,
        vhsGlitch: true
      }
    },

    'fruitiger-forest': {
      id: 'fruitiger-forest',
      name: 'Fruitiger Forest',
      ui: {
        fontFamily: "'Segoe UI', Arial, sans-serif",
        uiSize: 24,
        titleSize: 48,
        textColor: '#F5F5DC',
        textShadow: '0 2px 10px rgba(0,0,0,0.55)',
        radius: 18,
        panelBg: 'rgba(0,0,0,0.45)',
        panelBlur: 6,
        panelBorder: 'rgba(255,215,0,0.18)',
        buttonBg: 'linear-gradient(45deg, #228B22 0%, #8B4513 100%)',
        buttonText: '#F5F5DC'
      },
      palette: {
        skyTop: '#228B22',
        skyBottom: '#145a22',
        accent: '#FFD700',
        highlight: '#F5F5DC'
      },
      effects: {
        softGlow: false,
        scanlines: false,
        vhsGlitch: false
      }
    },

    'fruitiger-galaxy': {
      id: 'fruitiger-galaxy',
      name: 'Fruitiger Galaxy',
      ui: {
        fontFamily: "'Segoe UI', Arial, sans-serif",
        uiSize: 22,
        titleSize: 46,
        textColor: '#ffffff',
        textShadow: '0 2px 12px rgba(0,0,0,0.60)',
        radius: 18,
        panelBg: 'rgba(0,0,0,0.50)',
        panelBlur: 8,
        panelBorder: 'rgba(255,215,0,0.20)',
        buttonBg: 'linear-gradient(45deg, #4B0082 0%, #00008B 100%)',
        buttonText: '#ffffff'
      },
      palette: {
        skyTop: '#0b0014',
        skyBottom: '#00008B',
        accent: '#FFD700',
        highlight: '#ffffff'
      },
      effects: {
        softGlow: true,
        scanlines: false,
        vhsGlitch: false
      }
    },

    'caos-final': {
      id: 'caos-final',
      name: 'Caos Final',
      ui: {
        fontFamily: "'Segoe UI', Arial, sans-serif",
        uiSize: 22,
        titleSize: 46,
        textColor: '#ffffff',
        textShadow: '0 2px 14px rgba(0,0,0,0.65)',
        radius: 18,
        panelBg: 'rgba(0,0,0,0.55)',
        panelBlur: 8,
        panelBorder: 'rgba(255,255,255,0.18)',
        buttonBg: 'linear-gradient(45deg, #FF00FF 0%, #00FFFF 50%, #FFD700 100%)',
        buttonText: '#ffffff'
      },
      palette: {
        skyTop: '#000000',
        skyBottom: '#111111',
        accent: '#FFD700',
        highlight: '#ffffff'
      },
      effects: {
        softGlow: true,
        scanlines: true,
        vhsGlitch: true
      }
    },

    'tecno-zen': {
      id: 'tecno-zen',
      name: 'Tecno Zen',
      ui: {
        fontFamily: "'Orbitron', 'Segoe UI', Arial, sans-serif",
        uiSize: 20,
        titleSize: 44,
        textColor: '#F0F0F0',
        textShadow: '0 0 10px rgba(0,255,255,0.25)',
        radius: 14,
        panelBg: 'rgba(0,0,0,0.55)',
        panelBlur: 6,
        panelBorder: 'rgba(0,255,255,0.35)',
        buttonBg: 'linear-gradient(45deg, #8A2BE2 0%, #00BFFF 100%)',
        buttonText: '#F0F0F0'
      },
      palette: {
        skyTop: '#000000',
        skyBottom: '#08111b',
        accent: '#39FF14',
        cyan: '#00FFFF',
        purple: '#8A2BE2'
      },
      effects: {
        softGlow: true,
        scanlines: false,
        vhsGlitch: false
      }
    },

    'dorfic': {
      id: 'dorfic',
      name: 'Dorfic',
      ui: {
        fontFamily: "'MedievalSharp', Georgia, 'Times New Roman', serif",
        uiSize: 24,
        titleSize: 48,
        textColor: '#D4AF37',
        textShadow: '0 0 14px rgba(0,0,0,0.65)',
        radius: 12,
        panelBg: 'rgba(0,0,0,0.50)',
        panelBlur: 4,
        panelBorder: 'rgba(212,175,55,0.30)',
        buttonBg: 'linear-gradient(45deg, #556B2F 0%, #228B22 100%)',
        buttonText: '#F0E68C'
      },
      palette: {
        skyTop: '#556B2F',
        skyBottom: '#228B22',
        bark: '#8B4513',
        stone: '#696969',
        sun: '#F0E68C'
      },
      effects: {
        softGlow: false,
        scanlines: false,
        vhsGlitch: false
      }
    },

    'metro-aero': {
      id: 'metro-aero',
      name: 'Metro Aero',
      ui: {
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        uiSize: 20,
        titleSize: 40,
        textColor: '#ffffff',
        textShadow: '0 0 0 #0000',
        radius: 6,
        panelBg: 'rgba(10,10,10,0.65)',
        panelBlur: 2,
        panelBorder: 'rgba(0,102,204,0.45)',
        buttonBg: 'linear-gradient(45deg, #0066CC 0%, #00BFFF 100%)',
        buttonText: '#ffffff'
      },
      palette: {
        skyTop: '#0A0A0A',
        skyBottom: '#0066CC',
        silver: '#C0C0C0',
        neon: '#39FF14',
        blue: '#00BFFF'
      },
      effects: {
        softGlow: false,
        scanlines: false,
        vhsGlitch: false
      }
    },

    'vaporwave': {
      id: 'vaporwave',
      name: 'Vaporwave',
      ui: {
        fontFamily: "'VT323', 'Courier New', monospace",
        uiSize: 22,
        titleSize: 50,
        textColor: '#FF00FF',
        textShadow: '0 0 12px rgba(255,0,255,0.45)',
        radius: 10,
        panelBg: 'rgba(0,0,0,0.55)',
        panelBlur: 2,
        panelBorder: 'rgba(0,255,255,0.30)',
        buttonBg: 'linear-gradient(45deg, #FF00FF 0%, #800080 100%)',
        buttonText: '#00FFFF'
      },
      palette: {
        skyTop: '#800080',
        skyBottom: '#000000',
        magenta: '#FF00FF',
        cyan: '#00FFFF',
        gold: '#D4AF37'
      },
      effects: {
        softGlow: true,
        scanlines: true,
        vhsGlitch: true
      }
    },

    'aurora-aero': {
      id: 'aurora-aero',
      name: 'Aurora Aero',
      ui: {
        fontFamily: "'Exo 2', 'Segoe UI', Arial, sans-serif",
        uiSize: 26,
        titleSize: 52,
        textColor: '#ffffff',
        textShadow: '0 0 16px rgba(255,255,255,0.40)',
        radius: 18,
        panelBg: 'rgba(25,25,112,0.45)',
        panelBlur: 8,
        panelBorder: 'rgba(255,215,0,0.25)',
        buttonBg: 'linear-gradient(45deg, #7FFF00 0%, #FF69B4 100%)',
        buttonText: '#ffffff'
      },
      palette: {
        skyTop: '#191970',
        skyBottom: '#000010',
        auroraGreen: '#7FFF00',
        auroraPink: '#FF69B4',
        star: '#FFD700',
        nebula: '#9400D3'
      },
      effects: {
        softGlow: true,
        scanlines: false,
        vhsGlitch: false
      }
    },

    'windows-vista': {
      id: 'windows-vista',
      name: 'Windows Vista',
      ui: {
        fontFamily: "'Segoe UI', Arial, sans-serif",
        uiSize: 20,
        titleSize: 40,
        textColor: '#ffffff',
        textShadow: '0 0 14px rgba(0,0,0,0.55)',
        radius: 18,
        panelBg: 'rgba(0,0,0,0.38)',
        panelBlur: 10,
        panelBorder: 'rgba(0,120,215,0.45)',
        buttonBg: 'linear-gradient(45deg, rgba(0,120,215,0.95) 0%, rgba(65,105,225,0.95) 100%)',
        buttonText: '#ffffff'
      },
      palette: {
        skyTop: '#4169E1',
        skyBottom: '#0078D7',
        silver: '#C0C0C0',
        overlay: 'rgba(0,0,0,0.70)'
      },
      effects: {
        softGlow: true,
        scanlines: false,
        vhsGlitch: false
      }
    }
  };

  // -----------------------------
  // Mapeamento por fase
  // -----------------------------
  // levelIndex: 0..(N-1)
  function getAestheticIdForLevel(levelIndex) {
    // Mapeamento “Infinity Dimensions” (100 fases) conforme tabela:
    // 1–10 Japão Retro
    // 11–20 Fruitiger Aero Original
    // 21–30 Dorfic
    // 31–40 Metro Aero
    // 41–49 Vaporwave
    // 50–59 Fruitiger Ocean
    // 60–69 Fruitiger Sunset
    // 70–79 Fruitiger Neon
    // 80–89 Fruitiger Forest
    // 90–99 Fruitiger Galaxy
    // 100 Caos Final
    const i = util.clamp(levelIndex | 0, 0, 99);
    const phase = i + 1;

    if (phase <= 10) return 'japan-retro';
    if (phase <= 20) return 'fruitiger-aero';
    if (phase <= 30) return 'dorfic';
    if (phase <= 40) return 'metro-aero';
    if (phase <= 49) return 'vaporwave';
    if (phase <= 59) return 'fruitiger-ocean';
    if (phase <= 69) return 'fruitiger-sunset';
    if (phase <= 79) return 'fruitiger-neon';
    if (phase <= 89) return 'fruitiger-forest';
    if (phase <= 99) return 'fruitiger-galaxy';
    return 'caos-final';
  }

  function getThemeConfig(aestheticId) {
    return THEMES[aestheticId] || THEMES['windows-xp'];
  }

  function _setCssVar(root, key, value) {
    try {
      root.style.setProperty(key, value);
    } catch (_) {
      // ignore
    }
  }

  function applyTheme(aestheticId) {
    const cfg = getThemeConfig(aestheticId);
    const root = document.documentElement;
    const body = document.body;

    if (body) {
      body.setAttribute('data-aesthetic', cfg.id);
    }

    // UI vars
    _setCssVar(root, '--ui-font-family', cfg.ui.fontFamily);
    _setCssVar(root, '--ui-font-size', String(cfg.ui.uiSize) + 'px');
    _setCssVar(root, '--ui-title-size', String(cfg.ui.titleSize) + 'px');
    _setCssVar(root, '--ui-text-color', cfg.ui.textColor);
    _setCssVar(root, '--ui-text-shadow', cfg.ui.textShadow);
    _setCssVar(root, '--ui-radius', String(cfg.ui.radius) + 'px');
    _setCssVar(root, '--ui-panel-bg', cfg.ui.panelBg);
    _setCssVar(root, '--ui-panel-border', cfg.ui.panelBorder);
    _setCssVar(root, '--ui-panel-blur', String(cfg.ui.panelBlur) + 'px');
    _setCssVar(root, '--ui-button-bg', cfg.ui.buttonBg);
    _setCssVar(root, '--ui-button-text', cfg.ui.buttonText);

    // Base background (do body)
    const p = cfg.palette;
    const bodyBg = `linear-gradient(135deg, ${p.skyTop} 0%, ${p.skyBottom} 100%)`;
    _setCssVar(root, '--page-bg', bodyBg);

    return cfg;
  }

  function applyThemeForLevel(levelIndex) {
    return applyTheme(getAestheticIdForLevel(levelIndex));
  }

  // -----------------------------
  // Efeitos Canvas (overlay)
  // -----------------------------
  function drawOverlay(ctx, canvas, aestheticId, nowMs, intensity01) {
    const cfg = getThemeConfig(aestheticId);
    const inten = util.clamp(intensity01 == null ? 1 : intensity01, 0, 1);

    // Fruitiger: luz suave global
    if (aestheticId === 'fruitiger-aero' || String(aestheticId).startsWith('fruitiger-')) {
      ctx.fillStyle = `rgba(255,255,255,${0.05 * inten})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Ocean: bolhas
    if (aestheticId === 'fruitiger-ocean') {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      const t = nowMs * 0.001;
      for (let i = 0; i < 18; i++) {
        const x = (i * 70 + (t * 30)) % (canvas.width + 50) - 25;
        const y = canvas.height - ((i * 42 + (t * 80)) % (canvas.height + 60));
        const r = 2 + (i % 4);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Sunset: raios de sol
    if (aestheticId === 'fruitiger-sunset') {
      ctx.fillStyle = `rgba(255,215,0,${0.06 * inten})`;
      for (let i = 0; i < 5; i++) {
        const sx = 80 + i * 170;
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx + 80, 0);
        ctx.lineTo(sx + 30, 260);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Forest: neblina leve
    if (aestheticId === 'fruitiger-forest') {
      const fog = ctx.createLinearGradient(0, canvas.height * 0.55, 0, canvas.height);
      fog.addColorStop(0, 'rgba(255,255,255,0.00)');
      fog.addColorStop(1, `rgba(245,245,220,${0.10 * inten})`);
      ctx.fillStyle = fog;
      ctx.fillRect(0, canvas.height * 0.55, canvas.width, canvas.height * 0.45);
    }

    // Galaxy: estrelas cintilantes
    if (aestheticId === 'fruitiger-galaxy') {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (let i = 0; i < 46; i++) {
        const x = (i * 37 + (nowMs * 0.03)) % canvas.width;
        const y = (i * 19) % (canvas.height * 0.6);
        const s = (i % 3) + 1;
        ctx.fillRect(x, y, s, s);
      }
    }

    // Vaporwave: scanlines
    if (cfg.effects.scanlines) {
      ctx.fillStyle = `rgba(0,0,0,${0.14 * inten})`;
      for (let y = 0; y < canvas.height; y += 3) {
        ctx.fillRect(0, y, canvas.width, 1);
      }
    }

    // Vaporwave: glitch ocasional (10% do tempo)
    if (cfg.effects.vhsGlitch) {
      const t = Math.floor(nowMs / 200) % 10;
      if (t === 0) {
        ctx.fillStyle = `rgba(0,0,0,${0.12 * inten})`;
        for (let i = 0; i < 10; i++) {
          const h = 6 + (i % 3) * 4;
          const y = (i * 36) % canvas.height;
          const x = ((nowMs * 0.12) + i * 40) % canvas.width;
          ctx.fillRect(x - 80, y, 160, h);
        }
      }
    }
  }

  // -----------------------------
  // Mini “testes inline” (sem framework)
  // -----------------------------
  function _runInlineTests() {
    try {
      // Teste: mapping 1..100
      const a1 = getAestheticIdForLevel(0);
      const a10 = getAestheticIdForLevel(9);
      const a11 = getAestheticIdForLevel(10);
      const a49 = getAestheticIdForLevel(48);
      const a50 = getAestheticIdForLevel(49);
      const a99 = getAestheticIdForLevel(98);
      const a100 = getAestheticIdForLevel(99);
      if (a1 !== 'japan-retro') throw new Error('Teste falhou: fase 1 deveria ser Japão Retro');
      if (a10 !== 'japan-retro') throw new Error('Teste falhou: fase 10 deveria ser Japão Retro');
      if (a11 !== 'fruitiger-aero') throw new Error('Teste falhou: fase 11 deveria ser Fruitiger Aero');
      if (a49 !== 'vaporwave') throw new Error('Teste falhou: fase 49 deveria ser Vaporwave');
      if (a50 !== 'fruitiger-ocean') throw new Error('Teste falhou: fase 50 deveria ser Fruitiger Ocean');
      if (a99 !== 'fruitiger-galaxy') throw new Error('Teste falhou: fase 99 deveria ser Fruitiger Galaxy');
      if (a100 !== 'caos-final') throw new Error('Teste falhou: fase 100 deveria ser Caos Final');
    } catch (e) {
      console.warn('[ThemeManager] testes inline falharam:', e);
    }
  }

  SuperBario99.themes = {
    THEMES,
    getAestheticIdForLevel,
    getThemeConfig,
    applyTheme,
    applyThemeForLevel,
    drawOverlay
  };

  // executa testes só uma vez
  _runInlineTests();
})();
