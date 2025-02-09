assets.player.src = 'gun2.png';
assets.drone.src = 'drone2.png';
assets.blackDrone.src = 'blackdrone.png';
assets.bomb.src = 'bomb.png';
assets.explosion.src = 'explosion.png';
assets.snowflake.src = 'snowflake.png';
assets.gameOverSound = new Audio('game-over.mp3'); 

document.addEventListener('click', () => {
    if (!isAudioEnabled) {
        assets.backgroundMusic.play().catch(error => console.error('Error playing background music:', error));
        isAudioEnabled = true;
    }
});
document.getElementById('pauseButton').addEventListener('click', () => {
    isPaused = !isPaused;

    if (isPaused) {
        assets.backgroundMusic.pause();
    } else {
        assets.backgroundMusic.play();
        gameLoop(); 
    }
});


function createDrone() {
    drones.push({
        x: Math.random() * canvas.width,
        y: -50,
        size: 50,
        speed: 2 + Math.random() * 3
    });
}

function createBlackDrone() {
    blackDrones.push({
        x: Math.random() * canvas.width,
        y: -50,
        size: 60,
        speed: 3 + Math.random() * 2
    });
}

function createBomb() {
    bombs.push({
        x: Math.random() * canvas.width,
        y: -50,
        size: 40,
        speed: 4 + Math.random() * 2
    });
}

function createSnowflake() {
    snowflakes.push({
        x: Math.random() * canvas.width,
        y: -10,
        size: 20 + Math.random() * 10,
        speed: 1 + Math.random() * 2
    });
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

    if (isPaused) return;

    // Clear the canvas
    context.fillStyle = '#001F3F';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player
    drawRotatedImage(assets.player, player.x, player.y, player.angle, player.size);

    // Update and draw drones
    drones.forEach((drone, index) => {
        drone.y += drone.speed;
        context.drawImage(assets.drone, drone.x, drone.y, drone.size, drone.size);

        // Remove drones that go off-screen
        if (drone.y > canvas.height) {
            drones.splice(index, 1);
        }
    });

    // Update and draw other elements (blackDrones, bombs, snowflakes, etc.)
    // Add similar logic for blackDrones, bombs, snowflakes, lasers, and explosions

    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'm' || event.key === 'M') {
        laserMode = laserMode === 'highBeam' ? 'lowBeam' : 'highBeam';
        alert('Laser mode switched to: ' + laserMode);
    }
});

canvas.addEventListener('dblclick', () => {
    laserMode = laserMode === 'highBeam' ? 'lowBeam' : 'highBeam';
    alert('Laser mode switched to: ' + laserMode);
});


function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

function loadAudio(src) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(src);
        audio.oncanplaythrough = () => resolve(audio);
        audio.onerror = reject;
    });
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
    // Assign loaded assets to the assets object
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

    // Start the game
    gameLoop();
}).catch((error) => {
    console.error('Error loading assets:', error);
});
