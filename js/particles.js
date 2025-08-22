
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const clusterCount = 25;
    const particlesPerCluster = 20;
    let allParticles = [];
    let connections = [];
    let sparks = [];

    // --- Spark Class ---
    class Spark {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 3;
            this.vy = (Math.random() - 0.5) * 3;
            this.lifetime = Math.random() * 100 + 50;
            this.age = 0;
            this.size = Math.random() * 2 + 1;
        }

        update(delta) {
            this.age += delta;
            this.x += this.vx;
            this.y += this.vy;
        }

        draw() {
            const opacity = 1 - (this.age / this.lifetime);
                                                ctx.fillStyle = `rgba(250, 0, 0, ${opacity})`; // Red
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }
    }

    // --- Particle Class ---
    class Particle {
        constructor(cluster) {
            this.cluster = cluster;
            this.x = Math.random() * 150 - 75;
            this.y = Math.random() * 150 - 75;
            this.glitchX = 0;
            this.glitchY = 0;
            this.lit = false;
            this.litTime = 0;
        }

        get screenX() {
            return this.cluster.x + this.x + this.glitchX;
        }

        get screenY() {
            return this.cluster.y + this.y + this.glitchY;
        }

        draw() {
                                                ctx.fillStyle = this.lit ? '#FA0000' : '#333333'; // Red or Charcoal
            ctx.fillRect(this.screenX, this.screenY, 2, 2);
        }

        update(delta) {
            // Glitch effect
            if (Math.random() < 0.05) {
                this.glitchX = (Math.random() - 0.5) * 4;
                this.glitchY = (Math.random() - 0.5) * 4;
            } else {
                this.glitchX = 0;
                this.glitchY = 0;
            }

            if (this.lit) {
                this.litTime -= delta;
                if (this.litTime <= 0) {
                    this.lit = false;
                }
            }
        }
    }

    // --- Cluster Class ---
    class Cluster {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.lifetime = Math.random() * 20000 + 15000;
            this.age = 0;
            this.particles = [];
            this.staticConnections = [];

            for (let i = 0; i < particlesPerCluster; i++) {
                const p = new Particle(this);
                this.particles.push(p);
                allParticles.push(p);
            }

            // Create static connections within the cluster
            for (let i = 0; i < this.particles.length; i++) {
                const p1 = this.particles[i];
                const p2 = this.particles[(i + 1) % this.particles.length];
                const p3 = this.particles[(i + 2) % this.particles.length];
                this.staticConnections.push([p1, p2]);
                this.staticConnections.push([p1, p3]);
            }
        }

        update(delta) {
            this.age += delta;
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

            this.particles.forEach(p => p.update(delta));
        }

        draw() {
            this.drawStaticConnections();
            this.particles.forEach(p => p.draw());
        }

        drawStaticConnections() {
            ctx.strokeStyle = 'rgba(51, 51, 51, 0.1)';
            ctx.lineWidth = 1;
            ctx.setLineDash([]); // Solid lines

            this.staticConnections.forEach(conn => {
                const p1 = conn[0];
                const p2 = conn[1];
                ctx.beginPath();
                ctx.moveTo(p1.screenX, p1.screenY);
                ctx.lineTo(p2.screenX, p2.screenY);
                ctx.stroke();
            });
        }
    }

    // --- Connection Class ---
    class Connection {
        constructor(p1, p2) {
            this.p1 = p1;
            this.p2 = p2;
            this.lifetime = 600;
            this.age = 0;
        }

        update(delta) {
            this.age += delta;
        }

        draw() {
            const opacity = 0.8 - (this.age / this.lifetime);
            const p1 = this.p1;
            const p2 = this.p2;

            ctx.beginPath();
            ctx.moveTo(p1.screenX, p1.screenY);
            ctx.lineTo(p2.screenX, p2.screenY);
            
            const isLit = p1.lit && p2.lit;
                                                ctx.strokeStyle = isLit ? `rgba(250, 0, 0, ${opacity})` : `rgba(51, 51, 51, ${opacity * 0.5})`;
            ctx.lineWidth = 1;
            ctx.setLineDash([1, 3]);
            ctx.stroke();
            ctx.setLineDash([]); // Reset
        }
    }

    let clusters = [];
    function init() {
        allParticles = [];
        clusters = [];
        for (let i = 0; i < clusterCount; i++) {
            clusters.push(new Cluster());
        }
    }

    function triggerPulse(editSize) {
        const initiator = allParticles[Math.floor(Math.random() * allParticles.length)];
        if (initiator) {
            initiator.lit = true;
            initiator.litTime = 600;

            // Create sparks
            for (let i = 0; i < 5; i++) {
                sparks.push(new Spark(initiator.screenX, initiator.screenY));
            }

                        const numConnections = Math.min(Math.floor(Math.abs(editSize) / 50), 5) + 1;
            for (let i = 0; i < numConnections; i++) {
                const partner = allParticles[Math.floor(Math.random() * allParticles.length)];
                if (partner && partner !== initiator) {
                    setTimeout(() => {
                        partner.lit = true;
                        partner.litTime = 600;
                        connections.push(new Connection(initiator, partner));
                    }, Math.random() * 300);
                }
            }
        }
    }

    const eventSource = new EventSource('https://stream.wikimedia.org/v2/stream/recentchange');
    eventSource.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.length) {
            const editSize = data.length.new - data.length.old;
            triggerPulse(editSize);
        }
    };

    let lastTime = 0;
    function animate(time) {
        const delta = time - lastTime;
        lastTime = time;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        clusters.forEach((c, i) => {
            c.update(delta);
            if (c.age > c.lifetime) {
                c.particles.forEach(p => {
                    const index = allParticles.indexOf(p);
                    if (index > -1) allParticles.splice(index, 1);
                });
                clusters[i] = new Cluster();
            }
            c.draw();
        });

        connections.forEach((conn, i) => {
            conn.update(delta);
            if (conn.age > conn.lifetime) {
                connections.splice(i, 1);
            } else {
                conn.draw();
            }
        });
        
        sparks.forEach((spark, i) => {
            spark.update(delta);
            if (spark.age > spark.lifetime) {
                sparks.splice(i, 1);
            } else {
                spark.draw();
            }
        });

        requestAnimationFrame(animate);
    }

    init();
    requestAnimationFrame(animate);
});
