class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        // Position & size
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.width = 32;
        this.height = 32;

        this.vx = 0;
        this.vy = 0;

        this.acceleration = 5000;
        this.friction = 3;

        // Movement
        this.speed = 300; // pixels per second
        this.keys = { w: false, a: false, s: false, d: false };

        // Bind and register input listeners
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("keyup", this._onKeyUp);
    }

    // ─── Input ────────────────────────────────────────────────────────────────

    _onKeyDown(e) {
        const k = e.key.toLowerCase();
        if (k in this.keys) {
        e.preventDefault();
        this.keys[k] = true;
        }
    }

    _onKeyUp(e) {
        const k = e.key.toLowerCase();
        if (k in this.keys) this.keys[k] = false;
    }

    /** Call this when you want to remove the player and clean up listeners. */
    destroy() {
        window.removeEventListener("keydown", this._onKeyDown);
        window.removeEventListener("keyup", this._onKeyUp);
    }

    update(dt) {
        // if (this.keys.w) debugger;
        let targetDx = 0;
        let targetDy = 0;

        if (this.keys.a) targetDx -= 1;
        if (this.keys.d) targetDx += 1;
        if (this.keys.w) targetDy -= 1;
        if (this.keys.s) targetDy += 1;

        // Normalize diagonal target
        if (targetDx !== 0 && targetDy !== 0) {
            targetDx *= Math.SQRT1_2;
            targetDy *= Math.SQRT1_2;
        }

        const ax = targetDx !== 0 ? (targetDx - (this.vx / this.speed)) * this.acceleration : -this.vx * this.friction;
        const ay = targetDy !== 0 ? (targetDy - (this.vy / this.speed)) * this.acceleration : -this.vy * this.friction;

        this.vx += ax * dt;
        this.vy += ay * dt;

        // Clamp to max speed
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (currentSpeed > this.speed) {
            this.vx = (this.xv / currentSpeed) * this.speed;
            this.vy = (this.vy / currentSpeed) * this.speed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Clamp to canvas bounds
        this.x = Math.max(this.width / 2, Math.min(this.canvas.width  - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(this.canvas.height - this.height / 2, this.y));
    }



    draw() {
        const ctx = this.ctx;
        ctx.save();

        // Body
        ctx.fillStyle = "#4f9eff";
        ctx.fillRect(
        this.x - this.width / 2,
        this.y - this.height / 2,
        this.width,
        this.height
        );

        // Outline
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(
        this.x - this.width / 2,
        this.y - this.height / 2,
        this.width,
        this.height
        );

        ctx.restore();
    }
}