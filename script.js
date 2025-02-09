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
        backgroundMusic: new Audio('lonely-winter-breeze-36867.mp3'),
        gameOverSound: new Audio('game-over.mp3.mp3')
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
    let laserMode = 'highBeam'; // 'highBeam' or 'dropByDrop'
    let laserDrops = [];

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

    function pointInRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height;
    }

    function lineIntersectsRect(lineStart, lineEnd, rect) {
        const { x: x1, y: y1 } = lineStart;
        const { x: x2, y: y2 } = lineEnd;
        const { x: rx, y: ry, width: rw, height: rh } = rect;

        if (pointInRect(x1, y1, rect) || pointInRect(x2, y2, rect)) {
            return true;
        }

        const edges = [
            { x1: rx, y1: ry, x2: rx + rw, y2: ry },
            { x1: rx + rw, y1: ry, x2: rx + rw, y2: ry + rh },
            { x1: rx, y1: ry + rh, x2: rx + rw, y2: ry + rh },
            { x1: rx, y1: ry, x2: rx, y2: ry + rh }
        ];

        for (let edge of edges) {
            if (linesIntersect(x1, y1, x2, y2, edge.x1, edge.y1, edge.x2, edge.y2)) {
                return true;
            }
        }

        return false;
    }

    function linesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (denominator === 0) return false;

        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }

    function gameLoop() {
        if (gameOver) {
            context.fillStyle = 'white';
            context.font = '40px Arial';
            context.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2);
            context.fillText('Final Score: ' + score, canvas.width / 2 - 120, canvas.height / 2 + 50);
            assets.gameOverSound.play();
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

        if (laserMode === 'highBeam' && lasers.length > 0) {
            let beam = lasers[0];
            const tipX = player.x + Math.cos(player.angle) * (player.size / 2);
            const tipY = player.y + Math.sin(player.angle) * (player.size / 2);

            beam.x = tipX;
            beam.y = tipY;

            context.strokeStyle = 'red';
            context.lineWidth = 4;
            context.beginPath();
            context.moveTo(tipX, tipY);
            context.lineTo(tipX + Math.cos(player.angle) * canvas.height, tipY + Math.sin(player.angle) * canvas.height);
            context.stroke();

            drones.forEach((drone, i) => {
                const droneRect = { x: drone.x, y: drone.y, width: 80, height: 80 };
                const lineStart = { x: tipX, y: tipY };
                const lineEnd = { x: tipX + Math.cos(player.angle) * canvas.height, y: tipY + Math.sin(player.angle) * canvas.height };

                if (lineIntersectsRect(lineStart, lineEnd, droneRect)) {
                    explosions.push({ x: drone.x, y: drone.y, timer: 30 });
                    drones.splice(i, 1);
                    score += 10;
                    assets.explosionSound.play();
                }
            });

            blackDrones.forEach((drone, i) => {
                const droneRect = { x: drone.x, y: drone.y, width: 80, height: 80 };
                const lineStart = { x: tipX, y: tipY };
                const lineEnd = { x: tipX + Math.cos(player.angle) * canvas.height, y: tipY + Math.sin(player.angle) * canvas.height };

                if (lineIntersectsRect(lineStart, lineEnd, droneRect)) {
                    explosions.push({ x: drone.x, y: drone.y, timer: 30 });
                    blackDrones.splice(i, 1);
                    gameOver = true;
                    assets.explosionSound.play();
                }
            });

            bombs.forEach((bomb, i) => {
                const bombRect = { x: bomb.x, y: bomb.y, width: 60, height: 60 };
                const lineStart = { x: tipX, y: tipY };
                const lineEnd = { x: tipX + Math.cos(player.angle) * canvas.height, y: tipY + Math.sin(player.angle) * canvas.height };

                if (lineIntersectsRect(lineStart, lineEnd, bombRect)) {
                    explosions.push({ x: bomb.x, y: bomb.y, timer: 30 });
                    bombs.splice(i, 1);
                    gameOver = true;
                    assets.explosionSound.play();
                }
            });
        } else if (laserMode === 'dropByDrop' && laserDrops.length > 0) {
            laserDrops.forEach((drop, i) => {
                drop.x += Math.cos(drop.angle) * drop.speed;
                drop.y += Math.sin(drop.angle) * drop.speed;

                context.fillStyle = 'red';
                context.beginPath();
                context.arc(drop.x, drop.y, 5, 0, Math.PI * 2);
                context.fill();

                drones.forEach((drone, j) => {
                    const droneRect = { x: drone.x, y: drone.y, width: 80, height: 80 };
                    if (pointInRect(drop.x, drop.y, droneRect)) {
                        explosions.push({ x: drone.x, y: drone.y, timer: 30 });
                        drones.splice(j, 1);
                        score += 10;
                        assets.explosionSound.play();
                        laserDrops.splice(i, 1);
                    }
                });

                blackDrones.forEach((drone, j) => {
                    const droneRect = { x: drone.x, y: drone.y, width: 80, height: 80 };
                    if (pointInRect(drop.x, drop.y, droneRect)) {
                        explosions.push({ x: drone.x, y: drone.y, timer: 30 });
                        blackDrones.splice(j, 1);
                        gameOver = true;
                        assets.explosionSound.play();
                        laserDrops.splice(i, 1);
                    }
                });

                bombs.forEach((bomb, j) => {
                    const bombRect = { x: bomb.x, y: bomb.y, width: 60, height: 60 };
                    if (pointInRect(drop.x, drop.y, bombRect)) {
                        explosions.push({ x: bomb.x, y: bomb.y, timer: 30 });
                        bombs.splice(j, 1);
                        gameOver = true;
                        assets.explosionSound.play();
                        laserDrops.splice(i, 1);
                    }
                });

                if (drop.x < 0 || drop.x > canvas.width || drop.y < 0 || drop.y > canvas.height) {
                    laserDrops.splice(i, 1);
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

    document.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    });

    document.addEventListener('mousedown', () => {
        if (laserMode === 'highBeam') {
            const tipX = player.x + Math.cos(player.angle) * (player.size / 2);
            const tipY = player.y + Math.sin(player.angle) * (player.size / 2);
            lasers = [{ x: tipX, y: tipY }];
            assets.laserSound.play();
        } else if (laserMode === 'dropByDrop') {
            const tipX = player.x + Math.cos(player.angle) * (player.size / 2);
            const tipY = player.y + Math.sin(player.angle) * (player.size / 2);
            laserDrops.push({ x: tipX, y: tipY, angle: player.angle, speed: 10 });
            assets.laserSound.play();
        }
    });

    document.addEventListener('mouseup', () => {
        if (laserMode === 'highBeam') {
            lasers = [];
        }
    });

    document.addEventListener('touchmove', (event) => {
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = event.touches[0];
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        player.angle = Math.atan2(touchY - player.y, touchX - player.x);
    });

    document.addEventListener('touchstart', (event) => {
        event.preventDefault();
        if (laserMode === 'highBeam') {
            const tipX = player.x + Math.cos(player.angle) * (player.size / 2);
            const tipY = player.y + Math.sin(player.angle) * (player.size / 2);
            lasers = [{ x: tipX, y: tipY }];
            assets.laserSound.play();
        } else if (laserMode === 'dropByDrop') {
            const tipX = player.x + Math.cos(player.angle) * (player.size / 2);
            const tipY = player.y + Math.sin(player.angle) * (player.size / 2);
            laserDrops.push({ x: tipX, y: tipY, angle: player.angle, speed: 10 });
            assets.laserSound.play();
        }
    });

    document.addEventListener('touchend', () => {
        if (laserMode === 'highBeam') {
            lasers = [];
        }
    });

    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowUp':
                player.angle = -Math.PI / 2;
                break;
            case 'ArrowDown':
                player.angle = Math.PI / 2;
                break;
            case 'ArrowLeft':
                player.angle = Math.PI;
                break;
            case 'ArrowRight':
                player.angle = 0;
                break;
            case ' ':
                if (laserMode === 'highBeam') {
                    const tipX = player.x + Math.cos(player.angle) * (player.size / 2);
                    const tipY = player.y + Math.sin(player.angle) * (player.size / 2);
                    lasers = [{ x: tipX, y: tipY }];
                    assets.laserSound.play();
                } else if (laserMode === 'dropByDrop') {
                    const tipX = player.x + Math.cos(player.angle) * (player.size / 2);
                    const tipY = player.y + Math.sin(player.angle) * (player.size / 2);
                    laserDrops.push({ x: tipX, y: tipY, angle: player.angle, speed: 10 });
                    assets.laserSound.play();
                }
                break;
            case 'm':
                laserMode = laserMode === 'highBeam' ? 'dropByDrop' : 'highBeam';
                break;
        }
    });

    document.addEventListener('keyup', (event) => {
        if (event.key === ' ' && laserMode === 'highBeam') {
            lasers = [];
        }
    });



    let isPlaying = false;
