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
        laserSound: new Audio('laser-shot-.mp3'),
        explosionSound: new Audio('small-explosion-129477.mp3'),
        snowExplosionSound: new Audio('snow-explosion.mp3'),
        backgroundMusic: new Audio('lonely-winter-breeze-36867.mp3'),
        gameOverSound: new Audio('gameover.mp3')
    };

    // Preload all audio files properly
    Object.values(assets).forEach(asset => {
        if (asset instanceof Audio) {
            asset.preload = 'auto';
            asset.load();
        }
    });

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
    let isAudioEnabled = false;
    let gameOver = false;
    let gameOverSoundPlayed = false;
    let speedMultiplier = 1;
    let laserActive = false;
    let isFrozen = false;
    let freezeTimer = 0;
    let freezeEffectAlpha = 0;
    let freezeMessage = "";

    Object.keys(imagePaths).forEach((key) => {
        assets[key].src = imagePaths[key];
        assets[key].onload = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                startGame();
            }
        };
    });

    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', movePlayer);
    document.addEventListener('mousedown', activateLaser);
    document.addEventListener('mouseup', deactivateLaser);
    document.addEventListener('touchstart', (e) => {
        e.preventDefault();
        activateLaser();
    }, { passive: false });
    document.addEventListener('touchend', deactivateLaser, { passive: false });
    canvas.addEventListener('mousemove', aimGun);
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        movePlayerTouch(e);
    }, { passive: false });

    function enableAudio() {
        if (!isAudioEnabled) {
            assets.backgroundMusic.loop = true;
            assets.backgroundMusic.play();
            isAudioEnabled = true;
        }
    }

    function movePlayer(e) {
        if (gameOver || isFrozen) return;
        if (e.code === 'ArrowLeft') player.x -= 10;
        if (e.code === 'ArrowRight') player.x += 10;
        if (e.code === 'ArrowUp') player.y -= 10;
        if (e.code === 'ArrowDown') player.y += 10;
    }

    function movePlayerTouch(e) {
        if (gameOver || isFrozen) return;
        const rect = canvas.getBoundingClientRect();
        player.x = (e.touches[0].clientX - rect.left) * dpr;
        player.y = (e.touches[0].clientY - rect.top) * dpr;
    }

    function aimGun(e) {
        if (gameOver || isFrozen) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * dpr;
        const mouseY = (e.clientY - rect.top) * dpr;
        player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    }

    function activateLaser() {
        if (!laserActive && !isFrozen) {
            laserActive = true;
            assets.laserSound.currentTime = 0;
            assets.laserSound.loop = true;
            assets.laserSound.play().catch(error => console.error("Laser sound failed to play:", error));
        }
    }

    function deactivateLaser() {
        if (laserActive) {
            laserActive = false;
            assets.laserSound.pause();
            assets.laserSound.currentTime = 0;
        }
    }

    function checkLaserCollisions() {
        if (!laserActive || isFrozen) return;

        const laserEndX = player.x + Math.cos(player.angle) * canvas.width * 2;
        const laserEndY = player.y + Math.sin(player.angle) * canvas.width * 2;

        [drones, blackDrones, snowDrones, bombs].forEach((arr, ai) => {
            for (let i = arr.length - 1; i >= 0; i--) {
                const obj = arr[i];
                if (Math.hypot(obj.x - laserEndX, obj.y - laserEndY) < 30) {
                    explosions.push({ x: obj.x, y: obj.y, timer: 30, isSnowExplosion: ai === 2 });
                    assets.explosionSound.play();
                    arr.splice(i, 1);
                    if (ai === 2) triggerFreeze();
                    if (ai === 0) score += 10;
                    if (ai === 1) gameOver = true;
                }
            }
        });
    }

    function triggerFreeze() {
        isFrozen = true;
        freezeTimer = 120;
        freezeMessage = "Game Frozen! Stay Alert!";
        setTimeout(() => { freezeMessage = ""; }, 2000);
    }

    function drawGameObjects() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#001F3F';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.save();
        context.translate(player.x, player.y);
        context.rotate(player.angle);
        context.drawImage(assets.player, -player.size / 2, -player.size / 2, player.size, player.size);
        context.restore();

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

        if (freezeMessage) {
            context.fillStyle = 'yellow';
            context.font = '30px Arial';
            context.textAlign = 'center';
            context.fillText(freezeMessage, canvas.width / 2, 50);
        }
    }

    function gameLoop() {
        if (gameOver) {
            if (!gameOverSoundPlayed) {
                assets.gameOverSound.play();
                gameOverSoundPlayed = true;
            }
            return;
        }
        drawGameObjects();
        checkLaserCollisions();
        requestAnimationFrame(gameLoop);
    }

    function startGame() {
        setInterval(() => {
            if (!isFrozen) drones.push({ x: Math.random() * canvas.width, y: 0, speed: 2 * speedMultiplier });
        }, 1000);
        gameLoop();
    }
};
