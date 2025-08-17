
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');
    const baseOpacity = 0.4;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const clusterCount = 15;
    const particlesPerCluster = 10;
    let allParticles = [];
    let connections = [];

    class Particle {
        constructor(cluster) {
            this.cluster = cluster;
            this.x = Math.random() * 100 - 50;
            this.y = Math.random() * 100 - 50;
            this.hue = Math.random() * 20; // Red hues
            this.opacity = Math.random() * 0.3 + 0.1;
            this.lit = false;
            this.litTime = 0;
        }

        get screenX() {
            return this.cluster.x + this.x;
        }

        get screenY() {
            return this.cluster.y + this.y;
        }

        draw(clusterOpacity) {
            let currentOpacity = this.opacity * clusterOpacity;
            let color = `hsla(${this.hue}, 100%, 50%, ${currentOpacity})`; // Red color
            if (this.lit) {
                const litProgress = this.litTime / 600;
                const litOpacity = Math.sin(litProgress * Math.PI) * 0.7;
                color = `hsla(${this.hue}, 100%, 80%, ${litOpacity})`; // Brighter red
            }
            ctx.fillStyle = color;
            ctx.fillRect(this.screenX, this.screenY, 1.5, 1.5);
        }

        update(delta) {
            if (this.lit) {
                this.litTime -= delta;
                if (this.litTime <= 0) {
                    this.lit = false;
                }
            }
        }
    }

    class Cluster {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.lifetime = Math.random() * 12000 + 8000;
            this.age = 0;
            this.particles = [];
            for (let i = 0; i < particlesPerCluster; i++) {
                const p = new Particle(this);
                this.particles.push(p);
                allParticles.push(p);
            }
        }

        update(delta) {
            this.age += delta;
            this.particles.forEach(p => p.update(delta));
        }

        draw() {
            const opacity = Math.sin(this.age / this.lifetime * Math.PI) * baseOpacity;
            this.particles.forEach(p => p.draw(opacity));
        }
    }

    class Connection {
        constructor(p1, p2) {
            this.p1 = p1;
            this.p2 = p2;
            this.lifetime = 500;
            this.age = 0;
        }

        update(delta) {
            this.age += delta;
        }

        draw() {
            const opacity = 0.5 - this.age / this.lifetime;
            const p1 = this.p1;
            const p2 = this.p2;

            ctx.beginPath();
            ctx.moveTo(p1.screenX, p1.screenY);
            ctx.lineTo(p2.screenX, p2.screenY);

            // Glow effect
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(255, 0, 0, ${opacity * 0.05})`; // Red glow
            ctx.stroke();

            ctx.lineWidth = 1;
            ctx.strokeStyle = `rgba(255, 50, 50, ${opacity * 0.1})`; // Red glow
            ctx.stroke();
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

            const numConnections = Math.min(Math.floor(Math.abs(editSize) / 50), 10) + 2;
            for (let i = 0; i < numConnections; i++) {
                const partner = allParticles[Math.floor(Math.random() * allParticles.length)];
                if (partner && partner !== initiator) {
                    setTimeout(() => {
                        partner.lit = true;
                        partner.litTime = 600;
                        connections.push(new Connection(initiator, partner));
                    }, Math.random() * 250);
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

        ctx.fillStyle = '#000000'; // Black background
        ctx.fillRect(0, 0, canvas.width, canvas.height);


        clusters.forEach((c, i) => {
            c.update(delta);
            if (c.age > c.lifetime) {
                c.particles.forEach(p => {
                    const index = allParticles.indexOf(p);
                    if (index > -1) {
                        allParticles.splice(index, 1);
                    }
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

        requestAnimationFrame(animate);
    }

    init();
    requestAnimationFrame(animate);
});
