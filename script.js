window.onload = function () {
    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Load assets
    const assets = {
        player: new Image(),
        drone: new Image(),
        blackDrone: new Image(),
        bomb: new Image(),
        explosion: new Image(),
        snowflake: new Image(),
        laserSound: new Audio('attack-laser-128280.mp3'),
        explosionSound: new Audio('small-explosion-129477.mp3'),
        gameOverSound: new Audio('game-over.mp3'),
        backgroundMusic: new Audio('lonely-winter-breeze-36867.mp3')
    };

    assets.player.src = 'gun2.png';
    assets.drone.src = 'drone2.png';
    assets.blackDrone.src = 'blackdrone.png';
    assets.bomb.src = 'bomb.png';
    assets.explosion.src = 'explosion.png';
    assets.snowflake.src = 'snowflake.png';

    assets.laserSound.volume = 0.5;
    assets.explosionSound.volume = 0.5;
    assets.gameOverSound.volume = 0.7;
    assets.backgroundMusic.volume = 0.2;
    assets.backgroundMusic.loop = true;

    document.addEventListener('click', () => assets.backgroundMusic.play(), { once: true });

    // Game variables
    let player = { x: canvas.width / 2, y: canvas.height - 100, size: 80, angle: 0 };
    let drones = [], lasers = [], explosions = [], snowflakes = [], bombs = [], score = 0;
    let gameOver = false;
    let difficulty = 2000;

    // Create snowflakes for background effect
    function createSnowflakes() {
        for (let i = 0; i < 50; i++) {
            snowflakes.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, speed: Math.random() * 2 + 1 });
        }
    }
    createSnowflakes();

    // Spawning enemies
    function createDrone() {
        if (!gameOver) {
            let isBlack = Math.random() > 0.8;
            drones.push({
                x: Math.random() * (canvas.width - 80),
                y: 0,
                speed: Math.random() * 2 + 1,
                black: isBlack
            });
        }
    }

    function createBomb() {
        if (!gameOver) {
            bombs.push({
                x: Math.random() * (canvas.width - 50),
                y: 0,
                speed: Math.random() * 2 + 2
            });
        }
    }

    function shoot() {
        if (!gameOver) {
            // Laser starts from the front of the gun
            let laserX = player.x + Math.cos(player.angle) * player.size / 2;
            let laserY = player.y + Math.sin(player.angle) * player.size / 2;
            
            lasers.push({ x: laserX, y: laserY, angle: player.angle, speed: 10 });

            assets.laserSound.currentTime = 0;
            assets.laserSound.play();
        }
    }

    // Controls
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') shoot();
        if (e.code === 'ArrowLeft') player.angle -= Math.PI / 18;
        if (e.code === 'ArrowRight') player.angle += Math.PI / 18;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!gameOver) {
            const rect = canvas.getBoundingClientRect();
            player.angle = Math.atan2(e.clientY - rect.top - player.y, e.clientX - rect.left - player.x);
        }
    });

    function checkCollisions() {
        for (let i = lasers.length - 1; i >= 0; i--) {
            for (let j = drones.length - 1; j >= 0; j--) {
                if (Math.hypot(lasers[i].x - (drones[j].x + 40), lasers[i].y - (drones[j].y + 40)) < 40) {
                    explosions.push({ x: drones[j].x, y: drones[j].y, timer: 30 });
                    drones.splice(j, 1);
                    lasers.splice(i, 1);
                    score += drones[j].black ? -20 : 10;
                    assets.explosionSound.play();
                    if (drones[j].black) endGame();
                    break;
                }
            }
        }

        for (let i = bombs.length - 1; i >= 0; i--) {
            if (Math.hypot(bombs[i].x - player.x, bombs[i].y - player.y) < 40) {
                explosions.push({ x: player.x, y: player.y, timer: 30 });
                bombs.splice(i, 1);
                endGame();
            }
        }
    }

    function endGame() {
        gameOver = true;
        assets.gameOverSound.play();
    }

    function gameLoop() {
        if (gameOver) {
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = 'white';
            context.font = '40px Arial';
            context.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
            context.fillText('Score: ' + score, canvas.width / 2 - 50, canvas.height / 2 + 40);
            return;
        }

        context.fillStyle = '#001F3F';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Snowflakes
        snowflakes.forEach(flake => {
            flake.y = (flake.y + flake.speed) % canvas.height;
            context.drawImage(assets.snowflake, flake.x, flake.y, 10, 10);
        });

        // Draw Player (Gun)
        context.save();
        context.translate(player.x, player.y);
        context.rotate(player.angle);
        context.drawImage(assets.player, -player.size / 2, -player.size / 2, player.size, player.size);
        context.restore();

        // Draw Laser Beams
        lasers.forEach(laser => {
            laser.x += Math.cos(laser.angle) * laser.speed;
            laser.y += Math.sin(laser.angle) * laser.speed;
            context.fillStyle = 'red';
            context.fillRect(laser.x, laser.y, 5, 20);
        });

        // Draw Drones
        drones.forEach(drone => {
            drone.y += drone.speed;
            context.drawImage(drone.black ? assets.blackDrone : assets.drone, drone.x, drone.y, 80, 80);
        });

        // Draw Bombs
        bombs.forEach(bomb => {
            bomb.y += bomb.speed;
            context.drawImage(assets.bomb, bomb.x, bomb.y, 50, 50);
        });

        // Draw Explosions
        explosions.forEach((explosion, i) => {
            context.drawImage(assets.explosion, explosion.x, explosion.y, 80, 80);
            explosion.timer--;
            if (explosion.timer <= 0) explosions.splice(i, 1);
        });

        checkCollisions();

        if (score >= 50) difficulty = 1000;

        requestAnimationFrame(gameLoop);
    }

    setInterval(createDrone, difficulty);
    setInterval(createBomb, 5000);
    gameLoop();
};
