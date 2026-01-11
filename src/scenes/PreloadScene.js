export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        const { width, height } = this.cameras.main;

        // Loading bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            font: '20px Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x44aaff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // Load backgrounds
        this.load.image('bg-far', 'assets/backgrounds/bg-far.png');
        this.load.image('bg-mid', 'assets/backgrounds/bg-mid.png');
        this.load.image('bg-near', 'assets/backgrounds/bg-near.png');
        this.load.image('bg-sand', 'assets/backgrounds/bg-sand.png');

        // Load player - 560x80 = 7 frames of 80x80
        this.load.spritesheet('diver', 'assets/sprites/player/diver.png', {
            frameWidth: 80,
            frameHeight: 80
        });

        // Load enemies
        // Shark: 256x64 = 8 cols x 2 rows of 32x32
        this.load.spritesheet('shark', 'assets/sprites/enemies/shark.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        // Swordfish: 384x32 = 8 frames of 48x32
        this.load.spritesheet('swordfish', 'assets/sprites/enemies/swordfish.png', {
            frameWidth: 48,
            frameHeight: 32
        });
        // Angler: 256x64 = 8 cols x 2 rows of 32x32
        this.load.spritesheet('angler', 'assets/sprites/enemies/angler.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        // Jellyfish: 128x32 = 4 cols x 2 rows of 32x16
        this.load.spritesheet('jellyfish', 'assets/sprites/enemies/jellyfish.png', {
            frameWidth: 32,
            frameHeight: 16
        });
        // SawShark: 384x64 = 8 cols x 2 rows of 48x32
        this.load.spritesheet('sawshark', 'assets/sprites/enemies/SawShark.png', {
            frameWidth: 48,
            frameHeight: 32
        });
        // Squid: 128x32 = 4 cols x 2 rows of 32x16
        this.load.spritesheet('squid', 'assets/sprites/enemies/squid.png', {
            frameWidth: 32,
            frameHeight: 16
        });
        // Octopus: 112x37 = 4 frames of 28x37
        this.load.spritesheet('octopus', 'assets/sprites/enemies/octopus.png', {
            frameWidth: 28,
            frameHeight: 37
        });
        // Mine: 45x45 single sprite
        this.load.image('mine', 'assets/sprites/enemies/mine.png');
        // FishBig: 216x49 = 4 frames of 54x49
        this.load.spritesheet('fishbig', 'assets/sprites/enemies/fishbig.png', {
            frameWidth: 54,
            frameHeight: 49
        });
        // FishDart: 156x20 = 6 frames of 26x20
        this.load.spritesheet('fishdart', 'assets/sprites/enemies/fishdart.png', {
            frameWidth: 26,
            frameHeight: 20
        });
        // Fish: 128x32 = 4 frames of 32x32
        this.load.spritesheet('fish', 'assets/sprites/enemies/fish.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // Load effects
        // Explosion: 1008x128 = 9 frames of 112x128
        this.load.spritesheet('explosion', 'assets/sprites/effects/explosion.png', {
            frameWidth: 112,
            frameHeight: 128
        });

        // Load items
        this.load.image('bullet', 'assets/sprites/items/bullet.png');
        // Coin: 128x16 = 8 frames of 16x16
        this.load.spritesheet('coin', 'assets/sprites/items/coin.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        // Fireball: 156x29 = 6 frames of 26x29
        this.load.spritesheet('fireball', 'assets/sprites/items/fireball.png', {
            frameWidth: 26,
            frameHeight: 29
        });
        // Companion fish: 128x64 = 8x4 grid of 16x16 frames
        this.load.spritesheet('companion', 'assets/sprites/items/companion.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        // Bubble: 80x8 = 10 frames of 8x8
        this.load.spritesheet('bubble', 'assets/sprites/items/bubble.png', {
            frameWidth: 8,
            frameHeight: 8
        });

        // Load audio
        this.load.audio('bg-music', 'assets/audio/background-music.mp3');
        this.load.audio('sfx-shoot', 'assets/audio/shoot.wav');
        this.load.audio('sfx-explosion', 'assets/audio/explosion.wav');
        this.load.audio('sfx-pickup', 'assets/audio/pickup.wav');
        this.load.audio('sfx-hit', 'assets/audio/hit.wav');
        this.load.audio('sfx-hurt', 'assets/audio/hurt.wav');
    }

    create() {
        // Create animations

        // Diver: 7 frames of 80x80 swimming animation
        this.anims.create({
            key: 'diver-swim',
            frames: this.anims.generateFrameNumbers('diver', { start: 0, end: 6 }),
            frameRate: 12,
            repeat: -1
        });

        // Shark: 8 cols x 2 rows - first row swimming (frames 0-7)
        this.anims.create({
            key: 'shark-swim',
            frames: this.anims.generateFrameNumbers('shark', { start: 0, end: 7 }),
            frameRate: 8,
            repeat: -1
        });

        // Jellyfish: 4 cols x 2 rows - first row (frames 0-3)
        this.anims.create({
            key: 'jellyfish-float',
            frames: this.anims.generateFrameNumbers('jellyfish', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });

        // Swordfish: 8 frames
        this.anims.create({
            key: 'swordfish-swim',
            frames: this.anims.generateFrameNumbers('swordfish', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        // Angler: 8 cols x 2 rows - first row (frames 0-7)
        this.anims.create({
            key: 'angler-swim',
            frames: this.anims.generateFrameNumbers('angler', { start: 0, end: 7 }),
            frameRate: 6,
            repeat: -1
        });

        // Coin: 8 frames spinning animation
        this.anims.create({
            key: 'coin-spin',
            frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        // SawShark: 8 cols x 2 rows - first row (frames 0-7)
        this.anims.create({
            key: 'sawshark-swim',
            frames: this.anims.generateFrameNumbers('sawshark', { start: 0, end: 7 }),
            frameRate: 8,
            repeat: -1
        });

        // Squid: 4 cols x 2 rows - first row (frames 0-3)
        this.anims.create({
            key: 'squid-swim',
            frames: this.anims.generateFrameNumbers('squid', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        // Octopus: 4 frames
        this.anims.create({
            key: 'octopus-idle',
            frames: this.anims.generateFrameNumbers('octopus', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });

        // Explosion: 9 frames, plays once
        this.anims.create({
            key: 'explosion-anim',
            frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 8 }),
            frameRate: 15,
            repeat: 0
        });

        // Fireball: 6 frames looping
        this.anims.create({
            key: 'fireball-fly',
            frames: this.anims.generateFrameNumbers('fireball', { start: 0, end: 5 }),
            frameRate: 12,
            repeat: -1
        });

        // Companion fish: first row (frames 0-7) swimming
        this.anims.create({
            key: 'companion-swim',
            frames: this.anims.generateFrameNumbers('companion', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        // FishBig: 4 frames swimming
        this.anims.create({
            key: 'fishbig-swim',
            frames: this.anims.generateFrameNumbers('fishbig', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        // FishDart: 6 frames swimming
        this.anims.create({
            key: 'fishdart-swim',
            frames: this.anims.generateFrameNumbers('fishdart', { start: 0, end: 5 }),
            frameRate: 12,
            repeat: -1
        });

        // Fish: 4 frames swimming
        this.anims.create({
            key: 'fish-swim',
            frames: this.anims.generateFrameNumbers('fish', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        // Bubble: 10 frames animation
        this.anims.create({
            key: 'bubble-pop',
            frames: this.anims.generateFrameNumbers('bubble', { start: 0, end: 9 }),
            frameRate: 12,
            repeat: -1
        });

        // Go to menu
        this.scene.start('MenuScene');
    }
}
