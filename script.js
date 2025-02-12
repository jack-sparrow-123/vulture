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
        snowflake: new Image(),
        iceEffect: new Image(),
        laserSound: new Audio('laser-shot-.mp3'),
        explosionSound: new Audio('small-explosion-129477.mp3'),
        snowExplosionSound: new Audio('snow-explosion.mp3'),
        backgroundMusic: new Audio('lonely-winter-breeze-36867.mp3'),
        gameOverSound: new Audio('gameover.mp3')
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

    function checkLaserCollisions() {
        if (!laserActive || isFrozen) return;

        const laserEndX = player.x + Math.cos(player.angle) * canvas.width * 2;
        const laserEndY = player.y + Math.sin(player.angle) * canvas.width * 2;

        [drones, blackDrones, snowDrones, bombs].forEach((arr, ai) => {
            for (let i = arr.length - 1; i >= 0; i--) {
                const obj = arr[i];
                if (lineCircleIntersection(player.x, player.y, laserEndX, laserEndY, obj.x, obj.y, 25)) {
                    if (ai === 2) {
                        isFrozen = true;
                        freezeTimer = 300;
                        explosions.push({ x: obj.x, y: obj.y, timer: 30, isSnowExplosion: true });
                        assets.snowExplosionSound.play();
                    } else {
                        explosions.push({ x: obj.x, y: obj.y, timer: 30, isSnowExplosion: false });
                        if (ai === 0) score += 10;
                        assets.explosionSound.play();
                    }
                    arr.splice(i, 1);
                }
            }
        });
    }

    function spawnObjects() {
        if (isFrozen) return;
        drones.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 1 * speedMultiplier });
        if (score >= 50) speedMultiplier = 1.5;
        if (Math.random() < 0.3) blackDrones.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 2 * speedMultiplier });
        if (Math.random() < 0.2) bombs.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 2 * speedMultiplier });
        if (score >= 600 && Math.random() < 0.3) snowDrones.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 3 + 3 * speedMultiplier, hp: 3 });
        snowflakes.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 1, size: Math.random() * 10 + 5 });
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

        if (isFrozen) {
            freezeEffectAlpha = Math.min(freezeEffectAlpha + 0.02, 0.7);
            context.drawImage(assets.iceEffect, 0, 0, canvas.width, canvas.height);
        }

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
    }

    function gameLoop() {
        if (gameOver) return;

        if (score >= 300 && score % 300 === 0 && !isFrozen) {
            isFrozen = true;
            freezeTimer = 300;
            alert("Freeze! The game is frozen for a moment.");
        }

        drawGameObjects();
        checkLaserCollisions();
        updateFreeze();
        requestAnimationFrame(gameLoop);
    }

    function startGame() {
        assets.backgroundMusic.loop = true;
        setInterval(spawnObjects, 1000);
        gameLoop();
    }
};
