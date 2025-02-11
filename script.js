window.onload = function () {
    const canvas = document.getElementById("gameCanvas");
    const context = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const assets = {
        player: new Image(),
        drone: new Image(),
        blackDrone: new Image(),
        bomb: new Image(),
        explosion: new Image(),
        snowflake: new Image(),
        laserSound: new Audio('attack-laser-128280.mp3'),
        explosionSound: new Audio('small-explosion-129477.mp3'),
        backgroundMusic: new Audio('lonely-winter-breeze-36867.mp3'),
        gameOverSound: new Audio('game-over-38511.mp3')
    };

    const imagePaths = {
        player: 'gun2.png.png',
        drone: 'drone2.png.png',
        blackDrone: 'blackdrone.png.png',
        bomb: 'bomb.png.png',
        explosion: 'explosion.png.png',
        snowflake: 'snowflake.png.png'
    };

    let loadedImages = 0;
    let totalImages = Object.keys(imagePaths).length;

    Object.keys(imagePaths).forEach((key) => {
        assets[key].src = imagePaths[key];
        assets[key].onload = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                startGame();
            }
        };
        assets[key].onerror = () => {
            console.error(`Error loading image: ${imagePaths[key]}`);
        };
    });

    let player = { x: canvas.width / 2, y: canvas.height - 100, size: 80, angle: 0 };
    let drones = [], blackDrones = [], bombs = [], lasers = [], explosions = [], snowflakes = [], score = 0;
    let isAudioEnabled = false;
    let gameOver = false;
    let gameOverSoundPlayed = false;

    // Enable audio on user interaction
    document.addEventListener('click', () => {
        if (!isAudioEnabled) {
            assets.backgroundMusic.play();
            isAudioEnabled = true;
        }
    });

    // Player movement and shooting
    canvas.addEventListener('mousemove', (e) => {
        if (!gameOver) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);
        }
    });

    canvas.addEventListener('click', () => {
        if (!gameOver) {
            shootLaser();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (!gameOver) {
            if (e.code === 'Space') {
                shootLaser();
            }
        }
    });

    function shootLaser() {
        lasers.push({ x: player.x, y: player.y, angle: player.angle });
        assets.laserSound.play();
    }

    function checkLaserCollisions() {
        lasers.forEach((laser, li) => {
            drones.forEach((drone, di) => {
                if (Math.hypot(drone.x - laser.x, drone.y - laser.y) < 40) {
                    explosions.push({ x: drone.x, y: drone.y, timer: 30 });
                    drones.splice(di, 1);
                    lasers.splice(li, 1);
                    score += 10;
                    assets.explosionSound.play();
                }
            });
            blackDrones.forEach((drone, bi) => {
                if (Math.hypot(drone.x - laser.x, drone.y - laser.y) < 40) {
                    explosions.push({ x: drone.x, y: drone.y, timer: 30 });
                    blackDrones.splice(bi, 1);
                    lasers.splice(li, 1);
                    gameOver = true;
                    assets.explosionSound.play();
                }
            });
            bombs.forEach((bomb, bi) => {
                if (Math.hypot(bomb.x - laser.x, bomb.y - laser.y) < 40) {
                    explosions.push({ x: bomb.x, y: bomb.y, timer: 30 });
                    bombs.splice(bi, 1);
                    lasers.splice(li, 1);
                    gameOver = true;
                    assets.explosionSound.play();
                }
            });
        });
    }

    function createDrone() {
        drones.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 1 + score / 100 });
    }

    function createBlackDrone() {
        blackDrones.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 2 + score / 100 });
    }

    function createBomb() {
        bombs.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 2 + score / 100 });
    }

    function createSnowflake() {
        snowflakes.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 1 });
    }

    function drawGameObjects() {
        // Draw player
        context.save();
        context.translate(player.x, player.y);
        context.rotate(player.angle);
        context.drawImage(assets.player, -player.size / 2, -player.size / 2, player.size, player.size);
        context.restore();

        // Draw drones, black drones, bombs, and snowflakes
        drones.forEach(drone => { drone.y += drone.speed; context.drawImage(assets.drone, drone.x, drone.y, 80, 80); });
        blackDrones.forEach(drone => { drone.y += drone.speed; context.drawImage(assets.blackDrone, drone.x, drone.y, 80, 80); });
        bombs.forEach(bomb => { bomb.y += bomb.speed; context.drawImage(assets.bomb, bomb.x, bomb.y, 60, 60); });
        snowflakes.forEach(snowflake => { snowflake.y += snowflake.speed; context.drawImage(assets.snowflake, snowflake.x, snowflake.y, 20, 20); });

        // Draw lasers
        lasers.forEach(laser => {
            context.strokeStyle = 'red';
            context.lineWidth = 4;
            context.beginPath();
            context.moveTo(laser.x, laser.y);
            context.lineTo(laser.x + Math.cos(laser.angle) * canvas.height, laser.y + Math.sin(laser.angle) * canvas.height);
            context.stroke();
        });

        // Draw explosions
        explosions.forEach((explosion, index) => {
            context.drawImage(assets.explosion, explosion.x - 40, explosion.y - 40, 80, 80);
            explosion.timer--;
            if (explosion.timer <= 0) {
                explosions.splice(index, 1);
            }
        });

        // Draw score
        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.fillText(`Score: ${score}`, 20, 30);
    }

    function gameLoop() {
        if (gameOver) {
            if (!gameOverSoundPlayed) {
                assets.gameOverSound.play();
                gameOverSoundPlayed = true;
            }
            context.fillStyle = 'red';
            context.font = '40px Arial';
            context.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2);
            return;
        }
        context.fillStyle = '#001F3F';
        context.fillRect(0, 0, canvas.width, canvas.height);
        drawGameObjects();
        checkLaserCollisions();
        requestAnimationFrame(gameLoop);
    }

    function startGame() {
        assets.backgroundMusic.loop = true;
        setInterval(createDrone, 1000);
        setInterval(createBlackDrone, 3000);
        setInterval(createBomb, 5000);
        setInterval(createSnowflake, 500);
        gameLoop();
    }
};
