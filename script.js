window.onload = function () {
    alert("Press 'M' on laptops or double-tap the gun on phones to switch laser modes.");

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
        gameOverSound: new Audio('game-over.mp3') // Fixed file name
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
    let laserMode = 'highBeam';
    let laserDrops = [];
    let isPlaying = false;
    let isPaused = false;

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

    function gameLoop() {
        if (gameOver) {
            context.fillStyle = 'white';
            context.font = '40px Arial';
            context.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2);
            context.fillText('Final Score: ' + score, canvas.width / 2 - 120, canvas.height / 2 + 50);
            assets.gameOverSound.play();
            return;
        }

        if (isPaused) return; // Prevent running the game loop when paused

        context.fillStyle = '#001F3F';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        drawRotatedImage(assets.player, player.x, player.y, player.angle, player.size);

        requestAnimationFrame(gameLoop);
    }

    // Button event listeners
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
            gameLoop();
        }
    });

    document.getElementById('restartButton').addEventListener('click', () => {
        location.reload();
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

    // Spawn elements at intervals
    setInterval(() => createDrone(), 2000);
    setInterval(() => createSnowflake(), 500);
    setInterval(() => {
        if (score > 50) createBlackDrone();
        if (score > 100) createBomb();
    }, 3000);
};
