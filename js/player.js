class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 48;
        this.speed = 5;
        this.jumpForce = 15;
        this.velocityY = 0;
        this.isJumping = false;
        this.direction = 'right';
        this.score = 0;
        this.lives = 3;
        this.onGround = false;
        this.invincibleTime = 0;
    }

    update(gravity, level) {
        if (this.invincibleTime > 0) {
            this.invincibleTime--;
        }

        this.velocityY += gravity;
        this.y += this.velocityY;

        // Verificar colisões com plataformas
        this.onGround = false;
        for (const platform of level.platforms) {
            if (this.checkCollision(platform)) {
                if (this.velocityY > 0) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.onGround = true;
                    this.isJumping = false;
                }
            }
        }

        // Limitar ao canvas
        if (this.y > canvas.height - this.height) {
            this.y = canvas.height - this.height;
            this.velocityY = 0;
            this.onGround = true;
            this.isJumping = false;
        }

        const worldWidth = (level && level.worldWidth) ? level.worldWidth : canvas.width;
        if (this.x < 0) this.x = 0;
        if (this.x > worldWidth - this.width) this.x = worldWidth - this.width;
    }

    jump() {
        if (this.onGround && !this.isJumping) {
            this.velocityY = -this.jumpForce;
            this.isJumping = true;
            audioManager.playSound('jump');
        }
    }

    move(direction) {
        if (direction === 'left') {
            this.x -= this.speed;
            this.direction = 'left';
        } else if (direction === 'right') {
            this.x += this.speed;
            this.direction = 'right';
        }
    }

    takeHit() {
        if (this.invincibleTime > 0) return;
        this.lives--;
        this.invincibleTime = 90; // ~1.5s a 60fps
    }

    checkCollision(platform) {
        return (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y < platform.y + platform.height &&
                this.y + this.height > platform.y);
    }

    draw(ctx, cameraX = 0) {
        // Desenhar jogador (pode substituir por sprite depois)
        const x = this.x - cameraX;
        const blink = this.invincibleTime > 0 && (Math.floor(this.invincibleTime / 6) % 2 === 0);
        if (blink) return;

        ctx.fillStyle = this.direction === 'right' ? '#FF5733' : '#33FF57';
        ctx.fillRect(x, this.y, this.width, this.height);
        
        // Desenhar rosto simples
        ctx.fillStyle = 'white';
        ctx.fillRect(x + 8, this.y + 10, 6, 6); // olho esquerdo
        ctx.fillRect(x + 18, this.y + 10, 6, 6); // olho direito
        ctx.fillStyle = 'black';
        ctx.fillRect(x + 10, this.y + 12, 2, 2); // pupila esquerda
        ctx.fillRect(x + 20, this.y + 12, 2, 2); // pupila direita
        ctx.fillRect(x + 12, this.y + 25, 8, 2); // boca
    }
}
