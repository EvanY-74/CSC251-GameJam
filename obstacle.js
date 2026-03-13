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
    constructor(x = 40, y = 40, radius = 40, speed = 300) {
        super(x, y);
        this.radius = radius;

        // Pick a random diagonal direction: one of (±1, ±1), normalized to 45°
        this.x = x;
        this.y = y;
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

        return dx * dx + dy * dy <= this.radius * this.radius;
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

        return Math.abs(Math.abs(player.x + player.width / 2 - canvas.width / 2) - Math.abs(this.offset)) <= player.width / 2 + this.width / 2;
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

class LowLaser extends Obstacle {
    /**
     * Horizontal beam that moves vertically and must be crouched under.
     */
    constructor(y = 0, height = 25, speed = 180) {
        super(0, y);

        this.height = height;
        this.speed = speed;

        // full width beam
        this.width = canvas.width;

        // vertical velocity
        this.yv = speed * (Math.random() < 0.5 ? 1 : -1);

        // height above ground (for shadow)
        this.z = 40;
    }

    // ─── update ─────────────────────────────────────────
    update(dt) {
        this.y += this.yv * dt;

        // bounce off top/bottom
        if (this.y - this.height / 2 < 0) {
            this.y = this.height / 2;
            this.yv = Math.abs(this.yv);
        } 
        else if (this.y + this.height / 2 > canvas.height) {
            this.y = canvas.height - this.height / 2;
            this.yv = -Math.abs(this.yv);
        }
    }

    // ─── collision ──────────────────────────────────────
    checkCollision() {
        if (!this.active) return false;
        if (player.keys.ShiftLeft || player.z < this.z) return false;

        const rectX = player.x;
        const rectY = player.y - player.height;
        const rectW = player.width;
        const rectH = player.height;

        const beamY = this.y - this.height / 2;

        const overlap =
            rectX < this.width &&
            rectX + rectW > 0 &&
            rectY < beamY + this.height &&
            rectY + rectH > beamY;

        return overlap;
    }

    // ─── draw ───────────────────────────────────────────
    draw() {
        if (!this.active) return;

        const beamY = this.y - this.height / 2;

        ctx.save();

        // shadow (square/rectangle)
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(
            0,
            beamY + this.z,
            this.width,
            this.height
        );

        // beam
        ctx.fillStyle = "rgb(60,120,255)";
        ctx.fillRect(
            0,
            beamY,
            this.width,
            this.height
        );

        ctx.restore();
    }
}

class SpinnerBar extends Obstacle {
    /**
     * Rotating bar around screen center.
     */
    constructor(length = canvas.width * 2, width = 14, speed = 1.6) {
        super(canvas.width / 2, canvas.height / 2);

        this.length = length;
        this.width = width;

        this.angle = 0;
        this.angularSpeed = speed;

        this.z = 45;
    }

    // ─── update ─────────────────────────────────────────
    update(dt) {
        this.angle += this.angularSpeed * dt;
    }

    // ─── collision ──────────────────────────────────────
    checkCollision() {
        if (!this.active) return false;

        // jumping or crouching avoids
        if (player.z > 0) return false;
        if (player.keys.ShiftLeft) return false;

        const cx = this.x;
        const cy = this.y;

        const half = this.length / 2;

        // endpoints of the bar
        const x1 = cx + Math.cos(this.angle) * -half;
        const y1 = cy + Math.sin(this.angle) * -half;

        const x2 = cx + Math.cos(this.angle) * half;
        const y2 = cy + Math.sin(this.angle) * half;

        // player center
        const px = player.x + player.width / 2;
        const py = player.y - player.height / 2;

        const dx = x2 - x1;
        const dy = y2 - y1;

        const t = Math.max(0, Math.min(1,
            ((px - x1) * dx + (py - y1) * dy) /
            (dx * dx + dy * dy)
        ));

        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;

        const distX = px - closestX;
        const distY = py - closestY;

        return distX * distX + distY * distY <= (this.width + player.width) ** 2 / 4;
    }

    // ─── draw ───────────────────────────────────────────
    draw() {
        if (!this.active) return;

        const cx = this.x;
        const cy = this.y;

        ctx.save();

        ctx.translate(cx, cy);
        ctx.rotate(this.angle);

        // bar
        ctx.fillStyle = "white";
        ctx.fillRect(
            -this.length / 2,
            -this.width / 2,
            this.length,
            this.width
        );

        ctx.restore();

        // center hub
        ctx.beginPath();
        ctx.arc(cx, cy, this.width * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
    }
}

class MovingWallGap extends Obstacle {
    /**
     * Vertical wall that moves across the screen with a gap.
     */
    constructor(speed = 160, gapSize = 140, wallWidth = 60) {
        super(-wallWidth, 0);

        this.speed = speed;
        this.gapSize = gapSize;
        this.wallWidth = wallWidth;

        this.shadowWidth = 12;

        // random vertical gap location
        this.gapY = Math.random() * (canvas.height - gapSize);
    }

    // ─── update ─────────────────────────────────────────
    update(dt) {
        this.x += this.speed * dt;

        if (this.x > canvas.width + this.wallWidth) {
            this.x = -this.wallWidth;
            this.gapY = Math.random() * (canvas.height - this.gapSize);
        }
    }

    // ─── collision ──────────────────────────────────────
    checkCollision() {
        if (!this.active) return false;

        const rectX = player.x;
        const rectY = player.y - player.height;
        const rectW = player.width;
        const rectH = player.height;

        const overlapX =
            rectX < this.x + this.wallWidth &&
            rectX + rectW > this.x;

        if (!overlapX) return false;

        const gapTop = this.gapY;
        const gapBottom = this.gapY + this.gapSize;

        const playerTop = rectY;
        const playerBottom = rectY + rectH;

        if (playerTop < gapTop || playerBottom > gapBottom) {
            return true;
        }

        return false;
    }

    // ─── draw ───────────────────────────────────────────
    draw() {
        if (!this.active) return;

        const H = canvas.height;

        const gapTop = this.gapY;
        const gapBottom = this.gapY + this.gapSize;

        ctx.save();

        // ─── wall
        ctx.fillStyle = "gray";

        // top
        ctx.fillRect(
            this.x,
            0,
            this.wallWidth,
            gapTop
        );

        // bottom
        ctx.fillRect(
            this.x,
            gapBottom,
            this.wallWidth,
            H - gapBottom
        );

        // ─── shadows (split so they don't pass through gap)
        ctx.fillStyle = "rgba(0,0,0,0.25)";

        // left shadow top
        ctx.fillRect(
            this.x,
            0,
            this.shadowWidth,
            gapTop
        );

        // left shadow bottom
        ctx.fillRect(
            this.x,
            gapBottom,
            this.shadowWidth,
            H - gapBottom
        );

        // right shadow top
        ctx.fillRect(
            this.x + this.wallWidth - this.shadowWidth,
            0,
            this.shadowWidth,
            gapTop
        );

        // right shadow bottom
        ctx.fillRect(
            this.x + this.wallWidth - this.shadowWidth,
            gapBottom,
            this.shadowWidth,
            H - gapBottom
        );

        ctx.restore();
    }
}

class Bomb extends Obstacle {
    constructor() {
        super(0, 0);

        this.timer = 0;
        this.x = 0;
        this.y = 0;

        this.warningTime = 1;      // warning duration
        this.explosionTime = 0.25; // expansion duration
        this.cycleTime = 3;

        this.maxRadius = 100;
        this.explosionRadius = 0;

        this.spawn();
    }

    spawn() {
        // this.x = player.x + player.width / 2;
        // this.y = player.y - player.height / 2;
        // spawn at player position
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;

        this.timer = 0;
        this.explosionRadius = 0;
    }

    // ─── update ─────────────────────────────────────────
    update(dt) {
        this.timer += dt;

        // explosion expansion
        if (this.timer >= this.warningTime && this.timer <= this.warningTime + this.explosionTime) {
            const t = (this.timer - this.warningTime) / this.explosionTime;
            this.explosionRadius = this.maxRadius * t;
        }

        // reset cycle
        if (this.timer >= this.cycleTime) {
            this.spawn();
        }
    }

    // ─── collision ──────────────────────────────────────
    checkCollision() {
        if (!this.active) return false;

        // only dangerous during expansion window
        if (this.timer < this.warningTime || this.timer > this.warningTime + this.explosionTime) {
            return false;
        }

        const px = player.x + player.width / 2;
        const py = player.y - player.height / 2;

        const dx = px - this.x;
        const dy = py - this.y;

        return dx * dx + dy * dy <= this.explosionRadius * this.explosionRadius;
    }

    // ─── draw ───────────────────────────────────────────
    draw() {
        if (!this.active) return;

        ctx.save();

        // warning phase
        if (this.timer < this.warningTime) {

            ctx.fillStyle = "rgba(255, 220, 0, 0.35)";

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.maxRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // explosion phase
        else if (this.timer <= this.warningTime + this.explosionTime) {

            ctx.fillStyle = "rgba(255, 111, 45, 0.8)";

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.explosionRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class EdgeRunner extends Obstacle {
    constructor(size = 150, speed = 500) {
        super(0, 0);

        this.size = size;
        this.speed = speed;

        // path coordinates along the edge (clockwise)
        this.points = [
            { x: 0, y: 0 },                       // top-left
            { x: canvas.width - size, y: 0 },     // top-right
            { x: canvas.width - size, y: canvas.height - size }, // bottom-right
            { x: 0, y: canvas.height - size }     // bottom-left
        ];

        this.current = 0; // index of current target point
        this.x = this.points[0].x;
        this.y = this.points[0].y;
    }

    update(dt) {
        let target = this.points[(this.current + 1) % 4];

        // calculate direction vector
        let dx = target.x - this.x;
        let dy = target.y - this.y;
        let dist = Math.hypot(dx, dy);

        // distance to move this frame
        let moveDist = this.speed * dt;

        if (moveDist >= dist) {
            // snap to target and move to next point
            this.x = target.x;
            this.y = target.y;
            this.current = (this.current + 1) % 4;
        } else {
            // move toward target
            const nx = dx / dist;
            const ny = dy / dist;

            this.x += nx * moveDist;
            this.y += ny * moveDist;
        }
    }

    checkCollision() {
        if (!this.active) return false;
        if (player.z > 0) return false;

        const rectX = player.x;
        const rectY = player.y - player.height;
        const rectW = player.width;
        const rectH = player.height;

        return (
            rectX < this.x + this.size &&
            rectX + rectW > this.x &&
            rectY < this.y + this.size &&
            rectY + rectH > this.y
        );
    }

    draw() {
        if (!this.active) return;

        ctx.save();

        // shadow
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(this.x, this.y + this.z, this.size, this.size);

        // square
        ctx.fillStyle = "cyan";
        ctx.fillRect(this.x, this.y, this.size, this.size);

        ctx.restore();
    }
}

class SawBlades extends Obstacle {
    constructor(radius = 50, speed = 6) {
        super(0, 0);

        this.radius = radius;
        this.speed = speed;

        this.angle = 0;

        this.blades = [
            { x: canvas.width / 4, y: canvas.height / 4 },
            { x: canvas.width * 3 / 4, y: canvas.height / 4 },
            { x: canvas.width / 4, y: canvas.height * 3 / 4 },
            { x: canvas.width * 3 / 4, y: canvas.height * 3 / 4 }
        ];

        this.z = 30;
    }

    // ─── update ─────────────────────────────────────────
    update(dt) {
        this.angle += this.speed * dt;
    }

    // ─── collision ──────────────────────────────────────
    checkCollision() {
        if (!this.active) return false;
        if (player.z > 0) return false;

        const px = player.x + player.width / 2;
        const py = player.y - player.height / 2;

        for (const blade of this.blades) {

            const dx = px - blade.x;
            const dy = py - blade.y;

            if (dx * dx + dy * dy <= this.radius * this.radius) {
                return true;
            }
        }

        return false;
    }

    // ─── draw one blade ─────────────────────────────────
    drawBlade(x, y) {

        const teeth = 10;
        const inner = this.radius * 0.6;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.angle);

        // saw blade
        ctx.beginPath();

        for (let i = 0; i < teeth * 2; i++) {

            const r = (i % 2 === 0) ? this.radius : inner;
            const a = (i / (teeth * 2)) * Math.PI * 2;

            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;

            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }

        ctx.closePath();

        ctx.fillStyle = "#b0b0b0";
        ctx.fill();

        ctx.restore();
    }

    // ─── draw ───────────────────────────────────────────
    draw() {
        if (!this.active) return;

        for (const blade of this.blades) {
            this.drawBlade(blade.x, blade.y);
        }
    }
}

class Rain extends Obstacle {
    constructor(count = 12, speed = 40) {
        super(0, 0);

        this.speed = speed;
        this.dropHeight = 12;
        this.dropWidth = 8;

        this.drops = [];

        for (let i = 0; i < count; i++) {
            this.drops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height
            });
        }
    }

    // ─── update ─────────────────────────────────────────
    update(dt) {
        for (const drop of this.drops) {

            drop.y += this.speed * dt;

            if (drop.y > canvas.height) {
                drop.y = -20;
                drop.x = Math.random() * canvas.width;
            }

        }
    }

    // ─── collision ──────────────────────────────────────
    checkCollision() {
        if (player.keys.ShiftLeft || player.z > 0) return false;

        const rectX = player.x;
        const rectY = player.y - player.height;
        const rectW = player.width;
        const rectH = player.height;

        for (const drop of this.drops) {

            const overlap =
                rectX < drop.x + this.dropWidth &&
                rectX + rectW > drop.x &&
                rectY < drop.y + this.dropHeight &&
                rectY + rectH > drop.y;

            if (overlap) return true;
        }

        return false;
    }

    // ─── draw ───────────────────────────────────────────
    draw() {

        ctx.save();

        for (const drop of this.drops) {

            // shadow
            ctx.fillStyle = "rgba(0,0,0,0.2)";
            ctx.fillRect(
                drop.x,
                drop.y + 10,
                this.dropWidth,
                this.dropHeight
            );

            // drop
            ctx.fillStyle = "lightblue";
            ctx.fillRect(
                drop.x,
                drop.y,
                this.dropWidth,
                this.dropHeight
            );

        }

        ctx.restore();
    }
}

class Zone extends Obstacle {
    constructor(warningTime = 2, activeTime = 0.5) {
        super(0, 0);

        this.timer = 0;
        this.warningTime = warningTime; // duration of warning
        this.activeTime = activeTime;   // duration zone is active
        this.cycleTime = 3;             // total cycle time

        this.zone = null;
        this.edge = null;

        this.spawn();
    }

    spawn() {
        this.timer = 0;

        const edges = ["left", "right", "top", "bottom"];
        this.edge = edges[Math.floor(Math.random() * edges.length)];

        const zoneSize = (this.edge === "left" || this.edge === "right") ? canvas.width / 3 : canvas.height / 3;

        switch (this.edge) {
            case "left":
                this.x = 0;
                this.y = 0;
                this.width = zoneSize;
                this.height = canvas.height;
                break;
            case "right":
                this.x = canvas.width - zoneSize;
                this.y = 0;
                this.width = zoneSize;
                this.height = canvas.heightH;
                break;
            case "top":
                this.x = 0;
                this.y = 0;
                this.width = canvas.width;
                this.height = zoneSize;
                break;
            case "bottom":
                this.x = 0;
                this.y = canvas.height - zoneSize;
                this.width = canvas.width;
                this.height = zoneSize;
                break;
        }

        this.zone = { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    update(dt) {
        this.timer += dt;

        if (this.timer >= this.cycleTime) {
            this.spawn();
        }
    }

    checkCollision() {
        if (!this.active) return false;
        if (player.z > 0) return false;

        // only dangerous after warning
        if (this.timer < this.warningTime || this.timer > this.warningTime + this.activeTime) {
            return false;
        }

        const rectX = player.x;
        const rectY = player.y - player.height;
        const rectW = player.width;
        const rectH = player.height;

        const zone = this.zone;

        return (
            rectX < zone.x + zone.width &&
            rectX + rectW > zone.x &&
            rectY < zone.y + zone.height &&
            rectY + rectH > zone.y
        );
    }

    draw() {
        if (!this.active) return;

        ctx.save();

        // warning phase
        if (this.timer < this.warningTime) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.35)";
            ctx.fillRect(this.zone.x, this.zone.y, this.zone.width, this.zone.height);
        } else if (this.timer <= this.warningTime + this.activeTime) {
            ctx.fillStyle = "rgb(255, 0, 0)";
            ctx.fillRect(this.zone.x, this.zone.y, this.zone.width, this.zone.height);
        }

        ctx.restore();
    }
}