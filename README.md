# Super-Bario99 - The Multicultural Epic

Um jogo de plataforma 2D desenvolvido inteiramente em **HTML5 Canvas e JavaScript puro**, sem frameworks externos. O projeto evoluiu para uma experiência "v2" com estética retrô japonesa/anime, geração procedural de fases e trilha sonora sintetizada em tempo real via Web Audio API.

![Status do Projeto](https://img.shields.io/badge/Status-Playable-brightgreen) ![Tech](https://img.shields.io/badge/Tech-Canvas%20%2B%20Vanilla%20JS-blue)

## 🎮 Funcionalidades Principais

- **100 Fases Procedurais**: Níveis gerados algoritmicamente que aumentam em tamanho e dificuldade.
- **Estéticas/Temas por fase**: Cada bloco de fases pode ter uma identidade visual e sonora única (ex.: _Japan Retro_, _Windows XP_, _Fruitiger Aero_, _Tecno Zen_, _Dorfic_, _Metro Aero_, _Vaporwave_, _Aurora Aero_, _Windows Vista_, _MemeFusion_).
- **Áudio Processual**: Trilha sonora dinâmica que muda conforma o tema e sfx (efeitos sonoros) sintetizados na hora (sem carregar arquivos pesados de mp3).
- **Sistema de Combate**: Pule na cabeça dos inimigos ou use seu ataque de espada com a tecla **X**.
- **Inimigos com IA**: De simples patrulheiros a Yokais que perseguem o jogador usando pathfinding (A\*) e Bosses desafiadores.
- **Fases especiais (mecânicas reais)**: Algumas fases podem ativar mecânicas/ambientes específicos (ex.: água/nado e oxigênio com HUD em fase oceânica) e spawns dedicados de inimigos.
- **Clima dinâmico**: Camadas de chuva/neve/areia/tempestade com partículas e overlay.
- **Qualidade visual melhor (Retina/DPR)**: O canvas usa buffer físico escalado (com limites) para ficar mais nítido em telas de alta densidade, mantendo a jogabilidade em coordenadas lógicas.
- **NPCs com visual próprio + área segura**: NPCs têm sprite/contorno próprios e inimigos são repelidos/perdem dano perto deles para não atrapalhar interação/diálogos.
- **Progresso Persistente**: O jogo salva automaticamente sua fase,vidas e pontuação. Botão "Continuar" disponível no menu.

## ✨ Atualizações recentes (jan/2026)

- **Opções persistentes** (localStorage): classe, paleta e chapéu.
- **Customização de chapéu**: Nenhum / Boné / Gorro / Coroa.
- **Habilidades**:
  - **C**: habilidade da classe (ex.: Engenheiro repara plataforma; Mago cria plataforma temporária)
  - **Shift**: dash
  - **T**: slow time (cargas por fase + cooldown)
  - **P**: foto (exporta PNG do canvas)
- **Estéticas secretas**: algumas fases podem entrar raramente em uma estética “secreta” (offline/determinístico). Não aparece no Modo Livre.

## 🕹️ Controles

| Tecla                  | Ação                     |
| :--------------------- | :----------------------- |
| **Setas (Esq/Dir)**    | Mover Personagem         |
| **Seta Cima / Espaço** | Pular                    |
| **X**                  | Atacar (Golpe de Espada) |
| **Shift**              | Dash                     |
| **C**                  | Skill da classe          |
| **T**                  | Slow time                |
| **P**                  | Foto (salvar PNG)        |
| **Mouse (Clique)**     | Interagir com Menu       |

### Mobile / Touch

- **Botões na tela**: esquerda/direita, pulo e ataque (aparece automaticamente no mobile).
- **Gestos no canvas**:
  - Arrasto horizontal enquanto segura: mover
  - Swipe para cima: pular
  - **Duplo toque**: usar power-up

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

### Rodar no celular (mesma rede)

1. Rode o servidor local no PC.
2. Descubra o IP da sua máquina na rede (ex.: `ipconfig` no Windows).
3. No celular, acesse `http://SEU_IP:5500`.

## 📂 Estrutura do Código (v2)

## 🎨 Sistema de Estéticas (Theme Manager)

O jogo aplica automaticamente uma estética visual por fase (1–50) usando o arquivo:

- [js/themes/theme-manager.js](js/themes/theme-manager.js)

### Mapeamento padrão por bloco

- Fases 1–10: **Japan Retro** (`japan-retro`)
- Fases 11–20: **Fruitiger Aero** (`fruitiger-aero`)
- Fases 21–30: **Dorfic** (`dorfic`)
- Fases 31–40: **Metro Aero** (`metro-aero`)
- Fases 41–49: **Vaporwave** (`vaporwave`)
- Fases 50–59: **Fruitiger Ocean** (`fruitiger-ocean`)
- Fases 60–69: **Fruitiger Sunset** (`fruitiger-sunset`)
- Fases 70–79: **Fruitiger Neon** (`fruitiger-neon`)
- Fases 80–89: **Fruitiger Forest** (`fruitiger-forest`)
- Fases 90–99: **Fruitiger Galaxy** (`fruitiger-galaxy`)
- Fase 100: **Caos Final** (`caos-final`)

### Como adicionar uma nova estética

1. Adicione uma entrada em `THEMES` dentro de [js/themes/theme-manager.js](js/themes/theme-manager.js) (paleta, UI e efeitos).
2. Opcional: adicione suporte de overlay em `drawOverlay()` (scanlines/glitch/glow).
3. (Se quiser aplicar por fase) ajuste `getAestheticIdForLevel(levelIndex)`.

O Theme Manager aplica o visual principalmente via **CSS Variables** (tipografia, blur, radius, etc.) e usa um **overlay Canvas** leve para efeitos (scanlines/glitch).

## ⭐ Fases especiais (config)

As fases especiais ficam configuradas em:

- [js/levels/special-phases-config.js](js/levels/special-phases-config.js)

Elas podem definir:

- Mecânicas/ambiente (ex.: água/nado/oxigênio)
- Inimigos dedicados (spawn explícito por fase)

### Inimigos temáticos adicionados

- Oceano/Fruitiger Ocean: **Jellyfish** e **Shark**
- Japan Retro 7 (especial): **Oni Mask** e **Monkey**

## 🧪 Modo Livre / Criativo

No menu principal existe o botão **MODO LIVRE**. Ele abre um painel onde você escolhe:

- Fase inicial (1–50)
- Fase inicial (1–100)
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
