window.onload = function () {
    const canvas = document.getElementById("gameCanvas");
    const context = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    context.scale(dpr, dpr);

    const assets = {
        player: new Image(),
        drone: new Image(),
        blackDrone: new Image(),
        snowDrone: new Image(),
        bomb: new Image(),
        explosion: new Image(),
        iceEffect: new Image(),
        snowflake: new Image(),
        laserSound: new Audio('laser-shot-.mp3'),
        explosionSound: new Audio('small-explosion-129477.mp3'),
        snowExplosionSound: new Audio('snow-explosion.mp3'),
        backgroundMusic: new Audio('lonely-winter-breeze-36867.mp3'),
        gameOverSound: new Audio('gameover.mp3'),
        freezeSound: new Audio('freeze-sound.mp3.mp3')
    };

    const imagePaths = {
        player: 'gun2.png.png',
        drone: 'drone2.png.png',
        blackDrone: 'blackdrone.png.png',
        snowDrone: 'snowdrone.png.png',
        bomb: 'bomb.png.png',
        explosion: 'explosion.png.png',
        snowflake: 'snowflake.png.png',
        iceEffect: 'iceoverlay.png'
    };

    let loadedImages = 0;
    let totalImages = Object.keys(imagePaths).length;
    let player = { x: canvas.width / 2, y: canvas.height / 2, size: 60, angle: 0 };
    let drones = [], blackDrones = [], snowDrones = [], bombs = [], explosions = [], snowflakes = [];
    let score = 0, gameOver = false, speedMultiplier = 1;
    let laserActive = false, isFrozen = false, freezeTimer = 0, freezeEffectAlpha = 0;
    let gameStarted = false;

    // Load images
    Object.keys(imagePaths).forEach((key) => {
        assets[key].src = imagePaths[key];
        assets[key].onload = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                alert("Tap or click to start the game.");
            }
        };
        assets[key].onerror = () => console.error(`Failed to load ${key}`);
    });

    // Define spawnObjects function
    function spawnObjects() {
        // Example: Spawn a drone at a random position
        const drone = {
            x: Math.random() * canvas.width,
            y: -50, // Start above the canvas
            speed: 2 * speedMultiplier
        };
        drones.push(drone);

        // Example: Spawn a bomb at a random position
        const bomb = {
            x: Math.random() * canvas.width,
            y: -50,
            speed: 3 * speedMultiplier
        };
        bombs.push(bomb);

        // Example: Spawn a snow drone at a random position
        const snowDrone = {
            x: Math.random() * canvas.width,
            y: -50,
            speed: 1.5 * speedMultiplier
        };
        snowDrones.push(snowDrone);
    }

    function startGame() {
        if (gameStarted) return;
        gameStarted = true;
        assets.backgroundMusic.loop = true;
        assets.backgroundMusic.play().catch(() => console.warn("Audio play blocked until user interacts."));
        alert("Warning: The game will freeze at multiples of 300!");

        setInterval(spawnObjects, 1000); // Call spawnObjects every second
        gameLoop();
    }

    // Ensure game starts only when user interacts
    document.addEventListener("click", startGame);
    document.addEventListener("touchstart", startGame);

    function drawGameObjects() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Draw player
        context.save();
        context.translate(player.x, player.y);
        context.rotate(player.angle);
        context.drawImage(assets.player, -player.size / 2, -player.size / 2, player.size, player.size);
        context.restore();

        // Draw drones
        drones.forEach(drone => context.drawImage(assets.drone, drone.x, drone.y, 50, 50));
        blackDrones.forEach(drone => context.drawImage(assets.blackDrone, drone.x, drone.y, 50, 50));
        bombs.forEach(bomb => context.drawImage(assets.bomb, bomb.x, bomb.y, 50, 50));
        snowDrones.forEach(snowDrone => context.drawImage(assets.snowDrone, snowDrone.x, snowDrone.y, 50, 50));

        // Draw explosions
        explosions.forEach(explosion => {
            if (explosion.isSnowExplosion) {
                context.drawImage(assets.snowflake, explosion.x, explosion.y, 50, 50);
            } else {
                context.drawImage(assets.explosion, explosion.x, explosion.y, 50, 50);
            }
        });

        // Draw freeze overlay
        if (isFrozen) {
            context.globalAlpha = freezeEffectAlpha;
            context.drawImage(assets.iceEffect, 0, 0, canvas.width, canvas.height);
            context.globalAlpha = 1;
        }

        // Draw score
        context.fillStyle = "white";
        context.font = "20px Arial";
        context.fillText("Score: " + score, 20, 30);
    }

    function gameLoop() {
        if (gameOver) {
            context.fillStyle = 'white';
            context.font = '40px Arial';
            context.fillText('Game Over!', canvas.width / 2 - 80, canvas.height / 2);
            return;
        }

        if (score >= 300 && score % 300 === 0 && !isFrozen) {
            isFrozen = true;
            freezeTimer = 300;
            assets.freezeSound.play();
        }

        drawGameObjects();
        checkLaserCollisions();
        updateFreeze();
        requestAnimationFrame(gameLoop);
    }
};
