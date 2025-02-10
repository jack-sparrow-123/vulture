window.onload = function () {
    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');

    // Load assets
    const assets = {
        player: new Image(),
        drone: new Image(),
        explosion: new Image(),
        snowflake: new Image(),
        laserSound: new Audio('laser.mp3'),
        explosionSound: new Audio('explosion.mp3'),
        droneSound: new Audio('drone.mp3'),
        backgroundMusic: new Audio('background.mp3')
    };
    assets.player.src = 'gun2.png';
    assets.drone.src = 'drone2.png';
    assets.explosion.src = 'explosion.png';
    assets.snowflake.src = 'snowflake.png';
    assets.backgroundMusic.loop = true;
    document.addEventListener('click', () => assets.backgroundMusic.play(), { once: true });

    // Game variables
    let player = { x: canvas.width / 2, y: canvas.height - 100, size: 80, angle: 0 };
    let drones = [], lasers = [], explosions = [], snowflakes = [], score = 0;

    function createDrone() {
        drones.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 1 });
        assets.droneSound.play();
    }

    function createSnowflakes() {
        for (let i = 0; i < 10; i++) {
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
        requestAnimationFrame(gameLoop);
    }

    document.addEventListener('mousemove', (event) => {
        player.angle = Math.atan2(event.clientY - player.y, event.clientX - player.x);
    });
    document.addEventListener('click', () => {
        lasers.push({ x: player.x + Math.cos(player.angle) * 40, y: player.y + Math.sin(player.angle) * 40, angle: player.angle });
        assets.laserSound.play();
    });

    setInterval(createDrone, 2000);
    gameLoop();
};
