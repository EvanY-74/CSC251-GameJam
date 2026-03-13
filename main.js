const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const BACKGROUND_COLOR = '#151515';
canvas.style.backgroundColor = BACKGROUND_COLOR;

function resizeCanvas() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const player = new Player();
let lastTime = 0;

// All obstacles
const allObstacles = [
    new Ball(),
    new LaserPair(),
    new LowLaser(),
    new SpinnerBar(),
    new MovingWallGap(),
    new Bomb(),
    new EdgeRunner(),
    new SawBlades(),
    new Rain(),
    new Zone()
];

// Active obstacles in current round
let activeObstacles = [];

// Round management
let round = 0;
let roundTime = 10;
let roundTimer = 0;
let playerImmune = false;
let immunityTimer = 0;
let gameOver = false;

// ─── Start or Restart Round ─────────────────────────
function startRound(resetTimer = true) {
    if (resetTimer) roundTimer = 0;

    // Reset all active obstacles
    activeObstacles.forEach(ob => ob.active = true);

    // Player immune for 3s
    playerImmune = true;
    immunityTimer = 3;

    // Round time: 10 + (round - 1)
    roundTime = 10 + round - 1 + immunityTimer;
}

// ─── Start Next Round (after survival) ─────────────
function startNextRound() {
    round++;
    // Add next obstacle if available
    if (round - 1 < allObstacles.length) {
        activeObstacles.push(allObstacles[round - 1]);
    }
    startRound(); // reset timers & immunity
}

// ─── Handle Game Over ───────────────────────────────
function triggerGameOver() {
    gameOver = true;
    // Freeze timer so UI shows the round where player died
    roundTimer = Math.min(roundTimer, roundTime);
}

// ─── Game Loop ─────────────────────────────────────
function init(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update only if game is not over
    if (!gameOver) {
        roundTimer += dt;

        if (playerImmune) {
            immunityTimer -= dt;
            if (immunityTimer <= 0) playerImmune = false;
        }

        player.update(dt);

        let collision = false;
        activeObstacles.forEach(obstacle => {
            obstacle.update(dt);
            if (!playerImmune && obstacle.checkCollision()) collision = true;
        });

        if (collision) triggerGameOver();

        // Check if player survived the round
        if (roundTimer >= roundTime && !gameOver) {
            startNextRound();
        }
    }

    // Draw everything
    player.draw();
    activeObstacles.forEach(obstacle => obstacle.draw());

    // ─── UI ─────────────────────────────────────────
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Round: ${round}`, 20, 40);

    const timeLeft = Math.ceil(Math.max(0, (roundTime - roundTimer)));

    // Immunity overlay
    ctx.textAlign = "center";
    if (playerImmune && !gameOver) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.075)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'yellow';
        ctx.fillText(`IMMUNE`, canvas.width / 2, 200);
    }

    // Big round number top-center
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.font = "160px Arial";
    ctx.textBaseline = "top";
    ctx.fillText(`${timeLeft}/${round + 9}`, canvas.width / 2, 20);
    ctx.restore();

    // Game Over screen
    if (gameOver) drawGameOver();

    requestAnimationFrame(init);
}

// ─── Game Over Screen ───────────────────────────────
function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'red';
    ctx.font = '64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = 'white';
    ctx.font = '32px Arial';
    ctx.fillText(`Round Reached: ${round}`, canvas.width / 2, canvas.height / 2 + 0);
    ctx.fillText('Click to Restart', canvas.width / 2, canvas.height / 2 + 60);
}

// ─── Restart Game ───────────────────────────────────
canvas.addEventListener('click', () => {
    if (gameOver) {
        // Reset everything for the current round
        roundTimer = 0;
        playerImmune = true;
        immunityTimer = 3;
        gameOver = false;
        activeObstacles.forEach(ob => ob.active = true);
        startRound(false); // restart same round
        lastTime = performance.now();
        requestAnimationFrame(init);
    }
});

// ─── Start First Round ──────────────────────────────
round = 1; // first round
activeObstacles.push(allObstacles[0]);
startRound();
requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    requestAnimationFrame(init);
});