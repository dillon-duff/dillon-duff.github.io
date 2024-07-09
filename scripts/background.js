// background.js
let canvas, ctx;
let particles = [];
let flowField = [];
let cols, rows;
let scale = 20;
let noiseZ = 0;
let particleCount = 15;
let particleColor;

function setup() {
    canvas = document.getElementById('backgroundCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    cols = Math.floor(canvas.width / scale);
    rows = Math.floor(canvas.height / scale);

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    particleColor = color(228, 134, 68, 255);

    window.requestAnimationFrame(draw);
}

function draw() {
    ctx.fillStyle = 'rgba(240, 230, 210, 0.02)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    updateFlowField();
    updateParticles();

    window.requestAnimationFrame(draw);
}

function updateFlowField() {
    let yoff = 0;
    for (let y = 0; y < rows; y++) {
        let xoff = 0;
        for (let x = 0; x < cols; x++) {
            let index = x + y * cols;
            let angle = noise(xoff, yoff, noiseZ) * TWO_PI * 4;
            let v = p5.Vector.fromAngle(angle);
            v.setMag(1);
            flowField[index] = v;
            xoff += 0.1;
        }
        yoff += 0.1;
    }
    noiseZ += 0.001;
}

function updateParticles() {
    for (let particle of particles) {
        particle.follow(flowField);
        particle.update();
        particle.edges();
        particle.show();
    }
}

class Particle {
    constructor() {
        this.pos = createVector(random(canvas.width), random(canvas.height));
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        this.maxSpeed = 1;
        this.prevPos = this.pos.copy();
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    follow(vectors) {
        let x = Math.floor(this.pos.x / scale);
        let y = Math.floor(this.pos.y / scale);
        let index = x + y * cols;
        let force = vectors[index];
        this.applyForce(force);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    show() {
        ctx.strokeStyle = particleColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.prevPos.x, this.prevPos.y);
        ctx.lineTo(this.pos.x, this.pos.y);
        ctx.stroke();
        this.updatePrev();
    }

    updatePrev() {
        this.prevPos.x = this.pos.x;
        this.prevPos.y = this.pos.y;
    }

    edges() {
        if (this.pos.x > canvas.width) {
            this.pos.x = 0;
            this.updatePrev();
        }
        if (this.pos.x < 0) {
            this.pos.x = canvas.width;
            this.updatePrev();
        }
        if (this.pos.y > canvas.height) {
            this.pos.y = 0;
            this.updatePrev();
        }
        if (this.pos.y < 0) {
            this.pos.y = canvas.height;
            this.updatePrev();
        }
    }
}

function createVector(x, y) {
    return { x: x || 0, y: y || 0 };
}

function random(min, max) {
    if (max === undefined) {
        max = min;
        min = 0;
    }
    return Math.random() * (max - min) + min;
}

function color(r, g, b, a) {
    return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
}

const TWO_PI = Math.PI * 2;

function noise(x, y, z) {
    return (Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453) % 1;
}

window.onload = setup;
window.onresize = function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.floor(canvas.width / scale);
    rows = Math.floor(canvas.height / scale);
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
};