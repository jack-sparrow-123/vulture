window.onload = function () {
    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');

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

    let player = { x: canvas.width / 2, y: canvas.height - 100, size: 80 };
    let drones = [], lasers = [], explosions = [], snowflakes = [], bombs = [], score = 0;
    let gameOver = false;
    let difficulty = 2000;

    function createDrone() {
        if (!gameOver) {
            let isBlack = Math.random() > 0.8;
            drones.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 1, black: isBlack });
        }
    }

    function createBomb() {
        if (!gameOver) {
            bombs.push({ x: Math.random() * (canvas.width - 50), y: 0, speed: Math.random() * 2 + 2 });
        }
    }

    function shoot() {
        if (!gameOver) {
            lasers.push({ x: player.x - 20, width: 40, height: canvas.height });
            assets.laserSound.currentTime = 0;
            assets.laserSound.play();
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') shoot();
        if (e.code === 'ArrowLeft') player.x = Math.max(0, player.x - 20);
        if (e.code === 'ArrowRight') player.x = Math.min(canvas.width, player.x + 20);
    });

    function checkCollisions() {
        drones.forEach((drone, j) => {
            lasers.forEach((laser, i) => {
                if (laser.x + laser.width >= drone.x && laser.x <= drone.x + 80) {
                    explosions.push({ x: drone.x, y: drone.y, timer: 30 });
                    drones.splice(j, 1);
                    lasers.splice(i, 1);
                    score += drone.black ? -20 : 10;
                    assets.explosionSound.play();
                    if (drone.black) endGame();
                }
            });
        });

        bombs.forEach((bomb, i) => {
            if (Math.hypot(bomb.x - player.x, bomb.y - player.y) < 40) {
                explosions.push({ x: player.x, y: player.y, timer: 30 });
                bombs.splice(i, 1);
                endGame();
            }
        });
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

        context.drawImage(assets.player, player.x - 40, player.y - 40, 80, 80);

        lasers.forEach(laser => {
            context.fillStyle = 'red';
            context.fillRect(laser.x, 0, laser.width, laser.height);
        });

        checkCollisions();

        if (score >= 50) difficulty = 1000;

        requestAnimationFrame(gameLoop);
    }

    setInterval(createDrone, difficulty);
    setInterval(createBomb, 5000);
    gameLoop();
};
