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
        explosionSound: new Audio('small-explosion-129477.mp3'),
        gameOverSound: new Audio('game-over.mp3')
    };
    assets.player.src = 'gun2.png';
    assets.drone.src = 'drone2.png';
    assets.blackDrone.src = 'blackdrone.png';
    assets.bomb.src = 'bomb.png';
    assets.explosion.src = 'explosion.png';
    assets.snowflake.src = 'snowflake.png';
    assets.laserSound.volume = 0.5;
    assets.explosionSound.volume = 0.5;
    assets.gameOverSound.volume = 0.7;

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

    function shoot() {
        if (!gameOver) {
            if (gunType === 'beam') {
                lasers.push({ x: player.x + Math.cos(player.angle) * 40, y: player.y + Math.sin(player.angle) * 40, angle: player.angle, speed: 7 });
                assets.laserSound.currentTime = 0;
                assets.laserSound.play();
            } else {
                bombs.push({ x: player.x, y: player.y, speed: 5 });
            }
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') shoot();
        if (e.code === 'ArrowLeft') player.angle -= Math.PI / 18;
        if (e.code === 'ArrowRight') player.angle += Math.PI / 18;
        if (e.code === 'KeyM') gunType = gunType === 'beam' ? 'drop' : 'beam';
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!gameOver) {
            const rect = canvas.getBoundingClientRect();
            player.angle = Math.atan2(e.clientY - rect.top - player.y, e.clientX - rect.left - player.x);
        }
    });

    canvas.addEventListener('mousedown', () => shoot());
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); shoot(); });
    
    function checkCollisions() {
        drones.forEach((drone, i) => {
            lasers.forEach((laser, j) => {
                if (Math.hypot(laser.x - (drone.x + 40), laser.y - (drone.y + 40)) < 40) {
                    explosions.push({ x: drone.x, y: drone.y, timer: 30 });
                    drones.splice(i, 1);
                    lasers.splice(j, 1);
                    score += drone.black ? -20 : 10;
                    assets.explosionSound.currentTime = 0;
                    assets.explosionSound.play();
                    if (drone.black) endGame();
                }
            });
        });

        bombs.forEach((bomb, i) => {
            if (Math.hypot(bomb.x - player.x, bomb.y - player.y) < 40) {
                explosions.push({ x: player.x, y: player.y, timer: 30 });
                endGame();
            }
        });
    }

    function endGame() {
        gameOver = true;
        assets.gameOverSound.play();
    }

    function gameLoop() {
        if (gameOver) {
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = 'white';
            context.font = '40px Arial';
            context.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
            context.font = '20px Arial';
            context.fillText('Score: ' + score, canvas.width / 2 - 50, canvas.height / 2 + 40);
            return;
        }

        context.fillStyle = '#001F3F';
        context.fillRect(0, 0, canvas.width, canvas.height);

        snowflakes.forEach(flake => {
            flake.y = (flake.y + flake.speed) % canvas.height;
            context.drawImage(assets.snowflake, flake.x, flake.y, 10, 10);
        });

        context.save();
        context.translate(player.x, player.y);
        context.rotate(player.angle);
        context.drawImage(assets.player, -player.size / 2, -player.size / 2, player.size, player.size);
        context.restore();

        drones.forEach(drone => context.drawImage(drone.black ? assets.blackDrone : assets.drone, drone.x, drone.y, 80, 80));
        bombs.forEach(bomb => context.drawImage(assets.bomb, bomb.x, bomb.y, 50, 50));

        lasers.forEach(laser => {
            laser.x += Math.cos(laser.angle) * laser.speed;
            laser.y += Math.sin(laser.angle) * laser.speed;
            context.fillStyle = 'red';
            context.beginPath();
            context.arc(laser.x, laser.y, 3, 0, Math.PI * 2);
            context.fill();
        });

        checkCollisions();
        requestAnimationFrame(gameLoop);
    }

    setInterval(createDrone, 2000);
    setInterval(createBomb, 5000);
    gameLoop();
};
