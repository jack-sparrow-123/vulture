window.onload = function () {
    console.log("Waiting for images to load...");
};

const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

// Set canvas size
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
    snowflake: new Image(),
    laserSound: new Audio('attack-laser-128280.mp3'),
    explosionSound: new Audio('small-explosion-129477.mp3'),
    backgroundMusic: new Audio('lonely-winter-breeze-36867.mp3'),
    gameOverSound: new Audio('game-over-38511.mp3')
};

// Set image sources
const imagePaths = {
    player: 'gun2.png.png',
    drone: 'drone2.png.png',
    blackDrone: 'blackdrone.png.png',
    bomb: 'bomb.png',
    explosion: 'explosion.png.png',
    snowflake: 'snowflake.png.png'
};

// Track loaded images
let loadedImages = 0;
let totalImages = Object.keys(imagePaths).length;

// Ensure images are fully loaded before running the game
Object.keys(imagePaths).forEach((key) => {
    assets[key].src = imagePaths[key];
    assets[key].onload = () => {
        loadedImages++;
        if (loadedImages === totalImages) {
            startGame();
        }
    };
    assets[key].onerror = () => {
        console.error(`Error loading image: ${imagePaths[key]}`);
    };
});

// Don't start the game until all images are loaded
function startGame() {
    assets.backgroundMusic.loop = true;
    gameLoop();
}

// Game variables
let player = { x: canvas.width / 2, y: canvas.height - 100, size: 80, angle: 0 };
let drones = [], blackDrones = [], bombs = [], lasers = [], explosions = [], snowflakes = [], score = 0;
let isAudioEnabled = false;
let gameOver = false;
let gameOverSoundPlayed = false; // Ensure the game over sound plays only once

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
        if (e.key === 'ArrowLeft') player.x -= speed;
        if (e.key === 'ArrowRight') player.x += speed;
        if (e.key === 'ArrowUp') player.y -= speed;
        if (e.key === 'ArrowDown') player.y += speed;
        
        // Keep player within canvas bounds
        player.x = Math.max(0, Math.min(canvas.width, player.x));
        player.y = Math.max(0, Math.min(canvas.height, player.y));
    }
});

canvas.addEventListener('click', () => { if (!gameOver) shootLaser(); });
canvas.addEventListener('touchstart', () => { if (!gameOver) shootLaser(); });

function shootLaser() {
    if (!gameOver) {
        lasers.push({ x: player.x, y: player.y, angle: player.angle });
        assets.laserSound.play();
    }
}

function checkLaserCollisions() {
    if (lasers.length > 0) {
        let beam = lasers[0];

        const startX = player.x + Math.cos(player.angle) * (player.size / 2);
        const startY = player.y + Math.sin(player.angle) * (player.size / 2);

        const endX = startX + Math.cos(player.angle) * canvas.height;
        const endY = startY + Math.sin(player.angle) * canvas.height;

        function isHit(obj, size) {
            const dist = Math.abs((endY - startY) * obj.x - (endX - startX) * obj.y + endX * startY - endY * startX) /
                Math.sqrt((endY - startY) ** 2 + (endX - startX) ** 2);
            return dist < size / 2;
        }

        drones.forEach((drone, i) => {
            if (isHit(drone, 80)) {
                explosions.push({ x: drone.x, y: drone.y, timer: 30 });
                drones.splice(i, 1);
                score += 10;
                assets.explosionSound.play();
            }
        });

        blackDrones.forEach((drone, i) => {
            if (isHit(drone, 80)) {
                explosions.push({ x: drone.x, y: drone.y, timer: 30 });
                blackDrones.splice(i, 1);
                gameOver = true;
                assets.explosionSound.play();
            }
        });

        bombs.forEach((bomb, i) => {
            if (isHit(bomb, 60)) {
                explosions.push({ x: bomb.x, y: bomb.y, timer: 30 });
                bombs.splice(i, 1);
                gameOver = true;
                assets.explosionSound.play();
            }
        });
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

// Spawning functions
setInterval(() => drones.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 1 + score / 100 }), 1000);
setInterval(() => blackDrones.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 2 + score / 100 }), 3000);
setInterval(() => bombs.push({ x: Math.random() * (canvas.width - 80), y: 0, speed: Math.random() * 2 + 2 + score / 100 }), 5000);
setInterval(() => snowflakes.push({ x: Math.random() * canvas.width, y: 0, speed: Math.random() * 2 + 1 }), 500);

function gameLoop() {
    if (gameOver) {
        if (!gameOverSoundPlayed) {
            assets.gameOverSound.play();
            gameOverSoundPlayed = true;
        }
        context.fillStyle = 'red';
        context.font = '40px Arial';
        context.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2);
        return;
    }

    context.fillStyle = '#001F3F';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawRotatedImage(assets.player, player.x, player.y, player.angle, player.size);
    checkLaserCollisions();
    requestAnimationFrame(gameLoop);
}

gameLoop();
