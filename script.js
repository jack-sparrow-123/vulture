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

    // Load images
    Object.keys(imagePaths).forEach((key) => {
        assets[key].src = imagePaths[key];
        assets[key].onload = () => {
            loadedImages++;
            if (loadedImages === totalImages) startGame();
        };
        assets[key].onerror = () => console.error(`Failed to load ${key}`);
    });

    // Touch and mouse controls
    let touchStartX = 0, touchStartY = 0, isTouching = false;

    function handleStart(x, y) {
        isTouching = true;
        touchStartX = x;
        touchStartY = y;
        laserActive = true;
    }

    function handleMove(x, y) {
        if (isTouching) {
            player.angle = Math.atan2(y - touchStartY, x - touchStartX);
            touchStartX = x;
            touchStartY = y;
        }
    }

    function handleEnd() {
        isTouching = false;
        laserActive = false;
    }

    canvas.addEventListener("touchstart", (e) => handleStart(e.touches[0].clientX, e.touches[0].clientY));
    canvas.addEventListener("touchmove", (e) => handleMove(e.touches[0].clientX, e.touches[0].clientY));
    canvas.addEventListener("touchend", handleEnd);
    canvas.addEventListener("mousedown", (e) => handleStart(e.clientX, e.clientY));
    canvas.addEventListener("mousemove", (e) => handleMove(e.clientX, e.clientY));
    canvas.addEventListener("mouseup", handleEnd);

    function checkLaserCollisions() {
        if (!laserActive || isFrozen) return;
        const laserEndX = player.x + Math.cos(player.angle) * canvas.width * 2;
        const laserEndY = player.y + Math.sin(player.angle) * canvas.width * 2;

        [drones, blackDrones, bombs, snowDrones].forEach((arr, index) => {
            for (let i = arr.length - 1; i >= 0; i--) {
                let obj = arr[i];
                if (lineCircleIntersection(player.x, player.y, laserEndX, laserEndY, obj.x, obj.y, 25)) {
                    if (index === 0) { // Normal drones
                        explosions.push({ x: obj.x, y: obj.y, timer: 30, isSnowExplosion: false });
                        assets.explosionSound.play();
                        score += 10;
                    } else if (index === 2) { // Bombs
                        gameOver = true;
                        assets.gameOverSound.play();
                        return;
                    } else if (index === 3) { // Snow drones
                        createSnowExplosion(obj.x, obj.y);
                        assets.snowExplosionSound.play();
                    } else { // Black drones
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
            let angle = Math.random() * Math.PI * 2;
            let speed = Math.random() * 3 + 1;
            snowflakes.push({ x, y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, size: Math.random() * 10 + 5, alpha: 1 });
        }
    }

    function spawnObjects() {
        if (isFrozen) return;
        drones.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 1 * speedMultiplier });
        if (score >= 50) speedMultiplier = 1.5;
        if (Math.random() < 0.3) blackDrones.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 2 * speedMultiplier });
        if (Math.random() < 0.2) bombs.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 2 * speedMultiplier });
        if (score >= 600 && Math.random() < 0.3) snowDrones.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 3 + 3 * speedMultiplier });

        if (Math.random() < 0.5) {
            snowflakes.push({ x: Math.random() * canvas.width, y: 0, dx: (Math.random() - 0.5) * 2, dy: Math.random() * 2 + 1, size: Math.random() * 10 + 5, alpha: 1 });
        }
    }

    function updateFreeze() {
        if (isFrozen && --freezeTimer <= 0) {
            isFrozen = false;
            freezeEffectAlpha = 0;
        }
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

    function startGame() {
        assets.backgroundMusic.loop = true;
        assets.backgroundMusic.play();
        alert("Warning: The game will freeze at multiples of 300!");
        setInterval(spawnObjects, 1000);
        gameLoop();
    }
}; 
