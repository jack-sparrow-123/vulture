window.onload = function () {
    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');

    // Load assets
    const assets = {
        player: new Image(),
        drone: new Image(),
        blackDrone: new Image(),
        bomb: new Image(),
        explosion: new Image(),
        snowflake: new Image(),
        laserSound: new Audio('attack-laser-128280.mp3'),
        explosionSound: new Audio('small-explosion-129477.mp3')
    };
    assets.player.src = 'gun2.png';
    assets.drone.src = 'drone2.png';
    assets.blackDrone.src = 'blackdrone.png';
    assets.bomb.src = 'bomb.png';
    assets.explosion.src = 'explosion.png';
    assets.snowflake.src = 'snowflake.png';
    assets.laserSound.volume = 1;
    assets.laserSound.preload = 'auto';
    assets.laserSound.load();
    assets.explosionSound.preload = 'auto';
    assets.explosionSound.load();

    let player = { x: canvas.width / 2, y: canvas.height - 100, size: 80, angle: 0 };
    let drones = [], lasers = [], explosions = [], snowflakes = [], bombs = [], score = 0;
    let gameOver = false;
    let gunType = 'beam';

    alert('Press M (Laptop) or Double Tap (Mobile) to switch between Beam and Drop gun.');

    function createDrone() {
        if (!gameOver) {
            let isBlack = Math.random() > 0.8;
            drones.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 1, black: isBlack });
        }
    }

    function createBomb() {
        if (!gameOver) {
            bombs.push({ x: Math.random() * (canvas.width - 50), y: 0, speed: Math.random() * 2 + 2 });
        }
    }

    function createSnowflakes() {
        for (let i = 0; i < 50; i++) {
            snowflakes.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, speed: Math.random() * 2 + 1 });
        }
    }
    createSnowflakes();

    function shootLaser() {
        if (!gameOver) {
            let laser = {
                x: player.x,
                y: player.y,
                angle: player.angle,
                speed: 7
            };
            lasers.push(laser);
            if (assets.laserSound.paused) {
                assets.laserSound.currentTime = 0;
                assets.laserSound.play();
            }
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') shootLaser();
        if (e.code === 'ArrowLeft') player.angle -= Math.PI / 18; // Rotate left
        if (e.code === 'ArrowRight') player.angle += Math.PI / 18; // Rotate right
        if (e.code === 'KeyM') gunType = gunType === 'beam' ? 'drop' : 'beam';
    });

    canvas.addEventListener('mousedown', shootLaser);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        shootLaser();
    });

    function gameLoop() {
        if (gameOver) {
            // Draw game over screen
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = 'white';
            context.font = '40px Arial';
            context.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
            context.font = '20px Arial';
            context.fillText('Score: ' + score, canvas.width / 2 - 50, canvas.height / 2 + 40);
            return;
        }

        // Clear the canvas
        context.fillStyle = '#001F3F';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw snowflakes
        snowflakes.forEach(flake => {
            flake.y = (flake.y + flake.speed) % canvas.height;
            context.drawImage(assets.snowflake, flake.x, flake.y, 10, 10);
        });

        // Draw player with rotation
        context.save();
        context.translate(player.x, player.y);
        context.rotate(player.angle);
        context.drawImage(assets.player, -player.size / 2, -player.size / 2, player.size, player.size);
        context.restore();

        // Draw drones
        drones.forEach((drone, i) => {
            drone.y += drone.speed;
            context.drawImage(drone.black ? assets.blackDrone : assets.drone, drone.x, drone.y, 80, 80);
            if (drone.y > canvas.height) drones.splice(i, 1);
        });

        // Draw bombs
        bombs.forEach((bomb, i) => {
            bomb.y += bomb.speed;
            context.drawImage(assets.bomb, bomb.x, bomb.y, 50, 50);
            if (bomb.y > canvas.height) bombs.splice(i, 1);
        });

        // Draw lasers
        lasers.forEach((laser, i) => {
            laser.x += Math.cos(laser.angle) * laser.speed;
            laser.y += Math.sin(laser.angle) * laser.speed;
            context.fillStyle = 'red';
            context.beginPath();
            context.arc(laser.x, laser.y, 3, 0, Math.PI * 2);
            context.fill();
            if (laser.x < 0 || laser.x > canvas.width || laser.y < 0 || laser.y > canvas.height) lasers.splice(i, 1);
        });

        // Check for collisions between lasers and drones
        drones.forEach((drone, i) => {
            lasers.forEach((laser, j) => {
                if (laser.x < drone.x + 80 && laser.x + 6 > drone.x && laser.y < drone.y + 80 && laser.y + 15 > drone.y) {
                    explosions.push({ x: drone.x, y: drone.y, timer: 30 });
                    drones.splice(i, 1);
                    lasers.splice(j, 1);
                    score += drone.black ? -20 : 10;
                    if (assets.explosionSound.paused) {
                        assets.explosionSound.currentTime = 0;
                        assets.explosionSound.play();
                    }
                }
            });
        });

        // Check for collisions between bombs and player
        bombs.forEach((bomb, i) => {
            if (Math.abs(bomb.x - player.x) < 40 && Math.abs(bomb.y - player.y) < 40) {
                explosions.push({ x: player.x, y: player.y, timer: 30 });
                gameOver = true;
                assets.explosionSound.currentTime = 0;
                assets.explosionSound.play();
            }
        });

        // Draw score
        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.fillText('Score: ' + score, 20, 30);

        // Continue the game loop
        requestAnimationFrame(gameLoop);
    }

    setInterval(createDrone, 2000);
    setInterval(createBomb, 5000);
    gameLoop();
};
