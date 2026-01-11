export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Create retro gradient background
        this.createBackground();

        // Create animated sea floor
        this.createSeaFloor();

        // Create floating bubbles
        this.bubbles = [];
        for (let i = 0; i < 20; i++) {
            this.createBubble();
        }

        // Retro scanlines effect
        this.createScanlines();

        // Main title - retro arcade style
        const titleShadow = this.add.text(width / 2 + 4, height / 5 + 4, 'DEEP SEA', {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '72px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.5);

        const title = this.add.text(width / 2, height / 5, 'DEEP SEA', {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '72px',
            color: '#00ffff',
            stroke: '#004466',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Subtitle
        const subtitle = this.add.text(width / 2, height / 5 + 70, 'HUNTER', {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '56px',
            color: '#ff6600',
            stroke: '#662200',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Show diver sprite
        if (this.textures.exists('diver')) {
            this.diver = this.add.sprite(width * 0.25, height / 2, 'diver')
                .setScale(1.5)
                .setDepth(10);
            if (this.anims.exists('diver-swim')) {
                this.diver.play('diver-swim');
            }
            // Floating animation
            this.tweens.add({
                targets: this.diver,
                y: height / 2 + 20,
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Show shark sprite (enemy preview)
        if (this.textures.exists('shark')) {
            this.shark = this.add.sprite(width * 0.75, height / 2, 'shark')
                .setScale(3)
                .setFlipX(true)
                .setDepth(10);
            if (this.anims.exists('shark-swim')) {
                this.shark.play('shark-swim');
            }
            // Menacing movement
            this.tweens.add({
                targets: this.shark,
                x: width * 0.75 - 30,
                y: height / 2 + 15,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // VS text between diver and shark
        this.add.text(width / 2, height / 2, 'VS', {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '48px',
            color: '#ff0000',
            stroke: '#660000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(15);

        // Blinking "PRESS START" text - classic arcade style
        const startText = this.add.text(width / 2, height * 0.72, 'CLICK TO START', {
            fontFamily: 'Courier New, monospace',
            fontSize: '28px',
            color: '#ffff00'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: startText,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Instructions
        this.add.text(width / 2, height * 0.82, 'ARROWS/WASD: MOVE    SPACE: FIRE', {
            fontFamily: 'Courier New, monospace',
            fontSize: '16px',
            color: '#88ffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.87, 'TOUCH: MOVE & AUTO-FIRE', {
            fontFamily: 'Courier New, monospace',
            fontSize: '14px',
            color: '#88ffff'
        }).setOrigin(0.5);

        // High score display - arcade style
        const highScore = localStorage.getItem('dragonHighScore') || 0;
        this.add.text(width / 2, height - 50, `HIGH SCORE: ${highScore.toString().padStart(6, '0')}`, {
            fontFamily: 'Courier New, monospace',
            fontSize: '20px',
            color: '#ff00ff'
        }).setOrigin(0.5);

        // Copyright/credit line
        this.add.text(width / 2, height - 25, '2024 RETRO ARCADE', {
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            color: '#666666'
        }).setOrigin(0.5);

        // Click anywhere to start
        this.input.on('pointerdown', () => {
            this.cameras.main.flash(200, 255, 255, 255);
            this.time.delayedCall(200, () => {
                this.cameras.main.fadeOut(300);
                this.time.delayedCall(300, () => {
                    this.scene.start('GameScene');
                });
            });
        });

        // Pulsing animation for title
        this.tweens.add({
            targets: [title, titleShadow],
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Subtitle color cycle
        let hue = 0;
        this.time.addEvent({
            delay: 50,
            loop: true,
            callback: () => {
                hue = (hue + 2) % 360;
                const color = Phaser.Display.Color.HSLToColor(hue / 360, 1, 0.5);
                subtitle.setColor(Phaser.Display.Color.RGBToString(color.r, color.g, color.b));
            }
        });

        // Fade in
        this.cameras.main.fadeIn(500);
    }

    createBackground() {
        const { width, height } = this.cameras.main;
        const graphics = this.add.graphics();

        // Deep ocean gradient - darker, more dramatic
        for (let y = 0; y < height; y++) {
            const ratio = y / height;
            const r = Math.floor(0 + ratio * 10);
            const g = Math.floor(10 + ratio * 30);
            const b = Math.floor(30 + ratio * 70);
            graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
            graphics.fillRect(0, y, width, 1);
        }
    }

    createSeaFloor() {
        const { width, height } = this.cameras.main;

        // Use bg-sand if available, otherwise draw simple floor
        if (this.textures.exists('bg-sand')) {
            this.add.tileSprite(0, height, width, 192, 'bg-sand')
                .setOrigin(0, 1)
                .setScale(2)
                .setAlpha(0.5)
                .setDepth(1);
        }
    }

    createBubble() {
        const { width, height } = this.cameras.main;
        const x = Phaser.Math.Between(0, width);
        const y = Phaser.Math.Between(height, height + 200);
        const size = Phaser.Math.Between(2, 8);
        const alpha = Phaser.Math.FloatBetween(0.1, 0.4);

        const graphics = this.add.graphics();
        graphics.fillStyle(0x44aaff, alpha);
        graphics.fillCircle(0, 0, size);
        graphics.setPosition(x, y);
        graphics.setDepth(5);

        this.tweens.add({
            targets: graphics,
            y: -50,
            x: x + Phaser.Math.Between(-30, 30),
            duration: Phaser.Math.Between(5000, 10000),
            ease: 'Linear',
            onComplete: () => {
                graphics.destroy();
                this.createBubble();
            }
        });

        this.bubbles.push(graphics);
    }

    createScanlines() {
        const { width, height } = this.cameras.main;
        const graphics = this.add.graphics();
        graphics.setDepth(100);
        graphics.setAlpha(0.08);

        // Create retro CRT scanlines
        for (let y = 0; y < height; y += 4) {
            graphics.fillStyle(0x000000);
            graphics.fillRect(0, y, width, 2);
        }
    }
}
