class Player {
    constructor() {
        // Position & size
        this.x = canvas.width / 2; // bottom left corner of player
        this.y = canvas.height / 2;
        this.z = 0;
        this.width = 32;
        this.HEIGHT = 32;
        this.height = this.HEIGHT;
        
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;

        
        this.speed = 400;
        this.acceleration = 2400;
        this.friction = 2300;
        this.airMovementMultiplier = 0.65; // reduce acceleration and friction if in the air

        this.jumping = false;
        this.jumpTime = 0;
        this.maxJumpTime = 0.2;
        this.jumpForce = 310;
        this.gravity = 1200;

        this.crouchSpeed = this.speed * 0.75;
        this.crouchGravity = this.gravity * 2.25; // increase gravity when crouching (under certain circumstances)
        
        this.keys = { KeyW: false, KeyA: false, KeyS: false, KeyD: false, Space: false, ShiftLeft: false };

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
        // z (jumping)
        if (this.keys.Space && !this.jumping) {
            this.jumping = true;
            this.jumpTime = 0;
            this.vz = this.jumpForce;
        }
        const gravity = this.keys.ShiftLeft ? this.crouchGravity : this.gravity;
        if (this.z > 0 || this.vz > 0) {
            if (this.keys.Space && this.jumpTime < this.maxJumpTime) {
                const remaining = this.maxJumpTime - this.jumpTime;
                if (dt <= remaining) {
                    // entire step is within hold window
                    this.jumpTime += dt;
                    this.vz = this.jumpForce;
                    this.z += this.vz * dt;
                } else {
                    // split: first part holds vz constant, second part applies gravity
                    this.jumpTime = this.maxJumpTime;
                    const dtHeld = remaining;
                    const dtFall = dt - remaining;
                    this.z += this.jumpForce * dtHeld;
                    this.vz -= gravity * dtFall;
                    this.z = Math.max(this.z + this.vz * dtFall, 0);
                }
            } else {
                if (!this.keys.Space) this.jumpTime = this.maxJumpTime;
                this.vz -= gravity * dt;
                this.z = Math.max(this.z + this.vz * dt, 0);
            }
        } else {
            this.jumping = false;
            this.jumpTime = 0;
        }

        this.height = !this.keys.ShiftLeft ? this.HEIGHT : this.HEIGHT * 0.7;

        // x and y
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

        this.vx += targetDx * (this.jumping ? this.airMovementMultiplier : 1) * dt;
        this.vy += targetDy * (this.jumping ? this.airMovementMultiplier : 1) * dt;

        // Apply friction when no horizontal input
        const frictionX = Math.sign(targetDx) != Math.sign(this.vx);
        const frictionY = Math.sign(targetDy) != Math.sign(this.vy);
        if (frictionX) {
            let sign = Math.sign(this.vx);
            this.vx -= sign * this.friction * (this.jumping ? this.airMovementMultiplier : 1) * (frictionY ? Math.SQRT1_2 : 1) * dt;
            if (sign != Math.sign(this.vx)) this.vx = 0; // stop overcorrection
        }

        // Apply friction when no vertical input
        if (frictionY) {
            let sign = Math.sign(this.vy);
            this.vy -= sign * this.friction * (this.jumping ? this.airMovementMultiplier : 1) * (frictionX ? Math.SQRT1_2 : 1) * dt;
            if (sign != Math.sign(this.vy)) this.vy = 0; // stop overcorrection
        }

        // Clamp to max speed
        const speed = this.ShiftLeft ? this.crouchSpeed : this.speed;
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (currentSpeed > speed) {
            this.vx = (this.vx / currentSpeed) * speed;
            this.vy = (this.vy / currentSpeed) * speed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Clamp to canvas bounds
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        this.y = Math.max(this.height, Math.min(canvas.height, this.y));

        // ── Jump / gravity ──

        // TODO: add dash
    }

    draw() {
        // Body
        ctx.fillStyle = "#4f9eff";
        ctx.fillRect(this.x, this.y - this.height - this.z, this.width, this.height);

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
            this.y,
            this.width / 2 * shadowScale,
            this.height / 4 * shadowScale,
            0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Now add the functionality of going down quicker