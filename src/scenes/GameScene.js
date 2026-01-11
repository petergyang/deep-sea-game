/**
 * Game configuration constants
 */
const CONFIG = {
    // Player settings
    player: {
        startX: 100,
        speed: 5,
        boostedSpeed: 9,
        maxHealth: 5,
        hitRadius: 25,
        shieldRadius: 30,
        depth: 100
    },

    // Bullet/projectile settings
    bullets: {
        speed: 12,
        hitRadius: 6,
        scale: 3,
        depth: 90
    },

    fireballs: {
        speed: 10,
        hitRadius: 12,
        scale: 2,
        depth: 90
    },

    // Enemy configurations
    enemies: {
        jellyfish: { speed: 1.5, points: 50, hitRadius: 15, health: 1, scale: 2 },
        swordfish: { speed: 4, points: 75, hitRadius: 30, health: 1, scale: 2, groupSize: { min: 3, max: 5 }, spacing: 60 },
        angler: { speed: 1.5, points: 100, hitRadius: 30, health: 1, scale: 2 },
        squid: { speed: 5, points: 100, hitRadius: 15, health: 1, scale: 2 },
        sawshark: { speed: 2, points: 150, hitRadius: 25, health: 1, scale: 2 },
        fishbig: { speed: 1.8, points: 80, hitRadius: 25, health: 2, scale: 2 },
        fishdart: { speed: 6, points: 60, hitRadius: 12, health: 1, scale: 2 },
        fish: { speed: 2.5, points: 40, hitRadius: 15, health: 1, scale: 2 }
    },

    mines: {
        speed: 0.5,
        hitRadius: 20,
        scale: 1.5,
        points: 25,
        depth: 55
    },

    // Boss settings
    bosses: {
        megaShark: {
            health: 100,
            hitRadius: 150,
            scale: 10,
            points: 1000,
            shootInterval: 1500,
            spawnKillCount: 25
        },
        kraken: {
            health: 120,
            hitRadius: 100,
            scale: 8,
            points: 2000,
            shootInterval: 1200
        }
    },

    // Powerup settings
    powerups: {
        firepower: { duration: 10000 },
        shield: { duration: 6000 },
        fireball: { duration: 8000 },
        companion: { duration: 12000 }
    },

    // Companion fish settings
    companion: {
        offsetY: -40,
        shootInterval: 400,
        bubbleSpeed: 10,
        bubbleHitRadius: 8,
        scale: 2.5
    },

    // Spawn timers (ms)
    spawnTimers: {
        collectible: 2500,
        enemy: 700,      // 2x faster enemy spawns
        mine: 4000,
        powerup: 2500,   // 2x faster powerup spawns
        difficulty: 15000
    },

    // Parallax scrolling speeds
    parallax: {
        far: 0.3,
        mid: 0.8,
        sand: 1.5
    },

    // Game balance
    difficulty: {
        speedIncrement: 0.1,
        maxSpeed: 2.5
    },

    // UI
    ui: {
        depth: 500,
        bossHealthBarWidth: 200,
        healthBarWidth: 100
    },

    // Fire rate
    fireRate: 200,

    // Audio settings
    audio: {
        musicVolume: 0.7,
        sfxVolume: 0.6
    },

    // Combo system
    combo: {
        timeWindow: 2000,      // 2 seconds to chain kills
        maxMultiplier: 8,      // Maximum combo multiplier
        decayWarning: 500      // Flash warning when combo about to expire
    }
};

/**
 * Main gameplay scene - handles all core game mechanics including
 * player movement, enemy spawning, collision detection, and boss battles.
 */
