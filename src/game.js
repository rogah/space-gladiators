import { CanvasRenderer, Container, Graphics } from 'pixi.js';
import { World, Body, Box, Circle } from 'p2';
import { Howl } from 'howler';
import range from 'lodash/range';

export default class Game {
    viewPort = {
        width: 1280,
        height: 720,
    }

    constructor() {
        const { width, height } = this.viewPort;

        this.renderer = new CanvasRenderer(width, height);
        document.body.appendChild(this.renderer.view);

        this.stage = new Container();

        this.world = new World({
            gravity: [0, 0],
        });

        this.speed = 1000;
        this.turnSpeed = 2;

        window.addEventListener('keydown', (event) => {
            this.handleKeys(event.keyCode, true);
        }, false);

        window.addEventListener('keyup', (event) => {
            this.handleKeys(event.keyCode, false);
        }, false);

        this.enemyBodies = [];
        this.enemyGraphics = [];
        this.removeObjects = [];
    }

    setupAudio = () => {
        this.sounds = new Howl({
            src: ['sounds.mp3', 'sounds.ogg'],
            sprite: {
                boom1: [0, 636],
                boom2: [2000, 2274],
                boom3: [5000, 3056],
            },
        });

        this.music = new Howl({
            src: ['music.mp3', 'music.ogg'],
            buffer: true,
            autoplay: true,
            volume: 0.7,
        });
    }

    drawStars = () => {
        const { width, height } = this.viewPort;

        range(1500).forEach(() => {
            const x = Math.round(Math.random() * width);
            const y = Math.round(Math.random() * height);
            const rad = Math.ceil(Math.random() * 2);
            const alpha = Math.min(Math.random() + 0.25, 1);

            // Draw the star.
            const star = new Graphics();
            star.beginFill(0xFFFFFF, alpha);
            star.drawCircle(x, y, rad);
            star.endFill();

            // Attach the star to the stage.
            this.stage.addChild(star);
        });
    }

    setupBoundaries = () => {
        const { width, height } = this.viewPort;

        const walls = new Graphics();
        walls.beginFill(0xFFFFFF, 0.5);
        walls.drawRect(0, 0, width, 10);
        walls.drawRect(width - 10, 10, 10, height - 20);
        walls.drawRect(0, height - 10, width, 10);
        walls.drawRect(0, 10, 10, height - 20);

        // Attach the walls to the stage.
        this.stage.addChild(walls);
    }

    createShip = () => {
        const { width, height } = this.viewPort;

        this.ship = new Body({
            mass: 1,
            angularVelocity: 0,
            damping: 0,
            angularDamping: 0,
            position: [
                Math.round(width / 2),
                Math.round(height / 2),
            ],
        });

        this.shipShape = new Box({ width: 52, height: 69 });
        this.ship.addShape(this.shipShape);
        this.world.addBody(this.ship);

        const shipGraphics = new Graphics();
        shipGraphics.beginFill(0x20d3fe);
        shipGraphics.moveTo(0, 0);
        shipGraphics.lineTo(-26, 60);
        shipGraphics.lineTo(26, 60);
        shipGraphics.endFill();

        shipGraphics.beginFill(0x149d1);
        shipGraphics.drawRect(-15, 60, 30, 8);
        shipGraphics.endFill();

        this.shipGraphics = shipGraphics;

        // Attach the walls to the stage.
        this.stage.addChild(this.shipGraphics);
    }

    createEnemies = () => {
        const { width, height } = this.viewPort;

        // create random interval to generate new enemies.
        this.enemyTimer = setInterval(() => {
            // create enemy physics body
            const x = Math.round(Math.random() * width);
            const y = Math.round(Math.random() * height);

            const vx = (Math.random() - 0.5) * this.speed;
            const vy = (Math.random() - 0.5) * this.speed;
            const va = (Math.random() - 0.5) * this.speed;

            const enemyBody = new Body({
                position: [x, y],
                mass: 1,
                damping: 0,
                angularDamping: 0,
                velocity: [vx, vy],
                angularVelocity: va,
            });

            const enemyShape = new Circle({ radius: 20 });
            enemyShape.sensor = true;
            enemyBody.addShape(enemyShape);
            this.world.addBody(enemyBody);

            // create enemy graphics
            const enemyGraphics = new Graphics();
            enemyGraphics.beginFill(0x38d41a);
            enemyGraphics.drawCircle(0, 0, 20);
            enemyGraphics.endFill();
            enemyGraphics.beginFill(0x2aff00);
            enemyGraphics.lineStyle(1, 0x239d0b, 1);
            enemyGraphics.drawCircle(0, 0, 10);
            enemyGraphics.endFill();

            this.stage.addChild(enemyGraphics);

            this.enemyBodies.push(enemyBody);
            this.enemyGraphics.push(enemyGraphics);
        }, 1000);

        this.world.on('beginContact', (event) => {
            if (event.bodyB.id === this.ship.id) {
                console.log('Boom!');
                this.removeObjects.push(event.bodyA);
            }
        });
    }

    handleKeys = (keyCode, state) => {
        if (keyCode === 65) { // A
            this.keyLeft = state;
        } else if (keyCode === 68) { // D
            this.keyRight = state;
        } else if (keyCode === 87) { // W
            this.keyUp = state;
        }
    }

    updatePhysics = () => {
        const { width, height } = this.viewPort;

        // update the ship's angular velocities for rotation.
        if (this.keyLeft) {
            this.ship.angularVelocity = -1 * this.turnSpeed;
        } else if (this.keyRight) {
            this.ship.angularVelocity = this.turnSpeed;
        } else {
            this.ship.angularVelocity = 0;
        }

        // apply force vector to ship.
        if (this.keyUp) {
            const angle = this.ship.angle + (Math.PI / 2);
            this.ship.force[0] -= this.speed * Math.cos(angle);
            this.ship.force[1] -= this.speed * Math.sin(angle);
        }

        // update the position of the graphics based on the physics simulation.
        this.shipGraphics.x = this.ship.position[0];
        this.shipGraphics.y = this.ship.position[1];
        this.shipGraphics.rotation = this.ship.angle;

        if (this.ship.position[0] > width) {
            this.ship.position[0] = 0;
        } else if (this.ship.position[0] < 0) {
            this.ship.position[0] = width;
        }

        if (this.ship.position[1] > height) {
            this.ship.position[1] = 0;
        } else if (this.ship.position[1] < 0) {
            this.ship.position[1] = height;
        }

        // update enemy positions.
        this.enemyBodies.forEach((enemyBody, index) => {
            this.enemyGraphics[index].x = enemyBody.position[0];
            this.enemyGraphics[index].y = enemyBody.position[1];
        });

        // step the physics simulation forward.
        this.world.step(1 / 60);

        // remove enemy bodies.
        this.removeObjects.forEach((removeObject) => {
            this.world.removeBody(removeObject);
            const index = this.enemyBodies.indexOf(removeObject);
            if (index > -1) {
                this.enemyBodies.splice(index, 1);
                this.stage.removeChild(this.enemyGraphics[index]);
                this.enemyGraphics.splice(index, 1);
            }

            // play random boom sound.
            this.sounds.play(`boom${Math.ceil(Math.random() * 3)}`);
        });
        this.removeObjects.length = 0;
    }

    tick = () => {
        this.updatePhysics();
        this.renderer.render(this.stage);
        requestAnimationFrame(() => this.tick());
    }

    start = () => {
        this.drawStars();
        this.setupBoundaries();
        this.createShip();
        this.createEnemies();
        this.setupAudio();
        requestAnimationFrame(() => this.tick());
    }
}
