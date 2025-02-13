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
        laserSound: new Audio('laser-shot.mp3'),
        explosionSound: new Audio('small-explosion.mp3'),
        backgroundMusic: new Audio('lonely-winter-breeze.mp3'),
        gameOverSound: new Audio('gameover.mp3'),
        freezingSound: new Audio('freeze-sound.mp3'),
        snowExplosionSound: new Audio('snow-explosion.mp3')
    };

    let player = { x: canvas.width / 2, y: canvas.height / 2, size: 60, angle: 0 };
    let drones = [], blackDrones = [], bombs = [], explosions = [], snowflakes = [], snowBursts = [], score = 0;
    let isAudioEnabled = false, gameOver = false, laserActive = false;
    let frozenDroneActive = false, speedMultiplier = 1, isFreezing = false, freezeTimer = 0;

    Object.keys(assets).forEach(key => {
        if (assets[key] instanceof Image) assets[key].src = key + '.png';
    });

    alert("Warning: Freezing effect at 300, 600, etc. At 600, frozen drones appear!");

    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', movePlayer);
    document.addEventListener('mousedown', activateLaser);
    document.addEventListener('mouseup', deactivateLaser);
    document.addEventListener('touchstart', activateLaser);
    document.addEventListener('touchend', deactivateLaser);
    canvas.addEventListener('mousemove', aimGun);
    canvas.addEventListener('touchmove', movePlayerTouch);

    function enableAudio() {
        if (!isAudioEnabled) {
            assets.backgroundMusic.play();
            isAudioEnabled = true;
        }
    }

    function movePlayer(e) {
        if (gameOver) return;
        if (e.code === 'ArrowLeft') player.x -= 10;
        if (e.code === 'ArrowRight') player.x += 10;
        if (e.code === 'ArrowUp') player.y -= 10;
        if (e.code === 'ArrowDown') player.y += 10;
    }

    function activateLaser() {
        if (!laserActive) {
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
    }

    function checkLaserCollisions() {
        if (!laserActive) return;
        let laserEndX = player.x + Math.cos(player.angle) * canvas.width * 2;
        let laserEndY = player.y + Math.sin(player.angle) * canvas.width * 2;

        [drones, blackDrones, bombs].forEach((arr, ai) => {
            for (let i = arr.length - 1; i >= 0; i--) {
                let obj = arr[i];
                if (lineCircleIntersection(player.x, player.y, laserEndX, laserEndY, obj.x, obj.y, 25)) {
                    explosions.push({ x: obj.x, y: obj.y, timer: 30 });
                    arr.splice(i, 1);
                    if (ai === 0) score += 10;
                    else gameOverSequence();
                    assets.explosionSound.currentTime = 0;
                    assets.explosionSound.play();
                }
            }
        });

        blackDrones.forEach((drone, i) => {
            if (drone.isFrozen && lineCircleIntersection(player.x, player.y, laserEndX, laserEndY, drone.x, drone.y, 25)) {
                snowExplosion(drone.x, drone.y);
                blackDrones.splice(i, 1);
                gameOverSequence();
            }
        });
    }

    function snowExplosion(x, y) {
        assets.snowExplosionSound.currentTime = 0;
        assets.snowExplosionSound.play();
        snowBursts.push({ x, y, radius: 0, maxRadius: 100, alpha: 1 });
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

        drones.forEach(obj => context.drawImage(assets.drone, obj.x, obj.y, 50, 50));
        blackDrones.forEach(obj => context.drawImage(assets[obj.isFrozen ? 'frozenDrone' : 'blackDrone'], obj.x, obj.y, 50, 50));
        bombs.forEach(obj => context.drawImage(assets.bomb, obj.x, obj.y, 50, 50));

        if (laserActive) {
            context.strokeStyle = 'red';
            context.lineWidth = 4;
            context.beginPath();
            context.moveTo(player.x, player.y);
            context.lineTo(player.x + Math.cos(player.angle) * canvas.width * 2, player.y + Math.sin(player.angle) * canvas.width * 2);
            context.stroke();
        }

        snowBursts.forEach((burst, index) => {
            context.fillStyle = `rgba(255, 255, 255, ${burst.alpha})`;
            context.beginPath();
            context.arc(burst.x, burst.y, burst.radius, 0, Math.PI * 2);
            context.fill();
            burst.radius += 2;
            burst.alpha -= 0.02;
            if (burst.alpha <= 0) snowBursts.splice(index, 1);
        });
    }

    function gameOverSequence() {
        gameOver = true;
        assets.gameOverSound.play();
    }

    setInterval(spawnObjects, 1000);
    (function gameLoop() {
        if (!gameOver) {
            drawGameObjects();
            checkLaserCollisions();
            requestAnimationFrame(gameLoop);
        }
    })();
};
