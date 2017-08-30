import {
    CanvasRenderer,
    Container,
    Graphics,
    Texture,
    Sprite,
    Text,
} from 'pixi.js';
import { World, Body, Box, Circle } from 'p2';
import { Howl } from 'howler';
import range from 'lodash/range';

export default class Game {
    viewPort = {
        width: 1920,
        height: 1080,
    }

    score = [0, 0]

    constructor() {
        const { width, height } = this.viewPort;

        // Determine what player we are.
        this.player = parseInt(window.location.hash.replace('#', ''), 10);

        // make sure we maintain the aspect ratio.
        window.addEventListener('resize', () => {
            this.resize();
        }, false);

        // setup the background canvas.
        this.backgroundRender = new CanvasRenderer({
            width,
            height,
        });
        document.body.appendChild(this.backgroundRender.view);

        this.backgroundStage = new Container();

        // setup the rendering surface.
        this.renderer = new CanvasRenderer({
            width,
            height,
            transparent: true,
        });
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

    setupScores = () => {
        this.score = [0, 0];

        const score = [];

        // setup the score text for player 1.
        score[0] = new Text(this.score[0], {
            fontFamily: 'Arial',
            fontSize: '40px',
            fontStyle: 'bold',
            fill: 'cyan',
            alight: 'left',
        });
        score[0].x = 20;
        score[0].y = 1025;

        // setup the score text for player 1.
        score[1] = new Text(this.score[1], {
            fontFamily: 'Arial',
            fontSize: '40px',
            fontStyle: 'bold',
            fill: 'yellow',
            alight: 'right',
        });
        score[1].x = 1880;
        score[1].y = 1025;

        this.scoreGraphics = score;

        // Add the text to the stage.
        this.stage.addChild(score[0]);
        this.stage.addChild(score[1]);
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
            this.backgroundStage.addChild(star);
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
        this.backgroundStage.addChild(walls);
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

        const shipSize = {
            width: 52,
            height: 69,
        };

        this.shipShape = new Box(shipSize);
        this.ship.addShape(this.shipShape);
        this.world.addBody(this.ship);

        const shipGraphics = new Graphics();
        shipGraphics.beginFill(0x20d3fe);
        shipGraphics.moveTo(26, 0);
        shipGraphics.lineTo(0, 60);
        shipGraphics.lineTo(52, 60);
        shipGraphics.endFill();

        shipGraphics.beginFill(0x149d1);
        shipGraphics.drawRect(7, 60, 38, 8);
        shipGraphics.endFill();

        // Cache the ship to only use one draw call per tick.
        const shipCache = new CanvasRenderer({
            ...shipSize,
            transparent: true,
        });
        const shipStage = new Container();
        shipStage.addChild(shipGraphics);
        shipCache.render(shipStage);

        const shipTexture = Texture.fromCanvas(shipCache.view);
        this.shipGraphics = new Sprite(shipTexture);

        // Attach the walls to the stage.
        this.stage.addChild(this.shipGraphics);
    }

    createEnemies = () => {
        const { width, height } = this.viewPort;

        // create enemy graphics
        const enemyGraphics = new Graphics();
        enemyGraphics.beginFill(0x38d41a);
        enemyGraphics.drawCircle(20, 20, 20);
        enemyGraphics.endFill();
        enemyGraphics.beginFill(0x2aff00);
        enemyGraphics.lineStyle(1, 0x239d0b, 1);
        enemyGraphics.drawCircle(20, 20, 10);
        enemyGraphics.endFill();

        // create enemy cache.
        const enemyCache = new CanvasRenderer({
            width: 40,
            height: 40,
            transparent: true,
        });
        const enemyStage = new Container();
        enemyStage.addChild(enemyGraphics);
        enemyCache.render(enemyStage);

        const enemyTexture = Texture.fromCanvas(enemyCache.view);

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

            const enemySprite = new Sprite(enemyTexture);
            this.stage.addChild(enemySprite);

            this.enemyBodies.push(enemyBody);
            this.enemyGraphics.push(enemySprite);
        }, 1000);

        this.world.on('beginContact', (event) => {
            if (event.bodyB.id === this.ship.id) {
                this.removeObjects.push(event.bodyA);

                this.score[this.player] += 1;
                this.scoreGraphics[this.player].setText(this.score[this.player]);

                // play random boom sound.
                this.sounds.play(`boom${Math.ceil(Math.random() * 3)}`);
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
            const x = enemyBody.position[0];
            const y = enemyBody.position[1];

            const enemyGraphics = this.enemyGraphics[index];
            enemyGraphics.x = x;
            enemyGraphics.y = y;

            if (x < 0 || y < 0 || x > width || y > height) {
                this.removeObjects.push(enemyBody);
            }
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
        });
        this.removeObjects.length = 0;
    }

    resize = () => {
        const desiredRatio = 1080 / 1920;
        const clientWidth = document.body.clientWidth;
        const clientHeight = document.body.clientHeight;
        const currentRation = clientHeight / clientWidth;

        if (currentRation < desiredRatio) {
            this.backgroundRender.view.style.height = '100%';
            this.renderer.view.style.height = '100%';
            this.backgroundRender.view.style.width = 'auto';
            this.renderer.view.style.width = 'auto';
        } else {
            this.backgroundRender.view.style.width = '100%';
            this.renderer.view.style.width = '100%';
            this.backgroundRender.view.style.height = 'auto';
            this.renderer.view.style.height = 'auto';
        }
    }

    tick = () => {
        this.updatePhysics();
        this.renderer.render(this.stage);
        requestAnimationFrame(() => this.tick());
    }

    start = () => {
        this.resize();
        this.drawStars();

        this.setupBoundaries();
        this.backgroundRender.render(this.backgroundStage);

        this.createShip();
        this.createEnemies();
        this.setupAudio();
        this.setupScores();
        requestAnimationFrame(() => this.tick());
    }
}
