class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw(ctx, cameraX = 0) {
        ctx.fillStyle = '#8B4513'; // marrom
        ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
        
        // Detalhes da plataforma
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(this.x - cameraX, this.y + this.height - 4, this.width, 4);
    }
}

class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.collected = false;
    }

    draw(ctx, cameraX = 0) {
        if (this.collected) return;
        ctx.fillStyle = '#FFD700'; // dourado
        ctx.beginPath();
        ctx.arc(this.x - cameraX + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Brilho da moeda
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x - cameraX + this.width/2 - 2, this.y + this.height/2 - 2, this.width/6, 0, Math.PI * 2);
        ctx.fill();
    }

    checkCollision(player) {
        if (this.collected) return false;
        
        const collision = (
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y
        );
        
        if (collision) {
            this.collected = true;
            player.score += 100;
            audioManager.playSound('coin');
            return true;
        }
        return false;
    }
}

class Goal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 64;
        this.reached = false;
    }

    draw(ctx, cameraX = 0) {
        // Mastil
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - cameraX, this.y, 4, this.height);
        
        // Bandeira
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x - cameraX + 4, this.y, 24, 24);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x - cameraX + 4, this.y + 24, 24, 4);
        
        ctx.fillStyle = '#0000FF';
        ctx.fillRect(this.x - cameraX + 4, this.y + 28, 24, 24);
    }

    checkCollision(player) {
        if (this.reached) return false;
        
        const collision = (
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y
        );
        
        if (collision) {
            this.reached = true;
            return true;
        }
        return false;
    }
}

class Level {
    constructor() {
        this.platforms = [];
        this.coins = [];
        this.goals = [];
        this.background = '#87CEEB'; // céu azul
        this.theme = 'sky';
        this.worldWidth = 800;
    }
}

function addGround(level) {
    level.platforms.push(new Platform(0, 400, level.worldWidth, 50));
}

// FASE 1 - Tutorial
function createLevel1() {
    const level = new Level();
    level.theme = 'sky';
    level.background = '#87CEEB';
    level.worldWidth = 1600;
    
    // Plataformas
    addGround(level);
    level.platforms.push(new Platform(200, 350, 100, 20));
    level.platforms.push(new Platform(400, 300, 100, 20));
    level.platforms.push(new Platform(600, 250, 100, 20));
    level.platforms.push(new Platform(900, 350, 120, 20));
    level.platforms.push(new Platform(1100, 300, 120, 20));
    level.platforms.push(new Platform(1300, 250, 120, 20));
    
    // Moedas
    level.coins.push(new Coin(220, 320));
    level.coins.push(new Coin(420, 270));
    level.coins.push(new Coin(620, 220));
    level.coins.push(new Coin(920, 320));
    level.coins.push(new Coin(1120, 270));
    level.coins.push(new Coin(1320, 220));
    
    // Objetivo
    level.goals.push(new Goal(1520, 336));
    
    return level;
}

// FASE 2 - Mais plataformas
function createLevel2() {
    const level = new Level();
    level.theme = 'forest';
    level.background = '#3498db';
    level.worldWidth = 2000;
    
    addGround(level);
    level.platforms.push(new Platform(100, 350, 80, 20));
    level.platforms.push(new Platform(250, 300, 80, 20));
    level.platforms.push(new Platform(400, 350, 80, 20));
    level.platforms.push(new Platform(550, 300, 80, 20));
    level.platforms.push(new Platform(700, 250, 80, 20));
    level.platforms.push(new Platform(900, 350, 120, 20));
    level.platforms.push(new Platform(1120, 310, 120, 20));
    level.platforms.push(new Platform(1350, 270, 120, 20));
    level.platforms.push(new Platform(1600, 230, 120, 20));
    level.platforms.push(new Platform(1820, 350, 120, 20));
    
    level.coins.push(new Coin(120, 320));
    level.coins.push(new Coin(270, 270));
    level.coins.push(new Coin(420, 320));
    level.coins.push(new Coin(570, 270));
    level.coins.push(new Coin(720, 220));
    level.coins.push(new Coin(920, 320));
    level.coins.push(new Coin(1140, 280));
    level.coins.push(new Coin(1370, 240));
    level.coins.push(new Coin(1620, 200));
    level.coins.push(new Coin(1840, 320));
    
    level.goals.push(new Goal(1920, 336));
    
    return level;
}

