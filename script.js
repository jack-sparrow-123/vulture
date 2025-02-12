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

    assets.iceEffect.src = 'iceoverlay.png';
    assets.iceEffect.onload = () => console.log("Ice effect loaded");

    const imagePaths = {
        player: 'gun2.png.png',
        drone: 'drone2.png.png',
        blackDrone: 'blackdrone.png.png',
        snowDrone: 'snowdrone.png.png',
        bomb: 'bomb.png.png',
        explosion: 'explosion.png.png',
        snowflake: 'snowflake.png.png'
    };

    let loadedImages = 0;
    let totalImages = Object.keys(imagePaths).length;
    let player = { x: canvas.width / 2, y: canvas.height / 2, size: 60, angle: 0 };
    let drones = [], blackDrones = [], snowDrones = [], bombs = [], explosions = [], snowflakes = [], score = 0;
    let gameOver = false;
    let speedMultiplier = 1;
    let laserActive = false;
    let isFrozen = false;
    let freezeTimer = 0;
    let freezeEffectAlpha = 0;

    Object.keys(imagePaths).forEach((key) => {
        assets[key].src = imagePaths[key];
        assets[key].onload = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                startGame();
            }
        };
    });

    // Touch and mouse controls
    let touchStartX = 0, touchStartY = 0;
    let isTouching = false;

    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        isTouching = true;
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        laserActive = true;
    });

    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        if (isTouching) {
            const touch = e.touches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            player.angle = Math.atan2(dy, dx);
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }
    });

    canvas.addEventListener("touchend", (e) => {
        e.preventDefault();
        isTouching = false;
        laserActive = false;
    });

    // Mouse controls
    canvas.addEventListener("mousedown", (e) => {
        isTouching = true;
        touchStartX = e.clientX;
        touchStartY = e.clientY;
        laserActive = true;
    });

    canvas.addEventListener("mousemove", (e) => {
        if (isTouching) {
            const dx = e.clientX - touchStartX;
            const dy = e.clientY - touchStartY;
            player.angle = Math.atan2(dy, dx);
            touchStartX = e.clientX;
            touchStartY = e.clientY;
        }
    });

    canvas.addEventListener("mouseup", () => {
        isTouching = false;
        laserActive = false;
    });

    function checkLaserCollisions() {
        if (!laserActive || isFrozen) return;

        const laserEndX = player.x + Math.cos(player.angle) * canvas.width * 2;
        const laserEndY = player.y + Math.sin(player.angle) * canvas.width * 2;

        // Check collisions with drones
        for (let i = drones.length - 1; i >= 0; i--) {
            const drone = drones[i];
            if (lineCircleIntersection(player.x, player.y, laserEndX, laserEndY, drone.x, drone.y, 25)) {
                explosions.push({ x: drone.x, y: drone.y, timer: 30, isSnowExplosion: false });
                assets.explosionSound.play();
                drones.splice(i, 1);
                score += 10;
            }
        }

        // Check collisions with black drones, bombs, and frozen drones
        [blackDrones, bombs, snowDrones].forEach((arr, ai) => {
            for (let i = arr.length - 1; i >= 0; i--) {
                const obj = arr[i];
                if (lineCircleIntersection(player.x, player.y, laserEndX, laserEndY, obj.x, obj.y, 25)) {
                    if (ai === 2 && obj.frozen) { // Frozen drone
                        createSnowExplosion(obj.x, obj.y);
                        assets.snowExplosionSound.play();
                    } else { // Black drone or bomb
                        gameOver = true;
                        assets.gameOverSound.play();
                        return;
                    }
                    arr.splice(i, 1);
                }
            }
        });
    }

    function createSnowExplosion(x, y) {
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            snowflakes.push({
                x: x,
                y: y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                size: Math.random() * 10 + 5,
                alpha: 1
            });
        }
    }

    function spawnObjects() {
        if (isFrozen) return;
        drones.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 1 * speedMultiplier });
        if (score >= 50) speedMultiplier = 1.5;
        if (Math.random() < 0.3) blackDrones.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 2 * speedMultiplier });
        if (Math.random() < 0.2) bombs.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 2 * speedMultiplier });
        if (score >= 600 && Math.random() < 0.3) snowDrones.push({
            x: Math.random() * canvas.width, y: 0, speed: Math.random() * 3 + 3 * speedMultiplier, hp: 3, frozen: false
        });

        // Spawn snowflakes
        if (Math.random() < 0.5) {
            snowflakes.push({
                x: Math.random() * canvas.width,
                y: 0,
                dx: (Math.random() - 0.5) * 2,
                dy: Math.random() * 2 + 1,
                size: Math.random() * 10 + 5,
                alpha: 1
            });
        }
    }

    function updateFreeze() {
        if (isFrozen && --freezeTimer <= 0) {
            isFrozen = false;
            freezeEffectAlpha = 0;
        }
    }

    function drawGameObjects() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#001F3F';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw snowflakes
        snowflakes.forEach((snowflake, index) => {
            context.globalAlpha = snowflake.alpha;
            context.drawImage(
                assets.snowflake,
                snowflake.x - snowflake.size / 2,
                snowflake.y - snowflake.size / 2,
                snowflake.size,
                snowflake.size
            );
            context.globalAlpha = 1;
            snowflake.x += snowflake.dx;
            snowflake.y += snowflake.dy;
            snowflake.alpha -= 0.01;
            if (snowflake.alpha <= 0 || snowflake.y > canvas.height) {
                snowflakes.splice(index, 1);
            }
        });

        // Draw explosions
        explosions.forEach((explosion, index) => {
            if (explosion.isSnowExplosion) {
                context.fillStyle = 'rgba(255, 255, 255, 0.8)';
                context.beginPath();
                context.arc(explosion.x, explosion.y, 40, 0, Math.PI * 2);
                context.fill();
            } else {
                context.drawImage(assets.explosion, explosion.x - 40, explosion.y - 40, 80, 80);
            }
            if (--explosion.timer <= 0) explosions.splice(index, 1);
        });

        // Draw drones, black drones, bombs, and frozen drones
        drones.forEach(drone => context.drawImage(assets.drone, drone.x - 25, drone.y - 25, 50, 50));
        blackDrones.forEach(drone => context.drawImage(assets.blackDrone, drone.x - 25, drone.y - 25, 50, 50));
        bombs.forEach(bomb => context.drawImage(assets.bomb, bomb.x - 25, bomb.y - 25, 50, 50));
        snowDrones.forEach(drone => {
            if (drone.frozen) {
                context.fillStyle = 'rgba(255, 255, 255, 0.8)';
                context.beginPath();
                context.arc(drone.x, drone.y, 40, 0, Math.PI * 2);
                context.fill();
            } else {
                context.drawImage(assets.snowDrone, drone.x - 25, drone.y - 25, 50, 50);
            }
        });

        // Draw player
        context.save();
        context.translate(player.x, player.y);
        context.rotate(player.angle);
        context.drawImage(assets.player, -player.size / 2, -player.size / 2, player.size, player.size);
        context.restore();

        // Draw freeze effect
        if (isFrozen) {
            freezeEffectAlpha = Math.min(freezeEffectAlpha + 0.02, 0.7);
            context.globalAlpha = freezeEffectAlpha;
            context.drawImage(assets.iceEffect, 0, 0, canvas.width, canvas.height);
            context.globalAlpha = 1;
        }

        // Draw score
        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.fillText(`Score: ${score}`, 10, 30);
    }

    function gameLoop() {
        if (gameOver) {
            context.fillStyle = 'white';
            context.font = '40px Arial';
            context.fillText('Game Over!', canvas.width / 2 - 80, canvas.height / 2);
            return;
        }

        // Freeze activated when the score reaches multiples of 300
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

    function startGame() {
        assets.backgroundMusic.loop = true;
        assets.backgroundMusic.play();
        alert("Warning: The game will freeze at multiples of 300!");
        setInterval(spawnObjects, 1000);
        gameLoop();
    }

    function lineCircleIntersection(x1, y1, x2, y2, cx, cy, r) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const a = dx * dx + dy * dy;
        const b = 2 * (dx * (x1 - cx) + dy * (y1 - cy));
        const c = (x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy) - r * r;
        const discriminant = b * b - 4 * a * c;
        return discriminant >= 0;
    }
};
