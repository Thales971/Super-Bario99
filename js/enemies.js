// Classe base para todos os inimigos
class Enemy {
    constructor(x, y, width, height, speed, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.type = type;
        this.direction = 1; // 1 = direita, -1 = esquerda
        this.alive = true;
        this.gravity = 0.8;
        this.velocityY = 0;
        this.onGround = false;
    }

    update(level) {
        if (!this.alive) return;

        // Aplicar gravidade
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Verificar colisões com plataformas
        this.onGround = false;
        for (const platform of level.platforms) {
            if (this.checkCollision(platform)) {
                if (this.velocityY > 0) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.onGround = true;
                }
            }
        }

        // Movimento horizontal baseado no tipo de inimigo
        this.move();
        
        // Limitar ao mundo
        const maxX = (level.worldWidth || 800) - this.width;
        if (this.x < 0 || this.x > maxX) {
            this.direction *= -1;
            if (this.x < 0) this.x = 0;
            if (this.x > maxX) this.x = maxX;
        }
    }

    move() {
        // Implementado nas classes filhas
    }

    checkCollision(obj) {
        return (this.x < obj.x + obj.width &&
                this.x + this.width > obj.x &&
                this.y < obj.y + obj.height &&
                this.y + this.height > obj.y);
    }

    checkPlayerCollision(player) {
        if (!this.alive) return false;
        
        const collision = this.checkCollision(player);
        
        if (collision) {
            // Verificar se o jogador está pulando em cima do inimigo
            if (player.velocityY > 0 && player.y + player.height < this.y + this.height/2) {
                this.die();
                player.velocityY = -10; // Pulo ao matar inimigo
                player.score += 100;
                audioManager.playSound('enemyDie');
                return false;
            } else {
                // Jogador colide com o inimigo
                if (player.takeHit) {
                    player.takeHit();
                } else {
                    player.lives--;
                }
                audioManager.playSound('gameOver');
                if (player.lives <= 0) {
                    gameOver();
                }
                return true;
            }
        }
        return false;
    }

    die() {
        this.alive = false;
        audioManager.playSound('enemyDie');
    }

    draw(ctx) {
        // Implementado nas classes filhas
    }
}

// Goomba - inimigo básico que caminha
class Goomba extends Enemy {
    constructor(x, y) {
        super(x, y, 32, 32, 2, 'goomba');
    }

    move() {
        this.x += this.speed * this.direction;
    }

    draw(ctx, cameraX = 0) {
        if (!this.alive) return;

        // Corpo do Goomba
        ctx.fillStyle = '#8B4513'; // marrom
        ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
        
        // Pés
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(this.x - cameraX + 4, this.y + 24, 8, 8);
        ctx.fillRect(this.x - cameraX + 20, this.y + 24, 8, 8);
        
        // Cara
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(this.x - cameraX + 8, this.y + 8, 16, 16);
        
        // Olhos
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x - cameraX + 10, this.y + 12, 4, 4);
        ctx.fillRect(this.x - cameraX + 22, this.y + 12, 4, 4);
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - cameraX + 11, this.y + 13, 2, 2);
        ctx.fillRect(this.x - cameraX + 23, this.y + 13, 2, 2);
        
        // Sobrancelhas
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(this.x - cameraX + 8, this.y + 8, 16, 2);
    }
}

// Koopa Troopa - inimigo que pode ser chutado quando virado
class Koopa extends Enemy {
    constructor(x, y) {
        super(x, y, 32, 40, 2, 'koopa');
        this.shelled = false; // Está na forma de casco?
        this.shellTimer = 0; // Timer para voltar à forma normal
        this.shellMoving = false;
    }

    move() {
        if (this.shelled) {
            this.shellTimer++;
            if (this.shellTimer > 300) { // 5 segundos
                this.shelled = false;
                this.shellTimer = 0;
                this.shellMoving = false;
                this.height = 40;
                this.y -= 8;
            }
            // Quando é casco, só se move rápido quando "chutado"
            const shellSpeed = this.shellMoving ? this.speed * 5 : 0;
            this.x += shellSpeed * this.direction;
        } else {
            this.x += this.speed * this.direction;
        }
    }

    checkPlayerCollision(player) {
        if (!this.alive) return false;
        
        const collision = this.checkCollision(player);
        
        if (collision) {
            if (player.velocityY > 0 && player.y + player.height < this.y + this.height/2) {
                // Jogador pula em cima do Koopa
                if (!this.shelled) {
                    // Primeiro pulo: vira casco
                    this.shelled = true;
                    this.y += 8; // Ajustar altura quando vira casco
                    this.height = 24;
                    this.shellMoving = false;
                    player.velocityY = -10;
                    player.score += 50;
                    audioManager.playSound('jump');
                } else {
                    // Pular em cima do casco para parar
                    this.shellMoving = false;
                    player.velocityY = -10;
                    audioManager.playSound('jump');
                }
                return false;
            } else if (!this.shelled) {
                // Jogador colide com Koopa normal
                if (player.takeHit) {
                    player.takeHit();
                } else {
                    player.lives--;
                }
                audioManager.playSound('gameOver');
                if (player.lives <= 0) {
                    gameOver();
                }
                return true;
            } else {
                // Jogador chuta o casco
                this.shellMoving = true;
                this.direction = player.x < this.x ? 1 : -1;
                return true;
            }
        }
        return false;
    }

