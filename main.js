const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}
resizeCanvas();

window.addEventListener('resize', resizeCanvas);

const player = new Player(canvas);
let lastTime = 0;

function init(timestamp) {
    const dt = (timestamp - lastTime) / 1000
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update(dt);
    player.draw();

    requestAnimationFrame(init);
}

requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    requestAnimationFrame(init);
});

// init();