window.onload = function () {
    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');

    // Load assets
    const assets = {
        player: new Image(),
        drone: new Image(),
        explosion: new Image(),
        snowflake: new Image(),
        laserSound: new Audio('attack-laser-128280.mp3'),
        explosionSound: new Audio('small-explosion-129477.mp3'),
        droneSound: new Audio('drone-fx-240233.mp3'),
        backgroundMusic: new Audio('lonely-winter-breeze-36867.mp3'),
        gameOverSound: new Audio('game-over.mp3')
    };
    assets.player.src = 'gun2.png.png';
    assets.drone.src = 'drone2.png';
    assets.explosion.src = 'explosion.png';
    assets.snowflake.src = 'snowflake.png';
    assets.backgroundMusic.loop = true;

    // Preload audio
    Object.values(assets).forEach(asset => {
        if (asset instanceof Audio) {
            asset.preload = 'auto';
            asset.load();
        }
    });

    // Game variables
    let player = { x: canvas.width / 2, y: canvas.height - 100, size: 80, angle: 0 };
    let drones = [], lasers = [], explosions = [], snowflakes = [], score = 0;
    let gameOver = false;
    let gunType = 'beam'; // 'beam' or 'drop'
    let zoomLevel = 1;

    function createDrone() {
        if (!gameOver) {
            drones.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 1 });
            assets.droneSound.play();
        }
    }

    function createSnowflakes() {
        for (let i = 0; i < 50; i++) {
            snowflakes.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, speed: Math.random() * 2 + 1 });
        }
    }
    createSnowflakes();

    function drawRotatedImage(img, x, y, angle, size) {
        context.save();
        context.translate(x, y);
        context.rotate(angle);
        context.drawImage(img, -size / 2, -size / 2, size, size);
        context.restore();
    }

    function gameLoop() {
        if (gameOver) return;

        context.fillStyle = '#001F3F';
        context.fillRect(0, 0, canvas.width, canvas.height);

        snowflakes.forEach(flake => {
            flake.y = (flake.y + flake.speed) % canvas.height;
            context.drawImage(assets.snowflake, flake.x, flake.y, 10, 10);
        });
        drawRotatedImage(assets.player, player.x, player.y, player.angle, player.size);
        drones.forEach((drone, i) => {
            drone.y += drone.speed;
            context.drawImage(assets.drone, drone.x, drone.y, 80, 80);
            if (drone.y > canvas.height) drones.splice(i, 1);
            if (Math.abs(drone.x - player.x) < 40 && Math.abs(drone.y - player.y) < 40) {
                gameOver = true;
                assets.gameOverSound.play();
                assets.backgroundMusic.pause();
            }
        });
        lasers.forEach((laser, i) => {
            laser.x += Math.cos(laser.angle) * 7;
            laser.y += Math.sin(laser.angle) * 7;
            context.fillRect(laser.x, laser.y, 5, 5);
            if (laser.y < 0 || laser.y > canvas.height || laser.x < 0 || laser.x > canvas.width) lasers.splice(i, 1);
        });
        drones.forEach((drone, i) => {
            lasers.forEach((laser, j) => {
                if (laser.x < drone.x + 80 && laser.x + 5 > drone.x && laser.y < drone.y + 80 && laser.y + 5 > drone.y) {
                    explosions.push({ x: drone.x, y: drone.y, timer: 30 });
                    drones.splice(i, 1);
                    lasers.splice(j, 1);
                    score += 10;
                    assets.explosionSound.play();
                }
            });
        });
        explosions.forEach((exp, i) => {
            context.drawImage(assets.explosion, exp.x, exp.y, 100, 100);
            if (--exp.timer <= 0) explosions.splice(i, 1);
        });
        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.fillText('Score: ' + score, 20, 30);

        if (gameOver) {
            context.fillStyle = 'red';
            context.font = '40px Arial';
            context.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
        }

        requestAnimationFrame(gameLoop);
    }

    // Mouse and Touch Controls
    document.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        player.angle = Math.atan2(event.clientY - rect.top - player.y, event.clientX - rect.left - player.x);
    });

    document.addEventListener('click', () => {
        if (!gameOver) {
            if (gunType === 'beam') {
                lasers.push({ x: player.x + Math.cos(player.angle) * 40, y: player.y + Math.sin(player.angle) * 40, angle: player.angle });
                assets.laserSound.play();
            } else if (gunType === 'drop') {
                // Implement drop gun logic here
            }
        }
    });

    // Touch controls for mobile devices
    canvas.addEventListener('touchmove', (event) => {
        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        player.angle = Math.atan2(touch.clientY - rect.top - player.y, touch.clientX - rect.left - player.x);
    });

    canvas.addEventListener('touchend', () => {
        if (!gameOver) {
            if (gunType === 'beam') {
                lasers.push({ x: player.x + Math.cos(player.angle) * 40, y: player.y + Math.sin(player.angle) * 40, angle: player.angle });
                assets.laserSound.play();
            } else if (gunType === 'drop') {
                // Implement drop gun logic here
            }
        }
    });

    // Keyboard controls
    document.addEventListener('keydown', (event) => {
        if (event.key === 'm') {
            gunType = gunType === 'beam' ? 'drop' : 'beam';
        }
    });

    // Zoom functionality
    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        zoomLevel += event.deltaY * -0.01;
        zoomLevel = Math.min(Math.max(0.5, zoomLevel), 2);
        context.setTransform(zoomLevel, 0, 0, zoomLevel, 0, 0);
    });

    setInterval(createDrone, 2000);
    gameLoop();
};
