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

function init(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    player.update(dt);
    obstacles.forEach(obstacle => {
        obstacle.update(dt);
        obstacle.checkCollision(dt);
    });
    obstacles.forEach(obstacle => {
        obstacle.draw();
    });
    player.draw();

    requestAnimationFrame(init);
}

requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    requestAnimationFrame(init);
});

// init();