    checkEnemyCollision(enemy) {
        if (this.shelled && this.shellMoving && enemy.alive && this !== enemy) {
            if (this.checkCollision(enemy)) {
                enemy.die();
                this.direction *= -1; // O casco ricocheteia
                player.score += 100;
            }
        }
    }

    die() {
        this.alive = false;
        audioManager.playSound('enemyDie');
    }

    draw(ctx, cameraX = 0) {
        if (!this.alive) return;

        if (this.shelled) {
            // Desenhar casco
            ctx.fillStyle = '#008000'; // verde
            ctx.fillRect(this.x - cameraX, this.y + 16, this.width, 16);
            
            // Detalhes do casco
            ctx.fillStyle = '#228B22';
            ctx.fillRect(this.x - cameraX + 4, this.y + 16, 8, 4);
            ctx.fillRect(this.x - cameraX + 20, this.y + 16, 8, 4);
            ctx.fillRect(this.x - cameraX + 12, this.y + 16, 8, 4);
            
            // Olhos (quando vira casco, os olhos somem)
        } else {
            // Desenhar Koopa normal
            ctx.fillStyle = '#008000'; // corpo verde
            ctx.fillRect(this.x - cameraX, this.y, this.width, this.height - 8);
            
            // Casco
            ctx.fillStyle = '#228B22';
            ctx.fillRect(this.x - cameraX, this.y, this.width, 16);
            
            // Detalhes do casco
            ctx.fillStyle = '#006400';
            ctx.fillRect(this.x - cameraX + 4, this.y, 8, 4);
            ctx.fillRect(this.x - cameraX + 20, this.y, 8, 4);
            ctx.fillRect(this.x - cameraX + 12, this.y, 8, 4);
            
            // Cara
            ctx.fillStyle = '#8B4513'; // marrom
            ctx.fillRect(this.x - cameraX + 8, this.y + 16, 16, 16);
            
            // Olhos
            ctx.fillStyle = 'white';
            ctx.fillRect(this.x - cameraX + 10, this.y + 20, 4, 4);
            ctx.fillRect(this.x - cameraX + 22, this.y + 20, 4, 4);
            ctx.fillStyle = 'black';
            ctx.fillRect(this.x - cameraX + 11, this.y + 21, 2, 2);
            ctx.fillRect(this.x - cameraX + 23, this.y + 21, 2, 2);
            
            // Pés
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x - cameraX + 4, this.y + 32, 8, 8);
            ctx.fillRect(this.x - cameraX + 20, this.y + 32, 8, 8);
        }
    }
}

// Piranha Plant - inimigo que aparece e desaparece de canos
class Piranha extends Enemy {
    constructor(x, y) {
        super(x, y, 32, 48, 0, 'piranha');
        this.visible = false;
        this.timer = 0;
        this.maxTimer = 120; // 2 segundos visível + 2 segundos invisível
    }

    update(level) {
        if (!this.alive) return;

        this.timer++;
        if (this.timer >= this.maxTimer) {
            this.timer = 0;
            this.visible = !this.visible;
        }

        // Gravidade básica para manter no lugar
        this.velocityY += this.gravity;
        this.y += this.velocityY;
        
        // Colisão com plataformas (para manter no cano)
        for (const platform of level.platforms) {
            if (this.checkCollision(platform)) {
                if (this.velocityY > 0) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                }
            }
        }
    }

    move() {
        // Piranha não se move horizontalmente
    }

    checkPlayerCollision(player) {
        if (!this.alive || !this.visible) return false;
        
        const collision = this.checkCollision(player);
        
        if (collision) {
            if (player.takeHit) {
                player.takeHit();
            } else {
                player.lives--;
            }
            audioManager.playSound('gameOver');
            if (player.lives <= 0) {
                gameOver();
            }
            return true;
        }
        return false;
    }

    draw(ctx, cameraX = 0) {
        if (!this.alive || !this.visible) return;

        // Caule
        ctx.fillStyle = '#228B22';
        ctx.fillRect(this.x - cameraX + 12, this.y - 32, 8, 32);
        
        // Cabeça da Piranha
        ctx.fillStyle = '#8B0000'; // vermelho escuro
        ctx.beginPath();
        ctx.arc(this.x - cameraX + 16, this.y - 24, 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Boca
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x - cameraX + 16, this.y - 24, 12, 0, Math.PI * 0.8);
        ctx.fill();
        
        // Dentes
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x - cameraX + 8, this.y - 30, 4, 8);
        ctx.fillRect(this.x - cameraX + 20, this.y - 30, 4, 8);
        ctx.fillRect(this.x - cameraX + 12, this.y - 34, 4, 4);
        ctx.fillRect(this.x - cameraX + 16, this.y - 34, 4, 4);
        
        // Olhos
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x - cameraX + 8, this.y - 28, 6, 6);
        ctx.fillRect(this.x - cameraX + 18, this.y - 28, 6, 6);
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - cameraX + 10, this.y - 26, 2, 2);
        ctx.fillRect(this.x - cameraX + 20, this.y - 26, 2, 2);
    }
}

