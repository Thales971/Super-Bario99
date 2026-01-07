// =============================
// Super-Bario99 - Lógica principal
// Canvas 2D + requestAnimationFrame (sem libs)
// =============================

// Elementos do DOM
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const menu = document.getElementById('menu');
const instructions = document.getElementById('instructions');
const endScreen = document.getElementById('end-screen');

const startBtn = document.getElementById('start-btn');
const instructionsBtn = document.getElementById('instructions-btn');
const backBtn = document.getElementById('back-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');

const muteBtn = document.getElementById('mute-btn');
const scoreDisplay = document.getElementById('score-display');
const levelDisplay = document.getElementById('level-display');
const bestDisplay = document.getElementById('best-display');

const endTitle = document.getElementById('end-title');
const endScore = document.getElementById('end-score');
const endBest = document.getElementById('end-best');

// Estado do jogo
let gameRunning = false;
let currentLevel = 0;
let player = null;
let cameraX = 0;

const keys = Object.create(null);
const gravity = 0.8;

// Partículas (efeito de moeda)
const particles = [];

// Recorde
const HIGHSCORE_KEY = 'superbario99_highscore';
let bestScore = Number(localStorage.getItem(HIGHSCORE_KEY) || 0);

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function spawnCoinParticles(x, y) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() * 2 - 1) * 2.2,
            vy: -Math.random() * 3.0 - 1,
            life: 30 + Math.floor(Math.random() * 20),
            color: Math.random() < 0.7 ? '#FFD700' : '#FFFFFF'
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += 0.15;
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - cameraX, p.y, 3, 3);
    }
}

function drawBackground(level) {
    // Fundo diferente por fase (shapes simples)
    const theme = level.theme || 'sky';

    if (theme === 'sky') {
        const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grd.addColorStop(0, '#87CEEB');
        grd.addColorStop(1, '#dff6ff');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawClouds();
        return;
    }

    if (theme === 'forest') {
        const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grd.addColorStop(0, '#5dd39e');
        grd.addColorStop(1, '#1f7a5b');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawHills('#146b4e', 0.25);
        drawTrees(0.35);
        return;
    }

    if (theme === 'desert') {
        const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grd.addColorStop(0, '#87CEFA');
        grd.addColorStop(1, '#ffd27d');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawHills('#d8a44a', 0.18);
        return;
    }

    if (theme === 'cave') {
        const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grd.addColorStop(0, '#2b1b3f');
        grd.addColorStop(1, '#0f0b18');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawStars();
        return;
    }

    // castle
    ctx.fillStyle = '#2d1b1b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawLava();
}

