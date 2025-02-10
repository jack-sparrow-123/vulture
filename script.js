window.onload = function () {
    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');

    
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

    let player = { x: canvas.width / 2, y: canvas.height - 100, size: 80, angle: 0 };
    let drones = [], lasers = [], explosions = [], snowflakes = [], bombs = [], score = 0;
    let gameOver = false;
    let gunType = 'beam';
    let zoomLevel = 1;

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
            context.drawImage(drone.black ? assets.blackDrone : assets.drone, drone.x, drone.y, 80, 80);

            if (drone.y > canvas.height) drones.splice(i, 1);
            if (Math.abs(drone.x - player.x) < 40 && Math.abs(drone.y - player.y) < 40) {
                explosions.push({ x: player.x, y: player.y, timer: 30 });
                gameOver = true;
            }
        });

        bombs.forEach((bomb, i) => {
            bomb.y += bomb.speed;
            context.drawImage(assets.bomb, bomb.x, bomb.y, 50, 50);
            if (bomb.y > canvas.height) bombs.splice(i, 1);
            if (Math.abs(bomb.x - player.x) < 40 && Math.abs(bomb.y - player.y) < 40) {
                explosions.push({ x: player.x, y: player.y, timer: 30 });
                gameOver = true;
            }
        });

        lasers.forEach((laser, i) => {
            laser.y -= 7;
            context.fillStyle = 'red';
            context.fillRect(laser.x, laser.y, 6, 15);
            if (laser.y < 0) lasers.splice(i, 1);
        });

        drones.forEach((drone, i) => {
            lasers.forEach((laser, j) => {
                if (laser.x < drone.x + 80 && laser.x + 6 > drone.x && laser.y < drone.y + 80 && laser.y + 15 > drone.y) {
                    explosions.push({ x: drone.x, y: drone.y, timer: 30 });
                    drones.splice(i, 1);
                    lasers.splice(j, 1);
                    score += drone.black ? -20 : 10;
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

    setInterval(createDrone, 2000);
    setInterval(createBomb, 5000);
    gameLoop();
};
