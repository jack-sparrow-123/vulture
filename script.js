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
    let player = { x: canvas.width / 2, y: canvas.height / 2, size: 60, angle: 0 };
    let drones = [], blackDrones = [], bombs = [], lasers = [], explosions = [], snowflakes = [], score = 0;
    let isAudioEnabled = false;
    let gameOver = false;
    let gameOverSoundPlayed = false;
    let speedMultiplier = 1;
    let laserFired = false;

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
    document.addEventListener('click', shootLaser);
    canvas.addEventListener('mousemove', aimGun);
    canvas.addEventListener('touchmove', movePlayerTouch);
    canvas.addEventListener('touchstart', shootLaser);

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

    function movePlayerTouch(e) {
        if (gameOver) return;
        player.x = e.touches[0].clientX;
        player.y = e.touches[0].clientY;
    }

    function aimGun(e) {
        if (gameOver) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    }

    function shootLaser() {
        if (gameOver || laserFired) return;
        lasers.push({ x: player.x, y: player.y, angle: player.angle, length: canvas.width });
        assets.laserSound.play();
        laserFired = true;
        setTimeout(() => laserFired = false, 300);
    }

    function checkCollisions() {
        lasers.forEach((laser, li) => {
            [drones, blackDrones, bombs].forEach((arr, ai) => {
                arr.forEach((obj, oi) => {
                    if (Math.hypot(obj.x - laser.x, obj.y - laser.y) < 30) {
                        explosions.push({ x: obj.x, y: obj.y, timer: 30 });
                        arr.splice(oi, 1);
                        lasers.splice(li, 1);
                        if (ai === 0) score += 10;
                        else gameOver = true;
                        assets.explosionSound.play();
                    }
                });
            });
        });
    }

    function spawnObjects() {
        drones.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 1 * speedMultiplier });
        if (score >= 50) speedMultiplier = 1.5;
        if (Math.random() < 0.3) blackDrones.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 2 * speedMultiplier });
        if (Math.random() < 0.2) bombs.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 2 * speedMultiplier });
        snowflakes.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 1, size: Math.random() * 10 + 5 });
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

        lasers.forEach((laser, index) => {
            laser.x += Math.cos(laser.angle) * 10;
            laser.y += Math.sin(laser.angle) * 10;
            context.strokeStyle = 'red';
            context.lineWidth = 4;
            context.beginPath();
            context.moveTo(laser.x, laser.y);
            context.lineTo(laser.x + Math.cos(laser.angle) * laser.length, laser.y + Math.sin(laser.angle) * laser.length);
            context.stroke();
            if (laser.x < 0 || laser.x > canvas.width || laser.y < 0 || laser.y > canvas.height) {
                lasers.splice(index, 1);
            }
        });

        explosions.forEach((explosion, index) => {
            context.drawImage(assets.explosion, explosion.x - 40, explosion.y - 40, 80, 80);
            if (--explosion.timer <= 0) explosions.splice(index, 1);
        });

        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.fillText(`Score: ${score}`, 20, 30);

        if (gameOver) {
            context.fillStyle = 'red';
            context.font = '50px Arial';
            context.fillText('GAME OVER', canvas.width / 2 - 150, canvas.height / 2);
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
        checkCollisions();
        requestAnimationFrame(gameLoop);
    }

    function startGame() {
        assets.backgroundMusic.loop = true;
        setInterval(spawnObjects, 1000);
        gameLoop();
    }
};
