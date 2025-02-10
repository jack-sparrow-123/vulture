window.onload = function () {
    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function drawRotatedImage(img, x, y, angle, size) {
        context.save();
        context.translate(x, y);
        context.rotate(angle);
        context.drawImage(img, -size / 2, -size / 2, size, size);
        context.restore();
    }

    const assets = {
        player: new Image(),
        drone: new Image(),
        blackDrone: new Image(),
        bomb: new Image(),
        explosion: new Image(),
        laserSound: new Audio('attack-laser-128280.mp3'),
        explosionSound: new Audio('small-explosion-129477.mp3'),
        backgroundMusic: new Audio('lonely-winter-breeze-36867.mp3'),
        gameOverSound: new Audio('game-over-tune.mp3')
    };

    assets.player.src = 'gun2.png';
    assets.drone.src = 'drone2.png';
    assets.blackDrone.src = 'blackdrone.png';
    assets.bomb.src = 'bomb.png';
    assets.explosion.src = 'explosion.png';
    assets.backgroundMusic.loop = true;

    let player = { x: canvas.width / 2, y: canvas.height - 100, size: 80, angle: 0 };
    let drones = [], blackDrones = [], bombs = [], lasers = [], explosions = [], snowflakes = [], score = 0;
    let isAudioEnabled = false, gameOver = false;

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    document.addEventListener('click', () => {
        if (!isAudioEnabled) {
            assets.backgroundMusic.play().catch(err => console.error('Audio Error:', err));
            isAudioEnabled = true;
        }
    });

    function createDrone() {
        if (!gameOver) {
            drones.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 1 + score / 100 });
        }
    }

    function createBlackDrone() {
        if (!gameOver) {
            blackDrones.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 2 + score / 100 });
        }
    }

    function createBomb() {
        if (!gameOver) {
            bombs.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 2 + score / 100 });
        }
    }

    function createSnowflake() {
        snowflakes.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 1 });
    }

    function checkCollision(laser, target) {
        return (
            laser.x > target.x &&
            laser.x < target.x + 80 &&
            laser.y > target.y &&
            laser.y < target.y + 80
        );
    }

    function drawLaser(laser) {
        context.strokeStyle = 'red';
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(laser.x, laser.y);
        context.lineTo(
            laser.x + Math.cos(laser.angle) * canvas.height,
            laser.y + Math.sin(laser.angle) * canvas.height
        );
        context.stroke();
    }

    function gameLoop() {
        if (gameOver) {
            context.fillStyle = 'red';
            context.font = '40px Arial';
            context.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2);
            return;
        }

        context.fillStyle = '#001F3F';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw snowflakes
        context.fillStyle = 'white';
        snowflakes.forEach((snowflake, index) => {
            snowflake.y += snowflake.speed;
            context.beginPath();
            context.arc(snowflake.x, snowflake.y, 2, 0, Math.PI * 2);
            context.fill();
            if (snowflake.y > canvas.height) snowflakes.splice(index, 1);
        });

        drawRotatedImage(assets.player, player.x, player.y, player.angle, player.size);

        // Update and draw drones
        drones.forEach(drone => {
            drone.y += drone.speed;
            context.drawImage(assets.drone, drone.x, drone.y, 80, 80);
        });

        // Update and draw black drones
        blackDrones.forEach(drone => {
            drone.y += drone.speed;
            context.drawImage(assets.blackDrone, drone.x, drone.y, 80, 80);
        });

        // Update and draw bombs
        bombs.forEach(bomb => {
            bomb.y += bomb.speed;
            context.drawImage(assets.bomb, bomb.x, bomb.y, 60, 60);
        });

        // Draw lasers
        lasers.forEach(drawLaser);

        // Check for collisions
        lasers.forEach(laser => {
            // Check collision with drones
            drones = drones.filter((drone, index) => {
                if (checkCollision(laser, drone)) {
                    score += 10;
                    explosions.push({ x: drone.x, y: drone.y, frame: 0 });
                    return false;
                }
                return true;
            });

            // Check collision with black drones
            blackDrones.forEach((drone, index) => {
                if (checkCollision(laser, drone)) {
                    gameOver = true;
                    explosions.push({ x: drone.x, y: drone.y, frame: 0 });
                    blackDrones.splice(index, 1);
                    assets.gameOverSound.play();
                }
            });

            // Check collision with bombs
            bombs.forEach((bomb, index) => {
                if (checkCollision(laser, bomb)) {
                    gameOver = true;
                    explosions.push({ x: bomb.x, y: bomb.y, frame: 0 });
                    bombs.splice(index, 1);
                    assets.explosionSound.play();
                }
            });
        });

        // Draw explosions
        explosions.forEach((explosion, index) => {
            context.drawImage(assets.explosion, explosion.x, explosion.y, 80, 80);
            explosion.frame++;
            if (explosion.frame > 10) {
                explosions.splice(index, 1);
            }
        });

        // Draw score
        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.fillText('Score: ' + score, 20, 30);

        // Spawn new enemies based on score
        if (score >= 50) {
            if (drones.length < 10) createDrone();
            if (blackDrones.length < 5) createBlackDrone();
        }

        requestAnimationFrame(gameLoop);
    }

    document.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    });

    document.addEventListener('mousedown', () => {
        const tipX = player.x + Math.cos(player.angle) * (player.size / 2);
        const tipY = player.y + Math.sin(player.angle) * (player.size / 2);
        lasers.push({ x: tipX, y: tipY, angle: player.angle });
        assets.laserSound.currentTime = 0;
        assets.laserSound.play();
    });

    document.addEventListener('mouseup', () => {
        lasers = [];
    });

    // Keyboard controls
    document.addEventListener('keydown', (event) => {
        const speed = 10;
        if (event.key === 'ArrowLeft') {
            player.x -= speed;
        } else if (event.key === 'ArrowRight') {
            player.x += speed;
        } else if (event.key === ' ') { // Space bar to shoot
            const tipX = player.x + Math.cos(player.angle) * (player.size / 2);
            const tipY = player.y + Math.sin(player.angle) * (player.size / 2);
            lasers.push({ x: tipX, y: tipY, angle: player.angle });
            assets.laserSound.currentTime = 0;
            assets.laserSound.play();
        }
    });

    setInterval(createDrone, 2000);
    setInterval(() => { if (score > 50) createBlackDrone(); }, 3000);
    setInterval(() => { if (score > 100) createBomb(); }, 5000);
    setInterval(createSnowflake, 200);

    gameLoop();
};
