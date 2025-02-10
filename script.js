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
        gameOverSound: new Audio('game-over-tune.mp3') // Add a game over tune
    };
    assets.player.src = 'gun2.png';
    assets.drone.src = 'drone2.png';
    assets.blackDrone.src = 'blackdrone.png';
    assets.bomb.src = 'bomb.png';
    assets.explosion.src = 'explosion.png';
    assets.snowflake.src = 'snowflake.png';
    assets.backgroundMusic.loop = true;

    // Preload the laser sound to avoid lag
    assets.laserSound.load();
    assets.gameOverSound.load();

    let player = { x: canvas.width / 2, y: canvas.height - 100, size: 80, angle: 0 };
    let drones = [], blackDrones = [], bombs = [], lasers = [], explosions = [], snowflakes = [], score = 0;
    let isAudioEnabled = false;
    let gameOver = false;

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

    // Function to check if a point is inside a rectangle
    function pointInRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height;
    }

    // Function to check if a line intersects with a rectangle
    function lineIntersectsRect(lineStart, lineEnd, rect) {
        const { x: x1, y: y1 } = lineStart;
        const { x: x2, y: y2 } = lineEnd;
        const { x: rx, y: ry, width: rw, height: rh } = rect;

        // Check if the line starts or ends inside the rectangle
        if (pointInRect(x1, y1, rect) || pointInRect(x2, y2, rect)) {
            return true;
        }

        // Check if any of the rectangle's edges intersect with the line
        const edges = [
            { x1: rx, y1: ry, x2: rx + rw, y2: ry }, // Top edge
            { x1: rx + rw, y1: ry, x2: rx + rw, y2: ry + rh }, // Right edge
            { x1: rx, y1: ry + rh, x2: rx + rw, y2: ry + rh }, // Bottom edge
            { x1: rx, y1: ry, x2: rx, y2: ry + rh } // Left edge
        ];

        for (let edge of edges) {
            if (linesIntersect(x1, y1, x2, y2, edge.x1, edge.y1, edge.x2, edge.y2)) {
                return true;
            }
        }

        return false;
    }

    // Function to check if two lines intersect
    function linesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (denominator === 0) return false; // Lines are parallel

        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }

    function gameLoop() {
        if (gameOver) {
            context.fillStyle = 'red'; // Change game over text color to red
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
            // Calculate the position of the tip of the gun
            const tipX = player.x + Math.cos(player.angle) * (player.size / 2);
            const tipY = player.y + Math.sin(player.angle) * (player.size / 2);

            // Update the laser beam's position based on the gun's angle
            beam.x = tipX;
            beam.y = tipY;

            // Draw the laser beam
            context.strokeStyle = 'red';
            context.lineWidth = 4;
            context.beginPath();
            context.moveTo(tipX, tipY);
            context.lineTo(tipX + Math.cos(player.angle) * canvas.height, tipY + Math.sin(player.angle) * canvas.height);
            context.stroke();

            // Check for collisions with drones
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

            // Check for collisions with black drones
            blackDrones.forEach((drone, i) => {
                const droneRect = { x: drone.x, y: drone.y, width: 80, height: 80 };
                const lineStart = { x: tipX, y: tipY };
                const lineEnd = { x: tipX + Math.cos(player.angle) * canvas.height, y: tipY + Math.sin(player.angle) * canvas.height };

                if (lineIntersectsRect(lineStart, lineEnd, droneRect)) {
                    explosions.push({ x: drone.x, y: drone.y, timer: 30 });
                    blackDrones.splice(i, 1);
                    gameOver = true;
                    assets.explosionSound.play();
                    assets.gameOverSound.play(); // Play game over tune
                }
            });

            // Check for collisions with bombs
            bombs.forEach((bomb, i) => {
                const bombRect = { x: bomb.x, y: bomb.y, width: 60, height: 60 };
                const lineStart = { x: tipX, y: tipY };
                const lineEnd = { x: tipX + Math.cos(player.angle) * canvas.height, y: tipY + Math.sin(player.angle) * canvas.height };

                if (lineIntersectsRect(lineStart, lineEnd, bombRect)) {
                    explosions.push({ x: bomb.x, y: bomb.y, timer: 30 });
                    bombs.splice(i, 1);
                    gameOver = true;
                    assets.explosionSound.play();
                    assets.gameOverSound.play(); // Play game over tune
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

        // Increase complexity when score reaches 50
        if (score >= 50) {
            // Increase spawn rate of drones and black drones
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
        // Calculate the position of the tip of the gun
        const tipX = player.x + Math.cos(player.angle) * (player.size / 2);
        const tipY = player.y + Math.sin(player.angle) * (player.size / 2);
        lasers = [{ x: tipX, y: tipY }];
        assets.laserSound.currentTime = 0; // Reset sound to start
        assets.laserSound.play();
    });

    document.addEventListener('mouseup', () => {
        lasers = [];
    });

    setInterval(createDrone, 2000);
    setInterval(createSnowflake, 500); // Create snowflakes every 500ms
    setInterval(() => {
        if (score > 50) createBlackDrone();
        if (score > 100) createBomb();
    }, 3000);

    gameLoop();
};
