window.onload = function () {
    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function drawRotatedImage(img, x, y, angle, size) {
        context.save();
        context.translate(x, y);
        context.rotate(angle);
        context.drawImage(img, -size / 2, -size / 2, size, size);
        context.restore();
    }

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
        gameOverSound: new Audio('game-over-368511.mp3')
    };

    assets.player.src = 'gun2.png';
    assets.drone.src = 'drone2.png';
    assets.blackDrone.src = 'blackdrone.png';
    assets.bomb.src = 'bomb.png';
    assets.explosion.src = 'explosion.png';
    assets.snowflake.src = 'snowflake.png';
    assets.backgroundMusic.loop = true;

    assets.laserSound.load();
    assets.gameOverSound.load();

    let player = { x: canvas.width / 2, y: canvas.height - 100, size: 80, angle: 0 };
    let drones = [], blackDrones = [], bombs = [], lasers = [], explosions = [], snowflakes = [], score = 0;
    let isAudioEnabled = false, gameOver = false;

    // Handle window resizing
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        player.x = canvas.width / 2; // Reset player position
        player.y = canvas.height - 100;
    });

    // Enable audio on user interaction
    document.addEventListener('click', () => {
        if (!isAudioEnabled) {
            assets.backgroundMusic.play().catch(err => console.error('Audio Error:', err));
            isAudioEnabled = true;
        }
    });

    // Create game objects
    function createDrone() {
        if (!gameOver) {
            drones.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 1 + score / 100 });
        }
    }

    function createBlackDrone() {
        if (!gameOver) {
            blackDrones.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 2 + score / 100 });
        }
    }

    function createBomb() {
        if (!gameOver) {
            bombs.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 2 + score / 100 });
        }
    }

    // Update and clean up objects
    function updateObjects() {
        // Remove drones and bombs that go off-screen
        drones = drones.filter(drone => drone.y < canvas.height);
        blackDrones = blackDrones.filter(drone => drone.y < canvas.height);
        bombs = bombs.filter(bomb => bomb.y < canvas.height);
    }

    // Update and draw lasers
    function updateLasers() {
        lasers.forEach((laser, index) => {
            laser.y -= 10; // Move laser upwards
            context.fillStyle = 'yellow';
            context.fillRect(laser.x, laser.y, 5, 20); // Draw laser

            // Remove lasers that go off-screen
            if (laser.y < 0) {
                lasers.splice(index, 1);
            }
        });
    }

    // Check for collisions
    function checkCollisions() {
        lasers.forEach((laser, laserIndex) => {
            drones.forEach((drone, droneIndex) => {
                if (laser.x > drone.x && laser.x < drone.x + 80 && laser.y > drone.y && laser.y < drone.y + 80) {
                    // Collision detected
                    lasers.splice(laserIndex, 1);
                    drones.splice(droneIndex, 1);
                    score += 10;
                    assets.explosionSound.play();
                }
            });

            blackDrones.forEach((drone, droneIndex) => {
                if (laser.x > drone.x && laser.x < drone.x + 80 && laser.y > drone.y && laser.y < drone.y + 80) {
                    // Collision detected
                    lasers.splice(laserIndex, 1);
                    blackDrones.splice(droneIndex, 1);
                    score += 20;
                    assets.explosionSound.play();
                }
            });
        });

        // Check for player collision with bombs or drones
        bombs.forEach((bomb, bombIndex) => {
            if (bomb.x > player.x - player.size / 2 && bomb.x < player.x + player.size / 2 &&
                bomb.y > player.y - player.size / 2 && bomb.y < player.y + player.size / 2) {
                // Player hit by bomb
                gameOver = true;
                assets.gameOverSound.play();
            }
        });

        drones.forEach(drone => {
            if (drone.x > player.x - player.size / 2 && drone.x < player.x + player.size / 2 &&
                drone.y > player.y - player.size / 2 && drone.y < player.y + player.size / 2) {
                // Player hit by drone
                gameOver = true;
                assets.gameOverSound.play();
            }
        });
    }

    // Spawn objects at intervals
    let lastDroneTime = 0, lastBlackDroneTime = 0, lastBombTime = 0;

    function spawnObjects() {
        const now = Date.now();

        if (now - lastDroneTime > 2000) {
            createDrone();
            lastDroneTime = now;
        }

        if (score > 50 && now - lastBlackDroneTime > 3000) {
            createBlackDrone();
            lastBlackDroneTime = now;
        }

        if (score > 100 && now - lastBombTime > 5000) {
            createBomb();
            lastBombTime = now;
        }
    }

    // Main game loop
    function gameLoop() {
        if (gameOver) {
            context.fillStyle = 'red';
            context.font = '40px Arial';
            context.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2);
            return;
        }

        context.fillStyle = '#001F3F';
        context.fillRect(0, 0, canvas.width, canvas.height);

        spawnObjects(); // Spawn new objects
        updateObjects(); // Clean up off-screen objects
        updateLasers(); // Update and draw lasers
        checkCollisions(); // Check for collisions

        // Draw player
        drawRotatedImage(assets.player, player.x, player.y, player.angle, player.size);

        // Draw drones
        drones.forEach(drone => {
            drone.y += drone.speed;
            context.drawImage(assets.drone, drone.x, drone.y, 80, 80);
        });

        // Draw black drones
        blackDrones.forEach(drone => {
            drone.y += drone.speed;
            context.drawImage(assets.blackDrone, drone.x, drone.y, 80, 80);
        });

        // Draw bombs
        bombs.forEach(bomb => {
            bomb.y += bomb.speed;
            context.drawImage(assets.bomb, bomb.x, bomb.y, 60, 60);
        });

        // Draw score
        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.fillText('Score: ' + score, 20, 30);

        requestAnimationFrame(gameLoop);
    }

    // Player controls
    document.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    });

    document.addEventListener('mousedown', () => {
        if (!gameOver) {
            const tipX = player.x + Math.cos(player.angle) * (player.size / 2);
            const tipY = player.y + Math.sin(player.angle) * (player.size / 2);
            lasers.push({ x: tipX, y: tipY });
            assets.laserSound.currentTime = 0;
            assets.laserSound.play();
        }
    });

    document.addEventListener('mouseup', () => {
        lasers = [];
    });

    // Start the game loop
    gameLoop();
};