export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    /**
     * Initializes game state variables before scene creation
     */
    init() {
        this.score = 0;
        this.health = CONFIG.player.maxHealth;
        this.gameSpeed = 1;
        this.fireRate = CONFIG.fireRate;
        this.lastFired = 0;
        this.gameTime = 0;
        this.enemiesKilled = 0;
        this.currentLevel = 1;
        this.levelStarted = false;
        this.bossActive = false;
        this.bossDefeated = false;
        this.secondBossActive = false;
        this.secondBossDefeated = false;
        this.firepower = 1;
        this.speedBoost = false;
        this.shieldActive = false;
        this.fireballActive = false;
        this.isMobile = false;
        this.touchTarget = null;
        this.isPaused = false;
        this.mineWaveTriggered = false;
        this.godMode = false;

        // Companion state
        this.companionActive = false;
        this.companion = null;
        this.lastCompanionShot = 0;

        // Combo system state
        this.comboCount = 0;
        this.comboMultiplier = 1;
        this.comboTimer = 0;
        this.lastKillTime = 0;
    }

    /**
     * Creates and initializes all game objects, input handlers, and timers
     */
    create() {
        const { width, height } = this.cameras.main;

        // Create tiled backgrounds for parallax scrolling
        this.createBackgrounds();

        // Create the player (diver)
        this.createPlayer();

        // Groups
        this.bullets = this.add.group();
        this.fireballs = this.add.group();
        this.bubbles = this.add.group();
        this.collectibles = this.add.group();
        this.enemies = this.add.group();
        this.powerups = this.add.group();
        this.bossProjectiles = this.add.group();
        this.mines = this.add.group();
        this.boss = null;
        this.secondBoss = null;
        this.lastBossShot = 0;

        // Input - Keyboard
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            fire: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // Detect mobile/touch device
        this.isMobile = this.sys.game.device.input.touch;

        // Virtual joystick state
        this.joystickInput = { x: 0, y: 0 };
        this.fireButtonPressed = false;

        // Set up mobile controls if on touch device
        if (this.isMobile) {
            this.setupMobileControls();
        }

        // Fallback touch controls for non-joystick areas (legacy support)
        this.input.on('pointerdown', (pointer) => {
            if (!this.isMobile) {
                this.touchTarget = { x: pointer.x, y: pointer.y };
            }
            this.showTouchIndicator(pointer.x, pointer.y);
        });

        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown && !this.isMobile) {
                this.touchTarget = { x: pointer.x, y: pointer.y };
            }
        });

        this.input.on('pointerup', () => {
            if (!this.isMobile) {
                this.touchTarget = null;
            }
        });

        // UI
        this.createUI();

        // Audio setup
        this.setupAudio();

        // Spawn timers
        this.time.addEvent({
            delay: CONFIG.spawnTimers.collectible,
            callback: this.spawnCollectible,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: CONFIG.spawnTimers.enemy,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: CONFIG.spawnTimers.mine,
            callback: this.spawnMine,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: CONFIG.spawnTimers.powerup,
            callback: this.spawnPowerup,
            callbackScope: this,
            loop: true
        });

        // Difficulty scaling
        this.time.addEvent({
            delay: CONFIG.spawnTimers.difficulty,
            callback: () => {
                this.gameSpeed = Math.min(
                    this.gameSpeed + CONFIG.difficulty.speedIncrement,
                    CONFIG.difficulty.maxSpeed
                );
            },
            loop: true
        });

        // Fade in
        this.cameras.main.fadeIn(500);

        // Show Level 1 indicator
        this.showLevelIndicator(1);

        // Pause menu setup
        this.createPauseMenu();

        // ESC or P key to pause
        this.input.keyboard.on('keydown-ESC', () => {
            this.togglePause();
        });
        this.input.keyboard.on('keydown-P', () => {
            this.togglePause();
        });

        // Secret god mode toggle
        this.input.keyboard.on('keydown-G', () => {
            this.godMode = !this.godMode;
            const msg = this.add.text(400, 200, this.godMode ? 'GOD MODE ON' : 'GOD MODE OFF', {
                fontSize: '24px', fontStyle: 'bold',
                color: this.godMode ? '#ffff00' : '#888888',
                stroke: '#000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(600);
            this.tweens.add({ targets: msg, alpha: 0, y: 170, duration: 1000, onComplete: () => msg.destroy() });
        });
    }

    createPauseMenu() {
        const { width, height } = this.cameras.main;

        // Pause overlay container
        this.pauseOverlay = this.add.container(0, 0).setDepth(1000).setVisible(false);

        // Dark background
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.7);
        bg.fillRect(0, 0, width, height);
        this.pauseOverlay.add(bg);

        // PAUSED text
        const pauseText = this.add.text(width / 2, height / 3, 'PAUSED', {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '64px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.pauseOverlay.add(pauseText);

        // Resume button
        const resumeBtn = this.add.text(width / 2, height / 2, 'RESUME', {
            fontFamily: 'Courier New, monospace',
            fontSize: '28px',
            color: '#00ffff',
            backgroundColor: '#003333',
            padding: { x: 30, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.pauseOverlay.add(resumeBtn);

        resumeBtn.on('pointerover', () => {
            resumeBtn.setStyle({ color: '#ffff00', backgroundColor: '#666600' });
        });
        resumeBtn.on('pointerout', () => {
            resumeBtn.setStyle({ color: '#00ffff', backgroundColor: '#003333' });
        });
        resumeBtn.on('pointerdown', () => {
            this.togglePause();
        });

        // Quit button
        const quitBtn = this.add.text(width / 2, height / 2 + 60, 'QUIT TO MENU', {
            fontFamily: 'Courier New, monospace',
            fontSize: '28px',
            color: '#00ffff',
            backgroundColor: '#003333',
            padding: { x: 30, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.pauseOverlay.add(quitBtn);

        quitBtn.on('pointerover', () => {
            quitBtn.setStyle({ color: '#ffff00', backgroundColor: '#666600' });
        });
        quitBtn.on('pointerout', () => {
            quitBtn.setStyle({ color: '#00ffff', backgroundColor: '#003333' });
        });
        quitBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        // Instructions
        const hint = this.add.text(width / 2, height - 60, 'Press ESC or P to resume', {
            fontFamily: 'Courier New, monospace',
            fontSize: '16px',
            color: '#888888'
        }).setOrigin(0.5);
        this.pauseOverlay.add(hint);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseOverlay.setVisible(this.isPaused);

        if (this.isPaused) {
            this.physics?.pause?.();
            this.tweens.pauseAll();
            this.time.paused = true;
        } else {
            this.physics?.resume?.();
            this.tweens.resumeAll();
            this.time.paused = false;
        }
    }

    /**
     * Sets up mobile virtual joystick and button controls
     */
    setupMobileControls() {
        const joystickBase = document.getElementById('joystick-base');
        const joystickThumb = document.getElementById('joystick-thumb');
        const fireButton = document.getElementById('fire-button');
        const pauseButton = document.getElementById('pause-button-mobile');

        if (!joystickBase || !joystickThumb) return;

        const joystickRadius = 60; // Half of joystick base width
        const thumbRadius = 25;    // Half of thumb width
        const maxDistance = joystickRadius - thumbRadius;

        let joystickActive = false;
        let joystickStartX = 0;
        let joystickStartY = 0;

        // Joystick touch handlers
        const handleJoystickStart = (e) => {
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            const rect = joystickBase.getBoundingClientRect();
            joystickStartX = rect.left + joystickRadius;
            joystickStartY = rect.top + joystickRadius;
            joystickActive = true;
            this.handleJoystickMove(touch, joystickStartX, joystickStartY, maxDistance, joystickThumb);
        };

        const handleJoystickMove = (e) => {
            if (!joystickActive) return;
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            this.handleJoystickMove(touch, joystickStartX, joystickStartY, maxDistance, joystickThumb);
        };

        const handleJoystickEnd = (e) => {
            e.preventDefault();
            joystickActive = false;
            this.joystickInput = { x: 0, y: 0 };
            joystickThumb.style.transform = 'translate(0, 0)';
        };

        joystickBase.addEventListener('touchstart', handleJoystickStart, { passive: false });
        joystickBase.addEventListener('touchmove', handleJoystickMove, { passive: false });
        joystickBase.addEventListener('touchend', handleJoystickEnd, { passive: false });
        joystickBase.addEventListener('touchcancel', handleJoystickEnd, { passive: false });

        // Fire button handlers
        if (fireButton) {
            fireButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.fireButtonPressed = true;
                this.showTouchIndicator(window.innerWidth - 90, window.innerHeight - 90);
            }, { passive: false });

            fireButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.fireButtonPressed = false;
            }, { passive: false });

            fireButton.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.fireButtonPressed = false;
            }, { passive: false });
        }

        // Pause button handler
        if (pauseButton) {
            pauseButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.togglePause();
            }, { passive: false });
        }
    }

    /**
     * Handles joystick movement and updates input state
     */
    handleJoystickMove(touch, centerX, centerY, maxDistance, thumbElement) {
        const deltaX = touch.clientX - centerX;
        const deltaY = touch.clientY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        let clampedX = deltaX;
        let clampedY = deltaY;

        if (distance > maxDistance) {
            clampedX = (deltaX / distance) * maxDistance;
            clampedY = (deltaY / distance) * maxDistance;
        }

        // Update thumb position
        thumbElement.style.transform = `translate(${clampedX}px, ${clampedY}px)`;

        // Normalize to -1 to 1 range
        this.joystickInput = {
            x: clampedX / maxDistance,
            y: clampedY / maxDistance
        };
    }

    /**
     * Shows a visual touch indicator at the given position
     */
    showTouchIndicator(x, y) {
        const indicator = document.getElementById('touch-indicator');
        if (!indicator) return;

        // Clone and show indicator for animation
        const newIndicator = indicator.cloneNode(true);
        newIndicator.style.display = 'block';
        newIndicator.style.left = `${x}px`;
        newIndicator.style.top = `${y}px`;
        document.body.appendChild(newIndicator);

        // Remove after animation
        setTimeout(() => {
            newIndicator.remove();
        }, 500);
    }

    createBackgrounds() {
        const { width, height } = this.cameras.main;

        // Background images are 256x192
        // Scale to fill 600px height: 600/192 = 3.125, use 3.5 for some overlap
        const bgScale = 3.5;

        // Create gradient background for the water above the scenery
        const gradient = this.add.graphics();
        for (let y = 0; y < height; y++) {
            const ratio = y / height;
            const r = Math.floor(10 + ratio * 20);
            const g = Math.floor(30 + ratio * 60);
            const b = Math.floor(80 + ratio * 100);
            gradient.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
            gradient.fillRect(0, y, width, 1);
        }
        gradient.setDepth(0);

        // Far background (slowest) - anchored to bottom
        this.bgFar1 = this.add.tileSprite(0, height, width, 192, 'bg-far')
            .setOrigin(0, 1)
            .setDepth(1)
            .setScale(bgScale);

        // Mid layer
        this.bgMid1 = this.add.tileSprite(0, height, width, 192, 'bg-mid')
            .setOrigin(0, 1)
            .setDepth(2)
            .setScale(bgScale);

        // Near/sand layer (fastest)
        this.bgSand1 = this.add.tileSprite(0, height, width, 192, 'bg-sand')
            .setOrigin(0, 1)
            .setDepth(3)
            .setScale(bgScale);
    }

    createPlayer() {
        const { height } = this.cameras.main;

        this.player = this.add.sprite(CONFIG.player.startX, height / 2, 'diver')
            .setDepth(CONFIG.player.depth)
            .setScale(1);

        if (this.anims.exists('diver-swim')) {
            this.player.play('diver-swim');
        }

        this.player.speed = CONFIG.player.speed;

        // Shield graphics
        this.shieldGraphics = this.add.graphics();
        this.shieldGraphics.setDepth(CONFIG.player.depth + 1);
        this.shieldGraphics.setVisible(false);
    }

    createUI() {
        const { width } = this.cameras.main;

        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setDepth(500);

        // Level indicator
        this.levelText = this.add.text(20, 50, 'Level 1', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setDepth(500);

        // Health bar
        this.healthBar = this.add.graphics();
        this.healthBar.setDepth(500);
        this.updateHealthBar();

        this.add.text(width - 100, 55, 'SPACE: Fire', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#88ccff'
        }).setDepth(500);

        // Combo UI (smaller and positioned in corner)
        this.comboContainer = this.add.container(width - 80, 100).setDepth(500);
        this.comboContainer.setAlpha(0);

        this.comboText = this.add.text(0, 0, '', {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '16px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.comboContainer.add(this.comboText);

        this.comboTimerBar = this.add.graphics();
        this.comboContainer.add(this.comboTimerBar);
    }

    /**
     * Sets up audio - background music and sound effects
     */
    setupAudio() {
        // Background music (looping)
        if (this.cache.audio.exists('bg-music')) {
            this.bgMusic = this.sound.add('bg-music', {
                volume: CONFIG.audio.musicVolume,
                loop: true
            });
            this.bgMusic.play();
        }

        // Sound effects
        if (this.cache.audio.exists('sfx-explosion')) {
            this.sfxExplosion = this.sound.add('sfx-explosion', { volume: CONFIG.audio.sfxVolume });
        }
        if (this.cache.audio.exists('sfx-pickup')) {
            this.sfxPickup = this.sound.add('sfx-pickup', { volume: CONFIG.audio.sfxVolume });
        }
        if (this.cache.audio.exists('sfx-hit')) {
            this.sfxHit = this.sound.add('sfx-hit', { volume: CONFIG.audio.sfxVolume });
        }
        if (this.cache.audio.exists('sfx-hurt')) {
            this.sfxHurt = this.sound.add('sfx-hurt', { volume: CONFIG.audio.sfxVolume });
        }
    }

    /**
     * Shows a level indicator at the start of a level
     */
    showLevelIndicator(level) {
        const { width, height } = this.cameras.main;

        const levelNames = {
            1: 'THE DEPTHS',
            2: 'THE ABYSS'
        };

        // Create container for level indicator
        const container = this.add.container(width / 2, height / 2).setDepth(600);

        // Background panel
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.7);
        bg.fillRoundedRect(-200, -80, 400, 160, 20);
        container.add(bg);

        // Level text
        const levelText = this.add.text(0, -40, `LEVEL ${level}`, {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '48px',
            color: level === 1 ? '#00ffff' : '#ff00ff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        container.add(levelText);

        // Level name
        const nameText = this.add.text(0, 20, levelNames[level] || '', {
            fontFamily: 'Courier New, monospace',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(nameText);

        // Enemies hint
        const enemies = level === 1
            ? 'Jellyfish • Swordfish • Fish'
            : 'Anglers • Squid • Sawshark • Dart Fish';
        const enemiesText = this.add.text(0, 55, enemies, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#aaaaaa'
        }).setOrigin(0.5);
        container.add(enemiesText);

        // Animate in
        container.setAlpha(0);
        container.setScale(0.5);

        this.tweens.add({
            targets: container,
            alpha: 1,
            scale: 1,
            duration: 500,
            ease: 'Back.out'
        });

        // Animate out after delay
        this.time.delayedCall(2500, () => {
            this.tweens.add({
                targets: container,
                alpha: 0,
                scale: 1.2,
                duration: 500,
                onComplete: () => {
                    container.destroy();
                    this.levelStarted = true;
                    // Update UI level text
                    if (this.levelText) {
                        this.levelText.setText(`Level ${level}`);
                        this.levelText.setColor(level === 1 ? '#00ffff' : '#ff00ff');
                    }
                }
            });
        });
    }

    updateHealthBar() {
        const { width } = this.cameras.main;
        this.healthBar.clear();

        this.healthBar.fillStyle(0x333333, 0.8);
        this.healthBar.fillRoundedRect(width - 120, 20, CONFIG.ui.healthBarWidth, 20, 5);

        const healthPercent = this.health / CONFIG.player.maxHealth;
        const healthColor = healthPercent > 0.5 ? 0x44ff44 : healthPercent > 0.25 ? 0xffaa00 : 0xff4444;
        this.healthBar.fillStyle(healthColor, 1);
        this.healthBar.fillRoundedRect(width - 118, 22, 96 * healthPercent, 16, 4);
    }

    /**
     * Adds a kill to the combo chain and returns multiplied points
     * @param {number} basePoints - Base points for the kill
     * @returns {number} Points after combo multiplier applied
     */
    addComboKill(basePoints) {
        const now = this.time.now;

        // Check if within combo window
        if (now - this.lastKillTime < CONFIG.combo.timeWindow) {
            this.comboCount++;
            this.comboMultiplier = Math.min(
                1 + Math.floor(this.comboCount / 2),
                CONFIG.combo.maxMultiplier
            );
        } else {
            // Start new combo
            this.comboCount = 1;
            this.comboMultiplier = 1;
        }

        this.lastKillTime = now;
        this.comboTimer = CONFIG.combo.timeWindow;

        const multipliedPoints = basePoints * this.comboMultiplier;
        this.updateComboUI();

        return multipliedPoints;
    }

    /**
     * Updates the combo UI display
     */
    updateComboUI() {
        if (this.comboCount < 2) {
            this.comboContainer.setAlpha(0);
            return;
        }

        this.comboContainer.setAlpha(1);

        // Update text
        const multiplierText = this.comboMultiplier > 1 ? `x${this.comboMultiplier}` : '';
        this.comboText.setText(`${this.comboCount} HIT COMBO! ${multiplierText}`);

        // Color based on multiplier
        const colors = ['#ffff00', '#ffaa00', '#ff6600', '#ff0066', '#ff00ff', '#00ffff', '#00ff00', '#ffffff'];
        const colorIndex = Math.min(this.comboMultiplier - 1, colors.length - 1);
        this.comboText.setColor(colors[colorIndex]);

        // Pulse effect on new combo hit (smaller)
        this.tweens.add({
            targets: this.comboText,
            scale: 1.15,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
    }

    /**
     * Updates combo timer bar and handles combo expiry
     * @param {number} delta - Time since last frame
     */
    updateComboTimer(delta) {
        if (this.comboCount < 2) return;

        this.comboTimer -= delta;

        // Draw timer bar (smaller)
        const barWidth = 60;
        const barHeight = 4;
        const progress = Math.max(0, this.comboTimer / CONFIG.combo.timeWindow);

        this.comboTimerBar.clear();
        this.comboTimerBar.fillStyle(0x333333, 0.8);
        this.comboTimerBar.fillRoundedRect(-barWidth / 2, 14, barWidth, barHeight, 2);

        // Color changes as timer runs out
        const timerColor = this.comboTimer < CONFIG.combo.decayWarning ? 0xff0000 : 0x00ff00;
        this.comboTimerBar.fillStyle(timerColor, 1);
        this.comboTimerBar.fillRoundedRect(-barWidth / 2 + 1, 15, (barWidth - 2) * progress, barHeight - 2, 2);

        // Flash warning when about to expire
        if (this.comboTimer < CONFIG.combo.decayWarning && this.comboTimer > 0) {
            this.comboContainer.setAlpha(0.5 + Math.sin(this.time.now / 50) * 0.5);
        }

        // Combo expired
        if (this.comboTimer <= 0) {
            this.resetCombo();
        }
    }

    /**
     * Resets the combo state
     */
    resetCombo() {
        if (this.comboCount >= 2) {
            // Fade out combo UI
            this.tweens.add({
                targets: this.comboContainer,
                alpha: 0,
                duration: 300
            });
        }
        this.comboCount = 0;
        this.comboMultiplier = 1;
        this.comboTimer = 0;
    }

    shootBullet() {
        const offsets = this.firepower === 1 ? [0] :
                        this.firepower === 2 ? [-15, 15] :
                        [-20, 0, 20];

        offsets.forEach(offsetY => {
            const bullet = this.add.image(this.player.x + 40, this.player.y + offsetY, 'bullet')
                .setDepth(CONFIG.bullets.depth)
                .setScale(CONFIG.bullets.scale);

            bullet.velocity = CONFIG.bullets.speed;
            bullet.hitRadius = CONFIG.bullets.hitRadius;
            this.bullets.add(bullet);
        });

    }

    shootFireball() {
        const fireball = this.add.sprite(this.player.x + 40, this.player.y, 'fireball')
            .setDepth(CONFIG.fireballs.depth)
            .setScale(CONFIG.fireballs.scale);

        if (this.anims.exists('fireball-fly')) {
            fireball.play('fireball-fly');
        }

        fireball.velocity = CONFIG.fireballs.speed;
        fireball.hitRadius = CONFIG.fireballs.hitRadius;
        fireball.piercing = true;
        fireball.hitEnemies = new Set();
        this.fireballs.add(fireball);
    }

    spawnCollectible() {
        const { width, height } = this.cameras.main;
        const y = Phaser.Math.Between(80, height - 80);

        // Use animated coin sprite
        const item = this.add.sprite(width + 30, y, 'coin')
            .setDepth(50)
            .setScale(2);

        // Play coin spin animation
        if (this.anims.exists('coin-spin')) {
            item.play('coin-spin');
        }

        item.value = 50;
        item.hitRadius = 15;

        // Float animation
        this.tweens.add({
            targets: item,
            y: y + Phaser.Math.Between(-20, 20),
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.collectibles.add(item);
    }

    spawnEnemy() {
        if (this.bossActive) return;

        const { width, height } = this.cameras.main;

        // Different enemies for each level
        const level1Enemies = ['jellyfish', 'swordfish', 'fish', 'fishbig'];
        const level2Enemies = ['angler', 'squid', 'sawshark', 'fishdart'];

        const enemyTypes = this.currentLevel === 1 ? level1Enemies : level2Enemies;
        const type = enemyTypes[Phaser.Math.Between(0, enemyTypes.length - 1)];

        switch (type) {
            case 'jellyfish':
                this.spawnJellyfish(width, height);
                break;
            case 'swordfish':
                this.spawnSwordfishGroup(width, height);
                break;
            case 'angler':
                this.spawnAnglerSchool(width, height);
                break;
            case 'squid':
                this.spawnSquid(width, height);
                break;
            case 'sawshark':
                this.spawnSawshark(width, height);
                break;
            case 'fishbig':
                this.spawnFishBigGroup(width, height);
                break;
            case 'fishdart':
                this.spawnFishDartSwarm(width, height);
                break;
            case 'fish':
                this.spawnFishSchool(width, height);
                break;
        }
    }

    /**
     * Creates an enemy sprite with common settings from CONFIG
     * @param {string} type - The enemy type key (jellyfish, swordfish, etc.)
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} animKey - Animation key to play
     * @returns {Phaser.GameObjects.Sprite} The created enemy sprite
     */
    createEnemy(type, x, y, animKey) {
        const cfg = CONFIG.enemies[type];
        const enemy = this.add.sprite(x, y, type)
            .setDepth(60)
            .setScale(cfg.scale)
            .setFlipX(true);

        enemy.hitRadius = cfg.hitRadius;
        enemy.health = cfg.health;
        enemy.speed = cfg.speed;
        enemy.points = cfg.points;

        if (this.anims.exists(animKey)) {
            enemy.play(animKey);
        }

        this.enemies.add(enemy);
        return enemy;
    }

    spawnJellyfish(width, height) {
        const y = Phaser.Math.Between(80, height - 80);
        const enemy = this.createEnemy('jellyfish', width + 50, y, 'jellyfish-float');

        // Bob up and down
        this.tweens.add({
            targets: enemy,
            y: y + Phaser.Math.Between(-50, 50),
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    spawnSwordfishGroup(width, height) {
        const cfg = CONFIG.enemies.swordfish;
        const count = Phaser.Math.Between(cfg.groupSize.min, cfg.groupSize.max);
        const baseY = Phaser.Math.Between(100, height - 100);

        for (let i = 0; i < count; i++) {
            this.createEnemy('swordfish', width + 50 + (i * cfg.spacing), baseY, 'swordfish-swim');
        }
    }

    spawnAnglerSchool(width, height) {
        const baseY = Phaser.Math.Between(120, height - 120);
        const positions = [
            { x: 0, y: 0 },
            { x: 50, y: -40 },
            { x: 50, y: 40 }
        ];

        positions.forEach((pos, i) => {
            const enemy = this.createEnemy('angler', width + 50 + pos.x, baseY + pos.y, 'angler-swim');
            enemy.formationIndex = i;

            // Slight wave motion for school effect
            this.tweens.add({
                targets: enemy,
                y: enemy.y + Phaser.Math.Between(-15, 15),
                duration: 800 + (i * 100),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    spawnSquid(width, height) {
        const y = Phaser.Math.Between(100, height - 100);
        const enemy = this.createEnemy('squid', width + 50, y, 'squid-swim');

        // Zigzag movement properties
        enemy.isZigzag = true;
        enemy.zigzagDir = 1;
        enemy.zigzagTimer = 0;
    }

    spawnSawshark(width, height) {
        const y = Phaser.Math.Between(100, height - 100);
        const enemy = this.createEnemy('sawshark', width + 50, y, 'sawshark-swim');

        // Wave movement properties
        enemy.startY = y;
        enemy.waveOffset = 0;
        enemy.isWave = true;
    }

    /**
     * Spawns a group of big fish in a horizontal line formation
     */
    spawnFishBigGroup(width, height) {
        const count = Phaser.Math.Between(2, 4);
        const baseY = Phaser.Math.Between(120, height - 120);
        const spacing = 80;

        for (let i = 0; i < count; i++) {
            const enemy = this.createEnemy('fishbig', width + 50 + (i * spacing), baseY, 'fishbig-swim');

            // Gentle bobbing
            this.tweens.add({
                targets: enemy,
                y: baseY + Phaser.Math.Between(-20, 20),
                duration: 1500 + (i * 200),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    /**
     * Spawns a fast dart fish swarm in a V formation
     */
    spawnFishDartSwarm(width, height) {
        const count = Phaser.Math.Between(5, 8);
        const baseY = Phaser.Math.Between(100, height - 100);

        for (let i = 0; i < count; i++) {
            // V formation offset
            const row = Math.floor(i / 2);
            const isTop = i % 2 === 0;
            const yOffset = isTop ? -row * 25 : row * 25;

            const enemy = this.createEnemy('fishdart', width + 50 + (row * 40), baseY + yOffset, 'fishdart-swim');
            enemy.setScale(1.5);  // Smaller scale for dart fish
        }
    }

    /**
     * Spawns a school of regular fish in a circular/swarm pattern
     */
    spawnFishSchool(width, height) {
        const count = Phaser.Math.Between(6, 10);
        const centerY = Phaser.Math.Between(120, height - 120);
        const spreadRadius = 60;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const offsetX = Math.cos(angle) * Phaser.Math.Between(20, spreadRadius);
            const offsetY = Math.sin(angle) * Phaser.Math.Between(20, spreadRadius);

            const enemy = this.createEnemy('fish', width + 50 + offsetX, centerY + offsetY, 'fish-swim');

            // School swimming motion
            this.tweens.add({
                targets: enemy,
                y: enemy.y + Phaser.Math.Between(-30, 30),
                duration: 1000 + Phaser.Math.Between(0, 500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    spawnMine() {
        if (this.bossActive) return;

        const { width, height } = this.cameras.main;
        const y = Phaser.Math.Between(100, height - 100);

        const mine = this.add.image(width + 30, y, 'mine')
            .setDepth(CONFIG.mines.depth)
            .setScale(CONFIG.mines.scale);

        mine.hitRadius = CONFIG.mines.hitRadius;
        mine.speed = CONFIG.mines.speed;

        // Gentle bobbing
        this.tweens.add({
            targets: mine,
            y: y + 15,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Slow rotation
        this.tweens.add({
            targets: mine,
            rotation: Math.PI * 2,
            duration: 8000,
            repeat: -1
        });

        this.mines.add(mine);
    }

    /**
     * Spawns a large wave of mines as a warning before the boss
     */
    spawnMineWave() {
        const { width, height } = this.cameras.main;

        // Warning text
        const warning = this.add.text(width / 2, height / 2, 'MINE FIELD!', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ff6600',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(400);

        this.tweens.add({
            targets: warning,
            alpha: 0,
            y: height / 2 - 50,
            duration: 2000,
            onComplete: () => warning.destroy()
        });

        // Spawn mines in waves
        const mineCount = 15;
        for (let i = 0; i < mineCount; i++) {
            this.time.delayedCall(i * 200, () => {
                const y = Phaser.Math.Between(80, height - 80);
                const mine = this.add.image(width + 30 + Phaser.Math.Between(0, 100), y, 'mine')
                    .setDepth(CONFIG.mines.depth)
                    .setScale(CONFIG.mines.scale);

                mine.hitRadius = CONFIG.mines.hitRadius;
                mine.speed = CONFIG.mines.speed * 1.5;  // Faster mines

                // Bobbing animation
                this.tweens.add({
                    targets: mine,
                    y: y + 20,
                    duration: 1500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });

                // Rotation
                this.tweens.add({
                    targets: mine,
                    rotation: Math.PI * 2,
                    duration: 6000,
                    repeat: -1
                });

                this.mines.add(mine);
            });
        }
    }

    spawnPowerup() {
        const { width, height } = this.cameras.main;
        const y = Phaser.Math.Between(80, height - 80);

        const types = [
            { type: 'firepower', color: 0xff6600, label: 'F' },
            { type: 'shield', color: 0x6666ff, label: 'D' },
            { type: 'health', color: 0x44ff44, label: '+' },
            { type: 'fireball', color: 0xff4400, label: '🔥' },
            { type: 'companion', color: 0xff88cc, label: 'C' }
        ];
        const powerupData = types[Phaser.Math.Between(0, types.length - 1)];

        const powerup = this.add.graphics();
        powerup.setDepth(55);
        powerup.fillStyle(powerupData.color, 0.6);
        powerup.fillCircle(0, 0, 20);
        powerup.fillStyle(0xffffff, 0.9);
        powerup.fillCircle(0, 0, 12);
        powerup.setPosition(width + 40, y);
        powerup.powerupType = powerupData.type;
        powerup.hitRadius = 20;

        const label = this.add.text(width + 40, y, powerupData.label, {
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#000'
        }).setOrigin(0.5).setDepth(56);
        powerup.label = label;

        this.tweens.add({
            targets: [powerup, label],
            y: y + 15,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.powerups.add(powerup);
    }

    spawnBoss() {
        if (this.boss || this.bossActive) return;

        const { width, height } = this.cameras.main;
        this.bossActive = true;

        // Red screen overlay for warning
        const redOverlay = this.add.graphics();
        redOverlay.fillStyle(0xff0000, 0.3);
        redOverlay.fillRect(0, 0, width, height);
        redOverlay.setDepth(350);

        // Pulse the red overlay
        this.tweens.add({
            targets: redOverlay,
            alpha: 0,
            duration: 200,
            yoyo: true,
            repeat: 7,
            onComplete: () => {
                redOverlay.destroy();
            }
        });

        // 3-second flashing warning text
        const warning = this.add.text(width / 2, height / 2, 'WARNING\nMegalodon approaching', {
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#ff0000',
            stroke: '#000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(400);

        // Flashing text effect
        this.tweens.add({
            targets: warning,
            alpha: 0.2,
            duration: 200,
            yoyo: true,
            repeat: 7,
            onComplete: () => {
                warning.destroy();
            }
        });

        // Spawn boss after 3 seconds
        this.time.delayedCall(3000, () => {
            this.boss = this.add.sprite(width + 100, height / 2, 'shark')
                .setDepth(80)
                .setScale(10)
                .setFlipX(true);

            // Play shark animation
            if (this.anims.exists('shark-swim')) {
                this.boss.play('shark-swim');
            }

            this.boss.health = 100;
            this.boss.maxHealth = 100;
            this.boss.hitRadius = 150;

            // Boss health bar
            this.bossHealthBar = this.add.graphics();
            this.bossHealthBar.setDepth(500);
            this.updateBossHealthBar();

            this.bossName = this.add.text(width / 2, 80, 'MEGALODON', {
                fontSize: '20px',
                fontStyle: 'bold',
                color: '#ff4444',
                stroke: '#000',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(500);

            this.tweens.add({
                targets: this.boss,
                x: width - 100,
                duration: 2000,
                ease: 'Power2'
            });
        });
    }

    spawnOctopusBoss() {
        if (this.secondBoss || this.secondBossActive) return;

        const { width, height } = this.cameras.main;
        this.secondBossActive = true;
        this.bossActive = true;

        // Red screen overlay for warning
        const redOverlay = this.add.graphics();
        redOverlay.fillStyle(0xff0000, 0.3);
        redOverlay.fillRect(0, 0, width, height);
        redOverlay.setDepth(350);

        // Pulse the red overlay
        this.tweens.add({
            targets: redOverlay,
            alpha: 0,
            duration: 200,
            yoyo: true,
            repeat: 7,
            onComplete: () => {
                redOverlay.destroy();
            }
        });

        // 3-second flashing warning text
        const warning = this.add.text(width / 2, height / 2, 'WARNING\nKraken approaching', {
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#ff0000',
            stroke: '#000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(400);

        // Flashing text effect
        this.tweens.add({
            targets: warning,
            alpha: 0.2,
            duration: 200,
            yoyo: true,
            repeat: 7,
            onComplete: () => {
                warning.destroy();
            }
        });

        // Spawn boss after 3 seconds
        this.time.delayedCall(3000, () => {
            this.secondBoss = this.add.sprite(width + 100, height / 2, 'octopus')
                .setDepth(80)
                .setScale(8)
                .setFlipX(true);

            if (this.anims.exists('octopus-idle')) {
                this.secondBoss.play('octopus-idle');
            }

            this.secondBoss.health = 120;
            this.secondBoss.maxHealth = 120;
            this.secondBoss.hitRadius = 100;

            // Boss health bar
            this.bossHealthBar = this.add.graphics();
            this.bossHealthBar.setDepth(500);
            this.updateSecondBossHealthBar();

            this.bossName = this.add.text(width / 2, 80, 'KRAKEN', {
                fontSize: '20px',
                fontStyle: 'bold',
                color: '#00ff88',
                stroke: '#000',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(500);

            // Enter from right
            this.tweens.add({
                targets: this.secondBoss,
                x: width - 80,
                duration: 2000,
                ease: 'Power2'
            });

            // Bobbing movement
            this.tweens.add({
                targets: this.secondBoss,
                y: height / 2 + 50,
                duration: 2500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    /**
     * Updates a boss health bar with the given boss entity and color
     * @param {Phaser.GameObjects.Sprite} boss - The boss sprite
     * @param {number} color - The health bar fill color
     */
    drawBossHealthBar(boss, color) {
        if (!this.bossHealthBar || !boss) return;
        const { width } = this.cameras.main;
        const pct = boss.health / boss.maxHealth;

        this.bossHealthBar.clear();
        this.bossHealthBar.fillStyle(0x333333, 0.8);
        this.bossHealthBar.fillRoundedRect(width / 2 - 150, 95, 300, 16, 4);
        this.bossHealthBar.fillStyle(color, 1);
        this.bossHealthBar.fillRoundedRect(width / 2 - 148, 97, 296 * pct, 12, 3);
    }

    updateSecondBossHealthBar() {
        this.drawBossHealthBar(this.secondBoss, 0x00ff88);
    }

    octopusShoot() {
        if (!this.secondBoss) return;

        // Shoot ink blobs in a spread pattern
        const angles = [-30, -15, 0, 15, 30];
        const speed = 5;

        angles.forEach(angle => {
            const rad = angle * Math.PI / 180;
            const proj = this.add.graphics();
            proj.fillStyle(0x006622, 0.7);
            proj.fillCircle(0, 0, 15);
            proj.fillStyle(0x00aa44, 0.9);
            proj.fillCircle(0, 0, 10);
            proj.setPosition(this.secondBoss.x - 60, this.secondBoss.y);
            proj.setDepth(70);
            proj.velocityX = -speed * Math.cos(rad);
            proj.velocityY = speed * Math.sin(rad);
            this.bossProjectiles.add(proj);
        });

        // Tentacle sweep attack when low health (50% of 120 HP)
        if (this.secondBoss.health < 60 && Math.random() < 0.3) {
            this.tentacleSweep();
        }
    }

    tentacleSweep() {
        if (!this.secondBoss) return;
        const { height } = this.cameras.main;

        // Create a sweeping tentacle hazard
        for (let i = 0; i < 5; i++) {
            this.time.delayedCall(i * 150, () => {
                if (!this.secondBoss) return;
                const proj = this.add.graphics();
                proj.fillStyle(0x228844, 0.8);
                proj.fillCircle(0, 0, 20);
                proj.setPosition(this.secondBoss.x - 50, this.secondBoss.y);
                proj.setDepth(70);
                proj.velocityX = -8;
                proj.velocityY = (i - 2) * 2;  // Spread vertically
                this.bossProjectiles.add(proj);
            });
        }
    }

    hitSecondBoss(harpoon) {
        if (!this.secondBoss) return;
        this.secondBoss.health--;
        if (harpoon.active) harpoon.destroy();
        this.updateSecondBossHealthBar();
        this.tweens.add({ targets: this.secondBoss, alpha: 0.5, duration: 50, yoyo: true });
        this.cameras.main.shake(50, 0.003);
        if (this.secondBoss.health <= 0) this.defeatSecondBoss();
    }

    defeatSecondBoss() {
        if (!this.secondBoss) return;
        const bx = this.secondBoss.x, by = this.secondBoss.y;
        this.secondBossActive = false;
        this.secondBossDefeated = true;
        this.bossActive = false;

        this.secondBoss.destroy();
        this.secondBoss = null;
        this.bossProjectiles.clear(true, true);
        if (this.bossHealthBar) { this.bossHealthBar.destroy(); this.bossHealthBar = null; }
        if (this.bossName) { this.bossName.destroy(); this.bossName = null; }

        this.cameras.main.shake(800, 0.03);
        this.score += 2000;
        this.scoreText.setText(`Score: ${this.score}`);

        // Big explosion
        for (let i = 0; i < 30; i++) {
            this.time.delayedCall(i * 40, () => {
                this.createExplosion(bx + Phaser.Math.Between(-60, 60), by + Phaser.Math.Between(-60, 60), 0.8);
            });
        }

        const victory = this.add.text(400, 300, 'KRAKEN DEFEATED!\n+2000\nYOU WIN!', {
            fontSize: '36px', fontStyle: 'bold', color: '#00ff88', stroke: '#000', strokeThickness: 4, align: 'center'
        }).setOrigin(0.5).setDepth(500);
        this.tweens.add({
            targets: victory,
            scale: 1.3,
            duration: 3000,
            onComplete: () => {
                victory.destroy();
                // Go to victory screen
                this.time.delayedCall(1000, () => {
                    this.scene.start('GameOverScene', { score: this.score, victory: true });
                });
            }
        });
    }

    updateBossHealthBar() {
        this.drawBossHealthBar(this.boss, 0xff4444);
    }

    /**
     * Main game loop - handles all per-frame updates including movement,
     * collision detection, and game state management
     * @param {number} time - Total elapsed time in ms
     * @param {number} delta - Time since last frame in ms
     */
    update(time, delta) {
        // Skip updates when paused
        if (this.isPaused) return;

        this.gameTime += delta;

        // Scroll backgrounds (parallax)
        this.bgFar1.tilePositionX += CONFIG.parallax.far * this.gameSpeed;
        this.bgMid1.tilePositionX += CONFIG.parallax.mid * this.gameSpeed;
        this.bgSand1.tilePositionX += CONFIG.parallax.sand * this.gameSpeed;

        // Player movement
        this.updatePlayer();

        // Fire - keyboard (spacebar), fire button, or auto-fire when touching on mobile
        const shouldFire = this.wasd.fire.isDown || this.fireButtonPressed || this.touchTarget;
        if (shouldFire && time > this.lastFired + this.fireRate) {
            if (this.fireballActive) {
                this.shootFireball();
            } else {
                this.shootBullet();
            }
            this.lastFired = time;
        }

        // Update harpoons
        this.bullets.getChildren().forEach(h => {
            if (!h.active) return;
            h.x += h.velocity;
            if (h.x > 850) { h.destroy(); return; }

            // Hit enemies
            this.enemies.getChildren().forEach(enemy => {
                if (!enemy.active || !h.active) return;
                const dist = Phaser.Math.Distance.Between(h.x, h.y, enemy.x, enemy.y);
                if (dist < h.hitRadius + enemy.hitRadius) {
                    this.hitEnemy(enemy, h);
                }
            });

            // Hit boss
            if (this.boss && this.boss.active && h.active) {
                const dist = Phaser.Math.Distance.Between(h.x, h.y, this.boss.x, this.boss.y);
                if (dist < h.hitRadius + this.boss.hitRadius) {
                    this.hitBoss(h);
                }
            }

            // Hit second boss (octopus)
            if (this.secondBoss && this.secondBoss.active && h.active) {
                const dist = Phaser.Math.Distance.Between(h.x, h.y, this.secondBoss.x, this.secondBoss.y);
                if (dist < h.hitRadius + this.secondBoss.hitRadius) {
                    this.hitSecondBoss(h);
                }
            }
        });

        // Update fireballs (piercing projectiles)
        this.fireballs.getChildren().forEach(fb => {
            if (!fb.active) return;
            fb.x += fb.velocity;
            if (fb.x > 850) { fb.destroy(); return; }

            // Hit enemies (piercing - can hit multiple)
            this.enemies.getChildren().forEach(enemy => {
                if (!enemy.active) return;
                if (fb.hitEnemies.has(enemy)) return;  // Already hit this enemy
                const dist = Phaser.Math.Distance.Between(fb.x, fb.y, enemy.x, enemy.y);
                if (dist < fb.hitRadius + enemy.hitRadius) {
                    fb.hitEnemies.add(enemy);
                    this.hitEnemyWithFireball(enemy);
                }
            });

            // Hit boss
            if (this.boss && this.boss.active) {
                const dist = Phaser.Math.Distance.Between(fb.x, fb.y, this.boss.x, this.boss.y);
                if (dist < fb.hitRadius + this.boss.hitRadius) {
                    this.hitBoss(fb);
                    // Fireball destroys on boss hit
                }
            }

            // Hit second boss
            if (this.secondBoss && this.secondBoss.active) {
                const dist = Phaser.Math.Distance.Between(fb.x, fb.y, this.secondBoss.x, this.secondBoss.y);
                if (dist < fb.hitRadius + this.secondBoss.hitRadius) {
                    this.hitSecondBoss(fb);
                }
            }
        });

        // Update collectibles
        this.collectibles.getChildren().forEach(c => {
            c.x -= 2 * this.gameSpeed;
            const dist = Phaser.Math.Distance.Between(c.x, c.y, this.player.x, this.player.y);
            if (dist < 30) { this.collectItem(c); }
            if (c.x < -50) { c.destroy(); }
        });

        // Update enemies
        this.enemies.getChildren().forEach(e => {
            e.x -= e.speed * this.gameSpeed;

            // Squid zigzag movement
            if (e.isZigzag) {
                e.zigzagTimer += delta;
                if (e.zigzagTimer > 200) {
                    e.zigzagDir *= -1;
                    e.zigzagTimer = 0;
                }
                e.y += e.zigzagDir * 3;
            }

            // Sawshark wave movement
            if (e.isWave) {
                e.waveOffset += 0.05;
                e.y = e.startY + Math.sin(e.waveOffset) * 80;
            }

            const dist = Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y);
            if (dist < 25 + e.hitRadius && !e.hit) { this.playerHit(e); }
            if (e.x < -60) { e.destroy(); }
        });

        // Update mines
        this.mines.getChildren().forEach(mine => {
            mine.x -= mine.speed * this.gameSpeed;

            // Check collision with player
            const playerDist = Phaser.Math.Distance.Between(mine.x, mine.y, this.player.x, this.player.y);
            if (playerDist < 30 + mine.hitRadius) {
                this.createExplosion(mine.x, mine.y, 0.8);
                this.playerHit({ hit: false });
                mine.destroy();
                return;
            }

            // Check collision with bullets
            this.bullets.getChildren().forEach(bullet => {
                const dist = Phaser.Math.Distance.Between(mine.x, mine.y, bullet.x, bullet.y);
                if (dist < mine.hitRadius + bullet.hitRadius) {
                    this.createExplosion(mine.x, mine.y, 0.8);
                    const points = this.addComboKill(CONFIG.mines.points);
                    this.score += points;
                    this.scoreText.setText(`Score: ${this.score}`);
                    bullet.destroy();
                    mine.destroy();
                }
            });

            // Check collision with fireballs (fireballs pierce through mines too)
            this.fireballs.getChildren().forEach(fb => {
                if (fb.hitEnemies.has(mine)) return;
                const dist = Phaser.Math.Distance.Between(mine.x, mine.y, fb.x, fb.y);
                if (dist < mine.hitRadius + fb.hitRadius) {
                    fb.hitEnemies.add(mine);
                    this.createExplosion(mine.x, mine.y, 0.8);
                    const points = this.addComboKill(CONFIG.mines.points);
                    this.score += points;
                    this.scoreText.setText(`Score: ${this.score}`);
                    mine.destroy();
                }
            });

            if (mine.x < -50) { mine.destroy(); }
        });

        // Update powerups
        this.powerups.getChildren().forEach(p => {
            p.x -= 2 * this.gameSpeed;
            if (p.label) p.label.x = p.x;
            const dist = Phaser.Math.Distance.Between(p.x, p.y, this.player.x, this.player.y);
            if (dist < 30) { this.collectPowerup(p); }
            if (p.x < -50) { if (p.label) p.label.destroy(); p.destroy(); }
        });

        // Update boss
        if (this.boss && this.bossActive) {
            // Chase player Y
            const dy = this.player.y - this.boss.y;
            this.boss.y += dy * 0.02;
            this.boss.y = Phaser.Math.Clamp(this.boss.y, 80, 520);

            // Boss shoots
            if (time > this.lastBossShot + 1500) {
                this.bossShoot();
                this.lastBossShot = time;
            }

            // Boss collision
            const dist = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
            if (dist < 30 + this.boss.hitRadius && !this.boss.justHit) {
                this.playerHit(this.boss);
                this.boss.justHit = true;
                this.time.delayedCall(1000, () => { if (this.boss) this.boss.justHit = false; });
            }
        }

        // Second boss (Octopus) behavior
        if (this.secondBoss && this.secondBoss.active) {
            // Shooting
            if (time > this.lastBossShot + 1200) {
                this.octopusShoot();
                this.lastBossShot = time;
            }

            // Boss collision
            const dist = Phaser.Math.Distance.Between(this.secondBoss.x, this.secondBoss.y, this.player.x, this.player.y);
            if (dist < 30 + this.secondBoss.hitRadius && !this.secondBoss.justHit) {
                this.playerHit(this.secondBoss);
                this.secondBoss.justHit = true;
                this.time.delayedCall(1000, () => { if (this.secondBoss) this.secondBoss.justHit = false; });
            }
        }

        // Boss projectiles
        this.bossProjectiles.getChildren().forEach(p => {
            p.x += p.velocityX || -5;
            p.y += p.velocityY || 0;
            const dist = Phaser.Math.Distance.Between(p.x, p.y, this.player.x, this.player.y);
            if (dist < 25) { this.playerHit({ hit: false }); p.destroy(); }
            if (p.x < -30 || p.y < -30 || p.y > 630) { p.destroy(); }
        });

        // Shield visual
        if (this.shieldActive) {
            this.shieldGraphics.clear();
            this.shieldGraphics.lineStyle(3, 0x6666ff, 0.6);
            this.shieldGraphics.strokeCircle(this.player.x, this.player.y, 30);
            this.shieldGraphics.setVisible(true);
        }

        // Update combo timer
        this.updateComboTimer(delta);

        // Update companion
        if (this.companionActive && this.companion) {
            // Follow player with offset
            this.companion.x = this.player.x - 30;
            this.companion.y = this.player.y + CONFIG.companion.offsetY;

            // Auto-shoot bubbles
            if (time > this.lastCompanionShot + CONFIG.companion.shootInterval) {
                this.shootBubble();
                this.lastCompanionShot = time;
            }
        }

        // Update bubbles
        this.bubbles.getChildren().forEach(bubble => {
            if (!bubble.active) return;
            bubble.x += bubble.velocity;
            if (bubble.x > 850) { bubble.destroy(); return; }

            // Hit enemies
            this.enemies.getChildren().forEach(enemy => {
                if (!enemy.active || !bubble.active) return;
                const dist = Phaser.Math.Distance.Between(bubble.x, bubble.y, enemy.x, enemy.y);
                if (dist < bubble.hitRadius + enemy.hitRadius) {
                    this.hitEnemy(enemy, bubble);
                }
            });

            // Hit boss
            if (this.boss && this.boss.active && bubble.active) {
                const dist = Phaser.Math.Distance.Between(bubble.x, bubble.y, this.boss.x, this.boss.y);
                if (dist < bubble.hitRadius + this.boss.hitRadius) {
                    this.hitBoss(bubble);
                }
            }

            // Hit second boss
            if (this.secondBoss && this.secondBoss.active && bubble.active) {
                const dist = Phaser.Math.Distance.Between(bubble.x, bubble.y, this.secondBoss.x, this.secondBoss.y);
                if (dist < bubble.hitRadius + this.secondBoss.hitRadius) {
                    this.hitSecondBoss(bubble);
                }
            }
        });
    }

    updatePlayer() {
        const speed = this.player.speed;
        const { height, width } = this.cameras.main;

        // Virtual joystick controls (mobile) - with dead zone
        const deadZone = 0.15;
        const hasJoystickInput = Math.abs(this.joystickInput.x) > deadZone || Math.abs(this.joystickInput.y) > deadZone;
        if (this.isMobile && hasJoystickInput) {
            // Apply joystick input directly
            this.player.x += this.joystickInput.x * speed;
            this.player.y += this.joystickInput.y * speed;
        }
        // Legacy touch controls - diver moves toward finger (for devices without visible joystick)
        else if (this.touchTarget) {
            const dx = this.touchTarget.x - this.player.x;
            const dy = this.touchTarget.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 10) {
                // Normalize and apply speed
                const nx = dx / dist;
                const ny = dy / dist;
                this.player.x += nx * speed;
                this.player.y += ny * speed;
            }
        } else {
            // Keyboard controls
            let mx = 0, my = 0;
            if (this.cursors.left.isDown || this.wasd.left.isDown) mx = -1;
            if (this.cursors.right.isDown || this.wasd.right.isDown) mx = 1;
            if (this.cursors.up.isDown || this.wasd.up.isDown) my = -1;
            if (this.cursors.down.isDown || this.wasd.down.isDown) my = 1;

            if (mx !== 0 && my !== 0) { mx *= 0.707; my *= 0.707; }

            this.player.x += mx * speed;
            this.player.y += my * speed;
        }

        // Clamp player position
        this.player.x = Phaser.Math.Clamp(this.player.x, 40, width - 40);
        this.player.y = Phaser.Math.Clamp(this.player.y, 40, height - 40);
    }

    bossShoot() {
        if (!this.boss) return;

        // Always fire 3 projectiles that fan out
        const angles = [-15, 0, 15];  // Degrees
        const speed = 6;

        angles.forEach(angle => {
            const rad = angle * Math.PI / 180;
            const proj = this.add.graphics();
            proj.fillStyle(0x880000, 0.5);
            proj.fillCircle(0, 0, 12);
            proj.fillStyle(0xff0000, 0.8);
            proj.fillCircle(0, 0, 7);
            proj.setPosition(this.boss.x - 80, this.boss.y);
            proj.setDepth(70);
            proj.velocityX = -speed * Math.cos(rad);
            proj.velocityY = speed * Math.sin(rad);
            this.bossProjectiles.add(proj);
        });

        // Extra spread burst when low health
        if (this.boss.health < 50 && Math.random() < 0.4) {
            const extraAngles = [-30, -15, 0, 15, 30];
            extraAngles.forEach(angle => {
                const rad = angle * Math.PI / 180;
                const p2 = this.add.graphics();
                p2.fillStyle(0x660000, 0.5);
                p2.fillCircle(0, 0, 8);
                p2.fillStyle(0xff6600, 0.7);
                p2.fillCircle(0, 0, 5);
                p2.setPosition(this.boss.x - 60, this.boss.y);
                p2.setDepth(70);
                p2.velocityX = -5 * Math.cos(rad);
                p2.velocityY = 5 * Math.sin(rad);
                this.bossProjectiles.add(p2);
            });
        }
    }

    hitEnemy(enemy, harpoon) {
        enemy.health--;
        if (harpoon.active) harpoon.destroy();

        this.tweens.add({ targets: enemy, alpha: 0.3, duration: 50, yoyo: true });

        if (enemy.health <= 0) {
            this.enemiesKilled++;

            // Apply combo multiplier
            const points = this.addComboKill(enemy.points);
            this.score += points;
            this.scoreText.setText(`Score: ${this.score}`);
            this.createExplosion(enemy.x, enemy.y);

            // Show points with combo indicator
            const comboText = this.comboMultiplier > 1 ? ` x${this.comboMultiplier}` : '';
            const popup = this.add.text(enemy.x, enemy.y, `+${points}${comboText}`, {
                fontSize: '20px', color: this.comboMultiplier > 1 ? '#00ffff' : '#ffff00', stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5).setDepth(200);
            this.tweens.add({ targets: popup, y: enemy.y - 30, alpha: 0, duration: 500, onComplete: () => popup.destroy() });

            enemy.destroy();

            // Trigger mine wave before boss (at 20 kills, boss spawns at 25)
            if (this.enemiesKilled >= 20 && !this.mineWaveTriggered) {
                const shouldTrigger = (this.currentLevel === 1 && !this.bossDefeated) ||
                                     (this.currentLevel === 2 && !this.secondBossDefeated);
                if (shouldTrigger) {
                    this.mineWaveTriggered = true;
                    this.spawnMineWave();
                }
            }

            // Spawn appropriate boss based on level
            if (this.enemiesKilled >= CONFIG.bosses.megaShark.spawnKillCount && !this.bossActive) {
                if (this.currentLevel === 1 && !this.bossDefeated) {
                    this.spawnBoss();
                } else if (this.currentLevel === 2 && !this.secondBossDefeated) {
                    this.spawnOctopusBoss();
                }
            }
        }
    }

    hitEnemyWithFireball(enemy) {
        // Fireball always kills in one hit (doesn't check health)
        this.enemiesKilled++;

        // Apply combo multiplier
        const points = this.addComboKill(enemy.points);
        this.score += points;
        this.scoreText.setText(`Score: ${this.score}`);
        this.createExplosion(enemy.x, enemy.y);

        // Show points with combo indicator
        const comboText = this.comboMultiplier > 1 ? ` x${this.comboMultiplier}` : '';
        const popup = this.add.text(enemy.x, enemy.y, `+${points}${comboText}`, {
            fontSize: '20px', color: this.comboMultiplier > 1 ? '#00ffff' : '#ff6600', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(200);
        this.tweens.add({ targets: popup, y: enemy.y - 30, alpha: 0, duration: 500, onComplete: () => popup.destroy() });

        enemy.destroy();

        // Trigger mine wave before boss (at 20 kills, boss spawns at 25)
        if (this.enemiesKilled >= 20 && !this.mineWaveTriggered) {
            const shouldTrigger = (this.currentLevel === 1 && !this.bossDefeated) ||
                                 (this.currentLevel === 2 && !this.secondBossDefeated);
            if (shouldTrigger) {
                this.mineWaveTriggered = true;
                this.spawnMineWave();
            }
        }

        // Spawn appropriate boss based on level
        if (this.enemiesKilled >= CONFIG.bosses.megaShark.spawnKillCount && !this.bossActive) {
            if (this.currentLevel === 1 && !this.bossDefeated) {
                this.spawnBoss();
            } else if (this.currentLevel === 2 && !this.secondBossDefeated) {
                this.spawnOctopusBoss();
            }
        }
    }

    hitBoss(harpoon) {
        if (!this.boss) return;
        this.boss.health--;
        if (harpoon.active) harpoon.destroy();
        this.updateBossHealthBar();
        this.tweens.add({ targets: this.boss, alpha: 0.5, duration: 50, yoyo: true });
        this.cameras.main.shake(50, 0.003);
        if (this.boss.health <= 0) this.defeatBoss();
    }

    defeatBoss() {
        if (!this.boss) return;
        const bx = this.boss.x, by = this.boss.y;
        this.bossActive = false;
        this.bossDefeated = true;

        this.boss.destroy();
        this.boss = null;
        this.bossProjectiles.clear(true, true);
        if (this.bossHealthBar) { this.bossHealthBar.destroy(); this.bossHealthBar = null; }
        if (this.bossName) { this.bossName.destroy(); this.bossName = null; }

        this.cameras.main.shake(500, 0.02);
        this.score += 1000;
        this.scoreText.setText(`Score: ${this.score}`);

        // Big explosion
        for (let i = 0; i < 20; i++) {
            this.time.delayedCall(i * 50, () => {
                this.createExplosion(bx + Phaser.Math.Between(-40, 40), by + Phaser.Math.Between(-40, 40), 0.7);
            });
        }

        const victory = this.add.text(400, 300, 'MEGALODON DEFEATED!\n+1000', {
            fontSize: '36px', fontStyle: 'bold', color: '#ffff00', stroke: '#000', strokeThickness: 4, align: 'center'
        }).setOrigin(0.5).setDepth(500);
        this.tweens.add({ targets: victory, scale: 1.3, alpha: 0, duration: 2000, onComplete: () => victory.destroy() });

        this.enemiesKilled = 0;
        this.mineWaveTriggered = false;  // Reset for level 2

        // Transition to Level 2
        if (!this.secondBossDefeated) {
            this.time.delayedCall(2500, () => {
                this.currentLevel = 2;
                this.showLevelIndicator(2);

                // Spawn octopus boss after level 2 enemies
                // Will trigger when enemiesKilled reaches threshold again
            });
        }
    }

    createExplosion(x, y, scale = 0.5) {
        // Play explosion sound
        if (this.sfxExplosion) this.sfxExplosion.play();

        // Use sprite explosion if available
        if (this.textures.exists('explosion')) {
            const explosion = this.add.sprite(x, y, 'explosion')
                .setDepth(200)
                .setScale(scale);
            explosion.play('explosion-anim');
            explosion.on('animationcomplete', () => {
                explosion.destroy();
            });
        } else {
            // Fallback to particle explosion
            const colors = [0xff6600, 0xff9900, 0xffcc00, 0xffff00];
            for (let i = 0; i < 10; i++) {
                const p = this.add.graphics();
                p.fillStyle(colors[i % 4], 1);
                p.fillCircle(0, 0, Phaser.Math.Between(3, 8));
                p.setPosition(x, y);
                p.setDepth(200);
                const angle = (i / 10) * Math.PI * 2;
                const speed = Phaser.Math.Between(40, 80);
                this.tweens.add({
                    targets: p,
                    x: x + Math.cos(angle) * speed,
                    y: y + Math.sin(angle) * speed,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => p.destroy()
                });
            }
        }
    }

    collectItem(item) {
        if (this.sfxPickup) this.sfxPickup.play();

        this.score += item.value;
        this.scoreText.setText(`Score: ${this.score}`);

        // Sparkles
        for (let i = 0; i < 6; i++) {
            const s = this.add.graphics();
            s.fillStyle(0xffffff, 1);
            s.fillCircle(0, 0, 2);
            s.setPosition(item.x, item.y);
            s.setDepth(150);
            const angle = (i / 6) * Math.PI * 2;
            this.tweens.add({
                targets: s,
                x: item.x + Math.cos(angle) * 25,
                y: item.y + Math.sin(angle) * 25,
                alpha: 0,
                duration: 250,
                onComplete: () => s.destroy()
            });
        }
        item.destroy();
    }

    collectPowerup(powerup) {
        if (this.sfxPickup) this.sfxPickup.play();

        const type = powerup.powerupType;
        let msg = '';

        switch (type) {
            case 'firepower':
                this.firepower = 3;
                msg = 'TRIPLE SHOT!';
                this.time.delayedCall(CONFIG.powerups.firepower.duration, () => { this.firepower = 1; });
                break;
            case 'shield':
                this.shieldActive = true;
                msg = 'SHIELD!';
                this.time.delayedCall(CONFIG.powerups.shield.duration, () => { this.shieldActive = false; this.shieldGraphics.setVisible(false); });
                break;
            case 'health':
                this.health = Math.min(this.health + 1, CONFIG.player.maxHealth);
                this.updateHealthBar();
                msg = 'HEALTH UP!';
                break;
            case 'fireball':
                this.fireballActive = true;
                msg = 'FIREBALL!';
                this.time.delayedCall(CONFIG.powerups.fireball.duration, () => { this.fireballActive = false; });
                break;
            case 'companion':
                this.activateCompanion();
                msg = 'COMPANION!';
                break;
        }

        const txt = this.add.text(400, 150, msg, {
            fontSize: '28px', fontStyle: 'bold', color: '#00ff00', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(400);
        this.tweens.add({ targets: txt, y: 120, alpha: 0, duration: 1500, onComplete: () => txt.destroy() });

        if (powerup.label) powerup.label.destroy();
        powerup.destroy();
    }

    playerHit(enemy) {
        enemy.hit = true;

        // God mode - no damage
        if (this.godMode) {
            this.cameras.main.shake(50, 0.005);
            return;
        }

        if (this.shieldActive) {
            this.shieldActive = false;
            this.shieldGraphics.setVisible(false);
            this.cameras.main.shake(100, 0.005);
            if (this.sfxHit) this.sfxHit.play();
            return;
        }

        if (this.sfxHurt) this.sfxHurt.play();

        this.health--;
        this.updateHealthBar();

        // Stop any existing player alpha tweens to prevent stuck transparency
        this.tweens.killTweensOf(this.player);
        this.player.setAlpha(1);  // Reset alpha before starting new tween

        this.tweens.add({
            targets: this.player,
            alpha: 0.2,
            duration: 80,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                // Ensure alpha is fully restored
                if (this.player) this.player.setAlpha(1);
            }
        });
        this.cameras.main.shake(200, 0.015);

        if (this.health <= 0) this.gameOver();
    }

    /**
     * Activates the companion fish powerup
     */
    activateCompanion() {
        // If already active, just refresh the timer
        if (this.companionActive && this.companion) {
            // Cancel existing timer and start new one
            return;
        }

        this.companionActive = true;

        // Create companion sprite
        this.companion = this.add.sprite(
            this.player.x - 30,
            this.player.y + CONFIG.companion.offsetY,
            'companion'
        )
            .setDepth(CONFIG.player.depth - 1)
            .setScale(CONFIG.companion.scale);

        if (this.anims.exists('companion-swim')) {
            this.companion.play('companion-swim');
        }

        // Set timer to deactivate
        this.time.delayedCall(CONFIG.powerups.companion.duration, () => {
            this.deactivateCompanion();
        });
    }

    /**
     * Deactivates the companion
     */
    deactivateCompanion() {
        this.companionActive = false;
        if (this.companion) {
            // Fade out effect
            this.tweens.add({
                targets: this.companion,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    if (this.companion) {
                        this.companion.destroy();
                        this.companion = null;
                    }
                }
            });
        }
    }

    /**
     * Companion shoots a bubble projectile
     */
    shootBubble() {
        if (!this.companion) return;

        const bubble = this.add.sprite(
            this.companion.x + 30,
            this.companion.y,
            'bubble'
        )
            .setDepth(CONFIG.bullets.depth)
            .setScale(2);

        if (this.anims.exists('bubble-pop')) {
            bubble.play('bubble-pop');
        }

        bubble.velocity = CONFIG.companion.bubbleSpeed;
        bubble.hitRadius = CONFIG.companion.bubbleHitRadius;
        this.bubbles.add(bubble);
    }

    gameOver() {
        // Stop background music
        if (this.bgMusic) this.bgMusic.stop();

        const hs = localStorage.getItem('dragonHighScore') || 0;
        if (this.score > hs) localStorage.setItem('dragonHighScore', this.score);

        this.cameras.main.fadeOut(1000);
        this.time.delayedCall(1000, () => {
            this.scene.start('GameOverScene', { score: this.score });
        });
    }
}
