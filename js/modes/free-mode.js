// Modo Livre / Criativo (v2)
// UI + preview + presets + slots + compartilhamento.
// Requisitos principais: acessível, responsivo (mobile/desktop), leve e sem impactar o modo principal.

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const util = SuperBario99.util;

  const STORAGE_SLOTS = 'superbario99_free_slots_v1';

  // -----------------------------
  // Util: base64 URL-safe + UTF-8
  // -----------------------------
  function _toBase64Url(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function _fromBase64Url(b64url) {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (b64.length % 4)) % 4;
    const padded = b64 + '='.repeat(padLen);
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function _encodeUtf8(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
    // fallback simples (ASCII)
    const out = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 0xff;
    return out;
  }

  function _decodeUtf8(bytes) {
    if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(bytes);
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return s;
  }

  function encodeShareCode(config) {
    const json = JSON.stringify(config);
    const bytes = _encodeUtf8(json);
    const payload = _toBase64Url(bytes);
    return 'SB99-' + payload;
  }

  function decodeShareCode(code) {
    const trimmed = String(code || '').trim();
    const raw = trimmed.startsWith('SB99-') ? trimmed.slice(5) : trimmed;
    const bytes = _fromBase64Url(raw);
    const json = _decodeUtf8(bytes);
    return JSON.parse(json);
  }

  // -----------------------------
  // Slots (10)
  // -----------------------------
  function _loadSlots() {
    try {
      const raw = localStorage.getItem(STORAGE_SLOTS);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length === 10) return parsed;
    } catch (_) {}
    const slots = [];
    for (let i = 0; i < 10; i++) slots.push({ name: '', config: null, thumb: '' });
    return slots;
  }

  function _saveSlots(slots) {
    try {
      localStorage.setItem(STORAGE_SLOTS, JSON.stringify(slots));
    } catch (e) {
      console.warn('[Modo Livre] Falha ao salvar slots:', e);
    }
  }

  // -----------------------------
  // UI
  // -----------------------------
  class FreeModeUI {
    constructor() {
      this.root = document.getElementById('free-mode');
      this.openBtn = document.getElementById('free-mode-btn');
      this.closeBtn = document.getElementById('free-mode-close');

      this.tabConfig = document.getElementById('fm-tab-config');
      this.tabPreview = document.getElementById('fm-tab-preview');

      this.stageModeSel = document.getElementById('fm-stage-mode');
      this.stageSel = document.getElementById('fm-stage');

      this.aestheticSel = document.getElementById('fm-aesthetic');
      this.effectRange = document.getElementById('fm-effect');

      this.enemyCountRange = document.getElementById('fm-enemy-count');
      this.enemyBehaviorSel = document.getElementById('fm-enemy-behavior');
      this.enemyPoolSel = document.getElementById('fm-enemy-pool');

      this.gravitySel = document.getElementById('fm-gravity');
      this.livesSel = document.getElementById('fm-lives');

      this.presetRelax = document.getElementById('fm-preset-relax');
      this.presetClassic = document.getElementById('fm-preset-classic');
      this.presetHard = document.getElementById('fm-preset-hard');
      this.presetImpossible = document.getElementById('fm-preset-impossible');

      this.slotName = document.getElementById('fm-slot-name');
      this.slotSel = document.getElementById('fm-slot');
      this.saveBtn = document.getElementById('fm-save');
      this.loadBtn = document.getElementById('fm-load');

      this.shareInput = document.getElementById('fm-share-code');
      this.genBtn = document.getElementById('fm-generate');
      this.importBtn = document.getElementById('fm-import');

      this.playBtn = document.getElementById('fm-play');

      this.previewCanvas = document.getElementById('preview-canvas');
      this.pctx = this.previewCanvas.getContext('2d');

      this._slots = _loadSlots();

      this._config = this._defaultConfig();
      this._preview = {
        lastT: 0,
        running: false,
        raf: 0
      };

      this._bind();
      this._populate();
      this._applyConfigToControls();

      this._tryImportFromHash();
    }

    _defaultConfig() {
      // Config inicial “neutra” (não altera o modo principal)
      return {
        mode: 'classic',
        startLevel: 0,
        aestheticId: SuperBario99.themes ? SuperBario99.themes.getAestheticIdForLevel(0) : 'windows-xp',
        effectIntensity: 0.8,
        enemyCount: 14,
        enemyBehavior: 'random',
        enemyPool: 'japanese',
        gravity: 0.8,
        lives: 10
      };
    }

    _bind() {
      if (this.openBtn) {
        this.openBtn.addEventListener('click', () => this.open());
      }
      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', () => this.close());
      }

      // Tabs (mobile)
      if (this.tabConfig && this.tabPreview) {
        this.tabConfig.addEventListener('click', () => this._setPanel('left'));
        this.tabPreview.addEventListener('click', () => this._setPanel('right'));
      }

      // Clique nas cards -> rolar para seção
      this.root?.addEventListener('click', (ev) => {
        const card = ev.target && ev.target.closest ? ev.target.closest('.fm-card') : null;
        const targetId = card && card.getAttribute ? card.getAttribute('data-scroll') : null;
        if (!targetId) return;
        const el = document.getElementById(targetId);
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      const onChange = () => {
        this._readControlsToConfig();
        this._applyThemeForUI();
        this._ensurePreview();
      };

      [
        this.stageModeSel,
        this.stageSel,
        this.aestheticSel,
        this.effectRange,
        this.enemyCountRange,
        this.enemyBehaviorSel,
        this.enemyPoolSel,
        this.gravitySel,
        this.livesSel
      ].forEach((el) => {
        if (!el) return;
        el.addEventListener('change', onChange);
        el.addEventListener('input', onChange);
      });

      // Presets
      this.presetRelax?.addEventListener('click', () => this._applyPreset('relax'));
      this.presetClassic?.addEventListener('click', () => this._applyPreset('classic'));
      this.presetHard?.addEventListener('click', () => this._applyPreset('hard'));
      this.presetImpossible?.addEventListener('click', () => this._applyPreset('impossible'));

      // Slots
      this.saveBtn?.addEventListener('click', () => this._saveSlot());
      this.loadBtn?.addEventListener('click', () => this._loadSlot());

      // Share
      this.genBtn?.addEventListener('click', () => this._generateCode());
      this.importBtn?.addEventListener('click', () => this._importCode());

      // Play
      this.playBtn?.addEventListener('click', () => this._play());

      // Swipe simples no mobile entre painéis
      let startX = 0;
      let startY = 0;
      let down = false;
      this.root?.addEventListener('pointerdown', (e) => {
        down = true;
        startX = e.clientX;
        startY = e.clientY;
      });
      this.root?.addEventListener('pointerup', (e) => {
        if (!down) return;
        down = false;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
          this._setPanel(dx < 0 ? 'right' : 'left');
        }
      });
    }

    _setPanel(panel) {
      if (!this.root) return;
      // Modo simples: mantém sempre no painel de configurações
      if (this.root.getAttribute('data-simple') === 'true') panel = 'left';
      this.root.setAttribute('data-panel', panel);
      if (this.tabConfig && this.tabPreview) {
        const left = panel === 'left';
        this.tabConfig.setAttribute('aria-selected', left ? 'true' : 'false');
        this.tabPreview.setAttribute('aria-selected', left ? 'false' : 'true');
      }
    }

    _populate() {
      // Fases 1..N (default 99 no v2)
      if (this.stageSel) {
        this.stageSel.innerHTML = '';
        const totalStages = (SuperBario99.levelsV2 && SuperBario99.levelsV2.createLevels100)
          ? 100
          : ((SuperBario99.levelsV2 && SuperBario99.levelsV2.createLevels99) ? 99 : 50);
        for (let i = 0; i < totalStages; i++) {
          const opt = document.createElement('option');
          opt.value = String(i);
          opt.textContent = `Fase ${i + 1}`;
          this.stageSel.appendChild(opt);
        }
      }

      // Estéticas
      if (this.aestheticSel && SuperBario99.themes && SuperBario99.themes.THEMES) {
        const entries = Object.values(SuperBario99.themes.THEMES);
        this.aestheticSel.innerHTML = '';
        for (const t of entries) {
          const opt = document.createElement('option');
          opt.value = t.id;
          opt.textContent = t.name;
          this.aestheticSel.appendChild(opt);
        }
      }

      // Pools de inimigos (somente os que existem no projeto)
      if (this.enemyPoolSel) {
        const pools = [
          { id: 'japanese', name: 'Japanese (Ninja/Yokai/Samurai/Tanuki/Kitsune)' },
          { id: 'tech', name: 'Tech (Drone/Yokai)' },
          { id: 'mixed', name: 'Misto (todos v2)' }
        ];
        this.enemyPoolSel.innerHTML = '';
        for (const p of pools) {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.name;
          this.enemyPoolSel.appendChild(opt);
        }
      }

      // Slots 1..10
      if (this.slotSel) {
        this.slotSel.innerHTML = '';
        for (let i = 0; i < 10; i++) {
          const opt = document.createElement('option');
          opt.value = String(i);
          const name = this._slots[i] && this._slots[i].name ? this._slots[i].name : `Slot ${i + 1}`;
          opt.textContent = name;
          this.slotSel.appendChild(opt);
        }
      }
    }

    _readControlsToConfig() {
      if (this.stageModeSel) this._config.mode = this.stageModeSel.value;
      if (this.stageSel) this._config.startLevel = Number(this.stageSel.value) || 0;
      if (this.aestheticSel) this._config.aestheticId = this.aestheticSel.value;
      if (this.effectRange) this._config.effectIntensity = (Number(this.effectRange.value) || 0) / 100;
      if (this.enemyCountRange) this._config.enemyCount = Number(this.enemyCountRange.value) || 0;
      if (this.enemyBehaviorSel) this._config.enemyBehavior = this.enemyBehaviorSel.value;
      if (this.enemyPoolSel) this._config.enemyPool = this.enemyPoolSel.value;
      if (this.gravitySel) this._config.gravity = Number(this.gravitySel.value) || 0.8;

      if (this.livesSel) {
        const v = this.livesSel.value;
        this._config.lives = (v === 'inf') ? 'inf' : (Number(v) || 10);
      }
    }

    _applyConfigToControls() {
      if (this.stageModeSel) this.stageModeSel.value = this._config.mode;
      if (this.stageSel) this.stageSel.value = String(this._config.startLevel);
      if (this.aestheticSel) this.aestheticSel.value = this._config.aestheticId;
      if (this.effectRange) this.effectRange.value = String(Math.round((this._config.effectIntensity || 0) * 100));
      if (this.enemyCountRange) this.enemyCountRange.value = String(this._config.enemyCount || 0);
      if (this.enemyBehaviorSel) this.enemyBehaviorSel.value = this._config.enemyBehavior || 'random';
      if (this.enemyPoolSel) this.enemyPoolSel.value = this._config.enemyPool || 'japanese';
      if (this.gravitySel) this.gravitySel.value = String(this._config.gravity || 0.8);

      if (this.livesSel) {
        this.livesSel.value = (this._config.lives === 'inf') ? 'inf' : String(this._config.lives || 10);
      }
    }

    _applyThemeForUI() {
      if (!SuperBario99.themes) return;
      SuperBario99.themes.applyTheme(this._config.aestheticId);
    }

    open() {
      if (!this.root) return;
      this.root.style.display = 'block';
      this.root.setAttribute('aria-hidden', 'false');
      this._setPanel('left');
      this._readControlsToConfig();
      this._applyThemeForUI();
      this._ensurePreview();
    }

    close() {
      if (!this.root) return;
      this.root.style.display = 'none';
      this.root.setAttribute('aria-hidden', 'true');
      this._stopPreview();
    }

    _isTouchDevice() {
      return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
    }

    _ensurePreview() {
      if (this._preview.running) return;
      this._preview.running = true;
      this._preview.lastT = 0;

      const fps = this._isTouchDevice() ? 30 : 60;
      const frameMs = 1000 / fps;

      const loop = (t) => {
        if (!this._preview.running) return;
        if (!this._preview.lastT) this._preview.lastT = t;
        const dt = t - this._preview.lastT;
        if (dt >= frameMs) {
          this._preview.lastT = t;
          this._drawPreview(t);
        }
        this._preview.raf = requestAnimationFrame(loop);
      };

      this._preview.raf = requestAnimationFrame(loop);
    }

    _stopPreview() {
      this._preview.running = false;
      try { cancelAnimationFrame(this._preview.raf); } catch (_) {}
    }

    _drawPreview(nowMs) {
      const ctx = this.pctx;
      const c = this.previewCanvas;
      const aestheticId = this._config.aestheticId;
      const cfg = SuperBario99.themes ? SuperBario99.themes.getThemeConfig(aestheticId) : null;

      // fundo base (gradiente)
      if (cfg && cfg.palette) {
        const grd = ctx.createLinearGradient(0, 0, 0, c.height);
        grd.addColorStop(0, cfg.palette.skyTop);
        grd.addColorStop(1, cfg.palette.skyBottom);
        ctx.fillStyle = grd;
      } else {
        ctx.fillStyle = '#000';
      }
      ctx.fillRect(0, 0, c.width, c.height);

      // elementos por estética (preview simplificado e leve)
      if (aestheticId === 'fruitiger-aero') {
        // nuvens fofas
        ctx.fillStyle = 'rgba(255,255,255,0.90)';
        for (let i = 0; i < 4; i++) {
          const x = (i * 90 + (nowMs * 0.03)) % (c.width + 120) - 60;
          const y = 28 + (i % 2) * 16;
          ctx.beginPath();
          ctx.arc(x + 20, y, 14, 0, Math.PI * 2);
          ctx.arc(x + 42, y - 8, 16, 0, Math.PI * 2);
          ctx.arc(x + 62, y, 14, 0, Math.PI * 2);
          ctx.fill();
        }
        // grade sutil no chão
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        for (let x = 0; x < c.width; x += 18) {
          ctx.beginPath();
          ctx.moveTo(x, 140);
          ctx.lineTo(x, c.height);
          ctx.stroke();
        }
      }

      if (aestheticId === 'metro-aero') {
        ctx.fillStyle = 'rgba(192,192,192,0.35)';
        ctx.fillRect(0, 126, c.width, 8);
        // trilhos
        ctx.strokeStyle = 'rgba(192,192,192,0.55)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const x = (i * 40 + (nowMs * 0.08)) % (c.width + 60) - 30;
          ctx.beginPath();
          ctx.moveTo(x, 126);
          ctx.lineTo(x + 12, c.height);
          ctx.stroke();
        }
      }

      if (aestheticId === 'vaporwave') {
        // palmeiras neon (contorno)
        ctx.strokeStyle = 'rgba(255,0,255,0.85)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const x = 40 + i * 110;
          ctx.beginPath();
          ctx.moveTo(x, 140);
          ctx.lineTo(x + 10, 92);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + 10, 92);
          ctx.lineTo(x - 6, 82);
          ctx.lineTo(x + 4, 76);
          ctx.lineTo(x + 16, 82);
          ctx.closePath();
          ctx.stroke();
        }
      }

      if (aestheticId === 'tecno-zen') {
        // circuitos
        ctx.strokeStyle = 'rgba(0,255,255,0.55)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
          const x = (i * 32 + (nowMs * 0.06)) % c.width;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, c.height);
          ctx.stroke();
        }
        // mandala
        ctx.strokeStyle = 'rgba(57,255,20,0.25)';
        const cx = c.width * 0.72;
        const cy = 56;
        for (let r = 10; r <= 34; r += 8) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      if (aestheticId === 'dorfic') {
        // neblina baixa
        const fog = ctx.createLinearGradient(0, 120, 0, c.height);
        fog.addColorStop(0, 'rgba(255,255,255,0.00)');
        fog.addColorStop(1, 'rgba(255,255,255,0.10)');
        ctx.fillStyle = fog;
        ctx.fillRect(0, 120, c.width, c.height - 120);
      }

      if (aestheticId === 'aurora-aero') {
        // estrelas
        ctx.fillStyle = 'rgba(255,215,0,0.75)';
        for (let i = 0; i < 24; i++) {
          const x = (i * 23) % c.width;
          const y = (i * 17) % 90;
          ctx.fillRect(x, y, 2, 2);
        }
        // aurora (ondas)
        const wave = (baseY, amp, color) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let x = 0; x <= c.width; x += 8) {
            const t = (nowMs * 0.002) + x * 0.03;
            const y = baseY + Math.sin(t) * amp;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        };
        wave(64, 10, 'rgba(127,255,0,0.35)');
        wave(78, 12, 'rgba(255,105,180,0.25)');
      }

      // chão + 2 plataformas
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(0, 150, c.width, 30);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(50, 120, 90, 12);
      ctx.fillRect(170, 98, 70, 12);

      // personagem (placeholder simples no preview)
      ctx.fillStyle = cfg?.palette?.accent || 'rgba(255,255,255,0.75)';
      ctx.fillRect(78, 96, 14, 24);

      // overlay (scanlines/glitch/soft glow)
      if (SuperBario99.themes && SuperBario99.themes.drawOverlay) {
        SuperBario99.themes.drawOverlay(ctx, c, aestheticId, nowMs, this._config.effectIntensity);
      }
    }

    _applyPreset(kind) {
      const c = this._config;

      if (kind === 'relax') {
        c.gravity = 0.6;
        c.lives = 'inf';
        c.enemyCount = 0;
        c.enemyBehavior = 'defensive';
        c.effectIntensity = 0.7;
      } else if (kind === 'classic') {
        c.gravity = 0.8;
        c.lives = 10;
        c.enemyCount = 14;
        c.enemyBehavior = 'random';
        c.effectIntensity = 0.8;
      } else if (kind === 'hard') {
        c.gravity = 1.05;
        c.lives = 3;
        c.enemyCount = 24;
        c.enemyBehavior = 'aggressive';
        c.effectIntensity = 0.85;
      } else if (kind === 'impossible') {
        c.gravity = 1.25;
        c.lives = 1;
        c.enemyCount = 40;
        c.enemyBehavior = 'aggressive';
        c.effectIntensity = 1.0;
      }

      this._applyConfigToControls();
      this._applyThemeForUI();
      this._ensurePreview();
    }

    _slotIndex() {
      return this.slotSel ? (Number(this.slotSel.value) || 0) : 0;
    }

    _refreshSlotOptions() {
      if (!this.slotSel) return;
      const idx = this._slotIndex();
      this._populate();
      this.slotSel.value = String(idx);
    }

    _saveSlot() {
      const idx = this._slotIndex();
      const name = String(this.slotName?.value || '').trim();
      const thumb = (() => {
        try { return this.previewCanvas.toDataURL('image/png'); } catch (_) { return ''; }
      })();

      this._slots[idx] = {
        name: name || `Slot ${idx + 1}`,
        config: { ...this._config },
        thumb
      };
      _saveSlots(this._slots);
      this._refreshSlotOptions();
    }

    _loadSlot() {
      const idx = this._slotIndex();
      const slot = this._slots[idx];
      if (!slot || !slot.config) return;
      this._config = { ...this._defaultConfig(), ...slot.config };
      this._applyConfigToControls();
      this._applyThemeForUI();
      this._ensurePreview();
    }

    _generateCode() {
      const code = encodeShareCode(this._config);
      if (this.shareInput) this.shareInput.value = code;

      // Link direto via hash
      try {
        location.hash = '#free=' + encodeURIComponent(code);
      } catch (_) {}
    }

    _importCode() {
      const code = this.shareInput ? this.shareInput.value : '';
      try {
        const cfg = decodeShareCode(code);
        this._config = { ...this._defaultConfig(), ...cfg };
        this._applyConfigToControls();
        this._applyThemeForUI();
        this._ensurePreview();
      } catch (e) {
        alert('Código inválido.');
        console.warn('[Modo Livre] Código inválido:', e);
      }
    }

    _tryImportFromHash() {
      try {
        const h = String(location.hash || '');
        const m = h.match(/#free=([^&]+)/);
        if (!m) return;
        const code = decodeURIComponent(m[1]);
        const cfg = decodeShareCode(code);
        this._config = { ...this._defaultConfig(), ...cfg };
        this._applyConfigToControls();
      } catch (_) {}
    }

    _play() {
      // Integra com o GameV2 existente
      const game = SuperBario99.__game;
      if (!game || typeof game.startFreeMode !== 'function') {
        alert('Modo Livre não está pronto (GameV2 não encontrado).');
        return;
      }

      this._readControlsToConfig();
      this.close();
      game.startFreeMode({ ...this._config });
    }
  }

  // -----------------------------
  // Testes inline: encode/decode
  // -----------------------------
  function _runInlineTests() {
    try {
      const sample = { a: 1, s: 'Olá', v: true };
      const code = encodeShareCode(sample);
      const back = decodeShareCode(code);
      if (back.a !== 1 || back.v !== true) throw new Error('decode inválido');
    } catch (e) {
      console.warn('[Modo Livre] testes inline falharam:', e);
    }
  }

  SuperBario99.freeMode = {
    encodeShareCode,
    decodeShareCode
  };

  function boot() {
    // Inicializa depois que o DOM existir
    try {
      const ui = new FreeModeUI();
      SuperBario99.__freeModeUI = ui;
    } catch (e) {
      console.warn('[Modo Livre] Falha ao inicializar UI:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  _runInlineTests();
})();