// FASE 3 - Desafio de pulos
function createLevel3() {
    const level = new Level();
    level.theme = 'desert';
    level.background = '#2ecc71';
    level.worldWidth = 2200;
    
    addGround(level);
    level.platforms.push(new Platform(150, 350, 60, 20));
    level.platforms.push(new Platform(300, 300, 60, 20));
    level.platforms.push(new Platform(450, 250, 60, 20));
    level.platforms.push(new Platform(600, 200, 60, 20));
    level.platforms.push(new Platform(700, 150, 60, 20));
    level.platforms.push(new Platform(900, 320, 80, 20));
    level.platforms.push(new Platform(1080, 260, 80, 20));
    level.platforms.push(new Platform(1260, 200, 80, 20));
    level.platforms.push(new Platform(1460, 140, 80, 20));
    level.platforms.push(new Platform(1700, 220, 120, 20));
    level.platforms.push(new Platform(1900, 300, 120, 20));
    
    level.coins.push(new Coin(170, 320));
    level.coins.push(new Coin(320, 270));
    level.coins.push(new Coin(470, 220));
    level.coins.push(new Coin(620, 170));
    level.coins.push(new Coin(720, 120));
    level.coins.push(new Coin(920, 290));
    level.coins.push(new Coin(1100, 230));
    level.coins.push(new Coin(1280, 170));
    level.coins.push(new Coin(1480, 110));
    level.coins.push(new Coin(1720, 190));
    level.coins.push(new Coin(1920, 270));
    
    level.goals.push(new Goal(2120, 336));
    
    return level;
}

// FASE 4 - Labirinto de plataformas
function createLevel4() {
    const level = new Level();
    level.theme = 'cave';
    level.background = '#9b59b6';
    level.worldWidth = 2400;
    
    addGround(level);
    level.platforms.push(new Platform(100, 350, 150, 20));
    level.platforms.push(new Platform(350, 350, 150, 20));
    level.platforms.push(new Platform(600, 350, 150, 20));
    level.platforms.push(new Platform(250, 300, 100, 20));
    level.platforms.push(new Platform(500, 300, 100, 20));
    level.platforms.push(new Platform(350, 250, 100, 20));
    level.platforms.push(new Platform(900, 350, 160, 20));
    level.platforms.push(new Platform(1160, 310, 140, 20));
    level.platforms.push(new Platform(1400, 270, 140, 20));
    level.platforms.push(new Platform(1620, 230, 140, 20));
    level.platforms.push(new Platform(1840, 190, 140, 20));
    level.platforms.push(new Platform(2080, 310, 200, 20));
    
    level.coins.push(new Coin(150, 320));
    level.coins.push(new Coin(400, 320));
    level.coins.push(new Coin(650, 320));
    level.coins.push(new Coin(280, 270));
    level.coins.push(new Coin(530, 270));
    level.coins.push(new Coin(380, 220));
    level.coins.push(new Coin(940, 320));
    level.coins.push(new Coin(1200, 280));
    level.coins.push(new Coin(1440, 240));
    level.coins.push(new Coin(1660, 200));
    level.coins.push(new Coin(1880, 160));
    level.coins.push(new Coin(2140, 280));
    
    level.goals.push(new Goal(2320, 336));
    
    return level;
}

// FASE 5 - Chefe final
function createLevel5() {
    const level = new Level();
    level.theme = 'castle';
    level.background = '#e74c3c';
    level.worldWidth = 2600;
    
    addGround(level);
    level.platforms.push(new Platform(200, 350, 400, 20));
    level.platforms.push(new Platform(350, 300, 100, 20));
    level.platforms.push(new Platform(100, 250, 100, 20));
    level.platforms.push(new Platform(600, 250, 100, 20));
    level.platforms.push(new Platform(900, 350, 500, 20));
    level.platforms.push(new Platform(1100, 300, 120, 20));
    level.platforms.push(new Platform(1300, 250, 120, 20));
    level.platforms.push(new Platform(1500, 200, 120, 20));
    level.platforms.push(new Platform(1750, 260, 150, 20));
    level.platforms.push(new Platform(2000, 320, 200, 20));
    
    level.coins.push(new Coin(250, 320));
    level.coins.push(new Coin(350, 320));
    level.coins.push(new Coin(450, 320));
    level.coins.push(new Coin(550, 320));
    level.coins.push(new Coin(375, 270));
    level.coins.push(new Coin(120, 220));
    level.coins.push(new Coin(620, 220));
    level.coins.push(new Coin(950, 320));
    level.coins.push(new Coin(1150, 270));
    level.coins.push(new Coin(1350, 220));
    level.coins.push(new Coin(1550, 170));
    level.coins.push(new Coin(1800, 230));
    level.coins.push(new Coin(2050, 290));
    
    level.goals.push(new Goal(2520, 336));
    
    return level;
}

function createLevels() {
    return [
        createLevel1(),
        createLevel2(),
        createLevel3(),
        createLevel4(),
        createLevel5()
    ];
}

let levels = createLevels();