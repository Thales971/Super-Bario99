# Super-Bario99 - The Multicultural Epic

Um jogo de plataforma 2D desenvolvido inteiramente em **HTML5 Canvas e JavaScript puro**, sem frameworks externos. O projeto evoluiu para uma experiência "v2" com estética retrô japonesa/anime, geração procedural de fases e trilha sonora sintetizada em tempo real via Web Audio API.

![Status do Projeto](https://img.shields.io/badge/Status-Playable-brightgreen) ![Tech](https://img.shields.io/badge/Tech-Canvas%20%2B%20Vanilla%20JS-blue)

## 🎮 Funcionalidades Principais

- **50 Fases Procedurais**: Níveis gerados algoritmicamente que aumentam em tamanho e dificuldade.
- **7 Temas Estéticos**: Cada bloco de 5 fases possui uma identidade visual e sonora única:
  1.  _Japan Retro_ (Sakuras, Templos, Fuji)
  2.  _Fruitiger Aero_ (Glossy, Céu Azul, Otimismo Tech)
  3.  _TecnoZen_ (Neon, Circuitos, Lótus Cibernética)
  4.  _Dorfic_ (Gótico, Névoa, Silhuetas)
  5.  _Metro_ (Urbano, Trens, Concreto)
  6.  _Evil_ (Tempestades, Vermelho, Caos)
  7.  _MemeFusion_ (A mistura glitch de tudo)
- **Áudio Processual**: Trilha sonora dinâmica que muda conforma o tema e sfx (efeitos sonoros) sintetizados na hora (sem carregar arquivos pesados de mp3).
- **Sistema de Combate**: Pule na cabeça dos inimigos ou use seu ataque de espada com a tecla **X**.
- **Inimigos com IA**: De simples patrulheiros a Yokais que perseguem o jogador usando pathfinding (A\*) e Bosses desafiadores.
- **Progresso Persistente**: O jogo salva automaticamente sua fase,vidas e pontuação. Botão "Continuar" disponível no menu.

## 🕹️ Controles

| Tecla                  | Ação                     |
| :--------------------- | :----------------------- |
| **Setas (Esq/Dir)**    | Mover Personagem         |
| **Seta Cima / Espaço** | Pular                    |
| **X**                  | Atacar (Golpe de Espada) |
| **Mouse (Clique)**     | Interagir com Menu       |

### Blocos "?" e Power-ups

- Para liberar um power-up, **pule e pouse em cima** do bloco "?".

## 🛠️ Instalação e Execução

Não é necessário instalar dependências de node_modules. O jogo roda nativamente no navegador.

1.  **Clone o repositório**:
    ```bash
    git clone https://github.com/seu-usuario/super-bario99.git
    ```
2.  **Execute um servidor local** (Recomendado para evitar bloqueios de CORS com módulos/áudio):
    - _Com Python:_ `py -m http.server 5500`
    - _Com VS Code:_ Use a extensão **Live Server**.
3.  **Acesse no navegador**:
    - `http://localhost:5500`

## 📂 Estrutura do Código (v2)

## 🎨 Sistema de Estéticas (Theme Manager)

O jogo aplica automaticamente uma estética visual por fase (1–50) usando o arquivo:

- [js/themes/theme-manager.js](js/themes/theme-manager.js)

### Mapeamento padrão por bloco

- Fases 1–5: **Windows XP** (`windows-xp`)
- Fases 6–10: **Fruitiger Aero** (`fruitiger-aero`)
- Fases 11–15: **Tecno Zen** (`tecno-zen`)
- Fases 16–20: **Dorfic** (`dorfic`)
- Fases 21–25: **Metro Aero** (`metro-aero`)
- Fases 26–30: **Vaporwave** (`vaporwave`)
- Fases 31–35: **Aurora Aero** (`aurora-aero`)
- Fases 36–40: **Windows Vista** (`windows-vista`)
- Fases 41–45: **Vaporwave** (`vaporwave`)
- Fases 46–50: **Aurora Aero** (`aurora-aero`)

### Como adicionar uma nova estética

1. Adicione uma entrada em `THEMES` dentro de [js/themes/theme-manager.js](js/themes/theme-manager.js) (paleta, UI e efeitos).
2. Opcional: adicione suporte de overlay em `drawOverlay()` (scanlines/glitch/glow).
3. (Se quiser aplicar por fase) ajuste `getAestheticIdForLevel(levelIndex)`.

O Theme Manager aplica o visual principalmente via **CSS Variables** (tipografia, blur, radius, etc.) e usa um **overlay Canvas** leve para efeitos (scanlines/glitch).

## 🧪 Modo Livre / Criativo

No menu principal existe o botão **MODO LIVRE**. Ele abre um painel onde você escolhe:

- Fase inicial (1–50)
- Estética (override)
- Intensidade de efeitos
- Quantidade/pool de inimigos
- Gravidade e vidas

### Slots (10)

Você pode salvar e carregar setups em **10 slots** (localStorage). Cada slot guarda também uma miniatura do preview.

### Compartilhamento (código)

- **Gerar Código** cria um código `SB99-...` com o setup.
- **Importar Código** aplica o setup.
- Também dá para abrir direto via URL com `#free=SB99-...`.

> Observação: o Modo Livre **não** altera o save nem o recorde do modo principal.

O projeto migrou para uma arquitetura modular baseada em namespaces (`window.SuperBario99`) para garantir compatibilidade simples.

- `js/core/`:
  - `game.js`: Loop principal, gerenciamento de estado e renderização.
  - `player.js`: Física, colisão e animação do personagem.
  - `audio-manager.js`: Sintetizador Web Audio API e sequenciador musical.
- `js/levels/`:
  - `levels.js`: Gerador procedural de plataformas, moedas e metas.
- `js/enemies/`:
  - `traditional/*.js`: Lógica de inimigos comuns (Ninja, Yokai, Kitsune, Drone, etc).
  - `bosses/*.js`: Lógica dos chefes de fase.
- `js/ai/`:
  - `difficulty-system.js`: Curva de dificuldade e configuração de temas.
  - `pathfinding.js`: Algoritmo A\* simplificado para inimigos perseguidores.

## 🐛 Bugs Conhecidos

- Colisões em alta velocidade podem ocasionalmente atravessar plataformas finas (tunneling).
- Em dispositivos muito antigos, o excesso de partículas (fases Japan e Evil) pode reduzir o FPS.

## 📝 Licença

Este projeto é de código aberto. Sinta-se livre para estudar, modificar e distribuir.

---

_Desenvolvido com ajuda de IA Generativa | 2026_
