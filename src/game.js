import { CanvasRenderer, Container, Graphics } from 'pixi.js';
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

    tick = () => {
        this.renderer.render(this.stage);
        requestAnimationFrame(() => this.tick());
    }

    start = () => {
        this.drawStars();
        this.setupBoundaries();
        requestAnimationFrame(() => this.tick());
    }
}