let isPaused = false;
let isAudioEnabled = true;




    document.getElementById('playButton').addEventListener('click', () => {
    if (!isPlaying) {
        isPlaying = true;
        isPaused = false;
        gameLoop();
        assets.backgroundMusic.play();
    }
});

document.getElementById('pauseButton').addEventListener('click', () => {
    isPaused = !isPaused;
    if (isPaused) {
        assets.backgroundMusic.pause();
    } else {
        assets.backgroundMusic.play();
    }
});

document.getElementById('restartButton').addEventListener('click', () => {
    location.reload(); // Reload the page to restart the game
});

document.getElementById('soundButton').addEventListener('click', () => {
    isAudioEnabled = !isAudioEnabled;
    document.getElementById('soundButton').textContent = isAudioEnabled ? 'Sound: On' : 'Sound: Off';
    assets.backgroundMusic.muted = !isAudioEnabled;
    assets.laserSound.muted = !isAudioEnabled;
    assets.explosionSound.muted = !isAudioEnabled;
    assets.gameOverSound.muted = !isAudioEnabled;
});

    function preloadAudio(audio) {
    audio.preload = 'auto';
    audio.load();
}

preloadAudio(assets.laserSound);
preloadAudio(assets.explosionSound);
preloadAudio(assets.backgroundMusic);
preloadAudio(assets.gameOverSound);

window.onload = function () {
    alert("Press 'M' on laptops or double-tap the gun on phones to switch laser modes.");

    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Add button event listeners
    document.getElementById('playButton').addEventListener('click', () => {
        if (!isPlaying) {
            isPlaying = true;
            isPaused = false;
            gameLoop();
            assets.backgroundMusic.play();
        }
    });

    document.getElementById('pauseButton').addEventListener('click', () => {
        isPaused = !isPaused;
        if (isPaused) {
            assets.backgroundMusic.pause();
        } else {
            assets.backgroundMusic.play();
        }
    });

    document.getElementById('restartButton').addEventListener('click', () => {
        location.reload();
    });

    

    setInterval(createDrone, 2000);
    setInterval(createSnowflake, 500);
    setInterval(() => {
        if (score > 50) createBlackDrone();
        if (score > 100) createBomb();
    }, 3000);

    gameLoop();
};




