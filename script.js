window.onload = function () {
    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');

    // Load assets with sound preloading
    const assets = {
        player: new Image(),
        drone: new Image(),
        blackDrone: new Image(),
        bomb: new Image(),
        explosion: new Image(),
        snowflake: new Image(),
        laserSound: new Audio('attack-laser-128280.mp3'),
        explosionSound: new Audio('small-explosion-129477.mp3'),
        gameOverSound: new Audio('game-over.mp3'),
        backgroundMusic: new Audio('background-music.mp3')
    };

    // Set up paths for images and MP3 files
    assets.player.src = 'gun2.png';
    assets.drone.src = 'drone2.png';
    assets.blackDrone.src = 'blackdrone.png';
    assets.bomb.src = 'bomb.png';
    assets.explosion.src = 'explosion.png';
    assets.snowflake.src = 'snowflake.png';

    // Set the volume for sound effects
    assets.laserSound.volume = 0.5;
    assets.explosionSound.volume = 0.5;
    assets.gameOverSound.volume = 0.7;
    assets.backgroundMusic.volume = 0.2;

    // Preload sounds to ensure they are ready when needed
    assets.laserSound.load();
    assets.explosionSound.load();
    assets.gameOverSound.load();
    assets.backgroundMusic.load();

    // Play background music after user interaction
    document.addEventListener('click', () => {
        assets.backgroundMusic.loop = true;
        assets.backgroundMusic.play();
    }, { once: true });

    let player = { x: canvas.width / 2, y: canvas.height - 100, size: 80, angle: 0 };
    let drones = [], lasers = [], explosions = [], snowflakes = [], bombs = [], score = 0;
    let gameOver = false;
    let gunType = 'beam';  // Default gun type is 'beam'

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
                const laserStartX = player.x + Math.cos(player.angle) * player.size / 2;
                const laserStartY = player.y + Math.sin(player.angle) * player.size / 2;
                lasers.push({ x: laserStartX, y: laserStartY, angle: player.angle, speed: 7 });
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
        if (e.code === 'KeyM') {
            // Switch between 'beam' and 'drop' (bomb)
            gunType = gunType === 'beam' ? 'drop' : 'beam';
            console.log('Gun type switched to:', gunType); // Debugging
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!gameOver) {
            const rect = canvas.getBoundingClientRect();
            player.angle = Math.atan2(e.clientY - rect.top - player.y, e.clientX - rect.left - player.x);
        }
    });

    canvas.addEventListener('mousedown', () => shoot());
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); shoot(); });

    // Double tap to switch gun type on mobile
    let lastTap = 0;
    canvas.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            gunType = gunType === 'beam' ? 'drop' : 'beam';
            console.log('Gun type switched to:', gunType); // Debugging
        }
        lastTap = currentTime;
    });

    function checkCollisions() {
        // Check collision between lasers and drones
        lasers.forEach((laser, i) => {
            drones.forEach((drone, j) => {
                if (Math.hypot(laser.x - (drone.x + 40), laser.y - (drone.y + 40)) < 40) {
                    explosions.push({ x: drone.x, y: drone.y, timer: 30 });
                    drones.splice(j, 1);  // Remove drone after collision
                    lasers.splice(i, 1);  // Remove laser after collision
                    score += drone.black ? -20 : 10;
                    assets.explosionSound.currentTime = 0;
                    assets.explosionSound.play();
                    if (drone.black) endGame();  // End game if black drone is hit
                }
            });
        });

        // Check collision between bombs and drones
        bombs.forEach((bomb, i) => {
            drones.forEach((drone, j) => {
                if (Math.hypot(bomb.x - (drone.x + 40), bomb.y - (drone.y + 40)) < 40) {
                    explosions.push({ x: drone.x, y: drone.y, timer: 30 });
                    drones.splice(j, 1);  // Remove drone after collision
                    bombs.splice(i, 1);  // Remove bomb after collision
                    score += drone.black ? -20 : 10;
                    assets.explosionSound.currentTime = 0;
                    assets.explosionSound.play();
                    if (drone.black) endGame();  // End game if black drone is hit
                }
            });
        });

        // Check collision between bombs and player
        bombs.forEach((bomb, i) => {
            if (Math.hypot(bomb.x - player.x, bomb.y - player.y) < 40) {
                explosions.push({ x: player.x, y: player.y, timer: 30 });
                bombs.splice(i, 1);  // Remove bomb on collision
                endGame();
            }
        });

        // Check collision between player and black drone
        drones.forEach((drone, i) => {
            if (drone.black && Math.hypot(player.x - drone.x, player.y - drone.y) < 40) {
                explosions.push({ x: player.x, y: player.y, timer: 30 });
                drones.splice(i, 1);  // Remove black drone after collision
                endGame();
            }
        });
    }

    function endGame() {
        gameOver = true;
        assets.gameOverSound.currentTime = 0;
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

        drones.forEach(drone => {
            drone.y += drone.speed; // Update drone's position
            if (drone.y > canvas.height) drones.splice(drones.indexOf(drone), 1); // Remove drone if it falls off screen
            context.drawImage(drone.black ? assets.blackDrone : assets.drone, drone.x, drone.y, 80, 80);
        });

        bombs.forEach(bomb => {
            bomb.y += bomb.speed; // Update bomb's position
            if (bomb.y > canvas.height) bombs.splice(bombs.indexOf(bomb), 1); // Remove bomb if it falls off screen
            context.drawImage(assets.bomb, bomb.x, bomb.y, 50, 50);
        });

        lasers.forEach(laser => {
            laser.x += Math.cos(laser.angle) * laser.speed;
            laser.y += Math.sin(laser.angle) * laser.speed;
            context.fillStyle = 'red';
            context.beginPath();
            context.arc(laser.x, laser.y, 3, 0, Math.PI * 2);
            context.fill();
        });

        explosions.forEach((explosion, i) => {
            if (explosion.timer > 0) {
                context.drawImage(assets.explosion, explosion.x - 40, explosion.y - 40, 80, 80);
                explosion.timer--;
            } else {
                explosions.splice(i, 1);
            }
        });

        checkCollisions();
        requestAnimationFrame(gameLoop);
    }

    setInterval(createDrone, 2000);
    setInterval(createBomb, 5000);
    gameLoop();
};
