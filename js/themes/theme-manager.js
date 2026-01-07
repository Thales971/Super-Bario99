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
  // levelIndex: 0..49
  function getAestheticIdForLevel(levelIndex) {
    const i = util.clamp(levelIndex | 0, 0, 49);
    const block = Math.floor(i / 5);
    return [
      'windows-xp',
      'fruitiger-aero',
      'tecno-zen',
      'dorfic',
      'metro-aero',
      'vaporwave',
      'aurora-aero',
      'windows-vista',
      'vaporwave',
      'aurora-aero'
    ][block] || 'windows-xp';
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
    if (aestheticId === 'fruitiger-aero') {
      ctx.fillStyle = `rgba(255,255,255,${0.05 * inten})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
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
      // Teste: mapping 1..50
      const a1 = getAestheticIdForLevel(0);
      const a6 = getAestheticIdForLevel(5);
      const a35 = getAestheticIdForLevel(34);
      const a36 = getAestheticIdForLevel(35);
      const a50 = getAestheticIdForLevel(49);
      if (a1 !== 'windows-xp') throw new Error('Teste falhou: fase 1 deveria ser Windows XP');
      if (a6 !== 'fruitiger-aero') throw new Error('Teste falhou: fase 6 deveria ser Fruitiger Aero');
      if (a35 !== 'aurora-aero') throw new Error('Teste falhou: fase 35 deveria ser Aurora Aero');
      if (a36 !== 'windows-vista') throw new Error('Teste falhou: fase 36 deveria ser Windows Vista');
      if (a50 !== 'aurora-aero') throw new Error('Teste falhou: fase 50 deveria ser Aurora Aero');
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
