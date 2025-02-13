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
        iceOverlay: new Image(),
        frozenDrone: new Image(),
        laserSound: new Audio('laser-shot-.mp3'),
        explosionSound: new Audio('small-explosion-129477.mp3'),
        backgroundMusic: new Audio('lonely-winter-breeze-36867.mp3'),
        gameOverSound: new Audio('gameover.mp3'),
        freezingSound: new Audio('freeze-sound.mp3.mp3'),
        snowExplosionSound: new Audio('snow-explosion.mp3')
    };

    const imagePaths = {
        player: 'gun2.png.png',
        drone: 'drone2.png.png',
        blackDrone: 'blackdrone.png.png',
        bomb: 'bomb.png.png',
        explosion: 'explosion.png.png',
        snowflake: 'snowflake.png.png',
        iceOverlay: 'iceoverlay.png',
        frozenDrone: 'snowdrone.png.png'
    };

    let loadedImages = 0;
    let totalImages = Object.keys(imagePaths).length;
    let player = { x: canvas.width / 2, y: canvas.height / 2, size: 60, angle: 0 };
    let drones = [], blackDrones = [], bombs = [], explosions = [], snowflakes = [], score = 0;
    let isAudioEnabled = true; // Sound is initially on
    let gameOver = false;
    let gameOverSoundPlayed = false;
    let speedMultiplier = 1;
    let laserActive = false;
    let isFreezing = false;
    let freezeTimer = 0;
    let frozenDroneActive = false;
    let isPaused = false;
    let gameLoopId = null; // To store the game loop ID
    let spawnIntervalId = null; // To store the spawn interval ID

    // Store snow explosion effects
    let snowExplosions = [];

    Object.keys(imagePaths).forEach((key) => {
        assets[key].src = imagePaths[key];
        assets[key].onload = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                startGame();
            }
        };
    });

    // Alert the player about freezing mechanics
    alert("Warning: When your score reaches multiples of 300, the game will freeze temporarily. At 600, a frozen drone will appear. Be careful!");

    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', movePlayer);
    document.addEventListener('mousedown', activateLaser);
    document.addEventListener('mouseup', deactivateLaser);
    document.addEventListener('touchstart', activateLaser);
    document.addEventListener('touchend', deactivateLaser);
    canvas.addEventListener('mousemove', aimGun);
    canvas.addEventListener('touchmove', movePlayerTouch);

    // Add sound toggle functionality
    const soundButton = document.querySelector('button[onclick="toggleSound()"]');
    soundButton.addEventListener('click', toggleSound);

    // Set initial sound button text
    soundButton.textContent = `Sound: ${isAudioEnabled ? 'On' : 'Off'}`;

    function toggleSound() {
        isAudioEnabled = !isAudioEnabled;
        soundButton.textContent = `Sound: ${isAudioEnabled ? 'On' : 'Off'}`;

        // Mute/unmute all audio elements
        Object.values(assets).forEach(audio => {
            if (audio instanceof Audio) {
                audio.muted = !isAudioEnabled;
            }
        });

        // Pause background music if sound is off
        if (!isAudioEnabled) {
            assets.backgroundMusic.pause();
        } else if (!isPaused && !gameOver) {
            assets.backgroundMusic.play();
        }
    }

    function enableAudio() {
        if (!isAudioEnabled) {
            assets.backgroundMusic.play();
            isAudioEnabled = true;
        }
    }

    function movePlayer(e) {
        if (gameOver || isPaused) return;
        if (e.code === 'ArrowLeft') player.x -= 10;
        if (e.code === 'ArrowRight') player.x += 10;
        if (e.code === 'ArrowUp') player.y -= 10;
        if (e.code === 'ArrowDown') player.y += 10;
    }

    function movePlayerTouch(e) {
        if (gameOver || isPaused) return;
        player.x = e.touches[0].clientX;
        player.y = e.touches[0].clientY;
    }

    function aimGun(e) {
        if (gameOver || isPaused) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    }

    function activateLaser() {
        if (!laserActive && !isPaused) {
            laserActive = true;
            if (assets.laserSound.paused) {
                assets.laserSound.currentTime = 0;
                assets.laserSound.play();
            }
        }
    }

    function deactivateLaser() {
        laserActive = false;
        assets.laserSound.pause();
        assets.laserSound.currentTime = 0;
    }

    function checkLaserCollisions() {
        if (!laserActive || isPaused) return;

        const laserEndX = player.x + Math.cos(player.angle) * canvas.width * 2;
        const laserEndY = player.y + Math.sin(player.angle) * canvas.width * 2;

        [drones, blackDrones, bombs].forEach((arr, ai) => {
            for (let i = arr.length - 1; i >= 0; i--) {
                const obj = arr[i];
                if (lineCircleIntersection(player.x, player.y, laserEndX, laserEndY, obj.x, obj.y, 25)) {
                    explosions.push({ x: obj.x, y: obj.y, timer: 30 });
                    arr.splice(i, 1);

                    if (ai === 0) {
                        score += 10;
                    } else {
                        gameOver = true;
                        if (!gameOverSoundPlayed) {
                            assets.gameOverSound.play();
                            gameOverSoundPlayed = true;
                        }
                    }

                    assets.explosionSound.currentTime = 0;
                    assets.explosionSound.play();

                    if (laserActive) {
                        assets.laserSound.pause();
                        assets.laserSound.currentTime = 0;
                        laserActive = false;
                    }
                }
            }
        });

        // Check collision with frozen drone
        if (frozenDroneActive) {
            const frozenDrone = blackDrones.find(drone => drone.isFrozen);
            if (frozenDrone && lineCircleIntersection(player.x, player.y, laserEndX, laserEndY, frozenDrone.x, frozenDrone.y, 25)) {
                // Draw white circle at the point of impact
                context.beginPath();
                context.arc(frozenDrone.x, frozenDrone.y, 50, 0, Math.PI * 2);
                context.fillStyle = 'rgba(255, 255, 255, 0.5)';
                context.fill();

                // Trigger snow explosion
                snowExplosion(frozenDrone.x, frozenDrone.y);
                gameOver = true;
                if (!gameOverSoundPlayed) {
                    assets.gameOverSound.play();
                    gameOverSoundPlayed = true;
                }
            }
        }
    }

    function lineCircleIntersection(x1, y1, x2, y2, cx, cy, r) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const fx = x1 - cx;
        const fy = y1 - cy;

        const a = dx * dx + dy * dy;
        const b = 2 * (fx * dx + fy * dy);
        const c = fx * fx + fy * fy - r * r;

        const discriminant = b * b - 4 * a * c;

        if (discriminant < 0) return false;

        const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

        return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
    }

    function spawnObjects() {
        if (isPaused || gameOver) return;
        drones.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 1 * speedMultiplier });
        if (score >= 50) speedMultiplier = 1.5;
        if (Math.random() < 0.3) blackDrones.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 2 * speedMultiplier });
        if (Math.random() < 0.2) bombs.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 2 * speedMultiplier });
        snowflakes.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 1, size: Math.random() * 10 + 5 });

        // Spawn frozen drone at score 600 with increased complexity
        if (score >= 600 && !frozenDroneActive) {
            blackDrones.push({ x: Math.random() * canvas.width, y: 0, speed: 3, isFrozen: true });
            frozenDroneActive = true;
            speedMultiplier = 2; // Increase game speed
        }
    }

    function drawGameObjects() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#001F3F';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw player
        context.save();
        context.translate(player.x, player.y);
        context.rotate(player.angle);
        context.drawImage(assets.player, -player.size / 2, -player.size / 2, player.size, player.size);
        context.restore();

        // Draw drones, black drones, bombs, and snowflakes
        [drones, blackDrones, bombs, snowflakes].forEach((arr, index) => {
            arr.forEach(obj => {
                obj.y += obj.speed;
                if (index === 3) {
                    context.drawImage(assets.snowflake, obj.x, obj.y, obj.size, obj.size);
                } else {
                    context.drawImage(assets[index === 0 ? 'drone' : index === 1 ? 'blackDrone' : 'bomb'], obj.x, obj.y, 50, 50);
                }
            });
        });

        // Draw frozen drone
        if (frozenDroneActive) {
            const frozenDrone = blackDrones.find(drone => drone.isFrozen);
            if (frozenDrone) {
                context.drawImage(assets.frozenDrone, frozenDrone.x, frozenDrone.y, 60, 60);
            }
        }

        // Draw laser beam if active
        if (laserActive) {
            const laserEndX = player.x + Math.cos(player.angle) * canvas.width * 2;
            const laserEndY = player.y + Math.sin(player.angle) * canvas.width * 2;
            context.strokeStyle = 'red';
            context.lineWidth = 4;
            context.beginPath();
            context.moveTo(player.x, player.y);
            context.lineTo(laserEndX, laserEndY);
            context.stroke();
        }

        // Draw explosions
        explosions.forEach((explosion, index) => {
            context.drawImage(assets.explosion, explosion.x - 40, explosion.y - 40, 80, 80);
            if (--explosion.timer <= 0) explosions.splice(index, 1);
        });

        // Draw snow explosions
        snowExplosions.forEach((explosion) => {
            // Draw white circle
            context.beginPath();
            context.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            context.fillStyle = 'rgba(255, 255, 255, 0.5)';
            context.fill();

            // Draw snowflakes
            explosion.snowflakes.forEach(snowflake => {
                context.drawImage(assets.snowflake, snowflake.x, snowflake.y, snowflake.size, snowflake.size);
            });
        });

        // Draw score
        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.fillText(`Score: ${score}`, 20, 30);

        // Draw "Game Over" message
        if (gameOver) {
            context.fillStyle = 'red';
            context.font = '60px Arial';
            context.textAlign = 'center';
            context.fillText('Game Over', canvas.width / 2, canvas.height / 2);
        }

        // Draw ice overlay during freezing
        if (isFreezing) {
            context.globalAlpha = 0.5;
            context.drawImage(assets.iceOverlay, 0, 0, canvas.width, canvas.height);
            context.globalAlpha = 1.0;
        }

        // Draw "Paused" message
        if (isPaused) {
            context.fillStyle = 'yellow';
            context.font = '60px Arial';
            context.textAlign = 'center';
            context.fillText('Paused', canvas.width / 2, canvas.height / 2);
        }
    }

    function snowExplosion(x, y) {
        assets.snowExplosionSound.currentTime = 0;
        assets.snowExplosionSound.play();

        // Create snow explosion effect
        const explosion = {
            x: x,
            y: y,
            radius: 50,
            timer: 60, // 1 second at 60 FPS
            snowflakes: []
        };

        // Add snowflakes
        for (let i = 0; i < 100; i++) {
            explosion.snowflakes.push({
                x: x + Math.random() * 100 - 50,
                y: y + Math.random() * 100 - 50,
                size: Math.random() * 10 + 5,
                speed: Math.random() * 5 + 2,
                angle: Math.random() * Math.PI * 2
            });
        }

        snowExplosions.push(explosion);
    }

    function gameLoop() {
        if (gameOver || isPaused) {
            if (!gameOverSoundPlayed && gameOver) {
                assets.gameOverSound.play();
                gameOverSoundPlayed = true;
            }
            drawGameObjects();
            return;
        }

        // Update snow explosion effects
        snowExplosions.forEach((explosion, index) => {
            explosion.snowflakes.forEach(snowflake => {
                snowflake.x += Math.cos(snowflake.angle) * snowflake.speed;
                snowflake.y += Math.sin(snowflake.angle) * snowflake.speed;
            });

            // Reduce timer and remove if done
            if (--explosion.timer <= 0) {
                snowExplosions.splice(index, 1);
            }
        });

        // Check for freezing
        if (score % 300 === 0 && score !== 0 && !isFreezing) {
            isFreezing = true;
            freezeTimer = 180; // 3 seconds at 60 FPS
            assets.freezingSound.currentTime = 0;
            assets.freezingSound.play();
        }

        if (isFreezing) {
            freezeTimer--;
            if (freezeTimer <= 0) {
                isFreezing = false;
            }
        }

        drawGameObjects();
        checkLaserCollisions();
        gameLoopId = requestAnimationFrame(gameLoop); // Store the loop ID
    }

    function startGame() {
        assets.backgroundMusic.loop = true;
        spawnIntervalId = setInterval(spawnObjects, 1000); // Store the spawn interval ID
        gameLoop();
    }

    // Game control functions
    function pauseGame() {
        isPaused = true;
        assets.backgroundMusic.pause();
    }

    function resumeGame() {
        isPaused = false;
        assets.backgroundMusic.play();
        gameLoop(); // Restart the game loop
    }

    function restartGame() {
        // Clear all game objects
        drones = [];
        blackDrones = [];
        bombs = [];
        explosions = [];
        snowflakes = [];
        snowExplosions = [];

        // Reset game state
        player = { x: canvas.width / 2, y: canvas.height / 2, size: 60, angle: 0 };
        score = 0;
        gameOver = false;
        gameOverSoundPlayed = false;
        isPaused = false;
        frozenDroneActive = false;
        speedMultiplier = 1;

        // Reset audio
        assets.backgroundMusic.currentTime = 0;
        assets.backgroundMusic.play();

        // Restart the game loop
        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
        }
        if (spawnIntervalId) {
            clearInterval(spawnIntervalId);
        }
        startGame();
    }

    // Expose game control functions to the global scope
    window.pauseGame = pauseGame;
    window.resumeGame = resumeGame;
    window.restartGame = restartGame;
    window.toggleSound = toggleSound;
};
