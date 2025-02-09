const assets = {};
let isAudioEnabled = false;
let isPaused = false;
let gameOver = false;
let score = 0;
let laserMode = 'beam'; // 'beam' or 'drop'
const drones = [], blackDrones = [], bombs = [], snowflakes = [], explosions = [];
const player = { x: 300, y: 500, size: 50, angle: 0 };
const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

document.addEventListener('click', () => {
    if (!isAudioEnabled) {
        assets.backgroundMusic.play().catch(error => console.error('Error playing background music:', error));
        isAudioEnabled = true;
    }
});

document.getElementById('pauseButton').addEventListener('click', () => {
    isPaused = !isPaused;
    isPaused ? assets.backgroundMusic.pause() : assets.backgroundMusic.play();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'm' || event.key === 'M') {
        toggleLaserMode();
    }
    moveGun(event);
});

canvas.addEventListener('dblclick', () => {
    toggleLaserMode();
});

function toggleLaserMode() {
    laserMode = laserMode === 'beam' ? 'drop' : 'beam';
    alert('Laser mode switched to: ' + laserMode);
}

function moveGun(event) {
    if (event.key === 'ArrowLeft') player.x -= 20;
    if (event.key === 'ArrowRight') player.x += 20;
    if (event.key === 'ArrowUp') player.y -= 20;
    if (event.key === 'ArrowDown') player.y += 20;
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
}

function fireLaser() {
    explosions.push({ x: player.x + 20, y: player.y, size: 10, mode: laserMode });
    assets.laserSound.play();
}

document.addEventListener('click', fireLaser);

document.addEventListener('keydown', (event) => {
    if (event.key === ' ') fireLaser();
});

function createDrone() {
    drones.push({ x: Math.random() * canvas.width, y: -50, size: 50, speed: 2 + Math.random() * 3 });
}

function createBlackDrone() {
    blackDrones.push({ x: Math.random() * canvas.width, y: -50, size: 60, speed: 3 + Math.random() * 2 });
}

function createBomb() {
    bombs.push({ x: Math.random() * canvas.width, y: -50, size: 40, speed: 4 + Math.random() * 2 });
}

function createSnowflake() {
    snowflakes.push({ x: Math.random() * canvas.width, y: -10, size: 20 + Math.random() * 10, speed: 1 + Math.random() * 2 });
}

function updateObjects(objects, asset, callback) {
    objects.forEach((obj, index) => {
        obj.y += obj.speed;
        context.drawImage(asset, obj.x, obj.y, obj.size, obj.size);
        if (obj.y > canvas.height) objects.splice(index, 1);
        if (callback) callback(obj, index);
    });
}

function checkCollisions() {
    explosions.forEach((laser, laserIndex) => {
        drones.forEach((drone, droneIndex) => {
            if (Math.abs(laser.x - drone.x) < 40 && Math.abs(laser.y - drone.y) < 40) {
                drones.splice(droneIndex, 1);
                explosions.splice(laserIndex, 1);
                assets.explosionSound.play();
                score += 10;
            }
        });
    });
    blackDrones.forEach((drone) => {
        if (Math.abs(player.x - drone.x) < 50 && Math.abs(player.y - drone.y) < 50) gameOverSequence();
    });
    bombs.forEach((bomb) => {
        if (Math.abs(player.x - bomb.x) < 50 && Math.abs(player.y - bomb.y) < 50) gameOverSequence();
    });
}

function gameOverSequence() {
    gameOver = true;
    assets.gameOverSound.play();
}

function gameLoop() {
    if (gameOver) {
        context.fillStyle = 'white';
        context.font = '40px Arial';
        context.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2);
        context.fillText('Final Score: ' + score, canvas.width / 2 - 120, canvas.height / 2 + 50);
        return;
    }
    if (isPaused) return;
    context.fillStyle = '#001F3F';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawRotatedImage(assets.player, player.x, player.y, player.angle, player.size);
    updateObjects(drones, assets.drone);
    updateObjects(blackDrones, assets.blackDrone);
    updateObjects(bombs, assets.bomb);
    updateObjects(snowflakes, assets.snowflake);
    checkCollisions();
    requestAnimationFrame(gameLoop);
}

Promise.all([
    loadImage('gun2.png'),
    loadImage('drone2.png'),
    loadImage('blackdrone.png'),
    loadImage('bomb.png'),
    loadImage('explosion.png'),
    loadImage('snowflake.png'),
    loadAudio('attack-laser-128280.mp3'),
    loadAudio('small-explosion-129477.mp3'),
    loadAudio('lonely-winter-breeze-36867.mp3'),
    loadAudio('game-over.mp3')
]).then((loadedAssets) => {
    assets.player = loadedAssets[0];
    assets.drone = loadedAssets[1];
    assets.blackDrone = loadedAssets[2];
    assets.bomb = loadedAssets[3];
    assets.explosion = loadedAssets[4];
    assets.snowflake = loadedAssets[5];
    assets.laserSound = loadedAssets[6];
    assets.explosionSound = loadedAssets[7];
    assets.backgroundMusic = loadedAssets[8];
    assets.gameOverSound = loadedAssets[9];
    gameLoop();
}).catch(error => console.error('Error loading assets:', error));
