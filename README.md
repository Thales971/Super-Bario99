# Super-Bario99 - The Multicultural Epic

Um jogo de plataforma 2D desenvolvido inteiramente em **HTML5 Canvas e JavaScript puro**, sem frameworks externos. O projeto evoluiu para uma experiência "v2" com estética retrô japonesa/anime, geração procedural de fases e trilha sonora sintetizada em tempo real via Web Audio API.

![Status do Projeto](https://img.shields.io/badge/Status-Playable-brightgreen) ![Tech](https://img.shields.io/badge/Tech-Canvas%20%2B%20Vanilla%20JS-blue)

## 🎮 Funcionalidades Principais

- **35 Fases Procedurais**: Níveis gerados algoritmicamente que aumentam em tamanho e dificuldade.
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
