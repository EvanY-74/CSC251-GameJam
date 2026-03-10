class Player {
    constructor() {
        // Position & size
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.z = 0;
        this.width = 32;
        this.height = 32;
        
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.jumping = false;
        
        this.speed = 400;
        this.acceleration = 2400;
        this.friction = 2300;
        this.jumpForce = 300;
        this.gravity = 900;

        this.keys = { KeyW: false, KeyA: false, KeyS: false, KeyD: false, Space: false };

        // Bind and register input listeners
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("keyup", this._onKeyUp);

        this.color = "#4f9eff";
    }

    // ─── Input ────────────────────────────────────────────────────────────────

    _onKeyDown(e) {
        const k = e.code;
        if (k in this.keys) {
        e.preventDefault();
        this.keys[k] = true;
        }
    }

    _onKeyUp(e) {
        const k = e.code;
        if (k in this.keys) this.keys[k] = false;
    }

    /** Call this when you want to remove the player and clean up listeners. */
    destroy() {
        window.removeEventListener("keydown", this._onKeyDown);
        window.removeEventListener("keyup", this._onKeyUp);
    }

    update(dt) {
        let targetDx = 0;
        let targetDy = 0;

        if (this.keys.KeyA) targetDx -= this.acceleration;
        if (this.keys.KeyD) targetDx += this.acceleration;
        if (this.keys.KeyW) targetDy -= this.acceleration;
        if (this.keys.KeyS) targetDy += this.acceleration;

        // Normalize diagonal target
        if (targetDx !== 0 && targetDy !== 0) {
            targetDx *= Math.SQRT1_2;
            targetDy *= Math.SQRT1_2;
        }

        this.vx += targetDx * dt;
        this.vy += targetDy * dt;

        // Apply friction when no horizontal input
        const frictionX = Math.sign(targetDx) != Math.sign(this.vx);
        const frictionY = Math.sign(targetDy) != Math.sign(this.vy);
        if (frictionX) {
            let sign = Math.sign(this.vx);
            this.vx -= sign * this.friction * (frictionY ? Math.SQRT1_2 : 1) * dt;
            if (sign != Math.sign(this.vx)) this.vx = 0; // stop overcorrection
        }

        // Apply friction when no vertical input
        if (frictionY) {
            let sign = Math.sign(this.vy);
            this.vy -= sign * this.friction * (frictionX ? Math.SQRT1_2 : 1) * dt;
            if (sign != Math.sign(this.vy)) this.vy = 0; // stop overcorrection
        }

        // Clamp to max speed
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (currentSpeed > this.speed) {
            this.vx = (this.vx / currentSpeed) * this.speed;
            this.vy = (this.vy / currentSpeed) * this.speed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Clamp to canvas bounds
        this.x = Math.max(this.width / 2, Math.min(canvas.width  - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(canvas.height - this.height / 2, this.y));

        // ── Jump / gravity ──

        // TODO: add higher jump height when holding space (but only for certain amount)
        // TODO: add shift key to increase gravity
        // TODO: add dash
        if (this.keys.Space && this.jumping == false) {
            this.jumping = true;
            this.vz = this.jumpForce;
        }
        if (this.z > 0 || this.vz > 0) {
            this.vz -= this.gravity * dt;
            this.z = Math.max(this.z + this.vz * dt, 0);
        } else this.jumping = false;
    }

    draw() {
        // Body
        ctx.fillStyle = "#4f9eff";
        ctx.fillRect(this.x, this.y - this.z, this.width, this.height);

        if (this.z == 0) return;

        // Shadow — stays at ground position, shrinks as player rises
        const maxShadowScale = 1;
        const shadowShrink   = 0.4;  // how much it shrinks at peak jump
        const shadowFade     = 0.35; // max shadow opacity
        const jumpPeak       = this.jumpForce / 2; // rough normalizer for scale
        const heightRatio    = Math.min(this.z / jumpPeak, 1);
        const shadowScale    = maxShadowScale - shadowShrink * heightRatio;
        const shadowAlpha    = shadowFade * (1 - heightRatio * 0.5);


        ctx.globalAlpha = shadowAlpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(
            this.x + this.width / 2,
            this.y + this.height,
            this.width / 2 * shadowScale,
            this.height / 4 * shadowScale,
            0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Now add the functionality of going down quicker