function drawClouds() {
    const base = -(cameraX * 0.2) % 900;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 6; i++) {
        const x = base + i * 170;
        const y = 55 + (i % 3) * 28;
        ctx.beginPath();
        ctx.arc(x + 20, y, 16, 0, Math.PI * 2);
        ctx.arc(x + 40, y - 10, 18, 0, Math.PI * 2);
        ctx.arc(x + 60, y, 16, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawHills(color, parallax) {
    const base = -(cameraX * parallax) % 900;
    ctx.fillStyle = color;
    for (let i = 0; i < 4; i++) {
        const x = base + i * 260;
        ctx.beginPath();
        ctx.arc(x + 120, 420, 120, Math.PI, Math.PI * 2);
        ctx.fill();
    }
}

function drawTrees(parallax) {
    const base = -(cameraX * parallax) % 900;
    for (let i = 0; i < 8; i++) {
        const x = base + i * 120;
        const trunkY = 330;
        ctx.fillStyle = '#6b3f2a';
        ctx.fillRect(x + 40, trunkY, 16, 70);
        ctx.fillStyle = '#1f6f3a';
        ctx.beginPath();
        ctx.arc(x + 48, trunkY, 30, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawStars() {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 35; i++) {
        const x = (i * 83 + (cameraX * 0.1)) % canvas.width;
        const y = (i * 37) % 200;
        ctx.fillRect(x, y, 2, 2);
    }
}

function drawLava() {
    ctx.fillStyle = '#ff3b2f';
    const wave = Math.sin(performance.now() / 300) * 6;
    ctx.fillRect(0, 390 + wave, canvas.width, 60);
    ctx.fillStyle = 'rgba(255,210,0,0.65)';
    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.arc((i * 90 + (cameraX * 0.3)) % canvas.width, 410 + wave, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

function updateCamera(level) {
    const worldWidth = level.worldWidth || canvas.width;
    const target = player.x - canvas.width * 0.45;
    cameraX = clamp(target, 0, Math.max(0, worldWidth - canvas.width));
}

function updateEnemies(level) {
    const currentEnemies = levelEnemies[currentLevel];
    for (const enemy of currentEnemies) {
        if (!enemy.alive) continue;

        enemy.update(level);
        enemy.checkPlayerCollision(player);

        // Koopas em casco chutado podem matar outros
        if (enemy.type === 'koopa' && enemy.shelled && enemy.shellMoving) {
            for (const otherEnemy of currentEnemies) {
                if (otherEnemy !== enemy && otherEnemy.alive) {
                    enemy.checkEnemyCollision(otherEnemy);
                }
            }
        }
    }
}

function drawEnemies() {
    const currentEnemies = levelEnemies[currentLevel];
    for (const enemy of currentEnemies) {
        if (enemy.alive) {
            enemy.draw(ctx, cameraX);
        }
    }
}

function drawLives() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Vidas: ${player.lives}`, 20, 430);

    for (let i = 0; i < player.lives; i++) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(120 + i * 28, 425, 10, 0, Math.PI * 2);
        ctx.fill();
    }
}

function updateHud() {
    scoreDisplay.textContent = `Pontos: ${player.score}`;
    levelDisplay.textContent = `Fase: ${currentLevel + 1}`;
    bestDisplay.textContent = `Recorde: ${bestScore}`;
}

function startGame() {
    // Áudio precisa de gesto do usuário
    audioManager.init();
    audioManager.attachUI({ muteButton: muteBtn });
    audioManager.resume();
    audioManager.playMusic();

    // Reset completo
    levels = createLevels();
    levelEnemies = createLevelEnemies();
    currentLevel = 0;
    player = new Player(50, 350);
    cameraX = 0;
    particles.length = 0;

    gameRunning = true;
    menu.style.display = 'none';
    instructions.style.display = 'none';
    endScreen.style.display = 'none';
    updateHud();
}

function goToMenu() {
    gameRunning = false;
    audioManager.stopMusic();
    menu.style.display = 'flex';
    instructions.style.display = 'none';
    endScreen.style.display = 'none';
}

function showEndScreen(victory) {
    gameRunning = false;
    audioManager.stopMusic();
    audioManager.playSound('gameOver');

    if (player.score > bestScore) {
        bestScore = player.score;
        localStorage.setItem(HIGHSCORE_KEY, String(bestScore));
    }

    endTitle.textContent = victory ? 'VITÓRIA!' : 'GAME OVER';
    endScore.textContent = `Pontuação: ${player.score}`;
    endBest.textContent = `Recorde: ${bestScore}`;
    endScreen.style.display = 'flex';
}

function gameOver(victory = false) {
    // Função global usada pelos inimigos
    showEndScreen(victory);
}

// Input
window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault();
    }
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// UI
startBtn.addEventListener('click', startGame);
instructionsBtn.addEventListener('click', () => {
    instructions.style.display = 'flex';
    menu.style.display = 'none';
});
backBtn.addEventListener('click', () => {
    instructions.style.display = 'none';
    menu.style.display = 'flex';
});
restartBtn.addEventListener('click', startGame);
menuBtn.addEventListener('click', goToMenu);
muteBtn.addEventListener('click', () => {
    audioManager.init();
    audioManager.attachUI({ muteButton: muteBtn });
    audioManager.resume();
    audioManager.toggleMute();
});

// Loop principal
let lastTime = performance.now();
function loop(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;

    // Música sintética é agendada aqui (sem setInterval)
    audioManager.update(dt);

    if (gameRunning && player) {
        const level = levels[currentLevel];

        // Controles
        if (keys['ArrowLeft']) player.move('left');
        if (keys['ArrowRight']) player.move('right');
        if (keys[' '] || keys['ArrowUp']) player.jump();

        // Atualizações
        player.update(gravity, level);
        updateEnemies(level);

        // Moedas
        for (const coin of level.coins) {
            if (coin.checkCollision(player)) {
                spawnCoinParticles(coin.x + coin.width / 2, coin.y + coin.height / 2);
            }
        }

        // Objetivo
        for (const goal of level.goals) {
            if (goal.checkCollision(player)) {
                currentLevel++;
                if (currentLevel >= levels.length) {
                    showEndScreen(true);
                } else {
                    // manter score/vidas
                    const score = player.score;
                    const lives = player.lives;
                    player = new Player(50, 350);
                    player.score = score;
                    player.lives = lives;
                    cameraX = 0;
                }
                break;
            }
        }

        if (player.lives <= 0) {
            showEndScreen(false);
        }

        updateParticles();
        updateCamera(level);
        updateHud();

        // Desenho
        drawBackground(level);
        level.platforms.forEach((p) => p.draw(ctx, cameraX));
        level.coins.forEach((c) => c.draw(ctx, cameraX));
        level.goals.forEach((g) => g.draw(ctx, cameraX));
        drawEnemies();
        drawParticles();
        player.draw(ctx, cameraX);
        drawLives();
    } else {
        // Quando não está rodando, só limpar o canvas (menu/overlays são HTML)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        bestDisplay.textContent = `Recorde: ${bestScore}`;
    }

    requestAnimationFrame(loop);
}

// Inicialização (jogo abre no menu)
audioManager.attachUI({ muteButton: muteBtn });
bestDisplay.textContent = `Recorde: ${bestScore}`;
requestAnimationFrame(loop);