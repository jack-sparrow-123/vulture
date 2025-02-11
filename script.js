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
        backgroundMusic: new Audio('lonely-winter-breeze-36867.mp3')
    };
    assets.player.src = 'gun2.png.png';
    assets.drone.src = 'drone2.png.png';
    assets.blackDrone.src = 'blackdrone.png.png';
    assets.bomb.src = 'bomb.png.png';
    assets.explosion.src = 'explosion.png.png';
    assets.snowflake.src = 'snowflake.png.png';
    assets.backgroundMusic.loop = true;

    let player = { x: canvas.width / 2, y: canvas.height - 100, size: 80, angle: 0 };
    let drones = [], blackDrones = [], bombs = [], lasers = [], explosions = [], snowflakes = [], score = 0;
    let isAudioEnabled = false;
    let gameOver = false;

    // Event listeners for gun movement and shooting
    canvas.addEventListener('mousemove', (e) => {
        if (!gameOver) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        if (!gameOver) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            player.angle = Math.atan2(touchY - player.y, touchX - player.x);
            e.preventDefault(); // Prevent scrolling
        }
    });

    document.addEventListener('keydown', (e) => {
        if (!gameOver) {
            const speed = 5;
            if (e.key === 'ArrowLeft') {
                player.x -= speed;
            } else if (e.key === 'ArrowRight') {
                player.x += speed;
            } else if (e.key === 'ArrowUp') {
                player.y -= speed;
            } else if (e.key === 'ArrowDown') {
                player.y += speed;
            }
            // Keep player within canvas bounds
            player.x = Math.max(0, Math.min(canvas.width, player.x));
            player.y = Math.max(0, Math.min(canvas.height, player.y));
        }
    });

    canvas.addEventListener('click', () => {
        if (!gameOver) {
            shootLaser();
        }
    });

    canvas.addEventListener('touchstart', () => {
        if (!gameOver) {
            shootLaser();
        }
    });

    function shootLaser() {
        if (lasers.length === 0) { // Only allow one laser at a time
            lasers.push({ x: player.x, y: player.y });
            assets.laserSound.play();
        }
    }

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        player.x = canvas.width / 2;
        player.y = canvas.height - 100;
    });

    document.addEventListener('click', () => {
        if (!isAudioEnabled) {
            assets.backgroundMusic.play().catch(error => console.error('Error playing background music:', error));
            isAudioEnabled = true;
        }
    });

    function createDrone() {
        drones.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 1 + score / 100 });
    }

    function createBlackDrone() {
        blackDrones.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 2 + score / 100 });
    }

    function createBomb() {
        bombs.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 2 + score / 100 });
    }

    function createSnowflake() {
        snowflakes.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 1 });
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

        drawRotatedImage(assets.player, player.x, player.y, player.angle, player.size);

        drones.forEach(drone => {
            drone.y += drone.speed;
            context.drawImage(assets.drone, drone.x, drone.y, 80, 80);
        });

        blackDrones.forEach(drone => {
            drone.y += drone.speed;
            context.drawImage(assets.blackDrone, drone.x, drone.y, 80, 80);
        });

        bombs.forEach(bomb => {
            bomb.y += bomb.speed;
            context.drawImage(assets.bomb, bomb.x, bomb.y, 60, 60);
        });

        snowflakes.forEach(snowflake => {
            snowflake.y += snowflake.speed;
            context.drawImage(assets.snowflake, snowflake.x, snowflake.y, 20, 20);
        });

        if (lasers.length > 0) {
            let beam = lasers[0];
            const tipX = player.x + Math.cos(player.angle) * (player.size / 2);
            const tipY = player.y + Math.sin(player.angle) * (player.size / 2);

            beam.x = tipX;
            beam.y = tipY;

            context.strokeStyle = 'red';
            context.lineWidth = 6;
            context.beginPath();
            context.moveTo(tipX, tipY);
            context.lineTo(tipX + Math.cos(player.angle) * canvas.height, tipY + Math.sin(player.angle) * canvas.height);
            context.stroke();

            drones.forEach((drone, i) => {
                if (tipX > drone.x && tipX < drone.x + 80 && tipY > drone.y && tipY < drone.y + 80) {
                    explosions.push({ x: drone.x, y: drone.y, timer: 30 });
                    drones.splice(i, 1);
                    score += 10;
                    assets.explosionSound.play();
                }
            });

            blackDrones.forEach((drone, i) => {
                if (tipX > drone.x && tipX < drone.x + 80 && tipY > drone.y && tipY < drone.y + 80) {
                    explosions.push({ x: drone.x, y: drone.y, timer: 30 });
                    blackDrones.splice(i, 1);
                    gameOver = true;
                    assets.explosionSound.play();
                }
            });

            bombs.forEach((bomb, i) => {
                if (tipX > bomb.x && tipX < bomb.x + 60 && tipY > bomb.y && tipY < bomb.y + 60) {
                    explosions.push({ x: bomb.x, y: bomb.y, timer: 30 });
                    bombs.splice(i, 1);
                    gameOver = true;
                    assets.explosionSound.play();
                }
            });
        }

        explosions.forEach((exp, i) => {
            context.drawImage(assets.explosion, exp.x, exp.y, 100, 100);
            if (--exp.timer <= 0) explosions.splice(i, 1);
        });

        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.fillText('Score: ' + score, 20, 30);

        requestAnimationFrame(gameLoop);
    }

    gameLoop();
};