// Inimigo voador (como um besouro)
class FlyingEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 32, 32, 2, 'flying');
        this.baseY = y;
        this.phase = 0;
    }

    update(level) {
        if (!this.alive) return;

        this.phase += 0.06;
        this.y = this.baseY + Math.sin(this.phase) * 18;
        this.x += this.speed * this.direction;

        const maxX = (level.worldWidth || 800) - this.width;
        if (this.x <= 0 || this.x >= maxX) {
            this.direction *= -1;
        }
    }

    move() {
        // Já implementado no update
    }

    draw(ctx, cameraX = 0) {
        if (!this.alive) return;

        // Corpo
        ctx.fillStyle = '#4169E1'; // azul royal
        ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
        
        // Asas
        ctx.fillStyle = '#6495ED'; // azul cornflower
        ctx.fillRect(this.x - cameraX - 8, this.y + 8, 8, 16);
        ctx.fillRect(this.x - cameraX + this.width, this.y + 8, 8, 16);
        
        // Olhos
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x - cameraX + 6, this.y + 8, 6, 6);
        ctx.fillRect(this.x - cameraX + 20, this.y + 8, 6, 6);
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - cameraX + 8, this.y + 10, 2, 2);
        ctx.fillRect(this.x - cameraX + 22, this.y + 10, 2, 2);
        
        // Antenas
        ctx.strokeStyle = '#4169E1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - cameraX + 8, this.y);
        ctx.lineTo(this.x - cameraX + 4, this.y - 8);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x - cameraX + 24, this.y);
        ctx.lineTo(this.x - cameraX + 28, this.y - 8);
        ctx.stroke();
    }

    checkPlayerCollision(player) {
        if (!this.alive) return false;
        if (this.checkCollision(player)) {
            if (player.takeHit) {
                player.takeHit();
            } else {
                player.lives--;
            }
            audioManager.playSound('gameOver');
            if (player.lives <= 0) {
                gameOver();
            }
            return true;
        }
        return false;
    }
}

// Função para criar inimigos para cada fase
function createLevelEnemies() {
    const enemies = [];

    // FASE 1 - Tutorial (poucos inimigos)
    const level1Enemies = [
        new Goomba(300, 368),
        new Koopa(500, 268),
        new Goomba(980, 318),
        new Koopa(1220, 218)
    ];
    enemies.push(level1Enemies);

    // FASE 2 - Mais desafiador
    const level2Enemies = [
        new Goomba(150, 318),
        new Goomba(300, 268),
        new Koopa(450, 318),
        new Goomba(600, 268),
        new Koopa(980, 318),
        new Goomba(1300, 238),
        new FlyingEnemy(1600, 220)
    ];
    enemies.push(level2Enemies);

    // FASE 3 - Desafio de pulos com inimigos
    const level3Enemies = [
        new Goomba(200, 368),
        new FlyingEnemy(400, 250),
        new Koopa(600, 168),
        new Goomba(700, 118),
        new FlyingEnemy(1200, 220),
        new Koopa(1700, 168),
        new Goomba(1900, 268)
    ];
    enemies.push(level3Enemies);

    // FASE 4 - Labirinto com vários inimigos
    const level4Enemies = [
        new Goomba(150, 318),
        new Koopa(300, 318),
        new Goomba(500, 318),
        new Koopa(650, 318),
        new FlyingEnemy(400, 200),
        new Goomba(980, 318),
        new Koopa(1220, 278),
        new FlyingEnemy(1650, 210),
        new Piranha(1850, 368)
    ];
    enemies.push(level4Enemies);

    // FASE 5 - Chefe final com muitos inimigos
    const level5Enemies = [
        new Koopa(250, 318),
        new Koopa(350, 318),
        new Koopa(450, 318),
        new Koopa(550, 318),
        new Goomba(150, 218),
        new Goomba(650, 218),
        new Piranha(350, 368),
        new FlyingEnemy(200, 150),
        new FlyingEnemy(600, 150),
        new Koopa(980, 318),
        new Goomba(1250, 218),
        new Piranha(1500, 368),
        new FlyingEnemy(1800, 160),
        new Koopa(2050, 268)
    ];
    enemies.push(level5Enemies);

    return enemies;
}

let levelEnemies = createLevelEnemies();