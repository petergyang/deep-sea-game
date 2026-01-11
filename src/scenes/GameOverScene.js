export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.victory = data.victory || false;
    }

    create() {
        const { width, height } = this.cameras.main;

        // Create background based on victory/defeat
        if (this.victory) {
            this.createVictoryBackground();
        } else {
            this.createBackground();
        }

        // Retro scanlines
        this.createScanlines();

        // Floating particles
        this.bubbles = [];
        for (let i = 0; i < 15; i++) {
            if (this.victory) {
                this.createSparkle();
            } else {
                this.createBubble();
            }
        }

        if (this.victory) {
            // VICTORY text
            const victoryShadow = this.add.text(width / 2 + 4, height / 5 + 4, 'VICTORY!', {
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: '72px',
                color: '#000000'
            }).setOrigin(0.5).setAlpha(0.5);

            const victoryText = this.add.text(width / 2, height / 5, 'VICTORY!', {
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: '72px',
                color: '#00ff88',
                stroke: '#006633',
                strokeThickness: 6
            }).setOrigin(0.5);

            // Rainbow color cycle for victory
            let hue = 0;
            this.time.addEvent({
                delay: 30,
                loop: true,
                callback: () => {
                    hue = (hue + 3) % 360;
                    const color = Phaser.Display.Color.HSLToColor(hue / 360, 1, 0.6);
                    victoryText.setColor(Phaser.Display.Color.RGBToString(color.r, color.g, color.b));
                }
            });

            // Pulsing animation
            this.tweens.add({
                targets: [victoryText, victoryShadow],
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 600,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // Show diver with treasure
            if (this.textures.exists('diver')) {
                const diver = this.add.sprite(width / 2, height / 2 - 30, 'diver')
                    .setScale(1.5)
                    .setDepth(10);
                if (this.anims.exists('diver-swim')) {
                    diver.play('diver-swim');
                }
                // Happy bounce
                this.tweens.add({
                    targets: diver,
                    y: height / 2 - 50,
                    duration: 500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }

            // Treasure message
            this.add.text(width / 2, height / 2 + 50, 'THE OCEAN IS SAFE!', {
                fontFamily: 'Courier New, monospace',
                fontSize: '20px',
                color: '#ffff00'
            }).setOrigin(0.5);

        } else {
            // GAME OVER text - retro arcade style
            const gameOverShadow = this.add.text(width / 2 + 4, height / 5 + 4, 'GAME OVER', {
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: '72px',
                color: '#000000'
            }).setOrigin(0.5).setAlpha(0.5);

            const gameOverText = this.add.text(width / 2, height / 5, 'GAME OVER', {
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: '72px',
                color: '#ff0000',
                stroke: '#660000',
                strokeThickness: 6
            }).setOrigin(0.5);

            // Pulsing/glitch animation
            this.tweens.add({
                targets: [gameOverText, gameOverShadow],
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Score label
        this.add.text(width / 2, height / 2 - 50, 'FINAL SCORE', {
            fontFamily: 'Courier New, monospace',
            fontSize: '24px',
            color: '#88ffff'
        }).setOrigin(0.5);

        // Score display - arcade style with leading zeros
        const scoreText = this.add.text(width / 2, height / 2 + 10, '000000', {
            fontFamily: 'Courier New, monospace',
            fontSize: '64px',
            color: '#ffff00',
            stroke: '#666600',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Animate score counting up
        let displayScore = 0;
        const scoreIncrement = Math.max(1, Math.ceil(this.finalScore / 50));
        this.time.addEvent({
            delay: 30,
            repeat: Math.min(50, this.finalScore),
            callback: () => {
                displayScore += scoreIncrement;
                displayScore = Math.min(displayScore, this.finalScore);
                scoreText.setText(displayScore.toString().padStart(6, '0'));
            }
        });

        // High score check
        const highScore = parseInt(localStorage.getItem('dragonHighScore') || 0);
        if (this.finalScore > highScore && this.finalScore > 0) {
            localStorage.setItem('dragonHighScore', this.finalScore);

            const newRecord = this.add.text(width / 2, height / 2 + 80, 'NEW HIGH SCORE!', {
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: '32px',
                color: '#00ff00',
                stroke: '#006600',
                strokeThickness: 3
            }).setOrigin(0.5);

            // Rainbow flash for new record
            let hue = 0;
            this.time.addEvent({
                delay: 50,
                loop: true,
                callback: () => {
                    hue = (hue + 5) % 360;
                    const color = Phaser.Display.Color.HSLToColor(hue / 360, 1, 0.5);
                    newRecord.setColor(Phaser.Display.Color.RGBToString(color.r, color.g, color.b));
                }
            });
        } else {
            this.add.text(width / 2, height / 2 + 80, `HIGH SCORE: ${highScore.toString().padStart(6, '0')}`, {
                fontFamily: 'Courier New, monospace',
                fontSize: '20px',
                color: '#ff00ff'
            }).setOrigin(0.5);
        }

        // Retro buttons
        const playAgainBtn = this.createRetroButton(width / 2, height * 0.72, 'PLAY AGAIN');
        const menuBtn = this.createRetroButton(width / 2, height * 0.72 + 55, 'MAIN MENU');

        playAgainBtn.on('pointerdown', () => {
            this.cameras.main.flash(200, 255, 255, 255);
            this.time.delayedCall(200, () => {
                this.cameras.main.fadeOut(300);
                this.time.delayedCall(300, () => {
                    this.scene.start('GameScene');
                });
            });
        });

        menuBtn.on('pointerdown', () => {
            this.cameras.main.flash(200, 255, 255, 255);
            this.time.delayedCall(200, () => {
                this.cameras.main.fadeOut(300);
                this.time.delayedCall(300, () => {
                    this.scene.start('MenuScene');
                });
            });
        });

        // Stats display
        this.add.text(width / 2, height - 40, 'PRESS ANY KEY TO CONTINUE', {
            fontFamily: 'Courier New, monospace',
            fontSize: '14px',
            color: '#666666'
        }).setOrigin(0.5);

        // Keyboard to restart
        this.input.keyboard.on('keydown', () => {
            this.cameras.main.flash(200, 255, 255, 255);
            this.time.delayedCall(200, () => {
                this.scene.start('GameScene');
            });
        });

        // Fade in
        this.cameras.main.fadeIn(500);
    }

    createBackground() {
        const { width, height } = this.cameras.main;
        const graphics = this.add.graphics();

        // Dark moody gradient - same as menu
        for (let y = 0; y < height; y++) {
            const ratio = y / height;
            const r = Math.floor(5 + ratio * 15);
            const g = Math.floor(0 + ratio * 20);
            const b = Math.floor(20 + ratio * 40);
            graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
            graphics.fillRect(0, y, width, 1);
        }
    }

    createScanlines() {
        const { width, height } = this.cameras.main;
        const graphics = this.add.graphics();
        graphics.setDepth(100);
        graphics.setAlpha(0.1);

        for (let y = 0; y < height; y += 4) {
            graphics.fillStyle(0x000000);
            graphics.fillRect(0, y, width, 2);
        }
    }

    createBubble() {
        const { width, height } = this.cameras.main;
        const x = Phaser.Math.Between(0, width);
        const y = Phaser.Math.Between(height, height + 200);
        const size = Phaser.Math.Between(2, 6);
        const alpha = Phaser.Math.FloatBetween(0.1, 0.3);

        const graphics = this.add.graphics();
        graphics.fillStyle(0xff4444, alpha);
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

    createRetroButton(x, y, text) {
        const btn = this.add.text(x, y, text, {
            fontFamily: 'Courier New, monospace',
            fontSize: '24px',
            color: '#00ffff',
            backgroundColor: '#003333',
            padding: { x: 30, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => {
            btn.setStyle({
                color: '#ffff00',
                backgroundColor: '#666600'
            });
        });

        btn.on('pointerout', () => {
            btn.setStyle({
                color: '#00ffff',
                backgroundColor: '#003333'
            });
        });

        return btn;
    }

    createVictoryBackground() {
        const { width, height } = this.cameras.main;
        const graphics = this.add.graphics();

        // Golden/celebratory gradient - bright and victorious
        for (let y = 0; y < height; y++) {
            const ratio = y / height;
            const r = Math.floor(20 + ratio * 30);
            const g = Math.floor(40 + ratio * 60);
            const b = Math.floor(60 + ratio * 40);
            graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
            graphics.fillRect(0, y, width, 1);
        }
    }

    createSparkle() {
        const { width, height } = this.cameras.main;
        const x = Phaser.Math.Between(0, width);
        const y = Phaser.Math.Between(height, height + 200);
        const size = Phaser.Math.Between(3, 8);

        const graphics = this.add.graphics();

        // Draw a star/sparkle shape
        const color = Phaser.Math.RND.pick([0xffff00, 0xffd700, 0xffffff, 0x00ff88]);
        graphics.fillStyle(color, Phaser.Math.FloatBetween(0.3, 0.8));

        // Simple diamond sparkle
        graphics.beginPath();
        graphics.moveTo(0, -size);
        graphics.lineTo(size * 0.3, 0);
        graphics.lineTo(0, size);
        graphics.lineTo(-size * 0.3, 0);
        graphics.closePath();
        graphics.fillPath();

        graphics.setPosition(x, y);
        graphics.setDepth(5);

        // Float upward with slight wobble
        this.tweens.add({
            targets: graphics,
            y: -50,
            x: x + Phaser.Math.Between(-50, 50),
            alpha: 0,
            duration: Phaser.Math.Between(3000, 6000),
            ease: 'Linear',
            onComplete: () => {
                graphics.destroy();
                this.createSparkle();
            }
        });

        this.bubbles.push(graphics);
    }
}
