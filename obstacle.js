class Obstacle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.active = true;
    }

    update(dt) {}
    checkCollision(player) {}
    draw() {}
}


class Ball extends Obstacle {
    /**
     * @param {number} x       - Initial center X
     * @param {number} y       - Initial center Y
     * @param {number} radius  - Ball radius (default 20)
     * @param {number} speed   - Pixels per second (default 300)
     */
    constructor(x, y, radius = 40, speed = 300) {
        super(x, y);
        this.radius = radius;

        // Pick a random diagonal direction: one of (±1, ±1), normalized to 45°
        const signX = Math.random() < 0.5 ? 1 : -1;
        const signY = Math.random() < 0.5 ? 1 : -1;
        this.xv = signX * speed * Math.SQRT1_2;
        this.yv = signY * speed * Math.SQRT1_2;
    }

    // ─── update ────────────────────────────────────────────────────────────────
    update(dt) {
        this.x += this.xv * dt;
        this.y += this.yv * dt;

        const W = canvas.width;   // assumes a global `canvas` element
        const H = canvas.height;  // replace with your own screen-size reference

        // Bounce off left / right walls
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.xv = Math.abs(this.xv);
        } else if (this.x + this.radius > W) {
            this.x = W - this.radius;
            this.xv = -Math.abs(this.xv);
        }

        // Bounce off top / bottom walls
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.yv = Math.abs(this.yv);
        } else if (this.y + this.radius > H) {
            this.y = H - this.radius;
            this.yv = -Math.abs(this.yv);
        }
    }

    // ─── checkCollision ────────────────────────────────────────────────────────
    /**
     * Circle–AABB collision.
     *
     * player is expected to expose:
     *   player.x, player.y   → bottom-left corner of the bounding box
     *   player.width         → box width
     *   player.height        → box height  (extends *upward* from y)
     *
     * Returns true and sets this.active = false when a hit is detected.
     */
    checkCollision() {
        if (!this.active) return false;
        if (player.z > 0) return false;

        // Convert bottom-left origin → standard top-left AABB
        const rectX = player.x;
        const rectY = player.y - player.height; // top edge
        const rectW = player.width;
        const rectH = player.height;

        // Closest point on the rectangle to the ball's centre
        const closestX = Math.max(rectX, Math.min(this.x, rectX + rectW));
        const closestY = Math.max(rectY, Math.min(this.y, rectY + rectH));

        const dx = this.x - closestX;
        const dy = this.y - closestY;

        if (dx * dx + dy * dy <= this.radius * this.radius) {
        this.active = false; // ball is "consumed" on hit — remove if preferred
        return true;         // caller should handle player death / damage
        }

        return false;
    }

    // ─── draw ──────────────────────────────────────────────────────────────────
    draw() {
        if (!this.active) return;

        ctx.save();

        // Outer glow
        ctx.shadowColor = 'rgba(255, 80, 80, 0.7)';
        ctx.shadowBlur  = this.radius * 0.8;

        // Ball fill
        // const gradient = ctx.createRadialGradient(
        //     this.x - this.radius * 0.3,
        //     this.y - this.radius * 0.3,
        //     this.radius * 0.1,
        //     this.x,
        //     this.y,
        //     this.radius
        // );
        // gradient.addColorStop(0, "#ff9f9f");
        // gradient.addColorStop(1, "#cc0000");

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgb(255, 40, 40)';
        ctx.fill();

        // Subtle outline
        ctx.beginPath();
        ctx.fillStyle = 'rgb(255, 40, 40)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 5;
        ctx.arc(this.x, this.y, this.radius - ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

class LaserPair extends Obstacle {
    /**
     * Two symmetrical vertical lasers that move across the screen
     * and pass each other in the center.
     */
    constructor(width = 15, speed = 120) {
        super(0, 0);

        this.width = width;
        this.speed = speed;

        // horizontal shift from center
        console.log(canvas.width)
        this.offset = canvas.width / 3;
    }

    // ─── update ─────────────────────────────────────────────
    update(dt) {
        const maxRange = canvas.width / 2 + this.width;

        this.offset += this.speed * dt;

        // reset once beams fully pass the screen
        if (this.offset > maxRange) {
            this.offset = -maxRange;
        }
    }

    // ─── helper ─────────────────────────────────────────────
    _beamPositions() {
        const center = canvas.width / 2;

        return {
            leftX: center - this.offset - this.width / 2,
            rightX: center + this.offset - this.width / 2
        };
    }

    // ─── collision ──────────────────────────────────────────
    checkCollision() {
        if (!this.active) return false;
        if (player.z > 0) return false;

        const result = Math.abs(Math.abs(player.x + player.width / 2 - canvas.width / 2) - Math.abs(this.offset)) <= player.width / 2 + this.width / 2;
        if (result) this.active = false;
        return result;
    }

    // ─── draw ───────────────────────────────────────────────
    draw() {
        if (!this.active) return;

        const H = canvas.height;
        const { leftX, rightX } = this._beamPositions();

        ctx.fillStyle = "#cc0000";

        ctx.fillRect(leftX, 0, this.width, H);
        ctx.fillRect(rightX, 0, this.width, H);
    }
}
